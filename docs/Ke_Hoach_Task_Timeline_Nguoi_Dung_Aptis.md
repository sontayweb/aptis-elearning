# KẾ HOẠCH TIMELINE & DANH MỤC TASK THEO GÓC NHÌN NGƯỜI DÙNG (USER-CENTRIC TIMELINE)
## HỆ THỐNG LUYỆN THI TRỰC TUYẾN APTIS KỲ TÍCH (APTIS E-LEARNING)

> **Căn cứ tài liệu:** 
> - Tổng hợp từ file kỹ thuật: `docs/Bao_Cao_Timeline_Hoan_Thanh_Cuon_Chieu_Aptis.xlsx` & `docs/Bao_Cao_Sheet_Timeline_Hoan_Thanh_Cuon_Chieu_Web_TA.md`
> - Yêu cầu nghiệp vụ: `docs/requirment-thêm/Cải Thiện Web TA.docx` & `docs/requirment-thêm/Bổ sung.docx`
> 
> **Mục đích:** Chuyển đổi toàn bộ các thuật ngữ kỹ thuật (API, Seeding, Component, Database schema, Parser, TTS Staging...) thành **ngôn ngữ trải nghiệm người dùng (User Experience)**, **User Stories**, và **Lợi ích thực tế cho học viên / quản trị viên**.

---

## I. MA TRẬN ĐỐI CHIẾU: KỸ THUẬT vs. NGÔN NGỮ NGƯỜI DÙNG

| Khía cạnh | Góc nhìn Kỹ thuật (Dev / Codebase) | Góc nhìn Người dùng (User / Học viên & Vận hành) |
| :--- | :--- | :--- |
| **Cách tiếp cận** | "Làm thế nào để chạy được code và lưu vào DB?" | "Tôi nhìn thấy gì, bấm vào đâu và nhận được giá trị gì?" |
| **Mã Pro Go-Live** | Seed DB mã `GOLIVE14`, API `POST /api/payment/redeem-code` | Nút "Nhận 14 ngày VIP Pro" 1 chạm ngay đầu trang, tự động mở khóa toàn bộ đề thi mà không cần gõ mã. |
| **Lịch khai giảng** | `course-class-banner.tsx`, model `CourseLeadRegistration` | Bảng xem lịch lớp Zoom tối 3-5-7, bấm vào xem lộ trình 12 buổi và quét mã VietQR giữ chỗ ưu đãi 1.400.000đ. |
| **Writing Part 4** | Tách 2 Form state, validate max words | 2 ô viết thư riêng biệt (Thư gửi bạn 50 từ và Thư gửi quản lý 150 từ), có đồng hồ đếm từ đổi màu nhắc nhở độ dài. |
| **Speaking Audio** | Custom player fix lỗi WebM infinite duration Chromium | Nghe lại bài thu âm mượt mà, tua tiến/lùi chính xác từng giây không bị giật lag, xem điểm AI 4 tiêu chí. |
| **Reading Tools** | Selection popover, render Highlighted spans | Bút dạ quang bôi màu Vàng (dẫn chứng) và Xanh (từ khóa) trực tiếp trên bài đọc dài Part 3 & 4. |
| **Listening Script** | SpeechSynthesis fallback, Drawer/Accordion toggle | Nghe audio chuẩn giọng Anh - Anh; có nút "Xem kịch bản & bản dịch" thu gọn, cần mới bấm mở để đối chiếu. |
| **Từ vựng SRS** | API `POST /api/import-sheet`, Spaced Repetition algo | Thẻ Flashcard lật 3D học từ vựng, tự động nhắc ôn lại từ khó, nạp được toàn bộ danh sách từ link Google Sheet của cô giáo. |

---

## II. BẢNG TỔNG HỢP TIMELINE & TASK DÀNH CHO USER (USER-CENTRIC TIMELINE)

