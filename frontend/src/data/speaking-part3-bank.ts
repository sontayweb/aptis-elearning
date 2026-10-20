// Speaking Part 3 Authentic Picture Comparison Bank
// Extracted and normalized from SPEAKING/Tranh trọng điểm part 3.docx

export interface SpeakingPart3Topic {
  id: string;
  topicNumber: number;
  title: string;
  imageUrl: string;
  vocab: { en: string; vi: string }[];
  questions: string[];
}

export const SPEAKING_PART3_BANK: SpeakingPart3Topic[] = [
  {
    "id": "p3_1",
    "topicNumber": 1,
    "title": "Tranh vài người leo núi + tranh ở biển 0 người",
    "imageUrl": "/uploads/speaking/part3/image5.png",
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
    ]
  },
  {
    "id": "p3_2",
    "topicNumber": 2,
    "title": "Sống cùng gia đình + sống một mình",
    "imageUrl": "/uploads/speaking/part3/image6.png",
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
    ]
  },
  {
    "id": "p3_3",
    "topicNumber": 3,
    "title": "Tranh 1 người nhìn máy bay + 1 người đứng đợi tàu",
    "imageUrl": "/uploads/speaking/part3/image1.jpg",
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
    ]
  },
  {
    "id": "p3_4",
    "topicNumber": 4,
    "title": "Người thu hoạch táo + người tưới cây",
    "imageUrl": "/uploads/speaking/part3/image2.png",
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
    ]
  },
  {
    "id": "p3_5",
    "topicNumber": 5,
    "title": "Đọc sách truyền thống + đọc sách online",
    "imageUrl": "/uploads/speaking/part3/image3.png",
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
    ]
  },
  {
    "id": "p3_6",
    "topicNumber": 6,
    "title": "Mua sắm trong siêu thị + mua sắm trong chợ",
    "imageUrl": "/uploads/speaking/part3/image14.png",
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
    ]
  },
  {
    "id": "p3_7",
    "topicNumber": 7,
    "title": "Cô gái nghe nhạc trên sofa + ban nhạc đang chơi nhạc",
    "imageUrl": "/uploads/speaking/part3/image9.png",
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
    ]
  },
  {
    "id": "p3_8",
    "topicNumber": 8,
    "title": "Ăn đồ ăn nhanh + nấu ăn healthy",
    "imageUrl": "/uploads/speaking/part3/image11.png",
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
    ]
  },
  {
    "id": "p3_9",
    "topicNumber": 9,
    "title": "Cặp đôi dưới tuyết + hai cô gái tắm nắng",
    "imageUrl": "/uploads/speaking/part3/image13.png",
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
    ]
  },
  {
    "id": "p3_10",
    "topicNumber": 10,
    "title": "Người đàn ông tập gym + hai người đi leo núi",
    "imageUrl": "/uploads/speaking/part3/image12.png",
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
    ]
  },
  {
    "id": "p3_11",
    "topicNumber": 11,
    "title": "Bóng rổ xe lăn + quần vợt (Thể thao chuyên nghiệp & nghiệp dư)",
    "imageUrl": "/uploads/speaking/part3/image15.png",
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
    ]
  },
  {
    "id": "p3_12",
    "topicNumber": 12,
    "title": "Cặp tranh so sánh các hoạt động",
    "imageUrl": "/uploads/speaking/part3/image10.png",
    "questions": [
      "Tell me what you see in the two pictures."
    ],
    "vocab": []
  }
];
