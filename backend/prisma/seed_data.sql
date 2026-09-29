-- ========================================================
-- APTIS KỲ TÍCH - MASTER DATABASE SEED DATA (RAW SQL)
-- Can be executed via psql, pgAdmin, DBeaver, or Prisma
-- ========================================================

-- 1. SUBSCRIPTION PLANS
INSERT INTO "SubscriptionPlan" ("id", "code", "name", "price_vnd", "duration_days", "ai_quota", "teacher_quota", "features", "is_active", "created_at", "updated_at")
VALUES
  ('plan-free', 'FREE', 'Gói Dùng Thử (Miễn Phí)', 0, 9999, 3, 0, ARRAY['Làm các đề thi thử miễn phí cơ bản', 'Xem mẹo làm bài chuẩn British Council', 'Luyện từ vựng cơ bản', '3 lượt chấm AI dùng thử'], true, NOW(), NOW()),
  ('plan-vip-1m', 'VIP_1M', 'Aptis Tốc Hành (1 Tháng)', 199000, 30, 10, 0, ARRAY['Mở khóa toàn bộ 860+ bộ đề thi PRO', '10 lượt chấm AI chuyên sâu', 'Xem đáp án và giải thích chi tiết'], true, NOW(), NOW()),
  ('plan-vip-3m', 'VIP_3M', 'Aptis Cày Đề (3 Tháng)', 399000, 90, 30, 3, ARRAY['Mở khóa TOÀN BỘ Kho Đề Key Dự Đoán trúng tủ 85%', '30 lượt chấm AI', '3 lượt Giảng viên chấm kèm bài sửa chi tiết'], true, NOW(), NOW()),
  ('plan-premier-6m', 'PREMIER_6M', 'Aptis ESOL Premier (6 Tháng)', 699000, 180, 100, 10, ARRAY['Toàn quyền truy cập mọi tính năng VIP', '100 lượt chấm AI', '10 lượt Giảng viên chấm', 'Hỗ trợ 1-1'], true, NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- 2. CORE USERS (Password: Student123!@# / Admin123!@#)
INSERT INTO "User" ("id", "email", "password_hash", "full_name", "role", "is_active", "created_at", "updated_at")
VALUES
  ('user-admin-01', 'admin@aptiskytich.vn', '$2a$12$R.Ohy8lE4XhN68J4x66PgeBwzH4YFp5vH3UeZvZKxUe5cQ.2p7f9K', 'Quản Trị Viên Aptis', 'ADMIN', true, NOW(), NOW()),
  ('user-teacher-01', 'teacher@aptiskytich.vn', '$2a$12$R.Ohy8lE4XhN68J4x66PgeBwzH4YFp5vH3UeZvZKxUe5cQ.2p7f9K', 'Thầy Hưng Aptis Master', 'TEACHER', true, NOW(), NOW()),
  ('user-student-01', 'hoanghiep310102@gmail.com', '$2a$12$P1qJ4BqP9QxOqZ0pI2E7w.3p9F.7x5kU7uE4aQ.2p7f9K', 'Hoàng Hiệp', 'STUDENT', true, NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;

-- 3. EXAMS: GRAMMAR & VOCABULARY
INSERT INTO "Exam" ("id", "title", "description", "skill", "duration_minutes", "is_pro", "is_published", "source", "created_at", "updated_at")
VALUES
  ('exam-gv-01', 'Đề thi Grammar & Vocabulary 01 — Format Chuẩn British Council', '50 câu hỏi trắc nghiệm gồm 25 câu ngữ pháp và 25 câu từ vựng collocation.', 'GRAMMAR_VOCABULARY', 25, false, true, 'WEB', NOW(), NOW()),
  ('exam-gv-02', 'Đề thi Grammar & Vocabulary 02 — Luyện tập nâng cao Band B2 - C', 'Bộ 50 câu ngữ pháp và từ vựng phân loại cao cấp giúp bứt phá điểm số tối đa 50/50.', 'GRAMMAR_VOCABULARY', 25, true, true, 'WEB', NOW(), NOW()),
  ('exam-gv-03', 'Đề thi Grammar & Vocabulary 03 — Cấp tốc bứt phá điểm số', 'Tổng hợp các dạng bẫy ngữ pháp thường gặp nhất trong các kỳ thi Aptis gần đây.', 'GRAMMAR_VOCABULARY', 25, false, true, 'WEB', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 4. EXAMS: LISTENING
INSERT INTO "Exam" ("id", "title", "description", "skill", "duration_minutes", "is_pro", "is_published", "source", "created_at", "updated_at")
VALUES
  ('exam-lis-01', 'Đề thi Listening 01 — Nhận diện thông tin hội thoại thực tế', 'Mô phỏng chính xác phòng thi nghe Aptis với file audio, giới hạn 2 lần nghe mỗi câu.', 'LISTENING', 35, false, true, 'WEB', NOW(), NOW()),
  ('exam-lis-02', 'Đề thi Listening 02 — Thảo luận & Quan điểm nâng cao', 'Tập trung vào Part 3 & Part 4: Phân biệt quan điểm của 2 người nói và độc thoại học thuật.', 'LISTENING', 35, true, true, 'WEB', NOW(), NOW()),
  ('exam-lis-03', 'Đề thi Listening 03 — Tổng hợp đề thi thật Aptis ESOL', 'Bộ đề thi tổng hợp với các dạng giọng British, American và Australian đa dạng.', 'LISTENING', 35, false, true, 'WEB', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 5. EXAMS: READING
INSERT INTO "Exam" ("id", "title", "description", "skill", "duration_minutes", "is_pro", "is_published", "source", "created_at", "updated_at")
VALUES
  ('exam-read-01', 'Đề thi Reading 01 — Hoàn thành câu & Đoạn văn ngắn', 'Luyện tập giao diện 2 cột chuẩn phòng thi British Council: văn bản bên trái, câu hỏi bên phải.', 'READING', 35, false, true, 'WEB', NOW(), NOW()),
  ('exam-read-02', 'Đề thi Reading 02 — Đọc hiểu học thuật Band B2 - C', 'Luyện tập các bài đọc dài với chủ đề Trí tuệ nhân tạo, Biến đổi khí hậu và Toàn cầu hóa.', 'READING', 35, true, true, 'WEB', NOW(), NOW()),
  ('exam-read-03', 'Đề thi Reading 03 — Kỹ năng Skimming & Scanning chuyên sâu', 'Phương pháp định vị từ khóa nhanh để tìm thông tin chính xác trong thời gian ngắn.', 'READING', 35, false, true, 'WEB', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 6. EXAMS: SPEAKING
INSERT INTO "Exam" ("id", "title", "description", "skill", "duration_minutes", "is_pro", "is_published", "source", "created_at", "updated_at")
VALUES
  ('exam-spk-01', 'Đề thi Speaking 01 — Khảo sát phản xạ nói 4 phần Aptis', 'Luyện tập ghi âm mic trực tiếp, đếm ngược thời gian chuẩn phòng thi, nhận kết quả chấm điểm AI.', 'SPEAKING', 12, false, true, 'WEB', NOW(), NOW()),
  ('exam-spk-02', 'Đề thi Speaking 02 — Đề thi phòng thi thực tế 2026', 'Bộ đề thi dự đoán với các chủ đề công nghệ số và thói quen sinh hoạt hiện đại.', 'SPEAKING', 12, true, true, 'WEB', NOW(), NOW()),
  ('exam-spk-03', 'Đề thi Speaking 03 — Chiến thuật đạt Band C Speaking', 'Nâng cao vốn từ vựng ngữ âm, ngữ điệu RP và phản xạ tự nhiên.', 'SPEAKING', 12, false, true, 'WEB', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 7. EXAMS: WRITING
INSERT INTO "Exam" ("id", "title", "description", "skill", "duration_minutes", "is_pro", "is_published", "source", "created_at", "updated_at")
VALUES
  ('exam-wri-01', 'Đề thi Writing 01 — Viết tương tác & Thư trang trọng', 'Luyện tập đủ 4 phần chuẩn: Trả lời ngắn, Điền biểu mẫu, Tin nhắn mạng xã hội và Thư kiến nghị trang trọng.', 'WRITING', 50, false, true, 'WEB', NOW(), NOW()),
  ('exam-wri-02', 'Đề thi Writing 02 — Đề thi chuẩn British Council 2026', 'Chủ đề Câu lạc bộ Sách và Văn hóa đọc trong kỷ nguyên số.', 'WRITING', 50, true, true, 'WEB', NOW(), NOW()),
  ('exam-wri-03', 'Đề thi Writing 03 — Luyện viết luận nâng cao', 'Rèn luyện kỹ năng kết nối ý tưởng, sử dụng từ nối học thuật và cấu trúc câu phức ghép.', 'WRITING', 50, false, true, 'WEB', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 8. EXAMS: KEY DỰ ĐOÁN (source: KEY)
INSERT INTO "Exam" ("id", "title", "description", "skill", "duration_minutes", "is_pro", "is_published", "source", "created_at", "updated_at")
VALUES
  ('exam-key-01', 'Bộ đề Key Dự Đoán Trúng Tủ Quý 1/2026 — Trọng tâm Speaking & Writing', 'Tổng hợp các chủ đề Speaking Part 2-3-4 và Writing Part 4 xuất hiện liên tục trong các kỳ thi gần nhất với tỷ lệ trúng 85%.', 'FULL_TEST', 60, true, true, 'KEY', NOW(), NOW()),
  ('exam-key-02', 'Bộ đề Key Dự Đoán Trúng Tủ Quý 2/2026 — Full 5 Kỹ Năng Đột Phá B2-C', 'Toàn bộ câu hỏi trắc nghiệm ngữ pháp hiếm gặp và audio nghe chép chính tả trọng tâm.', 'FULL_TEST', 90, true, true, 'KEY', NOW(), NOW()),
  ('exam-key-03', 'Bộ đề Key Dự Đoán Cấp Tốc 7 Ngày — Ôn Thi Trúng Tủ', 'Dành riêng cho học viên cần thi gấp trong vòng 1-2 tuần tới.', 'FULL_TEST', 45, true, true, 'KEY', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 9. EXAMS: THI THỬ FULL TEST
INSERT INTO "Exam" ("id", "title", "description", "skill", "duration_minutes", "is_pro", "is_published", "source", "created_at", "updated_at")
VALUES
  ('exam-full-01', 'Đề thi thử 01 — Aptis ESOL Full Test 2026', 'Mô phỏng chuẩn format máy tính British Council 5 kỹ năng', 'FULL_TEST', 162, false, true, 'WEB', NOW(), NOW()),
  ('exam-full-02', 'Đề thi thử 02 — Aptis ESOL Full Test Bứt Phá Điểm C', 'Độ khó nâng cao dành cho học viên mục tiêu B2 vững vàng hoặc chứng chỉ C.', 'FULL_TEST', 162, true, true, 'WEB', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 10. VOCABULARY SETS
INSERT INTO "VocabSet" ("id", "title", "category", "total_words", "created_at", "updated_at")
VALUES
  ('vocab-set-01', '500 Từ Vựng Aptis B1 - B2 Cốt Lõi', 'B1-B2', 4, NOW(), NOW()),
  ('vocab-set-02', '300 Từ Vựng Học Thuật Academic Aptis Band C', 'C1-C2', 4, NOW(), NOW()),
  ('vocab-set-03', 'Từ Vựng Collocations Đề Thi Thật Hay Gặp Nhất', 'B2-Collocation', 3, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;
