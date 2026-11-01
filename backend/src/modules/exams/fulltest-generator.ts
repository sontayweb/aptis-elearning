import { ExamSkill, PrismaClient, QuestionType } from '@prisma/client';

interface SourcePartWithQuestions {
  id: string;
  part_number: number;
  title: string;
  instructions: string | null;
  passage_text: string | null;
  audio_url: string | null;
  image_url: string | null;
  examTitle: string;
  questions: Array<{
    question_number: number;
    question_type: QuestionType;
    prompt: string;
    options: any;
    correct_answer: string | null;
    explanation: string | null;
    max_score: number;
  }>;
}

/**
 * Bộ tạo số giả ngẫu nhiên cố định theo seed (Deterministic PRNG)
 * Giúp mỗi đề từ APT-01 đến APT-20 bốc ngẫu nhiên một tổ hợp các Part khác nhau
 * nhưng cố định và không bị trùng lặp cấu trúc.
 */
function seededIndex(seed: number, step: number, length: number): number {
  if (length <= 1) return 0;
  const x = Math.sin(seed * 9301 + step * 49297 + 233280) * 10000;
  const frac = x - Math.floor(x);
  return Math.floor((frac * length + seed + step) % length);
}

function extractSourceDeTag(examTitle: string): string {
  const m = examTitle.match(/Đề\s*(\d+)/i) || examTitle.match(/Test\s*(\d+)/i) || examTitle.match(/\b(\d{1,2})\b/);
  if (m) {
    return `Đề ${String(m[1]).padStart(2, '0')}`;
  }
  return 'Đề 01';
}

/**
 * Dữ liệu dự phòng chuẩn Aptis ESOL cho 16 Parts (4 kỹ năng x 4 Parts)
 * phòng trường hợp CSDL chỉ mới chạy seed cơ bản mà thiếu một số Part lẻ.
 */
