✅- Legend: "Hôm nay" (blue) / "Các ngày trước" (slate)

#### Cột phải (1/3): Widget "Cần Xử Lý Ngay"

- Header: Chấm `animate-ping bg-rose-500` + `"Cần xử lý ngay"` + badge `{N} mục`
- **Empty state:** CheckCircle2 emerald + `"Tuyệt vời! Không có giao dịch bị kẹt"`
- **Có pending:** Danh sách card `border-rose-100 bg-rose-50/40`
  - Mỗi row: Mã đơn (font-mono, rose-700) + Số tiền + Tên học viên
  - Nút inline: `"Khớp lệnh"` — `bg-rose-600` → mở Modal

### 4.4. Modal "Khớp Lệnh Thủ Công"

| Element | Chi tiết |
|---|---|
| Overlay | `bg-black/60 backdrop-blur-sm` |
| Modal | `max-w-md rounded-3xl p-7 bg-white shadow-2xl` |
| Header | CheckCircle2 icon trong `bg-rose-100`, title `"Khớp lệnh thủ công"` |
| Data card | `bg-slate-50 rounded-2xl`: Mã đơn, Số tiền (rose-600), Học viên, Email |
| CTA Hủy | `bg-slate-100` |
| CTA Xác nhận | `bg-emerald-600` + `"Xác nhận khớp tiền"` |
| Toast thành công | `bg-emerald-600 animate-bounce`, góc `bottom-6 right-6`, tự ẩn sau 5 giây |

### 4.5. Quick Action Cards (3 card)

| Card | Mô tả | Hover border |
|---|---|---|
| Quản lý Học viên | Tra cứu Email/SĐT, cấp VIP, khóa | `border-blue-400` |
| Ngân hàng Đề thi | Tạo đề theo Bước (Stepper) | `border-emerald-400` |
| Cấu hình Gói cước | Điều chỉnh giá VIP, quota AI/GV | `border-purple-400` |

Icon mỗi card: `group-hover:scale-110 transition-transform`

---

## 5. MÀN HÌNH 2: QUẢN LÝ HỌC VIÊN

**Route:** `/admin/users` | **File:** `src/app/admin/users/page.tsx`

### 5.1. Toolbar

```
[🔍 Tìm theo tên, email hoặc số điện thoại...]    [Tất cả | Học viên | Giảng viên | Quản trị]    [+ Thêm tài khoản]
```

### 5.2. Bảng Dữ liệu (15 records/trang)

| Cột | Nội dung | Ghi chú |
|---|---|---|
| Họ tên | Avatar gradient chữ đầu + full_name + email | |
| Vai trò | Badge màu theo role | ADMIN=amber, TEACHER=blue, STUDENT=slate |
| Trạng thái | Badge | 🟢 Đang hoạt động (emerald), 🔴 Đã khóa (rose) |
| SĐT | phone_number | `—` nếu null |
| Ngày đăng ký | created_at `dd/MM/yyyy` | |
| Lượt làm bài | `_count.submissions` | |
| Hành động | Lock/Unlock icon inline | Không cần mở trang mới |

### 5.3. Badge Vai Trò

```
ADMIN     → bg-amber-100 text-amber-800   + ShieldCheck icon
TEACHER   → bg-blue-100  text-blue-800    + GraduationCap icon
STUDENT   → bg-slate-100 text-slate-700
```

### 5.4. Phân Trang

```
[← Trang trước]   Trang {current} / {total} — {totalCount} người dùng   [Trang sau →]
```

### 5.5. Modal Tạo Tài Khoản Mới

Fields: Email*, Mật khẩu*, Họ và tên*, Số điện thoại, Vai trò (select)  
Submit: POST `/api/admin/users` → Toast → Reload list

---

## 6. MÀN HÌNH 3: GIAO DỊCH & DOANH THU

**Route:** `/admin/transactions` | **File:** `src/app/admin/transactions/page.tsx`

### 6.1. Tab System

```
[ Tất cả ]  [ ✅ Thành công ]  [ ⚠ Cần xử lý ]  [ ❌ Đã hủy ]
```

