import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const exams = await prisma.exam.findMany({
    where: { skill: 'SPEAKING' },
    include: { parts: { include: { questions: true } } },
    take: 20
  });

  for (const ex of exams) {
    console.log(`\n==================================================`);
    console.log(`EXAM: [${ex.id}] "${ex.title}" | Parts: ${ex.parts.length}`);
    for (const p of ex.parts) {
      console.log(`  Part num=${p.part_number} | title="${p.title}" | img="${p.image_url}" | qCount=${p.questions.length}`);
      for (const q of p.questions) {
        console.log(`    Q num=${q.question_number} | prompt="${q.prompt?.slice(0, 45)}" | opts=${JSON.stringify(q.options)}`);
      }
    }
  }

  // Also check FULL_TEST speaking parts
  const ftExams = await prisma.exam.findMany({
    where: { skill: 'FULL_TEST' },
    include: {
      parts: {
        where: {
          OR: [
            { title: { contains: 'Speaking', mode: 'insensitive' } },
            { title: { contains: 'Part 2', mode: 'insensitive' } },
            { title: { contains: 'Part 3', mode: 'insensitive' } },
            { title: { contains: 'Part 4', mode: 'insensitive' } },
          ]
        },
        include: { questions: true }
      }
    },
    take: 5
  });

  console.log(`\n==================================================`);
  console.log(`FULL TESTS SPEAKING:`);
  for (const ft of ftExams) {
    console.log(`\nFT: [${ft.id}] "${ft.title}"`);
    for (const p of ft.parts) {
      if (p.title.toLowerCase().includes('speaking')) {
        console.log(`  Part num=${p.part_number} | title="${p.title}" | img="${p.image_url}" | qCount=${p.questions.length}`);
      }
    }
  }
}

run().finally(() => prisma.$disconnect());
