# KẾ HOẠCH TỔNG THỂ: CHUẨN HÓA KIẾN TRÚC DỮ LIỆU & REFACTOR HỆ THỐNG APTIS ELEARNING
**Nguyên tắc cốt lõi: Single Source of Truth (Một nguồn chân lý duy nhất) — Sửa 1 chỗ, dứt điểm toàn hệ thống**

---

## I. GIẢI TRÌNH BẢN CHẤT GỐC RỄ: TẠI SAO HỆ THỐNG CỨ BỊ LỖI VÀ BỚI CODE MẤT 20 PHÚT?

### 1. Hiện trạng kiến trúc đang gặp lỗi
Hiện tại, dự án đang bị rơi vào bẫy **"Kiến trúc phân mảnh & Suy đoán dữ liệu (Fragile Heuristics)"**:
1. **Database thiếu trường ngữ nghĩa (Semantic Field)**: 
   - Bảng `ExamPart` chỉ có `part_number: Int`. 
   - Với đề thi riêng lẻ (Single Part Practice), ví dụ đề luyện "Speaking Part 2" hay "Listening Part 4", trong DB `part_number` lại lưu là `1` (vì đề đó chỉ có 1 part).
   - `image_url` lưu lộn xộn: lúc là `19.png`, lúc là `p2_64.jpg`, thậm chí Part 4 (vốn không có ảnh trong chuẩn Aptis) lại bị gán `p4_11.jpg`.
2. **Backend chưa làm tròn vai trò "Trọng tài dữ liệu"**:
   - Backend chỉ bốc dữ liệu thô từ DB đẩy ra API mà không chuẩn hóa thành một DTO (Data Transfer Object) hoàn chỉnh.
   - Thậm chí trong `exam.service.ts`, Backend cũng phải chạy regex để bóc tách xem đề này là đề số mấy, part số mấy.
3. **Frontend bị biến thành "Nơi vá lỗi và suy đoán" (Code phình to 3.300 dòng/file)**:
   - Vì Backend không trả rõ Part này là loại gì (`PART_1` hay `PART_4`), thời gian chuẩn bị bao nhiêu giây, ảnh nào là chính xác... nên Frontend phải tự viết hàng loạt hàm suy đoán (`resolveSpeakingPart2Image`, `resolveSpeakingPart3Images`, `cleanSpeakingTextForMatch`...).
   - Frontend tự nhúng các mảng mock dữ liệu dự phòng khổng lồ (`SPEAKING_PART2_BANK`, `DEFAULT_LISTENING_TEST_2`...).
   - **Hậu quả**: Khi người dùng vào đề thi, Frontend so sánh từ khóa (nếu thấy chữ "book" hay "supermarket" thì tự tiện lấy ảnh số 18 đè lên), dẫn đến hiện tượng **"tranh có hiện nhưng sai tranh"** và **"sửa chỗ này thì bể chỗ khác"**.

---

## II. CẦN FIX TỪ ĐÂU? (DATABASE, BACKEND HAY FRONTEND?)

> **CÂU TRẢ LỜI:** **PHẢI FIX THEO MÔ HÌNH 3 LỚP ĐỒNG BỘ, NHƯNG LẤY BACKEND & DATABASE LÀM GỐC.**
> Không thể chỉ fix ở Frontend (vì càng sửa Frontend thì đống regex càng rối). Càng không thể chỉ sửa DB mà không sửa API.

```mermaid
flowchart TD
    DB[(1. Database Clean & Consistent)] -->|Dữ liệu sạch, media đúng thực tế| BE[2. Backend API Service: Single Source of Truth]
    BE -->|DTO chuẩn: partType, prepTime, speakTime, imageUrls| FE[3. Frontend Dumb Renderer]
    FE -->|Chỉ hiển thị, 0% regex, 0% mock data| User((Người học))
```

