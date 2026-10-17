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
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
}

export interface ValidatedExamItem {
  idTemp: string;
  title: string;
  skill: ExamSkill;
  partNumber: number;
  topic: string;
  instructions?: string;
  passageText?: string;
  imageUrls: string[];
  vocabulary: { en: string; vi: string }[];
  questions: ValidatedQuestion[];
  isValid: boolean;
  errors: string[];
  warnings: string[];
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

      let partNumber = 2;
      let topic = '';
      const questions: ValidatedQuestion[] = [];

      for (const line of block) {
        if (line.includes('[PHẦN THI]:')) {
          const partStr = line.replace(/.*\[PHẦN THI\]:\s*/i, '').trim();
          if (partStr.includes('3')) partNumber = 3;
          else if (partStr.includes('4')) partNumber = 4;
          else partNumber = 2;
        } else if (line.includes('[CHỦ ĐỀ]:')) {
          topic = line.replace(/.*\[CHỦ ĐỀ\]:\s*/i, '').trim();
        } else if (/\[CÂU HỎI \d+\]:/i.test(line)) {
          const qText = line.replace(/.*\[CÂU HỎI \d+\]:\s*/i, '').trim();
          questions.push({
            questionNumber: questions.length + 1,
            prompt: qText,
            questionType: QuestionType.SPEAKING_AUDIO,
          });
        }
      }

      if (!topic) {
        topic = `Chủ đề luyện thi Speaking Part ${partNumber} (Bài ${i + 1})`;
        warnings.push('Chưa có thẻ [CHỦ ĐỀ]: Hệ thống tự gán tên chủ đề mặc định.');
      }

      // Gán bảng từ vựng tương ứng
      const vocab = tablesData[i] || [];
      if (vocab.length === 0) {
        warnings.push('Không tìm thấy bảng [TỪ VỰNG] 2 cột cho đề này.');
      }

      // Gán hình ảnh
      const imageUrls: string[] = [];
      const requiredImages = partNumber === 3 ? 2 : 1;

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
      if (questions.length < 3) {
        // Nếu thiếu thẻ câu hỏi, tự tạo fallback và cảnh báo
        if (questions.length === 0) {
          errors.push('Thiếu các thẻ câu hỏi: Cần có đủ 3 câu [CÂU HỎI 1], [CÂU HỎI 2], [CÂU HỎI 3].');
        } else {
          errors.push(`Chưa đủ 3 câu hỏi (hiện chỉ có ${questions.length} câu).`);
        }
      }

      const isValid = errors.length === 0;

      validatedExams.push({
        idTemp: `temp_docx_${i + 1}_${Date.now()}`,
        title: `Speaking Part ${partNumber}: ${topic}`,
        skill: ExamSkill.SPEAKING,
        partNumber,
        topic,
        instructions:
          partNumber === 2
            ? 'In this part, you will see a picture. Answer 3 questions (45 seconds each).'
            : 'Compare the two pictures and answer 3 questions (45 seconds each).',
        passageText: vocab.length > 0 ? JSON.stringify({ vocabulary: vocab }) : undefined,
        imageUrls,
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
   * Phân tích và kiểm định file Excel (.xlsx) chuẩn hóa (Reading / Listening)
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

    for (const [groupKey, rowList] of groupMap.entries()) {
      const firstRow = rowList[0];
      const skillRaw = (firstRow['Skill'] || 'READING').toString().toUpperCase();
      const skill = skillRaw === 'LISTENING' ? ExamSkill.LISTENING : ExamSkill.READING;
      const partNumber = parseInt(firstRow['Part'] || '1', 10);
      const topic = (firstRow['Topic'] || `Bài thi ${examIdx}`).toString().trim();
      const passageText = firstRow['Passage_Text'] || firstRow['Passage'] || '';

      const errors: string[] = [];
      const warnings: string[] = [];
      const questions: ValidatedQuestion[] = [];

      for (let qIdx = 0; qIdx < rowList.length; qIdx++) {
        const r = rowList[qIdx];
        const prompt = (r['Prompt'] || r['Question'] || '').toString().trim();
        const optA = r['Option_A'] ? r['Option_A'].toString().trim() : '';
        const optB = r['Option_B'] ? r['Option_B'].toString().trim() : '';
        const optC = r['Option_C'] ? r['Option_C'].toString().trim() : '';
        const optD = r['Option_D'] ? r['Option_D'].toString().trim() : '';
        const correct = (r['Correct_Answer'] || r['Answer'] || '').toString().trim();
        const explanation = (r['Explanation'] || '').toString().trim();

        if (!prompt) {
          errors.push(`Hàng ${qIdx + 2}: Thiếu nội dung câu hỏi (Prompt).`);
        }

        const options = [optA, optB, optC, optD].filter((o) => o.length > 0);
        if (options.length < 2) {
          errors.push(`Hàng ${qIdx + 2}: Câu hỏi cần ít nhất 2 đáp án lựa chọn (Option A, B...).`);
        }

        if (!correct) {
          errors.push(`Hàng ${qIdx + 2}: Thiếu đáp án đúng (Correct_Answer).`);
        }

        questions.push({
          questionNumber: qIdx + 1,
          prompt,
          questionType: QuestionType.MULTIPLE_CHOICE,
          options,
          correctAnswer: correct,
          explanation,
        });
      }

      if (skill === ExamSkill.READING && partNumber >= 2 && !passageText) {
        warnings.push(`Reading Part ${partNumber} nên có đoạn văn bài đọc (Passage_Text).`);
      }

      const isValid = errors.length === 0;

      validatedExams.push({
        idTemp: `temp_excel_${examIdx}_${Date.now()}`,
        title: `${skill === ExamSkill.READING ? 'Reading' : 'Listening'} Part ${partNumber}: ${topic}`,
        skill,
        partNumber,
        topic,
        passageText: passageText || undefined,
        imageUrls: [],
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
   * Lưu các đề đã được duyệt vào cơ sở dữ liệu hệ thống
   */
  public async saveExamsToDatabase(exams: ValidatedExamItem[], creatorId?: string) {
    const validExams = exams.filter((e) => e.isValid);
    if (validExams.length === 0) {
      throw new Error('Không có đề thi hợp lệ nào để lưu vào cơ sở dữ liệu.');
    }

    const createdIds: string[] = [];

    for (const item of validExams) {
      const createdExam = await prisma.exam.create({
        data: {
          title: item.title,
          description: `Đề thi nhập tự động theo chuẩn Doanh nghiệp. Chủ đề: ${item.topic}`,
          skill: item.skill,
          duration_minutes: item.skill === ExamSkill.SPEAKING ? 12 : 35,
          is_published: true,
          hot_level: 5,
          forecast_tag: '★★★★★ Hay ra',
          source: 'WEB_IMPORT',
          creator_id: creatorId || null,
          parts: {
            create: {
              part_number: item.partNumber,
              title: item.title,
              instructions: item.instructions || `Thực hiện bài thi Part ${item.partNumber}`,
              passage_text: item.passageText || null,
              image_url: item.imageUrls.length > 0 ? item.imageUrls.join(',') : null,
              questions: {
                create: item.questions.map((q) => ({
                  question_number: q.questionNumber,
                  question_type: q.questionType,
                  prompt: q.prompt,
                  options: q.options && q.options.length > 0 ? q.options : undefined,
                  correct_answer: q.correctAnswer || null,
                  explanation: q.explanation || null,
                  max_score: item.skill === ExamSkill.SPEAKING ? 5.0 : 1.0,
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
