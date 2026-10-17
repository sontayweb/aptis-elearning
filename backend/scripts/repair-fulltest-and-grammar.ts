import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('===============================================================');
  console.log('BẮT ĐẦU CHUẨN HÓA DỮ LIỆU FULL_TEST VÀ GRAMMAR_VOCABULARY');
  console.log('===============================================================\n');

  // 1. Chuẩn hóa tất cả các Part Speaking bên trong các đề FULL_TEST
  console.log('>>> [1/3] Chuẩn hóa các Part Speaking trong đề FULL_TEST...');
  const fullTests = await prisma.exam.findMany({
    where: { skill: 'FULL_TEST' },
    include: { parts: true },
  });

  const projectRoot = path.resolve(__dirname, '../../');
  const backendUploads = path.join(projectRoot, 'backend', 'uploads');
  const frontendPublic = path.join(projectRoot, 'frontend', 'public');

  let fixedFtPart4 = 0;
  let fixedFtPart1 = 0;
  let fixedFtPart2 = 0;
  let fixedFtPart3 = 0;

  for (const ft of fullTests) {
    for (const part of ft.parts) {
      const pTitle = (part.title || '').toLowerCase();
      const isSpeaking = pTitle.includes('speaking') || pTitle.includes('nói');

      if (!isSpeaking) continue;

      // Part 4 Speaking trong Full Test: 100% không có ảnh!
      if (pTitle.includes('part 4') || pTitle.includes('abstract')) {
        if (part.image_url !== null) {
          await prisma.examPart.update({
            where: { id: part.id },
            data: { image_url: null },
          });
          fixedFtPart4++;
        }
      }
      // Part 1 Speaking trong Full Test: 100% không có ảnh!
      else if (pTitle.includes('part 1') || pTitle.includes('personal')) {
        if (part.image_url !== null) {
          await prisma.examPart.update({
            where: { id: part.id },
            data: { image_url: null },
          });
          fixedFtPart1++;
        }
      }
      // Part 2 Speaking trong Full Test
      else if (pTitle.includes('part 2') || pTitle.includes('describe')) {
        let targetImg = part.image_url || '';
        if (!targetImg.startsWith('/uploads/speaking/part2/')) {
          // Trích xuất số nếu có (vd: 38.jpg, 47.jpg -> image15.png hoặc theo số mod)
          const numMatch = targetImg.match(/\d+/);
          let imgIdx = 15;
          if (numMatch) {
            const n = parseInt(numMatch[0], 10);
            imgIdx = ((n - 1) % 25) + 1;
          }
          const standardized = `/uploads/speaking/part2/image${imgIdx}.png`;
          await prisma.examPart.update({
            where: { id: part.id },
            data: { image_url: standardized },
          });
          fixedFtPart2++;
        }
      }
      // Part 3 Speaking trong Full Test
      else if (pTitle.includes('part 3') || pTitle.includes('compare')) {
        let targetImg = part.image_url || '';
        if (!targetImg.startsWith('/uploads/speaking/part3/')) {
          const numMatch = targetImg.match(/\d+/);
          let imgIdx = 5;
          if (numMatch) {
            const n = parseInt(numMatch[0], 10);
            imgIdx = ((n - 1) % 25) + 1;
          }
          const standardized = `/uploads/speaking/part3/image${imgIdx}.png`;
          await prisma.examPart.update({
            where: { id: part.id },
            data: { image_url: standardized },
          });
          fixedFtPart3++;
        }
      }
    }
  }

  console.log(`- Đã xóa ảnh rác cho ${fixedFtPart4} Part 4 Speaking trong Full Test.`);
  console.log(`- Đã xóa ảnh rác cho ${fixedFtPart1} Part 1 Speaking trong Full Test.`);
  console.log(`- Đã chuẩn hóa đường dẫn ảnh cho ${fixedFtPart2} Part 2 Speaking trong Full Test.`);
  console.log(`- Đã chuẩn hóa đường dẫn ảnh cho ${fixedFtPart3} Part 3 Speaking trong Full Test.`);

  // 2. Dọn dẹp các đề rác của GRAMMAR_VOCABULARY
  console.log('\n>>> [2/3] Dọn dẹp các đề rác có 0 câu hỏi của Grammar & Vocabulary...');
  const brokenGvExams = await prisma.exam.findMany({
    where: {
      skill: 'GRAMMAR_VOCABULARY',
      OR: [
        { title: 'GV 1' },
        { title: 'Grammar 2' },
        { title: 'Grammar 3' },
        { title: 'Grammar 4' },
        { title: 'Grammar 5' },
        { title: '1' }
      ]
    },
    include: {
      parts: {
        include: { questions: true }
      }
    }
  });

  console.log(`- Tìm thấy ${brokenGvExams.length} đề Grammar rác với nhiều part rỗng 0 câu hỏi.`);
  for (const bExam of brokenGvExams) {
    // Xóa các part có 0 câu hỏi trong các đề này
    const emptyParts = bExam.parts.filter(p => p.questions.length === 0);
    if (emptyParts.length > 0) {
      await prisma.examPart.deleteMany({
        where: { id: { in: emptyParts.map(p => p.id) } }
      });
      console.log(`  * Đã xóa ${emptyParts.length} part rỗng trong đề "${bExam.title}".`);
    }

    // Unpublish đề này nếu số câu hỏi còn lại < 25 (không đủ chuẩn bài thi)
    const remainingQ = bExam.parts.filter(p => p.questions.length > 0).reduce((s, p) => s + p.questions.length, 0);
    if (remainingQ < 25) {
      await prisma.exam.update({
        where: { id: bExam.id },
        data: { is_published: false }
      });
      console.log(`  * Đã ẩn đề "${bExam.title}" (is_published = false) vì không đủ câu hỏi.`);
    }
  }

  // 3. Kiểm tra các đề thi chuẩn Đề 01 - Đề 08 của Grammar & Vocabulary
  console.log('\n>>> [3/3] Kích hoạt và xuất bản các đề Grammar & Vocabulary chuẩn (Đề 01 - Đề 08)...');
  const validGvExams = await prisma.exam.findMany({
    where: {
      skill: 'GRAMMAR_VOCABULARY',
      title: { contains: 'Grammar&Vocabulary' }
    }
  });
  console.log(`- Tìm thấy ${validGvExams.length} đề Grammar & Vocabulary chuẩn.`);
  for (const vExam of validGvExams) {
    if (!vExam.is_published) {
      await prisma.exam.update({
        where: { id: vExam.id },
        data: { is_published: true }
      });
    }
  }
  console.log(`- Đã đảm bảo 100% đề chuẩn Grammar & Vocabulary được xuất bản.`);

  console.log('\n===============================================================');
  console.log('HOÀN THÀNH CHUẨN HÓA DỮ LIỆU FULL TEST & GRAMMAR VOCABULARY!');
  console.log('===============================================================');
}

main()
  .catch((e) => {
    console.error('Lỗi khi chạy script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
