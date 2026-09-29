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
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Search,
  AlertCircle,
} from "lucide-react";

interface KeySet {
  id: string;
  title: string;
  skill: string;
  updateDate: string;
  matchRate: string;
  topicsCount: number;
  isUnlocked: boolean;
  hotTopic: string;
  examId?: string;
}

export default function KeyDuDoanPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [keySets, setKeySets] = useState<KeySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isVipUser = Boolean(user?.user_subscriptions?.some((s: any) => s.is_active));

  const loadKeyExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getAll({ source: "KEY", limit: 20 });
      if (res.success && Array.isArray(res.data)) {
        const dynamicSets = res.data.map((exam: any) => ({
          id: exam.id,
          title: exam.title,
          skill: exam.skill === "FULL_TEST" ? "Tổng hợp" : (exam.skill || "Key"),
          updateDate: "Cập nhật mới",
          matchRate: "85% trúng tủ",
          topicsCount: exam.totalQuestions || 10,
          isUnlocked: isVipUser || !exam.isPro,
          hotTopic: exam.description || "Chủ đề trọng tâm đợt thi này",
          examId: exam.id,
        }));
        setKeySets(dynamicSets);
      } else {
        setError(res.error?.message || "Không thể tải danh sách bộ đề Key từ máy chủ (Vui lòng kiểm tra CSDL).");
        setKeySets([]);
      }
    } catch (err: any) {
      console.error("Failed to load key exams:", err);
      setError("Không thể kết nối đến máy chủ hoặc cơ sở dữ liệu chưa sẵn sàng.");
      setKeySets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeyExams();
  }, [isVipUser]);

  const filteredSets = keySets.filter((ks) => {
    const matchesSearch =
      ks.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ks.hotTopic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill =
      activeTab === "all" ? true : ks.skill.toLowerCase() === activeTab.toLowerCase();
    return matchesSearch && matchesSkill;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-transparent border-b border-border">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full blur-3xl animate-breathing -top-32 -right-24"
            style={{ width: "450px", height: "450px", background: "hsl(var(--primary) / 0.4)" }}
          />

          <div className="section-container py-12 md:py-16 relative z-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#CC1C01] to-[#FEAD5F] text-white w-fit text-xs font-bold mb-4 shadow-sm">
                <Flame className="w-4 h-4" />
                <span>Cập nhật liên tục 24/7 theo từng ca thi thật</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-foreground mb-4">
                Đề Key Dự Đoán Aptis
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Ngân hàng đề thi trọng tâm được tổng hợp trực tiếp từ review của các học viên vừa thi tại Hội đồng thi British Council (BC) Hà Nội, TP.HCM &amp; Đà Nẵng. Giúp bạn ôn trọng tâm, tiết kiệm 70% thời gian học.
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
                  Tỷ lệ trúng tủ trung bình đạt trên 85%
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Đặc biệt các chủ đề Speaking Part 2 - 4 và bài viết Writing Part 4 có độ lặp lại rất cao giữa các đợt thi.
                </p>
              </div>
            </div>

            <Link
              href="/pricing"
              className="tech-btn px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shrink-0 shadow-md transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Mở khóa toàn bộ Kho Key VIP</span>
            </Link>
          </div>
        </section>

        {/* Skill Filter Tabs & Search */}
        <section className="section-container pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              {[
                { id: "all", label: "Tất cả" },
                { id: "speaking", label: "Speaking" },
                { id: "writing", label: "Writing" },
                { id: "reading", label: "Reading" },
                { id: "listening", label: "Listening" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm chủ đề đề Key..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-card text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
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
              <h3 className="font-heading font-bold text-base text-foreground">Không có bộ đề Key nào</h3>
              <p className="text-xs text-muted-foreground mt-1">Cơ sở dữ liệu hiện tại chưa có bộ đề Key dự đoán nào trong danh mục này.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSets.map((ks) => (
                <div
                  key={ks.id}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-primary/50 hover:shadow-glow-soft transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-primary/10 text-primary">
                          {ks.skill}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          {ks.matchRate}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        {ks.updateDate}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-lg text-foreground mb-2">
                      {ks.title}
                    </h3>

                    <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs mb-4">
                      <span className="font-bold text-muted-foreground block mb-0.5">
                        Chủ đề tiêu biểu xuất hiện gần đây:
                      </span>
                      <span className="text-foreground font-semibold">{ks.hotTopic}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Gồm {ks.topicsCount} câu hỏi / bài mẫu Band C
                    </span>

                    {ks.isUnlocked ? (
                      <Link
                        href={ks.skill.toLowerCase() === "speaking" ? "/speaking" : ks.skill.toLowerCase() === "writing" ? "/writing" : "/thi-thu"}
                        className="tech-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown text-xs font-bold shadow-sm transition-all"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Xem ngay</span>
                      </Link>
                    ) : (
                      <Link
                        href="/pricing"
                        className="tech-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-primary text-primary hover:bg-primary/10 text-xs font-bold transition-all"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Mở khóa VIP</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}
