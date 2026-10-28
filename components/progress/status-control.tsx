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

/** Segmented control đổi trạng thái 1 topic */
export function StatusControl({ topicId, topicTitle, size = "md" }: { topicId: string; topicTitle: string; size?: "sm" | "md" }) {
  const { state, hydrated, setTopicStatus } = useProgress();
  const current = topicStatus(state, topicId);

  return (
    <div
      role="radiogroup"
      aria-label={`Trạng thái: ${topicTitle}`}
      className={cn("inline-flex w-full rounded-xl border border-line bg-surface p-1 sm:w-auto", !hydrated && "opacity-60")}
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
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 font-medium whitespace-nowrap transition-colors duration-150 sm:flex-none",
              size === "sm" ? "min-h-9 text-xs" : "min-h-10 text-sm",
              selected ? active : "text-ink-muted hover:text-ink",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
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
