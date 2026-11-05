import { prisma } from "../config/database";

async function main() {
  console.log("Checking question options in DB...");
  const questions = await prisma.question.findMany({
    select: {
      id: true,
      question_type: true,
      options: true,
      prompt: true,
      part: {
        select: {
          id: true,
          title: true,
          part_number: true,
          exam: {
            select: {
              id: true,
              title: true,
              skill: true,
            },
          },
        },
      },
    },
  });

  let gapFillInvalidOpts = 0;
  let matchingInvalidOpts = 0;
  let sentenceOrderInvalidOpts = 0;

  for (const q of questions) {
    if (q.question_type === "GAP_FILL") {
      let opts = q.options;
      if (typeof opts === "string") {
        try { opts = JSON.parse(opts); } catch {}
      }
      if (!Array.isArray(opts)) {
        gapFillInvalidOpts++;
        console.log(`GAP_FILL invalid opts: [${q.id}] Exam: ${q.part?.exam?.title} - options:`, q.options);
      }
    }
    if (q.question_type === "SENTENCE_ORDER") {
      let opts = q.options as any;
      if (typeof opts === "string") {
        try { opts = JSON.parse(opts); } catch {}
      }
      if (!opts || !Array.isArray(opts.sentences)) {
        sentenceOrderInvalidOpts++;
        console.log(`SENTENCE_ORDER invalid opts: [${q.id}] Exam: ${q.part?.exam?.title} - options:`, q.options);
      }
    }
    if (q.question_type === "MATCHING") {
      let opts = q.options;
      if (typeof opts === "string") {
        try { opts = JSON.parse(opts); } catch {}
      }
      if (!Array.isArray(opts)) {
        matchingInvalidOpts++;
        if (matchingInvalidOpts <= 5) {
          console.log(`MATCHING invalid opts: [${q.id}] Exam: ${q.part?.exam?.title} - options:`, q.options);
        }
      }
    }
  }

  console.log({
    totalQuestions: questions.length,
    gapFillInvalidOpts,
    sentenceOrderInvalidOpts,
    matchingInvalidOpts,
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

