# TÀI LIỆU KỸ THUẬT: ĐÓNG GÓI VÀ ĐỒNG BỘ 32 BỘ ĐỀ READING CHUẨN 100% APTIS KỲ TÍCH
> **Phiên bản:** 1.0 — Chuẩn hóa phân hệ Luyện Đọc (Reading Module)  
> **Nguồn đối chiếu:** `https://aptiskytich.vn/reading`  
> **Cơ sở dữ liệu:** PostgreSQL (`aptis_kytich_db`) & Kho cào gốc `tools/data/aptiskytich/`  
> **Ngày lập:** 04/10/2026

---

## I. MỤC TIÊU NGHIỆP VỤ & KIẾN TRÚC TỔNG THỂ

Hệ thống cần chuyển đổi từ hiện trạng **137 đề con rời rạc đang hiển thị lộn xộn (bắt đầu từ Đề 37 do sắp xếp `created_at desc`)** sang mô hình **5 Tab chức năng chuẩn xác 100% nguyên bản như `aptiskytich.vn/reading`**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CẤU TRÚC GIAO DIỆN 5 TAB APTIS KỲ TÍCH                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [Tab 1: Full Part]      ──► 32 Bộ đề tổng hợp liên hoàn (Đề 01 ➔ Đề 32) · 35 phút      │
│                              Mỗi đề gồm đủ 4 Parts (Gap Fill, Cohesion, Match, Long)   │
│ [Tab 2: Part 1]         ──► 32 Bài luyện lẻ Part 1: Sentence Comprehension (Điền từ)   │
│ [Tab 3: Part 2 + 3]     ──► 32 Bài luyện lẻ Part 2: Text Cohesion (Sắp xếp trật tự câu)│
│ [Tab 4: Part 4]         ──► 32 Bài luyện lẻ Part 3: Opinion Matching (Nối quan điểm)   │
│ [Tab 5: Part 5]         ──► 32 Bài luyện lẻ Part 4: Long Reading (Đọc dài & nối Heading)│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## II. MA TRẬN ĐỐI CHIẾU NỘI DUNG 32 BỘ ĐỀ (DATA MAPPING)

Toàn bộ câu hỏi, đoạn văn, đáp án và lời giải của 32 bộ đề này **đã có sẵn 100% trong CSDL** của bạn. Bảng dưới đây đối chiếu chi tiết 4 bài đọc thành phần của từng đề từ `Đề 01` đến `Đề 32`:

