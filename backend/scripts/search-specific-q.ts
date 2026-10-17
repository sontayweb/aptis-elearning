import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const questions = await prisma.question.findMany({
    where: {
      prompt: { contains: 'Now you\'ve become a new member', mode: 'insensitive' }
    },
    include: {
      part: {
        include: { exam: true }
      }
    }
  });

  console.log('Total questions found with "Now you\'ve become a new member":', questions.length);
  for (const q of questions) {
    console.log('\nExam ID:', q.part.exam.id, '| Exam Title:', q.part.exam.title);
    console.log('Part ID:', q.part.id, '| Part Title:', q.part.title);
    console.log('Prompt:', q.prompt);
  }

  // Also search for "free time and hobbies"
  const qHobbies = await prisma.question.findMany({
    where: {
      prompt: { contains: 'free time and hobbies', mode: 'insensitive' }
    },
    include: {
      part: {
        include: { exam: true }
      }
    }
  });

  console.log('\nTotal questions found with "free time and hobbies":', qHobbies.length);
  for (const q of qHobbies) {
    console.log('Exam ID:', q.part.exam.id, '| Exam Title:', q.part.exam.title);
    console.log('Prompt:', q.prompt);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
