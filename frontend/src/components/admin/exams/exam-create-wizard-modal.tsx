"use client";

import React from "react";
import { X, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";
import { NewExamWizardData } from "./exam.types";

interface ExamCreateWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  wizardStep: number;
  setWizardStep: (step: number) => void;
  newExam: NewExamWizardData;
  setNewExam: React.Dispatch<React.SetStateAction<NewExamWizardData>>;
  onCreate: () => void;
  loading: boolean;
}

export const ExamCreateWizardModal: React.FC<ExamCreateWizardModalProps> = ({
  isOpen,
  onClose,
  wizardStep,
  setWizardStep,
  newExam,
  setNewExam,
  onCreate,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200/90 dark:border-slate-800 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-heading font-extrabold text-slate-900 dark:text-white">
              Khởi tạo Đề thi Mới
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bước {wizardStep} / 2:{" "}
              {wizardStep === 1 ? "Thông tin chung" : "Cấu trúc phần thi & câu hỏi"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {wizardStep === 1 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Tên đề thi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Đề thi thử Aptis ESOL Full Test B1-B2 Số 05"
                value={newExam.title}
                onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Mô tả tóm tắt
              </label>
              <input
                type="text"
                placeholder="Đề thi chuẩn format British Council cập nhật mới nhất..."
                value={newExam.description}
                onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Kỹ năng
                </label>
                <select
                  value={newExam.skill}
                  onChange={(e) => setNewExam({ ...newExam, skill: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="FULL_TEST">Full Test (162 phút)</option>
                  <option value="LISTENING">Listening (40 phút)</option>
                  <option value="READING">Reading (35 phút)</option>
                  <option value="WRITING">Writing (50 phút)</option>
                  <option value="SPEAKING">Speaking (12 phút)</option>
                </select>
              </div>

              <div>
                <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Thời lượng làm bài (phút)
                </label>
                <input
                  type="number"
                  value={newExam.durationMinutes}
                  onChange={(e) =>
                    setNewExam({ ...newExam, durationMinutes: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                disabled={!newExam.title.trim()}
                onClick={() => setWizardStep(2)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-40"
              >
                <span>Tiếp tục: Cấu trúc Part &amp; Câu hỏi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {wizardStep === 2 && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-slate-800 dark:text-slate-200">
                  Phần thi số 1 (Part 1)
                </span>
                <span className="text-[10px] font-mono text-slate-400">Khởi tạo mặc định</span>
              </div>

              <input
                type="text"
                value={newExam.parts[0]?.title}
                onChange={(e) => {
                  const parts = [...newExam.parts];
                  parts[0].title = e.target.value;
                  setNewExam({ ...newExam, parts });
                }}
                placeholder="Tiêu đề Part..."
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
              />

              <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-heading font-bold text-[11px] text-slate-700 dark:text-slate-300 block">
                  Câu hỏi mẫu số 1:
                </span>
                <input
                  type="text"
                  value={newExam.parts[0]?.questions[0]?.prompt}
                  onChange={(e) => {
                    const parts = [...newExam.parts];
                    parts[0].questions[0].prompt = e.target.value;
                    setNewExam({ ...newExam, parts });
                  }}
                  placeholder="Nội dung câu hỏi..."
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-heading font-semibold transition-colors"
              >
                Quay lại
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={onCreate}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold flex items-center gap-2 shadow-xs transition-all"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Hoàn tất &amp; Lưu Đề thi</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
