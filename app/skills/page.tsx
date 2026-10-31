import type { Metadata } from "next";
import { SkillsBoard } from "@/components/skills/skills-board";
import { Eyebrow } from "@/components/ui/primitives";
import { COMPLETION_WEIGHT, QUIZ_WEIGHT, SOLID_SCORE } from "@/lib/competency";
import { QUIZ_PASS_SCORE } from "@/lib/quiz";

export const metadata: Metadata = {
  title: "Năng lực",
  description: "Năng lực theo từng nhóm kỹ năng, tính từ điểm quiz và bài học đã hoàn thành, kèm gợi ý nên ôn gì tiếp.",
};

export default function SkillsPage() {
  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <Eyebrow>{"// skills"}</Eyebrow>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Năng lực theo kỹ năng</h1>
        <p className="mt-3 text-ink-muted text-pretty">
          Điểm mỗi kỹ năng = {Math.round(QUIZ_WEIGHT * 100)}% điểm quiz cao nhất (trung bình các bài) +{" "}
          {Math.round(COMPLETION_WEIGHT * 100)}% tỉ lệ bài đã hoàn thành. Bài chưa làm quiz tính 0 điểm quiz, vì đọc xong
          chưa chắc đã hiểu. Quiz đạt từ {QUIZ_PASS_SCORE}%; kỹ năng đạt {SOLID_SCORE} điểm trở lên được coi là nắm chắc kiến
          thức. Lab có bằng chứng sẽ được tính thêm khi phần Labs ra mắt.
        </p>
      </header>

      <SkillsBoard />
    </div>
  );
}
