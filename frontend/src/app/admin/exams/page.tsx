"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "@/lib/api-client";
import { SortState } from "@/components/admin/sortable-header";
import {
  BookOpen,
  Plus,
  CheckCircle2,
  Headphones,
  BookMarked,
  Mic,
  PenTool,
  Sparkles,
  FileCode,
  UploadCloud,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ConfirmModal from "@/components/admin/confirm-modal";
import ExamSmartImportModal from "@/components/admin/exam-smart-import-modal";
import AdminPageHeader from "@/components/admin/admin-page-header";

// Sub-components
import {
  ExamItem,
  QuestionItem,
  ExamSortKey,
  EditExamFormData,
  QuestionEditFormData,
  NewExamWizardData,
} from "@/components/admin/exams/exam.types";
import { ExamFilterBar } from "@/components/admin/exams/exam-filter-bar";
import { ExamListView } from "@/components/admin/exams/exam-list-view";
import { QuestionBankView } from "@/components/admin/exams/question-bank-view";
import { ExamEditModal } from "@/components/admin/exams/exam-edit-modal";
import { QuestionEditModal } from "@/components/admin/exams/question-edit-modal";
import { ExamPreviewModal } from "@/components/admin/exams/exam-preview-modal";
import { ExamJsonModal } from "@/components/admin/exams/exam-json-modal";
import { ExamCreateWizardModal } from "@/components/admin/exams/exam-create-wizard-modal";

export default function AdminExamsPage() {
  // ── View Mode: "EXAMS" vs "QUESTIONS"
  const [viewMode, setViewMode] = useState<"EXAMS" | "QUESTIONS">("EXAMS");

  // ── Shared Filter State
  const [skillFilter, setSkillFilter] = useState("ALL");
  const [partFilter, setPartFilter] = useState<number | null>(null);

  // ── Exams State
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [searchTermExams, setSearchTermExams] = useState("");
  const [debouncedSearchExams, setDebouncedSearchExams] = useState("");
  const [hotFilter, setHotFilter] = useState<string>("ALL");
  const [pageExams, setPageExams] = useState(1);
  const [pageSizeExams, setPageSizeExams] = useState(15);
  const [totalPagesExams, setTotalPagesExams] = useState(1);
  const [totalCountExams, setTotalCountExams] = useState(0);

  // ── Questions Bank State
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [searchQuestionTerm, setSearchQuestionTerm] = useState("");
  const [debouncedSearchQuestions, setDebouncedSearchQuestions] = useState("");
  const [questionTypeFilter, setQuestionTypeFilter] = useState("ALL");
  const [pageQuestions, setPageQuestions] = useState(1);
  const [pageSizeQuestions, setPageSizeQuestions] = useState(10);
  const [totalPagesQuestions, setTotalPagesQuestions] = useState(1);
  const [totalCountQuestions, setTotalCountQuestions] = useState(0);

  // ── Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchExams(searchTermExams);
      setPageExams(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTermExams]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuestions(searchQuestionTerm);
      setPageQuestions(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuestionTerm]);

  // ── Modals & Actions State
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
  const [editForm, setEditForm] = useState<EditExamFormData>({
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
  const [questionEditForm, setQuestionEditForm] = useState<QuestionEditFormData>({
    prompt: "",
    questionNumber: 1,
    questionType: "MULTIPLE_CHOICE",
    maxScore: 1,
    options: [],
    correctAnswer: "",
    explanation: "",
  });
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Delete Modals
  const [confirmDeleteQuestion, setConfirmDeleteQuestion] = useState<QuestionItem | null>(null);
  const [confirmDeleteExam, setConfirmDeleteExam] = useState<ExamItem | null>(null);

  // JSON Import Modal
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonLoading, setJsonLoading] = useState(false);

  // KPI Metrics Toggle
  const [showMetrics, setShowMetrics] = useState(false);

  // Sorting
  const [sortState, setSortState] = useState<SortState<ExamSortKey>>({
    key: "createdAt",
    order: "desc",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

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

  // Exam Builder State
  const [newExam, setNewExam] = useState<NewExamWizardData>({
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
        search: debouncedSearchExams.trim() || undefined,
        hotLevel: hotFilter !== "ALL" ? hotFilter : undefined,
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
  }, [skillFilter, partFilter, debouncedSearchExams, hotFilter, pageExams, pageSizeExams]);

  // Fetch Questions
  const fetchQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    try {
      const res = await api.admin.searchQuestions({
        skill: skillFilter !== "ALL" ? skillFilter : undefined,
        partNumber: partFilter || undefined,
        questionType: questionTypeFilter !== "ALL" ? questionTypeFilter : undefined,
        search: debouncedSearchQuestions.trim() || undefined,
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
      console.error("Lỗi tra cứu câu hỏi:", err);
    } finally {
      setLoadingQuestions(false);
    }
  }, [skillFilter, partFilter, questionTypeFilter, debouncedSearchQuestions, pageQuestions, pageSizeQuestions]);

  useEffect(() => {
    if (viewMode === "EXAMS") {
      fetchExams();
    }
  }, [fetchExams, viewMode]);

  useEffect(() => {
    if (viewMode === "QUESTIONS") {
      fetchQuestions();
    }
  }, [fetchQuestions, viewMode]);

  // Filter change handlers
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

  // Actions on Exam
  const handleTogglePublished = async (exam: ExamItem) => {
    const nextState = !exam.isPublished;
    setExams((prev) =>
      prev.map((e) => (e.id === exam.id ? { ...e, isPublished: nextState } : e))
    );
    try {
      const res = await api.admin.updateExam(exam.id, { isPublished: nextState });
      if (res.success) {
        showToast(`Đã ${nextState ? "xuất bản" : "ẩn"} đề thi "${exam.title}"`);
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
          `Đã chuyển đề "${exam.title}" sang ${nextState ? "VIP PRO" : "Miễn phí"}`
        );
      } else {
        fetchExams();
      }
    } catch {
      fetchExams();
    }
  };

  const handleCycleHotLevel = async (exam: ExamItem) => {
    const current = exam.hotLevel || 0;
    const nextLevel = (current + 1) % 4;
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

  const handleDeleteExam = async () => {
    if (!confirmDeleteExam) return;
    try {
      const res = await api.admin.deleteExam(confirmDeleteExam.id);
      if (res.success) {
        showToast(`Đã xóa vĩnh viễn đề "${confirmDeleteExam.title}"`);
        setConfirmDeleteExam(null);
        fetchExams();
      } else {
        showToast(res.error?.message || "Không thể xóa đề thi");
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
    try {
      const parsed = JSON.parse(jsonText);
      setJsonLoading(true);
      const res = await api.admin.createExam(parsed);
      if (res.success) {
        setJsonModalOpen(false);
        setJsonText("");
        showToast("Khởi tạo đề thi từ file JSON thành công!");
        fetchExams();
      } else {
        showToast(res.error?.message || "Không thể nhập đề từ JSON");
      }
    } catch {
      showToast("Dữ liệu JSON không hợp lệ! Vui lòng kiểm tra lại cấu trúc.");
    } finally {
      setJsonLoading(false);
    }
  };

  // Actions on Question
  const handleOpenEditQuestion = (q: QuestionItem) => {
    setEditingQuestion(q);
    let initialOptions: string[] = [];
    if (Array.isArray(q.options)) {
      initialOptions = q.options.map((o) => String(o));
    } else if (typeof q.options === "string") {
      try {
        const parsed = JSON.parse(q.options);
        if (Array.isArray(parsed)) initialOptions = parsed.map((o) => String(o));
      } catch {
        // ignore
      }
    }

    setQuestionEditForm({
      prompt: q.prompt,
      questionNumber: q.questionNumber,
      questionType: q.questionType,
      maxScore: q.maxScore || 1,
      options: initialOptions,
      correctAnswer: q.correctAnswer || "",
      explanation: q.explanation || "",
    });
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion) return;
    setSavingQuestion(true);
    try {
      const res = await api.admin.updateQuestion(editingQuestion.id, {
        prompt: questionEditForm.prompt,
        questionNumber: Number(questionEditForm.questionNumber),
        questionType: questionEditForm.questionType,
        maxScore: Number(questionEditForm.maxScore),
        options:
          questionEditForm.options.length > 0
            ? questionEditForm.options
            : undefined,
        correctAnswer: questionEditForm.correctAnswer || undefined,
        explanation: questionEditForm.explanation || undefined,
      });

      if (res.success) {
        showToast(`Đã cập nhật câu hỏi #${questionEditForm.questionNumber} thành công!`);
        setEditingQuestion(null);
        fetchQuestions();
      } else {
        showToast(res.error?.message || "Không thể cập nhật câu hỏi");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ");
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!confirmDeleteQuestion) return;
    try {
      const res = await api.admin.deleteQuestion(confirmDeleteQuestion.id);
      if (res.success) {
        showToast(`Đã xóa câu hỏi #${confirmDeleteQuestion.questionNumber}`);
        setConfirmDeleteQuestion(null);
        fetchQuestions();
      } else {
        showToast(res.error?.message || "Không thể xóa câu hỏi");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ");
    }
  };

  // Skill badge helper
  const getSkillBadge = (skill: string) => {
    switch (skill) {
      case "FULL_TEST":
        return {
          icon: Sparkles,
          label: "Full Test",
          className:
            "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300",
        };
      case "LISTENING":
        return {
          icon: Headphones,
          label: "Listening",
          className:
            "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300",
        };
      case "READING":
        return {
          icon: BookMarked,
          label: "Reading",
          className:
            "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300",
        };
      case "SPEAKING":
        return {
          icon: Mic,
          label: "Speaking",
          className:
            "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300",
        };
      case "WRITING":
        return {
          icon: PenTool,
          label: "Writing",
          className:
            "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300",
        };
      default:
        return {
          icon: BookMarked,
          label: skill,
          className:
            "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300",
        };
    }
  };

  // KPI Calculations
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

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-heading font-semibold">
            {toastMessage}
          </span>
        </div>
      )}

      {/* Top Header */}
      <AdminPageHeader
        stats={[
          { icon: BookOpen, value: totalCountExams || exams.length, label: "đề" },
          { icon: Sparkles, value: fullTestCount, label: "Full Test" },
          {
            icon: Sparkles,
            value: proCount,
            label: `VIP (${freeCount} Free)`,
          },
          { icon: CheckCircle2, value: totalAttempts, label: "lượt thi" },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={toggleMetrics}
              className={`p-2 rounded-xl border text-xs font-heading font-semibold transition-all flex items-center gap-1.5 ${
                showMetrics
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
              title="Bật/Tắt hiển thị bảng chỉ số đề thi chi tiết"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chỉ số chi tiết</span>
              {showMetrics ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            <button
              onClick={() => setSmartImportOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Nhập Word / Excel</span>
            </button>

            <button
              onClick={() => setJsonModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Nhập JSON</span>
            </button>

            <button
              onClick={() => {
                setWizardStep(1);
                setWizardOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-heading font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo đề thủ công</span>
            </button>
          </div>
        }
      />

      {/* ── Modern Unified Cascading Filter Bar (Cha -> Con) ── */}
      <ExamFilterBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        skillFilter={skillFilter}
        onSkillChange={handleSkillChange}
        partFilter={partFilter}
        onPartChange={handlePartChange}
        totalExams={totalCountExams || exams.length}
        totalQuestions={totalCountQuestions}
        loading={loadingExams || loadingQuestions}
        onRefresh={() => {
          if (viewMode === "EXAMS") fetchExams();
          else fetchQuestions();
        }}
        onResetFilters={() => {
          setSkillFilter("ALL");
          setPartFilter(null);
        }}
      />

      {/* ── VIEW 1: Danh sách Đề thi ── */}
      {viewMode === "EXAMS" && (
        <ExamListView
          exams={exams}
          loading={loadingExams}
          searchTerm={searchTermExams}
          setSearchTerm={setSearchTermExams}
          onSearchSubmit={() => {
            setDebouncedSearchExams(searchTermExams);
            fetchExams();
          }}
          hotFilter={hotFilter}
          setHotFilter={setHotFilter}
          page={pageExams}
          totalPages={totalPagesExams}
          totalCount={totalCountExams}
          pageSize={pageSizeExams}
          setPage={setPageExams}
          setPageSize={setPageSizeExams}
          skillFilter={skillFilter}
          partFilter={partFilter}
          sortState={sortState}
          onSort={(key) => {
            setSortState((prev) => ({
              key,
              order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
            }));
          }}
          onTogglePublished={handleTogglePublished}
          onTogglePro={handleTogglePro}
          onCycleHotLevel={handleCycleHotLevel}
          onDuplicateExam={handleDuplicateExam}
          onOpenEdit={handleOpenEdit}
          onPreviewExam={setPreviewExam}
          onDeleteExam={setConfirmDeleteExam}
          onSearchInQuestions={(term) => {
            setSearchQuestionTerm(term);
            setViewMode("QUESTIONS");
          }}
          getSkillBadge={getSkillBadge}
        />
      )}

      {/* ── VIEW 2: Ngân hàng & Sửa câu hỏi ── */}
      {viewMode === "QUESTIONS" && (
        <QuestionBankView
          questions={questions}
          loading={loadingQuestions}
          searchTerm={searchQuestionTerm}
          setSearchTerm={setSearchQuestionTerm}
          onSearchSubmit={() => {
            setDebouncedSearchQuestions(searchQuestionTerm);
            fetchQuestions();
          }}
          questionTypeFilter={questionTypeFilter}
          setQuestionTypeFilter={setQuestionTypeFilter}
          page={pageQuestions}
          totalPages={totalPagesQuestions}
          totalCount={totalCountQuestions}
          pageSize={pageSizeQuestions}
          setPage={setPageQuestions}
          setPageSize={setPageSizeQuestions}
          skillFilter={skillFilter}
          partFilter={partFilter}
          onEditQuestion={handleOpenEditQuestion}
          onDeleteQuestion={setConfirmDeleteQuestion}
        />
      )}

      {/* ── Modals ── */}
      <ExamEditModal
        exam={editingExam}
        form={editForm}
        setForm={setEditForm}
        onSave={handleSaveEdit}
        onClose={() => setEditingExam(null)}
        loading={editLoading}
      />

      <QuestionEditModal
        question={editingQuestion}
        form={questionEditForm}
        setForm={setQuestionEditForm}
        onSave={handleSaveQuestion}
        onClose={() => setEditingQuestion(null)}
        loading={savingQuestion}
      />

      <ExamPreviewModal
        exam={previewExam}
        onClose={() => setPreviewExam(null)}
      />

      <ExamJsonModal
        isOpen={jsonModalOpen}
        onClose={() => setJsonModalOpen(false)}
        jsonText={jsonText}
        setJsonText={setJsonText}
        onImport={handleJsonImport}
        loading={jsonLoading}
      />

      <ExamCreateWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        wizardStep={wizardStep}
        setWizardStep={setWizardStep}
        newExam={newExam}
        setNewExam={setNewExam}
        onCreate={handleCreateExam}
        loading={createLoading}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteExam}
        title="Xác nhận Xóa Đề thi"
        message={`Bạn có chắc chắn muốn XÓA đề thi "${confirmDeleteExam?.title}" khỏi hệ thống? Tất cả bài thi của học viên liên quan đến đề này sẽ bị ảnh hưởng.`}
        confirmText="Xác nhận xóa vĩnh viễn"
        cancelText="Hủy bỏ"
        onConfirm={handleDeleteExam}
        onCancel={() => setConfirmDeleteExam(null)}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteQuestion}
        title="Xác nhận Xóa Câu hỏi"
        message={`Bạn có chắc chắn muốn XÓA câu hỏi #${confirmDeleteQuestion?.questionNumber}: "${(confirmDeleteQuestion?.prompt || '').slice(0, 60)}..." khỏi đề thi?`}
        confirmText="Xác nhận xóa câu hỏi"
        cancelText="Hủy bỏ"
        onConfirm={handleDeleteQuestion}
        onCancel={() => setConfirmDeleteQuestion(null)}
      />

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
