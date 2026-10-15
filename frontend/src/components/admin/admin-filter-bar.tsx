"use client";

import { ReactNode } from "react";
import { Search, RefreshCw } from "lucide-react";

export interface FilterTab {
  id: string;
  label: string;
  count?: number | string;
}

export interface AdminFilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  tabs?: FilterTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  children?: ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export default function AdminFilterBar({
  searchPlaceholder = "Tìm kiếm...",
  searchValue,
  onSearchChange,
  onSearchSubmit,
  tabs,
  activeTab,
  onTabChange,
  children,
  onRefresh,
  isRefreshing = false,
  className = "",
}: AdminFilterBarProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between ${className}`}
    >
      {/* Search Input */}
      {onSearchChange !== undefined && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit?.();
          }}
          className="relative w-full md:w-72 lg:w-80"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchValue ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-sans"
          />
        </form>
      )}

      {/* Right controls: Segmented tabs, custom filters, refresh button */}
      <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-none">
        {/* Segmented tabs */}
        {tabs && tabs.length > 0 && (
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 flex items-center gap-0.5 shrink-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange?.(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-heading font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold ring-1 ring-slate-900/5 dark:ring-white/10"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="ml-1 text-[10px] opacity-70">({tab.count})</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Custom filter dropdowns or actions passed as children */}
        {children}

        {/* Refresh button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Làm mới danh sách"
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-slate-900 dark:text-white" : ""}`} />
          </button>
        )}
      </div>
    </div>
  );
}
