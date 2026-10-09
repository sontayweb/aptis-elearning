/**
 * SITE_CONFIG — Nguồn Chân Lý Duy Nhất (Single Source of Truth) cho cấu hình giao tiếp Frontend.
 * Đóng vai trò là giá trị Fallback an toàn 100% khi API chưa phản hồi hoặc trong trường hợp mất mạng.
 */
export const SITE_CONFIG = {
  name: "APTIS ESOL PREMIER",
  domain: "aptiskytich.vn",
  contact: {
    // Giá trị chuẩn mực mặc định duy nhất của hệ thống
    defaultZaloPhone: "0379866596",
    defaultZaloUrl: "https://zalo.me/0379866596",
    defaultHotline: "0379 866 596",
    defaultEmail: "aptiskytich.admin@gmail.com",
    facebookUrl: "https://www.facebook.com/Aptiskytich",
    consultantName: "Giảng viên Aptis ESOL",
  },
} as const;

export type SiteConfig = typeof SITE_CONFIG;