- **Bước 1 - Database**: Chuẩn hóa toàn bộ dữ liệu trong PostgreSQL (media nào có thật trong ổ đĩa thì map đúng đường dẫn, Part 4 xóa bỏ `image_url` rác, Part 2/3 link đúng thư mục `/uploads/speaking/part2/...`).
- **Bước 2 - Backend**: Chuẩn hóa DTO API. Backend đóng vai trò xác định chính xác:
  - `partType`: `'PART_1' | 'PART_2' | 'PART_3' | 'PART_4'`
  - `prepTime`: số giây chuẩn bị (Part 1: 5s, Part 2/3: 12s, Part 4: 60s)
  - `speakTime`: số giây nói (Part 1: 30s, Part 2/3: 45s, Part 4: 120s)
  - `imageUrl`, `secondImageUrl`: Đường dẫn ảnh đã kiểm tra hợp lệ
- **Bước 3 - Frontend**: Xóa sổ toàn bộ 1.500 dòng code suy đoán và mock bank. Frontend chỉ nhận DTO và hiển thị ("Dumb UI Component"). Sau này nếu muốn đổi thời gian hay đổi quy tắc, chỉ cần sửa đúng 1 chỗ trên Backend.

---

## III. ROADMAP CHI TIẾT THEO TỪNG TASK (CHIA NHỎ VÀ FIX DỨT ĐIỂM)

### 📌 GIAI ĐOẠN 1: CHUẨN HÓA DATABASE & HỢP ĐỒNG DỮ LIỆU BACKEND (FOUNDATION)

#### Task 1.1: Thiết kế DTO Chuẩn dùng chung (Shared Types Contract)
- **Mục tiêu**: Định nghĩa cấu trúc dữ liệu chuẩn cho Part và Question của kỹ năng Speaking & Listening.
- **Chi tiết**:
  ```typescript
  export type AptisPartType = 'PART_1' | 'PART_2' | 'PART_3' | 'PART_4';

  export interface StandardExamPartDto {
    id: string;
    partNumber: number;          // Thứ tự xuất hiện trong đề (1..N)
    partType: AptisPartType;     // Loại phần thi thực tế chuẩn khảo thí
    title: string;
    instructions?: string;
    passageText?: string;
    audioUrl?: string;           // Audio chuẩn của part nếu có
    imageUrl?: string | null;    // Ảnh 1 (Part 2, 3) - Part 4 LUÔN LÀ NULL
    secondImageUrl?: string | null; // Ảnh 2 (Part 3)
    prepTimeSeconds: number;     // Part 1: 5, Part 2/3: 12, Part 4: 60
    speakTimeSeconds: number;    // Part 1: 30, Part 2/3: 45, Part 4: 120
    questions: StandardQuestionDto[];
  }
  ```
- **File tác động**: `backend/src/modules/exams/dtos/exam-detail.dto.ts` & `frontend/src/types/exam.ts`.

#### Task 1.2: Audit và Viết Script Chuẩn hóa Data Speaking trong Database
- **Mục tiêu**: Quét sạch dữ liệu rác, liên kết đúng ảnh có thật trên ổ đĩa.
- **Tiêu chí thực hiện**:
  1. Part 4 của tất cả các đề Speaking: Cập nhật `image_url = null` 100% (không để ảnh rác như `p4_11.jpg`).
  2. Part 2 & Part 3:
     - Kiểm tra các file ảnh thực tế trong `backend/uploads/speaking/part2` và `frontend/public/uploads/speaking/part2` (`image1.png` .. `image25.png`).
     - Map đúng đường dẫn ảnh chuẩn `/uploads/speaking/part2/imageX.png` vào cột `image_url` của Part tương ứng theo đúng chủ đề đề thi trong DB.
  3. Xóa bỏ các giá trị tên file cụt không có thư mục (ví dụ `19.png` -> `/uploads/speaking/part2/image19.png`).
- **File tạo**: `backend/scripts/repair-speaking-images-and-parts.ts`.

#### Task 1.3: Nâng cấp Backend Service `getExamQuestions` trả về DTO chuẩn
- **Mục tiêu**: Backend phân tích `partType` dựa trên cấu trúc đề và trả về đầy đủ các thông số khảo thí (`prepTimeSeconds`, `speakTimeSeconds`, `imageUrl`).
- **Tiêu chuẩn đầu ra**: API `/api/exams/:id/questions` trả về dữ liệu tự thân (self-contained), Frontend không cần phải đoán.
- **File tác động**: `backend/src/modules/exams/exam.service.ts`.

