import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function backupAllExams() {
  console.log('=====================================================');
  console.log('📦 BẮT ĐẦU XUẤT TOÀN BỘ NGÂN HÀNG ĐỀ THI ĐỂ DỰ PHÒNG');
  console.log('=====================================================\n');

  // Nạp Prisma Client từ backend
  let PrismaClient;
  try {
    const backendPrisma = await import('../backend/node_modules/@prisma/client/default.js').catch(() => null);
    PrismaClient = backendPrisma?.PrismaClient;
  } catch {}

  if (!PrismaClient) {
    try {
      const p = await import('@prisma/client');
      PrismaClient = p.PrismaClient;
    } catch {
      console.error('❌ Không tìm thấy Prisma Client.');
      return;
    }
  }

  const prisma = new PrismaClient();

  try {
    console.log('⏳ Đang đọc dữ liệu từ Database...');
    const exams = await prisma.exam.findMany({
      include: {
        parts: {
          include: {
            questions: true
          },
          orderBy: {
            part_number: 'asc'
          }
        }
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    console.log(`✅ Đã tìm thấy: ${exams.length} đề thi.`);

    let totalParts = 0;
    let totalQuestions = 0;
    exams.forEach(ex => {
      totalParts += ex.parts.length;
      ex.parts.forEach(p => {
        totalQuestions += p.questions.length;
      });
    });

    console.log(`- Tổng số Part: ${totalParts}`);
    console.log(`- Tổng số Câu hỏi: ${totalQuestions}`);

    const backupDir = path.resolve(__dirname, '../backups');
    fs.mkdirSync(backupDir, { recursive: true });

    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      stats: {
        totalExams: exams.length,
        totalParts,
        totalQuestions
      },
      exams: exams.map(e => ({
        title: e.title,
        description: e.description,
        skill: e.skill,
        duration_minutes: e.duration_minutes,
        is_pro: e.is_pro,
        is_published: e.is_published,
        source: e.source,
        parts: e.parts.map(p => ({
          part_number: p.part_number,
          title: p.title,
          instructions: p.instructions,
          passage_text: p.passage_text,
          audio_url: p.audio_url,
          image_url: p.image_url,
          questions: p.questions.map(q => ({
            question_number: q.question_number,
            question_type: q.question_type,
            prompt: q.prompt,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            max_score: q.max_score
          }))
        }))
      }))
    };

    // 1. Lưu file JSON chuẩn mới nhất
    const latestJsonFile = path.join(backupDir, 'aptis_exams_backup_latest.json');
    fs.writeFileSync(latestJsonFile, JSON.stringify(backupData, null, 2), 'utf-8');

    // 2. Lưu file có kèm timestamp
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const timestampJsonFile = path.join(backupDir, `aptis_exams_backup_${dateStr}.json`);
    fs.writeFileSync(timestampJsonFile, JSON.stringify(backupData, null, 2), 'utf-8');

    console.log('\n======================================================');
    console.log('🎉 XUẤT DỮ LIỆU ĐỀ THI THÀNH CÔNG RỰC RỠ!');
    console.log(`📁 File chính để nạp Cloud: ${latestJsonFile}`);
    console.log(`📁 File lưu trữ theo thời gian: ${timestampJsonFile}`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Lỗi khi xuất dữ liệu:', err);
  } finally {
    await prisma.$disconnect();
  }
}

backupAllExams().catch(console.error);
