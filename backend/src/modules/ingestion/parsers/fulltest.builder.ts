import { ExamSkill } from '@prisma/client';
import { IngestedExam, IngestedPart } from '../ingestion.types';

export class FullTestBuilder {
  /**
   * Ghép các phân hệ (Nghe, Nói, Đọc, Viết) thành 1 Đề thi thử Full Test 162 phút hoàn chỉnh
   */
  public assembleFullTest(
    title: string,
    components: {
      listeningExam?: IngestedExam;
      readingExam?: IngestedExam;
      writingExam?: IngestedExam;
      speakingExam?: IngestedExam;
    }
  ): IngestedExam {
    const combinedParts: IngestedPart[] = [];
    let currentPartNumber = 1;

    // 1. Phân hệ Grammar & Vocabulary (nếu có hoặc tạo mặc định)
    // 2. Phân hệ Reading
    if (components.readingExam) {
      for (const p of components.readingExam.parts) {
        combinedParts.push({
          ...p,
          partNumber: currentPartNumber++,
          title: `[READING] ${p.title}`,
        });
      }
    }

    // 3. Phân hệ Listening
    if (components.listeningExam) {
      for (const p of components.listeningExam.parts) {
        combinedParts.push({
          ...p,
          partNumber: currentPartNumber++,
          title: `[LISTENING] ${p.title}`,
        });
      }
    }

    // 4. Phân hệ Writing
    if (components.writingExam) {
      for (const p of components.writingExam.parts) {
        combinedParts.push({
          ...p,
          partNumber: currentPartNumber++,
          title: `[WRITING] ${p.title}`,
        });
      }
    }

    // 5. Phân hệ Speaking
    if (components.speakingExam) {
      for (const p of components.speakingExam.parts) {
        combinedParts.push({
          ...p,
          partNumber: currentPartNumber++,
          title: `[SPEAKING] ${p.title}`,
        });
      }
    }

    return {
      title,
      description: 'Đề thi thử Aptis ESOL Full Test toàn diện chuẩn hội đồng thi British Council (162 phút).',
      skill: ExamSkill.FULL_TEST,
      durationMinutes: 162,
      isPro: false,
      hotLevel: 3,
      forecastTag: 'Đề Full Test tổng hợp 4 Kỹ Năng',
      source: 'WEB',
      parts: combinedParts,
    };
  }
}

export const fullTestBuilder = new FullTestBuilder();
