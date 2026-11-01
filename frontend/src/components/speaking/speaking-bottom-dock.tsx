"use client";

import React from "react";
import {
  FileEdit,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import type { SpeakingQuestion } from "@/lib/speaking/speaking-exam-utils";

export interface SpeakingBottomDockProps {
  isReviewMode: boolean;
  isIntroStep: boolean;
  questions: SpeakingQuestion[];
  currentIndex: number;
  showSampleAnswer: boolean;
  setShowSampleAnswer: (show: boolean) => void;
  setIsScratchpadOpen: (open: boolean) => void;
  setIsReportOpen: (open: boolean) => void;
  handlePrevQuestion: () => void;
  handleNextQuestion: () => void;
  handleFinishExam: () => void;
  targetPart: number | null;
  aiQuota: number;
}

export function SpeakingBottomDock({
  isReviewMode,
  isIntroStep,
  questions,
  currentIndex,
  showSampleAnswer,
  setShowSampleAnswer,
  setIsScratchpadOpen,
  setIsReportOpen,
  handlePrevQuestion,
  handleNextQuestion,
  handleFinishExam,
  targetPart,
  aiQuota,
}: SpeakingBottomDockProps) {
  if (isReviewMode || isIntroStep) return null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md px-4 py-3 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Bottom Left: Nháp, Hiện đáp án, Báo lỗi */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsScratchpadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
          >
            <FileEdit className="w-3.5 h-3.5 text-primary" />
            <span>Nháp</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSampleAnswer(!showSampleAnswer)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
              showSampleAnswer
                ? "border-primary bg-primary text-primary-foreground shadow-xs"
                : "border-primary/20 text-primary bg-primary/5 hover:bg-primary/10"
            }`}
          >
            {showSampleAnswer ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Ẩn đáp án</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Hiện đáp án</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Báo lỗi</span>
          </button>
        </div>

        {/* Bottom Center: Question navigation */}
        {questions.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevQuestion}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Câu trước</span>
            </button>
            <span className="text-xs font-mono text-muted-foreground px-1">
              {currentIndex + 1} / {questions.length}
            </span>
            {currentIndex === questions.length - 1 ? (
              <button
                type="button"
                onClick={handleFinishExam}
                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-xs hover:opacity-95 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{targetPart ? `Hoàn tất Part ${targetPart}` : "Nộp bài thi"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 cursor-pointer"
              >
                <span className="hidden sm:inline">Câu tiếp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Bottom Right: AI quota indicator */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Còn {aiQuota} lượt chấm AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

