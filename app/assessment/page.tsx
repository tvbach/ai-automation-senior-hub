import type { Metadata } from "next";
import { AssessmentRunner } from "@/components/assessment/assessment-runner";
import { Eyebrow } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Skill Assessment",
  description: "Bài đánh giá đầu vào 22 câu để biết nên học kỹ hay học lướt từng giai đoạn của lộ trình.",
};

export default function AssessmentPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <Eyebrow>{"// skill_assessment"}</Eyebrow>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Bạn nên bắt đầu từ đâu?</h1>
        <p className="mt-3 text-ink-muted text-pretty">
          Trả lời nhanh vài câu cho mỗi kỹ năng để biết điểm xuất phát. Kết quả gợi ý giai đoạn nào nên học kỹ, giai đoạn
          nào có thể học lướt bằng cách làm quiz kiểm tra ngay.
        </p>
      </header>
      <AssessmentRunner />
    </div>
  );
}
