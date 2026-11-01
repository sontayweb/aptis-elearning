// Kiểu dữ liệu & hàm tiện ích thuần cho phòng thi Speaking (tách từ speaking/[id]/page.tsx)

export interface SpeakingQuestion {
  id: string;
  partNumber: 1 | 2 | 3 | 4;
  part: string;
  title: string;
  prompt: string;
  prepTime: number; // seconds
  speakTime: number; // seconds
  imageUrl?: string;
  secondImageUrl?: string;
  sampleAnswer: string;
  guidanceNote?: string;
  subQuestions?: string[];
  topic?: string;
  vocabulary?: Array<{ en: string; vi: string }>;
  vocabularyHints?: {
    keywords: string[];
    startingPhrases: string[];
    linkingPhrases: string[];
    image1Prompt?: string;
    image2Prompt?: string;
  };
}

// Helper phân tích danh sách từ vựng gợi ý từ passage_text hoặc suggestion
export function parseSpeakingVocabulary(rawText?: string): Array<{ en: string; vi: string }> {
  if (!rawText) return [];
  const trimmed = rawText.trim();
  // 1. JSON parse
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item: any) => ({
            en: String(item.en || item.word || item.english || "").trim(),
            vi: String(item.vi || item.meaning || item.vietnamese || "").trim(),
          }))
          .filter((v: any) => v.en);
      }
      if (parsed && Array.isArray(parsed.vocabulary)) {
        return parsed.vocabulary
          .map((item: any) => ({
            en: String(item.en || item.word || item.english || "").trim(),
            vi: String(item.vi || item.meaning || item.vietnamese || "").trim(),
          }))
          .filter((v: any) => v.en);
      }
    } catch {}
  }
  // 2. Line by line text (vd: "word - meaning" hoặc "word: meaning" hoặc "| word | meaning |")
  const lines = trimmed.split("\n");
  const result: Array<{ en: string; vi: string }> = [];
  for (const line of lines) {
    const clean = line.replace(/<[^>]*>/g, "").trim();
    if (!clean || clean.startsWith("---") || /^(english|tiếng anh|từ vựng)/i.test(clean)) continue;
    const pipeMatch = clean.match(/^\|?\s*([^|:]+?)\s*\|\s*([^|:]+?)\s*\|?$/);
    if (pipeMatch) {
      result.push({ en: pipeMatch[1].trim(), vi: pipeMatch[2].trim() });
      continue;
    }
    const colonMatch = clean.match(/^([^:\-–]+)\s*[:\-–]\s*(.+)$/);
    if (colonMatch) {
      result.push({ en: colonMatch[1].trim(), vi: colonMatch[2].trim() });
    }
  }
  return result;
}

// Bíp báo hiệu chuẩn British Council
export function playStartBeep() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // Không làm gián đoạn nếu Web Audio bị chặn
  }
}

// Kiểm tra chuỗi có chứa ký tự tiếng Việt có dấu
export function isVietnameseText(text?: string): boolean {
  if (!text) return false;
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
}

