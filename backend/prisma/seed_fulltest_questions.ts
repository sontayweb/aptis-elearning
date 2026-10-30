/**
 * SEED SUPPLEMENT: Khởi tạo 20 Bộ đề Thi thử Hoàn chỉnh (APT-01 đến APT-20)
 * Đủ 4 kỹ năng chuẩn Aptis ESOL (Listening Part 1-4 + Reading Part 1-4 + Writing Part 1-4 + Speaking Part 1-4)
 * - APT-01: Miễn phí (is_pro = false)
 * - APT-02 .. APT-20: Khóa VIP PRO (is_pro = true)
 * Chạy: npx ts-node prisma/seed_fulltest_questions.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { ensureTwentyFullTestExams } from '../src/modules/exams/fulltest-generator';

const prisma = new PrismaClient();

async function main() {
  console.log('=== SEEDING 20 FULL TEST MOCK EXAMS (APT-01 .. APT-20) ===');
  await ensureTwentyFullTestExams(prisma);
  console.log('✅ Đã khởi tạo hoàn tất 20 Bộ đề Thi thử Aptis ESOL (APT-01 đến APT-20)!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding full test mock exams:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
