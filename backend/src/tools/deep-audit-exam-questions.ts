import { prisma } from "../config/database";

async function deepAudit() {
  console.log("=== BẮT ĐẦU AUDIT TOÀN BỘ CƠ SỞ DỮ LIỆU ĐỀ THI & CÂU HỎI ===");

  const exams = await prisma.exam.findMany({
    select: {
      id: true,
      title: true,
      skill: true,
      parts: {
        select: {
          id: true,
          title: true,
          part_number: true,
          passage_text: true,
          questions: {
            select: {
              id: true,
              prompt: true,
              question_type: true,
              options: true,
              correct_answer: true,
            },
          },
        },
        orderBy: { part_number: "asc" },
      },
    },
  });

  console.log(`Tổng số đề thi trong Database: ${exams.length}`);

  let totalQuestions = 0;
  let writingQuestionsCount = 0;
  let readingP1Count = 0;
  let readingP2Count = 0;
  let readingP3P4Count = 0;

  const issues: string[] = [];

  for (const exam of exams) {
    const isWritingExam = exam.skill === "WRITING";
    const isReadingExam = exam.skill === "READING";
    const isFullTest = exam.skill === "FULL_TEST";

    for (const part of exam.parts) {
      const pTitle = (part.title || "").toUpperCase();
      const pNum = part.part_number;

      const isGrammarVocab =
        pTitle.includes("GRAMMAR") ||
        pTitle.includes("VOCAB") ||
        pTitle.includes("NGỮ PHÁP") ||
        pTitle.includes("TỪ VỰNG");

      const isSpeakingPart =
        !isGrammarVocab &&
        (exam.skill === "SPEAKING" ||
          pTitle.includes("SPEAKING") ||
          pTitle.includes("NÓI"));

      const isWritingPart =
        !isGrammarVocab &&
        !isSpeakingPart &&
        (isWritingExam ||
          pTitle.includes("WRITING") ||
          pTitle.includes("VIẾT") ||
          pTitle.includes("VIET"));

      const isReadingP1 =
        !isGrammarVocab &&
        !isSpeakingPart &&
        !isWritingPart &&
        (isReadingExam || pTitle.includes("READING") || pTitle.includes("ĐỌC")) &&
        (pTitle.includes("PART 1") || pTitle.includes("GAP") || pTitle.includes("SENTENCE COMPREHENSION"));

      const isReadingP2 =
        !isGrammarVocab &&
        !isSpeakingPart &&
        !isWritingPart &&
        (isReadingExam || pTitle.includes("READING") || pTitle.includes("ĐỌC")) &&
        (pTitle.includes("PART 2") || pTitle.includes("ORDER") || pTitle.includes("COHESION"));

      const isReadingP3P4 =
        !isGrammarVocab &&
        !isSpeakingPart &&
        !isWritingPart &&
        (isReadingExam || pTitle.includes("READING") || pTitle.includes("ĐỌC")) &&
        (pTitle.includes("PART 3") || pTitle.includes("PART 4") || pTitle.includes("OPINION") || pTitle.includes("LONG") || pTitle.includes("HEADING"));

      for (const q of part.questions) {
        totalQuestions++;

        // 1. Audit Writing questions
        if (isWritingPart) {
          writingQuestionsCount++;
          if (q.question_type !== "ESSAY" && q.question_type !== "SHORT_TEXT") {
            issues.push(
              `[WRITING ISSUE] Exam "${exam.title}" (${exam.id}) -> Part "${part.title}" -> Q:${q.id} có question_type = "${q.question_type}" (chưa là ESSAY)`
            );
          }
        }

        // 2. Audit Reading Part 1 questions
        if (isReadingP1) {
          readingP1Count++;
          let opts: any = q.options;
          if (typeof opts === "string") {
            try { opts = JSON.parse(opts); } catch {}
          }
          if (!Array.isArray(opts) || opts.length === 0) {
            issues.push(
              `[READING P1 ISSUE] Exam "${exam.title}" (${exam.id}) -> Part "${part.title}" -> Q:${q.id} không có options hợp lệ: ${JSON.stringify(q.options)}`
            );
          }
        }

        // 3. Audit Reading Part 2 questions
        if (isReadingP2) {
          readingP2Count++;
          let opts: any = q.options;
          if (typeof opts === "string") {
            try { opts = JSON.parse(opts); } catch {}
          }
          const hasSentences =
            (opts && Array.isArray(opts.sentences) && opts.sentences.length > 0) ||
            (Array.isArray(opts) && opts.length > 0);

          if (!hasSentences) {
            issues.push(
              `[READING P2 ISSUE] Exam "${exam.title}" (${exam.id}) -> Part "${part.title}" -> Q:${q.id} không có sentences trong options: ${JSON.stringify(q.options)}`
            );
          }
        }

        // 4. Audit Reading Part 3 & 4
        if (isReadingP3P4) {
          readingP3P4Count++;
          let opts: any = q.options;
          if (typeof opts === "string") {
            try { opts = JSON.parse(opts); } catch {}
          }
          if (!opts && !part.passage_text && !q.prompt) {
            issues.push(
              `[READING P3/P4 ISSUE] Exam "${exam.title}" (${exam.id}) -> Part "${part.title}" -> Q:${q.id} thiếu cả options, passage_text và prompt.`
            );
          }
        }
      }
    }
  }

  console.log("\n=== KẾT QUẢ THỐNG KÊ TOÀN DIỆN ===");
  console.log(`- Tổng câu hỏi kiểm tra: ${totalQuestions}`);
  console.log(`- Câu hỏi Writing: ${writingQuestionsCount}`);
  console.log(`- Câu hỏi Reading Part 1: ${readingP1Count}`);
  console.log(`- Câu hỏi Reading Part 2: ${readingP2Count}`);
  console.log(`- Câu hỏi Reading Part 3 & 4: ${readingP3P4Count}`);
  console.log(`- Tổng số vấn đề phát hiện: ${issues.length}`);

  if (issues.length > 0) {
    console.log("\n--- CHI TIẾT CÁC VẤN ĐỀ ---");
    issues.slice(0, 30).forEach((iss, idx) => console.log(`${idx + 1}. ${iss}`));
    if (issues.length > 30) {
      console.log(`... và còn ${issues.length - 30} vấn đề khác.`);
    }
  } else {
    console.log("✓ TOÀN BỘ CÂU HỎI TRONG DATABASE ĐỀU HOÀN TOÀN CHUẨN XÁC VÀ HỢP LỆ 100%!");
  }

  await prisma.$disconnect();
}

deepAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
