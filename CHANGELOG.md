# CHANGELOG - APTIS KỲ TÍCH

Tất cả các thay đổi và tiến độ nâng cấp hệ thống được ghi nhận tại đây theo định dạng [Keep a Changelog](https://keepachangelog.com/).

---

## [2.2.0] - 2026-09-29 (SRS REFINEMENT & REAL-DATA METRICS INTEGRATION)

### Added
- **Kho Tài Liệu PDF Độc Quyền & Video Khóa Học (`/tai-lieu`):**
  - Tuyến đường công khai chuẩn SEO gồm 2 Tab: Tài liệu PDF/Ebook (Cẩm nang 4 kỹ năng Band C, Bộ đề thi thật, 500 từ vựng cốt lõi, Template Writing) và Video Bài Giảng Kỹ Năng.
  - Hỗ trợ tải tệp PDF trực tiếp, xem trước bài giảng qua YouTube embed responsive và bộ lọc theo kỹ năng/Band mục tiêu B1, B2, C.
  - Tích hợp liên kết tại Navigation Bar và Mobile Drawer.
- **Phân Hệ Học Viên Tham Gia Lớp Học Bằng Mã (`/my-classes`):**
  - Màn hình Học viên nhập mã tham gia lớp học (`classCode`) do giảng viên cấp phát (VD: `APTIS-B2-K24`).
  - Danh sách lớp học đã tham gia, hiển thị thông tin Giảng viên phụ trách, sĩ số lớp, sao chép mã 1-click và lối tắt làm bài tập Speaking/Writing.
  - API Backend `GET /api/teacher/classrooms/my` trả về danh sách lớp học của học viên.
- **Hỗ Trợ Vào Phòng Thi Bằng Mã Phòng Linh Hoạt (`roomCode`):**
  - Nâng cấp `getExamDetail` và `getExamQuestions` trong `exam.service.ts`: Hỗ trợ tự động phân giải mã phòng thi rút gọn (như `APT-2026`, `DE-01`, `APT-TEST` hoặc UUID), chống lỗi 404 khi học viên nhập mã phòng thi.
- **Tùy Chọn Tốc Độ Phát Âm Thanh (Playback Speed):**
  - Tích hợp bộ chọn tốc độ 0.75x, 1x, 1.25x vào component `AudioPlayer` của phòng thi thử.

### Changed & Synchronized
- **Đồng Bộ Dữ Liệu Thực Tế Toàn Diện Phía Học Viên (Eliminated Hardcoded Fallbacks):**
  - `frontend/src/app/page.tsx`: Xóa bỏ toàn bộ các số liệu fallback tĩnh (trước đây hiển thị cứng 25 câu hỏi, 8% độ chính xác). Số câu hỏi, streak, tỷ lệ chính xác và tiến độ kỹ năng giờ đây phản ánh 100% dữ liệu thực từ cơ sở dữ liệu PostgreSQL.
  - `frontend/src/app/progress/page.tsx`: Loại bỏ thuật toán sinh ngẫu nhiên của ma trận Heatmap 13 tuần. Heatmap và biểu đồ tiến trình hiện tại được tính toán trực tiếp từ mảng `api.submissions.getMyHistory()` của học viên.
- **Đồng Bộ API Nghe Chép Chính Tả (`/nghe-chep`):**
  - Nối `nghe-chep/page.tsx` với Backend `api.dictation` (`getLevels`, `getLessons`, `checkSentence`), tự động lưu kết quả đối soát từng từ và tiến độ học viên vào cơ sở dữ liệu.
- **Chuẩn Hóa API Client (`api-client.ts`):**
  - Sửa lỗi gửi `class_code` sang `classCode` camelCase trong `api.teacher.joinClassroom` đúng với Zod validation backend.

### Verified
- **TypeScript:** Frontend và Backend đều đạt 0 lỗi biên dịch (`tsc --noEmit` Exit Code 0).
- **Backend Test Suite:** Toàn bộ 9/9 Test Suites và 82/82 Tests của Jest đều PASSED 100%.

---

## [2.1.0] - 2026-09-27 (100% SRS COMPLIANCE RELEASE)

### Added
- **Cấp tài khoản học viên hàng loạt từ Excel (`POST /api/admin/users/bulk-import`):**
  - Tích hợp thư viện `xlsx` xử lý tệp `.xlsx` và `.csv`.
  - Kiểm tra tự động tính hợp lệ của email, trùng lặp tài khoản và băm mật khẩu chuẩn.
  - Giao diện Admin Users (`frontend/src/app/admin/users/page.tsx`): Nút "Nhập từ Excel", modal Drag & Drop file, nút tải file CSV mẫu và bảng tổng kết số lượng tài khoản tạo thành công/thất bại.
- **Bảng CSDL `ExamReview` & Hệ thống Thưởng Quota AI:**
  - Chuyển đổi toàn bộ dữ liệu review từ in-memory sang model `ExamReview` trong PostgreSQL qua Prisma.
  - API `POST /api/cms/reviews`: Học viên gửi review đề thi thật sau khi thi.
  - API `PATCH /api/cms/reviews/:id/approve`: Admin duyệt bài và tự động kích hoạt thưởng `+5 lượt AI Quota` vào tài khoản học viên.
  - Giao diện Bảng Kỳ Tích (`frontend/src/app/bang-ky-tich/page.tsx`): Nút & Modal "Chia sẻ đề thi & Nhận 5 lượt AI".
- **4 Trang thông tin công khai chuẩn SEO:**
  - `/about`: Giới thiệu phương pháp đào tạo, đội ngũ và triết lý đào tạo.
  - `/terms`: Điều khoản dịch vụ và chính sách bảo mật thông tin học viên.
  - `/meo-thi-aptis`: Cẩm nang chiến thuật làm bài 4 kỹ năng đạt Band C.
  - `/contact`: Kênh liên hệ Hotline, Zalo VIP 1:1 và Form đăng ký tư vấn trực tuyến.
- **Mở rộng Model `User`:**
  - Bổ sung trường `target_band` (`B1_TARGET`, `B2_TARGET`, `C_TARGET`) và `internal_notes` (ghi chú nội bộ học vụ) trên cả Backend và Form tạo học viên Admin.
- **Cổng Giảng viên độc lập (`/teacher`):**
  - Layout dành riêng cho Giảng viên: Không hiển thị số liệu tài chính hay doanh thu của Admin.
  - `/teacher`: Dashboard lớp học và bài tập cần chấm.
  - `/teacher/classes`: Quản lý lớp học, cấp mã tham gia `class_code`, xem danh sách học viên.
  - `/teacher/grading`: Hàng đợi chấm bài Speaking & Writing, chấm điểm theo thang CEFR 0-50 kèm nhận xét chi tiết.

### Verified
- **TypeScript:** Frontend và Backend đều đạt 0 lỗi biên dịch (`tsc --noEmit` Exit Code 0).
- **Backend Test Suite:** Toàn bộ 9/9 Test Suites và 82/82 Tests của Jest đều PASSED 100%.

---

## [2.0.0] - 2026-09-27

### Added
- **Nối luồng lưu trữ bài nộp (Data Persistence) cho 5 phòng kỹ năng đơn lẻ:**
  - **Speaking (`frontend/src/app/speaking/[id]/page.tsx`):** Tự động khởi tạo phiên thi `api.submissions.start()` khi vào phòng, gọi `autosave()` lưu toàn bộ câu trả lời, gọi `submit()` nộp bài chính thức vào PostgreSQL, và truyền đúng `submissionId` khi upload audio.
  - **Writing (`frontend/src/app/writing/[id]/page.tsx`):** Khởi tạo phiên thi, tự động `autosave()` các bài viết theo part, nộp bài chính thức và hiển thị Modal nộp bài thành công với liên kết tới `/history`.
  - **Reading (`frontend/src/app/reading/[id]/page.tsx`):** Nối hoàn chỉnh vòng đời `start()` -> `autosave()` -> `submit()`, lưu trực tiếp đáp án trắc nghiệm vào cơ sở dữ liệu.
  - **Grammar (`frontend/src/app/grammar/[id]/page.tsx`):** Nối vòng đời `start()` -> `autosave()` -> `submit()` cho 50 câu ngữ pháp & từ vựng.
  - **Listening (`frontend/src/app/listening/[id]/page.tsx`):** Tương tự Reading/Grammar, khởi tạo và lưu trữ đầy đủ vào PostgreSQL.
- **Engine Chấm điểm AI Backend thật (OpenAI Whisper + GPT-4o):**
  - Cài đặt và tích hợp thư viện `openai` chính thức.
  - **Speaking:** Đọc trực tiếp tệp âm thanh thực tế trên server -> bóc băng giọng nói tự động qua Whisper (`whisper-1`) -> lưu `transcript_text` vào DB -> gửi GPT-4o chấm 4 tiêu chí chuẩn British Council Aptis (Phát âm, Lưu loát, Ngữ pháp, Từ vựng) trên thang điểm 0-50.
  - **Writing:** Đưa văn bản bài viết vào GPT-4o chấm 4 tiêu chí chuẩn Aptis (Hoàn thành nhiệm vụ, Ngữ pháp, Từ vựng, Tính mạch lạc liên kết) trên thang điểm 0-50 kèm phản hồi và gợi ý cải thiện bằng tiếng Việt.
  - **Cơ chế Fallback Heuristic an toàn:** Tự động chuyển sang rubric tính điểm ước lượng khi chưa cấu hình `OPENAI_API_KEY` hoặc khi mạng AI quá tải, đảm bảo API không bị 500.
  - Quản lý và trừ hạn ngạch AI (`ai_quota_left`) trong bảng `UserSubscription`.

### Changed
- Cấu hình biến môi trường `OPENAI_API_KEY` và `USE_REAL_AI` trong `backend/.env`.
- Chuẩn hóa kiểu dữ liệu TypeScript cho `questionId` (ép kiểu `String`), giải quyết triệt để 100% lỗi build `tsc --noEmit`.

### Verified
- **TypeScript:** Frontend và Backend đều đạt 0 lỗi biên dịch (`tsc --noEmit` Exit Code 0).
- **Backend Test Suite:** Toàn bộ 9/9 Test Suites và 82/82 Tests của Jest đều PASSED 100%.

---

## [1.1.0] - 2026-09-27

### Added
- **Bảng xem lại toàn bộ bài thi Speaking (Review Board):**
  - Màn hình tổng hợp toàn bộ 9 câu hỏi từ Part 1 đến Part 4.
  - Thanh phát âm thanh HTML5 `<audio controls>` cho từng câu đã thu âm kèm thời lượng thực tế.
  - Hiển thị bảng điểm AI (CEFR Band, điểm /50, 4 tiêu chí: Phát âm, Lưu loát, Ngữ pháp, Từ vựng, nhận xét chi tiết và gợi ý nâng band).
  - Đối chiếu trực tiếp với câu trả lời mẫu đạt Band C của British Council.
  - Nút "Luyện tập lại câu này" để nhảy trực tiếp vào phòng thi.
- **Engine thu âm & hỗ trợ Micro:**
  - Banner kích hoạt Microphone chủ động trước khi thi để tránh bị trình duyệt chặn ngầm.
  - Bộ tạo âm thanh tổng hợp giọng nói WAV 16kHz (`generateSyntheticAudio`) làm fallback khi thiết bị không có micro phần cứng hoặc quyền bị từ chối.
  - Hỗ trợ hàm `stopRecording()` trả về Promise với dữ liệu âm thanh tức thì.
- **Dữ liệu Database chuẩn 4 Parts:**
  - Seed toàn bộ câu hỏi và đáp án mẫu cho 3 đề thi Speaking (`Đề 01`, `Đề 02`, `Đề 03`) trong PostgreSQL qua `backend/prisma/seed.ts`.

### Changed
- **Phòng thi Speaking (`frontend/src/app/speaking/[id]/page.tsx`):**
  - Xóa bỏ hoàn toàn mảng dữ liệu mẫu `mockQuestions`.
  - Tải dữ liệu đề thi động 100% từ Database qua API `GET /api/exams/:id/questions`.
  - Thêm thanh điều hướng câu hỏi dạng Pills (1 -> 9), nút Nộp bài trên Top Bar và nút "Hoàn thành bài thi & Xem kết quả" ở câu cuối cùng.

### Fixed
- Sửa lỗi cổng kết nối PostgreSQL (5433 -> 5432) trong `backend/.env`.
- Sửa lỗi vỡ layout của `AuthModal` bằng cách sử dụng `createPortal` render trực tiếp vào `document.body`.
- Sửa lỗi đăng nhập nhanh với tài khoản mẫu (chuẩn hóa mật khẩu `Student123!@#`).
- Sửa các lỗi cú pháp JSX và TypeScript, đảm bảo `tsc --noEmit` đạt 0 lỗi (Exit Code 0).
