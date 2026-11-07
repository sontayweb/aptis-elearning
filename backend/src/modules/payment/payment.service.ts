import crypto from 'crypto';
import { Request } from 'express';
import { prisma } from '../../config/database';
import { PlanType, TransactionStatus, AuditAction, NotificationType } from '@prisma/client';
import { SepayWebhookInput, ReportPaymentIssueInput } from './payment.dto';
import { auditService } from '../audit/audit.service';
import { notificationService } from '../notifications/notification.service';
import { grantOrExtendSubscription } from '../../utils/subscription-helper';
import { emailService } from '../email/email.service';

const INSECURE_PLACEHOLDER_KEYS = new Set([
  'sepay_api_key_demo',
  'your_sepay_api_key',
  'changeme',
  'demo',
  'test',
]);

export function encodePaymentMethodMetadata(planCode: string, promoCode?: string | null): string {
  const parts = ['SEPAY_QR', `PLAN:${planCode}`];
  if (promoCode) {
    parts.push(`PROMO:${promoCode.trim().toUpperCase()}`);
  }
  return parts.join('|');
}

export function parsePaymentMetadata(
  paymentMethod?: string | null,
  orderCode?: string | null
): { planCode?: PlanType; promoCode?: string; targetDurationDays?: number } {
  let planCode: PlanType | undefined;
  let promoCode: string | undefined;
  let targetDurationDays: number | undefined;

  if (paymentMethod) {
    const planMatch = paymentMethod.match(/PLAN:([A-Z0-9_]+)/i);
    if (planMatch && planMatch[1]) {
      const candidate = planMatch[1].toUpperCase() as PlanType;
      if (Object.values(PlanType).includes(candidate)) {
        planCode = candidate;
      }
    }
    const promoMatch = paymentMethod.match(/PROMO:([A-Z0-9_-]+)/i);
    if (promoMatch && promoMatch[1]) {
      promoCode = promoMatch[1].toUpperCase();
    }
  }

  if (orderCode) {
    const upperOrder = orderCode.toUpperCase();
    if (upperOrder.startsWith('APTIS6M')) {
      planCode = planCode || PlanType.PREMIER_6M;
      targetDurationDays = 180;
    } else if (upperOrder.startsWith('APTIS3M')) {
      planCode = planCode || PlanType.VIP_3M;
      targetDurationDays = 90;
    } else if (upperOrder.startsWith('APTIS1M')) {
      planCode = planCode || PlanType.VIP_1M;
      targetDurationDays = 30;
    }
  }

  return { planCode, promoCode, targetDurationDays };
}

function getPlanOrderPrefix(planCode: string, durationDays?: number): string {
  if (planCode === 'PREMIER_6M' || (durationDays && durationDays >= 150)) {
    return 'APTIS6M';
  }
  if (planCode === 'VIP_3M' || planCode === 'VIP' || (durationDays && durationDays >= 60)) {
    return 'APTIS3M';
  }
  return 'APTIS1M';
}

