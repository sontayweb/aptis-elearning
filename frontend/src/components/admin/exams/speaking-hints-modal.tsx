"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  Check,
  Loader2,
  Trash2,
  Lightbulb,
  Copy,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api-client";

export interface SpeakingHintsData {
  partNumber: 2 | 3;
  topicTitle: string;
  keywords: string[];
  startingPhrases: string[];
  linkingPhrases: string[];
  aiImagePrompts?: {
    image1Prompt: string;
    image2Prompt?: string;
  };
}

interface SpeakingHintsModalProps {
  isOpen: boolean;
  questionId: string;
  partNumber: 2 | 3;
  topicTitle: string;
  prompt: string;
  imageUrl?: string;
  secondImageUrl?: string;
  initialHints?: SpeakingHintsData | null;
  onClose: () => void;
  onSave: (hints: SpeakingHintsData) => Promise<void>;
}

export const SpeakingHintsModal: React.FC<SpeakingHintsModalProps> = ({
  isOpen,
  questionId,
  partNumber,
  topicTitle,
  prompt,
  imageUrl,
  secondImageUrl,
  initialHints,
  onClose,
  onSave,
}) => {
  const isPart3 = partNumber === 3;

  const [keywords, setKeywords] = useState<string[]>([]);
  const [startingPhrases, setStartingPhrases] = useState<string[]>([]);
  const [linkingPhrases, setLinkingPhrases] = useState<string[]>([]);
  const [image1Prompt, setImage1Prompt] = useState("");
  const [image2Prompt, setImage2Prompt] = useState("");

  const [newKeywordInput, setNewKeywordInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialHints) {
      setKeywords(initialHints.keywords || []);
      setStartingPhrases(initialHints.startingPhrases || []);
      setLinkingPhrases(initialHints.linkingPhrases || []);
      setImage1Prompt(initialHints.aiImagePrompts?.image1Prompt || "");
      setImage2Prompt(initialHints.aiImagePrompts?.image2Prompt || "");
    } else {
      setKeywords([]);
      setStartingPhrases(["", ""]);
      setLinkingPhrases(["", ""]);
      setImage1Prompt("");
      setImage2Prompt("");
    }
    setError(null);
  }, [initialHints, questionId]);

  if (!isOpen) return null;

  const handleAddKeyword = () => {
    const val = newKeywordInput.trim();
    if (val && !keywords.includes(val)) {
      setKeywords([...keywords, val]);
      setNewKeywordInput("");
    }
  };

  const handleRemoveKeyword = (idx: number) => {
    setKeywords(keywords.filter((_, i) => i !== idx));
  };

  const handleCopyPrompt = (key: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAIGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await api.admin.generateSpeakingHints(questionId);
      if (res.success && res.data) {
        const d = res.data;
        setKeywords(d.keywords || []);
        setStartingPhrases(d.startingPhrases || []);
        setLinkingPhrases(d.linkingPhrases || []);
        setImage1Prompt(d.aiImagePrompts?.image1Prompt || "");
        setImage2Prompt(d.aiImagePrompts?.image2Prompt || "");
      } else {
        setError(res.error?.message || "Lỗi khi gọi AI sinh gợi ý");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi kết nối khi gọi AI");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: SpeakingHintsData = {
        partNumber,
        topicTitle,
        keywords: keywords.filter((k) => k.trim().length > 0),
        startingPhrases: startingPhrases.filter((p) => p.trim().length > 0),
        linkingPhrases: linkingPhrases.filter((p) => p.trim().length > 0),
        aiImagePrompts: {
          image1Prompt: image1Prompt.trim(),
          image2Prompt: isPart3 ? image2Prompt.trim() : undefined,
        },
      };
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Lỗi khi lưu gợi ý vào đề thi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving && !generating) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-foreground">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-base text-foreground">
                  Gợi Ý So Sánh Đối Lập &amp; Cấu Trúc Ăn Điểm Part {partNumber}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold uppercase tracking-wider">
                  Aim B1 - B2
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chủ đề: <span className="font-semibold text-foreground">&quot;{topicTitle}&quot;</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving || generating}
            className="p-1.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* Context Card & AI Trigger Button */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 flex-1 text-xs">
              <span className="font-bold text-primary uppercase text-[10px] tracking-wider block">
                Ngữ cảnh câu hỏi:
              </span>
              <p className="font-medium text-foreground leading-relaxed">&ldquo;{prompt}&rdquo;</p>
              {imageUrl && (
                <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Ảnh: {imageUrl}</span>
                  {secondImageUrl && <span> &bull; Ảnh 2: {secondImageUrl}</span>}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleAIGenerate}
              disabled={generating || saving}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-60"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI đang phân tích...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>⚡ AI Tự động sinh gợi ý</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Collocations / Keywords */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <span>{isPart3 ? "Collocations đối lập:" : "Từ vựng & Cụm từ miêu tả:"}</span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  ({keywords.length} cụm từ)
                </span>
              </label>
              <span className="text-[11px] text-muted-foreground">Nhập từ rồi bấm Enter</span>
            </div>

            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-border bg-muted/20 min-h-[46px]">
              {keywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-background border border-primary/30 text-foreground shadow-2xs"
                >
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(idx)}
                    className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                <input
                  type="text"
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  placeholder="Thêm từ vựng..."
                  className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="p-1 rounded-md hover:bg-muted text-primary cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Phrases (Compare & Contrast) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
              {isPart3
                ? "Mẫu câu so sánh & đối chiếu (Compare & Contrast):"
                : "Mẫu câu mở đầu & phát triển ý (Starting & Expanding):"}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phrase 1 */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Mẫu câu mở đầu 1:
                </span>
                <textarea
                  rows={2}
                  value={startingPhrases[0] || ""}
                  onChange={(e) => {
                    const copy = [...startingPhrases];
                    copy[0] = e.target.value;
                    setStartingPhrases(copy);
                  }}
                  placeholder='Ví dụ: "While the first picture portrays..., the second depicts..."'
                  className="w-full p-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans leading-relaxed"
                />
              </div>

              {/* Phrase 2 */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Mẫu câu mở đầu 2:
                </span>
                <textarea
                  rows={2}
                  value={startingPhrases[1] || ""}
                  onChange={(e) => {
                    const copy = [...startingPhrases];
                    copy[1] = e.target.value;
                    setStartingPhrases(copy);
                  }}
                  placeholder='Ví dụ: "Comparing the two scenarios, there is a stark difference in..."'
                  className="w-full p-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans leading-relaxed"
                />
              </div>

              {/* Phrase 3 */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Mẫu câu phân tích đối sánh 1:
                </span>
                <textarea
                  rows={2}
                  value={linkingPhrases[0] || ""}
                  onChange={(e) => {
                    const copy = [...linkingPhrases];
                    copy[0] = e.target.value;
                    setLinkingPhrases(copy);
                  }}
                  placeholder='Ví dụ: "On the one hand, the former offers great convenience, whereas..."'
                  className="w-full p-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans leading-relaxed"
                />
              </div>

              {/* Phrase 4 */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Mẫu câu liên hệ / kết luận:
                </span>
                <textarea
                  rows={2}
                  value={linkingPhrases[1] || ""}
                  onChange={(e) => {
                    const copy = [...linkingPhrases];
                    copy[1] = e.target.value;
                    setLinkingPhrases(copy);
                  }}
                  placeholder='Ví dụ: "Personally, I find the latter much more appealing because..."'
                  className="w-full p-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Section 3: AI Image Prompts (To feed Image Generator) */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-primary" />
                <span>Prompt tạo ảnh chuẩn (Dành cho AI Gen lại toàn bộ ảnh):</span>
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Image 1 Prompt */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    Ảnh 1 ({isPart3 ? "Bối cảnh 1" : "Toàn cảnh"}):
                  </span>
                  {image1Prompt && (
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt("img1", image1Prompt)}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === "img1" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={image1Prompt}
                  onChange={(e) => setImage1Prompt(e.target.value)}
                  placeholder="Prompt tiếng Anh chi tiết cho ảnh 1..."
                  className="w-full p-2 rounded-lg border border-border bg-card text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              {/* Image 2 Prompt (Part 3 only) */}
              {isPart3 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      Ảnh 2 (Bối cảnh 2 đối lập):
                    </span>
                    {image2Prompt && (
                      <button
                        type="button"
                        onClick={() => handleCopyPrompt("img2", image2Prompt)}
                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === "img2" ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Đã sao chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    value={image2Prompt}
                    onChange={(e) => setImage2Prompt(e.target.value)}
                    placeholder="Prompt tiếng Anh chi tiết cho ảnh 2 đối lập..."
                    className="w-full p-2 rounded-lg border border-border bg-card text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between gap-3">
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Học viên sẽ thấy gợi ý này ngay khi mở câu hỏi
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || generating}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || generating}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu vào đề thi</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

