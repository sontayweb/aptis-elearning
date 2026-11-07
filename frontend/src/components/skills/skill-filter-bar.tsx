"use client";

import React from "react";
import type { SkillTabId } from "@/hooks/use-skill-hub";

export type PriorityFilter = "all" | "high" | "medium" | "low";
export type StatusFilter = "all" | "not_started" | "completed";
export type SourceFilter = "all" | "web" | "my";

export interface FilterableExamItem {
  status: "not_started" | "in_progress" | "completed";
  hotLevel?: number;
  computedClover?: number;
  priority?: "HIGH" | "MEDIUM" | "LOW";
}

interface SkillFilterBarProps {
  exams: FilterableExamItem[];
  activeTab: SkillTabId;
  filterPriority: PriorityFilter;
  setFilterPriority: (val: PriorityFilter) => void;
  filterStatus: StatusFilter;
  setFilterStatus: (val: StatusFilter) => void;
  filterSource?: SourceFilter;
  setFilterSource?: (val: SourceFilter) => void;
  showPriorityRow?: boolean;
}

export function getExamCloverLevel(e: FilterableExamItem): number {
  return Number(e.computedClover ?? e.hotLevel ?? 0);
}

export function matchesCloverPriority(
  e: FilterableExamItem,
  filterPriority: PriorityFilter
): boolean {
  if (filterPriority === "all") return true;
  const lvl = getExamCloverLevel(e);
  if (filterPriority === "high") return lvl >= 4;
  if (filterPriority === "medium") return lvl === 3;
  return lvl <= 2;
}

export function SkillFilterBar({
  exams,
  activeTab,
  filterPriority,
  setFilterPriority,
  filterStatus,
  setFilterStatus,
  filterSource = "all",
  setFilterSource,
  showPriorityRow = true,
}: SkillFilterBarProps) {
  const highCount = exams.filter((e) => matchesCloverPriority(e, "high")).length;
  const mediumCount = exams.filter((e) => matchesCloverPriority(e, "medium")).length;
  const lowCount = exams.filter((e) => matchesCloverPriority(e, "low")).length;

  const priorityOptions: Array<{ id: PriorityFilter; label: string }> = [
    { id: "all", label: `Tất cả (${exams.length})` },
    ...(highCount > 0
      ? [{ id: "high" as const, label: `☘️ 4–5 Cỏ · Siêu Hot (${highCount})` }]
      : []),
    ...(mediumCount > 0
      ? [{ id: "medium" as const, label: `☘️ 3 Cỏ · Trọng tâm (${mediumCount})` }]
      : []),
    ...(lowCount > 0
      ? [{ id: "low" as const, label: `Đề luyện thêm (${lowCount})` }]
      : []),
  ];

  const statusOptions: Array<{ id: StatusFilter; label: string }> = [
    { id: "all", label: `Tất cả (${exams.length})` },
    {
      id: "not_started",
      label: `Chưa làm (${exams.filter((e) => e.status === "not_started").length})`,
    },
    {
      id: "completed",
      label: `Đã làm (${exams.filter((e) => e.status === "completed" || e.status === "in_progress").length})`,
    },
  ];

  const sourceOptions: Array<{ id: SourceFilter; label: string }> = [
    { id: "all", label: `Tất cả (${exams.length})` },
    { id: "web", label: `Đề web (${exams.length})` },
    { id: "my", label: `Bộ đề của tôi (0)` },
  ];

  return (
    <div className="space-y-3 mb-8 text-xs">
      {/* Hàng 1: Lọc ưu tiên theo Độ Hot ☘️ */}
      {showPriorityRow && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
          <span className="text-muted-foreground font-semibold text-[11px] sm:text-xs sm:w-24 shrink-0">
            Độ Hot ☘️:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap">
            {priorityOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilterPriority(item.id)}
                className={`px-3 py-1.5 sm:py-1 rounded-full font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap min-h-[34px] sm:min-h-[28px] ${
                  filterPriority === item.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hàng 2: Trạng thái */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
        <span className="text-muted-foreground font-semibold text-[11px] sm:text-xs sm:w-24 shrink-0">
          Trạng thái:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap">
          {statusOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilterStatus(item.id)}
              className={`px-3 py-1.5 sm:py-1 rounded-full font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap min-h-[34px] sm:min-h-[28px] ${
                filterStatus === item.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hàng 3: Nguồn (ở Full Part) */}
      {activeTab === "full" && setFilterSource && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
          <span className="text-muted-foreground font-semibold text-[11px] sm:text-xs sm:w-24 shrink-0">
            Nguồn:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap">
            {sourceOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilterSource(item.id)}
                className={`px-3 py-1.5 sm:py-1 rounded-full font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap min-h-[34px] sm:min-h-[28px] ${
                  filterSource === item.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

