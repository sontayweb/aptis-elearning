# BÁO CÁO ĐÁNH GIÁ HIỆN TRẠNG & KẾ HOẠCH CẢI THIỆN HỆ THỐNG APTIS KỲ TÍCH

> **Tài liệu đặc tả kỹ thuật và kế hoạch hành động theo yêu cầu "Cải Thiện Web TA"**  
> **Thời gian cập nhật:** 10/10/2026  
> **Phiên bản:** v1.0.0 — Chuẩn bị Go-Live  
> **Mức độ đáp ứng tổng thể hiện tại:** **~45% – 50%**

---

## 1. TỔNG QUAN ĐÁNH GIÁ (EXECUTIVE SUMMARY)

Hệ thống **Aptis Kỳ Tích** hiện đã hoàn thành vững chắc toàn bộ **khung kiến trúc nền tảng**:
- Cơ sở dữ liệu Prisma ORM đa người dùng, phân quyền RBAC (Student, Teacher, Admin, Super Admin).
- API đăng ký, đăng nhập JWT, thanh toán SePay, nạp VIP, hạn ngạch AI Quota.
- Bộ máy chấm điểm AI (Whisper Speech-to-Text, OpenAI GPT-4o đánh giá CEFR).
- Giao diện phòng thi riêng biệt chuẩn British Council (Sticky Top Exam Header, Timer, Audio Recorder, Bảng Kỳ Tích Pro).

Tuy nhiên, đối chiếu với các yêu cầu thực chiến chi tiết trong bản **"Cải Thiện Web TA"**, hệ thống cần được nâng cấp các **tính năng tương tác chuyên sâu** (Highlight text, bảng từ vựng cạnh tranh, form tách 2 email, audio script, mã code Pro Go-Live) và **chuẩn hóa dữ liệu đề thi theo từng Part**.

---

## 2. BẢNG MA TRẬN ĐỐI SOÁT CHI TIẾT (FEATURE SCORECARD)

