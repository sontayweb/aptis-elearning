
# **BÁO CÁO ĐẶC TẢ YÊU CẦU NGHIỆP VỤ**

**HỆ THỐNG E-LEARNING & APTIS **

Tài liệu phân tích chức năng & Tích hợp Giải pháp


| 📌 Tóm tắt tài liệu:  Tài liệu này đặc tả toàn bộ các phân hệ chức năng của hệ thống luyện thi Aptis ESOL, tập trung sâu vào luồng nghiệp vụ người dùng, ma trận phân quyền quản trị, quy trình cấp phát tài khoản học viên và đặc biệt là phân tích chi tiết Giải pháp Thanh toán tự động SePay qua mã VietQR ngân hàng. |
| --- |



# **PHẦN 1: TỔNG QUAN NGHIỆP VỤ & ĐỐI TƯỢNG NGƯỜI DÙNG**

Hệ thống E-Learning Aptis ESOL được xây dựng nhằm mục tiêu số hóa toàn diện quy trình ôn luyện và khảo thí tiếng Anh 4 kỹ năng (Listening, Speaking, Reading, Writing). Giải pháp tập trung tối ưu hóa trải nghiệm tự học của học viên và đơn giản hóa công tác vận hành, quản trị học vụ của trung tâm.


## **1.1 Mục Tiêu Nghiệp Vụ Của Sản Phẩm**

**Mô phỏng phòng thi chuẩn hóa: **Cung cấp môi trường thi thử trực tuyến với giao diện và áp lực thời gian tương đương 100% kỳ thi chính thức trên máy tính tại Hội đồng thi British Council.

**Luyện thi theo bộ đề Key: **Phân loại đề thi theo từng kỹ năng và từng phần (Part 1 - Part 4), cập nhật ngân hàng câu hỏi trọng tâm sát với các đợt thi thật gần nhất.

**Đo lường năng lực học tập: **Cá nhân hóa lộ trình học viên theo mục tiêu B1, B2 hoặc C Target; theo dõi tiến trình 4 kỹ năng và chuỗi ngày học liên tục (Streak).

**Tự động hóa thanh toán: **Tự động hóa hoàn toàn khâu nạp tiền vào ví qua giải pháp SePay (VietQR), cho phép học viên chủ động mở khóa các bộ đề VIP ngay lập tức 24/7.


## **1.2 Các Nhóm Đối Tượng Người Dùng (User Personas)**

**1. Khách vãng lai (Guest): **Người dùng chưa đăng nhập. Có nhu cầu tìm hiểu thông tin khóa học, đọc tài liệu miễn phí, xem review kinh nghiệm thi và đăng ký tài khoản mới.

**2. Học viên (Student): **Người học chính thức. Có tài khoản để luyện tập 4 kỹ năng, làm bài thi thử, quản lý ví cá nhân, nạp tiền mua gói đề và xem lịch sử làm bài.

**3. Giảng viên / Giám khảo (Teacher / Examiner): **Cán bộ giảng dạy. Quản lý lớp học, cấp mã phòng thi thử, theo dõi kết quả của học viên trong lớp, chấm điểm và nhận xét bài Nói/Viết.

**4. Quản trị viên học vụ (Admin): **Bộ phận học vụ & tuyển sinh. Cấp tài khoản học viên, quản lý ngân hàng đề thi, biên tập câu hỏi, duyệt bài chia sẻ review đề thi và hỗ trợ học viên.

**5. Tổng quản trị (Super Admin): **Ban quản trị cấp cao. Kiểm soát toàn bộ người dùng, phân quyền vai trò, đối soát dòng tiền thanh toán và cấu hình các thông số toàn hệ thống.


# **PHẦN 2: QUẢN TRỊ TÀI KHOẢN & MA TRẬN PHÂN QUYỀN (RBAC)**

Hệ thống áp dụng cơ chế kiểm soát truy cập dựa trên vai trò (Role-Based Access Control) nghiêm ngặt để đảm bảo an toàn dữ liệu và phân tách rõ ràng trách nhiệm vận hành.


