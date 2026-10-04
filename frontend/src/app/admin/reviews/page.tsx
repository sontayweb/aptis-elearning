"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api-client";
import {
  MessageSquare,
  CheckCircle2,
  Trash2,
  Star,
  RefreshCw,
  Trophy,
  User,
  Calendar,
  Send,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  Search,
  Filter,
  Check,
} from "lucide-react";
import ConfirmModal from "@/components/admin/confirm-modal";

interface ReviewItem {
  id: string;
  studentName: string;
  score: string;
  avatarUrl: string;
  comment: string;
  rating: number;
  date: string;
  isApproved?: boolean;
  teacherNote?: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "APPROVED" | "PENDING">("ALL");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.cms.getReviews();
      if (res.success && res.data) {
        const initial = res.data.map((r: any) => ({
          ...r,
          isApproved: r.isApproved !== undefined ? r.isApproved : true,
          teacherNote: r.teacherNote || "",
        }));
        setReviews(initial);
      }
    } catch (err) {
      console.error("Lỗi tải đánh giá học viên:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleApproval = async (id: string, currentApproved: boolean) => {
    const nextApproved = !currentApproved;
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isApproved: nextApproved } : r))
    );
    try {
      await api.cms.updateReview(id, { isApproved: nextApproved });
      showToast(
        nextApproved
          ? "Đã duyệt hiển thị bài đánh giá lên Bảng Vàng Trang chủ!"
          : "Đã ẩn bài đánh giá khỏi trang chủ."
      );
    } catch {
      showToast("Lỗi khi cập nhật trên máy chủ, đã ghi nhận cục bộ.");
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteId) return;
    const targetId = deleteId;
    setReviews((prev) => prev.filter((r) => r.id !== targetId));
    setDeleteId(null);
    try {
      await api.cms.deleteReview(targetId);
      showToast("Đã xóa bài đánh giá thành công!");
    } catch {
      showToast("Lỗi khi xóa bài trên máy chủ, đã ẩn cục bộ.");
    }
  };

  const handleSaveTeacherNote = async (id: string, note: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, teacherNote: note } : r))
    );
    try {
      await api.cms.updateReview(id, { teacherNote: note });
      showToast("Đã lưu lời nhận xét động viên của giáo viên!");
    } catch {
      showToast("Lỗi khi lưu nhận xét trên máy chủ.");
    }
  };

  // Metrics
  const totalCount = reviews.length;
  const approvedCount = reviews.filter((r) => r.isApproved).length;
  const pendingCount = totalCount - approvedCount;
  const avgRating =
    totalCount > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / totalCount).toFixed(1)
      : "5.0";

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      const matchSearch =
        rev.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rev.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rev.score.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === "APPROVED") return rev.isApproved === true;
      if (statusFilter === "PENDING") return rev.isApproved === false;
      return true;
    });
  }, [reviews, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-slate-800 text-white px-5 py-3.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-heading font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold mb-1.5">
            <MessageSquare className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            <span>Cộng đồng & Phản hồi học viên</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Kiểm duyệt Đánh giá Học viên</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
            Phê duyệt cảm nhận học viên thi đạt chứng chỉ Aptis ESOL và thêm nhận xét động viên của thầy cô lên Bảng Vàng
          </p>

          {/* Quick Metrics Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-0.5">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold font-heading uppercase tracking-wider">
              Chỉ số:
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <MessageSquare className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              <span>Tổng: <strong className="text-slate-900 dark:text-white font-mono">{totalCount}</strong></span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Hiển thị: <strong className="text-slate-900 dark:text-white font-mono">{approvedCount}</strong></span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <EyeOff className="w-3 h-3 text-amber-500" />
              <span>Chờ duyệt: <strong className="text-slate-900 dark:text-white font-mono">{pendingCount}</strong></span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>Điểm TB: <strong className="text-slate-900 dark:text-white font-mono">{avgRating} / 5</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={fetchReviews}
          className="self-start sm:self-auto px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-heading font-semibold rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-900 dark:text-white" : ""}`} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên học viên, điểm số, nội dung..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-sans"
          />
        </div>

        <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 flex items-center gap-1 w-full md:w-auto overflow-x-auto">
          {[
            { id: "ALL", label: `Tất cả (${totalCount})` },
            { id: "APPROVED", label: `Đang hiển thị (${approvedCount})` },
            { id: "PENDING", label: `Chờ kiểm duyệt (${pendingCount})` },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold ring-1 ring-slate-900/5 dark:ring-white/10"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-slate-400 dark:text-slate-500 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-600 dark:text-slate-400" />
            Đang tải danh sách bài đánh giá...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-20 text-center text-slate-400 dark:text-slate-500 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 font-normal">
            Không tìm thấy bài đánh giá nào phù hợp với bộ lọc.
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className={`p-5 rounded-2xl border transition-all ${
                rev.isApproved
                  ? "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
                  : "border-amber-300/80 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs"
              }`}
            >
              {/* Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rev.avatarUrl}
                      alt={rev.studentName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as any).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${rev.studentName}`;
                      }}
                    />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      {rev.studentName}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300">
                        <Trophy className="w-3 h-3 text-amber-500 fill-amber-500" /> {rev.score}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" /> {rev.date}
                      </span>
                      <span>•</span>
                      <div className="flex text-amber-400">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div>
                  {rev.isApproved ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Đang hiển thị trên Trang chủ
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400">
                      <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                      Đang ẩn (Chờ phê duyệt)
                    </span>
                  )}
                </div>
              </div>

              {/* Review Body */}
              <div className="py-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal italic">
                &ldquo;{rev.comment}&rdquo;
              </div>

              {/* Teacher Comment Box */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  type="text"
                  defaultValue={rev.teacherNote || ""}
                  placeholder="Gõ nhận xét / lời khen động viên của thầy cô..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveTeacherNote(rev.id, (e.target as any).value);
                    }
                  }}
                  id={`note-${rev.id}`}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-slate-50/50 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-sans"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById(
                      `note-${rev.id}`
                    ) as HTMLInputElement;
                    if (input) handleSaveTeacherNote(rev.id, input.value);
                  }}
                  className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-heading font-semibold rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors shrink-0"
                >
                  Lưu nhận xét
                </button>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleApproval(rev.id, !!rev.isApproved)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all flex items-center gap-1.5 ${
                      rev.isApproved
                        ? "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                    }`}
                  >
                    {rev.isApproved ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Ẩn bài</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Duyệt hiển thị</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setDeleteId(rev.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Xóa đánh giá"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Xác nhận Xóa Đánh giá"
        message="Bạn có chắc chắn muốn xóa bài cảm nhận của học viên này khỏi hệ thống? Thao tác không thể hoàn tác."
        confirmText="Xóa đánh giá"
        cancelText="Hủy bỏ"
        onConfirm={handleDeleteReview}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
