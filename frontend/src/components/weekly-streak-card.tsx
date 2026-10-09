"use client";

import Link from "next/link";
import { Flame, ArrowRight, Target, Crown } from "lucide-react";

interface WeeklyStreakCardProps {
  currentStreak?: number;
  completedThisWeek?: number;
  totalDays?: number;
  activeDays?: boolean[];
  practiceRoute?: string;
}

export function WeeklyStreakCard({
  currentStreak = 0,
  activeDays,
  practiceRoute = "/thi-thu",
}: WeeklyStreakCardProps) {
  const todayIdx = (new Date().getDay() + 6) % 7; // 0 = T2 ... 6 = CN
  const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const days = dayLabels.map((label, idx) => ({
    label,
    isToday: idx === todayIdx,
    completed: activeDays ? !!activeDays[idx] : false,
  }));

  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 sm:p-5 md:p-6 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-rose-500/30" />
            </div>
            <h3 className="font-heading font-black text-sm sm:text-base text-foreground tracking-tight">
              Chuỗi học tập
            </h3>
          </div>

          <Link
            href="/progress"
            className="text-xs font-bold text-primary hover:text-primary-glow inline-flex items-center gap-1"
          >
            <span>Xem chi tiết</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Big Streak Number & 7 Day Bubbles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-heading font-black text-rose-600 dark:text-rose-400 leading-none">
              {currentStreak}
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-black text-foreground uppercase tracking-tight">
                ngày
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">
                liên tiếp
              </span>
            </div>
          </div>

          {/* 7 Days Bubbles + Crown */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar">
            {days.map((day) => (
              <div key={day.label} className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-muted-foreground">
                  {day.label}
                </span>
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    day.completed
                      ? "bg-rose-500 text-white shadow-2xs"
                      : day.isToday
                      ? "border-2 border-rose-500 bg-rose-500/10 text-rose-600 animate-pulse"
                      : "border border-border/80 bg-muted/30 text-muted-foreground/40"
                  }`}
                  title={`${day.label}: ${
                    day.completed ? "Đã học" : day.isToday ? "Hôm nay" : "Chưa học"
                  }`}
                >
                  {day.completed ? "✓" : ""}
                </div>
              </div>
            ))}

            {/* Sunday Crown */}
            <div className="flex flex-col items-center gap-1 pl-1">
              <span className="text-[9px] font-bold text-amber-500">Mục tiêu</span>
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ${
                  currentStreak >= 7
                    ? "bg-amber-500 text-white shadow-glow-soft"
                    : "border border-amber-500/30 bg-amber-500/10 text-amber-500"
                }`}
                title="Chuỗi 7 ngày đạt danh hiệu"
              >
                <Crown className="w-3.5 h-3.5 fill-current" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtext Motivation */}
      <div className="mt-3 pt-3 border-t border-border/60 flex items-start gap-2">
        <Target className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground italic leading-relaxed">
          &ldquo;Hãy luyện ít nhất 1 bài mỗi ngày để giữ chuỗi và tạo thói quen học tập nhé!&rdquo;
        </p>
      </div>
    </div>
  );
}
