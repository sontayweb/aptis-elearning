import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const exams = await prisma.exam.findMany({
    where: {
      skill: 'WRITING',
      title: { contains: 'Book', mode: 'insensitive' }
    },
    include: {
      parts: {
        include: { questions: true }
      }
    }
  });

  console.log('Total Book exams in DB:', exams.length);
  for (const ex of exams) {
    console.log('\n=======================================');
    console.log('ID:', ex.id, '| Title:', ex.title);
    for (const p of ex.parts) {
      if (p.part_number === 2 || p.title.toLowerCase().includes('part 2') || ex.parts.length === 1) {
        console.log('  Part:', p.title, '(num: ' + p.part_number + ')');
        console.log('  Instructions:', p.instructions);
        for (const q of p.questions) {
          console.log('    Q prompt:', q.prompt);
          console.log('    Q explanation:', q.explanation?.slice(0, 80));
        }
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
