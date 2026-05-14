# Yêu Cầu Chức Năng Hệ Thống WiseBot

## 1. Mục tiêu hệ thống
WiseBot là nền tảng trợ lý AI doanh nghiệp theo mô hình RAG (Retrieval-Augmented Generation), cho phép người dùng tạo kho tri thức từ tài liệu, đặt câu hỏi trên dữ liệu nội bộ, nhúng chatbot lên website, và quản lý gói dịch vụ theo tenant.

Tài liệu này được suy ra từ mã nguồn hiện có trong dự án tại thời điểm quét ngày 13/05/2026. Đây là bản yêu cầu chức năng bám theo hiện trạng triển khai, không phải đặc tả nghiệp vụ đã được xác nhận cuối cùng với người dùng cuối.

## 2. Phạm vi chức năng
Hệ thống hiện gồm các phân hệ:

- `frontend`: giao diện web cho người dùng và quản trị.
- `user-service`: xác thực, hồ sơ người dùng, quản trị người dùng, lời mời, OTP email, quên mật khẩu.
- `document-service`: quản lý knowledge base, tải tài liệu, xử lý tài liệu, preview, tìm kiếm nội dung.
- `embedding-service`: tạo vector embedding, lập chỉ mục và tìm kiếm semantic.
- `chat-service`: quản lý phiên chat, hỏi đáp RAG, lưu tin nhắn, phản hồi, citation, realtime.
- `widget-service`: quản lý widget nhúng, session public, tracking event, domain, API key.
- `billing-service`: gói dịch vụ, subscription, invoice, payment, VNPay, entitlement nội bộ.
- `ai-service`: sinh câu trả lời bằng LLM cục bộ/Ollama dựa trên ngữ cảnh truy xuất.
- `api-gateway`: cổng truy cập tập trung.

## 3. Tác nhân sử dụng

- Khách truy cập: xem landing page, đăng ký, đăng nhập, xác minh email, đặt lại mật khẩu.
- Người dùng tenant: dùng chatbot, quản lý knowledge base, tài liệu, widget, billing, profile.
- Quản trị viên tenant hoặc admin: mời người dùng, quản lý người dùng, xem analytics, đổi trạng thái tài khoản.
- Dịch vụ nội bộ: gọi embedding, AI, entitlement, xử lý bảo mật liên service.

## 4. Yêu cầu chức năng chi tiết

### 4.1. Đăng ký, đăng nhập và bảo mật tài khoản

- `FR-01`: Hệ thống phải cho phép người dùng đăng ký tài khoản mới bằng họ tên, email và mật khẩu.
- `FR-02`: Hệ thống phải tạo tenant mới mặc định khi người dùng đăng ký không đi qua lời mời.
- `FR-03`: Hệ thống phải cho phép đăng ký theo lời mời để người dùng gia nhập tenant có sẵn.
- `FR-04`: Hệ thống phải tự sinh `username` duy nhất từ email nếu người dùng chưa có username.
- `FR-05`: Hệ thống phải gửi OTP xác minh email sau khi đăng ký.
- `FR-06`: Hệ thống phải cho phép xác minh email bằng OTP trong thời hạn hiệu lực.
- `FR-07`: Hệ thống phải cho phép gửi lại OTP xác minh email.
- `FR-08`: Hệ thống phải chỉ cho phép đăng nhập khi email đã được xác minh.
- `FR-09`: Hệ thống phải từ chối đăng nhập khi tài khoản bị khóa hoặc vô hiệu hóa.
- `FR-10`: Hệ thống phải cho phép đăng nhập bằng email hoặc username và mật khẩu.
- `FR-11`: Hệ thống phải phát hành `access token` và `refresh token` sau khi đăng nhập thành công.
- `FR-12`: Hệ thống phải cho phép làm mới phiên đăng nhập bằng refresh token hợp lệ.
- `FR-13`: Hệ thống phải cho phép đăng xuất và vô hiệu hóa token theo cơ chế blacklist.
- `FR-14`: Hệ thống phải hỗ trợ luồng quên mật khẩu gồm gửi OTP, kiểm tra OTP và đặt lại mật khẩu.
- `FR-15`: Hệ thống phải áp dụng rate limiting và ghi log audit cho các thao tác bảo mật quan trọng.

### 4.2. Quản lý hồ sơ và người dùng

