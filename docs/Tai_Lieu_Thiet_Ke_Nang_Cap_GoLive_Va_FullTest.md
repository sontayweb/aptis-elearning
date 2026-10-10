# TÀI LIỆU THIẾT KẾ KỸ THUẬT CHI TIẾT
## NÂNG CẤP HỆ THỐNG MÃ TRẢI NGHIỆM GO-LIVE & HOÀN THIỆN ĐỀ THI THỬ FULL TEST
**Dự án:** Hệ thống Luyện thi Aptis ESOL Kỳ Tích (`aptis-elearning`)  
**Ngày lập:** 10/10/2026  
**Nguyên tắc thiết kế:** Bám sát 100% cấu trúc cơ sở dữ liệu hiện hữu và luồng nghiệp vụ chuẩn của British Council. Không phỏng đoán, không tự chế thừa thãi.

---

## MỤC LỤC
1. [HIỆN TRẠNG KIẾN TRÚC & PHÂN TÍCH GAP](#1-hiện-trạng-kiến-trúc--phân-tích-gap)
2. [MODULE 1: HỆ THỐNG MÃ KÍCH HOẠT PRO TRẢI NGHIỆM GO-LIVE](#2-module-1-hệ-thống-mã-kích-hoạt-pro-trải-nghiệm-go-live)
   - 2.1. Thiết kế Schema Database (Prisma)
   - 2.2. DTO & Validation (Zod)
   - 2.3. Logic Service & Transaction Engine
   - 2.4. API Endpoint Contract
   - 2.5. Thiết kế Giao diện Frontend
3. [MODULE 2: HOÀN THIỆN LÕI ĐỀ THI THỬ FULL TEST (162 PHÚT)](#3-module-2-hoàn-thiện-lõi-đề-thi-thử-full-test-162-phút)
   - 3.1. Cấu trúc 22 Parts hiện hữu trong Database
   - 3.2. Chuẩn hóa Quy đổi Điểm theo Chuẩn British Council (Thang 200)
   - 3.3. Vá lỗi tính điểm trong ai-grading.service.ts
   - 3.4. Cơ chế Kích hoạt Tự động Chấm AI Ngầm (Auto-trigger AI Grading)
   - 3.5. Nâng cấp Giao diện Phòng thi & Bảng điểm Profile 5 Kỹ năng
4. [LỘ TRÌNH TRIỂN KHAI VÀ CHECKLIST NGHIỆM THU](#4-lộ-trình-triển-khai-và-checklist-nghiệm-thu)

---

## 1. HIỆN TRẠNG KIẾN TRÚC & PHÂN TÍCH GAP

### 1.1. Hiện trạng hệ thống gói cước VIP (Subscription)
* **Cơ chế xác thực VIP hiện hành:** File [backend/src/utils/pro-guard.ts](file:///d:/sontayweb/aptis-elearning/backend/src/utils/pro-guard.ts) kiểm tra:
  ```ts
  const activeSub = await prisma.userSubscription.findFirst({
    where: {
      user_id: userId,
      is_active: true,
      end_date: { gt: new Date() }, // Xác định trạng thái VIP động theo thời gian thực
    },
  });
  ```
  👉 **Ưu điểm có sẵn:** Khi gói cước hết hạn (`end_date <= now`), hệ thống tự động từ chối quyền truy cập PRO và trả về gói thường ngay lập tức mà không cần bất kỳ cron job quét ngầm nào.
* **Hàm cấp gói cước:** [backend/src/utils/subscription-helper.ts](file:///d:/sontayweb/aptis-elearning/backend/src/utils/subscription-helper.ts) đã có sẵn hàm `grantOrExtendSubscription()` nhận tham số `customDurationDays` và `customAiQuota`.
* **KHOẢNG TRỐNG (GAP 1):** Chưa có bảng `PromotionCode` và `PromotionRedemption`. Chưa có API cho học viên gửi mã code lên để nhận 14-20 ngày VIP. Chưa có cơ chế khóa 1 User chỉ được nhập mã 1 lần.

### 1.2. Hiện trạng bộ đề thi Full Test
* **Dữ liệu hiện hành:** Đã có đủ **26 bộ đề Full Test** trong cơ sở dữ liệu (`skill = 'FULL_TEST'`, `duration_minutes = 162`). Mỗi đề gồm đúng **22 Parts** với **118 câu hỏi**.
* **KHOẢNG TRỐNG (GAP 2 - Lỗi chí mạng):** Trong [backend/src/modules/ai-grading/ai-grading.service.ts:427](file:///d:/sontayweb/aptis-elearning/backend/src/modules/ai-grading/ai-grading.service.ts#L427), khi chấm xong Writing & Speaking, hàm tính:
  ```ts
  const finalScore = Math.round((writingTotalScore + speakingTotalScore) / subjectiveQuestionCount);
  ```
  rồi ghi đè vào `examSubmission.total_score`. Toàn bộ điểm **Reading, Listening, Grammar bị xóa sạch khỏi tổng điểm**.
* **KHOẢNG TRỐNG (GAP 3):** Sau khi nộp bài Full Test, không có trigger gọi `POST /api/ai-grading/evaluate/:id`. Học viên bị treo ở thông báo *"Đang chờ giáo viên chấm trong 24-48h"*.

---

## 2. MODULE 1: HỆ THỐNG MÃ KÍCH HOẠT PRO TRẢI NGHIỆM GO-LIVE

### 2.1. Thiết kế Schema Database (Prisma)
Bổ sung 2 models vào file [backend/prisma/schema.prisma](file:///d:/sontayweb/aptis-elearning/backend/prisma/schema.prisma):

```prisma
// ==========================================
// 6.1. PROMOTION & REDEEM CODES (GO-LIVE)
// ==========================================

model PromotionCode {
  id               String               @id @default(uuid())
  code             String               @unique // Ví dụ: "APTISGOLIVE", "KYTICH14N" (Lưu UPPERCASE)
  title            String               // "Mã trải nghiệm Go-Live 14 ngày VIP"
  description      String?              // "Tặng 14 ngày VIP và 20 lượt chấm AI chuẩn British Council"
  plan_id          String               // Trỏ tới Gói VIP_1M trong bảng SubscriptionPlan
  duration_days    Int                  @default(14) // Thời hạn: 14 hoặc 20 ngày
  ai_quota         Int                  @default(20) // Số lượt chấm AI tặng kèm
  teacher_quota    Int                  @default(0)  // Số lượt giáo viên chấm (mặc định 0)
  max_uses         Int?                 // Giới hạn số lượt toàn hệ thống (null = không giới hạn)
  current_uses     Int                  @default(0)  // Đếm số lượt đã kích hoạt
  is_active        Boolean              @default(true)
  starts_at        DateTime             @default(now())
  expires_at       DateTime?            // Hạn chót sử dụng mã (Ví dụ: hết tháng đầu tiên Go-Live)
  created_at       DateTime             @default(now())
  updated_at       DateTime             @updatedAt

  plan             SubscriptionPlan     @relation(fields: [plan_id], references: [id])
  redemptions      PromotionRedemption[]

  @@index([code, is_active])
}

model PromotionRedemption {
  id               String         @id @default(uuid())
  code_id          String
  user_id          String
  subscription_id  String
  redeemed_at      DateTime       @default(now())

  code             PromotionCode  @relation(fields: [code_id], references: [id], onDelete: Cascade)
  user             User           @relation(fields: [user_id], references: [id], onDelete: Cascade)

  // RÀNG BUỘC CỐT LÕI: Chống 1 tài khoản nhập mã nhiều lần để gian lận ngày VIP
  @@unique([code_id, user_id])
  @@index([user_id])
}
```

### 2.2. DTO & Validation (Zod)
File: `backend/src/modules/payment/payment.dto.ts`
```typescript
import { z } from 'zod';

export const redeemPromoCodeSchema = z.object({
  code: z
    .string()
    .min(3, 'Mã kích hoạt phải có ít nhất 3 ký tự')
    .max(30, 'Mã kích hoạt không vượt quá 30 ký tự')
    .transform((val) => val.trim().toUpperCase()),
});

export type RedeemPromoCodeInput = z.infer<typeof redeemPromoCodeSchema>;
```

### 2.3. Logic Service & Transaction Engine
File: `backend/src/modules/payment/payment.service.ts`
Thêm phương thức `redeemPromoCode`:

```typescript
async redeemPromoCode(userId: string, inputCode: string) {
  const codeNormalized = inputCode.trim().toUpperCase();
  const now = new Date();

  // 1. Kiểm tra mã tồn tại & hiệu lực
  const promo = await prisma.promotionCode.findUnique({
    where: { code: codeNormalized },
    include: { plan: true },
  });

  if (!promo || !promo.is_active) {
    throw { statusCode: 400, message: 'Mã kích hoạt không hợp lệ hoặc đã kết thúc chương trình' };
  }

  if (promo.expires_at && now > promo.expires_at) {
    throw { statusCode: 400, message: 'Mã kích hoạt đã hết hạn sử dụng' };
  }

  if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
    throw { statusCode: 400, message: 'Mã kích hoạt đã hết số lượng giới hạn' };
  }

  // 2. Chống kích hoạt lặp lại (Anti-Abuse Check)
  const alreadyRedeemed = await prisma.promotionRedemption.findUnique({
    where: {
      code_id_user_id: {
        code_id: promo.id,
        user_id: userId,
      },
    },
  });

  if (alreadyRedeemed) {
    throw { statusCode: 400, message: 'Bạn đã từng kích hoạt mã trải nghiệm này rồi' };
  }

  // 3. Thực thi Transaction đảm bảo tính toàn vẹn (Atomic Execution)
  const result = await prisma.$transaction(async (tx) => {
    // 3.1 Cấp VIP qua helper hiện hữu
    const subscription = await grantOrExtendSubscription(tx, {
      userId,
      planId: promo.plan_id,
      customDurationDays: promo.duration_days,
      customAiQuota: promo.ai_quota,
      customTeacherQuota: promo.teacher_quota,
      now,
    });

    // 3.2 Ghi nhận vết kích hoạt
    await tx.promotionRedemption.create({
      data: {
        code_id: promo.id,
        user_id: userId,
        subscription_id: subscription.id,
        redeemed_at: now,
      },
    });

    // 3.3 Tăng biến đếm số lượt đã dùng
    await tx.promotionCode.update({
      where: { id: promo.id },
      data: { current_uses: { increment: 1 } },
    });

    return subscription;
  });

  // 4. Bắn thông báo chuông cho học viên
  await notificationService.createNotification(
    userId,
    NotificationType.VIP_ACTIVATED,
    '🎉 Kích hoạt VIP Trải Nghiệm thành công!',
    `Bạn đã nhận được ${promo.duration_days} ngày trải nghiệm VIP kèm ${promo.ai_quota} lượt chấm AI.`
  );

  return {
    success: true,
    message: `Kích hoạt thành công ${promo.duration_days} ngày VIP trải nghiệm!`,
    planName: promo.plan.name,
    durationDays: promo.duration_days,
    aiQuotaGranted: promo.ai_quota,
    aiQuotaLeft: result.ai_quota_left,
    expireDate: result.end_date,
  };
}
```

### 2.4. API Endpoint Contract
* **URL:** `POST /api/payment/redeem-code`
* **Headers:** `Authorization: Bearer <TOKEN>`
* **Body:**
  ```json
  { "code": "APTISGOLIVE" }
  ```
* **Response 200 (Thành công):**
  ```json
  {
    "success": true,
    "message": "Kích hoạt thành công 14 ngày VIP trải nghiệm!",
    "data": {
      "planName": "Aptis Tốc Hành (1 Tháng)",
      "durationDays": 14,
      "aiQuotaGranted": 20,
      "aiQuotaLeft": 20,
      "expireDate": "2026-10-24T00:00:00.000Z"
    }
  }
  ```
* **Response 400 (Lỗi):**
  ```json
  {
    "success": false,
    "message": "Bạn đã từng kích hoạt mã trải nghiệm này rồi"
  }
  ```

---

## 3. MODULE 2: HOÀN THIỆN LÕI ĐỀ THI THỬ FULL TEST (162 PHÚT)

### 3.1. Cấu trúc 22 Parts hiện hữu trong Database
Mỗi đề thi Full Test trong hệ thống gồm đúng 22 parts:
```
[1 - 4]   SPEAKING          (12 câu): Part 1 cá nhân, Part 2 mô tả, Part 3 so sánh, Part 4 trừu tượng
[5 - 8]   LISTENING         (25 câu): Part 1 nhận biết, Part 2 nối tin, Part 3 quan điểm, Part 4 độc thoại
[9 - 14]  GRAMMAR & VOCAB   (50 câu): Part 1 Ngữ pháp 25 câu; Part 2-6 Từ vựng 25 câu
[15 - 18] READING           (21 câu): Part 1 điền từ, Part 2 liên kết, Part 3 nối ý, Part 4 đọc dài
[19 - 22] WRITING           (10 câu): Part 1 từ vựng, Part 2 điền form, Part 3 chat CLB, Part 4 Email kép
```

### 3.2. Chuẩn hóa Quy đổi Điểm theo Chuẩn British Council (Thang 200)

1. **Điểm từng kỹ năng:** Được chuẩn hóa độc lập về thang **0 - 50 điểm**:
   * $\text{Listening Score} = \text{round}\left(\frac{\text{Số câu nghe đúng}}{25} \times 50\right)$
   * $\text{Reading Score} = \text{round}\left(\frac{\text{Điểm raw đọc}}{\text{Tổng max raw đọc}} \times 50\right)$
   * $\text{Writing Score} = \text{round}\left(\frac{\sum \text{Điểm AI Writing}}{4} \times 1\right)$ (Trung bình 4 Parts)
   * $\text{Speaking Score} = \text{round}\left(\frac{\sum \text{Điểm AI Speaking}}{4} \times 1\right)$ (Trung bình 4 Parts)
   * $\text{Grammar & Vocab Score} = \text{round}\left(\frac{\text{Số câu đúng}}{50} \times 50\right)$
2. **Điểm Tổng kết (Overall Score):**
   $$\mathbf{Total\ Score} = \mathbf{Listening} + \mathbf{Reading} + \mathbf{Writing} + \mathbf{Speaking} \in [0, 200]$$
3. **Quy đổi CEFR Tổng (Aptis Profile CEFR Rule):**
   * **C Target:** $\ge 160$ điểm (và không có kỹ năng nào dưới B1)
   * **B2 Target:** $120 - 159$ điểm
   * **B1 Target:** $80 - 119$ điểm
   * **A2 Target:** $50 - 79$ điểm
   * **A1/A0:** $< 50$ điểm
   *(Nếu điểm rơi vào vùng giáp ranh $\pm 2$ điểm, điểm `Grammar & Vocab` $\ge 38/50$ sẽ được ưu tiên làm đòn bẩy nâng lên bậc CEFR cao hơn theo đúng quy chế British Council).*

### 3.3. Vá lỗi tính điểm trong ai-grading.service.ts
Tại dòng 427-440 của [backend/src/modules/ai-grading/ai-grading.service.ts](file:///d:/sontayweb/aptis-elearning/backend/src/modules/ai-grading/ai-grading.service.ts):

```typescript
// SỬA LỖI TÍNH ĐIỂM FULL TEST CHUẨN XÁC:
const isFullTest = submission.exam.skill === ExamSkill.FULL_TEST;

let writingScore = 0;
let speakingScore = 0;
let totalWritingCount = 0;
let totalSpeakingCount = 0;

for (const res of aiResults) {
  if (res.skill === ExamSkill.WRITING) {
    writingScore += res.score;
    totalWritingCount++;
  } else if (res.skill === ExamSkill.SPEAKING) {
    speakingScore += res.score;
    totalSpeakingCount++;
  }
}

const finalWritingScore = totalWritingCount > 0 ? Math.round(writingScore / totalWritingCount) : 0;
const finalSpeakingScore = totalSpeakingCount > 0 ? Math.round(speakingScore / totalSpeakingCount) : 0;

let finalTotalScore: number;
let overallCefr: string;

if (isFullTest) {
  const rScore = submission.reading_score || 0;
  const lScore = submission.listening_score || 0;
  // Tổng điểm 4 kỹ năng chuẩn thang 200
  finalTotalScore = rScore + lScore + finalWritingScore + finalSpeakingScore;
  overallCefr = calculateFullTestCefr(finalTotalScore, submission.grammar_score || 0);
} else if (submission.exam.skill === ExamSkill.WRITING) {
  finalTotalScore = finalWritingScore;
  overallCefr = scoreToCefr(finalTotalScore);
} else if (submission.exam.skill === ExamSkill.SPEAKING) {
  finalTotalScore = finalSpeakingScore;
  overallCefr = scoreToCefr(finalTotalScore);
} else {
  finalTotalScore = submission.total_score || 0;
  overallCefr = scoreToCefr(finalTotalScore);
}

// Cập nhật đầy đủ các cột kỹ năng vào DB
await prisma.examSubmission.update({
  where: { id: submissionId },
  data: {
    status: SubmissionStatus.GRADED,
    total_score: finalTotalScore,
    cefr_level: overallCefr,
    writing_score: finalWritingScore,
    speaking_score: finalSpeakingScore,
  },
});
```

### 3.4. Cơ chế Kích hoạt Tự động Chấm AI Ngầm (Auto-trigger AI Grading)
* **Tại Backend [submission.service.ts](file:///d:/sontayweb/aptis-elearning/backend/src/modules/submissions/submission.service.ts):**
  Ngay sau khi lệnh `submit()` hoàn thành trong transaction và bài thi có câu hỏi chủ quan (`hasSubjective = true`), backend kích hoạt chấm bất đồng bộ ngay lập tức:
  ```typescript
  if (nextStatus === SubmissionStatus.PENDING_EVALUATION) {
    // Kích hoạt chấm AI ngầm không chặn luồng trả lời HTTP của học viên
    setImmediate(async () => {
      try {
        await aiGradingService.evaluateSubmission(submissionId);
        console.log(`[Auto AI Grading] Đã chấm xong tự động bài thi ${submissionId}`);
      } catch (err: any) {
        console.error(`[Auto AI Grading Error] Lỗi chấm ngầm bài ${submissionId}:`, err?.message);
      }
    });
  }
  ```
* **Tại Frontend [thi-thu/[id]/page.tsx](file:///d:/sontayweb/aptis-elearning/frontend/src/app/thi-thu/%5Bid%5D/page.tsx):**
  Khi nộp bài, thay vì báo *"Chờ giáo viên 24-48h"*, giao diện hiển thị màn hình chờ hiện đại:
  *"AI đang phân tích giọng nói và bài viết của bạn... (khoảng 5 - 10 giây)"*.
  Frontend thực hiện poll `api.getSubmissionDetail(submissionId)` mỗi 3 giây (tối đa 5 lần). Khi `status === 'GRADED'`, màn hình tự động hiển thị trọn vẹn kết quả bảng điểm.

### 3.5. Nâng cấp Giao diện Phòng thi Full Test
1. **Thanh Tab 5 Kỹ Năng trên Header phòng thi:**
   ```
   [1. Speaking (0/12)]  [2. Listening (0/25)]  [3. Grammar & Vocab (0/50)]  [4. Reading (0/21)]  [5. Writing (0/10)]
   ```
   * Học viên nhấp vào Tab nào sẽ nhảy trực tiếp tới Part đầu tiên của Kỹ năng đó.
   * Hiển thị tiến độ câu đã làm/chưa làm của từng kỹ năng.
2. **Màn hình Kết quả (Aptis 5-Skill Profile Report):**
   * Hiển thị Bảng điểm ngũ giác hoặc 5 Card độc lập:
     * 🎧 **Listening:** 42 / 50 (B2)
     * 📖 **Reading:** 44 / 50 (B2)
     * ✍️ **Writing:** 38 / 50 (B2)
     * 🗣 **Speaking:** 40 / 50 (B2)
     * 📝 **Grammar & Vocab:** 45 / 50
   * **Overall Score:** **164 / 200** — **CEFR: B2+ (Chuẩn C Target)**.

---

## 4. LỘ TRÌNH TRIỂN KHAI VÀ CHECKLIST NGHIỆM THU

| Hạng mục | Các file can thiệp | Kiểm thử nghiệm thu (Acceptance Criteria) |
| :--- | :--- | :--- |
| **1. Migration Database Code VIP** | `backend/prisma/schema.prisma` | Chạy `npx prisma db push` sinh bảng `PromotionCode` và `PromotionRedemption`. |
| **2. Seed mã CODE Go-Live** | `backend/prisma/seed.ts` | Tạo mã `APTISGOLIVE` (14 ngày, 20 lượt AI). |
| **3. API Redeem Code Backend** | `payment.service.ts`<br>`payment.controller.ts`<br>`payment.routes.ts` | Học viên A nhập mã ➡️ Nhận 14 ngày VIP. Nhập lại lần 2 ➡️ Báo lỗi 400 rõ ràng. |
| **4. UI Nhập Code Frontend** | `frontend/src/app/pricing/page.tsx`<br>`navbar.tsx` | Nhập mã trên web ➡️ Nhận thông báo chúc mừng, tài khoản biến thành VIP ngay lập tức. |
| **5. Vá hàm tính điểm Full Test** | `backend/src/modules/ai-grading/ai-grading.service.ts`<br>`submission.service.ts` | Nộp Full Test ➡️ Tổng điểm đúng bằng $R+L+W+S$ (Thang 200), không bị đè mất Reading/Listening. |
| **6. Auto-Trigger Chấm AI** | `submission.service.ts`<br>`frontend/src/app/thi-thu/[id]/page.tsx` | Nộp bài ➡️ AI chấm tự động sau 5-10s, không bị treo 24-48h. |
| **7. UI Tab 5 Kỹ năng Phòng thi** | `frontend/src/app/thi-thu/[id]/page.tsx` | Thanh tab nhảy linh hoạt giữa 5 kỹ năng trong 162 phút. |