const FALLBACK_PARTS: Record<string, Omit<SourcePartWithQuestions, 'id'>> = {
  L_P1: {
    part_number: 1,
    title: 'Part 1 – Word Recognition',
    instructions: 'Listen to the short recording and choose the correct answer (A, B, or C). You can listen twice.',
    passage_text:
      '1. Man: I just bought a used compact car for 3,250 pounds.\n2. Woman: We are heading to the sunny seaside coast this weekend.\n3. Customer: Could I get a large iced Americano without sugar, please?\n4. Announcer: Passengers for flight BA204 please proceed to Gate 14A.\n5. Librarian: Tomorrow’s seminar starts at 9:45 AM.',
    audio_url: null,
    image_url: null,
    examTitle: 'Đề 01',
    questions: [
      {
        question_number: 1,
        question_type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'A person calls a friend about his new car. How much does the small car cost him?',
        options: ['3250 pounds', '3550 pounds', '4250 pounds'],
        correct_answer: '3250 pounds',
        explanation: 'The speaker states clearly that the small car was purchased for 3,250 pounds.',
        max_score: 2,
      },
      {
        question_number: 2,
        question_type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'Listen to a woman talking about her holiday. Where is she going?',
        options: ['To the mountains', 'To the seaside', 'To an ancient city'],
        correct_answer: 'To the seaside',
        explanation: 'She mentions relaxing on the sunny coast and swimming in the sea.',
        max_score: 2,
      },
      {
        question_number: 3,
        question_type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'A man is ordering a drink at a cafe. What beverage does he order?',
        options: ['Iced Americano', 'Hot green tea', 'Fresh orange juice'],
        correct_answer: 'Iced Americano',
        explanation: 'He asks for a large cup of iced Americano with no sugar.',
        max_score: 2,
      },
      {
        question_number: 4,
        question_type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'Listen to the airport announcement. Which gate should passengers for Flight BA204 go to?',
        options: ['Gate 12B', 'Gate 14A', 'Gate 24C'],
        correct_answer: 'Gate 14A',
        explanation: 'The announcer directs BA204 passengers immediately to Gate 14A.',
        max_score: 2,
      },
      {
        question_number: 5,
        question_type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'What time will the library seminar begin tomorrow?',
        options: ['9:15 AM', '9:45 AM', '10:30 AM'],
        correct_answer: '9:45 AM',
        explanation: 'The librarian confirms the opening address starts at 9:45 AM.',
        max_score: 2,
      },
    ],
  },
  L_P2: {
    part_number: 2,
    title: 'Part 2 – Information Matching (4 Speakers)',
    instructions: 'Four people are discussing their daily habits. Complete the sentences below.',
    passage_text:
      'Speaker A: I always cycle along the riverside path to stay active before work.\nSpeaker B: I prefer listening to business podcasts on the commuter train.\nSpeaker C: Working from home two days a week saves me hours of traffic stress.\nSpeaker D: I go to the gym near my office during lunch breaks.',
    audio_url: null,
    image_url: null,
    examTitle: 'Đề 01',
    questions: [
      {
        question_number: 1,
        question_type: QuestionType.MATCHING,
        prompt: 'Speaker A',
        options: [
          'cycles along the river before work',
          'listens to podcasts on the train',
          'works from home twice a week',
          'exercises at the gym during lunch',
          'drives a car in heavy traffic',
          'walks with colleagues every evening',
        ],
        correct_answer: 'cycles along the river before work',
        explanation: 'Speaker A explicitly mentions cycling along the riverside path before work.',
        max_score: 2,
      },
      {
        question_number: 2,
        question_type: QuestionType.MATCHING,
        prompt: 'Speaker B',
        options: [
          'cycles along the river before work',
          'listens to podcasts on the train',
          'works from home twice a week',
          'exercises at the gym during lunch',
          'drives a car in heavy traffic',
          'walks with colleagues every evening',
        ],
        correct_answer: 'listens to podcasts on the train',
        explanation: 'Speaker B prefers listening to business podcasts on the commuter train.',
        max_score: 2,
      },
      {
        question_number: 3,
        question_type: QuestionType.MATCHING,
        prompt: 'Speaker C',
        options: [
          'cycles along the river before work',
          'listens to podcasts on the train',
          'works from home twice a week',
          'exercises at the gym during lunch',
          'drives a car in heavy traffic',
          'walks with colleagues every evening',
        ],
        correct_answer: 'works from home twice a week',
        explanation: 'Speaker C highlights working from home two days a week.',
        max_score: 2,
      },
      {
        question_number: 4,
        question_type: QuestionType.MATCHING,
        prompt: 'Speaker D',
        options: [
          'cycles along the river before work',
          'listens to podcasts on the train',
          'works from home twice a week',
          'exercises at the gym during lunch',
          'drives a car in heavy traffic',
          'walks with colleagues every evening',
        ],
        correct_answer: 'exercises at the gym during lunch',
        explanation: 'Speaker D goes to the gym near the office during lunch breaks.',
        max_score: 2,
      },
    ],
  },
  L_P3: {
    part_number: 3,
    title: 'Part 3 – Opinion Matching (Discussion)',
    instructions: 'Listen to two colleagues discussing remote work policies. Read the opinions below and decide whose opinion matches the statements: Man, Woman, or Both.',
    passage_text:
      'Woman: Flexible remote working has genuinely improved employee morale and work-life balance.\nMan: I see your point, though junior trainees still learn faster when sitting next to senior mentors in the office.\nWoman: True, and I completely agree with you that holding weekly in-person team meetings is essential for project synergy.',
    audio_url: null,
    image_url: null,
    examTitle: 'Đề 01',
    questions: [
      {
        question_number: 1,
        question_type: QuestionType.MATCHING,
        prompt: 'Remote working significantly improves employee work-life balance.',
        options: ['Man', 'Woman', 'Both'],
        correct_answer: 'Woman',
        explanation: 'The woman states that flexible remote work improves morale and work-life balance.',
        max_score: 2,
      },
      {
        question_number: 2,
        question_type: QuestionType.MATCHING,
        prompt: 'Junior staff learn more effectively when mentored in the office.',
        options: ['Man', 'Woman', 'Both'],
        correct_answer: 'Man',
        explanation: 'The man points out that junior trainees learn faster near senior mentors.',
        max_score: 2,
      },
      {
        question_number: 3,
        question_type: QuestionType.MATCHING,
        prompt: 'Weekly in-office team meetings are necessary for collaboration.',
        options: ['Man', 'Woman', 'Both'],
        correct_answer: 'Both',
        explanation: 'Both speakers agree that weekly in-person meetings are essential for synergy.',
        max_score: 2,
      },
      {
        question_number: 4,
        question_type: QuestionType.MATCHING,
        prompt: 'Digital tools can help track project milestones transparently.',
        options: ['Man', 'Woman', 'Both'],
        correct_answer: 'Woman',
        explanation: 'The woman supports digital workflow flexibility.',
        max_score: 2,
      },
    ],
  },
  L_P4: {
    part_number: 4,
    title: 'Part 4 – Monologue Comprehension',
    instructions: 'Listen to the extended talk and answer the multiple-choice questions.',
    passage_text:
      'Welcome to the City Architecture Forum. Today we are reviewing our urban green-roof initiative. Over the past two years, converting concrete rooftops into community gardens has reduced summer cooling costs in participating buildings by nearly 25 percent while creating welcoming spaces for residents.',
    audio_url: null,
    image_url: null,
    examTitle: 'Đề 01',
    questions: [
      {
        question_number: 1,
        question_type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'What is the main benefit of the urban green-roof initiative mentioned by the speaker?',
        options: [
          'It increases property tax revenue',
          'It reduces summer cooling costs and creates community space',
          'It replaces all public parks in the city center',
        ],
        correct_answer: 'It reduces summer cooling costs and creates community space',
        explanation: 'The speaker notes a 25% reduction in cooling costs and welcoming spaces for residents.',
        max_score: 2,
      },
      {
        question_number: 2,
        question_type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'What is the speaker’s attitude toward expanding the green-roof program?',
        options: [
          'Optimistic about its environmental and social impact',
          'Doubtful due to structural engineering risks',
          'Indifferent to resident feedback',
        ],
        correct_answer: 'Optimistic about its environmental and social impact',
        explanation: 'The speaker highlights measurable energy savings and positive community outcomes.',
        max_score: 2,
      },
    ],
  },
  R_P1: {
    part_number: 5,
    title: 'Part 1 – Sentence comprehension',
    instructions: 'Choose the word that fits in the gap.',
    passage_text: 'I live in a flat. I share it with my friend. We are in the same class. We walk to work. We like to cook dinner.',
    audio_url: null,
    image_url: null,
    examTitle: 'Đề 01',
    questions: [
      {
        question_number: 1,
        question_type: QuestionType.GAP_FILL,
        prompt: 'I [gap] it with my friend.',
        options: ['share', 'keep', 'send'],
        correct_answer: 'share',
        explanation: '"Share a flat with someone" = ở ghép căn hộ cùng ai đó.',
        max_score: 2,
      },
      {
        question_number: 2,
        question_type: QuestionType.GAP_FILL,
        prompt: 'We are in the same [gap].',
        options: ['class', 'room', 'floor'],
        correct_answer: 'class',
        explanation: '"In the same class" = học cùng lớp.',
        max_score: 2,
      },
      {
        question_number: 3,
        question_type: QuestionType.GAP_FILL,
        prompt: 'We [gap] to work every morning.',
        options: ['walk', 'smile', 'watch'],
        correct_answer: 'walk',
        explanation: '"Walk to work" = đi bộ đi làm.',
        max_score: 2,
      },
      {
        question_number: 4,
        question_type: QuestionType.GAP_FILL,
        prompt: 'We like to [gap] dinner together.',
        options: ['cook', 'do', 'build'],
        correct_answer: 'cook',
        explanation: '"Cook dinner" = nấu bữa tối.',
        max_score: 2,
      },
    ],
  },
  R_P2: {
    part_number: 6,
    title: 'Part 2 – Text cohesion',
    instructions: 'The sentences below make a complete text. Put them in the correct order.',
    passage_text: 'Delivery instructions',
    audio_url: null,
    image_url: null,
    examTitle: 'Đề 01',
    questions: [
      {
        question_number: 1,
        question_type: QuestionType.SENTENCE_ORDER,
        prompt: 'Order the sentences to form a coherent text about delivery instructions.',
        options: {
          title: 'Delivery instructions',
          fixedSentence: 'You should arrive at the main office by 6.30am and collect your keys.',
          sentences: [
            { id: 's2', text: 'In the office, you can also collect a map of your route.' },
            { id: 's3', text: 'You must follow the route on the map to deliver packages.' },
            { id: 's4', text: 'When you have completed all deliveries, return to your office.' },
            { id: 's5', text: 'You must return your keys to the office manager after you get back.' },
          ],
        },
        correct_answer: JSON.stringify(['s2', 's3', 's4', 's5']),
        explanation: 'Trình tự hợp lý: Nhận chìa khóa -> lấy bản đồ -> đi giao hàng theo bản đồ -> quay về văn phòng -> trả lại chìa khóa.',
        max_score: 5,
      },
    ],
  },
  R_P3: {
    part_number: 7,
    title: 'Part 3 – Opinion matching',
    instructions: 'Four people write reviews of a new restaurant in their town. Read the texts and answer the questions below.',
    passage_text:
      "A\nI'm not sure if I will return to this restaurant. I think the staff was arguing when I got there, because the atmosphere here was not very comfortable. As for the food, I ordered fish and chips; it wasn't bad, but it wasn't good either. Many people say the food here is fabulous, so I think I'm an exception.\n\nB\nThis is a very famous restaurant that I saw in the newspaper. Sadly, I arrived later than the rest of the party, so I didn't get to order dinner. However, I ordered orange juice and mango juice and they were both delicious. Lively music along with fashionable decor makes me feel very comfortable.\n\nC\nI don't understand why this restaurant is so famous. When I arrived and saw a menu with lots of different dishes, I saw this as a bad sign. The waiters here were also not friendly. This was one of my worst experiences eating at a restaurant.\n\nD\nThis is my first time coming to this restaurant. The food is very cheap but the quality is excellent. I was very surprised with the starter because its menu is very diverse. However, the restaurant band played live music too quietly.",
    audio_url: null,
    image_url: null,
    examTitle: 'Đề 01',
    questions: [
      {
        question_number: 1,
        question_type: QuestionType.MATCHING,
        prompt: 'Who enjoyed the atmosphere?',
        options: ['Person A', 'Person B', 'Person C', 'Person D'],
        correct_answer: 'Person B',
        explanation: 'Person B states: "Lively music along with fashionable decor makes me feel very comfortable."',
        max_score: 2,
      },
      {
        question_number: 2,
        question_type: QuestionType.MATCHING,
        prompt: 'Who thought the music was too quiet?',
        options: ['Person A', 'Person B', 'Person C', 'Person D'],
        correct_answer: 'Person D',
        explanation: 'Person D notes the live band sound was very low.',
        max_score: 2,
      },
      {
        question_number: 3,
        question_type: QuestionType.MATCHING,
        prompt: "Who didn't eat anything at the restaurant?",
        options: ['Person A', 'Person B', 'Person C', 'Person D'],
        correct_answer: 'Person B',
        explanation: 'Person B arrived late and only ordered orange and mango juice.',
        max_score: 2,
      },
      {
        question_number: 4,
        question_type: QuestionType.MATCHING,
        prompt: 'Who will definitely not return to the restaurant?',
        options: ['Person A', 'Person B', 'Person C', 'Person D'],
        correct_answer: 'Person C',
        explanation: 'Person C describes it as one of their worst restaurant experiences.',
        max_score: 2,
      },
    ],
  },
  R_P4: {
    part_number: 8,
    title: 'Part 4 – Long reading',
    instructions: 'Read the passage quickly. Choose a heading for each numbered paragraph from the drop-down box.',
    passage_text: 'Children and Physical Exercise',
    audio_url: null,
    image_url: null,
    examTitle: 'Đề 01',
    questions: [
      {
        question_number: 1,
        question_type: QuestionType.MATCHING,
        prompt:
          'Paragraph 1: While smartphones and video games are frequently blamed for declining fitness among youth, urban congestion and reduced outdoor play spaces also play a major role.',
        options: [
          'Technology is not the only cause of inactivity',
          'Schools leading the fitness transformation',
          'Parental encouragement makes a vital difference',
          'Small daily habits for lifelong wellbeing',
        ],
        correct_answer: 'Technology is not the only cause of inactivity',
        explanation: 'Đoạn 1 nhấn mạnh công nghệ không phải nguyên nhân duy nhất gây lười vận động.',
        max_score: 2,
      },
      {
        question_number: 2,
        question_type: QuestionType.MATCHING,
        prompt:
          'Paragraph 2: Educational institutions are redesigning curricula to include daily movement breaks, active sports clubs, and outdoor learning modules.',
        options: [
          'Technology is not the only cause of inactivity',
          'Schools leading the fitness transformation',
          'Parental encouragement makes a vital difference',
          'Small daily habits for lifelong wellbeing',
        ],
        correct_answer: 'Schools leading the fitness transformation',
        explanation: 'Đoạn 2 nói về vai trò tiên phong của trường học trong việc đổi mới thể chất.',
        max_score: 2,
      },
      {
        question_number: 3,
        question_type: QuestionType.MATCHING,
        prompt:
          'Paragraph 3: When parents actively participate in weekend cycling or evening walks with their children, youngsters are twice as likely to sustain active lifestyles.',
        options: [
          'Technology is not the only cause of inactivity',
          'Schools leading the fitness transformation',
          'Parental encouragement makes a vital difference',
          'Small daily habits for lifelong wellbeing',
        ],
        correct_answer: 'Parental encouragement makes a vital difference',
        explanation: 'Đoạn 3 nêu bật sự đồng hành và khích lệ của phụ huynh.',
        max_score: 2,
      },
    ],
  },
  W_P1: {
    part_number: 9,
    title: 'Part 1 – Short Answers (1-5 words)',
    instructions: 'You joined a Club. Fill in the required registration fields (1-5 words each).',
    passage_text: 'Club Registration - 5 short questions',
    audio_url: null,
    image_url: null,
    examTitle: 'Đề 01',
    questions: [
      { question_number: 1, question_type: QuestionType.ESSAY, prompt: '1. What do you like doing in your free time?', options: null, correct_answer: null, explanation: 'Reading books and jogging.', max_score: 2 },
      { question_number: 2, question_type: QuestionType.ESSAY, prompt: '2. How often do you exercise each week?', options: null, correct_answer: null, explanation: 'Three times a week.', max_score: 2 },
      { question_number: 3, question_type: QuestionType.ESSAY, prompt: '3. What is your favorite season of the year?', options: null, correct_answer: null, explanation: 'Autumn with cool weather.', max_score: 2 },
      { question_number: 4, question_type: QuestionType.ESSAY, prompt: '4. How do you usually travel to work or school?', options: null, correct_answer: null, explanation: 'By bus and metro.', max_score: 2 },
      { question_number: 5, question_type: QuestionType.ESSAY, prompt: '5. What kind of music do you enjoy?', options: null, correct_answer: null, explanation: 'Acoustic pop and classical.', max_score: 2 },
    ],
  },
  W_P2: {
    part_number: 10,
    title: 'Part 2 – Social Media Response (20-30 words)',
    instructions: 'Please tell us why you are interested in joining our club and what personal goals you wish to achieve (20 - 30 words).',
    passage_text: 'Club Member Profile Form',
    audio_url: null,
    image_url: null,
    examTitle: 'Đề 01',
    questions: [
      {
        question_number: 1,
        question_type: QuestionType.ESSAY,
        prompt: 'Write in full sentences (20 - 30 words) about why you joined the club.',
        options: null,
        correct_answer: null,
        explanation: 'I joined the club to connect with like-minded people, learn practical skills from experienced members, and participate in weekend community events.',
        max_score: 10,
      },
    ],
  },
  W_P3: {
    part_number: 11,
    title: 'Part 3 – Three Questions Chat Room (30-40 words)',
    instructions: 'You are talking to 3 members in the club chat room. Reply in complete sentences (30-40 words per answer).',
    passage_text: 'Club Chat Room Discussion',
    audio_url: null,
    image_url: null,
    examTitle: 'Đề 01',
    questions: [
      {
        question_number: 1,
        question_type: QuestionType.ESSAY,
        prompt: '1. Sam: Hi! I just joined the club today. How did you first hear about our club?',
        options: null,
        correct_answer: null,
        explanation: 'I discovered this club through a university friend who praised its welcoming atmosphere and well-organized workshops. After attending a trial session last month, I immediately decided to sign up.',
        max_score: 5,
      },
      {
        question_number: 2,
        question_type: QuestionType.ESSAY,
        prompt: '2. Lucy: The committee wants to organize a weekend workshop. What topic or activity do you think would attract the most members?',
        options: null,
        correct_answer: null,
        explanation: 'I believe a hands-on beginner workshop led by an industry guest speaker would attract the largest crowd because members are eager to gain practical skills they can apply immediately.',
        max_score: 5,
      },
      {
        question_number: 3,
        question_type: QuestionType.ESSAY,
        prompt: '3. Mark: Some members prefer online meetings while others prefer face-to-face gatherings. Which format do you prefer and why?',
        options: null,
        correct_answer: null,
        explanation: 'While online sessions are convenient on busy weeknights, I strongly prefer face-to-face gatherings on weekends because direct interaction builds stronger friendships and sparks more natural discussions.',
        max_score: 5,
      },
    ],
  },
  W_P4: {
    part_number: 12,
    title: 'Part 4 – Formal & Informal Email',
    instructions: 'You received an email from the club secretary stating that next month’s annual club excursion has been cancelled due to budget constraints.',
    passage_text: 'Notice from Club Secretary: Due to unexpected budget constraints, next month’s annual club excursion has been cancelled.',
    audio_url: null,
    image_url: null,
    examTitle: 'Đề 01',
    questions: [
      {
        question_number: 1,
        question_type: QuestionType.ESSAY,
        prompt: 'Write an email to a friend who is also a club member. Express your feelings about the cancellation and suggest what members could do together instead. Write about 50 words.',
        options: null,
        correct_answer: null,
        explanation: 'Hi Alex,\n\nDid you see the email about our annual club trip being cancelled? I am really disappointed since we had been looking forward to it for months. Maybe a few of us could organize a small self-funded day trip this Saturday instead. Let me know what you think!\n\nBest,\nHiep',
        max_score: 10,
      },
      {
        question_number: 2,
        question_type: QuestionType.ESSAY,
        prompt: 'Write an email to the club secretary. Explain how members feel about the sudden cancellation and propose practical low-cost alternatives so the event can still take place. Write 120-150 words.',
        options: null,
        correct_answer: null,
        explanation: 'Dear Club Secretary,\n\nI am writing to express my disappointment regarding the recent announcement that our annual club excursion next month has been cancelled due to budget constraints. As this trip is the highlight of our calendar, many members are understandably disheartened.\n\nWhile I appreciate the financial challenges facing the committee, I would like to propose two practical alternatives. Firstly, members would be happy to pay a modest co-payment contribution to cover transportation costs. Secondly, we could choose a closer destination within the city outskirts to eliminate hotel expenses while still enjoying a full day of team activities.\n\nI hope the committee will reconsider the cancellation and review these cost-effective options. Thank you for your time and dedication.\n\nYours sincerely,\nClub Member',
        max_score: 15,
      },
    ],
  },
  S_P1: {
    part_number: 13,
    title: 'Part 1 – Personal Information',
    instructions: 'Answer 3 personal questions (30 seconds per answer).',
    passage_text: null,
    audio_url: null,
    image_url: null,
    examTitle: 'Đề 01',
    questions: [
      {
        question_number: 1,
        question_type: QuestionType.SPEAKING_AUDIO,
        prompt: 'Please tell me about yourself and where you live.',
        options: [],
        correct_answer: null,
        explanation: 'Introduce your name, occupation/studies, and describe your hometown vividly.',
        max_score: 4,
      },
      {
        question_number: 2,
        question_type: QuestionType.SPEAKING_AUDIO,
        prompt: 'What do you like doing in your free time?',
        options: [],
        correct_answer: null,
        explanation: 'Share 2 hobbies, why you enjoy them, and how they help you relax.',
        max_score: 4,
      },
      {
        question_number: 3,
        question_type: QuestionType.SPEAKING_AUDIO,
        prompt: 'Tell me about your favorite place to visit on weekends.',
        options: [],
        correct_answer: null,
        explanation: 'Describe a local park, cafe, or cultural spot and who you go with.',
        max_score: 4,
      },
    ],
  },
  S_P2: {
    part_number: 14,
    title: 'Part 2 – Describe Picture & Express Opinion',
    instructions: 'Describe the picture and answer two related questions (45 seconds each).',
    passage_text: null,
    audio_url: null,
    image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    examTitle: 'Đề 01',
    questions: [
      {
        question_number: 1,
        question_type: QuestionType.SPEAKING_AUDIO,
        prompt: 'Describe this picture.',
        options: [],
        correct_answer: null,
        explanation: 'Describe the setting, people, actions, and atmosphere in detail.',
        max_score: 4,
      },
      {
        question_number: 2,
        question_type: QuestionType.SPEAKING_AUDIO,
        prompt: 'Tell me about a time you worked or studied in a group.',
        options: [],
        correct_answer: null,
        explanation: 'Share a specific project, how you collaborated, and the outcome.',
        max_score: 4,
      },
      {
        question_number: 3,
        question_type: QuestionType.SPEAKING_AUDIO,
        prompt: 'Do you think people work better in teams or alone? Why?',
        options: [],
        correct_answer: null,
        explanation: 'Compare team synergy with individual focus and give a balanced conclusion.',
        max_score: 4,
      },
    ],
  },
  S_P3: {
    part_number: 15,
    title: 'Part 3 – Compare Two Pictures',
    instructions: 'Compare the two pictures and answer two follow-up questions (45 seconds each).',
    passage_text: null,
    audio_url: null,
    image_url: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80, https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    examTitle: 'Đề 01',
    questions: [
      {
        question_number: 1,
        question_type: QuestionType.SPEAKING_AUDIO,
        prompt: 'Tell me what you see in the two pictures.',
        options: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'],
        correct_answer: null,
        explanation: 'Contrast outdoor exercise in nature with training in an indoor modern gym.',
        max_score: 4,
      },
      {
        question_number: 2,
        question_type: QuestionType.SPEAKING_AUDIO,
        prompt: 'Which of these two environments would you prefer for exercising, and why?',
        options: [],
        correct_answer: null,
        explanation: 'State your personal preference and justify with 2 clear reasons.',
        max_score: 4,
      },
      {
        question_number: 3,
        question_type: QuestionType.SPEAKING_AUDIO,
        prompt: 'Why do many city residents find it difficult to exercise regularly?',
        options: [],
        correct_answer: null,
        explanation: 'Discuss busy schedules, screen time, and limited green spaces.',
        max_score: 4,
      },
    ],
  },
  S_P4: {
    part_number: 16,
    title: 'Part 4 – Long Turn Abstract Discussion',
    instructions: 'You have 1 minute to prepare notes, then speak for 2 minutes to answer all three questions.',
    passage_text: null,
    audio_url: null,
    image_url: null,
    examTitle: 'Đề 01',
    questions: [
      {
        question_number: 1,
        question_type: QuestionType.SPEAKING_AUDIO,
        prompt: 'You will have 60 seconds to prepare notes, then speak continuously for 2 minutes to answer all 3 questions below.',
        options: [
          '1. Tell me about a memorable journey or achievement you are proud of.',
          '2. How did you feel during that experience and what challenges did you face?',
          '3. Why are challenging experiences important for personal growth?',
        ],
        correct_answer: null,
        explanation: 'Structure your 2-minute talk clearly covering all 3 prompts with linking phrases.',
        max_score: 14,
      },
    ],
  },
};

