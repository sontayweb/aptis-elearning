"use client";

import { Flame } from "lucide-react";

interface WeeklyStreakCardProps {
  currentStreak?: number;
  completedThisWeek?: number;
  totalDays?: number;
  activeDays?: boolean[];
}

export function WeeklyStreakCard({
  currentStreak = 0,
  completedThisWeek = 0,
  totalDays = 7,
  activeDays,
}: WeeklyStreakCardProps) {
  // Radius 55 -> Circumference = 2 * Math.PI * 55 ≈ 345.575
  const circumference = 2 * Math.PI * 55;
  const progressRatio = completedThisWeek / totalDays;
  const dashOffset = circumference * (1 - progressRatio);

  const todayIdx = (new Date().getDay() + 6) % 7; // 0 = T2 ... 6 = CN
  const days = [
    { label: "T2", isToday: todayIdx === 0, completed: activeDays ? !!activeDays[0] : false },
    { label: "T3", isToday: todayIdx === 1, completed: activeDays ? !!activeDays[1] : false },
    { label: "T4", isToday: todayIdx === 2, completed: activeDays ? !!activeDays[2] : false },
    { label: "T5", isToday: todayIdx === 3, completed: activeDays ? !!activeDays[3] : false },
    { label: "T6", isToday: todayIdx === 4, completed: activeDays ? !!activeDays[4] : false },
    { label: "T7", isToday: todayIdx === 5, completed: activeDays ? !!activeDays[5] : false },
    { label: "CN", isToday: todayIdx === 6, completed: activeDays ? !!activeDays[6] : false },
  ];

  return (
    <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-md tech-card hover:border-primary/50 hover:shadow-glow-red p-4 sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-60"
        style={{ background: "var(--gradient-radial-red)" }}
      />
      <div className="relative">
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          {/* Circular Meter */}
          <div className="shrink-0">
            <div
              className="relative flex items-center justify-center"
              style={{ width: "120px", height: "120px" }}
            >
              <svg width="120" height="120" className="-rotate-90">
                <defs>
                  <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" />
                  </linearGradient>
                </defs>
                <circle
                  cx="60"
                  cy="60"
                  r="55"
                  stroke="hsl(var(--border))"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="55"
                  stroke="url(#ring-grad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{
                    transition: "stroke-dashoffset 1s ease-out",
                    filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.5))",
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-heading font-extrabold text-foreground leading-none">
                  {completedThisWeek}/{totalDays}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                  Tuần này
                </div>
              </div>
            </div>
          </div>

          {/* Streak Details & Days */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-6 h-6 text-primary fill-primary/20" />
              <h2 className="font-heading font-extrabold text-lg text-foreground">
                Chuỗi {currentStreak} ngày
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Tiếp tục học hôm nay để duy trì streak.
            </p>
            <div className="flex gap-1.5">
              {days.map((day) => (
                <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[10px] text-muted-foreground">{day.label}</div>
                  <div
                    className={`w-full h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                      day.isToday
                        ? "bg-primary/15 border border-primary/50 text-primary animate-glow-pulse"
                        : "bg-muted/40 text-muted-foreground/60"
                    }`}
                  >
                    {day.isToday ? "•" : "·"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
