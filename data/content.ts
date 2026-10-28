/**
 * data/content.ts
 * ----------------------------------------------------------------------------
 * Single source of truth cho toàn bộ nội dung của AI Automation Senior Hub.
 * UI chỉ "render" dữ liệu ở đây — muốn thêm kiến thức / câu hỏi mới thì chỉ
 * cần sửa file này, không phải đụng vào component.
 * ----------------------------------------------------------------------------
 */

/* ============================================================================
 * 1. TYPES
 * ========================================================================== */

export type TopicStatus = "done" | "in-progress" | "todo";

export interface Topic {
  title: string;
  status: TopicStatus;
  /** Ghi chú ngắn: tại sao topic này quan trọng ở level Senior */
  note?: string;
}

export interface Module {
  id: string;
  title: string;
  summary: string;
  topics: Topic[];
}

export interface CodeSample {
  title: string;
  language: "ts" | "yaml" | "ruby" | "bash" | "json";
  code: string;
}

export interface Resource {
  title: string;
  url: string;
  kind: "docs" | "article" | "repo" | "course";
}

export interface Phase {
  id: string;
  order: number;
  title: string;
  shortTitle: string;
  tagline: string;
  durationWeeks: number;
  /** Tận dụng background Full-stack hiện có của bạn như thế nào */
  leverage: string;
  outcomes: string[];
  modules: Module[];
  /** Deliverable thực chiến để đưa vào portfolio / kể trong phỏng vấn */
  capstone: { title: string; description: string; acceptance: string[] };
  samples: CodeSample[];
  resources: Resource[];
}

export interface Stat {
  id: string;
  label: string;
  value: string;
  hint: string;
  trend: { direction: "up" | "down" | "flat"; label: string };
  /** Với "down", giảm là tốt (vd: flaky rate) */
  goodWhen: "up" | "down";
}

export type QuestionCategory =
  | "Playwright & Architecture"
  | "AI-Driven Testing"
  | "Flaky Tests"
  | "System Design"
  | "CI/CD & Quality Gates"
  | "Behavioral (STAR)";

export type Difficulty = "Senior" | "Staff" | "Principal";

export interface RubricItem {
  /** Concept người phỏng vấn kỳ vọng nghe thấy */
  concept: string;
  /** Từ khoá (EN/VI, không phân biệt dấu) để simulator nhận diện concept */
  keywords: string[];
}

export interface InterviewQuestion {
  id: string;
  category: QuestionCategory;
  difficulty: Difficulty;
  question: string;
  /** Interviewer thực sự muốn đánh giá điều gì */
  whatTheyTest: string;
  answer: string[];
  keyPoints: string[];
  pitfalls: string[];
  code?: CodeSample;
  rubric: RubricItem[];
}

/* ============================================================================
 * 2. PROFILE & STATS (giả lập)
 * ========================================================================== */

export const profile = {
  name: "Senior Full-stack → AI SDET",
  currentRole: "Senior Full-stack Engineer · 5+ năm",
  stack: ["Ruby", "TypeScript", "Next.js", "React", "Node.js", "REST", "CI/CD"],
  target: "Senior Automation Test AI / AI SDET",
  weeklyHours: 12,
};

/** Thẻ "Tiến độ lộ trình" được tính từ dữ liệu phases — xem getStats() */
const simulatedStats: Stat[] = [
  {
    id: "streak",
    label: "Chuỗi ngày học",
    value: "12 ngày",
    hint: "Kỷ lục: 21 ngày",
    trend: { direction: "up", label: "+3 ngày" },
    goodWhen: "up",
  },
  {
    id: "mock",
    label: "Điểm Mock Interview TB",
    value: "72/100",
    hint: "8 phiên luyện · mục tiêu ≥ 85",
    trend: { direction: "up", label: "+9 điểm" },
    goodWhen: "up",
  },
  {
    id: "flaky",
    label: "Flaky rate (lab repo)",
    value: "1.8%",
    hint: "Trên 420 test chạy CI · mục tiêu < 1%",
    trend: { direction: "down", label: "-2.4% sau quarantine" },
    goodWhen: "down",
  },
];

export const weeklyFocus = [
  "Hoàn thiện Fixture layer + auth storageState cho lab repo",
  "Viết ADR: chọn LLM fallback hay heuristic cho self-healing locator",
  "Luyện 3 câu System Design trong Interview Hub (mục tiêu ≥ 80 điểm)",
];

/* ============================================================================
 * 3. ROADMAP — 3 PHASES
 * ========================================================================== */

