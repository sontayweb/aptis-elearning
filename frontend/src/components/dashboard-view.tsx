"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Navbar } from "@/components/navbar";
import { HeroBanner } from "@/components/hero-banner";
import { SkillQuickLaunchGrid } from "@/components/skill-quick-launch-grid";
import { WeeklyScheduleCard } from "@/components/weekly-schedule-card";
import { WeeklyStreakCard } from "@/components/weekly-streak-card";
import { CourseClassBanner } from "@/components/course-class-banner";
import { StudentFeedbackCarousel } from "@/components/student-feedback-carousel";
import { TimelineProgressChart } from "@/components/progress-chart";
import { TipsSection } from "@/components/tips-section";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";

interface DashboardViewProps {
  user: any;
}

export function DashboardView({ user }: DashboardViewProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        setLoading(true);
        const res = await api.student.getDashboardStats();
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu dashboard:", err);
      } finally {
        setLoading(false);
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
      <main className="flex-1 pt-[calc(var(--navbar-total-height,64px)+16px)] sm:pt-[calc(var(--navbar-total-height,64px)+22px)] md:pt-[calc(var(--navbar-total-height,64px)+28px)] pb-24 md:pb-20 transition-all duration-300">
        <div className="section-container px-3 sm:px-4 md:px-6">
          {/* Main 2-Column Grid Architecture (Main Stream 70% vs Sidebar 30%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            {/* CỘT CHÍNH - MAIN CONTENT (8 Cols ~ 67%) */}
            <div className="lg:col-span-8 space-y-5 sm:space-y-6">
              {/* 1. Hero Cockpit (Bảo tồn Event Theme Canvas + Thẻ Goal Cockpit) */}
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

              {/* 2. Luyện tập theo kỹ năng (5 Thẻ Kỹ Năng 1-Click) */}
              <SkillQuickLaunchGrid skills={stats?.skillProgress} />

              {/* 3 & 4. Cặp đôi: Lộ trình học tuần này + Chuỗi học tập */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <WeeklyScheduleCard
                  activeDays={stats?.weeklyStreak?.days}
                  practiceRoute={
                    stats?.weakestSkill?.route ||
                    stats?.todayRecommendation?.practiceRoute ||
                    "/thi-thu"
                  }
                />
                <WeeklyStreakCard
                  currentStreak={stats?.weeklyStreak?.currentStreak ?? stats?.streak ?? 0}
                  completedThisWeek={stats?.weeklyStreak?.completedThisWeek ?? 0}
                  totalDays={7}
                  activeDays={stats?.weeklyStreak?.days}
                  practiceRoute={
                    stats?.weakestSkill?.route ||
                    stats?.todayRecommendation?.practiceRoute ||
                    "/thi-thu"
                  }
                />
              </div>

              {/* 5. Khai giảng lớp online APTIS ESOL B2 (Component Mới 1) */}
              <CourseClassBanner />

              {/* 6. Kết quả & Feedback học viên (Component Mới 2) */}
              <StudentFeedbackCarousel />

              {/* 7. Biểu đồ tiến độ làm bài theo thời gian (% Chính xác) */}
              <TimelineProgressChart data={stats?.timelineProgress} />

              {/* 8. Cẩm nang & Mẹo thi Aptis ESOL chuẩn British Council */}
              <TipsSection />
            </div>

            {/* CỘT PHỤ - SIDEBAR (4 Cols ~ 33%) */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-[calc(var(--navbar-total-height,64px)+28px)]">
                <DashboardSidebar recommendation={stats?.todayRecommendation} />
              </div>
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