Tab "Cần xử lý" có badge đỏ số lượng — ưu tiên cao nhất.

### 6.2. Bảng Giao Dịch

| Cột | Nội dung |
|---|---|
| Mã đơn | font-mono, clickable |
| Học viên | Avatar + tên + email |
| Số tiền | Format VND `vi-VN` |
| Gói | Tên gói subscription |
| Nội dung CK | Nội dung thực tế từ SePay webhook |
| Thời gian | created_at |
| Trạng thái | Badge status |
| Hành động | Nút "Khớp lệnh" (chỉ hiện với PENDING) |

### 6.3. Badge Trạng Thái

| Status | Màu | Label |
|---|---|---|
| `COMPLETED` | emerald | ✅ Thành công |
| `PENDING` | amber | ⏳ Đang chờ |
| `FAILED` | rose | ❌ Thất bại |
| `CANCELLED` | slate | Đã hủy |

### 6.4. Flow Khớp Lệnh Thủ Công

**Tình huống:** Học viên chuyển tiền đúng nhưng sai nội dung chuyển khoản (không có mã đơn hàng).

1. Admin vào tab "Cần xử lý"
2. Thấy giao dịch (số tiền + nội dung CK thực tế)
3. Bấm `"Khớp lệnh"` → Modal xác nhận
4. Xác nhận → PUT `/api/admin/transactions/:id/resolve` `{ status: "COMPLETED", note: "..." }`
5. Toast thành công, reload danh sách

---

## 7. MÀN HÌNH 4: NGÂN HÀNG ĐỀ THI (EXAM BUILDER)

**Route:** `/admin/exams` | **File:** `src/app/admin/exams/page.tsx`

### 7.1. Header & Filter

```
[📚 Ngân hàng Đề thi]  [{N} đề thi]
[🔍 Tìm tên đề thi...]   [Tất cả | Nghe | Đọc | Viết | Nói | Full Test]   [+ Tạo đề thi mới]
```

### 7.2. Card Grid Đề Thi

Layout: `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5`

Mỗi card:
```
[Crown nếu PRO]  [Badge kỹ năng]
Tiêu đề đề thi
Mô tả (truncate 2 dòng)
[Clock: N phút]  [HelpCircle: M câu]  [Users: K lượt]  [Layers: P Parts]
[Published/Draft badge]                                  [🗑 Xóa]
```

**Badge kỹ năng màu:**
| Kỹ năng | Màu badge |
|---|---|
| LISTENING | blue |
| READING | emerald |
| WRITING | violet |
| SPEAKING | rose |
| FULL_TEST | amber |

### 7.3. Wizard Tạo Đề Thi (3 Bước)

```
●──────●──────●
B1     B2     B3
```

**Bước 1 — Thông tin chung:**
- Tên đề thi* (input)
- Mô tả (textarea)
- Kỹ năng* (select: LISTENING / READING / WRITING / SPEAKING / FULL_TEST)
- Thời gian (phút)* — default 162 cho Full Test
- Loại: Toggle "Miễn phí" / "PRO (Crown)"

**Bước 2 — Cấu trúc Part:**

Cấu trúc Aptis chuẩn cho Full Test (11 Parts):
| Part | Kỹ năng | Loại |
|---|---|---|
| Part 1–4 | Listening | Listen and match / Conversations |
| Part 5–8 | Reading | Matching / Long text / Multiple texts |
| Part 9–11 | Writing | Short answer / Email / Essay |

Mỗi Part: tên, hướng dẫn, danh sách câu hỏi con  
Mỗi câu hỏi: nội dung, điểm, loại đáp án (MULTIPLE_CHOICE / SHORT_ANSWER / ESSAY / AUDIO)

**Bước 3 — Xác nhận:**
- Preview toàn bộ cấu trúc
- Submit → POST `/api/admin/exams` → Toast → Reload

### 7.4. Xóa Đề Thi

Modal xác nhận với cảnh báo rose: `"Toàn bộ dữ liệu làm bài sẽ bị mất."`

---

