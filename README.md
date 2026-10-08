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
npm run prisma:generate
npm run prisma:migrate -- --name sprint1
npm run seed
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