| Hạng mục | Yêu cầu chi tiết | Trạng thái kỹ thuật hiện tại | File mã nguồn liên quan | Đánh giá |
| :--- | :--- | :--- | :--- | :---: |
| **I. Yêu cầu chung** | Mã CODE kích hoạt PRO Free 14–20 ngày | Đã có Model `PromotionCode`, `PromotionRedemption`, API `POST /api/payment/redeem-code` và form tại `/pricing`. **Chưa seed mã cụ thể (vd: `GOLIVE14`) vào DB và chưa có Banner/Popup thông báo.** | `backend/src/modules/payment/payment.service.ts`<br>`frontend/src/app/pricing/page.tsx` | **70%** |
| | Thi thử Full Test 4 kỹ năng | Đã có route `/thi-thu/[id]`, nhưng luồng liên hoàn tự động chuyển tiếp giữa 4 kỹ năng (Grammar → Reading → Listening → Writing → Speaking) và tổng hợp điểm CEFR Overall chưa trọn vẹn. | `frontend/src/app/thi-thu/[id]/page.tsx` | **60%** |
| **I. Dashboard** | Ảnh FB của học viên | Đang chờ file ảnh/asset từ chủ dự án để nhúng vào feed vinh danh. | `frontend/src/app/dashboard/page.tsx` | **0%** *(Chờ asset)* |
| | Lịch khai giảng click hiện chi tiết | Đã có card hiển thị khóa học, nhưng click vào ngày khai giảng chưa bật popover/modal chi tiết lịch học & quyền lợi. | `frontend/src/app/dashboard/page.tsx` | **30%** |
| **II. Speaking** | Form đề thi + Hướng dẫn cách học ở đầu | Vào phòng thi là chạy ngay, chưa có Modal/Card "Hướng dẫn cách học & tiêu chí chấm B1-B2" trước khi bắt đầu. | `frontend/src/app/speaking/[id]/page.tsx` | **0%** |
| | Part 1: Đủ bộ câu hỏi | Đang có 3 câu mẫu cơ bản, chưa đủ ngân hàng câu hỏi phân loại theo chủ đề. | `backend/src/modules/ingestion/parsers/speaking.parser.ts` | **40%** |
| | Part 2: Tranh thật + Bảng từ vựng gợi ý bên cạnh | Tranh đang dùng Unsplash fallback; **chưa có bảng từ vựng/collocation gợi ý bên cạnh tranh**. | `frontend/src/app/speaking/[id]/page.tsx` | **30%** |
| | Part 3: Tranh đối lập + Bảng từ vựng gợi ý bên cạnh | Tranh đang dùng fallback; **chưa có bảng từ vựng/collocation gợi ý bên cạnh cặp tranh**. | `frontend/src/app/speaking/[id]/page.tsx` | **30%** |
| | Part 4: Chuẩn hóa thời gian + Độ HOT bức tranh | Cần chuẩn hóa cứng thời gian: 60s chuẩn bị, 120s nói; Part 2/3: 45s; Part 1: 30s. Chưa có nhãn/badge "Độ HOT" của tranh. | `frontend/src/app/speaking/[id]/page.tsx` | **50%** |
| **III. Reading** | Form đề thi + Hướng dẫn cách học ở đầu | Chưa có modal/banner hướng dẫn chiến lược làm bài đọc ở đầu bài thi. | `frontend/src/app/reading/[id]/page.tsx` | **0%** |
| | Part 1: Đủ bộ câu hỏi | Đang có câu hỏi điền từ cơ bản, cần bổ sung thêm các bộ đề đa dạng. | `frontend/src/app/reading/[id]/page.tsx` | **40%** |
| | Part 2: Trùng chủ đề topic bên dưới | Cơ chế kéo thả/chọn thứ tự chạy tốt, nhưng một số đề đang bị trùng lặp tiêu đề câu chuyện. | `backend/prisma/seed.ts` | **60%** |
| | Part 3: **Công cụ Highlight chữ trên đoạn văn** | **Chưa có công cụ cho phép học viên bôi đen từ/câu để tô màu highlight (vàng, xanh) tìm dẫn chứng.** | `frontend/src/app/reading/[id]/page.tsx` | **20%** |
| | Part 4: Bổ sung bài đọc dài nối tiêu đề | Một số đề Part 4 bị thiếu nội dung văn bản dài (7 đoạn). Chưa gắn badge độ HOT. | `frontend/src/app/reading/[id]/page.tsx` | **30%** |
| **IV. Listening** | Form đề thi + Hướng dẫn cách học ở đầu | Chưa có modal/banner hướng dẫn làm bài nghe ở đầu phòng thi. | `frontend/src/app/listening/[id]/page.tsx` | **0%** |
| | Part 1: Audio chưa phát được tiếng | Chưa có audio URL thật chuẩn file MP3 hoặc Web Speech Synthesis phát âm tự động. | `frontend/src/app/listening/[id]/page.tsx` | **20%** |
| | Part 2, 3, 4: Chưa có topic, audio, **cần Script** | Chưa có audio thật và **chưa có nút bật xem Audio Script & bản dịch đối soát sau khi làm bài**. | `frontend/src/app/listening/[id]/page.tsx` | **20%** |
| | Lọc danh sách câu hỏi cuối part | Bảng số câu cuối trang đang hiển thị gộp, chưa tách riêng biệt chỉ hiện số câu của Part hiện tại. | `frontend/src/app/listening/[id]/page.tsx` | **30%** |
| **V. Writing** | Form đề thi + Hướng dẫn cách học ở đầu | Chưa có modal/banner hướng dẫn cách viết và cấu trúc bài ở đầu. | `frontend/src/app/writing/[id]/page.tsx` | **0%** |
| | Part 1: Điều chỉnh thời gian (3–5 phút) | Đang fix cứng, cần cho phép điều chỉnh linh hoạt. | `frontend/src/app/writing/[id]/page.tsx` | **50%** |
| | Part 2: Gắn bối cảnh Câu lạc bộ (CLB) | Đã có form 20-30 từ, nhưng chưa gắn rõ tên và bối cảnh CLB xuyên suốt đề thi. | `frontend/src/app/writing/[id]/page.tsx` | **50%** |
| | Part 3: Bối cảnh CLB + 3 tin nhắn mạng xã hội | Đã có 3 câu trả lời, cần chuẩn hóa giao diện phòng chat CLB mạng xã hội. | `frontend/src/app/writing/[id]/page.tsx` | **50%** |
| | Part 4: **Chia Form thành 2 (Bạn thân & Quản lý)** | **Chưa tách thành 2 ô nhập độc lập**: Email thân mật cho bạn (50 từ, 10 phút) và Email trang trọng cho quản lý CLB (120-150 từ, 20 phút). | `frontend/src/app/writing/[id]/page.tsx` | **30%** |
| **VI. Từ vựng** | Học từ vựng Aptis theo Sheet | Đã có module Flashcard SRS `/vocabulary`, đang chờ Sheet từ vựng từ chủ dự án để import. | `frontend/src/app/vocabulary/page.tsx` | **40%** *(Chờ dữ liệu)* |

