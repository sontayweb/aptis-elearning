"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type EventTemplateId = "halloween" | "noel" | "mid_autumn" | "tet" | "custom";
export type EventAppearanceMode = "light" | "dark" | "adaptive";

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
  decorationType: "bat_pumpkin" | "snowflakes" | "lanterns" | "blossoms" | "none";
  appearanceMode: EventAppearanceMode; // Chế độ nền mặc định: "light" (Nền sáng thanh lịch), "dark" (Nền tối huyền bí), "adaptive" (Theo tùy chọn người dùng)
  forceEventTheme: boolean; // Nếu bật: khách truy cập mặc định thấy giao diện sự kiện
  updatedAt: string;
}

export const PRESET_TEMPLATES: Record<EventTemplateId, Omit<EventThemeConfig, "enabled" | "updatedAt">> = {
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
    appearanceMode: "light", // Tết tươi sáng trang trọng trên nền trắng, KHÔNG bị tối đen
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

interface EventThemeContextType {
  config: EventThemeConfig;
  currentTheme: string;
  isEventActive: boolean;
  setTheme: (theme: string) => void;
  updateConfig: (newConfig: Partial<EventThemeConfig>) => void;
  applyPreset: (presetId: EventTemplateId) => void;
  toggleEvent: (enabled: boolean) => void;
}

const EventThemeContext = createContext<EventThemeContextType | undefined>(undefined);

const STORAGE_KEY = "system_event_theme_config";
const THEME_STORAGE_KEY = "theme";

export function EventThemeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<EventThemeConfig>(DEFAULT_EVENT_CONFIG);
  const [currentTheme, setCurrentThemeState] = useState<string>("light");
  const [hasMounted, setHasMounted] = useState(false);

  const applyThemeToDOM = (themeName: string, eventConfig?: EventThemeConfig) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const activeCfg = eventConfig || config;

    // Reset old event theme attribute
    root.removeAttribute("data-event-theme");

    if (activeCfg.enabled) {
      // Event is globally enabled: always bind data-event-theme to activeTemplate
      const eventTemplate = activeCfg.activeTemplate || "tet";
      root.setAttribute("data-event-theme", eventTemplate);

      // Handle dark/light mode
      if (themeName === "dark") {
        root.classList.add("dark");
      } else if (themeName === "light") {
        root.classList.remove("dark");
      } else {
        const mode = activeCfg.appearanceMode || "light";
        if (mode === "dark") {
          root.classList.add("dark");
        } else if (mode === "light") {
          root.classList.remove("dark");
        } else {
          const savedBase = localStorage.getItem("theme");
          if (savedBase === "dark") {
            root.classList.add("dark");
          } else {
            root.classList.remove("dark");
          }
        }
      }
    } else {
      // Event disabled: standard light/dark brand
      if (themeName === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  // Initialize config and current theme from localStorage
  useEffect(() => {
    setHasMounted(true);
    let loadedConfig = DEFAULT_EVENT_CONFIG;
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        loadedConfig = { ...DEFAULT_EVENT_CONFIG, ...JSON.parse(savedConfig) };
        setConfig(loadedConfig);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EVENT_CONFIG));
      }

      if (loadedConfig.enabled) {
        const eventTheme = loadedConfig.activeTemplate;
        setCurrentThemeState(eventTheme);
        localStorage.setItem(THEME_STORAGE_KEY, eventTheme);
        applyThemeToDOM(eventTheme, loadedConfig);
      } else {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "light";
        setCurrentThemeState(savedTheme);
        applyThemeToDOM(savedTheme, loadedConfig);
      }
    } catch (e) {
      console.error("Lỗi khi tải cấu hình sự kiện:", e);
    }

    // Sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setConfig(parsed);
          if (parsed.enabled) {
            localStorage.setItem(THEME_STORAGE_KEY, parsed.activeTemplate);
            setCurrentThemeState(parsed.activeTemplate);
            applyThemeToDOM(parsed.activeTemplate, parsed);
          } else {
            applyThemeToDOM("light", parsed);
          }
        } catch { }
      }
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        setCurrentThemeState(e.newValue);
        applyThemeToDOM(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const setTheme = (newTheme: string) => {
    setCurrentThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyThemeToDOM(newTheme, config);
  };

  const updateConfig = (newFields: Partial<EventThemeConfig>) => {
    setConfig((prev) => {
      const updated: EventThemeConfig = {
        ...prev,
        ...newFields,
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Lỗi khi lưu cấu hình sự kiện:", err);
      }

      // Re-apply DOM theme immediately
      if (updated.enabled) {
        localStorage.setItem(THEME_STORAGE_KEY, updated.activeTemplate);
        setCurrentThemeState(updated.activeTemplate);
        applyThemeToDOM(updated.activeTemplate, updated);
      } else {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "light";
        applyThemeToDOM(savedTheme === updated.activeTemplate ? "light" : savedTheme, updated);
      }
      return updated;
    });
  };

  const applyPreset = (presetId: EventTemplateId) => {
    const preset = PRESET_TEMPLATES[presetId];
    if (!preset) return;
    localStorage.setItem(THEME_STORAGE_KEY, presetId);
    setCurrentThemeState(presetId);
    updateConfig({
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

  const toggleEvent = (enabled: boolean) => {
    updateConfig({ enabled });
  };

  // If enabled, the event is active across the system
  const isEventActive = config.enabled;

  return (
    <EventThemeContext.Provider
      value={{
        config,
        currentTheme,
        isEventActive,
        setTheme,
        updateConfig,
        applyPreset,
        toggleEvent,
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
