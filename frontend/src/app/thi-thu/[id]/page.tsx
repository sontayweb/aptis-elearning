"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  StopCircle, Play, AlertTriangle, Upload, Pause, Check,
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

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-exam-border bg-exam-bg/50">
      <audio
        ref={audioRef}
        src={src}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setHasError(true)}
        preload="metadata"
      />
      <button
        type="button"
        onClick={toggle}
        disabled={hasError}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </button>
      <div className="flex-1 min-w-0">
        {label && <p className="text-xs font-semibold text-exam-text mb-1 truncate">{label}</p>}
        <div className="relative h-1.5 bg-exam-border rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {hasError && <p className="text-xs text-red-500 mt-1">Không thể tải audio</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {[0.75, 1, 1.25].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleSpeedChange(s)}
            className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
              playbackSpeed === s
                ? "bg-primary text-white shadow-xs"
                : "bg-exam-border/40 text-exam-text-muted hover:text-exam-text"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
      <span className="text-[10px] font-mono shrink-0 text-exam-text-muted">
        {Math.floor(currentTime / 60).toString().padStart(2, "0")}:
        {Math.floor(currentTime % 60).toString().padStart(2, "0")}
      </span>
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
    await rec.stopRecording();
  };

  const handleUpload = async () => {
    if (!submissionId || !token) {
      onRecorded(null, rec.recordingDuration);
      return;
    }
    const url = await rec.uploadRecording(submissionId, questionId, token);
    setUploaded(true);
    onRecorded(url, rec.recordingDuration);
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

  // Core state
  const [examData, setExamData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stagePhase, setStagePhase] = useState<"instruction" | "exam">("instruction");
  const [questionIdx, setQuestionIdx] = useState(0);

  // Submission
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [serverTime, setServerTime] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
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

  // UI
  const [isQuestionListOpen, setIsQuestionListOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [micTested, setMicTested] = useState(false);
  const [soundTested, setSoundTested] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [authToken, setAuthToken] = useState<string | null>(null);

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
                partTitle: part.title,
                partAudioUrl: part.audio_url,
                partPassageText: part.passage_text,
                partInstructions: part.instructions,
              });
            }
          }
          setQuestions(flat);
        }
      } catch (e) {
        console.warn("Load exam failed:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [testId, partParam]);

  // ---- Init submission when exam starts ----
  useEffect(() => {
    async function init() {
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
  }, [testId, isAuthenticated, stagePhase]);

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
          const userVal = (matchingAnswers[q.id] || "").trim().toLowerCase();
          const corVal = String(q.correct_answer || "").trim().toLowerCase();
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
      if (normalizedScore >= 46) cefr = "C";
      else if (normalizedScore >= 38) cefr = "B2";
      else if (normalizedScore >= 26) cefr = "B1";
      else if (normalizedScore >= 16) cefr = "A2";
      else if (normalizedScore > 5) cefr = "A1";
      else cefr = "A0";

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
  }, [isSubmitting, isFinished, submissionId, doAutosave, questions, selectedAnswers, textAnswers, matchingAnswers, orderAnswers, examData]);

  // Reading stage calculation: Mỗi Part (hoặc Story) là 1 Stage duy nhất
  const getReadingStages = useCallback(() => {
    if (examData?.skill !== "READING") return null;
    const stages: number[] = [];
    let inGapFill = false;
    let inOpinionMatching = false;
    let inLongReading = false;

    questions.forEach((q, idx) => {
      if (q.question_type === "GAP_FILL") {
        if (!inGapFill) {
          stages.push(idx);
          inGapFill = true;
        }
      } else if (q.question_type === "SENTENCE_ORDER") {
        stages.push(idx);
      } else if (q.question_type === "MATCHING") {
        if (q.partTitle?.includes("Part 5") || q.partTitle?.includes("Long Reading")) {
          if (!inLongReading) {
            stages.push(idx);
            inLongReading = true;
          }
        } else {
          if (!inOpinionMatching) {
            stages.push(idx);
            inOpinionMatching = true;
          }
        }
      } else {
        stages.push(idx);
      }
    });

    return stages.length > 0 ? stages : null;
  }, [examData?.skill, questions]);

  const readingStages = getReadingStages();
  const currentStageIndex = readingStages
    ? readingStages.findIndex((sIdx, i) => {
        const nextSIdx = readingStages[i + 1] ?? questions.length;
        return questionIdx >= sIdx && questionIdx < nextSIdx;
      })
    : -1;

  const isLastStage = readingStages
    ? currentStageIndex === readingStages.length - 1
    : questionIdx >= questions.length - 1;

  const handleNext = () => {
    if (stagePhase === "instruction") {
      setStagePhase("exam");
      setQuestionIdx(0);
      return;
    }

    if (readingStages) {
      if (currentStageIndex >= 0 && currentStageIndex < readingStages.length - 1) {
        setQuestionIdx(readingStages[currentStageIndex + 1]);
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

    if (readingStages) {
      if (currentStageIndex > 0) {
        setQuestionIdx(readingStages[currentStageIndex - 1]);
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
  const currentQ = questions[questionIdx];

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
  if (isFinished) {
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
                    ? `${Math.round(score)} / ${examData?.skill === "FULL_TEST" ? 200 : 50}`
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

            <div className="pt-4 border-t border-exam-border flex flex-wrap justify-center gap-3">
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
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-brand-brown transition-colors"
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

          <div className="text-xs text-exam-text-muted hidden sm:block shrink-0">
            {answeredCount}/{questions.length} câu
          </div>
        </div>
      </header>

      {/* Main Content: Split panel cho Listening/Writing; Reading full width */}
      <main className="flex-1 flex flex-col lg:flex-row items-start justify-center pt-12 pb-20">
        {/* Left panel: Passage / Audio (Chỉ hiện cho Listening/Writing/IELTS; ẩn hoàn toàn cho Reading vì đề Reading tự chứa nội dung) */}
        {((currentQ?.partPassageText || currentQ?.partAudioUrl) && examData?.skill !== "READING") && (
          <aside className="w-full lg:w-1/2 lg:h-[calc(100vh-7rem)] lg:overflow-y-auto lg:sticky lg:top-12 p-4 md:p-6 border-b lg:border-b-0 lg:border-r border-exam-border bg-exam-bg/30">
            {currentQ.partAudioUrl && (
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-exam-text-muted mb-2">
                  🔊 Audio: {currentQ.partTitle}
                </p>
                <AudioPlayer
                  src={
                    currentQ.partAudioUrl.startsWith("http")
                      ? currentQ.partAudioUrl
                      : `http://localhost:5000${currentQ.partAudioUrl}`
                  }
                  label={currentQ.partTitle}
                />
              </div>
            )}
            {currentQ.partPassageText && (
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
            )}
          </aside>
        )}

        {/* Right panel: Question */}
        <div
          className={`flex-1 w-full ${
            (currentQ?.partPassageText || currentQ?.partAudioUrl) && examData?.skill !== "READING"
              ? "lg:w-1/2"
              : currentQ?.question_type === "SENTENCE_ORDER"
              ? "max-w-5xl mx-auto"
              : "max-w-3xl mx-auto"
          } p-4 md:p-8`}
        >
          {currentQ ? (
            <div className="bg-exam-surface rounded-2xl border border-exam-border shadow-sm p-6 md:p-8 animate-in fade-in">
              {/* Question header */}
              <div className="flex items-center justify-between pb-4 border-b border-exam-border mb-6">
                <span className="text-xs font-bold text-exam-text uppercase tracking-wider">
                  {currentQ.partTitle || examData?.skill} ·{" "}
                  {partParam === "1"
                    ? "Part 1 – Gap Fill"
                    : partParam === "4"
                    ? "Part 4 – Opinion matching"
                    : partParam === "5"
                    ? "Part 5 – Long reading"
                    : readingStages && readingStages.length > 1
                    ? `Question ${currentStageIndex + 1} of ${readingStages.length}`
                    : `Câu ${questionIdx + 1}/${questions.length}`}
                </span>
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

              {/* 3. MATCHING COMPONENT (Part 4 Opinion Matching & Part 5 Long Reading) */}
              {currentQ.question_type === "MATCHING" && (
                currentQ.partTitle?.includes("Part 5") || currentQ.partTitle?.includes("Long Reading") ? (
                  <ReadingPart5LongReading
                    title={currentQ.partPassageText || currentQ.options?.title || "Children and Exercises"}
                    instructions={currentQ.partInstructions || "Read the passage quickly. Choose a heading for each numbered paragraph from the drop-down box."}
                    paragraphs={questions
                      .filter(
                        (q) =>
                          q.part_id === currentQ.part_id ||
                          q.partTitle?.includes("Part 5") ||
                          q.partTitle?.includes("Long Reading")
                      )
                      .map((q, idx) => ({
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
                ) : (
                  <ReadingPart4OpinionMatching
                    instructions={currentQ.partInstructions}
                    reviewsText={currentQ.partPassageText}
                    questions={questions.filter(
                      (q) =>
                        q.part_id === currentQ.part_id ||
                        q.partTitle?.includes("Part 4") ||
                        q.partTitle?.includes("Opinion")
                    )}
                    answers={matchingAnswers}
                    onSelect={(qId, val) => {
                      setMatchingAnswers((prev) => ({ ...prev, [qId]: val }));
                    }}
                  />
                )
              )}

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
          </div>

          {questionIdx >= questions.length - 3 && questions.length > 0 && (
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              Nộp bài ({answeredCount}/{questions.length})
            </button>
          )}

          <div className="flex items-center gap-2">
            <Link
              href="/thi-thu"
              title="Thoát"
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-exam-surface border border-exam-border text-exam-text hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </Link>
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4"
          onClick={() => setIsQuestionListOpen(false)}
        >
          <div
            className="bg-exam-surface border border-exam-border rounded-2xl max-w-sm w-full p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-exam-border mb-4">
              <h4 className="font-bold text-sm text-exam-text">
                Danh sách câu hỏi ({answeredCount}/{questions.length})
              </h4>
              <button
                type="button"
                onClick={() => setIsQuestionListOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded text-exam-text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const ans = isAnswered(idx);
                const cur = idx === questionIdx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setQuestionIdx(idx); setIsQuestionListOpen(false); }}
                    className={`h-10 rounded-lg border text-xs font-bold transition-colors relative ${
                      cur
                        ? "border-primary bg-primary text-primary-foreground"
                        : ans
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-exam-border bg-exam-surface text-exam-text hover:border-primary/50"
                    }`}
                  >
                    {idx + 1}
                    {ans && !cur && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 border border-exam-surface" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-exam-border">
              <button
                type="button"
                onClick={() => { setIsQuestionListOpen(false); setIsSubmitModalOpen(true); }}
                disabled={isSubmitting}
                className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-brand-brown transition-colors"
              >
                Nộp bài ngay ({answeredCount}/{questions.length} câu)
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
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                ⚠️ Lưu ý: Bạn vẫn còn {questions.length - answeredCount} câu chưa hoàn thành!
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
