/**
 * SEED SCRIPT: Bộ đề thi Listening chuẩn 100% Aptis Kỳ Tích
 * Cấu trúc chuẩn 4 Parts:
 * - Part 1: 13 câu hỏi ngắn nhận diện thông tin (Word Recognition) trắc nghiệm A, B, C (26 điểm)
 * - Part 2: 1 bài nghe nối thông tin 4 người nói (Speaker A, B, C, D) (8 điểm)
 * - Part 3: 1 bài đối thoại Nam - Nữ, 4 nhận định chọn Man / Woman / Both (8 điểm)
 * - Part 4: 2 bài độc thoại (Monologues), mỗi bài 2 câu hỏi A, B, C (8 điểm)
 * Tổng cộng: 25 câu hỏi tính điểm, thang điểm 50 điểm, thời gian 40 phút.
 */
import 'dotenv/config';
import { PrismaClient, ExamSkill, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING APTIS KY TICH LISTENING MODULE ---');

  const listeningExams = [
    {
      title: 'Đề 01 — Full Listening · 4 Parts',
      description: 'Hoàn thành tất cả 4 Part của kỹ năng Listening trong 40 phút (25 câu hỏi chuẩn Aptis ESOL).',
      duration_minutes: 40,
      is_pro: false,
      priority: 'HIGH',
      parts: [
        // PART 1: 13 Short Questions (26 điểm)
        {
          part_number: 1,
          title: 'Part 1 – Word Recognition',
          instructions: 'Listen to the short recording and answer the question. You can listen twice.',
          passage_text: 'Short Announcements and Conversations',
          questions: [
            {
              question_number: 1,
              prompt: 'A person calls a friend about his new car. How much does the small car cost him?',
              options: ['3250 pounds', '3550 pounds', '4250 pounds'],
              correct_answer: '3250 pounds',
              explanation: 'The speaker states clearly that the small car was purchased for 3250 pounds.',
            },
            {
              question_number: 2,
              prompt: 'Listen to a woman talking about her holiday. Where is she going?',
              options: ['To the mountains', 'To the seaside', 'To an ancient city'],
              correct_answer: 'To the seaside',
              explanation: 'She mentions relaxing on the sunny coast and swimming in the sea.',
            },
            {
              question_number: 3,
              prompt: 'A man is ordering food at a cafe. What beverage does he order?',
              options: ['Iced Americano', 'Hot green tea', 'Fresh orange juice'],
              correct_answer: 'Iced Americano',
              explanation: 'He asks for a large cup of iced Americano with no sugar.',
            },
            {
              question_number: 4,
              prompt: 'Listen to the airport announcement. Which gate should passengers for Flight BA204 go to?',
              options: ['Gate 12B', 'Gate 14A', 'Gate 24C'],
              correct_answer: 'Gate 14A',
              explanation: 'The announcer directs BA204 passengers immediately to Gate 14A.',
            },
            {
              question_number: 5,
              prompt: 'What time will the library seminar begin tomorrow?',
              options: ['9:15 AM', '9:45 AM', '10:30 AM'],
              correct_answer: '9:45 AM',
              explanation: 'The librarian confirms the opening address starts at quarter to ten (9:45 AM).',
            },
            {
              question_number: 6,
              prompt: 'A customer is asking for directions in a shopping mall. Where is the bookstore located?',
              options: ['On the ground floor', 'On the second floor next to the cinema', 'In the basement'],
              correct_answer: 'On the second floor next to the cinema',
              explanation: 'Directions indicate taking the escalator up to the 2nd floor near the cinema.',
            },
            {
              question_number: 7,
              prompt: 'Listen to the weather forecast. What will the weather be like on Sunday afternoon?',
              options: ['Heavy thunderstorms', 'Sunny with mild breezes', 'Cloudy and misty'],
              correct_answer: 'Sunny with mild breezes',
              explanation: 'The meteorologist predicts warm sunshine and gentle breeze across the region.',
            },
            {
              question_number: 8,
              prompt: 'Why did the student miss the morning chemistry lecture?',
              options: ['His bicycle had a flat tire', 'He overslept', 'The train was canceled'],
              correct_answer: 'The train was canceled',
              explanation: 'The student explains that his regular morning train was abruptly canceled.',
            },
            {
              question_number: 9,
              prompt: 'How much is the discounted admission ticket for university students?',
              options: ['8 dollars', '12 dollars', '15 dollars'],
              correct_answer: '8 dollars',
              explanation: 'The museum counter informs students pay only 8 dollars with a valid ID.',
            },
            {
              question_number: 10,
              prompt: 'Which sport class has been rescheduled to Thursday evening?',
              options: ['Yoga', 'Pilates', 'Indoor tennis'],
              correct_answer: 'Yoga',
              explanation: 'The fitness club notice confirms the beginner yoga session moves to Thursday.',
            },
            {
              question_number: 11,
              prompt: 'What gift did David receive from his colleagues for his promotion?',
              options: ['A leather briefcase', 'A fountain pen', 'A smart watch'],
              correct_answer: 'A fountain pen',
              explanation: 'David expresses gratitude for the engraved fountain pen.',
            },
            {
              question_number: 12,
              prompt: 'Listen to the phone message. What is the doctor appointment date?',
              options: ['October 12th', 'October 15th', 'October 20th'],
              correct_answer: 'October 15th',
              explanation: 'The receptionist books the consultation for Thursday, October 15th.',
            },
            {
              question_number: 13,
              prompt: 'What did the woman leave behind in the taxi cab?',
              options: ['Her sunglasses', 'Her black handbag', 'Her umbrella'],
              correct_answer: 'Her black handbag',
              explanation: 'She calls the taxi hotline inquiring about a black leather handbag.',
            },
          ],
        },

        // PART 2: Matching Information (4 Speakers -> 4 dropdowns = 8 điểm)
        {
          part_number: 2,
          title: 'Part 2 – Matching Information',
          instructions: 'Four people are talking about their exercise preferences. Match each person to the correct information.',
          passage_text: 'Four speakers discussing their favorite physical activities and workout schedules.',
          questions: [
            {
              question_number: 1,
              prompt: 'Speaker A ...',
              options: [
                'Prefers early morning outdoor jogging in local parks',
                'Enjoys competitive weekend team sports with colleagues',
                'Works out with personal trainers in a high-tech gym',
                'Practices gentle yoga and meditation at home',
                'Does swimming regularly to recover from joint injuries',
              ],
              correct_answer: 'Prefers early morning outdoor jogging in local parks',
              explanation: 'Speaker A talks about waking up at 6 AM to run in the park nearby.',
            },
            {
              question_number: 2,
              prompt: 'Speaker B ...',
              options: [
                'Prefers early morning outdoor jogging in local parks',
                'Enjoys competitive weekend team sports with colleagues',
                'Works out with personal trainers in a high-tech gym',
                'Practices gentle yoga and meditation at home',
                'Does swimming regularly to recover from joint injuries',
              ],
              correct_answer: 'Enjoys competitive weekend team sports with colleagues',
              explanation: 'Speaker B loves joining amateur basketball tournaments on Saturdays.',
            },
            {
              question_number: 3,
              prompt: 'Speaker C ...',
              options: [
                'Prefers early morning outdoor jogging in local parks',
                'Enjoys competitive weekend team sports with colleagues',
                'Works out with personal trainers in a high-tech gym',
                'Practices gentle yoga and meditation at home',
                'Does swimming regularly to recover from joint injuries',
              ],
              correct_answer: 'Works out with personal trainers in a high-tech gym',
              explanation: 'Speaker C values structured weight training and customized gym routines.',
            },
            {
              question_number: 4,
              prompt: 'Speaker D ...',
              options: [
                'Prefers early morning outdoor jogging in local parks',
                'Enjoys competitive weekend team sports with colleagues',
                'Works out with personal trainers in a high-tech gym',
                'Practices gentle yoga and meditation at home',
                'Does swimming regularly to recover from joint injuries',
              ],
              correct_answer: 'Practices gentle yoga and meditation at home',
              explanation: 'Speaker D prefers quiet mindfulness, stretching, and breathing exercises at home.',
            },
          ],
        },

        // PART 3: Short Conversations (4 Opinions -> Man / Woman / Both = 8 điểm)
        {
          part_number: 3,
          title: 'Part 3 – Short Conversations',
          instructions: 'Listen to the conversation between a man and a woman about the Internet and answer who expresses each opinion.',
          passage_text: 'Topic: There is too much information on the Internet. Who expresses which opinion?',
          questions: [
            {
              question_number: 1,
              prompt: '1. There is too much information on the Internet',
              options: ['Man', 'Woman', 'Both'],
              correct_answer: 'Both',
              explanation: 'Both speakers agree that information overload is a widespread digital challenge.',
            },
            {
              question_number: 2,
              prompt: '2. Finding information on the Internet requires skills',
              options: ['Man', 'Woman', 'Both'],
              correct_answer: 'Woman',
              explanation: 'The woman emphasizes the necessity of critical thinking and filtering tools.',
            },
            {
              question_number: 3,
              prompt: '3. The use of the Internet affects the way we think.',
              options: ['Man', 'Woman', 'Both'],
              correct_answer: 'Man',
              explanation: 'The man references neuroscientific studies on shortened attention spans.',
            },
            {
              question_number: 4,
              prompt: '4. The Internet makes young people less patient.',
              options: ['Man', 'Woman', 'Both'],
              correct_answer: 'Woman',
              explanation: 'The woman argues that instant gratification reduces patience among teenagers.',
            },
          ],
        },

        // PART 4: Monologues (2 recordings x 2 questions = 4 questions = 8 điểm)
        {
          part_number: 4,
          title: 'Part 4 – Monologues',
          instructions: 'Listen to two monologues. For each recording, answer the two questions.',
          passage_text: 'Recording 1: A book review of a prominent author new novel.',
          questions: [
            {
              question_number: 1,
              prompt: '1. What does the announcer say about the new novel?',
              options: [
                'It is different from his earlier works',
                'It is romantic and soft',
                'It is less famous than his earlier works',
              ],
              correct_answer: 'It is different from his earlier works',
              explanation: 'The critic highlights a bold thematic departure from the author previous style.',
            },
            {
              question_number: 2,
              prompt: '2. What does the announcer say the writer should do in the future?',
              options: [
                'The writer should continue to write this genre',
                'The writer should go back to his original genre',
                'He should listen to critics before writing his next work',
              ],
              correct_answer: 'The writer should continue to write this genre',
              explanation: 'The reviewer strongly encourages further exploration of this innovative narrative approach.',
            },
            {
              question_number: 3,
              prompt: '3. What inspired the architect to design the eco-friendly museum?',
              options: [
                'Ancient subterranean structures',
                'Modern urban glass towers',
                'Natural light and organic tree foliage',
              ],
              correct_answer: 'Natural light and organic tree foliage',
              explanation: 'The architect mentions biomimicry and sunlight filtering through leaves.',
            },
            {
              question_number: 4,
              prompt: '4. What challenge did the construction team encounter during building?',
              options: [
                'Budgetary constraints and material delays',
                'Extremely adverse winter frost',
                'Opposition from historical preservation societies',
              ],
              correct_answer: 'Budgetary constraints and material delays',
              explanation: 'The project suffered severe delays due to imported sustainable materials.',
            },
          ],
        },
      ],
    },
    {
      title: 'Đề 02 — Full Listening · 4 Parts',
      description: 'Luyện tập kỹ năng nghe Aptis với các bài đàm thoại công sở, công nghệ số và phỏng vấn chuyên gia.',
      duration_minutes: 40,
      is_pro: false,
      priority: 'HIGH',
      parts: [
        // PART 1: 13 Short Questions (26 điểm)
        {
          part_number: 1,
          title: 'Part 1 – Word Recognition',
          instructions: 'Listen to the short recording and answer the question. You can listen twice.',
          passage_text: 'Short Announcements and Daily Conversations',
          questions: [
            {
              question_number: 1,
              prompt: 'A commuter is checking the train schedule. What time does the express train to Manchester depart?',
              options: ['8:15 AM', '8:45 AM', '9:15 AM'],
              correct_answer: '8:45 AM',
              explanation: 'The station display announces the direct express leaves at 8:45 AM from Platform 3.',
            },
            {
              question_number: 2,
              prompt: 'Listen to a receptionist at a dental clinic. When is the patient next appointment?',
              options: ['Tuesday afternoon', 'Thursday morning', 'Friday evening'],
              correct_answer: 'Thursday morning',
              explanation: 'The receptionist confirms Thursday at 10:30 AM is available.',
            },
            {
              question_number: 3,
              prompt: 'A man is calling customer support about a package delivery. What is his tracking number suffix?',
              options: ['UK992', 'UK882', 'UK772'],
              correct_answer: 'UK882',
              explanation: 'He clearly reads out the parcel reference code ending in UK882.',
            },
            {
              question_number: 4,
              prompt: 'Listen to the museum guide announcement. What floor is the impressionist art gallery located on?',
              options: ['Ground floor', 'Second floor', 'Third floor'],
              correct_answer: 'Second floor',
              explanation: 'Visitors are instructed to take the stairs to the second floor for the impressionist exhibition.',
            },
            {
              question_number: 5,
              prompt: 'A customer is ordering a lunch meal. Which dessert does the customer choose?',
              options: ['Lemon cheesecake', 'Apple pie with cream', 'Chocolate mousse'],
              correct_answer: 'Lemon cheesecake',
              explanation: 'The customer specifically selects the fresh lemon cheesecake slice.',
            },
            {
              question_number: 6,
              prompt: 'Listen to the hotel clerk. What time does complimentary room service breakfast conclude?',
              options: ['9:30 AM', '10:00 AM', '10:30 AM'],
              correct_answer: '10:30 AM',
              explanation: 'The clerk states breakfast buffet runs until 10:30 AM daily.',
            },
            {
              question_number: 7,
              prompt: 'A colleague calls about reserving a conference room. Which room has the video projector?',
              options: ['Room 101', 'Room 204', 'Room 305'],
              correct_answer: 'Room 204',
              explanation: 'Conference room 204 is equipped with dual interactive video projectors.',
            },
            {
              question_number: 8,
              prompt: 'Listen to the weather forecast. What should residents carry tomorrow afternoon?',
              options: ['Sunglasses', 'An umbrella', 'Heavy winter coat'],
              correct_answer: 'An umbrella',
              explanation: 'Sudden rain showers and thunderstorms are expected across the afternoon.',
            },
            {
              question_number: 9,
              prompt: 'A woman is inquiring about fitness classes. What day does the beginner yoga class meet?',
              options: ['Monday evening', 'Wednesday evening', 'Saturday morning'],
              correct_answer: 'Wednesday evening',
              explanation: 'The fitness coordinator notes yoga meets every Wednesday at 6:00 PM.',
            },
            {
              question_number: 10,
              prompt: 'Listen to the flight attendant. What is the expected flight duration to Tokyo?',
              options: ['9 hours 30 minutes', '11 hours 15 minutes', '12 hours 45 minutes'],
              correct_answer: '11 hours 15 minutes',
              explanation: 'The captain estimates a cruising flight time of eleven hours and fifteen minutes.',
            },
            {
              question_number: 11,
              prompt: 'A shopper is asking about shoe sizes. What color sneakers are in stock in size 9?',
              options: ['Navy blue', 'All black', 'White and red'],
              correct_answer: 'All black',
              explanation: 'The salesperson checks inventory and confirms only the all-black pair remains.',
            },
            {
              question_number: 12,
              prompt: 'Listen to the bookstore manager. How much discount is offered on academic textbooks today?',
              options: ['15 percent', '20 percent', '25 percent'],
              correct_answer: '20 percent',
              explanation: 'Students receive an immediate twenty percent discount upon presenting their student card.',
            },
            {
              question_number: 13,
              prompt: 'A tenant speaks to a building landlord. When will the plumbing maintenance team arrive?',
              options: ['This afternoon at 2 PM', 'Tomorrow morning at 9 AM', 'Friday afternoon at 4 PM'],
              correct_answer: 'Tomorrow morning at 9 AM',
              explanation: 'The plumber is scheduled for tomorrow morning prompt at 9 AM.',
            },
          ],
        },

        // PART 2: Information Matching (4 speakers = 8 điểm)
        {
          part_number: 2,
          title: 'Part 2 – Information Matching',
          instructions: 'Four people are talking about their career transitions and work lifestyles. Match each speaker (A, B, C, D) to the opinion that best reflects what they say.',
          passage_text: 'Four professionals discuss navigating new career pathways.',
          questions: [
            {
              question_number: 1,
              prompt: 'Speaker A: Changing careers requires building transferable technical skills first.',
              options: ['Speaker A', 'Speaker B', 'Speaker C', 'Speaker D'],
              correct_answer: 'Speaker A',
              explanation: 'Speaker A underscores that learning data analytics and coding facilitated his career shift.',
            },
            {
              question_number: 2,
              prompt: 'Speaker B: Flexible remote working allows better balance for raising young children.',
              options: ['Speaker A', 'Speaker B', 'Speaker C', 'Speaker D'],
              correct_answer: 'Speaker B',
              explanation: 'Speaker B highlights working from home enables attending school events without missing deadlines.',
            },
            {
              question_number: 3,
              prompt: 'Speaker C: Starting a freelance consulting business brings high financial uncertainty initially.',
              options: ['Speaker A', 'Speaker B', 'Speaker C', 'Speaker D'],
              correct_answer: 'Speaker C',
              explanation: 'Speaker C recounts the initial stress of irregular monthly revenue during the first year.',
            },
            {
              question_number: 4,
              prompt: 'Speaker D: Continuous mentorship from experienced senior colleagues is invaluable.',
              options: ['Speaker A', 'Speaker B', 'Speaker C', 'Speaker D'],
              correct_answer: 'Speaker D',
              explanation: 'Speaker D emphasizes how a dedicated industry mentor shaped her leadership abilities.',
            },
          ],
        },

        // PART 3: Dialogue Opinion (4 questions = 8 điểm)
        {
          part_number: 3,
          title: 'Part 3 – Discussion Opinion',
          instructions: 'Listen to a discussion between a man and a woman about Artificial Intelligence in education. For each statement, choose whether the opinion is expressed by the Man, the Woman, or Both.',
          passage_text: 'Dialogue: Two teachers discuss adopting generative AI in secondary school curriculum.',
          questions: [
            {
              question_number: 1,
              prompt: '1. AI tutors can provide helpful individualized pacing for struggling pupils.',
              options: ['Man', 'Woman', 'Both'],
              correct_answer: 'Both',
              explanation: 'Both educators acknowledge that customized diagnostic practice aids slower learners.',
            },
            {
              question_number: 2,
              prompt: '2. Over-reliance on AI algorithms diminishes critical writing and thinking skills.',
              options: ['Man', 'Woman', 'Both'],
              correct_answer: 'Woman',
              explanation: 'The woman raises strong concerns that automated essays discourage genuine student reflection.',
            },
            {
              question_number: 3,
              prompt: '3. Schools need clear ethical guidelines and training before implementing AI tools.',
              options: ['Man', 'Woman', 'Both'],
              correct_answer: 'Man',
              explanation: 'The man stresses institutional policy, cybersecurity, and staff workshops must precede deployment.',
            },
            {
              question_number: 4,
              prompt: '4. Human mentorship and emotional encouragement cannot be replaced by machines.',
              options: ['Man', 'Woman', 'Both'],
              correct_answer: 'Both',
              explanation: 'Both speakers agree emphatically that empathy and moral character development require human teachers.',
            },
          ],
        },

        // PART 4: Monologues (2 monologues x 2 questions = 4 questions = 8 điểm)
        {
          part_number: 4,
          title: 'Part 4 – Monologues',
          instructions: 'Listen to two monologues. For each recording, answer the two questions.',
          passage_text: 'Monologue 1: Architectural innovation in sustainable skyscrapers. Monologue 2: Marine research on coral reef protection.',
          questions: [
            {
              question_number: 1,
              prompt: '1. What primary architectural feature helps modern green towers reduce energy consumption?',
              options: [
                'Reflective double-glazed glass facades',
                'Deep geothermal underground cooling tunnels',
                'Vertical gardens that naturally insulate walls',
              ],
              correct_answer: 'Reflective double-glazed glass facades',
              explanation: 'The architect notes smart double glazing blocks solar heat while maximizing daylight.',
            },
            {
              question_number: 2,
              prompt: '2. What obstacle did the engineering firm face during construction in the city center?',
              options: [
                'Strict municipal noise ordinances during daytime',
                'Unstable subterranean bedrock requiring extra reinforcement',
                'Scarcity of certified recycled steel materials',
              ],
              correct_answer: 'Unstable subterranean bedrock requiring extra reinforcement',
              explanation: 'Excavation revealed soft soil layers necessitating deep foundation piling.',
            },
            {
              question_number: 3,
              prompt: '3. What has catalyzed the rapid bleaching of shallow coral reefs in the Pacific?',
              options: [
                'Elevated ocean water temperatures during prolonged summers',
                'Agricultural fertilizer runoff from inland rivers',
                'Commercial overfishing of herbivorous fish species',
              ],
              correct_answer: 'Elevated ocean water temperatures during prolonged summers',
              explanation: 'The marine biologist highlights thermal stress causing symbiotic algae expulsion.',
            },
            {
              question_number: 4,
              prompt: '4. What solution does the marine research institute currently deploy with local coastal communities?',
              options: [
                'Submerged artificial 3D-printed ceramic nursery reefs',
                'Complete legal bans on all regional maritime transport',
                'Genetic modification of coastal mangrove forests',
              ],
              correct_answer: 'Submerged artificial 3D-printed ceramic nursery reefs',
              explanation: 'Local divers assist in seeding heat-tolerant coral fragments onto ceramic nursery structures.',
            },
          ],
        },
      ],
    },
    {
      title: 'Đề 03 — Full Listening · 4 Parts',
      description: 'Bộ đề nâng cao tăng tốc kỹ năng nhận diện giọng điệu và bẫy phát âm thường gặp.',
      duration_minutes: 40,
      is_pro: false,
      priority: 'HIGH',
      parts: [],
    },
    {
      title: 'Đề 04 — Full Listening · 4 Parts',
      description: 'Đề thi VIP dự đoán trúng tủ dành riêng cho thành viên gói Pro.',
      duration_minutes: 40,
      is_pro: true,
      priority: 'HIGH',
      parts: [],
    },
    {
      title: 'Đề 05 — Full Listening · 4 Parts',
      description: 'Tổng hợp các chủ đề nghe học thuật và phỏng vấn văn hóa.',
      duration_minutes: 40,
      is_pro: true,
      priority: 'HIGH',
      parts: [],
    },
  ];

  for (const item of listeningExams) {
    let exam = await prisma.exam.findFirst({ where: { title: item.title } });
    if (exam) {
      if (item.parts.length > 0) {
        await prisma.examPart.deleteMany({ where: { exam_id: exam.id } });
      }
      await prisma.exam.update({
        where: { id: exam.id },
        data: {
          description: item.description,
          duration_minutes: item.duration_minutes,
          skill: ExamSkill.LISTENING,
          is_pro: item.is_pro,
          is_published: true,
        },
      });
    } else {
      exam = await prisma.exam.create({
        data: {
          title: item.title,
          description: item.description,
          skill: ExamSkill.LISTENING,
          duration_minutes: item.duration_minutes,
          is_pro: item.is_pro,
          is_published: true,
          source: 'WEB',
        },
      });
    }

    if (item.parts.length > 0) {
      for (const p of item.parts) {
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
              question_type: QuestionType.MULTIPLE_CHOICE,
              prompt: q.prompt,
              options: JSON.stringify(q.options),
              correct_answer: q.correct_answer,
              explanation: q.explanation,
              max_score: 2.0,
            },
          });
        }
      }
    }

    console.log(`Processed: ${item.title}`);
  }

  console.log('Listening seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
