"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { UniversalSkillGuideModal } from "@/components/skill-format-guide-modal";
import {
  LISTENING_PART2_TOPICS,
  LISTENING_PART3_TOPICS,
  LISTENING_PART4_TOPICS,
} from "@/data/listening-topics-bank";
import { getCloverConfig } from "@/lib/clover-utils";
import { useSkillHubTabSync } from "@/hooks/use-skill-hub";
import { SkillPartTabs } from "@/components/skills/skill-part-tabs";
import { SkillFilterBar } from "@/components/skills/skill-filter-bar";
import {
  SkillMarathonCard,
  SkillExamCard,
  SkillEmptyState,
} from "@/components/skills/skill-exam-card";
import {
  Headphones,
  Clock,
  History,
  Search,
  ArrowRight,
  Play,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles,
  Flame,
  Star,
} from "lucide-react";

interface ListeningExam {
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
  userAttempts?: number;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  hotLevel?: number;
}

export default function ListeningPracticePage() {
  const { user } = useAuth();
  const isProOrAdmin =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "TEACHER" ||
    Boolean(user?.subscription) ||
    Boolean(user?.user_subscriptions?.length);
  const { activeTab, setActiveTab, selectTab } = useSkillHubTabSync("listening");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium" | "low">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "not_started" | "completed">("all");
  const [filterSource, setFilterSource] = useState<"all" | "web" | "my">("all");

  const [exams, setExams] = useState<ListeningExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressText, setProgressText] = useState("Chưa có bài nào — hãy bắt đầu luyện tập!");
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getAll({ skill: "LISTENING", limit: 600 });
      if (res.success && Array.isArray(res.data)) {
        setExams(
          res.data.map((exam: any) => {
            let status: "not_started" | "in_progress" | "completed" = "not_started";
            if (exam.userStatus === "COMPLETED") status = "completed";
            else if (exam.userStatus === "IN_PROGRESS") status = "in_progress";

            const isFullListening = exam.totalParts === 4 || exam.title.includes("Full Listening");

            let hotLevel = Number(exam.hotLevel ?? exam.hot_level ?? 0);
            if (hotLevel === 0) {
              const titleLower = (exam.title || "").toLowerCase();
              const pTitle = exam.partTitle || "";
              let bank: Array<{ keywords?: string[]; title: string; hotLevel: number }> = [];
              if (pTitle.includes("Part 2") || pTitle.includes("Information Matching")) bank = LISTENING_PART2_TOPICS;
              else if (pTitle.includes("Part 3") || pTitle.includes("Opinion Matching")) bank = LISTENING_PART3_TOPICS;
              else if (pTitle.includes("Part 4") || pTitle.includes("Monologue")) bank = LISTENING_PART4_TOPICS;
              for (const item of bank) {
                if (item.keywords?.some((k) => titleLower.includes(k.toLowerCase()))) {
                  hotLevel = item.hotLevel;
                  break;
                }
              }
            }

            return {
              id: exam.id,
              title: exam.title,
              parts: isFullListening ? "Full Listening · 4 Parts" : (exam.partTitle || "Listening Part"),
              totalParts: exam.totalParts || 1,
              partTitle: exam.partTitle,
              questionsCount: exam.totalQuestions || 25,
              duration: `${exam.durationMinutes || 40} phút`,
              isFree: !exam.isPro,
              status,
              bestScore: exam.bestScore || (status === "completed" ? "A0" : null),
              bestScoreNumber: exam.bestScoreNumber,
              userAttempts: exam.userAttempts || 0,
              priority: (hotLevel >= 4 ? "HIGH" : hotLevel >= 3 ? "MEDIUM" : "LOW") as any,
              hotLevel,
            };
          })
        );
      } else {
        setError(res.error?.message || "Không thể tải danh sách đề thi từ máy chủ.");
        setExams([]);
      }
    } catch (err: any) {
      console.error("Failed to load listening exams:", err);
      setError("Không thể kết nối đến máy chủ hoặc cơ sở dữ liệu chưa sẵn sàng.");
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
    // Tải tiến độ Listening của học viên
    api.submissions.getMyHistory({ skill: "LISTENING", limit: 50 }).then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const completed = res.data.filter((h: any) => h.status === "GRADED" || h.status === "SUBMITTED").length;
        const scores = res.data
          .filter((h: any) => h.scoreNumber && h.scoreNumber > 0)
          .map((h: any) => h.scoreNumber as number);
        const avg = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
        if (completed > 0) {
          setProgressText(`Đã hoàn thành ${completed} bài · Điểm trung bình: ${avg}/50`);
        }
      }
    }).catch(() => {});
  }, []);

  // 1. Lọc theo từng Tab chuẩn aptiskytich.vn
  const currentTabExams = exams.filter((e) => {
    if (activeTab === "full") {
      return e.totalParts === 4 || e.title.includes("Full Listening");
    } else if (activeTab === "p1") {
      return (
        e.totalParts === 1 &&
        (e.partTitle?.includes("Part 1") ||
          e.title.includes("Listening Part 1") ||
          e.partTitle?.includes("Information Recognition") ||
          e.partTitle?.includes("Word Recognition"))
      );
    } else if (activeTab === "p2") {
      return (
        e.totalParts === 1 &&
        (e.partTitle?.includes("Part 2") ||
          e.title.includes("Part 2") ||
          e.partTitle?.includes("Information Matching"))
      );
    } else if (activeTab === "p3") {
      return (
        e.totalParts === 1 &&
        (e.partTitle?.includes("Part 3") ||
          e.title.includes("Part 3") ||
          (!e.partTitle?.includes("Part 2") && e.partTitle?.includes("Opinion Matching")))
      );
    } else if (activeTab === "p4") {
      return (
        e.totalParts === 1 &&
        (e.partTitle?.includes("Part 4") ||
          e.title.includes("Part 4") ||
          e.partTitle?.includes("Monologue"))
      );
    }
    return true;
  });

  // 2. Lọc tiếp theo search, status, priority từ currentTabExams
  const filteredExams = currentTabExams.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority =
      filterPriority === "all"
        ? true
        : filterPriority === "high"
        ? (e.hotLevel || 0) >= 3 || e.priority === "HIGH"
        : filterPriority === "medium"
        ? (e.hotLevel || 0) === 2 || e.priority === "MEDIUM"
        : (e.hotLevel || 0) <= 1;
    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "completed"
        ? e.status === "completed"
        : e.status !== "completed";
    return matchesSearch && matchesPriority && matchesStatus;
  }).sort((a, b) => {
    // Sắp xếp ưu tiên tuyệt đối theo Độ Hot (Cỏ ☘️) từ cao xuống thấp (6 -> 5 -> 4 -> 3 -> 2 -> 1 -> 0)
    const hotDiff = (b.hotLevel || 0) - (a.hotLevel || 0);
    if (hotDiff !== 0) return hotDiff;
    const matchA = a.title.match(/Đề\s+(\d+)/i);
    const matchB = b.title.match(/Đề\s+(\d+)/i);
    if (matchA && matchB) {
      return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
    }
    return a.title.localeCompare(b.title, "vi");
  });

  const getTabInfo = () => {
    switch (activeTab) {
      case "full":
        return {
          title: "Full Test Listening",
          marathonText: "Tạo bộ đề của bạn",
          marathonDesc: "Tự ghép các đề lẻ thành bộ full test hoặc full part của riêng bạn. Dành cho tài khoản Pro.",
          marathonBtn: "Nâng cấp để tạo →",
          marathonType: "custom",
          marathonUrl: null,
        };
      case "p1":
        return {
          title: "Part 1 – Information Recognition",
          marathonText: "Ngân Hàng Câu Hỏi Nghe Part 1",
          marathonDesc: "Luyện tập tất cả các câu hỏi nhận diện thông tin ngắn có audio thật, transcript song ngữ và giải thích chi tiết",
          marathonBtn: "Luyện 13 câu nghe Part 1 →",
          marathonType: "marathon",
          marathonUrl: "/listening/marathon?part=1",
        };
      case "p2":
        return {
          title: "Part 2 – Speaker Matching",
          marathonText: "Ngân Hàng Ghép Người Nói Part 2",
          marathonDesc: "Bộ 8 chủ đề 4 người phát biểu kèm audio bản ngữ chuẩn British Council và phân tích bẫy nghe",
          marathonBtn: "Luyện 8 đề ghép người nói Part 2 →",
          marathonType: "marathon",
          marathonUrl: "/listening/marathon?part=2",
        };
      case "p3":
        return {
          title: "Part 3 – Opinion Matching",
          marathonText: "Đàm Thoại Quan Điểm Part 3",
          marathonDesc: "Luyện nghe bắt quan điểm Man/Woman/Both agree với 6 bộ đàm thoại hay ra trong đề thi thật",
          marathonBtn: "Luyện đàm thoại Part 3 →",
          marathonType: "marathon",
          marathonUrl: "/listening/marathon?part=3",
        };
      case "p4":
        return {
          title: "Part 4 – Monologue & Lectures",
          marathonText: "Nghe Độc Thoại & Bài Giảng Part 4",
          marathonDesc: "Rèn luyện nghe hiểu sâu 6 bài thuyết trình & bản tin radio dài chuẩn format Aptis ESOL",
          marathonBtn: "Luyện bài độc thoại Part 4 →",
          marathonType: "marathon",
          marathonUrl: "/listening/marathon?part=4",
        };
    }
  };

  const tabInfo = getTabInfo();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-[var(--navbar-total-height,64px)] transition-all duration-300">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border bg-card">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full blur-3xl animate-breathing -top-32 -right-24"
            style={{ width: "420px", height: "420px", background: "hsl(var(--primary) / 0.35)" }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full blur-3xl animate-breathing -bottom-40 -left-20 opacity-70"
            style={{ width: "320px", height: "320px", background: "hsl(var(--primary) / 0.35)" }}
          />

          <div className="section-container py-12 md:py-16 relative z-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Headphones className="w-6 h-6 text-primary" />
                </div>
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 border-transparent bg-secondary text-secondary-foreground text-xs font-medium gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>40 phút · 25 câu</span>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
                Luyện tập full part kỹ năng Listening
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Hoàn thành tất cả các Part của kỹ năng này trong một lượt thi liên tục để đánh giá năng lực chính xác nhất. Mỗi đoạn audio được nghe tối đa 2 lần.
              </p>
              <Link
                className="tech-btn inline-flex items-center justify-center gap-2 whitespace-nowrap border dark:text-primary-foreground bg-background py-2 mt-4 rounded-full border-primary text-primary hover:bg-primary/10 hover:text-primary h-9 px-4 text-sm font-medium transition-colors"
                href="/meo-thi-aptis/meo-hoc-listening-aptis"
                data-discover="true"
              >
                💡 Xem ngay - Mẹo làm bài Listening
              </Link>
            </div>
          </div>
        </section>

        {/* Progress Strip */}
        <section className="section-container pt-6 md:pt-8">
          <div className="mb-6 rounded-xl border border-border bg-card/60 px-4 py-3.5 md:px-5 md:py-4 flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <History className="w-5 h-5 text-foreground/70" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-foreground text-sm md:text-base leading-tight">
                Tiến độ học tập của bạn
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 truncate">
                {progressText}
              </p>
            </div>
            <Link className="shrink-0" href="/history?skill=listening" data-discover="true">
              <button
                type="button"
                className="tech-btn inline-flex items-center justify-center whitespace-nowrap text-sm font-medium border border-primary text-primary dark:text-primary-foreground bg-background hover:bg-primary/10 h-9 rounded-md px-3 gap-1.5 transition-colors"
              >
                <span className="hidden sm:inline">Xem lịch sử</span>
                <span className="sm:hidden">Lịch sử</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </section>

        {/* Search, Filter & Parts */}
        <section className="section-container py-8 md:py-10">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex w-full rounded-xl border border-input px-3 py-2 text-base md:text-sm pl-10 h-11 bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Tìm kiếm bộ đề Listening..."
              />
            </div>
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 h-11 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all shadow-2xs shrink-0"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Cẩm nang 4 Part chi tiết</span>
            </button>
          </div>

          {/* Parts Filter Tabs */}
          <SkillPartTabs
            activeTab={activeTab}
            onSelectTab={selectTab}
            tabs={[
              { id: "full", label: "Full Part", sub: "Tất cả các Part" },
              { id: "p1", label: "P.1", sub: "Word recognition (Câu 1 - 13)" },
              { id: "p2", label: "P.2", sub: "Matching info (Câu 14)" },
              { id: "p3", label: "P.3", sub: "Short conversations (Câu 15)" },
              { id: "p4", label: "P.4", sub: "Monologues (Câu 16 - 17)" },
            ]}
          />

          {/* 3 Hàng Bộ lọc chuẩn */}
          <SkillFilterBar
            exams={currentTabExams}
            activeTab={activeTab}
            filterPriority={filterPriority}
            setFilterPriority={setFilterPriority}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterSource={filterSource}
            setFilterSource={setFilterSource}
          />

          {/* Cards Grid */}
          {loading ? (
            <div className="py-20 text-center text-muted-foreground space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Đang tải danh sách đề thi từ hệ thống...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Chưa thể tải dữ liệu</p>
                  <p className="text-xs opacity-90">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadExams}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90 shrink-0"
              >
                Thử lại
              </button>
            </div>
          ) : filteredExams.length === 0 ? (
            <SkillEmptyState
              icon={<Headphones className="w-10 h-10" />}
              title="Không có đề thi nào"
              description="Không tìm thấy đề thi Listening nào khớp với bộ lọc hiện tại."
              onResetFilters={() => {
                setSearchTerm("");
                setFilterPriority("all");
                setFilterStatus("all");
              }}
            />
          ) : (
            <div id="practice-sets-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 scroll-mt-24">
              <SkillMarathonCard
                marathonType={tabInfo.marathonType}
                marathonText={tabInfo.marathonText}
                marathonDesc={tabInfo.marathonDesc}
                marathonBtn={tabInfo.marathonBtn}
                marathonUrl={tabInfo.marathonUrl}
                onActionClick={() => setIsGuideModalOpen(true)}
              />

              {filteredExams.map((exam, idx) => {
                const partBadge =
                  exam.totalParts === 4 || exam.title.includes("Full Listening")
                    ? "Full Part"
                    : activeTab === "p1"
                    ? "Part 1"
                    : activeTab === "p2"
                    ? "Part 2"
                    : activeTab === "p3"
                    ? "Part 3"
                    : activeTab === "p4"
                    ? "Part 4"
                    : exam.partTitle?.split(" - ")[0] || exam.partTitle?.split(":")[0] || "Part";

                const displayTitle = (() => {
                  if (exam.title) {
                    if (activeTab === "p1" && exam.title.includes("Listening Part 1")) {
                      return exam.title.replace("Listening Part 1", "Part 1: Information Recognition");
                    }
                    return exam.title;
                  }
                  const padded = idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`;
                  if (activeTab === "full") return `Đề ${padded} — Full Listening · 4 Parts`;
                  if (activeTab === "p1") return `Đề ${padded} - Part 1: Information Recognition`;
                  if (activeTab === "p2") {
                    const item = LISTENING_PART2_TOPICS[idx % LISTENING_PART2_TOPICS.length];
                    return `Đề ${padded} - ${item.title}`;
                  }
                  if (activeTab === "p3") {
                    const item = LISTENING_PART3_TOPICS[idx % LISTENING_PART3_TOPICS.length];
                    return `Đề ${padded} - ${item.title}`;
                  }
                  const item = LISTENING_PART4_TOPICS[idx % LISTENING_PART4_TOPICS.length];
                  return `Đề ${padded} - ${item.title}`;
                })();

                return (
                  <SkillExamCard
                    key={exam.id}
                    id={exam.id}
                    title={displayTitle}
                    subtitle={`${exam.parts} · ${exam.questionsCount} câu · ${exam.duration}`}
                    partBadge={partBadge}
                    isFree={exam.isFree}
                    isProOrAdmin={isProOrAdmin}
                    cloverLevel={exam.hotLevel}
                    trophyText={exam.bestScore}
                    status={exam.status}
                    totalParts={4}
                    targetUrl={`/listening/${exam.id}${activeTab !== "full" ? `?part=${activeTab}` : ""}`}
                  />
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
        initialSkill="listening"
        onStartPractice={(_s, pIdx) => {
          const tabKey = (`p${pIdx + 1}` as "p1" | "p2" | "p3" | "p4");
          setActiveTab(tabKey);
        }}
      />
    </div>
  );
}
