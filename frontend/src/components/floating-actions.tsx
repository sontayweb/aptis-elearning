"use client";

import { useState } from "react";
import { Flag, MessageCircle, X } from "lucide-react";

export function FloatingActions() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Bottom Left: Bug Report Button */}
      <button
        type="button"
        className="fixed z-[35] bottom-[72px] md:bottom-5 left-3 sm:left-4 flex items-center gap-1.5 rounded-full bg-card/90 backdrop-blur-md px-3 py-1.5 text-xs font-semibold shadow-md border transition-colors hover:bg-muted"
        aria-label="Báo lỗi chức năng"
        style={{
          color: "rgb(0, 47, 95)",
          borderColor: "rgba(0, 47, 95, 0.3)",
        }}
        onClick={() => {
          alert("Tính năng báo lỗi: Vui lòng nhắn tin qua Zalo hoặc Facebook để được hỗ trợ!");
        }}
      >
        <Flag className="w-3.5 h-3.5" />
        <span>Báo lỗi</span>
      </button>

      {/* Floating Bottom Right: Chat with Admin Button */}
      <div
        className="fixed z-[35] bottom-[72px] md:bottom-4 right-3 sm:right-4 flex flex-col items-end gap-2"
      >
        {open && (
          <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <a
              href="https://zalo.me/0867833227"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-card text-foreground pl-3 pr-4 py-2 text-xs font-bold shadow-lg border border-border hover:bg-muted"
            >
              <span className="w-6 h-6 rounded-full bg-[#0068FF] text-white flex items-center justify-center text-[9px] font-extrabold">
                Zalo
              </span>
              <span>Zalo Admin: 0379 866 596</span>
            </a>
            <a
              href="https://www.facebook.com/Aptiskytich"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-card text-foreground pl-3 pr-4 py-2 text-xs font-bold shadow-lg border border-border hover:bg-muted"
            >
              <span className="w-6 h-6 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[9px]">
                FB
              </span>
              <span>Facebook Aptis Kỳ Tích</span>
            </a>
          </div>
        )}

        <button
          type="button"
          aria-label="Liên hệ hỗ trợ"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="h-10 min-h-[40px] rounded-full text-white shadow-xl flex items-center justify-center gap-1.5 transition-all animate-support-fab-beat w-10 min-w-[40px] sm:w-auto sm:min-w-0 sm:px-3"
          style={{ backgroundColor: "rgb(204, 28, 1)" }}
        >
          {open ? (
            <X className="w-5 h-5" />
          ) : (
            <MessageCircle className="w-5 h-5 fill-white/20" />
          )}
          <span className="hidden sm:inline text-xs font-semibold whitespace-nowrap">
            Chat với admin
          </span>
        </button>
      </div>
    </>
  );
}
