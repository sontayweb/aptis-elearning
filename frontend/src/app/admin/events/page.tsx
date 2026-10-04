"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  useEventTheme,
  PRESET_TEMPLATES,
  EventTemplateId,
} from "@/contexts/event-theme-context";
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Eye,
  Save,
  Check,
  Palette,
  Sun,
  Moon,
  Gift,
  User,
  LogOut,
  ExternalLink,
  Flame,
  TreePine,
  PartyPopper,
  Layers,
  Radio,
  Sliders,
} from "lucide-react";

export default function AdminEventsPage() {
  const { config, updateConfig, applyPreset, toggleEvent, currentTheme, setTheme } = useEventTheme();

  // Local form state for editing before saving
  const [formData, setFormData] = useState({
    activeTemplate: config.activeTemplate,
    name: config.name,
    icon: config.icon,
    badge: config.badge,
    description: config.description,
    primaryColor: config.primaryColor,
    accentColor: config.accentColor,
    bannerEnabled: config.bannerEnabled,
    bannerText: config.bannerText,
    bannerLink: config.bannerLink,
    decorationType: config.decorationType,
    appearanceMode: config.appearanceMode || "light",
    forceEventTheme: config.forceEventTheme,
  });

  // Sync formData whenever config updates in context
  useEffect(() => {
    setFormData({
      activeTemplate: config.activeTemplate,
      name: config.name,
      icon: config.icon,
      badge: config.badge,
      description: config.description,
      primaryColor: config.primaryColor,
      accentColor: config.accentColor,
      bannerEnabled: config.bannerEnabled,
      bannerText: config.bannerText,
      bannerLink: config.bannerLink,
      decorationType: config.decorationType,
      appearanceMode: config.appearanceMode || "light",
      forceEventTheme: config.forceEventTheme,
    });
  }, [config]);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"templates" | "custom">("templates");

  const handleApplyPreset = (presetKey: EventTemplateId) => {
    applyPreset(presetKey);
    const preset = PRESET_TEMPLATES[presetKey];
    setFormData({
      activeTemplate: presetKey,
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
      appearanceMode: preset.appearanceMode || "light",
      forceEventTheme: preset.forceEventTheme,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSave = () => {
    updateConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const presetsList: Array<{ key: EventTemplateId; title: string; emoji: string; color: string; desc: string }> = [
    {
      key: "halloween",
      title: "Halloween",
      emoji: "🎃",
      color: "from-orange-500 to-purple-600",
      desc: "Lễ hội ma quái với bí ngô, dơi bay và mạng nhện",
    },
    {
      key: "noel",
      title: "Giáng sinh (Noel)",
      emoji: "🎄",
      color: "from-red-600 to-emerald-600",
      desc: "Không khí giáng sinh an lành với hoa tuyết rơi lấp lánh",
    },
    {
      key: "mid_autumn",
      title: "Tết Trung Thu",
      emoji: "🥮",
      color: "from-amber-500 to-yellow-600",
      desc: "Đêm hội trăng rằm, lồng đèn đỏ và ánh trăng vàng kim",
    },
    {
      key: "tet",
      title: "Tết Nguyên Đán",
      emoji: "🌸",
      color: "from-rose-600 to-amber-500",
      desc: "Khai xuân rực rỡ với hoa đào, hoa mai rơi và bao lì xì",
    },
    {
      key: "custom",
      title: "Tùy biến tự do",
      emoji: "✨",
      color: "from-blue-600 to-indigo-600",
      desc: "Cấu hình riêng cho các đợt thi hoặc chiến dịch marketing",
    },
  ];

  const getDecorationLabel = (type: string) => {
    switch (type) {
      case "bat_pumpkin":
        return "🎃 Bí ngô & Dơi bay";
      case "snowflakes":
        return "❄ Hoa tuyết rơi";
      case "lanterns":
        return "🏮 Đèn lồng & Bánh";
      case "blossoms":
        return "🌸 Hoa mai, đào rơi";
      default:
        return "Tắt hiệu ứng rơi";
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. TOP HEADER WITH MASTER SWITCH */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold mb-1.5">
            <Palette className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            <span>Seasonal Theming & Interactive Gamification</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Quản Trị Sự Kiện & Giao Diện Lễ Hội</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
            Bật/tắt sự kiện toàn trang, chuyển đổi template lễ hội (Halloween, Trung thu, Noel, Tết...) và trang trí giao diện học viên
          </p>

          {/* Quick Metrics Strip */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-0.5">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold font-heading uppercase tracking-wider">
              Chỉ số:
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Theme: <strong className="text-slate-900 dark:text-white">{config.name} {config.icon}</strong></span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <Layers className="w-3 h-3 text-blue-500" />
              <span>Hiệu ứng: <strong className="text-slate-900 dark:text-white font-normal">{getDecorationLabel(config.decorationType)}</strong></span>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${
              config.enabled
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${config.enabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
              <span>{config.enabled ? "Đang BẬT toàn web" : "Đang TẮT"}</span>
            </div>
          </div>
        </div>

        {/* Master Toggle Button */}
        <div className="flex items-center gap-3 self-start lg:self-auto p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
          <div className="text-right">
            <span className="text-xs font-heading font-bold block text-slate-800 dark:text-slate-200">
              Công tắc Sự kiện:
            </span>
            <span
              className={`text-[11px] font-semibold ${
                config.enabled ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {config.enabled ? "Đang áp dụng" : "Đang tạm dừng"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => toggleEvent(!config.enabled)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              config.enabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
            }`}
            aria-label="Bật tắt sự kiện"
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                config.enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. MAIN CONTENT GRID: LEFT CONFIGURATION & RIGHT LIVE PREVIEW */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left: Templates & Settings (7 Cols) */}
        <div className="xl:col-span-7 space-y-4">
          {/* Segmented Control Tabs */}
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("templates")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "templates"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold ring-1 ring-slate-900/5 dark:ring-white/10"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Thư viện Template</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("custom")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "custom"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold ring-1 ring-slate-900/5 dark:ring-white/10"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Cấu hình chi tiết & Hiệu ứng</span>
            </button>
          </div>

          {/* Tab 1: Template Gallery */}
          {activeTab === "templates" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs">
                <span className="font-heading font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                  Chọn Template để áp dụng (1 chạm):
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 text-[11px]">
                  Đang chọn: <strong>{config.name}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {presetsList.map((preset) => {
                  const isCurrent = config.activeTemplate === preset.key;
                  return (
                    <div
                      key={preset.key}
                      className={`relative p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3.5 bg-white dark:bg-slate-900 ${
                        isCurrent
                          ? "border-blue-500 dark:border-blue-500 ring-1 ring-blue-500/20 shadow-blue-500/5"
                          : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{preset.emoji}</span>
                            <span className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                              {preset.title}
                            </span>
                          </div>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-heading font-bold bg-blue-600 text-white">
                              Đang áp dụng
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                          {preset.desc}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyPreset(preset.key)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-heading font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isCurrent
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đang kích hoạt</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <span>Áp dụng Template này</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Custom Form */}
          {activeTab === "custom" && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 animate-in fade-in duration-150">
              <h2 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                Tùy biến chi tiết hiển thị & Tone màu
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-heading font-semibold text-slate-700 dark:text-slate-300">
                    Bộ mẫu chủ đề sự kiện (Event Theme Template):
                  </label>
                  <select
                    value={formData.activeTemplate}
                    onChange={(e) => {
                      const newTemplate = e.target.value as EventTemplateId;
                      const preset = PRESET_TEMPLATES[newTemplate];
                      if (preset) {
                        setFormData({
                          ...formData,
                          activeTemplate: newTemplate,
                          primaryColor: preset.primaryColor,
                          accentColor: preset.accentColor,
                          decorationType: preset.decorationType,
                        });
                      } else {
                        setFormData({
                          ...formData,
                          activeTemplate: newTemplate,
                        });
                      }
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-semibold"
                  >
                    <option value="noel">🎄 Giáng sinh (Noel)</option>
                    <option value="mid_autumn">🥮 Tết Trung Thu</option>
                    <option value="halloween">🎃 Halloween</option>
                    <option value="tet">🌸 Tết Nguyên Đán</option>
                    <option value="custom">✨ Tùy biến tự do (Custom)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-heading font-semibold text-slate-700 dark:text-slate-300">
                    Tên hiển thị trong Menu Giao diện:
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                    placeholder="VD: Halloween 🎃"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-heading font-semibold text-slate-700 dark:text-slate-300">
                    Biểu tượng Emoji:
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                    placeholder="VD: 🎃"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-heading font-semibold text-slate-700 dark:text-slate-300">
                    Màu chủ đạo (Primary Hex):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/70 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-heading font-semibold text-slate-700 dark:text-slate-300">
                    Hiệu ứng động rơi màn hình:
                  </label>
                  <select
                    value={formData.decorationType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        decorationType: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="bat_pumpkin">🎃 Bí ngô, dơi bay & mạng nhện (Halloween)</option>
                    <option value="snowflakes">❄ Hoa tuyết rơi lấp lánh (Giáng sinh)</option>
                    <option value="lanterns">🏮 Đèn lồng & bánh trung thu (Trung thu)</option>
                    <option value="blossoms">🌸 Hoa mai, hoa đào mùa xuân (Tết)</option>
                    <option value="none">Tắt hiệu ứng động (Không rơi)</option>
                  </select>
                </div>
              </div>

              {/* Appearance Mode (Chế độ nền sáng / tối mặc định) */}
              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="text-xs font-heading font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Chế độ nền sự kiện (Appearance Mode):</span>
                  <span className="text-[10px] text-slate-400 font-normal">Cài đặt tông màu sáng / tối cho người dùng</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, appearanceMode: "light" })}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      formData.appearanceMode === "light"
                        ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Nền Sáng (Light)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Trắng thanh lịch (Khuyên dùng)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, appearanceMode: "dark" })}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      formData.appearanceMode === "dark"
                        ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>Nền Tối (Dark)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Huyền bí, đêm lễ hội</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, appearanceMode: "adaptive" })}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      formData.appearanceMode === "adaptive"
                        ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Sliders className="w-4 h-4 text-emerald-500" />
                    <span>Thích ứng</span>
                    <span className="text-[10px] text-slate-400 font-normal">Theo máy học viên</span>
                  </button>
                </div>
              </div>

              {/* Banner notification settings */}
              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-heading font-semibold text-slate-800 dark:text-slate-200">
                    Thanh Banner thông báo sự kiện trên đầu trang:
                  </label>
                  <input
                    type="checkbox"
                    checked={formData.bannerEnabled}
                    onChange={(e) => setFormData({ ...formData, bannerEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {formData.bannerEnabled && (
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      value={formData.bannerText}
                      onChange={(e) => setFormData({ ...formData, bannerText: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                      placeholder="Nội dung banner thông báo sự kiện..."
                    />
                    <input
                      type="text"
                      value={formData.bannerLink}
                      onChange={(e) => setFormData({ ...formData, bannerLink: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                      placeholder="Link hành động (VD: /pricing hoặc /thi-thu)"
                    />
                  </div>
                )}
              </div>

              {/* Force theme toggle */}
              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-heading font-semibold text-slate-800 dark:text-slate-200 block">
                    Bắt buộc áp dụng làm theme mặc định:
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Tự động hiển thị theme sự kiện cho mọi người dùng khi truy cập web lần đầu
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.forceEventTheme}
                  onChange={(e) => setFormData({ ...formData, forceEventTheme: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Save Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu cấu hình sự kiện</span>
                </button>

                {savedSuccess && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã lưu thành công!</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Preview Panel (5 Cols) */}
        <div className="xl:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-heading font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Xem trước Giao diện (Live Preview)</span>
            </span>
            <Link
              href="/"
              target="_blank"
              className="text-xs font-heading font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Xem trang chủ</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Mockup Box */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium mb-2.5">
                1. Mô phỏng Menu Dropdown tài khoản học viên:
              </span>

              {/* Dropdown Mockup */}
              <div className="w-64 mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-2 shadow-xl select-none">
                <div className="px-3 pt-1.5 pb-1 text-[11px] font-heading font-semibold text-slate-400 dark:text-slate-500 uppercase">
                  Giao diện
                </div>

                {/* Event Theme Row (If enabled) */}
                {config.enabled && (
                  <div
                    onClick={() => setTheme(config.activeTemplate)}
                    className="cursor-pointer w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base leading-none">{config.icon || "🎃"}</span>
                      <span className="font-semibold">{config.name}</span>
                    </div>
                    {currentTheme === config.activeTemplate && (
                      <Check className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                )}

                {/* Light Theme Row */}
                <div
                  onClick={() => setTheme("light")}
                  className="cursor-pointer w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Sáng (Light)</span>
                  </div>
                  {currentTheme === "light" && (
                    <Check className="w-4 h-4 text-emerald-500" />
                  )}
                </div>

                {/* Dark Theme Row */}
                <div
                  onClick={() => setTheme("dark")}
                  className="cursor-pointer w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Moon className="w-4 h-4 text-blue-500" />
                    <span>Tối (Dark)</span>
                  </div>
                  {currentTheme === "dark" && (
                    <Check className="w-4 h-4 text-emerald-500" />
                  )}
                </div>

                <div className="my-1 border-t border-slate-200/60 dark:border-slate-700/60" />

                {/* Profile Links */}
                <div className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <User className="w-3.5 h-3.5" />
                  <span>Thông tin tài khoản</span>
                </div>

                <div className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <Gift className="w-3.5 h-3.5" />
                  <span>Giới thiệu bạn bè</span>
                </div>

                <div className="my-1 border-t border-slate-200/60 dark:border-slate-700/60" />

                <div className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </div>
              </div>
            </div>

            {/* Banner Preview */}
            {config.enabled && config.bannerEnabled && (
              <div className="space-y-2">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">
                  2. Mô phỏng Thanh thông báo sự kiện trên cùng:
                </span>
                <div
                  className="py-2.5 px-3.5 text-xs font-semibold text-white rounded-xl shadow-xs flex items-center justify-between"
                  style={{
                    background: `linear-gradient(90deg, ${config.primaryColor}, ${config.accentColor || "#1D4ED8"})`,
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>{config.icon}</span>
                    <span className="truncate">{config.bannerText}</span>
                  </div>
                  <span className="underline text-[11px] font-bold shrink-0 ml-2">Xem ngay →</span>
                </div>
              </div>
            )}

            {/* Quick Test Theme Switcher in Admin */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <span className="text-xs font-heading font-semibold text-slate-800 dark:text-slate-200 block">
                Thử chuyển Theme trực tiếp tại màn hình này:
              </span>
              <div className="flex flex-wrap gap-2">
                {config.enabled && (
                  <button
                    type="button"
                    onClick={() => setTheme(config.activeTemplate)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all cursor-pointer ${
                      currentTheme === config.activeTemplate
                        ? "bg-amber-500 text-white shadow-2xs"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {config.icon} {config.name}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all cursor-pointer ${
                    currentTheme === "light"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  Sáng (Light)
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all cursor-pointer ${
                    currentTheme === "dark"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  Tối (Dark)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
