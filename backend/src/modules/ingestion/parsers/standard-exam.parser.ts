import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import * as xlsx from 'xlsx';
import { ExamSkill, QuestionType } from '@prisma/client';
import { prisma } from '../../../config/database';

export interface ValidatedQuestion {
  questionNumber: number;
  prompt: string;
  questionType: QuestionType;
  options?: any;
  correctAnswer?: string;
  explanation?: string;
  maxScore?: number;
}

export interface ValidatedExamItem {
  idTemp: string;
  title: string;
  skill: ExamSkill;
  partNumber: number;
  partTitle?: string;
  topic: string;
  instructions?: string;
  passageText?: string;
  audioUrl?: string;
  imageUrls: string[];
  isPro?: boolean;
  isPublished?: boolean;
  hotLevel?: number;
  vocabulary: { en: string; vi: string }[];
  questions: ValidatedQuestion[];
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function getCanonicalPartTitle(skill: ExamSkill | string, partNumber: number): string {
  const sk = String(skill).toUpperCase();
  if (sk === 'LISTENING') {
    if (partNumber === 1) return 'Part 1 - Information Recognition';
    if (partNumber === 2) return 'Part 2 - Opinion Matching';
    if (partNumber === 3) return 'Part 3 - Opinion Matching';
    return 'Part 4 - Monologue Comprehension';
  }
  if (sk === 'READING') {
    if (partNumber === 1) return 'Part 1 - Gap Fill';
    if (partNumber === 2) return 'Part 2 - Text Cohesion';
    if (partNumber === 3) return 'Part 3 - Opinion Matching';
    return 'Part 4 - Long Text Comprehension';
  }
  if (sk === 'WRITING') {
    if (partNumber === 1) return 'Part 1 - Word-level Writing';
    if (partNumber === 2) return 'Part 2 - Short Text Writing';
    if (partNumber === 3) return 'Part 3 - Three Responses';
    return 'Part 4 - Club Email Writing';
  }
  if (sk === 'SPEAKING') {
    if (partNumber === 1) return 'Part 1 - Personal Information';
    if (partNumber === 2) return 'Part 2 - Describe & Opinion';
    if (partNumber === 3) return 'Part 3 - Compare & Explain';
    return 'Part 4 - Abstract Discussion';
  }
  return `Part ${partNumber}`;
}

export interface StandardValidationResponse {
  fileName: string;
  fileType: 'DOCX' | 'XLSX';
  totalFound: number;
  validCount: number;
  invalidCount: number;
  exams: ValidatedExamItem[];
}

export class StandardExamParser {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
  }