// Chuẩn hóa bài nói mẫu B1 (Bản dễ học) và B2 (Bản nâng cao) chuẩn Aptis ESOL
export function resolveSpeakingSampleAnswers(
  prompt: string,
  rawSampleAnswer?: string,
  partNumber?: number,
  guidanceNote?: string
): { b1: string; b2: string; guidance?: string } {
  const pLower = (prompt || "").toLowerCase();
  const rawClean = (rawSampleAnswer || "").trim();

  // Xác định dàn ý gợi ý tiếng Việt nếu có
  let resolvedGuidance = guidanceNote?.trim();
  if (!resolvedGuidance && isVietnameseText(rawClean)) {
    resolvedGuidance = rawClean;
  }

  // Nếu trong database đã có bài nói mẫu tiếng Anh hoàn chỉnh (> 25 từ và không có dấu tiếng Việt)
  const isRawEnglish = rawClean.length > 25 && !isVietnameseText(rawClean);
  if (isRawEnglish) {
    const sentences = rawClean.split(/(?<=[.!?])\s+/);
    const b1 = sentences.length > 2 ? sentences.slice(0, 3).join(" ") : rawClean;
    return {
      b1,
      b2: rawClean,
      guidance: resolvedGuidance,
    };
  }

  // 1. Trải nghiệm tương tự (Part 2 Question 2: "Tell me about a similar experience you have had in your life")
  if (
    pLower.includes("similar experience") ||
    pLower.includes("similar") ||
    pLower.includes("experience you have had") ||
    (pLower.includes("experience") && pLower.includes("life"))
  ) {
    return {
      b1: "Looking at this picture reminds me of a time when I had a very memorable experience related to this activity. I remember that I was with my friends, and we had a great time sharing ideas, supporting each other, and enjoying the moment. That experience brought us closer and left a lasting positive impression on me.",
      b2: "This visual context brings to mind a particularly memorable occasion in my life when I participated in a similar activity. At that time, my peers and I collaborated closely to overcome challenges and achieve our shared objective. Although the process was demanding, the camaraderie and sense of accomplishment made it truly worthwhile, teaching me invaluable lessons about teamwork and perseverance.",
      guidance: resolvedGuidance || "Khung kể trải nghiệm bản thân: 1. Nêu bối cảnh/sự kiện tương tự -> 2. Diễn biến và người cùng tham gia -> 3. Cảm xúc & bài học rút ra.",
    };
  }

  // 2. Miêu tả tranh Part 2 (Question 1: "Describe what you see in the picture")
  if (
    pLower.includes("describe what you see") ||
    pLower.includes("describe the picture") ||
    pLower.includes("describe this picture")
  ) {
    return {
      b1: "In this picture, I can see the main subjects engaged in their activity. In the foreground, there are clear details showing their actions and expressions. The background reveals the surrounding environment and setting. Overall, the atmosphere seems very lively, engaging, and pleasant.",
      b2: "This photograph captures a vibrant scene depicting the central subjects immersed in their setting. In the foreground, prominent details highlight their dynamic interactions and focused expressions, while the background provides rich contextual elements that reflect the overall ambiance. The balanced composition conveys a sense of energy and purpose.",
      guidance: resolvedGuidance || "Khung miêu tả tranh: 1. Tổng quan (Ai/Cái gì, ở đâu) -> 2. Cận cảnh tiền cảnh (Hành động, biểu cảm) -> 3. Hậu cảnh & Không gian chung.",
    };
  }

  // 3. Tầm quan trọng / Lợi ích hoạt động (Part 2 Question 3: "Why do you think this activity is important to many people?")
  if (
    pLower.includes("important to many people") ||
    pLower.includes("why is this activity important") ||
    pLower.includes("why do you think this activity") ||
    (pLower.includes("important") && pLower.includes("activity"))
  ) {
    return {
      b1: "In my opinion, this activity is very important because it offers meaningful benefits to people. Firstly, it helps individuals develop practical skills and decompress after stressful working hours. In addition, participating in such activities strengthens social bonds and encourages a healthy, positive lifestyle.",
      b2: "From an analytical perspective, this activity plays an indispensable role in contemporary life for several compelling reasons. Firstly, it provides individuals with a vital outlet to recharge mental energy and foster essential life competencies. Furthermore, engaging in such pursuits cultivates interpersonal connections and promotes overall well-being in an increasingly demanding society.",
      guidance: resolvedGuidance || "Khung nêu quan điểm: 1. Khẳng định tầm quan trọng -> 2. Luận điểm thứ nhất (kỹ năng/thư giãn) -> 3. Luận điểm thứ hai (xã hội/sức khỏe).",
    };
  }

  // 4. So sánh đối chiếu 2 tranh (Part 3 Question 1: "Tell me what you see in the two pictures and contrast them")
  if (
    pLower.includes("contrast") ||
    pLower.includes("two pictures") ||
    pLower.includes("compare the two") ||
    (pLower.includes("compare") && pLower.includes("picture"))
  ) {
    return {
      b1: "Both pictures illustrate different aspects of the same theme. In the first picture, I can see the first situation with its distinct setting and active atmosphere. In contrast, the second picture shows an alternative approach with different surroundings. The primary difference lies in the environment and the way people engage with the situation.",
      b2: "Both photographs portray contrasting dimensions of this theme. The first image depicts a dynamic setting where the subjects are actively engaged in their environment, highlighting vitality and direct interaction. Conversely, the second image showcases an alternative context with distinct conditions. The stark contrast between these two scenarios illustrates varying preferences and lifestyle approaches.",
      guidance: resolvedGuidance || "Khung so sánh 2 tranh: Both pictures illustrate... In the first picture... In contrast, the second picture... The main difference is...",
    };
  }

  // 5. Sở thích / Lựa chọn nào hơn (Part 3 Question 2: "Which of the two options would you prefer and why?")
  if (
    pLower.includes("prefer") ||
    pLower.includes("which of the two") ||
    pLower.includes("which option")
  ) {
    return {
      b1: "If I had to choose between the two options shown, I would definitely prefer the first one. Primarily, it offers great convenience and allows me to recharge my energy effectively. Besides, it fits my personal routine and helps me maintain a balanced lifestyle.",
      b2: "Given the choice between these two alternatives, I would undeniably gravitate towards the first option. Primarily, it provides substantial psychological relaxation and aligns closely with my personal priorities. Furthermore, engaging in this option fosters greater personal fulfillment and practical convenience compared to the alternative.",
      guidance: resolvedGuidance || "Khung nêu lựa chọn: Khẳng định lựa chọn (I would definitely prefer...) -> Lý do 1 (Primarily...) -> Lý do 2 (Furthermore...).",
    };
  }

  // 6. Xu hướng tương lai (Part 3 Question 3: "how might this situation change in the future?")
  if (
    pLower.includes("future") ||
    pLower.includes("change in the future")
  ) {
    return {
      b1: "In my opinion, this situation will continue to evolve significantly in the future. As technology advances and societal priorities shift, people will increasingly adopt modern methods while seeking greater efficiency and balance in their daily routines.",
      b2: "Looking ahead, I anticipate that advancing technologies and shifting demographic trends will substantially transform this domain. While digital solutions will introduce unprecedented convenience, individuals will likely strive to maintain core human connections and sustainable practices to balance rapid modernisation.",
      guidance: resolvedGuidance || "Khung dự đoán tương lai: Nhận định xu hướng -> Tác động của công nghệ/xã hội -> Dự đoán cân bằng trong tương lai.",
    };
  }

  // 7. Giới thiệu bản thân (Part 1: "introduce yourself", "where you come from")
  if (
    pLower.includes("introduce") ||
    pLower.includes("yourself") ||
    pLower.includes("where you come from") ||
    pLower.includes("where are you from")
  ) {
    return {
      b1: "My name is Nguyen Van A, and I am from Hanoi, Vietnam. I am currently a student preparing for my future career. In my free time, I enjoy listening to music, reading books, and spending time with my family and friends.",
      b2: "My name is Nguyen Van A, and I was born and raised in Hanoi, the vibrant capital city of Vietnam. Currently, I am pursuing my academic and professional goals in finance. Aside from my work, I have a deep passion for exploring foreign languages, photography, and participating in community service.",
      guidance: resolvedGuidance || "Trả lời trực tiếp 2-3 câu rõ ràng, tự nhiên.",
    };
  }

  // 8. Thời gian rảnh / Sở thích (Part 1)
  if (pLower.includes("free time") || pLower.includes("hobby") || pLower.includes("hobbies") || pLower.includes("spare time")) {
    return {
      b1: "In my free time, I really enjoy playing sports, especially badminton and football with my friends. It helps me stay healthy, relieve stress after long working days, and maintain strong relationships with the people around me.",
      b2: "Whenever I have leisure time, I dedicate it to reading non-fiction literature and playing badminton. Engaging in physical sports allows me to stay agile and decompress effectively, while reading broadens my perspective and provides valuable intellectual stimulation.",
      guidance: resolvedGuidance || "Nêu sở thích kèm lý do giúp thư giãn hoặc học hỏi.",
    };
  }

  // 9. Sách / Phim yêu thích (Part 1)
  if (pLower.includes("movie") || pLower.includes("book") || pLower.includes("film")) {
    return {
      b1: "My favorite movie is 'The Pursuit of Happyness'. It tells an inspiring story about a father who overcomes great difficulties to achieve success and take care of his son. It taught me the importance of perseverance and never giving up on my dreams.",
      b2: "One of the most impactful books I have ever read is 'Atomic Habits' by James Clear. The book brilliantly illustrates how minor, incremental behavioral adjustments can compound into remarkable personal transformation over time. It has fundamentally reshaped how I structure my daily discipline and approach long-term goals.",
      guidance: resolvedGuidance || "Nêu tên tác phẩm, nội dung chính và bài học rút ra.",
    };
  }

  // 10. Gia đình (Part 1)
  if (pLower.includes("family")) {
    return {
      b1: "There are four people in my family: my father, my mother, my younger sister and me. My father is an engineer and my mother is an accountant. We live together in Hanoi. We are very close and we always eat dinner together every evening and share about our day.",
      b2: "My immediate family consists of four members: my parents, my sibling, and myself. Although each of us has a demanding schedule, we consistently prioritize having evening meals together and sharing our experiences. This close-knit bond provides me with an immense sense of emotional stability and encouragement.",
      guidance: resolvedGuidance,
    };
  }

  // 11. Thói quen hàng ngày (Part 1)
  if (pLower.includes("routine") || pLower.includes("daily")) {
    return {
      b1: "On weekdays, I usually wake up at 6:30 AM. After having breakfast, I go to school or work. In the afternoon, I come home, relax and do some light exercise. In the evening, I spend time with my family, study English, and go to bed at around 11 PM.",
      b2: "My typical daily schedule begins promptly at 6:30 AM with a nutritious breakfast and a brief review of my daily priorities. The bulk of my daytime is dedicated to work commitments. Evenings are reserved for physical workouts, home-cooked dinners, and language practice, which helps maintain a healthy work-life balance.",
      guidance: resolvedGuidance,
    };
  }

  // 12. Part 4 (120s): Đề thuyết trình 3 câu hỏi
  if (partNumber === 4 || pLower.includes("achieve") || pLower.includes("goal") || pLower.includes("journey") || pLower.includes("event")) {
    return {
      b1: "I would like to address the questions regarding this topic. Regarding the first point, I had a memorable personal experience where I faced a meaningful challenge with the support of my peers. Secondly, the emotional impact was profound, giving me great confidence and joy. Lastly, I firmly believe experiences like this are essential for everyone because they foster resilience and self-development.",
      b2: "To comprehensively address this topic, let me begin by sharing a defining experience that presented complex challenges requiring structured planning and perseverance. Moving on to the emotional dimension, accomplishing that objective instilled a profound sense of fulfillment and resilience. Looking at the broader picture, navigating such demanding situations is indispensable for personal and professional maturity, allowing individuals to discover their true capabilities.",
      guidance: resolvedGuidance || "Khung thuyết trình Part 4 (2 phút): Trả lời tuần tự cả 3 câu hỏi, kết nối mượt bằng 'To begin with...', 'Moving on to...', 'Ultimately...'",
    };
  }

  // Fallback tổng quát cho các câu hỏi Speaking khác
  return {
    b1: "Regarding this question, I believe that having clear preparation and positive motivation is essential. From my personal perspective, this allows people to build practical skills, communicate more effectively, and achieve better outcomes in their daily lives.",
    b2: "Addressing this matter, I strongly contend that structured preparation and intrinsic motivation are fundamental prerequisites. From an analytical perspective, engaging proactively in such circumstances enables individuals to cultivate robust communicative competencies, foster critical thinking, and attain sustainable long-term success.",
    guidance: resolvedGuidance,
  };
}

