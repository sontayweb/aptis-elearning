# BẢNG PHÂN ĐỊNH HẠNG MỤC TỰ THỰC HIỆN & BỘ CÂU HỎI CONFIRM
## DỰ ÁN: NÂNG CẤP HỆ THỐNG LUYỆN THI APTIS KỲ TÍCH
> **Ngày lập:** 11/10/2026  
> **Nguyên tắc kỹ thuật:** Bám sát 100% quy chuẩn khảo thí British Council Aptis ESOL và kiến trúc codebase hiện hữu. **Tuyệt đối không suy diễn, không tự chế tính năng thừa thãi.**

---

## PHẦN 1: CÁC HẠNG MỤC ĐÃ ĐỦ 100% THÔNG TIN (AI TỰ LÀM NGAY)

Toàn bộ các hạng mục dưới đây đã có đầy đủ đặc tả nghiệp vụ, chuẩn khảo thí Aptis ESOL và mã nguồn hiện hữu, **AI tự động triển khai chính xác 100% mà không cần hỏi thêm**:

| STT | Module | Hạng mục công việc chi tiết | Giải pháp kỹ thuật chuẩn hóa |
| :---: | :--- | :--- | :--- |
| **1** | **Go-Live Banner** | Banner & Nút 1-Click nhận VIP Pro 14 ngày (`APTISGOLIVE`) | Đặt Banner nổi bật trên đầu Trang chủ (`/`) và Dashboard (`/dashboard`). Nhấn nút là tự động gọi API `POST /api/payment/redeem-code` kích hoạt ngay mà không cần học viên gõ tay. |
| **2** | **Writing Part 4** | **Tách đôi hoàn toàn thành 2 Form Email độc lập** | - **Form 1 (Email bạn thân):** Giới hạn 50 từ (chuẩn 40–60 từ), thời gian gợi ý 10 phút, bộ đếm từ riêng biệt `X/50 từ`.<br>- **Form 2 (Email trang trọng cho Quản lý CLB):** Giới hạn 120–150 từ, thời gian gợi ý 20 phút, bộ đếm từ riêng biệt `Y/150 từ`.<br>- Gắn nhãn hướng dẫn văn phong (Informal vs Formal tone) và thanh đo giới hạn từ trực quan. |
| **3** | **Speaking Time** | **Chuẩn hóa bộ đếm giờ chuẩn British Council** | - **Part 1:** 30 giây trả lời mỗi câu (3 câu).<br>- **Part 2 & 3:** 45 giây trả lời mỗi câu hỏi.<br>- **Part 4:** 60 giây đếm ngược chuẩn bị nháp → Tiếng bíp tự động → 120 giây (2 phút) ghi âm bài nói liền mạch. |
| **4** | **Speaking UI** | **Bảng từ vựng & Collocation gợi ý bên cạnh tranh (Part 2 & 3)** | Chia layout 2 cột: Cột trái ảnh thi nét chuẩn; Cột phải là bảng Gợi ý Collocations, từ vựng ăn điểm và mẫu câu mở đầu / phát triển ý phản xạ nhanh theo chủ đề bức tranh. |
| **5** | **Reading Tools** | **Công cụ Highlight chữ trên bài đọc (Part 3 & 4)** | Khi học viên bôi đen văn bản trong bài đọc: hiện popup mini chọn màu 🟡 Vàng (Dẫn chứng), 🟢 Xanh (Từ khóa đối chiếu) hoặc 🗑️ Xóa highlight. Trạng thái highlight được lưu theo từng câu hỏi. |
| **6** | **Listening Flow** | **Lọc danh sách câu hỏi theo Part & Web Speech Fallback** | - Thanh số câu hỏi chân trang chỉ hiển thị danh sách câu của Part đang mở (Part 1: câu 1–13; Part 2: câu 14–17; Part 3: câu 18–21; Part 4: câu 22–25).<br>- Tích hợp cơ chế phát âm Web Speech giọng Anh - Anh (en-GB) chuẩn khi câu hỏi chưa có link audio MP3. |
| **7** | **UX 4 Kỹ Năng** | **Modal "Hướng dẫn cách làm bài & Tiêu chí chấm" ở đầu mỗi kỹ năng** | Hiển thị Modal/Banner chiến lược làm bài, phân bổ thời gian và tiêu chí chấm điểm trước khi học viên bấm nút "Bắt đầu tính giờ làm bài". |
| **8** | **Reading Part 2** | **Khử trùng lặp chủ đề trong ngân hàng câu hỏi** | Phân tách các câu chuyện sắp xếp thứ tự thành các ID độc lập (`P2_Story_1`, `P2_Story_2`...), khắc phục hiện tượng trùng lặp tiêu đề hiển thị. |

---

## PHẦN 2: TÀI LIỆU ĐẶT CÂU HỎI CHI TIẾT CẦN BẠN CONFIRM & CUNG CẤP DỮ LIỆU

