# BÁO CÁO PHÂN ĐỊNH DỮ LIỆU ĐỀ THI READING & SPEAKING
*(Cập nhật ngày 22/10/2026 — Đã đối chiếu 100% tệp tin gốc trong thư mục `READING/` và `SPEAKING/`)*

---

## I. NGUYÊN TẮC THỰC HIỆN
1. **Phần đủ thông tin 100% (không phỏng đoán):** Triển khai trực tiếp vào mã nguồn, chuẩn hóa giao diện, hiển thị số đề tối giản, gắn nhãn độ hot ☘️ và tích hợp công cụ hỗ trợ (Google Dịch, song ngữ).
2. **Phần chưa đủ thông tin trong tài liệu gốc:** Ghi chú chi tiết nguyên nhân, thực trạng tệp tin và các phương án cần bạn xác nhận để không tự ý phỏng đoán làm sai lệch đề thi thật của British Council.

---

## II. DANH SÁCH ĐÃ TRIỂN KHAI HOÀN TẤT (100% DỮ LIỆU CHUẨN XÁC)

### 1. Reading Part 1 (Điền từ vào đoạn văn ngắn)
- **Tài liệu nguồn:** `READING/Part 1.docx`.
- **Tình trạng dữ liệu:** Đầy đủ 100% câu hỏi, 3 lựa chọn và đáp án đúng.
- **Đã triển khai:**
  - Nạp trọn vẹn **19 bộ đề thi chuẩn** vào hệ thống (`reading-part1-bank.ts`).
  - Lược bỏ hoàn toàn tiêu đề rườm rà `Reading Part 1 (window, buy, market)...`, chuẩn hóa thành **`Đề 01`** đến **`Đề 19`**.
  - Tích hợp 2 công cụ tra cứu tại trang luyện Marathon:
    - **Nút "GG Dịch":** Tự động liên kết mở Google Translate với câu hoàn chỉnh chứa đáp án đúng.
    - **Nút "Dịch nghĩa":** Bật/tắt xem bản dịch tiếng Việt đối chiếu ngay dưới câu hỏi.

### 2. Reading Phân cấp độ HOT (Biểu tượng cỏ ☘️)
- **Tài liệu nguồn:** `READING/Part 2.docx`, `READING/Part 3.docx`, `READING/Part 4.docx`.
- **Đã triển khai:** Sắp xếp lại thứ tự ưu tiên tuyệt đối trên trang danh sách đề `/reading`:
  - **Part 2 + Part 3:**
    - ☘️☘️☘️☘️☘️ *(5 cỏ)*: Film, singer, the famous singer, new coffee shop, My visit to a new coffee shop, busy coffee, End of term project.
    - ☘️☘️☘️☘️ *(4 cỏ)*: The first American woman in Space, Weekend activities, Movies then and now, New coffee shop, The first american woman in space, The history of transportation (phiên bản 2).
    - ☘️☘️☘️ *(3 cỏ)*: Family Sport Day (bản 1 & 2), Mae - The Math Girl, Cultural festival, College Welcoming Day.
    - ☘️☘️ *(2 cỏ)*: Public Transportations, Writing about a place (bản 2), Music show at the park.
  - **Part 4 (Matching Opinions):**
    - ☘️☘️☘️☘️☘️: childhood, Music festival (v1, v2, v3, v4), Games from childhood, Technology in childhood (v1, v2).
    - ☘️☘️☘️☘️: Extreme sports (v1, v2, v3).
    - ☘️☘️☘️ & ☘️☘️: Childhood memories, Free time activity, Job and training, Volunteering, Career.
  - **Part 5 (Bài đọc dài 7 đoạn):**
    - ☘️☘️☘️☘️☘️: Mountain (v1, v2, v3, v4), The arrival of four-day week (v1, v2), Women mathematicians (v1, v2, TP1).

### 3. Speaking Part 1
- **Đã triển khai:** Rút gọn toàn bộ tiêu đề bài thi chỉ để lại số đề gọn gàng: **`Đề 01`**, **`Đề 02`**, ..., **`Đề 09`**.

