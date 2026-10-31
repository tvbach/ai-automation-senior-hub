/**
 * lib/competency.ts
 * ----------------------------------------------------------------------------
 * Năng lực theo kỹ năng — tính hoàn toàn từ dữ liệu tiến độ thật (pure).
 *
 *   score = 70% × điểm quiz cao nhất trung bình trên các bài của kỹ năng
 *         + 30% × tỉ lệ bài đã đánh dấu hoàn thành
 *
 * Bài chưa làm quiz tính 0 điểm quiz: "đã đọc" không đồng nghĩa "đã hiểu".
 * Lab có bằng chứng sẽ được cộng vào công thức ở Giai đoạn 4.
 *
 * Skill Assessment không cộng vào điểm (đó là tự chẩn đoán, không phải bằng
 * chứng), nhưng kỹ năng đạt assessment cao được gợi ý "làm quiz kiểm tra"
 * thay vì học lại bài từ đầu — người đã vững có thể đi nhanh.
 * ----------------------------------------------------------------------------
 */
import { allTopics, skills as skillCatalog, type Module, type Phase, type Skill, type Topic } from "@/data/content";
import { ASSESSMENT_STRONG } from "@/lib/assessment";
import { QUIZ_PASS_SCORE } from "@/lib/quiz";
import { topicStatus, type ProgressState } from "@/lib/progress";

export const QUIZ_WEIGHT = 0.7;
export const COMPLETION_WEIGHT = 0.3;
/** Từ ngưỡng này trở lên: "Nắm chắc kiến thức" */
export const SOLID_SCORE = 70;
/** Dưới ngưỡng này: "Cần ôn" */
export const WEAK_SCORE = 40;

export type CompetencyLevel = "no-content" | "not-started" | "weak" | "developing" | "solid";

export const LEVEL_LABEL: Record<CompetencyLevel, string> = {
  "no-content": "Chưa có bài học",
  "not-started": "Chưa bắt đầu",
  weak: "Cần ôn",
  developing: "Đang tiến bộ",
  solid: "Nắm chắc kiến thức",
};

export type StudyActionKind = "retake" | "quiz" | "learn";

export const ACTION_LABEL: Record<StudyActionKind, string> = {
  retake: "Làm lại quiz",
  quiz: "Làm quiz kiểm tra",
  learn: "Học bài",
};

export interface StudyAction {
  kind: StudyActionKind;
  skillId: string;
  topicId: string;
  topicTitle: string;
  moduleTitle: string;
  href: string;
  /** Điểm quiz cao nhất hiện tại (nếu đã làm) */
  best?: number;
}

export interface SkillCompetency {
  skill: Skill;
  score: number;
  level: CompetencyLevel;
  topicCount: number;
  /** Số bài đã làm quiz ít nhất một lần */
  quizzed: number;
  /** Điểm Skill Assessment gần nhất của kỹ năng (nếu đã làm) */
  assessed?: number;
  /** Số bài có điểm quiz cao nhất ≥ ngưỡng đạt */
  passed: number;
  done: number;
  /** Việc nên làm tiếp cho kỹ năng này, theo thứ tự ưu tiên */
  actions: StudyAction[];
}

export interface CatalogEntry {
  topic: Topic;
  module: Pick<Module, "id" | "title" | "skills">;
  phase: Pick<Phase, "id">;
}

const ACTION_ORDER: Record<StudyActionKind, number> = { retake: 0, quiz: 1, learn: 2 };

function levelFor(score: number, hasActivity: boolean, topicCount: number): CompetencyLevel {
  if (topicCount === 0) return "no-content";
  if (!hasActivity) return "not-started";
  if (score >= SOLID_SCORE) return "solid";
  if (score < WEAK_SCORE) return "weak";
  return "developing";
}

