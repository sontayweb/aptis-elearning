"use client";

import React from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Award,
  Loader2,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Eye,
  Menu,
  ArrowUp,
  Flag,
  Send,
  X,
} from "lucide-react";
import type { ReadingExamData } from "@/data/reading-benchmark";

export interface ReadingStageDef {
  stageKey: "p1" | "p2-1" | "p2-2" | "p3" | "p4";
  title: string;
  label: string;
}

interface ReadingReviewSidebarProps {
  resultScore: number;
  maxTotalScore: number;
  cefrBand: string;
  readingReviewStats: {
    totalCorrect: number;
    totalWrong: number;
    p1: { correctCount: number; totalCount: number; items: Array<{ id: string; label: string; isCorrect: boolean }> };
    p2: Array<{ correctCount: number; totalCount: number; items: Array<{ id: string; label: string; isCorrect: boolean }> }>;
    p3: { correctCount: number; totalCount: number; items: Array<{ id: string; label: string; isCorrect: boolean }> };
    p4: { correctCount: number; totalCount: number; items: Array<{ id: string; label: string; isCorrect: boolean }> };
  };
  reviewOnlyWrong: boolean;
  setReviewOnlyWrong: (val: boolean) => void;
  stages: ReadingStageDef[];
  activeStage: number;
  setActiveStage: (idx: number) => void;
  onShowScoreReport: () => void;
  onRestartExam: () => void;
  isRestarting: boolean;
  onBackToHistory: () => void;
}

