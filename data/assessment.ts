/**
 * data/assessment.ts — Skill Assessment đầu vào: 2 câu cho mỗi kỹ năng.
 *
 * Mục đích là chẩn đoán điểm xuất phát, không phải thi: kết quả giúp gợi ý
 * phase nào học kỹ, phase nào có thể học lướt (làm quiz để kiểm tra luôn).
 * Câu hỏi đi từ nền tảng đến nâng cao để người mới cũng làm được.
 * Cùng quy ước với data/quizzes (4 lựa chọn, đáp án không lộ theo vị trí/độ dài).
 */
import type { SkillId } from "@/data/content";
import type { QuizQuestion } from "@/data/lessons/types";

export interface AssessmentQuestion extends QuizQuestion {
  skill: SkillId;
}

export const ASSESSMENT_VERSION = 1;

export const assessmentQuestions: AssessmentQuestion[] = [
  /* ------------------------------------------------ testing-fundamentals */
  {
    id: "tf-retest",
    skill: "testing-fundamentals",
    prompt: "Dev vừa sửa lỗi \"không áp được mã giảm giá\". Retesting khác regression testing thế nào?",
    options: [
      { id: "a", text: "Retesting kiểm tra lại đúng lỗi vừa sửa; regression kiểm tra phần khác không bị hỏng" },
      { id: "b", text: "Hai khái niệm giống nhau" },
      { id: "c", text: "Retesting do dev làm, regression do tester làm" },
      { id: "d", text: "Retesting chạy tự động, còn regression luôn phải chạy thủ công từng bước" },
    ],
    answer: "a",
    explanation:
      "Retesting xác nhận lỗi cụ thể đã được sửa. Regression testing kiểm tra thay đổi đó không làm hỏng chức năng khác đang chạy tốt.",
  },
  {
    id: "tf-verify-validate",
    skill: "testing-fundamentals",
    prompt: "Phát biểu nào đúng về Verification và Validation?",
    options: [
      { id: "a", text: "Verification là test tự động chạy trong CI, còn Validation là test thủ công do người dùng thật thực hiện" },
      { id: "b", text: "Verification chỉ làm ở production, Validation chỉ làm ở môi trường staging trước khi phát hành" },
      { id: "c", text: "Verification: làm đúng theo đặc tả; Validation: làm ra đúng thứ người dùng cần" },
      { id: "d", text: "Không có khác biệt thực tế; hai từ được dùng thay thế cho nhau trong hầu hết tài liệu ISTQB" },
    ],
    answer: "c",
    explanation: "Có thể làm đúng hoàn toàn theo spec (verification đạt) mà sản phẩm vẫn không giải quyết vấn đề của người dùng (validation không đạt).",
  },

  /* ------------------------------------------------------------ test-design */
  {
    id: "td-boundary",
    skill: "test-design",
    prompt: "Ô \"tuổi\" chấp nhận từ 18 đến 60. Bộ giá trị theo Boundary Value Analysis là:",
    options: [
      { id: "a", text: "18 và 60" },
      { id: "b", text: "17, 18, 60, 61" },
      { id: "c", text: "Mọi số từ 18 đến 60 để chắc chắn không bỏ sót trường hợp nào" },
      { id: "d", text: "30, 40, 50" },
    ],
    answer: "b",
    explanation: "Lỗi off-by-one hay nằm ở biên, nên test cả giá trị tại biên và ngay ngoài biên ở hai đầu.",
  },
  {
    id: "td-severity",
    skill: "test-design",
    prompt: "Tên công ty bị sai chính tả trên trang chủ, ngay trước buổi ra mắt sản phẩm. Severity và priority hợp lý là:",
    options: [
      { id: "a", text: "Severity cao, priority thấp vì không ảnh hưởng chức năng nào" },
      { id: "b", text: "Severity cao, priority cao vì mọi lỗi trên trang chủ đều nghiêm trọng như nhau" },
      { id: "c", text: "Không cần ghi nhận" },
      { id: "d", text: "Severity thấp, priority cao" },
    ],
    answer: "d",
    explanation: "Severity đo mức ảnh hưởng kỹ thuật (thấp: không hỏng chức năng); priority đo độ gấp về nghiệp vụ (cao: ảnh hưởng thương hiệu ngay trước ra mắt).",
  },

  /* ------------------------------------------------------------- typescript */
  {
    id: "ts-foreach-async",
    skill: "typescript",
    prompt: "Đoạn code `items.forEach(async (i) => await save(i)); console.log('done');` có vấn đề gì?",
    options: [
      { id: "a", text: "Không có vấn đề" },
      { id: "b", text: "`forEach` không chờ promise, nên 'done' có thể in ra trước khi lưu xong" },
      { id: "c", text: "Thiếu kiểu dữ liệu cho tham số `i`" },
      { id: "d", text: "`await` bên trong arrow function là cú pháp không hợp lệ trong TypeScript" },
    ],
    answer: "b",
    explanation: "Dùng `for...of` với `await`, hoặc `await Promise.all(items.map(save))` nếu muốn chạy song song.",
  },
  {
    id: "ts-unknown",
    skill: "typescript",
    prompt: "Nên khai báo kiểu gì cho dữ liệu JSON vừa nhận từ API mà chưa kiểm tra?",
    options: [
      { id: "a", text: "`any`, cho tiện truy cập mọi field" },
      { id: "b", text: "Ép `as Order` ngay khi nhận về" },
      { id: "c", text: "`never`" },
      { id: "d", text: "`unknown`, rồi validate trước khi dùng" },
    ],
    answer: "d",
    explanation: "`unknown` buộc bạn kiểm tra (ví dụ bằng Zod) trước khi dùng; `as` chỉ là lời hứa với compiler, không kiểm tra lúc chạy.",
  },

  /* ------------------------------------------------------------ api-testing */
  {
    id: "api-201",
    skill: "api-testing",
    prompt: "`POST /orders` tạo đơn hàng thành công. Status code phù hợp nhất là:",
    options: [
      { id: "a", text: "200 OK" },
      { id: "b", text: "204 No Content, vì client đã biết dữ liệu mình vừa gửi lên" },
      { id: "c", text: "201 Created" },
      { id: "d", text: "302 Found để chuyển hướng sang trang chi tiết đơn hàng vừa tạo" },
    ],
    answer: "c",
    explanation: "201 cho biết tài nguyên mới đã được tạo, thường kèm header `Location` hoặc body là tài nguyên đó.",
  },
  {
    id: "api-403",
    skill: "api-testing",
    prompt: "Gọi API với token hợp lệ nhưng tài khoản không có quyền xem tài nguyên. API nên trả:",
    options: [
      { id: "a", text: "403 Forbidden" },
      { id: "b", text: "401 Unauthorized vì người dùng chưa được cấp quyền" },
      { id: "c", text: "500 Internal Server Error" },
      { id: "d", text: "200 OK với body rỗng để không làm lộ sự tồn tại của tài nguyên" },
    ],
    answer: "a",
    explanation: "401 là chưa xác thực (thiếu/sai token); 403 là đã xác thực nhưng không đủ quyền. Một số hệ thống trả 404 để giấu tài nguyên, nhưng 200 rỗng thì không.",
  },

  /* ---------------------------------------------------------- ui-automation */
  {
    id: "ui-hard-wait",
    skill: "ui-automation",
    prompt: "Test có `await page.waitForTimeout(3000)` trước mỗi lần click. Nhận xét nào đúng?",
    options: [
      { id: "a", text: "Tốt, giúp test ổn định hơn trên CI chậm" },
      { id: "b", text: "Nên tăng lên 5000 cho chắc" },
      { id: "c", text: "Không ảnh hưởng gì đến thời gian chạy suite" },
      { id: "d", text: "Hard wait vừa chậm vừa vẫn flaky; dựa vào auto-wait và web-first assertion" },
    ],
    answer: "d",
    explanation: "Playwright tự chờ phần tử sẵn sàng trước khi thao tác. Hard wait luôn tốn đủ thời gian và vẫn fail khi hệ thống chậm hơn mức đã đoán.",
  },
  {
    id: "ui-web-first",
    skill: "ui-automation",
    prompt: "Assertion nào tự chờ cho đến khi điều kiện đúng (hoặc hết timeout)?",
    options: [
      { id: "a", text: "`expect(await locator.textContent()).toBe('Đã lưu')`" },
      { id: "b", text: "`await expect(locator).toHaveText('Đã lưu')`" },
      { id: "c", text: "`expect(locator.isVisible()).toBeTruthy()`" },
      { id: "d", text: "`if (await locator.isVisible()) expect(true).toBe(true)`" },
    ],
    answer: "b",
    explanation: "Web-first assertion (`await expect(locator)...`) thử lại cho đến khi đạt. Đọc giá trị một lần rồi so sánh thì chỉ chụp một thời điểm.",
  },

  /* ------------------------------------------------------ test-architecture */
  {
    id: "arch-component-object",
    skill: "test-architecture",
    prompt: "Khi nào nên tách một Component Object riêng thay vì viết thẳng trong Page Object?",
    options: [
      { id: "a", text: "Khi thành phần UI đó lặp lại ở nhiều trang" },
      { id: "b", text: "Luôn luôn, mỗi nút một class" },
      { id: "c", text: "Không bao giờ, vì Page Object là đủ" },
      { id: "d", text: "Khi trang có hơn 10 locator, bất kể chúng có được dùng lại ở trang khác hay không" },
    ],
    answer: "a",
    explanation: "Component Object (ví dụ header, bảng dữ liệu, date picker) đáng tách khi được dùng lại; trừu tượng hoá sớm chỉ thêm chi phí.",
  },
  {
    id: "arch-independent",
    skill: "test-architecture",
    prompt: "Vì sao mỗi test nên độc lập với các test khác?",
    options: [
      { id: "a", text: "Để mỗi file test ngắn gọn hơn, dễ đọc hơn khi review và dễ đặt tên test cho rõ ràng" },
      { id: "b", text: "Vì Playwright không cho phép test dùng chung dữ liệu dưới bất kỳ hình thức nào" },
      { id: "c", text: "Để chạy song song, chạy riêng lẻ hay theo thứ tự bất kỳ đều cho cùng kết quả" },
      { id: "d", text: "Để tiết kiệm bộ nhớ của runner vì mỗi test không phải giữ lại dữ liệu của test chạy trước nó" },
    ],
    answer: "c",
    explanation: "Test phụ thuộc nhau gãy khi chạy song song, khi chạy lại một test lẻ, hoặc khi thứ tự thay đổi.",
  },

  /* -------------------------------------------------------------- test-data */
  {
    id: "data-seed",
    skill: "test-data",
    prompt: "Cách chuẩn bị dữ liệu cho E2E vừa nhanh vừa ổn định nhất là:",
    options: [
      { id: "a", text: "Dùng dữ liệu có sẵn trên staging mà cả team đang dùng chung hằng ngày" },
      { id: "b", text: "Tạo qua API hoặc data factory ngay trong test" },
      { id: "c", text: "Tạo bằng cách click qua UI" },
      { id: "d", text: "Nhờ dev chèn tay vào DB" },
    ],
    answer: "b",
    explanation: "Mỗi test tự tạo dữ liệu riêng qua API: nhanh, lặp lại được và không phụ thuộc trạng thái môi trường.",
  },
  {
    id: "data-parallel",
    skill: "test-data",
    prompt: "Hai test chạy song song cùng sửa hồ sơ của một tài khoản và thỉnh thoảng fail. Cách sửa đúng gốc là:",
    options: [
      { id: "a", text: "Chạy tuần tự toàn bộ suite" },
      { id: "b", text: "Thêm retry cho hai test đó" },
      { id: "c", text: "Thêm `waitForTimeout` cho lệch nhau" },
      { id: "d", text: "Mỗi test dùng dữ liệu riêng, duy nhất" },
    ],
    answer: "d",
    explanation: "Dữ liệu dùng chung là nguồn race condition. Dữ liệu riêng cho từng test giữ được tốc độ song song.",
  },

  /* ------------------------------------------------------------------ ci-cd */
  {
    id: "ci-required-check",
    skill: "ci-cd",
    prompt: "Trong GitHub, \"required status check\" dùng để làm gì?",
    options: [
      { id: "a", text: "Tự động chạy lại test khi fail cho đến khi xanh" },
      { id: "b", text: "Chặn merge Pull Request khi check đó chưa xanh" },
      { id: "c", text: "Gửi thông báo cho reviewer" },
      { id: "d", text: "Ghi log thời gian chạy của từng job để phân tích chi phí runner hằng tháng" },
    ],
    answer: "b",
    explanation: "Required check biến kết quả CI thành điều kiện bắt buộc để merge, thay vì chỉ là thông tin tham khảo.",
  },
  {
    id: "ci-sharding",
    skill: "ci-cd",
    prompt: "Sharding test trong CI nghĩa là:",
    options: [
      { id: "a", text: "Chia suite thành nhiều phần chạy song song trên nhiều máy" },
      { id: "b", text: "Chỉ chạy test liên quan đến file thay đổi trong Pull Request" },
      { id: "c", text: "Chạy lại test fail" },
      { id: "d", text: "Nén report để tải lên nhanh hơn sau mỗi lần chạy trên runner" },
    ],
    answer: "a",
    explanation: "Sharding giảm thời gian chờ (wall time) bằng cách chia việc. Chọn test theo thay đổi là Test Impact Analysis, một kỹ thuật khác.",
  },

  /* ------------------------------------------------------------ reliability */
  {
    id: "rel-flaky",
    skill: "reliability",
    prompt: "Test nào được gọi là flaky?",
    options: [
      { id: "a", text: "Test luôn fail sau một commit cụ thể" },
      { id: "b", text: "Test chạy rất lâu" },
      { id: "c", text: "Test lúc pass lúc fail trên cùng một phiên bản code" },
      { id: "d", text: "Test chỉ fail trên máy một người" },
    ],
    answer: "c",
    explanation: "Flaky là kết quả không ổn định khi code không đổi. Fail ổn định sau một commit là tín hiệu bug thật.",
  },
  {
    id: "rel-quarantine",
    skill: "reliability",
    prompt: "Một test flaky đang chặn merge của cả team. Cách xử lý chuyên nghiệp là:",
    options: [
      { id: "a", text: "Xoá test" },
      { id: "b", text: "Bật `retries: 5` cho toàn bộ suite để không ai bị chặn nữa" },
      { id: "c", text: "Bỏ qua và merge" },
      { id: "d", text: "Cách ly (quarantine) có owner và hạn sửa, đồng thời điều tra nguyên nhân" },
    ],
    answer: "d",
    explanation: "Quarantine gỡ chặn cho team mà không mất dấu vấn đề; owner và hạn sửa đảm bảo test quay lại suite chính.",
  },

  /* ---------------------------------------------------- quality-engineering */
  {
    id: "qe-contract",
    skill: "quality-engineering",
    prompt: "Contract test giữa frontend (consumer) và backend (provider) kiểm tra điều gì?",
    options: [
      { id: "a", text: "Cam kết giao tiếp: field, kiểu dữ liệu, status code" },
      { id: "b", text: "Giao diện hiển thị đúng như bản thiết kế đã duyệt trên Figma" },
      { id: "c", text: "API chịu được 1.000 request mỗi giây trong giờ cao điểm mà không tăng độ trễ" },
      { id: "d", text: "Logic tính tiền của đơn hàng có áp dụng đúng mã giảm giá không" },
    ],
    answer: "a",
    explanation: "Contract test chỉ đảm bảo hai bên vẫn hiểu nhau. Logic nghiệp vụ, hiệu năng và giao diện có loại test riêng.",
  },
  {
    id: "qe-axe",
    skill: "quality-engineering",
    prompt: "Quét accessibility tự động (ví dụ axe) trong CI cho kết quả \"0 lỗi\". Kết luận nào đúng?",
    options: [
      { id: "a", text: "Trang đã đạt chuẩn accessibility hoàn toàn" },
      { id: "b", text: "Chỉ cần quét lại mỗi năm một lần" },
      { id: "c", text: "Không có lỗi tự động phát hiện được; vẫn cần kiểm tra thủ công (bàn phím, screen reader)" },
      { id: "d", text: "Axe chỉ kiểm tra màu sắc" },
    ],
    answer: "c",
    explanation: "Công cụ tự động chỉ bắt được một phần lỗi (thiếu label, tương phản…). Thứ tự focus, nội dung có ý nghĩa… cần người kiểm tra.",
  },

  /* ------------------------------------------------------------- ai-testing */
  {
    id: "ai-validate",
    skill: "ai-testing",
    prompt: "Đã yêu cầu LLM trả về JSON đúng schema. Vì sao vẫn phải validate output?",
    options: [
      { id: "a", text: "Không cần, vì schema đã được truyền cho model ngay trong request" },
      { id: "b", text: "Model vẫn có thể trả thiếu field hoặc sai kiểu" },
      { id: "c", text: "Để đếm số token" },
      { id: "d", text: "Vì JSON luôn bị lỗi" },
    ],
    answer: "b",
    explanation: "Output LLM không được đảm bảo tuyệt đối. Validate runtime (Zod) + retry có giới hạn là chốt an toàn.",
  },
  {
    id: "ai-heal-risk",
    skill: "ai-testing",
    prompt: "Rủi ro lớn nhất của self-healing locator khi heal sai là gì?",
    options: [
      { id: "a", text: "Tốn thêm vài giây" },
      { id: "b", text: "Báo cáo test khó đọc hơn" },
      { id: "c", text: "Tốn thêm token LLM" },
      { id: "d", text: "Test xanh nhưng thao tác nhầm phần tử, che giấu bug thật" },
    ],
    answer: "d",
    explanation: "Healing sai tệ hơn không healing: suite báo xanh trong khi sản phẩm có lỗi. Vì vậy cần ngưỡng tin cậy, audit log và người duyệt.",
  },
];
