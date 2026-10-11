/**
 * SITE_CONFIG — Nguồn Chân Lý Duy Nhất (Single Source of Truth) cho toàn bộ cấu hình dự án Aptis E-Learning.
 * Giúp người quản trị dễ dàng cập nhật thông tin tại 1 nơi duy nhất mà không cần can thiệp sâu vào mã nguồn.
 */
export const SITE_CONFIG = {
  name: "APTIS ESOL PREMIER",
  domain: "aptiskytich.vn",

  // 1. Kênh liên hệ tư vấn & CSKH
  contact: {
    defaultZaloPhone: "0379866596",
    defaultZaloUrl: "https://zalo.me/0379866596",
    defaultHotline: "0379 866 596",
    secondaryHotline: "0387 905 990",
    defaultEmail: "aptiskytich.admin@gmail.com",
    facebookUrl: "https://www.facebook.com/Aptiskytich",
    consultantName: "Giảng viên Aptis ESOL",
  },

  // 2. Tài khoản ngân hàng nhận học phí & thanh toán
  bankAccount: {
    bankName: "MB Bank (Ngân hàng Quân Đội)",
    accountNumber: "0866950837",
    accountHolder: "APTIS KY TICH",
    // Nếu bạn có ảnh QR thật, lưu vào frontend/public/uploads/bank-qr.png rồi điền "/uploads/bank-qr.png"
    qrImageUrl: null as string | null,
  },

  // 3. Khóa học Online Aptis ESOL B2 (Cố vấn trực tiếp)
  courseClass: {
    tuitionVnd: 1400000,
    tuitionFormatted: "1.400.000đ",
    durationText: "Khóa 11 buổi",
    scheduleDays: "Thứ 3 – Thứ 5 – Thứ 7",
    scheduleTime: "20:00 – 21:30",
    totalSessions: 11,
    // Nếu muốn chốt ngày khai giảng cố định, điền chuỗi "DD/MM" (ví dụ: "20/10").
    // Nếu để null, hệ thống tự động nhảy các ngày Thứ 3 - Thứ 5 - Thứ 7 của tuần kế tiếp (không bao giờ bị lỗi thời).
    fixedOpeningDate: null as string | null,
  },

  // 4. Link Google Sheet từ vựng mặc định (3 cột: STT, Từ, Nghĩa)
  defaultVocabSheetUrl: "" as string,
} as const;

export type SiteConfig = typeof SITE_CONFIG;
