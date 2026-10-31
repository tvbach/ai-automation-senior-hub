import type { Locator, Page } from "@playwright/test";
import { allTopics } from "../data/content";
import { quizzesByTopic } from "../data/quizzes";
import { expect, test } from "./fixtures";

const TOPIC_ID = "pyramid-models";
const entry = allTopics.find((t) => t.topic.id === TOPIC_ID)!;
const QUESTIONS = quizzesByTopic[TOPIC_ID];
const MODULE_URL = `/roadmap/${entry.phase.id}/${entry.module.id}`;

function quizSection(page: Page): Locator {
  return page
    .locator(`article#${TOPIC_ID}`)
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Kiểm tra nhanh" }) });
}

/** Chọn đáp án cho từng câu: đúng hết hoặc sai hết */
async function answerAll(quiz: Locator, correct: boolean) {
  for (const [i, q] of QUESTIONS.entries()) {
    const value = correct ? q.answer : q.options.find((o) => o.id !== q.answer)!.id;
    await quiz.getByRole("group", { name: new RegExp(`^Câu ${i + 1}\\.`) }).locator(`input[value="${value}"]`).check();
  }
}

test.describe("Quiz cuối bài", () => {
  test("phải trả lời hết mới nộp được; đạt 100% được lưu qua reload và cập nhật năng lực", async ({ page }) => {
    await page.goto(MODULE_URL);
    const quiz = quizSection(page);
    const submit = quiz.getByRole("button", { name: "Nộp bài" });

    await expect(submit).toBeDisabled();
    await answerAll(quiz, true);
    await expect(quiz.getByText(`Đã trả lời ${QUESTIONS.length}/${QUESTIONS.length}`)).toBeVisible();
    await submit.click();

    const result = quiz.getByRole("status");
    await expect(result).toContainText(`Đúng ${QUESTIONS.length}/${QUESTIONS.length} · 100%`);
    await expect(result).toBeFocused();
    await expect(quiz.getByText("Chính xác.")).toHaveCount(QUESTIONS.length);

    await page.reload();
    await expect(quizSection(page).getByText("Cao nhất 100% · lần gần nhất 100%")).toBeVisible();

    await page.goto("/skills");
    const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Testing Fundamentals" }) });
    await expect(card).toContainText(`Quiz đạt 1/${entry.module.topics.length}`);
  });

  test("chưa đạt: hiện giải thích, cho làm lại, và /skills gợi ý làm lại đúng bài đó", async ({ page }) => {
    await page.goto(MODULE_URL);
    const quiz = quizSection(page);
    await answerAll(quiz, false);
    await quiz.getByRole("button", { name: "Nộp bài" }).click();

    await expect(quiz.getByRole("status")).toContainText("Chưa đạt");
    await expect(quiz.getByText("Chưa đúng.")).toHaveCount(QUESTIONS.length);

    await quiz.getByRole("button", { name: "Làm lại" }).click();
    await expect(quiz.getByRole("button", { name: "Nộp bài" })).toBeDisabled();

    await page.goto("/skills");
    const next = page.locator("section").filter({ has: page.getByRole("heading", { name: "Ưu tiên tiếp theo" }) });
    await expect(next.getByRole("link").first()).toContainText(`Làm lại quiz: ${entry.topic.title}`);
  });
});