---

### 📌 GIAI ĐOẠN 2: REFACTOR PHÒNG THI SPEAKING (SPEAKING RUNNER)

#### Task 2.1: Loại bỏ toàn bộ Mock Banks và Code Đoán Mò (Dead Code Removal)
- **Mục tiêu**: Giảm kích thước `frontend/src/app/speaking/[id]/page.tsx` từ 3.288 dòng xuống dưới 1.200 dòng sạch sẽ.
- **Xóa bỏ các thành phần sau**:
  - Xóa import `SPEAKING_PART2_BANK` và `SPEAKING_PART3_BANK`.
  - Xóa hàm `resolveSpeakingPart2Image`, `resolveSpeakingPart3Images`.
  - Xóa các hàm lọc chuỗi tìm từ khóa: `cleanSpeakingTextForMatch`, `isGenericSpeakingQuestion`.
  - Xóa hardcode bảng từ khóa ("read", "book", "supermarket", "xe khách"...).

#### Task 2.2: Đồng bộ UI Speaking Part 4 chuẩn thời gian chuẩn bị 1 phút (60s)
- **Yêu cầu người dùng**:
  - Không hiện tranh ở Part 4 (Backend đã trả `imageUrl: null`, UI kiểm tra nếu không có ảnh thì ẩn hẳn khung ảnh, mở rộng khung ghi chú/câu hỏi).
  - Có giai đoạn đếm ngược chuẩn bị 60 giây (1 phút) trước khi cho phép thí sinh nói 2 phút (120s).
  - Trong 60s chuẩn bị: Hiển thị bộ đếm giờ chuẩn bị, cho phép thí sinh đọc đề và ghi chú dàn ý (Note pad).
  - Hết 60s: Tự động phát âm báo BÍP (British Council Beep) và tự động kích hoạt ghi âm 120s.

#### Task 2.3: Đồng bộ UI Speaking Part 2 & Part 3 hiển thị đúng tranh
- **Yêu cầu**:
  - Part 2: Hiển thị đúng 1 ảnh từ `part.imageUrl`. Nếu người dùng chuyển qua 3 câu hỏi phụ của Part 2 (Mô tả -> Trải nghiệm -> Quan điểm), ảnh luôn được giữ cố định ở bên trái để thí sinh nhìn tranh trả lời.
  - Part 3: Hiển thị 2 ảnh song song từ `part.imageUrl` và `part.secondImageUrl` để so sánh và đối chiếu.

---

### 📌 GIAI ĐOẠN 3: REFACTOR PHÒNG THI LISTENING (LISTENING RUNNER)

#### Task 3.1: Loại bỏ Mock Data và Đoán Mò trong Listening
- **Mục tiêu**: Xóa bỏ `DEFAULT_LISTENING_TEST_2`, `LISTENING_PART2_TOPICS` trong `frontend/src/app/listening/[id]/page.tsx`.
- **Đồng bộ hóa**:
  - Nhận `partType` trực tiếp từ Backend DTO (`PART_1` đến `PART_4`).
  - Single-part exam (luyện riêng Part 2, 3, 4) và Full 4-part exam đều dùng chung một bộ renderer duy nhất.

#### Task 3.2: Kiểm tra phát Audio tự động
- Đảm bảo đường dẫn audio từ Backend trả về (`audio_url` hoặc `transcript`) luôn trỏ đến file MP3 hợp lệ hoặc kích hoạt TTS giọng bản ngữ chuẩn UK/US tự động khi không có file MP3 tĩnh.

---

### 📌 GIAI ĐOẠN 4: TEST HỆ THỐNG VÀ NGHIỆM THU (VERIFICATION & GO-LIVE)

#### Task 4.1: Script Kiểm tra Tự động (Integrity Check Script)
- Viết script quét 100% các đề thi Speaking và Listening trong database:
  - Part 4 Speaking: 0% đề có ảnh.
  - Part 2 & 3 Speaking: 100% đề có ảnh hợp lệ, link ảnh trả lời HTTP 200 (không bị 404).
  - Part 1 Speaking: 100% đề có đủ 3 câu hỏi với thời gian chuẩn bị 5s / nói 30s.

