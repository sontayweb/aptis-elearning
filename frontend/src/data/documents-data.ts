/**
 * ==============================================================================
 * APTIS ESOL PREMIER — HỌC LIỆU & TÀI LIỆU LUYỆN THI (DOCUMENTS DATA)
 * ==============================================================================
 * HƯỚNG DẪN BỔ SUNG TÀI LIỆU HOẶC VIDEO BÀI GIẢNG:
 * 
 * 1. THÊM TÀI LIỆU PDF / EBOOK MỚI:
 *    - Thêm một đối tượng vào mảng `DOCUMENTS_DATA` phía dưới.
 *    - Điền đầy đủ id (duy nhất), title, category ('PDF' | 'EBOOK' | 'HANDBOOK'),
 *      skill ('ALL' | 'SPEAKING' | 'WRITING' | 'READING' | 'LISTENING' | 'GRAMMAR'),
 *      targetBand ('B1' | 'B2' | 'C' | 'ALL'), fileSize (vd: '12.5 MB'),
 *      isVip (true nếu dành riêng cho học viên VIP, false nếu miễn phí),
 *      downloadUrl (đường dẫn tải file PDF thực tế từ Cloud/S3/VPS hoặc Google Drive).
 * 
 * 2. THÊM VIDEO BÀI GIẢNG MỚI:
 *    - Thêm một đối tượng vào mảng `VIDEOS_DATA`.
 *    - `videoEmbedId`: Mã ID video YouTube (ví dụ video https://youtube.com/watch?v=dQw4w9WgXcQ thì id là 'dQw4w9WgXcQ').
 * ==============================================================================
 */

export interface DocumentItem {
  id: string;
  title: string;
  category: "PDF" | "EBOOK" | "HANDBOOK";
  skill: "ALL" | "SPEAKING" | "WRITING" | "READING" | "LISTENING" | "GRAMMAR";
  targetBand: "B1" | "B2" | "C" | "ALL";
  pages: number;
  fileSize: string;
  downloadsCount: number;
  isVip: boolean;
  description: string;
  downloadUrl: string;
}

export interface VideoLesson {
  id: string;
  title: string;
  speaker: string;
  duration: string;
  skill: "SPEAKING" | "WRITING" | "READING" | "LISTENING" | "GRAMMAR";
  targetBand: "B1" | "B2" | "C" | "ALL";
  thumbnailUrl?: string;
  views: number;
  description: string;
  videoEmbedId: string;
}