- `FR-16`: Hệ thống phải cho phép người dùng xem hồ sơ cá nhân.
- `FR-17`: Hệ thống phải cho phép người dùng cập nhật thông tin hồ sơ như họ tên và số điện thoại.
- `FR-18`: Hệ thống phải cho phép người dùng đổi mật khẩu khi đang đăng nhập.
- `FR-19`: Hệ thống phải cho phép cập nhật email theo luồng xác thực phù hợp.
- `FR-20`: Hệ thống phải cho phép quản trị viên xem danh sách người dùng theo tenant.
- `FR-21`: Hệ thống phải hỗ trợ tìm kiếm, lọc, phân trang và sắp xếp danh sách người dùng.
- `FR-22`: Hệ thống phải cho phép quản trị viên xem chi tiết một người dùng.
- `FR-23`: Hệ thống phải cho phép quản trị viên cập nhật thông tin, vai trò và trạng thái người dùng.
- `FR-24`: Hệ thống phải cho phép quản trị viên khóa, mở khóa hoặc chuyển trạng thái người dùng.
- `FR-25`: Hệ thống phải cho phép quản trị viên xóa người dùng.
- `FR-26`: Hệ thống phải cho phép quản trị viên gửi lời mời tham gia tenant qua email.

### 4.3. Quản lý knowledge base

- `FR-27`: Hệ thống phải cho phép tạo knowledge base mới theo tenant.
- `FR-28`: Hệ thống phải cho phép xem chi tiết knowledge base.
- `FR-29`: Hệ thống phải cho phép liệt kê toàn bộ knowledge base của tenant.
- `FR-30`: Hệ thống phải cho phép cập nhật tên và mô tả knowledge base.
- `FR-31`: Hệ thống phải cho phép xóa knowledge base.
- `FR-32`: Hệ thống phải kiểm tra giới hạn số lượng knowledge base theo gói dịch vụ trước khi tạo mới.

### 4.4. Quản lý tài liệu và xử lý tri thức

- `FR-33`: Hệ thống phải cho phép tải lên một tài liệu vào knowledge base.
- `FR-34`: Hệ thống phải cho phép tải lên nhiều tài liệu cùng lúc.
- `FR-35`: Hệ thống phải lưu metadata tài liệu gồm tên file, loại file, kích thước, trạng thái và thời gian tạo.
- `FR-36`: Hệ thống phải kiểm tra giới hạn số lượng tài liệu và dung lượng lưu trữ theo gói dịch vụ trước khi nhận file.
- `FR-37`: Hệ thống phải trích xuất nội dung văn bản từ tài liệu sau khi tải lên.
- `FR-38`: Hệ thống phải chia tài liệu thành các đoạn nhỏ để phục vụ embedding.
- `FR-39`: Hệ thống phải gửi các đoạn nội dung sang `embedding-service` để tạo vector và lập chỉ mục.
- `FR-40`: Hệ thống phải xử lý tài liệu bất đồng bộ và cập nhật trạng thái `UPLOADED`, `PROCESSING`, `PROCESSED`, `FAILED`.
- `FR-41`: Hệ thống phải cho phép xem danh sách tài liệu thuộc một knowledge base.
- `FR-42`: Hệ thống phải cho phép xem metadata chi tiết của tài liệu.
- `FR-43`: Hệ thống phải cho phép xem trạng thái xử lý tài liệu.
- `FR-44`: Hệ thống phải cho phép reprocess tài liệu khi cần đồng bộ lại embedding.
- `FR-45`: Hệ thống phải cho phép xóa tài liệu và các chunk liên quan.
- `FR-46`: Hệ thống phải cho phép xem preview nội dung tài liệu từ các chunk đầu tiên.
- `FR-47`: Hệ thống phải cho phép xem danh sách chunk của một tài liệu.
- `FR-48`: Hệ thống phải cho phép tìm kiếm nội dung văn bản trong knowledge base.
- `FR-49`: Hệ thống phải cho phép tải xuống tài liệu khi lưu trữ file được bật.

### 4.5. Embedding và tìm kiếm semantic

- `FR-50`: Hệ thống phải cho phép tạo collection embedding cho từng knowledge base.
- `FR-51`: Hệ thống phải tự tạo collection active nếu knowledge base chưa có collection embedding.
- `FR-52`: Hệ thống phải cho phép index văn bản thô vào vector store.
- `FR-53`: Hệ thống phải cho phép index file trực tiếp vào vector store.
- `FR-54`: Hệ thống phải cho phép nhận danh sách chunk từ `document-service` để tạo embedding.
- `FR-55`: Hệ thống phải lưu job embedding, trạng thái xử lý và lỗi nếu có.
- `FR-56`: Hệ thống phải lưu vector vào Qdrant kèm metadata tenant, document, chunk, knowledge base.
- `FR-57`: Hệ thống phải cho phép semantic search theo tenant, collection hoặc knowledge base.
- `FR-58`: Hệ thống phải trả về danh sách đoạn liên quan gồm điểm tương đồng, nội dung chunk và metadata nguồn.

