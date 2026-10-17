// Benchmark data for Writing clubs (Art, Fitness, Book, Travel)
export interface WritingQuestion {
  id?: string;
  questionNumber: number;
  prompt: string;
  sampleAnswer?: string;
}

export interface WritingPart {
  partNumber: number;
  partName: string;
  partSubtitle: string;
  minWords: number;
  maxWords: number;
  instructions: string;
  passageText?: string;
  recommendedMinutes: number;
  questions: WritingQuestion[];
}

// Fallback Default Art Club data chuẩn Aptis Kỳ Tích
export const DEFAULT_ART_CLUB_PARTS: WritingPart[] = [
  {
    partNumber: 1,
    partName: "Part 1 – Short Answers",
    partSubtitle: "Part 1 - Short Answers",
    minWords: 1,
    maxWords: 5,
    recommendedMinutes: 3,
    instructions:
      "You want to join an art club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt: "1. What do you like doing with your friends?",
        sampleAnswer: "Going to art exhibitions together.",
      },
      {
        questionNumber: 2,
        prompt: "2. Which sport do you like playing the most?",
        sampleAnswer: "Playing badminton and swimming.",
      },
      {
        questionNumber: 3,
        prompt: "3. What did you do last night?",
        sampleAnswer: "I watched an art documentary.",
      },
      {
        questionNumber: 4,
        prompt: "4. Do you like shopping?",
        sampleAnswer: "Yes, especially for painting supplies.",
      },
      {
        questionNumber: 5,
        prompt: "5. What is your favorite season of the year?",
        sampleAnswer: "Autumn, because of colorful leaves.",
      },
    ],
  },
  {
    partNumber: 2,
    partName: "Part 2 – Social Media Response",
    partSubtitle: "Part 2 - Social Media Response",
    minWords: 20,
    maxWords: 30,
    recommendedMinutes: 7,
    instructions:
      "You are a new member of the art club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt: "Tell us about a painting or photo you like.",
        sampleAnswer:
          "I took a photo last weekend in the park when the sun was setting. The light was soft, so the picture looked very nice.",
      },
    ],
  },
  {
    partNumber: 3,
    partName: "Part 3 – Three Questions",
    partSubtitle: "Part 3 - Three Questions",
    minWords: 30,
    maxWords: 40,
    recommendedMinutes: 10,
    instructions:
      "You are a member of the art club. You are talking to three other members in the club chat room. Talk to them using sentences. Use 30-40 words per answer. Recommended time: 10 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt:
          "1. I have kept a painting for a long time. Tell me about something that you have had for a long time.",
        sampleAnswer:
          "I have kept an oil painting created by my grandfather for over ten years. It hangs gracefully in my living room and always brings back warm memories of our time together.",
      },
      {
        questionNumber: 2,
        prompt:
          "2. I would like to learn painting, but I have not found an effective way. Should I take a course at my local college? Please give me some advice.",
        sampleAnswer:
          "Enrolling in a course at your local college is definitely a great choice because you receive structured lessons and immediate professional feedback. Moreover, studying with peers will motivate your artistic growth.",
      },
      {
        questionNumber: 3,
        prompt:
          "3. Street art, where people paint on buildings, is becoming popular. However, some people say it is bad. What is your opinion?",
        sampleAnswer:
          "In my view, street art brings vibrant energy and modern cultural charm to dull urban walls when done legally. However, unauthorized graffiti damaging heritage sites should certainly be discouraged.",
      },
    ],
  },
  {
    partNumber: 4,
    partName: "Part 4 – Formal & Informal Email",
    partSubtitle: "Part 4 - Formal & Informal Email",
    minWords: 50,
    maxWords: 150,
    recommendedMinutes: 20,
    instructions:
      "You are a member of the art club. You received an email from the club secretary stating that the annual art gallery visit has been canceled due to budget constraints.",
    questions: [
      {
        questionNumber: 1,
        prompt:
          "Write an email to a friend who is also an art club member. Write about your feelings and what you think the club should do. Write about 50 words.",
        sampleAnswer:
          "Hi Mark,\n\nDid you see the notice about our gallery excursion being called off? I was really looking forward to seeing the new modern art collection. Maybe we can suggest members contribute a small extra fee so the trip can still take place.\n\nBest,\nHiep",
      },
      {
        questionNumber: 2,
        prompt:
          "Write an email to the club secretary. Explain how you feel about the cancellation and suggest alternative ways the club could organize the trip or raise funds. Write 120-150 words.",
        sampleAnswer:
          "Dear Mr. Davis,\n\nI am writing to express my disappointment upon learning about the cancellation of our anticipated annual visit to the National Art Gallery. This excursion is one of the most enriching activities of the club year.\n\nWhile I appreciate the budgetary hurdles currently facing the committee, I would respectfully propose several constructive alternatives. Firstly, members could contribute a modest personal fee to cover transportation expenses. Secondly, we could organize a student art auction or reach out to local sponsors to bridge the deficit.\n\nI believe these solutions would enable us to proceed without placing an excessive burden on club finances. I hope the committee will favorably review these thoughts.\n\nYours sincerely,\nHoang Hiep",
      },
    ],
  },
];

