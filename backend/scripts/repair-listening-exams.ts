import { PrismaClient, ExamSkill, QuestionType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('=== BẮT ĐẦU CHUẨN HÓA 36 BỘ ĐỀ FULL LISTENING TỪ ALL_EXAM_QUESTIONS.JSON ===\n');

  const catalogPath = path.resolve(__dirname, '../../tools/data/aptiskytich/exam_sets_catalog.json');
  const questionsPath = path.resolve(__dirname, '../../tools/data/aptiskytich/all_exam_questions.json');

  if (!fs.existsSync(catalogPath) || !fs.existsSync(questionsPath)) {
    throw new Error('Không tìm thấy file catalog hoặc questions');
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const listeningCatalog = catalog.filter((c: any) => c.skill === 'listening');
  const allQ = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  const qMap = new Map<string, any[]>();
  for (const q of allQ) {
    if (!qMap.has(q.exam_set_id)) qMap.set(q.exam_set_id, []);
    qMap.get(q.exam_set_id)!.push(q);
  }

  const listByDe: Record<number, any[]> = {};
  listeningCatalog.forEach((s: any) => {
    const m = s.title.match(/^Đề\s+(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!listByDe[n]) listByDe[n] = [];
      listByDe[n].push(s);
    }
  });

  const nums = Object.keys(listByDe).map(Number).sort((a, b) => a - b);
  let updatedCount = 0;

  for (const num of nums) {
    const code = num < 10 ? `0${num}` : `${num}`;
    const fullExamTitle = `Đề ${code} — Full Listening · 4 Parts`;
    const isPro = num > 3;

    const items = listByDe[num] || [];
    const p1Cat = items.find((c) => c.part && c.part.includes('Part 1'));
    const p2Cat = items.find((c) => c.part && c.part.includes('Part 2'));
    const p3Cat = items.find((c) => c.part && c.part.includes('Part 3'));
    const p4Cat = items.find((c) => c.part && c.part.includes('Part 4'));

    if (!p1Cat || !p2Cat || !p3Cat || !p4Cat) {
      continue;
    }

    const p1Qs = qMap.get(p1Cat.id) || [];
    const p2Qs = qMap.get(p2Cat.id) || [];
    const p3Qs = qMap.get(p3Cat.id) || [];
    const p4Qs = qMap.get(p4Cat.id) || [];

    if (p1Qs.length === 0 || p2Qs.length === 0 || p3Qs.length === 0 || p4Qs.length === 0) {
      continue;
    }

    const partsToCreate: any[] = [];

    // =========================================================================
    // PART 1: Information Recognition (13 câu hỏi)
    // =========================================================================
    const p1Questions = p1Qs.map((q: any, qIdx: number) => {
      const opts = Array.isArray(q.options) ? q.options : [];
      let corAns = String(q.correct_answer || '');
      const numIdx = parseInt(corAns, 10);
      if (!isNaN(numIdx) && opts[numIdx]) {
        corAns = opts[numIdx];
      }

      return {
        question_number: q.order_index ?? (qIdx + 1),
        question_type: QuestionType.MULTIPLE_CHOICE,
        prompt: q.question_text || `Question ${qIdx + 1}`,
        options: opts,
        correct_answer: corAns,
        explanation: q.explanation || null,
        max_score: 1.0,
      };
    });

    partsToCreate.push({
      part_number: 1,
      title: 'Part 1: Part 1 - Information Recognition',
      instructions: p1Cat.description || 'Listen to the audio and answer the questions.',
      passage_text: null,
      audio_url: p1Qs[0]?.audio_url || null,
      image_url: null,
      questions: { create: p1Questions },
    });

    // =========================================================================
    // PART 2: Information Matching (4 Speakers nối 6 thông tin)
    // =========================================================================
    const p2Raw = p2Qs[0];
    const infoItems: any[] = p2Raw?.extra_data?.infoItems || [];
    const allInfoTexts = infoItems.map((item: any) => item.text);

    // 4 câu hỏi cho 4 người nói A, B, C, D
    const speakers = ['A', 'B', 'C', 'D'];
    const p2Questions = speakers.map((spk, idx) => {
      const matchedItem = infoItems.find((item: any) => item.correctPerson === spk);
      const corAns = matchedItem ? matchedItem.text : allInfoTexts[idx] || '';

      return {
        question_number: idx + 1,
        question_type: QuestionType.MATCHING,
        prompt: `Speaker ${spk}`,
        options: allInfoTexts,
        correct_answer: corAns,
        explanation: p2Raw.explanation || null,
        max_score: 1.25,
      };
    });

    partsToCreate.push({
      part_number: 2,
      title: 'Part 2: Part 2 - Information Matching',
      instructions: p2Raw.question_text || 'Four people are talking. Match each person to the correct information.',
      passage_text: null,
      audio_url: p2Raw.audio_url || null,
      image_url: null,
      questions: { create: p2Questions },
    });

    // =========================================================================
    // PART 3: Short Conversations (4 quan điểm Man / Woman / Both)
    // =========================================================================
    const opinionOptions = ['Man', 'Woman', 'Both'];
    const p3Questions = p3Qs.map((q: any, qIdx: number) => {
      let corAns = String(q.correct_answer || '');
      const numIdx = parseInt(corAns, 10);
      if (!isNaN(numIdx) && opinionOptions[numIdx]) {
        corAns = opinionOptions[numIdx];
      } else if (!opinionOptions.includes(corAns)) {
        corAns = 'Both';
      }

      return {
        question_number: q.order_index ?? (qIdx + 1),
        question_type: QuestionType.MATCHING,
        prompt: q.question_text || `Statement ${qIdx + 1}`,
        options: opinionOptions,
        correct_answer: corAns,
        explanation: q.explanation || null,
        max_score: 1.25,
      };
    });

    partsToCreate.push({
      part_number: 3,
      title: 'Part 3: Part 3 - Opinion Matching',
      instructions: p3Cat.description || 'Listen to the conversation. Identify who expresses each opinion.',
      passage_text: null,
      audio_url: p3Qs[0]?.audio_url || null,
      image_url: null,
      questions: { create: p3Questions },
    });

    // =========================================================================
    // PART 4: Monologue Comprehension (4 câu hỏi)
    // =========================================================================
    const p4Questions = p4Qs.map((q: any, qIdx: number) => {
      const opts = Array.isArray(q.options) ? q.options : [];
      let corAns = String(q.correct_answer || '');
      const numIdx = parseInt(corAns, 10);
      if (!isNaN(numIdx) && opts[numIdx]) {
        corAns = opts[numIdx];
      }

      return {
        question_number: q.order_index ?? (qIdx + 1),
        question_type: QuestionType.MULTIPLE_CHOICE,
        prompt: q.question_text || `Question ${qIdx + 1}`,
        options: opts,
        correct_answer: corAns,
        explanation: q.explanation || null,
        max_score: 1.25,
      };
    });

    partsToCreate.push({
      part_number: 4,
      title: 'Part 4: Part 4 - Monologue Comprehension',
      instructions: p4Cat.description || 'Listen to the talk and answer the questions.',
      passage_text: null,
      audio_url: p4Qs[0]?.audio_url || null,
      image_url: null,
      questions: { create: p4Questions },
    });

    // =========================================================================
    // CẬP NHẬT HOẶC TẠO MỚI TRONG DATABASE
    // =========================================================================
    const existingExam = await prisma.exam.findFirst({
      where: { title: fullExamTitle },
      include: { parts: { include: { questions: true } } },
    });

    if (existingExam) {
      for (const p of existingExam.parts) {
        await prisma.question.deleteMany({ where: { part_id: p.id } });
      }
      await prisma.examPart.deleteMany({ where: { exam_id: existingExam.id } });

      await prisma.exam.update({
        where: { id: existingExam.id },
        data: {
          description: `Bài thi luyện tập Full Listening 4 Parts chuẩn Aptis ESOL 2026. Thời gian làm bài 40 phút.`,
          parts: {
            create: partsToCreate,
          },
        },
      });
      console.log(`✅ [${code}] Đã chuẩn hóa Full Listening (giữ nguyên ID ${existingExam.id}): "${fullExamTitle}"`);
    } else {
      const created = await prisma.exam.create({
        data: {
          title: fullExamTitle,
          description: `Bài thi luyện tập Full Listening 4 Parts chuẩn Aptis ESOL 2026. Thời gian làm bài 40 phút.`,
          skill: ExamSkill.LISTENING,
          duration_minutes: 40,
          is_pro: isPro,
          is_published: true,
          source: 'APTIS_KYTICH',
          parts: {
            create: partsToCreate,
          },
        },
      });
      console.log(`✅ [${code}] Đã tạo mới: "${fullExamTitle}" (ID: ${created.id})`);
    }

    updatedCount++;
  }

  console.log(`\n🎉 HOÀN TẤT CHUẨN HÓA ${updatedCount} BỘ ĐỀ FULL LISTENING!`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
