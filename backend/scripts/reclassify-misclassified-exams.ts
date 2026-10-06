import { PrismaClient, ExamSkill } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const mis = await prisma.exam.findMany({
    where: {
      skill: 'FULL_TEST',
      NOT: { title: { startsWith: 'Đề thi thử Aptis ESOL Full Test' } },
    },
    include: { parts: { select: { title: true } } },
  });

  console.log(`Tìm thấy ${mis.length} bộ đề đơn kỹ năng đang bị gắn nhầm skill FULL_TEST.`);

  let updated = 0;
  for (const e of mis) {
    const text = (e.title + ' ' + e.parts.map((p) => p.title).join(' ')).toLowerCase();
    let newSkill: ExamSkill = ExamSkill.READING;

    if (text.includes('listen') || text.includes('nghe') || text.includes('lis ') || text.includes('audio')) {
      newSkill = ExamSkill.LISTENING;
    } else if (text.includes('writing') || text.includes('club') || text.includes('viết') || text.includes('email')) {
      newSkill = ExamSkill.WRITING;
    } else if (text.includes('speak') || text.includes('nói') || text.includes('ghi âm')) {
      newSkill = ExamSkill.SPEAKING;
    } else if (text.includes('grammar') || text.includes('gv') || text.includes('vocab') || text.includes('ngữ pháp')) {
      newSkill = ExamSkill.GRAMMAR_VOCABULARY;
    } else if (text.includes('reading') || text.includes('đọc')) {
      newSkill = ExamSkill.READING;
    } else {
      newSkill = ExamSkill.READING;
    }

    await prisma.exam.update({
      where: { id: e.id },
      data: { skill: newSkill },
    });
    updated++;
  }

  console.log(`✅ Đã phân loại lại chuẩn xác ${updated} bộ đề theo đúng kỹ năng đơn lẻ!`);

  const fullTestsCount = await prisma.exam.count({
    where: { skill: ExamSkill.FULL_TEST },
  });
  console.log(`🎉 Hiện tại mục FULL_TEST có đúng ${fullTestsCount} đề chuẩn 5 kỹ năng!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
