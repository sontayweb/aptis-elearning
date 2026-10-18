"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Languages,
  Volume2,
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  X,
  Sparkles,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";

interface TranslationData {
  originalText: string;
  translatedText: string;
  isWord: boolean;
  phonetic?: string | null;
  audioUrl?: string | null;
  partOfSpeech?: string | null;
  definitionEn?: string | null;
  exampleEn?: string | null;
  cefrLevel?: string;
  wordId?: string | null;
  isSavedInNotebook: boolean;
}

export function SelectionTranslator() {
  const { user } = useAuth();
  const [selectedText, setSelectedText] = useState("");
  const [coords, setCoords] = useState<{ x: number; y: number; height: number; isNearTop: boolean } | null>(null);
  const [showTrigger, setShowTrigger] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TranslationData | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Load preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pref = localStorage.getItem("aptis_quick_translate_enabled");
      if (pref !== null) {
        setIsEnabled(pref === "true");
      }
    }
  }, []);

  const handleSelection = useCallback(() => {
    if (!isEnabled) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      if (!showPopover) {
        setShowTrigger(false);
      }
      return;
    }

    const text = selection.toString().trim();
    // Bỏ qua nếu quá ngắn (< 2 ký tự) hoặc quá dài (> 500 ký tự) hoặc đang chọn trong input/textarea
    if (text.length < 2 || text.length > 500) {
      if (!showPopover) setShowTrigger(false);
      return;
    }

    const anchorNode = selection.anchorNode;
    if (anchorNode) {
      const parentEl = anchorNode.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : (anchorNode as HTMLElement);
      if (
        parentEl?.closest("input") ||
        parentEl?.closest("textarea") ||
        parentEl?.closest("[contenteditable='true']")
      ) {
        return;
      }
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    // Tính toán tọa độ pop-up nổi ngay trên từ vừa bôi đen (hoặc bên dưới nếu gần sát mép trên màn hình)
    const x = Math.min(Math.max(160, rect.left + rect.width / 2), window.innerWidth - 180);
    const y = rect.top + window.scrollY;
    const isNearTop = rect.top < 260;

    setSelectedText(text);
    setCoords({ x, y, height: rect.height, isNearTop });
    setShowTrigger(true);
  }, [isEnabled, showPopover]);

  // Lắng nghe sự kiện bôi đen (mouseup & keyup)
  useEffect(() => {
    const onMouseUp = () => {
      // Đặt timeout nhỏ để selection ổn định trên DOM
      setTimeout(handleSelection, 80);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowPopover(false);
        setShowTrigger(false);
      } else if (e.shiftKey) {
        setTimeout(handleSelection, 80);
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setShowTrigger(false);
        setShowPopover(false);
      }
    };

    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("mousedown", onMouseDown);

    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [handleSelection]);

  // Thực hiện tra từ / dịch
  const handleTranslate = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selectedText) return;

    setShowTrigger(false);
    setShowPopover(true);
    setLoading(true);
    setData(null);
    setIsSaved(false);

    try {
      const res = await api.vocabulary.translate(selectedText);
      if (res.success && res.data) {
        setData(res.data);
        setIsSaved(Boolean(res.data.isSavedInNotebook));
      } else {
        setData({
          originalText: selectedText,
          translatedText: res.message || "Không thể dịch đoạn này.",
          isWord: selectedText.split(/\s+/).length === 1,
          isSavedInNotebook: false,
        });
      }
    } catch {
      setData({
        originalText: selectedText,
        translatedText: "Lỗi kết nối khi dịch. Vui lòng thử lại.",
        isWord: selectedText.split(/\s+/).length === 1,
        isSavedInNotebook: false,
      });
    } finally {
      setLoading(false);
    }
  };

  // Phát âm audio giọng bản xứ
  const handlePlayAudio = () => {
    if (!data) return;
    setIsPlayingAudio(true);

    if (data.audioUrl) {
      const audio = new Audio(data.audioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        // Fallback to SpeechSynthesis
        fallbackSpeech(data.originalText);
      };
      audio.play().catch(() => fallbackSpeech(data.originalText));
    } else {
      fallbackSpeech(data.originalText);
    }
  };

  const fallbackSpeech = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(false);
    }
  };

  // Lưu từ vào Sổ tay từ vựng
  const handleSaveToNotebook = async () => {
    if (!data) return;
    if (!user) {
      alert("Vui lòng đăng nhập để lưu từ vựng vào Sổ tay học tập cá nhân của bạn.");
      return;
    }

    setSaving(true);
    try {
      const res = await api.vocabulary.quickSaveToNotebook({
        word: data.originalText,
        meaning_vi: data.translatedText,
        phonetic: data.phonetic || undefined,
        example_sentence: data.exampleEn || undefined,
        cefr_level: data.cefrLevel || "B1",
        audio_url: data.audioUrl || undefined,
      });

      if (res.success) {
        setIsSaved(true);
      }
    } catch (err: any) {
      console.error("Failed to save word:", err);
    } finally {
      setSaving(false);
    }
  };

  // Copy bản dịch
  const handleCopy = () => {
    if (!data) return;
    const content = data.isWord
      ? `${data.originalText} ${data.phonetic ? `(${data.phonetic})` : ""}: ${data.translatedText}`
      : data.translatedText;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isEnabled) return null;

  return (
    <>
      {/* 1. NÚT MINI TRIGGER (Hiện ngay phía trên đoạn bôi đen) */}
      {showTrigger && coords && !showPopover && (
        <button
          ref={triggerRef}
          type="button"
          onClick={handleTranslate}
          style={{
            position: "absolute",
            left: `${coords.x}px`,
            top: coords.isNearTop ? `${coords.y + coords.height + 8}px` : `${coords.y - 42}px`,
            transform: "translateX(-50%)",
            zIndex: 9999,
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary to-rose-600 text-white font-bold text-xs shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer animate-in fade-in zoom-in-95 duration-150"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>Dịch nhanh</span>
        </button>
      )}

      {/* 2. RICH TRANSLATION CARD POPOVER */}
      {showPopover && coords && (
        <div
          ref={popoverRef}
          style={{
            position: "absolute",
            left: `${coords.x}px`,
            top: coords.isNearTop ? `${coords.y + coords.height + 14}px` : `${coords.y - 12}px`,
            transform: coords.isNearTop ? "translateX(-50%)" : "translateX(-50%) translateY(-100%)",
            zIndex: 99999,
          }}
          className="w-[340px] sm:w-[380px] max-w-[92vw] rounded-2xl border border-primary/20 bg-card/95 backdrop-blur-md p-4 shadow-2xl text-foreground animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-border/60">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Languages className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-heading font-black text-sm text-foreground truncate max-w-[180px]">
                    {selectedText}
                  </span>
                  {data?.partOfSpeech && (
                    <span className="px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground text-[10px] italic font-semibold">
                      {data.partOfSpeech}
                    </span>
                  )}
                  {data?.cefrLevel && (
                    <span className="px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black">
                      {data.cefrLevel}
                    </span>
                  )}
                </div>
                {data?.phonetic && (
                  <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                    {data.phonetic}
                  </p>
                )}
              </div>
            </div>

            {/* Actions: Speak & Close */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handlePlayAudio}
                title="Phát âm tiếng Anh chuẩn"
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  isPlayingAudio
                    ? "bg-primary text-white animate-pulse"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                title="Sao chép bản dịch"
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setShowPopover(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="py-3">
            {loading ? (
              <div className="flex items-center justify-center py-6 gap-2 text-xs text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Đang tra cứu từ điển &amp; dịch nghĩa...</span>
              </div>
            ) : data ? (
              <div className="space-y-2.5">
                {/* Vietnamese Translation */}
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/15">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-0.5">
                    Nghĩa Tiếng Việt:
                  </span>
                  <p className="text-sm font-heading font-extrabold text-foreground leading-snug">
                    {data.translatedText}
                  </p>
                </div>

                {/* English Definition & Example (nếu là từ đơn) */}
                {data.definitionEn && (
                  <div className="text-xs text-muted-foreground space-y-1 pt-1">
                    <p className="leading-relaxed">
                      <span className="font-semibold text-foreground/90">Định nghĩa: </span>
                      {data.definitionEn}
                    </p>
                    {data.exampleEn && (
                      <p className="italic text-[11px] text-muted-foreground/90">
                        &ldquo;{data.exampleEn}&rdquo;
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer Actions */}
          <div className="pt-2.5 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
            <span className="text-[10px] text-muted-foreground/80 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Aptis AI Quick Lookup</span>
            </span>

            {/* Lưu vào sổ tay VIP */}
            {data?.isWord && (
              <button
                type="button"
                onClick={handleSaveToNotebook}
                disabled={isSaved || saving}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs ${
                  isSaved
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 cursor-default"
                    : "bg-primary text-white hover:brightness-95 active:scale-95 cursor-pointer"
                }`}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Đã lưu vào Sổ tay</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{saving ? "Đang lưu..." : "Lưu vào Sổ tay VIP"}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
