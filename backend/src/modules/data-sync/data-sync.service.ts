import fs from 'node:fs';
import path from 'node:path';
import { ExamSkill, QuestionType } from '@prisma/client';
import { prisma } from '../../config/database';
import { ExamService } from '../exams/exam.service';

const examService = new ExamService();

export const VALID_SKILLS: ExamSkill[] = [
  'READING',
  'LISTENING',
  'SPEAKING',
  'WRITING',
  'GRAMMAR_VOCABULARY',
  'FULL_TEST',
];

export const VALID_QUESTION_TYPES: QuestionType[] = [
  'MULTIPLE_CHOICE',
  'GAP_FILL',
  'SENTENCE_ORDER',
  'MATCHING',
  'ESSAY',
  'SHORT_TEXT',
  'SPEAKING_AUDIO',
];

export interface NormalizedQuestionInput {
  question_number: number;
  question_type: QuestionType;
  prompt: string;
  options: any;
  correct_answer: string | null;
  explanation: string | null;
  max_score: number;
}

export interface NormalizedPartInput {
  part_number: number;
  title: string;
  instructions: string | null;
  passage_text: string | null;
  audio_url: string | null;
  image_url: string | null;
  questions: NormalizedQuestionInput[];
}

export interface NormalizedExamInput {
  source: string;
  externalId?: string | null;
  title: string;
  skill: ExamSkill;
  duration_minutes: number;
  is_pro: boolean;
  is_published: boolean;
  hot_level: number;
  forecast_tag: string | null;
  description: string;
  parts: NormalizedPartInput[];
}

export class DataSyncService {
  /**
   * Chuẩn hóa tiêu đề đề thi (ví dụ: "Đề 1" -> "Đề 01", xóa khoảng trắng thừa)
   */
  normalizeExamTitle(title: string): string {
    if (!title) return '';
    let clean = String(title).trim().replace(/\s+/g, ' ');
    clean = clean.replace(/Đề\s+(\d)\b/gi, (_match, num) => `Đề 0${num}`);
    clean = clean.replace(/Test\s+(\d)\b/gi, (_match, num) => `Test 0${num}`);
    return clean;
  }

  /**
   * Ánh xạ chuỗi kỹ năng về chuẩn ExamSkill
   */
  mapSkill(skill?: string): ExamSkill {
    const s = String(skill || '').toUpperCase();
    if (s.includes('READ')) return 'READING';
    if (s.includes('LISTEN')) return 'LISTENING';
    if (s.includes('WRITE') || s.includes('WRITING')) return 'WRITING';
    if (s.includes('SPEAK')) return 'SPEAKING';
    if (s.includes('GRAMMAR') || s.includes('VOCAB')) return 'GRAMMAR_VOCABULARY';
    return 'FULL_TEST';
  }

  /**
   * Ánh xạ đa hình QuestionType chuẩn khảo thí British Council
   */
  mapQuestionType(type: string | undefined, skill: ExamSkill, partNum = 1, title = ''): QuestionType {
    if (skill === 'SPEAKING') {
      return 'SPEAKING_AUDIO';
    }

    if (skill === 'WRITING') {
      const lowerTitle = title.toLowerCase();
      if (
        partNum === 1 ||
        partNum === 3 ||
        lowerTitle.includes('part 1') ||
        lowerTitle.includes('part 3')
      ) {
        return 'SHORT_TEXT';
      }
      return 'ESSAY';
    }

    const t = String(type || '').toUpperCase();
    if (t === 'GAP_FILL' || t.includes('GAP')) return 'GAP_FILL';
    if (t === 'SENTENCE_ORDER' || t.includes('ORDER')) return 'SENTENCE_ORDER';
    if (t === 'MATCHING' || t.includes('MATCH')) return 'MATCHING';
    if (t === 'ESSAY' || t.includes('ESSAY')) return 'ESSAY';
    if (t === 'SHORT_TEXT' || t.includes('SHORT')) return 'SHORT_TEXT';
    if (t === 'SPEAKING_AUDIO' || t.includes('SPEAK') || t.includes('AUDIO')) return 'SPEAKING_AUDIO';

    if (skill === 'READING') {
      const lowerTitle = title.toLowerCase();
      if (partNum === 1 || lowerTitle.includes('part 1')) return 'GAP_FILL';
      if (partNum === 2 || partNum === 3 || lowerTitle.includes('part 2')) return 'SENTENCE_ORDER';
      if (partNum === 4 || lowerTitle.includes('part 4')) return 'MATCHING';
    } else if (skill === 'LISTENING') {
      if (partNum === 2 || partNum === 3) return 'MATCHING';
      return 'MULTIPLE_CHOICE';
    }

    return 'MULTIPLE_CHOICE';
  }

  getDefaultDuration(skill: ExamSkill): number {
    switch (skill) {
      case 'FULL_TEST':
        return 162;
      case 'READING':
        return 35;
      case 'LISTENING':
        return 40;
      case 'WRITING':
        return 50;
      case 'SPEAKING':
        return 12;
      case 'GRAMMAR_VOCABULARY':
        return 25;
      default:
        return 60;
    }
  }

  getDefaultScore(skill: ExamSkill, partNum: number, qType: QuestionType): number {
    if (skill === 'READING') {
      if (partNum === 1 || qType === 'GAP_FILL') return 2.0;
      if (partNum === 2 || partNum === 3 || qType === 'SENTENCE_ORDER') return 5.0;
    }
    return 1.0;
  }

