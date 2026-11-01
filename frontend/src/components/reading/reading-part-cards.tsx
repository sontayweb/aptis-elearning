"use client";

import React from "react";
import Link from "next/link";
import {
  Check,
  X,
  AlertCircle,
  Sparkles,
  Highlighter,
  Trash2,
  BookOpen,
  Award,
  Eye,
  RotateCcw,
} from "lucide-react";
import { ReadingSentenceOrder } from "@/components/reading-components";
import type { ReadingExamData, Part2Story } from "@/data/reading-benchmark";

function stripHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

/* ============================================================================
 * READING RESULT SCREEN
 * ============================================================================ */

interface ReadingResultScreenProps {
  userFullName?: string | null;
  examId: string;
  cefrBand: string;
  resultScore: number;
  maxTotalScore: number;
  partScores: Array<{
    name: string;
    score: number;
    maxScore: number;
    correct: number;
    total: number;
  }>;
  isRestarting: boolean;
  onReviewDetails: () => void;
  onRestartExam: () => void;
}

export function ReadingResultScreen({
  userFullName,
  examId,
  cefrBand,
  resultScore,
  maxTotalScore,
  partScores,
  isRestarting,
  onReviewDetails,
  onRestartExam,
}: ReadingResultScreenProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in zoom-in-95">
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-md text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Award className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Kết Quả Kỹ Năng Reading
          </span>
          <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-foreground mt-1">
            BÁO CÁO ĐIỂM BÀI THI READING
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Thí sinh: {userFullName || "Thí sinh Aptis"} · Mã đề: {examId.toUpperCase()}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-transparent border border-primary/30 max-w-sm mx-auto">
          <span className="text-xs font-bold text-muted-foreground uppercase">
            Đánh giá theo khung CEFR
          </span>
          <div className="text-5xl font-heading font-black text-primary my-1">{cefrBand}</div>
          <p className="text-sm font-bold text-foreground">
            Điểm số: <span className="text-primary">{resultScore}</span> / {maxTotalScore}
          </p>
        </div>

        {/* Part Breakdown Table */}
        <div className="space-y-3 text-left">
          <h3 className="font-heading font-bold text-sm text-foreground">
            Chi tiết điểm từng phần:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {partScores.map((ps, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-foreground">{ps.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Đúng {ps.correct}/{ps.total} mục
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-primary">
                    {ps.score} / {ps.maxScore}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">Điểm</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-border flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onReviewDetails}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-brand-brown transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Xem lại chi tiết bài làm</span>
          </button>

          <button
            type="button"
            onClick={onRestartExam}
            disabled={isRestarting}
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm lại đề này</span>
          </button>

          <Link
            href="/history"
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
          >
            Lịch sử làm bài
          </Link>

          <Link
            href="/reading"
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
          >
            Về danh sách đề Reading
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * PART 1: GAP FILL (Sentence Comprehension)
 * ============================================================================ */

interface ReadingPart1CardProps {
  part1: ReadingExamData["part1"];
  p1Answers: Record<string, string>;
  setP1Answers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isReviewMode: boolean;
}

export function ReadingPart1Card({
  part1,
  p1Answers,
  setP1Answers,
  isReviewMode,
}: ReadingPart1CardProps) {
  return (
    <div className="space-y-6">
      {/* Example Sentence */}
      {Boolean(part1.exampleText?.word) && (
        <div className="p-4 rounded-xl border border-border/70 bg-card/60 flex items-center gap-2 flex-wrap text-sm md:text-base">
          <span>{stripHtml(part1.exampleText.prefix)}</span>
          <span className="px-3 py-1 rounded-md border border-border bg-muted/60 text-muted-foreground font-bold text-xs select-none">
            {stripHtml(part1.exampleText.word)}
          </span>
          <span>{stripHtml(part1.exampleText.suffix)}</span>
          <span className="text-[11px] text-muted-foreground italic ml-2">
            (Câu ví dụ mẫu)
          </span>
        </div>
      )}

      {/* Gaps List */}
      <div className="space-y-4">
        {part1.gaps.map((gap, gIdx) => {
          const cleanPrompt = stripHtml(gap.prompt);
          const hasGapMarker = /\[(?:gap|blank|\.\.\.)\]|tienphongSpace/i.test(cleanPrompt);
          let beforeGap = cleanPrompt;
          let afterGap = "";

          if (hasGapMarker) {
            const split = cleanPrompt.split(/\[(?:gap|blank|\.\.\.)\]|tienphongSpace/i);
            beforeGap = split[0];
            afterGap = split[1] || "";
          } else if (
            gap.correctAnswer &&
            cleanPrompt.toLowerCase().includes(gap.correctAnswer.toLowerCase())
          ) {
            const regex = new RegExp(`\\b${gap.correctAnswer}\\b`, "i");
            const split = cleanPrompt.split(regex);
            beforeGap = split[0];
            afterGap = split[1] || "";
          }

          const userVal = p1Answers[gap.id] || "";
          const isCorrect =
            userVal && userVal.toLowerCase() === gap.correctAnswer.toLowerCase();

          return (
            <div
              key={gap.id}
              className={`p-4 md:p-5 rounded-2xl border transition-all flex flex-wrap items-center gap-3 text-sm md:text-base leading-relaxed shadow-2xs ${
                isReviewMode
                  ? isCorrect
                    ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20"
                    : "border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <span className="font-extrabold text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-lg shrink-0">
                Câu {gIdx + 1}
              </span>
              <span>{beforeGap}</span>
              <select
                value={userVal}
                disabled={isReviewMode}
                onChange={(e) =>
                  setP1Answers((prev) => ({
                    ...prev,
                    [gap.id]: e.target.value,
                  }))
                }
                className={`px-3 py-1.5 rounded-xl border text-sm font-semibold transition-all outline-none shadow-2xs ${
                  isReviewMode
                    ? isCorrect
                      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold"
                      : "border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 font-bold"
                    : userVal
                    ? "border-primary bg-primary/10 text-primary font-bold cursor-pointer"
                    : "border-border bg-background text-muted-foreground hover:border-primary/60 cursor-pointer"
                }`}
              >
                <option value="">— Chọn từ khuyết —</option>
                {gap.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span>{afterGap}</span>

              {/* Review Mode Answer Feedback */}
              {isReviewMode && (
                <div className="w-full flex items-center gap-2 pt-2 border-t border-border/50 text-xs">
                  {userVal ? (
                    isCorrect ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3.5 h-3.5" /> Bạn đã chọn đúng
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                        <X className="w-3.5 h-3.5" /> Bạn chọn:{" "}
                        <span className="line-through">{userVal}</span> · Đáp án đúng:{" "}
                        <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm underline">
                          {gap.correctAnswer}
                        </strong>
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5" /> Chưa chọn đáp án · Đáp án đúng:{" "}
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm underline">
                        {gap.correctAnswer}
                      </strong>
                    </span>
                  )}
                </div>
              )}

              {/* Lời giải thích từ giáo viên */}
              {isReviewMode && gap.explanation && gap.explanation.trim() && (
                <div className="w-full mt-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground/90 space-y-1 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Giải thích chi tiết</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{gap.explanation.trim()}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
 * PART 2: TEXT COHESION (Sentence Ordering)
 * ============================================================================ */

interface ReadingPart2CardProps {
  story?: Part2Story;
  p2Orders: Record<string, string[]>;
  setP2Orders: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  isReviewMode: boolean;
}

export function ReadingPart2Card({
  story,
  p2Orders,
  setP2Orders,
  isReviewMode,
}: ReadingPart2CardProps) {
  if (!story) return null;
  const currentOrder = p2Orders[story.id] || [];

  return (
    <div className="space-y-4">
      <ReadingSentenceOrder
        key={story.id}
        title={story.title}
        fixedSentence={story.fixedSentence}
        sentences={story.sentences}
        currentOrder={currentOrder}
        isReviewMode={isReviewMode}
        correctOrder={story.correctOrder}
        onChangeOrder={(newOrder) =>
          setP2Orders((prev) => ({
            ...prev,
            [story.id]: newOrder,
          }))
        }
      />
      {isReviewMode && story.explanation && story.explanation.trim() && (
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-foreground/90 space-y-1.5 animate-in fade-in">
          <div className="flex items-center gap-1.5 font-bold text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Giải thích logic sắp xếp &amp; Từ nối</span>
          </div>
          <p className="leading-relaxed whitespace-pre-wrap">{story.explanation.trim()}</p>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * PART 3: OPINION MATCHING (4 Reviews, 7 Questions)
 * ============================================================================ */

interface ReadingPart3CardProps {
  part3: ReadingExamData["part3"];
  stageLabel?: string;
  p3Answers: Record<string, string>;
  setP3Answers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isReviewMode: boolean;
  onTextSelection: (itemId: string) => void;
  onClearHighlights: (itemIds: string[]) => void;
  renderHighlightedContent: (text: string, itemId: string) => React.ReactNode;
}

export function ReadingPart3Card({
  part3,
  stageLabel,
  p3Answers,
  setP3Answers,
  isReviewMode,
  onTextSelection,
  onClearHighlights,
  renderHighlightedContent,
}: ReadingPart3CardProps) {
  return (
    <div className="space-y-6">
      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-primary block">
            {stageLabel || part3.title}
          </span>
          <p className="text-xs text-foreground">{part3.instructions}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Highlighter className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Bôi đen chữ để highlight</span>
          </span>
          <button
            type="button"
            onClick={() => onClearHighlights(part3.reviews.map((r) => r.person))}
            className="px-2 py-1 rounded-lg border border-border hover:bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3 text-destructive" />
            <span>Xóa highlight</span>
          </button>
        </div>
      </div>

      {/* 4 Review Cards */}
      <div
        className={`grid gap-4 ${
          part3.reviews.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
        }`}
      >
        {part3.reviews.map((rev) => (
          <div
            key={rev.person}
            className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-2xs select-text"
            onMouseUp={() => onTextSelection(rev.person)}
            onTouchEnd={() => onTextSelection(rev.person)}
          >
            <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-xs inline-block">
              {rev.name || rev.person}
            </span>
            <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans">
              {renderHighlightedContent(rev.review, rev.person)}
            </p>
          </div>
        ))}
      </div>

      {/* 7 Questions */}
      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Chọn người có ý kiến tương ứng:
        </h4>
        {part3.questions.map((q, qIdx) => {
          const userVal = p3Answers[q.id];
          const isCorrect =
            userVal && userVal.toLowerCase() === q.correctAnswer.toLowerCase();

          return (
            <div
              key={q.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                isReviewMode
                  ? isCorrect
                    ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20"
                    : "border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded mt-0.5">
                  {qIdx + 1}
                </span>
                <div>
                  <p className="text-xs md:text-sm font-semibold text-foreground">
                    {q.prompt}
                  </p>
                  {isReviewMode && (
                    <div className="pt-1.5 text-xs">
                      {userVal ? (
                        isCorrect ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Bạn chọn đúng ({q.correctAnswer})
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-bold inline-flex items-center gap-1.5">
                            <X className="w-3.5 h-3.5" /> Bạn chọn: {userVal} · Đáp án đúng:{" "}
                            <strong className="text-emerald-600 dark:text-emerald-400 underline">
                              {q.correctAnswer}
                            </strong>
                          </span>
                        )
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-bold inline-flex items-center gap-1.5">
                          Chưa trả lời · Đáp án đúng:{" "}
                          <strong className="text-emerald-600 dark:text-emerald-400 underline">
                            {q.correctAnswer}
                          </strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Lời giải thích / Dẫn chứng */}
                  {isReviewMode && q.explanation && q.explanation.trim() && (
                    <div className="mt-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground/90 space-y-1 animate-in fade-in">
                      <div className="flex items-center gap-1.5 font-bold text-primary">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Dẫn chứng &amp; Giải thích</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{q.explanation.trim()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 4 Pill Options */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                {["Person A", "Person B", "Person C", "Person D"].map((opt) => {
                  const isSelected = userVal === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isReviewMode}
                      onClick={() =>
                        setP3Answers((prev) => ({
                          ...prev,
                          [q.id]: opt,
                        }))
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? isReviewMode
                            ? isCorrect
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-rose-600 text-white shadow-xs"
                            : "bg-primary text-primary-foreground shadow-xs scale-105"
                          : "border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.replace("Person ", "")}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
 * PART 4: LONG READING (Paragraphs & Headings Dropdowns)
 * ============================================================================ */

interface ReadingPart4CardProps {
  part4: ReadingExamData["part4"];
  stageLabel?: string;
  p4Answers: Record<string, string>;
  setP4Answers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isReviewMode: boolean;
  onTextSelection: (itemId: string) => void;
  onClearHighlights: (itemIds: string[]) => void;
  renderHighlightedContent: (text: string, itemId: string) => React.ReactNode;
}

export function ReadingPart4Card({
  part4,
  stageLabel,
  p4Answers,
  setP4Answers,
  isReviewMode,
  onTextSelection,
  onClearHighlights,
  renderHighlightedContent,
}: ReadingPart4CardProps) {
  return (
    <div className="space-y-6">
      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-1">
          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{stageLabel || part4.title}</span>
          </span>
          <p className="text-xs text-foreground">{part4.instructions}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Highlighter className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Bôi đen chữ để highlight</span>
          </span>
          <button
            type="button"
            onClick={() => onClearHighlights(part4.paragraphs.map((p) => p.id))}
            className="px-2 py-1 rounded-lg border border-border hover:bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3 text-destructive" />
            <span>Xóa highlight</span>
          </button>
        </div>
      </div>

      {/* Reference Headings List */}
      <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          Danh sách tiêu đề Heading có sẵn:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-foreground/80">
          {part4.allHeadings.map((h, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="font-bold text-primary shrink-0">•</span>
              <span>{h}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 7 Paragraphs with Selects */}
      <div className="space-y-5">
        {part4.paragraphs.map((p) => {
          const userVal = p4Answers[p.id] || "";
          const isCorrect =
            userVal && userVal.toLowerCase() === p.correctHeading.toLowerCase();

          return (
            <div
              key={p.id}
              className={`p-5 rounded-xl border space-y-3 shadow-2xs ${
                isReviewMode
                  ? isCorrect
                    ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20"
                    : "border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/20"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                <span className="font-bold text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-md inline-block">
                  Đoạn văn {p.paragraphNumber}
                </span>

                <select
                  value={userVal}
                  disabled={isReviewMode}
                  onChange={(e) =>
                    setP4Answers((prev) => ({
                      ...prev,
                      [p.id]: e.target.value,
                    }))
                  }
                  className={`w-full sm:max-w-md px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all outline-none truncate ${
                    isReviewMode
                      ? isCorrect
                        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold"
                        : "border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 font-bold"
                      : userVal
                      ? "border-primary bg-primary/10 text-primary cursor-pointer"
                      : "border-border bg-card text-muted-foreground hover:border-primary/60 cursor-pointer"
                  }`}
                >
                  <option value="">— Chọn tiêu đề phù hợp —</option>
                  {part4.allHeadings.map((h, hIdx) => (
                    <option key={hIdx} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {isReviewMode && (
                <div className="text-xs font-semibold pb-1">
                  {userVal ? (
                    isCorrect ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Đúng tiêu đề: {p.correctHeading}
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-bold inline-flex items-center gap-1.5">
                        <X className="w-3.5 h-3.5" /> Bạn chọn: {userVal} · Tiêu đề đúng:{" "}
                        <strong className="text-emerald-600 dark:text-emerald-400 underline">
                          {p.correctHeading}
                        </strong>
                      </span>
                    )
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-bold inline-flex items-center gap-1.5">
                      Chưa chọn tiêu đề · Tiêu đề đúng:{" "}
                      <strong className="text-emerald-600 dark:text-emerald-400 underline">
                        {p.correctHeading}
                      </strong>
                    </span>
                  )}
                </div>
              )}

              {/* Lời giải thích tiêu đề */}
              {isReviewMode && p.explanation && p.explanation.trim() && (
                <div className="mt-2 mb-3 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground/90 space-y-1 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Dẫn chứng &amp; Ý chính đoạn văn</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{p.explanation.trim()}</p>
                </div>
              )}

              <p
                className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans select-text"
                onMouseUp={() => onTextSelection(p.id)}
                onTouchEnd={() => onTextSelection(p.id)}
              >
                {renderHighlightedContent(p.text, p.id)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

