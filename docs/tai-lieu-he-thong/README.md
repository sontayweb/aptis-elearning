# THƯ MỤC TÀI LIỆU HỆ THỐNG — APTIS ESOL PREMIER
> **Phiên bản**: Vận hành chính thức (Go-Live Ready)  
> **Cập nhật ngày**: 04/10/2026  
> **Nơi lưu trữ**: `docs/tai-lieu-he-thong/`

Thư mục này được tạo riêng biệt để tách rời các tài liệu quan trọng khỏi các tệp dữ liệu cào mẫu (`.mhtml`), giúp bạn và AI có thể tra cứu nhanh, đọc từng file một cách có hệ thống và khoa học.

---

## 📚 DANH MỤC CÁC BỘ TÀI LIỆU QUAN TRỌNG

| STT | Tên tài liệu | File | Nội dung chính |
| :---: | :--- | :--- | :--- |
| **01** | **Rà soát Hardcode & Hướng dẫn đọc code** | [`tai-lieu-ra-soat-hardcode-va-huong-dan-doc-code.md`](./tai-lieu-ra-soat-hardcode-va-huong-dan-doc-code.md) | Báo cáo chi tiết từng vị trí hardcode, mock data, fallback tĩnh trong Frontend/Backend, phân loại rủi ro (Critical/Warning) và cách xử lý. |
| **02** | **Cẩm nang Vận hành & Bổ sung học liệu** | [`huong-dan-van-hanh-va-bo-sung-du-lieu.md`](./huong-dan-van-hanh-va-bo-sung-du-lieu.md) | Sổ tay từng bước hướng dẫn cách thêm sách PDF, Ebook, video bài giảng YouTube, câu luyện nghe chép Dictation, bài viết Blog và checklist deploy. |
| **03** | **Đặc tả Chức năng Hệ thống (SRS)** | [`Bao_Cao_Dac_Ta_Chuc_Nang_Elearning_Aptis.md`](./Bao_Cao_Dac_Ta_Chuc_Nang_Elearning_Aptis.md) | Toàn văn đặc tả nghiệp vụ 4 kỹ năng Aptis, hệ thống chấm điểm AI CEFR, quản trị viên, thanh toán SePay và ma trận phân quyền RBAC. |
| **04** | **Đối soát Logic Tiến trình Học tập & API** | [`Bao_Cao_Ra_Soat_Hardcode_Va_Dong_Bo_API.md`](./Bao_Cao_Ra_Soat_Hardcode_Va_Dong_Bo_API.md) | Báo cáo kiểm tra và nâng cấp thuật toán tính chuỗi Streak, gom câu sai theo part, gợi ý ôn tập thông minh và radar 4 kỹ năng thời gian thực. |
| **05** | **Báo cáo Đối soát Hoàn thiện Hệ thống** | [`Bao_Cao_Doi_Soat_Hoan_Thien_He_Thong.md`](./Bao_Cao_Doi_Soat_Hoan_Thien_He_Thong.md) | Kết quả kiểm thử End-to-End (E2E) tự động 7 bước từ đăng nhập, làm bài, chấm AI đến cập nhật bảng điểm. |
| **06** | **Nhật ký Tiến độ & Lịch sử Nâng cấp** | [`nhat-ky-tien-do-du-an.md`](./nhat-ky-tien-do-du-an.md) | Ghi nhận chi tiết từng mốc phát triển, các bản vá lỗi và nâng cấp giao diện quản trị theo thời gian thực. |

---

## 🎯 HƯỚNG DẪN ĐỌC THEO MỤC TIÊU

### 1. Dành cho Quản trị viên & Giảng viên (Không chuyên code):
- Đọc ngay file **[02] Cẩm nang Vận hành** để biết cách đăng thêm tài liệu, video bài giảng và câu luyện nghe chép mà không cần can thiệp vào mã nguồn.
- Mở **[03] Đặc tả Chức năng** để nắm rõ quy chế tính điểm CEFR và quyền hạn của từng loại tài khoản.

### 2. Dành cho Lập trình viên & Kỹ sư triển khai (Dev / DevOps):
- Đọc file **[01] Rà soát Hardcode** để kiểm tra các biến môi trường (`.env`), cổng API và cơ chế bảo mật trước khi bấm nút Go-Live.
- Đọc file **[04] & [05] Đối soát API & E2E** để kiểm tra tính toàn vẹn của cơ sở dữ liệu và các luồng gọi API.
