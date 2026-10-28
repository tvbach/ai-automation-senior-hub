import { CircleCheck, CircleDashed, CircleDot } from "lucide-react";
import type { Difficulty, TopicStatus } from "@/data/content";
import { cn } from "@/lib/cn";

/* ---------------------------------------------------------------- Progress */
export function ProgressBar({
  value,
  label,
  className,
  tone = "accent",
}: {
  value: number;
  label: string;
  className?: string;
  tone?: "accent" | "ok";
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-line", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-out-soft",
          tone === "ok" ? "bg-ok" : "bg-gradient-to-r from-accent-strong to-accent-soft",
        )}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ Badges */
export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "ok" | "warn" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "border-line-strong bg-surface-raised text-ink-muted",
    accent: "border-accent/40 bg-accent-wash text-accent-soft",
    ok: "border-ok/30 bg-ok/10 text-ok",
    warn: "border-warn/30 bg-warn/10 text-warn",
    danger: "border-danger/30 bg-danger/10 text-danger",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium leading-5",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function DifficultyBadge({ level }: { level: Difficulty }) {
  const tone = level === "Senior" ? "accent" : level === "Staff" ? "warn" : "danger";
  return <Badge tone={tone}>{level}</Badge>;
}

/* ------------------------------------------------------------ Topic status */
const STATUS = {
  done: { icon: CircleCheck, label: "Hoàn thành", cls: "text-ok" },
  "in-progress": { icon: CircleDot, label: "Đang học", cls: "text-accent-soft" },
  todo: { icon: CircleDashed, label: "Chưa bắt đầu", cls: "text-ink-faint" },
} as const;

export function TopicStatusIcon({ status }: { status: TopicStatus }) {
  const { icon: Icon, label, cls } = STATUS[status];
  return (
    <span className={cn("inline-flex shrink-0", cls)} title={label}>
      <Icon className="size-4" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/* ------------------------------------------------------- Section headings */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent-soft">{children}</p>;
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-5 sm:p-6", className)}>{children}</div>
  );
}
