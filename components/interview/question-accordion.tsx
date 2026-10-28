"use client";

import { useId } from "react";
import { TriangleAlert, ChevronDown, Crosshair, KeyRound, MessageSquareText, PenLine, type LucideIcon } from "lucide-react";
import type { InterviewQuestion } from "@/data/content";
import { CodeBlock } from "@/components/ui/code-block";
import { Badge, DifficultyBadge } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

export function QuestionAccordion({
  index,
  question: q,
  open,
  onToggle,
  onPractice,
  isPracticing,
}: {
  index: number;
  question: InterviewQuestion;
  open: boolean;
  onToggle: () => void;
  onPractice: () => void;
  isPracticing: boolean;
}) {
  const id = useId();
  const headerId = `${id}-header`;
  const panelId = `${id}-panel`;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface transition-colors duration-200",
        open ? "border-line-strong" : "border-line hover:border-line-strong",
      )}
    >
      <h3>
        <button
          id={headerId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-start gap-3 rounded-2xl p-4 text-left sm:p-5"
        >
          <span className="mt-0.5 font-mono text-xs text-ink-faint">{String(index).padStart(2, "0")}</span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-1.5">
              <Badge>{q.category}</Badge>
              <DifficultyBadge level={q.difficulty} />
              {isPracticing && <Badge tone="accent">đang luyện</Badge>}
            </span>
            <span className="mt-2 block font-medium leading-snug text-ink">{q.question}</span>
          </span>
          <ChevronDown
            className={cn(
              "mt-1 size-5 shrink-0 text-ink-muted transition-transform duration-300 ease-out-soft",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </h3>

      {/* grid-rows 0fr → 1fr: mở/đóng mượt mà không cần đo chiều cao */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out-soft",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-5 border-t border-line px-4 pb-5 pt-4 sm:px-5">
            <Block icon={Crosshair} title="Interviewer đang đánh giá">
              <p className="text-sm text-ink-muted">{q.whatTheyTest}</p>
            </Block>

            <Block icon={MessageSquareText} title="Gợi ý trả lời chuẩn chuyên gia">
              <div className="space-y-3">
                {q.answer.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-ink">
                    {p}
                  </p>
                ))}
              </div>
            </Block>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-ok/25 bg-ok/5 p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-ok">
                  <KeyRound className="size-4" aria-hidden /> Key points ghi điểm
                </p>
                <ul className="mt-2 space-y-1.5">
                  {q.keyPoints.map((k) => (
                    <li key={k} className="flex gap-2 text-sm text-ink">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ok" aria-hidden />
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-danger/25 bg-danger/5 p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-danger">
                  <TriangleAlert className="size-4" aria-hidden /> Lỗi hay gặp
                </p>
                <ul className="mt-2 space-y-1.5">
                  {q.pitfalls.map((k) => (
                    <li key={k} className="flex gap-2 text-sm text-ink">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-danger" aria-hidden />
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {q.code && <CodeBlock sample={q.code} />}

            <button
              type="button"
              onClick={onPractice}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-accent/40 bg-accent-wash px-4 text-sm font-medium text-accent-soft transition-colors duration-200 hover:bg-accent hover:text-white"
            >
              <PenLine className="size-4" aria-hidden /> Tự trả lời câu này trong Simulator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Block({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-ink-faint">
        <Icon className="size-3.5" aria-hidden /> {title}
      </p>
      {children}
    </div>
  );
}