## **2.1 Quy Trình Cấp Phát Tài Khoản (Account Provisioning)**

Nhằm phục vụ cả nhu cầu bán khóa học tự động và nghiệp vụ tuyển sinh trực tiếp tại trung tâm, hệ thống hỗ trợ các luồng cấp tài khoản sau:


### **a. Học viên tự đăng ký trực tuyến**

Người dùng truy cập trang Đăng ký → Nhập Họ tên, Email, Số điện thoại và Mật khẩu → Hệ thống tự động khởi tạo tài khoản Học viên ở trạng thái Hoạt động với mục tiêu mặc định (B2 Target).


### **b. Admin cấp tài khoản thủ công cho từng học viên**

Bộ phận học vụ truy cập trang Quản trị học viên → Nhấn nút "Thêm học viên mới" và nhập các thông tin bắt buộc:

**Thông tin cá nhân: **Họ và tên, Email đăng nhập, Số điện thoại liên hệ.

**Thông tin bảo mật: **Mật khẩu khởi tạo ban đầu (có thể để trống để hệ thống cấp mật khẩu mặc định).

**Phân quyền vai trò (Role): **Lựa chọn Học viên (Student), Giảng viên (Teacher) hoặc Quản trị viên (Admin).

**Mục tiêu chứng chỉ: **Lựa chọn B1 Target (Trung cấp), B2 Target (Khuyên dùng) hoặc C Target (Nâng cao).

**Trạng thái tài khoản: **Kích hoạt ngay (Active) hoặc Tạm khóa (Inactive) để chờ đóng học phí.

**Ghi chú nội bộ: **Ghi chú của tư vấn viên về khóa học, lớp đăng ký hoặc kênh tiếp nhận.


### **c. Cấp tài khoản hàng loạt (Bulk Import) & Reset quyền**

Hỗ trợ tải tệp danh sách Excel học viên của khóa học mới. Hệ thống tự động kiểm tra trùng lặp email, tạo hàng loạt tài khoản và gửi email thông báo kèm hướng dẫn đăng nhập. Admin có quyền khóa tài khoản tạm thời, mở khóa hoặc tạo lại mật khẩu mới cho học viên trong các trường hợp cần thiết.


## **2.2 Bảng Ma Trận Phân Quyền Chi Tiết Theo Nghiệp Vụ**


| Nhóm Nghiệp Vụ / Chức Năng | Khách Vãng Lai | Học Viên | Giảng Viên | Quản Trị Viên |
| --- | --- | --- | --- | --- |
| Xem thông tin công khai, giới thiệu, bài viết, bảng giá | Cho phép | Cho phép | Cho phép | Cho phép |
| Đăng ký tài khoản mới & Đăng nhập hệ thống | Cho phép | — | — | — |
| Xem Dashboard tiến độ học tập và chuỗi ngày Streak | Từ chối | Cá nhân | Theo lớp | Toàn hệ thống |
| Luyện tập 4 kỹ năng & làm bài trong Kho Bộ Đề Key | Từ chối | Toàn quyền | Toàn quyền | Toàn quyền |
| Tham gia phòng thi thử trực tuyến (Mock Exam Room) | Từ chối | Nhập mã thi | Tạo phòng & Chấm | Toàn quyền |
| Nạp tiền vào ví qua mã VietQR & Mua gói học | Từ chối | Toàn quyền | — | Cấp phát thủ công |
| Gửi bài viết chia sẻ review đề thi thật sau khi thi | Từ chối | Gửi bài duyệt | Đăng trực tiếp | Kiểm duyệt / Ẩn |
| Cấp mới tài khoản, phân vai trò, khóa / mở khóa người dùng | Từ chối | Từ chối | Từ chối | Toàn quyền |
| Quản trị kho đề thi, ngân hàng câu hỏi, ngân hàng từ vựng | Từ chối | Từ chối | Đóng góp nội dung | Toàn quyền |
| Xem báo cáo kết quả thi và phân tích điểm của mọi học viên | Từ chối | Chỉ xem của mình | Xem theo lớp | Toàn bộ hệ thống |



