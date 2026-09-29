🔍 Phần còn cần hoàn thiện
🔴 Nhóm 1 — Code còn thiếu (cần dev thêm)
STT	Hạng mục	Vị trí	Mô tả
1	Lưu kết quả Speaking lên DB	Backend submission.service.ts	Sau khi thí sinh nộp bài /speaking/[id], cần gọi api.submissions.submit() với kèm audioUrl từng câu để lưu vào SubmissionAnswer. Hiện tại kết quả AI chỉ hiển thị trên client chưa persist.
2	Import Excel Admin	/admin/exams, /admin/vocabulary	Nút "Import từ Excel" đã có giao diện nhưng chưa kiểm thử đầu-cuối với file thực. Cần test với file .xlsx mẫu từ trung tâm.
3	Student join classroom	Frontend	Học viên có thể join lớp bằng mã code (joinClassroom) — API backend đã có nhưng cần kiểm tra giao diện phía học viên (có nút nào để nhập mã không).
🟡 Nhóm 2 — Cấu hình môi trường (không phải code)
STT	Hạng mục	Ghi chú
1	OpenAI API Key	Điền OPENAI_API_KEY thật để Whisper + GPT-4o hoạt động
2	SePay API Key	Điền SEPAY_API_KEY thật để nhận webhook thanh toán thực
3	Google OAuth	Điền Client ID thật vào Google Cloud Console
4	Import dữ liệu thực	Nhập 198 bộ từ vựng + 860 đề thi từ file Excel trung tâm vào DB
🟢 Nhóm 3 — Stashed features (tạm ẩn, bật lại khi cần)
STT	Component	Vị trí	Cách bật
1	<TodayPlan />	page.tsx:94	Bỏ comment dòng 94
2	<GoalTracker />	page.tsx:107	Bỏ comment dòng 107
