"use client";

import { useState, useEffect, useRef } from "react";
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
  Languages,
} from "lucide-react";
import { getCloverConfig } from "@/lib/clover-utils";
import { ReadingGoogleTranslateModal } from "@/components/reading-google-translate";
import { useSkillHubTabSync } from "@/hooks/use-skill-hub";
import { SkillPartTabs } from "@/components/skills/skill-part-tabs";
import { SkillFilterBar } from "@/components/skills/skill-filter-bar";
import {
  SkillMarathonCard,
  SkillExamCard,
  SkillEmptyState,
} from "@/components/skills/skill-exam-card";

interface ReadingExam {
  id: string;
  title: string;
  parts: string;
  totalParts: number;
  completedParts?: number;
  correctQuestions?: number | null;
  answeredQuestions?: number | null;
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
  const { activeTab, setActiveTab, selectTab } = useSkillHubTabSync("reading");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium" | "low">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "not_started" | "completed">("all");
  const [filterSource, setFilterSource] = useState<"all" | "web" | "my">("all");

  const [exams, setExams] = useState<ReadingExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getAll({ skill: "READING", limit: 500 });
      if (res.success && Array.isArray(res.data)) {
        setExams(
          res.data.map((exam: any, idx: number) => {
            let status: "not_started" | "in_progress" | "completed" = "not_started";
            if (exam.userStatus === "COMPLETED") status = "completed";
            else if (exam.userStatus === "IN_PROGRESS") status = "in_progress";

            let completedParts = Number(exam.completedParts || 0);
            let correctQuestions: number | null =
              exam.correctQuestions !== undefined && exam.correctQuestions !== null
                ? Number(exam.correctQuestions)
                : null;
            let answeredQuestions: number | null =
              exam.answeredQuestions !== undefined && exam.answeredQuestions !== null
                ? Number(exam.answeredQuestions)
                : null;
            let questionsCount = Number(exam.totalQuestions || 20);
            let bestCefr = exam.bestCefr || null;
            let bestScore = exam.bestScore || null;

            if (typeof window !== "undefined") {
              try {
                const localProgStr = localStorage.getItem(`aptis_exam_progress_${exam.id}`);
                if (localProgStr) {
                  const localProg = JSON.parse(localProgStr);
                  if (localProg.status === "completed") {
                    status = "completed";
                    completedParts = exam.totalParts || 1;
                  } else if (
                    localProg.status === "in_progress" &&
                    status === "not_started" &&
                    ((localProg.answeredQuestions && localProg.answeredQuestions > 0) ||
                      (localProg.correctQuestions !== undefined && localProg.correctQuestions !== null))
                  ) {
                    status = "in_progress";
                    completedParts = localProg.completedParts || 1;
                  }
                  if (localProg.correctQuestions !== undefined && localProg.correctQuestions !== null) {
                    correctQuestions = Number(localProg.correctQuestions);
                  }
                  if (localProg.answeredQuestions !== undefined && localProg.answeredQuestions !== null) {
                    answeredQuestions = Number(localProg.answeredQuestions);
                  }
                  if (localProg.totalQuestions && Number(localProg.totalQuestions) > 0) {
                    questionsCount = Number(localProg.totalQuestions);
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
              totalParts: exam.totalParts || (isFullReading ? 4 : 1),
              completedParts,
              correctQuestions,
              answeredQuestions,
              partTitle: exam.partTitle,
              questionsCount,
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

  // 1. Danh sách đề thi thuộc Tab hiện tại (Tab Full Part, Part 1, Part 2, Part 3, Part 4)
  const currentTabExams = exams.filter((e) => {
    const isFullReading = e.title.includes("Full Reading") || e.totalParts === 4;

    if (activeTab === "full") {
      return (
        isFullReading ||
        e.partTitle?.includes("Part 2") ||
        e.partTitle?.includes("Text Cohesion") ||
        e.partTitle?.includes("Cohesion") ||
        e.title.includes("Part 2") ||
        e.title.includes("PART2") ||
        e.title.includes("Bộ Đề Tủ Part 2") ||
        READING_PART2_TOPICS.some((t) =>
          e.title.toLowerCase().includes(t.title.toLowerCase())
        )
      );
    } else if (activeTab === "p1") {
      // Part 1: Sentence comprehension (chỉ hiện đề lẻ Part 1)
      return (
        !isFullReading && (
          e.title.includes("Reading Part 1") ||
          e.title.includes("PART1") ||
          /^(?:Đề|Test|Exam)\s*\d+$/i.test(e.title.trim()) ||
          e.partTitle?.includes("Part 1") ||
          e.parts?.includes("Part 1")
        )
      );
    } else if (activeTab === "p2") {
      // Part 2: Text cohesion (sắp xếp câu) (chỉ hiện đề lẻ Part 2)
      return (
        !isFullReading && (
          e.partTitle?.includes("Part 2") ||
          e.partTitle?.includes("Text Cohesion") ||
          e.partTitle?.includes("Cohesion") ||
          e.title.includes("Part 2") ||
          e.title.includes("PART2") ||
          READING_PART2_TOPICS.some((t) =>
            e.title.toLowerCase().includes(t.title.toLowerCase())
          )
        )
      );
    } else if (activeTab === "p3") {
      // Part 3: Opinion matching (nối ý kiến) (chỉ hiện đề lẻ Part 3)
      return (
        !isFullReading && (
          e.partTitle?.includes("Opinion") ||
          (e.partTitle?.includes("Part 4") && !e.partTitle?.includes("Long")) ||
          (e.partTitle?.includes("Part 3") && !e.partTitle?.includes("Cohesion")) ||
          e.title.includes("Part 3") ||
          READING_PART3_TOPICS.some((t) =>
            e.title.toLowerCase().includes(t.title.toLowerCase())
          )
        )
      );
    } else if (activeTab === "p4") {
      // Part 4: Long reading (đọc bài dài & nối heading) (chỉ hiện đề lẻ Part 4)
      return (
        !isFullReading && (
          e.partTitle?.includes("Long") ||
          e.partTitle?.includes("Part 5") ||
          (e.partTitle?.includes("Part 4") && e.partTitle?.includes("Long")) ||
          READING_PART4_TOPICS.some((t) =>
            e.title.toLowerCase().includes(t.title.toLowerCase())
          )
        )
      );
    }
    return true;
  });

  // 2. Lọc tiếp theo search, status, priority và sắp xếp theo ☘️ từ cao xuống thấp
  const filteredExams = currentTabExams
    .map((e, idx) => {
      let cloverLevel = e.hotLevel || 0;
      if (cloverLevel === 0) {
        const bank =
          activeTab === "p2" || activeTab === "full"
            ? READING_PART2_TOPICS
            : activeTab === "p3"
            ? READING_PART3_TOPICS
            : activeTab === "p4"
            ? READING_PART4_TOPICS
            : [];
        const matched = bank.find((t) =>
          e.title.toLowerCase().includes(t.title.toLowerCase()) ||
          t.title.toLowerCase().includes(e.title.toLowerCase())
        );
        if (matched && (matched.hotLevel || matched.cloverLevel)) {
          cloverLevel = matched.hotLevel || matched.cloverLevel || 0;
        }
      }
      return { ...e, computedClover: cloverLevel, originalIdx: idx };
    })
    .filter((e) => {
      const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all"
          ? true
          : filterStatus === "completed"
          ? e.status === "completed" || e.status === "in_progress"
          : e.status === "not_started";
      const matchesPriority =
        activeTab === "p1" || filterPriority === "all"
          ? true
          : filterPriority === "high"
          ? e.computedClover >= 5
          : filterPriority === "medium"
          ? e.computedClover === 4
          : e.computedClover <= 3;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      // Ưu tiên sắp xếp theo số ☘️ từ cao xuống thấp cho các tab có nhãn ☘️ (trừ Part 1 sắp xếp theo số thứ tự đề 01 -> 52)
      if (activeTab !== "p1") {
        const cloverDiff = (b.computedClover || 0) - (a.computedClover || 0);
        if (cloverDiff !== 0) return cloverDiff;
      }
      // Nếu cùng mức ☘️ (hoặc tab Part 1), sắp xếp tự nhiên theo số thứ tự đề
      const numA = (a.title.match(/(?:Đề|Test|Exam)\s*0*(\d+)/i) || [])[1];
      const numB = (b.title.match(/(?:Đề|Test|Exam)\s*0*(\d+)/i) || [])[1];
      if (numA && numB) return Number(numA) - Number(numB);
      return a.title.localeCompare(b.title, "vi");
    });

  // Dynamic naming based on activeTab
  const getTabInfo = () => {
    switch (activeTab) {
      case "full":
        return {
          title: "Tổng hợp đề thi Reading & Bộ đề tủ Part 2",
          desc: "Toàn bộ đề thi Full Reading liên hoàn và ngân hàng đề tủ Part 2 Text Cohesion được sắp xếp theo độ hot (☘️) từ cao xuống thấp.",
          badge: "Full Reading & Đề Tủ Part 2",
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
          {/* Search Box & Quick Google Translate Tool */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex w-full rounded-xl border border-input px-3 py-2 text-sm pl-10 h-11 bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                placeholder="Tìm kiếm bộ đề Reading..."
              />
            </div>
            <button
              type="button"
              onClick={() => setIsTranslateOpen(true)}
              className="h-11 px-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 font-bold text-xs flex items-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer"
              title="Tra cứu từ vựng & dịch câu bằng Google Dịch"
            >
              <Languages className="w-4 h-4" />
              <span className="hidden sm:inline">Google Dịch</span>
            </button>
          </div>

          {/* Top 5 Part Tabs matching aptiskytich.vn */}
          <SkillPartTabs
            activeTab={activeTab}
            onSelectTab={selectTab}
            tabs={[
              { id: "full", label: "Full Part", sub: "Tất cả các Part" },
              { id: "p1", label: "Part 1", sub: "Sentence comprehension" },
              { id: "p2", label: "Part 2 + 3", sub: "Text cohesion" },
              { id: "p3", label: "Part 4", sub: "Opinion matching" },
              { id: "p4", label: "Part 5", sub: "Long reading" },
            ]}
          />

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
          <SkillFilterBar
            exams={currentTabExams}
            activeTab={activeTab}
            filterPriority={filterPriority}
            setFilterPriority={setFilterPriority}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterSource={filterSource}
            setFilterSource={setFilterSource}
            showPriorityRow={activeTab === "full" || activeTab === "p2" || activeTab === "p3" || activeTab === "p4"}
          />

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
          ) : filteredExams.length === 0 ? (
            <SkillEmptyState
              icon={<BookOpen className="w-10 h-10" />}
              title="Không có đề thi nào"
              description="Không tìm thấy đề thi Reading nào khớp với bộ lọc hiện tại."
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
                marathonUrl={(tabInfo as any).marathonUrl}
                onActionClick={() => setIsGuideModalOpen(true)}
              />

              {filteredExams.map((exam, idx) => {
                const targetUrl = `/reading/${exam.id}${tabInfo.partQuery}`;
                const numMatch = exam.title.match(/(?:Đề|Test|Exam)\s*0*(\d+)/i);
                const rawNum = numMatch ? numMatch[1] : String(idx + 1);
                const cleanNumStr = `Đề ${rawNum.padStart(2, "0")}`;

                const displayTitle = (() => {
                  if (activeTab === "full") {
                    return exam.title.replace(/^Bộ\s*Đề\s*Tủ\s*[-:—–]\s*/i, "").trim();
                  }
                  if (activeTab === "p1") {
                    return cleanNumStr;
                  }
                  let topicClean = exam.title
                    .replace(/^(?:Bộ\s*Key\s*READING\s*PART\d+|Reading\s*Part\s*\d+|Reading\s*\d+)\s*[-:—–]\s*/i, "")
                    .replace(/^(?:Đề|Test|Exam)\s*\d+\s*[-:—–]\s*/i, "")
                    .replace(/\s*\(\s*(?:key|KEY|\s*mới\s*)\s*\)/i, "")
                    .replace(/\s*[-:—–]\s*Reading\s*Part\s*\d+.*$/i, "")
                    .trim();

                  if (
                    !topicClean ||
                    /^(?:Đề|Test|Exam)\s*\d+$/i.test(topicClean) ||
                    /^(?:Reading\s*Part\s*\d+|Key\s*PART\d+)$/i.test(topicClean) ||
                    topicClean.includes("Full Reading")
                  ) {
                    const bank =
                      activeTab === "p2"
                        ? READING_PART2_TOPICS
                        : activeTab === "p3"
                        ? READING_PART3_TOPICS
                        : READING_PART4_TOPICS;
                    const matchedBank = bank.find((t) =>
                      exam.title.toLowerCase().includes(t.title.toLowerCase())
                    );
                    topicClean =
                      matchedBank?.title ||
                      (activeTab === "p2"
                        ? "Text Cohesion"
                        : activeTab === "p3"
                        ? "Opinion Matching"
                        : "Long Reading");
                  }
                  return `${cleanNumStr} — ${topicClean}`;
                })();

                const trophy =
                  exam.bestCefr ||
                  (exam.status === "completed" && (exam.bestScore || exam.bestScoreNumber)
                    ? exam.bestCefr || "A0"
                    : null);

                return (
                  <SkillExamCard
                    key={exam.id}
                    id={exam.id}
                    title={displayTitle}
                    subtitle={activeTab === "full" ? "Full Reading · 4 Parts" : exam.parts || "Full Reading · 4 Parts"}
                    partBadge={tabInfo.badge}
                    isFree={exam.isFree}
                    isProOrAdmin={isProOrAdmin}
                    cloverLevel={(exam as any).computedClover || exam.hotLevel}
                    trophyText={trophy}
                    status={exam.status}
                    completedParts={exam.completedParts}
                    totalParts={exam.totalParts || 1}
                    correctQuestions={exam.correctQuestions}
                    answeredQuestions={exam.answeredQuestions}
                    questionsCount={exam.questionsCount}
                    targetUrl={targetUrl}
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
        initialSkill="reading"
        onStartPractice={(_s, pIdx) => {
          const tabKey = (`p${pIdx + 1}` as "p1" | "p2" | "p3" | "p4");
          setActiveTab(tabKey);
        }}
      />
      <ReadingGoogleTranslateModal
        isOpen={isTranslateOpen}
        onClose={() => setIsTranslateOpen(false)}
      />
    </div>
  );
}
