const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const parts = await prisma.examPart.findMany({
    where: {
      exam: { title: { contains: 'Full Test 07' } },
      title: { contains: 'Part 3' }
    },
    include: { questions: true }
  });
  for (const p of parts) {
    console.log('PART ID:', p.id, 'title:', p.title, 'img:', p.image_url);
    for (const q of p.questions) {
      console.log('  Q:', q.prompt, 'options:', q.options);
    }
  }
}
run().finally(() => prisma.$disconnect());
