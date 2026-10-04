# BÁO CÁO RÀ SOÁT TOÀN DIỆN VỊ TRÍ HARDCODE & HƯỚNG DẪN ĐỌC CODE GO-LIVE
**Hệ thống**: APTIS ESOL PREMIER (Aptis E-learning)  
**Phạm vi**: Toàn bộ mã nguồn Frontend (`frontend/src`) và Backend (`backend/src`)  
**Mục đích**: Định vị chính xác các điểm hardcode, mock data, fallback tĩnh, các rủi ro vận hành và hướng dẫn quản trị viên kiểm tra từng file code trước khi Go-Live.

---

## 📌 BẢNG TỔNG HỢP MỨC ĐỘ RỦI RO

| Cấp độ | Định nghĩa | Số lượng phát hiện | Hành động cần làm trước Go-Live |
| :--- | :--- | :---: | :--- |
| 🔴 **Mức 1: CRITICAL** | Hardcode domain/port, credential lộ, auto-login tài khoản dev | **4 vị trí** | **Bắt buộc sửa** để tránh lỗi trên môi trường production |
| 🟠 **Mức 2: MOCK / DỮ LIỆU ẢO** | Dữ liệu mẫu (fallback) hiển thị thay DB thật khi rỗng | **6 vị trí** | Thay bằng Empty State hoặc Seed DB chuẩn |
| 🟡 **Mức 3: NỘI DUNG TĨNH** | Text giới thiệu, Ebook PDF, câu luyện Dictation, Testimonials | **5 vị trí** | Rà soát nội dung & thay đổi theo thực tế trung tâm |
| 🟢 **Mức 4: LINK & EMAIL DỰ PHÒNG** | Fallback email hệ thống, link Fanpage, route chưa có trang | **4 vị trí** | Cập nhật cấu hình biến môi trường và tạo trang thiếu |

---

## 🔴 MỨC 1: CÁC VỊ TRÍ RỦI RO CAO (BẮT BUỘC XỬ LÝ)

