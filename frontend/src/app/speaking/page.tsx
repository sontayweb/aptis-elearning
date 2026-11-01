"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { UniversalSkillGuideModal } from "@/components/skill-format-guide-modal";
import { SpeakingGuideBanner } from "@/components/speaking-guide-banner";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import {
  Mic,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  AlertCircle,
  Trophy,
  Flame,
  Star,
} from "lucide-react";
import { getCloverConfig } from "@/lib/clover-utils";
import { useSkillHubTabSync } from "@/hooks/use-skill-hub";
import { SkillPartTabs } from "@/components/skills/skill-part-tabs";
import { SkillFilterBar } from "@/components/skills/skill-filter-bar";
import {
  SkillMarathonCard,
  SkillExamCard,
  SkillEmptyState,
} from "@/components/skills/skill-exam-card";

interface SpeakingExam {
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

export default function SpeakingPracticePage() {
  const { user } = useAuth();
  const isProOrAdmin =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "TEACHER" ||
    Boolean(user?.subscription) ||
    Boolean(user?.user_subscriptions?.length);
  const { activeTab, setActiveTab, selectTab } = useSkillHubTabSync("speaking");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium" | "low">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "not_started" | "completed">("all");
  const [filterSource, setFilterSource] = useState<"all" | "web" | "my">("all");

  const [exams, setExams] = useState<SpeakingExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getAll({ skill: "SPEAKING", limit: 500 });
      if (res.success && Array.isArray(res.data)) {
        setExams(
          res.data.map((exam: any, idx: number) => {
            let status: "not_started" | "in_progress" | "completed" = "not_started";
            if (exam.userStatus === "COMPLETED") status = "completed";
            else if (exam.userStatus === "IN_PROGRESS") status = "in_progress";

            let completedParts = Number(exam.completedParts || 0);
            let bestCefr = exam.bestCefr || null;
            let bestScore = exam.bestScore || null;

            // Đồng bộ trực tiếp từ localStorage để phản ánh tức thì tiến độ làm bài
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
                  if (localProg.bestCefr && !bestCefr) {
                    bestCefr = localProg.bestCefr;
                  }
                  if (localProg.bestScore && !bestScore) {
                    bestScore = localProg.bestScore;
                  }
                }
              } catch {
                // ignore
              }
            }

            const isFullSpeaking = exam.totalParts === 4 || exam.title.includes("Full Speaking");

            // Phân bổ tỷ lệ ưu tiên trực quan (Cao, Vừa, Thấp)
            let priority: "HIGH" | "MEDIUM" | "LOW" = "HIGH";
            if (exam.priority) {
              priority = exam.priority;
            } else {
              const mod = idx % 5;
              if (mod === 0 || mod === 1 || mod === 3) priority = "HIGH";
              else if (mod === 2) priority = "MEDIUM";
              else priority = "LOW";
            }

            const hotLevel = Number(exam.hotLevel ?? exam.hot_level ?? 0);

            return {
              id: exam.id,
              title: exam.title,
              parts: isFullSpeaking ? "Full Speaking · 4 Parts" : (exam.partTitle || "Speaking Part"),
              totalParts: exam.totalParts || 4,
              completedParts,
              partTitle: exam.partTitle,
              questionsCount: exam.totalQuestions || 4,
              duration: `${exam.durationMinutes || 12} phút`,
              isFree: !exam.isPro,
              status,
              bestCefr,
              bestScore,
              bestScoreNumber: exam.bestScoreNumber,
              userAttempts: exam.userAttempts || 0,
              priority,
              hotLevel,
            };
          })
        );
      } else {
        setError(res.error?.message || "Không thể tải danh sách đề thi từ máy chủ (Vui lòng kiểm tra CSDL).");
        setExams([]);
      }
    } catch (err: any) {
      console.error("Failed to load speaking exams:", err);
      setError("Không thể kết nối đến máy chủ hoặc cơ sở dữ liệu chưa sẵn sàng.");
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  // 1. Lọc theo từng Tab chuẩn: Không lặp đúp giữa đề Full và đề Part đơn
  const currentTabExams = exams.filter((e) => {
    if (activeTab === "full") {
      return e.totalParts === 4 || e.title.includes("Full Speaking");
    }

    const isSinglePart = e.totalParts === 1;
    if (activeTab === "p1") {
      if (isSinglePart) return e.partTitle?.includes("Part 1") || e.partTitle?.includes("Personal") || e.title.includes("Part 1") || e.title.includes("PART 1");
      return false;
    } else if (activeTab === "p2") {
      if (isSinglePart) return e.partTitle?.includes("Part 2") || e.partTitle?.includes("Describe") || e.title.includes("Part 2") || e.title.includes("PART 2");
      return false;
    } else if (activeTab === "p3") {
      if (isSinglePart) return e.partTitle?.includes("Part 3") || e.partTitle?.includes("Compare") || e.title.includes("Part 3") || e.title.includes("PART 3");
      return false;
    } else if (activeTab === "p4") {
      if (isSinglePart) return e.partTitle?.includes("Part 4") || e.partTitle?.includes("Discussion") || e.title.includes("Part 4") || e.title.includes("PART 4");
      return false;
    }
    return true;
  });

  // 2. Lọc tiếp theo search, status, priority, source và sắp xếp chuẩn theo số đề thật
  const filteredExams = currentTabExams.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "completed"
        ? e.status === "completed"
        : e.status !== "completed";
    const matchesPriority =
      filterPriority === "all"
        ? true
        : filterPriority === "high"
        ? e.priority === "HIGH"
        : filterPriority === "medium"
        ? e.priority === "MEDIUM"
        : e.priority === "LOW";
    const matchesSource = filterSource === "all" || filterSource === "web" ? true : false;
    return matchesSearch && matchesStatus && matchesPriority && matchesSource;
  }).sort((a, b) => {
    // Sắp xếp tự nhiên theo đúng số đề gốc: Đề 01 -> Đề 02 -> ... -> Đề 26
    const numA = (a.title.match(/^(?:Đề|Test|Exam)\s*0*(\d+)/i) || [])[1];
    const numB = (b.title.match(/^(?:Đề|Test|Exam)\s*0*(\d+)/i) || [])[1];
    if (numA && numB) return Number(numA) - Number(numB);
    return a.title.localeCompare(b.title, "vi");
  });

  // Dynamic naming based on activeTab
  const getTabInfo = () => {
    switch (activeTab) {
      case "full":
        return {
          title: "Luyện tập full part kỹ năng Speaking",
          desc: "Hoàn thành tất cả các Part của kỹ năng này trong một lượt thi liên tục để đánh giá năng lực chính xác nhất.",
          badge: "Full Part",
          partQuery: "",
          marathonText: "Tạo bộ đề của bạn",
          marathonDesc: "Tự ghép các đề lẻ thành bộ full test hoặc full part của riêng bạn. Dành cho tài khoản Pro.",
          marathonBtn: "Nâng cấp để tạo →",
          marathonType: "custom",
        };
      case "p1":
        return {
          title: "Part 1 – Personal information",
          desc: "Trả lời 3 câu hỏi ngắn về bản thân, gia đình, công việc, sở thích... Thời gian nói 30 giây cho mỗi câu.",
          badge: "Part 1",
          partQuery: "?part=1",
          marathonText: "Ngân Hàng Câu Hỏi Lẻ Part 1",
          marathonDesc: "Luyện 90+ câu hỏi lẻ theo chủ đề kèm bài mẫu B2/C1 — AI nhận diện giọng nói & đếm giờ 30s",
          marathonBtn: "Luyện câu hỏi lẻ Part 1 →",
          marathonType: "marathon",
          marathonUrl: "/speaking/marathon?part=1",
        };
      case "p2":
        return {
          title: "Tranh trọng điểm Part 2 – Describe, express opinion and explain",
          desc: "Miêu tả một bức tranh trong 45 giây và trả lời 2 câu hỏi mở rộng về chủ đề liên quan.",
          subDesc: "Danh mục Tranh trọng điểm Part 2 – Các đề trọng tâm xuất hiện liên tục trong đề thi thật.",
          badge: "Tranh trọng điểm Part 2",
          partQuery: "?part=2",
          marathonText: "Tranh Trọng Điểm & Từ Vựng Part 2",
          marathonDesc: "Bộ 25 tranh thi thật kèm bảng từ vựng song ngữ và 3 câu hỏi chi tiết theo từng tranh",
          marathonBtn: "Luyện 25 đề tranh Part 2 →",
          marathonType: "marathon",
          marathonUrl: "/speaking/marathon?part=2",
        };
      case "p3":
        return {
          title: "Part 3 – Describe, compare and explain",
          desc: "So sánh 2 bức tranh và trả lời 2 câu hỏi phân tích, nêu lý do và quan điểm cá nhân (45s mỗi câu).",
          subDesc: "Nhãn ưu tiên là các đề hay thi vào gần đây — Ưu tiên cao là đề nên luyện trước.",
          badge: "Part 3",
          partQuery: "?part=3",
          marathonText: "So Sánh Cặp Tranh Part 3",
          marathonDesc: "Bộ cặp tranh đối lập kèm bảng từ vựng so sánh chuẩn đề thi British Council",
          marathonBtn: "Luyện cặp tranh Part 3 →",
          marathonType: "marathon",
          marathonUrl: "/speaking/marathon?part=3",
        };
      case "p4":
        return {
          title: "Part 4 – Discuss personal experience and opinion",
          desc: "Xem tranh, có 1 phút chuẩn bị ghi chú và nói liên tục trong 2 phút trả lời 3 câu hỏi trải nghiệm/trừu tượng.",
          badge: "Part 4",
          partQuery: "?part=4",
          marathonText: "Luyện Nói Liên Tục 2 Phút Part 4",
          marathonDesc: "Hiển thị cùng lúc 3 câu hỏi, chuẩn 1 phút chuẩn bị + 2 phút nói liên tục",
          marathonBtn: "Chọn đề luyện Part 4 bên dưới ↓",
          marathonType: "custom",
          marathonUrl: "#exam-grid",
        };
    }
  };

  const tabInfo = getTabInfo();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-[calc(var(--navbar-total-height,64px)+16px)] sm:pt-[calc(var(--navbar-total-height,64px)+22px)] md:pt-[calc(var(--navbar-total-height,64px)+28px)] transition-all duration-300">
        <section className="section-container py-6 md:py-8">
          {/* Search Box */}
          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex w-full rounded-xl border border-input px-3 py-2 text-sm pl-10 h-11 bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
              placeholder="Tìm kiếm bộ đề Speaking..."
            />
          </div>

          {/* Top 5 Part Tabs matching reading/listening layout */}
          <SkillPartTabs
            activeTab={activeTab}
            onSelectTab={selectTab}
            tabs={[
              { id: "full", label: "Full Part", sub: "Tất cả các Part" },
              { id: "p1", label: "Part 1", sub: "Personal information" },
              { id: "p2", label: "Part 2", sub: "Describe & explain" },
              { id: "p3", label: "Part 3", sub: "Compare & reasons" },
              { id: "p4", label: "Part 4", sub: "Long turn (2 phút)" },
            ]}
          />

          {/* Form đề thi + Hướng dẫn học toàn diện */}
          <SpeakingGuideBanner onOpenGuideModal={() => setIsGuideModalOpen(true)} />

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
          />

          {/* Cards Grid */}
          {loading ? (
            <div className="py-20 text-center text-muted-foreground space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Đang tải danh sách đề thi Speaking...</p>
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
              icon={<Sparkles className="w-10 h-10" />}
              title="Không có đề thi nào"
              description="Không tìm thấy đề thi Speaking nào khớp với bộ lọc hiện tại."
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
                const rawTitle = (exam.title || "").trim();
                const numMatch =
                  rawTitle.match(/^(?:Đề|Test|Exam)\s*0*(\d+)/i) ||
                  rawTitle.match(/(?:Đề|Test|Exam)\s*0*(\d+)/i);
                const rawNum = numMatch ? numMatch[1] : String(idx + 1);
                const examNumStr = `Đề ${rawNum.padStart(2, "0")}`;

                let topicName = rawTitle
                  .replace(/^(?:Đề|Test|Exam)\s*\d+\s*[-:—–]\s*/i, "")
                  .replace(/^Speaking\s*[-:—–]\s*/i, "")
                  .replace(/\s*[-:—–]\s*Part\s*\d+.*$/i, "")
                  .replace(/—\s*Full Speaking.*$/i, "")
                  .trim();

                const isGenericTopic =
                  !topicName ||
                  /^full speaking/i.test(topicName) ||
                  /^speaking part/i.test(topicName);

                const displayTitle = (() => {
                  if (activeTab === "full") return rawTitle;
                  if (activeTab === "p1" || activeTab === "p2") return examNumStr;
                  if (!isGenericTopic) return `${examNumStr} — ${topicName}`;
                  const partDefaults: Record<string, string> = {
                    p1: "Personal Information",
                    p2: "Describing a Picture",
                    p3: "Two Pictures Comparison",
                    p4: "Experience & Opinion",
                  };
                  return `${examNumStr} — ${partDefaults[activeTab] || "Speaking Practice"}`;
                })();

                const displaySubtitle = (() => {
                  if (activeTab === "full") return "Full Speaking · 4 Parts liên tục (12 phút)";
                  if (activeTab === "p1") return "Part 1 · Phỏng vấn cá nhân (3 câu · 30s/câu)";
                  if (activeTab === "p2") return "Part 2 · Tranh trọng điểm & Miêu tả (45s/câu)";
                  if (activeTab === "p3") return "Part 3 · So sánh 2 bức tranh (45s/câu)";
                  return "Part 4 · Thuyết trình chủ đề (Chuẩn bị 1p · Nói 2p)";
                })();

                const targetUrl = `/speaking/${exam.id}${tabInfo.partQuery}`;
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
                    subtitle={displaySubtitle}
                    partBadge={tabInfo.badge}
                    isFree={exam.isFree}
                    isProOrAdmin={isProOrAdmin}
                    cloverLevel={exam.hotLevel}
                    extraBadge={
                      activeTab === "p2" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] border border-emerald-500/30">
                          ☘️ Tranh trọng điểm Part 2
                        </span>
                      ) : undefined
                    }
                    trophyText={trophy}
                    status={exam.status}
                    completedParts={exam.completedParts}
                    totalParts={exam.totalParts || 4}
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
        initialSkill="speaking"
        onStartPractice={(_s, pIdx) => {
          const tabKey = (`p${pIdx + 1}` as "p1" | "p2" | "p3" | "p4");
          setActiveTab(tabKey);
        }}
      />
    </div>
  );
}
