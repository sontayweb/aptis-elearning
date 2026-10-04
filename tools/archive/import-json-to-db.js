import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const jsonArg = process.argv[2];
  let targetFile = jsonArg;

  const jsonDir = path.resolve(__dirname, '../crawler/output/json');

  if (!targetFile) {
    // Nếu không truyền file, lấy file JSON mới nhất trong output/json
    if (!fs.existsSync(jsonDir)) {
      console.log('❌ Thư mục crawler/output/json chưa có file nào.');
      return;
    }
    const files = fs.readdirSync(jsonDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
      console.log('❌ Không tìm thấy file JSON nào trong crawler/output/json.');
      return;
    }
    // Sắp xếp lấy file mới nhất
    files.sort((a, b) => fs.statSync(path.join(jsonDir, b)).mtimeMs - fs.statSync(path.join(jsonDir, a)).mtimeMs);
    targetFile = path.join(jsonDir, files[0]);
  }

  console.log(`\n📦 Đang chuẩn bị nạp dữ liệu từ: ${targetFile}`);
  const content = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));

  // Nạp Prisma Client từ backend
  let PrismaClient;
  try {
    const backendPrisma = await import('../../backend/node_modules/@prisma/client/default.js').catch(() => null);
    PrismaClient = backendPrisma?.PrismaClient;
  } catch {}

  if (!PrismaClient) {
    try {
      const p = await import('@prisma/client');
      PrismaClient = p.PrismaClient;
    } catch (e) {
      console.error('❌ Không tìm thấy Prisma Client. Hãy chắc chắn đã chạy prisma generate ở thư mục backend.');
      return;
    }
  }

  const prisma = new PrismaClient();

  try {
    console.log(`🚀 Đang đưa đề thi vào Database: "${content.title}"...`);

    // Tạo đề thi
    const exam = await prisma.exam.create({
      data: {
        title: content.title,
        description: content.description || 'Đề thi sao lưu từ hệ thống Aptis',
        skill: content.skill || 'READING',
        duration_minutes: content.duration_minutes || 35,
        is_pro: false,
        is_published: true,
        source: 'BACKUP',
        parts: {
          create: (content.parts || [
            {
              part_number: 1,
              title: 'Part 1',
              passage_text: content.passages?.join('\n\n') || '',
              questions: {
                create: (content.questions || []).map(q => ({
                  question_number: q.question_number,
                  question_type: q.question_type || 'MULTIPLE_CHOICE',
                  prompt: q.prompt,
                  options: q.options || [],
                  correct_answer: q.correct_answer || null,
                  explanation: q.explanation || null
                }))
              }
            }
          ])
        }
      },
      include: {
        parts: {
          include: {
            questions: true
          }
        }
      }
    });

    console.log(`\n🎉 NẠP THÀNH CÔNG ĐỀ THI VÀO HỆ THỐNG!`);
    console.log(`- Mã đề thi ID: ${exam.id}`);
    console.log(`- Số Part: ${exam.parts.length}`);
    console.log(`- Bạn có thể vào http://localhost:3000 để làm bài ngay!`);
  } catch (err) {
    console.error('Lỗi khi nạp vào DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
