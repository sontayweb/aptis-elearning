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
import {
  SpellCheck,
  BookA,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Check,
  BookOpen,
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

export default function GrammarMarathonRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-xs font-semibold text-muted-foreground">
              Đang tải phòng thi Grammar &amp; Vocabulary Marathon...
            </p>
          </div>
        </div>
      }
    >
      <GrammarMarathonRoomContent />
    </Suspense>
  );
}

function GrammarMarathonRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partParam = searchParams.get("part") || "1";
  const partNumber = parseInt(partParam, 10) || 1;
  const isVocab = partNumber === 2;

  const { isAuthenticated, user } = useAuth();

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [batchCache, setBatchCache] = useState<Record<number, BatchExamItem>>({});
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingBatch, setLoadingBatch] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [anchorIndex, setAnchorIndex] = useState(0);
  const [completedData, setCompletedData] = useState<Record<string, any>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [feedbackData, setFeedbackData] = useState<ExamFeedbackData | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isResumed, setIsResumed] = useState(false);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpentSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Phase 1: Catalog & Progress
  useEffect(() => {
    let mounted = true;
    const loadCatalogAndProgress = async () => {
      try {
        setLoadingCatalog(true);
        const catRes = await api.marathon.getCatalog("GRAMMAR_VOCABULARY", partNumber);
        if (!mounted) return;

        if (catRes.success && catRes.data) {
          setCatalog(catRes.data.items || []);
        }

        let resolvedIndex = 0;
        let resolvedAnchor = 0;
        let resolvedCompleted: Record<string, any> = {};
        let resolvedDraftAnswers: Record<string, string> = {};

        try {
          const progRes = await api.marathon.getProgress("GRAMMAR_VOCABULARY", partNumber);
          if (progRes.success && progRes.data?.hasProgress && progRes.data.progress) {
            const p = progRes.data.progress;
            resolvedIndex = p.currentExamIndex || 0;
            resolvedAnchor = p.currentExamIndex || 0;
            resolvedCompleted = p.completedData || {};
            resolvedDraftAnswers = p.currentDraftAnswers || {};
            setIsResumed(true);
          }
        } catch {}

        try {
          const localDraftRaw = localStorage.getItem(
            `aptis_marathon_draft_GRAMMAR_p${partNumber}`
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
          }
        } catch {}

        if (mounted) {
          setCurrentIndex(resolvedIndex);
          setAnchorIndex(resolvedAnchor);
          setCompletedData(resolvedCompleted);
          setAnswers(resolvedDraftAnswers);
        }
      } catch (err) {
        console.error("Failed to load Grammar Marathon Catalog:", err);
      } finally {
        if (mounted) setLoadingCatalog(false);
      }
    };

    loadCatalogAndProgress();
    return () => {
      mounted = false;
    };
  }, [partNumber]);

  // Phase 2: Batch pre-fetch
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
        const res = await api.marathon.getBatch("GRAMMAR_VOCABULARY", partNumber, indicesToFetch);
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
        console.error("Grammar batch fetch error:", err);
      } finally {
        if (mounted) setLoadingBatch(false);
      }
    };

    fetchBatch();
    return () => {
      mounted = false;
    };
  }, [catalog, currentIndex, partNumber, batchCache]);

  const currentItem = batchCache[currentIndex];

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerAutosave = useCallback(
    (newAnswers: Record<string, string>, idx: number) => {
      setSyncStatus("saving");

      try {
        localStorage.setItem(
          `aptis_marathon_draft_GRAMMAR_p${partNumber}`,
          JSON.stringify({
            currentIndex: idx,
            answers: newAnswers,
            savedAt: new Date().toISOString(),
          })
        );
      } catch {}

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await api.marathon.autosave({
            skill: "GRAMMAR_VOCABULARY",
            partNumber,
            currentExamIndex: idx,
            currentExamId: catalog[idx]?.examId,
            currentDraftAnswers: newAnswers,
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

  const handleSelectAnswer = (qId: string, val: string) => {
    const next = { ...answers, [qId]: val };
    setAnswers(next);
    triggerAutosave(next, currentIndex);
  };

  const handleCompleteCurrentExam = async () => {
    if (!currentItem) return;

    try {
      setSyncStatus("saving");
      const res = await api.marathon.completeExam({
        skill: "GRAMMAR_VOCABULARY",
        partNumber,
        examId: currentItem.examId,
        examIndex: currentIndex,
        answers,
        timeSpentSeconds: 60,
      });

      if (res.success && res.data) {
        setSyncStatus("saved");
        setLastSavedAt(new Date());

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

        if (currentIndex >= anchorIndex) {
          setAnchorIndex(Math.min(catalog.length - 1, currentIndex + 1));
        }

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
    } catch {
      // Offline fallback
      let correct = 0;
      const questionResults: Record<string, any> = {};
      currentItem.questions.forEach((q) => {
        const u = answers[q.id] || "";
        const c = q.correctAnswer || "";
        const isCor = Boolean(u && u.toLowerCase() === c.toLowerCase());
        if (isCor) correct++;
        questionResults[q.id] = { isCorrect: isCor, userAnswer: u, correctAnswer: c };
      });
      setFeedbackData({
        examIndex: currentIndex,
        earnedScore: correct,
        maxScore: currentItem.questions.length,
        bestScore: correct,
        correctCount: correct,
        totalQuestions: currentItem.questions.length,
        accuracyRate: Math.round((correct / (currentItem.questions.length || 1)) * 100),
        questionResults,
        questions: currentItem.questions,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col select-none">
      {/* 1. Header */}
      <MarathonRoomHeader
        title={currentItem?.title || `Đề thi #${currentIndex + 1}`}
        partLabel={isVocab ? "Vocabulary Marathon" : "Grammar Marathon"}
        currentIndex={currentIndex}
        totalExams={catalog.length}
        syncStatus={syncStatus}
        lastSavedAt={lastSavedAt}
        isResumed={isResumed}
        timeSpentSeconds={timeSpentSeconds}
        onExitClick={() => setIsExitConfirmOpen(true)}
        onOpenMatrix={() => setIsMatrixOpen(true)}
      />

      {/* 2. Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col">
        {loadingCatalog || (!currentItem && loadingBatch) ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-xs font-semibold text-muted-foreground">
                Đang tải dữ liệu {isVocab ? "Từ vựng" : "Ngữ pháp"} Đề #{currentIndex + 1}...
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
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            {/* LEFT COLUMN: Overview & Tips */}
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
                      <span>{isVocab ? "Part 2 · Vocabulary" : "Part 1 · Grammar"}</span>
                    </div>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center gap-1.5">
                  {isVocab ? <BookA className="w-3.5 h-3.5" /> : <SpellCheck className="w-3.5 h-3.5" />}
                  <span>{currentItem.questions.length} câu</span>
                </div>
              </div>

              {/* Tips & Instructions */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-xs text-muted-foreground mb-4">
                <strong className="text-foreground font-semibold flex items-center gap-1.5 mb-1.5">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Mẹo làm bài {isVocab ? "Từ vựng" : "Ngữ pháp"}:
                </strong>
                <ul className="list-disc list-inside space-y-1 leading-relaxed">
                  <li>Đọc kỹ ngữ cảnh xung quanh chỗ trống để xác định thì, từ loại hoặc collocation.</li>
                  <li>Loại trừ nhanh các phương án sai rõ ràng trước khi chọn.</li>
                  <li>Bấm nút &ldquo;Hoàn thành &amp; Tiếp tục&rdquo; để hệ thống chấm điểm và giải thích chi tiết.</li>
                </ul>
              </div>

              {/* Extra context if any */}
              {currentItem.passageText && (
                <div className="p-4 rounded-2xl bg-background border border-border/60 text-xs text-foreground/90 font-serif leading-relaxed">
                  {currentItem.passageText}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Questions Form */}
            <div className="bg-card border border-border rounded-3xl p-5 sm:p-6 flex flex-col shadow-xs overflow-y-auto max-h-[calc(100vh-170px)]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Danh sách câu hỏi ({currentItem.questions.length} câu)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Click chọn đáp án tương ứng
                </span>
              </div>

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
                        <p className="text-xs font-heading font-extrabold text-foreground leading-relaxed">
                          {q.prompt}
                        </p>
                      </div>

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
            </div>
          </div>
        )}
      </main>

      {/* 3. Bottom Dock */}
      <footer className="sticky bottom-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/80 p-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => {
              if (currentIndex > 0) {
                const prev = currentIndex - 1;
                setCurrentIndex(prev);
                triggerAutosave(answers, prev);
              }
            }}
            className="h-10 px-3 sm:px-4 rounded-xl border border-border hover:bg-muted text-foreground font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Đề Trước</span>
          </button>

          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {currentItem?.questions.map((q, idx) => (
              <div
                key={q.id}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                  answers[q.id]
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {idx + 1}
              </div>
            ))}
          </div>

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

      {/* 4. Modals */}
      <MarathonMatrixDrawer
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
        catalog={catalog}
        currentIndex={currentIndex}
        anchorIndex={anchorIndex}
        completedData={completedData}
        onSelectExam={(idx) => {
          setCurrentIndex(idx);
          triggerAutosave(answers, idx);
        }}
      />

      <MarathonFeedbackSheet
        data={feedbackData}
        onClose={() => setFeedbackData(null)}
        onNextExam={() => {
          setFeedbackData(null);
          if (currentIndex < catalog.length - 1) {
            const next = currentIndex + 1;
            setCurrentIndex(next);
            triggerAutosave(answers, next);
          }
        }}
        onRetake={() => {
          if (!currentItem) return;
          setAnswers((prev) => {
            const next = { ...prev };
            currentItem.questions.forEach((q) => delete next[q.id]);
            return next;
          });
          setFeedbackData(null);
        }}
        isLastExam={currentIndex >= catalog.length - 1}
      />

      <ExamExitConfirmModal
        isOpen={isExitConfirmOpen}
        onCancel={() => setIsExitConfirmOpen(false)}
        onConfirm={() => router.push(`/grammar/marathon?part=${isVocab ? "vocab" : "grammar"}`)}
        title="Tạm dừng phiên làm Grammar Marathon?"
        message={`Tiến trình của bạn tại Đề #${currentIndex + 1} đã được lưu an toàn.`}
      />
    </div>
  );
}

