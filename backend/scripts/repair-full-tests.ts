import { PrismaClient, ExamSkill, QuestionType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function mapQuestionType(typeStr: string | null | undefined): QuestionType {
  if (!typeStr) return QuestionType.MULTIPLE_CHOICE;
  const t = typeStr.toLowerCase().trim();
  if (t === 'speaking' || t === 'speaking_response' || t === 'speaking_audio') return QuestionType.SPEAKING_AUDIO;
  if (t === 'writing' || t === 'essay') return QuestionType.ESSAY;
  if (t === 'gap_fill') return QuestionType.GAP_FILL;
  if (t === 'text_cohesion' || t === 'sentence_order') return QuestionType.SENTENCE_ORDER;
  if (t === 'matching' || t === 'opinion_matching' || t === 'long_reading' || t === 'vocab_matching' || t === 'listening_matching') {
    return QuestionType.MATCHING;
  }
  return QuestionType.MULTIPLE_CHOICE;
}

async function main() {
  console.log('=== BẮT ĐẦU CHUẨN HÓA 26 ĐỀ THI THỬ FULL TESTS (5 KỸ NĂNG) ===\n');

  const toolsDataDir = path.resolve(__dirname, '../../tools/data/aptiskytich');
  const fullTestsFile = path.join(toolsDataDir, 'full_tests.json');
  const catalogFile = path.join(toolsDataDir, 'exam_sets_catalog.json');
  const questionsFile = path.join(toolsDataDir, 'all_exam_questions.json');

  if (!fs.existsSync(fullTestsFile) || !fs.existsSync(catalogFile) || !fs.existsSync(questionsFile)) {
    throw new Error('Thiếu file dữ liệu Kỳ Tích Full Tests');
  }

  const fullTests = JSON.parse(fs.readFileSync(fullTestsFile, 'utf-8'));
  const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf-8'));
  const allQuestions = JSON.parse(fs.readFileSync(questionsFile, 'utf-8'));

  const setsMap = new Map<string, any>();
  for (const s of catalog) setsMap.set(s.id, s);

  const questionsBySet = new Map<string, any[]>();
  for (const q of allQuestions) {
    if (!questionsBySet.has(q.exam_set_id)) questionsBySet.set(q.exam_set_id, []);
    questionsBySet.get(q.exam_set_id)!.push(q);
  }

  let count = 0;

  for (const ft of fullTests) {
    try {
      const ftTitle = `Đề thi thử Aptis ESOL Full Test ${ft.title.replace('Đề ', '')} (Kỳ Tích)`;
      const partsData: any[] = [];
      let partNumber = 1;

      for (const setId of (ft.examSetIds || [])) {
        const set = setsMap.get(setId);
        if (!set) continue;
        const qList = questionsBySet.get(setId) || [];
        if (qList.length === 0) continue;

        const firstQ = qList[0];
        const qType = firstQ.question_type;

        // 1. Reading Part 1 (gap_fill) có extra_data
        if (qType === 'gap_fill' && firstQ.extra_data?.gaps) {
          const passage: string = firstQ.extra_data.passage || firstQ.question_text || '';
          const rawGaps: any[] = firstQ.extra_data.gaps || [];
          const sentences = passage.split(/(?<=[.?!])\s+/);

          const qItems: any[] = [];
          let gapNum = 1;
          for (let gIdx = 0; gIdx < rawGaps.length; gIdx++) {
            const g = rawGaps[gIdx];
            if (!g.options || g.options.length === 0) continue;
            const matchedSent = sentences.find((s) => s.includes(`{${gapNum}}`)) || `Sentence with gap ${gapNum}`;
            const promptText = matchedSent.replace(new RegExp(`\\{${gapNum}\\}`, 'g'), '[gap]');
            const corAns = g.options[g.correct] || g.options[0];

            qItems.push({
              question_number: gapNum,
              question_type: QuestionType.GAP_FILL,
              prompt: promptText,
              options: g.options,
              correct_answer: corAns,
              explanation: firstQ.explanation || null,
              max_score: 1.4,
            });
            gapNum++;
          }

          partsData.push({
            part_number: partNumber++,
            title: `READING - Part 1 - Sentence Comprehension`,
            instructions: firstQ.extra_data.instruction || 'Choose the word that fits in the gap.',
            passage_text: passage,
            audio_url: null,
            image_url: null,
            questions: { create: qItems },
          });
          continue;
        }

        // 2. Reading Part 2 (text_cohesion) có extra_data
        if (qType === 'text_cohesion' && firstQ.extra_data?.sentences) {
          const sList: any[] = firstQ.extra_data.sentences || [];
          const sectionTitles: string[] = firstQ.extra_data.sectionTitles || ['Đoạn văn 1', 'Đoạn văn 2'];

          const s1All = sList.filter((s) => s.correctPosition >= 1 && s.correctPosition <= 5);
          const s1Fixed = s1All.find((s) => s.correctPosition === 1) || s1All[0];
          const s1Others = s1All.filter((s) => s.correctPosition !== 1);
          const s1Formatted = s1Others.map((s) => ({ id: `s${s.correctPosition}`, text: s.text }));

          const s2All = sList.filter((s) => s.correctPosition >= 6 && s.correctPosition <= 10);
          const s2Fixed = s2All.find((s) => s.correctPosition === 6) || s2All[0];
          const s2Others = s2All.filter((s) => s.correctPosition !== 6);
          const s2Formatted = s2Others.map((s) => ({ id: `s${s.correctPosition}`, text: s.text }));

          const p2Questions = [
            {
              question_number: 1,
              question_type: QuestionType.SENTENCE_ORDER,
              prompt: sectionTitles[0] || 'Đoạn văn 1',
              options: {
                title: sectionTitles[0] || 'Đoạn văn 1',
                fixedSentence: s1Fixed?.text || '',
                sentences: s1Formatted,
              },
              correct_answer: JSON.stringify(['s2', 's3', 's4', 's5']),
              explanation: firstQ.explanation || null,
              max_score: 8.5,
            },
            {
              question_number: 2,
              question_type: QuestionType.SENTENCE_ORDER,
              prompt: sectionTitles[1] || 'Đoạn văn 2',
              options: {
                title: sectionTitles[1] || 'Đoạn văn 2',
                fixedSentence: s2Fixed?.text || '',
                sentences: s2Formatted,
              },
              correct_answer: JSON.stringify(['s7', 's8', 's9', 's10']),
              explanation: firstQ.explanation || null,
              max_score: 8.5,
            },
          ];

          partsData.push({
            part_number: partNumber++,
            title: `READING - Part 2 - Text Cohesion`,
            instructions: firstQ.extra_data.instruction || 'Put the sentences in the correct order.',
            passage_text: null,
            audio_url: null,
            image_url: null,
            questions: { create: p2Questions },
          });
          continue;
        }

        // 3. Reading Part 3 (opinion_matching) có extra_data
        if (qType === 'opinion_matching' && firstQ.extra_data?.people) {
          const people: any[] = firstQ.extra_data.people || [];
          const statements: any[] = firstQ.extra_data.statements || [];
          const passage = people.map((p) => `Person ${p.name}:\n${p.text}`).join('\n\n');
          const letters = ['A', 'B', 'C', 'D'];

          const qItems = statements.map((st, idx) => ({
            question_number: idx + 1,
            question_type: QuestionType.MATCHING,
            prompt: st.text,
            options: ['Person A', 'Person B', 'Person C', 'Person D'],
            correct_answer: `Person ${letters[st.correctPerson] || 'A'}`,
            explanation: firstQ.explanation || null,
            max_score: 1.85,
          }));

          partsData.push({
            part_number: partNumber++,
            title: `READING - Part 3 - Opinion Matching`,
            instructions: firstQ.extra_data.instruction || 'Read the texts and answer the questions.',
            passage_text: passage,
            audio_url: null,
            image_url: null,
            questions: { create: qItems },
          });
          continue;
        }

        // 4. Reading Part 4 (long_reading) có extra_data
        if (qType === 'long_reading' && firstQ.extra_data?.paragraphs) {
          const paragraphs = (firstQ.extra_data.paragraphs || []).slice().sort((a: any, b: any) => a.index - b.index);
          const headings = firstQ.extra_data.headings || [];
          const allHeadings = headings.map((h: any) => h.text);

          const qItems = paragraphs.map((para: any) => {
            const matchH = headings.find((h: any) => h.paragraphIndex === para.index);
            return {
              question_number: para.index,
              question_type: QuestionType.MATCHING,
              prompt: `Paragraph ${para.index}: ${para.text}`,
              options: allHeadings,
              correct_answer: matchH ? matchH.text : allHeadings[0] || '',
              explanation: firstQ.explanation || null,
              max_score: 1.85,
            };
          });

          partsData.push({
            part_number: partNumber++,
            title: `READING - Part 4 - Long Text Comprehension`,
            instructions: firstQ.extra_data.instruction || 'Choose a heading for each paragraph.',
            passage_text: firstQ.extra_data.title || 'Long Reading',
            audio_url: null,
            image_url: null,
            questions: { create: qItems },
          });
          continue;
        }

        // 5. Listening Part 2 (listening_matching) có extra_data
        if (qType === 'listening_matching' && firstQ.extra_data?.infoItems) {
          const infoItems: any[] = firstQ.extra_data.infoItems || [];
          const allInfoTexts = infoItems.map((item) => item.text);
          const speakers = ['A', 'B', 'C', 'D'];

          const qItems = speakers.map((spk, idx) => {
            const matchedItem = infoItems.find((item) => item.correctPerson === spk);
            return {
              question_number: idx + 1,
              question_type: QuestionType.MATCHING,
              prompt: `Speaker ${spk}`,
              options: allInfoTexts,
              correct_answer: matchedItem ? matchedItem.text : allInfoTexts[idx] || '',
              explanation: firstQ.explanation || null,
              max_score: 1.25,
            };
          });

          partsData.push({
            part_number: partNumber++,
            title: `LISTENING - Part 2 - Information Matching`,
            instructions: firstQ.question_text || 'Match each person to the correct information.',
            passage_text: null,
            audio_url: firstQ.audio_url || null,
            image_url: null,
            questions: { create: qItems },
          });
          continue;
        }

        // 6. Các parts thông thường (Speaking, Writing, Listening Part 1, 3, 4, Grammar)
        partsData.push({
          part_number: partNumber++,
          title: `${set.skill ? set.skill.toUpperCase() : 'SKILL'} - ${set.part || set.title}`,
          instructions: set.description || firstQ.question_text || null,
          passage_text: firstQ.passage_text || null,
          audio_url: firstQ.audio_url || null,
          image_url: firstQ.image_url || null,
          questions: {
            create: qList.map((q: any, qIdx: number) => {
              let cor = q.correct_answer !== null && q.correct_answer !== undefined ? String(q.correct_answer) : null;
              // Nếu là trắc nghiệm có options và cor là số index
              if (Array.isArray(q.options) && cor !== null) {
                const idx = parseInt(cor, 10);
                if (!isNaN(idx) && q.options[idx]) {
                  cor = q.options[idx];
                }
              }

              return {
                question_number: q.order_index ?? (qIdx + 1),
                question_type: mapQuestionType(q.question_type),
                prompt: q.question_text || `Câu hỏi ${qIdx + 1}`,
                options: Array.isArray(q.options) ? q.options : (q.options || null),
                correct_answer: cor,
                explanation: q.explanation || null,
                max_score: q.question_type?.includes('speaking') ? 5.0 : (q.question_type?.includes('writing') ? 10.0 : 1.0),
              };
            }),
          },
        });
      }

      // Xóa các parts cũ của đề thi thử và cập nhật lại
      const existingExam = await prisma.exam.findFirst({
        where: { title: ftTitle },
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
            parts: { create: partsData },
          },
        });
        console.log(`✅ [${count + 1}/26] Đã cập nhật chuẩn hóa: "${ftTitle}" (${partsData.length} parts)`);
      } else {
        await prisma.exam.create({
          data: {
            title: ftTitle,
            description: `Đề thi thử Aptis ESOL 5 kỹ năng (Speaking, Listening, Reading, Writing, Grammar & Vocabulary) theo chuẩn format British Council từ Aptis Kỳ Tích.`,
            skill: ExamSkill.FULL_TEST,
            duration_minutes: 162,
            is_pro: ft.access_tier === 'pro',
            is_published: true,
            source: 'APTIS_KYTICH',
            parts: { create: partsData },
          },
        });
        console.log(`✅ [${count + 1}/26] Đã tạo mới: "${ftTitle}" (${partsData.length} parts)`);
      }

      count++;
    } catch (e: any) {
      console.warn(`Lỗi chuẩn hóa Full Test ${ft.title}:`, e.message);
    }
  }

  console.log(`\n🎉 HOÀN TẤT CHUẨN HÓA ${count}/26 ĐỀ THI THỬ FULL TESTS!`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
