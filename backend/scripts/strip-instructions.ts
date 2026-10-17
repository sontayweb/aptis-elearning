import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
          let prompt = q.prompt || '';
          if (/write in sentences|use 20[–-]30 words/i.test(prompt)) {
            const cleaned = prompt
              .replace(/^(?:you are a new member[^.]*\.\s*)?/i, '')
              .replace(/^(?:fill in the form[^.]*\.\s*)?/i, '')
              .replace(/^(?:write in sentences[^.]*\.\s*)?/i, '')
              .replace(/^(?:use 20[–-]30 words[^.]*\.\s*)?/i, '')
              .replace(/^(?:recommended time:[^.]*\.\s*)?/i, '')
              .trim();

            if (cleaned.length > 5 && cleaned !== prompt) {
              console.log(`Cleaned prompt for [${ex.title}]: "${cleaned}"`);
              await prisma.question.update({
                where: { id: q.id },
                data: { prompt: cleaned }
              });
              fixed++;
            }
          }
        }
      }
    }
  }

  console.log(`\nCleaned ${fixed} questions!`);
  await prisma.$disconnect();
}

run().catch(console.error);
