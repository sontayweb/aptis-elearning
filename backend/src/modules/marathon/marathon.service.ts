import { prisma } from '../../config/database';
import { ExamSkill } from '@prisma/client';

export interface CatalogItemMetadata {
  index: number;
  examId: string;
  partId: string;
  title: string;
  skill: string;
  isPro: boolean;
  hotLevel: number;
  forecastTag?: string | null;
  partNumber: number;
  partTitle: string;
  totalQuestions: number;
}

export class MarathonService {
  /**
   * Helper: Lấy danh sách toàn bộ các Part item theo Skill & Part chuẩn
   */
  private async getFlattenedPartItems(skill: ExamSkill, targetPartNumber: number) {
    const exams = await prisma.exam.findMany({
      where: {
        is_published: true,
        skill,
      },
      select: {
        id: true,
        title: true,
        description: true,
        skill: true,
        duration_minutes: true,
        is_pro: true,
        hot_level: true,
        forecast_tag: true,
        parts: {
          orderBy: { part_number: 'asc' },
          select: {
            id: true,
            part_number: true,
            title: true,
            instructions: true,
            passage_text: true,
            audio_url: true,
            image_url: true,
            questions: {
              orderBy: { question_number: 'asc' },
              select: {
                id: true,
                question_number: true,
                question_type: true,
                prompt: true,
                options: true,
                correct_answer: true,
                explanation: true,
                max_score: true,
              },
            },
          },
        },
      },
    });

    const extractNum = (str: string): number => {
      const m = str.match(/(?:Đề|Test|Exam|Câu|Bài|Tranh|Topic)\s*0*(\d+)/i) || str.match(/(\d+)/);
      return m ? parseInt(m[1], 10) : 999999;
    };

    const sortedExams = [...exams].sort((a, b) => {
      const numA = extractNum(a.title);
      const numB = extractNum(b.title);
      if (numA !== numB) return numA - numB;
      return a.title.localeCompare(b.title, 'vi');
    });

    // Ưu tiên đề đơn part nếu có
    const hasSinglePartExams = sortedExams.some((e) => e.parts.length === 1);
    const targetExams =
      hasSinglePartExams && skill !== 'GRAMMAR_VOCABULARY'
        ? sortedExams.filter((e) => e.parts.length === 1)
        : sortedExams;

    const items = targetExams.flatMap((exam) =>
      exam.parts.map((part) => {
        const m = (part.title || '').match(/Part\s*([1-4])/i);
        const logicalPart = m ? parseInt(m[1], 10) : part.part_number || 1;
        return {
          examId: exam.id,
          partId: part.id,
          title: exam.title,
          description: exam.description,
          skill: exam.skill,
          isPro: exam.is_pro,
          hotLevel: exam.hot_level ?? 0,
          forecastTag: exam.forecast_tag ?? null,
          logicalPart,
          partNumber: part.part_number,
          partTitle: part.title,
          instructions: part.instructions,
          passageText: part.passage_text,
          audioUrl: part.audio_url,
          imageUrl: part.image_url,
          questions: part.questions.map((q) => ({
            id: q.id,
            questionNumber: q.question_number,
            questionType: q.question_type,
            prompt: q.prompt,
            options: q.options,
            correctAnswer: q.correct_answer,
            explanation: q.explanation,
            maxScore: q.max_score,
          })),
        };
      })
    );

    // Lọc theo Part mong muốn (logicalPart = targetPartNumber)
    return items.filter((item) => item.logicalPart === targetPartNumber && item.questions.length > 0);
  }

  /**
   * Phase 1: Lấy danh mục Metadata siêu nhẹ (~15KB) để render Ma trận 85 đề tức thì
   */
  async getCatalog(skill: ExamSkill, partNumber: number) {
    const allItems = await this.getFlattenedPartItems(skill, partNumber);

    const catalog: CatalogItemMetadata[] = allItems.map((item, idx) => ({
      index: idx,
      examId: item.examId,
      partId: item.partId,
      title: item.title,
      skill: item.skill,
      isPro: item.isPro,
      hotLevel: item.hotLevel,
      forecastTag: item.forecastTag,
      partNumber: item.logicalPart,
      partTitle: item.partTitle,
      totalQuestions: item.questions.length,
    }));

    return {
      skill,
      partNumber,
      total: catalog.length,
      items: catalog,
    };
  }

  /**
   * Phase 2: Lấy chi tiết đề theo danh sách Index (Windowed batch pre-fetching)
   */
  async getBatch(skill: ExamSkill, partNumber: number, indices: number[]) {
    const allItems = await this.getFlattenedPartItems(skill, partNumber);
    const indexSet = new Set(indices);

    const filtered = allItems
      .map((item, idx) => ({ ...item, index: idx }))
      .filter((item) => indexSet.has(item.index));

    return {
      skill,
      partNumber,
      totalAvailable: allItems.length,
      items: filtered,
    };
  }

