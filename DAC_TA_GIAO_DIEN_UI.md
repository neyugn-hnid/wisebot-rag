# Đặc Tả Giao Diện WiseBot

## 1. Mục đích

Tài liệu này mô tả giao diện cần bám theo khi thiết kế hoặc sinh UI cho hệ thống WiseBot. Đây là bản đặc tả màn hình và ngôn ngữ thiết kế, không phải sơ đồ UML.

Mục tiêu là để AI hoặc frontend developer có thể dựng giao diện mới nhưng vẫn giữ đúng phong cách hiện tại của sản phẩm.

## 2. Tinh thần thiết kế

- Phong cách tổng thể: `dark SaaS dashboard` kết hợp `editorial landing page`.
- Cảm giác thị giác: tối, sắc, gọn, hiện đại, thiên về sản phẩm AI/B2B.
- Không dùng giao diện màu mè hoặc gradient nặng trong khối quản trị.
- Mọi màn hình sau đăng nhập phải đồng nhất với dashboard hiện tại.
- Landing page có thể giàu tính trình diễn hơn, nhưng vẫn cùng hệ màu.

## 3. Design Tokens

### 3.1. Màu sắc

- Nền chính: `#000000`
- Nền phụ/card: `rgba(255,255,255,0.02)` hoặc `#000000`
- Border chuẩn: `rgba(255,255,255,0.3)`
- Chữ chính: `#f0f0f0`
- Chữ phụ: `#a1a4a5`
- Màu nhấn chính: `#3b9eff`
- Accent phụ:
  - cam: `#ff801f`
  - xanh lá: `#11ff99`
  - đỏ lỗi: `#ff0000`

### 3.2. Typography

- Font body: `Inter`
- Font display/headline: `aBCFavorit`
- Font serif cho landing hero: `Domaine` hoặc `Playfair Display`
- Font mono: `CommitMono`

Quy tắc:

- Tiêu đề trang: `24px`, display, medium.
- Tiêu đề section/card lớn: `16px - 20px`, bold hoặc semibold.
- Label nhỏ: `10px - 12px`, uppercase hoặc tracking rộng.
- Nội dung chuẩn: `14px`.

### 3.3. Radius và bóng

- Card/page section: `16px`
- Input/button nhỏ: `8px - 12px`
- Nút pill/CTA auth: `rounded-full`
- Shadow: nhẹ, tối, không quá blur

## 4. Layout chuẩn

## 4.1. Public pages

- Nền full đen.
- Header cố định trên cùng.
- Nội dung giới hạn trong `max-w-7xl`.
- Hero chia 2 cột trên desktop, 1 cột trên mobile.
- Section spacing lớn, thoáng.

## 4.2. App sau đăng nhập

- Sidebar trái cố định.
- Content bên phải scroll độc lập.
- Sidebar có 2 trạng thái: mở rộng và thu gọn.
- Mobile dùng off-canvas sidebar.
- Khoảng đệm trang:
  - desktop: `p-8`
  - mobile: `p-4`

## 4.3. Các pattern khung

- Card KPI: icon trái, chỉ số lớn, trạng thái tăng/giảm ở phải.
- Table module: header nhạt, border mờ, hover nền nhẹ.
- Modal: nền tối mờ + blur, hộp modal bo 16px.
- Empty state: icon mờ + 1 dòng chính + 1 dòng phụ.

## 5. Component Rules

## 5.1. Buttons

- Primary: nền trắng, chữ đen.
- Secondary: nền trong suốt, border trắng mờ.
- Danger: đỏ.
- Không dùng button màu tím.

## 5.2. Inputs

- Nền trắng rất mờ.
- Border trắng mờ.
- Focus ring trắng hoặc xanh primary.
- Lỗi: border đỏ, text lỗi đỏ.

## 5.3. Cards

- Mặc định nền đen hoặc trắng mờ 2%.
- Border trắng mờ 30%.
- Card analytics và dashboard phải đồng nhất.

## 5.4. Icons

- Dùng `lucide-react`.
- Màu icon mặc định là text phụ.
- Icon trạng thái:
  - success: xanh lá
  - warning/process: xanh primary hoặc vàng
  - error: đỏ

## 5.5. Charts

- Recharts.
- Nền chart trong suốt.
- Grid mảnh, độ tương phản thấp.
- Tooltip nền tối, border sáng mờ.

## 6. Điều hướng chuẩn

