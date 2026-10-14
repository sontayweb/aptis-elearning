// Authentic Listening Topics & Context Map
// Formatted for Aptis ESOL Part 2, Part 3, and Part 4

export interface ListeningTopicItem {
  id: number;
  title: string;
  context: string;
  sticker: "★★★★★ Hay ra" | "VIP" | "Đề tủ" | "Mới cập nhật";
}

export const LISTENING_PART2_TOPICS: ListeningTopicItem[] = [
  { id: 1, title: "Opinions on Public Transportation", context: "4 người chia sẻ về xe buýt và tàu điện ngầm", sticker: "★★★★★ Hay ra" },
  { id: 2, title: "Summer Vacation Experiences", context: "4 nhân vật kể về kỳ nghỉ hè gần đây", sticker: "Đề tủ" },
  { id: 3, title: "Remote Working from Home", context: "Quan điểm về xu hướng làm việc tại nhà", sticker: "VIP" },
  { id: 4, title: "Favorite Hobbies & Outdoor Sports", context: "Thói quen rèn luyện thể thao hàng ngày", sticker: "★★★★★ Hay ra" },
  { id: 5, title: "New Restaurant Reviews", context: "Đánh giá chất lượng phục vụ & món ăn", sticker: "Mới cập nhật" },
  { id: 6, title: "Language Learning Methods", context: "Kinh nghiệm tự học ngoại ngữ hiệu quả", sticker: "VIP" },
  { id: 7, title: "College Campus Life", context: "Cuộc sống sinh viên tại ký túc xá", sticker: "Đề tủ" },
  { id: 8, title: "Environmental Volunteer Projects", context: "Tham gia chiến dịch trồng cây & dọn rác", sticker: "★★★★★ Hay ra" },
];

export const LISTENING_PART3_TOPICS: ListeningTopicItem[] = [
  { id: 1, title: "Booking an Airline Flight Ticket", context: "Hội thoại giữa hành khách và nhân viên bán vé", sticker: "★★★★★ Hay ra" },
  { id: 2, title: "Moving to a New City Apartment", context: "Hai bạn trẻ thảo luận việc thuê nhà trọ", sticker: "Đề tủ" },
  { id: 3, title: "Planning a Colleague's Birthday Party", context: "Bàn kế hoạch mua quà và chọn địa điểm tiệc", sticker: "VIP" },
  { id: 4, title: "Online Shopping vs High Street Shops", context: "Tranh luận về sự tiện lợi và rủi ro mua sắm", sticker: "★★★★★ Hay ra" },
  { id: 5, title: "Organizing an Annual Tech Conference", context: "Phân công nhiệm vụ hậu cần sự kiện", sticker: "Mới cập nhật" },
  { id: 6, title: "Gym Membership & Fitness Routine", context: "Trao đổi về chế độ tập luyện giảm cân", sticker: "VIP" },
];

export const LISTENING_PART4_TOPICS: ListeningTopicItem[] = [
  { id: 1, title: "Morning Radio Traffic & Weather Forecast", context: "Bản tin phát thanh về tình hình kẹt xe & mưa lớn", sticker: "★★★★★ Hay ra" },
  { id: 2, title: "Academic Lecture: Marine Biology & Corals", context: "Bài giảng đại học về rạn san hô và đại dương", sticker: "Đề tủ" },
  { id: 3, title: "Museum Audio Guide: Ancient Artifacts", context: "Lời thuyết minh hướng dẫn tham quan bảo tàng", sticker: "VIP" },
  { id: 4, title: "Special Report: Solar Energy Transitions", context: "Báo cáo khoa học về công nghệ pin mặt trời", sticker: "★★★★★ Hay ra" },
  { id: 5, title: "Community Announcement: Library Renovation", context: "Thông báo sửa chữa và thời gian mở cửa thư viện", sticker: "Mới cập nhật" },
  { id: 6, title: "Keynote Speech: Artificial Intelligence in Healthcare", context: "Bài phát biểu về ứng dụng AI trong y tế", sticker: "VIP" },
];
