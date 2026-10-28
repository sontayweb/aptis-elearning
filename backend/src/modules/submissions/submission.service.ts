import { prisma } from '../../config/database';
import { AutosaveAnswerInput, HeartbeatInput, MyHistoryFilterInput } from './submission.dto';
import { SubmissionStatus, QuestionType, AuditAction } from '@prisma/client';
import { auditService } from '../audit/audit.service';
import { assertProAccess } from '../../utils/pro-guard';
import { scoreToCefr } from '../../utils/cefr-engine';
import { gradeObjectiveQuestion } from '../../utils/scoring-engine';
import { aiGradingService } from '../ai-grading/ai-grading.service';

export class SubmissionService {
  async startSubmission(userId: string, examId: string, forceNew = false) {
    const trimmed = examId.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed);
    let exam = isUuid
      ? await prisma.exam.findUnique({ where: { id: trimmed } })
      : null;

    if (!exam) {
      exam = await prisma.exam.findFirst({
        where: {
          OR: [
            { id: trimmed },
            { title: { contains: trimmed, mode: 'insensitive' } },
          ],
        },
      });
    }

    if (!exam || !exam.is_published) {
      throw { statusCode: 404, message: 'Đề thi không tồn tại hoặc đã ngừng công khai' };
    }

    // Kiểm tra quyền nếu là đề PRO
    if (exam.is_pro) {
      await assertProAccess(userId, 'Đề thi PRO');
    }

    const now = new Date();

    // 1. Kiểm tra xem học viên có phiên IN_PROGRESS nào của đề này còn hạn không (trừ khi yêu cầu forceNew)
    if (!forceNew) {
      const activeSubmission = await prisma.examSubmission.findFirst({
        where: {
          user_id: userId,
          exam_id: exam.id,
          status: SubmissionStatus.IN_PROGRESS,
          deadline_at: { gt: now },
        },
        include: {
          exam: {
            select: {
              id: true,
              title: true,
              skill: true,
              duration_minutes: true,
            },
          },
          answers: true,
        },
        orderBy: { started_at: 'desc' },
      });

      if (activeSubmission) {
        const serverTimeRemaining = Math.max(
          0,
          Math.floor((activeSubmission.deadline_at.getTime() - now.getTime()) / 1000)
        );

        const savedAnswersMap: Record<string, any> = {};
        for (const ans of activeSubmission.answers) {
          savedAnswersMap[ans.question_id] = {
            selectedOption: ans.selected_option,
            textAnswer: ans.text_answer,
            audioUrl: ans.audio_url,
            audioDuration: ans.audio_duration,
          };
        }

        return {
          submissionId: activeSubmission.id,
          exam: activeSubmission.exam,
          status: activeSubmission.status,
          startedAt: activeSubmission.started_at,
          deadlineAt: activeSubmission.deadline_at,
          serverTimeRemaining,
          isResumed: true,
          savedAnswers: savedAnswersMap,
        };
      }
    }

    // 2. Tự động đóng các phiên IN_PROGRESS cũ đã quá hạn
    await prisma.examSubmission.updateMany({
      where: {
        user_id: userId,
        exam_id: exam.id,
        status: SubmissionStatus.IN_PROGRESS,
        deadline_at: { lte: now },
      },
      data: {
        status: SubmissionStatus.SUBMITTED,
      },
    });

    // 3. Tạo phiên thi mới
    const deadlineAt = new Date(now.getTime() + exam.duration_minutes * 60 * 1000);

