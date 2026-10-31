/**
 * lib/progress.ts
 * ----------------------------------------------------------------------------
 * Mô hình tiến độ học + các hàm thuần (pure) để merge & tính thống kê.
 * Dùng chung cho client (ProgressProvider) và server (/api/progress).
 *
 * Thiết kế đồng bộ nhiều thiết bị: mỗi thay đổi mang timestamp `at`, merge
 * theo "bản mới nhất thắng" cho từng topic → điện thoại và Mac sửa song song
 * vẫn không ghi đè mất dữ liệu của nhau.
 *
 * Phiên bản schema:
 *   v1 — topics, attempts, activity
 *   v2 — thêm quizzes, labs, assessment
 * sanitizeProgress() nhận mọi phiên bản và luôn trả về bản mới nhất, nên dữ liệu
 * v1 (localStorage, Redis, client cũ gửi lên) được nâng cấp mà không mất gì.
 * ----------------------------------------------------------------------------
 */
import type { TopicStatus } from "@/data/content";

export const PROGRESS_VERSION = 2;

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

/** Kết quả quiz của một bài học (khoá theo Topic.id), điểm 0–100 */
export interface QuizResult {
  best: number;
  last: number;
  /** epoch ms của lần làm gần nhất */
  at: number;
}

export type LabStatus = "in-progress" | "submitted";

/** Trạng thái một lab (khoá theo Lab.id) */
export interface LabProgress {
  status: LabStatus;
  /** Link bằng chứng (repo, PR, report) — chỉ chấp nhận https */
  evidenceUrl?: string;
  at: number;
}

/** Kết quả Skill Assessment gần nhất: điểm 0–100 theo SkillId */
export interface AssessmentResult {
  at: number;
  scores: Record<string, number>;
}

export interface ProgressState {
  version: typeof PROGRESS_VERSION;
  topics: Record<string, TopicProgress>;
  attempts: Attempt[];
  /** Ngày có hoạt động học, dạng YYYY-MM-DD theo giờ địa phương của người dùng */
  activity: string[];
  quizzes: Record<string, QuizResult>;
  labs: Record<string, LabProgress>;
  assessment: AssessmentResult | null;
}

export const MAX_ATTEMPTS = 300;
export const MAX_ACTIVITY_DAYS = 500;
export const MAX_EVIDENCE_URL_LENGTH = 300;
const MAX_ASSESSMENT_SKILLS = 50;
const STATUSES: readonly TopicStatus[] = ["todo", "in-progress", "done"];
const LAB_STATUSES: readonly LabStatus[] = ["in-progress", "submitted"];

export function emptyProgress(): ProgressState {
  return {
    version: PROGRESS_VERSION,
    topics: {},
    attempts: [],
    activity: [],
    quizzes: {},
    labs: {},
    assessment: null,
  };
}

/* -------------------------------------------------------------- validation */

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isTime = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v > 0 && v < 4102444800000; // < năm 2100
const isScore = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Định dạng hợp lệ cho mọi ID dùng làm khoá tiến độ (topic, câu hỏi, lab, skill) */
export const PROGRESS_ID_RE = /^[a-z0-9-]{1,64}$/;
const ID_RE = PROGRESS_ID_RE;

/** Chỉ nhận URL https hợp lệ — chặn javascript:, data:, http: khi render thành link */
export function isSafeEvidenceUrl(v: unknown): v is string {
  if (typeof v !== "string" || v.length > MAX_EVIDENCE_URL_LENGTH) return false;
  try {
    const url = new URL(v);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

/**
 * Chuẩn hoá dữ liệu không tin cậy (localStorage, request body) về ProgressState hợp lệ.
 * Bỏ qua mọi field lạ thay vì throw — dữ liệu hỏng không được làm sập app.
 * Nhận cả schema v1 (chưa có quizzes/labs/assessment) — đây chính là bước migrate.
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

  if (isObj(input.quizzes)) {
    for (const [id, v] of Object.entries(input.quizzes)) {
      if (!ID_RE.test(id) || !isObj(v)) continue;
      if (!isScore(v.best) || !isScore(v.last) || !isTime(v.at)) continue;
      const last = Math.round(v.last);
      // best không thể thấp hơn last — sửa thay vì loại bỏ
      out.quizzes[id] = { best: Math.max(Math.round(v.best), last), last, at: v.at };
    }
  }

  if (isObj(input.labs)) {
    for (const [id, v] of Object.entries(input.labs)) {
      if (!ID_RE.test(id) || !isObj(v)) continue;
      if (!LAB_STATUSES.includes(v.status as LabStatus) || !isTime(v.at)) continue;
      const lab: LabProgress = { status: v.status as LabStatus, at: v.at };
      if (isSafeEvidenceUrl(v.evidenceUrl)) lab.evidenceUrl = v.evidenceUrl;
      out.labs[id] = lab;
    }
  }

  if (isObj(input.assessment) && isTime(input.assessment.at) && isObj(input.assessment.scores)) {
    const scores: Record<string, number> = {};
    for (const [id, v] of Object.entries(input.assessment.scores).slice(0, MAX_ASSESSMENT_SKILLS)) {
      if (ID_RE.test(id) && isScore(v)) scores[id] = Math.round(v);
    }
    if (Object.keys(scores).length) out.assessment = { at: input.assessment.at, scores };
  }
  return out;
}

function dedupeAttempts(list: Attempt[]): Attempt[] {
  const map = new Map<string, Attempt>();
  for (const a of list) map.set(`${a.questionId}@${a.at}`, a);
  return [...map.values()].sort((a, b) => a.at - b.at).slice(-MAX_ATTEMPTS);
}

/* ------------------------------------------------------------------- merge */

/** Gộp theo khoá, bản có `at` mới hơn thắng (hoà → giữ bản của `a`) */
function newestByKey<T extends { at: number }>(a: Record<string, T>, b: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = { ...a };
  for (const [id, v] of Object.entries(b)) {
    const cur = out[id];
    if (!cur || v.at > cur.at) out[id] = v;
  }
  return out;
}

function mergeQuizzes(a: Record<string, QuizResult>, b: Record<string, QuizResult>) {
  const out = newestByKey(a, b);
  for (const id of Object.keys(out)) {
    // Điểm cao nhất được giữ dù thiết bị nào làm bài sau
    const best = Math.max(a[id]?.best ?? 0, b[id]?.best ?? 0);
    if (best !== out[id].best) out[id] = { ...out[id], best };
  }
  return out;
}

/**
 * Gộp 2 bản tiến độ:
 * - topics, labs, quiz (`last`), assessment: bản mới nhất thắng
 * - quiz `best`: lấy điểm cao nhất
 * - attempts & activity: lấy hợp
 */
export function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  const assessment =
    !a.assessment ? b.assessment : !b.assessment ? a.assessment : b.assessment.at > a.assessment.at ? b.assessment : a.assessment;
  return {
    version: PROGRESS_VERSION,
    topics: newestByKey(a.topics, b.topics),
    attempts: dedupeAttempts([...a.attempts, ...b.attempts]),
    activity: [...new Set([...a.activity, ...b.activity])].sort().slice(-MAX_ACTIVITY_DAYS),
    quizzes: mergeQuizzes(a.quizzes, b.quizzes),
    labs: newestByKey(a.labs, b.labs),
    assessment,
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