# **PHẦN 3: ĐẶC TẢ PHÂN HỆ HỌC VIÊN (STUDENT PORTAL)**

Phân hệ Học viên là trọng tâm của sản phẩm, được thiết kế tối ưu hóa lộ trình rèn luyện 4 kỹ năng thi chứng chỉ:


## **3.1 Bảng Điều Khiển Cá Nhân (Student Dashboard)**

**Radar năng lực 4 kỹ năng: **Hiển thị chỉ số hoàn thành (số bài đã làm / tổng số bài) và điểm số trung bình đạt được của 4 kỹ năng Nghe, Nói, Đọc, Viết.

**Mục tiêu tuần (Weekly Goal): **Thanh tiến trình mục tiêu câu hỏi/bài luyện cần đạt được trong tuần giúp duy trì kỷ luật học tập.

**Chuỗi ngày học (Streak): **Đếm số ngày học tập liên tục để khuyến khích học viên tạo lập thói quen ôn luyện mỗi ngày.

**Gợi ý học tập thông minh: **Hệ thống tự động đề xuất bài học tiếp theo hoặc kỹ năng học viên đang có điểm số thấp nhất.


## **3.2 Kho Bộ Đề Key (Aptis Hot Key Questions)**

**Ngân hàng đề thi theo tháng: **Tập hợp các bộ đề thi thật được cập nhật liên tục theo các tháng thi gần nhất tại các hội đồng.

**Phân nhóm Part & Topic: **Phân loại khoa học theo từng Kỹ năng (Listening, Speaking, Reading, Writing) và từng Part cụ thể (Part 1 đến Part 4).

**Trình làm bài Fullscreen: **Giao diện làm bài toàn màn hình mô phỏng chuẩn xác phần mềm thi máy tính chính thức, có đồng hồ đếm ngược và thanh điều hướng câu hỏi.


## **3.3 4 Phòng Luyện Kỹ Năng Chuyên Biệt (Practice Rooms)**

**1. Phòng Nghe (Listening Room): **Trình phát Audio có thanh trượt thời gian, nút chỉnh tốc độ nghe (0.75x, 1x, 1.25x), câu hỏi trắc nghiệm đồng bộ, nộp bài có chấm điểm và hiển thị transcript phân tích chi tiết.

**2. Phòng Nói (Speaking Room): **Tích hợp bộ ghi âm giọng nói trực tiếp trên trình duyệt, đếm ngược thời gian chuẩn bị và thời gian trả lời, phát lại bản ghi âm của bản thân, đối chiếu với câu trả lời mẫu (Sample Answer) và Audio giảng viên.

**3. Phòng Đọc (Reading Room): **Giao diện chia 2 cột tiện lợi (Cột trái: Bài đọc văn bản cuộn độc lập; Cột phải: Các câu hỏi điền từ vào chỗ trống, nối tiêu đề hoặc trắc nghiệm), hỗ trợ highlight từ khóa.

**4. Phòng Viết (Writing Room): **Khung soạn thảo văn bản tích hợp bộ đếm từ tự động (Word Counter), cảnh báo khi chưa đủ số từ tối thiểu hoặc vượt quá số từ tối đa, cung cấp dàn ý gợi ý và bài viết tham khảo chuẩn Band C.


## **3.4 Phòng Thi Thử Trực Tuyến (Official Mock Exam Room)**

**Tham gia bằng mã phòng: **Học viên nhập mã phòng thi gồm 7 ký tự (VD: APT-2026) do giảng viên hoặc hệ thống cấp phát.

**Áp lực phòng thi thật: **Bắt buộc làm liên tục 4 kỹ năng dưới áp lực đếm ngược thời gian nghiêm ngặt, tự động khóa bài và nộp bài khi hết giờ.

