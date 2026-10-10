import { ExamSkill, QuestionType } from '@prisma/client';
import { IngestedExam, IngestedPart, IngestedQuestion } from '../ingestion.types';
import { docxExtractor } from '../docx-extractor';

export class ReadingParser {
  /**
   * Phân tích một file docx Part 1 thành danh sách các bộ đề mini hoặc đề tổng hợp
   */
  public parsePart1Docx(docxPath: string): IngestedPart[] {
    const extracted = docxExtractor.extract(docxPath, 'reading');
    const parts: IngestedPart[] = [];
    let currentPartQuestions: IngestedQuestion[] = [];
    let currentStory = '';
    let currentTitle = 'Reading Part 1: Gap Fill';
    let currentWords: string[] = [];

    let partIdx = 1;

    for (let i = 0; i < extracted.paragraphs.length; i++) {
      const p = extracted.paragraphs[i];

      // Nhận diện tiêu đề đề thi: "ĐỀ 1: window - buy - market..."
      if (/^đề\s*\d+/i.test(p)) {
        if (currentPartQuestions.length > 0) {
          parts.push({
            partNumber: 1,
            title: currentTitle,
            instructions: 'Choose one word from the list for each gap. The first one is done for you.',
            passageText: currentStory || undefined,
            questions: [...currentPartQuestions],
          });
          currentPartQuestions = [];
          currentWords = [];
          currentStory = '';
        }

        currentTitle = `Part 1 – ${p.trim()}`;
        const matchWords = p.match(/:\s*(.*)/);
        if (matchWords) {
          currentWords = matchWords[1].split(/[-–,]/).map((w) => w.trim()).filter((w) => w.length > 0);
        }
      } else if (currentWords.length > 0 && currentPartQuestions.length < 5) {
        // Tự động phân tách các câu hoặc từ khóa thành 5 câu hỏi Gap Fill
        if (currentPartQuestions.length < currentWords.length) {
          const word = currentWords[currentPartQuestions.length];
          currentPartQuestions.push({
            questionNumber: currentPartQuestions.length + 1,
            questionType: QuestionType.GAP_FILL,
            prompt: `Choose the correct word to fill in the blank (${currentPartQuestions.length + 1}):`,
            options: [word, 'other', 'another'],
            correctAnswer: word,
            explanation: `Từ khóa đúng là: "${word}"`,
            maxScore: 2.0,
          });
        }
      } else if (p.length > 20 && !currentStory) {
        currentStory = p;
      }
    }

    if (currentPartQuestions.length > 0) {
      parts.push({
        partNumber: 1,
        title: currentTitle,
        instructions: 'Choose one word from the list for each gap.',
        passageText: currentStory || undefined,
        questions: currentPartQuestions,
      });
    }

    return parts;
  }

  /**
   * Phân tích một file docx Part 2 (Sắp xếp trật tự câu)
   */
  public parsePart2Docx(docxPath: string): IngestedPart[] {
    const extracted = docxExtractor.extract(docxPath, 'reading');
    const parts: IngestedPart[] = [];
    let currentSentences: string[] = [];
    let currentTitle = 'Part 2: Text Cohesion';

    for (let i = 0; i < extracted.paragraphs.length; i++) {
      const p = extracted.paragraphs[i];

      // Tiêu đề dạng: "2 Family sport day..." hoặc "3 Preparing to Write..."
      if (/^\d+[\.\s]+[a-zA-Z]/i.test(p) && p.length < 70) {
        if (currentSentences.length >= 3) {
          parts.push(this.buildPart2(currentTitle, currentSentences, parts.length + 1));
          currentSentences = [];
        }
        currentTitle = `Part 2 – ${p.trim()}`;
      } else if (p.length > 15 && !p.toLowerCase().includes('đáp án') && !p.toLowerCase().includes('dịch nghĩa')) {
        currentSentences.push(p);
      }
    }

    if (currentSentences.length >= 3) {
      parts.push(this.buildPart2(currentTitle, currentSentences, parts.length + 1));
    }

    return parts;
  }

  private buildPart2(title: string, sentences: string[], partNum: number): IngestedPart {
    const cleanSentences = sentences.slice(0, 6);
    return {
      partNumber: 2,
      title,
      instructions: 'The sentences below have been mixed up. Order the sentences to make a coherent story.',
      questions: [
        {
          questionNumber: 1,
          questionType: QuestionType.SENTENCE_ORDER,
          prompt: 'Drag and drop or sort the sentences into the correct logical order:',
          options: cleanSentences,
          correctAnswer: cleanSentences.map((_, idx) => String(idx + 1)).join(','),
          explanation: 'Trật tự thời gian và liên từ logic chuẩn của câu chuyện.',
          maxScore: 6.0,
        },
      ],
    };
  }

  /**
   * Tạo 1 Exam Reading chuẩn Aptis ESOL 35 phút hoàn chỉnh từ các Part
   */
  public assembleReadingExam(title: string, parts: IngestedPart[]): IngestedExam {
    return {
      title,
      description: 'Bài thi thử Reading hoàn chỉnh chuẩn cấu trúc Aptis ESOL (35 phút).',
      skill: ExamSkill.READING,
      durationMinutes: 35,
      isPro: false,
      hotLevel: 2,
      forecastTag: 'Đề tủ Aptis Reading',
      source: 'WEB',
      parts,
    };
  }
}

export const readingParser = new ReadingParser();