    const submission = await prisma.examSubmission.create({
      data: {
        user_id: userId,
        exam_id: exam.id,
        status: SubmissionStatus.IN_PROGRESS,
        started_at: now,
        deadline_at: deadlineAt,
        last_active_at: now,
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            skill: true,
            duration_minutes: true,
          },
        },
      },
    });

    const serverTimeRemaining = Math.max(0, Math.floor((deadlineAt.getTime() - now.getTime()) / 1000));

    return {
      submissionId: submission.id,
      exam: submission.exam,
      status: submission.status,
      startedAt: submission.started_at,
      deadlineAt: submission.deadline_at,
      serverTimeRemaining,
      isResumed: false,
      savedAnswers: {},
    };
  }

  async autosave(userId: string, submissionId: string, input: AutosaveAnswerInput) {
    const submission = await prisma.examSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission || submission.user_id !== userId) {
      throw { statusCode: 404, message: 'Không tìm thấy phiên làm bài thi' };
    }

    const now = new Date();
    if (submission.status !== SubmissionStatus.IN_PROGRESS || now > submission.deadline_at) {
      // Đã hết giờ hoặc đã nộp
      return {
        isExpired: true,
        serverTimeRemaining: 0,
        savedCount: 0,
      };
    }

    // Upsert câu trả lời và cập nhật last_active_at theo batch atomic transaction
    await prisma.$transaction([
      ...input.answers.map((ans) =>
        prisma.submissionAnswer.upsert({
          where: {
            submission_id_question_id: {
              submission_id: submissionId,
              question_id: ans.questionId,
            },
          },
          update: {
            selected_option: ans.selectedOption,
            text_answer: ans.textAnswer,
            audio_url: ans.audioUrl,
            audio_duration: ans.audioDuration,
          },
          create: {
            submission_id: submissionId,
            question_id: ans.questionId,
            selected_option: ans.selectedOption,
            text_answer: ans.textAnswer,
            audio_url: ans.audioUrl,
            audio_duration: ans.audioDuration,
          },
        })
      ),
      prisma.examSubmission.update({
        where: { id: submissionId },
        data: { last_active_at: now },
      }),
    ]);

    const serverTimeRemaining = Math.max(
      0,
      Math.floor((submission.deadline_at.getTime() - now.getTime()) / 1000)
    );

    return {
      isExpired: false,
      serverTimeRemaining,
      savedCount: input.answers.length,
    };
  }

  async heartbeat(userId: string, submissionId: string, input: HeartbeatInput) {
    const submission = await prisma.examSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission || submission.user_id !== userId) {
      throw { statusCode: 404, message: 'Không tìm thấy phiên làm bài thi' };
    }

    const now = new Date();
    const isExpired = submission.status !== SubmissionStatus.IN_PROGRESS || now > submission.deadline_at;

    await prisma.examSubmission.update({
      where: { id: submissionId },
      data: {
        last_active_at: now,
        tab_switch_count: { increment: input.tabSwitchCount || 0 },
      },
    });

    const serverTimeRemaining = Math.max(
      0,
      Math.floor((submission.deadline_at.getTime() - now.getTime()) / 1000)
    );

    return {
      status: submission.status,
      isExpired,
      serverTimeRemaining,
    };
  }

  async resume(userId: string, submissionId: string) {
    const submission = await prisma.examSubmission.findUnique({
      where: { id: submissionId },
      include: {
        exam: {
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
                    max_score: true,
                  },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!submission || submission.user_id !== userId) {
      throw { statusCode: 404, message: 'Không tìm thấy phiên làm bài thi' };
    }

    const now = new Date();
    const serverTimeRemaining = Math.max(
      0,
      Math.floor((submission.deadline_at.getTime() - now.getTime()) / 1000)
    );

    const savedAnswersMap: Record<string, any> = {};
    for (const ans of submission.answers) {
      savedAnswersMap[ans.question_id] = {
        selectedOption: ans.selected_option,
        textAnswer: ans.text_answer,
        audioUrl: ans.audio_url,
        audioDuration: ans.audio_duration,
      };
    }

    return {
      submissionId: submission.id,
      status: submission.status,
      startedAt: submission.started_at,
      deadlineAt: submission.deadline_at,
      serverTimeRemaining,
      exam: submission.exam,
      savedAnswers: savedAnswersMap,
    };
  }

  async submit(userId: string, submissionId: string) {
    const submission = await prisma.examSubmission.findUnique({
      where: { id: submissionId },
      include: {
        exam: {
          include: {
            parts: {
              include: { questions: true },
            },
          },
        },
        answers: true,
      },
    });

    if (!submission || submission.user_id !== userId) {
      throw { statusCode: 404, message: 'Không tìm thấy phiên làm bài thi' };
    }

    if (submission.status === SubmissionStatus.SUBMITTED || submission.status === SubmissionStatus.GRADED) {
      throw { statusCode: 400, message: 'Bài thi này đã được nộp trước đó' };
    }

    // Chấm điểm các câu hỏi trắc nghiệm & điền từ
    const questionsMap = new Map();
    let hasSubjective = false;

    for (const part of submission.exam.parts) {
      for (const q of part.questions) {
        questionsMap.set(q.id, q);
        if (
          q.question_type === QuestionType.ESSAY ||
          q.question_type === QuestionType.SPEAKING_AUDIO ||
          q.question_type === QuestionType.SHORT_TEXT ||
          submission.exam.skill === 'WRITING' ||
          submission.exam.skill === 'SPEAKING'
        ) {
          hasSubjective = true;
        }
      }
    }

    let totalScore = 0;
    let maxTotalScore = 0;
    const answerUpdates: Array<{ id: string; score: number }> = [];

    for (const ans of submission.answers) {
      const q = questionsMap.get(ans.question_id);
      if (!q) continue;

      maxTotalScore += q.max_score;

      // Không chấm trắc nghiệm cho bài viết (Writing) hoặc bài nói (Speaking) vì sẽ do AI hoặc Giảng viên chấm
      const isSubjectiveQuestion =
        submission.exam.skill === 'WRITING' ||
        submission.exam.skill === 'SPEAKING' ||
        q.question_type === QuestionType.ESSAY ||
        q.question_type === QuestionType.SPEAKING_AUDIO ||
        q.question_type === QuestionType.SHORT_TEXT;

      if (isSubjectiveQuestion) {
        continue;
      }

      const userChoice = ans.selected_option || ans.text_answer || '';
      const { score } = gradeObjectiveQuestion(
        q.question_type,
        q.correct_answer,
        userChoice,
        q.max_score,
        q.options
      );

      totalScore += score;
      answerUpdates.push({ id: ans.id, score });
    }

    const nextStatus = hasSubjective
      ? SubmissionStatus.PENDING_EVALUATION
      : SubmissionStatus.GRADED;

    // Tính thang điểm CEFR (0 - 50 điểm chuẩn British Council Aptis) nếu hoàn toàn là trắc nghiệm
    let calculatedCefr: string | null = null;
    if (!hasSubjective) {
      calculatedCefr = scoreToCefr(totalScore, maxTotalScore);
    }

    const skill = submission.exam.skill;
    let readingScore: number | undefined = skill === 'READING' ? totalScore : undefined;
    let listeningScore: number | undefined = skill === 'LISTENING' ? totalScore : undefined;
    let grammarScore: number | undefined = skill === 'GRAMMAR_VOCABULARY' ? totalScore : undefined;

    // Nếu là FULL_TEST, bóc tách điểm từng kỹ năng và chuẩn hóa về thang 50 điểm chuẩn British Council
    if (skill === 'FULL_TEST') {
      let rScore = 0, maxRScore = 0;
      let lScore = 0, maxLScore = 0;
      let gScore = 0, maxGScore = 0;

      for (const part of submission.exam.parts) {
        const partTitle = (part?.title || '').toLowerCase();
        for (const q of part.questions) {
          if (partTitle.includes('reading')) maxRScore += q.max_score;
          else if (partTitle.includes('listening')) maxLScore += q.max_score;
          else if (partTitle.includes('grammar') || partTitle.includes('vocab')) maxGScore += q.max_score;
        }
      }

      for (const ans of submission.answers) {
        const q = questionsMap.get(ans.question_id);
        if (!q) continue;
        const qScore = answerUpdates.find((u) => u.id === ans.id)?.score || 0;
        const part = submission.exam.parts.find((p) => p.id === q.part_id);
        const partTitle = (part?.title || '').toLowerCase();

        if (partTitle.includes('reading')) {
          rScore += qScore;
        } else if (partTitle.includes('listening')) {
          lScore += qScore;
        } else if (partTitle.includes('grammar') || partTitle.includes('vocab')) {
          gScore += qScore;
        }
      }

      // Chuẩn hóa sang thang điểm 0 - 50 cho từng kỹ năng
      if (maxRScore > 0) readingScore = Math.round((rScore / maxRScore) * 50);
      if (maxLScore > 0) listeningScore = Math.round((lScore / maxLScore) * 50);
      if (maxGScore > 0) grammarScore = Math.round((gScore / maxGScore) * 50);
    }

    // Atomic transaction cập nhật điểm từng câu và trạng thái bài nộp
    const updatedSubmission = await prisma.$transaction(async (tx) => {
      for (const item of answerUpdates) {
        await tx.submissionAnswer.update({
          where: { id: item.id },
          data: { score: item.score },
        });
      }

      return tx.examSubmission.update({
        where: { id: submissionId },
        data: {
          status: nextStatus,
          submitted_at: new Date(),
          total_score: totalScore,
          cefr_level: calculatedCefr,
          reading_score: readingScore,
          listening_score: listeningScore,
          grammar_score: grammarScore,
        },
        include: {
          exam: true,
        },
      });
    });

    // Tự động kích hoạt chấm AI ngầm cho bài thi có Writing/Speaking (không bắt học viên chờ 24-48h)
    if (nextStatus === SubmissionStatus.PENDING_EVALUATION) {
      setImmediate(async () => {
        try {
          await aiGradingService.evaluateSubmission(submissionId);
          console.log(`✅ [Auto AI Grading] Đã chấm tự động xong bài thi ${submissionId}`);
        } catch (err: any) {
          console.warn(`⚠️ [Auto AI Grading] Chấm ngầm bài ${submissionId} gặp sự cố:`, err?.message || err);
        }
      });
    }

    // Ghi nhận Audit Log tiến độ hoàn thành bài thi
    auditService.record({
      action: AuditAction.SUBMISSION_GRADE_TEACHER,
      entityType: 'EXAM_SUBMISSION',
      entityId: submissionId,
      description: `Học viên hoàn thành bài thi "${submission.exam.title}" - Đạt ${totalScore} điểm, CEFR: ${calculatedCefr || 'Chờ đánh giá'}`,
      newValue: {
        totalScore,
        cefrLevel: calculatedCefr,
        status: nextStatus,
        completedAt: new Date().toISOString(),
      },
      systemActor: {
        id: userId,
        name: 'Học viên',
        email: '',
        role: 'STUDENT',
      },
    }).catch(() => {});

    // Tính partBreakdown
    const partMap = new Map<string, { partNumber: number; title: string; correctCount: number; totalCount: number; score: number; maxScore: number }>();
    for (const part of submission.exam.parts) {
      partMap.set(part.id, {
        partNumber: part.part_number,
        title: part.title,
        correctCount: 0,
        totalCount: part.questions.length,
        score: 0,
        maxScore: part.questions.reduce((sum, q) => sum + q.max_score, 0),
      });
    }

    let correctCount = 0;
    for (const item of answerUpdates) {
      const ans = submission.answers.find((a) => a.id === item.id);
      if (!ans) continue;
      const q = questionsMap.get(ans.question_id);
      if (!q) continue;
      const pInfo = partMap.get(q.part_id);
      if (pInfo) {
        pInfo.score += Math.round(item.score * 10) / 10;
        if (item.score > 0) {
          pInfo.correctCount++;
          correctCount++;
        }
      }
    }

    return {
      submissionId: updatedSubmission.id,
      status: updatedSubmission.status,
      submittedAt: updatedSubmission.submitted_at,
      totalScore: Math.round(updatedSubmission.total_score! * 10) / 10,
      cefrLevel: updatedSubmission.cefr_level,
      readingScore: updatedSubmission.reading_score,
      listeningScore: updatedSubmission.listening_score,
      writingScore: updatedSubmission.writing_score,
      speakingScore: updatedSubmission.speaking_score,
      grammarScore: updatedSubmission.grammar_score,
      hasSubjectiveEvaluation: hasSubjective,
      correctCount,
      totalQuestions: questionsMap.size,
      partBreakdown: Array.from(partMap.values()),
    };
  }

  async getMyHistory(userId: string, filter: MyHistoryFilterInput) {
    const { page, limit, skill, status, search } = filter;
    const skip = (page - 1) * limit;

    const where: any = {
      user_id: userId,
    };

    if (status) {
      where.status = status;
    }

    if (skill && skill !== 'all') {
      const normalizedSkill = skill.toUpperCase();
      if (normalizedSkill === 'GRAMMAR') {
        where.exam = { skill: 'GRAMMAR_VOCABULARY' };
      } else {
        where.exam = { skill: normalizedSkill };
      }
    }

    if (search) {
      where.exam = {
        ...(where.exam || {}),
        title: { contains: search, mode: 'insensitive' },
      };
    }

    const [submissions, total, allUserCompleted] = await Promise.all([
      prisma.examSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { started_at: 'desc' },
        include: {
          exam: {
            select: {
              id: true,
              title: true,
              skill: true,
              duration_minutes: true,
            },
          },
          answers: {
            select: {
              id: true,
              score: true,
            },
          },
        },
      }),
      prisma.examSubmission.count({ where }),
      prisma.examSubmission.findMany({
        where: {
          user_id: userId,
          status: { in: [SubmissionStatus.GRADED, SubmissionStatus.SUBMITTED, SubmissionStatus.PENDING_EVALUATION] },
        },
        select: {
          total_score: true,
          grammar_score: true,
          listening_score: true,
          reading_score: true,
          writing_score: true,
          speaking_score: true,
          cefr_level: true,
          exam: { select: { skill: true } },
        },
      }),
    ]);

    // Format các bài thi
    const items = submissions.map((sub) => {
      const isGraded = sub.status === SubmissionStatus.GRADED || sub.status === SubmissionStatus.SUBMITTED;
      let durationStr = 'N/A';
      if (sub.submitted_at && sub.started_at) {
        const diffMinutes = Math.max(1, Math.round((sub.submitted_at.getTime() - sub.started_at.getTime()) / 60000));
        durationStr = `${diffMinutes} phút`;
      } else if (sub.exam.duration_minutes) {
        durationStr = `${sub.exam.duration_minutes} phút`;
      }

      // Format Vietnamese date
      const d = sub.submitted_at || sub.started_at;
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateFormatted = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

      const maxScale = sub.exam.skill === 'FULL_TEST' ? 200 : 50;
      const scoreDisplay = isGraded && sub.total_score != null
        ? `${Math.round(sub.total_score)}/${maxScale}`
        : sub.status === SubmissionStatus.IN_PROGRESS
        ? 'Đang làm'
        : 'Chờ chấm';

      // Map skill display name
      let skillDisplay = 'Grammar';
      if (sub.exam.skill === 'LISTENING') skillDisplay = 'Listening';
      else if (sub.exam.skill === 'READING') skillDisplay = 'Reading';
      else if (sub.exam.skill === 'WRITING') skillDisplay = 'Writing';
      else if (sub.exam.skill === 'SPEAKING') skillDisplay = 'Speaking';
      else if (sub.exam.skill === 'FULL_TEST') skillDisplay = 'Full Test';
      else if (sub.exam.skill === 'GRAMMAR_VOCABULARY') skillDisplay = 'Grammar';

      return {
        id: sub.id,
        examId: sub.exam.id,
        examTitle: sub.exam.title,
        skill: skillDisplay,
        rawSkill: sub.exam.skill,
        date: dateFormatted,
        durationSpent: durationStr,
        score: scoreDisplay,
        scoreNumber: sub.total_score ?? 0,
        band: sub.cefr_level || (isGraded ? 'B2' : 'Đang xử lý'),
        status: sub.status,
        totalQuestions: sub.answers.length,
        correctAnswers: sub.answers.filter((a) => (a.score || 0) > 0).length,
      };
    });

    // Thống kê tổng hợp cho user
    const totalCompleted = allUserCompleted.length;
    let avgAccuracyPercent = 0;
    if (totalCompleted > 0) {
      const totalPct = allUserCompleted.reduce((acc, cur) => {
        const max = cur.exam.skill === 'FULL_TEST' ? 200 : 50;
        const score = cur.total_score ?? 0;
        return acc + Math.min(100, Math.round((score / max) * 100));
      }, 0);
      avgAccuracyPercent = Math.round(totalPct / totalCompleted);
    }

    // Ước tính level
    const bands = allUserCompleted.map((c) => c.cefr_level).filter(Boolean);
    const estimatedLevel = bands.length > 0 ? `${bands[0]} Target` : 'Chưa xếp band';

    return {
      items,
      summary: {
        totalCompleted,
        avgAccuracyPercent: avgAccuracyPercent || 0,
        estimatedLevel,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSubmissionDetail(userId: string, submissionId: string, userRole?: string) {
    const submission = await prisma.examSubmission.findUnique({
      where: { id: submissionId },
      include: {
        exam: {
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
        },
        answers: true,
        ai_results: true,
      },
    });

    if (!submission) {
      throw { statusCode: 404, message: 'Không tìm thấy kết quả bài thi' };
    }

    // Kiểm tra quyền: Chủ bài thi HOẶC Giảng viên / Admin
    if (submission.user_id !== userId && userRole !== 'ADMIN' && userRole !== 'TEACHER') {
      throw { statusCode: 403, message: 'Bạn không có quyền truy cập kết quả bài thi này' };
    }

    return submission;
  }
}

export const submissionService = new SubmissionService();