  /**
   * Phân tích và kiểm định file Word (.docx) chuẩn hóa (Speaking / Writing)
   */
  public parseAndValidateDocx(fileBuffer: Buffer, fileName: string): StandardValidationResponse {
    const zip = new AdmZip(fileBuffer);
    const zipEntries = zip.getEntries();

    // 1. Trích xuất toàn bộ media từ thư mục word/media/
    const targetMediaDir = path.join(this.uploadDir, 'exams', 'speaking');
    if (!fs.existsSync(targetMediaDir)) {
      fs.mkdirSync(targetMediaDir, { recursive: true });
    }

    const cleanBaseName = path.basename(fileName, path.extname(fileName)).replace(/[^a-zA-Z0-9_-]/g, '_');
    const mediaMap = new Map<string, string>(); // entryName -> publicUrl
    const mediaFiles: { entryName: string; publicUrl: string }[] = [];

    for (const entry of zipEntries) {
      if (entry.entryName.startsWith('word/media/')) {
        const ext = path.extname(entry.entryName) || '.png';
        const imgName = path.basename(entry.entryName, ext);
        const diskFileName = `${cleanBaseName}_${Date.now()}_${imgName}${ext}`;
        const diskPath = path.join(targetMediaDir, diskFileName);

        fs.writeFileSync(diskPath, entry.getData());
        const publicUrl = `/uploads/exams/speaking/${diskFileName}`;
        mediaMap.set(entry.entryName, publicUrl);
        mediaFiles.push({ entryName: entry.entryName, publicUrl });
      }
    }

    // 2. Đọc nội dung văn bản từ word/document.xml
    const docXmlEntry = zip.getEntry('word/document.xml');
    if (!docXmlEntry) {
      throw new Error('Tập tin Word không hợp lệ (không tìm thấy word/document.xml).');
    }

    const xmlString = docXmlEntry.getData().toString('utf8');

    // Bóc tách toàn bộ đoạn văn và bảng
    // Tách các khối đề thi theo thẻ "=== [ĐỀ MỚI] ===" hoặc "[ĐỀ MỚI]"
    const paragraphs: string[] = [];
    const pRegex = /<w:p\b[^>]*>(.*?)<\/w:p>/gs;
    let pMatch: RegExpExecArray | null;

    while ((pMatch = pRegex.exec(xmlString)) !== null) {
      const pContent = pMatch[1];
      const tRegex = /<w:t\b[^>]*>(.*?)<\/w:t>/gs;
      let tMatch: RegExpExecArray | null;
      let pText = '';

      while ((tMatch = tRegex.exec(pContent)) !== null) {
        pText += tMatch[1];
      }

      const trimmed = pText.trim();
      if (trimmed) {
        paragraphs.push(trimmed);
      }
    }

    // Bóc tách các bảng từ vựng trong XML
    const tablesData: { en: string; vi: string }[][] = [];
    const tblRegex = /<w:tbl\b[^>]*>(.*?)<\/w:tbl>/gs;
    let tblMatch: RegExpExecArray | null;

    while ((tblMatch = tblRegex.exec(xmlString)) !== null) {
      const tblContent = tblMatch[1];
      const trRegex = /<w:tr\b[^>]*>(.*?)<\/w:tr>/gs;
      let trMatch: RegExpExecArray | null;
      const vocabList: { en: string; vi: string }[] = [];

      while ((trMatch = trRegex.exec(tblContent)) !== null) {
        const trContent = trMatch[1];
        const tcRegex = /<w:tc\b[^>]*>(.*?)<\/w:tc>/gs;
        let tcMatch: RegExpExecArray | null;
        const rowCells: string[] = [];

        while ((tcMatch = tcRegex.exec(trContent)) !== null) {
          const tcContent = tcMatch[1];
          const tRegex = /<w:t\b[^>]*>(.*?)<\/w:t>/gs;
          let cellTMatch: RegExpExecArray | null;
          let cellText = '';
          while ((cellTMatch = tRegex.exec(tcContent)) !== null) {
            cellText += cellTMatch[1];
          }
          rowCells.push(cellText.trim());
        }

        if (rowCells.length >= 2) {
          const en = rowCells[0];
          const vi = rowCells[1];
          // Bỏ qua dòng tiêu đề
          if (en.toLowerCase() !== 'english' && vi.toLowerCase() !== 'tiếng việt' && en && vi) {
            vocabList.push({ en, vi });
          }
        }
      }

      if (vocabList.length > 0) {
        tablesData.push(vocabList);
      }
    }

    // 3. Phân tách theo từng khối đề thi
    const rawBlocks: string[][] = [];
    let currentBlock: string[] = [];

    for (const p of paragraphs) {
      if (p.includes('=== [ĐỀ MỚI] ===') || p.includes('[ĐỀ MỚI]') || /^Đề (số|\d+)/i.test(p)) {
        if (currentBlock.length > 0) {
          rawBlocks.push(currentBlock);
        }
        currentBlock = [p];
      } else {
        if (currentBlock.length > 0) {
          currentBlock.push(p);
        }
      }
    }
    if (currentBlock.length > 0) {
      rawBlocks.push(currentBlock);
    }

    // Lọc chỉ giữ các block thực sự là đề thi (có thẻ câu hỏi hoặc có [PHẦN THI])
    const examBlocks = rawBlocks.filter((block) =>
      block.some((line) => line.includes('[PHẦN THI]:') || /\[CÂU HỎI \d+\]:/i.test(line))
    );

    // Nếu không tìm thấy thẻ phân tách "=== [ĐỀ MỚI] ===", tự động chia khối thông minh theo bảng từ vựng
    if (examBlocks.length === 0 && tablesData.length > 0) {
      let mediaIdx = 0;
      for (let i = 0; i < tablesData.length; i++) {
        const fakeBlock: string[] = [
          `[PHẦN THI]: Speaking Part ${tablesData.length > 15 ? 2 : 3}`,
          `[CHỦ ĐỀ]: Đề bóc tách tự động ${i + 1}`,
          `[CÂU HỎI 1]: Describe what you see in the picture.`,
          `[CÂU HỎI 2]: Tell me about a similar experience you had.`,
          `[CÂU HỎI 3]: Why is this important to many people?`,
        ];
        examBlocks.push(fakeBlock);
      }
    }

    const validatedExams: ValidatedExamItem[] = [];
    let mediaFileIndex = 0;

    for (let i = 0; i < examBlocks.length; i++) {
      const block = examBlocks[i];
      const errors: string[] = [];
      const warnings: string[] = [];

      let isWriting = false;
      let partNumber = 2;
      let topic = '';
      let passageText = '';
      const questions: ValidatedQuestion[] = [];
      const sampleMap = new Map<number, string>();

      for (const line of block) {
        if (line.includes('[PHẦN THI]:')) {
          const partStr = line.replace(/.*\[PHẦN THI\]:\s*/i, '').trim();
          if (partStr.toLowerCase().includes('writing') || partStr.toLowerCase().includes('viết')) {
            isWriting = true;
          }
          if (partStr.includes('1')) partNumber = 1;
          else if (partStr.includes('3')) partNumber = 3;
          else if (partStr.includes('4')) partNumber = 4;
          else if (partStr.includes('2')) partNumber = 2;
        } else if (line.includes('[CHỦ ĐỀ]:')) {
          topic = line.replace(/.*\[CHỦ ĐỀ\]:\s*/i, '').trim();
        } else if (line.includes('[NGỮ CẢNH]:') || line.includes('[THÔNG BÁO]:')) {
          passageText = line.replace(/.*\[(NGỮ CẢNH|THÔNG BÁO)\]:\s*/i, '').trim();
        } else if (/\[(ĐÁP ÁN MẪU|BÀI MẪU|SAMPLE|GIẢI THÍCH)\s*(\d+)\]:/i.test(line)) {
          const m = line.match(/\[(ĐÁP ÁN MẪU|BÀI MẪU|SAMPLE|GIẢI THÍCH)\s*(\d+)\]:\s*(.*)/i);
          if (m) {
            sampleMap.set(parseInt(m[2], 10), m[3].trim());
          }
        } else if (/\[CÂU HỎI \d+\]:/i.test(line)) {
          const qText = line.replace(/.*\[CÂU HỎI \d+\]:\s*/i, '').trim();
          questions.push({
            questionNumber: questions.length + 1,
            prompt: qText,
            questionType: isWriting
              ? (partNumber === 1 ? QuestionType.SHORT_TEXT : QuestionType.ESSAY)
              : QuestionType.SPEAKING_AUDIO,
          });
        }
      }

      for (const q of questions) {
        if (sampleMap.has(q.questionNumber) && !q.explanation) {
          q.explanation = sampleMap.get(q.questionNumber);
        }
      }

      if (!topic) {
        topic = `Chủ đề luyện thi ${isWriting ? 'Writing' : 'Speaking'} Part ${partNumber} (Bài ${i + 1})`;
        warnings.push('Chưa có thẻ [CHỦ ĐỀ]: Hệ thống tự gán tên chủ đề mặc định.');
      }

      // Gán bảng từ vựng tương ứng
      const vocab = tablesData[i] || [];
      if (vocab.length === 0) {
        warnings.push('Không tìm thấy bảng [TỪ VỰNG] 2 cột cho đề này.');
      }

      // Gán hình ảnh (Part 1 & 4 không bắt buộc ảnh; Part 2 cần 1 ảnh; Part 3 cần 2 ảnh)
      const imageUrls: string[] = [];
      const requiredImages = isWriting
        ? 0
        : partNumber === 3
        ? 2
        : partNumber === 2
        ? 1
        : 0;

      for (let imgK = 0; imgK < requiredImages; imgK++) {
        if (mediaFileIndex < mediaFiles.length) {
          imageUrls.push(mediaFiles[mediaFileIndex].publicUrl);
          mediaFileIndex++;
        }
      }

      if (imageUrls.length < requiredImages) {
        errors.push(
          `Thiếu hình ảnh: Part ${partNumber} yêu cầu ${requiredImages} ảnh (Hiện chỉ có ${imageUrls.length} ảnh).`
        );
      }

      // Kiểm tra câu hỏi
      if (isWriting) {
        if (questions.length === 0) {
          errors.push('Thiếu thẻ câu hỏi [CÂU HỎI ...].');
        }
      } else {
        if (questions.length < 3) {
          if (questions.length === 0) {
            errors.push('Thiếu các thẻ câu hỏi: Cần có đủ 3 câu [CÂU HỎI 1], [CÂU HỎI 2], [CÂU HỎI 3].');
          } else {
            errors.push(`Chưa đủ 3 câu hỏi (hiện chỉ có ${questions.length} câu).`);
          }
        }
      }

      const isValid = errors.length === 0;
      const skillEnum = isWriting ? ExamSkill.WRITING : ExamSkill.SPEAKING;

      const instructions = isWriting
        ? (partNumber === 1
            ? 'You want to join a club. Fill in the form with 1 to 5 words for each question.'
            : partNumber === 2
            ? 'Please write in full sentences (20–30 words). You have 7 minutes.'
            : partNumber === 3
            ? 'You are in the club chat room. Write responses to 3 club members (30–40 words each).'
            : 'You received an urgent notice from the club. Write an email to a friend (50 words) and an email to the club president (120–150 words).')
        : (partNumber === 1
            ? 'In this part, you are going to answer three personal questions (30 seconds for each response).'
            : partNumber === 2
            ? 'In this part, you will see a picture. Answer 3 questions (45 seconds each).'
            : partNumber === 3
            ? 'Compare the two pictures and answer 3 questions (45 seconds each).'
            : 'Answer three abstract questions together in a 2-minute long turn (1 minute preparation).');

      validatedExams.push({
        idTemp: `temp_docx_${i + 1}_${Date.now()}`,
        title: `${isWriting ? 'Writing' : 'Speaking'} Part ${partNumber} — ${topic}`,
        skill: skillEnum,
        partNumber,
        partTitle: getCanonicalPartTitle(skillEnum, partNumber),
        topic,
        instructions,
        passageText: passageText || undefined,
        imageUrls,
        isPublished: true,
        isPro: false,
        hotLevel: 0,
        vocabulary: vocab,
        questions,
        isValid,
        errors,
        warnings,
      });
    }

    const validCount = validatedExams.filter((e) => e.isValid).length;
    const invalidCount = validatedExams.length - validCount;

    return {
      fileName,
      fileType: 'DOCX',
      totalFound: validatedExams.length,
      validCount,
      invalidCount,
      exams: validatedExams,
    };
  }