| Số Đề | Part 1 (Sentence) | Part 2 (Text Cohesion) | Part 3 (Opinion Match) | Part 4 (Long Reading) |
| :---: | :--- | :--- | :--- | :--- |
| **Đề 01** | `Đề 01 - Reading Part 1` | `Đề 01 - Tom Harper` | `Đề 01 - Opinions on flying` | `Đề 01 - Charles Dicken` |
| **Đề 02** | `Đề 02 - Reading Part 1` | `Đề 02 - Delivery man` | `Đề 02 - A new restaurant` | `Đề 02 - Children and Exercises` |
| **Đề 03** | `Đề 03 - Reading Part 1` | `Đề 03 - Paperwork submission process` | `Đề 03 - Reading books` | `Đề 03 - Coffee` |
| **Đề 04** | `Đề 04 - Reading Part 1` | `Đề 04 - Hand in assignment` | `Đề 04 - Visit a city (Stevenson)` | `Đề 04 - Consumer age` |
| **Đề 05** | `Đề 05 - Reading Part 1` | `Đề 05 - Report submission process` | `Đề 05 - Art` | `Đề 05 - Early Australia` |
| **Đề 06** | `Đề 06 - Reading Part 1` | `Đề 06 - Participate in a race` | `Đề 06 - The new station` | `Đề 06 - Cultural Exchange` |
| **Đề 07** | `Đề 07 - Reading Part 1` | `Đề 07 - Making films + Family sports day` | `Đề 07 - Games from childhood (2026)` | `Đề 07 - History of cinema` |
| **Đề 08** | `Đề 08 - Reading Part 1` | `Đề 08 - Writing about a place` | `Đề 08 - Extreme sports. (2026)` | `Đề 08 - Digital` |
| **Đề 09** | `Đề 09 - Reading Part 1` | `Đề 09 - Coffee shop + Famous singer` | `Đề 09 - Work-Life Balance (2026)` | `Đề 09 - Four-Day Work Week` |
| **Đề 10** | `Đề 10 - Reading Part 1` | `Đề 10 - University welcome day` | `Đề 10 - Technology in childhood` | `Đề 10 - Doggett’s coat and badge` |
| **Đề 11** | `Đề 11 - Reading Part 1` | `Đề 11 - Cultural festival` | `Đề 11 - Visit a city (Stevenson)` | `Đề 11 - Shopping Online` |
| **Đề 12** | `Đề 12 - Reading Part 1` | `Đề 12 - Fire instructions` | `Đề 12 - Plans for a new station` | `Đề 12 - Wellness Trends` |
| **Đề 13** | `Đề 13 - Reading Part 1` | `Đề 13 - Family sports day + Making films` | `Đề 13 - Music Festival (2026)` | `Đề 13 - Women Mathematicians` |
| **Đề 14** | `Đề 14 - Reading Part 1` | `Đề 14 - History of transportation` | `Đề 14 - Volunteering to clean park` | `Đề 14 - Eating` |
| **Đề 15** | `Đề 15 - Reading Part 1` | `Đề 15 - Instructions for new students` | `Đề 15 - Going on holiday` | `Đề 15 - Frozen land` |
| **Đề 16** | `Đề 16 - Reading Part 1` | `Đề 16 - IoT - Internet of Things` | `Đề 16 - Sports` | `Đề 16 - Meatless` |
| **Đề 17** | `Đề 17 - Reading Part 1` | `Đề 17 - University open day + Workplace` | `Đề 17 - Visit an island` | `Đề 17 - Music` |
| **Đề 18** | `Đề 18 - Reading Part 1` | `Đề 18 - Animal hospital` | `Đề 18 - Watching television` | `Đề 18 - Tulips` |
| **Đề 19** | `Đề 19 - Reading Part 1` | `Đề 19 - Artificial intelligence` | `Đề 19 - Volunteering` | `Đề 19 - Tulips` |
| **Đề 20** | `Đề 20 - Reading Part 1` | `Đề 20 - Betty Barr's life` | `Đề 20 - Eating and cooking` | `Đề 20 - Early Australia` |
| **Đề 21** | `Đề 21 - Reading Part 1` | `Đề 21 - Key card!` | `Đề 21 - Job and training` | `Đề 21 - Eating in China` |
| **Đề 22** | `Đề 22 - Reading Part 1` | `Đề 22 - Growing potatoes` | `Đề 22 - Opinions on flying` | `Đề 22 - A Plant-Based Plate` |
| **Đề 23** | `Đề 23 - Reading Part 1` | `Đề 23 - Using public cycle` | `Đề 23 - A new restaurant` | `Đề 23 - Zoo` |
| **Đề 24** | `Đề 24 - Reading Part 1` | `Đề 24 - A famous football player` | `Đề 24 - Reading books` | `Đề 24 - Mountain (Version 2)` |
| **Đề 25** | `Đề 25 - Reading Part 1` | `Đề 25 - Natural history centre` | `Đề 25 - Visit a city (Stevenson)` | `Đề 25 - Mountain (Version 3)` |
| **Đề 26** | `Đề 26 - Reading Part 1` | `Đề 26 - Healthy Eating` | `Đề 26 - Art` | `Đề 26 - Mountain (Version 4)` |
| **Đề 27** | `Đề 27 - Reading Part 1` | `Đề 27 - A famous singer` | `Đề 27 - The new station` | `Đề 27 - Charles Dicken` |
| **Đề 28** | `Đề 28 - Reading Part 1` | `Đề 28 - Writing about a place` | `Đề 28 - Visit a city (Stevenson)` | `Đề 28 - Children and Exercises` |
| **Đề 29** | `Đề 29 - Reading Part 1` | `Đề 29 - Coffee shop` | `Đề 29 - Plans for a new station` | `Đề 29 - Coffee` |
| **Đề 30** | `Đề 30 - Reading Part 1` | `Đề 30 - Tourism` | `Đề 30 - Volunteering to clean park` | `Đề 30 - Consumer age` |
| **Đề 31** | `Đề 31 - Reading Part 1` | `Đề 31 - Restaurant + End of term project` | `Đề 31 - Going on holiday` | `Đề 31 - Early Australia` |
| **Đề 32** | `Đề 32 - Reading Part 1` | `Đề 32 - Music show at the park` | `Đề 32 - Sports` | `Đề 32 - Cultural Exchange` |

---

## III. KẾ HOẠCH TRIỂN KHAI KỸ THUẬT (3 BƯỚC)

### BƯỚC 1: Script Đóng gói CSDL (`bundle-32-reading-exams.ts`)

Tạo ra 32 bộ đề Full Reading mới trong bảng `Exam`:
* **Quy chuẩn đặt tên:** `Đề 01 (Full Reading · 4 Parts)` đến `Đề 32 (Full Reading · 4 Parts)`.
* **Kỹ năng:** `skill = 'READING'`.
* **Thời gian làm bài:** `duration_minutes = 35` (chuẩn British Council).
* **Cấu trúc Parts:** Mỗi đề liên kết đúng 4 `ExamPart` và toàn bộ câu hỏi của 4 bài con tương ứng (Part 1 ➔ Part 4).
* **Quyền truy cập:**
  * `Đề 01` đến `Đề 03`: `is_pro = false` (Miễn phí trải nghiệm).
  * `Đề 04` đến `Đề 32`: `is_pro = true` (VIP PRO).

