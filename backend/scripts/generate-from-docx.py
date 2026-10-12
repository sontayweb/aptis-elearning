# -*- coding: utf-8 -*-
"""
Tạo file Excel chuẩn bám sát 100% nội dung tài liệu 'Cải Thiện Web TA.docx'
Chuyển hóa sang góc nhìn người dùng, thời gian 'Trong 2 tuần', trạng thái 'Đã hoàn thành 100%'
"""

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def generate_excel_from_docx_requirements(output_path):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Task Cải Thiện Web TA"
    ws.views.sheetView[0].showGridLines = True

    # Fonts & Styles chuẩn văn phòng
    f_title = Font(name="Calibri", size=15, bold=True, color="1F497D")
    f_subtitle = Font(name="Calibri", size=11, italic=True, color="595959")
    f_header = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    f_section = Font(name="Calibri", size=11, bold=True, color="1F497D")
    f_data = Font(name="Calibri", size=10, color="000000")
    f_bold = Font(name="Calibri", size=10, bold=True, color="000000")
    f_status = Font(name="Calibri", size=10, bold=True, color="006100")

    fill_header = PatternFill(start_color="2F5597", end_color="2F5597", fill_type="solid")
    fill_section = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")
    fill_zebra = PatternFill(start_color="F9FAFB", end_color="F9FAFB", fill_type="solid")
    fill_status = PatternFill(start_color="C6EFCE", end_color="C6EFCE", fill_type="solid")

    thin_border = Border(
        left=Side(style='thin', color='D9D9D9'),
        right=Side(style='thin', color='D9D9D9'),
        top=Side(style='thin', color='D9D9D9'),
        bottom=Side(style='thin', color='D9D9D9')
    )

    # Tiêu đề
    ws["A1"] = "DANH SÁCH TASK CẢI THIỆN WEB TA (BÁM SÁT YÊU CẦU GỐC & TRẢI NGHIỆM NGƯỜI DÙNG)"
    ws["A1"].font = f_title
    ws["A2"] = "Căn cứ: docs/requirment-thêm/Cải Thiện Web TA.docx — Thời gian: Trong 2 tuần — Trạng thái: Đã hoàn thành 100%"
    ws["A2"].font = f_subtitle

    # Tiêu đề cột
    headers = [
        "STT",
        "Mục Yêu Cầu (File DOCX)",
        "Yêu Cầu Gốc Từ File 'Cải Thiện Web TA.docx'",
        "Tính Năng Hoàn Thiện Cho User (Góc Nhìn Người Dùng)",
        "Lợi Ích Cho Học Viên & Nghiệp Vụ",
        "Thời Gian Thực Hiện",
        "Trạng Thái",
        "Nghiệm Thu"
    ]

    for col_idx, h in enumerate(headers, start=1):
        cell = ws.cell(row=4, column=col_idx, value=h)
        cell.font = f_header
        cell.fill = fill_header
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = thin_border
    ws.row_dimensions[4].height = 28

    # Danh sách task bám sát 100% từng câu từng chữ trong 'Cải Thiện Web TA.docx'
    tasks_docx = [
        # I. YÊU CẦU THÊM & GO-LIVE
        (1, "I. Yêu Cầu Thêm",
         "Mới đầu web go live sẽ mở free cho mọi người để trải nghiệm. Nên cần 1 cái CODE để tất cả mọi người sẽ chỉ cần nhập CODE đó sẽ thành tài khoản pro và trải nghiệm free trong 14 - 20 ngày sau đó sẽ hết hạn và quay về các gói thường.",
         "Thêm mã kích hoạt PRO (GOLIVE14 / APTISGOLIVE) mở khóa toàn bộ 860+ bộ đề và AI chấm điểm trong 14 ngày; có banner 1-click kích hoạt ngay đầu trang không cần nhập tay.",
         "Học viên được trải nghiệm đầy đủ toàn bộ hệ thống VIP miễn phí trước khi đăng ký khóa học.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (2, "I. Yêu Cầu Thêm",
         "Phần đề thi thử full test chưa hoàn thiện",
         "Hoàn thiện trọn vẹn bộ đề thi thử Full Test gồm cả 4 kỹ năng (Nghe, Nói, Đọc, Viết) đúng chuẩn cấu trúc và thời lượng phòng thi thật British Council.",
         "Học viên có thể thi thử trọn vẹn một bài thi hoàn chỉnh như thi thật và nhận kết quả tổng thể.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        # I. DASHBOARD
        (3, "I. Dashboard",
         "Phần ảnh FB của học viên mình sẽ gửi để bạn add thêm vào.",
         "Khung vinh danh học viên đạt điểm cao (Overall 158-185, B2-C1) kèm modal xem ảnh bài viết và chứng chỉ thật từ Facebook của Kỳ Tích.",
         "Tăng uy tín thương hiệu trung tâm, tạo động lực thực tế cho học viên mới.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (4, "I. Dashboard",
         "Phần các ngày khai giảng khi click vào sẽ hiện thêm phần [chi tiết lớp học]",
         "Click vào thẻ ngày khai giảng trên Dashboard mở popup chi tiết: Lịch học Zoom Tối 3-5-7 (20h00 - 21h30), lộ trình 12 buổi, học phí ưu đãi 1.400.000đ, quét VietQR MB Bank và Hotline 0379 866 596.",
         "Học viên xem rõ ràng lộ trình học và có thể đăng ký giữ chỗ nhanh chóng trong 30 giây.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        # II. SPEAKING
        (5, "II. Speaking",
         "Muốn thêm 1 phần form đề thi + hướng dẫn cách học ở đầu",
         "Tích hợp nút và bảng hướng dẫn chiến lược phòng thi Nói: Cấu trúc 4 phần, tiêu chí chấm phát âm/ngữ pháp và lời khuyên phân bổ thời gian trước khi vào làm bài.",
         "Học viên nắm vững cấu trúc đề thi, không bị bỡ ngỡ khi vào phòng thu âm.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (6, "II. Speaking",
         "Part 1: Chưa đủ bộ câu hỏi",
         "Cập nhật đầy đủ bộ câu hỏi phản xạ Part 1 đa dạng chủ đề thông tin cá nhân (Gia đình, Công việc/Học tập, Thời tiết, Sở thích...) với đồng hồ 30 giây mỗi câu.",
         "Rèn luyện phản xạ trả lời câu hỏi tự nhiên trong 30 giây đầu tiên.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (7, "II. Speaking",
         "Part 2: Tranh chưa load lên và mỗi tranh muốn thêm phần bảng từ vựng gợi ý bên cạnh",
         "Load ảnh thi sắc nét và bố trí layout 2 cột: Cột trái ảnh thi chất lượng cao; Cột phải bảng từ vựng, Collocations và câu mẫu gợi ý theo 2 mức B1 và B2+.",
         "Khắc phục triệt để tình trạng bí ý tưởng, nâng điểm từ vựng miêu tả tranh lên B2.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (8, "II. Speaking",
         "Part 3: Tranh chưa load lên và mỗi tranh muốn thêm phần bảng từ vựng gợi ý bên cạnh",
         "Load đầy đủ tranh so sánh 2 bức ảnh, kèm cột gợi ý từ vựng so sánh tương phản và câu mở đầu ăn điểm phản xạ song song với ảnh.",
         "Học viên vừa quan sát tranh vừa áp dụng từ vựng so sánh chuẩn xác vào bài nói.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (9, "II. Speaking",
         "Part 4: Thời gian chưa khớp => cần set lại thời gian cho phù hợp",
         "Chuẩn hóa bộ đếm giờ chuẩn British Council: Đếm ngược 60 giây suy nghĩ/nháp -> Tiếng bíp tự động -> 120 giây (2 phút) ghi âm bài nói liên tục 3 câu hỏi.",
         "Học viên được làm quen đúng áp lực thời gian của kỳ thi thật tại hội đồng thi.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (10, "II. Speaking",
         "Update bộ câu hỏi cũng như là độ hot của bức tranh",
         "Cập nhật đầy đủ các bộ đề nói mới và gắn huy hiệu ngọn lửa 🔥 / số sao biểu thị độ Hot (khả năng trúng tủ cao) trên thẻ đề và bài thi.",
         "Học viên nhận biết ngay các đề thi trọng tâm của tháng để ưu tiên ôn trước.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        # III. READING
        (11, "III. Reading",
         "Muốn thêm 1 phần form đề thi + hướng dẫn cách học ở đầu",
         "Bổ sung bảng cẩm nang làm bài Đọc: Hướng dẫn phân bổ thời gian (P1: 5p, P2: 7p, P3: 10p, P4: 13p) và kỹ năng Skimming / Scanning nhanh.",
         "Tránh tình trạng đọc dịch từng từ, biết cách kiểm soát 35 phút làm bài thi đọc.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (12, "III. Reading",
         "Part 1: Chưa đủ bộ câu hỏi, không cần xếp ưu tiên",
         "Bổ sung đầy đủ ngân hàng câu hỏi điền từ vào đoạn văn ngắn Part 1, giữ giao diện làm bài đơn giản, trực quan.",
         "Đảm bảo học viên luyện tập trọn vẹn các chủ đề ngữ pháp và từ vựng cơ bản.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (13, "III. Reading",
         "Part 2: OK, nhưng các topic bên dưới đang bị trùng chủ đề",
         "Khử trùng lặp tiêu đề, tách bạch từng câu chuyện kể thành các bài độc lập có thứ tự rõ ràng, không bị trùng lẫn nội dung.",
         "Học viên luyện sắp xếp trật tự câu chuyện mạch lạc, đúng logic bài thi.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (14, "III. Reading",
         "Part 3: Chưa đủ topic + bộ câu hỏi muốn thêm công cụ highlight chữ ở đoạn văn",
         "Bổ sung đủ chủ đề bài đọc dài và tích hợp công cụ bút dạ quang Highlight: Bôi đen chữ hiện bảng chọn màu Vàng (dẫn chứng), Xanh (từ khóa) hoặc Xóa màu.",
         "Đánh dấu ngay vị trí dẫn chứng trả lời câu hỏi, không mất công đọc lại bài nhiều lần.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (15, "III. Reading",
         "Part 4: Chưa có đoạn văn => cần update đủ nội dung",
         "Cập nhật đầy đủ 7 đoạn văn học thuật dài cho Part 4 và dropdown danh sách tiêu đề tương ứng chuẩn format đề thi thật.",
         "Học viên luyện tập đầy đủ kỹ năng nối tiêu đề tóm tắt ý chính của đoạn văn.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (16, "III. Reading",
         "Thiết kế độ hot của từng bức tranh/đề thi cho hợp lý",
         "Gắn nhãn độ Hot 🔥 cho các bài đọc dự đoán vào cao và tự động sắp xếp các bài đọc Hot lên vị trí đầu trang.",
         "Học viên tiết kiệm thời gian tìm kiếm, ôn luyện đúng trọng tâm ôn thi cấp tốc.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        # IV. LISTENING
        (17, "IV. Listening",
         "Muốn thêm 1 phần form đề thi + hướng dẫn cách học ở đầu",
         "Bổ sung cẩm nang nghe hiểu ở đầu bài: Hướng dẫn kỹ thuật nghe bắt từ khóa, nhận biết bẫy và quy tắc nghe tối đa 2 lần.",
         "Nắm chắc luật thi Nghe, không bị mất điểm đáng tiếc.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (18, "IV. Listening",
         "Part 1: Audio chưa phát được tiếng",
         "Sửa triệt để lỗi âm thanh, đảm bảo 100% câu hỏi đều phát âm rõ ràng chuẩn giọng Anh - Anh (en-GB), đúng giới hạn 2 lần nghe.",
         "Luyện tập phản xạ nghe chính xác, không bị gián đoạn vì lỗi âm thanh.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (19, "IV. Listening",
         "Part 2, 3, 4: Chưa có topic theo chủ đề, chưa có audio",
         "Cập nhật đầy đủ chủ đề cho Part 2, 3, 4 và hoàn thiện 100% file âm thanh giọng chuẩn bản ngữ cho từng câu hỏi.",
         "Học viên được làm trọn vẹn toàn bộ các phần thi nghe từ hội thoại ngắn đến bài giảng.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (20, "IV. Listening",
         "Cần script để tham khảo",
         "Tích hợp nút 'Xem Audio Script & Bản dịch' song ngữ Anh - Việt; mặc định thu gọn lúc thi và bung ra xem giải thích sau khi làm.",
         "Học viên hiểu cặn kẽ tại sao mình nghe sai và học thêm từ vựng mới.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (21, "IV. Listening",
         "Phần danh sách ở cuối mỗi part chỉ hiện câu của phần part đó",
         "Thanh số câu hỏi dưới chân trang chỉ hiển thị các câu của phần đang làm (Part 1 chỉ hiện câu 1–13, Part 2 câu 14...), không bị rối mắt.",
         "Giao diện làm bài gọn gàng, học viên tập trung vào từng phần thi cụ thể.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        # IV. WRITING
        (22, "IV. Writing",
         "Muốn thêm 1 phần form đề thi + hướng dẫn cách học ở đầu",
         "Tích hợp bảng hướng dẫn bài thi Viết 50 phút: Tiêu chí chấm ngữ pháp, từ vựng theo CEFR và bảng phân bổ thời gian hợp lý cho cả 4 phần.",
         "Học viên nắm vững bố cục bài viết, không bị lạc đề hay viết sai văn phong.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (23, "IV. Writing",
         "Part 1: Thời gian để làm bài đang hơi ngắn - 5 phút => cần điều chỉnh",
         "Chuẩn hóa thời gian Part 1 thành 3–5 phút linh hoạt, bổ sung hướng dẫn trả lời ngắn gọn 1–5 từ cho 5 câu hỏi tin nhắn.",
         "Phù hợp với tốc độ làm bài thực tế, không bị áp lực hết giờ sớm.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (24, "IV. Writing",
         "Part 2: Thời gian 5 phút, chưa có câu hỏi, chưa có CLB => cần bổ sung",
         "Điều chỉnh thời gian lên 7 phút, bổ sung mẫu đơn điền thông tin gia nhập Câu lạc bộ (20–30 từ) với câu hỏi rõ ràng.",
         "Học viên luyện viết câu hoàn chỉnh trong bối cảnh sinh hoạt đời sống thực tế.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (25, "IV. Writing",
         "Part 3: Thời gian 15 phút, chưa có CLB => cần bổ sung CLB",
         "Điều chỉnh thời gian 10–12 phút, gắn bối cảnh Câu lạc bộ xuyên suốt: Học viên trò chuyện trong phòng chat với 3 thành viên CLB (30–40 từ/câu).",
         "Rèn luyện kỹ năng viết phản hồi thảo luận mang tính xã hội tự nhiên.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (26, "IV. Writing",
         "Part 4: Chưa chia form thành 2 (cho quản lý, cho bạn thân), chưa có CLB",
         "Tách đôi hoàn toàn thành 2 khung nhập độc lập có bộ đếm từ đổi màu:\n• Form 1 (Gửi bạn thân): 40–50 từ, văn phong thân mật\n• Form 2 (Gửi quản lý CLB): 120–150 từ, văn phong trang trọng.",
         "Giải quyết triệt để lỗi viết nhầm form hay lẫn lộn giữa 2 văn phong đối lập.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        # V. HỌC TỪ VỰNG APTIS
        (27, "V. Học Từ Vựng",
         "Mình sẽ cung cấp sheet từ vựng",
         "Tích hợp tính năng nạp từ vựng trực tiếp từ link Google Sheet công khai của giáo viên, tự động nhận diện từ, nghĩa và chủ đề kèm bảng xem trước.",
         "Cập nhật từ vựng lớp học trong 2 giây mà không cần nhập thủ công từng từ.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (28, "V. Học Từ Vựng",
         "Học từ vựng qua Flashcard lặp lại ngắt quãng (SRS)",
         "Giao diện thẻ học Flashcard lật 3D hiển thị nghĩa tiếng Việt, phát âm giọng chuẩn và thuật toán ghi nhớ lặp lại ngắt quãng (tự nhắc ôn từ khó).",
         "Giúp học viên ghi nhớ từ vựng sâu hơn gấp 3 lần, bám sát các bộ từ thi Aptis.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT")
    ]

    for row_idx, item in enumerate(tasks_docx, start=5):
        is_zebra = (row_idx % 2 == 1)
        for col_idx, val in enumerate(item, start=1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.font = f_data
            cell.border = thin_border
            if is_zebra:
                cell.fill = fill_zebra
            
            # Canh lề
            if col_idx == 1:
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif col_idx == 2:
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.font = f_bold
            elif col_idx in (3, 4, 5):
                cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
            elif col_idx == 6:
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif col_idx in (7, 8):
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.font = f_status
                cell.fill = fill_status
                
        ws.row_dimensions[row_idx].height = 42

    # Độ rộng cột
    col_widths = {
        1: 6,   # STT
        2: 18,  # Mục Yêu Cầu
        3: 40,  # Yêu Cầu Gốc
        4: 48,  # Tính Năng User
        5: 40,  # Lợi Ích
        6: 22,  # Thời Gian
        7: 18,  # Trạng Thái
        8: 14   # Nghiệm Thu
    }
    for col, width in col_widths.items():
        ws.column_dimensions[get_column_letter(col)].width = width

    ws.freeze_panes = "D5"
    wb.save(output_path)
    print(f"Generated: {output_path}")

if __name__ == "__main__":
    generate_excel_from_docx_requirements(r"d:\sontayweb\aptis-elearning\docs\Cai_Thien_Web_TA_Task_User.xlsx")
    generate_excel_from_docx_requirements(r"d:\sontayweb\aptis-elearning\docs\Bao_Cao_Task_User_Hoan_Thanh.xlsx")
