import { ExamSkill, QuestionType } from '@prisma/client';
import { IngestedExam, IngestedPart, IngestedQuestion } from '../ingestion.types';

export class WritingParser {
  /**
   * Tạo một đề thi Writing hoàn chỉnh chuẩn 50 phút
   */
  public buildStandardWritingExam(clubTopic: string): IngestedExam {
    const parts: IngestedPart[] = [
      // Part 1: Form Filling (5 câu ngắn)
      {
        partNumber: 1,
        title: `Writing Part 1 – Form filling (${clubTopic})`,
        instructions: 'You want to join a club. Fill in the form with 1 to 5 words for each question.',
        questions: [
          {
            questionNumber: 1,
            questionType: QuestionType.SHORT_TEXT,
            prompt: 'What is your primary occupation?',
            explanation: 'Điền nghề nghiệp ngắn gọn (1-3 từ).',
            maxScore: 1.0,
          },
          {
            questionNumber: 2,
            questionType: QuestionType.SHORT_TEXT,
            prompt: 'Where do you currently reside?',
            explanation: 'Điền tên thành phố/địa điểm sinh sống.',
            maxScore: 1.0,
          },
          {
            questionNumber: 3,
            questionType: QuestionType.SHORT_TEXT,
            prompt: 'What language do you speak at home?',
            explanation: 'Điền ngôn ngữ mẹ đẻ.',
            maxScore: 1.0,
          },
          {
            questionNumber: 4,
            questionType: QuestionType.SHORT_TEXT,
            prompt: 'How did you hear about our club?',
            explanation: 'Ví dụ: Through a friend / On social media.',
            maxScore: 1.0,
          },
          {
            questionNumber: 5,
            questionType: QuestionType.SHORT_TEXT,
            prompt: 'What time is best to contact you?',
            explanation: 'Ví dụ: In the morning / Weekends.',
            maxScore: 1.0,
          },
        ],
      },
      // Part 2: Short text (20 - 30 words)
      {
        partNumber: 2,
        title: `Writing Part 2 – Personal Interest Form`,
        instructions: 'Please write in full sentences (20–30 words). You have 7 minutes.',
        questions: [
          {
            questionNumber: 1,
            questionType: QuestionType.ESSAY,
            prompt: `Please tell us why you are interested in joining our ${clubTopic} and what you hope to achieve here.`,
            explanation: 'Viết đủ câu hoàn chỉnh từ 20 đến 30 từ, ngữ pháp chuẩn xác.',
            maxScore: 5.0,
          },
        ],
      },
      // Part 3: Social Club Interaction (3 câu, 30 - 40 words mỗi câu)
      {
        partNumber: 3,
        title: `Writing Part 3 – Social Club Chat Room`,
        instructions: 'You are in the club chat room. Write responses to 3 club members (30–40 words each).',
        questions: [
          {
            questionNumber: 1,
            questionType: QuestionType.ESSAY,
            prompt: 'Member Sam: Hi! Welcome to the group! How long have you been involved in this hobby?',
            explanation: 'Trả lời thân thiện, mạch lạc trong khoảng 30-40 từ.',
            maxScore: 5.0,
          },
          {
            questionNumber: 2,
            questionType: QuestionType.ESSAY,
            prompt: 'Member Linda: Do you prefer practicing this activity alone or with friends? Why?',
            explanation: 'Đưa ra quan điểm cá nhân kèm lý do so sánh.',
            maxScore: 5.0,
          },
          {
            questionNumber: 3,
            questionType: QuestionType.ESSAY,
            prompt: 'Member Alex: We are organizing a workshop next month. What specific topic would you like us to cover?',
            explanation: 'Đề xuất chủ đề cụ thể và giải thích lợi ích cho câu lạc bộ.',
            maxScore: 5.0,
          },
        ],
      },
      // Part 4: Email Writing (1 informal ~50 words + 1 formal ~120-150 words)
      {
        partNumber: 4,
        title: `Writing Part 4 – Email Writing`,
        instructions: 'You received an urgent notice from the club. Write an email to a friend (50 words) and an email to the club president (120–150 words).',
        passageText: `Dear Members,\nDue to unexpected maintenance work, our club headquarters will be closed for the next two months, and the annual outdoor gala will be canceled.\nClub Management`,
        questions: [
          {
            questionNumber: 1,
            questionType: QuestionType.ESSAY,
            prompt: 'Write an email to your friend who is also a club member. Express your feelings and suggest an alternative plan (about 50 words).',
            explanation: 'Văn phong thân mật (Informal), thể hiện cảm xúc tiếc nuối và rủ bạn đi chơi riêng.',
            maxScore: 7.0,
          },
          {
            questionNumber: 2,
            questionType: QuestionType.ESSAY,
            prompt: 'Write an email to the Club President. Express your disappointment, explain why the cancellation affects members, and propose constructive solutions (120–150 words).',
            explanation: 'Văn phong trang trọng (Formal), mở đầu và kết thúc chuẩn mực, lập luận rõ ràng.',
            maxScore: 13.0,
          },
        ],
      },
    ];

    return {
      title: `Đề thi thử Aptis Writing – Club: ${clubTopic}`,
      description: 'Bài thi thử kỹ năng Writing chuẩn Aptis ESOL (50 phút, 4 Parts).',
      skill: ExamSkill.WRITING,
      durationMinutes: 50,
      isPro: false,
      hotLevel: 2,
      forecastTag: 'Đề tủ Writing chuẩn format',
      source: 'WEB',
      parts,
    };
  }
}

export const writingParser = new WritingParser();
