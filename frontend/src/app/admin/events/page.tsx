"use client";

import { useState } from "react";
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
  RotateCcw,
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
  Info,
  Calendar,
  Layers,
} from "lucide-react";

export default function AdminEventsPage() {
  const { config, updateConfig, applyPreset, toggleEvent, currentTheme, setTheme } = useEventTheme();

  // Local form state for editing before saving
  const [formData, setFormData] = useState({
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
    forceEventTheme: config.forceEventTheme,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"templates" | "custom">("templates");

  const handleApplyPreset = (presetKey: EventTemplateId) => {
    applyPreset(presetKey);
    const preset = PRESET_TEMPLATES[presetKey];
    setFormData({
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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header with Master Switch */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading font-black text-xl sm:text-2xl text-foreground">
                Quản trị Sự kiện & Giao diện (Event Theme Studio)
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cấu hình bật/tắt sự kiện toàn hệ thống, chuyển đổi template lễ hội (Halloween, Trung thu, Noel, Tết...) và trang trí giao diện học viên.
              </p>
            </div>
          </div>
        </div>

        {/* Master Toggle Button */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-bold block text-foreground">
              Trạng thái Sự kiện:
            </span>
            <span
              className={`text-[11px] font-extrabold ${
                config.enabled ? "text-emerald-500" : "text-muted-foreground"
              }`}
            >
              {config.enabled ? "● Đang BẬT trên toàn web" : "○ Đang TẮT"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => toggleEvent(!config.enabled)}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              config.enabled ? "bg-emerald-500" : "bg-muted-foreground/30"
            }`}
            aria-label="Bật tắt sự kiện"
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                config.enabled ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. Main Content Grid: Left Configuration & Right Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left: Templates & Settings (7 Cols) */}
        <div className="xl:col-span-7 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("templates")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "templates"
                  ? "bg-primary text-white shadow-md shadow-blue-500/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              Thư viện Template Sự kiện có sẵn
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("custom")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "custom"
                  ? "bg-primary text-white shadow-md shadow-blue-500/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              Cấu hình chi tiết & Hiệu ứng
            </button>
          </div>

          {/* Tab 1: Template Gallery */}
          {activeTab === "templates" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Chọn Template để kích hoạt ngay (1 Click):
                </span>
                <span className="text-xs font-bold text-primary">
                  Đang chọn: {config.name}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {presetsList.map((preset) => {
                  const isCurrent = config.activeTemplate === preset.key;
                  return (
                    <div
                      key={preset.key}
                      className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                        isCurrent
                          ? "border-primary bg-primary/5 shadow-md shadow-blue-500/10"
                          : "border-border bg-card hover:border-border/80 hover:bg-muted/30"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{preset.emoji}</span>
                            <span className="font-heading font-extrabold text-sm text-foreground">
                              {preset.title}
                            </span>
                          </div>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary text-white">
                              Đang áp dụng
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {preset.desc}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyPreset(preset.key)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isCurrent
                            ? "bg-primary text-white shadow-xs"
                            : "bg-muted hover:bg-muted/80 text-foreground"
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
            <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-5 animate-in fade-in">
              <h2 className="font-heading font-bold text-sm text-foreground">
                Tùy biến chi tiết hiển thị
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Tên hiển thị trong Menu Giao diện:
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-background focus:border-primary outline-hidden"
                    placeholder="VD: Halloween 🎃"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Biểu tượng Emoji:
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-background focus:border-primary outline-hidden"
                    placeholder="VD: 🎃"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Màu chủ đạo (Primary Hex):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-border"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-border bg-background font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
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
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-background focus:border-primary outline-hidden"
                  >
                    <option value="bat_pumpkin">🎃 Bí ngô, dơi bay & mạng nhện (Halloween)</option>
                    <option value="snowflakes">❄ Hoa tuyết rơi lấp lánh (Giáng sinh)</option>
                    <option value="lanterns">🏮 Đèn lồng & bánh trung thu (Trung thu)</option>
                    <option value="blossoms">🌸 Hoa mai, hoa đào mùa xuân (Tết)</option>
                    <option value="none">Tắt hiệu ứng động (Không rơi)</option>
                  </select>
                </div>
              </div>

              {/* Banner notification settings */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span>Thanh Banner thông báo sự kiện trên đầu trang:</span>
                  </label>
                  <input
                    type="checkbox"
                    checked={formData.bannerEnabled}
                    onChange={(e) => setFormData({ ...formData, bannerEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-primary"
                  />
                </div>

                {formData.bannerEnabled && (
                  <div className="space-y-3 pt-1">
                    <input
                      type="text"
                      value={formData.bannerText}
                      onChange={(e) => setFormData({ ...formData, bannerText: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-background focus:border-primary outline-hidden"
                      placeholder="Nội dung banner thông báo sự kiện..."
                    />
                    <input
                      type="text"
                      value={formData.bannerLink}
                      onChange={(e) => setFormData({ ...formData, bannerLink: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-background focus:border-primary outline-hidden"
                      placeholder="Link hành động (VD: /pricing hoặc /thi-thu)"
                    />
                  </div>
                )}
              </div>

              {/* Force theme toggle */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Bắt buộc áp dụng làm theme mặc định:
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Tự động hiển thị theme sự kiện cho mọi người dùng khi truy cập web lần đầu.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.forceEventTheme}
                  onChange={(e) => setFormData({ ...formData, forceEventTheme: e.target.checked })}
                  className="w-4 h-4 rounded text-primary"
                />
              </div>

              {/* Save Button */}
              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu cấu hình sự kiện</span>
                </button>

                {savedSuccess && (
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã lưu thành công!</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Preview Panel (5 Cols) */}
        <div className="xl:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-primary" />
              <span>Xem trước Giao diện (Live Preview)</span>
            </span>
            <Link
              href="/"
              target="_blank"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Xem trang chủ</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mockup Box */}
          <div className="p-6 rounded-3xl bg-muted/40 border border-border shadow-md space-y-6">
            <div>
              <span className="text-[11px] text-muted-foreground block font-medium mb-2">
                1. Mô phỏng Menu Dropdown tài khoản học viên (Giống ảnh người dùng yêu cầu):
              </span>

              {/* Dropdown Mockup */}
              <div className="w-64 mx-auto rounded-2xl border border-border bg-card p-2 shadow-xl select-none">
                <div className="px-3 pt-1.5 pb-1 text-xs font-semibold text-muted-foreground">
                  Giao diện
                </div>

                {/* Event Theme Row (If enabled) */}
                {config.enabled && (
                  <div
                    onClick={() => setTheme(config.activeTemplate)}
                    className="cursor-pointer w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl text-foreground hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base leading-none">{config.icon || "🎃"}</span>
                      <span>{config.name}</span>
                    </div>
                    {currentTheme === config.activeTemplate && (
                      <span className="text-red-500 font-bold text-base leading-none">✓</span>
                    )}
                  </div>
                )}

                {/* Light Theme Row */}
                <div
                  onClick={() => setTheme("light")}
                  className="cursor-pointer w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl text-foreground hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Sun className="w-4 h-4 text-foreground/80" />
                    <span>Sáng</span>
                  </div>
                  {currentTheme === "light" && (
                    <span className="text-red-500 font-bold text-base leading-none">✓</span>
                  )}
                </div>

                {/* Dark Theme Row */}
                <div
                  onClick={() => setTheme("dark")}
                  className="cursor-pointer w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl text-foreground hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Moon className="w-4 h-4 text-foreground/80" />
                    <span>Tối</span>
                  </div>
                  {currentTheme === "dark" && (
                    <span className="text-red-500 font-bold text-base leading-none">✓</span>
                  )}
                </div>

                <div className="my-1 border-t border-border/80" />

                {/* Profile Links */}
                <div className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-foreground/80">
                  <User className="w-4 h-4" />
                  <span>Thông tin tài khoản</span>
                </div>

                <div className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-foreground/80">
                  <Gift className="w-4 h-4" />
                  <span>Giới thiệu bạn</span>
                </div>

                <div className="my-1 border-t border-border/80" />

                <div className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500">
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </div>
              </div>
            </div>

            {/* Banner Preview */}
            {config.enabled && config.bannerEnabled && (
              <div className="space-y-2">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  2. Mô phỏng Thanh thông báo sự kiện trên cùng:
                </span>
                <div
                  className="py-2 px-3 text-xs font-semibold text-white rounded-xl shadow-xs flex items-center justify-between"
                  style={{
                    background: `linear-gradient(90deg, ${config.primaryColor}, ${config.accentColor || "#1D4ED8"})`,
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>{config.icon}</span>
                    <span className="truncate">{config.bannerText}</span>
                  </div>
                  <span className="underline text-[11px] font-bold shrink-0">Xem ngay →</span>
                </div>
              </div>
            )}

            {/* Quick Test Theme Switcher in Admin */}
            <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
              <span className="text-xs font-bold text-foreground block">
                Thử chuyển Theme trực tiếp tại màn hình này:
              </span>
              <div className="flex flex-wrap gap-2">
                {config.enabled && (
                  <button
                    type="button"
                    onClick={() => setTheme(config.activeTemplate)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      currentTheme === config.activeTemplate
                        ? "bg-amber-500 text-white"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {config.icon} {config.name}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currentTheme === "light"
                      ? "bg-primary text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  Sáng
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currentTheme === "dark"
                      ? "bg-primary text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  Tối
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
