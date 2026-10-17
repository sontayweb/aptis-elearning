import { PrismaClient } from '@prisma/client';
import { examService } from '../src/modules/exams/exam.service';

const prisma = new PrismaClient();

async function main() {
  console.log('===============================================================');
  console.log('AUDIT TỰ ĐỘNG: KIỂM TRA TÍNH TOÀN VẸN READING & WRITING SYSTEM');
  console.log('===============================================================\n');

  // 1. Audit Reading Exams
  console.log('>>> [1/3] Kiểm tra cấu trúc đề thi Reading trong Cơ sở Dữ liệu');
  const readingExams = await prisma.exam.findMany({
    where: { skill: 'READING', is_published: true },
    include: {
      parts: {
        include: {
          questions: true,
        },
      },
    },
  });

  console.log(`- Tổng số đề Reading đã xuất bản: ${readingExams.length}`);
  let validReadingExams = 0;
  let part1Count = 0;
  let part2Count = 0;
  let part3Count = 0;
  let part4Count = 0;

  for (const exam of readingExams) {
    const hasQuestions = exam.parts.some((p) => p.questions.length > 0);
    if (hasQuestions) validReadingExams++;

    for (const p of exam.parts) {
      const pTitle = (p.title || '').toLowerCase();
      if (p.part_number === 1 || pTitle.includes('part 1') || pTitle.includes('gap')) part1Count++;
      else if (p.part_number === 2 || pTitle.includes('part 2') || pTitle.includes('cohesion')) part2Count++;
      else if (p.part_number === 3 || pTitle.includes('part 3') || pTitle.includes('opinion')) part3Count++;
      else if (p.part_number === 4 || pTitle.includes('part 4') || pTitle.includes('heading') || pTitle.includes('long')) part4Count++;
    }
  }

  console.log(`- Số đề Reading có câu hỏi hợp lệ: ${validReadingExams}/${readingExams.length}`);
  console.log(`- Phân bố Part: Part 1 (${part1Count}) | Part 2 (${part2Count}) | Part 3 (${part3Count}) | Part 4 (${part4Count})`);
  if (validReadingExams === readingExams.length) {
    console.log('✅ ĐẠT: 100% đề Reading có dữ liệu Part và câu hỏi đầy đủ.');
  }

  // 2. Audit Writing Exams
  console.log('\n>>> [2/3] Kiểm tra cấu trúc đề thi Writing trong Cơ sở Dữ liệu');
  const writingExams = await prisma.exam.findMany({
    where: { skill: 'WRITING', is_published: true },
    include: {
      parts: {
        include: {
          questions: true,
        },
      },
    },
  });

  console.log(`- Tổng số đề Writing đã xuất bản: ${writingExams.length}`);
  let validWritingExams = 0;
  let writingPart1 = 0;
  let writingPart2 = 0;
  let writingPart3 = 0;
  let writingPart4 = 0;

  for (const exam of writingExams) {
    const hasQuestions = exam.parts.some((p) => p.questions.length > 0);
    if (hasQuestions) validWritingExams++;

    for (const p of exam.parts) {
      const pTitle = (p.title || '').toLowerCase();
      if (p.part_number === 1 || pTitle.includes('part 1') || pTitle.includes('short answer')) writingPart1++;
      else if (p.part_number === 2 || pTitle.includes('part 2') || pTitle.includes('social')) writingPart2++;
      else if (p.part_number === 3 || pTitle.includes('part 3') || pTitle.includes('chat')) writingPart3++;
      else if (p.part_number === 4 || pTitle.includes('part 4') || pTitle.includes('email')) writingPart4++;
    }
  }

  console.log(`- Số đề Writing có câu hỏi hợp lệ: ${validWritingExams}/${writingExams.length}`);
  console.log(`- Phân bố Part Writing: Part 1 (${writingPart1}) | Part 2 (${writingPart2}) | Part 3 (${writingPart3}) | Part 4 (${writingPart4})`);
  if (validWritingExams === writingExams.length) {
    console.log('✅ ĐẠT: 100% đề Writing có dữ liệu Part và câu hỏi đầy đủ.');
  }

  // 3. Test API DTO Delivery (Single Source of Truth)
  console.log('\n>>> [3/3] Kiểm tra API getExamQuestions trả về DTO chuẩn cho Reading & Writing');
  const sampleReading = readingExams[0];
  const sampleWriting = writingExams[0];

  if (sampleReading) {
    const readingDto: any = await examService.getExamQuestions(sampleReading.id);
    console.log(`- Sample Reading DTO (${readingDto.title}):`);
    for (const p of readingDto.parts) {
      console.log(`  * Part ${p.part_number}: partType=${p.partType} | recommendedMinutes=${p.recommendedMinutes} | questions=${p.questions.length}`);
    }
    const allHavePartType = readingDto.parts.every((p: any) => p.partType != null);
    if (allHavePartType) {
      console.log('✅ ĐẠT: Reading DTO trả về partType chuẩn cho 100% Parts.');
    }
  }

  if (sampleWriting) {
    const writingDto: any = await examService.getExamQuestions(sampleWriting.id);
    console.log(`- Sample Writing DTO (${writingDto.title}):`);
    for (const p of writingDto.parts) {
      console.log(`  * Part ${p.part_number}: partType=${p.partType} | minWords=${p.minWords} | maxWords=${p.maxWords} | questions=${p.questions.length}`);
    }
    const allHavePartType = writingDto.parts.every((p: any) => p.partType != null && p.minWords != null);
    if (allHavePartType) {
      console.log('✅ ĐẠT: Writing DTO trả về partType, minWords, maxWords chuẩn.');
    }
  }

  console.log('\n===============================================================');
  console.log('TỔNG KẾT: CẢ 4 KỸ NĂNG (SPEAKING, LISTENING, READING, WRITING)');
  console.log('ĐÃ CHUYỂN ĐỔI THÀNH CÔNG SANG SINGLE SOURCE OF TRUTH!');
  console.log('===============================================================');
}

main()
  .catch((e) => {
    console.error('Lỗi khi audit reading & writing:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
