"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { SortableHeader, SortState } from "@/components/admin/sortable-header";
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Trash2,
  Clock,
  HelpCircle,
  Users,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Crown,
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowRight,
  X,
  Headphones,
  BookMarked,
  Mic,
  PenTool,
  Volume2,
  Eye,
  Edit2,
  Copy,
  FileCode,
  ExternalLink,
  Play,
  FileText,
  Check,
  BarChart3,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Flame,
  Star,
  UploadCloud,
  ListFilter,
  SlidersHorizontal,
  AlertCircle,
  Lightbulb,
  Radio,
  Hash,
} from "lucide-react";
import ConfirmModal from "@/components/admin/confirm-modal";
import ExamSmartImportModal from "@/components/admin/exam-smart-import-modal";
import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminTableCard from "@/components/admin/admin-table-card";

interface ExamPartItem {
  id: string;
  partNumber: number;
  title: string;
  questionsCount: number;
}

interface ExamItem {
  id: string;
  title: string;
  description?: string | null;
  skill: string;
  durationMinutes: number;
  isPro: boolean;
  isPublished: boolean;
  hotLevel?: number;
  forecastTag?: string | null;
  partsCount: number;
  questionsCount: number;
  attemptsCount: number;
  createdAt: string;
  parts?: ExamPartItem[];
}

interface QuestionItem {
  id: string;
  partId: string;
  questionNumber: number;
  questionType: string;
  prompt: string;
  options?: any;
  correctAnswer?: string | null;
  explanation?: string | null;
  maxScore: number;
  createdAt: string;
  part: {
    id: string;
    partNumber: number;
    title: string;
    passageText?: string | null;
    audioUrl?: string | null;
    imageUrl?: string | null;
    exam: {
      id: string;
      title: string;
      skill: string;
      isPro: boolean;
      isPublished: boolean;
    };
  };
}

// Aptis CEFR Standard Parts Specification mapping
const SKILL_PARTS_INFO: Record<
  string,
  { partNumber: number; name: string; desc: string; badge: string }[]
> = {
  LISTENING: [
    { partNumber: 1, name: "Part 1: Thông tin ngắn", desc: "13 câu hỏi độc thoại / đối thoại ngắn chọn 1 trong 4", badge: "13 Qs" },
    { partNumber: 2, name: "Part 2: Nối quan điểm", desc: "4 người nói & ghép với 6 nhận định quan điểm", badge: "4 Qs" },
    { partNumber: 3, name: "Part 3: Hội thoại Nam & Nữ", desc: "Phân biệt ai đồng ý / ai phản đối (Nam, Nữ, Cả hai)", badge: "4 Qs" },
    { partNumber: 4, name: "Part 4: Bài độc thoại", desc: "2 bài nói học thuật / tin tức dài mở rộng", badge: "4 Qs" },
  ],
  READING: [
    { partNumber: 1, name: "Part 1: Điền từ câu ngắn", desc: "Hoàn thành 5 câu ngắn với từ vựng/ngữ pháp thích hợp", badge: "5 Qs" },
    { partNumber: 2, name: "Part 2: Sắp xếp đoạn văn", desc: "Sắp xếp 5-6 câu lộn xộn thành câu chuyện hoàn chỉnh", badge: "5 Qs" },
    { partNumber: 3, name: "Part 3: Nối văn bản ngắn", desc: "4 đoạn văn ngắn & 7 phát biểu tương ứng người nói", badge: "7 Qs" },
    { partNumber: 4, name: "Part 4: Tiêu đề đoạn văn dài", desc: "Ghép tiêu đề phù hợp cho 7 đoạn văn trong bài đọc dài", badge: "7 Qs" },
  ],
  SPEAKING: [
    { partNumber: 1, name: "Part 1: Thông tin cá nhân", desc: "Trả lời 3 câu hỏi cơ bản về bản thân (30s / câu)", badge: "3 Qs" },
    { partNumber: 2, name: "Part 2: Miêu tả 1 bức tranh", desc: "Mô tả ảnh + 2 câu hỏi mở rộng chủ đề (45s / câu)", badge: "3 Qs" },
    { partNumber: 3, name: "Part 3: So sánh 2 bức tranh", desc: "Đối chiếu 2 bức ảnh & 2 câu hỏi tình huống (45s / câu)", badge: "3 Qs" },
    { partNumber: 4, name: "Part 4: Trải nghiệm & Thảo luận", desc: "1 bức ảnh trừu tượng + 3 câu hỏi (1p chuẩn bị, 2p nói)", badge: "3 Qs" },
  ],
  WRITING: [
    { partNumber: 1, name: "Part 1: Mẫu đơn cá nhân", desc: "Điền 5 câu ngắn (1 - 5 từ mỗi câu)", badge: "5 Qs" },
    { partNumber: 2, name: "Part 2: Đơn gia nhập CLB", desc: "Viết đoạn văn ngắn 20 - 30 từ giải thích lý do", badge: "1 Q" },
    { partNumber: 3, name: "Part 3: Chat mạng xã hội", desc: "Trả lời 3 tin nhắn thảo luận trên diễn đàn CLB (30-40 từ)", badge: "3 Qs" },
    { partNumber: 4, name: "Part 4: Email Thân mật & Trang trọng", desc: "Email 1 cho bạn (50 từ) & Email 2 cho Quản trị viên (120-150 từ)", badge: "2 Qs" },
  ],
  FULL_TEST: [
    { partNumber: 1, name: "Phần 1: Listening", desc: "Trọn bộ 25 câu hỏi Listening 4 Parts chuẩn Aptis", badge: "Listening" },
    { partNumber: 2, name: "Phần 2: Reading", desc: "Trọn bộ 35 phút Reading 4 Parts chuẩn Aptis", badge: "Reading" },
    { partNumber: 3, name: "Phần 3: Writing", desc: "Trọn bộ 50 phút Writing 4 Parts chuẩn Aptis", badge: "Writing" },
    { partNumber: 4, name: "Phần 4: Speaking", desc: "Trọn bộ 12 phút Speaking 4 Parts chuẩn Aptis", badge: "Speaking" },
  ],
};

const QUESTION_TYPES = [
  { value: "ALL", label: "Tất cả dạng câu" },
  { value: "MULTIPLE_CHOICE", label: "Trắc nghiệm (Multiple Choice)" },
  { value: "GAP_FILL", label: "Điền từ vào chỗ trống (Gap Fill)" },
  { value: "SENTENCE_ORDER", label: "Sắp xếp câu (Sentence Order)" },
  { value: "MATCHING", label: "Nối thông tin (Matching)" },
  { value: "ESSAY", label: "Viết luận / Email (Essay)" },
  { value: "SHORT_TEXT", label: "Trả lời ngắn (Short Text)" },
  { value: "SPEAKING_AUDIO", label: "Ghi âm nói (Speaking Audio)" },
];

