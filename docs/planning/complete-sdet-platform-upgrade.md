# Plan — Complete SDET Platform Upgrade

> Nâng cấp AI Automation Senior Hub từ "bộ bài đọc nâng cao" thành nền tảng học QA Automation & SDET hoàn chỉnh: **Learn → Understand → Practice → Validate → Track → Improve → Prepare → Demonstrate**.
> Hiện trạng: [`docs/architecture/current-state.md`](../architecture/current-state.md).

## 1. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| D1 | **Nâng cấp tại chỗ**, không viết lại | Giữ 41 bài, tiến độ học và hạ tầng sync đang chạy tốt |
| D2 | **Giữ app một người dùng** (PIN + Redis) trong giai đoạn này; multi-user/auth để sau | Thay đổi kiến trúc lớn nhất, chưa cần cho mục tiêu học |
| D3 | **Curriculum 12 phase dùng chung**, không cá nhân hoá; **Skill Assessment** gợi ý phase nên bỏ qua | Đúng yêu cầu "beginner → advanced" mà vẫn không bắt người đã vững phải học lại |
| D4 | Trạng thái topic giữ `todo / in-progress / done`; **năng lực (competency) được tính** từ điểm quiz + lab có bằng chứng | Ít state, merge đơn giản; app không tự kiểm chứng được code của người học nên không có trạng thái "Verified/Mastered" tự khai |
| D5 | **QA Shop là repo riêng** (`qa-shop`) + repo starter `qa-shop-tests`; Hub chỉ link qua `QA_SHOP_URL` | Cô lập rủi ro (app cố tình có bug/flaky), chạy được ở local/Docker, có version cho contract testing |
| D6 | QA Shop: in-memory khi chạy local, **Upstash Redis riêng** khi chạy bản public | Tránh flaky "giả" do cold start serverless; không chung database với tiến độ học |
| D7 | Hoãn: chạy code trong trình duyệt, Coding Challenge, MDX | Chi phí cao, chưa chặn mục tiêu học |
| D8 | **Không bao giờ đổi `Topic.id`** đã phát hành; đổi phase/module thì thêm redirect | `Topic.id` là khoá tiến độ |

## 2. Kiến trúc mục tiêu

```
ai-automation-senior-hub (Next.js)            qa-shop (Next.js, repo riêng)
├─ Learn:     /roadmap/[phase]/[module]         ├─ UI: login, catalog, cart, checkout, admin
├─ Practice:  quiz trong bài, /labs ───link──▶  ├─ REST API + OpenAPI (v1, v2)
├─ Validate:  quiz score, lab evidence URL      ├─ POST /api/reset (seed cố định, theo session)
├─ Track:     progress v2 (localStorage+Redis)  ├─ Chaos/bug flags (flaky, locator xấu, 429…)
├─ Improve:   /skills, assessment, gợi ý ôn     └─ Dockerfile
├─ Prepare:   /interview (Practice, Mock)
└─ Demonstrate: /portfolio                    qa-shop-tests (starter: Playwright + TS + CI)
```

Lớp dữ liệu của Hub:

- `data/content.ts` — skills, phases (level, prerequisites, capstone giờ), modules (skills), interview questions.
- `data/lessons/*` — `Lesson` (+ `quiz?`).
- `data/labs/*` — `Lab` (định nghĩa lab, tiêu chí nghiệm thu).
- `lib/curriculum.ts` — dữ liệu suy ra: giờ học ước tính, kỹ năng của phase.
- `lib/progress.ts` — `ProgressState v2` + sanitize/merge/migrate.
- `lib/competency.ts` *(Giai đoạn 2)* — tính năng lực theo skill từ quiz + lab + assessment.

## 3. Curriculum migration map

Phase 04–11 được suy ra từ chuỗi mục tiêu "Testing Fundamentals → … → Senior SDET Readiness". Nội dung hiện có **giữ nguyên `Topic.id`**, chỉ đổi phase/module chứa nó.

| Phase mới | Nguồn |
|---|---|
| 00 Software Testing Foundations | Mới |
| 01 Test Analysis & Test Design | Mới |
| 02 Programming Fundamentals for Automation (TypeScript) | Mới |
| 03 API Testing & Automation | Mới (+ liên kết `contract-testing`) |
| 04 UI Automation with Playwright | `locators`, `auth-state`, `network-mocking` |
| 05 Framework Architecture & Test Data | `fixtures`, `object-patterns`, module `data` |
| 06 Database & Async Workflow Testing | Mới |
| 07 CI/CD & Quality Gates | module `pipeline`, module `gates` |
| 08 Quality Engineering (Perf, Security, A11y, Contract) | `perf-budget`, `security-scan`, module `nextjs` |
| 09 Reliability & Test Observability | module `observability`, nội dung flaky |
| 10 AI-Driven Testing | toàn bộ phase `ai-driven-testing` |
| 11 Senior SDET Readiness | module `strategy` (pyramid, risk-based, shift-left, suite SLO), system design, interview, portfolio |

Redirect (`next.config.ts`): `/roadmap/test-architecture`, `/roadmap/ai-driven-testing`, `/roadmap/cicd-quality-gates` và các URL module cũ → vị trí mới. Thực hiện ở Giai đoạn 5.

## 4. Data migration strategy

