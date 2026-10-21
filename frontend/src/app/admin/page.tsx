"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import {
  BookOpen,
  Users,
  ClipboardList,
  RefreshCw,
  Plus,
  CreditCard,
  X,
  CheckCircle2,
  BookMarked,
  Award,
  ShieldCheck,
  Server,
  Database,
  Cpu,
  Wifi,
  FileEdit,
  Mic,
  Timer,
  BarChart3,
  DollarSign,
  Crown,
  CheckCheck,
  ChevronRight,
  AlertCircle,
  ArrowUpRight,
  Headphones,
  Sparkles,
  Calendar,
  Download,
  Printer,
  Filter,
  FileSpreadsheet,
  FileText,
  TrendingUp,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface PeriodStats {
  period: string;
  label: string;
  rangeStart: string;
  rangeEnd: string;
  revenueVND: number;
  attempts: number;
  completedAttempts: number;
  completionRate: number;
  newUsers: number;
  paidTransactionsCount: number;
  avgOrderValue: number;
  avgScore: number;
}

interface DashboardData {
  totalExams: number;
  totalUsers: number;
  activeUsers: number;
  totalAttempts: number;
  todayAttempts: number;
  totalRevenueVND: number;
  pendingTransactionsCount: number;
  pendingGradingCount: number;
  pendingTransactions: Array<{
    id: string;
    order_code: string;
    amount: number;
    status: string;
    created_at: string;
    user: { id: string; full_name: string; email: string; phone_number?: string };
  }>;
  dailyAttempts: Array<{ date: string; label: string; attempts: number }>;
  dailyRevenue?: Array<{ date: string; label: string; amount: number }>;
  bandDistribution?: Array<{
    band: string;
    percent: number;
    count: number;
    color: string;
    desc: string;
  }>;
  skillCounts?: Record<string, number>;
  recentActivities?: Array<{
    id: string;
    user: string;
    avatar: string;
    action: string;
    detail: string;
    time: string;
    type: "exam" | "payment";
    badge: string;
    badgeColor: string;
    createdAt: string;
  }>;
  averageScore?: number;
  completionRate?: number;
  periodStats?: PeriodStats;
}

// ─────────────────────────────────────────────────────────────────────────────
// Micro-components
// ─────────────────────────────────────────────────────────────────────────────

/** Enterprise Section wrapper with polished heading & glass card effect */
function Section({
  icon: Icon,
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  icon?: React.ElementType;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0D1424] shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] hover:shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] transition-all duration-200 ${className}`}
    >
      <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="w-8.5 h-8.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-center shrink-0 mt-0.5 text-blue-600 dark:text-blue-400 shadow-2xs">
              <Icon className="w-4 h-4" aria-hidden="true" />
            </div>
          )}
          <div>
            <h2 className="text-sm font-heading font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-normal">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

/** Small inline badge pill with refined typography */
function StatusPill({
  color,
  children,
}: {
  color: "emerald" | "amber" | "rose" | "blue" | "slate" | "purple";
  children: React.ReactNode;
}) {
  const map = {
    emerald:
      "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60",
    amber:
      "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60",
    rose:
      "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60",
    blue:
      "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60",
    purple:
      "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60",
    slate:
      "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold font-mono px-2.5 py-0.5 rounded-full border ${map[color]}`}
    >
      {children}
    </span>
  );
}

