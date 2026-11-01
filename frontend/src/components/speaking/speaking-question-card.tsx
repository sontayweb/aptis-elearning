"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  Star,
  FileEdit,
  Info,
  Trophy,
  ExternalLink,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import type {
  SpeakingQuestion,
  VocabularyHintData,
  HallOfFameCardItem,
} from "@/lib/speaking/speaking-exam-utils";
import { formatTimerDisplay } from "@/lib/speaking/speaking-exam-utils";

export interface SpeakingQuestionCardProps {
  currentQ: SpeakingQuestion;
  indexInPart: number;
  totalInPart: number;
  vocabHints: VocabularyHintData;
  stage: "ready" | "prep" | "speaking" | "finished";
  timer: number;
  prepNotes: string;
  setPrepNotes: (notes: string) => void;
  showSampleAnswer: boolean;
  currentGuidance?: string;
  sampleTab: "b1" | "b2";
  setSampleTab: (tab: "b1" | "b2") => void;
  currentSampleText: string;
  sampleWordCount: number;
  totalHofCount: number;
  hofBandTab: "B1" | "B2" | "C";
  setHofBandTab: (band: "B1" | "B2" | "C") => void;
  b1Hof: HallOfFameCardItem[];
  b2Hof: HallOfFameCardItem[];
  cHof: HallOfFameCardItem[];
  displayedHofCards: HallOfFameCardItem[];
  currentHofList: HallOfFameCardItem[];
  setHofOffset: React.Dispatch<React.SetStateAction<number>>;
  setIsProModalOpen: (open: boolean) => void;
  isReviewMode: boolean;
  currentIndex: number;
  totalQuestions: number;
  onPrevQuestion: () => void;
  onNextQuestion: () => void;
}

