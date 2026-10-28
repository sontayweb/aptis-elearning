# 📌 TÀI LIỆU ĐẶC TẢ KIẾN TRÚC & KẾ HOẠCH TRIỂN KHAI TUẦN TỰ
## NÂNG CẤP LUỒNG LÀM BÀI, NỘP BÀI & XEM LẠI BÀI THI (END-TO-END)

> **Dự án**: Aptis Kỳ Tích E-learning Platform  
> **Repository**: `sontayweb/aptis-elearning` (Deploy tự động qua Coolify lên VPS `103.90.227.117`)  
> **Tài khoản kiểm thử thực tế**: `hoanghiep310102@gmail.com` / `12345678` (Gói `VIP_3M`, 29 lượt AI, 3 lượt GV)  
> **Thời gian khởi tạo tài liệu**: 28/10/2026

---

## I. MỤC TIÊU VÀ PHẠM VI NÂNG CẤP

Tài liệu này đóng vai trò là **kim chỉ nam ngữ cảnh (Single Source of Truth)** để triển khai tuần tự, dứt điểm các vấn đề cốt lõi trên toàn bộ 4 phân hệ kỹ năng (Reading, Listening, Writing, Speaking) và Grammar & Vocabulary:

1. **Khắc phục triệt để lỗi mất dữ liệu khi xem lại từ Lịch sử (`/history`)**: Bất kỳ bài thi nào đã làm khi bấm "Xem lại" từ `/history` phải hiển thị 100% câu trả lời cũ của học viên, đáp án đúng/sai và nhận xét của AI/Giảng viên.
2. **Khắc phục lỗi chờ hết giờ mới được làm lại**: Tích hợp cờ `forceNew: true` vào nút *"Làm lại đề này"* để học viên có thể hủy bài cũ/bài dở và tạo phòng thi mới 100% thời gian bất cứ lúc nào.
3. **Chuẩn hóa cơ chế Lưu nháp (Autosave)**: Tự động lưu ngầm (Debounce 3s) khi học viên gõ bài viết Writing và lưu ngay lập tức khi chuyển đổi qua lại giữa các Part (Part 1, 2, 3, 4).
4. **Nâng cấp UX Chấm ngầm & Xem lại (Review Mode)**: Xóa bỏ hoàn toàn thanh Footer làm bài sau khi nộp; chuyển sang layout 2 cột với **Component Panel bên phải** hiển thị tiến trình chấm ngầm Live, huy hiệu CEFR, điểm số và mục lục câu hỏi trực quan (chuẩn phong cách ảnh 2).

---

## II. BẢN ĐỒ LUỒNG DỮ LIỆU END-TO-END (4 GIAI ĐOẠN CHUẨN)

```
[1. KHỞI TẠO PHÒNG THI]
  POST /api/submissions { examId, forceNew: boolean }
       ├── forceNew = false ──► Có phiên IN_PROGRESS còn hạn ──► Resume (giữ lại thời gian & đáp án)
       └── forceNew = true  ──► Hủy phiên cũ ──► Cấp phiên mới toanh (100% thời gian)
       │
[2. TRONG PHÒNG THI - IN PROGRESS]
       ├── Trắc nghiệm (Reading/Listening): Click chọn option ──► PUT /api/submissions/:id/autosave
       ├── Tự luận (Writing): Gõ văn bản ──► Debounce 3s ──► PUT /api/submissions/:id/autosave
       ├── Chuyển Part (Part 1 ↔ 2 ↔ 3 ↔ 4): Tự động kích hoạt Autosave tức thì
       └── POST /api/submissions/:id/heartbeat (mỗi 30s để giữ kết nối & chống gian lận)
       │
[3. NỘP BÀI - SUBMIT]
  POST /api/submissions/:id/submit
       ├── Trắc nghiệm (Reading / Listening / Grammar): Máy chấm ngay ──► status = 'GRADED'
       └── Tự luận (Writing / Speaking):
             ├── Còn Quota AI (> 0): status = 'PENDING_EVALUATION' ──► Background AI Grading ──► status = 'GRADED'
             └── Hết Quota AI (= 0): Lưu bài nộp SUBMITTED ──► Mở bộ bài mẫu CEFR (B1, B2, C) đối chiếu miễn phí
       │
[4. XEM LẠI BÀI - REVIEW MODE]
  URL: /[skill]/[examId]?submissionId=[id]&mode=review
       ├── Đọc submissionIdParam & mode=review
       ├── TUYỆT ĐỐI KHÔNG GỌI startSubmission() (không tạo bài mới, không trừ quota)
       ├── GET /api/submissions/:submissionId ──► Đổ dữ liệu đáp án cũ, điểm số, AI Feedback
       └── Ẩn toàn bộ Footer làm bài ──► Bật Component Panel bên phải (Thống kê & Mục lục)
```

