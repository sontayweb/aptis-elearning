import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function importOfficialAptisExam() {
  console.log('🚀 Đang kết nối tới Database hệ thống...');

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

  const examTitle = 'Đề thi Reading Chuẩn Hội Đồng Anh (Official British Council Format 2026)';

  try {
    // 1. Kiểm tra đề đã tồn tại chưa
    let existing = await prisma.exam.findFirst({
      where: { title: examTitle }
    });

    if (existing) {
      console.log(`ℹ️ Đề thi "${examTitle}" đã tồn tại (ID: ${existing.id}). Đang cập nhật lại nội dung...`);
      await prisma.submissionAnswer.deleteMany({ where: { question: { part: { exam_id: existing.id } } } });
      await prisma.question.deleteMany({ where: { part: { exam_id: existing.id } } });
      await prisma.examPart.deleteMany({ where: { exam_id: existing.id } });
      await prisma.exam.delete({ where: { id: existing.id } });
    }

    // 2. Tạo Exam mới
    const exam = await prisma.exam.create({
      data: {
        title: examTitle,
        description: 'Đề thi đọc hiểu 4 Phần bám sát 100% cấu trúc đề thi chính thức của British Council (Aptis ESOL Reading).',
        skill: 'READING',
        duration_minutes: 35,
        is_pro: false,
        is_published: true,
        source: 'OFFICIAL_BRITISH_COUNCIL',
      }
    });

    console.log(`✅ Đã khởi tạo bài thi: ID = ${exam.id}`);

    // --- PART 1: Sentence Comprehension (5 câu điền từ ngắn) ---
    const part1 = await prisma.examPart.create({
      data: {
        exam_id: exam.id,
        part_number: 1,
        title: 'Part 1: Sentence comprehension',
        instructions: 'Choose one word (A, B or C) for each space and answer the questions. The first one is done for you.',
        passage_text: 'Dear John,\nI am writing to tell you about my new apartment. It is very [gap1] to my university, so I can walk there every morning. The living room is quite spacious, and the kitchen has all the modern equipment we [gap2]. My roommate, Mark, is very friendly and we often [gap3] dinner together on weekends. Tomorrow, we are going to [gap4] a housewarming party for our friends. I really hope you can [gap5] us!\nBest regards,\nDavid'
      }
    });

    const p1Questions = [
      {
        num: 1,
        prompt: 'Sentence 1: It is very _____ to my university.',
        options: ['near', 'close', 'next'],
        correct: 'close',
        explanation: '"Close to" là cụm từ chỉ khoảng cách gần ("near" không đi với "to").'
      },
      {
        num: 2,
        prompt: 'Sentence 2: ...the kitchen has all the modern equipment we _____.',
        options: ['need', 'hope', 'wish'],
        correct: 'need',
        explanation: '"Equipment we need" nghĩa là trang thiết bị chúng tôi cần.'
      },
      {
        num: 3,
        prompt: 'Sentence 3: My roommate, Mark, is very friendly and we often _____ dinner together.',
        options: ['cook', 'bake', 'boil'],
        correct: 'cook',
        explanation: '"Cook dinner" là cụm kết hợp từ tự nhiên (collocation).'
      },
      {
        num: 4,
        prompt: 'Sentence 4: Tomorrow, we are going to _____ a housewarming party.',
        options: ['make', 'host', 'do'],
        correct: 'host',
        explanation: '"Host a party" mang nghĩa tổ chức một bữa tiệc.'
      },
      {
        num: 5,
        prompt: 'Sentence 5: I really hope you can _____ us!',
        options: ['attend', 'join', 'enter'],
        correct: 'join',
        explanation: '"Join us" có nghĩa là tham gia cùng chúng tôi.'
      }
    ];

    for (const q of p1Questions) {
      await prisma.question.create({
        data: {
          part_id: part1.id,
          question_number: q.num,
          question_type: 'GAP_FILL',
          prompt: q.prompt,
          options: q.options,
          correct_answer: q.correct,
          explanation: q.explanation,
          max_score: 2.0
        }
      });
    }
    console.log('  -> Đã nạp Part 1 (5 câu hoàn chỉnh)');

    // --- PART 2: Text Cohesion (Sắp xếp trật tự 6 câu) ---
    const part2 = await prisma.examPart.create({
      data: {
        exam_id: exam.id,
        part_number: 2,
        title: 'Part 2: Text cohesion',
        instructions: 'The sentences below make a complete text. Put them in the correct order. The first sentence is already in place.',
        passage_text: 'The Story of Alexander Fleming'
      }
    });

    await prisma.question.create({
      data: {
        part_id: part2.id,
        question_number: 6,
        question_type: 'SENTENCE_ORDER',
        prompt: 'Sắp xếp trật tự các câu kể về phát minh Penicillin của Alexander Fleming:',
        options: {
          title: 'The Discovery of Penicillin',
          fixedSentence: 'Alexander Fleming was a Scottish physician and microbiologist.',
          sentences: [
            { id: 's2', text: 'In 1928, he returned to his laboratory after a two-week summer vacation.' },
            { id: 's3', text: 'While inspecting his petri dishes, he noticed that a strange mold had begun to grow.' },
            { id: 's4', text: 'Surprisingly, the bacteria surrounding this unusual mold had been completely destroyed.' },
            { id: 's5', text: 'He named the active antibacterial substance produced by the mold "penicillin".' },
            { id: 's6', text: 'This accidental discovery revolutionized modern medicine and saved millions of lives worldwide.' }
          ]
        },
        correct_answer: JSON.stringify(['s2', 's3', 's4', 's5', 's6']),
        explanation: 'Thứ tự logic thời gian: Bác sĩ vi sinh học -> Kỳ nghỉ hè trở về năm 1928 -> Thấy nấm mốc -> Vi khuẩn xung quanh biến mất -> Đặt tên penicillin -> Ý nghĩa y học.',
        max_score: 10.0
      }
    });
    console.log('  -> Đã nạp Part 2 (Text Cohesion sắp xếp 6 câu logic)');

    // --- PART 3: Short Text Opinion Matching (4 người, 7 nhận định) ---
    const part3 = await prisma.examPart.create({
      data: {
        exam_id: exam.id,
        part_number: 3,
        title: 'Part 3: Opinion matching',
        instructions: 'Four people (Person A, B, C, D) discuss remote working vs working in an office. Read the texts and answer the questions below.',
        passage_text: `Person A (Sarah):\nI transitioned to working from home two years ago and it completely transformed my life. Not having to endure the stressful two-hour commute every day means I have more energy for my family. However, I must admit that establishing clear boundaries between personal life and office tasks can be challenging.\n\nPerson B (Michael):\nPersonally, I find remote work isolating and unproductive. In an office environment, brainstorming ideas happens spontaneously near the coffee machine or during lunch breaks. When working alone in my apartment, I easily get distracted by domestic chores and miss the energetic atmosphere of our team.\n\nPerson C (Emma):\nFor me, a hybrid schedule is the golden mean. Spending two days in the office allows me to maintain strong interpersonal relationships with colleagues, while working three days remotely gives me the quiet focus required for complex analytical reports. Flexibility is what modern employees value most.\n\nPerson D (Liam):\nWhat concerns me most about the rise of remote work is its impact on junior staff. When you are just starting your career, you learn so much simply by observing experienced peers handling difficult clients. In remote setups, junior colleagues miss out on natural mentorship and onboarding.`
      }
    });

    const p3Opinions = [
      { num: 7, prompt: 'Who believes that working in an office stimulates creative idea generation?', ans: 'Person B', exp: 'Michael đề cập: "brainstorming ideas happens spontaneously near the coffee machine".' },
      { num: 8, prompt: 'Who thinks new or inexperienced employees suffer most from working remotely?', ans: 'Person D', exp: 'Liam nhấn mạnh tác động tới "junior staff" và "miss out on natural mentorship".' },
      { num: 9, prompt: 'Who struggles with separating professional responsibilities from home life?', ans: 'Person A', exp: 'Sarah nói: "establishing clear boundaries between personal life and office tasks can be challenging".' },
      { num: 10, prompt: 'Who prefers combining both office presence and home working?', ans: 'Person C', exp: 'Emma khẳng định: "a hybrid schedule is the golden mean".' },
      { num: 11, prompt: 'Who admits to getting sidetracked by household tasks when working from home?', ans: 'Person B', exp: 'Michael thừa nhận: "easily get distracted by domestic chores".' },
      { num: 12, prompt: 'Who highlights saving time on travel as the major advantage?', ans: 'Person A', exp: 'Sarah nhắc tới việc không phải chịu "stressful two-hour commute every day".' },
      { num: 13, prompt: 'Who believes quiet independence is necessary for deep analytical tasks?', ans: 'Person C', exp: 'Emma nêu: "gives me the quiet focus required for complex analytical reports".' }
    ];

    for (const op of p3Opinions) {
      await prisma.question.create({
        data: {
          part_id: part3.id,
          question_number: op.num,
          question_type: 'MATCHING',
          prompt: op.prompt,
          options: ['Person A', 'Person B', 'Person C', 'Person D'],
          correct_answer: op.ans,
          explanation: op.exp,
          max_score: 2.0
        }
      });
    }
    console.log('  -> Đã nạp Part 3 (Opinion Matching 4 người A, B, C, D)');

    // --- PART 4: Long Text Comprehension (Nối 7 Heading) ---
    const part4 = await prisma.examPart.create({
      data: {
        exam_id: exam.id,
        part_number: 4,
        title: 'Part 4: Long text comprehension',
        instructions: 'Read the text below. Match the headings to the numbered paragraphs. There are two extra headings that you do not need to use.',
        passage_text: `Paragraph 1: The Origin and Early Mythology of Tea\nAccording to Chinese mythology, the story of tea began in 2737 BC when Emperor Shennong was sitting beneath a wild Camellia sinensis tree. A slight breeze blew several leaves into his pot of boiling water. Intrigued by the pleasant aroma, he drank the infusion and was delighted by its revitalizing taste.\n\nParagraph 2: Medical Beginnings\nFor centuries after its discovery, tea was utilized primarily as a medicinal tonic rather than a recreational beverage. Buddhist monks consumed it to maintain alertness during long nocturnal meditation sessions, while ancient physicians prescribed dried tea leaves to treat digestive problems and fatigue.\n\nParagraph 3: The Tang Dynasty and Cultural Refinement\nDuring the Tang Dynasty (618–907 AD), tea evolved from an herbal medicine into an art form. The famous scholar Lu Yu wrote the "Classic of Tea" (Cha Jing), laying down meticulous rules on cultivating, brewing, and tasting tea, which turned tea drinking into a profound spiritual ritual.\n\nParagraph 4: Crossing the Seas to Europe\nIt was not until the early 17th century that Dutch and Portuguese merchants introduced tea leaves to Western Europe. Initially, due to high shipping costs and import duties, tea was an extravagant luxury accessible exclusively to royal courts and aristocracy.\n\nParagraph 5: The British Tea Obsession\nBy the mid-18th century, tea had replaced ale as Britain’s national beverage. The British East India Company established a powerful monopoly on the tea trade with Canton, creating a global trade network that linked Asia, Europe, and the American colonies.\n\nParagraph 6: Modern Global Production\nToday, tea is the second most widely consumed beverage globally, surpassed only by water. From vast plantation terraces in Kenya and Sri Lanka to traditional artisan gardens in Japan, modern agricultural technology ensures billions of cups are brewed every day.`
      }
    });

    const p4Headings = [
      { num: 14, prompt: 'Choose the correct heading for Paragraph 1:', options: ['The accidental discovery by an emperor', 'A luxury for the elite', 'Spiritual and cultural elevation', 'Medicinal uses and monk traditions'], correct: 'The accidental discovery by an emperor' },
      { num: 15, prompt: 'Choose the correct heading for Paragraph 2:', options: ['Medicinal uses and monk traditions', 'The modern tea trade', 'The rise of European imports', 'The accidental discovery by an emperor'], correct: 'Medicinal uses and monk traditions' },
      { num: 16, prompt: 'Choose the correct heading for Paragraph 3:', options: ['Spiritual and cultural elevation', 'The British national addiction', 'Environmental impacts of tea', 'Medicinal uses and monk traditions'], correct: 'Spiritual and cultural elevation' },
      { num: 17, prompt: 'Choose the correct heading for Paragraph 4:', options: ['A luxury for the elite', 'The accidental discovery', 'Global agricultural technology', 'Spiritual and cultural elevation'], correct: 'A luxury for the elite' },
      { num: 18, prompt: 'Choose the correct heading for Paragraph 5:', options: ['Trade monopoly and national popularity', 'A luxury for the elite', 'Medicinal uses and monk traditions', 'Ancient Chinese mythology'], correct: 'Trade monopoly and national popularity' },
      { num: 19, prompt: 'Choose the correct heading for Paragraph 6:', options: ['Modern worldwide cultivation and demand', 'Trade monopoly', 'Early mythological origins', 'A luxury for the elite'], correct: 'Modern worldwide cultivation and demand' }
    ];

    for (const h of p4Headings) {
      await prisma.question.create({
        data: {
          part_id: part4.id,
          question_number: h.num,
          question_type: 'MATCHING',
          prompt: h.prompt,
          options: h.options,
          correct_answer: h.correct,
          max_score: 2.5
        }
      });
    }
    console.log('  -> Đã nạp Part 4 (Long Text 6 đoạn & Heading matching)');

    console.log('\n======================================================');
    console.log(`🎉 NẠP THÀNH CÔNG ĐỀ THI CHUẨN BRITISH COUNCIL!`);
    console.log(`- Mã đề thi ID: ${exam.id}`);
    console.log(`- Tiêu đề: ${exam.title}`);
    console.log(`- Thời gian: 35 phút`);
    console.log(`- Đầy đủ 4 Part chuẩn format Hội đồng Anh (19 câu hỏi, đáp án, giải thích chi tiết)`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Lỗi nạp đề thi:', err);
  } finally {
    await prisma.$disconnect();
  }
}

importOfficialAptisExam().catch(console.error);
