"use client";

import { useState } from "react";
import {
  Clock,
  FileText,
  User,
  Image as ImageIcon,
  Users,
  MessageSquare,
  Mic,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  X,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Headphones,
  PenTool,
  Award,
  Layers,
  HelpCircle,
} from "lucide-react";

export type SkillType = "speaking" | "reading" | "listening" | "writing";

export interface SkillPartDetail {
  partNumber: number;
  partKey: string;
  name: string;
  subName: string;
  questionCount?: string;
  wordCountLimit?: string;
  overview: string;
  tasks: string[];
  sampleQuestions?: string[];
  exactTiming: {
    prepTime?: string;
    speakTime?: string;
    suggestedTime?: string;
    note: string;
  };
}

export interface SkillGuideData {
  skill: SkillType;
  skillName: string;
  badgeTitle: string;
  totalDuration: string;
  totalTasksOrRecordings: string;
  deliveryMethod: string;
  coreGoal: string;
  parts: SkillPartDetail[];
  studySteps: {
    step: number;
    title: string;
    bullets: string[];
    benefit: string;
  }[];
  tips: string[];
}

// =========================================================================
// 100% NGUYÊN VĂN DỮ LIỆU TỪ INFOGRAPHIC 4 KỸ NĂNG CỦA HỆ THỐNG
// =========================================================================

