"use client";

import { useId, useRef, useState } from "react";
import { CircleCheck, CircleX, RotateCcw, Trophy } from "lucide-react";
import type { QuizQuestion } from "@/data/lessons/types";
import { QUIZ_PASS_SCORE, scoreQuiz, type QuizScore } from "@/lib/quiz";
import { useProgress } from "@/components/progress/progress-provider";
import { RichText } from "@/components/ui/rich-text";
import { cn } from "@/lib/cn";

/**
 * Quiz trắc nghiệm cuối bài: trả lời hết → nộp → xem đúng/sai kèm giải thích.
 * Điểm được lưu vào ProgressState.quizzes (best + last) và đồng bộ như tiến độ khác.
 */
export function LessonQuiz({ topicId, questions }: { topicId: string; questions: QuizQuestion[] }) {
  const baseId = useId();
  const resultRef = useRef<HTMLDivElement>(null);
  const { state, hydrated, recordQuiz } = useProgress();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizScore | null>(null);

  const answered = questions.filter((q) => answers[q.id]).length;
  const saved = hydrated ? state.quizzes[topicId] : undefined;
  const submitted = result !== null;

  function submit() {
    const r = scoreQuiz(questions, answers);
    setResult(r);
    recordQuiz(topicId, r.score);
    // Đưa focus tới kết quả để người dùng bàn phím/screen reader biết ngay
    requestAnimationFrame(() => resultRef.current?.focus());
  }

  function retry() {
    setAnswers({});
    setResult(null);
  }

  return (
    <div className="space-y-4">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
        <span>
          {questions.length} câu · đạt từ {QUIZ_PASS_SCORE}%
        </span>
        {saved && (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-faint">
            <Trophy className="size-3.5" aria-hidden />
            Cao nhất {saved.best}% · lần gần nhất {saved.last}%
          </span>
        )}
      </p>

      <ol className="space-y-4">
        {questions.map((q, qi) => {
          const name = `${baseId}-${q.id}`;
          const outcome = result?.results[qi];
          return (
            <li key={q.id}>
              <fieldset className="space-y-2.5 rounded-xl border border-line p-4">
                <legend className="px-1 text-sm font-medium text-ink">
                  <span className="mr-1.5 font-mono text-xs text-accent-soft">Câu {qi + 1}.</span>
                  <RichText text={q.prompt} />
                </legend>

                <div className="space-y-2">
                  {q.options.map((o) => {
                    const id = `${name}-${o.id}`;
                    const isSelected = answers[q.id] === o.id;
                    const isAnswer = o.id === q.answer;
                    return (
                      <label
                        key={o.id}
                        htmlFor={id}
                        className={cn(
                          "flex min-h-11 items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors duration-150",
                          !submitted && "cursor-pointer hover:border-line-strong",
                          !submitted && isSelected && "border-accent/50 bg-accent-wash",
                          !submitted && !isSelected && "border-line bg-surface",
                          submitted && isAnswer && "border-ok/40 bg-ok/10",
                          submitted && isSelected && !isAnswer && "border-danger/40 bg-danger/5",
                          submitted && !isSelected && !isAnswer && "border-line bg-surface opacity-75",
                        )}
                      >
                        <input
                          id={id}
                          type="radio"
                          name={name}
                          value={o.id}
                          checked={isSelected}
                          disabled={submitted}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: o.id }))}
                          className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
                        />
                        <span className="flex-1">
                          <RichText text={o.text} />
                        </span>
                        {submitted && isAnswer && (
                          <CircleCheck className="mt-0.5 size-4 shrink-0 text-ok" aria-label="Đáp án đúng" />
                        )}
                        {submitted && isSelected && !isAnswer && (
                          <CircleX className="mt-0.5 size-4 shrink-0 text-danger" aria-label="Bạn chọn, chưa đúng" />
                        )}
                      </label>
                    );
                  })}
                </div>

                {outcome && (
                  <p
                    className={cn(
                      "rounded-lg border-l-2 px-3 py-2 text-sm text-ink",
                      outcome.correct ? "border-ok bg-ok/5" : "border-danger bg-danger/5",
                    )}
                  >
                    <span className={cn("font-medium", outcome.correct ? "text-ok" : "text-danger")}>
                      {outcome.correct ? "Chính xác. " : outcome.selected ? "Chưa đúng. " : "Bạn chưa trả lời. "}
                    </span>
                    <RichText text={q.explanation} />
                  </p>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>

      {result ? (
        <div
          ref={resultRef}
          tabIndex={-1}
          role="status"
          className={cn(
            "flex flex-col gap-3 rounded-xl border p-4 outline-none sm:flex-row sm:items-center sm:justify-between",
            result.passed ? "border-ok/30 bg-ok/10" : "border-warn/30 bg-warn/5",
          )}
        >
          <p className={cn("text-sm font-medium", result.passed ? "text-ok" : "text-warn")}>
            Đúng {result.correct}/{result.total} · {result.score}% —{" "}
            {result.passed ? "Đạt. Kiến thức của bài này đã được kiểm tra." : "Chưa đạt. Đọc lại phần giải thích rồi thử lại."}
          </p>
          <button
            type="button"
            onClick={retry}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink hover:border-line-strong"
          >
            <RotateCcw className="size-4" aria-hidden /> Làm lại
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-muted" aria-live="polite">
            Đã trả lời {answered}/{questions.length}
          </p>
          <button
            type="button"
            onClick={submit}
            disabled={answered < questions.length}
            className="min-h-11 rounded-lg bg-accent px-5 text-sm font-medium text-white transition-colors duration-200 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            Nộp bài
          </button>
        </div>
      )}
    </div>
  );
}
