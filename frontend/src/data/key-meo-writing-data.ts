/**
 * Dữ liệu chuẩn cho tính năng Key và Mẹo Thi Aptis - Writing (Part 1 - 4)
 * Thiết kế chuẩn theo định dạng Aptis ESOL 2026 và tài liệu Cải Thiện Web TA.
 */

export interface WritingPart1Item {
  questionType: string;
  responseGuideline: string;
  example: string;
}

export interface WritingPart2Formula {
  purpose: string;
  template: string;
}

export interface WritingConnectorGroup {
  category: string;
  words: string;
}

export interface WritingPartData {
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
  formulasP1?: { questionWord: string; responseFormat: string }[];
  examplesP1?: { question: string; answer: string }[];
  // Part 2 specific
  formulasP2?: WritingPart2Formula[];
  exampleP2?: {
    step1: string;
    step2: string;
    step3: string;
    complete: string;
  };
  // Part 3 specific
  formulasP3?: {
    typeTitle: string;
    formula: string;
    breakdown: string;
  }[];
  connectorsP3?: WritingConnectorGroup[];
  // Part 4 specific
  emailStructuresP4?: {
    type: "informal" | "formal";
    title: string;
    wordCount: string;
    steps: { stepNum: number; stepTitle: string; suggestion: string }[];
  }[];
  formulasP4?: { purpose: string; phrase: string }[];
  exampleP4?: {
    context: string;
    informalSample: string;
    formalSample: string;
  };
}

