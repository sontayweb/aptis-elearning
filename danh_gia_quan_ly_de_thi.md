# 🎓 Đánh giá Chuyên gia — Bộ Quản lý Đề thi Aptis E-Learning

> **Phạm vi đánh giá:** Toàn bộ luồng quản lý đề thi từ Backend API → Frontend Admin UI → Trang làm bài học viên  
> **Ngày đánh giá:** 01/10/2026  
> **Người đánh giá:** Antigravity AI — Chuyên gia Kiến trúc Hệ thống

---

## 📊 Tổng điểm đánh giá

| Tiêu chí | Điểm | Nhận xét |
| :--- | :---: | :--- |
| Kiến trúc Backend | ⭐⭐⭐⭐☆ (4/5) | Sạch sẽ, phân lớp rõ ràng, Audit Log đầy đủ |
| Giao diện Admin UI | ⭐⭐⭐☆☆ (3/5) | Đẹp, chức năng cơ bản ổn; thiếu Editor nội dung câu hỏi |
| Năng lực Quản lý Nội dung | ⭐⭐☆☆☆ (2/5) | **Điểm yếu lớn nhất** — không sửa được câu hỏi trực tiếp |
| Tích hợp Trang làm bài | ⭐⭐⭐⭐☆ (4/5) | Hầu hết trang đọc đúng `durationMinutes` từ DB |
| Độ ổn định & An toàn | ⭐⭐⭐⭐☆ (4/5) | JWT guard, Role guard, Audit log, Confirm delete |
| **TỔNG** | **⭐⭐⭐☆☆ (3.4/5)** | Nền tảng tốt, cần bổ sung Question Editor |

---

## ✅ ĐIỂM MẠNH — Những gì đang hoạt động tốt

### 1. Kiến trúc Backend sạch & đầy đủ
- **CRUD đầy đủ** cho Exam: Create, Read (list + detail), Update (patch), Delete, Duplicate.
- **Audit Trail toàn diện**: Mọi hành động tạo/sửa/xóa/nhân bản đề thi đều được ghi vào `auditService` với actor, timestamp, oldValue, newValue.
- **Prisma ORM** với Cascade Delete — khi xóa đề thi, tất cả Parts và Questions tự động xóa theo.
- **Security tốt**: Tất cả `/admin/*` routes đều được bảo vệ bởi `authGuard` + `roleGuard(['ADMIN'])`.
- **Không để lộ đáp án**: Hàm `getExamQuestions` loại bỏ trường `explanation` cho READING, LISTENING, FULL_TEST trước khi trả về cho học viên.

### 2. Admin UI — Chức năng vận hành cơ bản hoạt động ốt
- **Toggle tức thì**: Bật/Tắt xuất bản (`isPublished`) và chuyển VIP/Free (`isPro`) trực tiếp trên bảng, có Optimistic Update — UX mượt mà.
- **Nhân bản đề thi (Duplicate)**: Clone đầy đủ cả Parts + Questions sang đề mới. Tiện khi cần tạo biến thể đề thi.
- **Xem trước cấu trúc (Preview)**: Modal tóm tắt nhanh thông tin đề trước khi vào làm bài.
- **Nhập JSON**: Có thể import đề thi phức tạp với cấu trúc đầy đủ qua định dạng JSON.
- **KPI Metrics strip**: Tổng đề, Full Test, VIP PRO, lượt thi — có thể thu gọn/mở rộng theo nhu cầu.
- **Phân trang + Sắp xếp cột**: Click tiêu đề cột để sort theo bất kỳ trường nào.
- **Quick Edit**: Sửa nhanh 6 trường: Tên, Mô tả, Kỹ năng, Thời lượng, isPro, isPublished.

### 3. Tích hợp Thời gian làm bài
| Trang | Nguồn thời gian |
| :--- | :--- |
| **Thi thử tổng hợp** `/thi-thu/[id]` | ✅ Database `duration_minutes`. Đồng bộ server qua Heartbeat 30s. Tự nộp khi hết giờ. |
| **Reading** `/reading/[id]` | ✅ Database `duration_minutes` (fallback 35 phút) |
| **Writing** `/writing/[id]` | ✅ Theo từng Part (3p/7p/10p/20p) — chuẩn British Council format |
| **Speaking** `/speaking/[id]` | ✅ Theo từng câu: Prep Time + Speak Time (chuẩn BC format) |
| **Listening** `/listening/[id]` | ⚠️ Cứng 40 phút — **chưa đọc từ DB** |

