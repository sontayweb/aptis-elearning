"use client";

import React from "react";
import { CheckCircle2, Loader2, AlertTriangle, RefreshCw, Sparkles, CloudCheck, ShieldCheck } from "lucide-react";

export type SyncStatus = "idle" | "saving" | "saved" | "error" | "resumed";

interface ExamSyncStatusProps {
  status: SyncStatus;
  lastSavedAt?: Date | null;
  isResumed?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function ExamSyncStatus({
  status,
  lastSavedAt,
  isResumed = false,
  onRetry,
  className = "",
}: ExamSyncStatusProps) {
  const formatTime = (d?: Date | null) => {
    if (!d) return "";
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 border ${className} ${
        status === "saving"
          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
          : status === "saved"
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
          : status === "error"
          ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
          : isResumed
          ? "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20"
          : "bg-muted text-muted-foreground border-border/40"
      }`}
      title={
        status === "error"
          ? "Bài làm đang được lưu tạm an toàn trên trình duyệt của bạn."
          : "Hệ thống tự động lưu liên tục lên đám mây."
      }
    >
      {status === "saving" && (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="hidden sm:inline">Đang lưu...</span>
        </>
      )}

      {status === "saved" && (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>
            Đã lưu <span className="hidden sm:inline">{lastSavedAt ? formatTime(lastSavedAt) : ""}</span>
          </span>
        </>
      )}

      {status === "error" && (
        <>
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span>Lưu cục bộ</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="ml-1 hover:underline text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400"
            >
              Thử lại
            </button>
          )}
        </>
      )}

      {status === "idle" && (
        <>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden sm:inline">Tự động bảo vệ</span>
        </>
      )}

      {status === "resumed" && (
        <>
          <Sparkles className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
          <span>Đã khôi phục</span>
        </>
      )}
    </div>
  );
}

export function ExamRecoveryBanner({
  remainingSeconds,
  answersCount,
  onDismiss,
}: {
  remainingSeconds?: number;
  answersCount?: number;
  onDismiss?: () => void;
}) {
  const mins = remainingSeconds ? Math.floor(remainingSeconds / 60) : 0;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border-b border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm font-medium animate-fadeIn">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>
          <strong>Khôi phục phiên làm bài thành công!</strong>{" "}
          {answersCount !== undefined && answersCount > 0
            ? `Đã khôi phục ${answersCount} câu trả lời đã làm.`
            : "Bạn đang tiếp tục bài thi dở dang."}{" "}
          {mins > 0 && `Thời gian còn lại: ~${mins} phút.`}
        </span>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs px-2 py-0.5 rounded hover:bg-emerald-500/20 transition-colors"
        >
          Đã hiểu
        </button>
      )}
    </div>
  );
}
