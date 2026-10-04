# NHẬT KÝ TIẾN ĐỘ & HIỆN TRẠNG DỰ ÁN (PROJECT PROGRESS LOG)
## HỆ THỐNG E-LEARNING & KHẢO THÍ APTIS ESOL (APTIS KỲ TÍCH)

---

### 📅 BẢN GHI NGÀY: 29/09/2026
* **Kỹ sư phụ trách:** Antigravity AI Engineer & Engineering Team  
* **Trạng thái hệ thống:** Đồng bộ hoàn toàn API · 0 Lỗi TypeScript · 100% các trang dùng dữ liệu động

---

## I. TỔNG QUAN TIẾN ĐỘ THỰC HIỆN TRONG NGÀY

Trong phiên làm việc hôm nay, hệ thống đã hoàn thiện 3 nhóm vấn đề còn tồn đọng sau đợt rà soát hardcode:

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                           CÁC HẠNG MỤC ĐÃ HOÀN THÀNH HÔM NAY                          │
│                                                                                       │
│  [1. Progress Strip]   ──► Đồng bộ 4 trang (/listening, /speaking, /writing, /grammar)│
│                             Progress Strip nay hiển thị "Đã hoàn thành X bài · ĐTB Y" │
│                             lấy từ api.submissions.getMyHistory() thay vì text cứng    │
│  [2. Teacher Classes]  ──► Fix handleViewMembers gọi sai API (getClassrooms())          │
│                             Nay gọi đúng GET /teacher/classrooms/:id/members            │
│  [3. API Client]       ──► Bổ sung method getClassroomMembers(classroomId) vào teacher │
│                             section của api-client.ts                                   │
│  [4. RBAC SuperAdmin]  ──► Xây dựng màn hình Phân quyền Mẫu 1 (/admin/permissions)     │
│                             Hai cột chuyển quyền Dual Transfer Box tương tác thật 100%│
│  [5. Mobile WebApp]    ──► Tối ưu Dashboard thành WebApp di động: MobileBottomNav,     │
│                             MobileAppLauncher (8 phím tắt), padding & touch targets   │
│  [6. Notifications]    ──► Xây dựng trọn gói hệ thống Thông báo (Notification System) │
│                             Prisma model, /api/notifications, popover Navbar thời gian thực│
│  [7. User Profile & Pwd]─► Xây dựng màn hình Hồ sơ & Đổi mật khẩu (/profile)          │
│                             API PATCH /profile, POST /change-password, 3 Tabs UI      │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## II. CHI TIẾT CÁC TÍNH NĂNG VÀ LỖI ĐÃ XỬ LÝ

### 1. Đồng bộ Progress Strip ở 4 Phòng Luyện Kỹ Năng
* **Vấn đề ban đầu:** 
  * Các trang `/listening`, `/speaking`, `/writing`, `/grammar` đều có phần "Tiến độ học tập của bạn" nhưng text cứng "Chưa có bài nào" không cập nhật kể cả khi học viên đã làm nhiều bài.
* **Giải pháp thực hiện:**
  * Thêm `state progressText` vào mỗi trang với default text "Chưa có bài nào".
  * Trong `useEffect`, gọi `api.submissions.getMyHistory({ skill: "..." })` không đồng bộ (non-blocking).
  * Nếu API trả về dữ liệu (user đã đăng nhập và có lịch sử), tính toán: số bài hoàn thành + điểm trung bình.
  * Cập nhật `progressText` thành dạng: `"Đã hoàn thành X bài · Điểm trung bình: Y/50"`.
  * Nếu API lỗi hoặc chưa đăng nhập: giữ nguyên default text — không làm crash trang.

### 2. Fix API Teacher Classroom Members
* **Vấn đề ban đầu:**
  * Hàm `handleViewMembers` trong `/teacher/classes/page.tsx` gọi sai `api.teacher.getClassrooms()` để lấy danh sách học viên.
