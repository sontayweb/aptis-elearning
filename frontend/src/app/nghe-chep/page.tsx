"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { api } from "@/lib/api-client";
import {
  Headphones,
  Mic,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  Volume2,
  HelpCircle,
  ChevronRight,
  Crown,
  Lock,
  Square,
  Search,
} from "lucide-react";

import {
  DictationSentence,
  DictationLesson,
  DEFAULT_LEVEL_PROGRESS,
  DEFAULT_DICTATION_LESSONS,
  DEFAULT_DICTATION_SENTENCES as DEFAULT_SENTENCES,
} from "@/data/dictation-data";

type StepType = "hub" | "setup" | "lesson-list" | "runner";

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();
}

export default function NgheChepPage() {
  const { isAuthenticated } = useAuth();

  // Navigation steps: "hub" | "setup" | "lesson-list" | "runner"
  const [step, setStep] = useState<StepType>("hub");

  // Mode: "dictation" (Nghe chép) | "shadowing" (Nói nhại) | "combo" (Kết hợp)
  const [practiceType, setPracticeType] = useState<"dictation" | "shadowing" | "combo">("dictation");

  // Selected Level
  const [selectedLevelId, setSelectedLevelId] = useState<"foundation" | "momentum" | "mastery">("foundation");

  // Setup options
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [difficulty, setDifficulty] = useState<"30" | "50" | "70" | "100">("30");
  const [maxListens, setMaxListens] = useState<number | "unlimited">(5);
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);

  // Lesson browsing & tracking
  const [currentLesson, setCurrentLesson] = useState<DictationLesson | null>(null);
  const [currentLessonTitle, setCurrentLessonTitle] = useState<string>("");
  const [enteredFromLessonList, setEnteredFromLessonList] = useState(false);
  const [lessonSearch, setLessonSearch] = useState("");
  const [lessonFilter, setLessonFilter] = useState<"all" | "incomplete" | "completed">("all");
  const [userProgress, setUserProgress] = useState(DEFAULT_LEVEL_PROGRESS);

  // Runner state
  const [sentenceList, setSentenceList] = useState<DictationSentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [listenCount, setListenCount] = useState(0);
  const [userBlankInputs, setUserBlankInputs] = useState<Record<number, string>>({});
  const [checkStatus, setCheckStatus] = useState<"idle" | "checked" | "revealed">("idle");
  const [showHint, setShowHint] = useState(false);
  const [isShadowingUnlocked, setIsShadowingUnlocked] = useState(false);

  // Audio recording hook
  const {
    isRecording,
    recordingDuration,
    audioUrl: userAudioUrl,
    volumeLevel,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const currentSentence = sentenceList[currentIndex] || sentenceList[0] || null;
  const sentenceWords = useMemo(
    () => (currentSentence ? currentSentence.originalText.split(" ") : []),
    [currentSentence]
  );
  const blankWordIndices = useRef<number[]>([]);

  useEffect(() => {
    if (!currentSentence) return;
    const words = currentSentence.originalText.split(" ");
    let hiddenRatio = 0.3;
    if (difficulty === "50") hiddenRatio = 0.5;
    else if (difficulty === "70") hiddenRatio = 0.7;
    else if (difficulty === "100") hiddenRatio = 1.0;

    const indices: number[] = [];
    words.forEach((w, idx) => {
      const clean = w.replace(/[^a-zA-Z]/g, "");
      if (clean.length > 2 && Math.random() < hiddenRatio) {
        indices.push(idx);
      }
    });

    if (indices.length === 0 && words.length > 2) {
      indices.push(1);
      if (words.length > 4) indices.push(3);
    }

    blankWordIndices.current = indices;
    setUserBlankInputs({});
    setCheckStatus("idle");
    setListenCount(0);
    setShowHint(false);
    setIsShadowingUnlocked(practiceType !== "combo");
    resetRecording();
  }, [currentIndex, currentSentence, difficulty, practiceType, resetRecording]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [step, currentIndex]);

  useEffect(() => {
    async function fetchLevels() {
      try {
        const res = await api.dictation.getLevels();
        if (res.success && Array.isArray(res.data)) {
          const updated = { ...DEFAULT_LEVEL_PROGRESS };
          res.data.forEach((lvl: any) => {
            const key = String(lvl.level || "").toLowerCase();
            if (updated[key]) {
              updated[key] = {
                totalLessons: lvl.total_lessons || updated[key].totalLessons,
                totalSentences: lvl.total_sentences || updated[key].totalSentences,
                completedSentences: lvl.completed_sentences || updated[key].completedSentences,
              };
            }
          });
          setUserProgress(updated);
        }
      } catch (err) {
        console.warn("Could not load dictation levels:", err);
      }
    }
    fetchLevels();
  }, [isAuthenticated]);

  // Start session directly from Setup
  const handleStartSession = async () => {
    try {
      const res = await api.dictation.getLessons(selectedLevelId.toUpperCase());
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const firstLesson = res.data[0];
        const detailRes = await api.dictation.getLessonDetail(firstLesson.id);
        if (detailRes.success && detailRes.data?.sentences && detailRes.data.sentences.length > 0) {
          const apiSentences: DictationSentence[] = detailRes.data.sentences.map((s: any) => ({
            id: s.id,
            level: `Level - ${selectedLevelId.toUpperCase()}`,
            topic: firstLesson.title || "Bài luyện tập",
            originalText: s.transcript_text,
            hint: s.hint || undefined,
            audioTime: s.audio_duration ? `00:${String(Math.round(s.audio_duration)).padStart(2, "0")}` : "00:05",
          }));
          setSentenceList(apiSentences.slice(0, numQuestions));
          setCurrentLessonTitle(firstLesson.title || "Phiên luyện tập");
          setCurrentLesson(null);
          setCurrentIndex(0);
          setEnteredFromLessonList(false);
          setStep("runner");
          return;
        }
      }
    } catch (err) {
      console.warn("Using fallback dictation sentences:", err);
    }

    const lessons = DEFAULT_DICTATION_LESSONS[selectedLevelId] || DEFAULT_DICTATION_LESSONS.foundation;
    if (lessons.length > 0) {
      const firstLes = lessons[0];
      setCurrentLesson(firstLes);
      setCurrentLessonTitle(firstLes.title);
      setSentenceList(firstLes.sentences);
    } else {
      const fallbackList = DEFAULT_SENTENCES[selectedLevelId] || DEFAULT_SENTENCES.foundation;
      setSentenceList(fallbackList.slice(0, numQuestions));
      setCurrentLessonTitle(`Level ${selectedLevelId === "foundation" ? "1" : selectedLevelId === "momentum" ? "2" : "3"} - Phiên luyện`);
      setCurrentLesson(null);
    }

    setCurrentIndex(0);
    setEnteredFromLessonList(false);
    setStep("runner");
  };

  // Select a specific lesson from the Lesson List screen
  const handleSelectLesson = (lesson: DictationLesson) => {
    setCurrentLesson(lesson);
    setCurrentLessonTitle(lesson.title);
    setSentenceList(lesson.sentences);
    setCurrentIndex(0);
    setEnteredFromLessonList(true);
    setStep("runner");
  };

  const handlePlayAudio = (rateMultiplier = 1) => {
    if (!currentSentence) return;
    setIsPlaying(true);
    if (rateMultiplier === 1) {
      setListenCount((prev) => (maxListens !== "unlimited" && prev >= maxListens ? prev : prev + 1));
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentSentence.originalText);
      utterance.lang = "en-GB";
      utterance.rate = playbackSpeed * rateMultiplier;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlaying(false), 2500);
    }
  };

  const handleCheck = async () => {
    setCheckStatus("checked");
    setIsShadowingUnlocked(true);

    if (isAuthenticated && currentSentence?.id) {
      try {
        const fullSubmittedText = sentenceWords
          .map((w, idx) => (blankWordIndices.current.includes(idx) ? userBlankInputs[idx] || "" : w))
          .join(" ");

        await api.dictation.checkSentence(String(currentSentence.id), {
          submittedText: fullSubmittedText,
          mode: practiceType === "shadowing" ? "SHADOWING" : "DICTATION",
          audioUrl: userAudioUrl || undefined,
        });
      } catch (err) {
        console.warn("Dictation autosave fallback:", err);
      }
    }
  };

  const handleResetCurrent = () => {
    setUserBlankInputs({});
    setCheckStatus("idle");
    setShowHint(false);
  };

  const handleToggleRecord = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  // Filtered lessons for "lesson-list" screen
  const currentLevelLessons = DEFAULT_DICTATION_LESSONS[selectedLevelId] || [];

  const filteredLessons = useMemo(() => {
    return currentLevelLessons.filter((les) => {
      const q = lessonSearch.trim().toLowerCase();
      const qNoTone = removeVietnameseTones(q);
      const matchesSearch =
        q === "" ||
        les.title.toLowerCase().includes(q) ||
        removeVietnameseTones(les.title).includes(qNoTone) ||
        (les.description &&
          (les.description.toLowerCase().includes(q) ||
            removeVietnameseTones(les.description).includes(qNoTone))) ||
        les.sentences.some(
          (s) =>
            s.originalText.toLowerCase().includes(q) ||
            removeVietnameseTones(s.originalText).includes(qNoTone)
        );

      if (!matchesSearch) return false;
      if (lessonFilter === "incomplete") return les.completedSentences < les.totalSentences;
      if (lessonFilter === "completed") return les.completedSentences === les.totalSentences && les.totalSentences > 0;
      return true;
    });
  }, [currentLevelLessons, lessonSearch, lessonFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-32 md:pt-36 pb-20">
        <div className="section-container max-w-5xl mx-auto px-4">
          {/* ========================================================================= */}
          {/* SCREEN 1: HUB / CHỌN KIỂU LUYỆN TẬP & LEVEL (Chuẩn aptiskytich.vn)          */}
          {/* ========================================================================= */}
          {step === "hub" && (
            <div className="space-y-6 animate-in fade-in max-w-3xl mx-auto">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </Link>

              {/* Banner tím sẫm (Chuẩn 100% aptiskytich.vn) */}
              <div className="rounded-3xl bg-[#24123E] dark:bg-[#180A2C] text-white p-6 md:p-8 shadow-sm space-y-1">
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-white">
                  Nghe chép &amp; nói nhại (Dictation &amp; Shadowing)
                </h1>
                <p className="text-xs md:text-sm text-purple-200/90 font-medium">
                  Chọn kiểu luyện tập, rồi chọn level để bắt đầu.
                </p>
              </div>

              {/* 3 Thẻ Chế độ (Chuẩn aptiskytich.vn: viền cam, badge xám nhạt) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Nghe chép */}
                <button
                  type="button"
                  onClick={() => setPracticeType("dictation")}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    practiceType === "dictation"
                      ? "border-[#ea580c] ring-1 ring-[#ea580c] bg-card shadow-xs"
                      : "border-border/80 bg-card hover:border-[#ea580c]/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#ea580c] flex items-center justify-center">
                      <Headphones className="w-5 h-5" />
                    </div>
                    {practiceType === "dictation" && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-foreground">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-sm text-foreground">Nghe chép</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Nghe rồi gõ lại câu</p>
                </button>

                {/* 2. Nói nhại */}
                <button
                  type="button"
                  onClick={() => setPracticeType("shadowing")}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    practiceType === "shadowing"
                      ? "border-[#ea580c] ring-1 ring-[#ea580c] bg-card shadow-xs"
                      : "border-border/80 bg-card hover:border-[#ea580c]/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Mic className="w-5 h-5" />
                    </div>
                    {practiceType === "shadowing" && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-foreground">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-sm text-foreground">Nói nhại</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Nghe rồi nhắc lại theo audio (Shadowing)
                  </p>
                </button>

                {/* 3. Kết hợp */}
                <button
                  type="button"
                  onClick={() => setPracticeType("combo")}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    practiceType === "combo"
                      ? "border-[#ea580c] ring-1 ring-[#ea580c] bg-card shadow-xs"
                      : "border-border/80 bg-card hover:border-[#ea580c]/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    {practiceType === "combo" && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-foreground">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-sm text-foreground">Kết hợp</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Vừa chép vừa nói nhại</p>
                </button>
              </div>

              {/* Chọn Level */}
              <div className="space-y-3 pt-2">
                <div>
                  <h3 className="font-heading font-bold text-base text-foreground">Chọn Level</h3>
                  <p className="text-xs text-muted-foreground">
                    Ba cấp độ tăng dần theo độ khó bài thi thật.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Level 1 · Foundation */}
                  <div
                    onClick={() => {
                      setSelectedLevelId("foundation");
                      setStep("setup");
                    }}
                    className="p-5 md:p-6 rounded-2xl border border-border/80 bg-card shadow-xs hover:border-[#ea580c]/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="font-heading font-bold text-base text-foreground group-hover:text-[#ea580c] transition-colors">
                          Level 1 · Foundation
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Câu ngắn, tốc độ chậm — dựng phản xạ (Listening câu 1 - 13)
                        </p>
                        <span className="text-xs text-muted-foreground font-mono block pt-0.5">
                          355 bài · 1681 câu
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-[#ea580c] group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#ea580c] rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              (userProgress.foundation.completedSentences / userProgress.foundation.totalSentences) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground shrink-0">
                        {userProgress.foundation.completedSentences}/{userProgress.foundation.totalSentences}
                      </span>
                    </div>
                  </div>

                  {/* Level 2 · Momentum */}
                  <div
                    onClick={() => {
                      setSelectedLevelId("momentum");
                      setStep("setup");
                    }}
                    className="p-5 md:p-6 rounded-2xl border border-border/80 bg-card shadow-xs hover:border-[#ea580c]/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="font-heading font-bold text-base text-foreground group-hover:text-[#ea580c] transition-colors">
                          Level 2 · Momentum
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Đoạn dài, nhiều thông tin — tập giữ mạch khi thông tin dồn dập (Listening câu 14)
                        </p>
                        <span className="text-xs text-muted-foreground font-mono block pt-0.5">
                          34 bài · 364 câu
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-[#ea580c] group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#ea580c] rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              (userProgress.momentum.completedSentences / userProgress.momentum.totalSentences) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground shrink-0">
                        {userProgress.momentum.completedSentences}/{userProgress.momentum.totalSentences}
                      </span>
                    </div>
                  </div>

                  {/* Level 3 · Mastery */}
                  <div
                    onClick={() => {
                      setSelectedLevelId("mastery");
                      setStep("setup");
                    }}
                    className="p-5 md:p-6 rounded-2xl border border-border/80 bg-card shadow-xs hover:border-[#ea580c]/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="font-heading font-bold text-base text-foreground group-hover:text-[#ea580c] transition-colors">
                          Level 3 · Mastery
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Hội thoại nêu quan điểm và bài nói học thuật khó (Listening câu 15 - 17)
                        </p>
                        <span className="text-xs text-muted-foreground font-mono block pt-0.5">
                          133 bài · 1441 câu
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-[#ea580c] group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#ea580c] rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              (userProgress.mastery.completedSentences / userProgress.mastery.totalSentences) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground shrink-0">
                        {userProgress.mastery.completedSentences}/{userProgress.mastery.totalSentences}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 2: THIẾT LẬP PHIÊN LUYỆN (Chuẩn 100% aptiskytich.vn)                 */}
          {/* ========================================================================= */}
          {step === "setup" && (
            <div className="space-y-4 animate-in fade-in max-w-xl mx-auto">
              <button
                type="button"
                onClick={() => setStep("hub")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>

              {/* Khung tiêu đề tím sẫm */}
              <div className="rounded-3xl bg-[#24123E] dark:bg-[#180A2C] text-white p-6 md:p-7 shadow-sm space-y-1">
                <h1 className="text-2xl font-heading font-bold text-white">
                  Thiết lập phiên luyện
                </h1>
                <p className="text-xs text-purple-200/90 font-medium">
                  {selectedLevelId === "foundation"
                    ? "Level 1 · Foundation"
                    : selectedLevelId === "momentum"
                    ? "Level 2 · Momentum"
                    : "Level 3 · Mastery"}
                </p>
              </div>

              {/* Card cài đặt */}
              <div className="rounded-3xl border border-border/80 bg-card p-6 md:p-8 shadow-sm space-y-6">
                {/* 1. Số câu mỗi phiên */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground block">Số câu mỗi phiên</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setNumQuestions(num)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          numQuestions === num
                            ? "bg-[#ea580c] text-white border-transparent shadow-xs"
                            : "bg-card text-foreground border-border/80 hover:bg-muted"
                        }`}
                      >
                        {num} câu
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Tốc độ phát (dùng ký tự × chuẩn) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground block">Tốc độ phát</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 0.75, label: "0.75×" },
                      { val: 1, label: "1×" },
                      { val: 1.25, label: "1.25×" },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setPlaybackSpeed(item.val)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          playbackSpeed === item.val
                            ? "bg-[#ea580c] text-white border-transparent shadow-xs"
                            : "bg-card text-foreground border-border/80 hover:bg-muted"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Độ khó */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground block">
                    Độ khó (số từ phải điền)
                  </label>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { id: "30", label: "Dễ · ẩn 30%" },
                      { id: "50", label: "Vừa · 50%" },
                      { id: "70", label: "Khó · 70%" },
                      { id: "100", label: "Chép hết · 100%" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDifficulty(item.id as any)}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all border truncate ${
                          difficulty === item.id
                            ? "bg-[#ea580c] text-white border-transparent shadow-xs"
                            : "bg-card text-foreground border-border/80 hover:bg-muted"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Số lần nghe tối đa */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground block">
                    Số lần nghe tối đa mỗi câu
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 3, label: "3 lần" },
                      { val: 5, label: "5 lần" },
                      { val: "unlimited", label: "Không giới hạn" },
                    ].map((item) => (
                      <button
                        key={String(item.val)}
                        type="button"
                        onClick={() => setMaxListens(item.val as any)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          maxListens === item.val
                            ? "bg-[#ea580c] text-white border-transparent shadow-xs"
                            : "bg-card text-foreground border-border/80 hover:bg-muted"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Chỉ luyện bài chưa hoàn thành */}
                <div className="flex items-center justify-between pt-2 border-t border-border/70">
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Chỉ luyện bài chưa hoàn thành
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Ưu tiên những câu bạn chưa đạt điểm tối đa.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOnlyIncomplete(!onlyIncomplete)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      onlyIncomplete ? "bg-[#ea580c]" : "bg-muted border border-border"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        onlyIncomplete ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Nút Bắt đầu */}
                <button
                  type="button"
                  onClick={handleStartSession}
                  className="w-full py-3.5 rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm shadow-md transition-all active:scale-[0.99]"
                >
                  Bắt đầu
                </button>

                {/* Hoặc chọn bài cụ thể */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setStep("lesson-list")}
                    className="text-xs font-semibold text-[#ea580c] hover:underline inline-flex items-center gap-1 transition-colors"
                  >
                    <span>Hoặc chọn bài cụ thể</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 3: CHỌN BÀI CỤ THỂ (Chuẩn 100% aptiskytich.vn - Danh sách dọc)       */}
          {/* ========================================================================= */}
          {step === "lesson-list" && (
            <div className="space-y-4 animate-in fade-in max-w-xl mx-auto">
              <button
                type="button"
                onClick={() => setStep("setup")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>

              {/* Header Banner tím sẫm (Chuẩn aptiskytich.vn) */}
              <div className="rounded-3xl bg-[#24123E] dark:bg-[#180A2C] text-white p-6 md:p-7 shadow-sm space-y-1">
                <h1 className="text-2xl font-heading font-bold text-white">
                  Chọn bài cụ thể
                </h1>
                <p className="text-xs text-purple-200/90 font-medium">
                  {selectedLevelId === "foundation"
                    ? "Level 1 · Foundation"
                    : selectedLevelId === "momentum"
                    ? "Level 2 · Momentum"
                    : "Level 3 · Mastery"}
                </p>
              </div>

              {/* Ô tìm kiếm gọn nhẹ */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={lessonSearch}
                  onChange={(e) => setLessonSearch(e.target.value)}
                  placeholder="Tìm kiếm bài luyện..."
                  className="w-full pl-10 pr-8 py-2 rounded-xl border border-border/80 bg-card text-xs focus:outline-hidden focus:border-[#ea580c] transition-colors"
                />
                {lessonSearch && (
                  <button
                    type="button"
                    onClick={() => setLessonSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Danh sách bài học (Dọc, chuẩn 1:1 aptiskytich.vn) */}
              <div className="space-y-3 pt-1">
                {filteredLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    onClick={() => handleSelectLesson(lesson)}
                    className="p-5 rounded-2xl border border-border/80 bg-card hover:border-[#ea580c] transition-all cursor-pointer shadow-xs group"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-bold text-sm text-foreground group-hover:text-[#ea580c] transition-colors">
                        {lesson.title}
                      </h3>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#ea580c] group-hover:translate-x-0.5 transition-all" />
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        {lesson.part || "Part 1"}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {lesson.completedSentences}/{lesson.totalSentences} câu
                      </span>
                    </div>

                    {/* Thanh tiến độ dưới thẻ bài */}
                    <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#ea580c] rounded-full transition-all"
                        style={{
                          width: `${
                            lesson.totalSentences > 0
                              ? (lesson.completedSentences / lesson.totalSentences) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}

                {filteredLessons.length === 0 && (
                  <div className="py-10 text-center text-muted-foreground text-xs">
                    Không tìm thấy bài luyện nào phù hợp.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 4: PRACTICE RUNNER (Chuẩn 100% aptiskytich.vn)                      */}
          {/* ========================================================================= */}
          {step === "runner" && currentSentence && (
            <div
              className={`space-y-4 animate-in fade-in mx-auto ${
                practiceType === "combo" ? "max-w-5xl" : "max-w-2xl"
              }`}
            >
              {/* Header Trên Cùng: ← Quay lại | Tiêu đề + Phụ đề | ✕ Thoát */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (enteredFromLessonList) {
                      setStep("lesson-list");
                    } else {
                      setStep("setup");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-border/80 bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại</span>
                </button>

                <div className="text-center">
                  <h2 className="text-xs md:text-sm font-bold text-foreground">
                    {currentLessonTitle || currentSentence.topic}
                  </h2>
                  <span className="text-[11px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                    {practiceType === "dictation" ? (
                      <>
                        <Headphones className="w-3 h-3 text-[#ea580c]" />
                        <span>Nghe &amp; điền từ</span>
                      </>
                    ) : practiceType === "shadowing" ? (
                      <>
                        <Mic className="w-3 h-3 text-amber-500" />
                        <span>Nghe &amp; nói nhại</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-rose-500" />
                        <span>Chế độ kết hợp</span>
                      </>
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setStep("hub")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Thoát</span>
                </button>
              </div>

              {/* Sub-bar Điều hướng: ← Câu trước | 1/3 | Câu tiếp theo > */}
              <div className="flex flex-col items-center gap-2 pt-1 pb-1">
                <div className="w-full flex items-center justify-between">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full border border-border/80 bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none shadow-2xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Câu trước</span>
                  </button>

                  <div className="px-3.5 py-1 rounded-full border border-border/80 bg-muted/40 text-xs font-mono font-bold text-foreground">
                    {currentIndex + 1}/{sentenceList.length}
                  </div>

                  <button
                    type="button"
                    disabled={currentIndex === sentenceList.length - 1}
                    onClick={() => setCurrentIndex((prev) => Math.min(sentenceList.length - 1, prev + 1))}
                    className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none shadow-xs"
                  >
                    <span>Câu tiếp theo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Vạch line cam điểm nhấn dưới thanh điều hướng (Chuẩn aptiskytich.vn) */}
                <div className="w-32 h-1 bg-[#ea580c] rounded-full mt-1" />
              </div>

              {/* MODE CONTAINER */}
              <div
                className={
                  practiceType === "combo"
                    ? "grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
                    : "space-y-4"
                }
              >
                {/* Audio Player Component Helper */}
                {(() => {
                  const renderAudioPlayer = () => (
                    <div className="space-y-2">
                      <div className="p-3 rounded-2xl bg-muted/20 border border-border/70 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePlayAudio(playbackSpeed)}
                            className="w-11 h-11 rounded-full bg-[#ea580c] hover:bg-[#c2410c] text-white flex items-center justify-center shadow-md hover:scale-105 transition-all shrink-0"
                          >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePlayAudio(playbackSpeed)}
                            className="w-9 h-9 rounded-full border border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shrink-0"
                            title="Nghe lại"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Waveform graphic (Terracotta warm bars) */}
                        <div className="flex-1 flex items-center justify-center gap-1 h-8 overflow-hidden px-2">
                          {[16, 28, 44, 22, 35, 18, 50, 32, 20, 42, 26, 48, 16, 32, 24, 38, 18, 28, 36, 22, 44, 18].map((h, i) => (
                            <span
                              key={i}
                              className={`w-1 rounded-full transition-all duration-200 ${
                                isPlaying ? "bg-[#ea580c] animate-pulse" : "bg-orange-300 dark:bg-orange-950/40"
                              }`}
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>

                        <span className="text-xs font-mono font-semibold text-muted-foreground shrink-0">
                          0:00 / {currentSentence.audioTime || "0:06"}
                        </span>
                      </div>

                      {/* Listen count & playback speeds */}
                      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
                        <span>
                          Đã nghe {listenCount}/{maxListens === "unlimited" ? "∞" : maxListens} lần
                        </span>
                        <div className="flex items-center gap-1.5">
                          {[0.75, 1, 1.25].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setPlaybackSpeed(s)}
                              className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-colors ${
                                playbackSpeed === s
                                  ? "bg-[#ea580c] text-white shadow-2xs"
                                  : "border border-border/80 bg-card text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {s}x
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );

                  return (
                    <>
                      {/* =================================================================== */}
                      {/* COMPONENT A: LISTEN & FILL (Dùng cho mode dictation & combo)         */}
                      {/* =================================================================== */}
                      {(practiceType === "dictation" || practiceType === "combo") && (
                        <div className="rounded-3xl border border-border/80 bg-card p-5 md:p-6 shadow-sm space-y-5">
                          {/* Top Tag */}
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-[#ea580c] flex items-center justify-center shrink-0">
                              <Headphones className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                NGHE VÀ ĐIỀN TỪ
                              </span>
                              <h3 className="text-sm md:text-base font-bold text-foreground leading-tight">
                                Listen &amp; Fill
                              </h3>
                            </div>
                          </div>

                          {/* Audio Player at top of Listen & Fill */}
                          {renderAudioPlayer()}

                          {/* Gap Fill Inputs */}
                          <div className="p-5 md:p-6 rounded-2xl bg-card border border-border/80 space-y-4">
                            <div className="text-sm md:text-base font-medium leading-relaxed flex flex-wrap items-center gap-x-2 gap-y-3">
                              {sentenceWords.map((word, wIdx) => {
                                const isBlank = blankWordIndices.current.includes(wIdx);
                                const cleanWord = word.replace(/[.,!?;:]/g, "").toLowerCase();
                                const punctuation = word.replace(/[a-zA-Z0-9]/g, "");

                                if (!isBlank) {
                                  return (
                                    <span key={wIdx} className="text-foreground">
                                      {word}
                                    </span>
                                  );
                                }

                                const userVal = userBlankInputs[wIdx] || "";
                                const isCorrect =
                                  checkStatus === "checked" &&
                                  userVal.trim().toLowerCase() === cleanWord;
                                const isWrong =
                                  checkStatus === "checked" &&
                                  userVal.trim().toLowerCase() !== cleanWord;

                                return (
                                  <span key={wIdx} className="inline-flex items-center">
                                    <input
                                      ref={(el) => {
                                        inputRefs.current[wIdx] = el;
                                      }}
                                      type="text"
                                      value={userVal}
                                      placeholder="______"
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setUserBlankInputs((prev) => ({ ...prev, [wIdx]: val }));
                                        if (val.endsWith(" ")) {
                                          setUserBlankInputs((prev) => ({
                                            ...prev,
                                            [wIdx]: val.trim(),
                                          }));
                                          const nextBlank = blankWordIndices.current.find((i) => i > wIdx);
                                          if (typeof nextBlank === "number") {
                                            inputRefs.current[nextBlank]?.focus();
                                          }
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          handleCheck();
                                        }
                                      }}
                                      className={`px-2 py-0.5 min-w-[70px] max-w-[130px] text-center border-b-2 bg-transparent text-sm md:text-base font-bold outline-none transition-colors ${
                                        isCorrect
                                          ? "border-emerald-500 text-emerald-600 bg-emerald-500/10 rounded"
                                          : isWrong
                                          ? "border-destructive text-destructive bg-destructive/10 rounded"
                                          : "border-foreground/40 focus:border-[#ea580c] text-foreground"
                                      }`}
                                    />
                                    {punctuation && <span className="text-foreground">{punctuation}</span>}
                                  </span>
                                );
                              })}
                            </div>

                            {checkStatus === "revealed" && (
                              <div className="mt-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center animate-in fade-in">
                                <span className="text-[11px] font-semibold text-muted-foreground block mb-0.5">
                                  Câu chuẩn:
                                </span>
                                <p className="text-xs font-bold text-[#ea580c]">{currentSentence.originalText}</p>
                              </div>
                            )}

                            {showHint && currentSentence.hint && (
                              <p className="text-xs text-amber-600 mt-2 italic animate-in fade-in">
                                💡 Gợi ý: {currentSentence.hint}
                              </p>
                            )}

                            {/* Controls: Space to skip | Gợi ý, Làm lại, Kiểm tra (Rounded-full pills) */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/70">
                              <span className="text-xs text-muted-foreground">
                                Nhấn phím Space để qua từ
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setShowHint(true)}
                                  className="px-3.5 py-1.5 rounded-full border border-border/80 bg-card hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                                >
                                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Gợi ý</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleResetCurrent}
                                  className="px-3.5 py-1.5 rounded-full border border-border/80 bg-card hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Làm lại</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCheck}
                                  className="px-4 py-1.5 rounded-full bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Kiểm tra</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Bỏ qua, xem đáp án */}
                          <div className="text-center pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setCheckStatus("revealed");
                                setIsShadowingUnlocked(true);
                              }}
                              className="px-4 py-1.5 rounded-full bg-muted/40 hover:bg-muted border border-border/70 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                            >
                              Bỏ qua, xem đáp án
                            </button>
                          </div>
                        </div>
                      )}

                      {/* =================================================================== */}
                      {/* COMPONENT B: LISTEN & SHADOWING (Dùng cho mode shadowing & combo)   */}
                      {/* =================================================================== */}
                      {(practiceType === "shadowing" || practiceType === "combo") && (
                        <div className="rounded-3xl border border-border/80 bg-card p-5 md:p-6 shadow-sm space-y-5">
                          {/* In shadowing mode: Top Audio Player */}
                          {practiceType === "shadowing" && renderAudioPlayer()}

                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                              <Mic className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                NGHE VÀ NÓI NHẠI
                              </span>
                              <h3 className="text-sm md:text-base font-bold text-foreground leading-tight">
                                Listen &amp; Shadowing
                              </h3>
                            </div>
                          </div>

                          {/* PRONUNCIATION SECTION */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                              PRONUNCIATION
                            </span>

                            {/* Locked state in combo mode if gap fill not completed */}
                            {practiceType === "combo" && !isShadowingUnlocked ? (
                              <div className="p-6 rounded-2xl border border-dashed border-border bg-muted/20 text-center space-y-2">
                                <Lock className="w-5 h-5 mx-auto text-muted-foreground" />
                                <p className="text-xs font-semibold text-muted-foreground">
                                  Làm xong phần điền từ để mở phần luyện nói
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setIsShadowingUnlocked(true)}
                                  className="text-[11px] text-[#ea580c] underline"
                                >
                                  (Hoặc mở khóa luyện nói ngay)
                                </button>
                              </div>
                            ) : (
                              <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-2">
                                <p className="text-base md:text-lg font-bold text-foreground leading-snug">
                                  {currentSentence.originalText}
                                </p>
                              </div>
                            )}

                            {/* Sample Audio Button */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handlePlayAudio(1)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/80 bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-2xs"
                              >
                                <Volume2 className="w-3.5 h-3.5 text-[#ea580c]" />
                                <span>Nghe câu mẫu</span>
                              </button>
                              <span className="text-[10px] text-muted-foreground font-normal">
                                Tốc độ mẫu 1x - không tính lượt nghe
                              </span>
                            </div>
                          </div>

                          {/* LUYỆN NÓI */}
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-foreground">Luyện nói</span>
                              <span className="font-mono text-muted-foreground">
                                {isRecording ? `0:${String(recordingDuration).padStart(2, "0")}` : "0:20"}
                              </span>
                            </div>

                            <div className="p-4 rounded-2xl bg-muted/20 border border-border/80 text-center space-y-3">
                              <span className="text-xs text-muted-foreground font-medium block">
                                Thu âm câu nói của bạn
                              </span>

                              {/* Big Start Recording Button */}
                              <button
                                type="button"
                                onClick={handleToggleRecord}
                                className={`w-full py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                                  isRecording
                                    ? "bg-destructive text-white animate-pulse"
                                    : "bg-[#ea580c] hover:bg-[#c2410c] text-white"
                                }`}
                              >
                                {isRecording ? (
                                  <>
                                    <Square className="w-3.5 h-3.5 fill-current" />
                                    <span>Dừng ghi âm ({recordingDuration}s)</span>
                                  </>
                                ) : (
                                  <>
                                    <Mic className="w-3.5 h-3.5" />
                                    <span>Bắt đầu ghi âm</span>
                                  </>
                                )}
                              </button>

                              <p className="text-[10px] text-muted-foreground">
                                Nhớ ấn nút cho phép truy cập microphone khi trình duyệt yêu cầu
                              </p>

                              {/* Waveform graphic */}
                              <div className="py-2 flex items-center justify-center gap-1 h-6">
                                {[12, 24, 38, 18, 30, 42, 22, 35, 16, 28, 40, 20, 32, 18].map((h, i) => (
                                  <span
                                    key={i}
                                    className={`w-1 rounded-full transition-all duration-150 ${
                                      isRecording ? "bg-destructive" : "bg-muted-foreground/30"
                                    }`}
                                    style={{
                                      height: `${Math.max(
                                        6,
                                        Math.min(24, isRecording ? volumeLevel * 0.3 + h * 0.3 : h * 0.4)
                                      )}px`,
                                    }}
                                  />
                                ))}
                              </div>

                              <span className="text-[10px] text-muted-foreground italic block">
                                Nói theo từ nghe được
                              </span>

                              {/* Player if user has recorded */}
                              {userAudioUrl && (
                                <div className="pt-2">
                                  <span className="text-[11px] font-semibold text-emerald-600 block mb-1">
                                    ✓ Đã thu âm ({recordingDuration}s)
                                  </span>
                                  <audio controls src={userAudioUrl} className="w-full h-8" />
                                </div>
                              )}
                            </div>

                            <div className="space-y-1 text-[10px] text-muted-foreground leading-relaxed">
                              <p>• Bấm để ghi âm, bấm lần nữa để dừng.</p>
                              <p>
                                • Bản ghi chỉ lưu trên thiết bị, trừ khi bạn bấm Phân tích bài nói — lúc đó audio
                                được gửi lên máy chủ để phân tích và không lưu lại.
                              </p>
                            </div>
                          </div>

                          {/* Tính năng dành cho Pro */}
                          <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center space-y-2">
                            <div className="w-8 h-8 mx-auto rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                              <Crown className="w-4 h-4" />
                            </div>
                            <h5 className="font-heading font-bold text-xs text-foreground">
                              Tính năng dành cho Pro
                            </h5>
                            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                              AI chấm phát âm dành cho thành viên Pro. Nâng cấp để mở khóa.
                            </p>
                            <Link
                              href="/pricing"
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs shadow-xs transition-colors"
                            >
                              <Crown className="w-3.5 h-3.5" />
                              <span>Nâng cấp Pro</span>
                            </Link>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Bottom Next Question Action (In Combo mode) */}
              {practiceType === "combo" && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={currentIndex === sentenceList.length - 1}
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    className="px-5 py-2 rounded-full bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <span>Câu tiếp theo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}
