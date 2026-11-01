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
  const getLvl = (e: FilterableExamItem) => e.computedClover ?? e.hotLevel ?? 0;

  const highCount = exams.filter(
    (e) => getLvl(e) >= 3 || e.priority === "HIGH"
  ).length;
  const mediumCount = exams.filter(
    (e) => getLvl(e) === 2 || (getLvl(e) === 0 && e.priority === "MEDIUM")
  ).length;
  const lowCount = exams.filter(
    (e) => getLvl(e) === 1 || (getLvl(e) === 0 && e.priority === "LOW")
  ).length;

  const priorityOptions: Array<{ id: PriorityFilter; label: string }> = [
    { id: "all", label: `Tất cả (${exams.length})` },
    { id: "high", label: `☘️☘️☘️+ Siêu Hot (${highCount})` },
    ...(mediumCount > 0
      ? [{ id: "medium" as const, label: `☘️☘️ Hay ra (${mediumCount})` }]
      : []),
    ...(lowCount > 0
      ? [{ id: "low" as const, label: `☘️ Cơ bản (${lowCount})` }]
      : []),
  ];

  const statusOptions: Array<{ id: StatusFilter; label: string }> = [
    { id: "all", label: `Tất cả (${exams.length})` },
    {
      id: "not_started",
      label: `Chưa làm (${exams.filter((e) => e.status !== "completed").length})`,
    },
    {
      id: "completed",
      label: `Đã làm (${exams.filter((e) => e.status === "completed").length})`,
    },
  ];

  const sourceOptions: Array<{ id: SourceFilter; label: string }> = [
    { id: "all", label: `Tất cả (${exams.length})` },
    { id: "web", label: `Đề web (${exams.length})` },
    { id: "my", label: `Bộ đề của tôi (0)` },
  ];

  return (
    <div className="space-y-2.5 mb-8 text-xs">
      {/* Hàng 1: Lọc ưu tiên theo Độ Hot ☘️ */}
      {showPriorityRow && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground font-semibold w-24">
            Độ Hot ☘️:
          </span>
          {priorityOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilterPriority(item.id)}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                filterPriority === item.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Hàng 2: Trạng thái */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground font-semibold w-24">
          Trạng thái:
        </span>
        {statusOptions.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilterStatus(item.id)}
            className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
              filterStatus === item.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Hàng 3: Nguồn (ở Full Part) */}
      {activeTab === "full" && setFilterSource && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground font-semibold w-24">
            Nguồn:
          </span>
          {sourceOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilterSource(item.id)}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                filterSource === item.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

