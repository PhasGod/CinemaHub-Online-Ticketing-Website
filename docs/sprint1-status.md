# Trạng thái Sprint 1 ngày 08 10 2026

US.01–US.08 đã có giao diện, API và schema. Source đã nối quản trị, trang chủ/danh sách/chi tiết phim với API và chặn đặt vé mô phỏng. Chưa coi tất cả user story được nghiệm thu.

## Sửa đã hoàn thành

- Admin-only API và trang quản trị.
- Phân trang phim/tài khoản, ngày khởi chiếu, thể loại hợp lệ và cập nhật nhiều ghế.
- Dashboard báo lỗi/thử lại; seed giữ dữ liệu phim hiện có.
- Request ghi cần header riêng và Origin hợp lệ; giới hạn đăng nhập/đăng ký.
- Đăng xuất báo lỗi nếu chưa hủy được phiên server.
- README MySQL trực tiếp, shadow database, checklist nghiệm thu.

## Kiểm tra đã chạy

- TypeScript frontend/backend: đạt.
- Build frontend/backend: đạt trước sửa phản hồi lỗi CORS; kiểm tra TypeScript lại sau sửa.
- 3 nhóm test tự động: CSRF, rate limit, phân trang: đạt.
- API thực: health 200; phân trang sai 400; admin chưa đăng nhập 401; thiếu header CSRF 403.
- Origin ngoài danh sách bị chặn; đã sửa mã lỗi từ 500 thành 403.

## Chưa xác nhận nghiệm thu

Chưa chạy đầy đủ thao tác đăng ký/CRUD/khóa tài khoản/rollback trên database bằng dữ liệu kiểm thử riêng. Không sửa báo cáo gốc thành đạt. Thực hiện docs/sprint1-acceptance.md để lưu bằng chứng và cập nhật Test Execute, Defect Report, Test Report, Traceability Matrix/UAT.

Giới hạn đăng nhập lưu trong RAM một tiến trình. Các kiểm tra đồng thời bảo vệ admin cuối cùng và ràng buộc khi xóa dữ liệu cần kiểm thử cạnh tranh riêng. Không tuyên bố đã triển khai multi-instance hoặc nghiệm thu toàn bộ.
