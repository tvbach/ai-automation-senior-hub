"use client";

import { summarizeTopics } from "@/lib/progress";
import { ProgressBar } from "@/components/ui/primitives";
import { useProgress } from "./progress-provider";

/** Hook: tóm tắt tiến độ cho 1 tập topic. Trước khi hydrate trả về null để tránh nhấp nháy số sai. */
export function useTopicSummary(topicIds: string[]) {
  const { state, hydrated } = useProgress();
  return hydrated ? summarizeTopics(state, topicIds) : null;
}

/** Khối "x% · a done · b đang học" + thanh tiến độ */
export function LiveProgress({
  topicIds,
  label,
  variant = "block",
}: {
  topicIds: string[];
  label: string;
  variant?: "block" | "compact";
}) {
  const s = useTopicSummary(topicIds);
  const percent = s?.percent ?? 0;

  if (variant === "compact") {
    return (
      <div className="space-y-2">
        <div className="flex justify-between font-mono text-xs text-ink-muted">
          <span>{s ? `${s.done}/${s.total} topic` : `—/${topicIds.length} topic`}</span>
          <span>{s ? `${percent}%` : "—"}</span>
        </div>
        <ProgressBar value={percent} label={label} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <span className="font-mono text-2xl font-semibold">{s ? `${percent}%` : "—"}</span>
        <span className="text-right font-mono text-xs text-ink-muted">
          {s ? `${s.done} hoàn thành · ${s.inProgress} đang học · ${s.total - s.done - s.inProgress} chưa học` : " "}
        </span>
      </div>
      <ProgressBar value={percent} label={label} />
    </div>
  );
}

/** Đếm "a/b" topic hoàn thành của 1 module */
export function LiveCount({ topicIds }: { topicIds: string[] }) {
  const s = useTopicSummary(topicIds);
  return (
    <span className="shrink-0 font-mono text-xs text-ink-faint">
      {s ? s.done : "—"}/{topicIds.length}
    </span>
  );
}
