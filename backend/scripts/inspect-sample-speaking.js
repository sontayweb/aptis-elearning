const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const parts = await prisma.examPart.findMany({
    where: {
      OR: [
        { exam: { title: { contains: 'Full Test 07' } } },
        { exam: { title: { contains: 'Full Test 11' } } },
        { exam: { title: { contains: 'Sử dụng máy tính' } } },
        { exam: { title: { contains: 'Mẹ và con đọc sách' } } },
        { exam: { title: { contains: 'Cô gái trồng rau' } } },
        { exam: { title: { contains: 'Mua đồ xa xỉ' } } }
      ]
    },
    include: { exam: true, questions: true }
  });
  for (const p of parts) {
    if (p.title.toLowerCase().includes('speaking') || p.exam.skill === 'SPEAKING') {
      console.log('EXAM:', p.exam.title, '| PART:', p.title, '| num:', p.part_number, '| img:', p.image_url);
      for (const q of p.questions) {
        console.log('  Q:', q.prompt);
      }
    }
  }
}
run().finally(() => prisma.$disconnect());