| Giai đoạn (Sprint) | Mã Task | Tên Tính Năng Người Dùng | Đối Tượng Thụ Hưởng | Lợi Ích & Trải Nghiệm Học Tập Thực Tế | Trạng Thái |
| :---: | :---: | :--- | :---: | :--- | :---: |
| **SPRINT 1**<br>*(Tuần 1)*<br>**Khởi Động & Ưu Đãi** | **TASK-U01** | **Nhận gói VIP PRO 14 ngày miễn phí** | Toàn bộ học viên mới & cũ | Học viên vào web nhận ngay 14 ngày trải nghiệm trọn gói 860+ bộ đề thi và AI chấm điểm mà không tốn phí. | ✅ Sẵn sàng |
| | **TASK-U02** | **Thanh thông báo nhận quà 1 chạm** | Học viên truy cập web | Không cần nhớ mã phức tạp; chỉ cần bấm "Kích hoạt ngay" trên thanh đầu trang là tài khoản tự nâng cấp VIP. | ✅ Sẵn sàng |
| **SPRINT 2**<br>*(Tuần 1 - 2)*<br>**Lớp Học & Vinh Danh** | **TASK-U03** | **Bảng vinh danh thành tích học viên** | Học viên & Phụ huynh | Xem bảng điểm thật (B2/C1) và hình ảnh review thực tế từ Facebook để an tâm và có thêm động lực học. | ✅ Sẵn sàng |
| | **TASK-U04** | **Tra cứu lịch khai giảng lớp học mới** | Người có nhu cầu học | Nắm rõ lịch các lớp Zoom học buổi tối (Tối 3-5-7 từ 20h00 - 21h30), chu kỳ 10 ngày mở một lớp mới. | ✅ Sẵn sàng |
| | **TASK-U05** | **Xem lộ trình chi tiết 12 buổi học** | Người quan tâm khóa học | Bấm vào lớp xem chi tiết nội dung từng buổi từ Speaking P1-P4, Writing, Reading đến Tổng ôn đề sát thi. | ✅ Sẵn sàng |
| | **TASK-U06** | **Đăng ký giữ chỗ & Quét VietQR học phí** | Học viên đăng ký khóa | Nhận mức ưu đãi 1.400.000đ; quét mã QR tự điền tiền và nội dung, hoặc gọi trực tiếp Hotline/Zalo tư vấn 24/7. | ✅ Sẵn sàng |
| **SPRINT 3**<br>*(Tuần 2 - 3)*<br>**Luyện Thi Speaking** | **TASK-U07** | **Hướng dẫn chiến lược phòng thi Nói** | Học viên luyện Speaking | Xem bảng phân bổ thời gian và mẹo trả lời điểm cao trước khi bấm vào phòng thu âm. | ✅ Sẵn sàng |
| | **TASK-U08** | **Luyện phản xạ Part 1 đa dạng chủ đề** | Học viên luyện Speaking | Luyện 3 câu hỏi cá nhân quen thuộc (Gia đình, Thời tiết, Công việc...) với đồng hồ 30 giây chuẩn thi thật. | ✅ Sẵn sàng |
| | **TASK-U09** | **Xem tranh & Bảng gợi ý từ vựng ăn điểm (Part 2 & 3)** | Học viên luyện Speaking | Vừa nhìn tranh sắc nét, vừa xem ngay cột gợi ý từ vựng, cụm Collocation và câu mẫu theo 2 cấp độ B1 & B2+. | ✅ Sẵn sàng |
| | **TASK-U10** | **Đồng hồ chuẩn phòng thi Part 4** | Học viên luyện Speaking | Đúng chuẩn British Council: 60 giây ghi chú nháp $\rightarrow$ Tiếng bíp tự động $\rightarrow$ 120 giây (2 phút) nói liên tục. | ✅ Sẵn sàng |
| | **TASK-U11** | **Nhận biết đề thi "Trúng tủ" (Hot tag 🔥)** | Học viên luyện Speaking | Các bức tranh và chủ đề hay gặp trong các đợt thi gần nhất được gắn biểu tượng 🔥 để ưu tiên luyện trước. | ✅ Sẵn sàng |
| | **TASK-U12** | **Nghe lại bài nói & Nhận xét từ AI** | Học viên luyện Speaking | Bấm nghe lại giọng đọc của mình mượt mà, nhận bảng điểm AI đánh giá theo chuẩn khung tham chiếu Châu Âu (CEFR). | ✅ Sẵn sàng |
| **SPRINT 4**<br>*(Tuần 3 - 4)*<br>**Luyện Thi Reading** | **TASK-U13** | **Cẩm nang làm bài Đọc hiểu 4 phần** | Học viên luyện Reading | Xem gợi ý phân chia thời gian (P1: 5p, P2: 7p, P3: 10p, P4: 13p) và kỹ năng Skimming / Scanning nhanh. | ✅ Sẵn sàng |
| | **TASK-U14** | **Luyện sắp xếp câu Part 2 rõ ràng** | Học viên luyện Reading | Mỗi câu chuyện kể được tách bạch rõ ràng, không bị lẫn lộn giữa các đoạn văn. | ✅ Sẵn sàng |
| | **TASK-U15** | **Bút dạ quang (Highlight) trên bài đọc dài** | Học viên luyện Reading | Bôi đen đoạn văn để tô màu Vàng (dẫn chứng câu trả lời) hoặc Xanh (từ khóa chính), có nút xóa màu tiện lợi. | ✅ Sẵn sàng |
| | **TASK-U16** | **Nối tiêu đề bài đọc dài Part 4** | Học viên luyện Reading | Đọc trọn vẹn 7 đoạn văn học thuật và chọn tiêu đề tương ứng qua hộp chọn trực quan. | ✅ Sẵn sàng |
| | **TASK-U17** | **Bộ đề Đọc hiểu ưu tiên theo độ Hot** | Học viên luyện Reading | Các đề thi có xác suất ra cao nhất luôn được xếp lên đầu danh sách để tiết kiệm thời gian tìm kiếm. | ✅ Sẵn sàng |
| **SPRINT 5**<br>*(Tuần 4 - 5)*<br>**Luyện Thi Listening** | **TASK-U18** | **Quy tắc và bẫy đề thi Nghe hiểu** | Học viên luyện Listening | Hướng dẫn cách nghe bắt từ khóa, phân bổ số lần nghe cho từng Part để tránh mất điểm oan. | ✅ Sẵn sàng |
| | **TASK-U19** | **Nghe âm thanh chuẩn giọng Anh - Anh** | Học viên luyện Listening | 100% câu hỏi đều có giọng đọc rõ ràng, chuẩn phát âm bản ngữ, giới hạn nghe đúng 2 lần theo luật thi. | ✅ Sẵn sàng |
| | **TASK-U20** | **Xem lời thoại (Script) & Bản dịch tiếng Việt** | Học viên luyện Listening | Sau khi làm xong, bấm mở thanh kịch bản để xem chi tiết từng câu thoại và bản dịch đối chiếu giải thích đáp án. | ✅ Sẵn sàng |
| | **TASK-U21** | **Bảng chuyển câu theo từng phần gọn gàng** | Học viên luyện Listening | Dưới chân trang chỉ hiện các câu của phần đang làm (Part 1 chỉ hiện câu 1–13), không bị rối mắt. | ✅ Sẵn sàng |
| **SPRINT 6**<br>*(Tuần 5 - 6)*<br>**Luyện Thi Writing** | **TASK-U22** | **Cẩm nang viết bài đạt điểm B2/C** | Học viên luyện Writing | Nắm rõ tiêu chí chấm ngữ pháp, từ vựng và bố cục bài viết 50 phút của kỳ thi Aptis. | ✅ Sẵn sàng |
| | **TASK-U23** | **Luyện viết theo bối cảnh Câu lạc bộ (Part 1 - 3)** | Học viên luyện Writing | Điền mẫu đơn gia nhập CLB (Part 2) và trò chuyện với 3 thành viên CLB (Part 3) theo tình huống thực tế. | ✅ Sẵn sàng |
| | **TASK-U24** | **Phân tách 2 bài viết thư riêng biệt (Part 4)** | Học viên luyện Writing | • Thư 1 (Gửi bạn thân): Có ô viết riêng, gợi ý 50 từ, văn phong thân mật.<br>• Thư 2 (Gửi ban quản lý): Có ô viết riêng, gợi ý 150 từ, văn phong trang trọng. | ✅ Sẵn sàng |
| | **TASK-U25** | **Đồng hồ đếm số từ thông minh** | Học viên luyện Writing | Đếm số từ đang gõ theo thời gian thực; đổi màu báo hiệu khi đạt đủ số lượng từ yêu cầu để tránh bị trừ điểm. | ✅ Sẵn sàng |
| **SPRINT 7**<br>*(Tuần 6 - 7)*<br>**Học Từ Vựng SRS** | **TASK-U26** | **Nạp từ vựng từ link Google Sheet** | Học viên & Giáo viên | Chỉ cần dán đường link Google Sheet từ vựng của lớp học là hệ thống tự nhận diện từ, nghĩa và chủ đề. | ✅ Sẵn sàng |
| | **TASK-U27** | **Thẻ Flashcard lật 3D kèm âm thanh** | Học viên ôn từ vựng | Bấm lật mặt trước (tiếng Anh + phát âm) và mặt sau (nghĩa tiếng Việt + ví dụ), hỗ trợ ghi nhớ sâu. | ✅ Sẵn sàng |
| | **TASK-U28** | **Thuật toán ôn tập nhắc nhớ ngắt quãng (SRS)** | Học viên ôn từ vựng | Hệ thống tự động tính toán đưa các từ vựng học viên hay quên ra hỏi lại vào ngày hôm sau. | ✅ Sẵn sàng |
| **SPRINT 8**<br>*(Tuần 7 - 8)*<br>**Vận Hành & Quản Trị** | **TASK-U29** | **Bộ lọc đề thi trọng tâm theo Huy hiệu Lửa 🔥** | Học viên thi thử Full | Dễ dàng lọc ra danh sách các bộ đề cấp tốc, đề dự đoán xác suất vào cao của tháng. | ✅ Sẵn sàng |
| | **TASK-U30** | **Bảng hướng dẫn thao tác quản trị mượt mà** | Giáo viên / Admin | Popup hướng dẫn trong trang quản trị tự động căn chỉnh vị trí trên màn hình, không bị che khuất nút bấm. | ✅ Sẵn sàng |
| | **TASK-U31** | **Nhật ký gửi email thông báo học tập** | Quản lý trung tâm | Kiểm tra được danh sách email kết quả thi, email kích hoạt tài khoản gửi đến học viên có thành công không. | ✅ Sẵn sàng |
| | **TASK-U32** | **Bảo vệ an toàn kho đề thi và bài làm** | Toàn bộ người dùng | Toàn bộ kho 1,724+ đề thi và lịch sử học tập của học viên luôn được giữ an toàn tuyệt đối khi cập nhật tính năng mới. | ✅ Sẵn sàng |

