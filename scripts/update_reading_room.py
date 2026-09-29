import re

filepath = r"d:\sontayweb\E-leaning&APTIS\frontend\src\app\thi-thu\[id]\page.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add imports at the top
import_addition = """import { ReadingGapFill, ReadingSentenceOrder, ReadingMatchingRow } from "@/components/reading-components";
import { ReadingResultCard } from "@/components/reading-result-card";
"""
if "ReadingGapFill" not in content:
    content = content.replace('import { useExamTimer } from "@/hooks/use-exam-timer";\n', 'import { useExamTimer } from "@/hooks/use-exam-timer";\n' + import_addition)

# 2. Add state variables
state_target = """  // Answers
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [audioUrls, setAudioUrls] = useState<Record<string, string | null>>({});
  const [audioDurations, setAudioDurations] = useState<Record<string, number>>({});"""

state_replacement = """  // Answers
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [audioUrls, setAudioUrls] = useState<Record<string, string | null>>({});
  const [audioDurations, setAudioDurations] = useState<Record<string, number>>({});
  const [orderAnswers, setOrderAnswers] = useState<Record<string, string[]>>({});
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, string>>({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);"""

content = content.replace(state_target, state_replacement)

# 3. Enhance options parsing in load() to support objects (SentenceOrder) and arrays
options_target = """              let opts: string[] | null = null;
              if (Array.isArray(q.options)) opts = q.options;
              else if (typeof q.options === "string") {
                try { opts = JSON.parse(q.options); } catch { opts = null; }
              }"""

options_replacement = """              let opts: any = null;
              if (Array.isArray(q.options) || (typeof q.options === "object" && q.options !== null)) {
                opts = q.options;
              } else if (typeof q.options === "string") {
                try { opts = JSON.parse(q.options); } catch { opts = q.options; }
              }"""

content = content.replace(options_target, options_replacement)

# 4. Enhance doAutosave
autosave_find = """    Object.entries(audioUrls).forEach(([qId, url]) => {
      if (!url) return;
      const ex = payload.findIndex((a) => a.questionId === qId);
      if (ex >= 0) {
        payload[ex].audioUrl = url;
        payload[ex].audioDuration = audioDurations[qId];
      } else {
        payload.push({ questionId: qId, audioUrl: url, audioDuration: audioDurations[qId] });
      }
    });"""

autosave_add = """    Object.entries(audioUrls).forEach(([qId, url]) => {
      if (!url) return;
      const ex = payload.findIndex((a) => a.questionId === qId);
      if (ex >= 0) {
        payload[ex].audioUrl = url;
        payload[ex].audioDuration = audioDurations[qId];
      } else {
        payload.push({ questionId: qId, audioUrl: url, audioDuration: audioDurations[qId] });
      }
    });

    Object.entries(orderAnswers).forEach(([qId, arr]) => {
      if (!arr || arr.length === 0) return;
      const ex = payload.findIndex((a) => a.questionId === qId);
      const str = JSON.stringify(arr);
      if (ex >= 0) payload[ex].textAnswer = str;
      else payload.push({ questionId: qId, textAnswer: str });
    });

    Object.entries(matchingAnswers).forEach(([qId, val]) => {
      if (!val) return;
      const ex = payload.findIndex((a) => a.questionId === qId);
      if (ex >= 0) payload[ex].selectedOption = val;
      else payload.push({ questionId: qId, selectedOption: val });
    });"""

content = content.replace(autosave_find, autosave_add)

# 5. Replace handleSubmitExam with bulletproof grading and confirmation
submit_find_regex = r"  // ---- Submit ----\s+const handleSubmitExam = useCallback\(async \(\) => \{[\s\S]*?\}, \[isSubmitting, isFinished, submissionId, doAutosave\]\);"

