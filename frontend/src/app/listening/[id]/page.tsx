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
  Sparkles,
  RefreshCw,
  Loader2,
  Check,
} from "lucide-react";
import { DEFAULT_LISTENING_TEST, DEFAULT_LISTENING_TEST_2 } from "@/data/listening-benchmark";
import { ExamSyncStatus, ExamRecoveryBanner } from "@/components/exam-sync-status";
import { SoundCheckScreen } from "@/components/listening/sound-check-screen";
import { ListeningResultScreen } from "@/components/listening/listening-result-screen";
import { BilingualTranscriptPanel } from "@/components/listening/bilingual-transcript-panel";
import {
  ListeningPart1Card,
  ListeningPart2Card,
  ListeningPart3Card,
  ListeningPart4Card,
} from "@/components/listening/listening-part-cards";
import { ListeningReviewSidebar } from "@/components/listening/listening-review-sidebar";
import {
  ListeningBottomDock,
  ListeningModalsAndDrawer,
} from "@/components/listening/listening-bottom-dock";
import type {
  Part1Item,
  Part2Speaker,
  Part3Opinion,
  Part4Question,
  Part4Recording,
  ListeningExamData,
} from "@/components/listening/listening-types";


// Định nghĩa dữ liệu 4 Parts chuẩn Aptis Listening
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Timer & UI states
  const [timeLeft, setTimeLeft] = useState(40 * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [flaggedStages, setFlaggedStages] = useState<Record<number, boolean>>({});
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
  // Sound Check & Anti-Autoplay states
  const [showSoundCheck, setShowSoundCheck] = useState(!isReviewUrl);
  const [soundTested, setSoundTested] = useState(false);
  const [isTestingSound, setIsTestingSound] = useState(false);
  const [checkVolume, setCheckVolume] = useState(0.8);
  const soundCheckAudioRef = useRef<HTMLAudioElement | null>(null);

  // Bilingual Tabs & Display states
  const [showBilingualBox, setShowBilingualBox] = useState(isReviewUrl);
  const [bilingualTab, setBilingualTab] = useState<"en" | "vi">("en");
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
        audioUrl: q.audioUrl,
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
        audioUrl: examData.part2.audioUrl,
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
        audioUrl: examData.part3.audioUrl,
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
        audioUrl: rec.audioUrl,
      });
    });

    return stages;
  }, [examData]);

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
      const p2Script =
        (examData.part2 as any).passageText ||
        (examData.part2 as any).transcript ||
        (examData.part2.speakers && examData.part2.speakers.length > 0
          ? examData.part2.speakers
              .map((s) => (s.transcript ? `${s.speaker}: "${s.transcript}"` : `${s.speaker}: "${s.correctAnswer}"`))
              .join("\n\n")
          : "");
      return {
        title: "Part 2 — Đoạn ghi âm 4 người nói",
        script: p2Script,
        translation: (examData.part2 as any).translationText || "",
      };
    } else if (currentStage.partNum === 3) {
      const p3Script =
        (examData.part3 as any).passageText ||
        (examData.part3 as any).transcript ||
        (examData.part3.opinions && examData.part3.opinions.length > 0
          ? examData.part3.opinions.map((o) => `• ${o.statement} (${o.correctAnswer})`).join("\n\n")
          : "");
      return {
        title: "Part 3 — Hội thoại thảo luận quan điểm",
        script: p3Script,
        translation: (examData.part3 as any).translationText || "",
      };
    } else if (currentStage.partNum === 4) {
      const rec = examData.part4[currentStage.subIndex];
      return {
        title: `Part 4 — Bài thuyết trình ${currentStage.subIndex + 1}`,
        script: rec?.passageText || rec?.transcript || "",
        translation: rec?.translationText || "",
      };
    } else if (currentStage.partNum === 1) {
      const q = examData.part1[currentStage.subIndex];
      const p1Script =
        q?.transcript ||
        (q?.explanation ? extractTranscriptFromExplanation(q.explanation) : "") ||
        q?.prompt ||
        "";
      return {
        title: `Part 1 — Câu hỏi ${currentStage.subIndex + 1}`,
        script: p1Script,
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

  // 1. Phục hồi bản nháp LocalStorage ngay khi vào phòng thi Listening (hỗ trợ F5 bay thẳng vào câu đang làm)
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

        // Khôi phục chính xác vị trí câu hỏi đang làm dở
        if (typeof draft.activeStage === "number" && draft.activeStage >= 0) {
          setActiveStage(draft.activeStage);
        }

        const hasStarted =
          Boolean(draft.hasStarted) ||
          (draft.p1Answers && Object.keys(draft.p1Answers).length > 0) ||
          (draft.p2Answers && Object.keys(draft.p2Answers).length > 0) ||
          (draft.p3Answers && Object.keys(draft.p3Answers).length > 0) ||
          (draft.p4Answers && Object.keys(draft.p4Answers).length > 0);

        if (hasStarted) {
          setShowSoundCheck(false);
          setIsResumedSession(true);
        }
      }
    } catch {}
  }, [examId, isSubmitted]);

  // 2. Tự động ghi bản nháp vào LocalStorage khi câu trả lời hoặc vị trí câu thay đổi
  useEffect(() => {
    if (typeof window === "undefined" || !examId || isSubmitted) return;
    const hasAnswers =
      Object.keys(p1Answers).length > 0 ||
      Object.keys(p2Answers).length > 0 ||
      Object.keys(p3Answers).length > 0 ||
      Object.keys(p4Answers).length > 0;

    if (hasAnswers || !showSoundCheck) {
      try {
        localStorage.setItem(
          `aptis_draft_listening_${examId}`,
          JSON.stringify({
            p1Answers,
            p2Answers,
            p3Answers,
            p4Answers,
            activeStage,
            hasStarted: !showSoundCheck,
            savedAt: new Date().toISOString(),
          })
        );
      } catch {}
    }
  }, [p1Answers, p2Answers, p3Answers, p4Answers, activeStage, showSoundCheck, examId, isSubmitted]);

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
    const cleaned = rawText
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .trim();

    const match = cleaned.match(/(\n*---+\s*GIẢI THÍCH[\s\S]*)/i);
    if (match && match.index !== undefined) {
      return {
        scriptEn: cleaned.slice(0, match.index).trim(),
        explanationVi: match[1].trim(),
      };
    }
    return {
      scriptEn: cleaned.trim(),
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

      const bilingualData = getCurrentBilingualData();
      let rawScript = bilingualData?.script || "";
      let staticTrans = bilingualData?.translation || "";

      if (!force && staticTrans && staticTrans.trim().length > 0) {
        setTranslationCache((prev) => {
          const next = { ...prev, [stageKey]: staticTrans };
          try {
            if (examId) {
              localStorage.setItem(`aptis_listening_trans_${examId}`, JSON.stringify(next));
            }
          } catch {}
          return next;
        });
        return staticTrans;
      }

      if (!rawScript || rawScript.trim().length < 5) return null;

      const { scriptEn, explanationVi } = parseBilingualContent(rawScript);
      const textToTranslate = scriptEn || rawScript.trim();
      if (!textToTranslate || textToTranslate.length < 5) return null;

      setIsTranslating(true);
      try {
        const res = await api.vocabulary.translate(textToTranslate);
        if (res.success && res.data?.translatedText) {
          const bodyTrans = res.data.translatedText.trim();
          const finalVi = explanationVi
            ? `${bodyTrans}\n\n${explanationVi}`
            : bodyTrans;

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
    [listeningStages, examData, translationCache, examId, activeStage]
  );

  // Kích hoạt dịch tự động khi người dùng bật tab dịch hoặc chuyển câu hỏi
  useEffect(() => {
    if ((!showTranslation && !showBilingualBox) || (showBilingualBox && bilingualTab !== "vi")) return;
    const stageKey = `stage_${activeStage}`;
    if (!translationCache[stageKey]) {
      fetchBilingualTranslation(activeStage);
    }
  }, [showTranslation, showBilingualBox, bilingualTab, activeStage, fetchBilingualTranslation, translationCache]);

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
              activeExam = parsed;
              setExamData(parsed);
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
            setShowSoundCheck(false); // Đang làm dở bài thi -> bỏ qua màn hình kiểm tra âm thanh
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
        setError(null);
        const res = await api.exams.getQuestions(examId, { mode: 'practice' });
        if (res.success && res.data) {
          const apiExam = res.data;
          const parsed = parseApiToListeningData(apiExam);
          setExamData(parsed);
          setTimeLeft((apiExam.duration_minutes || 40) * 60);
          if (
            parsed.part1.length === 0 &&
            (!parsed.part2.speakers || parsed.part2.speakers.length === 0) &&
            (!parsed.part3.opinions || parsed.part3.opinions.length === 0) &&
            parsed.part4.length === 0
          ) {
            setError("Đề thi này chưa có câu hỏi nào được xuất bản.");
          }
        } else {
          if (examId === "benchmark" || examId.startsWith("demo")) {
            setExamData(examId === "demo-2" ? DEFAULT_LISTENING_TEST_2 : DEFAULT_LISTENING_TEST);
          } else {
            setError(res.message || "Không thể tải nội dung bài thi từ cơ sở dữ liệu.");
          }
        }
      } catch (err: any) {
        if (examId === "benchmark" || examId.startsWith("demo")) {
          setExamData(examId === "demo-2" ? DEFAULT_LISTENING_TEST_2 : DEFAULT_LISTENING_TEST);
        } else {
          setError(err?.message || "Lỗi kết nối khi tải nội dung bài thi Listening.");
        }
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
  function parseApiToListeningData(apiData: any): ListeningExamData {
    const parts = apiData.parts || [];
    const isSinglePart = parts.length === 1;

    const result: ListeningExamData = {
      title: apiData.title || "Bài thi Listening",
      durationMinutes: apiData.duration_minutes || (isSinglePart ? 15 : 40),
      part1: [],
      part2: {
        topic: "Workplace & Daily Life",
        instructions: "Four employees share their views. Match each speaker to their statement.",
        options: [],
        speakers: [],
        passageText: "",
        translationText: "",
        audioUrl: "",
      },
      part3: {
        topic: "Discussion & Opinions",
        instructions: "Who expresses which opinion? Select Man, Woman, or Both.",
        passageText: "",
        translationText: "",
        opinions: [],
        audioUrl: "",
      },
      part4: [],
    };

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
        const extractedTopic = extractListeningTopic(p.title, apiData.title, p.instructions || p.passage_text, "");
        const rawPartTopic = (p as any).topic || p.topic || "";
        const isGenericTopic = !rawPartTopic || /workplace\s*&\s*daily\s*life/i.test(rawPartTopic) || /general\s*topic/i.test(rawPartTopic);
        const p2Topic = (!isGenericTopic && rawPartTopic) ? rawPartTopic : (extractedTopic || rawPartTopic || "Workplace & Daily Life Views");
        result.part2.topic = p2Topic;

        const p2Candidate = questions.find((q: any) => q.explanation || q.transcript);
        const p2Script = extractTranscriptFromExplanation(
          p2Candidate?.explanation,
          p.passage_text || p.transcript || p2Candidate?.transcript || p.suggestion
        );
        if (p2Script) {
          result.part2.passageText = p2Script;
          (result.part2 as any).transcript = p2Script;
        }
        if (p.translation_text || p.passage_translation) result.part2.translationText = p.translation_text || p.passage_translation;
        const p2RawAudio = p.audio_url || (p as any).file || "";
        const resolvedP2Audio = p2RawAudio && !p2RawAudio.startsWith("http") && !p2RawAudio.startsWith("/")
          ? `/uploads/audio/listening/${p2RawAudio}`
          : p2RawAudio;
        if (resolvedP2Audio) {
          result.part2.audioUrl = resolvedP2Audio;
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
          // Chuẩn hóa và chỉ giữ lại các lựa chọn hợp lệ (ngắn gọn, tối đa 80 ký tự, không chứa xuống dòng, không phải UUID hay metadata)
          extractedOptions = extractedOptions
            .map((o) => (typeof o === "string" ? o.trim() : ""))
            .filter((o) => o && o.length <= 80 && !o.includes("\n") && !/sẽ có thêm|gây nhiễu|đáp án nhiễu/i.test(o) && !/^[0-9a-f-]{30,}$/i.test(o));

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

          // Chỉ tìm đáp án giải thích từ section --- GIẢI THÍCH ĐÁP ÁN --- để tránh nhầm với đoạn hội thoại transcript
          const explSectionMatch = cleanText.match(/---+\s*GIẢI THÍCH[\s\S]*/i);
          const answerSearchText = explSectionMatch ? explSectionMatch[0] : cleanText;

          const explAnswerMap: Record<string, string> = {};

          // Match dạng "A = Mountain biking" hoặc "A: Mountain biking"
          const letterMatches = answerSearchText.matchAll(/(?:Speaker\s*)?([A-D])\s*[:=\-=–]\s*([^\n\r(.,]+)/gi);
          for (const m of letterMatches) {
            const letter = m[1].toUpperCase();
            const val = m[2].trim().replace(/^["']|["']$/g, "").trim();
            if (val && val.length <= 80 && !/topic|version|phiên bản|đáp án|speaker/i.test(val) && !explAnswerMap[letter]) {
              const matchedOpt = extractedOptions.find(
                (o) => o.toLowerCase().trim() === val.toLowerCase().trim()
              );
              if (matchedOpt) {
                explAnswerMap[letter] = matchedOpt;
              } else if (extractedOptions.length === 0) {
                explAnswerMap[letter] = val;
              }
            }
          }

          const spkList = questions.map((q: any, idx: number) => {
            const letter = String.fromCharCode(65 + idx);
            let ans = (q.correct_answer || "").trim();

            if (/^\d+$/.test(ans)) {
              const num = Number(ans);
              if (extractedOptions[num]) ans = extractedOptions[num];
            } else if (!ans || /^[0-9a-f-]{30,}$/i.test(ans)) {
              // Chỉ fallback khi ans trống hoặc là raw UUID chưa được resolve
              if (explAnswerMap[letter]) ans = explAnswerMap[letter];
              else if (extractedOptions[idx]) ans = extractedOptions[idx];
            }

            // Tách transcript và explanation riêng cho từng Speaker
            const rawExp = q.explanation || cleanText;
            const spkTransMatch = rawExp.match(
              new RegExp(`Speaker\\s*${letter}\\s*:\\s*([\\s\\S]*?)(?=(?:Speaker\\s*[A-D]\\s*:|---+\\s*GIẢI THÍCH|$))`, "i")
            );
            const speakerSpecificTranscript = spkTransMatch ? spkTransMatch[1].trim() : "";

            const spkExplMatch = answerSearchText.match(
              new RegExp(`(?:^|\\b)${letter}\\s*[:=\\-=–]\\s*([^\\n\\r]+?)(?=(?:\\s+[A-D]\\s*[:=\\-=–]|\\n|Nhiễu|$))`, "i")
            );
            const speakerSpecificExplanation = spkExplMatch ? spkExplMatch[1].trim() : "";

            return {
              id: q.id,
              speaker: q.prompt && isNaN(Number(q.prompt)) && !q.prompt.startsWith("<p>") ? q.prompt : `Speaker ${letter}`,
              correctAnswer: ans,
              explanation: q.explanation || `Giải thích đáp án cho Speaker ${letter}`,
              transcript: speakerSpecificTranscript || q.transcript || p2Script || "",
              speakerExplanation: speakerSpecificExplanation || "",
            };
          });

          result.part2.speakers = spkList;

          // finalOptions CHỈ bao gồm các options hợp lệ (< 80 ký tự), TUYỆT ĐỐI không chèn đoạn văn transcript vào!
          const validOptions = Array.from(
            new Set([
              ...extractedOptions,
              ...spkList.map((s: any) => s.correctAnswer),
            ])
          ).filter((o) => o && o.length <= 80 && !o.includes("\n") && !/^[0-9a-f-]{30,}$/i.test(o));

          result.part2.options = validOptions.length >= 4 ? validOptions : (result.part2.options || validOptions);

          const autoInstruction = `Four people are talking about ${p2Topic.toLowerCase()}. Match each person to the correct information.`;
          result.part2.instructions = p.instructions && p.instructions.trim().length > 5 ? p.instructions : autoInstruction;
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
          result.part3.passageText = p3Script;
          (result.part3 as any).transcript = p3Script;
        }
        if (p.translation_text || p.passage_translation) result.part3.translationText = p.translation_text || p.passage_translation;
        const p3RawAudio = p.audio_url || (p as any).file || "";
        const resolvedP3Audio = p3RawAudio && !p3RawAudio.startsWith("http") && !p3RawAudio.startsWith("/")
          ? `/uploads/audio/listening/${p3RawAudio}`
          : p3RawAudio;
        if (resolvedP3Audio) {
          result.part3.audioUrl = resolvedP3Audio;
        }
        if (questions.length > 0) {
          const opList = questions.map((q: any) => {
            let cor: "Man" | "Woman" | "Both" = "Both";
            const corStr = String(q.correct_answer || "").trim().toLowerCase();
            if (corStr === "man" || corStr === "0" || corStr === "a" || (corStr.includes("man") && !corStr.includes("woman"))) {
              cor = "Man";
            } else if (corStr === "woman" || corStr === "1" || corStr === "b" || corStr.includes("woman")) {
              cor = "Woman";
            } else if (corStr === "both" || corStr === "2" || corStr === "c" || corStr.includes("both")) {
              cor = "Both";
            }
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
            const rawRec1Audio = questions[0]?.audio_url || questions[0]?.audioUrl || p.audio_url || (p as any).file || "";
            const resolvedRec1Audio = rawRec1Audio && !rawRec1Audio.startsWith("http") && !rawRec1Audio.startsWith("/")
              ? `/uploads/audio/listening/${rawRec1Audio}`
              : rawRec1Audio;

            const rawRec2Audio = questions[2]?.audio_url || questions[2]?.audioUrl || questions[1]?.audio_url || rawRec1Audio;
            const resolvedRec2Audio = rawRec2Audio && !rawRec2Audio.startsWith("http") && !rawRec2Audio.startsWith("/")
              ? `/uploads/audio/listening/${rawRec2Audio}`
              : rawRec2Audio;

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
              audioUrl: resolvedRec1Audio,
              questions: qList.slice(0, 2),
            });
            recordings.push({
              recNum: 2,
              title: `${p4BaseTopic} (Recording 2/2)`,
              passageText: p4Script2 || p4Script1,
              transcript: p4Script2 || p4Script1,
              translationText: p.translation_text || p.passage_translation || "",
              audioUrl: resolvedRec2Audio,
              questions: qList.slice(2, 4),
            });
          } else {
            const rawAudio = p.audio_url || (p as any).file || "";
            const resolvedAudio = rawAudio && !rawAudio.startsWith("http") && !rawAudio.startsWith("/")
              ? `/uploads/audio/listening/${rawAudio}`
              : rawAudio;
            recordings.push({
              recNum: 1,
              title: `${p4BaseTopic} (Recording 1)`,
              passageText: p.passage_text || "",
              transcript: p.transcript || p.passage_text || "",
              translationText: p.translation_text || p.passage_translation || "",
              audioUrl: resolvedAudio,
              questions: qList,
            });
          }
          result.part4 = recordings;
        }
      }
    });

    return result;
  }

  
  // Dọn dẹp âm thanh kiểm tra khi unmount
  useEffect(() => {
    return () => {
      if (soundCheckAudioRef.current) {
        soundCheckAudioRef.current.pause();
        soundCheckAudioRef.current = null;
      }
    };
  }, []);

  // Sound Check playback logic
  const handleTestSoundCheck = () => {
    if (isTestingSound) {
      if (soundCheckAudioRef.current) {
        soundCheckAudioRef.current.pause();
        soundCheckAudioRef.current.currentTime = 0;
      }
      setIsTestingSound(false);
      return;
    }

    try {
      if (!soundCheckAudioRef.current) {
        soundCheckAudioRef.current = new Audio("/audio/sound-check.mp3");
      }
      const audio = soundCheckAudioRef.current;
      audio.volume = checkVolume;
      audio.currentTime = 0;
      setIsTestingSound(true);

      audio.onended = () => {
        setIsTestingSound(false);
        setSoundTested(true);
      };

      audio.onerror = () => {
        setIsTestingSound(false);
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            gain.gain.value = checkVolume * 0.15;
            osc.frequency.value = 440;
            osc.start();
            setTimeout(() => {
              osc.stop();
              setSoundTested(true);
            }, 600);
          }
        } catch (e) {
          console.warn("Audio fallback failed:", e);
        }
      };

      audio.play().catch((err) => {
        console.warn("Audio play prevented:", err);
        setIsTestingSound(false);
      });
    } catch (err) {
      console.error("Test sound failed:", err);
      setIsTestingSound(false);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setCheckVolume(newVol);
    if (soundCheckAudioRef.current) {
      soundCheckAudioRef.current.volume = newVol;
    }
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const handleStartExamFromCheck = () => {
    if (soundCheckAudioRef.current) {
      soundCheckAudioRef.current.pause();
      soundCheckAudioRef.current.currentTime = 0;
    }
    setIsTestingSound(false);
    setShowSoundCheck(false);
    try {
      localStorage.setItem(
        `aptis_draft_listening_${examId}`,
        JSON.stringify({
          p1Answers,
          p2Answers,
          p3Answers,
          p4Answers,
          activeStage,
          hasStarted: true,
          savedAt: new Date().toISOString(),
        })
      );
    } catch {}
  };

  // Timer đếm ngược thời gian phòng thi (chỉ tạm dừng nếu chưa bấm bắt đầu lần nào)
  useEffect(() => {
    if (loading || isPaused || isSubmitted) return;
    if (showSoundCheck && !isResumedSession) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, isPaused, isSubmitted, showSoundCheck, isResumedSession]);

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
    const targetAudioSrc = currentStage?.audioUrl;

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

  const totalAnsweredCount =
    Object.values(p1Answers).filter(Boolean).length +
    Object.values(p2Answers).filter(Boolean).length +
    Object.values(p3Answers).filter(Boolean).length +
    Object.values(p4Answers).filter(Boolean).length;

  useEffect(() => {
    if (typeof window === "undefined" || !examId || isReviewMode || isSubmitted) return;
    if (totalAnsweredCount > 0) {
      try {
        localStorage.setItem(
          `aptis_exam_progress_${examId}`,
          JSON.stringify({
            examId,
            status: "in_progress",
            correctQuestions: results.totalCorrect,
            answeredQuestions: totalAnsweredCount,
            totalQuestions: results.totalQuestionsInExam,
            completedParts: 1,
            totalParts: 1,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch {}
    }
  }, [
    examId,
    isReviewMode,
    isSubmitted,
    totalAnsweredCount,
    results.totalCorrect,
    results.totalQuestionsInExam,
  ]);

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
          localStorage.removeItem(`aptis_exam_progress_${examId}`);
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
      setShowSoundCheck(true);
      setSoundTested(false);

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
        localStorage.setItem(
          `aptis_exam_progress_${examId}`,
          JSON.stringify({
            examId,
            status: "completed",
            correctQuestions: results.totalCorrect,
            answeredQuestions: totalAnsweredCount,
            totalQuestions: results.totalQuestionsInExam,
            completedParts: 1,
            totalParts: 1,
            bestScore: `${results.totalScore}/${results.maxScore}`,
            bestCefr: results.cefr,
            updatedAt: new Date().toISOString(),
          })
        );
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
              setExamData(parsed);
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
      <ListeningResultScreen
        results={results}
        isRestarting={isRestarting}
        onRestart={handleRestartExam}
        onReview={() => {
          setIsReviewMode(true);
          setShowBilingualBox(true);
        }}
      />
    );
  }

  // =========================================================================
  // MÀN HÌNH SOUND CHECK & ONBOARDING (CHỐNG CHẶN AUTOPLAY, KIỂM TRA LOA / TAI NGHE)
  // =========================================================================
  if (showSoundCheck && !isReviewMode && !isSubmitted) {
    return (
      <SoundCheckScreen
        title={examData.title}
        soundTested={soundTested}
        isTestingSound={isTestingSound}
        checkVolume={checkVolume}
        onTestSound={handleTestSoundCheck}
        onVolumeChange={handleVolumeChange}
        onStart={handleStartExamFromCheck}
      />
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
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-3 sm:px-6 md:px-8 py-2 sm:py-2.5 flex items-center justify-between shadow-xs gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
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
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors text-foreground cursor-pointer shrink-0"
            title={isReviewMode ? "Quay lại lịch sử" : "Quay lại danh sách đề"}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-primary uppercase tracking-wider truncate block">
              {isReviewMode ? "Xem lại" : "Listening Practice"}
            </span>
            <span className="text-xs sm:text-sm md:text-base font-bold text-foreground truncate max-w-[120px] sm:max-w-xs md:max-w-none">
              {currentMeta.partName}
            </span>
          </div>
        </div>

        {/* Căn giữa: Đồng hồ đếm ngược & Sync status / Review mode score */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {isReviewMode ? (
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] sm:text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{results.totalScore}/{results.maxScore} đ</span>
            </div>
          ) : (
            <>
              <div className="hidden sm:block">
                <ExamSyncStatus
                  status={syncStatus}
                  lastSavedAt={lastSavedAt}
                  isResumed={isResumedSession}
                />
              </div>
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-xs sm:text-sm">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title={isReviewMode ? "Quay lại lịch sử" : "Thoát về danh sách đề"}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isReviewMode ? "Lịch sử" : "Thoát"}</span>
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
                  onClick={() =>
                    setFlaggedStages((prev) => ({
                      ...prev,
                      [activeStage]: !prev[activeStage],
                    }))
                  }
                  className={`flex items-center gap-1 px-3 py-1 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    flaggedStages[activeStage]
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                  title={flaggedStages[activeStage] ? "Bỏ gắn cờ câu này" : "Gắn cờ câu này để xem lại"}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${flaggedStages[activeStage] ? "fill-current" : ""}`} />
                  <span>{flaggedStages[activeStage] ? "Đã gắn cờ" : "Gắn cờ"}</span>
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
                      {currentStage?.audioUrl ? "Audio HD" : "Audio British AI"}
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

            <BilingualTranscriptPanel
              isOpen={showBilingualBox}
              onToggle={() => setShowBilingualBox((v) => !v)}
              isReviewMode={isReviewMode}
              bilingual={getCurrentBilingualData()}
              cachedTranslation={translationCache[`stage_${activeStage}`]}
              tab={bilingualTab}
              onTabChange={setBilingualTab}
              isTranslating={isTranslating}
              copied={copiedTrans}
              onCopy={handleCopyTranslation}
              onRequestTranslation={(force) => fetchBilingualTranslation(activeStage, force)}
            />
          </div>
          <div key={`listening-stage-wrap-${activeStage}`} className="part-transition space-y-5">
          {/* PART 1 */}
          {currentStage.partNum === 1 && (
            <ListeningPart1Card
              question={examData.part1[currentStage.subIndex]}
              userChoice={p1Answers[currentStage.subIndex]}
              isReviewMode={isReviewMode}
              onAnswer={(opt) => handleP1Answer(currentStage.subIndex, opt)}
            />
          )}

          {/* PART 2 */}
          {currentStage.partNum === 2 && (
            <ListeningPart2Card
              part2={examData.part2}
              answers={p2Answers}
              isReviewMode={isReviewMode}
              onAnswer={handleP2Answer}
            />
          )}

          {/* PART 3 */}
          {currentStage.partNum === 3 && (
            <ListeningPart3Card
              part3={examData.part3}
              answers={p3Answers}
              isReviewMode={isReviewMode}
              onAnswer={handleP3Answer}
            />
          )}

          {/* PART 4 */}
          {currentStage.partNum === 4 && (
            <ListeningPart4Card
              recording={examData.part4[currentStage.subIndex]}
              recIdx={currentStage.subIndex}
              totalRecordings={examData.part4.length}
              answers={p4Answers}
              isReviewMode={isReviewMode}
              onAnswer={handleP4Answer}
            />
          )}
          </div>
        </div>

        {/* CỘT PHẢI: MỤC LỤC XEM LẠI CHUẨN DESIGN SYSTEM KHI Ở REVIEW MODE */}
        {isReviewMode && (
          <ListeningReviewSidebar
            results={results}
            onlyShowWrong={onlyShowWrong}
            setOnlyShowWrong={setOnlyShowWrong}
            reviewFilterPart={reviewFilterPart}
            setReviewFilterPart={setReviewFilterPart}
            listeningStages={listeningStages}
            activeStage={activeStage}
            setActiveStage={setActiveStage}
            getStageResult={getStageResult}
            handleRestartExam={handleRestartExam}
            isRestarting={isRestarting}
            onBackToHistory={() => router.push("/history")}
          />
        )}
      </div>
      </main>

      {/* 4. BOTTOM BAR CHUẨN (CHỈ HIỂN THỊ KHI ĐANG THI, ẨN KHI Ở REVIEW MODE) */}
      {!isReviewMode && (
        <ListeningBottomDock
          listeningStages={listeningStages}
          currentStage={currentStage}
          activeStage={activeStage}
          setActiveStage={setActiveStage}
          p1Answers={p1Answers}
          p2Answers={p2Answers}
          p3Answers={p3Answers}
          p4Answers={p4Answers}
          flaggedStages={flaggedStages}
          onOpenSampleAnswers={() => setShowSampleAnswers(true)}
          onOpenReportModal={() => {
            setShowReportModal(true);
            setReportSent(false);
          }}
          onOpenDrawer={() => setShowDrawer(true)}
          onFinalSubmit={handleFinalSubmit}
        />
      )}

      <ListeningModalsAndDrawer
        showSampleAnswers={showSampleAnswers}
        setShowSampleAnswers={setShowSampleAnswers}
        showReportModal={showReportModal}
        setShowReportModal={setShowReportModal}
        reportType={reportType}
        setReportType={setReportType}
        reportNote={reportNote}
        setReportNote={setReportNote}
        reportSent={reportSent}
        setReportSent={setReportSent}
        showDrawer={showDrawer}
        setShowDrawer={setShowDrawer}
        drawerTab={drawerTab}
        setDrawerTab={setDrawerTab}
        listeningStages={listeningStages}
        currentStage={currentStage}
        activeStage={activeStage}
        setActiveStage={setActiveStage}
        examData={examData}
        p1Answers={p1Answers}
        p2Answers={p2Answers}
        p3Answers={p3Answers}
      />
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