---

## III. MÔ TẢ CHI TIẾT CÁC TÍNH NĂNG TRỌNG TÂM (USER STORIES & CRITERIA)

### 1. Trải Nghiệm Nhận Ưu Đãi & Lớp Học (Sprints 1 & 2)

#### 🎯 Task U-01 & U-02: Nhận 14 Ngày Trải Nghiệm VIP Pro Với 1 Chạm
- **User Story:** Là một học viên mới truy cập website, tôi muốn nhận ngay gói trải nghiệm VIP mà không cần phải tìm và gõ mã phức tạp, để có thể làm thử các bộ đề thi thử chất lượng cao.
- **Trải nghiệm thực tế:**
  1. Khi vào Trang chủ hoặc Bàn làm việc (Dashboard), học viên thấy dải banner màu nổi bật trên cùng: *"Mừng Go-Live — Nhận 14 ngày VIP Pro luyện trọn bộ đề thi Aptis"*.
  2. Học viên chỉ cần bấm nút **"Kích hoạt 14 ngày ngay"**.
  3. Hệ thống hiện thông báo thành công: Tài khoản được nâng cấp VIP ngay tức khắc, mở khóa toàn bộ 860+ bộ đề và lượt chấm điểm bài nói/viết.
- **Tiêu chí nghiệm thu (UAC):**
  - [x] Banner hiển thị rõ ràng trên cả máy tính và điện thoại.
  - [x] Bấm nút 1 chạm tài khoản nhận đủ 14 ngày hạn dùng PRO.
  - [x] Có nút "Sao chép mã" nếu muốn gửi tặng bạn bè.

