"use client";

import {
  FileText,
  ChevronDown,
  Check,
  Copy,
  RotateCcw,
  Sparkles,
  Loader2,
} from "lucide-react";

export interface BilingualData {
  title: string;
  script: string;
  translation: string;
}

interface BilingualTranscriptPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  isReviewMode: boolean;
  /** Dữ liệu transcript của câu/stage hiện tại (null nếu chưa có). */
  bilingual: BilingualData | null | undefined;
  /** Bản dịch AI đã cache cho stage hiện tại. */
  cachedTranslation?: string;
  tab: "en" | "vi";
  onTabChange: (tab: "en" | "vi") => void;
  isTranslating: boolean;
  copied: boolean;
  onCopy: (text: string) => void;
  onRequestTranslation: (force: boolean) => void;
}

/** Khung Transcript tiếng Anh / Bản dịch tiếng Việt (2 tab) dưới trình phát audio. */
export function BilingualTranscriptPanel({
  isOpen,
  onToggle,
  isReviewMode,
  bilingual,
  cachedTranslation,
  tab,
  onTabChange,
  isTranslating,
  copied,
  onCopy,
  onRequestTranslation,
}: BilingualTranscriptPanelProps) {
  return (
    <div className="pt-3 border-t border-border/50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          id="toggle-bilingual-btn" onClick={onToggle}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isOpen
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{isOpen ? "Ẩn Transcript & Dịch TV" : "Xem Transcript & Dịch TV"}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
  
        {!isReviewMode && (
          <span className="text-[11px] text-muted-foreground italic hidden sm:inline">
            💡 Nên nghe và làm bài trước khi mở transcript để rèn phản xạ thi thật
          </span>
        )}
      </div>
  
      {/* Bảng hiển thị 2 Tab chuẩn responsive */}
      {isOpen && (() => {
        if (!bilingual) return null;
  const activeTranslation = bilingual.translation || cachedTranslation;
  
        return (
          <div className="mt-3 rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            {/* Tab Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-2 bg-muted/40 border-b border-border">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="tab-bilingual-en" onClick={() => onTabChange("en")}
                  className={`px-3 py-1.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-t border-x -mb-[1px] ${
                    tab === "en"
                      ? "bg-card text-primary border-border border-b-card shadow-xs"
                      : "bg-transparent text-muted-foreground hover:text-foreground border-transparent"
                  }`}
                >
                  <span>🇬🇧 Transcript tiếng Anh</span>
                </button>
  
                <button
                  type="button"
                  id="tab-bilingual-vi" onClick={() => {
                    onTabChange("vi");
  if (!cachedTranslation) onRequestTranslation(false);
                  }}
                  className={`px-3 py-1.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-t border-x -mb-[1px] ${
                    tab === "vi"
                      ? "bg-card text-amber-600 dark:text-amber-400 border-border border-b-card shadow-xs"
                      : "bg-transparent text-muted-foreground hover:text-foreground border-transparent"
                  }`}
                >
                  <span>🇻🇳 Bản dịch Tiếng Việt</span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI
                  </span>
                </button>
              </div>
  
              {/* Quick copy / refresh actions */}
              <div className="flex items-center gap-1 pb-1">
                {tab === "en" && bilingual.script && (
                  <button
                    type="button"
                    onClick={() => onCopy(bilingual.script)}
                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors cursor-pointer"
                    title="Sao chép transcript tiếng Anh"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500 font-medium">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span className="hidden sm:inline">Sao chép</span>
                      </>
                    )}
                  </button>
                )}
  
                {tab === "vi" && (
                  <>
                    {activeTranslation && (
                      <button
                        type="button"
                        onClick={() => onCopy(activeTranslation)}
                        className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors cursor-pointer"
                        title="Sao chép bản dịch"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500 font-medium">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="hidden sm:inline">Sao chép</span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isTranslating}
                      onClick={() => onRequestTranslation(true)}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
                      title="Làm mới bản dịch AI"
                    >
                      <RotateCcw className={`w-3 h-3 ${isTranslating ? "animate-spin" : ""}`} />
                      <span className="hidden sm:inline">Dịch lại</span>
                    </button>
                  </>
                )}
              </div>
            </div>
  
            {/* Tab Content Body */}
            <div className="p-4 bg-card">
              {tab === "en" ? (
                <div className="text-foreground leading-relaxed whitespace-pre-line font-mono text-[12px] max-h-64 overflow-y-auto select-text">
                  {bilingual.script || "Đang cập nhật lời thoại cho câu hỏi này."}
                </div>
              ) : (
                <div className="text-foreground leading-relaxed whitespace-pre-line text-[12px] max-h-64 overflow-y-auto select-text">
                  {activeTranslation ? (
                    activeTranslation
                  ) : isTranslating ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      <span className="text-xs font-medium">Đang tạo bản dịch tiếng Việt bằng AI...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 gap-2.5 text-muted-foreground text-center">
                      <span className="text-xs">Đang cập nhật bản dịch tiếng Việt cho câu này...</span>
                      <button
                        type="button"
                        onClick={() => onRequestTranslation(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Dịch ngay bằng AI</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
