import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/database';
import { ExamFilterInput, CustomExamBuilderInput } from './exam.dto';
import { assertProAccess } from '../../utils/pro-guard';

export class ExamService {
  async listExams(filter: ExamFilterInput, userId?: string) {
    const { skill, isPro, isHot, hotLevel, source, page, limit } = filter;
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

    const orderBy: any = [
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
          title: exam.title,
          description: exam.description,
          skill: exam.skill,
          durationMinutes: exam.duration_minutes,
          isPro: exam.is_pro,
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
        part.title.toLowerCase().includes('listening') ||
        (part.part_number <= 4 && exam.skill === 'FULL_TEST' && part.title.toLowerCase().includes('part'));

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

        // Trích xuất số hiệu đề từ exam.title (vd: "Đề 01", "Đề 07", "Đề 30") hoặc exam.id
        const numMatch = exam.title.match(/Đề\s*(\d+)/i) || exam.title.match(/Test\s*(\d+)/i) || exam.title.match(/\b(\d+)\b/);
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

      // Chuẩn hóa partType và thời gian khảo thí theo chuẩn British Council (Single Source of Truth)
      const partTitleLower = (part.title || '').toLowerCase();
      const examTitleLower = (exam.title || '').toLowerCase();
      let partType: 'PART_1' | 'PART_2' | 'PART_3' | 'PART_4' = 'PART_1';

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
        partTitleLower.includes('opinion') ||
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
      (part as any).partType = partType;

      // Cấu hình chuẩn hóa khảo thí theo từng Part thực tế (Áp dụng cho cả Đề Đơn Lẻ và FULL_TEST)
      const isSpeakingPart = exam.skill === 'SPEAKING' || partTitleLower.includes('speaking') || partTitleLower.includes('nói');
      const isWritingPart = exam.skill === 'WRITING' || partTitleLower.includes('writing') || partTitleLower.includes('viết');
      const isReadingPart = exam.skill === 'READING' || partTitleLower.includes('reading') || partTitleLower.includes('đọc');
      const isGrammarVocabPart = exam.skill === 'GRAMMAR_VOCABULARY' || partTitleLower.includes('grammar') || partTitleLower.includes('vocab');

      if (isSpeakingPart) {
        if (partType === 'PART_4') {
          part.image_url = null;
          (part as any).prepTime = 60;
          (part as any).speakTime = 120;
          (part as any).partSubtitle = 'Part 4 - Abstract Discussion';
        } else if (partType === 'PART_2') {
          (part as any).prepTime = 12;
          (part as any).speakTime = 45;
          (part as any).partSubtitle = 'Part 2 - Describe & Opinion';
        } else if (partType === 'PART_3') {
          (part as any).prepTime = 12;
          (part as any).speakTime = 45;
          (part as any).partSubtitle = 'Part 3 - Compare & Explain';
        } else {
          part.image_url = null;
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
      }

      // BẢO MẬT: Tuyệt đối không để lộ explanation cho các kỹ năng trắc nghiệm khi chưa nộp bài
      if (exam.skill !== 'SPEAKING' && exam.skill !== 'WRITING') {
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
