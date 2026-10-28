"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BrainCircuit, CircleCheck, LoaderCircle, RotateCcw, Sparkles, TrendingUp, CircleX } from "lucide-react";
import type { InterviewQuestion } from "@/data/content";
import { gradeAnswer, type GradeResult, type Verdict } from "@/lib/grader";
import { Badge, DifficultyBadge } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { useProgress } from "@/components/progress/progress-provider";

const MIN_WORDS = 15;
const THINKING_STEPS = [
  "Đối chiếu rubric của câu hỏi…",
  "Phân tích trade-off & cấu trúc…",
  "Tổng hợp feedback…",
];


const VERDICT_TONE: Record<Verdict, "ok" | "accent" | "warn" | "danger"> = {
  "Strong Hire": "ok",
  Hire: "accent",
  "Lean No Hire": "warn",
  "No Hire": "danger",
};

export function MockSimulator({
  questions,
  selectedId,
  onSelect,
}: {
  questions: InterviewQuestion[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const ids = useId();
  const question = questions.find((q) => q.id === selectedId) ?? questions[0];

  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "grading" | "done">("idle");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<GradeResult | null>(null);
  const { state: progress, addAttempt } = useProgress();
  const timers = useRef<number[]>([]);

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const canGrade = wordCount >= MIN_WORDS && status !== "grading";

  // Đổi câu hỏi → reset trạng thái
  useEffect(() => {
    clearTimers();
    setAnswer("");
    setResult(null);
    setStatus("idle");
  }, [question.id]);

  useEffect(() => clearTimers, []);

  function clearTimers() {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }

  function grade() {
    if (!canGrade) return;
    clearTimers();
    setStatus("grading");
    setResult(null);
    setStep(0);
    // Độ trễ giả lập cho cảm giác "AI đang chấm" — kết quả vẫn deterministic
    THINKING_STEPS.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setStep(i), i * 450));
    });
    timers.current.push(
      window.setTimeout(() => {
        const r = gradeAnswer(question, answer);
        setResult(r);
        setStatus("done");
        addAttempt(question.id, r.score);
      }, THINKING_STEPS.length * 450 + 150),
    );
  }

  function reset() {
    clearTimers();
    setAnswer("");
    setResult(null);
    setStatus("idle");
  }

  const history = progress.attempts.filter((a) => a.questionId === question.id);
  const best = history.length ? Math.max(...history.map((a) => a.score)) : null;

  return (
    <section
      aria-labelledby={`${ids}-title`}
      className="rounded-2xl border border-accent/30 bg-surface shadow-lg shadow-slate-900/5"
    >
      <header className="flex items-center gap-3 border-b border-line p-4 sm:p-5">
        <span className="grid size-9 place-items-center rounded-lg bg-accent-wash text-accent-soft ring-1 ring-accent/30">
          <BrainCircuit className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id={`${ids}-title`} className="font-semibold">
            Mock Interview Simulator
          </h2>
          <p className="text-xs text-ink-muted">Chấm theo rubric ngay trên trình duyệt · chỉ lưu điểm vào tiến độ</p>
        </div>
      </header>

      <div className="space-y-4 p-4 sm:p-5">
        {/* Question picker */}
        <div>
          <label htmlFor={`${ids}-select`} className="text-sm font-medium">
            Câu hỏi
          </label>
          <select
            id={`${ids}-select`}
            value={question.id}
            onChange={(e) => onSelect(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-lg border border-line bg-surface-raised px-3 text-sm text-ink focus:border-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {questions.map((q, i) => (
              <option key={q.id} value={q.id}>
                {String(i + 1).padStart(2, "0")} · {q.question.length > 70 ? `${q.question.slice(0, 70)}…` : q.question}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-line bg-surface-raised p-4">
          <div className="flex flex-wrap gap-1.5">
            <Badge>{question.category}</Badge>
            <DifficultyBadge level={question.difficulty} />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink">{question.question}</p>
        </div>

        {/* Answer */}
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={`${ids}-answer`} className="text-sm font-medium">
              Câu trả lời của bạn
            </label>
            <span className={cn("font-mono text-xs", wordCount < MIN_WORDS ? "text-ink-faint" : "text-ok")}>
              {wordCount} từ
            </span>
          </div>
          <textarea
            id={`${ids}-answer`}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") grade();
            }}
            rows={9}
            aria-describedby={`${ids}-help`}
            placeholder={
              question.category === "Behavioral (STAR)"
                ? "Situation: …\nTask: …\nAction: …\nResult: … (kèm số liệu)"
                : "1. Làm rõ yêu cầu / giả định\n2. Giải pháp & kiến trúc\n3. Trade-off và rủi ro\n4. Cách đo lường thành công"
            }
            className="mt-1.5 w-full resize-y rounded-lg border border-line bg-code p-3 font-mono text-[13px] leading-6 text-ink placeholder:text-ink-faint focus:border-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          />
          <p id={`${ids}-help`} className="mt-1.5 text-xs text-ink-faint">
            Tối thiểu {MIN_WORDS} từ · nên 120–300 từ · <kbd className="font-mono">Ctrl/⌘ + Enter</kbd> để chấm
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={grade}
            disabled={!canGrade}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-ink-faint"
          >
            {status === "grading" ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="size-4" aria-hidden />
            )}
            {status === "grading" ? "Đang chấm…" : "Chấm điểm AI giả lập"}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={!answer && !result}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line px-4 text-sm font-medium text-ink-muted transition-colors duration-200 hover:border-line-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="size-4" aria-hidden /> Làm lại
          </button>
        </div>

        {/* Live region: loading + result */}
        <div aria-live="polite" aria-busy={status === "grading"}>
          {status === "grading" && (
            <div className="space-y-2 rounded-xl border border-line bg-surface-raised p-4">
              {THINKING_STEPS.map((s, i) => (
                <p
                  key={s}
                  className={cn(
                    "flex items-center gap-2 font-mono text-xs transition-colors duration-200",
                    i < step ? "text-ok" : i === step ? "text-ink" : "text-ink-faint",
                  )}
                >
                  {i < step ? (
                    <CircleCheck className="size-3.5" aria-hidden />
                  ) : i === step ? (
                    <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <span className="size-3.5" aria-hidden />
                  )}
                  {s}
                </p>
              ))}
            </div>
          )}

          {status === "done" && result && <ResultPanel result={result} best={best} attempts={history.length} />}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function ResultPanel({ result, best, attempts }: { result: GradeResult; best: number | null; attempts: number }) {
  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center gap-4 rounded-xl border border-line bg-surface-raised p-4">
        <ScoreRing score={result.score} />
        <div className="min-w-0 space-y-1.5">
          <Badge tone={VERDICT_TONE[result.verdict]}>{result.verdict}</Badge>
          <p className="text-sm text-ink-muted">
            {result.wordCount} từ · lần thử {attempts}
            {best !== null && attempts > 1 && (
              <span className="inline-flex items-center gap-1">
                {" "}
                · <TrendingUp className="size-3.5" aria-hidden /> best {best}
              </span>
            )}
          </p>
        </div>
      </div>

      <ul className="space-y-3" aria-label="Điểm theo tiêu chí">
        {result.criteria.map((c) => {
          const pct = Math.round(c.ratio * 100);
          return (
            <li key={c.id}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{c.label}</span>
                <span className="font-mono text-xs text-ink-muted">
                  {Math.round(c.ratio * c.weight)}/{c.weight}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
                <div
                  className={cn("h-full rounded-full", pct >= 70 ? "bg-ok" : pct >= 40 ? "bg-warn" : "bg-danger")}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-ink-faint">{c.comment}</p>
            </li>
          );
        })}
      </ul>

      {(result.matchedConcepts.length > 0 || result.missedConcepts.length > 0) && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Concept interviewer chờ nghe</p>
          <ul className="flex flex-wrap gap-1.5">
            {result.matchedConcepts.map((c) => (
              <li key={c}>
                <Badge tone="ok">
                  <CircleCheck className="size-3" aria-hidden /> {c}
                  <span className="sr-only">(đã nhắc tới)</span>
                </Badge>
              </li>
            ))}
            {result.missedConcepts.map((c) => (
              <li key={c}>
                <Badge tone="danger">
                  <CircleX className="size-3" aria-hidden /> {c}
                  <span className="sr-only">(còn thiếu)</span>
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        <FeedbackList title="Điểm mạnh" items={result.strengths} tone="ok" />
        {result.improvements.length > 0 && (
          <FeedbackList title="Cần cải thiện để lên Senior" items={result.improvements} tone="warn" />
        )}
      </div>
    </div>
  );
}

function FeedbackList({ title, items, tone }: { title: string; items: string[]; tone: "ok" | "warn" }) {
  return (
    <div className={cn("rounded-xl border p-4", tone === "ok" ? "border-ok/25 bg-ok/5" : "border-warn/25 bg-warn/5")}>
      <p className={cn("text-sm font-medium", tone === "ok" ? "text-ok" : "text-warn")}>{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((s) => (
          <li key={s} className="flex gap-2 text-sm text-ink">
            <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", tone === "ok" ? "bg-ok" : "bg-warn")} aria-hidden />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const color = score >= 85 ? "var(--color-ok)" : score >= 70 ? "var(--color-accent-soft)" : score >= 50 ? "var(--color-warn)" : "var(--color-danger)";
  return (
    <div className="relative size-16 shrink-0" role="img" aria-label={`Điểm ${score} trên 100`}>
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-line)" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (score / 100) * c}
          className="transition-[stroke-dashoffset] duration-700 ease-out-soft"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-mono text-lg font-semibold" aria-hidden>
        {score}
      </span>
    </div>
  );
}
