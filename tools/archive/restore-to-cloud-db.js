import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function restoreToCloud() {
  console.log('=====================================================');
  console.log('🚀 NẠP NGÂN HÀNG ĐỀ THI VÀO DATABASE CLOUD / PRODUCTION');
  console.log('=====================================================\n');

  // Lấy URL Database Cloud từ đối số dòng lệnh hoặc biến môi trường
  const targetUrl = process.argv[2] || process.env.CLOUD_DATABASE_URL;

  if (!targetUrl) {
    console.error('❌ THIẾU THÔNG TIN DATABASE CLOUD!');
    console.log('\n👉 Cách sử dụng:');
    console.log('node tools/restore-to-cloud-db.js "postgresql://postgres:password@cloud-ip:5432/aptis_kytich_db"');
    console.log('\n(Hoặc đặt biến môi trường: set CLOUD_DATABASE_URL=...)');
    process.exit(1);
  }

  const backupFile = path.resolve(__dirname, '../backups/aptis_exams_backup_latest.json');
  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Không tìm thấy file backup tại: ${backupFile}`);
    process.exit(1);
  }

  const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  console.log(`📦 Đã đọc file backup: ${backupData.exams.length} đề thi, ${backupData.stats.totalQuestions} câu hỏi.`);

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

  // Kết nối tới Database Cloud mục tiêu
  console.log('🔗 Đang kết nối tới Database Cloud...');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: targetUrl
      }
    }
  });

  try {
    let insertedExams = 0;
    let skippedExams = 0;

    for (let i = 0; i < backupData.exams.length; i++) {
      const e = backupData.exams[i];
      process.stdout.write(`[${i + 1}/${backupData.exams.length}] Đang xử lý: "${e.title}"... `);

      // Kiểm tra đề đã tồn tại chưa để tránh trùng lặp
      let exam = await prisma.exam.findFirst({
        where: { title: e.title }
      });

      if (exam) {
        console.log('⏩ (Đã có, bỏ qua)');
        skippedExams++;
        continue;
      }

      // Tạo mới đề thi và các part, câu hỏi
      exam = await prisma.exam.create({
        data: {
          title: e.title,
          description: e.description,
          skill: e.skill,
          duration_minutes: e.duration_minutes,
          is_pro: e.is_pro,
          is_published: e.is_published,
          source: e.source || 'BACKUP_CLOUD',
          parts: {
            create: e.parts.map(p => ({
              part_number: p.part_number,
              title: p.title,
              instructions: p.instructions,
              passage_text: p.passage_text,
              audio_url: p.audio_url,
              image_url: p.image_url,
              questions: {
                create: p.questions.map(q => ({
                  question_number: q.question_number,
                  question_type: q.question_type,
                  prompt: q.prompt,
                  options: q.options || [],
                  correct_answer: q.correct_answer,
                  explanation: q.explanation,
                  max_score: q.max_score || 1.0
                }))
              }
            }))
          }
        }
      });

      console.log('✅ (Đã nạp)');
      insertedExams++;
    }

    console.log('\n======================================================');
    console.log('🎉 ĐÃ NẠP TOÀN BỘ NGÂN HÀNG ĐỀ VÀO CLOUD THÀNH CÔNG!');
    console.log(`- Đề thi mới nạp: ${insertedExams}`);
    console.log(`- Đề thi đã có sẵn: ${skippedExams}`);
    console.log(`- Tổng cộng: ${backupData.exams.length} đề thi sẵn sàng trên Cloud.`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Lỗi khi nạp vào Database Cloud:', err);
  } finally {
    await prisma.$disconnect();
  }
}

restoreToCloud().catch(console.error);
