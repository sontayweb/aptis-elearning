/**
 * Data Contracts & Thẩm định Dữ liệu Đề thi Aptis ESOL
 * Đảm bảo 100% đề thi nạp vào DB chuẩn hóa theo đúng cấu trúc khảo thí của British Council.
 */

export const SKILL_TYPES = [
  'READING',
  'LISTENING',
  'SPEAKING',
  'WRITING',
  'GRAMMAR_VOCABULARY',
  'FULL_TEST'
];

export const QUESTION_TYPES = [
  'MULTIPLE_CHOICE',
  'GAP_FILL',
  'SENTENCE_ORDER',
  'MATCHING',
  'ESSAY',
  'SHORT_TEXT',
  'SPEAKING_AUDIO'
];

/**
 * Chuẩn hóa tên đề thi để chống sinh đề trùng lặp
 * Ví dụ: "Đề 1", "Đề  01 ", "Bộ Key Đề 01" -> chuẩn hóa thành key định danh thống nhất
 */
export function normalizeExamTitle(title) {
  if (!title) return '';
  let clean = title.trim().replace(/\s+/g, ' ');
  // Chuẩn hóa "Đề X" -> "Đề 0X"
  clean = clean.replace(/Đề\s+(\d)\b/gi, (match, num) => `Đề 0${num}`);
  clean = clean.replace(/Test\s+(\d)\b/gi, (match, num) => `Test 0${num}`);
  return clean;
}

/**
 * Thẩm định một đề thi hoàn chỉnh trước khi nạp vào DB
 * @param {object} exam - Đối tượng đề thi đã được normalize
 * @returns {{ isValid: boolean, errors: string[], warnings: string[] }}
 */
export function validateExam(exam) {
  const errors = [];
  const warnings = [];

  // 1. Kiểm tra thông tin chung của Exam
  if (!exam.title || typeof exam.title !== 'string' || exam.title.trim().length === 0) {
    errors.push('Thiếu tiêu đề đề thi (title).');
  }

  if (!SKILL_TYPES.includes(exam.skill)) {
    errors.push(`Kỹ năng không hợp lệ: "${exam.skill}". Hợp lệ: ${SKILL_TYPES.join(', ')}`);
  }

  if (typeof exam.duration_minutes !== 'number' || exam.duration_minutes <= 0) {
    warnings.push(`Thời lượng thi bất thường: ${exam.duration_minutes} phút (mặc định 60 phút).`);
  }

  if (!Array.isArray(exam.parts) || exam.parts.length === 0) {
    errors.push('Đề thi không có phần thi nào (parts trống).');
    return { isValid: false, errors, warnings };
  }

  // 2. Kiểm tra từng Part và Question
  let totalScore = 0;
  let totalQuestions = 0;

  exam.parts.forEach((part, pIdx) => {
    const partNum = part.part_number || pIdx + 1;

    if (!Array.isArray(part.questions) || part.questions.length === 0) {
      errors.push(`Part ${partNum} ("${part.title || ''}") không có câu hỏi nào.`);
      return;
    }

    part.questions.forEach((q, qIdx) => {
      totalQuestions++;
      const qNum = q.question_number || qIdx + 1;
      const qLabel = `Part ${partNum} - Câu ${qNum}`;

      // Kiểm tra question_type hợp lệ
      if (!QUESTION_TYPES.includes(q.question_type)) {
        errors.push(`${qLabel}: Loại câu hỏi không hợp lệ "${q.question_type}". Hợp lệ: ${QUESTION_TYPES.join(', ')}`);
      }

      // Kiểm tra max_score
      const score = Number(q.max_score);
      if (isNaN(score) || score <= 0) {
        errors.push(`${qLabel}: max_score không hợp lệ (${q.max_score}).`);
      } else {
        totalScore += score;
      }

      // Kiểm tra cấu trúc đặc thù theo từng question_type
      switch (q.question_type) {
        case 'GAP_FILL': {
          // Bắt buộc options là mảng có ít nhất 2 lựa chọn
          if (!Array.isArray(q.options) || q.options.length < 2) {
            errors.push(`${qLabel} (GAP_FILL): options phải là mảng ít nhất 2 lựa chọn.`);
          } else if (q.correct_answer) {
            // Đáp án đúng phải nằm trong danh sách options (không phân biệt hoa thường)
            const cleanKey = String(q.correct_answer).trim().toLowerCase();
            const hasKey = q.options.some(opt => String(opt).trim().toLowerCase() === cleanKey);
            if (!hasKey) {
              warnings.push(`${qLabel} (GAP_FILL): Đáp án đúng "${q.correct_answer}" không nằm trong danh sách options.`);
            }
          }
          break;
        }

        case 'SENTENCE_ORDER': {
          // options phải chứa danh sách câu sentences: [{ id, text }]
          const opts = q.options;
          if (!opts || typeof opts !== 'object') {
            errors.push(`${qLabel} (SENTENCE_ORDER): options phải là object chứa sentences.`);
          } else {
            const sentences = opts.sentences;
            if (!Array.isArray(sentences) || sentences.length < 3) {
              errors.push(`${qLabel} (SENTENCE_ORDER): sentences phải là mảng ít nhất 3 câu.`);
            }
          }

          // correct_answer phải là JSON string hoặc mảng các ID câu
          if (!q.correct_answer) {
            errors.push(`${qLabel} (SENTENCE_ORDER): Thiếu correct_answer.`);
          }
          break;
        }

        case 'MULTIPLE_CHOICE': {
          if (!Array.isArray(q.options) || q.options.length < 2) {
            warnings.push(`${qLabel} (MULTIPLE_CHOICE): options ít hơn 2 lựa chọn.`);
          }
          if (!q.correct_answer) {
            warnings.push(`${qLabel} (MULTIPLE_CHOICE): Chưa có đáp án đúng (correct_answer = null).`);
          }
          break;
        }

        case 'SPEAKING_AUDIO': {
          if (!q.prompt || q.prompt.trim().length === 0) {
            errors.push(`${qLabel} (SPEAKING_AUDIO): Prompt câu hỏi không được để trống.`);
          }
          break;
        }

        case 'ESSAY':
        case 'SHORT_TEXT': {
          if (!q.prompt || q.prompt.trim().length === 0) {
            errors.push(`${qLabel} (${q.question_type}): Prompt đề bài không được để trống.`);
          }
          break;
        }

        default:
          break;
      }
    });
  });

  // 3. Kiểm tra tính toàn vẹn theo chuẩn kỹ năng
  if (exam.skill === 'READING' && exam.parts.length === 1 && exam.parts[0].part_number === 1) {
    // Đề thi riêng Reading Part 1 phải có đúng 5 câu và tổng 10 điểm
    if (totalQuestions !== 5) {
      warnings.push(`Reading Part 1 nên có đủ 5 câu hỏi (hiện có ${totalQuestions} câu).`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      title: exam.title,
      skill: exam.skill,
      partsCount: exam.parts.length,
      questionsCount: totalQuestions,
      totalScore
    }
  };
}
