import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== CẬP NHẬT CHUẨN XÁC CÂU HỎI BOOK CLUB & CÁC ĐỀ FULL TEST ===\n');

  // 1. Cập nhật câu hỏi Book Club theo chuẩn hình chụp của bạn:
  // "Please tell me about your free time and hobbies?"
  const bookInstructions = "You are a new member of a book club. Fill in the form. Write in sentences. Use 20–30 words. Recommended time: 7 minutes.";
  const bookQuestion = "Please tell me about your free time and hobbies?";
  const bookAnswer = "In my free time, I really enjoy reading books and novels, as well as spending time outdoors with my friends. Reading helps me relax and broaden my perspective.";

  // Update all Book Club Part 2 in database
  const bookParts = await prisma.examPart.findMany({
    where: {
      OR: [
        { title: { contains: 'Part 2', mode: 'insensitive' } },
        { part_number: 2 },
        { exam: { title: { contains: 'Book', mode: 'insensitive' } } }
      ],
      AND: [
        {
          OR: [
            { exam: { title: { contains: 'Book', mode: 'insensitive' } } },
            { instructions: { contains: 'Book', mode: 'insensitive' } },
            { questions: { some: { prompt: { contains: 'Book', mode: 'insensitive' } } } },
            { questions: { some: { prompt: { contains: 'buy books', mode: 'insensitive' } } } },
          ]
        }
      ]
    },
    include: { questions: true, exam: true }
  });

  console.log(`Found ${bookParts.length} Book Club Part 2 parts to update.`);
  for (const p of bookParts) {
    if (!p.title.toLowerCase().includes('part 2') && p.part_number !== 2 && !p.title.toLowerCase().includes('short text')) {
      continue;
    }
    console.log(`Updating Book Club in Exam [${p.exam.skill}]: "${p.exam.title}"`);
    await prisma.examPart.update({
      where: { id: p.id },
      data: { instructions: bookInstructions }
    });

    for (const q of p.questions) {
      console.log(`  Updating Q [${q.id}]: old prompt: "${q.prompt}" -> new prompt: "${bookQuestion}"`);
      await prisma.question.update({
        where: { id: q.id },
        data: {
          prompt: bookQuestion,
          explanation: bookAnswer,
        }
      });
    }
  }

  // 2. Cập nhật toàn bộ các đề thi Full Test (Kỳ Tích) còn chứa câu chỉ dẫn trong prompt
  const ftMap: Record<string, { instruction: string; question: string; answer: string }> = {
    'art club': {
      instruction: "You are a new member of the art club. Fill in the form. Write in sentences. Use 20–30 words. Recommended time: 7 minutes.",
      question: "Tell us about a painting or photo you like.",
      answer: "I took a photo last weekend in the park when the sun was setting. The light was soft, so the picture looked very nice.",
    },
    'beautiful houses': {
      instruction: "You are a new member of the beautiful houses club. Fill in the form. Write in sentences. Use 20–30 words. Recommended time: 7 minutes.",
      question: "Why do you want to join the Beautiful Houses Club?",
      answer: "I want to join the Beautiful Houses Club because I love architecture and interior design. I hope to learn more about decorating my own home.",
    },
    'business club': {
      instruction: "You are a new member of the business club. Fill in the form. Write in sentences. Use 20–30 words. Recommended time: 7 minutes.",
      question: "Where do you usually go shopping?",
      answer: "I usually shop at premium stores in the city centre for business attire and essentials. For gadgets, I prefer specialised outlets or online platforms.",
    },
    'car club': {
      instruction: "Now you've become a new member of the Car Club. Fill in the form. Write in sentences. Use 20-30 words",
      question: "Do you usually travel by car?",
      answer: "Yes, I usually travel by car to work and on weekend road trips with my family because it is comfortable and convenient.",
    },
    'cinema club': {
      instruction: "Now you've become a new member of the Cinema Club. Fill in the form. Write in sentences. Use 20-30 words",
      question: "When and how often do you watch films?",
      answer: "I usually watch films on weekend evenings with my family or friends. We enjoy watching action and comedy movies together.",
    },
    'college': {
      instruction: "You are a new student at the college. Fill in the form. Write in sentences. Use 20–30 words. Recommended time: 7 minutes.",
      question: "Please tell us which days and times you can attend courses and what you would like to study.",
      answer: "I can attend courses on Tuesday and Thursday evenings from 6 p.m. to 8 p.m. I would like to study English and digital marketing.",
    },
    'community club': {
      instruction: "You are a new member of the community club. Fill in the form. Write in sentences. Use 20–30 words. Recommended time: 7 minutes.",
      question: "Why did you decide to join the club?",
      answer: "I decided to join the community club because I want to meet my neighbours and contribute to local voluntary charity activities.",
    },
    'computer club': {
      instruction: "Now you've become a new member of the Computer Club. Fill in the form. Write in sentences. Use 20-30 words",
      question: "When and where do you use a computer?",
      answer: "I use my laptop every weekday at my office for software development, and at home in the evening to read news and study English.",
    },
    'debate club': {
      instruction: "You are a new member of the debate club. Fill in the form. Write in sentences. Use 20–30 words. Recommended time: 7 minutes.",
      question: "Why did you decide to join the debate club?",
      answer: "I joined the debate club to build my public speaking confidence and learn how to construct persuasive arguments effectively.",
    },
    'english club': {
      instruction: "Now you've become a new member of the English Club. Fill in the form. Write in sentences. Use 20-30 words",
      question: "When and why did you start learning English?",
      answer: "I started learning English in secondary school because it is a global language that opens up great career opportunities.",
    },
    'fashion club': {
      instruction: "You are a new member of the fashion club. Fill in the form. Write in sentences. Use 20–30 words. Recommended time: 7 minutes.",
      question: "When was the last time you went shopping for clothes?",
      answer: "I went shopping for clothes last Saturday with my sister at a big shopping centre. I bought a blue jacket and two T-shirts for the summer.",
    },
    'film club': {
      instruction: "Now you've become a new member of the Film Club. Fill in the form. Write in sentences. Use 20-30 words",
      question: "Please write about some of your favourite films and why you like watching them.",
      answer: "Some of my favorite films are Inception and The Dark Knight. I enjoy them for their complex plots, amazing visuals, and great acting.",
    },
    'fitness club': {
      instruction: "Now you've become a new member of the Fitness Club. Fill in the form. Write in sentences. Use 20-30 words",
      question: "What kind of exercise do you usually do, and when do you do it?",
      answer: "I often go for a walk in the park near my home at 6 p.m. Walking helps me feel better and sleep well at night.",
    },
    'food club': {
      instruction: "Now you've become a new member of the Food Club. Fill in the form. Write in sentences. Use 20-30 words",
      question: "When was the last time you ate out and where did you eat?",
      answer: "The last time I ate out was last Saturday at a small noodle restaurant near my house. I went there with my family and had beef pho.",
    },
    'garden club': {
      instruction: "Now you've become a new member of the Garden Club. Fill in the form. Write in sentences. Use 20-30 words",
      question: "Why did you join the club?",
      answer: "I joined the garden club because I love plants and gardening. I want to learn more about growing different types of plants.",
    },
    'nature club': {
      instruction: "Now you've become a new member of the Nature Club. Fill in the form. Write in sentences. Use 20-30 words",
      question: "What do you like doing when you spend time outdoors?",
      answer: "I like playing football, riding my bike, and having picnics with my friends because these activities help me relax and stay healthy.",
    },
    'photography club': {
      instruction: "Now you've become a new member of the Photography Club. Fill in the form. Write in sentences. Use 20-30 words",
      question: "Please tell me about the last time you took a picture.",
      answer: "I took a photo last weekend in the park when the sun was setting. The light was soft, so the picture looked very nice.",
    },
    'science club': {
      instruction: "You are a new member of the science club. Fill in the form. Write in sentences. Use 20–30 words. Recommended time: 7 minutes.",
      question: "Do you like science? Why or why not?",
      answer: "Yes, I really like science because it explains how the world around us works. I especially enjoy doing experiments and finding out why things happen.",
    },
    'travel club': {
      instruction: "Now you've become a new member of the Travel Club. Fill in the form. Write in sentences. Use 20-30 words",
      question: "Tell me about a place you often visit.",
      answer: "I often visit a nearby park. It is a peaceful place where I enjoy walking, reading, or just relaxing with the fresh air.",
    },
    'walking club': {
      instruction: "Now you've become a new member of the Walking Club. Fill in the form. Write in sentences. Use 20-30 words",
      question: "When and where do you like to go walking?",
      answer: "I often go for a walk in the park near my home at 6 p.m. Walking helps me feel better and sleep well at night.",
    },
  };

  // Find remaining questions in FULL_TEST exams
  const remaining = await prisma.question.findMany({
    where: {
      OR: [
        { prompt: { contains: "become a new member", mode: 'insensitive' } },
        { prompt: { contains: "Fill in the form", mode: 'insensitive' } },
        { prompt: { contains: "You are a new member", mode: 'insensitive' } },
      ]
    },
    include: { part: { include: { exam: true } } }
  });

  console.log(`\nFound ${remaining.length} remaining questions with instruction prompt.`);
  for (const q of remaining) {
    const fullText = `${q.prompt} ${q.part.instructions || ''} ${q.part.exam.title}`.toLowerCase();
    let matched = null;
    for (const [key, val] of Object.entries(ftMap)) {
      if (fullText.includes(key)) {
        matched = val;
        break;
      }
    }

    if (matched) {
      console.log(`Fixing [${q.part.exam.title}]`);
      console.log(`  New Question: "${matched.question}"`);
      await prisma.examPart.update({
        where: { id: q.part.id },
        data: { instructions: matched.instruction }
      });
      await prisma.question.update({
        where: { id: q.id },
        data: {
          prompt: matched.question,
          explanation: matched.answer,
        }
      });
    } else {
      console.log(`Could not match: "${q.prompt}" in Exam: "${q.part.exam.title}"`);
    }
  }

  console.log('\n🎉 ĐÃ CẬP NHẬT HOÀN TẤT!');
  await prisma.$disconnect();
}

main().catch(console.error);
