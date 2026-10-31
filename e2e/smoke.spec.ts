import { phases } from "../data/content";
import { expect, expectNoHorizontalScroll, test } from "./fixtures";

test.describe("Smoke", () => {
  test("dashboard hiển thị lộ trình và điều hướng được tới các trang chính", async ({ page, pageErrors }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("QA Automation");
    await expect(page.getByRole("heading", { name: `${phases.length} giai đoạn` })).toBeVisible();
    await expectNoHorizontalScroll(page);

    const nav = page.getByRole("navigation", { name: "Điều hướng chính" });
    await nav.getByRole("link", { name: "Năng lực" }).click();
    await expect(page).toHaveURL(/\/skills$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Năng lực theo kỹ năng");
    await expect(nav.getByRole("link", { name: "Năng lực" })).toHaveAttribute("aria-current", "page");
    await expectNoHorizontalScroll(page);

    await nav.getByRole("link", { name: /Phỏng vấn|Interview Hub/ }).click();
    await expect(page).toHaveURL(/\/interview$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  for (const phase of phases) {
    test(`trang giai đoạn "${phase.shortTitle}" hiển thị prerequisites và module`, async ({ page, pageErrors }) => {
      await page.goto(`/roadmap/${phase.id}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(phase.title);
      await expect(page.getByText("Cần biết trước khi học")).toBeVisible();
      await expect(page.getByText(phase.prerequisites[0])).toBeVisible();
      for (const mod of phase.modules) {
        await expect(page.getByRole("heading", { name: mod.title, exact: true })).toBeVisible();
      }
      await expectNoHorizontalScroll(page);
      expect(pageErrors).toEqual([]);
    });
  }

  test("URL không tồn tại trả trang 404", async ({ page }) => {
    const res = await page.goto("/roadmap/khong-ton-tai");
    expect(res?.status()).toBe(404);
  });
});
