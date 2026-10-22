// Speaking Part 2 Authentic Question & Picture Bank
// Extracted and normalized from SPEAKING/Tranh trọng điểm part 2.docx
// Format: Title simplified to 'Đề 01', 'Đề 02'... categorized as 'Tranh trọng điểm Part 2'

export interface SpeakingVocabItem {
  en: string;
  vi: string;
}

export interface SpeakingPart2Topic {
  id: string;
  topicNumber: number;
  title: string;
  originalDescription?: string;
  category?: string;
  imageUrl: string;
  vocab: SpeakingVocabItem[];
  questions: string[];
}

export const SPEAKING_PART2_BANK: SpeakingPart2Topic[] = [
  {
    "id": "p2_1",
    "topicNumber": 1,
    "title": "Đề 01",
    "imageUrl": "/uploads/speaking/part2/image15.png",
    "questions": [
      "Describe the picture.",
      "Tell me about a time when you did some work.",
      "Why is it important for people to enjoy their work?"
    ],
    "vocab": [
      {
        "en": "office",
        "vi": "văn phòng"
      },
      {
        "en": "colleagues",
        "vi": "đồng nghiệp"
      },
      {
        "en": "desk",
        "vi": "bàn làm việc"
      },
      {
        "en": "computer",
        "vi": "máy tính"
      },
      {
        "en": "laptop",
        "vi": "máy tính xách tay"
      },
      {
        "en": "chair",
        "vi": "ghế"
      },
      {
        "en": "work",
        "vi": "làm việc"
      },
      {
        "en": "sit",
        "vi": "ngồi"
      },
      {
        "en": "meeting",
        "vi": "cuộc họp"
      },
      {
        "en": "face mask",
        "vi": "khẩu trang"
      }
    ],
    "originalDescription": "Nhóm người trong phòng họp",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_2",
    "topicNumber": 2,
    "title": "Đề 02",
    "imageUrl": "/uploads/speaking/part2/image22.png",
    "questions": [
      "Describe the picture.",
      "The last time you read the news",
      "Do you think that technological advancements and the Internet make people distant?"
    ],
    "vocab": [
      {
        "en": "couple",
        "vi": "cặp đôi"
      },
      {
        "en": "living room",
        "vi": "phòng khách"
      },
      {
        "en": "sofa",
        "vi": "ghế sofa"
      },
      {
        "en": "woman",
        "vi": "người phụ nữ"
      },
      {
        "en": "man",
        "vi": "người đàn ông"
      },
      {
        "en": "book",
        "vi": "sách"
      },
      {
        "en": "game controller",
        "vi": "tay cầm chơi game"
      },
      {
        "en": "read",
        "vi": "đọc"
      },
      {
        "en": "play games",
        "vi": "chơi game"
      },
      {
        "en": "relax",
        "vi": "thư giãn"
      }
    ],
    "originalDescription": "Hai vợ chồng ở phòng khách",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_3",
    "topicNumber": 3,
    "title": "Đề 03",
    "imageUrl": "/uploads/speaking/part2/image18.png",
    "questions": [
      "Describe the picture.",
      "The last time you went to a small shop?",
      "Why is shopping on the internet so popular?"
    ],
    "vocab": [
      {
        "en": "supermarket",
        "vi": "siêu thị"
      },
      {
        "en": "customer",
        "vi": "khách hàng"
      },
      {
        "en": "vegetables",
        "vi": "rau củ"
      },
      {
        "en": "fruit",
        "vi": "trái cây"
      },
      {
        "en": "shopping cart",
        "vi": "xe đẩy hàng"
      },
      {
        "en": "shelves",
        "vi": "kệ hàng"
      },
      {
        "en": "food",
        "vi": "thực phẩm"
      },
      {
        "en": "shopping",
        "vi": "mua sắm"
      },
      {
        "en": "choose",
        "vi": "lựa chọn"
      },
      {
        "en": "fresh",
        "vi": "tươi"
      },
      {
        "en": "family",
        "vi": "gia đình"
      },
      {
        "en": "parents",
        "vi": "bố mẹ"
      },
      {
        "en": "children",
        "vi": "trẻ em / con cái"
      },
      {
        "en": "kitchen",
        "vi": "nhà bếp"
      },
      {
        "en": "dining table",
        "vi": "bàn ăn"
      },
      {
        "en": "meal",
        "vi": "bữa ăn"
      },
      {
        "en": "food",
        "vi": "đồ ăn"
      },
      {
        "en": "cook",
        "vi": "nấu ăn"
      },
      {
        "en": "eat",
        "vi": "ăn"
      },
      {
        "en": "together",
        "vi": "cùng nhau"
      }
    ],
    "originalDescription": "Cô gái đi siêu thị",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_4",
    "topicNumber": 4,
    "title": "Đề 04",
    "imageUrl": "/uploads/speaking/part2/image9.png",
    "questions": [
      "Describe the picture.",
      "Why do people enjoy eating together?",
      "Young people are too busy to cook for their families?"
    ],
    "vocab": [
      {
        "en": "bus",
        "vi": "xe buýt"
      },
      {
        "en": "passengers",
        "vi": "hành khách"
      },
      {
        "en": "seat",
        "vi": "ghế ngồi"
      },
      {
        "en": "driver",
        "vi": "tài xế"
      },
      {
        "en": "window",
        "vi": "cửa sổ"
      },
      {
        "en": "journey",
        "vi": "chuyến đi / hành trình"
      },
      {
        "en": "travel",
        "vi": "đi du lịch / di chuyển"
      },
      {
        "en": "sit",
        "vi": "ngồi"
      },
      {
        "en": "crowded",
        "vi": "đông đúc"
      },
      {
        "en": "comfortable",
        "vi": "thoải mái"
      }
    ],
    "originalDescription": "Gia đình trong phòng bếp",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_5",
    "topicNumber": 5,
    "title": "Đề 05",
    "imageUrl": "/uploads/speaking/part2/image10.png",
    "questions": [
      "Describe the picture.",
      "Tell me about the last time you traveled with a group.",
      "What are the benefits of traveling with a group?"
    ],
    "vocab": [],
    "originalDescription": "Nhóm người trên xe khách",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_6",
    "topicNumber": 6,
    "title": "Đề 06",
    "imageUrl": "/uploads/speaking/part2/image16.png",
    "questions": [
      "Describe the picture.",
      "Tell me about an animal that you like",
      "How important are animals in our lives?"
    ],
    "vocab": [
      {
        "en": "Horse",
        "vi": "Con ngựa"
      },
      {
        "en": "Horseback riding",
        "vi": "Cưỡi ngựa"
      },
      {
        "en": "Rider",
        "vi": "Người cưỡi ngựa"
      },
      {
        "en": "Saddle",
        "vi": "Yên ngựa"
      },
      {
        "en": "Bridle",
        "vi": "Dây cương"
      },
      {
        "en": "Helmet",
        "vi": "Mũ bảo hiểm"
      },
      {
        "en": "Stable",
        "vi": "Chuồng ngựa"
      },
      {
        "en": "Child",
        "vi": "Trẻ em"
      },
      {
        "en": "Countryside",
        "vi": "Vùng nông thôn"
      },
      {
        "en": "Outdoor activity",
        "vi": "Hoạt động ngoài trời"
      }
    ],
    "originalDescription": "Hai mẹ con đang cưỡi ngựa",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_7",
    "topicNumber": 7,
    "title": "Đề 07",
    "imageUrl": "/uploads/speaking/part2/image23.png",
    "questions": [
      "Describe the picture.",
      "The last time you went somewhere in a car?",
      "Is it important for people to learn to drive? Why?"
    ],
    "vocab": [
      {
        "en": "Family",
        "vi": "Gia đình"
      },
      {
        "en": "Car",
        "vi": "Ô tô / xe hơi"
      },
      {
        "en": "Driver",
        "vi": "Người lái xe"
      },
      {
        "en": "Passenger",
        "vi": "Hành khách"
      },
      {
        "en": "Seat belt",
        "vi": "Dây an toàn"
      },
      {
        "en": "Back seat",
        "vi": "Ghế sau"
      },
      {
        "en": "Road trip",
        "vi": "Chuyến đi bằng ô tô"
      },
      {
        "en": "Children",
        "vi": "Trẻ em"
      },
      {
        "en": "Driving",
        "vi": "Lái xe"
      },
      {
        "en": "Family trip",
        "vi": "Chuyến đi gia đình"
      }
    ],
    "originalDescription": "Gia đình trên ô tô",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_8",
    "topicNumber": 8,
    "title": "Đề 08",
    "imageUrl": "/uploads/speaking/part2/image11.png",
    "questions": [
      "Describe the picture.",
      "How difficult is it for young people to learn to cook these days?",
      "When was the last time you went out to eat?"
    ],
    "vocab": [
      {
        "en": "Group of friends",
        "vi": "Nhóm bạn"
      },
      {
        "en": "Restaurant",
        "vi": "Nhà hàng"
      },
      {
        "en": "Meal",
        "vi": "Bữa ăn"
      },
      {
        "en": "Dining",
        "vi": "Ăn uống"
      },
      {
        "en": "Conversation",
        "vi": "Cuộc trò chuyện"
      },
      {
        "en": "Dish",
        "vi": "Món ăn"
      },
      {
        "en": "Table",
        "vi": "Bàn ăn"
      },
      {
        "en": "Drink",
        "vi": "Đồ uống"
      },
      {
        "en": "Social gathering",
        "vi": "Buổi tụ họp"
      },
      {
        "en": "Enjoy a meal",
        "vi": "Thưởng thức bữa ăn"
      }
    ],
    "originalDescription": "Nhóm bạn ở nhà hàng",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_9",
    "topicNumber": 9,
    "title": "Đề 09",
    "imageUrl": "/uploads/speaking/part2/image12.png",
    "questions": [
      "Describe the picture.",
      "Tell me the time you did housework.",
      "Why do people like to decorate their houses?"
    ],
    "vocab": [
      {
        "en": "Cleaning",
        "vi": "Dọn dẹp"
      },
      {
        "en": "Clean the floor",
        "vi": "Lau sàn nhà"
      },
      {
        "en": "Vacuum cleaner",
        "vi": "Máy hút bụi"
      },
      {
        "en": "Broom",
        "vi": "Chổi"
      },
      {
        "en": "Mop",
        "vi": "Cây lau nhà"
      },
      {
        "en": "Household chores",
        "vi": "Việc nhà"
      },
      {
        "en": "Living room",
        "vi": "Phòng khách"
      },
      {
        "en": "Clean up",
        "vi": "Dọn dẹp"
      },
      {
        "en": "Spill",
        "vi": "Đồ bị đổ / chất lỏng bị đổ"
      },
      {
        "en": "Work together",
        "vi": "Làm việc cùng nhau"
      }
    ],
    "originalDescription": "Hai vợ chồng đang dọn nhà",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_10",
    "topicNumber": 10,
    "title": "Đề 10",
    "imageUrl": "/uploads/speaking/part2/image7.png",
    "questions": [
      "Describe the picture.",
      "Tell me about a game you played when you were a child.",
      "How have the children’s games changed in the last 50 years?"
    ],
    "vocab": [
      {
        "en": "Children",
        "vi": "Trẻ em"
      },
      {
        "en": "Outdoor activity",
        "vi": "Hoạt động ngoài trời"
      },
      {
        "en": "Hula hoop",
        "vi": "Vòng lắc eo"
      },
      {
        "en": "Playground",
        "vi": "Sân chơi"
      },
      {
        "en": "Grass",
        "vi": "Cỏ"
      },
      {
        "en": "Playing",
        "vi": "Chơi đùa"
      },
      {
        "en": "Exercise",
        "vi": "Tập thể dục"
      },
      {
        "en": "Jump",
        "vi": "Nhảy"
      },
      {
        "en": "Group activity",
        "vi": "Hoạt động nhóm"
      },
      {
        "en": "Have fun",
        "vi": "Vui chơi / tận hưởng"
      }
    ],
    "originalDescription": "Gia đình chơi ở công viên",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_11",
    "topicNumber": 11,
    "title": "Đề 11",
    "imageUrl": "/uploads/speaking/part2/image2.png",
    "questions": [
      "Describe the picture.",
      "Do you like to climb mountains?",
      "Do you think outdoor activities are important?"
    ],
    "vocab": [
      {
        "en": "Mountain climbing",
        "vi": "Leo núi"
      },
      {
        "en": "Hikers",
        "vi": "Những người đi bộ đường dài"
      },
      {
        "en": "Hiking",
        "vi": "Đi bộ đường dài"
      },
      {
        "en": "Mountain",
        "vi": "Núi"
      },
      {
        "en": "Climbing gear",
        "vi": "Thiết bị leo núi"
      },
      {
        "en": "Backpack",
        "vi": "Ba lô"
      },
      {
        "en": "Trekking poles",
        "vi": "Gậy trekking"
      },
      {
        "en": "Rocky terrain",
        "vi": "Địa hình nhiều đá"
      },
      {
        "en": "High altitude",
        "vi": "Độ cao lớn"
      },
      {
        "en": "Adventure",
        "vi": "Cuộc phiêu lưu"
      }
    ],
    "originalDescription": "Nhóm người leo núi",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_12",
    "topicNumber": 12,
    "title": "Đề 12",
    "imageUrl": "/uploads/speaking/part2/image24.png",
    "questions": [
      "Describe the picture.",
      "What do you usually eat for breakfast?",
      "Is it important to eat a good breakfast? Why?"
    ],
    "vocab": [
      {
        "en": "Father and son",
        "vi": "Bố và con trai"
      },
      {
        "en": "Breakfast",
        "vi": "Bữa sáng"
      },
      {
        "en": "Meal",
        "vi": "Bữa ăn"
      },
      {
        "en": "Cereal",
        "vi": "Ngũ cốc"
      },
      {
        "en": "Milk",
        "vi": "Sữa"
      },
      {
        "en": "Orange juice",
        "vi": "Nước cam"
      },
      {
        "en": "Eating",
        "vi": "Ăn uống"
      },
      {
        "en": "Dining table",
        "vi": "Bàn ăn"
      },
      {
        "en": "Enjoy a meal",
        "vi": "Thưởng thức bữa ăn"
      },
      {
        "en": "Family time",
        "vi": "Thời gian bên gia đình"
      }
    ],
    "originalDescription": "Hai bố con ăn sáng",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_13",
    "topicNumber": 13,
    "title": "Đề 13",
    "imageUrl": "/uploads/speaking/part2/image6.png",
    "questions": [
      "Describe the picture.",
      "Tell me about a time when you used public transport?",
      "People should use public transport more. Do you agree? Why, or why not?"
    ],
    "vocab": [
      {
        "en": "Bus",
        "vi": "Xe buýt"
      },
      {
        "en": "Public transport",
        "vi": "Phương tiện giao thông công cộng"
      },
      {
        "en": "Passenger",
        "vi": "Hành khách"
      },
      {
        "en": "Bus driver",
        "vi": "Tài xế xe buýt"
      },
      {
        "en": "Bus stop",
        "vi": "Trạm xe buýt"
      },
      {
        "en": "Handrail",
        "vi": "Tay vịn"
      },
      {
        "en": "Seat",
        "vi": "Ghế ngồi"
      },
      {
        "en": "Commute",
        "vi": "Đi lại hằng ngày"
      },
      {
        "en": "Crowded",
        "vi": "Đông đúc"
      },
      {
        "en": "Public transportation",
        "vi": "Giao thông công cộng"
      }
    ],
    "originalDescription": "Người phụ nữ trên xe bus",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_14",
    "topicNumber": 14,
    "title": "Đề 14",
    "imageUrl": "/uploads/speaking/part2/image19.png",
    "questions": [
      "Describe the picture.",
      "How do most people in your country learn about world news?",
      "How has the reporting of news changed in the last fifty years?"
    ],
    "vocab": [
      {
        "en": "Businessman",
        "vi": "Doanh nhân"
      },
      {
        "en": "Office",
        "vi": "Văn phòng"
      },
      {
        "en": "Computer screen",
        "vi": "Màn hình máy tính"
      },
      {
        "en": "Newspaper",
        "vi": "Báo"
      },
      {
        "en": "Business",
        "vi": "Kinh doanh"
      },
      {
        "en": "Financial data",
        "vi": "Dữ liệu tài chính"
      },
      {
        "en": "Chart",
        "vi": "Biểu đồ"
      },
      {
        "en": "Report",
        "vi": "Báo cáo"
      },
      {
        "en": "Technology",
        "vi": "Công nghệ"
      },
      {
        "en": "Analyze data",
        "vi": "Phân tích dữ liệu"
      }
    ],
    "originalDescription": "Người đàn ông đọc báo",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_15",
    "topicNumber": 15,
    "title": "Đề 15",
    "imageUrl": "/uploads/speaking/part2/image13.png",
    "questions": [
      "Describe the picture.",
      "A time when you were in a crowded place.",
      "Why don't people like crowded places?"
    ],
    "vocab": [
      {
        "en": "Crowded street",
        "vi": "Đường phố đông đúc"
      },
      {
        "en": "Pedestrian",
        "vi": "Người đi bộ"
      },
      {
        "en": "Pedestrian crossing",
        "vi": "Vạch sang đường"
      },
      {
        "en": "Traffic",
        "vi": "Giao thông"
      },
      {
        "en": "City center",
        "vi": "Trung tâm thành phố"
      },
      {
        "en": "Skyscraper",
        "vi": "Tòa nhà chọc trời"
      },
      {
        "en": "Urban area",
        "vi": "Khu vực đô thị"
      },
      {
        "en": "Crowd",
        "vi": "Đám đông"
      },
      {
        "en": "Cross the street",
        "vi": "Băng qua đường"
      },
      {
        "en": "Busy",
        "vi": "Nhộn nhịp / đông đúc"
      }
    ],
    "originalDescription": "Người qua đường đông đúc",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_16",
    "topicNumber": 16,
    "title": "Đề 16",
    "imageUrl": "/uploads/speaking/part2/image4.png",
    "questions": [
      "Describe the picture.",
      "Tell us about the time you give a presentation. How did you feel?",
      "Why are people scared of public speaking?"
    ],
    "vocab": [
      {
        "en": "Business meeting",
        "vi": "Cuộc họp kinh doanh"
      },
      {
        "en": "Meeting room",
        "vi": "Phòng họp"
      },
      {
        "en": "Presentation",
        "vi": "Bài thuyết trình"
      },
      {
        "en": "Presenter",
        "vi": "Người thuyết trình"
      },
      {
        "en": "Colleague",
        "vi": "Đồng nghiệp"
      },
      {
        "en": "Laptop",
        "vi": "Máy tính xách tay"
      },
      {
        "en": "Conference table",
        "vi": "Bàn họp"
      },
      {
        "en": "Discussion",
        "vi": "Thảo luận"
      },
      {
        "en": "Take notes",
        "vi": "Ghi chép"
      },
      {
        "en": "Teamwork",
        "vi": "Làm việc nhóm"
      }
    ],
    "originalDescription": "Người thuyết trình trước cuộc họp",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_17",
    "topicNumber": 17,
    "title": "Đề 17",
    "imageUrl": "/uploads/speaking/part2/image3.png",
    "questions": [
      "Describe the picture.",
      "Tell me about a time you decorated your house.",
      "In modern life, people pay more attention to home decoration than in the past. Do you agree?"
    ],
    "vocab": [
      {
        "en": "Art gallery",
        "vi": "Phòng trưng bày nghệ thuật"
      },
      {
        "en": "Artwork",
        "vi": "Tác phẩm nghệ thuật"
      },
      {
        "en": "Picture frame",
        "vi": "Khung tranh"
      },
      {
        "en": "Painting",
        "vi": "Bức tranh"
      },
      {
        "en": "Exhibition",
        "vi": "Triển lãm"
      },
      {
        "en": "Hang a picture",
        "vi": "Treo tranh"
      },
      {
        "en": "Wall",
        "vi": "Bức tường"
      },
      {
        "en": "Artist",
        "vi": "Nghệ sĩ"
      },
      {
        "en": "Interior design",
        "vi": "Thiết kế nội thất"
      },
      {
        "en": "Arrange",
        "vi": "Sắp xếp"
      }
    ],
    "originalDescription": "Hai vợ chồng treo tranh",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_18",
    "topicNumber": 18,
    "title": "Đề 18",
    "imageUrl": "/uploads/speaking/part2/image14.png",
    "questions": [
      "Describe the picture.",
      "Tell me the last time you did an outdoor activity.",
      "Why should people do outdoor activities?"
    ],
    "vocab": [
      {
        "en": "Father and son",
        "vi": "Bố và con trai"
      },
      {
        "en": "Playing football",
        "vi": "Chơi bóng đá"
      },
      {
        "en": "Football / Soccer",
        "vi": "Bóng đá"
      },
      {
        "en": "Ball",
        "vi": "Quả bóng"
      },
      {
        "en": "Park",
        "vi": "Công viên"
      },
      {
        "en": "Grass",
        "vi": "Bãi cỏ"
      },
      {
        "en": "Outdoor activity",
        "vi": "Hoạt động ngoài trời"
      },
      {
        "en": "Exercise",
        "vi": "Tập thể dục"
      },
      {
        "en": "Kick the ball",
        "vi": "Đá bóng"
      },
      {
        "en": "Spend time together",
        "vi": "Dành thời gian bên nhau"
      }
    ],
    "originalDescription": "Hai bố con chơi với nhau",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_19",
    "topicNumber": 19,
    "title": "Đề 19",
    "imageUrl": "/uploads/speaking/part2/image1.png",
    "questions": [
      "Describe the picture.",
      "Tell me a time you laughed a lot.",
      "Do you think people from different countries laugh at different things?"
    ],
    "vocab": [
      {
        "en": "Cinema",
        "vi": "Rạp chiếu phim"
      },
      {
        "en": "Audience",
        "vi": "Khán giả"
      },
      {
        "en": "Movie",
        "vi": "Bộ phim"
      },
      {
        "en": "Popcorn",
        "vi": "Bỏng ngô"
      },
      {
        "en": "Seat",
        "vi": "Ghế ngồi"
      },
      {
        "en": "Watching a movie",
        "vi": "Xem phim"
      },
      {
        "en": "Screen",
        "vi": "Màn hình"
      },
      {
        "en": "Enjoy",
        "vi": "Thưởng thức / tận hưởng"
      },
      {
        "en": "Laugh",
        "vi": "Cười"
      },
      {
        "en": "Entertainment",
        "vi": "Giải trí"
      }
    ],
    "originalDescription": "Nhóm người ở rạp chiếu phim",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_20",
    "topicNumber": 20,
    "title": "Đề 20",
    "imageUrl": "/uploads/speaking/part2/image17.png",
    "questions": [
      "Describe the picture.",
      "What kind of games did you play when you were a child?",
      "Why do children spend time playing?"
    ],
    "vocab": [
      {
        "en": "Classroom",
        "vi": "Lớp học"
      },
      {
        "en": "Teacher",
        "vi": "Giáo viên"
      },
      {
        "en": "Students",
        "vi": "Học sinh"
      },
      {
        "en": "Children",
        "vi": "Trẻ em"
      },
      {
        "en": "Storytelling",
        "vi": "Kể chuyện"
      },
      {
        "en": "Picture book",
        "vi": "Sách tranh"
      },
      {
        "en": "Lesson",
        "vi": "Bài học"
      },
      {
        "en": "Learn",
        "vi": "Học tập"
      },
      {
        "en": "Group activity",
        "vi": "Hoạt động nhóm"
      },
      {
        "en": "Pay attention",
        "vi": "Chú ý / tập trung"
      }
    ],
    "originalDescription": "Cô giáo đang dạy học",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_21",
    "topicNumber": 21,
    "title": "Đề 21",
    "imageUrl": "/uploads/speaking/part2/image8.png",
    "questions": [
      "Describe the picture.",
      "Tell me the last time you went to a restaurant with your friends.",
      "Why do people enjoy eating out with their friends?"
    ],
    "vocab": [
      {
        "en": "Group of friends",
        "vi": "Nhóm bạn"
      },
      {
        "en": "Restaurant",
        "vi": "Nhà hàng"
      },
      {
        "en": "Meal",
        "vi": "Bữa ăn"
      },
      {
        "en": "Dining",
        "vi": "Ăn uống"
      },
      {
        "en": "Conversation",
        "vi": "Cuộc trò chuyện"
      },
      {
        "en": "Dish",
        "vi": "Món ăn"
      },
      {
        "en": "Table",
        "vi": "Bàn ăn"
      },
      {
        "en": "Drink",
        "vi": "Đồ uống"
      },
      {
        "en": "Social gathering",
        "vi": "Buổi tụ họp"
      },
      {
        "en": "Enjoy a meal",
        "vi": "Thưởng thức bữa ăn"
      }
    ],
    "originalDescription": "Nhóm người ở nhà hàng",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_22",
    "topicNumber": 22,
    "title": "Đề 22",
    "imageUrl": "/uploads/speaking/part2/image21.png",
    "questions": [
      "Describe the picture.",
      "Tell me the last time you used a computer?",
      "Should children use computers?"
    ],
    "vocab": [
      {
        "en": "Father and daughter",
        "vi": "Bố và con gái"
      },
      {
        "en": "Family",
        "vi": "Gia đình"
      },
      {
        "en": "Laptop",
        "vi": "Máy tính xách tay"
      },
      {
        "en": "Computer",
        "vi": "Máy tính"
      },
      {
        "en": "Technology",
        "vi": "Công nghệ"
      },
      {
        "en": "Online learning",
        "vi": "Học trực tuyến"
      },
      {
        "en": "Use a computer",
        "vi": "Sử dụng máy tính"
      },
      {
        "en": "Help",
        "vi": "Giúp đỡ"
      },
      {
        "en": "Learn together",
        "vi": "Học cùng nhau"
      },
      {
        "en": "Spend time together",
        "vi": "Dành thời gian bên nhau"
      }
    ],
    "originalDescription": "Gia đình đang sử dụng máy tính",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_23",
    "topicNumber": 23,
    "title": "Đề 23",
    "imageUrl": "/uploads/speaking/part2/image5.png",
    "questions": [
      "Describe the picture.",
      "How do people learn to cook in your culture?",
      "Why is it important for people to learn how to cook for themselves?"
    ],
    "vocab": [
      {
        "en": "Baking",
        "vi": "Làm bánh"
      },
      {
        "en": "Bake a cake",
        "vi": "Làm bánh"
      },
      {
        "en": "Ingredients",
        "vi": "Nguyên liệu"
      },
      {
        "en": "Mixing bowl",
        "vi": "Bát trộn"
      },
      {
        "en": "Flour",
        "vi": "Bột mì"
      },
      {
        "en": "Dough",
        "vi": "Bột nhào"
      },
      {
        "en": "Apron",
        "vi": "Tạp dề"
      },
      {
        "en": "Recipe",
        "vi": "Công thức nấu ăn"
      },
      {
        "en": "Cooking class",
        "vi": "Lớp học nấu ăn"
      },
      {
        "en": "Work together",
        "vi": "Cùng nhau làm việc"
      }
    ],
    "originalDescription": "Nhóm trẻ nấu ăn trong bếp",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_24",
    "topicNumber": 24,
    "title": "Đề 24",
    "imageUrl": "/uploads/speaking/part2/image20.png",
    "questions": [
      "Describe the picture.",
      "Tell us the last time you went to the sea?",
      "Why do some people dislike going to the sea?"
    ],
    "vocab": [
      {
        "en": "Yacht",
        "vi": "Du thuyền"
      },
      {
        "en": "Woman",
        "vi": "Người phụ nữ"
      },
      {
        "en": "Seaside",
        "vi": "Bờ biển"
      },
      {
        "en": "Waterfront",
        "vi": "Khu vực ven sông / biển"
      },
      {
        "en": "City skyline",
        "vi": "Đường chân trời thành phố"
      },
      {
        "en": "Sunset",
        "vi": "Hoàng hôn"
      },
      {
        "en": "Relax",
        "vi": "Thư giãn"
      },
      {
        "en": "Boat trip",
        "vi": "Chuyến đi bằng thuyền"
      },
      {
        "en": "Scenic view",
        "vi": "Khung cảnh đẹp"
      },
      {
        "en": "Enjoy the view",
        "vi": "Thưởng thức khung cảnh"
      }
    ],
    "originalDescription": "Cô gái ngồi trên thuyền ngắm cảnh",
    "category": "Tranh trọng điểm Part 2"
  },
  {
    "id": "p2_25",
    "topicNumber": 25,
    "title": "Đề 25",
    "imageUrl": "/uploads/speaking/part2/image25.png",
    "questions": [
      "Describe the picture.",
      "Tell me about the last time you used public transport.",
      "How can we increase the number of people using public transport?"
    ],
    "vocab": [
      {
        "en": "Train",
        "vi": "Tàu hỏa"
      },
      {
        "en": "Train station",
        "vi": "Ga tàu"
      },
      {
        "en": "Passenger",
        "vi": "Hành khách"
      },
      {
        "en": "Businessman",
        "vi": "Doanh nhân"
      },
      {
        "en": "Suitcase",
        "vi": "Va-li"
      },
      {
        "en": "Briefcase",
        "vi": "Cặp công sở"
      },
      {
        "en": "Platform",
        "vi": "Sân ga"
      },
      {
        "en": "Train ticket",
        "vi": "Vé tàu"
      },
      {
        "en": "Commuter",
        "vi": "Người đi làm / người đi lại"
      },
      {
        "en": "Catch a train",
        "vi": "Bắt tàu / đón tàu"
      }
    ],
    "originalDescription": "Người đàn ông đang đứng đợi tàu",
    "category": "Tranh trọng điểm Part 2"
  }
];
