/**
 * lib/quiz.ts — chấm quiz trắc nghiệm (pure, dùng được ở client và test).
 */
import type { QuizQuestion } from "@/data/lessons/types";

/** Điểm tối thiểu để coi là "đạt" (với quiz 3 câu: đúng ≥ 2 câu) */
export const QUIZ_PASS_SCORE = 60;

export interface QuizQuestionResult {
  questionId: string;
  selected: string | null;
  correct: boolean;
}

export interface QuizScore {
  correct: number;
  total: number;
  /** 0–100, làm tròn */
  score: number;
  passed: boolean;
  results: QuizQuestionResult[];
}

/** Chấm bài: câu chưa trả lời hoặc chọn id không tồn tại tính là sai */
export function scoreQuiz(questions: QuizQuestion[], answers: Record<string, string | undefined>): QuizScore {
  const results = questions.map((q) => {
    const selected = answers[q.id] ?? null;
    return { questionId: q.id, selected, correct: selected === q.answer };
  });
  const correct = results.filter((r) => r.correct).length;
  const total = questions.length;
  const score = total ? Math.round((correct / total) * 100) : 0;
  return { correct, total, score, passed: total > 0 && score >= QUIZ_PASS_SCORE, results };
}

export function isQuizPassed(score: number | undefined): boolean {
  return typeof score === "number" && score >= QUIZ_PASS_SCORE;
}
