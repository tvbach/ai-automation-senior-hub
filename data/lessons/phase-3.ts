/* Tự sinh từ nội dung bài học — chỉnh sửa trực tiếp tại đây cũng được. */
import type { Lesson } from "./types";

export const phase3Lessons: Lesson[] = [
  {
    "topicId": "gha-sharding",
    "minutes": 35,
    "level": "Trung cấp",
    "why": "Sharding là cách đơn giản nhất để chia suite lớn cho nhiều máy chạy song song. Từ 40 phút xuống còn 10 phút chỉ bằng vài dòng YAML.",
    "explain": [
      "**Workers** chạy song song trong **một máy**. **Shards** chia suite cho **nhiều máy**. `--shard=2/4` nghĩa là \"máy này chạy phần thứ 2 trong 4 phần\".",
      "GitHub Actions dùng **matrix** để tạo 4 job giống nhau, mỗi job một shard. Mỗi shard xuất **blob report**, rồi một job cuối tải tất cả về và **merge** thành một HTML report duy nhất.",
      "`fail-fast: false` rất quan trọng: shard 1 fail thì các shard khác vẫn chạy tiếp, để bạn thấy **toàn bộ** lỗi thay vì từng cái một."
    ],
    "analogy": "Chấm 400 bài thi: một giáo viên chấm mất cả ngày, **4 giáo viên mỗi người 100 bài** thì xong trong buổi sáng. Cuối cùng gom điểm vào một bảng chung (merge report).",
    "concepts": [
      {
        "term": "Shard",
        "meaning": "Một phần của suite chạy trên một máy riêng."
      },
      {
        "term": "Matrix",
        "meaning": "Cơ chế GitHub Actions tạo nhiều job từ danh sách giá trị."
      },
      {
        "term": "Blob report",
        "meaning": "Định dạng report trung gian của Playwright, dùng để merge."
      },
      {
        "term": "fail-fast",
        "meaning": "Mặc định huỷ job khác khi một job fail. Nên tắt cho test."
      }
    ],
    "examples": [
      {
        "title": "Workflow 4 shard + merge report",
        "code": {
          "title": ".github/workflows/e2e.yml",
          "language": "yaml",
          "code": "name: e2e\non: [pull_request]\n\nconcurrency:\n  group: e2e-${{ github.ref }}\n  cancel-in-progress: true   # push mới thì huỷ lần chạy cũ của cùng branch\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    timeout-minutes: 20\n    strategy:\n      fail-fast: false\n      matrix:\n        shard: [1, 2, 3, 4]\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with: { node-version: 22, cache: npm }\n      - run: npm ci\n      - run: npx playwright install --with-deps chromium\n      - run: npx playwright test --shard=${{ matrix.shard }}/4 --reporter=blob\n      - uses: actions/upload-artifact@v4\n        if: ${{ !cancelled() }}\n        with:\n          name: blob-${{ matrix.shard }}\n          path: blob-report\n          retention-days: 3\n\n  report:\n    needs: test\n    if: ${{ !cancelled() }}\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with: { node-version: 22, cache: npm }\n      - run: npm ci\n      - uses: actions/download-artifact@v4\n        with: { pattern: blob-*, path: all-blobs, merge-multiple: true }\n      - run: npx playwright merge-reports --reporter=html ./all-blobs\n      - uses: actions/upload-artifact@v4\n        with: { name: html-report, path: playwright-report, retention-days: 14 }"
        },
        "notes": [
          "`if: ${{ !cancelled() }}` đảm bảo vẫn upload report kể cả khi test fail. Đó chính là lúc cần report nhất.",
          "Playwright chia shard theo **file** (hoặc theo test nếu bật `fullyParallel`). Có một file rất dài thì shard sẽ lệch, nên hãy tách file lớn."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Để `fail-fast` mặc định (true).",
        "fix": "Đặt `fail-fast: false` để thấy toàn bộ lỗi trong một lần chạy."
      },
      {
        "wrong": "Mỗi shard upload HTML report riêng, phải mở 4 cái để xem.",
        "fix": "Dùng blob reporter rồi `merge-reports` thành 1 report."
      },
      {
        "wrong": "Tăng lên 20 shard dù suite chỉ 3 phút.",
        "fix": "Mỗi shard tốn thời gian setup (cài browser, npm ci). Có điểm tối ưu, hãy đo trước khi tăng."
      }
    ],
    "exercise": {
      "task": "Suite của bạn mất 32 phút trên 1 máy, mỗi job tốn 3 phút setup. Tính tổng thời gian chờ (wall time) và tổng phút runner với 2, 4, 8 shard. Chọn số shard hợp lý.",
      "solutionNote": "Wall time ≈ 3 + 32/n: 2 shard = 19', 4 shard = 11', 8 shard = 7'. Phút runner ≈ n×3 + 32: 38', 44', 56'. Thường chọn 4 shard: đạt mục tiêu dưới 10–12 phút với chi phí tăng vừa phải."
    },
    "checklist": [
      "Phân biệt được workers và shards",
      "Viết được workflow matrix + blob + merge-reports",
      "Tính được điểm tối ưu số shard theo chi phí setup"
    ],
    "interviewTip": "\"Tôi shard suite bằng matrix của GitHub Actions, fail-fast tắt, mỗi shard xuất blob report rồi merge thành một HTML report. Số shard được chọn dựa trên đo đạc, vì mỗi shard có chi phí setup cố định.\"",
    "resources": [
      {
        "title": "Playwright — Sharding",
        "url": "https://playwright.dev/docs/test-sharding",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "test-impact",
    "minutes": 35,
    "level": "Nâng cao",
    "why": "Khi suite lên hàng nghìn test, chạy hết cho mỗi PR là lãng phí. Test Impact Analysis chỉ chạy những test liên quan đến thay đổi mà vẫn an toàn.",
    "explain": [
      "**Test Impact Analysis (TIA)**: từ danh sách file thay đổi trong PR, xác định test nào bị ảnh hưởng và chỉ chạy những test đó. Cách đơn giản nhất là **mapping thủ công** theo thư mục hoặc tag (`src/checkout/**` ứng với `@checkout`).",
      "Playwright có sẵn `--only-changed`: chạy các file test thay đổi **hoặc import** file thay đổi (theo đồ thị import). Rất hợp cho component test hoặc test import trực tiếp code, nhưng E2E thường không import code app nên cần mapping.",
      "**Lưới an toàn** là bắt buộc: thay đổi ở file \"nguy hiểm\" (`package.json`, config, layout chung) thì chạy toàn bộ, và **merge queue/nightly luôn chạy full**. TIA giảm thời gian PR, không thay thế full run."
    ],
    "analogy": "Sửa ống nước phòng tắm thì kiểm tra **phòng tắm**, không cần kiểm tra cả hệ thống điện. Nhưng nếu sửa **đường ống chính** thì phải kiểm tra cả nhà.",
    "concepts": [
      {
        "term": "TIA",
        "meaning": "Chọn test chạy dựa trên thay đổi code."
      },
      {
        "term": "--only-changed",
        "meaning": "Cờ Playwright: chạy test file đã đổi hoặc phụ thuộc file đã đổi (so với ref git)."
      },
      {
        "term": "--grep",
        "meaning": "Lọc test theo tag hoặc tên, ví dụ `--grep @checkout`."
      },
      {
        "term": "Safety net",
        "meaning": "Quy tắc chạy full khi thay đổi rủi ro cao, cùng full run định kỳ."
      }
    ],
    "examples": [
      {
        "title": "Mapping thay đổi sang tag",
        "code": {
          "title": "scripts/select-tests.ts",
          "language": "ts",
          "code": "import { execSync } from \"node:child_process\";\n\nconst MAP: [RegExp, string][] = [\n  [/^src\\/(app|components)\\/checkout\\//, \"@checkout\"],\n  [/^src\\/(app|components)\\/(auth|login)\\//, \"@auth\"],\n  [/^src\\/(app|components)\\/search\\//, \"@search\"],\n];\nconst RUN_ALL = [/^package(-lock)?\\.json$/, /^playwright\\.config\\.ts$/, /^src\\/app\\/layout\\.tsx$/, /^src\\/lib\\//];\n\nconst changed = execSync(\"git diff --name-only origin/main...HEAD\", { encoding: \"utf8\" })\n  .split(\"\\n\").filter(Boolean);\n\nif (changed.some((f) => RUN_ALL.some((r) => r.test(f)))) {\n  console.log(\"\");                       // rỗng = chạy toàn bộ\n} else {\n  const tags = new Set(changed.flatMap((f) => MAP.filter(([r]) => r.test(f)).map(([, t]) => t)));\n  tags.add(\"@smoke\");                   // luôn chạy smoke\n  console.log([...tags].join(\"|\"));     // ví dụ \"@checkout|@smoke\"\n}"
        }
      },
      {
        "title": "Dùng trong workflow",
        "code": {
          "title": ".github/workflows/e2e.yml (trích)",
          "language": "yaml",
          "code": "- uses: actions/checkout@v4\n  with: { fetch-depth: 0 }           # cần lịch sử để git diff\n- id: select\n  run: echo \"grep=$(npx tsx scripts/select-tests.ts)\" >> \"$GITHUB_OUTPUT\"\n- run: npx playwright test ${{ steps.select.outputs.grep && format('--grep \"{0}\"', steps.select.outputs.grep) || '' }}"
        },
        "notes": [
          "Gắn tag trong tên test: `test('thanh toán thành công @checkout', ...)` hoặc dùng option `{ tag: '@checkout' }`."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Chỉ chạy test liên quan, không bao giờ chạy full.",
        "fix": "Merge queue hoặc nightly luôn chạy full để bắt phần TIA bỏ sót."
      },
      {
        "wrong": "Không có danh sách file \"chạy toàn bộ\".",
        "fix": "Config, dependency, layout và thư viện dùng chung phải kích hoạt full run."
      },
      {
        "wrong": "Checkout nông (`fetch-depth: 1`) nên `git diff` lỗi.",
        "fix": "Dùng `fetch-depth: 0` hoặc fetch nhánh base."
      }
    ],
    "exercise": {
      "task": "Viết unit test cho logic chọn tag: (1) chỉ đổi `src/app/checkout/page.tsx` thì ra `@checkout|@smoke`; (2) đổi `package.json` thì chạy toàn bộ; (3) đổi file README thì chỉ `@smoke`.",
      "hint": "Tách phần tính toán thành hàm thuần `selectTags(changed: string[])` để test không cần git.",
      "solutionNote": "Refactor: `export function selectTags(changed: string[]): string | ''`, còn script chính chỉ đọc git rồi gọi hàm này. Đây cũng là bài học \"tách logic để test\" từ Phase 1."
    },
    "checklist": [
      "Giải thích được TIA và lưới an toàn",
      "Biết khi nào `--only-changed` phù hợp và khi nào cần mapping",
      "Viết được script chọn test theo thay đổi"
    ],
    "interviewTip": "\"Ở PR tôi chạy smoke cộng với các test bị ảnh hưởng, xác định qua mapping thư mục sang tag và --only-changed cho test import code. Thay đổi rủi ro cao như config hay dependency thì chạy full, và merge queue luôn chạy full để bù phần TIA có thể bỏ sót.\"",
    "resources": [
      {
        "title": "Playwright — Command line (--only-changed)",
        "url": "https://playwright.dev/docs/test-cli",
        "kind": "docs"
      },
      {
        "title": "Playwright — Annotations & tags",
        "url": "https://playwright.dev/docs/test-annotations",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "preview-env",
    "minutes": 30,
    "level": "Trung cấp",
    "why": "Không có môi trường riêng cho mỗi PR thì E2E phải chờ merge vào staging, nhiều PR trộn lẫn và khó biết ai làm vỡ. Preview environment giải quyết điều đó.",
    "explain": [
      "**Ephemeral preview environment**: mỗi PR tự động có một bản deploy riêng với URL riêng, bị xoá khi PR đóng. Vercel làm sẵn cho frontend Next.js. Backend có thể dùng Docker Compose trên CI, hoặc nền tảng hỗ trợ preview.",
      "Thử thách lớn nhất là **dữ liệu**: preview dùng DB nào? Các lựa chọn: DB staging chung (nhanh nhưng dễ xung đột), **branch database** (Neon, PlanetScale tạo nhánh DB cho mỗi PR), hoặc DB container seed sẵn.",
      "Bài \"Shift-left\" ở Phase 1 đã viết workflow chạy E2E khi `deployment_status` thành công. Ở đây bạn nhìn ở góc kiến trúc: chi phí, dữ liệu, bảo mật (preview có thể bị lộ ra ngoài, nên bảo vệ bằng Vercel Authentication và bypass token cho CI)."
    ],
    "analogy": "Mỗi PR là một **căn hộ mẫu** riêng: khách (reviewer, QA, PM) vào xem đúng thiết kế của PR đó, không phải căn hộ chung đang bị nhiều đội sửa cùng lúc.",
    "concepts": [
      {
        "term": "Ephemeral environment",
        "meaning": "Môi trường tạm, tạo theo PR và huỷ khi xong."
      },
      {
        "term": "Branch database",
        "meaning": "Bản sao DB theo nhánh, tạo nhanh nhờ copy-on-write."
      },
      {
        "term": "Protection bypass",
        "meaning": "Token cho phép CI truy cập preview đang được bảo vệ đăng nhập."
      }
    ],
    "examples": [
      {
        "title": "Truy cập preview được bảo vệ từ Playwright",
        "code": {
          "title": "playwright.config.ts (trích)",
          "language": "ts",
          "code": "export default defineConfig({\n  use: {\n    baseURL: process.env.BASE_URL,\n    // Vercel: Protection Bypass for Automation — secret lưu trong GitHub Secrets\n    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET\n      ? {\n          \"x-vercel-protection-bypass\": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,\n          \"x-vercel-set-bypass-cookie\": \"true\",\n        }\n      : undefined,\n  },\n});"
        }
      },
      {
        "title": "Backend tạm trên CI bằng Docker Compose",
        "code": {
          "title": ".github/workflows/e2e-fullstack.yml (trích)",
          "language": "yaml",
          "code": "services:\n  postgres:\n    image: postgres:16\n    env:\n      POSTGRES_PASSWORD: postgres\n    ports: [\"5432:5432\"]\n    options: >-\n      --health-cmd \"pg_isready -U postgres\"\n      --health-interval 5s --health-timeout 5s --health-retries 10\nsteps:\n  - uses: actions/checkout@v4\n  - run: npm ci && npm run db:migrate && npm run db:seed\n    env:\n      DATABASE_URL: postgres://postgres:postgres@localhost:5432/postgres\n  - run: npx playwright test   # webServer trong config tự khởi động app"
        },
        "notes": [
          "Đoạn `services` nằm trong một job. Mỗi lần chạy có DB sạch, seed cố định, nên dữ liệu ổn định tuyệt đối."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Mọi preview cùng ghi vào DB staging, dữ liệu PR này phá PR kia.",
        "fix": "Dùng branch DB, DB container, hoặc ít nhất tenant riêng theo PR."
      },
      {
        "wrong": "Tắt bảo vệ preview cho tiện test.",
        "fix": "Giữ bảo vệ và dùng bypass token cho CI."
      },
      {
        "wrong": "Quên dọn môi trường khi PR đóng nên chi phí tăng dần.",
        "fix": "Tự động huỷ khi PR đóng (Vercel làm sẵn; hạ tầng tự dựng cần job `pull_request: closed`)."
      }
    ],
    "exercise": {
      "task": "Vẽ (bằng chữ hoặc sơ đồ) kiến trúc preview cho app Next.js + API Node + Postgres: cái gì được tạo khi mở PR, dữ liệu lấy từ đâu, E2E chạy khi nào, dọn dẹp ra sao.",
      "solutionNote": "Ví dụ: mở PR thì Vercel deploy frontend, workflow tạo branch DB (Neon) từ seed và deploy API preview trỏ vào branch DB, `deployment_status` success thì chạy E2E. Đóng PR thì job xoá branch DB và API preview."
    },
    "checklist": [
      "Giải thích được lợi ích của preview environment",
      "So sánh được 3 cách xử lý dữ liệu cho preview",
      "Cấu hình được bypass cho preview được bảo vệ"
    ],
    "interviewTip": "\"Mỗi PR có môi trường preview với dữ liệu tách biệt bằng branch database hoặc DB container seed sẵn. E2E chạy khi deploy thành công, dùng bypass token để vào preview được bảo vệ. Khi PR đóng thì mọi thứ được dọn tự động để kiểm soát chi phí.\"",
    "resources": [
      {
        "title": "Vercel — Protection Bypass for Automation",
        "url": "https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "ci-caching",
    "minutes": 25,
    "level": "Cơ bản",
    "why": "Thường 30–40% thời gian pipeline là cài đặt chứ không phải chạy test. Cache đúng cách là cải thiện rẻ nhất.",
    "explain": [
      "Ba thứ nên cache: **node_modules / npm cache** (`actions/setup-node` với `cache: npm`), **trình duyệt Playwright** (thư mục `~/.cache/ms-playwright`, khoá theo phiên bản Playwright), và **Docker layers** nếu build image.",
      "**Cache key** quyết định khi nào dùng lại cache: thường là hash của `package-lock.json`. Lock file đổi thì cache mới được tạo.",
      "Với trình duyệt: cache hit thì vẫn cần `npx playwright install-deps` để cài thư viện hệ thống (không nằm trong cache). Cách khác là dùng **Docker image chính thức của Playwright**, có sẵn mọi thứ."
    ],
    "analogy": "Mỗi sáng nấu phở mà **ninh xương lại từ đầu** thì mất 8 tiếng. Cache là **giữ nồi nước dùng** từ hôm qua: chỉ ninh lại khi đổi công thức (lock file đổi).",
    "concepts": [
      {
        "term": "Cache key",
        "meaning": "Chuỗi định danh cache, thường chứa hash lock file."
      },
      {
        "term": "Cache hit/miss",
        "meaning": "Có hoặc không tìm thấy cache khớp key."
      },
      {
        "term": "Playwright Docker image",
        "meaning": "`mcr.microsoft.com/playwright` có sẵn browser và thư viện hệ thống."
      }
    ],
    "examples": [
      {
        "title": "Cache npm + trình duyệt Playwright",
        "code": {
          "title": ".github/workflows/e2e.yml (trích)",
          "language": "yaml",
          "code": "- uses: actions/setup-node@v4\n  with: { node-version: 22, cache: npm }      # cache ~/.npm theo package-lock.json\n- run: npm ci\n\n- id: pw-version\n  run: echo \"v=$(node -p \"require('@playwright/test/package.json').version\")\" >> \"$GITHUB_OUTPUT\"\n\n- uses: actions/cache@v4\n  id: pw-cache\n  with:\n    path: ~/.cache/ms-playwright\n    key: pw-${{ runner.os }}-${{ steps.pw-version.outputs.v }}\n\n- if: steps.pw-cache.outputs.cache-hit != 'true'\n  run: npx playwright install --with-deps chromium\n- if: steps.pw-cache.outputs.cache-hit == 'true'\n  run: npx playwright install-deps chromium   # thư viện hệ thống không nằm trong cache"
        }
      },
      {
        "title": "Cách khác: chạy trong container chính thức",
        "code": {
          "title": ".github/workflows/e2e.yml (trích)",
          "language": "yaml",
          "code": "jobs:\n  test:\n    runs-on: ubuntu-latest\n    container:\n      image: mcr.microsoft.com/playwright:v1.56.0-noble   # khớp đúng version @playwright/test\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - run: npx playwright test"
        },
        "notes": [
          "Tag image phải khớp **đúng** phiên bản `@playwright/test` trong lock file, nếu không sẽ lỗi thiếu browser.",
          "Container cũng giúp screenshot ổn định (cùng font, cùng OS) cho visual test."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Cache `node_modules` rồi chạy `npm install` (không phải `npm ci`).",
        "fix": "Dùng `npm ci` để cài đúng lock file. Cache thư mục npm cache thay vì node_modules."
      },
      {
        "wrong": "Cache key không chứa phiên bản Playwright nên dùng browser cũ.",
        "fix": "Đưa version vào key."
      },
      {
        "wrong": "Tối ưu cache mà không đo trước.",
        "fix": "Xem thời gian từng step trong log Actions và tối ưu step chậm nhất trước."
      }
    ],
    "exercise": {
      "task": "Mở log 3 lần chạy CI gần nhất trong một repo của bạn, ghi lại thời gian từng step, và xác định 2 step đáng cache nhất. Ước tính thời gian tiết kiệm được.",
      "solutionNote": "Thường thấy: `playwright install --with-deps` 60–90 giây và `npm ci` 30–60 giây. Cache cả hai thường tiết kiệm 1–2 phút mỗi job, nhân với số shard và số lần chạy mỗi ngày."
    },
    "checklist": [
      "Cache được npm và trình duyệt Playwright với key đúng",
      "Biết vì sao vẫn cần `install-deps` khi cache hit",
      "Biết khi nào nên dùng Docker image chính thức"
    ],
    "interviewTip": "\"Tôi đo thời gian từng step trước. Thường cache npm theo lock file và cache browser theo version Playwright tiết kiệm 1–2 phút mỗi job. Khi cần môi trường ổn định cho visual test, tôi chạy trong image Playwright chính thức đúng version.\"",
    "resources": [
      {
        "title": "Playwright — CI (GitHub Actions)",
        "url": "https://playwright.dev/docs/ci",
        "kind": "docs"
      },
      {
        "title": "GitHub — Caching dependencies",
        "url": "https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/caching-dependencies-to-speed-up-workflows",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "gate-rules",
    "minutes": 30,
    "level": "Trung cấp",
    "why": "Gate quá chặt thì team tìm cách bypass, quá lỏng thì vô nghĩa. Thiết kế mức độ cho từng gate là kỹ năng quản trị chất lượng ở tầm Senior.",
    "explain": [
      "**Quality gate** là điều kiện tự động quyết định PR được merge hay không. Mỗi gate nên có **mức độ**: **block** (chặn merge), **warn** (cảnh báo trong PR comment, không chặn), **info** (chỉ ghi nhận để theo dõi xu hướng).",
      "Ví dụ block: test critical fail, typecheck lỗi, lỗ hổng bảo mật mức high, **coverage của dòng code mới** dưới ngưỡng. Warn: bundle size tăng nhẹ, test quarantine fail, visual diff cần review. Info: thời gian pipeline, xu hướng flaky.",
      "Mọi gate cần **owner** và cơ chế **override có ghi lại** (ví dụ label `qa-override` kèm lý do). Định kỳ xem lại: gate nào chặn sai nhiều thì sửa hoặc hạ mức."
    ],
    "analogy": "Giống **đèn giao thông**: đỏ thì phải dừng (block), vàng là cảnh báo (warn), bảng thông tin là biết thôi (info). Đèn đỏ bật suốt vô lý thì người ta sẽ vượt.",
    "concepts": [
      {
        "term": "Block / Warn / Info",
        "meaning": "Ba mức độ tác động của gate."
      },
      {
        "term": "Diff coverage",
        "meaning": "Coverage chỉ tính trên các dòng thay đổi trong PR."
      },
      {
        "term": "Override",
        "meaning": "Cơ chế vượt gate có kiểm soát và ghi lại lý do."
      },
      {
        "term": "Required status check",
        "meaning": "Check bắt buộc trong Branch protection của GitHub."
      }
    ],
    "examples": [
      {
        "title": "Gate engine đơn giản đọc kết quả và quyết định",
        "code": {
          "title": "scripts/quality-gate.ts",
          "language": "ts",
          "code": "type Level = \"block\" | \"warn\" | \"info\";\ntype Rule = { id: string; level: Level; check: (m: Metrics) => string | null };\ntype Metrics = { criticalFailed: number; diffCoverage: number; highVulns: number; bundleDeltaKb: number; flakyRate: number };\n\nconst RULES: Rule[] = [\n  { id: \"critical-tests\", level: \"block\", check: (m) => (m.criticalFailed > 0 ? `${m.criticalFailed} test @critical fail` : null) },\n  { id: \"diff-coverage\",  level: \"block\", check: (m) => (m.diffCoverage < 0.8 ? `Diff coverage ${(m.diffCoverage * 100).toFixed(0)}% < 80%` : null) },\n  { id: \"security\",       level: \"block\", check: (m) => (m.highVulns > 0 ? `${m.highVulns} lỗ hổng mức high` : null) },\n  { id: \"bundle-size\",    level: \"warn\",  check: (m) => (m.bundleDeltaKb > 20 ? `Bundle +${m.bundleDeltaKb}KB` : null) },\n  { id: \"flaky-trend\",    level: \"info\",  check: (m) => (m.flakyRate > 0.01 ? `Flaky rate ${(m.flakyRate * 100).toFixed(1)}%` : null) },\n];\n\nexport function evaluate(m: Metrics, overrides: string[] = []) {\n  const findings = RULES.map((r) => ({ ...r, message: r.check(m) })).filter((f) => f.message);\n  const blocking = findings.filter((f) => f.level === \"block\" && !overrides.includes(f.id));\n  return { pass: blocking.length === 0, findings };\n}"
        },
        "notes": [
          "`overrides` lấy từ label của PR (ví dụ `override:bundle-size`) và mọi override được log lại để review.",
          "Kết quả `findings` được render thành PR comment: block ở đầu, warn ở giữa, info thu gọn."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Ép coverage tổng ≥ 80% cho mọi PR.",
        "fix": "Dùng diff coverage: công bằng với code cũ và tập trung vào code mới."
      },
      {
        "wrong": "Mọi gate đều block.",
        "fix": "Phân mức. Chỉ block thứ thật sự nguy hiểm và có tín hiệu ổn định."
      },
      {
        "wrong": "Không có cách override nên khi khẩn cấp, admin tắt hẳn branch protection.",
        "fix": "Có override hợp lệ, ghi lại lý do và người chịu trách nhiệm."
      }
    ],
    "exercise": {
      "task": "Thêm rule `a11y` mức warn: cảnh báo khi số vi phạm accessibility (từ axe) tăng so với nhánh main. Viết unit test cho `evaluate` với 3 tình huống: pass, block, block nhưng có override.",
      "solutionNote": "Thêm `a11yDelta` vào `Metrics`, rule `{ id: 'a11y', level: 'warn', check: m => m.a11yDelta > 0 ? `+${m.a11yDelta} vi phạm a11y` : null }`. Test override bằng cách truyền `['diff-coverage']`."
    },
    "checklist": [
      "Phân loại được gate theo block, warn và info",
      "Giải thích được diff coverage",
      "Thiết kế được cơ chế override có kiểm soát"
    ],
    "interviewTip": "\"Gate tốt phải chặn đúng rủi ro và có tín hiệu ổn định, nếu không team sẽ bypass. Tôi chia ba mức block, warn, info. Block chỉ dành cho test critical, diff coverage và lỗ hổng mức high. Mỗi gate có owner, override có ghi lại, và được review định kỳ.\""
  },
  {
    "topicId": "flaky-budget",
    "minutes": 35,
    "level": "Trung cấp",
    "why": "Flaky test làm team mất niềm tin vào pipeline và bấm re-run vô tội vạ. Quarantine có owner và SLA là cách xử lý có hệ thống, được hỏi rất nhiều trong phỏng vấn.",
    "explain": [
      "**Flaky test** là test cùng code nhưng lúc pass lúc fail. Cách phát hiện chắc chắn nhất: test **fail rồi pass khi retry** trong cùng lần chạy (Playwright đánh dấu `flaky`), hoặc **đổi kết quả trên cùng commit** giữa các lần chạy.",
      "**Quarantine**: test vượt ngưỡng flaky được chuyển sang nhóm **không chặn merge** (vẫn chạy để thu dữ liệu), kèm **issue, owner và SLA** (ví dụ sửa trong 7 ngày). Quá SLA thì escalate hoặc xoá test.",
      "**Flaky budget**: tổng flaky rate của suite không được vượt X% (ví dụ 1%). Test mới phải chạy nhiều lần (ví dụ `--repeat-each=20`) xanh hết mới được vào suite chính."
    ],
    "analogy": "Giống **chuông báo cháy hay kêu nhầm**: kêu nhầm nhiều thì không ai sơ tán nữa. Phải tháo ra sửa (quarantine), có người chịu trách nhiệm sửa trong thời hạn, không để chuông hỏng mãi.",
    "concepts": [
      {
        "term": "Flaky",
        "meaning": "Kết quả không ổn định trên cùng code."
      },
      {
        "term": "Quarantine",
        "meaning": "Cách ly test flaky khỏi nhóm chặn merge nhưng vẫn theo dõi."
      },
      {
        "term": "SLA",
        "meaning": "Thời hạn cam kết để sửa test bị cách ly."
      },
      {
        "term": "Flaky budget",
        "meaning": "Ngưỡng flaky tối đa cho phép của toàn suite."
      }
    ],
    "examples": [
      {
        "title": "Đánh dấu quarantine bằng tag và tách khỏi gate",
        "code": {
          "title": "cách tổ chức quarantine",
          "language": "ts",
          "code": "// Test bị cách ly: thêm tag @quarantine + link issue trong annotation\ntest(\"tìm kiếm gợi ý realtime\", {\n  tag: \"@quarantine\",\n  annotation: { type: \"issue\", description: \"https://github.com/acme/web/issues/812 — owner: @linh, SLA: 2026-11-04\" },\n}, async ({ page }) => {\n  // ...\n});\n\n// playwright.config.ts — 2 project: chặn merge và không chặn\nexport default defineConfig({\n  projects: [\n    { name: \"gate\",       grepInvert: /@quarantine/ },  // chạy trong required check\n    { name: \"quarantine\", grep: /@quarantine/ },         // chạy job riêng, không bắt buộc\n  ],\n});"
        }
      },
      {
        "title": "Tự động phát hiện flaky từ JSON report và mở issue",
        "code": {
          "title": "scripts/detect-flaky.ts",
          "language": "ts",
          "code": "import { readFileSync } from \"node:fs\";\n\ntype T = { status: string; projectName: string };\ntype Spec = { title: string; file: string; tests: T[] };\ntype Suite = { specs?: Spec[]; suites?: Suite[] };\n\nconst report = JSON.parse(readFileSync(\"results.json\", \"utf8\")) as { suites: Suite[] };\nconst flaky: Spec[] = [];\nconst walk = (s: Suite) => {\n  s.specs?.forEach((sp) => sp.tests.some((t) => t.status === \"flaky\") && flaky.push(sp));\n  s.suites?.forEach(walk);\n};\nreport.suites.forEach(walk);\n\nfor (const f of flaky) {\n  // Thực tế: kiểm tra issue đã tồn tại chưa, rồi `gh issue create --label flaky --assignee <CODEOWNER>`\n  console.log(`FLAKY: ${f.file} › ${f.title}`);\n}"
        },
        "notes": [
          "Owner lấy từ `CODEOWNERS` theo đường dẫn file test, nên mỗi test flaky đều có người chịu trách nhiệm cụ thể."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Tăng `retries` lên 3 và coi như đã giải quyết flaky.",
        "fix": "Retry để **phát hiện**. Test pass ở retry vẫn bị đánh dấu flaky và đưa vào quy trình sửa."
      },
      {
        "wrong": "Quarantine không có owner và hạn, thành \"nghĩa địa test\".",
        "fix": "Mỗi test quarantine có issue, owner, SLA và được báo cáo hằng tuần."
      },
      {
        "wrong": "Xoá test flaky ngay mà không tìm nguyên nhân.",
        "fix": "Flaky có thể là **race condition thật** của sản phẩm. Điều tra trước khi xoá."
      }
    ],
    "exercise": {
      "task": "Viết quy trình (dạng checklist 6 bước) từ lúc phát hiện test flaky đến lúc đưa test trở lại gate. Bao gồm cách chứng minh đã sửa xong.",
      "solutionNote": "1) Phát hiện qua report. 2) Gắn @quarantine, mở issue và gán owner theo CODEOWNERS. 3) Owner tái hiện bằng `--repeat-each` và trace. 4) Phân loại nguyên nhân (timing, data, order, env, bug thật). 5) Sửa và chạy `--repeat-each=100` xanh. 6) Gỡ tag, đóng issue, ghi lại nguyên nhân vào tài liệu."
    },
    "checklist": [
      "Định nghĩa và phát hiện được flaky test",
      "Thiết lập được quarantine bằng tag và project",
      "Giải thích được vì sao retry không phải là giải pháp",
      "Đề xuất được flaky budget cho team"
    ],
    "interviewTip": "\"Retry chỉ dùng để phát hiện flaky. Test flaky được tự động gắn quarantine, ra khỏi required check nhưng vẫn chạy, kèm issue có owner từ CODEOWNERS và SLA 7 ngày. Suite có flaky budget 1%, test mới phải pass repeat-each 20 lần mới vào gate.\"",
    "resources": [
      {
        "title": "Playwright — Retries",
        "url": "https://playwright.dev/docs/test-retries",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "perf-budget",
    "minutes": 30,
    "level": "Trung cấp",
    "why": "Hiệu năng giảm dần từng chút qua mỗi PR mà không ai để ý. Performance budget biến \"web chậm\" thành con số có thể chặn ở CI.",
    "explain": [
      "**Performance budget** là ngưỡng cho các chỉ số: **LCP** (nội dung chính hiện ra), **CLS** (độ xô lệch layout), **TBT** (thời gian main thread bị chặn, đại diện cho INP trong lab), kích thước JS, và với API là **p95 latency** cùng tỉ lệ lỗi.",
      "**Lighthouse CI** chạy Lighthouse trên URL (ví dụ preview) và so với budget, fail nếu vượt. **k6** gửi tải vào API để đo latency, với `thresholds` tự fail khi vượt ngưỡng. Mức smoke (vài user ảo, 30 giây) là đủ cho PR.",
      "Kết quả lab (Lighthouse) dao động giữa các lần chạy, nên hãy chạy nhiều lần (ví dụ 3) và lấy median, đặt budget có biên độ."
    ],
    "analogy": "Giống **ngân sách chi tiêu gia đình**: mỗi khoản có hạn mức. Không đặt hạn mức thì mỗi tháng lại \"lỡ\" tiêu thêm một chút.",
    "concepts": [
      {
        "term": "LCP / CLS / INP",
        "meaning": "Core Web Vitals: tốc độ hiển thị, độ ổn định layout, độ phản hồi."
      },
      {
        "term": "Lighthouse CI",
        "meaning": "Công cụ chạy Lighthouse trong CI và kiểm tra theo budget."
      },
      {
        "term": "k6 thresholds",
        "meaning": "Điều kiện pass/fail cho load test, ví dụ `p(95)<500`."
      }
    ],
    "examples": [
      {
        "title": "Lighthouse CI với budget",
        "code": {
          "title": "lighthouserc.json",
          "language": "json",
          "code": "{\n  \"ci\": {\n    \"collect\": { \"numberOfRuns\": 3, \"url\": [\"http://localhost:3000/\", \"http://localhost:3000/products\"] },\n    \"assert\": {\n      \"assertions\": {\n        \"largest-contentful-paint\": [\"error\", { \"maxNumericValue\": 2500 }],\n        \"cumulative-layout-shift\": [\"error\", { \"maxNumericValue\": 0.1 }],\n        \"total-blocking-time\": [\"warn\", { \"maxNumericValue\": 300 }],\n        \"categories:accessibility\": [\"warn\", { \"minScore\": 0.9 }]\n      }\n    }\n  }\n}"
        },
        "notes": [
          "`error` tương ứng gate block, `warn` tương ứng gate warn, đúng với bài Gate rules."
        ]
      },
      {
        "title": "k6 smoke test cho API",
        "code": {
          "title": "perf/api-smoke.js",
          "language": "ts",
          "code": "import http from \"k6/http\";\nimport { check, sleep } from \"k6\";\n\nexport const options = {\n  vus: 5,\n  duration: \"30s\",\n  thresholds: {\n    http_req_duration: [\"p(95)<400\"], // 95% request < 400ms\n    http_req_failed: [\"rate<0.01\"],   // lỗi < 1%\n  },\n};\n\nexport default function () {\n  const res = http.get(`${__ENV.BASE_URL}/api/products`);\n  check(res, { \"status 200\": (r) => r.status === 200 });\n  sleep(1);\n}"
        }
      }
    ],
    "mistakes": [
      {
        "wrong": "Chạy Lighthouse 1 lần rồi fail vì dao động.",
        "fix": "Chạy 3–5 lần, dùng median, đặt budget có biên."
      },
      {
        "wrong": "Chạy load test nặng trên mỗi PR.",
        "fix": "PR chỉ chạy smoke perf. Load hoặc stress test chạy nightly trên môi trường riêng."
      },
      {
        "wrong": "Đo trên máy dev rồi so với CI.",
        "fix": "So sánh trong cùng môi trường. Theo dõi xu hướng thay vì giá trị tuyệt đối đơn lẻ."
      }
    ],
    "exercise": {
      "task": "Đặt performance budget cho trang chủ app `ai-automation-senior-hub` của bạn: chạy Lighthouse (DevTools hoặc `npx @lhci/cli autorun`), ghi lại LCP, CLS, TBT hiện tại, rồi đặt budget = hiện tại + 10% biên.",
      "solutionNote": "Budget dựa trên thực tế hiện tại giúp chặn **suy giảm** thay vì đặt mục tiêu viển vông. Sau đó siết dần theo thời gian."
    },
    "checklist": [
      "Giải thích được LCP, CLS, INP/TBT",
      "Cấu hình được Lighthouse CI assertions",
      "Viết được k6 smoke test có thresholds"
    ],
    "interviewTip": "\"Tôi đặt performance budget dựa trên baseline hiện tại cộng biên độ. Lighthouse CI chạy nhiều lần trên preview cho Web Vitals, k6 smoke kiểm tra p95 của API. Vượt ngưỡng nghiêm trọng thì block, nhẹ thì warn. Load test nặng chạy nightly.\"",
    "resources": [
      {
        "title": "Lighthouse CI",
        "url": "https://github.com/GoogleChrome/lighthouse-ci",
        "kind": "repo"
      },
      {
        "title": "k6 — Thresholds",
        "url": "https://grafana.com/docs/k6/latest/using-k6/thresholds/",
        "kind": "docs"
      },
      {
        "title": "web.dev — Core Web Vitals",
        "url": "https://web.dev/articles/vitals",
        "kind": "article"
      }
    ]
  },
  {
    "topicId": "security-scan",
    "minutes": 30,
    "level": "Cơ bản",
    "why": "Senior SDET được kỳ vọng hiểu chất lượng rộng hơn chức năng. Một lớp quét bảo mật cơ bản trong CI chặn được phần lớn lỗi phổ biến với chi phí rất thấp.",
    "explain": [
      "**Dependency scan**: kiểm tra thư viện có lỗ hổng đã biết (`npm audit`, Dependabot, Snyk). Phần lớn lỗ hổng của app web đến từ dependency.",
      "**Secret scan**: phát hiện API key hay mật khẩu bị commit nhầm (GitHub secret scanning và push protection, gitleaks). Nên chặn **trước khi** secret vào repo.",
      "**DAST cơ bản**: quét app đang chạy để tìm lỗi cấu hình (thiếu security header, cookie không `Secure`). OWASP ZAP baseline scan chạy được trên preview URL. Ngoài ra, viết test Playwright kiểm tra **phân quyền**: user A không xem được dữ liệu của user B."
    ],
    "analogy": "Giống **kiểm tra an ninh sân bay** có nhiều lớp: soi hành lý (dependency), kiểm tra giấy tờ (secret), và tuần tra khu vực (DAST). Không lớp nào hoàn hảo, nhưng cùng nhau chặn được phần lớn rủi ro.",
    "concepts": [
      {
        "term": "SCA",
        "meaning": "Software Composition Analysis: quét lỗ hổng trong dependency."
      },
      {
        "term": "Secret scanning",
        "meaning": "Phát hiện thông tin bí mật trong code hoặc lịch sử git."
      },
      {
        "term": "DAST",
        "meaning": "Dynamic Application Security Testing: quét app đang chạy."
      },
      {
        "term": "IDOR",
        "meaning": "Truy cập tài nguyên của người khác chỉ bằng cách đổi id. Lỗi phân quyền rất phổ biến."
      }
    ],
    "examples": [
      {
        "title": "Test phân quyền (IDOR) bằng Playwright API",
        "code": {
          "title": "e2e/security/idor.spec.ts",
          "language": "ts",
          "code": "import { test, expect } from \"@playwright/test\";\n\ntest(\"user B không xem được đơn hàng của user A\", async ({ playwright }) => {\n  const asA = await playwright.request.newContext({ storageState: \"playwright/.auth/userA.json\" });\n  const asB = await playwright.request.newContext({ storageState: \"playwright/.auth/userB.json\" });\n\n  const order = await (await asA.post(\"/api/orders\", { data: { sku: \"SKU-1\", qty: 1 } })).json();\n\n  const res = await asB.get(`/api/orders/${order.id}`);\n  expect([403, 404]).toContain(res.status()); // tuyệt đối không được 200\n\n  await asA.dispose();\n  await asB.dispose();\n});"
        }
      },
      {
        "title": "Kiểm tra security header",
        "code": {
          "title": "e2e/security/headers.spec.ts",
          "language": "ts",
          "code": "test(\"trang chủ có security headers cơ bản\", async ({ request }) => {\n  const res = await request.get(\"/\");\n  const h = res.headers();\n  expect(h[\"x-content-type-options\"]).toBe(\"nosniff\");\n  expect(h[\"strict-transport-security\"]).toBeTruthy();\n  expect(h[\"content-security-policy\"] ?? h[\"content-security-policy-report-only\"]).toBeTruthy();\n});"
        }
      },
      {
        "title": "Dependency audit trong CI",
        "code": {
          "title": ".github/workflows/security.yml (trích)",
          "language": "yaml",
          "code": "- run: npm audit --audit-level=high --omit=dev   # fail nếu có lỗ hổng high/critical ở dependency production"
        }
      }
    ],
    "mistakes": [
      {
        "wrong": "Chỉ chạy `npm audit` và nghĩ thế là đủ bảo mật.",
        "fix": "Kết hợp nhiều lớp: dependency, secret, DAST, test phân quyền."
      },
      {
        "wrong": "Block mọi lỗ hổng kể cả mức low hoặc trong devDependencies.",
        "fix": "Block mức high/critical ở dependency production. Phần còn lại warn và xử lý theo lịch."
      },
      {
        "wrong": "Phát hiện secret đã commit thì chỉ xoá khỏi file.",
        "fix": "**Rotate (thu hồi và tạo lại) secret ngay**, vì nó vẫn nằm trong lịch sử git."
      }
    ],
    "exercise": {
      "task": "Viết test IDOR cho API `/api/profile/:id` với 2 tài khoản, và test kiểm tra cookie phiên có cờ `Secure` và `HttpOnly`.",
      "hint": "Đọc cookie bằng `await context.cookies()` sau khi đăng nhập, tìm cookie phiên theo tên.",
      "solution": {
        "title": "e2e/security/cookie.spec.ts",
        "language": "ts",
        "code": "test(\"cookie phiên an toàn\", async ({ page, context }) => {\n  await page.goto(\"/\");\n  const session = (await context.cookies()).find((c) => c.name.includes(\"session\"));\n  expect(session, \"không tìm thấy cookie phiên\").toBeTruthy();\n  expect(session!.secure).toBe(true);\n  expect(session!.httpOnly).toBe(true);\n  expect([\"Lax\", \"Strict\"]).toContain(session!.sameSite);\n});"
      }
    },
    "checklist": [
      "Giải thích được SCA, secret scanning và DAST",
      "Viết được test phân quyền IDOR",
      "Biết phải làm gì khi secret bị commit"
    ],
    "interviewTip": "\"Tôi xếp lớp bảo mật trong CI: npm audit chặn lỗ hổng high ở dependency production, secret scanning có push protection, ZAP baseline trên preview, và test Playwright cho phân quyền như IDOR và security header. Secret bị lộ thì rotate ngay, không chỉ xoá khỏi code.\"",
    "resources": [
      {
        "title": "OWASP Top 10",
        "url": "https://owasp.org/www-project-top-ten/",
        "kind": "docs"
      },
      {
        "title": "GitHub — Secret scanning",
        "url": "https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "results-ingestion",
    "minutes": 30,
    "level": "Trung cấp",
    "why": "Report HTML của từng lần chạy rồi bị xoá thì không ai biết test nào hay fail nhất tháng này. Lưu kết quả vào DB là nền móng cho mọi phân tích flaky, thời gian và chất lượng.",
    "explain": [
      "Mỗi lần CI chạy, xuất kết quả dạng có cấu trúc (JSON reporter hoặc JUnit XML), rồi một bước nhỏ **ghi từng test vào DB**: tên, file, trạng thái, thời gian, số lần retry, commit, branch, run id.",
      "Có thể viết **custom reporter** của Playwright: class implement `onTestEnd` và `onEnd`, gom kết quả và gửi một lần về API hoặc DB khi kết thúc.",
      "Thiết kế bảng đơn giản là đủ: `test_runs` (mỗi lần CI) và `test_results` (mỗi test trong lần đó). Postgres là đủ cho đa số team. BigQuery phù hợp khi dữ liệu rất lớn."
    ],
    "analogy": "Giống **hồ sơ bệnh án**: một lần khám không nói lên nhiều, nhưng có lịch sử nhiều năm thì bác sĩ thấy được xu hướng.",
    "concepts": [
      {
        "term": "Custom reporter",
        "meaning": "Class nhận sự kiện của Playwright (bắt đầu, kết thúc test) để xử lý kết quả."
      },
      {
        "term": "JUnit XML",
        "meaning": "Định dạng kết quả test phổ biến mà nhiều công cụ hiểu được."
      },
      {
        "term": "Run metadata",
        "meaning": "Commit SHA, branch, run id, thời điểm. Dùng để truy vết và nhóm dữ liệu."
      }
    ],
    "examples": [
      {
        "title": "Custom reporter gửi kết quả về API",
        "code": {
          "title": "reporters/ingest-reporter.ts",
          "language": "ts",
          "code": "import type { FullResult, Reporter, TestCase, TestResult } from \"@playwright/test/reporter\";\n\ntype Row = { testId: string; title: string; file: string; status: string; durationMs: number; retry: number };\n\nexport default class IngestReporter implements Reporter {\n  private rows: Row[] = [];\n\n  onTestEnd(test: TestCase, result: TestResult) {\n    this.rows.push({\n      testId: test.id,\n      title: test.titlePath().join(\" › \"),\n      file: test.location.file,\n      status: result.status, // passed | failed | timedOut | skipped | interrupted\n      durationMs: result.duration,\n      retry: result.retry,\n    });\n  }\n\n  async onEnd(result: FullResult) {\n    if (!process.env.INGEST_URL) return;\n    await fetch(process.env.INGEST_URL, {\n      method: \"POST\",\n      headers: { \"Content-Type\": \"application/json\", Authorization: `Bearer ${process.env.INGEST_TOKEN}` },\n      body: JSON.stringify({\n        run: { id: process.env.GITHUB_RUN_ID, sha: process.env.GITHUB_SHA, branch: process.env.GITHUB_REF_NAME, status: result.status },\n        results: this.rows,\n      }),\n    });\n  }\n}\n\n// playwright.config.ts: reporter: [[\"html\"], [\"./reporters/ingest-reporter.ts\"]]"
        }
      },
      {
        "title": "Schema DB tối thiểu",
        "code": {
          "title": "db/schema.sql",
          "language": "sql",
          "code": "CREATE TABLE test_runs (\n  id          text PRIMARY KEY,         -- GITHUB_RUN_ID\n  sha         text NOT NULL,\n  branch      text NOT NULL,\n  status      text NOT NULL,\n  created_at  timestamptz NOT NULL DEFAULT now()\n);\n\nCREATE TABLE test_results (\n  run_id      text REFERENCES test_runs(id),\n  test_id     text NOT NULL,\n  title       text NOT NULL,\n  file        text NOT NULL,\n  status      text NOT NULL,\n  duration_ms integer NOT NULL,\n  retry       integer NOT NULL,\n  PRIMARY KEY (run_id, test_id, retry)\n);\nCREATE INDEX ON test_results (test_id);"
        },
        "notes": [
          "Lưu **mọi lần retry** (retry là một phần của khoá chính): một test fail ở retry 0 rồi pass ở retry 1 chính là dấu hiệu flaky."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Chỉ lưu kết quả cuối cùng của mỗi test.",
        "fix": "Lưu từng lần retry để phát hiện flaky."
      },
      {
        "wrong": "Không lưu commit SHA nên không phân biệt được \"đổi code\" và \"flaky\".",
        "fix": "Luôn lưu SHA và branch cho mỗi run."
      },
      {
        "wrong": "Reporter gửi từng test một request.",
        "fix": "Gom và gửi một lần trong `onEnd`, hoặc theo lô."
      }
    ],
    "exercise": {
      "task": "Viết câu SQL: 10 test chậm nhất (trung bình `duration_ms`) trên nhánh `main` trong 14 ngày qua, chỉ tính lần chạy pass.",
      "solution": {
        "title": "queries/slowest.sql",
        "language": "sql",
        "code": "SELECT r.title, r.file, round(avg(r.duration_ms)) AS avg_ms, count(*) AS runs\nFROM test_results r\nJOIN test_runs t ON t.id = r.run_id\nWHERE t.branch = 'main'\n  AND t.created_at > now() - interval '14 days'\n  AND r.status = 'passed'\nGROUP BY r.title, r.file\nORDER BY avg_ms DESC\nLIMIT 10;"
      }
    },
    "checklist": [
      "Viết được custom reporter với `onTestEnd` và `onEnd`",
      "Thiết kế được schema lưu run và result",
      "Viết được truy vấn phân tích cơ bản"
    ],
    "interviewTip": "\"Mọi lần chạy CI đều đẩy kết quả từng test, kể cả từng lần retry, kèm commit và branch vào Postgres qua một custom reporter. Dữ liệu lịch sử này là nền cho flakiness score, phân tích test chậm và dashboard chất lượng.\"",
    "resources": [
      {
        "title": "Playwright — Custom reporters",
        "url": "https://playwright.dev/docs/test-reporter-api",
        "kind": "docs"
      }
    ]
  },
  {
    "topicId": "flakiness-score",
    "minutes": 30,
    "level": "Nâng cao",
    "why": "\"Test này có vẻ hay flaky\" không phải dữ liệu. Flakiness score cho bạn xếp hạng khách quan để ưu tiên sửa và kích hoạt quarantine tự động.",
    "explain": [
      "Tín hiệu mạnh nhất là **flip trên cùng commit**: cùng SHA mà test vừa pass vừa fail (giữa các lần retry hoặc giữa các lần chạy). Code không đổi mà kết quả đổi thì đó là flaky.",
      "**Flakiness score** của một test trong cửa sổ N ngày = số commit có flip / số commit test đã chạy. Dùng cửa sổ trượt (ví dụ 14 ngày) để test đã sửa sẽ dần hạ điểm.",
      "Kết hợp với ngưỡng: score > 5% thì tự gắn quarantine và mở issue (bài Flaky budget), score về 0 trong 7 ngày thì đề xuất gỡ quarantine."
    ],
    "analogy": "Giống **chấm điểm độ tin cậy của nhân viên giao hàng**: không phạt vì một lần trễ, mà xem tỉ lệ trễ trong 2 tuần gần nhất.",
    "concepts": [
      {
        "term": "Flip",
        "meaning": "Test đổi kết quả (pass ↔ fail) mà code không đổi."
      },
      {
        "term": "Sliding window",
        "meaning": "Chỉ tính dữ liệu trong N ngày gần nhất."
      },
      {
        "term": "Auto-quarantine",
        "meaning": "Tự cách ly test khi điểm vượt ngưỡng."
      }
    ],
    "examples": [
      {
        "title": "Tính flakiness score bằng SQL",
        "code": {
          "title": "queries/flakiness.sql",
          "language": "sql",
          "code": "WITH per_commit AS (\n  SELECT r.test_id, r.title, t.sha,\n         bool_or(r.status = 'passed')  AS any_pass,\n         bool_or(r.status = 'failed')  AS any_fail\n  FROM test_results r\n  JOIN test_runs t ON t.id = r.run_id\n  WHERE t.created_at > now() - interval '14 days'\n  GROUP BY r.test_id, r.title, t.sha\n)\nSELECT test_id, title,\n       count(*)                                         AS commits,\n       count(*) FILTER (WHERE any_pass AND any_fail)    AS flips,\n       round(100.0 * count(*) FILTER (WHERE any_pass AND any_fail) / count(*), 1) AS flaky_pct\nFROM per_commit\nGROUP BY test_id, title\nHAVING count(*) >= 5                 -- đủ mẫu mới kết luận\nORDER BY flaky_pct DESC\nLIMIT 20;"
        },
        "notes": [
          "`HAVING count(*) >= 5` tránh kết luận từ quá ít dữ liệu (1 flip / 1 commit = 100% nhưng vô nghĩa)."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Coi mọi test fail là flaky.",
        "fix": "Fail ổn định trên một commit là **bug** (hoặc test sai), không phải flaky. Flaky là kết quả **đổi** trên cùng commit."
      },
      {
        "wrong": "Tính trên toàn bộ lịch sử.",
        "fix": "Dùng cửa sổ trượt để phản ánh tình trạng hiện tại."
      },
      {
        "wrong": "Ra quyết định từ 1–2 lần chạy.",
        "fix": "Đặt số mẫu tối thiểu."
      }
    ],
    "exercise": {
      "task": "Viết hàm TypeScript `flakinessScore(results: { sha: string; status: 'passed' | 'failed' }[])` với cùng logic như câu SQL, kèm 3 unit test.",
      "solution": {
        "title": "lib/flakiness.ts",
        "language": "ts",
        "code": "export function flakinessScore(results: { sha: string; status: \"passed\" | \"failed\" }[]) {\n  const bySha = new Map<string, Set<string>>();\n  for (const r of results) bySha.set(r.sha, (bySha.get(r.sha) ?? new Set()).add(r.status));\n  const commits = bySha.size;\n  if (commits === 0) return null;\n  const flips = [...bySha.values()].filter((s) => s.has(\"passed\") && s.has(\"failed\")).length;\n  return flips / commits;\n}"
      }
    },
    "checklist": [
      "Định nghĩa được flip trên cùng commit",
      "Tính được flakiness score trong cửa sổ trượt",
      "Biết đặt số mẫu tối thiểu trước khi kết luận"
    ],
    "interviewTip": "\"Tôi đo flakiness bằng tỉ lệ commit có flip, tức cùng SHA mà vừa pass vừa fail, trong cửa sổ 14 ngày và có số mẫu tối thiểu. Vượt 5% thì tự quarantine và mở issue, về 0 trong 7 ngày thì đề xuất gỡ.\""
  },
  {
    "topicId": "ai-triage",
    "minutes": 35,
    "level": "Nâng cao",
    "why": "Khi pipeline có hàng chục test fail, người đọc log mất hàng giờ. AI triage gom nhóm và phân loại để team biết ngay \"đây là bug sản phẩm, lỗi test hay sự cố hạ tầng\".",
    "explain": [
      "Bước 1, **chuẩn hoá lỗi thành signature**: bỏ số dòng, id, timestamp, đường dẫn tạm khỏi error message và stack trace, rồi hash. Các lỗi cùng signature được gom thành một **cluster**. 30 test fail thường chỉ là 2–3 cluster.",
      "Bước 2, với **mỗi cluster mới**, gửi một đại diện (error, đoạn log đã rút gọn, diff của PR) cho LLM, yêu cầu structured output: `category` (product_bug / test_bug / infra / flaky), `confidence`, `evidence`.",
      "Bước 3, **redact** (che) secret và dữ liệu cá nhân trước khi gửi, cache kết quả theo signature, chạy bất đồng bộ để không làm chậm pipeline, và đưa kết quả vào PR comment kèm nút feedback."
    ],
    "analogy": "Giống **phòng cấp cứu phân loại**: y tá gom các ca giống nhau và đánh giá sơ bộ, bác sĩ (dev) tập trung vào ca nặng thay vì khám lại từng người từ đầu.",
    "concepts": [
      {
        "term": "Error signature",
        "meaning": "Dạng chuẩn hoá của lỗi, dùng để gom nhóm."
      },
      {
        "term": "Clustering",
        "meaning": "Nhóm các lỗi có cùng nguyên nhân."
      },
      {
        "term": "Redaction",
        "meaning": "Che thông tin nhạy cảm trước khi gửi ra ngoài."
      }
    ],
    "examples": [
      {
        "title": "Chuẩn hoá lỗi thành signature và gom cluster",
        "code": {
          "title": "triage/cluster.ts",
          "language": "ts",
          "code": "import { createHash } from \"node:crypto\";\n\nexport function signature(message: string, stack = \"\"): string {\n  const norm = `${message}\\n${stack.split(\"\\n\").slice(0, 5).join(\"\\n\")}`\n    .replace(/:\\d+:\\d+/g, \":L:C\")                    // số dòng/cột\n    .replace(/\\b[0-9a-f]{8,}\\b/gi, \"<hex>\")          // id, hash\n    .replace(/\\d{4}-\\d{2}-\\d{2}T[\\d:.]+Z?/g, \"<ts>\") // timestamp\n    .replace(/\\b\\d+(ms|s)\\b/g, \"<dur>\")              // thời lượng\n    .replace(/\\/tmp\\/[^\\s)]+/g, \"<tmp>\");            // đường dẫn tạm\n  return createHash(\"sha1\").update(norm).digest(\"hex\").slice(0, 12);\n}\n\nexport function cluster<T extends { message: string; stack?: string }>(failures: T[]) {\n  const groups = new Map<string, T[]>();\n  for (const f of failures) {\n    const sig = signature(f.message, f.stack);\n    groups.set(sig, [...(groups.get(sig) ?? []), f]);\n  }\n  return [...groups.entries()].map(([sig, items]) => ({ sig, count: items.length, sample: items[0] }));\n}"
        }
      },
      {
        "title": "Redact trước khi gửi LLM",
        "code": {
          "title": "triage/redact.ts",
          "language": "ts",
          "code": "const PATTERNS: [RegExp, string][] = [\n  [/(authorization|cookie|set-cookie):\\s*[^\\n]+/gi, \"$1: <redacted>\"],\n  [/\\b(sk|pk|ghp|xox[abp])[-_][A-Za-z0-9_-]{10,}\\b/g, \"<token>\"],\n  [/[\\w.+-]+@[\\w-]+\\.[\\w.]+/g, \"<email>\"],\n  [/\\b\\d{9,12}\\b/g, \"<number>\"],\n];\n\nexport const redact = (text: string) => PATTERNS.reduce((t, [re, rep]) => t.replace(re, rep), text).slice(0, 6000);"
        },
        "notes": [
          "Cắt còn 6.000 ký tự quanh lỗi để kiểm soát token. Log đầy đủ vẫn có trong artifact cho người cần xem.",
          "Kết quả phân loại được cache theo `sig`, nên lỗi lặp lại ở các PR khác không tốn thêm lần gọi LLM."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Gửi toàn bộ log thô (có token, email khách hàng) cho LLM.",
        "fix": "Redact trước, cắt gọn quanh lỗi."
      },
      {
        "wrong": "Gọi LLM cho từng test fail.",
        "fix": "Gom cluster trước, mỗi cluster gọi một lần, và cache theo signature."
      },
      {
        "wrong": "Tin phân loại của AI tuyệt đối.",
        "fix": "Có ngưỡng confidence, dưới ngưỡng ghi \"cần người xem\". Thu feedback 👍/👎 để đo precision."
      }
    ],
    "exercise": {
      "task": "Viết 3 unit test cho `signature`: (1) hai lỗi chỉ khác số dòng ra cùng signature; (2) hai lỗi khác message ra khác signature; (3) timestamp khác nhau không ảnh hưởng.",
      "solution": {
        "title": "triage/cluster.test.ts",
        "language": "ts",
        "code": "import { expect, it } from \"vitest\";\nimport { signature } from \"./cluster\";\n\nit(\"bỏ qua số dòng\", () => {\n  expect(signature(\"Timeout 5000ms\", \"at cart.spec.ts:12:5\")).toBe(signature(\"Timeout 5000ms\", \"at cart.spec.ts:40:9\"));\n});\nit(\"khác message → khác signature\", () => {\n  expect(signature(\"Timeout\")).not.toBe(signature(\"Element not found\"));\n});\nit(\"bỏ qua timestamp\", () => {\n  expect(signature(\"fail at 2026-10-01T10:00:00Z\")).toBe(signature(\"fail at 2026-10-28T23:59:59Z\"));\n});"
      }
    },
    "checklist": [
      "Chuẩn hoá được lỗi thành signature và gom cluster",
      "Liệt kê được biện pháp redact trước khi gửi LLM",
      "Thiết kế được output phân loại có confidence và feedback"
    ],
    "interviewTip": "\"Lỗi được chuẩn hoá thành signature và gom cluster, nên 30 test fail thường chỉ còn 2–3 nhóm. Mỗi cluster mới được redact, rút gọn rồi gửi LLM phân loại bằng structured output có confidence. Kết quả được cache theo signature và đưa vào PR comment kèm feedback để đo precision.\""
  },
  {
    "topicId": "quality-dashboard",
    "minutes": 30,
    "level": "Trung cấp",
    "why": "Dữ liệu không ai nhìn thì vô giá trị. Dashboard chất lượng giúp leadership và team thấy xu hướng, và giúp bạn chứng minh tác động của công việc QA bằng con số.",
    "explain": [
      "Dashboard tốt trả lời vài câu hỏi rõ ràng: **Pipeline có nhanh không?** (P95 thời gian theo tuần), **Có đáng tin không?** (flaky rate, số test quarantine), **Chất lượng sản phẩm thế nào?** (tỉ lệ fail do product bug, escaped defects), **Ai cần hành động?** (test flaky theo team/owner).",
      "Công cụ: **Grafana** đọc thẳng từ Postgres (nhanh, phổ biến), hoặc một **trang Next.js nội bộ** nếu muốn tuỳ biến. Chính app bạn đang dùng là một ví dụ dashboard Next.js!",
      "Nguyên tắc: ít biểu đồ nhưng mỗi biểu đồ dẫn tới hành động. Hiển thị **xu hướng theo thời gian** thay vì một con số đơn lẻ, và luôn có ngưỡng hoặc mục tiêu trên biểu đồ."
    ],
    "analogy": "Giống **bảng đồng hồ ô tô**: chỉ vài kim quan trọng (tốc độ, nhiên liệu, cảnh báo), không phải toàn bộ thông số động cơ.",
    "concepts": [
      {
        "term": "Leading vs lagging metric",
        "meaning": "Chỉ số báo trước (flaky tăng) và chỉ số phản ánh kết quả (bug lọt production)."
      },
      {
        "term": "Escaped defect",
        "meaning": "Bug lọt lên production mà test không bắt được."
      },
      {
        "term": "Trend line",
        "meaning": "Biểu đồ theo thời gian để thấy cải thiện hay xấu đi."
      }
    ],
    "examples": [
      {
        "title": "Truy vấn P95 thời gian pipeline theo tuần (cho Grafana)",
        "code": {
          "title": "queries/p95-weekly.sql",
          "language": "sql",
          "code": "SELECT date_trunc('week', created_at) AS week,\n       percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms) / 60000.0 AS p95_minutes\nFROM ci_pipelines\nWHERE branch <> 'main'                 -- pipeline của PR\n  AND created_at > now() - interval '12 weeks'\nGROUP BY 1\nORDER BY 1;"
        }
      },
      {
        "title": "API route Next.js cho dashboard nội bộ",
        "code": {
          "title": "app/api/quality/flaky/route.ts",
          "language": "ts",
          "code": "import { sql } from \"@/lib/db\"; // client Postgres của bạn\n\nexport async function GET() {\n  const rows = await sql`\n    SELECT owner_team, count(*) AS quarantined\n    FROM quarantined_tests\n    WHERE resolved_at IS NULL\n    GROUP BY owner_team\n    ORDER BY quarantined DESC`;\n  return Response.json(rows, { headers: { \"Cache-Control\": \"s-maxage=300\" } });\n}"
        },
        "notes": [
          "Cache 5 phút ở CDN là đủ cho dashboard, tránh truy vấn DB mỗi lần có người mở trang."
        ]
      }
    ],
    "mistakes": [
      {
        "wrong": "Dashboard 30 biểu đồ không ai xem.",
        "fix": "5–7 chỉ số, mỗi chỉ số có ngưỡng và hành động đi kèm."
      },
      {
        "wrong": "Chỉ hiển thị số hiện tại.",
        "fix": "Hiển thị xu hướng 8–12 tuần để thấy hiệu quả cải tiến."
      },
      {
        "wrong": "Dùng dashboard để đổ lỗi cho cá nhân.",
        "fix": "Tổng hợp theo team hoặc khu vực code, mục tiêu là cải thiện hệ thống."
      }
    ],
    "exercise": {
      "task": "Thiết kế dashboard chất lượng 6 ô cho team bạn: mỗi ô ghi câu hỏi nó trả lời, truy vấn hoặc nguồn dữ liệu, ngưỡng, và hành động khi vượt ngưỡng.",
      "solutionNote": "Ví dụ 6 ô: P95 PR pipeline (< 10'), flaky rate (< 1%), số test quarantine theo team (≤ 3/team), tỉ lệ fail theo category từ AI triage, escaped defects mỗi tháng, healing precision (≥ 90%)."
    },
    "checklist": [
      "Chọn được 5–7 chỉ số chất lượng có hành động đi kèm",
      "Viết được truy vấn xu hướng theo thời gian",
      "Giải thích được leading và lagging metrics"
    ],
    "interviewTip": "\"Dashboard của tôi trả lời 4 câu hỏi: pipeline có nhanh không, có đáng tin không, sản phẩm có tốt không, và ai cần hành động. Mỗi chỉ số hiển thị xu hướng 12 tuần, có ngưỡng và owner. Tôi dùng nó để chứng minh tác động, ví dụ P95 giảm từ 25 xuống 9 phút sau khi shard và dùng TIA.\"",
    "resources": [
      {
        "title": "Grafana — PostgreSQL data source",
        "url": "https://grafana.com/docs/grafana/latest/datasources/postgres/",
        "kind": "docs"
      }
    ]
  }
];
