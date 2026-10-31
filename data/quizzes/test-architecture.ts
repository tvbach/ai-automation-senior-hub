import type { QuizQuestion } from "@/data/lessons/types";

/** Quiz cho phase "Test Architecture & Advanced SDET", khoá theo Topic.id */
export const testArchitectureQuizzes: Record<string, QuizQuestion[]> = {
  "pyramid-models": [
    {
      id: "slow-flaky-suite",
      prompt:
        "Suite của team có 400 test E2E và 60 unit test, chạy mất 55 phút và thường xuyên flaky. Hướng cải thiện hợp lý nhất là gì?",
      options: [
        { id: "a", text: "Thuê thêm runner để chạy 400 E2E song song" },
        { id: "b", text: "Đẩy logic xuống unit/integration, chỉ giữ E2E cho luồng quan trọng" },
        { id: "c", text: "Bật `retries: 3` để fail ngẫu nhiên tự biến mất" },
        { id: "d", text: "Chuyển unit test thành E2E cho sát thực tế" },
      ],
      answer: "b",
      explanation:
        "Đây là mô hình \"ice-cream cone\". Logic nên được bắt ở tầng thấp nhất có thể (nhanh, ổn định); E2E chỉ giữ cho luồng quan trọng. Thêm máy hay tăng retry chỉ che triệu chứng.",
    },
    {
      id: "ratio-rule",
      prompt: "Interviewer hỏi: \"Tỉ lệ unit/integration/E2E của bạn là bao nhiêu?\". Câu trả lời thể hiện tư duy Senior là:",
      options: [
        { id: "a", text: "70/20/10, chuẩn của Test Pyramid" },
        { id: "b", text: "Càng nhiều E2E càng tốt vì giống người dùng nhất" },
        { id: "c", text: "Không quan trọng, miễn coverage trên 80%" },
        { id: "d", text: "Tuỳ kiến trúc và rủi ro; tôi giải thích lý do cho hệ thống cụ thể" },
      ],
      answer: "d",
      explanation:
        "Không có tỉ lệ đúng cho mọi hệ thống. Senior được đánh giá ở khả năng lập luận phân bổ dựa trên kiến trúc, rủi ro và chi phí phản hồi.",
    },
    {
      id: "mock-five",
      prompt: "Để unit test một hàm, bạn phải mock 5 dependency. Đó là dấu hiệu gì?",
      options: [
        { id: "a", text: "Nên tách logic thuần ra, phần phối hợp thì viết integration test" },
        { id: "b", text: "Test đúng chuẩn, vì mọi dependency đã được cô lập hoàn toàn khỏi hàm cần test" },
        { id: "c", text: "Nên chuyển sang E2E" },
        { id: "d", text: "Nên mock thêm logger và config để test hoàn toàn không phụ thuộc môi trường" },
      ],
      answer: "a",
      explanation:
        "Mock quá nhiều khiến test chỉ kiểm tra lại các mock. Tách phần logic thuần ra để unit test, phần phối hợp thì dùng integration test.",
    },
  ],

  "risk-based": [
    {
      id: "score",
      prompt: "Tính năng A: Likelihood 4, Impact 5. Tính năng B: Likelihood 5, Impact 2. Theo risk-based testing, nên ưu tiên:",
      options: [
        { id: "a", text: "B, vì Likelihood cao nhất" },
        { id: "b", text: "Ngang nhau" },
        { id: "c", text: "A, vì risk score 20 cao hơn 10 của B" },
        { id: "d", text: "Tính năng nào dễ viết test hơn" },
      ],
      answer: "c",
      explanation: "Risk score = Likelihood × Impact. A = 20, B = 10, nên A được ưu tiên bảo vệ trước.",
    },
    {
      id: "update-matrix",
      prompt: "Coverage matrix nên được cập nhật khi nào?",
      options: [
        { id: "a", text: "Một lần lúc bắt đầu dự án" },
        { id: "b", text: "Định kỳ (ví dụ mỗi quý) và sau mỗi sự cố production" },
        { id: "c", text: "Khi có tester mới vào team để họ nắm được bức tranh tổng thể" },
        { id: "d", text: "Không cần khi suite vẫn xanh, vì xanh nghĩa là rủi ro đã được kiểm soát tốt" },
      ],
      answer: "b",
      explanation: "Rủi ro thay đổi theo code và theo sự cố thực tế, nên matrix phải được xem lại định kỳ.",
    },
    {
      id: "non-functional",
      prompt: "Khi lập ma trận rủi ro cho trang thanh toán, nhóm nào hay bị bỏ sót nhất?",
      options: [
        { id: "a", text: "Luồng thanh toán thành công" },
        { id: "b", text: "Nút \"Thanh toán\" hiển thị và bấm được trên các trình duyệt phổ biến" },
        { id: "c", text: "Validation số thẻ sai định dạng" },
        { id: "d", text: "Rủi ro phi chức năng: bảo mật, hiệu năng, a11y, dữ liệu cá nhân" },
      ],
      answer: "d",
      explanation: "Rủi ro không chỉ là chức năng. Bảo mật, hiệu năng, a11y và pháp lý cũng phải có trong matrix.",
    },
  ],

  "shift-left": [
    {
      id: "where-e2e",
      prompt: "E2E chỉ chạy trên staging sau khi merge, nên khi fail rất khó biết PR nào gây lỗi. Cách shift-left phù hợp là:",
      options: [
        { id: "a", text: "Chạy E2E trên preview của từng PR, đặt làm required check" },
        { id: "b", text: "Chạy E2E thủ công mỗi tuần" },
        { id: "c", text: "Tạm tắt E2E, dựa vào unit test cho đến khi có thời gian tối ưu suite" },
        { id: "d", text: "Chạy E2E trên production sau mỗi lần deploy để bắt lỗi sát người dùng nhất" },
      ],
      answer: "a",
      explanation: "Chạy trên preview của từng PR giúp lỗi thuộc về đúng PR gây ra nó; required check đảm bảo không merge khi đỏ.",
    },
    {
      id: "baseurl",
      prompt: "Test viết `page.goto('https://staging.shop.com/cart')`. Vấn đề và cách sửa?",
      options: [
        { id: "a", text: "Không vấn đề, URL đầy đủ rõ ràng hơn" },
        { id: "b", text: "Đưa URL vào biến toàn cục trong từng file test để dễ thay khi cần" },
        { id: "c", text: "Hard-code môi trường; dùng `baseURL` trong config và `goto('/cart')`" },
        { id: "d", text: "Thêm `waitForTimeout` sau `goto`" },
      ],
      answer: "c",
      explanation: "Với `baseURL`, cùng một test chạy được trên local, preview và staging chỉ bằng cách đổi cấu hình.",
    },
    {
      id: "required-check",
      prompt: "E2E đã chạy trên mỗi PR nhưng team vẫn merge khi test đỏ. Thiếu điều gì?",
      options: [
        { id: "a", text: "Thêm nhiều test E2E hơn" },
        { id: "b", text: "Bật Branch protection, đặt E2E là required check" },
        { id: "c", text: "Gửi email cho cả team mỗi khi có test fail để tăng mức độ chú ý" },
        { id: "d", text: "Tăng timeout để test ít đỏ hơn, giảm lý do để mọi người bỏ qua kết quả" },
      ],
      answer: "b",
      explanation: "Không có required check thì shift-left chỉ là hình thức: kết quả test không chặn được việc merge.",
    },
  ],

  "suite-slo": [
    {
      id: "metric",
      prompt: "Nên dùng chỉ số nào làm SLO cho thời gian chạy pipeline PR?",
      options: [
        { id: "a", text: "Thời gian trung bình, vì dễ giải thích cho cả team" },
        { id: "b", text: "Lần chạy nhanh nhất" },
        { id: "c", text: "Tổng thời gian chạy trong tháng, vì nó phản ánh trực tiếp chi phí runner" },
        { id: "d", text: "P95 (hoặc P90), phản ánh những lần chạy chậm" },
      ],
      answer: "d",
      explanation: "Trung bình che mất các lần chạy chậm bất thường. P95 phản ánh trải nghiệm tệ mà mọi người nhớ.",
    },
    {
      id: "retry-pass",
      prompt: "Một test fail lần đầu, pass ở lần retry. Nên ghi nhận thế nào?",
      options: [
        { id: "a", text: "Là test flaky: đếm và theo dõi riêng trong flaky rate" },
        { id: "b", text: "Là pass" },
        { id: "c", text: "Là fail, revert PR ngay" },
        { id: "d", text: "Xoá test vì không ổn định" },
      ],
      answer: "a",
      explanation: "Pass nhờ retry vẫn là tín hiệu không ổn định. Không đếm thì flaky rate luôn đẹp giả.",
    },
    {
      id: "error-budget",
      prompt: "Team đã dùng hết error budget của SLO flaky rate tháng này. Hành động hợp lý là:",
      options: [
        { id: "a", text: "Nâng ngưỡng SLO lên mức \"thực tế\" hơn để tháng sau không bị vi phạm nữa" },
        { id: "b", text: "Chờ budget reset đầu tháng" },
        { id: "c", text: "Ưu tiên sửa độ ổn định theo cam kết đã định" },
        { id: "d", text: "Tạm tắt thống kê flaky" },
      ],
      answer: "c",
      explanation: "Error budget có ý nghĩa khi gắn với hành động cụ thể (ví dụ tạm dừng thêm E2E mới) và owner rõ ràng.",
    },
  ],

  fixtures: [
    {
      id: "teardown",
      prompt: "Trong fixture, code dọn dẹp (xoá user test) nên đặt ở đâu?",
      options: [
        { id: "a", text: "Trong `beforeEach` của test kế tiếp" },
        { id: "b", text: "Ngay sau `await use(value)` trong cùng fixture" },
        { id: "c", text: "Trong một test riêng ở cuối file, chạy sau khi các test khác hoàn tất" },
        { id: "d", text: "Không cần dọn" },
      ],
      answer: "b",
      explanation: "Code sau `await use()` là phần teardown, chạy cả khi test fail, nên dữ liệu luôn được dọn.",
    },
    {
      id: "worker-page",
      prompt: "Một fixture `scope: 'worker'` cần mở trình duyệt để đăng nhập. Cách đúng là:",
      options: [
        { id: "a", text: "Nhận `page` làm tham số" },
        { id: "b", text: "Đổi sang `auto: true` để fixture được cấp `page` tự động cho mọi test" },
        { id: "c", text: "Khai báo `let page` toàn cục và gán trong `beforeAll` của từng file test" },
        { id: "d", text: "Dùng fixture `browser` rồi tự gọi `browser.newPage()`" },
      ],
      answer: "d",
      explanation: "Worker fixture chỉ được dùng worker fixture khác. `page` là test-scoped nên không dùng được ở đây.",
    },
    {
      id: "why-fixture",
      prompt: "So với `beforeEach` + biến `let user;`, lợi ích chính của custom fixture là:",
      options: [
        { id: "a", text: "Có kiểu dữ liệu, chỉ tạo khi cần, tự dọn dẹp và an toàn khi chạy song song" },
        { id: "b", text: "Bỏ qua assertion nên nhanh hơn" },
        { id: "c", text: "Không bao giờ cần teardown" },
        { id: "d", text: "Tự retry khi fail nên test ít đỏ do dữ liệu chuẩn bị lỗi" },
      ],
      answer: "a",
      explanation: "Fixture có vòng đời rõ ràng (setup → use → teardown), chỉ tạo khi test cần, và không rò rỉ giữa các test như biến toàn cục.",
    },
  ],

  "object-patterns": [
    {
      id: "assert-location",
      prompt: "Đặt `expect` ở đâu khi dùng Page Object?",
      options: [
        { id: "a", text: "Trong method `verifyLoggedIn()` để tái sử dụng ở nhiều test" },
        { id: "b", text: "Trong constructor, để page object tự kiểm tra trang đã tải đúng ngay khi được tạo" },
        { id: "c", text: "Trong test; page object trả về locator/dữ liệu" },
        { id: "d", text: "Trong global setup" },
      ],
      answer: "c",
      explanation: "Test là nơi khẳng định kết quả. Page object giấu chi tiết UI, không quyết định điều gì là đúng.",
    },
    {
      id: "basepage",
      prompt: "Framework có `BasePage` 80 method, các page kế thừa 3–4 tầng. Hướng cải thiện là:",
      options: [
        { id: "a", text: "Thêm tầng kế thừa theo module" },
        { id: "b", text: "Composition: page chứa các Component Object nhỏ, mỗi class một trách nhiệm" },
        { id: "c", text: "Gộp 80 method vào một file utils" },
        { id: "d", text: "Bỏ page object" },
      ],
      answer: "b",
      explanation: "Kế thừa sâu khó đọc và khó đổi. Composition với component object tái sử dụng tốt hơn cho UI dạng component.",
    },
    {
      id: "rule-of-three",
      prompt: "Có cần tạo page object cho một trang chỉ xuất hiện trong đúng 1 test?",
      options: [
        { id: "a", text: "Có, để thống nhất quy ước: mọi trang trong app đều phải có page object riêng" },
        { id: "b", text: "Có, và nên tách sẵn component object để dùng lại khi trang xuất hiện ở test khác" },
        { id: "c", text: "Không, và nên xoá luôn test đó" },
        { id: "d", text: "Chưa cần; chỉ trừu tượng hoá khi lặp lại thật" },
      ],
      answer: "d",
      explanation: "Trừu tượng hoá sớm tốn công bảo trì mà không mang lại lợi ích. Chờ đến khi lặp lại thật (rule of three).",
    },
  ],

  locators: [
    {
      id: "best-locator",
      prompt: "Cách chọn nút \"Thêm vào giỏ\" được khuyến nghị nhất là:",
      options: [
        { id: "a", text: "`getByRole('button', { name: 'Thêm vào giỏ' })`" },
        { id: "b", text: "`locator('//div[3]/button[2]')`" },
        { id: "c", text: "`locator('.product-card .btn.btn-primary.add-to-cart')`" },
        { id: "d", text: "`locator('button').nth(4)`" },
      ],
      answer: "a",
      explanation: "Locator theo role + accessible name gần với cách người dùng nhìn thấy, bền khi CSS đổi và kiểm tra luôn a11y.",
    },
    {
      id: "strict-mode",
      prompt: "Locator khớp 3 nút \"Xoá\" nên Playwright báo lỗi strict mode. Cách xử lý tốt nhất?",
      options: [
        { id: "a", text: "Thêm `.first()` vì nút đầu thường là sản phẩm vừa thêm" },
        { id: "b", text: "Chain từ hàng sản phẩm cụ thể hoặc dùng `filter({ hasText })`" },
        { id: "c", text: "Tắt strict mode trong config" },
        { id: "d", text: "Đổi sang XPath tuyệt đối" },
      ],
      answer: "b",
      explanation: "`.first()` che giấu locator mơ hồ và dễ click nhầm khi thứ tự đổi. Hãy nói rõ bạn muốn phần tử nào.",
    },
    {
      id: "testid",
      prompt: "Khi nào nên dùng `getByTestId`?",
      options: [
        { id: "a", text: "Cho mọi phần tử, để cả team dùng một quy ước thống nhất và dễ review" },
        { id: "b", text: "Không bao giờ, vì test id làm lộ chi tiết triển khai vào trong test" },
        { id: "c", text: "Là phương án cuối, khi không có role/label ổn định" },
        { id: "d", text: "Chỉ cho nút bấm, còn input và link thì dùng CSS selector cho nhanh" },
      ],
      answer: "c",
      explanation: "Test id ổn định nhưng không phản ánh trải nghiệm người dùng. Ưu tiên role và label trước, ví dụ chỉ dùng test id cho phần tử phụ thuộc ngôn ngữ trong app i18n.",
    },
  ],

  "auth-state": [
    {
      id: "login-every-test",
      prompt: "300 test, mỗi test đăng nhập qua form mất 4 giây. Cách tối ưu là:",
      options: [
        { id: "a", text: "Tăng gấp đôi số worker" },
        { id: "b", text: "Chỉ test các trang public để không phải đăng nhập trong suite" },
        { id: "c", text: "Giảm timeout của form đăng nhập" },
        { id: "d", text: "Đăng nhập một lần trong setup project, tái sử dụng `storageState`" },
      ],
      answer: "d",
      explanation: "Setup project chạy trước (qua `dependencies`), lưu cookie/localStorage một lần cho mỗi role.",
    },
    {
      id: "gitignore",
      prompt: "File `playwright/.auth/admin.json` có nên commit lên git?",
      options: [
        { id: "a", text: "Không, vì chứa session hợp lệ; thêm vào `.gitignore`" },
        { id: "b", text: "Có, để CI dùng chung và không phải đăng nhập lại mỗi lần chạy" },
        { id: "c", text: "Có, nếu repo private" },
        { id: "d", text: "Chỉ commit bản của role user thường vì quyền thấp nên ít rủi ro" },
      ],
      answer: "a",
      explanation: "storageState chứa session thật, lộ ra là ai cũng đăng nhập được. CI tự tạo lại qua setup project.",
    },
    {
      id: "shared-account",
      prompt: "Nhiều worker cùng dùng một tài khoản và cùng sửa địa chỉ giao hàng, test fail ngẫu nhiên. Nguyên nhân và cách sửa?",
      options: [
        { id: "a", text: "Mạng chậm khi nhiều worker gọi API cùng lúc; nên tăng timeout lên gấp đôi" },
        { id: "b", text: "Xung đột dữ liệu dùng chung; mỗi worker một tài khoản riêng" },
        { id: "c", text: "storageState hết hạn giữa chừng; nên đăng nhập lại trong mỗi test cho chắc chắn" },
        { id: "d", text: "Do lỗi của Playwright khi chạy song song; nên chạy với 1 worker cho an toàn" },
      ],
      answer: "b",
      explanation: "Chia sẻ trạng thái giữa các worker gây race condition. Tách tài khoản theo worker giữ được tốc độ song song.",
    },
  ],

  "network-mocking": [
    {
      id: "route-order",
      prompt: "Test gọi `page.goto('/products')` rồi mới `page.route('**/api/products', ...)`, nhưng mock không có tác dụng. Vì sao?",
      options: [
        { id: "a", text: "Glob `**/api/products` không khớp query string" },
        { id: "b", text: "`page.route` cần file HAR" },
        { id: "c", text: "Request đã gửi trước khi route được đăng ký; phải route trước `goto`" },
        { id: "d", text: "`page.route` chỉ chặn POST" },
      ],
      answer: "c",
      explanation: "Route chỉ chặn request phát sinh sau khi đăng ký. Đăng ký trước `goto`.",
    },
    {
      id: "simulate-500",
      prompt: "Muốn kiểm tra UI hiển thị thông báo lỗi khi API trả 500, dùng gì?",
      options: [
        { id: "a", text: "`route.fulfill({ status: 500, json: { … } })`" },
        { id: "b", text: "`route.abort()`" },
        { id: "c", text: "Tắt server backend thật trong lúc test chạy để API không phản hồi" },
        { id: "d", text: "`route.continue()` kèm header đặc biệt để backend tự trả lỗi" },
      ],
      answer: "a",
      explanation: "`fulfill` trả response giả với status tuỳ ý. `abort` giả lập mất mạng, là tình huống khác.",
    },
    {
      id: "mock-everything",
      prompt: "Team mock mọi API trong mọi E2E và suite luôn xanh, nhưng production vẫn lỗi tích hợp. Thiếu điều gì?",
      options: [
        { id: "a", text: "Mock thêm endpoint còn thiếu để bao phủ đầy đủ mọi API của hệ thống" },
        { id: "b", text: "Ghi HAR một lần rồi dùng mãi" },
        { id: "c", text: "Bật retries" },
        { id: "d", text: "Critical journey chạy với backend thật, cộng contract test" },
      ],
      answer: "d",
      explanation: "Mock phù hợp cho edge case và lỗi. Luồng chính cần chạy thật, và contract test bắt sai lệch giữa mock với API.",
    },
  ],

  "data-factory": [
    {
      id: "seed-ui",
      prompt: "Để test trang chi tiết đơn hàng, cách chuẩn bị dữ liệu tốt nhất là:",
      options: [
        { id: "a", text: "Click qua UI admin để tạo sản phẩm và đơn hàng, giống thao tác thật" },
        { id: "b", text: "Seed qua API bằng data factory, test chỉ tập trung vào trang cần kiểm tra" },
        { id: "c", text: "Dùng đơn hàng id 5 có sẵn" },
        { id: "d", text: "Chạy SQL thủ công trước suite" },
      ],
      answer: "b",
      explanation: "Seed qua API nhanh và ổn định. UI là đối tượng được test, không phải công cụ chuẩn bị dữ liệu.",
    },
    {
      id: "fixed-email",
      prompt: "Mọi test đăng ký đều dùng `test@example.com`. Khi bật chạy song song sẽ xảy ra gì?",
      options: [
        { id: "a", text: "Không ảnh hưởng, vì mỗi worker có browser context riêng biệt" },
        { id: "b", text: "Test chạy nhanh hơn" },
        { id: "c", text: "Test đụng nhau (email đã tồn tại); cần giá trị duy nhất" },
        { id: "d", text: "Playwright tự thêm hậu tố khác nhau cho email ở mỗi worker để tránh trùng" },
      ],
      answer: "c",
      explanation: "Dữ liệu duy nhất (ví dụ thêm workerIndex + timestamp) là điều kiện để chạy song song an toàn.",
    },
    {
      id: "factory-shape",
      prompt: "Một data factory tốt nên:",
      options: [
        { id: "a", text: "Trả object hợp lệ mặc định, cho phép ghi đè từng phần" },
        { id: "b", text: "Bắt test truyền đủ mọi field" },
        { id: "c", text: "Sinh dữ liệu ngẫu nhiên hoàn toàn" },
        { id: "d", text: "Sao chép từ production" },
      ],
      answer: "a",
      explanation: "Mặc định hợp lệ giúp test ngắn gọn; ghi đè từng phần giúp nêu rõ điều test đang quan tâm.",
    },
  ],

  "worker-isolation": [
    {
      id: "index-choice",
      prompt: "Muốn gán cố định tenant `tenant-0..3` cho 4 worker, nên dùng chỉ số nào?",
      options: [
        { id: "a", text: "`workerIndex`, vì đó là định danh duy nhất của mỗi worker process" },
        { id: "b", text: "`Math.random()`" },
        { id: "c", text: "Số thứ tự của test trong file" },
        { id: "d", text: "`parallelIndex`" },
      ],
      answer: "d",
      explanation: "`parallelIndex` luôn nằm trong 0..workers-1. `workerIndex` tăng dần mỗi khi worker được tạo lại sau lỗi, nên không phù hợp để map tài nguyên cố định.",
    },
    {
      id: "dependent-tests",
      prompt: "Test B cần đơn hàng do test A tạo ra. Vấn đề là gì?",
      options: [
        { id: "a", text: "Không sao, miễn A chạy trước" },
        { id: "b", text: "Hai test phụ thuộc nhau; mỗi test nên tự seed dữ liệu" },
        { id: "c", text: "Nên gộp A và B" },
        { id: "d", text: "Nên tăng retries cho B" },
      ],
      answer: "b",
      explanation: "Test phải độc lập, nếu không sẽ fail khi chạy song song hoặc chạy riêng. Nếu bắt buộc tuần tự thì dùng `mode: 'serial'` có chủ đích và ghi rõ lý do.",
    },
    {
      id: "truncate",
      prompt: "`beforeAll` xoá toàn bộ bảng `orders` làm worker khác fail. Cách sửa?",
      options: [
        { id: "a", text: "Chỉ dọn dữ liệu thuộc tenant/tiền tố của chính worker đó" },
        { id: "b", text: "Giảm xuống 1 worker để không còn worker nào khác bị ảnh hưởng bởi lệnh xoá" },
        { id: "c", text: "Chuyển lệnh xoá bảng sang `afterAll` để chạy sau khi các test trong file xong" },
        { id: "d", text: "Thêm `waitForTimeout(2000)` để worker khác kịp đọc dữ liệu trước khi bị xoá" },
      ],
      answer: "a",
      explanation: "Mỗi worker chỉ được chạm vào dữ liệu của mình. Dọn toàn cục phá vỡ isolation.",
    },
  ],

  cleanup: [
    {
      id: "safety-net",
      prompt: "Fixture đã có teardown, nhưng khi CI bị huỷ giữa chừng, dữ liệu vẫn tồn đọng. Bổ sung gì?",
      options: [
        { id: "a", text: "Không cần, vì teardown luôn chạy kể cả khi job bị huỷ" },
        { id: "b", text: "Xoá toàn bộ DB mỗi đêm" },
        { id: "c", text: "TTL sweeper định kỳ xoá dữ liệu test quá hạn" },
        { id: "d", text: "Tắt tính năng huỷ job trên CI để teardown luôn có cơ hội chạy đến cuối" },
      ],
      answer: "c",
      explanation: "Teardown không chạy khi tiến trình bị kill. Sweeper theo tuổi dữ liệu là lưới an toàn dọn phần còn sót.",
    },
    {
      id: "sweeper-scope",
      prompt: "Điều kiện xoá của sweeper trên staging dùng chung nên như thế nào?",
      options: [
        { id: "a", text: "Mọi bản ghi tạo hơn 1 ngày" },
        { id: "b", text: "Dấu hiệu rõ ràng (tiền tố, cờ test) kết hợp tuổi dữ liệu" },
        { id: "c", text: "Mọi bản ghi có email chứa chữ \"test\" ở bất kỳ vị trí nào trong địa chỉ" },
        { id: "d", text: "Khi DB vượt ngưỡng dung lượng" },
      ],
      answer: "b",
      explanation: "Điều kiện quá rộng có thể xoá nhầm dữ liệu thật của người khác trên môi trường dùng chung.",
    },
    {
      id: "ephemeral-cost",
      prompt: "Tạo ephemeral DB mất 10 phút. Cách dùng hợp lý là:",
      options: [
        { id: "a", text: "Cho mọi PR, kể cả PR chỉ sửa README, để môi trường luôn sạch nhất" },
        { id: "b", text: "Không bao giờ dùng" },
        { id: "c", text: "Tạo một lần, dùng chung mãi" },
        { id: "d", text: "Nightly hoặc merge queue; PR dùng isolation theo tenant" },
      ],
      answer: "d",
      explanation: "Ephemeral là môi trường sạch nhất nhưng đắt. Cân đối chi phí với tốc độ phản hồi của PR.",
    },
  ],

  "ct-vs-vitest": [
    {
      id: "jsdom-layout",
      prompt: "Test Vitest + jsdom kiểm tra tooltip không tràn màn hình luôn thấy toạ độ bằng 0. Vì sao?",
      options: [
        { id: "a", text: "jsdom không có layout thật; kiểm tra vị trí cần Playwright CT hoặc E2E" },
        { id: "b", text: "Thiếu `await`" },
        { id: "c", text: "Cần mock `getBoundingClientRect`" },
        { id: "d", text: "CSS chưa được import" },
      ],
      answer: "a",
      explanation: "jsdom chỉ mô phỏng DOM, không tính layout. Thứ gì phụ thuộc kích thước/vị trí cần trình duyệt thật.",
    },
    {
      id: "query",
      prompt: "Cách tìm phần tử được Testing Library khuyến nghị là:",
      options: [
        { id: "a", text: "`container.querySelector('.btn-primary')` vì class ổn định trong design system" },
        { id: "b", text: "`screen.getByRole('button', { name: 'Lưu' })`" },
        { id: "c", text: "`getElementsByTagName('button')[0]`, nhanh và không phụ thuộc text hiển thị" },
        { id: "d", text: "Đọc state nội bộ của component để kiểm tra chính xác giá trị hiện tại" },
      ],
      answer: "b",
      explanation: "Tìm theo role và tên mà người dùng thấy giúp test bền với thay đổi CSS và kiểm tra luôn accessibility.",
    },
    {
      id: "what-to-assert",
      prompt: "Test component giỏ hàng nên khẳng định điều gì?",
      options: [
        { id: "a", text: "Giá trị biến state `qty` bên trong component sau mỗi lần người dùng bấm nút" },
        { id: "b", text: "Hàm `setQty` được gọi đúng số lần với đúng tham số mong đợi" },
        { id: "c", text: "Điều người dùng thấy: số lượng, nút bị khoá, thông báo" },
        { id: "d", text: "Snapshot toàn bộ HTML" },
      ],
      answer: "c",
      explanation: "Kiểm tra hành vi quan sát được thì refactor nội bộ không làm gãy test.",
    },
  ],

  "rsc-server-actions": [
    {
      id: "validation-branches",
      prompt: "Server Action đăng ký có 8 nhánh validation. Phân bổ test hợp lý là:",
      options: [
        { id: "a", text: "8 test E2E, mỗi nhánh một test, vì chỉ E2E mới chạy đúng Server Action" },
        { id: "b", text: "Không test" },
        { id: "c", text: "Một snapshot test cho form" },
        { id: "d", text: "Unit test từng nhánh; E2E giữ một luồng đúng và một luồng lỗi" },
      ],
      answer: "d",
      explanation: "Logic validation rẻ nhất khi test ở unit. E2E chỉ cần chứng minh form được nối đúng.",
    },
    {
      id: "what-to-mock",
      prompt: "Khi unit test Server Action với Vitest, nên mock những gì?",
      options: [
        { id: "a", text: "Ranh giới ngoài: DB, `next/cache`, API bên thứ ba" },
        { id: "b", text: "Chính hàm validation đang test, để test chạy nhanh và ổn định hơn" },
        { id: "c", text: "Không mock gì, gọi thẳng DB production để kết quả sát thực tế nhất có thể" },
        { id: "d", text: "Mock `FormData`" },
      ],
      answer: "a",
      explanation: "Mock ranh giới ngoài để test chạy nhanh, nhưng giữ thật phần logic đang được kiểm tra.",
    },
    {
      id: "thin-component",
      prompt: "\"Server Component không test được\" thường là triệu chứng của điều gì?",
      options: [
        { id: "a", text: "Thiếu thư viện test" },
        { id: "b", text: "Logic bị nhồi trong `page.tsx`; nên tách ra hàm thuần trong `lib/`" },
        { id: "c", text: "Next.js không cho test" },
        { id: "d", text: "Nên chuyển hết sang Client Component để dùng được Testing Library quen thuộc" },
      ],
      answer: "b",
      explanation: "Component mỏng chỉ hiển thị dữ liệu; logic nằm ở hàm thuần dễ unit test, phần nối ghép để E2E lo.",
    },
  ],

  "contract-testing": [
    {
      id: "scope",
      prompt: "Contract test giữa frontend và API đơn hàng nên kiểm tra điều gì?",
      options: [
        { id: "a", text: "Tổng tiền tính đúng theo giá, số lượng và mã giảm giá" },
        { id: "b", text: "Màu sắc giao diện" },
        { id: "c", text: "Hình dạng giao tiếp: field, kiểu dữ liệu, status code" },
        { id: "d", text: "Thời gian phản hồi" },
      ],
      answer: "c",
      explanation: "Contract test chỉ kiểm tra cam kết giao tiếp. Logic nghiệp vụ là việc của test phía provider.",
    },
    {
      id: "matchers",
      prompt: "Contract ghi cứng `total: 199000`, chỉ cần dữ liệu đổi là fail. Cách sửa?",
      options: [
        { id: "a", text: "Cập nhật con số trong contract mỗi khi dữ liệu test thay đổi" },
        { id: "b", text: "Xoá field `total`" },
        { id: "c", text: "Tắt provider verification cho riêng endpoint đơn hàng này" },
        { id: "d", text: "Dùng matcher theo kiểu (`like`, `integer`)" },
      ],
      answer: "d",
      explanation: "Matcher so theo kiểu dữ liệu nên contract không gãy vì giá trị thay đổi hợp lệ.",
    },
    {
      id: "zod-infer",
      prompt: "Type TypeScript và Zod schema của cùng một response lâu dần lệch nhau. Giải pháp?",
      options: [
        { id: "a", text: "Sinh type từ schema: `z.infer<typeof Schema>`" },
        { id: "b", text: "Thêm comment nhắc mọi người cập nhật cả hai cùng lúc mỗi khi sửa" },
        { id: "c", text: "Bỏ schema, chỉ giữ type" },
        { id: "d", text: "Dùng `any`" },
      ],
      answer: "a",
      explanation: "Một nguồn sự thật duy nhất: schema vừa validate lúc chạy vừa sinh type lúc biên dịch.",
    },
  ],
};
