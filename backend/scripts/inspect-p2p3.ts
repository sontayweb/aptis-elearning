import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const parts = await prisma.examPart.findMany({
    where: { exam: { skill: 'SPEAKING' } },
    select: {
      id: true,
      title: true,
      part_number: true,
      image_url: true,
      exam: { select: { id: true, title: true } },
      questions: { select: { id: true, prompt: true, options: true } }
    }
  });

  console.log('Total speaking parts:', parts.length);
  let p2p3 = 0, withImg = 0, nullImg = 0;
  const nullExamples: any[] = [];
  const imgExamples: any[] = [];

  for (const p of parts) {
    const is23 = p.part_number === 2 || p.part_number === 3 ||
      /part\s*[23]/i.test(p.title) || /part\s*[23]/i.test(p.exam.title);
    if (is23) {
      p2p3++;
      if (p.image_url) {
        withImg++;
        imgExamples.push({ exam: p.exam.title, part: p.title, img: p.image_url });
      } else {
        nullImg++;
        nullExamples.push({ exam: p.exam.title, part: p.title, q1: p.questions[0]?.prompt });
      }
    }
  }

  console.log(`Part 2 & 3 total: ${p2p3} | with image_url: ${withImg} | null image_url: ${nullImg}`);
  console.log('Sample WITH image:', imgExamples.slice(0, 5));
  console.log('Sample NULL image:', nullExamples.slice(0, 10));
}

run().finally(() => prisma.$disconnect());
