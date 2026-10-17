import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allQuestions = await prisma.question.findMany({
    where: {
      OR: [
        { prompt: { contains: "become a new member", mode: 'insensitive' } },
        { prompt: { contains: "Fill in the form", mode: 'insensitive' } },
        { prompt: { contains: "You are a new member", mode: 'insensitive' } },
      ]
    },
    include: {
      part: {
        include: { exam: true }
      }
    }
  });

  console.log('Total questions still containing instruction text in prompt:', allQuestions.length);
  for (const q of allQuestions) {
    console.log(`Exam: [${q.part.exam.skill}] "${q.part.exam.title}" | Part: "${q.part.title}"`);
    console.log(`  Prompt: "${q.prompt}"`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
