import Link from "next/link";
import { ArrowRight, ChevronRight, MessagesSquare, Sparkles } from "lucide-react";
import { interviewQuestions, phases, questionCategories, skills } from "@/data/content";
import { phaseEstimatedHours } from "@/lib/curriculum";
import { ContinueLearning, LiveStats } from "@/components/dashboard/live-stats";
import { PhaseTabs } from "@/components/dashboard/phase-tabs";
import { LiveProgress } from "@/components/progress/live-progress";
import { Eyebrow } from "@/components/ui/primitives";

export default function DashboardPage() {
  const estimatedHours = Object.fromEntries(phases.map((p) => [p.id, phaseEstimatedHours(p)]));
  const totalHours = Object.values(estimatedHours).reduce((sum, h) => sum + h, 0);

  return (
    <div className="space-y-14">
      {/* ------------------------------------------------------------ Hero */}
      <section className="relative" aria-labelledby="hero-title">
        <div className="bg-grid pointer-events-none absolute -inset-x-4 -top-8 h-64" aria-hidden />
        <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <Eyebrow>{"// dashboard"}</Eyebrow>
            <h1 id="hero-title" className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Lộ trình <span className="text-accent-soft">QA Automation, SDET & AI-Driven Testing</span>
            </h1>
            <p className="mt-4 max-w-2xl text-ink-muted text-pretty">
              Hiện có {phases.length} giai đoạn nâng cao (~{totalHours} giờ học và thực hành): kiến trúc test có thể scale,
              đưa AI vào vòng đời QA và vận hành chất lượng ở quy mô enterprise. Học theo thứ tự gợi ý hoặc chọn
              đúng kỹ năng bạn cần; các giai đoạn nền tảng cho người mới đang được bổ sung.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Kỹ năng trong lộ trình">
              {skills.map((s) => (
                <li
                  key={s.id}
                  title={s.description}
                  className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-xs text-ink-muted"
                >
                  {s.title}
                </li>
              ))}
            </ul>
          </div>

          <ContinueLearning />
        </div>
      </section>

      {/* ----------------------------------------------------------- Stats */}
      <section aria-labelledby="stats-title">
        <h2 id="stats-title" className="sr-only">
          Thống kê tiến độ
        </h2>
        <LiveStats />
      </section>

      {/* -------------------------------------------------------- Timeline */}
      <section aria-labelledby="roadmap-title" className="space-y-5">
        <div>
          <Eyebrow>{"// roadmap"}</Eyebrow>
          <h2 id="roadmap-title" className="mt-2 text-2xl font-semibold tracking-tight">
            {phases.length} giai đoạn
          </h2>
        </div>

        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {phases.map((p) => {
            const ids = p.modules.flatMap((m) => m.topics.map((t) => t.id));
            return (
              <li key={p.id}>
                <Link
                  href={`/roadmap/${p.id}`}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-surface shadow-sm shadow-slate-900/[0.03] p-5 transition-colors duration-200 hover:border-accent/50 hover:bg-surface-raised"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-accent-soft">PHASE 0{p.order}</span>
                    <span className="font-mono text-xs text-ink-faint">~{estimatedHours[p.id]} giờ</span>
                  </div>
                  <h3 className="mt-3 font-semibold leading-snug">{p.title}</h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink-muted">{p.tagline}</p>
                  <div className="mt-5">
                    <LiveProgress topicIds={ids} label={`Tiến độ phase ${p.order}`} variant="compact" />
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent-soft">
                    Mở giai đoạn
                    <ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>

        <PhaseTabs phases={phases} estimatedHours={estimatedHours} />
      </section>

      {/* -------------------------------------------------- Interview CTA */}
      <section
        aria-labelledby="interview-cta-title"
        className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 via-surface to-surface p-6 sm:p-8"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-accent-soft">
              <Sparkles className="size-3.5" aria-hidden /> interview hub
            </p>
            <h2 id="interview-cta-title" className="mt-2 text-2xl font-semibold tracking-tight">
              {interviewQuestions.length} câu hỏi Senior / Staff / Principal
            </h2>
            <p className="mt-2 max-w-xl text-ink-muted">
              {questionCategories.join(" · ")}. Kèm gợi ý trả lời, key points và Mock Interview Simulator chấm theo rubric.
            </p>
          </div>
          <Link
            href="/interview"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-white transition-colors duration-200 hover:bg-accent-strong"
          >
            <MessagesSquare className="size-4" aria-hidden />
            Luyện phỏng vấn
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
