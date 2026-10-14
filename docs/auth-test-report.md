# Báo cáo kiểm thử đăng ký và đăng nhập

**Ngày thực hiện:** 09/10/2026  
**Phạm vi:** `D:\ThietKePhanMem\CinemaHub-Online-Ticketing-Website-main`  
**Mục tiêu:** xác nhận hành vi đăng ký/đăng nhập ở tầng controller; chuẩn bị kiểm thử HTTP + MySQL khi có cấu hình môi trường.

## 1. Thư mục và tệp liên quan

| Khu vực | Vai trò | Số tệp / dòng mã lúc kiểm tra |
|---|---|---:|
| `src/context` | Lưu trạng thái người dùng ở frontend | 1 / 117 |
| `src/services` | Gọi API; tự thêm header bảo vệ cho request ghi | 3 / 342 |
| `src/types` | Kiểu `User`, `LoginPayload`, `RegisterPayload` | 1 / 27 |
| `backend/src/controllers` | Xử lý đăng ký, đăng nhập, phiên và nghiệp vụ Sprint 1 | 6 / 1.155 |
| `backend/src/routes` | Khai báo endpoint, xác thực và giới hạn request | 6 / 107 |
| `backend/src/middleware` | Xác thực phiên, phân quyền, CSRF, rate limit | 2 / 106 |
| `backend/src/config` | Prisma Client | 1 / 5 |
| `backend/prisma` | Schema, migration và seed MySQL | 5 / 639 |
| `backend/tests` | Test bảo mật và xác thực | 3 / 326 |
| `docs` | Tài liệu trạng thái/nghiệm thu Sprint 1 và báo cáo này | 3 / 125 |

Các tệp xác thực chính:

- `src/services/api.ts`: đặt `credentials: include`, thêm `X-CinemaHub-Request: 1` cho POST/PUT/PATCH/DELETE.
- `src/services/auth.service.ts`: gọi `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/profile`.
- `backend/src/routes/auth.routes.ts`: áp dụng rate limit cho đăng ký/đăng nhập.
- `backend/src/controllers/auth.controller.ts`: Zod validation, băm BCrypt, role mặc định `customer`, tạo session 7 ngày và cookie HttpOnly.
- `backend/src/middleware/auth.ts`: đọc cookie/bearer token, kiểm tra hết hạn và tài khoản bị khóa.
- `backend/prisma/schema.prisma`: `User.email` và `Session.token` là duy nhất; session bị xóa cascade khi xóa user.

## 2. Test case đã bổ sung

| Mã | Tình huống | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| AUTH-UNIT-01 | Đăng ký hợp lệ | HTTP 201, role `customer`, cookie HttpOnly, mật khẩu được BCrypt hash | Đạt |
| AUTH-UNIT-02 | Email trùng | HTTP 400, không tạo thêm tài khoản | Đạt |
| AUTH-UNIT-03 | Dữ liệu đăng ký sai | HTTP 400 | Đạt |
| AUTH-UNIT-04 | Đăng nhập đúng | HTTP 200, tạo session cookie | Đạt |
| AUTH-UNIT-05 | Sai mật khẩu/email | HTTP 401 | Đạt |
| AUTH-INT-01 | Đăng ký → đăng nhập → `/me` → đăng xuất với MySQL thật | 201/200/200/200 rồi `/me` trả 401 | Chờ cấu hình MySQL |

Tệp test mới:

- `backend/tests/auth.controller.test.ts`: test đơn vị chạy không phụ thuộc database.
- `backend/tests/auth.integration.test.ts`: test HTTP thật, dùng email ngẫu nhiên và `finally` để xóa dữ liệu test.

## 3. Kết quả thực thi

Lệnh đã chạy:

```powershell
cd backend
npm test
npx tsc --noEmit
npm run test:auth:integration
```

Kết quả:

- `npm test`: **5/5 đạt** — 3 test bảo mật có sẵn và 2 test xác thực mới.
- `npx tsc --noEmit`: **đạt**.
- `npm run test:auth:integration`: **skip**, không phải fail, vì `backend/.env` hiện chưa tồn tại nên thiếu `DATABASE_URL`.

## 4. Thay đổi thực hiện

- Bổ sung `auth.controller.test.ts`.
- Bổ sung `auth.integration.test.ts`; test chỉ chạy khi có `DATABASE_URL` và tự dọn user/session test.
- Sửa `backend/package.json` để test chạy được trên Windows: wildcard `tests/*.test.ts` trước đây không được `cmd.exe` mở rộng.
- Thêm `pretest: prisma generate` để Prisma Client luôn được sinh trước khi test.
- Bổ sung `backend/.env.example`; README trước đó có tham chiếu tới tệp này nhưng tệp chưa tồn tại.
- Đã chạy `npm install` trong `backend`; npm báo 3 cảnh báo bảo mật mức cao trong dependency tree. Chưa chạy `npm audit fix` để tránh nâng cấp tự động ngoài phạm vi.

## 5. Điều kiện còn thiếu và khuyến nghị

Chưa thể kết luận luồng đăng ký/đăng nhập **end-to-end với MySQL thật** vì thiếu tệp cấu hình cục bộ `backend/.env`. Sao chép `backend/.env.example` thành `backend/.env`, điền thông tin MySQL thật rồi chạy:

```powershell
cd backend
npm run test:auth:integration
```

Integration test xác minh cả HTTP status, header CSRF, Origin, cookie session, dữ liệu MySQL và việc logout vô hiệu phiên. Không lưu mật khẩu hay chuỗi kết nối vào báo cáo này.
