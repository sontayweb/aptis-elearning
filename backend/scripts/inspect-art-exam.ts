import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const sub = await prisma.exam.findFirst({
    where: { title: 'Art club - Writing Part 2' },
    include: { parts: { include: { questions: true } } }
  });

  console.log('--- SUB-EXAM ---');
  console.log('ID:', sub?.id, '| Title:', sub?.title);
  for (const p of sub?.parts || []) {
    console.log(`Part ${p.part_number}:`, p.title, `(${p.questions.length} questions)`);
    console.log(`  Instructions:`, p.instructions);
    for (const q of p.questions) {
      console.log(`  Q${q.question_number}: prompt="${q.prompt}"`);
      console.log(`  Q${q.question_number}: explanation="${q.explanation}"`);
    }
  }

  const full = await prisma.exam.findFirst({
    where: { title: { contains: 'Art club — Full Writing' } },
    include: { parts: { include: { questions: true } } }
  });

  console.log('\n--- FULL EXAM ---');
  console.log('ID:', full?.id, '| Title:', full?.title);
  for (const p of full?.parts || []) {
    if (p.part_number === 2 || p.title.includes('Part 2')) {
      console.log(`Part ${p.part_number}:`, p.title, `(${p.questions.length} questions)`);
      console.log(`  Instructions:`, p.instructions);
      for (const q of p.questions) {
        console.log(`  Q${q.question_number}: prompt="${q.prompt}"`);
        console.log(`  Q${q.question_number}: explanation="${q.explanation}"`);
      }
    }
  }

  await prisma.$disconnect();
}

run().catch(console.error);
