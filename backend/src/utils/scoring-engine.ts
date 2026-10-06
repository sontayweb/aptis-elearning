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
  maxScore: number = 1,
  options?: any
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

  let isCorrect = cleanUser.toUpperCase() === cleanCorrect.toUpperCase();

  // Chuẩn hóa tiền tố Person (VD: "Person A" vs "A")
  if (!isCorrect) {
    const normPerson = (s: string) => s.trim().toUpperCase().replace(/^PERSON\s+/, "");
    if (normPerson(cleanUser) === normPerson(cleanCorrect)) {
      isCorrect = true;
    }
  }

  // Hỗ trợ trường hợp 1 bên lưu ký tự A/B/C/D và bên kia dùng chuỗi text phương án
  if (!isCorrect && options) {
    let optsArray: string[] = [];
    if (Array.isArray(options)) {
      optsArray = options.map(String);
    } else if (typeof options === 'string') {
      try {
        const p = JSON.parse(options);
        if (Array.isArray(p)) optsArray = p.map(String);
      } catch {}
    }

    if (optsArray.length > 0) {
      if (/^[A-D]$/i.test(cleanUser)) {
        const uIdx = cleanUser.toUpperCase().charCodeAt(0) - 65;
        if (optsArray[uIdx] && optsArray[uIdx].trim().toUpperCase() === cleanCorrect.toUpperCase()) {
          isCorrect = true;
        }
      }
      if (/^[A-D]$/i.test(cleanCorrect)) {
        const cIdx = cleanCorrect.toUpperCase().charCodeAt(0) - 65;
        if (optsArray[cIdx] && optsArray[cIdx].trim().toUpperCase() === cleanUser.toUpperCase()) {
          isCorrect = true;
        }
      }
    }
  }

  return {
    score: isCorrect ? maxScore : 0,
    isCorrect,
  };
}
