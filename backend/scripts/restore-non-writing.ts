import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Restore Listening Đề 32
  const lisPart = await prisma.examPart.findFirst({
    where: { exam: { title: 'Đề 32 - Reading books' } },
    include: { questions: true }
  });
  if (lisPart && lisPart.questions.length > 0) {
    await prisma.question.update({
      where: { id: lisPart.questions[0].id },
      data: { prompt: "Four people are talking about reading books. Match each person to the correct information." }
    });
  }

  const lisFullPart = await prisma.examPart.findFirst({
    where: { exam: { title: 'Đề 32 — Full Listening · 4 Parts' }, part_number: 2 },
    include: { questions: true }
  });
  if (lisFullPart) {
    const spk = ['A', 'B', 'C', 'D'];
    for (let i = 0; i < lisFullPart.questions.length; i++) {
      await prisma.question.update({
        where: { id: lisFullPart.questions[i].id },
        data: { prompt: `Speaker ${spk[i]}` }
      });
    }
  }

  // Restore Speaking 3 người nằm trên cỏ đọc sách
  const spkPart = await prisma.examPart.findFirst({
    where: { exam: { title: '3 người nằm trên cỏ đọc sách' } },
    include: { questions: true }
  });
  if (spkPart && spkPart.questions.length >= 3) {
    await prisma.question.update({
      where: { id: spkPart.questions[0].id },
      data: { prompt: "Describe the picture." }
    });
    await prisma.question.update({
      where: { id: spkPart.questions[1].id },
      data: { prompt: "What books do you read?" }
    });
    await prisma.question.update({
      where: { id: spkPart.questions[2].id },
      data: { prompt: "Why is reading books important to children?" }
    });
  }

  console.log('Restored non-writing exams cleanly.');
  await prisma.$disconnect();
}

main().catch(console.error);
