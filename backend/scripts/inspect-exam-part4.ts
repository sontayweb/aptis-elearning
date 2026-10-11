import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const parts = await prisma.examPart.findMany({
    where: { part_number: 4, exam: { skill: 'SPEAKING' } },
    include: {
      questions: true,
      exam: { select: { title: true } },
    },
    take: 6,
  });

  for (const p of parts) {
    console.log(`\nExam: ${p.exam.title} (${p.exam_id}) - Part 4 questions: ${p.questions.length}`);
    for (const q of p.questions) {
      console.log(`  - Question [${q.id}]: ${JSON.stringify(q.prompt)} | options: ${JSON.stringify(q.options)}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
