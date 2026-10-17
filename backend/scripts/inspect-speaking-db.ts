import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const speakingExams = await prisma.exam.findMany({
    where: { skill: 'SPEAKING' },
    include: {
      parts: {
        include: { questions: true }
      }
    },
    take: 15
  });

  console.log('Sample speaking exams:', speakingExams.length);
  for (const ex of speakingExams) {
    console.log(`\n===========================================`);
    console.log(`EXAM: [${ex.id}] "${ex.title}" | Parts: ${ex.parts.length}`);
    for (const p of ex.parts) {
      console.log(`  Part ${p.part_number}: "${p.title}" | image_url: ${p.image_url}`);
      for (const q of p.questions) {
        console.log(`    Q${q.question_number}: prompt="${q.prompt?.slice(0, 50)}" | image_url: ${q.image_url}`);
      }
    }
  }

  // Also check Full Tests (skill == 'FULL_TEST')
  const fullTests = await prisma.exam.findMany({
    where: { skill: 'FULL_TEST' },
    include: {
      parts: {
        where: {
          OR: [
            { title: { contains: 'Speaking', mode: 'insensitive' } },
            { title: { contains: 'Part 2', mode: 'insensitive' } },
            { title: { contains: 'Part 3', mode: 'insensitive' } },
            { title: { contains: 'Part 4', mode: 'insensitive' } },
          ]
        },
        include: { questions: true }
      }
    },
    take: 3
  });

  console.log('\n===========================================');
  console.log('Sample FULL_TEST Speaking parts:');
  for (const ft of fullTests) {
    console.log(`\nFT: "${ft.title}"`);
    for (const p of ft.parts) {
      if (p.title.toLowerCase().includes('speaking')) {
        console.log(`  Part: "${p.title}" | image_url: ${p.image_url}`);
        for (const q of p.questions) {
          console.log(`    Q: "${q.prompt?.slice(0, 40)}" | image_url: ${q.image_url}`);
        }
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