### 6.1. Sidebar chính

- Dashboard
- Knowledge Base
- Playground
- Integration / Widget Customization
- Analytics
- User Management
- Billing
- API Keys

### 6.2. Menu phụ cuối sidebar

- Docs
- FAQ
- Pricing
- Integration
- Contact
- Profile
- Settings

## 7. Đặc tả màn hình

## 7.1. Landing Page

Mục tiêu:

- Giới thiệu WiseBot như nền tảng chatbot AI cho doanh nghiệp.

Cấu trúc:

- Header fixed
- Hero 2 cột
- Features grid 4 ô
- How it works 3 bước
- Pricing 3 gói
- Docs section
- Footer nhiều cột

Yêu cầu UI:

- Hero trái là headline lớn serif/editorial.
- Hero phải là mockup cửa sổ chat.
- Nút CTA chính màu trắng.
- Toàn trang tối, tinh gọn, cao cấp.

## 7.2. Login

Cấu trúc:

- Form giữa màn hình, width hẹp.
- Logo phía trên.
- Input email, password, remember me.
- Link quên mật khẩu.
- Nút đăng nhập chính.
- Social login ở dưới.

Yêu cầu UI:

- Không thêm panel màu.
- Khoảng trắng gọn.
- Input bo vừa, icon đặt trong input.

## 7.3. Register

Cấu trúc:

- Tương tự Login.
- Thêm full name, confirm password, checkbox điều khoản.

Yêu cầu UI:

- Giữ cùng visual với Login.
- Hiển thị lỗi ngay dưới field.

## 7.4. Dashboard

Mục tiêu:

- Cung cấp tổng quan nhanh theo vai trò.

Cấu trúc admin:

- 4 KPI cards
- 1 area chart lớn
- 1 activity panel
- thêm bar chart + pie chart

Cấu trúc user:

- KPI ít hơn
- quick actions card

Yêu cầu UI:

- Mọi module là card bo 16px.
- KPI number lớn, label nhỏ uppercase.

## 7.5. Knowledge Base

Mục tiêu:

- Quản lý kho tri thức và tài liệu.

Cấu trúc:

- Overview knowledge bases
- Nút tạo knowledge base
- Chọn knowledge base để quản lý
- Upload file
- Bảng tài liệu
- Preview modal
- Create/Edit/Delete modal

Yêu cầu UI:

- Bảng tài liệu phải có các cột: tên file, trạng thái, size, ngày, action.
- Trạng thái dùng màu rõ ràng: completed, processing, failed.
- Preview file mở trong modal lớn.
- Nếu vượt giới hạn gói, hiển thị notice và điều hướng upgrade.

## 7.6. Chatbot Playground

Mục tiêu:

- Cho người dùng thử chatbot trên knowledge base.

Cấu trúc 3 cột:

- Trái: lịch sử chat
- Giữa: khung chat
- Phải: sources + settings

Yêu cầu UI:

- Giao diện phải giống ứng dụng chat chuyên nghiệp.
- Bong bóng user nền trắng, assistant nền tối hơn.
- Có typing indicator.
- Có panel citation riêng, không nhét citation vào giữa luồng chat.
- Settings gồm knowledge base, temperature, topK.

## 7.7. Widget Customization

Mục tiêu:

- Tùy biến chatbot widget và lấy mã nhúng.

Cấu trúc:

- Cột trái: settings
- Cột phải: live preview
- Tab `Appearance` và `Embed`

Yêu cầu UI:

- Có chọn tên bot, welcome message, icon, màu chính, màu icon, vị trí trái/phải.
- Có preview desktop/mobile.
- Có bubble nổi ở mép màn hình.
- Tab embed hiển thị đoạn script nhúng và nút copy.
- Nếu gói Free, khóa các tùy chỉnh nâng cao bằng notice rõ ràng.

## 7.8. Analytics

Mục tiêu:

- Thống kê hành vi sử dụng và tình trạng hệ thống.

Cấu trúc:

- Header + chọn khoảng thời gian
- KPI cards
- 2-4 chart
- Admin có thêm overview hệ thống

Yêu cầu UI:

- Ưu tiên card chart lớn, không nhồi quá nhiều số nhỏ.
- Dùng 1 màu chính cho dữ liệu, thêm 1-2 màu phụ khi thực sự cần.

## 7.9. User Management

Mục tiêu:

- Quản lý user trong tenant hoặc hệ thống.

Cấu trúc:

