// Reading Topics & Priority Stickers Map
// Sắp xếp lại theo đúng độ hot của đề từ tài liệu chuẩn British Council
// Nhãn cỏ ☘️: Tài liệu trọng điểm (Đề có xác suất thi cao nhất)

export interface ReadingTopicItem {
  id: number;
  title: string;
  sticker: string;
  hotLevel?: number;
  cloverLevel?: number;
  isKey?: boolean;
  originalTopic?: string;
}

export const READING_PART2_TOPICS: ReadingTopicItem[] = [
  {
    "id": 1,
    "title": "Film",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 2,
    "title": "Singer",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 3,
    "title": "The famous singer",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 4,
    "title": "New coffee shop",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 5,
    "title": "My visit to a new coffee shop",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 6,
    "title": "Busy coffee",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 7,
    "title": "End of term project",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 8,
    "title": "The first American woman in Space",
    "sticker": "☘️☘️☘️☘️ Rất hot",
    "hotLevel": 4,
    "isKey": true
  },
  {
    "id": 9,
    "title": "Weekend activities",
    "sticker": "☘️☘️☘️☘️ Rất hot",
    "hotLevel": 4,
    "isKey": true
  },
  {
    "id": 10,
    "title": "Movies then and now",
    "sticker": "☘️☘️☘️☘️ Rất hot",
    "hotLevel": 4,
    "isKey": true
  },
  {
    "id": 11,
    "title": "New coffee shop",
    "sticker": "☘️☘️☘️☘️ Rất hot",
    "hotLevel": 4,
    "isKey": true
  },
  {
    "id": 12,
    "title": "The first american woman in space",
    "sticker": "☘️☘️☘️☘️ Rất hot",
    "hotLevel": 4,
    "isKey": true
  },
  {
    "id": 13,
    "title": "The history of transportation (phiên bản 2)",
    "sticker": "☘️☘️☘️☘️ Rất hot",
    "hotLevel": 4,
    "isKey": true
  },
  {
    "id": 14,
    "title": "Family Sport Day (phiên bản 1)",
    "sticker": "☘️☘️☘️ Hay ra",
    "hotLevel": 3,
    "isKey": true
  },
  {
    "id": 15,
    "title": "Family sports day (phiên bản 2)",
    "sticker": "☘️☘️☘️ Hay ra",
    "hotLevel": 3,
    "isKey": true
  },
  {
    "id": 16,
    "title": "Mae - The Math Girl",
    "sticker": "☘️☘️☘️ Hay ra",
    "hotLevel": 3,
    "isKey": true
  },
  {
    "id": 17,
    "title": "Cultural festival",
    "sticker": "☘️☘️☘️ Hay ra",
    "hotLevel": 3,
    "isKey": true
  },
  {
    "id": 18,
    "title": "College Welcoming Day",
    "sticker": "☘️☘️☘️ Hay ra",
    "hotLevel": 3,
    "isKey": true
  },
  {
    "id": 19,
    "title": "Public Transportations",
    "sticker": "☘️☘️ Đề ôn thêm",
    "hotLevel": 2,
    "isKey": true
  },
  {
    "id": 20,
    "title": "Writing about a place (phiên bản 2)",
    "sticker": "☘️☘️ Đề ôn thêm",
    "hotLevel": 2,
    "isKey": true
  },
  {
    "id": 21,
    "title": "Writing about a place",
    "sticker": "☘️☘️ Đề ôn thêm",
    "hotLevel": 2,
    "isKey": true
  },
  {
    "id": 22,
    "title": "Music show at the park",
    "sticker": "☘️☘️ Đề ôn thêm",
    "hotLevel": 2,
    "isKey": true
  },
  {
    "id": 23,
    "title": "Music show at the park",
    "sticker": "☘️☘️ Đề ôn thêm",
    "hotLevel": 2,
    "isKey": true
  },
  {
    "id": 24,
    "title": "Presentation",
    "sticker": "Mới cập nhật",
    "hotLevel": 1,
    "isKey": false
  },
  {
    "id": 25,
    "title": "Tourism",
    "sticker": "Mới cập nhật",
    "hotLevel": 1,
    "isKey": false
  },
  {
    "id": 26,
    "title": "Tech fair",
    "sticker": "Mới cập nhật",
    "hotLevel": 1,
    "isKey": false
  },
  {
    "id": 27,
    "title": "Company Wellness Day",
    "sticker": "Mới cập nhật",
    "hotLevel": 1,
    "isKey": false
  },
  {
    "id": 28,
    "title": "Social media",
    "sticker": "Mới cập nhật",
    "hotLevel": 1,
    "isKey": false
  },
  {
    "id": 29,
    "title": "Technology Startup Showcase",
    "sticker": "Mới cập nhật",
    "hotLevel": 1,
    "isKey": false
  },
  {
    "id": 30,
    "title": "Workplace Evolution",
    "sticker": "Mới cập nhật",
    "hotLevel": 1,
    "isKey": false
  },
  {
    "id": 31,
    "title": "Internet of Things (IoT)",
    "sticker": "Mới cập nhật",
    "hotLevel": 1,
    "isKey": false
  },
  {
    "id": 32,
    "title": "Healthy eating",
    "sticker": "Mới cập nhật",
    "hotLevel": 1,
    "isKey": false
  },
  {
    "id": 33,
    "title": "A university open day",
    "sticker": "Mới cập nhật",
    "hotLevel": 1,
    "isKey": false
  },
  {
    "id": 34,
    "title": "Artificial intelligence",
    "sticker": "Mới cập nhật",
    "hotLevel": 1,
    "isKey": false
  }
];