#### 🎯 Task U-05 & U-06: Xem Lộ Trình Lớp Học & Đăng Ký Khóa Học Ưu Đãi 1.400.000đ
- **User Story:** Là một người đang chuẩn bị thi Aptis, tôi muốn xem lịch học và nội dung từng buổi của khóa cấp tốc, đồng thời có thể thanh toán giữ chỗ nhanh bằng tài khoản ngân hàng.
- **Trải nghiệm thực tế:**
  1. Học viên bấm vào thẻ "Lớp khai giảng sắp tới" trên Dashboard.
  2. Một bảng thông tin hiện ra với 2 phần rõ ràng:
     - **Phần 1 - Lộ trình 12 buổi:** Hiển thị chi tiết từng tuần học (Tuần 1: Chiến lược làm bài; Tuần 2: Chinh phục Speaking; Tuần 3: Bí quyết viết thư 150 từ; Tuần 4: Luyện đề tổng hợp sát giờ thi). Lịch học cố định tối 3-5-7 lúc 20h00 - 21h30 qua Zoom.
     - **Phần 2 - Đăng ký giữ chỗ:** Hiển thị mức học phí ưu đãi **1.400.000đ/khóa** kèm mã VietQR MB Bank.
  3. Học viên chỉ cần mở app ngân hàng quét mã QR (số tiền và nội dung đã tự điền sẵn) và nhập Số điện thoại/Zalo để trung tâm xếp lớp; hoặc bấm vào nút **Hotline 0379 866 596** / **Zalo** để được tư vấn trực tiếp.