export interface VocabularyHintData {
  keywords: string[];
  startingPhrases: string[];
  linkingPhrases: string[];
}

export function resolveSpeakingVocabularyHints(
  prompt: string,
  topic?: string,
  partNumber?: number
): VocabularyHintData {
  const p = ((prompt || "") + " " + (topic || "")).toLowerCase();

  if (p.includes("outdoor") || p.includes("park") || p.includes("nature") || p.includes("street")) {
    return {
      keywords: ["lush greenery", "picturesque scenery", "leisure stroll", "vibrant atmosphere", "outdoor activities", "fresh breeze"],
      startingPhrases: [
        "Looking at the picture, the prominent feature is...",
        "The scene appears to be set in an open outdoor area where...",
      ],
      linkingPhrases: [
        "In the background, the weather seems quite pleasant and sunny...",
        "This clearly illustrates how people enjoy reconnecting with nature...",
      ],
    };
  }

  if (p.includes("cafe") || p.includes("coffee") || p.includes("restaurant") || p.includes("food") || p.includes("eat") || p.includes("meal")) {
    return {
      keywords: ["cozy ambiance", "casual dining", "savory delicacies", "sip a warm beverage", "social gathering", "mouthwatering dishes"],
      startingPhrases: [
        "The image captures a lively scene inside a cafe/restaurant where...",
        "At first glance, what stands out to me is the warm, inviting atmosphere...",
      ],
      linkingPhrases: [
        "The individuals seem deeply engaged in their conversation...",
        "It reminds me of relaxing weekend get-togethers with close companions...",
      ],
    };
  }

  if (p.includes("work") || p.includes("office") || p.includes("meeting") || p.includes("laptop") || p.includes("study") || p.includes("library")) {
    return {
      keywords: ["collaborative workspace", "digital devices", "brainstorm solutions", "intense concentration", "team synergy", "meet tight deadlines"],
      startingPhrases: [
        "In this photograph, I can observe a modern working environment where...",
        "The central focus is a group of colleagues collaborating on a task...",
      ],
      linkingPhrases: [
        "Judging by their focused expressions, they appear to be tackling a deadline...",
        "This reflects the collaborative nature of contemporary professional life...",
      ],
    };
  }

  if (p.includes("sport") || p.includes("exercise") || p.includes("gym") || p.includes("fitness") || p.includes("run") || p.includes("workout")) {
    return {
      keywords: ["physical endurance", "cardio workout", "healthy lifestyle", "burn calories", "strenuous exercise", "boost stamina"],
      startingPhrases: [
        "This image depicts individuals actively engaging in physical workout...",
        "The primary focus is on staying fit and maintaining good health through...",
      ],
      linkingPhrases: [
        "Regular physical exertion like this helps reduce chronic stress...",
        "It emphasizes the growing awareness of health and personal wellness...",
      ],
    };
  }

  if (p.includes("shop") || p.includes("market") || p.includes("store") || p.includes("supermarket") || p.includes("mall") || p.includes("buy")) {
    return {
      keywords: ["bustling marketplace", "browsing products", "retail therapy", "consumer behavior", "fresh produce", "convenient checkout"],
      startingPhrases: [
        "The picture illustrates a busy commercial setting where customers are...",
        "What immediately catches my attention is the wide variety of goods on display...",
      ],
      linkingPhrases: [
        "Shopping in physical stores allows people to inspect items firsthand...",
        "This scene reflects everyday urban lifestyle and consumer habits...",
      ],
    };
  }

  if (p.includes("travel") || p.includes("vacation") || p.includes("trip") || p.includes("airport") || p.includes("flight") || p.includes("journey")) {
    return {
      keywords: ["breathtaking destination", "broaden horizons", "cultural exploration", "travel itinerary", "scenic landmark", "unforgettable getaway"],
      startingPhrases: [
        "The picture portrays tourists visiting a captivating travel destination...",
        "The overall mood of the scene conveys wanderlust and excitement...",
      ],
      linkingPhrases: [
        "Traveling allows individuals to step outside their comfort zone...",
        "Experiences like this enrich our understanding of different cultures...",
      ],
    };
  }

  if (p.includes("family") || p.includes("child") || p.includes("kid") || p.includes("home") || p.includes("parent")) {
    return {
      keywords: ["close-knit bond", "quality family time", "warm household", "nurturing environment", "generational connection", "domestic harmony"],
      startingPhrases: [
        "The photograph presents an intimate domestic setting where family members...",
        "A strong sense of warmth and togetherness is evident as...",
      ],
      linkingPhrases: [
        "Spending meaningful moments together reinforces emotional security...",
        "This reflects how important strong family bonds are in daily life...",
      ],
    };
  }

  if (p.includes("compare") || p.includes("contrast") || partNumber === 3) {
    return {
      keywords: ["striking contrast", "traditional versus modern", "pace of life", "convenience and flexibility", "lifestyle preference"],
      startingPhrases: [
        "While the first picture portrays a dynamic setting, the second depicts...",
        "Comparing the two scenarios, there is a stark difference in...",
      ],
      linkingPhrases: [
        "On the one hand, the former offers great convenience, whereas...",
        "Personally, I find the latter much more appealing because...",
      ],
    };
  }

  // Fallback tổng quát cho miêu tả tranh Part 2 & Part 3
  return {
    keywords: ["focal point", "lively interaction", "peaceful setting", "facial expressions", "daily routine"],
    startingPhrases: [
      "The first detail that catches my attention is...",
      "In the foreground, there are people engaged in...",
    ],
    linkingPhrases: [
      "Overall, the photo conveys a very positive and harmonious vibe...",
      "From my perspective, this situation is quite relatable because...",
    ],
  };
}

