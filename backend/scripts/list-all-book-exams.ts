import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const exams = await prisma.exam.findMany({
    where: {
      title: { contains: 'Book', mode: 'insensitive' }
    },
    include: {
      parts: {
        include: { questions: true }
      }
    }
  });

  console.log(`Found ${exams.length} Book exams:`);
  for (const ex of exams) {
    console.log(`\n======================================================`);
    console.log(`[${ex.skill}] ID: ${ex.id} | "${ex.title}" | Parts: ${ex.parts.length}`);
    for (const p of ex.parts) {
      if (p.part_number === 2 || p.title.toLowerCase().includes('part 2') || (p.title.toLowerCase().includes('writing') && p.title.toLowerCase().includes('2'))) {
        console.log(`  Part ${p.part_number}: "${p.title}"`);
        console.log(`  Instructions: "${p.instructions}"`);
        for (const q of p.questions) {
          console.log(`    Q prompt: "${q.prompt}"`);
        }
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
