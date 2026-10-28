"use client";

import { useId, useState } from "react";
import { CircleCheck, PartyPopper } from "lucide-react";
import { topicStatus } from "@/lib/progress";
import { useProgress } from "@/components/progress/progress-provider";
import { cn } from "@/lib/cn";

/** Checklist tự kiểm tra; tick đủ → gợi ý đánh dấu topic "Hoàn thành" */
export function LessonChecklist({ topicId, items }: { topicId: string; items: string[] }) {
  const ids = useId();
  const { state, hydrated, setTopicStatus } = useProgress();
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));
  const done = hydrated && topicStatus(state, topicId) === "done";
  const allChecked = checked.every(Boolean);

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={item}>
            <label
              htmlFor={`${ids}-${i}`}
              className={cn(
                "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors duration-150",
                checked[i] || done ? "border-ok/30 bg-ok/5 text-ink" : "border-line bg-surface hover:border-line-strong",
              )}
            >
              <input
                id={`${ids}-${i}`}
                type="checkbox"
                checked={checked[i] || done}
                disabled={done}
                onChange={(e) => setChecked((prev) => prev.map((v, j) => (j === i ? e.target.checked : v)))}
                className="mt-0.5 size-4 shrink-0 accent-[var(--color-ok)]"
              />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>

      {done ? (
        <p className="flex items-center gap-2 text-sm text-ok">
          <CircleCheck className="size-4" aria-hidden /> Bài này đã được đánh dấu hoàn thành.
        </p>
      ) : allChecked ? (
        <div className="flex flex-col gap-3 rounded-xl border border-ok/30 bg-ok/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-ok">
            <PartyPopper className="size-4" aria-hidden /> Bạn đã nắm đủ các ý chính!
          </p>
          <button
            type="button"
            onClick={() => setTopicStatus(topicId, "done")}
            className="min-h-11 rounded-lg bg-ok px-4 text-sm font-medium text-canvas hover:bg-ok/90"
          >
            Đánh dấu hoàn thành
          </button>
        </div>
      ) : null}
    </div>
  );
}
