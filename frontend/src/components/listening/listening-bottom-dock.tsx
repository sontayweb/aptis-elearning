"use client";

import {
  Eye,
  Flag,
  Bookmark,
  Menu,
  ArrowUp,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import type { ListeningExamData } from "./listening-types";
import type { ListeningStageItem } from "./listening-review-sidebar";

interface ListeningBottomDockProps {
  listeningStages: ListeningStageItem[];
  currentStage: ListeningStageItem;
  activeStage: number;
  setActiveStage: (idx: number | ((prev: number) => number)) => void;
  p1Answers: Record<number, string>;
  p2Answers: Record<number, string>;
  p3Answers: Record<number, "Man" | "Woman" | "Both">;
  p4Answers: Record<string, string>;
  flaggedStages: Record<number, boolean>;
  onOpenSampleAnswers: () => void;
  onOpenReportModal: () => void;
  onOpenDrawer: () => void;
  onFinalSubmit: () => void;
}

export function ListeningBottomDock({
  listeningStages,
  currentStage,
  activeStage,
  setActiveStage,
  p1Answers,
  p2Answers,
  p3Answers,
  p4Answers,
  flaggedStages,
  onOpenSampleAnswers,
  onOpenReportModal,
  onOpenDrawer,
  onFinalSubmit,
}: ListeningBottomDockProps) {
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

      {/* Center: Quick Part Question Pills & Navigation Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="bg-muted/40 dark:bg-slate-800/60 p-1 rounded-2xl border border-border/80 shadow-2xs flex items-center gap-1 backdrop-blur-sm">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scrollbar-none scroll-smooth max-w-[42vw] sm:max-w-[44vw] md:max-w-[50vw] lg:max-w-[56vw] py-0.5 px-0.5">
            {listeningStages
              .map((stage, idx) => ({ stage, idx }))
              .filter(({ stage }) => stage.partNum === currentStage.partNum)
              .map(({ stage, idx }) => {
                const isCurrent = activeStage === idx;
                let isAnswered = false;
                if (stage.partNum === 1) {
                  isAnswered = !!p1Answers[stage.subIndex];
                } else if (stage.partNum === 2) {
                  isAnswered = Object.keys(p2Answers).length > 0;
                } else if (stage.partNum === 3) {
                  isAnswered = Object.keys(p3Answers).length > 0;
                } else if (stage.partNum === 4) {
                  const recPrefix = `${stage.subIndex}_`;
                  isAnswered = Object.keys(p4Answers).some((k) => k.startsWith(recPrefix));
                }

                return (
                  <button
                    key={stage.id}
                    id={`stage-pill-${idx}`}
                    type="button"
                    onClick={() => setActiveStage(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap select-none ${
                      isCurrent
                        ? "bg-primary text-primary-foreground font-black shadow-sm border border-primary"
                        : isAnswered
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/35 hover:bg-emerald-500/25"
                        : "bg-background/80 dark:bg-slate-900/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 hover:border-border"
                    }`}
                    title={stage.label}
                  >
                    {isAnswered && !isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                    {flaggedStages[idx] && (
                      <Bookmark className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                    )}
                    <span>{stage.label}</span>
                  </button>
                );
              })}
          </div>

          <div className="h-4 w-px bg-border/70 shrink-0 mx-0.5 hidden sm:block" />

          <button
            type="button"
            onClick={onOpenDrawer}
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center bg-background/80 dark:bg-slate-900/60 hover:bg-primary/10 hover:text-primary text-muted-foreground border border-border/70 hover:border-primary/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs shrink-0"
            title="Danh sách tất cả câu hỏi"
            aria-label="Danh sách tất cả câu hỏi"
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
        <button
          type="button"
          disabled={activeStage === 0}
          onClick={() => setActiveStage((p) => Math.max(0, p - 1))}
          className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted disabled:opacity-40 transition-colors"
        >
          ← Previous
        </button>

        {activeStage < listeningStages.length - 1 ? (
          <button
            type="button"
            onClick={() => setActiveStage((p) => Math.min(listeningStages.length - 1, p + 1))}
            className="tech-btn px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all flex items-center gap-1"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onFinalSubmit}
            className="tech-btn px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all"
          >
            Nộp bài
          </button>
        )}
      </div>
    </footer>
  );
}

interface ListeningModalsAndDrawerProps {
  showSampleAnswers: boolean;
  setShowSampleAnswers: (val: boolean) => void;
  showReportModal: boolean;
  setShowReportModal: (val: boolean) => void;
  reportType: string;
  setReportType: (val: string) => void;
  reportNote: string;
  setReportNote: (val: string) => void;
  reportSent: boolean;
  setReportSent: (val: boolean) => void;
  showDrawer: boolean;
  setShowDrawer: (val: boolean) => void;
  drawerTab: "all" | "p1" | "p2" | "p3" | "p4";
  setDrawerTab: (val: "all" | "p1" | "p2" | "p3" | "p4") => void;
  listeningStages: ListeningStageItem[];
  currentStage: ListeningStageItem;
  activeStage: number;
  setActiveStage: (idx: number) => void;
  examData: ListeningExamData;
  p1Answers: Record<number, string>;
  p2Answers: Record<number, string>;
  p3Answers: Record<number, "Man" | "Woman" | "Both">;
}

export function ListeningModalsAndDrawer({
  showSampleAnswers,
  setShowSampleAnswers,
  showReportModal,
  setShowReportModal,
  reportType,
  setReportType,
  reportNote,
  setReportNote,
  reportSent,
  setReportSent,
  showDrawer,
  setShowDrawer,
  drawerTab,
  setDrawerTab,
  listeningStages,
  currentStage,
  activeStage,
  setActiveStage,
  examData,
  p1Answers,
  p2Answers,
  p3Answers,
}: ListeningModalsAndDrawerProps) {
  return (
    <>
      {/* MODAL HIỆN ĐÁP ÁN */}
      {showSampleAnswers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Đáp án &amp; Giải thích</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSampleAnswers(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              {currentStage.partNum === 1 && examData.part1[currentStage.subIndex] && (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                  <div className="font-semibold text-foreground">
                    {examData.part1[currentStage.subIndex].prompt}
                  </div>
                  <div className="text-primary font-bold">
                    Đáp án đúng: {examData.part1[currentStage.subIndex].correctAnswer}
                  </div>
                  <div className="text-muted-foreground italic">
                    {examData.part1[currentStage.subIndex].explanation}
                  </div>
                </div>
              )}

              {currentStage.partNum === 2 &&
                examData.part2.speakers.map((s, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                    <div className="font-bold text-primary">{s.speaker}</div>
                    <div className="text-foreground font-medium">Đáp án: {s.correctAnswer}</div>
                    <div className="text-muted-foreground italic text-[11px]">{s.explanation}</div>
                  </div>
                ))}

              {currentStage.partNum === 3 &&
                examData.part3.opinions.map((op, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                    <div className="font-medium text-foreground">{op.statement}</div>
                    <div className="text-primary font-bold">Đáp án: {op.correctAnswer}</div>
                    <div className="text-muted-foreground italic text-[11px]">{op.explanation}</div>
                  </div>
                ))}

              {currentStage.partNum === 4 &&
                examData.part4[currentStage.subIndex]?.questions.map((q, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                    <div className="font-medium text-foreground">{q.prompt}</div>
                    <div className="text-primary font-bold">Đáp án: {q.correctAnswer}</div>
                    <div className="text-muted-foreground italic text-[11px]">{q.explanation}</div>
                  </div>
                ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSampleAnswers(false)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BÁO LỖI */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span>Báo lỗi câu hỏi Listening</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {reportSent ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-foreground">Cảm ơn bạn đã phản hồi!</p>
                <p className="text-[11px] text-muted-foreground">
                  Ban chuyên môn sẽ kiểm tra file âm thanh và đề thi trong thời gian sớm nhất.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-muted-foreground">Vui lòng chọn loại lỗi bạn gặp phải:</p>
                <div className="space-y-2">
                  {[
                    "Lỗi âm thanh hoặc audio không phát được",
                    "Lỗi đáp án hoặc giải thích chưa chuẩn",
                    "Lỗi nội dung / câu hỏi hiển thị",
                    "Khác",
                  ].map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="listeningReportType"
                        value={t}
                        checked={reportType === t}
                        onChange={() => setReportType(t)}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-foreground">{t}</span>
                    </label>
                  ))}
                </div>
                <textarea
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="Mô tả chi tiết vấn đề (tùy chọn)..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportSent(true)}
                    className="px-4 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90"
                  >
                    Gửi báo lỗi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DRAWER DANH SÁCH CÂU HỎI */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md p-5 rounded-2xl bg-card border border-border shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-heading font-bold text-xs uppercase text-muted-foreground tracking-wider">
                Danh sách bài tập Listening ({listeningStages.length} bài)
              </h3>
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bộ lọc Tab theo Part */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs border-b border-border/50">
              {[
                { id: "all" as const, label: `Tất cả (${listeningStages.length})` },
                ...(listeningStages.some((s) => s.partNum === 1)
                  ? [{ id: "p1" as const, label: `Part 1 (${listeningStages.filter((s) => s.partNum === 1).length})` }]
                  : []),
                ...(listeningStages.some((s) => s.partNum === 2)
                  ? [{ id: "p2" as const, label: `Part 2 (${listeningStages.filter((s) => s.partNum === 2).length})` }]
                  : []),
                ...(listeningStages.some((s) => s.partNum === 3)
                  ? [{ id: "p3" as const, label: `Part 3 (${listeningStages.filter((s) => s.partNum === 3).length})` }]
                  : []),
                ...(listeningStages.some((s) => s.partNum === 4)
                  ? [{ id: "p4" as const, label: `Part 4 (${listeningStages.filter((s) => s.partNum === 4).length})` }]
                  : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDrawerTab(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                    drawerTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {/* Part 1 */}
              {(drawerTab === "all" || drawerTab === "p1") && listeningStages.some((s) => s.partNum === 1) && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-primary uppercase pt-1 flex items-center justify-between">
                    <span>Part 1 – Word Recognition ({listeningStages.filter((s) => s.partNum === 1).length} câu)</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {Object.keys(p1Answers).length}/{listeningStages.filter((s) => s.partNum === 1).length} đã làm
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {listeningStages
                      .map((stage, idx) => ({ stage, idx }))
                      .filter(({ stage }) => stage.partNum === 1)
                      .map(({ stage, idx }) => (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => {
                            setActiveStage(idx);
                            setShowDrawer(false);
                          }}
                          className={`p-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            activeStage === idx
                              ? "bg-primary text-primary-foreground"
                              : p1Answers[stage.subIndex]
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                              : "bg-muted/40 hover:bg-muted text-foreground"
                          }`}
                        >
                          Câu {stage.subIndex + 1}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Part 2 */}
              {(drawerTab === "all" || drawerTab === "p2") && listeningStages.some((s) => s.partNum === 2) && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-primary uppercase pt-2 flex items-center justify-between">
                    <span>Part 2 – Matching Info</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {Object.keys(p2Answers).length}/{examData.part2.speakers.length || 4} người nói
                    </span>
                  </div>
                  {listeningStages
                    .map((stage, idx) => ({ stage, idx }))
                    .filter(({ stage }) => stage.partNum === 2)
                    .map(({ stage, idx }) => (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => {
                          setActiveStage(idx);
                          setShowDrawer(false);
                        }}
                        className={`w-full p-2.5 rounded-lg text-xs font-bold text-left transition-colors cursor-pointer ${
                          activeStage === idx
                            ? "bg-primary text-primary-foreground"
                            : Object.keys(p2Answers).length === (examData.part2.speakers.length || 4)
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-muted/40 hover:bg-muted text-foreground"
                        }`}
                      >
                        {stage.label}: Matching Speakers
                      </button>
                    ))}
                </div>
              )}

              {/* Part 3 */}
              {(drawerTab === "all" || drawerTab === "p3") && listeningStages.some((s) => s.partNum === 3) && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-primary uppercase pt-2 flex items-center justify-between">
                    <span>Part 3 – Short Conversations</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {Object.keys(p3Answers).length}/{examData.part3.opinions.length || 4} quan điểm
                    </span>
                  </div>
                  {listeningStages
                    .map((stage, idx) => ({ stage, idx }))
                    .filter(({ stage }) => stage.partNum === 3)
                    .map(({ stage, idx }) => (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => {
                          setActiveStage(idx);
                          setShowDrawer(false);
                        }}
                        className={`w-full p-2.5 rounded-lg text-xs font-bold text-left transition-colors cursor-pointer ${
                          activeStage === idx
                            ? "bg-primary text-primary-foreground"
                            : Object.keys(p3Answers).length === (examData.part3.opinions.length || 4)
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-muted/40 hover:bg-muted text-foreground"
                        }`}
                      >
                        {stage.label}: Opinion Matching (Man / Woman / Both)
                      </button>
                    ))}
                </div>
              )}

              {/* Part 4 */}
              {(drawerTab === "all" || drawerTab === "p4") && listeningStages.some((s) => s.partNum === 4) && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-primary uppercase pt-2">
                    Part 4 – Monologues ({listeningStages.filter((s) => s.partNum === 4).length} bài thuyết trình)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {listeningStages
                      .map((stage, idx) => ({ stage, idx }))
                      .filter(({ stage }) => stage.partNum === 4)
                      .map(({ stage, idx }) => (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => {
                            setActiveStage(idx);
                            setShowDrawer(false);
                          }}
                          className={`p-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            activeStage === idx
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/40 hover:bg-muted text-foreground"
                          }`}
                        >
                          {stage.label}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

