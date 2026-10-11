# BÁO CÁO XÁC NHẬN PHƯƠNG ÁN THIẾT KẾ VÀ QUY TRÌNH KIỂM DUYỆT HỆ THỐNG
## DỰ ÁN: APTIS E-LEARNING (KỲ TÍCH)
> **Thời gian cập nhật:** 11/10/2026  
> **Phiên bản:** v2.1.0 — Architecture & Data Safety Approved  
> **Trạng thái:** Đã thống nhất nguyên tắc: **Staging (Tạm / Đệm) $\rightarrow$ Review (Kiểm duyệt) $\rightarrow$ Core (Chính thức)**. Tuyệt đối không suy diễn, không tự chế và không đụng vào Core Database khi chưa qua duyệt.

---

### I. CÁC NGUYÊN TẮC CỐT LÕI ĐÃ ĐƯỢC CONFIRM

1. **Bảo toàn Core Database:**
   - Database PostgreSQL hiện hữu chứa 1,724+ đề thi và 2,916 câu hỏi là tài sản cốt lõi. Mọi thao tác xử lý dữ liệu mới không được ghi đè trực tiếp vào Core Database nếu chưa qua bước đệm.
2. **Quy trình Staging & Review 3 bước:**
   - **Bước 1 (Staging):** Dữ liệu hoặc tài nguyên media sinh tự động được lưu trữ tại tầng đệm (Thư mục Staging trên File System hoặc Cờ `is_published: false` trong DB).
   - **Bước 2 (Review / Kiểm duyệt):** Xuất báo cáo Manifest (JSON/Log) liệt kê chi tiết các phần tử. Admin / Người phụ trách có thể nghe thử mẫu, xem trước danh sách.
   - **Bước 3 (Apply / Promote to Core):** Chỉ khi người dùng bấm nút hoặc chạy lệnh xác nhận (`apply`), dữ liệu mới được liên kết vào bảng Core.

---

### II. KẾT QUẢ PHÂN BỔ THEO TỪNG HẠNG MỤC

| Hạng mục | Vấn đề nghiệp vụ | Phương án thiết kế Staging đã chốt | Tác động Core Database |
| :--- | :--- | :--- | :---: |
| **1. 961 Audio Listening** | Thiếu file âm thanh trong các Part thi nghe. | • Sinh MP3 vào `uploads/audio/staging/`.<br>• Xuất `storage/staging_audio_manifest.json`.<br>• Nghe thử mẫu kiểm duyệt.<br>• Chạy script `apply-staged-audio.ts` để đồng bộ Core. | **0% tác động** ở bước sinh; chỉ update cột `audio_url` khi chạy lệnh Apply. |
| **2. Đề thi mới từ DOCX** | Bổ sung các bộ đề Reading / Speaking mới. | • Nạp vào bảng `Exam` nhưng đặt cứng `is_published: false` (trạng thái Nháp).<br>• Học viên không nhìn thấy đề nháp.<br>• Admin kiểm tra trong CMS rồi bấm "Publish". | **Cách ly 100%**, học viên không bị ảnh hưởng. |
| **3. Từ vựng Google Sheet** | Giáo viên chia sẻ bảng từ vựng 3 cột (`STT - Từ - Nghĩa`). | • Giao diện có Popup Preview xem trước số từ, nghĩa, phát âm.<br>• Chỉ lưu vào Sổ tay Flashcard của học viên (`localStorage` & SRS) khi người dùng bấm "Xác nhận nạp". | **0% tác động** vào Database backend. |
| **4. Cấu hình vận hành** | Thông tin Hotline, MB Bank `0866950837`, học phí `1.400.000đ`, lịch T3-T5-T7. | • Quản lý tập trung tại `frontend/src/config/site-config.ts`.<br>• Sửa 1 nơi, tự động cập nhật toàn bộ giao diện và mã VietQR. | **0% tác động** vào Database backend. |

---

### III. LỘ TRÌNH NÂNG CẤP KỸ THUẬT TIẾP THEO

- [x] **Bước 1:** Lập tài liệu kiến trúc Staging & Lưu vết quyết định thiết kế vào `docs/`.
- [ ] **Bước 2:** Nâng cấp script `backend/scripts/generate-missing-audio.ts` hỗ trợ chế độ `--staging` và xuất `staging_audio_manifest.json`.
- [ ] **Bước 3:** Xây dựng script `backend/scripts/apply-staged-audio.ts` có cơ chế kiểm tra tính toàn vẹn (MD5 / file size) trước khi ghi `audio_url` vào Core Database.
- [ ] **Bước 4:** Chạy kiểm thử sinh âm thanh staging mẫu cho 5 parts đại diện và kiểm tra tính an toàn.