export interface HallOfFameCardItem {
  id: string;
  band: "B1" | "B2" | "C";
  score: string;
  author: string;
  text: string;
  partNumber: number;
}

// Danh sách bài mẫu học viên Bảng Kỳ Tích đạt điểm cao thực chiến
export function getSpeakingHallOfFameSubmissions(topic?: string, partNumber?: number): HallOfFameCardItem[] {
  return [
    {
      id: "hof-1",
      band: "B1",
      score: "22/30",
      author: "Học viên ẩn danh",
      text: "Well, receiving a gift is a very special moment for me. Uh, I think it's not about the value of the gift, but it's about the thought and the effort that the person put into it. For example, my best friend made me a small handcrafted card on my birthday...",
      partNumber: 4,
    },
    {
      id: "hof-2",
      band: "B1",
      score: "22/30",
      author: "Học viên ẩn danh",
      text: "The last gift I received was a handmade photo album from my best friend on my birthday. We've been friends since high school, so we share countless memories. Flipping through each page brought back so much laughter and joy...",
      partNumber: 4,
    },
    {
      id: "hof-3",
      band: "B1",
      score: "21/30",
      author: "Học viên ẩn danh",
      text: "First of all, I would like to tell you about the last gift I received. So, uh last year when I turned 18, I passed the national entrance test to attend my dream university, and my parents surprised me with a wristwatch...",
      partNumber: 4,
    },
    {
      id: "hof-4",
      band: "B1",
      score: "23/30",
      author: "Học viên ẩn danh",
      text: "First question, the last gift I received was a watch from my family on my birthday. It was about two months ago. We had a small party at home and after that my father gave me a nicely wrapped box...",
      partNumber: 4,
    },
    {
      id: "hof-5",
      band: "B1",
      score: "22/30",
      author: "Học viên ẩn danh",
      text: "I would like to tell you about the last gift I received was a brand new laptop which my parents gave to me to celebrate my admission to university. It was extremely helpful for my studies...",
      partNumber: 4,
    },
    {
      id: "hof-6",
      band: "B2",
      score: "27/30",
      author: "Học viên ẩn danh",
      text: "Well, to kick off with the first question about is the last present I received. It was an elegant mechanical wristwatch given to me by my parents on my most recent birthday. Not only was it aesthetically pleasing, but it also held immense sentimental value...",
      partNumber: 4,
    },
  ];
}

