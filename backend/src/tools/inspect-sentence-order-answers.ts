import { prisma } from "../config/database";

async function main() {
  const qList = await prisma.question.findMany({
    where: { question_type: "SENTENCE_ORDER" },
    select: {
      id: true,
      options: true,
      correct_answer: true,
      part: {
        select: {
          title: true,
          exam: { select: { title: true } },
        },
      },
    },
  });

  for (const q of qList) {
    let opts = q.options as any;
    if (typeof opts === "string") {
      try { opts = JSON.parse(opts); } catch {}
    }
    if (Array.isArray(opts)) {
      console.log(`\nQ[${q.id}] Exam: ${q.part.exam.title}`);
      console.log(`  Options (${opts.length} items):`, opts);
      console.log(`  Correct Answer:`, q.correct_answer);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