---

## III. TỔNG HỢP CÁC LỖ HỔNG CỐT LÕI ĐÃ ĐƯỢC BÓC TÁCH

| Phân hệ | Hiện trạng trong Codebase | Tác động tiêu cực | Giải pháp chuẩn hóa |
| :--- | :--- | :--- | :--- |
| **Backend Core** | Câu hỏi đề Writing bị lưu với `question_type = 'MULTIPLE_CHOICE'` | AI Grading bỏ qua không chấm, hệ thống so sánh trắc nghiệm A/B/C/D khiến điểm Writing luôn về 0 | Bổ sung `submission.exam.skill === 'WRITING'` trong `submission.service.ts` & `ai-grading.service.ts` *(Đã sửa & test API OK)* |
| **Backend Core** | Route autosave là `PUT /:id/autosave` | Một số client/test script dùng POST bị 404 | Chuẩn hóa dùng `PUT` toàn hệ thống *(Đã xác nhận OK)* |
| **Writing Runner** | Chỉ gọi `autosave` khi bấm nút Submit; không đọc `submissionIdParam` & `mode=review` | Chuyển Part bị mất bài nếu rớt mạng; xem lại từ Lịch sử bị ép thi lại từ đầu | Thêm Debounce Autosave 3s, lưu khi đổi Part, nạp `getResult()` khi có `mode=review` |
| **Listening Runner** | Không gọi `useSearchParams()`; nút "Xem lại từng câu" chỉ set `setIsSubmitted(false)` | Xem lại từ Lịch sử mất trắng; sau khi thi xong bấm xem lại thì vẫn hiện nút *"Submit & Chấm AI"* | Đọc `searchParams`, khôi phục đáp án cũ, chuyển sang Right Panel Review Mode |
| **Speaking Runner** | Chưa hỗ trợ `mode=review` từ query URL | Bấm xem lại từ lịch sử bị mở phòng thi ghi âm mới | Nạp `getResult()`, hiển thị audio đã thu + transcript + điểm AI |
| **Toàn bộ Runner** | Nút "Làm lại đề này" chỉ reset state client (`setAnswers({})`), không gửi `forceNew: true` | Học viên tưởng phải chờ hết giờ mới được thi lại | Gọi `api.submissions.start(examId, forceNew = true)` |

---

## IV. KẾ HOẠCH TRIỂN KHAI TUẦN TỰ TỪNG ĐẦU VIỆC (STEP-BY-STEP CHECKLIST)

### BƯỚC 1: Nâng cấp Toàn diện phân hệ Writing (`frontend/src/app/writing/[id]/page.tsx`)
- [ ] **1.1. Khôi phục Review Mode từ URL**:
  - Đọc `submissionIdParam = searchParams?.get("submissionId")` và `modeParam = searchParams?.get("mode")`.
  - Nếu `modeParam === "review"` và có `submissionIdParam`:
    - Bỏ qua `api.submissions.start()` (không tạo bài mới).
    - Gọi `api.submissions.getResult(submissionIdParam)` $\rightarrow$ Nạp toàn bộ văn bản học viên đã viết vào `answers`.
    - Nạp `total_score`, `cefr_level` và `ai_results` của bài nộp cũ.
    - Kích hoạt chế độ `isReviewMode = true`.
- [ ] **1.2. Cơ chế Autosave Debounce 3s & Lưu khi chuyển Part**:
  - Dùng `useRef` lưu timer debounce (3000ms).
  - Mỗi khi học viên gõ trong `textarea`, tự động đếm ngược 3s không gõ nữa thì gửi `PUT /submissions/:id/autosave`.
  - Khi bấm chuyển giữa các Part (`handleSelectPart`), lập tức lưu câu trả lời của Part hiện tại trước khi nhảy Part.
- [ ] **1.3. Xây dựng Right Review Panel Component (chuẩn phong cách ảnh 2)**:
  - Khi đã nộp bài hoặc khi ở `mode=review`:
    - Ẩn toàn bộ Footer làm bài bên dưới.
    - Chia bố cục: Cột trái (Bài làm của học viên ở chế độ Read-only), Cột phải (Panel Kết quả & Mục lục).
    - **Nếu đang chấm ngầm**: Hiện badge `[ ⚡ AI Kỳ Tích đang chấm ngầm... ]` kèm tiến trình thời gian thực.
    - **Nếu đã chấm xong**: Hiện Band CEFR (B1/B2/C1), Thang điểm 50, Mục lục các câu hỏi. Bấm vào câu nào thì cột trái cuộn tới câu đó và hiển thị nhận xét chi tiết của AI.
    - **Nếu hết lượt AI**: Hiện mục lục đối chiếu bài mẫu chuyên gia B1, B2, C.