export const phases: Phase[] = [
  /* -------------------------------------------------------------------------
   * PHASE 1
   * ----------------------------------------------------------------------- */
  {
    id: "test-architecture",
    order: 1,
    title: "Test Architecture & Advanced SDET",
    shortTitle: "Test Architecture",
    tagline:
      "Thiết kế framework Playwright + TypeScript có thể scale cho 50+ engineer, không chỉ “viết được test”.",
    durationWeeks: 6,
    leverage:
      "Bạn đã quen Next.js, REST, CI/CD — lợi thế lớn là hiểu app từ bên trong: biết đâu là boundary nên mock, đâu cần E2E thật. Điều cần đổi tư duy: từ “feature chạy được” sang “risk đã được kiểm soát với chi phí hợp lý”.",
    outcomes: [
      "Giải thích được Test Pyramid vs Testing Trophy và chọn tỉ lệ dựa trên risk, không theo cảm tính",
      "Dựng framework Playwright nhiều layer: config → fixtures → page objects/components → specs",
      "Test data strategy: factory, API seeding, isolation khi chạy song song",
      "Component testing cho Next.js (RSC vs Client Component) và contract testing cho API",
    ],
    modules: [
      {
        id: "strategy",
        title: "Test Strategy & Pyramid",
        summary:
          "Phân bổ test theo risk và chi phí phản hồi. Senior được đánh giá bằng quyết định ‘KHÔNG test gì ở E2E’.",
        topics: [
          { title: "Test Pyramid vs Testing Trophy vs Honeycomb", status: "done", note: "Biết khi nào mỗi mô hình hợp lý (monolith vs microservices)" },
          { title: "Risk-based testing & coverage matrix", status: "done" },
          { title: "Shift-left: test trong PR, preview env per branch", status: "in-progress" },
          { title: "Định nghĩa SLO cho test suite (thời gian, flaky rate)", status: "todo", note: "Ví dụ: P95 PR pipeline < 10 phút, flaky < 1%" },
        ],
      },
      {
        id: "framework",
        title: "Playwright Framework Design",
        summary:
          "Fixtures thay cho before/after hooks, POM có giới hạn, locator theo accessibility.",
        topics: [
          { title: "Custom fixtures (test.extend) & fixture scopes", status: "done" },
          { title: "Page Object vs Screenplay vs Component Object", status: "done" },
          { title: "Locator strategy: getByRole / getByTestId / không dùng XPath", status: "done" },
          { title: "Auth: storageState per role, setup project", status: "in-progress" },
          { title: "Network mocking: page.route, HAR replay", status: "todo" },
        ],
      },
      {
        id: "data",
        title: "Test Data & Isolation",
        summary: "Parallel-safe data là điều kiện tiên quyết để scale và giảm flaky.",
        topics: [
          { title: "Data factory + API seeding (không seed qua UI)", status: "done" },
          { title: "Tenant/worker isolation với workerIndex", status: "in-progress" },
          { title: "Cleanup strategy: teardown vs TTL vs ephemeral DB", status: "todo" },
        ],
      },
      {
        id: "nextjs",
        title: "Next.js Component & Contract Testing",
        summary: "Tận dụng thế mạnh Next.js của bạn để test đúng layer.",
        topics: [
          { title: "Playwright Component Testing vs Vitest + Testing Library", status: "in-progress" },
          { title: "Test Server Components & Server Actions qua integration layer", status: "todo" },
          { title: "Contract testing (Pact) / schema validation với Zod", status: "todo" },
        ],
      },
    ],
    capstone: {
      title: "Lab Repo: playwright-enterprise-starter",
      description:
        "Framework Playwright + TS cho một app Next.js mẫu (e-commerce mini), có fixtures nhiều layer, data factory và chạy 4 shards trên GitHub Actions.",
      acceptance: [
        "≥ 60 test, chạy song song 4 workers × 4 shards, tổng < 6 phút",
        "0 hard-wait (waitForTimeout) — enforce bằng ESLint rule",
        "README có ADR giải thích từng quyết định kiến trúc",
      ],
    },
    samples: [
      {
        title: "fixtures/base.ts — layered fixtures thay cho beforeEach",
        language: "ts",
        code: `import { test as base, expect } from "@playwright/test";
import { ApiClient } from "../api/client";
import { UserFactory, type TestUser } from "../data/user.factory";
import { CheckoutPage } from "../pages/checkout.page";

type Fixtures = {
  api: ApiClient;
  user: TestUser;            // user riêng cho mỗi test -> parallel-safe
  checkoutPage: CheckoutPage;
};

export const test = base.extend<Fixtures>({
  api: async ({ request }, use) => {
    await use(new ApiClient(request));
  },

  user: async ({ api }, use, testInfo) => {
    // Seed qua API (nhanh, ổn định) thay vì đi qua UI
    const user = await UserFactory.create(api, {
      tag: \`w\${testInfo.workerIndex}-\${testInfo.testId}\`,
    });
    await use(user);
    await api.users.delete(user.id); // teardown đảm bảo isolation
  },

  checkoutPage: async ({ page, user }, use) => {
    await page.context().addCookies(user.sessionCookies);
    await use(new CheckoutPage(page));
  },
});

export { expect };`,
      },
    ],
    resources: [
      { title: "Playwright Docs — Fixtures", url: "https://playwright.dev/docs/test-fixtures", kind: "docs" },
      { title: "Playwright Docs — Best Practices", url: "https://playwright.dev/docs/best-practices", kind: "docs" },
      { title: "Kent C. Dodds — The Testing Trophy", url: "https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications", kind: "article" },
      { title: "Martin Fowler — The Practical Test Pyramid", url: "https://martinfowler.com/articles/practical-test-pyramid.html", kind: "article" },
    ],
  },

  /* -------------------------------------------------------------------------
   * PHASE 2
   * ----------------------------------------------------------------------- */
  {
    id: "ai-driven-testing",
    order: 2,
    title: "AI-Driven Testing Workflow",
    shortTitle: "AI-Driven Testing",
    tagline:
      "LLM sinh test, self-healing locator, visual regression bằng AI — kèm guardrail để không biến AI thành nguồn flaky mới.",
    durationWeeks: 8,
    leverage:
      "Kinh nghiệm gọi REST API và xây backend Node/Ruby giúp bạn dựng pipeline LLM nhanh. Phần cần đầu tư: prompt engineering có cấu trúc, đánh giá output (evals) và thiết kế human-in-the-loop.",
    outcomes: [
      "Dựng pipeline: requirement/OpenAPI → test plan → Playwright spec, có validation bằng tsc + chạy thử",
      "Self-healing locator nhiều tầng: heuristic → DOM similarity → LLM fallback, có audit log",
      "Đo lường AI: precision của healing, tỉ lệ test sinh ra được merge, chi phí token / test",
      "Prompt engineering cho edge case: boundary, negative, security, i18n",
    ],
    modules: [
      {
        id: "generation",
        title: "LLM Test Generation Pipeline",
        summary: "Từ user story / OpenAPI spec sinh test có cấu trúc, không phải ‘chat ra code’.",
        topics: [
          { title: "Structured output (JSON schema) cho test plan", status: "in-progress", note: "Ép LLM trả JSON → validate bằng Zod trước khi render code" },
          { title: "Context engineering: đưa POM + fixtures hiện có vào prompt", status: "in-progress" },
          { title: "Validation loop: tsc → lint → dry-run → self-repair", status: "todo" },
          { title: "Evals: golden set để đo chất lượng test sinh ra", status: "todo" },
        ],
      },
      {
        id: "healing",
        title: "Self-Healing Locators",
        summary: "Giảm chi phí maintain mà không che giấu bug thật.",
        topics: [
          { title: "Fingerprint element: role, name, text, attributes, vị trí DOM", status: "done" },
          { title: "Similarity scoring + confidence threshold", status: "in-progress" },
          { title: "LLM fallback với DOM snapshot đã rút gọn (token budget)", status: "todo" },
          { title: "Healing → tạo PR sửa locator, không auto-commit", status: "todo", note: "Human-in-the-loop là điểm ăn tiền trong phỏng vấn" },
        ],
      },
      {
        id: "visual",
        title: "AI Visual & Functional Regression",
        summary: "Phân biệt thay đổi có chủ đích và regression bằng AI thay vì pixel diff thuần.",
        topics: [
          { title: "Pixel diff vs perceptual diff vs AI semantic diff", status: "todo" },
          { title: "Ổn định snapshot: mask dynamic content, font, animation", status: "done" },
          { title: "Vision model để phân loại diff (layout / content / noise)", status: "todo" },
        ],
      },
      {
        id: "prompting",
        title: "Prompt Engineering cho QA",
        summary: "Prompt có cấu trúc, versioned và được test như code.",
        topics: [
          { title: "Prompt template + few-shot từ test chuẩn của team", status: "done" },
          { title: "Edge-case taxonomy: boundary, negative, auth, race, i18n", status: "in-progress" },
          { title: "Prompt versioning & regression test cho prompt", status: "todo" },
        ],
      },
    ],
    capstone: {
      title: "ai-test-gen CLI + Self-healing plugin",
      description:
        "CLI nhận user story hoặc OpenAPI, sinh Playwright spec dùng đúng fixtures của repo; plugin self-healing ghi lại mọi lần healing và mở PR đề xuất.",
      acceptance: [
        "≥ 70% spec sinh ra pass tsc + chạy xanh ở lần đầu trên golden set 20 story",
        "Healing precision ≥ 95% trên bộ 50 locator bị phá có chủ đích",
        "Báo cáo chi phí: token & $ trên mỗi test sinh ra",
      ],
    },
    samples: [
      {
        title: "healing/locator.ts — self-healing nhiều tầng có confidence",
        language: "ts",
        code: `import type { Locator, Page } from "@playwright/test";
import { scoreCandidates, type Fingerprint } from "./similarity";
import { askLlmForSelector } from "./llm-fallback";
import { recordHealing } from "./audit-log";

const MIN_CONFIDENCE = 0.85;

export async function resilientLocator(
  page: Page,
  key: string,
  primary: Locator,
  fingerprint: Fingerprint,
): Promise<Locator> {
  // Tầng 0: locator gốc (phần lớn trường hợp dừng ở đây)
  if ((await primary.count()) === 1) return primary;

  // Tầng 1: heuristic similarity trên DOM hiện tại (rẻ, deterministic)
  const best = await scoreCandidates(page, fingerprint);
  if (best && best.score >= MIN_CONFIDENCE) {
    await recordHealing({ key, strategy: "similarity", ...best });
    return page.locator(best.selector);
  }

  // Tầng 2: LLM fallback (đắt) — chỉ khi heuristic không đủ tự tin
  const suggestion = await askLlmForSelector(page, fingerprint);
  if (suggestion && suggestion.confidence >= MIN_CONFIDENCE) {
    await recordHealing({ key, strategy: "llm", ...suggestion });
    return page.locator(suggestion.selector);
  }

  // Không đoán bừa: fail rõ ràng để không che giấu bug thật
  throw new Error(\`[self-healing] Không tìm được element "\${key}" đủ tin cậy\`);
}`,
      },
      {
        title: "prompts/test-plan.json — structured output schema",
        language: "json",
        code: `{
  "name": "test_plan",
  "schema": {
    "type": "object",
    "required": ["feature", "cases"],
    "properties": {
      "feature": { "type": "string" },
      "cases": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["id", "type", "title", "steps", "expected", "risk"],
          "properties": {
            "id": { "type": "string" },
            "type": { "enum": ["happy", "boundary", "negative", "security", "a11y"] },
            "title": { "type": "string" },
            "steps": { "type": "array", "items": { "type": "string" } },
            "expected": { "type": "string" },
            "risk": { "enum": ["high", "medium", "low"] }
          }
        }
      }
    }
  }
}`,
      },
    ],
    resources: [
      { title: "Playwright — Test generator (codegen)", url: "https://playwright.dev/docs/codegen", kind: "docs" },
      { title: "Playwright — Visual comparisons", url: "https://playwright.dev/docs/test-snapshots", kind: "docs" },
      { title: "Anthropic — Prompt engineering overview", url: "https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview", kind: "docs" },
      { title: "Microsoft — Playwright MCP server", url: "https://github.com/microsoft/playwright-mcp", kind: "repo" },
    ],
  },

  /* -------------------------------------------------------------------------
   * PHASE 3
   * ----------------------------------------------------------------------- */
  {
    id: "cicd-quality-gates",
    order: 3,
    title: "Enterprise CI/CD & Quality Gates",
    shortTitle: "CI/CD & Quality Gates",
    tagline:
      "Biến test suite thành hệ thống ra quyết định: shard, quarantine, regression analysis và dashboard chất lượng.",
    durationWeeks: 6,
    leverage:
      "Bạn đã làm CI/CD — giờ nâng lên tầm platform: test là một sản phẩm nội bộ với SLO, telemetry và chi phí rõ ràng.",
    outcomes: [
      "Thiết kế pipeline nhiều tầng: PR smoke → merge full → nightly cross-browser/perf",
      "Sharding + test impact analysis để giữ PR feedback < 10 phút",
      "Quality gate có ngữ cảnh: coverage diff, flaky budget, perf budget, a11y",
      "Dashboard flaky/perf + AI phân loại failure (product bug / test bug / infra)",
    ],
    modules: [
      {
        id: "pipeline",
        title: "Pipeline Architecture",
        summary: "Đúng test, đúng thời điểm, đúng chi phí.",
        topics: [
          { title: "GitHub Actions matrix + sharding + merge reports", status: "done" },
          { title: "Test Impact Analysis (chạy test theo file thay đổi)", status: "todo" },
          { title: "Ephemeral preview environment per PR", status: "in-progress" },
          { title: "Caching: browsers, node_modules, Docker layers", status: "done" },
        ],
      },
      {
        id: "gates",
        title: "Quality Gates",
        summary: "Gate phải chặn đúng risk, không chặn nhầm vì noise.",
        topics: [
          { title: "Gate rules: block / warn / info theo mức độ", status: "in-progress" },
          { title: "Flaky budget & auto-quarantine có owner + SLA", status: "todo" },
          { title: "Performance budget (Lighthouse CI, k6 smoke)", status: "todo" },
          { title: "Security scan: dependency, secret, DAST cơ bản", status: "todo" },
        ],
      },
      {
        id: "observability",
        title: "Test Observability & Analytics",
        summary: "Không đo được thì không cải thiện được.",
        topics: [
          { title: "Thu thập kết quả: JUnit/JSON → DB (Postgres/BigQuery)", status: "todo" },
          { title: "Flakiness score theo cửa sổ thời gian", status: "todo", note: "Flip rate trên cùng commit là tín hiệu mạnh nhất" },
          { title: "AI failure triage: cluster lỗi theo stack trace + log", status: "todo" },
          { title: "Dashboard: Grafana / Next.js nội bộ", status: "todo" },
        ],
      },
    ],
    capstone: {
      title: "Quality Gate Platform",
      description:
        "Workflow GitHub Actions tái sử dụng + service nhỏ (Next.js API) lưu kết quả test, tính flakiness score và comment tóm tắt AI vào PR.",
      acceptance: [
        "PR pipeline P95 < 10 phút với 400+ test",
        "Test flaky tự quarantine và tạo issue có owner trong < 5 phút",
        "PR comment: test fail được phân loại kèm lý do, độ chính xác ≥ 80% trên 30 case gắn nhãn",
      ],
    },
    samples: [
      {
        title: ".github/workflows/e2e.yml — sharded Playwright + merged report",
        language: "yaml",
        code: `name: e2e
on: [pull_request]

concurrency:
  group: e2e-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test --shard=\${{ matrix.shard }}/4 --reporter=blob
      - uses: actions/upload-artifact@v4
        if: \${{ !cancelled() }}
        with:
          name: blob-\${{ matrix.shard }}
          path: blob-report
          retention-days: 3

  report:
    needs: test
    if: \${{ !cancelled() }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - uses: actions/download-artifact@v4
        with: { pattern: blob-*, path: all-blobs, merge-multiple: true }
      - run: npx playwright merge-reports --reporter=html,json all-blobs
      - run: node scripts/quality-gate.mjs   # flaky budget, duration, block/warn`,
      },
    ],
    resources: [
      { title: "Playwright — Sharding", url: "https://playwright.dev/docs/test-sharding", kind: "docs" },
      { title: "Playwright — CI (GitHub Actions)", url: "https://playwright.dev/docs/ci-intro", kind: "docs" },
      { title: "Google Testing Blog — Flaky Tests at Google", url: "https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html", kind: "article" },
      { title: "Lighthouse CI", url: "https://github.com/GoogleChrome/lighthouse-ci", kind: "repo" },
    ],
  },
];