---

## 3. THIẾT KẾ CHI TIẾT & GIẢI PHÁP KỸ THUẬT CHO TỪNG PHẦN

### 3.1. Yêu Cầu Go-Live: Mã Code Kích Hoạt PRO Miễn Phí (14 – 20 Ngày)

#### Mục tiêu:
Cho phép mọi học viên đăng ký mới chỉ cần nhập mã khuyến mại (ví dụ: `GOLIVE14` hoặc `APTISPRO14`) là ngay lập tức được nâng cấp lên tài khoản **VIP PRO** trải nghiệm đầy đủ tính năng trong 14 ngày (860+ bộ đề thi, chấm AI không giới hạn cơ bản, mở khóa Bảng Kỳ Tích).

#### Giải pháp kỹ thuật:
1. **Backend Database Seed:**
   Tạo bản ghi trong bảng `PromotionCode`:
   ```typescript
   {
     code: 'GOLIVE14',
     description: 'Mã trải nghiệm miễn phí 14 ngày toàn bộ tính năng Pro nhân dịp Go-Live',
     plan_id: vipPlan.id,       // Gói VIP Pro
     duration_days: 14,         // 14 ngày
     ai_quota: 20,              // Tặng 20 lượt chấm AI chi tiết
     teacher_quota: 0,
     max_uses: null,            // Không giới hạn số lượng học viên
     current_uses: 0,
     is_active: true,
     expires_at: new Date('2026-12-31')
   }
   ```
2. **Frontend UX:**
   - Thêm **Banner thông báo nổi bật** trên đầu trang chủ và trang Dashboard:
     > *"🎉 Chào mừng Go-Live: Nhập mã **`GOLIVE14`** tại trang Nâng cấp để nhận ngay 14 ngày học VIP Pro miễn phí!"*
   - Tích hợp nút 1-click: Bấm vào là tự động điền mã và kích hoạt ngay mà không cần gõ tay.

---

### 3.2. Kỹ Năng Speaking: Chuẩn Hóa Phòng Thi & Bổ Trợ Từ Vựng

#### Mục tiêu:
Biến phòng thi Speaking thành môi trường luyện nói thực chiến chuẩn British Council, có vốn từ vựng tại chỗ để học viên tự tin phản xạ.

#### Giải pháp kỹ thuật:
1. **Modal Form Hướng Dẫn Ban Đầu (`InstructionsModal`):**
   - Hiển thị trước khi vào bài: Tóm tắt 4 Part, lưu ý về micro, tiếng bíp báo hiệu, tiêu chí chấm (Phát âm, Độ trôi chảy, Ngữ pháp, Từ vựng).
   - Nút: *"Tôi đã sẵn sàng – Bắt đầu làm bài"*.
2. **Bảng Từ Vựng Gợi Ý Bên Cạnh Bức Tranh (Part 2 & Part 3):**
   - Thiết kế layout chia 2 cột:
     - **Cột trái:** Hình ảnh thi thật (zoom nét, tỉ lệ chuẩn).
     - **Cột phải:** Bảng **"Gợi ý từ vựng & Collocations ăn điểm"**:
       - *Keywords:* `collaborative workspace`, `cozy ambiance`, `digital devices`, `burst into laughter`.
       - *Mẫu câu mở đầu:* `Looking at the picture, the first thing that catches my attention is...`
       - *Mẫu câu phát triển ý:* `It reminds me of a time when...`
3. **Chuẩn Hóa Bộ Đếm Thời Gian:**
   - **Part 1:** 5s đọc đề → Tiếng bíp → 30s ghi âm tự động (3 câu).
   - **Part 2 & Part 3:** 12s đọc đề/chuẩn bị → Tiếng bíp → 45s ghi âm tự động mỗi câu hỏi.
   - **Part 4:** 60s đếm ngược chuẩn bị ghi chú nháp → Tiếng bíp → 120s (2 phút) ghi âm bài nói liền mạch.
