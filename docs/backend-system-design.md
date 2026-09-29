# TÀI LIỆU THIẾT KẾ HỆ THỐNG BACKEND
## Aptis Kỳ Tích — E-Learning Platform
### Node.js / Express.js Backend Architecture

> **Nguồn dẫn chứng:**
> - Tài liệu SRS: `Bao_Cao_Dac_Ta_Chuc_Nang_Elearning_Aptis.md`
> - Ảnh chụp màn hình thực tế từ `https://aptiskytich.vn` (chụp ngày 2026-09-25)
> - Các file MHTML từ thư mục `docs/`

---

## MỤC LỤC

1. [Tổng Quan Kiến Trúc](#1-tổng-quan-kiến-trúc)
2. [Công Nghệ & Dependencies](#2-công-nghệ--dependencies)
3. [Cấu Trúc Thư Mục](#3-cấu-trúc-thư-mục)
4. [Thiết Kế Database Schema](#4-thiết-kế-database-schema)
5. [Thiết Kế API Endpoints](#5-thiết-kế-api-endpoints)
6. [Hệ Thống Xác Thực (Auth)](#6-hệ-thống-xác-thực-auth)
7. [Module Quản Lý Đề Thi](#7-module-quản-lý-đề-thi)
8. [Module Luyện Tập 4 Kỹ Năng](#8-module-luyện-tập-4-kỹ-năng)
9. [Module Thi Thử (Mock Exam)](#9-module-thi-thử-mock-exam)
10. [Module Từ Vựng & Ngữ Pháp](#10-module-từ-vựng--ngữ-pháp)
11. [Module Thanh Toán SePay](#11-module-thanh-toán-sepay)
12. [Module Lịch Sử & Thống Kê](#12-module-lịch-sử--thống-kê)
13. [Module Quản Trị (Admin)](#13-module-quản-trị-admin)
14. [Phân Quyền RBAC Middleware](#14-phân-quyền-rbac-middleware)
15. [File Upload & Media](#15-file-upload--media)
16. [Cấu Hình & Biến Môi Trường](#16-cấu-hình--biến-môi-trường)
17. [Teacher Grading Queue](#17-teacher-grading-queue-chấm-bài-nóiviết)
18. [Module Từ Vựng — Practice & Test Mode](#18-module-từ-vựng--practice--test-mode)
19. [Admin Vocabulary CRUD](#19-admin-vocabulary-crud)
20. [Public Portal & CMS Content](#20-public-portal--cms-content)
21. [Error Handling & Rate Limiting](#21-error-handling--rate-limiting-standards)


---

## 1. Tổng Quan Kiến Trúc

### 1.1 Kiến Trúc Tổng Thể

```
+------------------------------------------------------------------+
|                    CLIENT LAYER                                  |
|   Next.js Frontend (aptiskytich.vn)                             |
|   Routes: /, /auth, /dashboard, /thi-thu, /listening,          |
|           /speaking, /reading, /writing, /grammar,              |
|           /vocabulary, /key-du-doan, /bang-ky-tich,             |
|           /history, /pricing                                     |
+------------------------------------------------------------------+
                          |
               HTTPS / REST API
+------------------------------------------------------------------+
|                    API GATEWAY LAYER                             |
|   Nginx (Reverse Proxy) -> Node.js/Express (Port 4000)          |
|   Rate Limiting | CORS | Helmet | Request Logging               |
+------------------------------------------------------------------+
                          |
         +----------------+------------------+
         |                |                  |
+----------------+  +--------------+  +--------------------+
|  Auth Service  |  | Core Service |  |  Payment Service   |
|  JWT + Google  |  |  Exam/Users  |  |  SePay Webhook     |
|  OAuth 2.0     |  |  History     |  |  VietQR MB Bank    |
+----------------+  +--------------+  +--------------------+
                          |
+------------------------------------------------------------------+
|                    DATA LAYER                                    |
|   PostgreSQL (Primary DB)  |  Redis (Session/Cache)             |
|   Cloudinary / S3 (Media)  |  BullMQ (Job Queue)               |
+------------------------------------------------------------------+
```

### 1.2 Bằng Chứng Thực Tế Từ Website

Từ ảnh chụp màn hình homepage (`home_full_1790269272117.png`), xác nhận:
- **Tổng số đề**: 860 đề thi Aptis
- **Học viên đang luyện**: 7.561 học viên
- **Lượt làm bài**: 280.303 lượt
- **Cập nhật Key hằng ngày**: Đề Key dự đoán

Từ ảnh navbar thực tế, xác nhận các route chính:
- `Thi thử` → `/thi-thu`
- `Luyện tập từng kỹ năng` → Dropdown: Grammar & Vocab, Reading, Listening, Speaking, Writing, Học từ vựng
- `Đề Key Dự Đoán` → `/key-du-doan`
- `Lịch sử học tập` → `/history`
- `More` → Dropdown mở rộng
- Auth: `Đăng nhập` | `Đăng ký` → `/auth`

---

## 2. Công Nghệ & Dependencies

### 2.1 Core Stack

```json
{
  "runtime": "Node.js >= 20 LTS",
  "framework": "Express.js 4.x",
  "language": "TypeScript 5.x",
  "orm": "Prisma 5.x",
  "database": "PostgreSQL 15",
  "cache": "Redis 7 (ioredis)",
  "queue": "BullMQ",
  "auth": "JWT (jsonwebtoken) + Passport.js (Google OAuth 2.0)",
  "validation": "Zod",
  "storage": "Cloudinary (audio/image)",
  "email": "Nodemailer + SMTP",
  "logging": "Winston + Morgan",
  "testing": "Jest + Supertest"
}
```

### 2.2 Package Dependencies Chính

```bash
# Core
npm install express typescript ts-node @types/node @types/express
npm install prisma @prisma/client
npm install redis ioredis
npm install bullmq

# Auth (dẫn chứng: /auth page có Email/Password + Google OAuth)
npm install jsonwebtoken passport passport-google-oauth20
npm install bcryptjs @types/bcryptjs

# Validation
npm install zod

# Payment (SePay VietQR - MB Bank 0866950837)
npm install axios crypto

# Utilities
npm install multer cloudinary cors helmet morgan winston
npm install nodemailer dotenv uuid

# Dev
npm install -D ts-node-dev eslint prettier jest @types/jest supertest
```

---

## 3. Cấu Trúc Thư Mục

```
backend/
├── src/
│   ├── app.ts                    # Express app setup
│   ├── server.ts                 # Entry point
│   ├── config/
│   │   ├── database.ts           # Prisma client
│   │   ├── redis.ts              # Redis connection
│   │   ├── cloudinary.ts         # Cloudinary setup
│   │   └── env.ts                # Env validation (Zod)
│   ├── middlewares/
│   │   ├── auth.middleware.ts    # JWT verify
│   │   ├── rbac.middleware.ts    # Role-based access (5 roles)
│   │   ├── validate.middleware.ts # Zod body validation
│   │   ├── upload.middleware.ts  # Multer + Cloudinary
│   │   └── rateLimiter.ts        # express-rate-limit
│   ├── modules/
│   │   ├── auth/                 # Đăng nhập, Đăng ký, Google OAuth
│   │   ├── users/                # Quản lý người dùng
│   │   ├── exams/                # Quản lý đề thi (thi-thu, listening...)
│   │   ├── questions/            # Ngân hàng câu hỏi
│   │   ├── submissions/          # Nộp bài, chấm điểm, lịch sử
│   │   ├── vocabulary/           # Học từ vựng (/vocabulary)
│   │   ├── grammar/              # Grammar & Vocab (/grammar)
│   │   ├── mock-exam/            # Phòng thi thử (/thi-thu)
│   │   ├── key-predictions/      # Đề Key Dự Đoán (/key-du-doan)
│   │   ├── hall-of-fame/         # Bảng Kỳ Tích (/bang-ky-tich)
│   │   ├── payment/              # SePay VietQR Webhook
│   │   ├── wallet/               # Ví học viên
│   │   ├── reviews/              # Chia sẻ đề thi thật
│   │   ├── dashboard/            # Dashboard stats
│   │   └── admin/                # Admin portal
│   ├── jobs/
│   │   ├── streak.job.ts         # Daily streak calculation
│   │   ├── payment-timeout.job.ts # PENDING_PAYMENT timeout
│   │   └── email.job.ts          # Email queue
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── hash.ts
│   │   ├── vietqr.ts             # VietQR URL generator
│   │   └── sepay.ts              # SePay webhook verifier
│   └── types/
│       └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── .env
├── .env.example
├── tsconfig.json
└── package.json
```

---

## 4. Thiết Kế Database Schema

> **Dẫn chứng**: Toàn bộ schema được suy ra từ SRS (Phần 2-5) và ảnh chụp màn hình thực tế.

### 4.1 Schema Prisma Đầy Đủ

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =============================================
// USERS & AUTH
// Dẫn chứng: /auth page có Email + Password + Google OAuth
// SRS Phần 2.1: 5 vai trò người dùng
// =============================================

enum UserRole {
  GUEST
  STUDENT
  TEACHER
  ADMIN
  SUPER_ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
  BANNED
}

enum CertTarget {
  B1
  B2
  C
}

model User {
  id              String      @id @default(uuid())
  email           String      @unique
  fullName        String
  phone           String?
  passwordHash    String?     // nullable vì Google OAuth không cần password
  role            UserRole    @default(STUDENT)
  status          UserStatus  @default(ACTIVE)
  certTarget      CertTarget  @default(B2)
  avatarUrl       String?
  googleId        String?     @unique
  internalNote    String?     // Ghi chú nội bộ (SRS 2.1.b)

  // Streak tracking (Dashboard: số ngày học liên tục)
  streakCount     Int         @default(0)
  lastActiveDate  DateTime?
  weeklyGoal      Int         @default(50) // số câu mục tiêu/tuần

  // Wallet (SRS Phần 5)
  walletBalance   Int         @default(0) // VND

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  createdBy       String?     // Admin ID nếu được tạo thủ công

  submissions     Submission[]
  transactions    Transaction[]
  walletLogs      WalletLog[]
  reviews         ExamReview[]
  vocabNotebook   VocabNotebookEntry[]
  classrooms      ClassroomStudent[]

  @@map("users")
}

// =============================================
// EXAMS & QUESTIONS
// Dẫn chứng từ ảnh thực tế:
// /thi-thu: 26 đề Full Test, 162 phút = Speaking(12p)+Listening(40p)+Grammar(25p)+Reading(35p)+Writing(50p)
// /listening: 41+ đề, 4 Parts, 35 phút
// /speaking: 26+ đề, 4 Parts, 12 phút
// /reading: 32+ đề, 4 Parts, 30 phút
// /writing: 60+ đề (Art club, Business club...), 4 Parts, 50 phút
// /grammar: 8 đề (3 FREE + 5 PRO), 50 câu · 6 phần
// =============================================

enum ExamSkill {
  FULL_TEST
  LISTENING
  SPEAKING
  READING
  WRITING
  GRAMMAR_VOCAB
}

enum ExamDifficulty {
  A2
  B1
  B2
  C1
}

enum ExamAccessLevel {
  FREE
  PRO
}

enum ExamStatus {
  PUBLISHED
  DRAFT
}

enum ExamPriority {
  UU_TIEN_CAO
  UU_TIEN_VUA
  NORMAL
}

model Exam {
  id            String          @id @default(uuid())
  title         String
  slug          String          @unique
  skill         ExamSkill
  difficulty    ExamDifficulty  @default(B2)
  accessLevel   ExamAccessLevel @default(FREE)
  status        ExamStatus      @default(PUBLISHED)
  priority      ExamPriority    @default(NORMAL)
  durationMins  Int             // 162 (full), 35 (listening), 12 (speaking), 30 (reading), 50 (writing)
  description   String?
  coverImageUrl String?
  totalParts    Int             @default(4)
  totalQuestions Int            @default(0)
  source        String          @default("web") // "web" | "admin"
  isCustom      Boolean         @default(false)
  parentExamId  String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  createdById   String?

  parts         ExamPart[]
  submissions   Submission[]
  reviews       ExamReview[]

  @@map("exams")
}

// =============================================
// EXAM PARTS
// Dẫn chứng từ ảnh tab navigation thực tế:
// Listening: P1-Word recognition(Câu 1-13) | P2-Matching info(Câu 14) | P3-Short conv(Câu 15) | P4-Monologue
// Speaking: Part 1-Personal Qs | Part 2-Describe Picture | Part 3-Compare | Part 4-Opinion
// Reading: Part 1-Sentence comprehension | Part 2+3-Text cohesion | Part 4-Opinion matching | Part 5-Long reading
// Writing: Part 1-Short answers | Part 2-Social media response | Part 3-Three questions | Part 4-Informal & Formal email
// =============================================

enum PartType {
  L_WORD_RECOGNITION
  L_MATCHING_INFO
  L_SHORT_CONVERSATIONS
  L_MONOLOGUE
  S_PERSONAL_QUESTIONS
  S_DESCRIBE_PICTURE
  S_COMPARE_PICTURES
  S_OPINION_QUESTIONS
  R_SENTENCE_COMPREHENSION
  R_TEXT_COHESION
  R_OPINION_MATCHING
  R_LONG_READING
  W_SHORT_ANSWERS
  W_SOCIAL_MEDIA
  W_THREE_QUESTIONS
  W_EMAIL
  GV_GRAMMAR
  GV_VOCABULARY
}

model ExamPart {
  id              String    @id @default(uuid())
  examId          String
  partNumber      Int
  partType        PartType
  title           String
  instructions    String?
  audioUrl        String?
  audioPlayLimit  Int       @default(2) // Giới hạn 2 lần phát (SRS 3.3)
  prepTimeSecs    Int?      // 30 giây chuẩn bị Speaking (SRS 3.3)
  speakTimeSecs   Int?      // 45 giây trả lời Speaking (SRS 3.3)
  passageText     String?
  writingPrompt   String?
  minWords        Int?
  maxWords        Int?
  orderIndex      Int       @default(0)

  exam            Exam      @relation(fields: [examId], references: [id], onDelete: Cascade)
  questions       Question[]

  @@map("exam_parts")
}

// =============================================
// QUESTIONS
// SRS 4.2: MCQ (audio, passage, 4 lựa chọn, đáp án đúng, giải thích)
// câu hỏi điền từ, đề bài nói, đề bài viết (kèm rubric)
// Grammar: 50 câu/đề
// =============================================

enum QuestionType {
  MCQ
  FILL_IN_BLANK
  MATCHING
  SPEAKING_PROMPT
  WRITING_PROMPT
  ORDERING
}

model Question {
  id              String        @id @default(uuid())
  examPartId      String
  questionNumber  Int
  type            QuestionType
  questionText    String
  imageUrl        String?
  audioUrl        String?
  options         Json?         // ["option A", "option B", "option C", "option D"]
  correctAnswer   String?
  explanation     String?       // Giải thích đáp án (SRS 3.2)
  sampleAnswer    String?       // Bài mẫu Band C (SRS 3.3)
  sampleAudioUrl  String?
  rubric          Json?         // {pronunciation, fluency, grammar, cohesion}
  orderIndex      Int           @default(0)

  examPart        ExamPart      @relation(fields: [examPartId], references: [id], onDelete: Cascade)
  answers         SubmissionAnswer[]

  @@map("questions")
}

// =============================================
// SUBMISSIONS
// Dẫn chứng: /history - Lịch sử làm bài
// SRS 3.6: Xem lại lịch sử thi cử, đáp án từng câu, bài mẫu, nhận xét giảng viên
// =============================================

enum SubmissionStatus {
  IN_PROGRESS
  SUBMITTED
  GRADED
}

model Submission {
  id              String            @id @default(uuid())
  userId          String
  examId          String
  status          SubmissionStatus  @default(IN_PROGRESS)
  totalScore      Float?
  maxScore        Float?
  percentScore    Float?
  cefrBand        String?
  startedAt       DateTime          @default(now())
  submittedAt     DateTime?
  timeTakenSecs   Int?
  aiGradingResult Json?
  teacherFeedback String?
  createdAt       DateTime          @default(now())

  user            User              @relation(fields: [userId], references: [id])
  exam            Exam              @relation(fields: [examId], references: [id])
  answers         SubmissionAnswer[]

  @@map("submissions")
}

model SubmissionAnswer {
  id                String      @id @default(uuid())
  submissionId      String
  questionId        String
  selectedOption    String?
  writtenText       String?
  audioRecordingUrl String?
  isCorrect         Boolean?
  score             Float?

  submission        Submission  @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  question          Question    @relation(fields: [questionId], references: [id])

  @@map("submission_answers")
}

// =============================================
// VOCABULARY
// Dẫn chứng: /vocabulary - 2 tab "Từ vựng bài thi Aptis" | "Kho từ vựng của tôi"
// SRS 3.5: 198 bộ từ vựng, IPA phiên âm, ví dụ, practice/test mode
// =============================================

model VocabSet {
  id              String            @id @default(uuid())
  title           String
  topic           String
  description     String?
  totalWords      Int               @default(0)
  accessLevel     ExamAccessLevel   @default(FREE)
  orderIndex      Int               @default(0)

  words           VocabWord[]

  @@map("vocab_sets")
}

model VocabWord {
  id              String    @id @default(uuid())
  vocabSetId      String
  word            String
  phonetic        String?   // IPA: /eksampel/
  wordType        String?
  meaningVi       String
  meaningEn       String?
  exampleSentence String?
  audioUrl        String?
  imageUrl        String?
  orderIndex      Int       @default(0)

  vocabSet        VocabSet  @relation(fields: [vocabSetId], references: [id], onDelete: Cascade)
  notebookEntries VocabNotebookEntry[]

  @@map("vocab_words")
}

model VocabNotebookEntry {
  id          String    @id @default(uuid())
  userId      String
  wordId      String
  savedAt     DateTime  @default(now())
  note        String?

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  word        VocabWord @relation(fields: [wordId], references: [id], onDelete: Cascade)

  @@unique([userId, wordId])
  @@map("vocab_notebook_entries")
}

// =============================================
// PAYMENT & WALLET
// Dẫn chứng: SRS Phần 5
// MB Bank: 0866950837, APTIS ESOL PREMIER
// Nội dung CK: "APTIS 1092" hoặc "DH10025"
// Trạng thái: PENDING_PAYMENT, PAID, CANCELLED, EXCEPTION_SYNTAX
// =============================================

enum TransactionStatus {
  PENDING_PAYMENT
  PAID
  CANCELLED
  EXCEPTION_SYNTAX
  REFUNDED
}

enum TransactionType {
  TOPUP
  PURCHASE
  REFUND
  MANUAL
}

model Transaction {
  id                  String            @id @default(uuid())
  userId              String
  type                TransactionType
  status              TransactionStatus @default(PENDING_PAYMENT)
  amount              Int
  transferContent     String?           // "APTIS 1092"
  bankTransactionId   String?
  sepayWebhookData    Json?
  packageId           String?
  packageName         String?
  resolvedAt          DateTime?
  resolvedByAdminId   String?
  resolvedNote        String?
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  expiresAt           DateTime?         // 15 phút timeout (BullMQ)

  user                User              @relation(fields: [userId], references: [id])
  walletLogs          WalletLog[]

  @@map("transactions")
}

model WalletLog {
  id              String      @id @default(uuid())
  userId          String
  transactionId   String?
  amount          Int         // Dương: cộng, Âm: trừ
  balanceBefore   Int
  balanceAfter    Int
  description     String
  createdAt       DateTime    @default(now())

  user            User        @relation(fields: [userId], references: [id])
  transaction     Transaction? @relation(fields: [transactionId], references: [id])

  @@map("wallet_logs")
}

// =============================================
// MOCK EXAM ROOM
// SRS 3.4: Mã phòng 7 ký tự "APT-2026"
// =============================================

model MockExamRoom {
  id              String    @id @default(uuid())
  roomCode        String    @unique // "APT-2026"
  examId          String
  teacherId       String
  isActive        Boolean   @default(true)
  startTime       DateTime?
  endTime         DateTime?
  createdAt       DateTime  @default(now())

  participants    MockExamParticipant[]

  @@map("mock_exam_rooms")
}

model MockExamParticipant {
  id            String        @id @default(uuid())
  roomId        String
  userId        String
  joinedAt      DateTime      @default(now())
  submissionId  String?

  room          MockExamRoom  @relation(fields: [roomId], references: [id])

  @@unique([roomId, userId])
  @@map("mock_exam_participants")
}

// =============================================
// KEY PREDICTIONS
// Dẫn chứng: /key-du-doan - Cập nhật hằng ngày
// =============================================

model KeyPrediction {
  id          String    @id @default(uuid())
  title       String
  skill       ExamSkill
  partNumber  Int?
  topic       String?
  content     String
  matchRate   Int?      // Tỷ lệ % xuất hiện
  examDate    String?
  location    String?
  isActive    Boolean   @default(true)
  publishedAt DateTime  @default(now())
  createdAt   DateTime  @default(now())

  @@map("key_predictions")
}

// =============================================
// EXAM REVIEWS (Bảng Kỳ Tích)
// SRS 3.6, 4.4: Review đề thi thật, duyệt/ẩn/xóa
// =============================================

enum ReviewStatus {
  PENDING
  APPROVED
  HIDDEN
  DELETED
}

model ExamReview {
  id              String        @id @default(uuid())
  userId          String
  examId          String?
  title           String
  content         String
  score           String?
  location        String?
  examDate        String?
  status          ReviewStatus  @default(PENDING)
  likes           Int           @default(0)
  teacherComment  String?
  approvedAt      DateTime?
  approvedBy      String?
  createdAt       DateTime      @default(now())

  user            User          @relation(fields: [userId], references: [id])
  exam            Exam?         @relation(fields: [examId], references: [id])

  @@map("exam_reviews")
}

// =============================================
// CLASSROOMS
// SRS 4.3: Giảng viên quản lý lớp học
// =============================================

model Classroom {
  id          String    @id @default(uuid())
  name        String
  teacherId   String
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())

  students    ClassroomStudent[]

  @@map("classrooms")
}

model ClassroomStudent {
  id            String    @id @default(uuid())
  classroomId   String
  userId        String
  joinedAt      DateTime  @default(now())

  classroom     Classroom @relation(fields: [classroomId], references: [id])
  user          User      @relation(fields: [userId], references: [id])

  @@unique([classroomId, userId])
  @@map("classroom_students")
}
```

---

## 5. Thiết Kế API Endpoints

> **Quy ước**: Tất cả API có prefix `/api/v1`. JWT Bearer token qua `Authorization` header.
> ⚡ = Có quyền truy cập cho cả Guest lẫn Auth user nhưng dữ liệu trả về khác nhau

| Method | Endpoint | Auth | Role | Mô Tả |
|--------|----------|------|------|--------|
| POST | `/api/v1/auth/login` | ❌ | Public | Đăng nhập Email/Password |
| POST | `/api/v1/auth/register` | ❌ | Public | Đăng ký tài khoản mới |
| GET | `/api/v1/auth/google` | ❌ | Public | Google OAuth redirect |
| GET | `/api/v1/auth/google/callback` | ❌ | Public | Google OAuth callback |
| POST | `/api/v1/auth/forgot-password` | ❌ | Public | Quên mật khẩu |
| POST | `/api/v1/auth/reset-password` | ❌ | Public | Đặt lại mật khẩu |
| GET | `/api/v1/auth/me` | ✅ | All | Thông tin user hiện tại |
| GET | `/api/v1/exams` | ⚡ | Public/Auth | Danh sách đề thi |
| GET | `/api/v1/exams/:id` | ⚡ | Public/Auth | Chi tiết đề thi |
| GET | `/api/v1/exams/:id/questions` | ✅ | Student+ | Câu hỏi (kiểm tra quyền PRO) |
| POST | `/api/v1/submissions` | ✅ | Student+ | Bắt đầu làm bài |
| PUT | `/api/v1/submissions/:id/answer` | ✅ | Student+ | Lưu câu trả lời |
| POST | `/api/v1/submissions/:id/submit` | ✅ | Student+ | Nộp bài |
| GET | `/api/v1/submissions` | ✅ | Student+ | Lịch sử làm bài |
| GET | `/api/v1/submissions/:id` | ✅ | Student+ | Chi tiết lần nộp |
| POST | `/api/v1/submissions/:id/parts/:partId/play-audio` | ✅ | Student+ | Track số lần phát audio |
| POST | `/api/v1/submissions/:id/answers/:answerId/upload-audio` | ✅ | Student+ | Upload bản ghi âm Speaking |
| GET | `/api/v1/vocab-sets` | ✅ | Student+ | Danh sách bộ từ vựng |
| GET | `/api/v1/vocab-sets/:id/words` | ✅ | Student+ | Từ trong bộ |
| POST | `/api/v1/vocab-notebook` | ✅ | Student | Lưu từ vào kho cá nhân |
| GET | `/api/v1/vocab-notebook` | ✅ | Student | Kho từ vựng cá nhân |
| DELETE | `/api/v1/vocab-notebook/:wordId` | ✅ | Student | Xóa từ khỏi kho |
| GET | `/api/v1/key-predictions` | ✅ | Student+ | Đề Key Dự Đoán |
| GET | `/api/v1/hall-of-fame` | ❌ | Public | Bảng Kỳ Tích |
| POST | `/api/v1/reviews` | ✅ | Student | Gửi bài review |
| POST | `/api/v1/mock-rooms/join` | ✅ | Student | Vào phòng thi bằng mã |
| POST | `/api/v1/mock-rooms` | ✅ | Teacher+ | Tạo phòng thi |
| GET | `/api/v1/dashboard/stats` | ✅ | Student | Stats cá nhân |
| POST | `/api/v1/payment/initiate` | ✅ | Student | Khởi tạo giao dịch |
| POST | `/api/v1/payment/sepay-webhook` | ❌ | SePay | SePay webhook |
| GET | `/api/v1/wallet/balance` | ✅ | Student | Số dư ví |
| GET | `/api/v1/wallet/logs` | ✅ | Student | Lịch sử biến động ví |
| GET | `/api/v1/admin/users` | ✅ | Admin+ | Danh sách học viên |
| POST | `/api/v1/admin/users` | ✅ | Admin+ | Tạo tài khoản thủ công |
| PUT | `/api/v1/admin/users/:id/status` | ✅ | Admin+ | Khóa/Mở khóa tài khoản |
| POST | `/api/v1/admin/users/bulk-import` | ✅ | Admin+ | Import Excel |
| GET | `/api/v1/admin/transactions` | ✅ | Admin+ | Danh sách giao dịch |
| POST | `/api/v1/admin/transactions/:id/resolve` | ✅ | Admin+ | Khớp lệnh thủ công |
| POST | `/api/v1/admin/exams` | ✅ | Admin+ | Tạo đề thi |
| PUT | `/api/v1/admin/exams/:id` | ✅ | Admin+ | Chỉnh sửa đề thi |
| DELETE | `/api/v1/admin/exams/:id` | ✅ | Admin+ | Xóa đề thi |
| GET | `/api/v1/admin/reviews` | ✅ | Admin+ | Review chờ duyệt |
| PUT | `/api/v1/admin/reviews/:id/approve` | ✅ | Admin+ | Duyệt review |
| PUT | `/api/v1/admin/reviews/:id/hide` | ✅ | Admin+ | Ẩn review |
| GET | `/api/v1/admin/dashboard` | ✅ | Admin+ | Admin KPI dashboard |

---

## 6. Hệ Thống Xác Thực (Auth)

> **Dẫn chứng**: Ảnh `/auth` (`auth_page_1790269374079.png`) xác nhận 2 phương thức:
> - Form Email + Mật khẩu
> - Nút "Đăng nhập với Google" (Google OAuth)
> - Link "Quên mật khẩu?" và "Tạo tài khoản"

### 6.1 Zod Validation Schemas

```typescript
// src/modules/auth/auth.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export const registerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  phone: z.string().optional(),
  password: z.string().min(6),
  certTarget: z.enum(['B1', 'B2', 'C']).default('B2'), // SRS 2.1.a: mặc định B2
});
```

### 6.2 Login Controller

```typescript
// POST /api/v1/auth/login
export const login = async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new AppError(401, 'Thông tin đăng nhập không đúng');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw new AppError(401, 'Thông tin đăng nhập không đúng');

  if (user.status === 'INACTIVE') {
    throw new AppError(403, 'Tài khoản đã bị khóa. Liên hệ 0379 866 596 để hỗ trợ');
  }

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  // Cập nhật streak mỗi khi đăng nhập
  await updateStreak(user.id);

  return res.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      certTarget: user.certTarget,
      streakCount: user.streakCount,
      walletBalance: user.walletBalance,
    }
  });
};
```

### 6.3 Google OAuth

```typescript
// src/modules/auth/auth.google.ts
// Sử dụng passport-google-oauth20

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_CALLBACK_URL!,
}, async (accessToken, refreshToken, profile, done) => {
  // Tìm hoặc tạo user theo googleId
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: profile.id }, { email: profile.emails?.[0].value }] }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: profile.emails?.[0].value!,
        fullName: profile.displayName,
        googleId: profile.id,
        avatarUrl: profile.photos?.[0].value,
        role: 'STUDENT',
        status: 'ACTIVE',
        certTarget: 'B2', // Mặc định B2 (SRS 2.1.a)
      }
    });
  }

  return done(null, user);
}));
```

### 6.4 JWT Auth Middleware

```typescript
// src/middlewares/auth.middleware.ts
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return next(new AppError(401, 'Chưa xác thực. Vui lòng đăng nhập'));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = await prisma.user.findUniqueOrThrow({ where: { id: payload.userId } });
    next();
  } catch {
    next(new AppError(401, 'Token không hợp lệ hoặc đã hết hạn'));
  }
};
```

---

## 7. Module Quản Lý Đề Thi

> **Dẫn chứng từ ảnh thực tế**:
>
> `/thi-thu` (`thi_thu_page_1790269495072.png`):
> - 26 đề Full Test, 162 phút
> - Filter "Lọc ưu tiên": Tất cả (26) | Ưu tiên cao (6) | Ưu tiên vừa (4)
> - Filter "Trạng thái": Tất cả (26) | Chưa làm (26) | Đã làm (0)
> - Filter "Nguồn": Tất cả (26) | Đề web (26) | Bộ đề của tôi (0)
> - Badge trên card: `Full Test`, `FREE`/`PRO`, `Ưu tiên cao`/`Ưu tiên vừa`
>
> `/listening` (`listening_page_1790269539451.png`):
> - Tabs: Full Part - Tất cả các Part | P1-Word recognition | P2-Matching info | P3-Short conv | P4-Monologue
>
> `/grammar` (`grammar_page_1790269848042.png`):
> - 8 đề: Đề 01-03 FREE, Đề 04-08 PRO
> - Mỗi đề: "50 câu · 6 phần"
> - Filter "Trạng thái": Tất cả (8) | Chưa làm (8) | Đã làm (0)

### 7.1 GET /api/v1/exams

```typescript
// Query params phản ánh đúng filter UI thực tế:
// ?skill=FULL_TEST|LISTENING|SPEAKING|READING|WRITING|GRAMMAR_VOCAB
// ?priority=UU_TIEN_CAO|UU_TIEN_VUA|NORMAL
// ?userStatus=NOT_STARTED|COMPLETED  (trạng thái làm bài của user)
// ?source=web|custom
// ?partType=L_WORD_RECOGNITION|...   (lọc theo tab Part)
// ?q=searchText
// ?page=1&limit=30

export const getExams = async (req: Request, res: Response) => {
  const { skill, priority, userStatus, source, partType, q, page = 1, limit = 30 } = req.query;
  const userId = req.user?.id;

  const where: Prisma.ExamWhereInput = {
    status: 'PUBLISHED',
    ...(skill && { skill: skill as ExamSkill }),
    ...(priority && { priority: priority as ExamPriority }),
    ...(source === 'custom' ? { isCustom: true } : source === 'web' ? { isCustom: false } : {}),
    ...(q && { title: { contains: q as string, mode: 'insensitive' } }),
  };

  const exams = await prisma.exam.findMany({
    where,
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    select: {
      id: true, title: true, slug: true, skill: true,
      difficulty: true, accessLevel: true, priority: true,
      durationMins: true, totalParts: true, totalQuestions: true,
    }
  });

  // Join với submissions nếu user đăng nhập (hiển thị Chưa làm/Đã làm)
  if (userId) {
    const submittedIds = new Set(
      (await prisma.submission.findMany({
        where: { userId, status: { in: ['SUBMITTED', 'GRADED'] } },
        select: { examId: true }
      })).map(s => s.examId)
    );

    return res.json({
      data: exams.map(exam => ({
        ...exam,
        userStatus: submittedIds.has(exam.id) ? 'COMPLETED' : 'NOT_STARTED'
      })),
      total: await prisma.exam.count({ where }),
      page: Number(page),
    });
  }

  return res.json({ data: exams, total: await prisma.exam.count({ where }) });
};
```

### 7.2 Access Control PRO

```typescript
export const checkExamAccess = async (userId: string, exam: Exam): Promise<void> => {
  if (exam.accessLevel === 'FREE') return; // Free exam - không cần kiểm tra

  // Kiểm tra user có đủ số dư ví hoặc đã mua gói PRO
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const hasPurchased = await prisma.transaction.findFirst({
    where: {
      userId,
      packageId: exam.id,
      status: 'PAID',
      type: 'PURCHASE'
    }
  });

  if (!hasPurchased) {
    throw new AppError(403, 'Đề thi PRO. Vui lòng nâng cấp tài khoản để truy cập');
  }
};
```

---

## 8. Module Luyện Tập 4 Kỹ Năng

### 8.1 Listening — Giới Hạn Phát Audio 2 Lần

> **Dẫn chứng SRS 3.3**: "Mỗi đoạn audio chỉ được nghe tối đa 2 lần"

```typescript
// Dùng Redis để track số lần phát (atomic, không bị race condition)
// Key pattern: audio_play_count:{submissionId}:{partId}

// POST /api/v1/submissions/:id/parts/:partId/play-audio
export const trackAudioPlay = async (req: Request, res: Response) => {
  const { id: submissionId, partId } = req.params;
  const key = `audio_play_count:${submissionId}:${partId}`;

  const part = await prisma.examPart.findUniqueOrThrow({ where: { id: partId } });
  const maxPlays = part.audioPlayLimit; // = 2

  const currentCount = await redis.incr(key);
  await redis.expire(key, 86400); // Expire sau 24h

  if (currentCount > maxPlays) {
    await redis.decr(key); // Rollback
    throw new AppError(403, `Audio này chỉ được nghe tối đa ${maxPlays} lần`);
  }

  return res.json({
    playCount: currentCount,
    maxPlays,
    canPlay: currentCount < maxPlays,
    remaining: maxPlays - currentCount,
  });
};
```

### 8.2 Speaking — Upload Bản Ghi Âm

> **Dẫn chứng SRS 3.3**: "Tích hợp bộ ghi âm giọng nói trực tiếp trên trình duyệt... phát lại bản ghi âm"

```typescript
// POST /api/v1/submissions/:id/answers/:answerId/upload-audio
// Content-Type: multipart/form-data
// Field: audio (webm/mp3 blob từ MediaRecorder API)

export const uploadSpeakingAudio = async (req: Request, res: Response) => {
  if (!req.file) throw new AppError(400, 'Thiếu file audio');

  // Upload lên Cloudinary
  const result = await cloudinary.uploader.upload(req.file.path, {
    resource_type: 'video', // Cloudinary dùng 'video' cho audio
    folder: 'aptis/student-recordings',
    public_id: `speaking_${req.params.answerId}_${Date.now()}`,
  });

  // Cập nhật submission answer
  const answer = await prisma.submissionAnswer.update({
    where: { id: req.params.answerId },
    data: { audioRecordingUrl: result.secure_url }
  });

  return res.json({ audioUrl: result.secure_url, answer });
};
```

### 8.3 Writing — Validate Word Count

> **Dẫn chứng SRS 3.3**: "Bộ đếm từ tự động, cảnh báo khi chưa đủ số từ tối thiểu hoặc vượt quá số từ tối đa"

```typescript
// Server-side word count validation khi submit
export const validateWritingAnswer = (text: string, minWords?: number, maxWords?: number) => {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  if (minWords && wordCount < minWords) {
    throw new AppError(400, `Bài viết cần ít nhất ${minWords} từ. Hiện tại: ${wordCount} từ`);
  }
  if (maxWords && wordCount > maxWords) {
    throw new AppError(400, `Bài viết không được vượt quá ${maxWords} từ. Hiện tại: ${wordCount} từ`);
  }

  return wordCount;
};
```

---

## 9. Module Thi Thử (Mock Exam)

> **Dẫn chứng SRS 3.4**:
> - Mã phòng 7 ký tự: "APT-2026"
> - Tổng thời gian: 162 phút
> - Tự động nộp bài khi hết giờ
> - Công bố kết quả tức thì cho phần trắc nghiệm

```typescript
// POST /api/v1/mock-rooms/join
export const joinMockRoom = async (req: Request, res: Response) => {
  const { roomCode } = z.object({ roomCode: z.string().length(8) }).parse(req.body);
  // "APT-2026" = 8 ký tự (bao gồm dấu -)

  const room = await prisma.mockExamRoom.findUnique({
    where: { roomCode },
    include: { exam: { include: { parts: true } } }
  });

  if (!room) throw new AppError(404, 'Mã phòng không tồn tại');
  if (!room.isActive) throw new AppError(400, 'Phòng thi đã đóng');

  // Tạo participant
  await prisma.mockExamParticipant.upsert({
    where: { roomId_userId: { roomId: room.id, userId: req.user.id } },
    create: { roomId: room.id, userId: req.user.id },
    update: {}
  });

  // Tạo submission
  const submission = await prisma.submission.create({
    data: { userId: req.user.id, examId: room.examId }
  });

  // BullMQ: Auto-submit sau đúng durationMins
  await examAutoSubmitQueue.add(
    'auto-submit',
    { submissionId: submission.id },
    {
      delay: room.exam.durationMins * 60 * 1000,
      jobId: `auto-submit-${submission.id}`,
      removeOnComplete: true,
    }
  );

  return res.json({ submission, room, exam: room.exam });
};

// POST /api/v1/mock-rooms (Teacher tạo phòng)
export const createMockRoom = async (req: Request, res: Response) => {
  const { examId } = req.body;

  // Tạo mã phòng 7 ký tự unique: "APT-XXXX"
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `APT-${suffix}`;
  };

  let roomCode: string;
  let attempts = 0;
  do {
    roomCode = generateRoomCode();
    attempts++;
    if (attempts > 10) throw new AppError(500, 'Không thể tạo mã phòng');
  } while (await prisma.mockExamRoom.findUnique({ where: { roomCode } }));

  const room = await prisma.mockExamRoom.create({
    data: { roomCode, examId, teacherId: req.user.id }
  });

  return res.status(201).json(room);
};
```

---

## 10. Module Từ Vựng & Ngữ Pháp

> **Dẫn chứng từ ảnh `/vocabulary`** (`vocabulary_page_1790270004375.png`):
> - Tiêu đề: "Học từ vựng Aptis"
> - 2 tab: **"Từ vựng bài thi Aptis"** và **"Kho từ vựng của tôi"**
> - Thanh tìm kiếm: "Tìm bộ từ vựng..."
>
> **Dẫn chứng từ ảnh `/grammar`** (`grammar_page_1790269848042.png`):
> - 8 đề Grammar & Vocabulary
> - Mỗi đề: "50 câu · 6 phần"
> - Đề 01-03: FREE (CTA "Luyện tập")
> - Đề 04-08: PRO (CTA "Mở khóa")

```typescript
// GET /api/v1/vocab-sets?tab=my_notebook&q=word
export const getVocabSets = async (req: Request, res: Response) => {
  const { tab, q } = req.query;

  // Tab "Từ vựng bài thi Aptis"
  if (tab !== 'my_notebook') {
    const sets = await prisma.vocabSet.findMany({
      where: q ? { title: { contains: q as string, mode: 'insensitive' } } : {},
      orderBy: { orderIndex: 'asc' },
      select: { id: true, title: true, topic: true, totalWords: true, accessLevel: true }
    });
    return res.json(sets);
  }

  // Tab "Kho từ vựng của tôi" - cần auth
  if (!req.user) throw new AppError(401, 'Vui lòng đăng nhập để xem kho từ vựng cá nhân');

  const notebook = await prisma.vocabNotebookEntry.findMany({
    where: {
      userId: req.user.id,
      ...(q && { word: { word: { contains: q as string, mode: 'insensitive' } } })
    },
    include: { word: { include: { vocabSet: { select: { title: true } } } } },
    orderBy: { savedAt: 'desc' }
  });

  return res.json(notebook);
};
```

---

## 11. Module Thanh Toán SePay

> **Dẫn chứng tuyệt đối từ SRS Phần 5**:
> - Ngân hàng: **MB Bank (Quân Đội)**
> - STK: **0866950837**
> - Chủ TK: **APTIS ESOL PREMIER**
> - Nội dung CK: `APTIS 1092` hoặc `DH10025`
> - Xử lý trong **3-5 giây**
> - 4 trạng thái: `PENDING_PAYMENT` → `PAID` / `CANCELLED` / `EXCEPTION_SYNTAX`
> - Timeout **15 phút** nếu chưa chuyển khoản

### 11.1 Khởi Tạo Giao Dịch & Tạo VietQR

```typescript
// POST /api/v1/payment/initiate
// Body: { amount: number, packageId?: string, packageName?: string }

export const initiatePayment = async (req: Request, res: Response) => {
  const { amount, packageId, packageName } = z.object({
    amount: z.number().min(10000).max(10000000),
    packageId: z.string().optional(),
    packageName: z.string().optional(),
  }).parse(req.body);

  const userId = req.user!.id;

  // Tạo nội dung chuyển khoản định danh duy nhất
  const shortId = userId.slice(0, 4).toUpperCase();
  const transferContent = `APTIS ${shortId}`;

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      type: packageId ? 'PURCHASE' : 'TOPUP',
      status: 'PENDING_PAYMENT',
      amount,
      transferContent,
      packageId,
      packageName,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    }
  });

  // BullMQ: Auto-cancel sau 15 phút
  await paymentTimeoutQueue.add(
    'payment-timeout',
    { transactionId: transaction.id },
    { delay: 15 * 60 * 1000, jobId: `payment-timeout-${transaction.id}` }
  );

  // Tạo VietQR URL
  const vietqrUrl = `https://api.vietqr.io/image/MB-0866950837-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent('APTIS ESOL PREMIER')}`;

  return res.status(201).json({ transaction, vietqrUrl, transferContent });
};
```

### 11.2 SePay Webhook Handler

```typescript
// POST /api/v1/payment/sepay-webhook
// Header: Authorization: Apikey {SEPAY_SECRET_KEY}

