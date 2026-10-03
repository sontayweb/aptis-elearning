"use client";

import React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

export interface SortState<T extends string = string> {
  key: T;
  order: "asc" | "desc" | null;
}

interface SortableHeaderProps<T extends string = string> {
  field: T;
  title: string;
  currentSort: SortState<T>;
  onSort: (field: T) => void;
  align?: "left" | "center" | "right";
  className?: string;
  children?: React.ReactNode;
}

export function SortableHeader<T extends string = string>({
  field,
  title,
  currentSort,
  onSort,
  align = "left",
  className = "",
  children,
}: SortableHeaderProps<T>) {
  const isActive = currentSort.key === field && currentSort.order !== null;
  const isAsc = isActive && currentSort.order === "asc";
  const isDesc = isActive && currentSort.order === "desc";

  const alignClass =
    align === "right"
      ? "justify-end text-right"
      : align === "center"
      ? "justify-center text-center"
      : "justify-start text-left";

  return (
    <th
      onClick={() => onSort(field)}
      className={`py-3.5 px-4 cursor-pointer select-none transition-colors group hover:text-slate-900 ${className}`}
      title={`Bấm để sắp xếp theo ${title}`}
    >
      <div className={`flex items-center gap-1.5 ${alignClass}`}>
        <span>{children || title}</span>
        <span
          className={`shrink-0 transition-colors ${
            isActive ? "text-primary" : "text-slate-300 group-hover:text-slate-500"
          }`}
        >
          {isAsc ? (
            <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : isDesc ? (
            <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-60" />
          )}
        </span>
      </div>
    </th>
  );
}
