# TÀI LIỆU THIẾT KẾ KỸ THUẬT (TECHNICAL DESIGN DOCUMENT)
## NÂNG CẤP HOÀN THIỆN 100% ĐẶC TẢ SRS HỆ THỐNG APTIS KỲ TÍCH
**Mã tài liệu:** `TDD-APTIS-100-RELEASE`  
**Phiên bản:** `1.0.0-DRAFT`  
**Ngày lập:** 27/09/2026  
**Chủ trì kiến trúc:** Antigravity Principal Systems Architect & Engineering Team  
**Mục tiêu:** Bù đắp 5% khoảng trống chức năng để đạt 100% tiêu chí nghiệm thu UAT theo tài liệu `Bao_Cao_Dac_Ta_Chuc_Nang_Elearning_Aptis.md`.

---

## I. TỔNG QUAN KIẾN TRÚC & PHẠM VI NÂNG CẤP

Hệ thống hiện tại đã đáp ứng **95%** đặc tả nghiệp vụ. Tài liệu thiết kế này đặc tả chi tiết 5 phân hệ kỹ thuật cần xây dựng để đưa tỷ lệ hoàn thiện lên **100%**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        KIẾN TRÚC CÁC PHÂN HỆ NÂNG CẤP BỔ SUNG                         │
│                                                                                        │
│  [1. BULK IMPORT]    ──► Upload Excel/CSV ──► Validate Regex ──► Prisma Bulk Create    │
│  [2. EXAM REVIEW]    ──► Model ExamReview ──► Học viên nộp bài ──► Admin duyệt thưởng  │
│  [3. PUBLIC PAGES]   ──► /about, /terms, /meo-thi-aptis, /contact kết nối CMS API      │
│  [4. USER EXTENSION] ──► Thêm target_band & internal_notes vào User Model & Admin Form │
│  [5. TEACHER PORTAL] ──► /teacher Dashboard, /teacher/classes, /teacher/grading-queue  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## II. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA MIGRATION)

### 1. Thay đổi Model `User` (Hạng mục 4 & Hạng mục 1)
Bổ sung các trường quản lý mục tiêu học tập và ghi chú nội bộ của bộ phận học vụ:

```prisma
// File: backend/prisma/schema.prisma

enum TargetBand {
  B1_TARGET
  B2_TARGET
  C_TARGET
}

model User {
  // ... các trường hiện có ...
  target_band     TargetBand?    @default(B2_TARGET)
  internal_notes  String?        // Ghi chú của tư vấn viên / học vụ
  reviews         ExamReview[]   // Quan hệ 1-N với Review
  // ...
}
```

### 2. Bổ sung Model `ExamReview` (Hạng mục 2)
Chuyển đổi hoàn toàn cơ chế lưu trữ đánh giá từ bộ nhớ RAM (`reviewsStore`) sang bảng cơ sở dữ liệu bền vững:

```prisma
// File: backend/prisma/schema.prisma

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}

model ExamReview {
  id              String        @id @default(uuid())
  user_id         String
  exam_id         String?       // Có thể review chung hoặc theo đề thi cụ thể
  rating          Int           @default(5) // 1 - 5 sao
  score_achieved  String?       // Ví dụ: "B2 (168/200)" hoặc "Band C"
  comment         String        // Cảm nhận học viên, kinh nghiệm phòng thi
  exam_location   String?       // "BC Hà Nội", "BC TP.HCM", "Đà Nẵng"
  exam_date       DateTime?
  status          ReviewStatus  @default(PENDING)
  teacher_note    String?       // Lời chúc / nhận xét của giáo viên
  reward_claimed  Boolean       @default(false) // Đã cộng quota/xu thưởng chưa
  reward_quota    Int           @default(0)     // Số lượt AI hoặc ngày VIP thưởng
  created_at      DateTime      @default(now())
  updated_at      DateTime      @updatedAt

  user            User          @relation(fields: [user_id], references: [id], onDelete: Cascade)
  exam            Exam?         @relation(fields: [exam_id], references: [id], onDelete: SetNull)

  @@index([user_id])
  @@index([status])
  @@index([created_at(sort: Desc)])
}
```

---

## III. THIẾT KẾ CHI TIẾT API BACKEND

