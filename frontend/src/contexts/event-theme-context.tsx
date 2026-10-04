"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type EventTemplateId = "halloween" | "noel" | "mid_autumn" | "tet" | "custom";

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
  forceEventTheme: boolean; // If true, visitors see event theme by default
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
    forceEventTheme: false,
  },
  noel: {
    activeTemplate: "noel",
    name: "Giáng sinh 🎄",
    icon: "🎄",
    badge: "Mùa an lành",
    description: "Không khí giáng sinh ấm áp với hoa tuyết rơi lấp lánh và thông xanh rực rỡ",
    primaryColor: "#DC2626", // Red-600
    accentColor: "#16A34A", // Emerald-600
    bannerEnabled: true,
    bannerText: "🎄 Giáng sinh an lành — Tặng thêm 15 lượt chấm AI Speaking & Writing cho toàn bộ học viên!",
    bannerLink: "/thi-thu",
    decorationType: "snowflakes",
    forceEventTheme: false,
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
    forceEventTheme: false,
  },
  tet: {
    activeTemplate: "tet",
    name: "Tết Nguyên Đán 🌸",
    icon: "🌸",
    badge: "Xuân như ý",
    description: "Sắc xuân rạng ngời với hoa đào, hoa mai rơi nhẹ và phong bao lì xì may mắn",
    primaryColor: "#E11D48", // Rose-600
    accentColor: "#EAB308", // Yellow-500
    bannerEnabled: true,
    bannerText: "🌸 Khai xuân đắc lộc — Lì xì khóa học và nhân đôi lượt chấm bài thi thử Aptis!",
    bannerLink: "/pricing",
    decorationType: "blossoms",
    forceEventTheme: false,
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
    forceEventTheme: false,
  },
};

const DEFAULT_EVENT_CONFIG: EventThemeConfig = {
  enabled: true, // Default enabled with Halloween for demonstration
  ...PRESET_TEMPLATES.halloween,
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

  // Initialize config and current theme from localStorage
  useEffect(() => {
    setHasMounted(true);
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EVENT_CONFIG));
      }

      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setCurrentThemeState(savedTheme);
        applyThemeToDOM(savedTheme);
      } else if (DEFAULT_EVENT_CONFIG.enabled && DEFAULT_EVENT_CONFIG.forceEventTheme) {
        const eventTheme = DEFAULT_EVENT_CONFIG.activeTemplate;
        setCurrentThemeState(eventTheme);
        applyThemeToDOM(eventTheme);
      }
    } catch (e) {
      console.error("Lỗi khi tải cấu hình sự kiện:", e);
    }

    // Sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setConfig(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        setCurrentThemeState(e.newValue);
        applyThemeToDOM(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const applyThemeToDOM = (themeName: string) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    // Reset old event theme attributes
    root.removeAttribute("data-event-theme");

    if (themeName === "dark") {
      root.classList.add("dark");
    } else if (themeName === "light") {
      root.classList.remove("dark");
    } else {
      // Event theme (halloween, noel, mid_autumn, tet)
      // Most event themes use dark ambient or specialized accents
      root.classList.add("dark");
      root.setAttribute("data-event-theme", themeName);
    }
  };

  const setTheme = (newTheme: string) => {
    setCurrentThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyThemeToDOM(newTheme);
  };

  const updateConfig = (newFields: Partial<EventThemeConfig>) => {
    setConfig((prev) => {
      const updated = {
        ...prev,
        ...newFields,
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Lỗi khi lưu cấu hình sự kiện:", err);
      }
      return updated;
    });
  };

  const applyPreset = (presetId: EventTemplateId) => {
    const preset = PRESET_TEMPLATES[presetId];
    if (!preset) return;
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
    });
  };

  const toggleEvent = (enabled: boolean) => {
    updateConfig({ enabled });
  };

  const isEventActive =
    config.enabled &&
    (currentTheme === config.activeTemplate ||
      (config.forceEventTheme && currentTheme !== "light" && currentTheme !== "dark"));

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
