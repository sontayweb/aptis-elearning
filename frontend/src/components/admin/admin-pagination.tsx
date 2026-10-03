"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  itemName?: string;
  className?: string;
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 15,
  pageSizeOptions = [10, 15, 25, 50],
  onPageChange,
  onPageSizeChange,
  itemName = "mục",
  className = "",
}: AdminPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page pills with ellipsis for quick navigation
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (safeTotalPages <= 7) {
      for (let i = 1; i <= safeTotalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(safeTotalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < safeTotalPages - 2) pages.push("...");
      if (!pages.includes(safeTotalPages)) pages.push(safeTotalPages);
    }
    return pages;
  };

  return (
    <div
      className={`py-3.5 px-4 sm:px-6 bg-slate-50/70 border-t border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500 ${className}`}
    >
      {/* Left: Items counter & Page size selector */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          Hiển thị{" "}
          <span className="font-bold text-slate-900 font-mono">
            {totalItems > 0 ? `${startItem}-${endItem}` : 0}
          </span>{" "}
          / <span className="font-bold text-slate-900 font-mono">{totalItems}</span> {itemName}
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
            <span className="text-[11px] text-slate-400">Số dòng:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Quick Page Selector & Navigation controls */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Quick Jump Dropdown */}
        {safeTotalPages > 1 && (
          <div className="flex items-center gap-1 mr-1">
            <span className="text-[11px] text-slate-400">Đến:</span>
            <select
              value={currentPage}
              onChange={(e) => onPageChange(Number(e.target.value))}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
            >
              {Array.from({ length: safeTotalPages }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p}>
                  Trang {p}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* First page (ChevronsLeft) */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          title="Về trang đầu tiên"
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors shadow-2xs cursor-pointer"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous page (ChevronLeft) */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          title="Trang trước"
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors shadow-2xs cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page Pills */}
        <div className="hidden sm:flex items-center gap-1 px-0.5">
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 text-slate-400 font-mono select-none"
                >
                  …
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(Number(p))}
                className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-slate-900 text-white border border-slate-900 shadow-2xs"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Fallback compact text for mobile */}
        <span className="sm:hidden font-mono font-bold text-slate-800 px-1.5 text-xs">
          {currentPage}/{safeTotalPages}
        </span>

        {/* Next page (ChevronRight) */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
          disabled={currentPage >= safeTotalPages}
          title="Trang tiếp"
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors shadow-2xs cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last page (ChevronsRight) */}
        <button
          type="button"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={currentPage >= safeTotalPages}
          title="Đến trang cuối cùng"
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors shadow-2xs cursor-pointer"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
