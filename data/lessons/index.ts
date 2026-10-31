import type { Lesson } from "./types";
import { phase1Lessons } from "./phase-1";
import { phase2Lessons } from "./phase-2";
import { phase3Lessons } from "./phase-3";
import { quizzesByTopic } from "@/data/quizzes";

/** Quiz được tách riêng (data/quizzes) để nội dung bài và câu hỏi review độc lập */
const ALL: Lesson[] = [...phase1Lessons, ...phase2Lessons, ...phase3Lessons].map((lesson) => {
  const quiz = lesson.quiz ?? quizzesByTopic[lesson.topicId];
  return quiz ? { ...lesson, quiz } : lesson;
});

const BY_TOPIC = new Map(ALL.map((l) => [l.topicId, l]));

/** Mọi bài học theo thứ tự file — dùng cho kiểm tra toàn vẹn nội dung và thống kê */
export const allLessons: readonly Lesson[] = ALL;

export function getLesson(topicId: string): Lesson | undefined {
  return BY_TOPIC.get(topicId);
}

export type { Lesson, QuizOption, QuizQuestion } from "./types";
