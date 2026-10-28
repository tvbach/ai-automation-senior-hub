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
  layout.tsx                 # font (IBM Plex Sans + JetBrains Mono), header, footer
  globals.css                # Tailwind v4 + design tokens (@theme)
  page.tsx                   # Dashboard: hero, stats, 3 phase, tabs
  roadmap/[phaseId]/page.tsx # Trang chi tiết từng giai đoạn (static params)
  interview/page.tsx         # Interview Hub + Mock Interview Simulator
  not-found.tsx
components/
  site-header.tsx
  dashboard/  stat-card.tsx · phase-tabs.tsx
  interview/  interview-workspace.tsx · question-accordion.tsx · mock-simulator.tsx
  ui/         primitives.tsx · code-block.tsx
data/content.ts              # TOÀN BỘ nội dung: phases, modules, stats, câu hỏi, rubric
lib/grader.ts                # Chấm điểm giả lập theo rubric (deterministic, chạy client)
lib/cn.ts
```

## Chỉnh nội dung

- Cập nhật tiến độ: đổi `status` của từng topic trong `data/content.ts` (`done` | `in-progress` | `todo`). Thẻ “Tiến độ lộ trình” tự tính lại.
- Thêm câu hỏi: thêm object vào `interviewQuestions`, kèm `rubric` (concept + keywords, không cần dấu tiếng Việt).

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
