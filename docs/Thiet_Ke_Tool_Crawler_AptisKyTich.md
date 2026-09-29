# TÀI LIỆU THIẾT KẾ CHI TIẾT: TOOL CRAWLER & DATABASE IMPORTER TỪ APTISKYTICH.VN

> **Hệ thống**: Aptis E-learning & Mock Testing Platform  
> **Thư mục công cụ**: `crawler/` (cùng cấp với `backend/` và `frontend/`)  
> **Mục tiêu**: Thu thập đề thi (Reading, Listening, Speaking, Writing, Grammar & Vocabulary), từ vựng (Vocabulary) và bài luyện nghe chép/nói nhại (Dictation & Shadowing) từ `https://aptiskytich.vn` và nạp vào cơ sở dữ liệu PostgreSQL của hệ thống.

---

## 1. TỔNG QUAN VÀ MỤC TIÊU HỆ THỐNG

### 1.1. Bối cảnh
Nền tảng `aptiskytich.vn` cung cấp kho đề luyện thi Aptis ESOL phong phú bao gồm:
- **Đề thi 4 kỹ năng**: Reading (4 Part), Listening (4 Part với audio), Speaking (4 Part với đề bài/ảnh), Writing (4 Part với các form phản hồi).
- **Grammar & Vocabulary**: 50 câu trắc nghiệm (25 ngữ pháp + 25 từ vựng).
- **Nghe chép & Nói nhại (Dictation & Shadowing)**: Hàng trăm câu thoại theo 3 cấp độ (Foundation, Momentum, Mastery) kèm audio MP3 và transcript.
- **Kho từ vựng**: Bộ từ vựng Aptis B1 - B2 cốt lõi kèm phiên âm, nghĩa tiếng Việt và câu ví dụ.

### 1.2. Mục tiêu của Tool Crawler
1. **Tự động hóa hoàn toàn**: Cào dữ liệu theo từng module hoặc toàn bộ hệ thống bằng CLI command.
2. **Chuẩn hóa cấu trúc**: Chuyển đổi dữ liệu cào được thành đúng chuẩn mô hình Prisma Schema (`backend/prisma/schema.prisma`).
3. **Quản lý tài nguyên đa phương tiện**: Tự động tải file audio (.mp3), file ảnh tranh Speaking (.jpg/.png) và lưu trữ cục bộ vào `backend/uploads/` hoặc CDN.
4. **Nạp trực tiếp vào Database**: Tích hợp trực tiếp với Prisma Client để `upsert` dữ liệu, tránh trùng lặp khi chạy lại nhiều lần.
5. **Hỗ trợ chạy Offline / Backup**: Xuất dữ liệu ra file JSON seed có cấu trúc để sao lưu hoặc khôi phục độc lập.

---

## 2. KIẾN TRÚC TỔNG THỂ CỦA TOOL

```
                             https://aptiskytich.vn
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
             [HTTP Client / API]            [Headless Browser (Puppeteer)]
            (Các endpoint API JSON)            (Các trang SSR / Render DOM)
                      │                                 │
                      └────────────────┬────────────────┘
                                       │ Raw Data
                                       ▼
                       ┌───────────────────────────────┐
                       │       MODULE SCRAPERS         │
                       │  - Reading Scraper            │
                       │  - Listening Scraper (+Media) │
                       │  - Grammar Scraper            │
                       │  - Speaking/Writing Scraper   │
                       │  - Dictation Scraper (+Media) │
                       │  - Vocabulary Scraper         │
                       └───────────────┬───────────────┘
                                       │ Normalized Data
                                       ▼
                       ┌───────────────────────────────┐
                       │     DATA TRANSFORMER &        │
                       │        MEDIA SYNC             │
                       │  - Download MP3/Images        │
                       │  - Format JSON for Prisma     │
                       └───────────────┬───────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
               [JSON Seed Files]               [Prisma Ingestion Engine]
           (crawler/output/*.json)                      │
                                                        ▼
                                             [PostgreSQL Database]
                                          (Exam, ExamPart, Question...)
```

---

## 3. CẤU TRÚC THƯ MỤC CÔNG CỤ (`crawler/`)

Đặt ngang hàng với `backend/` và `frontend/`:

