"use client";

import { useState, useEffect } from "react";
import { Languages, Search, X, Loader2, Copy, Check, ExternalLink } from "lucide-react";

interface GoogleTranslateWidgetProps {
  initialText?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function ReadingGoogleTranslateModal({
  initialText = "",
  isOpen = false,
  onClose,
}: GoogleTranslateWidgetProps) {
  const [inputText, setInputText] = useState(initialText);
  const [translatedText, setTranslatedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && initialText) {
      setInputText(initialText);
      handleTranslate(initialText);
    }
  }, [isOpen, initialText]);

  const handleTranslate = async (textToTranslate?: string) => {
    const text = (textToTranslate !== undefined ? textToTranslate : inputText).trim();
    if (!text) return;
    setIsLoading(true);
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translatedSentences = data[0].map((item: any) => item[0]).join("");
          setTranslatedText(translatedSentences);
        } else {
          setTranslatedText("Không thể dịch nội dung này.");
        }
      } else {
        setTranslatedText("Lỗi máy chủ dịch thuật. Vui lòng thử lại sau.");
      }
    } catch {
      setTranslatedText("Lỗi kết nối tới dịch vụ dịch. Vui lòng kiểm tra lại mạng.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Languages className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-foreground">
                Google Dịch Song Ngữ
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Dịch nhanh Anh - Việt hỗ trợ đọc hiểu Aptis ESOL
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Input Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Tiếng Anh (English)</span>
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText("")}
                className="text-[11px] text-primary hover:underline"
              >
                Xóa
              </button>
            )}
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Dán hoặc gõ từ/câu tiếng Anh cần tra cứu nghĩa..."
            rows={4}
            className="w-full p-3 rounded-xl border border-border bg-muted/30 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-xs text-foreground placeholder:text-muted-foreground leading-relaxed resize-none"
          />
        </div>

        {/* Translate Actions */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleTranslate()}
            disabled={isLoading || !inputText.trim()}
            className="flex-1 py-2 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tra cứu...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Dịch sang Tiếng Việt</span>
              </>
            )}
          </button>

          {inputText.trim() && (
            <a
              href={`https://translate.google.com/?sl=en&tl=vi&text=${encodeURIComponent(inputText)}&op=translate`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 shrink-0"
              title="Mở trên Google Translate"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Google.com</span>
            </a>
          )}
        </div>

        {/* Result Area */}
        {translatedText && (
          <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
              <span>Bản dịch Tiếng Việt:</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Đã chép" : "Sao chép"}</span>
              </button>
            </div>
            <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-medium">
              {translatedText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
