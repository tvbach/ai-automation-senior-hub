/* Tự sinh từ nội dung bài học — chỉnh sửa trực tiếp tại đây cũng được. */
import type { Lesson } from "./types";

export const phase1Lessons: Lesson[] = [
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
