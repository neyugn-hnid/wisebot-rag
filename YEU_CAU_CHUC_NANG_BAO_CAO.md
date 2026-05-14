# Yêu Cầu Chức Năng

## 1. Giới thiệu
Hệ thống WiseBot là nền tảng trợ lý AI doanh nghiệp ứng dụng kỹ thuật RAG (Retrieval-Augmented Generation), cho phép tổ chức xây dựng kho tri thức từ tài liệu nội bộ, khai thác tri thức qua hội thoại, nhúng chatbot lên website và quản lý dịch vụ theo mô hình đa tenant.

Mục tiêu của hệ thống là hỗ trợ người dùng:

- quản lý tài khoản và phân quyền sử dụng;
- tạo và quản trị kho tri thức;
- tải lên, xử lý và tìm kiếm tài liệu;
- đặt câu hỏi và nhận câu trả lời từ chatbot AI;
- triển khai chatbot nhúng trên website;
- quản lý gói dịch vụ, hóa đơn và thanh toán.

## 2. Các tác nhân của hệ thống

### 2.1. Khách truy cập
Là người dùng chưa đăng nhập, có thể truy cập trang giới thiệu, đăng ký tài khoản, đăng nhập, xác minh email và khôi phục mật khẩu.

### 2.2. Người dùng
Là người dùng đã đăng nhập thuộc một tenant, có thể sử dụng các chức năng như quản lý knowledge base, tải tài liệu, sử dụng chatbot, cấu hình widget và quản lý hồ sơ cá nhân.

### 2.3. Quản trị viên
Là người dùng có quyền quản trị trong tenant hoặc toàn hệ thống, có thể quản lý người dùng, theo dõi hoạt động, xem thống kê và quản lý các thông tin liên quan đến thanh toán.

### 2.4. Dịch vụ nội bộ
Bao gồm các service backend như AI service, embedding service, billing service. Nhóm tác nhân này thực hiện các chức năng kỹ thuật nội bộ phục vụ xử lý dữ liệu và phối hợp giữa các phân hệ.

## 3. Yêu cầu chức năng tổng quát

Hệ thống cần đáp ứng các nhóm chức năng chính sau:

- quản lý người dùng và xác thực;
- quản lý knowledge base và tài liệu;
- tìm kiếm ngữ nghĩa và sinh câu trả lời AI;
- quản lý hội thoại chatbot;
- quản lý widget nhúng;
- quản lý gói dịch vụ và thanh toán;
- hỗ trợ dashboard và giao diện quản trị.

## 4. Yêu cầu chức năng chi tiết

### 4.1. Chức năng quản lý tài khoản và xác thực

Hệ thống phải cho phép người dùng đăng ký tài khoản mới bằng email và mật khẩu. Sau khi đăng ký, hệ thống gửi mã OTP để xác minh email trước khi cho phép đăng nhập. Người dùng có thể đăng nhập bằng email hoặc tên đăng nhập, nhận access token và refresh token để duy trì phiên làm việc. Hệ thống cũng phải hỗ trợ các chức năng gửi lại mã xác minh, đăng xuất, quên mật khẩu, kiểm tra OTP đặt lại mật khẩu và đặt lại mật khẩu mới.

Ngoài ra, hệ thống phải kiểm tra trạng thái tài khoản khi đăng nhập. Các tài khoản chưa xác minh hoặc bị khóa phải bị từ chối truy cập.

### 4.2. Chức năng quản lý người dùng

Hệ thống phải cho phép người dùng xem và cập nhật hồ sơ cá nhân, bao gồm thông tin cơ bản và mật khẩu. Đối với quản trị viên, hệ thống phải cho phép xem danh sách người dùng, tìm kiếm, lọc, phân trang, xem chi tiết, cập nhật thông tin, đổi trạng thái và xóa người dùng.

Hệ thống cũng phải hỗ trợ mời người dùng mới tham gia tenant thông qua email.

### 4.3. Chức năng quản lý knowledge base

Hệ thống phải cho phép người dùng tạo mới, cập nhật, xem danh sách, xem chi tiết và xóa knowledge base. Mỗi knowledge base thuộc về một tenant và được dùng làm nguồn tri thức cho chatbot.

Việc tạo knowledge base phải tuân theo giới hạn của gói dịch vụ hiện tại.

### 4.4. Chức năng quản lý tài liệu

Hệ thống phải cho phép tải lên một hoặc nhiều tài liệu vào knowledge base. Sau khi tải lên, hệ thống lưu thông tin tài liệu như tên file, loại file, dung lượng và trạng thái xử lý.

Hệ thống phải xử lý tài liệu theo quy trình:

- trích xuất nội dung văn bản từ file;
- chia nội dung thành các đoạn nhỏ;
- gửi các đoạn này sang dịch vụ embedding để lập chỉ mục vector;
- cập nhật trạng thái xử lý của tài liệu.

Người dùng phải có thể xem danh sách tài liệu, xem trạng thái xử lý, xem preview nội dung, xem các đoạn dữ liệu đã tách, tìm kiếm nội dung trong knowledge base, xử lý lại tài liệu và xóa tài liệu khi cần.

