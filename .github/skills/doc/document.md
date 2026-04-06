Bối cảnh

Một công ty có rất nhiều tài liệu: PDF, Word, tài liệu hướng dẫn, quy trình nội bộ…
Nhưng nhân viên hoặc khách hàng khó tìm thông tin nhanh.

👉 Họ cần một chatbot có thể:

Hiểu tài liệu của họ
Trả lời câu hỏi chính xác
Hoạt động ngay trên website
👤 Nhân vật
User (Người dùng hệ thống)
WISEBOT System (Hệ thống chatbot AI)
Website Visitor (Người truy cập website có chatbot)
🎯 Mục tiêu hệ thống

WISEBOT là một nền tảng SaaS cho phép:

👉 Người dùng tạo chatbot riêng từ tài liệu của mình
👉 Chatbot có thể trả lời dựa trên nội dung tài liệu (RAG)
👉 Có thể nhúng vào website

⚙️ Kịch bản 1: Đăng ký & tạo chatbot

User mở hệ thống

→ Đăng ký tài khoản
→ Đăng nhập

User muốn tạo chatbot

→ Tạo "Knowledge Base" (bộ tri thức)

📂 Kịch bản 2: Upload tài liệu

User tải lên:

PDF
DOCX
TXT

Hệ thống xử lý:

Đọc nội dung tài liệu
Chia nhỏ thành đoạn
Chuyển thành vector embedding
Lưu vào Vector Database

👉 Lúc này chatbot đã "học" tài liệu

🤖 Kịch bản 3: Hỏi đáp với chatbot

User hỏi:

"Quy trình đăng ký tài khoản như thế nào?"

Hệ thống thực hiện:

Chuyển câu hỏi thành vector
Tìm đoạn tài liệu liên quan
Gửi vào mô hình AI (LLM)
Sinh câu trả lời

👉 Trả về:

Câu trả lời
Kèm nguồn trích dẫn từ tài liệu
🌐 Kịch bản 4: Nhúng chatbot vào website

User lấy đoạn script:

<script src="wisebot.js"></script>

→ Nhúng vào website

👉 Khách truy cập website có thể chat trực tiếp

💰 Kịch bản 5: SaaS & thanh toán

User có thể:

Chọn gói miễn phí / trả phí
Thanh toán online
Mở rộng giới hạn chatbot
🧠 Cách hệ thống hoạt động (core AI)

Hệ thống dùng mô hình:

👉 RAG (Retrieval-Augmented Generation)

Luồng:

Tài liệu → embedding
Câu hỏi → embedding
So sánh → tìm đoạn liên quan
LLM → sinh câu trả lời

👉 Ưu điểm:

Không cần train model từ đầu
Trả lời đúng theo tài liệu riêng
🏗️ Kiến trúc hệ thống (Microservice)

Hệ thống gồm nhiều service:

API Gateway
User Service
Document Service
Embedding Service
Chat Service
AI Service
Widget Service
Billing Service

👉 Ưu điểm:

Dễ mở rộng
Dễ bảo trì
Phù hợp SaaS
📊 Kịch bản 6: Theo dõi & quản lý

User có thể:

Xem lịch sử chat
Xem thống kê sử dụng
Quản lý tài liệu
Cập nhật chatbot
🧪 Kịch bản 7: Kiểm thử & hoàn thiện

Hệ thống cần đảm bảo:

Trả lời đúng nội dung
Phản hồi nhanh
Ổn định

NHIỆM VỤ CÁC SERVICE TRONG WISEBOT
1️⃣ API Gateway

👉 Vai trò: Cổng vào duy nhất của hệ thống

Nhiệm vụ:

Nhận tất cả request từ client (web, mobile, widget)
Xác thực (Auth token)
Điều hướng request đến service phù hợp
Giới hạn request (rate limit)
Log & monitoring

👉 Hiểu đơn giản:
"Người gác cổng – phân luồng traffic"

2️⃣ User Service

👉 Vai trò: Quản lý người dùng

Nhiệm vụ:

Đăng ký / đăng nhập
Quản lý thông tin user
Phân quyền (admin, user)
Xác thực (JWT, OAuth)

👉 Dữ liệu quản lý:

User
Role
Tenant (multi-tenant)
3️⃣ Document Service

👉 Vai trò: Xử lý tài liệu

Nhiệm vụ:

Upload file (PDF, DOCX, TXT)
Lưu trữ tài liệu
Đọc & trích xuất nội dung
Chia nhỏ tài liệu (chunking)
Quản lý Knowledge Base

👉 Output:

Văn bản đã được xử lý
4️⃣ Embedding Service

👉 Vai trò: Biến text thành vector

Nhiệm vụ:

Nhận text từ Document Service
Tạo vector embedding
Lưu vào Vector Database

👉 Khi hỏi:

Convert câu hỏi → vector
Truy xuất vector gần nhất

👉 Đây là core của RAG

5️⃣ Chat Service

👉 Vai trò: Điều phối hội thoại

Nhiệm vụ:

Nhận câu hỏi từ user
Gọi Embedding Service để tìm context
Gửi dữ liệu sang AI Service
Trả kết quả về client
Lưu lịch sử chat

👉 Quản lý:

Conversation
Message
6️⃣ AI Service

👉 Vai trò: Sinh câu trả lời

Nhiệm vụ:

Nhận:
Câu hỏi
Context (tài liệu liên quan)
Gọi mô hình LLM (OpenAI, local model…)
Sinh câu trả lời
Format output (kèm nguồn trích dẫn)

👉 Đây là “bộ não AI”

7️⃣ Widget Service

👉 Vai trò: Chatbot nhúng website

Nhiệm vụ:

Cung cấp script chatbot
UI chat (floating chatbox)
Kết nối với Chat Service qua API
Customize giao diện (màu, logo…)

👉 Output:

<script src="wisebot.js"></script>
8️⃣ Billing Service

👉 Vai trò: Thanh toán & gói dịch vụ

Nhiệm vụ:

Quản lý gói (Free, Pro, Enterprise)
Tính toán usage:
Số request
Token usage
Xử lý thanh toán
Quản lý subscription