---

## ❌ ĐIỂM YẾU NGHIÊM TRỌNG — Cần xử lý ngay

### 🔴 VẤN ĐỀ 1: Không thể sửa nội dung câu hỏi trực tiếp trên Admin
**Mức độ: CRITICAL — Ảnh hưởng vận hành hàng ngày**

Hiện tại, sau khi đề thi đã được tạo và lưu vào database, **người vận hành không có cách nào** sửa:
- Nội dung câu hỏi (`prompt`)
- Danh sách đáp án (`options`)
- Đáp án đúng (`correct_answer`)
- Lời giải thích (`explanation`)
- Điểm tối đa (`max_score`)
- Đoạn văn bản (`passage_text`), file nghe (`audio_url`), hình ảnh (`image_url`) của từng Part

**Hậu quả thực tế:**
- Phát hiện câu hỏi sai → phải vào Database server sửa thủ công bằng SQL
- Muốn thêm/bớt câu hỏi → phải xóa đề + tạo lại từ JSON
- Rủi ro cao khi vận hành vì non-technical staff không làm được

**Backend API cũng thiếu** các endpoint:
```
PATCH /admin/exams/:id/parts/:partId         → Sửa Part (passage, audio, image, instructions)
PATCH /admin/exams/:id/questions/:questionId  → Sửa 1 câu hỏi
POST  /admin/exams/:id/parts/:partId/questions → Thêm câu hỏi vào Part
DELETE /admin/questions/:questionId            → Xóa 1 câu hỏi
```

---

### 🔴 VẤN ĐỀ 2: Listening — Thời gian không đọc từ Database
**Mức độ: HIGH**

Trang `/listening/[id]` hiện set cứng `40 * 60` giây thay vì đọc `res.data.duration_minutes` từ API.

```typescript
// BUG: listening/[id]/page.tsx dòng 316
const [timeLeft, setTimeLeft] = useState(40 * 60); // ← Cứng 40 phút

// Trong useEffect load dữ liệu:
setExamData((prev) => ({
  ...prev,
  title: res.data.title || prev.title,
  durationMinutes: res.data.duration_minutes || 40, // ← Lưu nhưng không dùng!
}));
```

Ngay cả khi Admin sửa thời lượng bài Listening thành 45 phút, trang thi vẫn đếm 40 phút.

---

### 🟡 VẤN ĐỀ 3: Wizard tạo đề thi quá đơn giản
**Mức độ: MEDIUM**

Wizard 2 bước hiện chỉ cho phép tạo 1 Part + 1 câu hỏi mẫu. Sau khi tạo, người vận hành phải dùng JSON Import để thêm nội dung thực tế. Workflow này không thân thiện với người không biết JSON.

---

### 🟡 VẤN ĐỀ 4: Không có Batch Update / Sort theo độ phổ biến
**Mức độ: LOW-MEDIUM**

- Không thể chọn nhiều đề để Xuất bản hàng loạt / Ẩn hàng loạt
- Không lọc được theo trạng thái (Đã xuất bản / Bản nháp / Chưa có câu hỏi)
- Không có cột "Tỉ lệ hoàn thành" hay "Điểm trung bình" của học viên

---

## 🗺️ LỘ TRÌNH CẢI TIẾN ĐỀ XUẤT

### 🚀 Ưu tiên 1 (Làm ngay — Tác động cao nhất)
**Xây dựng Exam & Question Editor đầy đủ**

