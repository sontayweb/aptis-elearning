"use client";

import React, { useState } from "react";
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
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { ExamPartImageGallery } from "@/components/exam-part-image-gallery";
import { QuestionItem, detectAptisTaskMeta } from "./exam.types";

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
  // Chế độ xem: "CARDS" (Thẻ chi tiết) hoặc "TABLE" (Bảng thu gọn)
  const [layoutMode, setLayoutMode] = useState<"CARDS" | "TABLE">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aptis_admin_qb_view_mode");
      if (saved === "TABLE" || saved === "CARDS") return saved;
    }
    return "CARDS";
  });

  // Trạng thái thu gọn/mở rộng từng câu hỏi (Accordion)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Lưu tùy chọn chế độ xem vào localStorage
  const handleLayoutChange = (mode: "CARDS" | "TABLE") => {
    setLayoutMode(mode);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("aptis_admin_qb_view_mode", mode);
      } catch {}
    }
  };

  // Toggle thu gọn/mở rộng một câu hỏi
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Mở rộng tất cả / Thu gọn tất cả
  const areAllExpanded =
    questions.length > 0 && questions.every((q) => expandedIds.has(q.id));

  const toggleExpandAll = () => {
    if (areAllExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(questions.map((q) => q.id)));
    }
  };

  // Helper parse danh sách options (hỗ trợ cả mảng chuỗi và object SENTENCE_ORDER)
  const parseOptions = (options: any): string[] => {
    if (Array.isArray(options)) {
      return options.map((o) => String(o));
    } else if (typeof options === "string") {
      try {
        const parsed = JSON.parse(options);
        if (Array.isArray(parsed)) return parsed.map((o) => String(o));
      } catch {}
    } else if (options && typeof options === "object" && !Array.isArray(options)) {
      const fixed = options.fixedSentence ? [String(options.fixedSentence)] : [];
      const rest = Array.isArray(options.sentences)
        ? options.sentences.map((s: any) => String(s?.text || s || ""))
        : [];
      return [...fixed, ...rest];
    }
    return [];
  };

  return (
    <div className="space-y-4">
      {/* ── 1. Advanced Live Search & Filter Bar ── */}
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

        {/* Filter Chips theo dạng câu hỏi */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-heading font-semibold text-slate-400 dark:text-slate-500 mr-1 shrink-0">
              Dạng câu hỏi:
            </span>
            {[
              { value: "ALL", label: "Tất cả dạng" },
              { value: "SPEAKING_AUDIO", label: "🎙️ Speaking Audio" },
              { value: "MULTIPLE_CHOICE", label: "🔘 Trắc nghiệm" },
              { value: "GAP_FILL", label: "✏️ Điền từ [gap]" },
              { value: "SENTENCE_ORDER", label: "🔢 Sắp xếp câu (Reading P2)" },
              { value: "MATCHING", label: "🔗 Nối thông tin" },
              { value: "ESSAY", label: "📝 Viết luận / Email" },
              { value: "SHORT_TEXT", label: "📄 Trả lời ngắn" },
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

          {searchTerm.match(
            /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
          ) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 animate-in fade-in">
              🎯 Đã nhận diện mã ID / Link câu hỏi
            </span>
          )}
        </div>
      </div>

      {/* ── 2. Toolbar: Thống kê + Nút chuyển chế độ xem (Cards ↔ Table) + Thu gọn/Mở rộng ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-heading font-bold text-slate-800 dark:text-slate-200">
            Kết quả tra cứu câu hỏi:
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            {totalCount} câu
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút Thu gọn / Mở rộng toàn bộ */}
          {questions.length > 0 && (
            <button
              onClick={toggleExpandAll}
              className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 text-xs font-heading font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
              title={
                areAllExpanded
                  ? "Thu gọn tất cả câu hỏi"
                  : "Mở rộng xem toàn bộ chi tiết"
              }
            >
              {areAllExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-purple-600" />
                  <span className="hidden sm:inline">Thu gọn tất cả</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mở rộng tất cả</span>
                </>
              )}
            </button>
          )}

          {/* Segmented Control: Dạng Thẻ ↔ Dạng Bảng */}
          <div className="p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-0.5">
            <button
              onClick={() => handleLayoutChange("CARDS")}
              className={`px-3 py-1 rounded-lg text-xs font-heading transition-all flex items-center gap-1.5 ${
                layoutMode === "CARDS"
                  ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Dạng Thẻ chi tiết (xem trực tiếp ảnh, bài đọc & đáp án)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Dạng Thẻ</span>
            </button>

            <button
              onClick={() => handleLayoutChange("TABLE")}
              className={`px-3 py-1 rounded-lg text-xs font-heading transition-all flex items-center gap-1.5 ${
                layoutMode === "TABLE"
                  ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Dạng Bảng thu gọn (gọn gàng, dễ scan hàng loạt)"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Dạng Bảng</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Nội dung hiển thị (Loading / Empty / Cards / Table) ── */}
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
      ) : layoutMode === "TABLE" ? (
        /* ════════════ DẠNG BẢNG (COMPACT TABLE WITH ACCORDION) ════════════ */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-heading">
                  <th className="py-3 px-3 text-center w-10"></th>
                  <th className="py-3 px-3 font-semibold text-center w-16">#STT</th>
                  <th className="py-3 px-3 font-semibold w-28">Kỹ năng</th>
                  <th className="py-3 px-3 font-semibold w-32">Dạng câu</th>
                  <th className="py-3 px-4 font-semibold">Nội dung câu hỏi & ngữ cảnh</th>
                  <th className="py-3 px-3 font-semibold w-36">Đáp án chuẩn</th>
                  <th className="py-3 px-4 font-semibold w-48">Đề thi cha</th>
                  <th className="py-3 px-3 font-semibold text-right w-16">Điểm</th>
                  <th className="py-3 px-4 font-semibold text-right w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {questions.map((q) => {
                  const isExpanded = expandedIds.has(q.id);
                  const optionsList = parseOptions(q.options);
                  const taskMeta = detectAptisTaskMeta(
                    q.part.exam?.skill,
                    q.part.partNumber,
                    q.part.title,
                    q.questionType
                  );
                  const isSentenceOrder = q.questionType === "SENTENCE_ORDER";

                  return (
                    <React.Fragment key={q.id}>
                      <tr
                        onClick={() => toggleExpand(q.id)}
                        className={`hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-colors cursor-pointer group ${
                          isExpanded ? "bg-purple-50/30 dark:bg-purple-950/20" : ""
                        }`}
                      >
                        {/* Accordion Chevron */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(q.id);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-purple-600 transition-colors"
                            title={isExpanded ? "Thu gọn" : "Xem chi tiết"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-purple-600" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 group-hover:text-purple-600" />
                            )}
                          </button>
                        </td>

                        {/* #STT */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          #{q.questionNumber}
                        </td>

                        {/* Kỹ năng & Part */}
                        <td className="py-3 px-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-heading font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 whitespace-nowrap"
                            title={taskMeta.taskLabel}
                          >
                            {q.part.exam?.skill || "EXAM"} · P{taskMeta.logicalPart}
                          </span>
                        </td>

                        {/* Dạng câu */}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 whitespace-nowrap">
                            {q.questionType}
                          </span>
                        </td>

                        {/* Prompt & Context Badges */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 max-w-md lg:max-w-xl">
                            <span className="font-heading font-semibold text-slate-900 dark:text-white line-clamp-1">
                              {q.prompt}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9.5px] text-slate-500 font-medium">
                                {q.part.title}
                              </span>
                              {q.part.passageText && (
                                <span className="inline-flex items-center gap-1 text-[9.5px] font-heading text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  <FileText className="w-2.5 h-2.5 text-slate-400" />
                                  <span>Bài đọc</span>
                                </span>
                              )}
                              {q.part.imageUrl && (
                                <span className="inline-flex items-center gap-1 text-[9.5px] font-heading text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.5 rounded border border-purple-200/60 dark:border-purple-800/60">
                                  <ImageIcon className="w-2.5 h-2.5" />
                                  <span>Có tranh</span>
                                </span>
                              )}
                              {optionsList.length > 0 && (
                                <span className="text-[9.5px] text-slate-400 font-mono">
                                  {isSentenceOrder
                                    ? `${optionsList.length} câu sắp xếp`
                                    : `${optionsList.length} lựa chọn`}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Đáp án chuẩn */}
                        <td className="py-3 px-3">
                          {isSentenceOrder && optionsList.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono font-bold text-[10px]">
                              🔢 {optionsList.length} câu thứ tự chuẩn
                            </span>
                          ) : q.correctAnswer && q.correctAnswer !== "0" ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono font-bold text-[10.5px] max-w-[130px] truncate"
                              title={q.correctAnswer}
                            >
                              <Check className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{q.correctAnswer}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">
                              {q.explanation ? "Có bài mẫu" : "Tự luận / Nói"}
                            </span>
                          )}
                        </td>

                        {/* Đề thi trực thuộc */}
                        <td className="py-3 px-4">
                          <Link
                            href={`/admin/exams/${q.part.exam.id}/edit`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] font-heading font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors max-w-[180px] truncate"
                            title="Bấm để mở trang biên soạn đề này"
                          >
                            <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{q.part.exam.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
                          </Link>
                        </td>

                        {/* Max Score */}
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-600 dark:text-slate-400">
                          {q.maxScore}đ
                        </td>

                        {/* Thao tác */}
                        <td
                          className="py-3 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onEditQuestion(q)}
                              className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors"
                              title="Sửa câu này"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteQuestion(q)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                              title="Xóa câu này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Accordion Expand Panel trong Bảng */}
                      {isExpanded && (
                        <tr className="bg-slate-50/60 dark:bg-slate-800/30 border-b border-slate-200/80 dark:border-slate-800">
                          <td colSpan={9} className="p-4 sm:p-5">
                            <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                              {/* Part Passage Preview */}
                              {q.part.passageText && (
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-h-32 overflow-y-auto">
                                  <span className="font-heading font-bold text-slate-800 dark:text-slate-200 block mb-0.5 text-[10px] uppercase tracking-wider">
                                    📖 Bài đọc / Ngữ cảnh Part ({q.part.title}):
                                  </span>
                                  {q.part.passageText}
                                </div>
                              )}

                              {/* Part Illustration Image (Speaking / Reading) */}
                              <ExamPartImageGallery
                                imageUrl={q.part.imageUrl}
                                title={q.part.title}
                                variant="admin-preview"
                              />

                              {/* Full Question Prompt */}
                              <div className="text-xs font-heading font-semibold text-slate-900 dark:text-white leading-relaxed">
                                {q.prompt}
                              </div>

                              {/* Options Grid */}
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
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ════════════ DẠNG THẺ (RICH CARDS WITH PER-CARD ACCORDION) ════════════ */
        <div className="space-y-3">
          {questions.map((q) => {
            const isExpanded = expandedIds.has(q.id);
            const optionsList = parseOptions(q.options);
            const taskMeta = detectAptisTaskMeta(
              q.part.exam?.skill,
              q.part.partNumber,
              q.part.title,
              q.questionType
            );
            const isSentenceOrder = q.questionType === "SENTENCE_ORDER";

            return (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700/60 shadow-xs transition-all overflow-hidden"
              >
                {/* Header Strip (Bấm vào để thu gọn/mở rộng thẻ) */}
                <div
                  onClick={() => toggleExpand(q.id)}
                  className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="p-1 text-slate-400 hover:text-purple-600 transition-colors">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-purple-600" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-heading font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {taskMeta.taskLabel}
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold">
                      Câu #{q.questionNumber}
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                      {q.questionType}
                    </span>

                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                      Max: {q.maxScore} điểm
                    </span>

                    {/* Preview ngắn câu hỏi khi thẻ đang thu gọn */}
                    {!isExpanded && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-xs sm:max-w-md hidden md:inline ml-2">
                        — {q.prompt}
                      </span>
                    )}
                  </div>

                  {/* Hành động nhanh trên Header */}
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
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

                {/* Thân thẻ (Mở rộng hoặc chỉ hiển thị khi expand hoặc mặc định) */}
                {/* Khi mở rộng hoặc thẻ mặc định hiển thị: có thể thu gọn qua nút chevron */}
                {!isExpanded ? (
                  /* Thu gọn: hiển thị preview tóm tắt nhanh */
                  <div
                    onClick={() => toggleExpand(q.id)}
                    className="px-5 py-3 text-xs flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/30 dark:hover:bg-slate-800/20"
                  >
                    <p className="text-xs font-heading font-semibold text-slate-900 dark:text-white truncate flex-1">
                      {q.prompt}
                    </p>
                    {q.correctAnswer && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold shrink-0">
                        <Check className="w-2.5 h-2.5" />
                        <span>Key: {q.correctAnswer}</span>
                      </span>
                    )}
                  </div>
                ) : (
                  /* Mở rộng chi tiết */
                  <div className="p-5 pt-4 space-y-3">
                    {/* Part Context / Passage Preview */}
                    {q.part.passageText && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-h-28 overflow-y-auto">
                        <span className="font-heading font-bold text-slate-800 dark:text-slate-200 block mb-0.5 text-[10px] uppercase tracking-wider">
                          📖 Bài đọc / Ngữ cảnh Part ({q.part.title}):
                        </span>
                        {q.part.passageText}
                      </div>
                    )}

                    {/* Part Illustration Image (Speaking / Reading) */}
                    <ExamPartImageGallery
                      imageUrl={q.part.imageUrl}
                      title={q.part.title}
                      variant="admin-preview"
                    />

                    {/* Question Prompt */}
                    <div className="text-xs font-heading font-semibold text-slate-900 dark:text-white leading-relaxed">
                      {q.prompt}
                    </div>

                    {/* Options Grid */}
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
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── 4. Phân trang câu hỏi ── */}
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

