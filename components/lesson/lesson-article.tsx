import {
  ArrowRight,
  BookText,
  Clock,
  Dumbbell,
  ExternalLink,
  Lightbulb,
  ListChecks,
  MessageCircleQuestion,
  ClipboardCheck,
  Sparkles,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { Topic } from "@/data/content";
import type { Lesson } from "@/data/lessons/types";
import { CodeBlock } from "@/components/ui/code-block";
import { RichText } from "@/components/ui/rich-text";
import { Badge } from "@/components/ui/primitives";
import { StatusControl } from "@/components/progress/status-control";
import { LessonChecklist } from "./lesson-checklist";
import { LessonQuiz } from "./lesson-quiz";

function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h4 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-ink-faint">
        <Icon className="size-3.5" aria-hidden /> {title}
      </h4>
      {children}
    </section>
  );
}

export function LessonArticle({ index, topic, lesson }: { index: number; topic: Topic; lesson?: Lesson }) {
  return (
    <article id={topic.id} aria-labelledby={`${topic.id}-title`} className="scroll-mt-24 rounded-2xl border border-line bg-surface shadow-sm shadow-slate-900/[0.03]">
      {/* Header */}
      <header className="space-y-4 border-b border-line p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-accent-soft">BÀI {index}</span>
          {lesson && (
            <>
              <Badge>{lesson.level}</Badge>
              <span className="inline-flex items-center gap-1 font-mono text-xs text-ink-faint">
                <Clock className="size-3.5" aria-hidden /> ~{lesson.minutes} phút
              </span>
            </>
          )}
        </div>
        <h3 id={`${topic.id}-title`} className="text-xl font-semibold leading-snug tracking-tight text-balance sm:text-2xl">
          {topic.title}
        </h3>
        <StatusControl topicId={topic.id} topicTitle={topic.title} />
      </header>

      {!lesson ? (
        <div className="p-5 text-sm text-ink-muted sm:p-6">
          Bài học chi tiết cho topic này đang được biên soạn.
          {topic.note && <p className="mt-2 text-ink-faint">Gợi ý: {topic.note}</p>}
        </div>
      ) : (
        <div className="space-y-8 p-5 sm:p-6">
          {/* Why */}
          <p className="rounded-xl border-l-2 border-accent bg-accent-wash px-4 py-3 text-ink">
            <span className="font-medium text-accent-soft">Vì sao quan trọng: </span>
            <RichText text={lesson.why} />
          </p>

          <Section icon={BookText} title="Hiểu cho đúng">
            <div className="space-y-3 leading-relaxed text-ink">
              {lesson.explain.map((p, i) => (
                <p key={i}>
                  <RichText text={p} />
                </p>
              ))}
            </div>
            {lesson.analogy && (
              <div className="flex gap-3 rounded-xl border border-warn/25 bg-warn/5 p-4">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
                <p className="text-sm text-ink">
                  <span className="font-medium text-warn">Hình dung đơn giản: </span>
                  <RichText text={lesson.analogy} />
                </p>
              </div>
            )}
          </Section>

          <Section icon={Sparkles} title="Khái niệm chính">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {lesson.concepts.map((c) => (
                <div key={c.term} className="rounded-xl border border-line bg-surface-raised p-4">
                  <dt className="font-mono text-sm font-medium text-accent-soft">{c.term}</dt>
                  <dd className="mt-1 text-sm text-ink-muted">
                    <RichText text={c.meaning} />
                  </dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section icon={BookText} title={`Ví dụ (${lesson.examples.length})`}>
            <div className="space-y-6">
              {lesson.examples.map((ex, i) => (
                <div key={ex.title} className="space-y-3">
                  <p className="font-medium">
                    <span className="mr-2 font-mono text-xs text-ink-faint">{i + 1}.</span>
                    {ex.title}
                  </p>
                  {ex.intro && (
                    <p className="text-sm text-ink-muted">
                      <RichText text={ex.intro} />
                    </p>
                  )}
                  <CodeBlock sample={ex.code} />
                  {ex.notes && (
                    <ul className="space-y-1.5">
                      {ex.notes.map((n) => (
                        <li key={n} className="flex gap-2 text-sm text-ink-muted">
                          <ArrowRight className="mt-1 size-3.5 shrink-0 text-accent-soft" aria-hidden />
                          <span>
                            <RichText text={n} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section icon={TriangleAlert} title="Lỗi người mới hay gặp">
            <ul className="space-y-3">
              {lesson.mistakes.map((m) => (
                <li key={m.wrong} className="grid grid-cols-1 gap-2 rounded-xl border border-line p-4 sm:grid-cols-2">
                  <p className="text-sm">
                    <span className="mr-1.5 font-mono text-xs text-danger">✗ SAI</span>
                    <RichText text={m.wrong} />
                  </p>
                  <p className="text-sm">
                    <span className="mr-1.5 font-mono text-xs text-ok">✓ ĐÚNG</span>
                    <RichText text={m.fix} />
                  </p>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Dumbbell} title="Bài tập thực hành">
            <div className="space-y-3 rounded-xl border border-line bg-surface-raised p-4 sm:p-5">
              <p className="text-ink">
                <RichText text={lesson.exercise.task} />
              </p>
              {lesson.exercise.steps && (
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ink-muted marker:font-mono marker:text-accent-soft">
                  {lesson.exercise.steps.map((s) => (
                    <li key={s}>
                      <RichText text={s} />
                    </li>
                  ))}
                </ol>
              )}
              {lesson.exercise.hint && (
                <details className="group rounded-lg border border-line bg-surface">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center px-3 text-sm font-medium text-accent-soft">
                    Gợi ý
                  </summary>
                  <p className="border-t border-line px-3 py-3 text-sm text-ink-muted">
                    <RichText text={lesson.exercise.hint} />
                  </p>
                </details>
              )}
              {(lesson.exercise.solution || lesson.exercise.solutionNote) && (
                <details className="rounded-lg border border-line bg-surface">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center px-3 text-sm font-medium text-accent-soft">
                    Xem lời giải
                  </summary>
                  <div className="space-y-3 border-t border-line p-3">
                    {lesson.exercise.solutionNote && (
                      <p className="text-sm text-ink-muted">
                        <RichText text={lesson.exercise.solutionNote} />
                      </p>
                    )}
                    {lesson.exercise.solution && <CodeBlock sample={lesson.exercise.solution} />}
                  </div>
                </details>
              )}
            </div>
          </Section>

          {lesson.interviewTip && (
            <Section icon={MessageCircleQuestion} title="Nói trong phỏng vấn (30 giây)">
              <blockquote className="rounded-xl border border-accent/25 bg-accent-wash p-4 text-sm italic text-ink">
                <RichText text={lesson.interviewTip} />
              </blockquote>
            </Section>
          )}

          {lesson.resources && lesson.resources.length > 0 && (
            <Section icon={ExternalLink} title="Đọc thêm">
              <ul className="space-y-2">
                {lesson.resources.map((r) => (
                  <li key={r.url}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-9 items-center gap-1.5 text-sm text-accent-soft underline-offset-4 hover:underline"
                    >
                      {r.title} <ExternalLink className="size-3.5" aria-hidden />
                      <span className="sr-only">(mở tab mới)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {lesson.quiz && lesson.quiz.length > 0 && (
            <Section icon={ClipboardCheck} title="Kiểm tra nhanh">
              <LessonQuiz topicId={topic.id} questions={lesson.quiz} />
            </Section>
          )}

          <Section icon={ListChecks} title="Tự kiểm tra">
            <LessonChecklist topicId={topic.id} items={lesson.checklist} />
          </Section>
        </div>
      )}
    </article>
  );
}