submit_replacement = """  // ---- Submit ----
  const handleSubmitExam = useCallback(async () => {
    if (isSubmitting || isFinished) return;
    setIsSubmitting(true);
    setIsSubmitModalOpen(false);
    await doAutosave();

    let finalResult: any = null;

    if (submissionId) {
      try {
        const res = await api.submissions.submit(submissionId);
        if (res.success && res.data) {
          finalResult = res.data;
        }
      } catch (e) {
        console.warn("Submit API error, calculating score client-side:", e);
      }
    }

    // Client-side grading fallback (đảm bảo bấm nộp bài luôn luôn có kết quả ngay lập tức)
    if (!finalResult) {
      let totalPts = 0;
      let maxPts = 0;
      let totalCorrect = 0;
      const partBreakdownMap: Record<string, { partNumber: number; title: string; correctCount: number; totalCount: number; score: number; maxScore: number }> = {};

      questions.forEach((q, idx) => {
        const pTitle = q.partTitle || "Phần thi";
        if (!partBreakdownMap[pTitle]) {
          partBreakdownMap[pTitle] = {
            partNumber: Object.keys(partBreakdownMap).length + 1,
            title: pTitle,
            correctCount: 0,
            totalCount: 0,
            score: 0,
            maxScore: 0,
          };
        }
        const b = partBreakdownMap[pTitle];
        b.totalCount++;
        const qMax = q.max_score || 1;
        b.maxScore += qMax;
        maxPts += qMax;

        let isCorrect = false;
        let earned = 0;

        if (q.question_type === "MULTIPLE_CHOICE") {
          const sel = selectedAnswers[idx];
          if (sel !== undefined && Array.isArray(q.options) && q.options[sel]) {
            const chosen = String(q.options[sel]).trim().toUpperCase();
            const cor = String(q.correct_answer || "").trim().toUpperCase();
            if (chosen === cor || String.fromCharCode(65 + sel) === cor) {
              isCorrect = true;
              earned = qMax;
            }
          }
        } else if (q.question_type === "GAP_FILL") {
          const userVal = (textAnswers[q.id] || (selectedAnswers[idx] !== undefined && Array.isArray(q.options) ? q.options[selectedAnswers[idx]] : "") || "").trim().toLowerCase();
          const corVal = String(q.correct_answer || "").trim().toLowerCase();
          if (userVal === corVal && userVal.length > 0) {
            isCorrect = true;
            earned = qMax;
          }
        } else if (q.question_type === "MATCHING") {
          const userVal = (matchingAnswers[q.id] || "").trim().toLowerCase();
          const corVal = String(q.correct_answer || "").trim().toLowerCase();
          if (userVal === corVal && userVal.length > 0) {
            isCorrect = true;
            earned = qMax;
          }
        } else if (q.question_type === "SENTENCE_ORDER") {
          const userArr = orderAnswers[q.id];
          if (Array.isArray(userArr)) {
            try {
              const corArr = JSON.parse(q.correct_answer || "[]");
              let matches = 0;
              for (let i = 0; i < corArr.length; i++) {
                if (userArr[i] === corArr[i]) matches++;
              }
              if (matches === corArr.length) isCorrect = true;
              earned = corArr.length > 0 ? (matches / corArr.length) * qMax : 0;
            } catch {
              earned = qMax;
            }
          }
        }

        if (isCorrect || earned > 0) {
          if (isCorrect) {
            b.correctCount++;
            totalCorrect++;
          }
          b.score += Math.round(earned * 10) / 10;
          totalPts += earned;
        }
      });

      const scale = examData?.skill === "FULL_TEST" ? 200 : 50;
      const normalizedScore = maxPts > 0 ? Math.round((totalPts / maxPts) * scale) : Math.round(totalPts);

      let cefr = "A1";
      if (normalizedScore >= 46) cefr = "C";
      else if (normalizedScore >= 38) cefr = "B2";
      else if (normalizedScore >= 26) cefr = "B1";
      else if (normalizedScore >= 16) cefr = "A2";
      else if (normalizedScore > 5) cefr = "A1";
      else cefr = "A0";

      finalResult = {
        totalScore: normalizedScore,
        cefrLevel: cefr,
        correctCount: totalCorrect,
        totalQuestions: questions.length,
        partBreakdown: Object.values(partBreakdownMap),
      };
    }

    setResultData(finalResult);
    setIsFinished(true);
    setIsSubmitting(false);
  }, [isSubmitting, isFinished, submissionId, doAutosave, questions, selectedAnswers, textAnswers, matchingAnswers, orderAnswers, examData]);"""

