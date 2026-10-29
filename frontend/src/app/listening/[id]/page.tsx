"use client";

import { useState, useEffect, Suspense, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { ExamExitConfirmModal } from "@/components/exam-exit-confirm-modal";
import {
  Headphones,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Eye,
  Flag,
  Menu,
  Info,
  ArrowUp,
  LogOut,
  X,
  Trophy,
  Sparkles,
  FileText,
  Languages,
  RefreshCw,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { DEFAULT_LISTENING_TEST, DEFAULT_LISTENING_TEST_2 } from "@/data/listening-benchmark";
import { ExamSyncStatus, ExamRecoveryBanner } from "@/components/exam-sync-status";

// Định nghĩa dữ liệu 4 Parts chuẩn Aptis Listening
interface Part1Item {
  id?: string;
  num: number;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  audioUrl?: string;
  transcript?: string;
  translation?: string;
}

interface Part2Speaker {
  id?: string;
  speaker: string;
  correctAnswer: string;
  explanation: string;
}

interface Part3Opinion {
  id?: string;
  statement: string;
  correctAnswer: "Man" | "Woman" | "Both";
  explanation: string;
}

interface Part4Question {
  id?: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Part4Recording {
  recNum: number;
  title: string;
  passageText: string;
  questions: Part4Question[];
  audioUrl?: string;
  translationText?: string;
}

export interface ListeningExamData {
  title: string;
  durationMinutes: number;
  part1: Part1Item[];
  part2: {
    topic?: string;
    prompt?: string;
    instructions?: string;
    options?: string[];
    speakers: Part2Speaker[];
    audioUrl?: string;
    passageText?: string;
    translationText?: string;
  };
  part3: {
    prompt?: string;
    topic?: string;
    instructions?: string;
    opinions: Part3Opinion[];
    audioUrl?: string;
    passageText?: string;
    translationText?: string;
  };
  part4: Part4Recording[];
}

// DEFAULT_LISTENING_TEST được import từ benchmark dataset chuẩn tại @/data/listening-benchmark



function ListeningExamRunnerContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = (params.id as string) || "";
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Review Mode URL parameters
  const submissionIdParam = searchParams ? searchParams.get("submissionId") : null;
  const modeParam = searchParams ? searchParams.get("mode") : null;
  const isReviewUrl = modeParam === "review" && Boolean(submissionIdParam);

  const [isReviewMode, setIsReviewMode] = useState(isReviewUrl);
  const [onlyShowWrong, setOnlyShowWrong] = useState(false);
  const [reviewFilterPart, setReviewFilterPart] = useState<"all" | 1 | 2 | 3 | 4>("all");
  const [isRestarting, setIsRestarting] = useState(false);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Chọn bộ đề benchmark phù hợp dựa trên ID đề (để không bị trùng đề)
  const initialBenchmark =
    examId.includes("2") || examId.includes("02")
      ? DEFAULT_LISTENING_TEST_2
      : DEFAULT_LISTENING_TEST;

  const [examData, setExamData] = useState<ListeningExamData>(initialBenchmark);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Stage Index (1 to 17 exercises total):
  // 0..12: Part 1 (13 questions)
  // 13: Part 2 (1 question with 4 speakers)
  // 14: Part 3 (1 question with 4 opinions)
  // 15: Part 4 Recording 1 (2 questions)
  // 16: Part 4 Recording 2 (2 questions)
  const [activeStage, setActiveStage] = useState(0);

  // Answers State:
  const [p1Answers, setP1Answers] = useState<Record<number, string>>({});
  const [p2Answers, setP2Answers] = useState<Record<number, string>>({});
  const [p3Answers, setP3Answers] = useState<Record<number, "Man" | "Woman" | "Both">>({});
  const [p4Answers, setP4Answers] = useState<Record<string, string>>({});

  // Audio Playback Controller
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCounts, setPlayCounts] = useState<Record<number, number>>({});
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [audioUrlMap, setAudioUrlMap] = useState<Record<number, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Timer & UI states
  const [timeLeft, setTimeLeft] = useState(40 * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSampleAnswers, setShowSampleAnswers] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error" | "resumed">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isResumedSession, setIsResumedSession] = useState(false);
  const [resumedBannerDismissed, setResumedBannerDismissed] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"all" | "p1" | "p2" | "p3" | "p4">("all");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("Lỗi âm thanh hoặc audio");
  const [reportNote, setReportNote] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [translationCache, setTranslationCache] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedTrans, setCopiedTrans] = useState(false);

  // Dynamic Stage definitions based on actually loaded questions in examData
  const listeningStages = useMemo(() => {
    const stages: Array<{
      id: string;
      partNum: 1 | 2 | 3 | 4;
      subIndex: number;
      title: string;
      label: string;
      audioUrl?: string;
    }> = [];

    // Part 1 questions
    examData.part1.forEach((q, idx) => {
      stages.push({
        id: `p1_${idx}`,
        partNum: 1,
        subIndex: idx,
        title: `Part 1 — Câu ${idx + 1}`,
        label: `Câu ${idx + 1}`,
        audioUrl: q.audioUrl || audioUrlMap[idx],
      });
    });

    // Part 2
    if (examData.part2.speakers && examData.part2.speakers.length > 0) {
      stages.push({
        id: "p2",
        partNum: 2,
        subIndex: 0,
        title: "Part 2 — Matching Info (4 Speakers)",
        label: "Part 2: 4 Speakers",
        audioUrl: (examData.part2 as any).audioUrl || audioUrlMap[13],
      });
    }

    // Part 3
    if (examData.part3.opinions && examData.part3.opinions.length > 0) {
      stages.push({
        id: "p3",
        partNum: 3,
        subIndex: 0,
        title: "Part 3 — Short Conversations (Opinions)",
        label: "Part 3: Opinions",
        audioUrl: (examData.part3 as any).audioUrl || audioUrlMap[14],
      });
    }

    // Part 4
    examData.part4.forEach((rec, idx) => {
      stages.push({
        id: `p4_${idx}`,
        partNum: 4,
        subIndex: idx,
        title: `Part 4 — Bài thuyết trình ${idx + 1}`,
        label: `Part 4: Rec ${idx + 1}`,
        audioUrl: rec.audioUrl || audioUrlMap[15 + idx],
      });
    });

    if (stages.length === 0) {
      const isP2 = examData.title.toLowerCase().includes("part 2") || (examData.part2 as any)?.speakers?.length > 0;
      const isP3 = examData.title.toLowerCase().includes("part 3") || (examData.part3 as any)?.opinions?.length > 0;
      const isP4 = examData.title.toLowerCase().includes("part 4") || examData.part4.length > 0;
      if (isP2) {
        stages.push({
          id: "p2",
          partNum: 2,
          subIndex: 0,
          title: "Part 2 — Matching Info (4 Speakers)",
          label: "Part 2: 4 Speakers",
          audioUrl: (examData.part2 as any).audioUrl || audioUrlMap[13],
        });
      } else if (isP3) {
        stages.push({
          id: "p3",
          partNum: 3,
          subIndex: 0,
          title: "Part 3 — Short Conversations (Opinions)",
          label: "Part 3: Opinions",
          audioUrl: (examData.part3 as any).audioUrl || audioUrlMap[14],
        });
      } else if (isP4) {
        stages.push({
          id: "p4_0",
          partNum: 4,
          subIndex: 0,
          title: "Part 4 — Bài thuyết trình 1",
          label: "Part 4: Rec 1",
          audioUrl: audioUrlMap[15],
        });
      } else {
        stages.push({
          id: "p1_0",
          partNum: 1,
          subIndex: 0,
          title: "Part 1 — Câu 1",
          label: "Câu 1",
        });
      }
    }

    return stages;
  }, [examData, audioUrlMap]);

  const safeStageIndex = activeStage < listeningStages.length ? activeStage : 0;
  const currentStage = listeningStages[safeStageIndex] || listeningStages[0];

  // Tự động điều chỉnh activeStage nếu vượt quá số stages thực tế
  useEffect(() => {
    if (activeStage >= listeningStages.length && listeningStages.length > 0) {
      setActiveStage(0);
    }
  }, [activeStage, listeningStages.length]);

  // Lấy Script và Bản dịch song song cho stage hiện tại
  const getCurrentBilingualData = () => {
    if (!currentStage) return null;
    if (currentStage.partNum === 2) {
      return {
        title: "Part 2 — Đoạn ghi âm 4 người nói",
        script:
          (examData.part2 as any).passageText ||
          examData.part2.speakers.map((s) => `${s.speaker}: "${s.correctAnswer}"`).join("\n\n"),
        translation: (examData.part2 as any).translationText || "",
      };
    } else if (currentStage.partNum === 3) {
      return {
        title: "Part 3 — Hội thoại thảo luận quan điểm",
        script:
          (examData.part3 as any).passageText ||
          examData.part3.opinions.map((o) => `• ${o.statement} (${o.correctAnswer})`).join("\n\n"),
        translation: (examData.part3 as any).translationText || "",
      };
    } else if (currentStage.partNum === 4) {
      const rec = examData.part4[currentStage.subIndex];
      return {
        title: `Part 4 — Bài thuyết trình ${currentStage.subIndex + 1}`,
        script: rec?.passageText || "",
        translation: rec?.translationText || "",
      };
    } else if (currentStage.partNum === 1) {
      const q = examData.part1[currentStage.subIndex];
      return {
        title: `Part 1 — Câu hỏi ${currentStage.subIndex + 1}`,
        script: q?.transcript || q?.prompt || "",
        translation: q?.translation || (q as any)?.translationText || "",
      };
    }
    return null;
  };

  // Flag ghi nhớ đã nhảy tới Part theo query param (tránh bị reset về Câu 1 khi học viên bấm Next)
  const hasHandledPartParam = useRef<string | null>(null);

  // Tự động nhảy tới Part nếu URL có ?part=p1 / p2 / p3 / p4 / 1 / 2 / 3 / 4 khi khởi tạo
  useEffect(() => {
    if (!searchParams || listeningStages.length === 0) return;
    const p = searchParams.get("part")?.toLowerCase();
    if (!p) return;
    if (hasHandledPartParam.current === p) return;

    let targetPart: 1 | 2 | 3 | 4 | null = null;
    if (p === "p1" || p === "1" || p === "part1") targetPart = 1;
    else if (p === "p2" || p === "2" || p === "part2") targetPart = 2;
    else if (p === "p3" || p === "3" || p === "part3") targetPart = 3;
    else if (p === "p4" || p === "4" || p === "part4") targetPart = 4;

    if (targetPart !== null) {
      const idx = listeningStages.findIndex((s) => s.partNum === targetPart);
      if (idx !== -1) {
        setActiveStage(idx);
        hasHandledPartParam.current = p;
      }
    }
  }, [searchParams, listeningStages]);

  // Tự động cuộn pill câu hỏi đang chọn vào giữa thanh điều hướng
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(`stage-pill-${activeStage}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeStage]);

  // 1. Phục hồi bản nháp LocalStorage ngay khi vào phòng thi Listening
  useEffect(() => {
    if (typeof window === "undefined" || !examId || isSubmitted) return;
    try {
      const raw = localStorage.getItem(`aptis_draft_listening_${examId}`);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.p1Answers) setP1Answers((prev) => ({ ...draft.p1Answers, ...prev }));
        if (draft.p2Answers) setP2Answers((prev) => ({ ...draft.p2Answers, ...prev }));
        if (draft.p3Answers) setP3Answers((prev) => ({ ...draft.p3Answers, ...prev }));
        if (draft.p4Answers) setP4Answers((prev) => ({ ...draft.p4Answers, ...prev }));
      }
    } catch {}
  }, [examId, isSubmitted]);

  // 2. Tự động ghi bản nháp vào LocalStorage khi câu trả lời thay đổi
  useEffect(() => {
    if (typeof window === "undefined" || !examId || isSubmitted) return;
    const hasAnswers =
      Object.keys(p1Answers).length > 0 ||
      Object.keys(p2Answers).length > 0 ||
      Object.keys(p3Answers).length > 0 ||
      Object.keys(p4Answers).length > 0;

    if (hasAnswers) {
      try {
        localStorage.setItem(
          `aptis_draft_listening_${examId}`,
          JSON.stringify({
            p1Answers,
            p2Answers,
            p3Answers,
            p4Answers,
            savedAt: new Date().toISOString(),
          })
        );
      } catch {}
    }
  }, [p1Answers, p2Answers, p3Answers, p4Answers, examId, isSubmitted]);

  // 3. Cảnh báo beforeunload & popstate chống vô tình F5/thoát trang khi đang thi
  useEffect(() => {
    if (isSubmitted) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Bạn đang làm bài thi Listening. Rời khỏi trang có thể làm gián đoạn bài làm!";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Bắt phím Back của trình duyệt để hiển thị modal xác nhận
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", window.location.href);
      const handlePopState = () => {
        setShowExitConfirm(true);
        window.history.pushState(null, "", window.location.href);
      };
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("popstate", handlePopState);
      };
    }

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSubmitted]);

  // 3b. Khôi phục cache bản dịch tiếng Việt từ LocalStorage
  useEffect(() => {
    if (typeof window === "undefined" || !examId) return;
    try {
      const raw = localStorage.getItem(`aptis_listening_trans_${examId}`);
      if (raw) {
        setTranslationCache(JSON.parse(raw));
      }
    } catch {}
  }, [examId]);

  // Tách phần transcript tiếng Anh và phần giải thích đáp án tiếng Việt (nếu có lẫn trong transcript)
  const parseBilingualContent = (rawText: string) => {
    if (!rawText) return { scriptEn: "", explanationVi: "" };
    const match = rawText.match(/(\n*---+\s*GIẢI THÍCH[\s\S]*)/i);
    if (match && match.index !== undefined) {
      return {
        scriptEn: rawText.slice(0, match.index).trim(),
        explanationVi: match[1].trim(),
      };
    }
    return {
      scriptEn: rawText.trim(),
      explanationVi: "",
    };
  };

  // Hàm tự động gọi AI dịch nghĩa script sang tiếng Việt
  const fetchBilingualTranslation = useCallback(
    async (stageIdx: number, force = false) => {
      const stageKey = `stage_${stageIdx}`;
      if (!force && translationCache[stageKey]) return translationCache[stageKey];

      const current = listeningStages[stageIdx];
      if (!current) return null;

      let rawScript = "";
      let staticTrans = "";
      if (current.partNum === 1) {
        const q = examData.part1[current.subIndex];
        rawScript = q?.transcript || q?.prompt || "";
        staticTrans = q?.translation || "";
      } else if (current.partNum === 2) {
        rawScript =
          (examData.part2 as any).passageText ||
          examData.part2.speakers.map((s) => `${s.speaker}: "${s.correctAnswer}"`).join("\n\n");
        staticTrans = (examData.part2 as any).translationText || "";
      } else if (current.partNum === 3) {
        rawScript =
          (examData.part3 as any).passageText ||
          examData.part3.opinions.map((o) => `• ${o.statement} (${o.correctAnswer})`).join("\n\n");
        staticTrans = (examData.part3 as any).translationText || "";
      } else if (current.partNum === 4) {
        const rec = examData.part4[current.subIndex];
        rawScript = rec?.passageText || "";
        staticTrans = rec?.translationText || "";
      }

      if (!force && staticTrans) {
        return staticTrans;
      }

      if (!rawScript || rawScript.trim().length < 5) return null;

      const { scriptEn, explanationVi } = parseBilingualContent(rawScript);
      if (!scriptEn) return null;

      setIsTranslating(true);
      try {
        const res = await api.vocabulary.translate(scriptEn);
        if (res.success && res.data?.translatedText) {
          const finalVi = explanationVi
            ? `${res.data.translatedText.trim()}\n\n${explanationVi}`
            : res.data.translatedText.trim();

          setTranslationCache((prev) => {
            const next = { ...prev, [stageKey]: finalVi };
            try {
              if (examId) {
                localStorage.setItem(`aptis_listening_trans_${examId}`, JSON.stringify(next));
              }
            } catch {}
            return next;
          });
          return finalVi;
        }
      } catch (err) {
        console.warn("[Listening] Auto translation error:", err);
      } finally {
        setIsTranslating(false);
      }
      return null;
    },
    [listeningStages, examData, translationCache, examId]
  );

  // Kích hoạt dịch tự động khi người dùng bật tab dịch hoặc chuyển câu hỏi
  useEffect(() => {
    if (!showTranslation) return;
    const stageKey = `stage_${activeStage}`;
    if (!translationCache[stageKey]) {
      fetchBilingualTranslation(activeStage);
    }
  }, [showTranslation, activeStage, fetchBilingualTranslation, translationCache]);

  const handleCopyTranslation = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedTrans(true);
      setTimeout(() => setCopiedTrans(false), 2000);
    }
  };

  // 4. Khởi tạo / Khôi phục phiên làm bài trên backend
  useEffect(() => {
    async function initSubmission() {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") || localStorage.getItem("token")
          : null;
      if (!token || !examId) return;

      // 4a. Khôi phục từ Lịch sử làm bài khi có ?mode=review&submissionId=...
      if (isReviewUrl && submissionIdParam) {
        try {
          const res = await api.submissions.getResult(submissionIdParam);
          if (res.success && res.data) {
            const sub = res.data;
            setSubmissionId(sub.id || submissionIdParam);
            setIsReviewMode(true);
            setIsSubmitted(false);

            let activeExam = examData;
            if (sub.exam) {
              const parsed = parseApiToListeningData(sub.exam);
              activeExam = parsed.exam;
              setExamData(parsed.exam);
              if (parsed.audioUrls && Object.keys(parsed.audioUrls).length > 0) {
                setAudioUrlMap((prev) => ({ ...prev, ...parsed.audioUrls }));
              }
            }

            if (sub.answers && Array.isArray(sub.answers)) {
              const p1: Record<number, string> = {};
              const p2: Record<number, string> = {};
              const p3: Record<number, any> = {};
              const p4: Record<string, string> = {};

              sub.answers.forEach((ans: any) => {
                const qId = ans.question_id || ans.questionId;
                const opt = ans.selected_option || ans.selectedOption;
                if (!opt) return;

                // Match câu hỏi Part 1
                activeExam.part1.forEach((item, idx) => {
                  if (item.id === qId) p1[idx] = opt;
                });
                // Match câu hỏi Part 2
                activeExam.part2.speakers.forEach((spk, idx) => {
                  if (spk.id === qId) p2[idx] = opt;
                });
                // Match câu hỏi Part 3
                activeExam.part3.opinions.forEach((opn, idx) => {
                  if (opn.id === qId) p3[idx] = opt;
                });
                // Match câu hỏi Part 4
                activeExam.part4.forEach((rec, recIdx) => {
                  rec.questions.forEach((q, qIdx) => {
                    if (q.id === qId) {
                      p4[`${recIdx}_${qIdx}`] = opt;
                    }
                  });
                });
              });

              setP1Answers(p1);
              setP2Answers(p2);
              setP3Answers(p3);
              setP4Answers(p4);
            }
          }
        } catch (e) {
          console.warn("Lỗi khi tải kết quả xem lại listening:", e);
        }
        return;
      }

      // 4b. Khởi tạo phiên thi bình thường hoặc khôi phục phiên đang thi
      if (submissionId) return;
      try {
        const res = await api.submissions.start(examId);
        if (res.success && res.data) {
          const subData = res.data;
          setSubmissionId(subData.submissionId || subData.id);
          if (subData.serverTimeRemaining !== undefined) {
            setTimeLeft(subData.serverTimeRemaining);
          }

          if (subData.isResumed) {
            setIsResumedSession(true);
            setSyncStatus("resumed");
            setTimeout(() => setSyncStatus("idle"), 4000);

            if (subData.savedAnswers && typeof subData.savedAnswers === "object") {
              const p1: Record<number, string> = {};
              const p2: Record<number, string> = {};
              const p3: Record<number, any> = {};
              const p4: Record<string, string> = {};

              Object.entries(subData.savedAnswers).forEach(([qId, ans]: [string, any]) => {
                if (ans.selectedOption) {
                  // match against parts
                  examData.part1.forEach((item, idx) => {
                    if (item.id === qId) p1[idx] = ans.selectedOption;
                  });
                  examData.part2.speakers.forEach((spk, idx) => {
                    if (spk.id === qId) p2[idx] = ans.selectedOption;
                  });
                  examData.part3.opinions.forEach((opn, idx) => {
                    if (opn.id === qId) p3[idx] = ans.selectedOption;
                  });
                  examData.part4.forEach((rec, recIdx) => {
                    rec.questions.forEach((q, qIdx) => {
                      if (q.id === qId) {
                        p4[`${recIdx}_${qIdx}`] = ans.selectedOption;
                      }
                    });
                  });
                }
              });

              setP1Answers((prev) => ({ ...p1, ...prev }));
              setP2Answers((prev) => ({ ...p2, ...prev }));
              setP3Answers((prev) => ({ ...p3, ...prev }));
              setP4Answers((prev) => ({ ...p4, ...prev }));
            }
          }
        }
      } catch (e) {
        console.warn("Offline listening session:", e);
      }
    }
    initSubmission();
  }, [examId, submissionId, isReviewUrl, submissionIdParam, examData]);

  // Load đề thi từ backend với bộ parser đầy đủ
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.exams.getQuestions(examId);
        if (res.success && res.data) {
          const apiExam = res.data;
          const parsed = parseApiToListeningData(apiExam);
          setExamData(parsed.exam);
          setAudioUrlMap(parsed.audioUrls);
          setTimeLeft((apiExam.duration_minutes || 40) * 60);
        } else {
          // Dùng benchmark tương ứng nếu backend chưa có đủ câu hỏi
          const fallback =
            examId.includes("2") || examId.includes("02")
              ? DEFAULT_LISTENING_TEST_2
              : DEFAULT_LISTENING_TEST;
          setExamData(fallback);
        }
      } catch (err) {
        console.warn("Using offline benchmark listening exam:", err);
        const fallback =
          examId.includes("2") || examId.includes("02")
            ? DEFAULT_LISTENING_TEST_2
            : DEFAULT_LISTENING_TEST;
        setExamData(fallback);
      } finally {
        setLoading(false);
      }
    }
    if (examId) load();
  }, [examId]);

  function extractTranscriptFromExplanation(rawExp?: string, explicitTranscript?: string): string {
    if (explicitTranscript && explicitTranscript.trim()) return explicitTranscript.trim();
    if (!rawExp) return "";
    if (rawExp.includes("--- GIẢI THÍCH ĐÁP ÁN ---")) {
      return rawExp.split("--- GIẢI THÍCH ĐÁP ÁN ---")[0].trim();
    }
    if (rawExp.length > 40 && !rawExp.toLowerCase().startsWith("đáp án chuẩn")) {
      return rawExp.trim();
    }
    return "";
  }

  // Trích xuất chủ đề (Topic) cho các phần Listening từ tiêu đề hoặc đề bài
  function extractListeningTopic(
    partTitle?: string,
    examTitle?: string,
    extraContent?: string,
    defaultTopic: string = "General Topic"
  ): string {
    const pTitle = (partTitle || "").trim();
    const eTitle = (examTitle || "").trim();
    const extra = (extraContent || "").trim();

    // 1. Dạng: Topic : ... trong tiêu đề part
    const pMatch = pTitle.match(/topic\s*[:\-–]\s*([^(\n\r<]+)/i);
    if (pMatch && pMatch[1].trim()) {
      return pMatch[1].trim().replace(/\s*-\s*(nam|nữ|nu|nam noi|nu noi|đề trộn|phiên bản|version).*$/i, "").trim();
    }

    // 2. Dạng: Topic : ... trong instructions hoặc passage_text hoặc explanation
    if (extra) {
      const extraMatch = extra.match(/topic\s*[:\-–]\s*([^(\n\r<]+)/i);
      if (extraMatch && extraMatch[1].trim()) {
        return extraMatch[1].trim().replace(/\s*-\s*(nam|nữ|nu|nam noi|nu noi|đề trộn|phiên bản|version).*$/i, "").trim();
      }
    }

    // 3. Dạng: Four people are talking about ... / discussing ... trong instructions
    if (extra) {
      const talkingMatch = extra.match(/(?:talking|discussing|speaking)\s+about\s+(?:their\s+|the\s+|how\s+)?([^.,\n\r<]+)/i);
      if (talkingMatch && talkingMatch[1].trim()) {
        const rawT = talkingMatch[1].trim();
        return rawT.replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }

    // 4. Dạng: Topic : ... trong tiêu đề exam
    const eMatch = eTitle.match(/topic\s*[:\-–]\s*([^(\n\r<]+)/i);
    if (eMatch && eMatch[1].trim()) {
      return eMatch[1].trim().replace(/\s*-\s*(nam|nữ|nu|nam noi|nu noi|đề trộn|phiên bản|version).*$/i, "").trim();
    }

    // 5. Tiêu đề exam cụ thể (ví dụ: "The Art", "Đề 14 - Doing exercise" -> "Doing exercise")
    // LOẠI TRỪ các chuỗi generic kiểu Full Listening / Full Test / 4 Parts / Aptis
    const isGenericExamTitle =
      /full\s*(listening|test|exam|part)/i.test(eTitle) ||
      /4\s*parts/i.test(eTitle) ||
      /kỳ\s*tích/i.test(eTitle) ||
      /aptis\s*esol/i.test(eTitle);

    if (eTitle && !isGenericExamTitle) {
      const cleanExam = eTitle.replace(/^Đề\s*\d+\s*[-:—–]*\s*/i, "").trim();
      if (cleanExam.length > 2 && !/full\s*listening/i.test(cleanExam)) return cleanExam;
    }

    // 6. Tiêu đề part sau dấu gạch nối (loại trừ các tên dạng kỹ thuật)
    const cleanPart = pTitle.replace(/^.*part\s*\d+\s*[-:—–]*\s*/i, "").trim();
    if (
      cleanPart &&
      !/matching/i.test(cleanPart) &&
      !/comprehension/i.test(cleanPart) &&
      !/monologue/i.test(cleanPart) &&
      !/information/i.test(cleanPart) &&
      !/opinion/i.test(cleanPart) &&
      !/recognition/i.test(cleanPart) &&
      !/part\s*\d+/i.test(cleanPart)
    ) {
      return cleanPart;
    }

    return defaultTopic;
  }


  // Parser dữ liệu từ Backend sang format hiển thị của Listening
  function parseApiToListeningData(apiData: any) {
    const parts = apiData.parts || [];
    const isSinglePart = parts.length === 1;

    const result = {
      title: apiData.title || "Bài thi Listening",
      durationMinutes: apiData.duration_minutes || (isSinglePart ? 15 : 40),
      part1: [] as any[],
      part2: {
        topic: "Workplace & Daily Life",
        instructions: "Four employees share their views. Match each speaker to their statement.",
        options: [] as string[],
        speakers: [] as any[],
        passageText: "",
        translationText: "",
        audioUrl: "",
      },
      part3: {
        topic: "Discussion & Opinions",
        instructions: "Who expresses which opinion? Select Man, Woman, or Both.",
        passageText: "",
        translationText: "",
        opinions: [] as any[],
        audioUrl: "",
      },
      part4: [] as any[],
    };

    const audioUrls: Record<number, string> = {};

    parts.forEach((p: any) => {
      const pTitle = (p.title || "").toLowerCase();
      const pNum = p.part_number;
      const questions = p.questions || [];

      // Phân định chính xác Part: Ưu tiên p.partType từ Backend DTO
      let detectedPart = pNum;
      if (p.partType === "PART_4" || pTitle.includes("part 4") || pTitle.includes("monologue") || pTitle.includes("recording")) {
        detectedPart = 4;
      } else if (p.partType === "PART_3" || pTitle.includes("part 3") || pTitle.includes("opinion matching") || pTitle.includes("short conversation") || pTitle.includes("discussion")) {
        detectedPart = 3;
      } else if (p.partType === "PART_2" || pTitle.includes("part 2") || pTitle.includes("information matching") || pTitle.includes("speaker")) {
        detectedPart = 2;
      } else if (p.partType === "PART_1" || pTitle.includes("part 1") || pTitle.includes("information recognition") || pTitle.includes("word recognition")) {
        detectedPart = 1;
      }

      // Part 1: Word Recognition
      if (detectedPart === 1) {
        if (questions.length > 0) {
          result.part1 = questions.map((q: any, idx: number) => {
            let opts: string[] = ["A", "B", "C"];
            if (Array.isArray(q.options)) opts = q.options;
            else if (typeof q.options === "string") {
              try {
                opts = JSON.parse(q.options);
              } catch {
                opts = ["A", "B", "C"];
              }
            }
            const rawAudio = q.audio_url || q.audioUrl || q.file || p.audio_url || "";
            const resolvedAudio = rawAudio && !rawAudio.startsWith("http") && !rawAudio.startsWith("/")
              ? `/uploads/audio/listening/${rawAudio}`
              : rawAudio;
            if (resolvedAudio) audioUrls[idx] = resolvedAudio;
            const qTranscript = extractTranscriptFromExplanation(
              q.explanation,
              q.transcript || q.suggestion || q.passage_text
            );
            return {
              id: q.id,
              num: q.question_number || idx + 1,
              prompt: q.prompt,
              options: opts,
              correctAnswer: q.correct_answer || "",
              explanation: q.explanation || "Đáp án chuẩn theo đoạn ghi âm đối thoại.",
              audioUrl: resolvedAudio,
              transcript: qTranscript,
              translation: q.translation_text || q.translation || "",
            };
          });
        }
      }

      // Part 2: Speakers matching
      if (detectedPart === 2) {
        const p2Topic = (p as any).topic || p.topic || p.partSubtitle || extractListeningTopic(p.title, apiData.title, p.instructions || p.passage_text, "Workplace & Daily Life Views");
        result.part2.topic = p2Topic;

        const p2Candidate = questions.find((q: any) => q.explanation || q.transcript);
        const p2Script = extractTranscriptFromExplanation(
          p2Candidate?.explanation,
          p.passage_text || p.transcript || p2Candidate?.transcript || p.suggestion
        );
        if (p2Script) {
          (result.part2 as any).passageText = p2Script;
          (result.part2 as any).transcript = p2Script;
        }
        if (p.translation_text || p.passage_translation) (result.part2 as any).translationText = p.translation_text || p.passage_translation;
        const p2RawAudio = p.audio_url || (p as any).file || "";
        const resolvedP2Audio = p2RawAudio && !p2RawAudio.startsWith("http") && !p2RawAudio.startsWith("/")
          ? `/uploads/audio/listening/${p2RawAudio}`
          : p2RawAudio;
        if (resolvedP2Audio) {
          (result.part2 as any).audioUrl = resolvedP2Audio;
          audioUrls[13] = resolvedP2Audio;
        }

        if (questions.length > 0) {
          let extractedOptions: string[] = [];
          for (const q of questions) {
            let qOpts: string[] = [];
            if (Array.isArray(q.options)) qOpts = q.options;
            else if (typeof q.options === "string") {
              try { qOpts = JSON.parse(q.options); } catch {}
            }
            if (qOpts.length > 0) {
              extractedOptions = Array.from(new Set([...extractedOptions, ...qOpts]));
            }
          }
          extractedOptions = extractedOptions
            .map((o) => o.trim())
            .filter((o) => o && !/sẽ có thêm|gây nhiễu|đáp án nhiễu/i.test(o) && !/^[0-9a-f-]{30,}$/i.test(o));

          // Thu thập toàn bộ văn bản từ explanation, suggestion, passage_text, instructions, title để bóc tách đáp án
          const allSourceText = [
            ...questions.map((q: any) => q.explanation || ""),
            p.suggestion || "",
            p.passage_text || "",
            p.instructions || "",
            p.title || "",
          ].join("\n");

          const cleanText = allSourceText
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/p>/gi, "\n")
            .replace(/<[^>]*>/g, " ")
            .replace(/&nbsp;/gi, " ");

          const explAnswerMap: Record<string, string> = {};

          // Dạng A: / A. / A - / Speaker A:
          const letterMatches = cleanText.matchAll(/(?:Speaker\s*)?([A-D])\s*[:.\-=–]\s*([^\n\r]+)/gi);
          for (const m of letterMatches) {
            const letter = m[1].toUpperCase();
            const val = m[2].trim().replace(/^["']|["']$/g, "").replace(/[.,;]$/, "").trim();
            if (val && !/topic|version|phiên bản|đáp án/i.test(val) && !explAnswerMap[letter]) {
              explAnswerMap[letter] = val;
            }
          }

          // Dạng 1. / 2. / 3. / 4.
          const numMatches = cleanText.matchAll(/(?:^|\n)\s*([1-4])\s*[:.\-=–]\s*([^\n\r]+)/gi);
          const numToLetter: Record<string, string> = { "1": "A", "2": "B", "3": "C", "4": "D" };
          for (const m of numMatches) {
            const letter = numToLetter[m[1]];
            const val = m[2].trim().replace(/^["']|["']$/g, "").replace(/[.,;]$/, "").trim();
            if (val && !explAnswerMap[letter]) {
              explAnswerMap[letter] = val;
            }
          }

          // Khớp với extractedOptions để chuẩn hóa chính xác hoa/thường và khoảng trắng
          for (const [letter, val] of Object.entries(explAnswerMap)) {
            const matchedOpt = extractedOptions.find(
              (o) =>
                o.toLowerCase().trim() === val.toLowerCase().trim() ||
                o.toLowerCase().includes(val.toLowerCase()) ||
                val.toLowerCase().includes(o.toLowerCase())
            );
            if (matchedOpt) {
              explAnswerMap[letter] = matchedOpt;
            }
          }

          const spkList = questions.map((q: any, idx: number) => {
            const letter = String.fromCharCode(65 + idx);
            let ans = (q.correct_answer || "").trim();

            if (/^\d+$/.test(ans)) {
              const num = Number(ans);
              if (extractedOptions[num]) ans = extractedOptions[num];
            } else if (ans.length > 20 || /^[0-9a-f-]{30,}$/i.test(ans) || !ans) {
              if (explAnswerMap[letter]) ans = explAnswerMap[letter];
              else if (extractedOptions[idx]) ans = extractedOptions[idx];
            }

            return {
              id: q.id,
              speaker: q.prompt && isNaN(Number(q.prompt)) && !q.prompt.startsWith("<p>") ? q.prompt : `Speaker ${letter}`,
              correctAnswer: ans,
              explanation: q.explanation || `Giải thích đáp án cho Speaker ${letter}`,
              transcript: q.transcript || p2Script || "",
            };
          });

          result.part2.speakers = spkList;
          const finalOptions = Array.from(
            new Set([
              ...extractedOptions,
              ...Object.values(explAnswerMap),
              ...spkList.map((s: any) => s.correctAnswer),
            ])
          ).filter((o) => o && !/^[0-9a-f-]{30,}$/i.test(o) && !/sẽ có thêm|gây nhiễu/i.test(o));

          result.part2.options = finalOptions.length >= 4 ? finalOptions : (result.part2.options || finalOptions);
          if (p.instructions) result.part2.instructions = p.instructions;
        }
      }

      // Part 3: Opinion discussion
      if (detectedPart === 3) {
        const p3Topic = (p as any).topic || p.topic || p.partSubtitle || extractListeningTopic(p.title, apiData.title, p.instructions || p.passage_text, "Discussion & Perspectives");
        result.part3.topic = p3Topic;

        const p3Candidate = questions.find((q: any) => q.explanation || q.transcript);
        const p3Script = extractTranscriptFromExplanation(
          p3Candidate?.explanation,
          p.passage_text || p.transcript || p3Candidate?.transcript || p.suggestion
        );
        if (p3Script) {
          (result.part3 as any).passageText = p3Script;
          (result.part3 as any).transcript = p3Script;
        }
        if (p.translation_text || p.passage_translation) (result.part3 as any).translationText = p.translation_text || p.passage_translation;
        const p3RawAudio = p.audio_url || (p as any).file || "";
        const resolvedP3Audio = p3RawAudio && !p3RawAudio.startsWith("http") && !p3RawAudio.startsWith("/")
          ? `/uploads/audio/listening/${p3RawAudio}`
          : p3RawAudio;
        if (resolvedP3Audio) {
          (result.part3 as any).audioUrl = resolvedP3Audio;
          audioUrls[14] = resolvedP3Audio;
        }
        if (questions.length > 0) {
          const opList = questions.map((q: any) => {
            let cor: "Man" | "Woman" | "Both" = "Both";
            const corStr = String(q.correct_answer || "").toLowerCase();
            if (corStr.includes("man") && !corStr.includes("woman")) cor = "Man";
            else if (corStr.includes("woman")) cor = "Woman";
            return {
              id: q.id,
              statement: q.prompt,
              correctAnswer: cor,
              explanation: q.explanation || "",
              transcript: q.transcript || p3Script || "",
            };
          });
          result.part3.opinions = opList;
          if (p.instructions) result.part3.instructions = p.instructions;
        }
      }

      // Part 4: Monologues
      if (detectedPart === 4) {
        const p4BaseTopic = (p as any).topic || p.topic || p.partSubtitle || extractListeningTopic(p.title, apiData.title, p.instructions || p.passage_text, "Lectures & Public Announcements");

        if (questions.length > 0) {
          const qList = questions.map((q: any) => {
            let opts: string[] = [];
            if (Array.isArray(q.options)) opts = q.options;
            else if (typeof q.options === "string") {
              try {
                opts = JSON.parse(q.options);
              } catch {
                opts = ["A", "B", "C"];
              }
            }
            return {
              id: q.id,
              prompt: q.prompt,
              options: opts,
              correctAnswer: q.correct_answer || "",
              explanation: q.explanation || "",
              transcript: q.transcript || "",
            };
          });

          const recordings: any[] = [];
          if (qList.length > 2) {
            const p4RawAudio = p.audio_url || (p as any).file || "";
            const resolvedP4Audio = p4RawAudio && !p4RawAudio.startsWith("http") && !p4RawAudio.startsWith("/")
              ? `/uploads/audio/listening/${p4RawAudio}`
              : p4RawAudio;
            const q1Candidate = questions.slice(0, 2).find((q: any) => q.explanation || q.transcript);
            const q2Candidate = questions.slice(2, 4).find((q: any) => q.explanation || q.transcript);
            const p4Script1 = extractTranscriptFromExplanation(
              q1Candidate?.explanation,
              p.passage_text || p.transcript || q1Candidate?.transcript || p.suggestion
            );
            const p4Script2 = extractTranscriptFromExplanation(
              q2Candidate?.explanation,
              p.passage_text || p.transcript || q2Candidate?.transcript || p.suggestion
            );
            recordings.push({
              recNum: 1,
              title: `${p4BaseTopic} (Recording 1/2)`,
              passageText: p4Script1,
              transcript: p4Script1,
              translationText: p.translation_text || p.passage_translation || "",
              audioUrl: resolvedP4Audio,
              questions: qList.slice(0, 2),
            });
            recordings.push({
              recNum: 2,
              title: `${p4BaseTopic} (Recording 2/2)`,
              passageText: p4Script2 || p4Script1,
              transcript: p4Script2 || p4Script1,
              translationText: p.translation_text || p.passage_translation || "",
              audioUrl: resolvedP4Audio,
              questions: qList.slice(2, 4),
            });
            if (resolvedP4Audio) {
              audioUrls[15] = resolvedP4Audio;
              audioUrls[16] = resolvedP4Audio;
            }
          } else {
            recordings.push({
              recNum: 1,
              title: `${p4BaseTopic} (Recording 1)`,
              passageText: p.passage_text || "",
              transcript: p.transcript || p.passage_text || "",
              translationText: p.translation_text || p.passage_translation || "",
              audioUrl: p.audio_url || "",
              questions: qList,
            });
            if (p.audio_url) audioUrls[15] = p.audio_url;
          }
          result.part4 = recordings;
        }
      }
    });

    return { exam: result, audioUrls };
  }

  // Timer đếm ngược thời gian phòng thi
  useEffect(() => {
    if (loading || isPaused || isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, isPaused, isSubmitted]);

  // Lấy nội dung văn bản kịch bản cho stage hiện tại (phục vụ SpeechSynthesis khi không có file âm thanh tĩnh)
  const getCurrentStageScript = () => {
    if (!currentStage) return "";
    if (currentStage.partNum === 1) {
      const q = examData.part1[currentStage.subIndex];
      return q?.transcript || "";
    } else if (currentStage.partNum === 2) {
      return (
        (examData.part2 as any).transcript ||
        (examData.part2 as any).passageText ||
        ""
      );
    } else if (currentStage.partNum === 3) {
      return (
        (examData.part3 as any).transcript ||
        (examData.part3 as any).passageText ||
        ""
      );
    } else if (currentStage.partNum === 4) {
      const rec = examData.part4[currentStage.subIndex];
      return (rec as any)?.transcript || rec?.passageText || "";
    }
    return "";
  };

  // Reset audio state khi chuyển câu hỏi
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setPlaybackProgress(0);
  }, [activeStage]);

  // Trình phát âm thanh tích hợp: Ưu tiên phát file Audio -> Fallback SpeechSynthesis chuẩn giọng Anh-Mỹ
  const togglePlayAudio = () => {
    const currentCount = playCounts[activeStage] || 0;
    if (currentCount >= 2 && !isPlaying) {
      alert("Bạn đã nghe tối đa 2 lần cho đoạn ghi âm này theo quy chế khảo thí Aptis!");
      return;
    }

    if (isPlaying) {
      // Dừng âm thanh
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    const playSpeechFallback = (count: number) => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const scriptText = getCurrentStageScript();
        if (!scriptText) {
          setIsPlaying(false);
          return;
        }

        // ĐỐI VỚI PART 3: PHÁT 2 GIỌNG ĐỐI THOẠI (NAM & NỮ)
        if (currentStage?.partNum === 3) {
          const rawLines = scriptText
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/p>/gi, "\n")
            .replace(/<[^>]*>/g, "")
            .replace(/&nbsp;/gi, " ")
            .split(/\n+/)
            .map((l: string) => l.trim())
            .filter(Boolean);

          const voices = window.speechSynthesis.getVoices();
          const maleVoice =
            voices.find((v) => v.lang.startsWith("en") && /male|david|george|ryan|james|guy|daniel/i.test(v.name)) ||
            voices.find((v) => v.lang.startsWith("en"));
          const femaleVoice =
            voices.find((v) => v.lang.startsWith("en") && /female|zira|susan|sonia|jenny|victoria|catherine|karen/i.test(v.name)) ||
            voices.find((v) => v.lang.startsWith("en") && v !== maleVoice);

          let currentIdx = 0;
          setIsPlaying(true);
          setPlayCounts((prev) => ({ ...prev, [activeStage]: count + 1 }));

          const playNextDialogueLine = () => {
            if (currentIdx >= rawLines.length) {
              setIsPlaying(false);
              setPlaybackProgress(100);
              return;
            }
            const line = rawLines[currentIdx];
            const isFemale =
              /^woman\s*[:.\-]/i.test(line) ||
              /^[wW]\s*[:.\-]/i.test(line) ||
              /^nữ\s*[:.\-]/i.test(line) ||
              (!/^(man|m|nam)\s*[:.\-]/i.test(line) && currentIdx % 2 === 1);

            const cleanLine = line.replace(/^(man|woman|narrator|m|w|nam|nữ)\s*[:.\-]\s*/i, "").trim();

            const utt = new SpeechSynthesisUtterance(cleanLine || line);
            utt.lang = "en-GB";
            utt.rate = playbackSpeed;
            if (isFemale) {
              if (femaleVoice) utt.voice = femaleVoice;
              utt.pitch = 1.3; // Giọng Nữ cao, thanh thoát
            } else {
              if (maleVoice) utt.voice = maleVoice;
              utt.pitch = 0.8; // Giọng Nam trầm, ấm
            }

            utt.onend = () => {
              currentIdx++;
              setPlaybackProgress(Math.min(100, Math.round((currentIdx / rawLines.length) * 100)));
              playNextDialogueLine();
            };
            utt.onerror = () => {
              setIsPlaying(false);
            };

            window.speechSynthesis.speak(utt);
          };

          playNextDialogueLine();
          return;
        }

        // CÁC PART KHÁC (1, 2, 4): Phát thông thường
        const utterance = new SpeechSynthesisUtterance(scriptText);
        utterance.lang = "en-GB"; // Chuẩn giọng Anh British Council
        utterance.rate = playbackSpeed;

        const estDurationSec = Math.max(8, scriptText.split(" ").length / 2.5);
        let elapsed = 0;

        utterance.onstart = () => {
          setIsPlaying(true);
          setPlayCounts((prev) => ({ ...prev, [activeStage]: count + 1 }));
        };

        const progressTimer = setInterval(() => {
          elapsed += 0.5;
          const pct = Math.min(100, Math.round((elapsed / estDurationSec) * 100));
          setPlaybackProgress(pct);
          if (pct >= 100) clearInterval(progressTimer);
        }, 500);

        utterance.onend = () => {
          setIsPlaying(false);
          setPlaybackProgress(100);
          clearInterval(progressTimer);
        };

        utterance.onerror = () => {
          setIsPlaying(false);
          clearInterval(progressTimer);
        };

        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlaying(true);
        setPlayCounts((prev) => ({ ...prev, [activeStage]: count + 1 }));
      }
    };

    // Bắt đầu phát âm thanh
    const targetAudioSrc = currentStage?.audioUrl || audioUrlMap[activeStage];

    if (targetAudioSrc && audioRef.current) {
      audioRef.current.src = targetAudioSrc;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setPlayCounts((prev) => ({ ...prev, [activeStage]: currentCount + 1 }));
        })
        .catch((err) => {
          console.warn("Audio file playback error, falling back to Web Speech API:", err);
          playSpeechFallback(currentCount);
        });
      return;
    }

    // Nếu không có file audio: Dùng giọng nói tiếng Anh trình duyệt (SpeechSynthesis)
    playSpeechFallback(currentCount);
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackSpeed(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `00:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // TÍNH ĐIỂM CHUẨN DỰA TRÊN SỐ CÂU HỎI THỰC TẾ
  const calculateResults = () => {
    let p1Correct = 0;
    examData.part1.forEach((q, idx) => {
      if (p1Answers[idx] && p1Answers[idx].toLowerCase() === q.correctAnswer.toLowerCase()) p1Correct++;
    });

    let p2Correct = 0;
    examData.part2.speakers.forEach((s, idx) => {
      if (p2Answers[idx] && p2Answers[idx].toLowerCase() === s.correctAnswer.toLowerCase()) p2Correct++;
    });

    let p3Correct = 0;
    examData.part3.opinions.forEach((o, idx) => {
      if (p3Answers[idx] && p3Answers[idx].toLowerCase() === o.correctAnswer.toLowerCase()) p3Correct++;
    });

    let p4Correct = 0;
    examData.part4.forEach((rec, recIdx) => {
      rec.questions.forEach((q, qIdx) => {
        if (p4Answers[`${recIdx}_${qIdx}`] && p4Answers[`${recIdx}_${qIdx}`].toLowerCase() === q.correctAnswer.toLowerCase()) {
          p4Correct++;
        }
      });
    });

    const totalQuestionsInExam =
      examData.part1.length +
      examData.part2.speakers.length +
      examData.part3.opinions.length +
      examData.part4.reduce((sum, r) => sum + r.questions.length, 0);

    const totalCorrect = p1Correct + p2Correct + p3Correct + p4Correct;
    const isFullListeningTest = totalQuestionsInExam >= 20;

    const totalScore = isFullListeningTest
      ? totalCorrect * 2
      : totalQuestionsInExam > 0
      ? Math.round((totalCorrect / totalQuestionsInExam) * 50)
      : 0;

    let cefr = "A0";
    if (totalScore >= 46) cefr = "C";
    else if (totalScore >= 38) cefr = "B2";
    else if (totalScore >= 28) cefr = "B1";
    else if (totalScore >= 18) cefr = "A2";
    else if (totalScore >= 10) cefr = "A1";

    const maxScore = isFullListeningTest ? 50 : (totalQuestionsInExam * 2 > 0 ? totalQuestionsInExam * 2 : 50);

    return {
      p1Correct,
      p1Score: isFullListeningTest ? p1Correct * 2 : examData.part1.length > 0 ? Math.round((p1Correct / examData.part1.length) * 50) : 0,
      p2Correct,
      p2Score: isFullListeningTest ? p2Correct * 2 : examData.part2.speakers.length > 0 ? Math.round((p2Correct / examData.part2.speakers.length) * 50) : 0,
      p3Correct,
      p3Score: isFullListeningTest ? p3Correct * 2 : examData.part3.opinions.length > 0 ? Math.round((p3Correct / examData.part3.opinions.length) * 50) : 0,
      p4Correct,
      p4Score: isFullListeningTest ? p4Correct * 2 : Math.round((p4Correct / Math.max(1, examData.part4.reduce((s, r) => s + r.questions.length, 0))) * 50),
      totalCorrect,
      totalScore,
      maxScore,
      totalQuestionsInExam,
      cefr,
    };
  };

  const results = calculateResults();

  // Helper tính kết quả từng stage/câu hỏi phục vụ Mục lục xem lại
  const getStageResult = (stageIdx: number) => {
    const stage = listeningStages[stageIdx];
    if (!stage) return { isCorrect: false, score: 0, total: 1, label: `Câu ${stageIdx + 1}` };

    if (stage.partNum === 1) {
      const q = examData.part1[stage.subIndex];
      const ans = p1Answers[stage.subIndex];
      const isCorrect = Boolean(ans && q && ans.toLowerCase() === q.correctAnswer.toLowerCase());
      return { isCorrect, score: isCorrect ? 1 : 0, total: 1, label: `Câu ${stage.subIndex + 1}` };
    } else if (stage.partNum === 2) {
      let cor = 0;
      examData.part2.speakers.forEach((s, idx) => {
        if (p2Answers[idx] && s.correctAnswer && p2Answers[idx].toLowerCase() === s.correctAnswer.toLowerCase()) cor++;
      });
      const total = examData.part2.speakers.length || 4;
      return { isCorrect: cor === total && total > 0, score: cor, total, label: "Part 2" };
    } else if (stage.partNum === 3) {
      let cor = 0;
      examData.part3.opinions.forEach((o, idx) => {
        if (p3Answers[idx] && o.correctAnswer && p3Answers[idx].toLowerCase() === o.correctAnswer.toLowerCase()) cor++;
      });
      const total = examData.part3.opinions.length || 4;
      return { isCorrect: cor === total && total > 0, score: cor, total, label: "Part 3" };
    } else {
      const rec = examData.part4[stage.subIndex];
      let cor = 0;
      const total = rec?.questions?.length || 2;
      rec?.questions?.forEach((q, qIdx) => {
        const k = `${stage.subIndex}_${qIdx}`;
        if (p4Answers[k] && q.correctAnswer && p4Answers[k].toLowerCase() === q.correctAnswer.toLowerCase()) cor++;
      });
      return { isCorrect: cor === total && total > 0, score: cor, total, label: `P4.${stage.subIndex + 1}` };
    }
  };

  // Tự động lưu nháp (Autosave ngầm) lên backend
  const performAutosave = useCallback(async (answers: { p1: any; p2: any; p3: any; p4: any }) => {
    if (!submissionId || isSubmitted || isReviewMode) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || localStorage.getItem("token") : null;
    if (!token) return;

    const answersPayload: any[] = [];
    examData.part1.forEach((q: any, idx: number) => {
      if (q.id && answers.p1[idx]) {
        answersPayload.push({ questionId: String(q.id), selectedOption: answers.p1[idx] });
      }
    });
    examData.part2.speakers.forEach((s: any, idx: number) => {
      if (s.id && answers.p2[idx]) {
        answersPayload.push({ questionId: String(s.id), selectedOption: answers.p2[idx] });
      }
    });
    examData.part3.opinions.forEach((o: any, idx: number) => {
      if (o.id && answers.p3[idx]) {
        answersPayload.push({ questionId: String(o.id), selectedOption: answers.p3[idx] });
      }
    });
    examData.part4.forEach((rec: any, recIdx: number) => {
      rec.questions.forEach((q: any, qIdx: number) => {
        const k = `${recIdx}_${qIdx}`;
        if (q.id && answers.p4[k]) {
          answersPayload.push({ questionId: String(q.id), selectedOption: answers.p4[k] });
        }
      });
    });

    if (answersPayload.length === 0) return;

    try {
      setSyncStatus("saving");
      await api.submissions.autosave(submissionId, answersPayload);
      setSyncStatus("saved");
      setLastSavedAt(new Date());
      setTimeout(() => setSyncStatus("idle"), 2500);
    } catch (e) {
      console.warn("Autosave listening error:", e);
      setSyncStatus("error");
    }
  }, [submissionId, isSubmitted, isReviewMode, examData]);

  const scheduleAutosave = useCallback((nextAnswers: { p1: any; p2: any; p3: any; p4: any }) => {
    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = setTimeout(() => {
      performAutosave(nextAnswers);
    }, 2500);
  }, [performAutosave]);

  // Handlers chọn đáp án có gắn autosave
  const handleP1Answer = (idx: number, opt: string) => {
    if (isReviewMode) return;
    const next = { ...p1Answers, [idx]: opt };
    setP1Answers(next);
    scheduleAutosave({ p1: next, p2: p2Answers, p3: p3Answers, p4: p4Answers });
  };

  const handleP2Answer = (idx: number, opt: string) => {
    if (isReviewMode) return;
    const next = { ...p2Answers, [idx]: opt };
    setP2Answers(next);
    scheduleAutosave({ p1: p1Answers, p2: next, p3: p3Answers, p4: p4Answers });
  };

  const handleP3Answer = (idx: number, opt: "Man" | "Woman" | "Both") => {
    if (isReviewMode) return;
    const next = { ...p3Answers, [idx]: opt };
    setP3Answers(next);
    scheduleAutosave({ p1: p1Answers, p2: p2Answers, p3: next, p4: p4Answers });
  };

  const handleP4Answer = (key: string, opt: string) => {
    if (isReviewMode) return;
    const next = { ...p4Answers, [key]: opt };
    setP4Answers(next);
    scheduleAutosave({ p1: p1Answers, p2: p2Answers, p3: p3Answers, p4: next });
  };

  // Làm lại bài thi từ đầu (Tạo phòng thi mới 100% thời gian trên server)
  const handleRestartExam = async () => {
    try {
      setIsRestarting(true);
      if (typeof window !== "undefined" && examId) {
        try {
          localStorage.removeItem(`aptis_draft_listening_${examId}`);
        } catch {}
      }
      setP1Answers({});
      setP2Answers({});
      setP3Answers({});
      setP4Answers({});
      setPlayCounts({});
      setActiveStage(0);
      setIsSubmitted(false);
      setIsReviewMode(false);

      const res = await api.submissions.start(examId, true);
      if (res.success && res.data) {
        setSubmissionId(res.data.submissionId || res.data.id);
        if (res.data.serverTimeRemaining !== undefined) {
          setTimeLeft(res.data.serverTimeRemaining);
        } else {
          setTimeLeft((examData.durationMinutes || 40) * 60);
        }
      }
      router.replace(`/listening/${examId}`);
    } catch (e) {
      console.error("Lỗi làm lại bài thi:", e);
      alert("Không thể khởi tạo lại bài thi. Vui lòng thử lại!");
    } finally {
      setIsRestarting(false);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitted(true);
    if (typeof window !== "undefined" && examId) {
      try {
        localStorage.removeItem(`aptis_draft_listening_${examId}`);
      } catch {}
    }
    let subId = submissionId;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") || localStorage.getItem("token")
        : null;
    if (!token) return;

    try {
      if (!subId) {
        const startRes = await api.submissions.start(examId);
        if (startRes.success && startRes.data) {
          subId = startRes.data.submissionId || startRes.data.id;
          setSubmissionId(subId);
        }
      }

      if (subId) {
        const answersPayload: any[] = [];
        // Part 1
        examData.part1.forEach((q: any, idx: number) => {
          if (q.id && p1Answers[idx]) {
            answersPayload.push({
              questionId: String(q.id),
              selectedOption: p1Answers[idx],
            });
          }
        });
        // Part 2
        examData.part2.speakers.forEach((s: any, idx: number) => {
          if (s.id && p2Answers[idx]) {
            answersPayload.push({
              questionId: String(s.id),
              selectedOption: p2Answers[idx],
            });
          }
        });
        // Part 3
        examData.part3.opinions.forEach((o: any, idx: number) => {
          if (o.id && p3Answers[idx]) {
            answersPayload.push({
              questionId: String(o.id),
              selectedOption: p3Answers[idx],
            });
          }
        });
        // Part 4
        examData.part4.forEach((rec: any, recIdx: number) => {
          rec.questions.forEach((q: any, qIdx: number) => {
            const ansKey = `${recIdx}_${qIdx}`;
            if (q.id && p4Answers[ansKey]) {
              answersPayload.push({
                questionId: String(q.id),
                selectedOption: p4Answers[ansKey],
              });
            }
          });
        });

        if (answersPayload.length > 0) {
          await api.submissions.autosave(subId, answersPayload);
        }
        await api.submissions.submit(subId);

        // Nạp kết quả chính thức từ máy chủ để hiển thị đúng đáp án và điểm
        try {
          const resultRes = await api.submissions.getResult(subId);
          if (resultRes.success && resultRes.data) {
            const sub = resultRes.data;
            if (sub.exam) {
              const parsed = parseApiToListeningData(sub.exam);
              setExamData(parsed.exam);
            }
          }
        } catch (subErr) {
          console.warn("Could not reload graded listening result:", subErr);
        }
      }
    } catch (err) {
      console.warn("Submit listening error:", err);
    }
  };

  // Xác định Part hiện tại theo currentStage
  const getStageMeta = () => {
    if (!currentStage) {
      return { partName: "Listening Practice", subTitle: "Question 1", isLast: true };
    }
    const isLast = activeStage === listeningStages.length - 1;
    if (currentStage.partNum === 1) {
      return {
        partName: "Part 1 – Word Recognition",
        subTitle: `Question ${currentStage.subIndex + 1} of ${examData.part1.length}`,
        isLast,
      };
    } else if (currentStage.partNum === 2) {
      return {
        partName: "Part 2 – Matching Information",
        subTitle: `Topic: ${examData.part2.topic || "Matching 4 Speakers"}`,
        isLast,
      };
    } else if (currentStage.partNum === 3) {
      return {
        partName: "Part 3 – Short Conversations",
        subTitle: `Topic: ${examData.part3.topic || "Opinion Discussion"}`,
        isLast,
      };
    } else {
      const rec = examData.part4[currentStage.subIndex];
      return {
        partName: "Part 4 – Monologues",
        subTitle: rec?.title ? `Topic: ${rec.title}` : `Recording ${currentStage.subIndex + 1} of ${Math.max(1, examData.part4.length)}`,
        isLast,
      };
    }
  };

  const currentMeta = getStageMeta();

  // =========================================================================
  // MÀN HÌNH KẾT QUẢ LISTENING (CHUẨN ẢNH 5 THEO DESIGN SYSTEM CỦA MÌNH)
  // =========================================================================
  if (isSubmitted && !isReviewMode) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
        {/* Header Bar */}
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                Listening Test
              </span>
              <span className="text-sm font-bold text-foreground">
                Kết quả bài thi Listening
              </span>
            </div>
          </div>
          <Link
            href="/listening"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Thoát</span>
          </Link>
        </header>

        {/* Content Container */}
        <main className="flex-1 py-8 px-4">
          <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in">
            {/* Card 1: Tổng quan Điểm số */}
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm text-center space-y-6">
              <h2 className="font-heading font-extrabold text-xl text-foreground">
                Kết quả Listening
              </h2>

              <div className="grid grid-cols-3 gap-3 divide-x divide-border/60 py-2">
                <div>
                  <div className="text-2xl md:text-3xl font-black text-primary font-mono">
                    {results.totalScore}/{results.maxScore}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Điểm</div>
                </div>

                <div>
                  <div className="text-2xl md:text-3xl font-black text-accent font-heading">
                    {results.cefr}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Trình độ</div>
                </div>

                <div>
                  <div className="text-2xl md:text-3xl font-black text-foreground font-mono">
                    {results.totalCorrect}/{results.totalQuestionsInExam}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Số câu đúng</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/listening"
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
                >
                  ← Thoát
                </Link>

                <button
                  type="button"
                  onClick={() => setIsReviewMode(true)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem lại từng câu →</span>
                </button>

                <button
                  type="button"
                  onClick={handleRestartExam}
                  disabled={isRestarting}
                  className="tech-btn px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isRestarting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>Làm lại</span>
                </button>
              </div>
            </div>

            {/* Card 2: Chi tiết bài làm theo 4 Part */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <h3 className="font-heading font-bold text-sm text-foreground pb-2 border-b border-border">
                Chi tiết bài làm
              </h3>

              <div className="space-y-3.5 text-xs md:text-sm">
                {/* Part 1 */}
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="font-medium text-foreground">
                    Part 1 – Word Recognition
                  </span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">
                      Số câu đúng: <strong className="text-foreground">{results.p1Correct}/13</strong>
                    </span>
                    <span className="font-mono font-bold text-primary">
                      Điểm: {results.p1Score}/26
                    </span>
                  </div>
                </div>

                {/* Part 2 */}
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="font-medium text-foreground">
                    Part 2 – Matching Information
                  </span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">
                      Số câu đúng: <strong className="text-foreground">{results.p2Correct}/4</strong>
                    </span>
                    <span className="font-mono font-bold text-primary">
                      Điểm: {results.p2Score}/8
                    </span>
                  </div>
                </div>

                {/* Part 3 */}
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="font-medium text-foreground">
                    Part 3 – Short Conversations
                  </span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">
                      Số câu đúng: <strong className="text-foreground">{results.p3Correct}/4</strong>
                    </span>
                    <span className="font-mono font-bold text-primary">
                      Điểm: {results.p3Score}/8
                    </span>
                  </div>
                </div>

                {/* Part 4 */}
                <div className="flex items-center justify-between py-1.5">
                  <span className="font-medium text-foreground">
                    Part 4 – Monologues
                  </span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">
                      Số câu đúng: <strong className="text-foreground">{results.p4Correct}/4</strong>
                    </span>
                    <span className="font-mono font-bold text-primary">
                      Điểm: {results.p4Score}/8
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // MÀN HÌNH CHỜ TẢI DỮ LIỆU ĐỀ THI
  // =========================================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-semibold text-muted-foreground">Đang tải phòng thi Listening...</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MÀN HÌNH LÀM BÀI PHÒNG THI LISTENING (THEO DESIGN SYSTEM CỦA MÌNH)
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans select-none">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (isReviewMode) {
                router.push("/history");
              } else if (isSubmitted) {
                router.push("/listening");
              } else {
                setShowExitConfirm(true);
              }
            }}
            className="w-9 h-9 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors text-foreground cursor-pointer"
            title={isReviewMode ? "Quay lại lịch sử" : "Quay lại danh sách đề"}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              {isReviewMode ? "Chế độ xem lại bài thi" : "Listening Practice"}
            </span>
            <span className="text-sm md:text-base font-bold text-foreground">
              {currentMeta.partName}
            </span>
          </div>
        </div>

        {/* Căn giữa: Đồng hồ đếm ngược & Sync status / Review mode score */}
        <div className="flex items-center gap-2.5">
          {isReviewMode ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Điểm: {results.totalScore}/{results.maxScore} ({results.totalCorrect}/{results.totalQuestionsInExam} đúng)</span>
            </div>
          ) : (
            <>
              <ExamSyncStatus
                status={syncStatus}
                lastSavedAt={lastSavedAt}
                isResumed={isResumedSession}
              />
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-sm">
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (isReviewMode) {
                router.push("/history");
              } else if (isSubmitted) {
                router.push("/listening");
              } else {
                setShowExitConfirm(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title={isReviewMode ? "Quay lại lịch sử" : "Thoát về danh sách đề"}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isReviewMode ? "Lịch sử" : "Thoát"}</span>
          </button>
        </div>
      </header>

      {isResumedSession && !resumedBannerDismissed && !isReviewMode && (
        <ExamRecoveryBanner
          remainingSeconds={timeLeft}
          answersCount={
            Object.keys(p1Answers).length +
            Object.keys(p2Answers).length +
            Object.keys(p3Answers).length +
            Object.keys(p4Answers).length
          }
          onDismiss={() => setResumedBannerDismissed(true)}
        />
      )}

      {/* 2. MAIN WORKSPACE */}
      <main className={`flex-1 py-6 px-3 md:px-6 ${isReviewMode ? "pb-12" : "pb-24"}`}>
        <div className={`mx-auto ${isReviewMode ? "max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" : "max-w-4xl space-y-6"}`}>
          <div className={`${isReviewMode ? "lg:col-span-8 space-y-6" : "space-y-6"}`}>
            {/* Card Context & Header Banner */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    {currentMeta.partName.split("–")[0].trim()}
                  </span>
                  <h2 className="font-heading font-bold text-base md:text-lg text-foreground">
                    {currentMeta.subTitle}
                  </h2>
                </div>
                <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans pt-1">
                  {currentStage.partNum === 1
                    ? "Listen to the short recording and answer the question. You can listen twice."
                    : currentStage.partNum === 2
                    ? `Topic: ${examData.part2.topic}. ${examData.part2.instructions || "Match each speaker to their statement."}`
                    : currentStage.partNum === 3
                    ? `Topic: ${examData.part3.topic}. ${examData.part3.instructions || "Who expresses which opinion? Select Man, Woman, or Both."}`
                    : `Topic: ${examData.part4[currentStage.subIndex]?.title || "Monologue"}. Listen to the recording and answer the questions.`}
                </p>
              </div>

              {/* Bookmark, Pause, Timer */}
              <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                <button
                  type="button"
                  className="flex items-center gap-1 px-3 py-1 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted font-medium transition-colors"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Bookmark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-1.5 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors"
                  title={isPaused ? "Tiếp tục" : "Tạm dừng"}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Trình phát Audio chuẩn có hỗ trợ âm thanh thật, chỉnh tốc độ & Speech fallback */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col sm:flex-row items-center gap-4">
              <audio
                ref={audioRef}
                preload="metadata"
                onEnded={() => {
                  setIsPlaying(false);
                  setPlaybackProgress(100);
                }}
                onTimeUpdate={() => {
                  if (audioRef.current && audioRef.current.duration > 0) {
                    const pct = Math.round((audioRef.current.currentTime / audioRef.current.duration) * 100);
                    setPlaybackProgress(pct);
                  }
                }}
              />

              <button
                type="button"
                onClick={togglePlayAudio}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-glow shadow-md transition-all shrink-0"
                title={isPlaying ? "Dừng audio" : "Phát audio"}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <div className="flex-1 w-full space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      {isPlaying ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-primary animate-pulse" />
                          <span>Đang phát âm thanh...</span>
                        </>
                      ) : (
                        <>
                          <Headphones className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Sẵn sàng nghe</span>
                        </>
                      )}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                      {audioUrlMap[activeStage] ? "Audio HD" : "Audio British AI"}
                    </span>
                  </div>
                  <span>Đã nghe: <strong>{playCounts[activeStage] || 0}/2</strong> lần</span>
                </div>

                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full bg-primary rounded-full transition-all duration-300 ${
                      isPlaying ? "animate-pulse" : ""
                    }`}
                    style={{ width: `${playbackProgress}%` }}
                  />
                </div>
              </div>

              {/* Bộ chọn tốc độ phát âm thanh */}
              <div className="flex items-center gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 w-full sm:w-auto justify-end">
                <span className="text-[10px] text-muted-foreground mr-1 hidden sm:inline">Tốc độ:</span>
                {[0.75, 1, 1.25].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => handleSpeedChange(spd)}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                      playbackSpeed === spd
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Script & Bản dịch song song (ẩn mặc định, bật tắt tùy chọn) */}
            <div className="pt-3 border-t border-border/50">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowScript((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      showScript
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{showScript ? "Ẩn Audio Script" : "Xem Audio Script"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTranslation((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      showTranslation
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border"
                    }`}
                  >
                    <Languages className="w-3.5 h-3.5" />
                    <span>{showTranslation ? "Ẩn Bản Dịch TV" : "Xem Bản Dịch TV"}</span>
                  </button>
                </div>

                <span className="text-[11px] text-muted-foreground italic hidden sm:inline">
                  💡 Nên nghe và làm bài trước khi mở script để rèn phản xạ thi thật
                </span>
              </div>

              {/* Bảng hiển thị Song Song (2 cột desktop, cột đơn mobile) */}
              {(showScript || showTranslation) && (() => {
                const bilingual = getCurrentBilingualData();
                if (!bilingual) return null;
                const stageKey = `stage_${activeStage}`;
                const activeTranslation =
                  bilingual.translation || translationCache[stageKey];

                return (
                  <div className="mt-3 p-4 rounded-xl border border-primary/20 bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/60 pb-1.5">
                      <span className="font-bold text-foreground">{bilingual.title}</span>
                      <span className="text-[10px] hidden sm:inline">Hiển thị song song hỗ trợ ôn luyện</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {showScript && (
                        <div className={!showTranslation ? "md:col-span-2" : ""}>
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <div className="flex items-center gap-1.5 font-bold text-primary text-[11px] uppercase tracking-wide">
                              <FileText className="w-3.5 h-3.5" />
                              <span>Script Ghi Âm (Tiếng Anh)</span>
                            </div>
                            {bilingual.script && (
                              <button
                                type="button"
                                onClick={() => handleCopyTranslation(bilingual.script)}
                                className="text-[10.5px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted transition-colors cursor-pointer"
                                title="Sao chép script tiếng Anh"
                              >
                                <Copy className="w-3 h-3" />
                                <span className="hidden sm:inline">Sao chép</span>
                              </button>
                            )}
                          </div>
                          <div className="p-3 rounded-lg bg-background border border-border text-foreground leading-relaxed whitespace-pre-line font-mono text-[11.5px] max-h-64 overflow-y-auto">
                            {bilingual.script || "Đang cập nhật script cho phần này."}
                          </div>
                        </div>
                      )}

                      {showTranslation && (
                        <div className={!showScript ? "md:col-span-2" : ""}>
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 text-[11px] uppercase tracking-wide">
                              <Languages className="w-3.5 h-3.5" />
                              <span>Bản Dịch Nghĩa (Tiếng Việt)</span>
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <Sparkles className="w-2.5 h-2.5" />
                                AI Song Ngữ
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {activeTranslation && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyTranslation(activeTranslation)}
                                  className="text-[10.5px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted transition-colors cursor-pointer"
                                  title="Sao chép bản dịch"
                                >
                                  {copiedTrans ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-500" />
                                      <span className="text-emerald-500 font-medium">Đã chép</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span className="hidden sm:inline">Sao chép</span>
                                    </>
                                  )}
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={isTranslating}
                                onClick={() => fetchBilingualTranslation(activeStage, true)}
                                className="text-[10.5px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
                                title="Làm mới bản dịch AI"
                              >
                                <RotateCcw className={`w-3 h-3 ${isTranslating ? "animate-spin" : ""}`} />
                                <span className="hidden sm:inline">Dịch lại</span>
                              </button>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-background border border-border text-foreground leading-relaxed whitespace-pre-line text-[11.5px] max-h-64 overflow-y-auto">
                            {activeTranslation ? (
                              activeTranslation
                            ) : isTranslating ? (
                              <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                                <span className="text-[11px] font-medium">Đang tạo bản dịch tiếng Việt bằng AI...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-4 gap-2 text-muted-foreground text-center">
                                <span className="text-[11px]">Bản dịch nghĩa đang được hoàn thiện.</span>
                                <button
                                  type="button"
                                  onClick={() => fetchBilingualTranslation(activeStage, true)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Dịch ngay bằng AI</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          <div key={`listening-stage-wrap-${activeStage}`} className="part-transition space-y-5">
          {/* =========================================================================
              PART 1: CÂU HỎI TRẮC NGHIỆM A, B, C
              ========================================================================= */}
          {currentStage.partNum === 1 && (() => {
            const q = examData.part1[currentStage.subIndex];
            if (!q) return null;
            const userChoice = p1Answers[currentStage.subIndex];
            const isCor = Boolean(userChoice && userChoice.toLowerCase() === q.correctAnswer.toLowerCase());

            return (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
                  <h3 className="text-sm md:text-base font-semibold text-foreground leading-relaxed">
                    {q.prompt}
                  </h3>
                  {isReviewMode && (
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shrink-0 ${
                        isCor
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                          : "bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30"
                      }`}
                    >
                      {isCor ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đúng (+1)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Sai (0 đ)</span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = userChoice === opt;
                    const isCorrectAnswer = opt.toLowerCase() === q.correctAnswer.toLowerCase();

                    let optionStyle = "border-border bg-background hover:border-primary/40 text-foreground";
                    if (isReviewMode) {
                      if (isCorrectAnswer) {
                        optionStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs";
                      } else if (isSelected && !isCorrectAnswer) {
                        optionStyle = "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300 font-bold shadow-xs";
                      } else {
                        optionStyle = "border-border/60 bg-muted/20 text-muted-foreground opacity-75";
                      }
                    } else if (isSelected) {
                      optionStyle = "border-primary bg-primary/10 text-primary font-bold shadow-sm";
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={isReviewMode}
                        onClick={() => handleP1Answer(currentStage.subIndex, opt)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${optionStyle} ${
                          isReviewMode ? "cursor-default" : "cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs ${
                              isReviewMode && isCorrectAnswer
                                ? "bg-emerald-500 text-white border-emerald-600"
                                : isReviewMode && isSelected && !isCorrectAnswer
                                ? "bg-red-500 text-white border-red-600"
                                : "bg-muted/40 border-border"
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="text-sm md:text-base font-normal">{opt}</span>
                        </div>
                        {isReviewMode ? (
                          isCorrectAnswer ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : isSelected ? (
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          ) : null
                        ) : (
                          isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Review Mode Explanation Box */}
                {isReviewMode && (
                  <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/80 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-muted-foreground">
                        Bạn đã chọn:{" "}
                        <strong className={isCor ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                          {userChoice || "(Bỏ trống)"}
                        </strong>
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Đáp án chuẩn: <strong>{q.correctAnswer}</strong>
                      </span>
                    </div>
                    {q.explanation && (
                      <div className="text-muted-foreground leading-relaxed pt-2 border-t border-border/50">
                        <span className="font-bold text-foreground">Giải thích: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* =========================================================================
              PART 2: SPEAKERS NỐI THÔNG TIN BẰNG DROPDOWN
              ========================================================================= */}
          {currentStage.partNum === 2 && examData.part2.speakers && examData.part2.speakers.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                    Topic
                  </span>
                  <h3 className="text-base font-bold text-foreground">
                    {examData.part2.topic || "Matching Information"}
                  </h3>
                </div>
                <span className="text-xs text-muted-foreground font-medium">Ghép thông tin tương ứng cho 4 người nói</span>
              </div>

              <div className="space-y-4">
                {examData.part2.speakers.map((spk, idx) => {
                  const userChoice = p2Answers[idx];
                  const isCor = Boolean(userChoice && spk.correctAnswer && userChoice.toLowerCase() === spk.correctAnswer.toLowerCase());

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border bg-background flex flex-col gap-3 ${
                        isReviewMode
                          ? isCor
                            ? "border-emerald-500/50 bg-emerald-500/5"
                            : "border-red-500/50 bg-red-500/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-sm text-primary w-28 shrink-0">
                            {spk.speaker}
                          </span>
                          {isReviewMode && (
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              isCor
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                : "bg-red-500/20 text-red-700 dark:text-red-300"
                            }`}>
                              {isCor ? "Đúng (+1)" : "Sai (0 đ)"}
                            </span>
                          )}
                        </div>

                        <select
                          disabled={isReviewMode}
                          value={p2Answers[idx] || ""}
                          onChange={(e) => handleP2Answer(idx, e.target.value)}
                          className="flex-1 p-2.5 rounded-lg border border-input bg-card text-foreground text-xs md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans cursor-pointer disabled:opacity-85"
                        >
                          <option value="">-- Chọn thông tin phù hợp --</option>
                          {(examData.part2.options || []).map((opt, oIdx) => (
                            <option key={oIdx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      {isReviewMode && (
                        <div className="text-xs space-y-1 pt-2 border-t border-border/50 text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-3">
                            <span>Bạn chọn: <strong className={isCor ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>{userChoice || "(Chưa chọn)"}</strong></span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Đáp án chuẩn: <strong>{spk.correctAnswer}</strong></span>
                          </div>
                          {spk.explanation && (
                            <p className="italic text-[11px] pt-1">{spk.explanation}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              PART 3: NHẬN ĐỊNH CHỌN MAN / WOMAN / BOTH
              ========================================================================= */}
          {currentStage.partNum === 3 && examData.part3.opinions && examData.part3.opinions.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                    Topic
                  </span>
                  <h3 className="text-base font-bold text-foreground">
                    {examData.part3.topic || "Short Conversations & Opinions"}
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  🎙️ Đối thoại Man & Woman
                </span>
              </div>

              <h4 className="text-xs md:text-sm font-semibold text-muted-foreground">
                Xác định ai là người đưa ra từng quan điểm dưới đây:
              </h4>

              <div className="space-y-4">
                {examData.part3.opinions.map((op, idx) => {
                  const userChoice = p3Answers[idx];
                  const isCor = Boolean(userChoice && op.correctAnswer && userChoice.toLowerCase() === op.correctAnswer.toLowerCase());

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border bg-background flex flex-col gap-3 ${
                        isReviewMode
                          ? isCor
                            ? "border-emerald-500/50 bg-emerald-500/5"
                            : "border-red-500/50 bg-red-500/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-xs md:text-sm text-foreground flex-1 leading-relaxed">
                          {op.statement}
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                          {isReviewMode && (
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              isCor
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                : "bg-red-500/20 text-red-700 dark:text-red-300"
                            }`}>
                              {isCor ? "Đúng (+1)" : "Sai (0 đ)"}
                            </span>
                          )}

                          <select
                            disabled={isReviewMode}
                            value={p3Answers[idx] || ""}
                            onChange={(e) => handleP3Answer(idx, e.target.value as any)}
                            className="w-full sm:w-40 p-2.5 rounded-lg border border-input bg-card text-foreground text-xs md:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans cursor-pointer disabled:opacity-85"
                          >
                            <option value="">-- Chọn --</option>
                            <option value="Man">Man</option>
                            <option value="Woman">Woman</option>
                            <option value="Both">Both</option>
                          </select>
                        </div>
                      </div>

                      {isReviewMode && (
                        <div className="text-xs space-y-1 pt-2 border-t border-border/50 text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-3">
                            <span>Bạn chọn: <strong className={isCor ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>{userChoice || "(Chưa chọn)"}</strong></span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Đáp án chuẩn: <strong>{op.correctAnswer}</strong></span>
                          </div>
                          {op.explanation && (
                            <p className="italic text-[11px] pt-1">{op.explanation}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              PART 4: RECORDINGS MONOLOGUES (CÂU HỎI TRẮC NGHIỆM)
              ========================================================================= */}
          {currentStage.partNum === 4 && (() => {
            const rec = examData.part4[currentStage.subIndex];
            if (!rec || !rec.questions) return null;
            const recIdx = currentStage.subIndex;

            return (
              <div className="space-y-6">
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                      Topic
                    </span>
                    <h3 className="text-sm md:text-base font-bold text-foreground">
                      {rec.title || `Monologue ${recIdx + 1}`}
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                    Recording {recIdx + 1} of {examData.part4.length}
                  </span>
                </div>
                {rec.questions.map((q, qIdx) => {
                  const answerKey = `${recIdx}_${qIdx}`;
                  const selected = p4Answers[answerKey];
                  const isCor = Boolean(selected && selected.toLowerCase() === q.correctAnswer.toLowerCase());

                  return (
                    <div
                      key={qIdx}
                      className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
                        <h3 className="text-sm md:text-base font-semibold text-foreground leading-relaxed">
                          {q.prompt}
                        </h3>
                        {isReviewMode && (
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shrink-0 ${
                              isCor
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                : "bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30"
                            }`}
                          >
                            {isCor ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Đúng (+1)</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Sai (0 đ)</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selected === opt;
                          const isCorrectAnswer = opt.toLowerCase() === q.correctAnswer.toLowerCase();

                          let optionStyle = "border-border bg-background hover:border-primary/40 text-foreground";
                          if (isReviewMode) {
                            if (isCorrectAnswer) {
                              optionStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs";
                            } else if (isSelected && !isCorrectAnswer) {
                              optionStyle = "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300 font-bold shadow-xs";
                            } else {
                              optionStyle = "border-border/60 bg-muted/20 text-muted-foreground opacity-75";
                            }
                          } else if (isSelected) {
                            optionStyle = "border-primary bg-primary/10 text-primary font-bold shadow-sm";
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              disabled={isReviewMode}
                              onClick={() => handleP4Answer(answerKey, opt)}
                              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${optionStyle} ${
                                isReviewMode ? "cursor-default" : "cursor-pointer"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs ${
                                    isReviewMode && isCorrectAnswer
                                      ? "bg-emerald-500 text-white border-emerald-600"
                                      : isReviewMode && isSelected && !isCorrectAnswer
                                      ? "bg-red-500 text-white border-red-600"
                                      : "bg-muted/40 border-border"
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="text-xs md:text-sm font-normal">{opt}</span>
                              </div>
                              {isReviewMode ? (
                                isCorrectAnswer ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                ) : isSelected ? (
                                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                ) : null
                              ) : (
                                isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {isReviewMode && (
                        <div className="mt-3 p-3.5 rounded-xl bg-muted/30 border border-border/80 space-y-1.5 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span>
                              Bạn đã chọn:{" "}
                              <strong className={isCor ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                                {selected || "(Bỏ trống)"}
                              </strong>
                            </span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              Đáp án chuẩn: <strong>{q.correctAnswer}</strong>
                            </span>
                          </div>
                          {q.explanation && (
                            <div className="text-muted-foreground italic pt-1 border-t border-border/50">
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
          </div>
        </div>

        {/* CỘT PHẢI: MỤC LỤC XEM LẠI CHUẨN DESIGN SYSTEM KHI Ở REVIEW MODE */}
        {isReviewMode && (
          <aside className="lg:col-span-4">
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4 sticky top-20">
              {/* Header */}
              <div className="border-b border-border pb-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-heading font-black text-base text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Mục lục xem lại</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    {results.totalScore}/{results.maxScore} điểm
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {results.totalCorrect} đúng
                    </span>
                    <span>•</span>
                    <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {results.totalQuestionsInExam - results.totalCorrect} sai
                    </span>
                  </div>
                  <span className="font-bold text-accent">Band {results.cefr}</span>
                </div>
              </div>

              {/* Filter Checkbox */}
              <div className="flex items-center justify-between bg-muted/40 p-2.5 rounded-xl border border-border/60">
                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyShowWrong}
                    onChange={(e) => setOnlyShowWrong(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>Chỉ hiện câu sai</span>
                </label>
                {onlyShowWrong && (
                  <span className="text-[11px] text-red-600 dark:text-red-400 font-bold">
                    {results.totalQuestionsInExam - results.totalCorrect} câu
                  </span>
                )}
              </div>

              {/* Part Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-xs">
                {[
                  { id: "all", label: `Tất cả (${listeningStages.length})` },
                  { id: 1, label: `Part 1 (${listeningStages.filter((s) => s.partNum === 1).length})` },
                  { id: 2, label: `Part 2` },
                  { id: 3, label: `Part 3` },
                  { id: 4, label: `Part 4` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setReviewFilterPart(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                      reviewFilterPart === tab.id
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Question Grid Pills */}
              <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2 max-h-[46vh] overflow-y-auto p-1">
                {listeningStages
                  .map((stage, idx) => ({ stage, idx, res: getStageResult(idx) }))
                  .filter(({ stage, res }) => {
                    if (reviewFilterPart !== "all" && stage.partNum !== reviewFilterPart) return false;
                    if (onlyShowWrong && res.isCorrect) return false;
                    return true;
                  })
                  .map(({ stage, idx, res }) => {
                    const isCurrent = activeStage === idx;
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => setActiveStage(idx)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                          res.isCorrect
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25"
                            : "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/35 hover:bg-red-500/25"
                        } ${
                          isCurrent
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background font-black shadow-sm"
                            : ""
                        }`}
                        title={`${stage.label}: ${res.isCorrect ? "Đúng" : "Sai"}`}
                      >
                        <div className="flex items-center gap-1">
                          {res.isCorrect ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                          )}
                          <span className="truncate">{res.label}</span>
                        </div>
                        {res.total && res.total > 1 && (
                          <span className="text-[10px] opacity-80">
                            {res.score}/{res.total}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>

              {/* Actions */}
              <div className="border-t border-border pt-3 space-y-2">
                <button
                  type="button"
                  onClick={handleRestartExam}
                  disabled={isRestarting}
                  className="w-full tech-btn py-2.5 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isRestarting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  <span>Làm lại đề này</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/history")}
                  className="w-full py-2 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại lịch sử làm bài</span>
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
      </main>

      {/* 4. BOTTOM BAR CHUẨN (CHỈ HIỂN THỊ KHI ĐANG THI, ẨN KHI Ở REVIEW MODE) */}
      {!isReviewMode && (
        <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border px-4 md:px-8 py-3 flex items-center justify-between z-40 shadow-lg">
          {/* Left: Hiện đáp án & Báo lỗi */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSampleAnswers(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 text-xs font-semibold transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Hiện đáp án</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowReportModal(true);
                setReportSent(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Báo lỗi</span>
            </button>
          </div>

          {/* Center: Quick Part Question Pills & Navigation Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Glass Dock bọc dãy câu hỏi */}
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
                        <span>{stage.label}</span>
                      </button>
                    );
                  })}
              </div>

              <div className="h-4 w-px bg-border/70 shrink-0 mx-0.5 hidden sm:block" />

              <button
                type="button"
                onClick={() => setShowDrawer(true)}
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
                onClick={handleFinalSubmit}
                className="tech-btn px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all"
              >
                Nộp bài
              </button>
            )}
          </div>
        </footer>
      )}

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
                { id: "all", label: `Tất cả (${listeningStages.length})` },
                ...(listeningStages.some((s) => s.partNum === 1)
                  ? [{ id: "p1", label: `Part 1 (${listeningStages.filter((s) => s.partNum === 1).length})` }]
                  : []),
                ...(listeningStages.some((s) => s.partNum === 2)
                  ? [{ id: "p2", label: `Part 2 (${listeningStages.filter((s) => s.partNum === 2).length})` }]
                  : []),
                ...(listeningStages.some((s) => s.partNum === 3)
                  ? [{ id: "p3", label: `Part 3 (${listeningStages.filter((s) => s.partNum === 3).length})` }]
                  : []),
                ...(listeningStages.some((s) => s.partNum === 4)
                  ? [{ id: "p4", label: `Part 4 (${listeningStages.filter((s) => s.partNum === 4).length})` }]
                  : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDrawerTab(tab.id as any)}
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
      <ExamExitConfirmModal
        isOpen={showExitConfirm}
        title="Rời khỏi bài thi Listening?"
        message="Bạn đang trong quá trình làm bài nghe. Nếu quay lại lúc này, bài thi chưa nộp sẽ không được lưu điểm. Bạn có chắc chắn muốn rời khỏi không?"
        confirmText="Xác nhận rời khỏi"
        cancelText="Tiếp tục làm bài"
        onConfirm={() => {
          setShowExitConfirm(false);
          router.push("/listening");
        }}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>
  );
}

export default function ListeningExamRunner() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <ListeningExamRunnerContent />
    </Suspense>
  );
}
