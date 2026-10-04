import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function importToDb() {
  console.log('=====================================================');
  console.log('🚀 NẠP ĐỀ THI APTIS ACADEMY VÀO DATABASE POSTGRESQL');
  console.log('=====================================================\n');

  const outDir = path.resolve(__dirname, 'output');
  if (!fs.existsSync(outDir)) {
    console.log('❌ Thư mục output chưa có dữ liệu nào. Hãy chạy crawl-exam.bat trước.');
    return;
  }

  const files = fs.readdirSync(outDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('❌ Không tìm thấy file JSON nào trong output.');
    return;
  }

  // Sắp xếp lấy file mới nhất
  files.sort((a, b) => fs.statSync(path.join(outDir, b)).mtimeMs - fs.statSync(path.join(outDir, a)).mtimeMs);
  const targetFile = path.join(outDir, files[0]);

  console.log(`📦 Đang nạp file mới nhất: ${targetFile}`);
  const content = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));

  // Nạp Prisma Client
  let PrismaClient;
  try {
    const backendPrisma = await import('../../backend/node_modules/@prisma/client/default.js').catch(() => null);
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
    // Kiểm tra trùng lặp
    let existing = await prisma.exam.findFirst({
      where: { title: content.title }
    });

    if (existing) {
      console.log(`⏩ Đề thi "${content.title}" đã tồn tại trong DB (ID: ${existing.id}).`);
      return;
    }

    const exam = await prisma.exam.create({
      data: {
        title: content.title,
        description: `Đề thi sao lưu từ Aptis Academy (${content.url})`,
        skill: 'FULL_TEST',
        duration_minutes: 60,
        is_pro: false,
        is_published: true,
        source: 'APTIS_ACADEMY',
        parts: {
          create: [
            {
              part_number: 1,
              title: 'Part 1',
              passage_text: content.passages?.join('\n\n') || '',
              audio_url: content.audios?.[0] || null,
              questions: {
                create: (content.questions || []).map((q, idx) => ({
                  question_number: q.question_number || idx + 1,
                  question_type: 'MULTIPLE_CHOICE',
                  prompt: q.prompt,
                  options: q.options || [],
                  correct_answer: q.correct_answer || null
                }))
              }
            }
          ]
        }
      }
    });

    console.log(`🎉 NẠP THÀNH CÔNG VÀO DATABASE!`);
    console.log(`- ID Đề thi: ${exam.id}`);
    console.log(`- Tiêu đề: ${exam.title}`);
  } catch (err) {
    console.error('Lỗi khi nạp vào DB:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

importToDb().catch(console.error);
