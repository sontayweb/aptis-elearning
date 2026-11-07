"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check,
  RotateCcw,
  BookOpen,
  User,
  Eye,
  X,
  MessageSquare,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/admin-page-header";

export interface QuestionReportItem {
  id: string;
  examId: string;
  examTitle: string;
  questionId: string | null;
  questionNumber: number | null;
  reason: string;
  note: string;
  status: "PENDING" | "RESOLVED";
  resolvedAt: string | null;
  resolvedBy: string | null;
  reportedAt: string;
  actorName: string;
  actorEmail: string;
  ipAddress: string | null;
  user?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
}

export default function AdminQuestionReportsPage() {
  const [reports, setReports] = useState<QuestionReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState({ total: 0, pending: 0, resolved: 0 });
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "RESOLVED">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal xem chi tiết
  const [selectedReport, setSelectedReport] = useState<QuestionReportItem | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.getReports({
        page,
        limit: 15,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        search: searchTerm.trim() || undefined,
      });

      if (res && res.success && Array.isArray(res.data)) {
        setReports(res.data);
        if (res.meta) {
          setTotalPages(res.meta.totalPages || 1);
          setTotalItems(res.meta.total || res.data.length);
          if (res.meta.kpi) {
            setKpi(res.meta.kpi);
          }
        }
      } else {
        setReports([]);
        setTotalItems(0);
      }
    } catch (err: any) {
      console.warn("Lỗi tải danh sách báo lỗi câu hỏi:", err);
      setReports([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchTerm]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Cập nhật trạng thái báo lỗi (RESOLVED / PENDING)
  const handleToggleResolve = async (report: QuestionReportItem) => {
    const newStatus = report.status === "RESOLVED" ? "PENDING" : "RESOLVED";
    setActionLoadingId(report.id);
    try {
      const res = await api.admin.resolveReport(report.id, {
        status: newStatus,
        note: newStatus === "RESOLVED" ? "Đã xử lý xong bởi Admin" : "Mở lại để kiểm tra tiếp",
      });

      if (res.success) {
        showToast(
          newStatus === "RESOLVED"
            ? "Đã đánh dấu báo lỗi này là ĐÃ KHẮC PHỤC!"
            : "Đã mở lại báo lỗi về trạng thái ĐANG CHỜ!"
        );
        // Cập nhật state trực tiếp
        setReports((prev) =>
          prev.map((r) =>
            r.id === report.id
              ? {
                  ...r,
                  status: newStatus,
                  resolvedAt: res.data?.resolvedAt || new Date().toISOString(),
                  resolvedBy: res.data?.resolvedBy || "Admin",
                }
              : r
          )
        );
        // Cập nhật KPI
        setKpi((prev) => ({
          ...prev,
          pending: newStatus === "RESOLVED" ? Math.max(0, prev.pending - 1) : prev.pending + 1,
          resolved: newStatus === "RESOLVED" ? prev.resolved + 1 : Math.max(0, prev.resolved - 1),
        }));
        if (selectedReport?.id === report.id) {
          setSelectedReport(null);
        }
      }
    } catch (err: any) {
      alert(err.message || "Không thể cập nhật trạng thái báo lỗi");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Hộp Thư Báo Lỗi Đề Thi & Câu Hỏi"
        infoTooltip="Theo dõi, đối soát và xử lý các phản ánh về đáp án, lỗi âm thanh, chính tả từ học viên trong quá trình làm bài."
        stats={[
          { icon: AlertTriangle, value: kpi.total, label: "phản ánh" },
          { icon: Clock, value: kpi.pending, label: "chờ xử lý", iconColor: "text-amber-500" },
          { icon: CheckCircle2, value: kpi.resolved, label: "đã giải quyết", iconColor: "text-emerald-500" },
        ]}
        actions={
          <button
            onClick={fetchReports}
            disabled={loading}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-heading font-semibold rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-900 dark:text-white" : ""}`} />
            <span>Làm mới</span>
          </button>
        }
      />

      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-3.5 rounded-2xl bg-foreground text-background text-xs font-bold shadow-xl border border-border animate-in fade-in slide-in-from-top-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tổng số phản ánh
            </p>
            <p className="text-2xl font-black font-heading text-foreground mt-1">
              {kpi.total}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-amber-500/30 bg-amber-500/5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Chờ xử lý (Pending)
            </p>
            <p className="text-2xl font-black font-heading text-amber-600 dark:text-amber-400 mt-1">
              {kpi.pending}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-emerald-500/30 bg-emerald-500/5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Đã khắc phục (Resolved)
            </p>
            <p className="text-2xl font-black font-heading text-emerald-600 dark:text-emerald-400 mt-1">
              {kpi.resolved}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên đề thi, nội dung câu hỏi..."
              className="w-full pl-9 pr-3 py-2 text-base sm:text-xs rounded-xl bg-background border border-border focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("ALL");
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "ALL"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tất cả ({kpi.total})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("PENDING");
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                statusFilter === "PENDING"
                  ? "bg-amber-500 text-white shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Chờ sửa</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
                {kpi.pending}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("RESOLVED");
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                statusFilter === "RESOLVED"
                  ? "bg-emerald-600 text-white shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Đã sửa</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
                {kpi.resolved}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchReports()}
            disabled={loading}
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table Data */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-heading font-semibold text-muted-foreground">
                <th className="py-3 px-4">Bộ Đề & Câu Hỏi</th>
                <th className="py-3 px-4">Nội Dung Báo Lỗi</th>
                <th className="py-3 px-4">Người Báo & Thời Gian</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    <span>Đang tải danh sách báo lỗi câu hỏi...</span>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="font-semibold text-foreground">Không có báo lỗi nào phù hợp</p>
                    <p className="text-[11px] mt-1">
                      {statusFilter === "PENDING"
                        ? "Tuyệt vời! Hiện không còn câu hỏi nào đang chờ khắc phục."
                        : "Thử thay đổi từ khóa hoặc bộ lọc để xem các phản ánh khác."}
                    </p>
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const isResolved = report.status === "RESOLVED";
                  const isActing = actionLoadingId === report.id;

                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Bộ Đề & Câu Hỏi */}
                      <td className="py-3.5 px-4 max-w-[260px]">
                        <div className="space-y-1">
                          <p className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {report.examTitle}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[11px]">
                              {report.questionNumber
                                ? `Câu #${report.questionNumber}`
                                : "Câu hỏi đề thi"}
                            </span>
                            <Link
                              href={`/thi-thu/${report.examId}`}
                              target="_blank"
                              className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-0.5"
                            >
                              <span>Làm thử</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* Nội Dung Báo Lỗi */}
                      <td className="py-3.5 px-4 max-w-[320px]">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/30">
                            {report.reason}
                          </span>
                          {report.note ? (
                            <p className="text-foreground line-clamp-2 italic">
                              "{report.note}"
                            </p>
                          ) : (
                            <p className="text-muted-foreground italic text-[11px]">
                              (Không có ghi chú thêm)
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Người Báo & Thời Gian */}
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-foreground font-semibold">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{report.actorName || "Học viên"}</span>
                          </div>
                          <p className="text-[11px]">{report.actorEmail}</p>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(report.reportedAt).toLocaleString("vi-VN", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Trạng Thái */}
                      <td className="py-3.5 px-4 text-center">
                        {isResolved ? (
                          <div className="inline-flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              Đã khắc phục
                            </span>
                            {report.resolvedBy && (
                              <span className="text-[10px] text-muted-foreground">
                                bởi {report.resolvedBy.split("@")[0]}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Đang chờ xử lý
                          </span>
                        )}
                      </td>

                      {/* Thao Tác */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedReport(report)}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="Xem chi tiết báo lỗi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleToggleResolve(report)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              isResolved
                                ? "border border-border text-muted-foreground hover:bg-muted"
                                : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs"
                            }`}
                          >
                            {isActing ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : isResolved ? (
                              <>
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Mở lại</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Đã sửa</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Hiển thị {reports.length} / {totalItems} báo lỗi
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-border hover:bg-muted disabled:opacity-40"
              >
                Trước
              </button>
              <span className="px-2 font-bold text-foreground">
                Trang {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-border hover:bg-muted disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Chi Tiết Báo Lỗi */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-heading font-bold text-base text-foreground">
                  Chi Tiết Báo Lỗi Câu Hỏi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Đề thi:</span>
                <span className="font-bold text-foreground text-sm">
                  {selectedReport.examTitle}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Vị trí câu hỏi:</span>
                  <span className="font-bold text-foreground">
                    {selectedReport.questionNumber ? `Câu #${selectedReport.questionNumber}` : "Toàn bộ bài"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Thời gian báo:</span>
                  <span className="font-semibold text-foreground">
                    {new Date(selectedReport.reportedAt).toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px] mb-1">Lý do báo lỗi:</span>
                <span className="inline-block px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
                  {selectedReport.reason}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px] mb-1">Mô tả của học viên:</span>
                <div className="p-3 rounded-xl bg-background border border-border text-foreground leading-relaxed">
                  {selectedReport.note ? selectedReport.note : "(Không có mô tả chi tiết)"}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1 text-[11px]">
                <p>
                  <strong>Người gửi:</strong> {selectedReport.actorName} ({selectedReport.actorEmail})
                </p>
                {selectedReport.ipAddress && (
                  <p className="text-muted-foreground">
                    <strong>IP Address:</strong> {selectedReport.ipAddress}
                  </p>
                )}
                {selectedReport.resolvedBy && (
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                    ✓ Đã giải quyết bởi {selectedReport.resolvedBy} lúc{" "}
                    {selectedReport.resolvedAt ? new Date(selectedReport.resolvedAt).toLocaleString("vi-VN") : ""}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Link
                href={`/thi-thu/${selectedReport.examId}`}
                target="_blank"
                className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted inline-flex items-center gap-1.5"
              >
                <span>Mở bài thi trực tiếp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleResolve(selectedReport)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                    selectedReport.status === "RESOLVED"
                      ? "border border-border text-muted-foreground hover:bg-muted"
                      : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs"
                  }`}
                >
                  {selectedReport.status === "RESOLVED" ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Mở lại báo lỗi</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đánh dấu đã sửa</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
