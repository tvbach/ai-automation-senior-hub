import { describe, expect, it } from "vitest";
import { interviewQuestions, type InterviewQuestion } from "@/data/content";
import { containsKeyword, gradeAnswer, normalize } from "@/lib/grader";

const question = (id: string): InterviewQuestion => {
  const q = interviewQuestions.find((x) => x.id === id);
  if (!q) throw new Error(`Không có câu hỏi ${id}`);
  return q;
};

describe("normalize", () => {
  it("bỏ dấu tiếng Việt, đ → d và chữ thường", () => {
    expect(normalize("Đánh Đổi & Rủi Ro")).toBe("danh doi & rui ro");
  });
});

describe("containsKeyword", () => {
  it("khớp theo ranh giới từ, không khớp chuỗi con", () => {
    expect(containsKeyword(normalize("so sánh A vs B"), "vs")).toBe(true);
    expect(containsKeyword(normalize("vẽ lên canvas"), "vs")).toBe(false);
  });

  it("từ khoá có dấu vẫn khớp văn bản có dấu", () => {
    expect(containsKeyword(normalize("Phân tích đánh đổi chi phí"), "đánh đổi")).toBe(true);
  });

  it("từ khoá ký hiệu thì khớp chuỗi con", () => {
    expect(containsKeyword(normalize("giảm 30%"), "%")).toBe(true);
  });

  it("từ khoá rỗng không bao giờ khớp", () => {
    expect(containsKeyword("bat ky", "  ")).toBe(false);
  });
});

describe("gradeAnswer", () => {
  const q = question("flaky-strategy");

  it("tổng trọng số các tiêu chí là 100", () => {
    const total = gradeAnswer(q, "").criteria.reduce((s, c) => s + c.weight, 0);
    expect(total).toBe(100);
  });

  it("câu trả lời rỗng: No Hire, thiếu mọi concept", () => {
    const r = gradeAnswer(q, "");
    expect(r.verdict).toBe("No Hire");
    expect(r.score).toBeLessThan(20);
    expect(r.matchedConcepts).toEqual([]);
    expect(r.missedConcepts).toHaveLength(q.rubric.length);
  });

  it("câu trả lời phủ rubric, có trade-off và số liệu được điểm cao hơn hẳn câu trả lời mơ hồ", () => {
    const concepts = q.rubric.map((r) => r.keywords[0]).join(", ");
    const strong = [
      `1. Làm rõ bối cảnh: suite 800 test, flaky rate 4%, pipeline 25 phút.`,
      `2. Giải pháp: ${concepts}. Dùng Playwright trace và retry có giới hạn.`,
      `3. Trade-off: quarantine giảm nhiễu nhưng có rủi ro che giấu bug thật, vì vậy mỗi test bị cách ly có owner và hạn sửa 7 ngày.`,
      `4. Đo lường: mục tiêu flaky < 1% sau 6 tuần, theo dõi trên dashboard.`,
    ].join("\n\n");
    const weak = "Em sẽ chạy lại test cho đến khi pass.";

    const strongResult = gradeAnswer(q, strong);
    const weakResult = gradeAnswer(q, weak);

    expect(strongResult.missedConcepts).toEqual([]);
    expect(strongResult.score).toBeGreaterThanOrEqual(70);
    expect(strongResult.score - weakResult.score).toBeGreaterThan(40);
  });

  it("câu behavioral chấm cấu trúc theo đủ 4 phần STAR", () => {
    const star = question("star-transition");
    const full = gradeAnswer(
      star,
      "Situation: dự án có nhiều regression. Task: nhiệm vụ của tôi là giảm lỗi. Action: tôi đã triển khai 25 test E2E. Result: kết quả là hotfix giảm 75%.",
    );
    const structure = full.criteria.find((c) => c.id === "structure");
    expect(structure?.ratio).toBe(1);
    expect(full.strengths).toContain("Câu chuyện đủ 4 phần STAR.");
  });

  it("điểm luôn nằm trong 0–100 với mọi câu hỏi", () => {
    const longAnswer = "trade-off rủi ro 10% playwright ".repeat(200);
    for (const item of interviewQuestions) {
      for (const answer of ["", "ok", longAnswer]) {
        const { score } = gradeAnswer(item, answer);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    }
  });
});
