"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { api } from "@/lib/api-client";
import {
  Trophy,
  Award,
  Sparkles,
  Lock,
  Crown,
  Search,
  PenTool,
  Mic,
  Eye,
  CheckCircle2,
  ThumbsUp,
  X,
  ExternalLink,
} from "lucide-react";

export interface HallOfFameSubmissionItem {
  id: string;
  studentName: string;
  skill: "Writing" | "Speaking";
  partNumber: number;
  band: "B1" | "B2" | "C";
  score: string;
  topicTitle: string;
  examCode: string;
  date: string;
  likesCount: number;
  excerpt: string;
  fullContent?: string;
  teacherComment?: string;
}

const DEFAULT_HOF_ITEMS: HallOfFameSubmissionItem[] = [
  {
    id: "hof-sp-4-1",
    studentName: "Học viên ẩn danh",
    skill: "Speaking",
    partNumber: 4,
    band: "B2",
    score: "27/30",
    topicTitle: "Đề 01 - Receiving a gift",
    examCode: "Đề 01 - Receiving a gift",
    date: "10/10/2026",
    likesCount: 54,
    excerpt:
      "Well, to kick off with the first question about is the last present I received. It was an elegant mechanical wristwatch given to me by my parents on my most recent birthday. Not only was it aesthetically pleasing, but it also held immense sentimental value...",
    teacherComment: "Cấu trúc ngữ pháp câu phức tốt, sử dụng chuẩn xác từ vựng band B2 (aesthetically pleasing, immense sentimental value).",
  },
  {
    id: "hof-sp-4-2",
    studentName: "Học viên ẩn danh",
    skill: "Speaking",
    partNumber: 4,
    band: "B1",
    score: "22/30",
    topicTitle: "Đề 01 - Receiving a gift",
    examCode: "Đề 01 - Receiving a gift",
    date: "10/10/2026",
    likesCount: 38,
    excerpt:
      "Well, receiving a gift is a very special moment for me. Uh, I think it's not about the value of the gift, but it's about the thought and the effort that the person put into it. For example, my best friend made me a small handcrafted card on my birthday...",
    teacherComment: "Phát âm rõ ràng, tốc độ đều đặn, trả lời đúng trọng tâm câu hỏi.",
  },
  {
    id: "hof-sp-4-3",
    studentName: "Học viên ẩn danh",
    skill: "Speaking",
    partNumber: 4,
    band: "B1",
    score: "22/30",
    topicTitle: "Đề 01 - Receiving a gift",
    examCode: "Đề 01 - Receiving a gift",
    date: "09/10/2026",
    likesCount: 29,
    excerpt:
      "The last gift I received was a handmade photo album from my best friend on my birthday. We've been friends since high school, so we share countless memories. Flipping through each page brought back so much laughter and joy...",
    teacherComment: "Ý tưởng tự nhiên, kết nối câu mạch lạc.",
  },
  {
    id: "hof-sp-4-4",
    studentName: "Học viên ẩn danh",
    skill: "Speaking",
    partNumber: 4,
    band: "B1",
    score: "23/30",
    topicTitle: "Đề 01 - Receiving a gift",
    examCode: "Đề 01 - Receiving a gift",
    date: "08/10/2026",
    likesCount: 41,
    excerpt:
      "First question, the last gift I received was a watch from my family on my birthday. It was about two months ago. We had a small party at home and after dinner my father gave me a nicely wrapped box...",
    teacherComment: "Bố cục trả lời theo 3 ý rõ ràng, kiểm soát tốt thì quá khứ đơn.",
  },
  {
    id: "hof-sp-4-5",
    studentName: "Học viên ẩn danh",
    skill: "Speaking",
    partNumber: 4,
    band: "B1",
    score: "21/30",
    topicTitle: "Đề 01 - Receiving a gift",
    examCode: "Đề 01 - Receiving a gift",
    date: "08/10/2026",
    likesCount: 19,
    excerpt:
      "First of all, I would like to tell you about the last gift I received. So, uh last year when I turned 18, I passed the national entrance test to attend my dream university, and my parents surprised me with a wristwatch...",
    teacherComment: "Giọng điệu chân thật, trả lời tự nhiên.",
  },
  {
    id: "hof-sp-4-6",
    studentName: "Học viên ẩn danh",
    skill: "Speaking",
    partNumber: 4,
    band: "B1",
    score: "22/30",
    topicTitle: "Đề 01 - Receiving a gift",
    examCode: "Đề 01 - Receiving a gift",
    date: "07/10/2026",
    likesCount: 26,
    excerpt:
      "I would like to tell you about the last gift I received was a brand new laptop which my parents gave to me to celebrate my admission to university. It was extremely helpful for my studies...",
    teacherComment: "Độ dài câu trả lời bám sát thời lượng chuẩn British Council.",
  },
  {
    id: "hof-wr-4-1",
    studentName: "Học viên ẩn danh",
    skill: "Writing",
    partNumber: 4,
    band: "C",
    score: "48/50",
    topicTitle: "Đề 02 - Municipal Environmental Policy",
    examCode: "Đề 02 - Municipal Environmental Policy",
    date: "05/10/2026",
    likesCount: 89,
    excerpt:
      "Dear Committee Members, I am writing to express my earnest perspective regarding the proposed municipal initiatives on urban reforestation and eco-friendly transportation networks. While the capital investment may appear substantial initially...",
    teacherComment: "Văn phong trang trọng chuẩn formal email, đảo ngữ và liên từ học thuật cực kỳ xuất sắc.",
  },
  {
    id: "hof-wr-3-1",
    studentName: "Học viên ẩn danh",
    skill: "Writing",
    partNumber: 3,
    band: "B2",
    score: "44/50",
    topicTitle: "Đề 03 - Social Club Community Forum",
    examCode: "Đề 03 - Social Club Community Forum",
    date: "04/10/2026",
    likesCount: 62,
    excerpt:
      "From my perspective, organizing weekend volunteer programs not only fosters camaraderie among club members but also delivers tangible social benefits to our local neighborhood...",
    teacherComment: "Lập luận thuyết phục, từ vựng phong phú (fosters camaraderie, tangible social benefits).",
  },
];

