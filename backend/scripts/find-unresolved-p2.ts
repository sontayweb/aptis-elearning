import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const writingExams = await prisma.exam.findMany({
    where: { skill: 'WRITING' },
    include: { parts: { include: { questions: true } } },
  });

  console.log('--- Unresolved Part 2 Sub-Exams ---');
  for (const ex of writingExams) {
    const isP2Sub = ex.title.toLowerCase().includes('part 2') || (ex.parts.length === 1 && ex.parts[0].title.toLowerCase().includes('part 2'));
    if (isP2Sub) {
      const p = ex.parts[0];
      const q = p?.questions[0];
      const prompt = q?.prompt || '';
      if (prompt.toLowerCase().includes('fill in the form') || prompt.toLowerCase().includes('sentences') || prompt.toLowerCase().includes('recommended time')) {
        console.log(`Sub-exam: [${ex.id}] "${ex.title}" | prompt: "${prompt}"`);
      }
    }
  }

  console.log('\n--- Unresolved Part 2 in Full Exams ---');
  for (const ex of writingExams) {
    if (ex.parts.length > 1) {
      const p2 = ex.parts.find(p => p.part_number === 2 || p.title.toLowerCase().includes('part 2'));
      if (p2) {
        const q = p2.questions[0];
        const prompt = q?.prompt || '';
        if (prompt.toLowerCase().includes('fill in the form') || prompt.toLowerCase().includes('sentences')) {
          console.log(`Full Exam: [${ex.id}] "${ex.title}" | prompt: "${prompt}"`);
        }
      }
    }
  }

  await prisma.$disconnect();
}

run().catch(console.error);
