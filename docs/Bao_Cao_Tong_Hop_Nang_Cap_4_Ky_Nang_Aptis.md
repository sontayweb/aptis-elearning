# BÁO CÁO TỔNG HỢP NÂNG CẤP HỆ THỐNG 4 KỸ NĂNG APTIS (ESOL / GENERAL)

> **Dự án:** Nền tảng E-learning Luyện thi Aptis ESOL & General  
> **Thời gian cập nhật:** 13/10 - 14/10/2026  
> **Trạng thái tổng thể:** ✅ Đã hoàn thành 100% các hạng mục & Kiểm thử Hệ thống (Next.js Build & Backend Build) 0 lỗi  

---

## I. TỔNG QUAN HẠNG MỤC CÔNG VIỆC

Theo yêu cầu chuẩn hóa trải nghiệm người dùng bám sát đề thi thật Aptis của Hội đồng Anh (British Council), toàn bộ các vấn đề về cấu trúc bài thi, ngân hàng câu hỏi, bóc tách tài nguyên media (audio/hình ảnh), và luồng làm bài của **4 kỹ năng (Speaking, Reading, Listening, Writing)** đã được rà soát, chia nhỏ thành các task chi tiết và hoàn thiện triệt để.

---

## II. BẢNG CHI TIẾT TIẾN ĐỘ, NGUYÊN NHÂN GỐC RỄ & KẾT QUẢ THỰC HIỆN

