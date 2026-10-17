const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const parts = await prisma.examPart.findMany({
    where: { image_url: { contains: 'de' } },
    select: { id: true, title: true, image_url: true, exam: { select: { title: true } } },
    take: 30
  });
  console.log(parts);
}
run().finally(() => prisma.$disconnect());