```
Backend:
  ✦ PATCH /admin/exams/:id/parts/:partId       — Sửa Part
  ✦ POST  /admin/exams/:id/parts              — Thêm Part mới
  ✦ DELETE /admin/parts/:partId               — Xóa Part
  ✦ PATCH /admin/questions/:questionId        — Sửa câu hỏi
  ✦ POST  /admin/parts/:partId/questions      — Thêm câu hỏi
  ✦ DELETE /admin/questions/:questionId       — Xóa câu hỏi
  ✦ PATCH /admin/questions/reorder            — Sắp xếp lại thứ tự câu

Frontend Admin:
  ✦ Trang /admin/exams/[id]/edit — Trang chỉnh sửa đề thi đầy đủ
  ✦ Accordion từng Part với danh sách câu hỏi
  ✦ Form inline sửa từng câu hỏi
  ✦ Upload Audio/Image trực tiếp từ giao diện
  ✦ Add/Remove Part và Question với drag-to-reorder
```

### 🔧 Ưu tiên 2 (Sửa lỗi — Listening Timer)
```typescript
// Sửa listening/[id]/page.tsx
const [timeLeft, setTimeLeft] = useState(40 * 60);

// Trong useEffect sau khi load API:
setTimeLeft((res.data.duration_minutes || 40) * 60);
```

### 📋 Ưu tiên 3 (Cải tiến UX)
- Thêm filter "Trạng thái" (Xuất bản / Bản nháp / Chưa có câu hỏi)
- Batch action: Chọn nhiều đề → Xuất bản / Ẩn hàng loạt
- Column "Đề chưa có câu hỏi" để cảnh báo

---

## 📋 HƯỚNG DẪN VẬN HÀNH HIỆN TẠI (Cho người quản trị)

### Tạo đề thi mới
| Phương pháp | Khi nào dùng | Độ phức tạp |
| :--- | :--- | :--- |
| **Nhập JSON** | Đề đã có sẵn nội dung đầy đủ | Trung bình — cần biết cấu trúc JSON |
| **Wizard 2 bước** | Tạo đề rỗng, sau đó bổ sung qua SQL | Đơn giản |
| **Duplicate + chỉnh sửa** | Tạo biến thể từ đề thi có sẵn | Đơn giản |

### Cấu trúc JSON chuẩn để nhập đề thi
```json
{
  "title": "Aptis Reading Practice 03",
  "skill": "READING",
  "durationMinutes": 35,
  "isPro": false,
  "description": "Đề thi đọc hiểu chuẩn British Council",
  "parts": [
    {
      "partNumber": 1,
      "title": "Part 1 - Word Gap Fill",
      "instructions": "Choose the word that best fits the gap.",
      "passageText": "",
      "questions": [
        {
          "questionNumber": 1,
          "questionType": "MULTIPLE_CHOICE",
          "prompt": "I [gap] to school every morning.",
          "options": ["walk", "walking", "walked"],
          "correctAnswer": "walk",
          "explanation": "Simple present tense for habitual action.",
          "maxScore": 1.0
        }
      ]
    }
  ]
}
```

### Sửa đề thi đang tồn tại
1. **Sửa thông tin cơ bản** (tên, mô tả, thời lượng, kỹ năng, VIP/Free): Bấm icon **Bút** trên bảng danh sách.
2. **Thêm/sửa câu hỏi**: *(Chưa có — cần Ưu tiên 1 ở trên)*. Tạm thời: Nhân bản (Clone) đề → Xóa đề cũ → Import JSON mới.
3. **Ẩn/Hiện đề thi**: Click trực tiếp vào nút "Xuất bản" / "Bản nháp" trên bảng.

---

## 🏁 KẾT LUẬN

Bộ quản lý đề thi hiện tại có **nền tảng kỹ thuật vững chắc** — kiến trúc sạch, bảo mật tốt, audit log đầy đủ. Tuy nhiên, **giá trị vận hành thực tế còn hạn chế** vì thiếu khả năng chỉnh sửa nội dung câu hỏi trực tiếp.

Để hệ thống có thể giao cho **người vận hành không có kỹ thuật** sử dụng độc lập, cần ưu tiên xây dựng **Exam Content Editor** (Ưu tiên 1) trong bước phát triển tiếp theo.

> 💡 **Gợi ý cho bước tiếp theo:** Tôi có thể xây dựng ngay trang `/admin/exams/[id]/edit` với đầy đủ khả năng chỉnh sửa Parts và Câu hỏi kèm Backend API tương ứng. Hãy xác nhận nếu bạn muốn tiến hành!
