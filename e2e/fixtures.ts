import { test as base, expect, type Page } from "@playwright/test";

type Fixtures = {
  /** Auto fixture: chặn đồng bộ tiến độ, mỗi test bắt đầu từ trạng thái rỗng, chỉ lưu localStorage */
  localOnlyProgress: void;
  /** Lỗi console và lỗi JS chưa bắt trong lúc test chạy */
  pageErrors: string[];
};

export const test = base.extend<Fixtures>({
  localOnlyProgress: [
    async ({ page }, use) => {
      await page.route("**/api/progress", (route) =>
        route.request().method() === "GET"
          ? route.fulfill({ json: { enabled: false, hasPin: false, state: null } })
          : route.fulfill({ status: 503, json: { error: "sync_disabled" } }),
      );
      await use();
    },
    { auto: true },
  ],

  pageErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));
    await use(errors);
  },
});

export { expect };

/** Không có thanh cuộn ngang — layout vừa màn hình (quan trọng trên mobile) */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "trang bị tràn ngang").toBeLessThanOrEqual(0);
}