  /**
   * Lấy tiến trình dở dang của User đối với Part này
   */
  async getProgress(userId: string, skill: ExamSkill, partNumber: number) {
    const record = await prisma.marathonProgress.findUnique({
      where: {
        user_skill_part_unique: {
          user_id: userId,
          skill,
          part_number: partNumber,
        },
      },
    });

    if (!record) {
      return {
        hasProgress: false,
        progress: null,
      };
    }

    return {
      hasProgress: true,
      progress: {
        id: record.id,
        skill: record.skill,
        partNumber: record.part_number,
        currentExamIndex: record.current_exam_index,
        currentExamId: record.current_exam_id,
        totalExams: record.total_exams,
        completedExamsCount: record.completed_exams_count,
        totalCorrectItems: record.total_correct_items,
        totalAnsweredItems: record.total_answered_items,
        totalTimeSeconds: record.total_time_seconds,
        status: record.status,
        completedData: record.completed_data,
        currentDraftAnswers: record.current_draft_answers,
        currentDraftOrders: record.current_draft_orders,
        lastActiveAt: record.last_active_at,
      },
    };
  }

  /**
   * Tự động lưu bản nháp tiến trình (Autosave Heartbeat)
   */
  async autosaveProgress(
    userId: string,
    skill: ExamSkill,
    partNumber: number,
    payload: {
      currentExamIndex: number;
      currentExamId?: string;
      currentDraftAnswers?: Record<string, any>;
      currentDraftOrders?: Record<string, any>;
      additionalTimeSeconds?: number;
    }
  ) {
    const now = new Date();

    const existing = await prisma.marathonProgress.findUnique({
      where: {
        user_skill_part_unique: {
          user_id: userId,
          skill,
          part_number: partNumber,
        },
      },
    });

    if (existing) {
      return await prisma.marathonProgress.update({
        where: { id: existing.id },
        data: {
          current_exam_index: payload.currentExamIndex,
          current_exam_id: payload.currentExamId || existing.current_exam_id,
          current_draft_answers: payload.currentDraftAnswers ?? existing.current_draft_answers ?? {},
          current_draft_orders: payload.currentDraftOrders ?? existing.current_draft_orders ?? {},
          total_time_seconds: { increment: payload.additionalTimeSeconds || 0 },
          last_active_at: now,
        },
      });
    }

    return await prisma.marathonProgress.create({
      data: {
        user_id: userId,
        skill,
        part_number: partNumber,
        current_exam_index: payload.currentExamIndex,
        current_exam_id: payload.currentExamId || null,
        current_draft_answers: payload.currentDraftAnswers ?? {},
        current_draft_orders: payload.currentDraftOrders ?? {},
        total_time_seconds: payload.additionalTimeSeconds || 0,
        last_active_at: now,
      },
    });
  }

