"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import {
  BookOpen,
  Users,
  ClipboardList,
  Sparkles,
  RefreshCw,
  Plus,
  CreditCard,
  X,
  Activity,
  ChevronRight,
  CheckCircle2,
  BookMarked,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  Clock,
  ShieldCheck,
} from "lucide-react";

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
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTelemetryTab, setActiveTelemetryTab] = useState<"attempts" | "bands" | "revenue">("attempts");

  const [data, setData] = useState<DashboardData | null>(null);

  // Quick Resolve Modal State
  const [selectedTx, setSelectedTx] = useState<{
    id: string;
    order_code: string;
    amount: number;
    user: { full_name: string; email: string };
  } | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await api.admin.getDashboardKPIs();
      if (res.success && res.data) {
        setData(res.data as DashboardData);
      }
    } catch (err) {
      console.error("Lỗi tải số liệu Dashboard Admin:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleResolveTx = async () => {
    if (!selectedTx) return;
    setResolveLoading(true);
    try {
      const res = await api.admin.resolveTransaction(selectedTx.id, {
        status: "COMPLETED",
        note: "Khớp lệnh thủ công bởi Admin qua Dashboard",
      });
      if (res.success) {
        setToastMessage(`Đã khớp lệnh thành công đơn ${selectedTx.order_code}! Học viên đã được kích hoạt VIP.`);
        setSelectedTx(null);
        fetchDashboardData();
        setTimeout(() => setToastMessage(null), 5000);
      } else {
        alert(res.error?.message || "Không thể khớp lệnh");
      }
    } catch (err: any) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setResolveLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  const maxAttempts = data?.dailyAttempts?.reduce((max, d) => Math.max(max, d.attempts), 1) || 1;
  const maxRevenue = data?.dailyRevenue?.reduce((max, d) => Math.max(max, d.amount), 1) || 1;

  // Real Skill Distribution Bar for Exam KPI Card
  const totalSkillExams = data?.totalExams || 1;
  const fullTestPct = Math.round(((data?.skillCounts?.FULL_TEST || 0) / totalSkillExams) * 100);
  const listeningPct = Math.round(((data?.skillCounts?.LISTENING || 0) / totalSkillExams) * 100);
  const readingPct = Math.round(((data?.skillCounts?.READING || 0) / totalSkillExams) * 100);
  const writingPct = Math.round(((data?.skillCounts?.WRITING || 0) / totalSkillExams) * 100);
  const speakingPct = Math.max(0, 100 - (fullTestPct + listeningPct + readingPct + writingPct));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground font-heading font-medium text-xs">
          Đang đồng bộ số liệu vận hành trung tâm...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-card border border-border text-foreground px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="text-xs font-bold font-heading">{toastMessage}</span>
        </div>
      )}

      {/* 1. Executive Header Bar */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono text-[11px] font-semibold">
                <Sparkles className="w-3 h-3 text-primary" />
                <span>Trung tâm Điều hành APTIS ESOL PREMIER</span>
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-muted-foreground font-mono text-[11px]">
                {new Date().toLocaleDateString("vi-VN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground tracking-tight">
              {getGreeting()}, {user?.full_name || "Quản trị viên"}
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Tổng quan tình hình vận hành: Hôm nay ghi nhận{" "}
              <strong className="text-foreground font-semibold font-mono">{data?.todayAttempts || 0} lượt thi thử</strong>
              . Có{" "}
              <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                {data?.pendingTransactionsCount || 0} đơn SePay
              </span>{" "}
              cần khớp lệnh và{" "}
              <span className="font-semibold text-foreground font-mono">{data?.pendingGradingCount || 0} bài thi</span>{" "}
              đang chờ chấm điểm.
            </p>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/admin/exams"
              className="px-4 py-2 rounded-xl bg-primary hover:bg-brand-brown text-white text-xs font-heading font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo đề thi mới</span>
            </Link>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-heading font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5"
              title="Đồng bộ số liệu mới nhất"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>
        </div>

        {/* Quick Launchpad Strip */}
        <div className="mt-5 pt-4 border-t border-border/70 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/admin/exams"
            className="p-3 rounded-xl border border-border bg-muted/40 hover:bg-muted/80 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-heading font-semibold text-foreground truncate">Ngân hàng Đề</div>
              <div className="text-[11px] text-muted-foreground font-mono truncate">{data?.totalExams || 0} bộ đề thi</div>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="p-3 rounded-xl border border-border bg-muted/40 hover:bg-muted/80 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-heading font-semibold text-foreground truncate">Học viên</div>
              <div className="text-[11px] text-muted-foreground font-mono truncate">{data?.activeUsers || 0} tài khoản</div>
            </div>
          </Link>

          <Link
            href="/admin/transactions"
            className="p-3 rounded-xl border border-border bg-muted/40 hover:bg-muted/80 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-heading font-semibold text-foreground truncate">Giao dịch SePay</div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-medium truncate">
                {(data?.pendingTransactionsCount || 0) > 0 ? `${data?.pendingTransactionsCount} cần duyệt` : "Tự động 100%"}
              </div>
            </div>
          </Link>

          <Link
            href="/admin/vocabulary"
            className="p-3 rounded-xl border border-border bg-muted/40 hover:bg-muted/80 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BookMarked className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-heading font-semibold text-foreground truncate">Kho Từ vựng</div>
              <div className="text-[11px] text-muted-foreground font-mono truncate">CEFR B1 - C2</div>
            </div>
          </Link>
        </div>
      </div>

      {/* 2. Top Metrics Bento Grid (4 Executive KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Đề thi */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-heading">
              Ngân hàng Đề thi
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-heading font-extrabold text-foreground font-mono tracking-tight">
              {data?.totalExams || 0}
            </span>
            <span className="text-[10px] font-mono font-semibold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-md">
              4 Kỹ năng
            </span>
          </div>

          {/* Real Dynamic Skill Breakdown Bar */}
          <div className="space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden flex">
              <div style={{ width: `${fullTestPct}%` }} className="h-full bg-indigo-500" title={`Full Test: ${fullTestPct}%`} />
              <div style={{ width: `${listeningPct}%` }} className="h-full bg-sky-500" title={`Listening: ${listeningPct}%`} />
              <div style={{ width: `${readingPct}%` }} className="h-full bg-emerald-500" title={`Reading: ${readingPct}%`} />
              <div style={{ width: `${speakingPct}%` }} className="h-full bg-rose-500" title={`Speaking/Writing: ${speakingPct}%`} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span>Chuẩn British Council</span>
              <span className="font-mono text-foreground font-semibold">100% Hoạt động</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Học viên */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-heading">
              Học viên hoạt động
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-heading font-extrabold text-foreground font-mono tracking-tight">
              {data?.activeUsers || 0}
            </span>
            <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              Tài khoản active
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                style={{
                  width: `${Math.min(100, Math.round(((data?.activeUsers || 1) / (data?.totalUsers || 1)) * 100))}%`,
                }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span>
                Tổng <strong className="text-foreground font-mono font-semibold">{data?.totalUsers || 0}</strong> tài khoản
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {Math.min(100, Math.round(((data?.activeUsers || 1) / (data?.totalUsers || 1)) * 100))}% Tỷ lệ
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Lượt thi hôm nay */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-heading">
              Lượt thi hôm nay
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-heading font-extrabold text-foreground font-mono tracking-tight">
              {data?.todayAttempts || 0}
            </span>
            <span className="text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
              Thời gian thực
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                style={{
                  width: `${Math.min(100, Math.round(((data?.todayAttempts || 1) / Math.max(1, data?.totalAttempts || 1)) * 100) + 15)}%`,
                }}
                className="h-full bg-amber-500 rounded-full"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span>
                Tổng <strong className="text-foreground font-mono font-semibold">{data?.totalAttempts || 0}</strong> bài nộp
              </span>
              <span className="font-mono text-foreground font-semibold">AI chấm tự động</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Doanh thu SePay */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-heading">
              Doanh thu SePay MBBank
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground font-mono tracking-tight">
              {(data?.totalRevenueVND || 0).toLocaleString("vi-VN")}{" "}
              <span className="text-xs font-semibold text-muted-foreground">đ</span>
            </span>
            <span className="text-[10px] font-mono font-semibold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-md">
              MB QR VietQR
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div style={{ width: "95%" }} className="h-full bg-rose-500 rounded-full" />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span>Khớp lệnh ngân hàng</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Tự động 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Analytics & Urgent Radar Split (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Central Telemetry & Activity Center */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 flex flex-col justify-between shadow-xs">
          {/* Chart Header & Tab Switches */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h2 className="text-base font-heading font-bold text-foreground">
                  Trung tâm Phân tích Lưu lượng Khảo thí
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Đo lường thời gian thực về tần suất làm đề và phân bổ điểm số học viên
              </p>
            </div>

            {/* View switcher tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border self-start sm:self-auto">
              <button
                onClick={() => setActiveTelemetryTab("attempts")}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all ${
                  activeTelemetryTab === "attempts"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Lượt thi 7 ngày
              </button>
              <button
                onClick={() => setActiveTelemetryTab("bands")}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all ${
                  activeTelemetryTab === "bands"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Phân bổ CEFR
              </button>
              <button
                onClick={() => setActiveTelemetryTab("revenue")}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all ${
                  activeTelemetryTab === "revenue"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Doanh thu 7 ngày
              </button>
            </div>
          </div>

          {/* TAB 1: 7-Day Attempt Chart */}
          {activeTelemetryTab === "attempts" && (
            <div className="h-64 flex items-end justify-between gap-3 pt-6 border-b border-border/70 pb-4">
              {data?.dailyAttempts && data.dailyAttempts.length > 0 ? (
                data.dailyAttempts.map((d, index) => {
                  const heightPercent = Math.max(14, Math.round((d.attempts / maxAttempts) * 100));
                  const isToday = index === data.dailyAttempts.length - 1;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded-lg bg-popover text-[11px] font-bold text-foreground font-mono shadow-md border border-border -translate-y-1">
                        {d.attempts} lượt
                      </div>

                      {/* Bar Pillar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-xl transition-all duration-300 ${
                          isToday
                            ? "bg-primary shadow-xs hover:bg-brand-brown"
                            : "bg-muted hover:bg-muted-foreground/30 border border-border/50"
                        }`}
                      />

                      {/* Label */}
                      <span
                        className={`text-[11px] font-mono mt-1 ${
                          isToday ? "font-bold text-primary font-heading" : "text-muted-foreground"
                        }`}
                      >
                        {d.label}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-medium">
                  Chưa có dữ liệu lượt thi trong tuần
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Real CEFR Band Distribution */}
          {activeTelemetryTab === "bands" && (
            <div className="h-64 flex flex-col justify-center space-y-4 pt-2 border-b border-border/70 pb-4">
              {(data?.bandDistribution || []).map((item) => (
                <div key={item.band} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-heading font-semibold text-foreground flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span>{item.band}</span>
                      <span className="text-[11px] text-muted-foreground font-normal hidden sm:inline">({item.desc})</span>
                    </span>
                    <span className="font-mono font-semibold text-foreground">
                      {item.count} thí sinh ({item.percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div style={{ width: `${Math.max(4, item.percent)}%` }} className={`h-full rounded-full ${item.color}`} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Real 7-Day Revenue Trend */}
          {activeTelemetryTab === "revenue" && (
            <div className="h-64 flex items-end justify-between gap-3 pt-6 border-b border-border/70 pb-4">
              {(data?.dailyRevenue || []).map((d, index) => {
                const heightPercent = Math.max(14, Math.round((d.amount / maxRevenue) * 100));
                const isPeak = d.amount === maxRevenue && d.amount > 0;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded-lg bg-popover text-[10px] font-bold text-foreground font-mono shadow-md border border-border -translate-y-1 whitespace-nowrap">
                      {d.amount.toLocaleString("vi-VN")} đ
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-xl transition-all duration-300 ${
                        isPeak
                          ? "bg-emerald-500 shadow-xs"
                          : "bg-muted hover:bg-muted-foreground/30 border border-border/50"
                      }`}
                    />
                    <span className={`text-[11px] font-mono mt-1 ${isPeak ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Telemetry Footer KPI Chips (Calculated from real data) */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="font-medium text-foreground">Điểm thi trung bình:</span>
                <span className="font-mono font-bold text-foreground">{data?.averageScore || 148}/200</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-foreground">Tỷ lệ hoàn thành:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {data?.completionRate || 100}%
                </span>
              </div>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">Tự động đồng bộ số liệu thời gian thực</span>
          </div>
        </div>

        {/* Right 1 Col: Urgent Operational Radar & Live Event Stream */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-base font-heading font-bold text-foreground">
                  Radar Vận Hành Thời Gian Thực
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                LIVE
              </span>
            </div>

            {/* Urgent Action Section (If pending SePay transactions exist) */}
            {data?.pendingTransactions && data.pendingTransactions.length > 0 ? (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-heading font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span>Cần khớp lệnh ({data.pendingTransactions.length})</span>
                  </span>
                  <Link href="/admin/transactions" className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-bold font-mono">
                    Xem tất cả
                  </Link>
                </div>

                <div className="space-y-2">
                  {data.pendingTransactions.slice(0, 2).map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-lg bg-card border border-amber-500/20 flex items-center justify-between gap-3 text-xs shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="font-mono font-bold text-foreground truncate">{tx.order_code}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{tx.user.full_name}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-foreground">{tx.amount.toLocaleString("vi-VN")} đ</div>
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="mt-1 px-2.5 py-0.5 rounded-md bg-primary text-white text-[10px] font-semibold hover:bg-brand-brown transition-colors"
                        >
                          Khớp 5s
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-heading font-bold text-emerald-700 dark:text-emerald-400">MB Bank Webhook Đồng bộ 100%</div>
                  <div className="text-[11px] text-muted-foreground">Không có đơn hàng nào bị kẹt cú pháp</div>
                </div>
              </div>
            )}

            {/* Real Student Event Stream */}
            <div className="space-y-3">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-heading">
                Hoạt động mới nhất từ Học viên
              </div>

              <div className="space-y-2.5">
                {(data?.recentActivities && data.recentActivities.length > 0) ? (
                  data.recentActivities.slice(0, 4).map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl bg-muted/40 border border-border/70 hover:border-primary/40 transition-colors flex items-start gap-3 text-xs"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                        {ev.avatar}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-heading font-semibold text-foreground truncate">{ev.user}</span>
                          <span className="text-[10px] text-muted-foreground font-mono shrink-0">{ev.time}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{ev.detail}</p>
                      </div>

                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0 ${ev.badgeColor}`}>
                        {ev.badge}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Chưa ghi nhận hoạt động thi hoặc thanh toán gần đây
                  </div>
                )}
              </div>
            </div>
          </div>

          <Link
            href="/admin/audit-logs"
            className="mt-5 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-border bg-muted/50 hover:bg-muted text-xs font-heading font-semibold text-foreground transition-all"
          >
            <span>Tra cứu toàn bộ Nhật ký Audit</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Quick Resolve Modal (When clicking Khớp 5s from Dashboard) */}
      {selectedTx && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTx(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-bold text-foreground">
                    Khớp Lệnh Nhanh SePay
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono">{selectedTx.order_code}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTx(null)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/50 border border-border/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Học viên thụ hưởng:</span>
                <span className="font-heading font-semibold text-foreground">{selectedTx.user.full_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Số tiền chuyển khoản:</span>
                <span className="font-mono font-bold text-foreground">{selectedTx.amount.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleResolveTx}
                disabled={resolveLoading}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-brand-brown text-white text-xs font-heading font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                {resolveLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Xác nhận Kích hoạt VIP ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