export const SKILL_GUIDES_DATA: Record<SkillType, SkillGuideData> = {
  // -------------------------------------------------------------
  // 1. SPEAKING (12 phút, 4 parts, ghi âm máy tính)
  // -------------------------------------------------------------
  speaking: {
    skill: "speaking",
    skillName: "Speaking",
    badgeTitle: "CẤU TRÚC ĐỀ THI APTIS ESOL SPEAKING",
    totalDuration: "12 phút",
    totalTasksOrRecordings: "4 phần thi",
    deliveryMethod: "Ghi âm trực tiếp trên máy tính",
    coreGoal: "Đánh giá khả năng phản xạ, phát âm, ngữ điệu và biểu đạt ý kiến",
    parts: [
      {
        partNumber: 1,
        partKey: "sp_p1",
        name: "Part 1",
        subName: "Personal Information",
        overview: "Giới thiệu bản thân và trả lời các câu hỏi đơn giản, quen thuộc.",
        tasks: [
          "Trả lời 3 câu hỏi về bản thân",
          "Chủ đề quen thuộc: học tập, công việc, gia đình, sở thích...",
          "Câu trả lời ngắn gọn (thường 1–3 câu).",
        ],
        sampleQuestions: [
          "What's your full name?",
          "Where do you live?",
          "Do you work or are you a student?",
          "What do you like doing in your free time?",
        ],
        exactTiming: {
          speakTime: "30 giây",
          note: "cho mỗi câu trả lời (3 câu)",
        },
      },
      {
        partNumber: 2,
        partKey: "sp_p2",
        name: "Part 2",
        subName: "Describe and Explain",
        overview: "Nói ngắn về một chủ đề quen thuộc thông qua 1 bức ảnh.",
        tasks: [
          "Mô tả 1 bức ảnh",
          "Trả lời thêm 2 câu hỏi liên quan",
          "Tổng 3 câu hỏi",
          "Yêu cầu: mô tả chi tiết, nêu ý kiến và đưa ra lý do giải thích.",
        ],
        sampleQuestions: [
          "Describe the photo.",
          "What do you think about this situation?",
          "Why do you think it is important?",
        ],
        exactTiming: {
          speakTime: "45 giây",
          note: "cho mỗi câu trả lời (3 câu)",
        },
      },
      {
        partNumber: 3,
        partKey: "sp_p3",
        name: "Part 3",
        subName: "Discussion & Comparison",
        overview: "Thảo luận, so sánh và đưa ra ý kiến cá nhân.",
        tasks: [
          "Trả lời 2–3 câu hỏi mở rộng",
          "Đưa ra ý kiến, giải thích lý do, so sánh hai mặt, nêu ví dụ minh họa",
          "Câu trả lời chi tiết hơn, thể hiện khả năng lập luận logic.",
        ],
        sampleQuestions: [
          "Do you think people should work from home or in an office?",
          "What are the advantages and disadvantages?",
          "Which do you prefer? Why?",
        ],
        exactTiming: {
          speakTime: "45 giây",
          note: "cho mỗi câu trả lời (3 câu)",
        },
      },
      {
        partNumber: 4,
        partKey: "sp_p4",
        name: "Part 4",
        subName: "Discuss a Topic and Give Solutions",
        overview: "Đóng vai và xử lý tình huống giao tiếp thực tế.",
        tasks: [
          "Đọc tình huống và suy nghĩ chiến lược",
          "Trả lời 3 câu hỏi liên quan cùng chủ đề",
          "Đưa ra giải pháp, gợi ý và phát triển ý mạch lạc.",
        ],
        sampleQuestions: [
          "You are planning a club event. Discuss with your friend about the venue, time and activities. What would you suggest?",
        ],
        exactTiming: {
          prepTime: "1 phút chuẩn bị (đọc tình huống)",
          speakTime: "2 phút trả lời",
          note: "(trả lời 3 câu cùng chủ đề)",
        },
      },
    ],
    studySteps: [
      {
        step: 1,
        title: "Hiểu rõ yêu cầu từng dạng câu hỏi",
        bullets: [
          "Nắm vững form đề thi và thời gian của từng phần",
          "Xác định chủ đề thường gặp trong ngân hàng đề",
          "Hiểu rõ tiêu chí chấm điểm ngữ âm và độ trôi chảy",
        ],
        benefit: "Giúp bạn trả lời đúng trọng tâm, không lan man.",
      },
      {
        step: 2,
        title: "Luyện nói theo chủ đề quen thuộc",
        bullets: [
          "Luyện chủ đề: bản thân, gia đình, công việc, xã hội, môi trường...",
          "Chuẩn bị ý tưởng, từ vựng và cụm mẫu câu theo chủ đề",
          "Luyện nói thường xuyên và bấm giờ theo thời gian thi thật",
        ],
        benefit: "Giúp bạn phản xạ nhanh và nói trôi chảy hơn.",
      },
      {
        step: 3,
        title: "Áp dụng cấu trúc trả lời rõ ràng",
        bullets: [
          "Mở đầu trực tiếp, ngắn gọn",
          "Nêu ý chính rõ ràng",
          "Giải thích lý do & đưa ví dụ minh họa",
          "Kết luận hoặc mở rộng quan điểm cá nhân",
        ],
        benefit: "Giúp bài nói có logic, dễ hiểu và thuyết phục.",
      },
      {
        step: 4,
        title: "Luyện tập thường xuyên và nhận feedback",
        bullets: [
          "Luyện nói đều đặn mỗi ngày 10–15 phút",
          "Thu âm bài nói để AI chấm & tự đánh giá",
          "Tham khảo kho bài mẫu đạt chuẩn CEFR B2",
          "Nhờ giáo viên nhận xét và sửa lỗi phát âm 1:1",
        ],
        benefit: "Cải thiện phát âm, ngữ điệu và sự tự nhiên khi nói.",
      },
    ],
    tips: [
      "Luyện đều đặn mỗi ngày để duy trì cơ miệng và phản xạ",
      "Mở rộng vốn từ và idioms theo chủ đề thường gặp",
      "Tự tin diễn đạt ý kiến bằng tiếng Anh tự nhiên của chính bạn!",
    ],
  },

  // -------------------------------------------------------------
  // 2. READING (35 phút, 4 parts, 24 câu hỏi)
  // -------------------------------------------------------------
  reading: {
    skill: "reading",
    skillName: "Reading",
    badgeTitle: "CẤU TRÚC ĐỀ THI APTIS ESOL READING",
    totalDuration: "35 phút",
    totalTasksOrRecordings: "4 parts • 24 câu",
    deliveryMethod: "Làm bài trực tiếp trên hệ thống máy tính",
    coreGoal: "Đánh giá kỹ năng Skimming, Scanning và đọc hiểu chi tiết",
    parts: [
      {
        partNumber: 1,
        partKey: "rd_p1",
        name: "Part 1",
        subName: "Multiple Choice",
        questionCount: "5 câu",
        overview: "Đọc ngắn và chọn đáp án phù hợp.",
        tasks: [
          "Đọc các đoạn văn ngắn (thông báo, email, tin nhắn, quảng cáo, thông tin thực tế...)",
          "Chọn 1 trong 3 đáp án (A, B, C) phù hợp nhất cho mỗi chỗ trống.",
        ],
        sampleQuestions: [
          "Đọc một thông báo nội bộ công ty và chọn từ thích hợp để hoàn thành câu.",
        ],
        exactTiming: {
          suggestedTime: "7 phút",
          note: "cho 5 câu hỏi",
        },
      },
      {
        partNumber: 2,
        partKey: "rd_p2",
        name: "Part 2",
        subName: "Text Organisation",
        questionCount: "5 câu",
        overview: "Sắp xếp lại thứ tự các câu văn.",
        tasks: [
          "Cho một đoạn văn gồm các câu bị xáo trộn thứ tự.",
          "Sắp xếp các câu văn theo đúng trình tự logic để tạo thành một đoạn văn hoàn chỉnh và mạch lạc.",
        ],
        sampleQuestions: [
          "Sắp xếp 5 sự kiện của một câu chuyện hoặc quy trình làm việc theo đúng trình tự thời gian.",
        ],
        exactTiming: {
          suggestedTime: "8 phút",
          note: "cho 5 câu sắp xếp",
        },
      },
      {
        partNumber: 3,
        partKey: "rd_p3",
        name: "Part 3",
        subName: "Information Matching",
        questionCount: "7 câu",
        overview: "Đọc và ghép thông tin với ý kiến của 4 người.",
        tasks: [
          "Đọc một đoạn văn gồm ý kiến/quan điểm của 4 người khác nhau về cùng một chủ đề.",
          "Đọc 7 câu hỏi/nhận định và xác định câu hỏi phù hợp với ý kiến của người nào (mỗi người có thể được chọn hơn một lần).",
        ],
        sampleQuestions: [
          "Bốn người thảo luận về thói quen du lịch. Nhận định: 'Ai thích đi du lịch một mình để tiết kiệm chi phí?'",
        ],
        exactTiming: {
          suggestedTime: "10 phút",
          note: "cho 7 câu nhận định",
        },
      },
      {
        partNumber: 4,
        partKey: "rd_p4",
        name: "Part 4",
        subName: "Heading Matching",
        questionCount: "7 câu",
        overview: "Đọc và chọn tiêu đề cho từng đoạn văn.",
        tasks: [
          "Đọc các đoạn văn dài hơn (thường gồm 8 đoạn văn ngắn).",
          "Chọn 1 trong 8 tiêu đề (A–H) phù hợp nhất cho mỗi đoạn văn (lưu ý có thể có tiêu đề thừa).",
        ],
        sampleQuestions: [
          "Bài đọc về lịch sử phát triển của cà phê. Ghép tiêu đề tóm tắt ý chính tương ứng cho từng đoạn.",
        ],
        exactTiming: {
          suggestedTime: "10 phút",
          note: "cho 7 đoạn văn",
        },
      },
    ],
    studySteps: [
      {
        step: 1,
        title: "Hiểu rõ cấu trúc và dạng câu hỏi",
        bullets: [
          "Nắm vững 4 dạng bài và thời gian của từng phần",
          "Đọc kỹ hướng dẫn đề để hiểu yêu cầu từng dạng",
          "Xác định từ khóa và tiêu chí lựa chọn đáp án",
          "Làm quen với độ dài và độ khó của văn bản thực tế",
        ],
        benefit: "Giúp bạn làm bài đúng trọng tâm, không mất thời gian đọc lan man.",
      },
      {
        step: 2,
        title: "Tăng vốn từ vựng theo chủ đề",
        bullets: [
          "Học từ vựng: Education, Work, Health, Environment, Travel, Technology, Social Media...",
          "Học từ vựng theo ngữ cảnh (thay vì học riêng lẻ)",
          "Ghi chú collocations và cụm từ cố định",
          "Ôn các từ đồng nghĩa, trái nghĩa, paraphrase (thường dùng để gài bẫy)",
        ],
        benefit: "Giúp bạn hiểu nhanh nội dung bài đọc và nhận ra đáp án đúng dễ dàng hơn.",
      },
      {
        step: 3,
        title: "Rèn kỹ năng đọc và xác định thông tin",
        bullets: [
          "Luyện skimming (đọc lướt) để nắm ý chính",
          "Luyện scanning (đọc quét) để tìm thông tin chi tiết",
          "Xác định từ khóa, từ đồng nghĩa – trái nghĩa",
          "Nhận biết paraphrase (cách diễn đạt khác)",
          "Tập phân tích cấu trúc đoạn văn và mối liên kết giữa các câu",
        ],
        benefit: "Giúp bạn đọc nhanh, hiểu đúng và chọn được đáp án chính xác.",
      },
      {
        step: 4,
        title: "Luyện đề thường xuyên và chữa lỗi",
        bullets: [
          "Làm đề theo thời gian thật (35 phút)",
          "Rèn thói quen đọc câu hỏi trước khi đọc bài",
          "Phân tích kỹ các câu sai để hiểu vì sao sai",
          "Tổng hợp lại các dạng bẫy thường gặp (từ đồng nghĩa, thông tin nhiễu, suy luận...)",
          "Ghi chú lỗi sai và ôn lại định kỳ",
        ],
        benefit: "Giúp bạn cải thiện tốc độ đọc và nâng cao độ chính xác.",
      },
    ],
    tips: [
      "Luôn đọc lướt câu hỏi trước khi đọc đoạn văn để định vị thông tin",
      "Chú ý các từ nối (however, although, therefore) báo hiệu đảo ngược ý",
      "Phân bổ thời gian chuẩn: Part 1 (7p) → Part 2 (8p) → Part 3 (10p) → Part 4 (10p)",
    ],
  },

  // -------------------------------------------------------------
  // 3. LISTENING (40 phút, 17 tasks, 20 recordings, nghe tối đa 2 lần)
  // -------------------------------------------------------------
  listening: {
    skill: "listening",
    skillName: "Listening",
    badgeTitle: "CẤU TRÚC ĐỀ THI APTIS ESOL LISTENING",
    totalDuration: "40 phút",
    totalTasksOrRecordings: "17 tasks • 20 recordings",
    deliveryMethod: "Nghe trên tai nghe máy tính, mỗi đoạn nghe tối đa 2 lần",
    coreGoal: "Đánh giá khả năng bắt thông tin chi tiết, ghép người nói và quan điểm",
    parts: [
      {
        partNumber: 1,
        partKey: "lis_p1",
        name: "Part 1",
        subName: "Information Recognition",
        questionCount: "13 câu",
        overview: "Chọn đáp án phù hợp từ các đoạn đối thoại ngắn.",
        tasks: [
          "Nghe 13 đoạn ngắn, mỗi đoạn có 1 câu hỏi độc lập.",
          "Thông tin thường là: thời gian, địa điểm, số điện thoại, giá cả, hoạt động...",
          "Chọn 1 trong 3 đáp án (A, B, C).",
        ],
        sampleQuestions: [
          "A customer is calling a store. What time does the shop close on Saturday?",
        ],
        exactTiming: {
          suggestedTime: "Nghe độc lập từng câu",
          note: "Mỗi câu nghe tối đa 2 lần",
        },
      },
      {
        partNumber: 2,
        partKey: "lis_p2",
        name: "Part 2",
        subName: "Information Matching",
        questionCount: "4 câu",
        overview: "Nghe và ghép thông tin từ 4 người nói.",
        tasks: [
          "Có 4 người (A, B, C, D) độc thoại ngắn về cùng một chủ đề.",
          "Ghép 4 câu hỏi với thông tin phù hợp của từng người.",
          "Mỗi thông tin chỉ được dùng 1 lần.",
        ],
        sampleQuestions: [
          "Bốn người chia sẻ quan điểm về thể thao. Ghép ai là người 'Thích tập gym sáng sớm'.",
        ],
        exactTiming: {
          suggestedTime: "Nghe liên tục 4 người",
          note: "Mỗi đoạn độc thoại nghe 2 lần",
        },
      },
      {
        partNumber: 3,
        partKey: "lis_p3",
        name: "Part 3",
        subName: "Opinion Matching",
        questionCount: "4 câu",
        overview: "Nghe một nam và một nữ thảo luận và xác định ai có ý kiến đó.",
        tasks: [
          "Nghe một nam và một nữ thảo luận về cùng một chủ đề.",
          "Có 4 ý kiến/nhận định được đưa ra.",
          "Chọn ý kiến đó là của Nam (Man), Nữ (Woman) hay Cả hai (Both).",
        ],
        sampleQuestions: [
          "Họ thảo luận về làm việc từ xa. Nhận định: 'Cần gặp mặt trực tiếp để gắn kết nhóm' → Man / Woman / Both?",
        ],
        exactTiming: {
          suggestedTime: "1 đoạn hội thoại dài",
          note: "Nghe tối đa 2 lần",
        },
      },
      {
        partNumber: 4,
        partKey: "lis_p4",
        name: "Part 4",
        subName: "Monologue Comprehension",
        questionCount: "4 câu (2 tasks)",
        overview: "Nghe 2 đoạn độc thoại dài thuộc 2 chủ đề khác nhau.",
        tasks: [
          "Nghe 2 đoạn độc thoại dài (mỗi task gồm 2 câu hỏi trắc nghiệm).",
          "Chọn 1 trong 3 đáp án (A, B, C) cho mỗi câu hỏi.",
          "Câu hỏi tập trung vào thái độ, ý định, quan điểm hoặc thông tin chi tiết.",
        ],
        sampleQuestions: [
          "Một chuyên gia thuyết trình về biến đổi khí hậu. 'Mục đích chính của diễn giả là gì?'",
        ],
        exactTiming: {
          suggestedTime: "2 bài nói chuyên sâu",
          note: "Mỗi bài nghe 2 lần",
        },
      },
    ],
    studySteps: [
      {
        step: 1,
        title: "Làm quen với cấu trúc đề thi",
        bullets: [
          "Nắm rõ 4 dạng bài và đặc điểm từng phần",
          "Hiểu yêu cầu câu hỏi để không bị nhầm dạng",
          "Luyện làm đề theo đúng số lượng câu và thời gian (40 phút)",
        ],
        benefit: "Giúp bạn làm bài đúng trọng tâm, tránh mất thời gian không cần thiết.",
      },
      {
        step: 2,
        title: "Tăng vốn từ vựng theo chủ đề",
        bullets: [
          "Học từ vựng: Education, Work, Health, Travel, Technology, Environment, Social Media...",
          "Học cách nhận diện từ đồng nghĩa, paraphrase",
          "Ghi chú collocations và cụm từ cố định",
        ],
        benefit: "Giúp bạn nhận diện thông tin nhanh hơn khi nghe.",
      },
      {
        step: 3,
        title: "Rèn kỹ năng nghe và xác định thông tin",
        bullets: [
          "Luyện nghe đa dạng giọng: Anh – Anh, Anh – Mỹ, Anh – Úc...",
          "Tập trung vào từ khóa (keywords) và ý chính",
          "Luyện kỹ năng nhận biết từ đồng nghĩa, diễn đạt khác (paraphrase)",
          "Tập xác định thái độ, quan điểm, ý định của người nói",
        ],
        benefit: "Giúp bạn nghe hiểu nhanh, chọn đáp án chính xác hơn.",
      },
      {
        step: 4,
        title: "Luyện đề thường xuyên và chữa lỗi",
        bullets: [
          "Làm đề theo thời gian thật (40 phút)",
          "Nghe lại bài và phân tích lỗi sai chi tiết",
          "Ghi chú các từ/cụm từ khó nghe và phát âm nuốt âm",
          "Rèn kỹ năng xử lý các bẫy đáp án",
          "Tổng hợp lỗi sai thường gặp (về từ vựng, phát âm, suy luận...)",
        ],
        benefit: "Giúp bạn cải thiện tốc độ nghe và nâng cao độ chính xác.",
      },
    ],
    tips: [
      "Tận dụng thời gian chuẩn bị trước mỗi đoạn để gạch chân từ khóa câu hỏi",
      "Cảnh giác với các từ 'bẫy' phủ định hoặc đổi ý (actually, but, however)",
      "Lần nghe 1: Nắm bắt ý tổng thể; Lần nghe 2: Chốt thông tin chi tiết",
    ],
  },

  // -------------------------------------------------------------
  // 4. WRITING (50 phút, 4 parts, làm trực tiếp trên máy)
  // -------------------------------------------------------------
  writing: {
    skill: "writing",
    skillName: "Writing",
    badgeTitle: "CẤU TRÚC ĐỀ THI APTIS ESOL WRITING",
    totalDuration: "50 phút",
    totalTasksOrRecordings: "4 parts",
    deliveryMethod: "Đánh máy trực tiếp trên máy tính",
    coreGoal: "Đánh giá ngữ pháp, từ vựng, độ mạch lạc và phong cách viết thư",
    parts: [
      {
        partNumber: 1,
        partKey: "wr_p1",
        name: "Part 1",
        subName: "Personal Information",
        questionCount: "5 câu",
        wordCountLimit: "Từ / cụm từ ngắn",
        overview: "Trả lời câu hỏi ngắn về bản thân.",
        tasks: [
          "Trả lời 5 câu hỏi ngắn về bản thân (sở thích, gia đình, công việc, hoạt động hàng ngày...).",
          "Trả lời bằng từ hoặc cụm từ ngắn.",
          "Không bắt buộc phải viết thành câu hoàn chỉnh.",
        ],
        sampleQuestions: [
          "What is your favorite sport? → Football / Swimming.",
        ],
        exactTiming: {
          suggestedTime: "≤ 3 phút",
          note: "cho 5 câu hỏi",
        },
      },
      {
        partNumber: 2,
        partKey: "wr_p2",
        name: "Part 2",
        subName: "Short Text Writing",
        questionCount: "1 câu",
        wordCountLimit: "20 – 30 từ",
        overview: "Viết đoạn văn ngắn điền form câu lạc bộ.",
        tasks: [
          "Trả lời yêu cầu cung cấp thông tin của một CLB/nhóm/hoạt động.",
          "Bắt buộc viết bằng các câu hoàn chỉnh, đúng ngữ pháp.",
          "Sử dụng ngôn ngữ đơn giản, rõ ràng, đủ ý.",
        ],
        sampleQuestions: [
          "Tại sao bạn muốn tham gia CLB Sách và bạn thường đọc sách vào lúc nào?",
        ],
        exactTiming: {
          suggestedTime: "≤ 7 phút",
          note: "đảm bảo đủ 20–30 từ",
        },
      },
      {
        partNumber: 3,
        partKey: "wr_p3",
        name: "Part 3",
        subName: "Three Written Responses",
        questionCount: "3 câu",
        wordCountLimit: "30 – 40 từ / câu",
        overview: "Trả lời 3 ý kiến trong diễn đàn câu lạc bộ.",
        tasks: [
          "Đọc 3 câu hỏi/ý kiến của 3 thành viên trong CLB và trả lời mỗi ý kiến.",
          "Viết 3 câu trả lời riêng biệt, mỗi câu khoảng 30–40 từ.",
          "Nội dung phù hợp, tự nhiên, có lý do hoặc ví dụ ngắn minh họa.",
        ],
        sampleQuestions: [
          "Thành viên A: 'Tôi nghĩ chúng ta nên tổ chức gặp mặt vào cuối tuần. Bạn thấy sao?'",
        ],
        exactTiming: {
          suggestedTime: "≤ 10 phút",
          note: "khoảng 3 phút / câu",
        },
      },
      {
        partNumber: 4,
        partKey: "wr_p4",
        name: "Part 4",
        subName: "Formal & Informal Writing",
        questionCount: "2 email",
        wordCountLimit: "40–50 từ (bạn bè) • 120–150 từ (quản lý)",
        overview: "Viết 2 email trong cùng một tình huống với hai văn phong đối lập.",
        tasks: [
          "Email 1 (Thân mật): Viết cho bạn thân (khoảng 40–50 từ), dùng từ ngữ tự nhiên, thân thiết.",
          "Email 2 (Trang trọng): Viết cho người quản lý/có thẩm quyền (khoảng 120–150 từ), dùng cấu trúc lịch sự, trang trọng.",
          "Sử dụng đúng bố cục email (Dear..., lý do viết, nội dung, đề xuất, lời chào kết thúc).",
        ],
        sampleQuestions: [
          "CLB thông báo tăng phí sinh hoạt. Viết email cho bạn chia sẻ cảm xúc và viết email cho Chủ nhiệm CLB đề xuất giải pháp.",
        ],
        exactTiming: {
          suggestedTime: "≈ 30 phút",
          note: "10p cho thư bạn bè, 20p cho thư trang trọng",
        },
      },
    ],
    studySteps: [
      {
        step: 1,
        title: "Nắm vững cấu trúc từng dạng bài",
        bullets: [
          "Hiểu rõ yêu cầu của 4 phần trong bài thi",
          "Nắm chắc số lượng câu, giới hạn từ và dạng bài",
          "Luyện viết theo bố cục chuẩn (đặc biệt là format email)",
          "Phân bổ thời gian hợp lý trong 50 phút",
        ],
        benefit: "Giúp bạn làm đúng yêu cầu, tránh viết thừa hoặc thiếu ý.",
      },
      {
        step: 2,
        title: "Mở rộng vốn từ vựng theo chủ đề",
        bullets: [
          "Học từ vựng theo các chủ đề thường gặp: Education, Work, Leisure, Travel, Environment...",
          "Học collocations và cụm từ cố định",
          "Sử dụng từ vựng phù hợp với ngữ cảnh (thân mật / trang trọng)",
        ],
        benefit: "Giúp bài viết tự nhiên, đa dạng và đạt điểm cao hơn về Vocabulary.",
      },
      {
        step: 3,
        title: "Rèn kỹ năng triển khai ý và liên kết câu",
        bullets: [
          "Luyện cách sắp xếp ý logic: opening – main points – closing (đặc biệt với email)",
          "Sử dụng linking words (firstly, however, in addition, as a result...)",
          "Viết câu rõ ràng, mạch lạc, đúng ngữ pháp",
          "Diễn đạt ý ngắn gọn, đúng trọng tâm",
        ],
        benefit: "Giúp bài viết mạch lạc, coherence tốt và đạt điểm cao hơn.",
      },
      {
        step: 4,
        title: "Luyện đề thường xuyên và chữa lỗi",
        bullets: [
          "Làm đề theo thời gian thật (50 phút)",
          "So sánh với đáp án mẫu để học cách triển khai ý",
          "Nhờ giáo viên hoặc AI chữa lỗi chi tiết về ngữ pháp, từ vựng, bố cục",
          "Rèn thói quen viết gọn, đúng yêu cầu và phù hợp văn phong",
        ],
        benefit: "Giúp bạn cải thiện Grammar, Vocabulary, Coherence và Accuracy.",
      },
    ],
    tips: [
      "Luôn đếm số từ để không bị phạt điểm (Part 2: 20-30 từ; Part 3: 30-40 từ; Part 4: 40-50 & 120-150 từ)",
      "Phân biệt rõ ngôn ngữ Informal (viết tắt, từ gần gũi) và Formal (không viết tắt, câu phức lịch sự)",
      "Dành 3–5 phút cuối giờ để rà soát lỗi chính tả và thì động từ",
    ],
  },
};