export default function AdminExamsPage() {
  // ── View Mode: "EXAMS" (Danh sách Đề thi) vs "QUESTIONS" (Ngân hàng & Sửa câu hỏi)
  const [viewMode, setViewMode] = useState<"EXAMS" | "QUESTIONS">("EXAMS");

  // ── Shared Filter State
  const [skillFilter, setSkillFilter] = useState("ALL");
  const [partFilter, setPartFilter] = useState<number | null>(null);

  // ── Exams State
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [searchTermExams, setSearchTermExams] = useState("");
  const [hotFilter, setHotFilter] = useState("ALL");
  const [pageExams, setPageExams] = useState(1);
  const [pageSizeExams, setPageSizeExams] = useState(15);
  const [totalPagesExams, setTotalPagesExams] = useState(1);
  const [totalCountExams, setTotalCountExams] = useState(0);

  // ── Questions State
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [searchQuestionTerm, setSearchQuestionTerm] = useState("");
  const [questionTypeFilter, setQuestionTypeFilter] = useState("ALL");
  const [pageQuestions, setPageQuestions] = useState(1);
  const [pageSizeQuestions, setPageSizeQuestions] = useState(15);
  const [totalPagesQuestions, setTotalPagesQuestions] = useState(1);
  const [totalCountQuestions, setTotalCountQuestions] = useState(0);

  // ── Modals & Actions State
  const [openMenuExamId, setOpenMenuExamId] = useState<string | null>(null);
  const [smartImportOpen, setSmartImportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Exam Builder
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [createLoading, setCreateLoading] = useState(false);

  // Preview Modal
  const [previewExam, setPreviewExam] = useState<ExamItem | null>(null);

  // Quick Edit Exam Modal
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    skill: "FULL_TEST",
    durationMinutes: 162,
    isPro: false,
    isPublished: true,
    hotLevel: 0,
  });
  const [editLoading, setEditLoading] = useState(false);

  // Quick Edit Question Modal
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [questionEditForm, setQuestionEditForm] = useState({
    prompt: "",
    questionNumber: 1,
    questionType: "MULTIPLE_CHOICE",
    maxScore: 1,
    options: [] as string[],
    correctAnswer: "",
    explanation: "",
  });
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Delete Question Modal
  const [confirmDeleteQuestion, setConfirmDeleteQuestion] = useState<QuestionItem | null>(null);

  // JSON Import Modal
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonLoading, setJsonLoading] = useState(false);

  // Confirm delete exam modal
  const [confirmDeleteExam, setConfirmDeleteExam] = useState<ExamItem | null>(null);

  // KPI metrics strip toggle
  const [showMetrics, setShowMetrics] = useState(false);

  // Sorting
  type ExamSortKey =
    | "title"
    | "skill"
    | "hotLevel"
    | "durationMinutes"
    | "questionsCount"
    | "isPublished"
    | "isPro"
    | "attemptsCount"
    | "createdAt";

  const [sortState, setSortState] = useState<SortState<ExamSortKey>>({
    key: "createdAt",
    order: "desc",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Close row menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-row-menu]")) {
        setOpenMenuExamId(null);
      }
    };
    if (openMenuExamId) {
      document.addEventListener("click", handleOutsideClick);
      return () => document.removeEventListener("click", handleOutsideClick);
    }
  }, [openMenuExamId]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("admin_exams_kpi_visible") : null;
    if (saved === "true") {
      setShowMetrics(true);
    }
  }, []);

  const toggleMetrics = () => {
    setShowMetrics((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_exams_kpi_visible", String(next));
      }
      return next;
    });
  };

  // Helper determine student test room url by skill
  const getExamTakeUrl = (exam: { id: string; skill?: string }) => {
    switch (exam.skill) {
      case "READING":
        return `/reading/${exam.id}`;
      case "LISTENING":
        return `/listening/${exam.id}`;
      case "WRITING":
        return `/writing/${exam.id}`;
      case "SPEAKING":
        return `/speaking/${exam.id}`;
      case "FULL_TEST":
      default:
        return `/thi-thu/${exam.id}`;
    }
  };

  // Exam Builder State
  const [newExam, setNewExam] = useState({
    title: "",
    description: "",
    skill: "FULL_TEST",
    durationMinutes: 162,
    isPro: false,
    hotLevel: 0,
    parts: [
      {
        partNumber: 1,
        title: "Part 1: Social Network Comprehension",
        instructions: "Read the questions and select the best answer.",
        passageText: "",
        questions: [
          {
            questionNumber: 1,
            questionType: "MULTIPLE_CHOICE",
            prompt: "Where is the conference being held?",
            options: ["A. Main Hall", "B. Library", "C. Online Room"],
            correctAnswer: "A",
            explanation: "The text specifies Main Hall as the location.",
            maxScore: 1,
          },
        ],
      },
    ],
  });

  // Fetch Exams
  const fetchExams = useCallback(async () => {
    setLoadingExams(true);
    try {
      const res = await api.admin.getExams({
        skill: skillFilter !== "ALL" ? skillFilter : undefined,
        partNumber: partFilter || undefined,
        search: searchTermExams.trim() || undefined,
        page: pageExams,
        limit: pageSizeExams,
      });

      if (res.success && res.data) {
        setExams(res.data);
        if (res.meta) {
          setTotalPagesExams(res.meta.totalPages || 1);
          setTotalCountExams(res.meta.total || res.data.length);
        }
      }
    } catch (err) {
      console.error("Lỗi tải danh sách đề thi:", err);
    } finally {
      setLoadingExams(false);
    }
  }, [skillFilter, partFilter, searchTermExams, pageExams, pageSizeExams]);

  // Fetch Questions
  const fetchQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    try {
      const res = await api.admin.searchQuestions({
        skill: skillFilter !== "ALL" ? skillFilter : undefined,
        partNumber: partFilter || undefined,
        questionType: questionTypeFilter !== "ALL" ? questionTypeFilter : undefined,
        search: searchQuestionTerm.trim() || undefined,
        page: pageQuestions,
        limit: pageSizeQuestions,
      });

      if (res.success && res.data) {
        setQuestions(res.data);
        if (res.meta) {
          setTotalPagesQuestions(res.meta.totalPages || 1);
          setTotalCountQuestions(res.meta.total || res.data.length);
        }
      }
    } catch (err) {
      console.error("Lỗi tìm kiếm câu hỏi:", err);
    } finally {
      setLoadingQuestions(false);
    }
  }, [skillFilter, partFilter, questionTypeFilter, searchQuestionTerm, pageQuestions, pageSizeQuestions]);

  // Effect to load exams when in EXAMS mode
  useEffect(() => {
    if (viewMode === "EXAMS") {
      fetchExams();
    }
  }, [fetchExams, viewMode]);

  // Effect to load questions when in QUESTIONS mode
  useEffect(() => {
    if (viewMode === "QUESTIONS") {
      fetchQuestions();
    }
  }, [fetchQuestions, viewMode]);

  // Reset page when skill or part changes
  const handleSkillChange = (newSkill: string) => {
    setSkillFilter(newSkill);
    setPartFilter(null);
    setPageExams(1);
    setPageQuestions(1);
  };

  const handlePartChange = (partNum: number | null) => {
    setPartFilter(partNum);
    setPageExams(1);
    setPageQuestions(1);
  };

  // Lock body scroll for modals
  useEffect(() => {
    if (
      wizardOpen ||
      previewExam ||
      editingExam ||
      editingQuestion ||
      confirmDeleteQuestion ||
      jsonModalOpen ||
      confirmDeleteExam
    ) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setWizardOpen(false);
          setPreviewExam(null);
          setEditingExam(null);
          setEditingQuestion(null);
          setConfirmDeleteQuestion(null);
          setJsonModalOpen(false);
          setConfirmDeleteExam(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [
    wizardOpen,
    previewExam,
    editingExam,
    editingQuestion,
    confirmDeleteQuestion,
    jsonModalOpen,
    confirmDeleteExam,
  ]);

  // Handlers for Exam actions
  const handleDeleteExam = async () => {
    if (!confirmDeleteExam) return;
    try {
      const res = await api.admin.deleteExam(confirmDeleteExam.id);
      if (res.success) {
        showToast(`Đã xóa đề thi "${confirmDeleteExam.title}" thành công!`);
        setConfirmDeleteExam(null);
        fetchExams();
      } else {
        showToast(res.error?.message || "Không thể xóa đề thi");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ");
    }
  };

  const handleTogglePublished = async (exam: ExamItem) => {
    const nextState = !exam.isPublished;
    setExams((prev) =>
      prev.map((e) => (e.id === exam.id ? { ...e, isPublished: nextState } : e))
    );
    try {
      const res = await api.admin.updateExam(exam.id, { isPublished: nextState });
      if (res.success) {
        showToast(
          nextState
            ? `Đã xuất bản đề "${exam.title}" cho học viên!`
            : `Đã chuyển đề "${exam.title}" về chế độ bản nháp (Ẩn).`
        );
      } else {
        fetchExams();
      }
    } catch {
      fetchExams();
    }
  };

  const handleTogglePro = async (exam: ExamItem) => {
    const nextState = !exam.isPro;
    setExams((prev) =>
      prev.map((e) => (e.id === exam.id ? { ...e, isPro: nextState } : e))
    );
    try {
      const res = await api.admin.updateExam(exam.id, { isPro: nextState });
      if (res.success) {
        showToast(
          nextState
            ? `Đã cài đặt đề "${exam.title}" yêu cầu gói VIP PRO!`
            : `Đề "${exam.title}" hiện được mở MIỄN PHÍ cho tất cả học viên.`
        );
      } else {
        fetchExams();
      }
    } catch {
      fetchExams();
    }
  };

  const handleCycleHotLevel = async (exam: ExamItem) => {
    const nextLevel = ((exam.hotLevel || 0) + 1) % 4;
    setExams((prev) =>
      prev.map((e) => (e.id === exam.id ? { ...e, hotLevel: nextLevel } : e))
    );
    try {
      const res = await api.admin.updateExam(exam.id, { hotLevel: nextLevel });
      if (res.success) {
        const labels = [
          "Mặc định (Không gán sao)",
          "1 Sao ⭐ (Ôn tập bổ trợ)",
          "2 Sao ⭐⭐ (Đề Hot)",
          "3 Sao ⭐⭐⭐ 🔥 (Đề Tủ - Xác suất vào cao)",
        ];
        showToast(`Đã đổi mức độ hot "${exam.title}" -> ${labels[nextLevel]}`);
      } else {
        fetchExams();
      }
    } catch {
      fetchExams();
    }
  };

  const handleDuplicateExam = async (exam: ExamItem) => {
    try {
      const res = await api.admin.duplicateExam(exam.id);
      if (res.success) {
        showToast(`Đã nhân bản đề thi thành công! Bản sao mới đã được tạo.`);
        fetchExams();
      } else {
        showToast(res.error?.message || "Không thể nhân bản đề thi");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ");
    }
  };

  const handleOpenEdit = (exam: ExamItem) => {
    setEditingExam(exam);
    setEditForm({
      title: exam.title,
      description: exam.description || "",
      skill: exam.skill,
      durationMinutes: exam.durationMinutes,
      isPro: exam.isPro,
      isPublished: exam.isPublished,
      hotLevel: exam.hotLevel || 0,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingExam) return;
    setEditLoading(true);
    try {
      const res = await api.admin.updateExam(editingExam.id, {
        title: editForm.title,
        description: editForm.description,
        skill: editForm.skill,
        durationMinutes: Number(editForm.durationMinutes),
        isPro: editForm.isPro,
        isPublished: editForm.isPublished,
        hotLevel: Number(editForm.hotLevel || 0),
      });
      if (res.success) {
        showToast(`Đã cập nhật thông tin đề "${editForm.title}" thành công!`);
        setEditingExam(null);
        fetchExams();
      } else {
        showToast(res.error?.message || "Không thể cập nhật đề thi");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ");
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreateExam = async () => {
    setCreateLoading(true);
    try {
      const res = await api.admin.createExam({
        title: newExam.title,
        description: newExam.description || undefined,
        skill: newExam.skill,
        durationMinutes: Number(newExam.durationMinutes),
        isPro: newExam.isPro,
        hotLevel: Number(newExam.hotLevel || 0),
        parts: newExam.parts,
      });

      if (res.success) {
        setWizardOpen(false);
        setWizardStep(1);
        showToast("Tạo đề thi mới thành công!");
        fetchExams();
      } else {
        showToast(res.error?.message || "Không thể tạo đề thi");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJsonImport = async () => {
    setJsonLoading(true);
    try {
      const parsed = JSON.parse(jsonText);
      const res = await api.admin.createExam(parsed);
      if (res.success) {
        showToast(`Đã nhập đề thi "${parsed.title || "Mới"}" từ JSON thành công!`);
        setJsonModalOpen(false);
        setJsonText("");
        fetchExams();
      } else {
        showToast(res.error?.message || "Định dạng JSON không hợp lệ");
      }
    } catch {
      showToast("Lỗi cú pháp JSON. Vui lòng kiểm tra lại cấu trúc.");
    } finally {
      setJsonLoading(false);
    }
  };

  // Handlers for Question Live Editor
  const handleOpenEditQuestion = (q: QuestionItem) => {
    let parsedOptions: string[] = [];
    if (Array.isArray(q.options)) {
      parsedOptions = q.options.map((opt) => String(opt));
    } else if (typeof q.options === "string") {
      try {
        const p = JSON.parse(q.options);
        if (Array.isArray(p)) parsedOptions = p.map((opt) => String(opt));
      } catch {
        parsedOptions = [];
      }
    }

    setEditingQuestion(q);
    setQuestionEditForm({
      prompt: q.prompt || "",
      questionNumber: q.questionNumber || 1,
      questionType: q.questionType || "MULTIPLE_CHOICE",
      maxScore: q.maxScore || 1,
      options: parsedOptions,
      correctAnswer: q.correctAnswer || "",
      explanation: q.explanation || "",
    });
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion) return;
    setSavingQuestion(true);
    try {
      const payload: any = {
        prompt: questionEditForm.prompt,
        questionNumber: Number(questionEditForm.questionNumber),
        questionType: questionEditForm.questionType,
        maxScore: Number(questionEditForm.maxScore),
        correctAnswer: questionEditForm.correctAnswer,
        explanation: questionEditForm.explanation,
      };

      if (
        questionEditForm.questionType === "MULTIPLE_CHOICE" ||
        questionEditForm.questionType === "GAP_FILL"
      ) {
        payload.options = questionEditForm.options;
      }

      const res = await api.admin.updateQuestion(editingQuestion.id, payload);
      if (res.success) {
        showToast(`Đã cập nhật câu hỏi #${editingQuestion.questionNumber} thành công!`);
        // Update local state directly
        setQuestions((prev) =>
          prev.map((item) =>
            item.id === editingQuestion.id
              ? {
                  ...item,
                  prompt: payload.prompt,
                  questionNumber: payload.questionNumber,
                  questionType: payload.questionType,
                  maxScore: payload.maxScore,
                  options: payload.options || item.options,
                  correctAnswer: payload.correctAnswer,
                  explanation: payload.explanation,
                }
              : item
          )
        );
        setEditingQuestion(null);
      } else {
        showToast(res.error?.message || "Không thể cập nhật câu hỏi");
      }
    } catch {
      showToast("Lỗi khi lưu câu hỏi");
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!confirmDeleteQuestion) return;
    try {
      const res = await api.admin.deleteQuestion(confirmDeleteQuestion.id);
      if (res.success) {
        showToast(`Đã xóa câu hỏi #${confirmDeleteQuestion.questionNumber} khỏi đề thi!`);
        setQuestions((prev) => prev.filter((q) => q.id !== confirmDeleteQuestion.id));
        setConfirmDeleteQuestion(null);
      } else {
        showToast(res.error?.message || "Không thể xóa câu hỏi");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ");
    }
  };

  // Filter exams by hotLevel client-side if needed
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      let matchesHot = true;
      if (hotFilter === "HOT_ALL") matchesHot = (e.hotLevel || 0) > 0;
      else if (hotFilter === "HOT_3") matchesHot = (e.hotLevel || 0) === 3;
      else if (hotFilter === "HOT_2") matchesHot = (e.hotLevel || 0) === 2;
      else if (hotFilter === "HOT_1") matchesHot = (e.hotLevel || 0) === 1;
      else if (hotFilter === "HOT_0") matchesHot = (e.hotLevel || 0) === 0;

      return matchesHot;
    });
  }, [exams, hotFilter]);

  const handleSort = (field: ExamSortKey) => {
    setSortState((prev) => {
      if (prev.key !== field) {
        return { key: field, order: "asc" };
      }
      if (prev.order === "asc") return { key: field, order: "desc" };
      if (prev.order === "desc") return { key: field, order: null };
      return { key: field, order: "asc" };
    });
  };

  const sortedExams = useMemo(() => {
    const list = [...filteredExams];
    if (!sortState.order || !sortState.key) return list;

    const { key, order } = sortState;
    return list.sort((a, b) => {
      let valA: any = a[key as keyof ExamItem];
      let valB: any = b[key as keyof ExamItem];

      if (key === "isPublished" || key === "isPro") {
        valA = valA ? 1 : 0;
        valB = valB ? 1 : 0;
      }
      if (typeof valA === "string") {
        return order === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return order === "asc" ? (valA ?? 0) - (valB ?? 0) : (valB ?? 0) - (valA ?? 0);
    });
  }, [filteredExams, sortState]);

  // Executive KPI calculations
  const fullTestCount = useMemo(
    () => exams.filter((e) => e.skill === "FULL_TEST").length,
    [exams]
  );
  const proCount = useMemo(() => exams.filter((e) => e.isPro).length, [exams]);
  const freeCount = useMemo(() => exams.length - proCount, [exams, proCount]);
  const totalAttempts = useMemo(
    () => exams.reduce((sum, e) => sum + (e.attemptsCount || 0), 0),
    [exams]
  );

  const getSkillBadge = (skill: string) => {
    switch (skill) {
      case "FULL_TEST":
        return {
          icon: Sparkles,
          label: "Full Test",
          className: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300",
        };
      case "LISTENING":
        return {
          icon: Headphones,
          label: "Listening",
          className: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300",
        };
      case "READING":
        return {
          icon: BookMarked,
          label: "Reading",
          className: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300",
        };
      case "SPEAKING":
        return {
          icon: Mic,
          label: "Speaking",
          className: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300",
        };
      case "WRITING":
        return {
          icon: PenTool,
          label: "Writing",
          className: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300",
        };
      default:
        return {
          icon: BookMarked,
          label: skill,
          className: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300",
        };
    }
  };

  const currentSkillParts = useMemo(() => {
    if (skillFilter !== "ALL" && SKILL_PARTS_INFO[skillFilter]) {
      return SKILL_PARTS_INFO[skillFilter];
    }
    // Default generic parts 1-4
    return [
      { partNumber: 1, name: "Part 1", desc: "Phần thi số 1", badge: "Part 1" },
      { partNumber: 2, name: "Part 2", desc: "Phần thi số 2", badge: "Part 2" },
      { partNumber: 3, name: "Part 3", desc: "Phần thi số 3", badge: "Part 3" },
      { partNumber: 4, name: "Part 4", desc: "Phần thi số 4", badge: "Part 4" },
    ];
  }, [skillFilter]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-heading font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <AdminPageHeader
        stats={[
          { icon: BookOpen, value: totalCountExams || exams.length, label: "đề" },
          { icon: Sparkles, value: fullTestCount, label: "Full Test", iconColor: "text-purple-400" },
          { icon: Crown, value: proCount, label: "VIP", subValue: `(${freeCount} Free)`, iconColor: "text-amber-500" },
          { icon: CheckCircle2, value: totalAttempts, label: "lượt thi", iconColor: "text-emerald-500" },
        ]}
        showMetricsToggle
        showMetrics={showMetrics}
        metricsLabel="Chỉ số chi tiết"
        onToggleMetrics={toggleMetrics}
        actions={
          <>
            <button
              onClick={() => setSmartImportOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800/70 bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[11px] font-heading font-semibold transition-all flex items-center gap-1.5"
              title="Tải lên đề từ file Word (.docx) hoặc Excel (.xlsx)"
            >
              <UploadCloud className="w-3.5 h-3.5 text-blue-500" />
              <span>Nhập Word / Excel</span>
            </button>

            <button
              onClick={() => setJsonModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-heading font-semibold transition-all flex items-center gap-1.5"
              title="Nhập đề cấu trúc JSON"
            >
              <FileCode className="w-3.5 h-3.5 text-slate-400" />
              <span>Nhập JSON</span>
            </button>

            <button
              onClick={() => {
                setWizardStep(1);
                setWizardOpen(true);
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-heading font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo đề thủ công</span>
            </button>
          </>
        }
      />

      {/* KPI Cards Strip */}
      {showMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-heading">
                Tổng số đề thi
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white font-mono">
              {totalCountExams || exams.length}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Đã lưu trữ trong ngân hàng</div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-heading">
                Đề Full Test chuẩn
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white font-mono">
              {fullTestCount}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">4 Kỹ năng (162 phút)</div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-heading">
                VIP PRO / Miễn phí
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white font-mono">
              {proCount} <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">/ {freeCount} Free</span>
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Phân quyền học viên</div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-heading">
                Lượt thi hoàn thành
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white font-mono">
              {totalAttempts}
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1">Toàn bộ học viên</div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SMART FILTER WORKSPACE BAR v2 — Redesigned for Admin UX
          Cấu trúc: View Mode → Skill (màu sắc đặc trưng) → Part (nghiệp vụ rõ ràng)
          Context Path: Hiển thị đường dẫn đầy đủ theo nghiệp vụ Aptis
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">

        {/* ── Row 1: View Mode + Quick Actions ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900">
          {/* View Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <button
              onClick={() => {
                if (searchQuestionTerm.trim() && !searchTermExams.trim()) {
                  setSearchTermExams(searchQuestionTerm.trim());
                }
                setViewMode("EXAMS");
              }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-heading font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "EXAMS"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Đề thi</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${viewMode === "EXAMS" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
                {totalCountExams || exams.length}
              </span>
            </button>
            <button
              onClick={() => {
                if (searchTermExams.trim() && !searchQuestionTerm.trim()) {
                  setSearchQuestionTerm(searchTermExams.trim());
                }
                setViewMode("QUESTIONS");
              }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-heading font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "QUESTIONS"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Ngân hàng câu hỏi</span>
              {totalCountQuestions > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${viewMode === "QUESTIONS" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
                  {totalCountQuestions}
                </span>
              )}
            </button>
          </div>

          {/* Context Path Breadcrumb + Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Active Filter Breadcrumb */}
            {(skillFilter !== "ALL" || partFilter !== null) && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 rounded-lg text-[11px]">
                <span className="text-violet-400 dark:text-violet-500">
                  <ListFilter className="w-3 h-3" />
                </span>
                <span className="font-heading font-semibold text-violet-700 dark:text-violet-300">
                  {skillFilter !== "ALL" ? (
                    <>
                      {skillFilter === "LISTENING" && "🎧 Listening"}
                      {skillFilter === "READING" && "📖 Reading"}
                      {skillFilter === "WRITING" && "✍️ Writing"}
                      {skillFilter === "SPEAKING" && "🎙️ Speaking"}
                      {skillFilter === "FULL_TEST" && "✨ Full Test"}
                    </>
                  ) : "Tất cả"}
                </span>
                {partFilter !== null && (
                  <>
                    <ArrowRight className="w-3 h-3 text-violet-400 dark:text-violet-500" />
                    <span className="font-heading font-bold text-violet-800 dark:text-violet-200">
                      Part {partFilter}
                      {skillFilter !== "ALL" && SKILL_PARTS_INFO[skillFilter]?.[partFilter - 1] && (
                        <span className="font-normal text-violet-600 dark:text-violet-400">
                          {" — "}{SKILL_PARTS_INFO[skillFilter][partFilter - 1].name.replace(/Part \d+:\s*/, "")}
                        </span>
                      )}
                    </span>
                  </>
                )}
                <button
                  onClick={() => { setSkillFilter("ALL"); setPartFilter(null); }}
                  className="ml-1 text-violet-400 hover:text-rose-500 transition-colors"
                  title="Xóa bộ lọc"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <button
              onClick={() => { if (viewMode === "EXAMS") fetchExams(); else fetchQuestions(); }}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-800/50 transition-colors"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingExams || loadingQuestions ? "animate-spin text-blue-500" : ""}`} />
            </button>

            {(skillFilter !== "ALL" || partFilter !== null) && (
              <button
                onClick={() => { setSkillFilter("ALL"); setPartFilter(null); }}
                className="sm:hidden text-[11px] font-heading font-semibold text-rose-500 dark:text-rose-400 hover:underline flex items-center gap-1 px-2 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <X className="w-3 h-3" />
                <span>Xóa lọc</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Row 2: Skill Selector — 6 skills with brand colors ── */}
        <div className="px-4 pt-3.5 pb-2 border-b border-slate-100 dark:border-slate-800/70">
          <p className="text-[9.5px] font-heading font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5 flex items-center gap-1.5">
            <Layers className="w-3 h-3" />
            Kỹ năng
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {([
              {
                id: "ALL",
                label: "Tất cả",
                icon: BookMarked,
                activeClass: "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-800 dark:border-slate-100",
                idleClass: "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/80",
              },
              {
                id: "LISTENING",
                label: "Nghe",
                sublabel: "Listening",
                icon: Headphones,
                activeClass: "bg-blue-600 text-white border-blue-600 shadow-blue-200 dark:shadow-blue-900/50",
                idleClass: "border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-800",
              },
              {
                id: "READING",
                label: "Đọc",
                sublabel: "Reading",
                icon: BookMarked,
                activeClass: "bg-emerald-600 text-white border-emerald-600 shadow-emerald-200 dark:shadow-emerald-900/50",
                idleClass: "border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-800",
              },
              {
                id: "WRITING",
                label: "Viết",
                sublabel: "Writing",
                icon: PenTool,
                activeClass: "bg-rose-600 text-white border-rose-600 shadow-rose-200 dark:shadow-rose-900/50",
                idleClass: "border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-300 dark:hover:border-rose-800",
              },
              {
                id: "SPEAKING",
                label: "Nói",
                sublabel: "Speaking",
                icon: Mic,
                activeClass: "bg-amber-500 text-white border-amber-500 shadow-amber-200 dark:shadow-amber-900/50",
                idleClass: "border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-300 dark:hover:border-amber-800",
              },
              {
                id: "FULL_TEST",
                label: "Full Test",
                sublabel: "4 kỹ năng",
                icon: Sparkles,
                activeClass: "bg-purple-600 text-white border-purple-600 shadow-purple-200 dark:shadow-purple-900/50",
                idleClass: "border-purple-200 dark:border-purple-900/60 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-300 dark:hover:border-purple-800",
              },
            ] as const).map((tab) => {
              const TabIcon = tab.icon;
              const isActive = skillFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSkillChange(tab.id)}
                  className={`flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl border font-heading font-semibold text-[11px] transition-all shadow-xs ${
                    isActive ? tab.activeClass + " shadow-sm" : tab.activeClass === "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-800 dark:border-slate-100" ? "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/80" : tab.idleClass
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex flex-col items-start leading-none">
                    <span className="font-bold">{tab.label}</span>
                    {"sublabel" in tab && tab.sublabel && (
                      <span className={`text-[9px] mt-0.5 font-normal ${isActive ? "opacity-80" : "opacity-60"}`}>{tab.sublabel}</span>
                    )}
                  </span>
                  {isActive && (
                    <CheckCircle2 className="w-3 h-3 ml-0.5 opacity-90" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Row 3: Part Selector — Horizontal scrollable chips with context ── */}
        <div className="px-4 pt-3 pb-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[9.5px] font-heading font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3" />
              Phần thi (Part)
              {skillFilter !== "ALL" && (
                <span className="ml-1 normal-case font-normal tracking-normal text-[10px] text-slate-500 dark:text-slate-400">
                  — {skillFilter === "LISTENING" ? "Listening" : skillFilter === "READING" ? "Reading" : skillFilter === "WRITING" ? "Writing" : skillFilter === "SPEAKING" ? "Speaking" : "Full Test"}
                </span>
              )}
            </p>
            {partFilter !== null && skillFilter !== "ALL" && SKILL_PARTS_INFO[skillFilter]?.[partFilter - 1] && (
              <div className="flex items-center gap-1.5 text-[10px] text-violet-600 dark:text-violet-400 font-heading font-semibold">
                <Hash className="w-3 h-3" />
                <span>{SKILL_PARTS_INFO[skillFilter][partFilter - 1].name}</span>
              </div>
            )}
          </div>

          {/* Part pills — horizontal scroll on small screen, wraps on large */}
          <div className="flex items-stretch gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {/* All parts */}
            <button
              onClick={() => handlePartChange(null)}
              className={`flex-none flex flex-col items-start justify-between p-2.5 min-w-[120px] rounded-xl border transition-all text-left ${
                partFilter === null
                  ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                  : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-800 hover:bg-violet-50/50 dark:hover:bg-violet-950/20"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[11px] font-heading font-bold">Tất cả</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${partFilter === null ? "bg-white/25 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
                  ALL
                </span>
              </div>
              <p className={`text-[9.5px] leading-snug ${partFilter === null ? "text-white/80" : "text-slate-400 dark:text-slate-500"}`}>
                {skillFilter === "ALL" ? "Mọi kỹ năng & Part" : `Toàn bộ ${skillFilter}`}
              </p>
            </button>

            {/* Dynamic Part pills */}
            {currentSkillParts.map((part) => {
              const isSelected = partFilter === part.partNumber;
              const partColors: Record<string, { active: string; idle: string }> = {
                LISTENING: { active: "bg-blue-600 text-white border-blue-600", idle: "border-blue-100 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-slate-700 dark:text-slate-300" },
                READING: { active: "bg-emerald-600 text-white border-emerald-600", idle: "border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-slate-700 dark:text-slate-300" },
                WRITING: { active: "bg-rose-600 text-white border-rose-600", idle: "border-rose-100 dark:border-rose-900/50 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 text-slate-700 dark:text-slate-300" },
                SPEAKING: { active: "bg-amber-500 text-white border-amber-500", idle: "border-amber-100 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-slate-700 dark:text-slate-300" },
                FULL_TEST: { active: "bg-purple-600 text-white border-purple-600", idle: "border-purple-100 dark:border-purple-900/50 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-slate-700 dark:text-slate-300" },
                ALL: { active: "bg-violet-600 text-white border-violet-600", idle: "border-slate-200 dark:border-slate-700/80 hover:border-violet-200 dark:hover:border-violet-900 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 text-slate-700 dark:text-slate-300" },
              };
              const colors = partColors[skillFilter] || partColors["ALL"];
              return (
                <button
                  key={part.partNumber}
                  onClick={() => handlePartChange(part.partNumber)}
                  className={`flex-none flex flex-col items-start justify-between p-2.5 min-w-[150px] max-w-[200px] rounded-xl border transition-all text-left shadow-xs ${
                    isSelected ? colors.active + " shadow-sm" : "bg-white dark:bg-slate-800/60 " + colors.idle
                  }`}
                >
                  <div className="flex items-start justify-between w-full mb-1 gap-1.5">
                    <span className="text-[11px] font-heading font-bold leading-tight line-clamp-1">
                      Part {part.partNumber}
                    </span>
                    <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold whitespace-nowrap ${isSelected ? "bg-white/25 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
                      {part.badge}
                    </span>
                  </div>
                  <p className={`text-[9.5px] leading-snug line-clamp-2 ${isSelected ? "text-white/85" : "text-slate-500 dark:text-slate-400"}`} title={part.desc}>
                    {part.name.replace(/Part \d+:\s*/, "")}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active filter summary bar — student-facing context */}
          {(skillFilter !== "ALL" || partFilter !== null) && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/50 text-[11px]">
              <span className="text-slate-400 dark:text-slate-500 shrink-0">
                <Radio className="w-3 h-3" />
              </span>
              <span className="font-heading font-medium text-slate-500 dark:text-slate-400 shrink-0">Bộ lọc đang xem:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Skill chip */}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-heading font-bold text-[10px] border ${
                  skillFilter === "LISTENING" ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300"
                  : skillFilter === "READING" ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300"
                  : skillFilter === "WRITING" ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300"
                  : skillFilter === "SPEAKING" ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300"
                  : skillFilter === "FULL_TEST" ? "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}>
                  {skillFilter === "ALL" ? "Tất cả kỹ năng" : skillFilter}
                </span>
                {partFilter !== null && (
                  <>
                    <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-heading font-bold text-[10px] border bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/60 text-violet-700 dark:text-violet-300">
                      Part {partFilter}
                    </span>
                    {skillFilter !== "ALL" && SKILL_PARTS_INFO[skillFilter]?.[partFilter - 1] && (
                      <>
                        <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="text-slate-600 dark:text-slate-400 font-normal">
                          {SKILL_PARTS_INFO[skillFilter][partFilter - 1].name.replace(/Part \d+:\s*/, "")}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 font-mono">
                          ({SKILL_PARTS_INFO[skillFilter][partFilter - 1].badge})
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
              <button
                onClick={() => { setSkillFilter("ALL"); setPartFilter(null); }}
                className="ml-auto shrink-0 text-[10px] font-heading font-semibold text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 hover:underline"
              >
                <X className="w-3 h-3" />
                Xóa lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          VIEW 1: QUẢN LÝ ĐỀ THI (EXAM PACKS VIEW)
      ───────────────────────────────────────────────────────────── */}
      {viewMode === "EXAMS" && (
        <div className="space-y-4">
          {/* Secondary Search & Hot Filter Strip */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTermExams}
                  onChange={(e) => setSearchTermExams(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchExams()}
                  placeholder="Tìm theo tên đề thi, bài đọc, hoặc bất kỳ câu hỏi nào... (Gõ từ khóa rồi nhấn Enter)"
                  className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {searchTermExams && (
                  <button
                    onClick={() => {
                      setSearchTermExams("");
                      fetchExams();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={hotFilter}
                  onChange={(e) => setHotFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-heading font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 shrink-0"
                  title="Lọc theo độ hot của đề"
                >
                  <option value="ALL">🔥 Mọi mức độ Hot</option>
                  <option value="HOT_ALL">⭐ Có gắn sao</option>
                  <option value="HOT_3">🔥 3⭐ Đề tủ (Hay ra)</option>
                  <option value="HOT_2">⭐⭐ 2⭐ Đề hot</option>
                  <option value="HOT_1">⭐ 1⭐ Ôn tập</option>
                  <option value="HOT_0">⚪ Chưa gán sao</option>
                </select>

                <button
                  onClick={fetchExams}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-heading font-semibold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Tìm kiếm</span>
                </button>
              </div>
            </div>

            {/* Smart Banner: Gợi ý tìm & sửa trực tiếp câu hỏi nếu có từ khóa */}
            {searchTermExams.trim() && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-2.5 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 rounded-xl text-xs text-violet-900 dark:text-violet-200 shadow-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <span>
                    Bạn đang tìm nội dung câu hỏi/bài đọc: <strong className="font-mono text-violet-800 dark:text-violet-100">&quot;{searchTermExams.trim()}&quot;</strong>?
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSearchQuestionTerm(searchTermExams.trim());
                    setViewMode("QUESTIONS");
                    setPageQuestions(1);
                  }}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-heading font-bold text-xs shrink-0 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Chuyển sang Ngân hàng câu hỏi để sửa trực tiếp câu này</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Exams Grid Table */}
          <AdminTableCard
            pagination={
              <AdminPagination
                currentPage={pageExams}
                totalPages={totalPagesExams}
                totalItems={totalCountExams || sortedExams.length}
                pageSize={pageSizeExams}
                pageSizeOptions={[10, 15, 25, 50]}
                onPageChange={(newPage) => setPageExams(newPage)}
                onPageSizeChange={(newSize) => {
                  setPageSizeExams(newSize);
                  setPageExams(1);
                }}
                itemName="đề thi"
              />
            }
          >
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-heading font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <SortableHeader
                    field="title"
                    title="Tên đề thi & Cấu trúc Parts"
                    currentSort={sortState}
                    onSort={handleSort}
                    className="px-4 sm:px-6"
                  />
                  <SortableHeader
                    field="skill"
                    title="Kỹ năng"
                    currentSort={sortState}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    field="hotLevel"
                    title="Mức độ Hot"
                    currentSort={sortState}
                    onSort={handleSort}
                    align="center"
                  />
                  <SortableHeader
                    field="durationMinutes"
                    title="Thời lượng"
                    currentSort={sortState}
                    onSort={handleSort}
                    align="right"
                  />
                  <SortableHeader
                    field="isPublished"
                    title="Trạng thái"
                    currentSort={sortState}
                    onSort={handleSort}
                    align="center"
                  />
                  <SortableHeader
                    field="isPro"
                    title="Gói"
                    currentSort={sortState}
                    onSort={handleSort}
                    align="center"
                  />
                  <SortableHeader
                    field="attemptsCount"
                    title="Lượt thi"
                    currentSort={sortState}
                    onSort={handleSort}
                    align="right"
                  />
                  <th className="py-3.5 px-4 sm:px-6 text-right pr-6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-900 dark:text-slate-100">
                {loadingExams ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400 dark:text-slate-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-600 dark:text-slate-400" />
                      Đang tải danh sách đề thi...
                    </td>
                  </tr>
                ) : sortedExams.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400 dark:text-slate-500 font-normal">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      Không tìm thấy đề thi nào phù hợp với bộ lọc kỹ năng / part hiện tại.
                    </td>
                  </tr>
                ) : (
                  sortedExams.map((exam) => {
                    const badge = getSkillBadge(exam.skill);
                    const SkillIcon = badge.icon;
                    return (
                      <tr key={exam.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                        {/* Title & Parts Chips */}
                        <td className="py-3.5 px-4 sm:px-6 max-w-md text-left">
                          <Link
                            href={`/admin/exams/${exam.id}/edit`}
                            className="font-heading font-bold text-slate-900 dark:text-white text-xs hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors block"
                            title="Nhấp để mở trang biên soạn nội dung câu hỏi"
                          >
                            {exam.title}
                          </Link>
                          {exam.description && (
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-normal">
                              {exam.description}
                            </div>
                          )}

                          {/* Dynamic Part Chips for intuitive discovery */}
                          {exam.parts && exam.parts.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mt-2">
                              {exam.parts.map((p) => (
                                <span
                                  key={p.id}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                                    partFilter === p.partNumber
                                      ? "bg-purple-100 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-bold"
                                      : "bg-slate-100/70 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-400"
                                  }`}
                                  title={`${p.title} (${p.questionsCount} câu hỏi)`}
                                >
                                  <span>P{p.partNumber}</span>
                                  <span className="text-slate-400">·</span>
                                  <span>{p.questionsCount}q</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Skill */}
                        <td className="py-3.5 px-4 text-left">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold border ${badge.className}`}
                          >
                            <SkillIcon className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        {/* Hot Level */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleCycleHotLevel(exam)}
                            className="inline-flex items-center gap-1 rounded-full text-[10px] font-heading font-bold border-transparent transition-all hover:scale-105 active:scale-95"
                            title="Bấm để đổi nhanh mức độ hot (0⭐ -> 1⭐ -> 2⭐ -> 3⭐)"
                          >
                            {exam.hotLevel === 3 ? (
                              <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 px-2 py-0.5 rounded-full">
                                <Flame className="w-3 h-3 text-rose-500 fill-rose-500" />
                                <span>3⭐ Đề tủ</span>
                              </span>
                            ) : exam.hotLevel === 2 ? (
                              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full">
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <span>2⭐ Hot</span>
                              </span>
                            ) : exam.hotLevel === 1 ? (
                              <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 rounded-full">
                                <Star className="w-3 h-3 text-blue-500 fill-blue-500" />
                                <span>1⭐ Ôn tập</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-normal">
                                + Gán sao
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Duration */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300 font-medium">
                            <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            <span>{exam.durationMinutes}p</span>
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {exam.partsCount} phần · {exam.questionsCount} câu
                          </div>
                        </td>

                        {/* Published Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleTogglePublished(exam)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold border transition-all ${
                              exam.isPublished
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                            title="Bấm để bật/tắt hiển thị đề thi cho học viên"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                exam.isPublished ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                            <span>{exam.isPublished ? "Xuất bản" : "Bản nháp"}</span>
                          </button>
                        </td>

                        {/* Pro Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleTogglePro(exam)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold border transition-all ${
                              exam.isPro
                                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 hover:bg-amber-100 font-bold"
                                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                            title="Bấm để chuyển đổi giữa VIP PRO và Miễn phí"
                          >
                            {exam.isPro ? (
                              <>
                                <Crown className="w-3 h-3 fill-amber-500 text-amber-500" />
                                <span>VIP PRO</span>
                              </>
                            ) : (
                              <span>Miễn phí</span>
                            )}
                          </button>
                        </td>

                        {/* Attempts */}
                        <td className="py-3.5 px-4 text-right font-mono">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {exam.attemptsCount}
                          </span>{" "}
                          <span className="text-slate-400 dark:text-slate-500 text-[11px]">lượt</span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 sm:px-6 text-right pr-6 relative">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <Link
                              href={`/admin/exams/${exam.id}/edit`}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 font-heading font-semibold text-xs transition-colors shadow-2xs flex items-center gap-1"
                              title="Mở trình soạn thảo câu hỏi & Parts"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Biên soạn</span>
                            </Link>

                            {/* 3-Dot Dropdown */}
                            <div className="relative" data-row-menu>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuExamId(openMenuExamId === exam.id ? null : exam.id);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                title="Thao tác khác"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {openMenuExamId === exam.id && (
                                <div
                                  onClick={() => setOpenMenuExamId(null)}
                                  className="absolute right-0 mt-1 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1 z-50 text-xs text-left animate-in fade-in zoom-in-95"
                                >
                                  <Link
                                    href={getExamTakeUrl(exam)}
                                    target="_blank"
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <Play className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Làm thử bài thi</span>
                                  </Link>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSearchQuestionTerm(exam.title);
                                      setViewMode("QUESTIONS");
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                                  >
                                    <Search className="w-3.5 h-3.5 text-purple-500" />
                                    <span>Tìm câu hỏi đề này</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setPreviewExam(exam)}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Xem trước cấu trúc</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(exam)}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Sửa cấu hình nhanh</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateExam(exam)}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>Nhân bản đề thi</span>
                                  </button>

                                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteExam(exam)}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left font-medium"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Xóa đề thi</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </AdminTableCard>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VIEW 2: NGÂN HÀNG & TÌM KIẾM CÂU HỎI (QUESTION FINDER & EDITOR)
      ───────────────────────────────────────────────────────────── */}
      {viewMode === "QUESTIONS" && (
        <div className="space-y-4">
          {/* Question Search & Format Strip */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-500" />
                <input
                  type="text"
                  value={searchQuestionTerm}
                  onChange={(e) => setSearchQuestionTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchQuestions()}
                  placeholder="Tìm chính xác nội dung câu hỏi, đáp án, lời giải thích, bài đọc hoặc tên đề... (Nhấn Enter)"
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl text-xs bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                {searchQuestionTerm && (
                  <button
                    onClick={() => {
                      setSearchQuestionTerm("");
                      fetchQuestions();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={questionTypeFilter}
                  onChange={(e) => {
                    setQuestionTypeFilter(e.target.value);
                    setPageQuestions(1);
                  }}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-heading font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 shrink-0"
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={fetchQuestions}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-heading font-semibold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Tìm câu hỏi</span>
                </button>
              </div>
            </div>

            {/* Active search badges indicator */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <span className="font-heading font-bold text-slate-700 dark:text-slate-300">
                Bộ lọc đang áp dụng:
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                Kỹ năng: <strong>{skillFilter}</strong>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                Phần thi: <strong>{partFilter !== null ? `Part ${partFilter}` : "Tất cả"}</strong>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                Dạng: <strong>{questionTypeFilter}</strong>
              </span>
              {searchQuestionTerm && (
                <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 font-mono text-[10px]">
                  Từ khóa: &quot;{searchQuestionTerm}&quot;
                </span>
              )}
            </div>
          </div>

          {/* Question Cards Container */}
          <div className="space-y-3">
            {loadingQuestions ? (
              <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                <p className="text-xs text-slate-500">Đang tra cứu cơ sở dữ liệu câu hỏi...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-4">
                <HelpCircle className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <h4 className="font-heading font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
                  Không tìm thấy câu hỏi phù hợp
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Hãy thử gõ từ khóa khác (ví dụ: &quot;choose&quot;, &quot;reading&quot;, &quot;library&quot;) hoặc đổi bộ lọc kỹ năng / Part ở phía trên.
                </p>
              </div>
            ) : (
              questions.map((q) => {
                let optionsList: string[] = [];
                if (Array.isArray(q.options)) {
                  optionsList = q.options.map((o) => String(o));
                } else if (typeof q.options === "string") {
                  try {
                    const parsed = JSON.parse(q.options);
                    if (Array.isArray(parsed)) optionsList = parsed.map((o) => String(o));
                  } catch {
                    // ignore
                  }
                }

                return (
                  <div
                    key={q.id}
                    className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700/60 shadow-xs transition-all space-y-3"
                  >
                    {/* Header Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-heading font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {q.part.exam?.skill || "EXAM"} · Part {q.part.partNumber}
                        </span>

                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          Câu #{q.questionNumber}
                        </span>

                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                          {q.questionType}
                        </span>

                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                          Max: {q.maxScore} điểm
                        </span>
                      </div>

                      {/* Parent Exam Badge & Direct Quick Edit Action */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/exams/${q.part.exam.id}/edit`}
                          className="text-[11px] font-heading font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors max-w-xs truncate"
                          title="Bấm để mở trang biên soạn toàn bộ đề này"
                        >
                          <BookOpen className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{q.part.exam.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </Link>

                        <button
                          onClick={() => handleOpenEditQuestion(q)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-heading font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Sửa câu này</span>
                        </button>

                        <button
                          onClick={() => setConfirmDeleteQuestion(q)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="Xóa câu hỏi này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Part Context / Passage Preview */}
                    {q.part.passageText && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-h-24 overflow-y-auto">
                        <span className="font-heading font-bold text-slate-800 dark:text-slate-200 block mb-0.5 text-[10px] uppercase tracking-wider">
                          📖 Bài đọc / Ngữ cảnh Part ({q.part.title}):
                        </span>
                        {q.part.passageText}
                      </div>
                    )}

                    {/* Part Illustration Image (Speaking / Reading) */}
                    {q.part.imageUrl && (
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={q.part.imageUrl}
                          alt="Part illustration"
                          className="h-16 w-24 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                        />
                        <div className="min-w-0 flex-1 text-xs">
                          <span className="font-heading font-bold text-slate-800 dark:text-slate-200 block text-[11px] mb-0.5">
                            🖼️ Tranh ảnh minh họa ({q.part.title}):
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate block">
                            {q.part.imageUrl}
                          </span>
                          <a
                            href={q.part.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1 mt-0.5 font-semibold"
                          >
                            <span>Xem ảnh gốc</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Question Prompt */}
                    <div className="text-xs font-heading font-semibold text-slate-900 dark:text-white leading-relaxed">
                      {q.prompt}
                    </div>

                    {/* Options Grid (If any) */}
                    {optionsList.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {optionsList.map((opt, idx) => {
                          const isCorrect =
                            q.correctAnswer &&
                            (opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ||
                              q.correctAnswer.trim() === String.fromCharCode(65 + idx) ||
                              opt.trim().startsWith(q.correctAnswer.trim()));
                          return (
                            <div
                              key={idx}
                              className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between border ${
                                isCorrect
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 font-semibold"
                                  : "bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              <span className="truncate">{opt}</span>
                              {isCorrect && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold ml-2 shrink-0">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Đáp án đúng</span>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Text Answer (for short answer or essay) */}
                    {optionsList.length === 0 && q.correctAnswer && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đáp án chuẩn: <strong>{q.correctAnswer}</strong></span>
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-heading block mb-0.5">Lời giải thích chi tiết:</strong>
                          {q.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Question Pagination */}
          {questions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-xs">
              <AdminPagination
                currentPage={pageQuestions}
                totalPages={totalPagesQuestions}
                totalItems={totalCountQuestions}
                pageSize={pageSizeQuestions}
                pageSizeOptions={[10, 15, 25, 50]}
                onPageChange={(newPage) => setPageQuestions(newPage)}
                onPageSizeChange={(newSize) => {
                  setPageSizeQuestions(newSize);
                  setPageQuestions(1);
                }}
                itemName="câu hỏi"
              />
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: IN-PLACE QUESTION LIVE EDITOR
      ───────────────────────────────────────────────────────────── */}
      {editingQuestion && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingQuestion(null);
          }}
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                    Chỉnh sửa Câu hỏi #{editingQuestion.questionNumber}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                    Thuộc đề: {editingQuestion.part.exam.title} (Part {editingQuestion.part.partNumber})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingQuestion(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Question Prompt */}
              <div>
                <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Nội dung câu hỏi (Prompt) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={questionEditForm.prompt}
                  onChange={(e) =>
                    setQuestionEditForm({ ...questionEditForm, prompt: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-sans focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  placeholder="Nhập nội dung câu hỏi..."
                />
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Loại câu hỏi
                  </label>
                  <select
                    value={questionEditForm.questionType}
                    onChange={(e) =>
                      setQuestionEditForm({ ...questionEditForm, questionType: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-sans focus:outline-none focus:border-purple-500"
                  >
                    {QUESTION_TYPES.filter((t) => t.value !== "ALL").map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Thứ tự câu (Number)
                  </label>
                  <input
                    type="number"
                    value={questionEditForm.questionNumber}
                    onChange={(e) =>
                      setQuestionEditForm({
                        ...questionEditForm,
                        questionNumber: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Điểm tối đa (Max Score)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={questionEditForm.maxScore}
                    onChange={(e) =>
                      setQuestionEditForm({
                        ...questionEditForm,
                        maxScore: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Options Editor (For Multiple Choice / Gap Fill) */}
              {(questionEditForm.questionType === "MULTIPLE_CHOICE" ||
                questionEditForm.questionType === "GAP_FILL") && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-slate-800 dark:text-slate-200">
                      Danh sách Lựa chọn &amp; Đáp án
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuestionEditForm({
                          ...questionEditForm,
                          options: [...questionEditForm.options, ""],
                        })
                      }
                      className="text-purple-600 dark:text-purple-400 font-heading font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm lựa chọn</span>
                    </button>
                  </div>

                  {questionEditForm.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...questionEditForm.options];
                          updated[idx] = e.target.value;
                          setQuestionEditForm({ ...questionEditForm, options: updated });
                        }}
                        placeholder={`Lựa chọn ${String.fromCharCode(65 + idx)}...`}
                        className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setQuestionEditForm({ ...questionEditForm, correctAnswer: opt })
                        }
                        className={`px-2 py-1.5 rounded-lg border text-[10px] font-heading font-bold shrink-0 transition-colors ${
                          questionEditForm.correctAnswer === opt && opt !== ""
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50"
                        }`}
                        title="Đặt làm đáp án đúng"
                      >
                        {questionEditForm.correctAnswer === opt && opt !== "" ? "✓ Đáp án" : "Chọn đúng"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = questionEditForm.options.filter((_, i) => i !== idx);
                          setQuestionEditForm({ ...questionEditForm, options: updated });
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md"
                        title="Xóa lựa chọn này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Correct Answer */}
              <div>
                <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Đáp án chuẩn (Correct Answer)
                </label>
                <input
                  type="text"
                  value={questionEditForm.correctAnswer}
                  onChange={(e) =>
                    setQuestionEditForm({ ...questionEditForm, correctAnswer: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
                  placeholder="Ví dụ: A hoặc nội dung đáp án chuẩn..."
                />
              </div>

              {/* Explanation */}
              <div>
                <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Lời giải thích chi tiết (Explanation)
                </label>
                <textarea
                  rows={3}
                  value={questionEditForm.explanation}
                  onChange={(e) =>
                    setQuestionEditForm({ ...questionEditForm, explanation: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-sans focus:outline-none focus:border-purple-500"
                  placeholder="Giải thích vì sao đáp án này đúng để học viên ôn tập..."
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <Link
                href={`/admin/exams/${editingQuestion.part.exam.id}/edit`}
                className="text-purple-600 dark:text-purple-400 hover:underline font-heading font-semibold text-xs flex items-center gap-1"
                title="Mở toàn bộ đề thi để sửa các Part khác"
              >
                <span>Mở toàn bộ đề thi →</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-heading font-semibold text-xs transition-colors"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  disabled={savingQuestion || !questionEditForm.prompt.trim()}
                  onClick={handleSaveQuestion}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-heading font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40"
                >
                  {savingQuestion ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Lưu thay đổi câu hỏi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CONFIRM DELETE QUESTION
      ───────────────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!confirmDeleteQuestion}
        title="Xác nhận Xóa Câu hỏi"
        message={`Bạn có chắc chắn muốn XÓA câu hỏi #${confirmDeleteQuestion?.questionNumber}: "${(confirmDeleteQuestion?.prompt || '').slice(0, 60)}..." khỏi đề thi?`}
        confirmText="Xác nhận xóa câu hỏi"
        cancelText="Hủy bỏ"
        onConfirm={handleDeleteQuestion}
        onCancel={() => setConfirmDeleteQuestion(null)}
      />

      {/* ─────────────────────────────────────────────────────────────
          MODAL: PREVIEW EXAM
      ───────────────────────────────────────────────────────────── */}
      {previewExam && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewExam(null);
          }}
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                    Xem trước Đề thi
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">ID: {previewExam.id}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewExam(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <div className="font-heading font-bold text-slate-900 dark:text-white text-sm">
                  {previewExam.title}
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                  {previewExam.description || "Không có mô tả chi tiết."}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block mb-1">
                    Kỹ năng
                  </span>
                  <span className="font-heading font-semibold text-slate-900 dark:text-white">
                    {previewExam.skill}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block mb-1">
                    Thời lượng
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {previewExam.durationMinutes} phút
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block mb-1">
                    Quyền truy cập
                  </span>
                  <span
                    className={`font-heading font-bold ${
                      previewExam.isPro
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {previewExam.isPro ? "VIP PRO" : "Miễn phí"}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
                  <span>Số phần thi (Parts):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {previewExam.partsCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
                  <span>Tổng số câu hỏi:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {previewExam.questionsCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
                  <span>Số lượt học viên đã nộp:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {previewExam.attemptsCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Link
                  href={getExamTakeUrl(previewExam)}
                  target="_blank"
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Làm bài thử</span>
                </Link>

                <Link
                  href={`/admin/exams/${previewExam.id}/edit`}
                  className="px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-heading font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Sửa nội dung câu hỏi</span>
                </Link>
              </div>

              <button
                onClick={() => setPreviewExam(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-heading font-semibold text-xs transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: QUICK EDIT EXAM
      ───────────────────────────────────────────────────────────── */}
      {editingExam && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingExam(null);
          }}
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Sửa Cấu hình Đề thi
                </h3>
              </div>
              <button
                onClick={() => setEditingExam(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên đề thi
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div>
                <label className="block font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả
                </label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kỹ năng
                  </label>
                  <select
                    value={editForm.skill}
                    onChange={(e) => setEditForm({ ...editForm, skill: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="FULL_TEST">Full Test</option>
                    <option value="LISTENING">Listening</option>
                    <option value="READING">Reading</option>
                    <option value="SPEAKING">Speaking</option>
                    <option value="WRITING">Writing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Thời lượng (phút)
                  </label>
                  <input
                    type="number"
                    value={editForm.durationMinutes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, durationMinutes: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mức độ Hot / Đề tủ
                </label>
                <select
                  value={editForm.hotLevel}
                  onChange={(e) => setEditForm({ ...editForm, hotLevel: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 font-sans"
                >
                  <option value={0}>⚪ Mặc định (0⭐ - Bình thường)</option>
                  <option value={1}>⭐ 1 Sao (Đề ôn tập bổ trợ)</option>
                  <option value={2}>⭐⭐ 2 Sao (Đề Hot)</option>
                  <option value={3}>⭐⭐⭐ 🔥 3 Sao (Đề Tủ - Hay ra)</option>
                </select>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isPro}
                    onChange={(e) => setEditForm({ ...editForm, isPro: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
                  />
                  <span className="font-heading font-semibold text-slate-800 dark:text-slate-200">
                    Yêu cầu gói VIP PRO
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isPublished}
                    onChange={(e) => setEditForm({ ...editForm, isPublished: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
                  />
                  <span className="font-heading font-semibold text-slate-800 dark:text-slate-200">
                    Xuất bản ngay (Hiển thị cho học viên)
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <Link
                href={`/admin/exams/${editingExam.id}/edit`}
                className="text-blue-600 dark:text-blue-400 hover:underline font-heading font-semibold text-xs flex items-center gap-1 transition-colors"
                title="Mở giao diện biên soạn câu hỏi chi tiết"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Sửa câu hỏi chi tiết →</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExam(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-heading font-semibold text-xs transition-colors"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  disabled={editLoading || !editForm.title}
                  onClick={handleSaveEdit}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40"
                >
                  {editLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: JSON IMPORT
      ───────────────────────────────────────────────────────────── */}
      {jsonModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setJsonModalOpen(false);
          }}
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Nhập Đề thi từ JSON
                </h3>
              </div>
              <button
                onClick={() => setJsonModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              Dán dữ liệu đề thi định dạng JSON gồm các trường: <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px]">title</code>, <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px]">skill</code>, <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px]">durationMinutes</code>, <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px]">parts</code>.
            </p>

            <textarea
              rows={12}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={`{
  "title": "Aptis ESOL Reading Practice 01",
  "skill": "READING",
  "durationMinutes": 35,
  "isPro": false,
  "parts": [
    {
      "partNumber": 1,
      "title": "Sentence Comprehension",
      "instructions": "Choose one word to complete each sentence.",
      "questions": [
        {
          "questionNumber": 1,
          "questionType": "MULTIPLE_CHOICE",
          "prompt": "He went to the store to ___ some bread.",
          "options": ["buy", "bought", "buying"],
          "correctAnswer": "buy",
          "maxScore": 1
        }
      ]
    }
  ]
}`}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px] bg-slate-50 dark:bg-slate-800/80 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
            />

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setJsonModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-heading font-semibold text-xs transition-colors"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={jsonLoading || !jsonText.trim()}
                onClick={handleJsonImport}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40"
              >
                {jsonLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Khởi tạo từ JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: STEPPER EXAM BUILDER
      ───────────────────────────────────────────────────────────── */}
      {wizardOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setWizardOpen(false);
          }}
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200/90 dark:border-slate-800 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-heading font-extrabold text-slate-900 dark:text-white">
                  Khởi tạo Đề thi Mới
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bước {wizardStep} / 2:{" "}
                  {wizardStep === 1 ? "Thông tin chung" : "Cấu trúc phần thi & câu hỏi"}
                </p>
              </div>
              <button
                onClick={() => setWizardOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {wizardStep === 1 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Tên đề thi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Đề thi thử Aptis ESOL Full Test B1-B2 Số 05"
                    value={newExam.title}
                    onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Mô tả tóm tắt
                  </label>
                  <input
                    type="text"
                    placeholder="Đề thi chuẩn format British Council cập nhật mới nhất..."
                    value={newExam.description}
                    onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      Kỹ năng
                    </label>
                    <select
                      value={newExam.skill}
                      onChange={(e) => setNewExam({ ...newExam, skill: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="FULL_TEST">Full Test (162 phút)</option>
                      <option value="LISTENING">Listening (40 phút)</option>
                      <option value="READING">Reading (35 phút)</option>
                      <option value="WRITING">Writing (50 phút)</option>
                      <option value="SPEAKING">Speaking (12 phút)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-heading font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      Thời lượng làm bài (phút)
                    </label>
                    <input
                      type="number"
                      value={newExam.durationMinutes}
                      onChange={(e) =>
                        setNewExam({ ...newExam, durationMinutes: Number(e.target.value) })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    disabled={!newExam.title.trim()}
                    onClick={() => setWizardStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-40"
                  >
                    <span>Tiếp tục: Cấu trúc Part & Câu hỏi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-slate-800 dark:text-slate-200">
                      Phần thi số 1 (Part 1)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Khởi tạo mặc định</span>
                  </div>

                  <input
                    type="text"
                    value={newExam.parts[0]?.title}
                    onChange={(e) => {
                      const parts = [...newExam.parts];
                      parts[0].title = e.target.value;
                      setNewExam({ ...newExam, parts });
                    }}
                    placeholder="Tiêu đề Part..."
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />

                  <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="font-heading font-bold text-[11px] text-slate-700 dark:text-slate-300 block">
                      Câu hỏi mẫu số 1:
                    </span>
                    <input
                      type="text"
                      value={newExam.parts[0]?.questions[0]?.prompt}
                      onChange={(e) => {
                        const parts = [...newExam.parts];
                        parts[0].questions[0].prompt = e.target.value;
                        setNewExam({ ...newExam, parts });
                      }}
                      placeholder="Nội dung câu hỏi..."
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-heading font-semibold transition-colors"
                  >
                    Quay lại
                  </button>

                  <button
                    type="button"
                    disabled={createLoading}
                    onClick={handleCreateExam}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold flex items-center gap-2 shadow-xs transition-all"
                  >
                    {createLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Hoàn tất &amp; Lưu Đề thi</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CONFIRM DELETE EXAM
      ───────────────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!confirmDeleteExam}
        title="Xác nhận Xóa Đề thi"
        message={`Bạn có chắc chắn muốn XÓA đề thi "${confirmDeleteExam?.title}" khỏi hệ thống? Tất cả bài thi của học viên liên quan đến đề này sẽ bị ảnh hưởng.`}
        confirmText="Xác nhận xóa vĩnh viễn"
        cancelText="Hủy bỏ"
        onConfirm={handleDeleteExam}
        onCancel={() => setConfirmDeleteExam(null)}
      />

      {/* ─────────────────────────────────────────────────────────────
          MODAL: SMART IMPORT (WORD / EXCEL)
      ───────────────────────────────────────────────────────────── */}
      <ExamSmartImportModal
        isOpen={smartImportOpen}
        onClose={() => setSmartImportOpen(false)}
        onSuccess={() => {
          setSmartImportOpen(false);
          showToast("Đã nhập đề thi thành công!");
          fetchExams();
        }}
      />
    </div>
  );
}
