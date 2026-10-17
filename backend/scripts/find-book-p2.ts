import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const parts = await prisma.examPart.findMany({
    where: {
      OR: [
        { title: { contains: 'Part 2', mode: 'insensitive' } },
        { part_number: 2 }
      ],
      questions: {
        some: {
          prompt: { contains: 'Book Club', mode: 'insensitive' }
        }
      }
    },
    include: {
      exam: true,
      questions: true
    }
  });

  console.log('Parts where question contains "Book Club":', parts.length);
  for (const p of parts) {
    console.log(`\nExam [${p.exam.skill}]: "${p.exam.title}" (ID: ${p.exam.id})`);
    console.log(`Part: "${p.title}" (part_number: ${p.part_number})`);
    console.log(`Instructions: "${p.instructions}"`);
    for (const q of p.questions) {
      console.log(`  Question ID: ${q.id} | Prompt: "${q.prompt}"`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
