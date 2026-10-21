"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { UniversalSkillGuideModal } from "@/components/skill-format-guide-modal";
import { ReadingGuideBanner } from "@/components/reading-guide-banner";
import {
  READING_PART2_TOPICS,
  READING_PART3_TOPICS,
  READING_PART4_TOPICS,
} from "@/data/reading-topics-bank";
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
  Flame,
  Star,
} from "lucide-react";

interface ReadingExam {
  id: string;
  title: string;
  parts: string;
  totalParts: number;
  completedParts?: number;
  partTitle?: string | null;
  questionsCount: number;
  duration: string;
  isFree: boolean;
  status: "not_started" | "in_progress" | "completed";
  bestScore?: string | null;
  bestScoreNumber?: number | null;
  bestCefr?: string | null;
  userAttempts: number;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  hotLevel?: number;
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
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

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

            let completedParts = Number(exam.completedParts || 0);
            let bestCefr = exam.bestCefr || null;
            let bestScore = exam.bestScore || null;

            if (typeof window !== "undefined") {
              try {
                const localProgStr = localStorage.getItem(`aptis_exam_progress_${exam.id}`);
                if (localProgStr) {
                  const localProg = JSON.parse(localProgStr);
                  if (localProg.status === "completed") {
                    status = "completed";
                    completedParts = exam.totalParts || 4;
                  } else if (localProg.status === "in_progress" && status === "not_started") {
                    status = "in_progress";
                    completedParts = localProg.completedParts || 1;
                  }
                  if (localProg.bestCefr && !bestCefr) bestCefr = localProg.bestCefr;
                  if (localProg.bestScore && !bestScore) bestScore = localProg.bestScore;
                }
              } catch {}
            }

            const isFullReading = exam.totalParts === 4 || exam.title.includes("Full Reading");

