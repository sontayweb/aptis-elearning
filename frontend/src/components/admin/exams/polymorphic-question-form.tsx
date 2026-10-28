"use client";

import React, { useState, useEffect } from "react";
import {
  Mic,
  ListOrdered,
  CheckCircle2,
  FileText,
  HelpCircle,
  Plus,
  Trash2,
  Sparkles,
  Lock,
  ArrowUp,
  ArrowDown,
  Eye,
  Check,
  Languages,
} from "lucide-react";
import { QUESTION_TYPES } from "./exam.types";

export interface PolymorphicQuestionData {
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
  onSave: (data: PolymorphicQuestionData) => void;
  onCancel: () => void;
  saving: boolean;
  isNew?: boolean;
}

export const PolymorphicQuestionForm: React.FC<PolymorphicQuestionFormProps> = ({
  initialData,
  skill,
  partNumber = 1,
  onSave,
  onCancel,
  saving,
  isNew = false,
}) => {
  // Determine appropriate default type based on skill if newly added
  const defaultType = initialData.question_type || (
    skill === "SPEAKING"
      ? "SPEAKING_AUDIO"
      : skill === "WRITING"
      ? (partNumber === 1 ? "SHORT_TEXT" : "ESSAY")
      : skill === "READING" && (partNumber === 2 || partNumber === 3)
      ? "SENTENCE_ORDER"
      : skill === "READING" && partNumber === 1
      ? "GAP_FILL"
      : skill === "READING" && (partNumber === 4 || partNumber === 5)
      ? "MATCHING"
      : "MULTIPLE_CHOICE"
  );

  const [qType, setQType] = useState<string>(defaultType);
  const [prompt, setPrompt] = useState<string>(initialData.prompt ?? "");
  const [maxScore, setMaxScore] = useState<number>(initialData.max_score || 1.0);
  const [explanation, setExplanation] = useState<string>(initialData.explanation ?? "");
  const [correctAnswer, setCorrectAnswer] = useState<string>(initialData.correct_answer ?? "");

  // Options states
  const [optionsList, setOptionsList] = useState<string[]>(() => {
    if (Array.isArray(initialData.options)) {
      return initialData.options.map(String);
    }
    return [""];
  });

  // State specific to SENTENCE_ORDER
  const [sentenceOrderData, setSentenceOrderData] = useState<{
    fixedSentence: string;
    sentences: { id: string; text: string }[];
    order: string[];
  }>(() => {
    if (
      initialData.options &&
      typeof initialData.options === "object" &&
      !Array.isArray(initialData.options)
    ) {
      const fixed = initialData.options.fixedSentence || "";
      const sList = Array.isArray(initialData.options.sentences) ? initialData.options.sentences : [];
      let parsedOrder: string[] = [];
      try {
        if (initialData.correct_answer) {
          parsedOrder = JSON.parse(initialData.correct_answer);
        }
      } catch {
        parsedOrder = sList.map((s: any) => s.id);
      }
      return {
        fixedSentence: fixed,
        sentences: sList.length > 0 ? sList : [
          { id: "s2", text: "" },
          { id: "s3", text: "" },
          { id: "s4", text: "" },
          { id: "s5", text: "" },
        ],
        order: Array.isArray(parsedOrder) && parsedOrder.length > 0 ? parsedOrder : sList.map((s: any) => s.id),
      };
    }
    return {
      fixedSentence: "",
      sentences: [
        { id: "s2", text: "" },
        { id: "s3", text: "" },
        { id: "s4", text: "" },
        { id: "s5", text: "" },
      ],
      order: ["s2", "s3", "s4", "s5"],
    };
  });

  // Keep correct answer in sync for simple options
  const handleSelectCorrectOption = (opt: string) => {
    setCorrectAnswer(opt);
  };

  const handleAddOption = () => {
    setOptionsList((prev) => [...prev, ""]);
  };

  const handleRemoveOption = (index: number) => {
    setOptionsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    setOptionsList((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  // SENTENCE ORDER Helpers
  const handleMoveSentenceInOrder = (index: number, direction: "up" | "down") => {
    setSentenceOrderData((prev) => {
      const order = [...prev.order];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= order.length) return prev;
      const temp = order[index];
      order[index] = order[targetIndex];
      order[targetIndex] = temp;
      return { ...prev, order };
    });
  };

  const handleSentenceTextChange = (id: string, text: string) => {
    setSentenceOrderData((prev) => ({
      ...prev,
      sentences: prev.sentences.map((s) => (s.id === id ? { ...s, text } : s)),
    }));
  };

  // On Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalOptions: any = null;
    let finalCorrectAnswer = correctAnswer;

    if (qType === "SENTENCE_ORDER") {
      finalOptions = {
        title: prompt.trim(),
        fixedSentence: sentenceOrderData.fixedSentence.trim(),
        sentences: sentenceOrderData.sentences.map((s) => ({ id: s.id, text: s.text.trim() })),
      };
      finalCorrectAnswer = JSON.stringify(sentenceOrderData.order);
    } else if (qType === "MULTIPLE_CHOICE" || qType === "GAP_FILL" || qType === "MATCHING") {
      finalOptions = optionsList.map((s) => s.trim()).filter(Boolean);
    } else {
      finalOptions = null;
    }

    onSave({
      prompt: prompt.trim(),
      question_type: qType,
      options: finalOptions,
      correct_answer: finalCorrectAnswer.trim() || undefined as any,
      explanation: explanation.trim() || undefined as any,
      max_score: Number(maxScore),
    });
  };

  const lc = "block font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs";
  const ic = "w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-xs";

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-500/30 shadow-lg space-y-4 text-xs animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            {isNew ? "+" : "✏️"}
          </div>
          <span className="font-heading font-bold text-sm text-slate-900 dark:text-white">
            {isNew ? "Thêm câu hỏi mới theo định dạng Aptis" : "Chỉnh sửa chi tiết câu hỏi"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400">Định dạng câu hỏi:</span>
          <select
            value={qType}
            onChange={(e) => setQType(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {QUESTION_TYPES.filter((t) => t.value !== "ALL").map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          DẠNG 1: SPEAKING_AUDIO (Nói Aptis Part 1, 2, 3, 4)
         ────────────────────────────────────────────────────────── */}
      {qType === "SPEAKING_AUDIO" && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-rose-950 dark:text-rose-200 text-xs">
                Dạng câu hỏi Nói (Speaking Audio)
              </h4>
              <p className="text-[11px] text-rose-700 dark:text-rose-400">
                Học viên sẽ nghe/đọc đề bài và bấm Mic ghi âm trực tiếp. Không có trắc nghiệm A, B, C, D.
              </p>
            </div>
          </div>

          <div>
            <label className={lc}>
              Nội dung câu hỏi Nói (Prompt) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              className={ic + " resize-none text-sm font-medium"}
              placeholder="VD: Describe the picture. Hoặc: What types of people live in these places?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={lc}>
                Câu trả lời mẫu / Gợi ý chuẩn B1 - B2 - C (Sample Answer / Explanation)
              </label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Hiển thị khi học viên xem đáp án & làm bài thi
              </span>
            </div>
            <textarea
              rows={4}
              className={ic + " font-sans leading-relaxed resize-none"}
              placeholder="Nhập câu trả lời mẫu tiếng Anh (In the first picture, I can see...)"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>

          {/* Live Preview Box like Student Speaking Room */}
          <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-rose-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Mô phỏng hiển thị trên màn hình học viên:
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px]">
                30s Prep · 45s Speak
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700">
              <p className="text-sm font-semibold text-slate-100">{prompt || "(Chưa có nội dung câu hỏi)"}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-600/30 border border-rose-500 flex items-center justify-center text-rose-400 animate-pulse">
                <Mic className="w-5 h-5" />
              </div>
              <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden flex items-center px-1 gap-1">
                <span className="w-1.5 h-2 bg-rose-500 rounded-full animate-bounce" />
                <span className="w-1.5 h-2.5 bg-rose-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="text-[10px] text-slate-400 font-mono ml-2">Mic sẵn sàng thu âm</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          DẠNG 2: SENTENCE_ORDER (Sắp xếp đoạn văn / Text Cohesion)
         ────────────────────────────────────────────────────────── */}
      {qType === "SENTENCE_ORDER" && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <ListOrdered className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 dark:text-amber-200 text-xs">
                Dạng Sắp xếp câu (Reading Part 2 + 3 - Text Cohesion)
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Gồm 1 câu mở đầu cố định (Sentence 1) và 4 câu xáo trộn học viên phải kéo thả theo thứ tự chuẩn xác.
              </p>
            </div>
          </div>

          <div>
            <label className={lc}>
              Tiêu đề câu chuyện (Story Title) <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              className={ic + " font-bold"}
              placeholder="VD: Eating at a cafe / End-of-term project"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
          </div>

          {/* Câu cố định mở đầu */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-xs">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Câu mở đầu cố định (Tùy chọn - nếu để trống sẽ là bài sắp xếp cả 5 câu):</span>
            </div>
            <textarea
              rows={2}
              className={ic + " resize-none font-medium bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60"}
              placeholder="VD: Để trống nếu muốn cả 5 câu đều kéo thả tự do."
              value={sentenceOrderData.fixedSentence}
              onChange={(e) =>
                setSentenceOrderData({ ...sentenceOrderData, fixedSentence: e.target.value })
              }
            />
          </div>

          {/* 4 câu xáo trộn */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={lc}>
                Danh sách 4 câu xáo trộn (Chỉnh sửa nội dung từng câu):
              </span>
            </div>
            <div className="space-y-2">
              {sentenceOrderData.sentences.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {s.id}
                  </span>
                  <input
                    type="text"
                    className={ic}
                    placeholder={`Nội dung câu ${s.id}...`}
                    value={s.text}
                    onChange={(e) => handleSentenceTextChange(s.id, e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bảng thiết lập thứ tự đúng (Correct Order Sequence) */}
          <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Thứ tự chuẩn (Đáp án chấm điểm Aptis):
              </span>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                Đáp án: [{sentenceOrderData.order.join(", ")}]
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="p-2 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 text-slate-500 font-medium text-[11px] flex items-center gap-2 select-none">
                <span className="w-5 h-5 rounded bg-slate-400 text-white font-bold text-[10px] flex items-center justify-center">
                  1
                </span>
                <span className="truncate">{sentenceOrderData.fixedSentence || "(Câu mở đầu cố định)"}</span>
                <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-slate-400">Cố định</span>
              </div>
              {sentenceOrderData.order.map((sid, oIdx) => {
                const sObj = sentenceOrderData.sentences.find((s) => s.id === sid);
                return (
                  <div
                    key={sid}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-slate-800 dark:text-slate-200 text-[11px] flex items-center gap-2 shadow-2xs"
                  >
                    <span className="w-5 h-5 rounded bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      {oIdx + 2}
                    </span>
                    <span className="w-6 font-mono font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                      [{sid}]
                    </span>
                    <span className="flex-1 truncate">{sObj?.text || "(Chưa có nội dung)"}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={oIdx === 0}
                        onClick={() => handleMoveSentenceInOrder(oIdx, "up")}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-500"
                        title="Đẩy lên trước"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={oIdx === sentenceOrderData.order.length - 1}
                        onClick={() => handleMoveSentenceInOrder(oIdx, "down")}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-500"
                        title="Đẩy xuống sau"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className={lc}>Lời giải thích mạch lạc văn bản (Explanation)</label>
            <input
              type="text"
              className={ic}
              placeholder="Giải thích vì sao thứ tự này là chuẩn ngữ pháp & mạch lạc văn bản..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          DẠNG 3: GAP_FILL (Điền từ vào chỗ trống - Reading Part 1)
         ────────────────────────────────────────────────────────── */}
      {qType === "GAP_FILL" && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-950 dark:text-emerald-200 text-xs">
                Dạng Điền từ vào chỗ trống (Reading Part 1 - Gap Fill)
              </h4>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Sử dụng ký hiệu <code className="bg-emerald-200 dark:bg-emerald-900 px-1 rounded font-bold">[gap]</code> để đánh dấu vị trí từ cần điền.
              </p>
            </div>
          </div>

          <div>
            <label className={lc}>
              Nội dung câu chứa [gap] <span className="text-emerald-600">*</span>
            </label>
            <textarea
              rows={2}
              className={ic + " resize-none text-sm"}
              placeholder="VD: Everyone is [gap]. My flat is near university..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
          </div>

          {/* Interactive Gap Fill Preview */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Xem trước hiển thị câu văn:
            </span>
            <div className="text-sm text-slate-800 dark:text-slate-100 flex items-center flex-wrap gap-2 leading-relaxed">
              {prompt.includes("[gap]") ? (
                <>
                  <span>{prompt.split("[gap]")[0]}</span>
                  <span className="px-2.5 py-1 rounded-md border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                    {correctAnswer || "— chọn từ —"}
                  </span>
                  <span>{prompt.split("[gap]")[1]}</span>
                </>
              ) : (
                <span className="italic text-slate-400">
                  Hãy thêm ký tự [gap] vào câu văn ở trên để hiển thị ô điền từ!
                </span>
              )}
            </div>
          </div>

          {/* Danh sách từ lựa chọn */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={lc}>Các lựa chọn từ vựng & Click để chọn đáp án đúng:</span>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm lựa chọn
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {optionsList.map((opt, idx) => {
                const isCorrect = correctAnswer === opt && opt.trim().length > 0;
                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                      isCorrect
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectCorrectOption(opt)}
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isCorrect
                          ? "bg-emerald-500 border-emerald-600 text-white"
                          : "border-slate-300 dark:border-slate-600 hover:border-emerald-400 text-transparent"
                      }`}
                      title="Đặt làm đáp án đúng"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>
                    <input
                      type="text"
                      className="flex-1 bg-transparent border-none text-xs text-slate-900 dark:text-white focus:outline-none font-semibold"
                      placeholder={`Từ ${idx + 1}...`}
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
            <label className={lc}>Lời giải thích (Explanation)</label>
            <input
              type="text"
              className={ic}
              placeholder="Giải thích ngữ pháp / từ vựng tại sao chọn từ này..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          DẠNG 4: MATCHING (Nối thông tin - Reading Part 4 & 5)
         ────────────────────────────────────────────────────────── */}
      {qType === "MATCHING" && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-indigo-950 dark:text-indigo-200 text-xs">
                Dạng Nối thông tin (Reading Part 4 - Quan điểm / Part 5 - Tiêu đề)
              </h4>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-400">
                Khớp câu nhận định với Người tương ứng (Person A, B, C, D) hoặc nối Đoạn văn với Tiêu đề phù hợp.
              </p>
            </div>
          </div>

          <div>
            <label className={lc}>
              Câu nhận định / Đoạn văn cần ghép (Prompt) <span className="text-indigo-500">*</span>
            </label>
            <textarea
              rows={2}
              className={ic + " resize-none text-sm"}
              placeholder="VD: Who thinks going to the beach is the best holiday? Hoặc: Paragraph 1: Some researchers argue..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
          </div>

          {/* Danh sách lựa chọn khớp */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={lc}>
                Danh sách Người / Tiêu đề lựa chọn (Chọn 1 đáp án đúng):
              </span>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm lựa chọn
              </button>
            </div>
            <div className="space-y-2">
              {optionsList.map((opt, idx) => {
                const isCorrect = correctAnswer === opt && opt.trim().length > 0;
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all ${
                      isCorrect
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40"
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
                      placeholder={`Lựa chọn ${idx + 1} (VD: Person A, Heading 1)...`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                    />
                    {isCorrect && (
                      <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                        Đáp án đúng
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
            <label className={lc}>Dẫn chứng trong bài đọc / Lời giải thích (Explanation)</label>
            <input
              type="text"
              className={ic}
              placeholder="Trích dẫn câu chứa thông tin đối chiếu trong đoạn văn..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          DẠNG 5: ESSAY & SHORT_TEXT (Tự luận / Email Writing)
         ────────────────────────────────────────────────────────── */}
      {(qType === "ESSAY" || qType === "SHORT_TEXT") && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-purple-950 dark:text-purple-200 text-xs">
                Dạng Viết tự luận ({qType === "SHORT_TEXT" ? "Trả lời ngắn Part 1" : "Writing Part 2, 3, 4"})
              </h4>
              <p className="text-[11px] text-purple-700 dark:text-purple-400">
                {qType === "SHORT_TEXT"
                  ? "Part 1: 5 tin nhắn nhanh (1 - 5 từ mỗi câu)."
                  : "Part 2 (20-30 từ), Part 3 (30-40 từ), Part 4 (50 từ & 120-150 từ)."}
              </p>
            </div>
          </div>

          <div>
            <label className={lc}>
              Đề bài / Tình huống / Yêu cầu viết <span className="text-purple-500">*</span>
            </label>
            <textarea
              rows={3}
              className={ic + " resize-none text-sm"}
              placeholder="VD: Write an email to the club president explaining why you missed the meeting (120-150 words)..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={lc}>Bài viết mẫu chuẩn CEFR (Model Answer / Explanation)</label>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Học viên đối chiếu sau khi nộp bài
              </span>
            </div>
            <textarea
              rows={5}
              className={ic + " font-sans leading-relaxed resize-none"}
              placeholder="Nhập bài viết mẫu tiếng Anh chất lượng cao..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          DẠNG 6: MULTIPLE_CHOICE (Trắc nghiệm chuẩn - Listening / Grammar)
         ────────────────────────────────────────────────────────── */}
      {qType === "MULTIPLE_CHOICE" && (
        <div className="space-y-4">
          <div>
            <label className={lc}>
              Nội dung câu hỏi <span className="text-blue-500">*</span>
            </label>
            <textarea
              rows={2}
              className={ic + " resize-none text-sm font-medium"}
              placeholder="Nhập nội dung câu hỏi trắc nghiệm..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
          </div>

          {/* Các lựa chọn trắc nghiệm */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={lc}>Các đáp án lựa chọn & Click để chọn đáp án đúng:</span>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm lựa chọn
              </button>
            </div>
            <div className="space-y-2">
              {optionsList.map((opt, idx) => {
                const labelLetter = String.fromCharCode(65 + idx); // A, B, C, D
                const isCorrect = correctAnswer === opt && opt.trim().length > 0;
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all ${
                      isCorrect
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40"
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
                      placeholder={`Lựa chọn ${labelLetter}...`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                    />
                    {isCorrect && (
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
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
            <label className={lc}>Transcript / Dịch nghĩa / Lời giải thích</label>
            <input
              type="text"
              className={ic}
              placeholder="Giải thích câu trả lời đúng hoặc transcript bài nghe..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Meta bottom row */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold text-slate-500">Điểm tối đa:</label>
          <input
            type="number"
            step="0.5"
            className="w-20 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-center font-bold text-xs"
            value={maxScore}
            onChange={(e) => setMaxScore(Number(e.target.value))}
          />
          <span className="text-[11px] text-slate-400">điểm</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{saving ? "Đang lưu..." : isNew ? "Thêm câu hỏi" : "Lưu câu hỏi"}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
