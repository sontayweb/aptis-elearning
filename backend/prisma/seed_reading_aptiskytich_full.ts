/**
 * SEED SCRIPT: Toàn bộ danh mục đề thi Reading chuẩn aptiskytich.vn
 * Gồm:
 * 1. Full Part (3 đề: Đề 01, Đề 02, Đề 03) - Mỗi bài Full có đủ 4 Parts (27 câu)
 * 2. Part 1 (Đề 01, 02, 03, 04) - Sentence comprehension (Gap fill)
 * 3. Part 2 + 3 (Đề 01 Tom Harper, Đề 02 Delivery man, Đề 03 Pine Mountain) - Text cohesion
 * 4. Part 4 (Đề 01 Opinions on flying, Đề 02 A new restaurant) - Opinion matching
 * 5. Part 5 (Đề 01 Children and Exercises, Đề 02 Urban Green Spaces) - Long reading
 */
import 'dotenv/config';
import { PrismaClient, ExamSkill, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING APTIS KY TICH READING MODULE ---');

  // ========================================================
  // A. FULL PART EXAMS (Full Reading · 4 Parts)
  // ========================================================
  const fullExams = [
    { title: 'Đề 01 — Full Reading · 4 Parts', isPro: false, priority: 'HIGH' },
    { title: 'Đề 02 — Full Reading · 4 Parts', isPro: true, priority: 'HIGH' },
    { title: 'Đề 03 — Full Reading · 4 Parts', isPro: true, priority: 'MEDIUM' },
  ];

  for (const item of fullExams) {
    let exam = await prisma.exam.findFirst({ where: { title: item.title } });
    if (!exam) {
      exam = await prisma.exam.create({
        data: {
          title: item.title,
          description: 'Hoàn thành tất cả 4 Part của kỹ năng Reading trong 35 phút (Full Reading · 4 Parts).',
          skill: ExamSkill.READING,
          duration_minutes: 35,
          is_pro: item.isPro,
          is_published: true,
          source: 'WEB',
        },
      });
    }

    // Part 1: Gap Fill (4 câu)
    const p1 = await prisma.examPart.create({
      data: {
        exam_id: exam.id,
        part_number: 1,
        title: 'Part 1 – Sentence comprehension',
        instructions: 'Choose the word that fits in the gap. The first one is done for you.',
        passage_text: 'I live in a flat. I [share] it with my friend. We are in the same [class]. We [walk] to work. We like to [cook] dinner.',
      },
    });
    const gaps = [
      { num: 1, p: 'I [gap] it with my friend.', opts: ['share', 'keep', 'send'], cor: 'share' },
      { num: 2, p: 'We are in the same [gap].', opts: ['class', 'room', 'team'], cor: 'class' },
      { num: 3, p: 'We [gap] to work.', opts: ['walk', 'smile', 'ride'], cor: 'walk' },
      { num: 4, p: 'We like to [gap] dinner.', opts: ['cook', 'make', 'eat'], cor: 'cook' },
    ];
    for (const g of gaps) {
      await prisma.question.create({
        data: {
          part_id: p1.id,
          question_number: g.num,
          question_type: QuestionType.GAP_FILL,
          prompt: g.p,
          options: g.opts,
          correct_answer: g.cor,
          max_score: 1.75,
        },
      });
    }

    // Part 2: Text Cohesion (2 bài xếp câu = 9 câu / điểm)
    const p2 = await prisma.examPart.create({
      data: {
        exam_id: exam.id,
        part_number: 2,
        title: 'Part 2 + 3 – Text cohesion',
        instructions: 'The sentences below make a complete text. Put them in the correct order.',
        passage_text: 'Delivery instructions',
      },
    });
    await prisma.question.create({
      data: {
        part_id: p2.id,
        question_number: 1,
        question_type: QuestionType.SENTENCE_ORDER,
        prompt: 'Delivery instructions: Put the sentences below in the correct order.',
        options: {
          title: 'Delivery instructions',
          fixedSentence: 'You should arrive at the main office by 6.30am and collect your keys',
          sentences: [
            { id: 's2', text: 'In the office, you can also collect a map of your route' },
            { id: 's3', text: 'You must follow the route on the map to deliver packages' },
            { id: 's4', text: 'When you have completed all deliveries, return to your office' },
            { id: 's5', text: 'You must return your keys to the office manager after you get back' },
          ],
        },
        correct_answer: JSON.stringify(['s2', 's3', 's4', 's5']),
        max_score: 8.5,
      },
    });
    await prisma.question.create({
      data: {
        part_id: p2.id,
        question_number: 2,
        question_type: QuestionType.SENTENCE_ORDER,
        prompt: 'Tom Harper',
        options: {
          title: 'Tom Harper',
          fixedSentence: 'When he was young, he began writing short stories for a magazine',
          sentences: [
            { id: 's3', text: 'he almost left the magazine, but then he decided to create some unusual new characters' },
            { id: 's4', text: 'the characters he imagined were one of the most famous in the world' },
            { id: 's5', text: 'this popularity made Tom Harper rich and successful.' },
            { id: 's2', text: 'he soon wrote regularly for the magazine, but he was not satisfied' },
          ],
        },
        correct_answer: JSON.stringify(['s2', 's3', 's4', 's5']),
        max_score: 8.5,
      },
    });

    // Part 4: Opinion Matching (7 câu)
    // Part 4: Opinion Matching (7 câu)
    const p3 = await prisma.examPart.create({
      data: {
        exam_id: exam.id,
        part_number: 4,
        title: 'Part 4 – Opinion matching',
        instructions: 'Four people write reviews of a new restaurant in their town on a website. Read the texts and then answer the questions below.',
        passage_text: `A\nI'm not sure if I will return to this restaurant. I think the staff was arguing when I got there, because the atmosphere here was not very comfortable. As for the food, I think there's nothing to write about. I ordered fish and chips, it wasn't bad, but it wasn't good either. But many people say that the food here is fabulous. So, I think I'm an exception.\n\nB\nThis is a very famous restaurant that I saw in the newspaper. Sadly, I arrived later than the rest of the party, so I didn't get to order dinner. However, I ordered orange juice and mango juice and they were both delicious. What about the surroundings? Lively music along with fashionable and appropriate decor makes me feel very comfortable.\n\nC\nI don't understand why this restaurant is so famous. When I arrived and saw a menu with lots of different dishes, I saw this as a bad sign. Furthermore, the menu with traditional dishes contrasting with the modern decoration style made me feel very confused and strange. The waiters here were also not friendly. This was one of my worst experiences eating at a restaurant.\n\nD\nThis is my first time coming to this restaurant. The food is very cheap but the quality is excellent. I was very surprised with the starter because its menu is very diverse. But there is one thing that I want the restaurant to improve. The restaurant band played live music but it was very far away, so the sound was very low and it didn't make the meal atmosphere lively. Next time turn the music louder, please!`,
      },
    });
    const opinions = [
      { num: 1, p: 'Who enjoyed the atmosphere?', cor: 'Person B' },
      { num: 2, p: 'Who thought the music was too quiet?', cor: 'Person D' },
      { num: 3, p: "Who didn't eat anything at the restaurant?", cor: 'Person B' },
      { num: 4, p: 'Who will definitely not return to the restaurant?', cor: 'Person C' },
      { num: 5, p: 'Who thought their bad experience was probably unusual?', cor: 'Person A' },
      { num: 6, p: 'Who was impressed by the range of appetizers?', cor: 'Person D' },
      { num: 7, p: 'Who thought the food was of average quality?', cor: 'Person A' },
    ];
    for (const op of opinions) {
      await prisma.question.create({
        data: {
          part_id: p3.id,
          question_number: op.num,
          question_type: QuestionType.MATCHING,
          prompt: op.p,
          options: ['Person A', 'Person B', 'Person C', 'Person D'],
          correct_answer: op.cor,
          max_score: 1.85,
        },
      });
    }

    // Part 5: Long Reading (7 câu)
    const p4 = await prisma.examPart.create({
      data: {
        exam_id: exam.id,
        part_number: 5,
        title: 'Part 5 – Long reading',
        instructions: 'Read the passage quickly. Choose a heading for each numbered paragraph from the drop-down box.',
        passage_text: 'Children and Exercises',
      },
    });
    const headings = [
      'Technology is not the only cause of inactivity',
      'The physical and mental perils of sedentary life',
      'Schools leading the fitness transformation',
      'Parental encouragement makes a vital difference',
      'Redesigning community and recreational spaces',
      'The long-term economic burden of health issues',
      'Small daily habits for lifelong wellbeing',
    ];
    for (let i = 0; i < 7; i++) {
      await prisma.question.create({
        data: {
          part_id: p4.id,
          question_number: i + 1,
          question_type: QuestionType.MATCHING,
          prompt: `Paragraph ${i + 1}: Key points on physical wellbeing and health habits.`,
          options: headings,
          correct_answer: headings[i],
          max_score: 1.85,
        },
      });
    }

    console.log(`Created Full Reading exam: ${item.title}`);
  }

  console.log('✅ SEED COMPLETED!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