## 8. MÀN HÌNH 5: QUẢN LÝ TỪ VỰNG

**Route:** `/admin/vocabulary` | **File:** `src/app/admin/vocabulary/page.tsx`

### 8.1. Danh Sách Bộ Từ Vựng (Card View)

Card theo chủ đề (Môi trường, Gia đình, Công nghệ,...) với số lượng từ + nút Sửa/Xóa.

### 8.2. Bảng Từ Vựng Inline-Editable

| Từ (EN) | Phiên âm | Loại từ | Nghĩa (VI) | Audio | Ví dụ |
|---|---|---|---|---|---|
| Click vào ô để sửa trực tiếp | | | | 🔊 | |

- **Inline Edit:** Bấm đúp → sửa → Enter/blur để lưu → không cần mở form mới
- **Xóa từ:** Icon thùng rác cuối hàng
- **Thêm từ:** Hàng trống + nút `"+ Thêm từ mới"`

### 8.3. Upload Audio

- Ghi âm trực tiếp qua microphone (Web Audio API)
- Kéo thả file `.mp3` / `.wav`
- Preview play/pause ngay sau upload

---

## 9. MÀN HÌNH 6: KIỂM DUYỆT ĐÁNH GIÁ (BẢNG KỲ TÍCH)

**Route:** `/admin/reviews` | **File:** `src/app/admin/reviews/page.tsx`

### 9.1. Feed Social-style

Mỗi card review:
```
[Avatar] Tên học viên  |  Điểm số (B2, C1...)  |  Thời gian nộp

Nội dung bài viết/nói của học viên...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Nhận xét của giáo viên:]
[Textarea: Thêm nhận xét...]    [Lưu nhận xét]

        [✅ Duyệt hiển thị]   [🗑️ Ẩn/Xóa bài]
```

### 9.2. Hành Động

| Nút | API | Notes |
|---|---|---|
| Duyệt hiển thị | PATCH `/api/admin/reviews/:id/approve` | Không hỏi confirm |
| Ẩn/Xóa | DELETE `/api/admin/reviews/:id` | Hỏi confirm |
| Lưu nhận xét | PATCH `/api/admin/reviews/:id/comment` | |

### 9.3. Tab Filter

```
[Chờ duyệt (N)]  [Đã duyệt]  [Đã ẩn]
```

Badge số lượng ở tab "Chờ duyệt" — ưu tiên xử lý.

---

## 10. MÀN HÌNH 7: GÓI CƯỚC & CÀI ĐẶT (CMS)

**Route:** `/admin/cms` | **File:** `src/app/admin/cms/page.tsx`

### 10.1. Bảng Gói Subscription

| Gói | Giá | Thời hạn | AI Quota | Teacher Quota | Trạng thái |
|---|---|---|---|---|---|
| FREE | 0đ | Không giới hạn | 5 lượt/tháng | 0 | Active |
| VIP_1M | 149,000đ | 30 ngày | 50 lượt | 5 lượt | Active |
| VIP_3M | 349,000đ | 90 ngày | 150 lượt | 15 lượt | Active |
| VIP_6M | 599,000đ | 180 ngày | 350 lượt | 35 lượt | Active |

Edit inline: Click vào ô giá/quota → sửa → Lưu ngay.

### 10.2. Cài Đặt Khác

- Nội dung trang Giới thiệu
- Thông báo banner hệ thống
- Cấu hình khuyến mãi

---

## 11. HÀNH VI GIAO DIỆN DÙNG CHUNG

### 11.1. Loading States

| Pattern | Implementation |
|---|---|
| Skeleton | `bg-slate-200 rounded animate-pulse` thay thế nội dung |
| Spinner | `RefreshCw animate-spin` trên nút |
| Loading overlay | Chặn toàn bộ modal khi submit |

### 11.2. Toast Notification System

- **Vị trí:** `fixed bottom-6 right-6 z-50`
- **Thành công:** `bg-emerald-600 text-white rounded-2xl shadow-xl animate-bounce` + CheckCircle2
- **Lỗi:** `bg-rose-600 text-white` + AlertTriangle
- **Tự ẩn:** Sau 5000ms
- **KHÔNG dùng:** `window.alert()` (ngoại trừ lỗi kết nối server nghiêm trọng)

