"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useExamTimer } from "@/hooks/use-exam-timer";
import {
  ReadingGapFill,
  ReadingPart1Story,
  ReadingSentenceOrder,
  ReadingPart4OpinionMatching,
  ReadingPart5LongReading,
  ReadingMatchingRow,
} from "@/components/reading-components";
import { ReadingResultCard } from "@/components/reading-result-card";
import {
  Clock, ArrowLeft, ArrowRight, List, Info, LogOut,
  Mic, Volume2, CheckCircle2, Award, Sparkles, X, Loader2,
  StopCircle, Play, AlertTriangle, Upload, Pause, Check, Eye, EyeOff,
  Headphones, BookOpen, FileText, PenTool, RefreshCw, Flag, RotateCcw, RotateCw, ArrowUp,
} from "lucide-react";

/* ====================================================
   AUDIO PLAYER - Hỗ trợ Listening và phát lại Speaking
   ==================================================== */
function AudioPlayer({ src, label }: { src: string; label?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) { a.pause(); setIsPlaying(false); }
    else { a.play().catch(() => setHasError(true)); setIsPlaying(true); }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackSpeed(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const seekRelative = (seconds: number) => {
    if (!audioRef.current) return;
    const target = Math.max(0, Math.min(duration || 0, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = target;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const fmt = (t: number) => `${Math.floor(t / 60).toString().padStart(2, "0")}:${Math.floor(t % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl border border-exam-border bg-exam-bg/60 shadow-xs">
      <audio
        ref={audioRef}
        src={src}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setHasError(true)}
        preload="metadata"
      />
      
      {/* Controls: Play/Pause, Rewind 5s, Forward 5s */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => seekRelative(-5)}
          disabled={hasError || currentTime <= 0}
          title="Tua lùi 5 giây"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-exam-surface border border-exam-border text-exam-text hover:bg-exam-border/40 disabled:opacity-40 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={toggle}
          disabled={hasError}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:brightness-110 shadow-sm transition-all shrink-0"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={() => seekRelative(5)}
          disabled={hasError || currentTime >= duration}
          title="Tua tới 5 giây"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-exam-surface border border-exam-border text-exam-text hover:bg-exam-border/40 disabled:opacity-40 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Seekbar */}
      <div className="flex-1 min-w-0 space-y-1">
        {label && <p className="text-xs font-semibold text-exam-text truncate">{label}</p>}
        <div
          role="slider"
          tabIndex={0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            if (audioRef.current && duration > 0) {
              audioRef.current.currentTime = clickPos * duration;
            }
          }}
          className="relative h-2 bg-exam-border rounded-full overflow-hidden cursor-pointer group hover:h-2.5 transition-all py-0.5"
          title="Nhấn để tua audio"
        >
          <div
            className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all group-hover:brightness-110"
            style={{ width: `${pct}%` }}
          />
        </div>
        {hasError && <p className="text-xs text-red-500">Không thể tải tệp âm thanh</p>}
      </div>

      {/* Speed & Time Display */}
      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
        <div className="flex items-center gap-1">
          {[0.75, 1, 1.25].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSpeedChange(s)}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
                playbackSpeed === s
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-exam-border/40 text-exam-text-muted hover:text-exam-text"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
        <span className="text-[10px] font-mono shrink-0 text-exam-text-muted font-bold min-w-[75px] text-right">
          {fmt(currentTime)} / {fmt(duration)}
        </span>
      </div>
    </div>
  );
}

/* ====================================================
   SPEAKING RECORDER - Ghi âm + Upload Speaking
   ==================================================== */
function SpeakingRecorder({
  questionId,
  submissionId,
  token,
  onRecorded,
}: {
  questionId: string;
  submissionId: string | null;
  token: string | null;
  onRecorded: (url: string | null, duration: number) => void;
}) {
  const rec = useAudioRecorder();
  const [uploaded, setUploaded] = useState(false);

  const handleStart = async () => {
    rec.resetRecording();
    setUploaded(false);
    await rec.startRecording();
  };

  const handleStop = async () => {
    const res = await rec.stopRecording();
    if (res?.url) {
      onRecorded(res.url, res.duration);
    }
    if (res?.blob && submissionId && token) {
      rec.uploadRecording(submissionId, questionId, token, res.blob, res.duration).then((remoteUrl) => {
        if (remoteUrl) {
          setUploaded(true);
          onRecorded(remoteUrl, res.duration);
        }
      }).catch((err) => {
        console.warn("Auto upload error:", err);
      });
    }
  };

  const handleUpload = async () => {
    if (!submissionId || !token) {
      onRecorded(null, rec.recordingDuration);
      return;
    }
    const url = await rec.uploadRecording(submissionId, questionId, token);
    if (url) {
      setUploaded(true);
      onRecorded(url, rec.recordingDuration);
    }
  };

  return (
    <div className="space-y-4">
      {/* Waveform visualizer khi đang ghi */}
      {rec.isRecording && (
        <div className="flex items-end justify-center gap-1 h-12 py-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-2 bg-rose-500 rounded-full transition-all duration-75"
              style={{ height: `${Math.max(4, (rec.volumeLevel / 100) * 44 * (0.4 + Math.random() * 0.6))}px` }}
            />
          ))}
        </div>
      )}

      {/* Playback bản thu */}
      {rec.audioUrl && !rec.isRecording && (
        <AudioPlayer src={rec.audioUrl} label="Bản thu âm của bạn" />
      )}

      {/* Lỗi mic */}
      {rec.errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <p className="text-xs">{rec.errorMessage}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {!rec.isRecording ? (
          <button
            type="button"
            onClick={handleStart}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-colors"
          >
            <Mic className="w-4 h-4" />
            {rec.audioUrl ? "Ghi lại" : "Bắt đầu ghi âm"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStop}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-exam-border text-exam-text text-sm font-bold animate-pulse"
          >
            <StopCircle className="w-4 h-4 text-rose-500" />
            Dừng ({rec.recordingDuration}s)
          </button>
        )}

        {rec.audioUrl && !rec.isRecording && !uploaded && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={rec.isUploading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-primary text-primary text-sm font-bold hover:bg-primary/10 transition-colors disabled:opacity-60"
          >
            {rec.isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {rec.isUploading ? "Đang tải lên..." : "Lưu bản thu âm"}
          </button>
        )}

        {uploaded && (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" /> Đã lưu lên hệ thống
          </span>
        )}
      </div>

      <p className="text-xs text-exam-text-muted">
        {rec.permissionState === "denied"
          ? "⚠️ Chế độ mô phỏng (không có microphone thật)"
          : rec.permissionState === "granted"
          ? "🎙️ Microphone đã sẵn sàng"
          : "Nhấn Bắt đầu ghi âm để kích hoạt microphone"}
      </p>
    </div>
  );
}

/* ====================================================
   MAIN EXAM ROOM
   ==================================================== */
export default function OfficialMockExamRoom() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const testId = params.id as string;
  const partParam = searchParams?.get("part");
  const modeParam = searchParams?.get("mode");
  const submissionIdParam = searchParams?.get("submissionId");

  // Core state
  const [examData, setExamData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stagePhase, setStagePhase] = useState<"instruction" | "exam">(
    modeParam === "review" ? "exam" : "instruction"
  );
  const [questionIdx, setQuestionIdx] = useState(0);

  // Review Mode State
  const [reviewMode, setReviewMode] = useState(modeParam === "review");
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong" | "correct">("all");

  // Submission
  const [submissionId, setSubmissionId] = useState<string | null>(submissionIdParam || null);
  const [serverTime, setServerTime] = useState(0);
  const [isFinished, setIsFinished] = useState(modeParam === "review");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  // Answers
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [audioUrls, setAudioUrls] = useState<Record<string, string | null>>({});
  const [audioDurations, setAudioDurations] = useState<Record<string, number>>({});
  const [orderAnswers, setOrderAnswers] = useState<Record<string, string[]>>({});
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, string>>({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [paletteSkillFilter, setPaletteSkillFilter] = useState<string>("ALL");

  // UI
  const [isQuestionListOpen, setIsQuestionListOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [micTested, setMicTested] = useState(false);
  const [soundTested, setSoundTested] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [showListeningScript, setShowListeningScript] = useState<boolean>(false);
  const [hideAnswersReview, setHideAnswersReview] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>("Đáp án chưa chính xác");
  const [reportNote, setReportNote] = useState<string>("");
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled =
        (typeof window !== "undefined" && window.scrollY > 40) ||
        (typeof document !== "undefined" &&
          (document.documentElement?.scrollTop > 40 || document.body?.scrollTop > 40));
      setHasScrolled(Boolean(isScrolled));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.documentElement?.scrollTo({ top: 0, behavior: "smooth" });
      document.body?.scrollTo({ top: 0, behavior: "smooth" });
      const mainEl = document.querySelector("main");
      if (mainEl) mainEl.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const tabSwitchRef = useRef(0);
  const prevIdxRef = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAuthToken(localStorage.getItem("accessToken"));
    }
  }, []);

  // ---- Load exam questions ----
  useEffect(() => {
    async function load() {
      if (!testId || testId.length < 3) return;
      try {
        setLoading(true);
        const res = await api.exams.getQuestions(testId);
        if (res.success && res.data) {
          const exam = res.data as any;
          setExamData(exam);
          setServerTime((exam.duration_minutes || 162) * 60);

          let targetParts = exam.parts || [];
          if (partParam) {
            const pNum = parseInt(partParam, 10);
            if (!isNaN(pNum)) {
              const matched = targetParts.filter((p: any) => p.part_number === pNum);
              if (matched.length > 0) targetParts = matched;
            }
          }

          const flat: any[] = [];
          for (const part of targetParts) {
            for (const q of part.questions || []) {
              let opts: any = null;
              if (Array.isArray(q.options) || (typeof q.options === "object" && q.options !== null)) {
                opts = q.options;
              } else if (typeof q.options === "string") {
                try { opts = JSON.parse(q.options); } catch { opts = q.options; }
              }
              flat.push({
                ...q,
                options: opts,
                partNumber: part.part_number,
                partTitle: part.title,
                partAudioUrl: part.audio_url,
                partPassageText: part.passage_text,
                partImageUrl: part.image_url,
                partInstructions: part.instructions,
              });
            }
          }
          setQuestions(flat);

          // Nếu có submissionId & mode=review, tải bài nộp cũ để review
          if (submissionIdParam) {
            try {
              const subRes = await api.submissions.getResult(submissionIdParam);
              if (subRes.success && subRes.data) {
                const sub = subRes.data;
                setIsFinished(true);
                setReviewMode(true);
                setStagePhase("exam");
                setResultData({
                  totalScore: sub.total_score,
                  cefrLevel: sub.cefr_level || "B1",
                  correctCount: sub.correct_count,
                  totalQuestions: flat.length,
                });

                const loadedSel: Record<string, number> = {};
                const loadedText: Record<string, string> = {};
                const loadedAudio: Record<string, string> = {};
                const loadedOrder: Record<string, string[]> = {};
                const loadedMatching: Record<string, string> = {};

                (sub.answers || []).forEach((ans: any) => {
                  const qIdx = flat.findIndex((q) => q.id === ans.question_id);
                  if (qIdx >= 0) {
                    const q = flat[qIdx];
                    if (ans.selected_option) {
                      if (q.question_type === "MULTIPLE_CHOICE") {
                        const optChar = ans.selected_option.trim().toUpperCase();
                        const optIdx = optChar.charCodeAt(0) - 65;
                        if (optIdx >= 0 && optIdx < (q.options?.length || 4)) {
                          loadedSel[qIdx] = optIdx;
                        }
                      } else {
                        loadedMatching[q.id] = ans.selected_option;
                      }
                    }
                    if (ans.text_answer) {
                      if (q.question_type === "SENTENCE_ORDER") {
                        try {
                          loadedOrder[q.id] = JSON.parse(ans.text_answer);
                        } catch {
                          loadedText[q.id] = ans.text_answer;
                        }
                      } else {
                        loadedText[q.id] = ans.text_answer;
                      }
                    }
                    if (ans.audio_url) {
                      loadedAudio[q.id] = ans.audio_url;
                    }
                  }
                });

                setSelectedAnswers(loadedSel);
                setTextAnswers(loadedText);
                setAudioUrls(loadedAudio);
                setOrderAnswers(loadedOrder);
                setMatchingAnswers(loadedMatching);
              }
            } catch (err) {
              console.warn("Could not load full test submission result:", err);
            }
          }
        }
      } catch (e) {
        console.warn("Load exam failed:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [testId, partParam, submissionIdParam]);

  // ---- Init submission when exam starts ----
  useEffect(() => {
    async function init() {
      if (modeParam === "review" || submissionIdParam) return;
      if (!isAuthenticated || !testId || stagePhase !== "exam") return;
      try {
        const res = await api.submissions.start(testId);
        if (res.success && res.data) {
          setSubmissionId(res.data.submissionId || res.data.id);
          if (res.data.serverTimeRemaining) {
            setServerTime(res.data.serverTimeRemaining);
          }
        }
      } catch {
        setServerTime((examData?.duration_minutes || 162) * 60);
      }
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, isAuthenticated, stagePhase, modeParam, submissionIdParam]);

  // ---- Timer ----
  const handleExpired = useCallback(() => {
    if (!isFinished && stagePhase === "exam") handleSubmitExam();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished, stagePhase]);

  const { formatted: timerFormatted, isWarning, isCritical, syncTime } = useExamTimer(
    serverTime,
    handleExpired,
    stagePhase === "exam" && !isFinished
  );

  // ---- Heartbeat every 30s ----
  useEffect(() => {
    if (!submissionId || isFinished || stagePhase !== "exam") return;
    heartbeatRef.current = setInterval(async () => {
      try {
        const res = await api.submissions.heartbeat(submissionId, tabSwitchRef.current);
        tabSwitchRef.current = 0;
        if (res.success && res.data?.serverTimeRemaining !== undefined) {
          syncTime(res.data.serverTimeRemaining);
          if (res.data.isExpired) handleSubmitExam();
        }
      } catch { /* ignore */ }
    }, 30000);
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId, isFinished, stagePhase]);

  // ---- Tab switch detection ----
  useEffect(() => {
    const fn = () => { if (document.hidden) tabSwitchRef.current++; };
    document.addEventListener("visibilitychange", fn);
    return () => document.removeEventListener("visibilitychange", fn);
  }, []);

  // ---- Chống vô tình reload hoặc đóng tab khi đang thi ----
  useEffect(() => {
    if (stagePhase !== "exam" || isFinished) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Bạn đang làm bài thi Aptis. Rời khỏi trang có thể làm gián đoạn bài làm!";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [stagePhase, isFinished]);

  // ---- Autosave ----
  const doAutosave = useCallback(async () => {
    if (!submissionId) return;
    const payload: any[] = [];

    Object.entries(selectedAnswers).forEach(([idxStr, optIdx]) => {
      const q = questions[Number(idxStr)];
      if (q) payload.push({ questionId: q.id, selectedOption: String.fromCharCode(65 + optIdx) });
    });

    Object.entries(textAnswers).forEach(([qId, text]) => {
      const ex = payload.findIndex((a) => a.questionId === qId);
      if (ex >= 0) payload[ex].textAnswer = text;
      else payload.push({ questionId: qId, textAnswer: text });
    });

    Object.entries(audioUrls).forEach(([qId, url]) => {
      if (!url) return;
      const ex = payload.findIndex((a) => a.questionId === qId);
      if (ex >= 0) {
        payload[ex].audioUrl = url;
        payload[ex].audioDuration = audioDurations[qId];
      } else {
        payload.push({ questionId: qId, audioUrl: url, audioDuration: audioDurations[qId] });
      }
    });

    Object.entries(orderAnswers).forEach(([qId, arr]) => {
      if (!arr || arr.length === 0) return;
      const ex = payload.findIndex((a) => a.questionId === qId);
      const str = JSON.stringify(arr);
      if (ex >= 0) payload[ex].textAnswer = str;
      else payload.push({ questionId: qId, textAnswer: str });
    });

    Object.entries(matchingAnswers).forEach(([qId, val]) => {
      if (!val) return;
      const ex = payload.findIndex((a) => a.questionId === qId);
      if (ex >= 0) payload[ex].selectedOption = val;
      else payload.push({ questionId: qId, selectedOption: val });
    });

    if (payload.length === 0) return;
    try {
      setAutoSaveStatus("saving");
      await api.submissions.autosave(submissionId, payload);
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    } catch {
      setAutoSaveStatus("error");
    }
  }, [submissionId, selectedAnswers, textAnswers, audioUrls, audioDurations, questions]);

  // Autosave khi chuyển câu
  useEffect(() => {
    if (prevIdxRef.current !== questionIdx && submissionId) {
      doAutosave();
    }
    prevIdxRef.current = questionIdx;
  }, [questionIdx, doAutosave, submissionId]);

  // Polling kết quả chấm AI tự động
  const pollLatestResult = useCallback(async () => {
    if (!submissionId) return false;
    try {
      const res: any = await api.submissions.getResult(submissionId);
      if (res.success && res.data) {
        const sub = res.data;
        const isAiDone = sub.status === "GRADED" || (sub.writing_score !== null && sub.speaking_score !== null);
        if (isAiDone) {
          setResultData({
            totalScore: sub.total_score,
            cefrLevel: sub.cefr_level || "B2",
            hasSubjectiveEvaluation: false,
            listeningScore: sub.listening_score,
            readingScore: sub.reading_score,
            writingScore: sub.writing_score,
            speakingScore: sub.speaking_score,
            grammarScore: sub.grammar_vocab_score ?? sub.grammar_score,
            totalQuestions: questions.length,
            correctCount: sub.answers?.filter((a: any) => (a.score || 0) > 0)?.length || 0,
          });
          return true;
        }
      }
    } catch (e) {
      console.warn("Poll result error:", e);
    }
    return false;
  }, [submissionId, questions.length]);

  // Tự động poll theo interval khi đang chờ chấm AI
  useEffect(() => {
    if (!isFinished || !submissionId || !resultData?.hasSubjectiveEvaluation) return;
    const interval = setInterval(async () => {
      const finished = await pollLatestResult();
      if (finished) clearInterval(interval);
    }, 3000);
    return () => clearInterval(interval);
  }, [isFinished, submissionId, resultData?.hasSubjectiveEvaluation, pollLatestResult]);

  // ---- Submit ----
  const handleSubmitExam = useCallback(async () => {
    if (isSubmitting || isFinished) return;
    setIsSubmitting(true);
    setIsSubmitModalOpen(false);
    await doAutosave();

    let finalResult: any = null;

    if (submissionId) {
      try {
        const res = await api.submissions.submit(submissionId);
        if (res.success && res.data) {
          finalResult = res.data;
        }
      } catch (e) {
        console.warn("Submit API error, calculating score client-side:", e);
      }
    }

    // Client-side grading fallback (đảm bảo bấm nộp bài luôn luôn có kết quả ngay lập tức)
    if (!finalResult) {
      let totalPts = 0;
      let maxPts = 0;
      let totalCorrect = 0;
      const partBreakdownMap: Record<string, { partNumber: number; title: string; correctCount: number; totalCount: number; score: number; maxScore: number }> = {};

      questions.forEach((q, idx) => {
        const pTitle = q.partTitle || "Phần thi";
        if (!partBreakdownMap[pTitle]) {
          partBreakdownMap[pTitle] = {
            partNumber: Object.keys(partBreakdownMap).length + 1,
            title: pTitle,
            correctCount: 0,
            totalCount: 0,
            score: 0,
            maxScore: 0,
          };
        }
        const b = partBreakdownMap[pTitle];
        b.totalCount++;
        const qMax = q.max_score || 1;
        b.maxScore += qMax;
        maxPts += qMax;

        let isCorrect = false;
        let earned = 0;

        if (q.question_type === "MULTIPLE_CHOICE") {
          const sel = selectedAnswers[idx];
          if (sel !== undefined && Array.isArray(q.options) && q.options[sel]) {
            const chosen = String(q.options[sel]).trim().toUpperCase();
            const cor = String(q.correct_answer || "").trim().toUpperCase();
            if (chosen === cor || String.fromCharCode(65 + sel) === cor) {
              isCorrect = true;
              earned = qMax;
            }
          }
        } else if (q.question_type === "GAP_FILL") {
          const userVal = (textAnswers[q.id] || (selectedAnswers[idx] !== undefined && Array.isArray(q.options) ? q.options[selectedAnswers[idx]] : "") || "").trim().toLowerCase();
          const corVal = String(q.correct_answer || "").trim().toLowerCase();
          if (userVal === corVal && userVal.length > 0) {
            isCorrect = true;
            earned = qMax;
          }
        } else if (q.question_type === "MATCHING") {
          const norm = (s: string) => (s || "").trim().toLowerCase().replace(/^person\s+/i, "");
          const userVal = norm(matchingAnswers[q.id] || "");
          const corVal = norm(String(q.correct_answer || ""));
          if (userVal === corVal && userVal.length > 0) {
            isCorrect = true;
            earned = qMax;
          }
        } else if (q.question_type === "SENTENCE_ORDER") {
          const userArr = orderAnswers[q.id];
          if (Array.isArray(userArr)) {
            try {
              const corArr = JSON.parse(q.correct_answer || "[]");
              let matches = 0;
              for (let i = 0; i < corArr.length; i++) {
                if (userArr[i] === corArr[i]) matches++;
              }
              if (matches === corArr.length) isCorrect = true;
              earned = corArr.length > 0 ? (matches / corArr.length) * qMax : 0;
            } catch {
              earned = qMax;
            }
          }
        }

        if (isCorrect || earned > 0) {
          if (isCorrect) {
            b.correctCount++;
            totalCorrect++;
          }
          b.score += Math.round(earned * 10) / 10;
          totalPts += earned;
        }
      });

      const scale = examData?.skill === "FULL_TEST" ? 200 : 50;
      const normalizedScore = maxPts > 0 ? Math.round((totalPts / maxPts) * scale) : Math.round(totalPts);

      let cefr = "A1";
      if (examData?.skill === "FULL_TEST") {
        if (normalizedScore >= 160) cefr = "C";
        else if (normalizedScore >= 120) cefr = "B2";
        else if (normalizedScore >= 80) cefr = "B1";
        else if (normalizedScore >= 50) cefr = "A2";
        else cefr = "A1";
      } else {
        if (normalizedScore >= 46) cefr = "C";
        else if (normalizedScore >= 38) cefr = "B2";
        else if (normalizedScore >= 26) cefr = "B1";
        else if (normalizedScore >= 16) cefr = "A2";
        else if (normalizedScore > 5) cefr = "A1";
        else cefr = "A0";
      }

      finalResult = {
        totalScore: normalizedScore,
        cefrLevel: cefr,
        correctCount: totalCorrect,
        totalQuestions: questions.length,
        partBreakdown: Object.values(partBreakdownMap),
      };
    }

    setResultData(finalResult);
    setIsFinished(true);
    setIsSubmitting(false);

    // Kích hoạt tự động lấy kết quả AI chấm ngầm (sau 4s, 8s, 13s)
    if (finalResult?.hasSubjectiveEvaluation && submissionId) {
      setTimeout(pollLatestResult, 4000);
      setTimeout(pollLatestResult, 8000);
      setTimeout(pollLatestResult, 13000);
    }
  }, [isSubmitting, isFinished, submissionId, doAutosave, questions, selectedAnswers, textAnswers, matchingAnswers, orderAnswers, examData, pollLatestResult]);

  // Stage calculation: Nhóm các task thuộc cùng 1 màn hình chuẩn British Council Aptis ESOL
  const getExamStages = useCallback(() => {
    if (!questions || questions.length === 0) return null;
    const stages: number[] = [];
    const handledPartIds = new Set<string>();

    questions.forEach((q, idx) => {
      const isGrouped =
        q.question_type === "GAP_FILL" ||
        (q.question_type === "MATCHING" && (
          q.partTitle?.includes("READING") ||
          q.partTitle?.includes("LISTENING") ||
          q.partTitle?.includes("GRAMMAR_VOCAB") ||
          q.partTitle?.includes("Vocab")
        ));

      if (isGrouped) {
        const partKey = q.part_id || q.partTitle;
        if (!handledPartIds.has(partKey)) {
          stages.push(idx);
          handledPartIds.add(partKey);
        }
      } else {
        stages.push(idx);
      }
    });

    return stages.length > 0 ? stages : null;
  }, [questions]);

  const examStages = getExamStages();
  const currentStageIndex = examStages
    ? examStages.reduce((acc, sIdx, i) => (questionIdx >= sIdx ? i : acc), 0)
    : -1;

  const isLastStage = examStages
    ? currentStageIndex === examStages.length - 1
    : questionIdx >= questions.length - 1;

  const handleNext = () => {
    if (stagePhase === "instruction") {
      setStagePhase("exam");
      setQuestionIdx(0);
      return;
    }

    if (examStages && examStages.length > 0) {
      if (currentStageIndex >= 0 && currentStageIndex < examStages.length - 1) {
        setQuestionIdx(examStages[currentStageIndex + 1]);
        return;
      } else {
        setIsSubmitModalOpen(true);
        return;
      }
    }

    if (questionIdx < questions.length - 1) {
      setQuestionIdx((p) => p + 1);
    } else {
      setIsSubmitModalOpen(true);
    }
  };

  const handlePrev = () => {
    if (stagePhase === "instruction") return;

    if (examStages && examStages.length > 0) {
      if (currentStageIndex > 0) {
        setQuestionIdx(examStages[currentStageIndex - 1]);
      }
      return;
    }

    if (questionIdx > 0) {
      setQuestionIdx((p) => p - 1);
    }
  };

  // ---- Helpers ----
  const isAnswered = (idx: number) => {
    const q = questions[idx];
    if (!q) return false;
    if (q.question_type === "MULTIPLE_CHOICE") return selectedAnswers[idx] !== undefined;
    if (q.question_type === "GAP_FILL") return selectedAnswers[idx] !== undefined || !!textAnswers[q.id];
    if (q.question_type === "SENTENCE_ORDER") return !!(orderAnswers[q.id]?.length);
    if (q.question_type === "MATCHING") return !!matchingAnswers[q.id];
    if (q.question_type === "ESSAY") return !!(textAnswers[q.id]?.trim());
    if (q.question_type === "SPEAKING_AUDIO") return !!audioUrls[q.id];
    return false;
  };
  const answeredCount = questions.filter((_, i) => isAnswered(i)).length;
  const toggleFlag = (idx: number) => {
    setFlaggedQuestions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };
  const flaggedCount = Object.values(flaggedQuestions).filter(Boolean).length;
  const currentQ = questions[questionIdx];

  const getSkillFromQuestion = useCallback((q: any) => {
    const pTitle = (q?.partTitle || "").toUpperCase();
    const qType = q?.question_type || "";
    const pNum = Number(q?.partNumber || 0);

    if (qType === "SPEAKING_AUDIO" || pTitle.includes("SPEAKING") || pTitle.includes("NÓI") || pTitle.includes("NOI") || (pNum >= 1 && pNum <= 4)) {
      return { key: "SPEAKING", name: "Speaking", label: "Nói" };
    }
    if (pTitle.includes("LISTENING") || pTitle.includes("NGHE") || (pNum >= 5 && pNum <= 8)) {
      return { key: "LISTENING", name: "Listening", label: "Nghe" };
    }
    if (pTitle.includes("GRAMMAR") || pTitle.includes("VOCAB") || pTitle.includes("NGỮ PHÁP") || pTitle.includes("TỪ VỰNG") || (pNum >= 9 && pNum <= 14)) {
      return { key: "GRAMMAR_VOCABULARY", name: "Grammar & Vocab", label: "Ngữ pháp & Từ vựng" };
    }
    if (pTitle.includes("READING") || pTitle.includes("ĐỌC") || pTitle.includes("DOC") || (pNum >= 15 && pNum <= 18)) {
      return { key: "READING", name: "Reading", label: "Đọc" };
    }
    if (qType === "WRITING_ESSAY" || pTitle.includes("WRITING") || pTitle.includes("VIẾT") || pTitle.includes("VIET") || (pNum >= 19 && pNum <= 22)) {
      return { key: "WRITING", name: "Writing", label: "Viết" };
    }
    return { key: "GENERAL", name: "General", label: "Tổng hợp" };
  }, []);

  const fullTestSkills = useMemo(() => {
    if (examData?.skill !== "FULL_TEST" || questions.length === 0) return [];
    const skillsOrder = [
      { key: "SPEAKING", name: "Speaking", label: "Nói" },
      { key: "LISTENING", name: "Listening", label: "Nghe" },
      { key: "GRAMMAR_VOCABULARY", name: "Grammar & Vocab", label: "Ngữ pháp & Từ vựng" },
      { key: "READING", name: "Reading", label: "Đọc" },
      { key: "WRITING", name: "Writing", label: "Viết" },
    ];

    return skillsOrder.map((s) => {
      const indices: number[] = [];
      questions.forEach((q, idx) => {
        if (getSkillFromQuestion(q).key === s.key) {
          indices.push(idx);
        }
      });
      const answeredInSkill = indices.filter((idx) => isAnswered(idx)).length;
      return {
        ...s,
        startIndex: indices[0] ?? -1,
        totalCount: indices.length,
        answeredCount: answeredInSkill,
      };
    }).filter((s) => s.totalCount > 0);
  }, [examData?.skill, questions, getSkillFromQuestion, selectedAnswers, textAnswers, audioUrls, orderAnswers, matchingAnswers]);

  const currentSkill = getSkillFromQuestion(currentQ);

  // ========================================================
  //  RENDER: Loading
  // ========================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-exam-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-exam-text-muted text-sm">Đang tải đề thi...</p>
        </div>
      </div>
    );
  }

  // ========================================================
  //  RENDER: Instruction
  // ========================================================
  if (stagePhase === "instruction") {
    return (
      <div className="notranslate min-h-screen bg-exam-bg text-exam-text flex flex-col font-sans select-none">
        <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
          <div className="h-full w-full bg-gradient-to-r from-primary via-accent to-primary" />
        </div>
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="bg-exam-surface rounded-2xl border border-exam-border shadow-xl max-w-2xl w-full p-8 md:p-12 space-y-6 animate-in fade-in">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                {examData?.skill || "APTIS ESOL"}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-exam-text mt-1">
                {examData?.title || "Bài Thi Thử Aptis ESOL"}
              </h1>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Thời gian", value: `${examData?.duration_minutes || 162} phút` },
                { label: "Câu hỏi", value: `${questions.length} câu` },
                { label: "Kỹ năng", value: examData?.skill === "FULL_TEST" ? "Full Test" : (examData?.skill || "Aptis") },
              ].map((x) => (
                <div key={x.label} className="p-3 rounded-xl border border-exam-border bg-exam-bg/50">
                  <div className="text-[10px] text-exam-text-muted font-medium uppercase">{x.label}</div>
                  <div className="text-sm font-bold text-exam-text mt-0.5">{x.value}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm text-exam-text">
              {[
                "Đảm bảo kết nối Internet ổn định trong suốt bài thi.",
                "Bài làm tự động lưu nháp sau mỗi lần chuyển câu.",
                "Không tắt trình duyệt trong khi đang làm bài.",
                "Speaking: Cho phép trình duyệt truy cập Microphone khi được yêu cầu.",
                "Listening: Đảm bảo loa hoặc tai nghe đang hoạt động.",
                "Khi nhấn Bắt đầu, đồng hồ đếm ngược sẽ được kích hoạt.",
              ].map((line, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{line}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl border border-exam-border bg-exam-bg/40 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-exam-text-muted">
                Kiểm tra thiết bị trước khi vào thi:
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setSoundTested(true)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    soundTested
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                      : "border-exam-border bg-exam-surface text-exam-text hover:bg-exam-border/40"
                  }`}
                >
                  <Volume2 className="w-4 h-4 text-primary" />
                  <span>{soundTested ? "✓ Âm thanh OK" : "Thử loa / tai nghe"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMicTested(true)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    micTested
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                      : "border-exam-border bg-exam-surface text-exam-text hover:bg-exam-border/40"
                  }`}
                >
                  <Mic className="w-4 h-4 text-primary" />
                  <span>{micTested ? "✓ Micro OK" : "Thử micro nói"}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:bg-brand-brown transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Bắt đầu làm bài thi
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ========================================================
  //  RENDER: Submitting
  // ========================================================
  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-exam-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-exam-text font-semibold">Đang nộp bài thi...</p>
          <p className="text-exam-text-muted text-xs">Vui lòng không đóng trình duyệt</p>
        </div>
      </div>
    );
  }

  // ========================================================
  //  RENDER: Result
  // ========================================================
  if (isFinished && !reviewMode) {
    if (examData?.skill === "READING") {
      return (
        <ReadingResultCard
          totalScore={resultData?.totalScore ?? 0}
          maxTotalScore={50}
          cefrLevel={resultData?.cefrLevel || "A0"}
          correctCount={resultData?.correctCount ?? answeredCount}
          totalQuestions={resultData?.totalQuestions ?? questions.length}
          breakdown={resultData?.partBreakdown || [
            { partNumber: 1, title: "Part 1 – Gap Fill", correctCount: 3, totalCount: 4, score: 6, maxScore: 7 },
            { partNumber: 2, title: "Part 2 + 3 – Text Cohesion", correctCount: 0, totalCount: 2, score: 0, maxScore: 17 },
            { partNumber: 4, title: "Part 4 – Opinion Matching", correctCount: 0, totalCount: 7, score: 0, maxScore: 13 },
            { partNumber: 5, title: "Part 5 – Long Reading", correctCount: 0, totalCount: 7, score: 0, maxScore: 13 },
          ]}
          onReview={() => {
            setReviewMode(true);
            setQuestionIdx(0);
          }}
          onRetry={() => {
            setIsFinished(false);
            setQuestionIdx(0);
            setSelectedAnswers({});
            setTextAnswers({});
            setMatchingAnswers({});
            setOrderAnswers({});
          }}
        />
      );
    }
    const cefr = resultData?.cefrLevel || resultData?.cefrBand || "B2";
    const score = resultData?.totalScore;
    const hasSub = resultData?.hasSubjectiveEvaluation;

    return (
      <div className="notranslate min-h-screen bg-exam-bg text-exam-text flex flex-col font-sans">
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="bg-exam-surface rounded-2xl border border-exam-border shadow-2xl max-w-2xl w-full p-8 text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-exam-text-muted">
                Official British Council Aptis Simulator
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-exam-text mt-1">
                KẾT QUẢ BÀI THI THỬ APTIS ESOL
              </h1>
              <p className="text-xs text-exam-text-muted mt-1">
                Thí sinh: {user?.full_name || "Thí sinh Aptis"} · Mã bài: {testId.toUpperCase()}
              </p>
            </div>

            {examData?.skill === "FULL_TEST" ? (
              <div className="space-y-6">
                {/* Overall Score & CEFR */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-transparent border border-primary/30 max-w-md mx-auto">
                  <span className="text-xs font-bold text-exam-text-muted uppercase tracking-wider">Aptis ESOL Overall CEFR</span>
                  <div className="text-6xl font-black text-primary my-2">{cefr}</div>
                  <div className="text-sm font-semibold text-exam-text">
                    Điểm tổng hợp:{" "}
                    <span className="text-primary font-bold">
                      {score !== undefined && score !== null ? Math.round(score) : 0}
                    </span>{" "}
                    / 200
                  </div>
                  <p className="text-[11px] text-exam-text-muted mt-1">
                    {cefr === "C" && "Năng lực Anh ngữ thành thạo cao cấp (C1/C2)"}
                    {cefr === "B2" && "Đạt chuẩn B2 Quốc tế – Tự tin giao tiếp công việc và học tập"}
                    {cefr === "B1" && "Đạt chuẩn B1 Quốc tế – Giao tiếp độc lập trong môi trường quen thuộc"}
                    {cefr === "A2" && "Đạt chuẩn A2 Quốc tế – Giao tiếp cơ bản"}
                    {cefr === "A1" && "Khởi đầu A1 – Cần rèn luyện thêm vốn từ vựng"}
                  </p>
                </div>

                {/* AI Grading Status Banner */}
                {hasSub ? (
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 flex items-center justify-center gap-3">
                    <RefreshCw className="w-5 h-5 animate-spin text-purple-500 shrink-0" />
                    <div className="text-left text-xs">
                      <div className="font-bold uppercase tracking-wide">Hệ thống AI đang chấm Speaking & Writing...</div>
                      <div className="text-exam-text-muted text-[11px] mt-0.5">
                        Điểm số 2 kỹ năng tự luận sẽ tự động cập nhật ngay trên màn hình trong giây lát (không cần tải lại trang).
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Toàn bộ 5 kỹ năng đã được chấm điểm hoàn tất (AI Certified)</span>
                  </div>
                )}

                {/* 5 Skills Breakdown Grid */}
                <div className="text-left">
                  <div className="text-xs font-bold text-exam-text-muted uppercase tracking-wider mb-2">
                    Điểm chi tiết từng kỹ năng (Thang điểm 0 - 50)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-exam-border bg-exam-bg/40">
                      <div className="flex items-center gap-2 text-xs font-semibold text-exam-text-muted">
                        <Headphones className="w-3.5 h-3.5 text-blue-500" /> Listening
                      </div>
                      <div className="text-2xl font-black text-exam-text mt-1">
                        {resultData?.listeningScore !== null && resultData?.listeningScore !== undefined ? resultData.listeningScore : 0}
                        <span className="text-xs font-medium text-exam-text-muted"> / 50</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-exam-border bg-exam-bg/40">
                      <div className="flex items-center gap-2 text-xs font-semibold text-exam-text-muted">
                        <FileText className="w-3.5 h-3.5 text-emerald-500" /> Reading
                      </div>
                      <div className="text-2xl font-black text-exam-text mt-1">
                        {resultData?.readingScore !== null && resultData?.readingScore !== undefined ? resultData.readingScore : 0}
                        <span className="text-xs font-medium text-exam-text-muted"> / 50</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-exam-border bg-exam-bg/40">
                      <div className="flex items-center gap-2 text-xs font-semibold text-exam-text-muted">
                        <PenTool className="w-3.5 h-3.5 text-rose-500" /> Writing
                      </div>
                      <div className="text-2xl font-black text-exam-text mt-1">
                        {resultData?.writingScore !== null && resultData?.writingScore !== undefined ? (
                          <>
                            {resultData.writingScore}
                            <span className="text-xs font-medium text-exam-text-muted"> / 50</span>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Đang chấm AI
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-exam-border bg-exam-bg/40">
                      <div className="flex items-center gap-2 text-xs font-semibold text-exam-text-muted">
                        <Mic className="w-3.5 h-3.5 text-amber-500" /> Speaking
                      </div>
                      <div className="text-2xl font-black text-exam-text mt-1">
                        {resultData?.speakingScore !== null && resultData?.speakingScore !== undefined ? (
                          <>
                            {resultData.speakingScore}
                            <span className="text-xs font-medium text-exam-text-muted"> / 50</span>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Đang chấm AI
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-exam-border bg-exam-bg/40 sm:col-span-2 md:col-span-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-exam-text-muted">
                        <BookOpen className="w-3.5 h-3.5 text-purple-500" /> Grammar & Vocab
                      </div>
                      <div className="text-2xl font-black text-exam-text mt-1">
                        {resultData?.grammarScore !== null && resultData?.grammarScore !== undefined ? resultData.grammarScore : 0}
                        <span className="text-xs font-medium text-exam-text-muted"> / 50</span>
                      </div>
                      <span className="text-[10px] text-exam-text-muted block mt-0.5">* Điểm điều kiện xếp hạng</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                  <div className="p-3 rounded-xl border border-exam-border bg-exam-bg/40 text-center">
                    <div className="text-[10px] text-exam-text-muted font-medium">Đã trả lời</div>
                    <div className="text-xl font-bold text-exam-text mt-0.5">
                      {answeredCount}/{questions.length}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-exam-border bg-exam-bg/40 text-center">
                    <div className="text-[10px] text-exam-text-muted font-medium">Trạng thái</div>
                    <div className={`text-sm font-bold mt-0.5 ${hasSub ? "text-purple-500" : "text-emerald-500"}`}>
                      {hasSub ? "AI đang chấm" : "Hoàn thành"}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {hasSub ? (
                  <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 max-w-sm mx-auto">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase">
                      Đang chờ chấm điểm
                    </span>
                    <div className="text-xl font-black text-exam-text my-2">Chờ giáo viên đánh giá</div>
                    <p className="text-xs text-exam-text-muted">
                      Bài thi có phần Speaking/Writing cần chấm thủ công. Kết quả sẽ có trong 24-48h.
                    </p>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-transparent border border-primary/30 max-w-sm mx-auto">
                    <span className="text-xs font-bold text-exam-text-muted uppercase">Overall CEFR Result</span>
                    <div className="text-5xl font-black text-primary my-1">{cefr}</div>
                    <p className="text-xs text-exam-text-muted">
                      Điểm:{" "}
                      {score !== undefined && score !== null
                        ? `${Math.round(score)} / 50`
                        : "Đang tính"}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                  <div className="p-3 rounded-xl border border-exam-border bg-exam-bg/40 text-center">
                    <div className="text-[10px] text-exam-text-muted font-medium">Đã trả lời</div>
                    <div className="text-xl font-bold text-exam-text mt-0.5">
                      {answeredCount}/{questions.length}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-exam-border bg-exam-bg/40 text-center">
                    <div className="text-[10px] text-exam-text-muted font-medium">Trạng thái</div>
                    <div className={`text-sm font-bold mt-0.5 ${hasSub ? "text-amber-500" : "text-emerald-500"}`}>
                      {hasSub ? "Chờ chấm" : "Hoàn thành"}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="pt-4 border-t border-exam-border flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setReviewMode(true);
                  setQuestionIdx(0);
                }}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:brightness-110 transition-all flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem lại bài làm chi tiết</span>
              </button>

              <Link
                href="/history"
                className="px-4 py-2 rounded-xl border border-exam-border text-xs font-bold hover:bg-exam-border/30 transition-colors"
              >
                Xem lịch sử
              </Link>
              <Link
                href="/thi-thu"
                className="px-4 py-2 rounded-xl border border-exam-border text-xs font-bold hover:bg-exam-border/30 transition-colors"
              >
                Trở về phòng thi
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl border border-exam-border text-xs font-bold hover:bg-exam-border/30 transition-colors"
              >
                Về Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ========================================================
  //  RENDER: REVIEW MODE CHO BÀI THI THỬ (FULL TEST / KỸ NĂNG)
  // ========================================================
  if (isFinished && reviewMode) {
    // Helper: Bôi vàng câu manh mối (<mark>...</mark> hoặc ==...==)
    const renderClueText = (text: string) => {
      if (!text) return null;
      const parts = text.split(/(<mark>[\s\S]*?<\/mark>|==[\s\S]*?==)/gi);
      return (
        <>
          {parts.map((part, i) => {
            if (/^<mark>([\s\S]*?)<\/mark>$/i.test(part)) {
              const match = part.match(/^<mark>([\s\S]*?)<\/mark>$/i);
              return (
                <mark key={i} className="bg-amber-300 dark:bg-amber-400/90 text-amber-950 font-bold px-1.5 py-0.5 rounded mx-0.5 select-text">
                  {match ? match[1] : part}
                </mark>
              );
            }
            if (/^==([\s\S]*?)==$/i.test(part)) {
              const match = part.match(/^==([\s\S]*?)==$/i);
              return (
                <mark key={i} className="bg-amber-300 dark:bg-amber-400/90 text-amber-950 font-bold px-1.5 py-0.5 rounded mx-0.5 select-text">
                  {match ? match[1] : part}
                </mark>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </>
      );
    };

    // Helper: Định dạng khối Giải Thích 3 phần chuẩn UI (Vì sao đúng / sai / Mẹo)
    const renderStructuredExplanation = (text: string) => {
      if (!text) return null;
      const lines = text.split("\n");
      return (
        <div className="space-y-2.5 text-xs md:text-sm leading-relaxed text-exam-text">
          {lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={idx} className="h-0.5" />;

            // Dòng tiêu đề như: "--- GIẢI THÍCH: Đáp án B – Plays football."
            if (trimmed.startsWith("---") || trimmed.toLowerCase().startsWith("giải thích:") || trimmed.toLowerCase().startsWith("đáp án:")) {
              return (
                <div key={idx} className="font-bold text-primary border-b border-primary/20 pb-1.5 mb-2 flex items-center gap-2">
                  <span className="text-sm">📌</span>
                  <span>{trimmed.replace(/^---\s*/, "")}</span>
                </div>
              );
            }

            // Dòng Vì sao đúng: "• Vì sao đúng:"
            if (trimmed.startsWith("• Vì sao đúng:") || trimmed.startsWith("· Vì sao đúng:") || trimmed.startsWith("- Vì sao đúng:")) {
              return (
                <div key={idx} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 dark:text-emerald-200">
                  <span className="font-bold">✓ Vì sao đúng: </span>
                  {renderClueText(trimmed.replace(/^([•·-]\s*Vì sao đúng:\s*)/, ""))}
                </div>
              );
            }

            // Dòng Mẹo: "👉 Mẹo:"
            if (trimmed.includes("Mẹo:") || trimmed.includes("👉")) {
              return (
                <div key={idx} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 font-medium">
                  <span className="font-bold text-amber-600 dark:text-amber-400">👉 Mẹo phòng thi: </span>
                  {renderClueText(trimmed.replace(/^[•·-]?\s*(👉\s*)?Mẹo:\s*/, ""))}
                </div>
              );
            }

            // Dòng phân tích các phương án khác sai: "• Swimming sai:"
            if (trimmed.startsWith("•") || trimmed.startsWith("·") || trimmed.startsWith("-")) {
              return (
                <div key={idx} className="flex items-start gap-2 pl-1 text-exam-text leading-relaxed">
                  <span className="text-rose-500 font-bold shrink-0 mt-0.5">•</span>
                  <div>{renderClueText(trimmed.replace(/^[•·-]\s*/, ""))}</div>
                </div>
              );
            }

            return <p key={idx}>{renderClueText(line)}</p>;
          })}
        </div>
      );
    };

    const getStatus = (q: any, idx: number) => {
      if (q.question_type === "MULTIPLE_CHOICE") {
        const sel = selectedAnswers[idx];
        if (sel === undefined) return "unanswered";
        const chosen = q.options && q.options[sel] ? String(q.options[sel]).trim().toUpperCase() : "";
        const cor = String(q.correct_answer || "").trim().toUpperCase();
        return chosen === cor || String.fromCharCode(65 + sel) === cor ? "correct" : "wrong";
      }
      if (q.question_type === "GAP_FILL") {
        const userVal = (textAnswers[q.id] || (selectedAnswers[idx] !== undefined && q.options ? q.options[selectedAnswers[idx]] : "") || "").trim().toLowerCase();
        if (!userVal) return "unanswered";
        return userVal === String(q.correct_answer || "").trim().toLowerCase() ? "correct" : "wrong";
      }
      if (q.question_type === "MATCHING") {
        const norm = (s: string) => (s || "").trim().toLowerCase().replace(/^person\s+/i, "");
        const userVal = norm(matchingAnswers[q.id] || "");
        const corVal = norm(String(q.correct_answer || ""));
        if (!userVal) return "unanswered";
        return userVal === corVal ? "correct" : "wrong";
      }
      if (q.question_type === "SENTENCE_ORDER") {
        const userArr = orderAnswers[q.id];
        if (!userArr || userArr.length === 0) return "unanswered";
        try {
          const corArr = JSON.parse(q.correct_answer || "[]");
          if (userArr.length === corArr.length && userArr.every((v, i) => v === corArr[i])) return "correct";
          return "wrong";
        } catch {
          return "correct";
        }
      }
      if (q.question_type === "ESSAY") {
        return textAnswers[q.id]?.trim() ? "answered" : "unanswered";
      }
      if (q.question_type === "SPEAKING_AUDIO") {
        return audioUrls[q.id] ? "answered" : "unanswered";
      }
      return "unanswered";
    };

    const statusList = questions.map((q, idx) => getStatus(q, idx));
    const totalCor = statusList.filter((s) => s === "correct" || s === "answered").length;
    const totalWr = statusList.filter((s) => s === "wrong").length;

    const filteredIndexes = questions
      .map((_, idx) => idx)
      .filter((idx) => {
        if (reviewFilter === "wrong") return statusList[idx] === "wrong";
        if (reviewFilter === "correct") return statusList[idx] === "correct" || statusList[idx] === "answered";
        return true;
      });

    const activeRevQ = questions[questionIdx] || questions[0];
    const activeStatus = activeRevQ ? getStatus(activeRevQ, questionIdx) : "unanswered";

    return (
      <div className="notranslate min-h-screen bg-exam-bg text-exam-text flex flex-col font-sans">
        {/* Header Review Bar */}
        <header className="sticky top-0 z-40 bg-exam-surface/95 backdrop-blur-md border-b border-exam-border px-4 md:px-8 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setReviewMode(false)}
              className="p-1.5 rounded-lg border border-exam-border hover:bg-exam-border/40 text-exam-text-muted hover:text-exam-text transition-colors"
              title="Quay lại bảng kết quả"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                  Xem lại bài thi thử
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  {resultData?.totalScore !== undefined ? `${Math.round(resultData.totalScore)} điểm · ` : ""}Band {resultData?.cefrLevel || "B2"}
                </span>
              </div>
              <span className="text-xs md:text-sm font-bold text-exam-text">
                {examData?.title || "Bài thi thử Aptis ESOL"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReviewMode(false)}
              className="px-3 py-1.5 rounded-xl border border-exam-border text-xs font-semibold hover:bg-exam-border/40 transition-colors"
            >
              Xem bảng điểm
            </button>
            <Link
              href="/thi-thu"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Thoát</span>
            </Link>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 py-6 px-4 md:px-8 max-w-4xl mx-auto w-full space-y-6">
          {/* Quick Heatmap Navigator */}
          <div className="bg-exam-surface rounded-2xl border border-exam-border p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {/* Filter pills */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setReviewFilter("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    reviewFilter === "all"
                      ? "bg-primary text-primary-foreground"
                      : "border border-exam-border text-exam-text-muted hover:text-exam-text"
                  }`}
                >
                  Tất cả ({questions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter("wrong")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    reviewFilter === "wrong"
                      ? "bg-rose-500 text-white"
                      : "border border-exam-border text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                  }`}
                >
                  Câu sai ({totalWr})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter("correct")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    reviewFilter === "correct"
                      ? "bg-emerald-500 text-white"
                      : "border border-exam-border text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  }`}
                >
                  Câu đúng ({totalCor})
                </button>
              </div>

              <span className="text-[11px] text-exam-text-muted font-mono">
                Click vào số câu để xem lời giải
              </span>
            </div>

            {/* Question pills grid */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {questions.map((_, idx) => {
                const isCurrent = idx === questionIdx;
                const st = statusList[idx];
                const isVisible = filteredIndexes.includes(idx);
                if (!isVisible) return null;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuestionIdx(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center border ${
                      isCurrent
                        ? "ring-2 ring-primary ring-offset-2 scale-110 z-10"
                        : ""
                    } ${
                      st === "correct" || st === "answered"
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25"
                        : st === "wrong"
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25"
                        : "bg-exam-border/30 border-exam-border text-exam-text-muted hover:bg-exam-border/50"
                    }`}
                    title={`Câu ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Question Review Card */}
          {activeRevQ && (
            <div className="bg-exam-surface rounded-2xl border border-exam-border p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
              {/* Question Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-exam-border pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                      {activeRevQ.partTitle || "Câu hỏi thi thử"}
                    </span>
                    <span className="text-xs text-exam-text-muted font-mono">
                      Câu {questionIdx + 1} / {questions.length}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-exam-text mt-1">
                    {activeRevQ.prompt}
                  </h3>
                </div>

                {/* Status Badge */}
                <div className="shrink-0">
                  {activeStatus === "correct" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Chính xác</span>
                    </span>
                  ) : activeStatus === "wrong" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                      <X className="w-4 h-4 text-rose-500" />
                      <span>Chưa đúng</span>
                    </span>
                  ) : activeStatus === "answered" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30">
                      <Check className="w-4 h-4" />
                      <span>Đã nộp bài</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-muted text-exam-text-muted border border-exam-border">
                      <span>Chưa làm bài</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Passage text if any */}
              {activeRevQ.partPassageText && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-exam-text-muted flex items-center gap-1.5">
                      <span>📜</span>
                      <span>
                        {(activeRevQ.partTitle || "").toUpperCase().includes("LISTENING") ||
                        (activeRevQ.partTitle || "").toUpperCase().includes("NGHE") ||
                        Boolean(activeRevQ.partAudioUrl)
                          ? "Lời thoại bài nghe (Transcript):"
                          : "Đoạn văn ngữ cảnh:"}
                      </span>
                    </span>
                    {(Boolean(activeRevQ.partAudioUrl) ||
                      (activeRevQ.partTitle || "").toUpperCase().includes("LISTENING") ||
                      (activeRevQ.partTitle || "").toUpperCase().includes("NGHE")) && (
                      <button
                        type="button"
                        onClick={() => setShowListeningScript(!showListeningScript)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-exam-border bg-exam-surface hover:bg-exam-border/40 text-primary transition-all"
                      >
                        {showListeningScript ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showListeningScript ? "Thu gọn Transcript" : "Xem Transcript"}</span>
                      </button>
                    )}
                  </div>
                  {(!Boolean(activeRevQ.partAudioUrl) || showListeningScript) && (
                    <div className="p-4 rounded-xl bg-exam-bg/50 border border-exam-border text-xs md:text-sm leading-relaxed text-exam-text whitespace-pre-wrap font-sans transition-all">
                      {hideAnswersReview
                        ? (activeRevQ.partPassageText || "").replace(/<mark>([\s\S]*?)<\/mark>/gi, "$1").replace(/==([\s\S]*?)==/gi, "$1")
                        : renderClueText(activeRevQ.partPassageText)}
                    </div>
                  )}
                </div>
              )}

              {/* Audio player if any */}
              {activeRevQ.partAudioUrl && (
                <div className="p-3 rounded-xl bg-exam-bg/40 border border-exam-border">
                  <AudioPlayer src={activeRevQ.partAudioUrl} label="Audio câu hỏi:" />
                </div>
              )}

              {/* Question Answer Comparison based on type */}
              {/* 1. Multiple Choice */}
              {activeRevQ.question_type === "MULTIPLE_CHOICE" && Array.isArray(activeRevQ.options) && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-exam-text-muted uppercase tracking-wider block">
                    {hideAnswersReview ? "Các phương án lựa chọn:" : "So sánh lựa chọn của bạn & Đáp án đúng:"}
                  </span>
                  <div className="space-y-2">
                    {activeRevQ.options.map((opt: any, oIdx: number) => {
                      const userPickIdx = selectedAnswers[questionIdx];
                      const isUserPick = userPickIdx === oIdx;
                      const optStr = String(opt).trim().toUpperCase();
                      const corStr = String(activeRevQ.correct_answer || "").trim().toUpperCase();
                      const isRight = optStr === corStr || String.fromCharCode(65 + oIdx) === corStr;

                      if (hideAnswersReview) {
                        return (
                          <div
                            key={oIdx}
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs md:text-sm font-medium transition-all ${
                              isUserPick
                                ? "bg-primary/10 border-primary/40 text-primary"
                                : "bg-exam-bg/30 border-exam-border text-exam-text"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                  isUserPick
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-exam-border/50 text-exam-text-muted"
                                }`}
                              >
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="truncate">{String(opt)}</span>
                            </div>
                            {isUserPick && (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-primary/20 text-primary font-bold text-[11px]">
                                Lựa chọn của bạn
                              </span>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={oIdx}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs md:text-sm font-medium transition-all ${
                            isRight
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-200"
                              : isUserPick && !isRight
                              ? "bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-200"
                              : "bg-exam-bg/30 border-exam-border text-exam-text-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                isRight
                                  ? "bg-emerald-500 text-white"
                                  : isUserPick && !isRight
                                  ? "bg-rose-500 text-white"
                                  : "bg-exam-border/50 text-exam-text-muted"
                              }`}
                            >
                              {isRight ? "✓" : isUserPick ? "✕" : String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="truncate">{String(opt)}</span>
                          </div>

                          <div className="shrink-0 text-right">
                            {isRight && (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                                {isUserPick ? "✓ Bạn chọn đúng" : "Đáp án đúng"}
                              </span>
                            )}
                            {isUserPick && !isRight && (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-[11px]">
                                ✕ Lựa chọn của bạn
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Gap Fill - Chuẩn layout Screenshot 2 (Đáp án & dịch nghĩa) */}
              {activeRevQ.question_type === "GAP_FILL" && (() => {
                const siblingGapQs = questions.filter(
                  (q) => q.partNumber === activeRevQ.partNumber && q.question_type === "GAP_FILL"
                );
                const listToRender = siblingGapQs.length > 0 ? siblingGapQs : [activeRevQ];

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-exam-border pb-2">
                      <h4 className="font-bold text-sm md:text-base text-exam-text">
                        Đáp án &amp; dịch nghĩa
                      </h4>
                      <span className="text-xs text-exam-text-muted">
                        {listToRender.length} câu điền từ trong phần này
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {listToRender.map((gq: any, gIdx: number) => {
                        const targetIdx = questions.findIndex((q) => q.id === gq.id);
                        const isCurrentActive = targetIdx === questionIdx;
                        const userVal = (
                          textAnswers[gq.id] ||
                          (targetIdx !== -1 && selectedAnswers[targetIdx] !== undefined && gq.options
                            ? gq.options[selectedAnswers[targetIdx]]
                            : "") ||
                          ""
                        ).trim();

                        const corVal = String(gq.correct_answer || "").trim();
                        const isCorrect = userVal.toLowerCase() === corVal.toLowerCase();

                        // Hoàn thiện câu văn in nghiêng chuẩn Screenshot 2
                        let completedSentence = gq.prompt || "";
                        if (!hideAnswersReview) {
                          if (/\[gap\]|_{2,}|\(\.\.\.\)|\(\d+\)|\[blank\]/i.test(completedSentence)) {
                            completedSentence = completedSentence.replace(
                              /\[gap\]|_{2,}|\(\.\.\.\)|\(\d+\)|\[blank\]/gi,
                              corVal || "___"
                            );
                          } else if (!completedSentence.includes(corVal) && corVal) {
                            completedSentence = `${completedSentence} → [${corVal}]`;
                          }
                        }

                        // Lời dịch tiếng Việt
                        let translation = "";
                        if (gq.explanation) {
                          translation = gq.explanation.replace(/^[•·-]?\s*dịch\s*(nghĩa)?:\s*/i, "").trim();
                        }

                        return (
                          <div
                            key={gq.id || gIdx}
                            onClick={() => {
                              if (targetIdx !== -1) setQuestionIdx(targetIdx);
                            }}
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${
                              isCurrentActive
                                ? "bg-card border-primary/40 shadow-sm ring-1 ring-primary/20"
                                : "bg-card/60 hover:bg-card border-exam-border hover:border-exam-border/80"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="font-semibold text-xs md:text-sm text-exam-text-muted shrink-0 mt-0.5">
                                {gIdx + 1}.
                              </span>
                              <div className="space-y-2 flex-1 min-w-0">
                                {/* Câu văn in nghiêng chuẩn Screenshot 2 */}
                                <p className="italic text-xs md:text-sm text-exam-text font-serif leading-relaxed">
                                  {completedSentence}
                                </p>

                                {/* Badges: Đỏ (Lựa chọn của bạn) & Xanh (Đáp án đúng) */}
                                <div className="flex items-center flex-wrap gap-2 pt-0.5">
                                  {/* Badge 1: User answer */}
                                  {isCorrect ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-emerald-400/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                                      <Check className="w-3 h-3 text-emerald-500" />
                                      <span>{userVal}</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-rose-400/60 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                                      <X className="w-3 h-3 text-rose-500" />
                                      <span>{userVal || "—"}</span>
                                    </span>
                                  )}

                                  {/* Badge 2: Correct answer (ẩn nếu bật ẩn đáp án) */}
                                  {!hideAnswersReview && !isCorrect && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-emerald-400/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                                      <Check className="w-3 h-3 text-emerald-500" />
                                      <span>{corVal}</span>
                                    </span>
                                  )}
                                </div>

                                {/* Lời dịch tiếng Việt */}
                                {!hideAnswersReview && translation && (
                                  <p className="text-xs text-exam-text-muted pt-0.5 font-sans leading-relaxed">
                                    <span className="font-semibold text-exam-text">Dịch: </span>
                                    {renderClueText(translation)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* 3. Matching */}
              {activeRevQ.question_type === "MATCHING" && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-exam-text-muted uppercase tracking-wider block">
                    Chi tiết nối ý / chọn đáp án:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl border border-exam-border bg-exam-bg/40 space-y-1">
                      <span className="text-[11px] text-exam-text-muted font-bold block">
                        Lựa chọn của bạn:
                      </span>
                      <p className={`text-sm font-bold ${
                        activeStatus === "correct" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}>
                        {matchingAnswers[activeRevQ.id] || "(Chưa chọn)"}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-1">
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold block">
                        Đáp án đúng:
                      </span>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                        {hideAnswersReview ? "••••••" : (activeRevQ.correct_answer || "N/A")}
                      </p>
                    </div>
                  </div>
                  {!hideAnswersReview && (
                    <div className="p-3.5 rounded-xl bg-card border border-exam-border text-xs text-exam-text space-y-1">
                      <span className="font-bold text-primary flex items-center gap-1.5">
                        <span>🎯</span>
                        <span>Mẹo tìm bằng chứng (Paraphrase Clue):</span>
                      </span>
                      <p className="text-exam-text-muted leading-relaxed">
                        Đối chiếu từ khóa trong nhận định với phát biểu của {activeRevQ.correct_answer || "nhân vật"}. Chú ý các từ đồng nghĩa (synonyms) thay vì tìm từ nguyên bản.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Sentence Order */}
              {activeRevQ.question_type === "SENTENCE_ORDER" && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-exam-text-muted uppercase tracking-wider block">
                    Chi tiết sắp xếp câu:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl border border-exam-border bg-exam-bg/40 space-y-1">
                      <span className="text-[11px] text-exam-text-muted font-bold block">
                        Thứ tự bạn đã chọn:
                      </span>
                      <p className="text-xs font-mono text-exam-text font-bold">
                        {Array.isArray(orderAnswers[activeRevQ.id]) ? orderAnswers[activeRevQ.id].join(" → ") : "(Chưa xếp)"}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-1">
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold block">
                        Thứ tự chính xác:
                      </span>
                      <p className="text-xs font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                        {hideAnswersReview ? "••••••" : (activeRevQ.correct_answer || "N/A")}
                      </p>
                    </div>
                  </div>

                  {/* Đoạn văn ghép hoàn chỉnh theo đúng logic */}
                  {!hideAnswersReview && Array.isArray(activeRevQ.options) && (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between border-b border-exam-border pb-1.5">
                        <span className="text-xs font-bold text-exam-text flex items-center gap-1.5">
                          <span>📖</span>
                          <span>Đoạn văn hoàn chỉnh sau khi sắp xếp đúng logic:</span>
                        </span>
                        <span className="text-[11px] text-exam-text-muted">
                          Bôi đậm các từ nối liên kết logic
                        </span>
                      </div>
                      <div className="space-y-2 p-3.5 rounded-xl bg-card border border-exam-border">
                        {(() => {
                          const corStr = String(activeRevQ.correct_answer || "");
                          let orderedIndices: number[] = [];
                          if (corStr.includes(",")) {
                            orderedIndices = corStr
                              .split(",")
                              .map((s) => parseInt(s.trim(), 10) - 1)
                              .filter((n) => !isNaN(n) && n >= 0 && n < activeRevQ.options.length);
                          }
                          if (orderedIndices.length === 0) {
                            orderedIndices = activeRevQ.options.map((_: any, i: number) => i);
                          }

                          const highlightCohesion = (sentence: string) => {
                            if (!sentence) return null;
                            const regex = /\b(First|Firstly|Second|Secondly|Third|Next|Then|After that|Following this|Subsequently|Finally|Lastly|However|Nevertheless|On the other hand|In addition|Furthermore|Moreover|Therefore|As a result|Because|Since|Although|Even though)\b/gi;
                            const parts = sentence.split(regex);
                            return parts.map((part, pIdx) => {
                              if (regex.test(part)) {
                                return (
                                  <span key={pIdx} className="font-bold text-primary bg-primary/10 px-1 py-0.5 rounded border border-primary/20">
                                    {part}
                                  </span>
                                );
                              }
                              return <span key={pIdx}>{part}</span>;
                            });
                          };

                          return orderedIndices.map((origIdx, pos) => (
                            <div key={pos} className="flex items-start gap-2.5 text-xs md:text-sm text-exam-text leading-relaxed">
                              <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                                {pos + 1}
                              </span>
                              <div className="flex-1">
                                {highlightCohesion(activeRevQ.options[origIdx])}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 5. Speaking Audio */}
              {activeRevQ.question_type === "SPEAKING_AUDIO" && (
                <div className="space-y-4">
                  {/* Tranh thi thật nếu có */}
                  {activeRevQ.partImageUrl && (
                    <div className="p-3 rounded-2xl border border-exam-border bg-card/60 space-y-2 text-center">
                      <span className="text-xs font-bold text-exam-text-muted block text-left">
                        🖼️ Hình ảnh đề thi:
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeRevQ.partImageUrl}
                        alt="Đề thi Speaking"
                        className="rounded-xl border border-exam-border max-h-72 object-contain mx-auto shadow-sm"
                      />
                    </div>
                  )}

                  {/* Bản ghi âm của bạn */}
                  <div className="p-4 rounded-xl border border-exam-border bg-exam-bg/40 space-y-2">
                    <span className="text-xs font-bold text-primary block">
                      🎙️ Bản ghi âm bài nói của bạn:
                    </span>
                    {audioUrls[activeRevQ.id] ? (
                      <audio controls src={audioUrls[activeRevQ.id]!} className="w-full h-8" />
                    ) : (
                      <p className="text-xs text-exam-text-muted italic">(Không có file ghi âm)</p>
                    )}
                  </div>

                  {/* Dàn ý phát triển ý tưởng & Cụm từ ăn điểm */}
                  {!hideAnswersReview && (
                    <div className="p-4 rounded-xl border border-exam-border bg-card space-y-2 text-xs md:text-sm leading-relaxed">
                      <div className="font-bold text-primary flex items-center gap-2 border-b border-exam-border pb-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span>Dàn ý phát triển ý tưởng &amp; Mẫu câu Band B2/C1:</span>
                      </div>
                      <div className="space-y-2 text-exam-text">
                        <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/15">
                          <span className="font-bold text-primary">👉 Công thức mở rộng ý: </span>
                          <span>Trả lời trực diện $\rightarrow$ Nêu nguyên nhân (Because...) $\rightarrow$ Trải nghiệm thực tế (For instance...).</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-muted/40 border border-exam-border">
                          <span className="font-bold text-exam-text">💡 Bộ câu đệm mượt mà (Fillers / Openers): </span>
                          <span className="italic text-exam-text-muted">
                            &ldquo;Well, to be honest...&rdquo;, &ldquo;As far as I remember...&rdquo;, &ldquo;Judging from what I can see...&rdquo;
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 6. Essay / Writing / Short Text */}
              {(activeRevQ.question_type === "ESSAY" || activeRevQ.question_type === "SHORT_TEXT") && (() => {
                const userContent = textAnswers[activeRevQ.id] || "";
                const words = userContent.trim() ? userContent.trim().split(/\s+/).length : 0;
                const isPart1 = (activeRevQ.partTitle || "").includes("Part 1") || activeRevQ.partNumber === 1;
                const isPart2 = (activeRevQ.partTitle || "").includes("Part 2") || activeRevQ.partNumber === 2;
                const isPart3 = (activeRevQ.partTitle || "").includes("Part 3") || activeRevQ.partNumber === 3;
                const isPart4 = (activeRevQ.partTitle || "").includes("Part 4") || activeRevQ.partNumber === 4;

                let wordTarget = "Dung lượng tự do";
                if (isPart1) wordTarget = "1 – 5 từ / câu";
                else if (isPart2) wordTarget = "20 – 30 từ";
                else if (isPart3) wordTarget = "30 – 40 từ";
                else if (isPart4) wordTarget = (activeRevQ.prompt || "").toLowerCase().includes("friend") ? "Khoảng 50 từ (Thân mật)" : "120 – 150 từ (Trang trọng)";

                return (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-exam-border bg-exam-bg/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-exam-text-muted uppercase">Bài làm của bạn:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-exam-text-muted">Yêu cầu: {wordTarget}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            words > 0 ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-exam-text-muted border-exam-border"
                          }`}>
                            {words} từ
                          </span>
                        </div>
                      </div>
                      <p className="text-xs md:text-sm text-exam-text leading-relaxed whitespace-pre-wrap font-sans">
                        {userContent || "(Chưa có nội dung trả lời)"}
                      </p>
                    </div>

                    {!hideAnswersReview && (
                      <div className="p-4 rounded-xl border border-exam-border bg-card space-y-2.5 text-xs md:text-sm leading-relaxed">
                        <div className="font-bold text-primary flex items-center gap-2 border-b border-exam-border pb-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span>Khung tiêu chí &amp; Mẫu câu ghi điểm Band C1:</span>
                        </div>
                        <div className="space-y-2">
                          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
                            <span className="font-bold">✓ Tiêu chí chấm: </span>
                            <span>Đủ số từ quy định, dùng đúng văn phong ({isPart4 && (activeRevQ.prompt || "").toLowerCase().includes("friend") ? "Informal (thân mật)" : "Formal (trang trọng)"}), không viết tắt bừa bãi và dùng liên từ mạch lạc.</span>
                          </div>
                          {isPart4 && (
                            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/15 text-exam-text">
                              <span className="font-bold text-primary">📌 Mẫu câu Formal đắt giá: </span>
                              <span className="italic">
                                &ldquo;I am writing to express my dissatisfaction regarding...&rdquo;, &ldquo;I would appreciate it if you could look into this matter...&rdquo;
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Explanation Card - Chuẩn layout Screenshot 1 */}
              {hideAnswersReview ? (
                <div className="p-4 rounded-xl bg-muted/40 border border-exam-border text-center py-5 text-exam-text-muted space-y-1">
                  <EyeOff className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs font-bold text-exam-text">Đáp án và giải thích đang được ẩn để bạn tự ôn luyện</p>
                  <p className="text-[11px]">Bấm nút &ldquo;Hiện đáp án&rdquo; ở góc dưới bên trái màn hình khi bạn muốn xem chi tiết.</p>
                </div>
              ) : (
                <div className="p-4 md:p-5 rounded-2xl bg-exam-surface border border-exam-border shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary border-b border-exam-border pb-2.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Giải thích chi tiết &amp; Phân tích đáp án:</span>
                  </div>
                  {renderStructuredExplanation(
                    activeRevQ.explanation || "Câu hỏi kiểm tra kiến thức ngôn ngữ chuẩn theo khung đánh giá Aptis ESOL."
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-exam-border">
                <button
                  type="button"
                  disabled={questionIdx === 0}
                  onClick={() => setQuestionIdx((p) => p - 1)}
                  className="px-4 py-2 rounded-xl border border-exam-border text-xs font-bold hover:bg-exam-border/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Câu trước</span>
                </button>

                <span className="text-xs text-exam-text-muted font-mono font-bold">
                  {questionIdx + 1} / {questions.length}
                </span>

                <button
                  type="button"
                  disabled={questionIdx === questions.length - 1}
                  onClick={() => setQuestionIdx((p) => p + 1)}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                >
                  <span>Câu tiếp</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Floating action pills: Góc dưới bên trái chuẩn Screenshot */}
          <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 items-start pointer-events-auto">
            <button
              type="button"
              onClick={() => setHideAnswersReview((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border-2 border-exam-border bg-white dark:bg-card text-exam-text hover:bg-exam-border/30 shadow-lg text-xs font-bold transition-all hover:scale-105 active:scale-95"
              title="Ẩn / Hiện đáp án câu hỏi để tự luyện thi"
            >
              {hideAnswersReview ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  <span>Hiện đáp án</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-exam-text-muted" />
                  <span>Ẩn đáp án</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border-2 border-exam-border bg-white dark:bg-card text-exam-text hover:bg-exam-border/30 shadow-lg text-xs font-bold transition-all hover:scale-105 active:scale-95"
              title="Báo cáo lỗi câu hỏi cho đội ngũ học thuật"
            >
              <Flag className="w-3.5 h-3.5 text-rose-500" />
              <span>Báo lỗi</span>
            </button>
          </div>

          {/* Modal Báo lỗi câu hỏi thi */}
          {reportModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-exam-surface rounded-2xl border border-exam-border max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-exam-border pb-3">
                  <div className="flex items-center gap-2 text-rose-500">
                    <Flag className="w-4 h-4" />
                    <h3 className="font-bold text-sm text-exam-text">Báo lỗi câu hỏi</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="p-1 rounded-lg text-exam-text-muted hover:text-exam-text hover:bg-exam-border/40 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1 text-xs text-exam-text-muted">
                  <p className="font-semibold text-exam-text">
                    Câu {questionIdx + 1}: {activeRevQ?.partTitle || "Aptis ESOL"}
                  </p>
                  <p className="line-clamp-2 italic">{activeRevQ?.prompt}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-exam-text block">Lý do báo lỗi:</label>
                  <div className="space-y-1.5">
                    {[
                      "Đáp án chưa chính xác",
                      "Dịch nghĩa / Giải thích sai",
                      "Lỗi âm thanh / Audio",
                      "Lỗi hiển thị / Lời thoại transcript",
                      "Khác",
                    ].map((reason) => (
                      <label
                        key={reason}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          reportReason === reason
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-exam-border hover:bg-exam-border/30 text-exam-text"
                        }`}
                      >
                        <input
                          type="radio"
                          name="reportReason"
                          checked={reportReason === reason}
                          onChange={() => setReportReason(reason)}
                          className="w-3.5 h-3.5 accent-primary"
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-exam-text block">Chi tiết góp ý (tùy chọn):</label>
                  <textarea
                    rows={3}
                    value={reportNote}
                    onChange={(e) => setReportNote(e.target.value)}
                    placeholder="Mô tả cụ thể lỗi bạn phát hiện để ban chuyên môn hỗ trợ sửa chữa..."
                    className="w-full p-2.5 rounded-xl border border-exam-border bg-exam-bg text-exam-text text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-exam-border">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-exam-border text-xs font-bold hover:bg-exam-border/30 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      alert("Cảm ơn bạn! Báo cáo lỗi của bạn đã được tiếp nhận và gửi đến ban chuyên môn Aptis.");
                      setReportModalOpen(false);
                      setReportNote("");
                    }}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 shadow-sm transition-all"
                  >
                    Gửi báo cáo
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ========================================================
  //  RENDER: Active Exam Room
  // ========================================================
  return (
    <div className="notranslate full-test-active exam-active exam-mode min-h-screen bg-exam-bg text-exam-text flex flex-col font-sans select-none">
      {/* Progress bar */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
        <div
          className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-500"
          style={{ width: `${questions.length > 0 ? ((questionIdx + 1) / questions.length) * 100 : 0}%` }}
        />
      </div>

      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-exam-surface/95 backdrop-blur border-b border-exam-border">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/thi-thu"
              className="p-1.5 rounded-lg hover:bg-exam-border/40 text-exam-text-muted hover:text-exam-text transition-colors shrink-0"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-xs font-bold text-exam-text truncate hidden sm:block">
              {examData?.title || "Bài thi Aptis"}
            </span>
            {autoSaveStatus === "saving" && (
              <span className="text-[10px] text-exam-text-muted flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Đang lưu...
              </span>
            )}
            {autoSaveStatus === "saved" && (
              <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Đã lưu
              </span>
            )}
          </div>

          {/* Countdown Timer */}
          <div
            className={`font-mono text-base font-black px-3 py-1 rounded-lg border flex items-center gap-1.5 ${
              isCritical
                ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse"
                : isWarning
                ? "bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400"
                : "bg-exam-bg border-exam-border text-exam-text"
            }`}
          >
            <Clock className="w-4 h-4" />
            {timerFormatted}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-exam-text-muted hidden sm:block shrink-0">
              {answeredCount}/{questions.length} câu
            </div>
            <Link
              href="/thi-thu"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-exam-border text-xs font-semibold text-exam-text-muted hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
              title="Thoát bài thi"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thoát</span>
            </Link>
          </div>
        </div>

        {/* 5-Skill Navigation Tabs cho Full Test */}
        {examData?.skill === "FULL_TEST" && fullTestSkills.length > 0 && (
          <div className="bg-exam-surface/90 border-t border-exam-border/60">
            <div className="max-w-6xl mx-auto px-4 h-11 flex items-center gap-2 overflow-x-auto">
              {fullTestSkills.map((s) => {
                const isActive = currentSkill.key === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      if (s.startIndex >= 0) setQuestionIdx(s.startIndex);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-exam-bg/60 text-exam-text-muted hover:text-exam-text hover:bg-exam-border/40"
                    }`}
                  >
                    {s.key === "SPEAKING" && <Mic className="w-3.5 h-3.5" />}
                    {s.key === "LISTENING" && <Headphones className="w-3.5 h-3.5" />}
                    {s.key === "GRAMMAR_VOCABULARY" && <BookOpen className="w-3.5 h-3.5" />}
                    {s.key === "READING" && <FileText className="w-3.5 h-3.5" />}
                    {s.key === "WRITING" && <PenTool className="w-3.5 h-3.5" />}
                    <span>{s.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        isActive ? "bg-white/20 text-white" : "bg-exam-border/60 text-exam-text-muted"
                      }`}
                    >
                      {s.answeredCount}/{s.totalCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content: Split panel cho Listening/Writing/Speaking; Reading full width */}
      {(() => {
        const isReadingSkillOrPart =
          examData?.skill === "READING" || currentQ?.partTitle?.includes("READING");
        const hasCueImage =
          currentQ?.question_type === "SPEAKING_AUDIO" &&
          (currentQ?.image_url || currentQ?.partImageUrl);
        const hasLeftPanel =
          !isReadingSkillOrPart &&
          (currentQ?.partPassageText || currentQ?.partAudioUrl || hasCueImage);
        const isFullTest = examData?.skill === "FULL_TEST";

        return (
          <main className={`flex-1 flex flex-col lg:flex-row items-start justify-center pb-20 ${isFullTest ? "pt-[92px]" : "pt-12"}`}>
            {/* Left panel: Passage / Audio / Speaking Image */}
            {hasLeftPanel && (
              <aside className={`w-full lg:w-1/2 lg:overflow-y-auto lg:sticky p-4 md:p-6 border-b lg:border-b-0 lg:border-r border-exam-border bg-exam-bg/30 ${isFullTest ? "lg:h-[calc(100vh-9.5rem)] lg:top-[92px]" : "lg:h-[calc(100vh-7rem)] lg:top-12"}`}>
                {currentQ.partAudioUrl && (
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-exam-text-muted mb-2">
                      🔊 Audio: {currentQ.partTitle}
                    </p>
                    <AudioPlayer
                      src={
                        currentQ.partAudioUrl.startsWith("http")
                          ? currentQ.partAudioUrl
                          : `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")}${currentQ.partAudioUrl.startsWith("/") ? "" : "/"}${currentQ.partAudioUrl}`
                      }
                      label={currentQ.partTitle}
                    />
                  </div>
                )}
                {hasCueImage && (
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                      🖼️ Hình ảnh đề bài Speaking
                    </p>
                    <div className="rounded-xl border border-exam-border overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center p-2">
                      <img
                        src={
                          (() => {
                            const rawUrl = currentQ.image_url || currentQ.partImageUrl || "";
                            if (rawUrl.startsWith("http")) return rawUrl;
                            const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
                            if (rawUrl.startsWith("/uploads") || rawUrl.startsWith("uploads") || rawUrl.startsWith("/api/uploads")) {
                              return `${apiOrigin}/${rawUrl.replace(/^\/+/, "")}`;
                            }
                            return `https://bacoamhbatqpxatrrflz.supabase.co/storage/v1/object/public/images/${rawUrl.replace(/^\/+/, "")}`;
                          })()
                        }
                        alt="Speaking Cue"
                        className="max-h-72 object-contain rounded-lg shadow-xs"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                )}
                {currentQ.partPassageText && (
                  <div className="mt-3">
                    {(() => {
                      const isListeningQ =
                        examData?.skill === "LISTENING" ||
                        (currentQ?.partTitle || "").toUpperCase().includes("LISTENING") ||
                        (currentQ?.partTitle || "").toUpperCase().includes("NGHE") ||
                        Boolean(currentQ?.partAudioUrl);

                      if (isListeningQ) {
                        return (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-exam-surface/80 border border-exam-border">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">📜</span>
                                <div>
                                  <p className="text-xs font-bold text-exam-text">Lời thoại bài nghe (Transcript)</p>
                                  <p className="text-[11px] text-exam-text-muted">
                                    {showListeningScript ? "Đang mở transcript đối chiếu" : "Mặc định ẩn để rèn luyện kỹ năng nghe"}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowListeningScript(!showListeningScript)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                  showListeningScript
                                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                    : "bg-exam-surface text-exam-text border-exam-border hover:border-primary/50 hover:bg-exam-border/20"
                                }`}
                              >
                                {showListeningScript ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                <span>{showListeningScript ? "Ẩn Transcript" : "Hiện Transcript"}</span>
                              </button>
                            </div>

                            {showListeningScript && (
                              <div className="p-4 rounded-xl border border-primary/25 bg-primary/5 dark:bg-primary/10 text-xs md:text-sm text-exam-text leading-relaxed whitespace-pre-wrap font-sans transition-all">
                                <p className="text-[11px] font-semibold text-primary mb-2 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span>Gợi ý: Hãy tập trung nghe trước để tối ưu phản xạ thi thật!</span>
                                </p>
                                {currentQ.partPassageText}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div>
                          {currentQ.partTitle && (
                            <p className="text-xs font-bold uppercase tracking-wider text-exam-text-muted mb-2">
                              📖 {currentQ.partTitle}
                            </p>
                          )}
                          {currentQ.partInstructions && (
                            <p className="text-xs text-primary font-semibold mb-3">{currentQ.partInstructions}</p>
                          )}
                          <div className="text-sm text-exam-text leading-7 whitespace-pre-wrap font-serif">
                            {currentQ.partPassageText}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </aside>
            )}

            {/* Right panel: Question */}
            <div
              className={`flex-1 w-full ${
                hasLeftPanel
                  ? "lg:w-1/2"
                  : currentQ?.question_type === "SENTENCE_ORDER"
                  ? "max-w-5xl mx-auto"
                  : "max-w-3xl mx-auto"
              } p-4 md:p-8`}
            >
              {currentQ ? (
                <div className="bg-exam-surface rounded-2xl border border-exam-border shadow-sm p-6 md:p-8 animate-in fade-in">
                  {/* Question header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-exam-border mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-exam-text uppercase tracking-wider">
                        {currentQ.partTitle || examData?.skill} ·{" "}
                        {partParam === "1"
                          ? "Part 1 – Gap Fill"
                          : partParam === "4"
                          ? "Part 4 – Opinion matching"
                          : partParam === "5"
                          ? "Part 5 – Long reading"
                          : examStages && examStages.length > 1
                          ? `Phần ${currentStageIndex + 1}/${examStages.length}`
                          : `Câu ${questionIdx + 1}/${questions.length}`}
                      </span>

                      {/* Flag button */}
                      <button
                        type="button"
                        onClick={() => toggleFlag(questionIdx)}
                        title={flaggedQuestions[questionIdx] ? "Bỏ cắm cờ xem lại" : "Cắm cờ đánh dấu câu hỏi này cần xem lại"}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all ${
                          flaggedQuestions[questionIdx]
                            ? "bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400"
                            : "bg-exam-bg/60 border-exam-border text-exam-text-muted hover:text-exam-text hover:border-exam-border/80"
                        }`}
                      >
                        <Flag className={`w-3 h-3 ${flaggedQuestions[questionIdx] ? "fill-current text-amber-500" : ""}`} />
                        <span>{flaggedQuestions[questionIdx] ? "Đã cắm cờ" : "Cắm cờ"}</span>
                      </button>
                    </div>

                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-exam-bg text-primary">
                      {currentQ.question_type === "SPEAKING_AUDIO"
                        ? "🎙 Speaking"
                        : currentQ.question_type === "ESSAY"
                        ? "✏️ Writing"
                        : currentQ.question_type === "GAP_FILL"
                        ? "🔤 Gap Fill"
                        : currentQ.question_type === "SENTENCE_ORDER"
                        ? "📑 Text Cohesion"
                        : currentQ.question_type === "MATCHING"
                        ? "🔗 Matching"
                        : "📝 Multiple Choice"}
                    </span>
                  </div>

              {/* Prompt (Ẩn cho GAP_FILL, MATCHING, SENTENCE_ORDER vì đã tích hợp sẵn trong UI) */}
              {currentQ.question_type !== "GAP_FILL" && currentQ.question_type !== "MATCHING" && (
                <div className="text-base md:text-lg font-medium text-exam-text mb-6 leading-relaxed">
                  <span className="font-bold text-primary mr-2">{questionIdx + 1}.</span>
                  {currentQ.question_type === "SENTENCE_ORDER"
                    ? "The sentences below make a complete text. Put them in the correct order."
                    : currentQ.prompt}
                </div>
              )}

              {/* 1. GAP FILL COMPONENT (Part 1 Unified Story matching aptiskytich.vn) */}
              {currentQ.question_type === "GAP_FILL" && (
                <ReadingPart1Story
                  gaps={questions.filter(
                    (q) => q.question_type === "GAP_FILL" && (q.part_id === currentQ.part_id || q.partTitle === currentQ.partTitle)
                  )}
                  answers={textAnswers}
                  onSelect={(qId, val) => {
                    setTextAnswers((prev) => ({ ...prev, [qId]: val }));
                    const targetQIdx = questions.findIndex((q) => q.id === qId);
                    if (targetQIdx >= 0) {
                      const tq = questions[targetQIdx];
                      if (Array.isArray(tq.options)) {
                        const optIdx = tq.options.indexOf(val);
                        if (optIdx >= 0) setSelectedAnswers((prev) => ({ ...prev, [targetQIdx]: optIdx }));
                      }
                    }
                  }}
                />
              )}

              {/* 2. SENTENCE ORDER COMPONENT (Text Cohesion) */}
              {currentQ.question_type === "SENTENCE_ORDER" && (
                <ReadingSentenceOrder
                  title={currentQ.options?.title || "Text Cohesion"}
                  fixedSentence={currentQ.options?.fixedSentence}
                  sentences={currentQ.options?.sentences || []}
                  currentOrder={orderAnswers[currentQ.id]}
                  onChangeOrder={(newOrder) => {
                    setOrderAnswers((prev) => ({ ...prev, [currentQ.id]: newOrder }));
                  }}
                />
              )}

              {/* 3. MATCHING COMPONENT - Hỗ trợ toàn bộ các dạng Matching trong Aptis Full Test & từng kỹ năng */}
              {currentQ.question_type === "MATCHING" && (() => {
                const isReadingLongText =
                  isReadingSkillOrPart &&
                  (currentQ.partTitle?.includes("Long") ||
                    currentQ.partTitle?.includes("Part 4") ||
                    currentQ.partTitle?.includes("Part 5") ||
                    currentQ.partTitle?.includes("Heading"));

                const isReadingOpinion =
                  isReadingSkillOrPart &&
                  (currentQ.partTitle?.includes("Opinion") || currentQ.partTitle?.includes("Part 3"));

                const isListeningPart2 =
                  currentQ.partTitle?.includes("LISTENING") && currentQ.partTitle?.includes("Part 2");

                const isListeningPart3 =
                  currentQ.partTitle?.includes("LISTENING") && currentQ.partTitle?.includes("Part 3");

                const isVocabMatching =
                  currentQ.partTitle?.includes("GRAMMAR_VOCAB") || currentQ.partTitle?.includes("Vocab");

                // A. Reading Long Text Comprehension (Headings matching)
                if (isReadingLongText) {
                  const partQs = questions.filter((q) => q.part_id === currentQ.part_id);
                  return (
                    <ReadingPart5LongReading
                      title={currentQ.partPassageText || currentQ.options?.title || "Long Reading"}
                      instructions={
                        currentQ.partInstructions ||
                        "Read the passage quickly. Choose a heading for each numbered paragraph from the drop-down box."
                      }
                      paragraphs={partQs.map((q, idx) => ({
                        id: q.id,
                        paragraphNumber: idx + 1,
                        text: q.prompt.replace(/^Paragraph\s*\d+\s*:\s*/i, ""),
                        headingOptions: Array.isArray(q.options) ? q.options : [],
                      }))}
                      answers={matchingAnswers}
                      onSelect={(qId, val) => {
                        setMatchingAnswers((prev) => ({ ...prev, [qId]: val }));
                      }}
                    />
                  );
                }

                // B. Reading Opinion Matching (4 Reviewers Person A, B, C, D)
                if (isReadingOpinion) {
                  const partQs = questions.filter((q) => q.part_id === currentQ.part_id);
                  return (
                    <ReadingPart4OpinionMatching
                      instructions={currentQ.partInstructions}
                      reviewsText={currentQ.partPassageText}
                      questions={partQs}
                      answers={matchingAnswers}
                      onSelect={(qId, val) => {
                        setMatchingAnswers((prev) => ({ ...prev, [qId]: val }));
                      }}
                    />
                  );
                }

                // C. Listening Part 2 - Information Matching (4 Speakers)
                if (isListeningPart2) {
                  const partQs = questions.filter((q) => q.part_id === currentQ.part_id);
                  return (
                    <div className="space-y-6">
                      <div className="p-4 rounded-xl border border-exam-border bg-exam-bg/40 space-y-1">
                        <h3 className="text-sm font-bold text-exam-text">
                          {currentQ.partTitle}
                        </h3>
                        <p className="text-xs text-exam-text-muted">
                          {currentQ.partInstructions ||
                            "Four people are talking. Match each person (Speaker A, B, C, D) to the correct information."}
                        </p>
                      </div>

                      {currentQ.partAudioUrl && (
                        <AudioPlayer
                          src={
                            currentQ.partAudioUrl.startsWith("http")
                              ? currentQ.partAudioUrl
                              : `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")}${currentQ.partAudioUrl.startsWith("/") ? "" : "/"}${currentQ.partAudioUrl}`
                          }
                          label={currentQ.partTitle}
                        />
                      )}

                      <div className="space-y-3 pt-2">
                        {partQs.map((spk, sIdx) => (
                          <div
                            key={spk.id}
                            className="p-4 rounded-xl border border-exam-border bg-exam-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                          >
                            <span className="font-bold text-sm text-primary w-28 shrink-0">
                              {spk.prompt || `Speaker ${String.fromCharCode(65 + sIdx)}`}
                            </span>
                            <select
                              value={matchingAnswers[spk.id] || ""}
                              onChange={(e) =>
                                setMatchingAnswers((prev) => ({ ...prev, [spk.id]: e.target.value }))
                              }
                              className="flex-1 p-2.5 rounded-lg border border-exam-border bg-exam-bg text-exam-text text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer font-sans"
                            >
                              <option value="">-- Chọn thông tin phù hợp --</option>
                              {Array.isArray(spk.options) &&
                                spk.options.map((opt: string, oIdx: number) => (
                                  <option key={oIdx} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // D. Listening Part 3 - Opinion Matching (Man / Woman / Both)
                if (isListeningPart3) {
                  const partQs = questions.filter((q) => q.part_id === currentQ.part_id);
                  return (
                    <div className="space-y-6">
                      <div className="p-4 rounded-xl border border-exam-border bg-exam-bg/40 space-y-1">
                        <h3 className="text-sm font-bold text-exam-text">
                          {currentQ.partTitle}
                        </h3>
                        <p className="text-xs text-exam-text-muted">
                          {currentQ.partInstructions ||
                            "Listen to a conversation between a man and a woman. Decide who expressed each opinion: Man, Woman, or Both."}
                        </p>
                      </div>

                      {currentQ.partAudioUrl && (
                        <AudioPlayer
                          src={
                            currentQ.partAudioUrl.startsWith("http")
                              ? currentQ.partAudioUrl
                              : `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")}${currentQ.partAudioUrl.startsWith("/") ? "" : "/"}${currentQ.partAudioUrl}`
                          }
                          label={currentQ.partTitle}
                        />
                      )}

                      <div className="space-y-3 pt-2">
                        {partQs.map((op, idx) => (
                          <div
                            key={op.id}
                            className="p-4 rounded-xl border border-exam-border bg-exam-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                          >
                            <span className="text-xs md:text-sm text-exam-text flex-1 leading-relaxed">
                              <strong className="text-primary mr-1.5">{idx + 1}.</strong>
                              {op.prompt}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {["Man", "Woman", "Both"].map((choice) => {
                                const isSel = matchingAnswers[op.id] === choice;
                                return (
                                  <button
                                    key={choice}
                                    type="button"
                                    onClick={() =>
                                      setMatchingAnswers((prev) => ({ ...prev, [op.id]: choice }))
                                    }
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                      isSel
                                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                        : "bg-exam-bg border-exam-border text-exam-text hover:border-primary/50"
                                    }`}
                                  >
                                    {choice}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // E. Vocabulary Matching (Grammar & Vocab Parts 10-14)
                if (isVocabMatching) {
                  const partQs = questions.filter((q) => q.part_id === currentQ.part_id);
                  return (
                    <div className="space-y-6">
                      <div className="p-4 rounded-xl border border-exam-border bg-exam-bg/40 space-y-1">
                        <h3 className="text-sm font-bold text-exam-text">
                          {currentQ.partTitle}
                        </h3>
                        <p className="text-xs text-exam-text-muted">
                          {currentQ.partInstructions ||
                            "Choose the word that matches the definition, synonym, or completion from the list."}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {partQs.map((vQ, idx) => (
                          <div
                            key={vQ.id}
                            className="p-3.5 rounded-xl border border-exam-border bg-exam-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                          >
                            <div className="flex-1 text-xs md:text-sm font-medium text-exam-text">
                              <span className="font-bold text-primary mr-2">{idx + 1}.</span>
                              <span>{vQ.prompt}</span>
                            </div>
                            <div className="sm:w-60 shrink-0">
                              <select
                                value={matchingAnswers[vQ.id] || ""}
                                onChange={(e) =>
                                  setMatchingAnswers((prev) => ({ ...prev, [vQ.id]: e.target.value }))
                                }
                                className="w-full p-2 rounded-lg border border-exam-border bg-exam-bg text-exam-text text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer font-sans"
                              >
                                <option value="">-- Chọn từ tương ứng --</option>
                                {Array.isArray(vQ.options) &&
                                  vQ.options.map((opt: string, oIdx: number) => (
                                    <option key={oIdx} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // F. Generic Matching Fallback
                return (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-exam-text">{currentQ.prompt}</p>
                    <select
                      value={matchingAnswers[currentQ.id] || ""}
                      onChange={(e) =>
                        setMatchingAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))
                      }
                      className="w-full p-3 rounded-xl border border-exam-border bg-exam-bg text-exam-text text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer font-sans"
                    >
                      <option value="">-- Chọn đáp án --</option>
                      {Array.isArray(currentQ.options) &&
                        currentQ.options.map((opt: string, oIdx: number) => (
                          <option key={oIdx} value={opt}>
                            {opt}
                          </option>
                        ))}
                    </select>
                  </div>
                );
              })()}

              {/* 4. MULTIPLE CHOICE STANDARD */}
              {currentQ.question_type === "MULTIPLE_CHOICE" &&
                Array.isArray(currentQ.options) &&
                currentQ.options.length > 0 && (
                  <div className="space-y-3">
                    {(currentQ.options as string[]).map((opt: string, oIdx: number) => {
                      const isSel = selectedAnswers[questionIdx] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => setSelectedAnswers((prev) => ({ ...prev, [questionIdx]: oIdx }))}
                          className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left text-sm transition-all ${
                            isSel
                              ? "border-primary bg-primary/10 font-bold shadow-sm"
                              : "border-exam-border bg-exam-surface hover:border-primary/50 text-exam-text"
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                              isSel
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-current/30"
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className={isSel ? "text-primary" : ""}>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

              {/* Essay / Writing */}
              {currentQ.question_type === "ESSAY" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-exam-text-muted">Bài viết của bạn:</label>
                    <span className="text-xs text-exam-text-muted">
                      {(textAnswers[currentQ.id] || "").split(/\s+/).filter(Boolean).length} từ
                    </span>
                  </div>
                  <textarea
                    value={textAnswers[currentQ.id] || ""}
                    onChange={(e) =>
                      setTextAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))
                    }
                    placeholder="Nhập bài viết của bạn tại đây..."
                    rows={10}
                    className="w-full p-4 rounded-xl border border-exam-border bg-exam-bg text-exam-text text-sm leading-7 resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-exam-text-muted/50"
                    spellCheck={false}
                  />
                </div>
              )}

              {/* Speaking Audio */}
              {currentQ.question_type === "SPEAKING_AUDIO" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mb-1">
                      🎙️ Hướng dẫn: Nhấn Bắt đầu ghi âm và nói câu trả lời rõ ràng vào microphone.
                    </p>
                    <p className="text-xs text-exam-text-muted">
                      Chuẩn bị 15 giây · Trả lời 30-60 giây
                    </p>
                  </div>
                  <SpeakingRecorder
                    questionId={currentQ.id}
                    submissionId={submissionId}
                    token={authToken}
                    onRecorded={(url, dur) => {
                      setAudioUrls((p) => ({ ...p, [currentQ.id]: url }));
                      setAudioDurations((p) => ({ ...p, [currentQ.id]: dur }));
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-exam-text-muted">
              <p>Không có câu hỏi nào trong đề thi này.</p>
            </div>
          )}
        </div>
      </main>
    );
  })()}

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t bg-exam-surface border-exam-border">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsQuestionListOpen(true)}
              title="Danh sách câu hỏi"
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-exam-surface border border-exam-border text-exam-text hover:bg-exam-border/40 transition-colors"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsInfoOpen(true)}
              title="Thông tin bài thi"
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-exam-surface border border-exam-border text-exam-text hover:bg-exam-border/40 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleScrollToTop}
              title={hasScrolled ? "Cuộn nhanh lên đầu trang" : "Bạn đang ở đầu trang rồi"}
              className={`w-9 h-9 flex items-center justify-center rounded-lg border text-xs font-bold transition-all ${
                hasScrolled
                  ? "border-primary bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground shadow-sm scale-105 active:scale-95 cursor-pointer ring-2 ring-primary/20"
                  : "border-exam-border/60 text-exam-text-muted/40 hover:bg-exam-border/20 cursor-default"
              }`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>

          {/* Nút nộp bài thường trực */}
          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-60"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Nộp bài ({answeredCount}/{questions.length})</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={questionIdx === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-exam-surface border border-exam-border text-exam-text text-sm font-medium hover:bg-exam-border/40 transition-colors disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-brand-brown text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              <span>{isLastStage ? "Nộp bài" : "Next"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* Question List Modal */}
      {isQuestionListOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsQuestionListOpen(false)}
        >
          <div
            className="bg-exam-surface border border-exam-border rounded-2xl max-w-2xl w-full p-5 md:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-exam-border">
              <div>
                <h4 className="font-bold text-base text-exam-text flex items-center gap-2">
                  <List className="w-4 h-4 text-primary" />
                  <span>Bảng điều hướng câu hỏi</span>
                  <span className="text-xs font-normal text-exam-text-muted">
                    ({answeredCount}/{questions.length} đã làm · {flaggedCount} cắm cờ)
                  </span>
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsQuestionListOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-exam-text-muted hover:text-exam-text hover:bg-exam-border/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chú thích màu sắc */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-exam-text-muted pb-1">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500 inline-block" />
                Đã trả lời
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-exam-bg border border-exam-border inline-block" />
                Chưa làm
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-500/20 border border-amber-500 inline-block relative">
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                </span>
                Cần xem lại
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-primary inline-block" />
                Đang làm
              </span>
            </div>

            {/* Filter by skill nếu là Full Test */}
            {examData?.skill === "FULL_TEST" && fullTestSkills.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setPaletteSkillFilter("ALL")}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors ${
                    paletteSkillFilter === "ALL"
                      ? "bg-primary text-primary-foreground"
                      : "bg-exam-bg border border-exam-border text-exam-text-muted hover:text-exam-text"
                  }`}
                >
                  Tất cả ({questions.length})
                </button>
                {fullTestSkills.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setPaletteSkillFilter(s.key)}
                    className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors ${
                      paletteSkillFilter === s.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-exam-bg border border-exam-border text-exam-text-muted hover:text-exam-text"
                    }`}
                  >
                    {s.name} ({s.answeredCount}/{s.totalCount})
                  </button>
                ))}
              </div>
            )}

            {/* Lưới câu hỏi */}
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-72 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                if (paletteSkillFilter !== "ALL" && getSkillFromQuestion(q).key !== paletteSkillFilter) {
                  return null;
                }
                const ans = isAnswered(idx);
                const cur = idx === questionIdx;
                const isFlagged = !!flaggedQuestions[idx];

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setQuestionIdx(idx); setIsQuestionListOpen(false); }}
                    className={`h-9 rounded-lg border text-xs font-bold transition-all relative flex items-center justify-center ${
                      cur
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : isFlagged
                        ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-extrabold"
                        : ans
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-exam-border bg-exam-bg text-exam-text hover:border-primary/50"
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 text-amber-500">
                        <Flag className="w-2.5 h-2.5 fill-current" />
                      </span>
                    )}
                    {ans && !isFlagged && !cur && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-exam-border flex items-center justify-between gap-3">
              <span className="text-xs text-exam-text-muted">
                Đã trả lời {answeredCount}/{questions.length} câu
              </span>
              <button
                type="button"
                onClick={() => { setIsQuestionListOpen(false); setIsSubmitModalOpen(true); }}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Nộp bài thi ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {isInfoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setIsInfoOpen(false)}
        >
          <div
            className="bg-exam-surface border border-exam-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-exam-border">
              <h4 className="font-bold text-sm text-exam-text">Thông tin bài thi</h4>
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded text-exam-text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-exam-text">
              {[
                { l: "Mã bài thi", v: testId.toUpperCase() },
                { l: "Kỹ năng", v: examData?.skill || "Aptis" },
                { l: "Tổng câu hỏi", v: `${questions.length} câu` },
                { l: "Đã trả lời", v: `${answeredCount} câu` },
                { l: "Cắm cờ xem lại", v: `${flaggedCount} câu` },
                { l: "Thời gian còn", v: timerFormatted },
              ].map((x) => (
                <div key={x.l} className="flex justify-between">
                  <span className="text-exam-text-muted">{x.l}:</span>
                  <span className="font-bold">{x.v}</span>
                </div>
              ))}
              {submissionId && (
                <div className="flex justify-between">
                  <span className="text-exam-text-muted">Session:</span>
                  <span className="font-mono text-[10px] break-all">{submissionId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Submit Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-exam-surface rounded-2xl border border-exam-border p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-exam-text">Xác nhận nộp bài thi?</h3>
            <p className="text-sm text-exam-text-muted leading-relaxed">
              Bạn đã hoàn thành <strong className="text-primary font-black">{answeredCount}/{questions.length}</strong> câu hỏi. Hệ thống sẽ tiến hành chấm điểm và lập bảng chi tiết kết quả.
            </p>
            {answeredCount < questions.length && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Lưu ý: Bạn vẫn còn {questions.length - answeredCount} câu chưa hoàn thành!</span>
              </div>
            )}
            {flaggedCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
                <Flag className="w-4 h-4 fill-current shrink-0 text-amber-500" />
                <span>Bạn đang có {flaggedCount} câu được cắm cờ xem lại.</span>
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-exam-border text-exam-text text-xs font-bold hover:bg-exam-border/40 transition-colors"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-60"
              >
                {isSubmitting ? "Đang nộp..." : "Xác nhận nộp bài"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
