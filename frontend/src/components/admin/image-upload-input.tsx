"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  Link as LinkIcon,
  X,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { api } from "@/lib/api-client";

interface ImageUploadInputProps {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
  category?: string; // e.g. "speaking", "reading", "general"
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function ImageUploadInput({
  value = "",
  onChange,
  label = "Hình ảnh minh họa",
  category = "speaking",
  helperText,
  placeholder = "https://... hoặc /uploads/exams/...",
  disabled = false,
}: ImageUploadInputProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isServerStored = value?.startsWith("/uploads/");
  const isExternalUrl = value?.startsWith("http://") || value?.startsWith("https://");

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validate client-side
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validMimes.includes(file.type)) {
      setError("Định dạng file không hỗ trợ. Vui lòng chọn ảnh PNG, JPG, WEBP hoặc GIF.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Dung lượng file vượt quá 10MB. Vui lòng chọn ảnh nhẹ hơn.");
      return;
    }

    setUploading(true);
    try {
      // Truyền previousUrl để backend tự động dọn dẹp file cũ nếu đang thay thế ảnh
      const res = await api.admin.uploadExamImage(file, category, value || undefined);
      if (res && res.url) {
        onChange(res.url);
      } else {
        setError("Không nhận được đường dẫn ảnh từ máy chủ.");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi khi tải ảnh lên máy chủ.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async () => {
    const currentUrl = value;
    onChange("");
    // Nếu là ảnh nội bộ lưu trên server, tự động dọn dẹp file rác trên server
    if (currentUrl && currentUrl.startsWith("/uploads/exams/")) {
      try {
        await api.admin.deleteExamImage(currentUrl);
      } catch {
        // im lặng bỏ qua nếu file đã được xóa
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || uploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleCopyLink = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      {/* Label & Tabs Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
          <span>{label}</span>
        </label>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-heading font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === "upload"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <UploadCloud className="w-3 h-3" />
            <span>Tải từ máy</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === "url"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>Dán URL</span>
          </button>
        </div>
      </div>

      {/* Main Input Area */}
      {activeTab === "upload" ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-3.5 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20"
              : "border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
            disabled={disabled || uploading}
          />

          {uploading ? (
            <div className="py-2 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
              <span className="text-xs font-heading font-semibold text-slate-700 dark:text-slate-300">
                Đang tải ảnh lên máy chủ nội bộ...
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-heading font-bold text-slate-800 dark:text-slate-200">
                  Kéo thả ảnh vào đây, hoặc <span className="text-blue-600 dark:text-blue-400 underline">bấm để chọn file</span>
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Hỗ trợ PNG, JPG, WEBP tối đa 10MB · Tự động tối ưu và lưu vĩnh viễn trên máy chủ
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="relative">
            <input
              type="text"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-[11px]"
            />
            {value && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-500 rounded"
                title="Xóa link"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            Gán đường dẫn trực tiếp (khuyên dùng đường dẫn nội bộ dạng <code className="text-blue-600 dark:text-blue-400 font-mono">/uploads/exams/...</code>)
          </p>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preview Strip (if has value) */}
      {value && (
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            {/* Storage status badge */}
            {isServerStored ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-heading font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Lưu trữ nội bộ an toàn (100% không chết link)</span>
              </span>
            ) : isExternalUrl ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-heading font-bold">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>Link ngoài (Nguy cơ vỡ ảnh nếu trang nguồn chặn hotlink)</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-400">Đường dẫn: {value}</span>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Sao chép link ảnh"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Mở ảnh gốc trong tab mới"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Gỡ ảnh này"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Image Thumbnail */}
          <div className="relative rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 p-2 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Part illustration preview"
              className="max-h-36 max-w-full rounded-md object-contain shadow-xs"
              onError={(e) => {
                // broken image fallback indicator
                const target = e.currentTarget;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  const errEl = document.createElement("div");
                  errEl.className = "py-4 text-center text-rose-500 text-xs font-semibold flex items-center justify-center gap-1.5";
                  errEl.innerHTML = `<span>⚠️ Không thể tải hình ảnh này (Link bị chặn hoặc không tồn tại)</span>`;
                  parent.appendChild(errEl);
                }
              }}
            />
          </div>
        </div>
      )}

      {helperText && !value && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500">{helperText}</p>
      )}
    </div>
  );
}
