"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  Check,
  Loader2,
  Trash2,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";

export interface ExplanationModalQuestionData {
  id: string;
  question_number: number;
  question_type?: string;
  prompt: string;
  options?: any;
  correct_answer?: string | null;
  explanation?: string | null;
  part_title?: string;
}

interface QuestionExplanationModalProps {
  isOpen: boolean;
  question: ExplanationModalQuestionData | null;
  skill?: string;
  onClose: () => void;
  onSave: (questionId: string, newExplanation: string) => Promise<boolean | void>;
}

export const QuestionExplanationModal: React.FC<QuestionExplanationModalProps> = ({
  isOpen,
  question,
  skill,
  onClose,
  onSave,
}) => {
  const [explanation, setExplanation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (question) {
      setExplanation(question.explanation || "");
      setError(null);
    }
  }, [question]);

  if (!isOpen || !question) return null;

  const wordCount = explanation.trim()
    ? explanation.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(question.id, explanation.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || "Không thể lưu lời giải thích. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ lời giải thích của câu hỏi này?")) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(question.id, "");
      setExplanation("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Không thể xóa lời giải thích. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const insertTemplate = (prefix: string) => {
    setExplanation((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return prefix;
      return `${trimmed}\n${prefix}`;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-sm md:text-base text-slate-900 dark:text-white">
                  Lời giải thích câu hỏi #{question.question_number}
                </h3>
                {skill && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 uppercase">
                    {skill}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {question.part_title || "Soạn giải thích chi tiết đáp án chuẩn theo góc nhìn sư phạm"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-5 md:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Question Context Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Nội dung đề bài
              </span>
              {question.correct_answer && (
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  Đáp án chuẩn: <strong className="font-mono">{question.correct_answer}</strong>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-line">
              {question.prompt || "(Không có nội dung câu hỏi)"}
            </p>
          </div>

          {/* Explanation Textarea Area */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Nội dung lời giải thích:</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {wordCount} từ
                </span>
                {explanation.trim() ? (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sẽ hiển thị cho học viên
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">
                    (Để trống nếu câu này không cần giải thích)
                  </span>
                )}
              </div>
            </div>

            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Nhập lời giải thích rõ ràng tại sao đáp án này đúng...&#10;Ví dụ:&#10;• Dẫn chứng: Theo câu thứ 2 trong bài đọc...&#10;• Phân tích từ vựng / ngữ pháp: Cấu trúc 'used to + V' dùng để chỉ thói quen trong quá khứ...&#10;• Vì sao các phương án khác sai: Đáp án A sai vì..."
              rows={7}
              className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all resize-y font-sans shadow-2xs"
            />

            {/* Quick Template Tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-semibold mr-1">Gợi ý chèn nhanh:</span>
              <button
                type="button"
                onClick={() => insertTemplate("• Dẫn chứng: ")}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                + Dẫn chứng
              </button>
              <button
                type="button"
                onClick={() => insertTemplate("• Phân tích ngữ pháp: ")}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                + Ngữ pháp
              </button>
              <button
                type="button"
                onClick={() => insertTemplate("• Từ vựng trọng tâm: ")}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                + Từ vựng
              </button>
              <button
                type="button"
                onClick={() => insertTemplate("• Vì sao các đáp án khác sai: ")}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                + Loại trừ đáp án sai
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            {question.explanation && question.explanation.trim() && (
              <button
                type="button"
                onClick={handleClear}
                disabled={saving}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa giải thích</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Lưu giải thích</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