### 11.3. Empty States

| Màn hình | Text |
|---|---|
| Dashboard - To-Do | "Tuyệt vời! Không có giao dịch bị kẹt" |
| Users | "Chưa có học viên nào phù hợp bộ lọc" |
| Exams | "Chưa có đề thi nào. Hãy tạo đề thi đầu tiên!" |
| Reviews | "Chưa có bài đánh giá nào đang chờ duyệt" |

### 11.4. Confirm Dialog (Chỉ cho hành động nguy hiểm)

Áp dụng: **Xóa đề thi, Khóa tài khoản, Xóa bài review**  
KHÔNG áp dụng: Lọc, tìm kiếm, sửa inline, duyệt review

```
[⚠️ Icon]
"Bạn có chắc muốn [hành động]?"
[Hậu quả - màu rose-600]

[Hủy bỏ - slate]   [Xác nhận - rose-600]
```

### 11.5. Responsive Breakpoints

| Breakpoint | Thay đổi |
|---|---|
| Mobile < sm | Padding `p-4`, table cuộn ngang |
| Tablet sm–lg | Grid 2 cột, sidebar ẩn |
| Desktop >= lg | Sidebar cố định, grid 3-4 cột |

---

## 12. API INTEGRATION MAP

| Màn hình | Endpoint | Method | Notes |
|---|---|---|---|
| Dashboard KPIs | `/api/admin/dashboard` | GET | Cũng lấy `pendingTxCount` cho sidebar badge |
| Users list | `/api/admin/users` | GET | Params: `search`, `role`, `page`, `limit=15` |
| Toggle user active | `/api/admin/users/:id/toggle-active` | PATCH | |
| Create user | `/api/admin/users` | POST | |
| Exams list | `/api/admin/exams` | GET | Params: `skill`, `search`, `page` |
| Create exam | `/api/admin/exams` | POST | Body: full exam với parts |
| Delete exam | `/api/admin/exams/:id` | DELETE | |
| Transactions list | `/api/admin/transactions` | GET | Params: `status`, `page` |
| Resolve transaction | `/api/admin/transactions/:id/resolve` | PUT | Body: `{ status, note }` |
| Reviews list | `/api/admin/reviews` | GET | Params: `status` |
| Approve review | `/api/admin/reviews/:id/approve` | PATCH | |
| Plans list | `/api/admin/plans` | GET | |
| Update plan | `/api/admin/plans/:id` | PATCH | |

---

## 13. CÁC QUYẾT ĐỊNH THIẾT KẾ & LÝ DO

| Quyết định | Lý do |
|---|---|
| Sidebar màu trắng (không dark) | Admin làm việc ban ngày, dark mode gây mỏi mắt khi đọc bảng dài |
| Badge `animate-pulse` cho giao dịch pending | Không thể bỏ lỡ — đây là tiền của học viên |
| Biểu đồ tự build (không dùng Recharts) | Giảm bundle size, kiểm soát hoàn toàn animation và responsive |
| Inline action (không mở trang mới) | Giảm số click: khóa tài khoản, khớp lệnh ngay trên dòng |
| Wizard 3 bước cho Exam Builder | Full Test có 11 Parts, 50+ câu — 1 form dài sẽ gây rối |
| Không confirm khi duyệt review | Thao tác thuận chiều, ít rủi ro — confirm sẽ làm chậm workflow |
| "Hệ thống hoạt động ổn định" ở header | Khi có sự cố thật, đây là nơi hiển thị cảnh báo đầu tiên |
| `getGreeting()` cá nhân hóa theo giờ | Tạo cảm giác thân thiện, không phải "phần mềm kế toán lạnh lẽo" |

---

*Tài liệu này phản ánh chính xác trạng thái code đang chạy trong `frontend/src/app/admin/`. Mọi thay đổi UI cần cập nhật đồng thời.*  
*Cập nhật: 2026-09-25 — Antigravity AI Assistant*