export const READING_PART3_TOPICS: ReadingTopicItem[] = [
  {
    "id": 1,
    "title": "childhood",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 2,
    "title": "Music festival - Version 3",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 3,
    "title": "Games from childhood",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 4,
    "title": "Music festival - Version 1",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 5,
    "title": "Technology in childhood",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 6,
    "title": "Technology in childhood - Phiên bản 2",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 7,
    "title": "Music festival - Version 2",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 8,
    "title": "Music festival - Version 4",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 9,
    "title": "Extreme sports (Phiên bản 3)",
    "sticker": "☘️☘️☘️☘️ Rất hot",
    "hotLevel": 4,
    "isKey": true
  },
  {
    "id": 10,
    "title": "Extreme sports",
    "sticker": "☘️☘️☘️☘️ Rất hot",
    "hotLevel": 4,
    "isKey": true
  },
  {
    "id": 11,
    "title": "Extreme sports (phiên bản 2)",
    "sticker": "☘️☘️☘️☘️ Rất hot",
    "hotLevel": 4,
    "isKey": true
  },
  {
    "id": 12,
    "title": "Childhood memories",
    "sticker": "☘️☘️☘️ Hay ra",
    "hotLevel": 3,
    "isKey": true
  },
  {
    "id": 13,
    "title": "Free time activity",
    "sticker": "☘️☘️☘️ Hay ra",
    "hotLevel": 3,
    "isKey": true
  },
  {
    "id": 14,
    "title": "Job and trainning",
    "sticker": "☘️☘️☘️ Hay ra",
    "hotLevel": 3,
    "isKey": true
  },
  {
    "id": 15,
    "title": "Volunteering",
    "sticker": "☘️☘️☘️ Hay ra",
    "hotLevel": 3,
    "isKey": true
  },
  {
    "id": 16,
    "title": "Career",
    "sticker": "☘️☘️☘️ Hay ra",
    "hotLevel": 3,
    "isKey": true
  },
  {
    "id": 17,
    "title": "Volunteering to clean local park",
    "sticker": "☘️☘️ Đề ôn thêm",
    "hotLevel": 2,
    "isKey": true
  },
  {
    "id": 18,
    "title": "Choosing a career path",
    "sticker": "☘️☘️ Đề ôn thêm",
    "hotLevel": 2,
    "isKey": true
  },
  {
    "id": 19,
    "title": "Job and training (phiên bản 2)",
    "sticker": "☘️☘️ Đề ôn thêm",
    "hotLevel": 2,
    "isKey": true
  },
  {
    "id": 20,
    "title": "Eating and cooking habits",
    "sticker": "☘️☘️ Đề ôn thêm",
    "hotLevel": 2,
    "isKey": true
  },
  {
    "id": 21,
    "title": "Work-life balance",
    "sticker": "☘️☘️ Đề ôn thêm",
    "hotLevel": 2,
    "isKey": true
  }
];

export const READING_PART4_TOPICS: ReadingTopicItem[] = [
  {
    "id": 1,
    "title": "Mountain (Phiên bản 1)",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 2,
    "title": "The arrival of four-day week (Phiên bản 2)",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 3,
    "title": "Mountain (Phiên bản 2)",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 4,
    "title": "The arrival of four-day week (Phiên bản 1)",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 5,
    "title": "Women mathematicians (Phiên bản 1)",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 6,
    "title": "Women mathematicians (phiên bản 2)",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 7,
    "title": "Woman Mathematics (TP1)",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 8,
    "title": "Mountain Summits (phiên bản 3)",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 9,
    "title": "Mountain (phiên bản 4)",
    "sticker": "☘️☘️☘️☘️☘️ Cực hot",
    "hotLevel": 5,
    "isKey": true
  },
  {
    "id": 10,
    "title": "Cultural Exchange Programs",
    "sticker": "☘️☘️☘️ Hay ra",
    "hotLevel": 3,
    "isKey": true
  },
  {
    "id": 11,
    "title": "Digital Transformation in Education",
    "sticker": "☘️☘️☘️ Hay ra",
    "hotLevel": 3,
    "isKey": true
  },
  {
    "id": 12,
    "title": "Wellness and Mental Health Trends",
    "sticker": "☘️☘️☘️ Hay ra",
    "hotLevel": 3,
    "isKey": true
  },
  {
    "id": 13,
    "title": "Urban Development and Green Cities",
    "sticker": "☘️☘️☘️ Hay ra",
    "hotLevel": 3,
    "isKey": true
  },
  {
    "id": 14,
    "title": "Tech Forward Innovations",
    "sticker": "☘️☘️☘️ Hay ra",
    "hotLevel": 3,
    "isKey": true
  },
  {
    "id": 15,
    "title": "The Evolution of Modern Photography",
    "sticker": "☘️☘️☘️ Hay ra",
    "hotLevel": 3,
    "isKey": true
  },
  {
    "id": 16,
    "title": "Renewable Energy Transitions",
    "sticker": "☘️☘️☘️ Hay ra",
    "hotLevel": 3,
    "isKey": true
  }
];
