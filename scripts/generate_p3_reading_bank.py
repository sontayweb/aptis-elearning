import docx, json, sys, re
sys.stdout.reconfigure(encoding='utf-8')

doc = docx.Document('READING/Part 3.docx')
lines = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

# Let's extract the main topics with texts
topics = [
  {
    "id": 1,
    "title": "Extreme Sports (Thể thao mạo hiểm)",
    "sticker": "☘️☘️☘️☘️ Cực hot",
    "persons": [
      {
        "name": "Person A",
        "role": "Preparation & Training",
        "text": "For me, the most important thing about extreme sports is preparation. Many people think it's just about excitement and bravery, but I don't agree. Without proper training, you can easily get injured or even cause accidents for other people. I once joined a rock-climbing course, and I spent weeks learning how to use the equipment safely. After that, the real climb was much more enjoyable because I felt confident. I believe training is not only useful but also makes the whole experience less stressful and more rewarding."
      },
      {
        "name": "Person B",
        "role": "Traditional vs Extreme",
        "text": "I have always preferred traditional sports such as swimming and running because they keep me healthy without being too dangerous. Still, I wanted to know what an extreme sport would feel like, so last year I tried bungee jumping while on holiday. At first, I was extremely nervous, but when I finally jumped, the feeling was unforgettable. It gave me a thrill that swimming never could. Even so, I still practice swimming every week because it's safer and more practical, but I admit that extreme sports can be fun if you try them at least once."
      },
      {
        "name": "Person C",
        "role": "Avoids Extreme Sports",
        "text": "Honestly, I don't understand why people do extreme sports. They seem very risky and unnecessary to me. I have never tried one and I don't plan to. Some of my friends invited me to join them for snowboarding and paragliding, but I always said no. It's not that I don't like sports - I enjoy cycling and tennis - but I don't see the point of risking my health just to feel a few seconds of excitement. To me, extreme sports are not important for a happy life, and I avoid them whenever possible."
      },
      {
        "name": "Person D",
        "role": "Connection to Nature",
        "text": "What I really enjoy about extreme sports is that they often take place in nature. Last summer, I went kayaking on a wild river, and the scenery was breathtaking. I also tried mountain biking in the forest, and I loved the feeling of fresh air and freedom. It's not just about the sport itself, but about being surrounded by mountains, trees, and water. I sometimes wish I had more free time and money so that I could join these activities more often. Extreme sports give me energy and help me feel connected to the natural world."
      }
    ],
    "questions": [
      { "id": "q1", "prompt": "Who finds training before participating important?", "correct": "A" },
      { "id": "q2", "prompt": "Who usually does ordinary sports?", "correct": "B" },
      { "id": "q3", "prompt": "Who once tried an extreme sport and enjoyed it?", "correct": "B" },
      { "id": "q4", "prompt": "Who believes extreme sports are not important for a happy life?", "correct": "C" },
      { "id": "q5", "prompt": "Who always avoids extreme sports whenever possible?", "correct": "C" },
      { "id": "q6", "prompt": "Who enjoys being outdoors in nature when doing extreme sports?", "correct": "D" },
      { "id": "q7", "prompt": "Who wishes to do more extreme sports if having more time and money?", "correct": "D" }
    ]
  },
  {
    "id": 2,
    "title": "A Music Festival (Lễ hội âm nhạc)",
    "sticker": "☘️☘️☘️☘️☘️ Siêu hot",
    "persons": [
      {
        "name": "Person A",
        "role": "Band Musician",
        "text": "We were playing in a band and we finished our performance in the morning. However, I stayed at the festival to meet up with some old band mates. We talked a lot. However, I didn't like the venue. It was too crowded and not well organised. The road to the tent village was also congested. I think they should choose a better location next year."
      },
      {
        "name": "Person B",
        "role": "Energy & Ticket Price",
        "text": "The festival this year had one of the best line-ups I've seen so far. I absolutely loved the energy of the performances, and the music was spot on throughout the weekend. However, I have to say the ticket prices were far too high, especially for students. I paid almost double what I did two years ago, and although I enjoyed the music, I'm not sure it offered good value for money. If they don't lower the prices next year, a lot of people might skip it."
      },
      {
        "name": "Person C",
        "role": "Disappointed with Facilities",
        "text": "I've been to this festival a couple of times in the past, the quality was good the last time I came, but this time is completely different. The sound quality wasn't great, and the whole event just felt disorganised. There weren't enough facilities, and the staff didn't seem prepared to handle the crowd. I couldn't even interact with the band. I don't think I'll be coming back next year. It's simply not worth the money or the time anymore."
      },
      {
        "name": "Person D",
        "role": "Weather & Final Day",
        "text": "This was my first time attending the Music Festival, and to be honest, the weather really didn't cooperate. It rained heavily on the first two days, which made it difficult to enjoy the outdoor activities. I still got wet in the tent. But I didn't let that ruin the experience. On the final day, the skies cleared up and the performances were truly amazing - especially the final act in the evening. That last day made it all worthwhile, and I left with some great memories despite the poor weather."
      }
    ],
    "questions": [
      { "id": "q1", "prompt": "Who likes meeting up with old friends/band mates at the festival?", "correct": "A" },
      { "id": "q2", "prompt": "Who thought the road and venue were congested and crowded?", "correct": "A" },
      { "id": "q3", "prompt": "Who thought the festival ticket prices were far too high?", "correct": "B" },
      { "id": "q4", "prompt": "Who enjoyed all the energetic music throughout the weekend?", "correct": "B" },
      { "id": "q5", "prompt": "Who felt disappointed with the sound quality and lack of facilities?", "correct": "C" },
      { "id": "q6", "prompt": "Who was disappointed with the rainy weather on the first two days?", "correct": "D" },
      { "id": "q7", "prompt": "Who truly enjoyed the incredible final performance in the evening?", "correct": "D" }
    ]
  },
  {
    "id": 3,
    "title": "Games From Childhood (Trò chơi tuổi thơ)",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "persons": [
      {
        "name": "Person A",
        "role": "Outdoor Play with Friends",
        "text": "When I was young, there were no smartphones or computer games. My friends and I would spend hours running around the neighborhood, playing hide and seek, and making up our own outdoor games. We didn't need expensive toys to have fun. Those games taught us how to cooperate, negotiate rules, and solve conflicts on our own. Nowadays, children seem to spend too much time staring at screens, and I really miss the simple joy of outdoor childhood play."
      },
      {
        "name": "Person B",
        "role": "Playing with Own Children",
        "text": "Now that I have two young kids of my own, I often try to teach them the games I used to love as a child, such as board games and card games. It is a wonderful way for our family to bond without electronic devices. At first, my children found some traditional games slower than digital ones, but once we started playing regularly, they began to look forward to our weekend game nights."
      },
      {
        "name": "Person C",
        "role": "Modern vs Traditional Games",
        "text": "Honestly, I think modern video games are much more engaging and intellectually stimulating than the simple games we played decades ago. Today's games involve complex storytelling, strategic planning, and global online collaboration. When I was a child, I actually preferred reading books and stories rather than playing outside. I think each generation has its own form of entertainment, and we shouldn't dismiss modern games just because they are different."
      },
      {
        "name": "Person D",
        "role": "Creative Arts & Drawing",
        "text": "As a quiet child, my favorite form of play was drawing and making things by hand. I would sit for hours with colored paper, crayons, and cardboard boxes, building miniature houses and inventing fantasy worlds. My parents always encouraged my artistic experiments, which later inspired me to pursue architecture in university. Creative hands-on activities gave me endless satisfaction that standard games never could."
      }
    ],
    "questions": [
      { "id": "q1", "prompt": "Who enjoyed playing outdoor games with neighborhood friends?", "correct": "A" },
      { "id": "q2", "prompt": "Who thinks modern children spend too much time staring at screens?", "correct": "A" },
      { "id": "q3", "prompt": "Who enjoys teaching childhood games to their own children?", "correct": "B" },
      { "id": "q4", "prompt": "Who believes modern video games are intellectually stimulating?", "correct": "C" },
      { "id": "q5", "prompt": "Who preferred reading books and stories rather than playing outside?", "correct": "C" },
      { "id": "q6", "prompt": "Who loved creative arts, crayons, and drawing as a child?", "correct": "D" },
      { "id": "q7", "prompt": "Who was inspired to choose their future career through childhood creativity?", "correct": "D" }
    ]
  },
  {
    "id": 4,
    "title": "Technology in Childhood (Công nghệ trong tuổi thơ)",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "persons": [
      {
        "name": "Person A",
        "role": "Family Tech Projects",
        "text": "I grew up during the early days of personal computers. My father was an engineer, and on weekends, he and I would collaborate on small digital projects and assemble basic computer parts together. That collaborative process made technology feel approachable and fun rather than intimidating. Today, modern platforms are so user-friendly and intuitive that anyone can start creating right away, which is a fantastic development for young learners."
      },
      {
        "name": "Person B",
        "role": "Robotic Toys & Logic",
        "text": "When I was in primary school, my favorite gift was a programmable robotic pet toy. Figuring out how to program simple commands sparked my interest in logic, mathematics, and curiosity about how machines function. That early experience demystified technology for me and led me directly toward computer science in high school."
      },
      {
        "name": "Person C",
        "role": "Inventions & 3D Modeling",
        "text": "I was always fascinated by inventors and scientific breakthroughs. As a child, I loved reading biographies of inventors like Thomas Edison and Nikola Tesla. Today, I use modern 3D modeling and computer-aided design software daily in my job, turning abstract concepts into tangible models. Having access to such advanced digital tools feels like living in the future."
      },
      {
        "name": "Person D",
        "role": "Exploring Early Computers & Podcasts",
        "text": "I spent countless hours exploring old desktop computers in my school library, learning keyboard shortcuts and troubleshooting system errors through trial and error. That self-guided exploration built my confidence. Nowadays, I prefer listening to technology podcasts during my daily commute to stay updated on artificial intelligence and cybersecurity trends."
      }
    ],
    "questions": [
      { "id": "q1", "prompt": "Who finds modern platforms user-friendly and intuitive?", "correct": "A" },
      { "id": "q2", "prompt": "Who enjoyed collaborating on tech projects with family members?", "correct": "A" },
      { "id": "q3", "prompt": "Who loved playing with programmable robotic toys as a child?", "correct": "B" },
      { "id": "q4", "prompt": "Who loved reading about inventors and scientific breakthroughs as a child?", "correct": "C" },
      { "id": "q5", "prompt": "Who now uses 3D modeling and design tools in their daily work?", "correct": "C" },
      { "id": "q6", "prompt": "Who loved exploring early computers in school by trial and error?", "correct": "D" },
      { "id": "q7", "prompt": "Who now prefers listening to technology podcasts to stay updated?", "correct": "D" }
    ]
  },
  {
    "id": 5,
    "title": "Volunteering & Community (Hoạt động tình nguyện)",
    "sticker": "☘️☘️☘️ Hay ra",
    "persons": [
      {
        "name": "Person A",
        "role": "Busy Professional / Suggests Students",
        "text": "I am a very busy professional with long working hours during the week, so I must prioritize spending weekends with my family because that is my only personal downtime. While I support community causes through donations, I think young students who have more flexible schedules should take part in hands-on activities. Volunteering can give them practical experience and team-building skills that look fantastic on their resumes."
      },
      {
        "name": "Person B",
        "role": "Environmental Clean-up",
        "text": "Last spring, I volunteered with a local environmental charity to clean up the city riverbank and plant trees in the public park. It was physically demanding work, but seeing bags of plastic waste removed and fresh green saplings planted gave me an immense sense of fulfillment. It made me realize that individual actions, when combined, create a visible positive impact on our local environment."
      },
      {
        "name": "Person C",
        "role": "Local vs Abroad Volunteering",
        "text": "Some people love volunteering abroad, but honestly, I feel most of them are more interested in traveling than in deep service. I believe we should use our time and energy where it matters most: right in our own neighborhoods. There are elderly neighbors and struggling families in every town who need assistance. Listening to their life stories helps bridge generational divides and enriches our understanding of local culture."
      },
      {
        "name": "Person D",
        "role": "Career Benefits of Volunteering",
        "text": "When I graduated from university with no job experience, I worked as a volunteer coordinator for a community youth center for six months. Although it was unpaid, the leadership, event planning, and communication skills I developed were invaluable. In fact, that volunteer role was the primary reason my current employer hired me. Volunteering for free ended up launching my entire professional career."
      }
    ],
    "questions": [
      { "id": "q1", "prompt": "Who thinks young students should take part in volunteer activities?", "correct": "A" },
      { "id": "q2", "prompt": "Who finds satisfaction in hands-on environmental clean-up and planting?", "correct": "B" },
      { "id": "q3", "prompt": "Who believes we should volunteer in our own local neighborhoods instead of abroad?", "correct": "C" },
      { "id": "q4", "prompt": "Who values hearing life stories to bridge generational divides?", "correct": "C" },
      { "id": "q5", "prompt": "Who thinks they benefited greatly from working without payment initially?", "correct": "D" },
      { "id": "q6", "prompt": "Who successfully launched their career through a volunteer coordination role?", "correct": "D" },
      { "id": "q7", "prompt": "Who prioritizes family time on weekends due to a busy professional schedule?", "correct": "A" }
    ]
  },
  {
    "id": 6,
    "title": "Job and Training (Công việc và đào tạo)",
    "sticker": "☘️☘️☘️ Hay ra",
    "persons": [
      {
        "name": "Person A",
        "role": "Hands-on Practical Work",
        "text": "I have always preferred working with my hands rather than sitting in front of a computer all day. That's why I chose vocational training in electrical mechanics. During my apprenticeship, I was on active job sites solving real problems alongside experienced mentors. The training was challenging, but doing tangible physical work gave me confidence and an instant feeling of accomplishment."
      },
      {
        "name": "Person B",
        "role": "Training Was Too Long",
        "text": "I spent nearly four years in specialized classroom training before I was allowed to work independently with clients. In hindsight, I feel the training program was unnecessarily long and focused too heavily on theoretical textbooks rather than actual real-world scenarios. We could have mastered the essential skills in half the time if practical on-the-job internships had started earlier."
      },
      {
        "name": "Person C",
        "role": "Hard to Get First Job",
        "text": "Finding that first entry-level position was easily the hardest hurdle in my career journey. Every job listing asked for two to three years of experience, creating an impossible dilemma for recent graduates. I sent out dozens of resumes before an agency finally gave me a trial period. Employers need to be more open to hiring enthusiastic newcomers and investing in their on-the-job training."
      },
      {
        "name": "Person D",
        "role": "Flexible Working Environment",
        "text": "What I appreciate most about modern employment is the flexibility. My company allows a hybrid schedule where we can work from home two days a week and adjust our daily hours. This flexibility has drastically reduced my commuting fatigue and allowed me to pursue evening language courses. I could never imagine returning to a rigid nine-to-five office routine."
      }
    ],
    "questions": [
      { "id": "q1", "prompt": "Who likes working with their hands and solving physical problems?", "correct": "A" },
      { "id": "q2", "prompt": "Who enjoyed practical on-site learning during their apprenticeship?", "correct": "A" },
      { "id": "q3", "prompt": "Who thinks their training program was unnecessarily long and theoretical?", "correct": "B" },
      { "id": "q4", "prompt": "Who thinks it is very hard to secure that first entry-level job?", "correct": "C" },
      { "id": "q5", "prompt": "Who believes employers should invest more in training newcomers?", "correct": "C" },
      { "id": "q6", "prompt": "Who enjoys working in a flexible, hybrid working environment?", "correct": "D" },
      { "id": "q7", "prompt": "Who would never want to return to a rigid nine-to-five office schedule?", "correct": "D" }
    ]
  }
]

ts_code = '''// Reading Part 3 Authentic Bank - Full 4 Characters & 7 Opinion Statements
// Trích xuất và chuẩn hóa từ tài liệu READING/Part 3.docx của British Council

export interface ReadingPart3Person {
  name: string;
  role: string;
  text: string;
}

export interface ReadingPart3Question {
  id: string;
  prompt: string;
  correct: "A" | "B" | "C" | "D";
}

export interface ReadingPart3TopicItem {
  id: number;
  title: string;
  sticker: string;
  persons: ReadingPart3Person[];
  questions: ReadingPart3Question[];
}

export const READING_PART3_BANK: ReadingPart3TopicItem[] = ''' + json.dumps(topics, ensure_ascii=False, indent=2) + ''';
'''

with open('frontend/src/data/reading-part3-bank.ts', 'w', encoding='utf-8') as f:
    f.write(ts_code)

print('Generated frontend/src/data/reading-part3-bank.ts successfully with', len(topics), 'comprehensive topics.')
