"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import {
  History,
  Search,
  RefreshCw,
  ShieldCheck,
  CreditCard,
  User,
  BookOpen,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  Layers,
  X,
  Sparkles,
  Terminal,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Mail,
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

      if (logsRes && logsRes.success && Array.isArray(logsRes.data)) {
        setLogs(logsRes.data);
        if (logsRes.meta) {
          setTotalPages(logsRes.meta.totalPages || 1);
          setTotalCount(logsRes.meta.total || logsRes.data.length);
        } else {
          setTotalCount(logsRes.data.length);
        }
      } else {
        setLogs([]);
        setTotalCount(0);
      }

      if (statsRes && statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.warn("Không thể tải nhật ký kiểm toán từ API:", err);
      setLogs([]);
      setTotalCount(0);
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-heading font-semibold text-[10px] border border-emerald-200 dark:border-emerald-800/60">
            <CreditCard className="w-3 h-3" />
            Khớp lệnh SePay
          </span>
        );
      case "USER_ROLE_CHANGE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-heading font-semibold text-[10px] border border-amber-200 dark:border-amber-800/60">
            <ShieldCheck className="w-3 h-3" />
            Cấp / Gia hạn VIP
          </span>
        );
      case "USER_STATUS_CHANGE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-heading font-semibold text-[10px] border border-rose-200 dark:border-rose-800/60">
            <Lock className="w-3 h-3" />
            Khóa / Mở tài khoản
          </span>
        );
      case "AUTH_PASSWORD_RESET":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-heading font-semibold text-[10px] border border-blue-200 dark:border-blue-800/60">
            <ShieldCheck className="w-3 h-3" />
            Đổi mật khẩu
          </span>
        );
      case "USER_CREATE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-heading font-semibold text-[10px] border border-indigo-200 dark:border-indigo-800/60">
            <User className="w-3 h-3" />
            Tạo tài khoản
          </span>
        );
      case "EXAM_CREATE":
      case "EXAM_UPDATE":
      case "EXAM_DELETE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-heading font-semibold text-[10px] border border-purple-200 dark:border-purple-800/60">
            <BookOpen className="w-3 h-3" />
            Biên tập Đề thi
          </span>
        );
      case "PLAN_UPDATE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-heading font-semibold text-[10px] border border-sky-200 dark:border-sky-800/60">
            <Layers className="w-3 h-3" />
            Cập nhật Gói / Quota
          </span>
        );
      case "EMAIL_NOTIFICATION_SENT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-heading font-semibold text-[10px] border border-cyan-200 dark:border-cyan-800/60">
            <Mail className="w-3 h-3" />
            Gửi Email
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-heading font-medium text-[10px] border border-slate-200 dark:border-slate-700">
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
    <div className="space-y-5 pb-16">
      {/* 1. TOP HEADER & METRICS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold mb-1.5">
            <ShieldCheck className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            <span>Enterprise Audit Trail & Compliance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Nhật Ký Kiểm Toán Hệ Thống</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
            Ghi nhận toàn bộ thao tác vận hành, đối soát thay đổi và bảo vệ tính toàn vẹn hệ thống
          </p>

          {/* Quick Metrics Strip */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-0.5">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold font-heading uppercase tracking-wider">
              Chỉ số:
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <History className="w-3 h-3 text-purple-500" />
              <span>Tổng log: <strong className="text-slate-900 dark:text-white font-mono">{stats?.totalLogs || totalCount}</strong></span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
              <Clock className="w-3 h-3 text-blue-500" />
              <span>Hôm nay: <strong className="font-mono">{stats?.todayLogs || 0}</strong> thao tác</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Toàn vẹn: <strong className="font-semibold">Append-Only</strong></span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={toggleMetrics}
            className={`px-3 py-2 rounded-xl border text-xs font-heading font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer ${
              showMetrics
                ? "bg-slate-900 dark:bg-slate-700 border-slate-900 dark:border-slate-600 text-white"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
            title={showMetrics ? "Thu gọn thống kê" : "Xem thống kê chi tiết"}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showMetrics ? "Thu gọn chỉ số" : "Chỉ số chi tiết"}</span>
            {showMetrics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-heading font-semibold transition-all shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600 dark:text-blue-400" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. KPI CARDS (COLLAPSIBLE) */}
      {showMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-heading">
                Tổng số bản ghi log
              </div>
              <div className="text-xl font-heading font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
                {stats?.totalLogs || totalCount}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-heading">
                Ghi nhận trong ngày
              </div>
              <div className="text-xl font-heading font-extrabold text-blue-600 dark:text-blue-400 mt-0.5 font-mono">
                {stats?.todayLogs || 0} thao tác
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-heading">
                Bảo mật toàn vẹn
              </div>
              <div className="text-xs font-heading font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Chuẩn Append-Only</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TOOLBAR: SEARCH & ACTION FILTER TABS */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo nội dung, người thao tác..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-sans"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto w-full md:w-auto">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "PAYMENT_MANUAL_RESOLVE", label: "Khớp lệnh" },
            { id: "USER_ROLE_CHANGE", label: "Cấp VIP" },
            { id: "USER_STATUS_CHANGE", label: "Khóa TK" },
            { id: "AUTH_PASSWORD_RESET", label: "Đổi MK" },
            { id: "EXAM_CREATE", label: "Tạo đề" },
            { id: "PLAN_UPDATE", label: "Gói cước" },
            { id: "EMAIL_NOTIFICATION_SENT", label: "Gửi Email" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActionFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold whitespace-nowrap transition-all cursor-pointer ${
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

      {/* 4. LOGS DATA TABLE */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-heading font-bold text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Thời gian</th>
                <th className="py-3 px-4">Loại hành động</th>
                <th className="py-3 px-4">Người thực hiện</th>
                <th className="py-3 px-4">Nội dung diễn giải</th>
                <th className="py-3 px-4">Địa chỉ IP</th>
                <th className="py-3 px-4 text-right pr-6">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-900 dark:text-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 dark:text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                    Đang đồng bộ nhật ký kiểm toán...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 dark:text-slate-500 font-normal">
                    Không tìm thấy bản ghi kiểm toán nào
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 sm:px-6 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {new Date(log.created_at).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          {new Date(log.created_at).toLocaleDateString("vi-VN")}
                        </div>
                      </td>

                      {/* Action Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4">
                        <div className="font-heading font-semibold text-slate-900 dark:text-slate-100">
                          {log.actor_name}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                          {log.actor_email}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 max-w-md">
                        <div className="font-normal text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                          {log.description}
                        </div>
                      </td>

                      {/* IP & Device */}
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                          {log.ip_address || "127.0.0.1"}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
                          {log.user_agent ? "Chrome Web" : "Hệ thống"}
                        </div>
                      </td>

                      {/* Action View */}
                      <td className="py-3 px-4 text-right pr-6">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLog(log);
                            setDetailTab("visual");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-heading font-semibold text-[11px] transition-all inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
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
        <div className="p-3.5 bg-slate-50/60 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Hiển thị <span className="font-semibold text-slate-900 dark:text-white font-mono">{filteredLogs.length}</span> /{" "}
            <span className="font-semibold text-slate-900 dark:text-white font-mono">{totalCount}</span> bản ghi
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700 dark:text-slate-300 px-2 font-mono text-xs">
              Trang {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. DETAIL MODAL (APPLE CLEAN STYLE) */}
      {selectedLog && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLog(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                    Chi tiết Bản ghi Kiểm toán
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                    ID: {selectedLog.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setDetailTab("visual")}
                className={`py-2.5 px-3 text-xs font-heading font-semibold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                  detailTab === "visual"
                    ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tóm tắt trực quan</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailTab("json")}
                className={`py-2.5 px-3 text-xs font-heading font-semibold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                  detailTab === "json"
                    ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>JSON Raw Diff</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Event Description Card */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 p-3.5 space-y-1">
                <div className="font-heading font-semibold text-slate-700 dark:text-slate-300">
                  Nội dung thao tác:
                </div>
                <div className="text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
                  {selectedLog.description}
                </div>
              </div>

              {/* Actor & Meta Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold font-heading block mb-1">
                    Người thực hiện
                  </span>
                  <div className="font-heading font-semibold text-slate-900 dark:text-white">
                    {selectedLog.actor_name}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                    {selectedLog.actor_email}
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium mt-1">
                    Vai trò: <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedLog.actor_role}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold font-heading block mb-1">
                    Môi trường thao tác
                  </span>
                  <div className="font-mono text-slate-900 dark:text-white font-semibold">
                    IP: {selectedLog.ip_address || "127.0.0.1"}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] mt-0.5">
                    {new Date(selectedLog.created_at).toLocaleString("vi-VN")}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-1">
                    {selectedLog.user_agent || "Web Browser"}
                  </div>
                </div>
              </div>

              {/* Visual Diff View */}
              {detailTab === "visual" && (
                <div className="space-y-2.5">
                  <div className="font-heading font-semibold text-slate-900 dark:text-white">
                    Dữ liệu đối chiếu:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-3 space-y-1">
                      <div className="font-heading font-semibold text-rose-700 dark:text-rose-400 text-[11px]">
                        Giá trị cũ (Trước thay đổi)
                      </div>
                      <pre className="font-mono text-[10px] text-slate-800 dark:text-rose-200 whitespace-pre-wrap break-all bg-white dark:bg-slate-900 p-2 rounded-lg border border-rose-100 dark:border-rose-900/30">
                        {selectedLog.old_value
                          ? JSON.stringify(selectedLog.old_value, null, 2)
                          : "(Không có giá trị cũ)"}
                      </pre>
                    </div>

                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-1">
                      <div className="font-heading font-semibold text-emerald-700 dark:text-emerald-400 text-[11px]">
                        Giá trị mới (Sau thay đổi)
                      </div>
                      <pre className="font-mono text-[10px] text-slate-800 dark:text-emerald-200 whitespace-pre-wrap break-all bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
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
                  <div className="font-heading font-semibold text-slate-700 dark:text-slate-300 font-mono">
                    Bản ghi Raw JSON:
                  </div>
                  <pre className="bg-slate-950 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed border border-slate-800">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-xs shadow-xs transition-colors cursor-pointer"
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
