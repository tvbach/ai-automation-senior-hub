import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

const PAGES = [
  "/",
  "/skills",
  "/assessment",
  "/interview",
  "/roadmap/test-architecture",
  "/roadmap/test-architecture/strategy",
];

test.describe("Accessibility (axe, WCAG 2.1 A/AA)", () => {
  test.skip(({ isMobile }) => isMobile, "Quét một lần trên desktop là đủ cho các rule tĩnh");

  for (const path of PAGES) {
    test(`không có lỗi serious/critical: ${path}`, async ({ page }) => {
      await page.goto(path);
      // Chờ client hydrate xong (skeleton biến mất) để quét đúng giao diện thật
      await expect(page.locator("[aria-busy='true']")).toHaveCount(0);
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const serious = violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => `${v.id} (${v.impact}): ${v.nodes.length} phần tử — ${v.nodes[0]?.target.join(" ")}`);
      expect(serious).toEqual([]);
    });
  }
});
