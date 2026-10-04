# HƯỚNG DẪN SỬ DỤNG BỘ TOOL CÀO ĐỀ APTIS ACADEMY

Thư mục này được thiết kế độc lập 100% dành riêng cho **Aptis Academy (https://aptisacademy.com.vn/)**.

---

## 📁 Danh sách công cụ:

1. **`open-academy-chrome.bat`**: Khởi chạy Google Chrome với profile độc lập `.chrome_profile_academy` (Remote port: 9223).
2. **`crawl-exam.bat`**: Tự động bóc tách toàn bộ đề thi, bài đọc, câu hỏi, các lựa chọn và link âm thanh MP3 từ tab Chrome đang mở. Dữ liệu lưu vào `output/`.
3. **`import-db.bat`**: Nạp tự động file đề thi vừa cào vào cơ sở dữ liệu PostgreSQL của hệ thống bạn qua Prisma.
4. **`config.json`**: Lưu thông tin tài khoản được cung cấp (`thanhthu8805pl@gmail.com` / `Thu123`).

---

## 🚀 Cách sử dụng (3 bước đơn giản):

1. **Bước 1**: Nhấp đúp vào **`open-academy-chrome.bat`** để mở trình duyệt.
2. **Bước 2**: Đăng nhập tài khoản và vào đề thi bạn muốn cào.
3. **Bước 3**: Nhấp đúp vào **`crawl-exam.bat`** để cào dữ liệu về máy, sau đó chạy **`import-db.bat`** để nạp vào hệ thống web của bạn!
