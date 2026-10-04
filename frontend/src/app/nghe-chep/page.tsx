"use client";

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

interface DictationSentence {
  id: string | number;
  level: string;
  topic: string;
  originalText: string;
  hint?: string;
  audioTime: string;
}

const DEFAULT_SENTENCES: Record<string, DictationSentence[]> = {
  foundation: [
    {
      id: "f-1",
      level: "Level 1 - Foundation",
      topic: "Đề 24 - Part 1 - Bài 07",
      originalText: "Could you point me somewhere?",
      hint: "point / somewhere",
      audioTime: "00:02",
    },
    {
      id: "f-2",
      level: "Level 1 - Foundation",
      topic: "Đề 29 - Part 1 - Bài 12",
      originalText: "You've missed the bus, haven't you?",
      hint: "missed / haven't",
      audioTime: "00:03",
    },
    {
      id: "f-3",
      level: "Level 1 - Foundation",
      topic: "Đề 35 - Part 1 - Bài 12",
      originalText: "Please remind me they shouldn't keep the Monday morning meeting.",
      hint: "remind / shouldn't / morning",
      audioTime: "00:03",
    },
    {
      id: "f-4",
      level: "Level 1 - Foundation",
      topic: "Đề 30 - Part 1 - Bài 02",
      originalText: "Please make sure you hand in your assignments before noon.",
      hint: "hand in / assignments",
      audioTime: "00:04",
    },
    {
      id: "f-5",
      level: "Level 1 - Foundation",
      topic: "Đề 30 - Part 1 - Bài 03",
      originalText: "Could you tell me what time the flight departs tomorrow morning?",
      hint: "departs / tomorrow",
      audioTime: "00:04",
    },
  ],
  momentum: [
    {
      id: "m-1",
      level: "Level 2 - Momentum",
      topic: "Đề 14 - Part 2 - Bài 01",
      originalText: "The company announced substantial improvements in its annual environmental report.",
      hint: "substantial / environmental",
      audioTime: "00:06",
    },
    {
      id: "m-2",
      level: "Level 2 - Momentum",
      topic: "Đề 14 - Part 2 - Bài 02",
      originalText: "Most participants agreed that collaborative learning significantly enhances cognitive development.",
      hint: "collaborative / enhances",
      audioTime: "00:07",
    },
  ],
  mastery: [
    {
      id: "mas-1",
      level: "Level 3 - Mastery",
      topic: "Đề 05 - Part 3 - Bài 01",
      originalText: "From my vantage point, sustainable urban planning requires immediate integration of renewable energy grids.",
      hint: "sustainable / integration / renewable",
      audioTime: "00:09",
    },
  ],
};

