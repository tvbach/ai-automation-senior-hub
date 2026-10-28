"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Cloud, CloudAlert, CloudCheck, CloudOff, HardDrive, KeyRound, LoaderCircle, X } from "lucide-react";
import { useProgress, type SyncMode } from "./progress-provider";
import { cn } from "@/lib/cn";

const MODE_UI: Record<SyncMode, { icon: typeof Cloud; label: string; tone: string }> = {
  loading: { icon: LoaderCircle, label: "Đang tải tiến độ", tone: "text-ink-faint" },
  local: { icon: HardDrive, label: "Lưu trên trình duyệt này", tone: "text-ink-muted" },
  "needs-pin": { icon: CloudOff, label: "Chưa đồng bộ — cần PIN", tone: "text-warn" },
  syncing: { icon: LoaderCircle, label: "Đang đồng bộ", tone: "text-accent-soft" },
  synced: { icon: CloudCheck, label: "Đã đồng bộ", tone: "text-ok" },
  error: { icon: CloudAlert, label: "Lỗi đồng bộ", tone: "text-danger" },
};

/** Nút trạng thái đồng bộ trên header + dialog nhập/tạo PIN */
export function SyncButton() {
  const { sync, connectWithPin, forgetPin } = useProgress();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const ids = useId();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ui = MODE_UI[sync.mode];
  const Icon = ui.icon;
  const creating = !sync.hasServerPin;

  // Lần đầu vào và server cần PIN → nhắc nhẹ bằng chấm màu, không tự bật dialog
  const needsAttention = sync.mode === "needs-pin" || sync.mode === "error";

  useEffect(() => {
    if (sync.mode === "synced") setError(null);
  }, [sync.mode]);

  function open() {
    setError(sync.message ?? null);
    setPin("");
    dialogRef.current?.showModal();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await connectWithPin(pin);
    setBusy(false);
    if (res.ok) dialogRef.current?.close();
    else setError(res.error ?? "Không đồng bộ được.");
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="relative grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-surface transition-colors duration-200 hover:border-line-strong"
        aria-label={`Đồng bộ tiến độ: ${ui.label}`}
        title={ui.label}
      >
        <Icon className={cn("size-4", ui.tone, (sync.mode === "loading" || sync.mode === "syncing") && "animate-spin")} aria-hidden />
        {needsAttention && <span className="absolute right-2 top-2 size-2 rounded-full bg-warn" aria-hidden />}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`${ids}-title`}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-line-strong bg-surface p-0 text-ink shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div>
            <h2 id={`${ids}-title`} className="flex items-center gap-2 font-semibold">
              <KeyRound className="size-4 text-accent-soft" aria-hidden /> Đồng bộ tiến độ
            </h2>
            <p className={cn("mt-1 flex items-center gap-1.5 text-sm", ui.tone)}>
              <Icon className="size-3.5" aria-hidden /> {ui.label}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="grid size-9 place-items-center rounded-lg text-ink-muted hover:bg-surface-raised hover:text-ink"
            aria-label="Đóng"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {sync.mode === "local" ? (
            <p className="text-sm text-ink-muted">
              Server chưa bật đồng bộ, tiến độ đang lưu trên trình duyệt này. Khi kết nối Upstash Redis trên Vercel, nút này
              sẽ cho phép nhập PIN để đồng bộ giữa các thiết bị.
            </p>
          ) : sync.mode === "synced" ? (
            <>
              <p className="text-sm text-ink-muted">
                Thiết bị này đang đồng bộ. Mọi thay đổi tiến độ và điểm mock interview được lưu lên server và hiện trên các
                thiết bị khác đã nhập cùng PIN.
              </p>
              <button
                type="button"
                onClick={() => {
                  forgetPin();
                  dialogRef.current?.close();
                }}
                className="min-h-11 rounded-lg border border-line px-4 text-sm text-ink-muted hover:border-line-strong hover:text-ink"
              >
                Ngắt đồng bộ trên thiết bị này
              </button>
            </>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <p className="text-sm text-ink-muted">
                {creating
                  ? "Tạo PIN để bảo vệ tiến độ: ai cũng xem được trang, nhưng chỉ người có PIN mới cập nhật được. Dùng cùng PIN này trên điện thoại và Mac."
                  : "Nhập PIN bạn đã tạo để đồng bộ tiến độ trên thiết bị này."}
              </p>
              <div>
                <label htmlFor={`${ids}-pin`} className="text-sm font-medium">
                  {creating ? "Tạo PIN mới" : "PIN"}
                </label>
                <input
                  id={`${ids}-pin`}
                  type="password"
                  inputMode="text"
                  autoComplete={creating ? "new-password" : "current-password"}
                  minLength={4}
                  maxLength={32}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={`${ids}-hint ${ids}-err`}
                  className="mt-1.5 h-11 w-full rounded-lg border border-line bg-code px-3 font-mono text-ink focus:border-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                />
                <p id={`${ids}-hint`} className="mt-1 text-xs text-ink-faint">
                  4–32 ký tự chữ hoặc số. PIN được lưu trên thiết bị này để không phải nhập lại.
                </p>
                <p id={`${ids}-err`} role="alert" className="mt-1 min-h-5 text-sm text-danger">
                  {error}
                </p>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent-strong disabled:opacity-60"
              >
                {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
                {creating ? "Tạo PIN & đồng bộ" : "Đồng bộ"}
              </button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
