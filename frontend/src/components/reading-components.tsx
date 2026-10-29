"use client";

import React, { useState, useEffect } from "react";
import { Check, X, GripVertical, ChevronUp, ChevronDown, RotateCcw, AlertCircle } from "lucide-react";

/* =========================================================
   1. GAP FILL COMPONENT (Part 1 - Ảnh 1 chuẩn aptiskytich.vn)
   ========================================================= */
export interface Part1GapItem {
  id: string;
  prompt: string;
  options: string[];
}

interface ReadingPart1StoryProps {
  exampleText?: {
    prefix: string;
    word: string;
    suffix: string;
  };
  gaps: Part1GapItem[];
  answers: Record<string, string>;
  onSelect: (questionId: string, val: string) => void;
}

export function ReadingPart1Story({
  exampleText,
  gaps = [],
  answers = {},
  onSelect,
}: ReadingPart1StoryProps) {
  const hasExample = Boolean(exampleText && exampleText.word);

  return (
    <div className="space-y-6 max-w-2xl py-2">
      <p className="text-sm font-bold text-exam-text">
        {hasExample
          ? "Choose the word that fits in the gap. The first one is done for you."
          : "Choose the word that fits in each gap."}
      </p>

      <div className="space-y-4 text-base font-normal text-exam-text leading-relaxed">
        {/* Câu ví dụ mẫu (Chỉ hiển thị khi đề thi thực sự có câu ví dụ) */}
        {hasExample && exampleText && (
          <div className="flex items-center gap-2 flex-wrap">
            <span>{exampleText.prefix}</span>
            <span className="px-3 py-1 rounded-md border border-exam-border bg-exam-bg/70 text-exam-text-muted font-medium text-sm select-none">
              {exampleText.word}
            </span>
            <span>{exampleText.suffix}</span>
          </div>
        )}

        {/* Các câu hỏi điền từ của Part 1 */}
        {gaps.map((gap) => {
          const parts = gap.prompt.split(/\[(?:gap|blank|\.\.\.)\]/i);
          const currentVal = answers[gap.id] || "";

          return (
            <div key={gap.id} className="flex items-center gap-2 flex-wrap">
              <span>{parts[0]}</span>
              <select
                value={currentVal}
                onChange={(e) => onSelect(gap.id, e.target.value)}
                className={`px-3 py-1 rounded-md border text-sm font-semibold transition-all cursor-pointer ${
                  currentVal
                    ? "border-primary bg-exam-surface text-exam-text"
                    : "border-exam-border bg-exam-surface text-exam-text-muted hover:border-primary/60"
                }`}
              >
                <option value="">—</option>
                {gap.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span>{parts[1] || ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Fallback component for single gap fill
export function ReadingGapFill({
  prompt,
  options = [],
  selectedValue = "",
  onSelect,
  questionNumber,
}: {
  prompt: string;
  options: string[];
  selectedValue?: string;
  onSelect: (val: string) => void;
  questionNumber?: number;
}) {
  const parts = prompt.split(/\[(?:gap|blank|\.\.\.)\]/i);

  return (
    <div className="p-5 rounded-2xl border border-exam-border bg-exam-bg/40 space-y-4">
      <div className="text-base text-exam-text font-medium leading-loose flex flex-wrap items-center gap-y-2">
        {questionNumber && (
          <span className="font-bold text-primary mr-2">{questionNumber}.</span>
        )}
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span>{part}</span>
            {index < parts.length - 1 && (
              <span className="inline-block mx-1.5 align-middle">
                <select
                  value={selectedValue}
                  onChange={(e) => onSelect(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border-2 border-primary/40 focus:border-primary bg-exam-surface text-exam-text font-bold text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  <option value="">—</option>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   2. SENTENCE ORDER / TEXT COHESION (Part 2 + 3 - Ảnh 1 chuẩn)
   ========================================================= */
interface SentenceItem {
  id: string;
  text: string;
}

interface SentenceOrderProps {
  fixedSentence?: string | null;
  title?: string;
  sentences: SentenceItem[];
  currentOrder?: string[]; // array of sentence IDs placed in slots
  onChangeOrder: (newOrder: string[]) => void;
  isReviewMode?: boolean;
  correctOrder?: string[];
}

export function ReadingSentenceOrder({
  fixedSentence,
  title,
  sentences = [],
  currentOrder = [],
  onChangeOrder,
  isReviewMode = false,
  correctOrder = [],
}: SentenceOrderProps) {
  // Loại trừ các text placeholder dummy như 'Sentence 1 is fixed here.'
  const isDummyFixed = Boolean(fixedSentence && /sentence 1 is fixed/i.test(fixedSentence));
  // Chỉ coi là có câu cố định nếu có nội dung thực tế VÀ số câu kéo thả <= 4
  const hasFixed = Boolean(fixedSentence && fixedSentence.trim() && !isDummyFixed && sentences.length <= 4);
  // Luôn đảm bảo số ô kéo thả bằng đúng số lượng câu cần xếp
  const totalSlotsCount = sentences.length > 0 ? sentences.length : (hasFixed ? 4 : 5);

  // target slots
  const [slots, setSlots] = useState<(SentenceItem | null)[]>(() =>
    Array(totalSlotsCount).fill(null)
  );

  // Synchronize state from currentOrder
  useEffect(() => {
    const map = new Map(sentences.map((s) => [s.id, s]));
    const newSlots: (SentenceItem | null)[] = Array(totalSlotsCount).fill(null);
    if (Array.isArray(currentOrder) && currentOrder.length > 0) {
      for (let i = 0; i < totalSlotsCount; i++) {
        if (currentOrder[i] && map.has(currentOrder[i])) {
          newSlots[i] = map.get(currentOrder[i])!;
        }
      }
    }
    setSlots((prev) => {
      if (prev.length !== newSlots.length) return newSlots;
      const isSame = prev.every((p, idx) => p?.id === newSlots[idx]?.id);
      return isSame ? prev : newSlots;
    });
  }, [sentences, currentOrder, totalSlotsCount]);

  // Unplaced sentences in the pool
  const placedIds = new Set(slots.filter(Boolean).map((s) => s!.id));
  const unplacedSentences = sentences.filter((s) => !placedIds.has(s.id));

  const notifyChange = (updatedSlots: (SentenceItem | null)[]) => {
    setSlots(updatedSlots);
    const orderIds = updatedSlots.map((s) => (s ? s.id : ""));
    onChangeOrder(orderIds);
  };

  // Place sentence from pool into first available slot
  const handleSelectFromPool = (item: SentenceItem) => {
    const nextEmptyIdx = slots.findIndex((s) => s === null);
    if (nextEmptyIdx !== -1) {
      const next = [...slots];
      next[nextEmptyIdx] = item;
      notifyChange(next);
    } else {
      // If full, replace last slot
      const next = [...slots];
      next[slots.length - 1] = item;
      notifyChange(next);
    }
  };

  // Remove sentence from a slot and return to pool
  const handleRemoveFromSlot = (slotIdx: number) => {
    const next = [...slots];
    next[slotIdx] = null;
    notifyChange(next);
  };

  // Drag and drop handlers
  const [draggedItem, setDraggedItem] = useState<{ source: "pool" | "slot"; id: string; slotIdx?: number } | null>(null);

  const handleDragStart = (source: "pool" | "slot", id: string, slotIdx?: number) => {
    setDraggedItem({ source, id, slotIdx });
  };

  const handleDropOnSlot = (targetSlotIdx: number) => {
    if (!draggedItem) return;
    const item = sentences.find((s) => s.id === draggedItem.id);
    if (!item) return;

    const next = [...slots];
    if (draggedItem.source === "slot" && draggedItem.slotIdx !== undefined) {
      // Swap or move from another slot
      const existingInTarget = next[targetSlotIdx];
      next[targetSlotIdx] = item;
      next[draggedItem.slotIdx] = existingInTarget;
    } else {
      // From pool into slot
      next[targetSlotIdx] = item;
    }
    notifyChange(next);
    setDraggedItem(null);
  };

  const handleReset = () => {
    if (isReviewMode) return;
    const empty = Array(totalSlotsCount).fill(null);
    notifyChange(empty);
  };

  return (
    <div className="space-y-4">
      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* =========================================
            LEFT COLUMN: Slots (1 to 5)
            ========================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-base font-extrabold text-exam-text">
              {title || "Text Cohesion"}
            </h3>
            {!isReviewMode && slots.some(Boolean) && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-xs text-exam-text-muted hover:text-primary transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Đặt lại ban đầu
              </button>
            )}
            {isReviewMode && (
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                Thứ tự bài làm của bạn
              </span>
            )}
          </div>

          {/* Slot 1: Fixed Sentence (Chỉ hiển thị nếu đề có câu cố định) */}
          {hasFixed && (
            <div className="flex items-start gap-3">
              <span className="w-6 pt-3 text-center text-sm font-semibold text-exam-text-muted select-none">
                1
              </span>
              <div className="flex-1 p-4 rounded-2xl border border-exam-border/80 bg-exam-bg/40 text-sm font-medium text-exam-text leading-relaxed select-none">
                {fixedSentence}
              </div>
            </div>
          )}

          {/* Draggable Slots */}
          {slots.map((placed, slotIdx) => {
            const slotNumber = hasFixed ? slotIdx + 2 : slotIdx + 1;
            const expectedId = correctOrder[slotIdx];
            const isCorrect = isReviewMode && placed && expectedId && placed.id === expectedId;

            return (
              <div
                key={slotIdx}
                className="flex items-start gap-3"
                onDragOver={(e) => !isReviewMode && e.preventDefault()}
                onDrop={() => !isReviewMode && handleDropOnSlot(slotIdx)}
              >
                <span className="w-6 pt-3 text-center text-sm font-semibold text-exam-text-muted select-none">
                  {slotNumber}
                </span>

                {placed ? (
                  /* Filled Slot Card */
                  <div
                    draggable={!isReviewMode}
                    onDragStart={() => !isReviewMode && handleDragStart("slot", placed.id, slotIdx)}
                    onClick={() => !isReviewMode && handleRemoveFromSlot(slotIdx)}
                    className={`flex-1 p-3.5 rounded-2xl border-2 shadow-sm flex items-start gap-2.5 transition-all group ${
                      isReviewMode
                        ? isCorrect
                          ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20"
                          : "border-rose-500 bg-rose-50/30 dark:bg-rose-950/20"
                        : "border-primary/40 bg-exam-surface hover:border-red-500 cursor-pointer"
                    }`}
                    title={isReviewMode ? undefined : "Bấm để gỡ câu này về danh sách bên phải hoặc kéo thả đổi vị trí"}
                  >
                    {!isReviewMode && (
                      <GripVertical className="w-4 h-4 text-primary shrink-0 mt-0.5 group-hover:text-red-500 transition-colors" />
                    )}
                    <p className="flex-1 text-sm text-exam-text font-medium leading-relaxed select-none">
                      {placed.text}
                    </p>
                    {isReviewMode ? (
                      isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 pt-0.5">
                          <Check className="w-3.5 h-3.5" /> Đúng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 shrink-0 pt-0.5">
                          <X className="w-3.5 h-3.5" /> Sai
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] text-exam-text-muted group-hover:text-red-500 transition-colors shrink-0 pt-0.5">
                        ✕ gỡ
                      </span>
                    )}
                  </div>
                ) : (
                  /* Empty Dashed Slot */
                  <div
                    onClick={() => {
                      if (!isReviewMode && unplacedSentences.length > 0) {
                        handleSelectFromPool(unplacedSentences[0]);
                      }
                    }}
                    className={`flex-1 min-h-[58px] rounded-2xl border-2 border-dashed flex items-center justify-center text-xs transition-all ${
                      isReviewMode
                        ? "border-rose-300 dark:border-rose-800 bg-rose-50/10 text-rose-500"
                        : "border-exam-border bg-exam-bg/20 hover:border-primary/60 hover:bg-exam-bg/40 text-exam-text-muted/60 cursor-pointer"
                    }`}
                  >
                    <span>{isReviewMode ? "Chưa xếp câu vào vị trí này" : `Kéo câu vào ô vị trí ${slotNumber} hoặc bấm câu bên phải`}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* =========================================
            RIGHT COLUMN: Available Pool or Review Answers
            ========================================= */}
        <div className="space-y-3 pt-6 lg:pt-8 lg:border-l lg:border-exam-border/40 lg:pl-6">
          {isReviewMode ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-sm font-bold text-foreground">
                  Đáp án chuẩn (Mạch văn hoàn chỉnh):
                </h4>
              </div>

              {hasFixed && (
                <div className="p-3.5 rounded-xl border border-border bg-muted/20 text-xs text-foreground/80 leading-relaxed">
                  <span className="font-bold text-primary mr-1.5">[1]</span>
                  <span>{fixedSentence}</span>
                </div>
              )}

              {correctOrder.map((corId, cIdx) => {
                const sItem = sentences.find((s) => s.id === corId);
                if (!sItem) return null;
                const num = hasFixed ? cIdx + 2 : cIdx + 1;
                return (
                  <div
                    key={corId}
                    className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20 text-xs text-foreground leading-relaxed flex items-start gap-2"
                  >
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                      [{num}]
                    </span>
                    <span className="font-medium">{sItem.text}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-exam-text-muted font-medium mb-1">
                <span>Danh sách các câu (bấm hoặc kéo sang trái):</span>
                <span>{unplacedSentences.length} câu còn lại</span>
              </div>

              {unplacedSentences.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/5 text-center text-emerald-600 text-xs font-semibold">
                  ✓ Đã xếp đủ cả {totalSlotsCount} câu vào các vị trí!
                </div>
              ) : (
                unplacedSentences.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart("pool", item.id)}
                    onClick={() => handleSelectFromPool(item)}
                    className="p-3.5 rounded-2xl border border-exam-border bg-exam-surface hover:border-primary hover:shadow-md shadow-sm flex items-start gap-2.5 cursor-pointer active:scale-[0.99] transition-all group"
                    title="Bấm để tự động điền vào ô trống tiếp theo hoặc kéo thả trực tiếp"
                  >
                    <GripVertical className="w-4 h-4 text-exam-text-muted/60 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                    <p className="flex-1 text-sm text-exam-text font-medium leading-relaxed select-none">
                      {item.text}
                    </p>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   3. OPINION MATCHING COMPONENT (Part 4 - Ảnh 1 & 2 chuẩn aptiskytich.vn)
   ========================================================= */
export interface OpinionMatchingQuestion {
  id: string;
  prompt: string;
  options: string[];
}

export interface ReviewPersonItem {
  id: string;
  text: string;
}

interface ReadingPart4Props {
  instructions?: string;
  reviewsText?: string;
  reviews?: ReviewPersonItem[];
  questions: OpinionMatchingQuestion[];
  answers: Record<string, string>;
  onSelect: (questionId: string, val: string) => void;
}

export function ReadingPart4OpinionMatching({
  instructions,
  reviewsText,
  reviews,
  questions = [],
  answers = {},
  onSelect,
}: ReadingPart4Props) {
  const defaultReviews: ReviewPersonItem[] = [
    {
      id: "A",
      text: "I'm not sure if I will return to this restaurant. I think the staff was arguing when I got there, because the atmosphere here was not very comfortable. As for the food, I think there's nothing to write about. I ordered fish and chips, it wasn't bad, but it wasn't good either. But many people say that the food here is fabulous. So, I think I'm an exception.",
    },
    {
      id: "B",
      text: "This is a very famous restaurant that I saw in the newspaper. Sadly, I arrived later than the rest of the party, so I didn't get to order dinner. However, I ordered orange juice and mango juice and they were both delicious. What about the surroundings? Lively music along with fashionable and appropriate decor makes me feel very comfortable.",
    },
    {
      id: "C",
      text: "I don't understand why this restaurant is so famous. When I arrived and saw a menu with lots of different dishes, I saw this as a bad sign. Furthermore, the menu with traditional dishes contrasting with the modern decoration style made me feel very confused and strange. The waiters here were also not friendly. This was one of my worst experiences eating at a restaurant.",
    },
    {
      id: "D",
      text: "This is my first time coming to this restaurant. The food is very cheap but the quality is excellent. I was very surprised with the starter because its menu is very diverse. But there is one thing that I want the restaurant to improve. The restaurant band played live music but it was very far away, so the sound was very low and it didn't make the meal atmosphere lively. Next time turn the music louder, please!",
    },
  ];

  let reviewList = reviews && reviews.length > 0 ? reviews : null;
  if (!reviewList && reviewsText) {
    const chunks = reviewsText
      .split(/(?=Person\s+[A-D]:)/i)
      .map((chunk) => {
        const match = chunk.match(/^Person\s+([A-D]):\s*([\s\S]*)$/i);
        if (match) {
          return {
            id: `Person ${match[1].toUpperCase()}`,
            text: match[2].trim(),
          };
        }
        return null;
      })
      .filter(Boolean) as ReviewPersonItem[];

    if (chunks.length > 0) {
      reviewList = chunks;
    }
  }
  if (!reviewList || reviewList.length === 0) {
    reviewList = defaultReviews;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      {/* Instructions */}
      <p className="text-sm font-bold text-exam-text leading-relaxed">
        {instructions ||
          "Four people write reviews of a new restaurant in their town on a website. Read the texts and then answer the questions below."}
      </p>

      {/* Review Box (Top) */}
      <div className="p-6 md:p-8 rounded-2xl border border-exam-border bg-exam-surface shadow-sm space-y-6">
        {reviewList.map((item) => (
          <div key={item.id} className="space-y-1.5">
            <h4 className="font-extrabold text-sm text-exam-text">
              {item.id}
            </h4>
            <p className="text-sm text-exam-text/90 leading-relaxed font-normal">
              {item.text}
            </p>
          </div>
        ))}
      </div>

      {/* Questions Box (Bottom) */}
      <div className="p-6 md:p-8 rounded-2xl border border-exam-border bg-exam-surface shadow-sm space-y-4">
        {questions.map((q, idx) => {
          const currentVal = answers[q.id] || "";
          const options =
            q.options && q.options.length > 0
              ? q.options
              : ["Person A", "Person B", "Person C", "Person D"];

          return (
            <div
              key={q.id}
              className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-exam-border/40 last:border-b-0"
            >
              <div className="flex-1 text-sm font-semibold text-exam-text">
                <span className="mr-1.5">{idx + 1}.</span>
                <span>{q.prompt.replace(/^\d+[\.\:\s]+/, "")}</span>
              </div>

              <div className="sm:w-44 shrink-0">
                <select
                  value={currentVal}
                  onChange={(e) => onSelect(q.id, e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
                    currentVal
                      ? "border-primary bg-exam-surface text-exam-text"
                      : "border-exam-border bg-exam-surface text-exam-text-muted hover:border-primary/60"
                  }`}
                >
                  <option value="">—</option>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   4. LONG READING / HEADING MATCHING COMPONENT (Part 5)
   ========================================================= */
export interface LongReadingParagraph {
  id: string;
  paragraphNumber: number;
  text: string;
  headingOptions: string[];
}

interface ReadingPart5Props {
  title?: string;
  instructions?: string;
  paragraphs: LongReadingParagraph[];
  answers: Record<string, string>;
  onSelect: (questionId: string, val: string) => void;
}

export function ReadingPart5LongReading({
  title = "Children and Exercises",
  instructions = "Read the passage quickly. Choose a heading for each numbered paragraph from the drop-down box.",
  paragraphs = [],
  answers = {},
  onSelect,
}: ReadingPart5Props) {
  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      {/* Instruction Box matching aptiskytich.vn Image 1 */}
      <div className="p-4 rounded-xl border border-exam-border/80 bg-exam-bg/40 text-sm font-semibold text-exam-text leading-relaxed">
        {instructions}
      </div>

      {/* Story Title */}
      <h2 className="text-2xl font-extrabold text-exam-text tracking-tight pt-2">
        {title}
      </h2>

      {/* 7 Paragraph Cards */}
      <div className="space-y-6">
        {paragraphs.map((p) => {
          const currentVal = answers[p.id] || "";

          return (
            <div
              key={p.id}
              className="p-6 md:p-8 rounded-2xl border border-exam-border bg-exam-surface shadow-sm space-y-4"
            >
              {/* Heading selector row */}
              <div className="flex items-center gap-3">
                <span className="font-bold text-base text-exam-text">
                  {p.paragraphNumber}.
                </span>
                <select
                  value={currentVal}
                  onChange={(e) => onSelect(p.id, e.target.value)}
                  className={`w-full max-w-md px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                    currentVal
                      ? "border-primary bg-exam-surface text-exam-text"
                      : "border-exam-border bg-exam-surface text-exam-text-muted hover:border-primary/60"
                  }`}
                >
                  <option value="">Choose a heading...</option>
                  {p.headingOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Paragraph text */}
              <p className="text-sm text-exam-text/90 leading-relaxed font-normal">
                {p.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Fallback single matching row
export function ReadingMatchingRow({
  prompt,
  options = [],
  selectedValue = "",
  onSelect,
  questionNumber,
  placeholder = "—",
}: {
  prompt: string;
  options: string[];
  selectedValue?: string;
  onSelect: (val: string) => void;
  questionNumber: number;
  placeholder?: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-exam-border bg-exam-surface hover:border-primary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <span className="font-extrabold text-primary text-sm shrink-0 mt-0.5">
          {questionNumber}.
        </span>
        <p className="text-sm font-semibold text-exam-text leading-relaxed">
          {prompt}
        </p>
      </div>

      <div className="w-full sm:w-44 shrink-0">
        <select
          value={selectedValue}
          onChange={(e) => onSelect(e.target.value)}
          className={`w-full px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
            selectedValue
              ? "border-primary bg-exam-surface text-exam-text"
              : "border-exam-border bg-exam-surface text-exam-text-muted hover:border-primary/60"
          }`}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
