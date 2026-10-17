import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const writingExams = await prisma.exam.findMany({
    where: { skill: 'WRITING' },
    include: { parts: { include: { questions: true } } },
    orderBy: { title: 'asc' },
  });

  console.log('Writing exams found:', writingExams.length);
  for (const ex of writingExams.slice(0, 15)) {
    console.log('\n=============================================');
    console.log(`EXAM: [${ex.id}] "${ex.title}" | Parts: ${ex.parts.length}`);
    for (const p of ex.parts) {
      console.log(`  Part ${p.part_number}: "${p.title}" | Questions: ${p.questions.length}`);
      for (const q of p.questions) {
        console.log(`    Q${q.question_number}: prompt="${q.prompt?.slice(0, 70)}"`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