            return {
              id: exam.id,
              title: exam.title,
              parts: isFullReading ? `Full Reading · 4 Parts` : (exam.partTitle || `Reading Part`),
              totalParts: exam.totalParts || 4,
              completedParts,
              partTitle: exam.partTitle,
              questionsCount: exam.totalQuestions || 20,
              duration: `${exam.durationMinutes || 35} phút`,
              isFree: !exam.isPro,
              status,
              bestCefr,
              bestScore,
              bestScoreNumber: exam.bestScoreNumber,
              userAttempts: exam.userAttempts,
              hotLevel: exam.hotLevel ?? exam.hot_level ?? 0,
              priority: (exam.hotLevel ?? exam.hot_level) === 3 ? "HIGH" : (exam.hotLevel ?? exam.hot_level) === 2 ? "MEDIUM" : (idx % 3 === 0 ? "HIGH" : idx % 3 === 1 ? "MEDIUM" : "LOW"),
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

  // Đồng bộ tab từ URL (?tab=p1/p2/p3/p4/full) và lắng nghe sự kiện switch tab từ Guide Modal
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncTabFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && ["full", "p1", "p2", "p3", "p4"].includes(tabParam)) {
        setActiveTab(tabParam as any);
        setTimeout(() => {
          const el = document.getElementById("practice-sets-section");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    };

    syncTabFromUrl();

    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent<{ skill: string; tab: string }>;
      if (customEvent.detail && (customEvent.detail.skill === "reading" || !customEvent.detail.skill)) {
        const targetTab = customEvent.detail.tab;
        if (["full", "p1", "p2", "p3", "p4"].includes(targetTab)) {
          setActiveTab(targetTab as any);
        }
      }
    };

    window.addEventListener("aptis:switch-skill-tab", handleSwitchTab);
    window.addEventListener("popstate", syncTabFromUrl);

    return () => {
      window.removeEventListener("aptis:switch-skill-tab", handleSwitchTab);
      window.removeEventListener("popstate", syncTabFromUrl);
    };
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
      return e.partTitle?.includes("Part 2") || e.partTitle?.includes("Text Cohesion") || e.partTitle?.includes("Cohesion");
    } else if (activeTab === "p3") {
      // Part 4: Opinion matching (nối ý kiến)
      if (e.totalParts === 4 || e.title.includes("Full Reading")) return false;
      return e.partTitle?.includes("Opinion") || (e.partTitle?.includes("Part 4") && !e.partTitle?.includes("Long")) || (e.partTitle?.includes("Part 3") && !e.partTitle?.includes("Cohesion"));
    } else if (activeTab === "p4") {
      // Part 5: Long reading (đọc bài dài & nối heading)
      if (e.totalParts === 4 || e.title.includes("Full Reading")) return false;
      return e.partTitle?.includes("Long") || e.partTitle?.includes("Part 5") || (e.partTitle?.includes("Part 4") && e.partTitle?.includes("Long"));
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
  }).sort((a, b) => (b.hotLevel || 0) - (a.hotLevel || 0));

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
          desc: "Tổng hợp các bộ đề hoàn thành câu lẻ & chọn từ điền vào chỗ trống ngắn (Aptis Gap Fill).",
          badge: "Part 1",
          partQuery: "?part=1",
          marathonText: "Tổng Hợp Tất Cả Bộ Đề Part 1 (Tách Câu Lẻ)",
          marathonDesc: "Luyện tập tất cả các câu hỏi lẻ Part 1 tách rời rõ ràng, có bản dịch tiếng Việt & chấm điểm tức thì",
          marathonBtn: "Luyện câu hỏi lẻ Part 1 →",
          marathonType: "marathon",
          marathonUrl: "/reading/marathon?part=1",
        };
      case "p2":
        return {
          title: "Part 2 + 3 – Text cohesion",
          desc: "32 bộ đề luyện tập sắp xếp trật tự câu văn thành một đoạn văn hoàn chỉnh.",
          subDesc: "Nhãn ưu tiên là các đề hay thi vào gần đây — Ưu tiên cao là đề nên luyện trước.",
          badge: "Part 2 + 3",
          partQuery: "?part=2",
          marathonText: "Luyện Sắp Xếp Trật Tự Câu Part 2 + 3",
          marathonDesc: "Bộ 12 đề luyện tập di chuyển và sắp xếp trật tự logic câu văn có giải thích chi tiết",
          marathonBtn: "Luyện sắp xếp câu Part 2 + 3 →",
          marathonType: "marathon",
          marathonUrl: "/reading/marathon?part=2",
        };
      case "p3":
        return {
          title: "Part 4 – Opinion matching",
          desc: "32 bộ đề luyện tập nối ý kiến của 4 nhân vật với các câu nhận định.",
          subDesc: "Nhãn ưu tiên là các đề hay thi vào gần đây — Ưu tiên cao là đề nên luyện trước.",
          badge: "Part 4",
          partQuery: "?part=4",
          marathonText: "Ngân Hàng Nối Ý Kiến Nhân Vật Part 4",
          marathonDesc: "Bộ 12 đề ghép 7 nhận định với phát biểu của 4 nhân vật chuẩn format đề thi thật",
          marathonBtn: "Luyện nối ý kiến Part 4 →",
          marathonType: "marathon",
          marathonUrl: "/reading/marathon?part=3",
        };
      case "p4":
        return {
          title: "Part 5 – Long reading",
          desc: "32 bộ đề luyện tập đọc hiểu bài văn dài và chọn tiêu đề Heading cho 7 đoạn văn.",
          badge: "Part 5",
          partQuery: "?part=5",
          marathonText: "Ngân Hàng Chọn Heading Đoạn Văn Part 5",
          marathonDesc: "Bộ 12 bài đọc dài 750 từ kèm chiến thuật chọn Topic Sentence và Heading bao quát",
          marathonBtn: "Luyện đọc dài Part 5 →",
          marathonType: "marathon",
          marathonUrl: "/reading/marathon?part=4",
        };
    }
  };

  const tabInfo = getTabInfo();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-[var(--navbar-total-height,64px)] transition-all duration-300">
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
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (typeof window !== "undefined") {
                    const url = new URL(window.location.href);
                    url.searchParams.set("tab", tab.id);
                    window.history.pushState({}, "", url.toString());
                  }
                }}
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

          {/* Form đề thi & Chiến thuật làm bài chuẩn B2 */}
          <ReadingGuideBanner onOpenGuideModal={() => setIsGuideModalOpen(true)} />

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
            <div id="practice-sets-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 scroll-mt-24">
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
                  {(tabInfo as any).marathonUrl ? (
                    <Link
                      href={(tabInfo as any).marathonUrl}
                      className="block w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-sm transition-colors text-center"
                    >
                      {tabInfo.marathonBtn}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsGuideModalOpen(true)}
                      className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-sm transition-colors text-center"
                    >
                      {tabInfo.marathonBtn}
                    </button>
                  )}
                </div>
              </div>

              {/* CARD 2..N: Practice Exam Cards */}
              {filteredExams.map((exam, idx) => {
                const targetUrl = `/reading/${exam.id}${tabInfo.partQuery}`;
                const numStr = idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`;

                // Rút gọn tiêu đề tối giản theo yêu cầu
                const displayTitle = (() => {
                  if (activeTab === "full") return `Đề ${numStr} — Full Reading · 4 Parts`;
                  if (activeTab === "p1") return `Đề ${numStr}`;
                  if (activeTab === "p2") {
                    const topic = READING_PART2_TOPICS[idx % READING_PART2_TOPICS.length];
                    return `Đề ${numStr} - ${topic.title}`;
                  }
                  if (activeTab === "p3") {
                    const topic = READING_PART3_TOPICS[idx % READING_PART3_TOPICS.length];
                    return `Đề ${numStr} - ${topic.title}`;
                  }
                  const topic = READING_PART4_TOPICS[idx % READING_PART4_TOPICS.length];
                  return `Đề ${numStr} - ${topic.title}`;
                })();

                return (
                  <div
                    key={exam.id}
                    className="relative rounded-2xl border border-border bg-card hover:border-primary/50 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
                  >
                    <div>
                      {/* Top Badges & Score / Status */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
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

                          {/* Stickers đánh giá mức độ ưu tiên bằng cỏ ☘️ theo đúng tài liệu đề hot */}
                          {(() => {
                            let sticker = "";
                            let isKey = false;
                            if (activeTab === "p2") {
                              const t = READING_PART2_TOPICS[idx % READING_PART2_TOPICS.length];
                              sticker = t?.sticker || "☘️☘️☘️ Hay ra";
                              isKey = Boolean(t?.isKey);
                            } else if (activeTab === "p3") {
                              const t = READING_PART3_TOPICS[idx % READING_PART3_TOPICS.length];
                              sticker = t?.sticker || "☘️☘️☘️ Hay ra";
                              isKey = Boolean(t?.isKey);
                            } else if (activeTab === "p4") {
                              const t = READING_PART4_TOPICS[idx % READING_PART4_TOPICS.length];
                              sticker = t?.sticker || "☘️☘️☘️☘️☘️ Cực hot";
                              isKey = Boolean(t?.isKey);
                            } else if (activeTab === "p1") {
                              sticker = idx < 8 ? "☘️☘️☘️☘️☘️ Trọng điểm" : "★★★★★ Hay ra";
                              isKey = idx < 8;
                            } else {
                              sticker = idx % 3 === 0 ? "☘️☘️☘️☘️☘️ Cực hot" : idx % 3 === 1 ? "Đề tủ" : "Mới cập nhật";
                              isKey = idx % 3 === 0;
                            }

                            return (
                              <span
                                className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] inline-flex items-center gap-1 border ${
                                  sticker.includes("☘️☘️☘️☘️☘️")
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-xs"
                                    : sticker.includes("☘️☘️☘️☘️")
                                    ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/40"
                                    : sticker.includes("☘️☘️☘️")
                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40"
                                    : "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40"
                                }`}
                              >
                                {sticker}
                              </span>
                            );
                          })()}
                        </div>

                        {/* Top Right Trophy / CEFR Badge */}
                        <div>
                          {exam.bestCefr || (exam.status === "completed" && (exam.bestScore || exam.bestScoreNumber)) ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-500/25 shadow-2xs">
                              🏆 {exam.bestCefr || "A0"}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-heading font-extrabold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                        {displayTitle}
                      </h3>

                      {/* Subtitle */}
                      <p className="text-xs text-muted-foreground mb-2.5">
                        {activeTab === "full" ? "Full Reading · 4 Parts" : (exam.parts || "Full Reading · 4 Parts")}
                      </p>

                      {/* Progress Badge chuẩn web gốc Aptis: Đã hoàn thành / Đã làm X/4 Part / Chưa bắt đầu */}
                      <div className="pt-0.5">
                        {exam.status === "completed" || (exam.completedParts && exam.completedParts >= (exam.totalParts || 4)) ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Đã hoàn thành tất cả {exam.totalParts || 4} Part</span>
                          </div>
                        ) : exam.status === "in_progress" || (exam.completedParts && exam.completedParts > 0) ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 text-xs font-semibold shadow-2xs">
                            <span>Đã làm {exam.completedParts || 1}/{exam.totalParts || 4} Part</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium block">
                            Chưa bắt đầu
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-6 mt-4 border-t border-border/40 flex items-center justify-end">
                      {exam.isFree || isProOrAdmin ? (
                        <Link
                          href={targetUrl}
                          className="inline-flex items-center gap-1.5 text-primary hover:text-brand-brown font-extrabold text-xs transition-colors"
                        >
                          <span>
                            {exam.status === "in_progress" || (exam.completedParts && exam.completedParts > 0 && exam.completedParts < (exam.totalParts || 4))
                              ? "Tiếp tục luyện tập"
                              : "Bắt đầu luyện tập"}
                          </span>
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
      <UniversalSkillGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        initialSkill="reading"
        onStartPractice={(_s, pIdx) => {
          const tabKey = (`p${pIdx + 1}` as "p1" | "p2" | "p3" | "p4");
          setActiveTab(tabKey);
        }}
      />
    </div>
  );
}
