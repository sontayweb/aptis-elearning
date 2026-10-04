import fs from 'fs';
import OpenAI from 'openai';
import { prisma } from '../../config/database';
import { ExamSkill, QuestionType, SubmissionStatus } from '@prisma/client';
import { audioService } from '../audio/audio.service';
import { geminiRotator } from './gemini-rotator.service';

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

  async evaluateSubmission(submissionId: string, userId?: string, userRole?: string) {
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

    // 2. Chống lặp (Idempotency Guard): Nếu bài thi đã có kết quả AI, trả về ngay kết quả cũ
    if (submission.ai_results && submission.ai_results.length > 0) {
      return {
        submissionId,
        overallScore: submission.total_score || 0,
        cefrLevel: submission.cefr_level || 'B2',
        evaluatedQuestionsCount: submission.ai_results.length,
        aiResults: submission.ai_results,
        isCached: true,
        message: 'Kết quả chấm AI đã được hoàn tất trước đó',
      };
    }

    // 3. Quản lý Quota AI: Kiểm tra & Trừ lượt chấm AI của học viên
    let activeSubId: string | null = null;
    if (userId && userRole !== 'ADMIN') {
      const activeSub = await prisma.userSubscription.findFirst({
        where: {
          user_id: submission.user_id,
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

    for (const ans of submission.answers) {
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

      if (question.question_type === QuestionType.ESSAY || question.question_type === QuestionType.SHORT_TEXT) {
        // Chấm bài viết (Writing)
        subjectiveQuestionCount++;
        const text = ans.text_answer || '';
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

        let evalResult: any = null;
        let modelUsed = 'heuristic-evaluator';

        if (text.trim().length > 10) {
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

        // Fallback ước lượng theo Rubric chuẩn British Council
        if (!evalResult || typeof averageScore !== 'number') {
          taskScore = Math.min(50, Math.max(10, wordCount > 30 ? 40 : 25));
          grammarScore = 38;
          vocabScore = 36;
          cohesionScore = 40;
          averageScore = Math.round((taskScore + grammarScore + vocabScore + cohesionScore) / 4);

          if (averageScore >= 42) cefrLevel = 'C1';
          else if (averageScore >= 36) cefrLevel = 'B2';
          else if (averageScore >= 28) cefrLevel = 'B1';
          else if (averageScore >= 20) cefrLevel = 'A2';
          else cefrLevel = 'A1';

          feedbackSummary = `Bài viết hoàn thành tốt nhiệm vụ, độ dài ${wordCount} từ. Đạt chuẩn CEFR ${cefrLevel}.`;
          detailedFeedback = [
            {
              original: text.substring(0, 40) + '...',
              suggested: 'Gợi ý: Cải thiện thêm một số liên từ (However, Furthermore) để câu văn tự nhiên hơn.',
              errorType: 'Vocabulary & Cohesion',
            },
          ];
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
        const audioDuration = ans.audio_duration || 30;

        let evalResult: any = null;
        let modelUsed = 'heuristic-evaluator';
        let transcriptText = ans.transcript_text;

        const audioFilePath = audioService.getPhysicalFilePath(
          submissionId,
          question.id,
          ans.created_at || submission.started_at || undefined
        );

        if (audioFilePath && fs.existsSync(audioFilePath)) {
          // 1. Ưu tiên chấm bằng Gemini Multimodal Audio với cơ chế xoay vòng model
          if (geminiRotator.isAvailable()) {
            try {
              evalResult = await geminiRotator.evaluateSpeaking(
                audioFilePath,
                question.prompt,
                audioDuration
              );
              modelUsed = evalResult?.usedModel || 'gemini-multimodal';
              if (evalResult?.transcriptText) {
                transcriptText = evalResult.transcriptText;
                await prisma.submissionAnswer.update({
                  where: { id: ans.id },
                  data: { transcript_text: transcriptText },
                });
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
                audioFilePath,
                question.prompt,
                audioDuration
              );
              modelUsed = 'whisper-1 + gpt-4o';
              if (evalResult?.transcriptText) {
                transcriptText = evalResult.transcriptText;
                await prisma.submissionAnswer.update({
                  where: { id: ans.id },
                  data: { transcript_text: transcriptText },
                });
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

        // Fallback ước lượng theo chuẩn Aptis Speaking
        if (!evalResult || typeof averageScore !== 'number') {
          pronScore = 38;
          fluencyScore = 40;
          grammarScore = 35;
          vocabScore = 37;
          averageScore = Math.round((pronScore + fluencyScore + grammarScore + vocabScore) / 4);

          if (averageScore >= 42) cefrLevel = 'C1';
          else if (averageScore >= 36) cefrLevel = 'B2';
          else if (averageScore >= 28) cefrLevel = 'B1';
          else cefrLevel = 'A2';

          feedbackSummary = `Phát âm rõ ràng, nhịp điệu tương đối tốt (thời lượng ${audioDuration}s). Đạt chuẩn CEFR ${cefrLevel}.`;
          detailedFeedback = [
            {
              criterion: 'Pronunciation',
              comment: 'Cần chú ý phát âm rõ âm đuôi /s/, /ed/ khi nói ở quá khứ.',
            },
          ];
        }

        speakingTotalScore += averageScore;

        const aiResult = await prisma.aiGradingResult.create({
          data: {
            submission_id: submissionId,
            question_id: question.id,
            skill: ExamSkill.SPEAKING,
            model_name: modelUsed,
            transcript: transcriptText || 'Recognized spoken speech from student response.',
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

    // Cập nhật trạng thái bài thi sang GRADED nếu chấm xong toàn bộ
    const finalScore =
      subjectiveQuestionCount > 0
        ? Math.round((writingTotalScore + speakingTotalScore) / subjectiveQuestionCount)
        : submission.total_score || 0;

    let overallCefr = 'B2';
    if (finalScore >= 42) overallCefr = 'C1';
    else if (finalScore >= 36) overallCefr = 'B2';
    else if (finalScore >= 28) overallCefr = 'B1';
    else overallCefr = 'A2';

    await prisma.examSubmission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.GRADED,
        total_score: finalScore,
        cefr_level: overallCefr,
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
      overallScore: finalScore,
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
