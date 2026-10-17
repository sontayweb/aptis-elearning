import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const examId = '61fdc722-45c4-43a8-adc2-52db6c4110bc';
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      parts: {
        include: {
          questions: true,
        },
      },
    },
  });

  if (!exam) {
    console.log('Exam not found');
    return;
  }

  console.log('Exam Title:', exam.title);
  for (const p of exam.parts) {
    console.log(`\n=== Part ${p.part_number}: title="${p.title}" ===`);
    console.log('Instructions:', p.instructions?.slice(0, 100));
    console.log('Passage Text:', p.passage_text?.slice(0, 150));
    console.log('Questions count:', p.questions.length);
    for (const q of p.questions.slice(0, 4)) {
      console.log(`  Q${q.question_number}: prompt="${q.prompt}", ans="${q.correct_answer}", expl="${q.explanation?.slice(0, 100)}"`);
    }
  }

  await prisma.$disconnect();
}

run().catch(console.error);
