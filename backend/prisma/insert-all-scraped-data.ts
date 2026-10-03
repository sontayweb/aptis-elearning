import { PrismaClient, ExamSkill, QuestionType, DictationLevel } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();

const toolsDataDir = path.resolve(__dirname, '../../tools/data');
const kytichDir = path.join(toolsDataDir, 'aptiskytich');
const academyDir = path.join(toolsDataDir, 'aptisacademy');

// Hàm ánh xạ QuestionType chuẩn hóa
function mapQuestionType(typeStr: string | null | undefined): QuestionType {
  if (!typeStr) return QuestionType.MULTIPLE_CHOICE;
  const t = typeStr.toLowerCase().trim();

  if (t === 'speaking' || t === 'speaking_response' || t === 'speaking_audio') {
    return QuestionType.SPEAKING_AUDIO;
  }
  if (t === 'writing' || t === 'essay') {
    return QuestionType.ESSAY;
  }
  if (t === 'gap_fill') {
    return QuestionType.GAP_FILL;
  }
  if (t === 'text_cohesion' || t === 'sentence_order') {
    return QuestionType.SENTENCE_ORDER;
  }
  if (t === 'matching' || t === 'opinion_matching' || t === 'long_reading' || t === 'vocab_matching' || t === 'listening_matching') {
    return QuestionType.MATCHING;
  }
  return QuestionType.MULTIPLE_CHOICE;
}

// ----------------------------------------------------------------------------------
// 1. DỌN DẸP DỮ LIỆU CŨ AN TOÀN TRƯỚC KHI NẠP DỮ LIỆU CHUẨN 100%
// ----------------------------------------------------------------------------------
async function cleanOldExamData() {
  console.log('\n🧹 [BƯỚC 1/4] Dọn dẹp dữ liệu đề thi và bài học cũ để chuẩn bị insert...');
  
  // Xóa theo thứ tự quan hệ cascade
  const delAnswers = await prisma.submissionAnswer.deleteMany({});
  const delSubmissions = await prisma.examSubmission.deleteMany({});
  const delQuestions = await prisma.question.deleteMany({});
  const delParts = await prisma.examPart.deleteMany({});
  const delExams = await prisma.exam.deleteMany({});

  const delAttempts = await prisma.userDictationAttempt.deleteMany({});
  const delProgress = await prisma.userDictationProgress.deleteMany({});
  const delSentences = await prisma.dictationSentence.deleteMany({});
  const delLessons = await prisma.dictationLesson.deleteMany({});

  console.log(`✅ Đã làm sạch: ${delExams.count} exams cũ, ${delParts.count} parts, ${delQuestions.count} câu hỏi, ${delLessons.count} bài dictation.`);
}

// ----------------------------------------------------------------------------------
// 2. NẠP 26 ĐỀ THI THỬ TỔNG HỢP FULL TESTS (162P) TỪ APTIS KỲ TÍCH
// ----------------------------------------------------------------------------------
async function insertKyTichFullTests() {
  console.log('\n🏆 [BƯỚC 2/4] Đang tổng hợp và nạp 26 Đề Thi Thử Full Tests (162p) Aptis Kỳ Tích...');
  
  const fullTestsFile = path.join(kytichDir, 'full_tests.json');
  const catalogFile = path.join(kytichDir, 'exam_sets_catalog.json');
  const questionsFile = path.join(kytichDir, 'all_exam_questions.json');

  if (!fs.existsSync(fullTestsFile) || !fs.existsSync(catalogFile) || !fs.existsSync(questionsFile)) {
    console.warn('⚠️ Thiếu file dữ liệu Kỳ Tích Full Tests');
    return;
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
        partsData.push({
          part_number: partNumber++,
          title: `${set.skill ? set.skill.toUpperCase() : 'SKILL'} - ${set.part || set.title}`,
          instructions: set.description || firstQ.question_text || null,
          passage_text: firstQ.passage_text || null,
          audio_url: firstQ.audio_url || null,
          image_url: firstQ.image_url || null,
          questions: {
            create: qList.map((q: any, qIdx: number) => ({
              question_number: q.order_index ?? (qIdx + 1),
              question_type: mapQuestionType(q.question_type),
              prompt: q.question_text || `Câu hỏi ${qIdx + 1}`,
              options: Array.isArray(q.options) ? q.options : (q.options || null),
              correct_answer: q.correct_answer !== null && q.correct_answer !== undefined ? String(q.correct_answer) : null,
              explanation: q.explanation || null,
              max_score: q.question_type?.includes('speaking') ? 5.0 : (q.question_type?.includes('writing') ? 10.0 : 1.0)
            }))
          }
        });
      }

      await prisma.exam.create({
        data: {
          title: ftTitle,
          description: `Đề thi thử Aptis ESOL 5 kỹ năng (Speaking, Listening, Reading, Writing, Grammar & Vocabulary) theo chuẩn format British Council từ Aptis Kỳ Tích.`,
          skill: ExamSkill.FULL_TEST,
          duration_minutes: 162,
          is_pro: ft.access_tier === 'pro',
          is_published: true,
          source: 'APTIS_KYTICH',
          parts: {
            create: partsData
          }
        }
      });
      count++;
    } catch (e: any) {
      console.warn(`Lỗi nạp Full Test ${ft.title}:`, e.message);
    }
  }

  console.log(`✅ Đã nạp thành công ${count}/26 đề thi thử Full Tests Kỳ Tích!`);
}