// =========================================================================
// COMPONENT DÙNG CHUNG (UNIVERSAL SKILL GUIDE MODAL)
// =========================================================================

export interface UniversalSkillGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Kỹ năng khởi tạo mặc định (speaking | reading | listening | writing) */
  initialSkill?: SkillType;
  /** Nếu true, cho phép chuyển đổi tab giữa cả 4 kỹ năng (mặc định: true) */
  allowSkillSwitching?: boolean;
}

export function UniversalSkillGuideModal({
  isOpen,
  onClose,
  initialSkill = "speaking",
  allowSkillSwitching = true,
}: UniversalSkillGuideModalProps) {
  const [currentSkill, setCurrentSkill] = useState<SkillType>(initialSkill);
  const [activePartIndex, setActivePartIndex] = useState(0);

  if (!isOpen) return null;

  const guide = SKILL_GUIDES_DATA[currentSkill];
  const parts = guide.parts;
  const safePartIndex = activePartIndex < parts.length ? activePartIndex : 0;
  const currentPart = parts[safePartIndex];

  const handleSwitchSkill = (s: SkillType) => {
    setCurrentSkill(s);
    setActivePartIndex(0);
  };

  const getSkillIcon = (s: SkillType) => {
    switch (s) {
      case "listening":
        return <Headphones className="w-4 h-4" />;
      case "reading":
        return <BookOpen className="w-4 h-4" />;
      case "speaking":
        return <Mic className="w-4 h-4" />;
      case "writing":
        return <PenTool className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Top Header Modal */}
        <div className="px-5 sm:px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
              {getSkillIcon(currentSkill)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-black uppercase tracking-wider">
                  CẨM NANG CHUẨN ĐỀ THI
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  Aptis ESOL CEFR B1–B2
                </span>
              </div>
              <h2 className="font-heading font-black text-foreground text-base sm:text-lg leading-tight mt-0.5 truncate">
                {guide.badgeTitle}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Đóng cẩm nang"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Skill Tab Switcher (Nếu cho phép chuyển đổi 4 kỹ năng) */}
        {allowSkillSwitching && (
          <div className="px-5 sm:px-6 py-2.5 bg-card border-b border-border/70 flex items-center gap-2 overflow-x-auto shrink-0">
            <span className="text-xs font-bold text-muted-foreground shrink-0 mr-1 hidden sm:inline">
              Chọn kỹ năng:
            </span>
            {(["listening", "reading", "speaking", "writing"] as SkillType[]).map((s) => {
              const isActive = currentSkill === s;
              const skillLabel =
                s === "listening"
                  ? "Listening (Nghe)"
                  : s === "reading"
                  ? "Reading (Đọc)"
                  : s === "speaking"
                  ? "Speaking (Nói)"
                  : "Writing (Viết)";
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSwitchSkill(s)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-glow-soft"
                      : "bg-muted/70 hover:bg-muted text-foreground"
                  }`}
                >
                  {getSkillIcon(s)}
                  <span>{skillLabel}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ============================================================
              PHẦN 1: TỔNG QUAN THỜI GIAN & TAB SELECTOR CÁC PARTS
              ============================================================ */}
          <section className="space-y-4">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  1. THÔNG SỐ BÀI THI {guide.skillName.toUpperCase()}
                </span>
                <h3 className="font-heading font-black text-foreground text-base sm:text-lg mt-0.5">
                  Tổng thời gian: <span className="text-primary">{guide.totalDuration}</span>
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-foreground font-semibold shadow-xs">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{guide.totalTasksOrRecordings}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-foreground font-semibold shadow-xs">
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{guide.deliveryMethod}</span>
                </span>
              </div>
            </div>

            {/* Tab Selector các Parts của Kỹ năng */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {parts.map((p, idx) => {
                const isActive = safePartIndex === idx;
                const timeText =
                  p.exactTiming.speakTime ||
                  p.exactTiming.suggestedTime ||
                  p.exactTiming.note;
                return (
                  <button
                    key={p.partKey}
                    type="button"
                    onClick={() => setActivePartIndex(idx)}
                    className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-glow-soft ring-2 ring-primary/30"
                        : "bg-card hover:bg-muted/60 text-foreground border-border hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-black uppercase ${isActive ? "text-primary-foreground" : "text-primary"}`}>
                        {p.name}
                      </span>
                      {p.questionCount && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                          {p.questionCount}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-heading font-bold truncate">
                      {p.subName}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Chi tiết Part đang chọn (Cockpit Card tương tác) */}
            <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-black text-xs">
                      {currentPart.name}
                    </span>
                    <h4 className="font-heading font-black text-foreground text-base sm:text-lg">
                      {currentPart.subName}
                    </h4>
                    {currentPart.wordCountLimit && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        {currentPart.wordCountLimit}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentPart.overview}
                  </p>
                </div>

                <div className="shrink-0 p-3 rounded-xl bg-muted/40 border border-border/80 text-right">
                  {currentPart.exactTiming.prepTime && (
                    <div className="text-[11px] font-bold text-primary">
                      {currentPart.exactTiming.prepTime}
                    </div>
                  )}
                  <div className="text-xs font-black text-foreground">
                    Thời gian:{" "}
                    <span className="text-primary">
                      {currentPart.exactTiming.speakTime ||
                        currentPart.exactTiming.suggestedTime ||
                        "Theo bài"}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {currentPart.exactTiming.note}
                  </div>
                </div>
              </div>

              {/* Nhiệm vụ & Ví dụ / Hướng dẫn */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Cột 1: Mô tả nhiệm vụ chi tiết */}
                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 space-y-2">
                  <span className="font-bold text-foreground uppercase tracking-wider text-[11px] block">
                    Mô tả nhiệm vụ thí sinh:
                  </span>
                  <ul className="space-y-1.5">
                    {currentPart.tasks.map((task, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-foreground/90 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cột 2: Ví dụ minh họa / Mẫu bài thi */}
                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 space-y-2">
                  <span className="font-bold text-foreground uppercase tracking-wider text-[11px] block">
                    {currentPart.sampleQuestions ? "Ví dụ dạng câu hỏi:" : "Tiêu chí chấm điểm:"}
                  </span>
                  {currentPart.sampleQuestions ? (
                    <ul className="space-y-1.5">
                      {currentPart.sampleQuestions.map((q, idx) => (
                        <li key={idx} className="flex items-start gap-2 italic text-muted-foreground font-medium">
                          <span className="text-primary not-italic shrink-0 font-bold">•</span>
                          <span>"{q}"</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">
                      Nắm chắc từ khóa và bố cục chuẩn để tối ưu hóa điểm số cho phần thi này.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================
              PHẦN 2: 4 BƯỚC HỌC ĐẠT HIỆU QUẢ CỦA KỸ NĂNG
              ============================================================ */}
          <section className="space-y-3.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="font-heading font-black text-foreground text-sm sm:text-base uppercase tracking-tight">
                2. HƯỚNG DẪN CÁCH HỌC {guide.skillName.toUpperCase()} ĐẠT HIỆU QUẢ
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {guide.studySteps.map((step) => (
                <div
                  key={step.step}
                  className="rounded-2xl border border-border bg-card p-4 flex flex-col justify-between hover:border-primary/40 hover:shadow-sm transition-all group"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="w-6 h-6 rounded-lg bg-primary text-primary-foreground font-black text-xs flex items-center justify-center shrink-0">
                        {step.step}
                      </span>
                      <h4 className="font-heading font-bold text-xs text-foreground leading-snug">
                        {step.title}
                      </h4>
                    </div>

                    <ul className="space-y-1.5 text-xs text-foreground/80 my-3">
                      {step.bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-primary shrink-0 mt-0.5">•</span>
                          <span className="leading-snug">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2 rounded-xl bg-muted/60 text-[11px] font-semibold text-muted-foreground text-center">
                    {step.benefit}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ============================================================
              PHẦN 3: CHIẾN THUẬT & MẸO B2
              ============================================================ */}
          <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-card to-muted/40 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-glow-soft">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                  CHIẾN THUẬT PHÒNG THI
                </span>
                <h4 className="font-heading font-black text-foreground text-sm sm:text-base">
                  MẸO ĐẠT MỤC TIÊU B2 {guide.skillName.toUpperCase()}:
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-bold text-foreground">
              {guide.tips.map((tip, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs shrink-0">
          <span className="text-muted-foreground text-center sm:text-left">
            Cẩm nang được số hóa 100% bám sát format đề thi Aptis ESOL chính thức.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto h-9 px-5 rounded-xl btn-brand-gradient text-white font-bold cursor-pointer hover:shadow-md transition-all inline-flex items-center justify-center gap-1.5"
          >
            <span>Đã nắm rõ, vào luyện tập ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
