"use client";

import { Mic, Volume2, CheckCircle2, Loader2, AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";

interface SpeakingIntroScreenProps {
  examTitle: string;
  questionCount: number;
  introSubStep: "check" | "instructions";
  onSubStepChange: (step: "check" | "instructions") => void;
  /** Bắt đầu làm bài (hoặc "Vào nhanh" bỏ qua bước kiểm tra). */
  onStart: () => void;
  micTested: boolean;
  isTestingMic: boolean;
  onTestMic: () => void;
  soundTested: boolean;
  isTestingSound: boolean;
  onTestSound: () => void;
  deviceTestError?: string | null;
}

/** Màn hình mở đầu phòng thi Speaking: kiểm tra micro/loa rồi đọc quy chế. */
export function SpeakingIntroScreen({
  examTitle,
  questionCount,
  introSubStep,
  onSubStepChange,
  onStart,
  micTested,
  isTestingMic,
  onTestMic,
  soundTested,
  isTestingSound,
  onTestSound,
  deviceTestError,
}: SpeakingIntroScreenProps) {
  return (
      <div className="max-w-2xl mx-auto space-y-6 py-4">
        {introSubStep === "check" ? (
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Aptis General Practice Test
              </span>
              <h1 className="text-xl md:text-2xl font-black font-heading text-foreground">
                Speaking Practice Test
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">
                {examTitle}
              </p>
            </div>
  
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3.5 rounded-xl border border-border bg-muted/30">
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Số câu hỏi</div>
                <div className="text-base font-extrabold text-foreground mt-0.5">{questionCount} câu (4 Phần)</div>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-muted/30">
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Thời gian làm bài</div>
                <div className="text-base font-extrabold text-foreground mt-0.5">~12 phút</div>
              </div>
            </div>
  
            <div className="space-y-4 pt-2 border-t border-border/70">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Kiểm tra thiết bị trước khi vào thi:
              </h2>
  
              {/* Card 1: Microphone */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Mic className="w-4 h-4 text-primary" />
                    Kiểm tra Microphone
                  </span>
                  {micTested && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Microphone sẵn sàng!
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onTestMic}
                  disabled={isTestingMic}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    micTested
                      ? "bg-emerald-500/10 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                  }`}
                >
                  {isTestingMic ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                  <span>{micTested ? "Kiểm tra lại micro" : "Kiểm tra microphone"}</span>
                </button>
              </div>
  
              {/* Card 2: Âm thanh / Tiếng bíp */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-primary" />
                    Kiểm tra âm thanh
                  </span>
                  {soundTested && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đã phát tiếng bíp
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Bấm để nghe thử tiếng bíp. Trong bài thi, tiếng bíp báo hiệu bạn bắt đầu nói.
                </p>
                <button
                  type="button"
                  onClick={onTestSound}
                  disabled={isTestingSound}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    soundTested
                      ? "bg-emerald-500/10 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                      : "bg-muted hover:bg-muted/80 text-foreground border border-border"
                  }`}
                >
                  {isTestingSound ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-primary" />
                  )}
                  <span>{soundTested ? "Nghe lại tiếng bíp" : "Nghe thử tiếng bíp"}</span>
                </button>
              </div>
  
              {deviceTestError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{deviceTestError}</span>
                </div>
              )}
            </div>
  
            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => onSubStepChange("instructions")}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-sm hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Start Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => onStart()}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer py-1"
                >
                  Vào nhanh (Bỏ qua bước kiểm tra)
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Instructions Step (Matching Screenshot 3) */
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
            <div className="space-y-1.5 border-b border-border pb-4">
              <h2 className="text-xl md:text-2xl font-black font-heading text-foreground">
                Aptis General Speaking Test Instructions
              </h2>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Speaking
              </p>
            </div>
  
            <div className="space-y-3 text-xs md:text-sm text-foreground/90 leading-relaxed">
              <p>• You will answer some questions about yourself and then do three short speaking tasks.</p>
              <p>• Listen to the instructions and speak clearly into your microphone when you hear the signal (beep).</p>
              <p>• Each part of the test will appear automatically.</p>
              <p>• The test will take about 12 minutes.</p>
              <p>• When you click on the &quot;Bắt đầu làm bài&quot; button, the test will begin.</p>
            </div>
  
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => onSubStepChange("check")}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>
              <button
                type="button"
                onClick={() => onStart()}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>Bắt đầu làm bài</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
  );
}
