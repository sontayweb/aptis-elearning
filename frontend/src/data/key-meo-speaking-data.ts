/**
 * Dữ liệu chuẩn cho tính năng Key và Mẹo Thi Aptis - Speaking (Part 1 - 4)
 * Cập nhật chuẩn xác 100% theo nội dung và tài liệu thực tế của người dùng.
 */

export interface SpeakingFormulaItem {
  category: string;
  pattern: string;
  example?: string;
}

export interface SpeakingGrammarItem {
  tense: string;
  usage: string;
}

export interface SpeakingPartData {
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
  // Công thức trả lời nhanh
  quickFormula?: {
    formulaEn: string;
    formulaVn: string;
    example?: {
      question: string;
      directAnswer: string;
      reason: string;
      detail: string;
    };
  };
  // Ngữ pháp thường dùng
  grammarPoints?: SpeakingGrammarItem[];
  // Part 1: Cấu trúc câu hữu ích
  formulasP1?: SpeakingFormulaItem[];
  // Part 2: Bài nói mẫu & Thay thế
  modelSampleP2?: {
    template: string;
  };
  // Part 3: Bài nói mẫu 4 bước & Từ nối
  modelSampleP3?: {
    step1Intro: string;
    step2Left: string;
    step3Right: string;
    step4Conclusion: string;
  };
  connectorsP3?: string[];
  // Part 4: Bài nói mẫu 5 giai đoạn
  modelSampleP4?: {
    stage: string;
    time: string;
    content: string;
  }[];
}