```
d:\sontayweb\E-leaning&APTIS\
├── backend/                  # API NestJS / Express + Prisma
├── frontend/                 # Next.js 16 Web Application
├── crawler/                  # TOOL CRAWLER ĐƯỢC THIẾT KẾ
│   ├── package.json          # Quản lý dependencies (axios, cheerio, dotenv, tsx)
│   ├── tsconfig.json         # Cấu hình TypeScript
│   ├── .env                  # Cấu hình BASE_URL, DATABASE_URL, COOKIE
│   ├── src/
│   │   ├── index.ts          # CLI Entry Point điều khiển các module cào
│   │   ├── config.ts         # Cấu hình endpoint, headers, storage paths
│   │   ├── types.ts          # Định nghĩa TypeScript interfaces
│   │   ├── clients/
│   │   │   └── http-client.ts# Axios instance kèm retry, proxy, cookie session
│   │   ├── scrapers/
│   │   │   ├── reading.scraper.ts     # Cào 4 Part Reading
│   │   │   ├── listening.scraper.ts   # Cào 4 Part Listening + tải MP3
│   │   │   ├── grammar.scraper.ts     # Cào 50 câu Grammar & Vocabulary
│   │   │   ├── dictation.scraper.ts   # Cào các câu Nghe chép/Nói nhại
│   │   │   ├── vocabulary.scraper.ts  # Cào bộ từ vựng & flashcards
│   │   │   └── speaking-writing.scraper.ts # Cào đề Speaking & Writing
│   │   ├── utils/
│   │   │   ├── media-downloader.ts    # Tải và lưu audio/ảnh với checksum
│   │   │   └── text-cleaner.ts        # Làm sạch HTML tag, khoảng trắng thừa
│   │   └── importers/
│   │       ├── db-importer.ts         # Kết nối Prisma insert thẳng vào DB
│   │       └── json-exporter.ts       # Xuất file JSON backup
│   └── output/               # Chứa dữ liệu JSON và media đã cào
│       ├── media/            # File .mp3 và .png tải về
│       └── json/             # File .json theo từng module
└── docs/                     # Tài liệu dự án
```

---

## 4. CHI TIẾT CÁC MODULE CÀO DỮ LIỆU (SCRAPERS)

### 4.1. Module Reading Scraper (`reading.scraper.ts`)
Phân tích trang `https://aptiskytich.vn/reading` và các phòng thi:
- **Part 1 – Sentence comprehension (Gap fill)**:
  - Bóc tách đoạn văn chứa chỗ trống.
  - Trích xuất danh sách options (3 lựa chọn/chỗ trống).
  - Trích xuất đáp án chuẩn (`correct_answer`).
  - Ánh xạ sang `QuestionType.GAP_FILL`.
- **Part 2 + 3 – Text cohesion (Sentence order)**:
  - Bóc tách câu mở đầu cố định (`fixedSentence`).
  - Trích xuất 4-5 câu còn lại cần xáo trộn kèm mã ID `s2, s3, s4, s5`.
  - Trích xuất trật tự đúng `correctOrder` dạng mảng `['s2', 's3', 's4', 's5']`.
  - Ánh xạ sang `QuestionType.SENTENCE_ORDER`.
- **Part 4 – Opinion matching (4 Reviews)**:
  - Bóc tách 4 đoạn review của *Person A, Person B, Person C, Person D*.
  - Bóc tách 7 câu hỏi nhận định.
  - Ánh xạ sang `QuestionType.MATCHING`.
- **Part 5 – Long reading (Heading matching)**:
  - Bóc tách 7 đoạn văn bản dài.
  - Bóc tách danh sách 7-8 tiêu đề Heading đề bài cung cấp.
  - Ánh xạ sang `QuestionType.MATCHING` với options chứa toàn bộ heading.

### 4.2. Module Listening Scraper (`listening.scraper.ts`)
- **Part 1**: 13 câu trắc nghiệm ngắn, mỗi câu 1 file audio riêng + 3 lựa chọn A, B, C.
- **Part 2**: 1 file audio hội thoại của 4 người nói + dropdown ghép thông tin.
- **Part 3**: 1 file audio tranh luận giữa Người nam & Người nữ + 4 nhận định (Man / Woman / Both).
- **Part 4**: 2 bài độc thoại dài, mỗi bài có 2 câu hỏi trắc nghiệm (tổng 4 câu).
- **Media Handler**: Tự động tải file audio `.mp3` về `crawler/output/media/listening/{examId}/` và cập nhật đường dẫn `audio_url` tương đối chuẩn cho backend.

### 4.3. Module Grammar & Vocabulary Scraper (`grammar.scraper.ts`)
- Cào 50 câu trắc nghiệm chia làm 2 phần:
  - `Part 1: Grammar` (25 câu, 3 lựa chọn A, B, C)
  - `Part 2: Vocabulary` (25 câu, ghép từ/chọn từ đồng nghĩa)
- Bóc tách: `prompt`, `options`, `correct_answer`, `explanation` (lời giải thích chi tiết).

### 4.4. Module Dictation & Shadowing Scraper (`dictation.scraper.ts`)
- URL nguồn: `https://aptiskytich.vn/nghe-chep`
- Bóc tách theo 3 Level:
  - `Level 1 - Foundation`: Câu ngắn 3-6 từ, tốc độ vừa phải.
  - `Level 2 - Momentum`: Câu ghép 8-15 từ, từ vựng học thuật.
  - `Level 3 - Mastery`: Câu phức 15-25 từ, ngữ điệu tự nhiên.
