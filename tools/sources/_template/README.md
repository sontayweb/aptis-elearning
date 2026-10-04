# 🚀 Hướng Dẫn Thêm Nguồn Web Mới (Template)

Để thêm bất kỳ website luyện thi Aptis mới nào vào hệ thống, bạn chỉ cần thực hiện 3 bước đơn giản:

---

### Bước 1: Sao chép thư mục template
Tạo một thư mục mới trong `tools/sources/` với tên mã nguồn (viết liền không dấu, ví dụ: `webmoi`, `aptisonline`, `bcbritish`):
```bash
Copy thư mục: tools/sources/_template/ -> tools/sources/webmoi/
```

---

### Bước 2: Cấu hình thông tin kết nối
Mở tệp `tools/sources/webmoi/config.json` và điền thông tin:
```json
{
  "name": "webmoi",
  "displayName": "Tên Hiển Thị Của Website",
  "baseUrl": "https://webmoi.com/",
  "account": {
    "email": "tai-khoan-dang-nhap@gmail.com",
    "password": "mat-khau-dang-nhap"
  },
  "remotePort": 9224
}
```
> *Lưu ý: Mỗi nguồn web nên chọn một cổng debug Chrome riêng biệt (ví dụ: `9222`, `9223`, `9224`, `9225`...) để không bị xung đột tài khoản và cookies.*

---

### Bước 3: Lập trình hàm cào trong `crawler.js`
Mở `tools/sources/webmoi/crawler.js` và triển khai việc bóc tách dữ liệu:
1. Gửi request API hoặc dùng Puppeteer kết nối vào Chrome qua `getBrowserForSource('webmoi', config.remotePort)`.
2. Chuẩn hóa từng đề thi qua hàm chuẩn `normalizeExam(...)` từ `../../core/schema.js`.
3. Ghi kết quả vào `tools/data/webmoi/`.

---

### Bước 4: Chạy thử và Đồng bộ
- **Chạy riêng nguồn này:**
  - Nhấp đúp vào `tools/sources/webmoi/run.bat`
  - Hoặc gõ lệnh: `node sync.js --source=webmoi`
- **Mở trình duyệt đăng nhập tài khoản:**
  - Nhấp đúp vào `tools/sources/webmoi/open-chrome.bat`
- **Đồng bộ toàn bộ tất cả các web:**
  - Chạy `sync-all.bat` ở thư mục gốc `tools/`.
