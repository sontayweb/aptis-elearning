# Tool Crawler & Database Importer Aptis Kỳ Tích

Công cụ độc lập đặt cùng cấp với `backend/` và `frontend/`, dùng để thu thập đề thi và tài liệu học từ `https://aptiskytich.vn` và nạp vào cơ sở dữ liệu PostgreSQL của hệ thống.

---

## 1. Cài đặt

```bash
cd crawler
npm install
```

*(Nếu môi trường đã có sẵn node_modules ở backend, bạn có thể chạy trực tiếp bằng `npx tsx src/index.ts`)*

## 2. Cấu hình (`crawler/.env`)

Sao chép file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

Điền các thông tin:
- `SOURCE_BASE_URL`: Mặc định là `https://aptiskytich.vn`
- `APTIS_COOKIE`: Cookie phiên đăng nhập nếu muốn cào các đề Pro hoặc xem giải thích chi tiết.
- `DATABASE_URL`: Chuỗi kết nối PostgreSQL của hệ thống (giống trong `backend/.env`).
- `MEDIA_OUTPUT_DIR`: Đường dẫn thư mục lưu audio và ảnh (`../backend/uploads`).

---

## 3. Các lệnh thực thi (Commands)

```bash
# 1. Cào toàn bộ dữ liệu (Reading, Listening, Grammar, Dictation, Vocabulary)
npm run crawl:all

# 2. Cào riêng đề Reading
npm run crawl:reading

# 3. Cào riêng đề Listening (kèm tải file Audio .mp3)
npm run crawl:listening

# 4. Cào 50 câu Grammar & Vocabulary
npm run crawl:grammar

# 5. Cào bài tập Nghe chép & Nói nhại (Dictation/Shadowing)
npm run crawl:dictation

# 6. Cào kho từ vựng cốt lõi
npm run crawl:vocabulary
```

---

## 4. Cấu trúc thư mục đầu ra (`crawler/output/`)

- `crawler/output/json/`: Chứa các file backup dạng JSON (`exam_de_01_full_reading_4_parts.json`, `dictation_sentences.json`, `vocabulary_sets.json`).
- `crawler/output/media/`: Chứa file âm thanh (.mp3) và tranh ảnh tải về.
- Dữ liệu đồng thời được nạp tự động vào PostgreSQL thông qua Prisma Client.
