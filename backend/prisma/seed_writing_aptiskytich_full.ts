/**
 * SEED SCRIPT: Bộ đề thi Writing chuẩn 100% Aptis Kỳ Tích (Art Club & More)
 * Cấu trúc chuẩn 4 Parts:
 * - Part 1: 5 tin nhắn trả lời ngắn (1-5 từ, max 10 từ)
 * - Part 2: Điền biểu mẫu câu lạc bộ (20-30 từ, max 45 từ) -> KHÔNG chấm AI, trả kết quả ngay kèm mẫu B1
 * - Part 3: Trò chuyện phòng chat 3 thành viên (30-40 từ, max 60 từ) -> Chấm AI
 * - Part 4: Viết thư thân mật (~50 từ) & thư trang trọng (120-150 từ) -> Chấm AI
 */
import 'dotenv/config';
import { PrismaClient, ExamSkill, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING APTIS KY TICH WRITING MODULE ---');

  const artClubExam = {
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
  };

  // Upsert Art Club Exam
  let exam = await prisma.exam.findFirst({ where: { title: artClubExam.title } });
  if (exam) {
    // Delete existing parts and cascade questions
    await prisma.examPart.deleteMany({ where: { exam_id: exam.id } });
    await prisma.exam.update({
      where: { id: exam.id },
      data: {
        description: artClubExam.description,
        duration_minutes: artClubExam.duration_minutes,
        skill: ExamSkill.WRITING,
        is_published: true,
      },
    });
  } else {
    exam = await prisma.exam.create({
      data: {
        title: artClubExam.title,
        description: artClubExam.description,
        skill: ExamSkill.WRITING,
        duration_minutes: artClubExam.duration_minutes,
        is_pro: false,
        is_published: true,
        source: 'WEB',
      },
    });
  }

  for (const p of artClubExam.parts) {
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

  console.log(`Created/Updated: ${artClubExam.title} (ID: ${exam.id})`);
  console.log('Writing seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
