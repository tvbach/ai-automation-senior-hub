/**
 * Kiểm tra toàn vẹn nội dung — chặn những lỗi dữ liệu mà typecheck không bắt được:
 * id trùng, id sai định dạng (bị sanitizeProgress loại bỏ → mất tiến độ), bài học
 * mồ côi, quiz có đáp án không tồn tại, tham chiếu skill/topic không hợp lệ.
 */
import { describe, expect, it } from "vitest";
import { allTopics, interviewQuestions, phases, skills } from "@/data/content";
import { allLessons, getLesson } from "@/data/lessons";
import { labs } from "@/data/labs";
import { quizzesByTopic } from "@/data/quizzes";
import { assessmentQuestions } from "@/data/assessment";
import { moduleMinutes, phaseEstimatedHours, phaseSkills } from "@/lib/curriculum";
import { PROGRESS_ID_RE } from "@/lib/progress";

/**
 * Topic id đã phát hành = khoá tiến độ của người học. Danh sách này chỉ được THÊM.
 * Nếu test fail vì thiếu id: đừng đổi tên topic — hãy giữ id cũ (có thể đổi title).
 */
const SHIPPED_TOPIC_IDS = [
  "pyramid-models", "risk-based", "shift-left", "suite-slo",
  "fixtures", "object-patterns", "locators", "auth-state", "network-mocking",
  "data-factory", "worker-isolation", "cleanup",
  "ct-vs-vitest", "rsc-server-actions", "contract-testing",
  "structured-output", "context-engineering", "validation-loop", "gen-evals",
  "fingerprint", "similarity-threshold", "llm-fallback", "healing-pr",
  "diff-types", "snapshot-stability", "vision-classify",
  "prompt-templates", "edge-case-taxonomy", "prompt-versioning",
  "gha-sharding", "test-impact", "preview-env", "ci-caching",
  "gate-rules", "flaky-budget", "perf-budget", "security-scan",
  "results-ingestion", "flakiness-score", "ai-triage", "quality-dashboard",
];

/** Câu hỏi phỏng vấn đã phát hành = khoá của điểm mock interview */
const SHIPPED_QUESTION_IDS = [
  "pw-framework-from-scratch", "pw-pom-vs-alternatives", "ai-self-healing-design", "ai-test-generation",
  "ai-visual-regression", "flaky-strategy", "flaky-debug-playwright", "sd-test-platform", "sd-ai-triage",
  "cicd-quality-gate", "cicd-speed", "star-transition", "star-disagreement",
];

const duplicates = (ids: string[]) => ids.filter((id, i) => ids.indexOf(id) !== i);

const topicIds = allTopics.map(({ topic }) => topic.id);
const skillIds: string[] = skills.map((s) => s.id);

describe("ID ổn định", () => {
  it("không xoá hay đổi tên topic đã phát hành", () => {
    expect(SHIPPED_TOPIC_IDS.filter((id) => !topicIds.includes(id))).toEqual([]);
  });

  it("không xoá hay đổi tên câu hỏi phỏng vấn đã phát hành", () => {
    const ids = interviewQuestions.map((q) => q.id);
    expect(SHIPPED_QUESTION_IDS.filter((id) => !ids.includes(id))).toEqual([]);
  });

  it.each<{ kind: string; ids: string[] }>([
    { kind: "topic", ids: topicIds },
    { kind: "câu hỏi phỏng vấn", ids: interviewQuestions.map((q) => q.id) },
    { kind: "skill", ids: skillIds },
    { kind: "lab", ids: labs.map((l) => l.id) },
    { kind: "phase", ids: phases.map((p) => p.id) },
  ])("id $kind là duy nhất và đúng định dạng khoá tiến độ", ({ ids }) => {
    expect(duplicates(ids)).toEqual([]);
    expect(ids.filter((id) => !PROGRESS_ID_RE.test(id))).toEqual([]);
  });

  it("module id là duy nhất trong mỗi phase", () => {
    for (const phase of phases) {
      expect(duplicates(phase.modules.map((m) => m.id)), phase.id).toEqual([]);
    }
  });
});

describe("Curriculum", () => {
  it("thứ tự phase liên tục, bắt đầu từ 1", () => {
    expect(phases.map((p) => p.order)).toEqual(phases.map((_, i) => i + 1));
  });

  it.each(phases.map((phase) => ({ id: phase.id, phase })))("phase $id có prerequisites, outcomes và giờ học hợp lý", ({ phase }) => {
    expect(phase.prerequisites.length).toBeGreaterThan(0);
    expect(phase.outcomes.length).toBeGreaterThan(0);
    expect(phase.capstone.estimatedHours).toBeGreaterThan(0);
    expect(phaseEstimatedHours(phase)).toBeGreaterThan(phase.capstone.estimatedHours);
    expect(phaseSkills(phase).length).toBeGreaterThan(0);
  });

  it("mọi module gắn ít nhất một skill có trong danh mục", () => {
    for (const { module } of allTopics) {
      expect(module.skills.length, module.id).toBeGreaterThan(0);
      expect(module.skills.filter((s) => !skillIds.includes(s)), module.id).toEqual([]);
    }
  });

  it("mọi module có thời lượng học > 0", () => {
    for (const phase of phases) {
      for (const mod of phase.modules) expect(moduleMinutes(mod), `${phase.id}/${mod.id}`).toBeGreaterThan(0);
    }
  });

  it("không còn nội dung cá nhân hoá theo một hồ sơ cụ thể", () => {
    const text = JSON.stringify(phases);
    expect(text).not.toMatch(/Full-stack|Ruby|background/i);
  });
});

