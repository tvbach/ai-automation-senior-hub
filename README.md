# AI Automation Senior Hub

Web app cá nhân: lộ trình 20 tuần, tài liệu thực chiến và luyện phỏng vấn cho vị trí **Senior Automation Test AI / AI SDET**.

Stack: Next.js (App Router) · TypeScript · Tailwind CSS v4 · Lucide React.

## Chạy local

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run typecheck
```

Yêu cầu Node.js ≥ 20.9.

## Cấu trúc

```
app/
  layout.tsx                            # font, header, ProgressProvider
  globals.css                           # Tailwind v4 + design tokens (@theme)
  page.tsx                              # Dashboard: stats thật, "Học tiếp", 3 phase
  roadmap/[phaseId]/page.tsx            # Trang giai đoạn
  roadmap/[phaseId]/[moduleId]/page.tsx # Trang module = danh sách bài học
  interview/page.tsx                    # Interview Hub + Mock Interview Simulator
  api/progress/route.ts                 # API đồng bộ tiến độ (Redis + PIN)
components/
  site-header.tsx
  dashboard/  live-stats.tsx · phase-tabs.tsx
  interview/  interview-workspace.tsx · question-accordion.tsx · mock-simulator.tsx
  ui/         primitives.tsx · code-block.tsx
components/progress/          # ProgressProvider, SyncButton (PIN), StatusControl, LiveProgress
components/lesson/            # LessonArticle, LessonChecklist
data/content.ts               # phases, modules, topics (id ổn định), câu hỏi, rubric
data/lessons/                 # 41 bài học (phase-1/2/3.ts)
lib/progress.ts               # mô hình tiến độ, merge, streak, thống kê (pure)
lib/redis.ts                  # client Upstash REST tối giản
lib/grader.ts                 # chấm điểm mock interview theo rubric
```

## Học & theo dõi tiến độ

- Mỗi phase có các module; mỗi module (`/roadmap/[phaseId]/[moduleId]`) gồm các bài học: giải thích cho người mới, ví dụ đời thường, code mẫu, lỗi hay gặp, bài tập có lời giải, checklist tự kiểm tra, câu trả lời phỏng vấn mẫu.
- Đánh dấu trạng thái mỗi bài (Chưa học / Đang học / Hoàn thành). Dashboard tính tiến độ, chuỗi ngày học, điểm mock interview từ dữ liệu thật — không có số liệu fix cứng.
- Nội dung bài học: `data/lessons/phase-*.ts` (kiểu `Lesson` trong `data/lessons/types.ts`). Thêm câu hỏi phỏng vấn: `interviewQuestions` trong `data/content.ts`.
- **Không đổi `id` của topic** sau khi đã dùng — đó là khoá lưu tiến độ.

## Đồng bộ nhiều thiết bị

- Tiến độ lưu ngay trên trình duyệt (localStorage), rồi đồng bộ lên `/api/progress` (Upstash Redis qua REST).
- Env tự nhận: `KV_REST_API_URL` / `KV_REST_API_TOKEN` (Vercel Marketplace → Upstash) hoặc `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`. Không có env → chế độ chỉ-local.
- Ghi cần PIN (tạo lần đầu ngay trong app, nút đám mây trên header). PIN được hash bằng scrypt; sai 10 lần → khoá 15 phút. Server **merge** theo timestamp từng topic nên điện thoại và máy tính sửa song song không ghi đè nhau.

## Chấm điểm Mock Interview

| Tiêu chí | Trọng số |
|---|---|
| Concept coverage (theo rubric câu hỏi) | 40 |
| Trade-off & rủi ro | 20 |
| Cấu trúc (STAR cho behavioral) | 15 |
| Số liệu & công cụ cụ thể | 15 |
| Độ sâu | 10 |

Muốn dùng LLM thật: tạo Route Handler `app/api/grade/route.ts` gọi model với rubric làm context và trả về đúng kiểu `GradeResult` trong `lib/grader.ts` — UI không cần đổi.

## Ghi chú

`lucide-react` đang để `latest`; sau lần `npm install` đầu tiên, `package-lock.json` sẽ khoá version cụ thể.