// Fallback Sports & Fitness Club data (Đề 02)
export const DEFAULT_FITNESS_CLUB_PARTS: WritingPart[] = [
  {
    partNumber: 1,
    partName: "Part 1 – Short Answers",
    partSubtitle: "Part 1 - Short Answers",
    minWords: 1,
    maxWords: 5,
    recommendedMinutes: 3,
    instructions:
      "You want to join a sports and fitness club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt: "1. What is your favorite outdoor sport or physical activity?",
        sampleAnswer: "Swimming and playing badminton.",
      },
      {
        questionNumber: 2,
        prompt: "2. How often do you exercise each week?",
        sampleAnswer: "Three times every week.",
      },
      {
        questionNumber: 3,
        prompt: "3. What sports gear or equipment do you usually use?",
        sampleAnswer: "Running shoes and yoga mat.",
      },
      {
        questionNumber: 4,
        prompt: "4. What time of day do you prefer working out?",
        sampleAnswer: "Early morning before work.",
      },
      {
        questionNumber: 5,
        prompt: "5. Which season is best for outdoor running?",
        sampleAnswer: "Spring, with cool breezes.",
      },
    ],
  },
  {
    partNumber: 2,
    partName: "Part 2 – Social Media Response",
    partSubtitle: "Part 2 - Social Media Response",
    minWords: 20,
    maxWords: 30,
    recommendedMinutes: 7,
    instructions:
      "You are a new member of the sports and fitness club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt: "Please tell us why you want to join our sports club and what personal goals you wish to achieve.",
        sampleAnswer:
          "I want to join to improve my cardiovascular stamina and relieve stress after work. Exercising with club peers will keep me disciplined.",
      },
    ],
  },
  {
    partNumber: 3,
    partName: "Part 3 – Three Questions",
    partSubtitle: "Part 3 - Three Questions",
    minWords: 30,
    maxWords: 40,
    recommendedMinutes: 10,
    instructions:
      "You are a member of the sports club. You are talking to three other members in the club chat room. Talk to them using sentences. Use 30-40 words per answer. Recommended time: 10 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt:
          "1. I have just started training at the gym. How many days per week should a beginner exercise?",
        sampleAnswer:
          "As a beginner, three sessions per week is ideal. It allows your muscle tissue adequate recovery time while fostering a sustainable fitness habit without risking exhaustion.",
      },
      {
        questionNumber: 2,
        prompt:
          "2. The management is considering raising membership fees to purchase modern equipment. What is your opinion?",
        sampleAnswer:
          "Upgrading machinery is beneficial for member safety and workout variety. However, the club should provide discounted loyalty rates for existing members to reward their dedication.",
      },
      {
        questionNumber: 3,
        prompt:
          "3. Some people prefer exercising alone at home while others love group fitness classes. Which do you prefer?",
        sampleAnswer:
          "I prefer group workout classes because energetic music and motivated peers inspire me to push beyond my limits far more effectively than exercising alone.",
      },
    ],
  },
  {
    partNumber: 4,
    partName: "Part 4 – Formal & Informal Email",
    partSubtitle: "Part 4 - Formal & Informal Email",
    minWords: 50,
    maxWords: 150,
    recommendedMinutes: 20,
    instructions:
      "You are a member of the sports club. You received an email from the club manager stating that all weekend group workout sessions have been canceled due to staff shortages.",
    questions: [
      {
        questionNumber: 1,
        prompt:
          "Write an email to a friend who is also a sports club member. Write about your feelings and what you think the club should do. Write about 50 words.",
        sampleAnswer:
          "Hi Alex,\n\nDid you see the club notice about canceling weekend training sessions? I am quite upset since weekends are my only free window for exercise. We should talk to other members and suggest hiring temporary guest coaches.\n\nBest,\nHiep",
      },
      {
        questionNumber: 2,
        prompt:
          "Write an email to the club manager. Explain how you feel about the cancellation and suggest alternative ways the club could organize sessions or solve staffing issues. Write 120-150 words.",
        sampleAnswer:
          "Dear Mr. Henderson,\n\nI am writing to express my earnest concern regarding the recent decision to suspend weekend group workout sessions due to staffing shortages. As a working professional, weekends represent my primary availability to train consistently.\n\nWhile I completely appreciate the operational difficulties facing the club, I would respectfully like to suggest two constructive alternatives. Firstly, the club could hire accredited freelance fitness instructors on temporary contracts. Secondly, certified senior members could supervise peer-led workouts until permanent staff are recruited.\n\nI believe these solutions would enable members to continue their routines safely without placing an excessive burden on management. I hope you will give these suggestions favorable consideration.\n\nYours sincerely,\nHoang Hiep",
      },
    ],
  },
];