- Dữ liệu thu thập:
  - `originalText`: Câu gốc đầy đủ.
  - `hints`: Các từ khóa gợi ý.
  - `audioUrl`: Tải file audio giọng đọc mẫu chuẩn.
  - `topic`: Ví dụ "Đề 24 - Part 1 - Bài 07".

### 4.5. Module Vocabulary Scraper (`vocabulary.scraper.ts`)
- URL nguồn: `https://aptiskytich.vn/tu-vung` hoặc các bộ từ vựng theo chủ đề.
- Dữ liệu thu thập:
  - `word`: Từ vựng tiếng Anh.
  - `phonetic`: Phiên âm quốc tế IPA (ví dụ `/əˈkɒm.ə.deɪt/`).
  - `meaning_vi`: Định nghĩa tiếng Việt.
  - `example_sentence`: Câu ví dụ ngữ cảnh.
  - `cefr_level`: B1 hoặc B2.
  - `audio_url`: File phát âm từ.

---

## 5. ÁNH XẠ DỮ LIỆU SANG PRISMA DATABASE SCHEMA

Dữ liệu sau khi cào sẽ được chuẩn hóa tương thích 100% với schema hiện tại của hệ thống:

| Bảng Cơ sở dữ liệu | Trường dữ liệu | Mô tả ánh xạ từ Scraper |
| :--- | :--- | :--- |
| **`Exam`** | `title`, `skill`, `duration_minutes`, `is_pro` | Tạo đề thi với kỹ năng tương ứng (`READING`, `LISTENING`, ...) |
| **`ExamPart`** | `part_number`, `title`, `instructions`, `passage_text`, `audio_url` | Chia từng phần thi và lưu văn bản đọc/audio liên quan |
| **`Question`** | `question_number`, `question_type`, `prompt`, `options`, `correct_answer`, `explanation` | Lưu chi tiết từng câu hỏi, dạng JSON cho các option phức tạp |
| **`DictationSentence`** | `level`, `topic`, `originalText`, `hints`, `audio_url` | Lưu vào bảng luyện tập nghe chép / nói nhại |
| **`VocabSet` / `VocabWord`** | `word`, `phonetic`, `meaning_vi`, `example_sentence`, `cefr_level` | Lưu vào kho từ vựng Aptis cốt lõi |

---

## 6. CƠ CHẾ XỬ LÝ PHÒNG THỦ & XÁC THỰC (AUTHENTICATION & ANTI-BOT)

1. **Quản lý Session & Cookie**:
   - Một số đề Pro hoặc đề chi tiết yêu cầu tài khoản đăng nhập trên `aptiskytich.vn`.
   - Tool hỗ trợ cấu hình `APTIS_SESSION_COOKIE` hoặc `BEARER_TOKEN` trong `.env` để gửi kèm header trong mọi request.
2. **Cơ chế Rate Limiting & Sleep**:
   - Giãn cách ngẫu nhiên 500ms – 1500ms giữa các lượt request để tránh bị chặn IP hoặc HTTP 429 (Too Many Requests).
3. **Cơ chế Retry với Exponential Backoff**:
   - Nếu gặp lỗi kết nối tạm thời hoặc timeout, tool tự động thử lại tối đa 3 lần trước khi đánh dấu lỗi câu hỏi.
4. **Fallback Puppeteer Headless**:
   - Đối với các trang sử dụng Single Page App (SPA) render bằng JavaScript client-side mà không có public API, tool sử dụng Puppeteer để nạp DOM và bóc tách dữ liệu đã kết xuất.

---

## 7. HƯỚNG DẪN CÀI ĐẶT VÀ VẬN HÀNH TOOL

### 7.1. Cài đặt môi trường
Tại thư mục gốc dự án:
```bash
cd crawler
npm install
```

### 7.2. Cấu hình biến môi trường (`crawler/.env`)
```env
# URL hệ thống nguồn
SOURCE_BASE_URL="https://aptiskytich.vn"
USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
APTIS_COOKIE="session_id=...; remember_token=..."

# Kết nối cơ sở dữ liệu hệ thống E-leaning&APTIS
DATABASE_URL="postgresql://postgres:password@localhost:5432/aptis_db?schema=public"

# Thư mục lưu media tải về (tương thích backend uploads)
MEDIA_OUTPUT_DIR="../backend/uploads"
```

### 7.3. Các lệnh thực thi (CLI Commands)
```bash
# 1. Cào toàn bộ dữ liệu Reading và nạp vào DB
npm run crawl:reading

# 2. Cào Listening (kèm tự động tải file Audio .mp3)
npm run crawl:listening

# 3. Cào 50 câu Grammar & Vocabulary
npm run crawl:grammar

# 4. Cào bài tập Nghe chép & Nói nhại (Dictation/Shadowing)
npm run crawl:dictation

# 5. Cào kho từ vựng Aptis B1 - B2
npm run crawl:vocabulary

# 6. Cào toàn bộ hệ thống (Full Sync)
npm run crawl:all
```