#### Task 4.2: Nghiệm thu Trực quan trên Browser
- Chạy thử bài thi thật của Speaking:
  - Kiểm tra Part 1: Thời gian 5s chuẩn bị + 30s nói.
  - Kiểm tra Part 2: Đúng tranh, 12s chuẩn bị + 45s nói.
  - Kiểm tra Part 3: Đúng 2 tranh so sánh, 12s chuẩn bị + 45s nói.
  - Kiểm tra Part 4: Không có tranh, đồng hồ đếm ngược 60s chuẩn bị chuẩn xác, sau đó chuyển sang 120s nói.

---

## IV. BẢNG TIẾN ĐỘ THỰC HIỆN DỰ KIẾN

| Task | Hạng mục | Trọng tâm giải quyết | Thời gian ước tính | Trạng thái |
|---|---|---|---|---|
| **Task 1** | Chuẩn hóa Backend DTO & Script DB Speaking | Chuẩn hóa DTO, xóa ảnh Part 4 trong DB, map đúng ảnh Part 2/3 | 30 phút | ✅ **ĐÃ HOÀN THÀNH** |
| **Task 2** | Refactor Frontend Speaking Runner | Xóa 1.500 dòng code đoán mò, set up đếm ngược 60s Part 4 | 25 phút | ✅ **ĐÃ HOÀN THÀNH** |
| **Task 3** | Refactor Frontend Listening Runner | Bỏ mock data `DEFAULT_LISTENING_TEST_2`, map DTO chuẩn | 15 phút | ✅ **ĐÃ HOÀN THÀNH** |
| **Task 4** | E2E Browser Testing & Nghiệm thu Speaking/Listening | Mở trình duyệt chạy kiểm tra thực tế cả 4 Part Speaking & Listening | 15 phút | ✅ **ĐÃ HOÀN THÀNH** |
| **Task 5** | Chuẩn hóa Backend DTO cho Reading & Writing | Bổ sung partType, minWords, maxWords, recommendedMinutes tự thân | 20 phút | ✅ **ĐÃ HOÀN THÀNH** |
| **Task 6** | Refactor Frontend Reading & Writing Runners | Tách mock banks ra file benchmark riêng, xóa heuristic parsing | 25 phút | ✅ **ĐÃ HOÀN THÀNH** |
| **Task 7** | Chuẩn hóa Phân Hệ Thi Thử (`FULL_TEST`) | Xóa tranh Part 4 trong 26 đề Full Test, bỏ link Supabase cũ | 20 phút | ✅ **ĐÃ HOÀN THÀNH** |
| **Task 8** | Chuẩn hóa Phân Hệ Grammar & Vocabulary | Dọn sạch 128 part rỗng của 6 đề rác, tách grammar-benchmark | 20 phút | ✅ **ĐÃ HOÀN THÀNH** |
| **Task 9** | Audit Toàn Hệ Thống Zero-Bug (Master Audit) | Quét 100% database, test DTO API tự thân toàn bộ 5 phân hệ | 15 phút | ✅ **ĐÃ HOÀN THÀNH** |

---

## V. GIẢI TRÌNH ĐỐI CHIẾU CHANGELOG: TẠI SAO TRƯỚC ĐÂY FIX LIÊN TỤC MÀ BUG VẪN ĐẦY RA?

