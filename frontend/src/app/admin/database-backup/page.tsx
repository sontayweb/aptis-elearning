"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
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
  ArrowUpRight,
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
      console.error("Lỗi khi tải thống kê CSDL:", err);
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
      console.error("Lỗi khi tải danh sách backup:", err);
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
        setMessage({ type: "success", text: res.message || "Tạo bản sao lưu thành công!" });
        await loadBackups();
      } else {
        setMessage({ type: "error", text: res.message || "Không thể tạo bản sao lưu." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi kết nối khi tạo bản sao lưu." });
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
          text: `🎉 Khôi phục CSDL thành công từ tệp ${restoreModalItem.filename}!`,
        });
        setRestoreModalItem(null);
        setConfirmKeyword("");
        await loadStats();
      } else {
        setMessage({ type: "error", text: res.message || "Lỗi khi khôi phục CSDL." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi thực thi khi khôi phục CSDL." });
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
    <div className="space-y-6">
      {/* 1. HEADER & BREADCRUMB */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/admin" className="hover:text-foreground transition-colors">
              Bảng điều khiển
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Hệ thống</span>
            <span>/</span>
            <span className="text-primary font-semibold">Sao lưu CSDL</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Database className="w-6 h-6 text-primary" />
            Quản Lý & Sao Lưu Cơ Sở Dữ Liệu
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sao lưu vật lý (pg_dump SQL) và sao lưu logic (JSON Snapshot) bảo vệ toàn vẹn 100% dữ liệu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadStats();
              loadBackups();
            }}
            disabled={loadingStats || loadingBackups}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStats || loadingBackups ? "animate-spin" : ""}`} />
            Làm mới số liệu
          </button>
        </div>
      </div>

      {/* 2. THÔNG BÁO FEEDBACK */}
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
            <span className="font-medium">{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. KHỐI THỐNG KÊ DATABASE REALTIME */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tổng số bản ghi
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono">
            {loadingStats ? "..." : (stats?.totalRecords || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <span>CSDL:</span>
            <span className="font-mono font-semibold text-foreground">{stats?.databaseName || "PostgreSQL"}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Đề thi & Phần thi
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono">
            {loadingStats
              ? "..."
              : `${stats?.tables.find((t) => t.table === "Exam")?.count.toLocaleString() || 0}`}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Gồm{" "}
            <span className="font-semibold text-foreground">
              {stats?.tables.find((t) => t.table === "ExamPart")?.count.toLocaleString() || 0}
            </span>{" "}
            parts
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Kho câu hỏi
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <FileCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono">
            {loadingStats
              ? "..."
              : (stats?.tables.find((t) => t.table === "Question")?.count || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Đầy đủ 5 kỹ năng Aptis ESOL
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Nghe chép chính tả
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <FolderArchive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono">
            {loadingStats
              ? "..."
              : (stats?.tables.find((t) => t.table === "DictationSentence")?.count || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Trong{" "}
            <span className="font-semibold text-foreground">
              {stats?.tables.find((t) => t.table === "DictationLesson")?.count || 0}
            </span>{" "}
            bài học
          </div>
        </div>
      </div>

      {/* 4. KHỐI THAO TÁC SAO LƯU 1-CLICK */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-primary" />
              Thao Tác Tạo Bản Sao Lưu Mới
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hệ thống tự động áp dụng chính sách Retention (lưu giữ 10 bản mới nhất, xoay vòng an toàn).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleCreateBackup("full")}
              disabled={!!actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Database className={`w-3.5 h-3.5 ${actionLoading === "full" ? "animate-spin" : ""}`} />
              {actionLoading === "full" ? "Đang tạo bản sao lưu..." : "Sao lưu Toàn diện (Khuyên dùng)"}
            </button>

            <button
              onClick={() => handleCreateBackup("sql")}
              disabled={!!actionLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <FileCode className={`w-3.5 h-3.5 ${actionLoading === "sql" ? "animate-spin" : ""}`} />
              {actionLoading === "sql" ? "Đang xuất SQL..." : "Chỉ xuất SQL Dump"}
            </button>

            <button
              onClick={() => handleCreateBackup("json")}
              disabled={!!actionLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <FolderArchive className={`w-3.5 h-3.5 ${actionLoading === "json" ? "animate-spin" : ""}`} />
              {actionLoading === "json" ? "Đang xuất JSON..." : "Chỉ xuất JSON Snapshot"}
            </button>
          </div>
        </div>
      </div>

      {/* 5. BẢNG DANH SÁCH CÁC BẢN BACKUP */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Lịch Sử Các Bản Sao Lưu Có Sẵn ({backups.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Các tệp .sql có thể tải về lưu trữ ngoại tuyến hoặc dùng khôi phục trực tiếp.
            </p>
          </div>
        </div>

        {loadingBackups ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs">Đang đọc kho lưu trữ sao lưu...</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-dashed border-border bg-muted/20">
            <Database className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-foreground">Chưa có bản sao lưu nào</p>
            <p className="text-xs text-muted-foreground mt-1">
              Bấm nút &quot;Sao lưu Toàn diện&quot; ở trên để tạo bản sao lưu đầu tiên.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">Tên Tệp / Snapshot</th>
                  <th className="px-4 py-3">Định Dạng</th>
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
                              {item.metadata.totalRecords.toLocaleString()} bản ghi
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
                        {item.type.toUpperCase()}
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
                            title="Tải tệp .sql về máy"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}

                        {/* Nút Restore nếu là tệp .sql */}
                        {item.type === "sql" && (
                          <button
                            onClick={() => {
                              setRestoreModalItem(item);
                              setConfirmKeyword("");
                            }}
                            className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                            title="Khôi phục cơ sở dữ liệu từ tệp này"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        {/* Nút Xóa */}
                        <button
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

      {/* 6. HƯỚNG DẪN VẬN HÀNH DÀNH CHO DEVOPS & LẬP TRÌNH VIÊN */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          Lệnh CLI & Tự Động Hóa Vận Hành (Cronjob Production)
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Bạn có thể thực hiện kiểm tra trạng thái hoặc kích hoạt sao lưu nhanh chóng qua terminal mà không cần truy cập giao diện:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-muted/50 border border-border font-mono text-xs text-foreground space-y-1">
            <span className="text-[11px] font-sans font-semibold text-muted-foreground block">
              1. Lệnh Terminal chuẩn:
            </span>
            <div className="text-primary font-bold">npm run db:status</div>
            <div className="text-muted-foreground text-[11px]">→ Xem thống kê CSDL và danh sách sao lưu</div>
            <div className="text-primary font-bold mt-1">npm run db:backup</div>
            <div className="text-muted-foreground text-[11px]">→ Tạo bản sao lưu toàn diện (SQL + JSON)</div>
          </div>

          <div className="p-3 rounded-xl bg-muted/50 border border-border font-mono text-xs text-foreground space-y-1">
            <span className="text-[11px] font-sans font-semibold text-muted-foreground block">
              2. Cronjob tự động sao lưu lúc 02:00 sáng hàng ngày trên VPS:
            </span>
            <div className="text-emerald-600 dark:text-emerald-400">
              0 2 * * * cd /var/www/aptis/backend &amp;&amp; npm run db:backup
            </div>
            <div className="text-muted-foreground text-[11px]">
              Tự động lưu và giữ lại 10 bản mới nhất theo chính sách Retention.
            </div>
          </div>
        </div>
      </div>

      {/* MODAL XÁC NHẬN KHÔI PHỤC (RESTORE CONFIRMATION) */}
      {restoreModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">
                  Xác nhận Khôi phục Cơ sở Dữ liệu?
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Hành động này sẽ nạp lại toàn bộ dữ liệu từ tệp{" "}
                  <span className="font-mono font-bold text-foreground">
                    {restoreModalItem.filename}
                  </span>{" "}
                  vào cơ sở dữ liệu hiện tại. Dữ liệu mới hơn sau mốc thời gian này có thể bị ghi đè.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Vui lòng nhập chữ &quot;RESTORE&quot; bên dưới để xác nhận:
              </div>
              <input
                type="text"
                value={confirmKeyword}
                onChange={(e) => setConfirmKeyword(e.target.value)}
                placeholder="Nhập RESTORE..."
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
                {isRestoring ? "Đang khôi phục..." : "Xác nhận Khôi phục"}
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
                <h3 className="text-base font-bold text-foreground">Xóa Bản Sao Lưu</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Thao tác này sẽ xóa vĩnh viễn tệp sao lưu khỏi ổ cứng.
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
                {isDeleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
