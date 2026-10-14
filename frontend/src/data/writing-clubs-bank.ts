// Authentic Aptis ESOL Writing Club Banks
// Covers Part 2, Part 3, and Part 4 with both Informal and Formal Email (Manager)

export interface WritingClubItem {
  id: number;
  clubNameEn: string;
  clubNameVi: string;
  sticker: "★★★★★ Hay ra" | "VIP" | "Đề tủ" | "Mới cập nhật";
  part2: {
    formField: string;
    description: string;
    wordLimit: string;
  };
  part3: {
    context: string;
    questions: { member: string; question: string }[];
  };
  part4: {
    noticeTitle: string;
    noticeContent: string;
    friendEmailPrompt: string; // ~50 words
    managerEmailPrompt: string; // 120-150 words (Formal email to Club Manager)
  };
}

export const WRITING_CLUBS_BANK: WritingClubItem[] = [
  {
    id: 1,
    clubNameEn: "International Travel Club",
    clubNameVi: "Câu Lạc Bộ Du Lịch Quốc Tế",
    sticker: "★★★★★ Hay ra",
    part2: {
      formField: "Please tell us about your favorite holiday destination and why you enjoy traveling there.",
      description: "Write in full sentences (20–30 words).",
      wordLimit: "20–30 từ",
    },
    part3: {
      context: "You are in the member chat room. Respond to the three other members.",
      questions: [
        { member: "Sam", question: "Welcome to the club! Why did you decide to join our travel group?" },
        { member: "Elena", question: "What was the most memorable trip you have ever taken?" },
        { member: "David", question: "Some people prefer traveling alone, while others like group tours. What is your opinion?" },
      ],
    },
    part4: {
      noticeTitle: "Club Notice: Annual Summer Trip Fee Increase",
      noticeContent: "Dear members, due to rising transportation and accommodation costs, the fee for our upcoming annual overseas trip will increase by 30%. Furthermore, spaces are now limited to 15 members.",
      friendEmailPrompt: "Write an email to your friend who is also a club member. Express your feelings about the price increase and say what you plan to do (about 50 words).",
      managerEmailPrompt: "Write an email to the Club Manager. Express your concerns about the steep price increase, explain how it impacts members, and politely propose alternative solutions (120–150 words).",
    },
  },
  {
    id: 2,
    clubNameEn: "Community Book Club",
    clubNameVi: "Câu Lạc Bộ Sách Cộng Đồng",
    sticker: "Đề tủ",
    part2: {
      formField: "Please tell us what kind of books you enjoy reading and how often you read.",
      description: "Write in full sentences (20–30 words).",
      wordLimit: "20–30 từ",
    },
    part3: {
      context: "You are interacting in the book club forum.",
      questions: [
        { member: "Claire", question: "Hi! How did you find out about our book club?" },
        { member: "Mark", question: "Do you prefer reading printed physical books or digital e-books? Why?" },
        { member: "Sophie", question: "Which author or book has influenced your thinking the most?" },
      ],
    },
    part4: {
      noticeTitle: "Club Notice: Cancellation of Author Meet & Greet",
      noticeContent: "Dear members, we regret to inform you that our monthly meeting and the guest author visit scheduled for this weekend have been cancelled due to room maintenance issues at the local library.",
      friendEmailPrompt: "Write an email to your friend in the club. Express your disappointment and suggest an alternative place to meet and discuss the book (about 50 words).",
      managerEmailPrompt: "Write an email to the Club Manager. Express your dissatisfaction with the late cancellation notice, explain why members were looking forward to this event, and propose rescheduling it (120–150 words).",
    },
  },
  {
    id: 3,
    clubNameEn: "Youth Sports & Fitness Club",
    clubNameVi: "Câu Lạc Bộ Thể Thao & Thể Hình",
    sticker: "★★★★★ Hay ra",
    part2: {
      formField: "Please describe what sports or exercises you do and why you want to get fit.",
      description: "Write in full sentences (20–30 words).",
      wordLimit: "20–30 từ",
    },
    part3: {
      context: "You are chatting with members on the sports club app.",
      questions: [
        { member: "Lucas", question: "Welcome! What sports facilities do you hope to use most often here?" },
        { member: "Emma", question: "How do you stay motivated to work out when you feel tired?" },
        { member: "Oliver", question: "Do you think team sports are better than individual workouts? Why?" },
      ],
    },
    part4: {
      noticeTitle: "Club Notice: Weekend Operating Hours Shortened",
      noticeContent: "Dear members, starting next month, the gym and swimming pool will close early at 2:00 PM on weekends instead of 9:00 PM, due to staff shortages and energy conservation.",
      friendEmailPrompt: "Write an email to your workout partner in the club. Share your thoughts on the new weekend timetable (about 50 words).",
      managerEmailPrompt: "Write a formal email to the Club Manager. Explain how this schedule change disrupts working members who can only exercise on weekends, and suggest adjusting weekday hours instead (120–150 words).",
    },
  },
  {
    id: 4,
    clubNameEn: "Creative Photography Club",
    clubNameVi: "Câu Lạc Bộ Nhiếp Ảnh Sáng Tạo",
    sticker: "VIP",
    part2: {
      formField: "Please tell us what you like to photograph and what equipment you use.",
      description: "Write in full sentences (20–30 words).",
      wordLimit: "20–30 từ",
    },
    part3: {
      context: "You are participating in the photography group discussion.",
      questions: [
        { member: "Alex", question: "Welcome to the group! What inspired you to take up photography?" },
        { member: "Chloe", question: "Do you prefer landscape photography or street portraits? Why?" },
        { member: "Brian", question: "Do you believe expensive camera gear is necessary to take stunning pictures?" },
      ],
    },
    part4: {
      noticeTitle: "Club Notice: Photo Exhibition Postponed",
      noticeContent: "Dear members, we are sorry to announce that our annual gallery photo exhibition has been postponed indefinitely because the gallery venue has double-booked the hall.",
      friendEmailPrompt: "Write an email to your club friend. Express your frustration as you have prepared photos for months (about 50 words).",
      managerEmailPrompt: "Write a formal email to the Club Manager. Express your deep disappointment, highlight the hard work of all members, and urge the management to secure an alternative venue promptly (120–150 words).",
    },
  },
  {
    id: 5,
    clubNameEn: "Film & Cinema Club",
    clubNameVi: "Câu Lạc Bộ Điện Ảnh & Phim Truyện",
    sticker: "Mới cập nhật",
    part2: {
      formField: "Please tell us about your favorite movie genre and how often you watch movies.",
      description: "Write in full sentences (20–30 words).",
      wordLimit: "20–30 từ",
    },
    part3: {
      context: "You are discussing in the film club community chat.",
      questions: [
        { member: "Tom", question: "Welcome! Which film have you watched recently that left a strong impression?" },
        { member: "Jessica", question: "Do you prefer watching movies at the cinema or streaming them at home?" },
        { member: "Kevin", question: "In your opinion, are remakes of classic movies usually worth watching?" },
      ],
    },
    part4: {
      noticeTitle: "Club Notice: Movie Screening Ticket Prices Raised",
      noticeContent: "Dear members, beginning next week, entrance tickets for our private weekly cinema screenings will increase from £5 to £10 to cover licensing and equipment upgrades.",
      friendEmailPrompt: "Write an email to a fellow member friend. Express how you feel about the price doubling (about 50 words).",
      managerEmailPrompt: "Write an email to the Club Manager. Explain that the price increase is too high for students and regular members, and suggest offering student discounts or monthly season passes (120–150 words).",
    },
  },
  {
    id: 6,
    clubNameEn: "Cooking & Gourmet Food Club",
    clubNameVi: "Câu Lạc Bộ Ẩm Thực & Nấu Ăn",
    sticker: "★★★★★ Hay ra",
    part2: {
      formField: "Please tell us what kind of food you like to cook and who taught you how to cook.",
      description: "Write in full sentences (20–30 words).",
      wordLimit: "20–30 từ",
    },
    part3: {
      context: "You are chatting with cooking enthusiasts in the club.",
      questions: [
        { member: "Maria", question: "Welcome! What signature dish are you most confident preparing?" },
        { member: "Liam", question: "Do you enjoy cooking for large family gatherings or just for yourself?" },
        { member: "Grace", question: "How important is using fresh organic ingredients compared to standard ones?" },
      ],
    },
    part4: {
      noticeTitle: "Club Notice: Masterclass Workshop Cancelled",
      noticeContent: "Dear members, the guest chef masterclass scheduled for this Saturday has been called off because the demonstration kitchen suffered water pipe damage.",
      friendEmailPrompt: "Write an email to your friend who planned to attend with you. Express your feelings and suggest cooking together at home instead (about 50 words).",
      managerEmailPrompt: "Write an email to the Club Manager. Express your disappointment with the cancellation, ask about refund policies or reschedule dates, and recommend hiring an alternative kitchen space (120–150 words).",
    },
  },
];
