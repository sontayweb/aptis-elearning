import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================================');
  console.log(' TIẾN TRÌNH DỌN DẸP & CHUẨN HÓA THƯƠNG HIỆU APTIS ESOL PREMIER TRONG DATABASE');
  console.log('================================================================================');

  // 1. Tìm các đề thi có chứa nhãn (Kỳ Tích) hoặc (Aptis Kỳ Tích) trong title
  const examsToUpdate = await prisma.exam.findMany({
    where: {
      OR: [
        { title: { contains: 'Kỳ Tích' } },
        { description: { contains: 'Kỳ Tích' } },
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      skill: true,
    },
  });

  console.log(` Tìm thấy ${examsToUpdate.length} bộ đề cần chuẩn hóa tên và mô tả.\n`);

  let updatedCount = 0;
  for (const ex of examsToUpdate) {
    let newTitle = ex.title;
    // Bỏ các hậu tố (Kỳ Tích) hoặc (Aptis Kỳ Tích)
    newTitle = newTitle.replace(/\s*\(Kỳ Tích\)/g, '');
    newTitle = newTitle.replace(/\s*\(Aptis Kỳ Tích\)/g, '');
    newTitle = newTitle.trim();

    let newDesc = ex.description || '';
    newDesc = newDesc.replace(/từ Aptis Kỳ Tích/g, 'từ Aptis ESOL Premier');
    newDesc = newDesc.replace(/Aptis Kỳ Tích/g, 'Aptis ESOL Premier');

    if (newTitle !== ex.title || newDesc !== ex.description) {
      await prisma.exam.update({
        where: { id: ex.id },
        data: {
          title: newTitle,
          description: newDesc,
        },
      });

      console.log(`[PASS] [${ex.skill}] Đã đổi:`);
      console.log(`   Cũ: "${ex.title}"`);
      console.log(`   Mới: "${newTitle}"\n`);
      updatedCount++;
    }
  }

  // 2. Kiểm tra ExamPart nếu có part title nào dính (Kỳ Tích)
  const partsToUpdate = await prisma.examPart.findMany({
    where: {
      title: { contains: 'Kỳ Tích' },
    },
    select: { id: true, title: true },
  });

  for (const p of partsToUpdate) {
    const cleanPartTitle = p.title
      .replace(/\s*\(Kỳ Tích\)/g, '')
      .replace(/\s*\(Aptis Kỳ Tích\)/g, '')
      .replace(/Aptis Kỳ Tích/g, 'Aptis ESOL Premier')
      .trim();

    await prisma.examPart.update({
      where: { id: p.id },
      data: { title: cleanPartTitle },
    });
    console.log(`[PASS] [ExamPart] Đã sửa part: "${p.title}" -> "${cleanPartTitle}"`);
  }

  console.log('================================================================================');
  console.log(`HOÀN TẤT CHUẨN HÓA: Đã cập nhật ${updatedCount} đề thi trong Database!`);
  console.log('================================================================================\n');
}

main()
  .catch((err) => {
    console.error('[FAIL] Lỗi tiến trình dọn dẹp:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

