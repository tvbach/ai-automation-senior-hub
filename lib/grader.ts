/**
 * lib/grader.ts
 * ----------------------------------------------------------------------------
 * "AI" chấm điểm giả lập — chạy hoàn toàn ở client, deterministic, không gọi
 * API. Chấm theo rubric giống cách interviewer Senior thường đánh giá:
 *
 *   Coverage      40%  – có nhắc đến các concept kỳ vọng của câu hỏi không
 *   Trade-offs    20%  – có phân tích đánh đổi / rủi ro không
 *   Structure     15%  – có cấu trúc (STAR, các bước, nhiều ý rõ ràng)
 *   Concreteness  15%  – có số liệu, metric, công cụ cụ thể
 *   Depth         10%  – độ dài/độ sâu hợp lý (không quá ngắn, không lan man)
 *
 * Muốn thay bằng LLM thật: giữ nguyên interface GradeResult, thay phần thân
 * gradeAnswer() bằng 1 Route Handler gọi model với rubric làm context.
 * ----------------------------------------------------------------------------
 */
import type { InterviewQuestion } from "@/data/content";

export interface CriterionScore {
  id: "coverage" | "tradeoffs" | "structure" | "concreteness" | "depth";
  label: string;
  /** 0..1 */
  ratio: number;
  weight: number;
  comment: string;
}

export type Verdict = "Strong Hire" | "Hire" | "Lean No Hire" | "No Hire";

export interface GradeResult {
  score: number; // 0..100
  verdict: Verdict;
  criteria: CriterionScore[];
  matchedConcepts: string[];
  missedConcepts: string[];
  strengths: string[];
  improvements: string[];
  wordCount: number;
}

