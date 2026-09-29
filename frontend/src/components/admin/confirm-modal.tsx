"use client";

import { useEffect } from "react";
import { AlertTriangle, Info, CheckCircle2, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info" | "success";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  type = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !loading) {
          onCancel();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const colorStyles = {
    danger: {
      iconBg: "bg-rose-50 text-rose-600 border border-rose-200",
      buttonBg: "bg-rose-600 hover:bg-rose-700 text-white shadow-xs",
      icon: AlertTriangle,
    },
    warning: {
      iconBg: "bg-amber-50 text-amber-600 border border-amber-200",
      buttonBg: "bg-slate-900 hover:bg-slate-800 text-white shadow-xs",
      icon: AlertTriangle,
    },
    info: {
      iconBg: "bg-sky-50 text-sky-600 border border-sky-200",
      buttonBg: "bg-slate-900 hover:bg-slate-800 text-white shadow-xs",
      icon: Info,
    },
    success: {
      iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200",
      buttonBg: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs",
      icon: CheckCircle2,
    },
  }[type];

  const Icon = colorStyles.icon;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-md w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4"
      >
        <div className="flex items-start gap-3.5">
          <div className={`w-10 h-10 rounded-xl ${colorStyles.iconBg} flex items-center justify-center shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-heading font-extrabold text-slate-900 leading-snug">{title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors font-heading"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-semibold transition-all flex items-center gap-2 ${colorStyles.buttonBg} ${
              loading ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {loading && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
