import { prisma } from "../config/database";

async function main() {
  console.log("=== CHECKING WRITING QUESTIONS WITH MULTIPLE_CHOICE OR EMPTY OPTIONS ===");
  const writingParts = await prisma.examPart.findMany({
    where: {
      OR: [
        { title: { contains: "WRITING" } },
        { title: { contains: "VIẾT" } },
        { exam: { skill: "WRITING" } },
      ],
    },
    include: {
      exam: {
        select: { id: true, title: true, skill: true },
      },
      questions: {
        select: { id: true, question_type: true, prompt: true, options: true },
      },
    },
  });

  const faultyExams = new Set<string>();
  let totalWritingQuestions = 0;
  let mcWritingQuestions = 0;

  for (const part of writingParts) {
    for (const q of part.questions) {
      totalWritingQuestions++;
      if (q.question_type !== "ESSAY" && q.question_type !== "SHORT_TEXT") {
        mcWritingQuestions++;
        faultyExams.add(`[${part.exam.id}] ${part.exam.title} (Part ${part.part_number}: ${part.title}) - QType: ${q.question_type}`);
      }
    }
  }

  console.log(`Total Writing questions checked: ${totalWritingQuestions}`);
  console.log(`Writing questions that are NOT ESSAY/SHORT_TEXT: ${mcWritingQuestions}`);
  console.log("Sample faulty exams:");
  Array.from(faultyExams).slice(0, 20).forEach(e => console.log("  ", e));

  console.log("\n=== CHECKING READING PART 2 SENTENCE_ORDER WITH ARRAY OPTIONS ===");
  const sentenceOrderQuestions = await prisma.question.findMany({
    where: {
      question_type: "SENTENCE_ORDER",
    },
    select: {
      id: true,
      options: true,
      part: {
        select: {
          title: true,
          exam: { select: { id: true, title: true } },
        },
      },
    },
  });

  let rawArrayCount = 0;
  for (const so of sentenceOrderQuestions) {
    let opts = so.options as any;
    if (typeof opts === "string") {
      try { opts = JSON.parse(opts); } catch {}
    }
    if (Array.isArray(opts)) {
      rawArrayCount++;
      console.log(`SENTENCE_ORDER has array options: [${so.id}] ${so.part.exam.title} - ${so.part.title}`);
      console.log(`   Sample opts:`, opts.slice(0, 4));
    }
  }
  console.log(`Total SENTENCE_ORDER with raw array options: ${rawArrayCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