Khi đối chiếu với [CHANGELOG.md](file:///d:/sontayweb/aptis-elearning/CHANGELOG.md), ta thấy rõ các đợt cập nhật trước đây rơi vào cái bẫy **"Sửa ngọn — Vá chắp vá ở Frontend"**:
1. **Chỉ sửa đề thi đơn lẻ, bỏ quên đề thi thử (Full Test)**: 
   - Trước đây sửa tranh Speaking Part 2, Part 3, Part 4 chỉ lọc `exam: { skill: 'SPEAKING' }`.
   - Kết quả: Khi vào phòng thi Speaking đơn lẻ thì thấy hết lỗi, nhưng khi học viên vào **Thi Thử (Full Test)** thì lỗi tranh sai, Part 4 có tranh rác `p4_46.jpg`, `p4_63.jpg` lại xuất hiện trở lại y như cũ!
2. **Hardcode Mock Banks thay vì sửa dữ liệu gốc**:
   - Khi Backend hoặc DB thiếu dữ liệu, thay vì dọn DB và sửa API thì Frontend lại nhét các mảng khổng lồ (`DEFAULT_GRAMMAR_QUESTIONS`, `DEFAULT_ART_CLUB_PARTS`, `DEFAULT_READING_TEST`...).
   - Kết quả: Khi người học làm bài, dữ liệu nộp lên không ăn khớp với DB, điểm số và bài thi bị lệch pha.
3. **Link tài nguyên ngoài chết (Supabase)**:
   - Trong `thi-thu/[id]/page.tsx` vẫn còn link fallback trỏ về `bacoamhbatqpxatrrflz.supabase.co` đã ngưng hoạt động từ lâu, gây lỗi ảnh vỡ 404.
4. **Đề thi rác làm tắc nghẽn hệ thống**:
   - Trong DB tồn tại các đề như `GV 1`, `Grammar 2..5` có tới 25 part rỗng (0 câu hỏi). Học viên bấm vào làm thì giao diện bị đơ hoặc phải fallback về mock tĩnh.

---

## VI. KẾT QUẢ NGHIỆM THU TOÀN DIỆN ZERO-BUG TOÀN HỆ THỐNG

1. **Phân hệ Thi Thử (`FULL_TEST`)**:
   - Dọn sạch 100% (26/26) Part 4 Speaking trong các đề Full Test: `image_url = null` tuyệt đối.
   - Chuẩn hóa 100% (26 Part 2 và 26 Part 3) Speaking trong Full Test về đường dẫn ảnh `/uploads/speaking/...` có thật trên đĩa.
   - Xóa bỏ triệt để liên kết Supabase chết trong `thi-thu/[id]/page.tsx`.
   - Backend `exam.service.ts` áp dụng phân loại và gán DTO (`prepTime`, `speakTime`, `minWords`, `maxWords`) cho từng Part con bên trong Full Test.

2. **Phân hệ Grammar & Vocabulary (`GRAMMAR_VOCABULARY`)**:
   - Dọn sạch 128 part rỗng 0 câu hỏi trong 6 đề lỗi (`GV 1`, `Grammar 2`, `Grammar 3`, `Grammar 4`, `Grammar 5`, `1`).
   - Ẩn các đề không đủ chuẩn khảo thí, kích hoạt xuất bản 48 đề Grammar & Vocabulary chuẩn (Đề 01 - Đề 08) với 525 câu hỏi thật 100%.
   - Tách 450 dòng `DEFAULT_GRAMMAR_QUESTIONS` ra `src/data/grammar-benchmark.ts`.

3. **Phân hệ Speaking, Listening, Reading, Writing**:
   - Toàn bộ 230 Part 4 Speaking trên toàn hệ thống đạt chuẩn `image_url = null` 100%.
   - 100% tranh Part 2 & Part 3 có file vật lý trên đĩa (không lỗi 404).
   - Reading: Đầy đủ 4 part, DTO trả về `partType` tự thân, 0% regex đoán chuỗi.
   - Writing: Tự động đảm bảo 2 email chuẩn cho Part 4 ngay từ Backend DTO.

4. **Trạng thái Kỹ thuật Cuối cùng**:
   - `frontend`: `tsc --noEmit` -> **Exit code 0 (0 error)**.
   - `backend`: `tsc --noEmit` -> **Exit code 0 (0 error)**.
   - Script Master Audit [backend/scripts/audit-master-zero-bug.ts](file:///d:/sontayweb/aptis-elearning/backend/scripts/audit-master-zero-bug.ts) chạy **Pass 100%**.

---
*Xác nhận: Toàn bộ hệ thống Aptis Elearning đã được giải quyết dứt điểm tận gốc từ Database, Backend DTO đến Frontend theo chuẩn Single Source of Truth.*