/**
 * Tự động tạo đủ 20 Bộ đề Thi thử Hoàn chỉnh (APT-01 đến APT-20)
 * bằng cách nhặt ngẫu nhiên (deterministic) các Part từ ngân hàng câu hỏi 4 kỹ năng:
 * Listening (Part 1-4) + Reading (Part 1-4) + Writing (Part 1-4) + Speaking (Part 1-4).
 * - Đề 01 (APT-01): Miễn phí (is_pro = false)
 * - Đề 02 đến Đề 20 (APT-02 .. APT-20): Khóa VIP PRO (is_pro = true)
 */
export async function ensureTwentyFullTestExams(
  prisma: PrismaClient,
  options?: { forceAll?: boolean }
): Promise<void> {
  // Kiểm tra nhanh xem đã có bộ đề [APT-01] .. [APT-20] trong hệ thống chưa
  const existingGenerated = await prisma.exam.findMany({
    where: {
      skill: ExamSkill.FULL_TEST,
      source: 'WEB',
      title: { startsWith: '[APT-' },
    },
    select: {
      id: true,
      title: true,
      is_pro: true,
      _count: { select: { parts: true } },
    },
  });

  // Nếu không phải chế độ forceAll của Admin và hệ thống đã có đề [APT-XX] hoàn chỉnh (>= 16 parts),
  // giữ nguyên trạng thái hiện tại để tôn trọng các thao tác Xóa / Ẩn / Đổi gói PRO của Admin.
  if (
    !options?.forceAll &&
    existingGenerated.length > 0 &&
    existingGenerated.every((e) => e._count.parts >= 16)
  ) {
    return;
  }

  // 1. Dọn các đề FULL_TEST mẫu cũ bị rỗng hoặc thiếu part (< 16 parts)
  const oldIncompleteFullTests = await prisma.exam.findMany({
    where: {
      skill: ExamSkill.FULL_TEST,
      source: 'WEB',
    },
    select: {
      id: true,
      title: true,
      _count: { select: { parts: true, submissions: true } },
    },
  });

  for (const oldExam of oldIncompleteFullTests) {
    if (oldExam._count.parts < 16 && oldExam._count.submissions === 0) {
      await prisma.exam.delete({ where: { id: oldExam.id } }).catch(() => {});
    } else if (oldExam._count.parts < 16 && !oldExam.title.startsWith('[APT-')) {
      // Ẩn đề mẫu cũ chỉ có 1 câu để không làm nhiễu danh sách 20 đề chuẩn
      await prisma.exam
        .update({ where: { id: oldExam.id }, data: { is_published: false } })
        .catch(() => {});
    }
  }

  // 2. Nạp toàn bộ ngân hàng Part của 4 kỹ năng có sẵn trong DB
  const skillExams = await prisma.exam.findMany({
    where: {
      skill: {
        in: [
          ExamSkill.LISTENING,
          ExamSkill.READING,
          ExamSkill.WRITING,
          ExamSkill.SPEAKING,
        ],
      },
      is_published: true,
    },
    include: {
      parts: {
        orderBy: { part_number: 'asc' },
        include: {
          questions: {
            orderBy: { question_number: 'asc' },
          },
        },
      },
    },
  });

  const pools: Record<string, SourcePartWithQuestions[]> = {
    L_P1: [],
    L_P2: [],
    L_P3: [],
    L_P4: [],
    R_P1: [],
    R_P2: [],
    R_P3: [],
    R_P4: [],
    W_P1: [],
    W_P2: [],
    W_P3: [],
    W_P4: [],
    S_P1: [],
    S_P2: [],
    S_P3: [],
    S_P4: [],
  };

  for (const ex of skillExams) {
    for (const p of ex.parts) {
      if (!p.questions || p.questions.length === 0) continue;
      const t = (p.title || '').toLowerCase();
      const item: SourcePartWithQuestions = {
        id: p.id,
        part_number: p.part_number,
        title: p.title,
        instructions: p.instructions,
        passage_text: p.passage_text,
        audio_url: p.audio_url,
        image_url: p.image_url,
        examTitle: ex.title,
        questions: p.questions.map((q) => ({
          question_number: q.question_number,
          question_type: q.question_type,
          prompt: q.prompt,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          max_score: q.max_score,
        })),
      };

      if (ex.skill === ExamSkill.LISTENING) {
        if (p.part_number === 1 || t.includes('part 1') || t.includes('recognition')) pools.L_P1.push(item);
        else if (p.part_number === 2 || t.includes('part 2') || t.includes('matching')) pools.L_P2.push(item);
        else if (p.part_number === 3 || t.includes('part 3') || t.includes('opinion') || t.includes('discussion')) pools.L_P3.push(item);
        else if (p.part_number === 4 || t.includes('part 4') || t.includes('monologue')) pools.L_P4.push(item);
      } else if (ex.skill === ExamSkill.READING) {
        if (t.includes('long') || t.includes('heading') || t.includes('part 5') || p.part_number === 5 || (p.part_number === 4 && !t.includes('opinion'))) {
          pools.R_P4.push(item);
        } else if (t.includes('opinion') || t.includes('part 3') || (p.part_number === 3 && ex.parts.length === 4) || (p.part_number === 4 && t.includes('opinion'))) {
          pools.R_P3.push(item);
        } else if (t.includes('cohesion') || t.includes('order') || t.includes('part 2') || p.part_number === 2) {
          pools.R_P2.push(item);
        } else {
          pools.R_P1.push(item);
        }
      } else if (ex.skill === ExamSkill.WRITING) {
        if (p.part_number === 1 || t.includes('part 1')) pools.W_P1.push(item);
        else if (p.part_number === 2 || t.includes('part 2')) pools.W_P2.push(item);
        else if (p.part_number === 3 || t.includes('part 3')) pools.W_P3.push(item);
        else if (p.part_number === 4 || t.includes('part 4')) pools.W_P4.push(item);
      } else if (ex.skill === ExamSkill.SPEAKING) {
        if (p.part_number === 1 || t.includes('part 1')) pools.S_P1.push(item);
        else if (p.part_number === 2 || t.includes('part 2')) pools.S_P2.push(item);
        else if (p.part_number === 3 || t.includes('part 3')) pools.S_P3.push(item);
        else if (p.part_number === 4 || t.includes('part 4')) pools.S_P4.push(item);
      }
    }
  }

  const pickFromPool = (poolKey: string, examIndex: number, step: number): Omit<SourcePartWithQuestions, 'id'> => {
    const list = pools[poolKey] || [];
    if (list.length > 0) {
      const idx = seededIndex(examIndex, step, list.length);
      return list[idx];
    }
    return FALLBACK_PARTS[poolKey];
  };

  // 3. Khởi tạo 20 bộ đề cố định: APT-01 (Miễn phí) -> APT-20 (VIP PRO)
  for (let i = 1; i <= 20; i++) {
    const numStr = String(i).padStart(2, '0');
    const code = `APT-${numStr}`;
    const title = `[${code}] Đề thi thử Aptis ESOL Full Test #${numStr}`;
    const isFreeDemo = i === 1; // Đề 01 mở miễn phí làm mẫu, Đề 02..20 khóa PRO

    const existing = await prisma.exam.findFirst({
      where: {
        skill: ExamSkill.FULL_TEST,
        title: { startsWith: `[${code}]` },
      },
      include: { _count: { select: { parts: true } } },
    });

    if (existing && existing._count.parts >= 16) {
      continue;
    }

    if (existing && existing._count.parts < 16) {
      await prisma.exam.delete({ where: { id: existing.id } }).catch(() => {});
    }

    const l1 = pickFromPool('L_P1', i, 1);
    const l2 = pickFromPool('L_P2', i, 2);
    const l3 = pickFromPool('L_P3', i, 3);
    const l4 = pickFromPool('L_P4', i, 4);

    const r1 = pickFromPool('R_P1', i, 5);
    const r2 = pickFromPool('R_P2', i, 6);
    const r3 = pickFromPool('R_P3', i, 7);
    const r4 = pickFromPool('R_P4', i, 8);

    const w1 = pickFromPool('W_P1', i, 9);
    const w2 = pickFromPool('W_P2', i, 10);
    const w3 = pickFromPool('W_P3', i, 11);
    const w4 = pickFromPool('W_P4', i, 12);

    const s1 = pickFromPool('S_P1', i, 13);
    const s2 = pickFromPool('S_P2', i, 14);
    const s3 = pickFromPool('S_P3', i, 15);
    const s4 = pickFromPool('S_P4', i, 16);

    const assembledParts = [
      { num: 1, title: `LISTENING - Part 1 – Word Recognition (${extractSourceDeTag(l1.examTitle)})`, src: l1 },
      { num: 2, title: `LISTENING - Part 2 – Information Matching (${extractSourceDeTag(l2.examTitle)})`, src: l2 },
      { num: 3, title: `LISTENING - Part 3 – Opinion Matching (${extractSourceDeTag(l3.examTitle)})`, src: l3 },
      { num: 4, title: `LISTENING - Part 4 – Monologue Comprehension (${extractSourceDeTag(l4.examTitle)})`, src: l4 },

      { num: 5, title: `READING - Part 1 – Sentence comprehension (${extractSourceDeTag(r1.examTitle)})`, src: r1 },
      { num: 6, title: `READING - Part 2 – Text cohesion (${extractSourceDeTag(r2.examTitle)})`, src: r2 },
      { num: 7, title: `READING - Part 3 – Opinion matching (${extractSourceDeTag(r3.examTitle)})`, src: r3 },
      { num: 8, title: `READING - Part 4 – Long reading (${extractSourceDeTag(r4.examTitle)})`, src: r4 },

      { num: 9, title: `WRITING - Part 1 – Short Answers (${extractSourceDeTag(w1.examTitle)})`, src: w1 },
      { num: 10, title: `WRITING - Part 2 – Social Media Response (${extractSourceDeTag(w2.examTitle)})`, src: w2 },
      { num: 11, title: `WRITING - Part 3 – Three Questions (${extractSourceDeTag(w3.examTitle)})`, src: w3 },
      { num: 12, title: `WRITING - Part 4 – Formal & Informal Email (${extractSourceDeTag(w4.examTitle)})`, src: w4 },

      { num: 13, title: `SPEAKING - Part 1 – Personal Information (${extractSourceDeTag(s1.examTitle)})`, src: s1 },
      { num: 14, title: `SPEAKING - Part 2 – Describe Picture (${extractSourceDeTag(s2.examTitle)})`, src: s2 },
      { num: 15, title: `SPEAKING - Part 3 – Compare Two Pictures (${extractSourceDeTag(s3.examTitle)})`, src: s3 },
      { num: 16, title: `SPEAKING - Part 4 – Abstract Discussion (${extractSourceDeTag(s4.examTitle)})`, src: s4 },
    ];

    const hotLevel = i === 1 ? 4 : i <= 6 ? 3 : i <= 12 ? 2 : 1;
    const forecastTag = isFreeDemo
      ? 'Đề mẫu Miễn Phí'
      : i <= 6
      ? 'Đề tủ sát thi thật'
      : 'Bộ đề chuẩn 4 Kỹ năng';

    await prisma.exam.create({
      data: {
        title,
        description: isFreeDemo
          ? `Bộ đề thi thử Aptis ESOL hoàn chỉnh 4 kỹ năng (Listening, Reading, Writing, Speaking - 16 Parts) mở miễn phí để học viên làm quen format và căn chỉnh tốc độ làm bài.`
          : `Bộ đề thi thử Aptis ESOL hoàn chỉnh số ${numStr} (Mã đề: ${code}) được tổng hợp ngẫu nhiên đủ 4 kỹ năng (Listening, Reading, Writing, Speaking) từ ngân hàng đề thi. Dành riêng cho học viên gói VIP PRO.`,
        skill: ExamSkill.FULL_TEST,
        duration_minutes: 150,
        is_pro: !isFreeDemo,
        is_published: true,
        hot_level: hotLevel,
        forecast_tag: forecastTag,
        source: 'WEB',
        parts: {
          create: assembledParts.map((ap) => ({
            part_number: ap.num,
            title: ap.title,
            instructions: ap.src.instructions,
            passage_text: ap.src.passage_text,
            audio_url: ap.src.audio_url,
            image_url: ap.src.image_url,
            questions: {
              create: ap.src.questions.map((q, qIdx) => ({
                question_number: q.question_number || qIdx + 1,
                question_type: q.question_type,
                prompt: q.prompt,
                options: q.options ?? undefined,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                max_score: q.max_score || 1.0,
              })),
            },
          })),
        },
      },
    });
  }
}

