/**
 * /api/progress — đồng bộ tiến độ học giữa các thiết bị.
 *
 * GET  → { enabled, hasPin, state }       (đọc công khai: tiến độ không nhạy cảm)
 * PUT  → body { state, setupPin? }, header x-progress-pin
 *        Lần đầu (chưa có PIN): gửi setupPin để tạo PIN.
 *        Các lần sau: header x-progress-pin phải khớp. Sai > 10 lần / 15 phút → 429.
 *        Server MERGE với bản đang lưu (không ghi đè) rồi trả về bản đã gộp.
 *
 * Migration: state lưu ở `hub:progress:v2`. Nếu chưa có, đọc `hub:progress:v1`
 * và nâng cấp qua sanitizeProgress. Key v1 được giữ nguyên để có thể rollback.
 */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { emptyProgress, mergeProgress, sanitizeProgress, type ProgressState } from "@/lib/progress";
import { redis, redisConfigured } from "@/lib/redis";

export const dynamic = "force-dynamic";

const KEY_STATE = "hub:progress:v2";
const KEY_STATE_LEGACY = "hub:progress:v1";
const KEY_PIN = "hub:pin:v1";
const KEY_FAILS = "hub:pin-fails";
const MAX_FAILS = 10;
const FAIL_WINDOW_S = 15 * 60;
const MAX_BODY_BYTES = 256 * 1024;
const PIN_RE = /^[\p{L}\p{N}]{4,32}$/u;

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

async function readState(): Promise<ProgressState> {
  const raw = (await redis<string | null>(["GET", KEY_STATE])) ?? (await redis<string | null>(["GET", KEY_STATE_LEGACY]));
  if (!raw) return emptyProgress();
  try {
    return sanitizeProgress(JSON.parse(raw));
  } catch {
    return emptyProgress();
  }
}

function hashPin(pin: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(pin, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = Buffer.from(scryptSync(pin, salt, 32).toString("hex"));
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET() {
  if (!redisConfigured()) return json({ enabled: false, hasPin: false, state: null });
  try {
    const [state, pin] = await Promise.all([readState(), redis<string | null>(["GET", KEY_PIN])]);
    return json({ enabled: true, hasPin: Boolean(pin), state });
  } catch (err) {
    console.error("[progress] GET failed", err);
    return json({ error: "storage_unavailable" }, 502);
  }
}

export async function PUT(req: Request) {
  if (!redisConfigured()) return json({ error: "sync_disabled" }, 503);

  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) return json({ error: "payload_too_large" }, 413);
  let body: { state?: unknown; setupPin?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  try {
    const fails = Number((await redis<string | null>(["GET", KEY_FAILS])) ?? 0);
    if (fails >= MAX_FAILS) return json({ error: "too_many_attempts" }, 429);

    const storedPin = await redis<string | null>(["GET", KEY_PIN]);
    if (!storedPin) {
      // Thiết lập PIN lần đầu
      const setupPin = typeof body.setupPin === "string" ? body.setupPin.trim() : "";
      if (!PIN_RE.test(setupPin)) return json({ error: "pin_required", hasPin: false }, 401);
      // NX: nếu 2 thiết bị cùng thiết lập, chỉ thiết bị đầu tiên thắng
      const created = await redis<string | null>(["SET", KEY_PIN, hashPin(setupPin), "NX"]);
      if (created !== "OK") return json({ error: "pin_exists", hasPin: true }, 409);
    } else {
      const pin = req.headers.get("x-progress-pin") ?? "";
      if (!pin || !verifyPin(pin, storedPin)) {
        const n = await redis<number>(["INCR", KEY_FAILS]);
        if (n === 1) await redis(["EXPIRE", KEY_FAILS, FAIL_WINDOW_S]);
        return json({ error: "invalid_pin", hasPin: true }, 401);
      }
      await redis(["DEL", KEY_FAILS]);
    }

    const incoming = sanitizeProgress(body.state);
    const merged = mergeProgress(await readState(), incoming);
    await redis(["SET", KEY_STATE, JSON.stringify(merged)]);
    return json({ ok: true, state: merged });
  } catch (err) {
    console.error("[progress] PUT failed", err);
    return json({ error: "storage_unavailable" }, 502);
  }
}
