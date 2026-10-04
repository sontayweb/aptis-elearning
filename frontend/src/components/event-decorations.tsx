"use client";

import { useState } from "react";
import Link from "next/link";
import { useEventTheme } from "@/contexts/event-theme-context";
import { X, Sparkles, ArrowRight } from "lucide-react";

export function EventAnnouncementBar() {
  const { config, isEventActive } = useEventTheme();
  const [dismissed, setDismissed] = useState(false);

  if (!config.enabled || !config.bannerEnabled || dismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Thông báo sự kiện"
      className="relative z-50 py-2 px-3 sm:px-4 text-xs font-semibold text-white transition-all shadow-sm select-none"
      style={{
        background: `linear-gradient(90deg, ${config.primaryColor}, ${config.accentColor || "#1D4ED8"})`,
      }}
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3">
        <div className="flex-1 flex items-center justify-center gap-2 text-center overflow-hidden">
          <span className="text-sm shrink-0 animate-bounce">{config.icon}</span>
          <span className="truncate">{config.bannerText}</span>
          {config.bannerLink && (
            <Link
              href={config.bannerLink}
              className="inline-flex items-center gap-1 underline underline-offset-2 hover:opacity-85 font-extrabold shrink-0"
            >
              <span>Xem ngay</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md hover:bg-black/20 text-white/80 hover:text-white transition-colors shrink-0"
          aria-label="Đóng thông báo sự kiện"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}

export function EventDecorations() {
  const { config, currentTheme } = useEventTheme();

  // Show decorations if event is enabled AND the current theme is the event template (or forced)
  const shouldRender =
    config.enabled &&
    (currentTheme === config.activeTemplate ||
      (config.forceEventTheme && currentTheme !== "light" && currentTheme !== "dark"));

  if (!shouldRender || config.decorationType === "none") {
    return null;
  }

  // 1. Halloween Decoration (Bí ngô, Dơi bay, Mạng nhện góc)
  if (config.decorationType === "bat_pumpkin") {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-30 overflow-hidden select-none"
      >
        {/* Spider Web at top right */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-35">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className="text-orange-400 w-full h-full">
            <path d="M100 0 L0 100 M100 0 L40 100 M100 0 L70 100 M100 0 L100 60" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
            <path d="M90 10 Q70 30 60 70 M80 20 Q55 45 40 85 M70 30 Q40 60 20 95" strokeWidth="0.8" />
          </svg>
        </div>

        {/* Floating Glowing Pumpkin (Bottom Right) */}
        <div className="absolute bottom-20 right-4 sm:right-6 animate-bounce duration-1000 opacity-90 drop-shadow-[0_0_12px_rgba(234,88,12,0.6)]">
          <span className="text-3xl sm:text-4xl filter drop-shadow">🎃</span>
        </div>

        {/* Floating Ghost (Bottom Left) */}
        <div className="absolute bottom-24 left-4 sm:left-6 animate-pulse duration-700 opacity-80 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
          <span className="text-2xl sm:text-3xl">👻</span>
        </div>

        {/* Flying Bats */}
        <div className="absolute top-20 left-12 animate-float-bat opacity-70">
          <span className="text-xl">🦇</span>
        </div>
        <div className="absolute top-36 right-24 animate-float-bat-delay opacity-60">
          <span className="text-base">🦇</span>
        </div>
      </div>
    );
  }

  // 2. Noel Snowflakes (Hoa tuyết rơi lấp lánh)
  if (config.decorationType === "snowflakes") {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-30 overflow-hidden select-none"
      >
        {/* Festive Tree bottom left */}
        <div className="absolute bottom-20 left-4 sm:left-6 opacity-85 drop-shadow-[0_0_12px_rgba(22,163,74,0.5)]">
          <span className="text-3xl sm:text-4xl">🎄</span>
        </div>
        {/* Santa gift bottom right */}
        <div className="absolute bottom-20 right-4 sm:right-6 opacity-85 drop-shadow-[0_0_12px_rgba(220,38,38,0.5)]">
          <span className="text-3xl sm:text-4xl">🎁</span>
        </div>

        {/* 10 Falling Snowflakes */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute text-white/80 animate-snow-fall"
            style={{
              left: `${(i * 10) + 3}%`,
              top: `-20px`,
              fontSize: `${12 + (i % 4) * 4}px`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${5 + (i % 3) * 2}s`,
            }}
          >
            ❄
          </div>
        ))}
      </div>
    );
  }

  // 3. Mid Autumn Lanterns (Đèn lồng Trung thu & Trăng sáng)
  if (config.decorationType === "lanterns") {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-30 overflow-hidden select-none"
      >
        {/* Hanging Lanterns Top Corners */}
        <div className="absolute top-16 left-6 animate-swing drop-shadow-[0_0_15px_rgba(217,119,6,0.7)]">
          <span className="text-3xl">🏮</span>
        </div>
        <div className="absolute top-16 right-6 animate-swing-delay drop-shadow-[0_0_15px_rgba(217,119,6,0.7)]">
          <span className="text-3xl">🏮</span>
        </div>

        {/* Mooncake & Full Moon bottom */}
        <div className="absolute bottom-20 right-6 opacity-90 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]">
          <span className="text-3xl">🥮</span>
        </div>
      </div>
    );
  }

  // 4. Tet Blossoms (Hoa mai, hoa đào mùa xuân)
  if (config.decorationType === "blossoms") {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-30 overflow-hidden select-none"
      >
        {/* Lucky Money & Apricot Blossom */}
        <div className="absolute bottom-20 right-6 opacity-90 drop-shadow-[0_0_12px_rgba(225,29,72,0.6)]">
          <span className="text-3xl">🧧</span>
        </div>
        <div className="absolute bottom-20 left-6 opacity-90 drop-shadow-[0_0_12px_rgba(234,179,8,0.6)]">
          <span className="text-3xl">🌸</span>
        </div>

        {/* 8 Falling Petals */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute text-pink-300/80 animate-petal-fall"
            style={{
              left: `${(i * 12) + 5}%`,
              top: `-20px`,
              fontSize: `${14 + (i % 3) * 3}px`,
              animationDelay: `${i * 0.9}s`,
              animationDuration: `${6 + (i % 2) * 2}s`,
            }}
          >
            🌸
          </div>
        ))}
      </div>
    );
  }

  return null;
}
