import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { emailService, SendMailOptions } from './email.service';

/**
 * Hàng đợi email (BullMQ + Redis) + Bộ đếm ngân sách Email theo ngày UTC (Resend Free: 80/100 email/ngày)
 *
 * - Giới hạn tốc độ gửi (EMAIL_RATE_PER_SEC, mặc định 5 email/giây) để không vượt hạn mức 10 req/s của Resend.
 * - Tự retry 3 lần với backoff luỹ thừa khi gửi lỗi.
 * - Đếm số email đã gửi trong ngày UTC bằng Redis (`email:count:YYYY-MM-DD`, TTL 48h) hoặc bộ nhớ RAM dự phòng.
 * - Nếu không có REDIS_URL hoặc Redis lỗi: tự động gửi trực tiếp (không mất email, không sập server).
 */
const QUEUE_NAME = 'email-notifications';

class EmailQueue {
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private connection: IORedis | null = null;
  private redisReady = false;
  private memoryDailyCounter = new Map<string, number>();

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.log('[EmailQueue] REDIS_URL chưa cấu hình: gửi email trực tiếp & đếm quota ngày trên RAM.');
      return;
    }

    try {
      this.connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
      this.connection.on('ready', () => {
        this.redisReady = true;
      });
      this.connection.on('error', (err) => {
        this.redisReady = false;
        console.error('[EmailQueue] Lỗi kết nối Redis:', err.message);
      });
      this.connection.on('close', () => {
        this.redisReady = false;
      });

      this.queue = new Queue(QUEUE_NAME, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 10000 },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      });

      this.worker = new Worker(
        QUEUE_NAME,
        async (job) => {
          const result = await emailService.sendMail(job.data as SendMailOptions);
          if (!result.success && !result.skippedByBudget) {
            // Ném lỗi để BullMQ tự retry (trừ khi chủ động bỏ qua do chạm ngưỡng ngân sách 80/100)
            throw new Error(result.error || 'Gửi email thất bại');
          }
        },
        {
          connection: this.connection,
          concurrency: 2,
          limiter: {
            max: Number(process.env.EMAIL_RATE_PER_SEC) || 5,
            duration: 1000,
          },
        }
      );
      this.worker.on('failed', (job, err) => {
        console.error(`[EmailQueue] Job ${job?.id} thất bại (lần ${job?.attemptsMade}):`, err.message);
      });
      this.worker.on('error', (err) => {
        console.error('[EmailQueue] Worker lỗi:', err.message);
      });
      console.log('[EmailQueue] Đã bật hàng đợi email & bộ đếm ngân sách ngày qua Redis.');
    } catch (err: any) {
      console.error('[EmailQueue] Không khởi tạo được hàng đợi, gửi trực tiếp:', err.message);
      this.queue = null;
      this.worker = null;
    }
  }

  private getUtcDateKey(): string {
    const todayUtc = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
    return `email:count:${todayUtc}`;
  }

  /**
   * Lấy số lượng email đã gửi thành công trong ngày UTC hiện tại
   */
  async getTodaySentCount(): Promise<number> {
    const key = this.getUtcDateKey();
    if (this.connection && this.redisReady) {
      try {
        const val = await this.connection.get(key);
        return val ? Number(val) || 0 : 0;
      } catch {
        // Fallback xuống RAM nếu Redis chập chờn
      }
    }
    return this.memoryDailyCounter.get(key) || 0;
  }

  /**
   * Cộng 1 vào bộ đếm số email đã gửi trong ngày UTC hiện tại (TTL 48 giờ)
   */
  async incrementTodaySentCount(): Promise<number> {
    const key = this.getUtcDateKey();
    const nextMem = (this.memoryDailyCounter.get(key) || 0) + 1;
    this.memoryDailyCounter.set(key, nextMem);

    if (this.connection && this.redisReady) {
      try {
        const count = await this.connection.incr(key);
        if (count === 1) {
          await this.connection.expire(key, 48 * 60 * 60);
        }
        return count;
      } catch {
        // Giữ kết quả từ RAM
      }
    }
    return nextMem;
  }

  /**
   * Đưa email vào hàng đợi. Nếu hàng đợi không khả dụng thì gửi trực tiếp.
   */
  async enqueue(mail: SendMailOptions): Promise<void> {
    if (this.queue && this.redisReady) {
      try {
        await this.queue.add('send', mail);
        return;
      } catch (err: any) {
        console.error('[EmailQueue] Không thêm được job, gửi trực tiếp:', err.message);
      }
    }
    await emailService.sendMail(mail);
  }

  async close(): Promise<void> {
    await this.worker?.close().catch(() => {});
    await this.queue?.close().catch(() => {});
    this.connection?.disconnect();
  }
}

export const emailQueue = new EmailQueue();
