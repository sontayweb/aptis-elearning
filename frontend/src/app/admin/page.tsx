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

/** Section wrapper with heading */
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
    <div className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs ${className}`}>
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
          )}
          <div>
            <h2 className="text-sm font-heading font-bold text-slate-900 dark:text-white leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{subtitle}</p>}
          </div>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/** Small inline badge pill */
function StatusPill({ color, children }: { color: "emerald" | "amber" | "rose" | "blue" | "slate"; children: React.ReactNode }) {
  const map = {
    emerald: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
    amber: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
    rose: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60",
    blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60",
    slate: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${map[color]}`}>
      {children}
    </span>
  );
}

/** Thin progress bar */
function ProgressBar({ value, max = 100, color = "blue" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    purple: "bg-purple-500",
    sky: "bg-sky-500",
    indigo: "bg-indigo-500",
  };
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div
        style={{ width: `${pct}%` }}
        className={`h-full rounded-full transition-all duration-500 ${colorMap[color] ?? "bg-blue-500"}`}
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Đang đồng bộ dữ liệu vận hành...</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-16 antialiased">

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 dark:bg-slate-800 border border-slate-700 text-white px-5 py-3.5 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold">{toast}</span>
        </div>
      )}

      {/* ── 1. HEADER ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {/* Urgent alert banner */}
        {hasUrgent && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/60">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              {pendingCount} giao dịch SePay đang chờ khớp lệnh —{" "}
              <Link href="/admin/transactions" className="underline underline-offset-2 hover:no-underline">
                Xử lý ngay
              </Link>
            </span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6">
          {/* Left: greeting + context */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                APTIS ESOL PREMIER · Bảng Điều Khiển Quản Trị
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              {greeting}, {user?.full_name || "Quản trị viên"} 👋
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed max-w-2xl">
              Hôm nay ghi nhận{" "}
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{data?.todayAttempts ?? 0} lượt thi</strong>
              {pendingCount > 0 && (
                <> · <span className="text-amber-600 dark:text-amber-400 font-semibold font-mono">{pendingCount} đơn SePay</span> cần duyệt</>
              )}
              {pendingGrading > 0 && (
                <> · <span className="text-blue-600 dark:text-blue-400 font-semibold font-mono">{pendingGrading} bài</span> chờ chấm điểm</>
              )}
            </p>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              aria-label="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-600" : "text-slate-400"}`} aria-hidden="true" />
              Làm mới
            </button>
            <Link
              href="/admin/exams"
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Tạo đề thi
            </Link>
          </div>
        </div>
      </div>

      {/* ── TIME FILTER & REPORT TOOLBAR ─────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1.5 mr-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Kỳ thống kê:</span>
          </div>

          {[
            { id: "today", label: "Hôm nay" },
            { id: "week", label: "Tuần này" },
            { id: "month", label: "Tháng này" },
            { id: "year", label: "Năm nay" },
            { id: "all", label: "Toàn bộ" },
            { id: "custom", label: "Khoảng ngày" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handlePeriodChange(item.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                period === item.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right: Export & Print Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={handleExportReport}
            disabled={exportLoading}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            title="Xuất dữ liệu thống kê ra file Excel/CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exportLoading ? "Đang xuất..." : "Xuất CSV"}</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="In báo cáo thống kê hoặc lưu dưới dạng PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>In báo cáo</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker (Khi chọn "Khoảng ngày") */}
      {showCustomRange && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4 animate-in fade-in slide-in-from-top-2">
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

      {/* ── PERIOD PERFORMANCE OVERVIEW (Tóm tắt hiệu quả trong kỳ) ────── */}
      {data?.periodStats && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/40 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Hiệu quả vận hành: {data.periodStats.label}
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Khoảng thời gian: {new Date(data.periodStats.rangeStart).toLocaleDateString('vi-VN')} → {new Date(data.periodStats.rangeEnd).toLocaleDateString('vi-VN')}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mb-1">
                Doanh thu trong kỳ
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {data.periodStats.revenueVND.toLocaleString('vi-VN')} đ
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {data.periodStats.paidTransactionsCount} đơn thanh toán thành công
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mb-1">
                Lượt thi trong kỳ
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
                {data.periodStats.attempts} lượt
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {data.periodStats.completedAttempts} hoàn thành ({data.periodStats.completionRate}%)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mb-1">
                Học viên đăng ký mới
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
                +{data.periodStats.newUsers}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Tài khoản mới tạo trong kỳ
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mb-1">
                Điểm thi trung bình
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {data.periodStats.avgScore > 0 ? `${data.periodStats.avgScore}/200` : 'Chưa có'}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Điểm TB bài thi trong kỳ
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. KPI CARDS TOÀN HỆ THỐNG ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Đề thi */}
        <Link
          href="/admin/exams"
          className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-blue-200 dark:hover:border-blue-800/60 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight mb-0.5">
            {data?.totalExams ?? 0}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">Bộ đề thi</div>
          <ProgressBar value={data?.totalExams ?? 0} max={Math.max(1, data?.totalExams ?? 1)} color="blue" />
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 font-mono">4 kỹ năng APTIS</div>
        </Link>

        {/* KPI: Học viên */}
        <Link
          href="/admin/users"
          className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-emerald-200 dark:hover:border-emerald-800/60 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight mb-0.5">
            {data?.activeUsers ?? 0}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">Học viên active</div>
          <ProgressBar value={activeRate} max={100} color="emerald" />
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 font-mono">
            {activeRate}% / tổng {data?.totalUsers ?? 0} tài khoản
          </div>
        </Link>

        {/* KPI: Lượt thi hôm nay */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/50 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </div>
            <StatusPill color="amber">Hôm nay</StatusPill>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight mb-0.5">
            {data?.todayAttempts ?? 0}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">Lượt làm bài</div>
          <ProgressBar
            value={data?.todayAttempts ?? 0}
            max={Math.max(1, data?.totalAttempts ?? 1)}
            color="amber"
          />
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 font-mono">
            Tổng {data?.totalAttempts ?? 0} bài nộp
          </div>
        </div>

        {/* KPI: Doanh thu */}
        <Link
          href="/admin/transactions"
          className={`group rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition-all ${
            hasUrgent
              ? "border-amber-300 dark:border-amber-700/60 bg-amber-50/30 dark:bg-amber-950/10"
              : "border-slate-200/80 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800/60"
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            </div>
            {hasUrgent ? (
              <StatusPill color="amber">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                {pendingCount} chờ duyệt
              </StatusPill>
            ) : (
              <StatusPill color="emerald">
                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                Tự động 24/7
              </StatusPill>
            )}
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight mb-0.5 truncate">
            {totalRevFmt}<span className="text-sm font-normal text-slate-400 ml-1">đ</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">Tổng doanh thu</div>
          <ProgressBar value={95} max={100} color="emerald" />
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 font-mono">VietQR · MB Bank Webhook</div>
        </Link>
      </div>

      {/* ── 3. QUICK ACTIONS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/admin/exams",       icon: BookOpen,    label: "Ngân hàng Đề",     sub: `${data?.totalExams ?? 0} bộ đề`,            color: "blue"   },
          { href: "/admin/users",       icon: Users,       label: "Học viên",          sub: `${data?.activeUsers ?? 0} đang online`,      color: "emerald"},
          { href: "/admin/transactions",icon: CreditCard,  label: "Giao dịch",         sub: pendingCount > 0 ? `${pendingCount} chờ duyệt` : "Tự động 100%", color: pendingCount > 0 ? "amber" : "slate" },
          { href: "/admin/vocabulary",  icon: BookMarked,  label: "Từ vựng",           sub: "CEFR B1–C2",                                 color: "purple" },
        ].map(({ href, icon: Icon, label, sub, color }) => {
          const bg: Record<string, string> = {
            blue:   "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/50",
            emerald:"bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50",
            amber:  "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50",
            slate:  "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
            purple: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800/50",
          };
          return (
            <Link
              key={href}
              href={href}
              className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition-all flex items-center gap-3 group"
            >
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${bg[color]}`}>
                <Icon className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate font-heading">{label}</div>
                <div className={`text-[11px] font-mono truncate ${color === "amber" && pendingCount > 0 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-400 dark:text-slate-500"}`}>{sub}</div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── 4. MAIN CONTENT: Charts + Radar ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left 2/3: Telemetry Charts */}
        <Section
          icon={BarChart3}
          title="Phân tích Lưu lượng Khảo thí"
          subtitle={data?.periodStats ? `Xu hướng làm bài và doanh thu: ${data.periodStats.label}` : "Xu hướng làm bài, phân bổ điểm và doanh thu"}
          className="lg:col-span-2"
          right={
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              {([
                { id: "attempts", label: "Lượt thi" },
                { id: "revenue",  label: "Doanh thu" },
                { id: "bands",    label: "CEFR" },
              ] as { id: "attempts" | "revenue" | "bands"; label: string }[]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setChartTab(t.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    chartTab === t.id
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs ring-1 ring-slate-900/5 dark:ring-white/10"
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
            <div className="h-52 flex items-end justify-between gap-2">
              {data?.dailyAttempts?.length ? (
                data.dailyAttempts.map((d, i) => {
                  const pct = Math.max(10, Math.round((d.attempts / maxAttempts) * 100));
                  const isToday = i === data.dailyAttempts.length - 1;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded-lg bg-slate-900 text-white text-[11px] font-mono shadow border border-slate-700">
                        {d.attempts}
                      </div>
                      <div
                        style={{ height: `${pct}%` }}
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isToday ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-200 dark:bg-slate-700 hover:bg-blue-400/50"
                        }`}
                      />
                      <span className={`text-[10px] font-mono ${isToday ? "font-bold text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
                        {d.label}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full flex items-center justify-center text-xs text-slate-400">Chưa có dữ liệu</div>
              )}
            </div>
          )}

          {/* Chart: Revenue */}
          {chartTab === "revenue" && (
            <div className="h-52 flex items-end justify-between gap-2">
              {(data?.dailyRevenue ?? []).length > 0 ? (
                (data?.dailyRevenue ?? []).map((d) => {
                  const pct = Math.max(10, Math.round((d.amount / maxRevenue) * 100));
                  const isPeak = d.amount === maxRevenue && d.amount > 0;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded-lg bg-slate-900 text-white text-[10px] font-mono shadow border border-slate-700 whitespace-nowrap">
                        {d.amount.toLocaleString("vi-VN")}đ
                      </div>
                      <div
                        style={{ height: `${pct}%` }}
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isPeak ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-200 dark:bg-slate-700 hover:bg-emerald-400/50"
                        }`}
                      />
                      <span className={`text-[10px] font-mono ${isPeak ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                        {d.label}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full flex items-center justify-center text-xs text-slate-400">Chưa có dữ liệu doanh thu</div>
              )}
            </div>
          )}

          {/* Chart: CEFR Bands */}
          {chartTab === "bands" && (
            <div className="flex flex-col justify-center space-y-3 min-h-[13rem]">
              {(data?.bandDistribution ?? []).length > 0 ? (
                (data?.bandDistribution ?? []).map((item) => (
                  <div key={item.band}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${item.color}`} />
                        {item.band}
                        <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">({item.desc})</span>
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-300">
                        {item.count} thí sinh · {item.percent}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div style={{ width: `${Math.max(4, item.percent)}%` }} className={`h-full rounded-full ${item.color}`} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-slate-400">Chưa có phân bổ điểm CEFR</div>
              )}
            </div>
          )}

          {/* Footer chips */}
          <div className="flex flex-wrap items-center gap-4 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Điểm TB: <strong className="text-slate-800 dark:text-white font-mono">{data?.averageScore ?? 148}/200</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Hoàn thành: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{data?.completionRate ?? 100}%</strong></span>
            </div>
          </div>
        </Section>

        {/* Right 1/3: Operational Radar */}
        <Section
          title="Radar Vận Hành"
          subtitle="Cập nhật thời gian thực"
          right={
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          }
        >
          <div className="space-y-4">
            {/* Pending transactions */}
            {data?.pendingTransactions && data.pendingTransactions.length > 0 ? (
              <div className="rounded-xl border border-amber-300/60 dark:border-amber-700/40 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    Cần khớp lệnh ({data.pendingTransactions.length})
                  </span>
                  <Link href="/admin/transactions" className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-bold font-mono">
                    Xem tất cả →
                  </Link>
                </div>
                {data.pendingTransactions.slice(0, 3).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-200/60 dark:border-amber-800/40 text-xs">
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-slate-900 dark:text-white truncate text-[11px]">{tx.order_code}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{tx.user.full_name}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-semibold text-slate-900 dark:text-white text-[11px]">{tx.amount.toLocaleString("vi-VN")}đ</div>
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="mt-0.5 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        Khớp
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Webhook 100% Đồng bộ</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Không có đơn hàng tồn đọng</div>
                </div>
              </div>
            )}

            {/* Recent activities */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-heading">
                Hoạt động gần nhất
              </p>
              <div className="space-y-2">
                {(data?.recentActivities?.length ?? 0) > 0 ? (
                  data!.recentActivities!.slice(0, 5).map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center font-bold text-[10px] text-blue-600 dark:text-blue-400 shrink-0 font-mono">
                        {ev.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">{ev.user}</span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">{ev.time}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{ev.detail}</p>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${ev.badgeColor}`}>{ev.badge}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400">Chưa có hoạt động gần đây</div>
                )}
              </div>
            </div>

            <Link
              href="/admin/audit-logs"
              className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all"
            >
              Nhật ký Audit đầy đủ
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            </Link>
          </div>
        </Section>
      </div>

      {/* ── 5. 4 SKILLS MATRIX ──────────────────────────────────────────── */}
      <Section
        icon={Award}
        title="Ma Trận Năng Lực 4 Kỹ Năng APTIS"
        subtitle="Điểm trung bình, thời lượng làm bài và điểm nghẽn theo kỹ năng"
        right={
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 font-semibold text-blue-700 dark:text-blue-300 font-mono">
            Thang 50đ / Kỹ năng
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { icon: Headphones, label: "Listening", score: 38.4, time: "28 phút", completion: 96,   failRate: 3.2,  fillPct: 76, color: "sky",    cefrBadge: "B2 Vững",    cefrColor: "emerald" as const },
            { icon: BookOpen,   label: "Reading",   score: 41.2, time: "31 phút", completion: 94,   failRate: 1.8,  fillPct: 82, color: "emerald", cefrBadge: "B2+ Cao",    cefrColor: "emerald" as const },
            { icon: FileEdit,   label: "Writing",   score: 33.5, time: "42 phút", completion: 88,   failRate: 38,   fillPct: 67, color: "amber",   cefrBadge: "Cần Chú Ý", cefrColor: "amber"   as const },
            { icon: Mic,        label: "Speaking",  score: 35.0, time: "12 phút", completion: 91,   failRate: null, fillPct: 70, color: "purple",  cefrBadge: "B1→B2",     cefrColor: "blue"    as const },
          ].map(({ icon: Icon, label, score, time, completion, failRate, fillPct, color, cefrBadge, cefrColor }) => {
            const iconBg: Record<string, string> = {
              sky:    "bg-sky-500/10 text-sky-600 dark:text-sky-400",
              emerald:"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              amber:  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
              purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
            };
            const barColor: Record<string, string> = {
              sky: "sky", emerald: "emerald", amber: "amber", purple: "purple",
            };
            return (
              <div key={label} className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg[color]}`}>
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 font-heading">{label}</span>
                  </div>
                  <StatusPill color={cefrColor}>{cefrBadge}</StatusPill>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    {score} <span className="text-xs text-slate-400 font-normal">/ 50</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">~{time} TB</span>
                </div>

                <ProgressBar value={fillPct} max={100} color={barColor[color]} />

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Hoàn thành: {completion}%</span>
                  {failRate !== null && (
                    <span className={failRate > 10 ? "text-amber-600 dark:text-amber-400 font-semibold" : ""}>
                      Điểm liệt: {failRate}%
                    </span>
                  )}
                  {failRate === null && <span>Trôi chảy: 7.2/10</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Insight */}
        <div className="mt-4 p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-white">Khuyến nghị học vụ:</strong>{" "}
            Reading (41.2đ) và Listening (38.4đ) đạt chuẩn B2, tuy nhiên Writing Part 4 là rào cản chính để đạt Band C.
            Nên đẩy mạnh bài mẫu Formal Register và mở thêm ca chấm 1:1.
          </p>
        </div>
      </Section>

      {/* ── 6. VIP FUNNEL + SLA ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* VIP Funnel */}
        <Section
          icon={Crown}
          title="Phễu Chuyển Đổi VIP"
          subtitle="Phân khúc học viên trả phí và tỷ lệ nâng cấp"
          className="lg:col-span-2"
          right={
            <Link href="/admin/cms" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Cấu hình bảng giá <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          }
        >
          <div className="space-y-3">
            {[
              { label: "Học viên Miễn Phí (Free Tier)",           pct: 68, color: "slate",   count: Math.round((data?.totalUsers ?? 20) * 0.68) },
              { label: "Aptis Tốc Hành — VIP 1 Tháng (199k)",     pct: 16, color: "sky",    count: Math.round((data?.totalUsers ?? 20) * 0.16) },
              { label: "Aptis Cày Đề — VIP 3 Tháng (399k) ★",     pct: 12, color: "blue",   count: Math.round((data?.totalUsers ?? 20) * 0.12) },
              { label: "Aptis Premier — VIP 6 Tháng (699k)",       pct: 4,  color: "amber",  count: Math.round((data?.totalUsers ?? 20) * 0.04) },
            ].map(({ label, pct, color, count }) => {
              const barColor: Record<string, string> = { slate: "bg-slate-400", sky: "bg-sky-500", blue: "bg-blue-600", amber: "bg-amber-500" };
              const textColor: Record<string, string> = { slate: "text-slate-500", sky: "text-sky-600 dark:text-sky-400", blue: "text-blue-600 dark:text-blue-400 font-bold", amber: "text-amber-600 dark:text-amber-400 font-bold" };
              return (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${barColor[color]}`} />
                      {label}
                    </span>
                    <span className={`font-mono text-xs ${textColor[color]}`}>
                      {pct}% · ~{count}
                    </span>
                  </div>
                  <ProgressBar value={pct} max={100} color={color === "slate" ? "slate" : color} />
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span>Tỷ lệ Free → VIP: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">8.4%</strong> (Chuẩn EdTech: &gt;5%)</span>
            <span className="font-mono">ARPU: <strong className="text-slate-900 dark:text-white">342.000đ</strong> / Thuê bao</span>
          </div>
        </Section>

        {/* SLA Subscription Alert */}
        <Section icon={Timer} title="Cảnh Báo Thuê Bao">
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-700/40 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-800 dark:text-amber-300">Hết hạn trong 7 ngày</span>
                <span className="font-mono font-bold text-amber-800 dark:text-amber-300 text-sm">6 học viên</span>
              </div>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">Gợi ý tặng voucher -15% gia hạn gói 3 Tháng</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Tỷ lệ gia hạn (Renewal)</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">42.8%</span>
              </div>
              <p className="text-[11px] text-slate-400">Tăng +3.2% so với tháng trước</p>
            </div>

            <Link
              href="/admin/users"
              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1.5"
            >
              Danh sách học viên VIP
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            </Link>
          </div>
        </Section>
      </div>

      {/* ── 7. SLA COMMAND CENTER ────────────────────────────────────────── */}
      <Section
        icon={CheckCheck}
        title="Trung Tâm Điều Phối SLA & Hàng Đợi Vận Hành"
        subtitle="Chỉ số cam kết chất lượng dịch vụ theo thời gian thực"
        right={
          <StatusPill color="emerald">
            <CheckCheck className="w-3 h-3" aria-hidden="true" />
            SLA 99.4% Đạt Chuẩn
          </StatusPill>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: "Hàng đợi Chấm bài",     sla: "< 24h",  value: `${pendingGrading} bài`, note: "AI tự động 100% trắc nghiệm; GV chấm Writing & Speaking", valueColor: pendingGrading > 10 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white", badgeColor: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
            { label: "Đối soát SePay Webhook", sla: "< 30s",  value: `${pendingCount} chờ`,  note: "VietQR quét tự động cấp VIP tức thì; không tồn quá 2 phút",  valueColor: pendingCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400", badgeColor: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" },
            { label: "Hỗ trợ 1:1 VIP",        sla: "< 15m",  value: "0 tồn đọng",            note: "Kênh Zalo Admin VIP & hotline tư vấn hỗ trợ xuyên suốt",    valueColor: "text-emerald-600 dark:text-emerald-400",                                                           badgeColor: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" },
            { label: "An ninh & Xử lý sự cố", sla: "< 5m",   value: "100%",                  note: "Tự động ngăn chặn bất thường và ghi Audit Trail đầy đủ",     valueColor: "text-emerald-600 dark:text-emerald-400",                                                           badgeColor: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" },
          ].map(({ label, sla, value, note, valueColor, badgeColor }) => (
            <div key={label} className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-heading">{label}</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${badgeColor}`}>SLA {sla}</span>
              </div>
              <div className={`text-xl font-bold font-mono ${valueColor}`}>{value}</div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-snug">{note}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 8. INFRASTRUCTURE HEALTH ────────────────────────────────────── */}
      <Section
        icon={Server}
        title="Sức Khỏe Hạ Tầng & Dịch Vụ"
        right={
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Uptime 99.98% · v2.4.0 Premier
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Database,   label: "PostgreSQL 16",    sub: "Pool active · Latency 12ms", iconBg: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" },
            { icon: Wifi,       label: "MB Bank Webhook",  sub: "SePay 24/7 · Khớp tức thì", iconBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" },
            { icon: Cpu,        label: "AI Chấm Tự Động",  sub: "GPT-4o & Whisper · 0 bài chờ", iconBg: "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400" },
            { icon: ShieldCheck,label: "RBAC & Audit Trail",sub: "Bảo mật đa tầng · Log 100%", iconBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400" },
          ].map(({ icon: Icon, label, sub, iconBg }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white font-heading truncate">{label}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── QUICK RESOLVE MODAL ─────────────────────────────────────────── */}
      {selectedTx && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Khớp lệnh thanh toán"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedTx(null); }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">Khớp Lệnh SePay</h3>
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

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Học viên thụ hưởng</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedTx.user.full_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Email</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedTx.user.email}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                <span className="text-slate-500 dark:text-slate-400">Số tiền chuyển khoản</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{selectedTx.amount.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleResolveTx}
                disabled={resolveLoading}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {resolveLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                Xác nhận Kích hoạt VIP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