export default function BangKyTichPage() {
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [partFilter, setPartFilter] = useState<string>("all");
  const [bandFilter, setBandFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [appliedSearch, setAppliedSearch] = useState<string>("");

  const [honors, setHonors] = useState<HallOfFameSubmissionItem[]>(DEFAULT_HOF_ITEMS);
  const [loading, setLoading] = useState(false);
  const [selectedHonor, setSelectedHonor] = useState<HallOfFameSubmissionItem | null>(null);

  // User Pro state & Modal
  const [isProUser, setIsProUser] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  // Review & Contribution Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    examLocation: "BC Hà Nội",
    scoreAchieved: "B2 (165/200)",
    rating: 5,
    comment: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        if (u?.role === "ADMIN" || u?.isVip || u?.isPro) {
          setIsProUser(true);
        }
      } catch {}
    }
  }, []);

  // Tải danh sách bài mẫu từ API (nếu có bổ sung từ backend)
  const loadHallOfFame = async () => {
    try {
      setLoading(true);
      const res = await api.cms.getHallOfFame();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const apiItems: HallOfFameSubmissionItem[] = res.data.map((item: any, idx: number) => ({
          id: item.id || `api-hof-${idx}`,
          studentName: item.studentName || item.student_name || "Học viên ẩn danh",
          skill: item.writingSample || item.writing_sample ? "Writing" : "Speaking",
          partNumber: 4,
          band: (item.cefrLevel || item.cefr_level || "B2") as "B1" | "B2" | "C",
          score: item.overallScore || item.overall_score || "25/30",
          topicTitle: item.topicTitle || item.topic_title || "Đề thi mẫu chuẩn CEFR",
          examCode: item.topicTitle || "Đề thi Aptis",
          date: item.examDate || item.exam_date || "2026",
          likesCount: item.likesCount || 10,
          excerpt: item.writingSample || item.writing_sample || item.excerpt || "",
          teacherComment: item.teacherComment || item.teacher_comment,
        }));
        // Kết hợp dữ liệu mặc định và dữ liệu backend
        const combined = [...DEFAULT_HOF_ITEMS];
        apiItems.forEach((it) => {
          if (!combined.some((c) => c.id === it.id)) combined.push(it);
        });
        setHonors(combined);
      }
    } catch (err) {
      console.warn("Dùng dữ liệu cục bộ cho Bảng Kỳ Tích:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHallOfFame();
  }, []);

  // Lọc dữ liệu theo 4 tiêu chí chuẩn Screenshot 3
  const filteredHonors = useMemo(() => {
    return honors.filter((item) => {
      // 1. Kỹ năng
      if (skillFilter !== "all" && item.skill !== skillFilter) return false;
      // 2. Part
      if (partFilter !== "all" && String(item.partNumber) !== partFilter) return false;
      // 3. Band
      if (bandFilter !== "all" && item.band !== bandFilter) return false;
      // 4. Tìm kiếm đề
      if (appliedSearch.trim()) {
        const q = appliedSearch.toLowerCase().trim();
        const matchTitle = item.topicTitle.toLowerCase().includes(q);
        const matchCode = item.examCode.toLowerCase().includes(q);
        const matchExcerpt = item.excerpt.toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchExcerpt) return false;
      }
      return true;
    });
  }, [honors, skillFilter, partFilter, bandFilter, appliedSearch]);

  const handleCardClick = (item: HallOfFameSubmissionItem) => {
    if (!isProUser) {
      setIsProModalOpen(true);
    } else {
      setSelectedHonor(item);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchQuery);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-[var(--navbar-total-height,64px)] pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
          {/* Header Bảng Kỳ Tích chuẩn Screenshot 3 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-red-600 dark:text-red-500" />
              <h1 className="text-2xl md:text-3xl font-heading font-black text-foreground">
                Bảng Kỳ Tích
              </h1>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground max-w-3xl leading-relaxed">
              Những bài Writing và Speaking đạt điểm đỉnh của học viên, chia sẻ lại để bạn đọc tham khảo cách viết, cách nói và từ vựng đáng học.
            </p>
          </div>

          {/* Thanh công cụ 4 bộ lọc chuẩn Screenshot 3 */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-wrap items-center gap-3 p-2 rounded-2xl bg-card border border-border shadow-xs"
          >
            {/* 1. Kỹ năng */}
            <div className="min-w-[150px] flex-1 sm:flex-initial">
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="all">Tất cả kỹ năng</option>
                <option value="Speaking">Speaking</option>
                <option value="Writing">Writing</option>
              </select>
            </div>

            {/* 2. Part */}
            <div className="min-w-[130px] flex-1 sm:flex-initial">
              <select
                value={partFilter}
                onChange={(e) => setPartFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="all">Tất cả part</option>
                <option value="1">Part 1</option>
                <option value="2">Part 2</option>
                <option value="3">Part 3</option>
                <option value="4">Part 4</option>
              </select>
            </div>

            {/* 3. Band */}
            <div className="min-w-[130px] flex-1 sm:flex-initial">
              <select
                value={bandFilter}
                onChange={(e) => setBandFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="all">Tất cả band</option>
                <option value="B1">Band B1</option>
                <option value="B2">Band B2</option>
                <option value="C">Band C</option>
              </select>
            </div>

            {/* 4. Tên đề / Tìm kiếm */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Đề 01 - Receiving a gift..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Nút tìm kiếm đỏ chuẩn Screenshot 3 */}
            <button
              type="submit"
              className="w-10 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shrink-0 transition-colors shadow-xs"
              title="Tìm kiếm bài mẫu"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Dòng đếm bài được trưng bày (Screenshot 3) */}
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pt-1">
            <span>{filteredHonors.length} bài được trưng bày</span>
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chia sẻ bài thi của bạn</span>
            </button>
          </div>

          {/* Lưới thẻ bài thi chuẩn Screenshot 3 */}
          {filteredHonors.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-border bg-card/40 p-8">
              <Trophy className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-heading font-bold text-sm text-foreground mb-1">
                Không tìm thấy bài thi phù hợp
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để khám phá các bài mẫu khác.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSkillFilter("all");
                  setPartFilter("all");
                  setBandFilter("all");
                  setSearchQuery("");
                  setAppliedSearch("");
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHonors.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className="rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between space-y-4 group shadow-2xs hover:shadow-sm"
                >
                  <div className="space-y-3">
                    {/* Header thẻ: Badge Band (Đỏ) + Skill Part + Lock icon (Screenshot 3) */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white ${
                            item.band === "C"
                              ? "bg-amber-600"
                              : item.band === "B2"
                              ? "bg-red-600"
                              : "bg-red-500"
                          }`}
                        >
                          {item.band}
                        </span>
                        <span className="text-xs font-semibold text-foreground/90">
                          {item.skill} Part {item.partNumber}
                        </span>
                      </div>

                      <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Excerpt bài làm */}
                    <p className="text-xs text-foreground/85 leading-relaxed line-clamp-4 font-sans">
                      {item.excerpt}
                    </p>
                  </div>

                  {/* Chân trang thẻ: Học viên ẩn danh · Đề ... (Screenshot 3) */}
                  <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground font-medium truncate">
                    {item.studentName} · {item.examCode}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <FloatingActions />

      {/* MODAL TÍNH NĂNG DÀNH CHO PRO (Screenshot 2) */}
      {isProModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setIsProModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
              <Crown className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-heading font-bold text-base text-foreground">
                Tính năng dành cho Pro
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bảng Kỳ Tích dành cho thành viên Pro. Nâng cấp để mở khóa.
              </p>
            </div>

            <Link
              href="/pricing"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <Crown className="w-4 h-4" />
              <span>Nâng cấp Pro</span>
            </Link>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT DÀNH CHO USER PRO */}
      {selectedHonor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-red-600 text-white font-bold text-xs">
                  {selectedHonor.band}
                </span>
                <div>
                  <h3 className="font-heading font-bold text-base text-foreground">
                    {selectedHonor.skill} Part {selectedHonor.partNumber} · {selectedHonor.score}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedHonor.topicTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHonor(null)}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-4 pr-1">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                  Bài làm của học viên
                </h4>
                <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs md:text-sm text-foreground leading-relaxed font-sans">
                  {selectedHonor.fullContent || selectedHonor.excerpt}
                </div>
              </div>

              {selectedHonor.teacherComment && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-200">
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Giảng viên chấm điểm &amp; Phân tích:</span>
                  </div>
                  <p className="leading-relaxed">{selectedHonor.teacherComment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL GỬI BÀI CHIA SẺ REVIEW */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-heading font-bold text-base text-foreground mb-1">
              Chia sẻ đề thi &amp; Kinh nghiệm
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Góp phần xây dựng ngân hàng bài thi Aptis thực chiến và nhận thêm lượt chấm AI.
            </p>

            <form
              onSubmit={async (e) => {
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
                    setTimeout(() => {
                      setIsReviewModalOpen(false);
                      setReviewSuccess(false);
                    }, 2000);
                  } else {
                    alert(res.error?.message || "Vui lòng đăng nhập để gửi bài");
                  }
                } catch {
                  alert("Lỗi khi gửi dữ liệu");
                } finally {
                  setReviewSubmitting(false);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Điểm số đạt được
                </label>
                <input
                  type="text"
                  value={reviewForm.scoreAchieved}
                  onChange={(e) => setReviewForm({ ...reviewForm, scoreAchieved: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Kinh nghiệm hoặc bài nói / viết bạn muốn chia sẻ
                </label>
                <textarea
                  rows={4}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Ghi lại đề thi bạn đã gặp và kinh nghiệm xử lý..."
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground"
                />
              </div>

              {reviewSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold text-center">
                  Cảm ơn bạn! Bài viết đang được kiểm duyệt để trưng bày.
                </div>
              )}

              <button
                type="submit"
                disabled={reviewSubmitting || reviewSuccess}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 transition-all"
              >
                {reviewSubmitting ? "Đang gửi..." : "Gửi chia sẻ"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
