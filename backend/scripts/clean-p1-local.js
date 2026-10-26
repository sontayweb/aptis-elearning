const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanP1Local() {
  const exams = await prisma.exam.findMany({
    where: {
      skill: 'READING',
      title: { contains: 'Reading Part 1' }
    }
  });

  console.log(`Found ${exams.length} Reading Part 1 exams on local DB...`);
  let updated = 0;
  for (const e of exams) {
    const clean = e.title.replace(/\s*[-–]\s*Reading Part 1.*/i, '').trim();
    if (clean !== e.title) {
      await prisma.exam.update({
        where: { id: e.id },
        data: { title: clean }
      });
      updated++;
    }
  }

  console.log(`Local DB: Renamed ${updated} Reading Part 1 exams.`);
}

cleanP1Local()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
  });