### 4.5. Chức năng tìm kiếm ngữ nghĩa và embedding

Hệ thống phải tạo và quản lý collection embedding cho knowledge base. Các đoạn văn bản sau khi được xử lý phải được chuyển thành vector và lưu vào kho vector để phục vụ tìm kiếm semantic.

Hệ thống phải cho phép tìm kiếm ngữ nghĩa theo câu truy vấn và trả về các đoạn nội dung liên quan nhất cùng với thông tin nguồn. Đây là đầu vào quan trọng cho quá trình sinh câu trả lời của chatbot.

### 4.6. Chức năng chatbot hỏi đáp

Hệ thống phải cho phép tạo phiên hội thoại, lưu lịch sử hội thoại và gửi câu hỏi đến chatbot. Với mỗi câu hỏi, hệ thống thực hiện truy xuất ngữ cảnh liên quan từ knowledge base, gửi ngữ cảnh này tới AI service và nhận lại câu trả lời.

Hệ thống phải lưu câu hỏi, câu trả lời và danh sách trích dẫn nguồn dữ liệu. Người dùng cũng phải có thể xem lịch sử tin nhắn, xem citation và gửi phản hồi cho câu trả lời của AI.

Ngoài chế độ hỏi đáp thông thường, hệ thống cần hỗ trợ cơ chế trả lời theo thời gian thực hoặc streaming.

### 4.7. Chức năng AI service

AI service phải cung cấp API sinh câu trả lời dựa trên ngữ cảnh đã truy xuất. Câu trả lời phải bám sát dữ liệu trong tài liệu; nếu không có dữ liệu phù hợp, hệ thống phải thông báo không tìm thấy thông tin trong tài liệu.

AI service cũng phải ghi nhận thông tin xử lý như mã request, trace ID, thời gian phản hồi, số lượng token và trạng thái thực thi để phục vụ theo dõi và kiểm thử.

### 4.8. Chức năng widget nhúng

Hệ thống phải cho phép tạo widget chatbot cho từng tenant, cấu hình tên widget, lời chào và các thuộc tính giao diện. Sau khi cấu hình, hệ thống phải sinh mã nhúng để người dùng tích hợp chatbot lên website ngoài.

Hệ thống phải hỗ trợ:

- cung cấp cấu hình widget công khai theo mã widget;
- tạo session cho người truy cập từ website ngoài;
- ghi nhận các sự kiện phát sinh từ widget;
- quản lý domain được phép sử dụng widget;
- quản lý API key phục vụ tích hợp.

Một số khả năng tùy biến widget phải phụ thuộc vào gói dịch vụ mà tenant đang sử dụng.

### 4.9. Chức năng quản lý gói dịch vụ và thanh toán

Hệ thống phải quản lý danh sách gói dịch vụ, bảng giá, subscription, hóa đơn, payment và thông tin sử dụng dịch vụ. Tenant có thể đăng ký hoặc nâng cấp gói đang dùng.

Hệ thống phải hỗ trợ thanh toán qua VNPay, bao gồm tạo liên kết thanh toán và xác minh kết quả thanh toán trả về. Đồng thời, billing service phải cung cấp thông tin entitlement nội bộ cho các service khác nhằm kiểm soát giới hạn sử dụng.

### 4.10. Chức năng giao diện quản trị

Hệ thống phải cung cấp các màn hình chính gồm:

- trang giới thiệu;
- đăng nhập, đăng ký, xác minh email, quên mật khẩu;
- dashboard;
- quản lý knowledge base;
- chatbot playground;
- cấu hình widget;
- quản lý người dùng;
- billing và nâng cấp gói;
- hồ sơ cá nhân và cài đặt;
- analytics.

Giao diện cần hỗ trợ ít nhất hai ngôn ngữ là tiếng Việt và tiếng Anh.

## 5. Ràng buộc nghiệp vụ

- Người dùng đăng ký mới sẽ được gán vào tenant mới với gói mặc định.
- Số lượng knowledge base, tài liệu, dung lượng lưu trữ và số tin nhắn được phép sử dụng phụ thuộc vào gói dịch vụ.
- Một số tính năng nâng cao như tùy biến widget hoặc analytics nâng cao chỉ khả dụng ở các gói cao hơn.
- Chatbot chỉ được trả lời dựa trên ngữ cảnh đã truy xuất từ kho tri thức.

## 6. Kết luận

Từ việc khảo sát mã nguồn hiện tại, có thể xác định hệ thống WiseBot đã được xây dựng theo kiến trúc microservice với các chức năng trọng tâm xoay quanh quản lý tri thức, chatbot AI, widget nhúng và thanh toán dịch vụ. Bộ yêu cầu chức năng trên là cơ sở để mô tả phạm vi hệ thống trong báo cáo tốt nghiệp, đồng thời hỗ trợ cho các phần tiếp theo như use case, thiết kế hệ thống và kiểm thử.
