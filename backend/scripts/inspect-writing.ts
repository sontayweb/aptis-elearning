import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const parts = await prisma.examPart.findMany({
    where: { part_number: 2, exam: { skill: "WRITING" } },
    include: { questions: true, exam: true },
    take: 10,
  });

  console.log("Total writing part 2 parts found:", parts.length);
  for (const p of parts) {
    console.log("Exam ID:", p.exam_id, "| Exam Title:", p.exam.title);
    console.log("Part title:", p.title);
    console.log("Part instructions:", p.instructions?.slice(0, 80));
    console.log("Part passage_text:", p.passage_text?.slice(0, 80));
    console.log("Questions count:", p.questions.length);
    for (const q of p.questions) {
      console.log("  Q prompt:", q.prompt?.slice(0, 100));
    }
  }

  // Also check sub-exams for writing Part 2:
  const subExamsP2 = await prisma.exam.findMany({
    where: {
      skill: "WRITING",
      OR: [
        { title: { contains: "Part 2" } },
        { title: { contains: "Short Text" } }
      ]
    },
    include: {
      parts: {
        include: { questions: true }
      }
    },
    take: 10
  });

  console.log("\nSub-exams with 'Part 2' in title:", subExamsP2.length);
  for (const se of subExamsP2) {
    console.log("Sub-exam ID:", se.id, "| Title:", se.title);
    console.log("Parts count:", se.parts.length);
    for (const p of se.parts) {
      console.log("  Part Num:", p.part_number, "| Title:", p.title);
      console.log("  Instructions:", p.instructions?.slice(0, 80));
      console.log("  Questions:", p.questions.length);
      for (const q of p.questions) {
        console.log("    Q prompt:", q.prompt?.slice(0, 100));
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
