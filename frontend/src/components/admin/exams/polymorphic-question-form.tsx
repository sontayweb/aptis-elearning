"use client";

import React, { useState } from "react";
import {
  Mic,
  ListOrdered,
  CheckCircle2,
  FileText,
  Plus,
  Trash2,
  Sparkles,
  Lock,
  ArrowUp,
  ArrowDown,
  Eye,
  Check,
  Wand2,
  Info,
  ClipboardPaste,
} from "lucide-react";
import { QUESTION_TYPES, detectAptisTaskMeta } from "./exam.types";

export interface PolymorphicQuestionData {
  question_number?: number;
  prompt: string;
  question_type: string;
  options: any;
  correct_answer: string;
  explanation: string;
  max_score: number;
}

interface PolymorphicQuestionFormProps {
  initialData: PolymorphicQuestionData;
  skill: string;
  partNumber?: number;
  partTitle?: string | null;
  onSave: (data: PolymorphicQuestionData) => void;
  onCancel: () => void;
  saving: boolean;
  isNew?: boolean;
  showQuestionNumber?: boolean;
}

export const PolymorphicQuestionForm: React.FC<PolymorphicQuestionFormProps> = ({
  initialData,
  skill,
  partNumber = 1,
  partTitle = null,
  onSave,
  onCancel,
  saving,
  isNew = false,
  showQuestionNumber = false,
}) => {
  const initialTaskMeta = detectAptisTaskMeta(
    skill,
    partNumber,
    partTitle,
    initialData.question_type
  );

  const defaultType = initialData.question_type || initialTaskMeta.defaultQuestionType;

  const [qType, setQType] = useState<string>(defaultType);
  const [questionNumber, setQuestionNumber] = useState<number>(
    initialData.question_number || 1
  );
  const [prompt, setPrompt] = useState<string>(initialData.prompt ?? "");
  const [maxScore, setMaxScore] = useState<number>(initialData.max_score || 1.0);
  const [explanation, setExplanation] = useState<string>(initialData.explanation ?? "");
  const [correctAnswer, setCorrectAnswer] = useState<string>(
    initialData.correct_answer ?? ""
  );

  const taskMeta = detectAptisTaskMeta(skill, partNumber, partTitle, qType);

  // Parse initial options for MULTIPLE_CHOICE / GAP_FILL / MATCHING
  const [optionsList, setOptionsList] = useState<string[]>(() => {
    if (Array.isArray(initialData.options) && initialData.options.length > 0) {
      return initialData.options.map((o: any) => String(o));
    }
    if (typeof initialData.options === "string") {
      try {
        const parsed = JSON.parse(initialData.options);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((o: any) => String(o));
        }
      } catch {}
    }
    if (defaultType === "GAP_FILL") return ["", "", ""];
    if (defaultType === "MATCHING") return ["A", "B", "C", "D"];
    return ["", "", ""];
  });

  // Parse initial ordered sentences for SENTENCE_ORDER (Supports both DB string[] and legacy object format)
  const [orderedSentences, setOrderedSentences] = useState<string[]>(() => {
    if (Array.isArray(initialData.options) && initialData.options.length > 0) {
      return initialData.options.map((s: any) => String(s));
    }
    if (typeof initialData.options === "string") {
      try {
        const parsed = JSON.parse(initialData.options);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: any) => String(s));
        }
      } catch {}
    }
    if (
      initialData.options &&
      typeof initialData.options === "object" &&
      !Array.isArray(initialData.options)
    ) {
      const fixed = initialData.options.fixedSentence
        ? [String(initialData.options.fixedSentence)]
        : [];
      const sList = Array.isArray(initialData.options.sentences)
        ? initialData.options.sentences
        : [];
      let orderIds: string[] = [];
      try {
        if (initialData.correct_answer) {
          const parsedOrder = JSON.parse(initialData.correct_answer);
          if (Array.isArray(parsedOrder)) orderIds = parsedOrder.map(String);
        }
      } catch {}
      const orderedRest =
        orderIds.length > 0
          ? orderIds
              .map((id) => sList.find((s: any) => s.id === id)?.text || id)
              .filter(Boolean)
          : sList.map((s: any) => String(s?.text || s || ""));
      const combined = [...fixed, ...orderedRest];
      if (combined.length > 0) return combined;
    }
    return ["", "", "", "", ""];
  });

  // Bulk paste helper state
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState("");

  // Option handlers (auto-sync correctAnswer when the currently selected option is edited)
  const handleSelectCorrectOption = (opt: string) => {
    setCorrectAnswer(opt);
  };

  const handleAddOption = () => {
    setOptionsList((prev) => [...prev, ""]);
  };

  const handleRemoveOption = (index: number) => {
    setOptionsList((prev) => {
      const removed = prev[index];
      const next = prev.filter((_, i) => i !== index);
      if (correctAnswer === removed) {
        setCorrectAnswer(next[0] || "");
      }
      return next;
    });
  };

  const handleOptionChange = (index: number, val: string) => {
    setOptionsList((prev) => {
      const oldVal = prev[index];
      const next = [...prev];
      next[index] = val;
      if (correctAnswer === oldVal && oldVal.trim() !== "") {
        setCorrectAnswer(val);
      }
      return next;
    });
  };

  const handleApplyOptionPreset = (presetOptions: string[]) => {
    setOptionsList([...presetOptions]);
    if (!presetOptions.includes(correctAnswer)) {
      setCorrectAnswer(presetOptions[0] || "");
    }
  };

  // Sentence Order handlers
  const handleSentenceChange = (index: number, val: string) => {
    setOrderedSentences((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleMoveSentence = (index: number, direction: "up" | "down") => {
    setOrderedSentences((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleAddSentence = () => {
    setOrderedSentences((prev) => [...prev, ""]);
  };

  const handleRemoveSentence = (index: number) => {
    if (orderedSentences.length <= 2) return;
    setOrderedSentences((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyBulkPaste = () => {
    const lines = bulkPasteText
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*(\d+[\.\)\-:]|[A-Ha-h][\.\)\-:])\s*/, "").trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    if (qType === "SENTENCE_ORDER") {
      setOrderedSentences(lines);
    } else {
      setOptionsList(lines);
      if (!lines.includes(correctAnswer)) {
        setCorrectAnswer(lines[0] || "");
      }
    }
    setBulkPasteText("");
    setShowBulkPaste(false);
  };

  const handleInsertGapToken = () => {
    if (prompt.includes("[gap]")) return;
    setPrompt((prev) => (prev.trim() ? `${prev.trim()} [gap]` : "The [gap] is very important."));
  };

  // Word counter for sample answers
  const explanationWordCount = explanation
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalOptions: any = null;
    let finalCorrectAnswer = correctAnswer;

    if (qType === "SENTENCE_ORDER") {
      const cleanedSentences = orderedSentences.map((s) => s.trim()).filter(Boolean);
      finalOptions = cleanedSentences;
      finalCorrectAnswer = JSON.stringify(cleanedSentences);
    } else if (
      qType === "MULTIPLE_CHOICE" ||
      qType === "GAP_FILL" ||
      qType === "MATCHING"
    ) {
      finalOptions = optionsList.map((s) => s.trim()).filter(Boolean);
      if (!finalCorrectAnswer && finalOptions.length > 0) {
        finalCorrectAnswer = finalOptions[0];
      }
    } else {
      finalOptions = null;
    }

    onSave({
      question_number: questionNumber,
      prompt: prompt.trim(),
      question_type: qType,
      options: finalOptions,
      correct_answer: finalCorrectAnswer.trim() || (undefined as any),
      explanation: explanation.trim() || (undefined as any),
      max_score: Number(maxScore),
    });
  };

  const lc =
    "block font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs";
  const ic =
    "w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-xs";

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-500/30 shadow-lg space-y-4 text-xs animate-in fade-in duration-200"
    >
      {/* ── Top Bar: Title + Question Type Selector ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            {isNew ? "+" : "✏️"}
          </div>
          <div>
            <span className="font-heading font-bold text-sm text-slate-900 dark:text-white block">
              {isNew
                ? "Thêm câu hỏi mới theo chuẩn Aptis"
                : `Chỉnh sửa Câu hỏi ${questionNumber ? `#${questionNumber}` : ""}`}
            </span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
              {taskMeta.taskLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showQuestionNumber && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Câu số:</span>
              <input
                type="number"
                min={1}
                value={questionNumber}
                onChange={(e) => setQuestionNumber(Number(e.target.value) || 1)}
                className="w-14 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-mono font-bold text-xs"
              />
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400">Dạng câu:</span>
            <select
              value={qType}
              onChange={(e) => setQType(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {QUESTION_TYPES.filter((t) => t.value !== "ALL").map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Task Architecture Guidance Banner ── */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-[11px] leading-relaxed">
          <p className="text-slate-700 dark:text-slate-200 font-medium">
            <strong className="font-heading text-slate-900 dark:text-white">
              Quy chuẩn hiển thị Client:
            </strong>{" "}
            {taskMeta.guideText}
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            📌 <strong>Ngữ cảnh Phần thi (ExamPart):</strong> {taskMeta.partContextRequirement}
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          DẠNG 1: SPEAKING_AUDIO (Speaking Part 1, 2, 3, 4)
         ══════════════════════════════════════════════════════════ */}
      {qType === "SPEAKING_AUDIO" && (
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <label className={lc}>
                {taskMeta.promptLabel} <span className="text-rose-500">*</span>
              </label>
              {taskMeta.quickPrompts && taskMeta.quickPrompts.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400">Điền nhanh:</span>
                  {taskMeta.quickPrompts.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(qp)}
                      className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-semibold hover:bg-rose-100"
                    >
                      + &ldquo;{qp}&rdquo;
                    </button>
                  ))}
                </div>
              )}
            </div>
            <textarea
              rows={2}
              className={ic + " resize-none text-sm font-medium"}
              placeholder={taskMeta.promptPlaceholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <label className={lc}>
                Bài nói mẫu chuẩn B1 / B2 / C (Sample Answer — lưu vào Explanation)
              </label>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold">
                  {explanationWordCount} từ (~{Math.max(5, Math.round(explanationWordCount / 2.2))}s nói)
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Hiển thị khi học viên bấm &ldquo;Hiện đáp án&rdquo;
                </span>
              </div>
            </div>
            <textarea
              rows={4}
              className={ic + " font-sans leading-relaxed"}
              placeholder="Nhập câu trả lời mẫu tiếng Anh (VD: Looking at this picture, I can see...)"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>

          {/* Live Preview Box like Student Speaking Room */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-rose-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Mô phỏng thẻ câu hỏi trên màn hình học viên:
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px]">
                {taskMeta.logicalPart === 1
                  ? "30s Ghi âm"
                  : taskMeta.logicalPart === 4
                  ? "60s Chuẩn bị · 120s Nói"
                  : "45s Ghi âm"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/90 border border-slate-700 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-100">
                {prompt || "(Chưa nhập nội dung câu hỏi Speaking)"}
              </p>
              <div className="w-9 h-9 rounded-full bg-rose-600/30 border border-rose-500 flex items-center justify-center text-rose-400 shrink-0">
                <Mic className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DẠNG 2: SENTENCE_ORDER (Reading Part 2 - Text Cohesion)
         ══════════════════════════════════════════════════════════ */}
      {qType === "SENTENCE_ORDER" && (
        <div className="space-y-4">
          <div>
            <label className={lc}>
              {taskMeta.promptLabel} <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              className={ic + " font-bold text-sm"}
              placeholder={taskMeta.promptPlaceholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
          </div>

          {/* Danh sách 5 câu theo ĐÚNG THỨ TỰ CHUẨN (Database Standard Array) */}
          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="font-heading font-bold text-xs text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-amber-600" />
                  Chuỗi câu theo ĐÚNG THỨ TỰ MẠCH LẠC (Từ Câu 1 → Câu {orderedSentences.length})
                </h4>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                  Nhập các câu theo đúng thứ tự đáp án chuẩn. Khi thi, <strong>Câu #1</strong> được ghim cố định làm câu mở đầu, còn <strong>Câu #2 → #{orderedSentences.length}</strong> sẽ tự động xáo trộn để học viên sắp xếp.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkPaste(!showBulkPaste)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1 hover:bg-amber-50"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Dán nhanh theo dòng</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddSentence}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm câu</span>
                </button>
              </div>
            </div>

            {showBulkPaste && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 space-y-2">
                <label className="block font-bold text-[11px] text-slate-700 dark:text-slate-300">
                  Dán 5 câu văn (mỗi câu 1 dòng theo đúng thứ tự chuẩn từ câu 1 đến câu 5):
                </label>
                <textarea
                  rows={5}
                  value={bulkPasteText}
                  onChange={(e) => setBulkPasteText(e.target.value)}
                  placeholder={"1. Câu mở đầu cố định...\n2. Câu tiếp theo số 2...\n3. Câu tiếp theo số 3...\n4. Câu tiếp theo số 4...\n5. Câu kết thúc số 5..."}
                  className={ic + " font-mono"}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkPaste(false)}
                    className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyBulkPaste}
                    className="px-3 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-bold"
                  >
                    Tách thành {bulkPasteText.split(/\r?\n/).filter((l) => l.trim()).length || 5} câu theo thứ tự
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {orderedSentences.map((sentence, idx) => {
                const isFirstFixed = idx === 0;
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                      isFirstFixed
                        ? "bg-amber-100/60 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] flex items-center gap-1 shrink-0 ${
                        isFirstFixed
                          ? "bg-amber-600 text-white"
                          : "bg-emerald-600 text-white"
                      }`}
                      title={
                        isFirstFixed
                          ? "Câu 1: Mở đầu cố định làm gốc trên bài thi"
                          : `Câu ${idx + 1}: Học viên phải kéo thả vào vị trí số ${idx + 1}`
                      }
                    >
                      {isFirstFixed ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Câu 1 (Gốc)</span>
                        </>
                      ) : (
                        <span>Thứ tự #{idx + 1}</span>
                      )}
                    </div>

                    <input
                      type="text"
                      value={sentence}
                      onChange={(e) => handleSentenceChange(idx, e.target.value)}
                      placeholder={
                        isFirstFixed
                          ? "Nhập câu số 1 (Câu mở đầu cố định làm mốc cho học viên)..."
                          : `Nhập câu đứng ở vị trí thứ ${idx + 1} trong đoạn văn...`
                      }
                      className="flex-1 bg-transparent border-none text-xs text-slate-900 dark:text-white focus:outline-none font-medium"
                      required
                    />

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveSentence(idx, "up")}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-25 text-slate-500"
                        title="Đổi lên vị trí phía trên"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === orderedSentences.length - 1}
                        onClick={() => handleMoveSentence(idx, "down")}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-25 text-slate-500"
                        title="Đổi xuống vị trí phía dưới"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      {orderedSentences.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSentence(idx)}
                          className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600"
                          title="Xóa câu này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className={lc}>Lời giải thích mạch lạc văn bản & Từ nối (Explanation)</label>
            <textarea
              rows={2}
              className={ic}
              placeholder="Giải thích dấu hiệu liên kết câu (First, Then, After that, Finally...) để học viên ôn tập..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DẠNG 3: GAP_FILL (Reading Part 1 - Điền từ vào chỗ trống [gap])
         ══════════════════════════════════════════════════════════ */}
      {qType === "GAP_FILL" && (
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <label className={lc}>
                {taskMeta.promptLabel} <span className="text-emerald-600">*</span>
              </label>
              <button
                type="button"
                onClick={handleInsertGapToken}
                className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold hover:bg-emerald-100 flex items-center gap-1"
              >
                <Wand2 className="w-3 h-3" />
                <span>+ Chèn ký hiệu [gap]</span>
              </button>
            </div>
            <textarea
              rows={2}
              className={ic + " resize-none text-sm font-medium"}
              placeholder={taskMeta.promptPlaceholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
          </div>

          {/* Interactive Gap Fill Preview */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              Xem trước hiển thị câu văn trên bài thi học viên:
            </span>
            <div className="text-sm text-slate-800 dark:text-slate-100 flex items-center flex-wrap gap-1.5 leading-relaxed">
              {prompt.includes("[gap]") ? (
                <>
                  <span>{prompt.split("[gap]")[0]}</span>
                  <span className="px-2.5 py-0.5 rounded-lg border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs shadow-2xs">
                    {correctAnswer || "— chọn từ —"} ▾
                  </span>
                  <span>{prompt.split("[gap]")[1]}</span>
                </>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs">
                  ⚠️ Câu văn chưa có ký hiệu [gap]. Hãy bấm nút &ldquo;+ Chèn ký hiệu [gap]&rdquo; ở trên để đặt ô chọn từ!
                </span>
              )}
            </div>
          </div>

          {/* Danh sách 3 từ lựa chọn */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={lc}>
                Các từ vựng lựa chọn (Click vào dấu tích tròn để đặt làm Đáp án đúng):
              </span>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm từ lựa chọn
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {optionsList.map((opt, idx) => {
                const isCorrect =
                  correctAnswer.trim() !== "" &&
                  opt.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                      isCorrect
                        ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectCorrectOption(opt)}
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isCorrect
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 dark:border-slate-600 hover:border-emerald-400 text-transparent"
                      }`}
                      title="Đặt từ này làm đáp án đúng"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>
                    <input
                      type="text"
                      className="flex-1 bg-transparent border-none text-xs text-slate-900 dark:text-white focus:outline-none font-bold"
                      placeholder={`Từ lựa chọn ${idx + 1}...`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                    />
                    {optionsList.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className={lc}>Lời giải thích từ vựng / ngữ pháp (Explanation)</label>
            <input
              type="text"
              className={ic}
              placeholder="Giải thích ngữ pháp / nghĩa của từ tại sao chọn đáp án này..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DẠNG 4: MATCHING (Reading Part 3 & 4 / Listening Part 2 & 3)
         ══════════════════════════════════════════════════════════ */}
      {qType === "MATCHING" && (
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <label className={lc}>
                {taskMeta.promptLabel} <span className="text-indigo-500">*</span>
              </label>
              {taskMeta.quickPrompts && taskMeta.quickPrompts.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {taskMeta.quickPrompts.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(qp)}
                      className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold hover:bg-indigo-100"
                    >
                      {qp}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <textarea
              rows={2}
              className={ic + " resize-none text-sm font-medium"}
              placeholder={taskMeta.promptPlaceholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
          </div>

          {/* Quick Option Presets & Bulk Paste */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={lc}>
                Danh sách Lựa chọn / Người nói / Tiêu đề Heading (Click chọn 1 Đáp án đúng):
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: "A / B / C / D", options: ["A", "B", "C", "D"] },
                  { label: "Person A–D", options: ["Person A", "Person B", "Person C", "Person D"] },
                  { label: "Man / Woman / Both", options: ["Man", "Woman", "Both"] },
                ].map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => handleApplyOptionPreset(preset.options)}
                    className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold hover:bg-indigo-100"
                    title="Áp dụng nhanh bộ lựa chọn chuẩn"
                  >
                    ⚡ {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowBulkPaste(!showBulkPaste)}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold flex items-center gap-1 hover:bg-slate-200"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>Dán nhiều dòng</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-700"
                >
                  <Plus className="w-3 h-3" /> Thêm lựa chọn
                </button>
              </div>
            </div>

            {showBulkPaste && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 space-y-2">
                <label className="block font-bold text-[11px] text-slate-700 dark:text-slate-300">
                  Dán danh sách lựa chọn / tiêu đề Heading (mỗi lựa chọn 1 dòng):
                </label>
                <textarea
                  rows={5}
                  value={bulkPasteText}
                  onChange={(e) => setBulkPasteText(e.target.value)}
                  placeholder={"Heading 1...\nHeading 2...\nHeading 3..."}
                  className={ic + " font-mono"}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkPaste(false)}
                    className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyBulkPaste}
                    className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-bold"
                  >
                    Áp dụng danh sách
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {optionsList.map((opt, idx) => {
                const isCorrect =
                  correctAnswer.trim() !== "" &&
                  opt.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                      isCorrect
                        ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectCorrectOption(opt)}
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isCorrect
                          ? "bg-indigo-600 border-indigo-700 text-white"
                          : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 text-transparent"
                      }`}
                      title="Đặt làm đáp án đúng"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>
                    <input
                      type="text"
                      className="flex-1 bg-transparent border-none text-xs text-slate-900 dark:text-white focus:outline-none font-semibold"
                      placeholder={`Lựa chọn ${idx + 1} (VD: A, Person A, Heading 1)...`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                    />
                    {isCorrect && (
                      <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold shrink-0">
                        ✓ Đáp án
                      </span>
                    )}
                    {optionsList.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className={lc}>Dẫn chứng trong bài đọc / bài nghe (Explanation)</label>
            <input
              type="text"
              className={ic}
              placeholder="Trích dẫn câu chứa thông tin đối chiếu trong đoạn văn / transcript..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DẠNG 5: ESSAY & SHORT_TEXT (Writing Part 1, 2, 3, 4)
         ══════════════════════════════════════════════════════════ */}
      {(qType === "ESSAY" || qType === "SHORT_TEXT") && (
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <label className={lc}>
                {taskMeta.promptLabel} <span className="text-purple-500">*</span>
              </label>
              {taskMeta.quickPrompts && taskMeta.quickPrompts.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400">Mẫu đề Email Part 4:</span>
                  {taskMeta.quickPrompts.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(qp)}
                      className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-bold hover:bg-purple-100"
                    >
                      + Email {idx + 1} ({idx === 0 ? "Thân mật 50 từ" : "Trang trọng 120-150 từ"})
                    </button>
                  ))}
                </div>
              )}
            </div>
            <textarea
              rows={3}
              className={ic + " resize-none text-sm font-medium"}
              placeholder={taskMeta.promptPlaceholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <label className={lc}>
                Bài viết mẫu chuẩn B2 / C (Model Answer — lưu vào Explanation)
              </label>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold">
                  {explanationWordCount} từ
                </span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Học viên đối chiếu & AI tham khảo chấm bài
                </span>
              </div>
            </div>
            <textarea
              rows={5}
              className={ic + " font-sans leading-relaxed"}
              placeholder="Nhập bài viết mẫu tiếng Anh chất lượng cao..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DẠNG 6: MULTIPLE_CHOICE (Listening Part 1, 2, 3, 4 / Grammar)
         ══════════════════════════════════════════════════════════ */}
      {qType === "MULTIPLE_CHOICE" && (
        <div className="space-y-4">
          <div>
            <label className={lc}>
              {taskMeta.promptLabel} <span className="text-blue-500">*</span>
            </label>
            <textarea
              rows={2}
              className={ic + " resize-none text-sm font-medium"}
              placeholder={taskMeta.promptPlaceholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
          </div>

          {/* Các lựa chọn trắc nghiệm */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={lc}>
                Các phương án lựa chọn (Click chữ cái A, B, C, D để đặt làm Đáp án đúng):
              </span>
              <div className="flex items-center gap-2">
                {skill === "LISTENING" && taskMeta.logicalPart === 3 && (
                  <button
                    type="button"
                    onClick={() => handleApplyOptionPreset(["Man", "Woman", "Both"])}
                    className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 text-[10px] font-bold"
                  >
                    ⚡ Chuẩn Man / Woman / Both
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-[11px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm phương án
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {optionsList.map((opt, idx) => {
                const labelLetter = String.fromCharCode(65 + idx);
                const isCorrect =
                  correctAnswer.trim() !== "" &&
                  (opt.trim().toLowerCase() === correctAnswer.trim().toLowerCase() ||
                    correctAnswer.trim() === labelLetter);
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all ${
                      isCorrect
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectCorrectOption(opt)}
                      className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                        isCorrect
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-100 hover:text-blue-600"
                      }`}
                      title="Đặt làm đáp án đúng"
                    >
                      {labelLetter}
                    </button>
                    <input
                      type="text"
                      className="flex-1 bg-transparent border-none text-xs text-slate-900 dark:text-white focus:outline-none font-medium"
                      placeholder={`Phương án ${labelLetter}...`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                    />
                    {isCorrect && (
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-bold shrink-0">
                        ✓ Đáp án đúng
                      </span>
                    )}
                    {optionsList.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className={lc}>Transcript câu này / Dịch nghĩa / Lời giải thích</label>
            <textarea
              rows={2}
              className={ic}
              placeholder="Giải thích tại sao đáp án này đúng hoặc trích dẫn câu trong bài nghe..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ── Meta Bottom Row ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold text-slate-500">Điểm tối đa:</label>
          <input
            type="number"
            step="0.5"
            min="0"
            className="w-20 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center font-bold text-xs"
            value={maxScore}
            onChange={(e) => setMaxScore(Number(e.target.value))}
          />
          <span className="text-[11px] text-slate-400">điểm</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>
              {saving ? "Đang lưu..." : isNew ? "Thêm câu hỏi" : "Lưu thay đổi câu hỏi"}
            </span>
          </button>
        </div>
      </div>
    </form>
  );
};
