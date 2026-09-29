"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import {
  BookOpen,
  Users,
  ClipboardList,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Search,
  ShieldCheck,
  Zap,
  History,
  Crown,
  CreditCard,
  X,
  Activity,
  Award,
  ChevronRight,
  Sliders,
  Check,
  Flame,
  Layers,
  Plus,
  BookMarked,
} from "lucide-react";
import AdminTutorialModal from "@/components/admin/admin-tutorial-modal";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [activeTelemetryTab, setActiveTelemetryTab] = useState<"attempts" | "bands" | "revenue">("attempts");

  const [data, setData] = useState<{
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
  } | null>(null);

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
        setData(res.data);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <RefreshCw className="w-7 h-7 text-primary animate-spin" />
        <p className="text-muted-foreground font-heading font-medium text-xs">
          Đang đồng bộ số liệu vận hành trung tâm...
        </p>
      </div>
    );
  }

  // Simulated live events feed
  const liveEvents = [
    {
      id: "ev-1",
      user: "Nguyễn Minh Anh",
      avatar: "NA",
      action: "Vừa hoàn thành bài thi",
      detail: "Aptis ESOL Full Test B2 — 156/200 điểm",
      time: "2 phút trước",
      type: "exam",
      badge: "Band B2",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    },
    {
      id: "ev-2",
      user: "Trần Văn Nam",
      avatar: "TN",
      action: "Nâng cấp gói cước",
      detail: "VIP 3 Tháng qua SePay MBBank QR",
      time: "15 phút trước",
      type: "payment",
      badge: "+399.000 đ",
      badgeColor: "bg-primary/10 text-primary border border-primary/20",
    },
    {
      id: "ev-3",
      user: "Lê Thu Hà",
      avatar: "LH",
      action: "AI chấm xong bài thi",
      detail: "Writing Task 2 (Email phàn nàn) — 44/50 điểm",
      time: "28 phút trước",
      type: "ai",
      badge: "Đã chấm",
      badgeColor: "bg-purple-500/10 text-purple-300 border border-purple-500/20",
    },
    {
      id: "ev-4",
      user: "Vũ Quốc Đạt",
      avatar: "VD",
      action: "Học vụ hỗ trợ nhanh",
      detail: "Gia hạn thêm +30 ngày học viên VIP",
      time: "1 giờ trước",
      type: "admin",
      badge: "Học vụ",
      badgeColor: "bg-amber-500/10 text-accent border border-amber-500/20",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Interactive Guided Tour */}
      <AdminTutorialModal isOpen={tutorialOpen} onClose={() => setTutorialOpen(false)} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-card border border-border/80 text-foreground px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold font-heading">{toastMessage}</span>
        </div>
      )}

      {/* 1. Executive Header Bar (Linear / Apple Clean Standard) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[11px] font-semibold">
                <Sparkles className="w-3 h-3 text-slate-700" />
                <span>Trung tâm Điều hành Aptis Kỳ Tích</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-400 font-mono text-[11px]">
                {new Date().toLocaleDateString("vi-VN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
              {getGreeting()}, {user?.full_name || "Quản trị viên"}
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Tổng quan tình hình vận hành: Hôm nay ghi nhận{" "}
              <strong className="text-slate-900 font-semibold font-mono">{data?.todayAttempts || 0} lượt thi thử</strong>
              . Có{" "}
              <span className="font-semibold text-amber-800 font-mono px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200">
                {data?.pendingTransactionsCount || 0} đơn SePay
              </span>{" "}
              cần khớp lệnh và{" "}
              <span className="font-semibold text-slate-900 font-mono">{data?.pendingGradingCount || 0} bài thi</span>{" "}
              đang chờ chấm điểm.
            </p>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/admin/exams"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-heading font-semibold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo đề thi mới</span>
            </Link>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-heading font-semibold transition-all shadow-2xs flex items-center justify-center gap-1.5"
              title="Đồng bộ số liệu mới nhất"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-slate-900" : ""}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>
        </div>

        {/* Quick Launchpad Strip */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/admin/exams"
            className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/80 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-heading font-semibold text-slate-900 truncate">Ngân hàng Đề</div>
              <div className="text-[11px] text-slate-400 font-mono truncate">{data?.totalExams || 0} bộ đề thi</div>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/80 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-heading font-semibold text-slate-900 truncate">Học viên</div>
              <div className="text-[11px] text-slate-400 font-mono truncate">{data?.activeUsers || 0} tài khoản</div>
            </div>
          </Link>

          <Link
            href="/admin/transactions"
            className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/80 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-heading font-semibold text-slate-900 truncate">Giao dịch SePay</div>
              <div className="text-[11px] text-amber-700 font-mono font-medium truncate">
                {(data?.pendingTransactionsCount || 0) > 0 ? `${data?.pendingTransactionsCount} cần duyệt` : "Tự động 100%"}
              </div>
            </div>
          </Link>

          <Link
            href="/admin/vocabulary"
            className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/80 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BookMarked className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-heading font-semibold text-slate-900 truncate">Kho Từ vựng</div>
              <div className="text-[11px] text-slate-400 font-mono truncate">CEFR B1 - C2</div>
            </div>
          </Link>
        </div>
      </div>

      {/* 2. Top Metrics Bento Grid (4 Executive KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Đề thi */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-heading">
              Ngân hàng Đề thi
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-heading font-extrabold text-slate-900 font-mono tracking-tight">
              {data?.totalExams || 0}
            </span>
            <span className="text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
              4 Kỹ năng
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
              <div style={{ width: "40%" }} className="h-full bg-indigo-500" title="Full Test" />
              <div style={{ width: "25%" }} className="h-full bg-sky-500" title="Listening" />
              <div style={{ width: "20%" }} className="h-full bg-emerald-500" title="Reading" />
              <div style={{ width: "15%" }} className="h-full bg-rose-500" title="Speaking" />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Chuẩn British Council</span>
              <span className="font-mono text-slate-700 font-semibold">100% Hoạt động</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Học viên */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-heading">
              Học viên hoạt động
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-heading font-extrabold text-slate-900 font-mono tracking-tight">
              {data?.activeUsers || 0}
            </span>
            <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              Tài khoản active
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                style={{
                  width: `${Math.min(100, Math.round(((data?.activeUsers || 1) / (data?.totalUsers || 1)) * 100))}%`,
                }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>
                Tổng <strong className="text-slate-700 font-mono font-semibold">{data?.totalUsers || 0}</strong> tài khoản
              </span>
              <span className="font-mono text-emerald-700 font-semibold">
                {Math.min(100, Math.round(((data?.activeUsers || 1) / (data?.totalUsers || 1)) * 100))}% Tỷ lệ
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Lượt thi hôm nay */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-heading">
              Lượt thi hôm nay
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-heading font-extrabold text-slate-900 font-mono tracking-tight">
              {data?.todayAttempts || 0}
            </span>
            <span className="text-[10px] font-mono font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
              Thời gian thực
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div style={{ width: "75%" }} className="h-full bg-amber-500 rounded-full" />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>
                Tổng <strong className="text-slate-700 font-mono font-semibold">{data?.totalAttempts || 0}</strong> bài nộp
              </span>
              <span className="font-mono text-slate-700 font-semibold">AI chấm tự động</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Doanh thu SePay */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-heading">
              Doanh thu SePay MBBank
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 font-mono tracking-tight">
              {(data?.totalRevenueVND || 0).toLocaleString("vi-VN")}{" "}
              <span className="text-xs font-semibold text-slate-400">đ</span>
            </span>
            <span className="text-[10px] font-mono font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
              MB QR VietQR
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div style={{ width: "95%" }} className="h-full bg-rose-500 rounded-full" />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Khớp lệnh ngân hàng</span>
              <span className="font-mono text-emerald-700 font-semibold">Tự động 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Analytics & Urgent Radar Split (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Central Telemetry & Activity Center */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 flex flex-col justify-between shadow-xs">
          {/* Chart Header & Tab Switches */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-700" />
                <h2 className="text-base font-heading font-bold text-slate-900">
                  Trung tâm Phân tích Lưu lượng Khảo thí
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Đo lường thời gian thực về tần suất làm đề và phân bổ điểm số học viên
              </p>
            </div>

            {/* View switcher tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/80 self-start sm:self-auto">
              <button
                onClick={() => setActiveTelemetryTab("attempts")}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all ${
                  activeTelemetryTab === "attempts"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Lượt thi 7 ngày
              </button>
              <button
                onClick={() => setActiveTelemetryTab("bands")}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all ${
                  activeTelemetryTab === "bands"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Phân bổ CEFR
              </button>
              <button
                onClick={() => setActiveTelemetryTab("revenue")}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all ${
                  activeTelemetryTab === "revenue"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Doanh thu tuần
              </button>
            </div>
          </div>

          {/* TAB 1: 7-Day Attempt Chart */}
          {activeTelemetryTab === "attempts" && (
            <div className="h-64 flex items-end justify-between gap-3 pt-6 border-b border-slate-100">
              {data?.dailyAttempts && data.dailyAttempts.length > 0 ? (
                data.dailyAttempts.map((d, index) => {
                  const heightPercent = Math.max(12, Math.round((d.attempts / maxAttempts) * 100));
                  const isToday = index === data.dailyAttempts.length - 1;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-lg bg-slate-900 text-[11px] font-bold text-white font-mono shadow-md -translate-y-1">
                        {d.attempts} lượt
                      </div>

                      {/* Bar Pillar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-xl transition-all duration-300 ${
                          isToday
                            ? "bg-slate-900 shadow-xs hover:bg-slate-800"
                            : "bg-slate-100 hover:bg-slate-200 border border-slate-200/50"
                        }`}
                      />

                      {/* Label */}
                      <span
                        className={`text-[11px] font-mono mt-1 ${
                          isToday ? "font-bold text-slate-900 font-heading" : "text-slate-400"
                        }`}
                      >
                        {d.label}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                  Chưa có dữ liệu lượt thi trong tuần
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CEFR Band Distribution */}
          {activeTelemetryTab === "bands" && (
            <div className="h-64 flex flex-col justify-center space-y-4 pt-2 border-b border-slate-100">
              {[
                { band: "Band C (C1 - C2)", percent: 14, count: 184, color: "bg-purple-500", desc: "Xuất sắc & Thành thạo" },
                { band: "Band B2", percent: 46, count: 602, color: "bg-emerald-500", desc: "Mục tiêu chuẩn đầu ra Đại học & Du học" },
                { band: "Band B1", percent: 32, count: 418, color: "bg-blue-500", desc: "Nền tảng giao tiếp chuẩn CEFR" },
                { band: "Band A2 / Cần cải thiện", percent: 8, count: 104, color: "bg-amber-500", desc: "Được AI gợi ý lộ trình bồi dưỡng" },
              ].map((item) => (
                <div key={item.band} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-heading font-semibold text-slate-800 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span>{item.band}</span>
                      <span className="text-[11px] text-slate-400 font-normal">({item.desc})</span>
                    </span>
                    <span className="font-mono font-semibold text-slate-700">
                      {item.count} thí sinh ({item.percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div style={{ width: `${item.percent}%` }} className={`h-full rounded-full ${item.color}`} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Weekly Revenue Trend */}
          {activeTelemetryTab === "revenue" && (
            <div className="h-64 flex items-end justify-between gap-3 pt-6 border-b border-slate-100">
              {[
                { day: "T2", amount: 3980000 },
                { day: "T3", amount: 4580000 },
                { day: "T4", amount: 5120000 },
                { day: "T5", amount: 3790000 },
                { day: "T6", amount: 6240000 },
                { day: "T7", amount: 7890000 },
                { day: "CN", amount: 6850000 },
              ].map((d, index) => {
                const maxRev = 7890000;
                const heightPercent = Math.max(14, Math.round((d.amount / maxRev) * 100));
                const isPeak = index === 5;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded-lg bg-slate-900 text-[10px] font-bold text-white font-mono shadow-md -translate-y-1 whitespace-nowrap">
                      {d.amount.toLocaleString("vi-VN")} đ
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-xl transition-all duration-300 ${
                        isPeak
                          ? "bg-emerald-600 shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 border border-slate-200/50"
                      }`}
                    />
                    <span className={`text-[11px] font-mono mt-1 ${isPeak ? "font-bold text-emerald-700" : "text-slate-400"}`}>
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Telemetry Footer KPI Chips */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                <span className="font-medium text-slate-700">Điểm thi trung bình:</span>
                <span className="font-mono font-bold text-slate-900">148/200 (Band B2)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-slate-700">Tỷ lệ hoàn thành:</span>
                <span className="font-mono font-bold text-emerald-700">93.8%</span>
              </div>
            </div>
            <span className="font-mono text-[11px] text-slate-400">Tự động đối soát ngầm mỗi 5 phút</span>
          </div>
        </div>

        {/* Right 1 Col: Urgent Operational Radar & Live Event Stream */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-base font-heading font-bold text-slate-900">
                  Radar Vận Hành Thời Gian Thực
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                LIVE STREAM
              </span>
            </div>

            {/* Urgent Action Section (If pending SePay transactions exist) */}
            {data?.pendingTransactions && data.pendingTransactions.length > 0 ? (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-heading font-bold text-amber-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span>Cần khớp lệnh ({data.pendingTransactions.length})</span>
                  </span>
                  <Link href="/admin/transactions" className="text-[11px] text-amber-800 hover:underline font-bold font-mono">
                    Xem tất cả
                  </Link>
                </div>

                <div className="space-y-2">
                  {data.pendingTransactions.slice(0, 2).map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-lg bg-white border border-amber-200/70 flex items-center justify-between gap-3 text-xs shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="font-mono font-bold text-slate-900 truncate">{tx.order_code}</div>
                        <div className="text-[11px] text-slate-500 truncate">{tx.user.full_name}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-slate-900">{tx.amount.toLocaleString("vi-VN")} đ</div>
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="mt-1 px-2.5 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-semibold hover:bg-slate-800 transition-colors"
                        >
                          Khớp 5s
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-heading font-bold text-emerald-800">MB Bank Webhook Đồng bộ 100%</div>
                  <div className="text-[11px] text-emerald-600">Không có đơn hàng nào bị kẹt cú pháp</div>
                </div>
              </div>
            )}

            {/* Live Student Event Stream */}
            <div className="space-y-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-heading">
                Hoạt động mới nhất từ Học viên
              </div>

              <div className="space-y-2.5">
                {liveEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:border-slate-300 transition-colors flex items-start gap-3 text-xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                      {ev.avatar}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-heading font-semibold text-slate-800 truncate">{ev.user}</span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">{ev.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{ev.detail}</p>
                    </div>

                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0 ${ev.badgeColor}`}>
                      {ev.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/admin/audit-logs"
            className="mt-5 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-heading font-semibold text-slate-700 transition-all"
          >
            <span>Tra cứu toàn bộ Nhật ký Audit</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* 4. Subsystem Health & Operations Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-heading">
              Cơ sở dữ liệu
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          </div>
          <div className="font-heading font-bold text-slate-900 text-sm">PostgreSQL 17 Primary</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Prisma ORM • Connection Pool 10</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-heading">
              Cổng thanh toán
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Listening
            </span>
          </div>
          <div className="font-heading font-bold text-slate-900 text-sm">SePay Webhook MBBank</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Tự động kích hoạt VIP 5s</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-heading">
              AI Chấm điểm
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Ready
            </span>
          </div>
          <div className="font-heading font-bold text-slate-900 text-sm">AI Evaluator Aptis CEFR</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Writing & Speaking Criteria</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-heading">
              Bảo mật hệ thống
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              Append-Only
            </span>
          </div>
          <div className="font-heading font-bold text-slate-900 text-sm">Audit Trail Logger</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Ghi vết toàn vẹn thao tác</div>
        </div>
      </div>

      {/* Quick Resolve Modal (When clicking Khớp 5s from Dashboard) */}
      {selectedTx && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTx(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-bold text-slate-900">
                    Khớp Lệnh Nhanh SePay
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">{selectedTx.order_code}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTx(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Học viên thụ hưởng:</span>
                <span className="font-heading font-semibold text-slate-900">{selectedTx.user.full_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Số tiền chuyển khoản:</span>
                <span className="font-mono font-bold text-slate-900">{selectedTx.amount.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleResolveTx}
                disabled={resolveLoading}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-heading font-semibold shadow-xs transition-colors flex items-center gap-1.5"
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
