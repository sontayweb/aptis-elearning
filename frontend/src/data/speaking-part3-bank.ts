// Speaking Part 3 Authentic Picture Comparison Bank - ĐỦ 2 BỨC TRANH 100%
// Trích xuất chuẩn xác từ SPEAKING/Tranh trọng điểm part 3.docx
// Mỗi đề đều có đủ 2 tranh (Tranh 1 & Tranh 2), 3 câu hỏi chi tiết và kho từ vựng B1/B2

export interface SpeakingPart3Topic {
  id: string;
  topicNumber: number;
  title: string;
  shortTitle?: string;
  imageUrl: string;
  vocab: { en: string; vi: string }[];
  questions: string[];
}

export const SPEAKING_PART3_BANK: SpeakingPart3Topic[] = [
  {
    "id": "p3_1",
    "topicNumber": 1,
    "title": "Đề 01 - Tranh vài người leo núi + tranh ở biển 0 người",
    "imageUrl": "/uploads/speaking/part3/image5.png, /uploads/speaking/part3/beach.jpg",
    "questions": [
      "Tell me what you see in the two pictures.",
      "What's so attractive about these two places?",
      "How to protect natural beauty?"
    ],
    "vocab": [
      {
        "en": "Mountain",
        "vi": "Núi"
      },
      {
        "en": "Mountain climbing",
        "vi": "Leo núi"
      },
      {
        "en": "Hiking",
        "vi": "Đi bộ đường dài"
      },
      {
        "en": "Hikers",
        "vi": "Người đi bộ đường dài"
      },
      {
        "en": "Beach",
        "vi": "Bãi biển"
      },
      {
        "en": "Tropical island",
        "vi": "Đảo nhiệt đới"
      },
      {
        "en": "Palm tree",
        "vi": "Cây cọ"
      },
      {
        "en": "Ocean",
        "vi": "Đại dương"
      },
      {
        "en": "Adventure",
        "vi": "Cuộc phiêu lưu"
      },
      {
        "en": "Relaxation",
        "vi": "Sự thư giãn"
      }
    ],
    "shortTitle": "Đề 01"
  },
  {
    "id": "p3_2",
    "topicNumber": 2,
    "title": "Đề 02 - Sống cùng gia đình + sống một mình",
    "imageUrl": "/uploads/speaking/part3/image6_1.png, /uploads/speaking/part3/image6_2.png",
    "questions": [
      "Tell me what you see in the two photographs.",
      "Do you prefer living alone or living with your family?",
      "Is it necessary for young people to live independently from their families?"
    ],
    "vocab": [
      {
        "en": "Family",
        "vi": "Gia đình"
      },
      {
        "en": "House",
        "vi": "Ngôi nhà"
      },
      {
        "en": "Garden",
        "vi": "Khu vườn"
      },
      {
        "en": "Lawn",
        "vi": "Bãi cỏ"
      },
      {
        "en": "Parents",
        "vi": "Bố mẹ"
      },
      {
        "en": "Daughter",
        "vi": "Con gái"
      },
      {
        "en": "Apartment",
        "vi": "Căn hộ"
      },
      {
        "en": "Balcony",
        "vi": "Ban công"
      },
      {
        "en": "City",
        "vi": "Thành phố"
      },
      {
        "en": "Residential area",
        "vi": "Khu dân cư"
      }
    ],
    "shortTitle": "Đề 02"
  },
  {
    "id": "p3_3",
    "topicNumber": 3,
    "title": "Đề 03 - Tranh 1 người nhìn máy bay + 1 người đứng đợi tàu",
    "imageUrl": "/uploads/speaking/part3/image1.jpg, /uploads/speaking/part3/image4.jpg",
    "questions": [
      "Tell me what you see in the two pictures.",
      "Which means of transport do you prefer? Why?",
      "Why do people usually not choose to travel by plane?"
    ],
    "vocab": [
      {
        "en": "Airport",
        "vi": "Sân bay"
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
        "en": "Traveler",
        "vi": "Người đi du lịch"
      },
      {
        "en": "Suitcase",
        "vi": "Va-li"
      },
      {
        "en": "Backpack",
        "vi": "Ba lô"
      },
      {
        "en": "Platform",
        "vi": "Sân ga"
      },
      {
        "en": "Railway track",
        "vi": "Đường ray"
      },
      {
        "en": "Departure",
        "vi": "Khởi hành"
      },
      {
        "en": "Journey",
        "vi": "Hành trình"
      }
    ],
    "shortTitle": "Đề 03"
  },
  {
    "id": "p3_4",
    "topicNumber": 4,
    "title": "Đề 04 - Người thu hoạch táo + người tưới cây",
    "imageUrl": "/uploads/speaking/part3/image2.png, /uploads/speaking/part3/image8.png",
    "questions": [
      "Tell me what you see in the two pictures.",
      "What are the attractions of the two pictures?",
      "What is the appeal of growing plants and doing gardening?"
    ],
    "vocab": [
      {
        "en": "Gardening",
        "vi": "Làm vườn"
      },
      {
        "en": "Garden",
        "vi": "Khu vườn"
      },
      {
        "en": "Vegetable garden",
        "vi": "Vườn rau"
      },
      {
        "en": "Plant",
        "vi": "Cây trồng"
      },
      {
        "en": "Tomato",
        "vi": "Cà chua"
      },
      {
        "en": "Water the plants",
        "vi": "Tưới cây"
      },
      {
        "en": "Pick vegetables",
        "vi": "Hái rau / hái rau củ"
      },
      {
        "en": "Watering can",
        "vi": "Bình tưới nước"
      },
      {
        "en": "Grow vegetables",
        "vi": "Trồng rau"
      },
      {
        "en": "Gardening tools",
        "vi": "Dụng cụ làm vườn"
      }
    ],
    "shortTitle": "Đề 04"
  },
  {
    "id": "p3_5",
    "topicNumber": 5,
    "title": "Đề 05 - Đọc sách truyền thống + đọc sách online",
    "imageUrl": "/uploads/speaking/part3/image3.png, /uploads/speaking/part3/image7.png",
    "questions": [
      "Tell me what you see from the two pictures.",
      "Do you prefer reading printed books or e-books?",
      "Does technology affect the way we read books?"
    ],
    "vocab": [
      {
        "en": "Studying",
        "vi": "Học tập"
      },
      {
        "en": "Student",
        "vi": "Học sinh / sinh viên"
      },
      {
        "en": "Library",
        "vi": "Thư viện"
      },
      {
        "en": "Textbook",
        "vi": "Sách giáo khoa"
      },
      {
        "en": "Laptop",
        "vi": "Máy tính xách tay"
      },
      {
        "en": "Online learning",
        "vi": "Học trực tuyến"
      },
      {
        "en": "Reading",
        "vi": "Đọc sách"
      },
      {
        "en": "Research",
        "vi": "Nghiên cứu"
      },
      {
        "en": "Study materials",
        "vi": "Tài liệu học tập"
      },
      {
        "en": "Take notes",
        "vi": "Ghi chép"
      }
    ],
    "shortTitle": "Đề 05"
  },
  {
    "id": "p3_6",
    "topicNumber": 6,
    "title": "Đề 06 - Mua sắm trong siêu thị + mua sắm trong chợ",
    "imageUrl": "/uploads/speaking/part3/image14_1.png, /uploads/speaking/part3/image14_2.png",
    "questions": [
      "Tell me what you see in the two pictures.",
      "Benefits of markets and supermarkets?",
      "Why do many people not like shopping?"
    ],
    "vocab": [
      {
        "en": "Supermarket",
        "vi": "Siêu thị"
      },
      {
        "en": "Grocery shopping",
        "vi": "Mua sắm thực phẩm"
      },
      {
        "en": "Shopping cart",
        "vi": "Xe đẩy hàng"
      },
      {
        "en": "Fresh produce",
        "vi": "Thực phẩm tươi sống"
      },
      {
        "en": "Fruits and vegetables",
        "vi": "Hoa quả và rau củ"
      },
      {
        "en": "Strawberries",
        "vi": "Dâu tây"
      },
      {
        "en": "Vendor",
        "vi": "Người bán hàng"
      },
      {
        "en": "Market stall",
        "vi": "Quầy hàng"
      },
      {
        "en": "Customers",
        "vi": "Khách hàng"
      },
      {
        "en": "Buy groceries",
        "vi": "Mua thực phẩm"
      }
    ],
    "shortTitle": "Đề 06"
  },
  {
    "id": "p3_7",
    "topicNumber": 7,
    "title": "Đề 07 - Cô gái nghe nhạc trên sofa + ban nhạc đang chơi nhạc",
    "imageUrl": "/uploads/speaking/part3/image9_1.png, /uploads/speaking/part3/image9_2.png",
    "questions": [
      "Compare 2 pictures.",
      "Which would you prefer to be in?",
      "What are the benefits of listening to music?"
    ],
    "vocab": [
      {
        "en": "Listening to music",
        "vi": "Nghe nhạc"
      },
      {
        "en": "Headphones",
        "vi": "Tai nghe"
      },
      {
        "en": "Concert",
        "vi": "Buổi hòa nhạc"
      },
      {
        "en": "Live performance",
        "vi": "Buổi biểu diễn trực tiếp"
      },
      {
        "en": "Singer",
        "vi": "Ca sĩ"
      },
      {
        "en": "Musician",
        "vi": "Nhạc công"
      },
      {
        "en": "Stage",
        "vi": "Sân khấu"
      },
      {
        "en": "Audience",
        "vi": "Khán giả"
      },
      {
        "en": "Guitar",
        "vi": "Đàn guitar"
      },
      {
        "en": "Entertainment",
        "vi": "Giải trí"
      }
    ],
    "shortTitle": "Đề 07"
  },
  {
    "id": "p3_8",
    "topicNumber": 8,
    "title": "Đề 08 - Ăn đồ ăn nhanh + nấu ăn healthy",
    "imageUrl": "/uploads/speaking/part3/image11_1.png, /uploads/speaking/part3/image11_2.png",
    "questions": [
      "Tell me what you see in the two pictures.",
      "Which kind of food in those pictures is healthier?",
      "What are the benefits of them?"
    ],
    "vocab": [
      {
        "en": "Fast food",
        "vi": "Đồ ăn nhanh"
      },
      {
        "en": "Junk food",
        "vi": "Đồ ăn không lành mạnh"
      },
      {
        "en": "Healthy food",
        "vi": "Thực phẩm lành mạnh"
      },
      {
        "en": "Cooking",
        "vi": "Nấu ăn"
      },
      {
        "en": "Homemade meal",
        "vi": "Bữa ăn tự nấu tại nhà"
      },
      {
        "en": "Vegetables",
        "vi": "Rau củ"
      },
      {
        "en": "Ingredients",
        "vi": "Nguyên liệu"
      },
      {
        "en": "Burger",
        "vi": "Bánh hamburger"
      },
      {
        "en": "Fried food",
        "vi": "Đồ chiên"
      },
      {
        "en": "Healthy lifestyle",
        "vi": "Lối sống lành mạnh"
      }
    ],
    "shortTitle": "Đề 08"
  },
  {
    "id": "p3_9",
    "topicNumber": 9,
    "title": "Đề 09 - Cặp đôi dưới tuyết + hai cô gái tắm nắng",
    "imageUrl": "/uploads/speaking/part3/image13_1.png, /uploads/speaking/part3/image13_2.png",
    "questions": [
      "Tell me what you see in the two pictures.",
      "Between the two locations, where do you prefer to go? Why?",
      "Do you think the weather affects people’s emotions on trips?"
    ],
    "vocab": [
      {
        "en": "Winter",
        "vi": "Mùa đông"
      },
      {
        "en": "Summer",
        "vi": "Mùa hè"
      },
      {
        "en": "Snow",
        "vi": "Tuyết"
      },
      {
        "en": "Beach",
        "vi": "Bãi biển"
      },
      {
        "en": "Beach holiday",
        "vi": "Kỳ nghỉ ở biển"
      },
      {
        "en": "Winter vacation",
        "vi": "Kỳ nghỉ mùa đông"
      },
      {
        "en": "Sunbathe",
        "vi": "Tắm nắng"
      },
      {
        "en": "Relax",
        "vi": "Thư giãn"
      },
      {
        "en": "Warm clothes",
        "vi": "Quần áo ấm"
      },
      {
        "en": "Outdoor activities",
        "vi": "Hoạt động ngoài trời"
      }
    ],
    "shortTitle": "Đề 09"
  },
  {
    "id": "p3_10",
    "topicNumber": 10,
    "title": "Đề 10 - Người đàn ông tập gym + hai người đi leo núi",
    "imageUrl": "/uploads/speaking/part3/image12_1.png, /uploads/speaking/part3/image12_2.png",
    "questions": [
      "Please describe the 2 pictures.",
      "What the difference of these two exercises?",
      "How important is it to do daily exercises?"
    ],
    "vocab": [
      {
        "en": "Exercise",
        "vi": "Tập thể dục"
      },
      {
        "en": "Squat",
        "vi": "Bài tập squat"
      },
      {
        "en": "Gym",
        "vi": "Phòng tập gym"
      },
      {
        "en": "Workout",
        "vi": "Buổi tập luyện"
      },
      {
        "en": "Hiking",
        "vi": "Đi bộ đường dài"
      },
      {
        "en": "Hiker",
        "vi": "Người đi bộ đường dài"
      },
      {
        "en": "Trekking poles",
        "vi": "Gậy trekking"
      },
      {
        "en": "Backpack",
        "vi": "Ba lô"
      },
      {
        "en": "Stay fit",
        "vi": "Giữ dáng / giữ sức khỏe"
      },
      {
        "en": "Physical activity",
        "vi": "Hoạt động thể chất"
      }
    ],
    "shortTitle": "Đề 10"
  },
  {
    "id": "p3_11",
    "topicNumber": 11,
    "title": "Đề 11 - Bóng rổ xe lăn + quần vợt (Thể thao chuyên nghiệp & nghiệp dư)",
    "imageUrl": "/uploads/speaking/part3/image15_1.png, /uploads/speaking/part3/image15_2.png",
    "questions": [
      "Tell me what you see in the two pictures.",
      "What are the benefits of indoor and outdoor sports?",
      "Playing a game is to win. What do you think ?"
    ],
    "vocab": [
      {
        "en": "Basketball",
        "vi": "Bóng rổ"
      },
      {
        "en": "Wheelchair basketball",
        "vi": "Bóng rổ xe lăn"
      },
      {
        "en": "Tennis",
        "vi": "Quần vợt"
      },
      {
        "en": "Tennis court",
        "vi": "Sân quần vợt"
      },
      {
        "en": "Athlete",
        "vi": "Vận động viên"
      },
      {
        "en": "Team",
        "vi": "Đội / đội tuyển"
      },
      {
        "en": "Competition",
        "vi": "Cuộc thi đấu"
      },
      {
        "en": "Sports",
        "vi": "Thể thao"
      },
      {
        "en": "Teamwork",
        "vi": "Làm việc nhóm"
      },
      {
        "en": "Physical activity",
        "vi": "Hoạt động thể chất"
      }
    ],
    "shortTitle": "Đề 11"
  },
  {
    "id": "p3_12",
    "topicNumber": 12,
    "title": "Đề 12 - Trẻ em tham gia hoạt động ngoài trời + thăm bảo tàng nghệ thuật",
    "imageUrl": "/uploads/speaking/part3/image10_1.png, /uploads/speaking/part3/image10_2.png",
    "questions": [
      "Tell me what you see in the two pictures.",
      "What are the benefits of each activity for children?",
      "Do you think schools should organize more outdoor activities or cultural trips to museums for students? Why?"
    ],
    "vocab": [
      {
        "en": "Adventure park",
        "vi": "Công viên mạo hiểm"
      },
      {
        "en": "Ropes course",
        "vi": "Đu dây vượt chướng ngại"
      },
      {
        "en": "Climbing",
        "vi": "Leo trèo"
      },
      {
        "en": "Outdoor activity",
        "vi": "Hoạt động ngoài trời"
      },
      {
        "en": "Art museum",
        "vi": "Bảo tàng nghệ thuật"
      },
      {
        "en": "Exhibition",
        "vi": "Triển lãm nghệ thuật"
      },
      {
        "en": "Tour guide",
        "vi": "Hướng dẫn viên du lịch"
      },
      {
        "en": "Cultural heritage",
        "vi": "Di sản văn hóa"
      },
      {
        "en": "Physical fitness",
        "vi": "Thể lực / rèn luyện thân thể"
      },
      {
        "en": "Creativity",
        "vi": "Sức sáng tạo"
      }
    ],
    "shortTitle": "Đề 12"
  }
];
