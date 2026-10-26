"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  X,
  BookOpen,
  RefreshCw,
  Clock,
  Crown,
  FileText,
  MoreHorizontal,
  Play,
  Eye,
  Edit2,
  Copy,
  Trash2,
  Flame,
  Star,
} from "lucide-react";
import { AdminPagination } from "@/components/admin/admin-pagination";
import AdminTableCard from "@/components/admin/admin-table-card";
import { SortableHeader, SortState } from "@/components/admin/sortable-header";
import { ExamItem, ExamSortKey } from "./exam.types";

interface ExamListViewProps {
  exams: ExamItem[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearchSubmit: () => void;
  hotFilter: string;
  setHotFilter: (filter: string) => void;
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  skillFilter: string;
  partFilter: number | null;
  sortState: SortState<ExamSortKey>;
  onSort: (key: ExamSortKey) => void;
  onTogglePublished: (exam: ExamItem) => void;
  onTogglePro: (exam: ExamItem) => void;
  onCycleHotLevel: (exam: ExamItem) => void;
  onDuplicateExam: (exam: ExamItem) => void;
  onOpenEdit: (exam: ExamItem) => void;
  onPreviewExam: (exam: ExamItem) => void;
  onDeleteExam: (exam: ExamItem) => void;
  onSearchInQuestions: (term: string) => void;
  getSkillBadge: (skill: string) => {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    className: string;
  };
}

export const ExamListView: React.FC<ExamListViewProps> = ({
  exams,
  loading,
  searchTerm,
  setSearchTerm,
  onSearchSubmit,
  hotFilter,
  setHotFilter,
  page,
  totalPages,
  totalCount,
  pageSize,
  setPage,
  setPageSize,
  skillFilter,
  partFilter,
  sortState,
  onSort,
  onTogglePublished,
  onTogglePro,
  onCycleHotLevel,
  onDuplicateExam,
  onOpenEdit,
  onPreviewExam,
  onDeleteExam,
  onSearchInQuestions,
  getSkillBadge,
}) => {
  const [openMenuExamId, setOpenMenuExamId] = useState<string | null>(null);

  // Close row menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-row-menu]")) {
        setOpenMenuExamId(null);
      }
    };
    if (openMenuExamId) {
      document.addEventListener("click", handleOutsideClick);
      return () => document.removeEventListener("click", handleOutsideClick);
    }
  }, [openMenuExamId]);

  const getExamTakeUrl = (exam: { id: string; skill?: string }) => {
    switch (exam.skill) {
      case "READING":
        return `/reading/${exam.id}`;
      case "LISTENING":
        return `/listening/${exam.id}`;
      case "WRITING":
        return `/writing/${exam.id}`;
      case "SPEAKING":
        return `/speaking/${exam.id}`;
      case "FULL_TEST":
      default:
        return `/thi-thu/${exam.id}`;
    }
  };

  // Local sorting
  const sortedExams = [...exams].sort((a, b) => {
    const key = sortState.key;
    const aVal = a[key] ?? "";
    const bVal = b[key] ?? "";
    if (aVal < bVal) return sortState.order === "asc" ? -1 : 1;
    if (aVal > bVal) return sortState.order === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* ── Advanced Live Search & Filter Bar ── */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" />
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
                ? `🔍 Tìm trong ${skillFilter} Part ${partFilter} (tên đề, số đề vd: 010, so sánh, tranh, mã ID, dán link học viên)...`
                : skillFilter !== "ALL"
                ? `🔍 Tìm trong toàn bộ đề ${skillFilter} (tên đề, số đề vd: 010, mã ID, dán link học viên)...`
                : "🔍 Tìm nhanh đề thi (tên đề, số đề vd: 010, mã UUID, từ khóa câu hỏi, dán link học viên)..."
            }
            className="w-full pl-10 pr-24 py-2.5 rounded-xl text-xs bg-slate-50/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
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
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 rounded">
              Live Filter
            </span>
          </div>
        </div>

        {/* Quick Pill Filter Chips Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-heading font-semibold text-slate-400 dark:text-slate-500 mr-1 shrink-0">
              Bộ lọc Hot:
            </span>
            {[
              { value: "ALL", label: "🔥 Tất cả mức độ" },
              {
                value: "HOT_3",
                label: "🔥 3⭐ Đề tủ",
                activeClass:
                  "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 font-bold",
              },
              {
                value: "HOT_2",
                label: "⭐⭐ 2⭐ Hot",
                activeClass:
                  "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-bold",
              },
              {
                value: "HOT_1",
                label: "⭐ 1⭐ Ôn tập",
                activeClass:
                  "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 font-bold",
              },
              {
                value: "HOT_0",
                label: "⚪ Chưa gán sao",
                activeClass:
                  "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-bold",
              },
            ].map((chip) => {
              const isSelected = hotFilter === chip.value;
              return (
                <button
                  key={chip.value}
                  onClick={() => {
                    setHotFilter(chip.value);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-heading transition-all ${
                    isSelected
                      ? chip.activeClass ||
                        "bg-blue-600 text-white border border-blue-600 shadow-2xs font-semibold"
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
              🎯 Đã nhận diện mã ID / Link đề thi
            </span>
          )}
        </div>

        {/* Smart Banner: Gợi ý tìm & sửa trực tiếp câu hỏi nếu có từ khóa */}
        {searchTerm.trim() && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-2.5 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 rounded-xl text-xs text-violet-900 dark:text-violet-200 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
                <Search className="w-3.5 h-3.5" />
              </span>
              <span>
                Bạn đang tìm: <strong>&quot;{searchTerm.trim()}&quot;</strong>. Bạn
                muốn tìm câu hỏi hay muốn vào sửa ảnh/đáp án chi tiết?
              </span>
            </div>
            <button
              onClick={() => onSearchInQuestions(searchTerm.trim())}
              className="shrink-0 px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-heading font-semibold text-xs shadow-xs transition-colors flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Tìm trong Ngân hàng câu hỏi →</span>
            </button>
          </div>
        )}
      </div>

      {/* Table Container */}
      <AdminTableCard
        header={
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                Danh sách Bộ đề thi Aptis
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Hiển thị {exams.length} đề thi phù hợp trong hệ thống
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {totalCount} Đề
            </span>
          </div>
        }
        pagination={
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
            itemName="đề thi"
          />
        }
      >
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-heading">
              <SortableHeader
                field="title"
                title="Tên đề thi"
                currentSort={sortState}
                onSort={onSort}
                align="left"
              />
              <SortableHeader
                field="skill"
                title="Kỹ năng"
                currentSort={sortState}
                onSort={onSort}
                align="left"
              />
              <SortableHeader
                field="hotLevel"
                title="Mức Hot"
                currentSort={sortState}
                onSort={onSort}
                align="center"
              />
              <SortableHeader
                field="durationMinutes"
                title="Thời lượng"
                currentSort={sortState}
                onSort={onSort}
                align="right"
              />
              <SortableHeader
                field="isPublished"
                title="Trạng thái"
                currentSort={sortState}
                onSort={onSort}
                align="center"
              />
              <SortableHeader
                field="isPro"
                title="Gói"
                currentSort={sortState}
                onSort={onSort}
                align="center"
              />
              <SortableHeader
                field="attemptsCount"
                title="Lượt thi"
                currentSort={sortState}
                onSort={onSort}
                align="right"
              />
              <th className="py-3.5 px-4 sm:px-6 text-right pr-6">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-900 dark:text-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-16 text-center text-slate-400 dark:text-slate-500"
                >
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-600 dark:text-slate-400" />
                  Đang tải danh sách đề thi...
                </td>
              </tr>
            ) : sortedExams.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-16 text-center text-slate-400 dark:text-slate-500 font-normal"
                >
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  Không tìm thấy đề thi nào phù hợp với bộ lọc kỹ năng / part
                  hiện tại.
                </td>
              </tr>
            ) : (
              sortedExams.map((exam) => {
                const badge = getSkillBadge(exam.skill);
                const SkillIcon = badge.icon;
                return (
                  <tr
                    key={exam.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Title & Parts Chips */}
                    <td className="py-3.5 px-4 sm:px-6 max-w-md text-left">
                      <Link
                        href={`/admin/exams/${exam.id}/edit`}
                        className="font-heading font-bold text-slate-900 dark:text-white text-xs hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors block"
                        title="Nhấp để mở trang biên soạn nội dung câu hỏi"
                      >
                        {exam.title}
                      </Link>
                      {exam.description && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-normal">
                          {exam.description}
                        </div>
                      )}

                      {/* Dynamic Part Chips */}
                      {exam.parts && exam.parts.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-2">
                          {exam.parts.map((p) => (
                            <span
                              key={p.id}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                                partFilter === p.partNumber
                                  ? "bg-purple-100 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-bold"
                                  : "bg-slate-100/70 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-400"
                              }`}
                              title={`${p.title} (${p.questionsCount} câu hỏi)`}
                            >
                              <span>P{p.partNumber}</span>
                              <span className="text-slate-400">·</span>
                              <span>{p.questionsCount}q</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Skill */}
                    <td className="py-3.5 px-4 text-left">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold border ${badge.className}`}
                      >
                        <SkillIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    </td>

                    {/* Hot Level */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onCycleHotLevel(exam)}
                        className="inline-flex items-center gap-1 rounded-full text-[10px] font-heading font-bold border-transparent transition-all hover:scale-105 active:scale-95"
                        title="Bấm để đổi nhanh mức độ hot (0⭐ -> 1⭐ -> 2⭐ -> 3⭐)"
                      >
                        {exam.hotLevel === 3 ? (
                          <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 px-2 py-0.5 rounded-full">
                            <Flame className="w-3 h-3 text-rose-500 fill-rose-500" />
                            <span>3⭐ Đề tủ</span>
                          </span>
                        ) : exam.hotLevel === 2 ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>2⭐ Hot</span>
                          </span>
                        ) : exam.hotLevel === 1 ? (
                          <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3 text-blue-500 fill-blue-500" />
                            <span>1⭐ Ôn tập</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-normal">
                            + Gán sao
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300 font-medium">
                        <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span>{exam.durationMinutes}p</span>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {exam.partsCount} phần · {exam.questionsCount} câu
                      </div>
                    </td>

                    {/* Published Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onTogglePublished(exam)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold border transition-all ${
                          exam.isPublished
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                        title="Bấm để bật/tắt hiển thị đề thi cho học viên"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            exam.isPublished ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        <span>{exam.isPublished ? "Xuất bản" : "Bản nháp"}</span>
                      </button>
                    </td>

                    {/* Pro Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onTogglePro(exam)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold border transition-all ${
                          exam.isPro
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 hover:bg-amber-100 font-bold"
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                        title="Bấm để chuyển đổi giữa VIP PRO và Miễn phí"
                      >
                        {exam.isPro ? (
                          <>
                            <Crown className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>VIP PRO</span>
                          </>
                        ) : (
                          <span>Miễn phí</span>
                        )}
                      </button>
                    </td>

                    {/* Attempts */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {exam.attemptsCount}
                      </span>{" "}
                      <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                        lượt
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 sm:px-6 text-right pr-6 relative">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/exams/${exam.id}/edit`}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 font-heading font-semibold text-xs transition-colors shadow-2xs flex items-center gap-1"
                          title="Mở trình soạn thảo câu hỏi & Parts"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Biên soạn</span>
                        </Link>

                        {/* 3-Dot Dropdown */}
                        <div className="relative" data-row-menu>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuExamId(
                                openMenuExamId === exam.id ? null : exam.id
                              );
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            title="Thao tác khác"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {openMenuExamId === exam.id && (
                            <div
                              onClick={() => setOpenMenuExamId(null)}
                              className="absolute right-0 mt-1 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1 z-50 text-xs text-left animate-in fade-in zoom-in-95"
                            >
                              <Link
                                href={getExamTakeUrl(exam)}
                                target="_blank"
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Play className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Làm thử bài thi</span>
                              </Link>

                              <button
                                type="button"
                                onClick={() => onSearchInQuestions(exam.title)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                              >
                                <Search className="w-3.5 h-3.5 text-purple-500" />
                                <span>Tìm câu hỏi đề này</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onPreviewExam(exam)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>Xem trước cấu trúc</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onOpenEdit(exam)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                <span>Sửa cấu hình nhanh</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onDuplicateExam(exam)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                              >
                                <Copy className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Nhân bản đề thi</span>
                              </button>

                              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                              <button
                                type="button"
                                onClick={() => onDeleteExam(exam)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xóa đề thi</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </AdminTableCard>
    </div>
  );
};
