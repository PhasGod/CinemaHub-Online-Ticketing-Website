# CinemaHub - Hệ Thống Đặt Vé & Quản Lý Vận Hành Rạp Chiếu Phim (5TOP CINEMA)

CinemaHub là hệ thống đặt vé xem phim trực tuyến hiện đại với kiến trúc phân tách Client - Server tách biệt. Ứng dụng cung cấp giải pháp khép kín từ khâu chọn phim, đặt và giữ ghế thời gian thực chống race condition, thanh toán VietQR động cho khách hàng, đến cổng quản trị và trạm soát vé điện tử bằng mã QR cho nhân viên rạp.

🌐 **Demo Trực Tuyến (Live Website):** [https://cinemahub-online-ticketing-website.onrender.com](https://cinemahub-online-ticketing-website.onrender.com)

---

## 🚀 Công Nghệ Sử Dụng

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, html5-qrcode (Cổng mặc định: `8443`).
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, Nodemailer (Gmail SMTP), qrcode (Cổng mặc định: `3000`).
- **Cơ sở dữ liệu:** TiDB Cloud Serverless (MySQL 8.0 phân tán đám mây, kết nối bảo mật TLS strict).
- **Kiến trúc & Bảo mật:**
  - Mô hình Client - Server RESTful API tách biệt.
  - Quản lý phiên làm việc qua Session Cookie `HttpOnly`.
  - Header bảo mật chống CSRF: `X-CinemaHub-Request: 1`.
  - Giới hạn tần suất request (Rate Limiting chống brute-force: 10 requests / 15 phút cho Auth).
  - Khóa giao dịch nguyên tử với `prisma.$transaction` ngăn chặn tuyệt đối tình trạng bán/giữ trùng ghế (Race Condition).

---

## 📌 Phạm Vi Tính Năng Đã Triển Khai (Sprint 1 - Sprint 3)

### 🔹 Sprint 1: Quản Trị Hệ Thống & Dữ Liệu Nền Tảng
- **Xác thực & Người dùng:** Đăng ký, đăng nhập, bảo vệ phiên cookie, phân quyền 3 vai trò (`CUSTOMER`, `STAFF`, `ADMIN`).
- **Quản lý danh mục:** CRUD Phim (Movie), Thể loại (Genre), trạng thái phim (Đang chiếu / Sắp chiếu) và trailer.
- **Quản lý Cụm rạp & Phòng:** Cấu hình Cụm rạp (Cinema), Phòng chiếu (Room 2D, 3D, IMAX) và sơ đồ vị trí ghế cố định (Seat Standard / VIP).

### 🔹 Sprint 2: Luồng Đặt Vé Khép Kín & Thanh Toán
- **Quản lý Suất chiếu (Showtime):** Chống xung đột khung giờ trong cùng một phòng chiếu, tự động nhân bản trạng thái ghế `ShowtimeSeat` cho từng suất.
- **Giữ ghế thời gian thực (Real-time Hold Seats):** Khóa giữ ghế 5 phút (300 giây) bằng Transaction; cơ chế **Lazy Release** tự động thu hồi và giải phóng ghế quá hạn về trạng thái `AVAILABLE`.
- **Thanh toán & Vé điện tử:** Sinh mã VietQR động theo từng đơn hàng, tự sinh vé `Ticket` kèm Data URL mã QR code, tự động gửi email xác nhận đặt vé qua Gmail SMTP.
- **Trang khách hàng:** Quản lý và tra cứu vé điện tử cùng mã QR check-in tại `/my-tickets`.

### 🔹 Sprint 3: Cổng Nhân Viên & Vận Hành Rạp (Staff Portal)
- **CNM-53 (Điều hướng & Phân quyền Staff):** Route Guard bảo vệ không gian làm việc `/staff/*`, tự động điều hướng đúng quyền sau đăng nhập.
- **CNM-54 (Soát vé QR & Mã vé):** Trạm soát vé `/staff/check-in` hỗ trợ quét camera trực tiếp hoặc nhập nhanh mã vé, chặn soát vé trùng lặp (`USED`).
- **CNM-55 (Tra cứu vé & Đơn tại quầy):** Tìm kiếm đơn hàng theo mã booking, mã vé, email/SĐT khách hàng để hỗ trợ tại chỗ.
- **CNM-56 (Tra cứu suất chiếu Staff):** Theo dõi lịch chiếu trong ngày, kiểm tra trực quan sơ đồ ghế trống/đã bán của từng phòng.
- **CNM-57 (Kiểm thử nghiệp vụ Staff):** Bộ kiểm thử phân quyền RBAC và kiểm tra luồng soát vé ngoại lệ.
- **CNM-58 (Bán vé tại quầy & Combo F&B):** Luồng xuất vé trực tiếp cho khách vãng lai và tích hợp bán kèm combo bắp nước.
- **CNM-59 (Xử lý hủy vé & Hoàn tiền):** Quy trình hủy vé theo chính sách, cập nhật trạng thái `CANCELLED` và tự động giải phóng ghế tức thì.
- **CNM-60 (Báo cáo doanh thu & Vận hành):** Thống kê số lượng vé bán ra, tỷ lệ check-in vào rạp và doanh thu theo ngày/suất chiếu.

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy Local

### 1. Yêu cầu môi trường
- Node.js version 18 trở lên.
- Quản lý gói: `npm` hoặc `pnpm`.

### 2. Cấu hình biến môi trường (`backend/.env`)
Tạo file `backend/.env` (tham khảo `backend/.env.example`):

```env
# Database TiDB Cloud (Bắt buộc cờ ?sslaccept=strict)
DATABASE_URL="mysql://4VoHuSbVGeDi1DV.root:FptBDUX1IeCEYZyA@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/cinemahub_db?sslaccept=strict"
SHADOW_DATABASE_URL="mysql://4VoHuSbVGeDi1DV.root:FptBDUX1IeCEYZyA@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/cinemahub_shadow?sslaccept=strict"

# Port Cấu hình
PORT=3000
CLIENT_URL=http://localhost:8443

# Cấu hình Mail Service (Nodemailer Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=5topcinema.service@gmail.com
SMTP_PASS=ggytimahgxyswdmw
MAIL_FROM="5TOP CINEMA <5topcinema.service@gmail.com>"
```

> **Lưu ý:** Đảm bảo 2 database `cinemahub_db` và `cinemahub_shadow` đã được khởi tạo sẵn trên cụm TiDB Cloud.

### 3. Đồng bộ Database & Dữ liệu mẫu (Seed)
Mở terminal tại thư mục `backend`:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate deploy
npm run seed
```

### 4. Khởi chạy ứng dụng cục bộ

**Terminal 1 - Khởi chạy Backend:**
```bash
cd backend
npm run dev
# Backend hoạt động tại: http://localhost:3000
# Kiểm tra: http://localhost:3000/api/health
```

**Terminal 2 - Khởi chạy Frontend:**
```bash
# Tại thư mục gốc
npm install
npm run dev
# Frontend hoạt động tại: http://localhost:8443
```

---

## 👥 Tài Khoản Kiểm Thử (Demo Accounts)

| Vai trò | Email | Mật khẩu | Quyền hạn & Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@5top.vn` | `123456` | Toàn quyền quản trị danh mục phim, rạp, phòng chiếu, suất chiếu, người dùng và báo cáo doanh thu |
| **Staff** | `staff@5top.vn` | `123456` | Cổng `/staff`: Soát vé QR/mã vé, bán vé tại quầy & combo, xử lý hủy vé, tra cứu đơn |
| **Customer** | `user@5top.vn` | `123456` | Xem lịch chiếu, đặt giữ ghế 5 phút, thanh toán VietQR động, xem vé tại `/my-tickets` |

---

## 🧪 Kiểm Tra Tính Toàn Vẹn Mã Nguồn

```bash
# Kiểm tra TypeScript Frontend
npx tsc --noEmit
npm run build

# Kiểm tra TypeScript Backend
cd backend
npx tsc --noEmit
npm run build
npm test
```