export const DOCUMENTS_DATA: DocumentItem[] = [
  {
    id: "doc-1",
    title: "Cẩm nang Chiến thuật 4 Kỹ năng Aptis ESOL đạt Band C",
    category: "HANDBOOK",
    skill: "ALL",
    targetBand: "C",
    pages: 128,
    fileSize: "14.2 MB",
    downloadsCount: 3842,
    isVip: false,
    description: "Bộ cẩm nang thực chiến tổng hợp cấu trúc đề, thang điểm CEFR và bí quyết tối ưu thời gian 162 phút của British Council.",
    downloadUrl: "#",
  },
  {
    id: "doc-2",
    title: "Tuyển tập Bộ đề thi thật Aptis ESOL Update Mới Nhất",
    category: "PDF",
    skill: "ALL",
    targetBand: "B2",
    pages: 250,
    fileSize: "28.5 MB",
    downloadsCount: 5120,
    isVip: true,
    description: "Tổng hợp các đề thi thực tế tại các hội đồng BC Hà Nội, TP.HCM & Đà Nẵng kèm lời giải chi tiết và audio transcript.",
    downloadUrl: "#",
  },
  {
    id: "doc-3",
    title: "500 Từ vựng Trọng tâm Aptis B1 - B2 Cốt lõi & Phiên âm IPA",
    category: "EBOOK",
    skill: "GRAMMAR",
    targetBand: "B2",
    pages: 64,
    fileSize: "6.8 MB",
    downloadsCount: 4620,
    isVip: false,
    description: "Kho từ vựng chọn lọc xuất hiện với tần suất cao nhất trong các bài thi Reading, Speaking và Grammar & Vocabulary.",
    downloadUrl: "#",
  },
  {
    id: "doc-4",
    title: "Template Bài viết Writing Part 1 - Part 4 Đạt Chuẩn 50/50",
    category: "PDF",
    skill: "WRITING",
    targetBand: "C",
    pages: 85,
    fileSize: "9.1 MB",
    downloadsCount: 2980,
    isVip: true,
    description: "Mẫu câu ăn điểm cho thư thân mật, thư trang trọng và dàn ý phản hồi group chat mạng xã hội kèm 20 bài mẫu Band C.",
    downloadUrl: "#",
  },
  {
    id: "doc-5",
    title: "Trọn bộ 9 Câu hỏi & Câu trả lời Mẫu Speaking Band C",
    category: "PDF",
    skill: "SPEAKING",
    targetBand: "C",
    pages: 92,
    fileSize: "11.4 MB",
    downloadsCount: 3410,
    isVip: true,
    description: "Hướng dẫn miêu tả tranh, so sánh đối chiếu và thuyết trình 2 phút Part 4 với các cấu trúc câu nâng cao và idiom tự nhiên.",
    downloadUrl: "#",
  },
  {
    id: "doc-6",
    title: "Tổng hợp 25 Chủ điểm Ngữ pháp Bắt buộc trong Kỳ thi Aptis",
    category: "HANDBOOK",
    skill: "GRAMMAR",
    targetBand: "B1",
    pages: 78,
    fileSize: "7.5 MB",
    downloadsCount: 4100,
    isVip: false,
    description: "Hệ thống hóa toàn bộ thì động từ, câu điều kiện, mệnh đề quan hệ và đảo ngữ thường gặp trong 25 câu ngữ pháp đầu tiên.",
    downloadUrl: "#",
  },
];

export const VIDEOS_DATA: VideoLesson[] = [
  {
    id: "vid-1",
    title: "Chiến thuật chinh phục Speaking Part 1 - 4 đạt Band C cấp tốc",
    speaker: "Giảng viên Chuyên môn Aptis (Band C1)",
    duration: "28:45",
    skill: "SPEAKING",
    targetBand: "C",
    views: 8920,
    description: "Bí quyết tận dụng 1 phút chuẩn bị Part 4, mở rộng vốn từ vựng miêu tả cảm xúc tranh Part 2 & 3 và phản xạ câu hỏi Part 1.",
    videoEmbedId: "dQw4w9WgXcQ",
  },
  {
    id: "vid-2",
    title: "Giải đề Writing mẫu: Thư trang trọng Part 4 đạt 140 từ trong 20 phút",
    speaker: "Tổ bộ môn Học vụ Aptis",
    duration: "32:10",
    skill: "WRITING",
    targetBand: "B2",
    views: 6540,
    description: "Hướng dẫn phân tích đề bài, lập dàn ý 3 đoạn chuẩn format British Council và các mẫu câu liên kết điểm cao.",
    videoEmbedId: "dQw4w9WgXcQ",
  },
  {
    id: "vid-3",
    title: "Mẹo bắt Keyword Listening Part 1 & Bẫy thông tin đối lập Part 3",
    speaker: "Giảng viên Khảo thí",
    duration: "24:18",
    skill: "LISTENING",
    targetBand: "B2",
    views: 7410,
    description: "Cách nhận biết các liên từ chuyển ý (However, In contrast, Actually) và kỹ thuật ghi chú nhanh không bị lỡ audio.",
    videoEmbedId: "dQw4w9WgXcQ",
  },
  {
    id: "vid-4",
    title: "Tuyệt chiêu làm bài Đọc nối tiêu đề Part 4 không cần đọc hết bài",
    speaker: "Ban Cố vấn Học thuật",
    duration: "21:50",
    skill: "READING",
    targetBand: "C",
    views: 5890,
    description: "Phương pháp Skimming & Scanning định vị câu chủ đề của từng đoạn văn ngắn, tiết kiệm 10 phút làm bài thi thật.",
    videoEmbedId: "dQw4w9WgXcQ",
  },
];
