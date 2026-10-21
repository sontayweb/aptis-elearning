// Reading Part 1 Authentic Question Bank - 19 Đề Chuẩn British Council
// Tối giản tiêu đề chỉ để lại số đề, tích hợp bản dịch hỗ trợ học viên

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
  sticker: string;
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
    "sticker": "☘️☘️☘️☘️☘️ Đề trọng điểm",
    "questions": [
      {
        "id": "p1_q_1_1",
        "qNumber": 1,
        "prompt": "I saw some shows in the [gap] of one store",
        "fullSentence": "I saw some shows in the window of one store",
        "translation": "Tôi nhìn thấy một vài chiếc cửa sổ trong một cửa hàng",
        "targetWord": "window",
        "options": [
          "house",
          "window",
          "table"
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
          "buy",
          "table"
        ],
        "correctAnswer": "buy"
      },
      {
        "id": "p1_q_1_3",
        "qNumber": 3,
        "prompt": "I [gap] some food at the market",
        "fullSentence": "I buy some food at the market",
        "translation": "Tôi mua một ít đồ ăn ở chợ",
        "targetWord": "buy",
        "options": [
          "house",
          "buy",
          "table"
        ],
        "correctAnswer": "buy"
      },
      {
        "id": "p1_q_1_4",
        "qNumber": 4,
        "prompt": "I ate [gap]",
        "fullSentence": "I ate cake",
        "translation": "Tôi đã ăn bánh",
        "targetWord": "cake",
        "options": [
          "house",
          "cake",
          "table"
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
          "house",
          "watched",
          "table"
        ],
        "correctAnswer": "watched"
      }
    ]
  },
  {
    "id": "reading_p1_set_2",
    "setNumber": 2,
    "title": "Đề 02",
    "keyWords": [
      "station",
      "stops",
      "green",
      "dinner",
      "films"
    ],
    "sticker": "☘️☘️☘️☘️☘️ Đề trọng điểm",
    "questions": [
      {
        "id": "p1_q_2_1",
        "qNumber": 1,
        "prompt": "Tomorrow I have to go to the main bus [gap] to meet my cousin.",
        "fullSentence": "Tomorrow I have to go to the main bus station to meet my cousin.",
        "translation": "Câu hỏi 1 trong đề 02",
        "targetWord": "station",
        "options": [
          "station",
          "airport",
          "supermarket"
        ],
        "correctAnswer": "station"
      },
      {
        "id": "p1_q_2_2",
        "qNumber": 2,
        "prompt": "Luckily, one of the bus [gap] is very close to my house.",
        "fullSentence": "Luckily, one of the bus stops is very close to my house.",
        "translation": "Câu hỏi 2 trong đề 02",
        "targetWord": "stops",
        "options": [
          "stops",
          "bikes",
          "cars"
        ],
        "correctAnswer": "stops"
      },
      {
        "id": "p1_q_2_3",
        "qNumber": 3,
        "prompt": "My house is easy to find – it’s [gap] and stands out from the others.",
        "fullSentence": "My house is easy to find – it’s green and stands out from the others.",
        "translation": "Câu hỏi 3 trong đề 02",
        "targetWord": "green",
        "options": [
          "green",
          "expensive",
          "tall"
        ],
        "correctAnswer": "green"
      },
      {
        "id": "p1_q_2_4",
        "qNumber": 4,
        "prompt": "This evening I’ll make some eggs for [gap] because it’s quick and simple.",
        "fullSentence": "This evening I’ll make some eggs for dinner because it’s quick and simple.",
        "translation": "Câu hỏi 4 trong đề 02",
        "targetWord": "dinner",
        "options": [
          "dinner",
          "homework",
          "football"
        ],
        "correctAnswer": "dinner"
      },
      {
        "id": "p1_q_2_5",
        "qNumber": 5,
        "prompt": "After that, we can relax and watch some [gap] together on TV.",
        "fullSentence": "After that, we can relax and watch some films together on TV.",
        "translation": "Câu hỏi 5 trong đề 02",
        "targetWord": "films",
        "options": [
          "apples",
          "films",
          "chairs"
        ],
        "correctAnswer": "films"
      }
    ]
  },
  {
    "id": "reading_p1_set_3",
    "setNumber": 3,
    "title": "Đề 03",
    "keyWords": [
      "station",
      "stops",
      "green",
      "dinner",
      "films"
    ],
    "sticker": "☘️☘️☘️☘️☘️ Đề trọng điểm",
    "questions": [
      {
        "id": "p1_q_3_1",
        "qNumber": 1,
        "prompt": "I take the bus to the main [gap]",
        "fullSentence": "I take the bus to the main station",
        "translation": "Câu hỏi 1 trong đề 03",
        "targetWord": "station",
        "options": [
          "house",
          "station",
          "table"
        ],
        "correctAnswer": "station"
      },
      {
        "id": "p1_q_3_2",
        "qNumber": 2,
        "prompt": "The bus [gap] are near my house",
        "fullSentence": "The bus stops are near my house",
        "translation": "Câu hỏi 2 trong đề 03",
        "targetWord": "stops",
        "options": [
          "house",
          "stops",
          "table"
        ],
        "correctAnswer": "stops"
      },
      {
        "id": "p1_q_3_3",
        "qNumber": 3,
        "prompt": "My house is [gap] and you can easily recognize by the color",
        "fullSentence": "My house is green and you can easily recognize by the color",
        "translation": "Câu hỏi 3 trong đề 03",
        "targetWord": "green",
        "options": [
          "house",
          "green",
          "table"
        ],
        "correctAnswer": "green"
      },
      {
        "id": "p1_q_3_4",
        "qNumber": 4,
        "prompt": "I cook egg for a quick [gap]",
        "fullSentence": "I cook egg for a quick dinner",
        "translation": "Câu hỏi 4 trong đề 03",
        "targetWord": "dinner",
        "options": [
          "house",
          "dinner",
          "table"
        ],
        "correctAnswer": "dinner"
      },
      {
        "id": "p1_q_3_5",
        "qNumber": 5,
        "prompt": "After dinner, we will watch movies on TV",
        "fullSentence": "After dinner, we will watch movies on TV",
        "translation": "Câu hỏi 5 trong đề 03",
        "targetWord": "films",
        "options": [
          "house",
          "films",
          "table"
        ],
        "correctAnswer": "films"
      }
    ]
  },
  {
    "id": "reading_p1_set_4",
    "setNumber": 4,
    "title": "Đề 04",
    "keyWords": [
      "Visit",
      "room",
      "hot",
      "train",
      "speak"
    ],
    "sticker": "☘️☘️☘️☘️☘️ Đề trọng điểm",
    "questions": [
      {
        "id": "p1_q_4_1",
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
        "id": "p1_q_4_2",
        "qNumber": 2,
        "prompt": "There was a big tree in the middle of the [gap]",
        "fullSentence": "There was a big tree in the middle of the room",
        "translation": "Tôi đi thăm ( visit) phòng (room) bạn vào mùa hè nên rất nóng (hot) phải đi tàu (train) và nói chuyện (speak) với mọi người.",
        "targetWord": "room",
        "options": [
          "house",
          "room",
          "table"
        ],
        "correctAnswer": "room"
      },
      {
        "id": "p1_q_4_3",
        "qNumber": 3,
        "prompt": "The weather was very [gap] that day",
        "fullSentence": "The weather was very hot that day",
        "translation": "Tôi đi thăm ( visit) phòng (room) bạn vào mùa hè nên rất nóng (hot) phải đi tàu (train) và nói chuyện (speak) với mọi người.",
        "targetWord": "hot",
        "options": [
          "house",
          "hot",
          "table"
        ],
        "correctAnswer": "hot"
      },
      {
        "id": "p1_q_4_4",
        "qNumber": 4,
        "prompt": "On the way home, I look the [gap]",
        "fullSentence": "On the way home, I look the train",
        "translation": "Tôi đi thăm ( visit) phòng (room) bạn vào mùa hè nên rất nóng (hot) phải đi tàu (train) và nói chuyện (speak) với mọi người.",
        "targetWord": "train",
        "options": [
          "house",
          "train",
          "table"
        ],
        "correctAnswer": "train"
      },
      {
        "id": "p1_q_4_5",
        "qNumber": 5,
        "prompt": "At the museum, I could [gap] with a tour guide about history",
        "fullSentence": "At the museum, I could speak with a tour guide about history",
        "translation": "Tôi đi thăm ( visit) phòng (room) bạn vào mùa hè nên rất nóng (hot) phải đi tàu (train) và nói chuyện (speak) với mọi người.",
        "targetWord": "speak",
        "options": [
          "house",
          "speak",
          "table"
        ],
        "correctAnswer": "speak"
      }
    ]
  },
  {
    "id": "reading_p1_set_5",
    "setNumber": 5,
    "title": "Đề 05",
    "keyWords": [
      "Visit",
      "Shops",
      "Red",
      "Dinner",
      "Watch"
    ],
    "sticker": "☘️☘️☘️☘️☘️ Đề trọng điểm",
    "questions": [
      {
        "id": "p1_q_5_1",
        "qNumber": 1,
        "prompt": "They book a flight to [gap] their relatives abroad.",
        "fullSentence": "They book a flight to visit their relatives abroad.",
        "translation": "Họ đặt vé máy bay đi thăm người thân ở nước ngoài.",
        "targetWord": "Visit",
        "options": [
          "house",
          "Visit",
          "table"
        ],
        "correctAnswer": "Visit"
      },
      {
        "id": "p1_q_5_2",
        "qNumber": 2,
        "prompt": "The airport has many [gap] selling souvenirs.",
        "fullSentence": "The airport has many shops selling souvenirs.",
        "translation": "Sân bay có nhiều cửa hàng bán đồ lưu niệm.",
        "targetWord": "Shops",
        "options": [
          "house",
          "Shops",
          "table"
        ],
        "correctAnswer": "Shops"
      },
      {
        "id": "p1_q_5_3",
        "qNumber": 3,
        "prompt": "Their luggage is [gap], making it easy to find at the terminal.",
        "fullSentence": "Their luggage is red, making it easy to find at the terminal.",
        "translation": "Hành lý của họ màu đỏ, rất dễ tìm thấy tại nhà ga.",
        "targetWord": "Red",
        "options": [
          "house",
          "Red",
          "table"
        ],
        "correctAnswer": "Red"
      },
      {
        "id": "p1_q_5_4",
        "qNumber": 4,
        "prompt": "For [gap], they try local street food with spicy flavor",
        "fullSentence": "For dinner, they try local street food with spicy flavor",
        "translation": "Bữa tối, họ thử các món ăn đường phố địa thử món ăn địa phương với hương vị cay nồng.",
        "targetWord": "Dinner",
        "options": [
          "house",
          "Dinner",
          "table"
        ],
        "correctAnswer": "Dinner"
      },
      {
        "id": "p1_q_5_5",
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
    ]
  },
  {
    "id": "reading_p1_set_6",
    "setNumber": 6,
    "title": "Đề 06",
    "keyWords": [
      "Home",
      "Customers",
      "Easy",
      "Prepare",
      "Watch"
    ],
    "sticker": "☘️☘️☘️☘️☘️ Đề trọng điểm",
    "questions": [
      {
        "id": "p1_q_6_1",
        "qNumber": 1,
        "prompt": "She uses her laptop to work from [gap] every day.",
        "fullSentence": "She uses her laptop to work from home every day.",
        "translation": "Cô ấy dùng máy tính xách tay để làm việc tại nhà mỗi ngày.",
        "targetWord": "Home",
        "options": [
          "house",
          "Home",
          "table"
        ],
        "correctAnswer": "Home"
      },
      {
        "id": "p1_q_6_2",
        "qNumber": 2,
        "prompt": "The café has free Wi-Fi for all [gap].",
        "fullSentence": "The café has free Wi-Fi for all customers.",
        "translation": "Quán cà phê có Wi-Fi miễn phí cho tất cả khách hàng.",
        "targetWord": "Customers",
        "options": [
          "house",
          "Customers",
          "table"
        ],
        "correctAnswer": "Customers"
      },
      {
        "id": "p1_q_6_3",
        "qNumber": 3,
        "prompt": "Her phone case is yellow, making it [gap] to spot.",
        "fullSentence": "Her phone case is yellow, making it easy to spot.",
        "translation": "Ốp lưng điện thoại của cô ấy màu vàng, rất dễ nhận biết.",
        "targetWord": "Easy",
        "options": [
          "house",
          "Easy",
          "table"
        ],
        "correctAnswer": "Easy"
      },
      {
        "id": "p1_q_6_4",
        "qNumber": 4,
        "prompt": "For snacks, they [gap] popcorn and fruit smoothies.",
        "fullSentence": "For snacks, they prepare popcorn and fruit smoothies.",
        "translation": "Về đồ ăn nhẹ, họ chuẩn bị bỏng ngô và sinh tố trái cây.",
        "targetWord": "Prepare",
        "options": [
          "house",
          "Prepare",
          "table"
        ],
        "correctAnswer": "Prepare"
      },
      {
        "id": "p1_q_6_5",
        "qNumber": 5,
        "prompt": "On weekends, they [gap] videos on their smart TV",
        "fullSentence": "On weekends, they watch videos on their smart TV",
        "translation": "Vào cuối tuần, họ xem video trên TV thông minh.",
        "targetWord": "Watch",
        "options": [
          "house",
          "Watch",
          "table"
        ],
        "correctAnswer": "Watch"
      }
    ]
  },
  {
    "id": "reading_p1_set_7",
    "setNumber": 7,
    "title": "Đề 07",
    "keyWords": [
      "Park",
      "classes",
      "silver",
      "breakfast",
      "meditation"
    ],
    "sticker": "☘️☘️☘️☘️☘️ Đề trọng điểm",
    "questions": [
      {
        "id": "p1_q_7_1",
        "qNumber": 1,
        "prompt": "She jogs in the [gap] every morning to stay fit",
        "fullSentence": "She jogs in the park every morning to stay fit",
        "translation": "Cô ấy chạy bộ trong công viên mỗi sáng để giữ dáng",
        "targetWord": "Park",
        "options": [
          "house",
          "Park",
          "table"
        ],
        "correctAnswer": "Park"
      },
      {
        "id": "p1_q_7_2",
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
        "id": "p1_q_7_3",
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
        "id": "p1_q_7_4",
        "qNumber": 4,
        "prompt": "For [gap], she blends a smoothie with berries and spinach",
        "fullSentence": "For breakfast, she blends a smoothie with berries and spinach",
        "translation": "Bữa sáng cô ấy xay sinh tố với các loại quả mọng và rau bina",
        "targetWord": "breakfast",
        "options": [
          "house",
          "breakfast",
          "table"
        ],
        "correctAnswer": "breakfast"
      },
      {
        "id": "p1_q_7_5",
        "qNumber": 5,
        "prompt": "After exercising they relax with a [gap] session at home",
        "fullSentence": "After exercising they relax with a meditation session at home",
        "translation": "Sau khi luyện tập họ thư giãn với một buổi thiền tại nhà",
        "targetWord": "meditation",
        "options": [
          "house",
          "meditation",
          "table"
        ],
        "correctAnswer": "meditation"
      }
    ]
  },
  {
    "id": "reading_p1_set_8",
    "setNumber": 8,
    "title": "Đề 08",
    "keyWords": [
      "Near",
      "Small",
      "Like",
      "Shop",
      "Talk"
    ],
    "sticker": "☘️☘️☘️☘️☘️ Đề trọng điểm",
    "questions": [
      {
        "id": "p1_q_8_1",
        "qNumber": 1,
        "prompt": "My new house is [gap] my job",
        "fullSentence": "My new house is near my job",
        "translation": "Ngôi nhà mới của tôi ở gần chỗ làm.",
        "targetWord": "Near",
        "options": [
          "house",
          "Near",
          "table"
        ],
        "correctAnswer": "Near"
      },
      {
        "id": "p1_q_8_2",
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
        "id": "p1_q_8_3",
        "qNumber": 3,
        "prompt": "It has a kitchen, and I really [gap] it.",
        "fullSentence": "It has a kitchen, and I really like it.",
        "translation": "Nhà tôi có bếp và tôi rất thích nó.",
        "targetWord": "Like",
        "options": [
          "house",
          "Like",
          "table"
        ],
        "correctAnswer": "Like"
      },
      {
        "id": "p1_q_8_4",
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
        "id": "p1_q_8_5",
        "qNumber": 5,
        "prompt": "I meet many people everyday, I [gap] to talk to them.",
        "fullSentence": "I meet many people everyday, I like to talk to them.",
        "translation": "Tôi gặp rất nhiều người mỗi ngày, tôi thích trò chuyện với họ.",
        "targetWord": "Like",
        "options": [
          "house",
          "Like",
          "table"
        ],
        "correctAnswer": "Like"
      }
    ]
  },
  {
    "id": "reading_p1_set_9",
    "setNumber": 9,
    "title": "Đề 09",
    "keyWords": [
      "Clear",
      "sun",
      "enjoyable",
      "working",
      "read"
    ],
    "sticker": "★★★★★ Hay ra",
    "questions": [
      {
        "id": "p1_q_9_1",
        "qNumber": 1,
        "prompt": "The water is [gap]",
        "fullSentence": "The water is clear",
        "translation": "Nước trong sạch",
        "targetWord": "Clear",
        "options": [
          "house",
          "Clear",
          "table"
        ],
        "correctAnswer": "Clear"
      },
      {
        "id": "p1_q_9_2",
        "qNumber": 2,
        "prompt": "The [gap] is out",
        "fullSentence": "The sun is out",
        "translation": "Mặt trời đang chiếu sáng",
        "targetWord": "sun",
        "options": [
          "house",
          "sun",
          "table"
        ],
        "correctAnswer": "sun"
      },
      {
        "id": "p1_q_9_3",
        "qNumber": 3,
        "prompt": "I have an [gap] holiday",
        "fullSentence": "I have an enjoyable holiday",
        "translation": "Tôi có một kỳ nghỉ thú vị",
        "targetWord": "enjoyable",
        "options": [
          "house",
          "enjoyable",
          "table"
        ],
        "correctAnswer": "enjoyable"
      },
      {
        "id": "p1_q_9_4",
        "qNumber": 4,
        "prompt": "After [gap] so hard",
        "fullSentence": "After working so hard",
        "translation": "Nước biển trong sạch (clear) dưới ánh mặt trời (sun) giúp kì nghỉ thêm thú vị (enjoyable) sau giờ làm việc (working) cho chúng ta và đọc (read) tài liệu",
        "targetWord": "working",
        "options": [
          "house",
          "working",
          "table"
        ],
        "correctAnswer": "working"
      },
      {
        "id": "p1_q_9_5",
        "qNumber": 5,
        "prompt": "I hope to [gap] your letter",
        "fullSentence": "I hope to read your letter",
        "translation": "Tôi hy vọng sẽ đọc được thư của bạn",
        "targetWord": "read",
        "options": [
          "house",
          "read",
          "table"
        ],
        "correctAnswer": "read"
      }
    ]
  },
  {
    "id": "reading_p1_set_10",
    "setNumber": 10,
    "title": "Đề 10",
    "keyWords": [
      "just",
      "too",
      "to",
      "some",
      "give"
    ],
    "sticker": "★★★★★ Hay ra",
    "questions": [
      {
        "id": "p1_q_10_1",
        "qNumber": 1,
        "prompt": "It is [gap] what I like",
        "fullSentence": "It is just what I like",
        "translation": "Đây chính là thứ tôi thích nhất",
        "targetWord": "just",
        "options": [
          "house",
          "just",
          "table"
        ],
        "correctAnswer": "just"
      },
      {
        "id": "p1_q_10_2",
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
        "id": "p1_q_10_3",
        "qNumber": 3,
        "prompt": "I am going [gap] wear it [gap] my birthday party",
        "fullSentence": "I am going to wear it to my birthday party",
        "translation": "Tôi sẽ mặc nó đến bữa tiệc sinh nhật của mình",
        "targetWord": "to",
        "options": [
          "house",
          "to",
          "table"
        ],
        "correctAnswer": "to"
      },
      {
        "id": "p1_q_10_4",
        "qNumber": 4,
        "prompt": "I will save you [gap] cake",
        "fullSentence": "I will save you some cake",
        "translation": "Tôi sẽ giữ lại một số bánh cho bạn",
        "targetWord": "some",
        "options": [
          "house",
          "some",
          "table"
        ],
        "correctAnswer": "some"
      },
      {
        "id": "p1_q_10_5",
        "qNumber": 5,
        "prompt": "Give my love [gap] everyone",
        "fullSentence": "Give my love to everyone",
        "translation": "Gửi tình yêu của tôi đến tất cả mọi ng",
        "targetWord": "to",
        "options": [
          "house",
          "to",
          "table"
        ],
        "correctAnswer": "to"
      }
    ]
  },
  {
    "id": "reading_p1_set_11",
    "setNumber": 11,
    "title": "Đề 11",
    "keyWords": [
      "miss",
      "called",
      "ready",
      "meet",
      "dinner"
    ],
    "sticker": "★★★★★ Hay ra",
    "questions": [
      {
        "id": "p1_q_11_1",
        "qNumber": 1,
        "prompt": "I imagine you don’t want to [gap] this",
        "fullSentence": "I imagine you don’t want to miss this",
        "translation": "Tôi nghĩ bạn ko muốn bỏ lỡ điều này",
        "targetWord": "miss",
        "options": [
          "house",
          "miss",
          "table"
        ],
        "correctAnswer": "miss"
      },
      {
        "id": "p1_q_11_2",
        "qNumber": 2,
        "prompt": "I [gap] you earlier but you were not home.",
        "fullSentence": "I called you earlier but you were not home.",
        "translation": "Tôi đã gọi cho bạn trc đó nhưng bạn không ở nhà",
        "targetWord": "called",
        "options": [
          "house",
          "called",
          "table"
        ],
        "correctAnswer": "called"
      },
      {
        "id": "p1_q_11_3",
        "qNumber": 3,
        "prompt": "Can you be [gap] before 7pm?",
        "fullSentence": "Can you be ready before 7pm?",
        "translation": "Bạn có thể sẵn sàng trước 7h tối ko",
        "targetWord": "ready",
        "options": [
          "house",
          "ready",
          "table"
        ],
        "correctAnswer": "ready"
      },
      {
        "id": "p1_q_11_4",
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
        "id": "p1_q_11_5",
        "qNumber": 5,
        "prompt": "Don't have too much [gap] because we're going to eat cake.",
        "fullSentence": "Don't have too much dinner because we're going to eat cake.",
        "translation": "Đừng ăn tối quá nhiều vì chúng ta sẽ ăn bánh",
        "targetWord": "dinner",
        "options": [
          "house",
          "dinner",
          "table"
        ],
        "correctAnswer": "dinner"
      }
    ]
  },
  {
    "id": "reading_p1_set_12",
    "setNumber": 12,
    "title": "Đề 12",
    "keyWords": [
      "friendly",
      "first",
      "walk",
      "speak",
      "together"
    ],
    "sticker": "★★★★★ Hay ra",
    "questions": [
      {
        "id": "p1_q_12_1",
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
        "id": "p1_q_12_2",
        "qNumber": 2,
        "prompt": "I can [gap] to my class",
        "fullSentence": "I can walk to my class",
        "translation": "Tôi gặp cô ấy lần đầu tiên",
        "targetWord": "walk",
        "options": [
          "house",
          "walk",
          "table"
        ],
        "correctAnswer": "walk"
      },
      {
        "id": "p1_q_12_3",
        "qNumber": 3,
        "prompt": "I meet her for the [gap] time",
        "fullSentence": "I meet her for the first time",
        "translation": "Tôi có thể đi bộ đến lớp học của mình",
        "targetWord": "first",
        "options": [
          "house",
          "first",
          "table"
        ],
        "correctAnswer": "first"
      },
      {
        "id": "p1_q_12_4",
        "qNumber": 4,
        "prompt": "She can [gap] 5 languages",
        "fullSentence": "She can speak 5 languages",
        "translation": "Cô ấy có thể nói 5 thứ tiếng",
        "targetWord": "speak",
        "options": [
          "house",
          "speak",
          "table"
        ],
        "correctAnswer": "speak"
      },
      {
        "id": "p1_q_12_5",
        "qNumber": 5,
        "prompt": "We eat dinner [gap]",
        "fullSentence": "We eat dinner together",
        "translation": "Chúng tôi ăn tối cùng nhau",
        "targetWord": "together",
        "options": [
          "house",
          "together",
          "table"
        ],
        "correctAnswer": "together"
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
    "sticker": "★★★★★ Hay ra",
    "questions": [
      {
        "id": "p1_q_13_1",
        "qNumber": 1,
        "prompt": "I live in a house [gap] the park.",
        "fullSentence": "I live in a house near the park.",
        "translation": "Câu hỏi 1 trong đề 13",
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
        "prompt": "My house has a kitchen but it is very [gap].",
        "fullSentence": "My house has a kitchen but it is very small.",
        "translation": "Câu hỏi 2 trong đề 13",
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
        "prompt": "I work at a [gap] to sell the clothes.",
        "fullSentence": "I work at a shop to sell the clothes.",
        "translation": "Câu hỏi 3 trong đề 13",
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
        "prompt": "I can meet many [gap] and want to talk to them.",
        "fullSentence": "I can meet many people and want to talk to them.",
        "translation": "Câu hỏi 4 trong đề 13",
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
        "prompt": "I am going to [gap] my hometown.",
        "fullSentence": "I am going to visit my hometown.",
        "translation": "Câu hỏi 5 trong đề 13",
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
    "sticker": "★★★★★ Hay ra",
    "questions": [
      {
        "id": "p1_q_14_1",
        "qNumber": 1,
        "prompt": "I get up early in the [gap] and I go running",
        "fullSentence": "I get up early in the morning and I go running",
        "translation": "Tôi dậy sớm và đi chạy bộ",
        "targetWord": "morning",
        "options": [
          "house",
          "morning",
          "table"
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
          "house",
          "friends",
          "table"
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
          "house",
          "leave",
          "table"
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
          "house",
          "good",
          "table"
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
          "house",
          "food",
          "table"
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
      "balance",
      "statement",
      "think",
      "slowly",
      "before"
    ],
    "sticker": "★★★★★ Hay ra",
    "questions": [
      {
        "id": "p1_q_15_1",
        "qNumber": 1,
        "prompt": "The budget doesn’t [gap]",
        "fullSentence": "The budget doesn’t balance",
        "translation": "Hãy cân bằng (balance) mọi thứ và tuyên bố (statement) suy nghĩ (think) của bạn về sống chậm (slowly) trước (before) tất cả mọi người",
        "targetWord": "balance",
        "options": [
          "house",
          "balance",
          "table"
        ],
        "correctAnswer": "balance"
      },
      {
        "id": "p1_q_15_2",
        "qNumber": 2,
        "prompt": "Could you get the financial [gap]?",
        "fullSentence": "Could you get the financial statement?",
        "translation": "Bạn có thể lấy báo cáo tài chính ko?",
        "targetWord": "statement",
        "options": [
          "house",
          "statement",
          "table"
        ],
        "correctAnswer": "statement"
      },
      {
        "id": "p1_q_15_3",
        "qNumber": 3,
        "prompt": "I [gap] it will help",
        "fullSentence": "I think it will help",
        "translation": "Tôi nghĩ nó sẽ có ích",
        "targetWord": "think",
        "options": [
          "house",
          "think",
          "table"
        ],
        "correctAnswer": "think"
      },
      {
        "id": "p1_q_15_4",
        "qNumber": 4,
        "prompt": "Read the information [gap] not quickly",
        "fullSentence": "Read the information slowly not quickly",
        "translation": "Hãy cân bằng (balance) mọi thứ và tuyên bố (statement) suy nghĩ (think) của bạn về sống chậm (slowly) trước (before) tất cả mọi người",
        "targetWord": "slowly",
        "options": [
          "house",
          "slowly",
          "table"
        ],
        "correctAnswer": "slowly"
      },
      {
        "id": "p1_q_15_5",
        "qNumber": 5,
        "prompt": "Send me the results [gap] you go home not after",
        "fullSentence": "Send me the results before you go home not after",
        "translation": "Gửi cho tôi kết quả trước khi bạn về nhà chứ không phải sau",
        "targetWord": "before",
        "options": [
          "house",
          "before",
          "table"
        ],
        "correctAnswer": "before"
      }
    ]
  },
  {
    "id": "reading_p1_set_16",
    "setNumber": 16,
    "title": "Đề 16",
    "keyWords": [
      "bicycle",
      "tall",
      "trees",
      "breakfast",
      "meditation"
    ],
    "sticker": "★★★★★ Hay ra",
    "questions": [
      {
        "id": "p1_q_16_1",
        "qNumber": 1,
        "prompt": "I go to school by board /plane/ [gap]",
        "fullSentence": "I go to school by board /plane/ bicycle",
        "translation": "Câu hỏi 1 trong đề 16",
        "targetWord": "bicycle",
        "options": [
          "house",
          "bicycle",
          "table"
        ],
        "correctAnswer": "bicycle"
      },
      {
        "id": "p1_q_16_2",
        "qNumber": 2,
        "prompt": "The buildings in my city are very hate /[gap] /busy",
        "fullSentence": "The buildings in my city are very hate /tall /busy",
        "translation": "Câu hỏi 2 trong đề 16",
        "targetWord": "tall",
        "options": [
          "house",
          "tall",
          "table"
        ],
        "correctAnswer": "tall"
      },
      {
        "id": "p1_q_16_3",
        "qNumber": 3,
        "prompt": "There are many green lands/ tea/ [gap] near my home.",
        "fullSentence": "There are many green lands/ tea/ trees near my home.",
        "translation": "Câu hỏi 3 trong đề 16",
        "targetWord": "trees",
        "options": [
          "house",
          "trees",
          "table"
        ],
        "correctAnswer": "trees"
      },
      {
        "id": "p1_q_16_4",
        "qNumber": 4,
        "prompt": "I eat [gap]/ lunch /dinner with my family every morning.",
        "fullSentence": "I eat breakfast/ lunch /dinner with my family every morning.",
        "translation": "Câu hỏi 4 trong đề 16",
        "targetWord": "breakfast",
        "options": [
          "house",
          "breakfast",
          "table"
        ],
        "correctAnswer": "breakfast"
      },
      {
        "id": "p1_q_16_5",
        "qNumber": 5,
        "prompt": "I do make/ [gap] to feel relaxed.",
        "fullSentence": "I do make/ meditation to feel relaxed.",
        "translation": "Câu hỏi 5 trong đề 16",
        "targetWord": "meditation",
        "options": [
          "meditation",
          "exercise"
        ],
        "correctAnswer": "meditation"
      }
    ]
  },
  {
    "id": "reading_p1_set_17",
    "setNumber": 17,
    "title": "Đề 17",
    "keyWords": [
      "farm",
      "excited",
      "left",
      "street",
      "drink"
    ],
    "sticker": "★★★★★ Hay ra",
    "questions": [
      {
        "id": "p1_q_17_1",
        "qNumber": 1,
        "prompt": "My uncle works on a [gap]/ factory/ office .",
        "fullSentence": "My uncle works on a farm/ factory/ office .",
        "translation": "Câu hỏi 1 trong đề 17",
        "targetWord": "farm",
        "options": [
          "house",
          "farm",
          "table"
        ],
        "correctAnswer": "farm"
      },
      {
        "id": "p1_q_17_2",
        "qNumber": 2,
        "prompt": "The children were very bored/ [gap]/ tired about the trip.",
        "fullSentence": "The children were very bored/ excited/ tired about the trip.",
        "translation": "Câu hỏi 2 trong đề 17",
        "targetWord": "excited",
        "options": [
          "house",
          "excited",
          "table"
        ],
        "correctAnswer": "excited"
      },
      {
        "id": "p1_q_17_3",
        "qNumber": 3,
        "prompt": "Turn right/ [gap]/ back at the next corner.",
        "fullSentence": "Turn right/ left/ back at the next corner.",
        "translation": "Câu hỏi 3 trong đề 17",
        "targetWord": "left",
        "options": [
          "house",
          "left",
          "table"
        ],
        "correctAnswer": "left"
      },
      {
        "id": "p1_q_17_4",
        "qNumber": 4,
        "prompt": "We walked along the river/ [gap]/ mountain to the park.",
        "fullSentence": "We walked along the river/ street/ mountain to the park.",
        "translation": "Câu hỏi 4 trong đề 17",
        "targetWord": "street",
        "options": [
          "house",
          "street",
          "table"
        ],
        "correctAnswer": "street"
      },
      {
        "id": "p1_q_17_5",
        "qNumber": 5,
        "prompt": "I usually eat/ [gap]/ cook milk in the morning.",
        "fullSentence": "I usually eat/ drink/ cook milk in the morning.",
        "translation": "Câu hỏi 5 trong đề 17",
        "targetWord": "drink",
        "options": [
          "house",
          "drink",
          "table"
        ],
        "correctAnswer": "drink"
      }
    ]
  },
  {
    "id": "reading_p1_set_18",
    "setNumber": 18,
    "title": "Đề 18",
    "keyWords": [
      "country",
      "clean",
      "class",
      "other",
      "words"
    ],
    "sticker": "★★★★★ Hay ra",
    "questions": [
      {
        "id": "p1_q_18_1",
        "qNumber": 1,
        "prompt": "I want to travel to the [gap] this summer.",
        "fullSentence": "I want to travel to the country this summer.",
        "translation": "Câu hỏi 1 trong đề 18",
        "targetWord": "country",
        "options": [
          "country",
          "sky",
          "train"
        ],
        "correctAnswer": "country"
      },
      {
        "id": "p1_q_18_2",
        "qNumber": 2,
        "prompt": "Please keep your room [gap].",
        "fullSentence": "Please keep your room clean.",
        "translation": "Câu hỏi 2 trong đề 18",
        "targetWord": "clean",
        "options": [
          "dirty",
          "messy",
          "clean"
        ],
        "correctAnswer": "clean"
      },
      {
        "id": "p1_q_18_3",
        "qNumber": 3,
        "prompt": "We have English [gap] on Monday.",
        "fullSentence": "We have English class on Monday.",
        "translation": "Câu hỏi 3 trong đề 18",
        "targetWord": "class",
        "options": [
          "class",
          "lunch",
          "game"
        ],
        "correctAnswer": "class"
      },
      {
        "id": "p1_q_18_4",
        "qNumber": 4,
        "prompt": "I like helping [gap] people.",
        "fullSentence": "I like helping other people.",
        "translation": "Câu hỏi 4 trong đề 18",
        "targetWord": "other",
        "options": [
          "myself",
          "alone",
          "other"
        ],
        "correctAnswer": "other"
      },
      {
        "id": "p1_q_18_5",
        "qNumber": 5,
        "prompt": "Can you spell these [gap] for me?",
        "fullSentence": "Can you spell these words for me?",
        "translation": "Câu hỏi 5 trong đề 18",
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
    "id": "reading_p1_set_19",
    "setNumber": 19,
    "title": "Đề 19",
    "keyWords": [
      "small",
      "stay",
      "garden",
      "trees",
      "old"
    ],
    "sticker": "★★★★★ Hay ra",
    "questions": [
      {
        "id": "p1_q_19_1",
        "qNumber": 1,
        "prompt": "My bedroom is very [gap] .",
        "fullSentence": "My bedroom is very small .",
        "translation": "Câu hỏi 1 trong đề 19",
        "targetWord": "small",
        "options": [
          "big",
          "small",
          "wide"
        ],
        "correctAnswer": "small"
      },
      {
        "id": "p1_q_19_2",
        "qNumber": 2,
        "prompt": "We usually [gap] at a hotel on vacation.",
        "fullSentence": "We usually stay at a hotel on vacation.",
        "translation": "Câu hỏi 2 trong đề 19",
        "targetWord": "stay",
        "options": [
          "stay",
          "move",
          "travel"
        ],
        "correctAnswer": "stay"
      },
      {
        "id": "p1_q_19_3",
        "qNumber": 3,
        "prompt": "There are many flowers in the [gap] .",
        "fullSentence": "There are many flowers in the garden .",
        "translation": "Câu hỏi 3 trong đề 19",
        "targetWord": "garden",
        "options": [
          "kitchen",
          "garden",
          "garage"
        ],
        "correctAnswer": "garden"
      },
      {
        "id": "p1_q_19_4",
        "qNumber": 4,
        "prompt": "Some [gap] near my home are very tall.",
        "fullSentence": "Some trees near my home are very tall.",
        "translation": "Câu hỏi 4 trong đề 19",
        "targetWord": "trees",
        "options": [
          "houses",
          "trees",
          "cars"
        ],
        "correctAnswer": "trees"
      },
      {
        "id": "p1_q_19_5",
        "qNumber": 5,
        "prompt": "My grandfather is very [gap] but still strong.",
        "fullSentence": "My grandfather is very old but still strong.",
        "translation": "Câu hỏi 5 trong đề 19",
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
