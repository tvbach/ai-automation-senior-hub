"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardCheck, Compass, RotateCcw, Sparkles } from "lucide-react";
import {
  ACTION_LABEL,
  computeCompetency,
  LEVEL_LABEL,
  prioritizedActions,
  type CompetencyLevel,
  type SkillCompetency,
  type StudyAction,
  type StudyActionKind,
} from "@/lib/competency";
import { useProgress } from "@/components/progress/progress-provider";
import { Badge, ProgressBar } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

const LEVEL_TONE: Record<CompetencyLevel, "neutral" | "accent" | "ok" | "warn"> = {
  "no-content": "neutral",
  "not-started": "neutral",
  weak: "warn",
  developing: "accent",
  solid: "ok",
};

const ACTION_ICON: Record<StudyActionKind, typeof RotateCcw> = {
  retake: RotateCcw,
  quiz: ClipboardCheck,
  learn: BookOpen,
};

export function LevelBadge({ level }: { level: CompetencyLevel }) {
  return <Badge tone={LEVEL_TONE[level]}>{LEVEL_LABEL[level]}</Badge>;
}

/** Một dòng gợi ý: icon loại việc + tên bài + module, dẫn tới đúng bài trong module */
export function ActionLink({ action, showSkill }: { action: StudyAction; showSkill?: string }) {
  const Icon = ACTION_ICON[action.kind];
  return (
    <Link
      href={action.href}
      className="group flex min-h-12 items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-150 hover:bg-surface-raised"
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg",
          action.kind === "retake" ? "bg-warn/10 text-warn" : "bg-accent-wash text-accent-soft",
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-ink">
          <span className="font-medium">{ACTION_LABEL[action.kind]}:</span> {action.topicTitle}
        </span>
        <span className="block truncate text-xs text-ink-faint">
          {showSkill ? `${showSkill} · ` : ""}
          {action.moduleTitle}
          {action.best !== undefined ? ` · cao nhất ${action.best}%` : ""}
        </span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-ink-faint transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

function SkillCard({ c }: { c: SkillCompetency }) {
  const empty = c.level === "no-content";
  return (
    <li className={cn("flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm shadow-slate-900/[0.03]", empty && "bg-surface-raised")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug">{c.skill.title}</h3>
          <p className="mt-1 text-sm text-ink-muted">{c.skill.description}</p>
        </div>
        <LevelBadge level={c.level} />
      </div>

      {empty ? (
        <p className="text-sm text-ink-faint">
          Bài học cho kỹ năng này sẽ được bổ sung khi mở rộng lộ trình cho người mới.
          {c.assessed !== undefined && ` Điểm đầu vào: ${c.assessed}.`}
        </p>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex items-end justify-between font-mono text-xs text-ink-muted">
              <span>
                Quiz đạt {c.passed}/{c.topicCount} · hoàn thành {c.done}/{c.topicCount}
                {c.assessed !== undefined && ` · đầu vào ${c.assessed}`}
              </span>
              <span className="text-lg font-semibold text-ink">{c.score}</span>
            </div>
            <ProgressBar value={c.score} label={`Năng lực ${c.skill.title}`} tone={c.level === "solid" ? "ok" : "accent"} />
          </div>

          {c.actions.length > 0 ? (
            <details className="group rounded-xl border border-line">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 text-sm font-medium text-accent-soft">
                Gợi ý tiếp theo ({Math.min(c.actions.length, 3)})
                <ArrowRight className="size-4 transition-transform duration-150 group-open:rotate-90" aria-hidden />
              </summary>
              <div className="border-t border-line p-1.5">
                {c.actions.slice(0, 3).map((a) => (
                  <ActionLink key={a.topicId} action={a} />
                ))}
              </div>
            </details>
          ) : (
            <p className="text-sm text-ok">Đã làm đạt quiz và hoàn thành mọi bài của kỹ năng này.</p>
          )}
        </>
      )}
    </li>
  );
}

function AssessmentBanner({ at }: { at?: number }) {
  return (
    <Link
      href="/assessment"
      className="group flex min-h-12 items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm transition-colors duration-200 hover:border-accent/50"
    >
      <Compass className="size-4 shrink-0 text-accent-soft" aria-hidden />
      <span className="flex-1 text-ink">
        {at
          ? `Skill Assessment gần nhất: ${new Date(at).toLocaleDateString("vi-VN")}. Kỹ năng đạt cao được gợi ý làm quiz kiểm tra thay vì học lại.`
          : "Làm Skill Assessment (22 câu, ~10 phút) để biết nên học kỹ hay học lướt từng giai đoạn."}
      </span>
      <span className="shrink-0 font-medium text-accent-soft">{at ? "Làm lại" : "Bắt đầu"}</span>
    </Link>
  );
}

export function SkillsBoard() {
  const { state, hydrated } = useProgress();

  if (!hydrated) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-busy="true">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl border border-line bg-surface" />
        ))}
      </div>
    );
  }

  const competencies = computeCompetency(state);
  const next = prioritizedActions(competencies, 3);
  const titleOf = new Map(competencies.map((c) => [c.skill.id, c.skill.title]));

  return (
    <div className="space-y-8">
      <AssessmentBanner at={state.assessment?.at} />
      <section aria-labelledby="next-title" className="rounded-2xl border border-accent/30 bg-accent-wash p-4 sm:p-5">
        <h2 id="next-title" className="flex items-center gap-2 text-sm font-medium text-accent-soft">
          <Sparkles className="size-4" aria-hidden /> Ưu tiên tiếp theo
        </h2>
        {next.length ? (
          <div className="mt-2">
            {next.map((a) => (
              <ActionLink key={a.topicId} action={a} showSkill={titleOf.get(a.skillId)} />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink">Bạn đã nắm chắc mọi kỹ năng hiện có bài học. Hãy luyện thêm ở Interview Hub.</p>
        )}
      </section>

      <section aria-labelledby="skills-title" className="space-y-4">
        <h2 id="skills-title" className="text-xl font-semibold tracking-tight">
          {competencies.length} nhóm kỹ năng
        </h2>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {competencies.map((c) => (
            <SkillCard key={c.skill.id} c={c} />
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Thẻ tóm tắt cho Dashboard: 3 kỹ năng cần chú ý nhất + gợi ý đầu tiên */
export function SkillSnapshot() {
  const { state, hydrated } = useProgress();

  if (!hydrated) {
    return <div className="h-56 animate-pulse rounded-2xl border border-line bg-surface" aria-busy="true" />;
  }

  const competencies = computeCompetency(state).filter((c) => c.level !== "no-content");
  const active = competencies.filter((c) => c.level !== "not-started");
  const focus = (active.length ? active : competencies).slice().sort((a, b) => a.score - b.score).slice(0, 3);
  const [first] = prioritizedActions(competencies, 1);

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm shadow-slate-900/[0.03]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{active.length ? "Kỹ năng cần chú ý" : "Bắt đầu với các kỹ năng"}</p>
        <Link href="/skills" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-accent-soft">
          Xem tất cả <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <ul className="mt-2 space-y-3">
        {focus.map((c) => (
          <li key={c.skill.id} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-ink">{c.skill.title}</span>
              <span className="flex shrink-0 items-center gap-2">
                <LevelBadge level={c.level} />
                <span className="w-8 text-right font-mono text-ink-muted">{c.score}</span>
              </span>
            </div>
            <ProgressBar value={c.score} label={`Năng lực ${c.skill.title}`} tone={c.level === "solid" ? "ok" : "accent"} />
          </li>
        ))}
      </ul>
      {first && (
        <div className="mt-4 border-t border-line pt-2">
          <ActionLink action={first} />
        </div>
      )}
      {!state.assessment && (
        <Link
          href="/assessment"
          className="mt-3 flex min-h-11 items-center gap-2 rounded-lg border border-dashed border-accent/40 px-3 text-sm text-accent-soft hover:bg-accent-wash"
        >
          <Compass className="size-4 shrink-0" aria-hidden />
          Chưa biết bắt đầu từ đâu? Làm Skill Assessment (22 câu, ~10 phút)
        </Link>
      )}
    </div>
  );
}
