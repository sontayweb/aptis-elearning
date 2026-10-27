"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api-client";
import {
  ArrowLeft,
  Clock,
  Crown,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Plus,
  Save,
  X,
  AlertTriangle,
  Check,
  GripVertical,
  HelpCircle,
  Play,
  FileText,
  Volume2,
  Image as ImageIcon,
} from "lucide-react";
import ConfirmModal from "@/components/admin/confirm-modal";
import { PartMediaEditor } from "@/components/admin/exams/part-media-editor";
import {
  PolymorphicQuestionForm,
  PolymorphicQuestionData,
} from "@/components/admin/exams/polymorphic-question-form";
import { QuestionCardRow } from "@/components/admin/exams/question-card-row";

interface Question {
  id: string;
  question_number: number;
  question_type: string;
  prompt: string;
  options: any;
  correct_answer: string | null;
  explanation: string | null;
  max_score: number;
}

interface Part {
  id: string;
  part_number: number;
  title: string;
  instructions: string | null;
  passage_text: string | null;
  audio_url: string | null;
  image_url: string | null;
  questions: Question[];
}

interface ExamFull {
  id: string;
  title: string;
  description: string | null;
  skill: string;
  duration_minutes: number;
  is_pro: boolean;
  is_published: boolean;
  hot_level?: number;
  hotLevel?: number;
  forecast_tag?: string | null;
  forecastTag?: string | null;
  parts: Part[];
}