export const SPEAKING_KEY_MEO_DATA: Record<string, SpeakingPartData> = {
  p1: {
    partNumber: 1,
    title: "Aptis Speaking – Part 1",
    badge: "3 Câu hỏi cá nhân",
    subtitle: "Trả lời 3 câu hỏi về bản thân trong 30 giây/câu. Tự nhiên, rõ ràng, mở rộng thông tin thay vì chỉ Yes/No.",
    overview:
      "Gồm 3 câu hỏi về bản thân, sở thích, thói quen và trải nghiệm cá nhân. Chủ đề thường gặp: family, hometown, hobbies, food, music, sports, daily routine, holidays, studies, work.\nMục tiêu: trả lời tự nhiên, rõ ràng và có thêm thông tin thay vì chỉ trả lời Yes/No.",
    recommendedTime: "30s / câu trả lời",
    tips: [
      "Nghe kỹ câu hỏi và xác định từ khóa: What, Where, When, Who, Why, How.",
      "Trả lời trực tiếp ngay câu đầu tiên.",
      "Bổ sung 1–2 ý giải thích hoặc ví dụ.",
      "Sử dụng từ vựng quen thuộc, không cố dùng từ quá khó.",
      "Duy trì câu trả lời khoảng 3–4 câu, tùy độ dài và khả năng nói.",
      "Chú ý phát âm rõ ràng, đặc biệt âm cuối, không để thời gian chết.",
    ],
    quickFormula: {
      formulaEn: "Direct Answer + Reason + Example / Detail",
      formulaVn: "Trả lời trực tiếp + Lý do + Ví dụ / Thông tin bổ sung",
      example: {
        question: "What do you like doing in your free time?",
        directAnswer: "I enjoy reading books in my free time.",
        reason: "Because it helps me relax after a long working day.",
        detail: "I usually read before going to bed.",
      },
    },
    formulasP1: [
      { category: "Sở thích", pattern: "I enjoy/ like + V_ing" },
      { category: "Thói quen", pattern: "I usually + V" },
      { category: "Lý do", pattern: "Because + S + V" },
      { category: "Tần suất", pattern: "I often/ sometimes/ rarely + V" },
      { category: "Trải nghiệm", pattern: "I have been to/ I visited…" },
      { category: "Ý kiến", pattern: "I think/ believe + S + V" },
    ],
    grammarPoints: [
      {
        tense: "Present Simple (Hiện tại đơn)",
        usage: "Nói về sở thích, thói quen và thông tin cá nhân hàng ngày.",
      },
      {
        tense: "Past Simple (Quá khứ đơn)",
        usage: "Kể lại các hoạt động, trải nghiệm cá nhân đã xảy ra trong quá khứ.",
      },
      {
        tense: "Present Continuous (Hiện tại tiếp diễn)",
        usage: "Mô tả hoạt động đang diễn ra hoặc kế hoạch gần nếu câu hỏi yêu cầu.",
      },
    ],
    mistakesToAvoid: [
      "Chỉ trả lời một từ hoặc một câu quá ngắn (Yes/No rồi dừng).",
      "Không trả lời đúng trọng tâm câu hỏi (hỏi Where lại trả lời thói quen).",
      "Lặp lại từ vựng và cấu trúc quá nhiều lần.",
      "Dùng sai thì của động từ (lẫn lộn giữa quá khứ và hiện tại).",
      "Nói quá nhanh hoặc ngập ngừng, im lặng quá lâu.",
    ],
    quickRemember: {
      highlight: "Direct Answer + Reason + Detail",
      description: "Trả lời trực tiếp ngay câu 1 → Giải thích lý do (Because) → Thêm chi tiết/thói quen. Nói đều 3–4 câu trong 25–28 giây.",
    },
  },

  p2: {
    partNumber: 2,
    title: "Aptis Speaking – Part 2",
    badge: "Miêu tả 1 ảnh & 2 câu hỏi liên quan",
    subtitle: "Mô tả 1 bức ảnh (45s), kể trải nghiệm cá nhân (45s), và nêu quan điểm/nhận xét chung (45s).",
    overview:
      "Nhận một bức ảnh và trả lời 3 câu hỏi liên quan đến chủ đề của ảnh. Câu đầu tiên: mô tả bức ảnh. Câu thứ hai: nói về trải nghiệm cá nhân liên quan đến chủ đề. Câu thứ ba: đưa ra ý kiến hoặc nhận xét về chủ đề ở góc độ chung.",
    recommendedTime: "45s / câu trả lời",
    tips: [
      "Quan sát nhanh bức ảnh: người, địa điểm, hoạt động, đồ vật.",
      "Mô tả những gì nhìn thấy, không suy đoán quá nhiều về chi tiết không rõ.",
      "Sử dụng Present Continuous để mô tả hành động đang diễn ra.",
      "Trả lời câu hỏi về trải nghiệm bằng một câu chuyện ngắn, có thời gian và địa điểm.",
      "Với câu hỏi ý kiến, nêu quan điểm rõ ràng và giải thích bằng ít nhất một lý do.",
      "Nếu không biết từ vựng của một đồ vật, hãy diễn đạt bằng từ đơn giản hơn.",
      "Không dành toàn bộ thời gian chỉ để liệt kê những gì xuất hiện trong ảnh.",
    ],
    quickFormula: {
      formulaEn: "Where + Who + What + Details + Impression",
      formulaVn: "Địa điểm + Người + Hoạt động + Chi tiết + Nhận xét",
    },
    grammarPoints: [
      {
        tense: "Present Continuous",
        usage: "Mô tả hành động của người và sự vật đang diễn ra trong ảnh.",
      },
      {
        tense: "Present Simple",
        usage: "Nêu nhận xét, cảm xúc hoặc sự thật chung.",
      },
      {
        tense: "Past Simple",
        usage: "Kể lại trải nghiệm cá nhân đã từng xảy ra liên quan đến chủ đề.",
      },
      {
        tense: "Modal verbs (may, might, could)",
        usage: "Dùng khi cần suy đoán bối cảnh, thời tiết hoặc tâm trạng.",
      },
    ],
    modelSampleP2: {
      template:
        "Looking at the picture, I can see a group of people [người/vật chính, ví dụ: a family in a park]. There are [number] people in the picture. They are/ He is/ She is + [hành động, V_ing ví dụ: cooking, reading, talking] and they are wearing [trang phục, ví dụ: casual clothes]. The setting seems to be [không gian, indoors/outdoors]. It looks like a [địa điểm, ví dụ: shop, school,.. ] while in the background, there is [cảnh phía sau, ví dụ: a lot of green trees]. Overall, the atmosphere looks very [cảm xúc, ví dụ: happy / peaceful / warm]. They seem to be having a great time together.",
    },
    mistakesToAvoid: [
      "Chỉ nói tên đồ vật mà không mô tả hành động.",
      "Dùng Present Simple cho mọi hành động đang diễn ra trong ảnh (phải dùng V-ing).",
      "Bịa ra thông tin không thể nhìn thấy trong bức tranh.",
      "Mô tả ảnh quá lâu, không trả lời câu hỏi tiếp theo.",
      "Không đưa ra lý do khi được hỏi ý kiến.",
    ],
    quickRemember: {
      highlight: "Where → Who → What → Details → Impression",
      description: "Địa điểm + Người + Hành động (V-ing) + Chi tiết trang phục/bối cảnh + Cảm xúc chung. Căn đều 40–43 giây/câu.",
    },
  },

  p3: {
    partNumber: 3,
    title: "Aptis Speaking – Part 3",
    badge: "So sánh 2 ảnh & câu hỏi liên quan",
    subtitle: "So sánh điểm giống & khác nhau giữa 2 bức tranh đối lập (45s), nhận biết và suy đoán tình huống.",
    overview:
      "Được cung cấp hai bức ảnh có chủ đề liên quan, nội dung thường đối lập nhau. Yêu cầu mô tả, so sánh và trả lời các câu hỏi liên quan. Cần nhận biết điểm giống nhau, khác nhau và có thể suy đoán về tình huống.",
    recommendedTime: "45s / câu trả lời",
    tips: [
      "Nhìn nhanh chủ đề chung của hai bức ảnh.",
      "Tìm ít nhất một điểm giống và hai điểm khác nhau.",
      "Không mô tả ảnh thứ nhất quá dài rồi mới nói ảnh thứ hai.",
      "Sử dụng từ nối so sánh: while, whereas, both, however, unlike.",
      "Khi so sánh, hãy đề cập đến người, địa điểm, hoạt động, cảm xúc hoặc mục đích.",
      "Nếu được yêu cầu suy đoán, sử dụng might, may, could hoặc probably.",
      "Kết thúc bằng nhận xét hoặc lựa chọn cá nhân nếu câu hỏi yêu cầu.",
    ],
    quickFormula: {
      formulaEn: "Similarity + Picture A + Picture B + Difference",
      formulaVn: "Điểm giống nhau + Ảnh A + Ảnh B + Điểm khác biệt",
    },
    grammarPoints: [
      {
        tense: "Present Simple",
        usage: "So sánh các đặc điểm chung và tính chất của 2 bức ảnh.",
      },
      {
        tense: "Present Continuous",
        usage: "Mô tả hành động của các nhân vật trong từng ảnh.",
      },
      {
        tense: "Comparative adjectives",
        usage: "So sánh hơn: bigger, smaller, more interesting, cheaper...",
      },
      {
        tense: "Modal verbs (might, may, could, must)",
        usage: "Suy đoán khi có cơ sở phù hợp trong tranh.",
      },
      {
        tense: "Conditional sentences",
        usage: "Câu điều kiện nêu lựa chọn: 'If I had a choice, I would...'",
      },
    ],
    modelSampleP3: {
      step1Intro:
        "Now I can see two pictures. These pictures show different situations, and there are many differences between them. Let me describe and compare them. Both pictures show people [V-ing...] in different ways.",
      step2Left:
        "On the left, I can see [số người / đối tượng] who is/are [V-ing...] at [ địa điểm ], which looks very [tính từ mô tả không khí]. Tả thêm cảnh xung quanh (thời tiết,...).",
      step3Right:
        "In contrast, the right picture depicts [số người / đối tượng] [V-ing...] in a [tính từ mô tả không khí] environment. They look likes [tính từ miêu tả cảm xúc].",
      step4Conclusion:
        "Overall, both pictures reflect different lifestyles. If I had to choose, I would personally prefer [lựa chọn A hay B] because [nêu lý do ngắn gọn].",
    },
    connectorsP3: [
      "while (trong khi)",
      "whereas (ngược lại)",
      "both (cả hai)",
      "however (tuy nhiên)",
      "unlike (không giống như)",
      "in contrast (đối lập lại)",
      "on the other hand (mặt khác)",
    ],
    mistakesToAvoid: [
      "Mô tả riêng từng ảnh mà không so sánh liên kết.",
      "Lặp lại liên tục “In picture one” và “In picture two”.",
      "Không sử dụng từ nối so sánh (while, whereas, in contrast).",
      "Suy đoán quá chắc chắn khi không có bằng chứng.",
      "Quên trả lời câu hỏi về ý kiến hoặc trải nghiệm cá nhân.",
    ],
    quickRemember: {
      highlight: "Similarity + Picture A + Picture B + Difference",
      description: "Mở bài điểm chung → Tranh trái (10-12s) → Từ nối đối lập (In contrast/Whereas) → Tranh phải (10-12s) → Nhận xét/Ý kiến.",
    },
  },

  p4: {
    partNumber: 4,
    title: "Aptis Speaking – Part 4",
    badge: "Thuyết trình chủ đề & 3 câu hỏi",
    subtitle: "Nhận chủ đề khái quát & 3 câu hỏi. Có 1 phút chuẩn bị và 2 phút nói liên tục.",
    overview:
      "Nhận một chủ đề mang tính khái quát và 3 câu hỏi liên quan. Câu hỏi thường xoay quanh trải nghiệm cá nhân, cảm nhận và quan điểm về một vấn đề rộng hơn. Không nên chỉ mô tả bức ảnh hoặc nói lan man ngoài chủ đề.",
    recommendedTime: "1 phút chuẩn bị + 2 phút nói",
    tips: [
      "Đọc cả 3 câu hỏi trước khi chuẩn bị.",
      "Chia 1 phút chuẩn bị thành các ý chính, không viết nguyên câu.",
      "Đảm bảo câu trả lời đề cập đủ các câu hỏi.",
      "Mở đầu bằng câu giới thiệu chủ đề hoặc quan điểm.",
      "Phát triển ý bằng lý do, giải thích và ví dụ thực tế.",
      "Sử dụng linking words để chuyển ý mạch lạc.",
      "Đưa ra kết luận ngắn để kết thúc phần nói.",
      "Nếu hết ý, hãy mở rộng bằng lợi ích, bất lợi, nguyên nhân hoặc tác động.",
      "Không cố nói quá nhanh để lấp đầy 2 phút.",
    ],
    quickFormula: {
      formulaEn: "Introduction + Experience + Opinion + Reasons + Example + Conclusion",
      formulaVn: "Giới thiệu + Trải nghiệm + Quan điểm + Lý do + Ví dụ + Kết luận",
    },
    grammarPoints: [
      {
        tense: "Present Simple",
        usage: "Bày tỏ quan điểm, sự thật và thói quen cuộc sống.",
      },
      {
        tense: "Past Simple",
        usage: "Kể lại trải nghiệm, kỷ niệm cụ thể trong quá khứ.",
      },
      {
        tense: "Present Perfect",
        usage: "Nói về trải nghiệm hoặc sự thay đổi có liên hệ với hiện tại.",
      },
      {
        tense: "Future Simple",
        usage: "Đưa ra dự đoán và kế hoạch trong tương lai.",
      },
      {
        tense: "Conditional sentences",
        usage: "Giả định và đề xuất giải pháp (If we do this, it would...).",
      },
      {
        tense: "Modal verbs (should, could, might, must)",
        usage: "Khuyên nhủ, đề xuất hoặc nhận định tính cần thiết.",
      },
    ],
    modelSampleP4: [
      {
        stage: "① OPENING",
        time: "15s",
        content:
          "Well, this is quite an interesting topic. I think it is an important part of modern life, and there are several things we can consider about it. Personally, I have some thoughts about this topic, so I'd like to talk about it from my own perspective.",
      },
      {
        stage: "② IDEA 1 (Câu hỏi 1)",
        time: "25–30s",
        content: "First of all, I would say that... The main reason is that... This is because...",
      },
      {
        stage: "③ IDEA 2 (Câu hỏi 2)",
        time: "25–30s",
        content: "Another important point to consider is that... For example,...",
      },
      {
        stage: "④ IDEA 3 / OTHER SIDE (Câu hỏi 3)",
        time: "25–30s",
        content: "However, it is also worth mentioning that... This can be particularly important because...",
      },
      {
        stage: "⑤ RESULT & CONCLUSION",
        time: "15s",
        content:
          "As a result,... I know that my speaking skills are still improving, but I’m trying my best to express my ideas clearly. I hope I can continue to improve my English and become more confident in the future. Thank you for listening.",
      },
    ],
    mistakesToAvoid: [
      "Chỉ trả lời một hoặc hai câu hỏi trong ba câu (mất điểm câu còn lại).",
      "Mô tả bức ảnh thay vì thảo luận chủ đề.",
      "Nói quá ngắn, thiếu lý do và ví dụ minh họa.",
      "Lặp lại cùng một ý nhiều lần để câu giờ.",
      "Không sử dụng từ nối chuyển tiếp giữa các câu hỏi.",
      "Dành quá nhiều thời gian cho phần mở đầu (> 25s).",
      "Không quản lý tốt thời gian 2 phút (dừng sớm hoặc bị cắt ngang).",
    ],
    quickRemember: {
      highlight: "Intro (15s) → Idea 1 (30s) → Idea 2 (30s) → Idea 3 (30s) → Kết (15s)",
      description: "1 phút chuẩn bị ghi từ khóa → Trả lời đủ 3 câu hỏi với công thức Lý do + Ví dụ. Kết thúc bằng lời cảm ơn lịch sự.",
    },
  },
};
