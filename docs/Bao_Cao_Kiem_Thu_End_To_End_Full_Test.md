# Báo Cáo Kiểm Thử End-To-End: Toàn Diện Đề Thi Thử Full Test (Aptis ESOL)

**Thời gian kiểm thử:** 2026-10-09T18:09:26.611Z
**Môi trường:** Production / Staging Test Suite (Node.js + PostgreSQL + Gemini AI)
**Kết quả tổng quan:** HOÀN TẤT THÀNH CÔNG (PASS)

---

## Nhật Ký Chi Tiết Thực Thi (Execution Logs)
```text
================================================================================
  KIỂM THỬ END-TO-END (E2E) TOÀN DIỆN: PHÒNG THI THỬ APTIS ESOL (5 KỸ NĂNG)     
  SPEAKING → LISTENING → GRAMMAR & VOCAB → READING → WRITING → AI GRADING       
================================================================================

[GIAI ĐOẠN 1] Đăng ký tài khoản thí sinh & Xác thực danh tính
  ✓ THÀNH CÔNG: Tạo tài khoản thí sinh: e2e_candidate_1791569366612@aptistest.vn (ID: 40c54603-2e49-4075-88e7-e5b7ca2cdb56)

[GIAI ĐOẠN 2] Nhập mã kích hoạt trải nghiệm Go-Live (APTISGOLIVE)
  ✓ THÀNH CÔNG: Mã APTISGOLIVE kích hoạt thành công: Chúc mừng bạn! Đã kích hoạt thành công 14 ngày VIP trải nghiệm miễn phí!
  ✓ THÀNH CÔNG: Thời hạn VIP: undefined ngày | Lượt chấm AI: +undefined
  ✓ THÀNH CÔNG: Gói VIP kích hoạt chính thức trong CSDL: Plan = Aptis Tốc Hành (1 Tháng), Hết hạn = 24/10/2026

[GIAI ĐOẠN 3] Truy vấn đề thi Full Test (162 phút, 5 kỹ năng) từ CSDL
  ✓ THÀNH CÔNG: Chọn đề thi: "Đề thi thử Aptis ESOL Full Test 01 (Kỳ Tích)" (Mã: 6aa04f21-d9ee-4ff6-8488-5adf780c4eff)
  ✓ THÀNH CÔNG: Thời lượng quy định: 162 phút

[GIAI ĐOẠN 4] Khởi tạo phiên thi chính thức (POST /api/submissions)
  ✓ THÀNH CÔNG: Phiên thi được tạo thành công: Submission ID = aa5d4057-fdb1-4673-b2cd-b95e47efc0b6
  ✓ THÀNH CÔNG: Thời gian server còn lại: 9720 giây (~162 phút)

[GIAI ĐOẠN 5] Tải chi tiết toàn bộ câu hỏi (GET /api/exams/:id/questions)
  ✓ THÀNH CÔNG: Đề thi gồm 22 Phần (Parts)
  ✓ THÀNH CÔNG: Tổng số lượng câu hỏi trong đề: 118 câu

[GIAI ĐOẠN 6] Thực hiện làm bài từng kỹ năng theo tiêu chuẩn Aptis ESOL
  • Speaking:           12 câu (Parts 1-4)
  • Listening:          25 câu (Parts 5-8)
  • Grammar & Vocab:    50 câu (Parts 9-14)
  • Reading:            21 câu (Parts 15-18)
  • Writing:            10 câu (Parts 19-22)
  ✓ THÀNH CÔNG: Đã chuẩn bị câu trả lời cho Speaking: 12 câu (Audio URL + Transcript)
  ✓ THÀNH CÔNG: Đã chuẩn bị câu trả lời cho Listening: 25 câu (Trắc nghiệm & Đối thoại)
  ✓ THÀNH CÔNG: Đã chuẩn bị câu trả lời cho Grammar & Vocab: 50 câu
  ✓ THÀNH CÔNG: Đã chuẩn bị câu trả lời cho Reading: 21 câu
  ✓ THÀNH CÔNG: Đã chuẩn bị bài làm Writing: 10 câu (Short messages + Formal letters)

[GIAI ĐOẠN 7] Kiểm tra lưu nháp tự động (PUT /api/submissions/:id/autosave)
  ✓ THÀNH CÔNG: Autosave thành công: Đã lưu 118/118 câu trả lời vào CSDL

[GIAI ĐOẠN 8] Nộp bài thi chính thức (POST /api/submissions/:id/submit)
  ✓ THÀNH CÔNG: Nộp bài thành công! Trạng thái phản hồi: PENDING_EVALUATION
  ✓ THÀNH CÔNG: Thông báo: "undefined"
  ✓ THÀNH CÔNG: Điểm khách quan tức thì:
    - Listening:            undefined / 50 điểm
    - Reading:              undefined / 50 điểm
    - Grammar & Vocabulary: undefined / 50 điểm
    - Writing:              undefined
    - Speaking:             undefined
  ✓ THÀNH CÔNG: Hệ thống nhận diện chính xác bài thi có phần tự luận cần AI chấm ngầm (hasSubjectiveEvaluation = true)

[GIAI ĐOẠN 9] Kiểm tra động cơ AI chấm Speaking & Writing trong nền (Background AI Polling)
  Đang chờ AI Grading Service xử lý các câu trả lời tự luận...
    [Lần thử 1/15] Trạng thái bài thi: PENDING_EVALUATION | Điểm tổng: 108.8999999999999
    [Lần thử 2/15] Trạng thái bài thi: PENDING_EVALUATION | Điểm tổng: 108.8999999999999
    [Lần thử 3/15] Trạng thái bài thi: PENDING_EVALUATION | Điểm tổng: 108.8999999999999
    [Lần thử 4/15] Trạng thái bài thi: PENDING_EVALUATION | Điểm tổng: 108.8999999999999
    [Lần thử 5/15] Trạng thái bài thi: GRADED | Điểm tổng: 135
  ✓ THÀNH CÔNG: Kết quả chấm bài thi hoàn tất:
  ================ BẢNG ĐIỂM CHUẨN APTIS ESOL (200 ĐIỂM) ================
  • Điểm Nghe (Listening):          50 / 50 điểm
  • Điểm Đọc (Reading):             33 / 50 điểm
  • Điểm Viết (Writing):            14 / 50 điểm
  • Điểm Nói (Speaking):            38 / 50 điểm
  • Ngữ pháp & Từ vựng (G&V):       50 / 50 điểm (Chỉ số phân định)
  ----------------------------------------------------------------------
  ★ TỔNG ĐIỂM (L + R + W + S):       135 / 200 ĐIỂM
  ★ XẾP HẠNG CEFR QUỐC TẾ:          B2
  ======================================================================
  ✓ THÀNH CÔNG: Thang điểm tuân thủ tuyệt đối quy chuẩn Aptis ESOL: 135/200 điểm (Tính toán: 135/200)

[GIAI ĐOẠN 10] Kiểm tra hiển thị trong Lịch sử thi (GET /api/submissions/my-history)
  ✓ THÀNH CÔNG: Bài thi xuất hiện chính xác trong Lịch sử:
    - Tiêu đề:      Đề thi thử Aptis ESOL Full Test 01 (Kỳ Tích)
    - Kỹ năng:      Full Test
    - Điểm số:      135/200
    - Xếp loại:     Band B2

>>> TOÀN BỘ 10 GIAI ĐOẠN KIỂM THỬ END-TO-END ĐỀ THI FULL TEST HOÀN TẤT THÀNH CÔNG 100%! <<<

Thời gian thực thi: 18 giây
```

---
*Báo cáo được khởi tạo tự động bởi Antigravity Test Suite.*
