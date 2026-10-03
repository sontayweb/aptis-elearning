import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeExam } from '../../core/schema.js';
import { upsertExam } from '../../core/db.js';
import { getBrowserForSource } from '../../core/browser.js';
import { downloadMediaFile } from '../../core/media.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Hàm crawler chuẩn mực cho mọi nguồn web mới
 * @param {Object} options
 * @param {Object} options.prisma - PrismaClient instance (nếu muốn nạp trực tiếp vào DB)
 * @param {boolean} options.saveDb - Có nạp vào database hay không
 * @param {boolean} options.downloadMedia - Có tải audio / hình ảnh về máy hay không
 */
export async function crawl({ prisma = null, saveDb = false, downloadMedia = false } = {}) {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));
  console.log('=====================================================');
  console.log(`🌐 BẮT ĐẦU ĐỒNG BỘ: ${config.displayName} (${config.baseUrl})`);
  console.log('=====================================================\n');

  const outputDir = path.resolve(__dirname, `../../data/${config.name}`);
  fs.mkdirSync(outputDir, { recursive: true });

  const stats = {
    source: config.name,
    totalExams: 0,
    crawledAt: new Date().toISOString()
  };

  const normalizedExams = [];

  // TODO: Triển khai logic bóc tách đề thi từ website ở đây
  // Ví dụ tạo 1 đề thi theo chuẩn schema chung:
  /*
  const exampleExam = normalizeExam({
    source: config.name.toUpperCase(),
    externalId: 'exam_123',
    title: 'Aptis Practice Test 01',
    skill: 'LISTENING',
    durationMinutes: 40,
    parts: [
      {
        part_number: 1,
        title: 'Part 1: Information Recognition',
        audio_url: 'https://example.com/audio/p1.mp3',
        questions: [
          {
            question_number: 1,
            question_type: 'MULTIPLE_CHOICE',
            prompt: 'Where is the meeting taking place?',
            options: ['Room 101', 'Room 202', 'Library'],
            correct_answer: 'Room 101'
          }
        ]
      }
    ]
  });
  normalizedExams.push(exampleExam);
  */

  stats.totalExams = normalizedExams.length;

  // Lưu file chuẩn hóa
  fs.writeFileSync(path.join(outputDir, 'normalized_exams.json'), JSON.stringify(normalizedExams, null, 2));
  fs.writeFileSync(path.join(outputDir, 'summary.json'), JSON.stringify(stats, null, 2));

  console.log(`\n🎉 HOÀN THÀNH ĐỒNG BỘ: ${config.displayName}`);
  console.log(`💾 Đã lưu dữ liệu tại: ${outputDir}/`);

  // Tùy chọn nạp vào database nếu được chỉ định
  if (saveDb && prisma && normalizedExams.length > 0) {
    console.log('\n🚀 Đang nạp đề vào PostgreSQL qua Prisma...');
    for (const ex of normalizedExams) {
      await upsertExam(prisma, ex);
    }
  }

  return stats;
}

// Chạy trực tiếp nếu gọi từ dòng lệnh
if (process.argv[1] && process.argv[1].endsWith('crawler.js')) {
  crawl().catch(console.error);
}
