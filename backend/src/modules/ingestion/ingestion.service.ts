import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/database';
import { IngestedExam, IngestionResult } from './ingestion.types';
import { readingParser } from './parsers/reading.parser';
import { speakingParser } from './parsers/speaking.parser';
import { listeningParser, RawListeningScriptItem } from './parsers/listening.parser';
import { writingParser } from './parsers/writing.parser';
import { fullTestBuilder } from './parsers/fulltest.builder';
import { ExamSkill, QuestionType } from '@prisma/client';

export class IngestionService {
  /**
   * Lưu trữ một IngestedExam vào PostgreSQL qua Prisma Transaction
   */
  public async ingestExam(data: IngestedExam, creatorId?: string): Promise<any> {
    return prisma.$transaction(async (tx) => {
      // 1. Tạo Exam
      const exam = await tx.exam.create({
        data: {
          title: data.title,
          description: data.description || null,
          skill: data.skill,
          duration_minutes: data.durationMinutes,
          is_pro: data.isPro ?? false,
          is_published: data.isPublished ?? false, // Mặc định false: Tự động đưa vào HÀNG CHỜ DUYỆT (Draft / Chưa công khai)
          hot_level: data.hotLevel ?? 0,
          forecast_tag: data.forecastTag || null,
          source: data.source || 'DOCX_UPLOAD',
          creator_id: creatorId || null,
        },
      });

      // 2. Tạo ExamParts và Questions
      for (const p of data.parts) {
        const createdPart = await tx.examPart.create({
          data: {
            exam_id: exam.id,
            part_number: p.partNumber,
            title: p.title,
            instructions: p.instructions || null,
            passage_text: p.passageText || null,
            audio_url: p.audioUrl || null,
            image_url: p.imageUrl || null,
          },
        });

        if (p.questions && p.questions.length > 0) {
          await tx.question.createMany({
            data: p.questions.map((q) => ({
              part_id: createdPart.id,
              question_number: q.questionNumber,
              question_type: q.questionType,
              prompt: q.prompt,
              options: q.options ? (q.options as any) : undefined,
              correct_answer: q.correctAnswer || null,
              explanation: q.explanation || null,
              max_score: q.maxScore ?? 1.0,
            })),
          });
        }
      }

      return exam;
    });
  }

  /**
   * Bóc tách và nạp hàng loạt từ thư mục READING
   */
  public async ingestReadingDirectory(dirPath: string): Promise<IngestionResult[]> {
    const results: IngestionResult[] = [];
    if (!fs.existsSync(dirPath)) return results;

    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.docx'));

    for (const f of files) {
      const fullPath = path.join(dirPath, f);
      const lower = f.toLowerCase();

      if (lower.includes('part 1')) {
        const p1Parts = readingParser.parsePart1Docx(fullPath);
        // Tạo đề thi thử Part 1
        if (p1Parts.length > 0) {
          const examData = readingParser.assembleReadingExam(
            'Đề Thi Thử Reading – Bộ Đề Tủ Part 1 (Gap Fill)',
            p1Parts.slice(0, 5) // Lấy 5 bài Part 1
          );
          const saved = await this.ingestExam(examData);
          results.push({
            examId: saved.id,
            title: saved.title,
            skill: saved.skill,
            totalParts: examData.parts.length,
            totalQuestions: examData.parts.reduce((sum, p) => sum + p.questions.length, 0),
            mediaExtracted: { images: [], audioFiles: [] },
          });
        }
      } else if (lower.includes('part 2')) {
        const p2Parts = readingParser.parsePart2Docx(fullPath);
        if (p2Parts.length > 0) {
          const examData = readingParser.assembleReadingExam(
            'Đề Thi Thử Reading – Bộ Đề Tủ Part 2 (Text Cohesion)',
            p2Parts.slice(0, 4) // Lấy 4 bài Part 2
          );
          const saved = await this.ingestExam(examData);
          results.push({
            examId: saved.id,
            title: saved.title,
            skill: saved.skill,
            totalParts: examData.parts.length,
            totalQuestions: examData.parts.reduce((sum, p) => sum + p.questions.length, 0),
            mediaExtracted: { images: [], audioFiles: [] },
          });
        }
      }
    }

    return results;
  }

