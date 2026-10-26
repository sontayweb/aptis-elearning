"use client";

import React from "react";
import Link from "next/link";
import {
  Search,
  X,
  Edit2,
  Trash2,
  BookOpen,
  ExternalLink,
  Check,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { QuestionItem } from "./exam.types";

interface QuestionBankViewProps {
  questions: QuestionItem[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearchSubmit: () => void;
  questionTypeFilter: string;
  setQuestionTypeFilter: (type: string) => void;
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  skillFilter: string;
  partFilter: number | null;
  onEditQuestion: (q: QuestionItem) => void;
  onDeleteQuestion: (q: QuestionItem) => void;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  questions,
  loading,
  searchTerm,
  setSearchTerm,
  onSearchSubmit,
  questionTypeFilter,
  setQuestionTypeFilter,
  page,
  totalPages,
  totalCount,
  pageSize,
  setPage,
  setPageSize,
  skillFilter,
  partFilter,
  onEditQuestion,
  onDeleteQuestion,
}) => {
  return (
    <div className="space-y-4">
      {/* ── Advanced Live Search & Filter Bar for Questions ── */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearchSubmit();
              }
            }}
            placeholder={
              skillFilter !== "ALL" && partFilter !== null
                ? `🔍 Tìm câu hỏi trong ${skillFilter} Part ${partFilter} (nội dung, đáp án, tranh ảnh, mã ID, dán link)...`
                : skillFilter !== "ALL"
                ? `🔍 Tìm câu hỏi trong toàn bộ đề ${skillFilter} (nội dung, đáp án, tranh ảnh, mã ID)...`
                : "🔍 Tìm nhanh trong ngân hàng câu hỏi (nội dung, đáp án, tranh ảnh, bài đọc, mã ID)..."
            }
            className="w-full pl-10 pr-24 py-2.5 rounded-xl text-xs bg-slate-50/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-inner"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 rounded">
              Live Filter
            </span>
          </div>
        </div>

        {/* Quick Pill Filter Chips Bar for Question Types */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-heading font-semibold text-slate-400 dark:text-slate-500 mr-1 shrink-0">
              Dạng câu hỏi:
            </span>
            {[
              { value: "ALL", label: "Tất cả dạng" },
              { value: "SPEAKING_AUDIO", label: "🎙️ Speaking Audio" },
              { value: "MULTIPLE_CHOICE", label: "🔘 Trắc nghiệm" },
              { value: "GAP_FILL", label: "✏️ Điền từ" },
              { value: "MATCHING", label: "🔗 Nối thông tin" },
              { value: "ESSAY", label: "📝 Viết luận" },
              { value: "SHORT_TEXT", label: "📄 Đoạn ngắn" },
            ].map((chip) => {
              const isSelected = questionTypeFilter === chip.value;
              return (
                <button
                  key={chip.value}
                  onClick={() => {
                    setQuestionTypeFilter(chip.value);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-heading transition-all ${
                    isSelected
                      ? "bg-purple-600 text-white border border-purple-600 shadow-2xs font-semibold"
                      : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Detected UUID / Link Badge */}
          {searchTerm.match(
            /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
          ) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 animate-in fade-in">
              🎯 Đã nhận diện mã ID / Link câu hỏi
            </span>
          )}
        </div>
      </div>

      {/* Question Cards Container */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600 dark:text-purple-400" />
            <p className="text-xs text-slate-500">
              Đang tra cứu cơ sở dữ liệu câu hỏi...
            </p>
          </div>
        ) : questions.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-4">
            <HelpCircle className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <h4 className="font-heading font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
              Không tìm thấy câu hỏi phù hợp
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Hãy thử gõ từ khóa khác (ví dụ: &quot;choose&quot;, &quot;reading&quot;, &quot;library&quot;) hoặc đổi bộ lọc kỹ năng / Part ở phía trên.
            </p>
          </div>
        ) : (
          questions.map((q) => {
            let optionsList: string[] = [];
            if (Array.isArray(q.options)) {
              optionsList = q.options.map((o) => String(o));
            } else if (typeof q.options === "string") {
              try {
                const parsed = JSON.parse(q.options);
                if (Array.isArray(parsed))
                  optionsList = parsed.map((o) => String(o));
              } catch {
                // ignore
              }
            }

            return (
              <div
                key={q.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700/60 shadow-xs transition-all space-y-3"
              >
                {/* Header Strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-heading font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {q.part.exam?.skill || "EXAM"} · Part {q.part.partNumber}
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Câu #{q.questionNumber}
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                      {q.questionType}
                    </span>

                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                      Max: {q.maxScore} điểm
                    </span>
                  </div>

                  {/* Parent Exam Badge & Direct Quick Edit Action */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/exams/${q.part.exam.id}/edit`}
                      className="text-[11px] font-heading font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors max-w-xs truncate"
                      title="Bấm để mở trang biên soạn toàn bộ đề này"
                    >
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{q.part.exam.title}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </Link>

                    <button
                      onClick={() => onEditQuestion(q)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-heading font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Sửa câu này</span>
                    </button>

                    <button
                      onClick={() => onDeleteQuestion(q)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="Xóa câu hỏi này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Part Context / Passage Preview */}
                {q.part.passageText && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-h-24 overflow-y-auto">
                    <span className="font-heading font-bold text-slate-800 dark:text-slate-200 block mb-0.5 text-[10px] uppercase tracking-wider">
                      📖 Bài đọc / Ngữ cảnh Part ({q.part.title}):
                    </span>
                    {q.part.passageText}
                  </div>
                )}

                {/* Part Illustration Image (Speaking / Reading) */}
                {q.part.imageUrl && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={q.part.imageUrl}
                      alt="Part illustration"
                      className="h-16 w-24 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <span className="font-heading font-bold text-slate-800 dark:text-slate-200 block text-[11px] mb-0.5">
                        🖼️ Tranh ảnh minh họa ({q.part.title}):
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate block">
                        {q.part.imageUrl}
                      </span>
                      <a
                        href={q.part.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1 mt-0.5 font-semibold"
                      >
                        <span>Xem ảnh gốc</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Question Prompt */}
                <div className="text-xs font-heading font-semibold text-slate-900 dark:text-white leading-relaxed">
                  {q.prompt}
                </div>

                {/* Options Grid (If any) */}
                {optionsList.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {optionsList.map((opt, idx) => {
                      const isCorrect =
                        q.correctAnswer &&
                        (opt.trim().toLowerCase() ===
                          q.correctAnswer.trim().toLowerCase() ||
                          q.correctAnswer.trim() ===
                            String.fromCharCode(65 + idx) ||
                          opt.trim().startsWith(q.correctAnswer.trim()));
                      return (
                        <div
                          key={idx}
                          className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between border ${
                            isCorrect
                              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 font-semibold"
                              : "bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className="truncate">{opt}</span>
                          {isCorrect && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold ml-2 shrink-0">
                              <Check className="w-2.5 h-2.5" />
                              <span>Đáp án đúng</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Text Answer */}
                {optionsList.length === 0 && q.correctAnswer && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      Đáp án chuẩn: <strong>{q.correctAnswer}</strong>
                    </span>
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-heading block mb-0.5">
                        Lời giải thích chi tiết:
                      </strong>
                      {q.explanation}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Question Pagination */}
      {questions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-xs">
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalCount}
            pageSize={pageSize}
            pageSizeOptions={[10, 15, 25, 50]}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            itemName="câu hỏi"
          />
        </div>
      )}
    </div>
  );
};
