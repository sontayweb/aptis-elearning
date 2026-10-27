import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../src/config/database';

async function main() {
  console.log('================================================================');
  console.log('  DỌN DẸP CÁC ĐỀ READING KEY BỊ LỖI & BỔ SUNG 2 ĐỀ HOT FOUR-DAY');
  console.log('================================================================\n');

  // 1. TÌM TẤT CẢ CÁC ĐỀ READING CÓ PART BẮT ĐẦU BẰNG "Key PART" HOẶC 0 CÂU HỎI VÀ CÓ CHỮ KEY
  const readingExams = await prisma.exam.findMany({
    where: { skill: 'READING' },
    include: {
      parts: {
        include: {
          questions: true,
        },
      },
    },
  });

  const examsToDelete: any[] = [];

  for (const e of readingExams) {
    const totalQ = e.parts.reduce((sum, p) => sum + p.questions.length, 0);
    const hasKeyPart = e.parts.some((p) => {
      const pTitle = (p.title || '').trim().toLowerCase();
      return pTitle.startsWith('key part') || pTitle === 'key';
    });
    const titleLower = e.title.toLowerCase();
    const hasKeyTitle = titleLower.includes('bộ key reading') || titleLower.includes('( key)') || titleLower.includes('(key)');

    // Nếu đề có 0 câu hỏi và (có part Key PART hoặc title là Key)
    if (totalQ === 0 && (hasKeyPart || hasKeyTitle)) {
      examsToDelete.push(e);
    }
  }

  console.log(`Tìm thấy ${examsToDelete.length} đề Reading rác (0 câu hỏi, Key PART) cần xóa.`);

  // Sao lưu danh sách ID và title ra file JSON trước khi xóa
  const backupPath = path.resolve(__dirname, '../backups/deleted_reading_key_exams.json');
  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      examsToDelete.map((e) => ({
        id: e.id,
        title: e.title,
        parts: e.parts.map((p: any) => ({ id: p.id, title: p.title })),
      })),
      null,
      2
    ),
    'utf-8'
  );
  console.log(`[OK] Đã sao lưu danh sách đề cần xóa vào: ${backupPath}`);

  // Thực hiện xóa các đề này
  const idsToDelete = examsToDelete.map((e) => e.id);
  if (idsToDelete.length > 0) {
    // Xóa questions nếu có
    await prisma.question.deleteMany({
      where: {
        part: {
          exam_id: { in: idsToDelete },
        },
      },
    });

    // Xóa parts
    await prisma.examPart.deleteMany({
      where: {
        exam_id: { in: idsToDelete },
      },
    });

    // Xóa submissions nếu có
    await prisma.submissionAnswer.deleteMany({
      where: {
        submission: {
          exam_id: { in: idsToDelete },
        },
      },
    });
    await prisma.examSubmission.deleteMany({
      where: {
        exam_id: { in: idsToDelete },
      },
    });

    // Xóa exam
    const delRes = await prisma.exam.deleteMany({
      where: {
        id: { in: idsToDelete },
      },
    });

    console.log(`[OK] Đã xóa thành công ${delRes.count} đề Reading rác khỏi CSDL!\n`);
  }

  // 2. BỔ SUNG / CHUẨN HÓA 2 ĐỀ HOT "THE ARRIVAL OF FOUR-DAY WEEK VER 1 + VER 2"
  console.log('----------------------------------------------------------------');
  console.log('  CHUẨN HÓA 2 ĐỀ HOT: THE ARRIVAL OF FOUR-DAY WEEK VER 1 & VER 2');
  console.log('----------------------------------------------------------------');

  // Lấy dữ liệu nguồn chuẩn từ Full Test 09 (Version 1) và Full Test 25 (Version 2)
  const ft09Part = await prisma.examPart.findFirst({
    where: { id: 'e1edb964-54d9-445e-a85f-60fdbce41aa7' },
    include: { questions: true },
  });

  const ft25Part = await prisma.examPart.findFirst({
    where: { id: '38960c71-897c-4c8a-b564-b215d99105ea' },
    include: { questions: true },
  });

  if (!ft09Part || !ft25Part) {
    console.error('[!] Không tìm thấy dữ liệu nguồn trong FT09 hoặc FT25');
    return;
  }

  console.log(`Nguồn Ver 1: FT09 Part 4 có ${ft09Part.questions.length} câu hỏi`);
  console.log(`Nguồn Ver 2: FT25 Part 4 có ${ft25Part.questions.length} câu hỏi`);

  // --- VERSION 1 ---
  // Tìm hoặc tạo đề "Đề 09 - The Arrival of the Four-Day Work Week (Version 1)"
  let ver1Exam = await prisma.exam.findFirst({
    where: {
      skill: 'READING',
      title: { contains: 'Arrival of the Four-Day Work Week', mode: 'insensitive' },
      NOT: { title: { contains: 'Version 2', mode: 'insensitive' } },
    },
    include: { parts: { include: { questions: true } } },
  });

  if (!ver1Exam) {
    ver1Exam = await prisma.exam.create({
      data: {
        title: 'Đề 09 - The Arrival of the Four-Day Work Week (Version 1)',
        description: 'Part 5 – Long reading: The arrival of four-day week (Đề tủ Siêu Hot ☘️☘️☘️☘️☘️)',
        skill: 'READING',
        duration_minutes: 15,
        is_pro: false,
        is_published: true,
        hot_level: 5, // Siêu hot ☘️☘️☘️☘️☘️
        forecast_tag: 'Đề Tủ Siêu Hot',
      },
      include: { parts: { include: { questions: true } } },
    });
  } else {
    await prisma.exam.update({
      where: { id: ver1Exam.id },
      data: {
        title: 'Đề 09 - The Arrival of the Four-Day Work Week (Version 1)',
        description: 'Part 5 – Long reading: The arrival of four-day week (Đề tủ Siêu Hot ☘️☘️☘️☘️☘️)',
        hot_level: 5,
        is_pro: false,
        forecast_tag: 'Đề Tủ Siêu Hot',
        is_published: true,
      },
    });
  }

  // Đồng bộ part và questions cho Version 1
  let part1 = ver1Exam.parts[0];
  if (!part1) {
    part1 = await prisma.examPart.create({
      data: {
        exam_id: ver1Exam.id,
        part_number: 5,
        title: 'Part 5 – Long reading',
        instructions: ft09Part.instructions || 'Read the passage and choose the correct heading for each paragraph.',
        passage_text: ft09Part.passage_text,
      },
      include: { questions: true },
    });
  } else {
    await prisma.examPart.update({
      where: { id: part1.id },
      data: {
        part_number: 5,
        title: 'Part 5 – Long reading',
        instructions: ft09Part.instructions || 'Read the passage and choose the correct heading for each paragraph.',
        passage_text: ft09Part.passage_text,
      },
    });
  }

  // Đảm bảo đủ 7 câu hỏi matching headings cho Version 1
  await prisma.question.deleteMany({ where: { part_id: part1.id } });
  for (const q of ft09Part.questions) {
    await prisma.question.create({
      data: {
        part_id: part1.id,
        question_number: q.question_number,
        question_type: q.question_type,
        prompt: q.prompt,
        options: q.options as any,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        max_score: q.max_score,
      },
    });
  }
  console.log(`[OK] Đã chuẩn hóa xong Version 1 (ID: ${ver1Exam.id}) với 7 câu hỏi & hot_level = 5!`);

  // --- VERSION 2 ---
  let ver2Exam = await prisma.exam.findFirst({
    where: {
      skill: 'READING',
      title: { contains: 'Arrival of the Four-Day Work Week (Version 2)', mode: 'insensitive' },
    },
    include: { parts: { include: { questions: true } } },
  });

  if (!ver2Exam) {
    ver2Exam = await prisma.exam.create({
      data: {
        title: 'Đề 35 - The Arrival of the Four-Day Work Week (Version 2)',
        description: 'Part 5 – Long reading: The arrival of four-day week Version 2 (Đề tủ Siêu Hot ☘️☘️☘️☘️☘️)',
        skill: 'READING',
        duration_minutes: 15,
        is_pro: false,
        is_published: true,
        hot_level: 5, // Siêu hot ☘️☘️☘️☘️☘️
        forecast_tag: 'Đề Tủ Siêu Hot',
      },
      include: { parts: { include: { questions: true } } },
    });
  } else {
    await prisma.exam.update({
      where: { id: ver2Exam.id },
      data: {
        title: 'Đề 35 - The Arrival of the Four-Day Work Week (Version 2)',
        description: 'Part 5 – Long reading: The arrival of four-day week Version 2 (Đề tủ Siêu Hot ☘️☘️☘️☘️☘️)',
        hot_level: 5,
        is_pro: false,
        forecast_tag: 'Đề Tủ Siêu Hot',
        is_published: true,
      },
    });
  }

  // Đồng bộ part và questions cho Version 2
  let part2 = ver2Exam.parts[0];
  if (!part2) {
    part2 = await prisma.examPart.create({
      data: {
        exam_id: ver2Exam.id,
        part_number: 5,
        title: 'Part 5 – Long reading',
        instructions: ft25Part.instructions || 'Read the passage and choose the correct heading for each paragraph.',
        passage_text: ft25Part.passage_text,
      },
      include: { questions: true },
    });
  } else {
    await prisma.examPart.update({
      where: { id: part2.id },
      data: {
        part_number: 5,
        title: 'Part 5 – Long reading',
        instructions: ft25Part.instructions || 'Read the passage and choose the correct heading for each paragraph.',
        passage_text: ft25Part.passage_text,
      },
    });
  }

  await prisma.question.deleteMany({ where: { part_id: part2.id } });
  for (const q of ft25Part.questions) {
    await prisma.question.create({
      data: {
        part_id: part2.id,
        question_number: q.question_number,
        question_type: q.question_type,
        prompt: q.prompt,
        options: q.options as any,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        max_score: q.max_score,
      },
    });
  }
  console.log(`[OK] Đã chuẩn hóa xong Version 2 (ID: ${ver2Exam.id}) với 7 câu hỏi & hot_level = 5!`);

  console.log('\n🎉 HOÀN TẤT TOÀN BỘ QUÁ TRÌNH DỌN DẸP VÀ CHUẨN HÓA READING!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