/* ============================================================================
 * 4. INTERVIEW QUESTIONS
 * ========================================================================== */

export const questionCategories: QuestionCategory[] = [
  "Playwright & Architecture",
  "AI-Driven Testing",
  "Flaky Tests",
  "System Design",
  "CI/CD & Quality Gates",
  "Behavioral (STAR)",
];

export const interviewQuestions: InterviewQuestion[] = [
  /* ---------------------------- Playwright & Architecture ---------------- */
  {
    id: "pw-framework-from-scratch",
    category: "Playwright & Architecture",
    difficulty: "Senior",
    question:
      "Nếu được giao dựng framework E2E từ con số 0 cho một sản phẩm Next.js có 6 team, bạn thiết kế kiến trúc thế nào?",
    whatTheyTest:
      "Khả năng thiết kế có layer, tư duy scale theo người (không chỉ theo số test) và biết đặt ra guardrail.",
    answer: [
      "Tôi bắt đầu từ câu hỏi ‘risk nào cần E2E?’ chứ không phải tool. Với Next.js, phần lớn logic nên được bao phủ ở unit/component (Vitest + Testing Library), API ở integration/contract; E2E chỉ giữ critical user journey: đăng nhập, checkout, phân quyền.",
      "Kiến trúc framework chia layer: (1) config theo môi trường và project (browser, role); (2) fixtures cung cấp api client, user đã seed, page đã đăng nhập; (3) page/component object mỏng, chỉ chứa locator + action nghiệp vụ, assertion để ở spec; (4) specs viết theo ngôn ngữ domain; (5) reporters + telemetry.",
      "Để scale cho 6 team: mỗi team sở hữu thư mục specs và tag riêng (@checkout, @search), CODEOWNERS cho test, shared layer do platform team review. Guardrail bằng lint rule: cấm waitForTimeout, cấm locator CSS dài, bắt buộc dùng fixture user thay vì tài khoản dùng chung.",
      "Data được seed qua API theo từng worker để chạy song song an toàn. Trên CI chạy shard, PR chỉ chạy smoke + test bị ảnh hưởng, full suite khi merge.",
    ],
    keyPoints: [
      "Bắt đầu từ risk & test strategy, không bắt đầu từ tool",
      "Layer rõ ràng: config → fixtures → page objects → specs → reporting",
      "Ownership theo team (tags, CODEOWNERS) + platform team giữ shared layer",
      "Guardrail tự động bằng lint rule thay vì dựa vào code review",
      "Data isolation per worker để song song hoá",
    ],
    pitfalls: [
      "Nói ngay ‘dùng Playwright + POM’ mà không nhắc đến strategy",
      "Page Object chứa assertion và logic điều kiện phức tạp",
      "Dùng chung tài khoản test giữa các worker",
    ],
    code: phases[0].samples[0],
    rubric: [
      { concept: "Test strategy / pyramid", keywords: ["pyramid", "trophy", "risk", "strategy", "chien luoc", "unit", "component test"] },
      { concept: "Fixtures & layering", keywords: ["fixture", "layer", "tang", "page object", "pom"] },
      { concept: "Data isolation", keywords: ["isolation", "seed", "factory", "worker", "parallel", "song song", "co lap"] },
      { concept: "Ownership & governance", keywords: ["codeowners", "ownership", "team", "lint", "guardrail", "review"] },
      { concept: "CI execution", keywords: ["shard", "ci", "pipeline", "smoke", "github actions"] },
    ],
  },
  {
    id: "pw-pom-vs-alternatives",
    category: "Playwright & Architecture",
    difficulty: "Senior",
    question:
      "Page Object Model có còn là lựa chọn tốt với Playwright không? So sánh với fixtures-first, Screenplay và Component Object.",
    whatTheyTest: "Khả năng phân tích trade-off thay vì trả lời theo khuôn mẫu.",
    answer: [
      "POM vẫn hữu ích như một lớp đóng gói locator và hành động nghiệp vụ, nhưng POM ‘béo’ (kế thừa sâu, chứa assertion, nhiều method generic) là anti-pattern phổ biến nhất.",
      "Với Playwright, tôi ưu tiên fixtures-first: fixtures lo dependency injection và vòng đời (user, page đã login, api), còn object chỉ mô hình hoá UI. Với design system dùng lại nhiều, Component Object (DatePicker, DataTable) tái sử dụng tốt hơn page-level object.",
      "Screenplay mạnh khi domain phức tạp và nhiều actor, nhưng chi phí học và boilerplate cao — chỉ đáng khi team lớn và test viết theo ngôn ngữ nghiệp vụ.",
      "Quyết định của tôi: fixtures + component object mỏng, composition thay vì inheritance, và đo bằng chi phí sửa khi UI đổi (bao nhiêu file phải sửa cho một thay đổi locator).",
    ],
    keyPoints: [
      "Không có đáp án tuyệt đối — đưa ra tiêu chí chọn",
      "Composition > inheritance cho page objects",
      "Fixtures giải quyết vòng đời & DI, object chỉ mô hình hoá UI",
      "Đo maintainability bằng metric cụ thể",
    ],
    pitfalls: ["Khẳng định ‘POM đã lỗi thời’ hoặc ‘POM luôn đúng’", "Không nêu chi phí của Screenplay"],
    rubric: [
      { concept: "Trade-off analysis", keywords: ["trade-off", "danh doi", "chi phi", "uu diem", "nhuoc diem", "however", "tuy nhien"] },
      { concept: "Fixtures-first", keywords: ["fixture", "dependency injection", "vong doi", "lifecycle"] },
      { concept: "Component object / composition", keywords: ["component", "composition", "inheritance", "ke thua", "design system"] },
      { concept: "Screenplay awareness", keywords: ["screenplay", "actor", "task"] },
    ],
  },

  /* ---------------------------- AI-Driven Testing ------------------------ */
  {
    id: "ai-self-healing-design",
    category: "AI-Driven Testing",
    difficulty: "Staff",
    question:
      "Thiết kế cơ chế self-healing locator dùng AI. Làm sao để nó giảm maintenance mà không che giấu bug thật?",
    whatTheyTest:
      "Hiểu rủi ro của AI trong testing (false positive), thiết kế có tầng, có guardrail và human-in-the-loop.",
    answer: [
      "Rủi ro lớn nhất của self-healing là ‘heal nhầm’: nút ‘Xoá’ biến mất do bug nhưng hệ thống tìm sang nút ‘Huỷ’ và test vẫn xanh. Vì vậy mục tiêu là healing có kiểm soát, không phải healing tối đa.",
      "Tôi thiết kế 3 tầng: (1) locator gốc theo role/test-id; (2) heuristic similarity dựa trên fingerprint lưu từ lần chạy xanh gần nhất (role, accessible name, text, thuộc tính, vị trí tương đối) — rẻ và deterministic; (3) LLM fallback với DOM snapshot đã rút gọn, chỉ khi tầng 2 dưới ngưỡng.",
      "Guardrail: confidence threshold (ví dụ 0.85); không heal với hành động phá huỷ (delete, payment); mọi lần heal được ghi audit log và test được đánh dấu ‘healed’ (cảnh báo, không xanh hoàn toàn); hệ thống mở PR đề xuất sửa locator để người review, không auto-commit.",
      "Đo lường: healing precision trên bộ locator bị phá có chủ đích, số lần heal mỗi tuần, thời gian tiết kiệm, và chi phí token. Nếu precision < 95% thì tắt tầng LLM.",
    ],
    keyPoints: [
      "Nêu rõ rủi ro false positive trước khi nêu giải pháp",
      "Tầng: deterministic trước, LLM sau (chi phí + độ ổn định)",
      "Confidence threshold + danh sách hành động không được heal",
      "Audit log + PR đề xuất = human-in-the-loop",
      "Metric: precision, tần suất heal, token cost",
    ],
    pitfalls: [
      "Để AI tự sửa và commit locator",
      "Gọi LLM cho mọi lần locator fail (chậm, đắt, non-deterministic)",
      "Không có cách đo precision",
    ],
    code: phases[1].samples[0],
    rubric: [
      { concept: "False positive risk", keywords: ["false positive", "heal nham", "che giau", "mask", "bug that", "duong tinh gia"] },
      { concept: "Layered strategy", keywords: ["tang", "layer", "heuristic", "similarity", "fingerprint", "fallback"] },
      { concept: "Confidence threshold", keywords: ["confidence", "threshold", "nguong", "score"] },
      { concept: "Human-in-the-loop", keywords: ["human", "review", "pull request", "pr", "audit", "log"] },
      { concept: "Metrics & cost", keywords: ["precision", "metric", "token", "chi phi", "cost", "do luong"] },
    ],
  },
  {
    id: "ai-test-generation",
    category: "AI-Driven Testing",
    difficulty: "Senior",
    question:
      "Bạn sẽ xây pipeline dùng LLM để sinh test case và Playwright code như thế nào để output đáng tin cậy?",
    whatTheyTest: "Context engineering, structured output, validation loop và evals.",
    answer: [
      "Tôi tách thành 2 bước: sinh test plan có cấu trúc (JSON schema: type happy/boundary/negative/security, steps, expected, risk) rồi mới sinh code. Tách bước giúp con người review plan rẻ hơn review code.",
      "Context engineering: prompt chứa user story/OpenAPI, danh sách fixtures và page objects hiện có, 2–3 test mẫu chuẩn của team (few-shot) và quy tắc bắt buộc (dùng getByRole, không hard-wait). Không đưa cả repo — chọn lọc theo token budget.",
      "Validation loop tự động: parse JSON bằng Zod → render code → tsc + ESLint → chạy thử trên preview env → nếu lỗi, đưa error ngược lại cho model sửa tối đa N lần. Test chỉ vào PR khi pass cả vòng.",
      "Chất lượng được đo bằng evals: golden set user stories với test case kỳ vọng, đo coverage edge case, tỉ lệ pass lần đầu và tỉ lệ được merge sau review. Prompt được version hoá và có regression test như code.",
    ],
    keyPoints: [
      "Plan trước, code sau — review rẻ hơn",
      "Structured output + schema validation",
      "Context chọn lọc: fixtures, POM, few-shot, rules",
      "Validation loop: tsc → lint → run → self-repair",
      "Evals & prompt versioning",
    ],
    pitfalls: ["Copy output chat vào repo", "Không có cách đo chất lượng test sinh ra", "Bỏ qua chi phí token"],
    code: phases[1].samples[1],
    rubric: [
      { concept: "Structured output", keywords: ["json", "schema", "structured", "zod", "cau truc"] },
      { concept: "Context engineering", keywords: ["context", "few-shot", "example", "prompt", "fixtures", "token"] },
      { concept: "Validation loop", keywords: ["tsc", "lint", "validate", "compile", "dry-run", "self-repair", "chay thu"] },
      { concept: "Evals", keywords: ["eval", "golden", "benchmark", "do luong", "metric", "pass rate"] },
      { concept: "Human review", keywords: ["review", "human", "pr", "merge"] },
    ],
  },
  {
    id: "ai-visual-regression",
    category: "AI-Driven Testing",
    difficulty: "Senior",
    question:
      "Visual regression bằng pixel diff gây quá nhiều false positive. Bạn áp dụng AI để giải quyết thế nào?",
    whatTheyTest: "Hiểu nguồn gốc noise và biết AI là tầng bổ sung, không phải thay thế ổn định hoá.",
    answer: [
      "Trước khi thêm AI tôi loại bỏ noise tận gốc: font cố định trong container, tắt animation (reducedMotion, CSS), mask nội dung động (thời gian, avatar, quảng cáo), dữ liệu seed cố định, cùng một OS/browser image trên CI.",
      "Sau đó dùng phân tầng: pixel diff với threshold làm bộ lọc rẻ; diff vượt ngưỡng mới đưa qua perceptual/semantic diff. Vision model phân loại diff thành layout shift, content change, rendering noise và tóm tắt bằng ngôn ngữ tự nhiên trong PR.",
      "AI chỉ đề xuất nhãn; quyết định approve baseline vẫn là con người. Tôi theo dõi tỉ lệ đồng ý giữa AI và reviewer để hiệu chỉnh ngưỡng.",
    ],
    keyPoints: [
      "Ổn định hoá môi trường trước khi dùng AI",
      "Pixel diff làm bộ lọc rẻ → AI cho phần còn lại",
      "AI phân loại & giải thích, người quyết định baseline",
      "Đo agreement rate để tune",
    ],
    pitfalls: ["Dùng AI để che noise do môi trường không ổn định", "Auto-approve baseline"],
    rubric: [
      { concept: "Root-cause noise", keywords: ["mask", "animation", "font", "dynamic", "on dinh", "docker", "noise"] },
      { concept: "Tiered diff", keywords: ["threshold", "pixel", "perceptual", "semantic", "tang", "nguong"] },
      { concept: "Vision model classification", keywords: ["vision", "phan loai", "classify", "model", "layout"] },
      { concept: "Human approval", keywords: ["approve", "baseline", "human", "review", "nguoi"] },
    ],
  },

  /* ---------------------------- Flaky Tests ------------------------------ */
  {
    id: "flaky-strategy",
    category: "Flaky Tests",
    difficulty: "Senior",
    question:
      "Suite 1.200 test có flaky rate 8%, dev bắt đầu bấm re-run cho đến khi xanh. Bạn xử lý thế nào trong 30–60–90 ngày?",
    whatTheyTest: "Tư duy hệ thống + quản trị: đo lường, ưu tiên, ownership và thay đổi văn hoá.",
    answer: [
      "30 ngày đầu — đo và cầm máu: thu thập kết quả từng test qua mọi lần chạy, tính flakiness score dựa trên ‘flip’ (cùng commit vừa pass vừa fail). Auto-quarantine test vượt ngưỡng sang job non-blocking, mỗi test quarantine có issue, owner và SLA sửa. Mục tiêu là trả lại niềm tin cho pipeline ngay.",
      "60 ngày — sửa theo nguyên nhân gốc, ưu tiên theo tần suất × tầm quan trọng. Phân loại nguyên nhân: timing (hard-wait, thiếu auto-wait/web-first assertion), shared state/data, phụ thuộc thứ tự, môi trường/infra, và bug thật của sản phẩm (race condition). Mỗi nhóm có fix pattern và lint rule tương ứng.",
      "90 ngày — phòng ngừa: flaky budget là quality gate (test mới phải chạy N lần xanh trước khi vào suite chính), dashboard công khai theo team, retries chỉ dùng để phát hiện chứ không để che giấu (test pass ở retry vẫn được đánh dấu flaky).",
      "Kết quả kỳ vọng: flaky < 1%, re-run thủ công gần như bằng 0, và thời gian pipeline giảm vì bớt retry.",
    ],
    keyPoints: [
      "Đo bằng flip rate trên cùng commit",
      "Quarantine có owner + SLA, không phải ‘bãi rác’",
      "Phân loại root cause → fix pattern + lint rule",
      "Retry để phát hiện, không để che giấu",
      "Flaky budget làm quality gate cho test mới",
    ],
    pitfalls: [
      "Tăng retries lên 3 rồi coi như xong",
      "Xoá test flaky mà không phân tích",
      "Bỏ qua khả năng flaky là bug race condition thật",
    ],
    rubric: [
      { concept: "Measurement", keywords: ["flip", "flakiness score", "metric", "do luong", "measure", "dashboard", "ty le"] },
      { concept: "Quarantine with ownership", keywords: ["quarantine", "owner", "sla", "issue", "cach ly"] },
      { concept: "Root cause taxonomy", keywords: ["root cause", "nguyen nhan", "timing", "shared state", "race", "data", "environment", "moi truong"] },
      { concept: "Retry policy", keywords: ["retry", "retries", "re-run", "chay lai"] },
      { concept: "Prevention gate", keywords: ["budget", "gate", "prevent", "phong ngua", "lint"] },
    ],
  },
  {
    id: "flaky-debug-playwright",
    category: "Flaky Tests",
    difficulty: "Senior",
    question:
      "Một test Playwright fail khoảng 1/20 lần chỉ trên CI. Hãy mô tả quy trình debug cụ thể của bạn.",
    whatTheyTest: "Kỹ năng thực chiến với công cụ Playwright và phương pháp tái hiện lỗi.",
    answer: [
      "Đầu tiên tôi bật trace: 'on-first-retry' (hoặc 'retain-on-failure') cùng video và screenshot; Trace Viewer cho thấy DOM snapshot, network và console tại từng bước — thường đủ để thấy element chưa sẵn sàng hay request chưa về.",
      "Tái hiện cục bộ với điều kiện giống CI: --repeat-each=50, --workers bằng CI, CPU throttling hoặc chạy trong cùng Docker image; nếu chỉ fail khi song song thì nghi ngờ shared data hoặc thứ tự.",
      "Các nguyên nhân hay gặp và cách sửa: assertion không web-first (expect(await x.isVisible()) thay vì await expect(x).toBeVisible()), hard-wait, click trước khi hydration xong ở Next.js, phụ thuộc animation, dữ liệu dùng chung. Sửa bằng web-first assertion, chờ tín hiệu nghiệp vụ (response/route), seed data riêng.",
      "Sau khi sửa, chứng minh bằng số: chạy --repeat-each=200 xanh hoàn toàn rồi mới gỡ quarantine.",
    ],
    keyPoints: [
      "Trace Viewer là công cụ chính",
      "Tái hiện bằng --repeat-each + điều kiện giống CI",
      "Web-first assertions, không hard-wait",
      "Hydration timing đặc thù Next.js",
      "Chứng minh fix bằng chạy lặp",
    ],
    pitfalls: ["Thêm waitForTimeout(2000)", "Tăng global timeout"],
    code: {
      title: "Ví dụ: non web-first vs web-first assertion",
      language: "ts",
      code: `// ❌ Flaky: đọc trạng thái 1 lần, không retry
expect(await page.getByRole("alert").isVisible()).toBe(true);

// ✅ Web-first: tự retry tới khi đúng hoặc timeout
await expect(page.getByRole("alert")).toBeVisible();

// ✅ Chờ tín hiệu nghiệp vụ thay vì thời gian cố định
const saved = page.waitForResponse(
  (r) => r.url().includes("/api/profile") && r.ok(),
);
await page.getByRole("button", { name: "Lưu" }).click();
await saved;`,
    },
    rubric: [
      { concept: "Tracing tools", keywords: ["trace", "trace viewer", "video", "screenshot", "artifact"] },
      { concept: "Reproduction", keywords: ["repeat-each", "repeat", "tai hien", "reproduce", "docker", "workers", "throttl"] },
      { concept: "Web-first assertions", keywords: ["web-first", "auto-wait", "toBeVisible", "expect", "assertion"] },
      { concept: "Hydration / timing", keywords: ["hydration", "timing", "waitForResponse", "network", "race"] },
      { concept: "Verification", keywords: ["chung minh", "verify", "200", "lap", "xanh"] },
    ],
  },

  /* ---------------------------- System Design ---------------------------- */
  {
    id: "sd-test-platform",
    category: "System Design",
    difficulty: "Principal",
    question:
      "Thiết kế một Test Execution Platform cho 300 engineer, 15.000 test E2E, yêu cầu PR feedback < 10 phút.",
    whatTheyTest: "System design end-to-end: capacity, scheduling, data, observability, chi phí.",
    answer: [
      "Làm rõ yêu cầu: 15.000 test, thời gian trung bình ~20s/test → ~83 giờ CPU-test. Để có 10 phút cần ~500 slot song song nếu chạy hết — quá đắt cho mỗi PR. Vì vậy chiến lược chính là chạy ít hơn: Test Impact Analysis + phân tầng.",
      "Kiến trúc: (1) Selector service: dựa trên coverage mapping (file → test) và lịch sử fail để chọn tập test cho PR; (2) Scheduler: chia shard theo thời lượng lịch sử (không chia đều theo số file) để cân bằng; (3) Runner pool trên Kubernetes autoscale với browser image dựng sẵn; (4) Result ingestion: reporter đẩy kết quả vào Postgres/BigQuery; (5) Analytics: flakiness, duration, failure clustering; (6) Gate service trả trạng thái về GitHub Checks.",
      "Tầng chạy: PR → smoke (~200 test) + impacted tests; merge queue → full suite; nightly → cross-browser, visual, perf. Fallback: nếu selector không chắc chắn (thay đổi config, dependency) thì chạy full.",
      "Trade-off cần nói rõ: TIA tiết kiệm chi phí nhưng có rủi ro bỏ sót — bù bằng full run ở merge queue. Autoscale nhanh nhưng cold start; giữ warm pool giờ cao điểm. Chi phí được theo dõi theo team.",
    ],
    keyPoints: [
      "Ước lượng capacity bằng số liệu cụ thể",
      "Test Impact Analysis + phân tầng PR / merge / nightly",
      "Shard theo duration lịch sử",
      "Ingestion → analytics → gate về GitHub Checks",
      "Nêu trade-off & fallback an toàn",
    ],
    pitfalls: ["Chỉ nói ‘thêm máy’", "Không có con số ước lượng", "Không nêu rủi ro của test selection"],
    rubric: [
      { concept: "Capacity estimation", keywords: ["uoc luong", "estimate", "capacity", "gio", "slot", "phut", "cpu"] },
      { concept: "Test selection / TIA", keywords: ["impact", "tia", "selection", "coverage mapping", "affected", "chon"] },
      { concept: "Scheduling & sharding", keywords: ["shard", "scheduler", "duration", "can bang", "balance"] },
      { concept: "Infrastructure", keywords: ["kubernetes", "k8s", "autoscale", "runner", "pool", "container"] },
      { concept: "Data & observability", keywords: ["ingestion", "bigquery", "postgres", "analytics", "dashboard", "telemetry"] },
      { concept: "Trade-offs", keywords: ["trade-off", "danh doi", "rui ro", "risk", "fallback", "chi phi"] },
    ],
  },
  {
    id: "sd-ai-triage",
    category: "System Design",
    difficulty: "Staff",
    question:
      "Thiết kế hệ thống dùng LLM để tự động phân loại test failure (product bug / test bug / infra) và comment vào PR.",
    whatTheyTest: "Kết hợp LLM vào hệ thống production: chi phí, độ trễ, độ tin cậy, bảo mật dữ liệu.",
    answer: [
      "Pipeline: thu thập artifact (error, stack trace, đoạn log, network lỗi, diff của PR) → tiền xử lý & rút gọn (redact secret/PII, cắt log theo cửa sổ quanh lỗi) → clustering bằng signature (hash stack trace đã chuẩn hoá) để gom lỗi giống nhau → chỉ gọi LLM cho mỗi cluster mới.",
      "LLM nhận context có cấu trúc và trả về JSON: category, confidence, evidence, suggested owner. Dưới ngưỡng confidence thì gắn nhãn ‘needs triage’ thay vì đoán.",
      "Kiểm soát chất lượng: bộ dữ liệu gắn nhãn thủ công làm eval, theo dõi precision theo category; nút feedback 👍/👎 trên comment để thu thập nhãn mới.",
      "Chi phí & độ trễ: cache theo signature, model nhỏ cho phân loại, model lớn chỉ khi cần giải thích; xử lý bất đồng bộ để không chặn pipeline.",
    ],
    keyPoints: [
      "Redact secret/PII trước khi gửi LLM",
      "Clustering để giảm số lần gọi LLM",
      "Structured output + confidence + evidence",
      "Eval set & feedback loop",
      "Cache, chọn model theo tác vụ, chạy bất đồng bộ",
    ],
    pitfalls: ["Gửi toàn bộ log thô lên LLM", "Không có ngưỡng confidence", "Không đo precision"],
    rubric: [
      { concept: "Data hygiene / security", keywords: ["redact", "pii", "secret", "bao mat", "security", "mask"] },
      { concept: "Clustering", keywords: ["cluster", "signature", "hash", "gom", "dedup"] },
      { concept: "Structured LLM output", keywords: ["json", "structured", "confidence", "evidence", "schema"] },
      { concept: "Evaluation loop", keywords: ["eval", "precision", "feedback", "label", "nhan"] },
      { concept: "Cost & latency", keywords: ["cache", "chi phi", "cost", "latency", "do tre", "async", "bat dong bo"] },
    ],
  },

  /* ---------------------------- CI/CD & Quality Gates -------------------- */
  {
    id: "cicd-quality-gate",
    category: "CI/CD & Quality Gates",
    difficulty: "Senior",
    question: "Quality gate ‘tốt’ trông như thế nào? Bạn sẽ đặt những gate nào cho một sản phẩm SaaS?",
    whatTheyTest: "Cân bằng giữa chặn rủi ro và tốc độ delivery; gate có ngữ cảnh.",
    answer: [
      "Gate tốt chặn đúng rủi ro, có tín hiệu ổn định và luôn giải thích được vì sao chặn. Gate gây noise sẽ bị bypass — khi đó tệ hơn không có gate.",
      "Tôi chia 3 mức: Block — test critical journey fail, coverage của code thay đổi giảm dưới ngưỡng, lỗ hổng bảo mật mức high, perf budget vượt quá rõ rệt. Warn — test bị quarantine fail, visual diff cần review, bundle size tăng nhẹ. Info — xu hướng flaky, thời gian pipeline.",
      "Gate dựa trên diff (coverage của dòng mới) công bằng hơn coverage tổng. Mọi gate có owner, có cơ chế override có ghi log và được review định kỳ: gate nào chặn sai nhiều thì sửa hoặc bỏ.",
    ],
    keyPoints: [
      "Gate gây noise sẽ bị bypass",
      "Phân mức block / warn / info",
      "Diff coverage thay vì tổng coverage",
      "Override có audit + review định kỳ",
    ],
    pitfalls: ["Coverage tổng 80% bắt buộc cho mọi PR", "Gate không có owner"],
    code: phases[2].samples[0],
    rubric: [
      { concept: "Signal vs noise", keywords: ["noise", "bypass", "on dinh", "signal", "tin cay"] },
      { concept: "Gate levels", keywords: ["block", "warn", "info", "muc"] },
      { concept: "Diff-based metrics", keywords: ["diff coverage", "diff", "coverage", "dong moi"] },
      { concept: "Governance", keywords: ["override", "owner", "audit", "review"] },
      { concept: "Non-functional gates", keywords: ["performance", "perf", "security", "bao mat", "budget", "a11y"] },
    ],
  },
  {
    id: "cicd-speed",
    category: "CI/CD & Quality Gates",
    difficulty: "Senior",
    question: "Pipeline E2E đang mất 45 phút. Bạn giảm xuống dưới 10 phút bằng cách nào?",
    whatTheyTest: "Đo trước khi tối ưu, biết các đòn bẩy và trade-off của từng cái.",
    answer: [
      "Tôi đo trước: thời gian setup (install, build, khởi động app), thời gian test, thời gian chờ runner, và phân bố duration từng test. Thường 30–40% là setup.",
      "Đòn bẩy theo thứ tự ROI: cache dependencies & browser binaries; build app một lần rồi chia sẻ artifact; seed data qua API thay vì UI; login một lần bằng storageState; shard theo duration; chạy chỉ test bị ảnh hưởng ở PR; cắt hoặc hạ cấp test E2E trùng lặp xuống component/API test.",
      "Trade-off: nhiều shard hơn thì tốn tiền runner và thời gian setup lặp lại — có điểm tối ưu. Test selection giảm thời gian nhưng có rủi ro bỏ sót, nên full run vẫn chạy ở merge queue.",
    ],
    keyPoints: [
      "Đo breakdown trước khi tối ưu",
      "Cache, build-once, API seeding, storageState",
      "Shard theo duration và tìm điểm tối ưu chi phí",
      "Đẩy test xuống tầng thấp hơn khi có thể",
    ],
    pitfalls: ["Chỉ tăng số shard", "Bỏ test mà không đánh giá risk"],
    rubric: [
      { concept: "Measure first", keywords: ["do luong", "do truoc", "measure", "breakdown", "profile", "phan bo"] },
      { concept: "Caching & build-once", keywords: ["cache", "artifact", "build"] },
      { concept: "Auth & data shortcuts", keywords: ["storagestate", "api", "seed", "login"] },
      { concept: "Parallelism", keywords: ["shard", "parallel", "song song", "worker"] },
      { concept: "Trade-offs", keywords: ["trade-off", "danh doi", "chi phi", "cost", "rui ro"] },
    ],
  },

  /* ---------------------------- Behavioral (STAR) ------------------------ */
  {
    id: "star-transition",
    category: "Behavioral (STAR)",
    difficulty: "Senior",
    question:
      "Bạn đến từ Full-stack, vì sao chuyển sang Automation/AI Testing? Kể một lần bạn chủ động cải thiện chất lượng ở dự án cũ.",
    whatTheyTest: "Động lực thật, tư duy quality ownership và khả năng kể chuyện có số liệu.",
    answer: [
      "Situation: ở dự án Next.js trước, mỗi lần release đều có hotfix vì regression ở luồng thanh toán; QA kiểm thủ công 2 ngày.",
      "Task: tôi nhận trách nhiệm giảm regression mà không làm chậm release.",
      "Action: viết 25 test E2E Playwright cho critical journey, seed data qua API, tích hợp vào GitHub Actions chạy trên preview environment, và thuyết phục team viết component test cho phần logic giá.",
      "Result: hotfix sau release giảm từ ~4 xuống 1 mỗi tháng, thời gian regression thủ công còn nửa ngày. Từ đó tôi nhận ra mình thích bài toán ‘làm hệ thống đáng tin’ — và AI mở ra cách giảm chi phí maintain test, nên tôi muốn đi sâu.",
    ],
    keyPoints: [
      "Đúng cấu trúc STAR, ngắn gọn",
      "Có số liệu trước/sau",
      "Thể hiện ownership, không chờ được giao",
      "Liên kết background Full-stack thành lợi thế",
    ],
    pitfalls: ["Nói ‘vì testing dễ hơn’", "Câu chuyện không có kết quả đo được"],
    rubric: [
      { concept: "Situation", keywords: ["situation", "boi canh", "du an", "khi do"] },
      { concept: "Task", keywords: ["task", "nhiem vu", "trach nhiem", "muc tieu"] },
      { concept: "Action", keywords: ["action", "toi da", "hanh dong", "trien khai", "xay dung", "viet"] },
      { concept: "Result with metrics", keywords: ["result", "ket qua", "giam", "tang", "%"] },
      { concept: "Motivation", keywords: ["dong luc", "vi sao", "thich", "motivation", "ai"] },
    ],
  },
  {
    id: "star-disagreement",
    category: "Behavioral (STAR)",
    difficulty: "Staff",
    question:
      "Kể về lần bạn bất đồng với Engineering Manager/PM về việc release khi chất lượng chưa đạt. Bạn xử lý ra sao?",
    whatTheyTest: "Ảnh hưởng không cần quyền lực, giao tiếp rủi ro bằng dữ liệu, biết thoả hiệp.",
    answer: [
      "Situation: trước một release lớn, suite E2E còn 3 test fail ở luồng hoàn tiền, PM muốn release đúng hạn vì cam kết với khách hàng.",
      "Task: tôi cần giúp team ra quyết định đúng thay vì chỉ nói ‘không’.",
      "Action: tôi lượng hoá rủi ro — luồng hoàn tiền chiếm 3% giao dịch nhưng lỗi gây sai số tiền; đề xuất phương án: release sau feature flag tắt hoàn tiền mới, giữ luồng cũ, kèm monitoring và rollback plan. Viết tóm tắt 1 trang cho PM và EM.",
      "Result: release đúng hạn, tính năng hoàn tiền mới bật 4 ngày sau khi fix; không có sự cố. Team đưa ‘risk memo’ vào checklist release.",
    ],
    keyPoints: [
      "Không chặn cứng — đưa phương án",
      "Lượng hoá rủi ro theo ngôn ngữ business",
      "Feature flag / rollback plan",
      "Kết quả và thay đổi quy trình lâu dài",
    ],
    pitfalls: ["Kể chuyện mình ‘thắng’ cuộc tranh luận", "Không có phương án thay thế"],
    rubric: [
      { concept: "STAR structure", keywords: ["situation", "task", "action", "result", "boi canh", "ket qua"] },
      { concept: "Quantified risk", keywords: ["rui ro", "risk", "%", "luong hoa", "anh huong", "impact"] },
      { concept: "Alternatives", keywords: ["feature flag", "rollback", "phuong an", "option", "thoa hiep"] },
      { concept: "Stakeholder communication", keywords: ["pm", "manager", "stakeholder", "giao tiep", "memo", "tom tat"] },
    ],
  },
];

/* ============================================================================
 * 5. HELPERS
 * ========================================================================== */

export function getPhase(id: string): Phase | undefined {
  return phases.find((p) => p.id === id);
}

function summarize(topics: Topic[]) {
  const done = topics.filter((t) => t.status === "done").length;
  const inProgress = topics.filter((t) => t.status === "in-progress").length;
  return {
    total: topics.length,
    done,
    inProgress,
    percent: topics.length ? Math.round((done / topics.length) * 100) : 0,
  };
}

export function phaseProgress(phase: Phase) {
  return summarize(phase.modules.flatMap((m) => m.topics));
}

export function overallProgress() {
  return summarize(phases.flatMap((p) => p.modules.flatMap((m) => m.topics)));
}

/** Stats cho Dashboard: 1 thẻ tính thật từ roadmap + 3 thẻ giả lập */
export function getStats(): Stat[] {
  const overall = overallProgress();
  return [
    {
      id: "progress",
      label: "Tiến độ lộ trình",
      value: `${overall.percent}%`,
      hint: `${overall.done} / ${overall.total} topic hoàn thành · ${overall.inProgress} đang học`,
      trend: { direction: "up", label: "+6% tuần này" },
      goodWhen: "up",
    },
    ...simulatedStats,
  ];
}