- [ ] **1.4. Nối cờ `forceNew: true` cho nút [Làm lại đề này]**:
  - Khi bấm "Làm lại": Gọi `api.submissions.start(examId, true)`, dọn sạch state cũ, reset timer về 100% thời gian trên server.

---

### BƯỚC 2: Nâng cấp Toàn diện phân hệ Listening (`frontend/src/app/listening/[id]/page.tsx`)
- [ ] **2.1. Nhận diện `mode=review` & `submissionId`**:
  - Khởi tạo đọc `useSearchParams()`.
  - Nếu phát hiện `mode === "review"`:
    - Bỏ qua `api.submissions.start(examId)`.
    - Gọi `api.submissions.getResult(submissionIdParam)`.
    - Khôi phục toàn bộ đáp án của 4 Part: `p1Answers`, `p2Answers`, `p3Answers`, `p4Answers`.
    - Tự động hiển thị kết quả đúng/sai và điểm số.
- [ ] **2.2. Xóa bỏ cơ chế `setIsSubmitted(false)` quay về phòng thi**:
  - Bỏ nút bấm chuyển ngược lại phòng thi gây lẫn lộn.
  - Tích hợp **Right Review Panel (Mục lục xem lại 1 đúng / 26 sai như ảnh 2)**:
    - Đánh dấu màu Xanh (câu đúng) / Đỏ (câu sai).
    - Có checkbox `[ ] Chỉ hiện câu sai`.
    - Bấm vào số câu $\rightarrow$ Tự động chuyển tới câu đó, hiển thị Audio, Script lời thoại và Giải thích chi tiết.
- [ ] **2.3. Nút [Làm lại đề này]**:
  - Gọi `api.submissions.start(examId, true)` và reset toàn bộ state âm thanh, câu trả lời.

---

### BƯỚC 3: Đồng bộ phân hệ Speaking (`speaking/[id]/page.tsx`) & Grammar (`grammar/[id]/page.tsx`)
- [ ] **3.1. Speaking**:
  - Đọc `submissionId` & `mode=review`.
  - Khôi phục file ghi âm (`audio_url`), transcript đã nhận dạng, điểm phát âm/ngữ điệu và nhận xét của AI.
  - Nối `forceNew: true` khi làm lại bài nói.
- [ ] **3.2. Grammar & Vocabulary**:
  - Đọc `submissionId` & `mode=review`.
  - Khôi phục 50 câu trắc nghiệm ngữ pháp/từ vựng, highlight xanh/đỏ và giải thích ngữ pháp.

---

### BƯỚC 4: Kiểm thử Tích hợp End-to-End & Đảm bảo Không Lỗi Biên dịch
- [ ] Chạy kiểm tra biên dịch TypeScript toàn dự án: `cmd /c "cd frontend && npx tsc --noEmit"`.
- [ ] Chạy lại script kiểm thử API tự động: `node backend/scripts/test-e2e-student-flow.js`.
- [ ] Đảm bảo 100% đầu luồng: Thi mới $\rightarrow$ Autosave $\rightarrow$ Submit $\rightarrow$ Live Review Panel $\rightarrow$ Thoát ra Lịch sử $\rightarrow$ Bấm Xem lại khôi phục hoàn hảo dữ liệu.

---

## V. NGUYÊN TẮC BẢO TOÀN NGỮ CẢNH (CONTEXT INTEGRITY RULES)

1. **Tuyệt đối không suy diễn**: Mọi luồng xử lý trên UI phải phản ánh chính xác cấu trúc dữ liệu và API đã được test thành công trên Backend.
2. **Không làm chắp vá**: Mọi nút "Làm lại" phải gọi qua API `forceNew: true`, không chỉ reset biến tạm ở trình duyệt.
3. **Phân tách rạch ròi 2 chế độ**:
   - Chế độ Thi (`Exam Taking Mode`): Có footer, đồng hồ đếm ngược, các lựa chọn có thể tương tác.
   - Chế độ Xem lại (`Review Mode`): Khóa tương tác câu hỏi, ẩn footer thi cử, bật Right Review Panel.
