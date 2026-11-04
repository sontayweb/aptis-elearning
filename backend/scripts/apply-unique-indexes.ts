import { prisma } from '../src/config/database';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  console.log('🛡️ Đang áp dụng Partial & Functional Unique Indexes vào PostgreSQL Database...');

  const sqlPath = path.resolve(__dirname, '../prisma/migrations/add_partial_unique_indexes.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  try {
    // 1. Partial Unique Index theo Nguồn & External ID
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_source_external_id
      ON "Exam"(source, external_id)
      WHERE external_id IS NOT NULL;
    `);
    console.log('✅ Đã tạo Partial Unique Index: idx_exam_source_external_id (source, external_id)');

    // 2. Functional Unique Index theo Kỹ năng & Tiêu đề viết thường
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_unique_title_skill
      ON "Exam"(skill, LOWER(REGEXP_REPLACE(TRIM(title), '\\s+', ' ', 'g')));
    `);
    console.log('✅ Đã tạo Functional Unique Index: idx_exam_unique_title_skill (skill, lower(title))');

    console.log('🎉 Hoàn tất bảo vệ CSDL! Race-condition đã được triệt tiêu 100%.');
  } catch (err: any) {
    console.error('❌ Lỗi khi áp dụng Index vào PostgreSQL:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

