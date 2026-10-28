/* Tự sinh từ nội dung bài học — chỉnh sửa trực tiếp tại đây cũng được. */
import type { Lesson } from "./types";

export const phase2Lessons: Lesson[] = [
  {
    "topicId": "structured-output",
    "minutes": 35,
    "level": "Trung cấp",
    "why": "LLM trả về văn bản tự do thì máy không xử lý tiếp được một cách tin cậy. Structured output biến câu trả lời của AI thành dữ liệu có kiểu mà pipeline kiểm tra, lưu trữ và sinh code được.",
    "explain": [
      "Khi nhờ AI \"viết test case cho tính năng đăng nhập\", bạn thường nhận một đoạn markdown mỗi lần một kiểu. **Structured output** là yêu cầu model trả về **JSON đúng theo một schema** định sẵn: mỗi case có `id`, `type`, `steps`, `expected`, `risk`.",
      "Có 2 tầng bảo vệ. (1) **Phía model**: dùng tính năng tool use hoặc JSON schema của API để model bị ràng buộc định dạng. (2) **Phía bạn**: luôn **validate lại bằng Zod**, vì không có gì đảm bảo 100%. Dữ liệu sai thì retry hoặc báo lỗi rõ ràng.",
      "Sau khi có JSON hợp lệ, phần sinh code Playwright nên là **template deterministic** (code thường của bạn), hoặc một bước LLM thứ hai. Nhờ đó con người review **test plan** (dễ đọc) trước khi tốn công review code."
    ],
    "analogy": "Nhờ người viết đơn xin nghỉ phép bằng giấy trắng thì mỗi người một kiểu. Đưa họ **mẫu đơn có ô điền sẵn** thì phòng nhân sự xử lý tự động được. Schema chính là mẫu đơn.",
    "concepts": [
      {
        "term": "JSON Schema",
        "meaning": "Mô tả hình dạng JSON hợp lệ: field nào bắt buộc, kiểu gì, giá trị nào cho phép."
      },
      {
        "term": "Tool use / function calling",
        "meaning": "Cơ chế API cho model \"gọi hàm\" với tham số đúng schema. Thường dùng để lấy structured output."
      },
      {
        "term": "Zod safeParse",
        "meaning": "Kiểm tra dữ liệu runtime và trả về lỗi chi tiết thay vì throw."
      },
      {
        "term": "Retry with feedback",
        "meaning": "Khi output sai schema, gửi lại lỗi cho model và yêu cầu sửa (có giới hạn số lần)."
      }
    ],
    "examples": [
      {
        "title": "Định nghĩa schema test plan bằng Zod",
        "code": {
          "title": "ai/test-plan.schema.ts",
          "language": "ts",
          "code": "import { z } from \"zod\";\n\nexport const TestCaseSchema = z.object({\n  id: z.string().regex(/^TC-\\d{3}$/),\n  type: z.enum([\"happy\", \"boundary\", \"negative\", \"security\", \"a11y\"]),\n  title: z.string().min(5),\n  steps: z.array(z.string().min(3)).min(1).max(12),\n  expected: z.string().min(3),\n  risk: z.enum([\"high\", \"medium\", \"low\"]),\n});\n\nexport const TestPlanSchema = z.object({\n  feature: z.string(),\n  cases: z.array(TestCaseSchema).min(3),\n});\nexport type TestPlan = z.infer<typeof TestPlanSchema>;"
        }
      },
      {
        "title": "Gọi Claude với tool có input_schema, rồi validate lại",
        "intro": "Dùng `@anthropic-ai/sdk`. Ép model dùng tool `submit_test_plan` để đầu ra là JSON có cấu trúc.",
        "code": {
          "title": "ai/generate-plan.ts",
          "language": "ts",
          "code": "import Anthropic from \"@anthropic-ai/sdk\";\nimport { TestPlanSchema, type TestPlan } from \"./test-plan.schema\";\n\nconst client = new Anthropic(); // đọc ANTHROPIC_API_KEY từ env\n\nconst tool = {\n  name: \"submit_test_plan\",\n  description: \"Nộp test plan có cấu trúc cho tính năng được mô tả.\",\n  input_schema: {\n    type: \"object\" as const,\n    required: [\"feature\", \"cases\"],\n    properties: {\n      feature: { type: \"string\" },\n      cases: {\n        type: \"array\",\n        items: {\n          type: \"object\",\n          required: [\"id\", \"type\", \"title\", \"steps\", \"expected\", \"risk\"],\n          properties: {\n            id: { type: \"string\", description: \"Dạng TC-001\" },\n            type: { enum: [\"happy\", \"boundary\", \"negative\", \"security\", \"a11y\"] },\n            title: { type: \"string\" },\n            steps: { type: \"array\", items: { type: \"string\" } },\n            expected: { type: \"string\" },\n            risk: { enum: [\"high\", \"medium\", \"low\"] },\n          },\n        },\n      },\n    },\n  },\n};\n\nexport async function generatePlan(userStory: string, model: string): Promise<TestPlan> {\n  const msg = await client.messages.create({\n    model, // ví dụ: model Claude mới nhất mà team bạn dùng\n    max_tokens: 4000,\n    tools: [tool],\n    tool_choice: { type: \"tool\", name: tool.name }, // bắt buộc dùng tool\n    messages: [{ role: \"user\", content: `Tạo test plan (tối thiểu 1 case mỗi type) cho:\\n${userStory}` }],\n  });\n\n  const block = msg.content.find((b) => b.type === \"tool_use\");\n  if (!block || block.type !== \"tool_use\") throw new Error(\"Model không trả về tool_use\");\n\n  const parsed = TestPlanSchema.safeParse(block.input); // tầng bảo vệ thứ 2\n  if (!parsed.success) throw new Error(`Test plan sai schema: ${parsed.error.message}`);\n  return parsed.data;\n}"
        },
        "notes": [
          "`tool_choice: { type: 'tool', name }` buộc model trả lời bằng tool đó, nên output luôn là object JSON.",
          "Không bao giờ hard-code API key. Dùng biến môi trường và GitHub Secrets.",
          "Truyền tên model qua tham số hoặc config để dễ nâng cấp model sau này."
        ]
      },
      {
        "title": "Sinh code từ plan bằng template deterministic",
        "code": {
          "title": "ai/render-spec.ts",
          "language": "ts",
          "code": "import type { TestPlan } from \"./test-plan.schema\";\n\nexport function renderSpec(plan: TestPlan): string {\n  const cases = plan.cases\n    .map((c) => {\n      const steps = c.steps.map((s) => `    // ${s}`).join(\"\\n\");\n      return `  test(\"${c.id} [${c.type}] ${c.title}\", async ({ page }) => {\\n${steps}\\n    // EXPECT: ${c.expected}\\n    test.fixme(); // người viết hoàn thiện bước\\n  });`;\n    })\n    .join(\"\\n\\n\");\n  return `import { test, expect } from \"../fixtures\";\\n\\ntest.describe(\"${plan.feature}\", () => {\\n${cases}\\n});\\n`;\n}"
        },
        "notes": [
          "`test.fixme()` đánh dấu test chưa hoàn thiện. Suite không fail, nhưng report liệt kê rõ phần còn thiếu."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Parse văn bản markdown của AI bằng regex.",
        "fix": "Yêu cầu structured output qua tool hoặc JSON schema, rồi validate bằng Zod."
      },
      {
        "wrong": "Tin tuyệt đối vào output vì \"đã ép schema rồi\".",
        "fix": "Luôn validate lại. Sai schema thì retry có giới hạn hoặc fail rõ ràng."
      },
      {
        "wrong": "Bắt AI sinh thẳng code cuối cùng, con người phải review 300 dòng.",
        "fix": "Tách 2 bước: plan có cấu trúc (review nhanh) rồi mới đến code."
      }
    ],
    "exercise": {
      "task": "Viết hàm `validatePlan(raw: unknown)` trả về `{ ok: true, plan } | { ok: false, errors: string[] }`, liệt kê lỗi theo dạng `cases.2.risk: Invalid enum value`. Test với 1 JSON đúng và 1 JSON thiếu field.",
      "hint": "Dùng `parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)`.",
      "solution": {
        "title": "ai/validate-plan.ts",
        "language": "ts",
        "code": "import { TestPlanSchema, type TestPlan } from \"./test-plan.schema\";\n\nexport function validatePlan(raw: unknown): { ok: true; plan: TestPlan } | { ok: false; errors: string[] } {\n  const parsed = TestPlanSchema.safeParse(raw);\n  if (parsed.success) return { ok: true, plan: parsed.data };\n  return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join(\".\")}: ${i.message}`) };\n}"
      }
    },
    "checklist": [
      "Giải thích được vì sao cần structured output khi dùng AI trong pipeline",
      "Định nghĩa được schema bằng Zod và JSON Schema",
      "Ép model trả về theo tool và validate lại phía mình",
      "Tách được bước plan và bước sinh code"
    ],
    "interviewTip": "\"Tôi không bao giờ parse văn bản tự do của LLM. Model bị ép trả về qua tool có input schema, rồi tôi validate lại bằng Zod. Sai thì retry có giới hạn. Pipeline tách hai bước: test plan có cấu trúc để người review nhanh, sau đó mới sinh code bằng template.\"",
    "resources": [
      {
        "title": "Anthropic — Tool use overview",
        "url": "https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview",
        "kind": "docs"
      },
      {
        "title": "Zod — Documentation",
        "url": "https://zod.dev/",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "context-engineering",
    "minutes": 35,
    "level": "Trung cấp",
    "why": "Chất lượng test do AI sinh ra phụ thuộc chủ yếu vào **ngữ cảnh** bạn đưa vào. Thiếu ngữ cảnh thì AI bịa locator và tạo lại thứ team đã có. Thừa ngữ cảnh thì tốn tiền và model bị nhiễu.",
    "explain": [
      "**Context engineering** là chọn đúng thông tin đưa vào prompt: user story hoặc spec, **danh sách fixtures và page objects có sẵn** (để AI dùng lại thay vì tự viết), **2–3 test mẫu chuẩn** của team (few-shot), và **quy tắc bắt buộc** (dùng `getByRole`, không `waitForTimeout`).",
      "Đừng dán cả repo. Hãy trích **chữ ký** (signature) thay vì toàn bộ code: tên class, method, tham số. Một page object 200 dòng có thể tóm thành 10 dòng mô tả API của nó.",
      "Đặt ngữ cảnh ổn định (quy tắc, ví dụ mẫu) ở đầu và phần thay đổi (user story) ở cuối. Cách sắp xếp này tận dụng được **prompt caching** để giảm chi phí khi gọi nhiều lần."
    ],
    "analogy": "Giao việc cho thực tập sinh: đưa đúng **tài liệu hướng dẫn, 2 bài mẫu làm tốt và danh sách công cụ có sẵn** thì họ làm tốt. Đưa cả kho tài liệu công ty thì họ lạc. Không đưa gì thì họ tự chế.",
    "concepts": [
      {
        "term": "Few-shot",
        "meaning": "Đưa vài ví dụ đầu vào/đầu ra mẫu để model bắt chước phong cách."
      },
      {
        "term": "Context window",
        "meaning": "Giới hạn số token model đọc được trong một lần gọi."
      },
      {
        "term": "API surface",
        "meaning": "Bản tóm tắt chữ ký public của code (class, method, tham số), không kèm phần thân."
      },
      {
        "term": "Prompt caching",
        "meaning": "Tái sử dụng phần đầu prompt không đổi giữa các lần gọi để giảm chi phí và độ trễ."
      }
    ],
    "examples": [
      {
        "title": "Trích API surface của page objects bằng TypeScript compiler",
        "code": {
          "title": "ai/extract-surface.ts",
          "language": "ts",
          "code": "import ts from \"typescript\";\nimport { readFileSync } from \"node:fs\";\n\n/** Trả về \"class CartPage { addItem(name: string): Promise<void>; ... }\" — không kèm thân hàm */\nexport function apiSurface(file: string): string {\n  const src = ts.createSourceFile(file, readFileSync(file, \"utf8\"), ts.ScriptTarget.Latest, true);\n  const out: string[] = [];\n  src.forEachChild((node) => {\n    if (ts.isClassDeclaration(node) && node.name) {\n      const members = node.members\n        .filter((m): m is ts.MethodDeclaration => ts.isMethodDeclaration(m))\n        .map((m) => `  ${m.name.getText(src)}(${m.parameters.map((p) => p.getText(src)).join(\", \")})`);\n      out.push(`class ${node.name.text} {\\n${members.join(\";\\n\")};\\n}`);\n    }\n  });\n  return out.join(\"\\n\\n\");\n}"
        }
      },
      {
        "title": "Lắp prompt: phần ổn định trước, phần thay đổi sau",
        "code": {
          "title": "ai/build-prompt.ts",
          "language": "ts",
          "code": "export function buildPrompt(opts: { rules: string; surfaces: string; examples: string; story: string }) {\n  return [\n    // ===== ỔN ĐỊNH (cache được) =====\n    `<rules>\\n${opts.rules}\\n</rules>`,\n    `<available_page_objects>\\n${opts.surfaces}\\n</available_page_objects>`,\n    `<example_tests>\\n${opts.examples}\\n</example_tests>`,\n    // ===== THAY ĐỔI mỗi lần =====\n    `<user_story>\\n${opts.story}\\n</user_story>`,\n    \"Viết Playwright spec dùng LẠI page objects ở trên. Không tự tạo locator nếu page object đã có method tương ứng.\",\n  ].join(\"\\n\\n\");\n}\n\nconst rules = `- Import { test, expect } từ \"../fixtures\"\n- Locator: getByRole/getByLabel; KHÔNG dùng XPath, KHÔNG waitForTimeout\n- Mỗi test độc lập, tự seed dữ liệu qua fixture api`;"
        },
        "notes": [
          "Thẻ XML (`<rules>`, `<user_story>`) giúp model phân biệt rõ từng phần ngữ cảnh.",
          "Đo hiệu quả: so tỉ lệ test sinh ra **dùng lại page object** trước và sau khi thêm API surface."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Dán toàn bộ thư mục `e2e/` vào prompt.",
        "fix": "Chỉ đưa API surface cùng 2–3 ví dụ tiêu biểu."
      },
      {
        "wrong": "Ví dụ few-shot là test cũ có anti-pattern.",
        "fix": "Chọn ví dụ \"chuẩn vàng\" đã review kỹ. AI sẽ bắt chước cả cái sai."
      },
      {
        "wrong": "Mỗi lần gọi thay đổi thứ tự hoặc nội dung phần đầu prompt.",
        "fix": "Giữ phần ổn định cố định ở đầu để tận dụng caching."
      }
    ],
    "exercise": {
      "task": "Chọn 2 page object trong dự án của bạn, viết API surface thủ công (chỉ chữ ký method), và viết bộ `rules` 5 dòng cho team. Ghép thành prompt bằng `buildPrompt`.",
      "hint": "Quy tắc tốt là quy tắc kiểm chứng được tự động (lint được), ví dụ \"không dùng waitForTimeout\".",
      "solutionNote": "Prompt tốt thường dưới 2.000 token cho phần ổn định. Nếu dài hơn, hãy rút gọn surface hoặc giảm số ví dụ."
    },
    "checklist": [
      "Liệt kê được 4 loại ngữ cảnh nên đưa vào prompt sinh test",
      "Giải thích được vì sao dùng API surface thay vì toàn bộ code",
      "Sắp xếp prompt để tận dụng prompt caching"
    ],
    "interviewTip": "\"Chất lượng test do AI sinh phụ thuộc vào ngữ cảnh. Tôi đưa vào quy tắc của team, API surface của fixtures và page objects để AI dùng lại thay vì bịa locator, và vài test mẫu chuẩn. Phần ổn định đặt đầu prompt để cache, và tôi đo tỉ lệ tái sử dụng page object để đánh giá.\"",
    "resources": [
      {
        "title": "Anthropic — Prompt engineering overview",
        "url": "https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview",
        "kind": "docs"
      },
      {
        "title": "Anthropic — Prompt caching",
        "url": "https://docs.claude.com/en/docs/build-with-claude/prompt-caching",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "validation-loop",
    "minutes": 40,
    "level": "Nâng cao",
    "why": "AI viết code sai là chuyện bình thường. Hệ thống tốt không phải là hệ thống AI không bao giờ sai, mà là hệ thống **tự phát hiện và sửa** trước khi con người phải nhìn.",
    "explain": [
      "**Validation loop**: sinh code, kiểm tra qua nhiều cổng, nếu fail thì đưa **lỗi cụ thể** lại cho model sửa, lặp tối đa N lần. Các cổng xếp từ rẻ đến đắt: `tsc` (kiểu), ESLint (quy tắc team), `playwright test --list` (cú pháp test hợp lệ), chạy thật trên preview.",
      "Mỗi vòng sửa phải đưa **đúng thông báo lỗi** (file, dòng, nội dung). Không phải chỉ nói \"code bị lỗi, sửa đi\". Lỗi càng cụ thể, model sửa càng trúng.",
      "Luôn có **giới hạn**: số vòng tối đa (ví dụ 3) và ngân sách token. Hết giới hạn mà vẫn fail thì dừng, lưu lại lỗi để con người xem, **không** merge code chưa qua kiểm tra."
    ],
    "analogy": "Giống **bài tập có máy chấm tự động**: nộp bài, máy báo \"sai dòng 12: thiếu dấu ;\", sửa, nộp lại. Không ai muốn thầy giáo (reviewer) phải đọc bài chưa qua máy chấm.",
    "concepts": [
      {
        "term": "Gate",
        "meaning": "Một bước kiểm tra tự động: typecheck, lint, chạy test."
      },
      {
        "term": "Self-repair",
        "meaning": "Đưa lỗi lại cho model để nó tự sửa."
      },
      {
        "term": "Max attempts",
        "meaning": "Giới hạn số vòng để không tốn chi phí vô hạn."
      },
      {
        "term": "Fail fast",
        "meaning": "Chạy cổng rẻ trước, cổng đắt sau."
      }
    ],
    "examples": [
      {
        "title": "Vòng lặp kiểm tra và tự sửa",
        "code": {
          "title": "ai/validation-loop.ts",
          "language": "ts",
          "code": "import { execFile } from \"node:child_process\";\nimport { promisify } from \"node:util\";\nimport { writeFile } from \"node:fs/promises\";\n\nconst run = promisify(execFile);\n\ntype Gate = { name: string; cmd: string; args: (file: string) => string[] };\nconst GATES: Gate[] = [\n  { name: \"typecheck\", cmd: \"npx\", args: () => [\"tsc\", \"--noEmit\", \"-p\", \"tsconfig.json\"] },\n  { name: \"lint\",      cmd: \"npx\", args: (f) => [\"eslint\", f] },\n  { name: \"list\",      cmd: \"npx\", args: (f) => [\"playwright\", \"test\", f, \"--list\"] },\n];\n\nexport async function generateUntilValid(\n  file: string,\n  generate: (feedback?: string) => Promise<string>, // gọi LLM; feedback = lỗi lần trước\n  maxAttempts = 3,\n) {\n  let feedback: string | undefined;\n  for (let attempt = 1; attempt <= maxAttempts; attempt++) {\n    await writeFile(file, await generate(feedback));\n    const failed = await firstFailingGate(file);\n    if (!failed) return { ok: true as const, attempts: attempt };\n    feedback = `Gate \"${failed.gate}\" thất bại. Sửa ĐÚNG các lỗi sau, giữ nguyên phần khác:\\n${failed.output.slice(0, 4000)}`;\n  }\n  return { ok: false as const, attempts: maxAttempts, lastError: feedback };\n}\n\nasync function firstFailingGate(file: string) {\n  for (const g of GATES) {\n    try {\n      await run(g.cmd, g.args(file));\n    } catch (err) {\n      const e = err as { stdout?: string; stderr?: string };\n      return { gate: g.name, output: `${e.stdout ?? \"\"}\\n${e.stderr ?? \"\"}` };\n    }\n  }\n  return null;\n}"
        },
        "notes": [
          "Cắt lỗi còn 4.000 ký tự để không phình prompt khi lỗi dài.",
          "Ghi lại `attempts` cho mỗi file: đây là metric quan trọng (\"bao nhiêu % pass ngay lần đầu\").",
          "Cổng chạy thật trên preview environment nên chạy trong CI riêng, sau khi các cổng rẻ đã xanh."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Feedback mơ hồ: \"code lỗi, viết lại\".",
        "fix": "Đưa nguyên văn lỗi của tsc hoặc ESLint kèm vị trí, và yêu cầu chỉ sửa phần lỗi."
      },
      {
        "wrong": "Không giới hạn số vòng nên chi phí tăng vọt khi model loay hoay.",
        "fix": "Đặt max attempts và ngân sách token. Hết thì dừng và báo người."
      },
      {
        "wrong": "Chạy E2E thật ngay từ vòng đầu.",
        "fix": "Cổng rẻ trước (tsc, lint), cổng đắt sau."
      }
    ],
    "exercise": {
      "task": "Thêm một gate `no-hard-wait`: fail nếu file chứa `waitForTimeout`. Viết nó dạng hàm TypeScript (không cần gọi lệnh ngoài) và chèn vào trước gate `typecheck`.",
      "hint": "Gate có thể là hàm `(code: string) => string | null`, trả về thông báo lỗi hoặc `null`.",
      "solution": {
        "title": "ai/gates/no-hard-wait.ts",
        "language": "ts",
        "code": "export function noHardWait(code: string): string | null {\n  const lines = code.split(\"\\n\");\n  const hits = lines\n    .map((line, i) => (line.includes(\"waitForTimeout\") ? `dòng ${i + 1}: ${line.trim()}` : null))\n    .filter(Boolean);\n  return hits.length\n    ? `Không dùng waitForTimeout. Thay bằng web-first assertion hoặc waitForResponse:\\n${hits.join(\"\\n\")}`\n    : null;\n}"
      }
    },
    "checklist": [
      "Thiết kế được chuỗi gate từ rẻ đến đắt",
      "Viết được feedback lỗi cụ thể cho self-repair",
      "Đặt được giới hạn số vòng và ngân sách"
    ],
    "interviewTip": "\"Code AI sinh ra đi qua chuỗi gate tăng dần chi phí: typecheck, lint theo quy tắc team, playwright list, rồi chạy thật trên preview. Lỗi cụ thể được đưa lại cho model sửa, tối đa 3 vòng. Tôi theo dõi tỉ lệ pass ngay lần đầu để đánh giá prompt, và code chưa qua đủ gate thì không bao giờ được merge.\""
  },
  {
    "topicId": "gen-evals",
    "minutes": 40,
    "level": "Nâng cao",
    "why": "Không có evals thì mọi thay đổi prompt hay model chỉ là \"cảm giác tốt hơn\". Evals biến chất lượng AI thành con số so sánh được, và đây là điểm phân biệt Senior AI SDET.",
    "explain": [
      "**Eval** là bộ test cho chính hệ thống AI. Bạn có một **golden set**: tập đầu vào (user story) kèm kỳ vọng (những case quan trọng phải có). Mỗi khi đổi prompt hay model, chạy lại cả bộ và so điểm.",
      "Metric thường dùng cho test generation: **coverage** (bao nhiêu case kỳ vọng được sinh ra), **first-pass rate** (tỉ lệ code qua mọi gate ngay lần đầu), **merge rate** (tỉ lệ được người review chấp nhận), **chi phí** token mỗi test.",
      "So khớp \"case kỳ vọng\" với \"case sinh ra\" có thể dùng từ khoá (đơn giản, deterministic) hoặc **LLM-as-judge** (linh hoạt hơn nhưng phải kiểm tra lại độ tin cậy của chính judge). Bắt đầu đơn giản, nâng cấp khi cần."
    ],
    "analogy": "Giống **đề thi chuẩn hoá**: muốn biết học sinh (prompt/model) tiến bộ thì cho làm cùng một đề và so điểm, không hỏi \"em thấy mình giỏi hơn chưa\".",
    "concepts": [
      {
        "term": "Golden set",
        "meaning": "Bộ đầu vào kèm kết quả kỳ vọng, được con người kiểm duyệt."
      },
      {
        "term": "Regression eval",
        "meaning": "Chạy eval mỗi khi đổi prompt hoặc model để phát hiện chất lượng giảm."
      },
      {
        "term": "LLM-as-judge",
        "meaning": "Dùng một model để chấm output của model khác theo rubric."
      },
      {
        "term": "First-pass rate",
        "meaning": "% output đạt yêu cầu ngay lần sinh đầu tiên."
      }
    ],
    "examples": [
      {
        "title": "Golden set và hàm chấm coverage đơn giản",
        "code": {
          "title": "ai/evals/run-evals.ts",
          "language": "ts",
          "code": "import type { TestPlan } from \"../test-plan.schema\";\n\ntype GoldenItem = {\n  id: string;\n  story: string;\n  mustCover: { name: string; keywords: string[] }[]; // các case bắt buộc phải có\n};\n\nexport const golden: GoldenItem[] = [\n  {\n    id: \"login\",\n    story: \"Người dùng đăng nhập bằng email + mật khẩu; khoá tài khoản sau 5 lần sai.\",\n    mustCover: [\n      { name: \"đăng nhập thành công\", keywords: [\"thành công\", \"success\"] },\n      { name: \"sai mật khẩu\", keywords: [\"sai mật khẩu\", \"invalid password\", \"wrong password\"] },\n      { name: \"khoá sau 5 lần\", keywords: [\"5 lần\", \"khoá\", \"lock\"] },\n      { name: \"email sai định dạng\", keywords: [\"định dạng\", \"invalid email\"] },\n    ],\n  },\n];\n\nexport function scoreCoverage(plan: TestPlan, item: GoldenItem) {\n  const text = plan.cases.map((c) => `${c.title} ${c.steps.join(\" \")} ${c.expected}`.toLowerCase()).join(\"\\n\");\n  const hits = item.mustCover.filter((m) => m.keywords.some((k) => text.includes(k.toLowerCase())));\n  return { id: item.id, coverage: hits.length / item.mustCover.length, missed: item.mustCover.filter((m) => !hits.includes(m)).map((m) => m.name) };\n}\n\nexport async function runEvals(generate: (story: string) => Promise<TestPlan>) {\n  const results = [];\n  for (const item of golden) results.push(scoreCoverage(await generate(item.story), item));\n  const avg = results.reduce((s, r) => s + r.coverage, 0) / results.length;\n  console.table(results);\n  console.log(`Coverage trung bình: ${(avg * 100).toFixed(1)}%`);\n  return avg;\n}"
        },
        "notes": [
          "Chạy eval **nhiều lần** (ví dụ 3 lần mỗi item) vì output của LLM không deterministic. Báo cáo trung bình và độ lệch.",
          "Đặt ngưỡng trong CI: coverage < 80% thì chặn thay đổi prompt."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Đánh giá prompt mới bằng cách thử 2–3 ví dụ rồi \"thấy ổn\".",
        "fix": "Chạy golden set đầy đủ, so số liệu trước và sau."
      },
      {
        "wrong": "Golden set do AI tự sinh, không có người kiểm duyệt.",
        "fix": "Golden set phải được chuyên gia QA duyệt. Đó là nguồn sự thật."
      },
      {
        "wrong": "Chỉ đo chất lượng, bỏ qua chi phí và độ trễ.",
        "fix": "Báo cáo cả token, chi phí và thời gian mỗi lần sinh."
      }
    ],
    "exercise": {
      "task": "Thêm 2 item vào golden set (ví dụ \"thêm vào giỏ hàng\" và \"đặt lại mật khẩu\"), mỗi item 4 case bắt buộc. Viết thêm metric `typeDiversity`: số loại `type` khác nhau trong plan chia cho 5.",
      "solution": {
        "title": "ai/evals/type-diversity.ts",
        "language": "ts",
        "code": "import type { TestPlan } from \"../test-plan.schema\";\n\nexport const typeDiversity = (plan: TestPlan) => new Set(plan.cases.map((c) => c.type)).size / 5;"
      }
    },
    "checklist": [
      "Giải thích được golden set và regression eval",
      "Liệt kê được ít nhất 4 metric cho AI test generation",
      "Biết khi nào dùng so khớp từ khoá và khi nào dùng LLM-as-judge"
    ],
    "interviewTip": "\"Mọi thay đổi prompt hay model đều phải qua regression eval trên golden set do QA duyệt. Tôi đo coverage các case bắt buộc, first-pass rate qua gate, merge rate sau review và chi phí mỗi test. Vì LLM không deterministic nên mỗi item chạy nhiều lần và tôi báo cáo cả độ lệch.\"",
    "resources": [
      {
        "title": "Anthropic — Define success criteria & build evaluations",
        "url": "https://docs.claude.com/en/docs/test-and-evaluate/develop-tests",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "fingerprint",
    "minutes": 30,
    "level": "Trung cấp",
    "why": "Self-healing chỉ hoạt động được khi hệ thống **nhớ** element trông như thế nào lúc test còn xanh. Fingerprint chính là bộ nhớ đó.",
    "explain": [
      "Khi locator gốc không còn tìm thấy element (dev đổi `data-testid`, đổi text nút), ta cần biết **element cũ có đặc điểm gì** để đi tìm ứng viên giống nhất.",
      "**Fingerprint** là tập thuộc tính của element, ghi lại ở lần chạy xanh gần nhất: role, accessible name, text, tag, các thuộc tính ổn định (`name`, `type`, `href`), và ngữ cảnh (heading gần nhất, form chứa nó).",
      "Nên lưu fingerprint vào file JSON trong repo hoặc DB theo khoá locator (ví dụ `checkout.submitButton`). Chỉ cập nhật khi test **pass**, để không học theo trạng thái lỗi."
    ],
    "analogy": "Giống **ảnh thẻ nhân viên**: bảo vệ không nhớ số phòng (locator), nhưng nhớ mặt, tên, phòng ban. Nhân viên chuyển phòng vẫn được nhận ra.",
    "concepts": [
      {
        "term": "Fingerprint",
        "meaning": "Tập đặc điểm nhận dạng một element."
      },
      {
        "term": "Accessible name",
        "meaning": "Tên mà công nghệ hỗ trợ đọc ra. Thường ổn định hơn class CSS."
      },
      {
        "term": "Anchor context",
        "meaning": "Ngữ cảnh xung quanh như heading hay label gần nhất, giúp phân biệt 2 nút giống nhau."
      }
    ],
    "examples": [
      {
        "title": "Thu thập fingerprint khi test xanh",
        "code": {
          "title": "healing/fingerprint.ts",
          "language": "ts",
          "code": "import type { Locator } from \"@playwright/test\";\n\nexport type Fingerprint = {\n  role: string | null;\n  name: string;\n  text: string;\n  tag: string;\n  attrs: Record<string, string>;\n  nearestHeading: string | null;\n};\n\nconst STABLE_ATTRS = [\"name\", \"type\", \"href\", \"placeholder\", \"aria-label\", \"data-testid\"];\n\nexport async function captureFingerprint(locator: Locator): Promise<Fingerprint> {\n  return locator.evaluate((el, stable) => {\n    const attrs: Record<string, string> = {};\n    for (const a of stable) {\n      const v = el.getAttribute(a);\n      if (v) attrs[a] = v;\n    }\n    // Tìm heading gần nhất phía trước element\n    let heading: string | null = null;\n    let node: Element | null = el;\n    while (node && !heading) {\n      let sib: Element | null = node.previousElementSibling;\n      while (sib && !heading) {\n        if (/^H[1-6]$/.test(sib.tagName)) heading = sib.textContent?.trim() ?? null;\n        sib = sib.previousElementSibling;\n      }\n      node = node.parentElement;\n    }\n    return {\n      role: el.getAttribute(\"role\") ?? (el.tagName === \"BUTTON\" ? \"button\" : el.tagName === \"A\" ? \"link\" : null),\n      name: el.getAttribute(\"aria-label\") ?? el.textContent?.trim() ?? \"\",\n      text: (el.textContent ?? \"\").trim().slice(0, 80),\n      tag: el.tagName.toLowerCase(),\n      attrs,\n      nearestHeading: heading,\n    };\n  }, STABLE_ATTRS);\n}"
        },
        "notes": [
          "Code trong `evaluate` chạy **trong trình duyệt**, nên chỉ dùng được DOM API và phải truyền dữ liệu qua tham số.",
          "Tính role ở đây là xấp xỉ. Hệ thống thật có thể dùng accessibility snapshot của Playwright để có role chính xác."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Lưu fingerprint là chuỗi XPath tuyệt đối.",
        "fix": "Lưu thuộc tính có nghĩa (role, name, text). XPath tuyệt đối là thứ dễ vỡ nhất."
      },
      {
        "wrong": "Cập nhật fingerprint cả khi test fail.",
        "fix": "Chỉ cập nhật sau lần pass, nếu không hệ thống sẽ học theo trạng thái lỗi."
      },
      {
        "wrong": "Lưu cả text động (giá tiền, ngày tháng).",
        "fix": "Loại hoặc chuẩn hoá phần động trước khi lưu."
      }
    ],
    "exercise": {
      "task": "Viết hàm `normalizeText(s)` bỏ số và khoảng trắng thừa (ví dụ \"Giỏ hàng (3)\" thành \"Giỏ hàng\") và áp dụng khi lưu `name` và `text` của fingerprint.",
      "solution": {
        "title": "healing/normalize.ts",
        "language": "ts",
        "code": "export const normalizeText = (s: string) =>\n  s.replace(/\\(\\s*\\d+\\s*\\)/g, \"\").replace(/\\d+([.,]\\d+)*/g, \"\").replace(/\\s+/g, \" \").trim();"
      }
    },
    "checklist": [
      "Liệt kê được các thuộc tính nên có trong fingerprint",
      "Giải thích được vì sao chỉ cập nhật fingerprint khi test pass",
      "Viết được code thu thập fingerprint bằng `locator.evaluate`"
    ],
    "interviewTip": "\"Mỗi locator quan trọng có một fingerprint lưu từ lần chạy xanh gần nhất: role, accessible name, text đã chuẩn hoá, thuộc tính ổn định và ngữ cảnh. Đó là đầu vào cho bước so khớp khi locator gốc gãy.\""
  },
  {
    "topicId": "similarity-threshold",
    "minutes": 35,
    "level": "Nâng cao",
    "why": "Healing sai còn nguy hiểm hơn không healing: test xanh nhưng thao tác nhầm element. Điểm tương đồng kèm ngưỡng tin cậy là van an toàn của toàn bộ cơ chế.",
    "explain": [
      "Khi locator gốc gãy, ta liệt kê **ứng viên** trên trang (ví dụ mọi button), tính **điểm tương đồng** với fingerprint, và chọn ứng viên điểm cao nhất, **chỉ khi** điểm vượt ngưỡng (ví dụ 0.85).",
      "Điểm là **tổng có trọng số**: cùng role (quan trọng nhất), tên giống (so chuỗi mềm), cùng thuộc tính ổn định, cùng ngữ cảnh heading. Trọng số phản ánh độ tin cậy của từng tín hiệu.",
      "Cũng cần kiểm tra **khoảng cách giữa ứng viên số 1 và số 2**: nếu hai ứng viên điểm gần bằng nhau thì hệ thống không chắc chắn, nên fail thay vì đoán."
    ],
    "analogy": "Nhận người quen giữa đám đông: thấy người **cùng dáng, cùng giọng, cùng áo công ty** thì gọi. Nhưng nếu có hai người giống nhau thì bạn không gọi bừa.",
    "concepts": [
      {
        "term": "Similarity score",
        "meaning": "Điểm 0–1 cho biết ứng viên giống fingerprint đến đâu."
      },
      {
        "term": "Confidence threshold",
        "meaning": "Ngưỡng tối thiểu để chấp nhận heal."
      },
      {
        "term": "Margin",
        "meaning": "Chênh lệch điểm giữa ứng viên số 1 và số 2. Quá nhỏ nghĩa là mơ hồ."
      },
      {
        "term": "Levenshtein / Jaccard",
        "meaning": "Các cách đo độ giống nhau giữa hai chuỗi."
      }
    ],
    "examples": [
      {
        "title": "Chấm điểm ứng viên có trọng số",
        "code": {
          "title": "healing/similarity.ts",
          "language": "ts",
          "code": "import type { Fingerprint } from \"./fingerprint\";\n\n/** Jaccard trên tập từ — đơn giản, đủ dùng cho tên nút/label */\nfunction textSim(a: string, b: string) {\n  const A = new Set(a.toLowerCase().split(/\\s+/).filter(Boolean));\n  const B = new Set(b.toLowerCase().split(/\\s+/).filter(Boolean));\n  if (!A.size && !B.size) return 1;\n  const inter = [...A].filter((x) => B.has(x)).length;\n  return inter / new Set([...A, ...B]).size;\n}\n\nconst WEIGHTS = { role: 0.35, name: 0.3, attrs: 0.2, heading: 0.15 };\n\nexport function score(fp: Fingerprint, c: Fingerprint): number {\n  const role = fp.role === c.role ? 1 : 0;\n  const name = textSim(fp.name, c.name);\n  const keys = Object.keys(fp.attrs);\n  const attrs = keys.length ? keys.filter((k) => fp.attrs[k] === c.attrs[k]).length / keys.length : 0.5;\n  const heading = fp.nearestHeading && fp.nearestHeading === c.nearestHeading ? 1 : 0;\n  return role * WEIGHTS.role + name * WEIGHTS.name + attrs * WEIGHTS.attrs + heading * WEIGHTS.heading;\n}\n\nexport function pickBest(fp: Fingerprint, candidates: { selector: string; fp: Fingerprint }[]) {\n  const ranked = candidates\n    .map((c) => ({ selector: c.selector, score: score(fp, c.fp) }))\n    .sort((a, b) => b.score - a.score);\n  const [best, second] = ranked;\n  if (!best) return null;\n  const margin = best.score - (second?.score ?? 0);\n  const confident = best.score >= 0.85 && margin >= 0.1;\n  return { ...best, margin, confident };\n}"
        },
        "notes": [
          "Ví dụ: nút \"Thanh toán\" đổi testid nhưng vẫn là button, tên giống và cùng heading \"Giỏ hàng\", nên điểm khoảng 0.9 và heal được.",
          "Nút \"Huỷ\" bên cạnh cùng role và heading nhưng khác tên, điểm khoảng 0.5, bị loại. Đây chính là cơ chế ngăn heal nhầm."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Chọn ứng viên điểm cao nhất bất kể điểm bao nhiêu.",
        "fix": "Bắt buộc có ngưỡng tuyệt đối **và** margin so với ứng viên thứ 2."
      },
      {
        "wrong": "Đặt ngưỡng theo cảm tính.",
        "fix": "Hiệu chỉnh ngưỡng bằng bộ dữ liệu có nhãn (bài Healing PR có cách đo precision)."
      },
      {
        "wrong": "Cho phép heal cả hành động phá huỷ (xoá, thanh toán).",
        "fix": "Có danh sách hành động không được heal: fail và báo người."
      }
    ],
    "exercise": {
      "task": "Viết 3 unit test cho `pickBest`: (1) heal đúng khi chỉ testid đổi; (2) không heal khi có 2 ứng viên gần như giống nhau; (3) không heal khi ứng viên tốt nhất dưới 0.85.",
      "hint": "Dựng fingerprint giả bằng object literal. Không cần trình duyệt.",
      "solutionNote": "Test (2) là quan trọng nhất: hai nút \"Lưu\" ở hai form khác heading nhưng fingerprint gốc không có heading, nên margin nhỏ hơn 0.1 và `confident = false`."
    },
    "checklist": [
      "Giải thích được tổng có trọng số và lý do chọn trọng số",
      "Giải thích được vai trò của ngưỡng và margin",
      "Biết các hành động không bao giờ được heal"
    ],
    "interviewTip": "\"Tôi chấm điểm ứng viên bằng tổng có trọng số của role, tên, thuộc tính ổn định và ngữ cảnh. Chỉ heal khi điểm vượt ngưỡng và cách xa ứng viên thứ hai. Ngưỡng được hiệu chỉnh trên dữ liệu có nhãn, và các hành động phá huỷ không bao giờ được heal.\""
  },
  {
    "topicId": "llm-fallback",
    "minutes": 35,
    "level": "Nâng cao",
    "why": "Heuristic xử lý được phần lớn trường hợp. LLM giúp với ca khó (UI thay đổi lớn) nhưng chậm, đắt và không deterministic, nên phải dùng như **tầng cuối** có kiểm soát.",
    "explain": [
      "Thứ tự: locator gốc, rồi heuristic similarity, cuối cùng mới đến **LLM fallback** khi heuristic không đủ tự tin. Phần lớn lần chạy dừng ở tầng 1, nên chi phí LLM rất nhỏ.",
      "Không gửi toàn bộ HTML (có thể vài MB). Hãy gửi **accessibility snapshot rút gọn** hoặc danh sách ứng viên đã lọc theo role, kèm fingerprint. Như vậy vừa tiết kiệm token vừa giảm nhiễu.",
      "Yêu cầu LLM trả về **structured output**: `{ index, confidence, reason }` chọn từ danh sách ứng viên đánh số, thay vì để nó tự viết selector (dễ bịa). Sau đó **xác minh**: index có tồn tại không, element đó có đúng role không."
    ],
    "analogy": "Heuristic là nhân viên quen việc xử lý 95% ca. Ca khó mới gọi **chuyên gia đắt tiền** (LLM), và chỉ đưa cho chuyên gia hồ sơ đã tóm tắt chứ không phải cả kho tài liệu.",
    "concepts": [
      {
        "term": "Aria snapshot",
        "meaning": "Bản tóm tắt cây accessibility (role + tên) của trang hoặc vùng trang. Gọn hơn HTML rất nhiều."
      },
      {
        "term": "Token budget",
        "meaning": "Giới hạn token cho mỗi lần gọi để kiểm soát chi phí."
      },
      {
        "term": "Constrained choice",
        "meaning": "Bắt LLM chọn trong danh sách đánh số thay vì sinh tự do."
      }
    ],
    "examples": [
      {
        "title": "Rút gọn ngữ cảnh: ứng viên đánh số",
        "code": {
          "title": "healing/llm-fallback.ts",
          "language": "ts",
          "code": "import type { Page } from \"@playwright/test\";\nimport type { Fingerprint } from \"./fingerprint\";\n\ntype Choice = { index: number; confidence: number; reason: string };\n\nexport async function askLlmForElement(\n  page: Page,\n  fp: Fingerprint,\n  callLlm: (prompt: string) => Promise<Choice>, // structured output (xem bài Structured output)\n) {\n  // 1) Lọc ứng viên cùng role, tối đa 30 — giữ prompt nhỏ\n  const candidates = page.getByRole((fp.role ?? \"button\") as \"button\");\n  const count = Math.min(await candidates.count(), 30);\n  const list: string[] = [];\n  for (let i = 0; i < count; i++) {\n    const el = candidates.nth(i);\n    list.push(`[${i}] name=\"${(await el.innerText()).trim().slice(0, 60)}\"`);\n  }\n\n  // 2) Bắt LLM CHỌN trong danh sách, không tự sinh selector\n  const choice = await callLlm(\n    `Element cần tìm (từ lần chạy trước): ${JSON.stringify(fp)}\\n` +\n      `Ứng viên hiện tại:\\n${list.join(\"\\n\")}\\n` +\n      `Chọn index phù hợp nhất. Nếu không có cái nào phù hợp, trả index = -1.`,\n  );\n\n  // 3) Xác minh output — không tin mù quáng\n  if (choice.index < 0 || choice.index >= count || choice.confidence < 0.85) return null;\n  return { locator: candidates.nth(choice.index), ...choice };\n}"
        },
        "notes": [
          "Cho phép LLM trả `-1` (\"không có\") là rất quan trọng. Nếu không, model sẽ luôn chọn một cái.",
          "Playwright có `locator.ariaSnapshot()` để lấy cây accessibility dạng YAML gọn, rất hợp làm ngữ cảnh."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Gọi LLM cho mọi lần locator fail.",
        "fix": "LLM là tầng cuối, chỉ khi heuristic không đủ tự tin."
      },
      {
        "wrong": "Gửi `page.content()` (toàn bộ HTML) cho LLM.",
        "fix": "Gửi danh sách ứng viên rút gọn hoặc aria snapshot của vùng liên quan."
      },
      {
        "wrong": "Để LLM tự viết selector CSS.",
        "fix": "Bắt chọn index trong danh sách, rồi xác minh kết quả."
      }
    ],
    "exercise": {
      "task": "Ước tính chi phí: suite 2.000 test, mỗi ngày 30 lần locator gãy. 90% được heuristic xử lý, phần còn lại gọi LLM với khoảng 1.500 token input và 100 token output. Tính số lần gọi LLM mỗi tháng và lập công thức chi phí theo đơn giá model.",
      "solutionNote": "30 × 10% = 3 lần/ngày, khoảng 90 lần/tháng. Chi phí ≈ 90 × (1.500 × giá_input + 100 × giá_output) / 1.000.000. Kết quả rất nhỏ so với giờ công sửa tay, và đây là con số nên nêu trong phỏng vấn."
    },
    "checklist": [
      "Giải thích được vì sao LLM là tầng cuối",
      "Rút gọn được ngữ cảnh gửi cho LLM",
      "Thiết kế được output dạng chọn trong danh sách kèm bước xác minh"
    ],
    "interviewTip": "\"LLM chỉ là tầng fallback cuối khi heuristic không đủ tự tin. Tôi gửi danh sách ứng viên rút gọn và bắt model chọn index, được phép trả về 'không có', rồi xác minh lại. Nhờ vậy chi phí thấp, kết quả kiểm soát được và không có selector bịa.\"",
    "resources": [
      {
        "title": "Playwright — Aria snapshots",
        "url": "https://playwright.dev/docs/aria-snapshots",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "healing-pr",
    "minutes": 30,
    "level": "Trung cấp",
    "why": "Healing âm thầm sửa trong runtime sẽ tích tụ \"nợ ẩn\". Biến mỗi lần heal thành một PR có người duyệt vừa giữ codebase sạch vừa thể hiện tư duy human-in-the-loop mà nhà tuyển dụng đánh giá cao.",
    "explain": [
      "Khi test được heal trong lúc chạy, hệ thống **ghi audit log** (locator cũ, locator mới, điểm, chiến lược) và đánh dấu test là **healed** (cảnh báo, không phải xanh hoàn toàn).",
      "Cuối pipeline, một job gom các lần heal và **mở PR** sửa locator trong code nguồn, kèm bảng giải thích. Con người duyệt: đúng thì merge, sai (heal nhầm vì UI có bug) thì đóng PR và mở bug.",
      "Đo **healing precision**: trong các PR healing, bao nhiêu % được merge? Tỉ lệ này cho biết cơ chế có đáng tin không và ngưỡng có cần chỉnh không."
    ],
    "analogy": "Giống **bút chì sửa bài của trợ giảng**: trợ giảng sửa nháp rồi đưa thầy duyệt, không tự ý ghi đè điểm vào sổ.",
    "concepts": [
      {
        "term": "Audit log",
        "meaning": "Bản ghi mọi lần heal: ai, khi nào, đổi gì, vì sao."
      },
      {
        "term": "Human-in-the-loop",
        "meaning": "Con người duyệt quyết định của AI trước khi có hiệu lực lâu dài."
      },
      {
        "term": "Healing precision",
        "meaning": "% lần heal được con người xác nhận là đúng."
      }
    ],
    "examples": [
      {
        "title": "Ghi audit log và tạo nội dung PR",
        "code": {
          "title": "healing/report.ts",
          "language": "ts",
          "code": "import { appendFile, readFile } from \"node:fs/promises\";\n\nexport type HealEvent = {\n  key: string;            // ví dụ \"checkout.submitButton\"\n  file: string;           // nơi khai báo locator gốc\n  oldSelector: string;\n  newSelector: string;\n  strategy: \"similarity\" | \"llm\";\n  score: number;\n  testTitle: string;\n};\n\nconst LOG = \"test-results/healing.jsonl\";\n\nexport async function recordHealing(e: HealEvent) {\n  await appendFile(LOG, JSON.stringify(e) + \"\\n\");\n}\n\nexport async function buildPrBody(): Promise<string> {\n  const events = (await readFile(LOG, \"utf8\")).trim().split(\"\\n\").map((l) => JSON.parse(l) as HealEvent);\n  const rows = events.map(\n    (e) => `| \\`${e.key}\\` | \\`${e.oldSelector}\\` → \\`${e.newSelector}\\` | ${e.strategy} | ${e.score.toFixed(2)} |`,\n  );\n  return [\n    \"## 🤖 Self-healing đề xuất sửa locator\",\n    \"Vui lòng kiểm tra từng dòng. Nếu UI thay đổi do **bug**, đóng PR và mở issue.\",\n    \"\",\n    \"| Locator | Thay đổi | Chiến lược | Điểm |\",\n    \"|---|---|---|---|\",\n    ...rows,\n  ].join(\"\\n\");\n}"
        }
      },
      {
        "title": "Job mở PR trong GitHub Actions",
        "code": {
          "title": ".github/workflows/healing-pr.yml (trích)",
          "language": "yaml",
          "code": "- name: Áp dụng thay đổi locator & mở PR\n  if: hashFiles('test-results/healing.jsonl') != ''\n  run: |\n    node scripts/apply-healing.mjs          # sửa file nguồn theo healing.jsonl\n    node scripts/build-pr-body.mjs > pr.md\n    git switch -c healing/${{ github.run_id }}\n    git commit -am \"test: self-healing locator updates\"\n    git push origin HEAD\n    gh pr create --title \"Self-healing: cập nhật locator\" --body-file pr.md --label healing\n  env:\n    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}"
        },
        "notes": [
          "Job cần quyền `contents: write` và `pull-requests: write` trong `permissions` của workflow."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Heal trong runtime và báo test xanh, không ai biết.",
        "fix": "Đánh dấu healed, ghi audit log và mở PR để người duyệt."
      },
      {
        "wrong": "Tự động merge PR healing.",
        "fix": "Luôn cần người duyệt. Heal có thể đang che giấu bug UI thật."
      },
      {
        "wrong": "Không đo kết quả của cơ chế healing.",
        "fix": "Theo dõi precision (tỉ lệ PR được merge) và điều chỉnh ngưỡng."
      }
    ],
    "exercise": {
      "task": "Viết hàm `healingPrecision(prs: { merged: boolean }[])` và quy tắc: precision < 90% trong 30 ngày thì tự tắt tầng LLM. Mô tả cách lấy dữ liệu PR từ GitHub (label `healing`).",
      "hint": "`gh pr list --label healing --state all --json state,mergedAt --limit 200`.",
      "solution": {
        "title": "healing/precision.ts",
        "language": "ts",
        "code": "export const healingPrecision = (prs: { merged: boolean }[]) =>\n  prs.length ? prs.filter((p) => p.merged).length / prs.length : null;\n\nexport const shouldDisableLlm = (precision: number | null) => precision !== null && precision < 0.9;"
      }
    },
    "checklist": [
      "Giải thích được vì sao không auto-commit kết quả healing",
      "Thiết kế được audit log cho healing",
      "Đo được healing precision và dùng nó để điều chỉnh"
    ],
    "interviewTip": "\"Mỗi lần heal được ghi audit log và test bị đánh dấu healed chứ không xanh hoàn toàn. Cuối pipeline hệ thống mở PR sửa locator để người duyệt. Precision tính bằng tỉ lệ PR được merge; dưới 90% thì tôi tắt tầng LLM và chỉnh lại ngưỡng.\""
  },
  {
    "topicId": "diff-types",
    "minutes": 25,
    "level": "Cơ bản",
    "why": "Visual regression bắt được lỗi giao diện mà test chức năng bỏ sót (nút bị che, chữ tràn, sai màu). Chọn sai cách so sánh thì sẽ bị ngập trong false positive.",
    "explain": [
      "**Pixel diff**: so từng pixel giữa ảnh baseline và ảnh mới. Nhanh và đơn giản (Playwright `toHaveScreenshot` dùng cách này), nhưng nhạy với khác biệt nhỏ như khử răng cưa font hay lệch 1px.",
      "**Perceptual diff**: so theo cách mắt người cảm nhận (độ sáng, màu sắc trong không gian màu cảm quan), nên bỏ qua khác biệt mà mắt không thấy. Ít false positive hơn pixel diff.",
      "**AI semantic diff**: dùng model thị giác để hiểu **ý nghĩa** thay đổi: \"nút Thanh toán biến mất\" khác hẳn \"đổ bóng đậm hơn 2%\". Linh hoạt nhất nhưng chậm, tốn chi phí và cần kiểm chứng."
    ],
    "analogy": "So hai bức ảnh: **pixel diff** là đếm từng hạt màu; **perceptual** là nhìn bằng mắt thường; **AI semantic** là nhờ người hiểu chuyện nói \"ảnh này thiếu một người\".",
    "concepts": [
      {
        "term": "Baseline",
        "meaning": "Ảnh chuẩn đã được duyệt để so sánh."
      },
      {
        "term": "maxDiffPixelRatio",
        "meaning": "Tỉ lệ pixel khác tối đa được chấp nhận trong Playwright."
      },
      {
        "term": "threshold",
        "meaning": "Độ chênh màu tối thiểu (0–1) để coi một pixel là khác."
      },
      {
        "term": "False positive",
        "meaning": "Test báo khác nhưng thực ra không có lỗi."
      }
    ],
    "examples": [
      {
        "title": "Pixel diff có dung sai trong Playwright",
        "code": {
          "title": "e2e/visual/home.spec.ts",
          "language": "ts",
          "code": "import { test, expect } from \"@playwright/test\";\n\ntest(\"trang chủ không đổi giao diện\", async ({ page }) => {\n  await page.goto(\"/\");\n  await expect(page).toHaveScreenshot(\"home.png\", {\n    fullPage: true,\n    maxDiffPixelRatio: 0.01, // cho phép tối đa 1% pixel khác\n    threshold: 0.2,          // mỗi pixel phải lệch màu > 20% mới tính là khác\n  });\n});"
        },
        "notes": [
          "Lần chạy đầu tạo baseline. Cập nhật có chủ đích bằng `npx playwright test --update-snapshots`.",
          "Baseline phụ thuộc OS và browser: tạo và chạy trên **cùng một Docker image** ở CI."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Chụp toàn trang với dung sai 0 rồi than test flaky.",
        "fix": "Đặt dung sai hợp lý và ổn định môi trường trước (bài tiếp theo)."
      },
      {
        "wrong": "Tạo baseline trên Mac, chạy so trên Linux CI.",
        "fix": "Tạo và so baseline trong cùng container."
      },
      {
        "wrong": "Dùng AI semantic diff cho mọi ảnh.",
        "fix": "Pixel diff lọc trước, AI chỉ xử lý những diff vượt ngưỡng."
      }
    ],
    "exercise": {
      "task": "Viết test chụp riêng component \"thẻ sản phẩm\" (không phải toàn trang) với dung sai 0.5%. Giải thích vì sao chụp theo component ít flaky hơn.",
      "solution": {
        "title": "e2e/visual/product-card.spec.ts",
        "language": "ts",
        "code": "test(\"thẻ sản phẩm\", async ({ page }) => {\n  await page.goto(\"/products\");\n  const card = page.getByRole(\"listitem\").first();\n  await expect(card).toHaveScreenshot(\"product-card.png\", { maxDiffPixelRatio: 0.005 });\n});\n// Vùng chụp nhỏ → ít nội dung động hơn, diff rõ ràng hơn, baseline ít phải cập nhật."
      }
    },
    "checklist": [
      "Phân biệt được pixel, perceptual và AI semantic diff",
      "Cấu hình được dung sai trong `toHaveScreenshot`",
      "Biết vì sao baseline phải tạo trên cùng môi trường"
    ],
    "interviewTip": "\"Tôi dùng pixel diff có dung sai làm bộ lọc rẻ, chụp theo component thay vì toàn trang khi có thể. Chỉ những diff vượt ngưỡng mới đưa qua phân tích bằng AI để phân loại ý nghĩa, nên chi phí và độ trễ được kiểm soát.\"",
    "resources": [
      {
        "title": "Playwright — Visual comparisons",
        "url": "https://playwright.dev/docs/test-snapshots",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "snapshot-stability",
    "minutes": 30,
    "level": "Trung cấp",
    "why": "90% visual test flaky do môi trường không ổn định chứ không do công cụ. Ổn định snapshot là việc phải làm trước khi nghĩ đến AI.",
    "explain": [
      "Nguồn nhiễu phổ biến: **nội dung động** (giờ, avatar, quảng cáo, số ngẫu nhiên), **animation và transition**, **font** chưa tải xong hoặc khác OS, **con trỏ nhấp nháy**, và **dữ liệu** khác nhau giữa các lần chạy.",
      "Cách xử lý: `mask` các vùng động (Playwright phủ hộp màu lên), `animations: 'disabled'` khi chụp, chờ `document.fonts.ready`, `caret: 'hide'`, cố định thời gian bằng `page.clock`, và seed dữ liệu cố định.",
      "Có thể chèn CSS chỉ khi chụp ảnh (`stylePath`) để ẩn những phần không cần so sánh mà không đụng đến code app."
    ],
    "analogy": "Chụp ảnh thẻ: phải **đứng yên, cùng phông nền, cùng ánh sáng**. Mỗi lần chụp một bối cảnh thì so sánh vô nghĩa.",
    "concepts": [
      {
        "term": "mask",
        "meaning": "Danh sách locator bị phủ màu khi chụp."
      },
      {
        "term": "animations: 'disabled'",
        "meaning": "Dừng CSS animation và transition khi chụp."
      },
      {
        "term": "page.clock",
        "meaning": "API Playwright để cố định hoặc điều khiển thời gian trong trình duyệt."
      },
      {
        "term": "stylePath",
        "meaning": "File CSS áp dụng riêng lúc chụp screenshot."
      }
    ],
    "examples": [
      {
        "title": "Screenshot ổn định",
        "code": {
          "title": "e2e/visual/dashboard.spec.ts",
          "language": "ts",
          "code": "import { test, expect } from \"@playwright/test\";\n\ntest(\"dashboard ổn định\", async ({ page }) => {\n  await page.clock.setFixedTime(new Date(\"2026-01-15T09:00:00+07:00\")); // cố định \"bây giờ\"\n  await page.goto(\"/dashboard\");\n  await page.evaluate(() => document.fonts.ready);                     // chờ font\n\n  await expect(page).toHaveScreenshot(\"dashboard.png\", {\n    animations: \"disabled\",\n    caret: \"hide\",\n    mask: [page.getByTestId(\"user-avatar\"), page.getByTestId(\"live-ticker\")],\n    stylePath: \"e2e/visual/screenshot.css\", // ví dụ: .ads { visibility: hidden }\n    maxDiffPixelRatio: 0.01,\n  });\n});"
        }
      },
      {
        "title": "Cố định môi trường trong config",
        "code": {
          "title": "playwright.config.ts (trích)",
          "language": "ts",
          "code": "export default defineConfig({\n  use: {\n    locale: \"vi-VN\",\n    timezoneId: \"Asia/Ho_Chi_Minh\",\n    viewport: { width: 1280, height: 800 },\n    deviceScaleFactor: 1,\n    colorScheme: \"dark\",\n  },\n});"
        }
      }
    ],
    "mistakes": [
      {
        "wrong": "Tăng `maxDiffPixelRatio` lên 10% cho xanh.",
        "fix": "Tìm và loại nguồn nhiễu. Dung sai lớn thì bỏ sót lỗi thật."
      },
      {
        "wrong": "Ẩn nội dung động bằng cách sửa code app.",
        "fix": "Dùng `mask` hoặc `stylePath` chỉ áp dụng khi chụp."
      },
      {
        "wrong": "Quên cố định timezone và locale.",
        "fix": "Đặt `timezoneId` và `locale` trong config."
      }
    ],
    "exercise": {
      "task": "Một trang có đồng hồ đếm ngược khuyến mãi và banner quảng cáo ngẫu nhiên. Viết test screenshot ổn định cho trang đó.",
      "hint": "Đồng hồ: `page.clock.setFixedTime`. Banner: `mask`, hoặc chặn request quảng cáo bằng `page.route` kèm `route.abort()`.",
      "solutionNote": "Kết hợp: cố định thời gian, abort request đến domain quảng cáo, mask vùng banner, tắt animation. Chạy `--repeat-each=10` để chứng minh ổn định."
    },
    "checklist": [
      "Liệt kê được 5 nguồn nhiễu phổ biến của visual test",
      "Dùng được mask, animations, caret, clock và stylePath",
      "Chứng minh độ ổn định bằng `--repeat-each`"
    ],
    "interviewTip": "\"Trước khi dùng AI cho visual diff, tôi loại nhiễu tận gốc: cố định thời gian, timezone, font, viewport, tắt animation, mask nội dung động và chạy trong cùng Docker image. AI chỉ là tầng bổ sung, không phải băng dán cho môi trường không ổn định.\"",
    "resources": [
      {
        "title": "Playwright — Clock",
        "url": "https://playwright.dev/docs/clock",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "vision-classify",
    "minutes": 35,
    "level": "Nâng cao",
    "why": "Khi có hàng chục visual diff mỗi ngày, con người không thể xem hết. Model thị giác phân loại và tóm tắt giúp reviewer tập trung vào thay đổi thật sự quan trọng.",
    "explain": [
      "Pipeline: pixel diff phát hiện ảnh khác vượt ngưỡng, sau đó gửi **3 ảnh** (baseline, ảnh mới, ảnh diff) cho model thị giác. Model trả về **nhãn có cấu trúc**: `layout_shift`, `content_change`, `missing_element`, `style_change`, `rendering_noise`, kèm mô tả ngắn và mức độ nghiêm trọng.",
      "AI chỉ **đề xuất**. Kết quả hiện trong PR comment để reviewer quyết định cập nhật baseline hay báo bug. Nhãn `rendering_noise` với độ tin cậy cao có thể được ẩn khỏi danh sách cần xem gấp.",
      "Đo **agreement rate** giữa nhãn AI và quyết định cuối của reviewer. Đây là cách biết có nên tin AI hơn hay cần sửa prompt."
    ],
    "analogy": "Trợ lý **sắp xếp thư**: chia thư thành \"khẩn\", \"quảng cáo\", \"thông báo\". Bạn vẫn đọc thư khẩn, nhưng không phải mở từng thư quảng cáo.",
    "concepts": [
      {
        "term": "Vision model",
        "meaning": "Model đọc được hình ảnh, ví dụ Claude với input image."
      },
      {
        "term": "Diff triage",
        "meaning": "Phân loại các diff theo ý nghĩa và mức độ."
      },
      {
        "term": "Agreement rate",
        "meaning": "% nhãn AI trùng với quyết định của con người."
      }
    ],
    "examples": [
      {
        "title": "Gửi baseline + actual cho Claude để phân loại",
        "code": {
          "title": "ai/visual-triage.ts",
          "language": "ts",
          "code": "import Anthropic from \"@anthropic-ai/sdk\";\nimport { readFile } from \"node:fs/promises\";\n\nconst client = new Anthropic();\n\nconst img = async (path: string) => ({\n  type: \"image\" as const,\n  source: { type: \"base64\" as const, media_type: \"image/png\" as const, data: (await readFile(path)).toString(\"base64\") },\n});\n\nexport async function triageDiff(baseline: string, actual: string, model: string) {\n  const msg = await client.messages.create({\n    model,\n    max_tokens: 500,\n    tools: [{\n      name: \"classify_visual_diff\",\n      description: \"Phân loại thay đổi giao diện giữa ảnh baseline và ảnh mới.\",\n      input_schema: {\n        type: \"object\",\n        required: [\"category\", \"severity\", \"summary\", \"confidence\"],\n        properties: {\n          category: { enum: [\"layout_shift\", \"content_change\", \"missing_element\", \"style_change\", \"rendering_noise\"] },\n          severity: { enum: [\"high\", \"medium\", \"low\"] },\n          summary: { type: \"string\", description: \"1 câu tiếng Việt mô tả thay đổi\" },\n          confidence: { type: \"number\" },\n        },\n      },\n    }],\n    tool_choice: { type: \"tool\", name: \"classify_visual_diff\" },\n    messages: [{\n      role: \"user\",\n      content: [\n        { type: \"text\", text: \"Ảnh 1 là BASELINE, ảnh 2 là ẢNH MỚI của cùng một trang.\" },\n        await img(baseline),\n        await img(actual),\n      ],\n    }],\n  });\n  const block = msg.content.find((b) => b.type === \"tool_use\");\n  return block?.type === \"tool_use\" ? block.input : null; // nhớ validate bằng Zod như bài Structured output\n}"
        },
        "notes": [
          "Ảnh lớn tốn nhiều token: hãy crop vùng có diff hoặc thu nhỏ trước khi gửi.",
          "Kết quả đưa vào PR comment, không tự cập nhật baseline."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Gửi mọi screenshot cho AI, kể cả ảnh không khác.",
        "fix": "Chỉ gửi ảnh có pixel diff vượt ngưỡng."
      },
      {
        "wrong": "Tự động cập nhật baseline khi AI nói \"chỉ là noise\".",
        "fix": "AI đề xuất, con người duyệt. Theo dõi agreement rate trước khi nới quy trình."
      },
      {
        "wrong": "Không validate output của model.",
        "fix": "Dùng tool schema và validate bằng Zod."
      }
    ],
    "exercise": {
      "task": "Thiết kế format PR comment (markdown) hiển thị danh sách diff đã phân loại: nhóm theo severity, mỗi dòng có tên ảnh, category, summary và link ảnh. Viết hàm `renderTriageComment(results)`.",
      "solutionNote": "Nhóm high lên đầu kèm biểu tượng 🔴, medium 🟡, low/noise 🟢 thu gọn trong `<details>`. Reviewer xử lý high trước."
    },
    "checklist": [
      "Mô tả được pipeline pixel diff rồi vision model rồi PR comment",
      "Thiết kế được schema phân loại diff",
      "Giải thích được agreement rate và vai trò của con người"
    ],
    "interviewTip": "\"Pixel diff lọc ra các ảnh thay đổi, sau đó model thị giác phân loại thành layout, nội dung, thiếu element, style hay noise, kèm tóm tắt và độ tin cậy. Kết quả nằm trong PR comment để reviewer ưu tiên. AI không bao giờ tự cập nhật baseline, và tôi theo dõi agreement rate để hiệu chỉnh.\"",
    "resources": [
      {
        "title": "Anthropic — Vision",
        "url": "https://docs.claude.com/en/docs/build-with-claude/vision",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "prompt-templates",
    "minutes": 25,
    "level": "Cơ bản",
    "why": "Prompt viết tự do mỗi người một kiểu thì kết quả không ổn định và không cải tiến được. Template chuẩn của team biến prompt thành tài sản dùng chung.",
    "explain": [
      "**Prompt template** là khung có chỗ trống cho dữ liệu: vai trò, nhiệm vụ, ngữ cảnh, quy tắc, định dạng đầu ra, ví dụ. Mọi người dùng cùng khung nên kết quả nhất quán.",
      "**Few-shot từ test chuẩn của team**: chọn 2–3 test tốt nhất (đã review, đúng quy tắc) làm ví dụ. Model học phong cách đặt tên, cách dùng fixtures, mức độ chi tiết của team bạn.",
      "Viết rõ ràng, dùng thẻ XML để phân tách phần, nói **điều cần làm** thay vì chỉ nói điều cấm, và giải thích **lý do** của quy tắc. Model làm theo tốt hơn khi hiểu vì sao."
    ],
    "analogy": "Giống **mẫu báo cáo công ty**: ai viết cũng có đủ mục, đúng thứ tự. Người đọc biết tìm thông tin ở đâu.",
    "concepts": [
      {
        "term": "Template",
        "meaning": "Khung prompt có biến được điền vào."
      },
      {
        "term": "Few-shot examples",
        "meaning": "Ví dụ mẫu đưa vào prompt để model bắt chước."
      },
      {
        "term": "System prompt",
        "meaning": "Chỉ dẫn nền về vai trò và quy tắc, ổn định qua nhiều lần gọi."
      }
    ],
    "examples": [
      {
        "title": "Template sinh test case có cấu trúc rõ ràng",
        "code": {
          "title": "ai/prompts/generate-cases.ts",
          "language": "ts",
          "code": "export const SYSTEM = `Bạn là Senior SDET của team. Bạn viết test case ngắn gọn, kiểm chứng được,\nưu tiên rủi ro nghiệp vụ. Mỗi case phải có kết quả mong đợi quan sát được trên UI hoặc API.`;\n\nexport function generateCasesPrompt(input: { feature: string; acceptanceCriteria: string[]; examples: string }) {\n  return `\n<feature>${input.feature}</feature>\n\n<acceptance_criteria>\n${input.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join(\"\\n\")}\n</acceptance_criteria>\n\n<team_examples>\n${input.examples}\n</team_examples>\n\n<instructions>\n- Viết ít nhất 1 case cho mỗi acceptance criterion.\n- Thêm case boundary và negative cho mọi input của người dùng.\n- Đặt tên case theo mẫu \"<hành động> khi <điều kiện>\" như trong team_examples.\n- Kết quả mong đợi phải kiểm chứng được (ví dụ: \"hiện thông báo X\", không phải \"hoạt động đúng\"),\n  vì test tự động chỉ assert được điều quan sát được.\n</instructions>`.trim();\n}"
        },
        "notes": [
          "Quy tắc có kèm lý do (\"vì test tự động chỉ assert được…\") giúp model áp dụng đúng tinh thần, không chỉ đúng chữ."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Mỗi người tự viết prompt trong chat rồi copy kết quả.",
        "fix": "Lưu template trong repo, review như code."
      },
      {
        "wrong": "Ví dụ few-shot là test có anti-pattern.",
        "fix": "Chỉ dùng test \"chuẩn vàng\" đã được review."
      },
      {
        "wrong": "Prompt toàn \"KHÔNG được…\".",
        "fix": "Nói rõ điều cần làm và lý do. Điều cấm thì đưa vào lint hoặc validation gate."
      }
    ],
    "exercise": {
      "task": "Viết template `reviewTestPrompt` để AI review một file Playwright theo 5 tiêu chí của team (locator, assertion, isolation, đặt tên, không hard-wait), trả về danh sách issue có `line`, `rule`, `suggestion`.",
      "hint": "Kết hợp với structured output (tool có input_schema) để nhận về mảng issue.",
      "solutionNote": "Cấu trúc: `<rules>` liệt kê 5 tiêu chí kèm lý do, `<file>` chứa code đánh số dòng, `<instructions>` yêu cầu chỉ báo issue có dòng cụ thể và gợi ý sửa."
    },
    "checklist": [
      "Viết được template có phần tách bạch bằng thẻ XML",
      "Chọn được ví dụ few-shot phù hợp",
      "Giải thích được vì sao nên nêu lý do của quy tắc"
    ],
    "interviewTip": "\"Prompt của team được lưu trong repo dưới dạng template, review như code. Template có vai trò, ngữ cảnh, quy tắc kèm lý do và few-shot lấy từ test chuẩn của team. Nhờ vậy output nhất quán và cải tiến được qua eval.\"",
    "resources": [
      {
        "title": "Anthropic — Use XML tags",
        "url": "https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags",
        "kind": "docs"
      },
      {
        "title": "Anthropic — Multishot prompting",
        "url": "https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/multishot-prompting",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "edge-case-taxonomy",
    "minutes": 30,
    "level": "Trung cấp",
    "why": "AI hay sinh nhiều case \"happy path\" na ná nhau. Taxonomy edge case là danh mục bắt buộc giúp cả người lẫn AI không bỏ sót những chỗ hay có bug.",
    "explain": [
      "**Taxonomy** là danh sách các loại edge case cần xét cho mọi input hoặc tính năng: **boundary** (giá trị biên: 0, max, max+1), **negative** (sai định dạng, thiếu, rỗng), **auth** (chưa đăng nhập, sai quyền), **concurrency/race** (bấm 2 lần, 2 tab cùng sửa), **i18n** (dấu tiếng Việt, emoji, RTL, định dạng tiền và ngày), **network** (chậm, mất mạng, timeout).",
      "Đưa taxonomy vào prompt như một **checklist bắt buộc**, và yêu cầu AI gắn nhãn mỗi case theo loại. Sau đó kiểm tra bằng code xem loại nào còn thiếu (kết hợp bài Evals).",
      "Đây cũng là cách bạn tự review test plan của người khác: \"case race condition đâu?\""
    ],
    "analogy": "Giống **checklist an toàn trước khi cất cánh** của phi công: không dựa vào trí nhớ, đi qua từng mục mỗi lần.",
    "concepts": [
      {
        "term": "Boundary value analysis",
        "meaning": "Test tại và quanh giá trị biên, nơi lỗi off-by-one hay xảy ra."
      },
      {
        "term": "Equivalence partitioning",
        "meaning": "Chia input thành nhóm hành xử giống nhau, mỗi nhóm test một đại diện."
      },
      {
        "term": "Race condition",
        "meaning": "Kết quả sai khi các thao tác xảy ra đồng thời hoặc khác thứ tự mong đợi."
      }
    ],
    "examples": [
      {
        "title": "Taxonomy dạng dữ liệu, đưa vào prompt và kiểm tra lại",
        "code": {
          "title": "ai/taxonomy.ts",
          "language": "ts",
          "code": "export const EDGE_TAXONOMY = {\n  boundary: \"Giá trị biên: 0, 1, max, max+1, chuỗi rỗng, độ dài tối đa\",\n  negative: \"Sai định dạng, thiếu trường bắt buộc, ký tự đặc biệt, SQL/HTML injection\",\n  auth: \"Chưa đăng nhập, phiên hết hạn, sai vai trò, truy cập tài nguyên của người khác\",\n  race: \"Bấm 2 lần liên tiếp, 2 tab cùng cập nhật, request về sai thứ tự\",\n  i18n: \"Tiếng Việt có dấu, emoji, chuỗi rất dài, định dạng tiền/ngày theo locale\",\n  network: \"API chậm, lỗi 500, mất mạng giữa chừng, timeout\",\n} as const;\n\nexport type EdgeType = keyof typeof EDGE_TAXONOMY;\n\nexport const taxonomyPrompt = () =>\n  Object.entries(EDGE_TAXONOMY).map(([k, v]) => `- ${k}: ${v}`).join(\"\\n\");\n\nexport function missingTypes(cases: { edgeType: EdgeType }[]): EdgeType[] {\n  const seen = new Set(cases.map((c) => c.edgeType));\n  return (Object.keys(EDGE_TAXONOMY) as EdgeType[]).filter((t) => !seen.has(t));\n}"
        }
      },
      {
        "title": "Ví dụ case race condition người mới hay quên",
        "code": {
          "title": "e2e/double-submit.spec.ts",
          "language": "ts",
          "code": "test(\"bấm Thanh toán 2 lần chỉ tạo 1 đơn\", async ({ page, request }) => {\n  await page.goto(\"/checkout\");\n  const pay = page.getByRole(\"button\", { name: \"Thanh toán\" });\n  await Promise.all([pay.click(), pay.click({ force: true })]); // mô phỏng double-click nhanh\n  await expect(page.getByRole(\"heading\", { name: \"Đặt hàng thành công\" })).toBeVisible();\n\n  const orders = await (await request.get(\"/api/test/orders?mine=1\")).json();\n  expect(orders).toHaveLength(1);\n});"
        },
        "notes": [
          "`force: true` bỏ qua kiểm tra actionability để click lần 2 ngay cả khi nút đang bị disable. Mục đích là kiểm tra server có chống trùng (idempotency) hay không."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Chỉ test happy path và 1 case lỗi chung chung.",
        "fix": "Đi qua taxonomy cho mọi input và tính năng."
      },
      {
        "wrong": "Test boundary chỉ tại max, quên max+1.",
        "fix": "Luôn test cặp: tại biên và vượt biên."
      },
      {
        "wrong": "Bỏ qua i18n vì \"app chỉ có tiếng Việt\".",
        "fix": "Tiếng Việt có dấu, emoji và chuỗi dài vẫn gây lỗi tràn chữ và lỗi encoding."
      }
    ],
    "exercise": {
      "task": "Áp dụng taxonomy cho ô \"Số lượng\" trong giỏ hàng (min 1, max 10). Liệt kê ít nhất 8 case, mỗi case gắn 1 nhãn trong taxonomy.",
      "solutionNote": "Ví dụ: 1 và 10 (boundary hợp lệ), 0 và 11 (boundary không hợp lệ), \"abc\" và -1 và 1.5 (negative), bấm + liên tục nhanh (race), chưa đăng nhập cập nhật giỏ (auth), API cập nhật chậm hoặc lỗi 500 (network)."
    },
    "checklist": [
      "Kể được 6 nhóm trong taxonomy kèm ví dụ",
      "Đưa được taxonomy vào prompt và kiểm tra loại còn thiếu bằng code",
      "Viết được ít nhất một test race condition"
    ],
    "interviewTip": "\"Tôi có taxonomy edge case gồm boundary, negative, auth, race, i18n và network. Nó vừa là checklist khi review test plan, vừa nằm trong prompt sinh test, và code kiểm tra plan nào còn thiếu nhóm nào. Race condition như double-submit là thứ tôi luôn hỏi đầu tiên.\""
  },
  {
    "topicId": "prompt-versioning",
    "minutes": 30,
    "level": "Nâng cao",
    "why": "Prompt là code. Đổi một câu có thể làm chất lượng giảm 20% mà không ai biết nếu không có version và regression test.",
    "explain": [
      "Lưu prompt trong repo với **phiên bản** rõ ràng (ví dụ `generate-cases@v3`). Mỗi output sinh ra ghi lại prompt version và model đã dùng để truy vết khi có vấn đề.",
      "Mỗi PR sửa prompt phải chạy **regression eval** trên golden set (bài Evals) và so với phiên bản trước. Điểm giảm quá ngưỡng thì chặn merge.",
      "Đổi **model** cũng phải đi qua quy trình y hệt: model mới không đảm bảo tốt hơn cho tác vụ của bạn."
    ],
    "analogy": "Giống **công thức nấu ăn của nhà hàng**: mỗi lần chỉnh công thức đều ghi phiên bản và cho người nếm thử so với bản cũ trước khi đưa vào thực đơn.",
    "concepts": [
      {
        "term": "Prompt version",
        "meaning": "Định danh phiên bản của template, gắn vào mọi output."
      },
      {
        "term": "Regression eval",
        "meaning": "Chạy golden set để so chất lượng giữa 2 phiên bản."
      },
      {
        "term": "Quality gate",
        "meaning": "Ngưỡng chặn merge khi điểm eval giảm."
      }
    ],
    "examples": [
      {
        "title": "Registry prompt có phiên bản",
        "code": {
          "title": "ai/prompts/registry.ts",
          "language": "ts",
          "code": "import { generateCasesPrompt as v3 } from \"./generate-cases.v3\";\nimport { generateCasesPrompt as v4 } from \"./generate-cases.v4\";\n\nexport const PROMPTS = {\n  \"generate-cases@v3\": v3,\n  \"generate-cases@v4\": v4,\n} as const;\n\nexport type PromptId = keyof typeof PROMPTS;\nexport const ACTIVE: PromptId = \"generate-cases@v4\"; // đổi qua PR có eval\n\n// Mọi output đều kèm metadata để truy vết\nexport type GenerationMeta = { promptId: PromptId; model: string; at: string };"
        }
      },
      {
        "title": "CI chặn merge khi điểm eval giảm",
        "code": {
          "title": ".github/workflows/prompt-eval.yml",
          "language": "yaml",
          "code": "name: prompt-eval\non:\n  pull_request:\n    paths: [\"ai/prompts/**\"]\n\njobs:\n  eval:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with: { node-version: 22, cache: npm }\n      - run: npm ci\n      - run: node scripts/run-evals.mjs --baseline=main --candidate=HEAD --runs=3 > eval.json\n        env:\n          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}\n      - run: node scripts/compare-evals.mjs eval.json --max-drop=0.03   # giảm > 3 điểm % → fail"
        }
      }
    ],
    "mistakes": [
      {
        "wrong": "Sửa prompt trực tiếp trên production vì \"chỉ đổi một câu\".",
        "fix": "Mọi thay đổi prompt đi qua PR và regression eval."
      },
      {
        "wrong": "Không ghi lại prompt version trong output.",
        "fix": "Gắn `promptId` và `model` vào metadata để truy vết."
      },
      {
        "wrong": "Chạy eval 1 lần rồi kết luận.",
        "fix": "Chạy nhiều lần và so trung bình, vì LLM không deterministic."
      }
    ],
    "exercise": {
      "task": "Viết `compareEvals(base, candidate, maxDrop)` nhận 2 mảng điểm (mỗi item có `id`, `coverage`), trả về `{ pass, delta, worstItems }`.",
      "solution": {
        "title": "scripts/compare-evals.ts",
        "language": "ts",
        "code": "type Score = { id: string; coverage: number };\n\nexport function compareEvals(base: Score[], cand: Score[], maxDrop = 0.03) {\n  const avg = (xs: Score[]) => xs.reduce((s, x) => s + x.coverage, 0) / xs.length;\n  const delta = avg(cand) - avg(base);\n  const worstItems = cand\n    .map((c) => ({ id: c.id, drop: (base.find((b) => b.id === c.id)?.coverage ?? 0) - c.coverage }))\n    .filter((x) => x.drop > 0)\n    .sort((a, b) => b.drop - a.drop)\n    .slice(0, 3);\n  return { pass: delta >= -maxDrop, delta, worstItems };\n}"
      }
    },
    "checklist": [
      "Version được prompt và gắn metadata vào output",
      "Thiết lập được CI chạy eval khi prompt thay đổi",
      "Áp dụng cùng quy trình khi đổi model"
    ],
    "interviewTip": "\"Tôi đối xử với prompt như code: có phiên bản, review qua PR, và mỗi thay đổi chạy regression eval trên golden set nhiều lần. Giảm quá ngưỡng thì chặn merge. Mọi output đều ghi prompt version và model để truy vết, và đổi model cũng đi qua đúng quy trình này.\""
  }
];
