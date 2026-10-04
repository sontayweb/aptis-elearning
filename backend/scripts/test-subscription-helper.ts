import { PrismaClient } from '@prisma/client';
import { grantOrExtendSubscription } from '../src/utils/subscription-helper';

const prisma = new PrismaClient();

async function main() {
  console.log('=== KIỂM THỬ MODULE SUBSCRIPTION HELPER ===\n');

  const user = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  const plan = await prisma.subscriptionPlan.findFirst({ where: { is_active: true } });

  if (!user || !plan) {
    console.error('Không tìm thấy user hoặc plan để test');
    return;
  }

  console.log(`👤 User test: ${user.full_name} (${user.email})`);
  console.log(`📦 Plan test: ${plan.name} (${plan.duration_days} ngày, ${plan.ai_quota} lượt AI)`);

  // Thực thi bên trong Transaction và Rollback để không làm bẩn dữ liệu thật
  await prisma.$transaction(async (tx) => {
    const sub = await grantOrExtendSubscription(tx, {
      userId: user.id,
      planId: plan.id,
    });

    console.log('\n✅ Kết quả xử lý cấp/gia hạn gói cước:');
    console.log(`   - Subscription ID: ${sub.id}`);
    console.log(`   - Ngày bắt đầu:    ${sub.start_date.toISOString()}`);
    console.log(`   - Ngày kết thúc:   ${sub.end_date.toISOString()}`);
    console.log(`   - AI Quota:        ${sub.ai_quota_left}`);
    console.log(`   - Teacher Quota:   ${sub.teacher_quota_left}`);

    // Rollback
    throw new Error('ROLLBACK_INTENTIONAL');
  }).catch((e) => {
    if (e.message === 'ROLLBACK_INTENTIONAL') {
      console.log('\n🔒 Dữ liệu đã được rollback an toàn 100%. Không ảnh hưởng Database thật.');
    } else {
      throw e;
    }
  });
}

main()
  .catch((e) => {
    console.error('Lỗi kiểm thử:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
