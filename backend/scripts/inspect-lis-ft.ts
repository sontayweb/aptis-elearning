import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const ftExams = await prisma.exam.findMany({
    where: { skill: 'FULL_TEST' },
    include: {
      parts: {
        where: {
          title: { contains: 'Listening', mode: 'insensitive' }
        },
        include: { questions: true }
      }
    },
    take: 3
  });

  for (const ft of ftExams) {
    console.log(`\n==================================================`);
    console.log(`FULL TEST: "${ft.title}"`);
    for (const p of ft.parts) {
      console.log(`  Part ${p.part_number}: title="${p.title}" | audio="${p.audio_url}" | qCount=${p.questions.length}`);
      for (const q of p.questions.slice(0, 2)) {
        console.log(`    Q${q.question_number}: prompt="${q.prompt?.slice(0, 50)}" | ans="${q.correct_answer}" | opts=${JSON.stringify(q.options)?.slice(0, 60)}`);
      }
    }
  }
}

run().finally(() => prisma.$disconnect());
