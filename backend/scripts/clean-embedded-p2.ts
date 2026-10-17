import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function cleanPart2Prompt(raw: string) {
  const m = raw.match(/^(.*?(?:fill in the form|write in sentences|recommended time:\s*\d+\s*minutes?|use 20[–-]30 words)[\.\s]+)(.+)$/i);
  if (m && m[2].trim().length > 5) {
    return {
      instruction: m[1].trim(),
      question: m[2].trim(),
    };
  }
  return null;
}

async function run() {
  const writingExams = await prisma.exam.findMany({
    where: { skill: 'WRITING' },
    include: { parts: { include: { questions: true } } },
  });

  let fixed = 0;
  for (const ex of writingExams) {
    for (const p of ex.parts) {
      if (p.title.toLowerCase().includes('part 2') || (ex.parts.length > 1 && p.part_number === 2)) {
        for (const q of p.questions) {
          const res = cleanPart2Prompt(q.prompt || '');
          if (res) {
            console.log(`Fixing [${ex.title}]`);
            console.log(`  Old: ${q.prompt}`);
            console.log(`  New Instruction: ${res.instruction}`);
            console.log(`  New Question: ${res.question}`);

            await prisma.examPart.update({
              where: { id: p.id },
              data: { instructions: res.instruction }
            });

            await prisma.question.update({
              where: { id: q.id },
              data: { prompt: res.question }
            });
            fixed++;
          }
        }
      }
    }
  }

  console.log(`\nFixed ${fixed} remaining Part 2 questions!`);
  await prisma.$disconnect();
}

run().catch(console.error);
