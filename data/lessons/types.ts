import type { CodeSample, Level, Resource } from "@/data/content";

/**
 * Một bài học = một topic trong module.
 * Văn bản hỗ trợ cú pháp inline tối giản: `code` và **đậm** (xem components/ui/rich-text.tsx).
 */
export interface LessonExample {
  title: string;
  /** Đoạn dẫn: ví dụ này minh hoạ điều gì */
  intro?: string;
  code: CodeSample;
  /** Giải thích từng điểm đáng chú ý trong code */
  notes?: string[];
}

export interface QuizOption {
  /** Duy nhất trong câu hỏi, ví dụ "a", "b" */
  id: string;
  text: string;
}

/**
 * Câu hỏi trắc nghiệm một đáp án đúng, ưu tiên dạng tình huống thực tế.
 * Kết quả lưu theo topic (điểm 0–100) trong ProgressState.quizzes.
 */
export interface QuizQuestion {
  /** Duy nhất trong bài học, dạng kebab-case */
  id: string;
  prompt: string;
  /** 2–5 lựa chọn */
  options: QuizOption[];
  /** id của lựa chọn đúng */
  answer: string;
  /** Vì sao đáp án đúng và các lựa chọn còn lại sai ở đâu */
  explanation: string;
}

export interface Lesson {
  topicId: string;
  /** Thời gian đọc + làm bài tập ước tính */
  minutes: number;
  level: Level;
  /** 1–2 câu: vì sao Senior SDET phải nắm chắc điều này */
  why: string;
  /** Giải thích cho người mới, mỗi phần tử là 1 đoạn */
  explain: string[];
  /** Ví dụ đời thường giúp hình dung */
  analogy?: string;
  concepts: { term: string; meaning: string }[];
  examples: LessonExample[];
  mistakes: { wrong: string; fix: string }[];
  exercise: {
    task: string;
    steps?: string[];
    hint?: string;
    solution?: CodeSample;
    solutionNote?: string;
  };
  /** Tự kiểm tra: đánh dấu được hết → chuyển topic sang "Hoàn thành" */
  checklist: string[];
  /** Kiểm tra nhanh sau bài học (khuyến nghị 3–5 câu) */
  quiz?: QuizQuestion[];
  /** Câu trả lời phỏng vấn mẫu ngắn gọn (30 giây) */
  interviewTip?: string;
  resources?: Resource[];
}
