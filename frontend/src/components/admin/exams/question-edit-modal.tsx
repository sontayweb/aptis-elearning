"use client";

import React from "react";
import Link from "next/link";
import { Edit2, X, Plus, Trash2, RefreshCw, Check } from "lucide-react";
import { QuestionItem, QuestionEditFormData, QUESTION_TYPES } from "./exam.types";

interface QuestionEditModalProps {
  question: QuestionItem | null;
  form: QuestionEditFormData;
  setForm: React.Dispatch<React.SetStateAction<QuestionEditFormData>>;
  onSave: () => void;
  onClose: () => void;
  loading: boolean;
}

export const QuestionEditModal: React.FC<QuestionEditModalProps> = ({
  question,
  form,
  setForm,
  onSave,
  onClose,
  loading,
}) => {
  if (!question) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-2xl w-full max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center">
              <Edit2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                Chỉnh sửa Câu hỏi #{question.questionNumber}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                Thuộc đề: {question.part.exam.title} (Part {question.part.partNumber})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Question Prompt */}
          <div>
            <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1">
              Nội dung câu hỏi (Prompt) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-sans focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              placeholder="Nhập nội dung câu hỏi..."
            />
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1">
                Loại câu hỏi
              </label>
              <select
                value={form.questionType}
                onChange={(e) => setForm({ ...form, questionType: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-sans focus:outline-none focus:border-purple-500"
              >
                {QUESTION_TYPES.filter((t) => t.value !== "ALL").map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1">
                Thứ tự câu (Number)
              </label>
              <input
                type="number"
                value={form.questionNumber}
                onChange={(e) =>
                  setForm({
                    ...form,
                    questionNumber: Number(e.target.value),
                  })
                }
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1">
                Điểm tối đa (Max Score)
              </label>
              <input
                type="number"
                step="0.5"
                value={form.maxScore}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxScore: Number(e.target.value),
                  })
                }
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Options Editor (For Multiple Choice / Gap Fill) */}
          {(form.questionType === "MULTIPLE_CHOICE" ||
            form.questionType === "GAP_FILL") && (
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-slate-800 dark:text-slate-200">
                  Danh sách Lựa chọn &amp; Đáp án
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      options: [...form.options, ""],
                    })
                  }
                  className="text-purple-600 dark:text-purple-400 font-heading font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm lựa chọn</span>
                </button>
              </div>

              {form.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const updated = [...form.options];
                      updated[idx] = e.target.value;
                      setForm({ ...form, options: updated });
                    }}
                    placeholder={`Lựa chọn ${String.fromCharCode(65 + idx)}...`}
                    className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, correctAnswer: opt })
                    }
                    className={`px-2 py-1.5 rounded-lg border text-[10px] font-heading font-bold shrink-0 transition-colors ${
                      form.correctAnswer === opt && opt !== ""
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50"
                    }`}
                    title="Đặt làm đáp án đúng"
                  >
                    {form.correctAnswer === opt && opt !== "" ? "✓ Đáp án" : "Chọn đúng"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = form.options.filter((_, i) => i !== idx);
                      setForm({ ...form, options: updated });
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md"
                    title="Xóa lựa chọn này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Correct Answer */}
          <div>
            <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1">
              Đáp án chuẩn (Correct Answer)
            </label>
            <input
              type="text"
              value={form.correctAnswer}
              onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
              placeholder="Ví dụ: A hoặc nội dung đáp án chuẩn..."
            />
          </div>

          {/* Explanation */}
          <div>
            <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1">
              Lời giải thích chi tiết (Explanation)
            </label>
            <textarea
              rows={3}
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-sans focus:outline-none focus:border-purple-500"
              placeholder="Giải thích vì sao đáp án này đúng để học viên ôn tập..."
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <Link
            href={`/admin/exams/${question.part.exam.id}/edit`}
            className="text-purple-600 dark:text-purple-400 hover:underline font-heading font-semibold text-xs flex items-center gap-1"
            title="Mở toàn bộ đề thi để sửa các Part khác"
          >
            <span>Mở toàn bộ đề thi →</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-heading font-semibold text-xs transition-colors"
            >
              Hủy
            </button>

            <button
              type="button"
              disabled={loading || !form.prompt.trim()}
              onClick={onSave}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-heading font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Lưu thay đổi câu hỏi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
