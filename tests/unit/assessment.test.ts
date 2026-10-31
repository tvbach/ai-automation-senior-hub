import { describe, expect, it } from "vitest";
import type { Skill } from "@/data/content";
import type { AssessmentQuestion } from "@/data/assessment";
import { recommendPhases, scoreAssessment } from "@/lib/assessment";
import { computeCompetency, type CatalogEntry } from "@/lib/competency";
import { emptyProgress, localDay, withAssessment } from "@/lib/progress";

const T = Date.UTC(2026, 9, 1, 12);

const q = (id: string, skill: string, answer = "a"): AssessmentQuestion => ({
  id,
  skill: skill as never,
  prompt: id,
  options: [
    { id: "a", text: "A" },
    { id: "b", text: "B" },
  ],
  answer,
  explanation: "…",
});

const QUESTIONS = [q("api-1", "api"), q("api-2", "api"), q("ui-1", "ui"), q("ui-2", "ui")];
const SKILLS: Skill[] = [
  { id: "api", title: "API", description: "" },
  { id: "ui", title: "UI", description: "" },
];

describe("scoreAssessment", () => {
  it("tính điểm 0–100 cho từng kỹ năng và tổng số câu đúng", () => {
    const r = scoreAssessment(QUESTIONS, { "api-1": "a", "api-2": "a", "ui-1": "a", "ui-2": "b" });
    expect(r).toMatchObject({ correct: 3, total: 4, bySkill: { api: 100, ui: 50 } });
  });

  it("không trả lời → 0 điểm cho kỹ năng đó (vẫn có mặt trong kết quả)", () => {
    expect(scoreAssessment(QUESTIONS, {}).bySkill).toEqual({ api: 0, ui: 0 });
  });
});

describe("recommendPhases", () => {
  const phases = [
    { id: "p-api", title: "API phase", order: 1, modules: [{ skills: ["api"] }] },
    { id: "p-mixed", title: "Mixed", order: 2, modules: [{ skills: ["api"] }, { skills: ["ui", "api"] }] },
    { id: "p-none", title: "Unassessed", order: 3, modules: [{ skills: ["other"] }] },
  ] as never;

  it("≥ 80 → học lướt, < 50 → học kỹ, còn lại học theo thứ tự", () => {
    const recs = recommendPhases({ api: 100, ui: 0 }, phases, SKILLS);
    expect(recs.map((r) => [r.phase.id, r.score, r.advice])).toEqual([
      ["p-api", 100, "skim"],
      ["p-mixed", 50, "normal"],
      ["p-none", 0, "study"],
    ]);
    expect(recs[1].skills).toEqual([
      { id: "api", title: "API", score: 100 },
      { id: "ui", title: "UI", score: 0 },
    ]);
  });
});

describe("withAssessment", () => {
  it("lưu điểm đã chuẩn hoá, thay thế lần trước và ghi ngày học", () => {
    const first = withAssessment(emptyProgress(), { api: 50 }, T);
    const second = withAssessment(first, { ui: 120.4, "Bad Id": 50, api: -3 }, T + 1);
    expect(second.assessment).toEqual({ at: T + 1, scores: { ui: 100, api: 0 } });
    expect(second.activity).toEqual([localDay(T)]);
  });
});

describe("Assessment trong năng lực", () => {
  const entry = (topic: string, skills: string[]): CatalogEntry => ({
    topic: { id: topic, title: topic },
    module: { id: "m", title: "M", skills: skills as never },
    phase: { id: "p" },
  });
  const CATALOG = [entry("t1", ["api"]), entry("t2", ["ui"])];

  it("không cộng vào điểm năng lực nhưng được hiển thị", () => {
    const s = withAssessment(emptyProgress(), { api: 100 }, T);
    const [api] = computeCompetency(s, CATALOG, SKILLS);
    expect(api).toMatchObject({ score: 0, assessed: 100 });
  });

  it("kỹ năng vững theo assessment: gợi ý làm quiz thay vì học lại bài", () => {
    const s = withAssessment(emptyProgress(), { api: 100, ui: 50 }, T);
    const [api, ui] = computeCompetency(s, CATALOG, SKILLS);
    expect(api.actions[0].kind).toBe("quiz");
    expect(ui.actions[0].kind).toBe("learn");
  });
});