  /**
   * Bóc tách và nạp hàng loạt từ thư mục SPEAKING (kèm trích xuất hình ảnh)
   */
  public async ingestSpeakingDirectory(dirPath: string): Promise<IngestionResult[]> {
    const results: IngestionResult[] = [];
    if (!fs.existsSync(dirPath)) return results;

    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.docx'));

    let p2Parts: any[] = [];
    let p3Parts: any[] = [];

    for (const f of files) {
      const fullPath = path.join(dirPath, f);
      const lower = f.toLowerCase();

      if (lower.includes('tranh') && lower.includes('part 2')) {
        p2Parts = speakingParser.parseSpeakingPart2Docx(fullPath);
      } else if (lower.includes('tranh') && lower.includes('part 3')) {
        p3Parts = speakingParser.parseSpeakingPart3Docx(fullPath);
      }
    }

    // Ghép thành các bộ đề thi thử Speaking hoàn chỉnh
    const p1Part = speakingParser.buildSpeakingPart1('Giới thiệu bản thân & Cuộc sống');
    const p4Part = speakingParser.buildSpeakingPart4(
      'Du lịch & Trải nghiệm thiên nhiên',
      'Describe a memorable trip you took in the countryside.',
      'How did you feel about that travel experience?',
      'Why do you think eco-tourism is becoming more popular today?'
    );

    // Tạo ít nhất 2 đề thi thử Speaking mẫu với các hình ảnh thật vừa bóc tách
    const exam1Parts = [
      p1Part,
      p2Parts[0] || speakingParser.parseSpeakingPart2Docx(path.join(dirPath, files[0]))[0],
      p3Parts[0] || p2Parts[1],
      p4Part,
    ].filter(Boolean);

    const examData1 = speakingParser.assembleSpeakingExam(
      'Đề Thi Thử Speaking 01 – Tranh Thi Thật Chuẩn B2/C1',
      exam1Parts
    );
    const saved1 = await this.ingestExam(examData1);

    results.push({
      examId: saved1.id,
      title: saved1.title,
      skill: saved1.skill,
      totalParts: examData1.parts.length,
      totalQuestions: examData1.parts.reduce((sum, p) => sum + p.questions.length, 0),
      mediaExtracted: {
        images: exam1Parts.map((p) => p.imageUrl).filter(Boolean) as string[],
        audioFiles: [],
      },
    });

    return results;
  }

  /**
   * Nạp đề Listening kèm giọng đọc tự động sinh ("Nó sẽ nói")
   */
  public async ingestListeningSample(title: string): Promise<IngestionResult> {
    const rawListeningParts: RawListeningScriptItem[] = [
      {
        partNumber: 1,
        title: 'Part 1: Word Recognition (Announcement)',
        transcript:
          'Attention all passengers traveling on Flight BA302 to London Heathrow. The departure gate has been moved to Gate 14B. Boarding will commence in approximately fifteen minutes. Please have your boarding passes ready.',
        questions: [
          {
            questionNumber: 1,
            questionType: QuestionType.MULTIPLE_CHOICE,
            prompt: 'Which gate has Flight BA302 been moved to?',
            options: ['Gate 12A', 'Gate 14B', 'Gate 16C'],
            correctAnswer: 'Gate 14B',
            explanation: 'The announcement clearly designates Gate 14B.',
          },
        ],
      },
      {
        partNumber: 2,
        title: 'Part 2: Short Conversation',
        transcript:
          'Man: Excuse me, could you tell me if the modern art exhibition is open today?\nWoman: Yes, it is open until 6 PM, but photography is strictly prohibited inside the main gallery.',
        dialogue: [
          { speaker: 'MAN', text: 'Excuse me, could you tell me if the modern art exhibition is open today?' },
          {
            speaker: 'WOMAN',
            text: 'Yes, it is open until 6 PM, but photography is strictly prohibited inside the main gallery.',
          },
        ],
        questions: [
          {
            questionNumber: 2,
            questionType: QuestionType.MULTIPLE_CHOICE,
            prompt: 'What rule must visitors follow inside the main gallery?',
            options: ['No talking loudly', 'No photography allowed', 'No eating or drinking'],
            correctAnswer: 'No photography allowed',
            explanation: 'The woman states photography is strictly prohibited.',
          },
        ],
      },
    ];

    const listeningExam = await listeningParser.parseAndSynthesizeListeningExam(title, rawListeningParts);
    const saved = await this.ingestExam(listeningExam);

    return {
      examId: saved.id,
      title: saved.title,
      skill: saved.skill,
      totalParts: listeningExam.parts.length,
      totalQuestions: listeningExam.parts.reduce((sum, p) => sum + p.questions.length, 0),
      mediaExtracted: {
        images: [],
        audioFiles: listeningExam.parts.map((p) => p.audioUrl).filter(Boolean) as string[],
      },
    };
  }

  /**
   * Nạp đề Writing
   */
  public async ingestWritingSample(clubTopic = 'Photography Club'): Promise<IngestionResult> {
    const examData = writingParser.buildStandardWritingExam(clubTopic);
    const saved = await this.ingestExam(examData);

    return {
      examId: saved.id,
      title: saved.title,
      skill: saved.skill,
      totalParts: examData.parts.length,
      totalQuestions: examData.parts.reduce((sum, p) => sum + p.questions.length, 0),
      mediaExtracted: { images: [], audioFiles: [] },
    };
  }

  /**
   * Ghép đề Full Test 162 phút từ các phân hệ
   */
  public async assembleAndSaveFullTest(
    title: string,
    components: {
      readingExam?: IngestedExam;
      listeningExam?: IngestedExam;
      writingExam?: IngestedExam;
      speakingExam?: IngestedExam;
    }
  ): Promise<IngestionResult> {
    const fullTestExam = fullTestBuilder.assembleFullTest(title, components);
    const saved = await this.ingestExam(fullTestExam);

    return {
      examId: saved.id,
      title: saved.title,
      skill: saved.skill,
      totalParts: fullTestExam.parts.length,
      totalQuestions: fullTestExam.parts.reduce((sum, p) => sum + p.questions.length, 0),
      mediaExtracted: {
        images: fullTestExam.parts.map((p) => p.imageUrl).filter(Boolean) as string[],
        audioFiles: fullTestExam.parts.map((p) => p.audioUrl).filter(Boolean) as string[],
      },
    };
  }
}

export const ingestionService = new IngestionService();
