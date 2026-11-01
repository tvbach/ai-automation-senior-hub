"use client";

import { CircleCheck, CircleDashed, CircleDot } from "lucide-react";
import type { TopicStatus } from "@/data/content";
import { topicStatus } from "@/lib/progress";
import { useProgress } from "./progress-provider";
import { cn } from "@/lib/cn";

const OPTIONS: { value: TopicStatus; label: string; icon: typeof CircleCheck; active: string }[] = [
  { value: "todo", label: "Chưa học", icon: CircleDashed, active: "bg-surface-raised text-ink ring-1 ring-line-strong" },
  { value: "in-progress", label: "Đang học", icon: CircleDot, active: "bg-accent-wash text-accent-soft ring-1 ring-accent/40" },
  { value: "done", label: "Hoàn thành", icon: CircleCheck, active: "bg-ok/10 text-ok ring-1 ring-ok/40" },
];

/**
 * Segmented control đổi trạng thái 1 topic.
 * Lưới 3 cột bằng nhau nên không bao giờ tràn khung, kể cả màn hình 320px hay cỡ chữ
 * hệ thống lớn: trên mobile icon nằm trên chữ và chữ được xuống dòng.
 */
export function StatusControl({ topicId, topicTitle, size = "md" }: { topicId: string; topicTitle: string; size?: "sm" | "md" }) {
  const { state, hydrated, setTopicStatus } = useProgress();
  const current = topicStatus(state, topicId);

  return (
    <div
      role="radiogroup"
      aria-label={`Trạng thái: ${topicTitle}`}
      className={cn(
        "grid w-full grid-cols-3 gap-1 rounded-xl border border-line bg-surface p-1 sm:inline-grid sm:w-auto sm:grid-cols-[repeat(3,auto)]",
        !hydrated && "opacity-60",
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon, active }) => {
        const selected = hydrated && current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={!hydrated}
            onClick={() => setTopicStatus(topicId, value)}
            className={cn(
              // Mobile: icon trên, chữ dưới, được xuống dòng; từ sm: một hàng như cũ
              "flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-center font-medium leading-tight transition-colors duration-150",
              "sm:flex-row sm:gap-1.5 sm:px-2.5 sm:py-0 sm:whitespace-nowrap",
              size === "sm" ? "min-h-11 text-xs sm:min-h-9" : "min-h-12 text-sm sm:min-h-10",
              selected ? active : "text-ink-muted hover:text-ink",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="max-w-full [overflow-wrap:anywhere]">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Icon trạng thái chỉ đọc, theo dữ liệu tiến độ thật */
export function LiveStatusIcon({ topicId }: { topicId: string }) {
  const { state, hydrated } = useProgress();
  const s = hydrated ? topicStatus(state, topicId) : "todo";
  const map = {
    done: { Icon: CircleCheck, cls: "text-ok", label: "Hoàn thành" },
    "in-progress": { Icon: CircleDot, cls: "text-accent-soft", label: "Đang học" },
    todo: { Icon: CircleDashed, cls: "text-ink-faint", label: "Chưa học" },
  }[s];
  return (
    <span className={cn("inline-flex shrink-0", map.cls)} title={map.label}>
      <map.Icon className="size-4" aria-hidden />
      <span className="sr-only">{map.label}</span>
    </span>
  );
}
