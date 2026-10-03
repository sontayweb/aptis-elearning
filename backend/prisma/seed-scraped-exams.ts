import { PrismaClient, ExamSkill, QuestionType } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();

async function importSource(sourceName: string, jsonPath: string) {
  if (!fs.existsSync(jsonPath)) {
    console.warn(`⚠️ Không tìm thấy file: ${jsonPath}`);
    return;
  }

  const exams = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`\n🚀 Đang nạp ${exams.length} đề thi từ nguồn [${sourceName}] vào PostgreSQL...`);

  let created = 0;
  let updated = 0;

  for (const ex of exams) {
    try {
      const existing = await prisma.exam.findFirst({
        where: {
          title: ex.title,
          skill: ex.skill as ExamSkill,
          source: ex.source || sourceName
        }
      });

      if (existing) {
        await prisma.exam.update({
          where: { id: existing.id },
          data: {
            description: ex.description,
            duration_minutes: ex.duration_minutes,
            is_pro: ex.is_pro ?? false
          }
        });
        updated++;
      } else {
        await prisma.exam.create({
          data: {
            title: ex.title,
            description: ex.description,
            skill: ex.skill as ExamSkill,
            duration_minutes: ex.duration_minutes,
            is_pro: ex.is_pro ?? false,
            is_published: true,
            source: ex.source || sourceName,
            parts: {
              create: (ex.parts || []).map((p: any) => ({
                part_number: p.part_number,
                title: p.title,
                instructions: p.instructions,
                passage_text: p.passage_text,
                audio_url: p.audio_url,
                image_url: p.image_url,
                questions: {
                  create: (p.questions || []).map((q: any) => ({
                    question_number: q.question_number,
                    question_type: q.question_type as QuestionType,
                    prompt: q.prompt,
                    options: q.options,
                    correct_answer: q.correct_answer,
                    explanation: q.explanation,
                    max_score: q.max_score || 1.0
                  }))
                }
              }))
            }
          }
        });
        created++;
      }

      if ((created + updated) % 100 === 0) {
        console.log(`   └─ Tiến độ: ${created + updated}/${exams.length} (Thêm mới: ${created}, Cập nhật: ${updated})`);
      }
    } catch (err: any) {
      console.warn(`Lỗi nạp đề "${ex.title}":`, err.message);
    }
  }

  console.log(`✅ Hoàn tất [${sourceName}]: Thêm mới ${created} đề, Cập nhật ${updated} đề.`);
}

async function importDictation(setsPath: string, sentencesPath: string) {
  if (!fs.existsSync(setsPath) || !fs.existsSync(sentencesPath)) {
    console.warn(`⚠️ Bỏ qua nạp Dictation (không tìm thấy file json)`);
    return;
  }

  const dictationSets = JSON.parse(fs.readFileSync(setsPath, 'utf-8'));
  const allSentences = JSON.parse(fs.readFileSync(sentencesPath, 'utf-8'));
  console.log(`\n🎧 Đang nạp ${dictationSets.length} bài nghe chép chính tả & ${allSentences.length} câu vào PostgreSQL...`);

  const sentencesBySet = new Map<string, any[]>();
  for (const s of allSentences) {
    if (!sentencesBySet.has(s.set_id)) {
      sentencesBySet.set(s.set_id, []);
    }
    sentencesBySet.get(s.set_id)!.push(s);
  }

  const levelMap: Record<number, any> = {
    1: 'FOUNDATION',
    2: 'MOMENTUM',
    3: 'MASTERY'
  };

  const supabaseAudioBase = 'https://bacoamhbatqpxatrrflz.supabase.co/storage/v1/object/public/audios/';
  let createdLessons = 0;
  let updatedLessons = 0;

  for (const ds of dictationSets) {
    try {
      const sList = sentencesBySet.get(ds.id) || [];
      const lessonLevel = levelMap[ds.level] || 'FOUNDATION';

      const existingLesson = await prisma.dictationLesson.findFirst({
        where: { title: ds.title, level: lessonLevel }
      });

      if (existingLesson) {
        await prisma.dictationLesson.update({
          where: { id: existingLesson.id },
          data: {
            total_sentences: sList.length,
            order_index: ds.sort || 0,
            is_free: ds.level === 1
          }
        });
        updatedLessons++;
      } else {
        await prisma.dictationLesson.create({
          data: {
            title: ds.title,
            level: lessonLevel,
            order_index: ds.sort || 0,
            total_sentences: sList.length,
            is_free: ds.level === 1,
            sentences: {
              create: sList.map((st: any, idx: number) => ({
                order_index: st.sort ?? idx,
                audio_url: st.audio_url ? (st.audio_url.startsWith('http') ? st.audio_url : `${supabaseAudioBase}${st.audio_url}`) : '',
                transcript: st.text || '',
                duration_seconds: (st.end_sec && st.start_sec) ? Math.max(0, st.end_sec - st.start_sec) : 0
              }))
            }
          }
        });
        createdLessons++;
      }
    } catch (err: any) {
      console.warn(`Lỗi nạp bài chính tả "${ds.title}":`, err.message);
    }
  }

  console.log(`✅ Hoàn tất nạp Dictation: Thêm mới ${createdLessons} bài, Cập nhật ${updatedLessons} bài.`);
}

async function main() {
  const toolsDataDir = path.resolve(__dirname, '../../tools/data');

  // 1. Nạp Aptis Academy (851 đề đã khử trùng lặp)
  await importSource('APTIS_ACADEMY', path.join(toolsDataDir, 'aptisacademy/normalized_exams.json'));

  // 2. Nạp Aptis Kỳ Tích (873 đề lẻ & Full Tests)
  await importSource('APTIS_KYTICH', path.join(toolsDataDir, 'aptiskytich/normalized_exams.json'));

  // 3. Nạp Nghe chép chính tả Kỳ Tích (670 bài, 3,852 câu)
  await importDictation(
    path.join(toolsDataDir, 'aptiskytich/dictation_sets.json'),
    path.join(toolsDataDir, 'aptiskytich/all_dictation_sentences.json')
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

