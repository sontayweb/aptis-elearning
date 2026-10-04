import { Prisma, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../config/database';

export interface GrantSubscriptionOptions {
  userId: string;
  planId: string;
  transactionId?: string;
  customDurationDays?: number;
  customAiQuota?: number;
  customTeacherQuota?: number;
  now?: Date;
}

export type PrismaDbClient = Prisma.TransactionClient | PrismaClient;

/**
 * Cấp mới hoặc gia hạn cộng dồn gói cước VIP cho học viên.
 * Logic nghiệp vụ chuẩn:
 * 1. Tìm thông tin SubscriptionPlan tương ứng.
 * 2. Tìm gói UserSubscription hiện tại còn hạn (end_date > now), có sắp xếp theo end_date DESC.
 * 3. Nếu đã có gói còn hạn:
 *    - Cộng dồn ngày kết thúc: newEndDate = existingSub.end_date + duration
 *    - Cộng dồn Quota AI: newAiQuota = existingSub.ai_quota_left + plan.ai_quota
 *    - Cộng dồn Quota Giảng viên: newTeacherQuota = existingSub.teacher_quota_left + plan.teacher_quota
 * 4. Nếu chưa có hoặc gói cũ đã hết hạn:
 *    - Tạo gói mới: start_date = now, end_date = now + duration
 *    - Gán Quota AI và Teacher chuẩn từ plan
 * 
 * @param db - Prisma client hoặc Transaction client (tx)
 * @param options - Các thông số cấp gói
 * @returns UserSubscription đã được cập nhật hoặc tạo mới
 */
export async function grantOrExtendSubscription(
  db: PrismaDbClient = defaultPrisma,
  options: GrantSubscriptionOptions
) {
  const {
    userId,
    planId,
    transactionId,
    customDurationDays,
    customAiQuota,
    customTeacherQuota,
    now = new Date(),
  } = options;

  // 1. Lấy thông tin plan
  const plan = await db.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw { statusCode: 404, message: 'Gói cước VIP không tồn tại trong hệ thống' };
  }

  const durationDays = customDurationDays ?? plan.duration_days;
  const durationMs = durationDays * 24 * 60 * 60 * 1000;
  const planAiQuota = customAiQuota ?? plan.ai_quota ?? 50;
  const planTeacherQuota = customTeacherQuota ?? plan.teacher_quota ?? 5;

  // 2. Tìm gói hiện tại còn hạn (sắp xếp theo end_date desc để lấy đúng gói xa nhất)
  const existingSub = await db.userSubscription.findFirst({
    where: {
      user_id: userId,
      is_active: true,
      end_date: { gt: now },
    },
    orderBy: { end_date: 'desc' },
  });

  // 3. Gia hạn cộng dồn hoặc Cấp mới
  if (existingSub) {
    const newEndDate = new Date(existingSub.end_date.getTime() + durationMs);
    const newAiQuota = existingSub.ai_quota_left + planAiQuota;
    const newTeacherQuota = existingSub.teacher_quota_left + planTeacherQuota;

    return await db.userSubscription.update({
      where: { id: existingSub.id },
      data: {
        plan_id: plan.id,
        end_date: newEndDate,
        ai_quota_left: newAiQuota,
        teacher_quota_left: newTeacherQuota,
        ...(transactionId && { transaction_id: transactionId }),
      },
      include: { plan: true },
    });
  } else {
    const newEndDate = new Date(now.getTime() + durationMs);

    return await db.userSubscription.create({
      data: {
        user_id: userId,
        plan_id: plan.id,
        start_date: now,
        end_date: newEndDate,
        is_active: true,
        ai_quota_left: planAiQuota,
        teacher_quota_left: planTeacherQuota,
        ...(transactionId && { transaction_id: transactionId }),
      },
      include: { plan: true },
    });
  }
}
