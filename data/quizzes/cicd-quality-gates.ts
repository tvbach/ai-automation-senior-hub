import type { QuizQuestion } from "@/data/lessons/types";

/** Quiz cho phase "Enterprise CI/CD & Quality Gates", khoá theo Topic.id */
export const cicdQualityGatesQuizzes: Record<string, QuizQuestion[]> = {
  "gha-sharding": [
    {
      id: "fail-fast",
      prompt: "Suite chạy 4 shard bằng matrix. Shard 1 fail thì 3 shard còn lại bị huỷ, nên không thấy hết lỗi. Cần đổi gì?",
      options: [
        { id: "a", text: "Giảm xuống 1 shard" },
        { id: "b", text: "Tăng `retries`" },
        { id: "c", text: "Đặt `fail-fast: false` trong strategy của matrix" },
        { id: "d", text: "Thêm `continue-on-error` cho toàn workflow" },
      ],
      answer: "c",
      explanation: "Mặc định matrix huỷ các job còn lại khi một job fail. Với test, bạn muốn thấy toàn bộ lỗi trong một lần chạy.",
    },
    {
      id: "merge-reports",
      prompt: "Mỗi shard upload một HTML report, reviewer phải mở 4 file. Giải pháp?",
      options: [
        { id: "a", text: "Blob reporter ở mỗi shard rồi `merge-reports` thành một report" },
        { id: "b", text: "Chỉ upload report của những shard bị fail để giảm số file reviewer phải mở xem" },
        { id: "c", text: "Gộp 4 file HTML bằng tay" },
        { id: "d", text: "Bỏ report, xem log là đủ" },
      ],
      answer: "a",
      explanation: "Blob report là định dạng trung gian sinh ra để merge.",
    },
    {
      id: "too-many-shards",
      prompt: "Suite chạy 3 phút trên một máy, setup mỗi job mất 2 phút. Tăng lên 20 shard có hợp lý?",
      options: [
        { id: "a", text: "Có, vì thời gian chạy luôn giảm tuyến tính theo số shard, nên càng nhiều shard thì càng nhanh" },
        { id: "b", text: "Có, vì runner GitHub Actions miễn phí cho repo public nên không cần lo về chi phí phút chạy" },
        { id: "c", text: "Không, chỉ dùng tối đa 2 shard cho mọi suite" },
        { id: "d", text: "Không; chi phí setup lấn át lợi ích, cần đo để tìm điểm tối ưu" },
      ],
      answer: "d",
      explanation: "Wall time ≈ setup + thời gian test / số shard. Khi phần test đã nhỏ, thêm shard chỉ tăng tổng phút runner.",
    },
  ],

  "test-impact": [
    {
      id: "never-full",
      prompt: "Team chỉ chạy test liên quan đến file thay đổi ở mọi nơi, không bao giờ chạy full. Rủi ro?",
      options: [
        { id: "a", text: "Không có rủi ro, vì công cụ TIA phân tích đầy đủ mọi phụ thuộc giữa các file" },
        { id: "b", text: "TIA có thể sót phụ thuộc gián tiếp; cần full run định kỳ" },
        { id: "c", text: "Pipeline chậm hơn, vì phải tính toán đồ thị phụ thuộc trước mỗi lần chạy test" },
        { id: "d", text: "Tốn quá nhiều phút runner, vì phân tích thay đổi chạy lại cho từng commit một" },
      ],
      answer: "b",
      explanation: "Phân tích phụ thuộc không hoàn hảo. Full run định kỳ bắt những gì TIA bỏ sót.",
    },
    {
      id: "run-all-files",
      prompt: "PR chỉ sửa `playwright.config.ts` và nâng version một dependency. TIA nên chọn test thế nào?",
      options: [
        { id: "a", text: "Không chạy test nào vì không đổi file test" },
        { id: "b", text: "Chỉ chạy test có tag `@smoke`" },
        { id: "c", text: "Chạy toàn bộ: config và dependency nằm trong danh sách kích hoạt full run" },
        { id: "d", text: "Chạy ngẫu nhiên khoảng 10% số test, như vậy đủ để phát hiện lỗi cấu hình mà vẫn không làm chậm PR" },
      ],
      answer: "c",
      explanation: "Thay đổi ở config, dependency, layout hay thư viện dùng chung ảnh hưởng toàn hệ thống.",
    },
    {
      id: "fetch-depth",
      prompt: "Bước `git diff origin/main` trong CI báo lỗi không tìm thấy commit. Nguyên nhân hay gặp nhất?",
      options: [
        { id: "a", text: "Checkout nông (`fetch-depth: 1`); cần `fetch-depth: 0` hoặc fetch nhánh base" },
        { id: "b", text: "Phiên bản Git cài sẵn trên runner quá cũ nên không hiểu cú pháp so sánh với remote branch" },
        { id: "c", text: "Repo đang ở chế độ private nên token mặc định của workflow không đủ quyền đọc nhánh main" },
        { id: "d", text: "Thiếu `npm ci`" },
      ],
      answer: "a",
      explanation: "`actions/checkout` mặc định chỉ lấy 1 commit, nên không có lịch sử để so sánh.",
    },
  ],

  "preview-env": [
    {
      id: "shared-db",
      prompt: "Mọi preview environment cùng ghi vào DB staging và dữ liệu của PR này làm hỏng PR kia. Hướng giải quyết?",
      options: [
        { id: "a", text: "Chạy PR lần lượt từng cái" },
        { id: "b", text: "Xoá DB staging mỗi giờ" },
        { id: "c", text: "Tắt E2E trên preview" },
        { id: "d", text: "Branch database, DB container riêng, hoặc tối thiểu tenant riêng theo PR" },
      ],
      answer: "d",
      explanation: "Isolation dữ liệu theo PR là điều kiện để preview environment có ý nghĩa.",
    },
    {
      id: "protection",
      prompt: "Preview yêu cầu đăng nhập nên E2E trên CI không truy cập được. Cách đúng?",
      options: [
        { id: "a", text: "Giữ bảo vệ và dùng protection bypass token cho CI" },
        { id: "b", text: "Tắt bảo vệ preview" },
        { id: "c", text: "Hard-code tài khoản admin trong test vì preview chỉ là môi trường tạm thời" },
        { id: "d", text: "Chạy E2E trên production thay thế" },
      ],
      answer: "a",
      explanation: "Bypass token cho phép CI vào mà không mở preview cho cả internet.",
    },
    {
      id: "cleanup",
      prompt: "Chi phí hạ tầng tăng dần vì preview environment không bao giờ bị xoá. Thiếu gì?",
      options: [
        { id: "a", text: "Giới hạn mỗi người 1 PR" },
        { id: "b", text: "Tự động huỷ môi trường khi PR đóng (ví dụ job `pull_request: closed`)" },
        { id: "c", text: "Dùng máy cấu hình thấp hơn cho preview vì môi trường tạm không cần hiệu năng cao" },
        { id: "d", text: "Giao cho một người xoá thủ công toàn bộ môi trường cũ vào ngày cuối của mỗi tháng" },
      ],
      answer: "b",
      explanation: "Ephemeral nghĩa là vòng đời gắn với PR: tạo khi mở, huỷ khi đóng.",
    },
  ],

  "ci-caching": [
    {
      id: "npm-ci",
      prompt: "Cách cache dependency được khuyến nghị trong CI là:",
      options: [
        { id: "a", text: "Cache `node_modules` rồi chạy `npm install`, vì khôi phục thư mục có sẵn là nhanh nhất" },
        { id: "b", text: "Không cache gì, để mỗi lần chạy đều cài mới hoàn toàn cho sạch sẽ" },
        { id: "c", text: "Cache npm cache theo hash lockfile, cài bằng `npm ci`" },
        { id: "d", text: "Commit `node_modules` vào repo để CI khỏi phải tải dependency mỗi lần" },
      ],
      answer: "c",
      explanation: "`npm ci` cài đúng theo lockfile; cache npm cache giúp nhanh mà vẫn tái lập được.",
    },
    {
      id: "playwright-version",
      prompt: "Sau khi nâng Playwright, CI vẫn dùng browser cũ và báo lỗi version. Vì sao?",
      options: [
        { id: "a", text: "Cache key của browser không chứa version Playwright" },
        { id: "b", text: "GitHub Actions cần vài tuần để hỗ trợ phiên bản Playwright mới trên runner chuẩn" },
        { id: "c", text: "Cần xoá repo và clone lại" },
        { id: "d", text: "Thiếu `--headed`" },
      ],
      answer: "a",
      explanation: "Key phải thay đổi khi thứ được cache thay đổi; đưa version vào key.",
    },
    {
      id: "measure-first",
      prompt: "Pipeline chậm. Bước đầu tiên nên làm là:",
      options: [
        { id: "a", text: "Thêm cache cho mọi bước có thể ngay lập tức, vì cache gần như luôn làm pipeline nhanh hơn" },
        { id: "b", text: "Chuyển sang runner cấu hình cao nhất, vì phần cứng mạnh hơn sẽ rút ngắn mọi bước cùng lúc" },
        { id: "c", text: "Tăng shard lên tối đa" },
        { id: "d", text: "Xem thời gian từng step trong log và tối ưu step chậm nhất trước" },
      ],
      answer: "d",
      explanation: "Đo trước khi tối ưu; nếu không bạn có thể tốn công vào step chỉ chiếm vài giây.",
    },
  ],

  "gate-rules": [
    {
      id: "coverage",
      prompt: "Gate coverage nào công bằng hơn cho một codebase cũ có coverage tổng 45%?",
      options: [
        { id: "a", text: "Ép coverage tổng ≥ 80% cho mọi PR" },
        { id: "b", text: "Diff coverage: chỉ tính trên các dòng thay đổi trong PR" },
        { id: "c", text: "Bỏ đo coverage" },
        { id: "d", text: "Coverage tổng không được giảm dù 0,01%" },
      ],
      answer: "b",
      explanation: "Diff coverage tập trung vào code mới, không bắt PR nhỏ phải gánh nợ của cả codebase.",
    },
    {
      id: "levels",
      prompt: "Gate nào nên ở mức \"block\"?",
      options: [
        { id: "a", text: "Thứ nguy hiểm thật và có tín hiệu ổn định (critical journey, CVE critical)" },
        { id: "b", text: "Mọi gate để an toàn" },
        { id: "c", text: "Cảnh báo khi kích thước bundle tăng dù chỉ 1KB, vì hiệu năng là trách nhiệm của mọi người" },
        { id: "d", text: "Không gate nào, chỉ cảnh báo" },
      ],
      answer: "a",
      explanation: "Gate quá chặt khiến team tìm cách bypass. Phân mức block / warn / info theo mức độ và độ tin cậy.",
    },
    {
      id: "override",
      prompt: "Sự cố production cần hotfix gấp nhưng một gate đang chặn. Thiết kế tốt nhất là:",
      options: [
        { id: "a", text: "Admin tạm tắt branch protection để merge hotfix, rồi bật lại ngay sau khi deploy xong" },
        { id: "b", text: "Không cho phép vượt gate trong mọi trường hợp, kể cả sự cố, để giữ kỷ luật chất lượng" },
        { id: "c", text: "Cơ chế override hợp lệ, ghi lại lý do và người chịu trách nhiệm" },
        { id: "d", text: "Push thẳng lên main" },
      ],
      answer: "c",
      explanation: "Override có kiểm soát và có audit trail tốt hơn nhiều so với tắt toàn bộ bảo vệ.",
    },
  ],

  "flaky-budget": [
    {
      id: "retries",
      prompt: "\"Tăng `retries` lên 3 là xong vấn đề flaky.\" Nhận định nào đúng?",
      options: [
        { id: "a", text: "Đúng, vì test sẽ xanh và pipeline không còn bị chặn bởi những lần fail ngẫu nhiên" },
        { id: "b", text: "Sai; retry để phát hiện, pass ở retry vẫn là flaky cần sửa" },
        { id: "c", text: "Đúng nếu chỉ áp dụng cho E2E, vì unit test vốn không bao giờ bị flaky" },
        { id: "d", text: "Sai; phải tắt hẳn retry để mọi lần fail đều chặn merge và buộc team sửa ngay" },
      ],
      answer: "b",
      explanation: "Retry giữ pipeline chạy được, nhưng che giấu flaky nếu không được đo và xử lý.",
    },
    {
      id: "quarantine-owner",
      prompt: "Thư mục quarantine có 60 test, nhiều test nằm đó cả năm. Thiếu điều gì?",
      options: [
        { id: "a", text: "Thêm thư mục quarantine thứ hai" },
        { id: "b", text: "Xoá toàn bộ 60 test" },
        { id: "c", text: "Chuyển tất cả về suite chính để buộc các team phải sửa vì chúng sẽ chặn merge" },
        { id: "d", text: "Mỗi test cách ly cần issue, owner, SLA và được báo cáo định kỳ" },
      ],
      answer: "d",
      explanation: "Không có owner và hạn thì quarantine thành \"nghĩa địa test\", mất dần độ bao phủ.",
    },
    {
      id: "delete-flaky",
      prompt: "Vì sao không nên xoá test flaky ngay lập tức?",
      options: [
        { id: "a", text: "Flaky có thể là race condition thật của sản phẩm" },
        { id: "b", text: "Vì xoá test sẽ làm giảm coverage và có thể khiến quality gate coverage bị fail" },
        { id: "c", text: "Vì quy trình quarantine bắt buộc phải chờ đủ 30 ngày trước khi được phép xoá" },
        { id: "d", text: "Không có lý do, nên xoá ngay" },
      ],
      answer: "a",
      explanation: "Một số flaky phản ánh bug thật về đồng thời hoặc thời gian mà người dùng cũng gặp.",
    },
  ],

  "perf-budget": [
    {
      id: "variance",
      prompt: "Lighthouse CI fail ngẫu nhiên vì điểm dao động giữa các lần chạy. Cách xử lý?",
      options: [
        { id: "a", text: "Tắt Lighthouse CI" },
        { id: "b", text: "Hạ budget xuống thật thấp" },
        { id: "c", text: "Chạy 3–5 lần, dùng median và đặt budget có biên" },
        { id: "d", text: "Chỉ chạy trên máy dev" },
      ],
      answer: "c",
      explanation: "Đo hiệu năng luôn có nhiễu; median và biên an toàn giảm false positive.",
    },
    {
      id: "load-per-pr",
      prompt: "Load test k6 nặng 30 phút nên chạy ở đâu?",
      options: [
        { id: "a", text: "Trên mỗi PR, để phát hiện suy giảm hiệu năng ngay từ thay đổi gây ra nó" },
        { id: "b", text: "Nightly trên môi trường riêng; PR chỉ chạy smoke perf ngắn" },
        { id: "c", text: "Trên production giờ cao điểm" },
        { id: "d", text: "Không cần chạy" },
      ],
      answer: "b",
      explanation: "PR cần phản hồi nhanh. Load/stress test cần môi trường ổn định và thời gian dài.",
    },
    {
      id: "threshold",
      prompt: "Trong k6, `http_req_duration: ['p(95)<500']` nghĩa là:",
      options: [
        { id: "a", text: "Thời gian phản hồi trung bình của toàn bộ request trong suốt bài test phải dưới 500ms" },
        { id: "b", text: "Mọi request phải dưới 500ms" },
        { id: "c", text: "Chỉ 95 request đầu tiên trong giai đoạn khởi động phải có thời gian phản hồi dưới 500ms" },
        { id: "d", text: "95% request phải có thời gian phản hồi dưới 500ms, nếu không test fail" },
      ],
      answer: "d",
      explanation: "Threshold là điều kiện pass/fail; p(95) bắt được đuôi chậm mà trung bình che mất.",
    },
  ],

  "security-scan": [
    {
      id: "leaked-secret",
      prompt: "Secret scanning phát hiện API key đã commit 2 tuần trước. Việc quan trọng nhất cần làm?",
      options: [
        { id: "a", text: "Rotate (thu hồi và tạo lại) key ngay" },
        { id: "b", text: "Xoá dòng chứa key khỏi file và commit lại để key không còn xuất hiện trong code" },
        { id: "c", text: "Đổi tên biến môi trường để công cụ quét không còn nhận diện được key nữa" },
        { id: "d", text: "Chuyển repo sang private để người ngoài không còn đọc được lịch sử commit" },
      ],
      answer: "a",
      explanation: "Xoá khỏi file không xoá khỏi lịch sử; key phải coi như đã lộ.",
    },
    {
      id: "idor",
      prompt: "User A đổi `/api/orders/123` thành `/api/orders/124` và xem được đơn của user B. Đây là lỗi gì?",
      options: [
        { id: "a", text: "XSS" },
        { id: "b", text: "SQL injection" },
        { id: "c", text: "IDOR — lỗi phân quyền truy cập tài nguyên theo id" },
        { id: "d", text: "CSRF — request giả mạo được gửi từ một trang khác thay mặt người dùng" },
      ],
      answer: "c",
      explanation: "IDOR rất phổ biến và không công cụ quét dependency nào bắt được; cần test phân quyền với nhiều tài khoản.",
    },
    {
      id: "block-level",
      prompt: "Chính sách block hợp lý cho dependency scan là:",
      options: [
        { id: "a", text: "Block mọi lỗ hổng, kể cả mức low trong devDependencies, vì bảo mật không thể có ngoại lệ" },
        { id: "b", text: "Không block gì cả, chỉ đọc báo cáo định kỳ khi team có thời gian rảnh giữa các sprint" },
        { id: "c", text: "Chỉ block khi có người phàn nàn" },
        { id: "d", text: "Block high/critical ở dependency production; phần còn lại warn và xử lý theo lịch" },
      ],
      answer: "d",
      explanation: "Block mọi thứ khiến gate bị bỏ qua; tập trung vào rủi ro thật sự ảnh hưởng người dùng.",
    },
  ],

  "results-ingestion": [
    {
      id: "retries-data",
      prompt: "Để phát hiện test flaky từ dữ liệu, cần lưu gì?",
      options: [
        { id: "a", text: "Chỉ kết quả cuối cùng của mỗi test" },
        { id: "b", text: "Kết quả của từng lần thử (kể cả retry)" },
        { id: "c", text: "Chỉ số test fail" },
        { id: "d", text: "Ảnh chụp report HTML" },
      ],
      answer: "b",
      explanation: "Test fail rồi pass ở retry chỉ lộ ra khi có dữ liệu từng lần thử.",
    },
    {
      id: "sha",
      prompt: "Vì sao mỗi run phải lưu commit SHA và branch?",
      options: [
        { id: "a", text: "Để phân biệt \"đổi code gây fail\" với \"flaky trên cùng code\"" },
        { id: "b", text: "Để báo cáo đẹp hơn" },
        { id: "c", text: "Vì GitHub Actions yêu cầu mọi artifact phải gắn commit SHA và branch khi upload" },
        { id: "d", text: "Không cần thiết" },
      ],
      answer: "a",
      explanation: "Flaky được định nghĩa trên cùng một commit; thiếu SHA thì không tính được.",
    },
    {
      id: "batching",
      prompt: "Custom reporter gửi một HTTP request cho mỗi test đến API lưu trữ, gây chậm và lỗi rate limit. Cách sửa?",
      options: [
        { id: "a", text: "Thêm `sleep` ngắn giữa các request để không vượt rate limit của API lưu trữ kết quả" },
        { id: "b", text: "Bỏ lưu kết quả" },
        { id: "c", text: "Tăng timeout của reporter để các request chậm vẫn kịp hoàn thành trước khi kết thúc" },
        { id: "d", text: "Gom kết quả và gửi một lần trong `onEnd` hoặc theo lô" },
      ],
      answer: "d",
      explanation: "Batching giảm số request và không làm chậm quá trình chạy test.",
    },
  ],

  "flakiness-score": [
    {
      id: "definition",
      prompt: "Test fail ở cả 10 lần chạy trên cùng commit. Đây là:",
      options: [
        { id: "a", text: "Test cực kỳ flaky, vì fail liên tục 10 lần là mức không ổn định cao nhất có thể" },
        { id: "b", text: "Bug (hoặc test sai), không phải flaky — kết quả ổn định" },
        { id: "c", text: "Chắc chắn là lỗi hạ tầng, vì code không đổi mà test vẫn fail ở mọi lần chạy" },
        { id: "d", text: "Nên quarantine ngay lập tức để không chặn merge của các PR khác trong team" },
      ],
      answer: "b",
      explanation: "Flaky là kết quả đổi (flip) trên cùng code. Fail ổn định là tín hiệu đáng tin.",
    },
    {
      id: "window",
      prompt: "Tại sao flakiness score nên tính theo cửa sổ trượt (ví dụ 14 ngày)?",
      options: [
        { id: "a", text: "Phản ánh tình trạng hiện tại; test đã sửa không bị phạt mãi" },
        { id: "b", text: "Để tiết kiệm dung lượng database, vì dữ liệu kết quả test tăng rất nhanh" },
        { id: "c", text: "Vì dữ liệu cũ luôn sai" },
        { id: "d", text: "Không có lý do đặc biệt" },
      ],
      answer: "a",
      explanation: "Toàn bộ lịch sử làm điểm phản ứng chậm với cải thiện hoặc suy giảm gần đây.",
    },
    {
      id: "min-samples",
      prompt: "Một test mới chạy 2 lần, fail 1 lần, điểm flaky 50%. Có nên tự động quarantine?",
      options: [
        { id: "a", text: "Có, vì 50% là tỉ lệ rất cao và cách ly sớm giúp bảo vệ niềm tin vào pipeline" },
        { id: "b", text: "Có, và xoá luôn test đó vì test mới mà đã không ổn định thì nên viết lại từ đầu" },
        { id: "c", text: "Không; cần số mẫu tối thiểu trước khi ra quyết định tự động" },
        { id: "d", text: "Có, nếu test thuộc team khác" },
      ],
      answer: "c",
      explanation: "Với 2 mẫu, tỉ lệ không có ý nghĩa thống kê; đặt ngưỡng số lần chạy tối thiểu.",
    },
  ],

  "ai-triage": [
    {
      id: "redaction",
      prompt: "Trước khi gửi log test fail cho LLM phân loại, bắt buộc phải làm gì?",
      options: [
        { id: "a", text: "Dịch log sang tiếng Anh" },
        { id: "b", text: "Nén log thành file zip" },
        { id: "c", text: "Không cần làm gì" },
        { id: "d", text: "Redact thông tin nhạy cảm (token, email khách hàng) và cắt gọn quanh lỗi" },
      ],
      answer: "d",
      explanation: "Log có thể chứa dữ liệu bí mật; gửi ra ngoài mà không che là sự cố bảo mật.",
    },
    {
      id: "cluster-first",
      prompt: "Pipeline có 80 test fail cùng lúc. Gọi LLM thế nào cho hiệu quả?",
      options: [
        { id: "a", text: "Cluster theo error signature, mỗi cluster gọi một lần, cache lại" },
        { id: "b", text: "Gọi LLM 80 lần, mỗi test một lần" },
        { id: "c", text: "Gửi cả 80 log trong một prompt lớn để model nhìn được toàn cảnh và tự nhóm lại" },
        { id: "d", text: "Chỉ phân loại test fail đầu tiên" },
      ],
      answer: "a",
      explanation: "80 lỗi thường chỉ có vài nguyên nhân; clustering giảm chi phí và cho kết quả nhất quán.",
    },
    {
      id: "low-confidence",
      prompt: "AI phân loại một cluster với confidence thấp. Hệ thống nên làm gì?",
      options: [
        { id: "a", text: "Vẫn gán nhãn như bình thường" },
        { id: "b", text: "Gắn nhãn \"cần người xem\" và thu feedback để đo precision" },
        { id: "c", text: "Tự động tạo bug ticket để người phụ trách kiểm tra lại khi có thời gian xem xét" },
        { id: "d", text: "Gọi lại model nhiều lần cho đến khi một lần trả về confidence đủ cao thì dùng kết quả đó" },
      ],
      answer: "b",
      explanation: "Ngưỡng confidence cùng vòng feedback giúp AI hỗ trợ mà không đưa ra kết luận sai một cách tự tin.",
    },
  ],

  "quality-dashboard": [
    {
      id: "how-many",
      prompt: "Dashboard chất lượng có 30 biểu đồ nhưng không ai xem. Cải thiện thế nào?",
      options: [
        { id: "a", text: "Thêm 10 biểu đồ nữa để mỗi team đều tìm được chỉ số liên quan đến mình" },
        { id: "b", text: "Gửi email tự động hằng tuần nhắc mọi người vào xem dashboard chất lượng" },
        { id: "c", text: "Giữ 5–7 chỉ số, mỗi chỉ số có ngưỡng và hành động đi kèm" },
        { id: "d", text: "Thiết kế lại với màu sắc bắt mắt và animation để thu hút người xem hơn" },
      ],
      answer: "c",
      explanation: "Chỉ số không dẫn tới hành động thì không ai cần xem.",
    },
    {
      id: "lagging",
      prompt: "Chỉ số nào là lagging metric (phản ánh kết quả)?",
      options: [
        { id: "a", text: "Flaky rate tuần này" },
        { id: "b", text: "Thời gian pipeline P95 của các PR được merge trong tuần gần nhất" },
        { id: "c", text: "Diff coverage của PR" },
        { id: "d", text: "Số escaped defect (bug lọt lên production)" },
      ],
      answer: "d",
      explanation: "Escaped defect cho biết kết quả cuối cùng; các chỉ số còn lại là tín hiệu báo trước.",
    },
    {
      id: "blame",
      prompt: "Cách sử dụng dashboard nào phù hợp?",
      options: [
        { id: "a", text: "Tổng hợp theo team hoặc khu vực code, mục tiêu cải thiện hệ thống" },
        { id: "b", text: "Xếp hạng cá nhân viết nhiều test flaky nhất để tạo động lực cải thiện chất lượng" },
        { id: "c", text: "Chỉ hiển thị số liệu hiện tại cho gọn, vì xu hướng cũ không còn phản ánh thực tế" },
        { id: "d", text: "Chỉ leadership được xem" },
      ],
      answer: "a",
      explanation: "Dùng để đổ lỗi khiến mọi người né tránh dữ liệu; xu hướng theo hệ thống mới giúp cải tiến.",
    },
  ],
};
