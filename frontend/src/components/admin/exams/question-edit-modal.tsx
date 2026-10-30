"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Edit2,
  X,
  ExternalLink,
  Image as ImageIcon,
  Volume2,
  FileText,
  Check,
  RefreshCw,
} from "lucide-react";
import { QuestionItem, QuestionEditFormData, detectAptisTaskMeta } from "./exam.types";
import {
  PolymorphicQuestionForm,
  PolymorphicQuestionData,
} from "./polymorphic-question-form";
import { ExamPartImageGallery } from "@/components/exam-part-image-gallery";
import { PartMediaEditor } from "./part-media-editor";
import { api } from "@/lib/api-client";

interface QuestionEditModalProps {
  question: QuestionItem | null;
  form: QuestionEditFormData;
  setForm: React.Dispatch<React.SetStateAction<QuestionEditFormData>>;
  onSave: (polyData?: PolymorphicQuestionData) => void;
  onClose: () => void;
  loading: boolean;
  onPartUpdated?: () => void;
}

export const QuestionEditModal: React.FC<QuestionEditModalProps> = ({
  question,
  form,
  onSave,
  onClose,
  loading,
  onPartUpdated,
}) => {
  const [editingPartContext, setEditingPartContext] = useState(false);
  const [partTitle, setPartTitle] = useState("");
  const [partPassage, setPartPassage] = useState("");
  const [partAudioUrl, setPartAudioUrl] = useState("");
  const [partImageUrl, setPartImageUrl] = useState("");
  const [savingPart, setSavingPart] = useState(false);
  const [partSavedMsg, setPartSavedMsg] = useState("");

  useEffect(() => {
    if (question) {
      setEditingPartContext(false);
      setPartTitle(question.part.title || "");
      setPartPassage(question.part.passageText || "");
      setPartAudioUrl(question.part.audioUrl || "");
      setPartImageUrl(question.part.imageUrl || "");
      setPartSavedMsg("");
    }
  }, [question]);

  if (!question) return null;

  const skill = question.part.exam?.skill || "READING";
  const taskMeta = detectAptisTaskMeta(
    skill,
    question.part.partNumber,
    partTitle || question.part.title,
    form.questionType || question.questionType
  );

  const handleSavePartContext = async () => {
    setSavingPart(true);
    setPartSavedMsg("");
    try {
      const res = await api.admin.updatePart(question.part.id, {
        title: partTitle.trim() || question.part.title,
        passage_text: partPassage.trim() || null,
        audio_url: partAudioUrl.trim() || null,
        image_url: partImageUrl.trim() || null,
      });
      if (res.success) {
        setPartSavedMsg("✓ Đã lưu ngữ cảnh / tranh / audio của Phần thi!");
        setEditingPartContext(false);
        if (onPartUpdated) onPartUpdated();
      }
    } catch {
      setPartSavedMsg("⚠️ Lỗi lưu ngữ cảnh Phần thi");
    } finally {
      setSavingPart(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-3xl w-full max-h-[94vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100"
      >
        {/* ── Modal Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0">
              <Edit2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Chỉnh sửa trực quan Câu hỏi #{question.questionNumber}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-heading font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {taskMeta.taskLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Thuộc đề: <strong className="text-slate-700 dark:text-slate-200">{question.part.exam.title}</strong> ({partTitle || question.part.title})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/admin/exams/${question.part.exam.id}/edit`}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 hover:text-blue-600 font-heading font-semibold text-xs flex items-center gap-1.5 transition-colors"
              title="Mở trang biên soạn toàn bộ đề thi"
            >
              <span>Mở toàn bộ đề</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Parent ExamPart Context Preview & Quick Editor ── */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading font-bold text-slate-800 dark:text-slate-200">
                📦 Ngữ cảnh Phần thi (ExamPart): {partTitle || question.part.title}
              </span>
              {partImageUrl && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                  <ImageIcon className="w-3 h-3" /> Đã gắn tranh
                </span>
              )}
              {partAudioUrl && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-bold">
                  <Volume2 className="w-3 h-3" /> Có Audio
                </span>
              )}
              {partPassage && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                  <FileText className="w-3 h-3" /> Có Bài đọc / Thông báo
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setEditingPartContext(!editingPartContext)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-400 font-heading font-bold text-[11px] hover:border-purple-400 transition-colors"
            >
              {editingPartContext
                ? "Đóng chỉnh sửa Ngữ cảnh Part"
                : "🖼️ Sửa Tranh / Audio / Bài đọc của Part này"}
            </button>
          </div>

          {partSavedMsg && (
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {partSavedMsg}
            </div>
          )}

          {!editingPartContext ? (
            <div className="space-y-2">
              {partAudioUrl && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <Volume2 className="w-4 h-4 text-sky-500 shrink-0" />
                  <audio controls src={partAudioUrl} className="h-8 flex-1" />
                </div>
              )}
              {partImageUrl && (
                <ExamPartImageGallery
                  imageUrl={partImageUrl}
                  title={partTitle}
                  variant="admin-preview"
                />
              )}
              {partPassage && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 max-h-28 overflow-y-auto text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-line">
                  {partPassage}
                </div>
              )}
              {!partAudioUrl && !partImageUrl && !partPassage && (
                <p className="text-[11px] text-slate-400 italic">
                  Phần thi này hiện chưa gắn Tranh minh họa, Audio hoặc Bài đọc chung.
                </p>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 space-y-3">
              <div>
                <label className="block font-bold text-[11px] text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề Phần thi (Part Title chuẩn)
                </label>
                <input
                  type="text"
                  value={partTitle}
                  onChange={(e) => setPartTitle(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                />
              </div>

              <PartMediaEditor
                partTitle={partTitle || question.part.title}
                skill={skill}
                partNumber={taskMeta.logicalPart}
                instructions=""
                passageText={partPassage}
                audioUrl={partAudioUrl}
                imageUrl={partImageUrl}
                onChange={(fields) => {
                  if (fields.passageText !== undefined) setPartPassage(fields.passageText);
                  if (fields.audioUrl !== undefined) setPartAudioUrl(fields.audioUrl);
                  if (fields.imageUrl !== undefined) setPartImageUrl(fields.imageUrl);
                }}
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPartContext(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={savingPart}
                  onClick={handleSavePartContext}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  {savingPart ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Lưu Ngữ cảnh Part</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Polymorphic Task-Aware Question Form ── */}
        <PolymorphicQuestionForm
          key={question.id}
          initialData={{
            question_number: form.questionNumber || question.questionNumber,
            prompt: form.prompt,
            question_type: form.questionType || question.questionType,
            options: form.options ?? question.options,
            correct_answer: form.correctAnswer || question.correctAnswer || "",
            explanation: form.explanation || question.explanation || "",
            max_score: form.maxScore || question.maxScore || 1,
          }}
          skill={skill}
          partNumber={question.part.partNumber}
          partTitle={partTitle || question.part.title}
          showQuestionNumber={true}
          saving={loading}
          onCancel={onClose}
          onSave={(polyData) => onSave(polyData)}
        />
      </div>
    </div>
  );
};
