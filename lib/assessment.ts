/**
 * lib/assessment.ts — chấm Skill Assessment và gợi ý cách học theo phase (pure).
 */
import type { Phase, Skill } from "@/data/content";
import type { AssessmentQuestion } from "@/data/assessment";
import { scoreQuiz, type QuizQuestionResult } from "@/lib/quiz";

/** Kỹ năng đạt từ ngưỡng này: gợi ý "làm quiz để kiểm tra" thay vì học lại từ đầu */
export const ASSESSMENT_STRONG = 80;
/** Dưới ngưỡng này: nên học kỹ */
export const ASSESSMENT_WEAK = 50;

export interface AssessmentScore {
  correct: number;
  total: number;
  /** 0–100 theo từng SkillId */
  bySkill: Record<string, number>;
  results: QuizQuestionResult[];
}

export function scoreAssessment(
  questions: readonly AssessmentQuestion[],
  answers: Record<string, string | undefined>,
): AssessmentScore {
  const overall = scoreQuiz([...questions], answers);
  const tally = new Map<string, { correct: number; total: number }>();
  questions.forEach((q, i) => {
    const t = tally.get(q.skill) ?? { correct: 0, total: 0 };
    t.total++;
    if (overall.results[i].correct) t.correct++;
    tally.set(q.skill, t);
  });
  const bySkill: Record<string, number> = {};
  for (const [skill, t] of tally) bySkill[skill] = Math.round((t.correct / t.total) * 100);
  return { correct: overall.correct, total: overall.total, bySkill, results: overall.results };
}

export type PhaseAdvice = "skim" | "normal" | "study";

export const PHASE_ADVICE_LABEL: Record<PhaseAdvice, string> = {
  skim: "Có thể học lướt",
  normal: "Học theo thứ tự",
  study: "Nên học kỹ",
};

export interface PhaseRecommendation {
  phase: Pick<Phase, "id" | "title" | "order">;
  /** Điểm trung bình của các kỹ năng phase rèn luyện (đã được đánh giá) */
  score: number;
  advice: PhaseAdvice;
  skills: { id: string; title: string; score: number }[];
}

/** Gợi ý cho từng phase dựa trên điểm assessment của các kỹ năng phase đó rèn luyện */
export function recommendPhases(
  scores: Record<string, number>,
  phases: readonly Pick<Phase, "id" | "title" | "order" | "modules">[],
  skillCatalog: readonly Skill[],
): PhaseRecommendation[] {
  const titleOf = new Map(skillCatalog.map((s) => [s.id, s.title]));
  return phases.map((phase) => {
    const ids = [...new Set(phase.modules.flatMap((m) => m.skills as readonly string[]))].filter((id) => id in scores);
    const skills = ids.map((id) => ({ id, title: titleOf.get(id) ?? id, score: scores[id] }));
    const score = skills.length ? Math.round(skills.reduce((s, x) => s + x.score, 0) / skills.length) : 0;
    const advice: PhaseAdvice = score >= ASSESSMENT_STRONG ? "skim" : score < ASSESSMENT_WEAK ? "study" : "normal";
    return { phase: { id: phase.id, title: phase.title, order: phase.order }, score, advice, skills };
  });
}
