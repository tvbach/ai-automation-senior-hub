import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, Clock, ListOrdered } from "lucide-react";
import { getModule, phases } from "@/data/content";
import { getLesson } from "@/data/lessons";
import { LessonArticle } from "@/components/lesson/lesson-article";
import { LiveProgress } from "@/components/progress/live-progress";
import { LiveStatusIcon } from "@/components/progress/status-control";
import { Eyebrow } from "@/components/ui/primitives";

type Props = { params: Promise<{ phaseId: string; moduleId: string }> };

export function generateStaticParams() {
  return phases.flatMap((p) => p.modules.map((m) => ({ phaseId: p.id, moduleId: m.id })));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { phaseId, moduleId } = await params;
  const found = getModule(phaseId, moduleId);
  return found
    ? { title: found.module.title, description: found.module.summary }
    : { title: "Không tìm thấy" };
}

/** Danh sách phẳng module để điều hướng trước/sau xuyên phase */
const MODULE_ORDER = phases.flatMap((p) => p.modules.map((m) => ({ phase: p, module: m })));

export default async function ModulePage({ params }: Props) {
  const { phaseId, moduleId } = await params;
  const found = getModule(phaseId, moduleId);
  if (!found) notFound();
  const { phase, module: mod } = found;

  const moduleIndex = phase.modules.findIndex((m) => m.id === mod.id);
  const flatIdx = MODULE_ORDER.findIndex((x) => x.module.id === mod.id && x.phase.id === phase.id);
  const prev = MODULE_ORDER[flatIdx - 1];
  const next = MODULE_ORDER[flatIdx + 1];

  const topicIds = mod.topics.map((t) => t.id);
  const lessons = mod.topics.map((t) => getLesson(t.id));
  const minutes = lessons.reduce((s, l) => s + (l?.minutes ?? 0), 0);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-muted">
          <li>
            <Link href="/" className="inline-flex min-h-11 items-center hover:text-ink">
              Dashboard
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-4 text-ink-faint" />
          </li>
          <li>
            <Link href={`/roadmap/${phase.id}`} className="inline-flex min-h-11 items-center hover:text-ink">
              Phase 0{phase.order}
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-4 text-ink-faint" />
          </li>
          <li aria-current="page" className="min-w-0 truncate text-ink">
            Module {phase.order}.{moduleIndex + 1}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end">
        <div>
          <Eyebrow>{`// module_${phase.order}.${moduleIndex + 1} · ${phase.shortTitle}`}</Eyebrow>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{mod.title}</h1>
          <p className="mt-3 max-w-2xl text-ink-muted text-pretty">{mod.summary}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-ink-faint">
            <Clock className="size-3.5" aria-hidden /> {mod.topics.length} bài{minutes ? ` · ~${minutes} phút` : ""}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="mb-2 text-sm text-ink-muted">Tiến độ module</p>
          <LiveProgress topicIds={topicIds} label={`Tiến độ ${mod.title}`} />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
        {/* TOC */}
        <nav aria-label="Mục lục bài học" className="lg:sticky lg:top-24">
          <p className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-ink-faint">
            <ListOrdered className="size-3.5" aria-hidden /> Bài học
          </p>
          <ol className="space-y-1 rounded-2xl border border-line bg-surface p-2">
            {mod.topics.map((t, i) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  className="flex min-h-11 items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-muted transition-colors duration-150 hover:bg-surface-raised hover:text-ink"
                >
                  <span className="mt-0.5">
                    <LiveStatusIcon topicId={t.id} />
                  </span>
                  <span>
                    <span className="mr-1 font-mono text-xs text-ink-faint">{i + 1}.</span>
                    {t.title}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Lessons */}
        <div className="min-w-0 space-y-8">
          {mod.topics.map((t, i) => (
            <LessonArticle key={t.id} index={i + 1} topic={t} lesson={lessons[i]} />
          ))}
        </div>
      </div>

      {/* Prev / next module */}
      <nav aria-label="Chuyển module" className="grid grid-cols-1 gap-3 border-t border-line pt-6 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/roadmap/${prev.phase.id}/${prev.module.id}`}
            className="group flex min-h-16 flex-col justify-center rounded-xl border border-line bg-surface px-4 py-3 transition-colors hover:border-line-strong"
          >
            <span className="inline-flex items-center gap-1 font-mono text-xs text-ink-faint">
              <ArrowLeft className="size-3.5" aria-hidden /> Module trước
            </span>
            <span className="mt-1 text-sm text-ink">{prev.module.title}</span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
        {next ? (
          <Link
            href={`/roadmap/${next.phase.id}/${next.module.id}`}
            className="group flex min-h-16 flex-col justify-center rounded-xl border border-line bg-surface px-4 py-3 text-right transition-colors hover:border-accent/50"
          >
            <span className="inline-flex items-center justify-end gap-1 font-mono text-xs text-ink-faint">
              Module tiếp theo <ArrowRight className="size-3.5" aria-hidden />
            </span>
            <span className="mt-1 text-sm text-ink">{next.module.title}</span>
          </Link>
        ) : (
          <Link
            href="/interview"
            className="flex min-h-16 flex-col justify-center rounded-xl border border-accent/40 bg-accent-wash px-4 py-3 text-right"
          >
            <span className="font-mono text-xs text-accent-soft">Hoàn thành lộ trình</span>
            <span className="mt-1 text-sm text-ink">Sang Interview Hub →</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
