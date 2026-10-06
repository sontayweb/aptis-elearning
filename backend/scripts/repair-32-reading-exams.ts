import { PrismaClient, ExamSkill, QuestionType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('=== BẮT ĐẦU CHUẨN HÓA 32 BỘ ĐỀ FULL READING TỪ ALL_EXAM_QUESTIONS.JSON ===\n');

  const catalogPath = path.resolve(__dirname, '../../tools/data/aptiskytich/exam_sets_catalog.json');
  const questionsPath = path.resolve(__dirname, '../../tools/data/aptiskytich/all_exam_questions.json');

  if (!fs.existsSync(catalogPath) || !fs.existsSync(questionsPath)) {
    throw new Error('Không tìm thấy file dữ liệu catalog hoặc questions');
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const readingCatalog = catalog.filter((c: any) => c.skill === 'reading');
  const allQ = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  const qMap = new Map<string, any[]>();
  for (const q of allQ) {
    if (!qMap.has(q.exam_set_id)) qMap.set(q.exam_set_id, []);
    qMap.get(q.exam_set_id)!.push(q);
  }

  const p4Unused = readingCatalog.filter((c: any) =>
    c.part && (c.part.includes('Part 4') || c.part.includes('Long Text'))
  );

  let successCount = 0;

  for (let i = 1; i <= 32; i++) {
    const code = i < 10 ? `0${i}` : `${i}`;
    const fullExamTitle = `Đề ${code} — Full Reading · 4 Parts`;
    const isPro = i > 3;

    // Tìm 4 catalog sets cho đề i
    const deCatalog = readingCatalog.filter((c: any) => {
      const match = c.title.match(/^Đề\s+(\d+)/i);
      return match && parseInt(match[1], 10) === i;
    });

    const p1Cat = deCatalog.find((c: any) => c.part && c.part.includes('Part 1'));
    const p2Cat = deCatalog.find((c: any) => c.part && c.part.includes('Part 2'));
    const p3Cat = deCatalog.find((c: any) => c.part && (c.part.includes('Part 3') || c.part.includes('Gap Fill')));
    let p4Cat = deCatalog.find((c: any) => c.part && (c.part.includes('Part 4') || c.part.includes('Long Text')));

    if (!p4Cat && i === 7) {
      p4Cat = p4Unused.find((c: any) => c.title.includes('33') || c.title.includes('Australia (Version 2)'));
    }

    if (!p1Cat || !p2Cat || !p3Cat || !p4Cat) {
      console.warn(`⚠️ Thiếu catalog part cho Đề ${code}`);
      continue;
    }

    const p1Q = qMap.get(p1Cat.id)?.[0];
    const p2Q = qMap.get(p2Cat.id)?.[0];
    const p3Q = qMap.get(p3Cat.id)?.[0];
    const p4Q = qMap.get(p4Cat.id)?.[0];

    if (!p1Q || !p2Q || !p3Q || !p4Q) {
      console.warn(`⚠️ Thiếu question cho Đề ${code}`);
      continue;
    }

    const partsToCreate: any[] = [];

    // =========================================================================
    // PART 1: Sentence comprehension (Gap fill)
    // =========================================================================
    const p1Passage: string = p1Q.extra_data?.passage || p1Q.question_text || '';
    const p1RawGaps: any[] = p1Q.extra_data?.gaps || [];
    // Tách câu từ passage để làm prompt cho từng gap
    const sentences = p1Passage.split(/(?<=[.?!])\s+/);

    const p1Questions: any[] = [];
    let gapNum = 1;
    for (let gIdx = 0; gIdx < p1RawGaps.length; gIdx++) {
      const g = p1RawGaps[gIdx];
      if (!g.options || g.options.length === 0) continue; // Bỏ qua câu mẫu index 0

      // Tìm câu tương ứng chứa {gapNum}
      const matchedSent = sentences.find((s) => s.includes(`{${gapNum}}`)) || `Sentence with gap ${gapNum}`;
      // Thay {gapNum} thành [gap]
      const promptText = matchedSent.replace(new RegExp(`\\{${gapNum}\\}`, 'g'), '[gap]');

      const corAns = g.options[g.correct] || g.options[0];
      p1Questions.push({
        question_number: gapNum,
        question_type: QuestionType.GAP_FILL,
        prompt: promptText,
        options: g.options,
        correct_answer: corAns,
        explanation: p1Q.explanation || null,
        max_score: 1.4,
      });
      gapNum++;
    }

    partsToCreate.push({
      part_number: 1,
      title: 'Part 1 – Sentence comprehension',
      instructions: p1Q.extra_data?.instruction || 'Choose the word that fits in the gap. The first one is done for you.',
      passage_text: p1Passage,
      audio_url: null,
      image_url: null,
      questions: { create: p1Questions },
    });

    // =========================================================================
    // PART 2: Text cohesion (2 Stories: Story 1 & Story 2)
    // =========================================================================
    const p2Sentences: any[] = p2Q.extra_data?.sentences || [];
    const sectionTitles: string[] = p2Q.extra_data?.sectionTitles || ['Đoạn văn 1', 'Đoạn văn 2'];

    // Story 1: correctPosition 1..5
    const story1All = p2Sentences.filter((s: any) => s.correctPosition >= 1 && s.correctPosition <= 5);
    const s1Fixed = story1All.find((s: any) => s.correctPosition === 1) || story1All[0];
    const s1Others = story1All.filter((s: any) => s.correctPosition !== 1);
    const s1FormattedSentences = s1Others.map((s: any) => ({
      id: `s${s.correctPosition}`,
      text: s.text,
    }));
    // Thứ tự đúng vị trí 2, 3, 4, 5
    const s1CorrectOrder = ['s2', 's3', 's4', 's5'];

    // Story 2: correctPosition 6..10
    const story2All = p2Sentences.filter((s: any) => s.correctPosition >= 6 && s.correctPosition <= 10);
    const s2Fixed = story2All.find((s: any) => s.correctPosition === 6) || story2All[0];
    const s2Others = story2All.filter((s: any) => s.correctPosition !== 6);
    const s2FormattedSentences = s2Others.map((s: any) => ({
      id: `s${s.correctPosition}`,
      text: s.text,
    }));
    const s2CorrectOrder = ['s7', 's8', 's9', 's10'];

    const p2Questions = [
      {
        question_number: 1,
        question_type: QuestionType.SENTENCE_ORDER,
        prompt: sectionTitles[0] || 'Đoạn văn 1',
        options: {
          title: sectionTitles[0] || 'Đoạn văn 1',
          fixedSentence: s1Fixed?.text || '',
          sentences: s1FormattedSentences,
        },
        correct_answer: JSON.stringify(s1CorrectOrder),
        explanation: p2Q.explanation || null,
        max_score: 8.5,
      },
      {
        question_number: 2,
        question_type: QuestionType.SENTENCE_ORDER,
        prompt: sectionTitles[1] || 'Đoạn văn 2',
        options: {
          title: sectionTitles[1] || 'Đoạn văn 2',
          fixedSentence: s2Fixed?.text || '',
          sentences: s2FormattedSentences,
        },
        correct_answer: JSON.stringify(s2CorrectOrder),
        explanation: p2Q.explanation || null,
        max_score: 8.5,
      },
    ];

    partsToCreate.push({
      part_number: 2,
      title: 'Part 2 + 3 – Text cohesion',
      instructions: p2Q.extra_data?.instruction || 'The sentences below make a complete text. Put them in the correct order.',
      passage_text: null,
      audio_url: null,
      image_url: null,
      questions: { create: p2Questions },
    });

    // =========================================================================
    // PART 3: Opinion matching (Part 4 trong cấu trúc đề)
    // =========================================================================
    const people: any[] = p3Q.extra_data?.people || [];
    const statements: any[] = p3Q.extra_data?.statements || [];

    const p3Passage = people.map((p: any) => `Person ${p.name}:\n${p.text}`).join('\n\n');
    const letters = ['A', 'B', 'C', 'D'];

    const p3Questions = statements.map((st: any, idx: number) => {
      const targetLetter = letters[st.correctPerson] || 'A';
      return {
        question_number: idx + 1,
        question_type: QuestionType.MATCHING,
        prompt: st.text,
        options: ['Person A', 'Person B', 'Person C', 'Person D'],
        correct_answer: `Person ${targetLetter}`,
        explanation: p3Q.explanation || null,
        max_score: 1.85,
      };
    });

    partsToCreate.push({
      part_number: 4,
      title: 'Part 4 – Opinion matching',
      instructions: p3Q.extra_data?.instruction || 'Four people respond in the comments. Read the texts and then answer the questions below.',
      passage_text: p3Passage,
      audio_url: null,
      image_url: null,
      questions: { create: p3Questions },
    });

    // =========================================================================
    // PART 4: Long reading (Part 5 trong cấu trúc đề)
    // =========================================================================
    const paragraphs: any[] = (p4Q.extra_data?.paragraphs || []).slice().sort((a: any, b: any) => a.index - b.index);
    const headings: any[] = p4Q.extra_data?.headings || [];
    const allHeadingTexts = headings.map((h: any) => h.text);

    const p4Questions = paragraphs.map((para: any) => {
      const matchH = headings.find((h: any) => h.paragraphIndex === para.index);
      return {
        question_number: para.index,
        question_type: QuestionType.MATCHING,
        prompt: `Paragraph ${para.index}: ${para.text}`,
        options: allHeadingTexts,
        correct_answer: matchH ? matchH.text : allHeadingTexts[0] || '',
        explanation: p4Q.explanation || null,
        max_score: 1.85,
      };
    });

    partsToCreate.push({
      part_number: 5,
      title: 'Part 5 – Long reading',
      instructions: p4Q.extra_data?.instruction || 'Read the passage quickly. Choose a heading for each numbered paragraph from the drop-down box.',
      passage_text: p4Q.extra_data?.title || 'Long Reading',
      audio_url: null,
      image_url: null,
      questions: { create: p4Questions },
    });

    // =========================================================================
    // LƯU HOẶC CẬP NHẬT VÀO DATABASE
    // =========================================================================
    const existingExam = await prisma.exam.findFirst({
      where: { title: fullExamTitle },
      include: { parts: { include: { questions: true } } },
    });

    if (existingExam) {
      // Xóa các part và câu hỏi cũ của exam này
      for (const p of existingExam.parts) {
        await prisma.question.deleteMany({ where: { part_id: p.id } });
      }
      await prisma.examPart.deleteMany({ where: { exam_id: existingExam.id } });

      // Cập nhật lại exam với các parts mới
      await prisma.exam.update({
        where: { id: existingExam.id },
        data: {
          description: `Bài thi luyện tập Full Reading 4 Parts chuẩn Aptis ESOL 2026. Thời gian làm bài 35 phút.`,
          parts: {
            create: partsToCreate,
          },
        },
      });
      console.log(`✅ [${code}/32] Đã cập nhật thành công (giữ nguyên ID ${existingExam.id}): "${fullExamTitle}"`);
    } else {
      const created = await prisma.exam.create({
        data: {
          title: fullExamTitle,
          description: `Bài thi luyện tập Full Reading 4 Parts chuẩn Aptis ESOL 2026. Thời gian làm bài 35 phút.`,
          skill: ExamSkill.READING,
          duration_minutes: 35,
          is_pro: isPro,
          is_published: true,
          source: 'APTIS_KYTICH',
          parts: {
            create: partsToCreate,
          },
        },
      });
      console.log(`✅ [${code}/32] Đã tạo mới: "${fullExamTitle}" (ID: ${created.id})`);
    }

    successCount++;
  }

  console.log(`\n🎉 HOÀN TẤT CHUẨN HÓA ${successCount}/32 BỘ ĐỀ READING!`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
