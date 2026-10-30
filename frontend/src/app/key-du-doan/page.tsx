"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import {
  Sparkles,
  Flame,
  Lock,
  Unlock,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Search,
  AlertCircle,
  PlayCircle,
  RotateCcw,
  Crown,
} from "lucide-react";

interface KeySet {
  id: string;
  code: string;
  title: string;
  rawSkill: string;
  skillLabel: string;
  updateDate: string;
  matchRate: string;
  cloverLevel: number;
  forecastTag?: string | null;
  topicsCount: number;
  partsCount: number;
  durationMinutes: number;
  isFree: boolean;
  isUnlocked: boolean;
  hotTopic: string;
  userStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  bestScore: string | null;
  bestCefr: string | null;
  userAttempts: number;
}

function mapSkillLabel(skill?: string): string {
  switch (skill) {
    case "SPEAKING":
      return "Speaking";
    case "WRITING":
      return "Writing";
    case "READING":
      return "Reading";
    case "LISTENING":
      return "Listening";
    case "GRAMMAR_VOCABULARY":
      return "Grammar & Vocab";
    case "FULL_TEST":
      return "Full Test";
    default:
      return skill || "Aptis";
  }
}

function getKeyExamHref(rawSkill: string, examId: string): string {
  switch (rawSkill) {
    case "SPEAKING":
      return `/speaking/${examId}`;
    case "WRITING":
      return `/writing/${examId}`;
    case "READING":
      return `/reading/${examId}`;
    case "LISTENING":
      return `/listening/${examId}`;
    case "GRAMMAR_VOCABULARY":
      return `/grammar/${examId}`;
    case "FULL_TEST":
    default:
      return `/thi-thu/${examId}`;
  }
}

