"use client";

import { useState } from "react";
import { Flag, MessageCircle, X } from "lucide-react";
import { useSiteSettings } from "@/contexts/site-settings-context";

export function FloatingActions() {
  const [open, setOpen] = useState(false);
  const settings = useSiteSettings();

  return (
    <>
      {/* Floating Bottom Left: Bug Report Button */}
      <a
        href={settings.zaloContactUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed z-[35] bottom-[72px] md:bottom-5 left-14 sm:left-16 md:left-5 flex items-center gap-1.5 rounded-full bg-card/95 backdrop-blur-md px-3 py-1.5 text-xs font-semibold shadow-md border border-border text-muted-foreground hover:text-foreground transition-colors hover:bg-muted"
        aria-label="Báo lỗi chức năng qua Zalo"
        title="Nhắn tin Zalo báo lỗi nhanh"
      >
        <Flag className="w-3.5 h-3.5 text-muted-foreground" />
        <span>Báo lỗi</span>
      </a>

      {/* Floating Bottom Right: Chat with Admin Button */}
      <div
        className="fixed z-[35] bottom-[72px] md:bottom-4 right-3 sm:right-4 flex flex-col items-end gap-2"
      >
        {open && (
          <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <a
              href={settings.zaloContactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-card text-foreground pl-3 pr-4 py-2 text-xs font-bold shadow-lg border border-border hover:bg-muted transition-all"
            >
              <span className="w-6 h-6 rounded-full bg-[#0068FF] text-white flex items-center justify-center text-[9px] font-extrabold">
                Zalo
              </span>
              <span>Zalo Admin: {settings.hotlinePhone}</span>
            </a>
            <a
              href={settings.fanpageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-card text-foreground pl-3 pr-4 py-2 text-xs font-bold shadow-lg border border-border hover:bg-muted transition-all"
            >
              <span className="w-6 h-6 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[9px]">
                FB
              </span>
              <span>Facebook APTIS ESOL PREMIER</span>
            </a>
          </div>
        )}

        <button
          type="button"
          aria-label="Liên hệ hỗ trợ"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="h-10 min-h-[40px] rounded-full text-white shadow-xl shadow-glow-soft flex items-center justify-center gap-1.5 transition-all animate-support-fab-beat w-10 min-w-[40px] sm:w-auto sm:min-w-0 sm:px-3 btn-brand-gradient cursor-pointer"
        >
          {open ? (
            <X className="w-4 h-4" />
          ) : (
            <MessageCircle className="w-4 h-4 fill-white" />
          )}
          <span className="hidden sm:inline font-bold text-xs tracking-wide">
            {open ? "Đóng" : "Hỗ trợ"}
          </span>
        </button>
      </div>
    </>
  );
}
