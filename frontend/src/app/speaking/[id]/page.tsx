"use client";

import { QuestionReportModal } from "@/components/exam/question-report-modal";

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { ExamExitConfirmModal } from "@/components/exam-exit-confirm-modal";
import {
  Mic,
  Clock,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Info,
  Check,
  FileEdit,
  AlertCircle,
  X,
  Trophy,
  LogOut,
  Send,
  Eye,
  EyeOff,
  Crown,
  ExternalLink,
  Lock,
  ChevronDown,
  Star,
  Loader2,
} from "lucide-react";

import {
  parseSpeakingVocabulary,
  playStartBeep,
  isVietnameseText,
  resolveSpeakingSampleAnswers,
  resolveSpeakingVocabularyHints,
  getSpeakingHallOfFameSubmissions,
  parseSubQuestions,
  cleanSpeakingImageUrl,
  formatTimerDisplay,
  detectSpeakingPartNumber,
} from "@/lib/speaking/speaking-exam-utils";
import type {
  SpeakingQuestion,
  HallOfFameCardItem,
} from "@/lib/speaking/speaking-exam-utils";
import { SpeakingAudioPlayer } from "@/components/speaking/speaking-audio-player";
import { SpeakingIntroScreen } from "@/components/speaking/speaking-intro-screen";
import { SpeakingQuestionCard } from "@/components/speaking/speaking-question-card";
import { SpeakingRecorderConsole } from "@/components/speaking/speaking-recorder-console";
import { SpeakingBottomDock } from "@/components/speaking/speaking-bottom-dock";
import { SpeakingCompletionModal } from "@/components/speaking/speaking-completion-modal";

function SpeakingExamRunnerContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const examId = (params.id as string) || "";
  const submissionIdParam = searchParams.get("submissionId") || "";
  const modeParam = searchParams.get("mode") || "";
  const isReviewUrl = modeParam === "review" && Boolean(submissionIdParam);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const isStartingSubmissionRef = useRef(false);

  const { user } = useAuth();
  const userAiQuota =
    user?.activeSubscription?.aiQuotaLeft ??
    user?.subscription?.aiQuotaLeft ??
    user?.user_subscriptions?.[0]?.ai_quota_left ??
    (user?.ai_quotas ? Math.max(0, user.ai_quotas.total_quota - user.ai_quotas.used_quota) : undefined);
  const aiQuota = userAiQuota !== undefined ? userAiQuota : 5;

  // Đọc query param ?part=p1 | p2 | p3 | p4
  const partParam = searchParams.get("part")?.toLowerCase() || "";
  let targetPart: number | null = null;
  if (partParam === "p1" || partParam === "1" || partParam === "part1") targetPart = 1;
  else if (partParam === "p2" || partParam === "2" || partParam === "part2") targetPart = 2;
  else if (partParam === "p3" || partParam === "3" || partParam === "part3") targetPart = 3;
  else if (partParam === "p4" || partParam === "4" || partParam === "part4") targetPart = 4;

  const [allQuestions, setAllQuestions] = useState<SpeakingQuestion[]>([]);
  const [questions, setQuestions] = useState<SpeakingQuestion[]>([]);
  const [examTitle, setExamTitle] = useState("Aptis Speaking Room");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Màn hình chuẩn bị thiết bị (Onboarding / Device Check)
  const [isIntroStep, setIsIntroStep] = useState(true);
  const [introSubStep, setIntroSubStep] = useState<"check" | "instructions">("check");
  const [micTested, setMicTested] = useState(false);
  const [soundTested, setSoundTested] = useState(false);
  const [isTestingSound, setIsTestingSound] = useState(false);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [deviceTestError, setDeviceTestError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  // State Machine: "ready" (Chờ người dùng) -> "prep" (Chuẩn bị) -> "speaking" (Nói) -> "finished" (Hoàn thành)
  const [stage, setStage] = useState<"ready" | "prep" | "speaking" | "finished">("ready");
  const [timer, setTimer] = useState(0);
  const [prepNotes, setPrepNotes] = useState("");
  const [isPrepPaused, setIsPrepPaused] = useState(false);
  const [isSpeakingPaused, setIsSpeakingPaused] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // Toggle & Tabs cho Bài Nói Mẫu (Screenshot 2)
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);
  const [sampleTab, setSampleTab] = useState<"b1" | "b2">("b1");

  // Bảng Kỳ Tích & Modal Pro (Screenshots 1 & 2)
  const [hofBandTab, setHofBandTab] = useState<"B1" | "B2" | "C">("B1");
  const [hofOffset, setHofOffset] = useState(0);
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  // Modal nháp & Modal báo lỗi
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportSent, setReportSent] = useState(false);

  const [recordedData, setRecordedData] = useState<
    Record<
      number,
      {
        audioUrl?: string | null;
        audioBlob?: Blob | null;
        duration?: number;
        aiResult?: any;
        prepNotes?: string;
        isCompleted?: boolean;
        isUploaded?: boolean;
      }
    >
  >({});
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [showMicPrompt, setShowMicPrompt] = useState(true);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [overallCefr, setOverallCefr] = useState<string | null>(null);

  const [aiResult, setAiResult] = useState<{
    band: string;
    score: number;
    pronunciation: number;
    fluency: number;
    grammar: number;
    vocabulary: number;
    transcript?: string;
    feedback: string[];
    detailedFeedback?: Array<{ criterion: string; score?: number; comment?: string }>;
    strengths: string[];
    upgrades: string[];
  } | null>(null);

  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);

  const {
    isRecording,
    isPaused: isMicPaused,
    recordingDuration,
    audioUrl,
    audioBlob,
    volumeLevel,
    permissionState,
    errorMessage: micError,
    isUploading,
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    uploadRecording,
  } = useAudioRecorder();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Tải dữ liệu đề thi thật từ Database thông qua API
  const loadExamData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getQuestions(examId);

      if (res.success && res.data) {
        setExamTitle(res.data.title || "Aptis Speaking Room");
        const parts = res.data.parts || [];
        const loaded: SpeakingQuestion[] = [];

        parts.forEach((p: any) => {
          let pNum: 1 | 2 | 3 | 4 = 1;
          if (p.partType === "PART_4" || p.part_number === 4) pNum = 4;
          else if (p.partType === "PART_3" || p.part_number === 3) pNum = 3;
          else if (p.partType === "PART_2" || p.part_number === 2) pNum = 2;
          else if (p.partType === "PART_1" || p.part_number === 1) pNum = 1;
          else pNum = detectSpeakingPartNumber(p, res.data?.title, targetPart);

          const pTitle = p.title || `Part ${pNum}`;
          const qList = p.questions || [];
          const partVocab = parseSpeakingVocabulary(p.passage_text || p.suggestion || p.instructions);

          // Lấy hình ảnh trực tiếp từ Backend DTO / Database (Single Source of Truth)
          const rawImg1: string | undefined = p.imageUrl || (p.image_url ? String(p.image_url).split(",")[0]?.trim() : undefined);
          const rawImg2: string | undefined = p.secondImageUrl || (p.image_url && String(p.image_url).includes(",") ? String(p.image_url).split(",")[1]?.trim() : undefined);

          const allQPrompts = qList.map((q: any) => q.prompt || "").join(" ");
          const contextDesc = `${p.title || ""} ${res.data?.title || ""} ${allQPrompts}`;

          if (pNum === 4) {
            // Chuẩn web gốc Aptis Kỳ Tích & British Council:
            // Part 4 là 1 bài thuyết trình dài (Long Turn: 60s chuẩn bị, 120s nói liên tục)
            // Hiển thị 3 câu hỏi phụ trên cùng 1 màn hình duy nhất, KHÔNG HIỂN THỊ TRANH
            if (qList.length > 0) {
              const firstQ = qList[0];
              let subQuestions: string[] = parseSubQuestions(firstQ.options);
              if (!subQuestions || subQuestions.length === 0) {
                if (qList.length > 1) {
                  subQuestions = qList.map((q: any) => q.prompt?.trim()).filter(Boolean);
                } else if (firstQ.prompt) {
                  const lines = firstQ.prompt
                    .split(/\n+/)
                    .map((l: string) => l.trim().replace(/^[-•*0-9.]+\s*/, ""))
                    .filter(Boolean);
                  if (lines.length > 1) subQuestions = lines;
                }
              }

              if (!subQuestions || subQuestions.length === 0) {
                subQuestions = [
                  firstQ.prompt || "Tell me about a personal experience related to this topic.",
                  "How did you feel about this situation and what did you learn from it?",
                  "Why do you think this issue is significant today?"
                ];
              }

              const rawExp =
                qList
                  .map((q: any) => (q.explanation || "").trim())
                  .filter(Boolean)
                  .join("\n\n") || (firstQ.explanation || "").trim();
              const hasVn = isVietnameseText(rawExp);

              loaded.push({
                id: firstQ.id,
                partNumber: 4,
                part: pTitle,
                title: firstQ.prompt && firstQ.prompt.length > 50 ? firstQ.prompt.substring(0, 50) + "..." : firstQ.prompt,
                prompt: firstQ.prompt,
                prepTime: p.prepTime || 60,
                speakTime: p.speakTime || 120,
                imageUrl: undefined,
                secondImageUrl: undefined,
                sampleAnswer: hasVn ? "" : rawExp,
                guidanceNote: hasVn ? rawExp : undefined,
                subQuestions: subQuestions.length > 0 ? subQuestions : undefined,
                topic: p.title ? p.title.replace(/^Part\s*\d+\s*[-:]*\s*/i, "").trim() : undefined,
                vocabulary: partVocab.length > 0 ? partVocab : undefined,
              });
            }
          } else {
            // Part 1, Part 2, Part 3:
            // Part 1: prep 5s, speak 30s
            // Part 2: prep 12s, speak 45s (chính xác 45s theo chuẩn BC)
            // Part 3: prep 12s, speak 45s (chính xác 45s theo chuẩn BC)
            const defaultPrep = p.prepTime || (pNum === 2 || pNum === 3 ? 12 : 5);
            const defaultSpeak = p.speakTime || (pNum === 1 ? 30 : 45);

            // Hình ảnh chuẩn hóa từ Database (Single Source of Truth - không gán fallback tĩnh)
            const resolvedImg1: string | undefined = cleanSpeakingImageUrl(rawImg1);
            const resolvedImg2: string | undefined = cleanSpeakingImageUrl(rawImg2);

            qList.forEach((q: any) => {
              const rawExp = (q.explanation || "").trim();
              const hasVn = isVietnameseText(rawExp);
              const partVocabHints =
                q.options?.vocabularyHints ||
                qList.find((item: any) => item.options?.vocabularyHints)?.options?.vocabularyHints;

              loaded.push({
                id: q.id,
                partNumber: pNum,
                part: pTitle,
                title: q.prompt && q.prompt.length > 50 ? q.prompt.substring(0, 50) + "..." : q.prompt,
                prompt: q.prompt,
                prepTime: defaultPrep,
                speakTime: defaultSpeak,
                imageUrl: resolvedImg1,
                secondImageUrl: pNum === 3 ? resolvedImg2 : undefined,
                sampleAnswer: hasVn ? "" : rawExp,
                guidanceNote: hasVn ? rawExp : undefined,
                topic: p.title ? p.title.replace(/^Part\s*\d+\s*[-:]*\s*/i, "").trim() : undefined,
                vocabulary: partVocab.length > 0 ? partVocab : undefined,
                vocabularyHints: partVocabHints,
              });
            });
          }
        });

        if (loaded.length === 0) {
          setError("Đề thi này chưa có câu hỏi nào được xuất bản.");
        } else {
          setAllQuestions(loaded);
          // LỌC THEO PART NẾU CÓ PARAM ?part=p1 | p2 | p3 | p4
          if (targetPart) {
            const filtered = loaded.filter((q) => q.partNumber === targetPart);
            setQuestions(filtered.length > 0 ? filtered : loaded);
          } else {
            setQuestions(loaded);
          }
        }
      } else {
        const errorMsg =
          res.message ||
          res.error?.message ||
          (res.error?.code === "FORBIDDEN" ? "Đề thi PRO yêu cầu đăng nhập và nâng cấp gói VIP để truy cập." : "Không thể tải nội dung đề thi nói từ cơ sở dữ liệu.");
        setError(errorMsg);
        if (res.error?.code === "FORBIDDEN" || errorMsg.includes("VIP") || errorMsg.includes("PRO")) {
          setIsProModalOpen(true);
        }
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Lỗi kết nối khi tải đề thi nói.";
      setError(errorMsg);
      if (err?.response?.status === 403 || errorMsg.includes("VIP") || errorMsg.includes("PRO")) {
        setIsProModalOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId) {
      loadExamData();
    }
  }, [examId, targetPart]);

  // Tạo phiên thi (submission) khi vào phòng Speaking hoặc Khôi phục bài cũ để Xem lại (Review Mode)
  useEffect(() => {
    async function initSpeakingSubmission() {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") || localStorage.getItem("token")
          : null;
      if (!token || !examId || questions.length === 0 || isStartingSubmissionRef.current) return;

      // NHÁNH 1: XEM LẠI TỪ LỊCH SỬ (/history) VỚI submissionId & mode=review
      if (isReviewUrl && submissionIdParam) {
        isStartingSubmissionRef.current = true;
        try {
          setLoading(true);
          const res = await api.submissions.getResult(submissionIdParam);
          if (res.success && res.data) {
            const sub = res.data;
            setSubmissionId(submissionIdParam);
            setIsReviewMode(true);
            setIsSubmitted(true);
            setStage("finished");

            const aiResultsList: any[] = Array.isArray(sub.ai_results) ? sub.ai_results : [];
            const answersList: any[] = Array.isArray(sub.answers) ? sub.answers : [];

            const restoredRecords: Record<number, any> = {};
            questions.forEach((q, idx) => {
              const foundAns = answersList.find(
                (a: any) => String(a.question_id || a.questionId) === String(q.id)
              );
              const foundAi = aiResultsList.find(
                (r: any) => String(r.question_id || r.questionId) === String(q.id)
              );

              const aiResultObj = foundAi
                ? {
                    score: typeof foundAi.score === "number" ? foundAi.score : 0,
                    band: foundAi.cefr_level ? `CEFR ${foundAi.cefr_level} Target` : "Đã có kết quả AI",
                    pronunciation: foundAi.pronunciation ?? foundAi.pronunciation_score ?? 0,
                    fluency: foundAi.fluency_score ?? 0,
                    grammar: foundAi.grammar_score ?? 0,
                    vocabulary: foundAi.vocabulary_score ?? 0,
                    transcript:
                      foundAi.transcript ||
                      foundAi.raw_ai_response?.transcribed_speech ||
                      foundAns?.transcript_text ||
                      foundAns?.transcript ||
                      "",
                    feedback: foundAi.feedback_summary ? [foundAi.feedback_summary] : [],
                    detailedFeedback: Array.isArray(foundAi.detailed_feedback)
                      ? foundAi.detailed_feedback
                      : [],
                    strengths: Array.isArray(foundAi.detailed_feedback)
                      ? foundAi.detailed_feedback
                          .filter((f: any) => f.criterion)
                          .map((f: any) => f.comment || "")
                      : [],
                    upgrades: foundAi.raw_ai_response?.improvement_suggestions || [],
                  }
                : null;

              if (foundAns || foundAi) {
                restoredRecords[idx] = {
                  audioUrl: foundAns?.audio_url || foundAns?.audioUrl || null,
                  duration: foundAns?.audio_duration || foundAns?.audioDuration || 30,
                  prepNotes: "",
                  aiResult: aiResultObj,
                  isCompleted: true,
                  isUploaded: true,
                };
              }
            });

            if (Object.keys(restoredRecords).length > 0) {
              setRecordedData(restoredRecords);
              if (restoredRecords[0]?.aiResult) {
                setAiResult(restoredRecords[0].aiResult);
              }
            }

            const finalScore =
              typeof sub.speaking_score === "number"
                ? sub.speaking_score
                : typeof sub.total_score === "number"
                ? sub.total_score
                : null;
            const finalCefr = sub.cefr_level || sub.cefrBand || null;
            if (finalScore !== null) setOverallScore(finalScore);
            if (finalCefr) setOverallCefr(finalCefr);

            if (sub.status === "PENDING_EVALUATION") {
              setIsEvaluating(true);
            }
          }
        } catch (err) {
          console.error("Lỗi nạp bài thi Speaking cũ:", err);
        } finally {
          setLoading(false);
        }
        return;
      }

      // NHÁNH 2: BẮT ĐẦU PHIÊN THI MỚI / TIẾP TỤC BÀI ĐANG LÀM
      if (submissionId) return;
      isStartingSubmissionRef.current = true;
      try {
        const res = await api.submissions.start(examId);
        if (res.success && res.data) {
          setSubmissionId(res.data.submissionId || res.data.id);
        }
      } catch (err) {
        console.warn("Speaking offline mode:", err);
      }
    }
    initSpeakingSubmission();
  }, [examId, questions.length, isReviewUrl, submissionIdParam]);

  // Làm lại bài thi Speaking mới (forceNew = true) và reset toàn bộ state phòng thi
  const handleRestartExam = async () => {
    try {
      setIsRestarting(true);
      if (timerRef.current) clearInterval(timerRef.current);
      inFlightUploadsRef.current = {};
      resetRecording();
      const res = await api.submissions.start(examId, true);
      if (res.success && res.data) {
        setSubmissionId(res.data.submissionId || res.data.id);
      }
      setRecordedData({});
      setOverallScore(null);
      setOverallCefr(null);
      setAiResult(null);
      setIsEvaluating(false);
      setIsSubmitted(false);
      setIsReviewMode(false);
      setIsCompletedModalOpen(false);
      setCurrentIndex(0);
      setStage("ready");
      setPrepNotes("");
      const targetUrl = `/speaking/${examId}${targetPart ? `?part=${targetPart}` : ""}`;
      if (isReviewUrl) {
        router.replace(targetUrl);
      }
    } catch (err) {
      console.error("Lỗi khi tạo lượt thi Speaking mới:", err);
    } finally {
      setIsRestarting(false);
    }
  };

  const currentQ = questions[currentIndex] || null;
  const completedCount = Object.values(recordedData).filter((r) => r.isCompleted).length;
  const currentAudioUrl = recordedData[currentIndex]?.audioUrl || audioUrl;
  const currentDuration = recordedData[currentIndex]?.duration || recordingDuration;
  const currentAiResult = recordedData[currentIndex]?.aiResult || aiResult;

  // Cảnh báo beforeunload chống vô tình F5/thoát trang khi đang thi Speaking
  useEffect(() => {
    if (completedCount === 0 && !isRecording) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Bạn đang làm bài thi Speaking. Rời khỏi trang có thể làm gián đoạn bài làm!";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [completedCount, isRecording]);

  // Tính toán số câu trong part hiện tại (Question X of 3)
  const SPEAKING_PART_NAMES: Record<number, string> = {
    1: "Personal Information",
    2: "Describing a Picture",
    3: "Describe, Compare & Explain",
    4: "Discuss Personal Experience & Opinion",
  };

  const availableParts = useMemo(() => {
    const partSet = new Set<number>();
    allQuestions.forEach((q) => {
      if (q.partNumber >= 1 && q.partNumber <= 4) {
        partSet.add(q.partNumber);
      }
    });
    return Array.from(partSet).sort((a, b) => a - b);
  }, [allQuestions]);

  const estimatedMinutes = useMemo(() => {
    const totalSeconds = questions.reduce(
      (acc, q) => acc + (q.prepTime || 0) + (q.speakTime || 0),
      0
    );
    return Math.max(1, Math.round(totalSeconds / 60));
  }, [questions]);

  const currentPartNum = currentQ ? currentQ.partNumber : targetPart || 1;
  const isFullTest = !targetPart && availableParts.length > 1;
  const headerPartTitle = isFullTest
    ? `Part ${currentPartNum} of ${availableParts.length || 4}`
    : `Part ${currentPartNum} · ${SPEAKING_PART_NAMES[currentPartNum] || "Practice"}`;

  const questionsInCurrentPart = currentQ
    ? questions.filter((q) => q.partNumber === currentQ.partNumber)
    : [];
  const indexInPart = currentQ
    ? questionsInCurrentPart.findIndex((q) => q.id === currentQ.id)
    : 0;
  const totalInPart = questionsInCurrentPart.length || 3;

  // Sample answers B1 & B2 kèm gợi ý dàn ý tiếng Việt (nếu có)
  const sampleData = useMemo(() => {
    if (!currentQ) return { b1: "", b2: "", guidance: undefined };
    return resolveSpeakingSampleAnswers(
      currentQ.prompt,
      currentQ.sampleAnswer,
      currentQ.partNumber,
      currentQ.guidanceNote
    );
  }, [currentQ]);

  const currentSampleText = sampleTab === "b1" ? sampleData.b1 : sampleData.b2;
  const currentGuidance = sampleData.guidance;
  const sampleWordCount = currentSampleText.trim()
    ? currentSampleText.trim().split(/\s+/).length
    : 0;

  // Gợi ý từ vựng & Collocations bên cạnh tranh (Part 2 & Part 3)
  const vocabHints = useMemo(() => {
    if (!currentQ) return { keywords: [], startingPhrases: [], linkingPhrases: [] };
    // Ưu tiên cao nhất: Dữ liệu AI / Giáo viên đã biên soạn và lưu trong cơ sở dữ liệu
    if (
      currentQ.vocabularyHints &&
      Array.isArray(currentQ.vocabularyHints.keywords) &&
      currentQ.vocabularyHints.keywords.length > 0
    ) {
      return {
        keywords: currentQ.vocabularyHints.keywords,
        startingPhrases: currentQ.vocabularyHints.startingPhrases || [],
        linkingPhrases: currentQ.vocabularyHints.linkingPhrases || [],
      };
    }
    // Fallback: Tự động phân tích theo topic & prompt
    return resolveSpeakingVocabularyHints(currentQ.prompt, currentQ.topic, currentQ.partNumber);
  }, [currentQ]);

  // Dữ liệu Bảng Kỳ Tích cho câu hỏi hiện tại
  const hofSubmissions = useMemo(() => {
    return getSpeakingHallOfFameSubmissions(currentQ?.topic, currentQ?.partNumber);
  }, [currentQ]);

  const b1Hof = hofSubmissions.filter((s) => s.band === "B1");
  const b2Hof = hofSubmissions.filter((s) => s.band === "B2");
  const cHof = hofSubmissions.filter((s) => s.band === "C");

  const currentHofList =
    hofBandTab === "B1" ? b1Hof : hofBandTab === "B2" ? b2Hof : cHof;

  const totalHofCount = hofSubmissions.length;

  const displayedHofCards = useMemo(() => {
    if (currentHofList.length === 0) return [];
    if (currentHofList.length <= 3) return currentHofList;
    const start = (hofOffset * 3) % currentHofList.length;
    const items: HallOfFameCardItem[] = [];
    for (let i = 0; i < 3; i++) {
      items.push(currentHofList[(start + i) % currentHofList.length]);
    }
    return items;
  }, [currentHofList, hofOffset]);

  // Khởi tạo hoặc khôi phục trạng thái cho câu hỏi
  const initQuestionState = useCallback(
    (index: number) => {
      if (!questions || questions.length === 0) return;
      const q = questions[index];
      if (!q) return;

      const record = recordedData[index];

      if (isReviewMode || (record?.isCompleted && record.audioUrl)) {
        setStage("finished");
        setTimer(0);
        setPrepNotes(record?.prepNotes || "");
        setAiResult(record?.aiResult || null);
      } else {
        resetRecording();
        setAiResult(null);
        setUploadedUrl(null);
        setPrepNotes("");
        setIsPrepPaused(false);
        setIsSpeakingPaused(false);

        // Mặc định ở trạng thái "ready", học viên chủ động đọc đề & từ vựng, không tự ép đếm giờ!
        setStage("ready");
        const defaultPrep =
          q.prepTime > 0
            ? q.prepTime
            : q.partNumber === 4
            ? 60
            : q.partNumber === 2 || q.partNumber === 3
            ? 12
            : 5;
        setTimer(defaultPrep);
      }
    },
    [questions, recordedData, resetRecording, isReviewMode]
  );

  useEffect(() => {
    if (questions.length > 0) {
      initQuestionState(currentIndex);
    }
  }, [currentIndex, questions.length, initQuestionState]);

  // Bộ đếm thời gian tự động (Prep -> Speaking -> Finished)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!currentQ || isReviewMode || stage === "ready" || stage === "finished") return;

    if (stage === "prep") {
      if (timer > 0) {
        if (!isPrepPaused) {
          timerRef.current = setInterval(() => {
            setTimer((t) => t - 1);
          }, 1000);
        }
      } else {
        // Hết thời gian chuẩn bị -> Bíp & Tự động ghi âm
        playStartBeep();
        setIsPrepPaused(false);
        setIsSpeakingPaused(false);
        setStage("speaking");
        const sTime =
          currentQ.speakTime ||
          (currentQ.partNumber === 4
            ? 120
            : currentQ.partNumber === 1
            ? 30
            : 45);
        setTimer(sTime);
        startRecording();
      }
    } else if (stage === "speaking") {
      if (timer > 0 && !isSpeakingPaused && !isMicPaused) {
        timerRef.current = setInterval(() => {
          setTimer((t) => t - 1);
        }, 1000);
      } else if (timer === 0) {
        // Hết thời gian nói -> Dừng ghi âm tự động & Lưu tức thì
        setIsSpeakingPaused(false);
        if (isRecording) {
          stopRecording().then((res) => {
            if (res && res.url) {
              setRecordedData((prev) => {
                const next = {
                  ...prev,
                  [currentIndex]: {
                    ...(prev[currentIndex] || {}),
                    audioUrl: res.url,
                    audioBlob: res.blob,
                    duration: res.duration,
                    prepNotes,
                    isCompleted: true,
                  },
                };
                if (typeof window !== "undefined" && examId) {
                  try {
                    const currentPartNum = currentQ?.partNumber || 1;
                    const oldStr = localStorage.getItem(`aptis_exam_progress_${examId}`);
                    let oldParts = [currentPartNum];
                    if (oldStr) {
                      const oldData = JSON.parse(oldStr);
                      if (Array.isArray(oldData.partsList)) {
                        oldParts = Array.from(new Set([...oldData.partsList, currentPartNum]));
                      }
                    }
                    const completedQCount = Object.values(next).filter(
                      (item: any) => item?.isCompleted || item?.audioUrl
                    ).length;
                    localStorage.setItem(
                      `aptis_exam_progress_${examId}`,
                      JSON.stringify({
                        examId,
                        status: "in_progress",
                        correctQuestions: completedQCount,
                        answeredQuestions: completedQCount,
                        totalQuestions: questions.length,
                        partsList: oldParts,
                        completedParts: Math.max(1, oldParts.length),
                        totalParts: availableParts.length || 4,
                        updatedAt: new Date().toISOString(),
                      })
                    );
                  } catch {}
                }
                return next;
              });
              if (res.blob) {
                uploadQuestionAudioInBackground(currentIndex, res.blob, res.duration);
              }
            }
            setStage("finished");
          });
        } else {
          setStage("finished");
        }
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    stage,
    timer,
    isRecording,
    isPrepPaused,
    isSpeakingPaused,
    isMicPaused,
    currentQ,
    startRecording,
    stopRecording,
    isReviewMode,
    currentIndex,
    prepNotes,
  ]);

  // Chọn câu hỏi từ danh sách
  const selectQuestion = async (index: number) => {
    if (index === currentIndex && !isReviewMode) return;
    if (isRecording) {
      const res = await stopRecording();
      if (res && res.url) {
        setRecordedData((prev) => ({
          ...prev,
          [currentIndex]: {
            ...(prev[currentIndex] || {}),
            audioUrl: res.url,
            audioBlob: res.blob,
            duration: res.duration,
            prepNotes,
            isCompleted: true,
          },
        }));
      }
    }
    setIsReviewMode(false);
    setCurrentIndex(index);
  };

  // Nút Bắt đầu: Chạy đồng hồ chuẩn bị
  const handleStartPrep = () => {
    if (!currentQ) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPrepPaused(false);
    setIsSpeakingPaused(false);
    const pTime =
      currentQ.prepTime > 0
        ? currentQ.prepTime
        : currentQ.partNumber === 4
        ? 60
        : currentQ.partNumber === 2 || currentQ.partNumber === 3
        ? 12
        : 5;
    setTimer(pTime);
    setStage("prep");
  };

  // Nút Sẵn sàng: Thí sinh muốn nói luôn, bỏ qua thời gian chuẩn bị
  const handleStartSpeakingNow = async () => {
    if (!currentQ) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPrepPaused(false);
    setIsSpeakingPaused(false);
    playStartBeep();
    setStage("speaking");
    const sTime =
      currentQ.speakTime ||
      (currentQ.partNumber === 4
        ? 120
        : currentQ.partNumber === 1
        ? 30
        : 45);
    setTimer(sTime);
    await startRecording();
  };

  // Tạm dừng / Tiếp tục ghi âm khi đang nói
  const handleToggleSpeakingPause = () => {
    if (isSpeakingPaused || isMicPaused) {
      resumeRecording();
      setIsSpeakingPaused(false);
    } else {
      pauseRecording();
      setIsSpeakingPaused(true);
    }
  };

  // Nút Thu lại: Làm lại từ đầu câu này
  const handleRetakeSpeaking = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    delete inFlightUploadsRef.current[currentIndex];
    await stopRecording();
    resetRecording();
    setIsPrepPaused(false);
    setIsSpeakingPaused(false);
    const pTime =
      currentQ?.prepTime > 0
        ? currentQ.prepTime
        : currentQ?.partNumber === 4
        ? 60
        : 12;
    setTimer(pTime);
    setStage("ready");
  };

  const inFlightUploadsRef = useRef<Record<number, Promise<string | null>>>({});

  // Helper upload ngầm file ghi âm của từng câu ngay khi thu xong (Progressive Upload + Deduplication)
  const uploadQuestionAudioInBackground = useCallback(
    async (qIdx: number, blob: Blob, duration: number, subIdOverride?: string | null) => {
      if (inFlightUploadsRef.current[qIdx] !== undefined) {
        return inFlightUploadsRef.current[qIdx];
      }

      const uploadTask = (async (): Promise<string | null> => {
        const q = questions[qIdx];
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken") ||
              localStorage.getItem("token") ||
              localStorage.getItem("aptis_token")
            : null;
        if (!q || !token || !blob) return null;

        let activeSubId = subIdOverride || submissionId;
        if (!activeSubId && examId) {
          try {
            const startRes = await api.submissions.start(examId);
            if (startRes.success && startRes.data) {
              activeSubId = startRes.data.submissionId || startRes.data.id;
              setSubmissionId(activeSubId);
            }
          } catch {}
        }
        if (!activeSubId) return null;

        try {
          const remoteUrl = await uploadRecording(activeSubId, q.id, token, blob, duration || 30);
          if (remoteUrl) {
            setRecordedData((prev) => ({
              ...prev,
              [qIdx]: {
                ...(prev[qIdx] || {}),
                audioUrl: prev[qIdx]?.audioUrl || remoteUrl,
                isUploaded: true,
              },
            }));
            return remoteUrl;
          }
        } catch (err) {
          console.warn(`[Progressive Upload] Lỗi upload câu ${qIdx + 1}:`, err);
        }
        return null;
      })().finally(() => {
        delete inFlightUploadsRef.current[qIdx];
      });

      inFlightUploadsRef.current[qIdx] = uploadTask;
      return uploadTask;
    },
    [questions, submissionId, examId, uploadRecording]
  );

  // Nút Hoàn thành (Thí sinh nộp câu nói sớm)
  const handleStopSpeakingEarly = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSpeakingPaused(false);
    const res = await stopRecording();
    if (res && res.url) {
      setRecordedData((prev) => ({
        ...prev,
        [currentIndex]: {
          ...(prev[currentIndex] || {}),
          audioUrl: res.url,
          audioBlob: res.blob,
          duration: res.duration,
          prepNotes,
          isCompleted: true,
        },
      }));
      if (res.blob) {
        uploadQuestionAudioInBackground(currentIndex, res.blob, res.duration);
      }
    }
    setStage("finished");

    // Đồng bộ tiến độ ngay lập tức vào localStorage
    if (typeof window !== "undefined" && examId) {
      try {
        const currentPartNum = currentQ?.partNumber || 1;
        const oldStr = localStorage.getItem(`aptis_exam_progress_${examId}`);
        let oldParts = [currentPartNum];
        if (oldStr) {
          const oldData = JSON.parse(oldStr);
          if (Array.isArray(oldData.partsList)) {
            oldParts = Array.from(new Set([...oldData.partsList, currentPartNum]));
          }
        }
        const completedQCount =
          Object.values({
            ...recordedData,
            [currentIndex]: { ...(recordedData[currentIndex] || {}), isCompleted: true },
          }).filter((item: any) => item?.isCompleted || item?.audioUrl).length;
        localStorage.setItem(
          `aptis_exam_progress_${examId}`,
          JSON.stringify({
            examId,
            status: "in_progress",
            correctQuestions: completedQCount,
            answeredQuestions: completedQCount,
            totalQuestions: questions.length,
            partsList: oldParts,
            completedParts: Math.max(1, oldParts.length),
            totalParts: availableParts.length || 4,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch {}
    }
  };

  // Kiểm tra âm thanh (Loa / Tai nghe) bằng Web Audio API tiếng bíp
  const handleTestSound = async () => {
    if (isTestingSound) return;
    setIsTestingSound(true);
    setDeviceTestError(null);
    try {
      playStartBeep();
      await new Promise((r) => setTimeout(r, 600));
      setSoundTested(true);
    } catch (err: any) {
      setDeviceTestError(
        err?.message ||
          "Không thể phát âm thanh kiểm tra. Vui lòng kiểm tra loa/tai nghe."
      );
    } finally {
      setIsTestingSound(false);
    }
  };

  // Kiểm tra Microphone bằng MediaDevices API
  const handleTestMic = async () => {
    if (isTestingMic) return;
    setIsTestingMic(true);
    setDeviceTestError(null);
    try {
      const ok = await requestPermission();
      if (!ok) {
        throw new Error(
          "Không thể kết nối Microphone. Vui lòng cấp quyền Micro trên trình duyệt."
        );
      }
      setMicTested(true);
    } catch (err: any) {
      setDeviceTestError(err?.message || "Lỗi kiểm tra microphone");
      setMicTested(false);
    } finally {
      setIsTestingMic(false);
    }
  };

  // Áp dụng danh sách kết quả chấm AI từ Server vào toàn bộ các câu trong bài
  const applyBatchAiResults = useCallback(
    (aiResultsList: any[], overallScoreVal?: number | null, overallCefrVal?: string | null) => {
      if (!Array.isArray(aiResultsList) || aiResultsList.length === 0) return;

      setRecordedData((prev) => {
        const next = { ...prev };
        questions.forEach((q, idx) => {
          const foundAi = aiResultsList.find(
            (r: any) => String(r.question_id || r.questionId) === String(q.id)
          );
          if (foundAi) {
            const evalScore = typeof foundAi.score === "number" ? foundAi.score : 0;
            const evaluatedResult = {
              band: foundAi.cefr_level ? `CEFR ${foundAi.cefr_level} Target` : "Đã có kết quả AI",
              score: evalScore,
              pronunciation: foundAi.pronunciation ?? foundAi.pronunciation_score ?? 0,
              fluency: foundAi.fluency_score ?? 0,
              grammar: foundAi.grammar_score ?? 0,
              vocabulary: foundAi.vocabulary_score ?? 0,
              transcript:
                foundAi.transcript ||
                foundAi.raw_ai_response?.transcribed_speech ||
                "",
              feedback: [foundAi.feedback_summary || "Phân tích chi tiết bài nói của bạn."],
              detailedFeedback: Array.isArray(foundAi.detailed_feedback)
                ? foundAi.detailed_feedback
                : [],
              strengths: Array.isArray(foundAi.detailed_feedback)
                ? foundAi.detailed_feedback
                    .filter((f: any) => f.criterion)
                    .map((f: any) => f.comment || "")
                : [],
              upgrades: foundAi.raw_ai_response?.improvement_suggestions || [],
            };
            next[idx] = {
              ...(next[idx] || {}),
              aiResult: evaluatedResult,
              isCompleted: true,
            };
            if (idx === currentIndex) {
              setAiResult(evaluatedResult);
            }
          }
        });
        return next;
      });

      const computedScore =
        typeof overallScoreVal === "number"
          ? overallScoreVal
          : Math.round(
              aiResultsList.reduce((acc, r) => acc + (Number(r.score) || 0), 0) /
                aiResultsList.length
            );
      const computedCefr =
        overallCefrVal || aiResultsList[aiResultsList.length - 1]?.cefr_level || null;

      setOverallScore(computedScore);
      if (computedCefr) setOverallCefr(computedCefr);

      if (typeof window !== "undefined" && examId) {
        try {
          const totalPartsCount = availableParts.length || 4;
          const finishedPartsCount = targetPart ? 1 : totalPartsCount;
          const oldStr = localStorage.getItem(`aptis_exam_progress_${examId}`);
          const oldData = oldStr ? JSON.parse(oldStr) : {};
          const aiScoredCount = aiResultsList.filter((r: any) => (Number(r.score) || 0) > 0).length;
          localStorage.setItem(
            `aptis_exam_progress_${examId}`,
            JSON.stringify({
              ...oldData,
              examId,
              status: "completed",
              correctQuestions: aiScoredCount > 0 ? aiScoredCount : aiResultsList.length,
              answeredQuestions: Math.max(aiResultsList.length, oldData.answeredQuestions || 0),
              totalQuestions: questions.length,
              completedParts: finishedPartsCount,
              totalParts: totalPartsCount,
              bestScore: `${computedScore}/50`,
              ...(computedCefr ? { bestCefr: computedCefr } : {}),
              updatedAt: new Date().toISOString(),
            })
          );
        } catch {}
      }
    },
    [questions, currentIndex, examId, availableParts.length, targetPart]
  );

  // Polling tự động kiểm tra kết quả khi đang chờ AI chấm ngầm ở cuối bài
  useEffect(() => {
    if (!isEvaluating || !submissionId) return;

    let isMounted = true;
    const pollTimer = setInterval(async () => {
      try {
        const res = await api.submissions.getResult(submissionId);
        if (!isMounted || !res.success || !res.data) return;
        const sub = res.data;
        const aiList: any[] = Array.isArray(sub.ai_results) ? sub.ai_results : [];
        if (aiList.length > 0) {
          applyBatchAiResults(
            aiList,
            sub.speaking_score ?? sub.total_score ?? null,
            sub.cefr_level ?? sub.cefrBand ?? null
          );
        }
        if (
          sub.status === "GRADED" ||
          (questions.length > 0 && aiList.length >= questions.length)
        ) {
          setIsEvaluating(false);
          clearInterval(pollTimer);
        }
      } catch (err) {
        console.warn("[Polling Speaking Result] Lỗi kiểm tra tiến trình chấm:", err);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, [isEvaluating, submissionId, applyBatchAiResults, questions.length]);

  // Nộp bài thi & Kích hoạt chấm điểm AI một thể cho toàn bộ các câu trong bài
  const handleFinishExam = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    let latestData = { ...recordedData };
    if (isRecording) {
      const res = await stopRecording();
      if (res && res.url) {
        const item = {
          ...(latestData[currentIndex] || {}),
          audioUrl: res.url,
          audioBlob: res.blob,
          duration: res.duration,
          prepNotes,
          isCompleted: true,
        };
        latestData[currentIndex] = item;
        setRecordedData(latestData);
      }
      setStage("finished");
    }

    setIsSubmitted(true);
    setIsCompletedModalOpen(true);

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
          localStorage.getItem("token") ||
          localStorage.getItem("aptis_token")
        : null;

    const totalPartsCount = availableParts.length || 4;
    const finishedPartsCount = targetPart ? 1 : totalPartsCount;

    if (typeof window !== "undefined" && examId) {
      try {
        const oldStr = localStorage.getItem(`aptis_exam_progress_${examId}`);
        const oldData = oldStr ? JSON.parse(oldStr) : {};
        const completedQCount = Object.values(latestData).filter(
          (item: any) => item?.isCompleted || item?.audioUrl || item?.audioBlob
        ).length;
        localStorage.setItem(
          `aptis_exam_progress_${examId}`,
          JSON.stringify({
            ...oldData,
            examId,
            status: "completed",
            correctQuestions: completedQCount,
            answeredQuestions: completedQCount,
            totalQuestions: questions.length,
            completedParts: finishedPartsCount,
            totalParts: totalPartsCount,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch {}
    }

    if (!token) return;

    setIsEvaluating(true);

    try {
      let activeSubId = submissionId;
      if (!activeSubId && examId) {
        const startRes = await api.submissions.start(examId);
        if (startRes.success && startRes.data) {
          activeSubId = startRes.data.submissionId || startRes.data.id;
          setSubmissionId(activeSubId);
        }
      }

      if (!activeSubId) {
        setIsEvaluating(false);
        return;
      }

      // 1. Đảm bảo tất cả các câu có thu âm đều đã được upload file vật lý lên Server (tái sử dụng Promise nếu đang upload dở)
      for (const [idxStr, rec] of Object.entries(latestData)) {
        const idxNum = Number(idxStr);
        const q = questions[idxNum];
        if (q && rec?.audioBlob && !rec.isUploaded) {
          const remoteUrl = await uploadQuestionAudioInBackground(
            idxNum,
            rec.audioBlob,
            rec.duration || 30,
            activeSubId
          );
          if (remoteUrl) {
            latestData[idxNum] = { ...rec, isUploaded: true };
          }
        }
      }
      setRecordedData({ ...latestData });

      // 2. Đăng ký các câu hỏi bị bỏ qua trong phạm vi bài thi hiện tại vào submission.answers
      // để Backend tính đúng mẫu số trung bình (câu bỏ trống = 0 điểm thay vì bị loại khỏi mẫu số)
      const skippedAnswersPayload = questions
        .map((q, idx) => ({ q, idx }))
        .filter(({ q, idx }) => {
          const rec = latestData[idx];
          const isValidDbUuid = Boolean(q.id && q.id.length > 10 && !q.id.startsWith("fb-"));
          return isValidDbUuid && !rec?.audioBlob && !rec?.isUploaded && !rec?.audioUrl;
        })
        .map(({ q }) => ({
          questionId: q.id,
          audioDuration: 0,
        }));

      if (skippedAnswersPayload.length > 0) {
        try {
          await api.submissions.autosave(activeSubId, skippedAnswersPayload);
        } catch (autosaveErr) {
          console.warn("[Speaking Submit] Không thể lưu danh sách câu bỏ trống:", autosaveErr);
        }
      }

      // 3. Nộp bài thi chính thức
      await api.submissions.submit(activeSubId);

      // 4. Kích hoạt chấm điểm AI tổng thể toàn bài (1 lượt Quota duy nhất)
      const aiRes = await api.aiGrading.evaluate(activeSubId);
      if (aiRes.success && aiRes.data) {
        const aiList = aiRes.data.aiResults || [];
        applyBatchAiResults(
          aiList,
          aiRes.data.overallScore ?? null,
          aiRes.data.cefrLevel ?? null
        );
        setIsEvaluating(false);
      }
    } catch (err) {
      console.warn("Đang chờ tiến trình chấm điểm AI ngầm hoàn tất:", err);
    }
  };

  // Luyện tập lại câu này
  const handleRetry = () => {
    delete inFlightUploadsRef.current[currentIndex];
    setRecordedData((prev) => {
      const copy = { ...prev };
      delete copy[currentIndex];
      return copy;
    });
    resetRecording();
    setAiResult(null);
    setUploadedUrl(null);
    setPrepNotes("");
    if (!currentQ) return;
    if (currentQ.prepTime > 0) {
      setStage("prep");
      setTimer(currentQ.prepTime);
    } else {
      setStage("prep");
      setTimer(5);
    }
  };

  // Chuyển sang câu hỏi kế tiếp
  const handleNextQuestion = async () => {
    if (isRecording) {
      const res = await stopRecording();
      if (res && res.url) {
        setRecordedData((prev) => ({
          ...prev,
          [currentIndex]: {
            ...(prev[currentIndex] || {}),
            audioUrl: res.url,
            audioBlob: res.blob,
            duration: res.duration,
            prepNotes,
            isCompleted: true,
          },
        }));
        if (res.blob) {
          uploadQuestionAudioInBackground(currentIndex, res.blob, res.duration);
        }
      }
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Quay lại câu trước
  const handlePrevQuestion = async () => {
    if (isRecording) {
      const res = await stopRecording();
      if (res && res.url) {
        setRecordedData((prev) => ({
          ...prev,
          [currentIndex]: {
            ...(prev[currentIndex] || {}),
            audioUrl: res.url,
            audioBlob: res.blob,
            duration: res.duration,
            prepNotes,
            isCompleted: true,
          },
        }));
        if (res.blob) {
          uploadQuestionAudioInBackground(currentIndex, res.blob, res.duration);
        }
      }
    }
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Giữ tương thích chữ ký hàm
  const handleAIEvaluation = async () => {
    await handleFinishExam();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans select-none pb-20">
      {/* 1. TOP HEADER PHÒNG THI CHUẨN */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (isReviewMode) {
                router.push("/history");
              } else if (isSubmitted || stage === "finished") {
                router.push("/speaking");
              } else {
                setShowExitConfirm(true);
              }
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors text-foreground cursor-pointer shrink-0"
            title={isReviewMode ? "Quay lại Lịch sử làm bài" : "Quay lại danh sách đề"}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-primary uppercase tracking-wider truncate block">
              {isReviewMode ? "Xem lại" : "Speaking Practice"}
            </span>
            <span className="text-xs sm:text-sm md:text-base font-bold text-foreground truncate max-w-[120px] sm:max-w-xs md:max-w-none">
              {headerPartTitle}
            </span>
          </div>
        </div>

        {/* Căn giữa: Bộ chọn Part (chỉ hiển thị khi đề thi thực sự có từ 2 Part trở lên) */}
        {availableParts.length > 1 && (
          <div className="hidden sm:flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
            {availableParts.map((pNum) => {
              const isSelected = (targetPart || currentQ?.partNumber) === pNum;
              return (
                <Link
                  key={pNum}
                  href={`/speaking/${examId}?part=${pNum}`}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Part {pNum}
                </Link>
              );
            })}
            <Link
              href={`/speaking/${examId}`}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                !targetPart
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Full Test
            </Link>
          </div>
        )}

        {/* Bên phải: Chế độ Xem lại & Nút Thoát */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isReviewMode && (
            <>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 font-bold text-xs">
                <Eye className="w-3.5 h-3.5" />
                <span>Xem lại</span>
              </span>
              <button
                type="button"
                onClick={handleRestartExam}
                disabled={isRestarting}
                className="tech-btn px-2.5 sm:px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isRestarting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Làm lại đề mới</span>
                <span className="sm:hidden">Làm lại</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              if (isReviewMode) {
                router.push("/history");
              } else if (isSubmitted || stage === "finished") {
                router.push("/speaking");
              } else {
                setShowExitConfirm(true);
              }
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title={isReviewMode ? "Quay lại Lịch sử làm bài" : "Thoát về danh sách đề"}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isReviewMode ? "Về Lịch sử" : "Thoát"}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 py-6 px-3 md:px-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Micro Permission Notice */}
          {permissionState !== "granted" && showMicPrompt && (
            <div className="mb-6 p-4 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xs text-foreground">
                    Cấp quyền Microphone để ghi âm giọng nói
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Hệ thống sẽ ghi âm và chuyển âm thanh thành văn bản để chấm điểm AI.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await requestPermission();
                    if (ok) setShowMicPrompt(false);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-1.5"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Bật Micro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMicPrompt(false)}
                  className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Bỏ qua
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-16 text-center rounded-2xl border border-border bg-card animate-pulse">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-xs font-semibold text-muted-foreground">Đang tải đề thi Speaking...</p>
            </div>
          )}

          {/* Error / VIP State */}
          {error && !loading && (
            <div className={`p-8 text-center rounded-2xl border max-w-lg mx-auto ${
              error.includes("VIP") || error.includes("PRO")
                ? "border-amber-500/30 bg-amber-500/10 shadow-lg shadow-amber-500/5"
                : "border-destructive/30 bg-destructive/10"
            }`}>
              {error.includes("VIP") || error.includes("PRO") ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h2 className="font-heading font-extrabold text-base text-foreground mb-1.5 flex items-center justify-center gap-1.5">
                    <span>Đề Thi Thuộc Gói PRO / VIP</span>
                    <Crown className="w-4 h-4 text-amber-500 inline" />
                  </h2>
                  <p className="text-xs text-muted-foreground mb-6 leading-relaxed max-w-sm mx-auto">
                    {error}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsProModalOpen(true)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Nâng cấp VIP ngay</span>
                    </button>
                    <Link
                      href="/speaking"
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all"
                    >
                      Chọn đề miễn phí khác
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
                  <h2 className="font-heading font-bold text-sm text-foreground mb-1">
                    Không thể tải đề thi nói
                  </h2>
                  <p className="text-xs text-muted-foreground mb-4">{error}</p>
                  <Link
                    href="/speaking"
                    className="inline-block px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
                  >
                    Quay lại danh sách đề
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Main Question Body & Right Recorder */}
          {!loading && !error && currentQ && (
            isIntroStep && !isReviewMode ? (
              <SpeakingIntroScreen
                examTitle={examTitle}
                questionCount={questions.length}
                targetPart={targetPart}
                estimatedMinutes={estimatedMinutes}
                introSubStep={introSubStep}
                onSubStepChange={setIntroSubStep}
                onStart={() => setIsIntroStep(false)}
                micTested={micTested}
                isTestingMic={isTestingMic}
                onTestMic={handleTestMic}
                soundTested={soundTested}
                isTestingSound={isTestingSound}
                onTestSound={handleTestSound}
                deviceTestError={deviceTestError}
              />
            ) : (
              <div className="flex flex-col lg:flex-row items-start gap-6">
                <SpeakingQuestionCard
                  currentQ={currentQ}
                  indexInPart={indexInPart}
                  totalInPart={totalInPart}
                  vocabHints={vocabHints}
                  stage={stage}
                  timer={timer}
                  prepNotes={prepNotes}
                  setPrepNotes={setPrepNotes}
                  showSampleAnswer={showSampleAnswer}
                  currentGuidance={currentGuidance}
                  sampleTab={sampleTab}
                  setSampleTab={setSampleTab}
                  currentSampleText={currentSampleText}
                  sampleWordCount={sampleWordCount}
                  totalHofCount={totalHofCount}
                  hofBandTab={hofBandTab}
                  setHofBandTab={setHofBandTab}
                  b1Hof={b1Hof}
                  b2Hof={b2Hof}
                  cHof={cHof}
                  displayedHofCards={displayedHofCards}
                  currentHofList={currentHofList}
                  setHofOffset={setHofOffset}
                  setIsProModalOpen={setIsProModalOpen}
                  isReviewMode={isReviewMode}
                  currentIndex={currentIndex}
                  totalQuestions={questions.length}
                  onPrevQuestion={handlePrevQuestion}
                  onNextQuestion={handleNextQuestion}
                />

                <SpeakingRecorderConsole
                  isReviewMode={isReviewMode}
                  questions={questions}
                  currentIndex={currentIndex}
                  setCurrentIndex={setCurrentIndex}
                  recordedData={recordedData}
                  setIsSubmitted={setIsSubmitted}
                  stage={stage}
                  currentQ={currentQ}
                  timer={timer}
                  setTimer={setTimer}
                  isPrepPaused={isPrepPaused}
                  setIsPrepPaused={setIsPrepPaused}
                  handleStartSpeakingNow={handleStartSpeakingNow}
                  handleStartPrep={handleStartPrep}
                  isSpeakingPaused={isSpeakingPaused}
                  isMicPaused={isMicPaused}
                  volumeLevel={volumeLevel}
                  handleToggleSpeakingPause={handleToggleSpeakingPause}
                  handleRetakeSpeaking={handleRetakeSpeaking}
                  handleStopSpeakingEarly={handleStopSpeakingEarly}
                  currentDuration={currentDuration}
                  currentAudioUrl={currentAudioUrl}
                  handleRetry={handleRetry}
                  handleAIEvaluation={handleAIEvaluation}
                  isEvaluating={isEvaluating}
                  currentAiResult={currentAiResult}
                  showDetailedFeedback={showDetailedFeedback}
                  setShowDetailedFeedback={setShowDetailedFeedback}
                  onNextQuestion={handleNextQuestion}
                  onFinishExam={handleFinishExam}
                  onOpenCompletionModal={() => setIsCompletedModalOpen(true)}
                />
              </div>
          )
        )}
      </div>
    </main>

    <SpeakingBottomDock
      isReviewMode={isReviewMode}
      isIntroStep={isIntroStep}
      questions={questions}
      currentIndex={currentIndex}
      showSampleAnswer={showSampleAnswer}
      setShowSampleAnswer={setShowSampleAnswer}
      setIsScratchpadOpen={setIsScratchpadOpen}
      setIsReportOpen={setIsReportOpen}
      handlePrevQuestion={handlePrevQuestion}
      handleNextQuestion={handleNextQuestion}
      handleFinishExam={handleFinishExam}
      targetPart={targetPart || (availableParts.length === 1 ? availableParts[0] : null)}
      aiQuota={aiQuota}
    />

      {/* SCRATCHPAD MODAL (Nháp) */}
      {isScratchpadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-primary" />
                <h3 className="font-heading font-bold text-sm text-foreground">
                  Bản nháp thí sinh (Scratchpad)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScratchpadOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-2">
              <p className="text-xs text-muted-foreground">
                Gõ nhanh các ý chính, từ vựng khóa để chuẩn bị trước khi phát biểu:
              </p>
              <textarea
                value={prepNotes}
                onChange={(e) => setPrepNotes(e.target.value)}
                placeholder="Ý 1: ...&#10;Ý 2: ...&#10;Từ vựng C1: furthermore, consequence..."
                className="w-full h-44 p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setIsScratchpadOpen(false)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
              >
                Lưu và Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT MODAL (Báo lỗi) */}
      <QuestionReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        examId={examId}
        examTitle={examTitle || "Bài thi Speaking"}
        questionNumber={currentIndex + 1}
        skillName="Speaking"
      />

      <SpeakingCompletionModal
        isOpen={isCompletedModalOpen}
        onClose={() => setIsCompletedModalOpen(false)}
        onReview={() => {
          setIsCompletedModalOpen(false);
          setIsReviewMode(true);
          setStage("finished");
          setCurrentIndex(0);
        }}
        targetPart={targetPart || (availableParts.length === 1 ? availableParts[0] : null)}
        examTitle={examTitle}
        completedCount={completedCount}
        questions={questions}
        handleRestartExam={handleRestartExam}
        isRestarting={isRestarting}
        isEvaluating={isEvaluating}
        estimatedScore={overallScore ?? aiResult?.score ?? null}
        cefrBand={overallCefr ?? aiResult?.band ?? null}
      />

      {/* MODAL TÍNH NĂNG DÀNH CHO PRO (Screenshot 2) */}
      {isProModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setIsProModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
              <Crown className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-heading font-bold text-base text-foreground">
                Tính năng dành cho Pro
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bảng Kỳ Tích dành cho thành viên Pro. Nâng cấp để mở khóa.
              </p>
            </div>

            <Link
              href="/pricing"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <Crown className="w-4 h-4" />
              <span>Nâng cấp Pro</span>
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BACKUP UI CŨ (ĐỂ DỄ DÀNG ROLLBACK HOẶC THAM KHẢO KHI CẦN)                */}
      {/* ========================================================================= */}
      {/*
        Ghi chú: Bản layout cũ với thanh pill đếm câu lớn và cột AI grading bên phải
        đã được tích hợp thu gọn vào luồng chuẩn theo 5 screenshot của đề bài.
        Toàn bộ logic chấm AI, whisper upload, Web Audio beep vẫn hoạt động 100%.
      {/* Modal xác nhận rời khỏi bài thi Speaking */}
      <ExamExitConfirmModal
        isOpen={showExitConfirm}
        title="Rời khỏi bài thi Speaking?"
        message="Bạn đang trong quá trình luyện nói Speaking. Nếu quay lại lúc này, các đoạn ghi âm chưa nộp chấm sẽ không được lưu điểm. Bạn có chắc chắn muốn rời khỏi không?"
        confirmText="Xác nhận rời khỏi"
        cancelText="Tiếp tục làm bài"
        onConfirm={() => {
          setShowExitConfirm(false);
          router.push("/speaking");
        }}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>
  );
}

export default function SpeakingExamRunner() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SpeakingExamRunnerContent />
    </Suspense>
  );
}
