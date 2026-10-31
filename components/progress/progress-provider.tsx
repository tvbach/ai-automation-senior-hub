"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { TopicStatus } from "@/data/content";
import {
  emptyProgress,
  localDay,
  MAX_ATTEMPTS,
  mergeProgress,
  sameProgress,
  sanitizeProgress,
  withAssessment,
  withQuizResult,
  type ProgressState,
} from "@/lib/progress";

/**
 * Nguồn sự thật phía client cho tiến độ học.
 * - Ghi ngay vào localStorage (offline-first, phản hồi tức thì)
 * - Đồng bộ lên /api/progress (debounce) khi server bật sync và có PIN
 */

const LS_STATE = "hub.progress.v2";
/** Key của schema v1 — chỉ đọc để migrate, giữ nguyên làm bản sao lưu khi cần rollback */
const LS_STATE_LEGACY = "hub.progress.v1";
const LS_PIN = "hub.pin.v1";
const SAVE_DEBOUNCE_MS = 900;

export type SyncMode =
  | "loading" // đang tải lần đầu
  | "local" // server chưa cấu hình sync → chỉ lưu trên trình duyệt này
  | "needs-pin" // server bật sync nhưng thiết bị này chưa có PIN hợp lệ
  | "syncing"
  | "synced"
  | "error";

interface ProgressContextValue {
  state: ProgressState;
  hydrated: boolean;
  sync: { mode: SyncMode; hasServerPin: boolean; message?: string };
  setTopicStatus: (topicId: string, status: TopicStatus) => void;
  addAttempt: (questionId: string, score: number) => void;
  /** Lưu điểm quiz (0–100) của một bài học */
  recordQuiz: (topicId: string, score: number) => void;
  /** Lưu kết quả Skill Assessment (điểm 0–100 theo SkillId) */
  saveAssessment: (scores: Record<string, number>) => void;
  /** Lưu PIN cho thiết bị này (tạo mới nếu server chưa có PIN) và đồng bộ ngay */
  connectWithPin: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  forgetPin: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

function lsGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsSet(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* private mode / quota — bỏ qua, app vẫn chạy với state trong bộ nhớ */
  }
}

