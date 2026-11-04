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
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileText,
  Volume2,
  VolumeX,
  Loader2,
  Info,
  Check,
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
  passageText?: string | null; // Often contains Transcript for Listening
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

export default function ListeningMarathonRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-xs font-semibold text-muted-foreground">
              Đang tải phòng thi Marathon Listening...
            </p>
          </div>
        </div>
      }
    >
      <ListeningMarathonRoomContent />
    </Suspense>
  );
}

function ListeningMarathonRoomContent() {
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
  const [anchorIndex, setAnchorIndex] = useState(0);
  const [completedData, setCompletedData] = useState<Record<string, any>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // 3. Audio Player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 4. Modals & UI states
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [feedbackData, setFeedbackData] = useState<ExamFeedbackData | null>(null);
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
        const catRes = await api.marathon.getCatalog("LISTENING", partNumber);
        if (!mounted) return;

        if (catRes.success && catRes.data) {
          setCatalog(catRes.data.items || []);
        }

        let resolvedIndex = 0;
        let resolvedAnchor = 0;
        let resolvedCompleted: Record<string, any> = {};
        let resolvedDraftAnswers: Record<string, string> = {};

        try {
          const progRes = await api.marathon.getProgress("LISTENING", partNumber);
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
            `aptis_marathon_draft_LISTENING_p${partNumber}`
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
        console.error("Failed to load Listening Marathon Catalog:", err);
      } finally {
        if (mounted) setLoadingCatalog(false);
      }
    };

    loadCatalogAndProgress();
    return () => {
      mounted = false;
    };
  }, [partNumber]);

  // Phase 2: Sliding Window Pre-fetching
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
        const res = await api.marathon.getBatch("LISTENING", partNumber, indicesToFetch);
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
        console.error("Listening batch fetch error:", err);
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

  // Stop audio and reset audio player when exam index changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setAudioProgress(0);
    setPlayCount(0);
  }, [currentIndex]);

  // Handle Play/Pause Audio
  const togglePlayAudio = () => {
    if (!currentItem?.audioUrl) return;

    if (!audioRef.current) {
      const audio = new Audio(currentItem.audioUrl);
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
          setAudioDuration(audio.duration);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setAudioProgress(0);
        setPlayCount((prev) => prev + 1);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.src = currentItem.audioUrl;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  // Debounced Autosave
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerAutosave = useCallback(
    (newAnswers: Record<string, string>, idx: number) => {
      setSyncStatus("saving");

      try {
        localStorage.setItem(
          `aptis_marathon_draft_LISTENING_p${partNumber}`,
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
            skill: "LISTENING",
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
        skill: "LISTENING",
        partNumber,
        examId: currentItem.examId,
        examIndex: currentIndex,
        answers,
        timeSpentSeconds: 45,
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

  const handleGoNextExam = () => {
    setFeedbackData(null);
    if (currentIndex < catalog.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      triggerAutosave(answers, nextIdx);
    }
  };

  const handleGoPrevExam = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      triggerAutosave(answers, prevIdx);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col select-none">
      {/* 1. Header */}
      <MarathonRoomHeader
        title={currentItem?.title || `Đề thi #${currentIndex + 1}`}
        partLabel={`Listening Part ${partNumber}`}
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
                Đang tải dữ liệu Audio Đề #{currentIndex + 1}...
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
            {/* LEFT COLUMN: Audio Player & Context */}
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
                      <span>Listening Part {partNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Audio Test</span>
                </div>
              </div>

              {/* Instructions */}
              {currentItem.instructions && (
                <div className="p-3 rounded-2xl bg-muted/60 text-xs text-muted-foreground mb-4 border border-border/80">
                  <strong className="text-foreground font-semibold block mb-0.5">
                    Hướng dẫn nghe:
                  </strong>
                  {currentItem.instructions}
                </div>
              )}

              {/* AUDIO PLAYER HERO COMPONENT */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-muted/40 border border-primary/20 mb-4 shadow-xs">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlayAudio}
                      disabled={!currentItem.audioUrl}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-all cursor-pointer ${
                        isPlaying
                          ? "bg-amber-500 hover:bg-amber-600 animate-pulse"
                          : "bg-primary hover:bg-primary/90"
                      } disabled:opacity-40`}
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        {isPlaying ? "Đang phát đoạn băng..." : "Bấm nút để nghe đoạn băng"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Chuẩn phòng thi Aptis ESOL
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono font-bold text-muted-foreground">
                    Đã nghe: {playCount} lần
                  </div>
                </div>

                {/* Audio Progress Bar */}
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-200"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
              </div>

              {/* Audio Transcript Hint (Shown upon completion or practice) */}
              {completedData[currentItem.examId] && currentItem.passageText && (
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-xs mt-auto">
                  <strong className="text-foreground font-semibold flex items-center gap-1.5 mb-1">
                    <FileText className="w-4 h-4 text-primary" />
                    Audio Transcript (Bản dịch bóc băng):
                  </strong>
                  <p className="text-muted-foreground leading-relaxed italic">
                    {currentItem.passageText}
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Questions Form */}
            <div className="bg-card border border-border rounded-3xl p-5 sm:p-6 flex flex-col shadow-xs overflow-y-auto max-h-[calc(100vh-170px)]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Chọn đáp án chính xác ({currentItem.questions.length} câu)
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
                      <div className="flex items-start gap-2 mb-3">
                        <span className="w-5 h-5 rounded-md bg-muted text-foreground flex items-center justify-center text-[11px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-xs font-heading font-extrabold text-foreground leading-relaxed">
                          {q.prompt}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {opts.map((opt, oIdx) => {
                          const isChosen = selected === opt;
                          const letter = String.fromCharCode(65 + oIdx);

                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleSelectAnswer(q.id, opt)}
                              className={`w-full p-3 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between cursor-pointer ${
                                isChosen
                                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40"
                                  : "border-border bg-card hover:bg-muted text-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                                    isChosen
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {letter}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {isChosen && <Check className="w-4 h-4 shrink-0" />}
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
            onClick={handleGoPrevExam}
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
        onNextExam={handleGoNextExam}
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
        onConfirm={() => router.push(`/listening/marathon?part=${partNumber}`)}
        title="Tạm dừng phiên làm Listening Marathon?"
        message={`Tiến trình của bạn tại Đề #${currentIndex + 1} đã được lưu an toàn.`}
      />
    </div>
  );
}
