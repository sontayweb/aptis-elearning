import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const p4SubExams = await prisma.exam.findMany({
    where: {
      skill: 'WRITING',
      title: { contains: 'Writing Part 4' }
    },
    include: { parts: { include: { questions: true } } },
    take: 5
  });

  console.log('--- Sample Part 4 Sub-Exams ---');
  for (const ex of p4SubExams) {
    console.log(`\nEXAM: ${ex.title}`);
    for (const p of ex.parts) {
      console.log(`Part ${p.part_number}: ${p.title}`);
      console.log(`  Instructions:`, p.instructions);
      console.log(`  Passage / Scenario:`, p.passage_text?.slice(0, 100));
      console.log(`  Questions count:`, p.questions.length);
      for (const q of p.questions) {
        console.log(`    Q${q.question_number}: prompt="${q.prompt?.slice(0, 80)}"`);
      }
    }
  }

  // Also sample Part 1 and Part 3
  const p1Sub = await prisma.exam.findFirst({
    where: { skill: 'WRITING', title: { contains: 'Writing Part 1' } },
    include: { parts: { include: { questions: true } } }
  });
  console.log('\n--- Sample Part 1 Sub-Exam ---');
  console.log(`EXAM: ${p1Sub?.title}, Q count: ${p1Sub?.parts[0]?.questions.length}`);
  p1Sub?.parts[0]?.questions.forEach(q => console.log(`  Q${q.question_number}: ${q.prompt}`));

  const p3Sub = await prisma.exam.findFirst({
    where: { skill: 'WRITING', title: { contains: 'Writing Part 3' } },
    include: { parts: { include: { questions: true } } }
  });
  console.log('\n--- Sample Part 3 Sub-Exam ---');
  console.log(`EXAM: ${p3Sub?.title}, Q count: ${p3Sub?.parts[0]?.questions.length}`);
  p3Sub?.parts[0]?.questions.forEach(q => console.log(`  Q${q.question_number}: ${q.prompt?.slice(0, 80)}`));

  await prisma.$disconnect();
}

run().catch(console.error);
