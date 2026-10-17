import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ex = await prisma.exam.findUnique({
    where: { id: '87906eac-08c3-4648-824f-12c21cd11e9c' },
    include: {
      parts: {
        include: { questions: true }
      }
    }
  });

  console.log('Exam:', ex?.title, '| Skill:', ex?.skill);
  for (const p of ex?.parts || []) {
    console.log(`Part ${p.part_number}:`, p.title);
    console.log('Instructions:', p.instructions);
    for (const q of p.questions) {
      console.log(`  Q: ${q.prompt}`);
      console.log(`  Ans: ${q.explanation}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