export default function KeyDuDoanPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("ALL");
  const [cloverFilter, setCloverFilter] = useState<number | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [keySets, setKeySets] = useState<KeySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userHasPro = Boolean(
    user &&
      (user.role === "SUPER_ADMIN" ||
        user.role === "ADMIN" ||
        user.role === "TEACHER" ||
        (user.subscription?.code && user.subscription.code !== "FREE"))
  );

  const loadKeyExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getAll({ source: "KEY", limit: 200 });
      if (res.success && Array.isArray(res.data)) {
        const dynamicSets: KeySet[] = res.data
          .filter((exam: any) => (exam.hotLevel ?? exam.hot_level ?? 0) > 0 || exam.source === "KEY")
          .map((exam: any) => {
            const lvl = Math.min(5, Math.max(1, Number(exam.hotLevel ?? exam.hot_level ?? 1)));
            const isFree = !exam.isPro;
            const hasAccess = isFree || userHasPro || Boolean(exam.hasProAccess);
            const createdDate = exam.createdAt
              ? new Date(exam.createdAt).toLocaleDateString("vi-VN")
              : "Cập nhật mới";

            return {
              id: exam.id,
              code: exam.code || `KEY-${exam.id.slice(0, 6).toUpperCase()}`,
              title: exam.title,
              rawSkill: exam.skill || "FULL_TEST",
              skillLabel: mapSkillLabel(exam.skill),
              updateDate: createdDate,
              matchRate: "☘️".repeat(lvl),
              cloverLevel: lvl,
              forecastTag: exam.forecastTag ?? exam.forecast_tag ?? null,
              topicsCount: exam.totalQuestions || 0,
              partsCount: exam.totalParts || 1,
              durationMinutes: exam.durationMinutes || 45,
              isFree,
              isUnlocked: hasAccess,
              hotTopic:
                exam.description ||
                exam.forecastTag ||
                "Bộ đề trọng tâm có tần suất xuất hiện cao trong các ca thi gần nhất tại Hội đồng thi British Council.",
              userStatus: exam.userStatus || "NOT_STARTED",
              bestScore: exam.bestScore || null,
              bestCefr: exam.bestCefr || null,
              userAttempts: exam.userAttempts || 0,
            };
          })
          .sort((a: KeySet, b: KeySet) => b.cloverLevel - a.cloverLevel);

        setKeySets(dynamicSets);
      } else {
        setKeySets([]);
      }
    } catch (err: any) {
      console.warn("Failed to load key exams:", err);
      setError("Không thể tải danh sách đề Key dự đoán từ máy chủ.");
      setKeySets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeyExams();
  }, [userHasPro]);

  const filteredSets = keySets.filter((ks) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      ks.title.toLowerCase().includes(q) ||
      ks.hotTopic.toLowerCase().includes(q) ||
      ks.code.toLowerCase().includes(q);
    const matchesSkill = activeTab === "ALL" ? true : ks.rawSkill === activeTab;
    const matchesClover = cloverFilter === "ALL" ? true : ks.cloverLevel === cloverFilter;
    return matchesSearch && matchesSkill && matchesClover;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-[var(--navbar-total-height,64px)] transition-all duration-300">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-transparent border-b border-border">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full blur-3xl animate-breathing -top-32 -right-24"
            style={{ width: "450px", height: "450px", background: "hsl(var(--primary) / 0.4)" }}
          />

          <div className="section-container py-12 md:py-16 relative z-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white w-fit text-xs font-bold mb-4 shadow-sm shadow-blue-500/20">
                <Flame className="w-4 h-4" />
                <span>Cập nhật liên tục theo từng ca thi thật</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-foreground mb-4">
                Đề Key Dự Đoán Aptis ☘️
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Ngân hàng đề thi trọng tâm được gắn nhãn độ Hot (từ 1☘️ đến 5☘️) tổng hợp trực tiếp từ các ca thi gần nhất tại Hội đồng thi British Council (BC). Giúp bạn ôn đúng trọng tâm và làm bài trực tiếp ngay trên hệ thống.
              </p>
            </div>
          </div>
        </section>

        {/* Highlight Banner */}
        <section className="section-container pt-8">
          <div className="rounded-2xl border border-primary/30 bg-card p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base md:text-lg text-foreground">
                  Ưu tiên luyện trước các đề từ 4☘️ đến 5☘️
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Các bộ đề Speaking, Writing, Reading và Listening có số lượng cỏ ☘️ càng cao thì tần suất gặp lại trong đợt thi hiện tại càng lớn.
                </p>
              </div>
            </div>

            {!userHasPro && (
              <Link
                href="/bang-gia"
                className="tech-btn px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shrink-0 shadow-md transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Mở khóa toàn bộ Kho Key VIP</span>
              </Link>
            )}
          </div>
        </section>

        {/* Skill Filter Tabs & Search */}
        <section className="section-container pt-8">
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                {[
                  { id: "ALL", label: `Tất cả (${keySets.length})` },
                  { id: "SPEAKING", label: "🎙️ Speaking" },
                  { id: "WRITING", label: "✏️ Writing" },
                  { id: "READING", label: "📖 Reading" },
                  { id: "LISTENING", label: "🔊 Listening" },
                  { id: "FULL_TEST", label: "🔥 Full Test" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/70 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm tên đề hoặc chủ đề Key..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-card text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            {/* Clover Hot Level Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-muted-foreground mr-1">Lọc theo độ Hot:</span>
              {[
                { val: "ALL" as const, label: "Tất cả mức Cỏ" },
                { val: 5 as const, label: "☘️☘️☘️☘️☘️ 5 Cỏ" },
                { val: 4 as const, label: "☘️☘️☘️☘️ 4 Cỏ" },
                { val: 3 as const, label: "☘️☘️☘️ 3 Cỏ" },
                { val: 2 as const, label: "☘️☘️ 2 Cỏ" },
                { val: 1 as const, label: "☘️ 1 Cỏ" },
              ].map((c) => (
                <button
                  key={String(c.val)}
                  type="button"
                  onClick={() => setCloverFilter(c.val)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    cloverFilter === c.val
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-card text-muted-foreground border-border hover:border-emerald-500/50 hover:text-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Key Sets Grid */}
        <section className="section-container py-4 md:py-8">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Đang tải bộ đề Key dự đoán từ hệ thống...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Chưa thể tải dữ liệu thực tế</p>
                  <p className="text-xs opacity-90">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadKeyExams}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90 shrink-0"
              >
                Thử lại
              </button>
            </div>
          ) : filteredSets.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-border rounded-2xl bg-card/50">
              <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h3 className="font-heading font-bold text-base text-foreground">Không tìm thấy bộ đề Key nào</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Chưa có bộ đề Key dự đoán nào khớp với bộ lọc hiện tại.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSets.map((ks) => {
                const targetHref = getKeyExamHref(ks.rawSkill, ks.id);
                return (
                  <div
                    key={ks.id}
                    className={`rounded-2xl border bg-card p-6 shadow-sm transition-all flex flex-col justify-between hover:shadow-glow-soft ${
                      ks.cloverLevel >= 4
                        ? "border-emerald-500/50 bg-gradient-to-b from-emerald-500/5 via-card to-card hover:border-emerald-500"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-primary/10 text-primary">
                            {ks.skillLabel}
                          </span>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            {ks.matchRate}
                          </span>
                          {ks.isFree ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                              MIỄN PHÍ
                            </span>
                          ) : ks.isUnlocked ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white">
                              <Crown className="w-2.5 h-2.5" />
                              <span>VIP PRO · ĐÃ MỞ</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/30">
                              <Lock className="w-2.5 h-2.5" />
                              <span>VIP PRO</span>
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono shrink-0">
                          <Calendar className="w-3.5 h-3.5" />
                          {ks.updateDate}
                        </span>
                      </div>

                      <h3 className="font-heading font-bold text-lg text-foreground mb-2">
                        {ks.title}
                      </h3>

                      <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs mb-4">
                        <span className="font-bold text-muted-foreground block mb-0.5">
                          Trọng tâm đề Key:
                        </span>
                        <span className="text-foreground font-semibold">{ks.hotTopic}</span>
                      </div>

                      {ks.userStatus === "IN_PROGRESS" && (
                        <div className="mb-4 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5">
                            <PlayCircle className="w-3.5 h-3.5 text-amber-500" />
                            <span>Đang có bài làm dở</span>
                          </span>
                          <span className="text-[11px] opacity-85">Tự động khôi phục</span>
                        </div>
                      )}

                      {ks.userStatus === "COMPLETED" && (
                        <div className="mb-4 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Đã hoàn thành ({ks.userAttempts} lần)</span>
                          </span>
                          {ks.bestScore && (
                            <span>
                              Điểm cao nhất: <strong>{ks.bestScore}</strong>
                              {ks.bestCefr ? ` · Band ${ks.bestCefr}` : ""}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {ks.partsCount} Parts · {ks.topicsCount} câu hỏi · {ks.durationMinutes} phút
                      </span>

                      {ks.isUnlocked ? (
                        <Link
                          href={targetHref}
                          className="tech-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown text-xs font-bold shadow-sm transition-all"
                        >
                          {ks.userStatus === "IN_PROGRESS" ? (
                            <>
                              <PlayCircle className="w-3.5 h-3.5" />
                              <span>Tiếp tục làm</span>
                            </>
                          ) : ks.userStatus === "COMPLETED" ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Luyện lại đề Key</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Vào luyện đề Key</span>
                            </>
                          )}
                        </Link>
                      ) : (
                        <Link
                          href="/bang-gia"
                          className="tech-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-primary text-primary hover:bg-primary/10 text-xs font-bold transition-all"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Mở khóa VIP</span>
                        </Link>
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
