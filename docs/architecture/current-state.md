# Current State — AI Automation Senior Hub

> Audit ngày 2026-10-31, commit `6071ea4` (nhánh `main`), trước khi bắt đầu nâng cấp thành nền tảng học QA Automation & SDET hoàn chỉnh.
> Tài liệu này mô tả **hiện trạng**, không phải thiết kế mục tiêu. Kế hoạch nâng cấp: [`docs/planning/complete-sdet-platform-upgrade.md`](../planning/complete-sdet-platform-upgrade.md).

## 1. Tổng quan

| Hạng mục | Hiện trạng |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Styling | Tailwind CSS v4, design token trong `app/globals.css` (`@theme`), light theme Slate + Indigo |
| Icon | `lucide-react` (đang để version `latest`) |
| Lưu trữ | `localStorage` (offline-first) + Upstash Redis qua REST (tuỳ chọn) |
| Deploy | Vercel |
| Test tự động | **Không có** (không unit test, không E2E, không CI) |
| Lockfile | **Không có** `package-lock.json` trong repo |

## 2. Routes

| Route | Loại | Mô tả |
|---|---|---|
| `/` | Server page + client widgets | Dashboard: hero, thống kê thật, "Học tiếp", 3 thẻ phase, `PhaseTabs` |
| `/roadmap/[phaseId]` | Server page (SSG qua `generateStaticParams`) | Trang giai đoạn: module, capstone, code mẫu, tài liệu |
| `/roadmap/[phaseId]/[moduleId]` | Server page | Danh sách bài học của module, render `LessonArticle` |
| `/interview` | Server page + `InterviewWorkspace` (client) | Interview Hub: accordion câu hỏi + Mock Interview Simulator |
| `/api/progress` | Route Handler (`GET`, `PUT`) | Đồng bộ tiến độ qua Redis, bảo vệ ghi bằng PIN |
| `not-found` | Server | Trang 404 |

## 3. Curriculum & mô hình dữ liệu

### Nội dung

- **3 phase · 10 module · 41 topic · 41 bài học** — toàn bộ ở mức nâng cao, viết cho người đã có nền Full-stack:
  - `test-architecture` (4 module, 15 bài, ~8.4 giờ đọc + bài tập)
  - `ai-driven-testing` (4 module, 14 bài, ~7.6 giờ)
  - `cicd-quality-gates` (3 module, 12 bài, ~6.2 giờ)
- **13 câu hỏi phỏng vấn** thuộc 6 nhóm: Playwright & Architecture, AI-Driven Testing, Flaky Tests, System Design, CI/CD & Quality Gates, Behavioral (STAR). Mỗi câu có `rubric` (concept + keywords) để chấm.
- Chưa có nội dung cho người mới (Testing Foundations, Test Design, TypeScript, API Testing).

### Kiểu dữ liệu chính

- `data/content.ts` là single source of truth: `Phase → Module → Topic`, `InterviewQuestion`, `CodeSample`, `Resource`.
- `Phase` có `durationWeeks` (lịch học cứng theo tuần) và `leverage` ("tận dụng background Full-stack") — **cá nhân hoá theo một hồ sơ cụ thể**, cùng object `profile` (stack có Ruby) hiển thị trên Dashboard.
- `data/lessons/phase-{1,2,3}.ts`: mảng `Lesson` (giải thích, ví dụ, code, lỗi hay gặp, bài tập, checklist, interview tip). Ghép với topic qua `topicId`.
- **`Topic.id` là khoá lưu tiến độ** — đổi id sẽ làm mất tiến độ của người học.
- Chưa có kiểu cho: quiz, lab, kỹ năng (skill), prerequisites, giờ học ước tính.

## 4. Tiến độ học (progress)

- `lib/progress.ts` — hàm thuần, dùng chung client/server:
  - `ProgressState v1 = { topics: {id → {status, at}}, attempts: [{questionId, score, at}], activity: [YYYY-MM-DD] }`
  - `sanitizeProgress` chuẩn hoá dữ liệu không tin cậy (bỏ field lạ, không throw).
  - `mergeProgress`: topic theo timestamp mới nhất, attempts/activity lấy hợp → hai thiết bị sửa song song không mất dữ liệu.
  - Thống kê: streak, tóm tắt topic, điểm mock interview.
