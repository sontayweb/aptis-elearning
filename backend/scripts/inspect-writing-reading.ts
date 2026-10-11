import { PrismaClient, ExamSkill } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectWritingAndReading() {
  console.log('=== CHI TIẾT WRITING (TẤT CẢ PHÂN LOẠI) ===');
  const writingExams = await prisma.exam.findMany({
    where: { skill: ExamSkill.WRITING },
    select: {
      id: true,
      title: true,
      parts: {
        select: {
          part_number: true,
          title: true,
          _count: { select: { questions: true } },
        },
      },
    },
  });

  const writingPartCounts: Record<number, number> = {};
  for (const e of writingExams) {
    const c = e.parts.length;
    writingPartCounts[c] = (writingPartCounts[c] || 0) + 1;
  }
  console.log(`Tổng số đề Writing: ${writingExams.length}`);
  console.log('Phân bố số Part trong Writing:', writingPartCounts);

  const fullWritingExams = writingExams.filter((e) => e.parts.length === 4);
  console.log(`Số đề Writing có đủ 4 Part: ${fullWritingExams.length}`);
  for (const e of fullWritingExams.slice(0, 5)) {
    console.log(`  - [${e.id}] ${e.title}`);
  }

  const singlePartWriting = writingExams.filter((e) => e.parts.length === 1);
  console.log(`Số đề Writing chỉ có 1 Part: ${singlePartWriting.length}`);
  for (const e of singlePartWriting.slice(0, 5)) {
    console.log(`  - [${e.id}] ${e.title} -> Part: ${e.parts[0]?.title} (${e.parts[0]?._count.questions} qs)`);
  }

  console.log('\n=== CHI TIẾT READING (TẤT CẢ PHÂN LOẠI) ===');
  const readingExams = await prisma.exam.findMany({
    where: { skill: ExamSkill.READING },
    select: {
      id: true,
      title: true,
      parts: {
        select: {
          part_number: true,
          title: true,
          _count: { select: { questions: true } },
        },
      },
    },
  });

  const readingPartCounts: Record<number, number> = {};
  for (const e of readingExams) {
    const c = e.parts.length;
    readingPartCounts[c] = (readingPartCounts[c] || 0) + 1;
  }
  console.log(`Tổng số đề Reading: ${readingExams.length}`);
  console.log('Phân bố số Part trong Reading:', readingPartCounts);
  
  const fullReading = readingExams.filter((e) => e.parts.length >= 4);
  console.log(`Số đề Reading có >= 4 Part: ${fullReading.length}`);
}

inspectWritingAndReading().finally(() => prisma.$disconnect());
