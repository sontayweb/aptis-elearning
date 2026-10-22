// Speaking Part 1 Authentic Question Bank
// Extracted from SPEAKING/Tổng hợp đề part 1.docx

export interface SpeakingPart1QuestionItem {
  id: string;
  qLabel?: string;
  prompt: string;
  sampleAnswer?: string;
}

export interface SpeakingPart1Unit {
  id: string;
  title: string;
  goal?: string;
  questions: SpeakingPart1QuestionItem[];
}

export const SPEAKING_PART1_UNITS: SpeakingPart1Unit[] = [
  {
    "id": "unit_intro",
    "title": "Đề 01",
    "goal": "Làm quen phản xạ trả lời ngắn 30s các chủ đề quen thuộc",
    "questions": [
      {
        "id": "q_intro_1",
        "qLabel": "Starter Question 01",
        "prompt": "Please tell me about your family.: “I come from… encourage me to do my best”",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_2",
        "qLabel": "Starter Question 02",
        "prompt": "Describe a member of your family. “ I'd like to talk about my mother. She is….”",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_3",
        "qLabel": "Starter Question 03",
        "prompt": "What is the city you live in?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_4",
        "qLabel": "Starter Question 04",
        "prompt": "What is your village/town/city like?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_5",
        "qLabel": "Starter Question 05",
        "prompt": "Describe the room you are in.",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_6",
        "qLabel": "Starter Question 06",
        "prompt": "Describe the place you are in.",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_7",
        "qLabel": "Starter Question 07",
        "prompt": "Would you like to live in the countryside?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_8",
        "qLabel": "Starter Question 08",
        "prompt": "Would you like to live in the countryside?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_9",
        "qLabel": "Starter Question 09",
        "prompt": "Describe the room you are in./ Describe the place you are in.",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_10",
        "qLabel": "Starter Question 010",
        "prompt": "Please tell me about a famous place in your country.",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_11",
        "qLabel": "Starter Question 011",
        "prompt": "Which place should people visit in your country?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_12",
        "qLabel": "Starter Question 012",
        "prompt": "Which is the best way to travel around your country?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_13",
        "qLabel": "Starter Question 013",
        "prompt": "Please tell me about a famous place in your country./ Which place should people visit in your country?/ Tell me about a scenic spot in your country.",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_14",
        "qLabel": "Starter Question 014",
        "prompt": "Which is the best way to travel around your country?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_15",
        "qLabel": "Starter Question 015",
        "prompt": "What is your favorite film? Why?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_16",
        "qLabel": "Starter Question 016",
        "prompt": "Please tell me about your favorite film star/singer.",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_17",
        "qLabel": "Starter Question 017",
        "prompt": "What's your favorite music?/ What’s your favorite kind of music?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_18",
        "qLabel": "Starter Question 018",
        "prompt": "Please tell me about the last thing you saw on television.",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_19",
        "qLabel": "Starter Question 019",
        "prompt": "Can you play a musical instrument?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_20",
        "qLabel": "Starter Question 020",
        "prompt": "What do you like to do in your free time?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_21",
        "qLabel": "Starter Question 021",
        "prompt": "How do you relax in the evening?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_22",
        "qLabel": "Starter Question 022",
        "prompt": "Please tell me what you do on the weekend.",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_23",
        "qLabel": "Starter Question 023",
        "prompt": "What activities do you usually do with your friends?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_24",
        "qLabel": "Starter Question 024",
        "prompt": "What do you like doing with your friends?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_25",
        "qLabel": "Starter Question 025",
        "prompt": "Tell me about your hobby./ What do you like to do in your free time?/How do you relax in the evening?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_26",
        "qLabel": "Starter Question 026",
        "prompt": "Please tell me what you do on the weekend./ What activities do you usually do with your friends? What do you like doing with your friends?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_27",
        "qLabel": "Starter Question 027",
        "prompt": "What is the food like in your country?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_28",
        "qLabel": "Starter Question 028",
        "prompt": "What food do you like?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_29",
        "qLabel": "Starter Question 029",
        "prompt": "Can you describe your favorite dish?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_30",
        "qLabel": "Starter Question 030",
        "prompt": "Which dish is your favorite to cook?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_31",
        "qLabel": "Starter Question 031",
        "prompt": "What is the food like in your country?/ Can you describe your favorite dish?/ What food do you like?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_32",
        "qLabel": "Starter Question 032",
        "prompt": "Which dish is your favorite to cook?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_33",
        "qLabel": "Starter Question 033",
        "prompt": "What's your favorite season? Why?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_34",
        "qLabel": "Starter Question 034",
        "prompt": "Do you like walking?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_35",
        "qLabel": "Starter Question 035",
        "prompt": "What sports do people in your country like?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_36",
        "qLabel": "Starter Question 036",
        "prompt": "What sports do you like?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_37",
        "qLabel": "Starter Question 037",
        "prompt": "What sports do you like?/ What sports do people in your country like?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_38",
        "qLabel": "Starter Question 038",
        "prompt": "Do you like walking?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_39",
        "qLabel": "Starter Question 039",
        "prompt": "Tell me about your country’s weather./ What's your favorite season? Why?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_40",
        "qLabel": "Starter Question 040",
        "prompt": "Describe your typical day.",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_41",
        "qLabel": "Starter Question 041",
        "prompt": "What are you doing for the rest of today?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_42",
        "qLabel": "Starter Question 042",
        "prompt": "What will you do next weekend?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_43",
        "qLabel": "Starter Question 043",
        "prompt": "Will you go on holiday next summer?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_44",
        "qLabel": "Starter Question 044",
        "prompt": "Describe something you are planning to do in the future.",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_45",
        "qLabel": "Starter Question 045",
        "prompt": "Describe your typical day./ What are you doing for the rest of today?",
        "sampleAnswer": ""
      },
      {
        "id": "q_intro_46",
        "qLabel": "Starter Question 046",
        "prompt": "Describe the way you went to the exam room.",
        "sampleAnswer": ""
      }
    ]
  },
  {
    "id": "unit_2",
    "title": "Đề 02",
    "goal": "Giới thiệu bản thân, gia đình, bạn bè và thói quen bằng ngôn ngữ linh hoạt.",
    "questions": [
      {
        "id": "q_2_1",
        "qLabel": "QUESTION 1",
        "prompt": "Please tell me about yourself.",
        "sampleAnswer": "I would describe myself as responsible, open-minded, and willing to learn from experience. Most of my time is devoted to daily responsibilities, but I still try to maintain a healthy balance. When I am free, I enjoy listening to music, meeting friends, or taking a short walk to clear my mind. Although I can seem quiet at first, I become more sociable once I feel comfortable. Looking ahead, I hope to gain valuable experience and become more confident in different situations."
      },
      {
        "id": "q_2_2",
        "qLabel": "QUESTION 2",
        "prompt": "Please tell me about your family. Tell me about a member of your family.",
        "sampleAnswer": "I come from a small, close-knit family, and we have always supported one another. Even though everyone has different responsibilities, we make an effort to spend quality time together, especially at weekends and on special occasions. We often share meals, talk about our week, and help each other deal with everyday problems. What I value most is the sense of security my family gives me. We do not agree on everything, but mutual respect keeps our relationship strong."
      },
      {
        "id": "q_2_3",
        "qLabel": "QUESTION 4",
        "prompt": "Tell me about one of your close friends.",
        "sampleAnswer": "A close friend of mine is someone I met through a shared activity several years ago. We gradually became friends because we have similar values and enjoy many of the same things. They are reliable, thoughtful, and have a great sense of humour, so I feel comfortable discussing both good news and personal concerns. Although our schedules can be busy, we keep in touch regularly. I value this friendship because we encourage each other and offer honest support when it is needed."
      },
      {
        "id": "q_2_4",
        "qLabel": "QUESTION 5",
        "prompt": "What do you do?",
        "sampleAnswer": "At present, I am mainly focused on work, further learning, and personal responsibilities. My daily tasks usually require me to organise information, communicate with other people, and solve practical problems. The routine can be demanding; nevertheless, it gives me opportunities to develop useful skills and gain hands-on experience. What I find most rewarding is seeing clear progress after consistent effort. Overall, this stage of my life is helping me become more capable and prepare for greater responsibilities in the future."
      },
      {
        "id": "q_2_5",
        "qLabel": "QUESTION 6",
        "prompt": "Please describe your typical day.",
        "sampleAnswer": "On a typical weekday, I start fairly early because I prefer having enough time to prepare without rushing. During the morning and afternoon, I concentrate on my main responsibilities, which take up most of the day. I plan my schedule carefully so that I can stay productive without feeling overwhelmed. In the evening, I have dinner, take a short break, and finish anything that still needs attention. The routine is quite predictable, but it helps me lead a balanced and organised life."
      }
    ]
  },
  {
    "id": "unit_3",
    "title": "Đề 03",
    "goal": "Mô tả thói quen, thời gian rảnh và cảm xúc bằng các chi tiết cụ thể.",
    "questions": [
      {
        "id": "q_3_1",
        "qLabel": "QUESTION 7",
        "prompt": "What do you like doing in your free time?",
        "sampleAnswer": "Free time gives me a chance to relax and restore my energy after a busy day. I often listen to music because it helps me unwind and put daily pressure aside for a while. I also enjoy reading, taking short walks, or watching an interesting film. When I have a longer break, I sometimes try a new recipe or learn a practical skill online. These simple activities are affordable, enjoyable, and help me use my free time in a meaningful way."
      },
      {
        "id": "q_3_2",
        "qLabel": "QUESTION 8",
        "prompt": "What do you like doing with your friends?",
        "sampleAnswer": "What I enjoy most with my friends is having enough time to talk and catch up properly. We often meet at a quiet café, share a meal, or take a walk when the weather is pleasant. Occasionally, we watch a film or join an outdoor activity together. The activity itself is less important than the chance to exchange ideas and support one another. Spending time with close friends usually lifts my mood and strengthens the bond we have built over time."
      },
      {
        "id": "q_3_3",
        "qLabel": "QUESTION 9",
        "prompt": "What did you do last night?",
        "sampleAnswer": "Yesterday evening was productive, but I still made time to relax. After dinner, I completed a few unfinished tasks and prepared what I needed for the following day. Once everything was organised, I listened to a podcast and watched a short programme to switch off. I also replied to several messages that I had not had time to answer earlier. By the time I went to bed, I felt satisfied because I had used the evening effectively without staying up too late."
      },
      {
        "id": "q_3_4",
        "qLabel": "QUESTION 10",
        "prompt": "What did you do last weekend?",
        "sampleAnswer": "I had a refreshing weekend that included both social time and rest. On Saturday, I met a few friends, and we spent several hours talking and exploring a place we had not visited before. Sunday was quieter, so I stayed at home, completed some household tasks, and read for a while. I also planned the week ahead, which made me feel more organised. The break helped me recharge my batteries while still taking care of several personal responsibilities."
      },
      {
        "id": "q_3_5",
        "qLabel": "QUESTION 11",
        "prompt": "When do you usually feel tired? When do you usually feel stressed?",
        "sampleAnswer": "I notice that I feel most tired after a particularly busy day or when I have been concentrating for hours without a proper break. A lack of sleep affects me as well, especially if I stay up late for several nights in a row. At those times, it becomes harder to focus and work efficiently. To recover, I rest briefly, drink enough water, and go to bed earlier. Since adopting a more consistent routine, I have noticed a clear improvement in my energy levels."
      }
    ]
  },
  {
    "id": "unit_4",
    "title": "Đề 04",
    "goal": "Kể lại trải nghiệm trong quá khứ với trình tự rõ ràng và cảm xúc phù hợp.",
    "questions": [
      {
        "id": "q_4_1",
        "qLabel": "QUESTION 13",
        "prompt": "Please tell me about one of your good memories.",
        "sampleAnswer": "A memory I genuinely treasure is a short family trip from several years ago. It was unusual for everyone to be free at the same time, which made the experience especially meaningful. We visited a few attractive places, tried local food, and captured many special moments in photographs. The clearest memory is the relaxed atmosphere and the long conversations we had during the journey. Although the trip was simple rather than luxurious, it brought us closer and still makes me smile whenever I think about it."
      },
      {
        "id": "q_4_2",
        "qLabel": "QUESTION 14",
        "prompt": "Tell me about the last time you went to the cinema.",
        "sampleAnswer": "A few weeks ago, I went to the cinema with a close friend to watch a light-hearted film. We chose it because we both wanted to unwind after a demanding week. Before the screening, we bought some snacks and discussed what we expected from the story. The plot was entertaining, and the acting was better than I had imagined. Afterwards, we talked about our favourite scenes on the way home. It was a simple outing, but it turned out to be well worth the time."
      },
      {
        "id": "q_4_3",
        "qLabel": "QUESTION 15",
        "prompt": "Please tell me about your first school.",
        "sampleAnswer": "I attended a small primary school that was within walking distance of my home. The buildings were simple, but the classrooms felt bright and welcoming. I still remember several patient teachers who encouraged us to ask questions and take part in class. During break time, my classmates and I played games in the schoolyard and shared our snacks. That school gave me my first experience of learning as part of a community, so the memories remain vivid even after many years."
      },
      {
        "id": "q_4_4",
        "qLabel": "QUESTION 16",
        "prompt": "Describe your journey here today.",
        "sampleAnswer": "Getting here today was reasonably straightforward because I planned the journey in advance. I left home earlier than necessary to avoid heavy traffic and allow time for unexpected delays. On the way, I listened to calm music, which helped me settle my nerves and stay focused. The roads became busier near the centre, but I still arrived early enough to prepare. Leaving extra time was a sensible decision because it reduced my stress and gave me a more confident start."
      },
      {
        "id": "q_4_5",
        "qLabel": "QUESTION 17",
        "prompt": "Tell me about a special celebration you remember.",
        "sampleAnswer": "One celebration I remember clearly was a family gathering held after a relative reached an important milestone. Instead of arranging a formal event, we prepared a meal at home and invited a few relatives to join us. Everyone contributed something, which created a warm and cooperative atmosphere. I especially enjoyed hearing older family members share stories and advice. The occasion was memorable not because it was expensive, but because it recognised a meaningful achievement and gave us valuable time together."
      },
      {
        "id": "q_4_6",
        "qLabel": "QUESTION 18",
        "prompt": "Tell me about a useful skill you have learned.",
        "sampleAnswer": "Learning to manage my time effectively has been one of the most useful skills I have developed. In the past, I often tried to complete several tasks at once, which reduced the quality of my work. Gradually, I began setting priorities, creating realistic schedules, and taking short breaks between demanding activities. As a result, I now finish tasks more efficiently and feel less stressed. This skill has improved both my work and personal life, and I am sure it will remain valuable in the future."
      }
    ]
  },
  {
    "id": "unit_5",
    "title": "Đề 05",
    "goal": "Mô tả không gian và địa điểm, đồng thời giải thích lý do hoặc đánh giá cá nhân.",
    "questions": [
      {
        "id": "q_5_1",
        "qLabel": "QUESTION 19",
        "prompt": "Please describe the place where you live.",
        "sampleAnswer": "I live in a comfortable home that is well suited to my daily routine. It is not particularly large, but there is enough space for everyone to rest, work, and spend time together. My favourite area is the living room because it receives plenty of natural light and has a calm atmosphere. We have kept the decoration simple, which makes the space feel tidy rather than crowded. After a busy day, being at home gives me privacy and helps me relax completely."
      },
      {
        "id": "q_5_2",
        "qLabel": "QUESTION 20",
        "prompt": "Describe the room you are in.",
        "sampleAnswer": "At the moment, I am sitting in a quiet, well-lit room with several desks, comfortable chairs, and the equipment needed for the task. The furniture is arranged neatly, so people can move around without difficulty. The walls are painted in simple colours, and the temperature is comfortable enough for everyone to concentrate. Although the atmosphere feels slightly serious, the room is organised and free from unnecessary distractions. That makes it easier for me to stay focused and perform to the best of my ability."
      },
      {
        "id": "q_5_3",
        "qLabel": "QUESTION 21",
        "prompt": "Please describe your neighbourhood.",
        "sampleAnswer": "The area where I live is convenient because most everyday services are within easy reach. There are small shops, cafés, and useful public facilities nearby, so residents do not need to travel far for basic needs. The streets can become crowded during peak hours, although they are usually much quieter in the evening. I also appreciate the friendly atmosphere and the way neighbours are willing to help one another. Its accessibility and sense of community make it a pleasant place to live."
      },
      {
        "id": "q_5_4",
        "qLabel": "QUESTION 22",
        "prompt": "Please describe your favourite place./ Please tell me about a famous place in your country.",
        "sampleAnswer": "Whenever I need a break from noise and daily pressure, I like visiting a peaceful outdoor area near my home. It has open space, fresh air, and enough seating for people to relax without feeling crowded. I usually go there to take a walk, sort out my thoughts, or have a quiet conversation with a friend. The slower pace helps me see things more clearly after a particularly busy period. Although the place is simple, I always leave feeling calmer, more energetic, and ready to concentrate again."
      },
      {
        "id": "q_5_5",
        "qLabel": "QUESTION 24",
        "prompt": "What is the best way to travel around your country?",
        "sampleAnswer": "There is no single form of transport that is best for every journey around my country. For short distances, travelling by car or motorbike can be convenient because it offers flexibility and makes stopping easy. For longer trips, trains or coaches are often more comfortable and allow passengers to rest. Flying saves time, although it usually costs more. Overall, combining different forms of transport is the most practical solution because it provides a reasonable balance between cost, comfort, convenience, and travel time."
      }
    ]
  },
  {
    "id": "unit_6",
    "title": "Đề 06",
    "goal": "Trình bày sở thích du lịch, phương tiện và kế hoạch trong tương lai.",
    "questions": [
      {
        "id": "q_6_1",
        "qLabel": "QUESTION 25",
        "prompt": "Why are you interested in travelling?",
        "sampleAnswer": "Travel appeals to me because it provides a break from my usual routine and introduces me to different ways of life. Visiting an unfamiliar place allows me to taste local food, observe new customs, and communicate with people from various backgrounds. It also teaches me to be more adaptable when plans change unexpectedly. Besides offering relaxation, travelling can expand my understanding and encourage me to view familiar problems differently. That combination of discovery and enjoyment makes it especially worthwhile."
      },
      {
        "id": "q_6_2",
        "qLabel": "QUESTION 26",
        "prompt": "What kind of holiday do you prefer?",
        "sampleAnswer": "My ideal holiday balances relaxation with a little exploration. Following a packed schedule every day can be exhausting, whereas doing nothing for an entire trip may become boring. I would prefer to visit a few local attractions, try regional food, and take photographs before enjoying a quiet evening. Flexible plans are important because they leave room for changes in the weather or unexpected discoveries. For me, a balanced itinerary is the best way to return home feeling refreshed rather than tired."
      },
      {
        "id": "q_6_3",
        "qLabel": "QUESTION 27",
        "prompt": "Tell me about the last trip you took.",
        "sampleAnswer": "My most recent trip was a short break with a few friends. We chose somewhere easy to reach, which meant we could spend more time enjoying the destination instead of travelling for hours. During the trip, we explored the local area, sampled several regional dishes, and took plenty of photographs. A few details did not go according to plan, but we adapted without difficulty. The journey gave me a welcome opportunity to switch off, reconnect with friends, and return home with renewed energy."
      },
      {
        "id": "q_6_4",
        "qLabel": "QUESTION 28",
        "prompt": "What outdoor activities do you enjoy?",
        "sampleAnswer": "I am keen on outdoor activities that are accessible, relaxing, and not overly competitive. Walking is probably my favourite because it requires no special equipment and can fit into almost any schedule. When I have more time, I also enjoy cycling or visiting a park with friends. These activities improve my mood and reduce the amount of time I spend looking at a screen. Even a short period outdoors helps me maintain a healthier lifestyle and improves my energy and concentration."
      },
      {
        "id": "q_6_5",
        "qLabel": "QUESTION 29",
        "prompt": "Where would you like to travel in the future?",
        "sampleAnswer": "One day, I would like to visit a destination that offers both cultural attractions and impressive natural scenery. Rather than choosing somewhere only because it is popular, I would look for a place with a distinctive local identity and a relaxed atmosphere. I would enjoy exploring traditional neighbourhoods, tasting authentic food, and learning how local people live. If possible, I would travel in a quieter season to avoid large crowds. The experience could deepen my understanding of the world and create lasting memories."
      },
      {
        "id": "q_6_6",
        "qLabel": "QUESTION 30",
        "prompt": "How do you usually travel on a normal day?",
        "sampleAnswer": "For everyday travel, I choose the form of transport that best suits the distance and conditions. I prefer walking to nearby places because it is free and provides gentle exercise. For longer journeys, I normally use public transport or travel by car, depending on the weather and traffic. Before leaving, I check the route and allow some extra time for delays. Planning ahead makes daily travel more efficient and helps me arrive punctually without feeling under unnecessary pressure."
      }
    ]
  },
  {
    "id": "unit_7",
    "title": "Đề 07",
    "goal": "Mô tả thời tiết, mùa và trang phục bằng từ ngữ tự nhiên.",
    "questions": [
      {
        "id": "q_7_1",
        "qLabel": "QUESTION 31",
        "prompt": "What is the weather like today?",
        "sampleAnswer": "Today has been fairly pleasant, with a comfortable temperature and plenty of natural light. The sky is slightly cloudy, but there has been no heavy rain, and a gentle breeze makes the air feel fresh. If the conditions remain stable, it will be a good day for walking or meeting someone outdoors. I enjoy this kind of mild weather because it allows people to follow their normal routine without having to deal with extreme heat, strong winds, or uncomfortable cold."
      },
      {
        "id": "q_7_2",
        "qLabel": "QUESTION 32",
        "prompt": "What is your favourite season?",
        "sampleAnswer": "Autumn is my favourite season because the temperatures are usually mild and the weather is relatively stable. I can spend time outdoors without feeling exhausted by intense heat or restricted by heavy rain. The air often feels fresher, and the surroundings become more attractive as the leaves begin to change colour. It is also easier to arrange activities with friends or family. The comfortable atmosphere gives me more energy and encourages me to spend more time outside and stay active."
      },
      {
        "id": "q_7_3",
        "qLabel": "QUESTION 33",
        "prompt": "What are you wearing today?",
        "sampleAnswer": "I have chosen a simple outfit today because it suits both the weather and the activities I have planned. I am wearing comfortable clothes in neutral colours, together with practical shoes in case I need to walk or stand for a long time. The outfit did not require much preparation, but it still looks neat and appropriate. Although appearance matters to some extent, comfort is my main priority on an ordinary day. Overall, I feel relaxed and confident in what I am wearing."
      },
      {
        "id": "q_7_4",
        "qLabel": "QUESTION 34",
        "prompt": "What do you like doing when the weather is good?",
        "sampleAnswer": "Fine weather encourages me to spend more time outdoors instead of staying inside all day. I may take a long walk, visit a park, or meet friends somewhere in the open air. Pleasant conditions also make photography and exploring unfamiliar parts of the local area more enjoyable. If I have household tasks to complete, I try to finish them early so that I can enjoy the sunshine while it lasts. Being outside in good weather almost always improves my mood and energy."
      },
      {
        "id": "q_7_5",
        "qLabel": "QUESTION 35",
        "prompt": "Do you prefer hot or cold weather?",
        "sampleAnswer": "Given the choice, I prefer cold weather to hot weather, although I am happiest when temperatures are cool rather than freezing. In very hot conditions, I become tired quickly and find it harder to concentrate, especially in the middle of the day. Lower temperatures make walking, working, and studying more manageable. Extreme cold can restrict outdoor activities, so mild conditions are ideal. Fresh air and some sunshine make it much easier to move around comfortably."
      },
      {
        "id": "q_7_6",
        "qLabel": "QUESTION 36",
        "prompt": "What do you usually do on a rainy day?",
        "sampleAnswer": "Wet days usually give me a reason to slow down and spend more time indoors. I often use the opportunity to complete household tasks, read, watch a film, or prepare for the week ahead. The sound of rain creates a peaceful atmosphere, which can make quiet activities more enjoyable. When I need to travel, I check the forecast and leave extra time because traffic may be slower. Although rain is sometimes inconvenient, a calm day at home can be surprisingly restorative."
      }
    ]
  },
  {
    "id": "unit_8",
    "title": "Đề 08",
    "goal": "Nói về ẩm thực, văn hóa, thể thao và giải trí với quan điểm rõ ràng.",
    "questions": [
      {
        "id": "q_8_1",
        "qLabel": "QUESTION 37",
        "prompt": "What is the food like in your country? What is your favourite kind of food?",
        "sampleAnswer": "My country's cuisine is varied, flavourful, and closely connected to local traditions. Many dishes are prepared with fresh vegetables, herbs, and simple ingredients, although the cooking process can be quite detailed. Each region has its own specialities, so travellers can discover different flavours wherever they go. Street food is particularly popular because it is convenient and reasonably priced. What I appreciate most is the balance between freshness and taste. The cuisine also provides an enjoyable way to learn about local culture and everyday life."
      },
      {
        "id": "q_8_2",
        "qLabel": "QUESTION 38",
        "prompt": "Please describe a typical meal in your country.",
        "sampleAnswer": "Most family meals in my country include a staple food such as rice or noodles, together with vegetables and a dish made with meat, fish, eggs, or tofu. Several dishes are often placed in the centre of the table for everyone to share. This arrangement creates a friendly atmosphere and gives people time to talk while eating. Fresh ingredients and balanced flavours are generally valued. Although eating habits are changing, shared meals remain an important part of family life and social connection."
      },
      {
        "id": "q_8_3",
        "qLabel": "QUESTION 40",
        "prompt": "Do you enjoy cooking?",
        "sampleAnswer": "Cooking is something I enjoy when I have enough time and do not need to rush. Preparing a simple meal allows me to be creative and gives me a sense of achievement when the result turns out well. I normally follow familiar recipes, although I occasionally experiment with a new ingredient or technique. Cleaning up afterwards is less enjoyable, of course. Even so, cooking is a worthwhile skill because it can save money, support a healthy lifestyle, and bring people together over a meal."
      },
      {
        "id": "q_8_4",
        "qLabel": "QUESTION 41",
        "prompt": "What sports are popular in your country?",
        "sampleAnswer": "Football and badminton are among the most popular sports in my country, although many other activities are gaining attention. People enjoy watching major matches, while children and adults often play in local parks or sports centres. Running and cycling have also become more common because they are accessible and help people stay fit. Social media has supported this trend by allowing users to share their progress and organise events. Overall, sport contributes to entertainment, health, and a stronger sense of community."
      },
      {
        "id": "q_8_5",
        "qLabel": "QUESTION 42",
        "prompt": "What is your favourite book from your country?",
        "sampleAnswer": "One book from my country that I particularly enjoy is a modern coming-of-age novel about family relationships and personal choices. I first read it several years ago, but its main message has stayed with me. The language is expressive without being unnecessarily difficult, and the characters feel convincing because they make both wise and poor decisions. Whenever I return to the story, I notice a new detail. I value the book because it is entertaining while also offering insight into local culture and values."
      }
    ]
  },
  {
    "id": "unit_9",
    "title": "Đề 09",
    "goal": "Thảo luận việc học, công nghệ, mua sắm và định hướng tương lai.",
    "questions": [
      {
        "id": "q_9_1",
        "qLabel": "QUESTION 43",
        "prompt": "Why are you learning English?",
        "sampleAnswer": "English matters to me because it can create opportunities in education, employment, and international communication. It gives me access to a wider range of information and helps me feel more confident when travelling or meeting people from different backgrounds. I also enjoy the sense of progress that comes from understanding something that once seemed difficult. Speaking is still my greatest challenge, so I practise regularly. In the long term, I hope English will broaden my horizons and help me achieve meaningful goals."
      },
      {
        "id": "q_9_2",
        "qLabel": "QUESTION 44",
        "prompt": "How do you usually practise English?",
        "sampleAnswer": "My English practice routine consists of several short but regular activities. I watch videos and listen to podcasts to become more familiar with natural pronunciation, and I read accessible articles to expand my vocabulary. Whenever possible, I repeat useful phrases aloud and record myself to identify areas for improvement. I also use new expressions in complete sentences rather than memorising isolated words. The routine is simple, but regular practice has steadily improved my confidence and ability to communicate more spontaneously."
      },
      {
        "id": "q_9_3",
        "qLabel": "QUESTION 45",
        "prompt": "How do you use technology in your daily life?",
        "sampleAnswer": "I rely on technology throughout the day for communication, work, study, and entertainment. My phone helps me manage appointments, find information, and keep in touch with other people. For more demanding tasks, I usually use a computer because it is easier to organise documents and focus for longer periods. Although technology saves a great deal of time, it can become distracting when used without a clear purpose. I therefore turn off unnecessary notifications and take regular breaks from screens whenever possible."
      },
      {
        "id": "q_9_4",
        "qLabel": "QUESTION 46",
        "prompt": "What do you think about social media?",
        "sampleAnswer": "Social media has both advantages and disadvantages, so I try to use it in a balanced and responsible way. It enables people to keep in touch, discover new ideas, and follow topics that interest them. It can also support learning because many creators share clear explanations and practical resources. On the other hand, excessive use may reduce concentration and encourage unhealthy comparisons. For that reason, I choose reliable content, limit unnecessary scrolling, and treat social media as a useful tool rather than a constant distraction."
      },
      {
        "id": "q_9_5",
        "qLabel": "QUESTION 47",
        "prompt": "What kind of shopping do you enjoy?",
        "sampleAnswer": "I like shopping when I have a clear purpose and enough time to compare different options. Practical items appeal to me more than products bought simply because they are fashionable. Before making a purchase, I normally consider the quality, price, and customer reviews. Online shopping is convenient, whereas visiting a shop allows me to examine an item directly. Taking time to compare alternatives helps me avoid wasting money and makes it more likely that each purchase will provide genuine value for money."
      },
      {
        "id": "q_9_6",
        "qLabel": "QUESTION 48",
        "prompt": "What are your plans for the future?",
        "sampleAnswer": "Over the next few years, I would like to expand my knowledge and become more skilled and independent. One of my main goals is to improve my communication skills, particularly in English, because this could open up a wider range of opportunities. I also hope to look after my physical and mental well-being and manage my time more effectively. Although I cannot predict every detail, I believe that setting realistic goals and making steady progress will help me build a stable, rewarding, and fulfilling future."
      }
    ]
  }
];

export const SPEAKING_PART1_ALL_QUESTIONS: SpeakingPart1QuestionItem[] = SPEAKING_PART1_UNITS.flatMap(
  (u) => u.questions
);
