/**
 * lib/redis.ts — client tối giản cho Upstash Redis REST API (không cần SDK).
 *
 * Tự nhận env do Vercel Marketplace (Upstash) tạo ra:
 *   KV_REST_API_URL / KV_REST_API_TOKEN            (tên kiểu "Vercel KV")
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 * Không có env → redisConfigured() = false → app chạy chế độ chỉ-local.
 */

function config() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

export function redisConfigured(): boolean {
  return config() !== null;
}

type RedisValue = string | number | null | RedisValue[];

/** Gửi 1 lệnh Redis, ví dụ redis(["GET", "key"]) */
export async function redis<T extends RedisValue = RedisValue>(command: (string | number)[]): Promise<T> {
  const cfg = config();
  if (!cfg) throw new Error("Redis chưa được cấu hình");
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const json = (await res.json()) as { result?: T; error?: string };
  if (!res.ok || json.error) throw new Error(`Redis error: ${json.error ?? res.status}`);
  return json.result as T;
}