  /**
   * Phân tích và kiểm định file Excel (.xlsx) chuẩn hóa (Reading / Listening / Speaking / Writing)
   */
  public parseAndValidateExcel(fileBuffer: Buffer, fileName: string): StandardValidationResponse {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<any>(sheet);

    if (!rows || rows.length === 0) {
      throw new Error('Tập tin Excel trống hoặc không đúng cấu trúc bảng dữ liệu.');
    }

    // Gom nhóm các hàng câu hỏi theo Topic + Skill + Part
    const groupMap = new Map<string, any[]>();

    for (const row of rows) {
      const skill = (row['Skill'] || row['skill'] || 'READING').toString().trim().toUpperCase();
      const part = parseInt(row['Part'] || row['part'] || '1', 10);
      const topic = (row['Topic'] || row['topic'] || 'Chủ đề đề thi').toString().trim();
      const groupKey = `${skill}_P${part}_${topic}`;

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)!.push(row);
    }

    const validatedExams: ValidatedExamItem[] = [];
    let examIdx = 1;

    for (const [, rowList] of groupMap.entries()) {
      const firstRow = rowList[0];
      const skillRaw = (firstRow['Skill'] || firstRow['skill'] || 'READING').toString().toUpperCase().trim();
      const skill: ExamSkill =
        skillRaw === 'LISTENING'
          ? ExamSkill.LISTENING
          : skillRaw === 'WRITING'
          ? ExamSkill.WRITING
          : skillRaw === 'SPEAKING'
          ? ExamSkill.SPEAKING
          : ExamSkill.READING;
      const partNumber = parseInt(firstRow['Part'] || firstRow['part'] || '1', 10);
      const topic = (firstRow['Topic'] || firstRow['topic'] || `Bài thi ${examIdx}`).toString().trim();
      const passageText = (firstRow['Passage_Text'] || firstRow['Passage'] || '').toString().trim();
      const audioUrl = (firstRow['Audio_URL'] || firstRow['Audio'] || '').toString().trim();
      const imageRaw = (firstRow['Image_URL'] || firstRow['Images'] || '').toString().trim();
      const imageUrls = imageRaw ? imageRaw.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      const instructions = (firstRow['Instructions'] || '').toString().trim();

      const errors: string[] = [];
      const warnings: string[] = [];
      const questions: ValidatedQuestion[] = [];

      for (let qIdx = 0; qIdx < rowList.length; qIdx++) {
        const r = rowList[qIdx];
        const prompt = (r['Prompt'] || r['Question'] || '').toString().trim();
        const rawType = (r['Question_Type'] || r['Type'] || '').toString().toUpperCase().trim();

        let qType: QuestionType = QuestionType.MULTIPLE_CHOICE;
        if (rawType && rawType in QuestionType) {
          qType = rawType as QuestionType;
        } else if (skill === ExamSkill.SPEAKING) {
          qType = QuestionType.SPEAKING_AUDIO;
        } else if (skill === ExamSkill.WRITING) {
          qType = partNumber === 1 ? QuestionType.SHORT_TEXT : QuestionType.ESSAY;
        } else if (skill === ExamSkill.READING) {
          if (partNumber === 1) qType = QuestionType.GAP_FILL;
          else if (partNumber === 2) qType = QuestionType.SENTENCE_ORDER;
          else qType = QuestionType.MATCHING;
        } else if (skill === ExamSkill.LISTENING) {
          qType = partNumber === 2 || partNumber === 3 ? QuestionType.MATCHING : QuestionType.MULTIPLE_CHOICE;
        }

        const optsRaw: string[] = [];
        for (const col of ['Option_A', 'Option_B', 'Option_C', 'Option_D', 'Option_E', 'Option_F', 'Option_G', 'Option_H', 'Sentence_1', 'Sentence_2', 'Sentence_3', 'Sentence_4', 'Sentence_5', 'Sentence_6']) {
          if (r[col] !== undefined && r[col] !== null && String(r[col]).trim().length > 0) {
            optsRaw.push(String(r[col]).trim());
          }
        }

        let correct = (r['Correct_Answer'] || r['Answer'] || '').toString().trim();
        const explanation = (r['Explanation'] || r['Sample_Answer'] || '').toString().trim();

        if (!prompt) {
          errors.push(`Hàng ${qIdx + 2}: Thiếu nội dung câu hỏi (Prompt).`);
        }

        if (qType === QuestionType.SENTENCE_ORDER) {
          if (optsRaw.length < 4) {
            errors.push(`Hàng ${qIdx + 2}: Sắp xếp câu (Reading Part 2) cần ít nhất 4–5 câu theo thứ tự đúng trong các cột Option_A..Option_E (hoặc Sentence_1..Sentence_5).`);
          }
          if (!correct && optsRaw.length > 0) {
            correct = JSON.stringify(optsRaw);
          }
        } else if (qType === QuestionType.MULTIPLE_CHOICE || qType === QuestionType.GAP_FILL || qType === QuestionType.MATCHING) {
          if (optsRaw.length < 2) {
            errors.push(`Hàng ${qIdx + 2}: Câu hỏi cần ít nhất 2 đáp án lựa chọn (Option_A, Option_B...).`);
          }
          if (!correct) {
            errors.push(`Hàng ${qIdx + 2}: Thiếu đáp án đúng (Correct_Answer).`);
          }
        }

        questions.push({
          questionNumber: qIdx + 1,
          prompt,
          questionType: qType,
          options: optsRaw.length > 0 ? optsRaw : undefined,
          correctAnswer: correct || (qType === QuestionType.SPEAKING_AUDIO || qType === QuestionType.ESSAY || qType === QuestionType.SHORT_TEXT ? '0' : ''),
          explanation,
        });
      }

      if (skill === ExamSkill.READING && partNumber === 3 && !passageText) {
        warnings.push('Reading Part 3 (Opinion Matching) nên có đoạn văn 4 người A, B, C, D trong cột Passage_Text.');
      }

      const isValid = errors.length === 0;

      validatedExams.push({
        idTemp: `temp_excel_${examIdx}_${Date.now()}`,
        title: `${skill === ExamSkill.READING ? 'Reading' : skill === ExamSkill.LISTENING ? 'Listening' : skill === ExamSkill.WRITING ? 'Writing' : 'Speaking'} Part ${partNumber} — ${topic}`,
        skill,
        partNumber,
        partTitle: getCanonicalPartTitle(skill, partNumber),
        topic,
        instructions: instructions || undefined,
        passageText: passageText || undefined,
        audioUrl: audioUrl || undefined,
        imageUrls,
        isPublished: true,
        isPro: false,
        hotLevel: 0,
        vocabulary: [],
        questions,
        isValid,
        errors,
        warnings,
      });

      examIdx++;
    }

