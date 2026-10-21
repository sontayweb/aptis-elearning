import re

with open('frontend/src/app/reading/marathon/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add imports
content = content.replace(
    'import {\n  READING_PART2_TOPICS,\n  READING_PART3_TOPICS,\n  READING_PART4_TOPICS,\n} from "@/data/reading-topics-bank";',
    'import {\n  READING_PART2_TOPICS,\n  READING_PART3_TOPICS,\n  READING_PART4_TOPICS,\n} from "@/data/reading-topics-bank";\nimport { READING_PART2_BANK } from "@/data/reading-part2-bank";\nimport { READING_PART3_BANK } from "@/data/reading-part3-bank";'
)

# 2. Replace PART2_COHESION_DEMO initialization
old_init = '''  // Part 2 Cohesion order state
  const [cohesionOrder, setCohesionOrder] = useState<Record<number, string[]>>(() => {
    const initial: Record<number, string[]> = {};
    PART2_COHESION_DEMO.forEach((demo) => {
      // Shuffle sentences for practice
      initial[demo.id] = [...demo.correctOrder].sort(() => 0.5 - Math.random());
    });
    return initial;
  });'''

new_init = '''  // Part 2 Cohesion order state (Đầy đủ 27 bộ đề thi)
  const [cohesionOrder, setCohesionOrder] = useState<Record<number, string[]>>(() => {
    const initial: Record<number, string[]> = {};
    READING_PART2_BANK.forEach((demo) => {
      initial[demo.id] = [...demo.correctOrder].sort(() => 0.5 - Math.random());
    });
    return initial;
  });

  // Part 3 Answers state
  const [p3Answers, setP3Answers] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [p3ShowResults, setP3ShowResults] = useState<Record<number, boolean>>({});'''

content = content.replace(old_init, new_init)

# 3. Update Part 2 render count badge and map
content = content.replace(
    '<span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">\n                  12 bộ chủ đề sát đề thi\n                </span>',
    '<span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">\n                  27 bộ chủ đề sát đề thi (Full Part 2)\n                </span>'
)

content = content.replace(
    'PART2_COHESION_DEMO.map((demo) => {',
    'filteredP2Demos.map((demo) => {'
)

# Add filteredP2Demos before return
p2_filter_code = '''  // Filter Part 2
  const filteredP2Demos = useMemo(() => {
    if (!searchTerm) return READING_PART2_BANK;
    const term = searchTerm.toLowerCase();
    return READING_PART2_BANK.filter(
      (d) =>
        d.title.toLowerCase().includes(term) ||
        d.leakKeywordNote.toLowerCase().includes(term) ||
        d.correctOrder.some((s) => s.toLowerCase().includes(term))
    );
  }, [searchTerm]);

  // Filter Part 3
  const filteredP3Bank = useMemo(() => {
    if (!searchTerm) return READING_PART3_BANK;
    const term = searchTerm.toLowerCase();
    return READING_PART3_BANK.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        t.persons.some((p) => p.text.toLowerCase().includes(term)) ||
        t.questions.some((q) => q.prompt.toLowerCase().includes(term))
    );
  }, [searchTerm]);
'''

content = content.replace('  // Move sentence helper in Part 2', p2_filter_code + '\n  // Move sentence helper in Part 2')

# In Part 2 card header, show leak keyword note
old_p2_card = '''                      <div className="flex items-center justify-between border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                            Chủ đề #{demo.id}
                          </span>
                          <h4 className="font-heading font-bold text-sm text-foreground">
                            {demo.title}
                          </h4>
                        </div>'''

new_p2_card = '''                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                              {demo.title.split(" - ")[0]}
                            </span>
                            <h4 className="font-heading font-bold text-sm text-foreground">
                              {demo.title}
                            </h4>
                          </div>
                          {demo.leakKeywordNote && (
                            <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold mt-1 bg-amber-500/10 px-2 py-0.5 rounded-md inline-block">
                              🔑 Mẹo từ khóa thứ tự: {demo.leakKeywordNote}
                            </p>
                          )}
                        </div>'''

content = content.replace(old_p2_card, new_p2_card)

# 4. Replace Part 3 Content with full interactive Reading Part 3 Bank practice
old_p3_content = '''          {/* ================================================================ */}
          {/* 3. PART 3 CONTENT                                                */}
          {/* ================================================================ */}
          {currentPart === "3" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h3 className="font-heading font-black text-foreground text-sm">
                    Quy tắc ăn trọn điểm Reading Part 4 (Opinion Matching)
                  </h3>
                  <p className="text-muted-foreground mt-0.5">
                    Đọc đoạn văn của 4 nhân vật (Người A, B, C, D) chia sẻ ý kiến về một chủ đề. Có 7 nhận định: Ghép mỗi nhận định với người đã phát biểu ý đó.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                  12 đề thi chuẩn British Council
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {READING_PART3_TOPICS.map((topic) => (
                  <div key={topic.id} className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                          Đề {topic.id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          {topic.sticker}
                        </span>
                      </div>
                      <h4 className="font-heading font-bold text-sm text-foreground truncate max-w-[200px]">
                        {topic.title}
                      </h4>
                    </div>

                    <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 text-xs space-y-2">
                      <div className="font-bold text-foreground">Chiến thuật làm bài nhanh:</div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Đọc lướt 7 câu hỏi trước để bắt từ khóa trọng tâm (Keywords) -> Quét nhanh các từ đồng nghĩa (Synonyms) trong phát biểu của từng nhân vật A, B, C, D để nối chuẩn xác 100%.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-muted-foreground">7 câu hỏi nối ý kiến</span>
                      <Link
                        href={`/reading/00000000-0000-0000-0000-000000000001?part=3`}
                        className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-[11px] shadow-xs inline-flex items-center gap-1"
                      >
                        <span>Luyện đề thi này</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}'''

new_p3_content = '''          {/* ================================================================ */}
          {/* 3. PART 3 CONTENT (Opinion Matching Thực Tế)                     */}
          {/* ================================================================ */}
          {currentPart === "3" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h3 className="font-heading font-black text-foreground text-sm">
                    Quy tắc ăn trọn điểm Reading Part 4 (Opinion Matching)
                  </h3>
                  <p className="text-muted-foreground mt-0.5">
                    Đọc đoạn văn của 4 nhân vật (Người A, B, C, D) chia sẻ ý kiến về một chủ đề. Có 7 nhận định: Ghép mỗi nhận định với người đã phát biểu ý đó.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                  Đầy đủ các bộ đề thi thật trích xuất
                </span>
              </div>

              <div className="space-y-8">
                {filteredP3Bank.map((topic) => {
                  const isChecked = p3ShowResults[topic.id];

                  return (
                    <div key={topic.id} className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                            Đề {topic.id}
                          </span>
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            {topic.sticker}
                          </span>
                          <h4 className="font-heading font-extrabold text-base text-foreground">
                            {topic.title}
                          </h4>
                        </div>

                        <button
                          type="button"
                          onClick={() => setP3ShowResults((prev) => ({ ...prev, [topic.id]: !prev[topic.id] }))}
                          className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-xs self-start sm:self-auto"
                        >
                          {isChecked ? "Ẩn đáp án" : "Kiểm tra 7 nhận định"}
                        </button>
                      </div>

                      {/* 4 Persons Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {topic.persons.map((person) => (
                          <div key={person.name} className="p-4 rounded-xl bg-muted/20 border border-border space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-0.5 rounded-md bg-primary text-primary-foreground text-xs font-black">
                                {person.name}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-semibold">
                                {person.role}
                              </span>
                            </div>
                            <p className="text-xs text-foreground/90 leading-relaxed font-normal">
                              {person.text}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* 7 Questions */}
                      <div className="space-y-3 pt-2 border-t border-border/60">
                        <h5 className="font-heading font-bold text-xs text-foreground uppercase tracking-wider">
                          7 Nhận định cần ghép với người phát biểu (A, B, C, D):
                        </h5>
                        <div className="space-y-2.5">
                          {topic.questions.map((q, qIdx) => {
                            const userChoice = p3Answers[`${topic.id}_${q.id}`];
                            const isMatch = userChoice === q.correct;

                            let qBorder = "border-border bg-card";
                            if (isChecked) {
                              qBorder = isMatch
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
                                : "border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-200";
                            }

                            return (
                              <div
                                key={q.id}
                                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${qBorder}`}
                              >
                                <div className="flex items-start gap-2.5">
                                  <span className="w-5 h-5 rounded-md bg-muted flex items-center justify-center font-bold text-[11px] text-muted-foreground shrink-0 mt-0.5">
                                    {qIdx + 1}
                                  </span>
                                  <p className="font-semibold text-foreground leading-snug">
                                    {q.prompt}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                                  {(["A", "B", "C", "D"] as const).map((opt) => {
                                    const isSelected = userChoice === opt;
                                    let btnStyle = "border-border bg-card hover:bg-muted text-foreground";
                                    if (isChecked) {
                                      if (opt === q.correct) {
                                        btnStyle = "border-emerald-500 bg-emerald-500 text-white font-bold";
                                      } else if (isSelected) {
                                        btnStyle = "border-rose-500 bg-rose-500 text-white";
                                      }
                                    } else if (isSelected) {
                                      btnStyle = "border-primary bg-primary text-primary-foreground font-bold";
                                    }

                                    return (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() =>
                                          setP3Answers((prev) => ({
                                            ...prev,
                                            [`${topic.id}_${q.id}`]: opt,
                                          }))
                                        }
                                        className={`w-7 h-7 rounded-lg border text-xs font-bold transition-all flex items-center justify-center ${btnStyle}`}
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}'''

content = content.replace(old_p3_content, new_p3_content)

with open('frontend/src/app/reading/marathon/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated reading marathon page with full 27 Part 2 topics and authentic Part 3 bank.')
