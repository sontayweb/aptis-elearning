"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
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
  FileEdit,
  Mic,
  BarChart3,
  DollarSign,
  ChevronRight,
  ArrowUpRight,
  Headphones,
  Sparkles,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  Activity,
  Clock,
  Layers,
  ShieldCheck,
  AlertTriangle,
  CheckCheck,
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

type PeriodKey = "today" | "week" | "month" | "year" | "all" | "custom";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatCompactVND(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2).replace(/\.00$/, "")} tỷ`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")} tr`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000)}k`;
  }
  return amount.toLocaleString("vi-VN");
}

const BAND_HEX_COLORS = ["#8b5cf6", "#10b981", "#3b82f6", "#f59e0b"];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);

  // Time Period Filter State
  const [period, setPeriod] = useState<PeriodKey>("week");
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Interactive Tabs
  const [mainChartMode, setMainChartMode] = useState<"combined" | "attempts" | "revenue">("combined");
  const [rightChartTab, setRightChartTab] = useState<"cefr" | "exams">("cefr");
  const [activityFilter, setActivityFilter] = useState<"all" | "exam" | "payment">("all");

  // Quick resolve modal
  const [selectedTx, setSelectedTx] = useState<{
    id: string;
    order_code: string;
    amount: number;
    user: { full_name: string; email: string };
  } | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ── Fetch Data ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (overridePeriod?: string, overrideFrom?: string, overrideTo?: string) => {
      try {
        const p = overridePeriod || period;
        const f = overrideFrom !== undefined ? overrideFrom : fromDate;
        const t = overrideTo !== undefined ? overrideTo : toDate;

        const res = await api.admin.getDashboardKPIs({
          period: p,
          fromDate: p === "custom" ? f : undefined,
          toDate: p === "custom" ? t : undefined,
        });
        if (res.success && res.data) {
          setData(res.data as DashboardData);
        }
      } catch {
        /* ignore network error */
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

  const handlePeriodChange = (newPeriod: PeriodKey) => {
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
      alert("Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.");
      return;
    }
    if (fromDate > toDate) {
      alert("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
      return;
    }
    setRefreshing(true);
    fetchData("custom", fromDate, toDate);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const handleExportReport = async () => {
    try {
      setExportLoading(true);
      setToast("Đang kết xuất báo cáo CSV...");

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") ||
            localStorage.getItem("auth_token") ||
            localStorage.getItem("token")
          : "";
      const url = api.admin.exportDashboardReportUrl({
        period,
        fromDate: period === "custom" ? fromDate : undefined,
        toDate: period === "custom" ? toDate : undefined,
      });

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error("Máy chủ từ chối kết xuất báo cáo");
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Bao-Cao-Aptis-${period}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setToast("Đã tải xuống báo cáo Excel/CSV thành công!");
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      alert(err.message || "Lỗi khi xuất báo cáo");
    } finally {
      setExportLoading(false);
    }
  };

  // ── Resolve Transaction ────────────────────────────────────────────────────
  const handleResolveTx = async () => {
    if (!selectedTx) return;
    setResolveLoading(true);
    try {
      const res = await api.admin.resolveTransaction(selectedTx.id, {
        status: "COMPLETED",
        note: "Khớp lệnh thủ công bởi Admin trên Bảng điều khiển",
      });
      if (res.success) {
        setToast(`Đã duyệt thành công đơn ${selectedTx.order_code}!`);
        setSelectedTx(null);
        fetchData();
        setTimeout(() => setToast(null), 4000);
      } else {
        alert(res.error?.message || "Không thể duyệt giao dịch");
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setResolveLoading(false);
    }
  };

  // ── Derived Analytics Data ─────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const attemptsList = data?.dailyAttempts ?? [];
    const revenueList = data?.dailyRevenue ?? [];
    const hasRevenueDates = revenueList.some((r) => Boolean(r.date));
    const revByDate = new Map(revenueList.map((r) => [r.date, r.amount]));
    return attemptsList.map((item, idx) => {
      const rev =
        item.date && hasRevenueDates
          ? (revByDate.get(item.date) ?? 0)
          : (revenueList[idx]?.amount ?? 0);
      return {
        date: item.date,
        label: item.label,
        attempts: item.attempts || 0,
        revenue: rev,
        revenueMil: Number((rev / 1_000_000).toFixed(2)),
      };
    });
  }, [data?.dailyAttempts, data?.dailyRevenue]);

  const cefrPieData = useMemo(() => {
    const raw = data?.bandDistribution ?? [];
    const totalCount = raw.reduce((acc, b) => acc + (b.count || 0), 0);
    return raw.map((item, idx) => ({
      ...item,
      value: totalCount > 0 ? item.count : item.percent || 1,
      realCount: item.count || 0,
      hex: BAND_HEX_COLORS[idx % BAND_HEX_COLORS.length],
    }));
  }, [data?.bandDistribution]);

  const totalCefrGraded = useMemo(
    () => (data?.bandDistribution ?? []).reduce((sum, item) => sum + (item.count || 0), 0),
    [data?.bandDistribution]
  );

  const skillDistribution = useMemo(() => {
    const sc = data?.skillCounts || {};
    const items = [
      { key: "FULL_TEST", label: "Đề Thi Thử Full Test (4 Kỹ năng)", count: sc.FULL_TEST || 0, color: "#2563eb", icon: Layers },
      { key: "LISTENING", label: "Đề Luyện Nghe (Listening)", count: sc.LISTENING || 0, color: "#0ea5e9", icon: Headphones },
      { key: "READING", label: "Đề Luyện Đọc (Reading)", count: sc.READING || 0, color: "#10b981", icon: BookOpen },
      { key: "WRITING", label: "Đề Luyện Viết (Writing)", count: sc.WRITING || 0, color: "#f59e0b", icon: FileEdit },
      { key: "SPEAKING", label: "Đề Luyện Nói (Speaking)", count: sc.SPEAKING || 0, color: "#8b5cf6", icon: Mic },
    ];
    const max = Math.max(1, ...items.map((i) => i.count));
    return items.map((i) => ({ ...i, pct: Math.round((i.count / max) * 100) }));
  }, [data?.skillCounts]);

  const filteredActivities = useMemo(() => {
    const list = data?.recentActivities ?? [];
    if (activityFilter === "all") return list;
    return list.filter((a) => a.type === activityFilter);
  }, [data?.recentActivities, activityFilter]);

  const activeRate = Math.min(
    100,
    Math.round(((data?.activeUsers ?? 0) / Math.max(1, data?.totalUsers ?? 1)) * 100)
  );
  const pendingTxCount = data?.pendingTransactionsCount ?? 0;
  const pendingGradingCount = data?.pendingGradingCount ?? 0;
  const pStats = data?.periodStats;

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 pb-16">
        <div className="h-28 rounded-2xl bg-slate-200/70 dark:bg-slate-800/50 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-36 rounded-2xl bg-slate-200/70 dark:bg-slate-800/50 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 h-96 rounded-2xl bg-slate-200/70 dark:bg-slate-800/50 animate-pulse" />
          <div className="lg:col-span-4 h-96 rounded-2xl bg-slate-200/70 dark:bg-slate-800/50 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 antialiased">
      {/* ── Toast Notification ────────────────────────────────────────────── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 dark:bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-4"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toast}</span>
        </div>
      )}

      {/* ── TIER 1: EXECUTIVE HEADER & UNIFIED FILTER BAR ─────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1424] shadow-2xs overflow-hidden">
        {/* Urgent operational banner (Only shown when action is required) */}
        {(pendingTxCount > 0 || pendingGradingCount > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-amber-50/90 dark:bg-amber-950/30 border-b border-amber-200/70 dark:border-amber-800/50 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              {pendingTxCount > 0 && (
                <span className="inline-flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>
                    Có <strong>{pendingTxCount} giao dịch chuyển khoản</strong> đang chờ duyệt kích hoạt VIP
                  </span>
                </span>
              )}
              {pendingGradingCount > 0 && (
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>
                    <strong>{pendingGradingCount} bài thi</strong> đang trong hàng đợi chấm điểm
                  </span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {pendingTxCount > 0 && (
                <Link
                  href="/admin/transactions"
                  className="font-bold text-amber-800 dark:text-amber-300 hover:underline inline-flex items-center gap-1"
                >
                  <span>Duyệt giao dịch</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="p-5 sm:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Left: Title & Period Context */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Trung Tâm Điều Hành &amp; Phân Tích Số Liệu
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Trực tuyến
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Xin chào <strong className="text-slate-800 dark:text-slate-200">{user?.full_name || "Quản trị viên"}</strong>
              {pStats ? (
                <>
                  {" "}· Kỳ báo cáo:{" "}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {pStats.label}
                  </span>{" "}
                  ({new Date(pStats.rangeStart).toLocaleDateString("vi-VN")} –{" "}
                  {new Date(pStats.rangeEnd).toLocaleDateString("vi-VN")})
                </>
              ) : (
                " · Tổng hợp dữ liệu vận hành, tài chính và chất lượng khảo thí Aptis"
              )}
            </p>
          </div>

          {/* Right: Segmented Period Filter + Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
              {[
                { id: "today", label: "Hôm nay" },
                { id: "week", label: "7 ngày" },
                { id: "month", label: "Tháng này" },
                { id: "year", label: "Năm nay" },
                { id: "all", label: "Tất cả" },
                { id: "custom", label: "Tùy chọn" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handlePeriodChange(item.id as PeriodKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    period === item.id
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-2xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Làm mới dữ liệu"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
              </button>

              <button
                type="button"
                onClick={handleExportReport}
                disabled={exportLoading}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{exportLoading ? "Đang xuất..." : "Xuất CSV"}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="hidden sm:inline-flex px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>In</span>
              </button>

              <Link
                href="/admin/exams"
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Quản lý đề thi</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Custom Date Picker Drawer */}
        {showCustomRange && (
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Từ ngày:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Đến ngày:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyCustomRange}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
            >
              Áp dụng
            </button>
          </div>
        )}
      </div>

      {/* ── TIER 2: 4 UNIFIED ENTERPRISE KPI CARDS ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <Link
          href="/admin/transactions"
          className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1424] p-5 shadow-2xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Doanh thu ({pStats?.label || "Kỳ này"})
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-[26px] font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {(pStats ? pStats.revenueVND : data?.totalRevenueVND ?? 0).toLocaleString("vi-VN")}
              </span>
              <span className="text-xs font-semibold text-slate-400">VNĐ</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold">
                {pStats?.paidTransactionsCount ?? 0} đơn thành công
              </span>
              {pStats && pStats.avgOrderValue > 0 && (
                <span className="text-slate-500 dark:text-slate-400">
                  · TB {formatCompactVND(pStats.avgOrderValue)}/đơn
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Tổng lũy kế:{" "}
              <strong className="text-slate-800 dark:text-slate-200 tabular-nums">
                {(data?.totalRevenueVND ?? 0).toLocaleString("vi-VN")} đ
              </strong>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
        </Link>

        {/* Card 2: Exam Submissions */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1424] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Lượt làm bài ({pStats?.label || "Kỳ này"})
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-[26px] font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {(pStats ? pStats.attempts : data?.totalAttempts ?? 0).toLocaleString("vi-VN")}
              </span>
              <span className="text-xs font-semibold text-slate-400">lượt thi</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold">
                Hôm nay: {data?.todayAttempts ?? 0} lượt
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                · Hoàn thành {pStats?.completionRate ?? data?.completionRate ?? 100}%
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Tổng lũy kế:{" "}
              <strong className="text-slate-800 dark:text-slate-200 tabular-nums">
                {(data?.totalAttempts ?? 0).toLocaleString("vi-VN")} bài nộp
              </strong>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Tự động lưu</span>
          </div>
        </div>

        {/* Card 3: Students & Growth */}
        <Link
          href="/admin/users"
          className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1424] p-5 shadow-2xs hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Quy mô Học viên
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-[26px] font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {(data?.totalUsers ?? 0).toLocaleString("vi-VN")}
              </span>
              <span className="text-xs font-semibold text-slate-400">tài khoản</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold">
                +{pStats?.newUsers ?? 0} mới trong kỳ
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                · {activeRate}% kích hoạt
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Đang hoạt động:{" "}
              <strong className="text-slate-800 dark:text-slate-200 tabular-nums">
                {(data?.activeUsers ?? 0).toLocaleString("vi-VN")} học viên
              </strong>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition-colors" />
          </div>
        </Link>

        {/* Card 4: Academic Quality & Exam Bank */}
        <Link
          href="/admin/exams"
          className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1424] p-5 shadow-2xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Điểm TB &amp; Ngân hàng đề
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-[26px] font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {pStats && pStats.avgScore > 0 ? pStats.avgScore : data?.averageScore ?? 145}
              </span>
              <span className="text-xs font-semibold text-slate-400">/ 200 điểm CEFR</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-semibold">
                {data?.totalExams ?? 0} bộ đề chuẩn
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                · {totalCefrGraded} bài đã xếp Band
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Hàng đợi chấm AI/GV:{" "}
              <strong className="text-slate-800 dark:text-slate-200 tabular-nums">
                {pendingGradingCount} bài
              </strong>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </div>
        </Link>
      </div>

      {/* ── TIER 3: INTERACTIVE RECHARTS ANALYTICS (8 COLS + 4 COLS) ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Columns: Time-Series Area / Bar Chart */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1424] shadow-2xs flex flex-col justify-between">
          <div className="p-5 sm:px-6 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Biểu Đồ Diễn Biến Lưu Lượng Thi &amp; Doanh Thu</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Theo dõi trực quan số lượt làm bài và doanh thu thực tế theo từng mốc thời gian ({pStats?.label || "7 ngày qua"})
              </p>
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 self-start sm:self-auto">
              {[
                { id: "combined", label: "Kết hợp" },
                { id: "attempts", label: "Lượt thi" },
                { id: "revenue", label: "Doanh thu" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setMainChartMode(t.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mainChartMode === t.id
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-2xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="h-72 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {mainChartMode === "revenue" ? (
                    <BarChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => formatCompactVND(Number(v))}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        width={56}
                      />
                      <Tooltip
                        formatter={(value: any) => [`${Number(value).toLocaleString("vi-VN")} VNĐ`, "Doanh thu"]}
                        labelFormatter={(label) => `Mốc: ${label}`}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.12)",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="revenue" name="Doanh thu" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={42} />
                    </BarChart>
                  ) : (
                    <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        width={38}
                        allowDecimals={false}
                      />
                      {mainChartMode === "combined" && (
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tickFormatter={(v) => formatCompactVND(Number(v))}
                          tick={{ fontSize: 11, fill: "#10b981" }}
                          axisLine={false}
                          tickLine={false}
                          width={54}
                        />
                      )}
                      <Tooltip
                        formatter={(value: any, name: any) => {
                          if (name === "Doanh thu") {
                            return [`${Number(value).toLocaleString("vi-VN")} VNĐ`, "Doanh thu"];
                          }
                          return [`${value} lượt`, "Lượt làm bài"];
                        }}
                        labelFormatter={(label) => `Thời gian: ${label}`}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.12)",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="attempts"
                        name="Lượt làm bài"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorAttempts)"
                        activeDot={{ r: 5 }}
                      />
                      {mainChartMode === "combined" && (
                        <Area
                          yAxisId="right"
                          type="monotone"
                          dataKey="revenue"
                          name="Doanh thu"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                        />
                      )}
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Chưa có dữ liệu biểu đồ trong kỳ này
                </div>
              )}
            </div>

            {/* Chart Legend & Summary Footer */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  Lượt làm bài trong kỳ: <strong>{pStats?.attempts ?? 0} lượt</strong>
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Doanh thu trong kỳ: <strong>{(pStats?.revenueVND ?? 0).toLocaleString("vi-VN")} VNĐ</strong>
                </span>
              </div>
              <span>
                Tỷ lệ hoàn thành bài thi:{" "}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {pStats?.completionRate ?? data?.completionRate ?? 100}%
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right 4 Columns: CEFR Donut Chart & Exam Skill Breakdown */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1424] shadow-2xs flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {rightChartTab === "cefr" ? "Phân Bổ Band Điểm CEFR" : "Cơ Cấu Ngân Hàng Đề"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {rightChartTab === "cefr"
                  ? "Tỷ lệ đầu ra thực tế của học viên"
                  : `Tổng cộng ${data?.totalExams ?? 0} bộ đề trên hệ thống`}
              </p>
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRightChartTab("cefr")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  rightChartTab === "cefr"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                Phổ CEFR
              </button>
              <button
                type="button"
                onClick={() => setRightChartTab("exams")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  rightChartTab === "exams"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                Kho đề
              </button>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between">
            {rightChartTab === "cefr" ? (
              <>
                {/* Donut Chart with Center Metric */}
                <div className="relative h-48 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cefrPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={54}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="band"
                      >
                        {cefrPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.hex} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, _name: any, props: any) => [
                          `${props.payload.realCount} bài (${props.payload.percent}%)`,
                          props.payload.band,
                        ]}
                        contentStyle={{
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[11px] font-medium text-slate-400">Điểm TB</span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {data?.averageScore ?? 145}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Chuẩn B2
                    </span>
                  </div>
                </div>

                {/* CEFR Legend List */}
                <div className="space-y-2.5 mt-2">
                  {cefrPieData.map((item) => (
                    <div
                      key={item.band}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.hex }}
                        />
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {item.band}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 tabular-nums">
                        <span className="text-slate-500 dark:text-slate-400">{item.realCount} bài</span>
                        <span className="font-bold text-slate-900 dark:text-white w-9 text-right">
                          {item.percent}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Exam Bank Breakdown by Skill (Real Data from skillCounts) */
              <div className="space-y-3.5 my-auto">
                {skillDistribution.map((sk) => {
                  const Icon = sk.icon;
                  return (
                    <div key={sk.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5" style={{ color: sk.color }} />
                          <span>{sk.label}</span>
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {sk.count} đề
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(6, sk.pct)}%`, backgroundColor: sk.color }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Tổng số đề đang mở:</span>
                  <Link
                    href="/admin/exams"
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Quản lý {data?.totalExams ?? 0} bộ đề</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TIER 4: OPERATIONAL WORKSPACE (5 COLS + 7 COLS) ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 5 Columns: Action Queue & Quick Management Shortcuts */}
        <div className="lg:col-span-5 space-y-5">
          {/* Pending Approvals / Queue Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1424] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Hàng Đợi Duyệt &amp; Vận Hành
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Đối soát thanh toán SePay và bài thi tự luận
                </p>
              </div>
              {pendingTxCount === 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  <CheckCheck className="w-3.5 h-3.5" />
                  Đã khớp 100%
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {pendingTxCount} đơn chờ
                </span>
              )}
            </div>

            {data?.pendingTransactions && data.pendingTransactions.length > 0 ? (
              <div className="space-y-2.5">
                {data.pendingTransactions.slice(0, 4).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {tx.user.full_name}{" "}
                        <span className="text-slate-400 font-normal">({tx.order_code})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {tx.user.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {tx.amount.toLocaleString("vi-VN")} đ
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedTx(tx)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Duyệt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Không có giao dịch tồn đọng
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Cổng thanh toán VietQR / SePay đang tự động kích hoạt gói VIP.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Management Directory */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1424] p-5 shadow-2xs space-y-3.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Phân Hệ Quản Trị Nhanh
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  href: "/admin/exams",
                  icon: BookOpen,
                  title: "Ngân hàng Đề thi",
                  desc: `${data?.totalExams ?? 0} bộ đề`,
                  color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50",
                },
                {
                  href: "/admin/key-va-meo-thi",
                  icon: Sparkles,
                  title: "Key & Mẹo Thi",
                  desc: "Đồng bộ 4 kỹ năng",
                  color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50",
                },
                {
                  href: "/admin/users",
                  icon: Users,
                  title: "Quản lý Học viên",
                  desc: `${data?.totalUsers ?? 0} tài khoản`,
                  color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50",
                },
                {
                  href: "/admin/transactions",
                  icon: CreditCard,
                  title: "Lịch sử Giao dịch",
                  desc: "Đối soát doanh thu",
                  color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50",
                },
                {
                  href: "/admin/vocabulary",
                  icon: BookMarked,
                  title: "Từ vựng & Nghe chép",
                  desc: "Kho từ B1 - C1",
                  color: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50",
                },
                {
                  href: "/admin/audit-logs",
                  icon: ShieldCheck,
                  title: "Nhật ký Bảo mật",
                  desc: "Theo dõi thao tác",
                  color: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-all flex items-center gap-3 group"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{item.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 7 Columns: Live Activity Stream Table */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1424] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>Hoạt Động Học Viên &amp; Giao Dịch Gần Đây</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Cập nhật trực tiếp các lượt nộp bài thi và thanh toán mới nhất trên hệ thống
                </p>
              </div>

              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 self-start sm:self-auto">
                {[
                  { id: "all", label: "Tất cả" },
                  { id: "exam", label: "Lượt thi" },
                  { id: "payment", label: "Thanh toán" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActivityFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activityFilter === tab.id
                        ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-2xs font-bold"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {filteredActivities.length > 0 ? (
                filteredActivities.slice(0, 7).map((ev) => (
                  <div
                    key={ev.id}
                    className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          ev.type === "payment"
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50"
                            : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50"
                        }`}
                      >
                        {ev.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {ev.user}
                          </span>
                          <span className="text-[11px] text-slate-400 hidden sm:inline">
                            · {ev.action}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {ev.detail}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${ev.badgeColor}`}>
                        {ev.badge}
                      </span>
                      <span className="text-[11px] text-slate-400 w-20 text-right hidden sm:inline">
                        {ev.time}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Chưa có hoạt động nào trong danh mục này
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Hiển thị {Math.min(7, filteredActivities.length)} sự kiện gần nhất
            </span>
            <Link
              href="/admin/reports"
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Xem báo cáo chi tiết</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── QUICK RESOLVE MODAL (Duyệt giao dịch SePay) ───────────────────── */}
      {selectedTx && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận duyệt thanh toán"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTx(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Xác Nhận Duyệt Giao Dịch
                  </h3>
                  <p className="text-xs text-slate-400">{selectedTx.order_code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Học viên thụ hưởng:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedTx.user.full_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Email tài khoản:</span>
                <span className="text-slate-700 dark:text-slate-300">{selectedTx.user.email}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-2.5 mt-2.5">
                <span className="text-slate-500">Số tiền thanh toán:</span>
                <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {selectedTx.amount.toLocaleString("vi-VN")} VNĐ
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleResolveTx}
                disabled={resolveLoading}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {resolveLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Kích hoạt VIP ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
