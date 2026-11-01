"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Volume2,
  UploadCloud,
  Sparkles,
  Link as LinkIcon,
  Trash2,
  Copy,
  Check,
  Play,
  Pause,
  RotateCcw,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Bot,
  UserCheck,
} from "lucide-react";
import { api } from "@/lib/api-client";

interface AudioUploadInputProps {
  value?: string | null;
  onChange: (url: string) => void;
  scriptText?: string; // Text kịch bản lấy từ ô passageText để sinh AI
  category?: string; // e.g. "listening"
  label?: string;
  helperText?: string;
  disabled?: boolean;
}

export default function AudioUploadInput({
  value = "",
  onChange,
  scriptText = "",
  category = "listening",
  label = "Âm thanh bài thi (Listening Audio)",
  helperText,
  disabled = false,
}: AudioUploadInputProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "ai" | "url">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [voice, setVoice] = useState<string>("auto");
  const [customPrompt, setCustomPrompt] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Đồng bộ customPrompt khi scriptText bên ngoài thay đổi
  useEffect(() => {
    if (scriptText && !customPrompt) {
      setCustomPrompt(scriptText);
    }
  }, [scriptText]);

  const currentAudioUrl = value || "";
  const isServerStored = currentAudioUrl.startsWith("/uploads/audio/");
  const isExternalUrl = currentAudioUrl.startsWith("http://") || currentAudioUrl.startsWith("https://");

  // Xử lý Upload file từ máy tính
  const handleFileSelect = async (file: File) => {
    setError(null);

    const validExtensions = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".webm"];
    const fileExt = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(fileExt) && !file.type.startsWith("audio/")) {
      setError("Định dạng file không hỗ trợ. Vui lòng chọn file MP3, WAV, M4A, OGG hoặc WEBM.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError("Dung lượng file vượt quá 25MB. Vui lòng chọn file nhẹ hơn.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.admin.uploadExamAudio(file, category, currentAudioUrl || undefined);
      if (res && res.url) {
        onChange(res.url);
      } else {
        setError("Không nhận được đường dẫn âm thanh từ máy chủ.");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi khi tải file âm thanh lên máy chủ.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Xử lý AI Tự động sinh giọng nói từ Script
  const handleGenerateTts = async () => {
    const textToSpeak = (customPrompt || scriptText || "").trim();
    if (!textToSpeak) {
      setError("Vui lòng nhập kịch bản (transcript) vào ô bên dưới hoặc điền vào Bài đọc/Ngữ cảnh ở trên trước khi sinh audio.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await api.admin.generateAudioTts({
        text: textToSpeak,
        voice: voice !== "auto" ? voice : undefined,
        prefix: `exam_${category}`,
        previousUrl: isServerStored ? currentAudioUrl : undefined,
      });

      if (res && res.url) {
        onChange(res.url);
      } else {
        setError("Máy chủ không trả về URL âm thanh được sinh.");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi khi yêu cầu AI sinh âm thanh.");
    } finally {
      setLoading(false);
    }
  };

  // Xóa / Gỡ bỏ audio
  const handleRemoveAudio = async () => {
    const urlToRemove = currentAudioUrl;
    onChange("");
    if (urlToRemove && urlToRemove.startsWith("/uploads/audio/")) {
      try {
        await api.admin.deleteExamAudio(urlToRemove);
      } catch {
        // Bỏ qua lỗi dọn dẹp nếu file đã bị xóa
      }
    }
  };

  // Copy link
  const handleCopyLink = () => {
    if (!currentAudioUrl) return;
    navigator.clipboard.writeText(currentAudioUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 p-3.5 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/20">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sky-900 dark:text-sky-300 font-bold text-xs">
          <Volume2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>{label}</span>
          {isServerStored && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3" />
              Đã lưu trên máy chủ
            </span>
          )}
        </div>

        {/* Thanh chọn chế độ */}
        <div className="inline-flex rounded-xl p-0.5 bg-sky-100/80 dark:bg-sky-900/40 border border-sky-200/60 dark:border-sky-800/60 text-[11px] font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "upload"
                ? "bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Tải file lên</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("ai");
              if (!customPrompt && scriptText) setCustomPrompt(scriptText);
            }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "ai"
                ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Sinh từ Script</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "url"
                ? "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Dán URL</span>
          </button>
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>
      )}

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: KÉO THẢ TẢI FILE ÂM THANH */}
      {activeTab === "upload" && (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="audio/mp3,audio/mpeg,audio/wav,audio/m4a,audio/x-m4a,audio/ogg,audio/webm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />

          <div
            onClick={() => !loading && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-sky-500 bg-sky-100/50 dark:bg-sky-900/40"
                : "border-sky-200 dark:border-sky-800/80 hover:border-sky-400 dark:hover:border-sky-700 bg-white/70 dark:bg-slate-900/40"
            }`}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-2 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                <span className="text-xs font-semibold text-sky-800 dark:text-sky-300">
                  Đang tải tệp âm thanh lên máy chủ...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2 space-y-1">
                <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-1">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Nhấp để tải file hoặc kéo thả tệp âm thanh vào đây
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Hỗ trợ định dạng: MP3, WAV, M4A, OGG, WEBM (Tối đa 25MB)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AI SINH TỰ ĐỘNG TỪ SCRIPT */}
      {activeTab === "ai" && (
        <div className="space-y-3 p-3 rounded-xl bg-white/90 dark:bg-slate-900/50 border border-amber-200/70 dark:border-amber-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Công nghệ Microsoft Azure Neural Voice (Chuẩn Anh - Anh)
            </span>

            {/* Chọn giọng đọc */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 shrink-0">Giọng đọc:</span>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="auto">🤖 Tự động (Phân vai Nam/Nữ theo Man: / Woman:)</option>
                <option value="en-GB-RyanNeural">👨 Ryan (Nam - Chuẩn Anh)</option>
                <option value="en-GB-SoniaNeural">👩 Sonia (Nữ - Chuẩn Anh)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Kịch bản lời thoại (Transcript) để AI đọc:
              </label>
              {scriptText && (
                <button
                  type="button"
                  onClick={() => setCustomPrompt(scriptText)}
                  className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                >
                  Lấy từ Bài đọc/Ngữ cảnh ở trên ⟲
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="VD: Attention passengers on flight BA302... Hoặc: Man: Hello! \nWoman: Hi there!"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white font-sans focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              ⚡ Miễn phí 100%, tự động ghép 2 người nói nếu có &quot;Man:&quot; và &quot;Woman:&quot;.
            </span>
            <button
              type="button"
              disabled={loading || !customPrompt.trim()}
              onClick={handleGenerateTts}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-xs transition-all shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang sinh audio bản ngữ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1-Click Sinh Audio</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: DÁN LINK URL TRỰC TIẾP */}
      {activeTab === "url" && (
        <div className="space-y-1.5">
          <input
            type="text"
            value={currentAudioUrl}
            onChange={(e) => onChange(e.target.value.trim())}
            placeholder="https://... hoặc /uploads/audio/listening/..."
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-sky-500"
          />
          <p className="text-[10px] text-slate-400">
            Dán đường dẫn trực tiếp nếu bạn đã lưu trữ file âm thanh trên hosting bên ngoài hoặc Cloudflare R2 / S3.
          </p>
        </div>
      )}

      {/* TRÌNH PHÁT XEM TRƯỚC (LIVE PREVIEW AUDIO PLAYER) */}
      {currentAudioUrl && (
        <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/60 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 overflow-hidden text-ellipsis">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate font-mono text-[11px] text-slate-600 dark:text-slate-400">
                {currentAudioUrl}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                title="Sao chép link audio"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleRemoveAudio}
                title="Gỡ bỏ file audio này"
                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <audio
            ref={audioRef}
            controls
            src={currentAudioUrl}
            className="w-full h-9 rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

