/* Tự sinh từ nội dung bài học — chỉnh sửa trực tiếp tại đây cũng được. */
import type { Lesson } from "./types";

export const phase1Lessons: Lesson[] = [
  {
    "topicId": "pyramid-models",
    "minutes": 30,
    "level": "Cơ bản",
    "why": "Câu hỏi \"bạn phân bổ test thế nào?\" gần như luôn xuất hiện trong phỏng vấn Senior. Phân bổ sai thì suite vừa chậm vừa flaky mà vẫn lọt bug.",
    "explain": [
      "Mỗi loại test có **chi phí** (thời gian viết, thời gian chạy, độ dễ vỡ) và **độ tin cậy** (giống người dùng thật đến đâu) khác nhau. Mô hình phân bổ giúp trả lời câu hỏi: nên đầu tư bao nhiêu test ở mỗi tầng?",
      "**Test Pyramid** (Mike Cohn): đáy rộng là **unit test** (nhiều, nhanh, rẻ), giữa là **integration test**, đỉnh hẹp là **E2E** (ít, chậm, đắt). Phù hợp với backend có nhiều logic nghiệp vụ.",
      "**Testing Trophy** (Kent C. Dodds): thêm tầng **static** ở đáy (TypeScript, ESLint) và **phần to nhất là integration**. Lý do: với frontend hiện đại, test nhiều component cùng hoạt động với nhau mang lại độ tự tin cao nhất trên mỗi đồng chi phí.",
      "**Honeycomb** (Spotify) dành cho microservices: tập trung vào **integration test của từng service** (gọi API thật của service đó cùng DB thật). Unit test và E2E xuyên hệ thống chỉ chiếm phần nhỏ. Không có mô hình nào đúng tuyệt đối. Senior là người **chọn mô hình theo kiến trúc** và giải thích được vì sao."
    ],
    "analogy": "Kiểm tra một toà nhà: unit test là kiểm tra **từng viên gạch**, integration là kiểm tra **từng bức tường**, E2E là **đi một vòng cả toà nhà**. Không ai đi vòng cả toà nhà để kiểm tra từng viên gạch, vì quá chậm và khi có lỗi thì không biết viên nào hỏng.",
    "concepts": [
      {
        "term": "Unit test",
        "meaning": "Kiểm tra 1 hàm hoặc 1 class tách biệt. Chạy trong mili-giây."
      },
      {
        "term": "Integration test",
        "meaning": "Kiểm tra nhiều phần chạy cùng nhau: component + hook + API mock, hoặc API route + DB."
      },
      {
        "term": "E2E test",
        "meaning": "Chạy app thật trên trình duyệt thật, đi hết một luồng người dùng."
      },
      {
        "term": "Static analysis",
        "meaning": "TypeScript, ESLint: bắt lỗi mà không cần chạy code. Rẻ nhất."
      },
      {
        "term": "Cost of feedback",
        "meaning": "Mất bao lâu để biết code mình sai. Đây là thước đo quan trọng nhất khi phân bổ test."
      }
    ],
    "examples": [
      {
        "title": "Một tính năng — ba tầng test",
        "intro": "Tính năng: áp mã giảm giá khi checkout. Cùng một yêu cầu, mỗi tầng kiểm tra một điều khác nhau.",
        "code": {
          "title": "checkout — 3 tầng",
          "language": "ts",
          "code": "// 1) UNIT — quy tắc tính tiền (hàng chục case, chạy < 10ms)\nit(\"SALE10 giảm 10% nhưng tối đa 50.000đ\", () => {\n  expect(applyCoupon(1_000_000, \"SALE10\")).toBe(950_000);\n  expect(applyCoupon(200_000, \"SALE10\")).toBe(180_000);\n});\n\n// 2) INTEGRATION — component + API (mock network), vài case\nit(\"hiển thị tổng tiền mới sau khi áp mã\", async () => {\n  server.use(http.post(\"/api/coupon\", () => HttpResponse.json({ total: 180000 })));\n  render(<CheckoutSummary subtotal={200000} />);\n  await user.type(screen.getByRole(\"textbox\", { name: \"Mã giảm giá\" }), \"SALE10\");\n  await user.click(screen.getByRole(\"button\", { name: \"Áp dụng\" }));\n  expect(await screen.findByText(\"180.000đ\")).toBeInTheDocument();\n});\n\n// 3) E2E — 1 luồng hạnh phúc trên app thật (chậm nhất, ít nhất)\ntest(\"mua hàng có mã giảm giá\", async ({ page }) => {\n  await page.goto(\"/cart\");\n  await page.getByLabel(\"Mã giảm giá\").fill(\"SALE10\");\n  await page.getByRole(\"button\", { name: \"Áp dụng\" }).click();\n  await page.getByRole(\"button\", { name: \"Thanh toán\" }).click();\n  await expect(page.getByRole(\"heading\", { name: \"Đặt hàng thành công\" })).toBeVisible();\n});"
        },
        "notes": [
          "Mọi nhánh tính toán (giới hạn tối đa, mã hết hạn, đơn tối thiểu) nằm ở **unit**. Đừng viết 10 E2E cho 10 trường hợp mã giảm giá.",
          "E2E chỉ chứng minh **các mảnh ghép nối với nhau đúng**.",
          "`server.use(http.post(...))` là cú pháp của MSW (Mock Service Worker), thư viện phổ biến để mock network trong integration test."
        ]
      },
      {
        "title": "Viết chiến lược thành dữ liệu để review được",
        "code": {
          "title": "docs/test-strategy.ts",
          "language": "ts",
          "code": "type Layer = \"static\" | \"unit\" | \"integration\" | \"e2e\";\n\nexport const strategy: Record<Layer, { owns: string; target: string; tool: string }> = {\n  static:      { owns: \"kiểu dữ liệu, import sai, code chết\",  target: \"0 lỗi trên CI\",   tool: \"tsc + ESLint\" },\n  unit:        { owns: \"quy tắc nghiệp vụ, hàm thuần\",        target: \"~60% số test\",    tool: \"Vitest\" },\n  integration: { owns: \"component + hook + API mock, API + DB\", target: \"~30% số test\",    tool: \"Vitest + MSW, Playwright API\" },\n  e2e:         { owns: \"5–15 critical user journeys\",          target: \"< 10% số test\",   tool: \"Playwright\" },\n};"
        }
      }
    ],
    "mistakes": [
      {
        "wrong": "\"Ice-cream cone\": rất nhiều E2E, rất ít unit. Suite chạy 1 tiếng và flaky.",
        "fix": "Đẩy logic xuống tầng thấp nhất có thể bắt được lỗi. E2E chỉ giữ cho luồng quan trọng."
      },
      {
        "wrong": "Coi tỉ lệ 70/20/10 là luật cứng.",
        "fix": "Tỉ lệ là hệ quả của kiến trúc và risk. Hãy giải thích được **vì sao** chọn tỉ lệ đó cho hệ thống của bạn."
      },
      {
        "wrong": "Unit test mock mọi thứ đến mức không còn kiểm tra gì thật.",
        "fix": "Nếu phải mock 5 thứ để test 1 hàm thì đó là dấu hiệu nên viết integration test."
      }
    ],
    "exercise": {
      "task": "Chọn một tính năng trong một web app bạn quen thuộc (ví dụ đăng ký tài khoản). Liệt kê 10 trường hợp cần kiểm tra và phân loại từng trường hợp vào static / unit / integration / e2e, kèm 1 câu lý do.",
      "steps": [
        "Viết ra 10 hành vi hoặc rủi ro (email sai định dạng, trùng email, mật khẩu yếu, gửi mail xác nhận…).",
        "Với mỗi hành vi, hỏi: tầng **thấp nhất** nào bắt được lỗi này?",
        "Đếm tỉ lệ cuối cùng và so với Pyramid và Trophy."
      ],
      "hint": "Validation định dạng nằm ở unit (hoặc static nếu dùng Zod + TS). \"Trùng email\" cần DB nên là integration. \"Đăng ký xong vào được dashboard\" là E2E.",
      "solutionNote": "Kết quả hợp lý: khoảng 5 unit (các rule validation), 3 integration (API + DB: trùng email, lưu user, gửi mail qua mock), 1–2 E2E (luồng đăng ký thành công). Nếu bạn có hơn 3 E2E, hãy xem lại."
    },
    "checklist": [
      "Vẽ lại được Pyramid, Trophy và Honeycomb và nói khi nào dùng cái nào",
      "Giải thích được \"cost of feedback\"",
      "Phân bổ được test cho một tính năng cụ thể theo tầng thấp nhất có thể"
    ],
    "interviewTip": "\"Tôi không áp cứng một mô hình. Với frontend Next.js, tôi theo Testing Trophy: TypeScript và ESLint ở đáy, đầu tư nhiều vào integration test cho component. Với microservices, tôi theo Honeycomb, tập trung vào integration test của từng service cộng với contract test. E2E luôn giới hạn ở các critical journey vì đó là tầng đắt và dễ flaky nhất.\"",
    "resources": [
      {
        "title": "Martin Fowler — The Practical Test Pyramid",
        "url": "https://martinfowler.com/articles/practical-test-pyramid.html",
        "kind": "article"
      },
      {
        "title": "Kent C. Dodds — The Testing Trophy",
        "url": "https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications",
        "kind": "article"
      }
    ]
  },
  {
    "topicId": "risk-based",
    "minutes": 30,
    "level": "Cơ bản",
    "why": "Không bao giờ đủ thời gian để test mọi thứ. Risk-based testing giúp bạn bảo vệ được quyết định \"test cái này trước, bỏ qua cái kia\" bằng lý lẽ chứ không phải cảm tính.",
    "explain": [
      "**Rủi ro = Khả năng xảy ra × Mức độ ảnh hưởng**. Một tính năng hay đổi code và lỗi thì mất tiền (thanh toán) có rủi ro cao. Một trang \"Giới thiệu\" ít ai sửa có rủi ro thấp.",
      "**Khả năng xảy ra** dựa vào: code mới hay vừa refactor, độ phức tạp, tần suất thay đổi (git log), lịch sử bug. **Ảnh hưởng** dựa vào: mất tiền, mất dữ liệu, vi phạm pháp lý, số người dùng bị ảnh hưởng.",
      "**Coverage matrix** là bảng: hàng là tính năng hoặc rủi ro, cột là tầng test hay loại kiểm tra. Bảng cho thấy ngay chỗ nào rủi ro cao mà chưa có test. Đây là công cụ để trao đổi với PM và team, không chỉ để QA dùng."
    ],
    "analogy": "Bác sĩ cấp cứu phân loại bệnh nhân: người nguy kịch được ưu tiên trước, người trầy xước nhẹ chờ sau. Risk-based testing chính là phân loại để dồn sức vào nơi \"có thể chết người\" trước.",
    "concepts": [
      {
        "term": "Likelihood",
        "meaning": "Khả năng lỗi xảy ra (1–5): code mới, phức tạp, hay thay đổi thì điểm cao."
      },
      {
        "term": "Impact",
        "meaning": "Hậu quả khi lỗi (1–5): mất tiền, mất dữ liệu, nhiều người bị ảnh hưởng thì điểm cao."
      },
      {
        "term": "Risk score",
        "meaning": "Likelihood × Impact (1–25), dùng để sắp xếp ưu tiên."
      },
      {
        "term": "Coverage matrix",
        "meaning": "Bảng đối chiếu rủi ro với test hiện có, giúp lộ ra khoảng trống."
      }
    ],
    "examples": [
      {
        "title": "Tính điểm rủi ro bằng code",
        "code": {
          "title": "scripts/risk-matrix.ts",
          "language": "ts",
          "code": "type Feature = { name: string; likelihood: 1 | 2 | 3 | 4 | 5; impact: 1 | 2 | 3 | 4 | 5; tests: string[] };\n\nconst features: Feature[] = [\n  { name: \"Thanh toán\",       likelihood: 4, impact: 5, tests: [\"unit\", \"integration\", \"e2e\"] },\n  { name: \"Đăng nhập\",        likelihood: 2, impact: 5, tests: [\"e2e\"] },\n  { name: \"Gợi ý sản phẩm\",   likelihood: 4, impact: 2, tests: [] },\n  { name: \"Trang giới thiệu\", likelihood: 1, impact: 1, tests: [] },\n];\n\nconst report = features\n  .map((f) => ({ ...f, risk: f.likelihood * f.impact }))\n  .sort((a, b) => b.risk - a.risk)\n  .map((f) => ({\n    feature: f.name,\n    risk: f.risk,\n    level: f.risk >= 15 ? \"CAO\" : f.risk >= 8 ? \"TRUNG BÌNH\" : \"THẤP\",\n    gap: f.risk >= 8 && f.tests.length < 2 ? \"⚠ thiếu test\" : \"\",\n  }));\n\nconsole.table(report);"
        },
        "notes": [
          "Kết quả: \"Thanh toán\" (20) và \"Đăng nhập\" (10) lên đầu. \"Gợi ý sản phẩm\" (8) đang **không có test nào**, đây là khoảng trống cần xử lý.",
          "Lấy `likelihood` từ dữ liệu thật: số commit 3 tháng gần nhất của thư mục đó (`git log --since=3.months -- path | grep -c ^commit`)."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Ưu tiên test theo thứ tự trong backlog hoặc theo tính năng dễ test.",
        "fix": "Ưu tiên theo điểm rủi ro, và ghi rõ lý do để team review được."
      },
      {
        "wrong": "Chấm điểm một lần rồi để đó.",
        "fix": "Cập nhật matrix mỗi quý hoặc sau mỗi sự cố production. Rủi ro thay đổi theo code."
      },
      {
        "wrong": "Chỉ nghĩ đến rủi ro chức năng.",
        "fix": "Thêm rủi ro bảo mật, hiệu năng, accessibility, pháp lý (dữ liệu cá nhân) vào matrix."
      }
    ],
    "exercise": {
      "task": "Lập risk matrix cho 6 tính năng của một app thương mại điện tử: đăng nhập, tìm kiếm, giỏ hàng, thanh toán, đánh giá sản phẩm, quản trị kho. Chấm likelihood và impact, sắp xếp, và đề xuất tầng test cho top 3.",
      "hint": "Hỏi: \"Nếu tính năng này hỏng 1 giờ thì công ty mất gì?\" để chấm impact. Hỏi: \"Tuần này có ai sửa code phần này không?\" để chấm likelihood.",
      "solutionNote": "Thường thấy thanh toán (4×5), giỏ hàng (4×4), đăng nhập (2×5) đứng đầu. Quản trị kho có impact cao (sai tồn kho) nhưng ít người dùng, thường ở mức trung bình. Đánh giá sản phẩm thấp nhất."
    },
    "checklist": [
      "Tính được risk score và giải thích hai thành phần của nó",
      "Lập được coverage matrix và chỉ ra khoảng trống",
      "Dùng được dữ liệu thật (git log, lịch sử bug) để chấm likelihood"
    ],
    "interviewTip": "\"Tôi ưu tiên test theo risk = likelihood × impact. Likelihood lấy từ dữ liệu thật như tần suất thay đổi code và lịch sử bug, impact lấy từ business. Coverage matrix giúp tôi chỉ cho PM thấy chỗ nào rủi ro cao chưa được bảo vệ, và đó là cơ sở để xin thời gian viết test.\""
  },
  {
    "topicId": "shift-left",
    "minutes": 35,
    "level": "Trung cấp",
    "why": "Bug phát hiện ở PR rẻ hơn hàng chục lần so với bug phát hiện trên production. Shift-left nghĩa là đưa test về sớm nhất có thể trong vòng đời phát triển.",
    "explain": [
      "Hình dung vòng đời code là một đường thẳng từ trái sang phải: viết code, PR, merge, staging, production. **Shift-left** là dời việc kiểm thử sang **bên trái**, tức sớm hơn.",
      "Trong thực tế có nghĩa là: lint và typecheck chạy khi commit, unit test chạy trên mỗi PR, và quan trọng nhất là **mỗi PR có một môi trường preview riêng** (Vercel tự tạo URL preview) để chạy E2E trên đúng code của PR đó, thay vì chờ merge vào staging.",
      "Với Vercel và GitHub Actions: khi Vercel deploy preview xong, GitHub phát sự kiện `deployment_status`. Workflow lắng nghe sự kiện này, lấy URL preview và chạy Playwright vào đó. Kết quả hiện ngay trên PR."
    ],
    "analogy": "Sửa bản vẽ thì rẻ, phá tường đã xây thì đắt. Shift-left là kiểm tra kỹ **lúc còn là bản vẽ**.",
    "concepts": [
      {
        "term": "Preview environment",
        "meaning": "Bản deploy tạm thời cho từng PR hoặc branch, có URL riêng."
      },
      {
        "term": "deployment_status",
        "meaning": "Sự kiện GitHub phát ra khi một deployment đổi trạng thái (success, failure…)."
      },
      {
        "term": "baseURL",
        "meaning": "Cấu hình Playwright: địa chỉ gốc, nhờ vậy `page.goto('/cart')` chạy được trên mọi môi trường."
      },
      {
        "term": "Required check",
        "meaning": "Check bắt buộc phải xanh thì mới được merge PR (thiết lập trong Branch protection)."
      }
    ],
    "examples": [
      {
        "title": "Playwright đọc baseURL từ biến môi trường",
        "code": {
          "title": "playwright.config.ts",
          "language": "ts",
          "code": "import { defineConfig, devices } from \"@playwright/test\";\n\nconst BASE_URL = process.env.BASE_URL ?? \"http://localhost:3000\";\n\nexport default defineConfig({\n  testDir: \"./e2e\",\n  use: { baseURL: BASE_URL, trace: \"on-first-retry\" },\n  retries: process.env.CI ? 1 : 0,\n  projects: [{ name: \"chromium\", use: { ...devices[\"Desktop Chrome\"] } }],\n  // Chạy local: tự khởi động app. Trên preview URL thì không cần.\n  webServer: process.env.BASE_URL\n    ? undefined\n    : { command: \"npm run dev\", url: BASE_URL, reuseExistingServer: true },\n});"
        }
      },
      {
        "title": "Chạy E2E trên mỗi Vercel preview",
        "code": {
          "title": ".github/workflows/e2e-preview.yml",
          "language": "yaml",
          "code": "name: e2e-on-preview\non: deployment_status\n\njobs:\n  e2e:\n    # Chỉ chạy khi deploy thành công\n    if: github.event.deployment_status.state == 'success'\n    runs-on: ubuntu-latest\n    timeout-minutes: 15\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with: { node-version: 22, cache: npm }\n      - run: npm ci\n      - run: npx playwright install --with-deps chromium\n      - run: npx playwright test\n        env:\n          BASE_URL: ${{ github.event.deployment_status.environment_url }}\n      - uses: actions/upload-artifact@v4\n        if: ${{ !cancelled() }}\n        with: { name: playwright-report, path: playwright-report, retention-days: 7 }"
        },
        "notes": [
          "`environment_url` là URL preview Vercel gửi kèm sự kiện.",
          "Nếu preview được bảo vệ bằng Vercel Authentication, cần cấu hình **Protection Bypass for Automation** và gửi header `x-vercel-protection-bypass` trong `extraHTTPHeaders`."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Chỉ chạy E2E trên staging sau khi merge, nên bug của nhiều PR trộn lẫn và khó biết ai gây ra.",
        "fix": "Chạy E2E trên preview của từng PR. Lỗi thuộc về đúng PR gây ra nó."
      },
      {
        "wrong": "Hard-code URL trong test.",
        "fix": "Dùng `baseURL` và đường dẫn tương đối: `page.goto('/cart')`."
      },
      {
        "wrong": "Cho E2E chạy nhưng không đặt làm required check.",
        "fix": "Bật Branch protection để E2E xanh mới được merge, nếu không shift-left chỉ là hình thức."
      }
    ],
    "exercise": {
      "task": "Trong một web app bạn có quyền sửa và đã deploy có preview theo PR (ví dụ trên Vercel hoặc Netlify), thêm workflow chạy 1 test Playwright kiểm tra trang chủ hiển thị heading chính trên mỗi preview deploy.",
      "steps": [
        "Cài `@playwright/test` và tạo `playwright.config.ts` như ví dụ 1.",
        "Viết `e2e/home.spec.ts` dùng `page.goto('/')` và `getByRole('heading')`.",
        "Thêm workflow ví dụ 2, mở một PR nhỏ và xem check chạy trên PR."
      ],
      "hint": "Heading chính dùng `{ level: 1 }`: `page.getByRole('heading', { level: 1 })`, rồi `toBeVisible()` — hoặc `toContainText(...)` với nội dung heading thật của app.",
      "solution": {
        "title": "e2e/home.spec.ts",
        "language": "ts",
        "code": "import { test, expect } from \"@playwright/test\";\n\ntest(\"trang chủ hiển thị mục tiêu lộ trình\", async ({ page }) => {\n  await page.goto(\"/\");\n  await expect(page.getByRole(\"heading\", { level: 1 })).toBeVisible();\n});"
      }
    },
    "checklist": [
      "Giải thích được shift-left và lợi ích về chi phí",
      "Cấu hình được Playwright chạy với `BASE_URL` động",
      "Viết được workflow chạy E2E trên preview URL"
    ],
    "interviewTip": "\"Mỗi PR có preview environment riêng. Khi deploy thành công, sự kiện deployment_status kích hoạt Playwright chạy vào đúng URL đó, và check này là required để merge. Bug được phát hiện trong PR gây ra nó, thay vì dồn về staging.\"",
    "resources": [
      {
        "title": "Playwright — CI",
        "url": "https://playwright.dev/docs/ci-intro",
        "kind": "docs"
      },
      {
        "title": "GitHub — deployment_status event",
        "url": "https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#deployment_status",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "suite-slo",
    "minutes": 30,
    "level": "Trung cấp",
    "why": "Không đo thì không quản lý được. SLO biến \"suite hơi chậm\" thành con số mà cả team cam kết và theo dõi.",
    "explain": [
      "**SLO (Service Level Objective)** là mục tiêu đo được. Áp dụng cho test suite, ví dụ: P95 thời gian pipeline của PR < 10 phút, tỉ lệ flaky < 1%, mọi test quarantine được sửa trong 7 ngày.",
      "**P95** nghĩa là 95% số lần chạy nhanh hơn ngưỡng này. Dùng P95 thay vì trung bình vì trung bình che mất những lần chạy rất chậm, mà lập trình viên thì nhớ nhất những lần đó.",
      "Playwright có **JSON reporter**. Mỗi test trong report có `status`: `expected` (đúng như mong đợi), `unexpected` (fail), `flaky` (fail rồi pass khi retry), `skipped`. Từ đó tính được flaky rate và thời gian chạy."
    ],
    "analogy": "Giống cam kết giao hàng \"95% đơn đến trong 2 ngày\": khách hàng (lập trình viên) biết trước mình chờ bao lâu, và đội vận hành (QA platform) biết khi nào phải hành động.",
    "concepts": [
      {
        "term": "SLO",
        "meaning": "Mục tiêu đo được, ví dụ \"P95 < 10 phút\"."
      },
      {
        "term": "P95",
        "meaning": "Giá trị mà 95% số mẫu nhỏ hơn. Nhạy với các lần chạy chậm bất thường."
      },
      {
        "term": "Flaky rate",
        "meaning": "Số test flaky / tổng số test trong một lần chạy, hoặc trung bình theo tuần."
      },
      {
        "term": "Error budget",
        "meaning": "Phần được phép vi phạm SLO. Hết budget thì ưu tiên sửa ổn định thay vì làm tính năng mới."
      }
    ],
    "examples": [
      {
        "title": "Tính flaky rate và kiểm tra SLO từ JSON report",
        "intro": "Chạy `npx playwright test --reporter=json > results.json`, sau đó chạy script:",
        "code": {
          "title": "scripts/check-slo.ts",
          "language": "ts",
          "code": "import { readFileSync } from \"node:fs\";\n\ntype Test = { status: \"expected\" | \"unexpected\" | \"flaky\" | \"skipped\"; results: { duration: number }[] };\ntype Suite = { specs?: { tests: Test[] }[]; suites?: Suite[] };\n\nconst report = JSON.parse(readFileSync(\"results.json\", \"utf8\")) as { suites: Suite[]; stats: { duration: number } };\n\nconst tests: Test[] = [];\nconst walk = (s: Suite) => {\n  s.specs?.forEach((spec) => tests.push(...spec.tests));\n  s.suites?.forEach(walk);\n};\nreport.suites.forEach(walk);\n\nconst ran = tests.filter((t) => t.status !== \"skipped\");\nconst flaky = ran.filter((t) => t.status === \"flaky\").length;\nconst flakyRate = (flaky / ran.length) * 100;\nconst minutes = report.stats.duration / 60_000;\n\nconsole.log(`tests=${ran.length} flaky=${flaky} (${flakyRate.toFixed(2)}%) duration=${minutes.toFixed(1)}m`);\n\nconst SLO = { flakyRatePct: 1, durationMin: 10 };\nif (flakyRate > SLO.flakyRatePct || minutes > SLO.durationMin) {\n  console.error(\"❌ Vi phạm SLO của test suite\");\n  process.exit(1);\n}"
        },
        "notes": [
          "Một lần chạy chỉ là một mẫu. Muốn có P95 thật, hãy lưu `duration` của mỗi lần chạy CI vào DB hoặc artifact và tính trên 2–4 tuần (module Observability ở Phase 3)."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Dùng thời gian trung bình làm mục tiêu.",
        "fix": "Dùng P95 hoặc P90 vì nó phản ánh trải nghiệm tệ mà người dùng nhớ."
      },
      {
        "wrong": "Đặt SLO nhưng không ai chịu trách nhiệm khi vi phạm.",
        "fix": "Gắn SLO với owner và hành động cụ thể (ví dụ: hết error budget thì đóng băng thêm E2E mới)."
      },
      {
        "wrong": "Coi test pass ở lần retry là xanh hoàn toàn.",
        "fix": "Test như vậy là `flaky`, phải được đếm và theo dõi riêng."
      }
    ],
    "exercise": {
      "task": "Viết hàm `p95(values: number[])` và 3 unit test cho nó. Sau đó đề xuất 3 SLO cho test suite của team bạn kèm lý do.",
      "hint": "Sắp xếp tăng dần, lấy phần tử tại vị trí `Math.ceil(0.95 * n) - 1`.",
      "solution": {
        "title": "lib/percentile.ts",
        "language": "ts",
        "code": "export function p95(values: number[]): number {\n  if (values.length === 0) throw new Error(\"empty\");\n  const sorted = [...values].sort((a, b) => a - b);\n  return sorted[Math.ceil(0.95 * sorted.length) - 1];\n}\n\n// p95([1..100]) === 95 ; p95([5]) === 5 ; p95([]) → throw"
      }
    },
    "checklist": [
      "Giải thích được vì sao dùng P95 thay vì trung bình",
      "Đọc được trạng thái `flaky` trong JSON report của Playwright",
      "Đề xuất được 3 SLO cho test suite kèm hành động khi vi phạm"
    ],
    "interviewTip": "\"Tôi quản lý test suite như một service: có SLO cho P95 thời gian pipeline và cho flaky rate, đo từ JSON report của mỗi lần CI. Vượt error budget thì team ưu tiên sửa độ ổn định trước khi thêm test mới.\"",
    "resources": [
      {
        "title": "Playwright — Reporters (JSON)",
        "url": "https://playwright.dev/docs/test-reporters#json-reporter",
        "kind": "docs"
      },
      {
        "title": "Google SRE Book — Service Level Objectives",
        "url": "https://sre.google/sre-book/service-level-objectives/",
        "kind": "article"
      }
    ]
  },
  {
    "topicId": "fixtures",
    "minutes": 40,
    "level": "Trung cấp",
    "why": "Fixtures là xương sống của mọi framework Playwright nghiêm túc. Chúng thay `beforeEach` lặp đi lặp lại bằng các khối dựng sẵn có vòng đời rõ ràng, tự dọn dẹp và an toàn khi chạy song song.",
    "explain": [
      "Bạn đã dùng fixture mà không để ý: `page`, `request`, `context` trong `async ({ page }) => {}` đều là **fixture có sẵn**. Playwright thấy test cần `page` thì tự tạo trang mới, đưa cho test, rồi đóng lại khi xong.",
      "`test.extend()` cho phép bạn **tự định nghĩa fixture**, ví dụ `user` (một tài khoản đã được tạo) hay `cartPage` (page object đã sẵn sàng). Một fixture gồm 3 phần: **setup** (trước `use`), **`await use(giá trị)`** (test chạy ở đây), **teardown** (sau `use`).",
      "Fixture chỉ được tạo khi test **thực sự cần** (lazy), và có thể phụ thuộc lẫn nhau: `cartPage` cần `user`, `user` cần `api`. Playwright tự sắp xếp thứ tự.",
      "**Scope**: mặc định là `test` (mỗi test một bản mới). `{ scope: 'worker' }` thì mỗi worker (tiến trình chạy song song) tạo một lần và dùng chung, phù hợp cho thứ đắt như tài khoản test hay kết nối DB. `{ auto: true }` thì chạy cho mọi test kể cả khi không khai báo, phù hợp cho việc như gom log."
    ],
    "analogy": "Fixture giống **mise en place** trong bếp: trước khi nấu, đầu bếp có sẵn hành đã thái và nước dùng đã nấu. Nấu xong có người dọn dẹp. Mỗi món (test) chỉ cần nói \"tôi cần hành\", không tự thái lại từ đầu.",
    "concepts": [
      {
        "term": "test.extend<T>()",
        "meaning": "Tạo phiên bản `test` mới có thêm fixture tự định nghĩa."
      },
      {
        "term": "use(value)",
        "meaning": "Trao giá trị cho test. Code sau `await use()` là phần teardown."
      },
      {
        "term": "scope: 'worker'",
        "meaning": "Tạo 1 lần cho mỗi worker process, dùng chung cho các test trong worker đó."
      },
      {
        "term": "auto: true",
        "meaning": "Fixture tự chạy cho mọi test, không cần khai báo trong tham số."
      },
      {
        "term": "testInfo",
        "meaning": "Tham số thứ 3 của fixture: thông tin test hiện tại (tên, workerIndex, đường dẫn output…)."
      }
    ],
    "examples": [
      {
        "title": "Từ beforeEach lặp lại → fixture",
        "code": {
          "title": "trước và sau khi dùng fixture",
          "language": "ts",
          "code": "// ❌ TRƯỚC: mỗi file lặp lại, quên dọn dẹp, khó tái sử dụng\ntest.beforeEach(async ({ page, request }) => {\n  const res = await request.post(\"/api/test/users\", { data: { role: \"buyer\" } });\n  const user = await res.json();\n  await page.goto(`/login?token=${user.token}`);\n});\n\n// ✅ SAU: fixtures/index.ts — viết 1 lần, dùng mọi nơi\nimport { test as base, expect } from \"@playwright/test\";\n\ntype User = { id: string; email: string; token: string };\n\nexport const test = base.extend<{ user: User; loggedInPage: import(\"@playwright/test\").Page }>({\n  user: async ({ request }, use) => {\n    // setup\n    const res = await request.post(\"/api/test/users\", { data: { role: \"buyer\" } });\n    const user = (await res.json()) as User;\n    await use(user);                                   // ← test chạy ở đây\n    await request.delete(`/api/test/users/${user.id}`); // teardown: luôn dọn dẹp\n  },\n\n  loggedInPage: async ({ page, user }, use) => {        // phụ thuộc fixture `user`\n    await page.goto(`/login?token=${user.token}`);\n    await use(page);\n  },\n});\nexport { expect };"
        }
      },
      {
        "title": "Test dùng fixture — ngắn gọn, chỉ còn nghiệp vụ",
        "code": {
          "title": "e2e/cart.spec.ts",
          "language": "ts",
          "code": "import { test, expect } from \"../fixtures\";\n\ntest(\"người mua thêm sản phẩm vào giỏ\", async ({ loggedInPage: page }) => {\n  await page.goto(\"/products/1\");\n  await page.getByRole(\"button\", { name: \"Thêm vào giỏ\" }).click();\n  await expect(page.getByTestId(\"cart-count\")).toHaveText(\"1\");\n});"
        },
        "notes": [
          "Test không biết gì về cách tạo user hay đăng nhập. Đổi cách đăng nhập thì chỉ sửa **1 chỗ**.",
          "Teardown chạy kể cả khi test fail, nên không còn dữ liệu rác."
        ]
      },
      {
        "title": "Worker-scoped fixture cho thứ đắt",
        "code": {
          "title": "fixtures/worker.ts",
          "language": "ts",
          "code": "import { test as base } from \"@playwright/test\";\n\ntype WorkerFixtures = { workerAccount: { email: string; password: string } };\n\n// Generic thứ 2 dành cho worker fixtures\nexport const test = base.extend<{}, WorkerFixtures>({\n  workerAccount: [\n    async ({}, use, workerInfo) => {\n      const email = `qa+w${workerInfo.workerIndex}@example.com`; // mỗi worker 1 tài khoản riêng\n      await createAccount(email);       // chạy 1 lần / worker\n      await use({ email, password: \"Test#1234\" });\n      await deleteAccount(email);\n    },\n    { scope: \"worker\" },\n  ],\n});"
        },
        "notes": [
          "Fixture `workerAccount` dùng tuple `[hàm, { scope: 'worker' }]`.",
          "Worker fixture **không được** phụ thuộc test fixture như `page`, vì nó sống lâu hơn từng test."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Nhồi mọi thứ vào `beforeEach` và biến toàn cục `let user;`.",
        "fix": "Dùng fixture: có kiểu dữ liệu, lazy, tự dọn dẹp, chạy song song an toàn."
      },
      {
        "wrong": "Quên teardown nên DB test đầy rác sau vài tuần.",
        "fix": "Đặt code dọn dẹp ngay sau `await use()` trong cùng fixture."
      },
      {
        "wrong": "Cho worker fixture dùng `page`.",
        "fix": "Worker fixture chỉ dùng worker fixture khác (`browser`, `playwright`…). Muốn có page thì tạo từ `browser.newPage()`."
      }
    ],
    "exercise": {
      "task": "Viết fixture `todoPage` cho app Todo: setup tạo 3 todo qua API, mở `/todos`, trả về `page`. Teardown xoá 3 todo đó. Viết 1 test dùng fixture kiểm tra có đúng 3 dòng.",
      "steps": [
        "Fixture phụ thuộc `request` và `page`.",
        "Lưu id các todo đã tạo để teardown xoá đúng.",
        "Test dùng `expect(page.getByRole('listitem')).toHaveCount(3)`."
      ],
      "hint": "Tạo song song bằng `await Promise.all([1,2,3].map(i => request.post('/api/todos', { data: { title: `Todo ${i}` } })))`.",
      "solution": {
        "title": "fixtures/todo.ts",
        "language": "ts",
        "code": "import { test as base, expect, type Page } from \"@playwright/test\";\n\nexport const test = base.extend<{ todoPage: Page }>({\n  todoPage: async ({ page, request }, use) => {\n    const responses = await Promise.all(\n      [1, 2, 3].map((i) => request.post(\"/api/todos\", { data: { title: `Todo ${i}` } })),\n    );\n    const ids = await Promise.all(responses.map(async (r) => (await r.json()).id as string));\n    await page.goto(\"/todos\");\n    await use(page);\n    await Promise.all(ids.map((id) => request.delete(`/api/todos/${id}`)));\n  },\n});\n\ntest(\"hiển thị 3 todo\", async ({ todoPage }) => {\n  await expect(todoPage.getByRole(\"listitem\")).toHaveCount(3);\n});"
      }
    },
    "checklist": [
      "Giải thích được 3 phần của fixture: setup, use, teardown",
      "Viết được fixture phụ thuộc fixture khác",
      "Phân biệt được scope test, worker và auto"
    ],
    "interviewTip": "\"Tôi thay beforeEach bằng fixture có kiểu dữ liệu. Fixture lazy, tự teardown kể cả khi test fail, và có scope rõ ràng. Thứ đắt như tài khoản test dùng worker scope, mỗi worker một bản để chạy song song an toàn. Nhờ vậy spec chỉ còn ngôn ngữ nghiệp vụ.\"",
    "resources": [
      {
        "title": "Playwright — Fixtures",
        "url": "https://playwright.dev/docs/test-fixtures",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "object-patterns",
    "minutes": 35,
    "level": "Trung cấp",
    "why": "Khi suite lên hàng trăm test, cách tổ chức code quyết định việc đổi UI mất 5 phút hay 5 ngày. Đây cũng là câu hỏi trade-off kinh điển trong phỏng vấn.",
    "explain": [
      "**Page Object Model (POM)**: mỗi trang có một class gom **locator** và **hành động nghiệp vụ** (`login(email, pass)`, `addToCart()`). Khi UI đổi, chỉ cần sửa class này thay vì sửa 50 test.",
      "**Component Object**: thay vì theo trang, đóng gói theo **thành phần dùng lại** như `DatePicker`, `DataTable`, `Modal`. Rất hợp với app dùng design system, vì một component xuất hiện ở nhiều trang.",
      "**Screenplay**: mô hình hướng **actor**. Người dùng (Actor) có khả năng (Abilities), thực hiện nhiệm vụ (Tasks), đặt câu hỏi (Questions). Rất biểu cảm cho domain phức tạp nhưng nhiều boilerplate, chỉ đáng khi team lớn.",
      "Nguyên tắc chung: object **mỏng**, không chứa `expect` (assertion để ở test), ưu tiên **composition** (page chứa component) thay vì kế thừa nhiều tầng."
    ],
    "analogy": "POM giống **điều khiển TV**: bạn bấm \"Tăng âm lượng\" mà không cần biết mạch điện bên trong. Nhà sản xuất đổi mạch (UI đổi) thì cái điều khiển vẫn dùng như cũ.",
    "concepts": [
      {
        "term": "Page Object",
        "meaning": "Class đại diện 1 trang: locator + hành động nghiệp vụ."
      },
      {
        "term": "Component Object",
        "meaning": "Class đại diện 1 thành phần UI dùng lại, nhận `root: Locator` để biết mình nằm ở đâu."
      },
      {
        "term": "Composition",
        "meaning": "Page chứa các component object, thay vì kế thừa `BasePage → AuthPage → CheckoutPage…`."
      },
      {
        "term": "Screenplay",
        "meaning": "Mô hình Actor / Task / Question. Biểu cảm nhưng tốn công dựng."
      }
    ],
    "examples": [
      {
        "title": "Component Object nhận root locator",
        "code": {
          "title": "pages/components/data-table.ts",
          "language": "ts",
          "code": "import type { Locator } from \"@playwright/test\";\n\nexport class DataTable {\n  constructor(private readonly root: Locator) {}\n\n  row(text: string) {\n    return this.root.getByRole(\"row\").filter({ hasText: text });\n  }\n\n  async sortBy(column: string) {\n    await this.root.getByRole(\"columnheader\", { name: column }).click();\n  }\n\n  columnValues(index: number) {\n    return this.root.getByRole(\"row\").locator(`td:nth-child(${index})`).allTextContents();\n  }\n}"
        }
      },
      {
        "title": "Page Object dùng composition",
        "code": {
          "title": "pages/orders.page.ts",
          "language": "ts",
          "code": "import type { Page } from \"@playwright/test\";\nimport { DataTable } from \"./components/data-table\";\n\nexport class OrdersPage {\n  readonly table: DataTable;\n\n  constructor(private readonly page: Page) {\n    this.table = new DataTable(page.getByRole(\"table\", { name: \"Danh sách đơn hàng\" }));\n  }\n\n  async goto() {\n    await this.page.goto(\"/admin/orders\");\n  }\n\n  async cancelOrder(orderId: string) {\n    await this.table.row(orderId).getByRole(\"button\", { name: \"Huỷ\" }).click();\n    await this.page.getByRole(\"dialog\").getByRole(\"button\", { name: \"Xác nhận\" }).click();\n  }\n}\n\n// e2e/orders.spec.ts — assertion nằm ở TEST, không nằm trong page object\ntest(\"admin huỷ đơn\", async ({ page }) => {\n  const orders = new OrdersPage(page);\n  await orders.goto();\n  await orders.cancelOrder(\"ORD-42\");\n  await expect(orders.table.row(\"ORD-42\")).toContainText(\"Đã huỷ\");\n});"
        },
        "notes": [
          "`DataTable` dùng lại cho mọi bảng trong app: đơn hàng, người dùng, sản phẩm.",
          "Page object trả về `Locator` để test tự assert. Không giấu `expect` bên trong."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "`BasePage` khổng lồ với 80 method generic, mọi page kế thừa 3–4 tầng.",
        "fix": "Ưu tiên composition: page chứa component object nhỏ, mỗi class một trách nhiệm."
      },
      {
        "wrong": "Đặt `expect` bên trong page object (`await loginPage.verifyLoggedIn()`).",
        "fix": "Page object trả về locator hoặc dữ liệu. Test là nơi khẳng định kết quả."
      },
      {
        "wrong": "Tạo page object cho mọi trang kể cả trang chỉ dùng trong 1 test.",
        "fix": "Chỉ trừu tượng hoá khi có lặp lại thật (quy tắc \"rule of three\")."
      }
    ],
    "exercise": {
      "task": "Viết Component Object `SearchBox` (ô tìm kiếm + danh sách gợi ý) với 2 method: `search(text)` và `pickSuggestion(text)`. Dùng nó trong `HeaderComponent`.",
      "hint": "`SearchBox` nhận `root: Locator`. Gợi ý thường có `role=\"option\"` bên trong `role=\"listbox\"`.",
      "solution": {
        "title": "pages/components/search-box.ts",
        "language": "ts",
        "code": "import type { Locator } from \"@playwright/test\";\n\nexport class SearchBox {\n  constructor(private readonly root: Locator) {}\n\n  async search(text: string) {\n    await this.root.getByRole(\"combobox\").fill(text);\n  }\n\n  async pickSuggestion(text: string) {\n    await this.root.getByRole(\"listbox\").getByRole(\"option\", { name: text }).click();\n  }\n}\n\nexport class HeaderComponent {\n  readonly search: SearchBox;\n  constructor(root: Locator) {\n    this.search = new SearchBox(root.getByRole(\"search\"));\n  }\n}"
      }
    },
    "checklist": [
      "So sánh được POM, Component Object và Screenplay kèm trade-off",
      "Viết được component object nhận `root: Locator`",
      "Giải thích được vì sao không đặt assertion trong page object"
    ],
    "interviewTip": "\"POM vẫn hữu ích nếu giữ mỏng. Tôi kết hợp fixtures cho vòng đời và component object cho các thành phần của design system, dùng composition thay vì kế thừa sâu. Screenplay tôi chỉ chọn khi domain có nhiều actor và team đủ lớn để gánh chi phí boilerplate.\"",
    "resources": [
      {
        "title": "Playwright — Page object models",
        "url": "https://playwright.dev/docs/pom",
        "kind": "docs"
      },
      {
        "title": "Martin Fowler — PageObject",
        "url": "https://martinfowler.com/bliki/PageObject.html",
        "kind": "article"
      }
    ]
  },
  {
    "topicId": "locators",
    "minutes": 30,
    "level": "Cơ bản",
    "why": "Locator kém là nguyên nhân số 1 khiến test vỡ khi UI đổi. Chọn đúng locator giúp test bền, dễ đọc, và kiểm tra luôn cả accessibility.",
    "explain": [
      "Playwright khuyến nghị tìm phần tử **như người dùng nhìn thấy**. Thứ tự ưu tiên: `getByRole` (vai trò + tên), `getByLabel` (form), `getByPlaceholder`, `getByText`, và cuối cùng là `getByTestId` khi không còn cách nào có nghĩa.",
      "**Tránh** CSS dài (`div > div:nth-child(3) .btn`) và XPath. Chúng phụ thuộc cấu trúc DOM, đổi một thẻ `div` là vỡ.",
      "Locator trong Playwright là **lazy** và **strict**: chỉ tìm khi cần dùng, và nếu khớp nhiều hơn một phần tử khi thao tác thì báo lỗi ngay, thay vì lặng lẽ click nhầm cái đầu tiên. Dùng `.filter({ hasText })` và chain (`.getByRole(...)` nối tiếp) để thu hẹp phạm vi."
    ],
    "analogy": "Chỉ đường bằng \"toà nhà màu xanh có biển Highlands\" (role + tên) thì bền hơn \"căn thứ 7 bên trái tính từ cột điện\" (XPath). Người ta sơn lại cột điện là cách chỉ thứ hai sai ngay.",
    "concepts": [
      {
        "term": "getByRole",
        "meaning": "Tìm theo vai trò ARIA (button, link, heading, textbox…) và accessible name."
      },
      {
        "term": "Strictness",
        "meaning": "Thao tác trên locator khớp > 1 phần tử thì lỗi, giúp tránh click nhầm."
      },
      {
        "term": "filter({ hasText })",
        "meaning": "Lọc tập phần tử theo nội dung hoặc phần tử con."
      },
      {
        "term": "testIdAttribute",
        "meaning": "Cấu hình tên thuộc tính test id (mặc định `data-testid`)."
      }
    ],
    "examples": [
      {
        "title": "Từ locator dễ vỡ sang locator bền",
        "code": {
          "title": "so sánh locator",
          "language": "ts",
          "code": "// ❌ Dễ vỡ: phụ thuộc cấu trúc DOM và class CSS\nawait page.locator(\"#app > div:nth-child(2) .product-card:nth-child(3) button.btn-primary\").click();\nawait page.locator(\"//div[@class='modal']//button[text()='OK']\").click();\n\n// ✅ Bền: tìm như người dùng\nawait page\n  .getByRole(\"listitem\")\n  .filter({ hasText: \"Bàn phím cơ K2\" })\n  .getByRole(\"button\", { name: \"Thêm vào giỏ\" })\n  .click();\n\nawait page.getByRole(\"dialog\").getByRole(\"button\", { name: \"OK\" }).click();\nawait page.getByLabel(\"Email\").fill(\"qa@example.com\");\n\n// Khi không có tên nghĩa (icon, biểu đồ) → test id có chủ đích\nawait expect(page.getByTestId(\"revenue-chart\")).toBeVisible();"
        },
        "notes": [
          "Nếu `getByRole` không tìm được nút, rất có thể nút **thiếu accessible name**. Đó là bug accessibility nên báo dev, đừng vội đổi sang CSS.",
          "Chạy `npx playwright codegen <url>` để Playwright gợi ý locator tốt nhất."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Dùng `.first()` hoặc `.nth(0)` để né lỗi strict mode.",
        "fix": "Thu hẹp phạm vi bằng `filter` hoặc chain từ container có nghĩa. `.first()` thường che giấu locator mơ hồ."
      },
      {
        "wrong": "Gắn `data-testid` cho mọi thứ.",
        "fix": "Test id là phương án cuối. Ưu tiên role và label để test gần người dùng và hỗ trợ a11y."
      },
      {
        "wrong": "Locator theo text tiếng Việt cứng trong app đa ngôn ngữ.",
        "fix": "Với app i18n: dùng role kèm key dịch, hoặc test id cho phần tử phụ thuộc ngôn ngữ."
      }
    ],
    "exercise": {
      "task": "Viết lại 3 locator sau theo chuẩn: (1) `page.locator('.header .nav a:nth-child(2)')` → link \"Sản phẩm\"; (2) `page.locator('input[name=pwd]')` → ô mật khẩu có label \"Mật khẩu\"; (3) nút \"Xoá\" trong dòng của user \"an@x.com\" trong bảng.",
      "solution": {
        "title": "đáp án",
        "language": "ts",
        "code": "page.getByRole(\"navigation\").getByRole(\"link\", { name: \"Sản phẩm\" });\npage.getByLabel(\"Mật khẩu\");\npage.getByRole(\"row\").filter({ hasText: \"an@x.com\" }).getByRole(\"button\", { name: \"Xoá\" });"
      }
    },
    "checklist": [
      "Nêu được thứ tự ưu tiên locator của Playwright",
      "Giải thích được strictness và cách thu hẹp phạm vi",
      "Biết khi nào dùng test id là hợp lý"
    ],
    "interviewTip": "\"Tôi ưu tiên getByRole và getByLabel vì chúng phản ánh cách người dùng và công nghệ hỗ trợ nhìn trang, đồng thời phát hiện luôn lỗi accessibility. Test id chỉ dùng cho phần tử không có tên nghĩa. Lint rule chặn XPath và CSS dài trong code review.\"",
    "resources": [
      {
        "title": "Playwright — Locators",
        "url": "https://playwright.dev/docs/locators",
        "kind": "docs"
      },
      {
        "title": "Playwright — Best Practices",
        "url": "https://playwright.dev/docs/best-practices",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "auth-state",
    "minutes": 30,
    "level": "Trung cấp",
    "why": "Đăng nhập qua UI trong mỗi test tốn 3–5 giây × hàng trăm test. `storageState` cho phép đăng nhập một lần rồi tái sử dụng, giúp suite nhanh hơn rõ rệt và bớt flaky.",
    "explain": [
      "Sau khi đăng nhập, trình duyệt giữ **cookies** và **localStorage**. Playwright lưu toàn bộ chúng vào một file JSON bằng `context.storageState({ path })`. Test sau chỉ cần nạp file đó là ở trạng thái đã đăng nhập.",
      "Cách làm chuẩn: tạo một **setup project** chạy trước (file `auth.setup.ts`) để đăng nhập và lưu state. Các project test khai báo `dependencies: ['setup']` và `use: { storageState: 'playwright/.auth/user.json' }`.",
      "Nhiều vai trò (admin, buyer): lưu nhiều file state, rồi chọn theo file test bằng `test.use({ storageState: ... })`. Nhớ thêm `playwright/.auth` vào `.gitignore` vì file chứa token phiên."
    ],
    "analogy": "Giống **thẻ ra vào toà nhà**: quẹt thẻ một lần ở cổng rồi đi lại tự do, thay vì mỗi lần vào phòng lại khai báo với bảo vệ.",
    "concepts": [
      {
        "term": "storageState",
        "meaning": "Ảnh chụp cookies + localStorage của một browser context, lưu ra JSON."
      },
      {
        "term": "Setup project",
        "meaning": "Project chạy trước các project khác (qua `dependencies`), dùng để chuẩn bị trạng thái."
      },
      {
        "term": "test.use()",
        "meaning": "Ghi đè option (như `storageState`) cho một file hoặc một `describe`."
      }
    ],
    "examples": [
      {
        "title": "Setup đăng nhập 1 lần cho mỗi vai trò",
        "code": {
          "title": "e2e/auth.setup.ts",
          "language": "ts",
          "code": "import { test as setup, expect } from \"@playwright/test\";\n\nconst roles = [\n  { name: \"buyer\", email: process.env.BUYER_EMAIL!, password: process.env.BUYER_PASSWORD! },\n  { name: \"admin\", email: process.env.ADMIN_EMAIL!, password: process.env.ADMIN_PASSWORD! },\n];\n\nfor (const role of roles) {\n  setup(`đăng nhập ${role.name}`, async ({ page }) => {\n    await page.goto(\"/login\");\n    await page.getByLabel(\"Email\").fill(role.email);\n    await page.getByLabel(\"Mật khẩu\").fill(role.password);\n    await page.getByRole(\"button\", { name: \"Đăng nhập\" }).click();\n    await expect(page.getByRole(\"button\", { name: \"Tài khoản\" })).toBeVisible();\n\n    await page.context().storageState({ path: `playwright/.auth/${role.name}.json` });\n  });\n}"
        }
      },
      {
        "title": "Cấu hình project + chọn vai trò theo file",
        "code": {
          "title": "playwright.config.ts + admin.spec.ts",
          "language": "ts",
          "code": "// playwright.config.ts\nimport { defineConfig, devices } from \"@playwright/test\";\n\nexport default defineConfig({\n  projects: [\n    { name: \"setup\", testMatch: /.*\\.setup\\.ts/ },\n    {\n      name: \"chromium\",\n      use: { ...devices[\"Desktop Chrome\"], storageState: \"playwright/.auth/buyer.json\" }, // mặc định\n      dependencies: [\"setup\"],\n    },\n  ],\n});\n\n// e2e/admin/orders.spec.ts — file này chạy với vai trò admin\nimport { test, expect } from \"@playwright/test\";\ntest.use({ storageState: \"playwright/.auth/admin.json\" });\n\ntest(\"admin thấy menu quản trị\", async ({ page }) => {\n  await page.goto(\"/admin\");\n  await expect(page.getByRole(\"navigation\", { name: \"Quản trị\" })).toBeVisible();\n});"
        },
        "notes": [
          "Thông tin đăng nhập lấy từ **biến môi trường** (GitHub Secrets trên CI), không bao giờ hard-code trong repo.",
          "Test kiểm tra **chính luồng đăng nhập** thì phải dùng `test.use({ storageState: { cookies: [], origins: [] } })` để bắt đầu ở trạng thái chưa đăng nhập."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Mọi test đều điền form đăng nhập.",
        "fix": "Đăng nhập 1 lần trong setup project rồi tái sử dụng `storageState`."
      },
      {
        "wrong": "Commit file `playwright/.auth/*.json` lên git.",
        "fix": "Thêm vào `.gitignore`. File chứa token phiên hợp lệ."
      },
      {
        "wrong": "Nhiều worker cùng sửa dữ liệu của một tài khoản dùng chung, gây xung đột.",
        "fix": "Test thay đổi dữ liệu tài khoản nên dùng tài khoản riêng theo worker (bài Worker isolation)."
      }
    ],
    "exercise": {
      "task": "Thêm setup project cho 2 vai trò vào một dự án Playwright, cấu hình mặc định là `buyer`, và viết 1 test riêng cho trang đăng nhập bắt đầu từ trạng thái chưa đăng nhập.",
      "hint": "Trạng thái rỗng: `test.use({ storageState: { cookies: [], origins: [] } })`.",
      "solution": {
        "title": "e2e/login.spec.ts",
        "language": "ts",
        "code": "import { test, expect } from \"@playwright/test\";\n\ntest.use({ storageState: { cookies: [], origins: [] } });\n\ntest(\"hiển thị lỗi khi sai mật khẩu\", async ({ page }) => {\n  await page.goto(\"/login\");\n  await page.getByLabel(\"Email\").fill(\"buyer@example.com\");\n  await page.getByLabel(\"Mật khẩu\").fill(\"sai-mat-khau\");\n  await page.getByRole(\"button\", { name: \"Đăng nhập\" }).click();\n  await expect(page.getByRole(\"alert\")).toContainText(\"không đúng\");\n});"
      }
    },
    "checklist": [
      "Giải thích được storageState lưu những gì",
      "Cấu hình được setup project với `dependencies`",
      "Chọn được vai trò theo file bằng `test.use`",
      "Biết cách test luồng đăng nhập từ trạng thái sạch"
    ],
    "interviewTip": "\"Tôi đăng nhập một lần cho mỗi vai trò trong setup project, lưu storageState rồi các project test phụ thuộc vào nó. Credential nằm trong secrets của CI, file state nằm trong gitignore. Riêng luồng đăng nhập thì có test riêng bắt đầu từ trạng thái rỗng.\"",
    "resources": [
      {
        "title": "Playwright — Authentication",
        "url": "https://playwright.dev/docs/auth",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "network-mocking",
    "minutes": 35,
    "level": "Trung cấp",
    "why": "Khó test lỗi 500, mạng chậm hay dữ liệu hiếm gặp nếu phụ thuộc backend thật. Network mocking cho bạn toàn quyền kiểm soát, nên test được mọi tình huống một cách ổn định.",
    "explain": [
      "`page.route(pattern, handler)` chặn mọi request khớp pattern. Trong handler bạn có thể: `route.fulfill()` (trả response giả), `route.abort()` (giả lập mất mạng), `route.continue()` (cho đi tiếp, có thể sửa header), hoặc `route.fetch()` (gọi server thật rồi **sửa** response trước khi trả về).",
      "**HAR** (HTTP Archive) là file ghi lại toàn bộ request/response. `page.routeFromHAR(file, { update: true })` sẽ **ghi** khi chạy lần đầu với backend thật. Các lần sau `update: false` sẽ **phát lại**. Cách này hữu ích cho trang gọi nhiều API, không phải mock tay từng cái.",
      "Cân bằng: mock giúp ổn định và test được edge case, nhưng mock quá nhiều thì E2E không còn chứng minh hệ thống thật chạy được. Giữ một số E2E đi qua backend thật cho critical journey, còn lại mock cho các trường hợp lỗi."
    ],
    "analogy": "Giống **diễn tập phòng cháy**: bạn không đốt toà nhà thật, mà giả lập tình huống để kiểm tra mọi người phản ứng đúng. Mock 500 là diễn tập \"server cháy\".",
    "concepts": [
      {
        "term": "route.fulfill",
        "meaning": "Trả response giả (status, headers, body/json)."
      },
      {
        "term": "route.fetch",
        "meaning": "Gọi request thật, nhận response để chỉnh sửa."
      },
      {
        "term": "route.abort",
        "meaning": "Huỷ request, giả lập mất mạng hoặc bị chặn."
      },
      {
        "term": "HAR",
        "meaning": "File ghi lại traffic HTTP. Ghi một lần, phát lại nhiều lần."
      }
    ],
    "examples": [
      {
        "title": "4 kỹ thuật mock thường dùng",
        "code": {
          "title": "e2e/products.spec.ts",
          "language": "ts",
          "code": "import { test, expect } from \"@playwright/test\";\n\ntest(\"hiển thị trạng thái rỗng\", async ({ page }) => {\n  await page.route(\"**/api/products*\", (route) => route.fulfill({ json: [] }));\n  await page.goto(\"/products\");\n  await expect(page.getByText(\"Chưa có sản phẩm nào\")).toBeVisible();\n});\n\ntest(\"hiển thị lỗi thân thiện khi server 500\", async ({ page }) => {\n  await page.route(\"**/api/products*\", (route) =>\n    route.fulfill({ status: 500, json: { error: \"internal\" } }),\n  );\n  await page.goto(\"/products\");\n  await expect(page.getByRole(\"alert\")).toContainText(\"Thử lại\");\n});\n\ntest(\"sửa một phần response thật\", async ({ page }) => {\n  await page.route(\"**/api/products*\", async (route) => {\n    const response = await route.fetch();          // gọi API thật\n    const json = await response.json();\n    json[0].name = \"Tên sản phẩm rất rất dài \".repeat(5); // edge case hiển thị\n    await route.fulfill({ response, json });\n  });\n  await page.goto(\"/products\");\n  await expect(page.getByRole(\"listitem\").first()).toBeVisible();\n});\n\ntest(\"mất mạng khi tải ảnh không làm vỡ trang\", async ({ page }) => {\n  await page.route(\"**/*.{png,jpg,webp}\", (route) => route.abort());\n  await page.goto(\"/products\");\n  await expect(page.getByRole(\"heading\", { name: \"Sản phẩm\" })).toBeVisible();\n});"
        },
        "notes": [
          "Gọi `page.route` **trước** `page.goto` để chặn được request ngay khi trang tải."
        ]
      },
      {
        "title": "Ghi và phát lại bằng HAR",
        "code": {
          "title": "e2e/dashboard.spec.ts",
          "language": "ts",
          "code": "test(\"dashboard với dữ liệu đã ghi\", async ({ page }) => {\n  // Lần đầu: chạy với UPDATE_HAR=1 để ghi từ backend thật\n  await page.routeFromHAR(\"e2e/hars/dashboard.har\", {\n    url: \"**/api/**\",\n    update: process.env.UPDATE_HAR === \"1\",\n  });\n  await page.goto(\"/dashboard\");\n  await expect(page.getByRole(\"heading\", { name: \"Tổng quan\" })).toBeVisible();\n});"
        }
      }
    ],
    "mistakes": [
      {
        "wrong": "Mock mọi API trong mọi E2E rồi tin rằng hệ thống chạy đúng.",
        "fix": "Giữ một tập critical journey chạy với backend thật. Mock dành cho edge case và lỗi."
      },
      {
        "wrong": "Gọi `page.route` sau `page.goto`.",
        "fix": "Đăng ký route trước khi điều hướng."
      },
      {
        "wrong": "File HAR cũ không còn khớp API mới, test xanh giả.",
        "fix": "Tạo lại HAR định kỳ và kết hợp contract test để phát hiện API đổi."
      }
    ],
    "exercise": {
      "task": "Viết test: khi API `/api/cart` phản hồi chậm 3 giây, trang hiển thị skeleton loading, sau đó hiện giỏ hàng.",
      "hint": "Trong handler: `await new Promise(r => setTimeout(r, 3000)); await route.continue();`. Kiểm tra skeleton bằng `getByTestId('cart-skeleton')` trước, rồi kiểm tra nội dung sau.",
      "solution": {
        "title": "e2e/cart-loading.spec.ts",
        "language": "ts",
        "code": "test(\"hiển thị loading khi API chậm\", async ({ page }) => {\n  await page.route(\"**/api/cart\", async (route) => {\n    await new Promise((r) => setTimeout(r, 3000));\n    await route.continue();\n  });\n  await page.goto(\"/cart\");\n  await expect(page.getByTestId(\"cart-skeleton\")).toBeVisible();\n  await expect(page.getByRole(\"heading\", { name: \"Giỏ hàng\" })).toBeVisible({ timeout: 10_000 });\n  await expect(page.getByTestId(\"cart-skeleton\")).toBeHidden();\n});"
      }
    },
    "checklist": [
      "Dùng được fulfill, fetch, abort và continue",
      "Ghi và phát lại được HAR",
      "Giải thích được trade-off mock nhiều và mock ít trong E2E"
    ],
    "interviewTip": "\"Tôi dùng page.route để kiểm soát các tình huống khó tái hiện như lỗi 500, dữ liệu rỗng hay mạng chậm. Critical journey vẫn chạy với backend thật để chứng minh tích hợp. Với trang gọi nhiều API, tôi ghi HAR một lần và phát lại, kết hợp contract test để HAR không bị lỗi thời.\"",
    "resources": [
      {
        "title": "Playwright — Mock APIs",
        "url": "https://playwright.dev/docs/mock",
        "kind": "docs"
      },
      {
        "title": "Playwright — Network",
        "url": "https://playwright.dev/docs/network",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "data-factory",
    "minutes": 30,
    "level": "Cơ bản",
    "why": "Phần lớn test flaky và chậm đến từ dữ liệu: dùng chung, tạo qua UI, hoặc phụ thuộc dữ liệu có sẵn trên môi trường. Data factory kết hợp API seeding giải quyết tận gốc.",
    "explain": [
      "**Factory** là hàm tạo dữ liệu test với **giá trị mặc định hợp lệ**. Bạn chỉ ghi đè những field quan trọng với test: `buildUser({ role: 'admin' })`. Test ngắn hơn và nói rõ điều gì quan trọng.",
      "**API seeding** nghĩa là tạo dữ liệu bằng cách gọi API (hoặc endpoint dành riêng cho test) thay vì click qua UI. Tạo đơn hàng qua UI mất 20 giây, qua API mất 200ms, và không bị ảnh hưởng khi UI đổi.",
      "Mỗi bản ghi nên có **giá trị duy nhất** (email, tên) để test chạy song song không đụng nhau. Cách đơn giản: thêm hậu tố ngẫu nhiên hoặc timestamp."
    ],
    "analogy": "Factory giống **khuôn bánh**: đổ vào là ra bánh chuẩn. Muốn bánh vị dâu thì chỉ thay nhân, không phải làm lại khuôn.",
    "concepts": [
      {
        "term": "Factory / Builder",
        "meaning": "Hàm trả về object hợp lệ mặc định, cho phép ghi đè từng phần."
      },
      {
        "term": "API seeding",
        "meaning": "Tạo dữ liệu qua API thay vì UI. Nhanh và ổn định."
      },
      {
        "term": "Unique data",
        "meaning": "Dữ liệu có định danh riêng cho mỗi test để chạy song song an toàn."
      },
      {
        "term": "Test-only endpoint",
        "meaning": "Endpoint chỉ bật ở môi trường test để seed hoặc dọn dữ liệu (phải tắt trên production)."
      }
    ],
    "examples": [
      {
        "title": "Factory với Partial overrides",
        "code": {
          "title": "e2e/data/factories.ts",
          "language": "ts",
          "code": "import { randomUUID } from \"node:crypto\";\n\nexport type NewUser = { email: string; name: string; role: \"buyer\" | \"admin\"; verified: boolean };\n\nconst uid = () => randomUUID().slice(0, 8);\n\nexport function buildUser(overrides: Partial<NewUser> = {}): NewUser {\n  return {\n    email: `qa+${uid()}@example.com`, // luôn duy nhất\n    name: \"QA User\",\n    role: \"buyer\",\n    verified: true,\n    ...overrides,\n  };\n}\n\nexport type NewProduct = { name: string; price: number; stock: number };\nexport const buildProduct = (o: Partial<NewProduct> = {}): NewProduct => ({\n  name: `Sản phẩm ${uid()}`,\n  price: 100_000,\n  stock: 10,\n  ...o,\n});"
        }
      },
      {
        "title": "Seed qua API trong test",
        "code": {
          "title": "e2e/out-of-stock.spec.ts",
          "language": "ts",
          "code": "import { test, expect } from \"@playwright/test\";\nimport { buildProduct } from \"./data/factories\";\n\ntest(\"sản phẩm hết hàng không thể thêm vào giỏ\", async ({ page, request }) => {\n  // Arrange — seed bằng API, chỉ nói điều quan trọng: stock = 0\n  const res = await request.post(\"/api/test/products\", { data: buildProduct({ stock: 0 }) });\n  const product = await res.json();\n\n  // Act\n  await page.goto(`/products/${product.id}`);\n\n  // Assert\n  await expect(page.getByRole(\"button\", { name: \"Thêm vào giỏ\" })).toBeDisabled();\n  await expect(page.getByText(\"Hết hàng\")).toBeVisible();\n});"
        },
        "notes": [
          "Người đọc test thấy ngay điều kiện quan trọng là `stock: 0`. Các field khác là \"mặc định hợp lệ\".",
          "Ghép factory với fixture (bài Fixtures) để tự dọn dữ liệu sau test."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Phụ thuộc dữ liệu có sẵn trên staging (\"sản phẩm id 5\").",
        "fix": "Mỗi test tự tạo dữ liệu nó cần."
      },
      {
        "wrong": "Tạo dữ liệu bằng cách click qua UI admin.",
        "fix": "Seed qua API. UI chỉ là đối tượng được test, không phải công cụ chuẩn bị dữ liệu."
      },
      {
        "wrong": "Email cố định `test@example.com` cho mọi test.",
        "fix": "Sinh giá trị duy nhất để chạy song song không đụng nhau."
      }
    ],
    "exercise": {
      "task": "Viết `buildOrder(overrides)` gồm `items` (mặc định 1 sản phẩm), `status` (mặc định `pending`), `coupon` (mặc định `null`). Dùng nó để seed một đơn `paid` có 3 sản phẩm.",
      "solution": {
        "title": "e2e/data/order.ts",
        "language": "ts",
        "code": "type Item = { sku: string; qty: number; price: number };\nexport type NewOrder = { items: Item[]; status: \"pending\" | \"paid\" | \"cancelled\"; coupon: string | null };\n\nexport const buildOrder = (o: Partial<NewOrder> = {}): NewOrder => ({\n  items: [{ sku: \"SKU-1\", qty: 1, price: 100_000 }],\n  status: \"pending\",\n  coupon: null,\n  ...o,\n});\n\n// Dùng:\nconst paid = buildOrder({\n  status: \"paid\",\n  items: [1, 2, 3].map((i) => ({ sku: `SKU-${i}`, qty: 1, price: 50_000 })),\n});"
      }
    },
    "checklist": [
      "Viết được factory với giá trị mặc định và overrides",
      "Seed dữ liệu qua API trong test",
      "Giải thích được vì sao dữ liệu duy nhất giúp chạy song song"
    ],
    "interviewTip": "\"Mỗi test tự tạo dữ liệu nó cần qua API, dùng factory có mặc định hợp lệ nên spec chỉ nêu điều quan trọng. Dữ liệu luôn có định danh duy nhất để chạy song song, và fixture lo việc dọn dẹp.\""
  },
  {
    "topicId": "worker-isolation",
    "minutes": 30,
    "level": "Trung cấp",
    "why": "Chạy song song là cách rẻ nhất để suite nhanh hơn, nhưng chỉ an toàn khi các worker không giẫm lên dữ liệu của nhau.",
    "explain": [
      "Playwright chạy test trong nhiều **worker** (tiến trình riêng) cùng lúc. Mỗi worker có `workerIndex` (tăng dần, có thể lớn hơn số worker vì worker có thể được khởi động lại) và `parallelIndex` (luôn trong khoảng 0 đến workers-1).",
      "**Isolation** nghĩa là mỗi worker (hoặc mỗi test) có vùng dữ liệu riêng: tài khoản riêng, tenant riêng, hoặc tiền tố riêng cho dữ liệu. Ví dụ worker 0 dùng `tenant-w0`, worker 1 dùng `tenant-w1`.",
      "Với `fullyParallel: true`, các test **trong cùng một file** cũng chạy song song. Vì vậy test không được dựa vào thứ tự chạy hay trạng thái do test trước để lại."
    ],
    "analogy": "Nhiều đầu bếp cùng nấu: mỗi người có **thớt và nồi riêng**. Nếu dùng chung một nồi, người này nêm muối thì món của người kia hỏng.",
    "concepts": [
      {
        "term": "Worker",
        "meaning": "Tiến trình chạy test. Số lượng cấu hình bằng `workers`."
      },
      {
        "term": "parallelIndex",
        "meaning": "Chỉ số ổn định 0..workers-1, phù hợp để gán tài nguyên cố định theo worker."
      },
      {
        "term": "fullyParallel",
        "meaning": "Cho phép các test trong cùng file chạy song song."
      },
      {
        "term": "Tenant isolation",
        "meaning": "Mỗi worker dùng một tenant hoặc workspace riêng trong hệ thống."
      }
    ],
    "examples": [
      {
        "title": "Tài khoản riêng cho mỗi worker",
        "code": {
          "title": "fixtures/isolated.ts",
          "language": "ts",
          "code": "import { test as base } from \"@playwright/test\";\n\ntype Account = { email: string; tenant: string };\n\nexport const test = base.extend<{}, { account: Account }>({\n  account: [\n    async ({}, use, workerInfo) => {\n      const tenant = `qa-tenant-${workerInfo.parallelIndex}`;\n      const email = `qa+p${workerInfo.parallelIndex}@example.com`;\n      await ensureTenant(tenant, email); // idempotent: có rồi thì reset dữ liệu\n      await use({ email, tenant });\n    },\n    { scope: \"worker\" },\n  ],\n});"
        },
        "notes": [
          "`ensureTenant` nên **idempotent** (chạy nhiều lần vẫn cho cùng kết quả), vì worker có thể khởi động lại sau khi một test fail."
        ]
      },
      {
        "title": "Cấu hình song song",
        "code": {
          "title": "playwright.config.ts (trích)",
          "language": "ts",
          "code": "export default defineConfig({\n  fullyParallel: true,\n  workers: process.env.CI ? 4 : undefined, // undefined = 1/2 số CPU\n  forbidOnly: !!process.env.CI,            // chặn quên test.only trên CI\n});"
        }
      }
    ],
    "mistakes": [
      {
        "wrong": "Test B dựa vào dữ liệu do test A tạo ra.",
        "fix": "Mỗi test độc lập, tự seed dữ liệu. Muốn chạy tuần tự thì dùng `test.describe.configure({ mode: 'serial' })` và ghi rõ lý do."
      },
      {
        "wrong": "Dùng `workerIndex` để đặt tên tài nguyên cố định.",
        "fix": "Dùng `parallelIndex` cho tài nguyên cố định theo slot. `workerIndex` tăng khi worker khởi động lại."
      },
      {
        "wrong": "Xoá toàn bộ bảng trong `beforeAll` làm hỏng worker khác.",
        "fix": "Chỉ dọn dữ liệu thuộc tenant hoặc tiền tố của chính mình."
      }
    ],
    "exercise": {
      "task": "Chạy suite của bạn với `--workers=1` rồi `--workers=4 --repeat-each=3`. Ghi lại test nào fail chỉ khi song song và tìm nguyên nhân dùng chung dữ liệu.",
      "hint": "Tìm test dùng email, tên hoặc id cố định, và test phụ thuộc thứ tự chạy.",
      "solutionNote": "Cách sửa thường gặp: chuyển sang dữ liệu duy nhất bằng factory, tài khoản theo `parallelIndex`, và bỏ phụ thuộc thứ tự giữa các test."
    },
    "checklist": [
      "Phân biệt được workerIndex và parallelIndex",
      "Viết được worker fixture cấp tài nguyên riêng",
      "Phát hiện được test phụ thuộc lẫn nhau bằng cách chạy song song kèm repeat"
    ],
    "interviewTip": "\"Song song là đòn bẩy rẻ nhất cho tốc độ, với điều kiện isolation tốt. Tôi gán mỗi worker một tenant hoặc tài khoản theo parallelIndex, dùng dữ liệu duy nhất cho từng test, và chạy định kỳ với repeat-each để phát hiện phụ thuộc ngầm.\"",
    "resources": [
      {
        "title": "Playwright — Parallelism",
        "url": "https://playwright.dev/docs/test-parallel",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "cleanup",
    "minutes": 30,
    "level": "Trung cấp",
    "why": "Dữ liệu rác tích tụ làm môi trường test chậm dần, gây trùng lặp và flaky khó hiểu. Chiến lược dọn dẹp là quyết định kiến trúc chứ không phải chi tiết nhỏ.",
    "explain": [
      "**Teardown trong fixture**: tạo gì thì xoá nấy ngay sau test. Chính xác nhất, nhưng nếu tiến trình bị kill giữa chừng thì teardown không chạy.",
      "**TTL / sweeper**: gắn nhãn dữ liệu test (tiền tố `qa+`, cột `created_by_test`, thời gian tạo) và có job định kỳ xoá dữ liệu cũ hơn N giờ. Đây là lưới an toàn cho trường hợp teardown bị bỏ sót.",
      "**Ephemeral DB**: mỗi lần chạy CI dùng một database mới (container Docker, hoặc branch database như Neon), xong thì vứt đi. Sạch tuyệt đối nhưng tốn thời gian khởi tạo. Playwright còn hỗ trợ **global teardown** bằng project `teardown` để dọn sau khi mọi test chạy xong."
    ],
    "analogy": "Dọn bếp có 3 kiểu: **rửa ngay sau khi nấu** (teardown), **thuê người dọn cuối ngày** (sweeper TTL), hoặc **dùng bếp mới mỗi lần** (ephemeral DB).",
    "concepts": [
      {
        "term": "Teardown",
        "meaning": "Code dọn dẹp chạy sau test (sau `await use()` trong fixture)."
      },
      {
        "term": "TTL sweeper",
        "meaning": "Job định kỳ xoá dữ liệu test quá hạn."
      },
      {
        "term": "Ephemeral environment",
        "meaning": "Môi trường hoặc DB tạo mới cho mỗi lần chạy và huỷ sau đó."
      },
      {
        "term": "Project teardown",
        "meaning": "Project Playwright chạy sau khi các project phụ thuộc chạy xong."
      }
    ],
    "examples": [
      {
        "title": "Global setup/teardown bằng project dependencies",
        "code": {
          "title": "playwright.config.ts + global.teardown.ts",
          "language": "ts",
          "code": "// playwright.config.ts\nexport default defineConfig({\n  projects: [\n    { name: \"seed\", testMatch: /global\\.setup\\.ts/, teardown: \"cleanup\" },\n    { name: \"cleanup\", testMatch: /global\\.teardown\\.ts/ },\n    { name: \"chromium\", use: { ...devices[\"Desktop Chrome\"] }, dependencies: [\"seed\"] },\n  ],\n});\n\n// e2e/global.teardown.ts\nimport { test as teardown } from \"@playwright/test\";\nteardown(\"xoá dữ liệu của lần chạy này\", async ({ request }) => {\n  await request.delete(`/api/test/runs/${process.env.TEST_RUN_ID}`);\n});"
        },
        "notes": [
          "Gắn mọi dữ liệu với `TEST_RUN_ID` (ví dụ `github.run_id`) để xoá theo lần chạy mà không ảnh hưởng lần chạy khác."
        ]
      },
      {
        "title": "Sweeper TTL — lưới an toàn",
        "code": {
          "title": "scripts/sweep-test-data.sql",
          "language": "sql",
          "code": "-- Chạy mỗi giờ (cron). Chỉ xoá dữ liệu có dấu hiệu là dữ liệu test VÀ đã cũ.\nDELETE FROM users\nWHERE email LIKE 'qa+%@example.com'\n  AND created_at < now() - interval '6 hours';"
        }
      }
    ],
    "mistakes": [
      {
        "wrong": "Không dọn gì cả, \"để môi trường test tự lo\".",
        "fix": "Ít nhất có teardown trong fixture cộng với sweeper TTL làm lưới an toàn."
      },
      {
        "wrong": "Sweeper xoá theo điều kiện quá rộng, xoá nhầm dữ liệu thật trên staging dùng chung.",
        "fix": "Điều kiện xoá phải kèm dấu hiệu rõ ràng (tiền tố, cờ test) và tuổi dữ liệu."
      },
      {
        "wrong": "Dùng ephemeral DB cho mọi PR dù khởi tạo mất 10 phút.",
        "fix": "Cân nhắc chi phí: dùng ephemeral cho nightly hoặc merge queue, PR dùng isolation theo tenant."
      }
    ],
    "exercise": {
      "task": "Viết một bảng so sánh 3 chiến lược (teardown, TTL, ephemeral DB) theo 4 tiêu chí: độ sạch, tốc độ, chi phí hạ tầng, độ phức tạp. Đề xuất kết hợp cho team 10 dev dùng staging chung.",
      "solutionNote": "Gợi ý: teardown trong fixture là mặc định, sweeper TTL 6 giờ làm lưới an toàn, ephemeral DB chỉ cho nightly regression đầy đủ. Lý do: staging dùng chung không thể reset liên tục."
    },
    "checklist": [
      "So sánh được 3 chiến lược dọn dẹp",
      "Cấu hình được global teardown bằng project",
      "Viết được điều kiện sweeper an toàn"
    ],
    "interviewTip": "\"Tôi kết hợp nhiều lớp: fixture teardown xoá đúng thứ đã tạo, mọi dữ liệu gắn run id để global teardown dọn theo lần chạy, và sweeper TTL làm lưới an toàn. Ephemeral DB dành cho nightly vì chi phí khởi tạo cao.\"",
    "resources": [
      {
        "title": "Playwright — Global setup and teardown",
        "url": "https://playwright.dev/docs/test-global-setup-teardown",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "ct-vs-vitest",
    "minutes": 35,
    "level": "Cơ bản",
    "why": "Phần lớn bug UI nằm ở logic của từng component. Test chúng ở tầng component nhanh hơn E2E 10–100 lần, nên bạn có thể viết nhiều test mà pipeline vẫn chạy nhanh.",
    "explain": [
      "**Component test** là render một component (một nút bấm, một form, một giỏ hàng) **riêng lẻ**, không cần chạy cả app hay đăng nhập. Sau đó tương tác như người dùng thật: bấm, gõ phím. Cuối cùng kiểm tra những gì hiển thị trên màn hình.",
      "Có 2 cách phổ biến với Next.js. **Vitest + Testing Library** render component vào `jsdom`, một trình duyệt giả lập chạy trong Node.js. Cách này rất nhanh (mili-giây) và gần giống Jest bạn đã quen. **Playwright Component Testing** (`@playwright/experimental-ct-react`) render component trong **trình duyệt thật** (Chromium/Firefox/WebKit). Cách này chậm hơn, nhưng CSS, layout và API trình duyệt đều là thật.",
      "Quy tắc chọn đơn giản: logic hiển thị, state, form validation, điều kiện ẩn/hiện thì dùng **Vitest + Testing Library**, chiếm khoảng 90% trường hợp. Còn cần trình duyệt thật (drag & drop, canvas, CSS quyết định hành vi, IntersectionObserver, kiểm tra visual) thì dùng **Playwright CT**.",
      "Cả hai đều có giới hạn: **async Server Components** chưa render được trong môi trường component test. Next.js khuyến nghị test chúng bằng E2E. Bài 2 sẽ học cách tách logic ra để vẫn unit test được phần lớn."
    ],
    "analogy": "Kiểm tra một chiếc xe: E2E giống lái thử cả xe trên đường. Component test giống đặt **riêng động cơ** lên bàn thử: nhanh, dễ tìm lỗi, không cần đổ xăng hay ra đường. jsdom là bàn thử mô phỏng, còn Playwright CT là bàn thử có **động cơ thật**.",
    "concepts": [
      {
        "term": "jsdom",
        "meaning": "Thư viện mô phỏng DOM trong Node.js. Không có layout thật nên `getBoundingClientRect()` luôn trả về 0."
      },
      {
        "term": "render()",
        "meaning": "Hàm của Testing Library: gắn component vào DOM giả để test."
      },
      {
        "term": "screen.getByRole",
        "meaning": "Tìm phần tử theo **vai trò** (button, heading, textbox) và **tên** người dùng nhìn thấy. Đây là cách tìm khuyến nghị."
      },
      {
        "term": "userEvent",
        "meaning": "Mô phỏng thao tác thật (click, gõ phím) đầy đủ chuỗi sự kiện, sát thực tế hơn `fireEvent`."
      },
      {
        "term": "mount (Playwright CT)",
        "meaning": "Fixture của Playwright CT: render component trong trình duyệt thật và trả về một `Locator`."
      }
    ],
    "examples": [
      {
        "title": "Component cần test: AddToCart",
        "intro": "Một Client Component đơn giản: bấm nút thì số lượng tăng, đạt tối đa thì nút bị vô hiệu hoá.",
        "code": {
          "title": "components/add-to-cart.tsx",
          "language": "ts",
          "code": "\"use client\";\nimport { useState } from \"react\";\n\nexport function AddToCart({ max = 3 }: { max?: number }) {\n  const [qty, setQty] = useState(0);\n  const reachedMax = qty >= max;\n\n  return (\n    <div>\n      <p>Trong giỏ: {qty}</p>\n      <button onClick={() => setQty((q) => q + 1)} disabled={reachedMax}>\n        Thêm vào giỏ\n      </button>\n      {reachedMax && <p role=\"alert\">Tối đa {max} sản phẩm</p>}\n    </div>\n  );\n}"
        }
      },
      {
        "title": "Test bằng Vitest + Testing Library",
        "intro": "Cài `vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom`, rồi viết test như dưới.",
        "code": {
          "title": "components/add-to-cart.test.tsx",
          "language": "ts",
          "code": "import { render, screen } from \"@testing-library/react\";\nimport userEvent from \"@testing-library/user-event\";\nimport { describe, expect, it } from \"vitest\";\nimport { AddToCart } from \"./add-to-cart\";\n\ndescribe(\"AddToCart\", () => {\n  it(\"tăng số lượng mỗi lần bấm\", async () => {\n    const user = userEvent.setup();\n    render(<AddToCart />);\n\n    await user.click(screen.getByRole(\"button\", { name: \"Thêm vào giỏ\" }));\n\n    expect(screen.getByText(\"Trong giỏ: 1\")).toBeInTheDocument();\n  });\n\n  it(\"khoá nút và báo lỗi khi đạt tối đa\", async () => {\n    const user = userEvent.setup();\n    render(<AddToCart max={2} />);\n    const button = screen.getByRole(\"button\", { name: \"Thêm vào giỏ\" });\n\n    await user.click(button);\n    await user.click(button);\n\n    expect(button).toBeDisabled();\n    expect(screen.getByRole(\"alert\")).toHaveTextContent(\"Tối đa 2 sản phẩm\");\n  });\n});"
        },
        "notes": [
          "Test **hành vi người dùng thấy** (chữ trên màn hình, nút bị khoá), không test state nội bộ như `qty`. Nhờ vậy refactor code thì test không gãy.",
          "`userEvent.setup()` được gọi trước `render`. Mọi thao tác của `user` đều phải có `await`.",
          "Cả 2 test chạy dưới 50ms. Viết 200 test kiểu này vẫn nhanh hơn 1 test E2E."
        ]
      },
      {
        "title": "Cấu hình Vitest cho Next.js",
        "code": {
          "title": "vitest.config.mts",
          "language": "ts",
          "code": "import { defineConfig } from \"vitest/config\";\nimport react from \"@vitejs/plugin-react\";\nimport { fileURLToPath } from \"node:url\";\n\nexport default defineConfig({\n  plugins: [react()],\n  test: {\n    environment: \"jsdom\",\n    setupFiles: [\"./vitest.setup.ts\"], // chứa: import \"@testing-library/jest-dom/vitest\";\n    include: [\"**/*.test.{ts,tsx}\"],\n  },\n  resolve: {\n    alias: { \"@\": fileURLToPath(new URL(\"./\", import.meta.url)) }, // khớp alias @/ của Next\n  },\n});"
        }
      },
      {
        "title": "Cùng component đó, test bằng Playwright CT (trình duyệt thật)",
        "intro": "Dùng khi hành vi phụ thuộc trình duyệt thật. Cú pháp gần giống Playwright E2E bạn sẽ học ở module sau.",
        "code": {
          "title": "components/add-to-cart.ct.spec.tsx",
          "language": "ts",
          "code": "import { test, expect } from \"@playwright/experimental-ct-react\";\nimport { AddToCart } from \"./add-to-cart\";\n\ntest(\"khoá nút khi đạt tối đa\", async ({ mount }) => {\n  const component = await mount(<AddToCart max={1} />);\n\n  await component.getByRole(\"button\", { name: \"Thêm vào giỏ\" }).click();\n\n  await expect(component.getByRole(\"button\")).toBeDisabled();\n  await expect(component.getByRole(\"alert\")).toBeVisible(); // visible \"thật\" (CSS, layout)\n});"
        },
        "notes": [
          "`toBeVisible()` trong trình duyệt thật kiểm tra cả CSS (`display:none`, `opacity`, kích thước). jsdom không làm được điều này.",
          "Playwright CT vẫn đang ở trạng thái **experimental**. Trong phỏng vấn nên nêu rõ trade-off này."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Tìm phần tử bằng class CSS: `container.querySelector('.btn-primary')`.",
        "fix": "Dùng `getByRole('button', { name: '…' })`. Đổi CSS không làm gãy test, và test kiểm tra luôn khả năng truy cập (accessibility)."
      },
      {
        "wrong": "Kiểm tra state nội bộ hoặc gọi trực tiếp hàm `setQty`.",
        "fix": "Chỉ kiểm tra thứ người dùng thấy và làm: chữ hiển thị, nút bị khoá, thông báo."
      },
      {
        "wrong": "Dùng component test để kiểm tra layout hay màu sắc trong jsdom.",
        "fix": "jsdom không có layout. Kiểm tra visual thì dùng Playwright CT hoặc E2E với screenshot."
      },
      {
        "wrong": "Cố render async Server Component bằng Vitest rồi gặp lỗi khó hiểu.",
        "fix": "Tách logic ra hàm thuần để unit test, phần còn lại để E2E (xem bài 2)."
      }
    ],
    "exercise": {
      "task": "Viết component `CouponInput`: ô nhập mã giảm giá và nút **Áp dụng**. Mã `SALE10` thì hiện \"Giảm 10%\", mã khác thì hiện \"Mã không hợp lệ\", ô trống thì nút bị khoá. Viết 3 test bằng Vitest + Testing Library.",
      "steps": [
        "Viết component với `useState` cho giá trị ô nhập và kết quả.",
        "Test 1: ô trống thì nút **Áp dụng** bị disabled.",
        "Test 2: gõ `SALE10`, bấm Áp dụng, thấy \"Giảm 10%\".",
        "Test 3: gõ `ABC`, bấm Áp dụng, thấy thông báo lỗi có `role=\"alert\"`."
      ],
      "hint": "Tìm ô nhập bằng `screen.getByRole('textbox', { name: 'Mã giảm giá' })`. Muốn vậy thì `<input>` cần có `<label>` hoặc `aria-label`. Gõ chữ bằng `await user.type(input, 'SALE10')`.",
      "solution": {
        "title": "coupon-input.test.tsx",
        "language": "ts",
        "code": "import { render, screen } from \"@testing-library/react\";\nimport userEvent from \"@testing-library/user-event\";\nimport { expect, it } from \"vitest\";\nimport { CouponInput } from \"./coupon-input\";\n\nit(\"khoá nút khi chưa nhập\", () => {\n  render(<CouponInput />);\n  expect(screen.getByRole(\"button\", { name: \"Áp dụng\" })).toBeDisabled();\n});\n\nit(\"áp dụng mã hợp lệ\", async () => {\n  const user = userEvent.setup();\n  render(<CouponInput />);\n  await user.type(screen.getByRole(\"textbox\", { name: \"Mã giảm giá\" }), \"SALE10\");\n  await user.click(screen.getByRole(\"button\", { name: \"Áp dụng\" }));\n  expect(screen.getByText(\"Giảm 10%\")).toBeInTheDocument();\n});\n\nit(\"báo lỗi mã sai\", async () => {\n  const user = userEvent.setup();\n  render(<CouponInput />);\n  await user.type(screen.getByRole(\"textbox\", { name: \"Mã giảm giá\" }), \"ABC\");\n  await user.click(screen.getByRole(\"button\", { name: \"Áp dụng\" }));\n  expect(screen.getByRole(\"alert\")).toHaveTextContent(\"Mã không hợp lệ\");\n});"
      }
    },
    "checklist": [
      "Giải thích được khác biệt giữa jsdom và trình duyệt thật, và khi nào chọn cái nào",
      "Viết được test với render + getByRole + userEvent mà không cần nhìn tài liệu",
      "Biết vì sao không nên kiểm tra state nội bộ của component",
      "Biết giới hạn của component test với async Server Components"
    ],
    "interviewTip": "\"Mặc định tôi dùng Vitest + Testing Library cho Client Component vì feedback dưới 1 giây. Playwright CT chỉ dùng khi hành vi phụ thuộc trình duyệt thật, như drag & drop hay CSS. Async Server Component thì tôi tách logic ra hàm thuần để unit test và giữ một vài E2E cho luồng chính, vì công cụ component test chưa hỗ trợ RSC async.\"",
    "resources": [
      {
        "title": "Next.js — Setting up Vitest",
        "url": "https://nextjs.org/docs/app/guides/testing/vitest",
        "kind": "docs"
      },
      {
        "title": "Testing Library — Queries (thứ tự ưu tiên)",
        "url": "https://testing-library.com/docs/queries/about/#priority",
        "kind": "docs"
      },
      {
        "title": "Playwright — Components (experimental)",
        "url": "https://playwright.dev/docs/test-components",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "rsc-server-actions",
    "minutes": 40,
    "level": "Trung cấp",
    "why": "App Router đưa phần lớn logic (lấy dữ liệu, ghi DB) lên server qua Server Components và Server Actions. Không biết cách test chúng thì bạn bỏ trống chính phần quan trọng nhất của app.",
    "explain": [
      "**Server Component** (mặc định trong App Router) chạy trên server, có thể là hàm `async` để `await` dữ liệu rồi trả về HTML. **Server Action** là hàm có `\"use server\"`, được gọi từ form hoặc nút bấm để ghi dữ liệu như tạo đơn hay cập nhật hồ sơ.",
      "Vấn đề: các công cụ component test (Vitest/jsdom, Playwright CT) **chưa render được async Server Component**. Vì vậy chiến lược là **tách lớp**: đưa logic ra hàm TypeScript thuần (lấy và biến đổi dữ liệu, validate), unit test kỹ các hàm đó. Component chỉ còn là lớp hiển thị mỏng.",
      "Server Action thực chất là **một hàm async nhận `FormData`**, nên có thể gọi thẳng trong Vitest. Chỉ cần mock các phần phụ thuộc framework như `revalidatePath`, `redirect` và lớp truy cập DB.",
      "Cuối cùng là một vài **E2E (Playwright)** chạy app thật, kiểm tra toàn bộ luồng: form gửi, action chạy, trang cập nhật. Đây là **integration layer** trong tên bài: mỗi tầng test đúng phần nó giỏi nhất."
    ],
    "analogy": "Nhà hàng: bếp (server) nấu, phục vụ (component) bưng món ra. Muốn kiểm tra món ăn thì **nếm từng món ngay trong bếp** (unit test hàm logic), không cần đợi bưng ra bàn. Thỉnh thoảng mới ngồi vào bàn gọi món như khách thật (E2E) để chắc cả quy trình chạy trơn.",
    "concepts": [
      {
        "term": "Server Component",
        "meaning": "Component render trên server. Có thể `async` và gọi DB trực tiếp. Không có state hay sự kiện click."
      },
      {
        "term": "Server Action",
        "meaning": "Hàm `\"use server\"`, nhận `FormData` hoặc tham số, chạy trên server khi người dùng submit form."
      },
      {
        "term": "Thin component",
        "meaning": "Component \"mỏng\": chỉ nhận dữ liệu đã xử lý và hiển thị. Logic nằm ở hàm thuần."
      },
      {
        "term": "vi.mock",
        "meaning": "Thay một module bằng bản giả trong Vitest, ví dụ `next/cache` hay lớp DB."
      }
    ],
    "examples": [
      {
        "title": "Tách logic khỏi async Server Component",
        "intro": "Thay vì nhồi lọc, sắp xếp, định dạng vào trong component, ta đưa chúng ra `lib/orders.ts`.",
        "code": {
          "title": "lib/orders.ts + app/orders/page.tsx",
          "language": "ts",
          "code": "// lib/orders.ts — hàm THUẦN, dễ unit test\nexport type Order = { id: string; total: number; status: \"pending\" | \"paid\" | \"cancelled\" };\n\nexport function summarizeOrders(orders: Order[]) {\n  const visible = orders.filter((o) => o.status !== \"cancelled\");\n  return {\n    count: visible.length,\n    revenue: visible.filter((o) => o.status === \"paid\").reduce((s, o) => s + o.total, 0),\n    latest: visible.slice(0, 5),\n  };\n}\n\n// app/orders/page.tsx — async Server Component MỎNG\nimport { db } from \"@/lib/db\";\nimport { summarizeOrders } from \"@/lib/orders\";\n\nexport default async function OrdersPage() {\n  const summary = summarizeOrders(await db.order.findMany({ orderBy: { createdAt: \"desc\" } }));\n  return (\n    <section>\n      <h1>Đơn hàng ({summary.count})</h1>\n      <p>Doanh thu: {summary.revenue.toLocaleString(\"vi-VN\")}đ</p>\n    </section>\n  );\n}"
        },
        "notes": [
          "Toàn bộ quy tắc nghiệp vụ (bỏ đơn huỷ, chỉ tính doanh thu đơn đã trả) giờ nằm trong `summarizeOrders` và test được trong vài mili-giây.",
          "Component chỉ còn: lấy dữ liệu, gọi hàm, hiển thị. Phần này để E2E kiểm tra."
        ]
      },
      {
        "title": "Unit test hàm logic",
        "code": {
          "title": "lib/orders.test.ts",
          "language": "ts",
          "code": "import { describe, expect, it } from \"vitest\";\nimport { summarizeOrders, type Order } from \"./orders\";\n\nconst order = (o: Partial<Order>): Order => ({ id: \"x\", total: 100, status: \"paid\", ...o });\n\ndescribe(\"summarizeOrders\", () => {\n  it(\"bỏ đơn đã huỷ khỏi số lượng và doanh thu\", () => {\n    const s = summarizeOrders([order({ total: 100 }), order({ total: 50, status: \"cancelled\" })]);\n    expect(s.count).toBe(1);\n    expect(s.revenue).toBe(100);\n  });\n\n  it(\"đơn pending được đếm nhưng chưa tính doanh thu\", () => {\n    const s = summarizeOrders([order({ status: \"pending\", total: 999 })]);\n    expect(s).toMatchObject({ count: 1, revenue: 0 });\n  });\n});"
        }
      },
      {
        "title": "Test Server Action bằng cách gọi trực tiếp",
        "intro": "Action dưới đây validate form, ghi DB rồi `revalidatePath`. Ta mock DB và `next/cache` rồi gọi action như một hàm bình thường.",
        "code": {
          "title": "app/profile/actions.ts + actions.test.ts",
          "language": "ts",
          "code": "// app/profile/actions.ts\n\"use server\";\nimport { revalidatePath } from \"next/cache\";\nimport { db } from \"@/lib/db\";\n\nexport async function updateName(formData: FormData) {\n  const name = String(formData.get(\"name\") ?? \"\").trim();\n  if (name.length < 2) return { ok: false as const, error: \"Tên cần ít nhất 2 ký tự\" };\n  await db.user.update({ where: { id: \"me\" }, data: { name } });\n  revalidatePath(\"/profile\");\n  return { ok: true as const };\n}\n\n// app/profile/actions.test.ts\nimport { beforeEach, expect, it, vi } from \"vitest\";\n\nvi.mock(\"next/cache\", () => ({ revalidatePath: vi.fn() }));\nvi.mock(\"@/lib/db\", () => ({ db: { user: { update: vi.fn() } } }));\n\nimport { revalidatePath } from \"next/cache\";\nimport { db } from \"@/lib/db\";\nimport { updateName } from \"./actions\";\n\nconst form = (name: string) => { const f = new FormData(); f.set(\"name\", name); return f; };\n\nbeforeEach(() => vi.clearAllMocks());\n\nit(\"từ chối tên quá ngắn và KHÔNG ghi DB\", async () => {\n  await expect(updateName(form(\"A\"))).resolves.toEqual({ ok: false, error: \"Tên cần ít nhất 2 ký tự\" });\n  expect(db.user.update).not.toHaveBeenCalled();\n});\n\nit(\"lưu tên hợp lệ và làm mới trang profile\", async () => {\n  await expect(updateName(form(\"  Bách  \"))).resolves.toEqual({ ok: true });\n  expect(db.user.update).toHaveBeenCalledWith({ where: { id: \"me\" }, data: { name: \"Bách\" } });\n  expect(revalidatePath).toHaveBeenCalledWith(\"/profile\");\n});"
        },
        "notes": [
          "`vi.mock` được hoisted (Vitest tự đưa lên đầu file) nên import phía dưới nhận bản mock.",
          "Test kiểm tra cả trường hợp **không** gọi DB khi dữ liệu sai. Đây là điểm người mới hay quên."
        ]
      },
      {
        "title": "Một E2E bao trọn luồng (Playwright)",
        "code": {
          "title": "e2e/profile.spec.ts",
          "language": "ts",
          "code": "import { test, expect } from \"@playwright/test\";\n\ntest(\"đổi tên hiển thị\", async ({ page }) => {\n  await page.goto(\"/profile\");\n  await page.getByLabel(\"Tên hiển thị\").fill(\"Bách QA\");\n  await page.getByRole(\"button\", { name: \"Lưu\" }).click();\n\n  // Server Action chạy → revalidatePath → trang hiển thị dữ liệu mới\n  await expect(page.getByRole(\"heading\", { name: \"Bách QA\" })).toBeVisible();\n});"
        }
      }
    ],
    "mistakes": [
      {
        "wrong": "Viết hàng chục E2E để kiểm tra mọi nhánh validation của form.",
        "fix": "Mỗi nhánh validation là một unit test cho Server Action. E2E chỉ cần luồng thành công và một luồng lỗi tiêu biểu."
      },
      {
        "wrong": "Để toàn bộ logic trong `page.tsx` rồi than \"Server Component không test được\".",
        "fix": "Tách logic ra `lib/*.ts`. Component mỏng thì gần như không có gì để test riêng."
      },
      {
        "wrong": "Mock quá sâu (mock cả hàm logic mình đang muốn test).",
        "fix": "Chỉ mock ranh giới bên ngoài: DB, `next/cache`, `next/navigation`, API bên thứ ba."
      }
    ],
    "exercise": {
      "task": "Viết Server Action `createTodo(formData)`: lấy `title`, nếu rỗng thì trả `{ ok: false, error }`, ngược lại gọi `db.todo.create` rồi `revalidatePath('/todos')`. Viết 2 unit test bằng Vitest.",
      "steps": [
        "Tạo `app/todos/actions.ts` với `\"use server\"`.",
        "Mock `next/cache` và `@/lib/db` bằng `vi.mock`.",
        "Test title rỗng: không gọi `db.todo.create`.",
        "Test title hợp lệ: gọi đúng tham số và `revalidatePath('/todos')`."
      ],
      "hint": "Tái sử dụng hàm `form()` tạo `FormData` như ví dụ 3. Nhớ `beforeEach(() => vi.clearAllMocks())` để các test không ảnh hưởng nhau.",
      "solutionNote": "Cấu trúc giống hệt ví dụ 3: đổi `updateName` thành `createTodo`, `db.user.update` thành `db.todo.create`, và kiểm tra `revalidatePath` được gọi với `'/todos'`."
    },
    "checklist": [
      "Giải thích được vì sao chưa thể render async Server Component trong Vitest",
      "Tách được logic khỏi Server Component sang hàm thuần",
      "Unit test được một Server Action có mock DB và `revalidatePath`",
      "Biết phân chia: logic thì unit test, luồng hoàn chỉnh thì E2E"
    ],
    "interviewTip": "\"Với App Router, tôi giữ Server Component mỏng: logic nằm ở hàm thuần và được unit test. Server Action được test như hàm async, mock DB và next/cache. E2E chỉ phủ các luồng quan trọng. Nhờ vậy độ phủ cao mà pipeline vẫn nhanh.\"",
    "resources": [
      {
        "title": "Next.js — Testing overview",
        "url": "https://nextjs.org/docs/app/guides/testing",
        "kind": "docs"
      },
      {
        "title": "Vitest — Mocking modules",
        "url": "https://vitest.dev/guide/mocking",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "contract-testing",
    "minutes": 45,
    "level": "Trung cấp",
    "why": "Frontend và backend thường do hai team khác nhau làm. Backend đổi tên một field là frontend vỡ ngay trên production. Contract test bắt lỗi này **từ lúc mở PR**, không cần dựng toàn bộ hệ thống.",
    "explain": [
      "**Contract** (hợp đồng) là thoả thuận giữa bên gọi API (**consumer**, ví dụ app Next.js) và bên cung cấp API (**provider**, ví dụ orders-api): request trông thế nào, response có những field gì, kiểu dữ liệu gì.",
      "Cách nhẹ nhất là **schema validation với Zod**: mô tả hình dạng response bằng một schema, rồi kiểm tra response thật có khớp không. Có thể dùng ngay trong app (validate lúc runtime) và trong API test của Playwright.",
      "Cách đầy đủ là **consumer-driven contract testing với Pact**. Consumer viết test mô tả \"tôi cần API trả như thế này\", Pact sinh ra một file contract (JSON). Provider chạy bước **verify** để kiểm tra API thật có đáp ứng đúng contract không. Nếu backend đổi field mà frontend đang dùng, bước verify **fail ngay trong pipeline của backend**.",
      "Chọn thế nào? Một team, ít service: dùng Zod là đủ. Nhiều team, nhiều microservice, deploy độc lập: dùng Pact (thường kèm Pact Broker để chia sẻ contract và kiểm tra `can-i-deploy`)."
    ],
    "analogy": "Ổ cắm và phích cắm điện: hai nhà sản xuất khác nhau nhưng cùng tuân theo **một tiêu chuẩn chân cắm**. Contract chính là tiêu chuẩn đó: bên nào đổi hình dạng chân cắm thì sẽ bị phát hiện trước khi bán ra thị trường.",
    "concepts": [
      {
        "term": "Consumer / Provider",
        "meaning": "Bên gọi API và bên cung cấp API."
      },
      {
        "term": "Schema (Zod)",
        "meaning": "Mô tả hình dạng dữ liệu bằng code. `schema.parse(data)` sẽ throw nếu dữ liệu sai."
      },
      {
        "term": "Pact file",
        "meaning": "File JSON sinh ra từ test của consumer, ghi lại các tương tác request/response mong đợi."
      },
      {
        "term": "Provider verification",
        "meaning": "Provider phát lại các request trong pact file vào API thật và so response với contract."
      },
      {
        "term": "Matchers (like, eachLike)",
        "meaning": "So khớp theo **kiểu** thay vì giá trị cụ thể, ví dụ `id` là số bất kỳ. Nhờ vậy contract không quá cứng."
      }
    ],
    "examples": [
      {
        "title": "Cách 1 — Zod: một schema dùng cho cả app và test",
        "code": {
          "title": "lib/schemas/order.ts",
          "language": "ts",
          "code": "import { z } from \"zod\";\n\nexport const OrderSchema = z.object({\n  id: z.number().int().positive(),\n  total: z.number().nonnegative(),\n  status: z.enum([\"pending\", \"paid\", \"cancelled\"]),\n  items: z.array(z.object({ sku: z.string(), qty: z.number().int().min(1) })),\n});\nexport type Order = z.infer<typeof OrderSchema>; // type TypeScript sinh từ schema\n\n// Dùng trong app: phát hiện API trả sai NGAY khi gọi, thay vì crash ở UI\nexport async function getOrder(baseUrl: string, id: number): Promise<Order> {\n  const res = await fetch(`${baseUrl}/orders/${id}`);\n  return OrderSchema.parse(await res.json());\n}"
        },
        "notes": [
          "`z.infer` giúp type TypeScript và validation runtime không bao giờ lệch nhau."
        ]
      },
      {
        "title": "Dùng chính schema đó trong API test của Playwright",
        "code": {
          "title": "e2e/api/orders.spec.ts",
          "language": "ts",
          "code": "import { test, expect } from \"@playwright/test\";\nimport { OrderSchema } from \"@/lib/schemas/order\";\n\ntest(\"GET /orders/:id trả đúng contract\", async ({ request }) => {\n  const res = await request.get(\"/api/orders/42\");\n  expect(res.ok()).toBeTruthy();\n\n  const result = OrderSchema.safeParse(await res.json());\n  // In ra lỗi Zod chi tiết nếu fail: field nào sai, sai kiểu gì\n  expect(result.success, result.success ? \"\" : result.error.message).toBe(true);\n});"
        },
        "notes": [
          "`safeParse` không throw mà trả về `{ success, error }`, giúp thông báo lỗi trong report dễ đọc hơn."
        ]
      },
      {
        "title": "Cách 2 — Pact: consumer test sinh contract",
        "intro": "Chạy ở repo frontend. Pact dựng một mock server; code thật của bạn (`getOrder`) gọi vào đó.",
        "code": {
          "title": "contracts/orders.consumer.pact.test.ts",
          "language": "ts",
          "code": "import { PactV3, MatchersV3 } from \"@pact-foundation/pact\";\nimport { expect, it } from \"vitest\";\nimport { getOrder } from \"@/lib/schemas/order\";\n\nconst { like, eachLike, integer } = MatchersV3;\nconst provider = new PactV3({ consumer: \"web-next\", provider: \"orders-api\" });\n\nit(\"lấy đơn hàng theo id\", async () => {\n  provider\n    .given(\"order 42 exists\")\n    .uponReceiving(\"a request for order 42\")\n    .withRequest({ method: \"GET\", path: \"/orders/42\" })\n    .willRespondWith({\n      status: 200,\n      headers: { \"Content-Type\": \"application/json\" },\n      body: {\n        id: integer(42),\n        total: like(199000),\n        status: like(\"paid\"),\n        items: eachLike({ sku: like(\"SKU-1\"), qty: integer(1) }),\n      },\n    });\n\n  await provider.executeTest(async (mockServer) => {\n    const order = await getOrder(mockServer.url, 42);\n    expect(order.id).toBe(42);\n  });\n  // → sinh file pacts/web-next-orders-api.json\n});"
        }
      },
      {
        "title": "Provider verify contract (chạy ở repo backend)",
        "code": {
          "title": "orders-api/test/pact.verify.test.ts",
          "language": "ts",
          "code": "import { Verifier } from \"@pact-foundation/pact\";\n\nit(\"orders-api đáp ứng contract của web-next\", async () => {\n  await new Verifier({\n    providerBaseUrl: \"http://localhost:4000\",\n    pactUrls: [\"../web-next/pacts/web-next-orders-api.json\"], // thực tế: lấy từ Pact Broker\n    stateHandlers: {\n      \"order 42 exists\": async () => {\n        await seedOrder({ id: 42, status: \"paid\" }); // chuẩn bị dữ liệu cho \"given\"\n      },\n    },\n  }).verifyProvider();\n});"
        },
        "notes": [
          "Nếu backend đổi `status` thành `state`, bước verify **fail** và PR của backend bị chặn trước khi làm vỡ frontend.",
          "`given(...)` bên consumer khớp với `stateHandlers` bên provider: đây là cách hai bên thống nhất dữ liệu đầu vào."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Contract ghi cứng giá trị (`total: 199000`) nên chỉ cần dữ liệu đổi là test fail.",
        "fix": "Dùng matcher (`like`, `integer`, `eachLike`) để so theo **kiểu dữ liệu**."
      },
      {
        "wrong": "Coi contract test là functional test (kiểm tra tính tiền có đúng không).",
        "fix": "Contract test chỉ kiểm tra **hình dạng giao tiếp**. Logic nghiệp vụ là việc của unit/integration test của provider."
      },
      {
        "wrong": "Định nghĩa type TypeScript và schema validation tách rời, lâu dần lệch nhau.",
        "fix": "Dùng `z.infer<typeof Schema>` để type sinh từ schema."
      }
    ],
    "exercise": {
      "task": "Viết `ProductSchema` bằng Zod cho API `GET /api/products` (trả về mảng sản phẩm `{ id, name, price, inStock }`). Viết một API test Playwright kiểm tra response đúng schema và có ít nhất 1 sản phẩm.",
      "steps": [
        "Định nghĩa `ProductSchema` rồi dùng `z.array(ProductSchema).min(1)`.",
        "Dùng fixture `request` của Playwright để gọi API.",
        "Kiểm tra bằng `safeParse`, in lỗi khi fail."
      ],
      "hint": "`price` nên là `z.number().nonnegative()`, `inStock` là `z.boolean()`.",
      "solution": {
        "title": "e2e/api/products.spec.ts",
        "language": "ts",
        "code": "import { test, expect } from \"@playwright/test\";\nimport { z } from \"zod\";\n\nconst ProductSchema = z.object({\n  id: z.number().int(),\n  name: z.string().min(1),\n  price: z.number().nonnegative(),\n  inStock: z.boolean(),\n});\n\ntest(\"GET /api/products đúng contract\", async ({ request }) => {\n  const res = await request.get(\"/api/products\");\n  expect(res.status()).toBe(200);\n\n  const parsed = z.array(ProductSchema).min(1).safeParse(await res.json());\n  expect(parsed.success, parsed.success ? \"\" : parsed.error.message).toBe(true);\n});"
      }
    },
    "checklist": [
      "Giải thích được consumer, provider và contract bằng lời của mình",
      "Viết được Zod schema và dùng nó trong API test",
      "Mô tả được luồng Pact: consumer test → pact file → provider verify",
      "Biết khi nào Zod là đủ và khi nào cần Pact"
    ],
    "interviewTip": "\"Tôi dùng Zod schema làm nguồn sự thật chung cho type và validation runtime, và tái sử dụng nó trong API test. Khi có nhiều team và service deploy độc lập, tôi chuyển sang consumer-driven contract với Pact. Bước provider verify chạy trong CI của backend, nên thay đổi phá vỡ API bị chặn ngay ở PR.\"",
    "resources": [
      {
        "title": "Pact Docs — Introduction",
        "url": "https://docs.pact.io/",
        "kind": "docs"
      },
      {
        "title": "Zod — Documentation",
        "url": "https://zod.dev/",
        "kind": "docs"
      },
      {
        "title": "Playwright — API testing",
        "url": "https://playwright.dev/docs/api-testing",
        "kind": "docs"
      }
    ]
  }
];