export const WRITING_KEY_MEO_DATA: Record<string, WritingPartData> = {
  p1: {
    partNumber: 1,
    title: "Aptis Writing – Part 1",
    badge: "Trả lời 5 câu ngắn",
    subtitle: "Trả lời 5 câu hỏi ngắn với 1–5 từ. Đúng trọng tâm, không cần giải thích dài.",
    overview:
      "Part 1 gồm 5 câu hỏi ngắn, yêu cầu bạn trả lời từ 1–5 từ. Các câu hỏi thường xoay quanh thông tin cá nhân, sở thích, thói quen và hoạt động hàng ngày.",
    recommendedTime: "~ 3 phút",
    tips: [
      "Đọc kỹ câu hỏi và xác định từ khóa nghi vấn (Who, Where, When, What, How...).",
      "Trả lời trực tiếp vào trọng tâm, tuyệt đối không viết câu văn dài giải thích.",
      "Dùng từ quen thuộc, đơn giản, không cố gượng ép dùng từ vựng khó.",
      "Kiểm soát chặt chẽ số từ: chỉ từ 1 đến tối đa 5 từ mỗi câu.",
      "Kiểm tra kỹ chính tả, đặc biệt viết hoa các danh từ riêng (tên thành phố, thứ, tháng).",
    ],
    formulasP1: [
      { questionWord: "What", responseFormat: "Sự vật / hoạt động → Reading books" },
      { questionWord: "Where", responseFormat: "Địa điểm → Ho Chi Minh City" },
      { questionWord: "When", responseFormat: "Thời gian → In the evening" },
      { questionWord: "Who", responseFormat: "Người → My best friend" },
      { questionWord: "Why", responseFormat: "Lý do ngắn → Because it's fun" },
      { questionWord: "How", responseFormat: "Phương tiện / cách thức → By motorbike" },
      { questionWord: "How often", responseFormat: "Tần suất → Twice a week" },
    ],
    mistakesToAvoid: [
      "Trả lời sai trọng tâm câu hỏi (hỏi Where lại trả lời thời gian).",
      "Viết quá dài (vượt quá 5 từ khiến hệ thống trừ điểm quy chuẩn).",
      "Viết thiếu thông tin hoặc để trống câu hỏi.",
      "Sai chính tả danh từ riêng hoặc chia sai từ loại.",
      "Nhầm lẫn giữa các từ để hỏi: Where và When, Who và What.",
    ],
    examplesP1: [
      { question: "Where do you live?", answer: "Ho Chi Minh City." },
      { question: "How often do you exercise?", answer: "Twice a week." },
      { question: "What do you like?", answer: "Reading books." },
      { question: "Why do you study English?", answer: "Because it helps me in my future." },
    ],
    quickRemember: {
      highlight: "1–5 từ / câu",
      description: "Chỉ cần trả lời đúng trọng tâm câu hỏi, không cần giải thích dài.",
    },
  },

  p2: {
    partNumber: 2,
    title: "Aptis Writing – Part 2",
    badge: "Điền form thành viên CLB",
    subtitle: "Viết câu trả lời cho biểu mẫu CLB với 20–30 từ. Trả lời trọn vẹn, có lý do & lợi ích.",
    overview:
      "Bạn sẽ đóng vai là thành viên mới của một CLB. Viết câu trả lời cho câu hỏi trong biểu mẫu đăng ký. Giới hạn 20–30 từ. Chủ đề thường xoay quanh sở thích, mục tiêu, hoạt động hoặc lý do tham gia câu lạc bộ/khóa học.",
    recommendedTime: "5 – 7 phút",
    tips: [
      "Trả lời trực tiếp câu hỏi được nêu trong biểu mẫu.",
      "Giải thích lý do cụ thể sử dụng từ nối: because / since.",
      "Bổ sung thông tin về lợi ích hoặc ví dụ thực tế.",
      "Viết khoảng 2 câu hoàn chỉnh, tránh viết câu quá dài dễ sai ngữ pháp.",
      "Dùng từ nối tự nhiên: also, because, and, in addition.",
      "Đúng số từ yêu cầu (20–30 từ), tuyệt đối không viết dưới 20 từ.",
    ],
    formulasP2: [
      { purpose: "Nêu sở thích", template: "I really enjoy..." },
      { purpose: "Nêu quan điểm", template: "I think that..." },
      { purpose: "Nêu lý do", template: "This is because..." },
      { purpose: "Nêu lợi ích", template: "It helps me..." },
      { purpose: "Nêu kỳ vọng", template: "I hope to..." },
      { purpose: "Bổ sung ý", template: "It also allows me to..." },
    ],
    mistakesToAvoid: [
      "Chỉ viết một cụm từ thay vì câu hoàn chỉnh (Subject + Verb).",
      "Chỉ trả lời WHAT mà không giải thích WHY (thiếu lý do hỗ trợ).",
      "Lặp từ vựng quá nhiều trong một đoạn ngắn.",
      "Dùng sai thì động từ (bài Part 2 chủ yếu dùng Hiện Tại Đơn).",
      "Viết quá dài (> 35 từ) hoặc lạc đề không gắn với hoạt động CLB.",
    ],
    exampleP2: {
      step1: "Bước 1 (Answer) → I really enjoy travelling",
      step2: "Bước 2 (Reason) → Because I can explore new places",
      step3: "Bước 3 (Additional) → It also helps me relax and learn about different cultures",
      complete:
        "I really enjoy travelling because I can explore new places. It also helps me relax and learn about different cultures after working hard.",
    },
    quickRemember: {
      highlight: "20–30 từ / bài",
      description: "Công thức chuẩn 2 câu: 1 câu trả lời trực tiếp + 1 câu giải thích lý do & lợi ích với because/also.",
    },
  },

  p3: {
    partNumber: 3,
    title: "Aptis Writing – Part 3",
    badge: "Chat nhóm 3 câu hỏi",
    subtitle: "Trả lời 3 câu hỏi trong group chat của CLB. Mỗi câu 30–40 từ, có cảm xúc & tương tác.",
    overview:
      "Có 3 câu hỏi từ 3 thành viên khác nhau trong cuộc trò chuyện nhóm của CLB. Mỗi câu trả lời khoảng 30–40 từ. Các câu hỏi thường yêu cầu kể trải nghiệm cá nhân, nêu quan điểm hoặc đề xuất giải pháp cho CLB.",
    recommendedTime: "~ 15 phút (5 phút / câu)",
    tips: [
      "Đọc kỹ từng câu hỏi để xác định dạng bài: Trải nghiệm, Quan điểm hay Đề xuất giải pháp.",
      "Phát triển ý và giải thích rõ ràng lý do cho quan điểm của mình.",
      "Thêm ví dụ hoặc dẫn chứng cụ thể giúp câu trả lời sinh động, thuyết phục.",
      "Sử dụng từ nối tự nhiên: because, also, however, for example, in addition.",
      "Đảm bảo đủ số từ yêu cầu: 30–40 từ cho mỗi câu trả lời.",
      "Không lặp ý: Mỗi câu hỏi phải có một nội dung và góc nhìn riêng biệt.",
    ],
    formulasP3: [
      {
        typeTitle: "Dạng 1: Trải nghiệm cá nhân",
        formula: "Experience → Details → Feeling",
        breakdown:
          "When / Where (Thời gian, địa điểm) → What happened (Điều gì đã xảy ra?) → How you felt (Cảm xúc cá nhân).",
      },
      {
        typeTitle: "Dạng 2: Nêu quan điểm (Opinion)",
        formula: "Opinion → Reason → Example → Conclusion",
        breakdown:
          "Nêu ý kiến rõ ràng → Giải thích lý do cốt lõi → Đưa ra ví dụ thực tế → Khẳng định lại quan điểm.",
      },
      {
        typeTitle: "Dạng 3: Đề xuất, giải pháp (Suggestions)",
        formula: "Suggestion → Explanation → Benefit",
        breakdown:
          "Đưa ra giải pháp cụ thể → Giải thích cách thức triển khai → Nêu lợi ích trực tiếp cho CLB.",
      },
    ],
    connectorsP3: [
      { category: "Bổ sung ý", words: "Also, moreover, in addition, besides" },
      { category: "Nguyên nhân", words: "Because, since, as, due to" },
      { category: "Kết quả", words: "Therefore, as a result, so" },
      { category: "Ví dụ", words: "For example, for instance, such as" },
      { category: "Đối lập", words: "However, although, on the other hand" },
      { category: "Kết luận", words: "Overall, in conclusion, all in all" },
    ],
    mistakesToAvoid: [
      "Bỏ sót một trong ba câu hỏi của các thành viên.",
      "Chỉ trả lời cụt lủn YES hoặc NO mà không diễn giải thêm.",
      "Không giải thích lý do cho quan điểm mình đưa ra.",
      "Kể chuyện nhưng khô khan, thiếu cảm xúc cá nhân.",
      "Đề xuất giải pháp quá chung chung, không có tính khả thi.",
      "Lạm dụng từ nối gượng gạo, không phù hợp ngữ cảnh.",
      "Viết dưới giới hạn từ (< 30 từ/câu) khiến mất điểm độ dài.",
    ],
    quickRemember: {
      highlight: "30–40 từ x 3 câu",
      description: "Mỗi câu 3 vế: Trả lời trực tiếp + Dẫn chứng chi tiết + Cảm xúc cá nhân hoặc đề xuất giải pháp.",
    },
  },

  p4: {
    partNumber: 4,
    title: "Aptis Writing – Part 4",
    badge: "Viết 2 Email phản hồi",
    subtitle: "Viết 2 bức thư phản hồi thông báo: 1 thư thân mật cho bạn (40–50 từ) & 1 thư trang trọng cho quản lý (120–150 từ).",
    overview:
      "Bạn nhận được một email thông báo mới từ CLB (thường là thay đổi lịch sinh hoạt, tăng phí, hủy sự kiện...). Bạn cần viết: Thư 1 gửi một người bạn trong CLB (Informal: 40–50 từ); Thư 2 gửi Ban quản trị CLB (Formal: 120–150 từ).",
    recommendedTime: "~ 25 phút (7p thư bạn, 18p thư quản lý)",
    tips: [
      "Đọc kỹ thông báo, gạch chân tất cả các ý then chốt cần phản hồi.",
      "Xác định đúng đối tượng người nhận để chọn văn phong Informal hay Formal phù hợp.",
      "Nêu rõ cảm xúc: vui mừng, thất vọng (disappointed), hào hứng (excited), lo ngại (concerned)...",
      "Đưa ra giải pháp mang tính xây dựng: suggest, recommend, propose...",
      "Chia đoạn rõ ràng (ít nhất 3 đoạn cho thư trang trọng 120–150 từ).",
      "Không lặp ý: Mỗi đoạn trong thư phải phục vụ một mục đích rõ ràng.",
      "Kiểm soát số từ: Thư bạn 40–50 từ; Thư quản lý 120–150 từ, không viết lan man.",
    ],
    emailStructuresP4: [
      {
        type: "informal",
        title: "Bố cục Thư thân mật (Informal Email - Bạn bè)",
        wordCount: "40 – 50 từ",
        steps: [
          { stepNum: 1, stepTitle: "Chào hỏi & Mục đích", suggestion: "Hi [Tên bạn], Have you heard about the club's announcement?" },
          { stepNum: 2, stepTitle: "Bộc lộ cảm xúc", suggestion: "I was really surprised/disappointed to hear that..." },
          { stepNum: 3, stepTitle: "Đề xuất giải pháp", suggestion: "Why don't we go together? / How about we talk to the manager?" },
          { stepNum: 4, stepTitle: "Kết thư thân mật", suggestion: "Talk to you soon! / Let me know what you think." },
        ],
      },
      {
        type: "formal",
        title: "Bố cục Thư trang trọng (Formal Email - Ban Quản Lý)",
        wordCount: "120 – 150 từ",
        steps: [
          { stepNum: 1, stepTitle: "Chào hỏi & Nêu lý do", suggestion: "Dear Sir or Madam, / I am writing this email to express my concern regarding..." },
          { stepNum: 2, stepTitle: "Cảm xúc & Ảnh hưởng", suggestion: "I was quite disappointed to learn that... This will cause major inconvenience because..." },
          { stepNum: 3, stepTitle: "Đề xuất 2 giải pháp cụ thể", suggestion: "I would like to suggest that the club should... Alternatively, we could consider..." },
          { stepNum: 4, stepTitle: "Kỳ vọng & Lời kết trang trọng", suggestion: "I hope you will take my feedback into consideration. I look forward to hearing from you. / Yours faithfully," },
        ],
      },
    ],
    formulasP4: [
      { purpose: "Nêu sở thích / Quan tâm", phrase: "I have been an active member of our club for..." },
      { purpose: "Nêu cảm xúc trang trọng", phrase: "I was extremely disappointed and concerned to hear about..." },
      { purpose: "Nêu ảnh hưởng tiêu cực", phrase: "This sudden decision creates considerable difficulty for members because..." },
      { purpose: "Đề xuất giải pháp 1", phrase: "I would like to suggest that the committee could consider..." },
      { purpose: "Đề xuất giải pháp 2", phrase: "An alternative option would be to organize..." },
      { purpose: "Kỳ vọng phản hồi", phrase: "I hope you will take these suggestions into consideration." },
      { purpose: "Chào kết trang trọng", phrase: "Yours faithfully, (khi không biết tên) / Yours sincerely, (khi biết tên)" },
    ],
    mistakesToAvoid: [
      "Dùng từ viết tắt (I'm, don't, can't) trong Formal Email (bắt buộc viết I am, do not, cannot).",
      "Dùng từ lóng, biểu cảm suồng sã hoặc ký tự cảm thán (!) trong thư gửi Ban quản lý.",
      "Quên chia đoạn trong thư dài 120–150 từ (bị trừ điểm tiêu chí Coherence & Cohesion).",
      "Chỉ biết phàn nàn mà không đưa ra bất kỳ đề xuất giải pháp mang tính xây dựng nào.",
      "Viết quá ngắn (< 120 từ) hoặc viết quá dài (> 165 từ) dễ mắc thêm lỗi ngữ pháp.",
    ],
    quickRemember: {
      highlight: "40–50 từ (Bạn) & 120–150 từ (Quản lý)",
      description: "Thư bạn bè: Thân mật, có cảm xúc, rủ rê. Thư quản lý: Trang trọng, không viết tắt, có 2 giải pháp cụ thể.",
    },
  },
};

