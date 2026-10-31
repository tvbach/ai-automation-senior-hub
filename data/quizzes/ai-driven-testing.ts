import type { QuizQuestion } from "@/data/lessons/types";

/** Quiz cho phase "AI-Driven Testing Workflow", khoá theo Topic.id */
export const aiDrivenTestingQuizzes: Record<string, QuizQuestion[]> = {
  "structured-output": [
    {
      id: "parse-markdown",
      prompt: "Pipeline đang dùng regex để tách test case từ câu trả lời markdown của LLM và thường xuyên vỡ. Cách sửa đúng là:",
      options: [
        { id: "a", text: "Viết regex chặt hơn" },
        { id: "b", text: "Yêu cầu structured output (tool use / JSON schema) rồi validate bằng Zod" },
        { id: "c", text: "Yêu cầu model \"trả lời cẩn thận hơn\"" },
        { id: "d", text: "Tăng temperature" },
      ],
      answer: "b",
      explanation: "Văn bản tự do không có hợp đồng. Structured output + validate runtime biến câu trả lời thành dữ liệu có kiểu.",
    },
    {
      id: "trust-schema",
      prompt: "Đã dùng tool schema rồi, có cần validate lại output không?",
      options: [
        { id: "a", text: "Không, schema đã đảm bảo đúng 100%" },
        { id: "b", text: "Chỉ cần validate trên môi trường dev" },
        { id: "c", text: "Có; sai schema thì retry kèm lỗi (giới hạn số lần) hoặc fail rõ ràng" },
        { id: "d", text: "Chỉ log cảnh báo rồi dùng tiếp, vì schema đã ép đúng kiểu ngay từ phía API của model" },
      ],
      answer: "c",
      explanation: "Model vẫn có thể trả thiếu field hoặc sai kiểu. `safeParse` + retry with feedback có giới hạn là chốt an toàn.",
    },
    {
      id: "two-steps",
      prompt: "Vì sao nên tách \"sinh test plan có cấu trúc\" và \"sinh code\" thành 2 bước?",
      options: [
        { id: "a", text: "Con người review plan ngắn gọn nhanh hơn nhiều so với review 300 dòng code" },
        { id: "b", text: "Để tốn gấp đôi token" },
        { id: "c", text: "Vì model hiện tại chưa đủ khả năng viết code Playwright chạy được ngay từ lần đầu tiên" },
        { id: "d", text: "Vì JSON được xử lý nhanh hơn TypeScript nên pipeline tổng thể sẽ chạy nhanh hơn đáng kể" },
      ],
      answer: "a",
      explanation: "Plan có cấu trúc là điểm review rẻ; code có thể sinh từ template deterministic hoặc một bước LLM thứ hai.",
    },
  ],

  "context-engineering": [
    {
      id: "what-context",
      prompt: "Muốn AI sinh test dùng đúng page object có sẵn, nên đưa gì vào prompt?",
      options: [
        { id: "a", text: "Toàn bộ thư mục `e2e/` để model thấy đầy đủ mọi page object, fixture và test hiện có của team" },
        { id: "b", text: "Không đưa gì thêm, vì model đã học rất nhiều code Playwright và tự suy ra được cấu trúc" },
        { id: "c", text: "Toàn bộ source code của app, để model hiểu rõ từng component trước khi viết locator" },
        { id: "d", text: "API surface (chữ ký class/method) cùng 2–3 test mẫu tiêu biểu" },
      ],
      answer: "d",
      explanation: "Đủ ngữ cảnh để không bịa locator, nhưng không thừa đến mức tốn tiền và gây nhiễu.",
    },
    {
      id: "few-shot-quality",
      prompt: "Few-shot dùng một test cũ có `waitForTimeout`. Hậu quả có thể là gì?",
      options: [
        { id: "a", text: "Không ảnh hưởng, vì model đủ thông minh để tự nhận ra và bỏ qua anti-pattern phổ biến" },
        { id: "b", text: "Model bắt chước luôn anti-pattern đó trong test mới" },
        { id: "c", text: "Model từ chối trả lời" },
        { id: "d", text: "Prompt chạy nhanh hơn" },
      ],
      answer: "b",
      explanation: "Few-shot là thứ model bám theo mạnh nhất. Chỉ dùng ví dụ \"chuẩn vàng\" đã review.",
    },
    {
      id: "caching",
      prompt: "Để tận dụng prompt caching, phần nào của prompt nên giữ cố định ở đầu?",
      options: [
        { id: "a", text: "Phần ổn định: system prompt, quy tắc, API surface, few-shot" },
        { id: "b", text: "Yêu cầu cụ thể của từng lần gọi, vì đó là phần quan trọng nhất mà model cần đọc trước" },
        { id: "c", text: "Timestamp hiện tại" },
        { id: "d", text: "Không phần nào cố định; xáo trộn thứ tự mỗi lần để model không bị lệch theo vị trí thông tin" },
      ],
      answer: "a",
      explanation: "Cache dựa trên tiền tố giống nhau. Phần thay đổi theo từng request nên đặt sau cùng.",
    },
  ],

  "validation-loop": [
    {
      id: "gate-order",
      prompt: "Thứ tự gate hợp lý cho code test do AI sinh ra là:",
      options: [
        { id: "a", text: "Chạy E2E thật → tsc → lint" },
        { id: "b", text: "Chỉ chạy E2E là đủ" },
        { id: "c", text: "tsc → lint → dry-run/chạy thử, cổng rẻ trước cổng đắt sau" },
        { id: "d", text: "Lint → merge → tsc" },
      ],
      answer: "c",
      explanation: "Fail fast: lỗi kiểu và lint bắt trong vài giây, không cần tốn thời gian dựng trình duyệt.",
    },
    {
      id: "feedback",
      prompt: "Feedback nào giúp vòng self-repair hiệu quả nhất?",
      options: [
        { id: "a", text: "\"Code lỗi, viết lại toàn bộ\"" },
        { id: "b", text: "\"Hãy cẩn thận hơn\"" },
        { id: "c", text: "Gửi lại nguyên prompt ban đầu và yêu cầu model sinh lại từ đầu để có một bản hoàn toàn mới" },
        { id: "d", text: "Nguyên văn lỗi tsc/ESLint kèm vị trí, yêu cầu chỉ sửa phần lỗi" },
      ],
      answer: "d",
      explanation: "Lỗi cụ thể giúp model sửa đúng chỗ, tránh viết lại và phát sinh lỗi mới.",
    },
    {
      id: "max-attempts",
      prompt: "Model sửa mãi không qua tsc, chi phí tăng vọt. Thiếu cơ chế gì?",
      options: [
        { id: "a", text: "Max attempts và ngân sách token; hết thì dừng và báo người" },
        { id: "b", text: "Đổi sang model rẻ hơn và cho chạy đến khi qua tsc, vì chi phí mỗi vòng lúc đó không đáng kể" },
        { id: "c", text: "Tắt tsc" },
        { id: "d", text: "Tăng temperature để model thử những cách sửa khác hẳn thay vì lặp lại cùng một lỗi" },
      ],
      answer: "a",
      explanation: "Vòng tự sửa phải có điểm dừng. Không phải lỗi nào AI cũng tự sửa được.",
    },
  ],

  "gen-evals": [
    {
      id: "compare-prompts",
      prompt: "Bạn sửa prompt và thử 3 ví dụ thấy \"ổn hơn\". Cách đánh giá đúng là:",
      options: [
        { id: "a", text: "Merge luôn, vì kết quả thử thủ công đã cho thấy prompt mới tốt hơn rõ rệt" },
        { id: "b", text: "Hỏi chính model xem prompt mới có tốt hơn prompt cũ không, kèm lý do cụ thể" },
        { id: "c", text: "Thử thêm 2 ví dụ khó hơn nữa rồi mới quyết định có merge hay không" },
        { id: "d", text: "Chạy toàn bộ golden set, so số liệu trước/sau" },
      ],
      answer: "d",
      explanation: "Vài ví dụ không đại diện. Golden set đầy đủ cho con số so sánh được giữa hai phiên bản.",
    },
    {
      id: "golden-source",
      prompt: "Golden set nên được tạo như thế nào?",
      options: [
        { id: "a", text: "Để AI tự sinh cả input và kết quả kỳ vọng cho nhanh và đủ số lượng lớn" },
        { id: "b", text: "Do chuyên gia QA kiểm duyệt, là nguồn sự thật" },
        { id: "c", text: "Lấy ngẫu nhiên từ log production" },
        { id: "d", text: "Không cần, dùng LLM-as-judge là đủ" },
      ],
      answer: "b",
      explanation: "Nếu kết quả kỳ vọng do chính AI sinh thì eval chỉ đo AI giống chính nó.",
    },
    {
      id: "what-to-report",
      prompt: "Báo cáo eval cho một phiên bản prompt nên có gì?",
      options: [
        { id: "a", text: "Chỉ điểm chất lượng, vì chi phí và độ trễ là việc của team hạ tầng chứ không phải của eval" },
        { id: "b", text: "Chỉ số token" },
        { id: "c", text: "Chất lượng (ví dụ first-pass rate), cùng token, chi phí và độ trễ mỗi lần sinh" },
        { id: "d", text: "Ảnh chụp vài output tiêu biểu nhất để reviewer cảm nhận nhanh chất lượng của prompt mới" },
      ],
      answer: "c",
      explanation: "Prompt tốt hơn 2% nhưng đắt gấp 3 có thể không đáng. Cần thấy đủ đánh đổi.",
    },
  ],

  fingerprint: [
    {
      id: "what-store",
      prompt: "Fingerprint của một element nên lưu những gì?",
      options: [
        { id: "a", text: "XPath tuyệt đối" },
        { id: "b", text: "Thuộc tính có nghĩa: role, accessible name, text, attribute ổn định, ngữ cảnh xung quanh" },
        { id: "c", text: "Ảnh chụp toàn trang" },
        { id: "d", text: "Toàn bộ class CSS" },
      ],
      answer: "b",
      explanation: "XPath tuyệt đối và class CSS là thứ dễ đổi nhất. Thuộc tính ngữ nghĩa bền hơn nhiều.",
    },
    {
      id: "when-update",
      prompt: "Khi nào được cập nhật fingerprint?",
      options: [
        { id: "a", text: "Sau mỗi lần chạy, kể cả khi test fail" },
        { id: "b", text: "Chỉ khi test fail" },
        { id: "c", text: "Không bao giờ cập nhật" },
        { id: "d", text: "Chỉ sau lần chạy pass" },
      ],
      answer: "d",
      explanation: "Cập nhật lúc fail khiến hệ thống \"học\" theo trạng thái lỗi.",
    },
    {
      id: "dynamic-text",
      prompt: "Nút chứa \"Thanh toán 1.250.000đ\". Lưu text này vào fingerprint thế nào?",
      options: [
        { id: "a", text: "Chuẩn hoá hoặc loại phần động (số tiền) trước khi lưu" },
        { id: "b", text: "Lưu nguyên văn, vì text chính xác là tín hiệu nhận dạng mạnh nhất của một nút" },
        { id: "c", text: "Bỏ hẳn text, chỉ lưu vị trí pixel của nút trên màn hình ở độ phân giải chuẩn" },
        { id: "d", text: "Lưu thêm cả ngày giờ hiện tại" },
      ],
      answer: "a",
      explanation: "Text động thay đổi mỗi lần chạy sẽ làm điểm tương đồng giảm giả.",
    },
  ],

  "similarity-threshold": [
    {
      id: "margin",
      prompt: "Ứng viên 1 đạt 0.86, ứng viên 2 đạt 0.84, ngưỡng là 0.8. Hệ thống nên làm gì?",
      options: [
        { id: "a", text: "Chọn ứng viên 1, vì đã vượt ngưỡng tuyệt đối và cũng là ứng viên có điểm cao nhất" },
        { id: "b", text: "Chọn ngẫu nhiên một trong hai, vì điểm gần bằng nhau nghĩa là cả hai đều phù hợp" },
        { id: "c", text: "Không heal: margin quá nhỏ nghĩa là mơ hồ, fail và báo người" },
        { id: "d", text: "Hạ ngưỡng xuống 0.7 để lần sau hệ thống tự tin hơn khi gặp tình huống tương tự" },
      ],
      answer: "c",
      explanation: "Cần cả ngưỡng tuyệt đối và khoảng cách đủ lớn với ứng viên thứ hai để tránh heal nhầm.",
    },
    {
      id: "calibrate",
      prompt: "Ngưỡng confidence nên được chọn như thế nào?",
      options: [
        { id: "a", text: "Hiệu chỉnh bằng dữ liệu có nhãn (đo precision của các lần heal)" },
        { id: "b", text: "Theo kinh nghiệm của team, 0.5 là mức cân bằng hợp lý giữa tỉ lệ heal và độ chính xác" },
        { id: "c", text: "Đặt 1.0 để an toàn tuyệt đối: chỉ heal khi ứng viên giống hệt fingerprint đã lưu" },
        { id: "d", text: "Để model tự chọn mỗi lần" },
      ],
      answer: "a",
      explanation: "Ngưỡng là đánh đổi giữa tỉ lệ heal và độ chính xác; chỉ dữ liệu thực mới cho biết điểm cân bằng.",
    },
    {
      id: "destructive",
      prompt: "Locator nút \"Xoá tài khoản\" bị vỡ. Self-healing nên xử lý thế nào?",
      options: [
        { id: "a", text: "Heal nếu điểm > 0.9" },
        { id: "b", text: "Heal và retry 3 lần" },
        { id: "c", text: "Gọi LLM để chọn nút thay thế, vì LLM hiểu ngữ nghĩa tốt hơn heuristic" },
        { id: "d", text: "Không heal hành động phá huỷ: fail và báo người" },
      ],
      answer: "d",
      explanation: "Click nhầm trên hành động phá huỷ hay thanh toán có thể gây hậu quả thật. Những hành động này nằm trong danh sách cấm heal.",
    },
  ],

  "llm-fallback": [
    {
      id: "when-llm",
      prompt: "Khi nào nên gọi LLM trong cơ chế self-healing?",
      options: [
        { id: "a", text: "Mọi lần locator fail" },
        { id: "b", text: "Chỉ ở tầng cuối, khi heuristic không đủ tự tin" },
        { id: "c", text: "Trước khi thử locator gốc" },
        { id: "d", text: "Không bao giờ" },
      ],
      answer: "b",
      explanation: "LLM chậm, đắt và không deterministic. Heuristic rẻ xử lý phần lớn trường hợp trước.",
    },
    {
      id: "what-send",
      prompt: "Gửi gì cho LLM để chọn element thay thế?",
      options: [
        { id: "a", text: "`page.content()` toàn bộ HTML" },
        { id: "b", text: "Ảnh chụp toàn màn hình độ phân giải cao, vì model đa phương thức hiểu bố cục trực quan tốt hơn text" },
        { id: "c", text: "Aria snapshot của vùng liên quan hoặc danh sách ứng viên đã rút gọn" },
        { id: "d", text: "Toàn bộ source code của component" },
      ],
      answer: "c",
      explanation: "Rút gọn giúp nằm trong token budget và giảm nhiễu, model chọn chính xác hơn.",
    },
    {
      id: "constrained",
      prompt: "Định dạng output nên yêu cầu LLM trả về là:",
      options: [
        { id: "a", text: "Index của ứng viên trong danh sách đánh số, sau đó hệ thống xác minh" },
        { id: "b", text: "Một selector CSS tự do, vì model hiểu rõ cấu trúc DOM sau khi đọc snapshot của trang" },
        { id: "c", text: "Một XPath tự do" },
        { id: "d", text: "Đoạn code Playwright hoàn chỉnh để dán thẳng vào test mà không cần chỉnh sửa gì thêm" },
      ],
      answer: "a",
      explanation: "Constrained choice loại bỏ khả năng model bịa selector không tồn tại.",
    },
  ],

  "healing-pr": [
    {
      id: "silent-heal",
      prompt: "Self-healing sửa locator trong runtime và báo test xanh, không ai biết. Rủi ro là gì?",
      options: [
        { id: "a", text: "Không có rủi ro đáng kể, vì test vẫn xanh và người dùng không bị ảnh hưởng gì" },
        { id: "b", text: "Test chạy chậm hơn đáng kể vì mỗi lần heal phải quét lại toàn bộ DOM của trang" },
        { id: "c", text: "Tốn thêm token cho mỗi lần heal, làm chi phí vận hành của suite tăng dần theo thời gian" },
        { id: "d", text: "Nợ ẩn và có thể che bug UI thật; cần audit log và mở PR" },
      ],
      answer: "d",
      explanation: "Heal âm thầm làm codebase lệch khỏi thực tế, và một thay đổi UI sai có thể bị coi như bình thường.",
    },
    {
      id: "auto-merge",
      prompt: "Có nên tự động merge PR do cơ chế healing tạo ra?",
      options: [
        { id: "a", text: "Không, luôn cần người duyệt (human-in-the-loop)" },
        { id: "b", text: "Có, nếu CI xanh sau khi áp dụng locator mới, vì như vậy là đã được kiểm chứng" },
        { id: "c", text: "Có, nếu confidence trên 0.95, vì lúc đó khả năng heal sai gần như bằng không" },
        { id: "d", text: "Có, vào cuối tuần" },
      ],
      answer: "a",
      explanation: "Người duyệt xác nhận thay đổi UI là cố ý chứ không phải bug.",
    },
    {
      id: "precision",
      prompt: "Chỉ số nào cho biết cơ chế healing có đáng tin không?",
      options: [
        { id: "a", text: "Số lần heal mỗi ngày" },
        { id: "b", text: "Healing precision: % lần heal được người duyệt xác nhận là đúng (PR được merge)" },
        { id: "c", text: "Thời gian chạy suite" },
        { id: "d", text: "Số dòng code của plugin" },
      ],
      answer: "b",
      explanation: "Precision thấp nghĩa là ngưỡng quá lỏng; dùng nó để điều chỉnh ngưỡng.",
    },
  ],

  "diff-types": [
    {
      id: "os-baseline",
      prompt: "Baseline chụp trên Mac, CI chạy trên Linux, test visual luôn đỏ. Cách sửa?",
      options: [
        { id: "a", text: "Tăng dung sai lên 20%" },
        { id: "b", text: "Chuyển sang AI semantic diff" },
        { id: "c", text: "Tạo và so baseline trong cùng môi trường (cùng container)" },
        { id: "d", text: "Tắt anti-aliasing của font" },
      ],
      answer: "c",
      explanation: "Font và render khác nhau giữa hệ điều hành gây khác biệt pixel không phải lỗi.",
    },
    {
      id: "ai-for-all",
      prompt: "Có nên dùng AI semantic diff cho mọi screenshot?",
      options: [
        { id: "a", text: "Có, vì AI hiểu ngữ nghĩa nên cho kết quả chính xác nhất trên mọi loại ảnh chụp" },
        { id: "b", text: "Có, thay luôn pixel diff" },
        { id: "c", text: "Không dùng AI cho visual testing" },
        { id: "d", text: "Không; pixel diff lọc trước, AI chỉ xử lý các diff vượt ngưỡng" },
      ],
      answer: "d",
      explanation: "Pixel diff rẻ và deterministic. AI đắt nên chỉ dùng cho phần cần hiểu ý nghĩa.",
    },
    {
      id: "false-positive",
      prompt: "Trong visual testing, false positive là gì?",
      options: [
        { id: "a", text: "Test báo có khác biệt nhưng thực ra không có lỗi" },
        { id: "b", text: "Test xanh nhưng giao diện thật sự có lỗi mà công cụ so sánh không phát hiện ra" },
        { id: "c", text: "Baseline bị mất hoặc bị ghi đè sai nên không còn ảnh chuẩn để so sánh nữa" },
        { id: "d", text: "Ảnh chụp bị trắng" },
      ],
      answer: "a",
      explanation: "Quá nhiều false positive khiến team bỏ qua cảnh báo, kể cả khi có lỗi thật.",
    },
  ],

  "snapshot-stability": [
    {
      id: "raise-tolerance",
      prompt: "Visual test flaky vì banner quảng cáo thay đổi. Cách xử lý đúng?",
      options: [
        { id: "a", text: "Tăng `maxDiffPixelRatio` lên 10% để banner thay đổi không còn làm test đỏ nữa" },
        { id: "b", text: "Dùng `mask` cho vùng banner khi chụp" },
        { id: "c", text: "Xoá banner khỏi code app ở môi trường test bằng một feature flag riêng" },
        { id: "d", text: "Chụp nhiều lần liên tiếp rồi lấy ảnh giống baseline nhất để so sánh" },
      ],
      answer: "b",
      explanation: "Dung sai lớn bỏ sót lỗi thật. Mask chỉ loại đúng vùng nhiễu, không phải sửa app.",
    },
    {
      id: "time",
      prompt: "Trang hiển thị \"Cập nhật 3 phút trước\" làm snapshot luôn khác. Dùng gì?",
      options: [
        { id: "a", text: "Lên lịch chạy test visual vào đúng một khung giờ cố định mỗi ngày để thời gian hiển thị luôn giống nhau" },
        { id: "b", text: "Bỏ test trang đó" },
        { id: "c", text: "`page.clock` để cố định thời gian, cùng `timezoneId` và `locale` trong config" },
        { id: "d", text: "`waitForTimeout(60000)`" },
      ],
      answer: "c",
      explanation: "Cố định thời gian, timezone và locale loại bỏ nguồn nhiễu thường gặp nhất.",
    },
    {
      id: "animation",
      prompt: "Ảnh chụp đôi khi bắt được nút đang chuyển màu giữa chừng. Cấu hình nào giúp?",
      options: [
        { id: "a", text: "`animations: 'disabled'` khi chụp screenshot" },
        { id: "b", text: "Tăng số retry để lần chụp sau rơi vào lúc animation đã chạy xong" },
        { id: "c", text: "Giảm độ phân giải ảnh để khác biệt màu nhỏ không còn được tính là pixel khác" },
        { id: "d", text: "Chạy headed mode" },
      ],
      answer: "a",
      explanation: "Dừng animation và transition giúp ảnh chụp deterministic.",
    },
  ],

  "vision-classify": [
    {
      id: "what-send",
      prompt: "Nên gửi ảnh nào cho vision model phân loại?",
      options: [
        { id: "a", text: "Mọi screenshot của suite" },
        { id: "b", text: "Chỉ baseline" },
        { id: "c", text: "Ngẫu nhiên 10% ảnh" },
        { id: "d", text: "Chỉ ảnh có pixel diff vượt ngưỡng" },
      ],
      answer: "d",
      explanation: "Ảnh không khác thì không cần phân loại; gửi tất cả chỉ tốn chi phí.",
    },
    {
      id: "auto-baseline",
      prompt: "AI phân loại một diff là \"noise\". Có nên tự động cập nhật baseline?",
      options: [
        { id: "a", text: "Có, vì AI đã xác nhận đó là noise và cập nhật giúp suite xanh trở lại nhanh hơn" },
        { id: "b", text: "Không; AI đề xuất, người duyệt, theo dõi agreement rate" },
        { id: "c", text: "Có, nếu xảy ra vào ban đêm" },
        { id: "d", text: "Xoá baseline cũ đi" },
      ],
      answer: "b",
      explanation: "Chỉ khi agreement rate giữa AI và người đủ cao mới cân nhắc tự động hoá thêm.",
    },
    {
      id: "validate",
      prompt: "Output phân loại của vision model nên được xử lý thế nào?",
      options: [
        { id: "a", text: "Lấy qua tool schema và validate bằng Zod" },
        { id: "b", text: "Đọc câu trả lời dạng text tự do và tách nhãn bằng regex cho đơn giản" },
        { id: "c", text: "Tin tuyệt đối, vì vision model hiện nay đã rất chính xác với ảnh chụp giao diện" },
        { id: "d", text: "Hiển thị nguyên văn cho người dùng" },
      ],
      answer: "a",
      explanation: "Như mọi output LLM khác: structured output và validate runtime.",
    },
  ],

  "prompt-templates": [
    {
      id: "where-store",
      prompt: "Prompt sinh test của team nên được quản lý thế nào?",
      options: [
        { id: "a", text: "Mỗi người tự viết trong chat cho linh hoạt theo từng tình huống cụ thể" },
        { id: "b", text: "Lưu trong một Google Doc chung để cả team cùng xem và chỉnh sửa" },
        { id: "c", text: "Để người viết prompt giỏi nhất team giữ và chia sẻ khi có người cần" },
        { id: "d", text: "Lưu template trong repo và review như code" },
      ],
      answer: "d",
      explanation: "Template trong repo có lịch sử, review và có thể chạy eval khi thay đổi.",
    },
    {
      id: "negative-rules",
      prompt: "Prompt toàn câu \"KHÔNG được dùng XPath, KHÔNG được…\". Cách tốt hơn?",
      options: [
        { id: "a", text: "Viết hoa và lặp lại các điều cấm ở cả đầu và cuối prompt để model không quên" },
        { id: "b", text: "Nói rõ điều cần làm và lý do; luật cấm đưa vào lint" },
        { id: "c", text: "Bỏ hết quy tắc" },
        { id: "d", text: "Thêm emoji cảnh báo" },
      ],
      answer: "b",
      explanation: "Chỉ dẫn tích cực rõ ràng hiệu quả hơn, còn luật cứng nên được kiểm tra bằng máy.",
    },
    {
      id: "system-prompt",
      prompt: "System prompt nên chứa gì?",
      options: [
        { id: "a", text: "Vai trò và quy tắc nền ổn định qua nhiều lần gọi" },
        { id: "b", text: "Yêu cầu cụ thể của từng test, để model tập trung đúng vào việc cần làm ngay từ đầu" },
        { id: "c", text: "Dữ liệu test thay đổi theo mỗi lần gọi, để model luôn có thông tin mới nhất" },
        { id: "d", text: "Không cần system prompt" },
      ],
      answer: "a",
      explanation: "Phần ổn định nằm trong system prompt, phần biến đổi nằm trong message của từng lần gọi.",
    },
  ],

  "edge-case-taxonomy": [
    {
      id: "boundary",
      prompt: "Ô số lượng cho phép 1–99. Bộ giá trị biên đầy đủ nhất là:",
      options: [
        { id: "a", text: "1 và 99" },
        { id: "b", text: "50" },
        { id: "c", text: "0, 1, 99, 100" },
        { id: "d", text: "-1 và 1000" },
      ],
      answer: "c",
      explanation: "Luôn test cặp tại biên và vượt biên ở cả hai đầu — nơi lỗi off-by-one hay xảy ra.",
    },
    {
      id: "equivalence",
      prompt: "Equivalence partitioning giúp gì?",
      options: [
        { id: "a", text: "Chia input thành nhóm hành xử giống nhau, mỗi nhóm chỉ cần test một đại diện" },
        { id: "b", text: "Test mọi giá trị có thể" },
        { id: "c", text: "Chỉ test giá trị hợp lệ" },
        { id: "d", text: "Sinh dữ liệu ngẫu nhiên số lượng lớn để tăng xác suất chạm vào mọi nhánh xử lý khác nhau" },
      ],
      answer: "a",
      explanation: "Giảm số case mà vẫn bao phủ được các hành vi khác nhau.",
    },
    {
      id: "i18n",
      prompt: "\"App chỉ có tiếng Việt nên bỏ qua i18n.\" Nhận định nào đúng?",
      options: [
        { id: "a", text: "Đúng, không cần test" },
        { id: "b", text: "Chỉ cần test khi sản phẩm thêm ngôn ngữ thứ hai, ví dụ tiếng Anh" },
        { id: "c", text: "i18n chỉ liên quan đến dịch thuật, nên đó là việc của team nội dung" },
        { id: "d", text: "Sai; chữ có dấu, emoji, chuỗi dài vẫn gây lỗi" },
      ],
      answer: "d",
      explanation: "i18n edge case bao gồm cả encoding, độ dài và hiển thị, không chỉ là dịch.",
    },
  ],

  "prompt-versioning": [
    {
      id: "hotfix-prompt",
      prompt: "Cần sửa \"chỉ một câu\" trong prompt đang chạy production. Quy trình đúng là:",
      options: [
        { id: "a", text: "Sửa trực tiếp trên production, vì thay đổi một câu không ảnh hưởng đáng kể" },
        { id: "b", text: "Đi qua PR và regression eval như mọi thay đổi code" },
        { id: "c", text: "Sửa vào cuối tuần khi ít người dùng để giảm ảnh hưởng nếu có lỗi" },
        { id: "d", text: "Hỏi chính model xem prompt sau khi sửa có còn hoạt động tốt hay không" },
      ],
      answer: "b",
      explanation: "Prompt là code: một câu có thể làm chất lượng giảm đáng kể mà không ai nhận ra.",
    },
    {
      id: "metadata",
      prompt: "Để truy vết một test sinh ra có vấn đề, output nên kèm metadata gì?",
      options: [
        { id: "a", text: "Tên người đã chạy pipeline sinh test để liên hệ khi có vấn đề" },
        { id: "b", text: "Không cần metadata" },
        { id: "c", text: "`promptId` (phiên bản prompt) và `model`" },
        { id: "d", text: "Màu theme của IDE" },
      ],
      answer: "c",
      explanation: "Biết phiên bản prompt và model mới khoanh vùng và so sánh được.",
    },
    {
      id: "nondeterministic",
      prompt: "Vì sao không nên kết luận từ một lần chạy eval duy nhất?",
      options: [
        { id: "a", text: "LLM không deterministic; cần chạy nhiều lần và so trung bình" },
        { id: "b", text: "Vì kết quả eval một lần thường bị ảnh hưởng bởi cache của nhà cung cấp model" },
        { id: "c", text: "Vì golden set có thể đã thay đổi giữa hai lần chạy, cần chạy lại để đồng bộ" },
        { id: "d", text: "Không có lý do, một lần là đủ" },
      ],
      answer: "a",
      explanation: "Biến thiên giữa các lần chạy có thể lớn hơn chênh lệch giữa hai phiên bản prompt.",
    },
  ],
};