Để đảm bảo các phần liên quan đến dữ liệu thực tế và nhận diện thương hiệu của trung tâm chính xác 100%, xin vui lòng confirm các câu hỏi chi tiết sau:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      DANH MỤC 5 CÂU HỎI XÁC NHẬN                       │
│                                                                        │
│  [Câu 1] Module Từ Vựng: Định dạng file & Nguồn Sheet từ vựng          │
│  [Câu 2] Dashboard: Ảnh thật học viên & Bài vinh danh Facebook         │
│  [Câu 3] Dashboard: Chi tiết Popover Lịch Khai Giảng từng lớp          │
│  [Câu 4] Listening: Nguồn file Audio MP3 thật & Audio Script           │
│  [Câu 5] Đề thi DOCX: Kiểm tra độ đầy đủ của ngân hàng đề              │
└────────────────────────────────────────────────────────────────────────┘
```

### CÂU HỎI 1: Nguồn & Định dạng Sheet Từ Vựng Aptis (SRS Flashcard)
* **Hiện trạng kỹ thuật:** Hệ thống đã hoàn thiện module Flashcard lặp lại ngắt quãng (SRS) tại `/vocabulary`.
* **Thông tin cần bạn xác nhận:**
  1. Bạn sẽ cung cấp danh sách từ vựng theo hình thức nào?
     - [ ] **Lựa chọn A:** Link Google Sheet công khai (Chỉ cần cấp link, AI tự kết nối import).
     - [ ] **Lựa chọn B:** File Excel (`.xlsx`) hoặc `.csv` đặt trong thư mục dự án.
  2. Bảng từ vựng của bạn hiện có những cột nào? *(Ví dụ: `Từ | Phiên âm | Từ loại | Nghĩa tiếng Việt | Câu ví dụ | Collocation | Chủ đề`)*? Nếu thiếu một số cột (ví dụ chưa có Collocation), bạn có đồng ý để AI tự động bổ sung cột còn thiếu không?

---

### CÂU HỎI 2: Ảnh Facebook Học Viên & Bảng Vinh Danh Trên Dashboard
* **Hiện trạng kỹ thuật:** Trang Dashboard đang để khung vinh danh học viên điểm cao và feedback.
* **Thông tin cần bạn xác nhận:**
  1. Về tài nguyên ảnh học viên:
     - [ ] **Lựa chọn A:** Bạn sẽ cung cấp thư mục ảnh thật học viên (ví dụ đặt vào `frontend/public/avatars/students/`).
     - [ ] **Lựa chọn B:** AI tạo bộ 6 học viên mẫu vinh danh tiêu biểu (tên Việt Nam, điểm Aptis B2/C, avatar chất lượng cao, review thực chiến) để sẵn sàng Go-Live ngay, khi có ảnh thật bạn chỉ cần thay thế.
  2. Bạn có muốn gắn link dẫn thẳng về bài post fanpage Facebook của Kỳ Tích không?

---

### CÂU HỎI 3: Chi Tiết Popover Khi Click Vào "Lịch Khai Giảng"
* **Hiện trạng kỹ thuật:** Dashboard có hiển thị các thẻ lớp học sắp khai giảng, nhưng click vào chưa mở chi tiết.
* **Thông tin cần bạn xác nhận:**
  1. Khi học viên click vào một lịch khai giảng, nội dung chi tiết cần hiển thị gồm:
     - Thời lượng khóa học (ví dụ: *12 buổi / 6 tuần*)?
     - Lịch học (ví dụ: *Tối 2-4-6 từ 19h30 - 21h00*)?
     - Hình thức học (Online qua Google Meet / Zoom)?
     - Giảng viên phụ trách?
     - Học phí ưu đãi?
  2. Nút hành động chính trong Modal:
     - [ ] Mở form đăng ký tư vấn trực tiếp trên web (đã có model `CourseLeadRegistration` trong DB).
     - [ ] Bật link chuyển hướng sang Zalo OA / Fanpage tư vấn của trung tâm.

---

### CÂU HỎI 4: File Audio MP3 Thật & Kịch Bản (Audio Script) Kỹ Năng Listening
* **Hiện trạng kỹ thuật:** Hệ thống đã có service `tts-audio.service.ts` và Web Speech Synthesis fallback.
* **Thông tin cần bạn xác nhận:**
  1. Về file nghe của 25 câu hỏi Listening:
     - [ ] **Lựa chọn A:** Bạn đã có sẵn thư mục chứa các file `.mp3` gốc cắt sẵn theo từng câu/part (vui lòng cho biết đường dẫn thư mục).
     - [ ] **Lựa chọn B:** Chưa có sẵn file MP3 cắt lẻ; bạn muốn AI chạy script sinh tự động toàn bộ audio MP3 chất lượng cao (giọng chuẩn British Council en-GB qua TTS Engine) và lưu vào thư mục `public/audio/listening/` để dùng vĩnh viễn.
  2. Về kịch bản (Audio Script): Bạn có muốn bật nút *"Xem Audio Script & Bản dịch"* ngay sau khi học viên nộp bài thi Listening không?

---

### CÂU HỎI 5: Ngân Hàng Đề Thi Từ File DOCX
* **Hiện trạng kỹ thuật:** Trong thư mục dự án hiện đang có:
  - Thư mục `READING/`: Đủ Part 1, Part 2, Part 3, Part 4 (`.docx`).
  - Thư mục `SPEAKING/`: Đủ Part 1, Part 2, Part 3, Part 4 (`.docx`).
* **Thông tin cần bạn xác nhận:**
  1. Bạn có file DOCX cho `LISTENING` và `WRITING` tương tự để AI import đồng bộ không, hay các đề Listening/Writing hiện có trong database đã đủ chuẩn để sử dụng?

---

## BƯỚC TIẾP THEO

1. **AI sẽ bắt tay vào thực hiện ngay toàn bộ 8 hạng mục trong PHẦN 1** (Ưu tiên số 1: Banner Go-Live 1-click, Tách 2 Form Writing Part 4, và Bảng từ vựng Speaking).
2. **Đối với PHẦN 2:** Bạn chỉ cần trả lời nhanh các phương án bạn chọn (Ví dụ: *Câu 1: Chọn A; Câu 2: Chọn B; Câu 3: Mở form web; Câu 4: Chọn B; Câu 5: Dùng đề trong DB*).
