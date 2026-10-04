"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import {
  BookOpen,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  AlertCircle,
  Trophy,
  PlusCircle,
  Zap,
} from "lucide-react";

interface ReadingExam {
  id: string;
  title: string;
  parts: string;
  totalParts: number;
  partTitle?: string | null;
  questionsCount: number;
  duration: string;
  isFree: boolean;
  status: "not_started" | "in_progress" | "completed";
  bestScore?: string | null;
  bestScoreNumber?: number | null;
  userAttempts: number;
  priority?: "HIGH" | "MEDIUM" | "LOW";
}

export default function ReadingPracticePage() {
  const { user } = useAuth();
  const isProOrAdmin =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "TEACHER" ||
    Boolean(user?.subscription) ||
    Boolean(user?.user_subscriptions?.length);
  const [activeTab, setActiveTab] = useState<"full" | "p1" | "p2" | "p3" | "p4">("full");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium" | "low">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "not_started" | "completed">("all");
  const [filterSource, setFilterSource] = useState<"all" | "web" | "my">("all");

  const [exams, setExams] = useState<ReadingExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getAll({ skill: "READING", limit: 200 });
      if (res.success && Array.isArray(res.data)) {
        setExams(
          res.data.map((exam: any, idx: number) => {
            let status: "not_started" | "in_progress" | "completed" = "not_started";
            if (exam.userStatus === "COMPLETED") status = "completed";
            else if (exam.userStatus === "IN_PROGRESS") status = "in_progress";

            const isFullReading = exam.totalParts === 4 || exam.title.includes("Full Reading");

            return {
              id: exam.id,
              title: exam.title,
              parts: isFullReading ? `Full Reading · 4 Parts` : (exam.partTitle || `Reading Part`),
              totalParts: exam.totalParts || 1,
              partTitle: exam.partTitle,
              questionsCount: exam.totalQuestions || 20,
              duration: `${exam.durationMinutes || 35} phút`,
              isFree: !exam.isPro,
              status,
              bestScore: exam.bestScore,
              bestScoreNumber: exam.bestScoreNumber,
              userAttempts: exam.userAttempts,
              priority: idx % 3 === 0 ? "HIGH" : idx % 3 === 1 ? "MEDIUM" : "LOW",
            };
          })
        );
      } else {
        setError(res.error?.message || "Không thể tải danh sách đề thi từ máy chủ (Vui lòng kiểm tra CSDL).");
        setExams([]);
      }
    } catch (err: any) {
      console.error("Failed to load reading exams:", err);
      setError("Không thể kết nối đến máy chủ hoặc cơ sở dữ liệu chưa sẵn sàng.");
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  // 1. Danh sách đề thi thuộc Tab hiện tại (Tab Full Part, Part 1, Part 2+3, Part 4, Part 5)
  const currentTabExams = exams.filter((e) => {
    if (activeTab === "full") {
      return e.title.includes("Full Reading") || e.totalParts === 4;
    } else if (activeTab === "p1") {
      // Part 1: Sentence comprehension
      if (e.totalParts === 4 || e.title.includes("Full Reading")) return false;
      return e.title.includes("Reading Part 1") || e.partTitle?.includes("Part 1");
    } else if (activeTab === "p2") {
      // Part 2: Text cohesion (sắp xếp câu)
      if (e.totalParts === 4 || e.title.includes("Full Reading")) return false;
      return e.partTitle?.includes("Part 2") || e.partTitle?.includes("Text Cohesion");
    } else if (activeTab === "p3") {
      // Part 4: Opinion matching (nối ý kiến)
      if (e.totalParts === 4 || e.title.includes("Full Reading")) return false;
      return e.partTitle?.includes("Part 3") || e.partTitle?.includes("Gap Fill") || e.partTitle?.includes("Opinion");
    } else if (activeTab === "p4") {
      // Part 5: Long reading (đọc bài dài & nối heading)
      if (e.totalParts === 4 || e.title.includes("Full Reading")) return false;
      return e.partTitle?.includes("Part 4") || e.partTitle?.includes("Long Text") || e.partTitle?.includes("Long Reading");
    }
    return true;
  });

  // 2. Lọc tiếp theo search, status, priority từ currentTabExams
  const filteredExams = currentTabExams.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" ? true : e.status === filterStatus;
    const matchesPriority =
      filterPriority === "all"
        ? true
        : filterPriority === "high"
        ? e.priority === "HIGH"
        : filterPriority === "medium"
        ? e.priority === "MEDIUM"
        : e.priority === "LOW";
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Dynamic naming based on activeTab
  const getTabInfo = () => {
    switch (activeTab) {
      case "full":
        return {
          title: "Luyện tập full part kỹ năng Reading",
          desc: "32 bộ đề tổng hợp liên hoàn cả 4 Part của kỹ năng Reading trong 35 phút chuẩn British Council.",
          badge: "Full Part",
          partQuery: "",
          marathonText: "Tạo bộ đề của bạn",
          marathonDesc: "Tự ghép các đề lẻ thành bộ full test hoặc full part của riêng bạn. Dành cho tài khoản Pro.",
          marathonBtn: "Nâng cấp để tạo →",
          marathonType: "custom",
        };
      case "p1":
        return {
          title: "Part 1 – Sentence comprehension",
          desc: "32 bộ đề luyện tập hoàn thành câu & chọn từ điền vào chỗ trống ngắn.",
          badge: "Part 1",
          partQuery: "?part=1",
          marathonText: "Luyện tất cả đề Part 1",
          marathonDesc: "Làm liên tục 32 đề — không giới hạn giờ",
          marathonBtn: "Mở khóa",
          marathonType: "marathon",
        };
      case "p2":
        return {
          title: "Part 2 + 3 – Text cohesion",
          desc: "32 bộ đề luyện tập sắp xếp trật tự câu văn thành một đoạn văn hoàn chỉnh.",
          subDesc: "Nhãn ưu tiên là các đề hay thi vào gần đây — Ưu tiên cao là đề nên luyện trước.",
          badge: "Part 2 + 3",
          partQuery: "?part=2",
          marathonText: "Luyện tất cả đề Part 2 + 3",
          marathonDesc: "Làm liên tục 32 đề — không giới hạn giờ",
          marathonBtn: "Mở khóa",
          marathonType: "marathon",
        };
      case "p3":
        return {
          title: "Part 4 – Opinion matching",
          desc: "32 bộ đề luyện tập nối ý kiến của 4 nhân vật với các câu nhận định.",
          subDesc: "Nhãn ưu tiên là các đề hay thi vào gần đây — Ưu tiên cao là đề nên luyện trước.",
          badge: "Part 4",
          partQuery: "?part=4",
          marathonText: "Luyện tất cả đề Part 4",
          marathonDesc: "Làm liên tục 32 đề — không giới hạn giờ",
          marathonBtn: "Mở khóa",
          marathonType: "marathon",
        };
      case "p4":
        return {
          title: "Part 5 – Long reading",
          desc: "32 bộ đề luyện tập đọc hiểu bài văn dài và chọn tiêu đề Heading cho 7 đoạn văn.",
          badge: "Part 5",
          partQuery: "?part=5",
          marathonText: "Luyện tất cả đề Part 5",
          marathonDesc: "Làm liên tục 32 đề — không giới hạn giờ",
          marathonBtn: "Mở khóa",
          marathonType: "marathon",
        };
    }
  };

  const tabInfo = getTabInfo();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16">
        <section className="section-container py-6 md:py-8">
          {/* Search Box */}
          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex w-full rounded-xl border border-input px-3 py-2 text-sm pl-10 h-11 bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
              placeholder="Tìm kiếm bộ đề Reading..."
            />
          </div>

          {/* Top 5 Part Tabs matching aptiskytich.vn */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
            {[
              { id: "full", label: "Full Part – Tất cả các Part" },
              { id: "p1", label: "Part 1 – Sentence comprehension" },
              { id: "p2", label: "Part 2 + 3 – Text cohesion" },
              { id: "p3", label: "Part 4 – Opinion matching" },
              { id: "p4", label: "Part 5 – Long reading" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Header Description */}
          <div className="mb-6 space-y-1">
            <h1 className="text-xl md:text-2xl font-heading font-extrabold text-foreground">
              {tabInfo.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {tabInfo.desc}
            </p>
            {tabInfo.subDesc && (
              <p className="text-xs text-muted-foreground/80 italic pt-1">
                {tabInfo.subDesc}
              </p>
            )}
          </div>

          {/* Sub Filters - Rows */}
          <div className="space-y-2.5 mb-8 text-xs">
            {/* Row 1: Lọc ưu tiên (for Full Part, Part 2+3, Part 4) */}
            {(activeTab === "full" || activeTab === "p2" || activeTab === "p3") && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground font-semibold w-24">Lọc ưu tiên:</span>
                {[
                  { id: "all", label: `Tất cả (${currentTabExams.length})` },
                  { id: "high", label: `Ưu tiên cao (${currentTabExams.filter((e) => e.priority === "HIGH").length})` },
                  { id: "medium", label: `Ưu tiên vừa (${currentTabExams.filter((e) => e.priority === "MEDIUM").length})` },
                  ...(activeTab === "p2" || activeTab === "p3"
                    ? [{ id: "low", label: `Ưu tiên thấp (${currentTabExams.filter((e) => e.priority === "LOW").length})` }]
                    : []),
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilterPriority(item.id as any)}
                    className={`px-3 py-1 rounded-full font-bold transition-all ${
                      filterPriority === item.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {/* Row 2: Trạng thái */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-semibold w-24">Trạng thái:</span>
              {[
                { id: "all", label: `Tất cả (${currentTabExams.length})` },
                { id: "not_started", label: `Chưa làm (${currentTabExams.filter((e) => e.status !== "completed").length})` },
                { id: "completed", label: `Đã làm (${currentTabExams.filter((e) => e.status === "completed").length})` },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilterStatus(item.id as any)}
                  className={`px-3 py-1 rounded-full font-bold transition-all ${
                    filterStatus === item.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Row 3: Nguồn (chỉ ở Full Part) */}
            {activeTab === "full" && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground font-semibold w-24">Nguồn:</span>
                {[
                  { id: "all", label: `Tất cả (${currentTabExams.length})` },
                  { id: "web", label: `Đề web (${currentTabExams.length})` },
                  { id: "my", label: `Bộ đề của tôi (0)` },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilterSource(item.id as any)}
                    className={`px-3 py-1 rounded-full font-bold transition-all ${
                      filterSource === item.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="py-20 text-center text-muted-foreground space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Đang tải danh sách đề thi...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-sm">Chưa thể tải dữ liệu</p>
                <p className="text-xs opacity-90">{error}</p>
              </div>
              <button
                type="button"
                onClick={loadExams}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* CARD 1: Special Action Card (PRO Custom / Marathon) */}
              <div className="relative rounded-2xl border-2 border-primary/60 bg-card p-6 flex flex-col justify-between shadow-md hover:shadow-lg transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    {tabInfo.marathonType === "custom" ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] uppercase">
                        PRO
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px]">
                          ∞ Marathon
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                          PRO
                        </span>
                      </div>
                    )}
                    {tabInfo.marathonType === "marathon" && (
                      <span className="text-[11px] font-semibold text-muted-foreground">Chưa làm</span>
                    )}
                  </div>

                  <h3 className="text-lg font-heading font-extrabold text-foreground mb-2">
                    {tabInfo.marathonText}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tabInfo.marathonDesc}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => alert("Tính năng dành riêng cho gói Pro. Bạn có thể làm ngay các đề Free miễn phí bên cạnh!")}
                    className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-sm transition-colors text-center"
                  >
                    {tabInfo.marathonBtn}
                  </button>
                </div>
              </div>

              {/* CARD 2..N: Practice Exam Cards */}
              {filteredExams.map((exam, idx) => {
                const targetUrl = `/reading/${exam.id}${tabInfo.partQuery}`;
                const displayTitle =
                  activeTab === "full"
                    ? exam.title
                    : activeTab === "p1"
                    ? `Đề 0${idx + 1} - Reading Part 1`
                    : activeTab === "p2"
                    ? idx === 0
                      ? "Đề 01 - Tom Harper"
                      : idx === 1
                      ? "Đề 02 - Delivery man"
                      : `Đề 0${idx + 1} - Mountain Trip`
                    : activeTab === "p3"
                    ? idx === 0
                      ? "Đề 01 - Opinions on flying"
                      : idx === 1
                      ? "Đề 02 - A new restaurant"
                      : `Đề 0${idx + 1} - Lifestyle opinions`
                    : `Đề 0${idx + 1} - Children and Exercises`;

                return (
                  <div
                    key={exam.id}
                    className="relative rounded-2xl border border-border bg-card hover:border-primary/50 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
                  >
                    <div>
                      {/* Top Badges & Score / Status */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground font-bold text-[10px]">
                            {tabInfo.badge}
                          </span>
                          {exam.isFree ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                              FREE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                              PRO
                            </span>
                          )}
                          {exam.priority === "HIGH" && (
                            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[10px]">
                              Ưu tiên cao
                            </span>
                          )}
                        </div>

                        {/* Top Right Trophy / Status */}
                        <div>
                          {exam.bestScore ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black text-xs">
                              🏆 {exam.bestScore}
                            </span>
                          ) : exam.status === "completed" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đã làm
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-muted-foreground">
                              Chưa bắt đầu
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-heading font-extrabold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                        {displayTitle}
                      </h3>

                      {/* Subtitle */}
                      <p className="text-xs text-muted-foreground">
                        {activeTab === "full" ? "Full Reading · 4 Parts" : "📖 Đề luyện tập"}
                      </p>
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-6 mt-4 border-t border-border/40 flex items-center justify-end">
                      {exam.isFree || isProOrAdmin ? (
                        <Link
                          href={targetUrl}
                          className="inline-flex items-center gap-1.5 text-primary hover:text-brand-brown font-extrabold text-xs transition-colors"
                        >
                          <span>Luyện tập</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => alert("Đề này thuộc gói Pro. Bạn có thể luyện tập đề Free hoàn toàn miễn phí!")}
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground font-bold text-xs transition-colors"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Mở khóa</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}
