/**
 * Integration test cho /api/progress.
 * Redis được thay bằng một fake Upstash REST server trong bộ nhớ (stub `fetch`),
 * nên test chạy qua đúng route handler + lib/redis + lib/progress như production.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET, PUT } from "@/app/api/progress/route";
import { emptyProgress, type ProgressState } from "@/lib/progress";

const URL_ENV = "UPSTASH_REDIS_REST_URL";
const TOKEN_ENV = "UPSTASH_REDIS_REST_TOKEN";
const ENV_KEYS = [URL_ENV, TOKEN_ENV, "KV_REST_API_URL", "KV_REST_API_TOKEN"] as const;

const T = Date.UTC(2026, 9, 1, 12);

/* ------------------------------------------------------------ fake Upstash */

function createFakeUpstash() {
  const store = new Map<string, string>();
  const commands: string[] = [];

  const fetchImpl = async (_input: unknown, init?: { body?: unknown }) => {
    const [cmd, key, value, flag] = JSON.parse(String(init?.body)) as [string, string, string?, string?];
    commands.push(cmd);
    let result: string | number | null = null;
    switch (cmd) {
      case "GET":
        result = store.get(key) ?? null;
        break;
      case "SET":
        if (flag === "NX" && store.has(key)) result = null;
        else {
          store.set(key, String(value));
          result = "OK";
        }
        break;
      case "INCR": {
        const n = Number(store.get(key) ?? 0) + 1;
        store.set(key, String(n));
        result = n;
        break;
      }
      case "EXPIRE":
        result = store.has(key) ? 1 : 0;
        break;
      case "DEL":
        result = store.delete(key) ? 1 : 0;
        break;
      default:
        return new Response(JSON.stringify({ error: `unsupported ${cmd}` }), { status: 400 });
    }
    return new Response(JSON.stringify({ result }), { status: 200 });
  };

  return { store, commands, fetchImpl };
}

/* ----------------------------------------------------------------- helpers */

const realFetch = globalThis.fetch;
const savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string>> = {};
let upstash: ReturnType<typeof createFakeUpstash>;

function put(body: unknown, pin?: string, rawBody?: string) {
  return PUT(
    new Request("http://localhost/api/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(pin ? { "x-progress-pin": pin } : {}) },
      body: rawBody ?? JSON.stringify(body),
    }),
  );
}

const withTopic = (id: string, at: number): ProgressState => ({
  ...emptyProgress(),
  topics: { [id]: { status: "done", at } },
});

async function setupPin(pin = "secret1") {
  const res = await put({ state: emptyProgress(), setupPin: pin });
  expect(res.status).toBe(200);
}