export default function ExamEditorPage() {
  const params = useParams();
  const examId = params?.id as string;
  const [exam, setExam] = useState<ExamFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [expandedParts, setExpandedParts] = useState<Record<string, boolean>>({});
  const [editingPart, setEditingPart] = useState<string | null>(null);
  const [partForm, setPartForm] = useState<Record<string, string>>({});
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const router = useRouter();
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [addingQPartId, setAddingQPartId] = useState<string | null>(null);
  const [addingPart, setAddingPart] = useState(false);
  const [newPartTitle, setNewPartTitle] = useState("");
  const [confirmDelPart, setConfirmDelPart] = useState<Part | null>(null);
  const [confirmDelQ, setConfirmDelQ] = useState<Question | null>(null);
  const [editingExamMeta, setEditingExamMeta] = useState(false);
  const [examMetaForm, setExamMetaForm] = useState<{
    title: string;
    description: string;
    skill: string;
    durationMinutes: number;
    isPro: boolean;
    isPublished: boolean;
    hotLevel: number;
    forecastTag: string;
  }>({
    title: "",
    description: "",
    skill: "FULL_TEST",
    durationMinutes: 40,
    isPro: false,
    isPublished: true,
    hotLevel: 0,
    forecastTag: "",
  });

  const getExamTakeUrl = (ex: ExamFull) => {
    switch (ex.skill) {
      case "READING":
        return `/reading/${ex.id}`;
      case "LISTENING":
        return `/listening/${ex.id}`;
      case "WRITING":
        return `/writing/${ex.id}`;
      case "SPEAKING":
        return `/speaking/${ex.id}`;
      case "FULL_TEST":
      default:
        return `/thi-thu/${ex.id}`;
    }
  };

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.getExamFull(examId);
      if (res.success && res.data) {
        const data = res.data as ExamFull;
        setExam(data);
        const exp: Record<string, boolean> = {};
        data.parts.forEach((p) => {
          exp[p.id] = true;
        });
        setExpandedParts(exp);
      } else {
        showToast(res.error?.message || "Không thể tải đề thi", "err");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ", "err");
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    load();
  }, [load]);

  const skillColors: Record<string, string> = {
    READING: "text-emerald-700 bg-emerald-50 border-emerald-200",
    LISTENING: "text-sky-700 bg-sky-50 border-sky-200",
    WRITING: "text-purple-700 bg-purple-50 border-purple-200",
    SPEAKING: "text-rose-700 bg-rose-50 border-rose-200",
    FULL_TEST: "text-indigo-700 bg-indigo-50 border-indigo-200",
  };

  const startEditExamMeta = () => {
    if (!exam) return;
    setExamMetaForm({
      title: exam.title,
      description: exam.description || "",
      skill: exam.skill,
      durationMinutes: exam.duration_minutes,
      isPro: exam.is_pro,
      isPublished: exam.is_published,
      hotLevel: exam.hot_level ?? exam.hotLevel ?? 0,
      forecastTag: exam.forecast_tag ?? exam.forecastTag ?? "",
    });
    setEditingExamMeta(true);
  };

  const saveExamMeta = async () => {
    if (!exam) return;
    setSaving("meta");
    try {
      const res = await api.admin.updateExam(exam.id, {
        title: examMetaForm.title,
        description: examMetaForm.description || undefined,
        skill: examMetaForm.skill,
        durationMinutes: Number(examMetaForm.durationMinutes),
        isPro: examMetaForm.isPro,
        isPublished: examMetaForm.isPublished,
        hotLevel: Number(examMetaForm.hotLevel || 0),
        forecastTag: examMetaForm.forecastTag.trim() || null,
      });
      if (res.success) {
        showToast("Đã cập nhật thông tin chung đề thi!");
        setEditingExamMeta(false);
        load();
      } else {
        showToast(res.error?.message || "Lỗi cập nhật", "err");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ", "err");
    } finally {
      setSaving(null);
    }
  };

  const startEditPart = (p: Part) => {
    setEditingPart(p.id);
    setPartForm({
      title: p.title,
      instructions: p.instructions || "",
      passage_text: p.passage_text || "",
      audio_url: p.audio_url || "",
      image_url: p.image_url || "",
    });
  };

  const savePart = async (partId: string) => {
    setSaving(`p-${partId}`);
    try {
      const res = await api.admin.updatePart(partId, {
        title: partForm.title,
        instructions: partForm.instructions || undefined,
        passageText: partForm.passage_text || undefined,
        audioUrl: partForm.audio_url || undefined,
        imageUrl: partForm.image_url || undefined,
      });
      if (res.success) {
        showToast("Đã lưu phần thi!");
        setEditingPart(null);
        load();
      } else {
        showToast(res.error?.message || "Lỗi", "err");
      }
    } catch {
      showToast("Lỗi kết nối", "err");
    } finally {
      setSaving(null);
    }
  };

  const doAddPart = async () => {
    if (!newPartTitle.trim()) return;
    setSaving("addpart");
    try {
      const res = await api.admin.addPart(examId, { title: newPartTitle });
      if (res.success) {
        showToast("Đã thêm phần thi!");
        setAddingPart(false);
        setNewPartTitle("");
        load();
      } else {
        showToast(res.error?.message || "Lỗi", "err");
      }
    } catch {
      showToast("Lỗi kết nối", "err");
    } finally {
      setSaving(null);
    }
  };

  const doDeletePart = async () => {
    if (!confirmDelPart) return;
    setSaving("delpart");
    try {
      const res = await api.admin.deletePart(confirmDelPart.id);
      if (res.success) {
        showToast("Đã xóa phần thi!");
        setConfirmDelPart(null);
        load();
      } else {
        showToast(res.error?.message || "Lỗi", "err");
      }
    } catch {
      showToast("Lỗi kết nối", "err");
    } finally {
      setSaving(null);
    }
  };

  const saveQ = async (questionId: string, qData: PolymorphicQuestionData) => {
    setSaving(`q-${questionId}`);
    try {
      const res = await api.admin.updateQuestion(questionId, {
        prompt: qData.prompt,
        questionType: qData.question_type,
        options: qData.options !== undefined ? qData.options : undefined,
        correctAnswer: qData.correct_answer || undefined,
        explanation: qData.explanation || undefined,
        maxScore: Number(qData.max_score),
      });
      if (res.success) {
        showToast("Đã lưu câu hỏi thành công!");
        setEditingQuestion(null);
        load();
      } else {
        showToast(res.error?.message || "Lỗi", "err");
      }
    } catch {
      showToast("Lỗi kết nối", "err");
    } finally {
      setSaving(null);
    }
  };

  const doAddQ = async (partId: string, qData: PolymorphicQuestionData) => {
    setSaving(`addq-${partId}`);
    try {
      const res = await api.admin.addQuestion(partId, {
        prompt: qData.prompt,
        questionType: qData.question_type,
        options: qData.options !== undefined ? qData.options : undefined,
        correctAnswer: qData.correct_answer || undefined,
        explanation: qData.explanation || undefined,
        maxScore: Number(qData.max_score),
      });
      if (res.success) {
        showToast("Đã thêm câu hỏi thành công!");
        setAddingQPartId(null);
        load();
      } else {
        showToast(res.error?.message || "Lỗi", "err");
      }
    } catch {
      showToast("Lỗi kết nối", "err");
    } finally {
      setSaving(null);
    }
  };

  const doDeleteQ = async () => {
    if (!confirmDelQ) return;
    setSaving("delq");
    try {
      const res = await api.admin.deleteQuestion(confirmDelQ.id);
      if (res.success) {
        showToast(`Đã xóa câu #${confirmDelQ.question_number}`);
        setConfirmDelQ(null);
        load();
      } else {
        showToast(res.error?.message || "Lỗi", "err");
      }
    } catch {
      showToast("Lỗi kết nối", "err");
    } finally {
      setSaving(null);
    }
  };

  const ic =
    "w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-xs";
  const lc = "block font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-400 dark:text-slate-500" />
        <span className="ml-3 text-sm text-slate-400 dark:text-slate-500">
          Đang tải nội dung đề thi...
        </span>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Không tìm thấy đề thi.{" "}
          <Link href="/admin/exams" className="font-bold underline text-blue-600 dark:text-blue-400">
            Quay lại danh sách
          </Link>
        </p>
      </div>
    );
  }

  const totalQ = exam.parts.reduce((s, p) => s + p.questions.length, 0);

  return (
    <div className="space-y-5 pb-12">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 text-white animate-in fade-in slide-in-from-bottom-4 ${
            toast.type === "err" ? "bg-rose-600" : "bg-slate-900 dark:bg-slate-800"
          }`}
        >
          {toast.type === "err" ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowBackConfirm(true)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
            title="Quay lại danh sách đề thi"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-heading font-extrabold text-slate-900 dark:text-white">
                {exam.title}
              </h1>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  skillColors[exam.skill] ||
                  "text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                }`}
              >
                {exam.skill}
              </span>
              {exam.is_pro && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                  <Crown className="w-3 h-3 fill-amber-500" />
                  VIP
                </span>
              )}
              {!exam.is_published && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  Bản nháp
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              {exam.duration_minutes} phút
              <span className="text-slate-200 dark:text-slate-700">•</span>
              {exam.parts.length} phần
              <span className="text-slate-200 dark:text-slate-700">•</span>
              {totalQ} câu hỏi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link
            href={getExamTakeUrl(exam)}
            target="_blank"
            className="px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-heading font-semibold flex items-center gap-1.5 transition-colors"
            title="Mở giao diện phòng thi của học viên để đối chiếu trực tiếp"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Làm bài thử (Giao diện học viên)</span>
          </Link>

          <button
            onClick={startEditExamMeta}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-heading font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Sửa tên đề, thời lượng, VIP, trạng thái xuất bản"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Cấu hình đề</span>
          </button>

          <button
            onClick={load}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            href="/admin/exams"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-heading font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            Về danh sách
          </Link>
        </div>
      </div>

      {/* Card: Edit Exam Metadata */}
      {editingExamMeta && (
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-5 shadow-xs space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-indigo-100 dark:border-indigo-900/40">
            <div className="flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
              <h3 className="font-heading font-bold text-xs text-indigo-950 dark:text-indigo-200">
                Chỉnh sửa Cấu hình Chung của Đề thi
              </h3>
            </div>
            <button
              onClick={() => setEditingExamMeta(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className={lc}>Tên đề thi *</label>
              <input
                type="text"
                className={ic}
                value={examMetaForm.title}
                onChange={(e) => setExamMetaForm({ ...examMetaForm, title: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={lc}>Mô tả đề thi</label>
              <input
                type="text"
                className={ic}
                value={examMetaForm.description}
                onChange={(e) => setExamMetaForm({ ...examMetaForm, description: e.target.value })}
              />
            </div>
            <div>
              <label className={lc}>Kỹ năng</label>
              <select
                className={ic}
                value={examMetaForm.skill}
                onChange={(e) => setExamMetaForm({ ...examMetaForm, skill: e.target.value })}
              >
                <option value="FULL_TEST">Full Test</option>
                <option value="READING">Reading</option>
                <option value="LISTENING">Listening</option>
                <option value="WRITING">Writing</option>
                <option value="SPEAKING">Speaking</option>
                <option value="GRAMMAR_VOCABULARY">Grammar & Vocab</option>
              </select>
            </div>
            <div>
              <label className={lc}>Thời lượng (phút) *</label>
              <input
                type="number"
                className={ic + " font-mono"}
                value={examMetaForm.durationMinutes}
                onChange={(e) =>
                  setExamMetaForm({ ...examMetaForm, durationMinutes: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className={lc}>Độ Hot / Đề dự đoán (Số lượng Cỏ ☘️)</label>
              <select
                className={ic}
                value={examMetaForm.hotLevel}
                onChange={(e) =>
                  setExamMetaForm({ ...examMetaForm, hotLevel: Number(e.target.value) })
                }
              >
                <option value={0}>⚪ Không gán (0 ☘️)</option>
                <option value={1}>☘️ 1 Cỏ</option>
                <option value={2}>☘️☘️ 2 Cỏ</option>
                <option value={3}>☘️☘️☘️ 3 Cỏ</option>
                <option value={4}>☘️☘️☘️☘️ 4 Cỏ</option>
                <option value={5}>☘️☘️☘️☘️☘️ 5 Cỏ</option>
              </select>
            </div>
            <div>
              <label className={lc}>
                Ghi chú dự đoán nội bộ <span className="text-[10px] text-slate-400 font-normal">(Chỉ Admin thấy)</span>
              </label>
              <input
                type="text"
                className={ic}
                value={examMetaForm.forecastTag}
                onChange={(e) => setExamMetaForm({ ...examMetaForm, forecastTag: e.target.value })}
                placeholder="VD: Đợt thi 15/11, Đề tủ B2..."
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={examMetaForm.isPro}
                  onChange={(e) => setExamMetaForm({ ...examMetaForm, isPro: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
                />
                <span className="font-heading font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  Yêu cầu VIP PRO
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={examMetaForm.isPublished}
                  onChange={(e) =>
                    setExamMetaForm({ ...examMetaForm, isPublished: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
                />
                <span className="font-heading font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  Xuất bản ngay (Học viên thấy)
                </span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
            <button
              onClick={() => setEditingExamMeta(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs"
            >
              Hủy
            </button>
            <button
              disabled={saving === "meta" || !examMetaForm.title.trim()}
              onClick={saveExamMeta}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-2xs"
            >
              {saving === "meta" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Lưu cấu hình</span>
            </button>
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Kỹ năng", value: exam.skill },
          { label: "Thời lượng", value: `${exam.duration_minutes} phút` },
          {
            label: "Độ Hot ☘️",
            value: (() => {
              const lvl = exam.hot_level ?? exam.hotLevel ?? 0;
              return lvl > 0 ? "☘️".repeat(lvl) : "⚪ Không gán";
            })(),
          },
          { label: "Số phần", value: String(exam.parts.length) },
          { label: "Tổng câu hỏi", value: String(totalQ) },
        ].map(({ label, value }) => (
          <div key={label}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
              {label}
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Parts list */}
      <div className="space-y-3">
        {exam.parts.map((part) => (
          <div
            key={part.id}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
          >
            {/* Part header */}
            <div
              className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors select-none"
              onClick={() =>
                setExpandedParts((prev) => ({ ...prev, [part.id]: !prev[part.id] }))
              }
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black flex items-center justify-center font-mono shrink-0">
                  {part.part_number}
                </span>
                <div>
                  <span className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                    {part.title}
                  </span>
                  <span className="ml-2 text-[11px] text-slate-400 dark:text-slate-500">
                    {part.questions.length} câu
                  </span>
                  {part.image_url && (
                    <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                      <ImageIcon className="w-3 h-3" />
                      {part.image_url.includes(",") ? "2 tranh so sánh" : "Có ảnh minh họa"}
                    </span>
                  )}
                  {part.audio_url && (
                    <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                      <Volume2 className="w-3 h-3" />
                      Audio
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditPart(part);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Sửa nội dung phần thi"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelPart(part);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Xóa phần thi"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {expandedParts[part.id] ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {/* Part edit form */}
            {editingPart === part.id && (
              <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-5 space-y-4 text-xs">
                <div>
                  <label className={lc}>Tiêu đề phần thi</label>
                  <input
                    type="text"
                    className={ic}
                    value={partForm.title}
                    onChange={(e) => setPartForm({ ...partForm, title: e.target.value })}
                  />
                </div>

                {/* Media & Passage Editor with Dual-Image comparison support */}
                <PartMediaEditor
                  partTitle={partForm.title || part.title}
                  skill={exam.skill}
                  partNumber={part.part_number}
                  instructions={partForm.instructions}
                  passageText={partForm.passage_text}
                  audioUrl={partForm.audio_url}
                  imageUrl={partForm.image_url}
                  onChange={(fields) => {
                    setPartForm((prev) => ({
                      ...prev,
                      ...(fields.instructions !== undefined && { instructions: fields.instructions }),
                      ...(fields.passageText !== undefined && { passage_text: fields.passageText }),
                      ...(fields.audioUrl !== undefined && { audio_url: fields.audioUrl }),
                      ...(fields.imageUrl !== undefined && { image_url: fields.imageUrl }),
                    }));
                  }}
                />

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setEditingPart(null)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    disabled={saving === `p-${part.id}`}
                    onClick={() => savePart(part.id)}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {saving === `p-${part.id}` ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Lưu phần thi</span>
                  </button>
                </div>
              </div>
            )}

            {/* Questions list */}
            {expandedParts[part.id] && editingPart !== part.id && (
              <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100/80 dark:divide-slate-800/80">
                {part.questions.length === 0 && (
                  <div className="px-5 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    <HelpCircle className="w-5 h-5 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    Chưa có câu hỏi nào trong phần này
                  </div>
                )}

                {part.questions.map((q) => (
                  <div key={q.id} className="p-3">
                    {editingQuestion === q.id ? (
                      /* Polymorphic Question Edit Form */
                      <PolymorphicQuestionForm
                        initialData={{
                          prompt: q.prompt,
                          question_type: q.question_type,
                          options: q.options,
                          correct_answer: q.correct_answer || "",
                          explanation: q.explanation || "",
                          max_score: q.max_score,
                        }}
                        skill={exam.skill}
                        partNumber={part.part_number}
                        onSave={(qData) => saveQ(q.id, qData)}
                        onCancel={() => setEditingQuestion(null)}
                        saving={saving === `q-${q.id}`}
                      />
                    ) : (
                      /* Polymorphic Question Card */
                      <QuestionCardRow
                        question={q}
                        onEdit={() => setEditingQuestion(q.id)}
                        onDelete={() => setConfirmDelQ(q)}
                      />
                    )}
                  </div>
                ))}

                {/* Add question inline with Polymorphic Form */}
                {addingQPartId === part.id ? (
                  <div className="p-4 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                    <PolymorphicQuestionForm
                      isNew
                      initialData={{
                        prompt: "",
                        question_type: "",
                        options: null,
                        correct_answer: "",
                        explanation: "",
                        max_score: 1.0,
                      }}
                      skill={exam.skill}
                      partNumber={part.part_number}
                      onSave={(qData) => doAddQ(part.id, qData)}
                      onCancel={() => setAddingQPartId(null)}
                      saving={saving === `addq-${part.id}`}
                    />
                  </div>
                ) : (
                  <div className="px-5 py-2.5">
                    <button
                      onClick={() => setAddingQPartId(part.id)}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm câu hỏi vào phần này</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Add Part */}
        {addingPart ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3 text-xs">
            <span className="font-heading font-bold text-slate-700 dark:text-slate-300">
              ➕ Thêm phần thi mới (Part)
            </span>
            <div>
              <label className={lc}>Tiêu đề phần thi</label>
              <input
                autoFocus
                type="text"
                className={ic}
                placeholder="VD: Part 5 — Long Reading / Part 3 — Compare & Explain..."
                value={newPartTitle}
                onChange={(e) => setNewPartTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") doAddPart();
                }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setAddingPart(false);
                  setNewPartTitle("");
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs"
              >
                Hủy
              </button>
              <button
                disabled={!newPartTitle.trim() || saving === "addpart"}
                onClick={doAddPart}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                {saving === "addpart" ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Tạo phần thi</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingPart(true)}
            className="w-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm phần thi mới (Part)</span>
          </button>
        )}
      </div>

      {/* Delete Modals */}
      <ConfirmModal
        isOpen={!!confirmDelPart}
        title="Xóa phần thi"
        message={`Xóa "${confirmDelPart?.title}" sẽ xóa luôn ${
          confirmDelPart?.questions.length || 0
        } câu hỏi trong phần này. Không thể hoàn tác!`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        onConfirm={doDeletePart}
        onCancel={() => setConfirmDelPart(null)}
      />

      <ConfirmModal
        isOpen={!!confirmDelQ}
        title="Xóa câu hỏi"
        message={`Xóa câu hỏi #${confirmDelQ?.question_number}? Không thể hoàn tác!`}
        confirmText="Xóa câu hỏi"
        cancelText="Hủy"
        onConfirm={doDeleteQ}
        onCancel={() => setConfirmDelQ(null)}
      />

      {/* Modal xác nhận quay lại danh sách đề thi */}
      <ConfirmModal
        isOpen={showBackConfirm}
        title="Quay lại danh sách đề thi?"
        message="Bạn có chắc chắn muốn quay lại danh sách đề thi? Các thiết lập và bộ lọc của bạn trong trang danh sách sẽ được giữ nguyên."
        confirmText="Quay lại danh sách"
        cancelText="Tiếp tục chỉnh sửa"
        type="warning"
        onConfirm={() => {
          setShowBackConfirm(false);
          router.push("/admin/exams");
        }}
        onCancel={() => setShowBackConfirm(false)}
      />
    </div>
  );
}