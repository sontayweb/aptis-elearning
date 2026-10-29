with open('frontend/src/components/reading-components.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace handleReset conflict
old_reset = """  const handleReset = () => {
<<<<<<< HEAD
    if (isReviewMode) return;
    const empty = [null, null, null, null];
=======
    const empty = Array(totalSlotsCount).fill(null);
>>>>>>> cd85cc6 (fix(reading): standardize Part 1 keys and 2.0pt scoring, enable 5-sentence drag & drop for Part 2+3)
    notifyChange(empty);
  };"""

new_reset = """  const handleReset = () => {
    if (isReviewMode) return;
    const empty = Array(totalSlotsCount).fill(null);
    notifyChange(empty);
  };"""

# Replace slots map conflict
old_slots = """<<<<<<< HEAD
          {/* Slots 2, 3, 4, 5 */}
          {[0, 1, 2, 3].map((slotIdx) => {
            const slotNumber = slotIdx + 2;
            const placed = slots[slotIdx];
            const expectedId = correctOrder[slotIdx];
            const isCorrect = isReviewMode && placed && expectedId && placed.id === expectedId;
=======
          {/* Draggable Slots */}
          {slots.map((placed, slotIdx) => {
            const slotNumber = hasFixed ? slotIdx + 2 : slotIdx + 1;
>>>>>>> cd85cc6 (fix(reading): standardize Part 1 keys and 2.0pt scoring, enable 5-sentence drag & drop for Part 2+3)"""

new_slots = """          {/* Draggable Slots */}
          {slots.map((placed, slotIdx) => {
            const slotNumber = hasFixed ? slotIdx + 2 : slotIdx + 1;
            const expectedId = correctOrder[slotIdx];
            const isCorrect = isReviewMode && placed && expectedId && placed.id === expectedId;"""

# Replace card conflict
old_card = """<<<<<<< HEAD
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
                    title={isReviewMode ? undefined : "Bấm để gỡ câu này"}
=======
                    draggable
                    onDragStart={() => handleDragStart("slot", placed.id, slotIdx)}
                    onClick={() => handleRemoveFromSlot(slotIdx)}
                    className="flex-1 p-3.5 rounded-2xl border-2 border-primary/40 bg-exam-surface hover:border-red-500 shadow-sm flex items-start gap-2.5 cursor-pointer transition-all group"
                    title="Bấm để gỡ câu này về danh sách bên phải hoặc kéo thả đổi vị trí"
>>>>>>> cd85cc6 (fix(reading): standardize Part 1 keys and 2.0pt scoring, enable 5-sentence drag & drop for Part 2+3)"""

new_card = """                    draggable={!isReviewMode}
                    onDragStart={() => !isReviewMode && handleDragStart("slot", placed.id, slotIdx)}
                    onClick={() => !isReviewMode && handleRemoveFromSlot(slotIdx)}
                    className={`flex-1 p-3.5 rounded-2xl border-2 shadow-sm flex items-start gap-2.5 transition-all group ${
                      isReviewMode
                        ? isCorrect
                          ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20"
                          : "border-rose-500 bg-rose-50/30 dark:bg-rose-950/20"
                        : "border-primary/40 bg-exam-surface hover:border-red-500 cursor-pointer"
                    }`}
                    title={isReviewMode ? undefined : "Bấm để gỡ câu này về danh sách bên phải hoặc kéo thả đổi vị trí"}"""

# Replace empty slot text
old_empty = """<<<<<<< HEAD
                    <span>{isReviewMode ? "Chưa xếp câu vào vị trí này" : "Kéo câu vào đây hoặc bấm câu bên phải"}</span>
=======
                    <span>Kéo câu vào ô vị trí {slotNumber} hoặc bấm câu bên phải</span>
>>>>>>> cd85cc6 (fix(reading): standardize Part 1 keys and 2.0pt scoring, enable 5-sentence drag & drop for Part 2+3)"""

new_empty = """                    <span>{isReviewMode ? "Chưa xếp câu vào vị trí này" : `Kéo câu vào ô vị trí ${slotNumber} hoặc bấm câu bên phải`}</span>"""

# Replace right column pool & review answers
old_right = """<<<<<<< HEAD
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 text-xs text-foreground/80 leading-relaxed">
                <span className="font-bold text-primary mr-1.5">[1]</span>
                <span>{fixedSentence}</span>
              </div>

              {correctOrder.map((corId, cIdx) => {
                const sItem = sentences.find((s) => s.id === corId);
                if (!sItem) return null;
                return (
                  <div
                    key={corId}
                    className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20 text-xs text-foreground leading-relaxed flex items-start gap-2"
                  >
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                      [{cIdx + 2}]
                    </span>
                    <span className="font-medium">{sItem.text}</span>
                  </div>
                );
              })}
=======
          {unplacedSentences.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/5 text-center text-emerald-600 text-xs font-semibold">
              ✓ Đã xếp đủ cả {totalSlotsCount} câu vào các vị trí!
>>>>>>> cd85cc6 (fix(reading): standardize Part 1 keys and 2.0pt scoring, enable 5-sentence drag & drop for Part 2+3)"""

new_right = """              {hasFixed && (
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
              })}"""

# Normalize CRLF
content_norm = content.replace('\r\n', '\n')
for o, n in [
    (old_reset.replace('\r\n', '\n'), new_reset.replace('\r\n', '\n')),
    (old_slots.replace('\r\n', '\n'), new_slots.replace('\r\n', '\n')),
    (old_card.replace('\r\n', '\n'), new_card.replace('\r\n', '\n')),
    (old_empty.replace('\r\n', '\n'), new_empty.replace('\r\n', '\n')),
    (old_right.replace('\r\n', '\n'), new_right.replace('\r\n', '\n')),
]:
    if o in content_norm:
        content_norm = content_norm.replace(o, n)
        print("Replaced a chunk successfully.")
    else:
        print("Warning: chunk not found!")

# Also clean up unplacedSentences banner to show totalSlotsCount
content_norm = content_norm.replace(
    "✓ Đã xếp đủ 4 câu vào các vị trí 2, 3, 4, 5!",
    "✓ Đã xếp đủ cả {totalSlotsCount} câu vào các vị trí!"
)

with open('frontend/src/components/reading-components.tsx', 'w', encoding='utf-8') as f:
    f.write(content_norm)

print("Done writing resolved file.")
