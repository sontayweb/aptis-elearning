// Reading Part 1 Authentic Question Bank
// Extracted and synchronized from READING/Part 1.docx
// Format: Simplified Title (e.g. 'Đề 01', 'Đề 02') without verbose suffixes

export interface ReadingPart1Question {
  id: string;
  qNumber: number;
  prompt: string;
  fullSentence: string;
  translation?: string;
  targetWord: string;
  options: string[];
  correctAnswer: string;
}

export interface ReadingPart1Set {
  id: string;
  setNumber: number;
  title: string;
  keyWords: string[];
  sticker: "★★★★★ Hay ra" | "VIP" | "Đề tủ" | "Mới cập nhật" | string;
  cloverLevel?: number; // 1 to 6 clovers (☘️)
  questions: ReadingPart1Question[];
}

export const READING_PART1_SETS: ReadingPart1Set[] = [
  {
    "id": "reading_p1_set_1",
    "setNumber": 1,
    "title": "Đề 01",
    "keyWords": [
      "window",
      "buy",
      "market",
      "cake",
      "watched"
    ],
    "sticker": "★★★★★ Hay ra",
    "questions": [
      {
        "id": "p1_q_1_1",
        "qNumber": 1,
        "prompt": "I saw some shows in the [gap] of one store",
        "fullSentence": "I saw some shows in the window of one store",
        "translation": "Tôi nhìn thấy một vài chiếc cửa sổ trong một cửa hàng",
        "targetWord": "window",
        "options": [
          "table",
          "house",
          "window"
        ],
        "correctAnswer": "window"
      },
      {
        "id": "p1_q_1_2",
        "qNumber": 2,
        "prompt": "I didn't [gap] it",
        "fullSentence": "I didn't buy it",
        "translation": "Tôi đã không mua nó",
        "targetWord": "buy",
        "options": [
          "house",
          "table",
          "buy"
        ],
        "correctAnswer": "buy"
      },
      {
        "id": "p1_q_1_3",
        "qNumber": 3,
        "prompt": "I buy some food at the [gap]",
        "fullSentence": "I buy some food at the market",
        "translation": "Tôi mua một ít đồ ăn ở chợ",
        "targetWord": "market",
        "options": [
          "house",
          "market",
          "table"
        ],
        "correctAnswer": "market"
      },
      {
        "id": "p1_q_1_4",
        "qNumber": 4,
        "prompt": "I ate [gap]",
        "fullSentence": "I ate cake",
        "translation": "Tôi đã ăn bánh",
        "targetWord": "cake",
        "options": [
          "cake",
          "table",
          "house"
        ],
        "correctAnswer": "cake"
      },
      {
        "id": "p1_q_1_5",
        "qNumber": 5,
        "prompt": "I [gap] a program on TV",
        "fullSentence": "I watched a program on TV",
        "translation": "Tôi đã xem một chương trình trên TV",
        "targetWord": "watched",
        "options": [
          "table",
          "watched",
          "house"
        ],
        "correctAnswer": "watched"
      }
    ],
    "cloverLevel": 5
  },
  {
    "id": "reading_p1_set_2",
    "setNumber": 2,
    "title": "Đề 02",
    "keyWords": [
      "Visit",
      "room",
      "hot",
      "train",
      "speak"
    ],
    "sticker": "★★★★★ Hay ra",
    "questions": [
      {
        "id": "p1_q_2_1",
        "qNumber": 1,
        "prompt": "I went to the museum to [gap] the new art exhibition",
        "fullSentence": "I went to the museum to visit the new art exhibition",
        "translation": "Tôi đi thăm ( visit) phòng (room) bạn vào mùa hè nên rất nóng (hot) phải đi tàu (train) và nói chuyện (speak) với mọi người.",
        "targetWord": "Visit",
        "options": [
          "house",
          "Visit",
          "table"
        ],
        "correctAnswer": "Visit"
      },
      {
        "id": "p1_q_2_2",
        "qNumber": 2,
        "prompt": "There was a big tree in the middle of the [gap]",
        "fullSentence": "There was a big tree in the middle of the room",
        "targetWord": "room",
        "options": [
          "room",
          "table",
          "house"
        ],
        "correctAnswer": "room"
      },
      {
        "id": "p1_q_2_3",
        "qNumber": 3,
        "prompt": "The weather was very [gap] that day",
        "fullSentence": "The weather was very hot that day",
        "targetWord": "hot",
        "options": [
          "house",
          "hot",
          "table"
        ],
        "correctAnswer": "hot"
      },
      {
        "id": "p1_q_2_4",
        "qNumber": 4,
        "prompt": "On the way home, I look the [gap]",
        "fullSentence": "On the way home, I look the train",
        "targetWord": "train",
        "options": [
          "train",
          "table",
          "house"
        ],
        "correctAnswer": "train"
      },
      {
        "id": "p1_q_2_5",
        "qNumber": 5,
        "prompt": "At the museum, I could [gap] with a tour guide about history",
        "fullSentence": "At the museum, I could speak with a tour guide about history",
        "translation": "ĐỀ 5: Visit - Shops - Red - Dinner - Watch ( mới )",
        "targetWord": "speak",
        "options": [
          "speak",
          "table",
          "house"
        ],
        "correctAnswer": "speak"
      }
    ],
    "cloverLevel": 5
  },
  {
    "id": "reading_p1_set_3",
    "setNumber": 3,
    "title": "Đề 03",
    "keyWords": [
      "Visit",
      "Shops",
      "Red",
      "Dinner",
      "Watch"
    ],
    "sticker": "★★★★★ Hay ra",
    "questions": [
      {
        "id": "p1_q_3_1",
        "qNumber": 1,
        "prompt": "They book a flight to [gap] their relatives abroad.",
        "fullSentence": "They book a flight to visit their relatives abroad.",
        "translation": "Họ đặt vé máy bay đi thăm người thân ở nước ngoài.",
        "targetWord": "Visit",
        "options": [
          "house",
          "table",
          "Visit"
        ],
        "correctAnswer": "Visit"
      },
      {
        "id": "p1_q_3_2",
        "qNumber": 2,
        "prompt": "The airport has many [gap] selling souvenirs.",
        "fullSentence": "The airport has many shops selling souvenirs.",
        "translation": "Sân bay có nhiều cửa hàng bán đồ lưu niệm.",
        "targetWord": "Shops",
        "options": [
          "Shops",
          "table",
          "house"
        ],
        "correctAnswer": "Shops"
      },
      {
        "id": "p1_q_3_3",
        "qNumber": 3,
        "prompt": "Their luggage is [gap], making it easy to find at the terminal.",
        "fullSentence": "Their luggage is red, making it easy to find at the terminal.",
        "translation": "Hành lý của họ màu đỏ, rất dễ tìm thấy tại nhà ga.",
        "targetWord": "Red",
        "options": [
          "table",
          "house",
          "Red"
        ],
        "correctAnswer": "Red"
      },
      {
        "id": "p1_q_3_4",
        "qNumber": 4,
        "prompt": "For [gap], they try local street food with spicy flavor",
        "fullSentence": "For dinner, they try local street food with spicy flavor",
        "translation": "Bữa tối, họ thử các món ăn đường phố địa thử món ăn địa phương với hương vị cay nồng.",
        "targetWord": "Dinner",
        "options": [
          "house",
          "table",
          "Dinner"
        ],
        "correctAnswer": "Dinner"
      },
      {
        "id": "p1_q_3_5",
        "qNumber": 5,
        "prompt": "At night, they [gap] a performance of traditional dance.",
        "fullSentence": "At night, they watch a performance of traditional dance.",
        "translation": "Buổi tối, họ xem biểu diễn múa truyền thống.",
        "targetWord": "Watch",
        "options": [
          "house",
          "Watch",
          "table"
        ],
        "correctAnswer": "Watch"
      }
    ],
    "cloverLevel": 5
  },
  {
    "id": "reading_p1_set_4",
    "setNumber": 4,
    "title": "Đề 04",
    "keyWords": [
      "Home",
      "Customers",
      "Easy",
      "Prepare",
      "Watch"
    ],
    "sticker": "★★★★★ Hay ra",
    "questions": [
      {
        "id": "p1_q_4_1",
        "qNumber": 1,
        "prompt": "She uses her laptop to work from [gap] every day.",
        "fullSentence": "She uses her laptop to work from home every day.",
        "translation": "Cô ấy dùng máy tính xách tay để làm việc tại nhà mỗi ngày.",
        "targetWord": "Home",
        "options": [
          "house",
          "table",
          "Home"
        ],
        "correctAnswer": "Home"
      },
      {
        "id": "p1_q_4_2",
        "qNumber": 2,
        "prompt": "The café has free Wi-Fi for all [gap].",
        "fullSentence": "The café has free Wi-Fi for all customers.",
        "translation": "Quán cà phê có Wi-Fi miễn phí cho tất cả khách hàng.",
        "targetWord": "Customers",
        "options": [
          "Customers",
          "house",
          "table"
        ],
        "correctAnswer": "Customers"
      },
      {
        "id": "p1_q_4_3",
        "qNumber": 3,
        "prompt": "Her phone case is yellow, making it [gap] to spot.",
        "fullSentence": "Her phone case is yellow, making it easy to spot.",
        "translation": "Ốp lưng điện thoại của cô ấy màu vàng, rất dễ nhận biết.",
        "targetWord": "Easy",
        "options": [
          "table",
          "Easy",
          "house"
        ],
        "correctAnswer": "Easy"
      },
      {
        "id": "p1_q_4_4",
        "qNumber": 4,
        "prompt": "For snacks, they [gap] popcorn and fruit smoothies.",
        "fullSentence": "For snacks, they prepare popcorn and fruit smoothies.",
        "translation": "Về đồ ăn nhẹ, họ chuẩn bị bỏng ngô và sinh tố trái cây.",
        "targetWord": "Prepare",
        "options": [
          "Prepare",
          "house",
          "table"
        ],
        "correctAnswer": "Prepare"
      },
      {
        "id": "p1_q_4_5",
        "qNumber": 5,
        "prompt": "On weekends, they [gap] videos on their smart TV",
        "fullSentence": "On weekends, they watch videos on their smart TV",
        "translation": "Vào cuối tuần, họ xem video trên TV thông minh.",
        "targetWord": "Watch",
        "options": [
          "table",
          "Watch",
          "house"
        ],
        "correctAnswer": "Watch"
      }
    ],
    "cloverLevel": 5
  },
  {
    "id": "reading_p1_set_5",
    "setNumber": 5,
    "title": "Đề 05",
    "keyWords": [
      "Park",
      "classes",
      "silver",
      "breakfast",
      "meditation"
    ],
    "sticker": "Đề tủ",
    "questions": [
      {
        "id": "p1_q_5_1",
        "qNumber": 1,
        "prompt": "She jogs in the [gap] every morning to stay fit",
        "fullSentence": "She jogs in the park every morning to stay fit",
        "translation": "Cô ấy chạy bộ trong công viên mỗi sáng để giữ dáng",
        "targetWord": "Park",
        "options": [
          "table",
          "Park",
          "house"
        ],
        "correctAnswer": "Park"
      },
      {
        "id": "p1_q_5_2",
        "qNumber": 2,
        "prompt": "The gym offers free [gap] for yoga and pilates",
        "fullSentence": "The gym offers free classes for yoga and pilates",
        "translation": "Phòng tập có các lớp yoga và pilates miễn phí",
        "targetWord": "classes",
        "options": [
          "house",
          "classes",
          "table"
        ],
        "correctAnswer": "classes"
      },
      {
        "id": "p1_q_5_3",
        "qNumber": 3,
        "prompt": "Her water bottle is [gap], easy to spot during workout",
        "fullSentence": "Her water bottle is silver, easy to spot during workout",
        "translation": "Bình nước của cô ấy màu bạc dễ dàng nhận ra trong quá trình luyện tập",
        "targetWord": "silver",
        "options": [
          "house",
          "silver",
          "table"
        ],
        "correctAnswer": "silver"
      },
      {
        "id": "p1_q_5_4",
        "qNumber": 4,
        "prompt": "For [gap], she blends a smoothie with berries and spinach",
        "fullSentence": "For breakfast, she blends a smoothie with berries and spinach",
        "translation": "Bữa sáng cô ấy xay sinh tố với các loại quả mọng và rau bina",
        "targetWord": "breakfast",
        "options": [
          "table",
          "breakfast",
          "house"
        ],
        "correctAnswer": "breakfast"
      },
      {
        "id": "p1_q_5_5",
        "qNumber": 5,
        "prompt": "After exercising they relax with a [gap] session at home",
        "fullSentence": "After exercising they relax with a meditation session at home",
        "translation": "Sau khi luyện tập họ thư giãn với một buổi thiền tại nhà",
        "targetWord": "meditation",
        "options": [
          "meditation",
          "table",
          "house"
        ],
        "correctAnswer": "meditation"
      }
    ],
    "cloverLevel": 4
  },
  {
    "id": "reading_p1_set_6",
    "setNumber": 6,
    "title": "Đề 06",
    "keyWords": [
      "Near",
      "Small",
      "Like",
      "Shop",
      "Talk"
    ],
    "sticker": "Đề tủ",
    "questions": [
      {
        "id": "p1_q_6_1",
        "qNumber": 1,
        "prompt": "My new house is [gap] my job",
        "fullSentence": "My new house is near my job",
        "translation": "Ngôi nhà mới của tôi ở gần chỗ làm.",
        "targetWord": "Near",
        "options": [
          "house",
          "table",
          "Near"
        ],
        "correctAnswer": "Near"
      },
      {
        "id": "p1_q_6_2",
        "qNumber": 2,
        "prompt": "My house is really beautiful and has a [gap] garden",
        "fullSentence": "My house is really beautiful and has a small garden",
        "translation": "Nhà tôi rất đẹp và có một khu vườn nhỏ. Nhà có bếp, và tôi rất thích nó.",
        "targetWord": "Small",
        "options": [
          "house",
          "Small",
          "table"
        ],
        "correctAnswer": "Small"
      },
      {
        "id": "p1_q_6_3",
        "qNumber": 3,
        "prompt": "It has a kitchen, and I really [gap] it.",
        "fullSentence": "It has a kitchen, and I really like it.",
        "translation": "Nhà tôi có bếp và tôi rất thích nó.",
        "targetWord": "Like",
        "options": [
          "table",
          "Like",
          "house"
        ],
        "correctAnswer": "Like"
      },
      {
        "id": "p1_q_6_4",
        "qNumber": 4,
        "prompt": "I work in a [gap] in town, I sell clothes.",
        "fullSentence": "I work in a shop in town, I sell clothes.",
        "translation": "Tôi làm việc trong một cửa hàng trong thị trấn, tôi bán quần áo.",
        "targetWord": "Shop",
        "options": [
          "house",
          "Shop",
          "table"
        ],
        "correctAnswer": "Shop"
      },
      {
        "id": "p1_q_6_5",
        "qNumber": 5,
        "prompt": "I meet many people everyday, I like to [gap] to them.",
        "fullSentence": "I meet many people everyday, I like to talk to them.",
        "translation": "Tôi gặp rất nhiều người mỗi ngày, tôi thích trò chuyện với họ.",
        "targetWord": "Talk",
        "options": [
          "Talk",
          "house",
          "table"
        ],
        "correctAnswer": "Talk"
      }
    ],
    "cloverLevel": 4
  },
  {
    "id": "reading_p1_set_7",
    "setNumber": 7,
    "title": "Đề 07",
    "keyWords": [
      "Clear",
      "sun",
      "enjoyable",
      "working",
      "read"
    ],
    "sticker": "Đề tủ",
    "questions": [
      {
        "id": "p1_q_7_1",
        "qNumber": 1,
        "prompt": "The water is [gap]",
        "fullSentence": "The water is clear",
        "translation": "Nước trong sạch",
        "targetWord": "Clear",
        "options": [
          "house",
          "table",
          "Clear"
        ],
        "correctAnswer": "Clear"
      },
      {
        "id": "p1_q_7_2",
        "qNumber": 2,
        "prompt": "The [gap] is out",
        "fullSentence": "The sun is out",
        "translation": "Mặt trời đang chiếu sáng",
        "targetWord": "sun",
        "options": [
          "sun",
          "house",
          "table"
        ],
        "correctAnswer": "sun"
      },
      {
        "id": "p1_q_7_3",
        "qNumber": 3,
        "prompt": "I have an [gap] holiday",
        "fullSentence": "I have an enjoyable holiday",
        "translation": "Tôi có một kỳ nghỉ thú vị",
        "targetWord": "enjoyable",
        "options": [
          "table",
          "house",
          "enjoyable"
        ],
        "correctAnswer": "enjoyable"
      },
      {
        "id": "p1_q_7_4",
        "qNumber": 4,
        "prompt": "After [gap] so hard",
        "fullSentence": "After working so hard",
        "translation": "Sau khi làm việc chăm chỉ",
        "targetWord": "working",
        "options": [
          "working",
          "table",
          "house"
        ],
        "correctAnswer": "working"
      },
      {
        "id": "p1_q_7_5",
        "qNumber": 5,
        "prompt": "I hope to [gap] your letter",
        "fullSentence": "I hope to read your letter",
        "translation": "Tôi hy vọng sẽ đọc được thư của bạn",
        "targetWord": "read",
        "options": [
          "house",
          "table",
          "read"
        ],
        "correctAnswer": "read"
      }
    ],
    "cloverLevel": 4
  },
  {
    "id": "reading_p1_set_8",
    "setNumber": 8,
    "title": "Đề 08",
    "keyWords": [
      "just",
      "too",
      "to",
      "some",
      "give"
    ],
    "sticker": "Đề tủ",
    "questions": [
      {
        "id": "p1_q_8_1",
        "qNumber": 1,
        "prompt": "It is [gap] what I like",
        "fullSentence": "It is just what I like",
        "translation": "Đây chính là thứ tôi thích nhất",
        "targetWord": "just",
        "options": [
          "just",
          "table",
          "house"
        ],
        "correctAnswer": "just"
      },
      {
        "id": "p1_q_8_2",
        "qNumber": 2,
        "prompt": "And it is the perfect color,[gap]",
        "fullSentence": "And it is the perfect color,too",
        "translation": "Và nó cũng là màu sắc hoàn hảo",
        "targetWord": "too",
        "options": [
          "house",
          "too",
          "table"
        ],
        "correctAnswer": "too"
      },
      {
        "id": "p1_q_8_3",
        "qNumber": 3,
        "prompt": "I am going [gap] wear it to my birthday party",
        "fullSentence": "I am going to wear it to my birthday party",
        "translation": "Tôi sẽ mặc nó đến bữa tiệc sinh nhật của mình",
        "targetWord": "to",
        "options": [
          "house",
          "table",
          "to"
        ],
        "correctAnswer": "to"
      },
      {
        "id": "p1_q_8_4",
        "qNumber": 4,
        "prompt": "I will save you [gap] cake",
        "fullSentence": "I will save you some cake",
        "translation": "Tôi sẽ giữ lại một số bánh cho bạn",
        "targetWord": "some",
        "options": [
          "table",
          "house",
          "some"
        ],
        "correctAnswer": "some"
      },
      {
        "id": "p1_q_8_5",
        "qNumber": 5,
        "prompt": "[gap] my love to everyone",
        "fullSentence": "Give my love to everyone",
        "translation": "Gửi tình yêu của tôi đến tất cả mọi ng",
        "targetWord": "give",
        "options": [
          "table",
          "house",
          "give"
        ],
        "correctAnswer": "give"
      }
    ],
    "cloverLevel": 4
  },
  {
    "id": "reading_p1_set_9",
    "setNumber": 9,
    "title": "Đề 09",
    "keyWords": [
      "miss",
      "called",
      "ready",
      "meet",
      "dinner"
    ],
    "sticker": "Mới cập nhật",
    "questions": [
      {
        "id": "p1_q_9_1",
        "qNumber": 1,
        "prompt": "I imagine you don’t want to [gap] this",
        "fullSentence": "I imagine you don’t want to miss this",
        "translation": "Tôi nghĩ bạn ko muốn bỏ lỡ điều này",
        "targetWord": "miss",
        "options": [
          "house",
          "table",
          "miss"
        ],
        "correctAnswer": "miss"
      },
      {
        "id": "p1_q_9_2",
        "qNumber": 2,
        "prompt": "I [gap] you earlier but you were not home.",
        "fullSentence": "I called you earlier but you were not home.",
        "translation": "Tôi đã gọi cho bạn trc đó nhưng bạn không ở nhà",
        "targetWord": "called",
        "options": [
          "table",
          "house",
          "called"
        ],
        "correctAnswer": "called"
      },
      {
        "id": "p1_q_9_3",
        "qNumber": 3,
        "prompt": "Can you be [gap] before 7pm?",
        "fullSentence": "Can you be ready before 7pm?",
        "translation": "Bạn có thể sẵn sàng trước 7h tối ko",
        "targetWord": "ready",
        "options": [
          "table",
          "ready",
          "house"
        ],
        "correctAnswer": "ready"
      },
      {
        "id": "p1_q_9_4",
        "qNumber": 4,
        "prompt": "I can [gap] you at your place then.",
        "fullSentence": "I can meet you at your place then.",
        "translation": "Tôi có thể gặp bạn tại nhà bạn lúc đó",
        "targetWord": "meet",
        "options": [
          "house",
          "meet",
          "table"
        ],
        "correctAnswer": "meet"
      },
      {
        "id": "p1_q_9_5",
        "qNumber": 5,
        "prompt": "Don't have too much [gap] because we're going to eat cake.",
        "fullSentence": "Don't have too much dinner because we're going to eat cake.",
        "translation": "Đừng ăn tối quá nhiều vì chúng ta sẽ ăn bánh",
        "targetWord": "dinner",
        "options": [
          "table",
          "dinner",
          "house"
        ],
        "correctAnswer": "dinner"
      }
    ],
    "cloverLevel": 3
  },
  {
    "id": "reading_p1_set_10",
    "setNumber": 10,
    "title": "Đề 10",
    "keyWords": [
      "friendly",
      "first",
      "walk",
      "speak",
      "together"
    ],
    "sticker": "VIP",
    "questions": [
      {
        "id": "p1_q_10_1",
        "qNumber": 1,
        "prompt": "Everyone is [gap]",
        "fullSentence": "Everyone is friendly",
        "translation": "Mọi người đều thân thiện",
        "targetWord": "friendly",
        "options": [
          "house",
          "friendly",
          "table"
        ],
        "correctAnswer": "friendly"
      },
      {
        "id": "p1_q_10_2",
        "qNumber": 2,
        "prompt": "I can walk to my class [gap]",
        "fullSentence": "I can walk to my class",
        "translation": "Tôi gặp cô ấy lần đầu tiên",
        "targetWord": "first",
        "options": [
          "table",
          "house",
          "first"
        ],
        "correctAnswer": "first"
      },
      {
        "id": "p1_q_10_3",
        "qNumber": 3,
        "prompt": "I meet her for the first time [gap]",
        "fullSentence": "I meet her for the first time",
        "translation": "Tôi có thể đi bộ đến lớp học của mình",
        "targetWord": "walk",
        "options": [
          "walk",
          "table",
          "house"
        ],
        "correctAnswer": "walk"
      },
      {
        "id": "p1_q_10_4",
        "qNumber": 4,
        "prompt": "She can [gap] 5 languages",
        "fullSentence": "She can speak 5 languages",
        "translation": "Cô ấy có thể nói 5 thứ tiếng",
        "targetWord": "speak",
        "options": [
          "table",
          "house",
          "speak"
        ],
        "correctAnswer": "speak"
      },
      {
        "id": "p1_q_10_5",
        "qNumber": 5,
        "prompt": "We eat dinner [gap]",
        "fullSentence": "We eat dinner together",
        "translation": "Chúng tôi ăn tối cùng nhau",
        "targetWord": "together",
        "options": [
          "table",
          "together",
          "house"
        ],
        "correctAnswer": "together"
      }
    ],
    "cloverLevel": 3
  },
  {
    "id": "reading_p1_set_11",
    "setNumber": 11,
    "title": "Đề 11",
    "keyWords": [
      "balance",
      "statement",
      "think",
      "slowly",
      "before"
    ],
    "sticker": "Mới cập nhật",
    "questions": [
      {
        "id": "p1_q_11_1",
        "qNumber": 1,
        "prompt": "The budget doesn’t [gap]",
        "fullSentence": "The budget doesn’t balance",
        "translation": "Ngân sách không cân bằng",
        "targetWord": "balance",
        "options": [
          "balance",
          "table",
          "house"
        ],
        "correctAnswer": "balance"
      },
      {
        "id": "p1_q_11_2",
        "qNumber": 2,
        "prompt": "Could you get the financial [gap]?",
        "fullSentence": "Could you get the financial statement?",
        "translation": "Bạn có thể lấy báo cáo tài chính ko?",
        "targetWord": "statement",
        "options": [
          "table",
          "statement",
          "house"
        ],
        "correctAnswer": "statement"
      },
      {
        "id": "p1_q_11_3",
        "qNumber": 3,
        "prompt": "I [gap] it will help",
        "fullSentence": "I think it will help",
        "translation": "Tôi nghĩ nó sẽ có ích",
        "targetWord": "think",
        "options": [
          "think",
          "table",
          "house"
        ],
        "correctAnswer": "think"
      },
      {
        "id": "p1_q_11_4",
        "qNumber": 4,
        "prompt": "Read the information [gap] not quickly",
        "fullSentence": "Read the information slowly not quickly",
        "translation": "Đọc thông tin chậm rãi chứ không phải nhanh chóng",
        "targetWord": "slowly",
        "options": [
          "table",
          "slowly",
          "house"
        ],
        "correctAnswer": "slowly"
      },
      {
        "id": "p1_q_11_5",
        "qNumber": 5,
        "prompt": "Send me the results [gap] you go home not after",
        "fullSentence": "Send me the results before you go home not after",
        "translation": "Gửi cho tôi kết quả trước khi bạn về nhà chứ không phải sau",
        "targetWord": "before",
        "options": [
          "table",
          "before",
          "house"
        ],
        "correctAnswer": "before"
      }
    ],
    "cloverLevel": 3
  },
  {
    "id": "reading_p1_set_12",
    "setNumber": 12,
    "title": "Đề 12",
    "keyWords": [
      "station",
      "stops",
      "green",
      "dinner",
      "films"
    ],
    "sticker": "★★★★★ Hay ra",
    "cloverLevel": 5,
    "questions": [
      {
        "id": "p1_q_12_1",
        "qNumber": 1,
        "prompt": "Tomorrow I have to go to the main bus [gap] to meet my friend",
        "fullSentence": "Tomorrow I have to go to the main bus station to meet my friend",
        "translation": "Ngày mai tôi phải đến bến xe buýt chính để gặp bạn",
        "targetWord": "station",
        "options": [
          "airport",
          "station",
          "supermarket"
        ],
        "correctAnswer": "station"
      },
      {
        "id": "p1_q_12_2",
        "qNumber": 2,
        "prompt": "Luckily, one of the bus [gap] is very close to my house",
        "fullSentence": "Luckily, one of the bus stops is very close to my house",
        "translation": "May mắn thay, một trong những điểm dừng xe buýt rất gần nhà tôi",
        "targetWord": "stops",
        "options": [
          "bikes",
          "stops",
          "cars"
        ],
        "correctAnswer": "stops"
      },
      {
        "id": "p1_q_12_3",
        "qNumber": 3,
        "prompt": "My house is easy to find – it’s [gap] and stands out from the others",
        "fullSentence": "My house is easy to find – it’s green and stands out from the others",
        "translation": "Nhà tôi rất dễ tìm - nó màu xanh lá cây và nổi bật so với những nhà khác",
        "targetWord": "green",
        "options": [
          "green",
          "expensive",
          "tall"
        ],
        "correctAnswer": "green"
      },
      {
        "id": "p1_q_12_4",
        "qNumber": 4,
        "prompt": "This evening I’ll make some eggs for [gap] because I am busy",
        "fullSentence": "This evening I’ll make some eggs for dinner because I am busy",
        "translation": "Tối nay tôi sẽ làm một vài quả trứng cho bữa tối vì tôi bận",
        "targetWord": "dinner",
        "options": [
          "homework",
          "dinner",
          "football"
        ],
        "correctAnswer": "dinner"
      },
      {
        "id": "p1_q_12_5",
        "qNumber": 5,
        "prompt": "After that, we can sit down and watch our favorite [gap] together",
        "fullSentence": "After that, we can sit down and watch our favorite films together",
        "translation": "Sau đó, chúng tôi có thể ngồi lại và cùng nhau xem những bộ phim yêu thích",
        "targetWord": "films",
        "options": [
          "films",
          "music",
          "games"
        ],
        "correctAnswer": "films"
      }
    ]
  },
  {
    "id": "reading_p1_set_13",
    "setNumber": 13,
    "title": "Đề 13",
    "keyWords": [
      "near",
      "small",
      "shop",
      "people",
      "visit"
    ],
    "sticker": "Đề tủ",
    "cloverLevel": 4,
    "questions": [
      {
        "id": "p1_q_13_1",
        "qNumber": 1,
        "prompt": "I live in a house [gap] the park",
        "fullSentence": "I live in a house near the park",
        "translation": "Tôi sống trong một ngôi nhà gần công viên",
        "targetWord": "near",
        "options": [
          "table",
          "near",
          "have"
        ],
        "correctAnswer": "near"
      },
      {
        "id": "p1_q_13_2",
        "qNumber": 2,
        "prompt": "My house has a kitchen but it is very [gap]",
        "fullSentence": "My house has a kitchen but it is very small",
        "translation": "Nhà tôi có bếp nhưng rất nhỏ",
        "targetWord": "small",
        "options": [
          "red",
          "smell",
          "small"
        ],
        "correctAnswer": "small"
      },
      {
        "id": "p1_q_13_3",
        "qNumber": 3,
        "prompt": "I work at a [gap] to sell the clothes",
        "fullSentence": "I work at a shop to sell the clothes",
        "translation": "Tôi làm việc ở một cửa hàng bán quần áo",
        "targetWord": "shop",
        "options": [
          "window",
          "shop",
          "car"
        ],
        "correctAnswer": "shop"
      },
      {
        "id": "p1_q_13_4",
        "qNumber": 4,
        "prompt": "I can meet many [gap] and want to talk to them",
        "fullSentence": "I can meet many people and want to talk to them",
        "translation": "Tôi có thể gặp nhiều người và muốn nói chuyện với họ",
        "targetWord": "people",
        "options": [
          "animals",
          "trees",
          "people"
        ],
        "correctAnswer": "people"
      },
      {
        "id": "p1_q_13_5",
        "qNumber": 5,
        "prompt": "I am going to [gap] my hometown next week",
        "fullSentence": "I am going to visit my hometown next week",
        "translation": "Tôi dự định sẽ về thăm quê vào tuần tới",
        "targetWord": "visit",
        "options": [
          "talk",
          "visit",
          "show"
        ],
        "correctAnswer": "visit"
      }
    ]
  },
  {
    "id": "reading_p1_set_14",
    "setNumber": 14,
    "title": "Đề 14",
    "keyWords": [
      "morning",
      "friends",
      "leave",
      "good",
      "food"
    ],
    "sticker": "VIP",
    "cloverLevel": 4,
    "questions": [
      {
        "id": "p1_q_14_1",
        "qNumber": 1,
        "prompt": "I get up early in the [gap] and I go running",
        "fullSentence": "I get up early in the morning and I go running",
        "translation": "Tôi dậy sớm vào buổi sáng và đi chạy bộ",
        "targetWord": "morning",
        "options": [
          "night",
          "morning",
          "afternoon"
        ],
        "correctAnswer": "morning"
      },
      {
        "id": "p1_q_14_2",
        "qNumber": 2,
        "prompt": "My [gap] come and exercise with me",
        "fullSentence": "My friends come and exercise with me",
        "translation": "Bạn bè tôi đến tập thể dục cùng tôi",
        "targetWord": "friends",
        "options": [
          "enemies",
          "friends",
          "strangers"
        ],
        "correctAnswer": "friends"
      },
      {
        "id": "p1_q_14_3",
        "qNumber": 3,
        "prompt": "I [gap] my car at home and go for a walk",
        "fullSentence": "I leave my car at home and go for a walk",
        "translation": "Tôi để xe ở nhà và đi bộ",
        "targetWord": "leave",
        "options": [
          "sell",
          "leave",
          "drive"
        ],
        "correctAnswer": "leave"
      },
      {
        "id": "p1_q_14_4",
        "qNumber": 4,
        "prompt": "Exercise is [gap] for my body",
        "fullSentence": "Exercise is good for my body",
        "translation": "Tập thể dục rất tốt cho cơ thể tôi",
        "targetWord": "good",
        "options": [
          "bad",
          "good",
          "tired"
        ],
        "correctAnswer": "good"
      },
      {
        "id": "p1_q_14_5",
        "qNumber": 5,
        "prompt": "I usually drink a lot of water and eat healthy [gap]",
        "fullSentence": "I usually drink a lot of water and eat healthy food",
        "translation": "Tôi thường uống nhiều nước và ăn thực phẩm lành mạnh",
        "targetWord": "food",
        "options": [
          "smoke",
          "food",
          "sugar"
        ],
        "correctAnswer": "food"
      }
    ]
  },
  {
    "id": "reading_p1_set_15",
    "setNumber": 15,
    "title": "Đề 15",
    "keyWords": [
      "bicycle",
      "tall",
      "trees",
      "breakfast",
      "meditation"
    ],
    "sticker": "★★★★★ Hay ra",
    "cloverLevel": 4,
    "questions": [
      {
        "id": "p1_q_15_1",
        "qNumber": 1,
        "prompt": "I go to school by [gap]",
        "fullSentence": "I go to school by bicycle",
        "translation": "Tôi đi học bằng xe đạp",
        "targetWord": "bicycle",
        "options": [
          "board",
          "plane",
          "bicycle"
        ],
        "correctAnswer": "bicycle"
      },
      {
        "id": "p1_q_15_2",
        "qNumber": 2,
        "prompt": "The buildings in my city are very [gap]",
        "fullSentence": "The buildings in my city are very tall",
        "translation": "Những tòa nhà trong thành phố tôi rất cao",
        "targetWord": "tall",
        "options": [
          "hate",
          "tall",
          "busy"
        ],
        "correctAnswer": "tall"
      },
      {
        "id": "p1_q_15_3",
        "qNumber": 3,
        "prompt": "There are many green [gap] near my home",
        "fullSentence": "There are many green trees near my home",
        "translation": "Có rất nhiều cây xanh gần nhà tôi",
        "targetWord": "trees",
        "options": [
          "lands",
          "tea",
          "trees"
        ],
        "correctAnswer": "trees"
      },
      {
        "id": "p1_q_15_4",
        "qNumber": 4,
        "prompt": "I eat [gap] with my family every morning",
        "fullSentence": "I eat breakfast with my family every morning",
        "translation": "Tôi ăn sáng cùng gia đình mỗi sáng",
        "targetWord": "breakfast",
        "options": [
          "breakfast",
          "lunch",
          "dinner"
        ],
        "correctAnswer": "breakfast"
      },
      {
        "id": "p1_q_15_5",
        "qNumber": 5,
        "prompt": "I do [gap] to feel relaxed",
        "fullSentence": "I do meditation to feel relaxed",
        "translation": "Tôi tập thiền để cảm thấy thư giãn",
        "targetWord": "meditation",
        "options": [
          "make",
          "meditation",
          "exercise"
        ],
        "correctAnswer": "meditation"
      }
    ]
  },
  {
    "id": "reading_p1_set_16",
    "setNumber": 16,
    "title": "Đề 16",
    "keyWords": [
      "farm",
      "excited",
      "left",
      "street",
      "drink"
    ],
    "sticker": "Đề tủ",
    "cloverLevel": 3,
    "questions": [
      {
        "id": "p1_q_16_1",
        "qNumber": 1,
        "prompt": "My uncle works on a [gap]",
        "fullSentence": "My uncle works on a farm",
        "translation": "Chú tôi làm việc trong một nông trại",
        "targetWord": "farm",
        "options": [
          "farm",
          "factory",
          "office"
        ],
        "correctAnswer": "farm"
      },
      {
        "id": "p1_q_16_2",
        "qNumber": 2,
        "prompt": "The children were very [gap] about the trip",
        "fullSentence": "The children were very excited about the trip",
        "translation": "Bọn trẻ rất hào hứng về chuyến đi",
        "targetWord": "excited",
        "options": [
          "bored",
          "excited",
          "tired"
        ],
        "correctAnswer": "excited"
      },
      {
        "id": "p1_q_16_3",
        "qNumber": 3,
        "prompt": "Turn [gap] at the next corner",
        "fullSentence": "Turn left at the next corner",
        "translation": "Rẽ trái ở góc ngã rẽ tiếp theo",
        "targetWord": "left",
        "options": [
          "right",
          "left",
          "back"
        ],
        "correctAnswer": "left"
      },
      {
        "id": "p1_q_16_4",
        "qNumber": 4,
        "prompt": "We walked along the [gap] to the park",
        "fullSentence": "We walked along the street to the park",
        "translation": "Chúng tôi đi dọc theo con đường đến công viên",
        "targetWord": "street",
        "options": [
          "river",
          "street",
          "mountain"
        ],
        "correctAnswer": "street"
      },
      {
        "id": "p1_q_16_5",
        "qNumber": 5,
        "prompt": "I usually [gap] milk in the morning",
        "fullSentence": "I usually drink milk in the morning",
        "translation": "Tôi thường uống sữa vào buổi sáng",
        "targetWord": "drink",
        "options": [
          "eat",
          "drink",
          "cook"
        ],
        "correctAnswer": "drink"
      }
    ]
  },
  {
    "id": "reading_p1_set_17",
    "setNumber": 17,
    "title": "Đề 17",
    "keyWords": [
      "country",
      "clean",
      "class",
      "other",
      "words"
    ],
    "sticker": "VIP",
    "cloverLevel": 3,
    "questions": [
      {
        "id": "p1_q_17_1",
        "qNumber": 1,
        "prompt": "I want to travel to the [gap] this summer",
        "fullSentence": "I want to travel to the country this summer",
        "translation": "Tôi muốn về miền quê du lịch vào mùa hè này",
        "targetWord": "country",
        "options": [
          "country",
          "sky",
          "train"
        ],
        "correctAnswer": "country"
      },
      {
        "id": "p1_q_17_2",
        "qNumber": 2,
        "prompt": "Please keep your room [gap]",
        "fullSentence": "Please keep your room clean",
        "translation": "Xin vui lòng giữ phòng của bạn sạch sẽ",
        "targetWord": "clean",
        "options": [
          "dirty",
          "messy",
          "clean"
        ],
        "correctAnswer": "clean"
      },
      {
        "id": "p1_q_17_3",
        "qNumber": 3,
        "prompt": "We have English [gap] on Monday",
        "fullSentence": "We have English class on Monday",
        "translation": "Chúng tôi có tiết học tiếng Anh vào thứ Hai",
        "targetWord": "class",
        "options": [
          "class",
          "lunch",
          "game"
        ],
        "correctAnswer": "class"
      },
      {
        "id": "p1_q_17_4",
        "qNumber": 4,
        "prompt": "I like helping [gap] people",
        "fullSentence": "I like helping other people",
        "translation": "Tôi thích giúp đỡ những người khác",
        "targetWord": "other",
        "options": [
          "myself",
          "alone",
          "other"
        ],
        "correctAnswer": "other"
      },
      {
        "id": "p1_q_17_5",
        "qNumber": 5,
        "prompt": "Can you spell these [gap] for me?",
        "fullSentence": "Can you spell these words for me?",
        "translation": "Bạn có thể đánh vần những từ này giúp tôi được không?",
        "targetWord": "words",
        "options": [
          "numbers",
          "pictures",
          "words"
        ],
        "correctAnswer": "words"
      }
    ]
  },
  {
    "id": "reading_p1_set_18",
    "setNumber": 18,
    "title": "Đề 18",
    "keyWords": [
      "small",
      "stay",
      "garden",
      "trees",
      "old"
    ],
    "sticker": "Mới cập nhật",
    "cloverLevel": 3,
    "questions": [
      {
        "id": "p1_q_18_1",
        "qNumber": 1,
        "prompt": "My bedroom is very [gap]",
        "fullSentence": "My bedroom is very small",
        "translation": "Phòng ngủ của tôi rất nhỏ gọn",
        "targetWord": "small",
        "options": [
          "big",
          "small",
          "wide"
        ],
        "correctAnswer": "small"
      },
      {
        "id": "p1_q_18_2",
        "qNumber": 2,
        "prompt": "We usually [gap] at a hotel on vacation",
        "fullSentence": "We usually stay at a hotel on vacation",
        "translation": "Chúng tôi thường ở khách sạn vào kỳ nghỉ",
        "targetWord": "stay",
        "options": [
          "stay",
          "move",
          "travel"
        ],
        "correctAnswer": "stay"
      },
      {
        "id": "p1_q_18_3",
        "qNumber": 3,
        "prompt": "There are many flowers in the [gap]",
        "fullSentence": "There are many flowers in the garden",
        "translation": "Có rất nhiều hoa trong khu vườn",
        "targetWord": "garden",
        "options": [
          "kitchen",
          "garden",
          "garage"
        ],
        "correctAnswer": "garden"
      },
      {
        "id": "p1_q_18_4",
        "qNumber": 4,
        "prompt": "Some [gap] near my home are very tall",
        "fullSentence": "Some trees near my home are very tall",
        "translation": "Một số cây gần nhà tôi rất cao lớn",
        "targetWord": "trees",
        "options": [
          "houses",
          "trees",
          "cars"
        ],
        "correctAnswer": "trees"
      },
      {
        "id": "p1_q_18_5",
        "qNumber": 5,
        "prompt": "My grandfather is very [gap] but still strong",
        "fullSentence": "My grandfather is very old but still strong",
        "translation": "Ông tôi đã cao tuổi nhưng vẫn còn rất khỏe mạnh",
        "targetWord": "old",
        "options": [
          "young",
          "old",
          "busy"
        ],
        "correctAnswer": "old"
      }
    ]
  }
];
