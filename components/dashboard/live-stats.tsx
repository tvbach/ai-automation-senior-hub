"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, CirclePlay, Flame, Gauge, ListChecks, MessagesSquare, Target } from "lucide-react";
import { allTopics, interviewQuestions } from "@/data/content";
import { computeStreak, doneSince, mockStats, summarizeTopics, topicStatus, WEEK } from "@/lib/progress";
import { useProgress } from "@/components/progress/progress-provider";
import { cn } from "@/lib/cn";

const ALL_IDS = allTopics.map((t) => t.topic.id);

interface CardProps {
  icon: typeof Flame;
  label: string;
  value: string;
  hint: string;
  chip?: { text: string; tone: "ok" | "neutral" | "warn" };
}

function StatTile({ icon: Icon, label, value, hint, chip }: CardProps) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-line bg-surface shadow-sm shadow-slate-900/[0.03] p-5">
      <p className="flex items-center gap-2 text-sm text-ink-muted">
        <Icon className="size-4 text-accent-soft" aria-hidden /> {label}
      </p>
      <div>
        <p className="font-mono text-3xl font-semibold tracking-tight text-ink">{value}</p>
        <p className="mt-1 text-xs text-ink-faint">{hint}</p>
      </div>
      <p
        className={cn(
          "inline-flex min-h-6 w-fit items-center rounded-md px-1.5 py-0.5 font-mono text-xs",
          !chip && "invisible",
          chip?.tone === "ok" && "bg-ok/10 text-ok",
          chip?.tone === "warn" && "bg-warn/10 text-warn",
          chip?.tone === "neutral" && "bg-surface-raised text-ink-muted",
        )}
      >
        {chip?.text ?? "·"}
      </p>
    </div>
  );
}

/** 4 thẻ thống kê — tính hoàn toàn từ dữ liệu tiến độ thật */
export function LiveStats() {
  const { state, hydrated } = useProgress();

  if (!hydrated) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[164px] animate-pulse rounded-2xl border border-line bg-surface shadow-sm shadow-slate-900/[0.03]" />
        ))}
      </div>
    );
  }

  const now = Date.now();
  const overall = summarizeTopics(state, ALL_IDS);
  const doneThisWeek = doneSince(state, ALL_IDS, now - WEEK);
  const streak = computeStreak(state.activity);
  const mock = mockStats(state, now);
  const delta = mock.weekAvg !== null && mock.previousAvg !== null ? mock.weekAvg - mock.previousAvg : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile
        icon={Target}
        label="Tiến độ lộ trình"
        value={`${overall.percent}%`}
        hint={`${overall.done}/${overall.total} topic hoàn thành · ${overall.inProgress} đang học`}
        chip={doneThisWeek ? { text: `+${doneThisWeek} topic tuần này`, tone: "ok" } : undefined}
      />
      <StatTile
        icon={Flame}
        label="Chuỗi ngày học"
        value={`${streak.current} ngày`}
        hint={streak.best ? `Kỷ lục: ${streak.best} ngày` : "Đánh dấu 1 topic hoặc luyện 1 câu để bắt đầu"}
        chip={
          streak.current === 0
            ? undefined
            : streak.activeToday
              ? { text: "Đã học hôm nay", tone: "ok" }
              : { text: "Học hôm nay để giữ chuỗi", tone: "warn" }
        }
      />
      <StatTile
        icon={Gauge}
        label="Điểm Mock Interview"
        value={mock.recentAvg === null ? "—" : `${mock.recentAvg}/100`}
        hint={mock.sessions ? `TB ${Math.min(mock.sessions, 10)} lần gần nhất · ${mock.sessions} lần luyện` : "Chưa luyện câu nào"}
        chip={delta === null ? undefined : { text: `${delta >= 0 ? "+" : ""}${delta} điểm so với trước`, tone: delta >= 0 ? "ok" : "warn" }}
      />
      <StatTile
        icon={MessagesSquare}
        label="Câu hỏi đã luyện"
        value={`${mock.questionsPracticed}/${interviewQuestions.length}`}
        hint={
          mock.questionsPracticed
            ? `${[...mock.bestByQuestion.values()].filter((s) => s >= 85).length} câu đạt ≥ 85 điểm`
            : "Mục tiêu: luyện đủ mọi câu, mỗi câu ≥ 85"
        }
      />
    </div>
  );
}

/** "Học tiếp" — gợi ý 3 topic tiếp theo dựa trên tiến độ thật */
export function ContinueLearning() {
  const { state, hydrated } = useProgress();

  const inProgress = allTopics.filter((t) => topicStatus(state, t.topic.id) === "in-progress");
  const todo = allTopics.filter((t) => topicStatus(state, t.topic.id) === "todo");
  const next = [...inProgress, ...todo].slice(0, 3);
  const allDone = hydrated && next.length === 0;

  return (
    <aside className="rounded-2xl border border-line bg-surface/80 shadow-sm shadow-slate-900/[0.03] p-5 backdrop-blur" aria-labelledby="continue-title">
      <p id="continue-title" className="flex items-center gap-2 text-sm font-medium">
        <CirclePlay className="size-4 text-accent-soft" aria-hidden /> Học tiếp
      </p>

      {!hydrated ? (
        <div className="mt-3 space-y-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-raised" />
          ))}
        </div>
      ) : allDone ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-ok">
          <BookOpenCheck className="size-4" aria-hidden /> Bạn đã hoàn thành toàn bộ lộ trình!
        </p>
      ) : (
        <ol className="mt-3 space-y-1">
          {next.map(({ topic, module, phase }) => {
            const status = topicStatus(state, topic.id);
            return (
              <li key={topic.id}>
                <Link
                  href={`/roadmap/${phase.id}/${module.id}#${topic.id}`}
                  className="group flex min-h-12 items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-150 hover:bg-surface-raised"
                >
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px]",
                      status === "in-progress" ? "bg-accent-wash text-accent-soft" : "bg-surface-raised text-ink-faint",
                    )}
                  >
                    {status === "in-progress" ? "đang học" : `P0${phase.order}`}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{topic.title}</span>
                    <span className="block truncate text-xs text-ink-faint">{module.title}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-ink-faint transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ol>
      )}
      <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-faint">
        <ListChecks className="size-3.5" aria-hidden /> Đánh dấu trạng thái ở cuối mỗi bài học trong module.
      </p>
    </aside>
  );
}