// Hàm phân tích 3 câu hỏi phụ của Part 4
export function parseSubQuestions(options: any): string[] {
  if (Array.isArray(options) && options.length > 0) {
    return options.filter((o) => typeof o === "string" && !o.startsWith("http"));
  }
  if (typeof options === "string" && options.trim()) {
    const parts = options.split(/\s*(?:\d+\.\s*|[•-]\s*)/).filter(Boolean);
    if (parts.length > 1) return parts.map((p) => p.trim());
    return [options.trim()];
  }
  return [];
}

// Helper chuẩn hóa URL hình ảnh Speaking
export function cleanSpeakingImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  let trimmed = String(url).trim();
  if (trimmed.includes(",")) {
    trimmed = trimmed.split(",")[0].trim();
  }
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return undefined;

  // Host CDN Aptis Academy
  if (trimmed.startsWith("speaking/")) {
    return `https://files.aptisacademy.com.vn/${trimmed}`;
  }
  if (trimmed.startsWith("https://files.aptisacademy.com.vn/")) {
    return trimmed;
  }
  // Xử lý link cũ aptiskey.com chuyển sang assets nội bộ
  if (trimmed.includes("aptiskey.com/images/speaking/part2/")) {
    const filename = trimmed.split("/").pop() || "";
    const num = filename.replace(/\D/g, "");
    if (num) return `/uploads/speaking/part2/image${num}.png`;
  }
  if (trimmed.includes("aptiskey.com/images/speaking/part3/")) {
    const filename = trimmed.split("/").pop() || "";
    const num = filename.replace(/\D/g, "");
    if (num) {
      if (num === "1" || num === "4") return `/uploads/speaking/part3/image${num}.jpg`;
      return `/uploads/speaking/part3/image${num}.png`;
    }
  }
  // Uploads cục bộ
  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("uploads/")) {
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Ảnh gốc chuẩn từ kho Aptis Kỳ Tích (ví dụ: de01_1.png, de01_2.png, p2_60.jpg, p3_60_1.jpg, p3_60_2.jpg, 1.png..99.png)
  if (/^(?:de\d+_[12]|p[234]_\d+(?:_[12]|_v2)?|\d+)\.(?:png|jpg|jpeg|webp)$/i.test(trimmed)) {
    return `https://bacoamhbatqpxatrrflz.supabase.co/storage/v1/object/public/exam-images/${trimmed}`;
  }
  if (trimmed.startsWith("Tranh_tr_ng__i_m_part_2_")) {
    return `/uploads/exams/speaking/${trimmed}`;
  }
  if (trimmed.startsWith("Tranh_tr_ng__i_m_part_3_")) {
    return `/uploads/exams/speaking/${trimmed}`;
  }

  return trimmed;
}