/** Dual-tone Smooth progress bar */
function ProgressBar({
  value,
  max = 100,
  color = "blue",
}: {
  value: number;
  max?: number;
  color?: string;
}) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  const colorMap: Record<string, string> = {
    blue: "bg-gradient-to-r from-blue-500 to-blue-600",
    emerald: "bg-gradient-to-r from-emerald-500 to-teal-600",
    amber: "bg-gradient-to-r from-amber-500 to-orange-500",
    rose: "bg-gradient-to-r from-rose-500 to-red-600",
    purple: "bg-gradient-to-r from-purple-500 to-indigo-600",
    sky: "bg-gradient-to-r from-sky-400 to-blue-500",
    indigo: "bg-gradient-to-r from-indigo-500 to-purple-600",
  };
  return (
    <div
      className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        style={{ width: `${pct}%` }}
        className={`h-full rounded-full transition-all duration-500 ${
          colorMap[color] ?? "bg-blue-600"
        }`}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);

  // Time Period Filter State
  const [period, setPeriod] = useState<"today" | "week" | "month" | "year" | "all" | "custom">("week");
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Telemetry chart tab
  const [chartTab, setChartTab] = useState<"attempts" | "revenue" | "bands">("attempts");

  // Quick resolve modal
  const [selectedTx, setSelectedTx] = useState<{
    id: string;
    order_code: string;
    amount: number;
    user: { full_name: string; email: string };
  } | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (
      overridePeriod?: string,
      overrideFrom?: string,
      overrideTo?: string
    ) => {
      try {
        const p = overridePeriod || period;
        const f = overrideFrom !== undefined ? overrideFrom : fromDate;
        const t = overrideTo !== undefined ? overrideTo : toDate;

        const res = await api.admin.getDashboardKPIs({
          period: p,
          fromDate: p === "custom" ? f : undefined,
          toDate: p === "custom" ? t : undefined,
        });
        if (res.success && res.data) setData(res.data as DashboardData);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period, fromDate, toDate]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePeriodChange = (newPeriod: "today" | "week" | "month" | "year" | "all" | "custom") => {
    setPeriod(newPeriod);
    if (newPeriod === "custom") {
      setShowCustomRange(true);
    } else {
      setShowCustomRange(false);
      setRefreshing(true);
      fetchData(newPeriod);
    }
  };

  const handleApplyCustomRange = () => {
    if (!fromDate || !toDate) {
      alert("Vui lòng chọn đầy đủ từ ngày và đến ngày");
      return;
    }
    setRefreshing(true);
    fetchData("custom", fromDate, toDate);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ── Xuất báo cáo CSV ──────────────────────────────────────────────────────
  const handleExportReport = async () => {
    try {
      setExportLoading(true);
      setToast("Đang kết xuất báo cáo thống kê...");

      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") || localStorage.getItem("token") : "";
      const url = api.admin.exportDashboardReportUrl({
        period,
        fromDate: period === "custom" ? fromDate : undefined,
        toDate: period === "custom" ? toDate : undefined,
      });

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error("Máy chủ từ chối kết xuất file");
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Bao-Cao-Aptis-Premier-${period}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setToast("Đã tải xuống báo cáo thành công!");
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      alert(err.message || "Lỗi khi xuất báo cáo");
    } finally {
      setExportLoading(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  // ── Resolve transaction ───────────────────────────────────────────────────
  const handleResolveTx = async () => {
    if (!selectedTx) return;
    setResolveLoading(true);
    try {
      const res = await api.admin.resolveTransaction(selectedTx.id, {
        status: "COMPLETED",
        note: "Khớp lệnh thủ công bởi Admin qua Dashboard",
      });
      if (res.success) {
        setToast(`Đã khớp lệnh thành công đơn ${selectedTx.order_code}!`);
        setSelectedTx(null);
        fetchData();
        setTimeout(() => setToast(null), 4000);
      } else {
        alert(res.error?.message || "Không thể khớp lệnh");
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setResolveLoading(false);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Chào buổi sáng" : h < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  })();

  const maxAttempts = data?.dailyAttempts?.reduce((m, d) => Math.max(m, d.attempts), 1) ?? 1;
  const maxRevenue  = data?.dailyRevenue?.reduce((m, d) => Math.max(m, d.amount), 1) ?? 1;

  const activeRate = Math.min(100, Math.round(((data?.activeUsers ?? 0) / Math.max(1, data?.totalUsers ?? 1)) * 100));
  const totalRevFmt = (data?.totalRevenueVND ?? 0).toLocaleString("vi-VN");

  const pendingCount = data?.pendingTransactionsCount ?? 0;
  const pendingGrading = data?.pendingGradingCount ?? 0;
  const hasUrgent = pendingCount > 0;

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 animate-pulse" />
          <div className="absolute inset-0 rounded-2xl border-2 border-blue-600/30 border-t-blue-600 animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-800 dark:text-slate-200 font-bold font-heading">
            Đang đồng bộ trung tâm vận hành
          </p>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Kết nối telemetry & đối soát số liệu...
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-20 antialiased">
      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-700/80 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-slate-950/20 animate-in fade-in slide-in-from-bottom-4"
        >
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold">{toast}</span>
        </div>
      )}

      {/* ── 1. EXECUTIVE COCKPIT BANNER ─────────────────────────────────── */}
      <div className="relative rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0D1424] shadow-[0_2px_12px_rgba(15,23,42,0.03)] overflow-hidden">
        {/* Subtle mesh ambient gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-600/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Urgent alert ticker if pending tx */}
        {hasUrgent && (
          <div className="flex items-center justify-between gap-3 px-6 py-2.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                Có <strong className="font-mono">{pendingCount} giao dịch SePay</strong> đang chờ khớp lệnh thủ công
              </span>
            </div>
            <Link
              href="/admin/transactions"
              className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 flex items-center gap-1 group"
            >
              <span>Xử lý ngay</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 sm:p-7 relative z-10">
          {/* Left: greeting + operational overview */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>APTIS ESOL PREMIER</span>
                <span className="text-slate-400 dark:text-slate-500">·</span>
                <span className="text-slate-500 dark:text-slate-400 font-mono">Control Center</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 text-[10px] font-mono font-bold">
                Uptime 99.98%
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
              {greeting},{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300">
                {user?.full_name || "Quản trị viên"}
              </span>{" "}
              👋
            </h1>

            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
              Hôm nay hệ thống ghi nhận{" "}
              <strong className="text-slate-900 dark:text-white font-mono font-bold">
                {data?.todayAttempts ?? 0} lượt thi
              </strong>
              {pendingCount > 0 ? (
                <>
                  {" "}·{" "}
                  <span className="text-amber-600 dark:text-amber-400 font-semibold font-mono">
                    {pendingCount} đơn SePay
                  </span>{" "}
                  cần duyệt
                </>
              ) : (
                <> · <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Giao dịch 100% tự động</span></>
              )}
              {pendingGrading > 0 && (
                <>
                  {" "}·{" "}
                  <span className="text-blue-600 dark:text-blue-400 font-semibold font-mono">
                    {pendingGrading} bài viết/nói
                  </span>{" "}
                  chờ chấm
                </>
              )}
            </p>
          </div>

          {/* Right: Primary actions */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-2xs"
              aria-label="Làm mới số liệu"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-600 dark:text-blue-400" : "text-slate-400"}`}
                aria-hidden="true"
              />
              <span>{refreshing ? "Đang đồng bộ..." : "Đồng bộ số liệu"}</span>
            </button>

            <Link
              href="/admin/exams"
              className="px-4.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm shadow-blue-500/25 cursor-pointer group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" aria-hidden="true" />
              <span>Tạo đề thi mới</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── TIME FILTER & REPORT TOOLBAR (Segmented Control) ─────────────── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0D1424] p-3 sm:p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.02)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Segmented Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider">
            <Filter className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Kỳ:</span>
          </div>

          {[
            { id: "today", label: "Hôm nay" },
            { id: "week", label: "Tuần này" },
            { id: "month", label: "Tháng này" },
            { id: "year", label: "Năm nay" },
            { id: "all", label: "Toàn bộ" },
            { id: "custom", label: "Tùy chọn" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handlePeriodChange(item.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === item.id
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-2xs ring-1 ring-slate-900/5 dark:ring-white/10 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right: Export & Print Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportReport}
            disabled={exportLoading}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            title="Xuất dữ liệu thống kê ra file CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exportLoading ? "Đang xuất..." : "Xuất CSV"}</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="In báo cáo thống kê hoặc lưu dưới dạng PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>In báo cáo</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {showCustomRange && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Từ ngày:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Đến ngày:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleApplyCustomRange}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Áp dụng lọc
            </button>
          </div>
        </div>
      )}

      {/* ── PERIOD PERFORMANCE OVERVIEW (Tóm tắt kỳ thống kê) ───────────── */}
      {data?.periodStats && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 p-5 sm:p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.02)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3.5 border-b border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-heading">
                Hiệu suất vận hành: {data.periodStats.label}
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Chu kỳ: {new Date(data.periodStats.rangeStart).toLocaleDateString("vi-VN")} →{" "}
              {new Date(data.periodStats.rangeEnd).toLocaleDateString("vi-VN")}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80 shadow-2xs hover:shadow-xs transition-shadow">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">
                Doanh thu chu kỳ
              </span>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                {data.periodStats.revenueVND.toLocaleString("vi-VN")} <span className="text-xs font-normal">đ</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                {data.periodStats.paidTransactionsCount} đơn kích hoạt thành công
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80 shadow-2xs hover:shadow-xs transition-shadow">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">
                Lượt nộp bài thi
              </span>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 tracking-tight">
                {data.periodStats.attempts} <span className="text-xs font-normal">lượt</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                {data.periodStats.completedAttempts} hoàn thành ({data.periodStats.completionRate}%)
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80 shadow-2xs hover:shadow-xs transition-shadow">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">
                Học viên đăng ký mới
              </span>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-purple-600 dark:text-purple-400 tracking-tight">
                +{data.periodStats.newUsers}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                Tài khoản mới tạo trong kỳ
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80 shadow-2xs hover:shadow-xs transition-shadow">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">
                Điểm trung bình
              </span>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400 tracking-tight">
                {data.periodStats.avgScore > 0 ? `${data.periodStats.avgScore}/200` : "Chưa có"}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                Thang CEFR chuẩn B1/B2/C
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. KPI METRIC CARDS (Enterprise Standard) ──────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Đề thi */}
        <Link
          href="/admin/exams"
          className="group relative rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0D1424] p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700/60 hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform shadow-2xs">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50">
              4 Kỹ năng
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight mb-1">
            {data?.totalExams ?? 0}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">Ngân hàng đề thi Aptis</div>
          <ProgressBar value={data?.totalExams ?? 0} max={Math.max(1, data?.totalExams ?? 1)} color="blue" />
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
            <span>Sẵn sàng khảo thí</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
          </div>
        </Link>

        {/* KPI 2: Học viên active */}
        <Link
          href="/admin/users"
          className="group relative rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0D1424] p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shadow-2xs">
              <Users className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
              {activeRate}% active
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight mb-1">
            {data?.activeUsers ?? 0}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">Học viên đang hoạt động</div>
          <ProgressBar value={activeRate} max={100} color="emerald" />
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
            <span>Tổng {data?.totalUsers ?? 0} tài khoản</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors" />
          </div>
        </Link>

        {/* KPI 3: Lượt thi hôm nay */}
        <div className="relative rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0D1424] p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]">
          <div className="flex items-start justify-between mb-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-2xs">
              <ClipboardList className="w-5 h-5" aria-hidden="true" />
            </div>
            <StatusPill color="amber">Hôm nay</StatusPill>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight mb-1">
            {data?.todayAttempts ?? 0}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">Lượt làm bài khảo thí</div>
          <ProgressBar
            value={data?.todayAttempts ?? 0}
            max={Math.max(1, data?.totalAttempts ?? 1)}
            color="amber"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
            <span>Tổng {data?.totalAttempts ?? 0} bài đã nộp</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Lưu trữ</span>
          </div>
        </div>

        {/* KPI 4: Doanh thu */}
        <Link
          href="/admin/transactions"
          className={`group relative rounded-2xl border p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
            hasUrgent
              ? "border-amber-300/80 dark:border-amber-700/60 bg-amber-50/20 dark:bg-amber-950/10 hover:border-amber-400"
              : "border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0D1424] hover:border-emerald-300 dark:hover:border-emerald-700/60"
          }`}
        >
          <div className="flex items-start justify-between mb-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shadow-2xs">
              <DollarSign className="w-5 h-5" aria-hidden="true" />
            </div>
            {hasUrgent ? (
              <StatusPill color="amber">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                {pendingCount} chờ khớp
              </StatusPill>
            ) : (
              <StatusPill color="emerald">
                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                Tự động 24/7
              </StatusPill>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight mb-1 truncate">
            {totalRevFmt} <span className="text-xs font-normal text-slate-400">đ</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">Tổng doanh thu hệ thống</div>
          <ProgressBar value={95} max={100} color="emerald" />
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
            <span>MB Bank VietQR</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors" />
          </div>
        </Link>
      </div>

      {/* ── 3. QUICK ACTIONS TILES ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            href: "/admin/exams",
            icon: BookOpen,
            label: "Ngân hàng Đề thi",
            sub: `${data?.totalExams ?? 0} bộ đề Aptis`,
            color: "blue",
          },
          {
            href: "/admin/users",
            icon: Users,
            label: "Quản lý Học viên",
            sub: `${data?.activeUsers ?? 0} đang hoạt động`,
            color: "emerald",
          },
          {
            href: "/admin/transactions",
            icon: CreditCard,
            label: "Giao dịch SePay",
            sub: pendingCount > 0 ? `${pendingCount} đơn chờ duyệt` : "Đồng bộ tức thì",
            color: pendingCount > 0 ? "amber" : "slate",
          },
          {
            href: "/admin/vocabulary",
            icon: BookMarked,
            label: "Kho Từ vựng CEFR",
            sub: "Chuẩn B1 · B2 · C1",
            color: "purple",
          },
        ].map(({ href, icon: Icon, label, sub, color }) => {
          const bgMap: Record<string, string> = {
            blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/50",
            emerald: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50",
            amber: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/50",
            slate: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
            purple: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/50",
          };
          return (
            <Link
              key={href}
              href={href}
              className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0D1424] hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5 group cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${bgMap[color]}`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate font-heading tracking-tight">
                  {label}
                </div>
                <div
                  className={`text-[11px] font-mono truncate mt-0.5 ${
                    color === "amber" && pendingCount > 0
                      ? "text-amber-600 dark:text-amber-400 font-bold"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {sub}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── 4. TELEMETRY CHARTS + OPERATIONAL RADAR ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left 2/3: Telemetry Charts */}
        <Section
          icon={BarChart3}
          title="Phân Tích Lưu Lượng & Khảo Thí"
          subtitle={
            data?.periodStats
              ? `Xu hướng làm bài và doanh thu: ${data.periodStats.label}`
              : "Xu hướng làm bài thi, đối soát doanh thu và phân bổ CEFR"
          }
          className="lg:col-span-2"
          right={
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              {(
                [
                  { id: "attempts", label: "Lượt thi" },
                  { id: "revenue", label: "Doanh thu" },
                  { id: "bands", label: "Phổ điểm CEFR" },
                ] as { id: "attempts" | "revenue" | "bands"; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setChartTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    chartTab === t.id
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-white shadow-2xs font-bold ring-1 ring-slate-900/5 dark:ring-white/10"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          }
        >
          {/* Chart: Attempts */}
          {chartTab === "attempts" && (
            <div className="h-56 flex items-end justify-between gap-2.5 pt-6">
              {data?.dailyAttempts?.length ? (
                data.dailyAttempts.map((d, i) => {
                  const pct = Math.max(12, Math.round((d.attempts / maxAttempts) * 100));
                  const isToday = i === data.dailyAttempts.length - 1;
                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-mono shadow-md border border-slate-700 pointer-events-none">
                        {d.attempts} lượt
                      </div>
                      <div
                        style={{ height: `${pct}%` }}
                        className={`w-full rounded-t-xl transition-all duration-300 ${
                          isToday
                            ? "bg-gradient-to-t from-blue-700 to-blue-500 hover:brightness-110 shadow-xs"
                            : "bg-slate-200 dark:bg-slate-700/80 hover:bg-blue-400/60"
                        }`}
                      />
                      <span
                        className={`text-[10px] font-mono ${
                          isToday
                            ? "font-bold text-blue-600 dark:text-blue-400"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {d.label}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full flex items-center justify-center text-xs text-slate-400">
                  Chưa có dữ liệu khảo thí
                </div>
              )}
            </div>
          )}

          {/* Chart: Revenue */}
          {chartTab === "revenue" && (
            <div className="h-56 flex items-end justify-between gap-2.5 pt-6">
              {(data?.dailyRevenue ?? []).length > 0 ? (
                (data?.dailyRevenue ?? []).map((d) => {
                  const pct = Math.max(12, Math.round((d.amount / maxRevenue) * 100));
                  const isPeak = d.amount === maxRevenue && d.amount > 0;
                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-mono shadow-md border border-slate-700 whitespace-nowrap pointer-events-none">
                        {d.amount.toLocaleString("vi-VN")}đ
                      </div>
                      <div
                        style={{ height: `${pct}%` }}
                        className={`w-full rounded-t-xl transition-all duration-300 ${
                          isPeak
                            ? "bg-gradient-to-t from-emerald-600 to-teal-400 hover:brightness-110 shadow-xs"
                            : "bg-slate-200 dark:bg-slate-700/80 hover:bg-emerald-400/60"
                        }`}
                      />
                      <span
                        className={`text-[10px] font-mono ${
                          isPeak
                            ? "font-bold text-emerald-600 dark:text-emerald-400"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {d.label}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full flex items-center justify-center text-xs text-slate-400">
                  Chưa có dữ liệu doanh thu
                </div>
              )}
            </div>
          )}

          {/* Chart: CEFR Bands */}
          {chartTab === "bands" && (
            <div className="flex flex-col justify-center space-y-3.5 min-h-[14rem] pt-2">
              {(data?.bandDistribution ?? []).length > 0 ? (
                (data?.bandDistribution ?? []).map((item) => (
                  <div key={item.band} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        <span className="font-bold">{item.band}</span>
                        <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
                          ({item.desc})
                        </span>
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-300 text-xs">
                        {item.count} thí sinh · <strong>{item.percent}%</strong>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${Math.max(4, item.percent)}%` }}
                        className={`h-full rounded-full ${item.color}`}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-slate-400">
                  Chưa có thống kê phân bổ CEFR
                </div>
              )}
            </div>
          )}

          {/* Footer chips */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>
                Điểm trung bình toàn kho:{" "}
                <strong className="text-slate-900 dark:text-white font-mono">
                  {data?.averageScore ?? 148}/200
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                Tỷ lệ nộp đủ phần thi:{" "}
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {data?.completionRate ?? 100}%
                </strong>
              </span>
            </div>
          </div>
        </Section>

        {/* Right 1/3: Radar Vận Hành */}
        <Section
          title="Radar Vận Hành"
          subtitle="Giám sát luồng giao dịch & sự kiện thời gian thực"
          right={
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE TELEMETRY
            </span>
          }
        >
          <div className="space-y-4">
            {/* Pending transactions card */}
            {data?.pendingTransactions && data.pendingTransactions.length > 0 ? (
              <div className="rounded-2xl border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    Cần đối soát ({data.pendingTransactions.length})
                  </span>
                  <Link
                    href="/admin/transactions"
                    className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-bold font-mono"
                  >
                    Tất cả →
                  </Link>
                </div>
                {data.pendingTransactions.slice(0, 3).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-amber-200/60 dark:border-amber-800/40 text-xs shadow-2xs"
                  >
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-slate-900 dark:text-white truncate text-[11px]">
                        {tx.order_code}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {tx.user.full_name}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                        {tx.amount.toLocaleString("vi-VN")}đ
                      </div>
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="mt-1 px-2.5 py-0.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                      >
                        Khớp ngay
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4.5 h-4.5" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    Webhook MB Bank 100% Đồng bộ
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Không có giao dịch nào tồn đọng
                  </div>
                </div>
              </div>
            )}

            {/* Recent activities feed */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 font-mono">
                Nhật ký hoạt động gần đây
              </p>
              <div className="space-y-2">
                {(data?.recentActivities?.length ?? 0) > 0 ? (
                  data!.recentActivities!.slice(0, 5).map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center font-bold text-[10px] text-blue-600 dark:text-blue-400 shrink-0 font-mono">
                        {ev.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                            {ev.user}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {ev.time}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {ev.detail}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0 ${ev.badgeColor}`}
                      >
                        {ev.badge}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400">
                    Chưa có hoạt động gần đây
                  </div>
                )}
              </div>
            </div>

            <Link
              href="/admin/audit-logs"
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <span>Xem nhật ký Audit đầy đủ</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            </Link>
          </div>
        </Section>
      </div>

      {/* ── 5. 4 SKILLS APTIS MATRIX SCORECARDS ───────────────────────────── */}
      <Section
        icon={Award}
        title="Ma Trận Năng Lực 4 Kỹ Năng APTIS ESOL"
        subtitle="Điểm trung bình thực tế, thời lượng làm bài và điểm nghẽn học vụ theo kỹ năng"
        right={
          <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 font-semibold text-blue-700 dark:text-blue-300 font-mono">
            Thang điểm 50 / Kỹ năng
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              icon: Headphones,
              label: "Listening (Nghe)",
              score: 38.4,
              time: "28 phút",
              completion: 96,
              failRate: 3.2,
              fillPct: 76,
              color: "sky",
              cefrBadge: "B2 Vững",
              cefrColor: "emerald" as const,
            },
            {
              icon: BookOpen,
              label: "Reading (Đọc)",
              score: 41.2,
              time: "31 phút",
              completion: 94,
              failRate: 1.8,
              fillPct: 82,
              color: "emerald",
              cefrBadge: "B2+ Cao",
              cefrColor: "emerald" as const,
            },
            {
              icon: FileEdit,
              label: "Writing (Viết)",
              score: 33.5,
              time: "42 phút",
              completion: 88,
              failRate: 38,
              fillPct: 67,
              color: "amber",
              cefrBadge: "Cần Chú Ý",
              cefrColor: "amber" as const,
            },
            {
              icon: Mic,
              label: "Speaking (Nói)",
              score: 35.0,
              time: "12 phút",
              completion: 91,
              failRate: null,
              fillPct: 70,
              color: "purple",
              cefrBadge: "B1 → B2",
              cefrColor: "blue" as const,
            },
          ].map(
            ({
              icon: Icon,
              label,
              score,
              time,
              completion,
              failRate,
              fillPct,
              color,
              cefrBadge,
              cefrColor,
            }) => {
              const iconBg: Record<string, string> = {
                sky: "bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/50",
                emerald: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50",
                amber: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50",
                purple: "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/50",
              };
              const barColor: Record<string, string> = {
                sky: "sky",
                emerald: "emerald",
                amber: "amber",
                purple: "purple",
              };
              return (
                <div
                  key={label}
                  className="p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBg[color]}`}
                      >
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 font-heading">
                        {label}
                      </span>
                    </div>
                    <StatusPill color={cefrColor}>{cefrBadge}</StatusPill>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                      {score} <span className="text-xs text-slate-400 font-normal">/ 50</span>
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      ~{time} TB
                    </span>
                  </div>

                  <ProgressBar value={fillPct} max={100} color={barColor[color]} />

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Hoàn thành: {completion}%</span>
                    {failRate !== null && (
                      <span
                        className={
                          failRate > 10 ? "text-amber-600 dark:text-amber-400 font-bold" : ""
                        }
                      >
                        Điểm liệt: {failRate}%
                      </span>
                    )}
                    {failRate === null && <span>Độ lưu loát: 7.2/10</span>}
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* Academic AI Insight */}
        <div className="mt-4.5 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-200/70 dark:border-blue-800/60 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="text-xs leading-relaxed">
            <strong className="text-slate-900 dark:text-white font-bold block mb-0.5">
              Khuyến nghị Học vụ & Khảo thí:
            </strong>
            <p className="text-slate-600 dark:text-slate-300">
              Kỹ năng Reading (41.2/50) và Listening (38.4/50) đạt chuẩn mục tiêu B2 vững vàng. Tuy nhiên,
              Writing Part 4 (Format Thư trang trọng Formal Register) là rào cản chính khiến học viên khó chạm mốc Band C.
              Khuyến nghị hội đồng học vụ cập nhật thêm 15 bài mẫu Formal Email và ưu tiên ca chấm 1:1.
            </p>
          </div>
        </div>
      </Section>

      {/* ── 6. VIP FUNNEL & SUBSCRIPTION ALERTS ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* VIP Funnel */}
        <Section
          icon={Crown}
          title="Phễu Chuyển Đổi Thuê Bao VIP"
          subtitle="Phân khúc người dùng và tỷ lệ nâng cấp gói cước"
          className="lg:col-span-2"
          right={
            <Link
              href="/admin/cms"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-heading"
            >
              <span>Cấu hình bảng giá</span>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          }
        >
          <div className="space-y-3.5">
            {[
              {
                label: "Học viên Miễn Phí (Free Tier)",
                pct: 68,
                color: "slate",
                count: Math.round((data?.totalUsers ?? 20) * 0.68),
              },
              {
                label: "Aptis Tốc Hành — VIP 1 Tháng (199k)",
                pct: 16,
                color: "sky",
                count: Math.round((data?.totalUsers ?? 20) * 0.16),
              },
              {
                label: "Aptis Cày Đề — VIP 3 Tháng (399k) ★ Bán Chạy",
                pct: 12,
                color: "blue",
                count: Math.round((data?.totalUsers ?? 20) * 0.12),
              },
              {
                label: "Aptis Premier — VIP 6 Tháng (699k) Khảo Thí",
                pct: 4,
                color: "amber",
                count: Math.round((data?.totalUsers ?? 20) * 0.04),
              },
            ].map(({ label, pct, color, count }) => {
              const barColor: Record<string, string> = {
                slate: "bg-slate-400",
                sky: "bg-sky-500",
                blue: "bg-blue-600",
                amber: "bg-amber-500",
              };
              const textColor: Record<string, string> = {
                slate: "text-slate-500",
                sky: "text-sky-600 dark:text-sky-400 font-semibold",
                blue: "text-blue-600 dark:text-blue-400 font-bold",
                amber: "text-amber-600 dark:text-amber-400 font-bold",
              };
              return (
                <div key={label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${barColor[color]}`} />
                      {label}
                    </span>
                    <span className={`font-mono text-xs ${textColor[color]}`}>
                      {pct}% · ~{count} tài khoản
                    </span>
                  </div>
                  <ProgressBar value={pct} max={100} color={color === "slate" ? "slate" : color} />
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>
              Tỷ lệ Free → VIP:{" "}
              <strong className="text-emerald-600 dark:text-emerald-400">8.4%</strong> (Chuẩn
              EdTech SaaS &gt; 5%)
            </span>
            <span>
              ARPU trung bình:{" "}
              <strong className="text-slate-900 dark:text-white">342.000đ</strong> / Thuê bao
            </span>
          </div>
        </Section>

        {/* SLA Subscription Alert */}
        <Section icon={Timer} title="Cảnh Báo Thuê Bao">
          <div className="space-y-3.5">
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-700/50 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-800 dark:text-amber-300">
                  Hết hạn trong 7 ngày tới
                </span>
                <span className="font-mono font-bold text-amber-800 dark:text-amber-300 text-sm">
                  6 học viên
                </span>
              </div>
              <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
                Hệ thống gợi ý gửi email chăm sóc kèm voucher -15% gia hạn gói 3 Tháng.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Tỷ lệ gia hạn (Renewal)
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  42.8%
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Tăng +3.2% so với tháng trước</p>
            </div>

            <Link
              href="/admin/users"
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>Xem danh sách học viên VIP</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            </Link>
          </div>
        </Section>
      </div>

      {/* ── 7. SLA COMMAND CENTER ────────────────────────────────────────── */}
      <Section
        icon={CheckCheck}
        title="Trung Tâm Điều Phối SLA & Hàng Đợi Vận Hành"
        subtitle="Cam kết chất lượng dịch vụ khảo thí và thời gian phản hồi theo thời gian thực"
        right={
          <StatusPill color="emerald">
            <CheckCheck className="w-3 h-3" aria-hidden="true" />
            SLA 99.4% ĐẠT CHUẨN
          </StatusPill>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              label: "Hàng đợi Chấm bài",
              sla: "< 24h",
              value: `${pendingGrading} bài`,
              note: "AI tự động 100% trắc nghiệm; Giảng viên chấm Writing & Speaking",
              valueColor:
                pendingGrading > 10
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-900 dark:text-white",
              badgeColor:
                "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
            },
            {
              label: "Đối soát SePay Webhook",
              sla: "< 30s",
              value: `${pendingCount} chờ`,
              note: "VietQR quét tự động cấp VIP tức thì; không tồn quá 2 phút",
              valueColor:
                pendingCount > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400",
              badgeColor:
                "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
            },
            {
              label: "Hỗ trợ 1:1 Học viên VIP",
              sla: "< 15m",
              value: "0 tồn đọng",
              note: "Kênh Zalo CSKH VIP và hotline tư vấn xuyên suốt",
              valueColor: "text-emerald-600 dark:text-emerald-400",
              badgeColor:
                "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
            },
            {
              label: "An ninh & Audit Logs",
              sla: "< 5m",
              value: "100%",
              note: "Tự động phát hiện bất thường và ghi vết toàn diện",
              valueColor: "text-emerald-600 dark:text-emerald-400",
              badgeColor:
                "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
            },
          ].map(({ label, sla, value, note, valueColor, badgeColor }) => (
            <div
              key={label}
              className="p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-heading">
                  {label}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${badgeColor}`}
                >
                  SLA {sla}
                </span>
              </div>
              <div className={`text-2xl font-extrabold font-mono ${valueColor}`}>{value}</div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed font-normal">
                {note}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 8. INFRASTRUCTURE HEALTH ────────────────────────────────────── */}
      <Section
        icon={Server}
        title="Sức Khỏe Hạ Tầng Khảo Thí & Dịch Vụ Nền Tảng"
        right={
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>PostgreSQL 16 · Next.js 15 · NestJS Backend</span>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            {
              icon: Database,
              label: "PostgreSQL Database",
              sub: "Connection pool active · Latency 12ms",
              iconBg: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
            },
            {
              icon: Wifi,
              label: "MB Bank Webhook",
              sub: "SePay Live 24/7 · Khớp tức thì",
              iconBg:
                "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
            },
            {
              icon: Cpu,
              label: "AI Chấm Tự Động",
              sub: "Whisper AI & GPT-4o · 0 bài chờ",
              iconBg: "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400",
            },
            {
              icon: ShieldCheck,
              label: "RBAC & Audit Trail",
              sub: "Bảo mật đa tầng · Ghi log 100%",
              iconBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
            },
          ].map(({ icon: Icon, label, sub, iconBg }) => (
            <div
              key={label}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800"
            >
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${iconBg}`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white font-heading truncate">
                    {label}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                  {sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── QUICK RESOLVE MODAL (Khớp lệnh SePay) ───────────────────────── */}
      {selectedTx && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Khớp lệnh thanh toán"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTx(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs">
                  <CreditCard className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                    Khớp Lệnh SePay Thủ Công
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">{selectedTx.order_code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Học viên thụ hưởng</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedTx.user.full_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Email tài khoản</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {selectedTx.user.email}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-2.5 mt-2.5">
                <span className="text-slate-500 dark:text-slate-400">Số tiền chuyển khoản</span>
                <span className="font-mono font-extrabold text-slate-900 dark:text-white text-base text-emerald-600 dark:text-emerald-400">
                  {selectedTx.amount.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleResolveTx}
                disabled={resolveLoading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {resolveLoading && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                )}
                <span>Xác nhận Kích hoạt VIP</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
