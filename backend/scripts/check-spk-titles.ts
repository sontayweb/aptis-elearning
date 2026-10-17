import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const exams = await prisma.exam.findMany({
    where: { skill: "SPEAKING" },
    include: {
      parts: {
        include: { questions: true }
      }
    },
    take: 15
  });

  for (const e of exams) {
    console.log("-----------------------------------------");
    console.log("Exam ID:", e.id);
    console.log("Exam Title:", e.title);
    console.log("Description:", e.description);
    console.log("Parts count:", e.parts.length);
    for (const p of e.parts) {
      console.log(`  Part ${p.part_number}: title="${p.title}", instructions="${p.instructions?.substring(0, 40)}"`);
      if (p.questions.length > 0) {
        console.log(`    Q1 prompt: "${p.questions[0].prompt?.substring(0, 60)}"`);
      }
    }
  }

  await prisma.$disconnect();
}

check().catch(console.error);