| Kỹ năng | Mã Task | Hạng mục công việc | Nguyên nhân gốc rễ (Root Cause) | Giải pháp kỹ thuật khắc phục | Trạng thái |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **🎙️ Speaking** | **S1** | Form đề thi & Banner hướng dẫn chiến thuật | Giao diện cũ vào thẳng danh sách đề thi mà không có tóm tắt cấu trúc 4 Part, thiếu hướng dẫn phân bổ thời gian và mẹo chuyển tiếp ý khiến học viên bỡ ngỡ. | Xây dựng component [SpeakingGuideBanner](file:///d:/sontayweb/aptis-elearning/frontend/src/components/speaking-guide-banner.tsx) đặt ở đầu trang: Cung cấp sơ đồ 4 Part, chiến lược 4 bước học, bí quyết tăng band B2 $\rightarrow$ C1 và bảng câu đệm (Fillers) phản xạ. | ✅ Hoàn thành |
| | **S2** | Marathon luyện câu lẻ Part 1 | Đề thi cũ chỉ cho phép làm bài theo cụm 3 câu liên tục của 1 đề; học viên không thể chủ động luyện phản xạ tức thì theo từng câu hỏi lẻ hay gặp trong thực tế. | Bóc tách 90+ câu lẻ từ tài liệu `SPEAKING/Tổng hợp đề part 1.docx` vào [speaking-part1-bank.ts](file:///d:/sontayweb/aptis-elearning/frontend/src/data/speaking-part1-bank.ts); tạo route [`/speaking/marathon?part=1`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/speaking/marathon/page.tsx) bấm giờ 30s riêng từng câu kèm bài mẫu B2/C1. | ✅ Hoàn thành |
| | **S3** | Tranh Part 2 & Từ vựng mô tả tranh | Parser cũ chỉ đọc chuỗi text thô trong file Docx mà không giải nén thư mục `word/media/` và không parse bảng từ vựng `w:tbl`, dẫn đến thiếu tranh ảnh và học viên không có vốn từ mô tả. | Viết script [extract_speaking_data.js](file:///d:/sontayweb/aptis-elearning/backend/scripts/extract_speaking_data.js) dùng `AdmZip` bóc tách đủ 25 file tranh thật chất lượng cao vào `public/uploads/speaking/part2/`, trích xuất bảng từ vựng song ngữ và 3 câu hỏi/tranh vào [speaking-part2-bank.ts](file:///d:/sontayweb/aptis-elearning/frontend/src/data/speaking-part2-bank.ts). | ✅ Hoàn thành |
| | **S4** | Cặp tranh Part 3 & Từ vựng so sánh | Parser chưa hỗ trợ trích xuất cặp tranh đối chiếu và bảng cấu trúc so sánh đối chiếu; các tranh liên kết `r:embed` bị bỏ qua trong luồng import thông thường. | Giải nén và lưu trữ 15 cặp tranh vào `public/uploads/speaking/part3/`; trích xuất bảng từ vựng & collocations so sánh đối chiếu (contrast/comparison) vào [speaking-part3-bank.ts](file:///d:/sontayweb/aptis-elearning/frontend/src/data/speaking-part3-bank.ts); hỗ trợ luyện tập tại [`/speaking/marathon?part=3`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/speaking/marathon/page.tsx). | ✅ Hoàn thành |
| | **S5** | Part 4: 3 câu cùng lúc + Đồng hồ đếm chuẩn | Runner làm bài kế thừa luồng tuần tự (từng câu một) từ Part 1/Part 2; thời gian đếm ngược bị gán sai thành 45s mỗi câu thay vì chuẩn đề thi thật là 1 phút chuẩn bị + 2 phút nói liên tục cho cả 3 câu. | Tái cấu trúc runner [speaking/[id]/page.tsx](file:///d:/sontayweb/aptis-elearning/frontend/src/app/speaking/%5Bid%5D/page.tsx): Hiển thị đồng thời cả 3 câu hỏi trên màn hình; cấu hình đếm chuẩn Aptis (60s chuẩn bị $\rightarrow$ 120s ghi âm liên tục); gắn nhãn sticker `2 phút / 3 câu` & `★★★★★ Hay ra`. | ✅ Hoàn thành |
| **📖 Reading** | **R1** | Tách câu lẻ Part 1 & Chế độ Marathon Gap-Fill | Trong file docx nguồn, các câu văn ngắn của Part 1 được viết liên tiếp trong 1 đoạn văn bản; parser ghép chung thành 1 đoạn dài khiến câu lẻ bị dính liền và không có giao diện luyện đục lỗ nhanh. | Xử lý regex tách độc lập từng câu văn đục lỗ; bóc tách 60+ câu từ `READING/Part 1.docx` vào [reading-part1-bank.ts](file:///d:/sontayweb/aptis-elearning/frontend/src/data/reading-part1-bank.ts); xây dựng trang Marathon [`/reading/marathon?part=1`](file:///d:/sontayweb/aptis-elearning/frontend/src/app/reading/marathon/page.tsx) kèm bản dịch tiếng Việt song ngữ và tự động chấm điểm. | ✅ Hoàn thành |
| | **R2** | Bổ sung tên Topic thực tế cho Part 2, 3, 4 | Dữ liệu crawler và seed cũ gán tiêu đề mặc định là "Bài đọc 1", "Bài đọc 2", "Part 2 Đề thi", thiếu chủ đề ngữ cảnh làm học viên khó liên hệ nội dung bài đọc với đề thi thực tế. | Xây dựng ngân hàng chủ đề [reading-topics-bank.ts](file:///d:/sontayweb/aptis-elearning/frontend/src/data/reading-topics-bank.ts) chuẩn hóa tên topic ngữ cảnh thực tế (*Making films, Extreme Sports, Four-Day Work Week...*) hiển thị đồng bộ trên thẻ bài và runner. | ✅ Hoàn thành |
| | **R3** | Nhãn đánh giá ưu tiên (Stickers) & Banner B2 | Thiếu cơ chế phân loại mức độ quan trọng/tần suất xuất hiện trong phòng thi khiến học viên ôn luyện tràn lan không có trọng tâm. | Gắn nhãn sticker phân cấp: `★★★★★ Hay ra`, `VIP`, `Đề tủ`, `Mới cập nhật`. Tích hợp [ReadingGuideBanner](file:///d:/sontayweb/aptis-elearning/frontend/src/components/reading-guide-banner.tsx) chiến thuật target B2 (đạt tối thiểu 36/50 điểm, được phép sai 14 điểm). | ✅ Hoàn thành |
| **🎧 Listening** | **L1** | Chuẩn hóa luồng Audio Aptis thực tế | Trong bài thi thật, nội dung thoại là file âm thanh ẩn qua tai nghe, màn hình chỉ hiện câu hỏi. Trước đó, hệ thống lại hiển thị câu hỏi trước hoặc TTS đọc lại chính câu hỏi prompt thay vì phát đoạn thoại hội thoại ngữ cảnh. | Cập nhật logic runner [listening/[id]/page.tsx](file:///d:/sontayweb/aptis-elearning/frontend/src/app/listening/%5Bid%5D/page.tsx): Bắt buộc nghe hết audio đoạn thoại thực tế (được trích xuất từ phần transcript ngữ cảnh) mới hiển thị câu hỏi và đáp án lựa chọn; đồng thời cập nhật service TTS fallback đọc đúng transcript bài nghe. | ✅ Hoàn thành |
| | **L2** | Bổ sung tên Topic ngữ cảnh Part 2, 3, 4 | Các bài nghe chỉ có mã ID số và tiêu đề chung chung, thiếu ngữ cảnh tình huống (đặt vé máy bay, dự báo thời tiết, thông báo ga tàu...). | Xây dựng ngân hàng [listening-topics-bank.ts](file:///d:/sontayweb/aptis-elearning/frontend/src/data/listening-topics-bank.ts) bổ sung tên tình huống thực tế kèm nhãn sticker độ ưu tiên đề thi cho từng part. | ✅ Hoàn thành |
| **✍️ Writing** | **W1** | Phân chia Part 2, 3, 4 theo Câu Lạc Bộ (CLB) | Đề thi Aptis Writing được thiết kế theo 1 Câu Lạc Bộ xuyên suốt (Part 2 trả lời form CLB, Part 3 trò chuyện với 3 thành viên CLB, Part 4 thông báo của CLB). Hệ thống cũ xem từng part là các câu hỏi rời rạc, mất tính logic của đề. | Xây dựng [writing-clubs-bank.ts](file:///d:/sontayweb/aptis-elearning/frontend/src/data/writing-clubs-bank.ts) liên kết chặt chẽ ngữ cảnh CLB (Travel Club, Book Club, Fitness Club...) song ngữ Anh - Việt xuyên suốt đề thi tại [writing/[id]/page.tsx](file:///d:/sontayweb/aptis-elearning/frontend/src/app/writing/%5Bid%5D/page.tsx). | ✅ Hoàn thành |
| | **W2** | Part 4: Đủ 2 Thư (Email Bạn thân & Email Quản lý) | Runner cũ chỉ render 1 khung soạn thảo văn bản hoặc chỉ có 1 câu hỏi gửi bạn, thiếu hẳn phần viết email trang trọng (Formal) gửi cho Club Manager/Chủ tịch CLB (120-150 từ). | Cập nhật runner [writing/[id]/page.tsx](file:///d:/sontayweb/aptis-elearning/frontend/src/app/writing/%5Bid%5D/page.tsx): Đảm bảo Part 4 luôn hiển thị đủ 2 bài: **Email 1** gửi bạn thân (~50 từ, informal) và **Email 2** gửi Club Manager (120-150 từ, formal) kèm bộ đếm từ độc lập. | ✅ Hoàn thành |

---

## III. PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE ANALYSIS) THEO TỪNG NHÓM KỸ NĂNG

### 1. Kỹ năng Speaking
1. **Thiếu hình ảnh thực tế (Part 2 & Part 3):**
   - *Nguyên nhân:* File tài liệu Word (`.docx`) lưu trữ hình ảnh dưới dạng drawing object trong thư mục con `word/media/` với quan hệ liên kết `r:embed` trong `document.xml.rels`. Các công cụ trích xuất text thuần túy (như `mammoth` hoặc `docx-parser` thông thường) đã bỏ qua các node XML đồ họa này, khiến dữ liệu đề thi trên web bị thiếu trường `imageUrl`.
   - *Biện pháp:* Viết script bóc tách trực tiếp bằng `AdmZip`, quét thẻ `<a:blip r:embed="..."/>`, xuất ảnh gốc thành các file PNG/JPG nét cao vào `frontend/public/uploads/speaking/` và map đúng ID vào ngân hàng đề.
2. **Sai lệch thời gian và hiển thị ở Part 4:**
   - *Nguyên nhân:* Code runner kế thừa component chạy câu hỏi tuần tự (next step 1 $\rightarrow$ 2 $\rightarrow$ 3) của Part 1/Part 2, gán nhầm timer 45 giây cho từng câu đơn lẻ. Trong khi quy chế thi Aptis British Council quy định thí sinh được phát cả 3 câu hỏi cùng một lúc, có 60 giây suy nghĩ/ghi chú và 120 giây nói liên tục.
   - *Biện pháp:* Viết lại state render của Part 4: loại bỏ chia bước nhỏ, hiển thị cả 3 câu trên cùng 1 card và quản lý timer kép: Phase 1 (60s chuẩn bị) $\rightarrow$ Phase 2 (120s ghi âm).

### 2. Kỹ năng Reading
1. **Dính liền văn bản câu lẻ Part 1:**
   - *Nguyên nhân:* File docx định dạng các câu hỏi trong Part 1 liền mạch mà không dùng ngắt đoạn `w:p` riêng biệt hoặc thiếu ký tự phân cách rõ ràng. Khi backend ingest dữ liệu, toàn bộ đoạn văn bị gộp thành 1 chuỗi dài khiến giao diện hiển thị 1 khối text thay vì 5 câu trắc nghiệm đục lỗ độc lập.
   - *Biện pháp:* Bóc tách lại bằng thuật toán nhận diện số thứ tự câu `^[1-5]$`, tách prompt kèm từ đục lỗ `[gap]` và xây dựng ngân hàng Marathon câu lẻ độc lập.
2. **Thiếu ngữ cảnh chủ đề Part 2, 3, 4:**
   - *Nguyên nhân:* Khi import dữ liệu, tiêu đề chỉ lấy số thứ tự ("Đề 1", "Đề 2") mà không ánh xạ sang Topic Name thực tế được lưu trong tài liệu bài đọc.
   - *Biện pháp:* Tạo file mapping `reading-topics-bank.ts` đối soát 100% đề thi với tên topic thực tế.

### 3. Kỹ năng Listening
1. **Lỗi luồng phát Audio & Hiện câu hỏi:**
   - *Nguyên nhân:* Trước đây UI hiển thị câu hỏi và các phương án chọn ngay từ đầu; đồng thời backend tạo file audio TTS bằng cách đọc lại chính câu hỏi prompt (`question.prompt`) thay vì đọc đoạn hội thoại thoại thoại ẩn (`explanation` / `audio_script`). Điều này trái ngược với kỳ thi thật (học viên chỉ được nghe đoạn đàm thoại qua tai nghe, sau đó mới nhìn câu hỏi để chọn đáp án).
   - *Biện pháp:* Cập nhật logic: Audio phát đoạn thoại thực tế trước, trong thời gian audio đang phát sẽ làm mờ/ẩn phương án chọn, sau khi kết thúc audio mới cho phép chọn đáp án; đồng thời cấu hình service TTS trích xuất fallback từ trường transcript/passage thoại.

### 4. Kỹ năng Writing
1. **Thiếu tính kết nối Câu Lạc Bộ (CLB):**
   - *Nguyên nhân:* Cơ sở dữ liệu lưu các phần Part 2, Part 3, Part 4 dưới dạng các câu hỏi độc lập (separate questions) mà không có trường khoá ngoại hoặc meta gắn kết vào một câu lạc bộ cụ thể.
   - *Biện pháp:* Bổ sung bộ dữ liệu `writing-clubs-bank.ts` đóng vai trò là "Context Wrapper", bao bọc Part 2, Part 3, Part 4 vào chung một chủ đề CLB song ngữ Anh - Việt.
2. **Thiếu phần viết Email Formal (Email gửi Quản lý CLB) ở Part 4:**
   - *Nguyên nhân:* Runner chỉ render 1 ô input cho câu hỏi đầu tiên của Part 4 (Email informal cho bạn thân), bỏ sót câu hỏi thứ hai (Email formal cho Club President/Manager).
   - *Biện pháp:* Cập nhật schema và UI runner hiển thị 2 tab/2 box độc lập: Box 1 (Informal ~50 từ) và Box 2 (Formal 120-150 từ) với bộ đếm từ riêng biệt cho từng bài viết.

---

## IV. TÀI NGUYÊN VÀ DỮ LIỆU ĐÃ TÍCH HỢP

### 1. Ngân hàng dữ liệu mới (Frontend Data Banks)
1. `frontend/src/data/speaking-part1-bank.ts`: 90+ câu hỏi phỏng vấn cá nhân lẻ Part 1 kèm câu trả lời mẫu band B2/C1.
2. `frontend/src/data/speaking-part2-bank.ts`: 25 bộ tranh Part 2 kèm link ảnh, bộ từ vựng song ngữ, 3 câu hỏi gợi ý.
3. `frontend/src/data/speaking-part3-bank.ts`: 15 bộ tranh so sánh Part 3 kèm link ảnh, cụm so sánh đối chiếu, 3 câu hỏi gợi ý.
4. `frontend/src/data/reading-part1-bank.ts`: Ngân hàng câu lẻ đục lỗ Part 1 kèm options, đáp án đúng và bản dịch tiếng Việt.
5. `frontend/src/data/reading-topics-bank.ts`: Danh mục chủ đề chuẩn hóa kèm nhãn sticker cho các đề Reading Part 2, 3, 4.
6. `frontend/src/data/listening-topics-bank.ts`: Danh mục chủ đề ngữ cảnh chuẩn hóa cho bài nghe kèm nhãn sticker.
7. `frontend/src/data/writing-clubs-bank.ts`: Bộ ngữ cảnh CLB (Tên, mô tả, sự kiện, thông báo của Ban quản trị) dùng chung cho Part 2, 3, 4.

### 2. Hình ảnh và Media bóc tách
- **Speaking Part 2:** 25 ảnh định dạng PNG/JPG chất lượng cao tại thư mục `frontend/public/uploads/speaking/part2/` (được bóc tách trực tiếp từ file docx tài liệu gốc).
- **Speaking Part 3:** 15 ảnh định dạng PNG/JPG tại thư mục `frontend/public/uploads/speaking/part3/`.

### 3. Các trang và component mới
- `frontend/src/components/speaking-guide-banner.tsx`: Banner chiến thuật thi Speaking.
- `frontend/src/components/reading-guide-banner.tsx`: Banner mục tiêu 36/50 điểm Reading.
- `frontend/src/app/speaking/marathon/page.tsx`: Giao diện luyện câu lẻ và tranh ảnh Speaking Part 1, 2, 3 độc lập.
- `frontend/src/app/reading/marathon/page.tsx`: Giao diện luyện điền từ câu lẻ Reading Part 1 kèm chấm điểm tức thì.

---

## V. KẾT QUẢ KIỂM THỬ KỸ THUẬT

1. **Frontend Next.js Build (`npm run build`):**
   - Kết quả: **Thành công 100% (0 lỗi)**
   - Đã sinh đầy đủ **47/47 routes** (Static & Dynamic) bao gồm toàn bộ runner và trang Marathon mới.
2. **Backend TypeScript Check (`npm run build`):**
   - Kết quả: **Thành công 100% (0 lỗi)**
3. **Tính toàn vẹn dữ liệu:**
   - Dữ liệu bóc tách từ các tài liệu gốc (`SPEAKING/`, `READING/`) đã được import đầy đủ, không phát sinh lỗi broken image hay thiếu câu hỏi.