### 1. Phân hệ Cấp tài khoản hàng loạt (Bulk Import via Excel)
* **Thư viện Backend sử dụng:** `xlsx` (hoặc `exceljs`) + `multer` (xử lý file upload).
* **Endpoint:** `POST /api/admin/users/bulk-import`
* **Quyền hạn:** `ADMIN` (yêu cầu Bearer Token).
* **Payload:** `multipart/form-data` chứa file `file` (đuôi `.xlsx` hoặc `.csv`).
* **Định dạng cấu trúc file Excel đầu vào:**
  | Cột A: Họ và tên | Cột B: Email | Cột C: Số điện thoại | Cột D: Mật khẩu (tùy chọn) | Cột E: Vai trò (STUDENT/TEACHER) | Cột F: Mục tiêu (B1/B2/C) | Cột G: Ghi chú |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
* **Quy trình xử lý logic:**
  1. Parse buffer bằng `xlsx.read()`.
  2. Validate định dạng Email bằng regex. Kiểm tra trùng lặp với cơ sở dữ liệu `prisma.user.findMany({ where: { email: { in: emails } } })`.
  3. Băm mật khẩu (nếu để trống tự sinh ngẫu nhiên `Aptis@2026`).
  4. Thực thi chèn bằng `prisma.$transaction()` hoặc `createMany()`.
  5. Ghi nhật ký `auditService.record(USER_CREATE)`.
  6. Trả về thống kê: `{ successCount: number, errorCount: number, errors: Array<{ row: number, email: string, reason: string }> }`.

### 2. Phân hệ Đóng góp & Duyệt Review Đề thi (Exam Review & Reward)
* **Học viên gửi review:**
  * **Endpoint:** `POST /api/cms/reviews` (Yêu cầu đăng nhập `authGuard`).
  * **Body JSON:**
    ```json
    {
      "examId": "optional-uuid",
      "rating": 5,
      "scoreAchieved": "B2 (172/200)",
      "examLocation": "Hội đồng British Council - Giảng Võ Hà Nội",
      "examDate": "2026-09-20",
      "comment": "Đề thi trúng tủ Part 4 bài Formal Letter, phòng thi tai nghe rất nét..."
    }
    ```
  * **Xử lý:** Lưu vào bảng `ExamReview` với trạng thái `PENDING`.

* **Admin duyệt bài & Trả thưởng (Reward Activation):**
  * **Endpoint:** `PATCH /api/cms/reviews/:id/approve` (Role: `ADMIN`).
  * **Body JSON:**
    ```json
    {
      "status": "APPROVED",
      "teacherNote": "Chúc mừng em, kết quả rất xứng đáng!",
      "rewardQuota": 5
    }
    ```
  * **Xử lý nguyên tử:**
    - Cập nhật trạng thái `APPROVED`.
    - Cộng ngay `+5 lượt AI Quota` vào `userSubscription` khả dụng của học viên.
    - Đánh dấu `reward_claimed: true`.

### 3. Phân hệ Cổng Giảng viên độc lập (`/api/teacher`)
Bổ sung / chuẩn hóa các endpoint hiện có phục vụ giao diện `/teacher`:
* `GET /api/teacher/dashboard/stats`: Thống kê số lớp, số học viên, số bài chờ chấm, điểm trung bình lớp.
* `GET /api/teacher/classrooms`: Danh sách lớp học và danh sách học viên theo lớp.
* `POST /api/teacher/classrooms`: Tạo lớp học mới, sinh mã tham gia `class_code` dạng `APT-XXXX`.
* `GET /api/teacher/grading-queue`: Hàng đợi các bài Speaking/Writing cần chấm tay.
* `POST /api/teacher/submissions/:id/grade`: Lưu điểm theo 4 tiêu chí CEFR, nhận xét văn bản, gửi thông báo tới học viên.

---

## IV. THIẾT KẾ GIAO DIỆN NGƯỜI DÙNG (FRONTEND UI/UX)

### 1. Nút "Nhập từ Excel" tại Trang Quản trị Học viên (`/admin/users`)
* **Vị trí:** Đặt cạnh nút `[+ Thêm học viên mới]` trên thanh công cụ trang `/admin/users`.
* **Thành phần:**
  * **Modal Tải tệp:** Hỗ trợ Drag & Drop file `.xlsx`, `.csv`. Có nút tải file Excel mẫu chuẩn: `[📥 Tải file mẫu .xlsx]`.
  * **Bảng xem trước (Preview Table):** Hiển thị 5 dòng đầu tiên đọc được từ file, highlight màu đỏ các dòng lỗi cú pháp email.
  * **Thanh tiến trình (Progress Bar):** Hiển thị phần trăm khi hệ thống đang xử lý tạo tài khoản.
  * **Báo cáo kết quả:** Hiển thị số lượng tài khoản tạo thành công và danh sách dòng bị bỏ qua nếu trùng email.

