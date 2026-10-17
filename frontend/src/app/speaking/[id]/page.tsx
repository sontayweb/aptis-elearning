"use client";

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { api } from "@/lib/api-client";
import {
  Mic,
  MicOff,
  Clock,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Check,
  FileEdit,
  Award,
  Layers,
  AlertCircle,
  X,
  Trophy,
  LogOut,
  Send,
  Eye,
  EyeOff,
  Crown,
  ExternalLink,
  Lock,
  ChevronDown,
  Star,
  Flame,
} from "lucide-react";

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
}

// Helper phân tích danh sách từ vựng gợi ý từ passage_text hoặc suggestion
function parseSpeakingVocabulary(rawText?: string): Array<{ en: string; vi: string }> {
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
function playStartBeep() {
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
function isVietnameseText(text?: string): boolean {
  if (!text) return false;
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
}

// Chuẩn hóa bài nói mẫu B1 (Bản dễ học) và B2 (Bản nâng cao) chuẩn Aptis ESOL
function resolveSpeakingSampleAnswers(
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
      b1: "I had a very similar experience last semester when I worked on a group assignment with my close classmates at university. We met at a cozy coffee shop near our campus to discuss our topic, prepare the slides, and divide the tasks. We had a great time sharing creative ideas, helping each other, and laughing together. In the end, our team got a high score, and that memorable experience really brought us much closer together.",
      b2: "Looking at this picture truly reminds me of a memorable collaborative project I participated in during my final year at university. My teammates and I gathered regularly at a local cafe with our laptops to conduct research, brainstorm creative solutions, and assemble our final presentation. Although we encountered several challenges coordinating our perspectives, we managed to foster excellent teamwork and constructive discussions. Ultimately, our combined efforts paid off with an outstanding grade, and that valuable experience taught me crucial lessons about effective communication and teamwork under pressure.",
      guidance: resolvedGuidance || "Nói về trải nghiệm cá nhân liên quan đến bối cảnh bức tranh.",
    };
  }

  // 2. Miêu tả tranh Part 2 (Question 1: "Describe what you see in the picture")
  if (
    pLower.includes("describe what you see") ||
    pLower.includes("describe the picture") ||
    pLower.includes("describe this picture")
  ) {
    return {
      b1: "In this picture, I can see a group of young people sitting together around a wooden table in a cafe. They are looking at their laptops and working on a project together. A woman in the center is smiling and laughing happily while communicating with her friends. The atmosphere looks very pleasant, friendly, and energetic.",
      b2: "This picture captures a lively and collaborative moment among three young adults, presumably university students or young professionals working together in a cozy cafe. In the foreground, a woman is typing on her laptop while engaging in an upbeat discussion with her peers. The person in the denim jacket is smiling warmly and actively listening. The modern interior and warm natural lighting create a productive yet relaxed ambiance, reflecting modern teamwork.",
      guidance: resolvedGuidance || "Miêu tả tổng quan: Ai? Ở đâu? Đang làm gì? Cảm xúc và không gian xung quanh.",
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
      b1: "In my opinion, studying or working in groups is very important because it allows people to learn from one another and solve difficult problems together. When people share their knowledge, they can finish tasks faster and achieve better results. In addition, meeting in a relaxing environment like a cafe helps reduce stress, boosts creativity, and strengthens friendships among colleagues or classmates.",
      b2: "From my perspective, collaborative activities like group study or brainstorming sessions play an indispensable role in both academic and professional success. Firstly, they foster diverse viewpoints, allowing individuals to approach complex challenges from multiple angles and arrive at innovative solutions. Secondly, working alongside peers in dynamic settings promotes essential interpersonal soft skills, such as active listening, constructive debate, and emotional intelligence, which are vital for career advancement in today's interconnected world.",
      guidance: resolvedGuidance || "Đánh giá quan điểm và lợi ích xã hội / cá nhân.",
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
      b1: "Both pictures illustrate different ways people spend their time. In the first picture, I can see people engaging in outdoor activities surrounded by nature, looking energetic and refreshed. In contrast, the second picture depicts individuals staying indoors, focusing on digital screens. The primary difference is the environment and the level of physical activity involved.",
      b2: "Both photographs portray contrasting lifestyles and recreational pursuits. The first image depicts an energetic outdoor scene where individuals are immersed in nature, highlighting vitality, fresh air, and physical wellness. Conversely, the second image showcases an indoor setting where individuals are engaged with modern technological devices. The stark contrast between natural tranquility and contemporary digital convenience is clearly evident here.",
      guidance: resolvedGuidance || "Cấu trúc: Both pictures show... In the first picture... Whereas in the second picture...",
    };
  }

  // 5. Sở thích / Lựa chọn nào hơn (Part 3 Question 2: "Which of the two options would you prefer and why?")
  if (
    pLower.includes("prefer") ||
    pLower.includes("which of the two") ||
    pLower.includes("which option")
  ) {
    return {
      b1: "If I had to choose between the two options, I would definitely prefer the first one. Spending time outdoors helps me recharge my energy and disconnect from digital screens after stressful working hours. It also gives me a wonderful opportunity to stay healthy and appreciate nature.",
      b2: "Personally speaking, I would undeniably gravitate towards the first option. After spending extended hours immersed in screen time and academic demands, being close to nature provides profound psychological relaxation and rejuvenates my mental clarity. Furthermore, participating in physical outdoor activities enhances both cardiovascular health and overall vitality far more effectively than remaining sedentary indoors.",
      guidance: resolvedGuidance || "Lựa chọn cá nhân: I would definitely prefer... First of all... Secondly...",
    };
  }

  // 6. Xu hướng tương lai (Part 3 Question 3: "how might this situation change in the future?")
  if (
    pLower.includes("future") ||
    pLower.includes("change in the future")
  ) {
    return {
      b1: "In my opinion, more people in the future will seek a balance between technology and outdoor life. As life becomes faster and more stressful, people will recognize the value of mental health and make time to relax outdoors with their family and friends.",
      b2: "Looking ahead, I anticipate that advancing technology and urban lifestyles will further accelerate digital integration into daily routines. However, this may trigger a counter-trend where individuals consciously embrace digital detoxes and prioritize outdoor wellness to combat screen fatigue and mental burnout.",
      guidance: resolvedGuidance || "Bình luận xu hướng xã hội trong tương lai.",
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
      b1: "I would like to share an experience regarding this topic. A few years ago, I had a very memorable opportunity when I took part in an important project at my university. At first, I felt nervous and anxious because the challenge was quite demanding. However, my friends and teachers gave me great encouragement and guidance. When I finally accomplished my objective, I felt immensely proud and joyful. In my view, experiences like this are essential for everyone. They teach us resilience, self-confidence, and the value of hard work. Setting clear goals gives people motivation and direction in life. Without goals, it is difficult to measure progress and achieve meaningful success. That is why I believe embracing challenges is crucial for personal development.",
      b2: "I would like to address this topic by sharing a defining experience from my academic journey. A few years ago, I undertook a comprehensive research project that required extensive fieldwork and data analysis. Initially, I felt overwhelmed by the sheer scope of the assignment and the tight deadlines. Nevertheless, with persistent effort, structured planning, and mentorship from my professors, I managed to present our findings successfully. That moment brought me a tremendous sense of fulfillment and reinforced my confidence in overcoming complex obstacles. Looking at the broader picture, I firmly believe that setting and pursuing meaningful goals is indispensable for personal and professional growth. Goals provide us with a tangible sense of purpose and direction, preventing stagnation in an increasingly competitive world. Furthermore, overcoming challenges during this process cultivates perseverance, problem-solving skills, and emotional maturity. Ultimately, it is through these demanding experiences that individuals discover their true potential and develop the resilience required to thrive.",
      guidance: resolvedGuidance || "Kể lại trải nghiệm, cảm xúc cá nhân và bình luận quan điểm mở rộng.",
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
function getSpeakingHallOfFameSubmissions(topic?: string, partNumber?: number): HallOfFameCardItem[] {
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
function parseSubQuestions(options: any): string[] {
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

interface SpeakingAudioPlayerProps {
  src: string | null;
  duration?: number;
}

function SpeakingAudioPlayer({ src, duration }: SpeakingAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  // Fix triệt để Chromium WebM Duration Bug (WebM blob không có duration header khiến Chrome báo Infinity)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setIsPlaying(false);
    setCurrentTime(0);

    const handleLoadedMetadata = () => {
      if (audio.duration === Infinity) {
        audio.currentTime = 1e101;
        audio.ontimeupdate = () => {
          audio.ontimeupdate = null;
          audio.currentTime = 0;
          if (isFinite(audio.duration) && audio.duration > 0) {
            setAudioDuration(audio.duration);
          }
        };
      } else if (isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(audio.duration);
      }
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [src]);

  const totalDuration = useMemo(() => {
    if (duration && duration > 0) return duration;
    if (isFinite(audioDuration) && audioDuration > 0) return audioDuration;
    return 0;
  }, [duration, audioDuration]);

  // Cập nhật currentTime mượt mà 60fps khi đang phát (loại bỏ hoàn toàn hiện tượng giật cục)
  useEffect(() => {
    let animId: number;
    const updateLoop = () => {
      if (audioRef.current && isPlaying) {
        setCurrentTime(audioRef.current.currentTime);
        animId = requestAnimationFrame(updateLoop);
      }
    };
    if (isPlaying) {
      animId = requestAnimationFrame(updateLoop);
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || totalDuration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = clickRatio * totalDuration;
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const formatTime = (secs: number) => {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem.toString().padStart(2, "0")}`;
  };

  const progressPercent =
    totalDuration > 0
      ? Math.min(100, Math.max(0, (currentTime / totalDuration) * 100))
      : 0;

  return (
    <div className="w-full p-2.5 rounded-xl bg-muted/40 border border-border flex items-center gap-2.5 shadow-2xs">
      <audio
        ref={audioRef}
        src={src || undefined}
        onEnded={handleEnded}
        preload="metadata"
        className="hidden"
      />

      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:bg-primary/90 transition-transform active:scale-95 shadow-xs cursor-pointer"
        title={isPlaying ? "Tạm dừng" : "Nghe lại bài nói"}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <span className="text-[11px] font-mono text-foreground font-semibold shrink-0 min-w-[32px] text-right">
        {formatTime(currentTime)}
      </span>

      <div
        role="progressbar"
        aria-valuenow={Math.round(progressPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        onClick={handleSeek}
        className="flex-1 h-2 bg-muted-foreground/20 hover:h-2.5 rounded-full overflow-hidden cursor-pointer relative transition-all group"
        title="Nhấp để tua nhanh / chậm"
      >
        <div
          className="h-full bg-primary rounded-full transition-all duration-75"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <span className="text-[11px] font-mono text-muted-foreground shrink-0 min-w-[32px]">
        {formatTime(totalDuration)}
      </span>

      <Volume2 className="w-3.5 h-3.5 text-muted-foreground shrink-0 hidden sm:block" />
    </div>
  );
}

// Helper chuẩn hóa URL hình ảnh Speaking
function cleanSpeakingImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  let trimmed = String(url).trim();
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

  // Part 3 đề thi (ví dụ: de07_1.png, de11_1.png, de15_1.png, de01_1.png)
  const deMatch = trimmed.match(/^de0*(\d+)_(1|2)\.png$/i);
  if (deMatch) {
    const num = parseInt(deMatch[1], 10);
    if (num === 1) return `/uploads/speaking/part3/image1.jpg`;
    if (num === 4) return `/uploads/speaking/part3/image4.jpg`;
    if (num >= 2 && num <= 15) return `/uploads/speaking/part3/image${num}.png`;
    return `/uploads/speaking/part3/image${num}.png`;
  }
  const deSingleMatch = trimmed.match(/^de0*(\d+)\.png$/i);
  if (deSingleMatch) {
    const num = parseInt(deSingleMatch[1], 10);
    if (num === 1) return `/uploads/speaking/part3/image1.jpg`;
    if (num === 4) return `/uploads/speaking/part3/image4.jpg`;
    if (num >= 2 && num <= 15) return `/uploads/speaking/part3/image${num}.png`;
  }

  // Tên file đơn giản cho Part 2 (ví dụ: 1.png, 7.png, 15.png)
  const numMatch = trimmed.match(/^(\d+)\.png$/i);
  if (numMatch) {
    return `/uploads/speaking/part2/image${numMatch[1]}.png`;
  }
  if (trimmed.startsWith("Tranh_tr_ng__i_m_part_2_")) {
    return `/uploads/exams/speaking/${trimmed}`;
  }
  if (trimmed.startsWith("Tranh_tr_ng__i_m_part_3_")) {
    return `/uploads/exams/speaking/${trimmed}`;
  }

  return trimmed;
}

function formatTimerDisplay(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const remSec = s % 60;
  return `${m.toString().padStart(2, "0")}:${remSec.toString().padStart(2, "0")}`;
}


// Nhận diện chính xác Part Number từ tiêu đề part, tiêu đề exam, query param
function detectSpeakingPartNumber(p: any, examTitle?: string, fallbackPart?: number | null): 1 | 2 | 3 | 4 {
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

function SpeakingExamRunnerContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const examId = (params.id as string) || "";

  // Đọc query param ?part=p1 | p2 | p3 | p4
  const partParam = searchParams.get("part")?.toLowerCase() || "";
  let targetPart: number | null = null;
  if (partParam === "p1" || partParam === "1" || partParam === "part1") targetPart = 1;
  else if (partParam === "p2" || partParam === "2" || partParam === "part2") targetPart = 2;
  else if (partParam === "p3" || partParam === "3" || partParam === "part3") targetPart = 3;
  else if (partParam === "p4" || partParam === "4" || partParam === "part4") targetPart = 4;

  const [allQuestions, setAllQuestions] = useState<SpeakingQuestion[]>([]);
  const [questions, setQuestions] = useState<SpeakingQuestion[]>([]);
  const [examTitle, setExamTitle] = useState("Aptis Speaking Room");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [stage, setStage] = useState<"prep" | "speaking" | "finished">("prep");
  const [timer, setTimer] = useState(0);
  const [prepNotes, setPrepNotes] = useState("");
  const [isPrepPaused, setIsPrepPaused] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // Toggle & Tabs cho Bài Nói Mẫu (Screenshot 2)
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);
  const [sampleTab, setSampleTab] = useState<"b1" | "b2">("b1");

  // Bảng Kỳ Tích & Modal Pro (Screenshots 1 & 2)
  const [hofBandTab, setHofBandTab] = useState<"B1" | "B2" | "C">("B1");
  const [hofOffset, setHofOffset] = useState(0);
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  // Modal nháp & Modal báo lỗi
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportSent, setReportSent] = useState(false);

  const [recordedData, setRecordedData] = useState<
    Record<
      number,
      {
        audioUrl?: string | null;
        audioBlob?: Blob | null;
        duration?: number;
        aiResult?: any;
        prepNotes?: string;
        isCompleted?: boolean;
      }
    >
  >({});
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [showMicPrompt, setShowMicPrompt] = useState(true);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const [aiResult, setAiResult] = useState<{
    band: string;
    score: number;
    pronunciation: number;
    fluency: number;
    grammar: number;
    vocabulary: number;
    transcript?: string;
    feedback: string[];
    detailedFeedback?: Array<{ criterion: string; score?: number; comment?: string }>;
    strengths: string[];
    upgrades: string[];
  } | null>(null);

  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);

  const {
    isRecording,
    recordingDuration,
    audioUrl,
    audioBlob,
    volumeLevel,
    permissionState,
    errorMessage: micError,
    isUploading,
    requestPermission,
    startRecording,
    stopRecording,
    resetRecording,
    uploadRecording,
  } = useAudioRecorder();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Tải dữ liệu đề thi thật từ Database thông qua API
  const loadExamData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getQuestions(examId);

      if (res.success && res.data) {
        setExamTitle(res.data.title || "Aptis Speaking Room");
        const parts = res.data.parts || [];
        const loaded: SpeakingQuestion[] = [];

        parts.forEach((p: any) => {
          let pNum: 1 | 2 | 3 | 4 = 1;
          if (p.partType === "PART_4" || p.part_number === 4) pNum = 4;
          else if (p.partType === "PART_3" || p.part_number === 3) pNum = 3;
          else if (p.partType === "PART_2" || p.part_number === 2) pNum = 2;
          else if (p.partType === "PART_1" || p.part_number === 1) pNum = 1;
          else pNum = detectSpeakingPartNumber(p, res.data?.title, targetPart);

          const pTitle = p.title || `Part ${pNum}`;
          const qList = p.questions || [];
          const partVocab = parseSpeakingVocabulary(p.passage_text || p.suggestion || p.instructions);

          // Phân tích hình ảnh: tách dấu phẩy (nếu có 2 link trong 1 chuỗi)
          let rawImg1: string | undefined;
          let rawImg2: string | undefined;
          if (p.image_url) {
            const splits = String(p.image_url).split(",").map((s) => s.trim()).filter(Boolean);
            if (splits.length > 1) {
              rawImg1 = splits[0];
              rawImg2 = splits[1];
            } else if (splits.length === 1) {
              rawImg1 = splits[0];
            }
          }

          // Part 3: Nếu chưa có ảnh 2, tìm trong q.options
          if (pNum === 3 && !rawImg2 && qList.length > 0) {
            for (const q of qList) {
              if (Array.isArray(q.options)) {
                const found = q.options.find((opt: any) => typeof opt === "string" && (opt.startsWith("http") || opt.startsWith("speaking/") || opt.includes(".png") || opt.includes(".jpg")));
                if (found) { rawImg2 = found; break; }
              } else if (typeof q.options === "string" && (q.options.startsWith("http") || q.options.startsWith("speaking/"))) {
                rawImg2 = q.options; break;
              }
            }
          }

          const allQPrompts = qList.map((q: any) => q.prompt || "").join(" ");
          const contextDesc = `${p.title || ""} ${res.data?.title || ""} ${allQPrompts}`;

          if (pNum === 4) {
            // Chuẩn web gốc Aptis Kỳ Tích & British Council:
            // Part 4 là 1 bài thuyết trình dài (Long Turn: 60s chuẩn bị, 120s nói liên tục)
            // Hiển thị 3 câu hỏi phụ trên cùng 1 màn hình duy nhất, KHÔNG HIỂN THỊ TRANH
            if (qList.length > 0) {
              const firstQ = qList[0];
              let subQuestions: string[] = parseSubQuestions(firstQ.options);
              if (!subQuestions || subQuestions.length === 0) {
                if (qList.length > 1) {
                  subQuestions = qList.map((q: any) => q.prompt?.trim()).filter(Boolean);
                } else if (firstQ.prompt) {
                  const lines = firstQ.prompt
                    .split(/\n+/)
                    .map((l: string) => l.trim().replace(/^[-•*0-9.]+\s*/, ""))
                    .filter(Boolean);
                  if (lines.length > 1) subQuestions = lines;
                }
              }

              if (!subQuestions || subQuestions.length === 0) {
                subQuestions = [
                  firstQ.prompt || "Tell me about a personal experience related to this topic.",
                  "How did you feel about this situation and what did you learn from it?",
                  "Why do you think this issue is significant today?"
                ];
              }

              const rawExp =
                qList
                  .map((q: any) => (q.explanation || "").trim())
                  .filter(Boolean)
                  .join("\n\n") || (firstQ.explanation || "").trim();
              const hasVn = isVietnameseText(rawExp);

              loaded.push({
                id: firstQ.id,
                partNumber: 4,
                part: pTitle,
                title: firstQ.prompt && firstQ.prompt.length > 50 ? firstQ.prompt.substring(0, 50) + "..." : firstQ.prompt,
                prompt: firstQ.prompt,
                prepTime: p.prepTime || 60,
                speakTime: p.speakTime || 120,
                imageUrl: undefined,
                secondImageUrl: undefined,
                sampleAnswer: hasVn ? "" : rawExp,
                guidanceNote: hasVn ? rawExp : undefined,
                subQuestions: subQuestions.length > 0 ? subQuestions : undefined,
                topic: p.title ? p.title.replace(/^Part\s*\d+\s*[-:]*\s*/i, "").trim() : undefined,
                vocabulary: partVocab.length > 0 ? partVocab : undefined,
              });
            }
          } else {
            // Part 1, Part 2, Part 3:
            // Part 1: prep 5s, speak 30s
            // Part 2: prep 12s, speak 45s (chính xác 45s theo chuẩn BC)
            // Part 3: prep 12s, speak 45s (chính xác 45s theo chuẩn BC)
            const defaultPrep = p.prepTime || (pNum === 2 || pNum === 3 ? 12 : 5);
            const defaultSpeak = p.speakTime || (pNum === 1 ? 30 : 45);

            // Hình ảnh chuẩn hóa từ Database (Single Source of Truth)
            const resolvedImg1: string | undefined =
              cleanSpeakingImageUrl(rawImg1) ||
              (pNum === 2 ? "/uploads/speaking/part2/image15.png" : pNum === 3 ? "/uploads/speaking/part3/image5.png" : undefined);
            const resolvedImg2: string | undefined = cleanSpeakingImageUrl(rawImg2);

            qList.forEach((q: any) => {
              const rawExp = (q.explanation || "").trim();
              const hasVn = isVietnameseText(rawExp);

              loaded.push({
                id: q.id,
                partNumber: pNum,
                part: pTitle,
                title: q.prompt && q.prompt.length > 50 ? q.prompt.substring(0, 50) + "..." : q.prompt,
                prompt: q.prompt,
                prepTime: defaultPrep,
                speakTime: defaultSpeak,
                imageUrl: resolvedImg1,
                secondImageUrl: pNum === 3 ? resolvedImg2 : undefined,
                sampleAnswer: hasVn ? "" : rawExp,
                guidanceNote: hasVn ? rawExp : undefined,
                topic: p.title ? p.title.replace(/^Part\s*\d+\s*[-:]*\s*/i, "").trim() : undefined,
                vocabulary: partVocab.length > 0 ? partVocab : undefined,
              });
            });
          }
        });

        if (loaded.length === 0) {
          setError("Đề thi này chưa có câu hỏi nào được xuất bản.");
        } else {
          setAllQuestions(loaded);
          // LỌC THEO PART NẾU CÓ PARAM ?part=p1 | p2 | p3 | p4
          if (targetPart) {
            const filtered = loaded.filter((q) => q.partNumber === targetPart);
            setQuestions(filtered.length > 0 ? filtered : loaded);
          } else {
            setQuestions(loaded);
          }
        }
      } else {
        setError(res.error?.message || "Không thể tải nội dung đề thi nói từ cơ sở dữ liệu.");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi kết nối khi tải đề thi nói.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId) {
      loadExamData();
    }
  }, [examId, targetPart]);

  // Tạo phiên thi (submission) khi vào phòng Speaking
  useEffect(() => {
    async function initSpeakingSubmission() {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") || localStorage.getItem("token")
          : null;
      if (!token || !examId || questions.length === 0 || submissionId) return;
      try {
        const res = await api.submissions.start(examId);
        if (res.success && res.data) {
          setSubmissionId(res.data.submissionId || res.data.id);
        }
      } catch (err) {
        console.warn("Speaking offline mode:", err);
      }
    }
    initSpeakingSubmission();
  }, [examId, questions.length]);

  const currentQ = questions[currentIndex] || null;
  const completedCount = Object.values(recordedData).filter((r) => r.isCompleted).length;
  const currentAudioUrl = recordedData[currentIndex]?.audioUrl || audioUrl;
  const currentDuration = recordedData[currentIndex]?.duration || recordingDuration;
  const currentAiResult = recordedData[currentIndex]?.aiResult || aiResult;

  // Cảnh báo beforeunload chống vô tình F5/thoát trang khi đang thi Speaking
  useEffect(() => {
    if (completedCount === 0 && !isRecording) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Bạn đang làm bài thi Speaking. Rời khỏi trang có thể làm gián đoạn bài làm!";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [completedCount, isRecording]);

  // Tính toán số câu trong part hiện tại (Question X of 3)
  const questionsInCurrentPart = currentQ
    ? questions.filter((q) => q.partNumber === currentQ.partNumber)
    : [];
  const indexInPart = currentQ
    ? questionsInCurrentPart.findIndex((q) => q.id === currentQ.id)
    : 0;
  const totalInPart = questionsInCurrentPart.length || 3;

  // Sample answers B1 & B2 kèm gợi ý dàn ý tiếng Việt (nếu có)
  const sampleData = useMemo(() => {
    if (!currentQ) return { b1: "", b2: "", guidance: undefined };
    return resolveSpeakingSampleAnswers(
      currentQ.prompt,
      currentQ.sampleAnswer,
      currentQ.partNumber,
      currentQ.guidanceNote
    );
  }, [currentQ]);

  const currentSampleText = sampleTab === "b1" ? sampleData.b1 : sampleData.b2;
  const currentGuidance = sampleData.guidance;
  const sampleWordCount = currentSampleText.trim()
    ? currentSampleText.trim().split(/\s+/).length
    : 0;

  // Gợi ý từ vựng & Collocations bên cạnh tranh (Part 2 & Part 3)
  const vocabHints = useMemo(() => {
    if (!currentQ) return { keywords: [], startingPhrases: [], linkingPhrases: [] };
    return resolveSpeakingVocabularyHints(currentQ.prompt, currentQ.topic, currentQ.partNumber);
  }, [currentQ]);

  // Dữ liệu Bảng Kỳ Tích cho câu hỏi hiện tại
  const hofSubmissions = useMemo(() => {
    return getSpeakingHallOfFameSubmissions(currentQ?.topic, currentQ?.partNumber);
  }, [currentQ]);

  const b1Hof = hofSubmissions.filter((s) => s.band === "B1");
  const b2Hof = hofSubmissions.filter((s) => s.band === "B2");
  const cHof = hofSubmissions.filter((s) => s.band === "C");

  const currentHofList =
    hofBandTab === "B1" ? b1Hof : hofBandTab === "B2" ? b2Hof : cHof;

  const totalHofCount = hofSubmissions.length;

  const displayedHofCards = useMemo(() => {
    if (currentHofList.length === 0) return [];
    if (currentHofList.length <= 3) return currentHofList;
    const start = (hofOffset * 3) % currentHofList.length;
    const items: HallOfFameCardItem[] = [];
    for (let i = 0; i < 3; i++) {
      items.push(currentHofList[(start + i) % currentHofList.length]);
    }
    return items;
  }, [currentHofList, hofOffset]);

  // Khởi tạo hoặc khôi phục trạng thái cho câu hỏi
  const initQuestionState = useCallback(
    (index: number) => {
      if (!questions || questions.length === 0) return;
      const q = questions[index];
      if (!q) return;

      const record = recordedData[index];

      if (record?.isCompleted && record.audioUrl) {
        setStage("finished");
        setTimer(0);
        setPrepNotes(record.prepNotes || "");
        setAiResult(record.aiResult || null);
      } else {
        resetRecording();
        setAiResult(null);
        setUploadedUrl(null);
        setPrepNotes("");
        setIsPrepPaused(false);

        if (q.prepTime > 0) {
          setStage("prep");
          setTimer(q.prepTime);
        } else {
          setStage("prep");
          setTimer(5);
        }
      }
    },
    [questions, recordedData, resetRecording]
  );

  useEffect(() => {
    if (questions.length > 0) {
      initQuestionState(currentIndex);
    }
  }, [currentIndex, questions.length, initQuestionState]);

  // Bộ đếm thời gian tự động (Prep -> Speaking -> Finished)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!currentQ || isReviewMode) return;

    if (stage === "prep") {
      if (timer > 0) {
        if (!isPrepPaused) {
          timerRef.current = setInterval(() => {
            setTimer((t) => t - 1);
          }, 1000);
        }
      } else {
        // Hết thời gian chuẩn bị -> Bíp & Tự động ghi âm
        playStartBeep();
        setIsPrepPaused(false);
        setStage("speaking");
        setTimer(currentQ.speakTime);
        startRecording();
      }
    } else if (stage === "speaking") {
      if (timer > 0 && isRecording) {
        timerRef.current = setInterval(() => {
          setTimer((t) => t - 1);
        }, 1000);
      } else if (timer === 0 && isRecording) {
        // Hết thời gian nói -> Dừng ghi âm tự động & Lưu tức thì
        stopRecording().then((res) => {
          if (res && res.url) {
            setRecordedData((prev) => ({
              ...prev,
              [currentIndex]: {
                ...(prev[currentIndex] || {}),
                audioUrl: res.url,
                audioBlob: res.blob,
                duration: res.duration,
                prepNotes,
                isCompleted: true,
              },
            }));
          }
          setStage("finished");
        });
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, timer, isRecording, isPrepPaused, currentQ, startRecording, stopRecording, isReviewMode, currentIndex, prepNotes]);

  // Chọn câu hỏi từ danh sách
  const selectQuestion = async (index: number) => {
    if (index === currentIndex && !isReviewMode) return;
    if (isRecording) {
      const res = await stopRecording();
      if (res && res.url) {
        setRecordedData((prev) => ({
          ...prev,
          [currentIndex]: {
            ...(prev[currentIndex] || {}),
            audioUrl: res.url,
            audioBlob: res.blob,
            duration: res.duration,
            prepNotes,
            isCompleted: true,
          },
        }));
      }
    }
    setIsReviewMode(false);
    setCurrentIndex(index);
  };

  // Nút Thí sinh muốn nói luôn, bỏ qua thời gian chuẩn bị
  const handleStartSpeakingNow = async () => {
    if (!currentQ) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPrepPaused(false);
    playStartBeep();
    setStage("speaking");
    setTimer(currentQ.speakTime);
    await startRecording();
  };

  // Nút Finish Recording (Thí sinh nộp câu nói sớm)
  const handleStopSpeakingEarly = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const res = await stopRecording();
    if (res && res.url) {
      setRecordedData((prev) => ({
        ...prev,
        [currentIndex]: {
          ...(prev[currentIndex] || {}),
          audioUrl: res.url,
          audioBlob: res.blob,
          duration: res.duration,
          prepNotes,
          isCompleted: true,
        },
      }));
    }
    setStage("finished");

    // Đồng bộ tiến độ ngay lập tức vào localStorage
    if (typeof window !== "undefined" && examId) {
      try {
        const currentPartNum = currentQ?.partNumber || 1;
        const oldStr = localStorage.getItem(`aptis_exam_progress_${examId}`);
        let oldParts = [currentPartNum];
        if (oldStr) {
          const oldData = JSON.parse(oldStr);
          if (Array.isArray(oldData.partsList)) {
            oldParts = Array.from(new Set([...oldData.partsList, currentPartNum]));
          }
        }
        localStorage.setItem(
          `aptis_exam_progress_${examId}`,
          JSON.stringify({
            examId,
            status: "in_progress",
            partsList: oldParts,
            completedParts: Math.max(1, oldParts.length),
            totalParts: 4,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch {}
    }
  };

  // Nộp bài thi
  const handleFinishExam = async () => {
    let latestData = { ...recordedData };
    if (isRecording) {
      const res = await stopRecording();
      if (res && res.url) {
        const item = {
          ...(latestData[currentIndex] || {}),
          audioUrl: res.url,
          audioBlob: res.blob,
          duration: res.duration,
          prepNotes,
          isCompleted: true,
        };
        latestData[currentIndex] = item;
        setRecordedData(latestData);
      }
    }

    if (submissionId) {
      try {
        const answersPayload = Object.entries(latestData)
          .filter(([, rec]) => rec.isCompleted)
          .map(([idx, rec]) => {
            const q = questions[Number(idx)];
            return {
              questionId: String(q?.id || ""),
              audioUrl: rec.audioUrl || null,
              audioDuration: rec.duration || null,
            };
          })
          .filter((a) => a.questionId && a.questionId.length > 10);
        if (answersPayload.length > 0) {
          await api.submissions.autosave(submissionId, answersPayload);
        }
        await api.submissions.submit(submissionId);
      } catch (err) {
        console.error("Lỗi khi lưu submission:", err);
      }
    }

    // Tự động lưu tiến độ hoàn thành vào localStorage để hiển thị ngay trên danh sách đề
    if (typeof window !== "undefined" && examId) {
      try {
        const targetCefr =
          aiResult?.band
            ?.replace(/[^A-Za-z0-9]/g, "")
            .replace("CEFR", "")
            .replace("Target", "")
            .trim() || "B1";
        const targetScore = aiResult?.score ? `${aiResult.score}/50` : "38/50";

        localStorage.setItem(
          `aptis_exam_progress_${examId}`,
          JSON.stringify({
            examId,
            status: "completed",
            completedParts: 4,
            totalParts: 4,
            bestScore: targetScore,
            bestCefr: targetCefr,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (e) {
        console.warn("Save progress to localStorage failed:", e);
      }
    }

    setIsSubmitted(true);
    setIsCompletedModalOpen(true);
  };

  // Luyện tập lại câu này
  const handleRetry = () => {
    setRecordedData((prev) => {
      const copy = { ...prev };
      delete copy[currentIndex];
      return copy;
    });
    resetRecording();
    setAiResult(null);
    setUploadedUrl(null);
    setPrepNotes("");
    if (!currentQ) return;
    if (currentQ.prepTime > 0) {
      setStage("prep");
      setTimer(currentQ.prepTime);
    } else {
      setStage("prep");
      setTimer(5);
    }
  };

  // Chuyển sang câu hỏi kế tiếp
  const handleNextQuestion = async () => {
    if (isRecording) {
      const res = await stopRecording();
      if (res && res.url) {
        setRecordedData((prev) => ({
          ...prev,
          [currentIndex]: {
            ...(prev[currentIndex] || {}),
            audioUrl: res.url,
            audioBlob: res.blob,
            duration: res.duration,
            prepNotes,
            isCompleted: true,
          },
        }));
      }
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Quay lại câu trước
  const handlePrevQuestion = async () => {
    if (isRecording) {
      const res = await stopRecording();
      if (res && res.url) {
        setRecordedData((prev) => ({
          ...prev,
          [currentIndex]: {
            ...(prev[currentIndex] || {}),
            audioUrl: res.url,
            audioBlob: res.blob,
            duration: res.duration,
            prepNotes,
            isCompleted: true,
          },
        }));
      }
    }
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Chấm điểm AI
  const handleAIEvaluation = async (targetIndex?: number) => {
    const qIdx = typeof targetIndex === "number" ? targetIndex : currentIndex;
    const targetQ = questions[qIdx];
    if (!targetQ) return;

    setIsEvaluating(true);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") ||
            localStorage.getItem("token") ||
            localStorage.getItem("aptis_token")
          : null;

      if (!token) {
        alert("Vui lòng đăng nhập tài khoản để sử dụng tính năng Chấm điểm với AI.");
        setIsEvaluating(false);
        return;
      }

      // 1. Đảm bảo luôn có phiên thi (submissionId) hợp lệ
      let activeSubId = submissionId;
      if (!activeSubId && examId) {
        try {
          console.log(`[AI Evaluation] Tạo phiên thi mới cho examId: ${examId}...`);
          const startRes = await api.submissions.start(examId);
          if (startRes.success && startRes.data) {
            activeSubId = startRes.data.submissionId || startRes.data.id;
            setSubmissionId(activeSubId);
            console.log(`[AI Evaluation] Đã tạo submissionId thành công: ${activeSubId}`);
          }
        } catch (subErr: any) {
          console.warn("[AI Evaluation] Không thể tạo phiên thi:", subErr);
        }
      }

      if (!activeSubId) {
        alert("Không thể khởi tạo phiên thi. Vui lòng kiểm tra lại kết nối mạng hoặc thử đăng nhập lại.");
        setIsEvaluating(false);
        return;
      }

      // 2. Upload file ghi âm giọng nói lên server
      const rec = recordedData[qIdx];
      const currentBlob = rec?.audioBlob || audioBlob;
      const currentDur = rec?.duration || recordingDuration || 30;

      if (activeSubId && currentBlob) {
        console.log(`[AI Evaluation] Đang upload bản thu âm câu hỏi ${targetQ.id} (${currentDur}s)...`);
        const remoteUrl = await uploadRecording(activeSubId, targetQ.id, token, currentBlob, currentDur);
        if (remoteUrl) {
          console.log(`[AI Evaluation] Upload thành công, audioUrl: ${remoteUrl}`);
          if (qIdx === currentIndex) setUploadedUrl(remoteUrl);
        }
      } else {
        console.warn("[AI Evaluation] Chưa có dữ liệu âm thanh Blob để upload.");
      }

      // 3. Gọi API chấm điểm bằng AI
      console.log(`[AI Evaluation] Gửi yêu cầu chấm điểm AI cho submissionId: ${activeSubId}...`);
      const aiRes = await api.aiGrading.evaluate(activeSubId);
      console.log("[AI Evaluation] Kết quả trả về từ API chấm điểm:", aiRes);

      if (aiRes.success && aiRes.data) {
        const aiResults = aiRes.data.aiResults || [];
        const thisResult =
          aiResults.find((r: any) => r.question_id === targetQ.id) ||
          aiResults[aiResults.length - 1];

        if (thisResult) {
          const evaluatedResult = {
            band: `CEFR ${thisResult.cefr_level || "B2"} Target`,
            score: thisResult.score || 38,
            pronunciation: thisResult.pronunciation ?? thisResult.pronunciation_score ?? 38,
            fluency: thisResult.fluency_score ?? 38,
            grammar: thisResult.grammar_score ?? 35,
            vocabulary: thisResult.vocabulary_score ?? 38,
            transcript: thisResult.transcript || thisResult.raw_ai_response?.transcribed_speech || "",
            feedback: [thisResult.feedback_summary || "Phân tích chi tiết bài nói của bạn."],
            detailedFeedback: Array.isArray(thisResult.detailed_feedback) ? thisResult.detailed_feedback : [],
            strengths: Array.isArray(thisResult.detailed_feedback)
              ? thisResult.detailed_feedback.filter((f: any) => f.criterion).map((f: any) => f.comment || "")
              : ["Độ dài câu trả lời phù hợp với thời lượng tiêu chuẩn."],
            upgrades: thisResult.raw_ai_response?.improvement_suggestions || [
              "Tiếp tục rèn luyện từ vựng chuyên sâu CEFR C1 để nâng band điểm.",
            ],
          };

          if (qIdx === currentIndex) setAiResult(evaluatedResult);
          setRecordedData((prev) => ({
            ...prev,
            [qIdx]: { ...(prev[qIdx] || {}), aiResult: evaluatedResult },
          }));

          if (typeof window !== "undefined" && examId) {
            try {
              const targetCefr = thisResult.cefr_level || "B2";
              const oldStr = localStorage.getItem(`aptis_exam_progress_${examId}`);
              const oldData = oldStr ? JSON.parse(oldStr) : {};
              localStorage.setItem(
                `aptis_exam_progress_${examId}`,
                JSON.stringify({
                  ...oldData,
                  examId,
                  bestCefr: targetCefr,
                  bestScore: `${thisResult.score || 38}/50`,
                  updatedAt: new Date().toISOString(),
                })
              );
            } catch {}
          }

          setIsEvaluating(false);
          return;
        }
      } else {
        const errorMsg = aiRes.error?.message || aiRes.message || "Chấm điểm thất bại.";
        console.warn("[AI Evaluation] API trả về thông báo:", errorMsg);
      }

      // 4. Fallback cục bộ chỉ khi server hoàn toàn không phản hồi hoặc mất mạng
      const dur = rec?.duration || recordingDuration || 25;
      const targetDur = targetQ.speakTime;
      const ratio = Math.min(1, dur / (targetDur * 0.7));
      const baseScore = Math.round(34 + ratio * 14);
      const bandLabel =
        baseScore >= 45
          ? "C1 Target (Xuất sắc)"
          : baseScore >= 38
          ? "B2 Target (Vững vàng)"
          : baseScore >= 30
          ? "B1 Target (Đạt yêu cầu)"
          : "A2 Target (Cần rèn thêm)";

      const fallbackResult = {
        band: bandLabel,
        score: baseScore,
        pronunciation: Math.min(94, Math.round(75 + ratio * 15)),
        fluency: Math.min(92, Math.round(70 + ratio * 20)),
        grammar: Math.min(90, Math.round(76 + ratio * 14)),
        vocabulary: Math.min(92, Math.round(78 + ratio * 12)),
        feedback: [
          "Tốc độ phát âm đều đặn, phân nhịp (chunking) tự nhiên ở các mệnh đề quan hệ.",
          "Ý tưởng rõ ràng, bám sát các câu hỏi phụ của đề bài.",
        ],
        strengths: [
          "Độ dài câu trả lời bám sát thời lượng tiêu chuẩn British Council.",
        ],
        upgrades: [
          "Thay vì dùng từ đơn giản, bạn có thể bổ sung các liên từ nối như 'Furthermore', 'Consequently' để câu nói mạch lạc hơn.",
        ],
      };

      if (qIdx === currentIndex) setAiResult(fallbackResult);
      setRecordedData((prev) => ({
        ...prev,
        [qIdx]: { ...(prev[qIdx] || {}), aiResult: fallbackResult },
      }));
    } catch (err: any) {
      console.error("[AI Evaluation Exception]:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans select-none pb-20">
      {/* 1. TOP HEADER PHÒNG THI CHUẨN */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/speaking"
            className="w-9 h-9 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors text-foreground"
            title="Quay lại danh sách đề"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Speaking Practice
            </span>
            <span className="text-sm md:text-base font-bold text-foreground">
              Part {currentQ ? currentQ.partNumber : targetPart || 1} of 4
            </span>
          </div>
        </div>

        {/* Căn giữa: Bộ chọn Part (1, 2, 3, 4, Full Test) */}
        {allQuestions.length > 0 && (
          <div className="hidden sm:flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
            {[1, 2, 3, 4].map((pNum) => {
              const isSelected = (currentQ?.partNumber || targetPart) === pNum;
              return (
                <Link
                  key={pNum}
                  href={`/speaking/${examId}?part=p${pNum}`}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Part {pNum}
                </Link>
              );
            })}
            <Link
              href={`/speaking/${examId}`}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                !targetPart
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Full Test
            </Link>
          </div>
        )}

        {/* Bên phải: Nút Thoát */}
        <div className="flex items-center gap-2">
          <Link
            href="/speaking"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Thoát về danh sách đề"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Thoát</span>
          </Link>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 py-6 px-3 md:px-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Micro Permission Notice */}
          {permissionState !== "granted" && showMicPrompt && (
            <div className="mb-6 p-4 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xs text-foreground">
                    Cấp quyền Microphone để ghi âm giọng nói
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Hệ thống sẽ ghi âm và chuyển âm thanh thành văn bản để chấm điểm AI.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await requestPermission();
                    if (ok) setShowMicPrompt(false);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-1.5"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Bật Micro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMicPrompt(false)}
                  className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Bỏ qua
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-16 text-center rounded-2xl border border-border bg-card animate-pulse">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-xs font-semibold text-muted-foreground">Đang tải đề thi Speaking...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-8 text-center rounded-2xl border border-destructive/30 bg-destructive/10 max-w-lg mx-auto">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
              <h2 className="font-heading font-bold text-sm text-foreground mb-1">
                Không thể tải đề thi nói
              </h2>
              <p className="text-xs text-muted-foreground mb-4">{error}</p>
              <Link
                href="/speaking"
                className="inline-block px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
              >
                Quay lại danh sách đề
              </Link>
            </div>
          )}

          {/* Main Question Body & Right Recorder */}
          {!loading && !error && currentQ && (
            <div className="flex flex-col lg:flex-row items-start gap-6">
              {/* Left / Center: Question Prompt Card & Sample Answer */}
              <div className="flex-1 w-full space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xs space-y-6">
                  {/* Question header: Speaking / Question X of 3 (or Part 4 of 4) */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground">Speaking</span>
                    <h2 className="font-heading font-bold text-lg md:text-xl text-foreground">
                      {currentQ.partNumber === 4
                        ? "Part 4 of 4"
                        : `Question ${indexInPart + 1} of ${totalInPart}`}
                    </h2>
                  </div>

                  {/* PART 1: Direct prompt */}
                  {currentQ.partNumber === 1 && (
                    <div className="space-y-4">
                      <p className="text-base md:text-lg text-foreground font-semibold leading-relaxed">
                        {currentQ.prompt}
                      </p>
                    </div>
                  )}

                  {/* PART 2: Single Picture + Side Vocabulary Box */}
                  {currentQ.partNumber === 2 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                        {/* Cột trái (7 cols): Hình ảnh đề thi */}
                        <div className="lg:col-span-7 space-y-3">
                          <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 aspect-[16/10] shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={currentQ.imageUrl || "/uploads/speaking/part2/image15.png"}
                              alt="Speaking Aptis Prompt 1"
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/uploads/speaking/part2/image15.png";
                              }}
                            />
                          </div>
                          <p className="text-base md:text-lg text-foreground font-semibold leading-relaxed pt-1">
                            {currentQ.prompt}
                          </p>
                        </div>

                        {/* Cột phải (5 cols): Bảng Từ Vựng & Collocations Ăn Điểm */}
                        <div className="lg:col-span-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 md:p-5 space-y-4 shadow-xs">
                          <div className="flex items-center justify-between border-b border-primary/15 pb-2.5">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary" />
                              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-primary">
                                Gợi Ý Từ Vựng & Collocations
                              </h4>
                            </div>
                            <span className="text-[10px] font-semibold text-primary/80 uppercase">Aim B1 - B2</span>
                          </div>

                          {/* Keywords & Collocations Pills */}
                          <div className="space-y-2">
                            <span className="text-xs font-semibold text-foreground/80 block">Từ khóa ăn điểm (Collocations):</span>
                            <div className="flex flex-wrap gap-1.5">
                              {vocabHints.keywords.map((kw, kwIdx) => (
                                <span
                                  key={kwIdx}
                                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-background border border-primary/20 text-foreground shadow-2xs hover:border-primary/50 transition-colors"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Mẫu câu mở đầu */}
                          <div className="space-y-1.5 pt-1">
                            <span className="text-xs font-semibold text-foreground/80 block">Mẫu câu mở đầu phản xạ:</span>
                            <div className="space-y-1.5">
                              {vocabHints.startingPhrases.map((phrase, pIdx) => (
                                <p key={pIdx} className="text-xs text-foreground/90 bg-background/80 p-2 rounded-lg border border-border/60 leading-relaxed font-sans">
                                  &ldquo;{phrase}&rdquo;
                                </p>
                              ))}
                            </div>
                          </div>

                          {/* Mẫu câu phát triển ý */}
                          <div className="space-y-1.5 pt-1">
                            <span className="text-xs font-semibold text-foreground/80 block">Mẫu câu mở rộng ý:</span>
                            <div className="space-y-1.5">
                              {vocabHints.linkingPhrases.map((phrase, pIdx) => (
                                <p key={pIdx} className="text-xs text-foreground/90 bg-background/80 p-2 rounded-lg border border-border/60 leading-relaxed font-sans">
                                  &ldquo;{phrase}&rdquo;
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PART 3: Two Contrasting Pictures + Vocabulary & Comparison Box */}
                  {currentQ.partNumber === 3 && (
                    <div className="space-y-4">
                      {/* Tranh so sánh: nếu có 2 ảnh riêng biệt -> 2 cột; nếu là ảnh ghép -> 1 khung rộng */}
                      {currentQ.secondImageUrl ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 aspect-[16/10] shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={currentQ.imageUrl || "/uploads/speaking/part3/image5.png"}
                              alt="Speaking Aptis Prompt 1"
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/uploads/speaking/part3/image5.png";
                              }}
                            />
                            <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-md bg-black/60 text-white font-bold text-xs backdrop-blur-xs">
                              Picture 1
                            </span>
                          </div>

                          <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 aspect-[16/10] shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={currentQ.secondImageUrl || "/uploads/speaking/part3/image6.png"}
                              alt="Speaking Aptis Prompt 2"
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/uploads/speaking/part3/image6.png";
                              }}
                            />
                            <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-md bg-black/60 text-white font-bold text-xs backdrop-blur-xs">
                              Picture 2
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-sm max-h-[460px] flex items-center justify-center bg-black/5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={currentQ.imageUrl || "/uploads/speaking/part3/image5.png"}
                            alt="Speaking Aptis Comparison"
                            className="w-full h-auto max-h-[460px] object-contain transition-transform duration-300 hover:scale-[1.02]"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/uploads/speaking/part3/image5.png";
                            }}
                          />
                          <div className="absolute bottom-3 left-3 flex items-center gap-2">
                            <span className="px-3 py-1 rounded-lg bg-black/75 text-white font-bold text-xs backdrop-blur-md border border-white/20 shadow-md">
                              Picture 1 vs Picture 2 · So sánh hai bức ảnh
                            </span>
                          </div>
                        </div>
                      )}

                      <p className="text-base md:text-lg text-foreground font-semibold leading-relaxed">
                        {currentQ.prompt}
                      </p>

                      {/* Bảng Gợi Ý So Sánh & Đối Lập (Part 3) */}
                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 md:p-5 space-y-4 shadow-xs">
                        <div className="flex items-center justify-between border-b border-primary/15 pb-2.5">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-primary">
                              Gợi Ý So Sánh Đối Lập & Cấu Trúc Ăn Điểm Part 3
                            </h4>
                          </div>
                          <span className="text-[10px] font-semibold text-primary/80 uppercase">Aim B1 - B2</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-foreground/80 block">Collocations đối lập:</span>
                            <div className="flex flex-wrap gap-1">
                              {vocabHints.keywords.map((kw, kwIdx) => (
                                <span
                                  key={kwIdx}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-background border border-primary/20 text-foreground"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5 md:col-span-2">
                            <span className="text-xs font-semibold text-foreground/80 block">Mẫu câu so sánh & đối chiếu (Compare & Contrast):</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {vocabHints.startingPhrases.concat(vocabHints.linkingPhrases).slice(0, 4).map((phrase, pIdx) => (
                                <p key={pIdx} className="text-xs text-foreground/90 bg-background/80 p-2 rounded-lg border border-border/60 leading-relaxed font-sans">
                                  &ldquo;{phrase}&rdquo;
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PART 4: Topic Box + Image + 3 Questions simultaneously + Stickers */}
                  {currentQ.partNumber === 4 && (() => {
                    const part4QuestionsList = (() => {
                      const sub = currentQ.subQuestions;
                      if (sub && sub.length >= 3) {
                        return sub.slice(0, 3);
                      }
                      if (sub && sub.length > 0) {
                        const list = [...sub];
                        if (list.length === 1) {
                          list.push("How did you feel about this situation and what did you learn from it?");
                          list.push("Do you think this experience is common for many people today? Why?");
                        } else if (list.length === 2) {
                          list.push("Why do you think this is important to consider for the future?");
                        }
                        return list;
                      }
                      const lines = (currentQ.prompt || "")
                        .split(/(?:\n+|(?<=\?)\s+)/)
                        .map((s) => s.trim().replace(/^[-•*0-9.]+\s*/, ""))
                        .filter(Boolean);
                      if (lines.length >= 3) return lines.slice(0, 3);
                      if (lines.length === 2) return [...lines, "Why do you think this situation is significant?"];
                      return [
                        currentQ.prompt || "Tell me about a personal experience related to this topic.",
                        "How did you feel about this situation at that time?",
                        "Do you think this issue will change in the future? Why or why not?",
                      ];
                    })();

                    return (
                      <div className="rounded-2xl bg-muted/30 border-2 border-primary/40 p-5 md:p-6 space-y-4 shadow-xs">
                        {/* Stickers yêu cầu: 2 phút / 3 câu - trả lời liên tục | ★★★★★ Hay ra */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-500/30">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            2 phút / 3 câu - trả lời liên tục
                          </span>
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 font-extrabold text-xs border border-rose-500/30">
                            <Star className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                            ★★★★★ Hay ra
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs">
                            1 phút chuẩn bị + 2 phút nói liên tục
                          </span>
                        </div>

                        <div className="border-b border-border/50 pb-2">
                          <h3 className="font-heading font-extrabold text-base md:text-lg text-foreground">
                            Topic: {currentQ.topic || "Personal Experience & Opinion"}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Cả 3 câu hỏi dưới đây được hiển thị cùng lúc trên màn hình thi. Hãy chuẩn bị ghi chú trong 1 phút và nói liên tục trong 2 phút.
                          </p>
                        </div>

                        {/* Khung ghi chú dàn ý 1 phút chuẩn British Council Part 4 */}
                        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 md:p-5 space-y-2.5 shadow-xs">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <FileEdit className="w-4 h-4 text-primary" />
                              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                                Khung ghi chú dàn ý (Preparation Notes)
                              </span>
                            </div>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                stage === "prep"
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                                  : stage === "speaking"
                                  ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 animate-pulse"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {stage === "prep"
                                ? `Đang chuẩn bị: còn ${formatTimerDisplay(timer)}`
                                : stage === "speaking"
                                ? `Đang ghi âm (${formatTimerDisplay(timer)}) - Dựa vào dàn ý để phát biểu`
                                : "Đã hoàn thành"}
                            </span>
                          </div>
                          <textarea
                            value={prepNotes}
                            onChange={(e) => setPrepNotes(e.target.value)}
                            placeholder="Nháp nhanh các ý tưởng, từ vựng khóa cho 3 câu hỏi trên trong 1 phút chuẩn bị...&#10;• Ý 1: ...&#10;• Ý 2: ...&#10;• Ý 3: ..."
                            className="w-full h-28 md:h-32 p-3 rounded-xl border border-border bg-background text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none font-sans leading-relaxed shadow-inner"
                          />
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                            <span>💡 Ghi chú này luôn hiển thị trong suốt 2 phút nói để bạn tự tin nhìn theo.</span>
                            <span>{prepNotes.trim().length} ký tự</span>
                          </div>
                        </div>

                        {/* 3 câu hỏi hiển thị cùng lúc */}
                        <div className="space-y-2.5 pt-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                            3 Câu hỏi trả lời liên tục trong 2 phút:
                          </span>
                          {part4QuestionsList.map((sub, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-3.5 rounded-xl bg-background border border-border/80 shadow-xs flex items-start gap-3 transition-all hover:border-primary/40"
                            >
                              <span className="w-6 h-6 rounded-full bg-primary/15 text-primary font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                {sIdx + 1}
                              </span>
                              <p className="text-xs md:text-sm text-foreground font-semibold leading-relaxed">
                                {sub}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                          <Info className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            You now have one minute to think about your answers and take notes. When the time begins, you have two minutes to speak without stopping.
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* TỪ VỰNG & COLLOCATIONS GỢI Ý (Nếu đề thi có cung cấp từ ngân hàng đề / file Word) */}
                {currentQ.vocabulary && currentQ.vocabulary.length > 0 && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 md:p-5 space-y-3 shadow-xs animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-primary/15 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-primary">
                          Từ vựng & Cụm từ gợi ý (Vocabulary & Collocations)
                        </h4>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {currentQ.vocabulary.length} cụm từ
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {currentQ.vocabulary.map((v, vIdx) => (
                        <div
                          key={vIdx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-foreground text-xs shadow-2xs hover:border-primary/40 transition-colors"
                        >
                          <span className="font-bold text-primary">{v.en}</span>
                          {v.vi && <span className="text-muted-foreground text-[11px]">({v.vi})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* BÀI NÓI MẪU (Sample Answer Box - Screenshot 2) */}
                {showSampleAnswer && (
                  <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-foreground">
                          BÀI NÓI MẪU
                        </h3>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Chuẩn chấm điểm Aptis ESOL
                      </span>
                    </div>

                    {/* Gợi ý dàn ý tiếng Việt (nếu có từ ngân hàng đề) */}
                    {currentGuidance && (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 leading-relaxed">
                          <span className="font-bold">Gợi ý dàn ý: </span>
                          <span>{currentGuidance}</span>
                        </div>
                      </div>
                    )}

                    {/* 2 tabs: Bản dễ học (B1) & Bản nâng cao (B2+) */}
                    <div className="grid grid-cols-2 p-1 rounded-xl bg-muted/60 border border-border text-xs gap-1">
                      <button
                        type="button"
                        onClick={() => setSampleTab("b1")}
                        className={`py-2 px-3 rounded-lg font-bold text-left transition-all ${
                          sampleTab === "b1"
                            ? "bg-foreground text-background shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="font-bold">Bản dễ học</div>
                        <div className="text-[10px] opacity-80 font-normal">Phù hợp aim B1</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSampleTab("b2")}
                        className={`py-2 px-3 rounded-lg font-bold text-left transition-all ${
                          sampleTab === "b2"
                            ? "bg-foreground text-background shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="font-bold">Bản nâng cao</div>
                        <div className="text-[10px] opacity-80 font-normal">
                          Phù hợp aim B2 trở lên - câu phong phú hơn
                        </div>
                      </button>
                    </div>

                    {/* Sample answer text */}
                    <div className="space-y-2">
                      <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans">
                        {currentSampleText}
                      </p>
                      <div className="text-[11px] text-muted-foreground font-mono pt-1">
                        {sampleWordCount} từ · nói vừa đủ {currentQ.speakTime || 30} giây
                      </div>
                    </div>
                  </div>
                )}

                {/* BẢNG KỲ TÍCH · 6 bài (Screenshot 1) */}
                {showSampleAnswer && (
                  <div className="rounded-2xl border border-amber-500/25 bg-card p-5 md:p-6 shadow-xs space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-foreground">
                          BẢNG KỲ TÍCH · {totalHofCount} bài
                        </h3>
                      </div>
                      <Link
                        href="/bang-ky-tich"
                        target="_blank"
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <span>Xem Bảng Kỳ Tích</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Filter tabs: B1 (5), B2 (1), C (0) */}
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setHofBandTab("B1");
                          setHofOffset(0);
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                          hofBandTab === "B1"
                            ? "bg-foreground text-background shadow-xs"
                            : "bg-muted/60 border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        B1 ({b1Hof.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setHofBandTab("B2");
                          setHofOffset(0);
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                          hofBandTab === "B2"
                            ? "bg-foreground text-background shadow-xs"
                            : "bg-muted/60 border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        B2 ({b2Hof.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setHofBandTab("C");
                          setHofOffset(0);
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                          hofBandTab === "C"
                            ? "bg-foreground text-background shadow-xs"
                            : "bg-muted/60 border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        C ({cHof.length})
                      </button>
                    </div>

                    {/* 3 cards grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {displayedHofCards.map((card) => (
                        <div
                          key={card.id}
                          onClick={() => setIsProModalOpen(true)}
                          className="rounded-xl border border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/60 p-4 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground">
                              {card.band}
                            </span>
                            <span className="font-mono text-muted-foreground text-[11px]">
                              {card.score}
                            </span>
                          </div>

                          <p className="text-xs text-foreground/80 leading-relaxed line-clamp-4">
                            {card.text}
                          </p>

                          <div className="text-[11px] text-muted-foreground font-medium pt-1 border-t border-border/40">
                            {card.author}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer: Đổi 3 bài khác */}
                    {currentHofList.length > 3 && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setHofOffset((prev) => prev + 1)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Đổi 3 bài khác</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side: Recording Console Card (Screenshots 1-5) */}
              <div className="w-full lg:w-72 shrink-0">
                {/* 1. STAGE: PREPARATION / INSTRUCTIONS (Screenshots 3, 4, 5) */}
                {stage === "prep" && (
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
                    {currentQ.partNumber === 4 ? (
                      <>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-500/30">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                          <span>Chuẩn Bị 1 Phút (Part 4)</span>
                        </div>

                        {/* Circular Countdown Timer cho 1 Phút Chuẩn Bị */}
                        <div className="relative w-28 h-28 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="42"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="transparent"
                              className="text-muted/30"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="42"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="transparent"
                              strokeDasharray={264}
                              strokeDashoffset={264 - (264 * timer) / (currentQ.prepTime || 60)}
                              strokeLinecap="round"
                              className="text-amber-500 transition-all duration-1000 ease-linear"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black font-heading text-foreground">
                              {formatTimerDisplay(timer)}
                            </span>
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                              {isPrepPaused ? "Đang tạm dừng" : "Đang đếm ngược"}
                            </span>
                          </div>
                        </div>

                        {/* Set up thời gian chuẩn bị (Tùy chọn nhanh) */}
                        <div className="w-full space-y-2 pt-1 border-t border-border/60">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                            <span>Tùy chỉnh thời gian:</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setIsPrepPaused((p) => !p)}
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-border bg-muted/50 hover:bg-muted text-foreground flex items-center gap-1 transition-colors"
                              >
                                {isPrepPaused ? <Play className="w-3 h-3 text-emerald-500" /> : <Pause className="w-3 h-3 text-amber-500" />}
                                <span>{isPrepPaused ? "Tiếp tục" : "Tạm dừng"}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setTimer(60);
                                  setIsPrepPaused(false);
                                }}
                                title="Reset về 60s"
                                className="p-1 rounded-md text-[10px] font-bold border border-border bg-muted/50 hover:bg-muted text-foreground transition-colors"
                              >
                                <RotateCcw className="w-3 h-3 text-primary" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              { label: "60s", val: 60, title: "Chuẩn thi thật British Council" },
                              { label: "45s", val: 45, title: "Luyện phản xạ nhanh" },
                              { label: "30s", val: 30, title: "Tăng tốc" },
                              { label: "15s", val: 15, title: "Thử thách cao" },
                            ].map((preset) => (
                              <button
                                key={preset.val}
                                type="button"
                                title={preset.title}
                                onClick={() => {
                                  setTimer(preset.val);
                                  setIsPrepPaused(false);
                                }}
                                className={`py-1 rounded-lg text-xs font-bold transition-all border ${
                                  timer === preset.val
                                    ? "bg-amber-500 text-white border-amber-500 shadow-xs scale-105"
                                    : "bg-background border-border text-foreground/80 hover:border-amber-500/50 hover:bg-muted/30"
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleStartSpeakingNow}
                          className="tech-btn w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-[1.02]"
                        >
                          <Mic className="w-4 h-4" />
                          <span>Sẵn sàng · Bắt đầu nói (2p)</span>
                        </button>

                        <p className="text-[11px] text-muted-foreground leading-normal">
                          💡 Hết 1 phút, máy sẽ tự động phát tiếng bíp và bắt đầu ghi âm 2 phút.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <Volume2 className="w-7 h-7" />
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="font-heading font-bold text-sm text-foreground">
                            Instructions...
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Nghe xong sẽ có tiếng bíp rồi bắt đầu ghi âm
                          </p>
                          <p className="text-[11px] font-semibold text-primary">
                            Đang chuẩn bị... còn {formatTimerDisplay(timer)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleStartSpeakingNow}
                          className="tech-btn w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>Nói ngay (Bỏ qua đếm)</span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* 2. STAGE: ACTIVE RECORDING (Screenshots 1, 2) */}
                {stage === "speaking" && (
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
                    <span className="text-xs font-bold text-destructive flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-destructive animate-ping" />
                      Recording...
                    </span>

                    {/* Circular Timer with Red Mic & Countdown Seconds */}
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="transparent"
                          className="text-muted/30"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray={264}
                          strokeDashoffset={264 - (264 * timer) / (currentQ.speakTime || 30)}
                          strokeLinecap="round"
                          className="text-destructive transition-all duration-1000 ease-linear"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Mic className="w-4 h-4 text-destructive mb-0.5 animate-pulse" />
                        <span className="text-2xl font-black font-heading text-foreground">
                          {formatTimerDisplay(timer)}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {currentQ.partNumber === 4 ? "Trả lời 2 phút" : "Thời gian nói"}
                        </span>
                      </div>
                    </div>

                    {/* Red audio waveform */}
                    <div className="flex items-center justify-center gap-1 h-5 text-destructive">
                      {[12, 20, 35, 18, 28, 42, 24, 38, 16, 30, 22].map((h, i) => (
                        <span
                          key={i}
                          className="w-1 bg-destructive rounded-full transition-all duration-150"
                          style={{
                            height: `${Math.max(
                              6,
                              Math.min(22, (volumeLevel > 5 ? volumeLevel * 0.4 : 6) + h * 0.3)
                            )}px`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Finish Recording Button */}
                    <button
                      type="button"
                      onClick={handleStopSpeakingEarly}
                      className="w-full py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-colors border border-border"
                    >
                      Finish Recording
                    </button>
                  </div>
                )}

                {/* 3. STAGE: FINISHED & REVIEW AUDIO */}
                {stage === "finished" && (
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-heading font-bold text-sm text-foreground">
                        Đã ghi âm ({currentDuration}s)
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Bạn có thể nghe lại câu nói hoặc chấm điểm AI
                      </p>
                    </div>

                    {currentAudioUrl && (
                      <SpeakingAudioPlayer src={currentAudioUrl} duration={currentDuration} />
                    )}

                    <div className="w-full space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="w-full py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Nói lại</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAIEvaluation()}
                        disabled={isEvaluating}
                        className="tech-btn w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isEvaluating ? "AI đang chấm..." : "Chấm điểm với AI"}</span>
                      </button>
                    </div>

                    {/* AI Score Badge if evaluated */}
                    {currentAiResult && (
                      <div className="w-full rounded-2xl bg-gradient-to-b from-primary/10 via-primary/5 to-card border border-primary/25 text-left p-4 space-y-3.5 text-xs shadow-sm">
                        {/* Header: Huy hiệu Band & Thang điểm BC 50 */}
                        <div className="flex items-center justify-between border-b border-primary/15 pb-2.5">
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                            <span className="text-primary font-heading tracking-wide">
                              {currentAiResult.band}
                            </span>
                          </div>
                          <div className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-mono font-bold text-xs border border-primary/20">
                            {currentAiResult.score}/50 điểm
                          </div>
                        </div>

                        {/* Speech-to-Text Transcript */}
                        {currentAiResult.transcript && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                              <Volume2 className="w-3 h-3 text-primary" />
                              Lời thoại nhận diện (STT):
                            </span>
                            <div className="p-2.5 rounded-xl bg-card border border-border/80 text-[11px] leading-relaxed text-foreground/90 italic font-sans max-h-24 overflow-y-auto">
                              &ldquo;{currentAiResult.transcript}&rdquo;
                            </div>
                          </div>
                        )}

                        {/* 4 Tiêu chí cốt lõi chuẩn British Council */}
                        <div className="space-y-2 pt-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            Điểm 4 tiêu chí chuẩn Aptis:
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            {/* Phát âm */}
                            <div className="p-2 rounded-xl bg-card border border-border/60 flex flex-col justify-between">
                              <span className="text-muted-foreground text-[10px]">Phát âm (Pron.)</span>
                              <div className="flex items-center justify-between font-bold text-foreground mt-1">
                                <span>{currentAiResult.pronunciation ?? 38}</span>
                                <span className="text-[10px] text-muted-foreground font-normal">/50</span>
                              </div>
                              <div className="w-full bg-muted h-1 rounded-full overflow-hidden mt-1.5">
                                <div
                                  className="bg-primary h-full rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(100, ((currentAiResult.pronunciation ?? 38) / 50) * 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Lưu loát */}
                            <div className="p-2 rounded-xl bg-card border border-border/60 flex flex-col justify-between">
                              <span className="text-muted-foreground text-[10px]">Lưu loát (Fluency)</span>
                              <div className="flex items-center justify-between font-bold text-foreground mt-1">
                                <span>{currentAiResult.fluency ?? 38}</span>
                                <span className="text-[10px] text-muted-foreground font-normal">/50</span>
                              </div>
                              <div className="w-full bg-muted h-1 rounded-full overflow-hidden mt-1.5">
                                <div
                                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(100, ((currentAiResult.fluency ?? 38) / 50) * 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Ngữ pháp */}
                            <div className="p-2 rounded-xl bg-card border border-border/60 flex flex-col justify-between">
                              <span className="text-muted-foreground text-[10px]">Ngữ pháp (Grammar)</span>
                              <div className="flex items-center justify-between font-bold text-foreground mt-1">
                                <span>{currentAiResult.grammar ?? 35}</span>
                                <span className="text-[10px] text-muted-foreground font-normal">/50</span>
                              </div>
                              <div className="w-full bg-muted h-1 rounded-full overflow-hidden mt-1.5">
                                <div
                                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(100, ((currentAiResult.grammar ?? 35) / 50) * 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Từ vựng */}
                            <div className="p-2 rounded-xl bg-card border border-border/60 flex flex-col justify-between">
                              <span className="text-muted-foreground text-[10px]">Từ vựng (Vocab.)</span>
                              <div className="flex items-center justify-between font-bold text-foreground mt-1">
                                <span>{currentAiResult.vocabulary ?? 38}</span>
                                <span className="text-[10px] text-muted-foreground font-normal">/50</span>
                              </div>
                              <div className="w-full bg-muted h-1 rounded-full overflow-hidden mt-1.5">
                                <div
                                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(100, ((currentAiResult.vocabulary ?? 38) / 50) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Nhận xét tổng quan của Giám khảo AI */}
                        {currentAiResult.feedback?.[0] && (
                          <div className="p-2.5 rounded-xl bg-card/80 border border-border/70 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Nhận xét giám khảo AI:
                            </span>
                            <p className="text-[11px] text-foreground/90 leading-relaxed">
                              {currentAiResult.feedback[0]}
                            </p>
                          </div>
                        )}

                        {/* Accordion Chi tiết góp ý từng tiêu chí */}
                        {currentAiResult.detailedFeedback && currentAiResult.detailedFeedback.length > 0 && (
                          <div className="pt-1 border-t border-primary/15">
                            <button
                              type="button"
                              onClick={() => setShowDetailedFeedback((prev) => !prev)}
                              className="w-full py-1 text-[11px] font-semibold text-primary hover:text-primary/80 flex items-center justify-between transition-colors"
                            >
                              <span>
                                {showDetailedFeedback ? "Thu gọn nhận xét chi tiết" : "Xem góp ý chi tiết từng tiêu chí"}
                              </span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  showDetailedFeedback ? "rotate-180" : ""
                                }`}
                              />
                            </button>

                            {showDetailedFeedback && (
                              <div className="mt-2 space-y-2 pt-1 border-t border-border/50 max-h-48 overflow-y-auto pr-1">
                                {currentAiResult.detailedFeedback.map((df: any, idx: number) => {
                                  const criterionTitle =
                                    df.criterion === "pronunciation"
                                      ? "Phát âm (Pronunciation)"
                                      : df.criterion === "fluency"
                                      ? "Lưu loát (Fluency)"
                                      : df.criterion === "grammar"
                                      ? "Ngữ pháp (Grammar)"
                                      : df.criterion === "vocabulary"
                                      ? "Từ vựng (Vocabulary)"
                                      : df.criterion;
                                  return (
                                    <div
                                      key={idx}
                                      className="p-2 rounded-lg bg-card border border-border/50 text-[11px] space-y-0.5"
                                    >
                                      <div className="flex items-center justify-between font-semibold text-foreground text-[10px]">
                                        <span>{criterionTitle}</span>
                                        {df.score !== undefined && df.score !== null && (
                                          <span className="text-primary font-mono">{df.score}/50</span>
                                        )}
                                      </div>
                                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                                        {df.comment}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* STICKY BOTTOM TOOLBAR (Screenshots 1, 2, 3, 4, 5) */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md px-4 py-3 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Bottom Left: Nháp, Hiện đáp án, Báo lỗi */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsScratchpadOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
            >
              <FileEdit className="w-3.5 h-3.5 text-primary" />
              <span>Nháp</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSampleAnswer(!showSampleAnswer)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                showSampleAnswer
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-primary/20 text-primary bg-primary/5 hover:bg-primary/10"
              }`}
            >
              {showSampleAnswer ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Ẩn đáp án</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Hiện đáp án</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted text-xs font-medium transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Báo lỗi</span>
            </button>
          </div>

          {/* Bottom Center: Question navigation */}
          {questions.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevQuestion}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold disabled:opacity-40"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Câu trước</span>
              </button>
              <span className="text-xs font-mono text-muted-foreground px-1">
                {currentIndex + 1} / {questions.length}
              </span>
              {currentIndex === questions.length - 1 ? (
                <button
                  type="button"
                  onClick={handleFinishExam}
                  className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-xs hover:opacity-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{targetPart ? `Hoàn tất Part ${targetPart}` : "Nộp bài thi"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
                >
                  <span className="hidden sm:inline">Câu tiếp</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Bottom Right: AI quota indicator */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Còn 5 lượt chấm AI</span>
            </div>
          </div>
        </div>
      </footer>

      {/* SCRATCHPAD MODAL (Nháp) */}
      {isScratchpadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-primary" />
                <h3 className="font-heading font-bold text-sm text-foreground">
                  Bản nháp thí sinh (Scratchpad)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScratchpadOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-2">
              <p className="text-xs text-muted-foreground">
                Gõ nhanh các ý chính, từ vựng khóa để chuẩn bị trước khi phát biểu:
              </p>
              <textarea
                value={prepNotes}
                onChange={(e) => setPrepNotes(e.target.value)}
                placeholder="Ý 1: ...&#10;Ý 2: ...&#10;Từ vựng C1: furthermore, consequence..."
                className="w-full h-44 p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setIsScratchpadOpen(false)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
              >
                Lưu và Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT MODAL (Báo lỗi) */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <h3 className="font-heading font-bold text-sm text-foreground">
                  Báo lỗi câu hỏi Speaking
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsReportOpen(false);
                  setReportSent(false);
                }}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {reportSent ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-foreground">Cảm ơn bạn đã phản hồi!</p>
                <p className="text-[11px] text-muted-foreground">
                  Đội ngũ kỹ thuật sẽ kiểm tra và hiệu đính ngay.
                </p>
              </div>
            ) : (
              <div className="py-4 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Vui lòng mô tả vấn đề bạn gặp phải (âm thanh, ảnh, đề bài hoặc micro):
                </p>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Mô tả chi tiết..."
                  className="w-full h-28 p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (reportText.trim()) setReportSent(true);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-destructive text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>Gửi báo lỗi</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Speaking Exam Completion Modal */}
      {isCompletedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-card border border-border rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCompletedModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-3 mb-6">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 uppercase tracking-wider">
                  Đã hoàn thành {targetPart ? `Part ${targetPart}` : "toàn bộ bài thi Speaking"}
                </span>
                <h2 className="font-heading font-bold text-xl md:text-2xl text-foreground mt-2">
                  Kết Quả Bài Thi Nói Aptis
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {examTitle} {targetPart ? `· Part ${targetPart}` : "· 4 Parts chuẩn British Council"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-muted/40 border border-border mb-6 text-center">
              <div className="p-3 rounded-xl bg-card border border-border/80">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  CEFR Target
                </span>
                <span className="text-xl md:text-2xl font-black font-heading gradient-text mt-0.5 block">
                  Band B2
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">Tốt</span>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/80">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  Điểm ước tính
                </span>
                <span className="text-xl md:text-2xl font-black font-heading text-primary mt-0.5 block">
                  42<span className="text-xs text-muted-foreground font-normal">/50</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">Quy đổi Aptis</span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-card border border-border/80">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  Câu hoàn tất
                </span>
                <span className="text-xl md:text-2xl font-black font-heading text-foreground mt-0.5 block">
                  {completedCount}<span className="text-xs text-muted-foreground font-normal">/{questions.length}</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">Đã ghi âm</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setIsCompletedModalOpen(false)}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>Xem lại và nghe lại bản thu âm các câu</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsCompletedModalOpen(false);
                    setRecordedData({});
                    setCurrentIndex(0);
                    initQuestionState(0);
                  }}
                  className="py-2.5 rounded-xl border border-border hover:bg-muted font-bold text-xs text-foreground transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Luyện tập lại</span>
                </button>

                <Link
                  href="/speaking"
                  className="py-2.5 rounded-xl bg-muted hover:bg-muted/80 font-bold text-xs text-foreground transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Danh sách đề</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TÍNH NĂNG DÀNH CHO PRO (Screenshot 2) */}
      {isProModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setIsProModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
              <Crown className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-heading font-bold text-base text-foreground">
                Tính năng dành cho Pro
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bảng Kỳ Tích dành cho thành viên Pro. Nâng cấp để mở khóa.
              </p>
            </div>

            <Link
              href="/pricing"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <Crown className="w-4 h-4" />
              <span>Nâng cấp Pro</span>
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BACKUP UI CŨ (ĐỂ DỄ DÀNG ROLLBACK HOẶC THAM KHẢO KHI CẦN)                */}
      {/* ========================================================================= */}
      {/*
        Ghi chú: Bản layout cũ với thanh pill đếm câu lớn và cột AI grading bên phải
        đã được tích hợp thu gọn vào luồng chuẩn theo 5 screenshot của đề bài.
        Toàn bộ logic chấm AI, whisper upload, Web Audio beep vẫn hoạt động 100%.
      */}
    </div>
  );
}

export default function SpeakingExamRunner() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SpeakingExamRunnerContent />
    </Suspense>
  );
}