4. **Nhãn Độ HOT của Tranh:**
   - Gắn nhãn badge: `🔥 HOT ĐỀ THI THÁNG 10`, `Tần suất xuất hiện: 85%` để học viên biết trọng tâm ôn luyện.

---

### 3.3. Kỹ Năng Reading: Công Cụ Highlight & Xử Lý Nội Dung

#### Mục tiêu:
Cung cấp trải nghiệm đọc như thi trên máy tính của British Council, hỗ trợ công cụ định vị thông tin nhanh.

#### Giải pháp kỹ thuật:
1. **Công Cụ Highlight Chữ (Text Highlighter):**
   - Khi học viên bôi đen (select text) bất kỳ đoạn nào trong bài đọc (Part 3, Part 4):
     - Hiện popover mini gồm 2 màu: 🟡 Vàng (Dẫn chứng chính), 🟢 Xanh (Từ khóa đối chiếu) và 🗑️ Xóa highlight.
     - Sử dụng HTML `mark` tag hoặc custom span giữ nguyên cấu trúc DOM, lưu trạng thái theo từng câu hỏi để khi chuyển qua lại không bị mất.
2. **Khắc Phục Trùng Lặp Chủ Đề Part 2:**
   - Rà soát lại dữ liệu JSON trích xuất, tách biệt từng câu chuyện (Ordering sentences) thành các ID riêng biệt (vd: `P2_Story_Museum_Visit`, `P2_Story_New_Job`, `P2_Story_Vacation`).
3. **Bổ Sung Đầy Đủ Bài Đọc Dài Part 4:**
   - Cung cấp văn bản hoàn chỉnh 7 đoạn (khoảng 700 - 800 từ) gắn liền với 7 tiêu đề hoặc 7 câu hỏi matching.

---

### 3.4. Kỹ Năng Listening: Trình Phát Audio, Audio Script & Phân Part

#### Mục tiêu:
Khắc phục triệt để lỗi không có tiếng, cung cấp Audio Script để học viên luyện nghe - dịch sau khi nộp bài.

#### Giải pháp kỹ thuật:
1. **Trình Phát Audio Thật + Web Speech Fallback:**
   - Ưu tiên 1: Tích hợp link audio MP3 chuẩn phòng thi từ CDN.
   - Ưu tiên 2 (Offline Fallback): Tự động dùng `window.speechSynthesis` với giọng đọc chuẩn Anh - Anh (en-GB female/male) phát âm rõ ràng, chuẩn ngữ điệu nếu chưa kịp tải file MP3.
   - Giới hạn chuẩn British Council: Cho phép nghe tối đa **2 lần** mỗi đoạn (có thanh đếm số lượt nghe còn lại).
2. **Audio Script & Dịch Nghĩa Chi Tiết:**
   - Bên dưới mỗi câu hỏi, khi bật chế độ "Xem đáp án" hoặc sau khi nộp bài:
     - Nút toggle: `📖 Xem Audio Script`.
     - Hiển thị nguyên văn lời thoại tiếng Anh kèm highlight từ khóa quyết định đáp án (keywords) và bản dịch tiếng Việt giải thích lý do chọn đáp án.
3. **Phân Tách Danh Sách Câu Hỏi Theo Part:**
   - Bảng điều khiển câu hỏi ở chân trang chỉ hiển thị danh sách câu của Part đang mở (Part 1: câu 1-13; Part 2: câu 14-17; Part 3: câu 18-21; Part 4: câu 22-25), tránh làm rối mắt học viên.

---

### 3.5. Kỹ Năng Writing: Chuẩn Hóa Bối Cảnh CLB & Tách Đôi Form Part 4

#### Mục tiêu:
Mô phỏng 100% bối cảnh đề thi thật Aptis ESOL (xuyên suốt theo một Câu lạc bộ cụ thể) và phân tách form viết Part 4 rõ ràng.

#### Giải pháp kỹ thuật:
1. **Bối Cảnh Câu Lạc Bộ (Club Context):**
   - Mỗi đề thi gắn liền với một CLB xuyên suốt:
     - *Part 1:* Điền 5 thông tin cơ bản tham gia CLB (1 - 5 từ/câu, 3 phút).
     - *Part 2:* Điền mẫu đơn giới thiệu bản thân cho CLB (20 - 30 từ, 7 phút).
     - *Part 3:* Trả lời 3 tin nhắn thảo luận trên mạng xã hội của 3 thành viên CLB (30 - 40 từ/câu, 10 phút).
     - *Part 4:* Nhận một thông báo bất ngờ từ CLB (hủy chuyến đi, tăng phí, đổi lịch).
