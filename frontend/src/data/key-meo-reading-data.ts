/**
 * Dữ liệu chuẩn cho tính năng Key và Mẹo Thi Aptis - Reading (Part 1 - 4)
 * Thiết kế chuẩn theo ảnh mẫu và tài liệu Part 2-Reading-Meo-Thi.md.
 */

export interface ReadingP2Topic {
  id: string;
  num: number;
  title: string;
  fullTitle: string;
  emoji: string;
  pairs: { en: string; vn: string }[];
  summary: string;
}

export interface ReadingPartData {
  partNumber: number;
  title: string;
  badge: string;
  subtitle: string;
  overview: string;
  recommendedTime: string;
  tips: string[];
  mistakesToAvoid: string[];
  quickRemember: {
    highlight: string;
    description: string;
  };
  // Part 1 specific
  cluesP1?: { questionPattern: string; answerType: string }[];
  exampleP1?: {
    question: string;
    options: string;
    correctAnswer: string;
    explanation: string;
  };
  // Part 2 specific
  topicsP2?: ReadingP2Topic[];
  // Part 3 specific
  paraphraseTrapsP3?: {
    questionKeyword: string;
    passageSynonym: string;
    trapNote: string;
  }[];
  // Part 4 specific
  headingStrategiesP4?: {
    headingType: string;
    clueKeywords: string;
    guide: string;
  }[];
}