const ERROR_TEXT: Record<string, string> = {
  invalid_pin: "PIN không đúng.",
  pin_required: "PIN cần 4–32 ký tự chữ hoặc số.",
  pin_exists: "PIN đã được tạo từ thiết bị khác — hãy nhập PIN đó.",
  too_many_attempts: "Sai PIN quá nhiều lần. Thử lại sau 15 phút.",
  storage_unavailable: "Không kết nối được kho lưu trữ. Thử lại sau.",
  network: "Mất kết nối mạng — tiến độ vẫn được lưu trên máy này.",
};

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgressState>(emptyProgress);
  const [hydrated, setHydrated] = useState(false);
  const [sync, setSync] = useState<ProgressContextValue["sync"]>({ mode: "loading", hasServerPin: false });

  const stateRef = useRef(state);
  const pinRef = useRef<string | null>(null);
  const serverEnabled = useRef(false);
  const lastSynced = useRef<ProgressState | null>(null);
  const timer = useRef<number | null>(null);

  /* ------------------------------------------------------------ push */
  const push = useCallback(async (opts?: { setupPin?: string }) => {
    if (!serverEnabled.current) return { ok: false, error: "sync_disabled" };
    const pin = pinRef.current;
    if (!pin && !opts?.setupPin) return { ok: false, error: "pin_required" };

    const snapshot = stateRef.current;
    setSync((s) => ({ ...s, mode: "syncing", message: undefined }));
    try {
      const res = await fetch("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(pin ? { "x-progress-pin": pin } : {}) },
        body: JSON.stringify({ state: snapshot, ...(opts?.setupPin ? { setupPin: opts.setupPin } : {}) }),
      });
      const data = (await res.json().catch(() => ({}))) as { state?: unknown; error?: string; hasPin?: boolean };
      if (!res.ok) {
        const error = data.error ?? "storage_unavailable";
        if (res.status === 401 || res.status === 409) {
          pinRef.current = null;
          lsSet(LS_PIN, null);
          setSync({ mode: "needs-pin", hasServerPin: data.hasPin ?? true, message: ERROR_TEXT[error] });
        } else {
          setSync((s) => ({ ...s, mode: "error", message: ERROR_TEXT[error] ?? error }));
        }
        return { ok: false, error };
      }
      const server = sanitizeProgress(data.state);
      lastSynced.current = server;
      // Gộp với thay đổi phát sinh trong lúc request đang bay
      setState((cur) => {
        const merged = mergeProgress(server, cur);
        lsSet(LS_STATE, JSON.stringify(merged));
        return merged;
      });
      setSync({ mode: "synced", hasServerPin: true });
      return { ok: true };
    } catch {
      setSync((s) => ({ ...s, mode: "error", message: ERROR_TEXT.network }));
      return { ok: false, error: "network" };
    }
  }, []);

  const schedulePush = useCallback(() => {
    if (!serverEnabled.current || !pinRef.current) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void push(), SAVE_DEBOUNCE_MS);
  }, [push]);

  /* ---------------------------------------------------------- hydrate */
  useEffect(() => {
    let cancelled = false;
    let local = emptyProgress();
    try {
      const current = lsGet(LS_STATE);
      const raw = current ?? lsGet(LS_STATE_LEGACY);
      if (raw) local = sanitizeProgress(JSON.parse(raw));
      // Lần đầu sau khi nâng cấp: lưu bản đã migrate sang key v2 ngay
      if (raw && !current) lsSet(LS_STATE, JSON.stringify(local));
    } catch {
      /* dữ liệu local hỏng → bắt đầu lại */
    }
    pinRef.current = lsGet(LS_PIN);
    stateRef.current = local;
    setState(local);
    setHydrated(true);

    (async () => {
      try {
        const res = await fetch("/api/progress", { cache: "no-store" });
        const data = (await res.json()) as { enabled?: boolean; hasPin?: boolean; state?: unknown };
        if (cancelled) return;
        if (!res.ok || !data.enabled) {
          setSync({ mode: res.ok ? "local" : "error", hasServerPin: false, message: res.ok ? undefined : ERROR_TEXT.storage_unavailable });
          return;
        }
        serverEnabled.current = true;
        const server = sanitizeProgress(data.state);
        lastSynced.current = server;
        const merged = mergeProgress(server, stateRef.current);
        stateRef.current = merged;
        setState(merged);
        lsSet(LS_STATE, JSON.stringify(merged));

        if (!pinRef.current) {
          setSync({ mode: "needs-pin", hasServerPin: Boolean(data.hasPin) });
        } else if (!sameProgress(merged, server)) {
          void push(); // có thay đổi local chưa lên server
        } else {
          setSync({ mode: "synced", hasServerPin: true });
        }
      } catch {
        if (!cancelled) setSync({ mode: "error", hasServerPin: false, message: ERROR_TEXT.network });
      }
    })();

    return () => {
      cancelled = true;
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [push]);

  /* ---------------------------------------------------------- mutations */
  const update = useCallback(
    (fn: (s: ProgressState) => ProgressState) => {
      setState((cur) => {
        const next = fn(cur);
        stateRef.current = next;
        lsSet(LS_STATE, JSON.stringify(next));
        return next;
      });
      schedulePush();
    },
    [schedulePush],
  );

  const setTopicStatus = useCallback(
    (topicId: string, status: TopicStatus) => {
      const now = Date.now();
      update((s) => ({
        ...s,
        topics: { ...s.topics, [topicId]: { status, at: now } },
        activity: status === "todo" ? s.activity : [...new Set([...s.activity, localDay(now)])].sort(),
      }));
    },
    [update],
  );

  const addAttempt = useCallback(
    (questionId: string, score: number) => {
      const now = Date.now();
      update((s) => ({
        ...s,
        attempts: [...s.attempts, { questionId, score: Math.round(score), at: now }].slice(-MAX_ATTEMPTS),
        activity: [...new Set([...s.activity, localDay(now)])].sort(),
      }));
    },
    [update],
  );

  const recordQuiz = useCallback(
    (topicId: string, score: number) => update((s) => withQuizResult(s, topicId, score)),
    [update],
  );

  const saveAssessment = useCallback(
    (scores: Record<string, number>) => update((s) => withAssessment(s, scores)),
    [update],
  );

  const connectWithPin = useCallback(
    async (pin: string) => {
      const clean = pin.trim();
      if (!clean) return { ok: false, error: ERROR_TEXT.pin_required };
      const creating = !sync.hasServerPin;
      pinRef.current = creating ? null : clean;
      const result = await push(creating ? { setupPin: clean } : undefined);
      if (result.ok) {
        pinRef.current = clean;
        lsSet(LS_PIN, clean);
        return { ok: true };
      }
      return { ok: false, error: ERROR_TEXT[result.error ?? ""] ?? result.error };
    },
    [push, sync.hasServerPin],
  );

  const forgetPin = useCallback(() => {
    pinRef.current = null;
    lsSet(LS_PIN, null);
    setSync((s) => ({ ...s, mode: serverEnabled.current ? "needs-pin" : "local", message: undefined }));
  }, []);

  const value = useMemo<ProgressContextValue>(
    () => ({ state, hydrated, sync, setTopicStatus, addAttempt, recordQuiz, saveAssessment, connectWithPin, forgetPin }),
    [state, hydrated, sync, setTopicStatus, addAttempt, recordQuiz, saveAssessment, connectWithPin, forgetPin],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress phải nằm trong <ProgressProvider>");
  return ctx;
}
