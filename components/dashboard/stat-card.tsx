import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { Stat } from "@/data/content";
import { cn } from "@/lib/cn";

export function StatCard({ stat }: { stat: Stat }) {
  const { direction } = stat.trend;
  const isGood = direction === "flat" ? null : direction === stat.goodWhen;
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : ArrowRight;

  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors duration-200 hover:border-line-strong">
      <p className="text-sm text-ink-muted">{stat.label}</p>
      <div>
        <p className="font-mono text-3xl font-semibold tracking-tight text-ink">{stat.value}</p>
        <p className="mt-1 text-xs text-ink-faint">{stat.hint}</p>
      </div>
      <p
        className={cn(
          "inline-flex w-fit items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-xs",
          isGood === null ? "bg-surface-raised text-ink-muted" : isGood ? "bg-ok/10 text-ok" : "bg-danger/10 text-danger",
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {stat.trend.label}
      </p>
    </div>
  );
}