**Công bố kết quả tức thì: **Hệ thống tự động tính điểm các phần trắc nghiệm và gửi bài Nói/Viết vào hàng đợi chấm của Giảng viên.


## **3.5 Luyện Từ Vựng Trọng Tâm 198 Bộ (Vocabulary Hub)**

**Chế độ luyện tập (Practice Mode): **Luyện trắc nghiệm nghĩa từ vựng, hiển thị ngay giải thích và phiên âm sau khi chọn.

**C****hế độ kiểm tra (Test Mode): **Kiểm tra 10 từ vựng ngẫu nhiên trong thời gian giới hạn 15 phút và tổng kết điểm số.

**Ngân hàng từ vựng: **Kho 198(Tùy theo data) bộ từ vựng then chốt xuất hiện nhiều nhất trong đề thi Reading và Speaking.


## **3.6 Cộng Đồng Review Đề Thi & Tài Liệu Học Tập**

**Đọc review đề thi thật: **Xem các bài chia sẻ đề thi thực tế tại các hội đồng thi BC Hà Nội, TP.HCM, Đà Nẵng...

**Đóng góp review mới: **Học viên sau khi thi xong có thể gửi bài chia sẻ đề thi của mình lên hệ thống để nhận phần thưởng nạp ví.

**Video khóa học & Kho tài liệu: **Xem video bài giảng ngữ pháp/kỹ năng và tải tài liệu PDF ôn thi độc quyền.

**Lịch sử làm bài & Báo cáo: **Xem lại toàn bộ lịch sử thi cử, đáp án từng câu đã chọn, bài mẫu và nhận xét của giảng viên.


# **PHẦN 4: ĐẶC TẢ PHÂN HỆ QUẢN TRỊ (ADMIN PORTAL)**

Phân hệ Quản trị giúp đội ngũ học vụ và ban quản lý kiểm soát toàn bộ hoạt động đào tạo, khảo thí và quản lý nội dung số:


## **4.1 Bảng Điều Khiển Quản Trị & Chỉ Số KPI (Admin Dashboard)**

**4 Thẻ chỉ số tổng quan: **Tổng số lượng đề thi, số học viên đang hoạt động, tổng lượt làm bài và tỷ lệ học viên đạt mục tiêu cam kết.

**Biểu đồ hoạt động theo tuần: **Biểu đồ cột theo dõi lưu lượng làm bài của học viên trong 7 ngày gần nhất.

**Phân bổ kỹ năng & Mục tiêu: **Thống kê cơ cấu bộ đề theo 4 kỹ năng và tỷ lệ học viên theo các mục tiêu B1, B2, C Target.


## **4.2 Quản Lý Đề Thi & Ngân Hàng Câu Hỏi (Test & Question Bank)**

Quy trình quản lý nội dung đề thi tuân thủ chuẩn CRUD nghiệp vụ 3 bước: Danh sách (List) → Xem chi tiết (Show) → Biểu mẫu tạo/sửa (Form):

**Danh sách đề thi: **Bộ lọc đa tiêu chí theo Kỹ năng (Nghe, Nói, Đọc, Viết), Độ khó (A2, B1, B2, C1), Phân loại đề (Miễn phí / Trả phí VIP), tìm kiếm nhanh theo tên đề.

**Tạo & Chỉnh sửa đề thi: **Cấu hình tên đề, kỹ năng, thời lượng làm bài (tính bằng phút/giây), mô tả, ảnh bìa, trạng thái xuất bản (Publish/Draft).

**Quản lý câu hỏi chi tiết: **Soạn thảo câu hỏi trắc nghiệm (audio, passage, 4 lựa chọn, đáp án đúng, giải thích), câu hỏi điền từ, đề bài nói (kèm thời gian chuẩn bị/nói) và đề bài viết (kèm tiêu chí chấm rubric).


## **4.3 Quản Trị Học Viên & Phân Quyền**

**Danh sách học viên: **Xem danh sách toàn bộ người dùng, tìm kiếm theo tên, email, SĐT, lọc theo vai trò và trạng thái hoạt động.

