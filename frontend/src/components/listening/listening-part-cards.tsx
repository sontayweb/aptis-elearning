"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import type {
  Part1Item,
  Part4Recording,
  ListeningExamData,
} from "@/components/listening/listening-types";

/** Huy hiệu Đúng / Sai hiển thị ở Review Mode. */
function CorrectBadge({ isCorrect }: { isCorrect: boolean }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shrink-0 ${
        isCorrect
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
          : "bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30"
      }`}
    >
      {isCorrect ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Đúng (+1)</span>
        </>
      ) : (
        <>
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Sai (0 đ)</span>
        </>
      )}
    </span>
  );
}

/** Danh sách đáp án A/B/C dùng chung cho Part 1 và Part 4. */
function MultipleChoiceOptions({
  options,
  correctAnswer,
  selected,
  isReviewMode,
  onSelect,
  compact = false,
}: {
  options: string[];
  correctAnswer: string;
  selected?: string;
  isReviewMode: boolean;
  onSelect: (opt: string) => void;
  /** Part 4 dùng kích thước nhỏ hơn Part 1. */
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      {options.map((opt, optIdx) => {
        const isSelected = selected === opt;
        const isCorrectAnswer = opt.toLowerCase() === correctAnswer.toLowerCase();

        let optionStyle = "border-border bg-background hover:border-primary/40 text-foreground";
        if (isReviewMode) {
          if (isCorrectAnswer) {
            optionStyle =
              "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs";
          } else if (isSelected && !isCorrectAnswer) {
            optionStyle =
              "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300 font-bold shadow-xs";
          } else {
            optionStyle = "border-border/60 bg-muted/20 text-muted-foreground opacity-75";
          }
        } else if (isSelected) {
          optionStyle = "border-primary bg-primary/10 text-primary font-bold shadow-sm";
        }

        return (
          <button
            key={optIdx}
            type="button"
            disabled={isReviewMode}
            onClick={() => onSelect(opt)}
            className={`w-full text-left ${compact ? "p-3.5" : "p-4"} rounded-xl border transition-all flex items-center justify-between ${optionStyle} ${
              isReviewMode ? "cursor-default" : "cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs ${
                  isReviewMode && isCorrectAnswer
                    ? "bg-emerald-500 text-white border-emerald-600"
                    : isReviewMode && isSelected && !isCorrectAnswer
                    ? "bg-red-500 text-white border-red-600"
                    : "bg-muted/40 border-border"
                }`}
              >
                {String.fromCharCode(65 + optIdx)}
              </span>
              <span className={`${compact ? "text-xs md:text-sm" : "text-sm md:text-base"} font-normal`}>
                {opt}
              </span>
            </div>
            {isReviewMode ? (
              isCorrectAnswer ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : isSelected ? (
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              ) : null
            ) : (
              isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================================
   PART 1: CÂU HỎI TRẮC NGHIỆM A, B, C
   ============================================================================ */
export function ListeningPart1Card({
  question,
  userChoice,
  isReviewMode,
  onAnswer,
}: {
  question: Part1Item | undefined;
  userChoice?: string;
  isReviewMode: boolean;
  onAnswer: (opt: string) => void;
}) {
  if (!question) return null;
  const q = question;
  const isCor = Boolean(userChoice && userChoice.toLowerCase() === q.correctAnswer.toLowerCase());

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
        <h3 className="text-sm md:text-base font-semibold text-foreground leading-relaxed">
          {q.prompt}
        </h3>
        {isReviewMode && <CorrectBadge isCorrect={isCor} />}
      </div>

      <MultipleChoiceOptions
        options={q.options}
        correctAnswer={q.correctAnswer}
        selected={userChoice}
        isReviewMode={isReviewMode}
        onSelect={onAnswer}
      />

      {/* Review Mode Explanation Box */}
      {isReviewMode && (
        <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/80 space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-muted-foreground">
              Bạn đã chọn:{" "}
              <strong className={isCor ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                {userChoice || "(Bỏ trống)"}
              </strong>
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Đáp án chuẩn: <strong>{q.correctAnswer}</strong>
            </span>
          </div>
          {q.explanation && (
            <div className="text-muted-foreground leading-relaxed pt-2 border-t border-border/50">
              <span className="font-bold text-foreground">Giải thích: </span>
              {q.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   PART 2: SPEAKERS NỐI THÔNG TIN BẰNG DROPDOWN
   ============================================================================ */
export function ListeningPart2Card({
  part2,
  answers,
  isReviewMode,
  onAnswer,
}: {
  part2: ListeningExamData["part2"];
  answers: Record<number, string>;
  isReviewMode: boolean;
  onAnswer: (idx: number, opt: string) => void;
}) {
  if (!part2.speakers || part2.speakers.length === 0) return null;

  // Lọc an toàn: Chỉ lấy các lựa chọn ngắn gọn chuẩn Aptis (tối đa 80 ký tự, không chứa xuống dòng/đoạn văn)
  const cleanOptions = (part2.options || [])
    .map((o) => (typeof o === "string" ? o.trim() : ""))
    .filter((o) => o.length > 0 && o.length <= 80 && !o.includes("\n"));

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
            Topic
          </span>
          <h3 className="text-base font-bold text-foreground">
            {part2.topic || "Matching Information"}
          </h3>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          Ghép thông tin tương ứng cho 4 người nói
        </span>
      </div>

      {/* Bảng danh sách tất cả các lựa chọn thông tin (UX preview trước & trong khi nghe) */}
      {cleanOptions.length > 0 && (
        <div className="p-4 rounded-xl bg-muted/30 border border-border/70 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <span>Danh sách thông tin lựa chọn ({cleanOptions.length} phương án)</span>
            </span>
            <span className="text-[11px] text-muted-foreground italic">
              {part2.speakers.length} người nói • Mỗi người chọn 1 ý • Có {Math.max(0, cleanOptions.length - part2.speakers.length)} ý nhiễu
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {cleanOptions.map((opt, oIdx) => {
              const assignedSpeakerIdx = Object.entries(answers).find(([_, val]) => val === opt)?.[0];
              const isAssigned = assignedSpeakerIdx !== undefined;
              const assignedSpeakerName = isAssigned
                ? part2.speakers[Number(assignedSpeakerIdx)]?.speaker || `Người ${Number(assignedSpeakerIdx) + 1}`
                : null;

              return (
                <div
                  key={oIdx}
                  className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all ${
                    isAssigned
                      ? "border-primary/40 bg-primary/10 text-primary font-medium"
                      : "border-border/60 bg-background text-foreground/90"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] shrink-0 ${
                        isAssigned ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="truncate" title={opt}>
                      {opt}
                    </span>
                  </div>
                  {isAssigned && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold shrink-0">
                      {assignedSpeakerName}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Danh sách 4 Speakers nối đáp án */}
      <div className="space-y-4">
        {part2.speakers.map((spk, idx) => {
          const userChoice = answers[idx];
          const isCor = Boolean(
            userChoice && spk.correctAnswer && userChoice.toLowerCase() === spk.correctAnswer.toLowerCase()
          );

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border bg-background flex flex-col gap-3 transition-colors ${
                isReviewMode
                  ? isCor
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-red-500/50 bg-red-500/5"
                  : "border-border hover:border-border/80"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm text-primary w-28 shrink-0">{spk.speaker}</span>
                  {isReviewMode && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        isCor
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                          : "bg-red-500/20 text-red-700 dark:text-red-300"
                      }`}
                    >
                      {isCor ? "Đúng (+1)" : "Sai (0 đ)"}
                    </span>
                  )}
                </div>

                <select
                  disabled={isReviewMode}
                  value={answers[idx] || ""}
                  onChange={(e) => onAnswer(idx, e.target.value)}
                  className="flex-1 p-2.5 rounded-lg border border-input bg-card text-foreground text-xs md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans cursor-pointer disabled:opacity-85 shadow-2xs"
                >
                  <option value="" className="bg-background text-foreground">
                    -- Chọn thông tin phù hợp --
                  </option>
                  {cleanOptions.map((opt, oIdx) => {
                    // Kiểm tra xem phương án này đã được người khác chọn chưa
                    const assignedSpeakerEntry = Object.entries(answers).find(
                      ([sIdx, val]) => Number(sIdx) !== idx && val === opt
                    );
                    const assignedToOtherName = assignedSpeakerEntry
                      ? part2.speakers[Number(assignedSpeakerEntry[0])]?.speaker || `Người ${Number(assignedSpeakerEntry[0]) + 1}`
                      : null;

                    return (
                      <option
                        key={oIdx}
                        value={opt}
                        className="bg-background text-foreground py-1"
                      >
                        {opt}
                        {assignedToOtherName ? ` (Đã chọn cho ${assignedToOtherName})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {isReviewMode && (
                <div className="text-xs space-y-2 pt-3 border-t border-border/50 text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>
                      Bạn chọn:{" "}
                      <strong className={isCor ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                        {userChoice || "(Chưa chọn)"}
                      </strong>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Đáp án chuẩn: <strong>{spk.correctAnswer}</strong>
                    </span>
                  </div>

                  {/* Trích đoạn audio của riêng người nói này nếu có */}
                  {spk.transcript && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-foreground/90 leading-relaxed font-sans">
                      <span className="font-bold text-primary mr-1">Trích dẫn audio ({spk.speaker}): </span>
                      <span className="italic">"{spk.transcript}"</span>
                    </div>
                  )}

                  {/* Giải thích chi tiết cho câu này */}
                  {(spk.speakerExplanation || spk.explanation) && (
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs text-foreground/80 leading-relaxed font-sans">
                      <span className="font-bold text-foreground mr-1">Giải thích: </span>
                      <span>{spk.speakerExplanation || spk.explanation}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   PART 3: NHẬN ĐỊNH CHỌN MAN / WOMAN / BOTH
   ============================================================================ */
export function ListeningPart3Card({
  part3,
  answers,
  isReviewMode,
  onAnswer,
}: {
  part3: ListeningExamData["part3"];
  answers: Record<number, "Man" | "Woman" | "Both">;
  isReviewMode: boolean;
  onAnswer: (idx: number, opt: "Man" | "Woman" | "Both") => void;
}) {
  if (!part3.opinions || part3.opinions.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
            Topic
          </span>
          <h3 className="text-base font-bold text-foreground">
            {part3.topic || "Short Conversations & Opinions"}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          🎙️ Đối thoại Man &amp; Woman
        </span>
      </div>

      <h4 className="text-xs md:text-sm font-semibold text-muted-foreground">
        Xác định ai là người đưa ra từng quan điểm dưới đây:
      </h4>

      <div className="space-y-4">
        {part3.opinions.map((op, idx) => {
          const userChoice = answers[idx];
          const isCor = Boolean(
            userChoice && op.correctAnswer && userChoice.toLowerCase() === op.correctAnswer.toLowerCase()
          );

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border bg-background flex flex-col gap-3 ${
                isReviewMode
                  ? isCor
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-red-500/50 bg-red-500/5"
                  : "border-border"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs md:text-sm text-foreground flex-1 leading-relaxed">
                  {op.statement}
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  {isReviewMode && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        isCor
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                          : "bg-red-500/20 text-red-700 dark:text-red-300"
                      }`}
                    >
                      {isCor ? "Đúng (+1)" : "Sai (0 đ)"}
                    </span>
                  )}

                  <select
                    disabled={isReviewMode}
                    value={answers[idx] || ""}
                    onChange={(e) => onAnswer(idx, e.target.value as "Man" | "Woman" | "Both")}
                    className="w-full sm:w-40 p-2.5 rounded-lg border border-input bg-card text-foreground text-xs md:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans cursor-pointer disabled:opacity-85"
                  >
                    <option value="">-- Chọn --</option>
                    <option value="Man">Man</option>
                    <option value="Woman">Woman</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>

              {isReviewMode && (
                <div className="text-xs space-y-1 pt-2 border-t border-border/50 text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>
                      Bạn chọn:{" "}
                      <strong className={isCor ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                        {userChoice || "(Chưa chọn)"}
                      </strong>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Đáp án chuẩn: <strong>{op.correctAnswer}</strong>
                    </span>
                  </div>
                  {op.explanation && <p className="italic text-[11px] pt-1">{op.explanation}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   PART 4: RECORDINGS MONOLOGUES (CÂU HỎI TRẮC NGHIỆM)
   ============================================================================ */
export function ListeningPart4Card({
  recording,
  recIdx,
  totalRecordings,
  answers,
  isReviewMode,
  onAnswer,
}: {
  recording: Part4Recording | undefined;
  recIdx: number;
  totalRecordings: number;
  answers: Record<string, string>;
  isReviewMode: boolean;
  onAnswer: (key: string, opt: string) => void;
}) {
  if (!recording || !recording.questions) return null;
  const rec = recording;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
            Topic
          </span>
          <h3 className="text-sm md:text-base font-bold text-foreground">
            {rec.title || `Monologue ${recIdx + 1}`}
          </h3>
        </div>
        <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
          Recording {recIdx + 1} of {totalRecordings}
        </span>
      </div>

      {rec.questions.map((q, qIdx) => {
        const answerKey = `${recIdx}_${qIdx}`;
        const selected = answers[answerKey];
        const isCor = Boolean(selected && selected.toLowerCase() === q.correctAnswer.toLowerCase());

        return (
          <div key={qIdx} className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
              <h3 className="text-sm md:text-base font-semibold text-foreground leading-relaxed">
                {q.prompt}
              </h3>
              {isReviewMode && <CorrectBadge isCorrect={isCor} />}
            </div>

            <MultipleChoiceOptions
              compact
              options={q.options}
              correctAnswer={q.correctAnswer}
              selected={selected}
              isReviewMode={isReviewMode}
              onSelect={(opt) => onAnswer(answerKey, opt)}
            />

            {isReviewMode && (
              <div className="mt-3 p-3.5 rounded-xl bg-muted/30 border border-border/80 space-y-1.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    Bạn đã chọn:{" "}
                    <strong className={isCor ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                      {selected || "(Bỏ trống)"}
                    </strong>
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Đáp án chuẩn: <strong>{q.correctAnswer}</strong>
                  </span>
                </div>
                {q.explanation && (
                  <div className="text-muted-foreground italic pt-1 border-t border-border/50">
                    {q.explanation}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
