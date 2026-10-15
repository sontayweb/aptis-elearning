"use client";

import { ReactNode } from "react";
import { SearchX, RefreshCw } from "lucide-react";

export interface AdminTableCardProps {
  header?: ReactNode;
  children: ReactNode;
  isLoading?: boolean;
  loadingRows?: number;
  loadingCols?: number;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyAction?: ReactNode;
  pagination?: ReactNode;
  className?: string;
}

export default function AdminTableCard({
  header,
  children,
  isLoading = false,
  loadingRows = 5,
  loadingCols = 6,
  isEmpty = false,
  emptyTitle = "Không tìm thấy dữ liệu",
  emptySubtitle = "Thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm",
  emptyAction,
  pagination,
  className = "",
}: AdminTableCardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden ${className}`}
    >
      {/* Optional Top Actions or Bulk selection banner */}
      {header}

      {/* Table Content */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: loadingRows }).map((_, rIdx) => (
              <div key={rIdx} className="flex items-center gap-4 animate-pulse">
                {Array.from({ length: loadingCols }).map((_, cIdx) => (
                  <div
                    key={cIdx}
                    className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex-1"
                  />
                ))}
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <SearchX className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-heading font-bold text-slate-800 dark:text-slate-200">
              {emptyTitle}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-1">
              {emptySubtitle}
            </p>
            {emptyAction && <div className="mt-4">{emptyAction}</div>}
          </div>
        ) : (
          children
        )}
      </div>

      {/* Pagination Container */}
      {pagination && (
        <div className="border-t border-slate-200/80 dark:border-slate-800 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50">
          {pagination}
        </div>
      )}
    </div>
  );
}