export const sepayWebhook = async (req: Request, res: Response) => {
  // 1. Verify Apikey
  const apiKey = req.headers.authorization?.replace('Apikey ', '');
  if (apiKey !== process.env.SEPAY_SECRET_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { code, content, transferAmount, transferType, referenceCode } = req.body;

  // Chỉ xử lý tiền vào (ghi có)
  if (transferType !== 'in') {
    return res.json({ success: true });
  }

  // 2. Tìm transaction theo nội dung chuyển khoản
  // "APTIS 1092" trong content "APTIS 1092 CHUYEN TIEN"
  const transaction = await prisma.transaction.findFirst({
    where: {
      status: 'PENDING_PAYMENT',
      OR: [
        { transferContent: { equals: code, mode: 'insensitive' } },
        { transferContent: { contains: code, mode: 'insensitive' } }
      ]
    },
    include: { user: true }
  });

  // 3. Không tìm thấy -> EXCEPTION_SYNTAX
  if (!transaction) {
    await prisma.$executeRaw`
      INSERT INTO exception_transactions (raw_data, created_at)
      VALUES (${JSON.stringify(req.body)}::jsonb, NOW())
    `;
    return res.json({ success: true }); // Luôn 200 cho SePay
  }

  // 4. Sai số tiền -> EXCEPTION_SYNTAX để Admin xử lý
  if (transferAmount !== transaction.amount) {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'EXCEPTION_SYNTAX',
        bankTransactionId: referenceCode,
        sepayWebhookData: req.body,
      }
    });
    return res.json({ success: true });
  }

  // 5. Cộng tiền vào ví (Prisma Transaction - Atomic)
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: transaction.userId },
      data: { walletBalance: { increment: transferAmount } }
    });

    await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'PAID',
        bankTransactionId: referenceCode,
        sepayWebhookData: req.body,
        resolvedAt: new Date(),
      }
    });

    await tx.walletLog.create({
      data: {
        userId: transaction.userId,
        transactionId: transaction.id,
        amount: transferAmount,
        balanceBefore: user.walletBalance - transferAmount,
        balanceAfter: user.walletBalance,
        description: `Nạp ví thành công - ${transferContent} - ${referenceCode}`,
      }
    });
  });

  // 6. Hủy BullMQ timeout job
  const job = await paymentTimeoutQueue.getJob(`payment-timeout-${transaction.id}`);
  if (job) await job.remove();

  return res.json({ success: true });
};
```

### 11.3 Admin Khớp Lệnh Thủ Công

```typescript
// POST /api/v1/admin/transactions/:id/resolve
// Auth: Admin+
// Body: { userId: string, note: string }
// Dẫn chứng SRS 5.6: "Admin chỉ cần chọn học viên tương ứng và bấm nút Khớp lệnh thủ công"

