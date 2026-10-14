# Kiểm tra nghiệm thu Sprint 1

Chỉ đánh dấu đạt khi chạy thực tế và lưu bằng chứng. Dùng dữ liệu kiểm thử riêng; không ghi đè tài khoản hoặc phim đang sử dụng.

- [ ] US.01: đăng ký hợp lệ; email trùng; dữ liệu sai; không tự cấp admin.
- [ ] US.02: đăng nhập đúng/sai; tải lại giữ phiên; đăng xuất vô hiệu phiên cũ; giới hạn đăng nhập trả 429.
- [ ] US.03: cập nhật hồ sơ; tải lại giữ dữ liệu; không đổi role hoặc hồ sơ người khác.
- [ ] US.04: tìm/thêm/sửa/khóa/mở khóa; khóa vô hiệu phiên; bảo vệ admin cuối cùng; phân trang sai trả 400.
- [ ] US.05: thêm/sửa/xóa; trùng tên; chặn xóa thể loại đang dùng.
- [ ] US.06: thêm/sửa/trạng thái; ngày sai và thể loại không tồn tại trả 400; đồng bộ trang khách hàng.
- [ ] US.07: tên phòng trùng; rạp không tồn tại; chặn xóa phòng có ghế.
- [ ] US.08: sinh ghế; đổi loại/bật tắt; sức chứa đúng; ghế sai phòng bị từ chối; lỗi transaction không lưu một phần.
- [ ] Customer/staff gọi API quản trị trả 403; chưa đăng nhập trả 401.
- [ ] Request ghi thiếu header hoặc Origin ngoài danh sách bị từ chối.
- [ ] Các đường dẫn đặt vé mô phỏng chỉ hiện thông báo đang phát triển.

Cập nhật Test Execute, Defect Report, Test Report, Traceability Matrix và UAT theo bằng chứng thực tế. Không coi checklist này là kết quả đạt.
