// Authentic Listening Topics & Priority Clover Map for Aptis ESOL
// Part 2 (Information Matching), Part 3 (Opinion Matching), Part 4 (Monologue Comprehension)
// Đồng bộ chuẩn hệ thống Cỏ May Mắn ☘️ từ 1 đến 5 Cỏ theo mức độ xuất hiện trong đề thi thật British Council

export interface ListeningTopicItem {
  id: number;
  keyword: string;
  title: string;
  context: string;
  hotLevel: number;
  sticker: string;
}

export const LISTENING_PART2_TOPICS: ListeningTopicItem[] = [
  // 5 Cỏ ☘️☘️☘️☘️☘️ (Siêu Hot / Đề Tủ)
  { id: 1, keyword: "environment", title: "Protecting the environment", context: "Bảo vệ môi trường, phân loại rác & năng lượng tái tạo", hotLevel: 5, sticker: "☘️☘️☘️☘️☘️ Siêu Hot" },
  { id: 2, keyword: "online shopping", title: "Online shopping", context: "Mua sắm trực tuyến, giao hàng & ưu đãi thương mại điện tử", hotLevel: 5, sticker: "☘️☘️☘️☘️☘️ Siêu Hot" },
  { id: 3, keyword: "listening to music", title: "Listening to music", context: "Sở thích nghe nhạc, tai nghe & thể loại âm nhạc yêu thích", hotLevel: 5, sticker: "☘️☘️☘️☘️☘️ Siêu Hot" },

  // 4 Cỏ ☘️☘️☘️☘️ (Hay ra)
  { id: 4, keyword: "doing exercise", title: "Doing exercises", context: "Thói quen rèn luyện thể thao & nâng cao sức khỏe", hotLevel: 4, sticker: "☘️☘️☘️☘️ Hay ra" },
  { id: 5, keyword: "exercise preferences", title: "Exercise preferences", context: "Lựa chọn các môn thể dục và địa điểm tập luyện", hotLevel: 4, sticker: "☘️☘️☘️☘️ Hay ra" },
  { id: 6, keyword: "outdoor activities", title: "Outdoor activities", context: "Các hoạt động dã ngoại ngoài trời và hòa mình vào thiên nhiên", hotLevel: 4, sticker: "☘️☘️☘️☘️ Hay ra" },
  { id: 7, keyword: "internet", title: "Purposes of using the Internet", context: "Mục đích sử dụng mạng Internet trong học tập và công việc", hotLevel: 4, sticker: "☘️☘️☘️☘️ Hay ra" },
  { id: 8, keyword: "travel to work", title: "Travelling to work", context: "Phương tiện đi làm hàng ngày, xe buýt, tàu điện ngầm & tắc đường", hotLevel: 4, sticker: "☘️☘️☘️☘️ Hay ra" },
  { id: 9, keyword: "journey to work", title: "Journey to work", context: "Hành trình di chuyển đi làm của các nhân vật", hotLevel: 4, sticker: "☘️☘️☘️☘️ Hay ra" },

  // 3 Cỏ ☘️☘️☘️ (Thường gặp)
  { id: 10, keyword: "place to run", title: "Places to run", context: "Địa điểm chạy bộ lý tưởng: công viên, bờ sông & sân vận động", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 11, keyword: "running", title: "Running", context: "Lợi ích của việc chạy bộ mỗi sáng", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 12, keyword: "studying", title: "Studying habit", context: "Thói quen học tập, ôn thi tại thư viện và tự học ở nhà", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 13, keyword: "museum", title: "Visiting a new museum", context: "Trải nghiệm tham quan bảo tàng mới mở", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 14, keyword: "art", title: "Doing arts", context: "Sở thích vẽ tranh, điêu khắc và hoạt động nghệ thuật", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 15, keyword: "restaurant", title: "Restaurant experiences", context: "Trải nghiệm ẩm thực và đánh giá chất lượng phục vụ tại nhà hàng", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 16, keyword: "sport", title: "Sport", context: "Niềm đam mê thể thao và các trận cầu hấp dẫn", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 17, keyword: "reading books", title: "Reading books", context: "Văn hóa đọc sách và các thể loại văn học được ưa chuộng", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
];

export const LISTENING_PART3_TOPICS: ListeningTopicItem[] = [
  // 5 Cỏ ☘️☘️☘️☘️☘️ (Siêu Hot / Đề Tủ)
  { id: 1, keyword: "singers and music", title: "Singers and music", context: "Tranh luận về các ca sĩ, phong cách biểu diễn & ngành công nghiệp âm nhạc", hotLevel: 5, sticker: "☘️☘️☘️☘️☘️ Siêu Hot" },
  { id: 2, keyword: "urban farming", title: "Urban farming", context: "Mô hình nông nghiệp đô thị, trồng rau sân thượng & thực phẩm sạch", hotLevel: 5, sticker: "☘️☘️☘️☘️☘️ Siêu Hot" },
  { id: 3, keyword: "career changes", title: "Career changes", context: "Quan điểm về việc chuyển đổi nghề nghiệp và cơ hội thăng tiến", hotLevel: 5, sticker: "☘️☘️☘️☘️☘️ Siêu Hot" },

  // 4 Cỏ ☘️☘️☘️☘️ (Hay ra)
  { id: 4, keyword: "children", title: "Children & technology", context: "Tác động của thiết bị công nghệ đối với sự phát triển của trẻ em", hotLevel: 4, sticker: "☘️☘️☘️☘️ Hay ra" },
  { id: 5, keyword: "volunteer", title: "Volunteer events", context: "Hoạt động tình nguyện cộng đồng, gây quỹ từ thiện & giúp đỡ người khó khăn", hotLevel: 4, sticker: "☘️☘️☘️☘️ Hay ra" },
  { id: 6, keyword: "university", title: "University education", context: "Giá trị của giáo dục đại học và kỹ năng thực tế cho sinh viên", hotLevel: 4, sticker: "☘️☘️☘️☘️ Hay ra" },
  { id: 7, keyword: "information technology", title: "Information technology", context: "Sự bùng nổ của CNTT và trí tuệ nhân tạo trong đời sống", hotLevel: 4, sticker: "☘️☘️☘️☘️ Hay ra" },
  { id: 8, keyword: "the internet", title: "The Internet", context: "Lợi ích và mặt trái của mạng xã hội cùng thế giới số", hotLevel: 4, sticker: "☘️☘️☘️☘️ Hay ra" },

  // 3 Cỏ ☘️☘️☘️ (Thường gặp)
  { id: 9, keyword: "community", title: "Community building", context: "Gắn kết cộng đồng dân cư và thiết kế không gian sinh hoạt chung", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 10, keyword: "cultural", title: "Local cultural differences", context: "Sự khác biệt văn hóa vùng miền và phong tục tập quán", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 11, keyword: "festivals", title: "Local festivals", context: "Lễ hội truyền thống địa phương và bảo tồn di sản", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 12, keyword: "homeschooling", title: "Homeschooling", context: "Tranh luận về phương pháp giáo dục tại nhà so với trường học truyền thống", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 13, keyword: "politics", title: "Politics", context: "Chính trị xã hội và sự tham gia của giới trẻ vào các chính sách công", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 14, keyword: "beauty", title: "Beauty", context: "Tiêu chuẩn vẻ đẹp hiện đại và ảnh hưởng từ truyền thông", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 15, keyword: "art", title: "Art", context: "Đánh giá các tác phẩm nghệ thuật đương đại và triển lãm", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 16, keyword: "auditions", title: "Auditions", context: "Vòng thử giọng/thử vai cho các diễn viên và nghệ sĩ", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 17, keyword: "local center", title: "Local center", context: "Các hoạt động sinh hoạt tại trung tâm văn hóa địa phương", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 18, keyword: "workplace", title: "Changes in the workplace", context: "Những thay đổi tại nơi làm việc và xu hướng văn phòng mở", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
];

export const LISTENING_PART4_TOPICS: ListeningTopicItem[] = [
  // 5 Cỏ ☘️☘️☘️☘️☘️ (Siêu Hot / Đề Tủ)
  { id: 1, keyword: "sleep", title: "The importance of sleep", context: "Tầm quan trọng của giấc ngủ đối với não bộ, sức khỏe và hiệu suất làm việc", hotLevel: 5, sticker: "☘️☘️☘️☘️☘️ Siêu Hot" },
  { id: 2, keyword: "work from home", title: "Work from home", context: "Xu hướng làm việc từ xa, cân bằng cuộc sống và năng suất lao động", hotLevel: 5, sticker: "☘️☘️☘️☘️☘️ Siêu Hot" },
  { id: 3, keyword: "nutritionist", title: "A nutritionist's career", context: "Con đường sự nghiệp của chuyên gia dinh dưỡng và chế độ ăn lành mạnh", hotLevel: 5, sticker: "☘️☘️☘️☘️☘️ Siêu Hot" },
  { id: 4, keyword: "music industry", title: "A musician's career", context: "Sự nghiệp nhạc sĩ, sản xuất âm nhạc và phát hành đĩa hát", hotLevel: 5, sticker: "☘️☘️☘️☘️☘️ Siêu Hot" },

  // 4 Cỏ ☘️☘️☘️☘️ (Hay ra)
  { id: 5, keyword: "advertising", title: "Advertising and sponsoring", context: "Chiến lược quảng cáo, tài trợ sự kiện và hành vi người tiêu dùng", hotLevel: 4, sticker: "☘️☘️☘️☘️ Hay ra" },
  { id: 6, keyword: "financial", title: "Managing financial spending", context: "Quản lý tài chính cá nhân, tiết kiệm và kế hoạch chi tiêu hợp lý", hotLevel: 4, sticker: "☘️☘️☘️☘️ Hay ra" },
  { id: 7, keyword: "development plan", title: "A regional development plan", context: "Quy hoạch phát triển vùng, hạ tầng giao thông và đô thị bền vững", hotLevel: 4, sticker: "☘️☘️☘️☘️ Hay ra" },
  { id: 8, keyword: "life after university", title: "Life after university", context: "Cuộc sống sau khi tốt nghiệp đại học, tìm việc và định hướng tương lai", hotLevel: 4, sticker: "☘️☘️☘️☘️ Hay ra" },
  { id: 9, keyword: "scientist", title: "A life of a scientist", context: "Tiểu sử và những cống hiến khoa học đột phá của nhà nghiên cứu", hotLevel: 4, sticker: "☘️☘️☘️☘️ Hay ra" },
  { id: 10, keyword: "writer", title: "Famous writers", context: "Phân tích tác phẩm và cuộc đời sáng tác của các văn hào nổi tiếng", hotLevel: 4, sticker: "☘️☘️☘️☘️ Hay ra" },
  { id: 11, keyword: "novel", title: "A newly released novel", context: "Bình luận cuốn tiểu thuyết mới phát hành và thông điệp tác phẩm", hotLevel: 4, sticker: "☘️☘️☘️☘️ Hay ra" },

  // 3 Cỏ ☘️☘️☘️ (Thường gặp)
  { id: 12, keyword: "script", title: "Script production", context: "Quy trình sản xuất kịch bản phim ảnh và nghệ thuật sân khấu", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 13, keyword: "promotion campaign", title: "A Promotion Campaign for a Product", context: "Chiến dịch quảng bá sản phẩm mới ra mắt thị trường", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 14, keyword: "security cameras", title: "Security cameras & Professionalism", context: "Lắp đặt camera an ninh và tính chuyên nghiệp trong công sở", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 15, keyword: "cycling", title: "Cycling expedition", context: "Chuyến thám hiểm bằng xe đạp qua nhiều cung đường thử thách", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 16, keyword: "happiness", title: "A research into happiness", context: "Nghiên cứu khoa học về các yếu tố mang lại hạnh phúc cho con người", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 17, keyword: "concentration", title: "Concentration", context: "Phương pháp rèn luyện sự tập trung cao độ và loại bỏ xao nhãng", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 18, keyword: "team motivation", title: "Team motivation", context: "Nghệ thuật tạo động lực làm việc và tinh thần đoàn kết đội ngũ", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 19, keyword: "business strategy", title: "Business strategy", context: "Chiến lược kinh doanh và cạnh tranh trong thị trường mới", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 20, keyword: "viral video", title: "Viral video", context: "Hiện tượng video lan truyền chóng mặt trên mạng xã hội", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 21, keyword: "podcast", title: "Podcast Discussion", context: "Bàn luận về xu hướng nghe và sản xuất chương trình Podcast", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 22, keyword: "television", title: "Television Series", context: "Sức hút của các bộ phim truyền hình nhiều tập ăn khách", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 23, keyword: "railways", title: "The History Of Railways", context: "Lịch sử phát triển của ngành đường sắt và đầu máy hơi nước", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 24, keyword: "making plans", title: "Making plans", context: "Kỹ năng lập kế hoạch và quản lý mục tiêu cá nhân", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 25, keyword: "modern society", title: "Modern Society", context: "Những biến đổi sâu sắc trong lối sống của xã hội hiện đại", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
  { id: 26, keyword: "greek artist", title: "Exhibition by Greek artist Jame Panos", context: "Triển lãm các tác phẩm hội họa của nghệ sĩ Hy Lạp", hotLevel: 3, sticker: "☘️☘️☘️ Thường gặp" },
];
