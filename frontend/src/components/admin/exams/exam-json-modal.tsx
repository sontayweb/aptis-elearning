"use client";

import React from "react";
import { FileCode, X, RefreshCw, Plus } from "lucide-react";

interface ExamJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  jsonText: string;
  setJsonText: (text: string) => void;
  onImport: () => void;
  loading: boolean;
}

export const ExamJsonModal: React.FC<ExamJsonModalProps> = ({
  isOpen,
  onClose,
  jsonText,
  setJsonText,
  onImport,
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
        className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
              Nhập Đề thi từ JSON
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
          Dán dữ liệu đề thi định dạng JSON gồm các trường:{" "}
          <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px]">
            title
          </code>
          ,{" "}
          <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px]">
            skill
          </code>
          ,{" "}
          <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px]">
            durationMinutes
          </code>
          ,{" "}
          <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px]">
            parts
          </code>
          .
        </p>

        <textarea
          rows={12}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder={`{
  "title": "Aptis ESOL Reading Practice 01",
  "skill": "READING",
  "durationMinutes": 35,
  "isPro": false,
  "parts": [
    {
      "partNumber": 1,
      "title": "Sentence Comprehension",
      "instructions": "Choose one word to complete each sentence.",
      "questions": [
        {
          "questionNumber": 1,
          "questionType": "MULTIPLE_CHOICE",
          "prompt": "He went to the store to ___ some bread.",
          "options": ["buy", "bought", "buying"],
          "correctAnswer": "buy",
          "maxScore": 1
        }
      ]
    }
  ]
}`}
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px] bg-slate-50 dark:bg-slate-800/80 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
        />

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-heading font-semibold text-xs transition-colors"
          >
            Hủy
          </button>

          <button
            type="button"
            disabled={loading || !jsonText.trim()}
            onClick={onImport}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>Khởi tạo từ JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
