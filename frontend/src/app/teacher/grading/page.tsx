"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import {
  PenTool,
  Mic,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Send,
  X,
  Volume2,
} from "lucide-react";

export default function TeacherGradingPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [gradeScore, setGradeScore] = useState(42);
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await api.teacher.getGradingQueue();
      if (res.success && Array.isArray(res.data)) {
        setQueue(res.data);
      }
    } catch (err) {
      console.error("Failed to load queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleOpenGrading = async (item: any) => {
    setDetailLoading(true);
    try {
      const res = await api.teacher.getSubmissionDetail(item.id);
      if (res.success && res.data) {
        setSelectedSub(res.data);
        setGradeScore(res.data.total_score || 40);
        setGradeFeedback(
          res.data.teacher_feedback ||
            "Bài làm có cấu trúc mạch lạc, vốn từ vựng phong phú chuẩn Band C. Chú ý cải thiện phát âm âm đuôi."
        );
      }
    } catch {
      alert("Lỗi khi tải chi tiết bài thi");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setSubmitting(true);
    try {
      const res = await api.teacher.gradeSubmission(selectedSub.id, {
        score: Number(gradeScore),
        feedback: gradeFeedback,
        answers: (selectedSub.answers || []).map((a: any) => ({
          question_id: a.question_id,
          score: Math.min(10, Number(gradeScore) / 4),
          feedback: "Đạt chuẩn tiêu chí bài làm",
        })),
      });

      if (res.success) {
        showToast("Đã lưu điểm và nhận xét của Giảng viên thành công!");
        setSelectedSub(null);
        loadQueue();
      } else {
        alert(res.error?.message || "Không thể lưu điểm");
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[200] px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-xs shadow-xl animate-in slide-in-from-top-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-slate-900">
            Hàng Đợi Chấm Bài Thi Tự Luận
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chấm điểm Speaking &amp; Writing theo 4 tiêu chí chuẩn khung tham chiếu CEFR của British Council
          </p>
        </div>

        <button
          onClick={loadQueue}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-2 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Làm mới hàng đợi</span>
        </button>
      </div>

      {/* Queue Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
          <span className="font-bold text-slate-800">
            Tổng cộng: {queue.length} bài thi chờ đánh giá
          </span>
          <span className="text-slate-500">Ưu tiên theo thời gian nộp trước</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-xs">Đang tải danh sách bài nộp...</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="py-20 text-center text-slate-400 p-8 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-heading font-bold text-slate-900 text-sm">Hàng đợi trống!</h3>
            <p className="text-xs text-slate-500">
              Hiện tại tất cả các bài thi Speaking và Writing đã được chấm điểm hoàn tất.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {queue.map((item) => (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {item.user?.full_name || "Học viên"}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[10px]">
                      {item.exam?.skill || "Tự luận"}
                    </span>
                  </div>
                  <div className="text-slate-500">
                    Đề: <strong>{item.exam?.title}</strong> · Email: {item.user?.email}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Nộp lúc: {new Date(item.submitted_at || item.started_at).toLocaleString("vi-VN")}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenGrading(item)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs inline-flex items-center gap-1.5 self-start sm:self-auto transition-colors"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Mở chấm điểm</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grading Drawer/Modal */}
      {selectedSub && (
        <div
          onClick={() => setSelectedSub(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-heading font-bold text-slate-900">
                  Chấm Bài Thi: {selectedSub.exam?.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Thí sinh: <strong>{selectedSub.user?.full_name}</strong> ({selectedSub.user?.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Answer Content Display */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Nội dung bài làm của thí sinh:
              </h4>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 max-h-48 overflow-y-auto text-xs">
                {(selectedSub.answers || []).map((ans: any, idx: number) => (
                  <div key={idx} className="pb-3 border-b border-slate-200/60 last:border-0 last:pb-0">
                    <div className="font-semibold text-slate-800 mb-1">
                      Câu {idx + 1}: {ans.question?.prompt || "Nhiệm vụ"}
                    </div>
                    {ans.text_answer && (
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                        {ans.text_answer}
                      </p>
                    )}
                    {ans.audio_url && (
                      <audio controls src={ans.audio_url} className="w-full mt-2 h-8" />
                    )}
                    {ans.transcript_text && (
                      <div className="mt-1 text-[11px] text-slate-500 italic">
                        Bóc băng giọng nói: "{ans.transcript_text}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Teacher Scoring Form */}
            <form onSubmit={handleSubmitGrade} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Điểm số tổng kết (Thang 0 - 50): *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    required
                    value={gradeScore}
                    onChange={(e) => setGradeScore(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-bold text-blue-700 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Quy đổi CEFR ước tính:
                  </label>
                  <div className="px-3 py-2 text-xs font-bold rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                    {gradeScore >= 43 ? "Band C1 (Xuất sắc)" : gradeScore >= 36 ? "Band B2 (Đạt chuẩn)" : gradeScore >= 28 ? "Band B1" : "Band A2"}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Nhận xét chi tiết &amp; Lời khuyên nâng band của Giảng viên: *
                </label>
                <textarea
                  rows={4}
                  required
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Ghi nhận xét về hoàn thành nhiệm vụ, ngữ pháp, từ vựng và gợi ý cải thiện..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-xs shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Đang lưu..." : "Xác nhận & Gửi kết quả"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
