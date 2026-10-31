import { describe, expect, it } from "vitest";
import type { QuizQuestion } from "@/data/lessons/types";
import { isQuizPassed, QUIZ_PASS_SCORE, scoreQuiz } from "@/lib/quiz";
import { emptyProgress, localDay, withQuizResult } from "@/lib/progress";

const q = (id: string, answer: string): QuizQuestion => ({
  id,
  prompt: id,
  options: [
    { id: "a", text: "A" },
    { id: "b", text: "B" },
    { id: "c", text: "C" },
  ],
  answer,
  explanation: "…",
});

const QUIZ = [q("q1", "a"), q("q2", "b"), q("q3", "c")];

describe("scoreQuiz", () => {
  it("đúng hết → 100 điểm, đạt", () => {
    expect(scoreQuiz(QUIZ, { q1: "a", q2: "b", q3: "c" })).toMatchObject({ correct: 3, total: 3, score: 100, passed: true });
  });

  it("đúng 2/3 → 67 điểm, đạt (ngưỡng 60)", () => {
    const r = scoreQuiz(QUIZ, { q1: "a", q2: "b", q3: "a" });
    expect(r).toMatchObject({ correct: 2, score: 67, passed: true });
    expect(r.results.map((x) => x.correct)).toEqual([true, true, false]);
  });

  it("đúng 1/3 → 33 điểm, chưa đạt", () => {
    expect(scoreQuiz(QUIZ, { q1: "a" })).toMatchObject({ correct: 1, score: 33, passed: false });
  });

  it("câu chưa trả lời hoặc chọn id không tồn tại tính là sai", () => {
    const r = scoreQuiz(QUIZ, { q1: "z" });
    expect(r.correct).toBe(0);
    expect(r.results[0]).toEqual({ questionId: "q1", selected: "z", correct: false });
    expect(r.results[1]).toEqual({ questionId: "q2", selected: null, correct: false });
  });

  it("quiz rỗng không bao giờ đạt", () => {
    expect(scoreQuiz([], {})).toMatchObject({ total: 0, score: 0, passed: false });
  });
});

describe("isQuizPassed", () => {
  it.each<[number | undefined, boolean]>([
    [undefined, false],
    [QUIZ_PASS_SCORE - 1, false],
    [QUIZ_PASS_SCORE, true],
    [100, true],
  ])("%s → %s", (score, expected) => {
    expect(isQuizPassed(score)).toBe(expected);
  });
});

describe("withQuizResult", () => {
  const T = Date.UTC(2026, 9, 1, 12);

  it("lần đầu: best = last = điểm, ghi nhận ngày học", () => {
    const s = withQuizResult(emptyProgress(), "fixtures", 67, T);
    expect(s.quizzes.fixtures).toEqual({ best: 67, last: 67, at: T });
    expect(s.activity).toEqual([localDay(T)]);
  });

  it("làm lại điểm thấp hơn: last giảm nhưng best giữ nguyên", () => {
    const first = withQuizResult(emptyProgress(), "fixtures", 100, T);
    const second = withQuizResult(first, "fixtures", 33, T + 1000);
    expect(second.quizzes.fixtures).toEqual({ best: 100, last: 33, at: T + 1000 });
  });

  it("chặn điểm ngoài 0–100 và làm tròn", () => {
    expect(withQuizResult(emptyProgress(), "a", 150.4, T).quizzes.a.last).toBe(100);
    expect(withQuizResult(emptyProgress(), "a", -5, T).quizzes.a.last).toBe(0);
    expect(withQuizResult(emptyProgress(), "a", 66.6, T).quizzes.a.last).toBe(67);
  });

  it("không làm thay đổi state cũ (immutable)", () => {
    const before = emptyProgress();
    withQuizResult(before, "fixtures", 80, T);
    expect(before).toEqual(emptyProgress());
  });
});
