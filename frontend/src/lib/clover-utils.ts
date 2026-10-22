// Clover Rating System & Hot Level Configuration for Aptis ESOL
// Single Source of Truth for ☘️ hot levels (1 to 6 clovers)

export interface CloverConfig {
  level: number;
  symbol: string;
  label: string;
  shortLabel: string;
  badgeClass: string;
  textClass: string;
  borderClass: string;
  bgClass: string;
  isTopPriority: boolean;
}

export const CLOVER_CONFIGS: Record<number, CloverConfig> = {
  6: {
    level: 6,
    symbol: "☘️☘️☘️☘️☘️☘️",
    label: "Cực kỳ dễ ra / Tủ cứng đợt này",
    shortLabel: "Tủ cứng đợt này",
    badgeClass: "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/40 ring-1 ring-emerald-500/30 animate-pulse",
    textClass: "text-emerald-700 dark:text-emerald-300",
    borderClass: "border-emerald-500/50",
    bgClass: "bg-emerald-500/10",
    isTopPriority: true,
  },
  5: {
    level: 5,
    symbol: "☘️☘️☘️☘️☘️",
    label: "Siêu Hot / Xác suất trúng 90%+",
    shortLabel: "Siêu Hot",
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 ring-1 ring-rose-500/20",
    textClass: "text-rose-600 dark:text-rose-400",
    borderClass: "border-rose-500/40",
    bgClass: "bg-rose-500/10",
    isTopPriority: true,
  },
  4: {
    level: 4,
    symbol: "☘️☘️☘️☘️",
    label: "Tần suất thi cao",
    shortLabel: "Tần suất cao",
    badgeClass: "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30",
    textClass: "text-amber-600 dark:text-amber-400",
    borderClass: "border-amber-500/40",
    bgClass: "bg-amber-500/10",
    isTopPriority: false,
  },
  3: {
    level: 3,
    symbol: "☘️☘️☘️",
    label: "Thường gặp",
    shortLabel: "Thường gặp",
    badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    textClass: "text-blue-600 dark:text-blue-400",
    borderClass: "border-blue-500/40",
    bgClass: "bg-blue-500/10",
    isTopPriority: false,
  },
  2: {
    level: 2,
    symbol: "☘️☘️",
    label: "Cơ bản / Tham khảo thêm",
    shortLabel: "Tham khảo",
    badgeClass: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
    textClass: "text-slate-600 dark:text-slate-400",
    borderClass: "border-slate-500/40",
    bgClass: "bg-slate-500/10",
    isTopPriority: false,
  },
  1: {
    level: 1,
    symbol: "☘️",
    label: "Luyện tập bổ trợ",
    shortLabel: "Cơ bản",
    badgeClass: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
    textClass: "text-gray-600 dark:text-gray-400",
    borderClass: "border-gray-500/30",
    bgClass: "bg-gray-500/5",
    isTopPriority: false,
  },
};

export function getCloverConfig(level?: number): CloverConfig {
  const lvl = Math.min(6, Math.max(1, Math.round(level || 2)));
  return CLOVER_CONFIGS[lvl] || CLOVER_CONFIGS[2];
}

export function formatCloverSymbol(level?: number): string {
  const lvl = Math.min(6, Math.max(1, Math.round(level || 2)));
  return "☘️".repeat(lvl);
}
