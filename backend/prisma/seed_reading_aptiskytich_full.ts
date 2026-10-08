/**
 * SEED SCRIPT: Toàn bộ danh mục đề thi Reading chuẩn aptiskytich.vn
 * 3 bộ đề Full Reading (Đề 01, Đề 02, Đề 03) độc lập chủ đề:
 * - Đề 01: Cuộc sống đô thị & Ẩm thực (City Living & Gastronomy)
 * - Đề 02: Du lịch, Hàng không & Không gian xanh (Travel, Aviation & Green Spaces)
 * - Đề 03: Khoa học, Khám phá & Năng lượng tái tạo (Science, Expedition & Solar Power)
 */
import 'dotenv/config';
import { PrismaClient, ExamSkill, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

const READING_EXAMS = [
  // ==========================================
  // ĐỀ 01
  // ==========================================
  {
    title: 'Đề 01 — Full Reading · 4 Parts',
    description: 'Chủ đề Cuộc sống đô thị & Ẩm thực — Đầy đủ 4 Parts (Gap fill, Text cohesion, Opinion matching, Long reading).',
    isPro: false,
    p1: {
      title: 'Part 1 – Sentence comprehension',
      instructions: 'Choose the word that fits in the gap. The first one is done for you.',
      passage_text: 'I live in a flat. I [share] it with my friend. We are in the same [class]. We [walk] to work. We like to [cook] dinner.',
      gaps: [
        { num: 1, p: 'I [gap] it with my friend.', opts: ['share', 'keep', 'send'], cor: 'share' },
        { num: 2, p: 'We are in the same [gap].', opts: ['class', 'room', 'team'], cor: 'class' },
        { num: 3, p: 'We [gap] to work.', opts: ['walk', 'smile', 'ride'], cor: 'walk' },
        { num: 4, p: 'We like to [gap] dinner.', opts: ['cook', 'make', 'eat'], cor: 'cook' },
      ],
    },
    p2: {
      title: 'Part 2 + 3 – Text cohesion',
      instructions: 'The sentences below make a complete text. Put them in the correct order.',
      stories: [
        {
          num: 1,
          title: 'Delivery instructions',
          fixedSentence: 'You should arrive at the main office by 6.30am and collect your keys',
          sentences: [
            { id: 's2', text: 'In the office, you can also collect a map of your route' },
            { id: 's3', text: 'You must follow the route on the map to deliver packages' },
            { id: 's4', text: 'When you have completed all deliveries, return to your office' },
            { id: 's5', text: 'You must return your keys to the office manager after you get back' },
          ],
          order: ['s2', 's3', 's4', 's5'],
        },
        {
          num: 2,
          title: 'Tom Harper',
          fixedSentence: 'When he was young, he began writing short stories for a magazine',
          sentences: [
            { id: 's3', text: 'he almost left the magazine, but then he decided to create some unusual new characters' },
            { id: 's4', text: 'the characters he imagined were one of the most famous in the world' },
            { id: 's5', text: 'this popularity made Tom Harper rich and successful.' },
            { id: 's2', text: 'he soon wrote regularly for the magazine, but he was not satisfied' },
          ],
          order: ['s2', 's3', 's4', 's5'],
        },
      ],
    },
    p3: {
      title: 'Part 4 – Opinion matching',
      instructions: 'Four people write reviews of a new restaurant in their town on a website. Read the texts and then answer the questions below.',
      passage_text: `A\nI'm not sure if I will return to this restaurant. I think the staff was arguing when I got there, because the atmosphere here was not very comfortable. As for the food, I think there's nothing to write about. I ordered fish and chips, it wasn't bad, but it wasn't good either. But many people say that the food here is fabulous. So, I think I'm an exception.\n\nB\nThis is a very famous restaurant that I saw in the newspaper. Sadly, I arrived later than the rest of the party, so I didn't get to order dinner. However, I ordered orange juice and mango juice and they were both delicious. What about the surroundings? Lively music along with fashionable and appropriate decor makes me feel very comfortable.\n\nC\nI don't understand why this restaurant is so famous. When I arrived and saw a menu with lots of different dishes, I saw this as a bad sign. Furthermore, the menu with traditional dishes contrasting with the modern decoration style made me feel very confused and strange. The waiters here were also not friendly. This was one of my worst experiences eating at a restaurant.\n\nD\nThis is my first time coming to this restaurant. The food is very cheap but the quality is excellent. I was very surprised with the starter because its menu is very diverse. But there is one thing that I want the restaurant to improve. The restaurant band played live music but it was very far away, so the sound was very low and it didn't make the meal atmosphere lively. Next time turn the music louder, please!`,
      opinions: [
        { num: 1, p: 'Who enjoyed the atmosphere?', cor: 'Person B' },
        { num: 2, p: 'Who thought the music was too quiet?', cor: 'Person D' },
        { num: 3, p: "Who didn't eat anything at the restaurant?", cor: 'Person B' },
        { num: 4, p: 'Who will definitely not return to the restaurant?', cor: 'Person C' },
        { num: 5, p: 'Who thought their bad experience was probably unusual?', cor: 'Person A' },
        { num: 6, p: 'Who was impressed by the range of appetizers?', cor: 'Person D' },
        { num: 7, p: 'Who thought the food was of average quality?', cor: 'Person A' },
      ],
    },
    p4: {
      title: 'Part 5 – Long reading',
      instructions: 'Read the passage quickly. Choose a heading for each numbered paragraph from the drop-down box.',
      passage_text: 'Children and Exercises',
      headings: [
        'Technology is not the only cause of inactivity',
        'The physical and mental perils of sedentary life',
        'Schools leading the fitness transformation',
        'Parental encouragement makes a vital difference',
        'Redesigning community and recreational spaces',
        'The long-term economic burden of health issues',
        'Small daily habits for lifelong wellbeing',
      ],
    },
  },

  // ==========================================
  // ĐỀ 02
  // ==========================================
  {
    title: 'Đề 02 — Full Reading · 4 Parts',
    description: 'Chủ đề Du lịch, Hàng không & Không gian xanh — Luyện tập đọc hiểu nâng cao.',
    isPro: true,
    p1: {
      title: 'Part 1 – Sentence comprehension',
      instructions: 'Choose the word that fits in the gap. The first one is done for you.',
      passage_text: 'Dear John, I [booked] our flights yesterday. We will [stay] in a seaside hotel. I [hope] the weather is warm. Let me [know] if you need anything.',
      gaps: [
        { num: 1, p: 'Dear John, I [gap] our flights yesterday.', opts: ['booked', 'opened', 'drove'], cor: 'booked' },
        { num: 2, p: 'We will [gap] in a seaside hotel.', opts: ['stay', 'watch', 'stand'], cor: 'stay' },
        { num: 3, p: 'I [gap] the weather is warm.', opts: ['hope', 'think', 'speak'], cor: 'hope' },
        { num: 4, p: 'Let me [gap] if you need anything.', opts: ['know', 'bring', 'catch'], cor: 'know' },
      ],
    },
    p2: {
      title: 'Part 2 + 3 – Text cohesion',
      instructions: 'The sentences below make a complete text. Put them in the correct order.',
      stories: [
        {
          num: 1,
          title: 'Airport baggage process',
          fixedSentence: 'After checking in your luggage at the counter, it moves along a conveyor belt',
          sentences: [
            { id: 's2', text: 'Barcodes on each suitcase tag are scanned by automated sensor systems' },
            { id: 's3', text: 'Trained ground handlers then load baggage into large transport containers' },
            { id: 's4', text: 'These containers are driven directly to the aircraft cargo hold' },
            { id: 's5', text: 'Upon arrival, baggage is transferred swiftly onto the passenger carousel' },
          ],
          order: ['s2', 's3', 's4', 's5'],
        },
        {
          num: 2,
          title: 'Early Aviation History',
          fixedSentence: 'In the late nineteenth century, aviation pioneers experimented with gliders',
          sentences: [
            { id: 's2', text: 'The Wright brothers designed lightweight engines capable of sustained flight' },
            { id: 's3', text: 'In 1903, their historic powered aircraft stayed aloft for twelve seconds' },
            { id: 's4', text: 'News of this feat sparked rapid aeronautical development across Europe' },
            { id: 's5', text: 'Within two decades, commercial air transport had become an everyday reality' },
          ],
          order: ['s2', 's3', 's4', 's5'],
        },
      ],
    },
    p3: {
      title: 'Part 4 – Opinion matching',
      instructions: 'Four travelers share their experiences and viewpoints on commercial flying. Read the texts and answer the questions.',
      passage_text: `A\nFlying used to feel exciting, but long security queues and cramped legroom now make it exhausting. I try to travel by high-speed rail whenever possible, even if it takes a couple of hours longer. Train stations are usually situated right in the city center, saving expensive airport taxi fares.\n\nB\nFor international business trips, air travel remains completely irreplaceable. Airline loyalty lounges provide quiet desks and high-speed Wi-Fi, allowing me to stay productive between flights. Budget airlines may cut corners, but premium flag carriers still deliver outstanding comfort.\n\nC\nMy chief concern regarding frequent flying is its severe carbon footprint. Aviation emissions contribute massively to global warming. Until sustainable aviation fuels or hydrogen electric airplanes become commercially viable, individuals should actively reduce unnecessary holiday flights.\n\nD\nAs a solo backpacker on a tight budget, low-cost airlines have opened up the globe for my generation. Being able to cross entire continents for the price of a modest dinner is miraculous. If you pack light with just a cabin backpack, flying is both economical and hassle-free.`,
      opinions: [
        { num: 1, p: 'Who prefers traveling by rail instead of airplanes?', cor: 'Person A' },
        { num: 2, p: 'Who emphasizes the environmental impact of air travel?', cor: 'Person C' },
        { num: 3, p: 'Who considers budget airlines a great opportunity for youth travel?', cor: 'Person D' },
        { num: 4, p: 'Who finds airline lounges beneficial for remote work?', cor: 'Person B' },
        { num: 5, p: 'Who avoids checked luggage to keep travel easy and cheap?', cor: 'Person D' },
        { num: 6, p: 'Who dislikes long queues and airport security checks?', cor: 'Person A' },
        { num: 7, p: 'Who believes international business travel cannot replace flying?', cor: 'Person B' },
      ],
    },
    p4: {
      title: 'Part 5 – Long reading',
      instructions: 'Read the passage about Urban Green Spaces. Choose a heading for each paragraph from the drop-down box.',
      passage_text: 'Urban Green Spaces and Biodiverse Cities',
      headings: [
        'Mitigating the dangerous urban heat island effect',
        'Psychological serenity and stress reduction among city dwellers',
        'Fostering urban wildlife corridors and biodiversity',
        'Rooftop agriculture and community food gardens',
        'Economic appreciation of properties near public parks',
        'Architectural integration of living walls and vertical forests',
        'Citizen volunteer stewardship preserving botanical heritage',
      ],
    },
  },

  // ==========================================
  // ĐỀ 03
  // ==========================================
  {
    title: 'Đề 03 — Full Reading · 4 Parts',
    description: 'Chủ đề Khoa học, Khám phá & Năng lượng tái tạo — Định dạng chuẩn Aptis ESOL.',
    isPro: true,
    p1: {
      title: 'Part 1 – Sentence comprehension',
      instructions: 'Choose the word that fits in the gap. The first one is done for you.',
      passage_text: 'Welcome to the university [library]. Please remember to [return] all books on time. You can [borrow] up to five items. Do not [forget] your student card.',
      gaps: [
        { num: 1, p: 'Welcome to the university [gap].', opts: ['library', 'kitchen', 'garden'], cor: 'library' },
        { num: 2, p: 'Please remember to [gap] all books on time.', opts: ['return', 'close', 'fly'], cor: 'return' },
        { num: 3, p: 'You can [gap] up to five items.', opts: ['borrow', 'catch', 'throw'], cor: 'borrow' },
        { num: 4, p: 'Do not [gap] your student card.', opts: ['forget', 'sing', 'sleep'], cor: 'forget' },
      ],
    },
    p2: {
      title: 'Part 2 + 3 – Text cohesion',
      instructions: 'The sentences below make a complete text. Put them in the correct order.',
      stories: [
        {
          num: 1,
          title: 'Pine Mountain Expedition',
          fixedSentence: 'The expedition team assembled at base camp at sunrise to inspect their gear',
          sentences: [
            { id: 's2', text: 'Dense morning fog made navigating the preliminary rocky ridge perilous' },
            { id: 's3', text: 'By midday, the cloud cover lifted, revealing a breathtaking valley vista' },
            { id: 's4', text: 'They collected rare botanical specimens near the alpine freshwater spring' },
            { id: 's5', text: 'Before sunset, the researchers set up camp in a sheltered mountain clearing' },
          ],
          order: ['s2', 's3', 's4', 's5'],
        },
        {
          num: 2,
          title: 'Steam Engine Revolution',
          fixedSentence: 'Before the eighteenth century, factories relied predominantly on water wheels',
          sentences: [
            { id: 's2', text: 'James Watt introduced a separate condenser that dramatically increased fuel efficiency' },
            { id: 's3', text: 'This breakthrough allowed manufacturing mills to operate far from rushing rivers' },
            { id: 's4', text: 'Production multiplied rapidly, accelerating the British Industrial Revolution' },
            { id: 's5', text: 'Steam locomotives soon transformed inland freight transport across continents' },
          ],
          order: ['s2', 's3', 's4', 's5'],
        },
      ],
    },
    p3: {
      title: 'Part 4 – Opinion matching',
      instructions: 'Four energy specialists discuss the transition to solar and renewable power.',
      passage_text: `A\nSolar energy has achieved grid parity across numerous nations, proving cheaper than coal power. However, energy storage remains the defining hurdle. Without high-capacity battery systems, balancing electricity grids during cloud cover or dark winter evenings poses severe technical risk.\n\nB\nDecentralized rooftop solar panels democratize energy production. Households become self-sufficient producers rather than passive utility consumers. In remote rural villages, standalone solar installations bring refrigeration and lighting where national grids failed for decades.\n\nC\nWe must critically examine the environmental lifecycle of solar photovoltaic modules. Manufacturing silicon cells requires intense chemical processing, and recycling decommissioned panels remains underdeveloped. Unless robust circular recycling chains are mandated, solar waste will present immense environmental hazards.\n\nD\nGovernments should combine offshore wind generation with floating solar farms on reservoirs. Water bodies cool the panels naturally, elevating electrical conversion efficiency while preventing reservoir evaporation. Blended hybrid renewables represent the most resilient path forward.`,
      opinions: [
        { num: 1, p: 'Who highlights the challenge of nocturnal and seasonal energy storage?', cor: 'Person A' },
        { num: 2, p: 'Who advocates combining floating solar panels with reservoirs?', cor: 'Person D' },
        { num: 3, p: 'Who points out the necessity of recycling decommissioned panels?', cor: 'Person C' },
        { num: 4, p: 'Who emphasizes solar power bringing electricity to isolated rural villages?', cor: 'Person B' },
        { num: 5, p: 'Who notes water cooling increases solar panel efficiency?', cor: 'Person D' },
        { num: 6, p: 'Who considers manufacturing chemicals an environmental risk?', cor: 'Person C' },
        { num: 7, p: 'Who values households becoming independent energy producers?', cor: 'Person B' },
      ],
    },
    p4: {
      title: 'Part 5 – Long reading',
      instructions: 'Read the text about Deep Ocean Exploration. Choose a heading for each paragraph.',
      passage_text: 'Mysteries of the Deep Ocean Floor',
      headings: [
        'The crushing atmospheric pressure of the abyssal zone',
        'Hydrothermal vents hosting chemotrophic ecosystems',
        'Bioluminescence: living light in pitch darkness',
        'Submersible robotics revolutionizing deep ocean mapping',
        'Pharmaceutical breakthroughs derived from benthic organisms',
        'The geopolitical race for deep-sea mineral nodules',
        'International treaties safeguarding unmapped marine trenches',
      ],
    },
  },
];

async function main() {
  console.log('--- SEEDING APTIS KY TICH READING MODULE (3 DISTINCT FULL EXAMS) ---');

  for (const item of READING_EXAMS) {
    let exam = await prisma.exam.findFirst({ where: { title: item.title } });
    if (exam) {
      await prisma.examPart.deleteMany({ where: { exam_id: exam.id } });
      await prisma.exam.update({
        where: { id: exam.id },
        data: {
          description: item.description,
          duration_minutes: 35,
          skill: ExamSkill.READING,
          is_pro: item.isPro,
          is_published: true,
        },
      });
    } else {
      exam = await prisma.exam.create({
        data: {
          title: item.title,
          description: item.description,
          skill: ExamSkill.READING,
          duration_minutes: 35,
          is_pro: item.isPro,
          is_published: true,
          source: 'WEB',
        },
      });
    }

    // Part 1
    const p1 = await prisma.examPart.create({
      data: {
        exam_id: exam.id,
        part_number: 1,
        title: item.p1.title,
        instructions: item.p1.instructions,
        passage_text: item.p1.passage_text,
      },
    });
    for (const g of item.p1.gaps) {
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

    // Part 2
    const p2 = await prisma.examPart.create({
      data: {
        exam_id: exam.id,
        part_number: 2,
        title: item.p2.title,
        instructions: item.p2.instructions,
        passage_text: item.p2.stories.map((s) => s.title).join(' | '),
      },
    });
    for (const story of item.p2.stories) {
      await prisma.question.create({
        data: {
          part_id: p2.id,
          question_number: story.num,
          question_type: QuestionType.SENTENCE_ORDER,
          prompt: `${story.title}: Put the sentences below in the correct order.`,
          options: {
            title: story.title,
            fixedSentence: story.fixedSentence,
            sentences: story.sentences,
          },
          correct_answer: JSON.stringify(story.order),
          max_score: 8.5,
        },
      });
    }

    // Part 3 (Opinion matching)
    const p3 = await prisma.examPart.create({
      data: {
        exam_id: exam.id,
        part_number: 4,
        title: item.p3.title,
        instructions: item.p3.instructions,
        passage_text: item.p3.passage_text,
      },
    });
    for (const op of item.p3.opinions) {
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

    // Part 4 (Long reading)
    const p4 = await prisma.examPart.create({
      data: {
        exam_id: exam.id,
        part_number: 5,
        title: item.p4.title,
        instructions: item.p4.instructions,
        passage_text: item.p4.passage_text,
      },
    });
    for (let i = 0; i < item.p4.headings.length; i++) {
      await prisma.question.create({
        data: {
          part_id: p4.id,
          question_number: i + 1,
          question_type: QuestionType.MATCHING,
          prompt: `Paragraph ${i + 1}: ${item.p4.passage_text} key topic analysis.`,
          options: item.p4.headings,
          correct_answer: item.p4.headings[i],
          max_score: 1.85,
        },
      });
    }

    console.log(`Created/Updated Full Reading exam: ${item.title}`);
  }

  console.log('--- ALL 3 READING EXAMS SEEDED SUCCESSFULLY! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
