"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { ExamExitConfirmModal } from "@/components/exam-exit-confirm-modal";
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronRight,
  Eye,
  Flag,
  Menu,
  Info,
  ArrowUp,
  LogOut,
  X,
  PenTool,
  Trophy,
  FileText,
  Zap,
  Award,
  Loader2,
} from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { ExamSyncStatus, ExamRecoveryBanner } from "@/components/exam-sync-status";
import {
  type WritingQuestion,
  type WritingPart,
  DEFAULT_ART_CLUB_PARTS,
  getBenchmarkWritingParts,
} from "@/data/writing-benchmark";

function WritingExamRunnerContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = params.id as string;
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Tham số xem lại từ Lịch sử làm bài (/history)
  const submissionIdParam = searchParams?.get("submissionId");
  const modeParam = searchParams?.get("mode");
  const isReviewUrl = modeParam === "review" && Boolean(submissionIdParam);
  const [isReviewMode, setIsReviewMode] = useState(isReviewUrl);
  const [aiEvaluationStatus, setAiEvaluationStatus] = useState<"idle" | "evaluating" | "completed">("idle");
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAuth();

  // Lấy quota AI chuẩn từ user subscription hoặc ai_quotas (đồng bộ 100% với trang Profile)
  const userAiQuota =
    user?.activeSubscription?.aiQuotaLeft ??
    user?.subscription?.aiQuotaLeft ??
    user?.user_subscriptions?.[0]?.ai_quota_left ??
    (user?.ai_quotas ? Math.max(0, user.ai_quotas.total_quota - user.ai_quotas.used_quota) : undefined);

  const [examTitle, setExamTitle] = useState("Writing Test");
  const [parts, setParts] = useState<WritingPart[]>(DEFAULT_ART_CLUB_PARTS);
  const [currentPartIdx, setCurrentPartIdx] = useState(0);

  // answers: key = `${partIdx}_${qIdx}`
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(3 * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(submissionIdParam || null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error" | "resumed">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isResumedSession, setIsResumedSession] = useState(false);
  const [resumedBannerDismissed, setResumedBannerDismissed] = useState(false);
  const isStartingSubmissionRef = useRef(false);

  // AI Quota & Submission state
  const [aiQuota, setAiQuota] = useState<number>(() => {
    if (userAiQuota !== undefined) return userAiQuota;
    return 2;
  });
  const [isQuotaExhaustedModalOpen, setIsQuotaExhaustedModalOpen] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [showPart2Result, setShowPart2Result] = useState(false);
  const [showAiWaitingScreen, setShowAiWaitingScreen] = useState(false);
  const [showSampleAnswersModal, setShowSampleAnswersModal] = useState(false);
  const [showPartsDrawer, setShowPartsDrawer] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("Lỗi đề bài hoặc câu hỏi");
  const [reportNote, setReportNote] = useState("");
  const [reportSent, setReportSent] = useState(false);

  // Khởi tạo Quota: Đồng bộ với tài khoản thật của học viên
  useEffect(() => {
    if (userAiQuota !== undefined) {
      setAiQuota(userAiQuota);
    } else if (typeof window !== "undefined") {
      const savedQuota = localStorage.getItem("aptis_writing_ai_quota");
      if (savedQuota !== null) {
        setAiQuota(Number(savedQuota));
      } else {
        localStorage.setItem("aptis_writing_ai_quota", "2");
      }
    }
  }, [userAiQuota]);

  // Xử lý tab part từ URL nếu có (?part=p1, ?part=p2, ?part=1, etc.)
  useEffect(() => {
    const partQuery = searchParams?.get("part")?.toLowerCase();
    if (!partQuery || parts.length === 0) return;

    // Nếu là bài thi lẻ (chỉ có 1 Part duy nhất), luôn giữ currentPartIdx = 0
    if (parts.length === 1) {
      setCurrentPartIdx(0);
      return;
    }

    let targetPartNum = 1;
    if (partQuery === "p1" || partQuery === "1") targetPartNum = 1;
    else if (partQuery === "p2" || partQuery === "2") targetPartNum = 2;
    else if (partQuery === "p3" || partQuery === "3") targetPartNum = 3;
    else if (partQuery === "p4" || partQuery === "4") targetPartNum = 4;

    const matchedIdx = parts.findIndex((p) => p.partNumber === targetPartNum);
    if (matchedIdx !== -1) {
      setCurrentPartIdx(matchedIdx);
    } else {
      setCurrentPartIdx(0);
    }
  }, [searchParams, parts]);

  // Điều hướng chuyển Part mượt mà, cuộn êm dịu lên đầu bài
  const handleSelectPart = (idx: number) => {
    if (idx === currentPartIdx) return;
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }
    if (!isReviewMode && submissionId) {
      performAutosave(answers);
    }
    setCurrentPartIdx(idx);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Tự động lưu ngầm toàn bộ các câu trả lời đã điền (Debounced Autosave)
  const performAutosave = useCallback(
    async (customAnswers?: Record<string, string>) => {
      if (!submissionId || isReviewMode) return;
      const ansMap = customAnswers || answers;
      const payload: Array<{ questionId: string; textAnswer: string }> = [];
      parts.forEach((p, pIdx) => {
        p.questions.forEach((q, qIdx) => {
          if (q.id && q.id.length > 10) {
            const text = ansMap[`${pIdx}_${qIdx}`];
            if (typeof text === "string" && text.trim().length > 0) {
              payload.push({ questionId: q.id, textAnswer: text });
            }
          }
        });
      });
      if (payload.length === 0) return;
      try {
        setSyncStatus("saving");
        await api.submissions.autosave(submissionId, payload);
        setSyncStatus("saved");
        setLastSavedAt(new Date());
        setTimeout(() => setSyncStatus("idle"), 2500);
      } catch (err) {
        console.warn("Writing autosave error:", err);
        setSyncStatus("error");
      }
    },
    [submissionId, isReviewMode, answers, parts]
  );

  // Xử lý thay đổi nội dung gõ phím với debounce 3 giây
  const handleAnswerChange = (answerKey: string, value: string) => {
    if (isReviewMode) return;
    const updated = { ...answers, [answerKey]: value };
    setAnswers(updated);
    setSyncStatus("saving");
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    autosaveTimeoutRef.current = setTimeout(() => {
      performAutosave(updated);
    }, 3000);
  };

  // Làm lại đề thi từ đầu: Tạo bài nộp mới hoàn toàn với 100% thời gian trên server
  const handleRestartExam = async () => {
    try {
      setLoading(true);
      const res = await api.submissions.start(examId, true);
      if (res.success && res.data) {
        const subData = res.data;
        setSubmissionId(subData.submissionId || subData.id);
        setTimeLeft(subData.serverTimeRemaining || 3 * 60);
      }
      setAnswers({});
      if (typeof window !== "undefined") {
        localStorage.removeItem(`aptis_draft_writing_${examId}`);
      }
      setIsReviewMode(false);
      setShowPart2Result(false);
      setShowAiWaitingScreen(false);
      setAiResult(null);
      setAiEvaluationStatus("idle");
      setCurrentPartIdx(0);
      setIsResumedSession(false);
      if (isReviewUrl) {
        router.replace(`/writing/${examId}`);
      }
    } catch (err) {
      console.error("Restart writing exam error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load Exam Data từ Backend
  const loadExamData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getQuestions(examId);
      const title = res.data?.title || "Writing Test";
      setExamTitle(title);

      const benchmarkParts = getBenchmarkWritingParts(title || examId);

      if (res.success && res.data && res.data.parts?.length > 0) {
        const loadedParts: WritingPart[] = (res.data.parts || []).map(
          (p: any, idx: number) => {
            // Single Source of Truth: Ưu tiên partType chuẩn từ Backend DTO
            let partNum = idx + 1;
            if (p.partType === 'PART_4' || p.part_number === 4) partNum = 4;
            else if (p.partType === 'PART_3' || p.part_number === 3) partNum = 3;
            else if (p.partType === 'PART_2' || p.part_number === 2) partNum = 2;
            else if (p.partType === 'PART_1' || p.part_number === 1) partNum = 1;
            else {
              const combinedTitle = `${p.title || ""} ${title} ${p.part_number || ""}`.toLowerCase();
              if (/part\s*4|email/i.test(combinedTitle)) partNum = 4;
              else if (/part\s*3|three\s*response|chat/i.test(combinedTitle)) partNum = 3;
              else if (/part\s*2|short\s*text|social/i.test(combinedTitle)) partNum = 2;
              else partNum = 1;
            }

            const defaultP = benchmarkParts[partNum - 1] || benchmarkParts[0];
            const subTitle = p.partSubtitle || (
              partNum === 1
                ? "Part 1 - Short Answers"
                : partNum === 2
                ? "Part 2 - Social Media Response"
                : partNum === 3
                ? "Part 3 - Three Questions"
                : "Part 4 - Formal & Informal Email"
            );

            let questions: WritingQuestion[] = [];
            if (p.questions && p.questions.length > 0) {
              questions = p.questions.map((q: any, qIdx: number) => {
                let promptText = q.prompt || defaultP.questions[qIdx]?.prompt || `Question ${qIdx + 1}`;
                if (partNum === 2) {
                  // Làm sạch nếu prompt còn chứa đoạn chỉ dẫn thừa
                  const m = promptText.match(/^(?:.*?(?:fill in the form|write in sentences|use 20[–-]30 words|recommended time:[^.]*)[.\s]+)(.+)$/i);
                  if (m && m[1].trim().length > 5) {
                    promptText = m[1].trim();
                  }
                }
                return {
                  id: q.id,
                  questionNumber: q.question_number || qIdx + 1,
                  prompt: promptText,
                  sampleAnswer: q.explanation || defaultP.questions[qIdx]?.sampleAnswer,
                };
              });
            } else {
              questions = defaultP.questions;
            }

            // Đảm bảo Part 4 luôn luôn có đủ 2 email chuẩn Aptis ESOL:
            // 1. Email thân mật gửi bạn (khoảng 50 từ)
            // 2. Email trang trọng gửi Quản lý CLB / Club Manager (120 - 150 từ)
            if (partNum === 4 && questions.length === 1) {
              const q1 = questions[0];
              const isManager = /manager|secretary|president|formal/i.test(q1.prompt);
              if (isManager) {
                questions = [
                  {
                    questionNumber: 1,
                    prompt: "Write an email to a friend who is also a member of the club. Tell them about your feelings regarding this notice and discuss what you should do next. Write about 50 words.",
                    sampleAnswer: "Hi there,\n\nDid you see the recent announcement from our club? I was quite disappointed to hear about this sudden decision. What do you think we should do about it? Let me know soon.\n\nBest,\nYour friend",
                  },
                  {
                    ...q1,
                    questionNumber: 2,
                  },
                ];
              } else {
                questions = [
                  q1,
                  {
                    questionNumber: 2,
                    prompt: "Write an email to the Club Manager. Explain how you feel about the announcement, outline how this decision impacts club members, and suggest practical alternatives or solutions. Write 120–150 words.",
                    sampleAnswer: "Dear Club Manager,\n\nI am writing to express my concern regarding the recent announcement communicated to our club members. While I appreciate the operational challenges that the management is currently addressing, I feel this sudden change will negatively impact many dedicated members.\n\nFirstly, many members have arranged their personal commitments around the existing schedule. Secondly, this change causes substantial inconvenience and dissatisfaction among regular participants. Therefore, I would respectfully propose that the club committee consider alternative measures, such as organizing a member survey or exploring flexible compromise solutions.\n\nThank you for taking the time to consider our perspective on this important matter. I look forward to hearing your response.\n\nYours sincerely,\nClub Member",
                  },
                ];
              }
            }

            let instructions = p.instructions || defaultP.instructions;
            if (partNum === 2 && (!instructions || instructions === "Write your response in English.")) {
              const cleanClub = title.replace(/\s*—.*$/, '').replace(/\s*-.*$/, '').trim();
              instructions = `You are a new member of the ${cleanClub}. Fill in the form. Write in sentences. Use 20–30 words. Recommended time: 7 minutes.`;
            }

            return {
              partNumber: partNum,
              partName: p.title || defaultP.partName,
              partSubtitle: subTitle,
              minWords: defaultP.minWords,
              maxWords: defaultP.maxWords,
              recommendedMinutes: defaultP.recommendedMinutes,
              instructions,
              passageText: p.passage_text,
              questions,
            };
          }
        );

        // Hiển thị chính xác các Part có trong đề thi, KHÔNG tự ý chèn Part của CLB khác
        setParts(loadedParts);
      } else {
        setParts(benchmarkParts);
      }
    } catch (err: any) {
      console.warn("Fallback to default writing exam:", err);
      const fallback = getBenchmarkWritingParts(examId);
      setParts(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId) loadExamData();
  }, [examId]);

  // Tự động cuộn pill part đang chọn vào giữa thanh điều hướng
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(`writing-part-pill-${currentPartIdx}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [currentPartIdx]);

  // Cập nhật lại thời gian theo từng Part khi đổi Part
  useEffect(() => {
    const currentP = parts[currentPartIdx];
    if (currentP) {
      setTimeLeft(currentP.recommendedMinutes * 60);
    }
  }, [currentPartIdx, parts]);

  // Timer Countdown
  useEffect(() => {
    if (loading || isPaused || showPart2Result || showAiWaitingScreen) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, isPaused, showPart2Result, showAiWaitingScreen]);

  // 1. Phục hồi bản nháp bài viết từ LocalStorage khi vào phòng thi (Zero data loss)
  useEffect(() => {
    if (typeof window === "undefined" || !examId) return;
    try {
      const raw = localStorage.getItem(`aptis_draft_writing_${examId}`);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.answers && Object.keys(draft.answers).length > 0) {
          setAnswers((prev) => ({ ...draft.answers, ...prev }));
        }
      }
    } catch {}
  }, [examId]);

  // 2. Tự động lưu bản nháp vào LocalStorage mỗi khi gõ phím
  useEffect(() => {
    if (typeof window === "undefined" || !examId) return;
    if (Object.keys(answers).length > 0) {
      try {
        localStorage.setItem(
          `aptis_draft_writing_${examId}`,
          JSON.stringify({
            answers,
            savedAt: new Date().toISOString(),
          })
        );
      } catch {}
    }
  }, [answers, examId]);

  // 3. Cảnh báo beforeunload chống vô tình F5/thoát trang làm mất bài viết
  useEffect(() => {
    if (showPart2Result || showAiWaitingScreen) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Bạn đang làm bài thi Writing. Rời khỏi trang có thể làm gián đoạn bài làm!";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [showPart2Result, showAiWaitingScreen]);

  // 4. Khởi tạo / Khôi phục submission ở backend hoặc nạp bài cũ để Xem lại (Review Mode)
  useEffect(() => {
    async function initWritingSubmission() {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token || !examId || isStartingSubmissionRef.current || parts.length === 0) return;

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
            setAiResult(sub);
            if (sub.status === "PENDING_EVALUATION") {
              setAiEvaluationStatus("evaluating");
            } else {
              setAiEvaluationStatus("completed");
            }

            // Phục hồi câu trả lời của thí sinh vào form
            const loaded: Record<string, string> = {};
            parts.forEach((p, pIdx) => {
              p.questions.forEach((q, qIdx) => {
                if (q.id) {
                  const foundAns = (sub.answers || []).find(
                    (a: any) => String(a.question_id || a.questionId) === String(q.id)
                  );
                  if (foundAns) {
                    const text = foundAns.text_answer || foundAns.textAnswer || "";
                    if (text) loaded[`${pIdx}_${qIdx}`] = text;
                  }
                }
              });
            });
            if (Object.keys(loaded).length > 0) {
              setAnswers((prev) => ({ ...loaded, ...prev }));
            }
          }
        } catch (err) {
          console.warn("Failed to load writing review submission:", err);
        } finally {
          setLoading(false);
        }
        return;
      }

      // NHÁNH 2: BẮT ĐẦU PHÒNG THI MỚI HOẶC TIẾP TỤC BÀI THI CÒN HẠN
      if (submissionId) return;
      isStartingSubmissionRef.current = true;
      try {
        const res = await api.submissions.start(examId);
        if (res.success && res.data) {
          const subData = res.data;
          setSubmissionId(subData.submissionId || subData.id);
          if (subData.serverTimeRemaining !== undefined) {
            setTimeLeft(subData.serverTimeRemaining);
          }

          if (subData.isResumed) {
            let loadedCount = 0;
            if (subData.savedAnswers && typeof subData.savedAnswers === "object") {
              const loaded: Record<string, string> = {};
              parts.forEach((p, pIdx) => {
                p.questions.forEach((q, qIdx) => {
                  if (q.id) {
                    const text = (subData.savedAnswers as Record<string, any>)[q.id]?.textAnswer;
                    if (typeof text === "string" && text.trim().length > 0) {
                      loaded[`${pIdx}_${qIdx}`] = text;
                    }
                  }
                });
              });
              loadedCount = Object.keys(loaded).length;
              if (loadedCount > 0) {
                setAnswers((prev) => ({ ...loaded, ...prev }));
                setIsResumedSession(true);
                setSyncStatus("resumed");
                setTimeout(() => setSyncStatus("idle"), 4000);
              }
            }
          }
        }
      } catch (err) {
        isStartingSubmissionRef.current = false;
        console.warn("Writing offline mode:", err);
      }
    }
    initWritingSubmission();
  }, [examId, submissionId, isReviewUrl, submissionIdParam, parts]);

  const currentPart = parts[currentPartIdx] || parts[0];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getWordCount = (text?: string) => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  // Polling kết quả chấm AI tự động khi đang ở chế độ xem lại với trạng thái chấm ngầm
  useEffect(() => {
    if (!isReviewMode || !submissionId || aiEvaluationStatus !== "evaluating") return;

    let isSubscribed = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await api.submissions.getResult(submissionId);
        if (!isSubscribed) return;
        if (res.success && res.data) {
          const sub = res.data;
          if (
            sub.status === "GRADED" ||
            (Array.isArray(sub.ai_results) && sub.ai_results.length > 0) ||
            (sub.total_score != null && sub.total_score > 0)
          ) {
            setAiResult(sub);
            setAiEvaluationStatus("completed");
            clearInterval(pollInterval);
          }
        }
      } catch (e) {
        console.warn("Polling AI grading result error:", e);
      }
    }, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, [isReviewMode, submissionId, aiEvaluationStatus]);

  // NỘP BÀI THI WRITING: Tự động lưu tất cả Part, nộp bài, kích hoạt Right Review Panel và gọi AI chấm ngầm
  const handleSubmit = async (bypassQuotaCheck = false) => {
    if (!bypassQuotaCheck && currentPart.partNumber !== 2 && aiQuota <= 0) {
      setIsQuotaExhaustedModalOpen(true);
      return;
    }

    if (submissionId) {
      try {
        setSyncStatus("saving");
        const allPayload: Array<{ questionId: string; textAnswer: string }> = [];
        parts.forEach((p, pIdx) => {
          p.questions.forEach((q, qIdx) => {
            if (q.id && q.id.length > 10) {
              const text = answers[`${pIdx}_${qIdx}`] || "";
              allPayload.push({ questionId: q.id, textAnswer: text });
            }
          });
        });
        if (allPayload.length > 0) {
          await api.submissions.autosave(submissionId, allPayload);
        }
        await api.submissions.submit(submissionId);
        setSyncStatus("saved");
      } catch (err) {
        console.warn("Writing submit error:", err);
      }
    }

    if (aiQuota > 0 && currentPart.partNumber !== 2) {
      const newQuota = Math.max(0, aiQuota - 1);
      setAiQuota(newQuota);
      if (typeof window !== "undefined") {
        localStorage.setItem("aptis_writing_ai_quota", String(newQuota));
      }
    }

    // Chuyển sang Review Mode với Right Review Panel hiển thị trạng thái chấm Live
    setIsReviewMode(true);
    setAiEvaluationStatus("evaluating");
  };

  // =========================================================================
  // MÀN HÌNH LÀM BÀI PHÒNG THI (THEO THEME CHUẨN CỦA HỆ THỐNG MÌNH)
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans select-none">
      {/* 1. TOP HEADER (THEO DESIGN SYSTEM CỦA DỰ ÁN) */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (isReviewMode) {
                router.push("/history");
              } else {
                setShowExitConfirm(true);
              }
            }}
            className="w-9 h-9 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors text-foreground cursor-pointer"
            title={isReviewMode ? "Quay lại Lịch sử làm bài" : "Rời khỏi bài thi"}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              {isReviewMode ? "Writing Review Mode" : "Writing Practice"}
            </span>
            <span className="text-sm md:text-base font-bold text-foreground">
              {currentPart.partSubtitle}
            </span>
          </div>
        </div>

        {/* Căn giữa: Trạng thái Live / Đồng hồ đếm ngược */}
        <div className="flex items-center gap-2.5">
          {isReviewMode ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs">
              {aiEvaluationStatus === "evaluating" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Kỳ Tích đang chấm ngầm...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Báo Cáo Điểm &amp; Xem Lại Bài Làm</span>
                </>
              )}
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
          {isReviewMode ? (
            <Link
              href="/history"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Về Lịch sử làm bài"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Về Lịch sử</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Thoát về danh sách đề"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Thoát</span>
            </button>
          )}
        </div>
      </header>

      {isResumedSession && !resumedBannerDismissed && !isReviewMode && (
        <ExamRecoveryBanner
          remainingSeconds={timeLeft}
          answersCount={Object.values(answers).filter(Boolean).length}
          onDismiss={() => setResumedBannerDismissed(true)}
        />
      )}

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 py-6 px-3 md:px-6 pb-24">
        <div className={isReviewMode ? "max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" : "max-w-4xl mx-auto space-y-6"}>
          {/* CỘT TRÁI: NỘI DUNG ĐỀ VÀ BÀI VIẾT CỦA THÍ SINH */}
          <div className={isReviewMode ? "lg:col-span-8 space-y-6" : "space-y-6"}>
            {/* Card Context & Header Banner */}
            <div key={`part-header-${currentPart.partNumber}`} className="part-transition bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-4">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                      {parts.length > 1 ? `Phần ${currentPart.partNumber} / ${parts.length}` : `Part ${currentPart.partNumber} · Đề luyện lẻ`}
                    </span>
                    <h2 className="font-heading font-bold text-base md:text-lg text-foreground">
                      {currentPart.partName}
                    </h2>
                  </div>
                  <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans pt-1">
                    {currentPart.instructions}
                  </p>
                </div>

                {/* Bookmark, Pause, Timer (chỉ hiển thị khi đang thi) */}
                {!isReviewMode && (
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

                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(timeLeft)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. INPUT QUESTION CARDS WITH SMOOTH PART TRANSITION */}
            <div key={`part-questions-container-${currentPart.partNumber}`} className="part-transition space-y-4">
            {/* =========================================================================
                PART 1: 5 SHORT ANSWER QUESTIONS
                ========================================================================= */}
            {currentPart.partNumber === 1 && (
              <div className="space-y-4">
                {currentPart.questions.map((q, qIdx) => {
                  const answerKey = `${currentPartIdx}_${qIdx}`;
                  const val = answers[answerKey] || "";
                  const words = getWordCount(val);

                  return (
                    <div
                      key={q.questionNumber}
                      className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3"
                    >
                      <label className="text-xs md:text-sm font-semibold text-foreground block">
                        {q.prompt}
                      </label>
                      <textarea
                        rows={2}
                        value={val}
                        readOnly={isReviewMode}
                        onChange={(e) => handleAnswerChange(answerKey, e.target.value)}
                        placeholder="Type your answer..."
                        className={`w-full p-3 rounded-xl border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans resize-y transition-all ${
                          isReviewMode ? "bg-muted/30 cursor-default" : ""
                        }`}
                      />
                      <div className="flex justify-end text-xs text-muted-foreground font-mono">
                        Words {words} / 10
                      </div>

                      {/* Review Mode: Feedback AI & Sample Answer */}
                      {isReviewMode && (() => {
                        const qAi = Array.isArray(aiResult?.ai_results)
                          ? aiResult.ai_results.find(
                              (r: any) =>
                                (q.id && String(r.question_id || r.questionId) === String(q.id)) ||
                                r.question_number === q.questionNumber
                            ) || aiResult.ai_results[qIdx]
                          : null;
                        const feedbackText = qAi?.feedback || qAi?.general_feedback || qAi?.generalFeedback;

                        return (
                          <div className="space-y-2 pt-1 border-t border-border/60">
                            {feedbackText && (
                              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1 text-xs">
                                <div className="flex items-center justify-between font-bold text-primary">
                                  <span className="flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Nhận xét AI Kỳ Tích:</span>
                                  </span>
                                  {(qAi.cefr_level || qAi.cefrLevel) && (
                                    <span className="px-2 py-0.5 rounded bg-primary/10 text-[10px] font-bold">
                                      Band {qAi.cefr_level || qAi.cefrLevel}
                                    </span>
                                  )}
                                </div>
                                <p className="text-foreground leading-relaxed whitespace-pre-line">{feedbackText}</p>
                              </div>
                            )}

                            {q.sampleAnswer && (
                              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                                <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Bài mẫu tham khảo:</span>
                                </div>
                                <p className="text-foreground/90 leading-relaxed font-sans">{q.sampleAnswer}</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}

            {/* =========================================================================
                PART 2: FORM RESPONSE (20–30 WORDS)
                ========================================================================= */}
            {currentPart.partNumber === 2 && (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground shadow-sm">
                      Câu hỏi điền đơn (Form Field)
                    </span>
                    <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                      Mục tiêu: 20 – 30 từ · Thời gian gợi ý: ~7 phút
                    </span>
                  </div>

                  {/* Word status badge */}
                  {(() => {
                    const val = answers[`${currentPartIdx}_0`] || "";
                    const words = getWordCount(val);
                    let wordStatusText = "Chưa nhập bài";
                    let wordStatusColor = "text-muted-foreground bg-muted border-border";
                    if (words > 0) {
                      if (words < 20) {
                        wordStatusText = `Chưa đủ dung lượng (${words}/20–30 từ)`;
                        wordStatusColor = "text-amber-700 bg-amber-500/10 border-amber-300 dark:text-amber-400";
                      } else if (words <= 35) {
                        wordStatusText = `Đạt chuẩn dung lượng (${words}/20–30 từ)`;
                        wordStatusColor = "text-emerald-700 bg-emerald-500/10 border-emerald-300 dark:text-emerald-400";
                      } else {
                        wordStatusText = `Vượt số từ khuyến nghị (${words}/30 từ)`;
                        wordStatusColor = "text-blue-700 bg-blue-500/10 border-blue-300 dark:text-blue-400";
                      }
                    }
                    return (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${wordStatusColor}`}>
                        {wordStatusText}
                      </span>
                    );
                  })()}
                </div>

                {/* Hộp hiển thị câu hỏi nổi bật rõ ràng */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                  <div className="text-[11px] font-bold uppercase text-primary tracking-wider flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Câu hỏi cần trả lời:</span>
                  </div>
                  <div className="text-sm md:text-base font-bold text-foreground leading-relaxed">
                    {currentPart.questions[0]?.prompt || "Please tell us about yourself and your reasons for joining this club."}
                  </div>
                </div>

                <textarea
                  rows={5}
                  value={answers[`${currentPartIdx}_0`] || ""}
                  readOnly={isReviewMode}
                  onChange={(e) => handleAnswerChange(`${currentPartIdx}_0`, e.target.value)}
                  placeholder="Write in sentences (20–30 words). Type your answer here..."
                  className={`w-full p-4 rounded-xl border border-input bg-background text-foreground text-sm md:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans resize-y leading-relaxed transition-all shadow-inner ${
                    isReviewMode ? "bg-muted/30 cursor-default" : ""
                  }`}
                />

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-24 sm:w-36 h-2 rounded-full bg-muted overflow-hidden">
                      {(() => {
                        const words = getWordCount(answers[`${currentPartIdx}_0`] || "");
                        return (
                          <div
                            className={`h-full transition-all duration-300 ${
                              words >= 20 && words <= 35
                                ? "bg-emerald-500"
                                : words > 35
                                ? "bg-blue-500"
                                : "bg-primary"
                            }`}
                            style={{
                              width: `${Math.min(100, (words / 30) * 100)}%`,
                            }}
                          />
                        );
                      })()}
                    </div>
                    <span className="font-mono font-medium">
                      {getWordCount(answers[`${currentPartIdx}_0`]) || 0} / 30 từ
                    </span>
                  </div>
                  <span className="text-[11px] italic">
                    Khuyến nghị: Viết 2–3 câu hoàn chỉnh có chủ vị
                  </span>
                </div>

                {/* Review Mode: Feedback & Sample Answer */}
                {isReviewMode && (
                  <div className="space-y-3 pt-3 border-t border-border">
                    {(() => {
                      const qAi = Array.isArray(aiResult?.ai_results)
                        ? aiResult.ai_results.find(
                            (r: any) =>
                              (currentPart.questions[0]?.id && String(r.question_id || r.questionId) === String(currentPart.questions[0]?.id)) ||
                              r.question_number === 1
                          ) || aiResult.ai_results[0]
                        : null;
                      const feedbackText = qAi?.feedback || qAi?.general_feedback;
                      if (!feedbackText) return null;
                      return (
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between font-bold text-primary">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Nhận xét AI Kỳ Tích:</span>
                            </span>
                            {qAi.cefr_level && (
                              <span className="px-2 py-0.5 rounded bg-primary/10 text-[10px] font-bold">
                                Band {qAi.cefr_level}
                              </span>
                            )}
                          </div>
                          <p className="text-foreground leading-relaxed whitespace-pre-line">{feedbackText}</p>
                        </div>
                      );
                    })()}

                    {currentPart.questions[0]?.sampleAnswer && (
                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1.5">
                        <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Bài mẫu tham khảo (Band B2 - C1):</span>
                        </div>
                        <p className="text-foreground/90 leading-relaxed font-sans">{currentPart.questions[0]?.sampleAnswer}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                PART 3: 3 CHAT QUESTIONS
                ========================================================================= */}
            {currentPart.partNumber === 3 && (
              <div className="space-y-4">
                {currentPart.questions.map((q, qIdx) => {
                  const answerKey = `${currentPartIdx}_${qIdx}`;
                  const val = answers[answerKey] || "";
                  const words = getWordCount(val);

                  return (
                    <div
                      key={q.questionNumber}
                      className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3"
                    >
                      <label className="text-xs md:text-sm font-semibold text-foreground block leading-relaxed">
                        {q.prompt}
                      </label>
                      <textarea
                        rows={3}
                        value={val}
                        readOnly={isReviewMode}
                        onChange={(e) => handleAnswerChange(answerKey, e.target.value)}
                        placeholder="Write your answer here (30-40 words)..."
                        className={`w-full p-3.5 rounded-xl border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans resize-y leading-relaxed transition-all ${
                          isReviewMode ? "bg-muted/30 cursor-default" : ""
                        }`}
                      />
                      <div className="flex justify-end text-xs text-muted-foreground font-mono">
                        Words {words} / 60
                      </div>

                      {/* Review Mode: Feedback & Sample Answer */}
                      {isReviewMode && (() => {
                        const qAi = Array.isArray(aiResult?.ai_results)
                          ? aiResult.ai_results.find(
                              (r: any) =>
                                (q.id && String(r.question_id || r.questionId) === String(q.id)) ||
                                r.question_number === q.questionNumber
                            ) || aiResult.ai_results[qIdx]
                          : null;
                        const feedbackText = qAi?.feedback || qAi?.general_feedback || qAi?.generalFeedback;

                        return (
                          <div className="space-y-2 pt-1 border-t border-border/60">
                            {feedbackText && (
                              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1 text-xs">
                                <div className="flex items-center justify-between font-bold text-primary">
                                  <span className="flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Nhận xét AI Kỳ Tích:</span>
                                  </span>
                                  {(qAi.cefr_level || qAi.cefrLevel) && (
                                    <span className="px-2 py-0.5 rounded bg-primary/10 text-[10px] font-bold">
                                      Band {qAi.cefr_level || qAi.cefrLevel}
                                    </span>
                                  )}
                                </div>
                                <p className="text-foreground leading-relaxed whitespace-pre-line">{feedbackText}</p>
                              </div>
                            )}

                            {q.sampleAnswer && (
                              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                                <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Bài mẫu tham khảo:</span>
                                </div>
                                <p className="text-foreground/90 leading-relaxed font-sans">{q.sampleAnswer}</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}

            {/* =========================================================================
                PART 4: 2 EMAILS (INFORMAL & FORMAL DUAL-FORM WORKSPACE)
                ========================================================================= */}
            {currentPart.partNumber === 4 && (
              <div className="space-y-6">
                {/* Thông báo tình huống Part 4 nếu có */}
                {currentPart.passageText && (
                  <div className="bg-card rounded-2xl border border-primary/20 bg-primary/[0.02] p-5 md:p-6 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                      <FileText className="w-4 h-4" />
                      <span>Thông báo từ Ban Quản lý Câu lạc bộ (Club Announcement)</span>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs md:text-sm text-foreground/90 leading-relaxed font-sans whitespace-pre-line">
                      {currentPart.passageText}
                    </div>
                  </div>
                )}
                {currentPart.questions.map((q, qIdx) => {
                  const answerKey = `${currentPartIdx}_${qIdx}`;
                  const val = answers[answerKey] || "";
                  const words = getWordCount(val);
                  const isFormal = qIdx === 1;

                  // Chuẩn độ dài theo British Council
                  const targetMin = isFormal ? 120 : 40;
                  const targetMax = isFormal ? 150 : 60;
                  const recommendedWords = isFormal ? "120 – 150 từ" : "40 – 60 từ (khuyến nghị 50 từ)";
                  const recommendedTime = isFormal ? "20 phút" : "10 phút";

                  // Đánh giá trạng thái số lượng từ
                  let wordStatusText = "Chưa nhập bài";
                  let wordStatusColor = "text-muted-foreground bg-muted border-border";
                  if (words > 0) {
                    if (words < targetMin) {
                      wordStatusText = `Chưa đủ dung lượng (${words}/${isFormal ? 150 : 50} từ)`;
                      wordStatusColor = "text-amber-700 bg-amber-500/10 border-amber-300 dark:text-amber-400";
                    } else if (words <= targetMax) {
                      wordStatusText = `Đạt chuẩn dung lượng (${words}/${isFormal ? 150 : 50} từ)`;
                      wordStatusColor = "text-emerald-700 bg-emerald-500/10 border-emerald-300 dark:text-emerald-400";
                    } else {
                      wordStatusText = `Vượt số từ khuyến nghị (${words}/${isFormal ? 150 : 50} từ)`;
                      wordStatusColor = "text-blue-700 bg-blue-500/10 border-blue-300 dark:text-blue-400";
                    }
                  }

                  return (
                    <div
                      key={q.questionNumber}
                      className={`bg-card rounded-2xl border transition-all shadow-sm ${
                        isFormal
                          ? "border-primary/30 ring-1 ring-primary/10"
                          : "border-sky-300/40 ring-1 ring-sky-400/10"
                      } p-5 md:p-6 space-y-4`}
                    >
                      {/* Header thông tin từng email */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border pb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                              isFormal
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-sky-600 text-white shadow-sm"
                            }`}
                          >
                            {isFormal ? "Task 2 — Formal Email (Trang trọng)" : "Task 1 — Informal Email (Thân mật)"}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                            Thời gian gợi ý: ~{recommendedTime}
                          </span>
                        </div>

                        {/* Word Status Badge */}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${wordStatusColor}`}>
                          {wordStatusText}
                        </span>
                      </div>

                      {/* Đề bài */}
                      <div className="space-y-1.5">
                        <label className="text-xs md:text-sm font-semibold text-foreground block leading-relaxed">
                          {q.prompt}
                        </label>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="font-semibold text-foreground">Yêu cầu chuẩn:</span>
                          <span className="px-2 py-0.5 rounded-md bg-muted font-medium">Mục tiêu: {recommendedWords}</span>
                          <span className="px-2 py-0.5 rounded-md bg-muted font-medium">
                            {isFormal
                              ? "Văn phong: Lịch sự, dùng Dear Mr/Ms..., không viết tắt, kết Yours sincerely"
                              : "Văn phong: Tự nhiên, thân thiện, dùng Hi/Hey, được viết tắt, kết Best/Cheers"}
                          </span>
                        </div>
                      </div>

                      {/* Vùng nhập bài viết */}
                      <textarea
                        rows={isFormal ? 9 : 5}
                        value={val}
                        readOnly={isReviewMode}
                        onChange={(e) => handleAnswerChange(answerKey, e.target.value)}
                        placeholder={
                          isFormal
                            ? "Dear Mr./Ms. [Tên quản lý],\n\nI am writing to express my view regarding the recent notice...\n\n[Giải thích cảm nghĩ và đề xuất 2-3 giải pháp cụ thể (120 - 150 từ)]\n\nI look forward to hearing from you soon.\n\nYours sincerely,\n[Tên của bạn]"
                            : "Hi [Tên bạn],\n\nDid you see the recent announcement about our club? I feel really...\n\n[Viết về cảm xúc và gợi ý câu lạc bộ nên làm gì (~50 từ)]\n\nTalk to you soon,\n[Tên của bạn]"
                        }
                        className={`w-full p-4 rounded-xl border border-input bg-background text-foreground text-sm md:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans resize-y leading-relaxed transition-all shadow-inner ${
                          isReviewMode ? "bg-muted/30 cursor-default" : ""
                        }`}
                      />

                      {/* Thống kê số từ & độ tiến độ */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <div className="flex items-center gap-2">
                          <div className="w-24 sm:w-36 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                words >= targetMin && words <= targetMax
                                  ? "bg-emerald-500"
                                  : words > targetMax
                                  ? "bg-blue-500"
                                  : "bg-primary"
                              }`}
                              style={{
                                width: `${Math.min(100, (words / (isFormal ? 150 : 50)) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="font-mono font-medium">
                            {words} / {isFormal ? "150" : "50"} từ
                          </span>
                        </div>

                        <span className="text-[11px] italic">
                          {isFormal ? "Thang điểm chiếm 60% Part 4" : "Thang điểm chiếm 40% Part 4"}
                        </span>
                      </div>

                      {/* Review Mode: Feedback & Sample Answer */}
                      {isReviewMode && (() => {
                        const qAi = Array.isArray(aiResult?.ai_results)
                          ? aiResult.ai_results.find(
                              (r: any) =>
                                (q.id && String(r.question_id || r.questionId) === String(q.id)) ||
                                r.question_number === (isFormal ? 2 : 1)
                            ) || aiResult.ai_results[isFormal ? 1 : 0]
                          : null;
                        const feedbackText = qAi?.feedback || qAi?.general_feedback || qAi?.generalFeedback;

                        return (
                          <div className="space-y-3 pt-3 border-t border-border">
                            {feedbackText && (
                              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between font-bold text-primary">
                                  <span className="flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Nhận xét AI Kỳ Tích ({isFormal ? "Formal Email" : "Informal Email"}):</span>
                                  </span>
                                  {(qAi.cefr_level || qAi.cefrLevel) && (
                                    <span className="px-2 py-0.5 rounded bg-primary/10 text-[10px] font-bold">
                                      Band {qAi.cefr_level || qAi.cefrLevel}
                                    </span>
                                  )}
                                </div>
                                <p className="text-foreground leading-relaxed whitespace-pre-line">{feedbackText}</p>
                              </div>
                            )}

                            {q.sampleAnswer && (
                              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1.5">
                                <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Bài mẫu tham khảo (Band B2 - C1):</span>
                                </div>
                                <p className="text-foreground/90 leading-relaxed font-sans whitespace-pre-line">{q.sampleAnswer}</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>

          {/* CỘT PHẢI: RIGHT REVIEW PANEL (STICKY SIDEBAR KHI XEM LẠI HOẶC CHẤM NGẦM) */}
          {isReviewMode && (
            <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span>Mục lục xem lại</span>
                  </h3>
                  {aiEvaluationStatus === "evaluating" ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Đang chấm...</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>Đã hoàn thành</span>
                    </span>
                  )}
                </div>

                {/* Trạng thái chấm ngầm hoặc Kết quả CEFR */}
                {aiEvaluationStatus === "evaluating" ? (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2 text-center animate-pulse">
                    <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                    <h4 className="font-bold text-xs text-foreground">AI Kỳ Tích đang chấm bài viết</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Hệ thống đang phân tích Task Achievement, Coherence, Grammar &amp; Vocabulary (khoảng 30-60 giây).
                    </p>
                  </div>
                ) : aiResult ? (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/30 text-center space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Trình độ ước tính CEFR
                    </span>
                    <div className="text-3xl font-heading font-black text-primary">
                      {aiResult.cefr_level || "B2"}
                    </div>
                    <div className="text-xs font-bold text-foreground">
                      Điểm Writing:{" "}
                      <span className="text-primary font-black">
                        {aiResult.writing_score != null
                          ? Math.round(aiResult.writing_score)
                          : aiResult.total_score != null
                          ? Math.round(aiResult.total_score)
                          : 40}
                      </span>{" "}
                      / 50
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed">
                    Bài viết đã được lưu vào hệ thống. Bạn có thể tự đối chiếu với bài mẫu chuẩn CEFR bên cạnh.
                  </div>
                )}

                {/* Mục lục danh sách các Part & Câu hỏi */}
                <div className="space-y-3 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Danh sách câu hỏi:
                  </span>
                  {parts.map((p, pIdx) => {
                    const isCurrentP = currentPartIdx === pIdx;
                    const answeredCount = p.questions.filter((_, qIdx) => !!answers[`${pIdx}_${qIdx}`]).length;

                    return (
                      <div
                        key={p.partNumber}
                        className={`p-3 rounded-xl border transition-all ${
                          isCurrentP
                            ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                            : "bg-card border-border hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <button
                            type="button"
                            onClick={() => handleSelectPart(pIdx)}
                            className="font-bold text-foreground hover:text-primary transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Part {p.partNumber}</span>
                            <span className="text-[11px] font-normal text-muted-foreground truncate max-w-[130px]">
                              · {p.partSubtitle}
                            </span>
                          </button>
                          <span className="text-[10px] font-mono font-medium text-muted-foreground">
                            {answeredCount}/{p.questions.length} câu
                          </span>
                        </div>

                        {/* Grid buttons câu hỏi */}
                        <div className="flex flex-wrap gap-1.5">
                          {p.questions.map((_, qIdx) => {
                            const ans = answers[`${pIdx}_${qIdx}`];
                            const hasAnswer = Boolean(ans && ans.trim().length > 0);
                            const isCur = isCurrentP;

                            return (
                              <button
                                key={qIdx}
                                type="button"
                                onClick={() => handleSelectPart(pIdx)}
                                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                                  isCur
                                    ? "bg-primary text-primary-foreground shadow-2xs font-black"
                                    : hasAnswer
                                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30"
                                    : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                                }`}
                                title={`Part ${p.partNumber} - Câu ${qIdx + 1}`}
                              >
                                {qIdx + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-border space-y-2">
                  <button
                    type="button"
                    onClick={handleRestartExam}
                    className="w-full py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Làm lại đề này từ đầu</span>
                  </button>
                  <Link
                    href="/history"
                    className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5 text-center cursor-pointer"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Xem trong Lịch sử làm bài</span>
                  </Link>
                  <Link
                    href="/writing"
                    className="w-full py-2 rounded-xl text-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors block cursor-pointer"
                  >
                    Quay lại danh sách đề Writing
                  </Link>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* 4. BOTTOM BAR (THEO DESIGN SYSTEM CỦA DỰ ÁN - CHỈ HIỆN KHI ĐANG LÀM BÀI) */}
      {!isReviewMode && (
        <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border px-4 md:px-8 py-3 flex items-center justify-between z-40 shadow-lg">
          {/* Left: Hiện đáp án & Báo lỗi */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSampleAnswersModal(true)}
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

          {/* Center: Quick Part Pills & Navigation Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="bg-muted/40 dark:bg-slate-800/60 p-1 rounded-2xl border border-border/80 shadow-2xs flex items-center gap-1 backdrop-blur-sm">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scrollbar-none scroll-smooth max-w-[42vw] sm:max-w-[44vw] md:max-w-[50vw] lg:max-w-[56vw] py-0.5 px-0.5">
                {parts.map((p, idx) => {
                  const isCurrent = currentPartIdx === idx;
                  const isAnswered = p.questions.some((_, qIdx) => {
                    const val = answers[`${idx}_${qIdx}`];
                    return val && val.trim().length > 0;
                  });

                  return (
                    <button
                      key={p.partNumber}
                      id={`writing-part-pill-${idx}`}
                      type="button"
                      onClick={() => handleSelectPart(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all duration-300 ease-out active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap select-none ${
                        isCurrent
                          ? "bg-primary text-primary-foreground font-black shadow-sm border border-primary"
                          : isAnswered
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/35 hover:bg-emerald-500/25"
                          : "bg-background/80 dark:bg-slate-900/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 hover:border-border"
                      }`}
                      title={p.partSubtitle}
                    >
                      {isAnswered && !isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      )}
                      <span>Part {p.partNumber}</span>
                    </button>
                  );
                })}
              </div>

              <div className="h-4 w-px bg-border/70 shrink-0 mx-0.5 hidden sm:block" />

              <button
                type="button"
                onClick={() => setShowPartsDrawer(true)}
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center bg-background/80 dark:bg-slate-900/60 hover:bg-primary/10 hover:text-primary text-muted-foreground border border-border/70 hover:border-primary/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs shrink-0"
                title="Danh sách Parts"
                aria-label="Danh sách Parts"
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
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Còn {aiQuota} lượt chấm AI</span>
            </div>

            <button
              type="button"
              disabled={currentPartIdx === 0}
              onClick={() => handleSelectPart(Math.max(0, currentPartIdx - 1))}
              className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
            >
              ← Previous
            </button>

            {currentPartIdx < parts.length - 1 ? (
              <button
                type="button"
                onClick={() => handleSelectPart(Math.min(parts.length - 1, currentPartIdx + 1))}
                className="tech-btn px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="tech-btn inline-flex items-center gap-1.5 px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>Submit &amp; Chấm AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </footer>
      )}

      {/* MODAL HIỆN ĐÁP ÁN THAM KHẢO */}
      {showSampleAnswersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Bài mẫu tham khảo — {currentPart.partSubtitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSampleAnswersModal(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              {currentPart.questions.map((q, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5">
                  <div className="font-semibold text-foreground">{q.prompt}</div>
                  <div className="text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                    {q.sampleAnswer || "Chưa có bài mẫu cho câu hỏi này."}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSampleAnswersModal(false)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER DANH SÁCH PARTS */}
      {showPartsDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm p-5 rounded-2xl bg-card border border-border shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-heading font-bold text-xs uppercase text-muted-foreground tracking-wider">
                Chuyển Part bài thi
              </h3>
              <button
                type="button"
                onClick={() => setShowPartsDrawer(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {parts.map((p, idx) => (
                <button
                  key={p.partNumber}
                  type="button"
                  onClick={() => {
                    setCurrentPartIdx(idx);
                    setShowPartsDrawer(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-colors ${
                    currentPartIdx === idx
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/40 hover:bg-muted text-foreground"
                  }`}
                >
                  <span>{p.partSubtitle}</span>
                  <span className="text-[10px] opacity-80">
                    {p.recommendedMinutes} phút
                  </span>
                </button>
              ))}
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
                <span>Báo lỗi câu hỏi Writing</span>
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
                  Ban chuyên môn sẽ kiểm tra ngữ cảnh và bài tập viết trong thời gian sớm nhất.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-muted-foreground">Vui lòng chọn loại lỗi bạn gặp phải:</p>
                <div className="space-y-2">
                  {[
                    "Lỗi đề bài hoặc câu hỏi không rõ nghĩa",
                    "Lỗi bài viết mẫu tham khảo",
                    "Lỗi đếm số từ / giao diện gõ chữ",
                    "Khác",
                  ].map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="writingReportType"
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

      {/* =========================================================================
          BACKUP CODE UI CŨ (GENERIC 2-COLUMN VIEW)
          Được comment lại theo yêu cầu của user để có thể phục hồi/backup bất cứ lúc nào:
          ========================================================================= */}
      {false && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
              <div className="p-4 rounded-xl bg-muted/40 border border-border mb-6">
                <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
                  Ngữ cảnh đề bài:
                </span>
                <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans">
                  {currentPart.instructions}
                </p>
              </div>
              <h3 className="text-base md:text-lg font-heading font-bold text-foreground mb-4">
                {currentPart.questions[0]?.prompt}
              </h3>
              <textarea
                rows={8}
                value={answers[`${currentPartIdx}_0`] || ""}
                placeholder="Gõ bài viết tiếng Anh của bạn tại đây..."
                className="w-full p-4 rounded-xl border border-input bg-card text-foreground text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-sans leading-relaxed resize-y"
              />
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="font-heading font-bold text-sm text-foreground">
                  Kết quả đánh giá AI (CEFR)
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div>Mức độ hoàn thành đề bài (Task Response)</div>
                <div>Ngữ pháp & Cấu trúc câu (Grammar)</div>
                <div>Độ phong phú từ vựng (Lexical)</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal xử lý khi hết lượt chấm AI */}
      {isQuotaExhaustedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 fill-amber-500" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-foreground">
                  Hết lượt chấm AI chuẩn CEFR
                </h3>
                <p className="text-xs text-muted-foreground">
                  Tài khoản của bạn hiện còn 0 lượt chấm AI
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Bạn có thể nộp bài để lưu lại bài viết trong Lịch sử và xem ngay bài viết mẫu (Band B1, B2, C) của chuyên gia, hoặc nâng cấp gói VIP để AI phân tích chi tiết từng lỗi câu.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsQuotaExhaustedModalOpen(false);
                  handleSubmit(true);
                }}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                Nộp bài &amp; Xem bài mẫu
              </button>
              <Link
                href="/profile"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:bg-brand-brown transition-colors text-center cursor-pointer"
              >
                Nâng cấp thêm lượt
              </Link>
            </div>
          </div>
        </div>
      )}

      <ExamExitConfirmModal
        isOpen={showExitConfirm}
        title="Rời khỏi bài thi Writing?"
        message="Bạn đang trong quá trình làm bài viết Writing. Nếu quay lại lúc này, các đoạn văn bản chưa nộp chấm sẽ không được lưu điểm. Bạn có chắc chắn muốn rời khỏi không?"
        confirmText="Xác nhận rời khỏi"
        cancelText="Tiếp tục làm bài"
        onConfirm={() => {
          setShowExitConfirm(false);
          router.push("/writing");
        }}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>
  );
}

export default function WritingExamRunner() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <WritingExamRunnerContent />
    </Suspense>
  );
}