describe("Bài học", () => {
  it("mọi topic đều có bài học", () => {
    expect(topicIds.filter((id) => !getLesson(id))).toEqual([]);
  });

  it("mọi bài học đều thuộc một topic (không có bài mồ côi) và không trùng", () => {
    const lessonTopicIds = allLessons.map((l) => l.topicId);
    expect(duplicates(lessonTopicIds)).toEqual([]);
    expect(lessonTopicIds.filter((id) => !topicIds.includes(id))).toEqual([]);
  });

  it("mọi bài có thời lượng, giải thích, bài tập và checklist", () => {
    for (const l of allLessons) {
      expect(l.minutes, l.topicId).toBeGreaterThan(0);
      expect(l.explain.length, l.topicId).toBeGreaterThan(0);
      expect(l.exercise.task.trim(), l.topicId).not.toBe("");
      expect(l.checklist.length, l.topicId).toBeGreaterThan(0);
    }
  });

  it("quiz (nếu có): 2–5 lựa chọn, đáp án tồn tại, id không trùng, có giải thích", () => {
    for (const l of allLessons) {
      const quiz = l.quiz ?? [];
      expect(duplicates(quiz.map((q) => q.id)), l.topicId).toEqual([]);
      for (const q of quiz) {
        const where = `${l.topicId}/${q.id}`;
        const optionIds = q.options.map((o) => o.id);
        expect(PROGRESS_ID_RE.test(q.id), where).toBe(true);
        expect(q.options.length, where).toBeGreaterThanOrEqual(2);
        expect(q.options.length, where).toBeLessThanOrEqual(5);
        expect(duplicates(optionIds), where).toEqual([]);
        expect(optionIds, where).toContain(q.answer);
        expect(q.explanation.trim(), where).not.toBe("");
      }
    }
  });
});

describe("Quiz", () => {
  // Gồm cả Skill Assessment: cùng quy ước chống lộ đáp án
  const allQuestions = [...allLessons.flatMap((l) => l.quiz ?? []), ...assessmentQuestions];

  it("mọi bài học có ít nhất 3 câu quiz", () => {
    expect(allLessons.filter((l) => (l.quiz?.length ?? 0) < 3).map((l) => l.topicId)).toEqual([]);
  });

  it("quiz chỉ gắn vào topic có thật", () => {
    expect(Object.keys(quizzesByTopic).filter((id) => !topicIds.includes(id))).toEqual([]);
  });

  /**
   * Chống "mẹo đoán đáp án": nếu đáp án đúng hay nằm ở một vị trí, hoặc hay là
   * lựa chọn dài nhất/ngắn nhất, người học đạt điểm mà không cần hiểu bài.
   */
  it("vị trí đáp án đúng phân bổ đều (không vị trí nào > 40%)", () => {
    const byPosition = new Map<number, number>();
    for (const q of allQuestions) {
      const pos = q.options.findIndex((o) => o.id === q.answer);
      byPosition.set(pos, (byPosition.get(pos) ?? 0) + 1);
    }
    const worst = Math.max(...byPosition.values()) / allQuestions.length;
    expect(worst).toBeLessThanOrEqual(0.4);
  });

  it("độ dài đáp án đúng không để lộ đáp án (không hạng độ dài nào > 40%)", () => {
    const byRank = new Map<number, number>();
    for (const q of allQuestions) {
      const rank = [...q.options].sort((x, y) => y.text.length - x.text.length).findIndex((o) => o.id === q.answer);
      byRank.set(rank, (byRank.get(rank) ?? 0) + 1);
    }
    const worst = Math.max(...byRank.values()) / allQuestions.length;
    expect(worst).toBeLessThanOrEqual(0.4);
  });
});

describe("Skill Assessment", () => {
  it("mỗi kỹ năng trong danh mục có đúng 2 câu", () => {
    for (const id of skillIds) {
      expect(assessmentQuestions.filter((q) => q.skill === id), id).toHaveLength(2);
    }
  });

  it("id câu hỏi duy nhất, đáp án tồn tại, có giải thích", () => {
    expect(duplicates(assessmentQuestions.map((q) => q.id))).toEqual([]);
    for (const q of assessmentQuestions) {
      expect(PROGRESS_ID_RE.test(q.id), q.id).toBe(true);
      expect(q.options.map((o) => o.id), q.id).toContain(q.answer);
      expect(duplicates(q.options.map((o) => o.id)), q.id).toEqual([]);
      expect(q.explanation.trim(), q.id).not.toBe("");
    }
  });
});

describe("Interview", () => {
  it("mỗi câu hỏi có rubric với keyword không rỗng", () => {
    for (const q of interviewQuestions) {
      expect(q.rubric.length, q.id).toBeGreaterThan(0);
      for (const r of q.rubric) expect(r.keywords.filter((k) => !k.trim()), `${q.id}/${r.concept}`).toEqual([]);
    }
  });
});

describe("Labs", () => {
  it("lab tham chiếu topic và skill có thật, có tiêu chí nghiệm thu", () => {
    for (const lab of labs) {
      expect(lab.relatedTopics.filter((id) => !topicIds.includes(id)), lab.id).toEqual([]);
      expect(lab.skills.filter((s) => !skillIds.includes(s)), lab.id).toEqual([]);
      expect(lab.acceptance.length, lab.id).toBeGreaterThan(0);
      expect(lab.evidence.length, lab.id).toBeGreaterThan(0);
    }
  });
});