/**
 * Cho phép Quản trị viên (Admin) trộn lại ngẫu nhiên (Re-randomize) bộ 16 Parts
 * của 1 đề thi thử FULL_TEST bất kỳ từ ngân hàng câu hỏi hiện có.
 */
export async function rerandomizeSingleFullTestExam(
  prisma: PrismaClient,
  examId: string
) {
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) {
    throw { statusCode: 404, message: 'Đề thi không tồn tại' };
  }

  const skillExams = await prisma.exam.findMany({
    where: {
      skill: {
        in: [
          ExamSkill.LISTENING,
          ExamSkill.READING,
          ExamSkill.WRITING,
          ExamSkill.SPEAKING,
        ],
      },
      is_published: true,
    },
    include: {
      parts: {
        orderBy: { part_number: 'asc' },
        include: {
          questions: {
            orderBy: { question_number: 'asc' },
          },
        },
      },
    },
  });

  const pools: Record<string, SourcePartWithQuestions[]> = {
    L_P1: [], L_P2: [], L_P3: [], L_P4: [],
    R_P1: [], R_P2: [], R_P3: [], R_P4: [],
    W_P1: [], W_P2: [], W_P3: [], W_P4: [],
    S_P1: [], S_P2: [], S_P3: [], S_P4: [],
  };

  for (const ex of skillExams) {
    for (const p of ex.parts) {
      if (!p.questions || p.questions.length === 0) continue;
      const t = (p.title || '').toLowerCase();
      const item: SourcePartWithQuestions = {
        id: p.id,
        part_number: p.part_number,
        title: p.title,
        instructions: p.instructions,
        passage_text: p.passage_text,
        audio_url: p.audio_url,
        image_url: p.image_url,
        examTitle: ex.title,
        questions: p.questions.map((q) => ({
          question_number: q.question_number,
          question_type: q.question_type,
          prompt: q.prompt,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          max_score: q.max_score,
        })),
      };

      if (ex.skill === ExamSkill.LISTENING) {
        if (p.part_number === 1 || t.includes('part 1') || t.includes('recognition')) pools.L_P1.push(item);
        else if (p.part_number === 2 || t.includes('part 2') || t.includes('matching')) pools.L_P2.push(item);
        else if (p.part_number === 3 || t.includes('part 3') || t.includes('opinion') || t.includes('discussion')) pools.L_P3.push(item);
        else if (p.part_number === 4 || t.includes('part 4') || t.includes('monologue')) pools.L_P4.push(item);
      } else if (ex.skill === ExamSkill.READING) {
        if (t.includes('long') || t.includes('heading') || t.includes('part 5') || p.part_number === 5 || (p.part_number === 4 && !t.includes('opinion'))) {
          pools.R_P4.push(item);
        } else if (t.includes('opinion') || t.includes('part 3') || (p.part_number === 3 && ex.parts.length === 4) || (p.part_number === 4 && t.includes('opinion'))) {
          pools.R_P3.push(item);
        } else if (t.includes('cohesion') || t.includes('order') || t.includes('part 2') || p.part_number === 2) {
          pools.R_P2.push(item);
        } else {
          pools.R_P1.push(item);
        }
      } else if (ex.skill === ExamSkill.WRITING) {
        if (p.part_number === 1 || t.includes('part 1')) pools.W_P1.push(item);
        else if (p.part_number === 2 || t.includes('part 2')) pools.W_P2.push(item);
        else if (p.part_number === 3 || t.includes('part 3')) pools.W_P3.push(item);
        else if (p.part_number === 4 || t.includes('part 4')) pools.W_P4.push(item);
      } else if (ex.skill === ExamSkill.SPEAKING) {
        if (p.part_number === 1 || t.includes('part 1')) pools.S_P1.push(item);
        else if (p.part_number === 2 || t.includes('part 2')) pools.S_P2.push(item);
        else if (p.part_number === 3 || t.includes('part 3')) pools.S_P3.push(item);
        else if (p.part_number === 4 || t.includes('part 4')) pools.S_P4.push(item);
      }
    }
  }

  const pickRandomFromPool = (poolKey: string): Omit<SourcePartWithQuestions, 'id'> => {
    const list = pools[poolKey] || [];
    if (list.length > 0) {
      const idx = Math.floor(Math.random() * list.length);
      return list[idx];
    }
    return FALLBACK_PARTS[poolKey];
  };

  const l1 = pickRandomFromPool('L_P1');
  const l2 = pickRandomFromPool('L_P2');
  const l3 = pickRandomFromPool('L_P3');
  const l4 = pickRandomFromPool('L_P4');

  const r1 = pickRandomFromPool('R_P1');
  const r2 = pickRandomFromPool('R_P2');
  const r3 = pickRandomFromPool('R_P3');
  const r4 = pickRandomFromPool('R_P4');

  const w1 = pickRandomFromPool('W_P1');
  const w2 = pickRandomFromPool('W_P2');
  const w3 = pickRandomFromPool('W_P3');
  const w4 = pickRandomFromPool('W_P4');

  const s1 = pickRandomFromPool('S_P1');
  const s2 = pickRandomFromPool('S_P2');
  const s3 = pickRandomFromPool('S_P3');
  const s4 = pickRandomFromPool('S_P4');

  const assembledParts = [
    { num: 1, title: `LISTENING - Part 1 – Word Recognition (${extractSourceDeTag(l1.examTitle)})`, src: l1 },
    { num: 2, title: `LISTENING - Part 2 – Information Matching (${extractSourceDeTag(l2.examTitle)})`, src: l2 },
    { num: 3, title: `LISTENING - Part 3 – Opinion Matching (${extractSourceDeTag(l3.examTitle)})`, src: l3 },
    { num: 4, title: `LISTENING - Part 4 – Monologue Comprehension (${extractSourceDeTag(l4.examTitle)})`, src: l4 },

    { num: 5, title: `READING - Part 1 – Sentence comprehension (${extractSourceDeTag(r1.examTitle)})`, src: r1 },
    { num: 6, title: `READING - Part 2 – Text cohesion (${extractSourceDeTag(r2.examTitle)})`, src: r2 },
    { num: 7, title: `READING - Part 3 – Opinion matching (${extractSourceDeTag(r3.examTitle)})`, src: r3 },
    { num: 8, title: `READING - Part 4 – Long reading (${extractSourceDeTag(r4.examTitle)})`, src: r4 },

    { num: 9, title: `WRITING - Part 1 – Short Answers (${extractSourceDeTag(w1.examTitle)})`, src: w1 },
    { num: 10, title: `WRITING - Part 2 – Social Media Response (${extractSourceDeTag(w2.examTitle)})`, src: w2 },
    { num: 11, title: `WRITING - Part 3 – Three Questions (${extractSourceDeTag(w3.examTitle)})`, src: w3 },
    { num: 12, title: `WRITING - Part 4 – Formal & Informal Email (${extractSourceDeTag(w4.examTitle)})`, src: w4 },

    { num: 13, title: `SPEAKING - Part 1 – Personal Information (${extractSourceDeTag(s1.examTitle)})`, src: s1 },
    { num: 14, title: `SPEAKING - Part 2 – Describe Picture (${extractSourceDeTag(s2.examTitle)})`, src: s2 },
    { num: 15, title: `SPEAKING - Part 3 – Compare Two Pictures (${extractSourceDeTag(s3.examTitle)})`, src: s3 },
    { num: 16, title: `SPEAKING - Part 4 – Abstract Discussion (${extractSourceDeTag(s4.examTitle)})`, src: s4 },
  ];

  // Xóa các Part cũ của đề này và tạo lại 16 Part mới được random
  await prisma.examPart.deleteMany({ where: { exam_id: examId } });

  for (const ap of assembledParts) {
    await prisma.examPart.create({
      data: {
        exam_id: examId,
        part_number: ap.num,
        title: ap.title,
        instructions: ap.src.instructions,
        passage_text: ap.src.passage_text,
        audio_url: ap.src.audio_url,
        image_url: ap.src.image_url,
        questions: {
          create: ap.src.questions.map((q, qIdx) => ({
            question_number: q.question_number || qIdx + 1,
            question_type: q.question_type,
            prompt: q.prompt,
            options: q.options ?? undefined,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            max_score: q.max_score || 1.0,
          })),
        },
      },
    });
  }

  return prisma.exam.findUnique({
    where: { id: examId },
    include: { parts: { include: { questions: true } } },
  });
}