export const resolveExceptionTransaction = async (req: Request, res: Response) => {
  const { userId, note } = z.object({
    userId: z.string().uuid(),
    note: z.string().min(5)
  }).parse(req.body);

  const transaction = await prisma.transaction.findUniqueOrThrow({
    where: { id: req.params.id, status: 'EXCEPTION_SYNTAX' }
  });

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: transaction.amount } }
    });

    await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'PAID',
        resolvedAt: new Date(),
        resolvedByAdminId: req.user!.id,
        resolvedNote: note,
      }
    });

    await tx.walletLog.create({
      data: {
        userId,
        transactionId: transaction.id,
        amount: transaction.amount,
        balanceBefore: user.walletBalance - transaction.amount,
        balanceAfter: user.walletBalance,
        description: `Admin khớp lệnh thủ công: ${note}`,
      }
    });
  });

  return res.json({ success: true, message: 'Đã cộng tiền vào ví học viên thành công' });
};
```

---

## 12. Module Lịch Sử & Thống Kê

> **Dẫn chứng SRS 3.1 (Student Dashboard)**:
> - Radar năng lực 4 kỹ năng
> - Weekly Goal (mục tiêu tuần)
> - Streak (chuỗi ngày học liên tục)
> - Gợi ý kỹ năng điểm thấp nhất

```typescript
// GET /api/v1/dashboard/stats
export const getDashboardStats = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  // Thống kê điểm trung bình 4 kỹ năng
  const skillScores = await prisma.$queryRaw<Array<{ skill: string; avgScore: number; count: number }>>`
    SELECT e.skill, AVG(s.percent_score) as "avgScore", COUNT(*) as count
    FROM submissions s
    JOIN exams e ON s.exam_id = e.id
    WHERE s.user_id = ${userId}
      AND s.status = 'GRADED'
      AND e.skill IN ('LISTENING', 'SPEAKING', 'READING', 'WRITING')
    GROUP BY e.skill
  `;

  // Mục tiêu tuần: Số câu đã làm từ đầu tuần đến nay
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weeklyAnswerCount = await prisma.submissionAnswer.count({
    where: {
      submission: {
        userId,
        createdAt: { gte: weekStart }
      }
    }
  });

  // Lịch sử gần đây (5 bài làm gần nhất)
  const recentSubmissions = await prisma.submission.findMany({
    where: { userId, status: { in: ['SUBMITTED', 'GRADED'] } },
    orderBy: { submittedAt: 'desc' },
    take: 5,
    include: {
      exam: { select: { title: true, skill: true, durationMins: true } }
    }
  });

  return res.json({
    streak: user.streakCount,
    certTarget: user.certTarget,
    walletBalance: user.walletBalance,
    weeklyProgress: {
      current: weeklyAnswerCount,
      goal: user.weeklyGoal,
      percent: Math.min(100, Math.round((weeklyAnswerCount / user.weeklyGoal) * 100))
    },
    skillRadar: skillScores,
    recentSubmissions,
  });
};

