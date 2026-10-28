import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Clock, ExternalLink, Flag, Lightbulb, SquareCheck } from "lucide-react";
import { getPhase, phases } from "@/data/content";
import { getLesson } from "@/data/lessons";
import { CodeBlock } from "@/components/ui/code-block";
import { Badge, Card, Eyebrow } from "@/components/ui/primitives";
import { LiveCount, LiveProgress } from "@/components/progress/live-progress";
import { LiveStatusIcon } from "@/components/progress/status-control";

type Props = { params: Promise<{ phaseId: string }> };

export function generateStaticParams() {
  return phases.map((p) => ({ phaseId: p.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { phaseId } = await params;
  const phase = getPhase(phaseId);
  return { title: phase ? phase.title : "Không tìm thấy" };
}

const KIND_LABEL = { docs: "Docs", article: "Bài viết", repo: "Repo", course: "Khoá học" } as const;

export default async function PhasePage({ params }: Props) {
  const { phaseId } = await params;
  const phase = getPhase(phaseId);
  if (!phase) notFound();

  const topicIds = phase.modules.flatMap((m) => m.topics.map((t) => t.id));
  const idx = phases.findIndex((p) => p.id === phase.id);
  const prev = phases[idx - 1];
  const next = phases[idx + 1];

  return (
    <article className="space-y-10">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> Dashboard
      </Link>

      {/* Header */}
      <header className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end">
        <div>
          <Eyebrow>{`// phase_0${phase.order} · ${phase.durationWeeks} tuần`}</Eyebrow>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{phase.title}</h1>
          <p className="mt-3 max-w-2xl text-ink-muted text-pretty">{phase.tagline}</p>
        </div>
        <Card className="space-y-2">
          <span className="text-sm text-ink-muted">Tiến độ của bạn</span>
          <LiveProgress topicIds={topicIds} label={`Tiến độ ${phase.shortTitle}`} />
        </Card>
      </header>

      <div className="rounded-2xl border border-accent/25 bg-accent-wash p-5">
        <p className="flex items-center gap-2 text-sm font-medium text-accent-soft">
          <Lightbulb className="size-4" aria-hidden /> Tận dụng background của bạn
        </p>
        <p className="mt-2 text-ink">{phase.leverage}</p>
      </div>

      {/* Modules */}
      <section aria-labelledby="modules-title" className="space-y-4">
        <h2 id="modules-title" className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <BookOpen className="size-5 text-accent-soft" aria-hidden /> Modules
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {phase.modules.map((m, mi) => {
            const ids = m.topics.map((t) => t.id);
            const minutes = m.topics.reduce((sum, t) => sum + (getLesson(t.id)?.minutes ?? 0), 0);
            return (
              <Link
                key={m.id}
                href={`/roadmap/${phase.id}/${m.id}`}
                className="group flex flex-col gap-4 rounded-2xl border border-line bg-surface shadow-sm shadow-slate-900/[0.03] p-5 transition-colors duration-200 hover:border-accent/50 hover:bg-surface-raised sm:p-6"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-xs text-accent-soft">
                      MODULE {phase.order}.{mi + 1}
                    </span>
                    <LiveCount topicIds={ids} />
                  </div>
                  <h3 className="mt-2 font-semibold">{m.title}</h3>
                  <p className="mt-1.5 text-sm text-ink-muted">{m.summary}</p>
                </div>
                <ul className="space-y-2.5">
                  {m.topics.map((t) => (
                    <li key={t.id} className="flex gap-2.5">
                      <span className="mt-1">
                        <LiveStatusIcon topicId={t.id} />
                      </span>
                      <p className="text-sm text-ink">{t.title}</p>
                    </li>
                  ))}
                </ul>
                <span className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-faint">
                    <Clock className="size-3.5" aria-hidden />
                    {m.topics.length} bài{minutes ? ` · ~${minutes} phút` : ""}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-accent-soft">
                    Vào học
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Capstone */}
      <section aria-labelledby="capstone-title">
        <Card className="border-warn/30">
          <h2 id="capstone-title" className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Flag className="size-5 text-warn" aria-hidden /> Capstone: {phase.capstone.title}
          </h2>
          <p className="mt-2 text-ink-muted">{phase.capstone.description}</p>
          <p className="mt-4 text-sm font-medium">Acceptance criteria</p>
          <ul className="mt-2 space-y-2">
            {phase.capstone.acceptance.map((a) => (
              <li key={a} className="flex gap-2.5 text-sm text-ink-muted">
                <SquareCheck className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
                {a}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Code samples */}
      <section aria-labelledby="samples-title" className="space-y-4">
        <h2 id="samples-title" className="text-xl font-semibold tracking-tight">
          Code mẫu thực chiến
        </h2>
        <div className="space-y-4">
          {phase.samples.map((s) => (
            <CodeBlock key={s.title} sample={s} />
          ))}
        </div>
      </section>

      {/* Resources */}
      <section aria-labelledby="resources-title" className="space-y-4">
        <h2 id="resources-title" className="text-xl font-semibold tracking-tight">
          Tài liệu tham khảo
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {phase.resources.map((r) => (
            <li key={r.url}>
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm transition-colors duration-200 hover:border-accent/50"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Badge>{KIND_LABEL[r.kind]}</Badge>
                  <span className="truncate">{r.title}</span>
                </span>
                <ExternalLink className="size-4 shrink-0 text-ink-faint" aria-hidden />
                <span className="sr-only">(mở tab mới)</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Prev / next */}
      <nav aria-label="Chuyển giai đoạn" className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
        {prev ? (
          <Link href={`/roadmap/${prev.id}`} className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden /> Phase 0{prev.order}: {prev.shortTitle}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/roadmap/${next.id}`} className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted hover:text-ink">
            Phase 0{next.order}: {next.shortTitle} <ArrowRight className="size-4" aria-hidden />
          </Link>
        ) : (
          <Link href="/interview" className="inline-flex min-h-11 items-center gap-2 text-sm text-accent-soft hover:text-ink">
            Sang Interview Hub <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </nav>
    </article>
  );
}
