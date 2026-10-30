import fs from 'fs';
import path from 'path';
import { Request } from 'express';
import { AuditAction, QuestionType } from '@prisma/client';
import { prisma } from '../../config/database';
import { ExamFilterInput, CustomExamBuilderInput } from './exam.dto';
import { assertProAccess, checkProAccess } from '../../utils/pro-guard';
import { gradeObjectiveQuestion } from '../../utils/scoring-engine';
import { scoreToCefr } from '../../utils/cefr-engine';
import { auditService } from '../audit/audit.service';
import { ensureTwentyFullTestExams } from './fulltest-generator';

export class ExamService {
  private fullTestsEnsured = false;
  private ensuringPromise: Promise<void> | null = null;

  private async ensureMockTestsReady() {
    if (this.fullTestsEnsured) return;
    if (!this.ensuringPromise) {
      this.ensuringPromise = ensureTwentyFullTestExams(prisma)
        .then(() => {
          this.fullTestsEnsured = true;
        })
        .catch((err) => {
          console.warn('⚠️ Không thể tự động đồng bộ 20 bộ đề Full Test:', err?.message || err);
        })
        .finally(() => {
          this.ensuringPromise = null;
        });
    }
    await this.ensuringPromise;
  }

  private extractExamCode(exam: { id: string; title: string }): string {
    const bracketMatch = (exam.title || '').match(/\[(APT-\d{2,3})\]/i);
    if (bracketMatch) {
      return bracketMatch[1].toUpperCase();
    }
    return `APT-${exam.id.slice(0, 6).toUpperCase()}`;
  }