- **Tiêu chí nghiệm thu (UAC):**
  - [x] Bấm vào lịch khai giảng mở popup đầy đủ lịch học và lộ trình.
  - [x] Mã QR quét được chuẩn thông tin tài khoản MB Bank Nguyễn Duy Cương.
  - [x] Điền số điện thoại bấm gửi được ghi nhận thành công.

---

### 2. Trải Nghiệm Luyện Thi 4 Kỹ Năng Sát Đề Thật (Sprints 3, 4, 5, 6)

#### 🎯 Task U-09: Gợi Ý Từ Vựng & Cụm Từ Bên Cạnh Tranh Nói (Speaking Part 2 & 3)
- **User Story:** Là một học viên còn yếu vốn từ, khi luyện thi Nói miêu tả tranh, tôi muốn vừa nhìn thấy tranh vừa có danh sách từ vựng gợi ý bên cạnh để tập phản xạ nhanh và đạt điểm B2+.
- **Trải nghiệm thực tế:**
  1. Màn hình được chia làm 2 bên rất khoa học:
     - **Bên trái:** Bức tranh phòng thi sắc nét, đúng tỷ lệ chuẩn của đề thi thật.
     - **Bên phải:** Bảng gợi ý từ vựng ăn điểm chia làm 2 mức độ:
       + *Mức cơ bản (B1):* Các từ vựng mô tả hành động, màu sắc, vị trí dễ nhớ.
       + *Mức nâng cao (B2+):* Các cụm từ liên kết (Collocations), mẫu câu mở bài ấn tượng và mẫu suy đoán cảm xúc của nhân vật.
  2. Học viên vừa nhìn tranh vừa áp dụng từ gợi ý vào bài nói ghi âm của mình.
- **Tiêu chí nghiệm thu (UAC):**
  - [x] Ảnh và bảng từ vựng hiển thị song song trên máy tính, xếp tầng hợp lý trên điện thoại.
  - [x] Có đầy đủ gợi ý mẫu câu cho cả tranh so sánh Part 3.

#### 🎯 Task U-10: Chuẩn Hóa Thời Gian Phòng Thi Nói Part 4
- **User Story:** Là một thí sinh, tôi muốn đồng hồ bấm giờ hoạt động đúng 100% như phòng thi thật British Council để làm quen với áp lực thời gian.
- **Trải nghiệm thực tế:**
  1. Khi vào Part 4, màn hình hiện đồng hồ đếm ngược **60 giây** để học viên chuẩn bị dàn ý và ghi chép nháp.
  2. Hết 60 giây, hệ thống phát **tiếng bíp chuẩn phòng thi** và tự động chuyển sang chế độ ghi âm **120 giây (2 phút)** liên tục cho cả 3 câu hỏi.
  3. Thí sinh nói xong có thể nghe lại bài nói và bấm nộp bài để AI chấm điểm.
- **Tiêu chí nghiệm thu (UAC):**
  - [x] Đúng nhịp: 60s suy nghĩ $\rightarrow$ Bíp $\rightarrow$ 120s ghi âm.
  - [x] Trình phát âm thanh nghe lại mượt mà, tua được chính xác từng giây.

#### 🎯 Task U-15: Bút Dạ Quang Tô Màu Dẫn Chứng Trên Bài Đọc (Reading Part 3 & 4)
- **User Story:** Là người luyện bài đọc dài, tôi muốn có công cụ bôi màu đánh dấu dẫn chứng câu trả lời để không phải đọc đi đọc lại tìm vị trí thông tin.
- **Trải nghiệm thực tế:**
  1. Khi đọc đoạn văn Part 3 hoặc Part 4, học viên lấy chuột bôi đen một cụm từ hoặc câu văn.
  2. Ngay lập tức một menu nhỏ hiện lên:
     - Chọn 🟡 **Màu Vàng:** Đánh dấu câu chứa dẫn chứng trả lời câu hỏi.
     - Chọn 🟢 **Màu Xanh:** Đánh dấu từ khóa chính cần đối chiếu.
     - Chọn 🗑️ **Xóa màu:** Bỏ đánh dấu nếu đổi ý.
  3. Vết bôi màu được giữ nguyên khi học viên chuyển qua lại giữa các câu hỏi trong bài đọc.
