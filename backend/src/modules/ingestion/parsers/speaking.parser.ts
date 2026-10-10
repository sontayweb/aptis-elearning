import { ExamSkill, QuestionType } from '@prisma/client';
import { IngestedExam, IngestedPart, IngestedQuestion } from '../ingestion.types';
import { docxExtractor } from '../docx-extractor';

export class SpeakingParser {
  /**
   * Phân tích file tranh Part 2 và tạo danh sách các Part 2 có gắn hình ảnh thật
   */
  public parseSpeakingPart2Docx(docxPath: string): IngestedPart[] {
    const extracted = docxExtractor.extract(docxPath, 'speaking');
    const parts: IngestedPart[] = [];

    // Duyệt qua từng ảnh trích xuất được từ docx
    for (let i = 0; i < extracted.mediaFiles.length; i++) {
      const media = extracted.mediaFiles[i];
      const partIdx = i + 1;
      const title = `Speaking Part 2 – Tranh thi thật ${partIdx}`;

      parts.push({
        partNumber: 2,
        title,
        instructions: 'In this part, you will see a picture. You will have 45 seconds to answer each question.',
        imageUrl: media.publicUrl,
        questions: [
          {
            questionNumber: 1,
            questionType: QuestionType.SPEAKING_AUDIO,
            prompt: 'Describe what you see in the picture.',
            explanation: 'Miêu tả tổng quan: Ai? Ở đâu? Đang làm gì? Cảm xúc và không gian xung quanh.',
            maxScore: 5.0,
          },
          {
            questionNumber: 2,
            questionType: QuestionType.SPEAKING_AUDIO,
            prompt: 'Tell me about a similar experience you have had in your life.',
            explanation: 'Nói về trải nghiệm cá nhân liên quan đến bối cảnh bức tranh.',
            maxScore: 5.0,
          },
          {
            questionNumber: 3,
            questionType: QuestionType.SPEAKING_AUDIO,
            prompt: 'Why do you think this activity is important to many people?',
            explanation: 'Đánh giá quan điểm và lợi ích xã hội.',
            maxScore: 5.0,
          },
        ],
      });
    }

    return parts;
  }

  /**
   * Phân tích file tranh Part 3 (so sánh 2 ảnh)
   */
  public parseSpeakingPart3Docx(docxPath: string): IngestedPart[] {
    const extracted = docxExtractor.extract(docxPath, 'speaking');
    const parts: IngestedPart[] = [];

    for (let i = 0; i < extracted.mediaFiles.length; i++) {
      const media = extracted.mediaFiles[i];
      const partIdx = i + 1;

      parts.push({
        partNumber: 3,
        title: `Speaking Part 3 – Cặp tranh đối lập ${partIdx}`,
        instructions: 'Compare the two pictures and answer three related questions (45 seconds each).',
        imageUrl: media.publicUrl,
        questions: [
          {
            questionNumber: 1,
            questionType: QuestionType.SPEAKING_AUDIO,
            prompt: 'Tell me what you see in the two pictures and contrast them.',
            explanation: 'Cấu trúc: Both pictures show... In the first picture... Whereas in the second picture...',
            maxScore: 5.0,
          },
          {
            questionNumber: 2,
            questionType: QuestionType.SPEAKING_AUDIO,
            prompt: 'Which of the two options would you prefer and why?',
            explanation: 'Lựa chọn cá nhân: I would definitely prefer... First of all... Secondly...',
            maxScore: 5.0,
          },
          {
            questionNumber: 3,
            questionType: QuestionType.SPEAKING_AUDIO,
            prompt: 'In your opinion, how might this situation change in the future?',
            explanation: 'Bình luận xu hướng xã hội trong tương lai.',
            maxScore: 5.0,
          },
        ],
      });
    }

    return parts;
  }

  /**
   * Tạo Part 1 Speaking mẫu từ ngân hàng câu hỏi cá nhân
   */
  public buildSpeakingPart1(topicName = 'Personal Information'): IngestedPart {
    return {
      partNumber: 1,
      title: `Speaking Part 1 – ${topicName}`,
      instructions: 'Please answer three questions about yourself. You have 30 seconds for each question.',
      questions: [
        {
          questionNumber: 1,
          questionType: QuestionType.SPEAKING_AUDIO,
          prompt: 'Please introduce yourself and tell me where you come from.',
          explanation: 'Trả lời trực tiếp 2-3 câu rõ ràng, tự nhiên.',
          maxScore: 4.0,
        },
        {
          questionNumber: 2,
          questionType: QuestionType.SPEAKING_AUDIO,
          prompt: 'What do you like doing in your free time?',
          explanation: 'Nêu sở thích kèm lý do giúp thư giãn hoặc học hỏi.',
          maxScore: 4.0,
        },
        {
          questionNumber: 3,
          questionType: QuestionType.SPEAKING_AUDIO,
          prompt: 'Tell me about your favorite movie or book.',
          explanation: 'Nêu tên tác phẩm, nội dung chính và bài học rút ra.',
          maxScore: 4.0,
        },
      ],
    };
  }

  /**
   * Tạo Part 4 Speaking mẫu (1 trong 6 cụm chủ đề trọng điểm)
   */
  public buildSpeakingPart4(clusterName: string, prompt1: string, prompt2: string, prompt3: string): IngestedPart {
    return {
      partNumber: 4,
      title: `Speaking Part 4 – ${clusterName}`,
      instructions: 'You will have 1 minute to prepare your notes and 2 minutes to talk about three related questions.',
      questions: [
        {
          questionNumber: 1,
          questionType: QuestionType.SPEAKING_AUDIO,
          prompt: prompt1,
          explanation: 'Kể lại một trải nghiệm hoặc kỷ niệm thực tế.',
          maxScore: 6.0,
        },
        {
          questionNumber: 2,
          questionType: QuestionType.SPEAKING_AUDIO,
          prompt: prompt2,
          explanation: 'Nêu cảm xúc và suy nghĩ của bản thân về sự kiện đó.',
          maxScore: 6.0,
        },
        {
          questionNumber: 3,
          questionType: QuestionType.SPEAKING_AUDIO,
          prompt: prompt3,
          explanation: 'Đánh giá tầm quan trọng rộng hơn đối với cuộc sống/xã hội.',
          maxScore: 6.0,
        },
      ],
    };
  }

  /**
   * Ghép thành một đề thi thử Speaking hoàn chỉnh chuẩn 12 phút
   */
  public assembleSpeakingExam(title: string, parts: IngestedPart[]): IngestedExam {
    return {
      title,
      description: 'Bài thi thử kỹ năng Speaking chuẩn Aptis ESOL (12 phút, 4 Parts).',
      skill: ExamSkill.SPEAKING,
      durationMinutes: 12,
      isPro: false,
      hotLevel: 3,
      forecastTag: 'Đề tủ Speaking trúng 100%',
      source: 'WEB',
      parts,
    };
  }
}

export const speakingParser = new SpeakingParser();
