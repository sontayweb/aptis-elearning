import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const lisExams = await prisma.exam.findMany({
    where: {
      OR: [
        { skill: 'LISTENING' },
        { title: { contains: 'Listening', mode: 'insensitive' } }
      ]
    },
    include: {
      parts: {
        include: { questions: true }
      }
    },
    take: 10
  });

  console.log(`Found ${lisExams.length} listening exams.`);
  for (const ex of lisExams) {
    console.log(`\n==================================================`);
    console.log(`EXAM: [${ex.id}] "${ex.title}" | Parts: ${ex.parts.length}`);
    for (const p of ex.parts) {
      console.log(`  Part ${p.part_number}: title="${p.title}" | audio="${p.audio_url}" | qCount=${p.questions.length}`);
      for (const q of p.questions.slice(0, 4)) {
        console.log(`    Q${q.question_number}: prompt="${q.prompt?.slice(0, 50)}" | ans="${q.correct_answer}" | opts=${JSON.stringify(q.options)?.slice(0, 60)}`);
      }
    }
  }
}

run().finally(() => prisma.$disconnect());
