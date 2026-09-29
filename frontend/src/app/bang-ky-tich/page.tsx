"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { api } from "@/lib/api-client";
import {
  Trophy,
  Award,
  Sparkles,
  Star,
  PenTool,
  Mic,
  Eye,
  CheckCircle2,
  ThumbsUp,
  X,
} from "lucide-react";

interface HallOfFameItem {
  id: string;
  studentName: string;
  avatarText: string;
  skill: "Writing" | "Speaking";
  bandScore: string;
  scaledScore: string;
  topicTitle: string;
  date: string;
  likesCount: number;
  excerpt: string;
  teacherComment: string;
}

export default function BangKyTichPage() {
  const [filterSkill, setFilterSkill] = useState<"all" | "Writing" | "Speaking">("all");
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [honors, setHonors] = useState<HallOfFameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHonor, setSelectedHonor] = useState<HallOfFameItem | null>(null);

  // Review submission state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    examLocation: "BC Hà Nội",
    scoreAchieved: "B2 (165/200)",
    rating: 5,
    comment: "",
  });

  const loadHallOfFame = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.cms.getHallOfFame();
      if (res.success && res.data) {
        const apiItems: HallOfFameItem[] = res.data.map((item: any, idx: number) => ({
          id: item.id || `api-hof-${idx}`,
          studentName: item.studentName || item.student_name || "Học viên",
          avatarText: item.studentName
            ? item.studentName.split(" ").slice(-1)[0].substring(0, 2).toUpperCase()
            : "HV",
          skill: (item.writingSample || item.writing_sample ? "Writing" : "Speaking") as "Writing" | "Speaking",
          bandScore: `CEFR ${item.cefrLevel || item.cefr_level || "C"} (Xuất sắc)`,
          scaledScore: item.overallScore || item.overall_score || "50/50",
          topicTitle: item.topicTitle || item.topic_title || "Bài thi mẫu đạt điểm chuẩn CEFR",
          date: item.examDate || item.exam_date || "2026",
          likesCount: item.likesCount || 0,
          excerpt: item.writingSample || item.writing_sample || item.excerpt || "",
          teacherComment: item.teacherComment || item.teacher_comment || "Vốn từ học thuật phong phú, mạch lạc và tự nhiên.",
        }));
        setHonors(apiItems);
      } else {
        setError(res.error?.message || "Không thể tải danh sách Bảng Kỳ Tích");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi kết nối khi tải Bảng Kỳ Tích từ máy chủ");
      setHonors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHallOfFame();
  }, []);

  const filtered = honors.filter((item) =>
    filterSkill === "all" ? true : item.skill === filterSkill
  );

  const handleLike = (id: string, current: number) => {
    setLikes((prev) => ({
      ...prev,
      [id]: (prev[id] || current) + 1,
    }));
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) return;
    setReviewSubmitting(true);
    try {
      const res = await api.cms.createReview({
        comment: reviewForm.comment.trim(),
        scoreAchieved: reviewForm.scoreAchieved,
        examLocation: reviewForm.examLocation,
        rating: reviewForm.rating,
      });
      if (res.success) {
        setReviewSuccess(true);
      } else {
        alert(res.error?.message || "Vui lòng đăng nhập để gửi bài đánh giá");
      }
    } catch {
      alert("Lỗi khi gửi đánh giá tới máy chủ");
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-primary/10 to-transparent border-b border-border">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full blur-3xl animate-breathing -top-32 -right-24"
            style={{ width: "420px", height: "420px", background: "rgba(245, 158, 11, 0.25)" }}
          />

          <div className="section-container py-12 md:py-16 relative z-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 w-fit text-xs font-bold mb-4">
                <Trophy className="w-4 h-4" />
                <span>Vinh danh bài làm đạt điểm kỷ lục Aptis</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-foreground mb-4">
                Bảng Kỳ Tích Aptis
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Kho bài mẫu Writing &amp; Speaking Band B2 - C điểm đỉnh thực chiến do các học viên đạt chứng chỉ xuất sắc thực hiện, được giám khảo chấm điểm và để lại nhận xét phân tích chuyên môn.
              </p>
            </div>
          </div>
        </section>

        {/* Filter Pills */}
        <div className="section-container py-8">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterSkill("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filterSkill === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card border border-border text-foreground hover:bg-muted"
                }`}
              >
                Tất cả bài mẫu ({honors.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterSkill("Writing")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filterSkill === "Writing"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card border border-border text-foreground hover:bg-muted"
                }`}
              >
                Writing Band B2 - C
              </button>
              <button
                type="button"
                onClick={() => setFilterSkill("Speaking")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filterSkill === "Speaking"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card border border-border text-foreground hover:bg-muted"
                }`}
              >
                Speaking Band B2 - C
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setReviewSuccess(false);
                  setIsReviewModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Chia sẻ đề thi &amp; Nhận 5 lượt AI</span>
              </button>

              <button
                type="button"
                onClick={loadHallOfFame}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-5 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Trophy className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm">Chưa thể tải dữ liệu Bảng Kỳ Tích</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadHallOfFame}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold shrink-0 hover:bg-destructive/90 transition-colors"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm animate-pulse space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted" />
                      <div className="space-y-1.5">
                        <div className="w-24 h-4 bg-muted rounded" />
                        <div className="w-16 h-3 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="w-12 h-6 bg-muted rounded" />
                  </div>
                  <div className="w-3/4 h-4 bg-muted rounded" />
                  <div className="w-full h-16 bg-muted rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filtered.length === 0 && (
            <div className="py-16 text-center rounded-2xl border border-dashed border-border bg-card/50 p-8 max-w-lg mx-auto">
              <Trophy className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-heading font-bold text-base text-foreground mb-1">
                Hiện chưa có bài thi vinh danh
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Chưa có dữ liệu bài thi xuất sắc nào trong cơ sở dữ liệu cho danh mục này.
              </p>
              <button
                type="button"
                onClick={loadHallOfFame}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
              >
                Tải lại trang
              </button>
            </div>
          )}

          {/* Cards Grid */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Student & Band */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {item.avatarText}
                        </div>
                        <div>
                          <div className="font-heading font-bold text-sm text-foreground">
                            {item.studentName}
                          </div>
                          <span className="text-[11px] text-muted-foreground">{item.date}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-primary block">
                          {item.scaledScore}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{item.bandScore}</span>
                      </div>
                    </div>

                    {/* Topic Title */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-accent mb-2">
                      {item.skill === "Writing" ? <PenTool className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      <span>{item.skill} · {item.topicTitle}</span>
                    </div>

                    {/* Excerpt */}
                    {item.excerpt && (
                      <p className="text-xs text-foreground/80 bg-muted/40 p-3.5 rounded-xl border border-border/60 leading-relaxed italic mb-4">
                        &ldquo;{item.excerpt}&rdquo;
                      </p>
                    )}

                    {/* Teacher analysis */}
                    {item.teacherComment && (
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs mb-4">
                        <span className="font-bold text-primary block mb-0.5">
                          Giảng viên nhận xét:
                        </span>
                        <span className="text-muted-foreground leading-relaxed">
                          {item.teacherComment}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleLike(item.id, item.likesCount)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{likes[item.id] || item.likesCount} Thích</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedHonor(item)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Đọc toàn văn</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Full Sample Modal */}
          {selectedHonor && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-bold text-sm">
                      {selectedHonor.avatarText}
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base text-foreground">
                        {selectedHonor.studentName} · {selectedHonor.bandScore}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Kỹ năng {selectedHonor.skill} · Điểm thi: {selectedHonor.scaledScore}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedHonor(null)}
                    className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 py-4 space-y-4 pr-1">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                      Chủ đề bài thi
                    </h4>
                    <p className="font-semibold text-sm text-foreground">
                      {selectedHonor.topicTitle}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Toàn văn bài làm mẫu
                    </h4>
                    <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs md:text-sm text-foreground leading-relaxed whitespace-pre-line font-mono">
                      {selectedHonor.excerpt || "Đang cập nhật nội dung bài làm..."}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1.5">
                      Nhận xét &amp; Đánh giá từ Ban Giám khảo
                    </h4>
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-foreground leading-relaxed">
                      ✓ {selectedHonor.teacherComment}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedHonor(null)}
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary-glow transition-all"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Review Submission Modal */}
          {isReviewModalOpen && (
            <div
              onClick={() => setIsReviewModalOpen(false)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="max-w-lg w-full rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
              >
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-heading font-bold text-foreground">
                        Chia Sẻ Trải Nghiệm Thi Thật
                      </h3>
                      <p className="text-xs text-muted-foreground">Nhận ngay +5 lượt AI chấm thi khi bài viết được duyệt</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsReviewModalOpen(false)}
                    className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {reviewSuccess ? (
                  <div className="p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h4 className="font-bold text-base text-foreground">Gửi bài chia sẻ thành công!</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Cảm ơn bạn đã đóng góp đề thi thật cho cộng đồng. Ban quản trị sẽ kiểm duyệt và tự động cộng 5 lượt AI vào tài khoản của bạn trong 24h!
                    </p>
                    <button
                      onClick={() => setIsReviewModalOpen(false)}
                      className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm"
                    >
                      Đóng
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">
                          Hội đồng thi thật:
                        </label>
                        <select
                          value={reviewForm.examLocation}
                          onChange={(e) => setReviewForm({ ...reviewForm, examLocation: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground"
                        >
                          <option value="BC Hà Nội (Giảng Võ)">BC Hà Nội (Giảng Võ)</option>
                          <option value="BC Hà Nội (Bà Triệu)">BC Hà Nội (Bà Triệu)</option>
                          <option value="BC TP.HCM (Quận 1)">BC TP.HCM (Quận 1)</option>
                          <option value="BC TP.HCM (Quận 10)">BC TP.HCM (Quận 10)</option>
                          <option value="Hội đồng Đà Nẵng">Hội đồng Đà Nẵng</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">
                          Điểm / Band đạt được:
                        </label>
                        <input
                          type="text"
                          required
                          value={reviewForm.scoreAchieved}
                          onChange={(e) => setReviewForm({ ...reviewForm, scoreAchieved: e.target.value })}
                          placeholder="VD: B2 (168/200)"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">
                        Đánh giá độ trúng tủ của đề:
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            className="p-1"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= reviewForm.rating
                                  ? "text-amber-500 fill-amber-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs text-muted-foreground ml-2">({reviewForm.rating}/5 sao)</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">
                        Chi tiết đề thi &amp; Lời khuyên cho các bạn thi sau: *
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        placeholder="Hãy chia sẻ chi tiết chủ đề Speaking Part 4, đề bài Writing Part 4, hoặc tai nghe phòng thi..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setIsReviewModalOpen(false)}
                        className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                      >
                        {reviewSubmitting ? <span>Đang gửi...</span> : <span>Gửi bài &amp; Nhận thưởng</span>}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}
