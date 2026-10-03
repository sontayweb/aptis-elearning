"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api-client";
import {
  ArrowLeft, Clock, Crown, CheckCircle2, RefreshCw,
  ChevronDown, ChevronRight, Edit2, Trash2, Plus, Save, X,
  AlertTriangle, Check, GripVertical, HelpCircle, Play,
} from "lucide-react";
import ConfirmModal from "@/components/admin/confirm-modal";

interface Question {
  id: string;
  question_number: number;
  question_type: string;
  prompt: string;
  options: string[] | null;
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
  parts: Part[];
}

const BLANK_Q = { prompt: "", questionType: "MULTIPLE_CHOICE", optionsText: "", correctAnswer: "", explanation: "", maxScore: 1.0 };

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
  const [qForm, setQForm] = useState<Record<string, string | number>>({});
  const [addingQPartId, setAddingQPartId] = useState<string | null>(null);
  const [newQ, setNewQ] = useState({ ...BLANK_Q });
  const [addingPart, setAddingPart] = useState(false);
  const [newPartTitle, setNewPartTitle] = useState("");
  const [confirmDelPart, setConfirmDelPart] = useState<Part | null>(null);
  const [confirmDelQ, setConfirmDelQ] = useState<Question | null>(null);
  const [editingExamMeta, setEditingExamMeta] = useState(false);
  const [examMetaForm, setExamMetaForm] = useState({
    title: "",
    description: "",
    skill: "FULL_TEST",
    durationMinutes: 40,
    isPro: false,
    isPublished: true,
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

  const startEditExamMeta = () => {
    if (!exam) return;
    setExamMetaForm({
      title: exam.title,
      description: exam.description || "",
      skill: exam.skill,
      durationMinutes: exam.duration_minutes,
      isPro: exam.is_pro,
      isPublished: exam.is_published,
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
        data.parts.forEach((p) => { exp[p.id] = true; });
        setExpandedParts(exp);
      } else showToast(res.error?.message || "Không thể tải đề thi", "err");
    } catch { showToast("Lỗi kết nối máy chủ", "err"); }
    finally { setLoading(false); }
  }, [examId]);

  useEffect(() => { load(); }, [load]);

  const skillColors: Record<string, string> = {
    READING: "text-emerald-700 bg-emerald-50 border-emerald-200",
    LISTENING: "text-sky-700 bg-sky-50 border-sky-200",
    WRITING: "text-purple-700 bg-purple-50 border-purple-200",
    SPEAKING: "text-rose-700 bg-rose-50 border-rose-200",
    FULL_TEST: "text-indigo-700 bg-indigo-50 border-indigo-200",
  };

  const startEditPart = (p: Part) => {
    setEditingPart(p.id);
    setPartForm({ title: p.title, instructions: p.instructions || "", passage_text: p.passage_text || "", audio_url: p.audio_url || "", image_url: p.image_url || "" });
  };

  const savePart = async (partId: string) => {
    setSaving(`p-${partId}`);
    try {
      const res = await api.admin.updatePart(partId, {
        title: partForm.title, instructions: partForm.instructions || undefined,
        passageText: partForm.passage_text || undefined, audioUrl: partForm.audio_url || undefined, imageUrl: partForm.image_url || undefined,
      });
      if (res.success) { showToast("Đã lưu phần thi!"); setEditingPart(null); load(); }
      else showToast(res.error?.message || "Lỗi", "err");
    } catch { showToast("Lỗi kết nối", "err"); } finally { setSaving(null); }
  };

  const doAddPart = async () => {
    if (!newPartTitle.trim()) return;
    setSaving("addpart");
    try {
      const res = await api.admin.addPart(examId, { title: newPartTitle });
      if (res.success) { showToast("Đã thêm phần thi!"); setAddingPart(false); setNewPartTitle(""); load(); }
      else showToast(res.error?.message || "Lỗi", "err");
    } catch { showToast("Lỗi kết nối", "err"); } finally { setSaving(null); }
  };

  const doDeletePart = async () => {
    if (!confirmDelPart) return;
    setSaving("delpart");
    try {
      const res = await api.admin.deletePart(confirmDelPart.id);
      if (res.success) { showToast("Đã xóa phần thi!"); setConfirmDelPart(null); load(); }
      else showToast(res.error?.message || "Lỗi", "err");
    } catch { showToast("Lỗi kết nối", "err"); } finally { setSaving(null); }
  };

  const startEditQ = (q: Question) => {
    setEditingQuestion(q.id);
    setQForm({ prompt: q.prompt, question_type: q.question_type, optionsText: q.options ? q.options.join("\n") : "", correct_answer: q.correct_answer || "", explanation: q.explanation || "", max_score: q.max_score });
  };

  const saveQ = async (questionId: string) => {
    setSaving(`q-${questionId}`);
    try {
      const rawOptions = String(qForm.optionsText || "").split("\n").map(s => s.trim()).filter(Boolean);
      const res = await api.admin.updateQuestion(questionId, {
        prompt: String(qForm.prompt), questionType: String(qForm.question_type),
        options: rawOptions.length > 0 ? rawOptions : undefined,
        correctAnswer: String(qForm.correct_answer) || undefined, explanation: String(qForm.explanation) || undefined, maxScore: Number(qForm.max_score),
      });
      if (res.success) { showToast("Đã lưu câu hỏi!"); setEditingQuestion(null); load(); }
      else showToast(res.error?.message || "Lỗi", "err");
    } catch { showToast("Lỗi kết nối", "err"); } finally { setSaving(null); }
  };

  const doAddQ = async (partId: string) => {
    setSaving(`addq-${partId}`);
    try {
      const rawOptions = newQ.optionsText.split("\n").map(s => s.trim()).filter(Boolean);
      const res = await api.admin.addQuestion(partId, {
        prompt: newQ.prompt, questionType: newQ.questionType,
        options: rawOptions.length > 0 ? rawOptions : undefined,
        correctAnswer: newQ.correctAnswer || undefined, explanation: newQ.explanation || undefined, maxScore: newQ.maxScore,
      });
      if (res.success) { showToast("Đã thêm câu hỏi!"); setAddingQPartId(null); setNewQ({ ...BLANK_Q }); load(); }
      else showToast(res.error?.message || "Lỗi", "err");
    } catch { showToast("Lỗi kết nối", "err"); } finally { setSaving(null); }
  };

  const doDeleteQ = async () => {
    if (!confirmDelQ) return;
    setSaving("delq");
    try {
      const res = await api.admin.deleteQuestion(confirmDelQ.id);
      if (res.success) { showToast(`Đã xóa câu #${confirmDelQ.question_number}`); setConfirmDelQ(null); load(); }
      else showToast(res.error?.message || "Lỗi", "err");
    } catch { showToast("Lỗi kết nối", "err"); } finally { setSaving(null); }
  };

  const ic = "w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-900 text-xs";
  const lc = "block font-heading font-semibold text-slate-700 mb-1 text-xs";

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
      <span className="ml-3 text-sm text-slate-400">Đang tải nội dung đề thi...</span>
    </div>
  );

  if (!exam) return (
    <div className="text-center py-20">
      <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
      <p className="text-sm text-slate-500">Không tìm thấy đề thi. <Link href="/admin/exams" className="font-bold underline text-slate-900">Quay lại</Link></p>
    </div>
  );

  const totalQ = exam.parts.reduce((s, p) => s + p.questions.length, 0);

  return (
    <div className="space-y-5 pb-12">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 text-white animate-in fade-in slide-in-from-bottom-4 ${toast.type === "err" ? "bg-rose-600" : "bg-slate-900"}`}>
          {toast.type === "err" ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          <span className="text-xs font-semibold">{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/exams" className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-heading font-extrabold text-slate-900">{exam.title}</h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${skillColors[exam.skill] || "text-slate-700 bg-slate-50 border-slate-200"}`}>{exam.skill}</span>
              {exam.is_pro && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700"><Crown className="w-3 h-3 fill-amber-500" />VIP</span>}
              {!exam.is_published && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-500">Bản nháp</span>}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
              <Clock className="w-3 h-3" />{exam.duration_minutes} phút
              <span className="text-slate-200">•</span>{exam.parts.length} phần
              <span className="text-slate-200">•</span>{totalQ} câu hỏi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link
            href={getExamTakeUrl(exam)}
            target="_blank"
            className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-heading font-semibold flex items-center gap-1.5 transition-colors"
            title="Mở giao diện học viên để trải nghiệm làm bài thực tế"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Làm bài thử</span>
          </Link>
          <button
            onClick={startEditExamMeta}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-heading font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Sửa tên đề, thời lượng, VIP, trạng thái xuất bản"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Cấu hình đề</span>
          </button>
          <button onClick={load} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors" title="Tải lại">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link href="/admin/exams" className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-heading font-bold flex items-center gap-1.5 transition-colors">
            <Check className="w-3.5 h-3.5" />Về danh sách
          </Link>
        </div>
      </div>

      {/* Card: Edit Exam Metadata */}
      {editingExamMeta && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-xs space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
            <div className="flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-indigo-700" />
              <h3 className="font-heading font-bold text-xs text-indigo-950">Chỉnh sửa Cấu hình Chung của Đề thi</h3>
            </div>
            <button onClick={() => setEditingExamMeta(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
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
                onChange={(e) => setExamMetaForm({ ...examMetaForm, durationMinutes: Number(e.target.value) })}
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={examMetaForm.isPro}
                  onChange={(e) => setExamMetaForm({ ...examMetaForm, isPro: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900 accent-slate-900"
                />
                <span className="font-heading font-semibold text-slate-800 text-xs">Yêu cầu VIP PRO</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={examMetaForm.isPublished}
                  onChange={(e) => setExamMetaForm({ ...examMetaForm, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900 accent-slate-900"
                />
                <span className="font-heading font-semibold text-slate-800 text-xs">Xuất bản ngay (Học viên thấy)</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-indigo-100">
            <button
              onClick={() => setEditingExamMeta(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-semibold text-xs"
            >
              Hủy
            </button>
            <button
              disabled={saving === "meta" || !examMetaForm.title.trim()}
              onClick={saveExamMeta}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-2xs"
            >
              {saving === "meta" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Lưu cấu hình</span>
            </button>
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Kỹ năng", value: exam.skill },
          { label: "Thời lượng", value: `${exam.duration_minutes} phút` },
          { label: "Số phần", value: String(exam.parts.length) },
          { label: "Tổng câu hỏi", value: String(totalQ) },
        ].map(({ label, value }) => (
          <div key={label}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">{label}</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{value}</span>
          </div>
        ))}
      </div>

      {/* Parts list */}
      <div className="space-y-3">
        {exam.parts.map((part) => (
          <div key={part.id} className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            {/* Part header */}
            <div
              className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
              onClick={() => setExpandedParts(prev => ({ ...prev, [part.id]: !prev[part.id] }))}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center font-mono shrink-0">{part.part_number}</span>
                <div>
                  <span className="font-heading font-bold text-sm text-slate-900">{part.title}</span>
                  <span className="ml-2 text-[11px] text-slate-400">{part.questions.length} câu</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={e => { e.stopPropagation(); startEditPart(part); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={e => { e.stopPropagation(); setConfirmDelPart(part); }} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                {expandedParts[part.id] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {/* Part edit form */}
            {editingPart === part.id && (
              <div className="border-t border-slate-100 bg-slate-50/40 p-4 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2"><label className={lc}>Tiêu đề phần thi</label><input type="text" className={ic} value={partForm.title} onChange={e => setPartForm({ ...partForm, title: e.target.value })} /></div>
                  <div className="sm:col-span-2"><label className={lc}>Hướng dẫn (Instructions)</label><textarea rows={2} className={ic + " resize-none"} value={partForm.instructions} onChange={e => setPartForm({ ...partForm, instructions: e.target.value })} /></div>
                  <div className="sm:col-span-2"><label className={lc}>Bài đọc / Ngữ cảnh (Reading passage)</label><textarea rows={5} className={ic + " resize-none"} placeholder="Nhập bài đọc..." value={partForm.passage_text} onChange={e => setPartForm({ ...partForm, passage_text: e.target.value })} /></div>
                  <div>
                    <label className={lc}>URL Audio (Listening)</label>
                    <input
                      type="text"
                      className={ic + " font-mono text-[11px]"}
                      placeholder="https://...mp3"
                      value={partForm.audio_url}
                      onChange={e => setPartForm({ ...partForm, audio_url: e.target.value })}
                    />
                    {partForm.audio_url && (
                      <div className="mt-1.5 p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Nghe thử file audio:</span>
                        <audio controls className="w-full h-7" src={partForm.audio_url} />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={lc}>URL Hình ảnh (Speaking)</label>
                    <input
                      type="text"
                      className={ic + " font-mono text-[11px]"}
                      placeholder="https://...jpg"
                      value={partForm.image_url}
                      onChange={e => setPartForm({ ...partForm, image_url: e.target.value })}
                    />
                    {partForm.image_url && (
                      <div className="mt-1.5 p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Xem trước ảnh:</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={partForm.image_url}
                          alt="Part illustration"
                          className="max-h-28 rounded object-contain mx-auto"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button onClick={() => setEditingPart(null)} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-semibold text-xs">Hủy</button>
                  <button disabled={saving === `p-${part.id}`} onClick={() => savePart(part.id)} className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-800 disabled:opacity-50">
                    {saving === `p-${part.id}` ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Lưu phần thi
                  </button>
                </div>
              </div>
            )}

            {/* Questions list */}
            {expandedParts[part.id] && editingPart !== part.id && (
              <div className="border-t border-slate-100 divide-y divide-slate-100/80">
                {part.questions.length === 0 && (
                  <div className="px-5 py-6 text-center text-xs text-slate-400"><HelpCircle className="w-5 h-5 mx-auto mb-2 text-slate-300" />Chưa có câu hỏi</div>
                )}
                {part.questions.map((q) => (
                  <div key={q.id} className="px-5 py-3.5">
                    {editingQuestion === q.id ? (
                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-700">✏️ Sửa câu #{q.question_number}</span>
                          <button onClick={() => setEditingQuestion(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2"><label className={lc}>Nội dung câu hỏi</label><textarea rows={3} className={ic + " resize-none"} value={String(qForm.prompt)} onChange={e => setQForm({ ...qForm, prompt: e.target.value })} /></div>
                          <div><label className={lc}>Loại câu hỏi</label><select className={ic} value={String(qForm.question_type)} onChange={e => setQForm({ ...qForm, question_type: e.target.value })}><option value="MULTIPLE_CHOICE">Trắc nghiệm</option><option value="FILL_BLANK">Điền từ</option><option value="ESSAY">Tự luận</option><option value="AUDIO">Ghi âm</option></select></div>
                          <div><label className={lc}>Điểm tối đa</label><input type="number" step="0.5" className={ic + " font-mono"} value={Number(qForm.max_score)} onChange={e => setQForm({ ...qForm, max_score: Number(e.target.value) })} /></div>
                          <div className="col-span-2"><label className={lc}>Các lựa chọn (mỗi dòng 1 lựa chọn)</label><textarea rows={3} className={ic + " resize-none font-mono"} placeholder={"live\nlives\nliving"} value={String(qForm.optionsText)} onChange={e => setQForm({ ...qForm, optionsText: e.target.value })} /></div>
                          <div><label className={lc}>Đáp án đúng</label><input type="text" className={ic + " font-mono font-bold"} value={String(qForm.correct_answer)} onChange={e => setQForm({ ...qForm, correct_answer: e.target.value })} /></div>
                          <div><label className={lc}>Lời giải thích</label><input type="text" className={ic} value={String(qForm.explanation)} onChange={e => setQForm({ ...qForm, explanation: e.target.value })} /></div>
                        </div>
                        <div className="flex gap-2 pt-1 border-t border-slate-100">
                          <button onClick={() => setEditingQuestion(null)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs">Hủy</button>
                          <button disabled={saving === `q-${q.id}`} onClick={() => saveQ(q.id)} className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-800 disabled:opacity-50">
                            {saving === `q-${q.id}` ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Lưu câu hỏi
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 group">
                        <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 text-[10px] font-black flex items-center justify-center font-mono shrink-0 mt-0.5">{q.question_number}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-800 font-medium leading-relaxed line-clamp-2">{q.prompt}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] font-mono text-slate-400">{q.question_type}</span>
                            {q.correct_answer && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">✓ {q.correct_answer}</span>}
                            <span className="text-[10px] text-slate-400">{q.max_score}đ</span>
                            {Array.isArray(q.options) && q.options.length > 0 && <span className="text-[10px] text-slate-400">{q.options.length} lựa chọn</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => startEditQ(q)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setConfirmDelQ(q)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add question inline */}
                {addingQPartId === part.id ? (
                  <div className="px-5 py-4 bg-slate-50/60 border-t border-slate-100 space-y-3 text-xs">
                    <span className="font-heading font-bold text-slate-700">➕ Thêm câu hỏi mới</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2"><label className={lc}>Nội dung câu hỏi</label><textarea rows={2} className={ic + " resize-none"} value={newQ.prompt} onChange={e => setNewQ({ ...newQ, prompt: e.target.value })} /></div>
                      <div><label className={lc}>Loại</label><select className={ic} value={newQ.questionType} onChange={e => setNewQ({ ...newQ, questionType: e.target.value })}><option value="MULTIPLE_CHOICE">Trắc nghiệm</option><option value="FILL_BLANK">Điền từ</option><option value="ESSAY">Tự luận</option><option value="AUDIO">Ghi âm</option></select></div>
                      <div><label className={lc}>Đáp án đúng</label><input type="text" className={ic + " font-mono font-bold"} value={newQ.correctAnswer} onChange={e => setNewQ({ ...newQ, correctAnswer: e.target.value })} /></div>
                      <div className="col-span-2"><label className={lc}>Các lựa chọn (mỗi dòng)</label><textarea rows={3} className={ic + " resize-none font-mono"} placeholder={"live\nlives\nliving"} value={newQ.optionsText} onChange={e => setNewQ({ ...newQ, optionsText: e.target.value })} /></div>
                      <div><label className={lc}>Điểm tối đa</label><input type="number" step="0.5" className={ic + " font-mono"} value={newQ.maxScore} onChange={e => setNewQ({ ...newQ, maxScore: Number(e.target.value) })} /></div>
                      <div><label className={lc}>Lời giải thích</label><input type="text" className={ic} value={newQ.explanation} onChange={e => setNewQ({ ...newQ, explanation: e.target.value })} /></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setAddingQPartId(null); setNewQ({ ...BLANK_Q }); }} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs">Hủy</button>
                      <button disabled={!newQ.prompt.trim() || saving === `addq-${part.id}`} onClick={() => doAddQ(part.id)} className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-800 disabled:opacity-50">
                        {saving === `addq-${part.id}` ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}Thêm câu hỏi
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-2.5">
                    <button onClick={() => { setAddingQPartId(part.id); setNewQ({ ...BLANK_Q }); }} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors font-semibold">
                      <Plus className="w-3.5 h-3.5" />Thêm câu hỏi vào phần này
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Add Part */}
        {addingPart ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 space-y-3 text-xs">
            <span className="font-heading font-bold text-slate-700">➕ Thêm phần thi mới</span>
            <div><label className={lc}>Tiêu đề phần thi</label><input autoFocus type="text" className={ic} placeholder="Part 5 — Long Reading..." value={newPartTitle} onChange={e => setNewPartTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") doAddPart(); }} /></div>
            <div className="flex gap-2">
              <button onClick={() => { setAddingPart(false); setNewPartTitle(""); }} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs">Hủy</button>
              <button disabled={!newPartTitle.trim() || saving === "addpart"} onClick={doAddPart} className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-800 disabled:opacity-50">
                {saving === "addpart" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}Tạo phần thi
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingPart(true)} className="w-full rounded-2xl border border-dashed border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 py-4 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />Thêm phần thi mới (Part)
          </button>
        )}
      </div>

      <ConfirmModal isOpen={!!confirmDelPart} title="Xóa phần thi" message={`Xóa "${confirmDelPart?.title}" sẽ xóa luôn ${confirmDelPart?.questions.length || 0} câu hỏi trong phần này. Không thể hoàn tác!`} confirmText="Xác nhận xóa" cancelText="Hủy" onConfirm={doDeletePart} onCancel={() => setConfirmDelPart(null)} />
      <ConfirmModal isOpen={!!confirmDelQ} title="Xóa câu hỏi" message={`Xóa câu hỏi #${confirmDelQ?.question_number}? Không thể hoàn tác!`} confirmText="Xóa câu hỏi" cancelText="Hủy" onConfirm={doDeleteQ} onCancel={() => setConfirmDelQ(null)} />
    </div>
  );
}