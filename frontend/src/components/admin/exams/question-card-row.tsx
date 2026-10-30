"use client";

import React from "react";
import {
  Mic,
  ListOrdered,
  CheckCircle2,
  FileText,
  Edit2,
  Trash2,
  Sparkles,
  Lock,
  Layers,
  Check,
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
  const isEssay =
    q.question_type === "ESSAY" || q.question_type === "SHORT_TEXT";

  // Parse options list safely for both array and object formats
  let parsedOptionsList: string[] = [];
  if (Array.isArray(q.options)) {
    parsedOptionsList = q.options.map((o: any) => String(o));
  } else if (typeof q.options === "string") {
    try {
      const p = JSON.parse(q.options);
      if (Array.isArray(p)) parsedOptionsList = p.map((o: any) => String(o));
    } catch {}
  } else if (
    isSentenceOrder &&
    q.options &&
    typeof q.options === "object" &&
    !Array.isArray(q.options)
  ) {
    const fixed = q.options.fixedSentence ? [String(q.options.fixedSentence)] : [];
    const sList = Array.isArray(q.options.sentences)
      ? q.options.sentences.map((s: any) => String(s?.text || s || ""))
      : [];
    parsedOptionsList = [...fixed, ...sList];
  }

  // Type badge styling
  const getTypeBadge = () => {
    switch (q.question_type) {
      case "SPEAKING_AUDIO":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400">
            <Mic className="w-3 h-3" /> Nói / Thu âm (Speaking)
          </span>
        );
      case "SENTENCE_ORDER":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400">
            <ListOrdered className="w-3 h-3" /> Sắp xếp {parsedOptionsList.length || 5} câu (Reading P2)
          </span>
        );
      case "GAP_FILL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" /> Điền từ [gap] (Reading P1)
          </span>
        );
      case "MATCHING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400">
            <Layers className="w-3 h-3" /> Nối thông tin (Matching)
          </span>
        );
      case "SHORT_TEXT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40 text-purple-700 dark:text-purple-400">
            <FileText className="w-3 h-3" /> Trả lời ngắn 1–5 từ (Writing P1)
          </span>
        );
      case "ESSAY":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40 text-purple-700 dark:text-purple-400">
            <FileText className="w-3 h-3" /> Viết tự luận / Email (Writing)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/40 text-sky-700 dark:text-sky-400">
            Trắc nghiệm (Multiple Choice)
          </span>
        );
    }
  };

  const sampleWordCount = q.explanation
    ? q.explanation.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="flex items-start gap-3 group p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-all border border-slate-200/70 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/60 shadow-2xs">
      {/* Number Badge */}
      <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-black flex items-center justify-center font-mono shrink-0 mt-0.5 border border-slate-200/80 dark:border-slate-700">
        {q.question_number}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Type & Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {getTypeBadge()}
          <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500">
            {q.max_score}đ
          </span>

          {/* Correct answer indicator (skip raw JSON arrays or "0" for sentence order) */}
          {q.correct_answer &&
            !isSpeaking &&
            !isEssay &&
            !isSentenceOrder &&
            q.correct_answer !== "0" && (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[2.5]" /> Đáp án: {q.correct_answer}
              </span>
            )}
        </div>

        {/* Prompt Title */}
        <div className="text-xs sm:text-[13px] text-slate-900 dark:text-slate-100 font-semibold leading-relaxed">
          {isGapFill && q.prompt.includes("[gap]") ? (
            <span className="inline-flex items-center flex-wrap gap-1.5">
              <span>{q.prompt.split("[gap]")[0]}</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-mono text-xs font-bold">
                [{q.correct_answer || "gap"}]
              </span>
              <span>{q.prompt.split("[gap]")[1]}</span>
            </span>
          ) : (
            <span className="whitespace-pre-line">
              {q.prompt || "(Chưa có nội dung đề bài)"}
            </span>
          )}
        </div>

        {/* 1. SENTENCE_ORDER: Display all 5 ordered sentences clearly */}
        {isSentenceOrder && parsedOptionsList.length > 0 && (
          <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-1.5">
            {parsedOptionsList.map((sent, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 text-[11px] leading-relaxed p-1.5 rounded-lg ${
                  idx === 0
                    ? "bg-amber-100/70 dark:bg-amber-900/30 text-amber-950 dark:text-amber-200 font-semibold"
                    : "bg-white/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300"
                }`}
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 flex items-center gap-1 ${
                    idx === 0
                      ? "bg-amber-600 text-white"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {idx === 0 ? (
                    <>
                      <Lock className="w-2.5 h-2.5" /> Câu 1 (Gốc)
                    </>
                  ) : (
                    `#${idx + 1}`
                  )}
                </span>
                <span className="flex-1">{sent}</span>
              </div>
            ))}
          </div>
        )}

        {/* 2. GAP_FILL / MULTIPLE_CHOICE / MATCHING: Display options pills */}
        {!isSentenceOrder && parsedOptionsList.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {parsedOptionsList.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isCorrect =
                q.correct_answer &&
                (opt.trim().toLowerCase() ===
                  q.correct_answer.trim().toLowerCase() ||
                  q.correct_answer.trim() === letter);
              return (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border transition-colors ${
                    isCorrect
                      ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-bold shadow-2xs"
                      : "bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {!isGapFill && !isMatching && (
                    <span className="font-mono font-bold text-[10px] opacity-75">
                      {letter}.
                    </span>
                  )}
                  <span>{opt}</span>
                  {isCorrect && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                </span>
              );
            })}
          </div>
        )}

        {/* 3. Speaking / Essay / Explanation Preview */}
        {q.explanation && (
          <div
            className={`p-2.5 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 ${
              isSpeaking
                ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-900/40 text-slate-700 dark:text-slate-300"
                : isEssay
                ? "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/70 dark:border-purple-900/40 text-slate-700 dark:text-slate-300"
                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            }`}
          >
            <Sparkles
              className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                isSpeaking
                  ? "text-rose-500"
                  : isEssay
                  ? "text-purple-500"
                  : "text-amber-500"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <strong
                  className={
                    isSpeaking
                      ? "text-rose-700 dark:text-rose-400"
                      : isEssay
                      ? "text-purple-700 dark:text-purple-400"
                      : "text-slate-800 dark:text-slate-200"
                  }
                >
                  {isSpeaking
                    ? "Bài nói mẫu (Sample Answer):"
                    : isEssay
                    ? "Bài viết mẫu (Model Answer):"
                    : "Giải thích / Dẫn chứng:"}
                </strong>
                {(isSpeaking || isEssay) && sampleWordCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-white/80 dark:bg-slate-800 text-[10px] font-mono text-slate-500 border border-slate-200 dark:border-slate-700">
                    {sampleWordCount} từ
                  </span>
                )}
              </div>
              <p className="line-clamp-2 whitespace-pre-line">{q.explanation}</p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-600 hover:text-white font-heading font-bold text-[11px] flex items-center gap-1 transition-colors"
          title="Chỉnh sửa câu hỏi này"
        >
          <Edit2 className="w-3 h-3" />
          <span className="hidden sm:inline">Sửa</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          title="Xóa câu hỏi"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
