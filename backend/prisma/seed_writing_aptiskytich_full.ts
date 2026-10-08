/**
 * SEED SCRIPT: Bộ đề thi Writing chuẩn 100% Aptis Kỳ Tích (4 CLB Đa dạng Chủ đề)
 * - Đề 01: Art Club (Câu lạc bộ Nghệ thuật)
 * - Đề 02: Sports & Fitness Club (Câu lạc bộ Thể thao)
 * - Đề 03: Book Club (Câu lạc bộ Sách)
 * - Đề 04: Travel & Adventure Club (Câu lạc bộ Du lịch)
 *
 * Cấu trúc chuẩn 4 Parts mỗi đề:
 * - Part 1: 5 tin nhắn trả lời ngắn (1-5 từ)
 * - Part 2: Điền biểu mẫu câu lạc bộ (20-30 từ)
 * - Part 3: Trò chuyện phòng chat 3 thành viên (30-40 từ mỗi câu)
 * - Part 4: Viết thư thân mật (~50 từ) & thư trang trọng (120-150 từ)
 */
import 'dotenv/config';
import { PrismaClient, ExamSkill, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

const WRITING_EXAMS = [
  {
    title: 'Đề 01 — Art Club (Aptis Kỳ Tích)',
    description: 'Chủ đề Câu lạc bộ Nghệ thuật (Art Club) — Chuẩn cấu trúc Aptis 4 phần thi viết thực tế.',
    duration_minutes: 50,
    is_pro: false,
    parts: [
      {
        part_number: 1,
        title: 'Part 1 – Short Answers',
        instructions: 'You want to join an art club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.',
        passage_text: 'Art Club Registration - 5 short questions',
        questions: [
          {
            question_number: 1,
            prompt: 'What do you like doing with your friends?',
            explanation: 'Going to art exhibitions together.',
          },
          {
            question_number: 2,
            prompt: 'Which sport do you like playing the most?',
            explanation: 'Badminton and swimming.',
          },
          {
            question_number: 3,
            prompt: 'What did you do last night?',
            explanation: 'I watched a documentary about Picasso.',
          },
          {
            question_number: 4,
            prompt: 'Do you like shopping?',
            explanation: 'Yes, especially for art supplies.',
          },
          {
            question_number: 5,
            prompt: 'What is your favorite season of the year?',
            explanation: 'Autumn, because of vivid colors.',
          },
        ],
      },
      {
        part_number: 2,
        title: 'Part 2 – Social Media Response',
        instructions: 'You are a new member of the art club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.',
        passage_text: 'Tell us about a painting or photo you like.',
        questions: [
          {
            question_number: 1,
            prompt: 'Tell us about a painting or photo you like.',
            explanation: 'I took a photo last weekend in the park when the sun was setting. The light was soft, so the picture looked very nice.',
          },
        ],
      },
      {
        part_number: 3,
        title: 'Part 3 – Three Questions',
        instructions: 'You are a member of the art club. You are talking to three other members in the club chat room. Talk to them using sentences. Use 30-40 words per answer. Recommended time: 10 minutes.',
        passage_text: 'Art Club Chat Room - 3 members asking questions',
        questions: [
          {
            question_number: 1,
            prompt: 'I have kept a painting for a long time. Tell me about something that you have had for a long time.',
            explanation: 'I have kept an oil portrait painted by my grandfather for over ten years. It hangs in my living room and always reminds me of the peaceful time we spent together in his studio.',
          },
          {
            question_number: 2,
            prompt: 'I would like to learn painting, but I have not found an effective way. Should I take a course at my local college? Please give me some advice.',
            explanation: 'Taking a course at your local college is definitely a wonderful idea because you will receive direct guidance from experienced instructors. Furthermore, practicing alongside peers keeps you motivated and provides valuable feedback.',
          },
          {
            question_number: 3,
            prompt: 'Street art, where people paint on buildings, is becoming popular. However, some people say it is bad. What is your opinion?',
            explanation: 'In my view, street art brings vibrant energy and modern cultural identity to dull urban spaces when created with permission. However, unauthorized graffiti on historical landmarks should be strictly prohibited to preserve public heritage.',
          },
        ],
      },
      {
        part_number: 4,
        title: 'Part 4 – Formal & Informal Email',
        instructions: 'You are a member of the art club. You received an email from the club secretary stating that the annual art gallery trip has been unexpectedly canceled due to budget constraints.',
        passage_text: 'Email from Secretary: Due to recent unforeseen budget constraints, our annual trip to the National Art Gallery next month will be cancelled. We apologize for the inconvenience and welcome members suggestions.',
        questions: [
          {
            question_number: 1,
            prompt: 'Write an email to a friend who is also an art club member. Write about your feelings and what you think the club should do. Write about 50 words.',
            explanation: 'Hi Mark,\n\nDid you see the email about the gallery trip being canceled? I was really looking forward to it and feel quite disappointed. Maybe we could suggest organizing a local photo exhibition instead or paying a small fee ourselves so the trip can still happen.\n\nTalk soon,\nHiep',
          },
          {
            question_number: 2,
            prompt: 'Write an email to the club secretary. Explain how you feel about the cancellation and suggest alternative ways the club could organize the trip or raise funds. Write 120-150 words.',
            explanation: 'Dear Mr. Davis,\n\nI am writing to express my disappointment upon receiving the announcement regarding the cancellation of our annual visit to the National Art Gallery. This excursion is one of the most anticipated highlights of the year for many members.\n\nWhile I completely understand the financial challenges the club is currently navigating, I would respectfully like to propose several feasible solutions. Firstly, members could contribute a modest individual fee to cover transportation costs, which would significantly lessen the club budget deficit. Secondly, we could organize a charity art auction or partner with local sponsors to raise the necessary funds.\n\nI believe these measures would allow us to proceed with the event without burdening the club finances. I hope the committee will give these recommendations favorable consideration.\n\nYours sincerely,\nHoang Hiep',
          },
        ],
      },
    ],
  },
  {
    title: 'Đề 02 — Sports & Fitness Club (Aptis Kỳ Tích)',
    description: 'Chủ đề Câu lạc bộ Thể thao (Sports Club) — Đầy đủ 4 phần thi viết về rèn luyện thể lực và hoạt động nhóm.',
    duration_minutes: 50,
    is_pro: false,
    parts: [
      {
        part_number: 1,
        title: 'Part 1 – Short Answers',
        instructions: 'You want to join a sports and fitness club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.',
        passage_text: 'Sports Club Registration - 5 short questions',
        questions: [
          {
            question_number: 1,
            prompt: 'What is your favorite outdoor sport or physical activity?',
            explanation: 'Swimming and playing badminton.',
          },
          {
            question_number: 2,
            prompt: 'How often do you exercise each week?',
            explanation: 'Three times every week.',
          },
          {
            question_number: 3,
            prompt: 'What sports gear or equipment do you usually use?',
            explanation: 'Running shoes and yoga mat.',
          },
          {
            question_number: 4,
            prompt: 'What time of day do you prefer working out?',
            explanation: 'Early morning before work.',
          },
          {
            question_number: 5,
            prompt: 'Which season is best for outdoor running?',
            explanation: 'Spring, with cool breezes.',
          },
        ],
      },
      {
        part_number: 2,
        title: 'Part 2 – Social Media Response',
        instructions: 'You are a new member of the sports and fitness club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.',
        passage_text: 'Sports Club Goal Setting',
        questions: [
          {
            question_number: 1,
            prompt: 'Please tell us why you want to join our sports club and what personal goals you wish to achieve.',
            explanation: 'I want to join to improve my cardiovascular stamina and relieve stress after work. Exercising with club peers will keep me disciplined.',
          },
        ],
      },
      {
        part_number: 3,
        title: 'Part 3 – Three Questions',
        instructions: 'You are a member of the sports club. You are talking to three other members in the club chat room. Talk to them using sentences. Use 30-40 words per answer. Recommended time: 10 minutes.',
        passage_text: 'Sports Club Chat Room - 3 members asking questions',
        questions: [
          {
            question_number: 1,
            prompt: 'I have just started training at the gym. How many days per week should a beginner exercise?',
            explanation: 'As a beginner, three sessions per week is ideal. It allows your muscle tissue adequate recovery time while fostering a sustainable fitness habit without risking exhaustion.',
          },
          {
            question_number: 2,
            prompt: 'The management is considering raising membership fees to purchase modern equipment. What is your opinion?',
            explanation: 'Upgrading machinery is beneficial for member safety and workout variety. However, the club should provide discounted loyalty rates for existing members to reward their dedication.',
          },
          {
            question_number: 3,
            prompt: 'Some people prefer exercising alone at home while others love group fitness classes. Which do you prefer?',
            explanation: 'I prefer group workout classes because energetic music and motivated peers inspire me to push beyond my limits far more effectively than exercising alone.',
          },
        ],
      },
      {
        part_number: 4,
        title: 'Part 4 – Formal & Informal Email',
        instructions: 'You are a member of the sports club. You received an email from the club manager stating that all weekend group workout sessions have been canceled due to staff shortages.',
        passage_text: 'Email from Manager: All weekend fitness classes are canceled until next month due to temporary staff shortages. We invite member input on how to proceed.',
        questions: [
          {
            question_number: 1,
            prompt: 'Write an email to a friend who is also a sports club member. Write about your feelings and what you think the club should do. Write about 50 words.',
            explanation: 'Hi Alex,\n\nDid you see the club notice about canceling weekend training sessions? I am quite upset since weekends are my only free window for exercise. We should talk to other members and suggest hiring temporary guest coaches.\n\nBest,\nHiep',
          },
          {
            question_number: 2,
            prompt: 'Write an email to the club manager. Explain how you feel about the cancellation and suggest alternative ways the club could organize sessions or solve staffing issues. Write 120-150 words.',
            explanation: 'Dear Mr. Henderson,\n\nI am writing to express my earnest concern regarding the recent decision to suspend weekend group workout sessions due to staffing shortages. As a working professional, weekends represent my primary availability to train consistently.\n\nWhile I completely appreciate the operational difficulties facing the club, I would respectfully like to suggest two constructive alternatives. Firstly, the club could hire accredited freelance fitness instructors on temporary contracts. Secondly, certified senior members could supervise peer-led workouts until permanent staff are recruited.\n\nI believe these solutions would enable members to continue their routines safely without placing an excessive burden on management. I hope you will give these suggestions favorable consideration.\n\nYours sincerely,\nHoang Hiep',
          },
        ],
      },
    ],
  },
  {
    title: 'Đề 03 — Book Club (Aptis Kỳ Tích)',
    description: 'Chủ đề Câu lạc bộ Sách (Book Club) — Luyện viết về văn hóa đọc, trao đổi quan điểm tác phẩm và kiến nghị tổ chức.',
    duration_minutes: 50,
    is_pro: false,
    parts: [
      {
        part_number: 1,
        title: 'Part 1 – Short Answers',
        instructions: 'You want to join a book club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.',
        passage_text: 'Book Club Registration - 5 short questions',
        questions: [
          {
            question_number: 1,
            prompt: 'What genre of books do you enjoy reading the most?',
            explanation: 'Historical novels and biographies.',
          },
          {
            question_number: 2,
            prompt: 'How often do you visit a bookstore or library?',
            explanation: 'Twice every month.',
          },
          {
            question_number: 3,
            prompt: 'What was the last book you finished?',
            explanation: 'The Great Gatsby.',
          },
          {
            question_number: 4,
            prompt: 'Do you prefer reading printed books or e-books?',
            explanation: 'Printed books with paper feel.',
          },
          {
            question_number: 5,
            prompt: 'Where is your favorite spot for reading?',
            explanation: 'A quiet corner cafe.',
          },
        ],
      },
      {
        part_number: 2,
        title: 'Part 2 – Social Media Response',
        instructions: 'You are a new member of the book club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.',
        passage_text: 'Book Club Reader Profile',
        questions: [
          {
            question_number: 1,
            prompt: 'Tell us about a book that made a strong impression on you and why you liked it.',
            explanation: 'I recently read "To Kill a Mockingbird". It deeply moved me because of its profound message about justice, personal integrity, and unconditional human empathy.',
          },
        ],
      },
      {
        part_number: 3,
        title: 'Part 3 – Three Questions',
        instructions: 'You are a member of the book club. You are talking to three other members in the club chat room. Talk to them using sentences. Use 30-40 words per answer. Recommended time: 10 minutes.',
        passage_text: 'Book Club Chat Room - 3 members asking questions',
        questions: [
          {
            question_number: 1,
            prompt: 'I struggle to finish long books because of busy schedules. How do you find time to read daily?',
            explanation: 'I set aside twenty minutes before bedtime every night without looking at my smartphone. Reading small chapters consistently accumulates quickly over weeks.',
          },
          {
            question_number: 2,
            prompt: 'Our local municipal library might reduce its weekend opening hours. How do you feel about this?',
            explanation: 'Reducing weekend hours would severely hurt students and working citizens who only have leisure time on Saturdays. The municipal council should recruit community volunteers instead.',
          },
          {
            question_number: 3,
            prompt: 'Many young people prefer audiobooks over paper books now. What is your viewpoint?',
            explanation: 'Audiobooks are fantastic for daily commutes and multitasking. However, printed books provide tactile pleasure and deeper focus that audio recordings cannot entirely replace.',
          },
        ],
      },
      {
        part_number: 4,
        title: 'Part 4 – Formal & Informal Email',
        instructions: 'You are a member of the book club. You received an email from the club coordinator stating that next month\'s author meeting and discussion with novelist David Mitchell has been canceled.',
        passage_text: 'Email from Coordinator: Regrettably, novelist David Mitchell will not be able to visit our club next month due to unexpected flight disruptions. We welcome members alternative proposals.',
        questions: [
          {
            question_number: 1,
            prompt: 'Write an email to a friend who is also a book club member. Write about your feelings and what you think the club should do. Write about 50 words.',
            explanation: 'Hi Sarah,\n\nHave you heard about the author talk with David Mitchell being canceled? I am so disappointed as I had prepared several questions about his latest novel. Let us propose organizing a virtual session via Zoom instead.\n\nCheers,\nHiep',
          },
          {
            question_number: 2,
            prompt: 'Write an email to the club coordinator. Explain how you feel about the cancellation and suggest alternative ways the club could organize the session. Write 120-150 words.',
            explanation: 'Dear Ms. Watson,\n\nI am writing to express my regret upon receiving the notification that our scheduled author talk with David Mitchell has been canceled owing to travel issues.\n\nGiven the tremendous anticipation among club members, I would like to propose hosting this session virtually via video conference. This would eliminate travel constraints while still providing an engaging interactive platform for members to discuss the author\'s work.\n\nI hope the committee will consider this viable alternative.\n\nYours sincerely,\nHoang Hiep',
          },
        ],
      },
    ],
  },
  {
    title: 'Đề 04 — Travel Club (Aptis Kỳ Tích)',
    description: 'Chủ đề Câu lạc bộ Du lịch (Travel Club) — Viết về các điểm đến khám phá, trải nghiệm văn hóa và xử lý tình huống hủy chuyến.',
    duration_minutes: 50,
    is_pro: false,
    parts: [
      {
        part_number: 1,
        title: 'Part 1 – Short Answers',
        instructions: 'You want to join a travel and outdoor club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.',
        passage_text: 'Travel Club Registration - 5 short questions',
        questions: [
          {
            question_number: 1,
            prompt: 'What is your favorite holiday destination?',
            explanation: 'Coastal beaches and mountains.',
          },
          {
            question_number: 2,
            prompt: 'Who do you usually travel with?',
            explanation: 'My family and close friends.',
          },
          {
            question_number: 3,
            prompt: 'What essential item do you always pack?',
            explanation: 'Camera and comfortable shoes.',
          },
          {
            question_number: 4,
            prompt: 'How do you prefer to travel: plane, train, or car?',
            explanation: 'Train, for scenic views.',
          },
          {
            question_number: 5,
            prompt: 'What is the best season for traveling?',
            explanation: 'Autumn, with pleasant mild weather.',
          },
        ],
      },
      {
        part_number: 2,
        title: 'Part 2 – Social Media Response',
        instructions: 'You are a new member of the travel club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.',
        passage_text: 'Travel Experience Survey',
        questions: [
          {
            question_number: 1,
            prompt: 'Tell us about a memorable journey or vacation you experienced recently.',
            explanation: 'Last summer, I took a road trip along the central coastline. The crystal-clear sea and warm hospitality of local fishermen made it an unforgettable journey.',
          },
        ],
      },
      {
        part_number: 3,
        title: 'Part 3 – Three Questions',
        instructions: 'You are a member of the travel club. You are talking to three other members in the club chat room. Talk to them using sentences. Use 30-40 words per answer. Recommended time: 10 minutes.',
        passage_text: 'Travel Club Chat Room - 3 members asking questions',
        questions: [
          {
            question_number: 1,
            prompt: 'Some people prefer solo travel while others always travel in groups. What do you prefer?',
            explanation: 'I prefer traveling with friends because sharing local meals and exploring uncharted paths together creates unforgettable memories and enhances mutual safety.',
          },
          {
            question_number: 2,
            prompt: 'Mass tourism is causing environmental damage to fragile heritage towns. What should authorities do?',
            explanation: 'Municipal authorities should enforce daily tourist visitor quotas and channel tourism levies directly into historical conservation and eco-friendly waste management.',
          },
          {
            question_number: 3,
            prompt: 'With rising airfares, budget travel has become challenging. What is your best cost-saving tip?',
            explanation: 'Booking accommodations well in advance and dining at neighborhood markets rather than tourist cafes saves considerable funds while providing authentic cultural experiences.',
          },
        ],
      },
      {
        part_number: 4,
        title: 'Part 4 – Formal & Informal Email',
        instructions: 'You are a member of the travel club. You received an email from the committee stating that the upcoming weekend exploration trip to the coastal national park has been canceled due to adverse weather warnings.',
        passage_text: 'Email from Committee: Due to severe gale warnings along the coast, our annual national park expedition is canceled. We apologize and seek members feedback.',
        questions: [
          {
            question_number: 1,
            prompt: 'Write an email to a friend who is also a travel club member. Write about your feelings and what you think the club should do. Write about 50 words.',
            explanation: 'Hi Tom,\n\nDid you see the update about our national park trip being canceled? I was so excited to hike and camp by the coast. Perhaps we could suggest rescheduling to the following weekend once the weather clears.\n\nBest,\nHiep',
          },
          {
            question_number: 2,
            prompt: 'Write an email to the club committee. Explain how you feel about the cancellation and suggest alternative ways the club could organize the excursion. Write 120-150 words.',
            explanation: 'Dear Committee Members,\n\nI am writing regarding the postponement of our planned expedition to the coastal national park due to inclement weather conditions.\n\nWhile member safety is understandably the utmost priority, many of us have already arranged time off work. I would respectfully propose rescheduling the excursion to next weekend or shifting the itinerary to a nearby indoor cultural museum tour.\n\nI would be grateful if the committee could evaluate these possibilities.\n\nYours sincerely,\nHoang Hiep',
          },
        ],
      },
    ],
  },
];

async function main() {
  console.log('--- SEEDING APTIS KY TICH WRITING MODULE (4 DISTINCT CLUBS) ---');

  for (const examData of WRITING_EXAMS) {
    let exam = await prisma.exam.findFirst({ where: { title: examData.title } });
    if (exam) {
      await prisma.examPart.deleteMany({ where: { exam_id: exam.id } });
      await prisma.exam.update({
        where: { id: exam.id },
        data: {
          description: examData.description,
          duration_minutes: examData.duration_minutes,
          skill: ExamSkill.WRITING,
          is_published: true,
          is_pro: examData.is_pro,
        },
      });
    } else {
      exam = await prisma.exam.create({
        data: {
          title: examData.title,
          description: examData.description,
          skill: ExamSkill.WRITING,
          duration_minutes: examData.duration_minutes,
          is_pro: examData.is_pro,
          is_published: true,
          source: 'WEB',
        },
      });
    }

    for (const p of examData.parts) {
      const partRecord = await prisma.examPart.create({
        data: {
          exam_id: exam.id,
          part_number: p.part_number,
          title: p.title,
          instructions: p.instructions,
          passage_text: p.passage_text,
        },
      });

      for (const q of p.questions) {
        await prisma.question.create({
          data: {
            part_id: partRecord.id,
            question_number: q.question_number,
            question_type: QuestionType.ESSAY,
            prompt: q.prompt,
            explanation: q.explanation,
            max_score: 12.5,
          },
        });
      }
    }

    console.log(`Successfully seeded: ${examData.title} (ID: ${exam.id})`);
  }

  console.log('--- ALL 4 WRITING CLUBS SEEDED SUCCESSFULLY! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
