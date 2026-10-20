# Hướng Dẫn Sửa Thủ Công Đề Thi & Tranh Speaking Trên Trang Quản Trị (Admin)

Tài liệu này được lưu trực tiếp trong thư mục `frontend` của dự án để tiện tra cứu và gửi cho khách hàng / giáo viên.

---

## 1. Video Hướng Dẫn Trực Quan

File video hướng dẫn đã được tích hợp trực tiếp vào hệ thống:
- **Đường dẫn cục bộ trong code:** `/tutorials/guide_admin_edit_speaking.webp` (hoặc `public/tutorials/guide_admin_edit_speaking.webp`)
- **Xem trực tiếp trên web:** Bạn có thể mở modal "Hướng dẫn" trên thanh Header của trang Admin, bước **"Sửa Tranh & Câu hỏi Speaking Thủ công"** sẽ tự động phát video này!
- **URL xem qua trình duyệt:** `http://localhost:3000/tutorials/guide_admin_edit_speaking.webp`

---

## 2. Các Bước Thực Hiện Trên Trang Quản Trị

### 👉 Bước 1: Vào Trang Quản Trị Đề Thi
- Mở link: `http://localhost:3000/admin/exams`
- Đăng nhập tài khoản Quản trị viên (Admin).

### 👉 Bước 2: Chọn Đề Thi Speaking Cần Chỉnh Sửa
- Nhấp vào tab **Speaking** trên thanh lọc kỹ năng.
- Bấm nút **Biên soạn** (nút màu xám/đen bên phải) tại đề thi cần sửa.

### 👉 Bước 3: Sửa Tiêu Đề Tranh & Link Hình Ảnh (Part)
- Mở rộng Part cần chỉnh sửa (ví dụ: Part 2 hoặc Part 3).
- Bấm vào nút **Sửa** ở thanh tiêu đề Part.
- Sửa các trường:
  - **Tiêu đề phần thi:** Đổi tên tranh mô tả (ví dụ: *Gia đình trên ô tô*, *Nhóm bạn ở nhà hàng*).
  - **URL Hình ảnh (Tranh minh họa):** Nhập hoặc dán link ảnh mới (ví dụ: `/uploads/speaking/part2/image23.png` hoặc link online).
- Bấm nút **Lưu** (dấu tích xanh) ở Part.

### 👉 Bước 4: Sửa Nội Dung Câu Hỏi
- Ngay bên dưới Part, bấm nút **Sửa** (cây bút) ở từng câu hỏi:
  - Sửa câu hỏi tại ô **Nội dung câu hỏi (Prompt)** (ví dụ: *"1. Describe the picture."*).
  - Thêm giải thích hoặc gợi ý nếu cần.
- Bấm **Lưu** để cập nhật câu hỏi.
- Nếu muốn thêm câu hỏi mới vào Part: Bấm nút **+ Thêm câu hỏi** ở cuối Part.

### 👉 Bước 5: Kiểm Tra Kết Quả
- Bấm nút **Xem bài thi thật** ở góc trên cùng để đối chiếu ngay với giao diện làm bài của học viên.
