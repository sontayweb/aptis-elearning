"use client";

import React from "react";
import {
  BookOpen,
  Search,
  Layers,
  SlidersHorizontal,
  Headphones,
  BookMarked,
  Mic,
  PenTool,
  Sparkles,
  CheckCircle2,
  X,
  RefreshCw,
} from "lucide-react";
import { SKILL_PARTS_INFO } from "./exam.types";

interface ExamFilterBarProps {
  viewMode: "EXAMS" | "QUESTIONS";
  onViewModeChange: (mode: "EXAMS" | "QUESTIONS") => void;
  skillFilter: string;
  onSkillChange: (skill: string) => void;
  partFilter: number | null;
  onPartChange: (part: number | null) => void;
  totalExams: number;
  totalQuestions: number;
  loading: boolean;
  onRefresh: () => void;
  onResetFilters: () => void;
}

export const ExamFilterBar: React.FC<ExamFilterBarProps> = ({
  viewMode,
  onViewModeChange,
  skillFilter,
  onSkillChange,
  partFilter,
  onPartChange,
  totalExams,
  totalQuestions,
  loading,
  onRefresh,
  onResetFilters,
}) => {
  const currentSkillParts =
    skillFilter !== "ALL" && SKILL_PARTS_INFO[skillFilter]
      ? SKILL_PARTS_INFO[skillFilter]
      : [];

  const skillTabs = [
    { id: "ALL", label: "Tất cả", sub: "", icon: BookMarked, activeBg: "bg-slate-900 text-white dark:bg-white dark:text-slate-900" },
    { id: "LISTENING", label: "Nghe", sub: "Listening", icon: Headphones, activeBg: "bg-blue-600 text-white shadow-blue-500/20" },
    { id: "READING", label: "Đọc", sub: "Reading", icon: BookMarked, activeBg: "bg-emerald-600 text-white shadow-emerald-500/20" },
    { id: "WRITING", label: "Viết", sub: "Writing", icon: PenTool, activeBg: "bg-rose-600 text-white shadow-rose-500/20" },
    { id: "SPEAKING", label: "Nói", sub: "Speaking", icon: Mic, activeBg: "bg-amber-500 text-white shadow-amber-500/20" },
    { id: "FULL_TEST", label: "Full Test", sub: "4 kỹ năng", icon: Sparkles, activeBg: "bg-purple-600 text-white shadow-purple-500/20" },
  ] as const;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Row 1: View Mode + Context & Quick Actions */}
      <div className="p-3 sm:px-4 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl shrink-0 w-fit">
          <button
            onClick={() => onViewModeChange("EXAMS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all flex items-center gap-1.5 ${
              viewMode === "EXAMS"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Đề thi</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                viewMode === "EXAMS"
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                  : "bg-slate-200/80 dark:bg-slate-700 text-slate-500"
              }`}
            >
              {totalExams}
            </span>
          </button>
          <button
            onClick={() => onViewModeChange("QUESTIONS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all flex items-center gap-1.5 ${
              viewMode === "QUESTIONS"
                ? "bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Ngân hàng câu hỏi</span>
            {totalQuestions > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  viewMode === "QUESTIONS"
                    ? "bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400"
                    : "bg-slate-200/80 dark:bg-slate-700 text-slate-500"
                }`}
              >
                {totalQuestions}
              </span>
            )}
          </button>
        </div>

        {/* Quick Refresh & Clear filter */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {(skillFilter !== "ALL" || partFilter !== null) && (
            <button
              onClick={onResetFilters}
              className="text-[11px] font-heading font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
              title="Khôi phục về tất cả"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Row 2: Skill Tabs (Cha) — Segmented Control thanh lịch */}
      <div className="px-3 sm:px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[10.5px] font-heading font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
          <Layers className="w-3 h-3" />
          Kỹ năng:
        </span>
        {skillTabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = skillFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSkillChange(tab.id)}
              className={`flex-none px-3 py-1.5 rounded-xl font-heading text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isActive
                  ? `${tab.activeBg} shadow-xs`
                  : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <TabIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              {tab.sub && (
                <span className={`text-[9.5px] font-normal ${isActive ? "opacity-80" : "opacity-50"}`}>
                  ({tab.sub})
                </span>
              )}
              {isActive && <CheckCircle2 className="w-3 h-3 ml-0.5 opacity-90" />}
            </button>
          );
        })}
      </div>

      {/* Row 3: Cascading Part Pills (Con) — CHỈ XUẤT HIỆN KHI skillFilter !== "ALL" */}
      {skillFilter !== "ALL" && currentSkillParts.length > 0 && (
        <div className="px-3 sm:px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="text-[10.5px] font-heading font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />
            Phần thi:
          </span>

          {/* Tất cả Part */}
          <button
            onClick={() => onPartChange(null)}
            className={`flex-none px-3 py-1 rounded-lg text-xs font-heading font-semibold transition-all ${
              partFilter === null
                ? "bg-violet-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80"
            }`}
          >
            Tất cả Part
          </button>

          {/* Các Part cụ thể */}
          {currentSkillParts.map((part) => {
            const isSelected = partFilter === part.partNumber;
            const cleanName = part.name.replace(/Part \d+:\s*/, "");
            return (
              <button
                key={part.partNumber}
                onClick={() => onPartChange(part.partNumber)}
                className={`flex-none px-3 py-1 rounded-lg text-xs font-heading transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-violet-600 text-white font-bold shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-950/40 dark:hover:text-violet-300 border border-slate-200/80 dark:border-slate-700/80"
                }`}
                title={part.desc}
              >
                <span className="font-bold">Part {part.partNumber}</span>
                <span className="opacity-80 font-normal">· {cleanName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {part.badge}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
