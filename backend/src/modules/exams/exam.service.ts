import { prisma } from '../../config/database';
import { ExamFilterInput, CustomExamBuilderInput } from './exam.dto';
import { assertProAccess } from '../../utils/pro-guard';

export class ExamService {
  async listExams(filter: ExamFilterInput, userId?: string) {
    const { skill, isPro, source, page, limit } = filter;
    const skip = (page - 1) * limit;

    const where: any = {
      is_published: true,
    };

    if (source) {
      where.source = source;
    }

    if (skill) {
      where.skill = skill;
    }

    if (isPro !== undefined) {
      where.is_pro = isPro;
    }

    if (source === 'CUSTOM') {
      if (!userId) {
        return { exams: [], total: 0, page, totalPages: 0 };
      }
      where.creator_id = userId;
    }

    const orderBy: any = skill ? { title: 'asc' } : { created_at: 'desc' };

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          parts: {
            select: {
              id: true,
              part_number: true,
              title: true,
              _count: { select: { questions: true } },
            },
          },
          _count: { select: { submissions: true } },
        },
      }),
      prisma.exam.count({ where }),
    ]);

    const examIds = exams.map((e) => e.id);
    const userSubmissionsMap: Record<string, any[]> = {};

    if (userId && examIds.length > 0) {
      const userSubs = await prisma.examSubmission.findMany({
        where: {
          user_id: userId,
          exam_id: { in: examIds },
        },
        select: {
          id: true,
          exam_id: true,
          status: true,
          total_score: true,
          grammar_score: true,
          listening_score: true,
          reading_score: true,
          writing_score: true,
          speaking_score: true,
          cefr_level: true,
          submitted_at: true,
          started_at: true,
        },
        orderBy: { started_at: 'desc' },
      });

      for (const sub of userSubs) {
        if (!userSubmissionsMap[sub.exam_id]) {
          userSubmissionsMap[sub.exam_id] = [];
        }
        userSubmissionsMap[sub.exam_id].push(sub);
      }
    }

    return {
      exams: exams.map((exam) => {
        const userSubs = userSubmissionsMap[exam.id] || [];
        let userStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
        let bestScore: string | null = null;
        let bestScoreNumber: number | null = null;
        const userAttempts = userSubs.length;
        let lastAttemptedAt: Date | null = null;

        if (userSubs.length > 0) {
          lastAttemptedAt = userSubs[0].submitted_at || userSubs[0].started_at;
          const completedSubs = userSubs.filter(
            (s) =>
              s.status === 'GRADED' ||
              s.status === 'SUBMITTED' ||
              s.status === 'PENDING_EVALUATION'
          );

          if (completedSubs.length > 0) {
            userStatus = 'COMPLETED';

            // Điểm cao nhất của thí sinh
            let maxScore = -1;
            for (const s of completedSubs) {
              let scoreVal = s.total_score;
              if (exam.skill === 'GRAMMAR_VOCABULARY' && s.grammar_score != null) {
                scoreVal = s.grammar_score;
              } else if (exam.skill === 'LISTENING' && s.listening_score != null) {
                scoreVal = s.listening_score;
              } else if (exam.skill === 'READING' && s.reading_score != null) {
                scoreVal = s.reading_score;
              } else if (exam.skill === 'WRITING' && s.writing_score != null) {
                scoreVal = s.writing_score;
              } else if (exam.skill === 'SPEAKING' && s.speaking_score != null) {
                scoreVal = s.speaking_score;
              }

              if (scoreVal != null && scoreVal > maxScore) {
                maxScore = scoreVal;
              }
            }

            if (maxScore >= 0) {
              bestScoreNumber = Math.round(maxScore * 10) / 10;
              const maxScale = exam.skill === 'FULL_TEST' ? 200 : 50;
              bestScore = `${bestScoreNumber}/${maxScale}`;
            }
          } else if (userSubs.some((s) => s.status === 'IN_PROGRESS')) {
            userStatus = 'IN_PROGRESS';
          }
        }

        return {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          skill: exam.skill,
          durationMinutes: exam.duration_minutes,
          isPro: exam.is_pro,
          source: exam.source,
          totalParts: exam.parts.length,
          totalQuestions: exam.parts.reduce((sum, p) => sum + p._count.questions, 0),
          partTitle: exam.parts[0]?.title || null,
          parts: exam.parts.map((p) => ({
            id: p.id,
            partNumber: p.part_number,
            title: p.title,
          })),
          attemptCount: exam._count.submissions,
          userStatus,
          bestScore,
          bestScoreNumber,
          userAttempts,
          lastAttemptedAt,
          createdAt: exam.created_at,
        };
      }),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async resolveExam(idOrCode: string) {
    const trimmed = idOrCode.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed);
    if (isUuid) {
      const byId = await prisma.exam.findUnique({
        where: { id: trimmed },
        include: {
          parts: {
            orderBy: { part_number: 'asc' },
            include: {
              _count: { select: { questions: true } },
            },
          },
          _count: { select: { submissions: true } },
        },
      });
      if (byId) return byId;
    }

    let exam = await prisma.exam.findFirst({
      where: {
        OR: [
          { id: trimmed },
          { title: { contains: trimmed, mode: 'insensitive' } },
          { description: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      include: {
        parts: {
          orderBy: { part_number: 'asc' },
          include: {
            _count: { select: { questions: true } },
          },
        },
        _count: { select: { submissions: true } },
      },
    });

    if (!exam) {
      const numMatch = trimmed.match(/\d+/);
      if (numMatch) {
        const padded = numMatch[0].padStart(2, '0');
        exam = await prisma.exam.findFirst({
          where: {
            title: { contains: padded, mode: 'insensitive' },
          },
          include: {
            parts: {
              orderBy: { part_number: 'asc' },
              include: {
                _count: { select: { questions: true } },
              },
            },
            _count: { select: { submissions: true } },
          },
        });
      }
    }

    return exam;
  }

  async getExamDetail(examId: string, userId?: string) {
    const exam = await this.resolveExam(examId);

    if (!exam) {
      throw { statusCode: 404, message: 'Đề thi không tồn tại' };
    }

    let userStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
    let bestScore: string | null = null;
    let bestScoreNumber: number | null = null;
    let userAttempts = 0;
    let lastAttemptedAt: Date | null = null;

    if (userId) {
      const userSubs = await prisma.examSubmission.findMany({
        where: { user_id: userId, exam_id: exam.id },
        orderBy: { started_at: 'desc' },
      });
      userAttempts = userSubs.length;

      if (userSubs.length > 0) {
        lastAttemptedAt = userSubs[0].submitted_at || userSubs[0].started_at;
        const completedSubs = userSubs.filter(
          (s) =>
            s.status === 'GRADED' ||
            s.status === 'SUBMITTED' ||
            s.status === 'PENDING_EVALUATION'
        );

        if (completedSubs.length > 0) {
          userStatus = 'COMPLETED';
          let maxScore = -1;
          for (const s of completedSubs) {
            let scoreVal = s.total_score;
            if (exam.skill === 'GRAMMAR_VOCABULARY' && s.grammar_score != null) {
              scoreVal = s.grammar_score;
            } else if (exam.skill === 'LISTENING' && s.listening_score != null) {
              scoreVal = s.listening_score;
            } else if (exam.skill === 'READING' && s.reading_score != null) {
              scoreVal = s.reading_score;
            } else if (exam.skill === 'WRITING' && s.writing_score != null) {
              scoreVal = s.writing_score;
            } else if (exam.skill === 'SPEAKING' && s.speaking_score != null) {
              scoreVal = s.speaking_score;
            }

            if (scoreVal != null && scoreVal > maxScore) {
              maxScore = scoreVal;
            }
          }

          if (maxScore >= 0) {
            bestScoreNumber = Math.round(maxScore * 10) / 10;
            const maxScale = exam.skill === 'FULL_TEST' ? 200 : 50;
            bestScore = `${bestScoreNumber}/${maxScale}`;
          }
        } else if (userSubs.some((s) => s.status === 'IN_PROGRESS')) {
          userStatus = 'IN_PROGRESS';
        }
      }
    }

    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      skill: exam.skill,
      durationMinutes: exam.duration_minutes,
      isPro: exam.is_pro,
      source: exam.source,
      parts: exam.parts.map((p) => ({
        id: p.id,
        partNumber: p.part_number,
        title: p.title,
        instructions: p.instructions,
        questionCount: p._count.questions,
      })),
      totalQuestions: exam.parts.reduce((sum, p) => sum + p._count.questions, 0),
      attemptCount: exam._count.submissions,
      createdAt: exam.created_at,
    };
  }

  async getExamQuestions(examId: string, userId?: string) {
    const trimmed = examId.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed);

    let exam = isUuid
      ? await prisma.exam.findUnique({
          where: { id: trimmed },
          include: {
            parts: {
              orderBy: { part_number: 'asc' },
              include: {
                questions: {
                  orderBy: { question_number: 'asc' },
                  select: {
                    id: true,
                    question_number: true,
                    question_type: true,
                    prompt: true,
                    options: true,
                    correct_answer: true,
                    max_score: true,
                    explanation: true,
                  },
                },
              },
            },
          },
        })
      : null;

    if (!exam) {
      exam = await prisma.exam.findFirst({
        where: {
          OR: [
            { id: trimmed },
            { title: { contains: trimmed, mode: 'insensitive' } },
            { description: { contains: trimmed, mode: 'insensitive' } },
          ],
        },
        include: {
          parts: {
            orderBy: { part_number: 'asc' },
            include: {
              questions: {
                orderBy: { question_number: 'asc' },
                select: {
                  id: true,
                  question_number: true,
                  question_type: true,
                  prompt: true,
                  options: true,
                  correct_answer: true,
                  max_score: true,
                  explanation: true,
                },
              },
            },
          },
        },
      });
    }

    if (!exam) {
      const numMatch = trimmed.match(/\d+/);
      if (numMatch) {
        const padded = numMatch[0].padStart(2, '0');
        exam = await prisma.exam.findFirst({
          where: {
            title: { contains: padded, mode: 'insensitive' },
          },
          include: {
            parts: {
              orderBy: { part_number: 'asc' },
              include: {
                questions: {
                  orderBy: { question_number: 'asc' },
                  select: {
                    id: true,
                    question_number: true,
                    question_type: true,
                    prompt: true,
                    options: true,
                    correct_answer: true,
                    max_score: true,
                    explanation: true,
                  },
                },
              },
            },
          },
        });
      }
    }

    if (!exam) {
      throw { statusCode: 404, message: 'Đề thi không tồn tại' };
    }

    // Kiểm tra quyền nếu là đề thi PRO
    if (exam.is_pro) {
      await assertProAccess(userId, 'Đề thi PRO');
    }

    // BẢO MẬT: Tuyệt đối không để lộ explanation cho các kỹ năng trắc nghiệm (LISTENING, READING, GRAMMAR, FULL_TEST) khi chưa nộp bài
    if (exam.skill !== 'SPEAKING' && exam.skill !== 'WRITING') {
      for (const part of exam.parts) {
        for (const q of part.questions) {
          delete (q as any).explanation;
        }
      }
    }

    return exam;
  }

  async createCustomExam(userId: string, input: CustomExamBuilderInput) {
    // Lấy các part được chọn
    const sourceParts = await prisma.examPart.findMany({
      where: { id: { in: input.partIds } },
      include: { questions: true },
    });

    if (sourceParts.length === 0) {
      throw { statusCode: 400, message: 'Không tìm thấy phần thi nào hợp lệ' };
    }

    // Tạo custom exam mới
    const customExam = await prisma.exam.create({
      data: {
        title: input.title,
        description: input.description || 'Bộ đề thi tùy biến cá nhân',
        skill: input.skill,
        duration_minutes: input.durationMinutes,
        is_pro: false,
        source: 'CUSTOM',
        creator_id: userId,
        parts: {
          create: sourceParts.map((sp, idx) => ({
            part_number: idx + 1,
            title: sp.title,
            instructions: sp.instructions,
            passage_text: sp.passage_text,
            audio_url: sp.audio_url,
            image_url: sp.image_url,
            questions: {
              create: sp.questions.map((q) => ({
                question_number: q.question_number,
                question_type: q.question_type,
                prompt: q.prompt,
                options: q.options || undefined,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                max_score: q.max_score,
              })),
            },
          })),
        },
      },
    });

    return customExam;
  }
}

export const examService = new ExamService();