- Header + nút mời người dùng
- KPI cards nhỏ
- Thanh tìm kiếm và bộ lọc
- Bảng user
- Modal invite
- Modal edit
- Modal delete

Yêu cầu UI:

- Bảng có avatar, tên, email, role, status, last login, action.
- Action gồm khóa/mở khóa, sửa, xóa.
- Filter và search nằm cùng hàng với table header area.

## 7.10. Billing

Mục tiêu:

- Xem gói hiện tại, nâng cấp và xem lịch sử hóa đơn.

Cấu trúc user:

- Card gói hiện tại
- Payment history table
- Upgrade flow

Cấu trúc admin:

- KPI billing
- Bảng subscription gần đây

Yêu cầu UI:

- Gói hiện tại phải nổi bật nhưng không dùng quá nhiều màu.
- CTA upgrade rõ, dễ thấy.
- Checkout step là modal hoặc luồng 2 bước rõ ràng.

## 7.11. API Keys

Mục tiêu:

- Tạo và quản lý API key cho tích hợp.

Cấu trúc đề xuất bám theo hệ hiện tại:

- Header
- Danh sách key dạng table/card
- Nút tạo key
- Modal hiển thị key mới sinh

Yêu cầu UI:

- Key chỉ hiện đầy đủ một lần khi vừa tạo.
- Các lần sau chỉ hiện masked value.

## 7.12. Profile / Settings / Verify Email / Reset Password

Yêu cầu chung:

- Dùng card form đơn hoặc nhiều section card.
- Cùng bộ input và button với Login/Register.
- Verify email cần ô nhập OTP rõ ràng.
- Reset password cần flow 2 bước: gửi OTP và đặt lại mật khẩu.

## 8. Responsive Rules

- Mobile ưu tiên xếp dọc.
- Sidebar chuyển thành drawer.
- Table lớn phải có `overflow-x-auto`.
- Chat playground và widget customization có layout riêng cho mobile, không ép giữ 3 cột.
- CTA chính luôn nằm trong vùng dễ chạm.

## 9. Nội dung và ngôn ngữ

- Frontend phải hỗ trợ tối thiểu `vi` và `en`.
- Label ngắn, rõ, thiên về sản phẩm SaaS.
- Trạng thái nên dùng từ nhất quán:
  - `Completed`
  - `Processing`
  - `Failed`
  - `Active`
  - `Pending`
  - `Suspended`

## 10. Những gì AI phải tuân theo

- Không đổi hệ màu chủ đạo khỏi nền đen + chữ sáng + accent xanh.
- Không chuyển dashboard sang light mode.
- Không dùng layout “marketing template” chung chung cho phần app.
- Không trộn quá nhiều màu accent trên cùng một màn hình.
- Không dùng border dày, shadow nặng hoặc gradient sặc sỡ trong khu vực quản trị.
- Phải dùng card bo 16px, border sáng mờ, text phân cấp rõ.
- Mọi màn hình mới phải nhìn như cùng một sản phẩm với `Dashboard`, `Knowledge Base`, `Playground`, `Widget Customization`.

## 11. Prompt ngắn để đưa cho AI thiết kế UI

```text
Thiết kế giao diện cho WiseBot theo phong cách dark SaaS dashboard. Nền #000000, chữ chính #f0f0f0, chữ phụ #a1a4a5, accent chính #3b9eff. Card bo góc 16px, border trắng mờ rgba(255,255,255,0.3), shadow tối nhẹ. Typography dùng Inter cho body, aBCFavorit cho heading, serif editorial cho hero landing nếu cần. App sau đăng nhập dùng sidebar trái, content phải, mobile dùng drawer. UI phải đồng nhất với các màn hình: Dashboard, Knowledge Base, Chatbot Playground, Widget Customization, Billing, Analytics, User Management. Không dùng light theme, không dùng gradient sặc sỡ, không dùng layout generic.
```

## 12. File tham chiếu chính trong code

- `frontend/src/index.css`
- `frontend/src/components/DashboardLayout.tsx`
- `frontend/src/pages/LandingPage.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Register.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/KnowledgeBase.tsx`
- `frontend/src/pages/ChatbotPlayground.tsx`
- `frontend/src/pages/WidgetCustomization.tsx`
- `frontend/src/pages/Analytics.tsx`
- `frontend/src/pages/UserManagement.tsx`
- `frontend/src/pages/Billing.tsx`
