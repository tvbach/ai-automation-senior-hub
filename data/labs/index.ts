/**
 * data/labs — bài thực hành có tiêu chí nghiệm thu và bằng chứng (repo/PR/report).
 *
 * Lab chạy trên QA Shop (repo riêng `qa-shop`), người học làm trong repo của mình
 * (fork từ `qa-shop-tests`) rồi nộp link làm bằng chứng. Trạng thái lab lưu trong
 * ProgressState.labs (lib/progress.ts), khoá theo `Lab.id`.
 *
 * Danh sách lab được bổ sung ở Giai đoạn 4 của kế hoạch nâng cấp
 * (docs/planning/complete-sdet-platform-upgrade.md).
 */
import type { Level, SkillId } from "@/data/content";

export type LabEvidence = "repo" | "pull-request" | "report";

export interface Lab {
  /** ID ổn định, dạng "lab-001" — KHÔNG đổi sau khi đã dùng (khoá lưu tiến độ) */
  id: string;
  /** Mã hiển thị, ví dụ "LAB-001" */
  code: string;
  title: string;
  level: Level;
  /** Thời gian ước tính để hoàn thành */
  minutes: number;
  skills: SkillId[];
  summary: string;
  /** Topic nên học trước (Topic.id) */
  relatedTopics: string[];
  objectives: string[];
  tasks: string[];
  /** Checklist nghiệm thu — người học tự đối chiếu trước khi nộp */
  acceptance: string[];
  /** Ứng dụng làm đối tượng kiểm thử và phiên bản tối thiểu */
  target: { app: "qa-shop"; minVersion: string };
  evidence: LabEvidence[];
}

export const labs: Lab[] = [];

export function getLab(id: string): Lab | undefined {
  return labs.find((lab) => lab.id === id);
}