- `components/progress/progress-provider.tsx`: ghi `localStorage` key `hub.progress.v1`, debounce 900 ms rồi `PUT /api/progress`.
- Trạng thái topic chỉ có 3 mức `todo / in-progress / done` — "done" nghĩa là *đã đọc*, chưa phản ánh *đã kiểm chứng năng lực*.

## 5. Đồng bộ Redis & bảo mật

- `lib/redis.ts`: client Upstash REST tối giản, tự nhận env `KV_REST_API_*` hoặc `UPSTASH_REDIS_REST_*`. Không có env → chế độ chỉ-local.
- `/api/progress`:
  - `GET` công khai, trả `{enabled, hasPin, state}`.
  - `PUT` cần PIN (header `x-progress-pin`); PIN hash bằng `scrypt` + salt; sai 10 lần → khoá 15 phút; body tối đa 256 KB; server merge rồi ghi lại.
- Keys: `hub:progress:v1`, `hub:pin:v1`, `hub:pin-fails`.

## 6. Interview Simulator & chấm điểm

- `lib/grader.ts`: chấm deterministic phía client theo 5 tiêu chí (Coverage 40, Trade-off 20, Structure 15, Concreteness 15, Depth 10) bằng so khớp keyword đã bỏ dấu.
- Kết quả lưu vào `attempts` để Dashboard tính điểm trung bình.
- README đã chừa đường nâng cấp sang LLM thật (`app/api/grade/route.ts` trả cùng kiểu `GradeResult`).

## 7. UI design system

- Token ngữ nghĩa (`bg-surface`, `text-ink-muted`, `accent`…), không hard-code màu; tương phản chữ ≥ 4.5:1.
- Primitive dùng chung: `components/ui/primitives.tsx` (`Card`, `Badge`, `Eyebrow`…), `CodeBlock`, `RichText` (hỗ trợ `code` và **đậm** inline).
- Header 2 mục điều hướng: Dashboard, Interview Hub.

## 8. Hạn chế & rủi ro đã phát hiện

### Chất lượng & vận hành
1. **Không có test tự động và CI** — một nền tảng dạy SDET nhưng chính nó chưa được kiểm thử.
2. **Không có lockfile**, `lucide-react@latest` → build không tái lập được (reproducible); một bản major mới có thể làm vỡ build.

### Bảo mật & tính đúng đắn
3. **Một key Redis chung (`hub:progress:v1`)** → ứng dụng chỉ phục vụ một người học. Muốn nhiều người học cần auth và lưu tiến độ theo user.
4. **Race condition read-modify-write** ở `PUT`: hai request đồng thời cùng `GET` bản cũ, request ghi sau sẽ đè thay đổi của request ghi trước. Rủi ro thấp với một người dùng nhưng là lỗi thật (khắc phục: Lua script/`WATCH` hoặc optimistic version).
5. **Bộ đếm sai PIN là toàn cục** — ai cũng có thể gửi 10 PIN sai để khoá chủ sở hữu 15 phút (DoS nhẹ). Chưa có rate limit theo IP.
6. PIN lưu dạng plaintext trong `localStorage` của thiết bị (chấp nhận được cho app cá nhân, cần ghi chú rõ).
7. `scryptSync` chặn event loop trong lúc hash (ảnh hưởng nhỏ ở quy mô hiện tại).
8. Grader dựa trên keyword → có thể "nhồi từ khoá" để tăng điểm Coverage.

### Nội dung & sản phẩm
9. Curriculum chỉ phục vụ người đã có nền tảng; thiếu Phase 00–03 cho người mới.
10. Cá nhân hoá cứng theo một hồ sơ (`profile`, `leverage`, nhắc Ruby, "lộ trình 20 tuần").
11. Chưa có quiz, lab thực hành có bằng chứng, đánh giá năng lực, gợi ý theo điểm yếu, portfolio.

## 9. Điểm mạnh cần giữ

- Mô hình tiến độ offline-first + merge theo timestamp, sanitize dữ liệu không tin cậy.
- Nội dung 41 bài chất lượng cao, ID topic ổn định.
- Design token và component primitive nhất quán, chú ý accessibility.
- Grader có interface `GradeResult` rõ ràng, dễ thay bằng LLM.
