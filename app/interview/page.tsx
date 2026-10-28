import type { Metadata } from "next";
import { interviewQuestions, questionCategories } from "@/data/content";
import { InterviewWorkspace } from "@/components/interview/interview-workspace";
import { Eyebrow } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Interview Hub",
  description: "Câu hỏi phỏng vấn Senior/Staff cho Automation Test AI kèm Mock Interview Simulator.",
};

export default function InterviewPage() {
  const counts = questionCategories.map((c) => ({
    category: c,
    count: interviewQuestions.filter((q) => q.category === c).length,
  }));

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <Eyebrow>{"// interview_hub"}</Eyebrow>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Luyện phỏng vấn Senior & System Design</h1>
        <p className="mt-3 text-ink-muted text-pretty">
          Mở từng câu để xem gợi ý trả lời chuẩn chuyên gia, các key points ghi điểm và lỗi thường gặp. Sau đó tự trả lời
          trong Mock Interview Simulator — hệ thống chấm theo rubric mà interviewer cấp Senior thường dùng.
        </p>
      </header>

      <InterviewWorkspace questions={interviewQuestions} categories={counts} />
    </div>
  );
}
