# -*- coding: utf-8 -*-
"""
Script tạo file Excel: Kế hoạch Timeline & Danh mục Task theo góc nhìn Người dùng
Dự án: Aptis Kỳ Tích (Aptis E-Learning)
"""

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def create_user_timeline_excel():
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)

    # Styles definition
    font_family = "Segoe UI"
    
    font_title = Font(name=font_family, size=16, bold=True, color="1E3A8A")
    font_subtitle = Font(name=font_family, size=10, italic=True, color="475569")
    font_section = Font(name=font_family, size=12, bold=True, color="0F172A")
    font_tbl_header = Font(name=font_family, size=10, bold=True, color="FFFFFF")
    font_sprint_header = Font(name=font_family, size=11, bold=True, color="1E3A8A")
    font_data = Font(name=font_family, size=9.5, color="1E293B")
    font_data_bold = Font(name=font_family, size=9.5, bold=True, color="1E293B")
    font_status_done = Font(name=font_family, size=9.5, bold=True, color="15803D")
    
    fill_header = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
    fill_sprint = PatternFill(start_color="EEF2FF", end_color="EEF2FF", fill_type="solid")
    fill_zebra = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    fill_status_done = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid")
    fill_metric_box = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")

    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )
    
    header_border = Border(
        left=Side(style='thin', color='1E3A8A'),
        right=Side(style='thin', color='1E3A8A'),
        top=Side(style='medium', color='1E3A8A'),
        bottom=Side(style='medium', color='1E3A8A')
    )

    # -------------------------------------------------------------
    # SHEET 1: Tổng Quan & Định Vị User
    # -------------------------------------------------------------
    ws1 = wb.create_sheet(title="Tổng Quan & Định Vị User")
    ws1.views.sheetView[0].showGridLines = True
    
    ws1["B2"] = "KẾ HOẠCH TIMELINE & DANH MỤC TASK THEO GÓC NHÌN NGƯỜI DÙNG"
    ws1["B2"].font = font_title
    ws1["B3"] = "HỆ THỐNG LUYỆN THI TRỰC TUYẾN APTIS KỲ TÍCH (APTIS E-LEARNING) — PHIÊN BẢN USER-CENTRIC v2.2"
    ws1["B3"].font = font_subtitle

    # Summary boxes
    metrics = [
        ("Tổng số Sprint hoàn thành", "8 Sprint (100%)"),
        ("Tổng tính năng cho User", "32 Hạng mục"),
        ("Thời gian trải nghiệm Go-Live", "14 Ngày VIP PRO"),
        ("Mục tiêu khảo thí", "Chuẩn British Council")
    ]
    
    for i, (label, val) in enumerate(metrics):
        col_start = 2 + i * 2
        col_end = col_start + 1
        ws1.merge_cells(start_row=5, start_column=col_start, end_row=5, end_column=col_end)
        ws1.merge_cells(start_row=6, start_column=col_start, end_row=6, end_column=col_end)
        
        c_label = ws1.cell(row=5, column=col_start, value=label)
        c_label.font = Font(name=font_family, size=9, bold=True, color="64748B")
        c_label.alignment = Alignment(horizontal="center", vertical="center")
        
        c_val = ws1.cell(row=6, column=col_start, value=val)
        c_val.font = Font(name=font_family, size=11, bold=True, color="1E3A8A")
        c_val.alignment = Alignment(horizontal="center", vertical="center")
        
        for r in range(5, 7):
            for c in range(col_start, col_end + 1):
                cell = ws1.cell(row=r, column=c)
                cell.fill = fill_metric_box
                cell.border = thin_border

    # Section 1: Đối chiếu Kỹ thuật vs Người dùng
    ws1["B8"] = "I. MA TRẬN ĐỐI CHIẾU: THUẬT NGỮ KỸ THUẬT VS TRẢI NGHIỆM NGƯỜI DÙNG"
    ws1["B8"].font = font_section

    comp_headers = [
        "STT", "Chức năng", "Góc nhìn Kỹ thuật (Dev / Codebase)", 
        "Góc nhìn Người dùng (User / Học viên & Quản trị)", "Lợi ích học tập / Nghiệp vụ"
    ]
    
    for col_idx, header in enumerate(comp_headers, start=2):
        cell = ws1.cell(row=10, column=col_idx, value=header)
        cell.font = font_tbl_header
        cell.fill = fill_header
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = header_border
    ws1.row_dimensions[10].height = 28

    comp_data = [
        (1, "Mã PRO Trải nghiệm", "Seed database mã GOLIVE14, API POST /api/payment/redeem-code", 
         "Nút bấm 1-chạm 'Kích hoạt 14 ngày VIP Pro' nổi bật trên đầu trang", 
         "Nhận ngay 14 ngày mở khóa toàn bộ đề thi mà không cần gõ mã phức tạp"),
        (2, "Lịch Khai Giảng & Lộ Trình", "Component course-class-banner.tsx, Model CourseLeadRegistration", 
         "Bảng tra cứu lịch lớp Zoom tối 3-5-7, xem chi tiết lộ trình 12 buổi học", 
         "Tự tin nắm chắc thời gian và kiến thức từng buổi trước khi đăng ký"),
        (3, "Học Phí Ưu Đãi & VietQR", "API tạo mã VietQR động tài khoản MB Bank Nguyễn Duy Cương", 
         "Quét mã QR học phí ưu đãi 1.400.000đ, tự điền tiền và nội dung, Hotline 24/7", 
         "Thanh toán giữ chỗ nhanh trong 30 giây, kết nối trung tâm tức thì"),
        (4, "Viết Thư Part 4", "Tách form state, validation riêng biệt 2 textarea", 
         "2 ô viết thư độc lập: Thư cho bạn (50 từ, thân mật) & Thư cho quản lý (150 từ, trang trọng)", 
         "Không bị nhầm lẫn giữa 2 văn phong, bộ đếm từ đổi màu nhắc độ dài"),
        (5, "Đồng Hồ Phòng Thi Nói", "Hook useTimer với các mốc thời gian BC chuẩn", 
         "Đồng hồ đếm chuẩn phòng thi: 60s nháp -> Tiếng bíp tự động -> 120s ghi âm bài nói", 
         "Làm quen với áp lực thời gian phòng thi thật British Council"),
        (6, "Bảng Gợi Ý Từ Vựng Nói", "Layout 2 cột CSS Grid responsive, fetch collocations", 
         "Cột trái ảnh thi sắc nét, cột phải bảng gợi ý từ vựng và câu mẫu ăn điểm B1 & B2+", 
         "Khắc phục tình trạng 'bí từ' khi miêu tả tranh, phản xạ tự nhiên"),
        (7, "Bút Dạ Quang Bài Đọc", "Selection menu, popover bôi màu Vàng/Xanh/Xóa", 
         "Bút dạ quang bôi màu Vàng (dẫn chứng) và Xanh (từ khóa) trực tiếp trên bài đọc", 
         "Dễ dàng tìm thấy câu chứng minh đáp án mà không phải đọc đi đọc lại"),
        (8, "Lời Thoại & Bản Dịch Nghe", "Web Speech fallback, Drawer ẩn hiện audio script", 
         "Nghe audio chuẩn giọng Anh - Anh; có nút 'Xem Audio Script & Bản dịch' thu gọn", 
         "Hiểu cặn kẽ tại sao mình nghe sai sau khi nộp bài"),
        (9, "Từ Vựng Flashcard SRS", "API POST /api/import-sheet, thuật toán Spaced Repetition", 
         "Thẻ Flashcard lật 3D có phát âm giọng chuẩn, tự nhắc ôn lại từ khó, nạp qua Google Sheet", 
         "Nhớ từ vựng lâu gấp 3 lần, học đúng các bộ từ do giáo viên cung cấp"),
        (10, "Bộ Lọc Đề Thi Hot", "Column hot_level, ORDER BY hot_level DESC", 
         "Biểu tượng Ngọn lửa 🔥 trên thẻ đề thi, tự động ưu tiên đề thi trúng tủ lên đầu", 
         "Tối ưu hóa thời gian ôn tập cấp tốc sát ngày thi")
    ]

    for row_idx, row_data in enumerate(comp_data, start=11):
        is_zebra = (row_idx % 2 == 1)
        for col_idx, val in enumerate(row_data, start=2):
            cell = ws1.cell(row=row_idx, column=col_idx, value=val)
            cell.font = font_data
            cell.border = thin_border
            if is_zebra:
                cell.fill = fill_zebra
            if col_idx == 2:
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif col_idx == 3:
                cell.alignment = Alignment(horizontal="left", vertical="center")
                cell.font = font_data_bold
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
        ws1.row_dimensions[row_idx].height = 42

    # Column widths for Sheet 1
    col_widths_ws1 = {2: 8, 3: 24, 4: 38, 5: 42, 6: 40}
    for col, width in col_widths_ws1.items():
        ws1.column_dimensions[get_column_letter(col)].width = width

    # -------------------------------------------------------------
    # SHEET 2: Timeline & Task User Chi Tiết
    # -------------------------------------------------------------
    ws2 = wb.create_sheet(title="Timeline & Task User Chi Tiết")
    ws2.views.sheetView[0].showGridLines = True
    ws2.freeze_panes = "D5"

    ws2["B2"] = "DANH MỤC 32 TASK THEO TIMELINE GÓC NHÌN NGƯỜI DÙNG (USER STORIES & UAC)"
    ws2["B2"].font = font_title
    ws2["B3"] = "Phân bổ 8 Sprint hoàn thành cuốn chiếu — Chuyển dịch toàn diện từ đặc tả kỹ thuật sang nghiệm thu trải nghiệm học viên"
    ws2["B3"].font = font_subtitle

    task_headers = [
        "Sprint / Tuần", "Mã Task", "Phân Hệ / Kỹ Năng", "Tên Tính Năng Người Dùng", 
        "Đối Tượng Thụ Hưởng", "Thao Tác & Trải Nghiệm Thực Tế (UX)", 
        "Lợi Ích & Giá Trị Đạt Được", "Tiêu Chí Nghiệm Thu (Acceptance Criteria)", "Trạng Thái"
    ]

    for col_idx, header in enumerate(task_headers, start=2):
        cell = ws2.cell(row=4, column=col_idx, value=header)
        cell.font = font_tbl_header
        cell.fill = fill_header
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = header_border
    ws2.row_dimensions[4].height = 30

    tasks_data = [
        # SPRINT 1
        ("SPRINT 1\n(Tuần 1)", "TASK-U01", "Ưu Đãi Go-Live", "Nhận gói VIP PRO 14 ngày miễn phí", 
         "Học viên mới & cũ", "Học viên vào web thấy thông báo nhận quà; bấm nhận là tài khoản tự mở khóa 14 ngày PRO.", 
         "Trải nghiệm toàn bộ 860+ bộ đề thi và AI chấm điểm không tốn phí.", 
         "Tài khoản được cộng đủ 14 ngày VIP Pro ngay lập tức.", "HOÀN THÀNH"),
        ("SPRINT 1\n(Tuần 1)", "TASK-U02", "Giao Diện Trang Chủ", "Thanh kích hoạt nhận quà 1-chạm", 
         "Khách truy cập", "Banner dính trên đầu trang chủ và bàn làm việc có nút 'Kích hoạt ngay' và nút 'Sao chép mã'.", 
         "Tiện lợi tối đa, không cần ghi nhớ hay nhập tay ký tự mã khuyến mại.", 
         "Banner nổi bật trên cả điện thoại và máy tính; 1 chạm là xong.", "HOÀN THÀNH"),
        
        # SPRINT 2
        ("SPRINT 2\n(Tuần 1-2)", "TASK-U03", "Bàn Làm Việc", "Bảng vinh danh thành tích học viên", 
         "Học viên & Phụ huynh", "Xem danh sách học viên điểm cao (Overall 158-185/200, B2-C1) kèm ảnh bài viết Facebook.", 
         "Tăng uy tín thương hiệu trung tâm, tạo động lực phấn đấu cho người học.", 
         "Hiển thị rõ điểm 4 kỹ năng; bấm vào xem được ảnh chứng chỉ.", "HOÀN THÀNH"),
        ("SPRINT 2\n(Tuần 1-2)", "TASK-U04", "Lịch Khai Giảng", "Tra cứu lịch khai giảng lớp học mới", 
         "Học viên tìm lớp", "Thẻ lịch khai giảng thể hiện rõ lịch học tối 3-5-7 từ 20h00 - 21h30 qua Zoom, 10 ngày có 1 lớp mới.", 
         "Học viên chủ động sắp xếp thời gian biểu học tập phù hợp.", 
         "Thông tin ngày khai giảng, số buổi, giờ học thể hiện rõ ràng.", "HOÀN THÀNH"),
        ("SPRINT 2\n(Tuần 1-2)", "TASK-U05", "Thông Tin Khóa Học", "Xem chi tiết lộ trình 12 buổi học", 
         "Người quan tâm khóa học", "Bấm vào thẻ lớp học mở bảng thông tin chi tiết từng buổi từ Speaking P1-P4, Writing đến Tổng ôn.", 
         "Nắm rõ từng chặng kiến thức được trang bị trong 4 tuần học cấp tốc.", 
         "Có tab chuyển đổi trực quan giữa Lộ trình học và Đăng ký giữ chỗ.", "HOÀN THÀNH"),
        ("SPRINT 2\n(Tuần 1-2)", "TASK-U06", "Đăng Ký & Thanh Toán", "Đăng ký giữ chỗ & Quét VietQR học phí", 
         "Học viên đăng ký", "Xem học phí ưu đãi 1.400.000đ; quét mã VietQR MB Bank tự điền số tiền hoặc gọi Hotline 24/7.", 
         "Giữ chỗ nhanh chóng trong 30 giây; có 2 lựa chọn (chuyển khoản tự động hoặc tư vấn viên).", 
         "Mã VietQR quét chính xác; form lưu số điện thoại để trung tâm xếp lớp.", "HOÀN THÀNH"),

        # SPRINT 3
        ("SPRINT 3\n(Tuần 2-3)", "TASK-U07", "Kỹ Năng Speaking", "Cẩm nang chiến lược phòng thi Nói", 
         "Học viên luyện Nói", "Bấm nút hướng dẫn ở đầu bài để xem cấu trúc 4 phần, tiêu chí chấm và phân bổ thời gian.", 
         "Không bị bỡ ngỡ về thể thức thi, nắm vững mẹo trả lời mạch lạc.", 
         "Bảng hướng dẫn mở ra mượt mà, đầy đủ thông tin chuẩn British Council.", "HOÀN THÀNH"),
        ("SPRINT 3\n(Tuần 2-3)", "TASK-U08", "Speaking Part 1", "Luyện phản xạ thông tin cá nhân Part 1", 
         "Học viên luyện Nói", "Luyện trả lời 3 câu hỏi liên hoàn theo các chủ đề đời sống (Gia đình, Thời tiết, Công việc...).", 
         "Tăng tốc độ phản xạ tự nhiên trong 30 giây đầu tiên.", 
         "Có đủ 3 câu hỏi kèm đồng hồ đếm ngược 30 giây mỗi câu.", "HOÀN THÀNH"),
        ("SPRINT 3\n(Tuần 2-3)", "TASK-U09", "Speaking Part 2 & 3", "Bảng từ vựng gợi ý bên cạnh tranh thi", 
         "Học viên luyện Nói", "Giao diện 2 cột: Cột trái ảnh thi sắc nét; Cột phải bảng Collocations, từ vựng và câu mẫu B1 & B2+.", 
         "Giải quyết triệt để tình trạng bí ý tưởng, nâng điểm từ vựng lên band B2.", 
         "Ảnh rõ nét; bảng từ vựng hiển thị đồng thời cả trên PC và mobile.", "HOÀN THÀNH"),
        ("SPRINT 3\n(Tuần 2-3)", "TASK-U10", "Speaking Part 4", "Đồng hồ chuẩn phòng thi Part 4", 
         "Học viên luyện Nói", "Đúng chuẩn BC: 60 giây suy nghĩ/nháp -> Tiếng bíp tự động -> 120 giây (2 phút) ghi âm liên tục.", 
         "Thực hành đúng chuẩn áp lực thời gian của kỳ thi thật.", 
         "Tự động chuyển từ nháp sang ghi âm sau tiếng bíp; đồng hồ chính xác 100%.", "HOÀN THÀNH"),
        ("SPRINT 3\n(Tuần 2-3)", "TASK-U11", "Đề Thi Trúng Tủ", "Nhận biết đề thi Nói Hot (Huy hiệu 🔥)", 
         "Học viên luyện Nói", "Các đề thi và tranh mô tả có tần suất vào cao trong tháng được gắn biểu tượng 🔥 và số sao.", 
         "Ưu tiên luyện trước những đề có khả năng gặp nhất trong phòng thi.", 
         "Huy hiệu Hot nổi bật trên danh sách bài thi và màn hình làm bài.", "HOÀN THÀNH"),
        ("SPRINT 3\n(Tuần 2-3)", "TASK-U12", "Nghe Lại & Chấm Điểm", "Nghe lại bài nói & Nhận xét từ AI", 
         "Học viên luyện Nói", "Trình phát âm thanh bài thu của học viên mượt mà, tua tiến lùi chuẩn xác; AI trả điểm theo CEFR.", 
         "Tự đánh giá được phát âm, độ lưu loát và nhận ngay lời khuyên cải thiện.", 
         "Thanh nghe lại không bị lỗi vô cực thời gian; có bảng điểm 4 tiêu chí.", "HOÀN THÀNH"),

        # SPRINT 4
        ("SPRINT 4\n(Tuần 3-4)", "TASK-U13", "Kỹ Năng Reading", "Cẩm nang làm bài Đọc hiểu 4 phần", 
         "Học viên luyện Đọc", "Xem hướng dẫn phân bổ thời gian (P1: 5p, P2: 7p, P3: 10p, P4: 13p) và kỹ năng Skim/Scan.", 
         "Tránh sa đà dịch từng từ, biết cách phân bổ thời gian hợp lý cho 35 phút thi.", 
         "Hiển thị rõ thời gian khuyến nghị và chiến thuật cho từng Part.", "HOÀN THÀNH"),
        ("SPRINT 4\n(Tuần 3-4)", "TASK-U14", "Reading Part 2", "Luyện sắp xếp câu chuyện Part 2", 
         "Học viên luyện Đọc", "Mỗi đề là một câu chuyện độc lập, tiêu đề rõ ràng, không bị trùng lặp chủ đề.", 
         "Rèn luyện tư duy logic liên kết câu văn (coherence & cohesion).", 
         "Các câu chuyện hiển thị riêng biệt, thao tác kéo thả/sắp xếp mượt mà.", "HOÀN THÀNH"),
        ("SPRINT 4\n(Tuần 3-4)", "TASK-U15", "Công Cụ Làm Bài Đọc", "Bút dạ quang (Highlight) trên bài đọc dài", 
         "Học viên luyện Đọc", "Bôi đen chữ hiện menu chọn màu Vàng (dẫn chứng), Xanh (từ khóa) hoặc Xóa màu.", 
         "Định vị tức thì câu chứa đáp án, không mất công dò lại bài nhiều lần.", 
         "Menu nổi nhạy bén; vết tô màu được giữ nguyên khi chuyển qua lại các câu.", "HOÀN THÀNH"),
        ("SPRINT 4\n(Tuần 3-4)", "TASK-U16", "Reading Part 4", "Nối tiêu đề bài đọc dài Part 4", 
         "Học viên luyện Đọc", "Đọc trọn vẹn 7 đoạn văn học thuật và chọn tiêu đề tóm tắt tương ứng qua hộp chọn.", 
         "Nâng cao năng lực đọc hiểu ý chính của đoạn văn dài.", 
         "Đầy đủ 7 đoạn văn và danh sách tiêu đề; chọn đáp án dễ dàng.", "HOÀN THÀNH"),
        ("SPRINT 4\n(Tuần 3-4)", "TASK-U17", "Đề Thi Trọng Tâm", "Bộ đề Đọc hiểu ưu tiên theo độ Hot", 
         "Học viên luyện Đọc", "Các bài đọc hay gặp được gắn huy hiệu ngọn lửa 🔥 và tự động đưa lên đầu trang.", 
         "Tiết kiệm thời gian tìm kiếm, ôn luyện đúng trọng tâm ôn thi cấp tốc.", 
         "Thứ tự hiển thị mặc định sắp xếp từ đề hot nhất trở xuống.", "HOÀN THÀNH"),

        # SPRINT 5
        ("SPRINT 5\n(Tuần 4-5)", "TASK-U18", "Kỹ Năng Listening", "Quy tắc và bẫy đề thi Nghe hiểu", 
         "Học viên luyện Nghe", "Xem hướng dẫn phân loại câu hỏi (thông tin ngắn, quan điểm, thảo luận) và bẫy phát âm.", 
         "Tăng khả năng bắt từ khóa và loại trừ đáp án nhiễu.", 
         "Hướng dẫn rõ quy tắc nghe tối đa 2 lần cho từng câu.", "HOÀN THÀNH"),
        ("SPRINT 5\n(Tuần 4-5)", "TASK-U19", "Âm Thanh Luyện Nghe", "Nghe âm thanh chuẩn giọng Anh - Anh", 
         "Học viên luyện Nghe", "100% các câu hỏi đều có âm thanh rõ tiếng, giọng bản ngữ chuẩn, có giới hạn 2 lần nghe.", 
         "Rèn luyện thói quen tập trung nghe như trong kỳ thi thật, không bị gián đoạn vì thiếu audio.", 
         "Âm lượng rõ ràng, thanh phát đếm đúng số lần nghe cho phép.", "HOÀN THÀNH"),
        ("SPRINT 5\n(Tuần 4-5)", "TASK-U20", "Lời Thoại Bài Nghe", "Xem lời thoại (Script) & Bản dịch tiếng Việt", 
         "Học viên luyện Nghe", "Bấm nút 'Xem Audio Script' để mở khung kịch bản đối chiếu tiếng Anh và bản dịch tiếng Việt.", 
         "Học viên hiểu rõ tại sao mình nghe sai, học thêm từ vựng mới từ bài nghe.", 
         "Mặc định ẩn lúc làm bài; mở ra xem mượt mà sau khi nộp bài.", "HOÀN THÀNH"),
        ("SPRINT 5\n(Tuần 4-5)", "TASK-U21", "Thanh Số Câu Hỏi", "Bảng chuyển câu theo từng phần gọn gàng", 
         "Học viên luyện Nghe", "Thanh số câu hỏi dưới chân trang chỉ hiển thị các câu của phần đang làm (P1: câu 1-13).", 
         "Trực quan, tập trung làm đúng phần đang thi mà không bị cuộn trang quá dài.", 
         "Chuyển câu nhanh chóng; trạng thái câu đã làm/chưa làm phân biệt rõ.", "HOÀN THÀNH"),

        # SPRINT 6
        ("SPRINT 6\n(Tuần 5-6)", "TASK-U22", "Kỹ Năng Writing", "Cẩm nang viết bài đạt điểm B2/C", 
         "Học viên luyện Viết", "Nắm rõ quy chuẩn bài thi Viết 50 phút và tiêu chí chấm ngữ pháp, từ vựng theo CEFR.", 
         "Hiểu rõ yêu cầu bài viết để tránh lỗi lạc đề hoặc sai văn phong.", 
         "Hiển thị bảng phân bổ thời gian hợp lý cho cả 4 phần Viết.", "HOÀN THÀNH"),
        ("SPRINT 6\n(Tuần 5-6)", "TASK-U23", "Writing Part 1-3", "Luyện viết theo bối cảnh Câu lạc bộ", 
         "Học viên luyện Viết", "Điền form gia nhập CLB (Part 2: 20-30 từ) và chat trong nhóm với 3 thành viên CLB (Part 3: 30-40 từ).", 
         "Rèn luyện khả năng dùng từ tự nhiên trong các tình huống đời sống sinh hoạt.", 
         "Bối cảnh CLB đồng bộ, xuyên suốt từ Part 2 sang Part 3.", "HOÀN THÀNH"),
        ("SPRINT 6\n(Tuần 5-6)", "TASK-U24", "Writing Part 4", "Phân tách 2 bài viết thư riêng biệt", 
         "Học viên luyện Viết", "Tách hẳn 2 ô nhập: Thư gửi bạn thân (50 từ, thân mật) & Thư gửi quản lý CLB (150 từ, trang trọng).", 
         "Không bị nhầm lẫn giữa 2 văn phong đối lập; bố cục rõ ràng đúng đề thi thật.", 
         "2 ô nhập độc lập, có hướng dẫn mở bài/kết bài mẫu cho từng văn phong.", "HOÀN THÀNH"),
        ("SPRINT 6\n(Tuần 5-6)", "TASK-U25", "Bộ Đếm Số Từ", "Đồng hồ đếm số từ thông minh đổi màu", 
         "Học viên luyện Viết", "Đếm số từ trực tiếp khi gõ; thanh đo đổi sang màu xanh khi đạt độ dài tiêu chuẩn.", 
         "Kiểm soát chính xác độ dài bài viết, tránh bị trừ điểm do viết quá ngắn hoặc quá dài.", 
         "Đếm chính xác từng từ gõ vào; có cảnh báo khi vượt quá giới hạn.", "HOÀN THÀNH"),

        # SPRINT 7
        ("SPRINT 7\n(Tuần 6-7)", "TASK-U26", "Kho Từ Vựng", "Nạp từ vựng từ link Google Sheet", 
         "Giáo viên & Học viên", "Dán link Google Sheet bài học của lớp vào web; hệ thống tự nhận diện từ, nghĩa và chủ đề.", 
         "Cập nhật danh sách từ mới cực nhanh mà không cần gõ từng từ thủ công.", 
         "Có bảng xem trước (Preview) danh sách từ trước khi nạp vào sổ tay.", "HOÀN THÀNH"),
        ("SPRINT 7\n(Tuần 6-7)", "TASK-U27", "Học Qua Flashcard", "Thẻ Flashcard lật 3D kèm âm thanh", 
         "Học viên ôn từ vựng", "Thẻ học lật mặt trước (từ + phát âm) và mặt sau (nghĩa + ví dụ); bấm loa nghe đọc chuẩn bản xứ.", 
         "Tăng khả năng liên tưởng và ghi nhớ từ vựng qua cả hình ảnh và âm thanh.", 
         "Hiệu ứng lật 3D mượt mà; phát âm audio rõ ràng cho từng từ.", "HOÀN THÀNH"),
        ("SPRINT 7\n(Tuần 6-7)", "TASK-U28", "Thuật Toán Nhớ Lâu", "Học lặp lại ngắt quãng (SRS)", 
         "Học viên ôn từ vựng", "Tự động phân loại từ 'Đã thuộc' và 'Chưa thuộc' để nhắc ôn lại đúng chu kỳ quên lãng.", 
         "Giúp học sinh ghi nhớ từ vựng vào trí nhớ dài hạn hiệu quả gấp 3 lần.", 
         "Lưu tiến độ học tập vào sổ tay cá nhân; gợi ý từ cần ôn tập hàng ngày.", "HOÀN THÀNH"),

        # SPRINT 8
        ("SPRINT 8\n(Tuần 7-8)", "TASK-U29", "Thi Thử Full Test", "Bộ lọc đề thi trọng tâm theo Huy hiệu Lửa 🔥", 
         "Học viên thi thử", "Lọc nhanh các bộ đề thi thử toàn diện 4 kỹ năng có độ Hot cao nhất của kỳ thi.", 
         "Tiết kiệm thời gian, tập trung tối đa vào các bộ đề có xác suất trúng tủ cao.", 
         "Bộ lọc độ hot hoạt động mượt mà; hiển thị trực quan ngọn lửa 🔥.", "HOÀN THÀNH"),
        ("SPRINT 8\n(Tuần 7-8)", "TASK-U30", "Giao Diện Quản Trị", "Bảng hướng dẫn thao tác quản trị mượt mà", 
         "Giáo viên & Admin", "Bảng hướng dẫn trong trang quản trị tự động né mép màn hình, không bị che mất nút bấm.", 
         "Giáo viên thao tác quản lý đề thi và lớp học dễ dàng, không gặp lỗi giao diện.", 
         "Popup hiển thị thông minh, tự động lật hướng khi chạm mép đáy màn hình.", "HOÀN THÀNH"),
        ("SPRINT 8\n(Tuần 7-8)", "TASK-U31", "Kiểm Soát Vận Hành", "Nhật ký gửi email thông báo học tập", 
         "Quản lý trung tâm", "Xem được danh sách email báo điểm thi và email kích hoạt tài khoản gửi đến học viên.", 
         "Đảm bảo 100% học viên nhận được thông tin đầy đủ, kịp thời xử lý sự cố.", 
         "Ghi nhận rõ thời gian, người nhận và trạng thái gửi thành công.", "HOÀN THÀNH"),
        ("SPRINT 8\n(Tuần 7-8)", "TASK-U32", "An Toàn Dữ Liệu", "Bảo vệ an toàn kho đề thi và bài làm", 
         "Toàn bộ người dùng", "Kho 1,724+ đề thi và kết quả làm bài của học viên luôn được bảo toàn nguyên vẹn 100%.", 
         "Học viên yên tâm không bị mất lịch sử làm bài; hệ thống luôn hoạt động ổn định.", 
         "Hệ thống vận hành trơn tru, không có sự cố gián đoạn hay mất dữ liệu.", "HOÀN THÀNH")
    ]

    for row_idx, task in enumerate(tasks_data, start=5):
        is_zebra = (row_idx % 2 == 1)
        for col_idx, val in enumerate(task, start=2):
            cell = ws2.cell(row=row_idx, column=col_idx, value=val)
            cell.font = font_data
            cell.border = thin_border
            if is_zebra:
                cell.fill = fill_zebra
            
            # Formatting per column
            if col_idx == 2:  # Sprint
                cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
                cell.font = font_sprint_header
                cell.fill = fill_sprint
            elif col_idx == 3:  # Task ID
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.font = font_data_bold
            elif col_idx == 4:  # Module
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif col_idx == 5:  # Feature Name
                cell.alignment = Alignment(horizontal="left", vertical="center")
                cell.font = font_data_bold
            elif col_idx == 6:  # Target User
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif col_idx in (7, 8, 9):  # Description, Value, Criteria
                cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
            elif col_idx == 10:  # Status
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.font = font_status_done
                cell.fill = fill_status_done
        ws2.row_dimensions[row_idx].height = 48

    # Column widths for Sheet 2
    col_widths_ws2 = {
        2: 15,  # Sprint
        3: 13,  # Mã Task
        4: 20,  # Phân Hệ
        5: 32,  # Tên Tính Năng
        6: 22,  # Đối Tượng
        7: 42,  # UX
        8: 38,  # Value
        9: 42,  # Criteria
        10: 16  # Status
    }
    for col, width in col_widths_ws2.items():
        ws2.column_dimensions[get_column_letter(col)].width = width

    # -------------------------------------------------------------
    # SHEET 3: Checklist Nghiệm Thu UAT
    # -------------------------------------------------------------
    ws3 = wb.create_sheet(title="Checklist Nghiệm Thu UAT")
    ws3.views.sheetView[0].showGridLines = True
    ws3.freeze_panes = "C5"

    ws3["B2"] = "KỊCH BẢN KIỂM THỬ TRẢI NGHIỆM NGƯỜI DÙNG (USER ACCEPTANCE TESTING - UAT)"
    ws3["B2"].font = font_title
    ws3["B3"] = "Quy trình 8 bước trải nghiệm thực tế dành cho Học viên, Giảng viên và Tester trước giờ Go-Live"
    ws3["B3"].font = font_subtitle

    uat_headers = [
        "STT", "Hạng Mục Trải Nghiệm", "Màn Hình Thực Hiện", 
        "Các Bước Thao Tác Của Người Dùng", "Kết Quả Mong Đợi (Expected Outcome)", 
        "Kết Quả Thực Tế", "Đánh Giá (UAT)", "Ghi Chú"
    ]

    for col_idx, header in enumerate(uat_headers, start=2):
        cell = ws3.cell(row=4, column=col_idx, value=header)
        cell.font = font_tbl_header
        cell.fill = fill_header
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = header_border
    ws3.row_dimensions[4].height = 28

    uat_scenarios = [
        (1, "Nhận ưu đãi Go-Live", "Trang chủ & Bàn làm việc", 
         "1. Mở trang chủ\n2. Nhìn thấy dải banner màu nổi bật\n3. Bấm nút 'Kích hoạt 14 ngày ngay'", 
         "Hiện thông báo kích hoạt thành công, tài khoản hiển thị huy hiệu VIP PRO và thời hạn 14 ngày.", 
         "Kích hoạt thành công tức thì, tài khoản mở khóa toàn bộ đề thi.", "ĐẠT (PASS)", "Rất tiện lợi, không cần gõ mã"),
        (2, "Đăng ký khóa cấp tốc", "Bàn làm việc (Dashboard)", 
         "1. Bấm vào thẻ 'Lớp khai giảng sắp tới'\n2. Xem tab Lộ trình 12 buổi\n3. Mở tab Đăng ký giữ chỗ và quét QR", 
         "Hiện thông tin lớp T3-5-7 rõ ràng, mã VietQR MB Bank 1.400.000đ tự điền số tiền.", 
         "Quét QR chính xác tên Nguyễn Duy Cương, form lưu số điện thoại mượt mà.", "ĐẠT (PASS)", "Sẵn sàng nhận học viên"),
        (3, "Luyện Nói có từ vựng", "Phòng thi Speaking Part 2 & 3", 
         "1. Chọn một đề thi Nói\n2. Mở Part 2 (Miêu tả tranh)\n3. Quan sát giao diện 2 cột", 
         "Cột trái hiện tranh nét; cột phải hiện bảng gợi ý từ vựng, Collocation ăn điểm B1 & B2+.", 
         "Hai cột hiển thị đẹp mắt, hỗ trợ phản xạ từ vựng rất tốt.", "ĐẠT (PASS)", "Tính năng đắc lực cho học viên"),
        (4, "Bấm giờ phòng thi Nói", "Phòng thi Speaking Part 4", 
         "1. Bấm vào Part 4\n2. Quan sát đồng hồ đếm ngược\n3. Chờ hết 60 giây và nghe âm thanh", 
         "Đồng hồ đếm ngược đúng 60s nháp -> Âm thanh 'bíp' vang lên -> Tự động ghi âm 120s liên tục.", 
         "Chuyển trạng thái chính xác theo giây; trình phát nghe lại mượt mà.", "ĐẠT (PASS)", "Chuẩn 100% British Council"),
        (5, "Bút dạ quang bài Đọc", "Phòng thi Reading Part 3 & 4", 
         "1. Mở bài đọc dài Part 3 hoặc 4\n2. Dùng chuột bôi đen 1 câu văn\n3. Chọn màu Vàng hoặc Xanh", 
         "Menu chọn màu hiện ngay cạnh đoạn văn; chữ được bôi màu chuẩn; bấm xóa màu biến mất.", 
         "Highlight mượt mà, chuyển câu hỏi không bị mất màu.", "ĐẠT (PASS)", "Cực kỳ hữu ích khi tìm dẫn chứng"),
        (6, "Xem lời thoại bài Nghe", "Phòng thi Listening Part 1-4", 
         "1. Làm bài nghe xong\n2. Bấm nút 'Xem Audio Script & Bản dịch'\n3. Đọc kịch bản song ngữ", 
         "Khung kịch bản mở ra hiển thị cột tiếng Anh và cột dịch nghĩa tiếng Việt chi tiết.", 
         "Ẩn lúc thi và mở ra nhanh chóng khi bấm nút; âm thanh rõ tiếng.", "ĐẠT (PASS)", "Giúp học viên hiểu sâu lỗi sai"),
        (7, "Viết 2 bức thư riêng", "Phòng thi Writing Part 4", 
         "1. Mở bài thi Viết Part 4\n2. Gõ vào ô Thư gửi bạn (50 từ)\n3. Gõ vào ô Thư gửi quản lý (150 từ)", 
         "Có 2 ô viết riêng biệt; đồng hồ đếm từ đổi sang màu xanh khi đủ độ dài.", 
         "Không bị lẫn lộn nội dung 2 bức thư; đếm từ chuẩn xác thời gian thực.", "ĐẠT (PASS)", "Giải quyết triệt để lỗi viết nhầm"),
        (8, "Flashcard từ vựng SRS", "Giao diện Học Từ Vựng", 
         "1. Bấm Nạp từ vựng\n2. Dán link Google Sheet của lớp\n3. Lật thẻ học từ 3D và nghe âm thanh", 
         "Nhận diện danh sách từ chuẩn xác; thẻ lật 3D hiển thị nghĩa và phát âm giọng bản ngữ.", 
         "Import nhanh trong 2 giây; thuật toán lưu từ cần ôn rất thông minh.", "ĐẠT (PASS)", "Học sinh rất thích thú")
    ]

    for row_idx, uat in enumerate(uat_scenarios, start=5):
        is_zebra = (row_idx % 2 == 1)
        for col_idx, val in enumerate(uat, start=2):
            cell = ws3.cell(row=row_idx, column=col_idx, value=val)
            cell.font = font_data
            cell.border = thin_border
            if is_zebra:
                cell.fill = fill_zebra
            
            if col_idx == 2:  # STT
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif col_idx in (3, 4):  # Hạng mục, Màn hình
                cell.alignment = Alignment(horizontal="left", vertical="center")
                cell.font = font_data_bold
            elif col_idx in (5, 6, 7):  # Thao tác, Mong đợi, Thực tế
                cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
            elif col_idx == 8:  # Đánh giá
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.font = font_status_done
                cell.fill = fill_status_done
            elif col_idx == 9:  # Ghi chú
                cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
        ws3.row_dimensions[row_idx].height = 44

    # Column widths for Sheet 3
    col_widths_ws3 = {
        2: 8,   # STT
        3: 24,  # Hạng mục
        4: 26,  # Màn hình
        5: 38,  # Các bước
        6: 38,  # Mong đợi
        7: 38,  # Thực tế
        8: 16,  # Đánh giá
        9: 28   # Ghi chú
    }
    for col, width in col_widths_ws3.items():
        ws3.column_dimensions[get_column_letter(col)].width = width

    # Save to target file
    output_path = r"d:\sontayweb\aptis-elearning\docs\Ke_Hoach_Task_Timeline_Nguoi_Dung_Aptis.xlsx"
    wb.save(output_path)
    print(f"Successfully generated: {output_path}")

if __name__ == "__main__":
    create_user_timeline_excel()
