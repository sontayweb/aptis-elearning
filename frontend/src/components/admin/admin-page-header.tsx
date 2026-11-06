import React, { ReactNode } from "react";
import { BarChart3, ChevronDown, ChevronUp, Info } from "lucide-react";

export interface StatItem {
  icon: React.ElementType;
  value: ReactNode;
  label?: string;
  subValue?: string;
  iconColor?: string;
}

export interface AdminPageHeaderProps {
  badge?: {
    icon: React.ElementType;
    label: string;
  };
  title?: string;
  description?: string;
  infoTooltip?: string;
  stats?: StatItem[];
  actions?: ReactNode;
  showMetricsToggle?: boolean;
  showMetrics?: boolean;
  metricsLabel?: string;
  onToggleMetrics?: () => void;
  className?: string;
}

export default function AdminPageHeader({
  badge,
  title,
  description,
  infoTooltip,
  stats = [],
  actions,
  showMetricsToggle = false,
  showMetrics = false,
  metricsLabel = "Chỉ số chi tiết",
  onToggleMetrics,
  className = "",
}: AdminPageHeaderProps) {
  const BadgeIcon = badge?.icon;
  const hasHeading = Boolean(title || badge || description);

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* HÀNG 1: Tiêu đề + Icon Info (i) có Tooltip */}
      {hasHeading && (
        <div>
          {badge && BadgeIcon && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold mb-1">
              <BadgeIcon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              <span>{badge.label}</span>
            </div>
          )}
          {title && (
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h1>
              {infoTooltip && (
                <div className="relative group/info inline-flex items-center">
                  <button
                    type="button"
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-help"
                    aria-label="Thông tin trang"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <div className="pointer-events-none absolute left-0 top-full mt-1.5 z-50 w-72 max-w-xs rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs p-3 shadow-xl border border-slate-700 opacity-0 group-hover/info:opacity-100 group-hover/info:pointer-events-auto transition-all transform origin-top-left leading-relaxed">
                    {infoTooltip}
                  </div>
                </div>
              )}
            </div>
          )}
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal max-w-xl">
              {description}
            </p>
          )}
        </div>
      )}

      {/* HÀNG 2: Stats inline (bên trái) + Actions (bên phải) trên cùng 1 hàng */}
      {(stats.length > 0 || actions || showMetricsToggle) && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
          {/* Cụm trái: Stats ngăn cách bởi dấu chấm "·" */}
          <div className="flex flex-wrap items-center gap-2">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium"
                >
                  {idx > 0 && (
                    <span className="text-slate-300 dark:text-slate-600 mr-1 select-none font-bold">
                      ·
                    </span>
                  )}
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      stat.iconColor ?? "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                  <strong className="text-slate-900 dark:text-white font-bold font-mono">
                    {stat.value}
                  </strong>
                  {stat.label && (
                    <span className="text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </span>
                  )}
                  {stat.subValue && (
                    <span className="text-slate-400 text-[11px]">
                      {stat.subValue}
                    </span>
                  )}
                </span>
              );
            })}
          </div>

          {/* Cụm phải: Chỉ số chi tiết toggle + Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {showMetricsToggle && onToggleMetrics && (
              <button
                type="button"
                onClick={onToggleMetrics}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-heading font-semibold transition-all flex items-center gap-1 ${
                  showMetrics
                    ? "bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-600"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
                title={showMetrics ? "Ẩn thẻ chỉ số KPI" : "Hiện thẻ chỉ số chi tiết"}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{metricsLabel}</span>
                {showMetrics ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            )}

            {actions}
          </div>
        </div>
      )}
    </div>
  );
}
