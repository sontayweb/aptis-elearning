"use client";

import { ReactNode } from "react";
import { BarChart3, ChevronDown, ChevronUp } from "lucide-react";

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
    <div className={`space-y-2 ${className}`}>
      {/* Tiêu đề & Badge (chỉ hiện khi có truyền vào) */}
      {hasHeading && (
        <div>
          {badge && BadgeIcon && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold mb-1">
              <BadgeIcon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              <span>{badge.label}</span>
            </div>
          )}
          {title && (
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal max-w-xl">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Thanh công cụ: Stats inline + Divider + Buttons cùng 1 hàng */}
      {(stats.length > 0 || actions || showMetricsToggle) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Cụm trái: Stats */}
          <div className="flex flex-wrap items-center gap-2">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <span key={idx} className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {idx > 0 && <span className="text-slate-300 dark:text-slate-600 mr-1">·</span>}
                  <Icon className={`w-3 h-3 ${stat.iconColor ?? "text-slate-400 dark:text-slate-500"}`} />
                  <strong className="text-slate-800 dark:text-slate-200 font-semibold">{stat.value}</strong>
                  {stat.label && <span>{stat.label}</span>}
                  {stat.subValue && <span className="text-slate-400">{stat.subValue}</span>}
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
                <BarChart3 className="w-3 h-3" />
                <span>{metricsLabel}</span>
                {showMetrics ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            {actions}
          </div>
        </div>
      )}
    </div>
  );
}
