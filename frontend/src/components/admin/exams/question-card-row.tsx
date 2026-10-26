"use client";

import React from "react";
import {
  Mic,
  ListOrdered,
  CheckCircle2,
  FileText,
  HelpCircle,
  Edit2,
  Trash2,
  Sparkles,
  Lock,
  Layers,
  Volume2,
} from "lucide-react";

interface QuestionCardRowProps {
  question: {
    id: string;
    question_number: number;
    question_type: string;
    prompt: string;
    options: any;
    correct_answer: string | null;
    explanation: string | null;
    max_score: number;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export const QuestionCardRow: React.FC<QuestionCardRowProps> = ({
  question: q,
  onEdit,
  onDelete,
}) => {
  const isSentenceOrder = q.question_type === "SENTENCE_ORDER";
  const isSpeaking = q.question_type === "SPEAKING_AUDIO";
  const isGapFill = q.question_type === "GAP_FILL";
  const isMatching = q.question_type === "MATCHING";
  const isEssay = q.question_type === "ESSAY" || q.question_type === "SHORT_TEXT";

  // Parse sentence order options safely
  let fixedSentence = "";
  let sentenceCount = 0;
  if (isSentenceOrder && q.options && typeof q.options === "object" && !Array.isArray(q.options)) {
    fixedSentence = q.options.fixedSentence || "";
    sentenceCount = Array.isArray(q.options.sentences) ? q.options.sentences.length : 0;
  }

  // Type badge styling
  const getTypeBadge = () => {
    switch (q.question_type) {
      case "SPEAKING_AUDIO":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400">
            <Mic className="w-3 h-3" /> Nói / Thu âm
          </span>
        );
      case "SENTENCE_ORDER":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400">
            <ListOrdered className="w-3 h-3" /> Sắp xếp câu
          </span>
        );
      case "GAP_FILL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" /> Điền từ [gap]
          </span>
        );
      case "MATCHING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400">
            <Layers className="w-3 h-3" /> Nối thông tin
          </span>
        );
      case "ESSAY":
      case "SHORT_TEXT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40 text-purple-700 dark:text-purple-400">
            <FileText className="w-3 h-3" /> Viết tự luận
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/40 text-sky-700 dark:text-sky-400">
            Trắc nghiệm
          </span>
        );
    }
  };

  return (
    <div className="flex items-start gap-3 group p-3 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
      {/* Number Badge */}
      <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center justify-center font-mono shrink-0 mt-0.5">
        {q.question_number}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Type & Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {getTypeBadge()}
          <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500">
            {q.max_score}đ
          </span>

          {/* Correct answer indicator */}
          {q.correct_answer && !isSpeaking && !isEssay && q.correct_answer !== "0" && (
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-md flex items-center gap-1">
              ✓ Đáp án: {q.correct_answer}
            </span>
          )}

          {/* Options count if array */}
          {Array.isArray(q.options) && q.options.length > 0 && (
            <span className="text-[10px] text-slate-400 font-mono">
              ({q.options.length} lựa chọn)
            </span>
          )}
        </div>

        {/* Prompt Title */}
        <div className="text-xs text-slate-900 dark:text-slate-100 font-semibold leading-relaxed">
          {isGapFill && q.prompt.includes("[gap]") ? (
            <span className="inline-flex items-center flex-wrap gap-1">
              <span>{q.prompt.split("[gap]")[0]}</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold">
                [gap]
              </span>
              <span>{q.prompt.split("[gap]")[1]}</span>
            </span>
          ) : (
            <span>{q.prompt || "(Chưa có nội dung đề bài)"}</span>
          )}
        </div>

        {/* Sentence Order Extra preview */}
        {isSentenceOrder && fixedSentence && (
          <div className="p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-amber-600 shrink-0" />
            <span className="font-semibold text-slate-500">Câu 1 cố định:</span>
            <span className="truncate italic">"{fixedSentence}"</span>
            <span className="ml-auto text-[10px] font-mono text-amber-600 font-bold shrink-0">
              +{sentenceCount} câu sắp xếp
            </span>
          </div>
        )}

        {/* Speaking Sample Answer preview */}
        {isSpeaking && q.explanation && (
          <div className="p-2 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
            <Sparkles className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
            <span className="truncate">
              <strong className="text-rose-700 dark:text-rose-400">Sample:</strong> {q.explanation}
            </span>
          </div>
        )}

        {/* Essay Model preview */}
        {isEssay && q.explanation && (
          <div className="p-2 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
            <Sparkles className="w-3 h-3 text-purple-500 shrink-0 mt-0.5" />
            <span className="truncate">
              <strong className="text-purple-700 dark:text-purple-400">Bài mẫu:</strong> {q.explanation}
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
          title="Chỉnh sửa câu hỏi"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          title="Xóa câu hỏi"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
