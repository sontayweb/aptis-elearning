"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { ExamExitConfirmModal } from "@/components/exam-exit-confirm-modal";
import {
  MarathonRoomHeader,
  MarathonMatrixDrawer,
  MarathonFeedbackSheet,
  type CatalogItem,
  type ExamFeedbackData,
} from "@/components/marathon/marathon-room-components";
import { ReadingGoogleTranslateModal } from "@/components/reading-google-translate";
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Layers,
  Languages,
  Check,
  ChevronDown,
  ArrowUpDown,
  MoveUp,
  MoveDown,
  Loader2,
  Info,
} from "lucide-react";
import type { SyncStatus } from "@/components/exam-sync-status";

interface QuestionItem {
  id: string;
  questionNumber: number;
  questionType: string;
  prompt: string;
  options: any;
  correctAnswer: string | null;
  explanation: string | null;
  maxScore: number;
}

interface BatchExamItem {
  index: number;
  examId: string;
  partId: string;
  title: string;
  description?: string | null;
  skill: string;
  isPro: boolean;
  hotLevel: number;
  forecastTag?: string | null;
  logicalPart: number;
  partNumber: number;
  partTitle: string;
  instructions?: string | null;
  passageText?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
  questions: QuestionItem[];
}

function parseOpts(raw: any): string[] {
  if (Array.isArray(raw)) return raw.map((x) => String(x));
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p.map((x) => String(x));
    } catch {}
  }
  return [];
}

export default function ReadingMarathonRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-xs font-semibold text-muted-foreground">
              Đang tải phòng thi Marathon Reading...
            </p>
          </div>
        </div>
      }
    >
      <ReadingMarathonRoomContent />
    </Suspense>
  );
}

function ReadingMarathonRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partParam = searchParams.get("part") || "1";
  const partNumber = parseInt(partParam, 10) || 1;

  const { isAuthenticated, user } = useAuth();

  // 1. Metadata catalog & batch data
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [batchCache, setBatchCache] = useState<Record<number, BatchExamItem>>({});
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingBatch, setLoadingBatch] = useState(false);

  // 2. Active indices & progress
  const [currentIndex, setCurrentIndex] = useState(0);
  const [anchorIndex, setAnchorIndex] = useState(0); // highest uncompleted index
  const [completedData, setCompletedData] = useState<Record<string, any>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [cohesionOrders, setCohesionOrders] = useState<Record<string, string[]>>({});

  // 3. Modals & UI states
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [feedbackData, setFeedbackData] = useState<ExamFeedbackData | null>(null);
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isResumed, setIsResumed] = useState(false);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);

  // Timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpentSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Phase 1: Load Catalog Metadata & User Progress
  useEffect(() => {
    let mounted = true;
    const loadCatalogAndProgress = async () => {
      try {
        setLoadingCatalog(true);
        // Call catalog
        const catRes = await api.marathon.getCatalog("READING", partNumber);
        if (!mounted) return;

        if (catRes.success && catRes.data) {
          setCatalog(catRes.data.items || []);
        }

        // Call Progress
        let resolvedIndex = 0;
        let resolvedAnchor = 0;
        let resolvedCompleted: Record<string, any> = {};
        let resolvedDraftAnswers: Record<string, string> = {};
        let resolvedDraftOrders: Record<string, string[]> = {};

        try {
          const progRes = await api.marathon.getProgress("READING", partNumber);
          if (progRes.success && progRes.data?.hasProgress && progRes.data.progress) {
            const p = progRes.data.progress;
            resolvedIndex = p.currentExamIndex || 0;
            resolvedAnchor = p.currentExamIndex || 0;
            resolvedCompleted = p.completedData || {};
            resolvedDraftAnswers = p.currentDraftAnswers || {};
            resolvedDraftOrders = p.currentDraftOrders || {};
            setIsResumed(true);
          }
        } catch {
          // Fallback to LocalStorage for guest or network glitch
        }

        // Check local storage for recent draft
        try {
          const localDraftRaw = localStorage.getItem(
            `aptis_marathon_draft_READING_p${partNumber}`
          );
          if (localDraftRaw) {
            const localDraft = JSON.parse(localDraftRaw);
            if (localDraft.currentIndex !== undefined && localDraft.currentIndex > resolvedIndex) {
              resolvedIndex = localDraft.currentIndex;
              resolvedAnchor = localDraft.currentIndex;
            }
            if (localDraft.answers) {
              resolvedDraftAnswers = { ...resolvedDraftAnswers, ...localDraft.answers };
            }
            if (localDraft.orders) {
              resolvedDraftOrders = { ...resolvedDraftOrders, ...localDraft.orders };
            }
          }
        } catch {}

        if (mounted) {
          setCurrentIndex(resolvedIndex);
          setAnchorIndex(resolvedAnchor);
          setCompletedData(resolvedCompleted);
          setAnswers(resolvedDraftAnswers);
          setCohesionOrders(resolvedDraftOrders);
        }
      } catch (err) {
        console.error("Failed to load Marathon Catalog:", err);
      } finally {
        if (mounted) setLoadingCatalog(false);
      }
    };

    loadCatalogAndProgress();
    return () => {
      mounted = false;
    };
  }, [partNumber]);

  // Phase 2: Sliding Window Pre-fetching (Load currentIndex - 1, currentIndex, currentIndex + 1, currentIndex + 2)
  useEffect(() => {
    if (catalog.length === 0) return;

    const indicesToFetch = [
      currentIndex - 1,
      currentIndex,
      currentIndex + 1,
      currentIndex + 2,
    ].filter((i) => i >= 0 && i < catalog.length && !batchCache[i]);

    if (indicesToFetch.length === 0) return;

    let mounted = true;
    const fetchBatch = async () => {
      try {
        setLoadingBatch(true);
        const res = await api.marathon.getBatch("READING", partNumber, indicesToFetch);
        if (mounted && res.success && Array.isArray(res.data?.items)) {
          setBatchCache((prev) => {
            const next = { ...prev };
            res.data.items.forEach((item: BatchExamItem) => {
              next[item.index] = item;
            });
            return next;
          });
        }
      } catch (err) {
        console.error("Batch pre-fetch error:", err);
      } finally {
        if (mounted) setLoadingBatch(false);
      }
    };

    fetchBatch();
    return () => {
      mounted = false;
    };
  }, [catalog, currentIndex, partNumber, batchCache]);

  // Debounced Autosave (LocalStorage + Cloud DB)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerAutosave = useCallback(
    (newAnswers: Record<string, string>, newOrders: Record<string, string[]>, idx: number) => {
      setSyncStatus("saving");

      // 1. Instant LocalStorage Save
      try {
        localStorage.setItem(
          `aptis_marathon_draft_READING_p${partNumber}`,
          JSON.stringify({
            currentIndex: idx,
            answers: newAnswers,
            orders: newOrders,
            savedAt: new Date().toISOString(),
          })
        );
      } catch {}

      // 2. Debounced Cloud Save
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await api.marathon.autosave({
            skill: "READING",
            partNumber,
            currentExamIndex: idx,
            currentExamId: catalog[idx]?.examId,
            currentDraftAnswers: newAnswers,
            currentDraftOrders: newOrders,
            additionalTimeSeconds: 5,
          });
          setSyncStatus("saved");
          setLastSavedAt(new Date());
        } catch {
          setSyncStatus("error");
        }
      }, 1500);
    },
    [partNumber, catalog]
  );

  const currentItem = batchCache[currentIndex];

  // Initialize Sentence Order for Part 2 if not yet ordered
  useEffect(() => {
    if (currentItem && currentItem.logicalPart === 2) {
      const q = currentItem.questions[0];
      if (q && !cohesionOrders[currentItem.partId]) {
        const rawOpts = parseOpts(q.options);
        if (rawOpts.length > 0) {
          // Shuffle initially
          const shuffled = [...rawOpts].sort(() => 0.5 - Math.random());
          setCohesionOrders((prev) => ({
            ...prev,
            [currentItem.partId]: shuffled,
          }));
        }
      }
    }
  }, [currentItem, cohesionOrders]);

  // Handle option select (Gap Fill / Part 1, 3, 4)
  const handleSelectAnswer = (qId: string, val: string) => {
    const nextAnswers = { ...answers, [qId]: val };
    setAnswers(nextAnswers);
    triggerAutosave(nextAnswers, cohesionOrders, currentIndex);
  };

  // Move sentence in Part 2
  const moveSentence = (partId: string, fromIdx: number, toIdx: number) => {
    const current = cohesionOrders[partId] || [];
    if (toIdx < 0 || toIdx >= current.length) return;
    const copy = [...current];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);

    const nextOrders = { ...cohesionOrders, [partId]: copy };
    setCohesionOrders(nextOrders);
    triggerAutosave(answers, nextOrders, currentIndex);
  };

  // Submit current exam & Show feedback sheet
  const handleCompleteCurrentExam = async () => {
    if (!currentItem) return;

    try {
      setSyncStatus("saving");
      const res = await api.marathon.completeExam({
        skill: "READING",
        partNumber,
        examId: currentItem.examId,
        examIndex: currentIndex,
        answers,
        orders: cohesionOrders,
        timeSpentSeconds: 60,
      });

      if (res.success && res.data) {
        setSyncStatus("saved");
        setLastSavedAt(new Date());

        // Update local completedData
        setCompletedData((prev) => ({
          ...prev,
          [currentItem.examId]: {
            bestScore: res.data.bestScore,
            lastScore: res.data.earnedScore,
            maxScore: res.data.maxScore,
            correctCount: res.data.correctCount,
            totalQuestions: res.data.totalQuestions,
          },
        }));

        // Advance anchor index if completing new furthest exam
        if (currentIndex >= anchorIndex) {
          setAnchorIndex(Math.min(catalog.length - 1, currentIndex + 1));
        }

        // Open feedback sheet
        setFeedbackData({
          examIndex: currentIndex,
          earnedScore: res.data.earnedScore,
          maxScore: res.data.maxScore,
          bestScore: res.data.bestScore,
          correctCount: res.data.correctCount,
          totalQuestions: res.data.totalQuestions,
          accuracyRate: res.data.accuracyRate,
          questionResults: res.data.questionResults || {},
          questions: currentItem.questions,
        });
      }
    } catch (err: any) {
      console.error("Submission failed:", err);
      // Fallback client grading if guest
      let correct = 0;
      const questionResults: Record<string, any> = {};
      currentItem.questions.forEach((q) => {
        const userA = answers[q.id] || "";
        const corA = q.correctAnswer || "";
        const isCor = Boolean(userA && userA.toLowerCase() === corA.toLowerCase());
        if (isCor) correct++;
        questionResults[q.id] = {
          isCorrect: isCor,
          userAnswer: userA,
          correctAnswer: corA,
        };
      });

      const acc =
        currentItem.questions.length > 0
          ? Math.round((correct / currentItem.questions.length) * 100)
          : 0;

      setFeedbackData({
        examIndex: currentIndex,
        earnedScore: correct,
        maxScore: currentItem.questions.length,
        bestScore: correct,
        correctCount: correct,
        totalQuestions: currentItem.questions.length,
        accuracyRate: acc,
        questionResults,
        questions: currentItem.questions,
      });
    }
  };

  // Next exam navigation
  const handleGoNextExam = () => {
    setFeedbackData(null);
    if (currentIndex < catalog.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      triggerAutosave(answers, cohesionOrders, nextIdx);
    }
  };

  // Prev exam navigation
  const handleGoPrevExam = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      triggerAutosave(answers, cohesionOrders, prevIdx);
    }
  };

  // Jump to specific index from Matrix
  const handleSelectExamFromMatrix = (idx: number) => {
    setCurrentIndex(idx);
    triggerAutosave(answers, cohesionOrders, idx);
  };

  // Reset current exam
  const handleResetCurrentExam = () => {
    if (!currentItem) return;
    setAnswers((prev) => {
      const next = { ...prev };
      currentItem.questions.forEach((q) => delete next[q.id]);
      return next;
    });
    if (currentItem.logicalPart === 2) {
      const q = currentItem.questions[0];
      if (q) {
        const opts = parseOpts(q.options);
        setCohesionOrders((prev) => ({
          ...prev,
          [currentItem.partId]: [...opts].sort(() => 0.5 - Math.random()),
        }));
      }
    }
    setFeedbackData(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col select-none">
      {/* 1. Sticky Exam Room Header */}
      <MarathonRoomHeader
        title={currentItem?.title || `Đề thi #${currentIndex + 1}`}
        partLabel={`Reading Part ${partNumber}`}
        currentIndex={currentIndex}
        totalExams={catalog.length}
        syncStatus={syncStatus}
        lastSavedAt={lastSavedAt}
        isResumed={isResumed}
        timeSpentSeconds={timeSpentSeconds}
        onExitClick={() => setIsExitConfirmOpen(true)}
        onOpenMatrix={() => setIsMatrixOpen(true)}
      />

      {/* 2. Main 2-Column Split Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col">
        {loadingCatalog || (!currentItem && loadingBatch) ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-xs font-semibold text-muted-foreground">
                Đang tải dữ liệu Đề #{currentIndex + 1}...
              </p>
            </div>
          </div>
        ) : !currentItem ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center space-y-3 p-6 bg-card border border-border rounded-2xl max-w-md">
              <p className="text-sm font-bold text-foreground">
                Không thể tải nội dung Đề #{currentIndex + 1}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
              >
                Thử lại
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            {/* LEFT COLUMN: Passage & Context */}
            <div className="bg-card border border-border rounded-3xl p-5 sm:p-6 flex flex-col shadow-xs overflow-y-auto max-h-[calc(100vh-170px)]">
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {currentIndex + 1}
                  </span>
                  <div>
                    <h2 className="text-sm font-heading font-extrabold text-foreground truncate max-w-xs">
                      {currentItem.title}
                    </h2>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{"☘️".repeat(Math.min(5, currentItem.hotLevel || 4))}</span>
                      <span>{currentItem.partTitle || `Part ${partNumber}`}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Google Translate */}
                <button
                  type="button"
                  onClick={() => setIsTranslateOpen(true)}
                  className="h-8 px-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Tra cứu từ vựng & Google Dịch"
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tra từ</span>
                </button>
              </div>

              {/* Instructions */}
              {currentItem.instructions && (
                <div className="p-3 rounded-2xl bg-muted/60 text-xs text-muted-foreground mb-4 border border-border/80">
                  <strong className="text-foreground font-semibold block mb-0.5">
                    Hướng dẫn làm bài:
                  </strong>
                  {currentItem.instructions}
                </div>
              )}

              {/* Passage Text */}
              {currentItem.passageText ? (
                <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-serif whitespace-pre-line bg-muted/20 p-4 rounded-2xl border border-border/60">
                  {currentItem.passageText}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic p-4 bg-muted/10 rounded-2xl border border-dashed border-border/60">
                  (Đề bài này yêu cầu điền từ hoặc sắp xếp trực tiếp ở cột bên phải)
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Interactive Question Form */}
            <div className="bg-card border border-border rounded-3xl p-5 sm:p-6 flex flex-col shadow-xs overflow-y-auto max-h-[calc(100vh-170px)]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Trả lời câu hỏi ({currentItem.questions.length} câu)
                </span>
                <button
                  type="button"
                  onClick={handleResetCurrentExam}
                  className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Xóa chọn lại</span>
                </button>
              </div>

              {/* Part 1: Gap Fill Card */}
              {currentItem.logicalPart === 1 && (
                <div className="space-y-4">
                  {currentItem.questions.map((q, idx) => {
                    const opts = parseOpts(q.options);
                    const selected = answers[q.id] || "";

                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-2xl border border-border/80 bg-background/50 hover:border-primary/40 transition-all"
                      >
                        <div className="flex items-start gap-2 mb-2.5">
                          <span className="w-5 h-5 rounded-md bg-muted text-foreground flex items-center justify-center text-[11px] font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <p className="text-xs font-medium text-foreground leading-snug">
                            {q.prompt}
                          </p>
                        </div>

                        {/* Options Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {opts.map((opt) => {
                            const isChosen = selected === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleSelectAnswer(q.id, opt)}
                                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between cursor-pointer ${
                                  isChosen
                                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40"
                                    : "border-border bg-card hover:bg-muted text-foreground"
                                }`}
                              >
                                <span className="truncate">{opt}</span>
                                {isChosen && <Check className="w-3.5 h-3.5 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Part 2: Text Cohesion Drag & Reorder */}
              {currentItem.logicalPart === 2 && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Sử dụng các nút mũi tên để di chuyển vị trí câu sao cho tạo thành đoạn văn logic:
                  </p>
                  {(cohesionOrders[currentItem.partId] || []).map((sent, sIdx, arr) => (
                    <div
                      key={sent + sIdx}
                      className="p-3.5 rounded-2xl border border-border bg-background flex items-center justify-between gap-3 transition-all hover:border-primary/40"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                          {sIdx + 1}
                        </span>
                        <p className="text-xs text-foreground leading-relaxed">
                          {sent}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={sIdx === 0}
                          onClick={() =>
                            moveSentence(currentItem.partId, sIdx, sIdx - 1)
                          }
                          className="w-7 h-7 rounded-lg border border-border hover:bg-muted disabled:opacity-30 flex items-center justify-center text-muted-foreground cursor-pointer"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={sIdx === arr.length - 1}
                          onClick={() =>
                            moveSentence(currentItem.partId, sIdx, sIdx + 1)
                          }
                          className="w-7 h-7 rounded-lg border border-border hover:bg-muted disabled:opacity-30 flex items-center justify-center text-muted-foreground cursor-pointer"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Part 3 & 4 General Options */}
              {currentItem.logicalPart > 2 && (
                <div className="space-y-4">
                  {currentItem.questions.map((q, idx) => {
                    const opts = parseOpts(q.options);
                    const selected = answers[q.id] || "";

                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-2xl border border-border/80 bg-background/50"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <span className="w-5 h-5 rounded-md bg-muted text-foreground flex items-center justify-center text-[11px] font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <p className="text-xs font-medium text-foreground">
                            {q.prompt}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {opts.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleSelectAnswer(q.id, opt)}
                              className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between cursor-pointer ${
                                selected === opt
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-card hover:bg-muted"
                              }`}
                            >
                              <span>{opt}</span>
                              {selected === opt && <Check className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 3. Sticky Bottom Navigation Dock */}
      <footer className="sticky bottom-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/80 p-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Previous Exam */}
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={handleGoPrevExam}
            className="h-10 px-3 sm:px-4 rounded-xl border border-border hover:bg-muted text-foreground font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Đề Trước</span>
          </button>

          {/* Question status circles of current exam */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {currentItem?.questions.map((q, idx) => {
              const isAnswered = Boolean(answers[q.id]);
              return (
                <div
                  key={q.id}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                    isAnswered
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {idx + 1}
                </div>
              );
            })}
          </div>

          {/* Complete & Next Button */}
          <button
            type="button"
            onClick={handleCompleteCurrentExam}
            className="h-10 px-4 sm:px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <span>Hoàn thành &amp; Tiếp tục</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* 4. Exam Matrix Drawer */}
      <MarathonMatrixDrawer
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
        catalog={catalog}
        currentIndex={currentIndex}
        anchorIndex={anchorIndex}
        completedData={completedData}
        onSelectExam={handleSelectExamFromMatrix}
      />

      {/* 5. Exam Feedback Bottom Sheet */}
      <MarathonFeedbackSheet
        data={feedbackData}
        onClose={() => setFeedbackData(null)}
        onNextExam={handleGoNextExam}
        onRetake={handleResetCurrentExam}
        isLastExam={currentIndex >= catalog.length - 1}
      />

      {/* 6. Exit Confirm Modal */}
      <ExamExitConfirmModal
        isOpen={isExitConfirmOpen}
        onCancel={() => setIsExitConfirmOpen(false)}
        onConfirm={() => router.push(`/reading/marathon?part=${partNumber}`)}
        title="Tạm dừng phiên làm Marathon?"
        message={`Tiến trình của bạn tại Đề #${currentIndex + 1} đã được lưu an toàn. Bạn có thể quay lại bất cứ lúc nào để tiếp tục.`}
      />

      {/* 7. Google Translate Modal */}
      <ReadingGoogleTranslateModal
        isOpen={isTranslateOpen}
        onClose={() => setIsTranslateOpen(false)}
      />
    </div>
  );
}
