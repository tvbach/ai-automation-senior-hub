"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight, Flag, Lightbulb, Target } from "lucide-react";
import { phaseProgress, type Phase } from "@/data/content";
import { ProgressBar, TopicStatusIcon } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

/**
 * Tabs chuẩn WAI-ARIA: Arrow Left/Right/Home/End để chuyển tab,
 * roving tabindex, panel fade-in khi đổi tab.
 */
export function PhaseTabs({ phases }: { phases: Phase[] }) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const baseId = useId();

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const last = phases.length - 1;
    const next =
      e.key === "ArrowRight" ? (active === last ? 0 : active + 1)
      : e.key === "ArrowLeft" ? (active === 0 ? last : active - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  const phase = phases[active];
  const progress = phaseProgress(phase);

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div
        role="tablist"
        aria-label="Các giai đoạn lộ trình"
        className="flex gap-1 overflow-x-auto border-b border-line p-2"
      >
        {phases.map((p, i) => {
          const selected = i === active;
          return (
            <button
              key={p.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              type="button"
              id={`${baseId}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={onKeyDown}
              className={cn(
                "flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors duration-200",
                selected ? "bg-accent-wash text-ink ring-1 ring-accent/40" : "text-ink-muted hover:bg-surface-raised hover:text-ink",
              )}
            >
              <span className={cn("font-mono text-xs", selected ? "text-accent-soft" : "text-ink-faint")}>
                0{p.order}
              </span>
              {p.shortTitle}
            </button>
          );
        })}
      </div>

      <div
        key={phase.id}
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${active}`}
        tabIndex={0}
        className="grid animate-fade-up gap-6 p-5 sm:p-6 lg:grid-cols-[1.1fr_1fr]"
      >
        {/* Left: overview */}
        <div className="space-y-5">
          <div>
            <h3 className="text-xl font-semibold tracking-tight">{phase.title}</h3>
            <p className="mt-2 text-ink-muted">{phase.tagline}</p>
          </div>

          <div className="rounded-xl border border-accent/25 bg-accent-wash p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-accent-soft">
              <Lightbulb className="size-4" aria-hidden /> Tận dụng background Full-stack
            </p>
            <p className="mt-1.5 text-sm text-ink">{phase.leverage}</p>
          </div>

          <div>
            <p className="flex items-center gap-2 text-sm font-medium">
              <Target className="size-4 text-accent-soft" aria-hidden /> Đầu ra cần đạt
            </p>
            <ul className="mt-2 space-y-2">
              {phase.outcomes.map((o) => (
                <li key={o} className="flex gap-2.5 text-sm text-ink-muted">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-soft" aria-hidden />
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: modules + progress */}
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-ink-faint">{phase.durationWeeks} tuần · {progress.total} topic</p>
              <p className="mt-0.5 font-mono text-2xl font-semibold">{progress.percent}%</p>
            </div>
            <p className="text-right font-mono text-xs text-ink-muted">
              {progress.done} done · {progress.inProgress} in-progress
            </p>
          </div>
          <ProgressBar value={progress.percent} label={`Tiến độ ${phase.shortTitle}`} />

          <ul className="divide-y divide-line rounded-xl border border-line">
            {phase.modules.map((m) => {
              const done = m.topics.filter((t) => t.status === "done").length;
              const current = m.topics.find((t) => t.status === "in-progress") ?? m.topics.find((t) => t.status === "todo");
              return (
                <li key={m.id} className="flex items-start justify-between gap-3 p-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{m.title}</p>
                    {current && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                        <TopicStatusIcon status={current.status} />
                        <span className="truncate">{current.title}</span>
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 font-mono text-xs text-ink-faint">
                    {done}/{m.topics.length}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-sm">
              <Flag className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
              <span>
                <span className="text-ink-muted">Capstone: </span>
                {phase.capstone.title}
              </span>
            </p>
            <Link
              href={`/roadmap/${phase.id}`}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-accent-strong"
            >
              Xem chi tiết <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