**Hồ sơ chi tiết học viên: **Xem chi tiết hồ sơ, biểu đồ tiến độ 4 kỹ năng, lịch sử tất cả các lần nộp bài, thời gian ôn tập tích lũy.

**Thao tác quản trị: **Cấp tài khoản mới, phân vai trò, gán mục tiêu B1/B2/C, khóa/mở khóa tài khoản hoặc reset mật khẩu.


## **4.4 Quản Lý Kiểm Duyệt Review & Ngân Hàng Từ Vựng**

**Duyệt bài review đề thi: **Kiểm tra nội dung các bài review đề thi thật do học viên gửi lên; thực hiện thao tác Duyệt hiển thị, Ẩn bài hoặc Xóa bài vi phạm; xuất báo cáo CSV.

**Quản lý ngân hàng từ vựng: **Thêm mới, chỉnh sửa từ vựng, từ loại, phiên âm, nghĩa tiếng Việt, câu ví dụ và các câu hỏi trắc nghiệm kiểm tra.


# **PHẦN 5: PHÂN TÍCH GIẢI PHÁP THANH TOÁN SEPAY, VÍ ĐIỆN TỬ & KÍCH HOẠT DỊCH VỤ**

Phần này phân tích chi tiết cơ chế thanh toán chuyển khoản qua mã QR ngân hàng, so sánh giữa phương án truyền thống và giải pháp tự động hóa bằng cổng trung gian SePay, từ đó đưa ra kiến trúc tích hợp toàn diện cho hệ thống E-Learning.


## **5.1 Vấn Đề Nghiệp Vụ Của Phương Thức QR Ngân Hàng Thông Thường**

Khi một website chỉ sử dụng mã QR ngân hàng thông thường (chuyển khoản trực tiếp không qua cổng trung gian):

**Bản chất của mã QR: **Mã QR chỉ có chức năng hỗ trợ người dùng điền nhanh thông tin (Số tài khoản, tên người nhận, số tiền, cú pháp) trên ứng dụng ngân hàng.

** Thiếu kênh phản hồi: **Bản thân mã QR và phía ngân hàng KHÔNG có cơ chế gửi thông báo giao dịch thành công ngược lại về máy chủ website.

**Tắc nghẽn trạng thái: **Sau khi khách hàng chuyển tiền thành công, trạng thái đơn hàng trên website vẫn bị treo ở trạng thái "Chờ thanh toán" (PENDING_PAYMENT).

**Phụ thuộc con người: **Admin phải liên tục đăng nhập ứng dụng Internet Banking của ngân hàng, tra soát số tiền và mã đơn hàng, sau đó bấm xác nhận thủ công trên web thì đơn hàng mới chuyển sang "Đã thanh toán" (PAID).

**Hạn chế kinh doanh: **Học viên mua bài học ban đêm, ngày nghỉ hoặc ngoài giờ hành chính sẽ phải chờ đợi lâu, làm giảm tỷ lệ chuyển đổi và tăng chi phí nhân sự trực hỗ trợ.


## **5.2 Luồng Hoạt Động Của Giải Pháp Tự Động Hóa SePay**

SePay đóng vai trò là cầu nối trung gian giám sát biến động số dư tài khoản ngân hàng và tự động gửi dữ liệu giao dịch về hệ thống website E-Learning. Toàn bộ quy trình diễn ra theo mô hình 3 lớp khép kín:


### **Lớp 1: Ngân hàng phát sinh giao dịch**

Tài khoản ngân hàng của trung tâm (VD: MB Bank - 0866950837, Vietcombank, Techcombank, BIDV, ACB, VPBank...) nhận được tiền chuyển khoản từ học viên. Thông tin biến động số dư được chuyển đến SePay thông qua 2 hình thức: Tin nhắn SMS biến động số dư hoặc API Notification của ngân hàng.


### **Lớp 2: SePay tiếp nhận và chuẩn hóa dữ liệu**