  /**
   * Hoàn thành 1 đề trong chuỗi: Chấm điểm, Best Score & Chuyển mốc
   */
  async completeExam(
    userId: string,
    skill: ExamSkill,
    partNumber: number,
    payload: {
      examId: string;
      examIndex: number;
      answers: Record<string, string>;
      orders?: Record<string, string[]>;
      timeSpentSeconds?: number;
    }
  ) {
    // 1. Lấy dữ liệu đề để chấm điểm chính xác từ DB
    const allItems = await this.getFlattenedPartItems(skill, partNumber);
    const currentItem = allItems[payload.examIndex];

    if (!currentItem) {
      throw { statusCode: 404, message: 'Đề thi không tồn tại trong danh mục Marathon' };
    }

    let correctCount = 0;
    let totalQuestions = currentItem.questions.length;
    let earnedScore = 0;
    let maxScore = 0;

    const questionResults: Record<string, { isCorrect: boolean; userAnswer: string; correctAnswer: string }> = {};

    if (partNumber === 2 && payload.orders) {
      // Logic chấm Part 2 Text Cohesion (Sắp xếp câu)
      currentItem.questions.forEach((q) => {
        maxScore += q.maxScore || 5;
        let expectedOrder: string[] = [];
        try {
          expectedOrder =
            typeof q.correctAnswer === 'string'
              ? JSON.parse(q.correctAnswer)
              : q.correctAnswer || [];
        } catch {
          expectedOrder = [];
        }

        // Hỗ trợ cả key theo q.id hoặc theo partId
        const userOrder = payload.orders?.[q.id] || payload.orders?.[currentItem.partId] || [];
        let isCorrect = false;

        if (expectedOrder.length > 0 && userOrder.length === expectedOrder.length) {
          isCorrect = userOrder.every((val, idx) => {
            const exp = expectedOrder[idx];
            if (val === exp) return true;
            // Nếu userOrder lưu cả câu văn (text) thay vì ID
            if (q.options && typeof q.options === 'object' && Array.isArray((q.options as any).sentences)) {
              const matchedSent = (q.options as any).sentences.find((s: any) => s.id === exp);
              if (matchedSent && (matchedSent.text === val || matchedSent.text?.trim() === val?.trim())) {
                return true;
              }
            }
            return false;
          });
        }

        if (isCorrect) {
          correctCount++;
          earnedScore += q.maxScore || 5;
        }

        questionResults[q.id] = {
          isCorrect,
          userAnswer: JSON.stringify(userOrder),
          correctAnswer: JSON.stringify(expectedOrder),
        };
      });
    } else {
      // Chấm trắc nghiệm/Gap Fill thông thường
      currentItem.questions.forEach((q) => {
        maxScore += q.maxScore || 1;
        const userAns = (payload.answers[q.id] || '').trim().toLowerCase();
        const correctAns = (q.correctAnswer || '').trim().toLowerCase();
        const isCorrect = Boolean(userAns && userAns === correctAns);

        if (isCorrect) {
          correctCount++;
          earnedScore += q.maxScore || 1;
        }

        questionResults[q.id] = {
          isCorrect,
          userAnswer: payload.answers[q.id] || '',
          correctAnswer: q.correctAnswer || '',
        };
      });
    }

    const now = new Date();

    // 2. Cập nhật MarathonProgress của User
    let progress = await prisma.marathonProgress.findUnique({
      where: {
        user_skill_part_unique: {
          user_id: userId,
          skill,
          part_number: partNumber,
        },
      },
    });

    const completedData = (progress?.completed_data as Record<string, any>) || {};
    const previousResult = completedData[payload.examId];
    const isFirstTime = !previousResult;

    const bestScore = previousResult
      ? Math.max(previousResult.bestScore || 0, earnedScore)
      : earnedScore;

    completedData[payload.examId] = {
      examId: payload.examId,
      examIndex: payload.examIndex,
      bestScore,
      lastScore: earnedScore,
      maxScore,
      correctCount,
      totalQuestions,
      completedAt: now.toISOString(),
      timeSpentSeconds: payload.timeSpentSeconds || 0,
      answers: payload.answers,
    };

    const nextIndex = Math.min(allItems.length - 1, payload.examIndex + 1);

    if (progress) {
      progress = await prisma.marathonProgress.update({
        where: { id: progress.id },
        data: {
          current_exam_index: nextIndex,
          current_exam_id: allItems[nextIndex]?.examId || null,
          total_exams: allItems.length,
          completed_exams_count: Object.keys(completedData).length,
          total_correct_items: { increment: isFirstTime ? correctCount : 0 },
          total_answered_items: { increment: isFirstTime ? totalQuestions : 0 },
          total_time_seconds: { increment: payload.timeSpentSeconds || 0 },
          completed_data: completedData,
          current_draft_answers: {}, // Clear draft sau khi submit
          current_draft_orders: {},
          last_active_at: now,
          status: Object.keys(completedData).length >= allItems.length ? 'COMPLETED' : 'IN_PROGRESS',
        },
      });
    } else {
      progress = await prisma.marathonProgress.create({
        data: {
          user_id: userId,
          skill,
          part_number: partNumber,
          current_exam_index: nextIndex,
          current_exam_id: allItems[nextIndex]?.examId || null,
          total_exams: allItems.length,
          completed_exams_count: 1,
          total_correct_items: correctCount,
          total_answered_items: totalQuestions,
          total_time_seconds: payload.timeSpentSeconds || 0,
          completed_data: completedData,
          current_draft_answers: {},
          current_draft_orders: {},
          last_active_at: now,
        },
      });
    }

    return {
      examIndex: payload.examIndex,
      nextIndex,
      earnedScore,
      maxScore,
      bestScore,
      correctCount,
      totalQuestions,
      accuracyRate: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
      questionResults,
      completedExamsCount: Object.keys(completedData).length,
      totalExams: allItems.length,
      isPartCompleted: Object.keys(completedData).length >= allItems.length,
    };
  }

  /**
   * Reset tiến trình
   */
  async resetProgress(
    userId: string,
    skill: ExamSkill,
    partNumber: number,
    scope: 'EXAM' | 'ALL',
    examId?: string
  ) {
    const existing = await prisma.marathonProgress.findUnique({
      where: {
        user_skill_part_unique: {
          user_id: userId,
          skill,
          part_number: partNumber,
        },
      },
    });

    if (!existing) {
      return { success: true };
    }

    if (scope === 'ALL') {
      await prisma.marathonProgress.update({
        where: { id: existing.id },
        data: {
          current_exam_index: 0,
          completed_exams_count: 0,
          total_correct_items: 0,
          total_answered_items: 0,
          total_time_seconds: 0,
          status: 'IN_PROGRESS',
          completed_data: {},
          current_draft_answers: {},
          current_draft_orders: {},
          last_active_at: new Date(),
        },
      });
    } else if (scope === 'EXAM' && examId) {
      const completedData = (existing.completed_data as Record<string, any>) || {};
      delete completedData[examId];
      await prisma.marathonProgress.update({
        where: { id: existing.id },
        data: {
          completed_data: completedData,
          completed_exams_count: Object.keys(completedData).length,
          current_draft_answers: {},
          last_active_at: new Date(),
        },
      });
    }

    return { success: true };
  }
}

export const marathonService = new MarathonService();

