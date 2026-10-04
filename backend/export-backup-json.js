const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const backupDir = path.resolve(__dirname, 'backups/json_snapshot');

async function exportJson() {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log('📦 Bắt đầu xuất snapshot JSON các bảng dữ liệu...');

  const models = [
    { name: 'users', fn: () => prisma.user.findMany() },
    { name: 'exams', fn: () => prisma.exam.findMany({ include: { parts: { include: { questions: true } } } }) },
    { name: 'submissions', fn: () => prisma.examSubmission.findMany({ include: { answers: true } }) },
    { name: 'dictation_lessons', fn: () => prisma.dictationLesson.findMany({ include: { sentences: true } }) },
    { name: 'subscription_plans', fn: () => prisma.subscriptionPlan.findMany() },
    { name: 'user_subscriptions', fn: () => prisma.userSubscription.findMany() }
  ];

  for (const m of models) {
    try {
      const data = await m.fn();
      fs.writeFileSync(path.join(backupDir, `${m.name}.json`), JSON.stringify(data, null, 2), 'utf-8');
      console.log(`✅ Xuất thành công ${m.name}: ${data.length} bản ghi`);
    } catch (e) {
      console.warn(`⚠️ Bảng ${m.name}:`, e.message);
    }
  }

  console.log(`\n🎉 Đã lưu toàn bộ snapshot JSON vào: ${backupDir}`);
}

exportJson()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
