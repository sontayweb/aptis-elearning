"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { api } from "@/lib/api-client";

export type EventTemplateId =
  | "women_day"
  | "teachers_day"
  | "national_day"
  | "back_to_school"
  | "valentine"
  | "halloween"
  | "noel"
  | "mid_autumn"
  | "tet"
  | "custom";
export type EventAppearanceMode = "light" | "dark" | "adaptive";
export type UserThemePreference = "event" | "light" | "dark";

export interface EventThemeConfig {
  enabled: boolean;
  activeTemplate: EventTemplateId;
  name: string;
  icon: string;
  badge: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  bannerEnabled: boolean;
  bannerText: string;
  bannerLink: string;
  decorationType:
    | "roses"
    | "sunflowers"
    | "fireworks"
    | "stars"
    | "hearts"
    | "bat_pumpkin"
    | "snowflakes"
    | "lanterns"
    | "blossoms"
    | "none";
  appearanceMode: EventAppearanceMode; // Chế độ nền mặc định: "light", "dark", "adaptive"
  forceEventTheme: boolean; // Nếu bật: khách truy cập mới mặc định thấy giao diện sự kiện
  updatedAt: string;
}

export const PRESET_TEMPLATES: Record<EventTemplateId, Omit<EventThemeConfig, "enabled" | "updatedAt">> = {
  women_day: {
    activeTemplate: "women_day",
    name: "Phụ nữ Việt Nam 💐",
    icon: "💐",
    badge: "20/10 & 8/3",
    description: "Sắc hoa hồng rạng rỡ, gửi trọn yêu thương và quà tặng tri ân đến một nửa thế giới",
    primaryColor: "#E11D48", // Rose-600
    accentColor: "#F43F5E", // Rose-500
    bannerEnabled: true,
    bannerText: "💐 Mừng Ngày Phụ Nữ Việt Nam 20/10 — Tặng học bổng & nhân đôi lượt chấm AI Speaking/Writing cho toàn bộ học viên nữ!",
    bannerLink: "/pricing",
    decorationType: "roses",
    appearanceMode: "light",
    forceEventTheme: true,
  },
  teachers_day: {
    activeTemplate: "teachers_day",
    name: "Nhà giáo Việt Nam 🎓",
    icon: "🎓",
    badge: "Tri ân 20/11",
    description: "Không khí tri ân ấm áp với hoa hướng dương rực rỡ, cánh phượng vàng và trang sách ước mơ",
    primaryColor: "#D97706", // Amber-600
    accentColor: "#2563EB", // Blue-600
    bannerEnabled: true,
    bannerText: "🎓 Tri ân Thầy Cô 20/11 — Tặng mã giảm 30% gói luyện thi Aptis & tặng ca chữa bài 1:1 cùng giáo viên!",
    bannerLink: "/pricing",
    decorationType: "sunflowers",
    appearanceMode: "light",
    forceEventTheme: true,
  },
  national_day: {
    activeTemplate: "national_day",
    name: "Đại lễ Quốc khánh 🇻🇳",
    icon: "🇻🇳",
    badge: "Mừng Đại Lễ",
    description: "Sắc đỏ sao vàng rực rỡ, pháo hoa chào mừng các ngày lễ lớn của đất nước (30/4, 1/5 & 2/9)",
    primaryColor: "#DC2626", // Red-600
    accentColor: "#EAB308", // Yellow-500
    bannerEnabled: true,
    bannerText: "🇻🇳 Chào mừng Đại lễ Non Sông — Khám phá bộ đề Marathon Aptis đặc biệt nhận quà cực hot!",
    bannerLink: "/thi-thu",
    decorationType: "fireworks",
    appearanceMode: "light",
    forceEventTheme: true,
  },
  back_to_school: {
    activeTemplate: "back_to_school",
    name: "Mùa thi bứt phá 🚀",
    icon: "🚀",
    badge: "Vượt vũ môn",
    description: "Tinh thần quyết tâm đạt B1/B2/C Aptis với năng lượng bùng nổ và lộ trình bứt phá",
    primaryColor: "#4F46E5", // Indigo-600
    accentColor: "#06B6D4", // Cyan-500
    bannerEnabled: true,
    bannerText: "🚀 Cao điểm mùa thi Aptis — Tải ngay bộ Key dự đoán độc quyền & tự tin đạt mục tiêu B1/B2/C!",
    bannerLink: "/key-du-doan",
    decorationType: "stars",
    appearanceMode: "light",
    forceEventTheme: true,
  },
  valentine: {
    activeTemplate: "valentine",
    name: "Valentine 14/2 💖",
    icon: "💖",
    badge: "Mùa yêu thương",
    description: "Không gian ngọt ngào với trái tim bay bổng, socola và combo học chung đôi bạn cùng tiến",
    primaryColor: "#EC4899", // Pink-500
    accentColor: "#BE185D", // Pink-700
    bannerEnabled: true,
    bannerText: "💖 Mùa yêu thương 14/2 — Đăng ký học đôi giảm ngay 50%, cùng nhau chinh phục chứng chỉ Aptis!",
    bannerLink: "/pricing",
    decorationType: "hearts",
    appearanceMode: "light",
    forceEventTheme: true,
  },
  halloween: {
    activeTemplate: "halloween",
    name: "Halloween 🎃",
    icon: "🎃",
    badge: "Lễ hội ma quái",
    description: "Không khí lễ hội huyền bí với bí ngô ma mị và hiệu ứng dơi bay lấp lánh",
    primaryColor: "#EA580C", // Orange-600
    accentColor: "#7C3AED", // Purple-600
    bannerEnabled: true,
    bannerText: "🎃 Lễ hội ma quái Halloween — Khám phá kho đề thi đặc biệt & nhận ngay ưu đãi VIP PRO!",
    bannerLink: "/pricing",
    decorationType: "bat_pumpkin",
    appearanceMode: "dark", // Halloween hợp nền tối
    forceEventTheme: true,
  },
  noel: {
    activeTemplate: "noel",
    name: "Giáng sinh 🎄",
    icon: "🎄",
    badge: "Mùa an lành",
    description: "Không khí giáng sinh ấm áp với hoa tuyết rơi lấp lánh và thông xanh rực rỡ",
    primaryColor: "#16A34A", // Pine Green
    accentColor: "#DC2626", // Holiday Red
    bannerEnabled: true,
    bannerText: "🎄 Giáng sinh an lành — Tặng thêm 15 lượt chấm AI Speaking & Writing cho toàn bộ học viên!",
    bannerLink: "/thi-thu",
    decorationType: "snowflakes",
    appearanceMode: "light", // Nền sáng ấm áp tuyết trắng
    forceEventTheme: true,
  },
  mid_autumn: {
    activeTemplate: "mid_autumn",
    name: "Trung thu 🥮",
    icon: "🥮",
    badge: "Đêm hội trăng rằm",
    description: "Đêm hội trăng rằm lung linh với lồng đèn đỏ và ánh trăng vàng kim rực rỡ",
    primaryColor: "#D97706", // Amber-600
    accentColor: "#B45309", // Amber-700
    bannerEnabled: true,
    bannerText: "🥮 Vui hội Trăng Rằm — Luyện đề Key Aptis rinh ngay quà tặng từ APTIS ESOL PREMIER!",
    bannerLink: "/thi-thu",
    decorationType: "lanterns",
    appearanceMode: "light", // Nền sáng rực rỡ
    forceEventTheme: true,
  },
  tet: {
    activeTemplate: "tet",
    name: "Tết Nguyên Đán 🌸",
    icon: "🌸",
    badge: "Xuân như ý",
    description: "Sắc xuân rạng ngời với hoa đào, hoa mai rơi nhẹ và phong bao lì xì may mắn",
    primaryColor: "#DE1A35", // Crimson Red
    accentColor: "#F59E0B", // Amber Gold
    bannerEnabled: true,
    bannerText: "🌸 Khai xuân đắc lộc — Lì xì khóa học và nhân đôi lượt chấm bài thi thử Aptis!",
    bannerLink: "/pricing",
    decorationType: "blossoms",
    appearanceMode: "light", // Tết tươi sáng trang trọng trên nền trắng
    forceEventTheme: true,
  },
  custom: {
    activeTemplate: "custom",
    name: "Sự kiện đặc biệt ✨",
    icon: "✨",
    badge: "Sự kiện",
    description: "Tùy biến theo chiến dịch truyền thông hoặc đợt thi lớn trong tháng",
    primaryColor: "#2563EB",
    accentColor: "#4F46E5",
    bannerEnabled: true,
    bannerText: "✨ Tuần lễ luyện thi cao điểm — Mở toàn bộ phòng thi thử chuẩn British Council!",
    bannerLink: "/thi-thu",
    decorationType: "none",
    appearanceMode: "light",
    forceEventTheme: true,
  },
};