* **Giải pháp thực hiện:**
  * Thêm method `getClassroomMembers(classroomId: string)` vào `api-client.ts` → `GET /teacher/classrooms/:id/members`.
  * Sửa `handleViewMembers` để gọi đúng `api.teacher.getClassroomMembers(cls.id)`.
  * Thêm try/catch và fallback sang `cls.members` nếu endpoint lỗi.

---

## III. HIỆN TRẠNG KỸ THUẬT & KIỂM THỬ

| Tiêu chí | Trạng thái | Ghi chú |
| :--- | :---: | :--- |
| **Backend Dev Server** | 🟢 Running (Port 5000) | Kết nối PostgreSQL 5432 ổn định |
| **Frontend Dev Server** | 🟢 Running (Port 3000) | Next.js 16 (Turbopack) hot-reload |
| **TypeScript Compilation** | 🟢 PASS (0 Errors) | `tsc --noEmit` exit code 0 |
| **Backend Test Suite** | 🟢 PASS 100% | **10/10 Suites, 93/93 Tests PASS** (`npm test`) |
| **Hệ thống Thông báo (Noti)** | 🟢 100% | Dropdown Navbar + REST API + Tự động gửi khi có điểm/VIP |
| **Hồ sơ cá nhân & Đổi mật khẩu** | 🟢 100% | /profile + PATCH /profile + POST /change-password + Audit Log |
| **Đồng bộ API - Phòng Kỹ Năng** | 🟢 100% | /listening /speaking /reading /writing /grammar |
| **Đồng bộ API - Speaking Runner** | 🟢 100% | Gộp audio câu cuối vào Autosave & Submit DB |
| **Đồng bộ API - Lớp Học Học Viên** | 🟢 100% | /my-classes → Tham gia bằng mã & Danh sách lớp |
| **Đồng bộ API - Lịch sử** | 🟢 100% | /history → api.submissions.getMyHistory() |
| **Đồng bộ API - Từ vựng** | 🟢 100% | /vocabulary → api.vocabulary.getSets() |
| **Đồng bộ API - Bảng Kỳ Tích** | 🟢 100% | /bang-ky-tich → api.cms.getHallOfFame() |
| **Đồng bộ API - Key Dự Đoán** | 🟢 100% | /key-du-doan → api.exams.getAll({ source: "KEY" }) |
| **Teacher Portal** | 🟢 100% | Layout độc lập, không hiện tài chính, getClassroomMembers fixed |

---

## IV. KẾ HOẠCH BƯỚC TIẾP THEO (NEXT STEPS)

1. **Import dữ liệu thực tế**: Nhập đủ 198 bộ từ vựng và 860 đề thi từ file Excel của trung tâm vào DB thông qua seed script hoặc nút Import Admin.
2. **Cấu hình API Key sản phẩm**: OPENAI_API_KEY thật (Whisper + GPT-4o), SEPAY_API_KEY thật, Google OAuth Client ID.
3. **Deploy lên VPS**: Ubuntu + Nginx + PostgreSQL 16 + PM2 ecosystem.

---

## V. LƯU TRỮ VÀ TẠM ẨN CÁC COMPONENT PHỤ (STASHED COMPONENTS FOR DEMO)
* **Tài liệu chi tiết:** Xem `docs/stashed-features.md`.
* **Component 1:** `GoalTracker` (`frontend/src/components/goal-tracker.tsx`) — đang comment out tại `frontend/src/app/page.tsx:107`.
* **Component 2:** `TodayPlan` (`frontend/src/components/today-plan.tsx`) — đang comment out tại `frontend/src/app/page.tsx:94`.
* **Mục đích:** Đảm bảo giao diện Dashboard chuẩn 100% theo bản mẫu `https://aptiskytich.vn/dashboard` cho buổi demo. Khi cần bật lại chỉ cần uncomment 2 vị trí trên.
