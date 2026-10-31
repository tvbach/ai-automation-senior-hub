/**
 * data/quizzes — câu hỏi kiểm tra nhanh cuối mỗi bài, khoá theo Topic.id.
 * Được gắn vào Lesson.quiz trong data/lessons/index.ts.
 *
 * Quy ước viết quiz:
 * - 3–5 câu/bài, ưu tiên tình huống thực tế thay vì hỏi định nghĩa.
 * - Mỗi câu 4 lựa chọn, một đáp án đúng; phương án sai phải "nghe hợp lý".
 * - `explanation` giải thích vì sao đúng và chỗ sai của lựa chọn hấp dẫn nhất.
 * - Phân bổ vị trí đáp án đều (test content-integrity sẽ kiểm tra).
 */
import type { QuizQuestion } from "@/data/lessons/types";
import { aiDrivenTestingQuizzes } from "./ai-driven-testing";
import { cicdQualityGatesQuizzes } from "./cicd-quality-gates";
import { testArchitectureQuizzes } from "./test-architecture";

export const quizzesByTopic: Record<string, QuizQuestion[]> = {
  ...testArchitectureQuizzes,
  ...aiDrivenTestingQuizzes,
  ...cicdQualityGatesQuizzes,
};