  async listExams(filter: ExamFilterInput, userId?: string) {
    const { skill, isPro, isHot, hotLevel, source, search, page, limit } = filter;
    if ((!skill || skill === 'FULL_TEST') && source !== 'KEY' && source !== 'CUSTOM') {
      await this.ensureMockTestsReady();
    }
    const hasProAccess = await checkProAccess(userId);
    const skip = (page - 1) * limit;

    const where: any = {
      is_published: true,
    };

    if (source === 'KEY') {
      where.OR = [
        { hot_level: { gt: 0 } },
        { forecast_tag: { not: null } },
        { source: 'KEY' },
      ];
    } else if (source) {
      where.source = source;
    }

    if (search && search.trim()) {
      where.title = { contains: search.trim(), mode: 'insensitive' };
    }

    if (skill) {
      where.skill = skill;
    }

    if (isPro !== undefined) {
      where.is_pro = isPro;
    }

    if (hotLevel !== undefined) {
      where.hot_level = hotLevel;
    } else if (isHot) {
      where.hot_level = { gt: 0 };
    }

    if (source === 'CUSTOM') {
      if (!userId) {
        return { exams: [], total: 0, page, totalPages: 0 };
      }
      where.creator_id = userId;
    }

    const orderBy: any =
      skill === 'FULL_TEST' && !isHot && hotLevel === undefined
        ? [{ title: 'asc' }]
        : [
            { hot_level: 'desc' },
            ...(skill ? [{ title: 'asc' }] : [{ created_at: 'desc' }]),
          ];

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
          answers: {
            select: {
              question: {
                select: {
                  part_id: true,
                },
              },
            },
          },
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
        let bestCefr: string | null = null;
        const totalPartsCount = exam.parts.length || 1;
        let completedParts = 0;
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
            completedParts = totalPartsCount;

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
                bestCefr = s.cefr_level || null;
              } else if (!bestCefr && s.cefr_level) {
                bestCefr = s.cefr_level;
              }
            }

            if (maxScore >= 0) {
              bestScoreNumber = Math.round(maxScore * 10) / 10;
              const maxScale = exam.skill === 'FULL_TEST' ? 200 : 50;
              bestScore = `${bestScoreNumber}/${maxScale}`;

              if (!bestCefr) {
                const norm = exam.skill === 'FULL_TEST' ? maxScore / 4 : maxScore;
                if (norm >= 45) bestCefr = 'C';
                else if (norm >= 38) bestCefr = 'B2';
                else if (norm >= 30) bestCefr = 'B1';
                else if (norm >= 20) bestCefr = 'A2';
                else if (norm > 0) bestCefr = 'A1';
                else bestCefr = 'A0';
              }
            } else if (!bestCefr) {
              bestCefr = 'A0';
            }
          } else if (userSubs.some((s) => s.status === 'IN_PROGRESS')) {
            userStatus = 'IN_PROGRESS';
            const inProgressSub = userSubs.find((s) => s.status === 'IN_PROGRESS');
            if (inProgressSub && inProgressSub.answers && inProgressSub.answers.length > 0) {
              const uniquePartIds = new Set(
                inProgressSub.answers
                  .map((a: any) => a.question?.part_id)
                  .filter(Boolean)
              );
              completedParts = Math.min(totalPartsCount, Math.max(1, uniquePartIds.size));
            } else {
              completedParts = 1;
            }
          }
        }

        return {
          id: exam.id,
          code: this.extractExamCode(exam),
          title: exam.title.replace(/^\[APT-\d{2,3}\]\s*/i, ''),
          rawTitle: exam.title,
          description: exam.description,
          skill: exam.skill,
          durationMinutes: exam.duration_minutes,
          isPro: exam.is_pro,
          hasProAccess,
          isLocked: Boolean(exam.is_pro && !hasProAccess),
          hotLevel: exam.hot_level ?? 0,
          forecastTag: exam.forecast_tag ?? null,
          source: exam.source,
          totalParts: totalPartsCount,
          totalQuestions: exam.parts.reduce((sum, p) => sum + p._count.questions, 0),
          partTitle: exam.parts[0]?.title || null,
          parts: exam.parts.map((p) => ({
            id: p.id,
            partNumber: p.part_number,
            title: p.title,
          })),
          attemptCount: exam._count.submissions,
          userStatus,
          completedParts,
          bestCefr,
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

  async getMarathonBank(skill?: string) {
    const where: any = {
      is_published: true,
    };
    if (skill && skill.trim()) {
      where.skill = skill.trim().toUpperCase();
    }

    const exams = await prisma.exam.findMany({
      where,
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

    // Flatten into part-level marathon items (prioritizing single-part practice exams so there is no duplication with Full Tests, except for GRAMMAR_VOCABULARY)
    const hasSinglePartExams = sortedExams.some((e) => e.parts.length === 1);
    const targetExams =
      hasSinglePartExams && skill?.toUpperCase() !== 'GRAMMAR_VOCABULARY'
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

    return items;
  }

  private async resolveExam(idOrCode: string) {
    await this.ensureMockTestsReady();
    const trimmed = idOrCode.trim();
    const includeSpec = {
      parts: {
        orderBy: { part_number: 'asc' as const },
        include: {
          _count: { select: { questions: true } },
        },
      },
      _count: { select: { submissions: true } },
    };

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed);
    if (isUuid) {
      const byId = await prisma.exam.findUnique({
        where: { id: trimmed },
        include: includeSpec,
      });
      if (byId) return byId;
    }

    // Ưu tiên tìm theo Mã bộ đề chuẩn APT-01 .. APT-20 (hoặc DE-01 .. DE-20)
    const aptMockMatch = trimmed.match(/^(?:apt|de|đề|test)[-_\s#]*(\d{1,2})$/i);
    if (aptMockMatch) {
      const padded = aptMockMatch[1].padStart(2, '0');
      const byAptTag = await prisma.exam.findFirst({
        where: {
          skill: 'FULL_TEST',
          title: { startsWith: `[APT-${padded}]`, mode: 'insensitive' },
        },
        include: includeSpec,
      });
      if (byAptTag) return byAptTag;
    }

    // Tìm theo Mã phòng ngắn dạng APT-XXXXXX hoặc 6-12 ký tự hex đầu của UUID
    const shortHexMatch = trimmed.match(/^(?:apt[-_\s]?)?([0-9a-f]{6,12})$/i);
    if (shortHexMatch) {
      const hexPrefix = shortHexMatch[1].toLowerCase();
      const byPrefix = await prisma.exam.findFirst({
        where: {
          id: { startsWith: hexPrefix, mode: 'insensitive' },
        },
        include: includeSpec,
      });
      if (byPrefix) return byPrefix;
    }

    let exam = await prisma.exam.findFirst({
      where: {
        OR: [
          { id: trimmed },
          { title: { contains: trimmed, mode: 'insensitive' } },
          { description: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      include: includeSpec,
    });

    if (!exam) {
      // Chỉ tìm theo số hiệu đề khi mã nhập dạng DE-1, Đề 01, APT-1, Test 2...
      const numCodeMatch = trimmed.match(/^(?:de|đề|test|apt|aptis)?[-_\s#]*(\d{1,3})$/i);
      if (numCodeMatch) {
        const padded = numCodeMatch[1].padStart(2, '0');
        exam = await prisma.exam.findFirst({
          where: {
            title: { contains: padded, mode: 'insensitive' },
          },
          include: includeSpec,
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

    const hasProAccess = await checkProAccess(userId);

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
      code: this.extractExamCode(exam),
      title: exam.title.replace(/^\[APT-\d{2,3}\]\s*/i, ''),
      rawTitle: exam.title,
      description: exam.description,
      skill: exam.skill,
      durationMinutes: exam.duration_minutes,
      isPro: exam.is_pro,
      hasProAccess,
      isLocked: Boolean(exam.is_pro && !hasProAccess),
      hotLevel: exam.hot_level ?? 0,
      forecastTag: exam.forecast_tag ?? null,
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
      userStatus,
      bestScore,
      bestScoreNumber,
      userAttempts,
      lastAttemptedAt,
      createdAt: exam.created_at,
    };
  }

  async getExamQuestions(examId: string, userId?: string) {
    await this.ensureMockTestsReady();
    const trimmed = examId.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed);
    const includeQuestionsSpec = {
      parts: {
        orderBy: { part_number: 'asc' as const },
        include: {
          questions: {
            orderBy: { question_number: 'asc' as const },
            select: {
              id: true,
              part_id: true,
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
    };

    let exam = isUuid
      ? await prisma.exam.findUnique({
          where: { id: trimmed },
          include: includeQuestionsSpec,
        })
      : null;

    if (!exam) {
      const aptMockMatch = trimmed.match(/^(?:apt|de|đề|test)[-_\s#]*(\d{1,2})$/i);
      if (aptMockMatch) {
        const padded = aptMockMatch[1].padStart(2, '0');
        exam = await prisma.exam.findFirst({
          where: {
            skill: 'FULL_TEST',
            title: { startsWith: `[APT-${padded}]`, mode: 'insensitive' },
          },
          include: includeQuestionsSpec,
        });
      }
    }

    if (!exam) {
      const shortHexMatch = trimmed.match(/^(?:apt[-_\s]?)?([0-9a-f]{6,12})$/i);
      if (shortHexMatch) {
        const hexPrefix = shortHexMatch[1].toLowerCase();
        exam = await prisma.exam.findFirst({
          where: {
            id: { startsWith: hexPrefix, mode: 'insensitive' },
          },
          include: includeQuestionsSpec,
        });
      }
    }

    if (!exam) {
      exam = await prisma.exam.findFirst({
        where: {
          OR: [
            { id: trimmed },
            { title: { contains: trimmed, mode: 'insensitive' } },
            { description: { contains: trimmed, mode: 'insensitive' } },
          ],
        },
        include: includeQuestionsSpec,
      });
    }

    if (!exam) {
      const numCodeMatch = trimmed.match(/^(?:de|đề|test|apt|aptis)?[-_\s#]*(\d{1,3})$/i);
      if (numCodeMatch) {
        const padded = numCodeMatch[1].padStart(2, '0');
        exam = await prisma.exam.findFirst({
          where: {
            title: { contains: padded, mode: 'insensitive' },
          },
          include: includeQuestionsSpec,
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

    // Xử lý bảo mật & trích xuất transcript thoại cho LISTENING trước khi xóa explanation
    function extractListeningTranscript(rawExp?: string | null): string {
      if (!rawExp) return '';
      if (rawExp.includes('--- GIẢI THÍCH ĐÁP ÁN ---')) {
        return rawExp.split('--- GIẢI THÍCH ĐÁP ÁN ---')[0].trim();
      }
      if (rawExp.includes('--- GỢI Ý / BẢN DỊCH ---')) {
        return rawExp.split('--- GỢI Ý / BẢN DỊCH ---')[0].trim();
      }
      if (rawExp.length > 20 && !rawExp.toLowerCase().startsWith('đáp án')) {
        return rawExp.trim();
      }
      return '';
    }

    for (const part of exam.parts) {
      const isListeningPart =
        exam.skill === 'LISTENING' ||
        part.title.toLowerCase().includes('listening');

      if (isListeningPart) {
        const audioDir = path.resolve(process.env.UPLOAD_DIR || './uploads', 'audio', 'listening');
        const existingFiles = fs.existsSync(audioDir) ? fs.readdirSync(audioDir) : [];

        // Kiểm tra xem part.audio_url có file thực tế trên ổ đĩa không, nếu là link ảo v3_ cũ không tồn tại thì xóa
        if (part.audio_url && !part.audio_url.startsWith('http')) {
          const rawFilename = path.basename(part.audio_url);
          if (!existingFiles.includes(rawFilename)) {
            part.audio_url = null;
          }
        }

        // Trích xuất số hiệu đề từ part.title (nếu là Full Test ghép từ Đề XX) hoặc exam.title
        const partNumMatch = part.title.match(/Đề\s*(\d+)/i);
        const numMatch =
          partNumMatch ||
          exam.title.match(/Đề\s*(\d+)/i) ||
          exam.title.match(/Test\s*#?(\d+)/i) ||
          exam.title.match(/\b(\d+)\b/);
        const examNumStr = numMatch ? String(numMatch[1]).padStart(2, '0') : null;
        const examPrefix = examNumStr ? `de${examNumStr}` : null;

        if (part.part_number === 1 || part.title.toLowerCase().includes('part 1')) {
          for (let i = 0; i < part.questions.length; i++) {
            const q = part.questions[i];
            const transcript = extractListeningTranscript(q.explanation);
            if (transcript) {
              (q as any).transcript = transcript;
            }
            const qNumStr = String(i + 1).padStart(2, '0');
            const matchingAudio = existingFiles.find(
              (f) =>
                ((examPrefix && f.startsWith(`${examPrefix}_p1_q${qNumStr}_`)) ||
                 f.startsWith(`${exam.id}_p1_q${qNumStr}_`)) &&
                f.endsWith('.mp3')
            );
            if (matchingAudio) {
              (q as any).audio_url = `/uploads/audio/listening/${matchingAudio}`;
            }
          }
        } else if (part.part_number === 2 || part.title.toLowerCase().includes('part 2')) {
          const qWithExp = part.questions.find((q) => q.explanation && q.explanation.length > 30);
          const transcript = extractListeningTranscript(qWithExp?.explanation || part.passage_text);
          if (transcript) {
            (part as any).passage_text = transcript;
            (part as any).transcript = transcript;
            for (const q of part.questions) {
              (q as any).transcript = transcript;
            }
          }
          const p2Audio = existingFiles.find(
            (f) =>
              ((examPrefix && f.startsWith(`${examPrefix}_p2_speakers_`)) ||
               f.startsWith(`${exam.id}_p2_speakers_`)) &&
              f.endsWith('.mp3')
          );
          if (p2Audio) {
            part.audio_url = `/uploads/audio/listening/${p2Audio}`;
          }
        } else if (part.part_number === 3 || part.title.toLowerCase().includes('part 3')) {
          const qWithExp = part.questions.find((q) => q.explanation && q.explanation.length > 30);
          const transcript = extractListeningTranscript(qWithExp?.explanation || part.passage_text);
          if (transcript) {
            (part as any).passage_text = transcript;
            (part as any).transcript = transcript;
            for (const q of part.questions) {
              (q as any).transcript = transcript;
            }
          }
          const p3Audio = existingFiles.find(
            (f) =>
              ((examPrefix && f.startsWith(`${examPrefix}_p3_discussion_`)) ||
               f.startsWith(`${exam.id}_p3_discussion_`)) &&
              f.endsWith('.mp3')
          );
          if (p3Audio) {
            part.audio_url = `/uploads/audio/listening/${p3Audio}`;
          }
        } else if (part.part_number === 4 || part.title.toLowerCase().includes('part 4')) {
          const q1Exp = part.questions.slice(0, 2).find((q) => q.explanation && q.explanation.length > 30);
          const q2Exp = part.questions.slice(2, 4).find((q) => q.explanation && q.explanation.length > 30);
          const t1 = extractListeningTranscript(q1Exp?.explanation);
          const t2 = extractListeningTranscript(q2Exp?.explanation);
          if (t1) {
            part.questions.slice(0, 2).forEach((q) => ((q as any).transcript = t1));
          }
          if (t2) {
            part.questions.slice(2, 4).forEach((q) => ((q as any).transcript = t2));
          }
          if (t1 || t2) {
            (part as any).passage_text = t1 || t2;
            (part as any).transcript = t1 || t2;
          }
          const p4Rec1Audio = existingFiles.find(
            (f) =>
              ((examPrefix && f.startsWith(`${examPrefix}_p4_rec1_`)) ||
               f.startsWith(`${exam.id}_p4_rec1_`)) &&
              f.endsWith('.mp3')
          );
          const p4Rec2Audio = existingFiles.find(
            (f) =>
              ((examPrefix && f.startsWith(`${examPrefix}_p4_rec2_`)) ||
               f.startsWith(`${exam.id}_p4_rec2_`)) &&
              f.endsWith('.mp3')
          );
          if (p4Rec1Audio) {
            part.questions.slice(0, 2).forEach((q) => ((q as any).audio_url = `/uploads/audio/listening/${p4Rec1Audio}`));
          }
          if (p4Rec2Audio) {
            part.questions.slice(2, 4).forEach((q) => ((q as any).audio_url = `/uploads/audio/listening/${p4Rec2Audio}`));
          }
        }
      }

      // Cấu hình chuẩn hóa khảo thí theo từng Part thực tế (Áp dụng cho cả Đề Đơn Lẻ và FULL_TEST)
      const partTitleLower = (part.title || '').toLowerCase();
      const examTitleLower = (exam.title || '').toLowerCase();
      const isSpeakingPart = exam.skill === 'SPEAKING' || partTitleLower.includes('speaking') || partTitleLower.includes('nói');
      const isWritingPart = exam.skill === 'WRITING' || partTitleLower.includes('writing') || partTitleLower.includes('viết');
      const isReadingPart = exam.skill === 'READING' || partTitleLower.includes('reading') || partTitleLower.includes('đọc');
      const isGrammarVocabPart = exam.skill === 'GRAMMAR_VOCABULARY' || partTitleLower.includes('grammar') || partTitleLower.includes('vocab');

      let partType: 'PART_1' | 'PART_2' | 'PART_3' | 'PART_4' = 'PART_1';

      if (isReadingPart) {
        // Chuẩn hóa Reading theo Aptis ESOL British Council:
        // - Part 1: Sentence completion (Gap fill)
        // - Part 2: Text cohesion (Ordering sentences)
        // - Part 3: Text reading (Opinion matching 4 người A, B, C, D - trong DB nhiều bộ gán tên "Part 4 – Opinion matching")
        // - Part 4: Long text reading (Heading matching 7 đoạn - trong DB gán tên "Part 5 – Long reading")
        if (
          partTitleLower.includes('heading') ||
          partTitleLower.includes('long reading') ||
          partTitleLower.includes('long text') ||
          partTitleLower.includes('part 5') ||
          partTitleLower.includes('part5') ||
          part.part_number === 5 ||
          (partTitleLower.includes('part 4') && !partTitleLower.includes('opinion'))
        ) {
          partType = 'PART_4';
        } else if (
          partTitleLower.includes('opinion') ||
          partTitleLower.includes('person') ||
          partTitleLower.includes('part 3') ||
          partTitleLower.includes('part3') ||
          (part.part_number === 4 && partTitleLower.includes('opinion')) ||
          (part.part_number === 3 && exam.parts.length === 4)
        ) {
          partType = 'PART_3';
        } else if (
          partTitleLower.includes('cohesion') ||
          partTitleLower.includes('order') ||
          partTitleLower.includes('part 2') ||
          partTitleLower.includes('part2') ||
          part.part_number === 2
        ) {
          partType = 'PART_2';
        } else {
          partType = 'PART_1';
        }
      } else if (isSpeakingPart) {
        if (
          partTitleLower.includes('part 4') ||
          partTitleLower.includes('part4') ||
          partTitleLower.includes('abstract') ||
          partTitleLower.includes('long turn') ||
          part.part_number === 4
        ) {
          partType = 'PART_4';
        } else if (
          partTitleLower.includes('part 3') ||
          partTitleLower.includes('part3') ||
          partTitleLower.includes('compare') ||
          partTitleLower.includes('so sánh') ||
          (part.part_number === 3 && !partTitleLower.includes('part 2'))
        ) {
          partType = 'PART_3';
        } else if (
          partTitleLower.includes('part 2') ||
          partTitleLower.includes('part2') ||
          partTitleLower.includes('describe') ||
          partTitleLower.includes('mô tả') ||
          part.part_number === 2
        ) {
          partType = 'PART_2';
        } else {
          partType = 'PART_1';
        }
      } else {
        if (
          partTitleLower.includes('part 4') ||
          partTitleLower.includes('part4') ||
          partTitleLower.includes('heading') ||
          partTitleLower.includes('email') ||
          (part.part_number === 4 && exam.parts.length === 4) ||
          examTitleLower.includes('part 4') ||
          examTitleLower.includes('part4')
        ) {
          partType = 'PART_4';
        } else if (
          partTitleLower.includes('part 3') ||
          partTitleLower.includes('part3') ||
          (partTitleLower.includes('opinion') && !partTitleLower.includes('part 2')) ||
          partTitleLower.includes('three questions') ||
          partTitleLower.includes('chat') ||
          (part.part_number === 3 && exam.parts.length === 4) ||
          examTitleLower.includes('part 3') ||
          examTitleLower.includes('part3')
        ) {
          partType = 'PART_3';
        } else if (
          partTitleLower.includes('part 2') ||
          partTitleLower.includes('part2') ||
          partTitleLower.includes('cohesion') ||
          partTitleLower.includes('order') ||
          partTitleLower.includes('short text') ||
          partTitleLower.includes('social') ||
          (part.part_number === 2 && exam.parts.length === 4) ||
          examTitleLower.includes('part 2') ||
          examTitleLower.includes('part2')
        ) {
          partType = 'PART_2';
        } else {
          partType = 'PART_1';
        }
      }
      (part as any).partType = partType;

      if (isSpeakingPart) {
        if (partType === 'PART_4') {
          part.image_url = null;
          (part as any).imageUrl = null;
          (part as any).secondImageUrl = null;
          (part as any).images = [];
          (part as any).prepTime = 60;
          (part as any).speakTime = 120;
          (part as any).partSubtitle = 'Part 4 - Abstract Discussion';
        } else if (partType === 'PART_2') {
          const imgs = (part.image_url || '').split(',').map((s: string) => s.trim()).filter(Boolean);
          (part as any).imageUrl = imgs[0] || null;
          (part as any).secondImageUrl = null;
          (part as any).images = imgs;
          (part as any).prepTime = 12;
          (part as any).speakTime = 45;
          (part as any).partSubtitle = 'Part 2 - Describe & Opinion';
        } else if (partType === 'PART_3') {
          const imgs = (part.image_url || '').split(',').map((s: string) => s.trim()).filter(Boolean);
          (part as any).imageUrl = imgs[0] || null;
          (part as any).secondImageUrl = imgs[1] || null;
          (part as any).images = imgs;
          (part as any).prepTime = 12;
          (part as any).speakTime = 45;
          (part as any).partSubtitle = 'Part 3 - Compare & Explain';
        } else {
          part.image_url = null;
          (part as any).imageUrl = null;
          (part as any).secondImageUrl = null;
          (part as any).images = [];
          (part as any).prepTime = 5;
          (part as any).speakTime = 30;
          (part as any).partSubtitle = 'Part 1 - Personal Information';
        }
      } else if (isWritingPart) {
        if (partType === 'PART_1') {
          (part as any).minWords = 1;
          (part as any).maxWords = 5;
          (part as any).recommendedMinutes = 3;
          (part as any).partSubtitle = 'Part 1 - Short Answers';
        } else if (partType === 'PART_2') {
          (part as any).minWords = 20;
          (part as any).maxWords = 30;
          (part as any).recommendedMinutes = 7;
          (part as any).partSubtitle = 'Part 2 - Social Media Response';
        } else if (partType === 'PART_3') {
          (part as any).minWords = 30;
          (part as any).maxWords = 40;
          (part as any).recommendedMinutes = 10;
          (part as any).partSubtitle = 'Part 3 - Three Questions';
        } else if (partType === 'PART_4') {
          (part as any).minWords = 50;
          (part as any).maxWords = 150;
          (part as any).recommendedMinutes = 30;
          (part as any).partSubtitle = 'Part 4 - Formal & Informal Email';

          // Đảm bảo Part 4 luôn có đủ 2 email chuẩn khảo thí Aptis ESOL
          if (part.questions.length === 1) {
            const q1 = part.questions[0];
            const isManager = /manager|secretary|president|formal|ban quản lý/i.test(q1.prompt);
            if (isManager) {
              part.questions = [
                {
                  id: `${q1.id}_email1`,
                  question_number: 1,
                  question_type: 'ESSAY',
                  prompt:
                    'Write an email to a friend who is also a member of the club. Tell them about your feelings regarding this notice and discuss what you should do next. Write about 50 words.',
                  options: null,
                  correct_answer: '',
                  max_score: 5,
                  explanation:
                    'Hi there,\n\nDid you see the recent announcement from our club? I was quite disappointed to hear about this sudden decision. What do you think we should do about it? Let me know soon.\n\nBest,\nYour friend',
                } as any,
                {
                  ...q1,
                  question_number: 2,
                },
              ];
            } else {
              part.questions = [
                q1,
                {
                  id: `${q1.id}_email2`,
                  question_number: 2,
                  question_type: 'ESSAY',
                  prompt:
                    'Write an email to the Club Manager. Explain how you feel about the announcement, outline how this decision impacts club members, and suggest practical alternatives or solutions. Write 120-150 words.',
                  options: null,
                  correct_answer: '',
                  max_score: 10,
                  explanation:
                    'Dear Club Manager,\n\nI am writing to express my concern regarding the recent announcement communicated to our club members. While I appreciate the operational challenges that the management is currently addressing, I feel this sudden change will negatively impact many dedicated members.\n\nFirstly, many members have arranged their personal commitments around the existing schedule. Secondly, this change causes substantial inconvenience and dissatisfaction among regular participants. Therefore, I would respectfully propose that the club committee consider alternative measures, such as organizing a member survey or exploring flexible compromise solutions.\n\nThank you for taking the time to consider our perspective on this important matter. I look forward to hearing your response.\n\nYours sincerely,\nClub Member',
                } as any,
              ];
            }
          }
        }
      } else if (isReadingPart) {
        if (partType === 'PART_1') {
          (part as any).recommendedMinutes = 7;
          (part as any).partSubtitle = 'Part 1 - Sentence Completion (Gap Fill)';
        } else if (partType === 'PART_2') {
          (part as any).recommendedMinutes = 8;
          (part as any).partSubtitle = 'Part 2 - Text Cohesion (Ordering)';
        } else if (partType === 'PART_3') {
          (part as any).recommendedMinutes = 10;
          (part as any).partSubtitle = 'Part 3 - Text Reading (Opinion Matching)';
        } else if (partType === 'PART_4') {
          (part as any).recommendedMinutes = 10;
          (part as any).partSubtitle = 'Part 4 - Long Text (Heading Matching)';
        }
      } else if (isGrammarVocabPart) {
        (part as any).recommendedMinutes = 25;
        (part as any).partSubtitle = 'Grammar & Vocabulary Core';
      } else if (isListeningPart) {
        if (partType === 'PART_1') {
          (part as any).partSubtitle = 'Part 1 - Information Recognition';
          (part as any).topic = 'Everyday Information & Announcements';
        } else if (partType === 'PART_2') {
          (part as any).partSubtitle = 'Part 2 - Information Matching (4 Speakers)';
          (part as any).topic = 'Workplace & Daily Life Views';
        } else if (partType === 'PART_3') {
          (part as any).partSubtitle = 'Part 3 - Opinion Matching (Discussion)';
          (part as any).topic = 'Discussion & Perspectives';
        } else if (partType === 'PART_4') {
          (part as any).partSubtitle = 'Part 4 - Monologue Comprehension';
          (part as any).topic = 'Lectures & Public Announcements';
        }

      }

      // BẢO MẬT: Tuyệt đối không để lộ explanation và correct_answer cho các kỹ năng trắc nghiệm khi chưa nộp bài
      if (exam.skill !== 'SPEAKING' && exam.skill !== 'WRITING') {
        for (const q of part.questions) {
          delete (q as any).explanation;
          delete (q as any).correct_answer;
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

  /**
   * Chấm điểm phía Server cho khách vãng lai (Guest) hoặc phiên thi chưa lưu DB
   * trả về điểm số chuẩn + đáp án đúng & lời giải để hiển thị ở màn Review
   */
  async gradeGuestSubmission(
    examId: string,
    answers: Array<{
      questionId: string;
      selectedOption?: string | null;
      textAnswer?: string | null;
    }>
  ) {
    const resolved = await this.resolveExam(examId);
    if (!resolved) {
      throw { statusCode: 404, message: 'Đề thi không tồn tại' };
    }

    const exam = await prisma.exam.findUnique({
      where: { id: resolved.id },
      include: {
        parts: {
          orderBy: { part_number: 'asc' },
          include: {
            questions: {
              orderBy: { question_number: 'asc' },
            },
          },
        },
      },
    });

    if (!exam) {
      throw { statusCode: 404, message: 'Đề thi không tồn tại' };
    }

    const answersMap = new Map<string, { selectedOption?: string | null; textAnswer?: string | null }>();
    for (const ans of answers || []) {
      if (ans && ans.questionId) {
        answersMap.set(ans.questionId, ans);
      }
    }

    let totalScore = 0;
    let maxTotalScore = 0;
    let correctCount = 0;
    let totalQuestions = 0;
    let rScore = 0, maxRScore = 0;
    let lScore = 0, maxLScore = 0;
    let gScore = 0, maxGScore = 0;

    const partBreakdown: Array<{
      partNumber: number;
      title: string;
      correctCount: number;
      totalCount: number;
      score: number;
      maxScore: number;
    }> = [];

    const questionsKeyMap: Record<
      string,
      { correct_answer: string | null; explanation: string | null; max_score: number }
    > = {};

    for (const part of exam.parts) {
      const pTitleLower = (part.title || '').toLowerCase();
      let pCorrect = 0;
      let pScore = 0;
      const pMax = part.questions.reduce((sum, q) => sum + (q.max_score || 1), 0);

      for (const q of part.questions) {
        totalQuestions++;
        const qMax = q.max_score || 1;
        maxTotalScore += qMax;

        questionsKeyMap[q.id] = {
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          max_score: qMax,
        };

        const isSubjective =
          exam.skill === 'WRITING' ||
          exam.skill === 'SPEAKING' ||
          q.question_type === QuestionType.ESSAY ||
          q.question_type === QuestionType.SPEAKING_AUDIO ||
          q.question_type === QuestionType.SHORT_TEXT;

        if (isSubjective) continue;

        if (pTitleLower.includes('reading')) maxRScore += qMax;
        else if (pTitleLower.includes('listening')) maxLScore += qMax;
        else if (pTitleLower.includes('grammar') || pTitleLower.includes('vocab')) maxGScore += qMax;

        const userAns = answersMap.get(q.id);
        if (!userAns) continue;

        const userChoice = userAns.selectedOption || userAns.textAnswer || '';
        const { score } = gradeObjectiveQuestion(
          q.question_type,
          q.correct_answer,
          userChoice,
          qMax,
          q.options
        );

        if (score > 0) {
          totalScore += score;
          pScore += score;
          pCorrect++;
          correctCount++;

          if (pTitleLower.includes('reading')) rScore += score;
          else if (pTitleLower.includes('listening')) lScore += score;
          else if (pTitleLower.includes('grammar') || pTitleLower.includes('vocab')) gScore += score;
        }
      }

      partBreakdown.push({
        partNumber: part.part_number,
        title: part.title,
        correctCount: pCorrect,
        totalCount: part.questions.length,
        score: Math.round(pScore * 10) / 10,
        maxScore: pMax,
      });
    }

    const readingScore =
      exam.skill === 'READING'
        ? Math.round(totalScore * 10) / 10
        : maxRScore > 0
        ? Math.round((rScore / maxRScore) * 50)
        : undefined;
    const listeningScore =
      exam.skill === 'LISTENING'
        ? Math.round(totalScore * 10) / 10
        : maxLScore > 0
        ? Math.round((lScore / maxLScore) * 50)
        : undefined;
    const grammarScore =
      exam.skill === 'GRAMMAR_VOCABULARY'
        ? Math.round(totalScore * 10) / 10
        : maxGScore > 0
        ? Math.round((gScore / maxGScore) * 50)
        : undefined;

    const finalTotalScore =
      exam.skill === 'FULL_TEST'
        ? (readingScore || 0) + (listeningScore || 0)
        : Math.round(totalScore * 10) / 10;

    const cefrLevel = scoreToCefr(totalScore, maxTotalScore || 50);

    return {
      totalScore: finalTotalScore,
      maxScore: exam.skill === 'FULL_TEST' ? 200 : maxTotalScore || 50,
      cefrLevel,
      readingScore,
      listeningScore,
      grammarScore,
      correctCount,
      totalQuestions,
      partBreakdown,
      questionsKeyMap,
    };
  }

  /**
   * Lưu báo cáo lỗi câu hỏi từ học viên vào AuditLog để ban chuyên môn xử lý
   */
  async reportQuestionIssue(
    examId: string,
    payload: {
      questionId?: string;
      questionNumber?: number;
      reason: string;
      note?: string;
    },
    req?: Request
  ) {
    const resolved = await this.resolveExam(examId);
    const targetExamId = resolved?.id || examId;
    const examTitle = resolved?.title || examId;

    await auditService.record({
      req,
      action: AuditAction.EXAM_UPDATE,
      entityType: 'QUESTION_REPORT',
      entityId: payload.questionId || targetExamId,
      description: `Báo lỗi câu hỏi #${payload.questionNumber || '?'} thuộc đề "${examTitle}": ${payload.reason}`,
      newValue: {
        examId: targetExamId,
        examTitle,
        questionId: payload.questionId || null,
        questionNumber: payload.questionNumber || null,
        reason: payload.reason,
        note: payload.note || '',
        reportedAt: new Date().toISOString(),
      },
    });

    return { reported: true };
  }
}

export const examService = new ExamService();