/** Bỏ dấu tiếng Việt + lowercase để so khớp "đánh đổi" ~ "danh doi" */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Từ khoá chữ/số → khớp theo ranh giới từ; ký hiệu (vd "%") → khớp chuỗi con */
export function containsKeyword(normalizedText: string, keyword: string): boolean {
  const k = normalize(keyword).trim();
  if (!k) return false;
  if (!/[a-z0-9]/.test(k)) return normalizedText.includes(k);
  const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(k)}(?=$|[^a-z0-9])`);
  return re.test(normalizedText);
}

const TRADEOFF_MARKERS = [
  "trade-off", "tradeoff", "danh doi", "tuy nhien", "nhung", "nguoc lai",
  "nhuoc diem", "uu diem", "rui ro", "risk", "chi phi", "cost", "however",
  "downside", "thay vi", "so voi", "vs", "doi lai", "fallback", "neu khong",
];

const STAR_MARKERS = [
  ["situation", "boi canh", "tinh huong"],
  ["task", "nhiem vu", "muc tieu"],
  ["action", "hanh dong", "toi da", "trien khai"],
  ["result", "ket qua"],
];

const TOOL_MARKERS = [
  "playwright", "github actions", "trace", "shard", "fixture", "storagestate",
  "kubernetes", "docker", "grafana", "bigquery", "postgres", "zod", "eslint",
  "tsc", "lighthouse", "k6", "allure", "llm", "json schema", "feature flag",
];

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function verdictFor(score: number): Verdict {
  if (score >= 85) return "Strong Hire";
  if (score >= 70) return "Hire";
  if (score >= 50) return "Lean No Hire";
  return "No Hire";
}

export function gradeAnswer(question: InterviewQuestion, answer: string): GradeResult {
  const text = normalize(answer);
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  /* 1. Coverage ------------------------------------------------------------ */
  const matched: string[] = [];
  const missed: string[] = [];
  for (const item of question.rubric) {
    const hit = item.keywords.some((k) => containsKeyword(text, k));
    (hit ? matched : missed).push(item.concept);
  }
  const coverage = question.rubric.length ? matched.length / question.rubric.length : 0;

  /* 2. Trade-offs ----------------------------------------------------------- */
  const tradeoffHits = TRADEOFF_MARKERS.filter((m) => containsKeyword(text, m)).length;
  const tradeoffs = clamp01(tradeoffHits / 3);

  /* 3. Structure ------------------------------------------------------------ */
  const paragraphs = answer.split(/\n\s*\n|\n(?=\s*[-*•\d]+[.)]?\s)/).filter((p) => p.trim()).length;
  const enumerations = (answer.match(/(^|\s)(\(?\d+[.)]|[-*•])\s/g) ?? []).length;
  const starParts = STAR_MARKERS.filter((group) => group.some((m) => containsKeyword(text, m))).length;
  const isBehavioral = question.category === "Behavioral (STAR)";
  const structure = isBehavioral
    ? clamp01(starParts / 4)
    : clamp01((Math.min(paragraphs, 4) / 4) * 0.5 + (Math.min(enumerations, 3) / 3) * 0.5 + starParts * 0.05);

  /* 4. Concreteness --------------------------------------------------------- */
  const numbers = (answer.match(/\d+([.,]\d+)?\s?(%|ms|s|phut|phút|gio|giờ|x|lan|lần)?/gi) ?? []).length;
  const tools = TOOL_MARKERS.filter((t) => containsKeyword(text, t)).length;
  const concreteness = clamp01(Math.min(numbers, 3) / 3 * 0.5 + Math.min(tools, 3) / 3 * 0.5);

  /* 5. Depth ---------------------------------------------------------------- */
  let depth: number;
  if (wordCount < 40) depth = wordCount / 80;
  else if (wordCount <= 450) depth = clamp01(0.5 + (wordCount - 40) / 160);
  else depth = 0.7; // lan man: interviewer sẽ ngắt lời

  const criteria: CriterionScore[] = [
    {
      id: "coverage",
      label: "Concept coverage",
      ratio: coverage,
      weight: 40,
      comment: `Nhắc tới ${matched.length}/${question.rubric.length} concept interviewer kỳ vọng.`,
    },
    {
      id: "tradeoffs",
      label: "Trade-off & rủi ro",
      ratio: tradeoffs,
      weight: 20,
      comment:
        tradeoffs >= 0.67
          ? "Có phân tích đánh đổi — đây là tín hiệu Senior rõ nhất."
          : "Chưa thấy rõ đánh đổi: nêu chi phí/rủi ro của chính giải pháp bạn chọn.",
    },
    {
      id: "structure",
      label: isBehavioral ? "Cấu trúc STAR" : "Cấu trúc trình bày",
      ratio: structure,
      weight: 15,
      comment: isBehavioral
        ? `Có ${starParts}/4 phần Situation · Task · Action · Result.`
        : structure >= 0.6
          ? "Trình bày có lớp lang, dễ theo dõi."
          : "Nên chia ý: làm rõ yêu cầu → giải pháp → trade-off → cách đo.",
    },
    {
      id: "concreteness",
      label: "Số liệu & công cụ cụ thể",
      ratio: concreteness,
      weight: 15,
      comment: `${numbers} con số · ${tools} công cụ/kỹ thuật cụ thể.`,
    },
    {
      id: "depth",
      label: "Độ sâu",
      ratio: clamp01(depth),
      weight: 10,
      comment:
        wordCount < 40
          ? "Quá ngắn so với câu hỏi cấp Senior."
          : wordCount > 450
            ? "Hơi dài — trong phỏng vấn nói 2–3 phút là vừa."
            : "Độ dài phù hợp.",
    },
  ];

  const score = Math.round(criteria.reduce((sum, c) => sum + c.ratio * c.weight, 0));

  /* Feedback ---------------------------------------------------------------- */
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (coverage >= 0.6) strengths.push(`Bao quát tốt các ý chính: ${matched.slice(0, 3).join(", ")}.`);
  if (tradeoffs >= 0.67) strengths.push("Thể hiện tư duy trade-off thay vì một đáp án tuyệt đối.");
  if (concreteness >= 0.6) strengths.push("Có số liệu/công cụ cụ thể giúp câu trả lời đáng tin.");
  if (isBehavioral && starParts === 4) strengths.push("Câu chuyện đủ 4 phần STAR.");

  if (missed.length) improvements.push(`Bổ sung: ${missed.join(", ")}.`);
  if (tradeoffs < 0.67) improvements.push("Thêm một đoạn ‘Trade-off’: giải pháp của bạn tốn gì, rủi ro gì, khi nào bạn chọn phương án khác.");
  if (numbers === 0) improvements.push("Đưa ít nhất 1–2 con số (thời gian pipeline, % flaky, số test, chi phí) để lượng hoá tác động.");
  if (!isBehavioral && structure < 0.6) improvements.push("Mở đầu bằng việc làm rõ yêu cầu/giả định, rồi đi theo các bước có đánh số.");
  if (isBehavioral && starParts < 4) improvements.push("Kể theo đúng thứ tự Situation → Task → Action → Result, kết bằng kết quả đo được.");
  if (wordCount < 40) improvements.push("Phát triển câu trả lời dài hơn — mục tiêu 120–300 từ.");
  if (!strengths.length) strengths.push("Bạn đã bắt đầu — hãy mở ‘Gợi ý trả lời’ để so sánh và thử lại.");

  return {
    score,
    verdict: verdictFor(score),
    criteria,
    matchedConcepts: matched,
    missedConcepts: missed,
    strengths,
    improvements,
    wordCount,
  };
}