export const READING_P2_TOPICS: ReadingP2Topic[] = [
  {
    "id": "topic-1",
    "num": 1,
    "title": "College Welcoming Day",
    "fullTitle": "College Welcoming Day",
    "emoji": "🎓",
    "pairs": [
      {
        "en": "Today will begin at 10 a.M. With a short presentation.",
        "vn": "Ngày hôm nay sẽ bắt đầu lúc 10 giờ sáng bằng một bài thuyết trình ngắn."
      },
      {
        "en": "At the end of the presentation, you will meet the heads of departments and lecturers.",
        "vn": "Sau khi kết thúc bài thuyết trình, quý vị sẽ gặp gỡ các trưởng bộ môn và giảng viên."
      },
      {
        "en": "These staff members will then take you on a tour of the school's buildings and sports facilities in small groups.",
        "vn": "Sau đó, các nhân viên này sẽ hướng dẫn quý vị tham quan các tòa và cơ sở vật chất thể thao của trường theo từng nhóm nhỏ."
      },
      {
        "en": "During this tour, you will need to stay with these staff members until lunchtime.",
        "vn": "Trong chuyến tham quan này, quý vị cần đi cùng các nhân viên cho đến giờ ăn trưa."
      },
      {
        "en": "Lunch will be provided on the second floor of the engineering building.",
        "vn": "Bữa trưa sẽ được phục vụ tại tầng hai của tòa nhà kỹ thuật."
      }
    ],
    "summary": "Ngày hội nhập học bắt đầu bằng bài thuyết trình ( presentation ) và gặp gỡ trưởng bộ môn ( head of department) sau đó tham quan trường ( school’s building ) bữa trưa (lunchtime) được phục vụ tại tầng hai ( second floor)"
  },
  {
    "id": "topic-2",
    "num": 2,
    "title": "Cultural festival",
    "fullTitle": "Cultural festival ( lễ hội văn hoá )",
    "emoji": "🎭",
    "pairs": [
      {
        "en": "The cultural festival was held on Sunday, celebrating local traditions.",
        "vn": "Lễ hội văn hoá được tổ chức vào chủ nhật, tôn vinh các truyền thống địa phương"
      },
      {
        "en": "About 70 people participated, with Ms. Nguyen leading a dance group.",
        "vn": "Khoảng 70 người đã tham gia, với sự dẫn dắt của cô Nguyên, một nhóm nhảy"
      },
      {
        "en": "Activities included pottery workshops, folk music, and food tasting",
        "vn": "Các hoạt động bao gồm hội thảo gốm, âm nhạc dân gian và thưởng thức ẩm thực"
      },
      {
        "en": "Families enjoyed the event, taking photos and sharing meals",
        "vn": "Các gia đình đã cùng nhau tận hưởng sự kiện, chụp ảnh và chia sẻ bữa ăn"
      },
      {
        "en": "After the main event, awards were given for the best costume",
        "vn": "Sau sự kiện chính, các giải thưởng đã được trao cho trang phục đẹp nhất"
      }
    ],
    "summary": "Lễ hội tổ chức vào chủ nhật ( on Sunday) , bà Nguyen ( Ms Nguyen ) người  tổ chức hoạt động ( activities ) và chụp ảnh ( taking photo ) rồi trao giải ( awards) cho mọi người"
  },
  {
    "id": "topic-3",
    "num": 3,
    "title": "End of term project",
    "fullTitle": "End of term project (Dự án cuối kỳ)",
    "emoji": "📝",
    "pairs": [
      {
        "en": "Your end of term project needs to focus on at least two of them.",
        "vn": "Bài tập cuối kỳ của bạn cần tập trung vào ít nhất hai trong số các chủ đề trên."
      },
      {
        "en": "It has to include relevant pictures and  your own written text about the topic",
        "vn": "Bài tập phải bao gồm hình ảnh liên quan và bài viết của riêng bạn về chủ đề."
      },
      {
        "en": "You then have to use these pictures and  your written work to create a  presentation for the class.",
        "vn": "Sau đó, bạn phải sử dụng những hình ảnh này  và bài viết của mình để tạo một bài thuyết trình cho lớp"
      },
      {
        "en": "This talk will give your key points and it should be around five minutes.",
        "vn": "Bài thuyết trình này sẽ nêu ra những điểm chính của bạn và kéo dài khoảng năm phút."
      },
      {
        "en": "After this time, other students will be able to ask some questions and you will answer those.",
        "vn": "Sau thời gian này, các sinh viên khác sẽ có thể đặt một số câu hỏi và bạn sẽ trả lời những câu hỏi đó."
      }
    ],
    "summary": "Bài tập cuối kỳ ( end of term project ) cần có hình ảnh và bài viết ( pictures and written ) để thuyết trình (presentation ) trong 5 phút (five minutes) sau đó trả lời câu hỏi (answer)"
  },
  {
    "id": "topic-4",
    "num": 4,
    "title": "Family sport day/Weekend activities",
    "fullTitle": "Family sport day/Weekend activities",
    "emoji": "🏆",
    "pairs": [
      {
        "en": "It took place on Saturday morning, there was a 10-meter race for adults.",
        "vn": "Sáng thứ bảy cuộc thi chạy bộ 10km dành cho người lớn đã diễn ra"
      },
      {
        "en": "Sixty people took part, and among them, Ms. Kamus kept the fastest pace and won the race.",
        "vn": "Có 60 người đàn ông và phụ nữ tham gia, trong đó cô Kamus giữ tốc độ nhanh nhất và giành chiến thắng"
      },
      {
        "en": "After she received her prize, the following time was dedicated to children’s activities.",
        "vn": "Sau khi nhận giải, chương trình tiếp theo dành cho các hoạt động dành cho trẻ em"
      },
      {
        "en": "The activities included football, swimming, skipping, and more, and the kids played happily together.",
        "vn": "Các hoạt động bao gồm bóng đá, bơi lội, nhảy dây và các em nhỏ đã cùng nhau chơi rất vui vẻ"
      },
      {
        "en": "After finishing the games, the children were very hungry and ate with their parents.",
        "vn": "Sau khi chơi xong các em đói bụng và cùng ăn với bố mẹ"
      }
    ],
    "summary": "Ngày hội thể thao diễn ra vào thứ 7 ( saturday ) ms kamus ( ms kamus) thắng giải, sau khi nhận giải (after.. prize) là các hoạt động ( the activities ) và ăn uống ( ate )"
  },
  {
    "id": "topic-5",
    "num": 5,
    "title": "Famous singer ver 1",
    "fullTitle": "Famous singer ver 1",
    "emoji": "🎤",
    "pairs": [
      {
        "en": "Before becoming famous, he studied music at school when he was 15\\.",
        "vn": "Trước khi trở nên nổi tiếng, anh ấy đã theo học âm nhạc tại trường vào năm 15 tuổi."
      },
      {
        "en": "His unique way of dressing and performing made him stand out from others.",
        "vn": "Phong cách ăn mặc và biểu diễn độc đáo đã giúp anh ấy trở nên khác biệt so với những người khác."
      },
      {
        "en": "This helped him receive many invitations for collaborations and performances.",
        "vn": "Điều này mang lại cho anh nhiều lời mời hợp tác và biểu diễn."
      },
      {
        "en": "He eventually became famous among audiences around the world.",
        "vn": "Cuối cùng, anh ấy đã trở nên nổi tiếng với khán giả trên khắp thế giới."
      },
      {
        "en": "Today, he is a successful singer with many fans.",
        "vn": "Ngày nay, anh ấy là một ca sĩ thành công với đông đảo người hâm mộ."
      }
    ],
    "summary": "Khi 15 (15)  tuổi với phong cách ăn mặc và biểu diễn độc đáo ( unique way of dressing ) anh ấy đã có nhiều lời mời hợp tác ( invitations for collaborations performance ) và trở nên nổi tiếng ( became famous ) cho đến ngày nay (today)"
  },
  {
    "id": "topic-6",
    "num": 6,
    "title": "The famous singer ver 2",
    "fullTitle": "The famous singer ver 2 ( ca sĩ nổi tiếng )",
    "emoji": "🎤",
    "pairs": [
      {
        "en": "He is a famous singer who is loved by many fans.",
        "vn": "Anh là một ca sĩ nổi tiếng được đông đảo người hâm mộ yêu mến."
      },
      {
        "en": "At the age of fifteen, he studied music at a special school",
        "vn": "Năm 15 tuổi, anh theo học âm nhạc tại một trường chuyên biệt."
      },
      {
        "en": "Before becoming famous, he had to practice very hard every day",
        "vn": "Trước khi nổi tiếng, anh đã phải luyện tập rất chăm chỉ mỗi ngày."
      },
      {
        "en": "With his unique style and clothes, he soon attracted attention.",
        "vn": "Với phong cách và trang phục độc đáo, anh nhanh chóng thu hút sự chú ý."
      },
      {
        "en": "Thanks to his talent and style, he became more and more famous and well-known.",
        "vn": "Nhờ tài năng và phong cách của mình, anh ngày càng nổi tiếng và được nhiều người biết đến"
      }
    ],
    "summary": "Anh ấy là ca sĩ nổi tiếng (famous singer) khi 15 tuổi (15\\) anh ấy luyện tập chăm chỉ (practice very hard) và thu hút mọi người ( attracted attention ) và nổi tiếng (well \\-known)"
  },
  {
    "id": "topic-7",
    "num": 7,
    "title": "The famous singer ver 3",
    "fullTitle": "The famous singer ver 3 ( ca sĩ nổi tiếng )",
    "emoji": "🎤",
    "pairs": [
      {
        "en": "Before becoming famous at this young age, he studied art and music at high school.",
        "vn": "Trước khi nổi tiếng ở độ tuổi còn trẻ như vậy, anh ấy từng học nghệ thuật và âm nhạc tại trường trung học."
      },
      {
        "en": "During this education, he learned to be creative and practice singing on the stage.",
        "vn": "Trong suốt quá trình học tập đó, anh ấy đã học cách sáng tạo và rèn luyện kỹ năng ca hát trên sân khấu.."
      },
      {
        "en": "On these performances, he liked to wear bright clothes and paint his face.",
        "vn": "Trong các buổi biểu diễn, anh ấy thường chọn mặc những bộ trang phục rực rỡ và vẽ lên khuôn mặt mình."
      },
      {
        "en": "This strange way of dressing and his songs have attracted people's attention.",
        "vn": "Phong cách ăn mặc khác lạ cùng các bài hát của anh ấy đã thu hút sự chú ý của mọi người."
      },
      {
        "en": "They started to follow him on social media and now he is very popular.",
        "vn": "Họ bắt đầu theo dõi anh ấy trên mạng xã hội và giờ đây anh ấy đã trở nên rất nổi tiếng."
      }
    ],
    "summary": "Trong quá trình học tại trường âm nhạc ( studied music at high school) anh ấy đã luyện kỹ năng hát (practice singing) và vẽ lên khuôn mặt (paint his face) để thu hút sự chú ý ( attract people's attention ) và trở nên nổi tiếng ( very popular)"
  },
  {
    "id": "topic-8",
    "num": 8,
    "title": "Making films",
    "fullTitle": "Making films ( đóng phim )",
    "emoji": "🎬",
    "pairs": [
      {
        "en": "The films in that time period were very different from the films of today.",
        "vn": "Phim ảnh thời đó rất khác so với phim ảnh ngày nay."
      },
      {
        "en": "This is because these films were only in all 2 black and white, and they also had no sound.",
        "vn": "Lý do là vì chúng chỉ toàn đen trắng và không có tiếng."
      },
      {
        "en": "In addition to these technological limitations, the film producers has also a very low budget",
        "vn": "Bên cạnh những hạn chế về công nghệ, kinh phí làm phim cũng rất thấp."
      },
      {
        "en": "This lack of money affected mostly the actors, so they didn’t earn much money.",
        "vn": "Do thiếu kinh phí, các bộ phim này chủ yếu ảnh hưởng đến diễn viên, nên họ không kiếm được nhiều tiền từ việc diễn xuất."
      },
      {
        "en": "Things have changed over time, and some of them now earn thousands of dollars after appearing in films.",
        "vn": "Mọi thứ đã thay đổi theo thời gian, diễn viên có thể kiếm được hàng ngàn đô la sau khi xuất hiện trong phim."
      }
    ],
    "summary": "Phim thời xưa và nay khác nhau ( different) chỉ có màu đen và trắng ( black & white ) và chi phí thấp ( low budget ) ảnh hưởng đến diễn viên ( affected actors) nhưng bây giờ đã thay đổi ( have changed)"
  },
  {
    "id": "topic-9",
    "num": 9,
    "title": "The first American woman in space",
    "fullTitle": "The first American woman in space",
    "emoji": "🚀",
    "pairs": [
      {
        "en": "Encouraged by her parents, she decided to study science at university.",
        "vn": "Được cha mẹ khuyến khích, cô quyết định theo học ngành khoa học ở bậc đại học."
      },
      {
        "en": "Her outstanding academic performance earned her a spot in a training program in the United States.",
        "vn": "Thành tích học tập xuất sắc đã giúp cô giành được một suất tham gia chương trình đào tạo tại Hoa Kỳ."
      },
      {
        "en": "Her passion for space led Mae to join a dedicated research team.",
        "vn": "Niềm đam mê vũ trụ đã thôi thúc Mae gia nhập một nhóm nghiên cứu chuyên trách."
      },
      {
        "en": "As a member of the team, she traveled into space and carried out numerous experiments.",
        "vn": "Với tư cách là thành viên của nhóm, cô đã bay vào vũ trụ và thực hiện nhiều thí nghiệm."
      },
      {
        "en": "Some of these experiments involved growing plants and observing animals aboard the spacecraft.",
        "vn": "Một số thí nghiệm trong số đó bao gồm việc trồng cây và quan sát động vật trên tàu vũ trụ."
      }
    ],
    "summary": "Cô học khoa ngành khoa học ( science) và được học bổng hoa kỳ (united states) với niềm đam mê ( passion) cô đã bay vào vũ trụ (into space) và thực hiện trồng cây ( growing plants)"
  },
  {
    "id": "topic-10",
    "num": 10,
    "title": "Presentation",
    "fullTitle": "Presentation ( thuyết trình )",
    "emoji": "📊",
    "pairs": [
      {
        "en": "First, we prepare materials for our group presentation.",
        "vn": "Đầu tiên chúng tôi chuẩn bị tài liệu cho bài thuyết trình nhóm."
      },
      {
        "en": "Then, we present our topic for five minutes.",
        "vn": "Sau đó chúng tôi trình bày chủ đề trong năm phút"
      },
      {
        "en": "During the presentation, we use pictures and our own words to explain the ideas.",
        "vn": "Trong bài thuyết trình, chúng tôi sử dụng hình ảnh và lời văn của mình để giải thích các ý tưởng."
      },
      {
        "en": "After the presentation, the other students ask questions.",
        "vn": "Sau khi thuyết trình, các sinh viên khác đặt câu hỏi"
      },
      {
        "en": "Finally, group members take turns answering the questions.",
        "vn": "Cuối cùng các thành viên trong nhóm lần lượt trả lời các câu hỏi"
      }
    ],
    "summary": "Đầu tiên cần chuẩn bị ( prepare ) sau đó thuyết trình ( present ) và giải thích ( explain ) và đặt câu hỏi ( question ) và trả lời ( answering )"
  },
  {
    "id": "topic-11",
    "num": 11,
    "title": "The history of transportation",
    "fullTitle": "The history of transportation (Lịch sử của giao thông)",
    "emoji": "🚆",
    "pairs": [
      {
        "en": "In the past, traveling was something only wealthy people could afford.",
        "vn": "Trước đây, du lịch là điều chỉ những người giàu có mới có khả năng chi trả."
      },
      {
        "en": "The development of trains and cars made travel more convenient and affordable for the general public.",
        "vn": "Sự phát triển của tàu hỏa và ô tô đã giúp việc đi lại trở nên thuận tiện và vừa túi tiền hơn đối với đại đa số người dân"
      },
      {
        "en": "Later on, airplanes also helped make traveling easier and more accessible",
        "vn": "Về sau, máy bay cũng góp phần giúp việc đi lại trở nên thuận tiện và dễ tiếp cận hơn."
      },
      {
        "en": "Because flying is very fast, it supports travel for both holidays and business purposes.",
        "vn": "Nhờ tốc độ di chuyển rất nhanh, máy bay hỗ trợ đắc lực cho cả nhu cầu du lịch nghỉ dưỡng lẫn các chuyến công tác."
      },
      {
        "en": "Today, improvements in transportation make it easier to travel to many parts of the world",
        "vn": "Ngày nay, những cải tiến trong lĩnh vực giao thông vận tải giúp việc di chuyển đến nhiều nơi trên thế giới trở nên dễ dàng hơn."
      }
    ],
    "summary": "Trước đây người giàu ( wealthy people) đi du lịch bằng tàu hoả và oto ( train and car ) và máy bay ( air planes ) cho các kỳ nghỉ và công tác ( holiday and business) và ngày nay thì dễ dàng hơn (easier)"
  },
  {
    "id": "topic-12",
    "num": 12,
    "title": "The history of transportation",
    "fullTitle": "The history of transportation (Lịch sử của giao thông)",
    "emoji": "🚗",
    "pairs": [
      {
        "en": "In the past, only rich people could afford to travel.",
        "vn": "Trước đây, chỉ những người giàu mới có thể đi du lịch"
      },
      {
        "en": "The invention of trains and cars made travel easier and affordable for everyone.",
        "vn": "Sự ra đời của tàu hỏa và ô tô đã giúp việc đi lại trở nên dễ dàng và tiết kiệm hơn cho tất cả mọi người."
      },
      {
        "en": "After the two means of transportation, travel was also easier with airplanes.",
        "vn": "Sau hai phương tiện giao thông này, việc đi lại cũng trở nên dễ dàng hơn với máy bay."
      },
      {
        "en": "Flying was so fast so it helps people to travel especially for holiday and business.",
        "vn": "Máy bay rất nhanh nên giúp mọi người di  chuyển, đặc biệt là đi nghỉ dưỡng và công tác."
      },
      {
        "en": "Nowadays, traveling to different parts of the world is easier with improvements.",
        "vn": "Ngày nay, việc đi lại đến các nơi khác nhau trên thế giới trở nên dễ dàng hơn nhờ những cải tiến."
      }
    ],
    "summary": "Trước đây người giàu ( rich people) đi du lịch bằng tàu hoả và oto ( train and car ) và máy bay ( air planes ) cho các kỳ nghỉ và công tác ( holiday and business) và ngày nay thì dễ dàng hơn (easier)"
  },
  {
    "id": "topic-13",
    "num": 13,
    "title": "Mae",
    "fullTitle": "Mae",
    "emoji": "🔬",
    "pairs": [
      {
        "en": "His father was a doctor, and his mother  was a teacher.",
        "vn": "Cha anh là bác sĩ, mẹ anh là giáo viên"
      },
      {
        "en": "They supported Mae to go to university where he studied science.",
        "vn": "Họ đã hỗ trợ Mae theo học đại học ngành khoa học"
      },
      {
        "en": "Mae planted ideas, worked hard, and achieved early success.",
        "vn": "Mae đã ấp ủ ý tưởng, làm việc chăm chỉ và đạt được thành công ban đầu."
      },
      {
        "en": "After that, he joined a dedicated team.",
        "vn": "Sau đó, anh gia nhập một đội ngũ tận tụy."
      },
      {
        "en": "Finally, he received a valuable training course in the United States.",
        "vn": "Cuối cùng, anh đã nhận được một khóa đào tạo giá trị tại Hoa Kỳ."
      }
    ],
    "summary": "Bố và mẹ ( father & doctor) hỗ trợ (supported) mae. Mae chăm chỉ ( work hard ) và gia nhập đội ngũ ( join ) đào tạo tại hoa kỳ ( united states)"
  },
  {
    "id": "topic-14",
    "num": 14,
    "title": "Music festival",
    "fullTitle": "Music festival",
    "emoji": "🎵",
    "pairs": [
      {
        "en": "The event was fully planned, financed, and supported by local authorities.",
        "vn": "Sự kiện này được chính quyền địa phương lên kế hoạch, tài trợ và hỗ trợ toàn diện"
      },
      {
        "en": "As a result, entry was free, and around five thousand people attended.",
        "vn": "Nhờ đó, vé vào cửa hoàn toàn miễn phí và đã có khoảng năm nghìn người đến tham dự."
      },
      {
        "en": "Many attendees arrived early and browsed local shops before the event began.",
        "vn": "Nhiều người đã đến sớm và dạo quanh các cửa hàng địa phương trước khi sự kiện bắt đầu."
      },
      {
        "en": "Despite the busy day, workers finished ahead of schedule and watched the famous singer perform.",
        "vn": "Dù công việc trong ngày rất bận rộn, các nhân viên vẫn hoàn thành nhiệm vụ sớm hơn dự kiến ​​và kịp xem màn trình diễn của ca sĩ nổi tiếng."
      },
      {
        "en": "The two-hour performance thrilled the audience, leaving everyone in high spirits.",
        "vn": "Buổi biểu diễn kéo dài hai giờ đồng hồ đã khiến khán giả vô cùng phấn khích và mang lại niềm hân hoan cho tất cả mọi người."
      }
    ],
    "summary": "Sự kiện ( the event ) được tổ chức miễn phí (entry free) nên nhiều người đã đến sớm ( arrived early) để xem ca sĩ nổi tiếng (famous singer ) biểu diễn trong hai giờ ( two \\- hour)"
  },
  {
    "id": "topic-15",
    "num": 15,
    "title": "A new café in town",
    "fullTitle": "A new café in town ( bản 1 )",
    "emoji": "☕",
    "pairs": [
      {
        "en": "I arrived at the shop early in the morning, but it was crowded with people.",
        "vn": "Tôi đến quán vào sáng sớm nhưng nơi này đã đông đúc khách."
      },
      {
        "en": "A waiter assisted me in finding a table and handed me the menu.",
        "vn": "Một nhân viên phục vụ đã giúp tôi tìm bàn và đưa thực đơn cho tôi."
      },
      {
        "en": "The menu was not as good as expected and quite pricey, so I decided to order a sandwich.",
        "vn": "Thực đơn không ngon như mong đợi và giá khá cao, nên tôi quyết định gọi món bánh mì kẹp."
      },
      {
        "en": "The sandwich was both delicious and beautifully presented.",
        "vn": "Món bánh mì kẹp vừa ngon miệng vừa được trình bày đẹp mắt."
      },
      {
        "en": "I might return to try different types of drinks next time.",
        "vn": "Có thể tôi sẽ quay lại để thử các loại đồ uống khác vào lần tới."
      }
    ],
    "summary": "Quán cafe rất đông ( crowded) nhưng tôi vẫn có bàn ( table) và gọi sandwich (sandwich). sandwich ngon (delicious) nên tôi sẽ quay lại ( return ) lần sau"
  },
  {
    "id": "topic-16",
    "num": 16,
    "title": "A new café in town",
    "fullTitle": "A new café in town ( bản 2 )",
    "emoji": "☕",
    "pairs": [
      {
        "en": "When I was at the coffee shop it was very crowded and the staff were very busy on the first day",
        "vn": "Khi tôi đến quán cafe, quán đông nghịt người, và nhân viên thì làm việc rất chăm chỉ trong ngày đầu tiên."
      },
      {
        "en": "Although it was busy the staff still arranged a table for me",
        "vn": "Mặc dù rất bận rộn nhưng nhân viên vẫn sắp xếp bàn cho tôi"
      },
      {
        "en": "They gave me the menu and when I looked at it I saw quite a few dishes",
        "vn": "Họ đưa cho tôi menu, khi tôi nhìn thấy menu tôi thấy rất ít món ăn"
      },
      {
        "en": "I looked at all of those and chose the most expensive sandwich",
        "vn": "Tôi xem tất cả món ăn, và quyết định gọi một trong những chiếc bánh sandwich đắt nhất."
      },
      {
        "en": "It tasted quite good with cheese toppings and I will definitely go back to this place.",
        "vn": "Nó khá ngon với lớp phủ phô mai, nên chắc  chắn tôi sẽ quay lại\\!"
      }
    ],
    "summary": "Quán cafe rất đông ( crowded) nhưng tôi vẫn có bàn ( table) và xem menu ( menu) rồi chọn món đắt nhất (most expensive) và nó rất ngon ( tasted good)"
  },
  {
    "id": "topic-17",
    "num": 17,
    "title": "A new café in town",
    "fullTitle": "A new café in town ( bản 3 )",
    "emoji": "☕",
    "pairs": [
      {
        "en": "It was my first time visiting a new local coffee shop.",
        "vn": "Đây là lần đầu tiên tôi ghé thăm một quán cà phê mới trong khu vực."
      },
      {
        "en": "At first, I didn't think it would be good, but I decided to give it a try.",
        "vn": "Ban đầu, tôi không nghĩ nó sẽ ngon, nhưng tôi vẫn quyết định thử xem sao."
      },
      {
        "en": "I looked at the menu and saw many different kinds of food and drinks.",
        "vn": "Tôi xem thực đơn và thấy có rất nhiều loại đồ ăn, thức uống khác nhau."
      },
      {
        "en": "I chose one dish to try for myself.",
        "vn": "Tôi chọn một món để dùng thử."
      },
      {
        "en": "When I tasted it, I found it really delicious and knew I would come back again.",
        "vn": "Khi nếm thử, tôi thấy món đó thực sự rất ngon và biết chắc mình sẽ quay lại lần nữa."
      }
    ],
    "summary": "Tôi ghé thăm một quán cà phê mới trong khu vực. ( visiting new local coffee shop ) và không nghĩ nó ngon ( didn’t think it would be good). Sau khi xem thực đơn (looked at the menu) tôi chọn một món ( choose one dish) và thấy nó ngon ( delicious)"
  },
  {
    "id": "topic-18",
    "num": 18,
    "title": "Family sport day/Weekend activities",
    "fullTitle": "Family sport day/Weekend activities",
    "emoji": "🗺️",
    "pairs": [
      {
        "en": "It took place on Saturday morning, there was a 10-meter race for adults.",
        "vn": "Sáng thứ bảy cuộc thi chạy bộ 10km dành cho người lớn đã diễn ra"
      },
      {
        "en": "Sixty people took part, and among them, Ms. Kamus kept the fastest pace and won the race.",
        "vn": "Có 60 người đàn ông và phụ nữ tham gia, trong đó cô Kamus giữ tốc độ nhanh nhất và giành chiến thắng"
      },
      {
        "en": "After she received her prize, the following time was dedicated to children’s activities.",
        "vn": "Sau khi nhận giải, chương trình tiếp theo dành cho các hoạt động dành cho trẻ em"
      },
      {
        "en": "The activities included football, swimming, skipping, and more, and the kids played happily together.",
        "vn": "Các hoạt động bao gồm bóng đá, bơi lội, nhảy dây và các em nhỏ đã cùng nhau chơi rất vui vẻ"
      },
      {
        "en": "After finishing the games, the children were very hungry and ate with their parents.",
        "vn": "Sau khi chơi xong các em đói bụng và cùng ăn với bố mẹ"
      }
    ],
    "summary": "Ngày hội thể thao diễn ra vào thứ 7 ( saturday ) ms kamus ( ms kamus) thắng giải, sau khi nhận giải (after.. prize) là các hoạt động ( the activities ) và ăn uống ( ate )"
  },
  {
    "id": "topic-19",
    "num": 19,
    "title": "Preparing to Write about a Place",
    "fullTitle": "Preparing to Write about a Place ( đề mới)",
    "emoji": "🎪",
    "pairs": [
      {
        "en": "Before writing, it is important to research the place carefully.",
        "vn": "Trước khi viết điều quan trọng là phải nghiên cứu kỹ địa điểm"
      },
      {
        "en": "Sometimes you may not be able to visit the place, but you can still find similar information elsewhere.",
        "vn": "Đôi khi bạn có thể không đến thăm địa điểm đó, nhưng bạn vẫn có thể tìm thấy thông tin tương tự ở nơi khác"
      },
      {
        "en": "To prepare well, you need to learn about the people and the history of the place.",
        "vn": "Để chuẩn bị tốt, bạn cần tìm hiểu về con người và lịch sử của địa điểm đó"
      },
      {
        "en": "Comparing that place with your own country can be very useful.",
        "vn": "So sánh địa điểm đó với đất nước của bạn có thể rất hữu ích"
      },
      {
        "en": "This comparison will help you develop a deeper understanding and write more effectively.",
        "vn": "So sánh này sẽ giúp bạn hiểu sâu hơn và viết hiệu quả hơn"
      }
    ],
    "summary": "Trước khi viết (before writing) hãy đi thăm địa điểm (visit the place) và học thêm về lịch sử (history of the place ) so sánh các địa điểm (compare) để có hiệu quả hơn ( more effectively )"
  },
  {
    "id": "topic-20",
    "num": 20,
    "title": "Cultural festival",
    "fullTitle": "Cultural festival ( lễ hội văn hoá )",
    "emoji": "🌿",
    "pairs": [
      {
        "en": "The cultural festival was held on Sunday, celebrating local traditions.",
        "vn": "Lễ hội văn hoá được tổ chức vào chủ nhật, tôn vinh các truyền thống địa phương"
      },
      {
        "en": "About 70 people participated, with Ms. Nguyen leading a dance group.",
        "vn": "Khoảng 70 người đã tham gia, với sự dẫn dắt của cô Nguyên, một nhóm nhảy"
      },
      {
        "en": "Activities included pottery workshops, folk music, and food tasting",
        "vn": "Các hoạt động bao gồm hội thảo gốm, âm nhạc dân gian và thưởng thức ẩm thực"
      },
      {
        "en": "Families enjoyed the event, taking photos and sharing meals",
        "vn": "Các gia đình đã cùng nhau tận hưởng sự kiện, chụp ảnh và chia sẻ bữa ăn"
      },
      {
        "en": "After the main event, awards were given for the best costume",
        "vn": "Sau sự kiện chính, các giải thưởng đã được trao cho trang phục đẹp nhất"
      }
    ],
    "summary": "Lễ hội tổ chức vào chủ nhật ( on Sunday) , bà Nguyen ( Ms Nguyen ) người  tổ chức hoạt động ( activities ) và chụp ảnh ( taking photo ) rồi trao giải ( awards) cho mọi người"
  }
];

