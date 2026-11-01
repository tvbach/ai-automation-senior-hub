import type { Page } from "@playwright/test";
import { phases } from "../data/content";
import { expect, test } from "./fixtures";

/**
 * Bắt lỗi "vỡ layout" trên điện thoại: phần tử con tràn ra ngoài khung của phần tử cha.
 * Chạy ở màn hình hẹp phổ biến (360px) với cỡ chữ mặc định và cỡ chữ lớn (130%) —
 * nhiều người dùng Android bật cỡ chữ lớn, và Tailwind dùng rem nên chữ phóng theo.
 */
const WIDTH = 360;
const FONT_SCALES = [100, 130];

const PAGES = [
  "/",
  "/skills",
  "/assessment",
  "/interview",
  ...phases.map((p) => `/roadmap/${p.id}`),
  ...phases.flatMap((p) => p.modules.map((m) => `/roadmap/${p.id}/${m.id}`)),
];

/** Liệt kê phần tử tràn khỏi phần tử cha (bỏ qua vùng cuộn/cắt, absolute/fixed, aria-hidden, sr-only) */
async function findOverflows(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const TOLERANCE = 1;
    const out: string[] = [];
    const describe = (el: Element) => {
      const id = el.id ? `#${el.id}` : "";
      const cls = typeof el.className === "string" ? `.${el.className.trim().split(/\s+/).slice(0, 3).join(".")}` : "";
      const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
      return `<${el.tagName.toLowerCase()}${id}${cls}> "${text}"`;
    };
    const skip = (el: Element) => {
      if (el.closest("[aria-hidden='true'], .sr-only")) return true;
      const pos = getComputedStyle(el).position;
      return pos === "absolute" || pos === "fixed";
    };
    const clips = (el: Element) => {
      const s = getComputedStyle(el);
      return s.overflowX !== "visible" || s.overflowY !== "visible";
    };

    for (const el of document.querySelectorAll("header *, main *")) {
      const parent = el.parentElement;
      if (!parent || skip(el) || clips(parent)) continue;
      // Phần tử nằm trong vùng cuộn ngang (ví dụ tabs) thì được phép rộng hơn cha
      let a: Element | null = parent;
      let inScroller = false;
      while (a && a !== document.body) {
        if (getComputedStyle(a).overflowX !== "visible") inScroller = true;
        a = a.parentElement;
      }
      if (inScroller) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const pr = parent.getBoundingClientRect();
      if (r.left < pr.left - TOLERANCE || r.right > pr.right + TOLERANCE) {
        out.push(`${describe(el)} vượt khung ${describe(parent)} (${Math.round(r.left - pr.left)}/${Math.round(r.right - pr.right)}px)`);
      }
    }
    if (document.documentElement.scrollWidth > window.innerWidth + TOLERANCE) {
      out.push(`trang cuộn ngang: scrollWidth ${document.documentElement.scrollWidth} > ${window.innerWidth}`);
    }
    return [...new Set(out)].slice(0, 10);
  });
}

test.describe(`Layout mobile ${WIDTH}px`, () => {
  test.skip(({ isMobile }) => !isMobile, "Chỉ chạy trong project mobile");

  for (const path of PAGES) {
    test(`không tràn khung: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: WIDTH, height: 780 });
      await page.goto(path);
      await expect(page.locator("[aria-busy='true']")).toHaveCount(0);

      for (const scale of FONT_SCALES) {
        await page.evaluate((s) => (document.documentElement.style.fontSize = `${s}%`), scale);
        expect(await findOverflows(page), `cỡ chữ ${scale}%`).toEqual([]);
      }
    });
  }
});

test("thanh trạng thái bài học: 3 nút nằm gọn trong khung và vẫn bấm được trên mobile", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Chỉ chạy trong project mobile");
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(`/roadmap/${phases[0].id}/${phases[0].modules[0].id}`);
  await page.evaluate(() => (document.documentElement.style.fontSize = "130%"));

  const group = page.getByRole("radiogroup").first();
  const box = (await group.boundingBox())!;
  for (const radio of await group.getByRole("radio").all()) {
    const r = (await radio.boundingBox())!;
    expect(r.x).toBeGreaterThanOrEqual(box.x - 1);
    expect(r.x + r.width).toBeLessThanOrEqual(box.x + box.width + 1);
    expect(r.height, "vùng chạm tối thiểu").toBeGreaterThanOrEqual(44);
  }

  await group.getByRole("radio", { name: "Hoàn thành" }).click();
  await expect(group.getByRole("radio", { name: "Hoàn thành" })).toHaveAttribute("aria-checked", "true");
});
