import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const parts = await prisma.examPart.findMany({
    where: {
      OR: [
        { title: { contains: 'Part 2', mode: 'insensitive' } },
        { title: { contains: 'Part 3', mode: 'insensitive' } },
        { title: { contains: 'Part 4', mode: 'insensitive' } },
        { exam: { title: { contains: 'Part 2', mode: 'insensitive' } } },
        { exam: { title: { contains: 'Part 3', mode: 'insensitive' } } },
        { exam: { title: { contains: 'Part 4', mode: 'insensitive' } } },
      ]
    },
    select: { title: true, part_number: true, exam: { select: { title: true, skill: true } } },
    take: 40
  });

  console.log(parts.map(p => ({
    exam: p.exam.title,
    skill: p.exam.skill,
    part: p.title,
    part_number: p.part_number
  })));
}

run().finally(() => prisma.$disconnect());
