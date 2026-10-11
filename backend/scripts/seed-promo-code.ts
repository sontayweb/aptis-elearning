import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Kiểm tra SubscriptionPlan
  let plan = await prisma.subscriptionPlan.findFirst({
    where: { is_active: true },
    orderBy: { price_vnd: 'desc' },
  });

  if (!plan) {
    console.log('Chưa có plan, đang tạo gói VIP Pro mặc định...');
    plan = await prisma.subscriptionPlan.create({
      data: {
        name: 'VIP Pro 1 Tháng',
        description: 'Trải nghiệm toàn bộ 860+ bộ đề thi và chấm AI không giới hạn',
        price_vnd: 299000,
        duration_days: 30,
        ai_quota: 50,
        teacher_quota: 0,
        features: JSON.stringify([
          'Mở khóa toàn bộ 860+ đề thi Aptis ESOL',
          'Chấm AI phát âm Speaking & Writing chi tiết',
          'Không giới hạn làm lại đề thi',
          'Bảng xếp hạng Bảng Kỳ Tích Pro',
        ]),
        is_active: true,
      },
    });
    console.log('Đã tạo plan:', plan.id, plan.name);
  } else {
    console.log('Đã tìm thấy plan hiện có:', plan.id, plan.name);
  }

  // 2. Tạo hoặc cập nhật mã GOLIVE14
  const promo = await prisma.promotionCode.upsert({
    where: { code: 'GOLIVE14' },
    update: {
      title: 'Mã trải nghiệm Go-Live 14 ngày VIP Pro',
      description: 'Tặng 14 ngày VIP Pro và 20 lượt chấm AI chuẩn British Council nhân dịp Go-Live',
      plan_id: plan.id,
      duration_days: 14,
      ai_quota: 20,
      teacher_quota: 0,
      max_uses: null, // Không giới hạn số lượng học viên
      is_active: true,
      expires_at: new Date('2026-12-31T23:59:59.000Z'),
    },
    create: {
      code: 'GOLIVE14',
      title: 'Mã trải nghiệm Go-Live 14 ngày VIP Pro',
      description: 'Tặng 14 ngày VIP Pro và 20 lượt chấm AI chuẩn British Council nhân dịp Go-Live',
      plan_id: plan.id,
      duration_days: 14,
      ai_quota: 20,
      teacher_quota: 0,
      max_uses: null,
      current_uses: 0,
      is_active: true,
      expires_at: new Date('2026-12-31T23:59:59.000Z'),
    },
  });

  console.log('✅ Thành công! Đã seed mã khuyến mại:', promo);
}

main()
  .catch((e) => {
    console.error('Lỗi seed promo code:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
