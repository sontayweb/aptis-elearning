import { prisma } from "../config/database";

async function main() {
  console.log("=== CHECKING READING PART 1 QUESTIONS ===");
  const p1Parts = await prisma.examPart.findMany({
    where: {
      AND: [
        {
          OR: [
            { title: { contains: "Part 1" } },
            { part_number: 1 },
          ],
        },
        {
          OR: [
            { title: { contains: "READING" } },
            { title: { contains: "ĐỌC" } },
            { exam: { skill: "READING" } },
          ],
        },
      ],
    },
    include: {
      exam: { select: { id: true, title: true, skill: true } },
      questions: { select: { id: true, question_type: true, prompt: true } },
    },
  });

  let mcCount = 0;
  let gapFillCount = 0;
  for (const p of p1Parts) {
    for (const q of p.questions) {
      if (q.question_type === "MULTIPLE_CHOICE") mcCount++;
      else if (q.question_type === "GAP_FILL") gapFillCount++;
      else console.log(`Other type in Reading P1: ${q.question_type} - ${p.exam.title}`);
    }
  }

  console.log({ totalParts: p1Parts.length, mcCount, gapFillCount });
}

main().catch(console.error).finally(() => prisma.$disconnect());