const DEFAULT_EVENT_CONFIG: EventThemeConfig = {
  enabled: true,
  ...PRESET_TEMPLATES.tet,
  updatedAt: new Date().toISOString(),
};

export const STORAGE_KEY = "system_event_theme_config";
export const USER_THEME_STORAGE_KEY = "user_theme_preference";
export const THEME_STORAGE_KEY = "theme";

interface EventThemeContextType {
  config: EventThemeConfig;
  currentTheme: string;
  userThemePreference: UserThemePreference;
  isEventActive: boolean;
  setTheme: (theme: string) => void;
  setUserThemePreference: (pref: UserThemePreference) => void;
  updateConfig: (newConfig: Partial<EventThemeConfig>) => Promise<void>;
  applyPreset: (presetId: EventTemplateId) => Promise<void>;
  toggleEvent: (enabled: boolean) => Promise<void>;
  refreshConfig: () => Promise<void>;
}

const EventThemeContext = createContext<EventThemeContextType | undefined>(undefined);

export function EventThemeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<EventThemeConfig>(DEFAULT_EVENT_CONFIG);
  const [currentTheme, setCurrentThemeState] = useState<string>("light");
  const [userThemePreference, setUserThemePreferenceState] = useState<UserThemePreference>("event");
  const [hasMounted, setHasMounted] = useState(false);

  /**
   * Áp dụng giao diện vào thẻ <html>:
   * - Nếu themeName là "light": Bỏ data-event-theme, bỏ .dark
   * - Nếu themeName là "dark": Bỏ data-event-theme, thêm .dark
   * - Nếu themeName là eventTemplate: Gán data-event-theme, dark theo appearanceMode
   */
  const applyThemeToDOM = useCallback((themeName: string, activeCfg: EventThemeConfig) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    // Reset old event theme attribute
    root.removeAttribute("data-event-theme");

    // Trường hợp 1: Người dùng chủ động chọn "Sáng"
    if (themeName === "light") {
      root.classList.remove("dark");
      return;
    }

    // Trường hợp 2: Người dùng chủ động chọn "Tối"
    if (themeName === "dark") {
      root.classList.add("dark");
      return;
    }

    // Trường hợp 3: Chế độ sự kiện (Tết, Noel, Halloween, Trung thu...)
    if (activeCfg.enabled) {
      const eventTemplate = activeCfg.activeTemplate || "tet";
      root.setAttribute("data-event-theme", eventTemplate);

      const mode = activeCfg.appearanceMode || "light";
      if (mode === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    } else {
      // Sự kiện tắt: Mặc định nền sáng thương hiệu
      root.classList.remove("dark");
    }
  }, []);

  // Tải cấu hình từ API backend (Chuẩn Single Source of Truth)
  const fetchRemoteConfig = useCallback(async () => {
    try {
      const res = await api.settings.getPublic();
      if (res?.success && res?.data?.eventThemeConfig) {
        const remoteCfg: EventThemeConfig = {
          ...DEFAULT_EVENT_CONFIG,
          ...res.data.eventThemeConfig,
        };
        setConfig(remoteCfg);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteCfg));
        } catch {}

        // Kiểm tra xem User hiện tại có đang bật chế độ event không
        const savedPref = localStorage.getItem(USER_THEME_STORAGE_KEY);
        if (savedPref === "event" || (!savedPref && remoteCfg.enabled)) {
          if (remoteCfg.enabled) {
            setCurrentThemeState(remoteCfg.activeTemplate);
            applyThemeToDOM(remoteCfg.activeTemplate, remoteCfg);
          } else {
            setCurrentThemeState("light");
            applyThemeToDOM("light", remoteCfg);
          }
        }
      }
    } catch (err) {
      console.warn("Dùng cấu hình sự kiện từ cache cục bộ:", err);
    }
  }, [applyThemeToDOM]);

  // Khởi tạo trạng thái khi mount (giữ nguyên tuyệt đối lựa chọn Sáng/Tối của user)
  useEffect(() => {
    setHasMounted(true);

    // 1. Đọc cache cấu hình sự kiện hệ thống
    let activeConfig = DEFAULT_EVENT_CONFIG;
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        activeConfig = { ...DEFAULT_EVENT_CONFIG, ...JSON.parse(savedConfig) };
        setConfig(activeConfig);
      }
    } catch (e) {
      console.warn("Lỗi đọc cache cấu hình sự kiện:", e);
    }

    // 2. Xác định tùy chọn giao diện của User (User Preference Hierarchy)
    // Ưu tiên đọc key mới USER_THEME_STORAGE_KEY, fallback sang THEME_STORAGE_KEY cũ
    const savedUserPref = localStorage.getItem(USER_THEME_STORAGE_KEY) || localStorage.getItem(THEME_STORAGE_KEY);

    let resolvedPref: UserThemePreference;
    let resolvedTheme: string;

    if (savedUserPref === "light") {
      // User đã chủ động chọn "Sáng" -> Tôn trọng tuyệt đối, KHÔNG đè!
      resolvedPref = "light";
      resolvedTheme = "light";
    } else if (savedUserPref === "dark") {
      // User đã chủ động chọn "Tối" -> Tôn trọng tuyệt đối, KHÔNG đè!
      resolvedPref = "dark";
      resolvedTheme = "dark";
    } else if (savedUserPref === "event" || (savedUserPref && PRESET_TEMPLATES[savedUserPref as EventTemplateId])) {
      // User muốn xem theme sự kiện
      resolvedPref = "event";
      resolvedTheme = activeConfig.enabled ? activeConfig.activeTemplate : "light";
    } else {
      // Khách mới lần đầu truy cập: Nếu có event thì bật event, không thì light
      if (activeConfig.enabled) {
        resolvedPref = "event";
        resolvedTheme = activeConfig.activeTemplate;
      } else {
        resolvedPref = "light";
        resolvedTheme = "light";
      }
    }

    setUserThemePreferenceState(resolvedPref);
    setCurrentThemeState(resolvedTheme);
    applyThemeToDOM(resolvedTheme, activeConfig);

    // 3. Tải cấu hình mới nhất từ Backend
    fetchRemoteConfig();

    // 4. Đồng bộ sự kiện đổi theme giữa các tab trình duyệt
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USER_THEME_STORAGE_KEY && e.newValue) {
        const newPref = e.newValue as UserThemePreference;
        setUserThemePreferenceState(newPref);
        if (newPref === "light" || newPref === "dark") {
          setCurrentThemeState(newPref);
          applyThemeToDOM(newPref, activeConfig);
        } else {
          const themeName = activeConfig.enabled ? activeConfig.activeTemplate : "light";
          setCurrentThemeState(themeName);
          applyThemeToDOM(themeName, activeConfig);
        }
      }
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setConfig(parsed);
          const currentPref = localStorage.getItem(USER_THEME_STORAGE_KEY);
          if (currentPref === "event" || (!currentPref && parsed.enabled)) {
            const themeName = parsed.enabled ? parsed.activeTemplate : "light";
            setCurrentThemeState(themeName);
            applyThemeToDOM(themeName, parsed);
          }
        } catch {}
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [applyThemeToDOM, fetchRemoteConfig]);

  /**
   * Chuyển đổi giao diện bởi người dùng:
   * - "light" -> Nền sáng
   * - "dark" -> Nền tối
   * - "event" hoặc templateId (tet, noel, halloween...) -> Theme sự kiện
   */
  const setTheme = (newTheme: string) => {
    let pref: UserThemePreference;
    let themeToApply: string;

    if (newTheme === "light") {
      pref = "light";
      themeToApply = "light";
    } else if (newTheme === "dark") {
      pref = "dark";
      themeToApply = "dark";
    } else {
      pref = "event";
      themeToApply = config.enabled ? config.activeTemplate : "light";
    }

    setUserThemePreferenceState(pref);
    setCurrentThemeState(themeToApply);

    try {
      localStorage.setItem(USER_THEME_STORAGE_KEY, pref);
      localStorage.setItem(THEME_STORAGE_KEY, themeToApply);
    } catch {}

    applyThemeToDOM(themeToApply, config);
  };

  const setUserThemePreference = (pref: UserThemePreference) => {
    setTheme(pref);
  };

  /**
   * Admin cập nhật cấu hình:
   * 1. Cập nhật state nội bộ ngay lập tức
   * 2. Lưu cache localStorage để tránh chớp giật
   * 3. Gửi API lưu vào CSDL backend (PostgreSQL) cho toàn bộ học viên
   */
  const updateConfig = async (newFields: Partial<EventThemeConfig>) => {
    const updated: EventThemeConfig = {
      ...config,
      ...newFields,
      updatedAt: new Date().toISOString(),
    };

    setConfig(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Lỗi khi lưu cache cấu hình sự kiện:", err);
    }

    // Nếu người dùng hiện tại đang bật event, cập nhật DOM ngay
    const currentPref = localStorage.getItem(USER_THEME_STORAGE_KEY);
    if (currentPref === "event" || (!currentPref && updated.enabled)) {
      const effectiveTheme = updated.enabled ? updated.activeTemplate : "light";
      setCurrentThemeState(effectiveTheme);
      applyThemeToDOM(effectiveTheme, updated);
    }

    // Gửi API cập nhật CSDL Backend
    try {
      await api.settings.update({
        settings: [
          {
            key: "SYSTEM_EVENT_THEME_CONFIG",
            value: JSON.stringify(updated),
            description: "Cấu hình giao diện và banner sự kiện toàn hệ thống (Tết, Noel, Halloween, Custom)",
          },
        ],
      });
    } catch (err) {
      console.error("Lỗi khi lưu cấu hình sự kiện lên server:", err);
    }
  };

  const applyPreset = async (presetId: EventTemplateId) => {
    const preset = PRESET_TEMPLATES[presetId];
    if (!preset) return;

    // Khi admin áp dụng preset, đồng thời kích hoạt hiển thị event trên máy admin
    localStorage.setItem(USER_THEME_STORAGE_KEY, "event");
    localStorage.setItem(THEME_STORAGE_KEY, presetId);
    setUserThemePreferenceState("event");
    setCurrentThemeState(presetId);

    await updateConfig({
      activeTemplate: presetId,
      name: preset.name,
      icon: preset.icon,
      badge: preset.badge,
      description: preset.description,
      primaryColor: preset.primaryColor,
      accentColor: preset.accentColor,
      bannerEnabled: preset.bannerEnabled,
      bannerText: preset.bannerText,
      bannerLink: preset.bannerLink,
      decorationType: preset.decorationType,
      appearanceMode: preset.appearanceMode,
      forceEventTheme: preset.forceEventTheme,
    });
  };

  const toggleEvent = async (enabled: boolean) => {
    await updateConfig({ enabled });
  };

  const isEventActive = config.enabled;

  return (
    <EventThemeContext.Provider
      value={{
        config,
        currentTheme,
        userThemePreference,
        isEventActive,
        setTheme,
        setUserThemePreference,
        updateConfig,
        applyPreset,
        toggleEvent,
        refreshConfig: fetchRemoteConfig,
      }}
    >
      {children}
    </EventThemeContext.Provider>
  );
}

export function useEventTheme() {
  const context = useContext(EventThemeContext);
  if (!context) {
    throw new Error("useEventTheme must be used within an EventThemeProvider");
  }
  return context;
}

