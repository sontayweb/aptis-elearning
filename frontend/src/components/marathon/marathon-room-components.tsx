"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  Pause,
  Award,
  Layers,
  Flag,
  ArrowRight,
  Lock,
  ExternalLink,
  Info,
} from "lucide-react";
import { ExamSyncStatus, type SyncStatus } from "@/components/exam-sync-status";

export interface CatalogItem {
  index: number;
  examId: string;
  partId: string;
  title: string;
  skill: string;
  isPro: boolean;
  hotLevel: number;
  forecastTag?: string | null;
  partNumber: number;
  partTitle: string;
  totalQuestions: number;
}

export interface ExamFeedbackData {
  examIndex: number;
  earnedScore: number;
  maxScore: number;
  bestScore: number;
  correctCount: number;
  totalQuestions: number;
  accuracyRate: number;
  questionResults: Record<
    string,
    { isCorrect: boolean; userAnswer: string; correctAnswer: string }
  >;
  questions: Array<{
    id: string;
    prompt: string;
    correctAnswer: string | null;
    explanation: string | null;
  }>;
}

/**
 * 1. Marathon Room Top Header
 */
interface MarathonRoomHeaderProps {
  title: string;
  partLabel: string;
  currentIndex: number;
  totalExams: number;
  syncStatus: SyncStatus;
  lastSavedAt: Date | null;
  isResumed: boolean;
  timeSpentSeconds: number;
  onExitClick: () => void;
  onOpenMatrix: () => void;
  isPracticeMode?: boolean;
}

