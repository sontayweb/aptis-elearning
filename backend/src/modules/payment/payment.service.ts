import { prisma } from '../../config/database';
import { PlanType, TransactionStatus, AuditAction, NotificationType } from '@prisma/client';
import { SepayWebhookInput, ReportPaymentIssueInput } from './payment.dto';
import { auditService } from '../audit/audit.service';
import { notificationService } from '../notifications/notification.service';
import { grantOrExtendSubscription } from '../../utils/subscription-helper';

export class PaymentService {
  async getPlans() {
    return prisma.subscriptionPlan.findMany({
      where: { is_active: true },
      orderBy: { price_vnd: 'asc' },
    });
  }

  async initiatePayment(userId: string, planCode: PlanType) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { code: planCode },
    });

    if (!plan || !plan.is_active) {
      throw { statusCode: 404, message: 'Gói cước không tồn tại hoặc đã ngừng hỗ trợ' };
    }

    if (plan.price_vnd === 0) {
      throw { statusCode: 400, message: 'Gói miễn phí không cần thanh toán' };
    }

    // Sinh mã đơn hàng duy nhất: APTIS_<TIMESTAMP>_<SUFFIX>
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `APTIS${Date.now()}${randomSuffix}`;

    const transaction = await prisma.transaction.create({
      data: {
        user_id: userId,
        order_code: orderCode,
        amount: plan.price_vnd,
        status: TransactionStatus.PENDING,
        bank_account: process.env.SEPAY_BANK_ACCOUNT || '0866950837',
        bank_name: process.env.SEPAY_BANK_NAME || 'MBBank',
      },
    });

    const qrUrl = `https://qr.sepay.vn/img?acc=${transaction.bank_account}&bank=${transaction.bank_name}&amount=${transaction.amount}&des=${transaction.order_code}`;

    return {
      transactionId: transaction.id,
      orderCode: transaction.order_code,
      amount: transaction.amount,
      bankAccount: transaction.bank_account,
      bankName: transaction.bank_name,
      accountHolder: 'APTIS KY TICH',
      transferContent: transaction.order_code,
      qrUrl,
      plan: {
        code: plan.code,
        name: plan.name,
        durationDays: plan.duration_days,
        aiQuota: plan.ai_quota,
        teacherQuota: plan.teacher_quota,
      },
    };
  }

  async handleWebhook(data: SepayWebhookInput, req?: any) {
    // 0. Xác thực SePay API Key (Webhook Security) nếu có thiết lập trong cấu hình sản xuất
    if (process.env.SEPAY_API_KEY && req?.headers) {
      const authHeader = req.headers.authorization || '';
      const expectedToken = process.env.SEPAY_API_KEY;
      const isApikeyMatch =
        authHeader === `Apikey ${expectedToken}` ||
        authHeader === expectedToken ||
        req.headers['x-sepay-token'] === expectedToken;

      if (!isApikeyMatch && process.env.NODE_ENV === 'production') {
        throw { statusCode: 401, message: 'Chữ ký Webhook SePay không hợp lệ (Unauthorized)' };
      }
    }

    // 1. Tìm orderCode trong content chuyển khoản bằng Regex O(1)
    // Format: APTIS17272218001234
    const content = data.content.toUpperCase().replace(/\s+/g, '');
    const match = content.match(/APTIS\d+/);

    let transaction: any = null;

    if (match) {
      // Indexed query trực tiếp theo B-Tree Index: O(1)
      transaction = await prisma.transaction.findUnique({
        where: { order_code: match[0] },
        include: { user: true },
      });
    }

    // Fallback: nếu ngân hàng chèn thêm dấu gạch nối hoặc ký tự lạ làm đứt chuỗi regex
    if (!transaction) {
      const recentPending = await prisma.transaction.findMany({
        where: { status: TransactionStatus.PENDING },
        take: 50,
        orderBy: { created_at: 'desc' },
        include: { user: true },
      });

      transaction =
        recentPending.find((tx) => content.includes(tx.order_code.toUpperCase())) || null;
    }

    if (!transaction) {
      return { success: false, message: 'Không tìm thấy giao dịch chờ xử lý khớp mã' };
    }

    // 2. Đối soát số tiền chuyển khoản
    if (data.transferAmount < transaction.amount) {
      return { success: false, message: 'Số tiền chuyển khoản không đủ' };
    }

    // 3. Chống lặp Webhook (Idempotency Guard)
    // Nếu giao dịch đã hoàn thành trước đó (do network retry hoặc delay), trả về thành công ngay lập tức
    if (transaction.status === TransactionStatus.COMPLETED) {
      return {
        success: true,
        message: 'Giao dịch này đã được kích hoạt trước đó (Idempotent)',
        userId: transaction.user_id,
        orderCode: transaction.order_code,
      };
    }

    return this.activatePlanForTransaction(
      transaction,
      String(data.referenceCode || data.id || ''),
      data.transferAmount,
      req,
      'Webhook SePay VietQR (MB Bank)'
    );
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
    // 1. Tìm plan theo số tiền hoặc lấy gói tương ứng
    let plan = await prisma.subscriptionPlan.findFirst({
      where: { price_vnd: transaction.amount },
    });

    if (!plan) {
      plan = await prisma.subscriptionPlan.findFirst({
        where: { price_vnd: { lte: transaction.amount }, is_active: true },
        orderBy: { price_vnd: 'desc' },
      });
    }

    if (!plan) {
      throw { statusCode: 500, message: 'Lỗi cấu hình gói cước' };
    }

    const now = new Date();
    const durationMs = plan.duration_days * 24 * 60 * 60 * 1000;

    // 2. Thực thi trong Prisma Transaction ATOMIC
    const result = await prisma.$transaction(async (tx) => {
      const currentTx = await tx.transaction.findUnique({
        where: { id: transaction.id },
      });

      if (!currentTx || currentTx.status === TransactionStatus.COMPLETED) {
        return { isAlreadyCompleted: true };
      }

      const sub = await grantOrExtendSubscription(tx, {
        userId: transaction.user_id,
        planId: plan.id,
        transactionId: transaction.id,
        now,
      });

      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.COMPLETED,
          paid_at: now,
          sepay_ref_id: sepayRefId || 'VERIFIED',
        },
      });

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
        email: 'payment-recovery@aptiskytich.vn',
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
        endDate: result.newEndDate,
      },
    });

    // 4. Gửi thông báo cho người dùng
    notificationService.createNotification({
      userId: transaction.user_id,
      title: 'Kích hoạt tài khoản VIP thành công 🎉',
      message: `Gói ${plan.name} đã được kích hoạt thành công. Hạn sử dụng đến ${result.newEndDate?.toLocaleDateString('vi-VN') || ''}.`,
      type: NotificationType.VIP_ACTIVATED,
      link: '/pricing',
    }).catch(() => {});

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
      const cleanOrderCode = transaction.order_code.toUpperCase().replace(/\s+/g, '');
      const match = sepayTransactions.find((st: any) => {
        const content = (st.transaction_content || st.content || '').toUpperCase().replace(/\s+/g, '');
        const amountIn = Number(st.amount_in || st.transferAmount || 0);
        return content.includes(cleanOrderCode) && amountIn >= transaction.amount;
      });

      if (match) {
        const activated = await this.activatePlanForTransaction(
          transaction,
          String(match.reference_number || match.id || 'ON_DEMAND_SYNC'),
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

    return {
      success: true,
      message: 'Yêu cầu tra soát của bạn đã được gửi thành công! Ban Quản trị sẽ đối soát và kích hoạt trong vòng 5-15 phút. Bạn hoàn toàn có thể yên tâm!',
      supportHotline: '0866.950.837 (Zalo 24/7)',
    };
  }

  /**
   * CƠ CHẾ 3: Tra cứu trạng thái đơn hàng công khai
   */
  async getOrderStatus(orderCode: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { order_code: orderCode },
      select: {
        id: true,
        order_code: true,
        amount: true,
        status: true,
        bank_account: true,
        bank_name: true,
        paid_at: true,
        created_at: true,
      },
    });

    if (!transaction) {
      throw { statusCode: 404, message: 'Đơn hàng không tồn tại' };
    }

    return transaction;
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
      const cleanOrderCode = tx.order_code.toUpperCase().replace(/\s+/g, '');
      const match = sepayTransactions.find((st: any) => {
        const content = (st.transaction_content || st.content || '').toUpperCase().replace(/\s+/g, '');
        const amountIn = Number(st.amount_in || st.transferAmount || 0);
        return content.includes(cleanOrderCode) && amountIn >= tx.amount;
      });

      if (match) {
        try {
          await this.activatePlanForTransaction(
            tx,
            String(match.reference_number || match.id || 'AUTO_RECONCILE'),
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
        plan: null,
      };
    }

    return {
      hasActiveSubscription: true,
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

  async getTransactions(userId: string) {
    return prisma.transaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }
}

export const paymentService = new PaymentService();
