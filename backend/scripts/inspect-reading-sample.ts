import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const parts = await prisma.examPart.findMany({
    where: { exam: { skill: 'READING' }, passage_text: { not: null } },
    take: 3,
    select: { id: true, part_number: true, title: true, passage_text: true }
  });

  for (const p of parts) {
    console.log(`\n--- PART ${p.part_number} (${p.title}) ---`);
    console.log(p.passage_text?.slice(0, 300));
  }

  await prisma.$disconnect();
}

run().catch(console.error);
