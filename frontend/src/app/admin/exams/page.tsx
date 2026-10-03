"use client";

import { useState, useEffect, useMemo } from "react";
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
  ToggleLeft,
  ToggleRight,
  Play,
  FileText,
  Check,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ConfirmModal from "@/components/admin/confirm-modal";

interface ExamItem {
  id: string;
  title: string;
  description?: string | null;
  skill: string;
  durationMinutes: number;
  isPro: boolean;
  isPublished: boolean;
  partsCount: number;
  questionsCount: number;
  attemptsCount: number;
  createdAt: string;
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [skillFilter, setSkillFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  type ExamSortKey =
    | "title"
    | "skill"
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

  // Stepper Modal for Exam Builder
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [createLoading, setCreateLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Preview Modal
  const [previewExam, setPreviewExam] = useState<ExamItem | null>(null);

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

  // Quick Edit Modal
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    skill: "FULL_TEST",
    durationMinutes: 162,
    isPro: false,
    isPublished: true,
  });
  const [editLoading, setEditLoading] = useState(false);

  // JSON Import Modal
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonLoading, setJsonLoading] = useState(false);

  // Confirm delete modal
  const [confirmDeleteExam, setConfirmDeleteExam] = useState<ExamItem | null>(null);

  // Smart Toggle for KPI metrics strip (defaults to false for clean workhorse layout, persists in localStorage)
  const [showMetrics, setShowMetrics] = useState(false);

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
  const [newExam, setNewExam] = useState({
    title: "",
    description: "",
    skill: "FULL_TEST",
    durationMinutes: 162,
    isPro: false,
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
            maxScore: 1.0,
          },
        ],
      },
    ],
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getExams({
        skill: skillFilter,
        page,
        limit: pageSize,
      });

      if (res.success && res.data) {
        setExams(res.data);
        if (res.meta) {
          setTotalPages(res.meta.totalPages || 1);
          setTotalCount(res.meta.total || res.data.length);
        }
      }
    } catch (err) {
      console.error("Lỗi tải danh sách đề thi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [page, skillFilter, pageSize]);

  // Lock body scroll for modals
  useEffect(() => {
    if (wizardOpen || previewExam || editingExam || jsonModalOpen || confirmDeleteExam) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setWizardOpen(false);
          setPreviewExam(null);
          setEditingExam(null);
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
  }, [wizardOpen, previewExam, editingExam, jsonModalOpen, confirmDeleteExam]);

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
    } catch (err) {
      showToast("Lỗi kết nối máy chủ");
    }
  };

  const handleTogglePublished = async (exam: ExamItem) => {
    const nextState = !exam.isPublished;
    // Optimistic update
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
    } catch (err) {
      fetchExams();
    }
  };

  const handleTogglePro = async (exam: ExamItem) => {
    const nextState = !exam.isPro;
    // Optimistic update
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
    } catch (err) {
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
    } catch (err) {
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
      });
      if (res.success) {
        showToast(`Đã cập nhật thông tin đề "${editForm.title}" thành công!`);
        setEditingExam(null);
        fetchExams();
      } else {
        showToast(res.error?.message || "Không thể cập nhật đề thi");
      }
    } catch (err) {
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
    } catch (err) {
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
        showToast(`Đã nhập đề thi "${parsed.title || 'Mới'}" từ JSON thành công!`);
        setJsonModalOpen(false);
        setJsonText("");
        fetchExams();
      } else {
        showToast(res.error?.message || "Định dạng JSON không hợp lệ");
      }
    } catch (err: any) {
      showToast("Lỗi cú pháp JSON. Vui lòng kiểm tra lại cấu trúc.");
    } finally {
      setJsonLoading(false);
    }
  };

  const filteredExams = exams.filter((e) =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      } else if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = (valB || "").toLowerCase();
      }

      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredExams, sortState]);

  // KPI Calculations
  const fullTestCount = exams.filter((e) => e.skill === "FULL_TEST").length;
  const proCount = exams.filter((e) => e.isPro).length;
  const freeCount = exams.length - proCount;
  const totalAttempts = exams.reduce((sum, e) => sum + (e.attemptsCount || 0), 0);

  const getSkillBadge = (skill: string) => {
    switch (skill) {
      case "FULL_TEST":
        return {
          icon: Sparkles,
          label: "Full Test",
          className: "bg-indigo-50 border-indigo-200/80 text-indigo-700",
        };
      case "LISTENING":
        return {
          icon: Headphones,
          label: "Listening",
          className: "bg-sky-50 border-sky-200/80 text-sky-700",
        };
      case "READING":
        return {
          icon: BookOpen,
          label: "Reading",
          className: "bg-emerald-50 border-emerald-200/80 text-emerald-700",
        };
      case "WRITING":
        return {
          icon: PenTool,
          label: "Writing",
          className: "bg-purple-50 border-purple-200/80 text-purple-700",
        };
      case "SPEAKING":
        return {
          icon: Mic,
          label: "Speaking",
          className: "bg-rose-50 border-rose-200/80 text-rose-700",
        };
      default:
        return {
          icon: BookMarked,
          label: skill,
          className: "bg-slate-100 border-slate-200 text-slate-600",
        };
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-slate-800" />
            Ngân hàng Đề thi Aptis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Quản trị ngân hàng đề thi chuẩn British Council ESOL, phân phối kỹ năng, xuất bản và giám sát lượt làm bài
          </p>

          {/* Compact Inline Metrics Strip (SRD 4.2 Clean Standard - Zero Space Overhead) */}
          {!showMetrics && (
            <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-0.5">
              <span className="text-[11px] text-slate-400 font-semibold font-heading uppercase tracking-wider">
                Chỉ số nhanh:
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200/80 text-[11px] font-semibold text-indigo-800">
                <BookOpen className="w-3 h-3 text-indigo-600" />
                <span>Tổng: <strong className="text-indigo-900 font-mono">{totalCount || exams.length}</strong> đề</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-purple-50 border border-purple-200/80 text-[11px] font-semibold text-purple-800">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>Full Test: <strong className="text-purple-900 font-mono">{fullTestCount}</strong></span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] font-semibold text-amber-800">
                <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />
                <span>VIP PRO: <strong className="text-amber-900 font-mono">{proCount}</strong> ({freeCount} Free)</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Lượt thi: <strong className="text-emerald-900 font-mono">{totalAttempts}</strong></span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Smart Toggle Button */}
          <button
            type="button"
            onClick={toggleMetrics}
            className={`px-3.5 py-2 rounded-xl border text-xs font-heading font-semibold transition-all flex items-center gap-1.5 shadow-2xs ${
              showMetrics
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            }`}
            title={showMetrics ? "Thu gọn 4 thẻ chỉ số để giải phóng không gian danh sách" : "Mở rộng 4 thẻ chỉ số thống kê"}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{showMetrics ? "Thu gọn chỉ số" : "Chỉ số chi tiết"}</span>
            {showMetrics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setJsonModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-heading font-semibold transition-all shadow-2xs flex items-center gap-1.5"
            title="Nhập đề thi cấu trúc JSON"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Nhập JSON</span>
          </button>

          <button
            onClick={() => {
              setWizardStep(1);
              setWizardOpen(true);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-heading font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đề thi mới</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards (Collapsible via Smart Toggle) */}
      {showMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-heading">
                Tổng số đề thi
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-slate-900 font-mono">
              {totalCount || exams.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Đã lưu trữ trong ngân hàng</div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-heading">
                Đề Full Test chuẩn
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-slate-900 font-mono">
              {fullTestCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">4 Kỹ năng (162 phút)</div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-heading">
                VIP PRO / Miễn phí
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-slate-900 font-mono">
              {proCount} <span className="text-xs text-slate-400 font-normal">/ {freeCount} Free</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Phân quyền học viên</div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-heading">
                Lượt thi hoàn thành
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-slate-900 font-mono">
              {totalAttempts}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">Toàn bộ học viên</div>
          </div>
        </div>
      )}

      {/* Skill Filters & Search */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên đề thi..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 font-sans"
          />
        </div>

        <div className="p-1 rounded-xl bg-slate-100 border border-slate-200/70 flex items-center gap-1 w-full md:w-auto overflow-x-auto">
          {[
            { id: "ALL", label: "Tất cả kỹ năng" },
            { id: "FULL_TEST", label: "Full Test" },
            { id: "LISTENING", label: "Listening" },
            { id: "READING", label: "Reading" },
            { id: "SPEAKING", label: "Speaking" },
            { id: "WRITING", label: "Writing" },
            { id: "GRAMMAR_VOCABULARY", label: "Grammar & Vocab" },
          ].map((tab) => {
            const isActive = skillFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSkillFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exams Grid Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-heading font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <SortableHeader
                  field="title"
                  title="Tên đề thi"
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
                  field="durationMinutes"
                  title="Thời lượng"
                  currentSort={sortState}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="questionsCount"
                  title="Cấu trúc đề"
                  currentSort={sortState}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="isPublished"
                  title="Trạng thái"
                  currentSort={sortState}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="isPro"
                  title="Gói truy cập"
                  currentSort={sortState}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="attemptsCount"
                  title="Lượt thi"
                  currentSort={sortState}
                  onSort={handleSort}
                />
                <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-600" />
                    Đang tải danh sách đề thi...
                  </td>
                </tr>
              ) : sortedExams.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 font-normal">
                    Không tìm thấy đề thi nào phù hợp.
                  </td>
                </tr>
              ) : (
                sortedExams.map((exam) => {
                  const badge = getSkillBadge(exam.skill);
                  const SkillIcon = badge.icon;
                  return (
                    <tr key={exam.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Title */}
                      <td className="py-3.5 px-4 sm:px-6 max-w-xs">
                        <Link
                          href={`/admin/exams/${exam.id}/edit`}
                          className="font-heading font-semibold text-slate-900 text-xs hover:text-indigo-600 hover:underline transition-colors block"
                          title="Nhấp để mở trang biên soạn nội dung câu hỏi"
                        >
                          {exam.title}
                        </Link>
                        {exam.description && (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                            {exam.description}
                          </div>
                        )}
                      </td>

                      {/* Skill */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold border ${badge.className}`}
                        >
                          <SkillIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4">
                        <span className="flex items-center gap-1.5 font-mono text-slate-700 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {exam.durationMinutes}p
                        </span>
                      </td>

                      {/* Structure */}
                      <td className="py-3.5 px-4">
                        <span className="font-heading font-semibold text-slate-900">
                          {exam.partsCount} phần
                        </span>{" "}
                        <span className="text-slate-300">•</span>{" "}
                        <span className="text-slate-500 font-normal">
                          {exam.questionsCount} câu
                        </span>
                      </td>

                      {/* Live Toggle: Published vs Draft */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleTogglePublished(exam)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold border transition-all ${
                            exam.isPublished
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
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

                      {/* Pro Badge & Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleTogglePro(exam)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold border transition-all ${
                            exam.isPro
                              ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 font-bold"
                              : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
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
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-semibold text-slate-900">
                          {exam.attemptsCount}
                        </span>{" "}
                        <span className="text-slate-400 text-[11px]">lượt</span>
                      </td>

                      {/* Actions Cluster */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Live Student Practice Room */}
                          <Link
                            href={getExamTakeUrl(exam)}
                            target="_blank"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors border border-slate-200/80"
                            title="Mở làm bài thử (Giao diện học viên)"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </Link>

                          {/* Preview Button */}
                          <button
                            onClick={() => setPreviewExam(exam)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200/80"
                            title="Xem trước cấu trúc đề thi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Edit */}
                          <button
                            onClick={() => handleOpenEdit(exam)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200/80"
                            title="Sửa nhanh thông tin đề thi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Full Question Editor */}
                          <Link
                            href={`/admin/exams/${exam.id}/edit`}
                            className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 transition-colors border border-indigo-200/80"
                            title="Biên soạn nội dung câu hỏi & Parts (Editor đầy đủ)"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Link>

                          {/* Duplicate */}
                          <button
                            onClick={() => handleDuplicateExam(exam)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-slate-200/80"
                            title="Nhân bản đề thi (Clone)"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setConfirmDeleteExam(exam)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-slate-200/80"
                            title="Xóa đề thi vĩnh viễn"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Standard Admin Pagination Footer */}
        <AdminPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount || sortedExams.length}
          pageSize={pageSize}
          pageSizeOptions={[10, 15, 25, 50]}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          itemName="đề thi"
        />
      </div>

      {/* MODAL 1: PREVIEW EXAM */}
      {previewExam && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewExam(null);
          }}
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-xl w-full bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900">
                    Xem trước Đề thi
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">ID: {previewExam.id}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewExam(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-heading font-bold text-slate-900 text-sm">
                  {previewExam.title}
                </div>
                <div className="text-slate-500 font-normal leading-relaxed">
                  {previewExam.description || "Không có mô tả chi tiết."}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Kỹ năng
                  </span>
                  <span className="font-heading font-semibold text-slate-900">
                    {previewExam.skill}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Thời lượng
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    {previewExam.durationMinutes} phút
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Quyền truy cập
                  </span>
                  <span
                    className={`font-heading font-bold ${
                      previewExam.isPro ? "text-amber-700" : "text-emerald-700"
                    }`}
                  >
                    {previewExam.isPro ? "VIP PRO" : "Miễn phí"}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between text-slate-700 font-medium">
                  <span>Số phần thi (Parts):</span>
                  <span className="font-mono font-bold text-slate-900">{previewExam.partsCount}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 font-medium">
                  <span>Tổng số câu hỏi:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {previewExam.questionsCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700 font-medium">
                  <span>Số lượt học viên đã nộp:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {previewExam.attemptsCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Link
                  href={getExamTakeUrl(previewExam)}
                  target="_blank"
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Làm bài thử</span>
                </Link>

                <Link
                  href={`/admin/exams/${previewExam.id}/edit`}
                  className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-heading font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Sửa nội dung câu hỏi</span>
                </Link>
              </div>

              <button
                onClick={() => setPreviewExam(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-heading font-semibold text-xs transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK EDIT EXAM */}
      {editingExam && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingExam(null);
          }}
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-slate-800" />
                <h3 className="font-heading font-bold text-sm text-slate-900">
                  Sửa Cấu hình Đề thi
                </h3>
              </div>
              <button
                onClick={() => setEditingExam(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-heading font-semibold text-slate-700 mb-1">
                  Tên đề thi
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:border-slate-900 font-sans"
                />
              </div>

              <div>
                <label className="block font-heading font-semibold text-slate-700 mb-1">
                  Mô tả
                </label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:border-slate-900 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-heading font-semibold text-slate-700 mb-1">
                    Kỹ năng
                  </label>
                  <select
                    value={editForm.skill}
                    onChange={(e) => setEditForm({ ...editForm, skill: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:border-slate-900"
                  >
                    <option value="FULL_TEST">Full Test</option>
                    <option value="LISTENING">Listening</option>
                    <option value="READING">Reading</option>
                    <option value="SPEAKING">Speaking</option>
                    <option value="WRITING">Writing</option>
                    <option value="GRAMMAR_VOCABULARY">Grammar & Vocab</option>
                  </select>
                </div>

                <div>
                  <label className="block font-heading font-semibold text-slate-700 mb-1">
                    Thời lượng (phút)
                  </label>
                  <input
                    type="number"
                    value={editForm.durationMinutes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, durationMinutes: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isPro}
                    onChange={(e) => setEditForm({ ...editForm, isPro: e.target.checked })}
                    className="w-4 h-4 rounded text-slate-900 accent-slate-900"
                  />
                  <span className="font-heading font-semibold text-slate-800">
                    Yêu cầu gói VIP PRO
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isPublished}
                    onChange={(e) => setEditForm({ ...editForm, isPublished: e.target.checked })}
                    className="w-4 h-4 rounded text-slate-900 accent-slate-900"
                  />
                  <span className="font-heading font-semibold text-slate-800">
                    Xuất bản ngay (Hiển thị cho học viên)
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                href={`/admin/exams/${editingExam.id}/edit`}
                className="text-indigo-600 hover:text-indigo-800 font-heading font-semibold text-xs flex items-center gap-1 transition-colors"
                title="Mở giao diện biên soạn câu hỏi chi tiết"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Sửa câu hỏi & Parts →</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExam(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-heading font-semibold text-xs transition-colors"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  disabled={editLoading || !editForm.title}
                  onClick={handleSaveEdit}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40"
                >
                  {editLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: JSON IMPORT */}
      {jsonModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setJsonModalOpen(false);
          }}
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-xl w-full bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-slate-800" />
                <h3 className="font-heading font-bold text-sm text-slate-900">
                  Nhập Đề thi từ JSON
                </h3>
              </div>
              <button
                onClick={() => setJsonModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-normal">
              Dán cấu trúc JSON chuẩn gồm các trường: <code>title</code>, <code>skill</code>,{" "}
              <code>durationMinutes</code>, <code>parts</code> (mỗi part có mảng{" "}
              <code>questions</code>).
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
              className="w-full p-3 rounded-xl border border-slate-200 font-mono text-[11px] bg-slate-50 focus:outline-none focus:border-slate-900 text-slate-900"
            />

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setJsonModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-heading font-semibold text-xs transition-colors"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={jsonLoading || !jsonText.trim()}
                onClick={handleJsonImport}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40"
              >
                {jsonLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Khởi tạo từ JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: STEPPER EXAM BUILDER */}
      {wizardOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setWizardOpen(false);
          }}
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200/90 animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-heading font-extrabold text-slate-900">
                  Khởi tạo Đề thi Mới
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bước {wizardStep} / 2:{" "}
                  {wizardStep === 1 ? "Thông tin chung" : "Cấu trúc phần thi & câu hỏi"}
                </p>
              </div>
              <button
                onClick={() => setWizardOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Thông tin chung */}
            {wizardStep === 1 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-heading font-bold text-slate-800 mb-1.5">
                    Tên đề thi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Đề thi thử Aptis ESOL Full Test B1-B2 Số 05"
                    value={newExam.title}
                    onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-slate-900 focus:outline-none bg-slate-50/50 text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-heading font-bold text-slate-800 mb-1.5">
                    Mô tả tóm tắt
                  </label>
                  <input
                    type="text"
                    placeholder="Đề thi chuẩn format British Council cập nhật mới nhất..."
                    value={newExam.description}
                    onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-slate-900 focus:outline-none bg-slate-50/50 text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-heading font-bold text-slate-800 mb-1.5">
                      Kỹ năng thi
                    </label>
                    <select
                      value={newExam.skill}
                      onChange={(e) => setNewExam({ ...newExam, skill: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 text-slate-900 focus:border-slate-900 focus:outline-none"
                    >
                      <option value="FULL_TEST">Full Test (162 phút)</option>
                      <option value="LISTENING">Listening (Nghe)</option>
                      <option value="READING">Reading (Đọc)</option>
                      <option value="SPEAKING">Speaking (Nói)</option>
                      <option value="WRITING">Writing (Viết)</option>
                      <option value="GRAMMAR_VOCABULARY">Grammar & Vocabulary</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-heading font-bold text-slate-800 mb-1.5">
                      Thời lượng làm bài (phút)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={300}
                      value={newExam.durationMinutes}
                      onChange={(e) =>
                        setNewExam({ ...newExam, durationMinutes: Number(e.target.value) })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-slate-900 focus:outline-none bg-slate-50/50 text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="isProCheck"
                    checked={newExam.isPro}
                    onChange={(e) => setNewExam({ ...newExam, isPro: e.target.checked })}
                    className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 accent-slate-900"
                  />
                  <label
                    htmlFor="isProCheck"
                    className="font-heading font-semibold text-slate-800 text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    Đánh dấu là đề VIP PRO (Chỉ học viên đã nạp gói mới được thi)
                  </label>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={!newExam.title}
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-heading font-semibold flex items-center gap-2 shadow-xs transition-all"
                  >
                    <span>Tiếp tục: Cấu trúc câu hỏi</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Cấu trúc câu hỏi */}
            {wizardStep === 2 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="font-heading font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-700" />
                    Phần thi 1: {newExam.parts[0].title}
                  </div>
                  <div>
                    <label className="block font-heading font-semibold text-slate-600 mb-1">
                      Tiêu đề phần thi
                    </label>
                    <input
                      type="text"
                      value={newExam.parts[0].title}
                      onChange={(e) => {
                        const parts = [...newExam.parts];
                        parts[0].title = e.target.value;
                        setNewExam({ ...newExam, parts });
                      }}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200/60">
                    <label className="block font-heading font-semibold text-slate-600 mb-1">
                      Câu hỏi mẫu 1
                    </label>
                    <input
                      type="text"
                      placeholder="Nội dung câu hỏi..."
                      value={newExam.parts[0].questions[0].prompt}
                      onChange={(e) => {
                        const parts = [...newExam.parts];
                        parts[0].questions[0].prompt = e.target.value;
                        setNewExam({ ...newExam, parts });
                      }}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 mb-2 focus:border-slate-900 focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-heading font-semibold text-slate-600 mb-1">
                          Đáp án đúng
                        </label>
                        <input
                          type="text"
                          placeholder="A"
                          value={newExam.parts[0].questions[0].correctAnswer}
                          onChange={(e) => {
                            const parts = [...newExam.parts];
                            parts[0].questions[0].correctAnswer = e.target.value;
                            setNewExam({ ...newExam, parts });
                          }}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono font-bold focus:border-slate-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-heading font-semibold text-slate-600 mb-1">
                          Điểm tối đa
                        </label>
                        <input
                          type="number"
                          value={newExam.parts[0].questions[0].maxScore}
                          onChange={(e) => {
                            const parts = [...newExam.parts];
                            parts[0].questions[0].maxScore = Number(e.target.value);
                            setNewExam({ ...newExam, parts });
                          }}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono focus:border-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-heading font-semibold transition-colors"
                  >
                    Quay lại
                  </button>

                  <button
                    type="button"
                    disabled={createLoading}
                    onClick={handleCreateExam}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-semibold flex items-center gap-2 shadow-xs transition-all"
                  >
                    {createLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Hoàn tất & Lưu Đề thi</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!confirmDeleteExam}
        title="Xác nhận Xóa Đề thi"
        message={`Bạn có chắc chắn muốn XÓA đề thi "${confirmDeleteExam?.title}" khỏi hệ thống? Tất cả bài thi của học viên liên quan đến đề này sẽ bị ảnh hưởng.`}
        confirmText="Xác nhận xóa vĩnh viễn"
        cancelText="Hủy bỏ"
        onConfirm={handleDeleteExam}
        onCancel={() => setConfirmDeleteExam(null)}
      />
    </div>
  );
}