function safeCompareSecret(provided: string, expected: string): boolean {
  const a = Buffer.from(provided.trim(), 'utf8');
  const b = Buffer.from(expected.trim(), 'utf8');
  if (a.length !== b.length || a.length === 0) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function verifySepayWebhookAuth(req?: any): void {
  const expectedToken = (process.env.SEPAY_API_KEY || '').trim();
  const isProd = process.env.NODE_ENV === 'production';
  const isPlaceholder = !expectedToken || INSECURE_PLACEHOLDER_KEYS.has(expectedToken.toLowerCase());

  if (isProd && isPlaceholder) {
    throw {
      statusCode: 503,
      message: 'Cổng Webhook SePay chưa được cấu hình SEPAY_API_KEY bảo mật trên môi trường Production',
    };
  }

  // Nếu đã cấu hình SEPAY_API_KEY thật (hoặc đang ở production), bắt buộc kiểm tra chữ ký/API key
  if (!isPlaceholder || isProd) {
    const headers = req?.headers || {};
    const rawAuth = String(headers.authorization || headers.Authorization || '').trim();
    const strippedAuth = rawAuth.replace(/^(Apikey|Bearer)\s+/i, '').trim();
    const headerToken = String(headers['x-sepay-token'] || headers['x-api-key'] || '').trim();
    const candidate = strippedAuth || headerToken;

    if (!candidate || !safeCompareSecret(candidate, expectedToken)) {
      throw { statusCode: 401, message: 'Chữ ký Webhook SePay không hợp lệ (Unauthorized)' };
    }
  }
}

export class PaymentService {
  /**
   * Lấy mã khuyến mại đại diện đang được chọn Treo Banner (Single Active Featured Promo)
   */
  async getFeaturedPromo() {
    try {
      const count = await prisma.promotionCode.count();
      if (count === 0) {
        const plan = await prisma.subscriptionPlan.findFirst({
          where: { is_active: true },
          orderBy: { price_vnd: 'desc' },
        });
        if (plan) {
          await prisma.promotionCode.create({
            data: {
              code: 'GOLIVE14',
              title: 'Mã trải nghiệm Go-Live 14 ngày VIP Pro',
              description: 'Tặng 14 ngày VIP Pro và 20 lượt chấm AI chuẩn British Council nhân dịp Go-Live',
              code_type: 'FREE_TRIAL',
              plan_id: plan.id,
              duration_days: 14,
              ai_quota: 20,
              is_featured: true,
              is_active: true,
              expires_at: new Date('2026-11-25T23:59:59.999+07:00'),
            },
          });
        }
      }
    } catch {}

    const now = new Date();
    const promo = await prisma.promotionCode.findFirst({
      where: {
        is_featured: true,
        is_active: true,
        OR: [{ expires_at: null }, { expires_at: { gt: now } }],
      },
      include: { plan: true },
    });

    if (!promo) return null;

    return {
      id: promo.id,
      code: promo.code,
      title: promo.title,
      description: promo.description,
      codeType: promo.code_type,
      durationDays: promo.duration_days,
      aiQuota: promo.ai_quota,
      discountAmount: promo.discount_amount,
      discountPercent: promo.discount_percent,
      expiresAt: promo.expires_at,
      planName: promo.plan?.name || 'VIP Pro',
    };
  }

  async getPlans() {
    return prisma.subscriptionPlan.findMany({
      where: { is_active: true },
      orderBy: { price_vnd: 'asc' },
    });
  }

  async initiatePayment(userId: string, planIdentifier: string, promoCodeInput?: string) {
    const cleanIdentifier = String(planIdentifier || '').trim();
    const isPlanCode = Object.values(PlanType).includes(cleanIdentifier as PlanType);

    let plan = isPlanCode
      ? await prisma.subscriptionPlan.findUnique({
          where: { code: cleanIdentifier as PlanType },
        })
      : await prisma.subscriptionPlan.findUnique({
          where: { id: cleanIdentifier },
        });

    if (!plan && !isPlanCode) {
      // Fallback: trường hợp client truyền chuỗi code chưa chuẩn hóa
      const upper = cleanIdentifier.toUpperCase();
      if (Object.values(PlanType).includes(upper as PlanType)) {
        plan = await prisma.subscriptionPlan.findUnique({
          where: { code: upper as PlanType },
        });
      }
    }

    if (!plan || !plan.is_active) {
      throw { statusCode: 404, message: 'Gói cước không tồn tại hoặc đã ngừng hỗ trợ' };
    }

    if (plan.price_vnd === 0) {
      throw { statusCode: 400, message: 'Gói miễn phí không cần thanh toán' };
    }

    let finalAmount = plan.price_vnd;
    let appliedDiscount = 0;
    let appliedPromoCode: string | null = null;

    if (promoCodeInput && promoCodeInput.trim()) {
      const codeNorm = promoCodeInput.trim().toUpperCase();
      const now = new Date();
      const promo = await prisma.promotionCode.findUnique({
        where: { code: codeNorm },
      });

      if (promo && promo.is_active && (!promo.expires_at || promo.expires_at > now)) {
        if (promo.max_uses === null || promo.current_uses < promo.max_uses) {
          if (promo.code_type === 'DISCOUNT_AMOUNT' && promo.discount_amount) {
            appliedDiscount = Math.min(plan.price_vnd, promo.discount_amount);
          } else if (promo.code_type === 'DISCOUNT_PERCENT' && promo.discount_percent) {
            appliedDiscount = Math.round((plan.price_vnd * promo.discount_percent) / 100);
          }
          if (appliedDiscount > 0) {
            finalAmount = Math.max(10000, plan.price_vnd - appliedDiscount);
            appliedPromoCode = promo.code;
          }
        }
      }
    }

    const paymentMethodMeta = encodePaymentMethodMetadata(plan.code, appliedPromoCode);
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Chống Spam đơn PENDING: Nếu user đã có đơn PENDING cùng gói & cùng số tiền trong 15 phút qua thì tái sử dụng
    let transaction = await prisma.transaction.findFirst({
      where: {
        user_id: userId,
        status: TransactionStatus.PENDING,
        amount: finalAmount,
        payment_method: paymentMethodMeta,
        created_at: { gte: fifteenMinsAgo },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!transaction) {
      // Hủy các đơn PENDING cũ của cùng user để tránh làm đầy hàng đợi Reconcile (DoS Starvation)
      if (typeof prisma.transaction.updateMany === 'function') {
        await prisma.transaction
          .updateMany({
            where: {
              user_id: userId,
              status: TransactionStatus.PENDING,
            },
            data: {
              status: TransactionStatus.FAILED,
            },
          })
          .catch(() => {});
      }

      // Sinh mã đơn ngắn gọn 14 ký tự (APTIS1M/3M/6M + 7 chữ số ngẫu nhiên an toàn) tránh bị NAPAS 247 cắt cụt
      const prefix = getPlanOrderPrefix(plan.code, plan.duration_days);
      let orderCode = `${prefix}${crypto.randomInt(1000000, 9999999)}`;
      for (let attempt = 0; attempt < 5; attempt++) {
        const existing = await prisma.transaction.findUnique({ where: { order_code: orderCode } });
        if (!existing) break;
        orderCode = `${prefix}${crypto.randomInt(1000000, 9999999)}`;
      }

      transaction = await prisma.transaction.create({
        data: {
          user_id: userId,
          order_code: orderCode,
          amount: finalAmount,
          status: TransactionStatus.PENDING,
          payment_method: paymentMethodMeta,
          bank_account: process.env.SEPAY_BANK_ACCOUNT || '0866950837',
          bank_name: process.env.SEPAY_BANK_NAME || 'MBBank',
        },
      });
    }

    const accountHolder = process.env.SEPAY_ACCOUNT_NAME || 'APTIS ESOL PREMIER';
    const qrUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(transaction.bank_account || '0866950837')}&bank=${encodeURIComponent(transaction.bank_name || 'MBBank')}&amount=${transaction.amount}&des=${encodeURIComponent(transaction.order_code)}`;

    // Trả về đồng thời cả camelCase và snake_case để tương thích 100% với mọi client
    return {
      transactionId: transaction.id,
      transaction_id: transaction.id,
      orderCode: transaction.order_code,
      order_code: transaction.order_code,
      amount: transaction.amount,
      originalAmount: plan.price_vnd,
      original_amount: plan.price_vnd,
      discountAmount: appliedDiscount,
      discount_amount: appliedDiscount,
      appliedPromoCode,
      applied_promo_code: appliedPromoCode,
      bankAccount: transaction.bank_account,
      bank_account: transaction.bank_account,
      bankName: transaction.bank_name,
      bank_name: transaction.bank_name,
      accountHolder,
      account_name: accountHolder,
      transferContent: transaction.order_code,
      transfer_content: transaction.order_code,
      qrUrl,
      qr_code_url: qrUrl,
      paymentStatus: transaction.status,
      payment_status: transaction.status,
      plan: {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        durationDays: plan.duration_days,
        aiQuota: plan.ai_quota,
        teacherQuota: plan.teacher_quota,
      },
    };
  }

  async handleWebhook(data: SepayWebhookInput, req?: any) {
    // 0. Xác thực SePay API Key nghiêm ngặt (Fail-Closed trên Production + Timing-Safe Compare)
    verifySepayWebhookAuth(req);

    // 0.1. Chặn biến động tiền ra (transferType === 'out')
    if (data.transferType && data.transferType.toLowerCase() !== 'in') {
      return {
        success: false,
        message: 'Bỏ qua giao dịch không phải tiền vào (transferType !== in)',
      };
    }

    // 0.2. Đối chiếu số tài khoản nhận nếu có cấu hình SEPAY_BANK_ACCOUNT
    const configuredAccount = (process.env.SEPAY_BANK_ACCOUNT || '').replace(/\s+/g, '');
    const incomingAccount = (data.accountNumber || '').replace(/\s+/g, '');
    if (configuredAccount && incomingAccount && configuredAccount !== incomingAccount) {
      return {
        success: false,
        message: 'Số tài khoản thụ hưởng trong Webhook không khớp với tài khoản hệ thống',
      };
    }

    // 1. Tìm orderCode trong content chuyển khoản (hỗ trợ cả APTIS1M/3M/6M + số và APTIS + số cũ)
    const normalizedContent = `${data.code || ''} ${data.content || ''}`
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    const match = normalizedContent.match(/APTIS(?:1M|3M|6M)?\d{6,18}/);

    let transaction: any = null;

    if (match) {
      transaction = await prisma.transaction.findUnique({
        where: { order_code: match[0] },
        include: { user: true },
      });
    }

    // Fallback: nếu ngân hàng chèn ký tự lạ hoặc mã đơn định dạng khác trong danh sách PENDING gần nhất
    if (!transaction) {
      const recentPending = await prisma.transaction.findMany({
        where: { status: TransactionStatus.PENDING },
        take: 50,
        orderBy: { created_at: 'desc' },
        include: { user: true },
      });

      transaction =
        recentPending.find((tx) => {
          const cleanCode = tx.order_code.toUpperCase().replace(/[^A-Z0-9]/g, '');
          return cleanCode.length >= 8 && normalizedContent.includes(cleanCode);
        }) || null;
    }

    if (!transaction) {
      return { success: false, message: 'Không tìm thấy giao dịch chờ xử lý khớp mã' };
    }

    // 2. Đối soát số tiền chuyển khoản & Cảnh báo nếu học viên chuyển thiếu tiền
    if (data.transferAmount < transaction.amount) {
      const shortfall = transaction.amount - data.transferAmount;
      auditService.record({
        systemActor: {
          id: transaction.user_id,
          name: 'Webhook SePay VietQR',
          email: 'payment-security@aptisesolpremier.com',
          role: 'SYSTEM',
        },
        action: AuditAction.PAYMENT_WEBHOOK_RECEIVED,
        entityType: 'TRANSACTION',
        entityId: transaction.id,
        description: `[CHUYỂN THIẾU TIỀN] Đơn ${transaction.order_code} cần ${transaction.amount.toLocaleString('vi-VN')}đ nhưng nhận được ${data.transferAmount.toLocaleString('vi-VN')}đ (thiếu ${shortfall.toLocaleString('vi-VN')}đ).`,
        newValue: {
          orderCode: transaction.order_code,
          expectedAmount: transaction.amount,
          receivedAmount: data.transferAmount,
          shortfall,
          sepayId: data.id,
          referenceCode: data.referenceCode,
        },
      });

      notificationService
        .createNotification({
          userId: transaction.user_id,
          type: NotificationType.SYSTEM,
          title: `Chuyển khoản chưa đủ số tiền đơn ${transaction.order_code}`,
          message: `Hệ thống ghi nhận bạn đã chuyển ${data.transferAmount.toLocaleString('vi-VN')}đ cho đơn ${transaction.order_code}, nhưng giá trị đơn là ${transaction.amount.toLocaleString('vi-VN')}đ (còn thiếu ${shortfall.toLocaleString('vi-VN')}đ). Vui lòng bấm "Báo sự cố" hoặc liên hệ Zalo Admin để được hỗ trợ kích hoạt.`,
          link: '/pricing',
        })
        .catch(() => {});

      Promise.resolve(
        prisma.user?.findMany({
          where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, is_active: true },
          select: { id: true },
        })
      )
        .then((admins) => {
          for (const admin of admins || []) {
            notificationService
              .createNotification({
                userId: admin.id,
                type: NotificationType.SYSTEM,
                title: `[CHUYỂN THIẾU TIỀN] Đơn ${transaction.order_code}`,
                message: `Học viên chuyển ${data.transferAmount.toLocaleString('vi-VN')}đ / ${transaction.amount.toLocaleString('vi-VN')}đ (thiếu ${shortfall.toLocaleString('vi-VN')}đ). Vui lòng kiểm tra và hỗ trợ.`,
                link: '/admin/finance',
              })
              .catch(() => {});
          }
        })
        .catch(() => {});

      return { success: false, message: 'Số tiền chuyển khoản không đủ' };
    }

    // 3. Chống lặp Webhook (Idempotency Guard)
    if (transaction.status === TransactionStatus.COMPLETED) {
      return {
        success: true,
        message: 'Giao dịch này đã được kích hoạt trước đó (Idempotent)',
        userId: transaction.user_id,
        orderCode: transaction.order_code,
      };
    }

    const bankRefId = String(data.id || data.referenceCode || '').trim();

    return this.activatePlanForTransaction(
      transaction,
      bankRefId,
      data.transferAmount,
      req,
      'Webhook SePay VietQR (MB Bank)'
    );
  }

  /**
   * Tìm chính xác gói cước mục tiêu của một Transaction (hỗ trợ cả đơn có áp mã giảm giá)
   */
  async resolvePlanForTransaction(transaction: any) {
    const meta = parsePaymentMetadata(transaction.payment_method, transaction.order_code);
    let plan: any = null;

    // Ưu tiên 1: Tìm theo mã gói đã nhúng trong metadata hoặc prefix mã đơn
    if (meta.planCode) {
      plan = await prisma.subscriptionPlan.findUnique({
        where: { code: meta.planCode },
      });
    }

    // Ưu tiên 2: Nếu DB dùng mã gói khác nhưng cùng thời hạn (30 / 90 / 180 ngày)
    if (!plan && meta.targetDurationDays) {
      plan = await prisma.subscriptionPlan.findFirst({
        where: { duration_days: meta.targetDurationDays, is_active: true },
        orderBy: { price_vnd: 'desc' },
      });
    }

    // Ưu tiên 3: Tìm theo số tiền khớp chính xác
    if (!plan) {
      plan = await prisma.subscriptionPlan.findFirst({
        where: { price_vnd: transaction.amount },
      });
    }

    // Ưu tiên 4: Tìm gói có phí <= số tiền chuyển (loại trừ gói FREE 0đ)
    if (!plan) {
      plan = await prisma.subscriptionPlan.findFirst({
        where: {
          price_vnd: { gt: 0, lte: transaction.amount },
          is_active: true,
        },
        orderBy: { price_vnd: 'desc' },
      });
    }

    // Ưu tiên 5: Nếu đơn có mã giảm giá sâu làm số tiền thấp hơn gói thấp nhất, lấy gói trả phí nhỏ nhất đang active
    if (!plan && transaction.amount > 0) {
      plan = await prisma.subscriptionPlan.findFirst({
        where: { price_vnd: { gt: 0 }, is_active: true },
        orderBy: { price_vnd: 'asc' },
      });
    }

    return { plan, promoCode: meta.promoCode };
  }

  /**
   * Kích hoạt gói cước VIP ATOMIC trong Prisma Transaction (ACID Compliance)
   * Dùng chung cho cả: Webhook, Đối soát On-demand của học viên, Đối soát nền Cron Job
   */
  async activatePlanForTransaction(
    transaction: any,
    sepayRefId: string,
    transferAmount: number,
    req?: any,
    actorDescription: string = 'Hệ thống Cổng SePay'
  ) {
    const { plan, promoCode } = await this.resolvePlanForTransaction(transaction);

    if (!plan) {
      throw { statusCode: 500, message: 'Lỗi cấu hình gói cước' };
    }

    const now = new Date();
    const cleanRefId = (sepayRefId || '').trim() || 'VERIFIED';
    const isGenericRef = ['VERIFIED', 'ON_DEMAND_SYNC', 'AUTO_RECONCILE'].includes(cleanRefId);

    // 2. Thực thi trong Prisma Transaction ATOMIC với Row-Level Claim Lock
    const result = await prisma.$transaction(async (tx) => {
      // 2.1. Chống Replay Attack: Không cho phép dùng lại sepay_ref_id của một đơn COMPLETED khác
      if (!isGenericRef && typeof tx.transaction?.findFirst === 'function') {
        const reusedTx = await tx.transaction.findFirst({
          where: {
            sepay_ref_id: cleanRefId,
            status: TransactionStatus.COMPLETED,
            id: { not: transaction.id },
          },
        });
        if (reusedTx) {
          throw {
            statusCode: 409,
            message: `Mã giao dịch ngân hàng (${cleanRefId}) đã được sử dụng cho đơn hàng ${reusedTx.order_code}`,
          };
        }
      }

      // 2.2. Khóa dòng nguyên tử (Atomic Conditional Update) chống Race Condition nhân đôi ngày VIP
      if (typeof tx.transaction?.updateMany === 'function') {
        const claimed = await tx.transaction.updateMany({
          where: {
            id: transaction.id,
            status: { not: TransactionStatus.COMPLETED },
          },
          data: {
            status: TransactionStatus.COMPLETED,
            paid_at: now,
            sepay_ref_id: cleanRefId,
          },
        });

        if (!claimed || claimed.count === 0) {
          return { isAlreadyCompleted: true };
        }
      } else {
        const currentTx = await tx.transaction.findUnique({
          where: { id: transaction.id },
        });
        if (!currentTx || currentTx.status === TransactionStatus.COMPLETED) {
          return { isAlreadyCompleted: true };
        }
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.COMPLETED,
            paid_at: now,
            sepay_ref_id: cleanRefId,
          },
        });
      }

      // 2.3. Cấp hoặc cộng dồn gói VIP
      const sub = await grantOrExtendSubscription(tx, {
        userId: transaction.user_id,
        planId: plan.id,
        transactionId: transaction.id,
        now,
      });

      // 2.4. Nếu đơn hàng có áp mã giảm giá, tăng current_uses cho mã khuyến mãi
      if (promoCode && typeof tx.promotionCode?.findUnique === 'function') {
        const promo = await tx.promotionCode.findUnique({ where: { code: promoCode } });
        if (promo) {
          await tx.promotionCode
            .update({
              where: { id: promo.id },
              data: { current_uses: { increment: 1 } },
            })
            .catch(() => {});
        }
      }

      return {
        isAlreadyCompleted: false,
        newEndDate: sub.end_date,
        newAiQuota: sub.ai_quota_left,
        newTeacherQuota: sub.teacher_quota_left,
      };
    });

    if (result.isAlreadyCompleted) {
      return {
        success: true,
        message: 'Giao dịch này đã được kích hoạt trước đó (Idempotent)',
        userId: transaction.user_id,
        orderCode: transaction.order_code,
      };
    }

    // 3. Ghi Audit Log kiểm toán
    auditService.record({
      systemActor: {
        id: transaction.user_id,
        name: actorDescription,
        email: 'payment-recovery@aptisesolpremier.com',
        role: 'SYSTEM',
      },
      action: AuditAction.PAYMENT_WEBHOOK_RECEIVED,
      entityType: 'TRANSACTION',
      entityId: transaction.id,
      description: `Kích hoạt thành công đơn ${transaction.order_code}, số tiền ${transferAmount.toLocaleString('vi-VN')}đ (${actorDescription}). Đã kích hoạt gói ${plan.name}.`,
      newValue: {
        status: TransactionStatus.COMPLETED,
        plan: plan.code,
        amount: transferAmount,
        sepayRefId: cleanRefId,
        endDate: result.newEndDate,
      },
    });

    // 4. Gửi thông báo cho người dùng
    notificationService
      .createNotification({
        userId: transaction.user_id,
        title: 'Kích hoạt tài khoản VIP thành công',
        message: `Gói ${plan.name} đã được kích hoạt thành công. Hạn sử dụng đến ${result.newEndDate?.toLocaleDateString('vi-VN') || ''}.`,
        type: NotificationType.VIP_ACTIVATED,
        link: '/pricing',
      })
      .catch(() => {});

    // Gửi email xác nhận quyền lợi VIP cho học viên
    prisma.user
      .findUnique({
        where: { id: transaction.user_id },
        select: { email: true, full_name: true },
      })
      .then((user) => {
        if (user?.email) {
          emailService
            .sendVipActivatedEmail(user.email, {
              fullName: user.full_name || 'Học viên',
              planName: plan.name,
              endDate: result.newEndDate || new Date(),
              aiQuota: result.newAiQuota ?? plan.ai_quota ?? 0,
              teacherQuota: result.newTeacherQuota ?? plan.teacher_quota ?? 0,
            })
            .catch((err) => {
              console.error(`[PaymentService] Lỗi gửi email kích hoạt VIP cho ${user.email}:`, err);
            });
        }
      })
      .catch(() => {});

    return {
      success: true,
      message: 'Kích hoạt gói cước VIP thành công',
      userId: transaction.user_id,
      orderCode: transaction.order_code,
      planName: plan.name,
      endDate: result.newEndDate,
      aiQuotaLeft: result.newAiQuota,
      teacherQuotaLeft: result.newTeacherQuota,
    };
  }

  /**
   * Truy vấn SePay Transaction List API để đối soát biến động số dư MB Bank
   */
  async querySepayTransactions(accountNumber?: string): Promise<any[]> {
    const apiKey = process.env.SEPAY_API_KEY;
    if (!apiKey) {
      return [];
    }

    try {
      const acc = accountNumber || process.env.SEPAY_BANK_ACCOUNT || '0866950837';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const url = `https://my.sepay.vn/userapi/transactions/list?account_number=${encodeURIComponent(acc)}&limit=50`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Apikey ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return [];
      }

      const json: any = await res.json();
      return json.transactions || [];
    } catch (err) {
      console.warn('[PaymentService] Không thể kết nối tới SePay Transaction List API:', err);
      return [];
    }
  }

  /**
   * CƠ CHẾ 1: Tự kiểm tra & Đối soát On-Demand từ phía Người Dùng
   * Giải quyết tình huống: Sập server, SePay rớt webhook, hoặc Ngân hàng gửi webhook chậm
   */
  async verifyTransaction(orderCode: string, userId?: string, req?: any) {
    const transaction = await prisma.transaction.findUnique({
      where: { order_code: orderCode },
      include: { user: true },
    });

    if (!transaction) {
      throw { statusCode: 404, message: 'Không tìm thấy đơn hàng' };
    }

    if (userId && transaction.user_id !== userId) {
      throw { statusCode: 403, message: 'Bạn không có quyền kiểm tra đơn hàng này' };
    }

    // 1. Nếu đã hoàn thành trong DB
    if (transaction.status === TransactionStatus.COMPLETED) {
      return {
        success: true,
        isCompleted: true,
        message: 'Giao dịch đã được ghi nhận và tài khoản VIP đã kích hoạt.',
        orderCode: transaction.order_code,
        status: transaction.status,
      };
    }

    // 2. Tra soát chủ động với SePay Transaction List API
    const sepayTransactions = await this.querySepayTransactions(transaction.bank_account || undefined);

    if (sepayTransactions.length > 0) {
      const cleanOrderCode = transaction.order_code.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const match = sepayTransactions.find((st: any) => {
        const content = (st.transaction_content || st.content || '')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '');
        const amountIn = Number(st.amount_in || st.transferAmount || 0);
        return content.includes(cleanOrderCode) && amountIn >= transaction.amount;
      });

      if (match) {
        const refId = String(match.id || match.reference_number || 'ON_DEMAND_SYNC').trim();
        const activated = await this.activatePlanForTransaction(
          transaction,
          refId,
          Number(match.amount_in || transaction.amount),
          req,
          'Học viên tự tra soát (On-demand Self-Reconciliation)'
        );

        return {
          ...activated,
          isCompleted: true,
          recovered: true,
          message: 'Hệ thống đã tìm thấy giao dịch chuyển khoản trên tài khoản ngân hàng và kích hoạt thành công!',
        };
      }
    }

    // 3. Nếu chưa thấy giao dịch ngân hàng
    return {
      success: false,
      isCompleted: false,
      orderCode: transaction.order_code,
      status: transaction.status,
      message: 'Chưa phát hiện biến động số dư khớp với mã đơn hàng trên tài khoản ngân hàng. Nếu bạn vừa chuyển tiền, hệ thống ngân hàng có thể mất 1-2 phút để đồng bộ. Vui lòng thử lại hoặc gửi báo cáo sự cố để được hỗ trợ.',
    };
  }

  /**
   * CƠ CHẾ 2: Học viên gửi Báo cáo sự cố thanh toán / Khiếu nại giao dịch
   * Giải quyết tình huống: Ghi sai nội dung CK, chuyển thiếu tiền, hoặc ngân hàng lỗi bảo trì kéo dài
   */
  async reportIssue(orderCode: string, input: ReportPaymentIssueInput, userId: string, req?: any) {
    const transaction = await prisma.transaction.findUnique({
      where: { order_code: orderCode },
      include: { user: true },
    });

    if (!transaction) {
      throw { statusCode: 404, message: 'Không tìm thấy đơn hàng' };
    }

    if (transaction.user_id !== userId) {
      throw { statusCode: 403, message: 'Bạn không có quyền báo cáo cho đơn hàng này' };
    }

    if (transaction.status === TransactionStatus.COMPLETED) {
      return {
        success: true,
        message: 'Đơn hàng này đã được thanh toán và kích hoạt VIP thành công trước đó.',
        supportHotline: '0866.950.837 (Zalo 24/7)',
      };
    }

    // 1. Ghi Audit Log khẩn cấp cho Quản trị viên
    auditService.record({
      req,
      action: AuditAction.PAYMENT_MANUAL_RESOLVE,
      entityType: 'TRANSACTION',
      entityId: transaction.id,
      description: `[KHIẾU NẠI KHẨN] Học viên ${transaction.user.full_name} (${transaction.user.email}) báo cáo đã chuyển khoản nhưng chưa kích hoạt đơn ${orderCode}. Mã GD: ${input.bankTransId}, Số tiền: ${input.transferAmount.toLocaleString('vi-VN')}đ, SĐT: ${input.contactPhone || 'N/A'}, Ghi chú: ${input.note || 'Không'}.`,
      newValue: {
        orderCode,
        bankTransId: input.bankTransId,
        transferAmount: input.transferAmount,
        senderBank: input.senderBank,
        senderAccount: input.senderAccount,
        receiptImageUrl: input.receiptImageUrl,
        note: input.note,
        contactPhone: input.contactPhone,
        reportedAt: new Date(),
      },
    });

    // 2. Broadcast thông báo khẩn cấp tới tất cả Admin & SuperAdmin
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true },
    });

    for (const admin of admins) {
      await notificationService.createNotification({
        userId: admin.id,
        title: `[TRA SOÁT KHẨN] Sự cố đơn hàng ${orderCode}`,
        message: `Học viên ${transaction.user.full_name} báo cáo đã chuyển ${input.transferAmount.toLocaleString('vi-VN')}đ (Mã GD: ${input.bankTransId}). Vui lòng kiểm tra sao kê ngân hàng và kích hoạt bù.`,
        type: NotificationType.SYSTEM,
        link: '/admin',
      }).catch(() => {});
    }

    // 3. Gửi thông báo an tâm cho học viên
    await notificationService.createNotification({
      userId: transaction.user_id,
      title: `Đã tiếp nhận yêu cầu hỗ trợ đơn ${orderCode}`,
      message: `Hệ thống đã chuyển thông tin tới Ban quản trị để tra soát sao kê MB Bank. Giao dịch của bạn sẽ được kích hoạt trong 5-15 phút. Hotline/Zalo 24/7: 0866.950.837.`,
      type: NotificationType.SYSTEM,
      link: '/profile',
    }).catch(() => {});

    // 4. Gửi email cảnh báo khẩn cấp tới hộp thư Quản trị viên
    emailService.sendAdminAlertEmail(
      `Khiếu nại chuyển khoản đơn ${orderCode} - ${transaction.user.full_name}`,
      `Học viên: ${transaction.user.full_name} (${transaction.user.email})\nĐơn hàng: ${orderCode}\nSố tiền báo cáo: ${input.transferAmount.toLocaleString('vi-VN')}đ\nMã GD Ngân hàng: ${input.bankTransId}\nSĐT: ${input.contactPhone || 'N/A'}\nNgân hàng: ${input.senderBank || 'N/A'} - ${input.senderAccount || 'N/A'}\nGhi chú: ${input.note || 'Không'}\n\nVui lòng tra soát sao kê MB Bank và kích hoạt bù qua trang Admin.`
    ).catch((err) => {
      console.error('[PaymentService] Lỗi gửi email cảnh báo khiếu nại cho Admin:', err);
    });

    return {
      success: true,
      message: 'Yêu cầu tra soát của bạn đã được gửi thành công! Ban Quản trị sẽ đối soát và kích hoạt trong vòng 5-15 phút. Bạn hoàn toàn có thể yên tâm!',
      supportHotline: '0866.950.837 (Zalo 24/7)',
    };
  }

  /**
   * CƠ CHẾ 3: Tra cứu trạng thái đơn hàng công khai (dùng cho Polling ở Modal QR)
   */
  async getOrderStatus(orderCode: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { order_code: orderCode },
      select: {
        id: true,
        order_code: true,
        amount: true,
        status: true,
        bank_name: true,
        paid_at: true,
        created_at: true,
      },
    });

    if (!transaction) {
      throw { statusCode: 404, message: 'Đơn hàng không tồn tại' };
    }

    return {
      ...transaction,
      isCompleted: transaction.status === TransactionStatus.COMPLETED,
    };
  }

  /**
   * CƠ CHẾ 4: Tự động đối soát nền (Background Reconciliation Job)
   * Tự động phục hồi các đơn bị rớt Webhook khi server restart hoặc mạng nghẽn
   */
  async reconcilePendingTransactions(req?: any) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pendingTxs = await prisma.transaction.findMany({
      where: {
        status: TransactionStatus.PENDING,
        created_at: { gte: oneDayAgo },
      },
      include: { user: true },
      take: 50,
      orderBy: { created_at: 'desc' },
    });

    if (pendingTxs.length === 0) {
      return { scanned: 0, recovered: 0 };
    }

    const sepayTransactions = await this.querySepayTransactions();
    if (sepayTransactions.length === 0) {
      return { scanned: pendingTxs.length, recovered: 0, message: 'SePay API không có dữ liệu giao dịch mới' };
    }

    let recoveredCount = 0;

    for (const tx of pendingTxs) {
      const cleanOrderCode = tx.order_code.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const match = sepayTransactions.find((st: any) => {
        const content = (st.transaction_content || st.content || '')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '');
        const amountIn = Number(st.amount_in || st.transferAmount || 0);
        return content.includes(cleanOrderCode) && amountIn >= tx.amount;
      });

      if (match) {
        try {
          const refId = String(match.id || match.reference_number || 'AUTO_RECONCILE').trim();
          await this.activatePlanForTransaction(
            tx,
            refId,
            Number(match.amount_in || tx.amount),
            req,
            'Đối soát tự động nền (Background Auto-Reconciliation)'
          );
          recoveredCount++;
        } catch (err) {
          console.error(`[Reconcile] Lỗi khi tự động kích hoạt đơn ${tx.order_code}:`, err);
        }
      }
    }

    return {
      scanned: pendingTxs.length,
      recovered: recoveredCount,
    };
  }

  async getMySubscription(userId: string) {
    const activeSub = await prisma.userSubscription.findFirst({
      where: {
        user_id: userId,
        is_active: true,
        end_date: { gt: new Date() },
      },
      include: { plan: true },
      orderBy: { end_date: 'desc' },
    });

    if (!activeSub) {
      return {
        hasActiveSubscription: false,
        is_active: false,
        plan: null,
      };
    }

    return {
      hasActiveSubscription: true,
      is_active: true,
      plan: {
        name: activeSub.plan.name,
        code: activeSub.plan.code,
        startDate: activeSub.start_date,
        endDate: activeSub.end_date,
        aiQuotaLeft: activeSub.ai_quota_left,
        teacherQuotaLeft: activeSub.teacher_quota_left,
        features: activeSub.plan.features,
      },
    };
  }

  async redeemPromoCode(userId: string, inputCode: string, req?: Request) {
    const codeNormalized = inputCode.trim().toUpperCase();
    const now = new Date();

    // 1. Kiểm tra mã tồn tại & hiệu lực
    let promo = await prisma.promotionCode.findUnique({
      where: { code: codeNormalized },
      include: { plan: true },
    });

    // Tự động đảm bảo mã GOLIVE14 tồn tại nếu học viên nhập
    if (!promo && (codeNormalized === 'GOLIVE14' || codeNormalized === 'APTISGOLIVE')) {
      const defaultPlan = await prisma.subscriptionPlan.findFirst({
        where: { is_active: true },
        orderBy: { price_vnd: 'desc' },
      });
      if (defaultPlan) {
        promo = await prisma.promotionCode.create({
          data: {
            code: codeNormalized,
            title: 'Mã trải nghiệm Go-Live 14 ngày VIP Pro',
            description: 'Tặng 14 ngày VIP Pro và 20 lượt chấm AI chuẩn British Council nhân dịp Go-Live',
            code_type: 'FREE_TRIAL',
            plan_id: defaultPlan.id,
            duration_days: 14,
            ai_quota: 20,
            is_featured: true,
            is_active: true,
            expires_at: new Date('2026-11-25T23:59:59.999+07:00'),
          },
          include: { plan: true },
        });
      }
    }

    if (!promo || !promo.is_active) {
      throw { statusCode: 400, message: 'Mã kích hoạt không hợp lệ hoặc đã kết thúc chương trình' };
    }

    if (promo.expires_at && now > promo.expires_at) {
      throw {
        statusCode: 400,
        message: 'Mã kích hoạt trải nghiệm đã hết hạn sử dụng (chương trình chỉ mở đến ngày 25/11). Vui lòng đăng ký gói VIP Pro để tiếp tục sử dụng toàn bộ tính năng.',
      };
    }

    if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
      throw { statusCode: 400, message: 'Mã kích hoạt đã hết lượt sử dụng' };
    }

    // 2. Thực thi transaction đảm bảo tính toàn vẹn & chống Race Condition (Atomic Execution)
    const subscription = await prisma.$transaction(async (tx) => {
      // 2.1. Kiểm tra chống kích hoạt lặp lại ngay bên trong Transaction
      const alreadyRedeemed = await tx.promotionRedemption.findFirst({
        where: {
          user_id: userId,
          ...(promo.code_type === 'FREE_TRIAL' ? {} : { code_id: promo.id }),
        },
      });

      if (alreadyRedeemed) {
        throw {
          statusCode: 400,
          message: 'Tài khoản của bạn đã từng kích hoạt mã trải nghiệm VIP rồi (mỗi tài khoản chỉ được dùng 1 lần). Vui lòng đăng ký gói Pro để tiếp tục sử dụng.',
        };
      }

      // 2.2. Tăng biến đếm số lượt đã dùng bằng khóa nguyên tử (Atomic Conditional Update)
      if (promo.max_uses !== null && typeof tx.promotionCode?.updateMany === 'function') {
        const claimed = await tx.promotionCode.updateMany({
          where: {
            id: promo.id,
            is_active: true,
            current_uses: { lt: promo.max_uses },
          },
          data: { current_uses: { increment: 1 } },
        });
        if (!claimed || claimed.count === 0) {
          throw { statusCode: 400, message: 'Mã kích hoạt đã hết lượt sử dụng' };
        }
      } else {
        await tx.promotionCode.update({
          where: { id: promo.id },
          data: { current_uses: { increment: 1 } },
        });
      }

      // 2.3. Cấp VIP qua helper hiện hữu (dùng tx thay vì prisma bên ngoài)
      let targetPlanId = promo.plan_id;
      if (!targetPlanId) {
        const fallbackPlan = await tx.subscriptionPlan.findFirst({
          where: { is_active: true },
          orderBy: { price_vnd: 'desc' },
        });
        targetPlanId = fallbackPlan?.id || '';
      }

      const sub = await grantOrExtendSubscription(tx, {
        userId,
        planId: targetPlanId,
        customDurationDays: promo.duration_days,
        customAiQuota: promo.ai_quota,
        customTeacherQuota: promo.teacher_quota,
        now,
      });

      // 2.4. Ghi nhận vết kích hoạt
      await tx.promotionRedemption.create({
        data: {
          code_id: promo.id,
          user_id: userId,
          subscription_id: sub.id,
          redeemed_at: now,
        },
      });

      return sub;
    });

    // 4. Lấy thông tin user để ghi Audit Log kiểm toán append-only cho Quản trị viên
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, full_name: true, email: true, role: true },
    });

    const endDateFormatted = new Date(subscription.end_date).toLocaleDateString('vi-VN');
    auditService.record({
      req,
      systemActor: user
        ? {
            id: user.id,
            name: user.full_name,
            email: user.email,
            role: user.role,
          }
        : undefined,
      action: AuditAction.USER_ROLE_CHANGE,
      entityType: 'PROMOTION_REDEMPTION',
      entityId: promo.id,
      description: `Học viên ${user?.full_name || 'N/A'} (${user?.email || 'N/A'}) kích hoạt mã trải nghiệm [${promo.code}]: Nhận ${promo.duration_days} ngày VIP Pro miễn phí và ${promo.ai_quota} lượt chấm AI (Hạn dùng đến ${endDateFormatted}).`,
      newValue: {
        promoCode: promo.code,
        planName: promo.plan?.name || 'VIP Pro',
        durationDays: promo.duration_days,
        aiQuota: promo.ai_quota,
        endDate: subscription.end_date,
      },
    });

    // 5. Bắn thông báo chuông cho học viên
    notificationService
      .createNotification({
        userId,
        type: NotificationType.VIP_ACTIVATED,
        title: 'Kích hoạt VIP Trải Nghiệm thành công!',
        message: `Bạn đã nhận được ${promo.duration_days} ngày trải nghiệm VIP kèm ${promo.ai_quota} lượt chấm AI.`,
        link: '/pricing',
      })
      .catch(() => {});

    return {
      success: true,
      message: `Chúc mừng bạn! Đã kích hoạt thành công ${promo.duration_days} ngày VIP trải nghiệm miễn phí!`,
      planName: promo.plan?.name || 'VIP Pro',
      durationDays: promo.duration_days,
      aiQuotaGranted: promo.ai_quota,
      aiQuotaLeft: subscription.ai_quota_left,
      endDate: subscription.end_date,
    };
  }

  async getTransactions(userId: string) {
    return prisma.transaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }
}

export const paymentService = new PaymentService();
