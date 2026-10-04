"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import Link from "next/link";
import { History, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { HeroBanner } from "@/components/hero-banner";
import { RoadmapBanner } from "@/components/roadmap-banner";
import { StartRightCard } from "@/components/start-right-card";
import { TodayRecommendationCard } from "@/components/today-recommendation-card";
import { VoucherCard } from "@/components/voucher-card";
import { UpgradeProBanner } from "@/components/upgrade-pro-banner";
import { WeeklyStreakCard } from "@/components/weekly-streak-card";
import { SkillProgressCard } from "@/components/skill-progress-card";
import { TimelineProgressChart } from "@/components/progress-chart";
import { TipsSection } from "@/components/tips-section";
import { ReferralGiftCard } from "@/components/referral-gift-card";
import { SpeedupSpeakingCard } from "@/components/speedup-speaking-card";
import { HistoryEmptyCard } from "@/components/history-empty-card";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { MobileAppLauncher } from "@/components/mobile-app-launcher";

interface DashboardViewProps {
  user: any;
}

export function DashboardView({ user }: DashboardViewProps) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        const res = await api.student.getDashboardStats();
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu dashboard:", err);
      }
    }
    loadDashboardStats();
  }, [user]);

  const planName = user?.user_subscriptions?.length
    ? user.user_subscriptions[0].plan.name
    : "Miễn phí";

  const aiRemaining = user?.ai_quotas
    ? user.ai_quotas.total_quota - user.ai_quotas.used_quota
    : 3;
  const aiTotal = user?.ai_quotas ? user.ai_quotas.total_quota : 3;

  const skillsCoveredCount = stats?.skillProgress
    ? stats.skillProgress.filter((s: any) => s.completedExams > 0).length
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 pt-[calc(var(--navbar-total-height,64px)+20px)] sm:pt-[calc(var(--navbar-total-height,64px)+26px)] md:pt-[calc(var(--navbar-total-height,64px)+32px)] pb-28 md:pb-20 transition-all duration-300">
        <div className="section-container space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-6">
          {/* 1. Hero Greeting Banner (Đồng bộ nguyên khối gồm Header + 6 Thẻ Metric) */}
          <HeroBanner
            displayName={user?.full_name || "Thí sinh Aptis"}
            skillsCovered={skillsCoveredCount}
            streak={stats?.streak ?? 0}
            totalQuestions={stats?.totalQuestionsAnswered ?? 0}
            accuracy={stats?.accuracyPercent ?? 0}
            currentLevel={stats?.currentLevel || "Chưa thi"}
            aiCreditsRemaining={aiRemaining}
            aiCreditsTotal={aiTotal}
            planName={planName}
          />

          {/* 1.1. Mobile WebApp App Launcher (Cụm phím tắt luyện nhanh 8 kỹ năng chuẩn di động) */}
          <MobileAppLauncher />

          {/* 2. Newbie Road-map / Guide Banner */}
          <RoadmapBanner />

          {/* 4. Start Right Way Action Card */}
          <StartRightCard />

          {/* 4.1. Today's Recommended Action (⚡ Hôm nay nên làm) */}
          <TodayRecommendationCard data={stats?.todayRecommendation} />

          {/* 5. Voucher / Promo Code Card */}
          <VoucherCard />

          {/* 6. Upgrade Pro Banner */}
          <UpgradeProBanner />

          {/* 7. Main Dashboard 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left 2 Cols: Streak Meter + Skill Progress + Timeline Chart */}
            <div className="lg:col-span-2 space-y-6">
              <WeeklyStreakCard
                currentStreak={stats?.weeklyStreak?.currentStreak ?? 0}
                completedThisWeek={stats?.weeklyStreak?.completedThisWeek ?? 0}
                totalDays={7}
                activeDays={stats?.weeklyStreak?.days}
                practiceRoute={stats?.weakestSkill?.route || stats?.todayRecommendation?.practiceRoute || "/thi-thu"}
              />
              <SkillProgressCard
                skills={stats?.skillProgress}
                weakestSkill={stats?.weakestSkill}
              />
              <TimelineProgressChart data={stats?.timelineProgress} />
            </div>

            {/* Right 1 Col: Blog Tips + Referral + Speedup Speaking + History */}
            <div className="space-y-6">
              <TipsSection />
              <ReferralGiftCard />
              <SpeedupSpeakingCard />
              {stats?.recentTests && stats.recentTests.length > 0 ? (
                <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <History className="w-4 h-4" />
                      </div>
                      <h2 className="font-heading font-bold text-foreground">Lịch sử làm bài</h2>
                    </div>
                    <Link
                      href="/history"
                      className="text-xs font-bold text-primary hover:text-primary-glow inline-flex items-center gap-1"
                    >
                      <span>Tất cả</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {stats.recentTests.slice(0, 4).map((test: any) => {
                      const getLink = () => {
                        const sk = (test.skill || "").toLowerCase();
                        if (sk.includes("speaking")) return `/speaking/${test.examId}`;
                        if (sk.includes("writing")) return `/writing/${test.examId}`;
                        if (sk.includes("reading")) return `/reading/${test.examId}`;
                        if (sk.includes("listening")) return `/listening/${test.examId}`;
                        if (sk.includes("full")) return `/thi-thu/${test.examId}`;
                        return `/grammar/${test.examId}`;
                      };
                      return (
                        <Link
                          key={test.id}
                          href={getLink()}
                          className="block p-3 rounded-xl bg-muted/30 border border-border/60 hover:border-primary/40 hover:bg-muted/50 transition-all"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                              {test.skill}
                            </span>
                            <span className="text-xs font-bold text-primary">
                              {test.score} ({test.band})
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-foreground line-clamp-1">
                            {test.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground mt-0.5 block">
                            {test.date}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <HistoryEmptyCard />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Action Buttons */}
      <FloatingActions />
    </div>
  );
}
