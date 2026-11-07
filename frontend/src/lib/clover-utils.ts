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
    symbol: "☘️☘️☘️☘️☘️",
    label: "Đề tủ cực hot (Ưu tiên số 1)",
    shortLabel: "5 Cỏ · Siêu Hot",
    badgeClass: "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/40 ring-1 ring-emerald-500/30",
    textClass: "text-emerald-700 dark:text-emerald-300",
    borderClass: "border-emerald-500/50",
    bgClass: "bg-emerald-500/10",
    isTopPriority: true,
  },
  5: {
    level: 5,
    symbol: "☘️☘️☘️☘️☘️",
    label: "Đề tủ cực hot (Ưu tiên số 1)",
    shortLabel: "5 Cỏ · Siêu Hot",
    badgeClass: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/40 ring-1 ring-emerald-500/20",
    textClass: "text-emerald-700 dark:text-emerald-300",
    borderClass: "border-emerald-500/40",
    bgClass: "bg-emerald-500/10",
    isTopPriority: true,
  },
  4: {
    level: 4,
    symbol: "☘️☘️☘️☘️",
    label: "Tần suất về cao đợt này",
    shortLabel: "4 Cỏ · Hay ra",
    badgeClass: "bg-teal-500/15 text-teal-800 dark:text-teal-200 border-teal-500/35",
    textClass: "text-teal-700 dark:text-teal-300",
    borderClass: "border-teal-500/40",
    bgClass: "bg-teal-500/10",
    isTopPriority: true,
  },
  3: {
    level: 3,
    symbol: "☘️☘️☘️",
    label: "Đề trọng tâm nên luyện",
    shortLabel: "3 Cỏ · Trọng tâm",
    badgeClass: "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/35",
    textClass: "text-amber-700 dark:text-amber-300",
    borderClass: "border-amber-500/40",
    bgClass: "bg-amber-500/10",
    isTopPriority: false,
  },
  2: {
    level: 2,
    symbol: "☘️☘️",
    label: "Đề ôn tập mở rộng",
    shortLabel: "2 Cỏ · Mở rộng",
    badgeClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    textClass: "text-sky-600 dark:text-sky-400",
    borderClass: "border-sky-500/40",
    bgClass: "bg-sky-500/10",
    isTopPriority: false,
  },
  1: {
    level: 1,
    symbol: "☘️",
    label: "Đề luyện tập bổ trợ",
    shortLabel: "1 Cỏ · Cơ bản",
    badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25",
    textClass: "text-slate-600 dark:text-slate-400",
    borderClass: "border-slate-500/30",
    bgClass: "bg-slate-500/5",
    isTopPriority: false,
  },
};

export function getCloverConfig(level?: number): CloverConfig {
  const lvl = Math.min(6, Math.max(1, Math.round(level || 2)));
  return CLOVER_CONFIGS[lvl] || CLOVER_CONFIGS[2];
}

export function formatCloverSymbol(level?: number): string {
  const lvl = Math.min(5, Math.max(1, Math.round(level || 2)));
  return "☘️".repeat(lvl);
}

export function cleanForecastTag(tag?: string | null, hotLevel?: number): string {
  const cleaned = (tag || "")
    .replace(/^[★☆☘️🍀\s·•\-:]+/g, "")
    .trim();
  if (cleaned) return cleaned;
  const lvl = Math.min(5, Math.max(1, Math.round(hotLevel || 3)));
  return CLOVER_CONFIGS[lvl]?.label || "Đề trọng tâm nên luyện";
}
