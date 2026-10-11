import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const exam = await prisma.exam.findUnique({
    where: { id: '0619a445-76fe-475c-b7b7-176990b6d9b8' },
    include: {
      parts: {
        include: { questions: true }
      }
    }
  });

  console.log('EXAM:', exam?.title);
  for (const p of exam?.parts || []) {
    console.log(`Part ${p.part_number}:`, p.title, `(${p.questions.length} questions)`);
    for (const q of p.questions) {
      console.log(`  Q${q.question_number}: prompt="${q.prompt}", opts=${JSON.stringify(q.options)}, ans="${q.correct_answer}"`);
    }
  }

  await prisma.$disconnect();
}

run().catch(console.error);