SePay tiếp nhận dữ liệu biến động số dư và tiến hành chuẩn hóa thông tin theo định dạng chuẩn: Số tiền thực nhận, Nội dung chuyển khoản (chứa mã học viên hoặc mã đơn hàng), Thời gian giao dịch chính xác, Loại giao dịch (Cộng tiền ghi có). Sau khi xử lý xong, SePay phát tín hiệu thông báo tức thời qua Webhooks/API.


### **Lớp 3: Hệ thống E-Learning nhận Webhook & Tự động xử lý**

Hệ thống E-Learning tiếp nhận tín hiệu Webhook từ SePay, tự động bóc tách nội dung chuyển khoản để nhận diện mã học viên, đối khớp số tiền nạp và thực hiện cộng tiền vào ví khả dụng trong vòng 3 - 5 giây. Đồng thời, hệ thống có thể đẩy thông báo xác nhận tự động vào Telegram/Lark của Ban quản trị để giám sát.


## **5.3 So Sánh Chi Tiết: Phương Pháp Thủ Công vs Tự Động SePay**


| Tiêu Chí Đánh Giá | QR Chuyển Khoản Thủ Công | Giải Pháp Tự Động SePay (Đề Xuất) |
| --- | --- | --- |
| Tốc độ xử lý | Chậm (Từ 15 phút đến vài tiếng, phụ thuộc giờ trực của nhân viên) | Tức thì (Xử lý hoàn tất trong 3 - 5 giây) |
| Thời gian hoạt động | Chỉ trong giờ hành chính / ca trực | Tự động 24/7/365 bất kể đêm khuya, lễ Tết |
| Tỷ lệ sai sót | Dễ nhầm lẫn khi đối soát bằng mắt thường | Chính xác 100% theo mã giao dịch và số tiền |
| Trải nghiệm học viên | Phải chờ đợi duyệt bài, dễ nảy sinh ức chế | Vào học và làm bài ngay sau khi quét QR |
| Chi phí vận hành | Tốn nhân sự học vụ/kế toán trực soát đơn | Không tốn nhân sự, hệ thống tự động hoàn toàn |



## **5.4 Cấu Trúc Dữ Liệu Chuẩn Mã VietQR Của Hệ Thống**


| Trường Dữ Liệu | Giá Trị Mẫu | Mục Đích Nghiệp Vụ |
| --- | --- | --- |
| Ngân hàng nhận | MB BANK (Quân Đội) | Định tuyến chính xác ngân hàng đích |
| Số tài khoản nhận | 0866950837 | Tài khoản nhận tiền của trung tâm |
| Tên chủ tài khoản | APTIS ESOL PREMIER | Hiển thị để học viên đối chiếu an tâm |
| Số tiền thanh toán | 200.000 VNĐ / 499.000 VNĐ | Số tiền chính xác của gói hoặc mệnh giá nạp |
| Nội dung chuyển khoản | APTIS 1092 hoặc DH10025 | Khóa định danh để SePay đối khớp tự động |



## **5.5 Các Trạng Thái Giao Dịch Đề Xuất**


| Mã Trạng Thái | Ý Nghĩa Nghiệp Vụ | Cơ Chế Chuyển Đổi Trạng Thái |
| --- | --- | --- |
| PENDING_PAYMENT | Đang chờ học viên quét mã chuyển khoản | Hệ thống khởi tạo khi học viên nhấn nạp tiền / mua gói |
| PAID | Đã nhận tiền thành công & Đã cộng ví | SePay Webhook xác nhận tự động hoặc Admin duyệt tay |
| CANCELLED | Đơn hàng hoặc yêu cầu nạp bị hủy | Học viên hủy giao dịch hoặc hết thời gian chờ (timeout) |
| EXCEPTION_SYNTAX | Nhận được tiền nhưng sai cú pháp | Chuyển vào hàng đợi Admin để kiểm tra và duyệt tay |



## **5.6 Quy Trình Quản Trị & Xử Lý Ngoại Lệ Thanh Toán**

