# CinemaHub Sprint 1

Phạm vi US.01–US.08: tài khoản, hồ sơ, quản trị tài khoản, thể loại, phim, phòng và ghế. Đặt vé, thanh toán và vé điện tử chưa mở.

## Chạy trên Windows với MySQL có sẵn

Dùng MySQL 8, Node.js và npm. Backend hiện dùng cổng 3000, frontend 8443. Không cần Docker.

1. Tạo database `cinemahub_db` và database phụ riêng `cinemahub_shadow` bằng tài khoản quản trị MySQL. Cấp quyền cho tài khoản ứng dụng trên cả hai database. Không dùng database chính làm shadow database.
2. Sao chép `backend/.env.example` thành `backend/.env`, nhập thông tin MySQL thật trên máy. Không commit `.env`.
3. Trong terminal backend:

```powershell
cd backend
npm install
npm run db:setup
npm test
npm run dev
```

4. Trong terminal mới tại thư mục gốc:

```powershell
npm install
npm run dev
```

Mở http://localhost:8443. Kiểm tra http://localhost:3000/api/health và http://localhost:8443/api/health. Cổng backend trong `.env` phải khớp target trong `vite.config.ts`.

Tài khoản demo: admin@5top.vn, staff@5top.vn, user@5top.vn; mật khẩu ban đầu 123456. Seed giữ mật khẩu và dữ liệu phim đã tồn tại.

### Giữ dữ liệu khi cập nhật từ GitHub

GitHub chỉ lưu mã nguồn; dữ liệu do quản trị viên nhập được lưu trong MySQL. Sau `git pull`, chạy `npm run db:setup` trong thư mục `backend` để áp dụng migration và khôi phục dữ liệu mặc định còn thiếu. Lệnh này không ghi đè thông tin phim đã được chỉnh sửa trong trang Quản trị và không xóa phim do quản trị viên tự tạo.

## Bảo vệ API

Chỉ admin quản trị dữ liệu Sprint 1. Phiên dùng cookie HttpOnly. Request POST/PUT/PATCH/DELETE phải có `X-CinemaHub-Request: 1`; frontend tự gửi header. Backend kiểm tra Origin và CORS theo CLIENT_URL. Đăng nhập và đăng ký giới hạn 10 request mỗi IP trong 15 phút, lưu trong bộ nhớ một tiến trình; khi mở rộng nhiều tiến trình cần kho giới hạn dùng chung. Không bật trust proxy tùy tiện.

## Kiểm tra

```powershell
npx tsc --noEmit
npm run build
cd backend
npx tsc --noEmit
npm run build
npm test
```

Xem `docs/sprint1-status.md` và `docs/sprint1-acceptance.md` để biết kết quả và các kiểm tra nghiệm thu cần xác nhận.


## Cổng thanh toán MoMo Sandbox (Sprint 2)

### 1. Cấu hình biến môi trường trong `backend/.env`
Truy cập trang [MoMo Developer Portal](https://developers.momo.vn/) để lấy thông tin tài khoản thử nghiệm Sandbox của bạn và điền vào `backend/.env`:
```env
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=http://localhost:8443/booking/success
MOMO_IPN_URL=https://your-public-tunnel-domain.trycloudflare.com/api/payments/momo/ipn
```

### 2. Thiết lập Public URL cho IPN Callback bằng Cloudflare Tunnel (Miễn phí)
Khi chạy ở môi trường local, máy chủ MoMo không thể gọi trực tiếp về `http://localhost:3000`. Bạn có thể sử dụng Cloudflare Tunnel để tạo URL công khai hoàn toàn miễn phí:

1. **Khởi chạy Cloudflare Tunnel:**
   ```powershell
   # Tải và chạy tunnel chuyển tiếp cổng backend 3000 ra Internet:
   cloudflared tunnel --url http://localhost:3000
   ```
2. **Cập nhật URL vào `backend/.env`:**
   Cloudflare Tunnel sẽ cấp một đường dẫn công khai dạng `https://xxxx-xxxx.trycloudflare.com`.
   Cập nhật biến `MOMO_IPN_URL` trong file `backend/.env`:
   ```env
   MOMO_IPN_URL=https://xxxx-xxxx.trycloudflare.com/api/payments/momo/ipn
   ```
3. **Cơ chế Polling dự phòng thông minh:**
   Ngay cả khi chưa mở Tunnel công khai, giao diện Frontend vẫn liên tục Polling trạng thái giao dịch qua API `GET /api/payments/momo/status/:orderId`. Ngay khi khách hàng quét mã và thanh toán thành công trên MoMo, backend sẽ tra cứu đối soát trực tiếp và cấp vé điện tử ngay tức khắc.