    const validCount = validatedExams.filter((e) => e.isValid).length;
    const invalidCount = validatedExams.length - validCount;

    return {
      fileName,
      fileType: 'XLSX',
      totalFound: validatedExams.length,
      validCount,
      invalidCount,
      exams: validatedExams,
    };
  }

  /**
   * Lưu các đề đã được duyệt vào cơ sở dữ liệu hệ thống theo chuẩn kiến trúc Exam -> ExamPart -> Question
   */
  public async saveExamsToDatabase(exams: ValidatedExamItem[], creatorId?: string) {
    const validExams = exams.filter((e) => e.isValid);
    if (validExams.length === 0) {
      throw new Error('Không có đề thi hợp lệ nào để lưu vào cơ sở dữ liệu.');
    }

    const createdIds: string[] = [];

    for (const item of validExams) {
      const canonicalPartTitle = item.partTitle || getCanonicalPartTitle(item.skill, item.partNumber);
      const defaultDuration =
        item.skill === ExamSkill.SPEAKING
          ? 12
          : item.skill === ExamSkill.WRITING
          ? 50
          : item.skill === ExamSkill.LISTENING
          ? 40
          : 35;

      const createdExam = await prisma.exam.create({
        data: {
          title: item.title,
          description: `Chủ đề: ${item.topic} (${canonicalPartTitle})`,
          skill: item.skill,
          duration_minutes: defaultDuration,
          is_published: item.isPublished ?? true,
          is_pro: item.isPro ?? false,
          hot_level: item.hotLevel ?? 0,
          forecast_tag: (item.hotLevel ?? 0) >= 4 ? '★★★★★ Hay ra' : null,
          source: 'WEB',
          creator_id: creatorId || null,
          parts: {
            create: {
              part_number: 1,
              title: canonicalPartTitle,
              instructions: item.instructions || `Complete ${canonicalPartTitle}.`,
              passage_text: item.passageText || null,
              audio_url: item.audioUrl || null,
              image_url: item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls.join(', ') : null,
              questions: {
                create: item.questions.map((q, idx) => ({
                  question_number: idx + 1,
                  question_type: q.questionType,
                  prompt: q.prompt,
                  options:
                    q.options !== undefined && q.options !== null
                      ? Array.isArray(q.options)
                        ? q.options.length > 0
                          ? q.options
                          : undefined
                        : q.options
                      : undefined,
                  correct_answer: q.correctAnswer || (item.skill === ExamSkill.SPEAKING || item.skill === ExamSkill.WRITING ? '0' : null),
                  explanation: q.explanation || null,
                  max_score:
                    q.maxScore ??
                    (item.skill === ExamSkill.SPEAKING
                      ? 5.0
                      : item.skill === ExamSkill.WRITING
                      ? item.partNumber === 4
                        ? 10.0
                        : 5.0
                      : 1.0),
                })),
              },
            },
          },
        },
      });

      createdIds.push(createdExam.id);
    }

    return {
      success: true,
      count: createdIds.length,
      examIds: createdIds,
    };
  }
}

export const standardExamParser = new StandardExamParser();