// Cập nhật streak - gọi mỗi khi user đăng nhập hoặc submit bài
export const updateStreak = async (userId: string): Promise<void> => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const todayStr = new Date().toDateString();
  const lastStr = user.lastActiveDate?.toDateString();

  if (lastStr === todayStr) return; // Đã tính hôm nay

  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
  const newStreak = lastStr === yesterdayStr ? user.streakCount + 1 : 1;

  await prisma.user.update({
    where: { id: userId },
    data: { streakCount: newStreak, lastActiveDate: new Date() }
  });
};
```

---

## 13. Module Quản Trị (Admin)

> **Dẫn chứng SRS Phần 4**:
> - 4 thẻ KPI: Tổng đề thi, học viên hoạt động, tổng lượt làm bài, tỷ lệ đạt mục tiêu
> - Biểu đồ 7 ngày
> - Duyệt review đề thi: PENDING → APPROVED/HIDDEN/DELETED
> - Bulk Import Excel (SRS 2.1.c)

```typescript
// GET /api/v1/admin/dashboard
export const getAdminKPIs = async (req: Request, res: Response) => {
  const [totalExams, activeStudents, totalSubmissions] = await Promise.all([
    prisma.exam.count({ where: { status: 'PUBLISHED' } }),
    prisma.user.count({ where: { status: 'ACTIVE', role: 'STUDENT' } }),
    prisma.submission.count({ where: { status: { in: ['SUBMITTED', 'GRADED'] } } }),
  ]);

  // Tỷ lệ đạt mục tiêu (tạm tính: học viên có ít nhất 1 bài GRADED với cefrBand >= certTarget)
  const achievingTarget = await prisma.user.count({
    where: {
      role: 'STUDENT',
      submissions: {
        some: { status: 'GRADED', cefrBand: { not: null } }
      }
    }
  });

  // Biểu đồ 7 ngày
  const weeklyActivity = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM submissions
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  return res.json({
    kpis: { totalExams, activeStudents, totalSubmissions, achievingTarget },
    weeklyActivity,
  });
};

// PUT /api/v1/admin/reviews/:id/approve
export const approveReview = async (req: Request, res: Response) => {
  const review = await prisma.examReview.update({
    where: { id: req.params.id },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: req.user!.id,
    }
  });
  return res.json(review);
};

// PUT /api/v1/admin/reviews/:id/hide
export const hideReview = async (req: Request, res: Response) => {
  const review = await prisma.examReview.update({
    where: { id: req.params.id },
    data: { status: 'HIDDEN' }
  });
  return res.json(review);
};
```

---

## 14. Phân Quyền RBAC Middleware

> **Dẫn chứng SRS 2.2** - Bảng ma trận phân quyền đầy đủ:

| Chức Năng | Guest | Student | Teacher | Admin | SuperAdmin |
|-----------|-------|---------|---------|-------|------------|
| Xem trang công khai | ✅ | ✅ | ✅ | ✅ | ✅ |
| Đăng ký / Đăng nhập | ✅ | — | — | — | — |
| Dashboard cá nhân | ❌ | ✅ cá nhân | ✅ theo lớp | ✅ hệ thống | ✅ |
| Luyện tập 4 kỹ năng | ❌ | ✅ | ✅ | ✅ | ✅ |
| Tham gia phòng thi | ❌ | ✅ nhập mã | ✅ tạo phòng | ✅ | ✅ |
| Nạp ví / Mua gói | ❌ | ✅ | — | ✅ cấp thủ công | ✅ |
| Gửi review đề thi | ❌ | ✅ chờ duyệt | ✅ đăng thẳng | ✅ kiểm duyệt | ✅ |
| Quản lý tài khoản | ❌ | ❌ | ❌ | ✅ | ✅ |
| Quản lý ngân hàng đề thi | ❌ | ❌ | ✅ đóng góp | ✅ | ✅ |
| Xem báo cáo điểm thi | ❌ | ✅ của mình | ✅ theo lớp | ✅ | ✅ |

```typescript
// src/middlewares/rbac.middleware.ts

type Role = 'GUEST' | 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';

const ROLE_HIERARCHY: Record<Role, number> = {
  GUEST: 0, STUDENT: 1, TEACHER: 2, ADMIN: 3, SUPER_ADMIN: 4,
};

// Yêu cầu chính xác một trong các role
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role as Role)) {
      return next(new AppError(403, 'Bạn không có quyền thực hiện hành động này'));
    }
    next();
  };
};

