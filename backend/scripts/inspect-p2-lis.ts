import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const p2Parts = await prisma.examPart.findMany({
    where: {
      OR: [
        { part_number: 2, exam: { skill: 'LISTENING' } },
        { title: { contains: 'Part 2', mode: 'insensitive' }, exam: { skill: 'LISTENING' } },
        { title: { contains: 'Part 2', mode: 'insensitive' }, exam: { skill: 'FULL_TEST' } }
      ]
    },
    include: {
      exam: { select: { id: true, title: true, skill: true } },
      questions: true
    },
    take: 20
  });

  console.log(`Found ${p2Parts.length} Part 2 parts.`);
  for (const p of p2Parts) {
    console.log(`\nPart: [${p.id}] "${p.title}" (Exam: "${p.exam.title}") | Qs: ${p.questions.length}`);
    for (const q of p.questions) {
      console.log(`  Q${q.question_number} [${q.id}]: prompt="${q.prompt}" | ans="${q.correct_answer}" | opts=${JSON.stringify(q.options)}`);
    }
  }
}

run().finally(() => prisma.$disconnect());