export function MarathonRoomHeader({
  title,
  partLabel,
  currentIndex,
  totalExams,
  syncStatus,
  lastSavedAt,
  isResumed,
  timeSpentSeconds,
  onExitClick,
  onOpenMatrix,
}: MarathonRoomHeaderProps) {
  const percent = totalExams > 0 ? Math.round(((currentIndex + 1) / totalExams) * 100) : 0;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border/80 shadow-xs px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Exit button & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onExitClick}
            className="w-9 h-9 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all shrink-0 cursor-pointer"
            title="Tạm dừng & Thoát phòng thi"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-extrabold uppercase tracking-wider">
                {partLabel}
              </span>
              <span className="text-xs font-bold text-foreground truncate">
                Đề {currentIndex + 1} / {totalExams || "--"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
              {title}
            </p>
          </div>
        </div>

        {/* Center: Progress Bar & Matrix Quick Button */}
        <div className="hidden md:flex flex-col items-center max-w-xs w-full px-4">
          <div className="flex items-center justify-between w-full text-[11px] font-semibold text-muted-foreground mb-1">
            <span>Tiến độ toàn Part</span>
            <span className="text-primary font-bold">{percent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, Math.max(1, percent))}%` }}
            />
          </div>
        </div>

        {/* Right: Sync Status & Timer & Exit CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          <ExamSyncStatus
            status={syncStatus}
            lastSavedAt={lastSavedAt}
            isResumed={isResumed}
            className="hidden sm:inline-flex"
          />

          <div className="px-2.5 py-1 rounded-lg bg-muted text-foreground font-mono text-xs font-bold border border-border/60">
            ⏱ {formatTimer(timeSpentSeconds)}
          </div>

          <button
            type="button"
            onClick={onOpenMatrix}
            className="h-9 px-3 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ma trận đề</span>
          </button>
        </div>
      </div>
    </header>
  );
}

/**
 * 2. Exam Matrix Drawer (Drawer Ma Trận Đề)
 */
interface MarathonMatrixDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: CatalogItem[];
  currentIndex: number;
  anchorIndex: number;
  completedData: Record<string, any>;
  onSelectExam: (index: number) => void;
}

export function MarathonMatrixDrawer({
  isOpen,
  onClose,
  catalog,
  currentIndex,
  anchorIndex,
  completedData,
  onSelectExam,
}: MarathonMatrixDrawerProps) {
  if (!isOpen) return null;

  const completedCount = Object.keys(completedData).length;
  const percent = catalog.length > 0 ? Math.round((completedCount / catalog.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl max-h-[85vh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-extrabold uppercase">
                Ma Trận Luyện Đề Toàn Part
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                Đã xong {completedCount}/{catalog.length} đề ({percent}%)
              </span>
            </div>
            <h3 className="text-lg font-heading font-extrabold text-foreground mt-1">
              Danh Sách Bộ Đề Thi Thật Trong Phòng Thi
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Return to Anchor Notice (if looking at another exam) */}
        {currentIndex !== anchorIndex && (
          <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>
                Bạn đang xem Đề {currentIndex + 1}. Vị trí xa nhất bạn đang làm dở là{" "}
                <strong>Đề {anchorIndex + 1}</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onSelectExam(anchorIndex);
                onClose();
              }}
              className="px-2.5 py-1 rounded-md bg-amber-500 text-white font-bold text-[11px] hover:bg-amber-600 transition-all cursor-pointer"
            >
              Quay về Đề {anchorIndex + 1}
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="px-5 py-2.5 bg-card border-b border-border flex items-center gap-4 text-[11px] font-semibold text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">
              ✓
            </div>
            <span>Đã làm tốt (&gt;80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-md bg-amber-500 text-white flex items-center justify-center text-[9px] font-bold">
              !
            </div>
            <span>Cần ôn lại (&lt;80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-md bg-primary text-white flex items-center justify-center text-[9px] font-bold ring-2 ring-primary/40">
              ●
            </div>
            <span>Đang làm dở</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-md bg-muted border border-border" />
            <span>Chưa làm</span>
          </div>
        </div>

        {/* Grid of Exams */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
          {catalog.map((item) => {
            const result = completedData[item.examId];
            const isCompleted = Boolean(result);
            const isCurrent = item.index === currentIndex;
            const isAnchor = item.index === anchorIndex;
            const accuracy =
              result && result.maxScore > 0
                ? Math.round((result.bestScore / result.maxScore) * 100)
                : 0;

            let badgeBg = "bg-card border-border hover:border-primary/40 text-foreground";
            if (isCompleted) {
              if (accuracy >= 80) {
                badgeBg = "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300";
              } else {
                badgeBg = "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300";
              }
            }
            if (isCurrent) {
              badgeBg += " ring-2 ring-primary shadow-sm";
            }

            return (
              <button
                key={item.examId}
                type="button"
                onClick={() => {
                  onSelectExam(item.index);
                  onClose();
                }}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative group ${badgeBg}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-extrabold">
                    Đề #{item.index + 1}
                  </span>
                  {item.isPro && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[9px]">
                      PRO
                    </span>
                  )}
                  {isAnchor && (
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  )}
                </div>

                <div className="text-xs font-semibold text-foreground line-clamp-1 mb-2">
                  {item.title}
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-auto">
                  <span>{item.totalQuestions} câu</span>
                  {isCompleted ? (
                    <span className="font-bold text-foreground">
                      {result.bestScore}/{result.maxScore} ({accuracy}%)
                    </span>
                  ) : (
                    <span>Chưa làm</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Marathon Feedback Bottom Sheet (Giải thích ngay sau mỗi đề)
 */
interface MarathonFeedbackSheetProps {
  data: ExamFeedbackData | null;
  onClose: () => void;
  onNextExam: () => void;
  onRetake: () => void;
  isLastExam: boolean;
}

export function MarathonFeedbackSheet({
  data,
  onClose,
  onNextExam,
  onRetake,
  isLastExam,
}: MarathonFeedbackSheetProps) {
  if (!data) return null;

  const isPerfect = data.correctCount === data.totalQuestions;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl max-h-[85vh] bg-card border-t sm:border border-border sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-5 border-b border-border flex items-center justify-between ${
            isPerfect ? "bg-emerald-500/10" : "bg-primary/10"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-xs ${
                isPerfect
                  ? "bg-emerald-500 text-white"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {data.accuracyRate}%
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-background/80 font-mono font-bold text-[10px] uppercase">
                  Kết Quả Đề #{data.examIndex + 1}
                </span>
                {isPerfect && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white font-bold text-[10px]">
                    Xuất sắc 100%!
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-heading font-extrabold text-foreground mt-0.5">
                Đúng {data.correctCount}/{data.totalQuestions} câu (Điểm:{" "}
                {data.earnedScore}/{data.maxScore})
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Detailed Answers Breakdown */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Chi tiết từng câu &amp; Giải thích ngữ nghĩa
          </h4>

          {data.questions.map((q, idx) => {
            const res = data.questionResults[q.id];
            const isCor = res?.isCorrect;

            return (
              <div
                key={q.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCor
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-rose-500/30 bg-rose-500/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCor
                          ? "bg-emerald-500 text-white"
                          : "bg-rose-500 text-white"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-heading font-bold text-xs text-foreground">
                      Câu hỏi {idx + 1}
                    </span>
                  </div>
                  <div className="text-xs font-bold">
                    {isCor ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Đúng
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> Sai
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-foreground mb-3 font-medium">
                  {q.prompt}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                  <div className="p-2.5 rounded-xl bg-card border border-border">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">
                      Đáp án của bạn:
                    </span>
                    <span
                      className={`font-bold ${
                        isCor ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {res?.userAnswer || "(Chưa chọn)"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-card border border-border">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">
                      Đáp án chính xác:
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {res?.correctAnswer || q.correctAnswer}
                    </span>
                  </div>
                </div>

                {q.explanation && (
                  <div className="p-3 rounded-xl bg-muted/60 border border-border/80 text-xs text-muted-foreground">
                    <strong className="text-foreground font-semibold block mb-1">
                      💡 Mẹo &amp; Giải thích:
                    </strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onRetake}
            className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-foreground font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Làm lại đề này</span>
          </button>

          {!isLastExam ? (
            <button
              type="button"
              onClick={onNextExam}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span>Sang Đề Tiếp Theo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Hoàn Thành Toàn Bộ Part!</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

