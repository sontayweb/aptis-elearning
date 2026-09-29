"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import {
  Target,
  Pencil,
  ChevronRight,
  Sparkles,
  Minus,
  Plus,
  X,
  CheckCircle2,
} from "lucide-react";

interface GoalTrackerProps {
  examDate?: string;
  aim?: string;
  dailyTarget?: number;
  todayCount?: number;
}

export function GoalTracker({
  examDate = "2026-10-15",
  aim = "B2",
  dailyTarget = 3,
  todayCount = 2,
}: GoalTrackerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAim, setCurrentAim] = useState(aim);
  const [currentDate, setCurrentDate] = useState(examDate);
  const [targetCount, setTargetCount] = useState(dailyTarget);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadGoal() {
      try {
        const res = await api.student.getGoal();
        if (res.success && res.data) {
          if (res.data.aim) setCurrentAim(res.data.aim);
          if (res.data.dailyTarget) setTargetCount(res.data.dailyTarget);
          if (res.data.examDate) setCurrentDate(res.data.examDate.slice(0, 10));
        }
      } catch (err) {
        console.warn("Using default goal props:", err);
      }
    }
    loadGoal();
  }, []);

  const handleSaveGoal = async () => {
    setIsSaving(true);
    try {
      await api.student.updateGoal({
        aim: currentAim,
        dailyTarget: targetCount,
        examDate: currentDate,
      });
    } catch (err) {
      console.error("Failed to save goal:", err);
    } finally {
      setIsSaving(false);
      setModalOpen(false);
    }
  };

  // Calculate days remaining
  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(currentDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const percent = Math.min(100, Math.round((todayCount / targetCount) * 100));
  const isDone = todayCount >= targetCount;
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  // Daily test suggestions
  const suggestions = [
    {
      skillLabel: "Reading",
      partLabel: "Part 3",
      title: "Đề dự đoán số 04 - Matching Headings",
      reason: "Kỹ năng cần cải thiện (B1)",
      route: "/reading?set=4",
    },
    {
      skillLabel: "Listening",
      partLabel: "Part 2",
      title: "Audio Talk: Short Monologues",
      reason: "Đề mới cập nhật tuần này",
      route: "/listening?set=8",
    },
    {
      skillLabel: "Speaking",
      partLabel: "Part 1 & 2",
      title: "Describe picture & Comparison (AI Chấm)",
      reason: "Chỉ tiêu ôn luyện Speaking hôm nay",
      route: "/speaking?set=2",
    },
  ];

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-heading font-extrabold text-base md:text-lg text-foreground flex items-center gap-2">
                <span>🎯</span>
                <span>
                  Còn <strong className="text-primary">{daysRemaining} ngày</strong> tới ngày thi · Aim{" "}
                  <strong className="text-accent">{currentAim}</strong>
                </span>
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                Hôm nay: <strong className="text-foreground">{todayCount}/{targetCount} bài</strong>
                {isDone && (
                  <span className="text-success font-semibold"> · Xong chỉ tiêu hôm nay 🎉</span>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Chỉnh sửa</span>
            </button>
          </div>

          {/* Progress Circular & Suggestions */}
          <div className="flex flex-col gap-4">
            {/* Circular progress with quick stats */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border border-border/60">
              <div className="relative w-16 h-16 shrink-0">
                <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    className="stroke-muted"
                    strokeWidth="5"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    className={isDone ? "stroke-success" : "stroke-primary"}
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-black">
                  <span>{percent}%</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-foreground">
                  Tiến độ hôm nay
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Đã hoàn thành <strong className="text-foreground">{todayCount}/{targetCount}</strong> bài luyện
                </div>
              </div>
            </div>

            {/* Suggestions list */}
            <div className="w-full rounded-xl border border-dashed border-border bg-muted/20 p-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Gợi ý đề hôm nay dành riêng cho bạn</span>
              </div>
              <div className="space-y-2">
                {suggestions.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.route}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-background/90 px-3 py-2 hover:border-primary/60 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-muted-foreground">
                        {item.skillLabel} · {item.partLabel}
                      </div>
                      <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-primary mt-0.5 font-medium">
                        {item.reason}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-md text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-heading font-extrabold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> Mục tiêu của bạn
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Chọn ngày thi, band mục tiêu và số bài luyện mỗi ngày.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Ngày thi dự kiến
                </label>
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Band mục tiêu (Aim)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["B1", "B2", "C1"].map((band) => (
                    <button
                      key={band}
                      type="button"
                      onClick={() => setCurrentAim(band)}
                      className={`py-2 rounded-lg text-sm font-bold border transition-colors ${
                        currentAim === band
                          ? "bg-primary text-white border-primary"
                          : "border-border hover:bg-muted text-foreground"
                      }`}
                    >
                      {band}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Số bài luyện mỗi ngày
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetCount(Math.max(1, targetCount - 1))}
                    className="p-2 rounded-lg border border-border hover:bg-muted text-foreground"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-xl font-heading font-extrabold">
                    {targetCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTargetCount(targetCount + 1)}
                    className="p-2 rounded-lg border border-border hover:bg-muted text-foreground"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveGoal}
              disabled={isSaving}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? "Đang lưu..." : "Lưu mục tiêu"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
