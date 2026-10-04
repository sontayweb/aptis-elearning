# HƯỚNG DẪN VẬN HÀNH & BỔ SUNG DỮ LIỆU HỆ THỐNG
**Dự án**: APTIS ESOL PREMIER  
**Tài liệu dành cho**: Quản trị viên, Giảng viên chuyên môn và Lập trình viên  
**Mục đích**: Hướng dẫn chi tiết cách bổ sung học liệu, video bài giảng, câu luyện nghe chép, bài viết mẹo thi và cấu hình hệ thống khi vận hành thực tế mà không lo lỗi code.

---

## 📑 MỤC LỤC
1. [Bổ sung Tài liệu PDF & Ebook vào Kho tài liệu](#1-bổ-sung-tài-liệu-pdf--ebook)
2. [Thêm Video bài giảng vào Kho học liệu](#2-thêm-video-bài-giảng-vào-kho-học-liệu)
3. [Thêm câu luyện Nghe chép chính tả (Dictation)](#3-thêm-câu-luyện-nghe-chép-chính-tả-dictation)
4. [Cập nhật Bài viết Mẹo thi & Blog](#4-cập-nhật-bài-viết-mẹo-thi--blog)
5. [Cấu hình Chương trình Giới thiệu (Referral)](#5-cấu-hình-chương-trình-giới-thiệu-referral)
6. [Cập nhật Thông tin Liên hệ, Hotline, Zalo & Fanpage](#6-cập-nhật-thông-tin-liên-hệ-hotline-zalo--fanpage)
7. [Checklist chuẩn bị biến môi trường khi Deploy Go-Live](#7-checklist-chuẩn-bị-biến-môi-trường-khi-deploy-go-live)

---

## 1. BỔ SUNG TÀI LIỆU PDF & EBOOK
- **File quản lý dữ liệu**: [`frontend/src/data/documents-data.ts`](file:///d:/sontayweb/aptis-elearning/frontend/src/data/documents-data.ts)
- **Giao diện hiển thị**: [`frontend/src/app/tai-lieu/page.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/tai-lieu/page.tsx) (Route `/tai-lieu`)

### Cách thực hiện:
Mở file [`documents-data.ts`](file:///d:/sontayweb/aptis-elearning/frontend/src/data/documents-data.ts), tìm mảng `DOCUMENTS_DATA` và thêm một khối đối tượng mới vào mảng:

```typescript
{
  id: "doc-7",                                            // ID duy nhất không trùng lặp
  title: "Bộ đề Key Dự Đoán Trúng Tủ Tháng 11/2026",     // Tên tài liệu
  category: "PDF",                                        // Phân loại: 'PDF' | 'EBOOK' | 'HANDBOOK'
  skill: "ALL",                                           // Kỹ năng: 'ALL' | 'SPEAKING' | 'WRITING' | 'READING' | 'LISTENING' | 'GRAMMAR'
  targetBand: "B2",                                       // Mục tiêu: 'B1' | 'B2' | 'C' | 'ALL'
  pages: 180,                                             // Số trang tài liệu
  fileSize: "18.5 MB",                                    // Dung lượng file hiển thị
  downloadsCount: 1250,                                   // Số lượt tải hiển thị
  isVip: true,                                            // true: Khóa yêu cầu tài khoản VIP; false: Miễn phí
  description: "Tổng hợp các đề thi xuất hiện nhiều nhất trong các đợt thi tháng gần đây kèm đáp án chi tiết.",
  downloadUrl: "https://your-domain.com/downloads/de-key-t11.pdf", // Link tải file thực tế (Google Drive / S3 / VPS)
},
```

> 💡 **Mẹo tải file**: Bạn có thể upload file PDF lên Google Drive (chọn chế độ "Bất kỳ ai có đường liên kết đều có thể xem"), sau đó dán link tải trực tiếp vào `downloadUrl`.

---

## 2. THÊM VIDEO BÀI GIẢNG VÀO KHO HỌC LIỆU
- **File quản lý dữ liệu**: [`frontend/src/data/documents-data.ts`](file:///d:/sontayweb/aptis-elearning/frontend/src/data/documents-data.ts)
- **Mảng dữ liệu**: `VIDEOS_DATA`

### Cách thực hiện:
Thêm một đối tượng video vào mảng `VIDEOS_DATA`:

```typescript
{
  id: "vid-5",
  title: "Hướng dẫn giải Part 4 Writing: Thư phàn nàn dịch vụ khách hàng",
  speaker: "Thầy Hưng (Band C1 Aptis)",
  duration: "25:30",                                      // Thời lượng video
  skill: "WRITING",                                       // Kỹ năng: 'SPEAKING' | 'WRITING' | 'READING' | 'LISTENING' | 'GRAMMAR'
  targetBand: "C",                                        // Mục tiêu: 'B1' | 'B2' | 'C' | 'ALL'
  views: 3200,                                            // Số lượt xem
  description: "Phân tích cấu trúc 3 đoạn thư trang trọng, các mẫu câu thể hiện sự bất bình lịch sự và yêu cầu bồi thường.",
  videoEmbedId: "dQw4w9WgXcQ",                            // MÃ ID CỦA VIDEO YOUTUBE (sau v=)
},
```

---

## 3. THÊM CÂU LUYỆN NGHE CHÉP CHÍNH TẢ (DICTATION)
- **File quản lý dữ liệu**: [`frontend/src/data/dictation-data.ts`](file:///d:/sontayweb/aptis-elearning/frontend/src/data/dictation-data.ts)
- **Giao diện hiển thị**: [`frontend/src/app/nghe-chep/page.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/nghe-chep/page.tsx) (Route `/nghe-chep`)

### Nguyên lý hoạt động:
Hệ thống sử dụng **Web Speech API** của trình duyệt để tự động phát âm chuẩn giọng Anh - Anh / Anh - Mỹ mà **không cần ghi âm hay cắt audio thủ công**.

### Cách thực hiện:
Chọn cấp độ phù hợp trong `DEFAULT_DICTATION_SENTENCES`:
- `foundation`: Câu ngắn, từ vựng cơ bản (chuẩn B1, Part 1)
- `momentum`: Câu ghép, độ dài trung bình (chuẩn B2, Part 2 & 3)
- `mastery`: Câu phức học thuật (chuẩn C1, Part 3 & 4)

Ví dụ thêm câu mới vào `foundation`:
```typescript
{
  id: "f-6",
  level: "Level 1 - Foundation",
  topic: "Đề 26 - Part 1 - Bài 04",
  originalText: "The library is closed on public holidays.", // Câu tiếng Anh chuẩn học viên cần gõ đúng
  hint: "library / closed / holidays",                      // Từ khóa gợi ý nếu học viên bấm nút trợ giúp
  audioTime: "00:03",                                       // Thời lượng ước tính
},
```

---

## 4. CẬP NHẬT BÀI VIẾT MẸO THI & BLOG
- **Trang mẹo thi tổng hợp**: [`frontend/src/app/meo-thi-aptis/page.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/meo-thi-aptis/page.tsx)
- **Sidebar rút gọn**: [`frontend/src/components/tips-section.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/components/tips-section.tsx)

### Bổ sung chiến thuật cho kỹ năng trong `page.tsx`:
Tìm mảng `skillTips` trong `frontend/src/app/meo-thi-aptis/page.tsx`:
```typescript
{
  skill: "Listening",
  icon: Headphones,
  color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  title: "Chiến thuật làm bài Nghe 25 câu trong 55 phút",
  bullets: [
    "Part 1: Đọc nhanh 4 đáp án trước khi bấm nghe để định hình từ khóa.",
    "Part 2: Chú ý giọng điệu thể hiện quan điểm đồng tình hay phản đối.",
    "Part 3: 2 người nói 4 câu hỏi - luôn bám sát bảng câu hỏi.",
  ],
  link: "/listening",
}
```

---

## 5. CẤU HÌNH CHƯƠNG TRÌNH GIỚI THIỆU (REFERRAL)
- **Trang giao diện**: [`frontend/src/app/gioi-thieu/page.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/gioi-thieu/page.tsx) (Route `/gioi-thieu`)
- **Component thẻ quà**: [`frontend/src/components/referral-gift-card.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/components/referral-gift-card.tsx)

### Tùy chỉnh mức chiết khấu / ưu đãi:
Mở [`frontend/src/app/gioi-thieu/page.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/gioi-thieu/page.tsx) để chỉnh sửa:
- Mức giảm giá bạn bè: mặc định 10% (có thể nâng lên 15% hoặc 20% trong các đợt khuyến mãi).
- Quà tặng người giới thiệu: hoa hồng hoặc số lượt chấm AI (`ai_quota_left`).

---

## 6. CẬP NHẬT THÔNG TIN LIÊN HỆ, HOTLINE, ZALO & FANPAGE

| Hạng mục | Vị trí file cần sửa | Giá trị hiện tại |
| :--- | :--- | :--- |
| **Hotline hỗ trợ** | [`backend/src/modules/cms/cms.service.ts:L73`](file:///d:/sontayweb/aptis-elearning/backend/src/modules/cms/cms.service.ts#L73) | `0379 866 596` |
| **Email trung tâm** | [`backend/src/modules/cms/cms.service.ts:L74`](file:///d:/sontayweb/aptis-elearning/backend/src/modules/cms/cms.service.ts#L74) | `aptiskytich.admin@gmail.com` |
| **Link Zalo Admin VIP** | [`backend/src/modules/cms/cms.service.ts:L76`](file:///d:/sontayweb/aptis-elearning/backend/src/modules/cms/cms.service.ts#L76) | `https://zalo.me/0867833227` |
| **Fanpage Facebook** | [`frontend/src/components/footer.tsx:L170`](file:///d:/sontayweb/aptis-elearning/frontend/src/components/footer.tsx#L170) & [`floating-actions.tsx:L42`](file:///d:/sontayweb/aptis-elearning/frontend/src/components/floating-actions.tsx#L42) | `https://www.facebook.com/Aptiskytich` |

---

## 7. CHECKLIST CHUẨN BỊ BIẾN MÔI TRƯỜNG KHI DEPLOY GO-LIVE

Khi triển khai hệ thống lên máy chủ chính thức (VPS Ubuntu, Vercel, hoặc Docker):

### File `.env` Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-domain.com

# CSDL PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/aptis_db?schema=public"

# Bảo mật JWT
JWT_SECRET="Chuoi_Bao_Mat_Sieu_Dai_Toi_Thieu_32_Ky_Tu"
JWT_REFRESH_SECRET="Chuoi_Bao_Mat_Refresh_Token_Dai"

# Cổng thanh toán SePay
SEPAY_API_KEY="your_sepay_api_token"
SEPAY_WEBHOOK_KEY="your_sepay_webhook_secret"

# Khóa AI Chấm thi (OpenAI GPT-4o / Whisper)
OPENAI_API_KEY="sk-..."
```

### File `.env` Frontend (`frontend/.env.local` hoặc `.env.production`):
```env
# Đổi localhost thành domain backend chính thức
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
NODE_ENV=production
```

> ⚠️ **LƯU Ý QUAN TRỌNG VỀ BẢO MẬT**:  
> Khi `NODE_ENV=production`, hệ thống sẽ **tự động ẩn toàn bộ 4 nút đăng nhập nhanh (Quick Login)** trên modal và các trang quản trị, bảo đảm an toàn tuyệt đối cho tài khoản Giảng viên và Quản trị viên tối cao!