- **Tiêu chí nghiệm thu (UAC):**
  - [x] Bôi đen chữ hiện ngay bảng chọn màu.
  - [x] Màu sắc hiển thị rõ nét, dễ nhìn, không làm rối văn bản.
  - [x] Nút xóa màu hoạt động chính xác.

#### 🎯 Task U-20: Xem Lời Thoại (Audio Script) & Bản Dịch Tiếng Việt Sau Khi Nghe
- **User Story:** Là học viên tự ôn luyện nghe, sau khi làm bài xong tôi muốn xem lại kịch bản lời thoại tiếng Anh và bản dịch tiếng Việt để biết vì sao mình nghe sai.
- **Trải nghiệm thực tế:**
  1. Trong lúc làm bài thi, kịch bản được ẩn đi hoàn toàn để học viên tập trung nghe tự nhiên.
  2. Khi cần học kỹ hoặc sau khi nộp bài, học viên bấm vào nút **"Xem Audio Script & Bản dịch"**.
  3. Một khung nội dung mở ra hiển thị song ngữ: Cột lời thoại tiếng Anh chuẩn và cột giải nghĩa tiếng Việt chi tiết tương ứng từng câu.
- **Tiêu chí nghiệm thu (UAC):**
  - [x] Mặc định nút được thu gọn để không lộ đáp án lúc làm bài.
  - [x] Bấm nút bung ra mượt mà, bản dịch rõ ràng, sát nghĩa đề thi.

#### 🎯 Task U-24 & U-25: Viết 2 Bức Thư Riêng Biệt & Đếm Số Từ Thông Minh (Writing Part 4)
- **User Story:** Là thí sinh làm bài Viết, tôi muốn giao diện tách riêng 2 bức thư (cho bạn thân và cho quản lý CLB) với bộ đếm từ tự động để không bị viết nhầm đề hoặc viết thiếu/thừa từ.
- **Trải nghiệm thực tế:**
  1. Giao diện chia thành 2 phần tách biệt hoàn toàn:
     - **Bức thư 1 (Gửi bạn thân):** Có khung nhập riêng, hiển thị gợi ý độ dài **40–50 từ** và phong cách viết thân mật (Informal).
     - **Bức thư 2 (Gửi quản lý CLB):** Có khung nhập riêng, hiển thị gợi ý độ dài **120–150 từ** và phong cách viết trang trọng (Formal).
  2. Mỗi khung có một bộ đếm số từ theo thời gian thực (ví dụ: `45/50 từ` hoặc `130/150 từ`).
  3. Thanh đo số từ tự động đổi từ màu vàng sang màu xanh lá cây khi học viên viết đạt trong khoảng an toàn, giúp học viên tự tin nộp bài.
- **Tiêu chí nghiệm thu (UAC):**
  - [x] 2 bài viết được lưu độc lập, không bị đè chữ của nhau.
  - [x] Bộ đếm từ chính xác từng từ khi gõ hoặc xóa.
  - [x] Có thanh báo dung lượng trực quan.

---

### 3. Học Từ Vựng Thông Minh & Quản Trị Hệ Thống (Sprints 7 & 8)

#### 🎯 Task U-26 & U-27: Nạp Từ Vựng Từ Google Sheet & Học Qua Thẻ Flashcard 3D
- **User Story:** Là học viên hoặc giáo viên, tôi muốn nhập cả bảng từ vựng từ file Google Sheet của lớp học để ôn tập trên web bằng thẻ Flashcard tiện lợi.
- **Trải nghiệm thực tế:**
  1. Học viên vào mục **Học Từ Vựng**, bấm "Nạp từ vựng mới" và dán link Google Sheet công khai của lớp vào.
  2. Hệ thống hiển thị bảng xem trước (Preview) danh sách từ, phiên âm và nghĩa tiếng Việt để kiểm tra.
  3. Bấm "Bắt đầu học": Màn hình mở ra bộ thẻ Flashcard 3D:
     - Bấm vào thẻ để lật mặt xem nghĩa và ví dụ.
     - Bấm biểu tượng loa để nghe phát âm chuẩn giọng bản xứ.
     - Chọn mức độ nhớ: "Chưa thuộc" hoặc "Đã nhớ".
  4. Hệ thống tự động ghi nhớ các từ "Chưa thuộc" để nhắc học viên ôn lại vào ngày tiếp theo.
