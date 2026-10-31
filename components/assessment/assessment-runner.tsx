"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleCheck, CircleX, Compass, RotateCcw } from "lucide-react";
import { phases, skills } from "@/data/content";
import { assessmentQuestions, type AssessmentQuestion } from "@/data/assessment";
import { ASSESSMENT_STRONG, PHASE_ADVICE_LABEL, recommendPhases, scoreAssessment, type PhaseAdvice } from "@/lib/assessment";
import type { QuizQuestionResult } from "@/lib/quiz";
import { useProgress } from "@/components/progress/progress-provider";
import { RichText } from "@/components/ui/rich-text";
import { Badge, ProgressBar } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

type View = "intro" | "running" | "result";

const ADVICE_TONE: Record<PhaseAdvice, "ok" | "accent" | "warn"> = { skim: "ok", normal: "accent", study: "warn" };

const formatDate = (ms: number) =>
  new Date(ms).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

function Results({
  scores,
  at,
  review,
}: {
  scores: Record<string, number>;
  at: number;
  review?: { questions: AssessmentQuestion[]; results: QuizQuestionResult[] };
}) {
  const recs = recommendPhases(scores, phases, skills);
  const assessed = skills.filter((s) => s.id in scores);

  return (
    <div className="space-y-8">
      <section aria-labelledby="by-skill-title" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="by-skill-title" className="text-xl font-semibold tracking-tight">
            Điểm xuất phát theo kỹ năng
          </h2>
          <p className="font-mono text-xs text-ink-faint">Làm ngày {formatDate(at)}</p>
        </div>
        <ul className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {assessed.map((s) => (
            <li key={s.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink">{s.title}</span>
                <span className="font-mono text-ink-muted">{scores[s.id]}</span>
              </div>
              <ProgressBar value={scores[s.id]} label={`Assessment ${s.title}`} tone={scores[s.id] >= ASSESSMENT_STRONG ? "ok" : "accent"} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="by-phase-title" className="space-y-4">
        <h2 id="by-phase-title" className="text-xl font-semibold tracking-tight">
          Gợi ý cho từng giai đoạn
        </h2>
        <ul className="space-y-3">
          {recs.map((r) => (
            <li key={r.phase.id}>
              <Link
                href={`/roadmap/${r.phase.id}`}
                className="group flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 transition-colors duration-200 hover:border-accent/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0">
                  <span className="block font-medium text-ink">
                    <span className="mr-2 font-mono text-xs text-accent-soft">PHASE 0{r.phase.order}</span>
                    {r.phase.title}
                  </span>
                  <span className="mt-1 block text-xs text-ink-faint">
                    {r.skills.map((s) => `${s.title} ${s.score}`).join(" · ")}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge tone={ADVICE_TONE[r.advice]}>{PHASE_ADVICE_LABEL[r.advice]}</Badge>
                  <ArrowRight className="size-4 text-ink-faint transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-sm text-ink-muted">
          <span className="font-medium text-ink">Học lướt</span> nghĩa là có thể làm quiz cuối bài để kiểm tra ngay, chỉ đọc
          kỹ những bài chưa đạt. Trang Năng lực sẽ gợi ý theo cách đó cho các kỹ năng bạn đạt từ {ASSESSMENT_STRONG} điểm.
        </p>
      </section>

      {review && (
        <details className="rounded-2xl border border-line bg-surface">
          <summary className="flex min-h-12 cursor-pointer list-none items-center px-4 text-sm font-medium text-accent-soft">
            Xem lại đáp án ({review.results.filter((r) => r.correct).length}/{review.results.length} đúng)
          </summary>
          <ol className="space-y-4 border-t border-line p-4">
            {review.questions.map((q, i) => {
              const r = review.results[i];
              const chosen = q.options.find((o) => o.id === r.selected);
              const right = q.options.find((o) => o.id === q.answer);
              return (
                <li key={q.id} className="space-y-1.5 text-sm">
                  <p className="font-medium text-ink">
                    <span className="mr-1.5 font-mono text-xs text-accent-soft">Câu {i + 1}.</span>
                    <RichText text={q.prompt} />
                  </p>
                  <p className={cn("flex gap-2", r.correct ? "text-ok" : "text-danger")}>
                    {r.correct ? (
                      <CircleCheck className="mt-0.5 size-4 shrink-0" aria-label="Đúng" />
                    ) : (
                      <CircleX className="mt-0.5 size-4 shrink-0" aria-label="Sai" />
                    )}
                    <span>
                      Bạn chọn: <RichText text={chosen?.text ?? "(chưa trả lời)"} />
                    </span>
                  </p>
                  {!r.correct && right && (
                    <p className="text-ink">
                      Đáp án: <RichText text={right.text} />
                    </p>
                  )}
                  <p className="text-ink-muted">
                    <RichText text={q.explanation} />
                  </p>
                </li>
              );
            })}
          </ol>
        </details>
      )}
    </div>
  );
}

export function AssessmentRunner() {
  const baseId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { state, hydrated, saveAssessment } = useProgress();
  const [view, setView] = useState<View>("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [review, setReview] = useState<{ results: QuizQuestionResult[] } | null>(null);

  const questions = assessmentQuestions;
  const total = questions.length;
  const q = questions[step];
  const saved = hydrated ? state.assessment : null;

  // Chuyển câu → đưa focus về tiêu đề câu hỏi cho người dùng bàn phím/screen reader
  useEffect(() => {
    if (view === "running") headingRef.current?.focus();
  }, [step, view]);

  function start() {
    setAnswers({});
    setStep(0);
    setReview(null);
    setView("running");
  }

  function finish() {
    const r = scoreAssessment(questions, answers);
    saveAssessment(r.bySkill);
    setReview({ results: r.results });
    setView("result");
    window.scrollTo({ top: 0 });
  }

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-2xl border border-line bg-surface" aria-busy="true" />;
  }

  if (view === "running") {
    const selected = answers[q.id];
    const isLast = step === total - 1;
    const skillTitle = skills.find((s) => s.id === q.skill)?.title;
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex justify-between font-mono text-xs text-ink-muted">
            <span>
              Câu {step + 1}/{total} · {skillTitle}
            </span>
            <span>{Object.keys(answers).length} đã trả lời</span>
          </div>
          <ProgressBar value={((step + 1) / total) * 100} label="Tiến độ làm bài" />
        </div>

        <fieldset className="space-y-3 rounded-2xl border border-line bg-surface p-5 shadow-sm shadow-slate-900/[0.03] sm:p-6">
          <legend className="sr-only">Câu hỏi {step + 1}</legend>
          <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold leading-snug outline-none">
            <RichText text={q.prompt} />
          </h2>
          <div className="space-y-2">
            {q.options.map((o) => {
              const id = `${baseId}-${q.id}-${o.id}`;
              const isSelected = selected === o.id;
              return (
                <label
                  key={o.id}
                  htmlFor={id}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm transition-colors duration-150 hover:border-line-strong",
                    isSelected ? "border-accent/50 bg-accent-wash" : "border-line bg-surface",
                  )}
                >
                  <input
                    id={id}
                    type="radio"
                    name={`${baseId}-${q.id}`}
                    value={o.id}
                    checked={isSelected}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: o.id }))}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
                  />
                  <span>
                    <RichText text={o.text} />
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => (step === 0 ? setView("intro") : setStep(step - 1))}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink hover:border-line-strong"
          >
            <ArrowLeft className="size-4" aria-hidden /> {step === 0 ? "Thoát" : "Câu trước"}
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => (isLast ? finish() : setStep(step + 1))}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-white transition-colors duration-200 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLast ? "Xem kết quả" : "Câu tiếp"} <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  if (view === "result" && saved) {
    return (
      <div className="space-y-6">
        <Results scores={saved.scores} at={saved.at} review={review ? { questions, results: review.results } : undefined} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/skills"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-white hover:bg-accent-strong"
          >
            Xem gợi ý học tiếp <ArrowRight className="size-4" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={start}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink hover:border-line-strong"
          >
            <RotateCcw className="size-4" aria-hidden /> Làm lại
          </button>
        </div>
      </div>
    );
  }

  // intro
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-accent/30 bg-accent-wash p-5 sm:p-6">
        <p className="flex items-center gap-2 font-medium text-accent-soft">
          <Compass className="size-4" aria-hidden /> {total} câu · khoảng 10 phút · {skills.length} kỹ năng
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-ink">
          <li>Mỗi kỹ năng 2 câu, từ nền tảng đến nâng cao. Không biết thì cứ chọn phương án bạn nghĩ hợp lý nhất.</li>
          <li>Kết quả chỉ để gợi ý cách học, không cộng vào điểm năng lực.</li>
          <li>Có thể làm lại bất cứ lúc nào; chỉ lần gần nhất được lưu.</li>
        </ul>
        <button
          type="button"
          onClick={start}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-white hover:bg-accent-strong"
        >
          {saved ? "Làm lại assessment" : "Bắt đầu"} <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>

      {saved && <Results scores={saved.scores} at={saved.at} />}
    </div>
  );
}
