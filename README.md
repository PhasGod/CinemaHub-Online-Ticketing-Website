# CinemaHub Online Ticketing Website - Sprint 1

Hệ thống đặt vé xem phim trực tuyến CinemaHub (5TOP CINEMA) được phát triển với React 19, Vite 8, Tailwind CSS v4, Node.js, Express, TypeScript và Prisma (MySQL).

---

## 🛠️ Công nghệ sử dụng

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, React Router v7.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, BcryptJS, Cookie-Parser, Zod.
- **Database**: MySQL 8 (quản lý qua Docker Compose & Prisma Migration).

---

## 🚀 Hướng dẫn khởi chạy dự án

### 1. Chuẩn bị môi trường & Cơ sở dữ liệu MySQL

Có 2 cách để khởi chạy MySQL:

#### Cách 1: Sử dụng Docker Compose (Khuyên dùng)
```bash
# Khởi chạy container MySQL
docker-compose up -d
```

#### Cách 2: Sử dụng MySQL Server cài sẵn trên máy
Tạo database có tên `cinemahub_db` trong MySQL của bạn.

---

### 2. Cấu hình biến môi trường

Tạo file `.env` từ `.env.example` trong thư mục `backend/`:
```bash
cp backend/.env.example backend/.env
```

Nội dung `backend/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:8443
DATABASE_URL="mysql://cinemahub_user:cinemahub_pass@localhost:3306/cinemahub_db"
JWT_SECRET=super-secret-cinemahub-key-2026
```

---

### 3. Cài đặt dependencies, Migration & Seed dữ liệu

#### Bước A: Backend Setup
```bash
cd backend
npm install

# Sinh Prisma Client
npm run prisma:generate

# Tạo Migration và đồng bộ DB schema vào MySQL
npm run prisma:migrate -- --name init_phase1

# Thêm dữ liệu mẫu (seed admin, staff, customer)
npm run seed

# Chạy backend dev server (Port 5000)
npm run dev
```

#### Bước B: Frontend Setup
Mở terminal mới ở thư mục gốc của dự án:
```bash
npm install
npm run dev
```
Frontend sẽ chạy tại `http://localhost:8443` (hoặc cổng được Vite cấp phát).

---

## 🔑 Tài khoản Demo (Chỉ phục vụ phát triển & kiểm thử)

| Quản trị viên (Admin) | Nhân viên (Staff) | Khách hàng (Customer) | Mật khẩu chung |
| :--- | :--- | :--- | :--- |
| `admin@5top.vn` | `staff@5top.vn` | `user@5top.vn` | `123456` |

---

## 📋 Danh sách API Auth chính (Phase 1)

- `POST /api/auth/register` - Đăng ký tài khoản (Tự động cấp role `customer`).
- `POST /api/auth/login` - Đăng nhập (Cấp cookie HttpOnly `session_token`).
- `POST /api/auth/logout` - Đăng xuất (Hủy session trong DB và xóa cookie).
- `GET /api/auth/me` - Khôi phục phiên làm việc hiện tại.
- `PUT /api/auth/profile` - Cập nhật họ tên và số điện thoại cá nhân.
