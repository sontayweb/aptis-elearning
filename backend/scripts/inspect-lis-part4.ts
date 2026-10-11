import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const exam = await prisma.exam.findFirst({
    where: { skill: 'LISTENING', parts: { some: { part_number: 4 } } },
    include: {
      parts: {
        include: { questions: true }
      }
    }
  });

  console.log('EXAM:', exam?.title);
  for (const p of exam?.parts || []) {
    console.log(`Part ${p.part_number}:`, p.title, `(${p.questions.length} questions) | audio: ${p.audio_url}`);
    for (const q of p.questions) {
      console.log(`  Q${q.question_number}: prompt="${q.prompt}", opts=${JSON.stringify(q.options)}, ans="${q.correct_answer}"`);
    }
  }

  await prisma.$disconnect();
}

run().catch(console.error);
