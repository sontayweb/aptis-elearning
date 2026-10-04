import { PrismaClient, ExamSkill } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('=== BẮT ĐẦU ĐÓNG GÓI 32 BỘ ĐỀ FULL READING (APTIS KỲ TÍCH) ===\n');

  const catalogPath = path.resolve(__dirname, '../../tools/data/aptiskytich/exam_sets_catalog.json');
  if (!fs.existsSync(catalogPath)) {
    throw new Error('Không tìm thấy file exam_sets_catalog.json');
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const readingCatalog = catalog.filter((c: any) => c.skill === 'reading');

  // Lấy toàn bộ exams lẻ hiện có của APTIS_KYTICH trong DB
  const existingSubExams = await prisma.exam.findMany({
    where: {
      skill: 'READING',
      source: 'APTIS_KYTICH',
    },
    include: {
      parts: {
        include: { questions: true }
      }
    }
  });

  const subExamMap = new Map<string, typeof existingSubExams[0]>();
  for (const ex of existingSubExams) {
    subExamMap.set(ex.title.trim().toLowerCase(), ex);
  }

  let createdCount = 0;
  let updatedCount = 0;

  for (let i = 1; i <= 32; i++) {
    const code = i < 10 ? `0${i}` : `${i}`;
    const fullExamTitle = `Đề ${code} — Full Reading · 4 Parts`;
    const isPro = i > 3; // Đề 01 - 03 Free, Đề 04 - 32 Pro

    // Tìm 4 parts trong catalog cho Đề i
    const deCatalog = readingCatalog.filter((c: any) => {
      const match = c.title.match(/^Đề\s+(\d+)/i);
      return match && parseInt(match[1], 10) === i;
    });

    if (deCatalog.length === 0) {
      console.warn(`⚠️ Không tìm thấy catalog cho Đề ${code}`);
      continue;
    }

    // Phân loại 4 parts theo part number
    const p1Cat = deCatalog.find((c: any) => c.part && c.part.includes('Part 1'));
    const p2Cat = deCatalog.find((c: any) => c.part && c.part.includes('Part 2'));
    const p3Cat = deCatalog.find((c: any) => c.part && (c.part.includes('Part 3') || c.part.includes('Gap Fill')));
    const p4Cat = deCatalog.find((c: any) => c.part && (c.part.includes('Part 4') || c.part.includes('Long Text')));

    const targetCats = [p1Cat, p2Cat, p3Cat, p4Cat].filter(Boolean);

    // Thu thập các ExamPart tương ứng từ DB
    const partsToCreate: any[] = [];
    let partNum = 1;

    for (const cat of targetCats) {
      if (!cat) continue;
      // Tìm exam trong DB
      const subEx = subExamMap.get(cat.title.trim().toLowerCase());
      if (subEx && subEx.parts.length > 0) {
        const originalPart = subEx.parts[0];
        partsToCreate.push({
          part_number: partNum++,
          title: `Part ${partNum - 1}: ${cat.part || originalPart.title}`,
          instructions: originalPart.instructions || 'Read the text and answer the questions.',
          passage_text: originalPart.passage_text,
          audio_url: originalPart.audio_url,
          image_url: originalPart.image_url,
          questions: {
            create: originalPart.questions.map((q, qIdx) => ({
              question_number: qIdx + 1,
              question_type: q.question_type,
              prompt: q.prompt,
              options: q.options as any,
              correct_answer: q.correct_answer,
              explanation: q.explanation,
              max_score: q.max_score,
            }))
          }
        });
      }
    }

    if (partsToCreate.length === 0) {
      console.warn(`⚠️ Không tìm thấy câu hỏi nào cho Đề ${code}`);
      continue;
    }

    // Xóa đề Full cũ nếu đã tồn tại để tạo lại sạch sẽ và cập nhật đúng
    const existingFull = await prisma.exam.findFirst({
      where: { title: fullExamTitle }
    });

    if (existingFull) {
      await prisma.exam.delete({
        where: { id: existingFull.id }
      });
      updatedCount++;
    } else {
      createdCount++;
    }

    await prisma.exam.create({
      data: {
        title: fullExamTitle,
        description: `Bài thi luyện tập Full Reading 4 Parts chuẩn Aptis ESOL 2026 (${partsToCreate.length} parts). Thời gian làm bài 35 phút.`,
        skill: ExamSkill.READING,
        duration_minutes: 35,
        is_pro: isPro,
        is_published: true,
        source: 'APTIS_KYTICH',
        parts: {
          create: partsToCreate
        }
      }
    });

    console.log(`✅ [${code}/32] Đã đóng gói thành công: "${fullExamTitle}" (${partsToCreate.length} parts, ${isPro ? 'VIP PRO' : 'MIỄN PHÍ'})`);
  }

  console.log(`\n🎉 HOÀN THÀNH ĐÓNG GÓI 32 BỘ ĐỀ FULL READING!`);
  console.log(`- Mới tạo: ${createdCount} bộ đề`);
  console.log(`- Cập nhật: ${updatedCount} bộ đề`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi đóng gói:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