- **Tiêu chí nghiệm thu (UAC):**
  - [x] Dán link Google Sheet nạp thành công không cần cài đặt phần mềm.
  - [x] Thẻ lật 3D hoạt động mượt mà cả trên điện thoại.
  - [x] Có phát âm audio chuẩn cho từng từ vựng.

#### 🎯 Task U-29: Bộ Lọc Đề Thi Sát Kỳ Thi Thật Nhất (Huy Hiệu 🔥)
- **User Story:** Là học viên sắp đến ngày thi thật, tôi muốn biết những bộ đề nào đang "Hot" và có xác suất ra cao nhất trong tháng để ưu tiên ôn luyện trước.
- **Trải nghiệm thực tế:**
  1. Tại trang danh sách đề thi (Full Test, Đọc, Nghe, Nói, Viết), các đề thi trọng tâm được gắn biểu tượng ngọn lửa màu cam **🔥 Hot** hoặc số sao dự đoán.
  2. Danh sách đề mặc định tự động sắp xếp những đề có độ Hot cao nhất lên đầu tiên.
  3. Học viên tiết kiệm được tối đa thời gian tìm kiếm và tập trung đúng vào trọng tâm ôn luyện.
- **Tiêu chí nghiệm thu (UAC):**
  - [x] Biểu tượng Hot 🔥 hiển thị bắt mắt trên thẻ bài thi.
  - [x] Đề hot luôn được đưa lên đầu danh sách theo mặc định.

---

## IV. BẢNG CHECKLIST NGHIỆM THU DÀNH CHO USER / TESTER

Khi tiến hành kiểm thử nghiệm thu (User Acceptance Testing - UAT), người dùng chỉ cần thực hiện 8 bước trải nghiệm sau:

| STT | Trải nghiệm kiểm thử | Thao tác người dùng | Kết quả mong đợi | Đánh giá |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Nhận quà Go-Live | Bấm nút kích hoạt tại banner đầu trang chủ. | Hiện thông báo thành công, tài khoản có hạn dùng PRO 14 ngày. | 🟩 ĐẠT |
| **2** | Đăng ký lớp học | Bấm vào thẻ Lịch khai giảng trên Dashboard. | Hiện popup lộ trình 12 buổi, mã QR MB Bank 1.400.000đ và Hotline. | 🟩 ĐẠT |
| **3** | Luyện Nói có từ vựng | Vào bài thi Speaking Part 2 & 3. | Thấy ảnh bên trái, cột từ vựng B1/B2+ bên phải; bấm ghi âm mượt mà. | 🟩 ĐẠT |
| **4** | Bấm giờ phòng thi Nói | Vào bài thi Speaking Part 4. | Đếm ngược 60s nháp $\rightarrow$ Kêu bíp $\rightarrow$ Đếm ngược 120s ghi âm. | 🟩 ĐẠT |
| **5** | Bôi màu bài Đọc | Vào Reading Part 3 & 4, bôi đen đoạn chữ. | Hiện bảng chọn màu Vàng/Xanh/Xóa; đổi màu chính xác. | 🟩 ĐẠT |
| **6** | Nghe và xem lời thoại | Vào bài Listening, bấm nút "Xem Audio Script". | Âm thanh phát rõ tiếng; bấm nút mở ra kịch bản song ngữ Anh - Việt. | 🟩 ĐẠT |
| **7** | Viết 2 bức thư | Vào Writing Part 4. | Thấy 2 ô viết riêng (50 từ và 150 từ), bộ đếm từ đổi màu theo số từ gõ. | 🟩 ĐẠT |
| **8** | Flashcard từ vựng | Vào mục Từ vựng, nạp link Google Sheet. | Thẻ Flashcard lật 3D hiển thị nghĩa, phát âm tốt và lưu tiến độ học. | 🟩 ĐẠT |

---
**Tài liệu này được lập để thay thế các báo cáo kỹ thuật phức tạp, phục vụ công tác bàn giao, đào tạo học viên và giới thiệu tính năng tới khách hàng.**