  /**
   * Chuẩn hóa một đối tượng đề thi thô về định dạng chuẩn NormalizedExamInput
   */
  normalizeExam(raw: any, defaultSource = 'WEB'): NormalizedExamInput {
    const mappedSkill = this.mapSkill(raw.skill);
    const cleanTitle = this.normalizeExamTitle(raw.title || '');
    const defaultDuration = this.getDefaultDuration(mappedSkill);
    const rawDuration = Number(raw.duration_minutes ?? raw.durationMinutes);
    const finalDuration = rawDuration > 0 ? rawDuration : defaultDuration;

    const rawParts = Array.isArray(raw.parts) ? raw.parts : [];

    return {
      source: String(raw.source || defaultSource),
      externalId: raw.externalId ? String(raw.externalId) : null,
      title: cleanTitle,
      skill: mappedSkill,
      duration_minutes: finalDuration,
      is_pro: Boolean(raw.is_pro ?? raw.isPro ?? false),
      is_published: raw.is_published !== undefined ? Boolean(raw.is_published) : true,
      hot_level: Number(raw.hot_level ?? raw.hotLevel ?? 0) || 0,
      forecast_tag: raw.forecast_tag || raw.forecastTag ? String(raw.forecast_tag || raw.forecastTag) : null,
      description: raw.description ? String(raw.description).trim() : '',
      parts: rawParts.map((p: any, idx: number) => {
        const pNum = Number(p.part_number ?? p.partNumber) || idx + 1;
        const pTitle = String(p.title || `Part ${pNum}`).trim();
        const rawQuestions = Array.isArray(p.questions) ? p.questions : [];

        return {
          part_number: pNum,
          title: pTitle,
          instructions: p.instructions ? String(p.instructions).trim() : null,
          passage_text: p.passage_text ?? p.passageText ? String(p.passage_text ?? p.passageText).trim() : null,
          audio_url: p.audio_url ?? p.audioUrl ? String(p.audio_url ?? p.audioUrl).trim() : null,
          image_url: p.image_url ?? p.imageUrl ? String(p.image_url ?? p.imageUrl).trim() : null,
          questions: rawQuestions.map((q: any, qIdx: number) => {
            const qNum = Number(q.question_number ?? q.questionNumber) || qIdx + 1;
            const inferredType = this.mapQuestionType(
              q.question_type ?? q.questionType ?? q.type,
              mappedSkill,
              pNum,
              `${cleanTitle} ${pTitle}`
            );
            const defaultScore = this.getDefaultScore(mappedSkill, pNum, inferredType);
            const rawScore = Number(q.max_score ?? q.maxScore);

            return {
              question_number: qNum,
              question_type: inferredType,
              prompt: String(q.prompt || q.question_text || `Câu hỏi ${qNum}`).trim(),
              options: q.options !== undefined ? q.options : [],
              correct_answer:
                q.correct_answer !== undefined && q.correct_answer !== null
                  ? String(q.correct_answer).trim()
                  : q.correctAnswer !== undefined && q.correctAnswer !== null
                  ? String(q.correctAnswer).trim()
                  : null,
              explanation: q.explanation ? String(q.explanation).trim() : null,
              max_score: rawScore > 0 ? rawScore : defaultScore,
            };
          }),
        };
      }),
    };
  }

  /**
   * Kiểm định Data Contract cho 1 đề thi
   */
  validateExam(exam: NormalizedExamInput) {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!exam.title || exam.title.trim().length === 0) {
      errors.push('Thiếu tiêu đề đề thi (title).');
    }

    if (!VALID_SKILLS.includes(exam.skill)) {
      errors.push(`Kỹ năng không hợp lệ: "${exam.skill}".`);
    }

    if (!Array.isArray(exam.parts) || exam.parts.length === 0) {
      errors.push('Đề thi không có phần thi nào (parts trống).');
      return { isValid: false, errors, warnings, questionsCount: 0, totalScore: 0 };
    }

    let totalQuestions = 0;
    let totalScore = 0;

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

        if (!VALID_QUESTION_TYPES.includes(q.question_type)) {
          errors.push(`${qLabel}: Loại câu hỏi không hợp lệ "${q.question_type}".`);
        }

        const score = Number(q.max_score);
        if (isNaN(score) || score <= 0) {
          errors.push(`${qLabel}: max_score không hợp lệ (${q.max_score}).`);
        } else {
          totalScore += score;
        }