2. **Tách Đôi Form Viết Part 4 (`WritingPart4DualForm`):**
   - **Form 1 (Email cho bạn thân):**
     - Đề bài: Viết cho người bạn cùng CLB bày tỏ cảm xúc và đề xuất giải pháp.
     - Giới hạn: **50 từ** (khuyến nghị 40 - 60 từ).
     - Bộ đếm từ độc lập: `{wordCount1}/50 từ`.
   - **Form 2 (Email trang trọng cho Chủ tịch/Quản lý CLB):**
     - Đề bài: Viết cho Ban quản trị CLB với văn phong trang trọng (formal tone), giải thích tình hình và kiến nghị phương án thay thế.
     - Giới hạn: **120 – 150 từ**.
     - Bộ đếm từ độc lập: `{wordCount2}/150 từ`.
   - Cung cấp 2 khung chấm điểm AI riêng biệt cho từng email.

---

### 3.6. Module Từ Vựng Aptis (SRS Flashcard)

#### Mục tiêu:
Nạp bộ từ vựng mục tiêu từ Google Sheet của bạn vào cơ sở dữ liệu để phục vụ việc học lặp lại ngắt quãng (Spaced Repetition System).

#### Giải pháp kỹ thuật:
- Chuẩn bị sẵn Script Import (`tools/scripts/import-vocab-sheet.ts`) đọc định dạng file Excel / CSV / Google Sheet gồm các cột:
  `Word | Phonetic | PartOfSpeech | MeaningVi | ExampleSentence | Collocation | CefrLevel | Topic`
- Nạp trực tiếp vào bảng `VocabularyItem` để học viên luyện tập hàng ngày.

---

## 4. KẾ HOẠCH TRIỂN KHAI THEO GIAI ĐOẠN (ROADMAP)

```
┌────────────────────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 1: GO-LIVE & FIX GẤP WRITING/SPEAKING (1 - 2 NGÀY TỚI)       │
│ • Seed mã CODE Free Pro 14 ngày (GOLIVE14) + Banner trang chủ          │
│ • Writing Part 4: Tách đôi 2 Form email (Bạn thân 50 từ + Quản lý 150) │
│ • Speaking Part 2 & 3: Thêm Bảng từ vựng gợi ý bên cạnh tranh          │
│ • Chuẩn hóa thời gian Speaking (P1: 30s, P2/3: 45s, P4: 60s + 120s)    │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│ GIAI ĐOẠN 2: LISTENING & READING (2 - 3 NGÀY TIẾP THEO)                │
│ • Listening: Trình phát audio + Nút bật Audio Script đối soát          │
│ • Listening: Phân tách danh sách câu hỏi chỉ hiện theo Part hiện tại   │
│ • Reading: Công cụ Highlight chữ trực tiếp trên đoạn văn (Vàng/Xanh)   │
│ • Reading: Bổ sung bài đọc dài Part 4 và khử trùng lặp chủ đề Part 2   │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│ GIAI ĐOẠN 3: NỘI DUNG, TỪ VỰNG & FULL TEST (GIAI ĐOẠN HOÀN TẤT)        │
│ • Modal "Hướng dẫn cách học & Form đề thi" mở đầu cho cả 4 kỹ năng    │
│ • Import Sheet từ vựng Aptis vào Flashcard SRS                         │
│ • Cập nhật ảnh FB học viên + Modal chi tiết ngày khai giảng Dashboard │
│ • Hoàn thiện luồng Full Test 4 kỹ năng liên hoàn & Báo cáo CEFR tổng  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. KẾT LUẬN & CAM KẾT KỸ THUẬT

Tài liệu này là căn cứ kỹ thuật chính xác nhất phản ánh hiện trạng dự án. Toàn bộ các hạng mục còn thiếu đều đã có giải pháp kiến trúc rõ ràng, tương thích 100% với nền tảng Next.js + Tailwind + Nest/Express + Prisma hiện hành mà không phá vỡ logic cũ.

Khi bạn duyệt kế hoạch này, chúng ta sẽ bắt tay vào triển khai ngay **Giai đoạn 1 (Mã Pro Go-Live, Writing Part 4 tách đôi và Bảng từ vựng Speaking)**.