// Fallback Book Club data (Đề 03)
export const DEFAULT_BOOK_CLUB_PARTS: WritingPart[] = [
  {
    partNumber: 1,
    partName: "Part 1 – Short Answers",
    partSubtitle: "Part 1 - Short Answers",
    minWords: 1,
    maxWords: 5,
    recommendedMinutes: 3,
    instructions:
      "You want to join a book club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt: "1. What genre of books do you enjoy reading the most?",
        sampleAnswer: "Historical novels and biographies.",
      },
      {
        questionNumber: 2,
        prompt: "2. How often do you visit a bookstore or library?",
        sampleAnswer: "Twice every month.",
      },
      {
        questionNumber: 3,
        prompt: "3. What was the last book you finished?",
        sampleAnswer: "The Great Gatsby.",
      },
      {
        questionNumber: 4,
        prompt: "4. Do you prefer reading printed books or e-books?",
        sampleAnswer: "Printed books with paper feel.",
      },
      {
        questionNumber: 5,
        prompt: "5. Where is your favorite spot for reading?",
        sampleAnswer: "A quiet corner cafe.",
      },
    ],
  },
  {
    partNumber: 2,
    partName: "Part 2 – Social Media Response",
    partSubtitle: "Part 2 - Social Media Response",
    minWords: 20,
    maxWords: 30,
    recommendedMinutes: 7,
    instructions:
      "You are a new member of the book club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt: "Tell us about a book that made a strong impression on you and why you liked it.",
        sampleAnswer:
          "I recently read 'To Kill a Mockingbird'. It deeply moved me because of its profound message about justice, personal integrity, and unconditional human empathy.",
      },
    ],
  },
  {
    partNumber: 3,
    partName: "Part 3 – Three Questions",
    partSubtitle: "Part 3 - Three Questions",
    minWords: 30,
    maxWords: 40,
    recommendedMinutes: 10,
    instructions:
      "You are a member of the book club. You are talking to three other members in the club chat room. Talk to them using sentences. Use 30-40 words per answer. Recommended time: 10 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt:
          "1. I struggle to finish long books because of busy schedules. How do you find time to read daily?",
        sampleAnswer:
          "I set aside twenty minutes before bedtime every night without looking at my smartphone. Reading small chapters consistently accumulates quickly over weeks.",
      },
      {
        questionNumber: 2,
        prompt:
          "2. Our local municipal library might reduce its weekend opening hours. How do you feel about this?",
        sampleAnswer:
          "Reducing weekend hours would severely hurt students and working citizens who only have leisure time on Saturdays. The municipal council should recruit community volunteers instead.",
      },
      {
        questionNumber: 3,
        prompt:
          "3. Many young people prefer audiobooks over paper books now. What is your viewpoint?",
        sampleAnswer:
          "Audiobooks are fantastic for daily commutes and multitasking. However, printed books provide tactile pleasure and deeper focus that audio recordings cannot entirely replace.",
      },
    ],
  },
  {
    partNumber: 4,
    partName: "Part 4 – Formal & Informal Email",
    partSubtitle: "Part 4 - Formal & Informal Email",
    minWords: 50,
    maxWords: 150,
    recommendedMinutes: 20,
    instructions:
      "You are a member of the book club. You received an email from the club coordinator stating that next month's author meeting and discussion with novelist David Mitchell has been canceled.",
    questions: [
      {
        questionNumber: 1,
        prompt:
          "Write an email to a friend who is also a book club member. Write about your feelings and what you think the club should do. Write about 50 words.",
        sampleAnswer:
          "Hi Sarah,\n\nHave you heard about the author talk with David Mitchell being canceled? I am so disappointed as I had prepared several questions about his latest novel. Let us propose organizing a virtual session via Zoom instead.\n\nCheers,\nHiep",
      },
      {
        questionNumber: 2,
        prompt:
          "Write an email to the club coordinator. Explain how you feel about the cancellation and suggest alternative ways the club could organize the session. Write 120-150 words.",
        sampleAnswer:
          "Dear Ms. Watson,\n\nI am writing to express my regret upon receiving the notification that our scheduled author talk with David Mitchell has been canceled owing to travel issues.\n\nGiven the tremendous anticipation among club members, I would like to propose hosting this session virtually via video conference. This would eliminate travel constraints while still providing an engaging interactive platform for members to discuss the author's work.\n\nI hope the committee will consider this viable alternative.\n\nYours sincerely,\nHoang Hiep",
      },
    ],
  },
];