### 4.6. Chatbot RAG

- `FR-59`: Hệ thống phải cho phép tạo phiên chat cho tenant.
- `FR-60`: Hệ thống phải cho phép liệt kê các phiên chat theo tenant.
- `FR-61`: Hệ thống phải cho phép lưu tin nhắn người dùng và trợ lý trong từng phiên chat.
- `FR-62`: Hệ thống phải cho phép người dùng gửi câu hỏi tới một phiên chat.
- `FR-63`: Hệ thống phải hỗ trợ chỉ định knowledge base cụ thể khi đặt câu hỏi.
- `FR-64`: Hệ thống phải truy xuất các chunk liên quan từ `embedding-service` trước khi gọi LLM.
- `FR-65`: Hệ thống phải gửi câu hỏi và ngữ cảnh truy xuất sang `ai-service` để sinh câu trả lời.
- `FR-66`: Hệ thống phải lưu câu trả lời của trợ lý vào lịch sử chat.
- `FR-67`: Hệ thống phải lưu citation cho từng câu trả lời gồm tài liệu nguồn, chunk nguồn, điểm và snippet.
- `FR-68`: Hệ thống phải cho phép xem lịch sử tin nhắn của một phiên chat.
- `FR-69`: Hệ thống phải cho phép xem citation của một tin nhắn.
- `FR-70`: Hệ thống phải cho phép người dùng gửi phản hồi cho tin nhắn AI.
- `FR-71`: Hệ thống phải cho phép xem phản hồi đã gửi cho tin nhắn.
- `FR-72`: Hệ thống phải cho phép xóa phiên chat.
- `FR-73`: Hệ thống phải giới hạn số lượng tin nhắn theo tháng dựa trên entitlement của gói dịch vụ.
- `FR-74`: Hệ thống phải hỗ trợ luồng trả lời realtime/streaming qua WebSocket hoặc SSE cho chat.

### 4.7. AI service nội bộ

- `FR-75`: `ai-service` phải cung cấp API hỏi đáp RAG dạng đồng bộ.
- `FR-76`: `ai-service` phải cung cấp API hỏi đáp RAG dạng streaming.
- `FR-77`: `ai-service` phải chỉ trả lời dựa trên ngữ cảnh truy xuất và trả về thông báo không tìm thấy thông tin nếu không có dữ liệu phù hợp.
- `FR-78`: `ai-service` phải ghi lại request RAG, trace ID, token usage, latency và kết quả truy xuất/phản hồi.
- `FR-79`: `ai-service` phải cho phép tra cứu trạng thái xử lý của một request RAG.

### 4.8. Widget chatbot nhúng website

- `FR-80`: Hệ thống phải cho phép tạo widget cho tenant.
- `FR-81`: Hệ thống phải cho phép cập nhật tên widget, lời chào và cấu hình hiển thị.
- `FR-82`: Hệ thống phải cho phép liệt kê các widget của tenant.
- `FR-83`: Hệ thống phải sinh `code` công khai để nhúng widget lên website ngoài.
- `FR-84`: Hệ thống phải cung cấp endpoint public để lấy cấu hình widget theo `code`.
- `FR-85`: Hệ thống phải cung cấp script nhúng widget cho website ngoài.
- `FR-86`: Hệ thống phải cho phép tạo session public cho khách truy cập qua widget.
- `FR-87`: Hệ thống phải cho phép ghi nhận event phát sinh từ widget hoặc session public.
- `FR-88`: Hệ thống phải cho phép xem danh sách event gần nhất của widget.
- `FR-89`: Hệ thống phải cho phép cấu hình domain được phép sử dụng widget.
- `FR-90`: Hệ thống phải cho phép xem danh sách domain đã cấu hình.
- `FR-91`: Hệ thống phải cho phép tạo API key cho widget nếu gói dịch vụ hỗ trợ truy cập API.
- `FR-92`: Hệ thống phải cho phép xem danh sách API key của widget.
- `FR-93`: Hệ thống phải cho phép xem danh sách session của widget và kết thúc session khi cần.
- `FR-94`: Hệ thống phải giới hạn khả năng tùy biến giao diện widget theo entitlement của gói dịch vụ.

### 4.9. Thanh toán và gói dịch vụ

