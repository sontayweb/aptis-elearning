"use client";

import { useState, useEffect } from "react";
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
          ? "Đã duyệt hiển thị bài đánh giá lên Bảng Kỳ Tích!"
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
      showToast("Đã lưu nhận xét của giáo viên thành công!");
    } catch {
      showToast("Lỗi khi lưu nhận xét trên máy chủ.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-heading font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Kiểm duyệt Đánh giá Học viên
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Phê duyệt cảm nhận học viên thi đạt chứng chỉ và thêm nhận xét động viên của thầy cô
          </p>
        </div>

        <button
          onClick={fetchReviews}
          className="self-start sm:self-auto px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-heading font-semibold rounded-xl border border-slate-200 shadow-2xs transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-900" : ""}`} />
          <span>Làm mới đánh giá</span>
        </button>
      </div>

      {/* Feed Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 rounded-2xl border border-slate-200/80 bg-white">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-600" />
            Đang tải danh sách bài đánh giá...
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-slate-400 rounded-2xl border border-slate-200/80 bg-white font-normal">
            Không có bài đánh giá nào chờ duyệt.
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className={`p-5 rounded-2xl border bg-white transition-all ${
                rev.isApproved
                  ? "border-slate-200/80 shadow-xs"
                  : "border-amber-200 bg-amber-50/20 shadow-xs"
              }`}
            >
              {/* Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
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
                    <div className="font-heading font-bold text-slate-900 text-sm flex items-center gap-2">
                      {rev.studentName}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold bg-amber-50 border border-amber-200 text-amber-700">
                        <Trophy className="w-3 h-3 text-amber-600" /> {rev.score}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
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
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Đang hiển thị trên Trang chủ
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold bg-amber-50 border border-amber-200 text-amber-700">
                      Đang ẩn (Chờ phê duyệt)
                    </span>
                  )}
                </div>
              </div>

              {/* Review Body */}
              <div className="py-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                &ldquo;{rev.comment}&rdquo;
              </div>

              {/* Teacher Comment Box */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  type="text"
                  defaultValue={rev.teacherNote || ""}
                  placeholder="Gõ nhận xét / lời khen của thầy cô..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveTeacherNote(rev.id, (e.target as any).value);
                    }
                  }}
                  id={`note-${rev.id}`}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 bg-slate-50/50 text-slate-900 placeholder:text-slate-400"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById(
                      `note-${rev.id}`
                    ) as HTMLInputElement;
                    if (input) handleSaveTeacherNote(rev.id, input.value);
                  }}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-heading font-semibold rounded-xl border border-slate-200 shadow-2xs transition-colors shrink-0"
                >
                  Lưu nhận xét
                </button>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleApproval(rev.id, !!rev.isApproved)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all flex items-center gap-1.5 ${
                      rev.isApproved
                        ? "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs"
                        : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
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
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
