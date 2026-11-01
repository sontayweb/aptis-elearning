"use client";

import React from "react";
import {
  Sparkles,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Mic,
  Check,
  CheckCircle2,
  Volume2,
  ChevronDown,
} from "lucide-react";
import type { SpeakingQuestion } from "@/lib/speaking/speaking-exam-utils";
import { formatTimerDisplay } from "@/lib/speaking/speaking-exam-utils";
import { SpeakingAudioPlayer } from "@/components/speaking/speaking-audio-player";

export interface SpeakingRecorderConsoleProps {
  isReviewMode: boolean;
  questions: SpeakingQuestion[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  recordedData: Record<
    number,
    {
      audioUrl?: string | null;
      audioBlob?: Blob | null;
      duration?: number;
      aiResult?: any;
      prepNotes?: string;
      isCompleted?: boolean;
    }
  >;
  setIsSubmitted: (sub: boolean) => void;
  stage: "ready" | "prep" | "speaking" | "finished";
  currentQ: SpeakingQuestion;
  timer: number;
  setTimer: (t: number) => void;
  isPrepPaused: boolean;
  setIsPrepPaused: React.Dispatch<React.SetStateAction<boolean>>;
  handleStartSpeakingNow: () => void;
  handleStartPrep: () => void;
  isSpeakingPaused: boolean;
  isMicPaused: boolean;
  volumeLevel: number;
  handleToggleSpeakingPause: () => void;
  handleRetakeSpeaking: () => void;
  handleStopSpeakingEarly: () => void;
  currentDuration: number;
  currentAudioUrl?: string | null;
  handleRetry: () => void;
  handleAIEvaluation: () => void;
  isEvaluating: boolean;
  currentAiResult: any;
  showDetailedFeedback: boolean;
  setShowDetailedFeedback: React.Dispatch<React.SetStateAction<boolean>>;
}

export function SpeakingRecorderConsole({
  isReviewMode,
  questions,
  currentIndex,
  setCurrentIndex,
  recordedData,
  setIsSubmitted,
  stage,
  currentQ,
  timer,
  setTimer,
  isPrepPaused,
  setIsPrepPaused,
  handleStartSpeakingNow,
  handleStartPrep,
  isSpeakingPaused,
  isMicPaused,
  volumeLevel,
  handleToggleSpeakingPause,
  handleRetakeSpeaking,
  handleStopSpeakingEarly,
  currentDuration,
  currentAudioUrl,
  handleRetry,
  handleAIEvaluation,
  isEvaluating,
  currentAiResult,
  showDetailedFeedback,
  setShowDetailedFeedback,
}: SpeakingRecorderConsoleProps) {
  return (
    <div className="w-full lg:w-80 shrink-0 space-y-4">
      {/* Review Mode Table of Contents */}
      {isReviewMode && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3 sticky top-20">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h4 className="font-heading font-black text-xs uppercase tracking-wider text-foreground">
                Mục lục xem lại
              </h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
              {questions.filter((_, i) => !!recordedData[i]?.audioUrl).length}/{questions.length} câu đã nói
            </span>
          </div>

          <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-0.5">
            {[1, 2, 3, 4].map((pNum) => {
              const partQuestions = questions
                .map((q, idx) => ({ q, idx }))
                .filter(({ q }) => q.partNumber === pNum);

              if (partQuestions.length === 0) return null;

              return (
                <div key={pNum} className="space-y-1.5">
                  <div className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
                    <span>Part {pNum}</span>
                    <span className="text-[10px] font-normal">{partQuestions.length} câu</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {partQuestions.map(({ q, idx }) => {
                      const isCurrent = currentIndex === idx;
                      const rec = recordedData[idx];
                      const hasAudio = Boolean(rec?.audioUrl);
                      const hasAi = Boolean(rec?.aiResult);

                      return (
                        <button
                          key={q.id || idx}
                          type="button"
                          onClick={() => {
                            setCurrentIndex(idx);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                            isCurrent
                              ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/30 shadow-xs"
                              : hasAudio
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                              : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                          }`}
                          title={`Câu ${idx + 1}${hasAi ? ` - Điểm AI: ${rec.aiResult.score}/50` : ""}`}
                        >
                          <span>Câu {idx + 1}</span>
                          {hasAi && (
                            <span className="text-[10px] opacity-90 font-mono">({rec.aiResult.score})</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setIsSubmitted(true)}
              className="w-full py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors cursor-pointer"
            >
              Xem báo cáo điểm tổng quan
            </button>
          </div>
        </div>
      )}

      {/* 0. STAGE: READY */}
      {stage === "ready" && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h4 className="font-heading font-bold text-sm text-foreground">Sẵn sàng làm bài</h4>
            <p className="text-[11px] text-muted-foreground">
              {currentQ.partNumber === 4
                ? "Part 4 có 1 phút chuẩn bị dàn ý và 2 phút nói liên tục."
                : `Phần này có ${currentQ.prepTime || 5}s chuẩn bị và ${currentQ.speakTime || 30}s nói.`}
            </p>
          </div>

          <div className="w-full space-y-2 pt-1">
            <button
              type="button"
              onClick={handleStartPrep}
              className="tech-btn w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Bắt đầu (Chạy giờ chuẩn bị)</span>
            </button>

            <button
              type="button"
              onClick={handleStartSpeakingNow}
              className="w-full py-2 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-primary" />
              <span>Sẵn sàng (Nói luôn)</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. STAGE: PREPARATION COUNTDOWN */}
      {stage === "prep" && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>
              {currentQ.partNumber === 4
                ? "Chuẩn Bị 1 Phút (Part 4)"
                : `Chuẩn Bị Part ${currentQ.partNumber}`}
            </span>
          </div>

          {/* Circular Countdown Timer */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                className="text-muted/30"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={264}
                strokeDashoffset={264 - (264 * timer) / (currentQ.prepTime || 60)}
                strokeLinecap="round"
                className="text-amber-500 transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black font-heading text-foreground">
                {formatTimerDisplay(timer)}
              </span>
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                {isPrepPaused ? "Đang tạm dừng" : "Đang chuẩn bị"}
              </span>
            </div>
          </div>

          {/* Controls: Pause / Resume */}
          <div className="w-full space-y-2 pt-1 border-t border-border/60">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
              <span>Thời gian:</span>
              <button
                type="button"
                onClick={() => setIsPrepPaused((p) => !p)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-border bg-muted/60 hover:bg-muted text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isPrepPaused ? (
                  <>
                    <Play className="w-3 h-3 text-emerald-500" />
                    <span>Tiếp tục</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 text-amber-500" />
                    <span>Tạm dừng</span>
                  </>
                )}
              </button>
            </div>

            {/* Part 4 Preset Buttons */}
            {currentQ.partNumber === 4 && (
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { label: "60s", val: 60, title: "Chuẩn thi thật British Council" },
                  { label: "45s", val: 45, title: "Luyện phản xạ nhanh" },
                  { label: "30s", val: 30, title: "Tăng tốc" },
                  { label: "15s", val: 15, title: "Thử thách cao" },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    title={preset.title}
                    onClick={() => {
                      setTimer(preset.val);
                      setIsPrepPaused(false);
                    }}
                    className={`py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${timer === preset.val
                        ? "bg-amber-500 text-white border-amber-500 shadow-xs scale-105"
                        : "bg-background border-border text-foreground/80 hover:border-amber-500/50 hover:bg-muted/30"
                      }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleStartSpeakingNow}
            className="tech-btn w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>Sẵn sàng (Nói luôn)</span>
          </button>

          <p className="text-[11px] text-muted-foreground leading-normal">
            💡 Hết giờ chuẩn bị, máy sẽ tự động phát tiếng bíp và bắt đầu ghi âm.
          </p>
        </div>
      )}

      {/* 2. STAGE: ACTIVE RECORDING */}
      {stage === "speaking" && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
          <span
            className={`text-xs font-bold flex items-center gap-1.5 ${isSpeakingPaused || isMicPaused ? "text-amber-500" : "text-destructive"
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isSpeakingPaused || isMicPaused ? "bg-amber-500" : "bg-destructive animate-ping"
                }`}
            />
            {isSpeakingPaused || isMicPaused ? "Đang tạm dừng ghi âm" : "Recording..."}
          </span>

          {/* Circular Timer with Mic */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                className="text-muted/30"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={264}
                strokeDashoffset={264 - (264 * timer) / (currentQ.speakTime || 30)}
                strokeLinecap="round"
                className={`${isSpeakingPaused || isMicPaused ? "text-amber-500" : "text-destructive"
                  } transition-all duration-1000 ease-linear`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Mic
                className={`w-4 h-4 mb-0.5 ${isSpeakingPaused || isMicPaused
                    ? "text-amber-500"
                    : "text-destructive animate-pulse"
                  }`}
              />
              <span className="text-2xl font-black font-heading text-foreground">
                {formatTimerDisplay(timer)}
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">
                {currentQ.partNumber === 4 ? "Trả lời 2 phút" : "Thời gian nói"}
              </span>
            </div>
          </div>

          {/* Audio Waveform */}
          <div className="flex items-center justify-center gap-1 h-5 text-destructive">
            {[12, 20, 35, 18, 28, 42, 24, 38, 16, 30, 22].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${isSpeakingPaused || isMicPaused ? "bg-muted" : "bg-destructive"
                  }`}
                style={{
                  height: `${Math.max(
                    6,
                    Math.min(22, (volumeLevel > 5 ? volumeLevel * 0.4 : 6) + h * 0.3)
                  )}px`,
                }}
              />
            ))}
          </div>

          {/* Controls: Pause / Retake / Finish */}
          <div className="w-full space-y-2 pt-1 border-t border-border">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleToggleSpeakingPause}
                className="py-2 px-3 rounded-xl border border-border bg-muted/60 hover:bg-muted text-foreground text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSpeakingPaused || isMicPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Tiếp tục</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-500" />
                    <span>Tạm dừng</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRetakeSpeaking}
                className="py-2 px-3 rounded-xl border border-border bg-muted/60 hover:bg-muted text-foreground text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-primary" />
                <span>Thu lại</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleStopSpeakingEarly}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-all shadow-xs hover:bg-primary/90 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Hoàn thành</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. STAGE: FINISHED & REVIEW AUDIO */}
      {stage === "finished" && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-heading font-bold text-sm text-foreground">
              Đã ghi âm ({currentDuration}s)
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Bạn có thể nghe lại câu nói hoặc chấm điểm AI
            </p>
          </div>

          {currentAudioUrl && (
            <SpeakingAudioPlayer src={currentAudioUrl} duration={currentDuration} />
          )}

          <div className="w-full space-y-2 pt-1">
            <button
              type="button"
              onClick={handleRetry}
              className="w-full py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nói lại</span>
            </button>
            <button
              type="button"
              onClick={() => handleAIEvaluation()}
              disabled={isEvaluating}
              className="tech-btn w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isEvaluating ? "AI đang chấm..." : "Chấm điểm với AI"}</span>
            </button>
          </div>

          {/* AI Score Badge if evaluated */}
          {currentAiResult && (
            <div className="w-full rounded-2xl bg-gradient-to-b from-primary/10 via-primary/5 to-card border border-primary/25 text-left p-4 space-y-3.5 text-xs shadow-sm">
              <div className="flex items-center justify-between border-b border-primary/15 pb-2.5">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-primary font-heading tracking-wide">
                    {currentAiResult.band}
                  </span>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-mono font-bold text-xs border border-primary/20">
                  {currentAiResult.score}/50 điểm
                </div>
              </div>

              {/* Speech-to-Text Transcript */}
              {currentAiResult.transcript && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-primary" />
                    Lời thoại nhận diện (STT):
                  </span>
                  <div className="p-2.5 rounded-xl bg-card border border-border/80 text-[11px] leading-relaxed text-foreground/90 italic font-sans max-h-24 overflow-y-auto">
                    &ldquo;{currentAiResult.transcript}&rdquo;
                  </div>
                </div>
              )}

              {/* 4 Aptis Criteria */}
              <div className="space-y-2 pt-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Điểm 4 tiêu chí chuẩn Aptis:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {/* Pronunciation */}
                  <div className="p-2 rounded-xl bg-card border border-border/60 flex flex-col justify-between">
                    <span className="text-muted-foreground text-[10px]">Phát âm (Pron.)</span>
                    <div className="flex items-center justify-between font-bold text-foreground mt-1">
                      <span>{currentAiResult.pronunciation ?? 38}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">/50</span>
                    </div>
                    <div className="w-full bg-muted h-1 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            ((currentAiResult.pronunciation ?? 38) / 50) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Fluency */}
                  <div className="p-2 rounded-xl bg-card border border-border/60 flex flex-col justify-between">
                    <span className="text-muted-foreground text-[10px]">Lưu loát (Fluency)</span>
                    <div className="flex items-center justify-between font-bold text-foreground mt-1">
                      <span>{currentAiResult.fluency ?? 38}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">/50</span>
                    </div>
                    <div className="w-full bg-muted h-1 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            ((currentAiResult.fluency ?? 38) / 50) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Grammar */}
                  <div className="p-2 rounded-xl bg-card border border-border/60 flex flex-col justify-between">
                    <span className="text-muted-foreground text-[10px]">Ngữ pháp (Grammar)</span>
                    <div className="flex items-center justify-between font-bold text-foreground mt-1">
                      <span>{currentAiResult.grammar ?? 35}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">/50</span>
                    </div>
                    <div className="w-full bg-muted h-1 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            ((currentAiResult.grammar ?? 35) / 50) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Vocabulary */}
                  <div className="p-2 rounded-xl bg-card border border-border/60 flex flex-col justify-between">
                    <span className="text-muted-foreground text-[10px]">Từ vựng (Vocab.)</span>
                    <div className="flex items-center justify-between font-bold text-foreground mt-1">
                      <span>{currentAiResult.vocabulary ?? 38}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">/50</span>
                    </div>
                    <div className="w-full bg-muted h-1 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            ((currentAiResult.vocabulary ?? 38) / 50) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback */}
              {currentAiResult.feedback?.[0] && (
                <div className="p-2.5 rounded-xl bg-card/80 border border-border/70 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Nhận xét giám khảo AI:
                  </span>
                  <p className="text-[11px] text-foreground/90 leading-relaxed">
                    {currentAiResult.feedback[0]}
                  </p>
                </div>
              )}

              {/* Accordion Detailed Feedback */}
              {currentAiResult.detailedFeedback && currentAiResult.detailedFeedback.length > 0 && (
                <div className="pt-1 border-t border-primary/15">
                  <button
                    type="button"
                    onClick={() => setShowDetailedFeedback((prev) => !prev)}
                    className="w-full py-1 text-[11px] font-semibold text-primary hover:text-primary/80 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>
                      {showDetailedFeedback
                        ? "Thu gọn nhận xét chi tiết"
                        : "Xem góp ý chi tiết từng tiêu chí"}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${showDetailedFeedback ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {showDetailedFeedback && (
                    <div className="mt-2 space-y-2 pt-1 border-t border-border/50 max-h-48 overflow-y-auto pr-1">
                      {currentAiResult.detailedFeedback.map((df: any, idx: number) => {
                        const criterionTitle =
                          df.criterion === "pronunciation"
                            ? "Phát âm (Pronunciation)"
                            : df.criterion === "fluency"
                              ? "Lưu loát (Fluency)"
                              : df.criterion === "grammar"
                                ? "Ngữ pháp (Grammar)"
                                : df.criterion === "vocabulary"
                                  ? "Từ vựng (Vocabulary)"
                                  : df.criterion;
                        return (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-card border border-border/50 text-[11px] space-y-0.5"
                          >
                            <div className="flex items-center justify-between font-semibold text-foreground text-[10px]">
                              <span>{criterionTitle}</span>
                              {df.score !== undefined && df.score !== null && (
                                <span className="text-primary font-mono">{df.score}/50</span>
                              )}
                            </div>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">
                              {df.comment}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
