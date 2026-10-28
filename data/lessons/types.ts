import type { CodeSample, Resource } from "@/data/content";

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

export interface Lesson {
  topicId: string;
  /** Thời gian đọc + làm bài tập ước tính */
  minutes: number;
  level: "Cơ bản" | "Trung cấp" | "Nâng cao";
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
  /** Câu trả lời phỏng vấn mẫu ngắn gọn (30 giây) */
  interviewTip?: string;
  resources?: Resource[];
}
