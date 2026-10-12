# -*- coding: utf-8 -*-
"""
Tạo file Excel đơn giản, gọn gàng, bình thường:
Danh sách Task theo góc nhìn Người dùng (User Features & Experience)
Thời gian: Trong 2 tuần - Trạng thái: Đã hoàn thành (100%)
"""

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def generate_simple_user_excel(filename):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Task User (Đã Hoàn Thành)"
    ws.views.sheetView[0].showGridLines = True

    # Định dạng font cơ bản, chuẩn văn phòng
    f_title = Font(name="Calibri", size=15, bold=True, color="1F497D")
    f_subtitle = Font(name="Calibri", size=11, italic=True, color="595959")
    f_header = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    f_data = Font(name="Calibri", size=10, color="000000")
    f_bold = Font(name="Calibri", size=10, bold=True, color="000000")
    f_status = Font(name="Calibri", size=10, bold=True, color="006100")

    fill_header = PatternFill(start_color="2F5597", end_color="2F5597", fill_type="solid")
    fill_zebra = PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid")
    fill_status = PatternFill(start_color="C6EFCE", end_color="C6EFCE", fill_type="solid")

    thin_border = Border(
        left=Side(style='thin', color='D9D9D9'),
        right=Side(style='thin', color='D9D9D9'),
        top=Side(style='thin', color='D9D9D9'),
        bottom=Side(style='thin', color='D9D9D9')
    )

    # Tiêu đề bảng tính
    ws["A1"] = "BẢNG TỔNG HỢP CÁC TÍNH NĂNG & TASK THEO TRẢI NGHIỆM NGƯỜI DÙNG"
    ws["A1"].font = f_title
    ws["A2"] = "Hệ thống Luyện thi Aptis Kỳ Tích — Thời gian thực hiện: Trong 2 tuần — Trạng thái: Đã hoàn thành 100%"
    ws["A2"].font = f_subtitle

    # Tiêu đề các cột
    headers = [
        "STT", 
        "Phân Hệ / Kỹ Năng", 
        "Tên Tính Năng Người Dùng", 
        "Mô Tả Trải Nghiệm & Thao Tác Của User", 
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

    # 31 Task chuẩn từ tài liệu, diễn giải 100% theo góc nhìn người dùng
    tasks = [
        # Nhóm Tuần 1
        (1, "Go-Live & Quà Tặng", "Nhận mã VIP Pro 14 ngày miễn phí",
         "Học viên vào web nhận ngay gói trải nghiệm VIP 14 ngày, mở khóa toàn bộ 860+ bộ đề thi và lượt AI chấm điểm mà không tốn phí.",
         "Trải nghiệm đầy đủ tính năng trước khi quyết định đăng ký khóa học.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (2, "Go-Live & Quà Tặng", "Banner 1-Click kích hoạt VIP",
         "Dải banner màu nổi bật trên đầu trang chủ và bàn làm việc; bấm 1 chạm là tự động nâng cấp VIP hoặc copy mã gửi bạn bè.",
         "Thao tác cực nhanh, không cần nhớ mã hay nhập tay trên điện thoại.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (3, "Bàn Làm Việc", "Bảng vinh danh học viên & Feedback FB",
         "Xem danh sách học viên điểm cao (Overall 158-185/200, B2-C1) kèm ảnh bài viết Facebook và chứng chỉ thật.",
         "Tăng sự tin tưởng và tạo động lực học tập cho học viên mới.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (4, "Lịch Khai Giảng", "Tra cứu lịch khai giảng lớp học mới",
         "Xem lịch học các lớp Zoom buổi tối 3-5-7 từ 20h00 - 21h30, chu kỳ định kỳ 10 ngày mở một lớp mới.",
         "Học viên chủ động chọn thời gian học tập phù hợp với lịch cá nhân.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (5, "Lịch Khai Giảng", "Xem chi tiết lộ trình 12 buổi học",
         "Bấm vào thẻ lớp học để xem nội dung từng buổi từ kỹ năng Nói P1-P4, Viết thư đến Tổng ôn đề sát giờ thi.",
         "Nắm rõ toàn bộ khối lượng kiến thức được trang bị trong 4 tuần.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (6, "Lịch Khai Giảng", "Học phí ưu đãi 1.400.000đ & VietQR",
         "Quét mã VietQR MB Bank tự điền số tiền ưu đãi 1.400.000đ và nội dung; hoặc bấm gọi Hotline 0379 866 596 tư vấn 24/7.",
         "Giữ chỗ nhanh trong 30 giây, chuyển khoản chính xác không sợ nhầm STK.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (7, "Kỹ Năng Speaking", "Hướng dẫn format & chiến lược phòng thi",
         "Bấm nút hướng dẫn ở đầu bài để xem cấu trúc 4 phần, tiêu chí chấm và phân bổ thời gian hợp lý.",
         "Không bị bỡ ngỡ phòng thi, nắm chắc bí quyết trả lời điểm cao.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (8, "Kỹ Năng Speaking", "Luyện phản xạ Part 1 đa chủ đề",
         "Luyện trả lời 3 câu hỏi liên hoàn theo các chủ đề quen thuộc (Gia đình, Thời tiết, Công việc...) kèm đồng hồ 30 giây mỗi câu.",
         "Tăng tốc độ phản xạ tự nhiên trong 30 giây đầu tiên.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (9, "Kỹ Năng Speaking", "Tranh nét & Bảng từ vựng gợi ý (Part 2 & 3)",
         "Cột trái ảnh thi sắc nét; Cột phải bảng Collocations, từ vựng và câu mẫu gợi ý theo 2 cấp độ B1 & B2+.",
         "Khắc phục triệt để tình trạng 'bí từ' khi miêu tả tranh, kéo điểm lên B2.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (10, "Kỹ Năng Speaking", "Đồng hồ chuẩn phòng thi Part 4",
         "Đúng chuẩn British Council: 60 giây suy nghĩ/nháp -> Tiếng bíp tự động -> 120 giây (2 phút) ghi âm liền mạch.",
         "Rèn luyện thói quen làm bài dưới áp lực thời gian của kỳ thi thật.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (11, "Kỹ Năng Speaking", "Nhận biết đề thi Nói Hot (Huy hiệu 🔥)",
         "Các bức tranh và chủ đề hay gặp trong các đợt thi gần nhất được gắn biểu tượng 🔥 và số sao dự đoán.",
         "Học viên ưu tiên ôn luyện trước những đề có khả năng thi trúng tủ.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (12, "Kỹ Năng Speaking", "Nghe lại bài nói & Nhận xét từ AI",
         "Trình phát âm thanh bài thu của học viên mượt mà, tua tiến lùi chuẩn xác; AI trả điểm chi tiết theo 4 tiêu chí CEFR.",
         "Học viên tự nghe lại phát âm và nhận lời khuyên sửa lỗi tức thì.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (13, "Kỹ Năng Reading", "Cẩm nang làm bài Đọc hiểu 4 phần",
         "Xem hướng dẫn phân bổ thời gian (P1: 5p, P2: 7p, P3: 10p, P4: 13p) và kỹ năng Skim/Scan trước khi làm bài.",
         "Tránh sa đà dịch từng chữ, kiểm soát tốt 35 phút làm bài đọc.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (14, "Kỹ Năng Reading", "Luyện sắp xếp câu chuyện Part 2",
         "Mỗi câu chuyện là một đề bài độc lập, tiêu đề riêng biệt, không bị lẫn lộn giữa các bài đọc.",
         "Rèn luyện tư duy logic liên kết câu văn (coherence & cohesion).",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (15, "Kỹ Năng Reading", "Bút dạ quang (Highlight) bài đọc dài",
         "Bôi đen chữ hiện menu chọn màu Vàng (dẫn chứng), Xanh (từ khóa) hoặc Xóa màu trực tiếp trên đoạn văn.",
         "Định vị tức thì câu chứa đáp án mà không phải đọc đi đọc lại nhiều lần.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (16, "Kỹ Năng Reading", "7 đoạn văn dài nối tiêu đề Part 4",
         "Đọc trọn vẹn 7 đoạn văn học thuật và chọn tiêu đề tóm tắt tương ứng qua hộp chọn trực quan.",
         "Nâng cao năng lực đọc hiểu ý chính của bài đọc học thuật dài.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (17, "Kỹ Năng Reading", "Bộ đề Đọc hiểu ưu tiên theo độ Hot",
         "Các bài đọc hay gặp được gắn huy hiệu ngọn lửa 🔥 và tự động đưa lên đầu danh sách đề thi.",
         "Tiết kiệm thời gian tìm kiếm, ôn đúng trọng tâm sát ngày thi.",
         "Tuần 1 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        # Nhóm Tuần 2
        (18, "Kỹ Năng Listening", "Quy tắc và bẫy đề thi Nghe hiểu",
         "Xem hướng dẫn phân loại câu hỏi (thông tin ngắn, quan điểm, đối thoại) và bẫy phát âm thường gặp.",
         "Tăng khả năng bắt từ khóa và loại trừ đáp án nhiễu.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (19, "Kỹ Năng Listening", "Nghe âm thanh chuẩn giọng Anh - Anh",
         "100% câu hỏi đều có âm thanh giọng bản ngữ rõ ràng, đúng format nghe tối đa 2 lần theo luật thi.",
         "Rèn luyện thói quen tập trung nghe như trong kỳ thi thật.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (20, "Kỹ Năng Listening", "Đầy đủ audio bài nghe Part 2, 3, 4",
         "Toàn bộ các phần nghe Part 2, 3, 4 đều có giọng đọc chuẩn, chạy mượt mà không bị gián đoạn.",
         "Học viên được luyện tập trọn vẹn đề thi nghe mà không bị thiếu câu nào.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (21, "Kỹ Năng Listening", "Xem lời thoại (Script) & Bản dịch tiếng Việt",
         "Sau khi làm bài xong, bấm nút 'Xem Audio Script' để mở khung kịch bản song ngữ Anh - Việt đối chiếu.",
         "Hiểu cặn kẽ tại sao mình nghe sai, học thêm từ vựng mới từ bài nghe.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (22, "Kỹ Năng Listening", "Bảng chuyển câu theo từng phần gọn gàng",
         "Thanh số câu hỏi dưới chân trang chỉ hiển thị các câu của phần đang làm (Part 1 chỉ hiện câu 1–13).",
         "Trực quan, tập trung làm đúng phần đang thi mà không bị cuộn trang quá dài.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (23, "Kỹ Năng Writing", "Cẩm nang viết bài đạt điểm B2/C",
         "Nắm rõ tiêu chí chấm ngữ pháp, từ vựng và bố cục bài viết 50 phút của kỳ thi Aptis.",
         "Viết đúng trọng tâm, tránh bị lạc đề hay sai phong cách viết.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (24, "Kỹ Năng Writing", "Luyện viết theo bối cảnh Câu lạc bộ",
         "Điền đơn gia nhập CLB (Part 2: 20-30 từ) và chat với 3 thành viên CLB (Part 3: 30-40 từ) theo tình huống thực tế.",
         "Rèn luyện khả năng dùng từ tự nhiên trong đời sống sinh hoạt.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (25, "Kỹ Năng Writing", "Tách đôi 2 bài viết thư & Đếm số từ (Part 4)",
         "Tách 2 ô viết riêng: Thư gửi bạn thân (50 từ, thân mật) & Thư gửi quản lý CLB (150 từ, trang trọng) kèm bộ đếm từ đổi màu.",
         "Không bị nhầm lẫn giữa 2 văn phong đối lập, kiểm soát đúng độ dài bài viết.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (26, "Từ Vựng Aptis SRS", "Nạp từ vựng từ link Google Sheet",
         "Chỉ cần dán link Google Sheet bài học của lớp vào web là hệ thống tự nhận diện từ, nghĩa và chủ đề.",
         "Giáo viên và học viên cập nhật danh sách từ mới cực nhanh trong 2 giây.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (27, "Từ Vựng Aptis SRS", "Thẻ Flashcard lật 3D kèm âm thanh",
         "Thẻ học lật mặt trước (từ + phát âm) và mặt sau (nghĩa + ví dụ); tự động nhắc ôn lại các từ hay quên.",
         "Ghi nhớ từ vựng lâu gấp 3 lần qua hình ảnh và âm thanh.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (28, "Quản Trị & Vận Hành", "Ưu tiên đề thi Hot lên đầu",
         "Các bộ đề thi thử tổng hợp 4 kỹ năng có xác suất trúng tủ cao được ưu tiên hiển thị ngay đầu trang.",
         "Ôn tập cấp tốc đạt hiệu quả cao nhất sát ngày thi.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (29, "Quản Trị & Vận Hành", "Bảng hướng dẫn quản trị mượt mà",
         "Bảng hướng dẫn trong trang quản trị tự động né mép màn hình, không bị che khuất nút thao tác của thầy cô.",
         "Thầy cô quản lý lớp học và đề thi dễ dàng, thuận tiện.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (30, "Quản Trị & Vận Hành", "Nhật ký gửi email thông báo học tập",
         "Quản trị viên xem được danh sách email báo kết quả thi và email kích hoạt tài khoản gửi đến học viên.",
         "Đảm bảo 100% học viên nhận được thông báo học tập đầy đủ.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT"),

        (31, "Quản Trị & Vận Hành", "Bảo vệ an toàn dữ liệu đề thi & bài làm",
         "Toàn bộ 1,724+ bộ đề thi và lịch sử làm bài của học viên luôn được giữ an toàn tuyệt đối khi nâng cấp tính năng.",
         "Học viên yên tâm làm bài không lo mất dữ liệu hay gián đoạn hệ thống.",
         "Tuần 2 (Trong 2 tuần)", "Đã hoàn thành", "ĐẠT")
    ]

    for row_idx, item in enumerate(tasks, start=5):
        is_zebra = (row_idx % 2 == 1)
        for col_idx, val in enumerate(item, start=1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.font = f_data
            cell.border = thin_border
            if is_zebra:
                cell.fill = fill_zebra
            
            # Canh lề từng cột
            if col_idx == 1:  # STT
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif col_idx == 2:  # Phân hệ
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.font = f_bold
            elif col_idx == 3:  # Tên tính năng
                cell.alignment = Alignment(horizontal="left", vertical="center")
                cell.font = f_bold
            elif col_idx in (4, 5):  # Mô tả & Lợi ích
                cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
            elif col_idx == 6:  # Thời gian
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif col_idx == 7:  # Trạng thái
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.font = f_status
                cell.fill = fill_status
            elif col_idx == 8:  # Nghiệm thu
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.font = f_status
                cell.fill = fill_status
                
        ws.row_dimensions[row_idx].height = 36

    # Độ rộng cột tiêu chuẩn, dễ nhìn trên mọi màn hình
    col_widths = {
        1: 6,   # STT
        2: 22,  # Phân hệ
        3: 32,  # Tên tính năng
        4: 48,  # Mô tả trải nghiệm
        5: 42,  # Lợi ích
        6: 22,  # Thời gian
        7: 18,  # Trạng thái
        8: 14   # Nghiệm thu
    }
    for col, width in col_widths.items():
        ws.column_dimensions[get_column_letter(col)].width = width

    # Cố định dòng tiêu đề
    ws.freeze_panes = "D5"

    wb.save(filename)
    print(f"Generated successfully: {filename}")

if __name__ == "__main__":
    # Lưu vào file mới không bị lock
    generate_simple_user_excel(r"d:\sontayweb\aptis-elearning\docs\Bao_Cao_Task_User_Hoan_Thanh.xlsx")
    generate_simple_user_excel(r"d:\sontayweb\aptis-elearning\docs\Danh_Sach_Task_User_Aptis.xlsx")
