"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import AdminPageHeader from "@/components/admin/admin-page-header";
import {
  Database,
  Download,
  RotateCcw,
  Trash2,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  FileCode,
  FolderArchive,
  HardDrive,
  Clock,
  Layers,
  Terminal,
  AlertTriangle,
  X,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  HelpCircle,
  Sparkles,
} from "lucide-react";

interface TableStat {
  table: string;
  displayName: string;
  count: number;
}

interface DatabaseStats {
  databaseName: string;
  host: string;
  port: number;
  tables: TableStat[];
  totalRecords: number;
  checkedAt: string;
}

interface BackupItem {
  id: string;
  filename: string;
  type: "sql" | "json";
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  sha256?: string;
  metadata?: {
    totalRecords?: number;
    tablesSummary?: Record<string, number>;
  };
}

export default function DatabaseBackupAdminPage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showMetrics, setShowMetrics] = useState(true);

  // Modal hướng dẫn người dùng
  const [showTutorial, setShowTutorial] = useState(false);

  // Accordion mở rộng chi tiết IT/DevOps
  const [showDevopsDetails, setShowDevopsDetails] = useState(false);

  // Modal khôi phục (Restore confirmation)
  const [restoreModalItem, setRestoreModalItem] = useState<BackupItem | null>(null);
  const [confirmKeyword, setConfirmKeyword] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  // Modal xác nhận xóa
  const [deleteModalItem, setDeleteModalItem] = useState<BackupItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const res = await api.admin.backups.getStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải thống kê dữ liệu:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadBackups = useCallback(async () => {
    try {
      setLoadingBackups(true);
      const res = await api.admin.backups.list();
      if (res.success && Array.isArray(res.data)) {
        setBackups(res.data);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải danh sách sao lưu:", err);
    } finally {
      setLoadingBackups(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadBackups();
  }, [loadStats, loadBackups]);

  // Tạo backup
  const handleCreateBackup = async (type: "full" | "sql" | "json") => {
    try {
      setActionLoading(type);
      setMessage(null);
      const res = await api.admin.backups.create(type);
      if (res.success) {
        setMessage({ type: "success", text: res.message || "Đã tạo bản sao lưu dữ liệu an toàn thành công!" });
        await loadBackups();
      } else {
        setMessage({ type: "error", text: res.message || "Không thể tạo bản sao lưu vào lúc này." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi kết nối khi gửi yêu cầu sao lưu." });
    } finally {
      setActionLoading(null);
    }
  };

  // Thực hiện Restore
  const handleExecuteRestore = async () => {
    if (!restoreModalItem) return;
    try {
      setIsRestoring(true);
      setMessage(null);
      const res = await api.admin.backups.restore(restoreModalItem.filename);
      if (res.success) {
        setMessage({
          type: "success",
          text: `Khôi phục dữ liệu thành công từ bản lưu: ${restoreModalItem.filename}!`,
        });
        setRestoreModalItem(null);
        setConfirmKeyword("");
        await loadStats();
      } else {
        setMessage({ type: "error", text: res.message || "Không thể khôi phục dữ liệu từ tệp đã chọn." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi thực thi trong quá trình khôi phục dữ liệu." });
    } finally {
      setIsRestoring(false);
    }
  };

  // Thực hiện Delete
  const handleExecuteDelete = async () => {
    if (!deleteModalItem) return;
    try {
      setIsDeleting(true);
      setMessage(null);
      const res = await api.admin.backups.delete(deleteModalItem.filename);
      if (res.success) {
        setMessage({ type: "success", text: `Đã xóa bản sao lưu: ${deleteModalItem.filename}` });
        setDeleteModalItem(null);
        await loadBackups();
      } else {
        setMessage({ type: "error", text: res.message || "Lỗi khi xóa bản sao lưu." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi khi xóa bản sao lưu." });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. TOP HEADER — Chuẩn hóa AdminPageHeader */}
      <AdminPageHeader
        title="Sao Lưu & Khôi Phục Dữ Liệu"
        infoTooltip="Bảo vệ toàn vẹn tài khoản học viên, ngân hàng đề thi và kết quả làm bài — Sẵn sàng phục hồi ngay lập tức khi cần thiết."
        stats={[
          { icon: Layers, label: "bản ghi", value: (stats?.totalRecords || 0).toLocaleString("vi-VN"), subValue: stats?.databaseName || "PostgreSQL" },
          { icon: Database, label: "đề thi", value: stats?.tables.find((t) => t.table === "Exam")?.count || 0, subValue: `${stats?.tables.find((t) => t.table === "ExamPart")?.count || 0} phần thi`, iconColor: "text-blue-500" },
          { icon: FileCode, label: "câu hỏi", value: (stats?.tables.find((t) => t.table === "Question")?.count || 0).toLocaleString("vi-VN"), subValue: "5 kỹ năng", iconColor: "text-amber-500" },
          { icon: FolderArchive, label: "nghe chép", value: (stats?.tables.find((t) => t.table === "DictationSentence")?.count || 0).toLocaleString("vi-VN"), subValue: `${stats?.tables.find((t) => t.table === "DictationLesson")?.count || 0} bài học`, iconColor: "text-purple-500" },
        ]}
        showMetricsToggle
        showMetrics={showMetrics}
        onToggleMetrics={() => setShowMetrics((v) => !v)}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all shadow-2xs cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Hướng dẫn sử dụng</span>
            </button>

            <button
              type="button"
              onClick={() => {
                loadStats();
                loadBackups();
              }}
              disabled={loadingStats || loadingBackups}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats || loadingBackups ? "animate-spin text-primary" : ""}`} />
              <span>Làm mới số liệu</span>
            </button>
          </div>
        }
      />

      {/* 2. THÔNG BÁO PHẢN HỒI */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm animate-in fade-in duration-200 ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
            )}
            <span className="font-medium text-xs sm:text-sm">{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. KHỐI THỐNG KÊ QUY MÔ DỮ LIỆU HIỆN TẠI */}
      {showMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Card 1: Tổng bản ghi */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tổng dữ liệu hệ thống
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-foreground font-mono">
              {loadingStats ? "..." : (stats?.totalRecords || 0).toLocaleString("vi-VN")}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span>Hệ thống:</span>
              <span className="font-mono font-semibold text-foreground">{stats?.databaseName || "PostgreSQL"}</span>
            </div>
          </div>

          {/* Card 2: Đề thi & Phần thi */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ngân hàng đề thi
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-foreground font-mono">
              {loadingStats
                ? "..."
                : `${(stats?.tables.find((t) => t.table === "Exam")?.count || 0).toLocaleString("vi-VN")}`}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Gồm <span className="font-semibold text-foreground">{(stats?.tables.find((t) => t.table === "ExamPart")?.count || 0).toLocaleString("vi-VN")}</span> phần thi (Part 1–4)
            </div>
          </div>

          {/* Card 3: Kho câu hỏi */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Kho bài tập &amp; câu hỏi
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <FileCode className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-foreground font-mono">
              {loadingStats
                ? "..."
                : (stats?.tables.find((t) => t.table === "Question")?.count || 0).toLocaleString("vi-VN")}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Đầy đủ 5 kỹ năng Aptis ESOL
            </div>
          </div>

          {/* Card 4: Nghe chép chính tả */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Luyện nghe chép chính tả
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <FolderArchive className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-foreground font-mono">
              {loadingStats
                ? "..."
                : (stats?.tables.find((t) => t.table === "DictationSentence")?.count || 0).toLocaleString("vi-VN")}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Phân bổ trong <span className="font-semibold text-foreground">{stats?.tables.find((t) => t.table === "DictationLesson")?.count || 0}</span> bài học
            </div>
          </div>
        </div>
      )}

      {/* 4. KHỐI THAO TÁC TẠO BẢN SAO LƯU 1-CLICK */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-primary" />
              <span>Tạo Bản Sao Lưu Dữ Liệu An Toàn</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Hệ thống tự động lưu trữ 10 bản sao lưu gần nhất và luân phiên dọn dẹp các bản cũ để tối ưu bộ nhớ máy chủ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleCreateBackup("full")}
              disabled={!!actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
              title="Tạo đồng thời bản lưu dữ liệu gốc và bản đóng gói cấu trúc"
            >
              <Database className={`w-3.5 h-3.5 ${actionLoading === "full" ? "animate-spin" : ""}`} />
              <span>{actionLoading === "full" ? "Đang tạo bản sao lưu..." : "Sao Lưu Toàn Bộ (Khuyên dùng)"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleCreateBackup("sql")}
              disabled={!!actionLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Tệp dữ liệu gốc dùng để khôi phục nhanh trên máy chủ PostgreSQL"
            >
              <FileCode className={`w-3.5 h-3.5 ${actionLoading === "sql" ? "animate-spin" : ""}`} />
              <span>{actionLoading === "sql" ? "Đang trích xuất dữ liệu..." : "Bản Dữ Liệu Gốc (.sql)"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleCreateBackup("json")}
              disabled={!!actionLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Tệp đóng gói dữ liệu nhẹ dùng để đọc hoặc chuyển đổi đề thi"
            >
              <FolderArchive className={`w-3.5 h-3.5 ${actionLoading === "json" ? "animate-spin" : ""}`} />
              <span>{actionLoading === "json" ? "Đang trích xuất dữ liệu..." : "Bản Đóng Gói (.json)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. BẢNG DANH SÁCH CÁC BẢN SAO LƯU SẴN CÓ */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Danh Sách Bản Sao Lưu Hiện Có ({backups.length})</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Bạn có thể tải các bản sao lưu về máy tính cá nhân để cất giữ ngoại tuyến an toàn, hoặc bấm Khôi phục dữ liệu trực tiếp khi cần.
            </p>
          </div>
        </div>

        {loadingBackups ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs font-medium">Đang kiểm tra kho lưu trữ sao lưu...</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-dashed border-border bg-muted/20">
            <Database className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold text-foreground">Chưa có bản sao lưu nào</p>
            <p className="text-xs text-muted-foreground mt-1">
              Bấm nút &quot;Sao Lưu Toàn Bộ&quot; ở trên để tạo bản sao lưu đầu tiên bảo vệ hệ thống.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">Tên Bản Lưu</th>
                  <th className="px-4 py-3">Phân Loại</th>
                  <th className="px-4 py-3">Dung Lượng</th>
                  <th className="px-4 py-3">Thời Gian Tạo</th>
                  <th className="px-4 py-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {backups.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {item.type === "sql" ? (
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                            <FileCode className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                            <FolderArchive className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <span className="font-mono text-xs font-bold text-foreground block">
                            {item.filename}
                          </span>
                          {item.metadata?.totalRecords && (
                            <span className="text-[11px] text-muted-foreground">
                              Chứa {item.metadata.totalRecords.toLocaleString("vi-VN")} bản ghi
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                          item.type === "sql"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {item.type === "sql" ? "Bản SQL Gốc" : "Bản JSON Đóng Gói"}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-foreground font-medium">
                      {item.sizeFormatted}
                    </td>

                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Nút Download nếu là tệp .sql */}
                        {item.type === "sql" && (
                          <a
                            href={api.admin.backups.getDownloadUrl(item.filename)}
                            download={item.filename}
                            className="p-1.5 rounded-lg border border-border hover:bg-muted text-foreground transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Tải tệp sao lưu (.sql) về máy tính cá nhân"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}

                        {/* Nút Restore nếu là tệp .sql */}
                        {item.type === "sql" && (
                          <button
                            type="button"
                            onClick={() => {
                              setRestoreModalItem(item);
                              setConfirmKeyword("");
                            }}
                            className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                            title="Khôi phục dữ liệu từ bản sao lưu này"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        {/* Nút Xóa */}
                        <button
                          type="button"
                          onClick={() => setDeleteModalItem(item)}
                          className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                          title="Xóa bản sao lưu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. KHỐI THÔNG TIN TỰ ĐỘNG HÓA & DÀNH CHO KỸ THUẬT VIÊN (GẤP GỌN GỌN GÀNG) */}
      <div className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDevopsDetails(!showDevopsDetails)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground truncate">
                Lịch Sao Lưu Tự Động &amp; Cấu Hình Máy Chủ (Dành cho IT / Kỹ thuật viên)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Máy chủ đã được cài đặt tự động tạo bản lưu vào 02:00 sáng mỗi ngày. Bấm để xem chi tiết lệnh.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold shrink-0 ml-3">
            <span className="hidden sm:inline">{showDevopsDetails ? "Thu gọn" : "Xem lệnh chi tiết"}</span>
            {showDevopsDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showDevopsDetails && (
          <div className="p-5 pt-0 space-y-3 border-t border-border mt-1 animate-in fade-in duration-150">
            <p className="text-xs text-muted-foreground leading-relaxed pt-3">
              Nếu bạn là quản trị viên hệ thống có quyền truy cập terminal máy chủ, bạn có thể kiểm tra trạng thái hoặc kích hoạt sao lưu trực tiếp:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground block font-sans">
                  1. Lệnh kiểm tra và sao lưu thủ công qua Terminal:
                </span>
                <div className="p-2.5 rounded-lg bg-card border border-border flex items-center justify-between font-mono text-[11px]">
                  <span className="text-primary font-bold">npm run db:status</span>
                  <span className="text-[10px] text-muted-foreground font-sans">Xem số liệu CSDL &amp; bản lưu</span>
                </div>
                <div className="p-2.5 rounded-lg bg-card border border-border flex items-center justify-between font-mono text-[11px]">
                  <span className="text-primary font-bold">npm run db:backup</span>
                  <span className="text-[10px] text-muted-foreground font-sans">Tạo bản lưu toàn diện ngay</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground block font-sans">
                  2. Lịch sao lưu tự động định kỳ trên máy chủ (Cronjob VPS):
                </span>
                <div className="p-2.5 rounded-lg bg-card border border-border font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold break-all">
                  0 2 * * * cd /var/www/aptis/backend &amp;&amp; npm run db:backup
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
                  Hệ thống tự động kích hoạt vào lúc 02:00 sáng hàng ngày, lưu lại 10 bản mới nhất và tự động xóa các bản cũ hơn để tối ưu bộ nhớ.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL HƯỚNG DẪN SỬ DỤNG DÀNH CHO NGƯỜI DÙNG & HỌC VỤ */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-card border border-border shadow-2xl p-6 overflow-y-auto space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground font-heading">
                    Hướng Dẫn Sao Lưu &amp; Khôi Phục Dữ Liệu
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Giải thích dễ hiểu về cơ chế bảo vệ an toàn dữ liệu trên hệ thống APTIS ESOL PREMIER
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTutorial(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-muted-foreground">
              {/* Mục 1 */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5">
                <div className="font-bold text-foreground text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>1. Sao lưu dữ liệu để làm gì?</span>
                </div>
                <p>
                  Sao lưu là thao tác <strong>chụp lại toàn bộ trạng thái dữ liệu</strong> (bao gồm tài khoản học viên, gói VIP đã mua, ngân hàng câu hỏi và toàn bộ kết quả bài thi) tại thời điểm hiện tại. Nếu có bất kỳ sự cố kỹ thuật hoặc thao tác xóa nhầm, bạn có thể đưa hệ thống quay lại nguyên vẹn chỉ trong vài giây.
                </p>
              </div>

              {/* Mục 2 */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5">
                <div className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>2. Khi nào bạn nên tạo bản sao lưu?</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                  <li><strong>Trước khi nạp hoặc cập nhật đề thi hàng loạt</strong> (ví dụ tải lên file JSON nhiều đề mới).</li>
                  <li><strong>Định kỳ hàng tuần</strong>: Chủ động tạo 1 bản lưu và bấm biểu tượng tải xuống (.sql) để cất giữ trên máy tính cá nhân.</li>
                  <li><strong>Trước khi nâng cấp hoặc sửa đổi cài đặt hệ thống</strong>.</li>
                </ul>
                <p className="text-[11px] text-muted-foreground italic pt-1">
                  * Hệ thống cũng đã được cài đặt tự động sao lưu ngầm lúc 02:00 sáng mỗi ngày.
                </p>
              </div>

              {/* Mục 3 */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5">
                <div className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>3. Nên chọn nút sao lưu nào?</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-lg bg-card border border-border">
                    <span className="font-bold text-foreground block mb-0.5">Sao Lưu Toàn Bộ (Khuyên dùng)</span>
                    <span>Tạo đầy đủ cả file dữ liệu gốc SQL và file JSON. Phù hợp cho 99% nhu cầu quản trị thông thường.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-card border border-border">
                    <span className="font-bold text-foreground block mb-0.5">Bản Dữ Liệu Gốc (.sql)</span>
                    <span>Chỉ xuất tệp SQL nén để khôi phục trực tiếp trên máy chủ hoặc tải về máy tính lưu trữ ngoại vi.</span>
                  </div>
                </div>
              </div>

              {/* Mục 4 */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5">
                <div className="font-bold text-foreground text-sm flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-purple-500" />
                  <span>4. Khôi phục dữ liệu hoạt động như thế nào?</span>
                </div>
                <p>
                  Khi bấm biểu tượng Khôi phục ở một bản sao lưu, toàn bộ dữ liệu hệ thống sẽ <strong>quay trở lại chính xác mốc thời gian của bản lưu đó</strong>. Hệ thống yêu cầu bạn gõ từ khóa xác nhận <strong className="text-foreground font-mono font-bold">RESTORE</strong> để ngăn chặn mọi thao tác bấm nhầm.
                </p>
              </div>

              {/* Mục 5 */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-1.5">
                <div className="font-bold text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>5. Khuyến nghị: Cất giữ ngoại tuyến an toàn</span>
                </div>
                <p className="text-xs">
                  Trên máy chủ luôn lưu giữ 10 bản sao lưu mới nhất. Để phòng tránh rủi ro sự cố máy chủ, bạn nên định kỳ bấm biểu tượng <strong>Tải xuống (.sql)</strong> để cất giữ tệp trên máy tính cá nhân hoặc Google Drive của trung tâm.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowTutorial(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
              >
                Đã hiểu, đóng hướng dẫn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN KHÔI PHỤC (RESTORE CONFIRMATION) */}
      {restoreModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground font-heading">
                  Xác nhận Khôi phục Dữ liệu Hệ thống?
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Hành động này sẽ khôi phục lại toàn bộ dữ liệu từ bản lưu{" "}
                  <span className="font-mono font-bold text-foreground">
                    {restoreModalItem.filename}
                  </span>{" "}
                  vào hệ thống hiện tại. Dữ liệu mới hơn sau mốc thời gian này sẽ được thay thế bằng dữ liệu của bản sao lưu.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Vui lòng nhập chữ &quot;RESTORE&quot; bên dưới để xác nhận thực hiện:</span>
              </div>
              <input
                type="text"
                value={confirmKeyword}
                onChange={(e) => setConfirmKeyword(e.target.value)}
                placeholder="Nhập chữ RESTORE..."
                className="w-full mt-2 px-3 py-2 rounded-lg bg-background border border-border text-foreground font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRestoreModalItem(null)}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={confirmKeyword.trim() !== "RESTORE" || isRestoring}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? "animate-spin" : ""}`} />
                <span>{isRestoring ? "Đang khôi phục dữ liệu..." : "Xác nhận Khôi phục"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA (DELETE CONFIRMATION) */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground font-heading">Xác Nhận Xóa Bản Sao Lưu</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bản sao lưu này sẽ được xóa vĩnh viễn khỏi máy chủ để giải phóng bộ nhớ.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs font-mono text-foreground break-all">
              {deleteModalItem.filename}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalItem(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? "animate-spin" : ""}`} />
                <span>{isDeleting ? "Đang xóa..." : "Xóa vĩnh viễn"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