export const READING_KEY_MEO_DATA: Record<string, ReadingPartData> = {
  p1: {
    partNumber: 1,
    title: "Aptis Reading – Part 1",
    badge: "British Council +1",
    subtitle: "Chọn từ phù hợp để hoàn thành 5 chỗ trống trong một đoạn văn ngắn (email hoặc tin nhắn)",
    overview:
      "Part 1 gồm một đoạn văn ngắn dưới dạng email hoặc tin nhắn. Có 5 chỗ trống, nhiệm vụ là chọn từ phù hợp để hoàn thành từng câu. Phần này kiểm tra khả năng hiểu nghĩa câu, ngữ pháp và cách sử dụng từ trong ngữ cảnh.",
    recommendedTime: "~ 4 phút",
    tips: [
      "Đọc toàn bộ đoạn văn: Hiểu tình huống ai viết, viết cho ai và nội dung gì.",
      "Đọc cả câu có chỗ trống: Không chỉ nhìn riêng từ đứng trước hoặc sau chỗ trống.",
      "Xác định loại từ cần điền: Danh từ, động từ, tính từ, trạng từ hay giới từ.",
      "Đọc tất cả các phương án: Loại những đáp án sai về ngữ pháp hoặc không hợp nghĩa.",
      "Điền đáp án rồi đọc lại: Đọc lại cả câu để kiểm tra ngữ pháp và sự liền mạch.",
    ],
    cluesP1: [
      { questionPattern: "a / an / the + ___", answerType: "Thường cần danh từ" },
      { questionPattern: "be + ___", answerType: "Có thể cần tính từ hoặc V-ing / V3" },
      { questionPattern: "can / should / must + ___", answerType: "Động từ nguyên mẫu (V-inf)" },
      { questionPattern: "very / really + ___", answerType: "Thường cần tính từ hoặc trạng từ" },
      { questionPattern: "interested ___", answerType: 'Giới từ "in"' },
      { questionPattern: "look forward to + ___", answerType: "Danh từ hoặc V-ing" },
    ],
    mistakesToAvoid: [
      "Chỉ nhìn một từ gần chỗ trống mà không đọc cả câu.",
      "Chọn từ đúng nghĩa nhưng sai loại từ.",
      "Nhầm tính từ đuôi -ed và -ing: interested / interesting.",
      "Không kiểm tra giới từ đi kèm động từ hoặc tính từ.",
      "Dành quá nhiều thời gian cho một câu khó.",
    ],
    exampleP1: {
      question: "I am very _______ about joining the English club.",
      options: "A. excite | B. excited | C. exciting",
      correctAnswer: "B. excited",
      explanation: 'Cấu trúc "be excited about + N/V-ing" diễn tả cảm thấy hào hứng về điều gì đó.',
    },
    quickRemember: {
      highlight: "ĐỌC CẢ CÂU → XÁC ĐỊNH LOẠI TỪ → KIỂM TRA NGỮ PHÁP → KIỂM TRA NGHĨA",
      description: "Hãy đọc toàn bộ câu thay vì chỉ nhìn từ gần chỗ trống để tránh bẫy ngữ pháp.",
    },
  },

  p2: {
    partNumber: 2,
    title: "APTIS READING • PART 2: ĐỐI CHIẾU CẶP CÂU 🔍",
    badge: "British Council +1",
    subtitle: "Đọc hiểu liên kết: Đối chiếu đoạn văn gốc và phân tích đáp án có từ khóa biến thể (paraphrasing).",
    overview:
      "Part 2 gồm các bài đọc sắp xếp câu hoặc đối chiếu cặp câu. Nắm vững trật tự câu gốc, từ khóa móc nối và bản dịch nghĩa song song giúp bạn chọn chính xác thứ tự đoạn văn mà không mất thời gian dịch mò.",
    recommendedTime: "~ 6 - 8 phút",
    tips: [
      "Xác định câu mở đầu (Topic Sentence): Thường là câu giới thiệu thời gian, địa điểm hoặc nhân vật chính.",
      "Tìm từ nối và đại từ chỉ định: First, Then, After that, These staff members, This lack of money.",
      "Đối chiếu các từ khóa chính giữa câu trước và câu sau để bắt mạch liên kết logic.",
      "Ghi nhớ các cụm tóm tắt mẹo nhớ độc quyền của từng chủ đề để nhận diện ngay khi gặp đề thi thật.",
    ],
    topicsP2: READING_P2_TOPICS,
    mistakesToAvoid: [
      "Đọc câu đơn lẻ mà không liên kết với câu đứng trước.",
      "Bỏ qua các đại từ thay thế (He, She, They, This, These).",
      "Xếp các câu có liên từ đối lập (However, In contrast) lên đầu đoạn.",
    ],
    quickRemember: {
      highlight: "Bắt từ khóa móc nối + Đại từ thay thế",
      description: "Đọc câu gốc song song dịch nghĩa → Ghi nhớ cụm từ khóa cốt lõi của từng thẻ đề hot.",
    },
  },

  p3: {
    partNumber: 3,
    title: "Aptis Reading – Part 3",
    badge: "Nối ý kiến người nói (Opinion Matching)",
    subtitle: "Đọc 4 đoạn văn ngắn của 4 người (A, B, C, D) và ghép với 7 nhận định tương ứng.",
    overview:
      "Part 3 đưa ra 4 đoạn văn ngắn (A, B, C, D) chia sẻ ý kiến của 4 người về một chủ đề chung. Có 7 nhận định và bạn cần xác định mỗi nhận định thuộc về ai.",
    recommendedTime: "~ 8 - 10 phút",
    tips: [
      "Đọc 7 câu nhận định TRƯỚC TIÊN, gạch chân từ khóa chỉ nội dung và tính từ cảm xúc.",
      "Tìm từ đồng nghĩa (Paraphrasing): Đề thi Aptis không dùng y nguyên từ trong câu hỏi vào bài đọc.",
      "Cảnh giác bẫy từ vựng trùng 100%: Câu nào trong bài đọc có từ giống hệt câu hỏi thường là bẫy.",
      "Kỹ thuật Skimming & Scanning: Đọc lướt nhanh 4 đoạn để nắm ý chung, sau đó quét chi tiết tìm bằng chứng.",
    ],
    paraphraseTrapsP3: [
      {
        questionKeyword: "Low cost / Affordable",
        passageSynonym: "didn't cost a fortune / reasonable price / on a tight budget",
        trapNote: "Bài đọc có từ 'expensive' xuất hiện ở người khác để gài bẫy.",
      },
      {
        questionKeyword: "Disappointed with the service",
        passageSynonym: "far below my expectations / the staff was unhelpful",
        trapNote: "Nếu chỉ tìm từ 'disappointed' sẽ không ra đáp án vì đề dùng từ đồng nghĩa.",
      },
      {
        questionKeyword: "Wants to pursue as a career",
        passageSynonym: "hope to do this professionally / turn my passion into a living",
        trapNote: "Cụm 'turn passion into a living' chính là 'career'.",
      },
    ],
    mistakesToAvoid: [
      "Đọc chi tiết toàn bộ 4 đoạn văn từ đầu đến cuối trước khi đọc câu hỏi.",
      "Chọn đáp án chỉ vì thấy có 1 từ vựng trùng khớp trong bài.",
      "Bỏ qua các từ mang nghĩa phủ định tinh vi: rarely, hardly, seldom.",
    ],
    quickRemember: {
      highlight: "Đọc 7 nhận định trước → Tìm Synonyms trong bài",
      description: "Quét từ đồng nghĩa (Paraphrase) giữa nhận định và đoạn văn A, B, C, D.",
    },
  },

  p4: {
    partNumber: 4,
    title: "Aptis Reading – Part 4",
    badge: "Nối tiêu đề đoạn văn (Heading Matching)",
    subtitle: "Đọc bài luận dài (~750 từ) gồm 7-8 đoạn văn. Chọn tiêu đề phù hợp nhất cho mỗi đoạn.",
    overview:
      "Part 4 là bài đọc dài nhất (~750 từ), chia thành 7–8 đoạn văn về một chủ đề học thuật hoặc khoa học thường thức. Bạn cần chọn tiêu đề tóm tắt ý chính chính xác nhất cho từng đoạn.",
    recommendedTime: "~ 12 - 14 phút",
    tips: [
      "Nguyên tắc 'Đầu - Cuối': Đọc câu đầu tiên (Topic Sentence) và câu kết thúc của từng đoạn văn để nắm ý chính (Main Idea).",
      "Nếu câu đầu và cuối chưa đủ rõ, hãy lướt nhanh phần giữa đoạn để tìm từ khóa lặp lại nhiều nhất.",
      "Phương pháp loại trừ: Tiêu đề nào đã được chọn chắc chắn thì gạch bỏ khỏi danh sách lựa chọn.",
    ],
    headingStrategiesP4: [
      {
        headingType: "Lịch sử & Nguồn gốc (History / Origins)",
        clueKeywords: "began, originally, in the 19th century, first discovered, past",
        guide: "Đoạn văn chứa nhiều mốc thời gian, kể về sự ra đời sơ khai của đối tượng.",
      },
      {
        headingType: "Lợi ích & Ưu điểm (Benefits / Positive impacts)",
        clueKeywords: "advantage, effective, improve, beneficial, promote, valuable",
        guide: "Đoạn văn nêu những mặt tích cực, đóng góp tốt cho con người hoặc xã hội.",
      },
      {
        headingType: "Khó khăn & Thách thức (Challenges / Problems)",
        clueKeywords: "difficult, struggle, risk, concern, threaten, drawback",
        guide: "Đoạn văn chỉ ra rủi ro, tranh cãi hoặc điểm yếu đang phải đối mặt.",
      },
    ],
    mistakesToAvoid: [
      "Chọn tiêu đề chỉ nói về 1 chi tiết nhỏ hoặc một ví dụ minh họa trong đoạn.",
      "Dành quá nhiều thời gian cố đọc dịch từng câu chữ của cả bài 750 từ.",
    ],
    quickRemember: {
      highlight: "Đọc Câu Đầu & Câu Cuối đoạn văn",
      description: "Đọc Câu 1 + Câu cuối → Bắt Main Idea → Ghép Tiêu đề mang tính khái quát nhất.",
    },
  },
};
