import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const p2Exams = await prisma.exam.findMany({
    where: { skill: 'LISTENING', parts: { some: { part_number: 2 } } },
    take: 2,
    include: {
      parts: {
        include: { questions: true }
      }
    }
  });

  for (const e of p2Exams) {
    console.log(`\nEXAM: ${e.title} (${e.id}) - parts count: ${e.parts.length}`);
    for (const p of e.parts) {
      console.log(`  -> Part ${p.part_number} (${p.title}): ${p.questions.length} questions | passage: ${p.passage_text?.slice(0, 100)}`);
    }
  }

  await prisma.$disconnect();
}

run().catch(console.error);
