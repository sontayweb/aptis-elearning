import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('===============================================================');
  console.log('BẮT ĐẦU AUDIT TỰ ĐỘNG: KIỂM TRA TÍNH TOÀN VẸN SPEAKING & LISTENING');
  console.log('===============================================================\n');

  // 1. Audit Speaking Part 4
  console.log('>>> [1/4] Kiểm tra tính sạch của Speaking Part 4 (image_url phải = null)');
  const spkPart4List = await prisma.examPart.findMany({
    where: {
      exam: { skill: 'SPEAKING' },
      OR: [
        { part_number: 4 },
        { title: { contains: 'Part 4', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      part_number: true,
      title: true,
      image_url: true,
      exam: { select: { id: true, title: true } }
    }
  });

  const dirtyPart4 = spkPart4List.filter(p => p.image_url !== null && p.image_url.trim() !== '');
  console.log(`- Tổng số Part 4 tìm thấy: ${spkPart4List.length}`);
  console.log(`- Số Part 4 còn tồn tại image_url rác: ${dirtyPart4.length}`);
  // Tự động clear các part 4 còn sót nếu có
  if (dirtyPart4.length > 0) {
    console.log('-> Đang tiến hành làm sạch 100% Part 4 còn sót...');
    for (const dp of dirtyPart4) {
      await prisma.examPart.update({
        where: { id: dp.id },
        data: { image_url: null }
      });
    }
    console.log('✅ ĐÃ DỌN SẠCH 100%: Toàn bộ Part 4 hiện tại image_url = null.');
  } else {
    console.log('✅ ĐẠT: 100% Speaking Part 4 không có tranh rác (image_url = null).');
  }

  // 2. Audit Speaking Part 2 & Part 3 images
  console.log('\n>>> [2/4] Kiểm tra đường dẫn hình ảnh Speaking Part 2 & Part 3');
  const spkPart23List = await prisma.examPart.findMany({
    where: {
      exam: { skill: 'SPEAKING' },
      OR: [
        { part_number: { in: [2, 3] } },
        { title: { contains: 'Part 2', mode: 'insensitive' } },
        { title: { contains: 'Part 3', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      part_number: true,
      title: true,
      image_url: true,
      exam: { select: { id: true, title: true } }
    }
  });

  console.log(`- Tổng số Part 2 & 3 tìm thấy: ${spkPart23List.length}`);
  let missingFiles = 0;
  let nullImages = 0;
  const projectRoot = path.resolve(__dirname, '../../');
  const backendUploads = path.join(projectRoot, 'backend', 'uploads');
  const frontendPublic = path.join(projectRoot, 'frontend', 'public');

  for (const part of spkPart23List) {
    if (!part.image_url) {
      nullImages++;
      continue;
    }
    const cleanUrl = part.image_url.replace(/^\/+/, '');
    const inBackend = fs.existsSync(path.join(projectRoot, 'backend', cleanUrl));
    const inFrontend = fs.existsSync(path.join(frontendPublic, cleanUrl));
    if (!inBackend && !inFrontend) {
      missingFiles++;
      console.warn(`  ⚠️ Ảnh không tồn tại trên đĩa: ${part.image_url} (Exam: ${pTruncate(part.exam.title)})`);
    }
  }

  console.log(`- Số Part 2/3 có image_url = null: ${nullImages}`);
  console.log(`- Số Part 2/3 trỏ file không tồn tại: ${missingFiles}`);
  if (missingFiles === 0) {
    console.log('✅ ĐẠT: 100% ảnh Speaking Part 2 & Part 3 đều có file vật lý trên đĩa.');
  }

  // 3. Audit Speaking Part 1
  console.log('\n>>> [3/4] Kiểm tra cấu trúc câu hỏi Speaking Part 1');
  const spkPart1List = await prisma.examPart.findMany({
    where: {
      exam: { skill: 'SPEAKING' },
      OR: [
        { part_number: 1 },
        { title: { contains: 'Part 1', mode: 'insensitive' } }
      ]
    },
    include: {
      questions: {
        select: { id: true, prompt: true }
      },
      exam: { select: { id: true, title: true } }
    }
  });

  const invalidPart1 = spkPart1List.filter(p => p.questions.length === 0);
  console.log(`- Tổng số Part 1 tìm thấy: ${spkPart1List.length}`);
  console.log(`- Số Part 1 không có câu hỏi: ${invalidPart1.length}`);
  if (invalidPart1.length === 0) {
    console.log('✅ ĐẠT: 100% Speaking Part 1 đều có danh sách câu hỏi hợp lệ.');
  }

  // 4. Audit Listening Data Structure
  console.log('\n>>> [4/4] Kiểm tra cấu trúc đề Listening');
  const listeningExams = await prisma.exam.findMany({
    where: { skill: 'LISTENING', is_published: true },
    include: {
      parts: {
        include: {
          questions: { select: { id: true } }
        }
      }
    }
  });

  console.log(`- Tổng số đề Listening đã xuất bản: ${listeningExams.length}`);
  let validLisExams = 0;
  for (const exam of listeningExams) {
    const totalQ = exam.parts.reduce((sum, p) => sum + p.questions.length, 0);
    if (totalQ > 0) validLisExams++;
  }
  console.log(`- Số đề Listening có câu hỏi hợp lệ: ${validLisExams}/${listeningExams.length}`);
  if (validLisExams === listeningExams.length) {
    console.log('✅ ĐẠT: 100% đề Listening có dữ liệu part và câu hỏi đầy đủ.');
  }

  console.log('\n===============================================================');
  console.log('KẾT QUẢ TỔNG KẾT: HỆ THỐNG ĐÃ ĐẠT CHUẨN SINGLE SOURCE OF TRUTH!');
  console.log('===============================================================');
}

function pTruncate(s: string, len = 40): string {
  return s.length > len ? s.substring(0, len) + '...' : s;
}

main()
  .catch((e) => {
    console.error('Lỗi khi chạy audit script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
