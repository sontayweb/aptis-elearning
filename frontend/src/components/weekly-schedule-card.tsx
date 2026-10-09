"use client";

import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  PlayCircle,
  Circle,
  ArrowRight,
} from "lucide-react";

interface WeeklyScheduleCardProps {
  activeDays?: boolean[];
  practiceRoute?: string;
}

export function WeeklyScheduleCard({
  activeDays,
  practiceRoute = "/thi-thu",
}: WeeklyScheduleCardProps) {
  const now = new Date();
  const currentDayOfWeek = (now.getDay() + 6) % 7; // 0 = T2 ... 6 = CN

  // Generate 7 days for the current week starting from Monday
  const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const weekDates = dayNames.map((name, i) => {
    const diff = i - currentDayOfWeek;
    const dateObj = new Date(now.getTime() + diff * 24 * 60 * 60 * 1000);
    const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
    const isCompleted = activeDays ? !!activeDays[i] : false;
    const isToday = i === currentDayOfWeek;
    const isPast = i < currentDayOfWeek;

    return {
      name,
      dateStr,
      isCompleted,
      isToday,
      isPast,
    };
  });

  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 sm:p-5 md:p-6 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-black text-sm sm:text-base text-foreground tracking-tight">
              Lộ trình học tuần này
            </h3>
          </div>

          <Link
            href="/progress"
            className="text-xs font-bold text-primary hover:text-primary-glow inline-flex items-center gap-1"
          >
            <span>Xem lịch chi tiết</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center py-2">
          {weekDates.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <span
                className={`text-xs font-bold ${
                  day.isToday ? "text-rose-500 font-black" : "text-foreground/80"
                }`}
              >
                {day.name}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                {day.dateStr}
              </span>

              {/* Status Indicator */}
              <div className="mt-1 flex items-center justify-center">
                {day.isCompleted ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shadow-2xs">
                    <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-white" />
                  </div>
                ) : day.isToday ? (
                  <Link
                    href={practiceRoute}
                    className="w-8 h-8 rounded-full bg-rose-500/15 text-rose-600 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-transform hover:scale-110 shadow-glow-soft cursor-pointer animate-pulse"
                    title="Hôm nay - Nhấn để luyện bài ngay"
                  >
                    <PlayCircle className="w-5 h-5 fill-rose-500 text-white" />
                  </Link>
                ) : (
                  <div className="w-8 h-8 rounded-full border border-border/80 bg-muted/20 flex items-center justify-center text-muted-foreground/40">
                    <Circle className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
        <span>Luyện 1 bài mỗi ngày để tích lũy tiến độ</span>
        <Link
          href={practiceRoute}
          className="font-bold text-primary hover:underline"
        >
          Luyện hôm nay →
        </Link>
      </div>
    </div>
  );
}
