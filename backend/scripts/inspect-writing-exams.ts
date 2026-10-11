import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const writingExams = await prisma.exam.findMany({
    where: { skill: 'WRITING' },
    include: {
      parts: {
        include: {
          _count: { select: { questions: true } },
        },
      },
    },
    take: 10,
  });

  console.log('Tổng số đề Writing lấy mẫu:', writingExams.length);
  for (const e of writingExams) {
    console.log(`\nExam: [${e.id}] ${e.title}`);
    console.log(`Parts count: ${e.parts.length}`);
    for (const p of e.parts) {
      console.log(`  - Part ${p.part_number}: ${p.title} (Questions: ${p._count.questions})`);
    }
  }
}

main().finally(() => prisma.$disconnect());
