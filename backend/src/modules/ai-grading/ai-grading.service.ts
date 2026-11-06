import fs from 'fs';
import OpenAI from 'openai';
import { prisma } from '../../config/database';
import { ExamSkill, QuestionType, SubmissionStatus } from '@prisma/client';
import { audioService } from '../audio/audio.service';
import { geminiRotator } from './gemini-rotator.service';
import { scoreToCefr } from '../../utils/cefr-engine';

export class AiGradingService {
  private getOpenAIClient(): OpenAI | null {
    const apiKey = process.env.OPENAI_API_KEY;
    const useRealAi = process.env.USE_REAL_AI === 'true';
    if (!useRealAi || !apiKey || apiKey.trim() === '') {
      return null;
    }
    return new OpenAI({ apiKey });
  }

  private async evaluateWritingWithAI(
    openai: OpenAI,
    questionPrompt: string,
    context: string,
    text: string
  ) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an official British Council Aptis ESOL Writing senior examiner.
Evaluate the candidate's writing response according to standard British Council Aptis ESOL criteria (score scale 0-50).
Scoring criteria:
- task_completion (0-50): Addressing all parts of the prompt, word count compliance, register/tone.
- grammar_score (0-50): Accuracy and range of grammatical structures.
- vocabulary_score (0-50): Lexical diversity, spelling, precision.
- cohesion_score (0-50): Coherence, paragraph flow, transitions.
Compute overall score (0-50) and map to CEFR level (A1, A2, B1, B2, C1).
Write summary feedback and suggestions in Vietnamese.
Respond strictly in JSON format matching this schema:
{
  "score": number,
  "cefr_level": "A1" | "A2" | "B1" | "B2" | "C1",
  "task_completion": number,
  "grammar_score": number,
  "vocabulary_score": number,
  "cohesion_score": number,
  "feedback_summary": string,
  "detailed_feedback": [
    {
      "original": string,
      "suggested": string,
      "errorType": string,
      "comment": string
    }
  ]
}`,
        },
        {
          role: 'user',
          content: `Prompt: "${questionPrompt}"
Context: "${context}"
Candidate Text:
"""
${text}
"""`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    return { ...parsed, raw: parsed };
  }

  private async evaluateSpeakingWithAI(
    openai: OpenAI,
    audioFilePath: string,
    questionPrompt: string,
    audioDuration: number
  ) {
    // 1. Whisper transcription
    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: fs.createReadStream(audioFilePath),
      language: 'en',
    });
    const transcriptText = transcription.text;

    // 2. GPT-4o rubric evaluation
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an official British Council Aptis ESOL Speaking senior examiner.
Evaluate the candidate's spoken response according to standard British Council Aptis ESOL criteria (score scale 0-50).
Scoring criteria:
- pronunciation (0-50): Intelligibility, phonological features, stress, intonation.
- fluency_score (0-50): Speech rate, hesitation, coherence.
- grammar_score (0-50): Accuracy and range of spoken grammatical structures.
- vocabulary_score (0-50): Lexical resource and topic relevance.
Compute overall score (0-50) and map to CEFR level (A1, A2, B1, B2, C1).
Write summary feedback and suggestions in Vietnamese.
Respond strictly in JSON format matching this schema:
{
  "score": number,
  "cefr_level": "A1" | "A2" | "B1" | "B2" | "C1",
  "pronunciation": number,
  "fluency_score": number,
  "grammar_score": number,
  "vocabulary_score": number,
  "feedback_summary": string,
  "detailed_feedback": [
    {
      "criterion": string,
      "comment": string
    }
  ]
}`,
        },
        {
          role: 'user',
          content: `Question Prompt: "${questionPrompt}"
Audio Duration: ${audioDuration} seconds
Transcribed Candidate Speech:
"""
${transcriptText}
"""`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    return { ...parsed, transcriptText, raw: parsed };
  }

  private activeEvaluations = new Map<string, Promise<any>>();

  async evaluateSubmission(submissionId: string, userId?: string, userRole?: string) {
    const existingPromise = this.activeEvaluations.get(submissionId);
    if (existingPromise) {
      return existingPromise;
    }

    const evalPromise = this._executeEvaluateSubmission(submissionId, userId, userRole).finally(() => {
      this.activeEvaluations.delete(submissionId);
    });

    this.activeEvaluations.set(submissionId, evalPromise);
    return evalPromise;
  }

  private async _executeEvaluateSubmission(submissionId: string, userId?: string, userRole?: string) {
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
        ai_results: true,
      },
    });

    if (!submission) {
      throw { statusCode: 404, message: 'Bài nộp không tồn tại' };
    }

    // 1. Kiểm tra quyền sở hữu IDOR
    if (userId && submission.user_id !== userId && userRole !== 'ADMIN' && userRole !== 'TEACHER') {
      throw { statusCode: 403, message: 'Bạn không có quyền yêu cầu chấm bài làm của học viên khác' };
    }

    // 2. Chống lặp (Idempotency Guard): Chỉ trả về kết quả cũ khi bài đã GRADED và đã chấm đủ các câu trả lời
    if (
      submission.status === SubmissionStatus.GRADED &&
      submission.ai_results &&
      submission.ai_results.length > 0 &&
      submission.ai_results.length >= submission.answers.length
    ) {
      return {
        submissionId,
        overallScore: submission.total_score || 0,
        cefrLevel: submission.cefr_level || 'A0',
        evaluatedQuestionsCount: submission.ai_results.length,
        aiResults: submission.ai_results,
        isCached: true,
        message: 'Kết quả chấm AI đã được hoàn tất trước đó',
      };
    }

    // 3. Quản lý Quota AI: Kiểm tra & Trừ lượt chấm AI của học viên
    let activeSubId: string | null = null;
    const isStaff = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'TEACHER';
    const targetUserId = userId || submission.user_id;
    if (targetUserId && !isStaff) {
      const activeSub = await prisma.userSubscription.findFirst({
        where: {
          user_id: targetUserId,
          is_active: true,
          end_date: { gt: new Date() },
        },
        orderBy: { end_date: 'desc' },
      });

      if (activeSub) {
        if (activeSub.ai_quota_left <= 0) {
          throw {
            statusCode: 403,
            message: 'Tài khoản của bạn đã sử dụng hết lượt chấm AI. Vui lòng nâng cấp gói hoặc liên hệ Giáo vụ.',
          };
        }
        activeSubId = activeSub.id;
      }
    }

    const openai = this.getOpenAIClient();
    const aiResults = [];
    let writingTotalScore = 0;
    let speakingTotalScore = 0;
    let subjectiveQuestionCount = 0;
    let writingQuestionCount = 0;
    let speakingQuestionCount = 0;

    // Nếu học viên nộp bài trắng hoàn toàn (chưa có bản ghi nào trong submission.answers),
    // tự động lấy danh sách câu hỏi tự luận trong đề để chấm 0 điểm chuẩn xác
    const answersToEvaluate: Array<{
      id?: string;
      question_id: string;
      text_answer?: string | null;
      audio_duration?: number | null;
      transcript_text?: string | null;
      created_at?: Date;
    }> =
      submission.answers.length > 0
        ? submission.answers
        : submission.exam.parts.flatMap((p) =>
            p.questions
              .filter(
                (q) =>
                  q.question_type === QuestionType.ESSAY ||
                  q.question_type === QuestionType.SHORT_TEXT ||
                  q.question_type === QuestionType.SPEAKING_AUDIO ||
                  submission.exam.skill === ExamSkill.WRITING ||
                  submission.exam.skill === ExamSkill.SPEAKING
              )
              .map((q) => ({
                question_id: q.id,
                text_answer: '',
                audio_duration: 0,
                transcript_text: '',
                created_at: submission.started_at,
              }))
          );

    for (const ans of answersToEvaluate) {
      // Nếu câu này đã có kết quả AI từ trước thì tái sử dụng, không chấm lại
      const existingAiResult = (submission.ai_results || []).find(
        (r) => r.question_id === ans.question_id
      );
      if (existingAiResult) {
        aiResults.push(existingAiResult);
        subjectiveQuestionCount++;
        if (existingAiResult.skill === ExamSkill.WRITING) {
          writingQuestionCount++;
          writingTotalScore += existingAiResult.score || 0;
        } else if (existingAiResult.skill === ExamSkill.SPEAKING) {
          speakingQuestionCount++;
          speakingTotalScore += existingAiResult.score || 0;
        }
        continue;
      }

      // Tìm câu hỏi tương ứng
      let question;
      let part;
      for (const p of submission.exam.parts) {
        const found = p.questions.find((q) => q.id === ans.question_id);
        if (found) {
          question = found;
          part = p;
          break;
        }
      }

      if (!question || !part) continue;

      const isWritingQuestion =
        question.question_type === QuestionType.ESSAY ||
        question.question_type === QuestionType.SHORT_TEXT ||
        submission.exam.skill === ExamSkill.WRITING;

      if (isWritingQuestion) {
        // Chấm bài viết (Writing)
        subjectiveQuestionCount++;
        writingQuestionCount++;
        const rawText = ans.text_answer || '';
        // Bảo vệ an toàn bộ nhớ: Cắt chuỗi tối đa 3,000 ký tự & đếm từ bằng regex chống OOM Heap crash
        const text = rawText.slice(0, 3000);
        const wordCount = (text.trim().match(/\S+/g) || []).length;

        let evalResult: any = null;
        let modelUsed = 'heuristic-evaluator';

        if (wordCount >= 2) {
          // 1. Ưu tiên chấm bằng Gemini với cơ chế xoay vòng model thông minh
          if (geminiRotator.isAvailable()) {
            try {
              evalResult = await geminiRotator.evaluateWriting(
                question.prompt,
                part.passage_text || part.instructions || '',
                text
              );
              modelUsed = evalResult?.usedModel || 'gemini';
            } catch (geminiErr: any) {
              console.warn('[AI Grading] Gemini Rotator writing failed:', geminiErr?.message);
            }
          }

          // 2. Dự phòng OpenAI GPT-4o nếu Gemini gặp sự cố hoặc chưa cấu hình
          if (!evalResult && openai) {
            try {
              evalResult = await this.evaluateWritingWithAI(
                openai,
                question.prompt,
                part.passage_text || part.instructions || '',
                text
              );
              modelUsed = 'gpt-4o';
            } catch (aiErr) {
              console.warn('[AI Grading] OpenAI writing evaluation fallback triggered:', aiErr);
            }
          }
        }

        let taskScore = evalResult?.task_completion;
        let grammarScore = evalResult?.grammar_score;
        let vocabScore = evalResult?.vocabulary_score;
        let cohesionScore = evalResult?.cohesion_score;
        let averageScore = evalResult?.score;
        let cefrLevel = evalResult?.cefr_level;
        let feedbackSummary = evalResult?.feedback_summary;
        let detailedFeedback = evalResult?.detailed_feedback;

        if (wordCount < 2) {
          taskScore = 0;
          grammarScore = 0;
          vocabScore = 0;
          cohesionScore = 0;
          averageScore = 0;
          cefrLevel = 'A0';
          feedbackSummary = 'Bài viết bỏ trống hoặc quá ngắn để chấm điểm.';
          detailedFeedback = [];
        } else if (!evalResult || typeof averageScore !== 'number') {
          taskScore = Math.min(50, Math.max(10, wordCount > 30 ? 35 : 20));
          grammarScore = 30;
          vocabScore = 30;
          cohesionScore = 30;
          averageScore = Math.round((taskScore + grammarScore + vocabScore + cohesionScore) / 4);

          cefrLevel = scoreToCefr(averageScore);
          feedbackSummary = `Bài viết có độ dài ${wordCount} từ. Đạt mức ước lượng ${cefrLevel}.`;
          detailedFeedback = [];
        }

        writingTotalScore += averageScore;

        const aiResult = await prisma.aiGradingResult.create({
          data: {
            submission_id: submissionId,
            question_id: question.id,
            skill: ExamSkill.WRITING,
            model_name: modelUsed,
            score: averageScore,
            cefr_level: cefrLevel,
            task_completion: taskScore,
            grammar_score: grammarScore,
            vocabulary_score: vocabScore,
            fluency_score: cohesionScore,
            feedback_summary: feedbackSummary,
            detailed_feedback: detailedFeedback,
            raw_ai_response: evalResult?.raw || null,
          },
        });

        aiResults.push(aiResult);
      } else if (question.question_type === QuestionType.SPEAKING_AUDIO) {
        // Chấm bài nói (Speaking)
        subjectiveQuestionCount++;
        speakingQuestionCount++;
        const audioDuration = ans.audio_duration || 0;

        let evalResult: any = null;
        let modelUsed = 'heuristic-evaluator';
        let transcriptText = ans.transcript_text;

        const audioFilePath = audioService.getPhysicalFilePath(
          submissionId,
          question.id,
          ans.created_at || submission.started_at || undefined
        );

        const hasValidAudio = Boolean(audioFilePath && fs.existsSync(audioFilePath));

        if (hasValidAudio) {
          // 1. Ưu tiên chấm bằng Gemini Multimodal Audio với cơ chế xoay vòng model
          if (geminiRotator.isAvailable()) {
            try {
              evalResult = await geminiRotator.evaluateSpeaking(
                audioFilePath!,
                question.prompt,
                audioDuration || 30
              );
              modelUsed = evalResult?.usedModel || 'gemini-multimodal';
              if (evalResult?.transcriptText) {
                transcriptText = evalResult.transcriptText;
                if (ans.id) {
                  await prisma.submissionAnswer.update({
                    where: { id: ans.id },
                    data: { transcript_text: transcriptText },
                  });
                }
              }
            } catch (geminiErr: any) {
              console.warn('[AI Grading] Gemini Rotator speaking failed:', geminiErr?.message);
            }
          }

          // 2. Dự phòng OpenAI Whisper + GPT-4o nếu Gemini chưa bật hoặc lỗi
          if (!evalResult && openai) {
            try {
              evalResult = await this.evaluateSpeakingWithAI(
                openai,
                audioFilePath!,
                question.prompt,
                audioDuration || 30
              );
              modelUsed = 'whisper-1 + gpt-4o';
              if (evalResult?.transcriptText) {
                transcriptText = evalResult.transcriptText;
                if (ans.id) {
                  await prisma.submissionAnswer.update({
                    where: { id: ans.id },
                    data: { transcript_text: transcriptText },
                  });
                }
              }
            } catch (aiErr) {
              console.warn('Speaking real AI evaluation fallback triggered:', aiErr);
            }
          }
        }

        let pronScore = evalResult?.pronunciation;
        let fluencyScore = evalResult?.fluency_score;
        let grammarScore = evalResult?.grammar_score;
        let vocabScore = evalResult?.vocabulary_score;
        let averageScore = evalResult?.score;
        let cefrLevel = evalResult?.cefr_level;
        let feedbackSummary = evalResult?.feedback_summary;
        let detailedFeedback = evalResult?.detailed_feedback;

        if (!hasValidAudio) {
          pronScore = 0;
          fluencyScore = 0;
          grammarScore = 0;
          vocabScore = 0;
          averageScore = 0;
          cefrLevel = 'A0';
          transcriptText = '';
          feedbackSummary = 'Chưa ghi nhận bản thu âm giọng nói cho câu hỏi này.';
          detailedFeedback = [];
        } else if (!evalResult || typeof averageScore !== 'number') {
          pronScore = 0;
          fluencyScore = 0;
          grammarScore = 0;
          vocabScore = 0;
          averageScore = 0;
          cefrLevel = 'A0';
          feedbackSummary = 'Không thể phân tích âm thanh hoặc giọng nói không rõ ràng.';
          detailedFeedback = [];
        }

        speakingTotalScore += averageScore;

        const aiResult = await prisma.aiGradingResult.create({
          data: {
            submission_id: submissionId,
            question_id: question.id,
            skill: ExamSkill.SPEAKING,
            model_name: modelUsed,
            transcript: transcriptText || '',
            score: averageScore,
            cefr_level: cefrLevel,
            pronunciation: pronScore,
            fluency_score: fluencyScore,
            grammar_score: grammarScore,
            vocabulary_score: vocabScore,
            feedback_summary: feedbackSummary,
            detailed_feedback: detailedFeedback,
            raw_ai_response: evalResult?.raw || null,
          },
        });

        aiResults.push(aiResult);
      }
    }

    // Cập nhật trạng thái bài thi sang GRADED với thang điểm chuẩn British Council
    const finalWritingScore =
      writingQuestionCount > 0 ? Math.round(writingTotalScore / writingQuestionCount) : null;
    const finalSpeakingScore =
      speakingQuestionCount > 0 ? Math.round(speakingTotalScore / speakingQuestionCount) : null;

    let finalTotalScore = 0;
    let overallCefr = 'B1';

    if (submission.exam.skill === ExamSkill.FULL_TEST) {
      const rScore = submission.reading_score ?? 0;
      const lScore = submission.listening_score ?? 0;
      const wScore = finalWritingScore ?? 0;
      const sScore = finalSpeakingScore ?? 0;
      const gScore = submission.grammar_score ?? 0;

      // Chuẩn Thang 200 điểm Aptis ESOL British Council (4 kỹ năng x 50)
      finalTotalScore = rScore + lScore + wScore + sScore;

      // Quy tắc CEFR Profile chuẩn
      if (finalTotalScore >= 160) {
        overallCefr = 'C';
      } else if (finalTotalScore >= 120) {
        overallCefr = 'B2';
      } else if (finalTotalScore >= 80) {
        overallCefr = 'B1';
      } else if (finalTotalScore >= 50) {
        overallCefr = 'A2';
      } else {
        overallCefr = 'A1';
      }

      // Borderline adjustment: Nếu điểm giáp ranh mà Grammar & Vocab >= 38 thì nâng bậc CEFR
      if (finalTotalScore >= 115 && finalTotalScore < 120 && gScore >= 38) {
        overallCefr = 'B2';
      } else if (finalTotalScore >= 155 && finalTotalScore < 160 && gScore >= 42) {
        overallCefr = 'C';
      }
    } else if (submission.exam.skill === ExamSkill.WRITING) {
      finalTotalScore = finalWritingScore ?? 0;
      overallCefr = scoreToCefr(finalTotalScore);
    } else if (submission.exam.skill === ExamSkill.SPEAKING) {
      finalTotalScore = finalSpeakingScore ?? 0;
      overallCefr = scoreToCefr(finalTotalScore);
    } else {
      finalTotalScore =
        subjectiveQuestionCount > 0
          ? Math.round((writingTotalScore + speakingTotalScore) / subjectiveQuestionCount)
          : submission.total_score || 0;
      overallCefr = scoreToCefr(finalTotalScore);
    }

    await prisma.examSubmission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.GRADED,
        total_score: finalTotalScore,
        cefr_level: overallCefr,
        ...(finalWritingScore !== null && { writing_score: finalWritingScore }),
        ...(finalSpeakingScore !== null && { speaking_score: finalSpeakingScore }),
      },
    });

    // Trừ 1 lượt chấm AI khỏi tài khoản của học viên
    if (activeSubId) {
      await prisma.userSubscription.update({
        where: { id: activeSubId },
        data: {
          ai_quota_left: { decrement: 1 },
        },
      });
    }

    return {
      submissionId,
      overallScore: finalTotalScore,
      cefrLevel: overallCefr,
      evaluatedQuestionsCount: aiResults.length,
      aiResults,
      quotaDeducted: !!activeSubId,
    };
  }

  async getAiFeedback(submissionId: string, userId?: string, userRole?: string) {
    const submission = await prisma.examSubmission.findUnique({
      where: { id: submissionId },
      select: { user_id: true },
    });

    if (!submission) {
      throw { statusCode: 404, message: 'Bài nộp không tồn tại' };
    }

    if (userId && submission.user_id !== userId && userRole !== 'ADMIN' && userRole !== 'TEACHER') {
      throw { statusCode: 403, message: 'Bạn không có quyền xem nhận xét bài làm của học viên khác' };
    }

    return prisma.aiGradingResult.findMany({
      where: { submission_id: submissionId },
      include: { question: true },
    });
  }
}

export const aiGradingService = new AiGradingService();
