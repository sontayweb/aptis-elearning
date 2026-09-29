/**
 * SEED SUPPLEMENT: Bổ sung câu hỏi đầy đủ cho đề FULL_TEST
 * Chạy: npx ts-node prisma/seed_fulltest_questions.ts
 */
import 'dotenv/config';
import { PrismaClient, ExamSkill, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== SEEDING FULL TEST QUESTIONS ===');

  // Tìm đề Full Test miễn phí đầu tiên
  const fullTestExam = await prisma.exam.findFirst({
    where: { skill: ExamSkill.FULL_TEST, is_pro: false },
    include: { parts: { include: { questions: true } } },
  });

  if (!fullTestExam) {
    console.log('No FULL_TEST exam found. Please run main seed first.');
    return;
  }

  console.log(`Found exam: "${fullTestExam.title}" (${fullTestExam.id})`);
  console.log(`Current parts: ${fullTestExam.parts.length}`);

  // Xóa parts cũ nếu chưa đủ câu hỏi (< 5 parts)
  if (fullTestExam.parts.length < 5) {
    for (const part of fullTestExam.parts) {
      await prisma.submissionAnswer.deleteMany({ where: { question: { part_id: part.id } } });
      await prisma.question.deleteMany({ where: { part_id: part.id } });
      await prisma.examPart.delete({ where: { id: part.id } });
    }
    console.log('Cleared old parts. Adding full 5-section content...');
  } else {
    console.log('Exam already has enough parts. Skipping.');
    return;
  }

  // Tạo 5 phần đầy đủ theo chuẩn Aptis
  await prisma.examPart.create({
    data: {
      exam_id: fullTestExam.id,
      part_number: 1,
      title: 'Part 1: Grammar & Vocabulary',
      instructions: 'Choose the best option (A, B, C, D) to complete each sentence.',
      questions: {
        create: [
          {
            question_number: 1,
            question_type: QuestionType.MULTIPLE_CHOICE,
            prompt: 'Had I known about the schedule change earlier, I _____ you immediately.',
            options: JSON.stringify(['would notify', 'would have notified', 'notified', 'will notify']),
            correct_answer: 'B',
            explanation: 'Third conditional (inverted): Had + S + V3, S + would have + V3.',
            max_score: 1.0,
          },
          {
            question_number: 2,
            question_type: QuestionType.MULTIPLE_CHOICE,
            prompt: 'The committee has _____ to review the proposal before Friday.',
            options: JSON.stringify(['agreed', 'been agreed', 'agreeing', 'to agree']),
            correct_answer: 'A',
            explanation: '"Agree" used with infinitive: has agreed to review.',
            max_score: 1.0,
          },
          {
            question_number: 3,
            question_type: QuestionType.MULTIPLE_CHOICE,
            prompt: 'Not only _____ the entire project, but she also mentored junior staff.',
            options: JSON.stringify(['did she complete', 'she completed', 'she did complete', 'completed she']),
            correct_answer: 'A',
            explanation: 'Inversion after "Not only": Not only + auxiliary + S + V.',
            max_score: 1.0,
          },
          {
            question_number: 4,
            question_type: QuestionType.MULTIPLE_CHOICE,
            prompt: 'The new policy will _____ effect from January next year.',
            options: JSON.stringify(['take', 'make', 'do', 'get']),
            correct_answer: 'A',
            explanation: 'Fixed collocation: "take effect" = có hiệu lực.',
            max_score: 1.0,
          },
          {
            question_number: 5,
            question_type: QuestionType.MULTIPLE_CHOICE,
            prompt: 'She _____ her report by the time the director arrived.',
            options: JSON.stringify(['finished', 'has finished', 'had finished', 'would finish']),
            correct_answer: 'C',
            explanation: 'Past perfect for action completed before another past action.',
            max_score: 1.0,
          },
        ],
      },
    },
  });

  await prisma.examPart.create({
    data: {
      exam_id: fullTestExam.id,
      part_number: 2,
      title: 'Part 2: Listening Comprehension',
      instructions: 'Read the transcript and answer the questions. (In the real exam, you would listen to the audio.)',
      passage_text: `Train Announcement — Platform 3:
"Good morning, passengers. This is an important service update. The 9:45 express service to Edinburgh Waverley is delayed by approximately 30 minutes due to a technical fault with the locomotive. We apologise for any inconvenience this may cause. Passengers should wait in the main concourse. Complimentary refreshments are available at Platform Café, which is offering a 20% discount for affected passengers. We expect departure at approximately 10:15. Thank you for your patience."`,
      questions: {
        create: [
          {
            question_number: 1,
            question_type: QuestionType.MULTIPLE_CHOICE,
            prompt: 'What is the reason for the train delay?',
            options: JSON.stringify(['Signal failure', 'Technical fault with the locomotive', 'Adverse weather', 'Staff shortage']),
            correct_answer: 'B',
            explanation: 'Audio states: "delayed due to a technical fault with the locomotive".',
            max_score: 1.0,
          },
          {
            question_number: 2,
            question_type: QuestionType.MULTIPLE_CHOICE,
            prompt: 'What discount are affected passengers offered?',
            options: JSON.stringify(['10%', '15%', '20%', '25%']),
            correct_answer: 'C',
            explanation: 'The announcement mentions a "20% discount for affected passengers".',
            max_score: 1.0,
          },
          {
            question_number: 3,
            question_type: QuestionType.MULTIPLE_CHOICE,
            prompt: 'When is the train now expected to depart?',
            options: JSON.stringify(['9:45', '10:00', '10:15', '10:30']),
            correct_answer: 'C',
            explanation: '"We expect departure at approximately 10:15."',
            max_score: 1.0,
          },
          {
            question_number: 4,
            question_type: QuestionType.MULTIPLE_CHOICE,
            prompt: 'Where should passengers wait according to the announcement?',
            options: JSON.stringify(['Platform 3', 'The ticket office', 'The main concourse', 'The café']),
            correct_answer: 'C',
            explanation: '"Passengers should wait in the main concourse."',
            max_score: 1.0,
          },
        ],
      },
    },
  });

  await prisma.examPart.create({
    data: {
      exam_id: fullTestExam.id,
      part_number: 3,
      title: 'Part 3: Reading Comprehension',
      instructions: 'Read the passage carefully, then answer the questions.',
      passage_text: `Remote Work and Urban Planning

The dramatic rise of remote work following the global pandemic has had profound implications for urban planning. Once-bustling city centres are experiencing significant shifts in footfall, with many offices standing partially empty while suburban residential areas see increased demand for coworking spaces and local amenities.

Urban planners now face the challenge of reimagining city spaces that were originally designed around the nine-to-five commuter model. Retail units in central business districts have been repurposed as residential developments, and former financial quarters are seeing a renaissance as mixed-use neighbourhoods offering both residential accommodation and leisure facilities.

Research conducted by the University of Manchester in 2024 found that 63% of knowledge workers prefer a hybrid working arrangement, splitting their time between home and office. This trend has led local governments to invest heavily in digital infrastructure and green public spaces, recognising that the quality of residential environments now plays a more significant role in talent attraction than it did previously.

Critics, however, argue that remote work exacerbates existing inequalities. Those in lower-income brackets often lack adequate home office space and reliable broadband connectivity, placing them at a disadvantage compared to their more affluent counterparts. Addressing this digital divide remains a pressing policy challenge for governments across the developed world.`,
      questions: {
        create: [
          {
            question_number: 1,
            question_type: QuestionType.MULTIPLE_CHOICE,
            prompt: 'According to the passage, what has happened to offices in city centres?',
            options: JSON.stringify([
              'They have been completely demolished',
              'They are standing partially empty',
              'They have been converted to hospitals',
              'They have seen increased occupancy',
            ]),
            correct_answer: 'B',
            explanation: 'The text states: "many offices standing partially empty".',
            max_score: 1.0,
          },
          {
            question_number: 2,
            question_type: QuestionType.MULTIPLE_CHOICE,
            prompt: 'What percentage of knowledge workers prefer hybrid working, according to the University of Manchester research?',
            options: JSON.stringify(['53%', '60%', '63%', '73%']),
            correct_answer: 'C',
            explanation: '"63% of knowledge workers prefer a hybrid working arrangement".',
            max_score: 1.0,
          },
          {
            question_number: 3,
            question_type: QuestionType.MULTIPLE_CHOICE,
            prompt: 'What does the word "exacerbates" (paragraph 4) most closely mean?',
            options: JSON.stringify(['Reduces', 'Eliminates', 'Worsens', 'Creates']),
            correct_answer: 'C',
            explanation: '"Exacerbate" means to make a problem or situation worse.',
            max_score: 1.0,
          },
          {
            question_number: 4,
            question_type: QuestionType.MULTIPLE_CHOICE,
            prompt: 'What challenge does the passage identify for lower-income workers?',
            options: JSON.stringify([
              'Lack of childcare support',
              'Inadequate home office space and poor broadband',
              'Long commuting distances',
              'Insufficient holiday entitlement',
            ]),
            correct_answer: 'B',
            explanation: '"those in lower-income brackets often lack adequate home office space and reliable broadband connectivity".',
            max_score: 1.0,
          },
        ],
      },
    },
  });

  await prisma.examPart.create({
    data: {
      exam_id: fullTestExam.id,
      part_number: 4,
      title: 'Part 4: Writing Task',
      instructions: 'Write a response to the prompt below. Aim for 150-200 words. You will be scored on task completion, coherence, vocabulary, and grammar.',
      questions: {
        create: [
          {
            question_number: 1,
            question_type: QuestionType.ESSAY,
            prompt: 'Some people believe that remote work is more productive than working in an office. Do you agree or disagree? Give reasons and examples to support your view. Write 150-200 words.',
            options: undefined,
            correct_answer: undefined,
            explanation: 'Graded on: Task completion, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy.',
            max_score: 50.0,
          },
          {
            question_number: 2,
            question_type: QuestionType.ESSAY,
            prompt: 'Your friend is considering moving to a new city for work. Write an email giving them advice about what to consider before making this decision. Write 80-120 words.',
            options: undefined,
            correct_answer: undefined,
            explanation: 'Informal register expected. Marked on appropriateness, fluency, and task completion.',
            max_score: 25.0,
          },
        ],
      },
    },
  });

  await prisma.examPart.create({
    data: {
      exam_id: fullTestExam.id,
      part_number: 5,
      title: 'Part 5: Speaking Tasks',
      instructions: 'Record your spoken response to each question. Speak clearly and at a natural pace. Aim for the recommended duration per question.',
      questions: {
        create: [
          {
            question_number: 1,
            question_type: QuestionType.SPEAKING_AUDIO,
            prompt: 'Tell me about your daily routine and how you organise your time. Include details about morning, afternoon, and evening activities. (Speak for 45-60 seconds.)',
            options: undefined,
            correct_answer: undefined,
            explanation: 'Fluency, pronunciation, vocabulary range, and task completion are assessed.',
            max_score: 25.0,
          },
          {
            question_number: 2,
            question_type: QuestionType.SPEAKING_AUDIO,
            prompt: 'Describe a place you have visited that made a strong impression on you. Explain what made it special and whether you would recommend it to others. (Speak for 60-90 seconds.)',
            options: undefined,
            correct_answer: undefined,
            explanation: 'Extended response showing range of tenses, connectives, and descriptive vocabulary.',
            max_score: 25.0,
          },
          {
            question_number: 3,
            question_type: QuestionType.SPEAKING_AUDIO,
            prompt: 'Some people argue that technology has made society more disconnected. Do you agree? Give your opinion with reasons and examples. (Speak for 60-90 seconds.)',
            options: undefined,
            correct_answer: undefined,
            explanation: 'Discursive speaking with opinion, reasons, and examples. Logical organisation expected.',
            max_score: 50.0,
          },
        ],
      },
    },
  });

  // Cập nhật duration exam nếu cần
  await prisma.exam.update({
    where: { id: fullTestExam.id },
    data: { duration_minutes: 162 },
  });

  const updated = await prisma.exam.findUnique({
    where: { id: fullTestExam.id },
    include: {
      parts: {
        include: { _count: { select: { questions: true } } },
      },
    },
  });

  console.log('\n✅ Full Test seeded successfully!');
  console.log(`   Exam ID: ${updated?.id}`);
  updated?.parts.forEach((p) => {
    console.log(`   Part ${p.part_number}: "${p.title}" - ${p._count.questions} question(s)`);
  });

  console.log('\n=== FULL TEST SEEDING COMPLETE ===');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
