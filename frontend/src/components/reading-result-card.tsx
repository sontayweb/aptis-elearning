"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Eye, Flag, MessageSquare } from "lucide-react";

export interface PartBreakdownItem {
  partNumber: number;
  title: string;
  correctCount: number;
  totalCount: number;
  score: number;
  maxScore: number;
}

interface ReadingResultCardProps {
  totalScore: number;
  maxTotalScore?: number;
  cefrLevel: string;
  correctCount: number;
  totalQuestions: number;
  breakdown: PartBreakdownItem[];
  onReview?: () => void;
  onRetry?: () => void;
}

export function ReadingResultCard({
  totalScore = 0,
  maxTotalScore = 50,
  cefrLevel = "B1",
  correctCount = 0,
  totalQuestions = 27,
  breakdown = [],
  onReview,
  onRetry,
}: ReadingResultCardProps) {
  return (
    <div className="min-h-screen bg-exam-bg text-exam-text flex flex-col font-sans py-10 px-4">
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-exam-surface rounded-2xl border border-exam-border shadow-xl p-8 md:p-10 space-y-8 animate-in zoom-in-95">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-2xl md:text-3xl font-black text-exam-text">
              Kết quả Reading
            </h1>

            {/* Score Stats */}
            <div className="flex items-center justify-center gap-8 py-2">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-primary">
                  {Math.round(totalScore)}/{maxTotalScore}
                </div>
                <div className="text-xs text-exam-text-muted font-bold uppercase mt-1">Điểm</div>
              </div>

              <div className="h-10 w-px bg-exam-border" />

              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-primary">
                  {cefrLevel || "A0"}
                </div>
                <div className="text-xs text-exam-text-muted font-bold uppercase mt-1">Trình độ</div>
              </div>

              <div className="h-10 w-px bg-exam-border" />

              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-exam-text">
                  {correctCount}/{totalQuestions}
                </div>
                <div className="text-xs text-exam-text-muted font-bold uppercase mt-1">Số câu đúng</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/reading"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-exam-border text-exam-text font-bold text-xs hover:bg-exam-border/40 transition-colors shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Thoát
              </Link>

              {onReview && (
                <button
                  type="button"
                  onClick={onReview}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-exam-border text-exam-text font-bold text-xs hover:bg-exam-border/40 transition-colors shadow-sm"
                >
                  <Eye className="w-4 h-4" /> Xem lại từng câu →
                </button>
              )}

              <button
                type="button"
                onClick={onRetry ? onRetry : () => window.location.reload()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-brand-brown transition-colors shadow-sm"
              >
                <RotateCcw className="w-4 h-4" /> Làm lại
              </button>
            </div>
          </div>

          {/* Chi tiết bài làm */}
          <div className="p-6 rounded-2xl border border-exam-border bg-exam-bg/40 space-y-4">
            <h2 className="text-base font-extrabold text-exam-text">Chi tiết bài làm</h2>

            <div className="divide-y divide-exam-border/50">
              {breakdown.map((part) => (
                <div
                  key={part.partNumber}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <span className="text-sm font-bold text-exam-text">
                    {part.title}
                  </span>

                  <div className="flex items-center gap-6 text-xs text-exam-text-muted">
                    <span>
                      Số câu đúng:{" "}
                      <strong className="text-exam-text font-black">
                        {part.correctCount}/{part.totalCount}
                      </strong>
                    </span>
                    <span>
                      Điểm:{" "}
                      <strong className="text-primary font-black">
                        {Math.round(part.score)}/{Math.round(part.maxScore)}
                      </strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Bar: Báo lỗi & Hỗ trợ */}
          <div className="pt-4 border-t border-exam-border flex items-center justify-between text-xs text-exam-text-muted">
            <button
              type="button"
              onClick={() => alert("Cảm ơn bạn đã phản hồi. Ban học vụ sẽ kiểm tra câu hỏi này!")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-exam-border hover:bg-exam-border/30 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" /> Báo lỗi
            </button>

            <button
              type="button"
              onClick={() => alert("Đang kết nối nhân viên tư vấn...")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-brand-brown transition-colors shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Chat với admin
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
