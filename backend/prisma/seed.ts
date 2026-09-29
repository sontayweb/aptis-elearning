import 'dotenv/config';
import { PrismaClient, UserRole, PlanType, ExamSkill, QuestionType, DictationLevel, SubmissionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('=== STARTING MASTER DATABASE SEEDING FOR APTIS KỲ TÍCH ===');

  // ========================================================
  // 1. SEED SUBSCRIPTION PLANS
  // ========================================================
  console.log('1. Seeding Subscription Plans...');
  const plans = [
    {
      code: PlanType.FREE,
      name: 'Gói Dùng Thử (Miễn Phí)',
      price_vnd: 0,
      duration_days: 9999,
      ai_quota: 3,
      teacher_quota: 0,
      features: [
        'Làm các đề thi thử miễn phí cơ bản',
        'Xem mẹo làm bài chuẩn British Council',
        'Luyện từ vựng cơ bản',
        '3 lượt chấm AI Speaking & Writing dùng thử',
      ],
    },
    {
      code: PlanType.VIP_1M,
      name: 'Aptis Tốc Hành (1 Tháng)',
      price_vnd: 199000,
      duration_days: 30,
      ai_quota: 10,
      teacher_quota: 0,
      features: [
        'Mở khóa toàn bộ 860+ bộ đề thi PRO',
        '10 lượt chấm AI Speaking & Writing chuyên sâu',
        'Mở khóa đề Listening & Reading đầy đủ đáp án giải thích',
        'Kho từ vựng cá nhân không giới hạn',
      ],
    },
    {
      code: PlanType.VIP_3M,
      name: 'Aptis Cày Đề (3 Tháng)',
      price_vnd: 399000,
      duration_days: 90,
      ai_quota: 30,
      teacher_quota: 3,
      features: [
        'Mở khóa TOÀN BỘ Kho Đề Key Dự Đoán trúng tủ 85%',
        '30 lượt chấm AI Speaking & Writing',
        '3 lượt Giảng viên chấm kèm bài sửa chi tiết',
        'Luyện nghe chép chính tả Dictation không giới hạn',
        'Hỗ trợ giải đáp thắc mắc 1:1 qua Zalo Admin VIP',
      ],
    },
    {
      code: PlanType.PREMIER_6M,
      name: 'Aptis ESOL Premier (6 Tháng)',
      price_vnd: 699000,
      duration_days: 180,
      ai_quota: 100,
      teacher_quota: 10,
      features: [
        'Toàn quyền truy cập mọi tính năng VIP cao cấp nhất',
        '100 lượt chấm AI Speaking & Writing',
        '10 lượt Giảng viên chấm phân tích chi tiết',
        'Cam kết hỗ trợ học tập đến khi đạt chứng chỉ mong muốn',
      ],
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
  }

  // ========================================================
  // 2. SEED USERS & SUBSCRIPTIONS
  // ========================================================
  console.log('2. Seeding Core Users...');
  const defaultPasswordHash = await bcrypt.hash('Student123!@#', 12);
  const secureAdminHash = await bcrypt.hash('Admin123!@#', 12);

  const secureSuperAdminHash = await bcrypt.hash('SuperAdmin123!@#', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@aptiskytich.vn' },
    update: { password_hash: secureSuperAdminHash, role: UserRole.SUPER_ADMIN },
    create: {
      email: 'superadmin@aptiskytich.vn',
      password_hash: secureSuperAdminHash,
      full_name: 'Tổng Quản Trị Hệ Thống (Super Admin)',
      role: UserRole.SUPER_ADMIN,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@aptiskytich.vn' },
    update: { password_hash: secureAdminHash, role: UserRole.ADMIN },
    create: {
      email: 'admin@aptiskytich.vn',
      password_hash: secureAdminHash,
      full_name: 'Quản Trị Viên Học Vụ',
      role: UserRole.ADMIN,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@aptiskytich.vn' },
    update: { password_hash: secureAdminHash },
    create: {
      email: 'teacher@aptiskytich.vn',
      password_hash: secureAdminHash,
      full_name: 'Thầy Hưng Aptis Master',
      role: UserRole.TEACHER,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'hoanghiep310102@gmail.com' },
    update: { password_hash: defaultPasswordHash },
    create: {
      email: 'hoanghiep310102@gmail.com',
      password_hash: defaultPasswordHash,
      full_name: 'Hoàng Hiệp',
      role: UserRole.STUDENT,
    },
  });

  // Gán gói VIP 3 Tháng cho học viên demo
  const vipPlan = await prisma.subscriptionPlan.findUnique({ where: { code: PlanType.VIP_3M } });
  if (vipPlan) {
    const existingSub = await prisma.userSubscription.findFirst({
      where: { user_id: student.id, is_active: true },
    });
    if (!existingSub) {
      await prisma.userSubscription.create({
        data: {
          user_id: student.id,
          plan_id: vipPlan.id,
          start_date: new Date(),
          end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          is_active: true,
          ai_quota_left: 30,
          teacher_quota_left: 3,
        },
      });
    }
  }

  // ========================================================
  // 3. SEED GRAMMAR & VOCABULARY EXAMS (50 câu trắc nghiệm)
  // ========================================================
  console.log('3. Seeding Grammar & Vocabulary Exams...');
  const grammarExams = [
    {
      title: 'Đề thi Grammar & Vocabulary 01 — Format Chuẩn British Council',
      description: '50 câu hỏi trắc nghiệm gồm 25 câu ngữ pháp nâng cao và 25 câu từ vựng học thuật collocation.',
      duration_minutes: 25,
      is_pro: false,
      parts: [
        {
          part_number: 1,
          title: 'Part 1 - Grammar Focus',
          instructions: 'Chọn phương án đúng nhất (A, B, C hoặc D) để hoàn thành mỗi câu sau đây.',
          questions: [
            {
              question_number: 1,
              prompt: 'If I _____ enough time tomorrow, I will help you with your presentation.',
              options: ['have', 'had', 'will have', 'would have'],
              correct_answer: 'have',
              explanation: 'Câu điều kiện loại 1: Mệnh đề If dùng thì hiện tại đơn (If + S + V(s/es)).',
            },
            {
              question_number: 2,
              prompt: 'She suggested that he _____ to the doctor immediately.',
              options: ['goes', 'went', 'go', 'going'],
              correct_answer: 'go',
              explanation: 'Thể giả định thức: S + suggest + that + S + (should) + V-bare infinitive.',
            },
            {
              question_number: 3,
              prompt: 'The new bridge, _____ was opened last week, has greatly improved traffic flow.',
              options: ['that', 'which', 'where', 'who'],
              correct_answer: 'which',
              explanation: 'Mệnh đề quan hệ không xác định (có dấu phẩy) bổ nghĩa cho vật sử dụng "which".',
            },
            {
              question_number: 4,
              prompt: 'By the time the guests arrived, she _____ preparing the dinner.',
              options: ['finished', 'has finished', 'had finished', 'was finishing'],
              correct_answer: 'had finished',
              explanation: 'Hành động xảy ra và hoàn tất trước một mốc quá khứ dùng thì quá khứ hoàn thành (Past Perfect).',
            },
            {
              question_number: 5,
              prompt: 'Hardly _____ the house when it started to rain heavily.',
              options: ['he had left', 'had he left', 'he left', 'did he leave'],
              correct_answer: 'had he left',
              explanation: 'Cấu trúc đảo ngữ: Hardly + had + S + V3/ed + when + S + V2/ed.',
            },
          ],
        },
        {
          part_number: 2,
          title: 'Part 2 - Vocabulary Focus',
          instructions: 'Chọn từ hoặc cụm từ phù hợp nhất về mặt ngữ nghĩa và ngữ cảnh.',
          questions: [
            {
              question_number: 6,
              prompt: 'The company plans to _____ its operations into several Southeast Asian countries.',
              options: ['expand', 'prolong', 'stretch', 'lengthen'],
              correct_answer: 'expand',
              explanation: 'Collocation thông dụng: "expand operations" (mở rộng quy mô hoạt động kinh doanh).',
            },
            {
              question_number: 7,
              prompt: 'Due to unforeseen circumstances, the board meeting has been _____ until next Friday.',
              options: ['called off', 'put off', 'taken off', 'given off'],
              correct_answer: 'put off',
              explanation: '"Put off" = trì hoãn (postpone). Trong khi "call off" = hủy bỏ hoàn toàn.',
            },
            {
              question_number: 8,
              prompt: 'He has made a _____ contribution to the research team this year.',
              options: ['substantial', 'superficial', 'subtle', 'fragile'],
              correct_answer: 'substantial',
              explanation: '"Substantial contribution" mang ý nghĩa đóng góp to lớn, đáng kể.',
            },
          ],
        },
      ],
    },
    {
      title: 'Đề thi Grammar & Vocabulary 02 — Luyện tập nâng cao Band B2 - C',
      description: 'Bộ 50 câu ngữ pháp và từ vựng phân loại cao cấp giúp bứt phá điểm số tối đa 50/50.',
      duration_minutes: 25,
      is_pro: true,
      parts: [
        {
          part_number: 1,
          title: 'Part 1 - Advanced Grammar',
          instructions: 'Chọn đáp án chính xác nhất để hoàn thiện câu.',
          questions: [
            {
              question_number: 1,
              prompt: 'Not only _____ to win the tournament, but she also set a world record.',
              options: ['did she manage', 'she managed', 'she did manage', 'managed she'],
              correct_answer: 'did she manage',
              explanation: 'Đảo ngữ với cụm "Not only... but also": Not only + trợ động từ + S + V.',
            },
            {
              question_number: 2,
              prompt: 'Were it not for your generous assistance, we _____ the project on schedule.',
              options: ['could not complete', 'cannot complete', 'could not have completed', 'will not complete'],
              correct_answer: 'could not have completed',
              explanation: 'Đảo ngữ điều kiện loại 3 / hỗn hợp chỉ sự việc trong quá khứ.',
            },
          ],
        },
      ],
    },
    {
      title: 'Đề thi Grammar & Vocabulary 03 — Cấp tốc bứt phá điểm số',
      description: 'Tổng hợp các dạng bẫy ngữ pháp thường gặp nhất trong các kỳ thi Aptis gần đây.',
      duration_minutes: 25,
      is_pro: false,
      parts: [
        {
          part_number: 1,
          title: 'Part 1 - Core Grammar Traps',
          instructions: 'Đọc kỹ câu và chọn đáp án không mắc bẫy ngữ pháp.',
          questions: [
            {
              question_number: 1,
              prompt: 'Neither the manager nor the employees _____ informed about the policy shift.',
              options: ['was', 'were', 'is', 'has been'],
              correct_answer: 'were',
              explanation: 'Quy tắc hòa hợp chủ vị với "Neither... nor": Động từ chia theo danh từ đứng gần nhất ("employees" số nhiều).',
            },
          ],
        },
      ],
    },
  ];

  for (const item of grammarExams) {
    const existing = await prisma.exam.findFirst({ where: { title: item.title } });
    if (!existing) {
      await prisma.exam.create({
        data: {
          title: item.title,
          description: item.description,
          skill: ExamSkill.GRAMMAR_VOCABULARY,
          duration_minutes: item.duration_minutes,
          is_pro: item.is_pro,
          is_published: true,
          source: 'WEB',
          parts: {
            create: item.parts.map((p) => ({
              part_number: p.part_number,
              title: p.title,
              instructions: p.instructions,
              questions: {
                create: p.questions.map((q) => ({
                  question_number: q.question_number,
                  question_type: QuestionType.MULTIPLE_CHOICE,
                  prompt: q.prompt,
                  options: q.options,
                  correct_answer: q.correct_answer,
                  explanation: q.explanation,
                  max_score: 1.0,
                })),
              },
            })),
          },
        },
      });
    }
  }

  // ========================================================
  // 4. SEED LISTENING EXAMS
  // ========================================================
  console.log('4. Seeding Listening Exams...');
  const listeningExams = [
    {
      title: 'Đề thi Listening 01 — Nhận diện thông tin hội thoại thực tế',
      description: 'Mô phỏng chính xác phòng thi nghe Aptis với file audio, giới hạn 2 lần nghe mỗi câu.',
      duration_minutes: 35,
      is_pro: false,
      parts: [
        {
          part_number: 1,
          title: 'Part 1 - Information Recognition',
          instructions: 'Listen to the short announcement or conversation and choose the correct answer.',
          passage_text: 'Attention passengers on Platform 3. The 10:15 service to Manchester Piccadilly has been delayed by approximately 20 minutes due to signal failure. Please wait in the main concourse.',
          questions: [
            {
              question_number: 1,
              prompt: 'Why is the train service to Manchester Piccadilly delayed?',
              options: ['Adverse weather', 'Signal failure', 'Track maintenance', 'Staff shortage'],
              correct_answer: 'Signal failure',
              explanation: 'Audio thông báo: "The 10:15 service to Manchester Piccadilly has been delayed due to signal failure."',
            },
            {
              question_number: 2,
              prompt: 'What complimentary item is included with the hotel booking?',
              options: ['Free airport shuttle', 'Complimentary breakfast', 'Spa voucher', 'Dinner buffet'],
              correct_answer: 'Complimentary breakfast',
              explanation: 'Nhân viên lễ tân thông báo: "with complimentary breakfast included."',
            },
          ],
        },
      ],
    },
    {
      title: 'Đề thi Listening 02 — Thảo luận & Quan điểm nâng cao',
      description: 'Tập trung vào Part 3 & Part 4: Phân biệt quan điểm của 2 người nói và độc thoại học thuật.',
      duration_minutes: 35,
      is_pro: true,
      parts: [
        {
          part_number: 3,
          title: 'Part 3 - Discussion Opinion',
          instructions: 'Listen to the debate and identify who expresses which opinion.',
          questions: [
            {
              question_number: 1,
              prompt: 'Who believes that remote work increases employee satisfaction?',
              options: ['The man only', 'The woman only', 'Both speakers', 'Neither speaker'],
              correct_answer: 'The woman only',
              explanation: 'The woman clearly highlights flexibility and work-life balance benefits.',
            },
          ],
        },
      ],
    },
    {
      title: 'Đề thi Listening 03 — Tổng hợp đề thi thật Aptis ESOL',
      description: 'Bộ đề thi tổng hợp với các dạng giọng British, American và Australian đa dạng.',
      duration_minutes: 35,
      is_pro: false,
      parts: [
        {
          part_number: 1,
          title: 'Part 1 - Short Dialogue Clues',
          instructions: 'Listen and answer the question.',
          questions: [
            {
              question_number: 1,
              prompt: 'What time does the library close on Saturdays?',
              options: ['4:30 PM', '5:00 PM', '6:00 PM', '7:30 PM'],
              correct_answer: '5:00 PM',
              explanation: 'Announcer: "Please note our weekend hours end at 5:00 PM sharp."',
            },
          ],
        },
      ],
    },
  ];

  for (const item of listeningExams) {
    const existing = await prisma.exam.findFirst({ where: { title: item.title } });
    if (!existing) {
      await prisma.exam.create({
        data: {
          title: item.title,
          description: item.description,
          skill: ExamSkill.LISTENING,
          duration_minutes: item.duration_minutes,
          is_pro: item.is_pro,
          is_published: true,
          source: 'WEB',
          parts: {
            create: item.parts.map((p) => ({
              part_number: p.part_number,
              title: p.title,
              instructions: p.instructions,
              passage_text: p.passage_text,
              questions: {
                create: p.questions.map((q) => ({
                  question_number: q.question_number,
                  question_type: QuestionType.MULTIPLE_CHOICE,
                  prompt: q.prompt,
                  options: q.options,
                  correct_answer: q.correct_answer,
                  explanation: q.explanation,
                  max_score: 1.0,
                })),
              },
            })),
          },
        },
      });
    }
  }

  // ========================================================
  // 5. SEED READING EXAMS
  // ========================================================
  console.log('5. Seeding Reading Exams...');
  const readingExams = [
    {
      title: 'Đề thi Reading 01 — Hoàn thành câu & Đoạn văn ngắn',
      description: 'Luyện tập giao diện 2 cột chuẩn phòng thi British Council: văn bản bên trái, câu hỏi bên phải.',
      duration_minutes: 35,
      is_pro: false,
      parts: [
        {
          part_number: 3,
          title: 'Part 3 - Short Text Comprehension',
          instructions: 'Read the passage below and answer the questions on the right.',
          passage_text: `In the modern era of rapid urban development, high-density metropolises across the globe are grappling with mounting psychological stress and mental fatigue among residents. Recent empirical research published in environmental psychology journals highlights the profound impact that green spaces exert on neurological equilibrium.

Dr. Eleanor Vance, leading a longitudinal study across seven major capital cities, observed that individuals who spent merely twenty minutes daily walking through tree-lined public parks registered a significant 28% drop in salivary cortisol levels. Cortisol, commonly recognized as the primary human stress hormone, tends to stay chronically elevated in congested concrete environments where traffic noise and sensory overload are ubiquitous.

Furthermore, community gardens and rooftop botanical installations foster spontaneous social interaction among neighbors, mitigating urban loneliness. While skeptics frequently argue that dedicating prime commercial real estate to green parks reduces municipal tax revenue, city planners in Singapore and Copenhagen have convincingly proven otherwise: properties neighboring well-curated urban forests consistently appreciate in market valuation by over 15%, whilst employee productivity indicators in surrounding office zones reflect measurable increases.`,
          questions: [
            {
              question_number: 1,
              prompt: "According to Dr. Eleanor Vance's study, how long must residents spend in green spaces to reduce cortisol?",
              options: ['Forty-five minutes weekly', 'Twenty minutes daily', 'One hour every morning', 'Thirty minutes every other day'],
              correct_answer: 'Twenty minutes daily',
              explanation: "Đoạn văn nêu rõ: 'individuals who spent merely twenty minutes daily walking through tree-lined public parks registered a significant 28% drop'.",
            },
            {
              question_number: 2,
              prompt: 'What counter-argument do skeptics raise regarding urban parks?',
              options: [
                'They cause extensive traffic jams',
                'They degrade surrounding property values',
                'They diminish municipal tax revenue from commercial real estate',
                'They increase ambient urban noise levels',
              ],
              correct_answer: 'They diminish municipal tax revenue from commercial real estate',
              explanation: "Đoạn 3 chỉ rõ: 'While skeptics frequently argue that dedicating prime commercial real estate to green parks reduces municipal tax revenue...'.",
            },
            {
              question_number: 3,
              prompt: 'What is mentioned about properties situated adjacent to urban forests in Singapore and Copenhagen?',
              options: [
                'They require expensive municipal maintenance',
                'Their market valuation appreciates by more than 15%',
                'They are strictly reserved for commercial offices',
                'Their rental rates fluctuate unpredictably',
              ],
              correct_answer: 'Their market valuation appreciates by more than 15%',
              explanation: "Tác giả nêu dẫn chứng: 'properties neighboring well-curated urban forests consistently appreciate in market valuation by over 15%'.",
            },
          ],
        },
      ],
    },
    {
      title: 'Đề thi Reading 02 — Đọc hiểu học thuật Band B2 - C',
      description: 'Luyện tập các bài đọc dài với chủ đề Trí tuệ nhân tạo, Biến đổi khí hậu và Toàn cầu hóa.',
      duration_minutes: 35,
      is_pro: true,
      parts: [
        {
          part_number: 4,
          title: 'Part 4 - Academic Long Passage',
          instructions: 'Match headings with each corresponding paragraph.',
          passage_text: 'Artificial Intelligence has radically altered diagnostic procedures in clinical medicine...',
          questions: [
            {
              question_number: 1,
              prompt: 'What is the primary breakthrough of AI in radiological imaging?',
              options: ['Lower equipment cost', 'Higher anomaly detection accuracy', 'Reduced scan time', 'Zero human supervision'],
              correct_answer: 'Higher anomaly detection accuracy',
              explanation: 'Algorithms can detect micro-calcifications earlier than conventional inspection.',
            },
          ],
        },
      ],
    },
    {
      title: 'Đề thi Reading 03 — Kỹ năng Skimming & Scanning chuyên sâu',
      description: 'Phương pháp định vị từ khóa nhanh để tìm thông tin chính xác trong thời gian ngắn.',
      duration_minutes: 35,
      is_pro: false,
      parts: [
        {
          part_number: 1,
          title: 'Part 1 - Rapid Sentence Completion',
          instructions: 'Choose the correct word to complete the email.',
          questions: [
            {
              question_number: 1,
              prompt: 'Dear Sarah, Thank you for _____ the monthly financial report so promptly.',
              options: ['sending', 'send', 'sent', 'to send'],
              correct_answer: 'sending',
              explanation: 'Sau giới từ "for" sử dụng V-ing.',
            },
          ],
        },
      ],
    },
  ];

  for (const item of readingExams) {
    const existing = await prisma.exam.findFirst({ where: { title: item.title } });
    if (!existing) {
      await prisma.exam.create({
        data: {
          title: item.title,
          description: item.description,
          skill: ExamSkill.READING,
          duration_minutes: item.duration_minutes,
          is_pro: item.is_pro,
          is_published: true,
          source: 'WEB',
          parts: {
            create: item.parts.map((p) => ({
              part_number: p.part_number,
              title: p.title,
              instructions: p.instructions,
              passage_text: p.passage_text,
              questions: {
                create: p.questions.map((q) => ({
                  question_number: q.question_number,
                  question_type: QuestionType.MULTIPLE_CHOICE,
                  prompt: q.prompt,
                  options: q.options,
                  correct_answer: q.correct_answer,
                  explanation: q.explanation,
                  max_score: 1.0,
                })),
              },
            })),
          },
        },
      });
    }
  }

  // ========================================================
  // 6. SEED SPEAKING EXAMS
  // ========================================================
  console.log('6. Seeding Speaking Exams...');
  const speakingExams = [
    {
      title: 'Đề thi Speaking 01 — Khảo sát phản xạ nói 4 phần Aptis',
      description: 'Format chuẩn 4 phần British Council: Giao tiếp cá nhân, Miêu tả tranh, So sánh 2 tranh và Độc thoại 2 phút.',
      duration_minutes: 12,
      is_pro: false,
      parts: [
        {
          part_number: 1,
          title: 'Part 1 - Giao tiếp cá nhân & Phản xạ nhanh',
          instructions: 'Trả lời 3 câu hỏi cá nhân ngắn trong vòng 30 giây mỗi câu. Không có thời gian chuẩn bị.',
          questions: [
            {
              question_number: 1,
              prompt: 'Please tell me about yourself and where you come from.',
              explanation: 'Well, my name is Linh, and I was born and raised in Hanoi, the bustling capital city of Vietnam. Currently, I am a senior undergraduate majoring in international business. Hanoi is renowned for its centuries-old cultural heritage and vibrant street food scene, which I take immense pride in.',
            },
            {
              question_number: 2,
              prompt: 'What do you like to do in your free time?',
              explanation: 'Whenever I have some downtime, I am keen on practicing acoustic guitar and immersing myself in historical non-fiction books. Engaging in these creative pursuits allows me to unwind, decompress after hectic study schedules, and broaden my intellectual horizons.',
            },
            {
              question_number: 3,
              prompt: 'What is your favorite dish and why do you like it?',
              explanation: 'Without a doubt, my absolute favorite dish is traditional Vietnamese Pho Bo. The rich, aromatic broth simmered with cinnamon and star anise, combined with tender slices of beef and fresh herbs, creates an exquisite gastronomic experience that truly feels like home.',
            },
          ],
        },
        {
          part_number: 2,
          title: 'Part 2 - Miêu tả tranh & Chia sẻ trải nghiệm',
          instructions: 'Miêu tả bức tranh (45s) và trả lời 2 câu hỏi tiếp nối (45s mỗi câu).',
          image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
          questions: [
            {
              question_number: 4,
              prompt: 'Describe what you see in the picture and what the people are doing.',
              explanation: 'In this vibrant photograph, I can observe a diverse group of university students gathered around a wooden table in what appears to be a bright, contemporary library or co-working space. They are deeply engrossed in a collaborative project, with several laptops open, notebooks scattered, and one student actively pointing at a screen while exchanging insightful ideas with her peers.',
            },
            {
              question_number: 5,
              prompt: 'Tell me about a time you had to study or work in a team.',
              explanation: 'Last semester, I spearheaded a team of four classmates for our marketing capstone presentation. Initially, we encountered notable friction regarding task delegation and conflicting schedules. However, by establishing weekly milestones on Trello and fostering transparent communication, we successfully delivered an award-winning pitch that earned top honors from our professor.',
            },
            {
              question_number: 6,
              prompt: 'Do you think digital classrooms will completely replace traditional schools?',
              explanation: 'From my perspective, while digital classrooms offer unparalleled flexibility and borderless access to educational repositories, they cannot entirely supersede brick-and-mortar schools. Face-to-face social synergy, spontaneous peer debates, and empathetic teacher-student mentorship remain irreplaceable pillars of holistic character development.',
            },
          ],
        },
        {
          part_number: 3,
          title: 'Part 3 - So sánh hai bức tranh & Tranh luận thể chất',
          instructions: 'So sánh hai hình ảnh (45s) và trả lời 2 câu hỏi tiếp nối (45s mỗi câu).',
          image_url: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80',
          questions: [
            {
              question_number: 7,
              prompt: 'Compare these two pictures showing different ways people exercise. What are the advantages of each?',
              options: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'],
              explanation: 'Both photographs illustrate dedication to physical fitness, yet they highlight contrasting environments. The first depicts a runner jogging through a scenic outdoor park surrounded by lush greenery, which provides invigorating fresh air and natural serenity. Conversely, the second displays individuals training in a modern indoor gymnasium equipped with state-of-the-art resistance machines, offering structured workouts irrespective of inclement weather.',
            },
            {
              question_number: 8,
              prompt: 'Which of these two workout environments would you personally prefer, and why?',
              explanation: 'Personally speaking, I lean toward outdoor workouts in natural parks. Exercising under open skies and morning sunlight significantly boosts my serotonin levels and relieves academic stress far more effectively than the repetitive, enclosed atmosphere of an indoor gym.',
            },
            {
              question_number: 9,
              prompt: 'Why do modern urban residents struggle to maintain regular physical fitness routines?',
              explanation: 'The primary culprit is undoubtedly the sedentary nature of modern professional life, compounded by grueling commute hours and screen exhaustion. Furthermore, the lack of accessible public sports facilities in densely packed metropolitan zones often discourages individuals from cultivating consistent athletic habits.',
            },
          ],
        },
        {
          part_number: 4,
          title: 'Part 4 - Trình bày chủ đề nâng cao: Chuyến đi đáng nhớ',
          instructions: 'Chuẩn bị 60 giây và nói liên tục trong 2 phút trả lời cả 3 câu hỏi dưới đây.',
          image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
          questions: [
            {
              question_number: 10,
              prompt: 'You will have 60 seconds to prepare notes, then speak continuously for 2 minutes to answer all 3 questions below.',
              options: [
                '1. Tell me about a memorable journey you took with your friends or family.',
                '2. How did you feel during that journey and what valuable lessons did you learn?',
                '3. Why is traveling considered an essential experience for personal growth?',
              ],
              explanation: 'I would like to recount an unforgettable backpacking expedition that I undertook with three close friends across Ha Giang province in Northern Vietnam two summers ago. As we traversed majestic limestone peaks and navigated perilous mountain passes on motorbikes, I was utterly captivated by the raw, breathtaking grandeur of nature. During the trek, we were caught in a torrential downpour and suffered a flat tire in a remote hamlet; yet, the warm hospitality of the local ethnic families who welcomed us into their stilt homes demonstrated profound human kindness that deeply humbled us. This transformative experience instilled in me vital lessons regarding resilience, adaptability, and cultural empathy. Traveling pushes individuals beyond their comfortable bubbles, forcing them to confront ambiguity and celebrate diversity, thereby molding mature, globally minded citizens.',
            },
          ],
        },
      ],
    },
    {
      title: 'Đề thi Speaking 02 — Đề thi phòng thi thực tế 2026',
      description: 'Chủ đề hot cập nhật xu hướng 2026: Văn hóa làm việc linh hoạt, Công nghệ số và Dự án thành tựu cá nhân.',
      duration_minutes: 12,
      is_pro: true,
      parts: [
        {
          part_number: 1,
          title: 'Part 1 - Thói quen & Nhịp sống hiện đại',
          instructions: 'Trả lời 3 câu hỏi cá nhân ngắn trong vòng 30 giây mỗi câu.',
          questions: [
            {
              question_number: 1,
              prompt: 'How do you usually start your morning on weekdays?',
              explanation: 'My weekday morning kicks off at 6:30 AM with a fifteen-minute session of mindfulness meditation, followed by a warm cup of pour-over coffee. I find that avoiding smartphone notifications during the first hour allows me to establish mental clarity and plan my priorities intentionally.',
            },
            {
              question_number: 2,
              prompt: 'How do you commute to work or school each day?',
              explanation: 'I usually take the new urban elevated metro system. It takes approximately twenty minutes, which is remarkably punctual compared to the unpredictable road congestion. During the ride, I take the opportunity to listen to educational podcasts or read news briefs.',
            },
            {
              question_number: 3,
              prompt: 'What healthy digital habits do you try to maintain regularly?',
              explanation: 'To prevent digital burnout, I implement a strict digital detox policy after 10 PM by leaving my smartphone in another room. Additionally, I utilize time-tracking applications that cap my recreational social media browsing to thirty minutes daily.',
            },
          ],
        },
        {
          part_number: 2,
          title: 'Part 2 - Văn hóa cà phê đô thị',
          instructions: 'Miêu tả bức tranh (45s) và trả lời 2 câu hỏi tiếp nối (45s mỗi câu).',
          image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
          questions: [
            {
              question_number: 4,
              prompt: 'Describe what you see in this modern urban coffee shop.',
              explanation: 'The picture depicts an aesthetically minimalist specialty coffee shop illuminated by soft industrial pendant lamps. Several patrons are seated at rustic oak tables, typing intently on laptops with headphones on, while a skilled barista at the marble counter is crafting latte art with evident precision.',
            },
            {
              question_number: 5,
              prompt: 'Where do you and your friends usually meet when you want to catch up?',
              explanation: 'We frequently gather at quiet artisanal tea houses or cozy rooftop cafes nestled in the old quarters. Such venues strike the ideal balance between ambient background music and comfortable seating, enabling us to engage in meaningful conversations without shouting over noise.',
            },
            {
              question_number: 6,
              prompt: 'Why has coffee culture become so popular among young people in your country?',
              explanation: 'Coffee establishments in Vietnam have evolved far beyond mere beverage outlets; they serve as communal lifestyle hubs. For the younger generation, cafes represent flexible third spaces for remote work, networking, and creative expression, offering aesthetic environments conducive to productivity.',
            },
          ],
        },
        {
          part_number: 3,
          title: 'Part 3 - Môi trường làm việc: Văn phòng vs Làm việc từ xa',
          instructions: 'So sánh làm việc tại văn phòng truyền thống và làm việc từ xa tại nhà (45s).',
          image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
          questions: [
            {
              question_number: 7,
              prompt: 'Compare working in a corporate office versus working remotely from home.',
              options: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80'],
              explanation: 'Both photos showcase productive working modes, but with fundamentally distinct dynamics. The first image illustrates a formal corporate open-plan office where teams engage in direct physical collaboration and immediate feedback loops. In contrast, the second image showcases an individual working autonomously from a peaceful home setup, which affords personalized comfort and eliminates stressful daily commutes.',
            },
            {
              question_number: 8,
              prompt: 'What are the main drawbacks of working from home for extended periods?',
              explanation: 'The most pronounced drawback is the blurring of boundaries between professional duties and private life, frequently precipitating chronic burnout. Additionally, protracted isolation from colleagues can erode company culture and hinder spontaneous brainstorming sessions.',
            },
            {
              question_number: 9,
              prompt: 'Do you believe hybrid working models will permanently dominate future employment?',
              explanation: 'Indeed, I firmly believe that the hybrid model represents the undeniable future of knowledge work. By combining two or three days of collaborative on-site presence with remote deep-focus days, enterprises optimize employee satisfaction while sustaining high operational productivity.',
            },
          ],
        },
        {
          part_number: 4,
          title: 'Part 4 - Cột mốc thành tựu & Sự kiên trì cá nhân',
          instructions: 'Chuẩn bị 60 giây và nói liên tục trong 2 phút trả lời 3 câu hỏi sau.',
          image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
          questions: [
            {
              question_number: 10,
              prompt: 'You will have 60 seconds to prepare notes, then speak continuously for 2 minutes to answer all 3 questions below.',
              options: [
                '1. Describe a significant achievement or personal project you are most proud of.',
                '2. What major obstacles or difficulties did you encounter, and how did you overcome them?',
                '3. What crucial lessons did this experience teach you about personal perseverance?',
              ],
              explanation: 'I would like to share the story of developing an open-source mobile reading application for visually impaired high school students, which stands as my most fulfilling milestone. At the outset of the venture, our technical team lacked sufficient experience in accessibility APIs and screen-reader audio synthesis, leading to severe performance bottlenecks and multiple software crashes. Compounding this, balancing intensive academic coursework with late-night debugging pushed my mental stamina to its limits. To overcome these hurdles, I initiated proactive consultations with senior software architects and invited actual blind students to test alpha prototypes, refining our user interface iteratively based on their raw feedback. Ultimately, releasing the finalized app to over five hundred grateful beneficiaries taught me that genuine perseverance is not merely stubborn persistence, but rather the humility to listen, adapt swiftly, and remain anchored to a compassionate vision.',
            },
          ],
        },
      ],
    },
    {
      title: 'Đề thi Speaking 03 — Chiến thuật đạt Band C Speaking',
      description: 'Nâng cao vốn từ vựng ngữ âm, ngữ điệu RP và phản xạ tự nhiên chuẩn khung Châu Âu CEFR C1.',
      duration_minutes: 12,
      is_pro: false,
      parts: [
        {
          part_number: 1,
          title: 'Part 1 - Phản xạ nhanh & Sở thích nghệ thuật',
          instructions: 'Trả lời 3 câu hỏi cá nhân ngắn trong vòng 30 giây mỗi câu.',
          questions: [
            {
              question_number: 1,
              prompt: 'What kind of music do you listen to when studying or relaxing?',
              explanation: 'When concentrating on demanding intellectual tasks, I gravitate toward instrumental neo-classical melodies or ambient lo-fi soundscapes. The absence of lyrical distraction stimulates cognitive focus while cultivating a tranquil mindset.',
            },
            {
              question_number: 2,
              prompt: 'What genre of books or films do you find most captivating?',
              explanation: 'I have an enduring fascination with psychological thrillers and thought-provoking science fiction. Masterpieces like Interstellar fascinate me because they intertwine cutting-edge astrophysical concepts with profound philosophical musings on human sacrifice.',
            },
            {
              question_number: 3,
              prompt: 'What do you find most challenging when mastering a foreign language?',
              explanation: 'In my experience, the greatest hurdle lies in acquiring idiomatic nuance and authentic conversational rhythm. While memorizing grammatical syntax is relatively straightforward, achieving effortless spontaneity during high-stakes dialogues demands extensive exposure.',
            },
          ],
        },
        {
          part_number: 2,
          title: 'Part 2 - Giải thi đấu thể thao sôi động',
          instructions: 'Miêu tả bức tranh (45s) và trả lời 2 câu hỏi tiếp nối (45s mỗi câu).',
          image_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
          questions: [
            {
              question_number: 4,
              prompt: 'Describe what is happening in this sports competition picture.',
              explanation: 'This action-packed image captures a climactic moment in a track-and-field sprint championship inside an enormous stadium. Several world-class sprinters are exerting maximal muscular power as they lean across the finish line, while thousands of passionate spectators cheer enthusiastically in the background.',
            },
            {
              question_number: 5,
              prompt: 'Tell me about the most thrilling sports match or competition you have ever witnessed.',
              explanation: 'The most exhilarating sporting event I witnessed was the 2018 AFC U23 Championship final, where the Vietnamese national team battled under a blizzard in Changzhou. Despite the harsh snowstorm, their miraculous equalizer ignited a wave of national unity and euphoria that I will cherish indefinitely.',
            },
            {
              question_number: 6,
              prompt: 'Should physical education and sports be compulsory at universities?',
              explanation: 'I strongly advocate for mandatory physical curriculum in higher education. Rigorous physical training not only combats sedentary lifestyle diseases among undergraduates but also inculcates emotional resilience, strategic teamwork, and stress coping mechanisms indispensable for corporate careers.',
            },
          ],
        },
        {
          part_number: 3,
          title: 'Part 3 - Đô thị sôi động và Nông thôn thanh bình',
          instructions: 'So sánh cuộc sống tại thành phố lớn và vùng ngoại ô nông thôn (45s).',
          image_url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=80',
          questions: [
            {
              question_number: 7,
              prompt: 'Compare living in a buzzing metropolitan city versus a quiet rural village.',
              options: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'],
              explanation: 'The first photograph reveals a sprawling metropolis ablaze with neon skyscrapers and bustling arteries, representing boundless career opportunities, top-tier healthcare, and cosmopolitan entertainment. In stark contrast, the second image portrays a serene pastoral landscape dotted with rolling green hills, offering pristine air quality and a peaceful pace of life.',
            },
            {
              question_number: 8,
              prompt: 'Which living environment is more suitable for raising young children?',
              explanation: 'I would argue that suburban or semi-rural environments offer superior foundations for young children. Growing up close to nature encourages tactile exploration, safe outdoor playtime, and emotional grounding away from toxic exhaust and relentless sensory overload.',
            },
            {
              question_number: 9,
              prompt: 'What can city governments do to tackle traffic congestion and air pollution?',
              explanation: 'Municipal administrations must decisively invest in integrated rapid transit infrastructure, such as subterranean metros and electric bus fleets. Concurrently, imposing congestion tariffs on private fossil-fueled vehicles entering city centers can incentivize widespread public transit adoption.',
            },
          ],
        },
        {
          part_number: 4,
          title: 'Part 4 - Hình mẫu truyền cảm hứng & Triết lý sống',
          instructions: 'Chuẩn bị 60 giây và nói liên tục trong 2 phút trả lời 3 câu hỏi sau.',
          image_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
          questions: [
            {
              question_number: 10,
              prompt: 'You will have 60 seconds to prepare notes, then speak continuously for 2 minutes to answer all 3 questions below.',
              options: [
                '1. Tell me about a teacher, leader, or mentor who strongly inspired your personal development.',
                '2. What admirable qualities or values made this person particularly remarkable to you?',
                '3. How have their teachings or actions shaped your future ambitions and philosophy of life?',
              ],
              explanation: 'When contemplating individuals who have exerted a transformative influence on my maturation, my high school literature teacher, Mrs. Mai, stands out prominently. What distinguished her was not merely her encyclopedic command of classical literary prose, but her boundless empathy and innate ability to recognize the untapped potential in every self-doubting pupil. During a difficult phase when I suffered from severe academic impostor syndrome, she spent countless extracurricular hours reviewing my essay drafts, coaching me to articulate my authentic worldview without fear of judgment. Her steadfast integrity and compassion taught me that true leadership is defined by lifting others rather than commanding them. Inspired by her exemplary dedication, I have resolved to integrate educational mentorship into my long-term career aspirations, committed to empowering the next generation of youth.',
            },
          ],
        },
      ],
    },
    {
      title: 'Đề thi Speaking 04 — Môi trường, Biến đổi khí hậu & Đô thị xanh',
      description: 'Bộ đề thi dự đoán trọng điểm: Lối sống bền vững, Chợ nông sản hữu cơ, Giao thông xanh và Hành động vì môi trường.',
      duration_minutes: 12,
      is_pro: true,
      parts: [
        {
          part_number: 1,
          title: 'Part 1 - Thiên nhiên & Thói quen bảo vệ môi trường',
          instructions: 'Trả lời 3 câu hỏi cá nhân ngắn trong vòng 30 giây mỗi câu.',
          questions: [
            {
              question_number: 1,
              prompt: 'What kind of weather do you enjoy the most and why?',
              explanation: 'I am particularly fond of crisp autumnal weather, characterized by mild breezes and gentle sunshine. Such temperate climate is ideal for cycling and outdoor photography, without the stifling humidity of mid-summer.',
            },
            {
              question_number: 2,
              prompt: 'How often do you visit public parks or botanical gardens?',
              explanation: 'I make a deliberate effort to visit our municipal botanical gardens at least twice a month. Strolling beneath lush green canopies offers a restorative retreat where I can recharge my mental batteries.',
            },
            {
              question_number: 3,
              prompt: 'What small actions do you take daily to save energy and reduce waste?',
              explanation: 'I consistently carry a reusable stainless-steel tumbler and canvas tote bags to circumvent single-use plastics. In my apartment, I rigorously turn off phantom appliances and maximize natural daylight.',
            },
          ],
        },
        {
          part_number: 2,
          title: 'Part 2 - Chợ nông sản hữu cơ địa phương',
          instructions: 'Miêu tả bức tranh (45s) và trả lời 2 câu hỏi tiếp nối (45s mỗi câu).',
          image_url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80',
          questions: [
            {
              question_number: 4,
              prompt: 'Describe what you see in this vibrant local farmers market.',
              explanation: 'The picture showcases a bustling outdoor farmer’s market on a sunny morning. Wooden stalls are brimming with colorful organic vegetables, ripe heirloom fruits, and fresh artisan bread. Local vendors in linen aprons are cheerfully interacting with eco-conscious shoppers carrying wicker baskets.',
            },
            {
              question_number: 5,
              prompt: 'Do you prefer shopping at large supermarkets or local traditional markets?',
              explanation: 'I generally prefer patronizing local farmers markets because the produce is visibly fresher and free from excessive plastic packaging. Furthermore, shopping locally directly bolsters regional farmers and keeps money circulating within the grassroots community.',
            },
            {
              question_number: 6,
              prompt: 'Why has organic food gained widespread popularity despite higher prices?',
              explanation: 'Mounting consumer awareness regarding harmful pesticide residues and corporate food additives has catalyzed this organic surge. Consumers now treat organic nutrition as an essential health investment to stave off chronic illnesses.',
            },
          ],
        },
        {
          part_number: 3,
          title: 'Part 3 - Giao thông đô thị: Xe đạp công cộng vs Xe hơi cá nhân',
          instructions: 'So sánh phương tiện di chuyển xanh và xe hơi cá nhân (45s).',
          image_url: 'https://images.unsplash.com/photo-1519583272095-6433dab16b8e?auto=format&fit=crop&w=800&q=80',
          questions: [
            {
              question_number: 7,
              prompt: 'Compare public bicycle sharing systems with commuting by private car in cities.',
              options: ['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'],
              explanation: 'Both pictures represent ubiquitous urban transit modalities with striking differences. The first displays citizens gliding effortlessly on rented public bicycles along designated green pathways, producing zero greenhouse emissions. The second photograph, by contrast, captures an agonizing multi-lane traffic gridlock with dozens of private automobiles spewing exhaust fumes into the hazy urban skyline.',
            },
            {
              question_number: 8,
              prompt: 'What are the main obstacles preventing commuters from switching to bicycles?',
              explanation: 'The primary impediment is the hazardous lack of dedicated, barrier-protected cycling lanes in most developing metropolises. Moreover, extreme weather events such as scorching heatwaves or torrential downpours frequently render open-air cycling impractical for corporate workers.',
            },
            {
              question_number: 9,
              prompt: 'What bold policies should governments implement to achieve net-zero urban transport?',
              explanation: 'Progressive municipal authorities should heavily subsidize electrified mass rapid transit while repurposing automotive lanes into pedestrian-friendly green corridors. Implementing low-emission zones with escalating carbon levies can decisively nudge public behaviors toward sustainable choices.',
            },
          ],
        },
        {
          part_number: 4,
          title: 'Part 4 - Hoạt động tình nguyện vì môi trường sống',
          instructions: 'Chuẩn bị 60 giây và nói liên tục trong 2 phút trả lời 3 câu hỏi sau.',
          image_url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80',
          questions: [
            {
              question_number: 10,
              prompt: 'You will have 60 seconds to prepare notes, then speak continuously for 2 minutes to answer all 3 questions below.',
              options: [
                '1. Tell me about an environmental cleanup, tree-planting, or conservation initiative you joined or know about.',
                '2. How did the participants coordinate and what was the community’s reaction?',
                '3. How can schools and mass media collaborate to nurture eco-consciousness in young generations?',
              ],
              explanation: 'Last autumn, I had the privilege of joining a community-driven coastal cleanup campaign called "Clean Up Our Oceans" organized along the beaches of Da Nang. Over two hundred impassioned volunteers, spanning enthusiastic university students to retired local fishermen, assembled at dawn equipped with biodegradable trash bags, gloves, and protective rakes. In the span of six hours, our team collected over two tons of discarded plastic bottles, abandoned nylon fishing nets, and styrofoam containers. Local seaside vendors and tourists who witnessed our initiative were visibly moved, and many spontaneous onlookers even joined in to assist us. This powerful experience underscored that tangible grassroots activism possesses the viral momentum to spark real civic pride. To institutionalize environmental ethics, schools must integrate experiential ecological projects into curricula, while media outlets should spotlight grassroots sustainability champions to make green stewardship the defining social aspiration of youth.',
            },
          ],
        },
      ],
    },
    {
      title: 'Đề thi Speaking 05 — Giáo dục thông minh & Hướng nghiệp 4.0',
      description: 'Luyện tập các chủ đề tương lai: Trí tuệ nhân tạo trong học tập, Lớp học ảo VR, và Bản lĩnh vượt qua thất bại.',
      duration_minutes: 12,
      is_pro: false,
      parts: [
        {
          part_number: 1,
          title: 'Part 1 - Định hướng học tập & Kỹ năng tương lai',
          instructions: 'Trả lời 3 câu hỏi cá nhân ngắn trong vòng 30 giây mỗi câu.',
          questions: [
            {
              question_number: 1,
              prompt: 'What is your current academic major or area of professional interest?',
              explanation: 'I am currently focusing on computer science with a specialization in machine learning applications. I am deeply captivated by how algorithmic models can automate intricate diagnostic tasks in public healthcare.',
            },
            {
              question_number: 2,
              prompt: 'Which soft skill do you believe is most essential for workplace success?',
              explanation: 'Undoubtedly, emotional intelligence paired with adaptability reigns supreme. In an era where technological frameworks morph overnight, the capacity to communicate empathetically and pivot smoothly under pressure is priceless.',
            },
            {
              question_number: 3,
              prompt: 'Where do you envision yourself professionally in the next five years?',
              explanation: 'Five years down the road, I aspire to lead a multidisciplinary software innovation team developing accessible EdTech tools, bridging educational equity divides across emerging markets in Southeast Asia.',
            },
          ],
        },
        {
          part_number: 2,
          title: 'Part 2 - Nghiên cứu công nghệ cao trong phòng lab',
          instructions: 'Miêu tả bức tranh (45s) và trả lời 2 câu hỏi tiếp nối (45s mỗi câu).',
          image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          questions: [
            {
              question_number: 4,
              prompt: 'Describe what you see in this modern scientific research laboratory.',
              explanation: 'This captivating photograph showcases a cutting-edge robotics laboratory where two young researchers, clad in protective lab coats and safety goggles, are meticulously assembling a precision robotic arm. The workspace features digital oscilloscopes, complex circuit boards, and illuminated dual monitors displaying lines of code.',
            },
            {
              question_number: 5,
              prompt: 'Tell me about an exciting science or technology project you have worked on.',
              explanation: 'During my sophomore year, I participated in a university hackathon where my team constructed an automated hydroponic gardening sensor. We programmed microcontrollers to regulate nutrient levels and humidity in real time, winning the second prize for sustainable engineering.',
            },
            {
              question_number: 6,
              prompt: 'Why is hands-on practical experimentation more impactful than theoretical memorization?',
              explanation: 'Experiential experimentation bridges the perilous chasm between abstract theory and real-world execution. When students physically troubleshoot circuit faults or witness chemical reactions firsthand, cognitive neural pathways form far deeper problem-solving insights.',
            },
          ],
        },
        {
          part_number: 3,
          title: 'Part 3 - Lớp học truyền thống vs Lớp học thực tế ảo VR',
          instructions: 'So sánh phương thức giảng dạy bảng phấn và công nghệ thực tế ảo (45s).',
          image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
          questions: [
            {
              question_number: 7,
              prompt: 'Compare traditional chalkboard lecture halls with immersive VR virtual classrooms.',
              options: ['https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80'],
              explanation: 'The first image captures a conventional classroom setting where students listen to an instructor writing equations on a blackboard, fostering structured discipline and familiar collective focus. In contrast, the second image portrays an engaged learner wearing an advanced virtual reality headset, exploring fully interactive 3D simulations of human anatomy or planetary orbits with mesmerizing spatial depth.',
            },
            {
              question_number: 8,
              prompt: 'Which learning method stimulates higher student curiosity and comprehension?',
              explanation: 'Immersive VR unquestionably excels in igniting curiosity because it transforms passive spectators into active explorers. Walking through virtual ancient Rome or dissecting virtual atoms provides visceral conceptual clarity that static textbook diagrams can never rival.',
            },
            {
              question_number: 9,
              prompt: 'Will artificial intelligence tutors eventually replace human teachers?',
              explanation: 'I am convinced that while AI will become an indispensable copilot for personalized diagnostic homework and grading, it will never displace human educators. The core of pedagogy involves instilling ethical compass, offering emotional empathy, and inspiring dreams—quintessentially human virtues.',
            },
          ],
        },
        {
          part_number: 4,
          title: 'Part 4 - Thử thách học thuật & Bài học từ thất bại',
          instructions: 'Chuẩn bị 60 giây và nói liên tục trong 2 phút trả lời 3 câu hỏi sau.',
          image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
          questions: [
            {
              question_number: 10,
              prompt: 'You will have 60 seconds to prepare notes, then speak continuously for 2 minutes to answer all 3 questions below.',
              options: [
                '1. Describe a difficult academic exam or project challenge you faced and successfully conquered.',
                '2. What strategies and mental mindset enabled you to overcome self-doubt during this ordeal?',
                '3. Why is experiencing failure an indispensable catalyst for long-term excellence?',
              ],
              explanation: 'I would like to reflect on my university entrance examination journey, specifically mastering Advanced Calculus, which initially proved to be an overwhelming mountain. During preliminary mock evaluations, my scores plummeted to nearly failing thresholds, triggering devastating bouts of self-doubt and anxious dread. Realizing that passive textbook re-reading was futile, I radically revolutionized my study methodology: I broke the comprehensive syllabus into bite-sized daily problem sets, formed an accountability study group with high-achieving peers, and meticulously maintained an "error autopsy journal" to dissect every algorithmic misconception. Mentally, I learned to reframe anxiety as fuel for focused preparation. Through four months of relentless grit, I scored in the top five percentile nationwide. This formidable ordeal taught me that failure is not an antonym of success, but rather its foundational architect; stumbling reveals our blind spots, strengthens psychological tenacity, and equips us with the courage to conquer uncharted territories in life.',
            },
          ],
        },
      ],
    },
  ];

  for (const item of speakingExams) {
    const existing = await prisma.exam.findFirst({ where: { title: item.title } });
    if (existing) {
      await prisma.exam.delete({ where: { id: existing.id } });
    }
    await prisma.exam.create({
      data: {
        title: item.title,
        description: item.description,
        skill: ExamSkill.SPEAKING,
        duration_minutes: item.duration_minutes,
        is_pro: item.is_pro,
        is_published: true,
        source: 'WEB',
        parts: {
          create: item.parts.map((p) => ({
            part_number: p.part_number,
            title: p.title,
            instructions: p.instructions,
            image_url: p.image_url,
            questions: {
              create: p.questions.map((q) => ({
                question_number: q.question_number,
                question_type: QuestionType.SPEAKING_AUDIO,
                prompt: q.prompt,
                options: (q as any).options || [],
                explanation: (q as any).explanation,
                max_score: 12.5,
              })),
            },
          })),
        },
      },
    });
  }

  // ========================================================
  // 7. SEED WRITING EXAMS
  // ========================================================
  console.log('7. Seeding Writing Exams...');
  const writingExams = [
    {
      title: 'Đề thi Writing 01 — Viết tương tác & Thư trang trọng',
      description: 'Luyện tập đủ 4 phần chuẩn: Trả lời ngắn, Điền biểu mẫu, Tin nhắn mạng xã hội và Thư kiến nghị trang trọng.',
      duration_minutes: 50,
      is_pro: false,
      parts: [
        {
          part_number: 1,
          title: 'Part 1 - Short Answers (1-5 words)',
          instructions: 'You joined a local Sports & Fitness Club. Fill in the required registration fields (1-5 words each).',
          questions: [
            {
              question_number: 1,
              prompt: 'What is your favorite outdoor sport, and how often do you practice it?',
              explanation: 'Swimming, three times weekly.',
            },
          ],
        },
        {
          part_number: 2,
          title: 'Part 2 - Club Form Filling (20-30 words)',
          instructions: 'Please tell us why you are interested in joining our sports club and what personal goals you wish to achieve (20 - 30 words).',
          questions: [
            {
              question_number: 2,
              prompt: 'Write in full sentences (20 - 30 words).',
              explanation: 'I want to improve my cardiovascular endurance and maintain physical wellness after long office hours. Group workouts will also motivate me.',
            },
          ],
        },
        {
          part_number: 3,
          title: 'Part 3 - Social Network Chat (30-40 words)',
          instructions: "Sam: 'Hi! I heard the club might raise membership fees next month to upgrade gym machinery. What do you think about this?'",
          questions: [
            {
              question_number: 3,
              prompt: 'Respond to Sam expressing your personal opinion (30 - 40 words).',
              explanation: 'Personally, I believe modernizing gym equipment is beneficial for our training quality. However, the management should offer discounted grandfather rates for existing loyal members.',
            },
          ],
        },
        {
          part_number: 4,
          title: 'Part 4 - Formal Email to Club President (120-150 words)',
          instructions: 'You received an email stating that all weekend workout sessions are cancelled due to staff shortages. Write an email to the President expressing disappointment and proposing solutions.',
          questions: [
            {
              question_number: 4,
              prompt: 'Write an email to the Club President expressing disappointment and proposing constructive solutions (120 - 150 words).',
              explanation: 'Dear Mr. President,\n\nI am writing to express my earnest concern regarding the recent announcement to cancel all weekend workout sessions due to staff shortages. As a working professional, weekends are the only window of time when I can attend classes regularly.\n\nWhile I completely understand the staffing challenges currently facing the club, I would respectfully like to propose hiring qualified temporary guest instructors or organizing peer-led exercise groups under certified supervision. This approach would allow members to continue their routines uninterrupted without compromising safety.\n\nI genuinely hope the committee will consider these options favorably.\n\nYours sincerely,\nHoang Hiep',
            },
          ],
        },
      ],
    },
    {
      title: 'Đề thi Writing 02 — Đề thi chuẩn British Council 2026',
      description: 'Chủ đề Câu lạc bộ Sách và Văn hóa đọc trong kỷ nguyên số.',
      duration_minutes: 50,
      is_pro: true,
      parts: [
        {
          part_number: 1,
          title: 'Part 1 - Book Club Registration',
          instructions: 'Answer with 1-5 words.',
          questions: [
            {
              question_number: 1,
              prompt: 'What genre of books do you prefer reading?',
              explanation: 'Historical fiction and biographies.',
            },
          ],
        },
      ],
    },
    {
      title: 'Đề thi Writing 03 — Luyện viết luận nâng cao',
      description: 'Rèn luyện kỹ năng kết nối ý tưởng, sử dụng từ nối học thuật và cấu trúc câu phức ghép.',
      duration_minutes: 50,
      is_pro: false,
      parts: [
        {
          part_number: 1,
          title: 'Part 1 - Music Club Form',
          instructions: 'Fill in each line with 1-5 words.',
          questions: [
            {
              question_number: 1,
              prompt: 'Can you play any musical instrument?',
              explanation: 'Yes, acoustic guitar.',
            },
          ],
        },
      ],
    },
  ];

  for (const item of writingExams) {
    const existing = await prisma.exam.findFirst({ where: { title: item.title } });
    if (!existing) {
      await prisma.exam.create({
        data: {
          title: item.title,
          description: item.description,
          skill: ExamSkill.WRITING,
          duration_minutes: item.duration_minutes,
          is_pro: item.is_pro,
          is_published: true,
          source: 'WEB',
          parts: {
            create: item.parts.map((p) => ({
              part_number: p.part_number,
              title: p.title,
              instructions: p.instructions,
              questions: {
                create: p.questions.map((q) => ({
                  question_number: q.question_number,
                  question_type: QuestionType.ESSAY,
                  prompt: q.prompt,
                  explanation: q.explanation,
                  max_score: 12.5,
                })),
              },
            })),
          },
        },
      });
    }
  }

  // ========================================================
  // 8. SEED KEY DỰ ĐOÁN EXAMS (source: 'KEY')
  // ========================================================
  console.log('8. Seeding Key Dự Đoán Forecast Exams...');
  const keyExams = [
    {
      title: 'Bộ đề Key Dự Đoán Trúng Tủ Quý 1/2026 — Trọng tâm Speaking & Writing',
      description: 'Tổng hợp các chủ đề Speaking Part 2-3-4 và Writing Part 4 xuất hiện liên tục trong các kỳ thi gần nhất với tỷ lệ trúng 85%.',
      duration_minutes: 60,
      is_pro: true,
      parts: [
        {
          part_number: 1,
          title: 'Key Forecast Section 01',
          instructions: 'Đề thi dự đoán điểm cao chuẩn British Council.',
          questions: [
            {
              question_number: 1,
              prompt: 'Key Writing Part 4: Formal Letter regarding Environmental Conservation Policy in Urban Areas.',
              explanation: 'Bài viết mẫu đạt chuẩn CEFR C với vốn từ academic phong phú.',
            },
            {
              question_number: 2,
              prompt: 'Key Speaking Part 3: Discussing Remote Learning vs Traditional Classrooms.',
              explanation: 'Ý tưởng lập luận và từ vựng band cao cho chủ đề công nghệ giáo dục.',
            },
          ],
        },
      ],
    },
    {
      title: 'Bộ đề Key Dự Đoán Trúng Tủ Quý 2/2026 — Full 5 Kỹ Năng Đột Phá B2-C',
      description: 'Toàn bộ câu hỏi trắc nghiệm ngữ pháp hiếm gặp và audio nghe chép chính tả trọng tâm.',
      duration_minutes: 90,
      is_pro: true,
      parts: [
        {
          part_number: 1,
          title: 'Key Forecast Section 02',
          instructions: 'Luyện tập đề tủ chuẩn bị cho kỳ thi quý 2.',
          questions: [
            {
              question_number: 1,
              prompt: 'Key Reading Part 3: Climate change adaptation strategies in coastal cities.',
              explanation: 'Bẫy đọc hiểu và từ đồng nghĩa thường xuất hiện trong đề thật.',
            },
          ],
        },
      ],
    },
    {
      title: 'Bộ đề Key Dự Đoán Cấp Tốc 7 Ngày — Ôn Thi Trúng Tủ',
      description: 'Dành riêng cho học viên cần thi gấp trong vòng 1-2 tuần tới.',
      duration_minutes: 45,
      is_pro: true,
      parts: [
        {
          part_number: 1,
          title: 'Speed Review Key Set',
          instructions: 'Luyện các câu hỏi có xác suất lặp lại cao nhất.',
          questions: [
            {
              question_number: 1,
              prompt: 'Key Vocabulary: Top 50 collocations xuất hiện với tần suất cao nhất.',
              explanation: 'Tổng hợp danh sách collocation vàng.',
            },
          ],
        },
      ],
    },
  ];

  for (const item of keyExams) {
    const existing = await prisma.exam.findFirst({ where: { title: item.title } });
    if (!existing) {
      await prisma.exam.create({
        data: {
          title: item.title,
          description: item.description,
          skill: ExamSkill.FULL_TEST,
          duration_minutes: item.duration_minutes,
          is_pro: item.is_pro,
          is_published: true,
          source: 'KEY',
          parts: {
            create: item.parts.map((p) => ({
              part_number: p.part_number,
              title: p.title,
              instructions: p.instructions,
              questions: {
                create: p.questions.map((q) => ({
                  question_number: q.question_number,
                  question_type: QuestionType.MULTIPLE_CHOICE,
                  prompt: q.prompt,
                  explanation: q.explanation,
                  options: ['A', 'B', 'C', 'D'],
                  correct_answer: 'A',
                  max_score: 1.0,
                })),
              },
            })),
          },
        },
      });
    }
  }

  // ========================================================
  // 9. SEED FULL TEST (THI THỬ TỔNG HỢP)
  // ========================================================
  console.log('9. Seeding Full Test Mock Exams...');
  const fullTests = [
    {
      title: 'Đề thi thử 01 — Aptis ESOL Full Test 2026',
      description: 'Mô phỏng chuẩn format máy tính British Council 5 kỹ năng',
      duration_minutes: 162,
      is_pro: false,
    },
    {
      title: 'Đề thi thử 02 — Aptis ESOL Full Test Bứt Phá Điểm C',
      description: 'Độ khó nâng cao dành cho học viên mục tiêu B2 vững vàng hoặc chứng chỉ C.',
      duration_minutes: 162,
      is_pro: true,
    },
  ];

  for (const item of fullTests) {
    const existing = await prisma.exam.findFirst({ where: { title: item.title } });
    if (!existing) {
      await prisma.exam.create({
        data: {
          title: item.title,
          description: item.description,
          skill: ExamSkill.FULL_TEST,
          duration_minutes: item.duration_minutes,
          is_pro: item.is_pro,
          is_published: true,
          source: 'WEB',
          parts: {
            create: [
              {
                part_number: 1,
                title: 'Part 1: Grammar & Vocabulary Section',
                instructions: 'Choose the best option to complete each sentence.',
                questions: {
                  create: [
                    {
                      question_number: 1,
                      question_type: QuestionType.MULTIPLE_CHOICE,
                      prompt: 'Had I known about the schedule change earlier, I _____ you immediately.',
                      options: ['would notify', 'would have notified', 'notified', 'will notify'],
                      correct_answer: 'would have notified',
                      explanation: 'Inverted third conditional clause.',
                      max_score: 1.0,
                    },
                  ],
                },
              },
            ],
          },
        },
      });
    }
  }

  // ========================================================
  // 10. SEED DICTATION LESSONS & SENTENCES
  // ========================================================
  console.log('10. Seeding Dictation Lessons...');
  const dictationData = [
    {
      level: DictationLevel.FOUNDATION,
      title: 'Bài 1: Giao tiếp tại nhà ga xe lửa',
      sentences: [
        {
          order_index: 1,
          audio_url: 'https://cdn.aptiskytich.vn/audio/dictation/foundation_1.mp3',
          transcript: 'Passengers are reminded to keep their personal belongings with them at all times.',
          translation_vi: 'Hành khách được nhắc nhở luôn giữ tư trang cá nhân bên mình.',
          hints: 'passengers, belongings',
          duration_seconds: 4.5,
        },
        {
          order_index: 2,
          audio_url: 'https://cdn.aptiskytich.vn/audio/dictation/foundation_2.mp3',
          transcript: 'The next train on platform three will depart for Oxford at ten thirty.',
          translation_vi: 'Chuyến tàu tiếp theo tại sân ga số 3 sẽ khởi hành đi Oxford lúc 10 giờ 30.',
          hints: 'platform, depart',
          duration_seconds: 4.2,
        },
      ],
    },
    {
      level: DictationLevel.MOMENTUM,
      title: 'Bài 2: Báo cáo môi trường và năng lượng sạch',
      sentences: [
        {
          order_index: 1,
          audio_url: 'https://cdn.aptiskytich.vn/audio/dictation/momentum_1.mp3',
          transcript: 'Renewable energy sources have demonstrated unprecedented cost efficiency over the past decade.',
          translation_vi: 'Các nguồn năng lượng tái tạo đã thể hiện hiệu quả chi phí chưa từng có trong thập kỷ qua.',
          hints: 'renewable, unprecedented',
          duration_seconds: 6.0,
        },
      ],
    },
    {
      level: DictationLevel.MASTERY,
      title: 'Bài 3: Tranh luận về ảnh hưởng của trí tuệ nhân tạo',
      sentences: [
        {
          order_index: 1,
          audio_url: 'https://cdn.aptiskytich.vn/audio/dictation/mastery_1.mp3',
          transcript: 'The implementation of autonomous algorithms raises ethical questions regarding algorithmic bias and accountability.',
          translation_vi: 'Việc triển khai các thuật toán tự hành đặt ra các câu hỏi đạo đức liên quan đến định kiến thuật toán.',
          hints: 'autonomous, accountability',
          duration_seconds: 8.0,
        },
      ],
    },
  ];

  for (const d of dictationData) {
    const existing = await prisma.dictationLesson.findFirst({ where: { title: d.title } });
    if (!existing) {
      await prisma.dictationLesson.create({
        data: {
          level: d.level,
          title: d.title,
          order_index: 1,
          total_sentences: d.sentences.length,
          sentences: {
            create: d.sentences,
          },
        },
      });
    }
  }

  // ========================================================
  // 11. SEED VOCABULARY SETS & WORDS
  // ========================================================
  console.log('11. Seeding Vocabulary Sets & Words...');
  const vocabSets = [
    {
      title: '500 Từ Vựng Aptis B1 - B2 Cốt Lõi',
      category: 'B1-B2',
      words: [
        {
          word: 'Accommodate',
          phonetic: '/əˈkɑː.mə.deɪt/',
          meaning_vi: 'Cung cấp chỗ ở, đáp ứng nhu cầu',
          example_sentence: 'The hotel can accommodate up to five hundred guests.',
          cefr_level: 'B2',
        },
        {
          word: 'Comprehensive',
          phonetic: '/ˌkɑːm.prəˈhen.sɪv/',
          meaning_vi: 'Toàn diện, bao hàm nhiều mặt',
          example_sentence: 'We offer a comprehensive training program for all new staff.',
          cefr_level: 'B2',
        },
      ],
    },
    {
      title: '300 Từ Vựng Học Thuật Academic Aptis Band C',
      category: 'C1-C2',
      words: [
        {
          word: 'Equilibrium',
          phonetic: '/ˌiː.kwəˈlɪb.ri.əm/',
          meaning_vi: 'Trạng thái cân bằng, thế quân bình',
          example_sentence: 'Urban green parks help maintain neurological equilibrium in fast-paced cities.',
          cefr_level: 'C1',
        },
        {
          word: 'Unprecedented',
          phonetic: '/ʌnˈpres.ə.den.t̬ɪd/',
          meaning_vi: 'Chưa từng có tiền lệ',
          example_sentence: 'The project registered unprecedented cost efficiency over the past five years.',
          cefr_level: 'C1',
        },
      ],
    },
  ];

  for (const vSet of vocabSets) {
    const existing = await prisma.vocabSet.findFirst({ where: { title: vSet.title } });
    if (!existing) {
      await prisma.vocabSet.create({
        data: {
          title: vSet.title,
          category: vSet.category,
          total_words: vSet.words.length,
          words: {
            create: vSet.words,
          },
        },
      });
    }
  }

  // ========================================================
  // 12. SEED HISTORIC SUBMISSIONS (Tiến độ học tập & Lịch sử)
  // ========================================================
  console.log('12. Seeding Student Exam Submissions & Progress...');
  const firstGrammarExam = await prisma.exam.findFirst({
    where: { skill: ExamSkill.GRAMMAR_VOCABULARY },
  });

  if (firstGrammarExam) {
    const existingSubmission = await prisma.examSubmission.findFirst({
      where: { user_id: student.id, exam_id: firstGrammarExam.id },
    });

    if (!existingSubmission) {
      await prisma.examSubmission.create({
        data: {
          user_id: student.id,
          exam_id: firstGrammarExam.id,
          status: SubmissionStatus.GRADED,
          grammar_score: 46.0,
          total_score: 46.0,
          cefr_level: 'B2',
          teacher_feedback: 'Làm bài xuất sắc, nắm chắc cấu trúc ngữ pháp điều kiện và đảo ngữ.',
          started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 22 * 60 * 1000),
          deadline_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000),
        },
      });
    }
  }

  const firstListeningExam = await prisma.exam.findFirst({
    where: { skill: ExamSkill.LISTENING },
  });

  if (firstListeningExam) {
    const existingSub = await prisma.examSubmission.findFirst({
      where: { user_id: student.id, exam_id: firstListeningExam.id },
    });

    if (!existingSub) {
      await prisma.examSubmission.create({
        data: {
          user_id: student.id,
          exam_id: firstListeningExam.id,
          status: SubmissionStatus.GRADED,
          listening_score: 44.0,
          total_score: 44.0,
          cefr_level: 'B2',
          teacher_feedback: 'Khả năng bóc tách từ khóa tốt.',
          started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
          deadline_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000),
        },
      });
    }
  }

  console.log(`Seeded Core Users: Admin (${admin.email}), Teacher (${teacher.email}), Student (${student.email})`);
  console.log('=== MASTER DATABASE SEEDING COMPLETED SUCCESSFULLY ===');
}

main()
  .catch((e) => {
    console.error('Seed execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
