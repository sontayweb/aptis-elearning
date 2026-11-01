"use client";

import Link from "next/link";
import { Headphones, LogOut, Eye, Loader2, RotateCcw } from "lucide-react";
import type { ListeningResults } from "./listening-types";

interface ListeningResultScreenProps {
  results: ListeningResults;
  isRestarting: boolean;
  onRestart: () => void;
  onReview: () => void;
}

/** Màn hình kết quả sau khi nộp bài Listening. */
export function ListeningResultScreen({
  results,
  isRestarting,
  onRestart,
  onReview,
}: ListeningResultScreenProps) {
  return (
  <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
    {/* Header Bar */}
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
          <Headphones className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
            Listening Test
          </span>
          <span className="text-sm font-bold text-foreground">
            Kết quả bài thi Listening
          </span>
        </div>
      </div>
      <Link
        href="/listening"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Thoát</span>
      </Link>
    </header>

    {/* Content Container */}
    <main className="flex-1 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in">
        {/* Card 1: Tổng quan Điểm số */}
        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm text-center space-y-6">
          <h2 className="font-heading font-extrabold text-xl text-foreground">
            Kết quả Listening
          </h2>

          <div className="grid grid-cols-3 gap-3 divide-x divide-border/60 py-2">
            <div>
              <div className="text-2xl md:text-3xl font-black text-primary font-mono">
                {results.totalScore}/{results.maxScore}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Điểm</div>
            </div>

            <div>
              <div className="text-2xl md:text-3xl font-black text-accent font-heading">
                {results.cefr}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Trình độ</div>
            </div>

            <div>
              <div className="text-2xl md:text-3xl font-black text-foreground font-mono">
                {results.totalCorrect}/{results.totalQuestionsInExam}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Số câu đúng</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/listening"
              className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
            >
              ← Thoát
            </Link>

            <button
              type="button"
              onClick={onReview}
              className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem lại từng câu →</span>
            </button>

            <button
              type="button"
              onClick={onRestart}
              disabled={isRestarting}
              className="tech-btn px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isRestarting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              <span>Làm lại</span>
            </button>
          </div>
        </div>

        {/* Card 2: Chi tiết bài làm theo 4 Part */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-heading font-bold text-sm text-foreground pb-2 border-b border-border">
            Chi tiết bài làm
          </h3>

          <div className="space-y-3.5 text-xs md:text-sm">
            {/* Part 1 */}
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="font-medium text-foreground">
                Part 1 – Word Recognition
              </span>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">
                  Số câu đúng: <strong className="text-foreground">{results.p1Correct}/13</strong>
                </span>
                <span className="font-mono font-bold text-primary">
                  Điểm: {results.p1Score}/26
                </span>
              </div>
            </div>

            {/* Part 2 */}
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="font-medium text-foreground">
                Part 2 – Matching Information
              </span>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">
                  Số câu đúng: <strong className="text-foreground">{results.p2Correct}/4</strong>
                </span>
                <span className="font-mono font-bold text-primary">
                  Điểm: {results.p2Score}/8
                </span>
              </div>
            </div>

            {/* Part 3 */}
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="font-medium text-foreground">
                Part 3 – Short Conversations
              </span>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">
                  Số câu đúng: <strong className="text-foreground">{results.p3Correct}/4</strong>
                </span>
                <span className="font-mono font-bold text-primary">
                  Điểm: {results.p3Score}/8
                </span>
              </div>
            </div>

            {/* Part 4 */}
            <div className="flex items-center justify-between py-1.5">
              <span className="font-medium text-foreground">
                Part 4 – Monologues
              </span>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">
                  Số câu đúng: <strong className="text-foreground">{results.p4Correct}/4</strong>
                </span>
                <span className="font-mono font-bold text-primary">
                  Điểm: {results.p4Score}/8
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
  );
}