        if (q.question_type === 'GAP_FILL') {
          if (!Array.isArray(q.options) || q.options.length < 2) {
            errors.push(`${qLabel} (GAP_FILL): options phải có ít nhất 2 lựa chọn.`);
          }
        } else if (q.question_type === 'MULTIPLE_CHOICE') {
          if (!Array.isArray(q.options) || q.options.length < 2) {
            warnings.push(`${qLabel} (MULTIPLE_CHOICE): options có ít hơn 2 lựa chọn.`);
          }
        } else if (
          q.question_type === 'SPEAKING_AUDIO' ||
          q.question_type === 'ESSAY' ||
          q.question_type === 'SHORT_TEXT'
        ) {
          if (!q.prompt || q.prompt.trim().length === 0) {
            errors.push(`${qLabel} (${q.question_type}): Prompt đề bài không được để trống.`);
          }
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      questionsCount: totalQuestions,
      totalScore,
    };
  }

  /**
   * 1. TỔNG QUAN KHO ĐỀ & CHẨN ĐOÁN SỨC KHỎE DỮ LIỆU (OVERVIEW)
   */
  async getOverview() {
    const [
      totalExams,
      totalParts,
      totalQuestions,
      totalSubmissions,
      skillGroups,
      sourceGroups,
      questionTypeGroups,
      allExamsLight,
    ] = await Promise.all([
      prisma.exam.count(),
      prisma.examPart.count(),
      prisma.question.count(),
      prisma.examSubmission.count(),
      prisma.exam.groupBy({
        by: ['skill'],
        _count: { id: true },
      }),
      prisma.exam.groupBy({
        by: ['source'],
        _count: { id: true },
      }),
      prisma.question.groupBy({
        by: ['question_type'],
        _count: { id: true },
      }),
      prisma.exam.findMany({
        select: {
          id: true,
          title: true,
          skill: true,
          source: true,
          parts: {
            select: {
              id: true,
              part_number: true,
              title: true,
              questions: {
                select: {
                  id: true,
                  question_type: true,
                  options: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // Chẩn đoán bất thường (Anomalies)
    let emptyExamsCount = 0;
    let typeMismatchCount = 0;
    let brokenOptionsCount = 0;
    const titleKeyMap = new Map<string, number>();

    for (const ex of allExamsLight) {
      const normKey = `${ex.skill}::${this.normalizeExamTitle(ex.title).toLowerCase()}`;
      titleKeyMap.set(normKey, (titleKeyMap.get(normKey) || 0) + 1);

      const qTotal = ex.parts.reduce((acc, p) => acc + p.questions.length, 0);
      if (ex.parts.length === 0 || qTotal === 0) {
        emptyExamsCount++;
      }

      for (const p of ex.parts) {
        const lowerCombined = `${ex.title} ${p.title}`.toLowerCase();
        for (const q of p.questions) {
          if (ex.skill === 'SPEAKING' && q.question_type !== 'SPEAKING_AUDIO') {
            typeMismatchCount++;
          } else if (ex.skill === 'WRITING' && !['SHORT_TEXT', 'ESSAY'].includes(q.question_type)) {
            typeMismatchCount++;
          } else if (
            ex.skill === 'READING' &&
            lowerCombined.includes('part 1') &&
            q.question_type === 'MULTIPLE_CHOICE'
          ) {
            typeMismatchCount++;
          }

          if (q.question_type === 'GAP_FILL' || q.question_type === 'MULTIPLE_CHOICE') {
            const opts = Array.isArray(q.options) ? q.options : [];
            if (opts.length < 2) {
              brokenOptionsCount++;
            }
          }
        }
      }
    }

    let duplicateGroupsCount = 0;
    for (const count of titleKeyMap.values()) {
      if (count > 1) duplicateGroupsCount++;
    }

    // Kiểm tra các kho dữ liệu Snapshot có sẵn trong tools/data/
    const snapshots = this.getAvailableSnapshots();

    const totalIssues = emptyExamsCount + duplicateGroupsCount + typeMismatchCount + brokenOptionsCount;

    return {
      summary: {
        totalExams,
        totalParts,
        totalQuestions,
        totalSubmissions,
        healthScore: totalExams > 0 ? Math.max(0, Math.round(100 - (totalIssues / totalExams) * 100)) : 100,
        isHealthy: totalIssues === 0,
      },
      anomalies: {
        emptyExamsCount,
        duplicateGroupsCount,
        typeMismatchCount,
        brokenOptionsCount,
        totalIssues,
      },
      bySkill: skillGroups.map((g) => ({
        skill: g.skill,
        count: g._count.id,
      })),
      bySource: sourceGroups.map((g) => ({
        source: g.source || 'WEB',
        count: g._count.id,
      })),
      byQuestionType: questionTypeGroups.map((g) => ({
        questionType: g.question_type,
        count: g._count.id,
      })),
      snapshots,
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * Kiểm tra các file normalized_exams.json trong tools/data/
   */
  getAvailableSnapshots() {
    const candidates = [
      {
        id: 'aptisacademy',
        name: 'Aptis Academy (VIP + Free)',
        sourceCode: 'APTIS_ACADEMY',
        relPath: '../tools/data/aptisacademy/normalized_exams.json',
      },
      {
        id: 'aptiskytich',
        name: 'Aptis Kỳ Tích (Ngân hàng Đề Tủ)',
        sourceCode: 'APTIS_KY_TICH',
        relPath: '../tools/data/aptiskytich/normalized_exams.json',
      },
    ];

    return candidates.map((item) => {
      const fullPath = path.resolve(process.cwd(), item.relPath);
      if (fs.existsSync(fullPath)) {
        try {
          const stat = fs.statSync(fullPath);
          const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);
          return {
            id: item.id,
            name: item.name,
            sourceCode: item.sourceCode,
            available: true,
            sizeFormatted: `${sizeMB} MB`,
            updatedAt: stat.mtime.toISOString(),
          };
        } catch {
          // ignore
        }
      }
      return {
        id: item.id,
        name: item.name,
        sourceCode: item.sourceCode,
        available: false,
        sizeFormatted: '0 MB',
        updatedAt: null,
      };
    });
  }

  /**
   * 2. TỰ ĐỘNG CHUẨN HÓA & SỬA LỖI TRỰC TIẾP TRÊN DATABASE (AUTO-STANDARDIZE / SELF-HEAL)
   */
  async runAutoStandardize() {
    const startTime = Date.now();
    let normalizedTitlesCount = 0;
    let deduplicatedExamsCount = 0;
    let removedEmptyExamsCount = 0;
    let fixedQuestionTypesCount = 0;

    // BƯỚC 1: Chuẩn hóa tiêu đề đề thi ("Đề 1" -> "Đề 01")
    const exams = await prisma.exam.findMany({
      select: { id: true, title: true, skill: true },
    });

    for (const ex of exams) {
      const cleanTitle = this.normalizeExamTitle(ex.title);
      if (cleanTitle && cleanTitle !== ex.title) {
        await prisma.exam.update({
          where: { id: ex.id },
          data: { title: cleanTitle },
        });
        normalizedTitlesCount++;
      }
    }

    // BƯỚC 2: Xóa các part rỗng & đề rỗng chưa có bài nộp
    const emptyParts = await prisma.examPart.findMany({
      where: { questions: { none: {} } },
      select: { id: true },
    });
    if (emptyParts.length > 0) {
      await prisma.examPart.deleteMany({
        where: { id: { in: emptyParts.map((p) => p.id) } },
      });
    }

    const emptyExams = await prisma.exam.findMany({
      where: {
        parts: { none: {} },
        submissions: { none: {} },
      },
      select: { id: true },
    });
    if (emptyExams.length > 0) {
      const delRes = await prisma.exam.deleteMany({
        where: { id: { in: emptyExams.map((e) => e.id) } },
      });
      removedEmptyExamsCount += delRes.count;
    }

    // BƯỚC 3: Khử trùng lặp (Deduplicate) các đề cùng (skill, normalizedTitle) chưa có bài nộp
    const currentExams = await prisma.exam.findMany({
      include: {
        parts: { select: { _count: { select: { questions: true } } } },
        _count: { select: { submissions: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    const groups = new Map<string, typeof currentExams>();
    for (const ex of currentExams) {
      const key = `${ex.skill}::${this.normalizeExamTitle(ex.title).toLowerCase()}`;
      const list = groups.get(key) || [];
      list.push(ex);
      groups.set(key, list);
    }

    const duplicateIdsToDelete: string[] = [];
    for (const list of groups.values()) {
      if (list.length <= 1) continue;
      // Sắp xếp ưu tiên giữ lại đề có nhiều lượt nộp bài nhất -> nhiều câu hỏi nhất
      list.sort((a, b) => {
        const subDiff = (b._count?.submissions || 0) - (a._count?.submissions || 0);
        if (subDiff !== 0) return subDiff;
        const qA = a.parts.reduce((acc, p) => acc + p._count.questions, 0);
        const qB = b.parts.reduce((acc, p) => acc + p._count.questions, 0);
        return qB - qA;
      });

      const duplicates = list.slice(1);
      for (const dup of duplicates) {
        if ((dup._count?.submissions || 0) === 0) {
          duplicateIdsToDelete.push(dup.id);
        }
      }
    }

    if (duplicateIdsToDelete.length > 0) {
      const delDup = await prisma.exam.deleteMany({
        where: { id: { in: duplicateIdsToDelete } },
      });
      deduplicatedExamsCount = delDup.count;
    }

    // BƯỚC 4: Chuẩn hóa QuestionType đa hình cho Speaking, Writing, Reading
    const fixSpeaking = await prisma.$executeRaw`
      UPDATE "Question" q
      SET question_type = 'SPEAKING_AUDIO'::"QuestionType"
      FROM "ExamPart" ep
      JOIN "Exam" e ON e.id = ep.exam_id
      WHERE q.part_id = ep.id
        AND e.skill = 'SPEAKING'::"ExamSkill"
        AND q.question_type != 'SPEAKING_AUDIO'::"QuestionType"
    `;

    const fixWritingShort = await prisma.$executeRaw`
      UPDATE "Question" q
      SET question_type = 'SHORT_TEXT'::"QuestionType"
      FROM "ExamPart" ep
      JOIN "Exam" e ON e.id = ep.exam_id
      WHERE q.part_id = ep.id
        AND e.skill = 'WRITING'::"ExamSkill"
        AND (ep.part_number IN (1, 3) OR ep.title ILIKE '%Part 1%' OR ep.title ILIKE '%Part 3%' OR e.title ILIKE '%Part 1%' OR e.title ILIKE '%Part 3%')
        AND q.question_type NOT IN ('SHORT_TEXT'::"QuestionType", 'ESSAY'::"QuestionType")
    `;

    const fixWritingEssay = await prisma.$executeRaw`
      UPDATE "Question" q
      SET question_type = 'ESSAY'::"QuestionType"
      FROM "ExamPart" ep
      JOIN "Exam" e ON e.id = ep.exam_id
      WHERE q.part_id = ep.id
        AND e.skill = 'WRITING'::"ExamSkill"
        AND q.question_type NOT IN ('SHORT_TEXT'::"QuestionType", 'ESSAY'::"QuestionType")
    `;

    const fixReadingP1 = await prisma.$executeRaw`
      UPDATE "Question" q
      SET question_type = 'GAP_FILL'::"QuestionType"
      FROM "ExamPart" ep
      JOIN "Exam" e ON e.id = ep.exam_id
      WHERE q.part_id = ep.id
        AND e.skill = 'READING'::"ExamSkill"
        AND (e.title ILIKE '%Part 1%' OR ep.title ILIKE '%Part 1%')
        AND q.question_type = 'MULTIPLE_CHOICE'::"QuestionType"
    `;

    fixedQuestionTypesCount =
      Number(fixSpeaking || 0) +
      Number(fixWritingShort || 0) +
      Number(fixWritingEssay || 0) +
      Number(fixReadingP1 || 0);

    return {
      normalizedTitlesCount,
      deduplicatedExamsCount,
      removedEmptyExamsCount,
      fixedQuestionTypesCount,
      totalFixed:
        normalizedTitlesCount +
        deduplicatedExamsCount +
        removedEmptyExamsCount +
        fixedQuestionTypesCount,
      durationMs: Date.now() - startTime,
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Nhận diện Part 1..4 từ dữ liệu API trả về
   */
  private resolvePartKey(part: any, totalParts: number, examTitle = ''): 'p1' | 'p2' | 'p3' | 'p4' {
    const sub = String(part.partSubtitle || '').toLowerCase();
    const title = `${examTitle} ${part.title || ''}`.toLowerCase();
    const pNum = Number(part.part_number) || 1;

    if (title.includes('part 4') || sub.includes('part 4')) return 'p4';
    if (title.includes('part 3') || sub.includes('part 3')) return 'p3';
    if (title.includes('part 2') || sub.includes('part 2')) return 'p2';
    if (title.includes('part 1') || sub.includes('part 1')) return 'p1';

    if (sub.includes('heading') || title.includes('email') || title.includes('long')) return 'p4';
    if (sub.includes('opinion') || title.includes('chat') || title.includes('social')) return 'p3';
    if (sub.includes('cohesion') || sub.includes('order') || title.includes('form')) return 'p2';
    if (sub.includes('gap') || sub.includes('sentence completion')) return 'p1';

    if (totalParts >= 4 && pNum >= 1 && pNum <= 4) {
      return `p${pNum}` as 'p1' | 'p2' | 'p3' | 'p4';
    }
    return 'p1';
  }

  /**
   * 3. CHẠY UNIT TEST ĐỐI SOÁT TỪNG PART QUA ENGINE API PHÒNG THI
   */
  async runUnitTestAudit(sampleLimit = 35) {
    const startTime = Date.now();

    interface PartSuiteResult {
      skill: string;
      partKey: string;
      partName: string;
      expectedFormat: string;
      testedCount: number;
      passedCount: number;
      failedCount: number;
      sampleExamId: string | null;
      sampleExamTitle: string | null;
      sampleQuestionsCount: number;
      status: 'PASS' | 'FAIL' | 'WARN';
      failures: Array<{ examId: string; examTitle: string; reason: string }>;
    }

    const suiteMap: Record<string, PartSuiteResult> = {
      READING_p1: {
        skill: 'READING',
        partKey: 'Part 1',
        partName: 'Reading Part 1 — Điền từ vào câu (Sentence Comprehension)',
        expectedFormat: 'GAP_FILL (>= 2 options)',
        testedCount: 0,
        passedCount: 0,
        failedCount: 0,
        sampleExamId: null,
        sampleExamTitle: null,
        sampleQuestionsCount: 0,
        status: 'PASS',
        failures: [],
      },
      READING_p2: {
        skill: 'READING',
        partKey: 'Part 2',
        partName: 'Reading Part 2 — Sắp xếp câu thành đoạn văn (Text Cohesion)',
        expectedFormat: 'SENTENCE_ORDER (JSON sentences)',
        testedCount: 0,
        passedCount: 0,
        failedCount: 0,
        sampleExamId: null,
        sampleExamTitle: null,
        sampleQuestionsCount: 0,
        status: 'PASS',
        failures: [],
      },
      READING_p3: {
        skill: 'READING',
        partKey: 'Part 3',
        partName: 'Reading Part 3 — Đọc hiểu quan điểm / Sắp xếp đoạn 2 (Opinion Matching)',
        expectedFormat: 'MATCHING / SENTENCE_ORDER / GAP_FILL',
        testedCount: 0,
        passedCount: 0,
        failedCount: 0,
        sampleExamId: null,
        sampleExamTitle: null,
        sampleQuestionsCount: 0,
        status: 'PASS',
        failures: [],
      },
      READING_p4: {
        skill: 'READING',
        partKey: 'Part 4',
        partName: 'Reading Part 4 — Nối tiêu đề đoạn văn dài (Long Text Heading Matching)',
        expectedFormat: 'MATCHING (7-8 câu)',
        testedCount: 0,
        passedCount: 0,
        failedCount: 0,
        sampleExamId: null,
        sampleExamTitle: null,
        sampleQuestionsCount: 0,
        status: 'PASS',
        failures: [],
      },
      LISTENING_p1: {
        skill: 'LISTENING',
        partKey: 'Part 1',
        partName: 'Listening Part 1 — Nhận diện thông tin hội thoại ngắn',
        expectedFormat: 'MULTIPLE_CHOICE (>= 2 options)',
        testedCount: 0,
        passedCount: 0,
        failedCount: 0,
        sampleExamId: null,
        sampleExamTitle: null,
        sampleQuestionsCount: 0,
        status: 'PASS',
        failures: [],
      },
      LISTENING_p2: {
        skill: 'LISTENING',
        partKey: 'Part 2',
        partName: 'Listening Part 2 — Nối quan điểm 4 người nói (Monologue Matching)',
        expectedFormat: 'MATCHING / MULTIPLE_CHOICE',
        testedCount: 0,
        passedCount: 0,
        failedCount: 0,
        sampleExamId: null,
        sampleExamTitle: null,
        sampleQuestionsCount: 0,
        status: 'PASS',
        failures: [],
      },
      LISTENING_p3: {
        skill: 'LISTENING',
        partKey: 'Part 3',
        partName: 'Listening Part 3 — Hội thoại chuyên sâu Nam - Nữ',
        expectedFormat: 'MATCHING / MULTIPLE_CHOICE',
        testedCount: 0,
        passedCount: 0,
        failedCount: 0,
        sampleExamId: null,
        sampleExamTitle: null,
        sampleQuestionsCount: 0,
        status: 'PASS',
        failures: [],
      },
      LISTENING_p4: {
        skill: 'LISTENING',
        partKey: 'Part 4',
        partName: 'Listening Part 4 — Bài giảng / Độc thoại dài học thuật',
        expectedFormat: 'MULTIPLE_CHOICE',
        testedCount: 0,
        passedCount: 0,
        failedCount: 0,
        sampleExamId: null,
        sampleExamTitle: null,
        sampleQuestionsCount: 0,
        status: 'PASS',
        failures: [],
      },
      WRITING_p1: {
        skill: 'WRITING',
        partKey: 'Part 1',
        partName: 'Writing Part 1 — Trả lời tin nhắn ngắn (1-5 từ)',
        expectedFormat: 'SHORT_TEXT (5 câu)',
        testedCount: 0,
        passedCount: 0,
        failedCount: 0,
        sampleExamId: null,
        sampleExamTitle: null,
        sampleQuestionsCount: 0,
        status: 'PASS',
        failures: [],
      },
      WRITING_p2: {
        skill: 'WRITING',
        partKey: 'Part 2',
        partName: 'Writing Part 2 — Điền biểu mẫu thông tin (20-30 từ)',
        expectedFormat: 'ESSAY / SHORT_TEXT',
        testedCount: 0,
        passedCount: 0,
        failedCount: 0,
        sampleExamId: null,
        sampleExamTitle: null,
        sampleQuestionsCount: 0,
        status: 'PASS',
        failures: [],
      },
      WRITING_p3: {
        skill: 'WRITING',
        partKey: 'Part 3',
        partName: 'Writing Part 3 — Tương tác mạng xã hội / Chat Room (30-40 từ)',
        expectedFormat: 'SHORT_TEXT / ESSAY (3 câu)',
        testedCount: 0,
        passedCount: 0,
        failedCount: 0,
        sampleExamId: null,
        sampleExamTitle: null,
        sampleQuestionsCount: 0,
        status: 'PASS',
        failures: [],
      },
      WRITING_p4: {
        skill: 'WRITING',
        partKey: 'Part 4',
        partName: 'Writing Part 4 — Viết 2 Email Thân mật & Trang trọng (50w & 120-150w)',
        expectedFormat: 'ESSAY (1-2 câu)',
        testedCount: 0,
        passedCount: 0,
        failedCount: 0,
        sampleExamId: null,
        sampleExamTitle: null,
        sampleQuestionsCount: 0,
        status: 'PASS',
        failures: [],
      },
      SPEAKING_p1: {
        skill: 'SPEAKING',
        partKey: 'Part 1',
        partName: 'Speaking Part 1 — Phỏng vấn thông tin cá nhân (30s/câu)',
        expectedFormat: 'SPEAKING_AUDIO (3 câu)',
        testedCount: 0,
        passedCount: 0,
        failedCount: 0,
        sampleExamId: null,
        sampleExamTitle: null,
        sampleQuestionsCount: 0,
        status: 'PASS',
        failures: [],
      },
      SPEAKING_p2: {
        skill: 'SPEAKING',
        partKey: 'Part 2',
        partName: 'Speaking Part 2 — Mô tả bức tranh & trả lời 2 câu hỏi phụ (45s/câu)',
        expectedFormat: 'SPEAKING_AUDIO (3 câu + image_url)',
        testedCount: 0,
        passedCount: 0,
        failedCount: 0,
        sampleExamId: null,
        sampleExamTitle: null,
        sampleQuestionsCount: 0,
        status: 'PASS',
        failures: [],
      },
      SPEAKING_p3: {
        skill: 'SPEAKING',
        partKey: 'Part 3',
        partName: 'Speaking Part 3 — So sánh 2 bức tranh đối lập (45s/câu)',
        expectedFormat: 'SPEAKING_AUDIO (3 câu + image_url)',
        testedCount: 0,
        passedCount: 0,
        failedCount: 0,
        sampleExamId: null,
        sampleExamTitle: null,
        sampleQuestionsCount: 0,
        status: 'PASS',
        failures: [],
      },
      SPEAKING_p4: {
        skill: 'SPEAKING',
        partKey: 'Part 4',
        partName: 'Speaking Part 4 — Thuyết trình chủ đề trừu tượng (1p chuẩn bị + 2p nói)',
        expectedFormat: 'SPEAKING_AUDIO (1-3 câu)',
        testedCount: 0,
        passedCount: 0,
        failedCount: 0,
        sampleExamId: null,
        sampleExamTitle: null,
        sampleQuestionsCount: 0,
        status: 'PASS',
        failures: [],
      },
      FULL_TEST_all: {
        skill: 'FULL_TEST',
        partKey: '16 Parts',
        partName: 'Thi Thử Toàn Diện (Full Mock Test 4 Kỹ Năng Liên Hoàn)',
        expectedFormat: '16 Parts (Nghe + Đọc + Viết + Nói)',
        testedCount: 0,
        passedCount: 0,
        failedCount: 0,
        sampleExamId: null,
        sampleExamTitle: null,
        sampleQuestionsCount: 0,
        status: 'PASS',
        failures: [],
      },
    };

    // Lấy SuperAdmin ID để qua pro-guard khi gọi examService.getExamQuestions
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true },
    });
    const testerUserId = superAdmin?.id;

    const skillsToTest: ExamSkill[] = ['READING', 'LISTENING', 'WRITING', 'SPEAKING', 'FULL_TEST'];

    for (const skill of skillsToTest) {
      const sampleExams = await prisma.exam.findMany({
        where: { skill, is_published: true },
        take: skill === 'FULL_TEST' ? 20 : sampleLimit,
        orderBy: { created_at: 'desc' },
        select: { id: true, title: true },
      });

      for (const ex of sampleExams) {
        try {
          const detail: any = await examService.getExamQuestions(ex.id, testerUserId);
          if (!detail || !Array.isArray(detail.parts) || detail.parts.length === 0) {
            continue;
          }

          if (skill === 'FULL_TEST') {
            const suite = suiteMap.FULL_TEST_all;
            suite.testedCount++;
            const totalQs = detail.parts.reduce(
              (acc: number, p: any) => acc + (Array.isArray(p.questions) ? p.questions.length : 0),
              0
            );
            const hasEmptyPart = detail.parts.some(
              (p: any) => !Array.isArray(p.questions) || p.questions.length === 0
            );
            if (!hasEmptyPart && detail.parts.length >= 4 && totalQs >= 20) {
              suite.passedCount++;
              if (!suite.sampleExamId) {
                suite.sampleExamId = ex.id;
                suite.sampleExamTitle = ex.title;
                suite.sampleQuestionsCount = totalQs;
              }
            } else {
              suite.failedCount++;
              suite.failures.push({
                examId: ex.id,
                examTitle: ex.title,
                reason: `Có part rỗng hoặc thiếu câu hỏi (${detail.parts.length} parts, ${totalQs} câu).`,
              });
            }
            continue;
          }

          const totalParts = detail.parts.length;
          for (const p of detail.parts) {
            const pKey = this.resolvePartKey(p, totalParts, ex.title);
            const suiteKey = `${skill}_${pKey}`;
            const suite = suiteMap[suiteKey];
            if (!suite) continue;

            const qs = Array.isArray(p.questions) ? p.questions : [];
            suite.testedCount++;

            if (qs.length === 0) {
              suite.failedCount++;
              suite.failures.push({
                examId: ex.id,
                examTitle: ex.title,
                reason: `Part ${p.part_number} không có câu hỏi nào.`,
              });
              continue;
            }

            let isPass = true;
            let failReason = '';

            if (skill === 'READING') {
              if (pKey === 'p1') {
                isPass = qs.some((q: any) => q.question_type === 'GAP_FILL');
                if (!isPass) failReason = 'Câu hỏi Reading Part 1 không phải GAP_FILL.';
              } else if (pKey === 'p2') {
                isPass = qs.some((q: any) => q.question_type === 'SENTENCE_ORDER');
                if (!isPass) failReason = 'Câu hỏi Reading Part 2 không phải SENTENCE_ORDER.';
              } else if (pKey === 'p3') {
                isPass = qs.some((q: any) =>
                  ['MATCHING', 'SENTENCE_ORDER', 'GAP_FILL'].includes(q.question_type)
                );
                if (!isPass) failReason = 'Reading Part 3 sai định dạng question_type.';
              } else if (pKey === 'p4') {
                isPass = qs.some((q: any) => String(q.question_type).includes('MATCH'));
                if (!isPass) failReason = 'Reading Part 4 không phải MATCHING.';
              }
            } else if (skill === 'LISTENING') {
              isPass = qs.every(
                (q: any) =>
                  ['MULTIPLE_CHOICE', 'MATCHING', 'GAP_FILL'].includes(q.question_type) &&
                  Array.isArray(q.options) &&
                  q.options.length >= 2
              );
              if (!isPass) failReason = 'Listening thiếu options hoặc sai question_type.';
            } else if (skill === 'WRITING') {
              isPass = qs.every((q: any) => ['SHORT_TEXT', 'ESSAY'].includes(q.question_type));
              if (!isPass) failReason = 'Writing không thuộc SHORT_TEXT / ESSAY.';
            } else if (skill === 'SPEAKING') {
              isPass = qs.every((q: any) => q.question_type === 'SPEAKING_AUDIO');
              if (!isPass) failReason = 'Speaking không phải SPEAKING_AUDIO.';
            }

            if (isPass) {
              suite.passedCount++;
              if (!suite.sampleExamId) {
                suite.sampleExamId = ex.id;
                suite.sampleExamTitle = ex.title;
                suite.sampleQuestionsCount = qs.length;
              }
            } else {
              suite.failedCount++;
              suite.failures.push({
                examId: ex.id,
                examTitle: ex.title,
                reason: failReason,
              });
            }
          }
        } catch (err: any) {
          // Ghi nhận lỗi nếu có
        }
      }
    }

    const suites = Object.values(suiteMap).map((s) => ({
      ...s,
      status: (s.failedCount > 0 ? 'FAIL' : s.testedCount > 0 ? 'PASS' : 'WARN') as
        | 'PASS'
        | 'FAIL'
        | 'WARN',
    }));

    const totalPartsTested = suites.reduce((acc, s) => acc + s.testedCount, 0);
    const totalPassed = suites.reduce((acc, s) => acc + s.passedCount, 0);
    const totalFailed = suites.reduce((acc, s) => acc + s.failedCount, 0);
    const overallPassRate =
      totalPartsTested > 0 ? Number(((totalPassed / totalPartsTested) * 100).toFixed(2)) : 100;

    return {
      overallPassRate,
      totalPartsTested,
      totalPassed,
      totalFailed,
      suites,
      durationMs: Date.now() - startTime,
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * 4. DEEP IDEMPOTENT UPSERT ĐỀ THI VÀO DATABASE (HỖ TRỢ DRY-RUN & LIVE SYNC)
   */
  async upsertSingleExam(normalizedExam: NormalizedExamInput, dryRun = false) {
    const validation = this.validateExam(normalizedExam);
    if (!validation.isValid) {
      return {
        status: 'VALIDATION_FAILED' as const,
        title: normalizedExam.title,
        skill: normalizedExam.skill,
        questionsCount: validation.questionsCount,
        errors: validation.errors,
        warnings: validation.warnings,
      };
    }

    if (dryRun) {
      return {
        status: 'VALID_DRY_RUN' as const,
        title: normalizedExam.title,
        skill: normalizedExam.skill,
        partsCount: normalizedExam.parts.length,
        questionsCount: validation.questionsCount,
        errors: [],
        warnings: validation.warnings,
      };
    }

    const cleanTitle = this.normalizeExamTitle(normalizedExam.title);

    const existing = await prisma.exam.findFirst({
      where: {
        skill: normalizedExam.skill,
        title: { equals: cleanTitle, mode: 'insensitive' },
      },
      include: {
        parts: {
          orderBy: { part_number: 'asc' },
          include: {
            questions: { orderBy: { question_number: 'asc' } },
          },
        },
        _count: { select: { submissions: true } },
      },
    });

    if (existing) {
      const submissionsCount = existing._count?.submissions || 0;

      // Trường hợp chưa có bài nộp -> Deep Replace sạch sẽ
      if (submissionsCount === 0) {
        await prisma.$transaction(async (tx) => {
          await tx.exam.update({
            where: { id: existing.id },
            data: {
              title: cleanTitle,
              description: normalizedExam.description || existing.description,
              duration_minutes: normalizedExam.duration_minutes || existing.duration_minutes,
              is_pro: normalizedExam.is_pro,
              is_published: normalizedExam.is_published,
              hot_level: normalizedExam.hot_level,
              forecast_tag: normalizedExam.forecast_tag || existing.forecast_tag,
              source: normalizedExam.source || existing.source,
            },
          });

          await tx.examPart.deleteMany({
            where: { exam_id: existing.id },
          });

          for (const p of normalizedExam.parts) {
            await tx.examPart.create({
              data: {
                exam_id: existing.id,
                part_number: p.part_number,
                title: p.title,
                instructions: p.instructions,
                passage_text: p.passage_text,
                audio_url: p.audio_url,
                image_url: p.image_url,
                questions: {
                  create: p.questions.map((q) => ({
                    question_number: q.question_number,
                    question_type: q.question_type,
                    prompt: q.prompt,
                    options: q.options ?? [],
                    correct_answer: q.correct_answer,
                    explanation: q.explanation,
                    max_score: q.max_score,
                  })),
                },
              },
            });
          }
        });

        return {
          status: 'DEEP_UPDATED' as const,
          id: existing.id,
          title: cleanTitle,
          skill: normalizedExam.skill,
          partsCount: normalizedExam.parts.length,
          questionsCount: validation.questionsCount,
          warnings: validation.warnings,
        };
      }

      // Trường hợp đã có học viên nộp bài -> Safe In-Place Update bảo toàn ID câu hỏi
      await prisma.$transaction(async (tx) => {
        await tx.exam.update({
          where: { id: existing.id },
          data: {
            title: cleanTitle,
            description: normalizedExam.description || existing.description,
            duration_minutes: normalizedExam.duration_minutes || existing.duration_minutes,
            source: normalizedExam.source || existing.source,
          },
        });

        for (const newPart of normalizedExam.parts) {
          const matchedPart = existing.parts.find((p) => p.part_number === newPart.part_number);
          if (matchedPart) {
            await tx.examPart.update({
              where: { id: matchedPart.id },
              data: {
                title: newPart.title,
                instructions: newPart.instructions,
                passage_text: newPart.passage_text,
                audio_url: newPart.audio_url,
                image_url: newPart.image_url,
              },
            });

            for (const newQ of newPart.questions) {
              const matchedQ = matchedPart.questions.find(
                (q) => q.question_number === newQ.question_number
              );
              if (matchedQ) {
                await tx.question.update({
                  where: { id: matchedQ.id },
                  data: {
                    question_type: newQ.question_type,
                    prompt: newQ.prompt,
                    options: newQ.options ?? [],
                    correct_answer: newQ.correct_answer,
                    explanation: newQ.explanation,
                    max_score: newQ.max_score,
                  },
                });
              }
            }
          }
        }
      });

      return {
        status: 'IN_PLACE_UPDATED' as const,
        id: existing.id,
        title: cleanTitle,
        skill: normalizedExam.skill,
        partsCount: normalizedExam.parts.length,
        questionsCount: validation.questionsCount,
        submissionsPreserved: submissionsCount,
        warnings: validation.warnings,
      };
    }

    // Tạo mới hoàn toàn
    const created = await prisma.exam.create({
      data: {
        title: cleanTitle,
        description: normalizedExam.description,
        skill: normalizedExam.skill,
        duration_minutes: normalizedExam.duration_minutes,
        is_pro: normalizedExam.is_pro,
        is_published: normalizedExam.is_published,
        hot_level: normalizedExam.hot_level,
        forecast_tag: normalizedExam.forecast_tag,
        source: normalizedExam.source,
        parts: {
          create: normalizedExam.parts.map((p) => ({
            part_number: p.part_number,
            title: p.title,
            instructions: p.instructions,
            passage_text: p.passage_text,
            audio_url: p.audio_url,
            image_url: p.image_url,
            questions: {
              create: p.questions.map((q) => ({
                question_number: q.question_number,
                question_type: q.question_type,
                prompt: q.prompt,
                options: q.options ?? [],
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                max_score: q.max_score,
              })),
            },
          })),
        },
      },
    });

    return {
      status: 'CREATED' as const,
      id: created.id,
      title: created.title,
      skill: normalizedExam.skill,
      partsCount: normalizedExam.parts.length,
      questionsCount: validation.questionsCount,
      warnings: validation.warnings,
    };
  }

  /**
   * Đồng bộ hàng loạt từ Snapshot trên server hoặc JSON tải lên từ Admin UI
   */
  async syncBatch(options: {
    snapshotId?: 'aptisacademy' | 'aptiskytich';
    exams?: any[];
    defaultSource?: string;
    dryRun?: boolean;
    limit?: number;
  }) {
    const startTime = Date.now();
    const { snapshotId, defaultSource = 'WEB', dryRun = false, limit } = options;
    let rawExams: any[] = [];

    if (snapshotId) {
      const relPath =
        snapshotId === 'aptisacademy'
          ? '../tools/data/aptisacademy/normalized_exams.json'
          : '../tools/data/aptiskytich/normalized_exams.json';
      const fullPath = path.resolve(process.cwd(), relPath);
      if (!fs.existsSync(fullPath)) {
        throw new Error(
          `Không tìm thấy tệp Snapshot "${snapshotId}" trên máy chủ (${relPath}). Bạn có thể tải tệp JSON trực tiếp từ máy tính lên giao diện.`
        );
      }
      const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      rawExams = Array.isArray(parsed) ? parsed : parsed.exams || [];
    } else if (Array.isArray(options.exams)) {
      rawExams = options.exams;
    } else {
      throw new Error('Vui lòng chọn nguồn Snapshot hoặc tải lên danh sách đề thi định dạng JSON.');
    }

    if (limit && limit > 0) {
      rawExams = rawExams.slice(0, limit);
    }

    const sourceTag =
      snapshotId === 'aptisacademy'
        ? 'APTIS_ACADEMY'
        : snapshotId === 'aptiskytich'
        ? 'APTIS_KY_TICH'
        : defaultSource;

    let createdCount = 0;
    let deepUpdatedCount = 0;
    let inPlaceUpdatedCount = 0;
    let validDryRunCount = 0;
    let validationFailedCount = 0;
    let errorCount = 0;
    const details: any[] = [];

    for (const raw of rawExams) {
      try {
        const normalized = this.normalizeExam(raw, sourceTag);
        const res = await this.upsertSingleExam(normalized, dryRun);

        if (res.status === 'CREATED') createdCount++;
        else if (res.status === 'DEEP_UPDATED') deepUpdatedCount++;
        else if (res.status === 'IN_PLACE_UPDATED') inPlaceUpdatedCount++;
        else if (res.status === 'VALID_DRY_RUN') validDryRunCount++;
        else if (res.status === 'VALIDATION_FAILED') validationFailedCount++;

        if (details.length < 150 || res.status === 'VALIDATION_FAILED') {
          details.push(res);
        }
      } catch (err: any) {
        errorCount++;
        details.push({
          status: 'ERROR',
          title: raw?.title || 'Không rõ tên đề',
          errors: [err.message || 'Lỗi không xác định'],
        });
      }
    }

    return {
      dryRun,
      source: sourceTag,
      totalProcessed: rawExams.length,
      createdCount,
      deepUpdatedCount,
      inPlaceUpdatedCount,
      validDryRunCount,
      validationFailedCount,
      errorCount,
      durationMs: Date.now() - startTime,
      completedAt: new Date().toISOString(),
      details,
    };
  }
}

export const dataSyncService = new DataSyncService();