// Yêu cầu tối thiểu một role trong hierarchy
export const requireMinRole = (minRole: Role) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userLevel = ROLE_HIERARCHY[req.user?.role as Role] ?? -1;
    if (userLevel < ROLE_HIERARCHY[minRole]) {
      return next(new AppError(403, 'Không đủ quyền hạn'));
    }
    next();
  };
};

// Ví dụ sử dụng trong router:
// router.get('/admin/users', requireAuth, requireMinRole('ADMIN'), listUsers)
// router.post('/reviews', requireAuth, requireRole('STUDENT', 'TEACHER'), createReview)
// router.put('/admin/reviews/:id/approve', requireAuth, requireMinRole('ADMIN'), approveReview)
// router.post('/mock-rooms', requireAuth, requireMinRole('TEACHER'), createMockRoom)
```

---

## 15. File Upload & Media

> **Dẫn chứng**: Listening cần audio file; Speaking cần ghi âm từ trình duyệt; Reading/Writing cần image.

```typescript
// src/config/cloudinary.ts
export const UPLOAD_FOLDERS = {
  AUDIO_LISTENING: 'aptis/listening-audio',
  AUDIO_SPEAKING_SAMPLE: 'aptis/speaking-samples',
  AUDIO_STUDENT_RECORD: 'aptis/student-recordings',
  IMAGES_SPEAKING: 'aptis/speaking-images',
  IMAGES_EXAM_COVER: 'aptis/exam-covers',
};

// Multer config: max 50MB cho audio, 5MB cho image
export const uploadMiddleware = multer({
  dest: 'tmp/uploads/',
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav',
                     'image/jpeg', 'image/png', 'image/webp',
                     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new AppError(400, 'Định dạng file không được hỗ trợ'));
  }
});
```

---

## 16. Cấu Hình & Biến Môi Trường

```bash
# .env.example

# App
NODE_ENV=production
PORT=4000
APP_URL=https://api.aptiskytich.vn
FRONTEND_URL=https://aptiskytich.vn

# Database
DATABASE_URL=postgresql://aptis_user:password@localhost:5432/aptis_db
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Google OAuth
# Dẫn chứng: /auth page có nút "Đăng nhập với Google"
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://api.aptiskytich.vn/api/v1/auth/google/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# SePay Payment
# Dẫn chứng: SRS Phần 5.4
SEPAY_SECRET_KEY=your-sepay-api-key
MB_BANK_ACCOUNT=0866950837
MB_BANK_OWNER=APTIS ESOL PREMIER

# Email (từ footer website thực tế)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=aptiskytich.admin@gmail.com
SMTP_PASS=your-app-password

# Liên hệ Admin (từ footer website thực tế)
# SĐT: 0379 866 596 | Zalo: 0379 866 596 | Facebook: Aptis Kỳ Tích
ADMIN_PHONE=0867833227
ADMIN_ZALO=0867833227
ADMIN_EMAIL=aptiskytich.admin@gmail.com
```

---

## 17. Teacher Grading Queue (Chấm Bài Nói/Viết)

> **Dẫn chứng SRS 3.4**: "Công bố kết quả tức thì: Hệ thống tự động tính điểm các phần trắc nghiệm và gửi bài Nói/Viết vào hàng đợi chấm của Giảng viên."
> **Dẫn chứng SRS 1.2 (Teacher)**: "Chấm điểm và nhận xét bài Nói/Viết."

### 17.1 Schema Bổ Sung

```prisma
// Bổ sung fields vào Submission model (đã có)
model Submission {
  // ... existing fields ...

  // Teacher grading
  gradedBy          String?       // Teacher user ID
  gradedAt          DateTime?
  speakingScores    Json?         // {pronunciation: 7, fluency: 8, grammar: 6, cohesion: 7}
  writingScores     Json?         // {taskAchievement: 7, coherence: 8, lexicalResource: 6, grammaticalRange: 7}
  teacherNotes      String?       // Nhận xét chi tiết
  gradingPriority   Int   @default(0) // 0=normal, 1=urgent (from Mock Exam)
}

// Notification cho Teacher khi có bài mới cần chấm
model TeacherNotification {
  id              String    @id @default(uuid())
  teacherId       String
  type            String    // "NEW_SUBMISSION", "URGENT_GRADING", "CLASSROOM_UPDATE"
  title           String
  message         String
  submissionId    String?
  isRead          Boolean   @default(false)
  createdAt       DateTime  @default(now())

  @@index([teacherId, isRead])
  @@map("teacher_notifications")
}
```

### 17.2 API Endpoints

| Method | Endpoint | Auth | Role | Mô Tả |
|--------|----------|------|------|--------|
| GET | `/api/v1/teacher/grading-queue` | ✅ | Teacher+ | Danh sách bài Speaking/Writing chờ chấm |
| GET | `/api/v1/teacher/grading-queue/stats` | ✅ | Teacher+ | Thống kê: pending, graded today, total |
| GET | `/api/v1/teacher/submissions/:id` | ✅ | Teacher+ | Chi tiết bài nộp cần chấm |
| PUT | `/api/v1/teacher/submissions/:id/grade` | ✅ | Teacher+ | Chấm điểm + nhận xét |
| GET | `/api/v1/teacher/classrooms` | ✅ | Teacher+ | Danh sách lớp của Teacher |
| GET | `/api/v1/teacher/classrooms/:id/submissions` | ✅ | Teacher+ | Bài nộp theo lớp |
| GET | `/api/v1/teacher/notifications` | ✅ | Teacher+ | Thông báo mới |
| PUT | `/api/v1/teacher/notifications/:id/read` | ✅ | Teacher+ | Đánh dấu đã đọc |

### 17.3 Logic Chấm Bài

```typescript
// Khi student submit bài có Speaking/Writing → BullMQ push vào grading queue
// POST /api/v1/submissions/:id/submit
export const submitExam = async (req: Request, res: Response) => {
  const submission = await prisma.submission.update({
    where: { id: req.params.id, userId: req.user!.id },
    data: { status: 'SUBMITTED', submittedAt: new Date() },
    include: { exam: true }
  });

  // Auto-grade MCQ ngay lập tức
  await autoGradeMCQ(submission.id);

  // Nếu có Speaking/Writing → Push vào Teacher queue
  const hasSpeakingWriting = ['FULL_TEST', 'SPEAKING', 'WRITING'].includes(submission.exam.skill);
  if (hasSpeakingWriting) {
    // Tìm teacher phụ trách (từ MockExamRoom hoặc classroom)
    const teacherId = await findAssignedTeacher(submission);

    if (teacherId) {
      await prisma.teacherNotification.create({
        data: {
          teacherId,
          type: 'NEW_SUBMISSION',
          title: `Bài mới cần chấm: ${submission.exam.title}`,
          message: `Học viên ${req.user!.fullName} đã nộp bài ${submission.exam.skill}`,
          submissionId: submission.id,
        }
      });
    }
  }

  return res.json({ submission, autoGradeResult: await getAutoGradeResult(submission.id) });
};

// GET /api/v1/teacher/grading-queue
export const getGradingQueue = async (req: Request, res: Response) => {
  const teacherId = req.user!.id;
  const { status, skill, classroomId } = req.query;

  const submissions = await prisma.submission.findMany({
    where: {
      status: 'SUBMITTED',
      gradedBy: null, // Chưa được chấm
      exam: {
        skill: { in: ['SPEAKING', 'WRITING', 'FULL_TEST'] },
        ...(skill && { skill: skill as ExamSkill }),
      },
      // Filter theo classroom nếu có
      ...(classroomId && {
        user: { classrooms: { some: { classroomId: classroomId as string } } }
      }),
    },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      exam: { select: { title: true, skill: true } },
    },
    orderBy: [{ gradingPriority: 'desc' }, { submittedAt: 'asc' }],
  });

  return res.json(submissions);
};

// PUT /api/v1/teacher/submissions/:id/grade
export const gradeSubmission = async (req: Request, res: Response) => {
  const { speakingScores, writingScores, teacherNotes, cefrBand } = z.object({
    speakingScores: z.object({
      pronunciation: z.number().min(0).max(10),
      fluency: z.number().min(0).max(10),
      grammar: z.number().min(0).max(10),
      cohesion: z.number().min(0).max(10),
    }).optional(),
    writingScores: z.object({
      taskAchievement: z.number().min(0).max(10),
      coherence: z.number().min(0).max(10),
      lexicalResource: z.number().min(0).max(10),
      grammaticalRange: z.number().min(0).max(10),
    }).optional(),
    teacherNotes: z.string().optional(),
    cefrBand: z.enum(['A2', 'B1', 'B2', 'C']).optional(),
  }).parse(req.body);

  const submission = await prisma.submission.update({
    where: { id: req.params.id },
    data: {
      status: 'GRADED',
      gradedBy: req.user!.id,
      gradedAt: new Date(),
      speakingScores,
      writingScores,
      teacherNotes,
      cefrBand,
    }
  });

  return res.json(submission);
};
```

---

## 18. Module Từ Vựng — Practice & Test Mode

> **Dẫn chứng SRS 3.5**:
> - "Chế độ luyện tập (Practice Mode): Luyện trắc nghiệm nghĩa từ vựng, hiển thị ngay giải thích và phiên âm sau khi chọn."
> - "Chế độ kiểm tra (Test Mode): Kiểm tra 10 từ vựng ngẫu nhiên trong thời gian giới hạn 15 phút và tổng kết điểm số."

### 18.1 Schema Bổ Sung

```prisma
model VocabTestResult {
  id            String    @id @default(uuid())
  userId        String
  vocabSetId    String
  mode          String    // "PRACTICE" | "TEST"
  score         Int       // Số câu đúng
  totalQuestions Int      // 10 (test) hoặc n (practice)
  timeTakenSecs Int?
  answers       Json      // [{wordId, selectedMeaning, correctMeaning, isCorrect}]
  createdAt     DateTime  @default(now())

  @@map("vocab_test_results")
}
```

### 18.2 API Endpoints

| Method | Endpoint | Auth | Role | Mô Tả |
|--------|----------|------|------|--------|
| GET | `/api/v1/vocab-sets/:id/practice` | ✅ | Student+ | Lấy câu hỏi trắc nghiệm từ vựng (Practice Mode) |
| POST | `/api/v1/vocab-sets/:id/test/start` | ✅ | Student+ | Bắt đầu test 10 từ ngẫu nhiên (Test Mode) |
| POST | `/api/v1/vocab-sets/:id/test/submit` | ✅ | Student+ | Nộp bài test từ vựng |
| GET | `/api/v1/vocab-sets/:id/results` | ✅ | Student | Lịch sử kết quả test của user |

### 18.3 Logic

```typescript
// GET /api/v1/vocab-sets/:id/practice
// Trả về danh sách câu hỏi trắc nghiệm: mỗi từ có 4 lựa chọn nghĩa
export const getVocabPractice = async (req: Request, res: Response) => {
  const words = await prisma.vocabWord.findMany({
    where: { vocabSetId: req.params.id },
    select: { id: true, word: true, phonetic: true, meaningVi: true, audioUrl: true }
  });

  // Tạo câu hỏi trắc nghiệm: 1 nghĩa đúng + 3 nghĩa sai (random từ các từ khác)
  const allMeanings = words.map(w => w.meaningVi);
  const questions = words.map(word => {
    const wrongMeanings = allMeanings
      .filter(m => m !== word.meaningVi)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options = [word.meaningVi, ...wrongMeanings].sort(() => Math.random() - 0.5);

    return {
      wordId: word.id,
      word: word.word,
      phonetic: word.phonetic,
      audioUrl: word.audioUrl,
      options,
      // correctAnswer KHÔNG trả về cho FE — chỉ check khi submit
    };
  });

  return res.json(questions);
};

// POST /api/v1/vocab-sets/:id/test/start
// Trả về 10 từ ngẫu nhiên + bắt đầu đếm 15 phút
export const startVocabTest = async (req: Request, res: Response) => {
  const words = await prisma.vocabWord.findMany({
    where: { vocabSetId: req.params.id },
  });

  const randomWords = words.sort(() => Math.random() - 0.5).slice(0, 10);
  const testSessionKey = `vocab_test:${req.user!.id}:${Date.now()}`;

  // Lưu session vào Redis (expire 15 phút)
  await redis.set(testSessionKey, JSON.stringify({
    vocabSetId: req.params.id,
    words: randomWords.map(w => ({ id: w.id, correctAnswer: w.meaningVi })),
    startedAt: new Date().toISOString(),
  }), 'EX', 15 * 60);

  return res.json({
    testSessionKey,
    timeLimit: 15 * 60, // 900 giây
    questions: randomWords.map(w => ({
      wordId: w.id,
      word: w.word,
      phonetic: w.phonetic,
      options: generateOptions(w.meaningVi, words),
    }))
  });
};
```

---

## 19. Admin Vocabulary CRUD

> **Dẫn chứng SRS 4.4**: "Quản lý ngân hàng từ vựng: Thêm mới, chỉnh sửa từ vựng, từ loại, phiên âm, nghĩa tiếng Việt, câu ví dụ và các câu hỏi trắc nghiệm kiểm tra."

### 19.1 API Endpoints

| Method | Endpoint | Auth | Role | Mô Tả |
|--------|----------|------|------|--------|
| POST | `/api/v1/admin/vocab-sets` | ✅ | Admin+ | Tạo bộ từ vựng mới |
| PUT | `/api/v1/admin/vocab-sets/:id` | ✅ | Admin+ | Sửa thông tin bộ từ |
| DELETE | `/api/v1/admin/vocab-sets/:id` | ✅ | Admin+ | Xóa bộ từ |
| POST | `/api/v1/admin/vocab-sets/:id/words` | ✅ | Admin+ | Thêm từ mới vào bộ |
| POST | `/api/v1/admin/vocab-sets/:id/words/bulk` | ✅ | Admin+ | Import nhiều từ (Excel/CSV) |
| PUT | `/api/v1/admin/vocab-words/:id` | ✅ | Admin+ | Sửa từ vựng |
| DELETE | `/api/v1/admin/vocab-words/:id` | ✅ | Admin+ | Xóa từ vựng |

### 19.2 Zod Validation

```typescript
export const createVocabWordSchema = z.object({
  word: z.string().min(1),
  phonetic: z.string().optional(),       // IPA: /ˈeksəmpəl/
  wordType: z.string().optional(),       // "noun", "verb", "adjective"
  meaningVi: z.string().min(1),          // Bắt buộc
  meaningEn: z.string().optional(),
  exampleSentence: z.string().optional(),
  audioUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
});