| Bước | Chi tiết |
|---|---|
| Schema | `ProgressState` v1 → v2: thêm `quizzes`, `labs`, `assessment` |
| Đọc | `sanitizeProgress` nhận cả v1 và v2, luôn trả v2; field thiếu → giá trị rỗng |
| localStorage | Ghi `hub.progress.v2`; lần đầu đọc fallback `hub.progress.v1`; **giữ nguyên key v1** làm bản sao lưu |
| Redis | Ghi `hub:progress:v2`; nếu chưa có thì đọc `hub:progress:v1` và migrate; **không xoá key v1** |
| Tương thích ngược | Client cũ gửi state v1 → server merge, giữ nguyên dữ liệu v2; client cũ nhận v2 → bỏ qua field mới |
| Rollback | Deploy lại commit cũ: app đọc key v1 (vẫn còn), chỉ mất thay đổi phát sinh sau khi nâng cấp |
| Bảo vệ | Test "frozen topic IDs" chặn việc đổi/xoá topic id đã phát hành |

## 5. Delivery phases

### Giai đoạn 1 — Nền móng *(PR này)*
1. Docs: current state + plan.
2. Data model v2: skills, `level`, `prerequisites`, `capstone.estimatedHours`, `Module.skills`, kiểu `QuizQuestion`, `Lab`; bỏ `durationWeeks`, `leverage`, `profile`, nhắc Ruby/"20 tuần".
3. Progress v2 + migration (localStorage, Redis).
4. Vitest (unit, integration API với fake Upstash, content integrity) + GitHub Actions CI (typecheck → test → build).

**Acceptance**
- Tiến độ v1 hiện có (localStorage và Redis) hiển thị đầy đủ sau khi nâng cấp.
- Không còn UI nào phụ thuộc hồ sơ cá nhân.
- `npm run typecheck`, `npm test`, `npm run build` xanh trên CI cho mọi PR.

### Giai đoạn 2 — Học có kiểm tra
- Quiz 3–5 câu tình huống cho 41 bài; UI quiz trong `LessonArticle`; lưu `quizzes`.
- `lib/competency.ts`: điểm skill = f(quiz, lab, assessment); trang `/skills`.
- Skill Assessment đầu vào (~20 câu) → gợi ý phase nên bỏ qua.
- E2E Playwright cho flow chính: đọc bài → làm quiz → tiến độ cập nhật.

**Acceptance:** mỗi bài có ≥ 3 câu quiz có giải thích; Dashboard hiện năng lực theo skill từ dữ liệu thật; assessment chạy không cần đăng nhập.

### Giai đoạn 3 — QA Shop (repo `qa-shop`)
- Chức năng Cơ bản + Trung cấp, REST API + OpenAPI, `reset`/seed, Dockerfile, rate limit, không email/thanh toán thật.
- Repo `qa-shop-tests` với Playwright + TS + CI dựng QA Shop qua Docker.

**Acceptance:** `docker run` QA Shop + `npx playwright test` trong starter chạy xanh ở local và CI; reset trả dữ liệu giống hệt nhau giữa các lần.

### Giai đoạn 4 — Labs & Portfolio
- `/labs` với LAB-001 → LAB-004 (yêu cầu, checklist nghiệm thu, ô evidence URL https).
- `/portfolio` gom lab nâng cao đã nộp.

**Acceptance:** nộp lab lưu vào progress v2 và đồng bộ được giữa thiết bị; evidence URL chỉ chấp nhận `https`.

### Giai đoạn 5 — Mở rộng
- Case khó bật bằng flag trong QA Shop; LAB-005 → LAB-008.
- Nội dung Phase 00–03 và 06; xếp lại 41 bài theo bảng ở mục 3, kèm redirect.
- Interview: chế độ Practice và Mock; thêm câu hỏi cấp Junior/Middle và nhóm Manual/API/Test Design.

### Hoãn lại
Multi-user + auth, chạy TypeScript trong trình duyệt, Coding Challenge, chuyển nội dung sang MDX, grader dùng LLM.

## 6. Dependencies

| Giai đoạn | Phụ thuộc |
|---|---|
| 2 | Giai đoạn 1 (schema v2, CI) |
| 3 | Độc lập, có thể làm song song với 2 |
| 4 | 1 (schema `labs`), 3 (QA Shop có endpoint ổn định) |
| 5 | 2, 3, 4 |

Package mới: `vitest` (Giai đoạn 1), `@playwright/test` + `@axe-core/playwright` (Giai đoạn 2).

## 7. Test strategy

| Tầng | Công cụ | Phạm vi |
|---|---|---|
| Unit | Vitest | `lib/progress` (sanitize, migrate, merge — gồm tính giao hoán), `lib/grader`, `lib/curriculum`, sau này `lib/competency` |
| Integration | Vitest + fake Upstash (stub `fetch`) | `/api/progress`: tạo PIN, sai PIN/khoá, migrate key v1, merge, giới hạn body |
| Content integrity | Vitest | ID duy nhất & đúng định dạng, **frozen topic IDs**, mỗi topic có bài, skill hợp lệ, quiz có đáp án hợp lệ, lab tham chiếu topic tồn tại |
| E2E | Playwright *(Giai đoạn 2)* | Smoke: Dashboard, mở bài, đổi trạng thái, làm quiz, mock interview; axe cho a11y |
| CI gate | GitHub Actions | typecheck → test → build bắt buộc xanh trước khi merge |

## 8. Việc kỹ thuật tồn đọng (theo dõi riêng)

- Commit `package-lock.json` và pin `lucide-react` (CI sẽ tự chuyển sang `npm ci` khi có lockfile).
- Race condition read-modify-write ở `PUT /api/progress` → dùng Lua script hoặc optimistic version.
- Bộ đếm sai PIN toàn cục → thêm giới hạn theo IP.
- `scryptSync` → `scrypt` bất đồng bộ.