function actionFor(state: ProgressState, skillId: string, entry: CatalogEntry, testOut: boolean): StudyAction | null {
  const { topic, module, phase } = entry;
  const quiz = state.quizzes[topic.id];
  const status = topicStatus(state, topic.id);
  let kind: StudyActionKind | null = null;
  if (quiz && quiz.best < QUIZ_PASS_SCORE) kind = "retake";
  // Đã đọc bài, hoặc assessment cho thấy đã vững → kiểm tra bằng quiz luôn
  else if (!quiz && (status !== "todo" || testOut)) kind = "quiz";
  else if (!quiz) kind = "learn";
  if (!kind) return null;
  return {
    kind,
    skillId,
    topicId: topic.id,
    topicTitle: topic.title,
    moduleTitle: module.title,
    href: `/roadmap/${phase.id}/${module.id}#${topic.id}`,
    best: quiz?.best,
  };
}

/** Năng lực của từng kỹ năng, theo thứ tự trong danh mục */
export function computeCompetency(
  state: ProgressState,
  catalog: readonly CatalogEntry[] = allTopics,
  skillList: readonly Skill[] = skillCatalog,
): SkillCompetency[] {
  return skillList.map((skill) => {
    const seen = new Set<string>();
    const entries = catalog.filter((e) => {
      if (!(e.module.skills as readonly string[]).includes(skill.id) || seen.has(e.topic.id)) return false;
      seen.add(e.topic.id);
      return true;
    });

    let quizSum = 0;
    let quizzed = 0;
    let passed = 0;
    let done = 0;
    let started = 0;
    for (const { topic } of entries) {
      const quiz = state.quizzes[topic.id];
      const status = topicStatus(state, topic.id);
      if (quiz) {
        quizzed++;
        quizSum += quiz.best;
        if (quiz.best >= QUIZ_PASS_SCORE) passed++;
      }
      if (status === "done") done++;
      if (status !== "todo") started++;
    }

    const n = entries.length;
    const assessed = state.assessment?.scores[skill.id];
    const score = n ? Math.round(QUIZ_WEIGHT * (quizSum / n) + COMPLETION_WEIGHT * (done / n) * 100) : 0;
    const actions = entries
      .map((e) => actionFor(state, skill.id, e, (assessed ?? -1) >= ASSESSMENT_STRONG))
      .filter((a): a is StudyAction => a !== null)
      // Ổn định: cùng loại thì giữ thứ tự lộ trình
      .sort((a, b) => ACTION_ORDER[a.kind] - ACTION_ORDER[b.kind]);

    return {
      skill,
      score,
      level: levelFor(score, quizzed + started > 0, n),
      topicCount: n,
      quizzed,
      passed,
      done,
      actions,
      ...(assessed !== undefined ? { assessed } : {}),
    };
  });
}

/**
 * Gợi ý ưu tiên toàn cục: lấy lần lượt việc đầu tiên của các kỹ năng yếu nhất
 * (bỏ qua kỹ năng chưa có bài học và kỹ năng đã nắm chắc), không trùng bài.
 * Kỹ năng đã có hoạt động được ưu tiên trước kỹ năng chưa bắt đầu.
 */
export function prioritizedActions(competencies: readonly SkillCompetency[], limit = 3): StudyAction[] {
  const candidates = competencies
    .filter((c) => c.level !== "no-content" && c.level !== "solid" && c.actions.length > 0)
    .sort((a, b) => {
      const aStarted = a.level === "not-started" ? 1 : 0;
      const bStarted = b.level === "not-started" ? 1 : 0;
      return aStarted - bStarted || a.score - b.score;
    });

  const picked: StudyAction[] = [];
  const usedTopics = new Set<string>();
  const cursor = new Map<string, number>();
  // Vòng tròn qua các kỹ năng để gợi ý đa dạng thay vì dồn vào một kỹ năng
  while (picked.length < limit) {
    let progressed = false;
    for (const c of candidates) {
      if (picked.length >= limit) break;
      let i = cursor.get(c.skill.id) ?? 0;
      while (i < c.actions.length && usedTopics.has(c.actions[i].topicId)) i++;
      cursor.set(c.skill.id, i + 1);
      const action = c.actions[i];
      if (!action) continue;
      picked.push(action);
      usedTopics.add(action.topicId);
      progressed = true;
    }
    if (!progressed) break;
  }
  return picked;
}