### 1. Hardcode URL Backend `http://localhost:5000` khi tải âm thanh Speaking
- **File**: [`frontend/src/hooks/use-audio-recorder.ts`](file:///d:/sontayweb/aptis-elearning/frontend/src/hooks/use-audio-recorder.ts#L395)
- **Dòng code**: 394 – 403
- **Nội dung bị hardcode**:
  ```typescript
  const res = await fetch(
    `http://localhost:5000/api/submissions/${submissionId}/answers/${questionId}/audio`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }
  );
  ```
- **Rủi ro Go-Live**: Khi triển khai lên tên miền chính thức (Vercel, Cloudflare, VPS), trình duyệt của học viên sẽ cố gửi file âm thanh ghi âm đến `localhost:5000` của chính máy tính học viên $\rightarrow$ **Học viên không thể nộp bài thi Speaking**.
- **Giải pháp**: Thay bằng biến `process.env.NEXT_PUBLIC_API_URL` hoặc hàm gọi `api.submissions.uploadAudio(...)`.

---

### 2. Hardcode URL `http://localhost:5000` khi phát file nghe đề thi
- **File**: [`frontend/src/app/thi-thu/[id]/page.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/thi-thu/%5Bid%5D/page.tsx#L974-L978)
- **Dòng code**: 974 – 978
- **Nội dung bị hardcode**:
  ```typescript
  src={
    currentQ.partAudioUrl.startsWith("http")
      ? currentQ.partAudioUrl
      : `http://localhost:5000${currentQ.partAudioUrl}`
  }
  ```
- **Rủi ro Go-Live**: Nếu URL audio trong cơ sở dữ liệu lưu dưới dạng đường dẫn tương đối (ví dụ: `/uploads/audio/listening-01.mp3`), hệ thống trên production sẽ ghép vào `http://localhost:5000` $\rightarrow$ **Trình phát audio bị lỗi 404, học viên không nghe được đề thi**.
- **Giải pháp**: Thay tiền tố bằng `process.env.NEXT_PUBLIC_BACKEND_URL || ""` thay vì fix cứng `localhost:5000`.

---

### 3. Tự động đăng nhập vào tài khoản Developer khi bấm mua gói cước
- **File**: [`frontend/src/app/pricing/page.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/pricing/page.tsx#L179-L181)
- **Dòng code**: 179 – 181
- **Nội dung bị hardcode**:
  ```typescript
  // If not logged in, auto quick-login student
  if (!isAuthenticated) {
    await quickLogin("student");
  }
  ```
- **Rủi ro Go-Live**: Bất kỳ khách vãng lai nào chưa đăng nhập khi bấm "Nâng cấp ngay" sẽ ngay lập tức bị ép đăng nhập vào tài khoản học viên mẫu `hoanghiep310102@gmail.com` thay vì bật modal đăng ký/đăng nhập.
- **Giải pháp**: Mở modal đăng nhập (`setShowAuthModal(true)`) và thông báo "Vui lòng đăng nhập để tiến hành thanh toán".

---

### 4. Nút "Đăng nhập nhanh" (Quick Login) để lộ mật khẩu mặc định
- **File 1**: [`frontend/src/contexts/auth-context.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/contexts/auth-context.tsx#L120-L125)
  - Dòng 120 – 125: Chứa bảng tài khoản/mật khẩu mặc định:
    ```typescript
    const credentials = {
      student: { email: "hoanghiep310102@gmail.com", password: "Student123!@#" },
      teacher: { email: "teacher@aptiskytich.vn", password: "Admin123!@#" },
      admin: { email: "admin@aptiskytich.vn", password: "Admin123!@#" },
      super_admin: { email: "superadmin@aptiskytich.vn", password: "SuperAdmin123!@#" },
    }[role];
    ```
- **File 2**: [`frontend/src/components/auth-modal.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/components/auth-modal.tsx#L275-L315)
  - Dòng 275 – 315: Render 4 nút bấm "Đăng nhập nhanh (Student/Teacher/Admin/Super Admin)" trực tiếp trên giao diện popup.
- **File 3**: [`frontend/src/app/admin/layout.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/admin/layout.tsx#L239-L248)
- **File 4**: [`frontend/src/app/teacher/layout.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/teacher/layout.tsx#L48)
- **Rủi ro Go-Live**: Bất kỳ người dùng nào mở website đều có thể click 1 nút để đăng nhập thẳng vào quyền Giảng viên hoặc Quản trị viên tối cao.
- **Giải pháp**: Chỉ kích hoạt hoặc render các nút này khi `process.env.NODE_ENV === "development"`. Ở production phải ẩn hoàn toàn.

---

## 🟠 MỨC 2: DỮ LIỆU MẪU / FALLBACK KHI DATABASE RỖNG

### 1. Nhật ký hệ thống ảo (Audit Logs Fallback)
- **File**: [`frontend/src/app/admin/audit-logs/page.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/admin/audit-logs/page.tsx#L45-L135)
- **Dòng code**:
  - Dòng 45 – 135: Mảng `FALLBACK_LOGS` gồm 6 bản ghi log giả định (người thao tác: `Nguyễn Hoàng Hiệp`, `Trần Mai Anh`, `Hệ Thống Tự Động`, mã giao dịch SePay `tx_mb_88921`...).
  - Dòng 145 – 149: Thống kê số lượng log mặc định: `totalLogs: 154, todayLogs: 28`.
- **Rủi ro Go-Live**: Nếu hệ thống mới dựng và bảng `AuditLog` trong cơ sở dữ liệu chưa có bản ghi nào, màn hình sẽ hiển thị 6 hành động và 154 lượt log ảo này, gây hiểu lầm cho ban quản trị.
- **Giải pháp**: Khi `logsRes` rỗng, hiển thị component `EmptyState` ("Chưa có hoạt động nào được ghi nhận") và khởi tạo `stats` với giá trị 0.

---

### 2. Danh sách học viên xuất sắc ảo (Bảng Kỳ Tích / Hall of Fame)
- **File**: [`backend/src/modules/cms/cms.service.ts`](file:///d:/sontayweb/aptis-elearning/backend/src/modules/cms/cms.service.ts#L268-L311)
- **Dòng code**: 268 – 311 (hàm `getHallOfFame()`)
- **Nội dung bị hardcode**:
  - `hof-1`: Học viên Nguyễn Minh Anh, Đạt 48/50 CEFR C ngày 20/09/2026.
  - `hof-2`: Học viên Trần Quốc Bảo, Đạt 50/50 CEFR C (Audio link: `https://cdn.aptiskytich.vn/audio/samples/hof_speaking_c.mp3`).
  - `hof-3`: Học viên Lê Thu Hà, Đạt 44/50 CEFR B2.
- **Rủi ro Go-Live**: Dữ liệu vinh danh không lấy từ bài thi thực của học sinh trong hệ thống. File audio trỏ đến tên miền ngoài có thể bị đứt link.
- **Giải pháp**: Tạo bảng `HallOfFame` trong Prisma schema hoặc truy vấn top học viên điểm cao nhất từ bảng `ExamSubmission` đã được Giảng viên chấm duyệt.

---

### 3. Đánh giá học viên ảo (Reviews Seed Fallback)
- **File**: [`backend/src/modules/cms/cms.service.ts`](file:///d:/sontayweb/aptis-elearning/backend/src/modules/cms/cms.service.ts#L113-L138)
- **Dòng code**: 113 – 138 (trong hàm `getReviews()`)
- **Nội dung bị hardcode**:
  ```typescript
  if (reviews.length === 0) {
    return [
      { id: 'rev-1', studentName: 'Nguyễn Thảo Linh', score: 'B2 (168/200)', ... },
      { id: 'rev-2', studentName: 'Trần Minh Quang', score: 'C1 (185/200)', ... },
    ];
  }
  ```
- **Mục đích**: Giúp trang web không bị trống trải khi chưa có người dùng nào để lại đánh giá.
- **Khuyến nghị**: Nếu trung tâm muốn giữ đánh giá mồi (social proof) ban đầu thì chấp nhận được. Nếu muốn 100% minh bạch thì xóa fallback và chỉ trả về mảng rỗng.

---

### 4. Từ vựng dự phòng chủ đề Động vật (Vocabulary Detail Page)
- **File**: [`frontend/src/app/vocabulary/[id]/page.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/vocabulary/%5Bid%5D/page.tsx#L43-L190)
- **Dòng code**: 43 – 190 (`FALLBACK_WORDS`)
- **Nội dung bị hardcode**: 10 từ vựng chủ đề Animals (bald eagle, parrot, crow, flamingo, owl, cheetah...).
- **Rủi ro Go-Live**: Nếu một bộ từ vựng mới được tạo nhưng chưa thêm từ nào, hoặc nếu server gặp lỗi ngắt kết nối, giao diện sẽ tự nhảy về bộ từ vựng Động vật này thay vì hiển thị thông báo "Chưa có từ vựng trong bộ này".

---

### 5. Số lượng thuê bao ảo trong trang Quản lý Gói cước CMS
- **File**: [`frontend/src/app/admin/cms/page.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/admin/cms/page.tsx#L39-L109)
- **Dòng code**: 39 – 109 (`DEFAULT_FALLBACK_PLANS`)
- **Nội dung bị hardcode**: Mặc định hiển thị `activeSubscribers: 12, 8, 15, 4` cho các gói Free, VIP 1M, VIP 3M, Premier 6M nếu API `api.admin.getPlans()` không phản hồi.

---

### 6. Component lịch sử làm bài mẫu không sử dụng
- **File**: [`frontend/src/components/recent-tests.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/components/recent-tests.tsx#L5-L42)
- **Dòng code**: 5 – 42
- **Tình trạng**: Chứa 4 bài test giả lập. Hiện tại Dashboard học viên ([`dashboard-view.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/components/dashboard-view.tsx#L121)) đã được nâng cấp lấy dữ liệu thật `stats.recentTests`, component này trở thành mã nguồn thừa (dead code), nên dọn dẹp để tránh gọi nhầm.

---

## 🟡 MỨC 3: NỘI DUNG TĨNH & HỌC LIỆU CỐ ĐỊNH (CẦN RÀ SOÁT THEO TRUNG TÂM)

### 1. Kho tài liệu & Video bài giảng mẫu
- **File**: [`frontend/src/app/tai-lieu/page.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/tai-lieu/page.tsx#L54-L140)
- **Dòng code**:
  - Dòng 54 – 100: Mảng `DOCUMENTS_DATA` chứa 6 tài liệu PDF với số lượt tải tĩnh (3842, 5120 lượt tải) và đường dẫn download `downloadUrl: "#"`.
  - Dòng 105 – 140: Mảng `VIDEOS_DATA` chứa 4 video YouTube bài giảng của giảng viên.
- **Hướng dẫn đọc code**: Các tài liệu hiện có link tải là `#`. Trước khi Go-Live, ban quản trị cần tải các file PDF thật lên thư mục lưu trữ (S3 / VPS storage) và điền link download thực tế.

---

### 2. Danh sách câu luyện Nghe chép chính tả (Dictation)
- **File**: [`frontend/src/app/nghe-chep/page.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/nghe-chep/page.tsx#L39-L125)
- **Dòng code**: 39 – 125 (`DEFAULT_SENTENCES`)
- **Nội dung**: Các câu tiếng Anh được chia theo 3 cấp độ: Foundation (5 câu), Momentum (2 câu), Mastery (2 câu).
- **Cơ chế hoạt động**: Sử dụng Web Speech API của trình duyệt (`window.speechSynthesis`) để đọc từng câu. Đây là giải pháp rất nhẹ và không phụ thuộc server, hoàn toàn sẵn sàng cho học viên luyện tập, nhưng số lượng câu hiện tại còn ít (9 câu). Cần mở rộng thêm ngân hàng câu.

---

### 3. Bài viết Blog / Mẹo làm bài trên Sidebar
- **File**: [`frontend/src/components/tips-section.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/components/tips-section.tsx#L4-L20)
- **Dòng code**: 4 – 20
- **Nội dung**:
  ```typescript
  const articles = [
    {
      title: "Hướng dẫn sử dụng APTIS ESOL PREMIER cho người mới",
      date: "16-09",
      href: "/meo-thi-aptis/huong-dan-hoc-tren-aptis-ky-tich-cho-nguoi-moi",
    },
    { title: "Mẹo học Reading Aptis", date: "09-07", ... },
    { title: "Mẹo học Grammar Aptis", date: "09-07", ... },
  ];
  ```
- **Lưu ý**: Ngày đăng đang bị cố định là `"16-09"`, `"09-07"` và slug link vẫn còn từ khóa cũ `aptis-ky-tich`. Nên cập nhật slug đồng bộ với thương hiệu mới.

---

### 4. Đánh giá phản hồi trên Landing Page (Testimonials)
- **File**: [`frontend/src/components/landing-page.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/components/landing-page.tsx#L192-L230)
- **Dòng code**: 192 – 230 (`const feedbacks = [...]`)
- **Nội dung**: 4 phản hồi của học sinh các trường ĐH (NEU, HUST, FTU, AOF). Đây là nội dung tĩnh chuẩn của trang đích (Landing Page), quản trị viên có thể thay thế tên/hình ảnh theo học viên tiêu biểu thực tế của trung tâm.

---

### 5. Nội dung các trang tĩnh CMS ở Backend
- **File**: [`backend/src/modules/cms/cms.service.ts`](file:///d:/sontayweb/aptis-elearning/backend/src/modules/cms/cms.service.ts#L7-L82)
- **Dòng code**: 7 – 82 (hàm `getPage(slug)`)
- **Nội dung**: Trả về dữ liệu JSON cố định cho 4 trang:
  - `about`: Giới thiệu trung tâm, số liệu `15,200+` học viên, `98.6%` đạt target.
  - `meo-thi`: Chiến lược làm bài cho 4 kỹ năng Speaking, Writing, Reading, Listening.
  - `terms`: Điều khoản sử dụng và chính sách hoàn phí.
  - `contact`: Hotline `0379 866 596`, Email `aptiskytich.admin@gmail.com`, Zalo `https://zalo.me/0867833227`.

---

## 🟢 MỨC 4: LIÊN KẾT & CẤU HÌNH THƯƠNG HIỆU CẦN ĐỒNG BỘ

1. **Nút "Lấy mã giới thiệu" dẫn đến trang chưa tồn tại (404)**:
   - **File**: [`frontend/src/components/referral-gift-card.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/components/referral-gift-card.tsx#L18)
   - **Chi tiết**: `href="/gioi-thieu"`, nhưng thư mục `frontend/src/app` chưa có route `/gioi-thieu`. Cần tạo trang hoặc trỏ tạm thời về `/profile` để học viên lấy link giới thiệu.

2. **Đường dẫn Fanpage Facebook cũ**:
   - **File 1**: [`frontend/src/components/footer.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/components/footer.tsx#L170)
   - **File 2**: [`frontend/src/components/floating-actions.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/components/floating-actions.tsx#L42)
   - **Chi tiết**: Đang trỏ về `https://www.facebook.com/Aptiskytich`. Cần cập nhật đúng Fanpage chính thức của trung tâm trước khi công bố.

3. **Email dự phòng hệ thống trong Backend**:
   - **File 1**: [`backend/src/modules/teacher/teacher.service.ts`](file:///d:/sontayweb/aptis-elearning/backend/src/modules/teacher/teacher.service.ts#L129)
     - `email: teacher?.email || 'teacher@aptiskytich.vn'`
   - **File 2**: [`backend/src/modules/audit/audit.service.ts`](file:///d:/sontayweb/aptis-elearning/backend/src/modules/audit/audit.service.ts#L42)
     - `const actorEmail = ... || 'system@aptiskytich.vn'`
   - **File 3**: [`backend/src/modules/payment/payment.service.ts`](file:///d:/sontayweb/aptis-elearning/backend/src/modules/payment/payment.service.ts#L249)
     - `email: 'payment-recovery@aptiskytich.vn'`
   - **Khuyến nghị**: Đưa vào biến môi trường `DEFAULT_SYSTEM_EMAIL` hoặc cấu hình tập trung trong `backend/src/config/constants.ts`.

---

## 📋 CHECKLIST CẦN THỰC HIỆN TRƯỚC KHI BẤM NÚT GO-LIVE

- [ ] **Sửa URL Upload Audio**: Đổi `http://localhost:5000` trong [`use-audio-recorder.ts`](file:///d:/sontayweb/aptis-elearning/frontend/src/hooks/use-audio-recorder.ts#L395) sang URL biến môi trường.
- [ ] **Sửa Audio Player URL**: Đổi `http://localhost:5000` trong [`thi-thu/[id]/page.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/thi-thu/%5Bid%5D/page.tsx#L977).
- [ ] **Khóa nút Quick Login**: Thêm điều kiện `process.env.NODE_ENV !== 'production'` trong [`auth-modal.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/components/auth-modal.tsx) và [`auth-context.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/contexts/auth-context.tsx).
- [ ] **Bảo vệ luồng mua gói**: Sửa [`pricing/page.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/pricing/page.tsx#L180) để hiện pop-up yêu cầu đăng nhập thay vì auto quick-login.
- [ ] **Dọn dẹp Audit Logs ảo**: Bỏ mảng `FALLBACK_LOGS` trong [`audit-logs/page.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/admin/audit-logs/page.tsx) để hiển thị Empty State trung thực.
- [ ] **Cập nhật Hotline / Email**: Kiểm tra thông tin liên hệ trong [`contact/page.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/contact/page.tsx) và [`cms.service.ts`](file:///d:/sontayweb/aptis-elearning/backend/src/modules/cms/cms.service.ts#L73).
