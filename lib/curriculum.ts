/**
 * lib/curriculum.ts
 * ----------------------------------------------------------------------------
 * Dữ liệu suy ra từ curriculum — không lưu trùng trong data/ để luôn đồng bộ
 * khi bài học thay đổi.
 * ----------------------------------------------------------------------------
 */
import { skills, type Module, type Phase, type Skill, type SkillId } from "@/data/content";
import { getLesson } from "@/data/lessons";

/** Tổng phút học (đọc + bài tập) của các bài trong module */
export function moduleMinutes(mod: Module): number {
  return mod.topics.reduce((sum, t) => sum + (getLesson(t.id)?.minutes ?? 0), 0);
}

/** Giờ học ước tính của phase = bài học + capstone, làm tròn lên */
export function phaseEstimatedHours(phase: Phase): number {
  const lessonMinutes = phase.modules.reduce((sum, m) => sum + moduleMinutes(m), 0);
  return Math.ceil(lessonMinutes / 60) + phase.capstone.estimatedHours;
}

/** Kỹ năng phase rèn luyện, theo thứ tự trong danh mục skills */
export function phaseSkills(phase: Phase): Skill[] {
  const ids = new Set<SkillId>(phase.modules.flatMap((m) => m.skills));
  return skills.filter((s) => ids.has(s.id));
}

export function getSkill(id: string): Skill | undefined {
  return skills.find((s) => s.id === id);
}
