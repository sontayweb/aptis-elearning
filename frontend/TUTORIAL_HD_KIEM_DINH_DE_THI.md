# HƯỚNG DẪN QUẢN TRỊ VIÊN: PHÒNG KIỂM ĐỊNH & SOI CHI TIẾT ĐỀ THI 4 KỸ NĂNG (ENTERPRISE EXAM STUDIO)

> **Mục tiêu:** Hướng dẫn quản trị viên và giáo viên cách sử dụng Phòng Kiểm Định & Soi Chi Tiết Đề Thi để kiểm tra kỹ lưỡng nội dung cả 4 kỹ năng (Nghe, Nói, Đọc, Viết) trước khi lưu vào ngân hàng đề thi, tránh việc duyệt qua loa hoặc import nhầm đề lỗi.

---

## 1. Video Hướng Dẫn Trực Quan (Animated Video Tutorial)
- **Đường dẫn cục bộ trong frontend:** `frontend/public/tutorials/guide_exam_inspection_studio.webp`
- **URL xem qua trình duyệt:** `http://localhost:3000/tutorials/guide_exam_inspection_studio.webp`
- **Tích hợp sẵn trong hệ thống:** Nằm trực tiếp trong **Tour hướng dẫn quản trị (Admin Tutorial Modal)** tại tab Quản lý đề thi.

---

## 2. Quy Trình Soi Chi Tiết Từng Kỹ Năng

### 🎧 KỸ NĂNG NGHE (LISTENING):
1. **Xem Kịch bản âm thanh (Audio Script)**: Kiểm tra nội dung đối thoại hoặc độc thoại được bóc tách từ cột `Passage_Text` trong file Excel.
2. **Phát thử giọng đọc (TTS Simulation)**:
   - Bấm nút **"🔊 Nghe thử kịch bản này (TTS Preview)"** để hệ thống đọc mô phỏng bằng giọng đọc bản xứ Anh - Mỹ.
   - Điều chỉnh tốc độ đọc `1.0x` hoặc `0.85x` để kiểm tra độ rõ ràng của ngữ điệu.
   - Bấm **"Dừng đọc âm thanh"** khi đã kiểm tra xong.
3. **Chỉnh sửa kịch bản**: Nếu phát hiện sai sót chính tả, bấm **"Sửa kịch bản"** để sửa ngay tại chỗ.

---

### 📖 KỸ NĂNG ĐỌC (READING):
1. **Kiểm tra Đoạn văn (Reading Passage)**: Xem toàn bộ bài đọc hiểu với cỡ chữ và khoảng cách dòng chuẩn typography.
2. **Chỉnh sửa bài đọc**: Bấm **"Sửa đoạn văn"** nếu muốn bổ sung hoặc chỉnh sửa câu chữ trước khi lưu.

---

### 🎙️ KỸ NĂNG NÓI (SPEAKING):
1. **Kiểm tra tranh minh họa**:
   - **Part 2**: 1 tranh miêu tả hoạt cảnh.
   - **Part 3**: 2 tranh so sánh đối chiếu (Tranh A và Tranh B).
2. **Xử lý lỗi thiếu ảnh trực tiếp (Inline Image Attachment)**:
   - Nếu đề thi bị thiếu ảnh, hệ thống hiển thị ô viền nét đứt màu đỏ: *"Chưa có ảnh thứ 2 (Tranh B) — Bấm vào đây để tải ảnh đính kèm bổ sung ngay cho đề này mà không cần sửa file Word"*.
   - Bấm vào ô hoặc nút **"📷 Tải ảnh lên ngay (Gắn trực tiếp)"** để chọn ảnh từ máy tính.
   - Hệ thống tự động upload, gắn vào bài thi và chuyển trạng thái từ **"Cần điều chỉnh"** thành **"✓ Hợp lệ"** ngay lập tức!
3. **Kiểm tra Từ vựng**: Xem bảng từ vựng song ngữ (Anh - Việt) được bóc tách từ bảng 2 cột trong file Word.

---

### ✍️ KỸ NĂNG VIẾT (WRITING):
1. **Kiểm tra Ngữ cảnh / Thông báo (Club Context / Notice)**: Đọc thông báo câu lạc bộ hoặc đề bài tình huống.
2. **Kiểm tra Câu hỏi & Số từ mục tiêu**:
   - **Part 1**: Điền biểu mẫu (1 - 5 từ/câu).
   - **Part 2**: Viết ngắn (20 - 30 từ).
   - **Part 3**: Trả lời chat 3 thành viên CLB (30 - 40 từ/câu).
   - **Part 4**: Viết email thân mật (50 từ) và email trang trọng gửi chủ nhiệm CLB (120 - 150 từ).

---

### 🎯 MA TRẬN CÂU HỎI & ĐÁP ÁN (Q&A MATRIX - TRẮC NGHIỆM):
1. **Kiểm tra 4 phương án A, B, C, D**: Tất cả các lựa chọn được hiển thị trực quan trong lưới 2 cột.
2. **Nhận diện đáp án đúng**: Đáp án chính xác được đánh dấu màu **Xanh ngọc (Emerald Green)** nổi bật kèm nhãn `✓ ĐÚNG`.
3. **Chuyển đổi đáp án đúng 1 chạm**: Nếu file Excel gốc bị nhập nhầm đáp án đúng (ví dụ gõ nhầm B thay vì C), quản trị viên chỉ cần **bấm chuột vào phương án C** -> Hệ thống tự động chuyển đáp án đúng sang C!
4. **Giải thích chi tiết**: Xem lời giải thích đáp án được bóc tách từ file.

---

## 3. Cơ Chế Chống Nhập Nhầm Đề (Selective Import)
1. **Cột điều hướng bên trái (Sidebar)**:
   - Hiển thị danh sách toàn bộ đề nhận diện từ file với nhãn Kỹ năng, Số câu, Trạng thái (`✓ Hợp lệ` hoặc `✕ Cần xử lý`).
   - Có thanh tìm kiếm theo chủ đề và các tab lọc nhanh: `Tất cả`, `Listening`, `Reading`, `Speaking`, `Writing`.
2. **Tích chọn từng đề**:
   - Mặc định, hệ thống **chỉ tích chọn các đề đã đạt chuẩn hợp lệ** và **tự động bỏ chọn các đề bị lỗi**.
   - Quản trị viên có thể chủ động bỏ chọn các đề không muốn nhập.
   - Nút lưu hiển thị rõ ràng: `Lưu ${số_đề_đã_chọn} đề đã chọn vào hệ thống`.
