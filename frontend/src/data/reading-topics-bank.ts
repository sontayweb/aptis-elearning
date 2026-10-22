// Reading Topics & Priority Clover Level (☘️) Map
// Extracted and synchronized from READING/Part 2.docx, Part 3.docx, Part 4.docx
// Standardized according to British Council Aptis ESOL exam frequency guidelines

export interface ReadingTopicItem {
  id: number;
  title: string;
  sticker: "★★★★★ Hay ra" | "VIP" | "Đề tủ" | "Mới cập nhật" | string;
  cloverLevel: number; // 2 to 6 clovers (☘️)
  originalTopic?: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PART 2 + 3: Text Cohesion (Sắp xếp trật tự câu văn)
// Sắp xếp theo thứ tự độ hot ☘️☘️☘️☘️☘️ -> ☘️☘️☘️☘️ -> ☘️☘️☘️ -> ☘️☘️
// ─────────────────────────────────────────────────────────────────────────────
export const READING_PART2_TOPICS: ReadingTopicItem[] = [
  // ☘️☘️☘️☘️☘️ (5 lá - Siêu Hot / Đề tủ hàng đầu)
  {
    id: 1,
    title: "Film (Making films)",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "Making films ( đóng phim )"
  },
  {
    id: 2,
    title: "The famous singer",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "5. The famous singer ( ca sĩ nổi tiếng )"
  },
  {
    id: 3,
    title: "New coffee shop",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "A new café in town"
  },
  {
    id: 4,
    title: "My visit to a new coffee shop",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "My visit to a new coffee shop"
  },
  {
    id: 5,
    title: "Busy coffee",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "The staff were very busy at the coffee shop"
  },
  {
    id: 6,
    title: "End of term project",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "12. End of term project (Dự án cuối kỳ)"
  },

  // ☘️☘️☘️☘️ (4 lá - Tần suất thi rất cao)
  {
    id: 7,
    title: "The first American woman in Space",
    sticker: "Đề tủ",
    cloverLevel: 4,
    originalTopic: "9. The first American woman in space"
  },
  {
    id: 8,
    title: "Weekend activities",
    sticker: "Đề tủ",
    cloverLevel: 4,
    originalTopic: "Weekend activities"
  },
  {
    id: 9,
    title: "Movies then and now",
    sticker: "Đề tủ",
    cloverLevel: 4,
    originalTopic: "Movies then and now"
  },
  {
    id: 10,
    title: "The history of transportation (Phiên bản 2)",
    sticker: "Đề tủ",
    cloverLevel: 4,
    originalTopic: "14. The history of transportation (phiên bản 2)"
  },
  {
    id: 11,
    title: "Presentation skills",
    sticker: "Đề tủ",
    cloverLevel: 4,
    originalTopic: "6. Presentation (thuyết trình)"
  },

  // ☘️☘️☘️ (3 lá - Thường gặp)
  {
    id: 12,
    title: "Family Sport Day (Phiên bản 1)",
    sticker: "VIP",
    cloverLevel: 3,
    originalTopic: "Family sport day (phiên bản 1)"
  },
  {
    id: 13,
    title: "Family sports day (Phiên bản 2)",
    sticker: "VIP",
    cloverLevel: 3,
    originalTopic: "Family sports day (phiên bản 2)"
  },
  {
    id: 14,
    title: "Mae - The Math Girl",
    sticker: "VIP",
    cloverLevel: 3,
    originalTopic: "16. Mae - The Math Girl"
  },
  {
    id: 15,
    title: "Cultural festival",
    sticker: "VIP",
    cloverLevel: 3,
    originalTopic: "11. Cultural festival (lễ hội văn hoá)"
  },
  {
    id: 16,
    title: "College Welcoming Day",
    sticker: "VIP",
    cloverLevel: 3,
    originalTopic: "8. College Welcoming Day"
  },
  {
    id: 17,
    title: "Company Wellness Day",
    sticker: "VIP",
    cloverLevel: 3,
    originalTopic: "10. Company Wellness Day (Ngày hội chăm sóc sức khỏe)"
  },
  {
    id: 18,
    title: "Technology Startup Showcase",
    sticker: "VIP",
    cloverLevel: 3,
    originalTopic: "12. Technology Startup Showcase"
  },
  {
    id: 19,
    title: "University Open Day",
    sticker: "VIP",
    cloverLevel: 3,
    originalTopic: "21. A university open day"
  },

  // ☘️☘️ (2 lá - Cơ bản / Tham khảo thêm)
  {
    id: 20,
    title: "Public Transportations",
    sticker: "Mới cập nhật",
    cloverLevel: 2,
    originalTopic: "Public Transportations"
  },
  {
    id: 21,
    title: "Writing about a place (Phiên bản 1)",
    sticker: "Mới cập nhật",
    cloverLevel: 2,
    originalTopic: "Preparing to Write about a Place (bản 1)"
  },
  {
    id: 22,
    title: "Writing about a place (Phiên bản 2)",
    sticker: "Mới cập nhật",
    cloverLevel: 2,
    originalTopic: "Preparing to Write about a Place (bản 2)"
  },
  {
    id: 23,
    title: "Music show at the park",
    sticker: "Mới cập nhật",
    cloverLevel: 2,
    originalTopic: "Music show at the park"
  },
  {
    id: 24,
    title: "Tech fair innovations",
    sticker: "Mới cập nhật",
    cloverLevel: 2,
    originalTopic: "9. Tech fair (hội chợ công nghệ)"
  },
  {
    id: 25,
    title: "Workplace Evolution",
    sticker: "Mới cập nhật",
    cloverLevel: 2,
    originalTopic: "14. Workplace Evolution"
  },
  {
    id: 26,
    title: "Healthy eating habits",
    sticker: "Mới cập nhật",
    cloverLevel: 2,
    originalTopic: "20. Healthy eating"
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// PART 4 (Opinion Matching - Nối ý kiến 4 nhân vật)
// Sắp xếp theo thứ tự độ hot ☘️☘️☘️☘️☘️ -> ☘️☘️☘️☘️ -> ☘️☘️☘️ -> ☘️☘️
// ─────────────────────────────────────────────────────────────────────────────
export const READING_PART3_TOPICS: ReadingTopicItem[] = [
  // ☘️☘️☘️☘️☘️ (5 lá - Siêu Hot / Đề tủ hàng đầu)
  {
    id: 1,
    title: "Childhood",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "Childhood"
  },
  {
    id: 2,
    title: "Games from childhood",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "Games from childhood"
  },
  {
    id: 3,
    title: "Technology in childhood (Phiên bản 1)",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "Technology in childhood (version 1)"
  },
  {
    id: 4,
    title: "Technology in childhood (Phiên bản 2)",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "Technology in childhood (version 2)"
  },
  {
    id: 5,
    title: "Music festival (Version 1)",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "A music festival - Version 1"
  },
  {
    id: 6,
    title: "Music festival (Version 2)",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "A music festival - Version 2"
  },
  {
    id: 7,
    title: "Music festival (Version 3)",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "A music festival - Version 3"
  },
  {
    id: 8,
    title: "Music festival (Version 4)",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "A music festival - Version 4"
  },

  // ☘️☘️☘️☘️ (4 lá - Tần suất thi rất cao)
  {
    id: 9,
    title: "Extreme sports (Phiên bản 1)",
    sticker: "Đề tủ",
    cloverLevel: 4,
    originalTopic: "Sport/ Extreme sports (phiên bản 1)"
  },
  {
    id: 10,
    title: "Extreme sports (Phiên bản 2)",
    sticker: "Đề tủ",
    cloverLevel: 4,
    originalTopic: "Sport/ Extreme sports (phiên bản 2)"
  },
  {
    id: 11,
    title: "Extreme sports (Phiên bản 3)",
    sticker: "Đề tủ",
    cloverLevel: 4,
    originalTopic: "Sport/ Extreme sports (phiên bản 3)"
  },

  // ☘️☘️☘️ (3 lá - Thường gặp)
  {
    id: 12,
    title: "Childhood memories",
    sticker: "VIP",
    cloverLevel: 3,
    originalTopic: "Childhood memories"
  },
  {
    id: 13,
    title: "Free time activity",
    sticker: "VIP",
    cloverLevel: 3,
    originalTopic: "Freetime activities"
  },
  {
    id: 14,
    title: "Job and training",
    sticker: "VIP",
    cloverLevel: 3,
    originalTopic: "Job and training"
  },
  {
    id: 15,
    title: "Volunteering",
    sticker: "VIP",
    cloverLevel: 3,
    originalTopic: "Volunteering"
  },
  {
    id: 16,
    title: "Career",
    sticker: "VIP",
    cloverLevel: 3,
    originalTopic: "Career - Nghề nghiệp"
  },
  {
    id: 17,
    title: "Eating habits and cooking",
    sticker: "VIP",
    cloverLevel: 3,
    originalTopic: "Eating and cooking"
  },
  {
    id: 18,
    title: "Work-life balance",
    sticker: "VIP",
    cloverLevel: 3,
    originalTopic: "Work-life balance"
  },

  // ☘️☘️ (2 lá - Cơ bản / Tham khảo thêm)
  {
    id: 19,
    title: "Volunteering to clean local park",
    sticker: "Mới cập nhật",
    cloverLevel: 2,
    originalTopic: "Volunteering to clean local park"
  },
  {
    id: 20,
    title: "Public Transport vs Private Cars",
    sticker: "Mới cập nhật",
    cloverLevel: 2,
    originalTopic: "Public Transport vs Private Cars"
  },
  {
    id: 21,
    title: "Environmental Protection Actions",
    sticker: "Mới cập nhật",
    cloverLevel: 2,
    originalTopic: "Environmental Protection Actions"
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// PART 4 (Long Reading Headings - Bài đọc dài 750 từ ghép tiêu đề)
// Sắp xếp theo thứ tự độ hot ☘️☘️☘️☘️☘️ -> ☘️☘️☘️☘️ -> ☘️☘️☘️
// ─────────────────────────────────────────────────────────────────────────────
export const READING_PART4_TOPICS: ReadingTopicItem[] = [
  // ☘️☘️☘️☘️☘️ (5 lá - Siêu Hot / Đề tủ đặc biệt)
  {
    id: 1,
    title: "Mountain (Phiên bản 1)",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "1. Mountain (Phiên bản 1) - Changing definition of mountains"
  },
  {
    id: 2,
    title: "Mountain (Phiên bản 2)",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "Mountain (Phiên bản 2)"
  },
  {
    id: 3,
    title: "Mountain Summits (Phiên bản 3)",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "6. MOUNTAIN SUMMITS – ĐỈNH NÚI"
  },
  {
    id: 4,
    title: "Mountain (Phiên bản 4)",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "Mountain (Phiên bản 4)"
  },
  {
    id: 5,
    title: "The arrival of four-day week (Phiên bản 1)",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "1. The Arrival of the Four-Day Work Week (bản 1)"
  },
  {
    id: 6,
    title: "The arrival of four-day week (Phiên bản 2)",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "3. The arrival of four-day week (Phiên bản 2)"
  },
  {
    id: 7,
    title: "Women mathematicians (Phiên bản 1)",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "7. WOMEN IN MATHEMATICIANS (bản 1)"
  },
  {
    id: 8,
    title: "Women mathematicians (Phiên bản 2)",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "Women mathematicians (phiên bản 2)"
  },
  {
    id: 9,
    title: "Woman Mathematics (TP1)",
    sticker: "★★★★★ Hay ra",
    cloverLevel: 5,
    originalTopic: "Woman Mathematics (TP1)"
  },

  // ☘️☘️☘️☘️ (4 lá - Tần suất cao)
  {
    id: 10,
    title: "Digital Transformation in Education",
    sticker: "Đề tủ",
    cloverLevel: 4,
    originalTopic: "2. DIGITAL TRANSFORMATION – CHUYỂN ĐỔI KỸ THUẬT SỐ"
  },
  {
    id: 11,
    title: "Cultural Exchange Programs",
    sticker: "Đề tủ",
    cloverLevel: 4,
    originalTopic: "1. CULTURAL EXCHANGE – TRAO ĐỔI VĂN HÓA"
  },
  {
    id: 12,
    title: "Urban Development and Green Cities",
    sticker: "Đề tủ",
    cloverLevel: 4,
    originalTopic: "7. Urban Development"
  },

  // ☘️☘️☘️ (3 lá - Thường gặp)
  {
    id: 13,
    title: "Wellness and Mental Health Trends",
    sticker: "VIP",
    cloverLevel: 3,
    originalTopic: "5. WELLNESS TRENDS – XU HƯỚNG SỨC KHỎE"
  },
  {
    id: 14,
    title: "The Evolution of Modern Photography",
    sticker: "VIP",
    cloverLevel: 3,
    originalTopic: "Photography Evolution"
  },
  {
    id: 15,
    title: "Renewable Energy Transitions",
    sticker: "VIP",
    cloverLevel: 3,
    originalTopic: "Renewable Energy Transitions"
  }
];