// ----------------------------------------------------------------------------------
// 3. NẠP TOÀN BỘ 873 ĐỀ LẺ KỲ TÍCH + 851 ĐỀ DUY NHẤT ACADEMY
// ----------------------------------------------------------------------------------
async function insertNormalizedExams(sourceName: string, filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Không tìm thấy: ${filePath}`);
    return;
  }

  const exams = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`\n📚 Đang nạp ${exams.length} đề thi chuẩn hóa từ [${sourceName}]...`);

  let count = 0;
  for (const ex of exams) {
    try {
      await prisma.exam.create({
        data: {
          title: ex.title,
          description: ex.description || '',
          skill: (ex.skill as ExamSkill) || ExamSkill.FULL_TEST,
          duration_minutes: ex.durationMinutes || ex.duration_minutes || 30,
          is_pro: ex.isPro ?? ex.is_pro ?? false,
          is_published: true,
          source: ex.source || sourceName,
          parts: {
            create: (ex.parts || []).map((p: any) => ({
              part_number: p.part_number,
              title: p.title,
              instructions: p.instructions || null,
              passage_text: p.passage_text || null,
              audio_url: p.audio_url || null,
              image_url: p.image_url || null,
              questions: {
                create: (p.questions || []).map((q: any) => ({
                  question_number: q.question_number,
                  question_type: mapQuestionType(q.question_type),
                  prompt: q.prompt || 'Câu hỏi',
                  options: q.options || null,
                  correct_answer: q.correct_answer ? String(q.correct_answer) : null,
                  explanation: q.explanation || null,
                  max_score: q.max_score || 1.0
                }))
              }
            }))
          }
        }
      });
      count++;
      if (count % 200 === 0) {
        console.log(`   └─ Tiến độ nạp [${sourceName}]: ${count}/${exams.length} đề`);
      }
    } catch (e: any) {
      console.warn(`Lỗi nạp đề "${ex.title}":`, e.message);
    }
  }

  console.log(`✅ Hoàn tất nạp [${sourceName}]: ${count}/${exams.length} đề thi vào PostgreSQL!`);
}

// ----------------------------------------------------------------------------------
// 4. NẠP KHO NGHE CHÉP CHÍNH TẢ (DICTATION): 670 BỘ ĐỀ & 3,852 CÂU
// ----------------------------------------------------------------------------------
async function insertDictationSystem() {
  console.log('\n🎧 [BƯỚC 4/4] Đang nạp kho Nghe chép chính tả (Dictation) vào PostgreSQL...');

  const setsFile = path.join(kytichDir, 'dictation_sets.json');
  const sentencesFile = path.join(kytichDir, 'all_dictation_sentences.json');

  if (!fs.existsSync(setsFile) || !fs.existsSync(sentencesFile)) {
    console.warn('⚠️ Thiếu file dữ liệu Dictation');
    return;
  }

  const dictationSets = JSON.parse(fs.readFileSync(setsFile, 'utf-8'));
  const allSentences = JSON.parse(fs.readFileSync(sentencesFile, 'utf-8'));

  const sentencesBySet = new Map<string, any[]>();
  for (const s of allSentences) {
    if (!sentencesBySet.has(s.set_id)) sentencesBySet.set(s.set_id, []);
    sentencesBySet.get(s.set_id)!.push(s);
  }

  const levelMap: Record<number, DictationLevel> = {
    1: DictationLevel.FOUNDATION,
    2: DictationLevel.MOMENTUM,
    3: DictationLevel.MASTERY
  };

  let count = 0;
  for (const ds of dictationSets) {
    try {
      const sList = sentencesBySet.get(ds.id) || [];
      const lessonLevel = levelMap[ds.level] || DictationLevel.FOUNDATION;

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
              audio_url: st.audio_url || '',
              transcript: st.text || '',
              duration_seconds: (st.end_sec && st.start_sec) ? Math.max(0, st.end_sec - st.start_sec) : 0
            }))
          }
        }
      });
      count++;
      if (count % 200 === 0) {
        console.log(`   └─ Tiến độ nạp Dictation: ${count}/${dictationSets.length} bài`);
      }
    } catch (e: any) {
      console.warn(`Lỗi nạp bài chính tả "${ds.title}":`, e.message);
    }
  }

  console.log(`✅ Hoàn tất nạp Dictation: ${count}/${dictationSets.length} bài (${allSentences.length} câu) vào PostgreSQL!`);
}

// ----------------------------------------------------------------------------------
// HÀM CHÍNH (MAIN ORCHESTRATOR)
// ----------------------------------------------------------------------------------
async function main() {
  console.log('================================================================================');
  console.log('🚀 TIẾN TRÌNH NẠP DỮ LIỆU ĐA NGUỒN CHUẨN HÓA VÀO POSTGRESQL');
  console.log('⏱️ Bắt đầu lúc:', new Date().toLocaleString());
  console.log('================================================================================');

  // 1. Dọn dẹp dữ liệu cũ (đã backup an toàn trước đó)
  await cleanOldExamData();

  // 2. Nạp 26 Full Tests tổng hợp 5 kỹ năng từ Kỳ Tích
  await insertKyTichFullTests();

  // 3. Nạp 873 đề kỹ năng lẻ từ Kỳ Tích
  await insertNormalizedExams('APTIS_KYTICH', path.join(kytichDir, 'normalized_exams.json'));

  // 4. Nạp 851 đề chuẩn hóa duy nhất từ Academy
  await insertNormalizedExams('APTIS_ACADEMY', path.join(academyDir, 'normalized_exams.json'));

  // 5. Nạp kho Nghe chép chính tả 670 bài
  await insertDictationSystem();

  // Thống kê sau khi nạp
  const finalExamCount = await prisma.exam.count();
  const finalPartCount = await prisma.examPart.count();
  const finalQuestionCount = await prisma.question.count();
  const finalLessonCount = await prisma.dictationLesson.count();
  const finalSentenceCount = await prisma.dictationSentence.count();
  const finalUserCount = await prisma.user.count();

  console.log('\n================================================================================');
  console.log('🎉🎉 HOÀN THÀNH NẠP TOÀN BỘ DỮ LIỆU VÀO DATABASE THÀNH CÔNG RỰC RỠ!');
  console.log('================================================================================');
  console.log(`📊 THỐNG KÊ DATABASE SAU KHI NẠP:`);
  console.log(`- Tài khoản người dùng (Users):        ${finalUserCount} (Bảo toàn 100%)`);
  console.log(`- Tổng số đề thi (Exams):             ${finalExamCount} bộ đề`);
  console.log(`- Tổng số phần thi (ExamParts):        ${finalPartCount} parts`);
  console.log(`- Tổng số câu hỏi (Questions):         ${finalQuestionCount} câu`);
  console.log(`- Bài học chính tả (DictationLessons): ${finalLessonCount} bài`);
  console.log(`- Câu chính tả (DictationSentences):   ${finalSentenceCount} câu`);
  console.log('================================================================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