export function SpeakingQuestionCard({
  currentQ,
  indexInPart,
  totalInPart,
  vocabHints,
  stage,
  timer,
  prepNotes,
  setPrepNotes,
  showSampleAnswer,
  currentGuidance,
  sampleTab,
  setSampleTab,
  currentSampleText,
  sampleWordCount,
  totalHofCount,
  hofBandTab,
  setHofBandTab,
  b1Hof,
  b2Hof,
  cHof,
  displayedHofCards,
  currentHofList,
  setHofOffset,
  setIsProModalOpen,
  isReviewMode,
  currentIndex,
  totalQuestions,
  onPrevQuestion,
  onNextQuestion,
}: SpeakingQuestionCardProps) {
  return (
    <div className="flex-1 w-full space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xs space-y-6">
        {/* Question header */}
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">Speaking</span>
          <h2 className="font-heading font-bold text-lg md:text-xl text-foreground">
            {currentQ.partNumber === 4
              ? "Part 4 of 4"
              : `Question ${indexInPart + 1} of ${totalInPart}`}
          </h2>
        </div>

        {/* PART 1: Direct prompt */}
        {currentQ.partNumber === 1 && (
          <div className="space-y-4">
            <p className="text-base md:text-lg text-foreground font-semibold leading-relaxed">
              {currentQ.prompt}
            </p>
          </div>
        )}

        {/* PART 2: Single Picture + Side Vocabulary Box */}
        {currentQ.partNumber === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column (7 cols): Picture & Prompt */}
              <div className="lg:col-span-7 space-y-3">
                {currentQ.imageUrl && (
                  <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 aspect-[16/10] shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentQ.imageUrl}
                      alt="Speaking Aptis Prompt 1"
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                )}
                <p className="text-base md:text-lg text-foreground font-semibold leading-relaxed pt-1">
                  {currentQ.prompt}
                </p>
              </div>

              {/* Right Column (5 cols): Vocabulary & Collocations Box */}
              <div className="lg:col-span-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 md:p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-primary/15 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-primary">
                      Gợi Ý Từ Vựng & Collocations
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold text-primary/80 uppercase">Aim B1 - B2</span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground/80 block">
                    Từ khóa ăn điểm (Collocations):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {vocabHints.keywords.map((kw, kwIdx) => (
                      <span
                        key={kwIdx}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-background border border-primary/20 text-foreground shadow-2xs hover:border-primary/50 transition-colors"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-semibold text-foreground/80 block">
                    Mẫu câu mở đầu phản xạ:
                  </span>
                  <div className="space-y-1.5">
                    {vocabHints.startingPhrases.map((phrase, pIdx) => (
                      <p
                        key={pIdx}
                        className="text-xs text-foreground/90 bg-background/80 p-2 rounded-lg border border-border/60 leading-relaxed font-sans"
                      >
                        &ldquo;{phrase}&rdquo;
                      </p>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-semibold text-foreground/80 block">
                    Mẫu câu mở rộng ý:
                  </span>
                  <div className="space-y-1.5">
                    {vocabHints.linkingPhrases.map((phrase, pIdx) => (
                      <p
                        key={pIdx}
                        className="text-xs text-foreground/90 bg-background/80 p-2 rounded-lg border border-border/60 leading-relaxed font-sans"
                      >
                        &ldquo;{phrase}&rdquo;
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PART 3: Two Contrasting Pictures + Vocabulary & Comparison Box */}
        {currentQ.partNumber === 3 && (
          <div className="space-y-4">
            {currentQ.secondImageUrl ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 aspect-[16/10] shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentQ.imageUrl || undefined}
                    alt="Speaking Aptis Prompt 1"
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-md bg-black/60 text-white font-bold text-xs backdrop-blur-xs">
                    Picture 1
                  </span>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 aspect-[16/10] shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentQ.secondImageUrl}
                    alt="Speaking Aptis Prompt 2"
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-md bg-black/60 text-white font-bold text-xs backdrop-blur-xs">
                    Picture 2
                  </span>
                </div>
              </div>
            ) : currentQ.imageUrl ? (
              <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-sm max-h-[460px] flex items-center justify-center bg-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentQ.imageUrl}
                  alt="Speaking Aptis Comparison"
                  className="w-full h-auto max-h-[460px] object-contain transition-transform duration-300 hover:scale-[1.02]"
                />
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-black/75 text-white font-bold text-xs backdrop-blur-md border border-white/20 shadow-md">
                    Picture 1 vs Picture 2 · So sánh hai bức ảnh
                  </span>
                </div>
              </div>
            ) : null}

            <p className="text-base md:text-lg text-foreground font-semibold leading-relaxed">
              {currentQ.prompt}
            </p>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 md:p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-primary/15 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-primary">
                    Gợi Ý So Sánh Đối Lập & Cấu Trúc Ăn Điểm Part 3
                  </h4>
                </div>
                <span className="text-[10px] font-semibold text-primary/80 uppercase">Aim B1 - B2</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-foreground/80 block">Collocations đối lập:</span>
                  <div className="flex flex-wrap gap-1">
                    {vocabHints.keywords.map((kw, kwIdx) => (
                      <span
                        key={kwIdx}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-background border border-primary/20 text-foreground"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <span className="text-xs font-semibold text-foreground/80 block">
                    Mẫu câu so sánh & đối chiếu (Compare & Contrast):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {vocabHints.startingPhrases.concat(vocabHints.linkingPhrases).slice(0, 4).map((phrase, pIdx) => (
                      <p
                        key={pIdx}
                        className="text-xs text-foreground/90 bg-background/80 p-2 rounded-lg border border-border/60 leading-relaxed font-sans"
                      >
                        &ldquo;{phrase}&rdquo;
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PART 4: Topic Box + Image + 3 Questions simultaneously + Stickers */}
        {currentQ.partNumber === 4 && (() => {
          const part4QuestionsList = (() => {
            const sub = currentQ.subQuestions;
            if (sub && sub.length >= 3) {
              return sub.slice(0, 3);
            }
            if (sub && sub.length > 0) {
              const list = [...sub];
              if (list.length === 1) {
                list.push("How did you feel about this situation and what did you learn from it?");
                list.push("Do you think this experience is common for many people today? Why?");
              } else if (list.length === 2) {
                list.push("Why do you think this is important to consider for the future?");
              }
              return list;
            }
            const lines = (currentQ.prompt || "")
              .split(/(?:\n+|(?<=\?)\s+)/)
              .map((s) => s.trim().replace(/^[-•*0-9.]+\s*/, ""))
              .filter(Boolean);
            if (lines.length >= 3) return lines.slice(0, 3);
            if (lines.length === 2) return [...lines, "Why do you think this situation is significant?"];
            return [
              currentQ.prompt || "Tell me about a personal experience related to this topic.",
              "How did you feel about this situation at that time?",
              "Do you think this issue will change in the future? Why or why not?",
            ];
          })();

          return (
            <div className="rounded-2xl bg-muted/30 border-2 border-primary/40 p-5 md:p-6 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  2 phút / 3 câu - trả lời liên tục
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 font-extrabold text-xs border border-rose-500/30">
                  <Star className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  ★★★★★ Hay ra
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs">
                  1 phút chuẩn bị + 2 phút nói liên tục
                </span>
              </div>

              <div className="border-b border-border/50 pb-2">
                <h3 className="font-heading font-extrabold text-base md:text-lg text-foreground">
                  Topic: {currentQ.topic || "Personal Experience & Opinion"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cả 3 câu hỏi dưới đây được hiển thị cùng lúc trên màn hình thi. Hãy chuẩn bị ghi chú trong 1 phút và nói liên tục trong 2 phút.
                </p>
              </div>

              {/* Khung ghi chú dàn ý 1 phút chuẩn British Council Part 4 */}
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 md:p-5 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FileEdit className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Khung ghi chú dàn ý (Preparation Notes)
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      stage === "prep"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                        : stage === "speaking"
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 animate-pulse"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {stage === "prep"
                      ? `Đang chuẩn bị: còn ${formatTimerDisplay(timer)}`
                      : stage === "speaking"
                      ? `Đang ghi âm (${formatTimerDisplay(timer)}) - Dựa vào dàn ý để phát biểu`
                      : "Đã hoàn thành"}
                  </span>
                </div>
                <textarea
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  placeholder="Nháp nhanh các ý tưởng, từ vựng khóa cho 3 câu hỏi trên trong 1 phút chuẩn bị...&#10;• Ý 1: ...&#10;• Ý 2: ...&#10;• Ý 3: ..."
                  className="w-full h-28 md:h-32 p-3 rounded-xl border border-border bg-background text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none font-sans leading-relaxed shadow-inner"
                />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                  <span>💡 Ghi chú này luôn hiển thị trong suốt 2 phút nói để bạn tự tin nhìn theo.</span>
                  <span>{prepNotes.trim().length} ký tự</span>
                </div>
              </div>

              {/* 3 câu hỏi hiển thị cùng lúc */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  3 Câu hỏi trả lời liên tục trong 2 phút:
                </span>
                {part4QuestionsList.map((sub, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3.5 rounded-xl bg-background border border-border/80 shadow-xs flex items-start gap-3 transition-all hover:border-primary/40"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/15 text-primary font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {sIdx + 1}
                    </span>
                    <p className="text-xs md:text-sm text-foreground font-semibold leading-relaxed">
                      {sub}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  You now have one minute to think about your answers and take notes. When the time begins, you have two minutes to speak without stopping.
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Vocabulary hints from dataset */}
      {currentQ.vocabulary && currentQ.vocabulary.length > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 md:p-5 space-y-3 shadow-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-primary/15 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-primary">
                Từ vựng & Cụm từ gợi ý (Vocabulary & Collocations)
              </h4>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">
              {currentQ.vocabulary.length} cụm từ
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {currentQ.vocabulary.map((v, vIdx) => (
              <div
                key={vIdx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-foreground text-xs shadow-2xs hover:border-primary/40 transition-colors"
              >
                <span className="font-bold text-primary">{v.en}</span>
                {v.vi && <span className="text-muted-foreground text-[11px]">({v.vi})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sample Answer Box */}
      {showSampleAnswer && (
        <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-foreground">
                BÀI NÓI MẪU
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">
              Chuẩn chấm điểm Aptis ESOL
            </span>
          </div>

          {currentGuidance && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <span className="font-bold">Gợi ý dàn ý: </span>
                <span>{currentGuidance}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 p-1 rounded-xl bg-muted/60 border border-border text-xs gap-1">
            <button
              type="button"
              onClick={() => setSampleTab("b1")}
              className={`py-2 px-3 rounded-lg font-bold text-left transition-all cursor-pointer ${
                sampleTab === "b1"
                  ? "bg-foreground text-background shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="font-bold">Bản dễ học</div>
              <div className="text-[10px] opacity-80 font-normal">Phù hợp aim B1</div>
            </button>

            <button
              type="button"
              onClick={() => setSampleTab("b2")}
              className={`py-2 px-3 rounded-lg font-bold text-left transition-all cursor-pointer ${
                sampleTab === "b2"
                  ? "bg-foreground text-background shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="font-bold">Bản nâng cao</div>
              <div className="text-[10px] opacity-80 font-normal">
                Phù hợp aim B2 trở lên - câu phong phú hơn
              </div>
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans">
              {currentSampleText}
            </p>
            <div className="text-[11px] text-muted-foreground font-mono pt-1">
              {sampleWordCount} từ · nói vừa đủ {currentQ.speakTime || 30} giây
            </div>
          </div>
        </div>
      )}

      {/* Hall of Fame Box */}
      {showSampleAnswer && (
        <div className="rounded-2xl border border-amber-500/25 bg-card p-5 md:p-6 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-foreground">
                BẢNG KỲ TÍCH · {totalHofCount} bài
              </h3>
            </div>
            <Link
              href="/bang-ky-tich"
              target="_blank"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Xem Bảng Kỳ Tích</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setHofBandTab("B1");
                setHofOffset(0);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                hofBandTab === "B1"
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-muted/60 border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              B1 ({b1Hof.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setHofBandTab("B2");
                setHofOffset(0);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                hofBandTab === "B2"
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-muted/60 border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              B2 ({b2Hof.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setHofBandTab("C");
                setHofOffset(0);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                hofBandTab === "C"
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-muted/60 border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              C ({cHof.length})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {displayedHofCards.map((card) => (
              <div
                key={card.id}
                onClick={() => setIsProModalOpen(true)}
                className="rounded-xl border border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/60 p-4 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{card.band}</span>
                  <span className="font-mono text-muted-foreground text-[11px]">{card.score}</span>
                </div>

                <p className="text-xs text-foreground/80 leading-relaxed line-clamp-4">
                  {card.text}
                </p>

                <div className="text-[11px] text-muted-foreground font-medium pt-1 border-t border-border/40">
                  {card.author}
                </div>
              </div>
            ))}
          </div>

          {currentHofList.length > 3 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setHofOffset((prev) => prev + 1)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đổi 3 bài khác</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Review Mode Question Navigation */}
      {isReviewMode && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => {
              onPrevQuestion();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Câu trước</span>
          </button>
          <span className="text-xs font-bold text-muted-foreground">
            Câu {currentIndex + 1} / {totalQuestions} (Part {currentQ.partNumber})
          </span>
          <button
            type="button"
            disabled={currentIndex === totalQuestions - 1}
            onClick={() => {
              onNextQuestion();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="tech-btn px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Câu tiếp</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

