"use client";

import React from "react";
import Link from "next/link";
import { Edit2, X, RefreshCw, Check, FileText } from "lucide-react";
import { ExamItem, EditExamFormData } from "./exam.types";

interface ExamEditModalProps {
  exam: ExamItem | null;
  form: EditExamFormData;
  setForm: React.Dispatch<React.SetStateAction<EditExamFormData>>;
  onSave: () => void;
  onClose: () => void;
  loading: boolean;
}

export const ExamEditModal: React.FC<ExamEditModalProps> = ({
  exam,
  form,
  setForm,
  onSave,
  onClose,
  loading,
}) => {
  if (!exam) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-slate-800 dark:text-slate-200" />
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
              Sửa Cấu hình Đề thi
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tên đề thi
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <div>
            <label className="block font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mô tả
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kỹ năng
              </label>
              <select
                value={form.skill}
                onChange={(e) => setForm({ ...form, skill: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="FULL_TEST">Full Test</option>
                <option value="LISTENING">Listening</option>
                <option value="READING">Reading</option>
                <option value="SPEAKING">Speaking</option>
                <option value="WRITING">Writing</option>
              </select>
            </div>

            <div>
              <label className="block font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Thời lượng (phút)
              </label>
              <input
                type="number"
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm({ ...form, durationMinutes: Number(e.target.value) })
                }
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mức độ Hot / Đề tủ
            </label>
            <select
              value={form.hotLevel}
              onChange={(e) => setForm({ ...form, hotLevel: Number(e.target.value) })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 font-sans"
            >
              <option value={0}>⚪ Mặc định (0⭐ - Bình thường)</option>
              <option value={1}>⭐ 1 Sao (Đề ôn tập bổ trợ)</option>
              <option value={2}>⭐⭐ 2 Sao (Đề Hot)</option>
              <option value={3}>⭐⭐⭐ 🔥 3 Sao (Đề Tủ - Hay ra)</option>
            </select>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPro}
                onChange={(e) => setForm({ ...form, isPro: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
              />
              <span className="font-heading font-semibold text-slate-800 dark:text-slate-200">
                Yêu cầu gói VIP PRO
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
              />
              <span className="font-heading font-semibold text-slate-800 dark:text-slate-200">
                Xuất bản ngay (Hiển thị cho học viên)
              </span>
            </label>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <Link
            href={`/admin/exams/${exam.id}/edit`}
            className="text-blue-600 dark:text-blue-400 hover:underline font-heading font-semibold text-xs flex items-center gap-1 transition-colors"
            title="Mở giao diện biên soạn câu hỏi chi tiết"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Sửa câu hỏi chi tiết →</span>
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
              disabled={loading || !form.title}
              onClick={onSave}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Lưu cấu hình</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
