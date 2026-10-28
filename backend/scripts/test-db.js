process.env.DATABASE_URL = 'postgresql://postgres:123456@103.90.227.117:5432/aptis_kytich_db';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected directly to VPS 103.90.227.117:5432!');
    const writingCount = await prisma.question.count({
      where: {
        part: { exam: { skill: 'WRITING' } },
        question_type: 'MULTIPLE_CHOICE'
      }
    });
    console.log(`📊 Số câu hỏi Writing đang bị set MULTIPLE_CHOICE trong DB: ${writingCount}`);
  } catch (err) {
    console.error('❌ DB Connect error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
