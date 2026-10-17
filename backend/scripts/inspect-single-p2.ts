import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const p = await prisma.examPart.findUnique({
    where: { id: '0ac2b055-a39b-4272-a1ef-94226a0b85d1' },
    include: { questions: true }
  });
  console.log(JSON.stringify(p, null, 2));

  // Also check raw json files in tools/data to see where UUID answer comes from
  const rawQ = await prisma.question.findFirst({
    where: { correct_answer: '2e8d606f-2974-4783-8e80-6356f8e0038a' }
  });
  console.log('Raw Question with UUID answer:', rawQ);
}

run().finally(() => prisma.$disconnect());
