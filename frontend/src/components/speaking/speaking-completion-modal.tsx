"use client";

import React from "react";
import Link from "next/link";
import {
  Trophy,
  Play,
  RotateCcw,
  ArrowLeft,
  Loader2,
  X,
} from "lucide-react";
import type { SpeakingQuestion } from "@/lib/speaking/speaking-exam-utils";

export interface SpeakingCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPart: number | null;
  examTitle: string;
  completedCount: number;
  questions: SpeakingQuestion[];
  handleRestartExam: () => void;
  isRestarting: boolean;
}

export function SpeakingCompletionModal({
  isOpen,
  onClose,
  targetPart,
  examTitle,
  completedCount,
  questions,
  handleRestartExam,
  isRestarting,
}: SpeakingCompletionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-card border border-border rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden my-auto max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3 mb-6">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 uppercase tracking-wider">
              Đã hoàn thành {targetPart ? `Part ${targetPart}` : "toàn bộ bài thi Speaking"}
            </span>
            <h2 className="font-heading font-bold text-xl md:text-2xl text-foreground mt-2">
              Kết Quả Bài Thi Nói Aptis
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {examTitle} {targetPart ? `· Part ${targetPart}` : "· 4 Parts chuẩn British Council"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-muted/40 border border-border mb-6 text-center">
          <div className="p-3 rounded-xl bg-card border border-border/80">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              CEFR Target
            </span>
            <span className="text-xl md:text-2xl font-black font-heading gradient-text mt-0.5 block">
              Band B2
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">Tốt</span>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border/80">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              Điểm ước tính
            </span>
            <span className="text-xl md:text-2xl font-black font-heading text-primary mt-0.5 block">
              42<span className="text-xs text-muted-foreground font-normal">/50</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">Quy đổi Aptis</span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-card border border-border/80">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              Câu hoàn tất
            </span>
            <span className="text-xl md:text-2xl font-black font-heading text-foreground mt-0.5 block">
              {completedCount}
              <span className="text-xs text-muted-foreground font-normal">/{questions.length}</span>
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">Đã ghi âm</span>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>Xem lại và nghe lại bản thu âm các câu</span>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleRestartExam}
              disabled={isRestarting}
              className="py-2.5 rounded-xl border border-border hover:bg-muted font-bold text-xs text-foreground transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isRestarting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              <span>Làm lại đề mới</span>
            </button>

            <Link
              href="/speaking"
              className="py-2.5 rounded-xl bg-muted hover:bg-muted/80 font-bold text-xs text-foreground transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Danh sách đề</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

