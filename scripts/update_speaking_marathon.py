import re

with open('frontend/src/app/speaking/marathon/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import for SPEAKING_PART4_BANK
content = content.replace(
    'import {\n  SPEAKING_PART3_BANK,\n  SpeakingPart3Topic,\n} from "@/data/speaking-part3-bank";',
    'import {\n  SPEAKING_PART3_BANK,\n  SpeakingPart3Topic,\n} from "@/data/speaking-part3-bank";\nimport {\n  SPEAKING_PART4_BANK,\n  SpeakingPart4Cluster,\n} from "@/data/speaking-part4-bank";'
)

# 2. Update currentPart state type
content = content.replace(
    'const [currentPart, setCurrentPart] = useState<"1" | "2" | "3">(\n    initialPart === "2" ? "2" : initialPart === "3" ? "3" : "1"\n  );',
    'const [currentPart, setCurrentPart] = useState<"1" | "2" | "3" | "4">(\n    initialPart === "2" ? "2" : initialPart === "3" ? "3" : initialPart === "4" ? "4" : "1"\n  );'
)

# 3. Add filteredP4Clusters
target_filter = '  // Filter Part 3\n  const filteredP3Topics = useMemo(() => {'
p4_filter_code = '''  // Filter Part 4
  const filteredP4Clusters = useMemo(() => {
    return SPEAKING_PART4_BANK.filter((cluster) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        cluster.title.toLowerCase().includes(term) ||
        cluster.coverage.toLowerCase().includes(term) ||
        cluster.story.toLowerCase().includes(term) ||
        cluster.sampleSpeech.toLowerCase().includes(term)
      );
    });
  }, [searchTerm]);

'''
content = content.replace(target_filter, p4_filter_code + target_filter)

# 4. Add Part 4 tab button in switcher
old_buttons = '''              <button
                type="button"
                onClick={() => setCurrentPart("3")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentPart === "3"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Part 3 (So sánh 2 tranh)
              </button>'''

new_buttons = old_buttons + '''
              <button
                type="button"
                onClick={() => setCurrentPart("4")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentPart === "4"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Part 4 (6 Cụm Đề Vạn Năng)
              </button>'''

content = content.replace(old_buttons, new_buttons)

# 5. Search placeholder update
old_placeholder = ''': currentPart === "2"
                    ? "Tìm kiếm tranh Part 2 hoặc từ vựng (phòng họp, siêu thị, gia đình...)"
                    : "Tìm kiếm tranh Part 3 (leo núi, biển, phương tiện...)"'''

new_placeholder = ''': currentPart === "2"
                    ? "Tìm kiếm tranh Part 2 hoặc từ vựng (phòng họp, siêu thị, gia đình...)"
                    : currentPart === "3"
                    ? "Tìm kiếm tranh Part 3 (leo núi, biển, phương tiện...)"
                    : "Tìm kiếm cụm đề Part 4 (du lịch, học tập, quà tặng, bạn bè...)"'''

content = content.replace(old_placeholder, new_placeholder)

# 6. Part 4 section render
part4_section = '''
          {/* ========================================================= */}
          {/* 4. PART 4 MARATHON DISPLAY (6 Cụm Đề Vạn Năng)            */}
          {/* ========================================================= */}
          {currentPart === "4" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading font-bold text-sm text-foreground">
                    Cẩm Nang 6 Cụm Đề Vạn Năng Part 4 (Gộp 23 Đề Thi Thật)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Thời gian chuẩn bị 1 phút · Nói liên tục 2 phút (120s). Mỗi cụm có cốt truyện gộp vạn năng và bài mẫu B2/C1 đạt điểm tối đa.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-bold text-xs shrink-0 self-start sm:self-center">
                  6 Cụm đề bao phủ 100%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredP4Clusters.map((cluster) => (
                  <div
                    key={cluster.id}
                    className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4 flex flex-col justify-between hover:border-amber-500/40 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border/60 pb-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                          {cluster.title.split(" - ")[0]}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          ☘️☘️☘️☘️☘️ Trọng điểm
                        </span>
                      </div>

                      <h4 className="font-heading font-bold text-sm text-foreground">
                        {cluster.title}
                      </h4>

                      <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1.5">
                        <p className="text-muted-foreground font-semibold">
                          <strong className="text-foreground">Đề bao phủ:</strong> {cluster.coverage}
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          <strong className="text-foreground">Cốt truyện gộp:</strong> {cluster.story}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                        <div className="flex items-center justify-between font-bold text-amber-800 dark:text-amber-200">
                          <span>🎙️ Bài nói mẫu 2 phút (B2/C1):</span>
                        </div>
                        <p className="italic text-muted-foreground leading-relaxed text-[11.5px]">
                          {cluster.sampleSpeech}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          openPracticeModal({
                            part: 4,
                            title: cluster.title,
                            prompt: cluster.story,
                            sampleAnswer: cluster.sampleSpeech,
                            timeLimit: 120,
                          })
                        }
                        className="w-full py-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Luyện nói 2 phút đề này</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
'''

# Insert before end of main
content = content.replace(
    '          )}\n        </div>\n      </main>',
    '          )}\n' + part4_section + '        </div>\n      </main>'
)

with open('frontend/src/app/speaking/marathon/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated speaking marathon page with Part 4 support.')
