import { QuestionType } from '@prisma/client';

export interface ObjectiveGradeResult {
  score: number;
  isCorrect: boolean;
}

/**
 * Chấm điểm câu hỏi khách quan (Pure Function - không phụ thuộc Database)
 * Hỗ trợ các dạng: MULTIPLE_CHOICE, GAP_FILL, MATCHING, SENTENCE_ORDER
 * 
 * @param type Loại câu hỏi (QuestionType)
 * @param correctAnswer Đáp án đúng trong đề (chuỗi hoặc JSON mảng cho Sentence Order)
 * @param userAnswer Câu trả lời của học viên
 * @param maxScore Điểm tối đa của câu hỏi (mặc định 1)
 */
export function gradeObjectiveQuestion(
  type: QuestionType,
  correctAnswer: string | null | undefined,
  userAnswer: string | null | undefined,
  maxScore: number = 1
): ObjectiveGradeResult {
  if (!correctAnswer || !userAnswer) {
    return { score: 0, isCorrect: false };
  }

  const cleanCorrect = correctAnswer.trim();
  const cleanUser = userAnswer.trim();

  // 1. Dạng Sắp Xếp Câu (SENTENCE_ORDER)
  if (type === QuestionType.SENTENCE_ORDER) {
    try {
      const userArr = JSON.parse(cleanUser);
      const correctArr = JSON.parse(cleanCorrect);

      if (Array.isArray(userArr) && Array.isArray(correctArr)) {
        if (correctArr.length === 0) {
          return { score: 0, isCorrect: false };
        }

        let matched = 0;
        for (let i = 0; i < correctArr.length; i++) {
          if (userArr[i] === correctArr[i]) {
            matched++;
          }
        }

        const score = (matched / correctArr.length) * maxScore;
        const isCorrect = matched === correctArr.length;
        return {
          score: Math.round(score * 100) / 100,
          isCorrect,
        };
      }
    } catch {
      // Fallback nếu câu trả lời không phải chuỗi JSON
      const isCorrect = cleanUser.toUpperCase() === cleanCorrect.toUpperCase();
      return {
        score: isCorrect ? maxScore : 0,
        isCorrect,
      };
    }
  }

  // 2. Dạng Trắc Nghiệm, Điền Từ, Nối Ý (MULTIPLE_CHOICE, GAP_FILL, MATCHING)
  const isCorrect = cleanUser.toUpperCase() === cleanCorrect.toUpperCase();
  return {
    score: isCorrect ? maxScore : 0,
    isCorrect,
  };
}
