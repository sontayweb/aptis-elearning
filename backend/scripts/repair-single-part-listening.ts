import { PrismaClient, QuestionType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('=== BẮT ĐẦU CHUẨN HÓA CÁC BỘ ĐỀ LISTENING THEO PART LẺ (SINGLE-PART) ===\n');

  const catalogPath = path.resolve(__dirname, '../../tools/data/aptiskytich/exam_sets_catalog.json');
  const questionsPath = path.resolve(__dirname, '../../tools/data/aptiskytich/all_exam_questions.json');

  if (!fs.existsSync(catalogPath) || !fs.existsSync(questionsPath)) {
    throw new Error('Không tìm thấy file catalog hoặc questions');
  }

  const catalog: any[] = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const listeningCatalog = catalog.filter((c: any) => c.skill === 'listening');
  const allQ: any[] = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  const qMap = new Map<string, any[]>();
  for (const q of allQ) {
    if (!qMap.has(q.exam_set_id)) qMap.set(q.exam_set_id, []);
    qMap.get(q.exam_set_id)!.push(q);
  }

  // Lấy toàn bộ đề single-part trong database
  const singlePartExams = await prisma.exam.findMany({
    where: {
      skill: 'LISTENING',
      parts: {
        some: {},
      },
    },
    include: {
      parts: {
        include: {
          questions: true,
        },
      },
    },
  });

  const singleExamsOnly = singlePartExams.filter((e) => e.parts.length === 1);
  console.log(`Tìm thấy ${singleExamsOnly.length} đề single-part Listening trong database.`);

  let updatedCount = 0;

  for (const exam of singleExamsOnly) {
    const part = exam.parts[0];
    const catItem = listeningCatalog.find(
      (c) => c.title.trim().toLowerCase() === exam.title.trim().toLowerCase()
    );

    if (!catItem) continue;

    const rawQs = qMap.get(catItem.id) || [];
    if (rawQs.length === 0) continue;

    const partName = (catItem.part || part.title || '').toLowerCase();
    const isP2 = partName.includes('part 2') || partName.includes('information matching');
    const isP3 = partName.includes('part 3') || partName.includes('opinion matching');
    const isP4 = partName.includes('part 4') || partName.includes('monologue');
    const isP1 = partName.includes('part 1') || partName.includes('information recognition');

    let newQuestions: any[] = [];
    let updatedPartTitle = part.title;
    let instructions = part.instructions;
    let audioUrl = part.audio_url || rawQs[0]?.audio_url || null;

    if (isP2) {
      updatedPartTitle = 'Part 2 - Information Matching';
      const p2Raw = rawQs[0];
      const infoItems: any[] = p2Raw?.extra_data?.infoItems || [];
      const allInfoTexts = infoItems.map((item: any) => item.text);
      const speakers = ['A', 'B', 'C', 'D'];

      instructions = p2Raw?.question_text || 'Four people are talking. Match each person to the correct information.';

      if (infoItems.length > 0) {
        newQuestions = speakers.map((spk, idx) => {
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
      }
    } else if (isP3) {
      updatedPartTitle = 'Part 3 - Opinion Matching';
      const opinionOptions = ['Man', 'Woman', 'Both'];
      instructions = catItem.description || 'Listen to the conversation. Identify who expresses each opinion.';

      newQuestions = rawQs.map((q: any, qIdx: number) => {
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
    } else if (isP4) {
      updatedPartTitle = 'Part 4 - Monologue Comprehension';
      instructions = catItem.description || 'Listen to the talk and answer the questions.';

      newQuestions = rawQs.map((q: any, qIdx: number) => {
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
    } else if (isP1) {
      updatedPartTitle = 'Part 1 - Information Recognition';
      instructions = catItem.description || 'Listen to the audio and answer the questions.';

      newQuestions = rawQs.map((q: any, qIdx: number) => {
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
    }

    if (newQuestions.length > 0) {
      // Xóa câu trả lời cũ liên quan (nếu có)
      const existingQIds = part.questions.map((q) => q.id);
      if (existingQIds.length > 0) {
        await prisma.submissionAnswer.deleteMany({ where: { question_id: { in: existingQIds } } });
      }

      // Xóa câu hỏi cũ của part
      await prisma.question.deleteMany({ where: { part_id: part.id } });

      // Cập nhật part và tạo lại questions chuẩn
      await prisma.examPart.update({
        where: { id: part.id },
        data: {
          title: updatedPartTitle,
          instructions,
          audio_url: audioUrl,
          questions: {
            create: newQuestions,
          },
        },
      });

      updatedCount++;
      if (updatedCount % 20 === 0 || updatedCount === 1) {
        console.log(`   └─ Đã chuẩn hóa ${updatedCount}/${singleExamsOnly.length} đề lẻ: "${exam.title}" (${newQuestions.length} câu)`);
      }
    }
  }

  console.log(`\n🎉 HOÀN TẤT CHUẨN HÓA ${updatedCount} BỘ ĐỀ SINGLE-PART LISTENING!`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
