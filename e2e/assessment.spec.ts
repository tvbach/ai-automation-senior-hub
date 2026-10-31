import { phases } from "../data/content";
import { assessmentQuestions } from "../data/assessment";
import { expect, test } from "./fixtures";

test("Skill Assessment: làm hết 22 câu, xem gợi ý theo phase và test-out trên /skills", async ({ page }) => {
  await page.goto("/assessment");
  await page.getByRole("button", { name: "Bắt đầu" }).click();

  for (const [i, q] of assessmentQuestions.entries()) {
    await expect(page.getByText(`Câu ${i + 1}/${assessmentQuestions.length}`)).toBeVisible();
    await page.locator(`input[value="${q.answer}"]`).check();
    const isLast = i === assessmentQuestions.length - 1;
    await page.getByRole("button", { name: isLast ? "Xem kết quả" : "Câu tiếp" }).click();
  }

  await expect(page.getByRole("heading", { name: "Gợi ý cho từng giai đoạn" })).toBeVisible();
  const phaseLinks = page.getByRole("link").filter({ hasText: /PHASE 0\d/ });
  await expect(phaseLinks).toHaveCount(phases.length);
  for (const link of await phaseLinks.all()) await expect(link).toContainText("Có thể học lướt");
  await expect(page.getByText(`Xem lại đáp án (${assessmentQuestions.length}/${assessmentQuestions.length} đúng)`)).toBeVisible();

  await page.getByRole("link", { name: "Xem gợi ý học tiếp" }).click();
  await expect(page).toHaveURL(/\/skills$/);
  await expect(page.getByRole("link", { name: /Skill Assessment gần nhất/ })).toBeVisible();
  // Kỹ năng đã vững theo assessment: gợi ý làm quiz kiểm tra thay vì học lại bài
  const next = page.locator("section").filter({ has: page.getByRole("heading", { name: "Ưu tiên tiếp theo" }) });
  await expect(next.getByRole("link").first()).toContainText("Làm quiz kiểm tra:");
});

test("Assessment: không sang câu tiếp khi chưa chọn đáp án", async ({ page }) => {
  await page.goto("/assessment");
  await page.getByRole("button", { name: "Bắt đầu" }).click();
  await expect(page.getByRole("button", { name: "Câu tiếp" })).toBeDisabled();
});