### 2. Form Gửi Review Đề thi thật & Modal vinh danh
* **Vị trí 1:** Nút `[✍️ Chia sẻ đề thi & Nhận 5 lượt AI]` tại trang kết quả thi `/history` và `/bang-ky-tich`.
* **Giao diện:** Form Modal đẹp mắt, cho phép chọn số sao (Star Rating 1-5), địa điểm thi thật, nhận diện điểm thi và nhập nội dung chia sẻ kinh nghiệm.
* **Vị trí 2 (Admin Reviews):** Nâng cấp trang `/admin/reviews` cho phép bấm **Duyệt & Thưởng Quota** hoặc **Ẩn/Xóa bài vi phạm**.

### 3. Bổ sung các trang thông tin công khai (Public Information Routes)
Xây dựng 4 trang mới chuẩn SEO, tương thích hoàn toàn với Theme và Layout hiện tại:
1. `frontend/src/app/about/page.tsx`: Giới thiệu trung tâm Aptis Kỳ Tích, phương pháp đào tạo, đội ngũ giảng viên, cam kết chuẩn đầu ra.
2. `frontend/src/app/terms/page.tsx`: Quy định điều khoản dịch vụ, chính sách hoàn tiền, cam kết bảo mật thông tin học viên.
3. `frontend/src/app/meo-thi-aptis/page.tsx`: Cẩm nang chiến thuật làm bài 4 kỹ năng đạt B2/C, mẹo quản lý thời gian Full Test 162 phút.
4. `frontend/src/app/contact/page.tsx`: Form gửi yêu cầu tư vấn trực tuyến, thông tin Hotline, liên kết Zalo & bản đồ địa chỉ.

### 4. Xây dựng Cổng Giảng viên riêng biệt (`frontend/src/app/teacher/`)
Cấu trúc bố cục dành riêng cho Teacher, độc lập hoàn toàn với Admin:
* `frontend/src/app/teacher/layout.tsx`: Sidebar riêng cho Giảng viên (Không có báo cáo tài chính hay cài đặt doanh thu).
* `frontend/src/app/teacher/page.tsx`: Dashboard lớp học và bài tập chờ chấm.
* `frontend/src/app/teacher/classes/page.tsx`: Quản lý danh sách lớp học và cấp mã `class_code`.
* `frontend/src/app/teacher/grading/page.tsx`: Hàng đợi chấm bài Speaking & Writing (Chấm điểm trực quan, nghe audio, chấm rubric CEFR).

---

## V. LỘ TRÌNH TRIỂN KHAI THEO GIAI ĐOẠN (IMPLEMENTATION ROADMAP)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 LỘ TRÌNH 4 GIAI ĐOẠN                                  │
├───────────────────┬────────────────────────────────────────────────────────────────────┤
│ Giai đoạn 1       │ Mở rộng CSDL Prisma (User + ExamReview), chạy prisma migrate       │
├───────────────────┼────────────────────────────────────────────────────────────────────┤
│ Giai đoạn 2       │ Cài thư viện xlsx, hoàn thiện API Bulk Import & Review Reward      │
├───────────────────┼────────────────────────────────────────────────────────────────────┤
│ Giai đoạn 3       │ Xây dựng các trang tĩnh Frontend: /about, /terms, /meo-thi, /contact│
├───────────────────┼────────────────────────────────────────────────────────────────────┤
│ Giai đoạn 4       │ Xây dựng Cổng Giảng viên /teacher và Kiểm thử tự động E2E          │
└───────────────────┴────────────────────────────────────────────────────────────────────┘
```

### Tiêu chuẩn Nghiệm thu Kỹ thuật (DoD - Definition of Done):
1. Không làm gián đoạn các phiên thi hiện tại (`/speaking`, `/thi-thu`, `/writing`).
2. Biên dịch TypeScript trên cả Backend và Frontend đạt **0 lỗi** (`tsc --noEmit` Exit Code 0).
3. Toàn bộ các bài kiểm thử Jest đạt **100% Passed**.
4. Đúng 100% các tiêu chí UAT quy định tại Phần 7 của tài liệu SRS gốc.

---
*Tài liệu này đã sẵn sàng để phê duyệt và bắt đầu triển khai.*