// Fallback Travel & Adventure Club data (Đề 04)
export const DEFAULT_TRAVEL_CLUB_PARTS: WritingPart[] = [
  {
    partNumber: 1,
    partName: "Part 1 – Short Answers",
    partSubtitle: "Part 1 - Short Answers",
    minWords: 1,
    maxWords: 5,
    recommendedMinutes: 3,
    instructions:
      "You want to join a travel and outdoor club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt: "1. What is your favorite holiday destination?",
        sampleAnswer: "Coastal beaches and mountains.",
      },
      {
        questionNumber: 2,
        prompt: "2. Who do you usually travel with?",
        sampleAnswer: "My family and close friends.",
      },
      {
        questionNumber: 3,
        prompt: "3. What essential item do you always pack?",
        sampleAnswer: "Camera and comfortable shoes.",
      },
      {
        questionNumber: 4,
        prompt: "4. How do you prefer to travel: plane, train, or car?",
        sampleAnswer: "Train, for scenic views.",
      },
      {
        questionNumber: 5,
        prompt: "5. What is the best season for traveling?",
        sampleAnswer: "Autumn, with pleasant mild weather.",
      },
    ],
  },
  {
    partNumber: 2,
    partName: "Part 2 – Social Media Response",
    partSubtitle: "Part 2 - Social Media Response",
    minWords: 20,
    maxWords: 30,
    recommendedMinutes: 7,
    instructions:
      "You are a new member of the travel club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt: "Tell us about a memorable journey or vacation you experienced recently.",
        sampleAnswer:
          "Last summer, I took a road trip along the central coastline. The crystal-clear sea and warm hospitality of local fishermen made it an unforgettable journey.",
      },
    ],
  },
  {
    partNumber: 3,
    partName: "Part 3 – Three Questions",
    partSubtitle: "Part 3 - Three Questions",
    minWords: 30,
    maxWords: 40,
    recommendedMinutes: 10,
    instructions:
      "You are a member of the travel club. You are talking to three other members in the club chat room. Talk to them using sentences. Use 30-40 words per answer. Recommended time: 10 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt:
          "1. Some people prefer solo travel while others always travel in groups. What do you prefer?",
        sampleAnswer:
          "I prefer traveling with friends because sharing local meals and exploring uncharted paths together creates unforgettable memories and enhances mutual safety.",
      },
      {
        questionNumber: 2,
        prompt:
          "2. Mass tourism is causing environmental damage to fragile heritage towns. What should authorities do?",
        sampleAnswer:
          "Municipal authorities should enforce daily tourist visitor quotas and channel tourism levies directly into historical conservation and eco-friendly waste management.",
      },
      {
        questionNumber: 3,
        prompt:
          "3. With rising airfares, budget travel has become challenging. What is your best cost-saving tip?",
        sampleAnswer:
          "Booking accommodations well in advance and dining at neighborhood markets rather than tourist cafes saves considerable funds while providing authentic cultural experiences.",
      },
    ],
  },
  {
    partNumber: 4,
    partName: "Part 4 – Formal & Informal Email",
    partSubtitle: "Part 4 - Formal & Informal Email",
    minWords: 50,
    maxWords: 150,
    recommendedMinutes: 20,
    instructions:
      "You are a member of the travel club. You received an email from the committee stating that the upcoming weekend exploration trip to the coastal national park has been canceled due to adverse weather warnings.",
    questions: [
      {
        questionNumber: 1,
        prompt:
          "Write an email to a friend who is also a travel club member. Write about your feelings and what you think the club should do. Write about 50 words.",
        sampleAnswer:
          "Hi Tom,\n\nDid you see the update about our national park trip being canceled? I was so excited to hike and camp by the coast. Perhaps we could suggest rescheduling to the following weekend once the weather clears.\n\nBest,\nHiep",
      },
      {
        questionNumber: 2,
        prompt:
          "Write an email to the club committee. Explain how you feel about the cancellation and suggest alternative ways the club could organize the excursion. Write 120-150 words.",
        sampleAnswer:
          "Dear Committee Members,\n\nI am writing regarding the postponement of our planned expedition to the coastal national park due to inclement weather conditions.\n\nWhile member safety is understandably the utmost priority, many of us have already arranged time off work. I would respectfully propose rescheduling the excursion to next weekend or shifting the itinerary to a nearby indoor cultural museum tour.\n\nI would be grateful if the committee could evaluate these possibilities.\n\nYours sincerely,\nHoang Hiep",
      },
    ],
  },
];

// Helper chọn benchmark đề theo tiêu đề hoặc ID
export function getBenchmarkWritingParts(titleOrId: string = ''): WritingPart[] {
  const t = titleOrId.toLowerCase();
  if (t.includes('sport') || t.includes('fitness') || t.includes('thể thao') || t.includes('02') || t === '2') {
    return DEFAULT_FITNESS_CLUB_PARTS;
  }
  if (t.includes('book') || t.includes('sách') || t.includes('đọc') || t.includes('03') || t === '3') {
    return DEFAULT_BOOK_CLUB_PARTS;
  }
  if (t.includes('travel') || t.includes('du lịch') || t.includes('04') || t === '4') {
    return DEFAULT_TRAVEL_CLUB_PARTS;
  }
  return DEFAULT_ART_CLUB_PARTS;
}
