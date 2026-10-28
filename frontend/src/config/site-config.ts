/**
 * SITE_CONFIG — Nguồn Chân Lý Duy Nhất (Single Source of Truth) cho toàn bộ cấu hình dự án Aptis E-Learning.
 * Giúp người quản trị dễ dàng cập nhật thông tin tại 1 nơi duy nhất mà không cần can thiệp sâu vào mã nguồn.
 */
export const SITE_CONFIG = {
  name: "APTIS ESOL PREMIER",
  domain: "aptisesolpremier.com",

  // 1. Kênh liên hệ tư vấn & CSKH
  contact: {
    defaultZaloPhone: "0379866596",
    defaultZaloUrl: "https://zalo.me/0379866596",
    defaultHotline: "0379 866 596",
    secondaryHotline: "0387 905 990",
    defaultEmail: "aptisonthi@gmail.com",
    facebookUrl: "https://zalo.me/0379866596",
    consultantName: "Giảng viên Aptis ESOL",
  },

  // 2. Tài khoản ngân hàng nhận học phí & thanh toán (Cung cấp khi tư vấn trực tiếp)
  bankAccount: {
    bankName: "Liên hệ tư vấn viên",
    accountNumber: "Liên hệ tư vấn",
    accountHolder: "APTIS ESOL PREMIER",
    qrImageUrl: null as string | null,
  },

  // 3. Khóa học Online Aptis ESOL B2 (Cố vấn trực tiếp)
  courseClass: {
    tuitionVnd: 0,
    tuitionFormatted: "Liên hệ tư vấn",
    durationText: "Lộ trình cá nhân hóa",
    scheduleDays: "Thứ 3 – Thứ 5 – Thứ 7",
    scheduleTime: "20:00 – 21:30",
    totalSessions: 11,
    // Để null: hệ thống tự động nhảy lịch đợt gần nhất
    fixedOpeningDate: null as string | null,
  },

  // 4. Link Google Sheet từ vựng mặc định (3 cột: STT, Từ, Nghĩa)
  defaultVocabSheetUrl: "" as string,
} as const;

export type SiteConfig = typeof SITE_CONFIG;
