/**
 * lib/progress.ts
 * ----------------------------------------------------------------------------
 * Mô hình tiến độ học + các hàm thuần (pure) để merge & tính thống kê.
 * Dùng chung cho client (ProgressProvider) và server (/api/progress).
 *
 * Thiết kế đồng bộ nhiều thiết bị: mỗi thay đổi mang timestamp `at`, merge
 * theo "bản mới nhất thắng" cho từng topic → điện thoại và Mac sửa song song
 * vẫn không ghi đè mất dữ liệu của nhau.
 * ----------------------------------------------------------------------------
 */
import type { TopicStatus } from "@/data/content";

export interface TopicProgress {
  status: TopicStatus;
  /** epoch ms của lần đổi trạng thái gần nhất */
  at: number;
}

export interface Attempt {
  questionId: string;
  score: number;
  at: number;
}

export interface ProgressState {
  version: 1;
  topics: Record<string, TopicProgress>;
  attempts: Attempt[];
  /** Ngày có hoạt động học, dạng YYYY-MM-DD theo giờ địa phương của người dùng */
  activity: string[];
}

export const MAX_ATTEMPTS = 300;
export const MAX_ACTIVITY_DAYS = 500;
const STATUSES: readonly TopicStatus[] = ["todo", "in-progress", "done"];

export function emptyProgress(): ProgressState {
  return { version: 1, topics: {}, attempts: [], activity: [] };
}

/* -------------------------------------------------------------- validation */

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isTime = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v > 0 && v < 4102444800000; // < năm 2100
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const ID_RE = /^[a-z0-9-]{1,64}$/;

/**
 * Chuẩn hoá dữ liệu không tin cậy (localStorage, request body) về ProgressState hợp lệ.
 * Bỏ qua mọi field lạ thay vì throw — dữ liệu hỏng không được làm sập app.
 */
export function sanitizeProgress(input: unknown): ProgressState {
  const out = emptyProgress();
  if (!isObj(input)) return out;

  if (isObj(input.topics)) {
    for (const [id, v] of Object.entries(input.topics)) {
      if (!ID_RE.test(id) || !isObj(v)) continue;
      if (!STATUSES.includes(v.status as TopicStatus) || !isTime(v.at)) continue;
      out.topics[id] = { status: v.status as TopicStatus, at: v.at };
    }
  }

  if (Array.isArray(input.attempts)) {
    for (const a of input.attempts) {
      if (!isObj(a) || typeof a.questionId !== "string" || !ID_RE.test(a.questionId)) continue;
      if (typeof a.score !== "number" || a.score < 0 || a.score > 100 || !isTime(a.at)) continue;
      out.attempts.push({ questionId: a.questionId, score: Math.round(a.score), at: a.at });
    }
    out.attempts = dedupeAttempts(out.attempts);
  }

  if (Array.isArray(input.activity)) {
    out.activity = [...new Set(input.activity.filter((d): d is string => typeof d === "string" && DAY_RE.test(d)))]
      .sort()
      .slice(-MAX_ACTIVITY_DAYS);
  }
  return out;
}

function dedupeAttempts(list: Attempt[]): Attempt[] {
  const map = new Map<string, Attempt>();
  for (const a of list) map.set(`${a.questionId}@${a.at}`, a);
  return [...map.values()].sort((a, b) => a.at - b.at).slice(-MAX_ATTEMPTS);
}

/* ------------------------------------------------------------------- merge */

/** Gộp 2 bản tiến độ: topic lấy bản mới nhất, attempts & activity lấy hợp. */
export function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  const topics: Record<string, TopicProgress> = { ...a.topics };
  for (const [id, t] of Object.entries(b.topics)) {
    const cur = topics[id];
    if (!cur || t.at > cur.at) topics[id] = t;
  }
  return {
    version: 1,
    topics,
    attempts: dedupeAttempts([...a.attempts, ...b.attempts]),
    activity: [...new Set([...a.activity, ...b.activity])].sort().slice(-MAX_ACTIVITY_DAYS),
  };
}

export function sameProgress(a: ProgressState, b: ProgressState): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/* ------------------------------------------------------------------ dates */

/** YYYY-MM-DD theo giờ địa phương của máy đang chạy */
export function localDay(ms: number = Date.now()): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number);
  // Dùng UTC noon để tránh lệch do DST
  const t = Date.UTC(y, m - 1, d, 12) + delta * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** Chuỗi ngày học liên tiếp tính đến hôm nay (hoặc hôm qua nếu hôm nay chưa học) */
export function computeStreak(activity: string[], today: string = localDay()) {
  const set = new Set(activity);
  let cursor = set.has(today) ? today : shiftDay(today, -1);
  let current = 0;
  while (set.has(cursor)) {
    current++;
    cursor = shiftDay(cursor, -1);
  }

  // Kỷ lục
  const sorted = [...set].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && shiftDay(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best, activeToday: set.has(today) };
}

/* ------------------------------------------------------------------- stats */

export function topicStatus(state: ProgressState, id: string): TopicStatus {
  return state.topics[id]?.status ?? "todo";
}

export function summarizeTopics(state: ProgressState, topicIds: string[]) {
  let done = 0;
  let inProgress = 0;
  for (const id of topicIds) {
    const s = topicStatus(state, id);
    if (s === "done") done++;
    else if (s === "in-progress") inProgress++;
  }
  const total = topicIds.length;
  return { total, done, inProgress, percent: total ? Math.round((done / total) * 100) : 0 };
}

const WEEK = 7 * 86_400_000;

export function doneSince(state: ProgressState, topicIds: string[], sinceMs: number) {
  return topicIds.filter((id) => {
    const t = state.topics[id];
    return t?.status === "done" && t.at >= sinceMs;
  }).length;
}

export function mockStats(state: ProgressState, now: number = Date.now()) {
  const attempts = state.attempts;
  const avg = (xs: Attempt[]) => (xs.length ? Math.round(xs.reduce((s, a) => s + a.score, 0) / xs.length) : null);
  const recent = attempts.slice(-10);
  const thisWeek = attempts.filter((a) => a.at >= now - WEEK);
  const before = attempts.filter((a) => a.at < now - WEEK).slice(-10);
  const bestByQuestion = new Map<string, number>();
  for (const a of attempts) bestByQuestion.set(a.questionId, Math.max(bestByQuestion.get(a.questionId) ?? 0, a.score));
  return {
    sessions: attempts.length,
    recentAvg: avg(recent),
    weekAvg: avg(thisWeek),
    previousAvg: avg(before),
    questionsPracticed: bestByQuestion.size,
    bestByQuestion,
  };
}

export { WEEK };
