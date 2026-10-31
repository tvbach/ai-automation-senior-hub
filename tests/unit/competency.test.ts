import { describe, expect, it } from "vitest";
import type { Skill } from "@/data/content";
import { computeCompetency, prioritizedActions, type CatalogEntry } from "@/lib/competency";
import { emptyProgress, type ProgressState } from "@/lib/progress";

const T = Date.UTC(2026, 9, 1, 12);

const SKILLS: Skill[] = [
  { id: "api", title: "API", description: "" },
  { id: "ui", title: "UI", description: "" },
  { id: "empty", title: "Empty", description: "" },
];

/** 4 bài: t1, t2 thuộc module "m-api" (skill api); t3, t4 thuộc "m-ui" (skill ui + api) */
const entry = (topic: string, module: string, skills: string[]): CatalogEntry => ({
  topic: { id: topic, title: topic.toUpperCase() },
  module: { id: module, title: module, skills: skills as never },
  phase: { id: "p1" },
});
const CATALOG = [
  entry("t1", "m-api", ["api"]),
  entry("t2", "m-api", ["api"]),
  entry("t3", "m-ui", ["ui", "api"]),
  entry("t4", "m-ui", ["ui", "api"]),
];

function state(partial: Partial<ProgressState>): ProgressState {
  return { ...emptyProgress(), ...partial };
}
const quiz = (best: number) => ({ best, last: best, at: T });
const done = { status: "done" as const, at: T };
const reading = { status: "in-progress" as const, at: T };

const byId = (s: ProgressState) => Object.fromEntries(computeCompetency(s, CATALOG, SKILLS).map((c) => [c.skill.id, c]));

describe("computeCompetency", () => {
  it("chưa có dữ liệu: điểm 0, chưa bắt đầu; kỹ năng không có bài: no-content", () => {
    const c = byId(emptyProgress());
    expect(c.api).toMatchObject({ score: 0, level: "not-started", topicCount: 4 });
    expect(c.empty).toMatchObject({ score: 0, level: "no-content", topicCount: 0, actions: [] });
  });

  it("score = 70% quiz trung bình + 30% tỉ lệ hoàn thành (bài chưa làm quiz tính 0)", () => {
    // ui: t3 quiz 100 + done, t4 chưa gì → quiz TB 50, done 50% → 35 + 15 = 50
    const c = byId(state({ quizzes: { t3: quiz(100) }, topics: { t3: done } }));
    expect(c.ui).toMatchObject({ score: 50, level: "developing", quizzed: 1, passed: 1, done: 1 });
  });

  it("đọc xong mà không làm quiz không thể đạt mức nắm chắc", () => {
    const c = byId(state({ topics: { t3: done, t4: done } }));
    expect(c.ui.score).toBe(30);
    expect(c.ui.level).toBe("weak");
  });

  it("làm đạt quiz và hoàn thành mọi bài → 100, nắm chắc", () => {
    const c = byId(state({ quizzes: { t3: quiz(100), t4: quiz(100) }, topics: { t3: done, t4: done } }));
    expect(c.ui).toMatchObject({ score: 100, level: "solid", actions: [] });
  });

  it("một bài thuộc nhiều kỹ năng được tính cho cả hai", () => {
    const c = byId(state({ quizzes: { t3: quiz(80) } }));
    expect(c.ui.quizzed).toBe(1);
    expect(c.api.quizzed).toBe(1);
    expect(c.api.topicCount).toBe(4);
  });

  it("gợi ý theo thứ tự: làm lại quiz chưa đạt → làm quiz bài đã đọc → học bài mới", () => {
    const c = byId(state({ quizzes: { t2: quiz(33) }, topics: { t4: reading } }));
    expect(c.api.actions.map((a) => [a.kind, a.topicId])).toEqual([
      ["retake", "t2"],
      ["quiz", "t4"],
      ["learn", "t1"],
      ["learn", "t3"],
    ]);
    expect(c.api.actions[0]).toMatchObject({ best: 33, href: "/roadmap/p1/m-api#t2" });
  });

  it("bài đã đạt quiz không xuất hiện trong gợi ý", () => {
    const c = byId(state({ quizzes: { t1: quiz(67) } }));
    expect(c.api.actions.map((a) => a.topicId)).not.toContain("t1");
  });
});

describe("prioritizedActions", () => {
  it("ưu tiên kỹ năng đã có hoạt động và điểm thấp, không trùng bài", () => {
    // api: t1 fail (yếu), ui: chưa bắt đầu
    const comps = computeCompetency(state({ quizzes: { t1: quiz(0) } }), CATALOG, SKILLS);
    const picks = prioritizedActions(comps, 3);
    expect(picks[0]).toMatchObject({ kind: "retake", topicId: "t1", skillId: "api" });
    expect(new Set(picks.map((p) => p.topicId)).size).toBe(picks.length);
    expect(picks).toHaveLength(3);
  });

  it("bỏ qua kỹ năng đã nắm chắc và kỹ năng không có bài học", () => {
    const solidUi = state({ quizzes: { t3: quiz(100), t4: quiz(100) }, topics: { t3: done, t4: done } });
    const picks = prioritizedActions(computeCompetency(solidUi, CATALOG, SKILLS), 5);
    expect(picks.every((p) => p.skillId === "api")).toBe(true);
  });

  it("không còn việc gì → mảng rỗng", () => {
    const all = state({
      quizzes: { t1: quiz(100), t2: quiz(100), t3: quiz(100), t4: quiz(100) },
      topics: { t1: done, t2: done, t3: done, t4: done },
    });
    expect(prioritizedActions(computeCompetency(all, CATALOG, SKILLS))).toEqual([]);
  });
});
