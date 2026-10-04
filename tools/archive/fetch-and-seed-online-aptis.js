import vm from 'node:vm';

async function fetchRemoteJs(url) {
  console.log(`📥 Đang tải từ cloud: ${url}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} khi tải ${url}`);
  return await res.text();
}

function parseJsVariable(code, varName) {
  const sandbox = {};
  vm.createContext(sandbox);
  const cleanCode = code.replace(/export\s+/g, '').replace(/import\s+.*?;/g, '');
  return vm.runInContext(cleanCode + '\n;' + varName + ';', sandbox);
}

async function main() {
  console.log('=====================================================');
  console.log('🚀 BẮT ĐẦU TẢI VÀ NẠP BỘ ĐỀ THI THẬT TỪ CLOUD/GITHUB ');
  console.log('=====================================================\n');

  // Nạp Prisma Client từ backend
  let PrismaClient;
  try {
    const backendPrisma = await import('../backend/node_modules/@prisma/client/default.js').catch(() => null);
    PrismaClient = backendPrisma?.PrismaClient;
  } catch {}

  if (!PrismaClient) {
    try {
      const p = await import('@prisma/client');
      PrismaClient = p.PrismaClient;
    } catch {
      console.error('❌ Không tìm thấy Prisma Client.');
      return;
    }
  }

  const prisma = new PrismaClient();

  try {
    // -------------------------------------------------------------
    // 1. TẢI VÀ NẠP READING PART 1 TỪ CLOUD
    // -------------------------------------------------------------
    const readingP1Url = 'https://raw.githubusercontent.com/TranHuuDat2004/aptis-practice/main/js/data-reading-part1.js';
    const readingCode = await fetchRemoteJs(readingP1Url);
    const readingPart1List = parseJsVariable(readingCode, 'readingPart1Data') || [];

    console.log(`✅ Đã tải về ${readingPart1List.length} bộ đề Reading Part 1 thi thật.`);

    for (let i = 0; i < readingPart1List.length; i++) {
      const item = readingPart1List[i];
      const examTitle = `Đề thi thật Reading Part 1: ${item.title || `Chủ đề ${i + 1}`}`;

      let existing = await prisma.exam.findFirst({ where: { title: examTitle } });
      if (!existing) {
        const exam = await prisma.exam.create({
          data: {
            title: examTitle,
            description: `Bộ đề thi thật Reading Part 1 Aptis ESOL - ${item.title}`,
            skill: 'READING',
            duration_minutes: 10,
            is_pro: false,
            is_published: true,
            source: 'ONLINE_APTIS_REAL',
            parts: {
              create: [
                {
                  part_number: 1,
                  title: 'Part 1: Sentence comprehension',
                  instructions: 'Choose the word that fits in the gap.',
                  passage_text: item.questions?.map(q => q.text).join('\n') || '',
                  questions: {
                    create: (item.questions || []).map((q, idx) => ({
                      question_number: idx + 1,
                      question_type: 'GAP_FILL',
                      prompt: q.text,
                      options: q.options || [],
                      correct_answer: q.answer || (q.options ? q.options[0] : ''),
                      explanation: `Đáp án đúng là: "${q.answer}". Thuộc ngân hàng đề thi thật Aptis.`
                    }))
                  }
                }
              ]
            }
          }
        });
        console.log(`   + Đã tạo đề Reading: "${examTitle}" (ID: ${exam.id})`);
      }
    }

    // -------------------------------------------------------------
    // 2. TẢI VÀ NẠP WRITING PART 1 TỪ CLOUD
    // -------------------------------------------------------------
    const writingP1Url = 'https://raw.githubusercontent.com/TranHuuDat2004/aptis-practice/main/js/data-writing-part1.js';
    const writingCode = await fetchRemoteJs(writingP1Url);
    const writingPart1List = parseJsVariable(writingCode, 'writingPart1Data') || [];

    console.log(`\n✅ Đã tải về ${writingPart1List.length} bộ đề Writing Part 1 thi thật.`);

    for (let i = 0; i < writingPart1List.length; i++) {
      const item = writingPart1List[i];
      const examTitle = `Đề thi thật Writing Part 1: ${item.title || `Chủ đề ${i + 1}`}`;

      let existing = await prisma.exam.findFirst({ where: { title: examTitle } });
      if (!existing) {
        const exam = await prisma.exam.create({
          data: {
            title: examTitle,
            description: `Bộ đề thi thật Writing Part 1 Aptis ESOL - ${item.title}`,
            skill: 'WRITING',
            duration_minutes: 15,
            is_pro: false,
            is_published: true,
            source: 'ONLINE_APTIS_REAL',
            parts: {
              create: [
                {
                  part_number: 1,
                  title: 'Part 1: Personal Messages (Short Answers)',
                  instructions: 'Write short answers (1-5 words) to each message.',
                  passage_text: item.title,
                  questions: {
                    create: (item.questions || []).map((q, idx) => ({
                      question_number: idx + 1,
                      question_type: 'SHORT_TEXT',
                      prompt: q.question,
                      options: [],
                      correct_answer: q.sample || '',
                      explanation: `Câu trả lời mẫu gợi ý: "${q.sample}"`
                    }))
                  }
                }
              ]
            }
          }
        });
        console.log(`   + Đã tạo đề Writing: "${examTitle}" (ID: ${exam.id})`);
      }
    }

    // -------------------------------------------------------------
    // 3. TẢI VÀ NẠP SPEAKING PART 1 TỪ CLOUD
    // -------------------------------------------------------------
    const speakingP1Url = 'https://raw.githubusercontent.com/TranHuuDat2004/aptis-practice/main/js/data-speaking-part1.js';
    const speakingCode = await fetchRemoteJs(speakingP1Url);
    const speakingPart1List = parseJsVariable(speakingCode, 'speakingPart1Data') || [];

    console.log(`\n✅ Đã tải về ${speakingPart1List.length} chủ đề Speaking Part 1 thi thật.`);

    for (let i = 0; i < speakingPart1List.length; i++) {
      const item = speakingPart1List[i];
      const examTitle = `Đề thi thật Speaking Part 1: ${item.title || `Chủ đề ${i + 1}`}`;

      let existing = await prisma.exam.findFirst({ where: { title: examTitle } });
      if (!existing) {
        const exam = await prisma.exam.create({
          data: {
            title: examTitle,
            description: `Bộ đề thi thật Speaking Part 1 Aptis ESOL - ${item.title}`,
            skill: 'SPEAKING',
            duration_minutes: 10,
            is_pro: false,
            is_published: true,
            source: 'ONLINE_APTIS_REAL',
            parts: {
              create: [
                {
                  part_number: 1,
                  title: 'Part 1: Personal Information',
                  instructions: 'Listen to the questions and answer. Speak for 30 seconds for each question.',
                  audio_url: item.audioSrc ? `https://tranhuudat2004.github.io/aptis-practice/${item.audioSrc}` : null,
                  questions: {
                    create: [
                      {
                        question_number: 1,
                        question_type: 'SPEAKING_AUDIO',
                        prompt: item.prompt?.question || 'Answer the personal question.',
                        options: [],
                        correct_answer: item.prompt?.sampleAnswer || '',
                        explanation: `Bài mẫu đạt band B2-C: "${item.prompt?.sampleAnswer}"`
                      }
                    ]
                  }
                }
              ]
            }
          }
        });
        console.log(`   + Đã tạo đề Speaking: "${examTitle}" (ID: ${exam.id})`);
      }
    }

    console.log('\n======================================================');
    console.log('🎉 TẤT CẢ ĐỀ THI THẬT ĐÃ ĐƯỢC TẢI VỀ VÀ LƯU VÀO DATABASE THÀNH CÔNG!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Lỗi khi tải và nạp đề:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
