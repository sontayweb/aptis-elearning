"use client";

import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";

export interface ListeningStageItem {
  id: string;
  partNum: 1 | 2 | 3 | 4;
  subIndex: number;
  title: string;
  label: string;
  audioUrl?: string;
}

export interface StageResultInfo {
  isCorrect: boolean;
  label: string;
  score?: number;
  total?: number;
}

interface ListeningReviewSidebarProps {
  results: {
    totalScore: number;
    maxScore: number;
    totalCorrect: number;
    totalQuestionsInExam: number;
    cefr: string;
  };
  onlyShowWrong: boolean;
  setOnlyShowWrong: (val: boolean) => void;
  reviewFilterPart: "all" | 1 | 2 | 3 | 4;
  setReviewFilterPart: (val: "all" | 1 | 2 | 3 | 4) => void;
  listeningStages: ListeningStageItem[];
  activeStage: number;
  setActiveStage: (idx: number) => void;
  getStageResult: (idx: number) => StageResultInfo;
  handleRestartExam: () => void;
  isRestarting: boolean;
  onBackToHistory: () => void;
}

export function ListeningReviewSidebar({
  results,
  onlyShowWrong,
  setOnlyShowWrong,
  reviewFilterPart,
  setReviewFilterPart,
  listeningStages,
  activeStage,
  setActiveStage,
  getStageResult,
  handleRestartExam,
  isRestarting,
  onBackToHistory,
}: ListeningReviewSidebarProps) {
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
              {results.totalScore}/{results.maxScore} điểm
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {results.totalCorrect} đúng
              </span>
              <span>•</span>
              <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {results.totalQuestionsInExam - results.totalCorrect} sai
              </span>
            </div>
            <span className="font-bold text-accent">Band {results.cefr}</span>
          </div>
        </div>

        {/* Filter Checkbox */}
        <div className="flex items-center justify-between bg-muted/40 p-2.5 rounded-xl border border-border/60">
          <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyShowWrong}
              onChange={(e) => setOnlyShowWrong(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary w-4 h-4"
            />
            <span>Chỉ hiện câu sai</span>
          </label>
          {onlyShowWrong && (
            <span className="text-[11px] text-red-600 dark:text-red-400 font-bold">
              {results.totalQuestionsInExam - results.totalCorrect} câu
            </span>
          )}
        </div>

        {/* Part Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-xs">
          {[
            { id: "all" as const, label: `Tất cả (${listeningStages.length})` },
            { id: 1 as const, label: `Part 1 (${listeningStages.filter((s) => s.partNum === 1).length})` },
            { id: 2 as const, label: `Part 2` },
            { id: 3 as const, label: `Part 3` },
            { id: 4 as const, label: `Part 4` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReviewFilterPart(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                reviewFilterPart === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Question Grid Pills */}
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2 max-h-[46vh] overflow-y-auto p-1">
          {listeningStages
            .map((stage, idx) => ({ stage, idx, res: getStageResult(idx) }))
            .filter(({ stage, res }) => {
              if (reviewFilterPart !== "all" && stage.partNum !== reviewFilterPart) return false;
              if (onlyShowWrong && res.isCorrect) return false;
              return true;
            })
            .map(({ stage, idx, res }) => {
              const isCurrent = activeStage === idx;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActiveStage(idx)}
                  className={`p-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                    res.isCorrect
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25"
                      : "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/35 hover:bg-red-500/25"
                  } ${
                    isCurrent
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background font-black shadow-sm"
                      : ""
                  }`}
                  title={`${stage.label}: ${res.isCorrect ? "Đúng" : "Sai"}`}
                >
                  <div className="flex items-center gap-1">
                    {res.isCorrect ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                    )}
                    <span className="truncate">{res.label}</span>
                  </div>
                  {res.total && res.total > 1 && (
                    <span className="text-[10px] opacity-80">
                      {res.score}/{res.total}
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Actions */}
        <div className="border-t border-border pt-3 space-y-2">
          <button
            type="button"
            onClick={handleRestartExam}
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

