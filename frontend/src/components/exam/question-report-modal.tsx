"use client";

import { useState, useEffect } from "react";
import { Flag, X, CheckCircle2, AlertTriangle, Send } from "lucide-react";
import { api } from "@/lib/api-client";

export interface QuestionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  examTitle?: string;
  questionNumber?: number;
  questionId?: string;
  questionPrompt?: string;
  skillName?: string;
}

const DEFAULT_REASONS = [
  "Đáp án chưa chính xác / Key bị nhầm",
  "Dịch nghĩa / Giải thích đáp án sai",
  "Lỗi âm thanh audio không nghe được",
  "Lỗi hình ảnh / Hiển thị đề bài",
  "Sai lỗi chính tả hoặc ngữ pháp đề bài",
  "Khác",
];

export function QuestionReportModal({
  isOpen,
  onClose,
  examId,
  examTitle,
  questionNumber,
  questionId,
  questionPrompt,
  skillName,
}: QuestionReportModalProps) {
  const [reportReason, setReportReason] = useState<string>(DEFAULT_REASONS[0]);
  const [reportNote, setReportNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReportReason(DEFAULT_REASONS[0]);
      setReportNote("");
      setSuccessMsg(null);
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.exams.reportQuestion(examId, {
        questionId,
        questionNumber,
        reason: reportReason,
        note: reportNote.trim(),
      });
      setSuccessMsg("Đã gửi báo cáo thành công tới Ban chuyên môn Aptis Premier!");
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setReportNote("");
      }, 1300);
    } catch (err: any) {
      console.error("Lỗi gửi báo cáo câu hỏi:", err);
      setErrorMsg(err?.message || "Không thể gửi phản hồi lúc này. Vui lòng kiểm tra kết nối và thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Flag className="w-4 h-4 text-primary fill-primary/20" />
            <span>
              Báo lỗi câu hỏi {skillName ? `(${skillName})` : ""}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thông tin ngữ cảnh câu hỏi */}
        <div className="p-3 rounded-xl bg-muted/50 border border-border/60 text-xs space-y-1">
          <p className="font-semibold text-foreground">
            {questionNumber ? `Câu hỏi #${questionNumber}` : "Câu hỏi đang chọn"}
            {examTitle ? ` — ${examTitle}` : ""}
          </p>
          {questionPrompt && (
            <p className="text-muted-foreground line-clamp-2 italic">
              "{questionPrompt}"
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Vấn đề bạn gặp phải:
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {DEFAULT_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                    reportReason === r
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                      : "border-border hover:bg-muted text-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name="modalReportReason"
                    value={r}
                    checked={reportReason === r}
                    onChange={() => setReportReason(r)}
                    className="w-3.5 h-3.5 accent-primary cursor-pointer"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Mô tả chi tiết góp ý (tùy chọn):
            </label>
            <textarea
              rows={3}
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              placeholder="Nhập chi tiết lỗi giúp ban chuyên môn rà soát nhanh hơn..."
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!successMsg}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Đang gửi..." : "Gửi báo lỗi"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