export function formatTimerDisplay(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const remSec = s % 60;
  return `${m.toString().padStart(2, "0")}:${remSec.toString().padStart(2, "0")}`;
}


// Nhận diện chính xác Part Number từ tiêu đề part, tiêu đề exam, query param
export function detectSpeakingPartNumber(p: any, examTitle?: string, fallbackPart?: number | null): 1 | 2 | 3 | 4 {
  const pTitle = (p?.title || "").toLowerCase();
  if (/(?:part\s*4|p4\b|thuyết trình|abstract|long turn)/i.test(pTitle)) return 4;
  if (/(?:part\s*3|p3\b|so sánh|hai bức tranh|compare)/i.test(pTitle)) return 3;
  if (/(?:part\s*2|p2\b|mô tả tranh|bức tranh|describe)/i.test(pTitle)) return 2;
  if (/(?:part\s*1|p1\b|personal|phỏng vấn)/i.test(pTitle)) return 1;

  if (fallbackPart && fallbackPart >= 1 && fallbackPart <= 4) {
    return fallbackPart as 1 | 2 | 3 | 4;
  }

  const eTitle = (examTitle || "").toLowerCase();
  if (/(?:part\s*4|p4\b|thuyết trình|abstract|long turn)/i.test(eTitle)) return 4;
  if (/(?:part\s*3|p3\b|so sánh|hai bức tranh|compare)/i.test(eTitle)) return 3;
  if (/(?:part\s*2|p2\b|mô tả tranh|bức tranh|describe)/i.test(eTitle)) return 2;
  if (/(?:part\s*1|p1\b|personal|phỏng vấn)/i.test(eTitle)) return 1;

  const rawNum = Number(p?.part_number ?? p?.partNumber);
  if (rawNum >= 1 && rawNum <= 4) return rawNum as 1 | 2 | 3 | 4;

  return 1;
}