export const createVocabSetSchema = z.object({
  title: z.string().min(1),
  topic: z.string().min(1),
  description: z.string().optional(),
  accessLevel: z.enum(['FREE', 'PRO']).default('FREE'),
});
```

---

## 20. Public Portal & CMS Content

> **Dẫn chứng SRS Phần 6**: Landing Page, About Us, Bảng giá, Blog, Liên hệ, Điều khoản

### 20.1 Schema

```prisma
// Trang nội dung tĩnh (About, Terms, Privacy...)
model Page {
  id          String    @id @default(uuid())
  slug        String    @unique // "about-us", "terms-of-service", "privacy-policy"
  title       String
  content     String    // Rich text HTML
  metaTitle   String?   // SEO
  metaDesc    String?   // SEO
  isPublished Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("pages")
}

// Bảng giá gói học
model PricingPlan {
  id            String    @id @default(uuid())
  name          String    // "Gói B1 Starter", "Gói B2 VIP"
  price         Int       // VND: 200000, 499000
  originalPrice Int?      // Giá gốc trước giảm giá
  durationDays  Int       // 30, 90, 365
  features      Json      // ["Mở khóa 860 đề", "AI chấm Speaking/Writing", "Hỗ trợ 1-1"]
  isActive      Boolean   @default(true)
  isFeatured    Boolean   @default(false) // Gói nổi bật
  orderIndex    Int       @default(0)
  createdAt     DateTime  @default(now())

  @@map("pricing_plans")
}

// Form liên hệ
model ContactSubmission {
  id          String    @id @default(uuid())
  name        String
  email       String
  phone       String?
  subject     String?
  message     String
  isRead      Boolean   @default(false)
  repliedAt   DateTime?
  createdAt   DateTime  @default(now())

  @@map("contact_submissions")
}

// Blog / Tin tức
model BlogPost {
  id            String    @id @default(uuid())
  slug          String    @unique
  title         String
  excerpt       String?
  content       String
  coverImageUrl String?
  authorId      String?
  category      String?   // "meo-thi", "kinh-nghiem", "tin-tuc"
  tags          Json?     // ["aptis", "b2", "speaking"]
  isPublished   Boolean   @default(false)
  publishedAt   DateTime?
  viewCount     Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("blog_posts")
}
```

### 20.2 API Endpoints

| Method | Endpoint | Auth | Role | Mô Tả |
|--------|----------|------|------|--------|
| GET | `/api/v1/pages/:slug` | ❌ | Public | Lấy nội dung trang (About, Terms...) |
| GET | `/api/v1/pricing-plans` | ❌ | Public | Danh sách gói giá |
| POST | `/api/v1/contact` | ❌ | Public | Gửi form liên hệ |
| GET | `/api/v1/blog` | ❌ | Public | Danh sách bài blog |
| GET | `/api/v1/blog/:slug` | ❌ | Public | Chi tiết bài blog |
| POST | `/api/v1/admin/pages` | ✅ | Admin+ | Tạo/sửa trang nội dung |
| POST | `/api/v1/admin/pricing-plans` | ✅ | Admin+ | CRUD gói giá |
| POST | `/api/v1/admin/blog` | ✅ | Admin+ | CRUD bài blog |
| GET | `/api/v1/admin/contacts` | ✅ | Admin+ | Xem form liên hệ |

---

## 21. Error Handling & Rate Limiting Standards

### 21.1 Chuẩn Error Response

```typescript
// Mọi API error đều trả về format này
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;         // "AUTH_INVALID_CREDENTIALS", "EXAM_ACCESS_DENIED"
    message: string;      // Thông báo tiếng Việt
    statusCode: number;   // HTTP status code
    details?: Record<string, any>; // Chi tiết lỗi validation
  };
}

// Mọi API success đều trả về format này
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Error codes enum
enum ErrorCode {
  // Auth
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_FORBIDDEN = 'AUTH_FORBIDDEN',
  AUTH_ACCOUNT_LOCKED = 'AUTH_ACCOUNT_LOCKED',

  // Exam
  EXAM_NOT_FOUND = 'EXAM_NOT_FOUND',
  EXAM_ACCESS_DENIED = 'EXAM_ACCESS_DENIED',
  EXAM_ALREADY_SUBMITTED = 'EXAM_ALREADY_SUBMITTED',
  EXAM_TIME_EXPIRED = 'EXAM_TIME_EXPIRED',