### 4. Speaking Part 2
- **Tài liệu nguồn:** `SPEAKING/Tranh trọng điểm part 2.docx`.
- **Đã triển khai:**
  - Nạp chuẩn xác **25 chủ đề miêu tả tranh** từ tài liệu gốc.
  - Rút gọn tiêu đề chỉ còn số đề: **`Đề 01`**, **`Đề 02`**, ..., **`Đề 25`**.
  - Gắn nhãn nhận diện **`☘️ Tranh trọng điểm Part 2`** trên từng thẻ đề.

### 5. Speaking Part 3 (So sánh 2 tranh)
- **Tài liệu nguồn:** `SPEAKING/Tranh trọng điểm part 3.docx`.
- **Đã triển khai:**
  - **Đảm bảo 100% đề có đủ 2 tranh rõ nét:** Đã xử lý kỹ thuật cắt tách các ảnh ghép đôi 2-in-1 từ file Word thành từng ảnh đơn (`Picture 1` và `Picture 2`).
  - Hiển thị song song 2 khung tranh trên giao diện thi thử và luyện marathon kèm 3 câu hỏi và câu trả lời mẫu chuẩn B2-C1.

---

## III. NHỮNG PHẦN DỮ LIỆU CẦN XÁC NHẬN / BỔ SUNG (KHÔNG TỰ Ý PHỎNG ĐOÁN)

| Kỹ năng / Phần | Tình trạng dữ liệu trong file Word gốc | Vấn đề cần xác nhận | Phương án đề xuất |
| :--- | :--- | :--- | :--- |
| **Reading Part 2** *(Sắp xếp câu)* | File `READING/Part 2.docx` chỉ chứa **mẹo nhớ từ vựng theo chuỗi thứ tự**, KHÔNG có toàn văn 5 câu tiếng Anh rời rạc của đề thi gốc.<br>*(Ví dụ: "Anh ấy là ca sĩ nổi tiếng (famous singer) khi 15 tuổi (15) anh ấy luyện tập chăm chỉ (practice very hard)...")* | Nếu tự dựng câu tiếng Anh thì có thể không đúng 100% nguyên văn của British Council. | **PA 1 (Khuyên dùng):** Giữ nguyên dưới dạng "Cẩm nang Key & Chuỗi từ vựng ăn điểm" để học viên học tủ trước khi thi.<br>**PA 2:** Bạn gửi thêm file đề thi có đầy đủ 5 câu văn tiếng Anh để nạp trọn vẹn dạng kéo thả. |
| **Reading Part 4** *(Nối tiêu đề bài đọc dài)* | File `READING/Part 4.docx` chỉ chứa **Keyword cần nhớ** và **Đoạn văn mẹo bằng tiếng Việt** cho 3 bài: *Four-Day Week, Mountain, Women Mathematicians*.<br>Các đề: *Digital Transformation, Tech Forward, Wellness Trends* chỉ có tên đề, chưa có nội dung. | Thiếu toàn văn bài đọc 7 đoạn tiếng Anh gốc của BC. | Giữ bài học dưới dạng **"Bí kíp chuỗi keyword ăn trọn điểm Part 4"** (rất được thí sinh ưa chuộng vì đi thi chỉ cần nhớ chuỗi từ khóa là chọn đúng tiêu đề). |
| **Speaking Part 1** | File `SPEAKING/Tổng hợp đề part 1.docx` có **44 câu hỏi đơn lẻ kèm bài mẫu B2-C1**, không chia nhóm sẵn 3 câu/đề. | Hiện tại hệ thống đang ghép thành 9 đề mẫu. | Bạn có muốn hệ thống tự động gom toàn bộ 44 câu này thành **15 bộ đề hoàn chỉnh** (mỗi bộ 3 câu hỏi) để học viên luyện hết toàn bộ ngân hàng câu hỏi không? |
| **Ảnh Speaking Part 2** | Một số ảnh trong file Word gốc `Tranh trọng điểm part 2.docx` có độ phân giải thấp/bị vỡ hạt do định dạng nén Word cũ. | Cần nâng cao trải nghiệm học viên khi phóng to ảnh. | Giữ nguyên ảnh gốc từ Word hay cho phép hệ thống làm nét (upscale HD) các tranh bị mờ? |