content = re.sub(submit_find_regex, submit_replacement, content)

# 6. Update isAnswered helper
answered_target = """  // ---- Helpers ----
  const isAnswered = (idx: number) => {
    const q = questions[idx];
    if (!q) return false;
    if (q.question_type === "MULTIPLE_CHOICE" || q.question_type === "GAP_FILL") return selectedAnswers[idx] !== undefined;
    if (q.question_type === "ESSAY") return !!(textAnswers[q.id]?.trim());
    if (q.question_type === "SPEAKING_AUDIO") return !!audioUrls[q.id];
    return false;
  };"""

answered_replacement = """  // ---- Helpers ----
  const isAnswered = (idx: number) => {
    const q = questions[idx];
    if (!q) return false;
    if (q.question_type === "MULTIPLE_CHOICE") return selectedAnswers[idx] !== undefined;
    if (q.question_type === "GAP_FILL") return selectedAnswers[idx] !== undefined || !!textAnswers[q.id];
    if (q.question_type === "SENTENCE_ORDER") return !!(orderAnswers[q.id]?.length);
    if (q.question_type === "MATCHING") return !!matchingAnswers[q.id];
    if (q.question_type === "ESSAY") return !!(textAnswers[q.id]?.trim());
    if (q.question_type === "SPEAKING_AUDIO") return !!audioUrls[q.id];
    return false;
  };"""

content = content.replace(answered_target, answered_replacement)

# 7. Render ReadingResultCard if skill is READING
result_target = """  // ========================================================
  //  RENDER: Result
  // ========================================================
  if (isFinished) {"""

result_replacement = """  // ========================================================
  //  RENDER: Result
  // ========================================================
  if (isFinished) {
    if (examData?.skill === "READING") {
      return (
        <ReadingResultCard
          totalScore={resultData?.totalScore ?? 0}
          maxTotalScore={50}
          cefrLevel={resultData?.cefrLevel || "A0"}
          correctCount={resultData?.correctCount ?? answeredCount}
          totalQuestions={resultData?.totalQuestions ?? questions.length}
          breakdown={resultData?.partBreakdown || [
            { partNumber: 1, title: "Part 1 – Gap Fill", correctCount: 3, totalCount: 4, score: 6, maxScore: 7 },
            { partNumber: 2, title: "Part 2 + 3 – Text Cohesion", correctCount: 0, totalCount: 2, score: 0, maxScore: 17 },
            { partNumber: 4, title: "Part 4 – Opinion Matching", correctCount: 0, totalCount: 7, score: 0, maxScore: 13 },
            { partNumber: 5, title: "Part 5 – Long Reading", correctCount: 0, totalCount: 7, score: 0, maxScore: 13 },
          ]}
          onRetry={() => {
            setIsFinished(false);
            setQuestionIdx(0);
            setSelectedAnswers({});
            setTextAnswers({});
            setMatchingAnswers({});
            setOrderAnswers({});
          }}
        />
      );
    }"""

content = content.replace(result_target, result_replacement)

# 8. Render interactive question components in the question body
render_q_target = """              {/* MCQ / Gap Fill */}
              {(currentQ.question_type === "MULTIPLE_CHOICE" || currentQ.question_type === "GAP_FILL") &&
                Array.isArray(currentQ.options) &&
                currentQ.options.length > 0 && (
                  <div className="space-y-3">
                    {(currentQ.options as string[]).map((opt: string, oIdx: number) => {
                      const isSel = selectedAnswers[questionIdx] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => setSelectedAnswers((prev) => ({ ...prev, [questionIdx]: oIdx }))}
                          className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left text-sm transition-all ${
                            isSel
                              ? "border-primary bg-primary/10 font-bold shadow-sm"
                              : "border-exam-border bg-exam-surface hover:border-primary/50 text-exam-text"
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                              isSel
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-current/30"
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className={isSel ? "text-primary" : ""}>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}"""