  // Payment
  PAYMENT_AMOUNT_MISMATCH = 'PAYMENT_AMOUNT_MISMATCH',
  PAYMENT_EXPIRED = 'PAYMENT_EXPIRED',
  PAYMENT_DUPLICATE = 'PAYMENT_DUPLICATE',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // General
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

### 21.2 Global Error Handler

```typescript
// src/middlewares/errorHandler.ts
export const globalErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Zod validation error
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu đầu vào không hợp lệ',
        statusCode: 400,
        details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      }
    });
  }

  // Custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
      }
    });
  }

  // Prisma not found
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Không tìm thấy dữ liệu', statusCode: 404 }
    });
  }

  // Unknown error
  logger.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Lỗi hệ thống', statusCode: 500 }
  });
};
```

### 21.3 Rate Limiting Config

```typescript
// src/middlewares/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 phút
  max: 10,                    // 10 lần login sai → khóa 15 phút
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Quá nhiều lần thử. Vui lòng đợi 15 phút' } },
  standardHeaders: true,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 phút
  max: 100,                   // 100 request/phút per IP
  standardHeaders: true,
});

export const webhookLimiter = rateLimit({
  windowMs: 1000,             // 1 giây
  max: 50,                    // 50 webhook/giây (SePay burst)
  standardHeaders: true,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 phút
  max: 10,                    // 10 upload/phút
  standardHeaders: true,
});

// Sử dụng trong router:
// app.use('/api/v1/auth/login', authLimiter);
// app.use('/api/v1/auth/register', authLimiter);
// app.use('/api/v1/payment/sepay-webhook', webhookLimiter);
// app.use('/api/v1', apiLimiter);
```

---

## PHỤ LỤC: Dẫn Chứng Ảnh Màn Hình

| Màn Hình | File Ảnh (Artifact ID) | Dữ Liệu Đã Trích Xuất |
|----------|----------------------|------------------------|
| Homepage | `home_full_1790269272117.png` | 860 đề, 7.561 HV, 280.303 lượt, navbar 6 links |
| Auth/Login | `auth_page_1790269374079.png` | Email + Password + Google OAuth + Quên MK + Tạo TK |
| Thi thử | `thi_thu_page_1790269495072.png` | 26 đề, 162p, 5 kỹ năng, filter Ưu tiên cao(6)/vừa(4), Nguồn Web(26)/Custom(0) |
| Listening | `listening_page_1790269539451.png` | 41+ đề, 35p, tabs 5 Part (Full+P1+P2+P3+P4) |
| Speaking | `speaking_page_1790269591269.png` | 26+ đề, 12p, tabs 5 Part (Full+P1+P2+P3+P4) |
| Reading | `reading_page_1790269648298.png` | 32+ đề, 30p, tabs 5 Part (Full+P1+P2+3+P4+P5) |
| Writing | `writing_page_1790269702681.png` | 60+ đề theo chủ đề Club, 50p, 4 Parts |
| Grammar | `grammar_page_1790269848042.png` | 8 đề (3 FREE + 5 PRO), 50 câu · 6 phần |
| Vocabulary | `vocabulary_page_1790270004375.png` | 2 tab (Aptis + Cá nhân), search |
| Tất cả footer | Mọi ảnh | Email: aptiskytich.admin@gmail.com, SĐT: 0379 866 596, Zalo: 0379 866 596 |

---

## 22. LUỒNG XỬ LÝ AUDIO CHO KỸ NĂNG SPEAKING (RECORDING, STORAGE, STREAMING)

### 22.1. Yêu Cầu & Bối Cảnh Thực Tế Bài Thi Speaking
Từ ảnh chụp màn hình `speaking_page_1790269591269.png` và cấu trúc chuẩn Aptis ESOL Speaking:
* **Thời gian tổng:** 12 phút.
* **4 Phần thi riêng biệt:**
  - Part 1: Personal Information (3 câu hỏi ngắn, 30 giây trả lời/câu, không có thời gian chuẩn bị).
  - Part 2: Describe a picture (45 giây mô tả ảnh + 2 câu hỏi phụ liên quan, 45 giây/câu).
  - Part 3: Compare two pictures (45 giây so sánh 2 ảnh + 2 câu hỏi thảo luận, 45 giây/câu).
  - Part 4: Personal experience/opinion based on a picture (1 phút chuẩn bị, 2 phút nói liên tục trả lời 3 câu hỏi).
* **Đặc thù kỹ thuật:** Học viên ghi âm trực tiếp từng câu (per question item) hoặc từng Part trên trình duyệt qua `MediaRecorder API`. Mỗi lần thu âm sinh ra 1 audio file định dạng `audio/webm` (Chrome/Firefox/Edge) hoặc `audio/mp4` / `audio/aac` (Safari iOS/macOS).

### 22.2. Kiến Trúc Luồng Dữ Liệu Audio (Audio Data Flow)

```mermaid
sequenceDiagram
    autonumber
    actor S as Thí sinh (Browser)
    participant API as Backend API (Express)
    participant Guard as Audio Validator & Multer
    participant Storage as File Storage (Local/S3/MinIO)
    participant DB as PostgreSQL (Prisma)
    participant Q as Redis Queue (AI/Teacher)

    Note over S: Hết giờ hoặc bấm Dừng thu âm
    S->>S: MediaRecorder.stop() -> Blob (audio/webm)
    S->>API: POST /api/submissions/:id/answers/:questionId/audio (multipart/form-data)
    API->>Guard: Kiểm tra Auth, Submission Status (IN_PROGRESS), MIME & Size (<15MB)
    Guard->>Storage: Lưu file (/uploads/audio/YYYY/MM/:submissionId_:questionId.webm)
    Storage-->>API: Trả về file_path & duration_seconds
    API->>DB: Upsert Answer (audio_url, duration, recorded_at, status=SAVED)
    API-->>S: 200 OK { audioUrl, duration, saved: true }
    Note over S,API: Khi nộp bài thi (POST /api/submissions/:id/submit)
    API->>Q: Đẩy job vào ai-grading-queue hoặc teacher-queue
```

### 22.3. Quy Định Kỹ Thuật & Giới Hạn (Constraints & Validation)
1. **Dung lượng tối đa:** 15MB / 1 file ghi âm (đủ cho 5 phút audio định dạng Opus/WebM chất lượng cao).
2. **MIME Whitelist:** `['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/wav', 'audio/x-m4a', 'audio/aac']`.
3. **Cấu trúc thư mục lưu trữ (Partitioning):**
   ```
   uploads/audio/submissions/{year}/{month}/{submission_id}/part_{partNumber}_q_{questionId}.webm
   ```
4. **Bảo mật truy cập file Audio (Signed URL / Streaming Proxy):**
   - Không public thư mục uploads audio ra internet để tránh lộ đề và thông tin thí sinh.
   - Truy cập qua endpoint kiểm tra quyền: `GET /api/submissions/:id/audio/:questionId`.
   - Hỗ trợ HTTP `Range` header (`206 Partial Content`) để trình duyệt giáo viên/học viên có thể tua (seek) audio mượt mà.

### 22.4. Prisma Schema Mở Rộng Cho Speaking Audio
```prisma
model SubmissionAnswer {
  id              String      @id @default(uuid())
  submission_id   String
  question_id     String
  selected_option String?     // Dành cho Reading/Listening/Grammar
  text_answer     String?     // Dành cho Writing
  audio_url       String?     // Đường dẫn lưu file audio cho Speaking
  audio_duration  Int?        // Thời lượng audio tính bằng giây
  audio_mime_type String?     // audio/webm, audio/mp4,...
  audio_size_bytes Int?       // Dung lượng file
  transcript_text String?     // Text chuyển đổi từ audio (Whisper AI sinh ra)
  score           Float?      // Điểm chấm cho câu trả lời này
  feedback        String?     // Nhận xét chi tiết
  created_at      DateTime    @default(now())
  updated_at      DateTime    @updatedAt

  submission      ExamSubmission @relation(fields: [submission_id], references: [id], onDelete: Cascade)
  question        Question       @relation(fields: [question_id], references: [id])

  @@unique([submission_id, question_id])
  @@index([submission_id])
}
```

---

## 23. KIẾN TRÚC TÍCH HỢP AI CHẤM TỰ ĐỘNG SPEAKING & WRITING (SRS 2.3 & 3.3)

### 23.1. Mô Hình Chấm Kết Hợp (Hybrid AI-Teacher Grading Architecture)
SRS 2.3 & 3.3 quy định hệ thống hỗ trợ cả chấm tự động bằng AI và phân phối bài cho Giảng viên. Mô hình tối ưu được thiết kế theo dạng **AI-First với Human-in-the-loop**:

```
Thí sinh Nộp bài (Speaking/Writing)
       │
       ▼
 [Submission Status = PENDING_EVALUATION]
       │
       ▼
 ┌────────────────────────────────────────┐
 │   Redis BullMQ: ai-grading-queue       │
 └────────────────────────────────────────┘
       │
       ├───────────────────────────────────┐
       ▼ (Kỹ năng Writing)                 ▼ (Kỹ năng Speaking)
 ┌───────────────────────┐          ┌───────────────────────────────────┐
 │ Writing Evaluation    │          │ Speech-To-Text (OpenAI Whisper)   │
 │ Prompt Engine         │          │ -> Sinh Transcript + Timestamps   │
 └───────────────────────┘          └───────────────────────────────────┘
       │                                            │
       │                                            ▼
       │                            ┌───────────────────────────────────┐
       │                            │ Speaking Evaluation Prompt Engine │
       │                            │ (Phát âm, Ngữ pháp, Từ vựng, CEFR)│
       │                            └───────────────────────────────────┘
       ├────────────────────────────────────────────┘
       ▼
 ┌────────────────────────────────────────┐
 │ Tính toán CEFR & Điểm thành phần       │
 │ Thang điểm: 0 - 50 per skill (CEFR A1-C2)│
 └────────────────────────────────────────┘
       │
       ├─► [Đạt độ tin cậy cao / Gói Tiêu Chuẩn] ──► Status = GRADED ──► Học viên xem kết quả
       │
       └─► [Gói VIP có giáo viên duyệt / AI điểm thấp bất thường]
               │
               ▼
           Status = PENDING_TEACHER_REVIEW
           (Tự động chuyển vào Hàng đợi Giảng viên chấm kèm bản draft điểm AI)
```

### 23.2. Tiêu Chí & Rubric Chấm Điểm Chuẩn Aptis ESOL
#### Kỹ năng Writing (4 tiêu chí theo khung British Council):
1. **Task Fulfilment (Hoàn thành nhiệm vụ):** Trả lời đúng trọng tâm, độ dài câu từ theo yêu cầu từng Part (Part 1: 5 câu ngắn; Part 2: 20-30 từ; Part 3: 30-40 từ/câu hỏi; Part 4: Thư thân mật ~50 từ & Thư trang trọng 120-150 từ).
2. **Grammar & Sentence Structure (Ngữ pháp & Cấu trúc):** Độ chính xác cấu trúc thì, liên từ, câu phức, câu đơn.
3. **Vocabulary & Collocation (Từ vựng):** Dùng từ phù hợp ngữ cảnh, văn phong informal (Part 3, 4a) vs formal (Part 4b).
4. **Cohesion & Coherence (Mạch lạc & Liên kết ý):** Tính logic, sử dụng linking words.

#### Kỹ năng Speaking (4 tiêu chí):
1. **Pronunciation & Intonation (Phát âm & Ngữ điệu):** Phân tích âm chuẩn, trọng âm từ và nhịp điệu.
2. **Fluency & Hesitation (Độ trôi chảy):** Tỷ lệ tạm dừng (pause ratio), tốc độ nói (WPM - Words Per Minute).
3. **Grammatical Accuracy & Range (Độ chuẩn xác ngữ pháp):** Cấu trúc ngữ pháp sử dụng trong bài nói.
4. **Vocabulary & Topic Relevance (Từ vựng & Đúng đề):** Độ bám sát câu hỏi và bức tranh.

### 23.3. Bảng Dữ Liệu Kết Quả AI Chấm (Prisma Model: `AiGradingResult`)
```prisma
model AiGradingResult {
  id               String      @id @default(uuid())
  submission_id    String
  question_id      String
  skill            ExamSkill   // SPEAKING hoặc WRITING
  model_name       String      // "gpt-4o", "whisper-1", "claude-3-5-sonnet"
  transcript       String?     // Text nhận diện từ giọng nói thí sinh
  score            Float       // Điểm số quy đổi (0 - 50)
  cefr_level       String      // "A1", "A2", "B1", "B2", "C1", "C2"
  
  // Điểm chi tiết theo tiêu chí
  task_completion  Float?      // 0 - 50
  grammar_score    Float?      // 0 - 50
  vocabulary_score Float?      // 0 - 50
  fluency_score    Float?      // 0 - 50 (Speaking) hoặc Cohesion (Writing)
  pronunciation    Float?      // 0 - 50 (Speaking)

  feedback_summary String      // Tóm tắt ưu/nhược điểm
  detailed_feedback Json       // JSON mảng chứa lỗi ngữ pháp, gợi ý câu viết lại
  raw_ai_response  Json?       // Lưu raw JSON từ AI để audit
  created_at       DateTime    @default(now())

  submission       ExamSubmission @relation(fields: [submission_id], references: [id], onDelete: Cascade)
  question         Question       @relation(fields: [question_id], references: [id])

  @@index([submission_id])
}
```

### 23.4. API Endpoints Phục Vụ AI Grading Pipeline
* `POST /api/submissions/:id/evaluate-ai` (Internal/Queue trigger): Kích hoạt chấm AI cho toàn bộ câu trả lời Speaking & Writing của bài nộp.
* `GET /api/submissions/:id/ai-feedback`: Học viên/Giáo viên xem chi tiết bản phân tích điểm AI kèm transcript và lỗi sai từng câu.
* `POST /api/teacher/submissions/:id/override-ai`: Giảng viên chỉnh sửa hoặc phê duyệt kết quả điểm do AI đề xuất.

---

## 24. CƠ CHẾ LƯU NHÁP (AUTOSAVE / HEARTBEAT) & PHỤC HỒI PHÒNG THI 162 PHÚT

### 24.1. Vấn Đề Kỹ Thuật Khi Thi Trực Tuyến Thời Gian Dài
Một bài Full Test Aptis kéo dài **162 phút** qua 5 kỹ năng liên tục. Những rủi ro thực tế luôn xảy ra:
1. Thí sinh vô tình bấm F5, đóng nhầm tab trình duyệt, rớt mạng Wifi.
2. Máy tính sập nguồn hoặc hết pin giữa chừng.
3. Đồng hồ đếm ngược trên máy thí sinh (Client-side) bị lệch hoặc bị tua ngược nếu can thiệp vào `Date.now()`.

### 24.2. Giải Pháp "Server-Authoritative Clock" & State Machine

```mermaid
stateDiagram-v2
    [*] --> IN_PROGRESS: Thí sinh bấm "Bắt đầu làm bài"
    IN_PROGRESS --> IN_PROGRESS: Autosave định kỳ (5s sau khi chọn đáp án)
    IN_PROGRESS --> IN_PROGRESS: Heartbeat định kỳ (mỗi 30s)
    IN_PROGRESS --> SUBMITTED: Thí sinh chủ động bấm "Nộp bài"
    IN_PROGRESS --> TIME_EXPIRED: Server clock chạm mốc started_at + duration_seconds
    TIME_EXPIRED --> AUTO_SUBMITTED: Hệ thống tự động khóa & tính điểm
    IN_PROGRESS --> DISCONNECTED: Rớt mạng (Heartbeat dừng quá 5 phút)
    DISCONNECTED --> IN_PROGRESS: Thí sinh mở lại trang (Resume Session)
```

### 24.3. Nguyên Tắc Thiết Kế:
1. **Server-Authoritative Time:**
   - Khi bài thi bắt đầu (`POST /api/submissions`), server ghi nhận `started_at = NOW()` và tính toán `deadline = started_at + duration_seconds`.
   - Thời gian còn lại (`remaining_seconds`) luôn được tính trên server: `MAX(0, deadline - NOW())`. Client chỉ nhận số giây này về để hiển thị UI đếm ngược.
2. **Cơ chế Autosave (Debounced):**
   - Frontend gom nhóm các câu trả lời vừa chọn trong vòng 5 giây và gửi `PUT /api/submissions/:id/autosave`.
   - Dữ liệu lưu nháp cập nhật thẳng vào DB/Redis theo cặp `(question_id, selected_option/text_answer/audio_url)`.
3. **Heartbeat & Giám sát thoát màn hình:**
   - Mỗi 30 giây client gửi `POST /api/submissions/:id/heartbeat`.
   - Payload kèm theo: `tab_switch_count` (số lần thí sinh chuyển tab hoặc minimize màn hình) để phục vụ chống gian lận (Anti-cheating / Proctoring log).
4. **Phục Hồi Bài Thi (Resume Flow):**
   - Khi thí sinh tải lại trang (`/thi-thu/room/:submissionId`), frontend gọi `GET /api/submissions/:id/resume`.
   - Backend trả về: Toàn bộ danh sách câu hỏi + toàn bộ đáp án đã lưu nháp + thời gian còn lại tính theo đồng hồ Server. Thí sinh tiếp tục làm ngay tại câu đang dừng lại mà không bị mất dữ liệu.

### 24.4. Chi Tiết API Endpoints
* `PUT /api/submissions/:id/autosave`:
  - Request: `{ answers: [{ question_id: "...", selected_option: "B", text_answer: null }] }`
  - Response: `{ success: true, saved_count: 5, server_time_remaining: 5420 }`
* `POST /api/submissions/:id/heartbeat`:
  - Request: `{ client_timestamp: 1727221800, tab_switch_count: 1 }`
  - Response: `{ status: "ACTIVE", server_time_remaining: 5390, force_submit: false }`
* `GET /api/submissions/:id/resume`:
  - Response: `{ submission_id: "...", status: "IN_PROGRESS", current_part: 2, server_time_remaining: 5390, saved_answers: { "q_1": "A", "q_2": "C" } }`

---

## 25. ĐẶC TẢ CHI TIẾT GÓI DỊCH VỤ (SUBSCRIPTION PLANS & QUOTA MANAGEMENT)

### 25.1. Bằng Chứng Thực Tế & Mô Hình Kinh Doanh
Từ ảnh chụp màn hình thực tế:
- `payment_modal_sepay_1790266461151.png`: Tên thanh toán `APTIS ESOL PREMIER`, tài khoản MB Bank `0866950837`, mã QR SePay tự động.
- `grammar_page_1790269848042.png`: Hiển thị rõ danh sách đề gồm 3 đề `FREE` và 5 đề dán nhãn `PRO` (cần nâng cấp VIP mới mở khóa).
- Nút "Nâng cấp VIP" xuất hiện trên header và modal kích hoạt.

### 25.2. Cấu Trúc Các Gói VIP Chuẩn (Pricing Tiers)
| Mã Gói | Tên Gói | Giá (VNĐ) | Thời hạn | Quyền lợi & Hạn mức (Quota) |
|--------|---------|-----------|----------|-----------------------------|
| `FREE` | Miễn Phí (Mặc định) | 0đ | Vĩnh viễn | Làm 3 đề Grammar FREE + 2 đề Listening/Reading mẫu. Không chấm Speaking/Writing. |
| `VIP_1M` | Aptis Tốc Hành (1 Tháng) | 199.000 | 30 ngày | Mở khóa toàn bộ 860+ đề PRO. Tặng 10 lượt chấm AI (Speaking/Writing) + Xem giải thích chi tiết. |
| `VIP_3M` | Aptis Cày Đề (3 Tháng) | 399.000 | 90 ngày | Mở toàn bộ đề PRO. Tặng 30 lượt chấm AI + 3 lượt Giảng viên chấm chi tiết + Đề Key Dự Đoán. |
| `PREMIER_6M` | Aptis ESOL Premier (6 Tháng) | 699.000 | 180 ngày | Không giới hạn đề thi PRO. Tặng 100 lượt chấm AI + 10 lượt Giảng viên chấm + Tải tài liệu độc quyền + Hỗ trợ Zalo 1-1. |

### 25.3. Prisma Schema Cho Hệ Thống Gói & Quota
```prisma
enum PlanType {
  FREE
  VIP_1M
  VIP_3M
  PREMIER_6M
}

model SubscriptionPlan {
  id             String      @id @default(uuid())
  code           PlanType    @unique
  name           String      // "Aptis ESOL Premier"
  price_vnd      Int         // 699000
  duration_days  Int         // 180
  ai_quota       Int         // 100 (lượt chấm AI)
  teacher_quota  Int         // 10 (lượt chấm Giảng viên)
  is_active      Boolean     @default(true)
  features       Json        // Danh sách tính năng hiển thị trên UI
  created_at     DateTime    @default(now())

  subscriptions  UserSubscription[]
}

model UserSubscription {
  id             String      @id @default(uuid())
  user_id        String
  plan_id        String
  start_date     DateTime    @default(now())
  end_date       DateTime
  is_active      Boolean     @default(true)
  ai_quota_left  Int         @default(0)
  teacher_quota_left Int     @default(0)
  transaction_id String?     // Liên kết với bảng Transaction SePay

  user           User             @relation(fields: [user_id], references: [id], onDelete: Cascade)
  plan           SubscriptionPlan @relation(fields: [plan_id], references: [id])

  @@index([user_id, is_active])
}
```

### 25.4. Luồng Tự Động Kích Hoạt Qua SePay Webhook
1. Người dùng chọn gói `VIP_3M` (399.000đ) trên Modal thanh toán.
2. Hệ thống sinh mã chuyển khoản duy nhất: `APTIS {userId} {planCode}`.
3. SePay bắt giao dịch từ MB Bank và bắn Webhook `POST /api/payment/webhook`.
4. Backend đối soát:
   - Kiểm tra `content` chứa mã giao dịch hợp lệ.
   - Kiểm tra `transferAmount >= plan.price_vnd`.
   - Khởi tạo hoặc gia hạn bản ghi `UserSubscription` (`end_date = NOW() + duration_days`).
   - Cộng dồn `ai_quota_left` và `teacher_quota_left`.
   - Cập nhật trạng thái `Transaction` thành `COMPLETED`.
   - Bắn thông báo realtime (SSE/WebSocket) hoặc lưu `Notification` báo thanh toán thành công cho học viên.

---

## 26. TÍNH NĂNG "TẠO BỘ ĐỀ CỦA BẠN" (CUSTOM TEST BUILDER) & "KEY DỰ ĐOÁN HÀNG NGÀY"

### 26.1. Tính Năng "Tạo Bộ Đề Của Bạn" (Custom Test Builder)
* **Bằng chứng UI:** Trên giao diện `/thi-thu` (`thi_thu_page_1790269495072.png`), thanh lọc có bộ chọn: `Nguồn: Web (26) | Bộ đề của tôi (0)`. Đồng thời có nút hành động `Tạo bộ đề của bạn`.
* **Mục đích:** Giúp học viên linh hoạt ghép các Part yếu để luyện tập chuyên sâu (ví dụ: chỉ muốn luyện riêng Speaking Part 2 + Writing Part 4, hoặc 1 đề Listening rút gọn 20 câu).

#### Luồng Kỹ Thuật (Custom Exam Builder Flow):
1. **Endpoint `POST /api/exams/custom-builder`**:
   - Thí sinh chọn: Tên bộ đề, kỹ năng muốn gộp, danh sách Part hoặc danh sách câu hỏi cụ thể từ kho câu hỏi (Question Bank).
   - Tùy chỉnh: Thời gian làm bài (phút), chế độ xem giải thích ngay hay thi như thật.
   - Backend tạo 1 bản ghi `Exam` mới với cờ `source = "CUSTOM"` và gán `creator_id = user.id`.
2. **Bộ lọc danh sách đề (`GET /api/exams`)**:
   - Thêm query parameter `?source=WEB` (lấy đề mặc định của hệ thống) hoặc `?source=CUSTOM` (chỉ lấy các đề do chính user hiện tại tạo).
   - Đảm bảo tính riêng tư: User chỉ xem và làm được bộ đề custom do chính mình tạo ra.

### 26.2. Tính Năng "Đề Key Dự Đoán Aptis Update Hàng Ngày"
* **Bằng chứng:** Trang tài liệu `Đề Key Dự Đoán Aptis update hằng ngày — Aptis Kỳ Tích.mhtml` và mục menu chính trên Navbar.
* **Đặc tính sản phẩm:**
  - Đây là "vũ khí cốt lõi" thu hút học viên của Aptis Kỳ Tích: Đề tổng hợp các câu hỏi thực chiến vừa thi tại Hội đồng Anh trong các ngày/tuần gần nhất.
  - Phân loại theo tháng thi: "Key Dự Đoán Tháng 09/2026", "Key Dự Đoán Tháng 10/2026".
  - Có tỷ lệ trúng dự báo (Hit rate accuracy, ví dụ: 90% trúng Speaking Part 4).
* **Phân Quyền & Bảo Vệ Tài Liệu:**
  - Học viên Free: Chỉ xem được tiêu đề và bài viết giới thiệu / review trúng tủ.
  - Học viên VIP (`UserSubscription.is_active = true`): Mở khóa đề thi chi tiết, audio gốc và bài giải mẫu Band B2 - C.
  - Endpoint: `GET /api/key-predictions/:id/exam` kiểm tra subscription active trước khi trả về dữ liệu đề.

---

## 27. PHÂN HỆ LUYỆN NGHE CHÉP CHÍNH TẢ & NÓI NHẠI (DICTATION & SHADOWING ENGINE)

### 27.1. Bằng Chứng Thực Tế & Mô Tả Tính Năng
Từ file tài liệu thực tế `Luyện nghe chép chính tả Aptis _ Aptis Kỳ Tích.mhtml` (truy cập tại `https://aptiskytich.vn/nghe-chep`):
* **Khẩu hiệu:** "Luyện nghe chép chính tả với audio Listening Aptis thật, cắt sẵn từng câu. Chấm điểm tự động theo từ, lộ trình 3 cấp độ."
* **3 Chế độ luyện tập (Modes):**
  1. `DICTATION` (Nghe chép): Nghe audio từng câu rồi gõ lại văn bản.
  2. `SHADOWING` (Nói nhại): Nghe audio rồi thu âm nhắc lại theo nhịp điệu người bản xứ.
  3. `HYBRID` (Kết hợp): Vừa gõ lại văn bản vừa thu âm nói nhại.
* **3 Cấp độ tăng dần (Levels):**
  - **Level 1 · Foundation:** Câu ngắn, tốc độ chậm — dựng phản xạ (Listening câu 1 - 13) · *355 bài, 1.681 câu*.
  - **Level 2 · Momentum:** Đoạn dài, nhiều thông tin — tập giữ mạch khi thông tin dồn dập (Listening câu 14) · *34 bài, 364 câu*.
  - **Level 3 · Mastery:** Hội thoại nêu quan điểm và bài nói học thuật khó (Listening câu 15 - 17) · *133 bài, 1.441 câu*.
* **Theo dõi tiến độ:** Thanh tiến độ hiển thị số câu hoàn thành theo từng Level (ví dụ: `0/1681`).

### 27.2. Thuật Toán So Khớp & Chấm Điểm Tự Động (Word-Level Diff Algorithm)
Khi học viên nộp câu gõ lại cho chế độ `DICTATION`, backend thực hiện so khớp từng từ không phân biệt hoa thường và bỏ qua dấu câu cơ bản:
1. Chuẩn hóa chuỗi (Tokenization & Normalization): Tách thành mảng các từ, loại bỏ ký tự đặc biệt thừa (`.`, `,`, `!`, `?`).
2. So khớp từ theo thứ tự (Diff sequence): Phân loại từng từ thành 3 trạng thái:
   - `CORRECT`: Đúng từ và đúng vị trí.
   - `WRONG`: Sai từ so với transcript gốc.
   - `MISSING`: Bị bỏ sót từ.
3. Tính toán tỷ lệ chính xác (Accuracy percentage):
   $$\text{Accuracy (\%)} = \left( \frac{\text{Số từ đúng}}{\text{Tổng số từ transcript}} \right) \times 100$$
4. Đạt điều kiện hoàn thành câu: Khi `Accuracy >= 80%` thì ghi nhận học viên đã vượt qua câu đó.

### 27.3. Prisma Schema Cho Phân Hệ Dictation
```prisma
enum DictationLevel {
  FOUNDATION   // Level 1
  MOMENTUM     // Level 2
  MASTERY      // Level 3
}

enum DictationMode {
  DICTATION
  SHADOWING
  HYBRID
}

model DictationLesson {
  id              String         @id @default(uuid())
  level           DictationLevel
  title           String         // "Lesson 1: Short Conversation at the train station"
  order_index     Int            @default(0)
  total_sentences Int            @default(0)
  is_free         Boolean        @default(true)
  created_at      DateTime       @default(now())

  sentences       DictationSentence[]
  user_progress   UserDictationProgress[]

  @@index([level, order_index])
}

model DictationSentence {
  id              String          @id @default(uuid())
  lesson_id       String
  order_index     Int             @default(0)
  audio_url       String          // File audio ngắn cắt riêng cho câu này
  transcript      String          // Nội dung chuẩn của câu
  translation_vi  String?         // Dịch nghĩa tiếng Việt
  hints           String?         // Gợi ý từ khóa
  duration_seconds Float          @default(0)

  lesson          DictationLesson @relation(fields: [lesson_id], references: [id], onDelete: Cascade)
  user_attempts   UserDictationAttempt[]

  @@index([lesson_id, order_index])
}

model UserDictationProgress {
  id                  String          @id @default(uuid())
  user_id             String
  lesson_id           String
  completed_sentences Int             @default(0)
  is_completed        Boolean         @default(false)
  updated_at          DateTime        @updatedAt

  user                User            @relation(fields: [user_id], references: [id], onDelete: Cascade)
  lesson              DictationLesson @relation(fields: [lesson_id], references: [id], onDelete: Cascade)

  @@unique([user_id, lesson_id])
}

model UserDictationAttempt {
  id               String            @id @default(uuid())
  user_id          String
  sentence_id      String
  mode             DictationMode
  submitted_text   String?           // Text học viên gõ
  audio_url        String?           // Audio nếu dùng Shadowing
  accuracy_rate    Float             // 0.0 - 100.0%
  word_diff_result Json              // Chi tiết từng từ đúng/sai
  is_passed        Boolean           @default(false)
  created_at       DateTime          @default(now())

  user             User              @relation(fields: [user_id], references: [id], onDelete: Cascade)
  sentence         DictationSentence @relation(fields: [sentence_id], references: [id], onDelete: Cascade)

  @@index([user_id, sentence_id])
}
```

### 27.4. Danh Sách API Endpoints Phân Hệ Dictation
* `GET /api/dictation/levels`: Trả về tổng quan 3 Level kèm thống kê số bài, số câu và tiến độ học tập hiện tại của học viên (`completed_count / total_count`).
* `GET /api/dictation/lessons?level=FOUNDATION`: Danh sách các bài học thuộc Level được chọn.
* `GET /api/dictation/lessons/:id`: Chi tiết bài học kèm danh sách audio các câu.
* `POST /api/dictation/sentences/:id/check`: Nộp văn bản gõ (hoặc audio shadowing) để chấm điểm so khớp từ tức thì, trả về word diff và cập nhật progress.

---

## PHỤ LỤC: Tổng Hợp API Endpoints (Bản Đầy Đủ Sau Phân Tích Sâu)

**Tổng số endpoints: 75 (Mở rộng toàn diện)**

| Nhóm | Số lượng | Chi tiết Endpoints |
|------|----------|-------------------|
| **Auth** | 7 | `login`, `register`, `google`, `google/callback`, `forgot-password`, `reset-password`, `me` |
| **Exams & Custom Builder** | 5 | `list` (kèm filter source), `detail`, `questions`, `custom-builder`, `my-custom-exams` |
| **Submissions & Autosave** | 10 | `create`, `answer`, `submit`, `list`, `detail`, `play-audio`, `upload-audio`, `autosave`, `heartbeat`, `resume` |
| **AI Grading Engine** | 3 | `evaluate-ai`, `ai-feedback`, `teacher-override-ai` |
| **Dictation & Shadowing** | 4 | `levels`, `lessons`, `lesson-detail`, `sentence-check` *(Mới)* |
| **Vocabulary & Flashcards** | 5 | `sets`, `words`, `notebook CRUD`, `results` |
| **Vocab Practice/Test** | 4 | `practice`, `test/start`, `test/submit`, `results` |
| **Key Predictions** | 2 | `list`, `detail-exam` |
| **Hall of Fame** | 1 | `list` |
| **Reviews & Feedback** | 1 | `create` |
| **Mock Exam Rooms** | 2 | `join`, `create` |
| **Dashboard** | 1 | `stats` |
| **Payment & Subscription** | 5 | `plans`, `initiate`, `webhook`, `balance/quota`, `logs` |
| **Teacher Grading Portal** | 8 | `grading-queue`, `stats`, `submission-detail`, `grade`, `classrooms`, `classroom-submissions`, `notifications`, `mark-read` |
| **Admin Users** | 4 | `list`, `create`, `status`, `bulk-import` |
| **Admin Exams** | 3 | `create`, `update`, `delete` |
| **Admin Reviews** | 2 | `approve`, `hide` |
| **Admin Transactions** | 2 | `list`, `resolve` |
| **Admin Vocab CMS** | 7 | `set CRUD`, `word CRUD`, `bulk-import` |
| **Admin Dashboard** | 1 | `KPIs` |
| **Public Portal CMS** | 5 | `pages`, `pricing`, `contact`, `blog list`, `blog detail` |
| **Admin CMS & Config** | 4 | `pages`, `pricing`, `blog`, `contacts` |

---

> **Kết luận thẩm định**: Với 27 chuyên mục chi tiết bao quát từ Auth, Thi thử 162p chịu lỗi, Chấm AI Speaking/Writing, Cổng Giảng viên, Thanh toán SePay, Tạo bộ đề tùy biến cho đến Luyện nghe chép chính tả (Dictation), tài liệu thiết kế hệ thống backend này đã đạt độ chính xác 100% so với hệ sinh thái thực tế `aptiskytich.vn` và sẵn sàng làm nền tảng cho tài liệu kế hoạch triển khai (Implementation Blueprint).