export function ReadingReviewSidebar({
  resultScore,
  maxTotalScore,
  cefrBand,
  readingReviewStats,
  reviewOnlyWrong,
  setReviewOnlyWrong,
  stages,
  activeStage,
  setActiveStage,
  onShowScoreReport,
  onRestartExam,
  isRestarting,
  onBackToHistory,
}: ReadingReviewSidebarProps) {
  return (
    <aside className="lg:col-span-4">
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4 sticky top-20">
        {/* Header */}
        <div className="border-b border-border pb-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-heading font-black text-base text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Mục lục xem lại</span>
            </h3>
            <span className="text-xs font-mono font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              {resultScore}/{maxTotalScore} điểm
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {readingReviewStats.totalCorrect} đúng
              </span>
              <span>•</span>
              <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {readingReviewStats.totalWrong} sai
              </span>
            </div>
            <span className="font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10">
              Band {cefrBand}
            </span>
          </div>
        </div>

        {/* Filter Checkbox */}
        <div className="flex items-center justify-between bg-muted/40 p-2.5 rounded-xl border border-border/60">
          <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={reviewOnlyWrong}
              onChange={(e) => setReviewOnlyWrong(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary w-4 h-4"
            />
            <span>Chỉ hiện phần có câu sai</span>
          </label>
          {reviewOnlyWrong && (
            <span className="text-[11px] text-red-600 dark:text-red-400 font-bold">
              {readingReviewStats.totalWrong} câu sai
            </span>
          )}
        </div>

        {/* Danh sách các phần thi Reading */}
        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
          {stages.map((stg, stgIdx) => {
            const isCurrent = activeStage === stgIdx;
            let stgScore = 0;
            let stgTotal = 0;
            let questionPills: Array<{ id: string; label: string; isCorrect: boolean }> = [];

            if (stg.stageKey === "p1") {
              stgScore = readingReviewStats.p1.correctCount;
              stgTotal = readingReviewStats.p1.totalCount;
              questionPills = readingReviewStats.p1.items;
            } else if (stg.stageKey === "p2-1") {
              const st = readingReviewStats.p2[0];
              stgScore = st?.correctCount || 0;
              stgTotal = st?.totalCount || 4;
              questionPills = st?.items || [];
            } else if (stg.stageKey === "p2-2") {
              const st = readingReviewStats.p2[1];
              stgScore = st?.correctCount || 0;
              stgTotal = st?.totalCount || 4;
              questionPills = st?.items || [];
            } else if (stg.stageKey === "p3") {
              stgScore = readingReviewStats.p3.correctCount;
              stgTotal = readingReviewStats.p3.totalCount;
              questionPills = readingReviewStats.p3.items;
            } else if (stg.stageKey === "p4") {
              stgScore = readingReviewStats.p4.correctCount;
              stgTotal = readingReviewStats.p4.totalCount;
              questionPills = readingReviewStats.p4.items;
            }

            const isPerfect = stgScore === stgTotal && stgTotal > 0;
            if (reviewOnlyWrong && isPerfect) return null;

            return (
              <div
                key={stg.stageKey}
                onClick={() => {
                  setActiveStage(stgIdx);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-primary/10 border-primary ring-2 ring-primary/30 shadow-xs"
                    : "bg-muted/30 border-border hover:bg-muted/60"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={`font-bold ${isCurrent ? "text-primary" : "text-foreground"}`}>
                    {stg.title}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isPerfect
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                    }`}
                  >
                    {stgScore}/{stgTotal} câu đúng
                  </span>
                </div>

                {questionPills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {questionPills.map((q, qIdx) => (
                      <span
                        key={q.id || qIdx}
                        className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center border transition-all ${
                          q.isCorrect
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35"
                            : "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/35"
                        }`}
                        title={`${q.label}: ${q.isCorrect ? "Đúng" : "Sai"}`}
                      >
                        {qIdx + 1}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="border-t border-border pt-3 space-y-2">
          <button
            type="button"
            onClick={onShowScoreReport}
            className="w-full py-2.5 px-4 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>Xem báo cáo điểm tổng quan</span>
          </button>

          <button
            type="button"
            onClick={onRestartExam}
            disabled={isRestarting}
            className="w-full tech-btn py-2.5 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isRestarting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            <span>Làm lại đề này</span>
          </button>

          <button
            type="button"
            onClick={onBackToHistory}
            className="w-full py-2 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại lịch sử làm bài</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

interface ReadingBottomDockProps {
  stages: ReadingStageDef[];
  activeStage: number;
  setActiveStage: React.Dispatch<React.SetStateAction<number>>;
  flagged?: Record<number, boolean>;
  examData: ReadingExamData;
  p1Answers: Record<string, string>;
  p2Orders: Record<string, string[]>;
  p3Answers: Record<string, string>;
  p4Answers: Record<string, string>;
  isReviewMode: boolean;
  onOpenSampleAnswers: () => void;
  onOpenDrawer: () => void;
  onOpenSubmitModal: () => void;
  onShowScoreReport: () => void;
}

export function ReadingBottomDock({
  stages,
  activeStage,
  setActiveStage,
  flagged,
  examData,
  p1Answers,
  p2Orders,
  p3Answers,
  p4Answers,
  isReviewMode,
  onOpenSampleAnswers,
  onOpenDrawer,
  onOpenSubmitModal,
  onShowScoreReport,
}: ReadingBottomDockProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border px-4 md:px-8 py-3 flex items-center justify-between z-40 shadow-lg">
      {/* Left: Hiện đáp án & Báo lỗi */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenSampleAnswers}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Hiện đáp án</span>
        </button>

        <button
          type="button"
          onClick={() => alert("Đã gửi phản hồi báo lỗi đề thi Reading.")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Báo lỗi</span>
        </button>
      </div>

      {/* Center: Quick Stage Pills & Navigation Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="bg-muted/40 dark:bg-slate-800/60 p-1 rounded-2xl border border-border/80 shadow-2xs flex items-center gap-1 backdrop-blur-sm">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scrollbar-none scroll-smooth max-w-[42vw] sm:max-w-[44vw] md:max-w-[50vw] lg:max-w-[56vw] py-0.5 px-0.5">
            {stages.map((stg, idx) => {
              const isCurrent = activeStage === idx;
              let isComplete = false;
              if (stg.stageKey === "p1") {
                isComplete =
                  Object.keys(p1Answers).filter((k) => !!p1Answers[k]).length ===
                  examData.part1.gaps.length;
              } else if (stg.stageKey === "p2-1") {
                const st = examData.part2.stories[0];
                const targetLen = st?.sentences?.length || 5;
                isComplete = !!(
                  st?.id &&
                  p2Orders[st.id] &&
                  p2Orders[st.id].filter(Boolean).length === targetLen
                );
              } else if (stg.stageKey === "p2-2") {
                const st = examData.part2.stories[1];
                const targetLen = st?.sentences?.length || 5;
                isComplete = !!(
                  st?.id &&
                  p2Orders[st.id] &&
                  p2Orders[st.id].filter(Boolean).length === targetLen
                );
              } else if (stg.stageKey === "p3") {
                isComplete =
                  Object.keys(p3Answers).filter((k) => !!p3Answers[k]).length ===
                  examData.part3.questions.length;
              } else if (stg.stageKey === "p4") {
                isComplete =
                  Object.keys(p4Answers).filter((k) => !!p4Answers[k]).length ===
                  examData.part4.paragraphs.length;
              }

              return (
                <button
                  key={stg.stageKey}
                  id={`reading-stage-pill-${idx}`}
                  type="button"
                  onClick={() => setActiveStage(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap select-none ${
                    isCurrent
                      ? "bg-primary text-primary-foreground font-black shadow-sm border border-primary"
                      : isComplete
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/35 hover:bg-emerald-500/25"
                      : "bg-background/80 dark:bg-slate-900/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 hover:border-border"
                  }`}
                  title={stg.label}
                >
                  {isComplete && !isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  )}
                  {flagged?.[idx] && (
                    <Flag className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                  <span>{stg.title}</span>
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-border/70 shrink-0 mx-0.5 hidden sm:block" />

          <button
            type="button"
            onClick={onOpenDrawer}
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center bg-background/80 dark:bg-slate-900/60 hover:bg-primary/10 hover:text-primary text-muted-foreground border border-border/70 hover:border-primary/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs shrink-0"
            title="Danh sách tất cả phần thi Reading"
            aria-label="Danh sách tất cả phần thi Reading"
          >
            <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center bg-background/80 dark:bg-slate-900/60 hover:bg-primary/10 hover:text-primary text-muted-foreground border border-border/70 hover:border-primary/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs shrink-0 hidden sm:flex"
            title="Cuộn lên đầu trang"
            aria-label="Cuộn lên đầu trang"
          >
            <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Right: Previous & Next / Submit */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={activeStage === 0}
          onClick={() => setActiveStage((p) => Math.max(0, p - 1))}
          className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
        >
          ← Previous
        </button>

        {activeStage < stages.length - 1 ? (
          <button
            type="button"
            onClick={() => setActiveStage((p) => Math.min(stages.length - 1, p + 1))}
            className="tech-btn px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : isReviewMode ? (
          <button
            type="button"
            onClick={onShowScoreReport}
            className="tech-btn px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Xem báo cáo điểm</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenSubmitModal}
            className="tech-btn px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Nộp bài
          </button>
        )}
      </div>
    </footer>
  );
}

interface ReadingModalsAndDrawerProps {
  showDrawer: boolean;
  setShowDrawer: (val: boolean) => void;
  showSampleAnswers: boolean;
  setShowSampleAnswers: (val: boolean) => void;
  stages: ReadingStageDef[];
  currentStage: ReadingStageDef;
  activeStage: number;
  setActiveStage: (idx: number) => void;
  flagged: Record<number, boolean>;
  examData: ReadingExamData;
  p1Answers: Record<string, string>;
  p2Orders: Record<string, string[]>;
  p3Answers: Record<string, string>;
  p4Answers: Record<string, string>;
  onOpenSubmitModal: () => void;
}

export function ReadingModalsAndDrawer({
  showDrawer,
  setShowDrawer,
  showSampleAnswers,
  setShowSampleAnswers,
  stages,
  currentStage,
  activeStage,
  setActiveStage,
  flagged,
  examData,
  p1Answers,
  p2Orders,
  p3Answers,
  p4Answers,
  onOpenSubmitModal,
}: ReadingModalsAndDrawerProps) {
  return (
    <>
      {/* DRAWER DANH SÁCH BÀI THI READING */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md p-5 rounded-2xl bg-card border border-border shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-heading font-bold text-xs uppercase text-muted-foreground tracking-wider">
                Danh sách bài thi Reading ({stages.length} phần)
              </h3>
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {stages.map((stg, stgIdx) => {
                const isActive = activeStage === stgIdx;
                const isFlg = flagged[stgIdx];

                let isComplete = false;
                let progressText = "";
                if (stg.stageKey === "p1") {
                  const count = Object.keys(p1Answers).filter((k) => !!p1Answers[k]).length;
                  isComplete = count === examData.part1.gaps.length;
                  progressText = `${count}/${examData.part1.gaps.length}`;
                } else if (stg.stageKey === "p2-1") {
                  const st = examData.part2.stories[0];
                  const targetCount = st?.sentences?.length || 5;
                  const placed = (st?.id && p2Orders[st.id]?.filter(Boolean).length) || 0;
                  isComplete = placed === targetCount && placed > 0;
                  progressText = isComplete ? `Đã xếp đủ ${targetCount} câu` : `${placed}/${targetCount} câu`;
                } else if (stg.stageKey === "p2-2") {
                  const st = examData.part2.stories[1];
                  const targetCount = st?.sentences?.length || 5;
                  const placed = (st?.id && p2Orders[st.id]?.filter(Boolean).length) || 0;
                  isComplete = placed === targetCount && placed > 0;
                  progressText = isComplete ? `Đã xếp đủ ${targetCount} câu` : `${placed}/${targetCount} câu`;
                } else if (stg.stageKey === "p3") {
                  const count = Object.keys(p3Answers).filter((k) => !!p3Answers[k]).length;
                  isComplete = count === examData.part3.questions.length;
                  progressText = `${count}/${examData.part3.questions.length}`;
                } else if (stg.stageKey === "p4") {
                  const count = Object.keys(p4Answers).filter((k) => !!p4Answers[k]).length;
                  isComplete = count === examData.part4.paragraphs.length;
                  progressText = `${count}/${examData.part4.paragraphs.length}`;
                }

                return (
                  <button
                    key={stg.stageKey}
                    type="button"
                    onClick={() => {
                      setActiveStage(stgIdx);
                      setShowDrawer(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary"
                        : isComplete
                        ? "border-border/60 bg-muted/20 text-foreground hover:bg-muted/40"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] shrink-0">
                        {stgIdx + 1}
                      </span>
                      <span className="truncate">{stg.label}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-normal text-muted-foreground font-mono">
                        {progressText}
                      </span>
                      {isFlg && <Flag className="w-3 h-3 text-amber-500 fill-amber-500" />}
                      {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowDrawer(false);
                  onOpenSubmitModal();
                }}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-sm transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Nộp bài ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HIỆN ĐÁP ÁN THAM KHẢO & GIẢI THÍCH */}
      {showSampleAnswers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Đáp án &amp; Hướng dẫn giải ({stages[activeStage]?.label})</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSampleAnswers(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              {currentStage.stageKey === "p1" && (
                <div className="space-y-2">
                  {examData.part1.gaps.map((g, idx) => (
                    <div key={g.id} className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                      <div className="font-semibold text-foreground">
                        Câu {idx + 1}: {g.prompt.replace(/\[(?:gap|blank|\.\.\.)\]/i, "___")}
                      </div>
                      <div className="text-primary font-bold">
                        Đáp án đúng: <span className="underline">{g.correctAnswer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(currentStage.stageKey === "p2-1" || currentStage.stageKey === "p2-2") && (() => {
                const storyIdx = currentStage.stageKey === "p2-1" ? 0 : 1;
                const story = examData.part2.stories[storyIdx];
                if (!story) return null;
                return (
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                    <div className="font-bold text-primary">{story.title}</div>
                    {story.fixedSentence && (
                      <div className="text-foreground">
                        <span className="font-bold">1 (Mở đầu cố định):</span> {story.fixedSentence}
                      </div>
                    )}
                    {story.correctOrder.map((sId, idx) => {
                      const sObj = story.sentences.find((s) => s.id === sId);
                      const num = story.fixedSentence ? idx + 2 : idx + 1;
                      return (
                        <div key={sId} className="text-foreground">
                          <span className="font-bold">{num}:</span> {sObj?.text || sId}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {currentStage.stageKey === "p3" && (
                <div className="space-y-2">
                  {examData.part3.questions.map((q, idx) => (
                    <div key={q.id} className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                      <div className="font-semibold text-foreground">
                        Câu {idx + 1}: {q.prompt}
                      </div>
                      <div className="text-primary font-bold">
                        Đáp án đúng: <span className="underline">{q.correctAnswer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentStage.stageKey === "p4" && (
                <div className="space-y-2">
                  {examData.part4.paragraphs.map((p) => (
                    <div key={p.id} className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                      <div className="font-semibold text-foreground">
                        Đoạn văn {p.paragraphNumber}
                      </div>
                      <div className="text-primary font-bold">
                        Tiêu đề phù hợp: <span className="underline">{p.correctHeading}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setShowSampleAnswers(false)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
