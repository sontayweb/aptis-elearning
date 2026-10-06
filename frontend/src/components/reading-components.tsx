"use client";

import React, { useState, useEffect } from "react";
import { Check, GripVertical, ChevronUp, ChevronDown, RotateCcw, AlertCircle } from "lucide-react";

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
  // Mặc định câu ví dụ chuẩn Aptis nếu không có
  const example = exampleText || {
    prefix: "I",
    word: "live",
    suffix: "in a flat.",
  };

  return (
    <div className="space-y-6 max-w-2xl py-2">
      <p className="text-sm font-bold text-exam-text">
        Choose the word that fits in the gap. The first one is done for you.
      </p>

      <div className="space-y-4 text-base font-normal text-exam-text leading-relaxed">
        {/* Câu ví dụ mẫu (Cố định - Done for you) */}
        <div className="flex items-center gap-2 flex-wrap">
          <span>{example.prefix}</span>
          <span className="px-3 py-1 rounded-md border border-exam-border bg-exam-bg/70 text-exam-text-muted font-medium text-sm select-none">
            {example.word}
          </span>
          <span>{example.suffix}</span>
        </div>

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
  fixedSentence?: string;
  title?: string;
  sentences: SentenceItem[];
  currentOrder?: string[]; // array of sentence IDs placed in slots 2, 3, 4, 5
  onChangeOrder: (newOrder: string[]) => void;
}

export function ReadingSentenceOrder({
  fixedSentence,
  title,
  sentences = [],
  currentOrder = [],
  onChangeOrder,
}: SentenceOrderProps) {
  // 4 target slots for positions 2, 3, 4, 5
  const [slots, setSlots] = useState<(SentenceItem | null)[]>([null, null, null, null]);

  // Synchronize state from currentOrder
  useEffect(() => {
    if (Array.isArray(currentOrder) && currentOrder.length > 0) {
      const map = new Map(sentences.map((s) => [s.id, s]));
      const newSlots: (SentenceItem | null)[] = [null, null, null, null];
      for (let i = 0; i < 4; i++) {
        if (currentOrder[i] && map.has(currentOrder[i])) {
          newSlots[i] = map.get(currentOrder[i])!;
        }
      }
      setSlots(newSlots);
    }
  }, [sentences]);

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
      next[3] = item;
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
    const empty = [null, null, null, null];
    notifyChange(empty);
  };

  return (
    <div className="space-y-4">
      {/* 2-Column Grid matching aptiskytich.vn */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* =========================================
            LEFT COLUMN: Slots 1 (Fixed) + Slots 2 - 5
            ========================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-base font-extrabold text-exam-text">
              {title || "Text Cohesion"}
            </h3>
            {slots.some(Boolean) && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-xs text-exam-text-muted hover:text-primary transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Đặt lại ban đầu
              </button>
            )}
          </div>

          {/* Slot 1: Fixed Sentence (Cố định) */}
          <div className="flex items-start gap-3">
            <span className="w-6 pt-3 text-center text-sm font-semibold text-exam-text-muted select-none">
              1
            </span>
            <div className="flex-1 p-4 rounded-2xl border border-exam-border/80 bg-exam-bg/40 text-sm font-medium text-exam-text leading-relaxed select-none">
              {fixedSentence || "Sentence 1 is fixed here."}
            </div>
          </div>

          {/* Slots 2, 3, 4, 5 */}
          {[0, 1, 2, 3].map((slotIdx) => {
            const slotNumber = slotIdx + 2;
            const placed = slots[slotIdx];

            return (
              <div
                key={slotIdx}
                className="flex items-start gap-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnSlot(slotIdx)}
              >
                <span className="w-6 pt-3 text-center text-sm font-semibold text-exam-text-muted select-none">
                  {slotNumber}
                </span>

                {placed ? (
                  /* Filled Slot Card */
                  <div
                    draggable
                    onDragStart={() => handleDragStart("slot", placed.id, slotIdx)}
                    onClick={() => handleRemoveFromSlot(slotIdx)}
                    className="flex-1 p-3.5 rounded-2xl border-2 border-primary/40 bg-exam-surface hover:border-red-500 shadow-sm flex items-start gap-2.5 cursor-pointer transition-all group"
                    title="Bấm để đưa câu này trở lại danh sách bên phải hoặc kéo thả để đổi vị trí"
                  >
                    <GripVertical className="w-4 h-4 text-primary shrink-0 mt-0.5 group-hover:text-red-500 transition-colors" />
                    <p className="flex-1 text-sm text-exam-text font-medium leading-relaxed select-none">
                      {placed.text}
                    </p>
                    <span className="text-[10px] text-exam-text-muted group-hover:text-red-500 transition-colors shrink-0 pt-0.5">
                      ✕ gỡ
                    </span>
                  </div>
                ) : (
                  /* Empty Dashed Slot */
                  <div
                    onClick={() => {
                      if (unplacedSentences.length > 0) {
                        handleSelectFromPool(unplacedSentences[0]);
                      }
                    }}
                    className="flex-1 min-h-[58px] rounded-2xl border-2 border-dashed border-exam-border bg-exam-bg/20 hover:border-primary/60 hover:bg-exam-bg/40 flex items-center justify-center text-xs text-exam-text-muted/60 transition-all cursor-pointer"
                  >
                    <span>Kéo câu vào đây hoặc bấm câu bên phải</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* =========================================
            RIGHT COLUMN: Available Sentences Pool
            ========================================= */}
        <div className="space-y-3 pt-6 lg:pt-8 lg:border-l lg:border-exam-border/40 lg:pl-6">
          <div className="flex items-center justify-between text-xs text-exam-text-muted font-medium mb-1">
            <span>Danh sách các câu (bấm hoặc kéo sang trái):</span>
            <span>{unplacedSentences.length} câu còn lại</span>
          </div>

          {unplacedSentences.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/5 text-center text-emerald-600 text-xs font-semibold">
              ✓ Đã xếp đủ 4 câu vào các vị trí 2, 3, 4, 5!
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