export default function NgheChepPage() {
  const { isAuthenticated } = useAuth();

  // Navigation steps: "hub" | "setup" | "runner"
  const [step, setStep] = useState<"hub" | "setup" | "runner">("hub");

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

  // Runner state
  const [sentenceList, setSentenceList] = useState<DictationSentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [listenCount, setListenCount] = useState(1);
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
    permissionState,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const currentSentence = sentenceList[currentIndex] || sentenceList[0] || null;
  const sentenceWords = currentSentence ? currentSentence.originalText.split(" ") : [];
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
    setListenCount(1);
    setShowHint(false);
    setIsShadowingUnlocked(practiceType !== "combo");
    resetRecording();
  }, [currentIndex, currentSentence, difficulty, practiceType, resetRecording]);

  const [levelStats, setLevelStats] = useState<any[]>([]);

  useEffect(() => {
    async function fetchLevels() {
      try {
        const res = await api.dictation.getLevels();
        if (res.success && Array.isArray(res.data)) {
          setLevelStats(res.data);
        }
      } catch (err) {
        console.warn("Could not load dictation levels:", err);
      }
    }
    fetchLevels();
  }, [isAuthenticated]);

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
          setSentenceList(apiSentences);
          setCurrentIndex(0);
          setStep("runner");
          return;
        }
      }
    } catch (err) {
      console.warn("Using fallback dictation sentences:", err);
    }

    const list = DEFAULT_SENTENCES[selectedLevelId] || DEFAULT_SENTENCES.foundation;
    setSentenceList(list);
    setCurrentIndex(0);
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

  // Toggle ghi âm bài nói nhại
  const handleToggleRecord = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16 pb-16">
        <div className="section-container pt-6 md:pt-10 max-w-5xl mx-auto">
          {/* ========================================================================= */}
          {/* SCREEN 1: HUB / CHỌN KIỂU LUYỆN TẬP & LEVEL (Screenshot 3)                 */}
          {/* ========================================================================= */}
          {step === "hub" && (
            <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </Link>

              <div>
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                  Nghe chép &amp; nói nhại (Dictation &amp; Shadowing)
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Chọn kiểu luyện tập, rồi chọn level để bắt đầu
                </p>
              </div>

              {/* 3 Mode Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Nghe chép */}
                <button
                  type="button"
                  onClick={() => setPracticeType("dictation")}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    practiceType === "dictation"
                      ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/30"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Headphones className="w-5 h-5" />
                    </div>
                    {practiceType === "dictation" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
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
                      ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/30"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Mic className="w-5 h-5" />
                    </div>
                    {practiceType === "shadowing" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
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
                      ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/30"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    {practiceType === "combo" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
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
                    Ba cấp độ tăng dần theo độ khó bài thi thật
                  </p>
                </div>

                <div className="space-y-3">
                  <div
                    onClick={() => {
                      setSelectedLevelId("foundation");
                      setStep("setup");
                    }}
                    className="p-5 rounded-2xl border border-border bg-card shadow-xs hover:border-primary/50 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-heading font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        Level 1 - Foundation
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Câu ngắn, tốc độ chậm — dựng phản xạ (Listening câu 1 - 13)
                      </p>
                      <span className="text-[11px] text-muted-foreground font-mono mt-1 block">
                        355 bài · 1681 câu
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                  </div>

                  <div
                    onClick={() => {
                      setSelectedLevelId("momentum");
                      setStep("setup");
                    }}
                    className="p-5 rounded-2xl border border-border bg-card shadow-xs hover:border-primary/50 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-heading font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        Level 2 - Momentum
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Đoạn dài, nhiều thông tin — tập giữ mạch khi thông tin dồn dập (Listening câu 14)
                      </p>
                      <span className="text-[11px] text-muted-foreground font-mono mt-1 block">
                        34 bài · 364 câu
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                  </div>

                  <div
                    onClick={() => {
                      setSelectedLevelId("mastery");
                      setStep("setup");
                    }}
                    className="p-5 rounded-2xl border border-border bg-card shadow-xs hover:border-primary/50 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-heading font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        Level 3 - Mastery
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Hội thoại nêu quan điểm và bài nói học thuật khó (Listening câu 15 - 17)
                      </p>
                      <span className="text-[11px] text-muted-foreground font-mono mt-1 block">
                        133 bài · 1441 câu
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 2: THIẾT LẬP PHIÊN LUYỆN (Screenshot 4)                            */}
          {/* ========================================================================= */}
          {step === "setup" && (
            <div className="space-y-6 animate-in fade-in max-w-xl mx-auto">
              <button
                type="button"
                onClick={() => setStep("hub")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>

              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground">
                  Thiết lập phiên luyện
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedLevelId === "foundation"
                    ? "Level 1 - Foundation"
                    : selectedLevelId === "momentum"
                    ? "Level 2 - Momentum"
                    : "Level 3 - Mastery"}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
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
                            ? "bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white border-transparent shadow-xs"
                            : "bg-muted/40 text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {num} câu
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground block">Tốc độ phát</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[0.75, 1, 1.25].map((speed) => (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          playbackSpeed === speed
                            ? "bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white border-transparent shadow-xs"
                            : "bg-muted/40 text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground block">
                    Độ khó (số từ phải điền)
                  </label>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { id: "30", label: "Dễ: ẩn 30%" },
                      { id: "50", label: "Vừa: 50%" },
                      { id: "70", label: "Khó: 70%" },
                      { id: "100", label: "Chép hết: 100%" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDifficulty(item.id as any)}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all border truncate ${
                          difficulty === item.id
                            ? "bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white border-transparent shadow-xs"
                            : "bg-muted/40 text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

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
                            ? "bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white border-transparent shadow-xs"
                            : "bg-muted/40 text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Chỉ luyện bài chưa hoàn thành
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Ưu tiên những câu bạn chưa đạt điểm tối đa
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOnlyIncomplete(!onlyIncomplete)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      onlyIncomplete ? "bg-primary" : "bg-muted border border-border"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        onlyIncomplete ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleStartSession}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white font-bold text-sm shadow-md hover:brightness-110 transition-all"
                >
                  Bắt đầu
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 3: PRACTICE RUNNER (Screenshots 1, 2 & 5)                          */}
          {/* ========================================================================= */}
          {step === "runner" && currentSentence && (
            <div className="space-y-6 animate-in fade-in">
              {/* Top Header */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep("setup")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại</span>
                </button>

                <div className="text-center">
                  <span className="text-xs font-bold text-foreground block">
                    {currentSentence.topic}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                    {practiceType === "dictation" ? (
                      <>
                        <Headphones className="w-3 h-3 text-primary" />
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
                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Thoát</span>
                </button>
              </div>

              {/* Sub-header Navigation */}
              <div className="flex items-center justify-between px-2">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Câu trước</span>
                </button>

                <span className="text-xs font-mono font-bold text-foreground">
                  {currentIndex + 1} / {sentenceList.length}
                </span>

                <button
                  type="button"
                  disabled={currentIndex === sentenceList.length - 1}
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white text-xs font-bold hover:brightness-110 disabled:opacity-30 shadow-xs"
                >
                  <span>Câu tiếp theo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* MODE 1 & 2 & 3 CONTAINER */}
              <div
                className={
                  practiceType === "combo"
                    ? "grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
                    : "max-w-2xl mx-auto space-y-6"
                }
              >
                {/* Audio Player Component Helper */}
                {(() => {
                  const renderAudioPlayer = () => (
                    <div className="space-y-2">
                      <div className="p-3 rounded-2xl bg-muted/30 border border-border flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePlayAudio(playbackSpeed)}
                            className="w-10 h-10 rounded-full bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white flex items-center justify-center shadow-md hover:brightness-110 transition-all shrink-0"
                          >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePlayAudio(playbackSpeed)}
                            className="w-8 h-8 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground flex items-center justify-center transition-colors shrink-0"
                            title="Nghe lại"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Waveform representation */}
                        <div className="flex-1 flex items-center justify-center gap-1 h-6 overflow-hidden px-2">
                          {[16, 28, 44, 22, 35, 18, 50, 32, 20, 42, 26, 48, 16, 32, 24, 38, 18, 28].map((h, i) => (
                            <span
                              key={i}
                              className={`w-1 rounded-full transition-all duration-200 ${
                                isPlaying ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
                              }`}
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>

                        <span className="text-xs font-mono font-semibold text-muted-foreground shrink-0">
                          0:00 / {currentSentence.audioTime}
                        </span>
                      </div>

                      {/* Bottom row of player: listen count on left, speed pills on right */}
                      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
                        <span>
                          Đã nghe {listenCount}/{maxListens === "unlimited" ? "∞" : maxListens} lần
                        </span>
                        <div className="flex items-center gap-1">
                          {[0.75, 1, 1.25].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setPlaybackSpeed(s)}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors ${
                                playbackSpeed === s
                                  ? "bg-primary text-primary-foreground shadow-xs"
                                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
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
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                              <Headphones className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                NGHE VÀ ĐIỀN TỪ
                              </span>
                              <h4 className="text-sm font-bold text-foreground">Listen &amp; Fill</h4>
                            </div>
                          </div>

                          {/* Audio Player at top of Listen & Fill */}
                          {renderAudioPlayer()}

                          {/* Gap Fill Inputs */}
                          <div className="py-6 px-4 rounded-xl bg-card border border-border/80 text-center space-y-3">
                            <div className="text-sm md:text-base font-medium leading-loose flex flex-wrap items-center justify-center gap-1.5">
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
                                      className={`px-2 py-0.5 min-w-[60px] max-w-[110px] text-center border-b-2 bg-transparent text-sm md:text-base font-bold outline-none transition-colors ${
                                        isCorrect
                                          ? "border-emerald-500 text-emerald-600 bg-emerald-500/10 rounded"
                                          : isWrong
                                          ? "border-destructive text-destructive bg-destructive/10 rounded"
                                          : "border-foreground/40 focus:border-primary text-primary"
                                      }`}
                                    />
                                    {punctuation && <span className="text-foreground">{punctuation}</span>}
                                  </span>
                                );
                              })}
                            </div>

                            {checkStatus === "revealed" && (
                              <div className="mt-3 p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-center animate-in fade-in">
                                <span className="text-[11px] font-semibold text-muted-foreground block mb-0.5">
                                  Câu chuẩn:
                                </span>
                                <p className="text-xs font-bold text-primary">{currentSentence.originalText}</p>
                              </div>
                            )}

                            {showHint && currentSentence.hint && (
                              <p className="text-xs text-amber-600 mt-2 italic animate-in fade-in">
                                💡 Gợi ý: {currentSentence.hint}
                              </p>
                            )}
                          </div>

                          {/* Controls */}
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                            <span className="text-[10px] text-muted-foreground">
                              Nhấn phím Space để qua từ
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setShowHint(true)}
                                className="px-2.5 py-1 rounded-lg border border-border bg-card text-xs font-semibold flex items-center gap-1 hover:bg-muted transition-colors"
                              >
                                <HelpCircle className="w-3 h-3 text-amber-500" />
                                <span>Gợi ý</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleResetCurrent}
                                className="px-2.5 py-1 rounded-lg border border-border bg-card text-xs font-semibold flex items-center gap-1 hover:bg-muted transition-colors"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Làm lại</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleCheck}
                                className="px-3.5 py-1 rounded-lg bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white text-xs font-bold flex items-center gap-1 hover:brightness-110 shadow-xs transition-all"
                              >
                                <Check className="w-3 h-3" />
                                <span>Kiểm tra</span>
                              </button>
                            </div>
                          </div>

                          <div className="text-center pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setCheckStatus("revealed");
                                setIsShadowingUnlocked(true);
                              }}
                              className="text-[11px] text-muted-foreground hover:text-foreground underline decoration-dotted"
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
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
                          {/* In shadowing mode (Image 1): Top Audio Player */}
                          {practiceType === "shadowing" && renderAudioPlayer()}

                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                              <Mic className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                NGHE VÀ NÓI NHẠI
                              </span>
                              <h4 className="text-sm font-bold text-foreground">Listen &amp; Shadowing</h4>
                            </div>
                          </div>

                          {/* PRONUNCIATION SECTION */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                              PRONUNCIATION
                            </span>

                            {/* Locked state in combo mode if gap fill not completed */}
                            {practiceType === "combo" && !isShadowingUnlocked ? (
                              <div className="p-6 rounded-xl border border-dashed border-border bg-muted/20 text-center space-y-2">
                                <Lock className="w-5 h-5 mx-auto text-muted-foreground" />
                                <p className="text-xs font-semibold text-muted-foreground">
                                  Làm xong phần điền từ để mở phần luyện nói
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setIsShadowingUnlocked(true)}
                                  className="text-[11px] text-primary underline"
                                >
                                  (Hoặc mở khóa luyện nói ngay)
                                </button>
                              </div>
                            ) : (
                              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
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
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-primary transition-colors shadow-2xs"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
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

                            <div className="p-4 rounded-2xl bg-muted/30 border border-border text-center space-y-3">
                              <span className="text-xs text-muted-foreground font-medium block">
                                Thu âm câu nói của bạn
                              </span>

                              {/* Big Start Recording Button */}
                              <button
                                type="button"
                                onClick={handleToggleRecord}
                                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                                  isRecording
                                    ? "bg-destructive text-white animate-pulse"
                                    : "bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white hover:brightness-110"
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

                          {/* Tính năng dành cho Pro (Screenshots 1 & 2) */}
                          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center space-y-2">
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
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white font-bold text-xs shadow-xs hover:brightness-110"
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

              {/* Bottom Next Question Action (Especially in Combo mode like Screenshot 2) */}
              {practiceType === "combo" && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={currentIndex === sentenceList.length - 1}
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white text-xs font-bold hover:brightness-110 disabled:opacity-40 flex items-center gap-1.5 shadow-xs"
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
