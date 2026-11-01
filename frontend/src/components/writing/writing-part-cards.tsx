"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  PenTool,
  FileText,
  Award,
  Loader2,
  RotateCcw,
  Trophy,
  Eye,
  Flag,
  Bookmark,
  Menu,
  ArrowUp,
  Zap,
  ArrowRight,
} from "lucide-react";
import { WRITING_WORD_LIMITS, countWords } from "@/lib/writing-validator";
import type { WritingPart } from "@/data/writing-benchmark";

/* ============================================================================
 * PART 1: 5 SHORT ANSWER QUESTIONS
 * ============================================================================ */

interface WritingPart1CardProps {
  currentPart: WritingPart;
  currentPartIdx: number;
  answers: Record<string, string>;
  onAnswerChange: (key: string, val: string, maxLimit: number) => void;
  isReviewMode: boolean;
  aiResult?: any;
}

export function WritingPart1Card({
  currentPart,
  currentPartIdx,
  answers,
  onAnswerChange,
  isReviewMode,
  aiResult,
}: WritingPart1CardProps) {
  return (
    <div className="space-y-4">
      {currentPart.questions.map((q, qIdx) => {
        const answerKey = `${currentPartIdx}_${qIdx}`;
        const val = answers[answerKey] || "";
        const words = countWords(val);
        const isLimitReached = words >= WRITING_WORD_LIMITS.PART_1;

        return (
          <div
            key={q.questionNumber}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3"
          >
            <label className="text-xs md:text-sm font-semibold text-foreground block">
              {q.prompt}
            </label>
            <textarea
              rows={2}
              value={val}
              readOnly={isReviewMode}
              onChange={(e) =>
                onAnswerChange(answerKey, e.target.value, WRITING_WORD_LIMITS.PART_1)
              }
              placeholder="Type your answer (tối đa 10 từ)..."
              className={`w-full p-3 rounded-xl border bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 font-sans resize-y transition-all ${
                isLimitReached
                  ? "border-destructive ring-1 ring-destructive focus-visible:ring-destructive"
                  : "border-input focus-visible:ring-primary"
              } ${isReviewMode ? "bg-muted/30 cursor-default" : ""}`}
            />
            <div
              className={`flex justify-end text-xs font-mono transition-colors ${
                isLimitReached ? "text-destructive font-bold" : "text-muted-foreground"
              }`}
            >
              Words {words} / {WRITING_WORD_LIMITS.PART_1}{" "}
              {isLimitReached && "(Đạt giới hạn tối đa)"}
            </div>

            {/* Review Mode: Feedback AI & Sample Answer */}
            {isReviewMode &&
              (() => {
                const qAi = Array.isArray(aiResult?.ai_results)
                  ? aiResult.ai_results.find(
                      (r: any) =>
                        (q.id && String(r.question_id || r.questionId) === String(q.id)) ||
                        r.question_number === q.questionNumber
                    ) || aiResult.ai_results[qIdx]
                  : null;
                const feedbackText =
                  qAi?.feedback || qAi?.general_feedback || qAi?.generalFeedback;

                return (
                  <div className="space-y-2 pt-1 border-t border-border/60">
                    {feedbackText && (
                      <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1 text-xs">
                        <div className="flex items-center justify-between font-bold text-primary">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Nhận xét AI Kỳ Tích:</span>
                          </span>
                          {(qAi.cefr_level || qAi.cefrLevel) && (
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-[10px] font-bold">
                              Band {qAi.cefr_level || qAi.cefrLevel}
                            </span>
                          )}
                        </div>
                        <p className="text-foreground leading-relaxed whitespace-pre-line">
                          {feedbackText}
                        </p>
                      </div>
                    )}

                    {q.sampleAnswer && (
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                        <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Bài mẫu tham khảo:</span>
                        </div>
                        <p className="text-foreground/90 leading-relaxed font-sans">
                          {q.sampleAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================================
 * PART 2: FORM RESPONSE (20–30 WORDS)
 * ============================================================================ */

interface WritingPart2CardProps {
  currentPart: WritingPart;
  currentPartIdx: number;
  answers: Record<string, string>;
  onAnswerChange: (key: string, val: string, maxLimit: number) => void;
  isReviewMode: boolean;
  aiResult?: any;
}

export function WritingPart2Card({
  currentPart,
  currentPartIdx,
  answers,
  onAnswerChange,
  isReviewMode,
  aiResult,
}: WritingPart2CardProps) {
  const val = answers[`${currentPartIdx}_0`] || "";
  const words = countWords(val);
  const isLimitReached = words >= WRITING_WORD_LIMITS.PART_2;

  let wordStatusText = "Chưa nhập bài";
  let wordStatusColor = "text-muted-foreground bg-muted border-border";
  if (isLimitReached) {
    wordStatusText = `Đã đạt giới hạn tối đa (${words}/${WRITING_WORD_LIMITS.PART_2} từ)`;
    wordStatusColor = "text-destructive bg-destructive/10 border-destructive";
  } else if (words > 0) {
    if (words < 20) {
      wordStatusText = `Chưa đủ dung lượng (${words}/20–30 từ)`;
      wordStatusColor =
        "text-amber-700 bg-amber-500/10 border-amber-300 dark:text-amber-400";
    } else if (words <= 35) {
      wordStatusText = `Đạt chuẩn dung lượng (${words}/20–30 từ)`;
      wordStatusColor =
        "text-emerald-700 bg-emerald-500/10 border-emerald-300 dark:text-emerald-400";
    } else {
      wordStatusText = `Vượt số từ khuyến nghị (${words}/${WRITING_WORD_LIMITS.PART_2} từ)`;
      wordStatusColor =
        "text-blue-700 bg-blue-500/10 border-blue-300 dark:text-blue-400";
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground shadow-sm">
            Câu hỏi điền đơn (Form Field)
          </span>
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
            Mục tiêu: 20 – 30 từ · Thời gian gợi ý: ~7 phút
          </span>
        </div>

        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${wordStatusColor}`}
        >
          {wordStatusText}
        </span>
      </div>

      {/* Hộp hiển thị câu hỏi nổi bật rõ ràng */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
        <div className="text-[11px] font-bold uppercase text-primary tracking-wider flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5" />
          <span>Câu hỏi cần trả lời:</span>
        </div>
        <div className="text-sm md:text-base font-bold text-foreground leading-relaxed">
          {currentPart.questions[0]?.prompt ||
            "Please tell us about yourself and your reasons for joining this club."}
        </div>
      </div>

      <textarea
        rows={5}
        value={val}
        readOnly={isReviewMode}
        onChange={(e) =>
          onAnswerChange(
            `${currentPartIdx}_0`,
            e.target.value,
            WRITING_WORD_LIMITS.PART_2
          )
        }
        placeholder="Write in sentences (20–30 words, tối đa 45 từ). Type your answer here..."
        className={`w-full p-4 rounded-xl border bg-background text-foreground text-sm md:text-base focus-visible:outline-none focus-visible:ring-2 font-sans resize-y leading-relaxed transition-all shadow-inner ${
          isLimitReached
            ? "border-destructive ring-1 ring-destructive focus-visible:ring-destructive"
            : "border-input focus-visible:ring-primary"
        } ${isReviewMode ? "bg-muted/30 cursor-default" : ""}`}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <div className="flex items-center gap-2">
          <div className="w-24 sm:w-36 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isLimitReached
                  ? "bg-destructive"
                  : words >= 20 && words <= 35
                  ? "bg-emerald-500"
                  : words > 35
                  ? "bg-blue-500"
                  : "bg-primary"
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (words / WRITING_WORD_LIMITS.PART_2) * 100
                )}%`,
              }}
            />
          </div>
          <span
            className={`font-mono font-medium ${
              isLimitReached ? "text-destructive font-bold" : ""
            }`}
          >
            {words} / {WRITING_WORD_LIMITS.PART_2} từ{" "}
            {isLimitReached && "(Khóa nhập)"}
          </span>
        </div>
        <span className="text-[11px] italic">
          Khuyến nghị: 20-30 từ · Tối đa: {WRITING_WORD_LIMITS.PART_2} từ
        </span>
      </div>

      {/* Review Mode: Feedback & Sample Answer */}
      {isReviewMode && (
        <div className="space-y-3 pt-3 border-t border-border">
          {(() => {
            const qAi = Array.isArray(aiResult?.ai_results)
              ? aiResult.ai_results.find(
                  (r: any) =>
                    (currentPart.questions[0]?.id &&
                      String(r.question_id || r.questionId) ===
                        String(currentPart.questions[0]?.id)) ||
                    r.question_number === 1
                ) || aiResult.ai_results[0]
              : null;
            const feedbackText = qAi?.feedback || qAi?.general_feedback;
            if (!feedbackText) return null;
            return (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-bold text-primary">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nhận xét AI Kỳ Tích:</span>
                  </span>
                  {qAi.cefr_level && (
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-[10px] font-bold">
                      Band {qAi.cefr_level}
                    </span>
                  )}
                </div>
                <p className="text-foreground leading-relaxed whitespace-pre-line">
                  {feedbackText}
                </p>
              </div>
            );
          })()}

          {currentPart.questions[0]?.sampleAnswer && (
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1.5">
              <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bài mẫu tham khảo (Band B2 - C1):</span>
              </div>
              <p className="text-foreground/90 leading-relaxed font-sans">
                {currentPart.questions[0]?.sampleAnswer}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * PART 3: 3 CHAT QUESTIONS
 * ============================================================================ */

interface WritingPart3CardProps {
  currentPart: WritingPart;
  currentPartIdx: number;
  answers: Record<string, string>;
  onAnswerChange: (key: string, val: string, maxLimit: number) => void;
  isReviewMode: boolean;
  aiResult?: any;
}

export function WritingPart3Card({
  currentPart,
  currentPartIdx,
  answers,
  onAnswerChange,
  isReviewMode,
  aiResult,
}: WritingPart3CardProps) {
  return (
    <div className="space-y-4">
      {currentPart.questions.map((q, qIdx) => {
        const answerKey = `${currentPartIdx}_${qIdx}`;
        const val = answers[answerKey] || "";
        const words = countWords(val);
        const isLimitReached = words >= WRITING_WORD_LIMITS.PART_3;

        return (
          <div
            key={q.questionNumber}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3"
          >
            <label className="text-xs md:text-sm font-semibold text-foreground block leading-relaxed">
              {q.prompt}
            </label>
            <textarea
              rows={3}
              value={val}
              readOnly={isReviewMode}
              onChange={(e) =>
                onAnswerChange(answerKey, e.target.value, WRITING_WORD_LIMITS.PART_3)
              }
              placeholder="Write your answer here (tối đa 60 từ)..."
              className={`w-full p-3.5 rounded-xl border bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 font-sans resize-y leading-relaxed transition-all ${
                isLimitReached
                  ? "border-destructive ring-1 ring-destructive focus-visible:ring-destructive"
                  : "border-input focus-visible:ring-primary"
              } ${isReviewMode ? "bg-muted/30 cursor-default" : ""}`}
            />
            <div
              className={`flex justify-end text-xs font-mono transition-colors ${
                isLimitReached ? "text-destructive font-bold" : "text-muted-foreground"
              }`}
            >
              Words {words} / {WRITING_WORD_LIMITS.PART_3}{" "}
              {isLimitReached && "(Đạt giới hạn tối đa)"}
            </div>

            {/* Review Mode: Feedback & Sample Answer */}
            {isReviewMode &&
              (() => {
                const qAi = Array.isArray(aiResult?.ai_results)
                  ? aiResult.ai_results.find(
                      (r: any) =>
                        (q.id && String(r.question_id || r.questionId) === String(q.id)) ||
                        r.question_number === q.questionNumber
                    ) || aiResult.ai_results[qIdx]
                  : null;
                const feedbackText =
                  qAi?.feedback || qAi?.general_feedback || qAi?.generalFeedback;

                return (
                  <div className="space-y-2 pt-1 border-t border-border/60">
                    {feedbackText && (
                      <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1 text-xs">
                        <div className="flex items-center justify-between font-bold text-primary">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Nhận xét AI Kỳ Tích:</span>
                          </span>
                          {(qAi.cefr_level || qAi.cefrLevel) && (
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-[10px] font-bold">
                              Band {qAi.cefr_level || qAi.cefrLevel}
                            </span>
                          )}
                        </div>
                        <p className="text-foreground leading-relaxed whitespace-pre-line">
                          {feedbackText}
                        </p>
                      </div>
                    )}

                    {q.sampleAnswer && (
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                        <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Bài mẫu tham khảo:</span>
                        </div>
                        <p className="text-foreground/90 leading-relaxed font-sans">
                          {q.sampleAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================================
 * PART 4: 2 EMAILS (INFORMAL & FORMAL DUAL-FORM WORKSPACE)
 * ============================================================================ */

interface WritingPart4CardProps {
  currentPart: WritingPart;
  currentPartIdx: number;
  answers: Record<string, string>;
  onAnswerChange: (key: string, val: string, maxLimit: number) => void;
  isReviewMode: boolean;
  aiResult?: any;
}

export function WritingPart4Card({
  currentPart,
  currentPartIdx,
  answers,
  onAnswerChange,
  isReviewMode,
  aiResult,
}: WritingPart4CardProps) {
  return (
    <div className="space-y-6">
      {/* Thông báo tình huống Part 4 nếu có */}
      {currentPart.passageText && (
        <div className="bg-card rounded-2xl border border-primary/20 bg-primary/[0.02] p-5 md:p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <FileText className="w-4 h-4" />
            <span>Thông báo từ Ban Quản lý Câu lạc bộ (Club Announcement)</span>
          </div>
          <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs md:text-sm text-foreground/90 leading-relaxed font-sans whitespace-pre-line">
            {currentPart.passageText}
          </div>
        </div>
      )}

      {currentPart.questions.map((q, qIdx) => {
        const answerKey = `${currentPartIdx}_${qIdx}`;
        const val = answers[answerKey] || "";
        const words = countWords(val);
        const isFormal = qIdx === 1;
        const maxLimit = isFormal
          ? WRITING_WORD_LIMITS.PART_4_MAIL_2
          : WRITING_WORD_LIMITS.PART_4_MAIL_1;
        const isLimitReached = words >= maxLimit;

        const targetMin = isFormal ? 120 : 40;
        const targetMax = isFormal ? 150 : 60;
        const recommendedWords = isFormal
          ? "120 – 150 từ (tối đa 225 từ)"
          : "40 – 60 từ (tối đa 75 từ)";
        const recommendedTime = isFormal ? "20 phút" : "10 phút";

        let wordStatusText = "Chưa nhập bài";
        let wordStatusColor = "text-muted-foreground bg-muted border-border";
        if (isLimitReached) {
          wordStatusText = `Đã đạt giới hạn tối đa (${words}/${maxLimit} từ)`;
          wordStatusColor = "text-destructive bg-destructive/10 border-destructive";
        } else if (words > 0) {
          if (words < targetMin) {
            wordStatusText = `Chưa đủ dung lượng (${words}/${isFormal ? 150 : 50} từ)`;
            wordStatusColor =
              "text-amber-700 bg-amber-500/10 border-amber-300 dark:text-amber-400";
          } else if (words <= targetMax) {
            wordStatusText = `Đạt chuẩn dung lượng (${words}/${isFormal ? 150 : 50} từ)`;
            wordStatusColor =
              "text-emerald-700 bg-emerald-500/10 border-emerald-300 dark:text-emerald-400";
          } else {
            wordStatusText = `Vượt số từ khuyến nghị (${words}/${maxLimit} từ)`;
            wordStatusColor =
              "text-blue-700 bg-blue-500/10 border-blue-300 dark:text-blue-400";
          }
        }

        return (
          <div
            key={q.questionNumber}
            className={`bg-card rounded-2xl border transition-all shadow-sm ${
              isLimitReached
                ? "border-destructive ring-1 ring-destructive"
                : isFormal
                ? "border-primary/30 ring-1 ring-primary/10"
                : "border-sky-300/40 ring-1 ring-sky-400/10"
            } p-5 md:p-6 space-y-4`}
          >
            {/* Header thông tin từng email */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                    isFormal
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-sky-600 text-white shadow-sm"
                  }`}
                >
                  {isFormal
                    ? "Task 2 — Formal Email (Trang trọng)"
                    : "Task 1 — Informal Email (Thân mật)"}
                </span>
                <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                  Thời gian gợi ý: ~{recommendedTime}
                </span>
              </div>

              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${wordStatusColor}`}
              >
                {wordStatusText}
              </span>
            </div>

            {/* Đề bài */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-semibold text-foreground block leading-relaxed">
                {q.prompt}
              </label>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">Yêu cầu chuẩn:</span>
                <span className="px-2 py-0.5 rounded-md bg-muted font-medium">
                  Mục tiêu: {recommendedWords}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-muted font-medium">
                  {isFormal
                    ? "Văn phong: Lịch sự, dùng Dear Mr/Ms..., không viết tắt, kết Yours sincerely"
                    : "Văn phong: Tự nhiên, thân thiện, dùng Hi/Hey, được viết tắt, kết Best/Cheers"}
                </span>
              </div>
            </div>

            {/* Vùng nhập bài viết */}
            <textarea
              rows={isFormal ? 9 : 5}
              value={val}
              readOnly={isReviewMode}
              onChange={(e) => onAnswerChange(answerKey, e.target.value, maxLimit)}
              placeholder={
                isFormal
                  ? "Dear Mr./Ms. [Tên quản lý],\n\nI am writing to express my view regarding the recent notice...\n\n[Giải thích cảm nghĩ và đề xuất 2-3 giải pháp cụ thể (120 - 150 từ, tối đa 225 từ)]\n\nI look forward to hearing from you soon.\n\nYours sincerely,\n[Tên của bạn]"
                  : "Hi [Tên bạn],\n\nDid you see the recent announcement about our club? I feel really...\n\n[Viết về cảm xúc và gợi ý câu lạc bộ nên làm gì (~50 từ, tối đa 75 từ)]\n\nTalk to you soon,\n[Tên của bạn]"
              }
              className={`w-full p-4 rounded-xl border bg-background text-foreground text-sm md:text-base focus-visible:outline-none focus-visible:ring-2 font-sans resize-y leading-relaxed transition-all shadow-inner ${
                isLimitReached
                  ? "border-destructive ring-1 ring-destructive focus-visible:ring-destructive"
                  : "border-input focus-visible:ring-primary"
              } ${isReviewMode ? "bg-muted/30 cursor-default" : ""}`}
            />

            {/* Thống kê số từ & độ tiến độ */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-2">
                <div className="w-24 sm:w-36 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isLimitReached
                        ? "bg-destructive"
                        : words >= targetMin && words <= targetMax
                        ? "bg-emerald-500"
                        : words > targetMax
                        ? "bg-blue-500"
                        : "bg-primary"
                    }`}
                    style={{
                      width: `${Math.min(100, (words / maxLimit) * 100)}%`,
                    }}
                  />
                </div>
                <span
                  className={`font-mono font-medium ${
                    isLimitReached ? "text-destructive font-bold" : ""
                  }`}
                >
                  {words} / {maxLimit} từ {isLimitReached && "(Khóa nhập)"}
                </span>
              </div>

              <span className="text-[11px] italic">
                {isFormal ? "Thang điểm chiếm 60% Part 4" : "Thang điểm chiếm 40% Part 4"}
              </span>
            </div>

            {/* Review Mode: Feedback & Sample Answer */}
            {isReviewMode &&
              (() => {
                const qAi = Array.isArray(aiResult?.ai_results)
                  ? aiResult.ai_results.find(
                      (r: any) =>
                        (q.id && String(r.question_id || r.questionId) === String(q.id)) ||
                        r.question_number === (isFormal ? 2 : 1)
                    ) || aiResult.ai_results[isFormal ? 1 : 0]
                  : null;
                const feedbackText =
                  qAi?.feedback || qAi?.general_feedback || qAi?.generalFeedback;

                return (
                  <div className="space-y-3 pt-3 border-t border-border">
                    {feedbackText && (
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between font-bold text-primary">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>
                              Nhận xét AI Kỳ Tích ({isFormal ? "Formal Email" : "Informal Email"}):
                            </span>
                          </span>
                          {(qAi.cefr_level || qAi.cefrLevel) && (
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-[10px] font-bold">
                              Band {qAi.cefr_level || qAi.cefrLevel}
                            </span>
                          )}
                        </div>
                        <p className="text-foreground leading-relaxed whitespace-pre-line">
                          {feedbackText}
                        </p>
                      </div>
                    )}

                    {q.sampleAnswer && (
                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1.5">
                        <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Bài mẫu tham khảo (Band B2 - C1):</span>
                        </div>
                        <p className="text-foreground/90 leading-relaxed font-sans whitespace-pre-line">
                          {q.sampleAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================================
 * WRITING REVIEW SIDEBAR & BOTTOM DOCK
 * ============================================================================ */

interface WritingReviewSidebarProps {
  aiEvaluationStatus: "idle" | "evaluating" | "completed";
  aiResult?: any;
  parts: WritingPart[];
  currentPartIdx: number;
  answers: Record<string, string>;
  onSelectPart: (idx: number) => void;
  onRestartExam: () => void;
}

export function WritingReviewSidebar({
  aiEvaluationStatus,
  aiResult,
  parts,
  currentPartIdx,
  answers,
  onSelectPart,
  onRestartExam,
}: WritingReviewSidebarProps) {
  return (
    <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <span>Mục lục xem lại</span>
          </h3>
          {aiEvaluationStatus === "evaluating" ? (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Đang chấm...</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Đã hoàn thành</span>
            </span>
          )}
        </div>

        {/* Trạng thái chấm ngầm hoặc Kết quả CEFR */}
        {aiEvaluationStatus === "evaluating" ? (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2 text-center animate-pulse">
            <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <h4 className="font-bold text-xs text-foreground">
              AI Kỳ Tích đang chấm bài viết
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Hệ thống đang phân tích Task Achievement, Coherence, Grammar &amp; Vocabulary
              (khoảng 30-60 giây).
            </p>
          </div>
        ) : aiResult ? (
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/30 text-center space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Trình độ ước tính CEFR
            </span>
            <div className="text-3xl font-heading font-black text-primary">
              {aiResult.cefr_level || "B2"}
            </div>
            <div className="text-xs font-bold text-foreground">
              Điểm Writing:{" "}
              <span className="text-primary font-black">
                {aiResult.writing_score != null
                  ? Math.round(aiResult.writing_score)
                  : aiResult.total_score != null
                  ? Math.round(aiResult.total_score)
                  : 40}
              </span>{" "}
              / 50
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed">
            Bài viết đã được lưu vào hệ thống. Bạn có thể tự đối chiếu với bài mẫu chuẩn CEFR
            bên cạnh.
          </div>
        )}

        {/* Mục lục danh sách các Part & Câu hỏi */}
        <div className="space-y-3 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Danh sách câu hỏi:
          </span>
          {parts.map((p, pIdx) => {
            const isCurrentP = currentPartIdx === pIdx;
            const answeredCount = p.questions.filter(
              (_, qIdx) => !!answers[`${pIdx}_${qIdx}`]
            ).length;

            return (
              <div
                key={p.partNumber}
                className={`p-3 rounded-xl border transition-all ${
                  isCurrentP
                    ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                    : "bg-card border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <button
                    type="button"
                    onClick={() => onSelectPart(pIdx)}
                    className="font-bold text-foreground hover:text-primary transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Part {p.partNumber}</span>
                    <span className="text-[11px] font-normal text-muted-foreground truncate max-w-[130px]">
                      · {p.partSubtitle}
                    </span>
                  </button>
                  <span className="text-[10px] font-mono font-medium text-muted-foreground">
                    {answeredCount}/{p.questions.length} câu
                  </span>
                </div>

                {/* Grid buttons câu hỏi */}
                <div className="flex flex-wrap gap-1.5">
                  {p.questions.map((_, qIdx) => {
                    const ans = answers[`${pIdx}_${qIdx}`];
                    const hasAnswer = Boolean(ans && ans.trim().length > 0);
                    const isCur = isCurrentP;

                    return (
                      <button
                        key={qIdx}
                        type="button"
                        onClick={() => onSelectPart(pIdx)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                          isCur
                            ? "bg-primary text-primary-foreground shadow-2xs font-black"
                            : hasAnswer
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30"
                            : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                        }`}
                        title={`Part ${p.partNumber} - Câu ${qIdx + 1}`}
                      >
                        {qIdx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-border space-y-2">
          <button
            type="button"
            onClick={onRestartExam}
            className="w-full py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm lại đề này từ đầu</span>
          </button>
          <Link
            href="/history"
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5 text-center cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Xem trong Lịch sử làm bài</span>
          </Link>
          <Link
            href="/writing"
            className="w-full py-2 rounded-xl text-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors block cursor-pointer"
          >
            Quay lại danh sách đề Writing
          </Link>
        </div>
      </div>
    </aside>
  );
}

interface WritingBottomDockProps {
  parts: WritingPart[];
  currentPartIdx: number;
  answers: Record<string, string>;
  flaggedParts?: Record<number, boolean>;
  aiQuota: number;
  onSelectPart: (idx: number) => void;
  onOpenSampleAnswers: () => void;
  onOpenReportModal: () => void;
  onOpenPartsDrawer: () => void;
  onSubmit: () => void;
}

export function WritingBottomDock({
  parts,
  currentPartIdx,
  answers,
  flaggedParts,
  aiQuota,
  onSelectPart,
  onOpenSampleAnswers,
  onOpenReportModal,
  onOpenPartsDrawer,
  onSubmit,
}: WritingBottomDockProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border px-4 md:px-8 py-3 flex items-center justify-between z-40 shadow-lg">
      {/* Left: Hiện đáp án & Báo lỗi */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenSampleAnswers}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 text-xs font-semibold transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Hiện đáp án</span>
        </button>

        <button
          type="button"
          onClick={onOpenReportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Báo lỗi</span>
        </button>
      </div>

      {/* Center: Quick Part Pills & Navigation Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="bg-muted/40 dark:bg-slate-800/60 p-1 rounded-2xl border border-border/80 shadow-2xs flex items-center gap-1 backdrop-blur-sm">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scrollbar-none scroll-smooth max-w-[42vw] sm:max-w-[44vw] md:max-w-[50vw] lg:max-w-[56vw] py-0.5 px-0.5">
            {parts.map((p, idx) => {
              const isCurrent = currentPartIdx === idx;
              const isAnswered = p.questions.some((_, qIdx) => {
                const val = answers[`${idx}_${qIdx}`];
                return val && val.trim().length > 0;
              });

              return (
                <button
                  key={p.partNumber}
                  id={`writing-part-pill-${idx}`}
                  type="button"
                  onClick={() => onSelectPart(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all duration-300 ease-out active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap select-none ${
                    isCurrent
                      ? "bg-primary text-primary-foreground font-black shadow-sm border border-primary"
                      : isAnswered
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/35 hover:bg-emerald-500/25"
                      : "bg-background/80 dark:bg-slate-900/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 hover:border-border"
                  }`}
                  title={p.partSubtitle}
                >
                  {isAnswered && !isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  )}
                  {flaggedParts?.[idx] && (
                    <Bookmark className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                  <span>Part {p.partNumber}</span>
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-border/70 shrink-0 mx-0.5 hidden sm:block" />

          <button
            type="button"
            onClick={onOpenPartsDrawer}
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center bg-background/80 dark:bg-slate-900/60 hover:bg-primary/10 hover:text-primary text-muted-foreground border border-border/70 hover:border-primary/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs shrink-0"
            title="Danh sách Parts"
            aria-label="Danh sách Parts"
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
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Còn {aiQuota} lượt chấm AI</span>
        </div>

        <button
          type="button"
          disabled={currentPartIdx === 0}
          onClick={() => onSelectPart(Math.max(0, currentPartIdx - 1))}
          className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
        >
          ← Previous
        </button>

        {currentPartIdx < parts.length - 1 ? (
          <button
            type="button"
            onClick={() => onSelectPart(Math.min(parts.length - 1, currentPartIdx + 1))}
            className="tech-btn px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            className="tech-btn inline-flex items-center gap-1.5 px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span>Submit &amp; Chấm AI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </footer>
  );
}