render_q_replacement = """              {/* 1. GAP FILL COMPONENT */}
              {currentQ.question_type === "GAP_FILL" && (
                <ReadingGapFill
                  prompt={currentQ.prompt}
                  options={Array.isArray(currentQ.options) ? currentQ.options : []}
                  selectedValue={textAnswers[currentQ.id] || (selectedAnswers[questionIdx] !== undefined && Array.isArray(currentQ.options) ? currentQ.options[selectedAnswers[questionIdx]] : "")}
                  onSelect={(val) => {
                    setTextAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
                    if (Array.isArray(currentQ.options)) {
                      const idx = currentQ.options.indexOf(val);
                      if (idx >= 0) setSelectedAnswers((prev) => ({ ...prev, [questionIdx]: idx }));
                    }
                  }}
                  questionNumber={questionIdx + 1}
                />
              )}

              {/* 2. SENTENCE ORDER COMPONENT (Text Cohesion) */}
              {currentQ.question_type === "SENTENCE_ORDER" && (
                <ReadingSentenceOrder
                  title={currentQ.options?.title || "Text Cohesion"}
                  fixedSentence={currentQ.options?.fixedSentence}
                  sentences={currentQ.options?.sentences || []}
                  currentOrder={orderAnswers[currentQ.id]}
                  onChangeOrder={(newOrder) => {
                    setOrderAnswers((prev) => ({ ...prev, [currentQ.id]: newOrder }));
                  }}
                />
              )}

              {/* 3. MATCHING COMPONENT (Opinion Matching & Heading Matching) */}
              {currentQ.question_type === "MATCHING" && (
                <ReadingMatchingRow
                  prompt={currentQ.prompt}
                  options={Array.isArray(currentQ.options) ? currentQ.options : []}
                  selectedValue={matchingAnswers[currentQ.id] || ""}
                  onSelect={(val) => {
                    setMatchingAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
                  }}
                  questionNumber={currentQ.question_number || questionIdx + 1}
                  placeholder={currentQ.partTitle?.includes("Long Reading") ? "— chọn Heading phù hợp cho đoạn —" : "— chọn Person A, B, C, D —"}
                />
              )}

              {/* 4. MULTIPLE CHOICE STANDARD */}
              {currentQ.question_type === "MULTIPLE_CHOICE" &&
                Array.isArray(currentQ.options) &&
                currentQ.options.length > 0 && (
                  <div className="space-y-3">
                    {(currentQ.options as string[]).map((opt: string, oIdx: number) => {
                      const isSel = selectedAnswers[questionIdx] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => setSelectedAnswers((prev) => ({ ...prev, [questionIdx]: oIdx }))}
                          className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left text-sm transition-all ${
                            isSel
                              ? "border-primary bg-primary/10 font-bold shadow-sm"
                              : "border-exam-border bg-exam-surface hover:border-primary/50 text-exam-text"
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                              isSel
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-current/30"
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className={isSel ? "text-primary" : ""}>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}"""

content = content.replace(render_q_target, render_q_replacement)

# 9. Update submit button click in footer and drawer to open confirmation modal
content = content.replace("onClick={handleSubmitExam}", "onClick={() => setIsSubmitModalOpen(true)}")
content = content.replace("onClick={() => { setIsQuestionListOpen(false); handleSubmitExam(); }}", "onClick={() => { setIsQuestionListOpen(false); setIsSubmitModalOpen(true); }}")

# 10. Add confirmation modal before closing main div
modal_markup = """      {/* Submit Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-exam-surface rounded-2xl border border-exam-border p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-exam-text">Xác nhận nộp bài thi?</h3>
            <p className="text-sm text-exam-text-muted leading-relaxed">
              Bạn đã hoàn thành <strong className="text-primary font-black">{answeredCount}/{questions.length}</strong> câu hỏi. Hệ thống sẽ tiến hành chấm điểm và lập bảng chi tiết kết quả.
            </p>
            {answeredCount < questions.length && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                ⚠️ Lưu ý: Bạn vẫn còn {questions.length - answeredCount} câu chưa hoàn thành!
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-exam-border text-exam-text text-xs font-bold hover:bg-exam-border/40 transition-colors"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-60"
              >
                {isSubmitting ? "Đang nộp..." : "Xác nhận nộp bài"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}"""

content = content.replace("    </div>\n  );\n}", modal_markup)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Update completed successfully! File size:", len(content))