beforeEach(() => {
  for (const k of ENV_KEYS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
  process.env[URL_ENV] = "https://fake-upstash.test";
  process.env[TOKEN_ENV] = "test-token";
  upstash = createFakeUpstash();
  globalThis.fetch = upstash.fetchImpl as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

/* ------------------------------------------------------------------- tests */

describe("GET /api/progress", () => {
  it("không cấu hình Redis → chế độ chỉ-local", async () => {
    delete process.env[URL_ENV];
    const res = await GET();
    expect(await res.json()).toEqual({ enabled: false, hasPin: false, state: null });
  });

  it("chưa có dữ liệu → state rỗng v2, chưa có PIN", async () => {
    const body = await (await GET()).json();
    expect(body).toEqual({ enabled: true, hasPin: false, state: emptyProgress() });
  });

  it("migrate: đọc key v1 khi chưa có key v2", async () => {
    upstash.store.set(
      "hub:progress:v1",
      JSON.stringify({ version: 1, topics: { fixtures: { status: "done", at: T } }, attempts: [], activity: [] }),
    );
    const { state } = await (await GET()).json();
    expect(state.version).toBe(2);
    expect(state.topics).toEqual({ fixtures: { status: "done", at: T } });
    expect(state.quizzes).toEqual({});
  });

  it("ưu tiên key v2 khi cả hai cùng tồn tại", async () => {
    upstash.store.set("hub:progress:v1", JSON.stringify(withTopic("old-topic", T)));
    upstash.store.set("hub:progress:v2", JSON.stringify(withTopic("new-topic", T)));
    const { state } = await (await GET()).json();
    expect(Object.keys(state.topics)).toEqual(["new-topic"]);
  });

  it("dữ liệu Redis hỏng không làm sập API", async () => {
    upstash.store.set("hub:progress:v2", "{not json");
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).state).toEqual(emptyProgress());
  });
});

describe("PUT /api/progress", () => {
  it("lần đầu: tạo PIN đã hash và lưu state vào key v2", async () => {
    const res = await put({ state: withTopic("fixtures", T), setupPin: "secret1" });

    expect(res.status).toBe(200);
    expect(upstash.store.get("hub:pin:v1")).toMatch(/^[0-9a-f]{32}:[0-9a-f]{64}$/);
    expect(upstash.store.get("hub:pin:v1")).not.toContain("secret1");
    expect(JSON.parse(upstash.store.get("hub:progress:v2")!).topics).toHaveProperty("fixtures");
  });

  it("chưa có PIN mà không gửi setupPin hợp lệ → 401 pin_required", async () => {
    const res = await put({ state: emptyProgress(), setupPin: "ab" });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: "pin_required" });
  });

  it("đã có PIN: thiết bị khác gửi setupPin mới không thay được PIN → 401 invalid_pin", async () => {
    await setupPin("secret1");
    const res = await put({ state: emptyProgress(), setupPin: "another1" });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: "invalid_pin", hasPin: true });
  });

  it("đúng PIN → merge với dữ liệu đang có, không ghi đè", async () => {
    await setupPin();
    await put({ state: withTopic("fixtures", T) }, "secret1");
    const res = await put({ state: withTopic("locators", T + 1) }, "secret1");

    const { state } = await res.json();
    expect(Object.keys(state.topics).sort()).toEqual(["fixtures", "locators"]);
  });

  it("migrate khi ghi: dữ liệu v1 cũ được gộp vào key v2, key v1 giữ nguyên để rollback", async () => {
    const legacy = JSON.stringify({ version: 1, topics: { fixtures: { status: "done", at: T } }, attempts: [], activity: [] });
    upstash.store.set("hub:progress:v1", legacy);
    await setupPin();
    await put({ state: withTopic("locators", T + 1) }, "secret1");

    const saved = JSON.parse(upstash.store.get("hub:progress:v2")!);
    expect(Object.keys(saved.topics).sort()).toEqual(["fixtures", "locators"]);
    expect(upstash.store.get("hub:progress:v1")).toBe(legacy);
  });

  it("client cũ gửi state v1 không xoá quiz/lab đã có trên server", async () => {
    await setupPin();
    await put(
      { state: { ...emptyProgress(), quizzes: { fixtures: { best: 90, last: 90, at: T } } } },
      "secret1",
    );
    const res = await put({ state: { version: 1, topics: {}, attempts: [], activity: [] } }, "secret1");
    expect((await res.json()).state.quizzes).toEqual({ fixtures: { best: 90, last: 90, at: T } });
  });

  it("sai PIN → 401 và tăng bộ đếm; đúng PIN → reset bộ đếm", async () => {
    await setupPin();
    expect((await put({ state: emptyProgress() }, "wrong1")).status).toBe(401);
    expect(upstash.store.get("hub:pin-fails")).toBe("1");

    expect((await put({ state: emptyProgress() }, "secret1")).status).toBe(200);
    expect(upstash.store.has("hub:pin-fails")).toBe(false);
  });

  it("sai PIN 10 lần → khoá với 429, kể cả khi sau đó nhập đúng", async () => {
    await setupPin();
    for (let i = 0; i < 10; i++) await put({ state: emptyProgress() }, `wrong${i}`);

    const res = await put({ state: emptyProgress() }, "secret1");
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ error: "too_many_attempts" });
  });

  it("body vượt 256 KB → 413, không đọc/ghi Redis", async () => {
    const res = await put(null, undefined, "x".repeat(256 * 1024 + 1));
    expect(res.status).toBe(413);
    expect(upstash.commands).toEqual([]);
  });

  it("JSON không hợp lệ → 400", async () => {
    const res = await put(null, undefined, "{oops");
    expect(res.status).toBe(400);
  });

  it("dữ liệu rác trong state bị loại trước khi lưu", async () => {
    await setupPin();
    const res = await put(
      { state: { topics: { "<script>": { status: "done", at: T }, ok: { status: "hacked", at: T } } } },
      "secret1",
    );
    expect((await res.json()).state.topics).toEqual({});
  });

  it("Redis lỗi → 502 storage_unavailable", async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({ error: "boom" }), { status: 500 })) as typeof fetch;
    const res = await put({ state: emptyProgress(), setupPin: "secret1" });
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "storage_unavailable" });
  });
});
