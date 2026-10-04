# 🛠️ Bộ Công Cụ Đồng Bộ Dữ Liệu Aptis Đa Nguồn (Multi-Source Crawler)

Hệ thống quản lý, trích xuất và đồng bộ dữ liệu thi thử Aptis từ các nền tảng luyện thi hàng đầu (`aptiskytich.vn`, `aptisacademy.com.vn`,...) về nền tảng **Aptis E-learning**.

Thiết kế theo kiến trúc module hóa: **độc lập từng nguồn**, **chuẩn hóa dữ liệu thống nhất (Normalized Schema)**, **chống trùng lặp (Idempotent)** và **cực kỳ dễ dàng thêm website mới**.

---

## 📁 Cấu Trúc Thư Mục Chuẩn Hóa

```text
tools/
├── core/                       # Nhân xử lý dùng chung cho mọi nguồn web
│   ├── browser.js              # Trình quản lý Chrome cách ly theo từng profile & port
│   ├── db.js                   # Công cụ nạp dữ liệu Idempotent vào PostgreSQL qua Prisma
│   ├── logger.js               # Quản lý ghi log chi tiết tự động ra file cho từng phiên
│   ├── media.js                # Tải âm thanh MP3 và hình ảnh về lưu trữ cục bộ
│   └── schema.js               # Chuẩn hóa cấu trúc đề thi thống nhất (Unified Exam Schema)
│
├── logs/                       # 📝 Nhật ký chi tiết từng phiên chạy để đối soát & debug
│   ├── latest.log              # File log của phiên chạy gần nhất
│   └── sync_*.log              # Lịch sử log chi tiết có timestamp theo từng lần quét
│
├── sources/                    # Danh mục các nguồn website (Mỗi web là 1 module độc lập)
│   ├── _template/              # 👉 THƯ MỤC MẪU ĐỂ NHÂN BẢN THÊM WEBSITE MỚI
│   │   ├── config.json         # File cấu hình (URL, tài khoản, port)
│   │   ├── crawler.js          # Khung code cào dữ liệu chuẩn
│   │   ├── open-chrome.bat     # 1-click mở Chrome đăng nhập cho nguồn mới
│   │   ├── run.bat             # 1-click chạy riêng nguồn mới
│   │   └── README.md           # Hướng dẫn 3 bước thêm web mới
│   ├── aptiskytich/            # Nguồn: https://aptiskytich.vn/
│   │   ├── config.json         # Supabase URL & Anon Key, Port 9222
│   │   ├── crawler.js          # Cào Full Tests, Nghe chép, Mẹo thi, Bảng kỳ tích
│   │   ├── open-chrome.bat     # Mở Chrome độc lập (Port 9222)
│   │   └── run.bat             # Chạy riêng Aptis Kỳ Tích
│   └── aptisacademy/           # Nguồn: https://aptisacademy.com.vn/
│       ├── config.json         # Thông tin tài khoản & Port 9223
│       ├── crawler.js          # Cào 167 Full Tests, 485 bài kỹ năng, 311 audio
│       ├── open-chrome.bat     # Mở Chrome độc lập (Port 9223)
│       └── run.bat             # Chạy riêng Aptis Academy
│
├── data/                       # Nơi lưu trữ toàn bộ dữ liệu đã cào và chuẩn hóa
│   ├── aptiskytich/            # Dữ liệu xuất ra từ Kỳ Tích (JSON, Markdown)
│   └── aptisacademy/           # Dữ liệu xuất ra từ Academy (JSON, MP3 audio)
│       └── exported_exams/     # Phân loại: speaking_all, writing_all, listening_all, reading_all
│
├── sync.js                     # Trình điều phối trung tâm (CLI Orchestrator)
├── sync-all.bat                # 1-Click đồng bộ TẤT CẢ các nguồn web
└── archive/                    # Lưu trữ các file nháp, probe và lịch sử nghiên cứu
```

---

## 🚀 Hướng Dẫn Sử Dụng Nhanh

### 1. Đồng bộ toàn bộ các website (1 cú nhấp chuột)
- Nhấp đúp vào: **`sync-all.bat`**
- Hoặc gõ lệnh trong terminal:
  ```bash
  node sync.js --source=all
  ```

### 2. Đồng bộ từng website riêng biệt
- **Chỉ cào Aptis Kỳ Tích:**
  ```bash
  node sync.js --source=aptiskytich
  ```
  *(hoặc nhấp đúp `tools/sources/aptiskytich/run.bat`)*

- **Chỉ cào Aptis Academy:**
  ```bash
  node sync.js --source=aptisacademy
  ```
  *(hoặc nhấp đúp `tools/sources/aptisacademy/run.bat`)*

### 3. Nạp thẳng vào Cơ sở dữ liệu (PostgreSQL)
Thêm cờ `--db` để hệ thống tự động import vào database:
```bash
node sync.js --source=all --db
```
> *Cơ chế `Idempotent`: Nếu đề thi đã tồn tại, hệ thống chỉ cập nhật nội dung, không tạo đề trùng lặp và TUYỆT ĐỐI không làm mất lịch sử làm bài (submissions) của học viên.*

### 4. Tải toàn bộ file Audio MP3 và Ảnh về máy
Thêm cờ `--media`:
```bash
node sync.js --source=aptisacademy --media
```

---

## ➕ Cách Thêm Một Website Mới Trong Tương Lai (Chỉ 3 Bước)

Hệ thống được thiết kế mở, tự động nhận diện bất kỳ thư mục nào trong `tools/sources/`:

1. **Nhân bản thư mục mẫu:**
   Copy `tools/sources/_template/` thành `tools/sources/<ten_web_moi>/` (ví dụ: `tools/sources/aptisonline/`).
2. **Cập nhật `config.json`:**
   Điền URL trang web, tài khoản, và chọn một port debug trống (ví dụ: `9224`, `9225`).
3. **Triển khai hàm cào trong `crawler.js`:**
   Bóc tách dữ liệu và gọi `normalizeExam(...)` từ `core/schema.js`.

Sau đó:
- Chạy `node sync.js --list` để thấy web mới xuất hiện ngay lập tức trong danh sách!
- Chạy `node sync.js --source=aptisonline` để cào nguồn mới.

---

## 🔒 Quản Lý Phiên Đăng Nhập & Chrome Profiles Riêng Biệt

Mỗi website có một phiên đăng nhập hoàn toàn cách ly, không bao giờ bị ghi đè cookies hay logout chéo:
- **Aptis Kỳ Tích:** Profile tại `.chrome_profile_aptiskytich` (Port `9222`)
- **Aptis Academy:** Profile tại `.chrome_profile_aptisacademy` (Port `9223`)

Để đăng nhập bằng giao diện trình duyệt thật:
- Mở `open-chrome.bat` của web tương ứng, đăng nhập tài khoản một lần duy nhất, cookies sẽ được lưu vĩnh viễn trên máy.