- Giám sát đối soát dòng tiền: Màn hình quản trị hiển thị toàn bộ lịch sử biến động số dư từ SePay, tổng doanh thu theo ngày/tháng và danh sách các gói dịch vụ đã kích hoạt.
- Xử lý nạp sai cú pháp: Nếu học viên chuyển khoản thiếu hoặc ghi sai cú pháp, hệ thống ghi nhận vào mục "Giao dịch cần xử lý". Admin chỉ cần chọn học viên tương ứng và bấm nút "Khớp lệnh thủ công" để cộng ví cho học viên.
- Hoàn tiền & Điều chỉnh số dư: Hỗ trợ Admin thực hiện lệnh hoàn tiền về ví hoặc hủy kích hoạt gói dịch vụ khi có yêu cầu hợp lệ từ phía học viên.

# **PHẦN 6: ĐẶC TẢ PHÂN HỆ THÔNG TIN CÔNG KHAI (PUBLIC PORTAL)**

Phân hệ công khai phục vụ đối tượng khách vãng lai và học viên mới tiếp cận giải pháp:

**1. Trang chủ (Landing Page): **Trang chủ giới thiệu đầy đủ phương pháp đào tạo, giao diện mô phỏng phòng thi, các gói dịch vụ nổi bật, cam kết chất lượng và cảm nhận học viên.

**2. Trang Giới thiệu (About Us): **Giới thiệu đội ngũ chuyên môn, triết lý giảng dạy thực chiến và cam kết hỗ trợ học viên đạt bằng cấp tốc.

**3. Danh mục khóa học & Bảng giá: **Bảng giá chi tiết các khóa học Aptis B1, B2, C; lộ trình đào tạo, quyền lợi đi kèm và chính sách hoàn tiền.

**4. Tin tức & Blog chuyên đề: **Chia sẻ bài viết cẩm nang kinh nghiệm thi thật, mẹo làm bài 4 kỹ năng, tin tức tuyển dụng và du học.

**5. Cổng liên hệ & Hỗ trợ: **Form gửi yêu cầu tư vấn, số điện thoại Hotline, liên kết Zalo tư vấn và Fanpage Facebook hỗ trợ 24/7.

**6. Điều khoản dịch vụ & Chính sách bảo mật: **Quy định rõ ràng quyền lợi, nghĩa vụ của học viên và chính sách bảo mật thông tin cá nhân.

**7. Cổng xác thực người dùng (Auth Portal): **Form Đăng ký tài khoản mới, Đăng nhập và Quên mật khẩu qua email.


# **PHẦN 7: TIÊU CHÍ ĐÁNH GIÁ NGHIỆP VỤ & NGHIỆM THU (UAT)**

Để đảm bảo hệ thống sẵn sàng đưa vào vận hành thực tế tại trung tâm, sản phẩm cần đáp ứng các tiêu chuẩn nghiệm thu sau:


| Tiêu Chí Nghiệp Vụ | Yêu Cầu Đạt Chuẩn (Acceptance Criteria) | Đánh Giá |
| --- | --- | --- |
| Khảo thí 4 Kỹ năng | Giao diện làm bài mượt mà trên Desktop/Mobile; bộ ghi âm và phát audio hoạt động ổn định; nộp bài có kết quả chính xác. | Đạt chuẩn |
| Cấp tài khoản & Phân quyền | Admin tạo tài khoản thành công; phân quyền đúng theo Role; học viên chỉ truy cập đúng phạm vi quyền hạn được cấp. | Đạt chuẩn |
| Tự động hóa SePay & VietQR | Mã QR hiển thị chính xác STK MB Bank và cú pháp; SePay bắn webhook khớp lệnh tự động cộng tiền ví trong 3-5 giây; trừ tiền mua gói đề chuẩn xác. | Đạt chuẩn |
| Quản trị nội dung & Duyệt review | Admin dễ dàng thêm/sửa/xóa đề thi, câu hỏi và duyệt các bài chia sẻ review đề thi thật từ học viên. | Đạt chuẩn |