- `FR-95`: Hệ thống phải cho phép quản lý danh sách gói dịch vụ.
- `FR-96`: Hệ thống phải cho phép quản lý bảng giá theo chu kỳ thanh toán của từng gói.
- `FR-97`: Hệ thống phải cho phép tenant đăng ký hoặc nâng cấp gói dịch vụ.
- `FR-98`: Hệ thống phải cho phép xem subscription hiện tại theo tenant hoặc theo người dùng hiện tại.
- `FR-99`: Hệ thống phải cho phép xem danh sách hóa đơn của tenant.
- `FR-100`: Hệ thống phải cho phép tạo và xem payment cho hóa đơn.
- `FR-101`: Hệ thống phải cho phép tạo usage meter và usage event để đo lường tiêu thụ dịch vụ.
- `FR-102`: Hệ thống phải cung cấp API nội bộ để các service khác lấy entitlement của tenant.
- `FR-103`: Hệ thống phải hỗ trợ thanh toán qua VNPay.
- `FR-104`: Hệ thống phải tạo link checkout VNPay và xác minh kết quả trả về từ VNPay.
- `FR-105`: Hệ thống phải ánh xạ gói dịch vụ thành các quyền như số knowledge base, số tài liệu, dung lượng, số tin nhắn tháng, quyền API, quyền tùy biến widget, quyền analytics nâng cao.

### 4.10. Dashboard, analytics và màn hình quản trị

- `FR-106`: Hệ thống phải cung cấp dashboard sau đăng nhập.
- `FR-107`: Hệ thống phải cung cấp màn hình knowledge base management.
- `FR-108`: Hệ thống phải cung cấp playground để thử chatbot với knowledge base đã chọn.
- `FR-109`: Hệ thống phải cung cấp màn hình cấu hình widget và xem trước widget.
- `FR-110`: Hệ thống phải cung cấp màn hình user management cho vai trò quản trị.
- `FR-111`: Hệ thống phải cung cấp màn hình billing, nâng cấp gói và lịch sử hóa đơn.
- `FR-112`: Hệ thống phải cung cấp màn hình profile, settings, verify email và reset password.
- `FR-113`: Hệ thống phải cung cấp màn hình analytics cho vai trò quản trị.
- `FR-114`: Hệ thống phải hỗ trợ song ngữ ít nhất tiếng Việt và tiếng Anh trên frontend.

## 5. Quy tắc nghiệp vụ suy ra từ mã nguồn

- `BR-01`: Tenant mặc định khi đăng ký mới được gán gói `FREE`.
- `BR-02`: Gói `FREE` hiện giới hạn 1 knowledge base, 10 tài liệu, 100MB lưu trữ, 1000 tin nhắn/tháng.
- `BR-03`: Gói `PLUS` hiện giới hạn 5 knowledge base, 200 tài liệu, 5GB lưu trữ, 10000 tin nhắn/tháng.
- `BR-04`: Gói `PRO` hiện mở giới hạn knowledge base, tài liệu và tin nhắn; lưu trữ 50GB.
- `BR-05`: Quyền tùy biến widget không khả dụng với gói `FREE`.
- `BR-06`: Quyền analytics nâng cao và custom integration hiện chỉ bật cho gói `PRO`.
- `BR-07`: Khi không có ngữ cảnh phù hợp, AI phải trả về thông điệp không tìm thấy thông tin trong tài liệu.
- `BR-08`: Chatbot phải trả lời bằng tiếng Việt theo prompt hiện tại của `ai-service`.

## 6. Ghi chú hiện trạng khi quét mã nguồn

- Phân hệ knowledge base, tài liệu, chat, widget, billing và auth đã có backend khá đầy đủ.
- `APIKeys` trên frontend hiện còn dùng dữ liệu mô phỏng, chưa nối khớp hoàn toàn với backend.
- `Analytics` trên frontend mới kết hợp một phần dữ liệu thật với biểu đồ giả lập.
- Một số đường dẫn API frontend và backend chưa đồng nhất hoàn toàn, cần rà soát trước khi nghiệm thu tích hợp.
- Có sẵn cả luồng chat thường và luồng realtime/streaming ở backend, nhưng mức độ hoàn thiện frontend realtime cần kiểm tra thêm.

## 7. Đề xuất sử dụng tài liệu

- Nếu dùng cho đồ án, có thể lấy tài liệu này làm bản "Yêu cầu chức năng hiện trạng".
- Nếu cần nộp chính thức, nên tách tiếp thành:
  - đặc tả use case,
  - yêu cầu phi chức năng,
  - biểu đồ phân rã chức năng,
  - ma trận truy vết giữa chức năng và service.
