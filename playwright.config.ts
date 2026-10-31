import { defineConfig, devices } from "@playwright/test";

/**
 * E2E cho chính AI Automation Senior Hub.
 * - Mặc định tự dựng app: `next dev` ở local, `next start` trên CI (sau `npm run build`).
 * - Đặt E2E_BASE_URL để chạy với một môi trường đã deploy (ví dụ Vercel preview).
 * - Đồng bộ Redis luôn bị tắt trong test (xem e2e/fixtures.ts) để dữ liệu thật không lọt vào.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const externalBaseURL = process.env.E2E_BASE_URL;
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: externalBaseURL ?? `http://localhost:${PORT}`,
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: externalBaseURL
    ? undefined
    : {
        command: CI ? `npm run start -- -p ${PORT}` : `npm run dev -- -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !CI,
        timeout: 120_000,
        // Không cho server kết nối Redis thật dù máy có .env.local
        env: { KV_REST_API_URL: "", KV_REST_API_TOKEN: "", UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "" },
      },
});