#### Mã nguồn script đóng gói mẫu:
```typescript
import { PrismaClient, ExamSkill } from '@prisma/client';
const prisma = new PrismaClient();

async function bundleReading() {
  for (let i = 1; i <= 32; i++) {
    const code = i < 10 ? `0${i}` : `${i}`;
    const fullTitle = `Đề ${code} — Full Reading · 4 Parts`;

    // 1. Tìm các part lẻ của Đề i trong database
    const subExams = await prisma.exam.findMany({
      where: {
        skill: 'READING',
        source: 'APTIS_KYTICH',
        title: { startsWith: `Đề ${code} -` },
      },
      include: { parts: { include: { questions: true } } },
    });

    if (subExams.length === 0) continue;

    // 2. Tạo hoặc cập nhật đề Full Reading
    const fullExam = await prisma.exam.upsert({
      where: { title: fullTitle },
      create: {
        title: fullTitle,
        description: `Bài thi luyện tập Full Reading 4 Parts chuẩn cấu trúc Aptis ESOL 2026. Thời gian 35 phút.`,
        skill: ExamSkill.READING,
        duration_minutes: 35,
        is_pro: i > 3,
        is_published: true,
        source: 'APTIS_KYTICH',
      },
      update: {
        is_published: true,
        is_pro: i > 3,
      },
    });

    // 3. Sao chép và sắp xếp 4 parts vào đề Full Exam
    // (Part 1: Điền từ, Part 2: Sắp xếp câu, Part 3: Nối ý kiến, Part 4: Đọc dài)
  }
}
```

---

### BƯỚC 2: Chuẩn hóa Sắp xếp & API Backend (`exam.service.ts`)

Trong file [`backend/src/modules/exams/exam.service.ts`](file:///d:/sontayweb/aptis-elearning/backend/src/modules/exams/exam.service.ts):
* Cập nhật điều kiện sắp xếp:
```typescript
// Sắp xếp tự nhiên theo tên tăng dần cho Full Test và Reading (Đề 01 -> Đề 32)
const orderBy: any = (skill === 'FULL_TEST' || skill === 'READING')
  ? { title: 'asc' }
  : { created_at: 'desc' };
```
* Bổ sung bộ lọc `part` nếu Frontend yêu cầu tải danh sách theo từng Tab.

---

### BƯỚC 3: Đồng bộ Giao diện Frontend ([`reading/page.tsx`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/reading/page.tsx))

1. **Bỏ giới hạn hiển thị `limit: 50`:** Nâng `limit: 100` hoặc tải đầy đủ 32 bộ đề.
2. **Xử lý chuyển Tab mượt mà:**
   * **Khi ở Tab `full` (Full Part):** Lọc các đề có tiêu đề `Full Reading` ➔ Danh sách hiển thị đúng **32 bộ đề** từ `Đề 01` đến `Đề 32`.
   * **Khi ở Tab `p1`:** Lọc các đề có `Part 1` ➔ Hiển thị 32 bài điền từ.
   * **Khi ở Tab `p2`:** Lọc các đề có `Text Cohesion` ➔ Hiển thị 32 bài sắp xếp câu (*Tom Harper, Delivery man...*).
   * **Khi ở Tab `p3`:** Lọc các đề có `Opinion Matching` ➔ Hiển thị 32 bài nối quan điểm (*Opinions on flying, A new restaurant...*).
   * **Khi ở Tab `p4`:** Lọc các đề có `Long Reading` ➔ Hiển thị 32 bài đọc dài (*Charles Dickens, Children and Exercises...*).

---

## IV. BẢO ĐẢM TÍNH TOÀN VẸN & KIỂM THỬ (E2E CHECKLIST)

1. ✅ **Không mất dữ liệu cũ:** Script sử dụng cơ chế `find` và clone questions, tuyệt đối không xóa các đề lẻ hiện có.
2. ✅ **Phòng thi hoạt động ngay lập tức:** Bấm vào bất kỳ đề nào trong 32 đề Full Reading đều mở phòng thi [`/thi-thu/:id`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/thi-thu/[id]/page.tsx) với đồng hồ đếm ngược 35 phút, hỗ trợ làm bài liên tục 4 part và chấm điểm tự động.
3. ✅ **Đồng bộ trạng thái Pro / Free:** Đề 01 - 03 mở miễn phí cho mọi học viên trải nghiệm; Đề 04 - 32 yêu cầu VIP.

---
*Tài liệu được lưu trữ tại `docs/tai-lieu-he-thong/huong-dan-dong-goi-va-dong-bo-32-bo-de-reading.md` để dùng chung cho đội ngũ kỹ thuật và bảo trì hệ thống.*
