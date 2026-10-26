"use client";

import React from "react";
import Link from "next/link";
import { Eye, X, Play, FileText } from "lucide-react";
import { ExamItem } from "./exam.types";

interface ExamPreviewModalProps {
  exam: ExamItem | null;
  onClose: () => void;
}

export const ExamPreviewModal: React.FC<ExamPreviewModalProps> = ({
  exam,
  onClose,
}) => {
  if (!exam) return null;

  const getExamTakeUrl = (e: { id: string; skill?: string }) => {
    switch (e.skill) {
      case "READING":
        return `/reading/${e.id}`;
      case "LISTENING":
        return `/listening/${e.id}`;
      case "WRITING":
        return `/writing/${e.id}`;
      case "SPEAKING":
        return `/speaking/${e.id}`;
      case "FULL_TEST":
      default:
        return `/thi-thu/${e.id}`;
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                Xem trước Đề thi
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                ID: {exam.id}
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

        <div className="space-y-3.5 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
            <div className="font-heading font-bold text-slate-900 dark:text-white text-sm">
              {exam.title}
            </div>
            <div className="text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
              {exam.description || "Không có mô tả chi tiết."}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block mb-1">
                Kỹ năng
              </span>
              <span className="font-heading font-semibold text-slate-900 dark:text-white">
                {exam.skill}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block mb-1">
                Thời lượng
              </span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                {exam.durationMinutes} phút
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block mb-1">
                Quyền truy cập
              </span>
              <span
                className={`font-heading font-bold ${
                  exam.isPro
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {exam.isPro ? "VIP PRO" : "Miễn phí"}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
              <span>Số phần thi (Parts):</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {exam.partsCount}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
              <span>Tổng số câu hỏi:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {exam.questionsCount}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
              <span>Số lượt học viên đã nộp:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {exam.attemptsCount}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Link
              href={getExamTakeUrl(exam)}
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Làm bài thử</span>
            </Link>

            <Link
              href={`/admin/exams/${exam.id}/edit`}
              className="px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-heading font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Sửa nội dung câu hỏi</span>
            </Link>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-heading font-semibold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
