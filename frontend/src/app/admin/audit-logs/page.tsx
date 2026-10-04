"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  CreditCard,
  User,
  BookOpen,
  Calendar,
  Clock,
  Globe,
  Monitor,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  FileCode,
  X,
  Sparkles,
  ArrowRight,
  Terminal,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface AuditLogItem {
  id: string;
  user_id?: string | null;
  actor_name: string;
  actor_email: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalLogs: number;
    todayLogs: number;
    actionCounts: Array<{ action: string; _count: { action: number } }>;
  } | null>(null);

  const [actionFilter, setActionFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [detailTab, setDetailTab] = useState<"visual" | "json">("visual");

  // Smart Compact Metrics Toggle
  const [showMetrics, setShowMetrics] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_audit_kpi_visible") === "true";
    }
    return false;
  });

  const toggleMetrics = () => {
    setShowMetrics((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_audit_kpi_visible", String(next));
      }
      return next;
    });
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.audit.getLogs({
          action: actionFilter !== "ALL" ? actionFilter : undefined,
          page,
          limit: 15,
        }),
        api.audit.getStats(),
      ]);

      if (logsRes.success && logsRes.data) {
        setLogs(logsRes.data);
        if (logsRes.meta) {
          setTotalPages(logsRes.meta.totalPages || 1);
          setTotalCount(logsRes.meta.total || logsRes.data.length);
        }
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error("Lỗi tải nhật ký kiểm toán:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  // Lock body scroll and handle Escape key for audit log detail modal
  useEffect(() => {
    if (selectedLog) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setSelectedLog(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [selectedLog]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "PAYMENT_MANUAL_RESOLVE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-heading font-semibold text-[10px] border border-emerald-200">
            <CreditCard className="w-3 h-3" />
            Khớp lệnh SePay
          </span>
        );
      case "USER_ROLE_CHANGE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-heading font-semibold text-[10px] border border-amber-200">
            <ShieldCheck className="w-3 h-3" />
            Cấp / Gia hạn VIP
          </span>
        );
      case "USER_STATUS_CHANGE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-heading font-semibold text-[10px] border border-rose-200">
            <Lock className="w-3 h-3" />
            Khóa / Mở tài khoản
          </span>
        );
      case "AUTH_PASSWORD_RESET":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-heading font-semibold text-[10px] border border-blue-200">
            <ShieldCheck className="w-3 h-3" />
            Đổi mật khẩu
          </span>
        );
      case "USER_CREATE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-heading font-semibold text-[10px] border border-indigo-200">
            <User className="w-3 h-3" />
            Tạo tài khoản
          </span>
        );
      case "EXAM_CREATE":
      case "EXAM_UPDATE":
      case "EXAM_DELETE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-heading font-semibold text-[10px] border border-purple-200">
            <BookOpen className="w-3 h-3" />
            Biên tập Đề thi
          </span>
        );
      case "PLAN_UPDATE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-heading font-semibold text-[10px] border border-sky-200">
            <Layers className="w-3 h-3" />
            Cập nhật Gói / Lượt
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-heading font-medium text-[10px] border border-slate-200">
            {action}
          </span>
        );
    }
  };

  const filteredLogs = searchTerm
    ? logs.filter(
        (log) =>
          log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.actor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.actor_email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : logs;

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-slate-800" />
            Nhật ký Kiểm toán Hệ thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Ghi nhận toàn bộ thao tác vận hành, đối soát thay đổi và bảo vệ tính toàn vẹn hệ thống
          </p>

          {/* Mini Metrics Strip (Zero Space Overhead) */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-600 font-heading">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 text-slate-700 font-medium">
              <History className="w-3.5 h-3.5 text-purple-600" />
              <span>Tổng log: <strong className="font-bold text-slate-900 font-mono">{stats?.totalLogs || totalCount}</strong></span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-medium border border-blue-100">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Hôm nay: <strong className="font-bold text-blue-900 font-mono">{stats?.todayLogs || 0}</strong></span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-medium border border-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Toàn vẹn: <strong className="font-bold text-emerald-700">Append-Only</strong></span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={toggleMetrics}
            className={`px-3 py-2 rounded-xl border text-xs font-heading font-semibold transition-all shadow-2xs flex items-center gap-1.5 ${
              showMetrics
                ? "bg-slate-900 border-slate-900 text-white hover:bg-slate-800"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
            title={showMetrics ? "Thu gọn thống kê" : "Xem thống kê chi tiết"}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{showMetrics ? "Thu gọn chỉ số" : "Chỉ số chi tiết"}</span>
            {showMetrics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={fetchLogs}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-heading font-semibold transition-all shadow-2xs flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-900" : ""}`} />
            <span>Làm mới dữ liệu</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Collapsible) */}
      {showMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider font-heading">
                Tổng số bản ghi log
              </div>
              <div className="text-2xl font-heading font-extrabold text-slate-900 mt-0.5 font-mono">
                {stats?.totalLogs || totalCount}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider font-heading">
                Ghi nhận trong ngày
              </div>
              <div className="text-2xl font-heading font-extrabold text-blue-600 mt-0.5 font-mono">
                {stats?.todayLogs || 0} thao tác
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider font-heading">
                Bảo mật toàn vẹn
              </div>
              <div className="text-xs font-heading font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Chuẩn Append-Only</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo nội dung diễn giải, tên nhân viên..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-sans"
          />
        </div>

        {/* Action Filters Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto w-full md:w-auto">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "PAYMENT_MANUAL_RESOLVE", label: "Khớp lệnh" },
            { id: "USER_ROLE_CHANGE", label: "Cấp VIP" },
            { id: "USER_STATUS_CHANGE", label: "Khóa TK" },
            { id: "AUTH_PASSWORD_RESET", label: "Đổi mật khẩu" },
            { id: "EXAM_CREATE", label: "Tạo đề" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActionFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold whitespace-nowrap transition-all ${
                actionFilter === tab.id
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold ring-1 ring-slate-900/5 dark:ring-white/10"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-heading font-bold text-[10px] uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Thời gian</th>
                <th className="py-3.5 px-4">Loại hành động</th>
                <th className="py-3.5 px-4">Người thực hiện</th>
                <th className="py-3.5 px-4">Nội dung diễn giải</th>
                <th className="py-3.5 px-4">Địa chỉ IP</th>
                <th className="py-3.5 px-4 text-right pr-6">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-600" />
                    Đang tải nhật ký kiểm toán...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 font-normal">
                    Không tìm thấy bản ghi kiểm toán nào
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 sm:px-6 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {new Date(log.created_at).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.created_at).toLocaleDateString("vi-VN")}
                        </div>
                      </td>

                      {/* Action Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4">
                        <div className="font-heading font-semibold text-slate-900">{log.actor_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{log.actor_email}</div>
                      </td>

                      {/* Natural Vietnamese Description */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-normal text-slate-700 leading-relaxed text-xs">
                          {log.description}
                        </div>
                      </td>

                      {/* IP & Device */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        <div className="text-slate-700 font-medium">{log.ip_address || "127.0.0.1"}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {log.user_agent ? "Chrome Web" : "Hệ thống"}
                        </div>
                      </td>

                      {/* Action View */}
                      <td className="py-3.5 px-4 text-right pr-6">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setDetailTab("visual");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-heading font-semibold text-[11px] transition-all inline-flex items-center gap-1 border border-slate-200 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Xem</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 bg-slate-50/60 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Hiển thị <span className="font-semibold text-slate-900">{filteredLogs.length}</span> /{" "}
            <span className="font-semibold text-slate-900">{totalCount}</span> bản ghi
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700 px-2 font-mono">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL (Apple Clean Style) */}
      {selectedLog && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLog(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900">Chi tiết Bản ghi Kiểm toán</h3>
                  <p className="text-[11px] text-slate-400 font-mono">ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 px-5 bg-white">
              <button
                onClick={() => setDetailTab("visual")}
                className={`py-3 px-3 text-xs font-heading font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
                  detailTab === "visual"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                <span>Tóm tắt trực quan</span>
              </button>
              <button
                onClick={() => setDetailTab("json")}
                className={`py-3 px-3 text-xs font-heading font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
                  detailTab === "json"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span>JSON Raw Diff</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Event Description Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                <div className="font-heading font-semibold text-slate-700">Nội dung thao tác:</div>
                <div className="text-slate-900 font-medium leading-relaxed">
                  {selectedLog.description}
                </div>
              </div>

              {/* Actor & Meta Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold font-heading block mb-1">
                    Người thực hiện
                  </span>
                  <div className="font-heading font-semibold text-slate-900">{selectedLog.actor_name}</div>
                  <div className="text-slate-500 text-[11px] font-mono">{selectedLog.actor_email}</div>
                  <div className="text-[10px] text-slate-600 font-medium mt-1">
                    Vai trò: <span className="font-semibold text-slate-900">{selectedLog.actor_role}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold font-heading block mb-1">
                    Môi trường thao tác
                  </span>
                  <div className="font-mono text-slate-900 font-semibold">IP: {selectedLog.ip_address || "127.0.0.1"}</div>
                  <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                    {new Date(selectedLog.created_at).toLocaleString("vi-VN")}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-1">
                    {selectedLog.user_agent || "Web Browser"}
                  </div>
                </div>
              </div>

              {/* Visual Diff View */}
              {detailTab === "visual" && (
                <div className="space-y-2.5">
                  <div className="font-heading font-semibold text-slate-900">Dữ liệu đối chiếu:</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 space-y-1">
                      <div className="font-heading font-semibold text-rose-700 text-[11px]">
                        Giá trị cũ (Trước thay đổi)
                      </div>
                      <pre className="font-mono text-[10px] text-slate-800 whitespace-pre-wrap break-all bg-white p-2 rounded-lg border border-rose-100">
                        {selectedLog.old_value
                          ? JSON.stringify(selectedLog.old_value, null, 2)
                          : "(Không có giá trị cũ)"}
                      </pre>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-1">
                      <div className="font-heading font-semibold text-emerald-700 text-[11px]">
                        Giá trị mới (Sau thay đổi)
                      </div>
                      <pre className="font-mono text-[10px] text-slate-800 whitespace-pre-wrap break-all bg-white p-2 rounded-lg border border-emerald-100">
                        {selectedLog.new_value
                          ? JSON.stringify(selectedLog.new_value, null, 2)
                          : "(Không có giá trị mới)"}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* JSON Debug View */}
              {detailTab === "json" && (
                <div className="space-y-1.5">
                  <div className="font-heading font-semibold text-slate-700 font-mono">Bản ghi Raw JSON:</div>
                  <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-semibold text-xs shadow-xs transition-colors"
              >
                Đóng chi tiết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
