"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import {
  Headphones,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Eye,
  Flag,
  Menu,
  Info,
  ArrowUp,
  LogOut,
  X,
  Trophy,
  Sparkles,
  FileText,
  Languages,
} from "lucide-react";
import { DEFAULT_LISTENING_TEST } from "@/data/listening-benchmark";

// Định nghĩa dữ liệu 4 Parts chuẩn Aptis Listening
interface Part1Item {
  id?: string;
  num: number;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  audioUrl?: string;
  transcript?: string;
}

interface Part2Speaker {
  id?: string;
  speaker: string;
  correctAnswer: string;
  explanation: string;
}

interface Part3Opinion {
  id?: string;
  statement: string;
  correctAnswer: "Man" | "Woman" | "Both";
  explanation: string;
}

interface Part4Question {
  id?: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Part4Recording {
  recNum: number;
  title: string;
  passageText: string;
  questions: Part4Question[];
  audioUrl?: string;
  translationText?: string;
}

export interface ListeningExamData {
  title: string;
  durationMinutes: number;
  part1: Part1Item[];
  part2: {
    topic?: string;
    prompt?: string;
    instructions?: string;
    options?: string[];
    speakers: Part2Speaker[];
    audioUrl?: string;
    passageText?: string;
    translationText?: string;
  };
  part3: {
    prompt?: string;
    topic?: string;
    instructions?: string;
    opinions: Part3Opinion[];
    audioUrl?: string;
    passageText?: string;
    translationText?: string;
  };
  part4: Part4Recording[];
}

// DEFAULT_LISTENING_TEST được import từ benchmark dataset chuẩn tại @/data/listening-benchmark

// Bộ đề mẫu 02 — Thảo luận & Quan điểm nâng cao (Tránh trùng lặp)
const DEFAULT_LISTENING_TEST_2 = {
  title: "Đề 02 — Full Listening · 4 Parts",
  durationMinutes: 40,
  part1: [
    {
      num: 1,
      prompt: "A woman is calling a customer service center. What is her issue with the package?",
      options: ["It was delivered to the wrong address", "The contents inside were damaged", "The delivery was delayed by three days"],
      correctAnswer: "It was delivered to the wrong address",
      explanation: "She confirms the parcel went to apartment 4B instead of 4A.",
    },
    {
      num: 2,
      prompt: "Listen to an announcement at a train station. Which platform should passengers take for Oxford?",
      options: ["Platform 3", "Platform 5B", "Platform 8"],
      correctAnswer: "Platform 5B",
      explanation: "The station announcer directs Oxford commuters to platform 5B.",
    },
    {
      num: 3,
      prompt: "A doctor is speaking to a patient. What lifestyle advice does she emphasize?",
      options: ["Drink more herbal tea", "Get at least 30 minutes of daily walking", "Avoid carbohydrates entirely"],
      correctAnswer: "Get at least 30 minutes of daily walking",
      explanation: "She strongly recommends brisk walking for half an hour daily.",
    },
    {
      num: 4,
      prompt: "A radio host interviews an architect. What feature of the new library is unique?",
      options: ["Rooftop solar garden", "Underground cinema", "All-glass reading atrium"],
      correctAnswer: "All-glass reading atrium",
      explanation: "The architect highlights the transparent atrium maximizing daylight.",
    },
    {
      num: 5,
      prompt: "Listen to a voicemail message. What time does the team meeting start on Monday?",
      options: ["8:30 AM", "9:00 AM", "10:15 AM"],
      correctAnswer: "10:15 AM",
      explanation: "The manager postponed the kickoff session to 10:15 AM.",
    },
    {
      num: 6,
      prompt: "A receptionist is booking a tour. How much is the discount for family groups?",
      options: ["10 percent", "15 percent", "25 percent"],
      correctAnswer: "15 percent",
      explanation: "Family bookings of four or more receive a 15% markdown.",
    },
    {
      num: 7,
      prompt: "What will the weather in the southern region be like tomorrow?",
      options: ["Heavy rain and thunderstorms", "Misty and cold", "Sunny and dry"],
      correctAnswer: "Sunny and dry",
      explanation: "Warm dry sunshine will prevail across southern districts.",
    },
    {
      num: 8,
      prompt: "Why was the flight to Frankfurt rescheduled?",
      options: ["Technical engine check", "Dense morning fog", "Air traffic strike"],
      correctAnswer: "Dense morning fog",
      explanation: "Visibility dropped below safe thresholds due to heavy fog.",
    },
    {
      num: 9,
      prompt: "A student asks a librarian about returning textbooks. Where is the drop box?",
      options: ["By the main exit door", "Next to the computer lab", "On the third floor"],
      correctAnswer: "By the main exit door",
      explanation: "The return slot is conveniently located right beside the exterior exit door.",
    },
    {
      num: 10,
      prompt: "Which museum exhibit is free for high school students this week?",
      options: ["Modern Sculptures", "Ancient Egyptian Artifacts", "Digital Art Gallery"],
      correctAnswer: "Ancient Egyptian Artifacts",
      explanation: "The historical Egypt exhibition provides free admission for teens.",
    },
    {
      num: 11,
      prompt: "A customer orders a birthday cake. What flavor does she choose?",
      options: ["Vanilla strawberry", "Dark chocolate fudge", "Matcha green tea"],
      correctAnswer: "Dark chocolate fudge",
      explanation: "She specifies a 2-tier dark chocolate fudge cake with white icing.",
    },
    {
      num: 12,
      prompt: "Listen to the guide at an art gallery. How long does the guided tour take?",
      options: ["45 minutes", "60 minutes", "90 minutes"],
      correctAnswer: "60 minutes",
      explanation: "The full gallery walk-through lasts exactly one hour.",
    },
    {
      num: 13,
      prompt: "A caller leaves a message for David. What does she want him to bring to the dinner?",
      options: ["Fresh dessert fruits", "A bottle of olive oil", "Home-baked bread"],
      correctAnswer: "Home-baked bread",
      explanation: "She requests a loaf of his signature sourdough bread.",
    },
  ],
  part2: {
    topic: "Workplace Productivity & Remote Work",
    instructions: "Four employees share their views on working from home. Match each speaker to their statement.",
    options: [
      "Saves two hours of commute time daily",
      "Misses spontaneous brainstorming with teammates",
      "Struggles to separate office tasks from personal life",
      "Enjoys quiet focus without office interruptions",
      "Finds remote setup too expensive for home utilities",
    ],
    speakers: [
      {
        speaker: "Speaker A",
        correctAnswer: "Saves two hours of commute time daily",
        explanation: "Speaker A loves not having to ride crowded morning trains.",
      },
      {
        speaker: "Speaker B",
        correctAnswer: "Misses spontaneous brainstorming with teammates",
        explanation: "Speaker B feels creative ideas emerge better in person.",
      },
      {
        speaker: "Speaker C",
        correctAnswer: "Struggles to separate office tasks from personal life",
        explanation: "Speaker C frequently answers emails late into the night.",
      },
      {
        speaker: "Speaker D",
        correctAnswer: "Enjoys quiet focus without office interruptions",
        explanation: "Speaker D produces deeper research output at home.",
      },
    ],
    passageText: `Speaker A: "Working remotely saves me over two hours of commuting in crowded subway trains each day, giving me more time with family."\n\nSpeaker B: "I really miss the spontaneous hallway brainstorming and casual coffee talks with teammates that only happen in person."\n\nSpeaker C: "My biggest struggle is boundary setting. With work laptops at home, I often end up responding to emails until late at night."\n\nSpeaker D: "I get so much more deep analytical work done without constant open-plan office disruptions and impromptu meetings."`,
    translationText: `Người nói A: "Làm việc từ xa giúp tôi tiết kiệm hơn 2 giờ đi lại trên các chuyến tàu điện ngầm đông đúc mỗi ngày, dành được nhiều thời gian hơn cho gia đình."\n\nNgười nói B: "Tôi thực sự nhớ những buổi trao đổi ý tưởng ngẫu hứng ở hành lang và lúc trò chuyện cà phê trực tiếp cùng đồng nghiệp."\n\nNgười nói C: "Khó khăn lớn nhất của tôi là thiết lập ranh giới làm việc. Để máy tính ở nhà khiến tôi thường xuyên phải trả lời email đến tận đêm muộn."\n\nNgười nói D: "Tôi hoàn thành được nhiều nghiên cứu phân tích chuyên sâu hơn hẳn khi không bị phân tâm bởi môi trường văn phòng mở và các cuộc họp đột xuất."`,
  },
  part3: {
    topic: "Electric Vehicles and Environmental Future",
    instructions: "Who expresses which opinion? Select Man, Woman, or Both.",
    passageText: `Man: "Electric vehicles are gaining popularity, but rural charging networks remain painfully sparse across the countryside."\n\nWoman: "I agree, charging deserts outside major metropolitan highways are still a major roadblock for everyday drivers."\n\nMan: "We also cannot overlook the significant carbon and environmental footprint tied to rare metal battery mining."\n\nWoman: "True, but as technology scales and subsidies expand, EVs will definitely dominate passenger transit by 2035."`,
    translationText: `Nam: "Xe điện đang ngày càng phổ biến hơn, nhưng mạng lưới trạm sạc ở khu vực nông thôn vẫn còn quá thưa thớt."\n\nNữ: "Tôi đồng ý, các khoảng trống thiếu trạm sạc ngoài trục đô thị lớn vẫn là trở ngại đáng kể với tài xế đi lại hàng ngày."\n\nNam: "Chúng ta cũng không thể xem nhẹ dấu chân carbon và tác động môi trường không nhỏ từ hoạt động khai thác kim loại hiếm làm pin."\n\nNữ: "Đúng vậy, nhưng khi công nghệ được tối ưu và chính sách trợ cấp mở rộng, xe điện chắc chắn sẽ giữ thế áp đảo trong phương tiện giao thông trước năm 2035."`,
    opinions: [
      {
        statement: "1. Charging infrastructure in rural areas is still inadequate.",
        correctAnswer: "Both" as const,
        explanation: "Both participants acknowledge rural charging deserts.",
      },
      {
        statement: "2. Battery manufacturing has a notable environmental footprint.",
        correctAnswer: "Man" as const,
        explanation: "The man quotes lifecycle battery mining assessments.",
      },
      {
        statement: "3. Government subsidies should be expanded for buyers.",
        correctAnswer: "Woman" as const,
        explanation: "The woman argues price parity needs fiscal policy support.",
      },
      {
        statement: "4. Electric cars will dominate passenger transit by 2035.",
        correctAnswer: "Woman" as const,
        explanation: "The woman is confident in rapid technological adoption.",
      },
    ],
  },
  part4: [
    {
      recNum: 1,
      title: "Recording 1 of 2",
      passageText: "An environmental specialist discusses renewable wind energy offshore.",
      questions: [
        {
          prompt: "1. What is the primary benefit of offshore wind farms mentioned by the speaker?",
          options: [
            "Stronger and more consistent ocean wind streams",
            "Lower installation and maintenance costs",
            "Easier visual acceptance from coastal residents",
          ],
          correctAnswer: "Stronger and more consistent ocean wind streams",
          explanation: "Ocean winds blow faster and smoother without land friction.",
        },
        {
          prompt: "2. What technical obstacle is engineering research aiming to solve?",
          options: [
            "Floating anchors in ultra-deep ocean waters",
            "Saltwater corrosion of steel turbine blades",
            "Impact on migratory marine mammal communication",
          ],
          correctAnswer: "Floating anchors in ultra-deep ocean waters",
          explanation: "Tethering turbines stably beyond 100 meters depth remains the key challenge.",
        },
      ],
    },
    {
      recNum: 2,
      title: "Recording 2 of 2",
      passageText: "A university lecturer delivers an introduction to Behavioral Economics.",
      questions: [
        {
          prompt: "1. How does Behavioral Economics diverge from Classical Economics?",
          options: [
            "It accounts for psychological and emotional biases in decisions",
            "It solely analyzes financial stock market algorithms",
            "It assumes consumers always maximize mathematical utility",
          ],
          correctAnswer: "It accounts for psychological and emotional biases in decisions",
          explanation: "Human decision makers rely on cognitive shortcuts rather than strict logic.",
        },
        {
          prompt: "2. What practical application does the lecturer recommend for policymakers?",
          options: [
            "Gentle 'nudges' that guide better retirement saving choices",
            "Heavy financial fines on unhealthy food consumption",
            "Complete deregulation of consumer lending markets",
          ],
          correctAnswer: "Gentle 'nudges' that guide better retirement saving choices",
          explanation: "Default opt-in schemes dramatically improve national pension savings.",
        },
      ],
    },
  ],
};

function ListeningExamRunnerContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = (params.id as string) || "";

  // Chọn bộ đề benchmark phù hợp dựa trên ID đề (để không bị trùng đề)
  const initialBenchmark =
    examId.includes("2") || examId.includes("02")
      ? DEFAULT_LISTENING_TEST_2
      : DEFAULT_LISTENING_TEST;

  const [examData, setExamData] = useState<ListeningExamData>(initialBenchmark);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Stage Index (1 to 17 exercises total):
  // 0..12: Part 1 (13 questions)
  // 13: Part 2 (1 question with 4 speakers)
  // 14: Part 3 (1 question with 4 opinions)
  // 15: Part 4 Recording 1 (2 questions)
  // 16: Part 4 Recording 2 (2 questions)
  const [activeStage, setActiveStage] = useState(0);

  // Answers State:
  const [p1Answers, setP1Answers] = useState<Record<number, string>>({});
  const [p2Answers, setP2Answers] = useState<Record<number, string>>({});
  const [p3Answers, setP3Answers] = useState<Record<number, "Man" | "Woman" | "Both">>({});
  const [p4Answers, setP4Answers] = useState<Record<string, string>>({});

  // Audio Playback Controller
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCounts, setPlayCounts] = useState<Record<number, number>>({});
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [audioUrlMap, setAudioUrlMap] = useState<Record<number, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Timer & UI states
  const [timeLeft, setTimeLeft] = useState(40 * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSampleAnswers, setShowSampleAnswers] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [showScript, setShowScript] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"all" | "p1" | "p2" | "p3" | "p4">("all");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("Lỗi âm thanh hoặc audio");
  const [reportNote, setReportNote] = useState("");
  const [reportSent, setReportSent] = useState(false);

  // Dynamic Stage definitions based on actually loaded questions in examData
  const listeningStages: Array<{
    id: string;
    partNum: 1 | 2 | 3 | 4;
    subIndex: number;
    title: string;
    label: string;
    audioUrl?: string;
  }> = [];

  // Part 1 questions
  examData.part1.forEach((q, idx) => {
    listeningStages.push({
      id: `p1_${idx}`,
      partNum: 1,
      subIndex: idx,
      title: `Part 1 — Câu ${idx + 1}`,
      label: `Câu ${idx + 1}`,
      audioUrl: q.audioUrl || audioUrlMap[idx],
    });
  });

  // Part 2
  if (examData.part2.speakers && examData.part2.speakers.length > 0) {
    listeningStages.push({
      id: "p2",
      partNum: 2,
      subIndex: 0,
      title: "Part 2 — Matching Info (4 Speakers)",
      label: "Part 2: 4 Speakers",
      audioUrl: (examData.part2 as any).audioUrl || audioUrlMap[13],
    });
  }

  // Part 3
  if (examData.part3.opinions && examData.part3.opinions.length > 0) {
    listeningStages.push({
      id: "p3",
      partNum: 3,
      subIndex: 0,
      title: "Part 3 — Short Conversations (Opinions)",
      label: "Part 3: Opinions",
      audioUrl: (examData.part3 as any).audioUrl || audioUrlMap[14],
    });
  }

  // Part 4
  examData.part4.forEach((rec, idx) => {
    listeningStages.push({
      id: `p4_${idx}`,
      partNum: 4,
      subIndex: idx,
      title: `Part 4 — Bài thuyết trình ${idx + 1}`,
      label: `Part 4: Rec ${idx + 1}`,
      audioUrl: rec.audioUrl || audioUrlMap[15 + idx],
    });
  });

  if (listeningStages.length === 0) {
    listeningStages.push({
      id: "p1_0",
      partNum: 1,
      subIndex: 0,
      title: "Part 1 — Câu 1",
      label: "Câu 1",
    });
  }

  const currentStage = listeningStages[activeStage] || listeningStages[0];

  // Lấy Script và Bản dịch song song cho stage hiện tại
  const getCurrentBilingualData = () => {
    if (!currentStage) return null;
    if (currentStage.partNum === 2) {
      return {
        title: "Part 2 — Đoạn ghi âm 4 người nói",
        script:
          (examData.part2 as any).passageText ||
          examData.part2.speakers.map((s) => `${s.speaker}: "${s.correctAnswer}"`).join("\n\n"),
        translation: (examData.part2 as any).translationText || "",
      };
    } else if (currentStage.partNum === 3) {
      return {
        title: "Part 3 — Hội thoại thảo luận quan điểm",
        script:
          (examData.part3 as any).passageText ||
          examData.part3.opinions.map((o) => `• ${o.statement} (${o.correctAnswer})`).join("\n\n"),
        translation: (examData.part3 as any).translationText || "",
      };
    } else if (currentStage.partNum === 4) {
      const rec = examData.part4[currentStage.subIndex];
      return {
        title: `Part 4 — Bài thuyết trình ${currentStage.subIndex + 1}`,
        script: rec?.passageText || "",
        translation: rec?.translationText || "",
      };
    } else if (currentStage.partNum === 1) {
      const q = examData.part1[currentStage.subIndex];
      return {
        title: `Part 1 — Câu hỏi ${currentStage.subIndex + 1}`,
        script: q?.transcript || q?.prompt || "",
        translation: "",
      };
    }
    return null;
  };

  // Tự động nhảy tới Part nếu URL có ?part=p1 / p2 / p3 / p4 / 1 / 2 / 3 / 4
  useEffect(() => {
    if (!searchParams || listeningStages.length === 0) return;
    const p = searchParams.get("part")?.toLowerCase();
    if (!p) return;
    let targetPart: 1 | 2 | 3 | 4 | null = null;
    if (p === "p1" || p === "1" || p === "part1") targetPart = 1;
    else if (p === "p2" || p === "2" || p === "part2") targetPart = 2;
    else if (p === "p3" || p === "3" || p === "part3") targetPart = 3;
    else if (p === "p4" || p === "4" || p === "part4") targetPart = 4;

    if (targetPart !== null) {
      const idx = listeningStages.findIndex((s) => s.partNum === targetPart);
      if (idx !== -1) setActiveStage(idx);
    }
  }, [searchParams, listeningStages]);

  // Tự động cuộn pill câu hỏi đang chọn vào giữa thanh điều hướng
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(`stage-pill-${activeStage}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeStage]);

  // Khởi tạo phiên làm bài trên backend
  useEffect(() => {
    async function initSubmission() {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") || localStorage.getItem("token")
          : null;
      if (!token || !examId || submissionId) return;
      try {
        const res = await api.submissions.start(examId);
        if (res.success && res.data) {
          setSubmissionId(res.data.submissionId || res.data.id);
        }
      } catch (e) {
        console.warn("Offline listening session:", e);
      }
    }
    initSubmission();
  }, [examId, submissionId]);

  // Load đề thi từ backend với bộ parser đầy đủ
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.exams.getQuestions(examId);
        if (res.success && res.data) {
          const apiExam = res.data;
          const parsed = parseApiToListeningData(apiExam);
          setExamData(parsed.exam);
          setAudioUrlMap(parsed.audioUrls);
          setTimeLeft((apiExam.duration_minutes || 40) * 60);
        } else {
          // Dùng benchmark tương ứng nếu backend chưa có đủ câu hỏi
          const fallback =
            examId.includes("2") || examId.includes("02")
              ? DEFAULT_LISTENING_TEST_2
              : DEFAULT_LISTENING_TEST;
          setExamData(fallback);
        }
      } catch (err) {
        console.warn("Using offline benchmark listening exam:", err);
        const fallback =
          examId.includes("2") || examId.includes("02")
            ? DEFAULT_LISTENING_TEST_2
            : DEFAULT_LISTENING_TEST;
        setExamData(fallback);
      } finally {
        setLoading(false);
      }
    }
    if (examId) load();
  }, [examId]);

  function extractTranscriptFromExplanation(rawExp?: string, explicitTranscript?: string): string {
    if (explicitTranscript && explicitTranscript.trim()) return explicitTranscript.trim();
    if (!rawExp) return "";
    if (rawExp.includes("--- GIẢI THÍCH ĐÁP ÁN ---")) {
      return rawExp.split("--- GIẢI THÍCH ĐÁP ÁN ---")[0].trim();
    }
    if (rawExp.length > 40 && !rawExp.toLowerCase().startsWith("đáp án chuẩn")) {
      return rawExp.trim();
    }
    return "";
  }

  // Trích xuất chủ đề (Topic) cho các phần Listening từ tiêu đề hoặc đề bài
  function extractListeningTopic(
    partTitle?: string,
    examTitle?: string,
    extraContent?: string,
    defaultTopic: string = "General Topic"
  ): string {
    const pTitle = (partTitle || "").trim();
    const eTitle = (examTitle || "").trim();
    const extra = (extraContent || "").trim();

    // 1. Dạng: Topic : ... trong tiêu đề part
    const pMatch = pTitle.match(/topic\s*[:\-–]\s*([^(\n\r<]+)/i);
    if (pMatch && pMatch[1].trim()) {
      return pMatch[1].trim().replace(/\s*-\s*(nam|nữ|nu|nam noi|nu noi|đề trộn|phiên bản|version).*$/i, "").trim();
    }

    // 2. Dạng: Topic : ... trong instructions hoặc passage_text hoặc explanation
    if (extra) {
      const extraMatch = extra.match(/topic\s*[:\-–]\s*([^(\n\r<]+)/i);
      if (extraMatch && extraMatch[1].trim()) {
        return extraMatch[1].trim().replace(/\s*-\s*(nam|nữ|nu|nam noi|nu noi|đề trộn|phiên bản|version).*$/i, "").trim();
      }
    }

    // 3. Dạng: Four people are talking about ... / discussing ... trong instructions
    if (extra) {
      const talkingMatch = extra.match(/(?:talking|discussing|speaking)\s+about\s+(?:their\s+|the\s+|how\s+)?([^.,\n\r<]+)/i);
      if (talkingMatch && talkingMatch[1].trim()) {
        const rawT = talkingMatch[1].trim();
        return rawT.replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }

    // 4. Dạng: Topic : ... trong tiêu đề exam
    const eMatch = eTitle.match(/topic\s*[:\-–]\s*([^(\n\r<]+)/i);
    if (eMatch && eMatch[1].trim()) {
      return eMatch[1].trim().replace(/\s*-\s*(nam|nữ|nu|nam noi|nu noi|đề trộn|phiên bản|version).*$/i, "").trim();
    }

    // 5. Tiêu đề exam cụ thể (ví dụ: "The Art", "Đề 14 - Doing exercise" -> "Doing exercise")
    // LOẠI TRỪ các chuỗi generic kiểu Full Listening / Full Test / 4 Parts / Aptis
    const isGenericExamTitle =
      /full\s*(listening|test|exam|part)/i.test(eTitle) ||
      /4\s*parts/i.test(eTitle) ||
      /kỳ\s*tích/i.test(eTitle) ||
      /aptis\s*esol/i.test(eTitle);

    if (eTitle && !isGenericExamTitle) {
      const cleanExam = eTitle.replace(/^Đề\s*\d+\s*[-:—–]*\s*/i, "").trim();
      if (cleanExam.length > 2 && !/full\s*listening/i.test(cleanExam)) return cleanExam;
    }

    // 6. Tiêu đề part sau dấu gạch nối (loại trừ các tên dạng kỹ thuật)
    const cleanPart = pTitle.replace(/^.*part\s*\d+\s*[-:—–]*\s*/i, "").trim();
    if (
      cleanPart &&
      !/matching/i.test(cleanPart) &&
      !/comprehension/i.test(cleanPart) &&
      !/monologue/i.test(cleanPart) &&
      !/information/i.test(cleanPart) &&
      !/opinion/i.test(cleanPart) &&
      !/recognition/i.test(cleanPart) &&
      !/part\s*\d+/i.test(cleanPart)
    ) {
      return cleanPart;
    }

    return defaultTopic;
  }

  // Tự động phân tích các Speaker và Options từ explanation khi đề chỉ có 1 câu hỏi tổng hợp
  function parseP2FromExplanation(explanation?: string): {
    speakers: Array<{ speaker: string; correctAnswer: string; explanation: string }>;
    options: string[];
  } {
    if (!explanation) return { speakers: [], options: [] };
    const speakerMap: Record<string, string> = {};
    let distractors: string[] = [];

    // Tìm dạng A = ..., B = ..., C = ..., D = ...
    const expMatch = explanation.match(/A\s*[:=]\s*([^\n(]+)[\s\S]*?B\s*[:=]\s*([^\n(]+)[\s\S]*?C\s*[:=]\s*([^\n(]+)[\s\S]*?D\s*[:=]\s*([^\n(]+)/i);
    if (expMatch) {
      speakerMap["Speaker A"] = expMatch[1].trim().replace(/[.,;]$/, "");
      speakerMap["Speaker B"] = expMatch[2].trim().replace(/[.,;]$/, "");
      speakerMap["Speaker C"] = expMatch[3].trim().replace(/[.,;]$/, "");
      speakerMap["Speaker D"] = expMatch[4].trim().replace(/[.,;]$/, "");
    }

    const distractorMatch = explanation.match(/nhiễu\s*[:=]\s*([^\n.]+)/i);
    if (distractorMatch) {
      distractors = distractorMatch[1].split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    }

    const speakers = ["Speaker A", "Speaker B", "Speaker C", "Speaker D"].map((spk) => ({
      speaker: spk,
      correctAnswer: speakerMap[spk] || "",
      explanation: `Giải thích đáp án cho ${spk}`,
    }));

    const allOpts = Array.from(new Set([...Object.values(speakerMap), ...distractors])).filter(Boolean);
    return { speakers, options: allOpts };
  }

  // Parser dữ liệu từ Backend sang format hiển thị của Listening
  function parseApiToListeningData(apiData: any) {
    const parts = apiData.parts || [];
    const isSinglePart = parts.length === 1;

    const result = {
      title: apiData.title || "Bài thi Listening",
      durationMinutes: apiData.duration_minutes || (isSinglePart ? 15 : 40),
      part1: [] as any[],
      part2: {
        topic: "Workplace & Daily Life",
        instructions: "Four employees share their views. Match each speaker to their statement.",
        options: [] as string[],
        speakers: [] as any[],
        passageText: "",
        translationText: "",
        audioUrl: "",
      },
      part3: {
        topic: "Discussion & Opinions",
        instructions: "Who expresses which opinion? Select Man, Woman, or Both.",
        passageText: "",
        translationText: "",
        opinions: [] as any[],
        audioUrl: "",
      },
      part4: [] as any[],
    };

    const audioUrls: Record<number, string> = {};

    parts.forEach((p: any) => {
      const pTitle = (p.title || "").toLowerCase();
      const pNum = p.part_number;
      const questions = p.questions || [];

      // Phân định chính xác Part: Ưu tiên nhận diện từ title/part trước khi dùng pNum
      let detectedPart = pNum;
      if (pTitle.includes("part 2") || pTitle.includes("information matching") || pTitle.includes("speaker")) {
        detectedPart = 2;
      } else if (pTitle.includes("part 3") || pTitle.includes("opinion matching") || pTitle.includes("short conversation") || pTitle.includes("discussion")) {
        detectedPart = 3;
      } else if (pTitle.includes("part 4") || pTitle.includes("monologue") || pTitle.includes("recording")) {
        detectedPart = 4;
      } else if (pTitle.includes("part 1") || pTitle.includes("information recognition") || pTitle.includes("word recognition")) {
        detectedPart = 1;
      }

      // Part 1: Word Recognition
      if (detectedPart === 1) {
        if (questions.length > 0) {
          result.part1 = questions.map((q: any, idx: number) => {
            let opts: string[] = ["A", "B", "C"];
            if (Array.isArray(q.options)) opts = q.options;
            else if (typeof q.options === "string") {
              try {
                opts = JSON.parse(q.options);
              } catch {
                opts = ["A", "B", "C"];
              }
            }
            const rawAudio = q.audio_url || q.audioUrl || q.file || p.audio_url || "";
            const resolvedAudio = rawAudio && !rawAudio.startsWith("http") && !rawAudio.startsWith("/")
              ? `/uploads/audio/listening/${rawAudio}`
              : rawAudio;
            if (resolvedAudio) audioUrls[idx] = resolvedAudio;
            const qTranscript = extractTranscriptFromExplanation(
              q.explanation,
              q.transcript || q.suggestion || q.passage_text
            );
            return {
              id: q.id,
              num: q.question_number || idx + 1,
              prompt: q.prompt,
              options: opts,
              correctAnswer: q.correct_answer || opts[0] || "",
              explanation: q.explanation || "Đáp án chuẩn theo đoạn ghi âm đối thoại.",
              audioUrl: resolvedAudio,
              transcript: qTranscript,
            };
          });
        }
      }

      // Part 2: Speakers matching
      if (detectedPart === 2) {
        let p2Topic = extractListeningTopic(p.title, apiData.title, p.instructions || p.passage_text, "");
        if (!p2Topic || /full\s*listening/i.test(p2Topic)) {
          const allP2Text = [
            p.instructions,
            p.passage_text,
            ...questions.map((q: any) => q.explanation || ""),
            ...questions.map((q: any) => q.prompt || ""),
          ].join(" ");

          if (/talking\s+about\s+(?:their\s+|the\s+)?([^.,\n\r<]+)/i.test(allP2Text)) {
            const m = allP2Text.match(/talking\s+about\s+(?:their\s+|the\s+)?([^.,\n\r<]+)/i);
            if (m && m[1]) p2Topic = m[1].trim().replace(/\b\w/g, (c) => c.toUpperCase());
          } else if (/exercise|bike|running|walking|horse|sport/i.test(allP2Text)) {
            p2Topic = "Exercise Preferences & Sports";
          } else if (/job|career|work|office|company|commute/i.test(allP2Text)) {
            p2Topic = "Work & Career Preferences";
          } else if (/holiday|vacation|travel|trip|tourist/i.test(allP2Text)) {
            p2Topic = "Holiday & Travel Experiences";
          } else if (/book|reading|library|novel|author/i.test(allP2Text)) {
            p2Topic = "Reading Habits & Literature";
          } else if (/film|movie|cinema|television|tv/i.test(allP2Text)) {
            p2Topic = "Film & Entertainment";
          } else {
            p2Topic = "Workplace & Daily Life";
          }
        }
        result.part2.topic = p2Topic;

        const p2Candidate = questions.find((q: any) => q.explanation || q.transcript);
        const p2Script = extractTranscriptFromExplanation(
          p2Candidate?.explanation,
          p.passage_text || p.transcript || p2Candidate?.transcript || p.suggestion
        );
        if (p2Script) {
          (result.part2 as any).passageText = p2Script;
          (result.part2 as any).transcript = p2Script;
        }
        if (p.translation_text || p.passage_translation) (result.part2 as any).translationText = p.translation_text || p.passage_translation;
        const p2RawAudio = p.audio_url || (p as any).file || "";
        const resolvedP2Audio = p2RawAudio && !p2RawAudio.startsWith("http") && !p2RawAudio.startsWith("/")
          ? `/uploads/audio/listening/${p2RawAudio}`
          : p2RawAudio;
        if (resolvedP2Audio) {
          (result.part2 as any).audioUrl = resolvedP2Audio;
          audioUrls[13] = resolvedP2Audio;
        }

        // Trường hợp 1 câu hỏi tổng hợp
        if (questions.length === 1 && (!questions[0]?.options || questions[0]?.options.length === 0)) {
          const parsedFromExp = parseP2FromExplanation(questions[0]?.explanation || p.passage_text || "");
          if (parsedFromExp.speakers.length > 0) {
            result.part2.speakers = parsedFromExp.speakers;
            result.part2.options = parsedFromExp.options;
          }
        } else if (questions.length > 0) {
          let extractedOptions: string[] = [];
          for (const q of questions) {
            let qOpts: string[] = [];
            if (Array.isArray(q.options)) qOpts = q.options;
            else if (typeof q.options === "string") {
              try { qOpts = JSON.parse(q.options); } catch {}
            }
            if (qOpts.length > 0) {
              extractedOptions = Array.from(new Set([...extractedOptions, ...qOpts]));
            }
          }
          extractedOptions = extractedOptions
            .map((o) => o.trim())
            .filter((o) => o && !/sẽ có thêm|gây nhiễu|đáp án nhiễu/i.test(o) && !/^[0-9a-f-]{30,}$/i.test(o));

          // Thu thập toàn bộ văn bản từ explanation, suggestion, passage_text, instructions, title để bóc tách đáp án
          const allSourceText = [
            ...questions.map((q: any) => q.explanation || ""),
            p.suggestion || "",
            p.passage_text || "",
            p.instructions || "",
            p.title || "",
          ].join("\n");

          const cleanText = allSourceText
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/p>/gi, "\n")
            .replace(/<[^>]*>/g, " ")
            .replace(/&nbsp;/gi, " ");

          const explAnswerMap: Record<string, string> = {};

          // Dạng A: / A. / A - / Speaker A:
          const letterMatches = cleanText.matchAll(/(?:Speaker\s*)?([A-D])\s*[:.\-=–]\s*([^\n\r]+)/gi);
          for (const m of letterMatches) {
            const letter = m[1].toUpperCase();
            const val = m[2].trim().replace(/^["']|["']$/g, "").replace(/[.,;]$/, "").trim();
            if (val && !/topic|version|phiên bản|đáp án/i.test(val) && !explAnswerMap[letter]) {
              explAnswerMap[letter] = val;
            }
          }

          // Dạng 1. / 2. / 3. / 4.
          const numMatches = cleanText.matchAll(/(?:^|\n)\s*([1-4])\s*[:.\-=–]\s*([^\n\r]+)/gi);
          const numToLetter: Record<string, string> = { "1": "A", "2": "B", "3": "C", "4": "D" };
          for (const m of numMatches) {
            const letter = numToLetter[m[1]];
            const val = m[2].trim().replace(/^["']|["']$/g, "").replace(/[.,;]$/, "").trim();
            if (val && !explAnswerMap[letter]) {
              explAnswerMap[letter] = val;
            }
          }

          // Khớp với extractedOptions để chuẩn hóa chính xác hoa/thường và khoảng trắng
          for (const [letter, val] of Object.entries(explAnswerMap)) {
            const matchedOpt = extractedOptions.find(
              (o) =>
                o.toLowerCase().trim() === val.toLowerCase().trim() ||
                o.toLowerCase().includes(val.toLowerCase()) ||
                val.toLowerCase().includes(o.toLowerCase())
            );
            if (matchedOpt) {
              explAnswerMap[letter] = matchedOpt;
            }
          }

          const spkList = questions.map((q: any, idx: number) => {
            const letter = String.fromCharCode(65 + idx);
            let ans = (q.correct_answer || "").trim();

            if (/^\d+$/.test(ans)) {
              const num = Number(ans);
              if (extractedOptions[num]) ans = extractedOptions[num];
            } else if (ans.length > 20 || /^[0-9a-f-]{30,}$/i.test(ans) || !ans) {
              if (explAnswerMap[letter]) ans = explAnswerMap[letter];
              else if (extractedOptions[idx]) ans = extractedOptions[idx];
            }

            return {
              id: q.id,
              speaker: q.prompt && isNaN(Number(q.prompt)) && !q.prompt.startsWith("<p>") ? q.prompt : `Speaker ${letter}`,
              correctAnswer: ans,
              explanation: q.explanation || `Giải thích đáp án cho Speaker ${letter}`,
              transcript: q.transcript || p2Script || "",
            };
          });

          result.part2.speakers = spkList;
          const finalOptions = Array.from(
            new Set([
              ...extractedOptions,
              ...Object.values(explAnswerMap),
              ...spkList.map((s: any) => s.correctAnswer),
            ])
          ).filter((o) => o && !/^[0-9a-f-]{30,}$/i.test(o) && !/sẽ có thêm|gây nhiễu/i.test(o));

          result.part2.options = finalOptions.length >= 4 ? finalOptions : (result.part2.options || finalOptions);
          if (p.instructions) result.part2.instructions = p.instructions;
        }
      }

      // Part 3: Opinion discussion
      if (detectedPart === 3) {
        let p3Topic = extractListeningTopic(p.title, apiData.title, p.instructions || p.passage_text, "");
        if (!p3Topic || /full\s*listening/i.test(p3Topic)) {
          const allP3Text = [
            p.instructions,
            p.passage_text,
            ...questions.map((q: any) => q.prompt || ""),
            ...questions.map((q: any) => q.explanation || ""),
          ].join(" ");
          if (/internet|online|screen|technology|social\s*media|digital/i.test(allP3Text)) {
            p3Topic = "The Internet & Digital Life";
          } else if (/environment|pollution|climate|recycle|nature/i.test(allP3Text)) {
            p3Topic = "Environmental Protection & Society";
          } else if (/education|school|study|learning|university|student/i.test(allP3Text)) {
            p3Topic = "Education & Learning Methods";
          } else if (/shopping|online\s*shopping|retail|consumer/i.test(allP3Text)) {
            p3Topic = "Consumer Habits & Shopping";
          } else {
            p3Topic = "Discussion & Opinions";
          }
        }
        result.part3.topic = p3Topic;

        const p3Candidate = questions.find((q: any) => q.explanation || q.transcript);
        const p3Script = extractTranscriptFromExplanation(
          p3Candidate?.explanation,
          p.passage_text || p.transcript || p3Candidate?.transcript || p.suggestion
        );
        if (p3Script) {
          (result.part3 as any).passageText = p3Script;
          (result.part3 as any).transcript = p3Script;
        }
        if (p.translation_text || p.passage_translation) (result.part3 as any).translationText = p.translation_text || p.passage_translation;
        const p3RawAudio = p.audio_url || (p as any).file || "";
        const resolvedP3Audio = p3RawAudio && !p3RawAudio.startsWith("http") && !p3RawAudio.startsWith("/")
          ? `/uploads/audio/listening/${p3RawAudio}`
          : p3RawAudio;
        if (resolvedP3Audio) {
          (result.part3 as any).audioUrl = resolvedP3Audio;
          audioUrls[14] = resolvedP3Audio;
        }
        if (questions.length > 0) {
          const opList = questions.map((q: any) => {
            let cor: "Man" | "Woman" | "Both" = "Both";
            const corStr = String(q.correct_answer || "").toLowerCase();
            if (corStr.includes("man") && !corStr.includes("woman")) cor = "Man";
            else if (corStr.includes("woman")) cor = "Woman";
            return {
              id: q.id,
              statement: q.prompt,
              correctAnswer: cor,
              explanation: q.explanation || "",
              transcript: q.transcript || p3Script || "",
            };
          });
          result.part3.opinions = opList;
          if (p.instructions) result.part3.instructions = p.instructions;
        }
      }

      // Part 4: Monologues
      if (detectedPart === 4) {
        let p4BaseTopic = extractListeningTopic(p.title, apiData.title, p.instructions || p.passage_text, "");
        if (!p4BaseTopic || /full\s*listening/i.test(p4BaseTopic)) {
          p4BaseTopic = "Academic & Cultural Talks";
        }

        if (questions.length > 0) {
          const qList = questions.map((q: any) => {
            let opts: string[] = [];
            if (Array.isArray(q.options)) opts = q.options;
            else if (typeof q.options === "string") {
              try {
                opts = JSON.parse(q.options);
              } catch {
                opts = ["A", "B", "C"];
              }
            }
            return {
              id: q.id,
              prompt: q.prompt,
              options: opts,
              correctAnswer: q.correct_answer || opts[0] || "",
              explanation: q.explanation || "",
              transcript: q.transcript || "",
            };
          });

          const recordings: any[] = [];
          if (qList.length > 2) {
            const p4RawAudio = p.audio_url || (p as any).file || "";
            const resolvedP4Audio = p4RawAudio && !p4RawAudio.startsWith("http") && !p4RawAudio.startsWith("/")
              ? `/uploads/audio/listening/${p4RawAudio}`
              : p4RawAudio;
            const q1Candidate = questions.slice(0, 2).find((q: any) => q.explanation || q.transcript);
            const q2Candidate = questions.slice(2, 4).find((q: any) => q.explanation || q.transcript);
            const p4Script1 = extractTranscriptFromExplanation(
              q1Candidate?.explanation,
              p.passage_text || p.transcript || q1Candidate?.transcript || p.suggestion
            );
            const p4Script2 = extractTranscriptFromExplanation(
              q2Candidate?.explanation,
              p.passage_text || p.transcript || q2Candidate?.transcript || p.suggestion
            );
            recordings.push({
              recNum: 1,
              title: `${p4BaseTopic} (Recording 1/2)`,
              passageText: p4Script1,
              transcript: p4Script1,
              translationText: p.translation_text || p.passage_translation || "",
              audioUrl: resolvedP4Audio,
              questions: qList.slice(0, 2),
            });
            recordings.push({
              recNum: 2,
              title: `${p4BaseTopic} (Recording 2/2)`,
              passageText: p4Script2 || p4Script1,
              transcript: p4Script2 || p4Script1,
              translationText: p.translation_text || p.passage_translation || "",
              audioUrl: resolvedP4Audio,
              questions: qList.slice(2, 4),
            });
            if (resolvedP4Audio) {
              audioUrls[15] = resolvedP4Audio;
              audioUrls[16] = resolvedP4Audio;
            }
          } else {
            recordings.push({
              recNum: 1,
              title: `${p4BaseTopic} (Recording 1)`,
              passageText: p.passage_text || "",
              transcript: p.transcript || p.passage_text || "",
              translationText: p.translation_text || p.passage_translation || "",
              audioUrl: p.audio_url || "",
              questions: qList,
            });
            if (p.audio_url) audioUrls[15] = p.audio_url;
          }
          result.part4 = recordings;
        }
      }
    });

    return { exam: result, audioUrls };
  }

  // Timer đếm ngược thời gian phòng thi
  useEffect(() => {
    if (loading || isPaused || isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, isPaused, isSubmitted]);

  // Lấy nội dung văn bản kịch bản cho stage hiện tại (phục vụ SpeechSynthesis khi không có file âm thanh tĩnh)
  const getCurrentStageScript = () => {
    if (!currentStage) return "";
    if (currentStage.partNum === 1) {
      const q = examData.part1[currentStage.subIndex];
      return q?.transcript || "";
    } else if (currentStage.partNum === 2) {
      return (
        (examData.part2 as any).transcript ||
        (examData.part2 as any).passageText ||
        ""
      );
    } else if (currentStage.partNum === 3) {
      return (
        (examData.part3 as any).transcript ||
        (examData.part3 as any).passageText ||
        ""
      );
    } else if (currentStage.partNum === 4) {
      const rec = examData.part4[currentStage.subIndex];
      return (rec as any)?.transcript || rec?.passageText || "";
    }
    return "";
  };

  // Reset audio state khi chuyển câu hỏi
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setPlaybackProgress(0);
  }, [activeStage]);

  // Trình phát âm thanh tích hợp: Ưu tiên phát file Audio -> Fallback SpeechSynthesis chuẩn giọng Anh-Mỹ
  const togglePlayAudio = () => {
    const currentCount = playCounts[activeStage] || 0;
    if (currentCount >= 2 && !isPlaying) {
      alert("Bạn đã nghe tối đa 2 lần cho đoạn ghi âm này theo quy chế khảo thí Aptis!");
      return;
    }

    if (isPlaying) {
      // Dừng âm thanh
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    const playSpeechFallback = (count: number) => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const scriptText = getCurrentStageScript();
        if (!scriptText) {
          setIsPlaying(false);
          return;
        }

        // ĐỐI VỚI PART 3: PHÁT 2 GIỌNG ĐỐI THOẠI (NAM & NỮ)
        if (currentStage?.partNum === 3) {
          const rawLines = scriptText
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/p>/gi, "\n")
            .replace(/<[^>]*>/g, "")
            .replace(/&nbsp;/gi, " ")
            .split(/\n+/)
            .map((l: string) => l.trim())
            .filter(Boolean);

          const voices = window.speechSynthesis.getVoices();
          const maleVoice =
            voices.find((v) => v.lang.startsWith("en") && /male|david|george|ryan|james|guy|daniel/i.test(v.name)) ||
            voices.find((v) => v.lang.startsWith("en"));
          const femaleVoice =
            voices.find((v) => v.lang.startsWith("en") && /female|zira|susan|sonia|jenny|victoria|catherine|karen/i.test(v.name)) ||
            voices.find((v) => v.lang.startsWith("en") && v !== maleVoice);

          let currentIdx = 0;
          setIsPlaying(true);
          setPlayCounts((prev) => ({ ...prev, [activeStage]: count + 1 }));

          const playNextDialogueLine = () => {
            if (currentIdx >= rawLines.length) {
              setIsPlaying(false);
              setPlaybackProgress(100);
              return;
            }
            const line = rawLines[currentIdx];
            const isFemale =
              /^woman\s*[:.\-]/i.test(line) ||
              /^[wW]\s*[:.\-]/i.test(line) ||
              /^nữ\s*[:.\-]/i.test(line) ||
              (!/^(man|m|nam)\s*[:.\-]/i.test(line) && currentIdx % 2 === 1);

            const cleanLine = line.replace(/^(man|woman|narrator|m|w|nam|nữ)\s*[:.\-]\s*/i, "").trim();

            const utt = new SpeechSynthesisUtterance(cleanLine || line);
            utt.lang = "en-GB";
            utt.rate = playbackSpeed;
            if (isFemale) {
              if (femaleVoice) utt.voice = femaleVoice;
              utt.pitch = 1.3; // Giọng Nữ cao, thanh thoát
            } else {
              if (maleVoice) utt.voice = maleVoice;
              utt.pitch = 0.8; // Giọng Nam trầm, ấm
            }

            utt.onend = () => {
              currentIdx++;
              setPlaybackProgress(Math.min(100, Math.round((currentIdx / rawLines.length) * 100)));
              playNextDialogueLine();
            };
            utt.onerror = () => {
              setIsPlaying(false);
            };

            window.speechSynthesis.speak(utt);
          };

          playNextDialogueLine();
          return;
        }

        // CÁC PART KHÁC (1, 2, 4): Phát thông thường
        const utterance = new SpeechSynthesisUtterance(scriptText);
        utterance.lang = "en-GB"; // Chuẩn giọng Anh British Council
        utterance.rate = playbackSpeed;

        const estDurationSec = Math.max(8, scriptText.split(" ").length / 2.5);
        let elapsed = 0;

        utterance.onstart = () => {
          setIsPlaying(true);
          setPlayCounts((prev) => ({ ...prev, [activeStage]: count + 1 }));
        };

        const progressTimer = setInterval(() => {
          elapsed += 0.5;
          const pct = Math.min(100, Math.round((elapsed / estDurationSec) * 100));
          setPlaybackProgress(pct);
          if (pct >= 100) clearInterval(progressTimer);
        }, 500);

        utterance.onend = () => {
          setIsPlaying(false);
          setPlaybackProgress(100);
          clearInterval(progressTimer);
        };

        utterance.onerror = () => {
          setIsPlaying(false);
          clearInterval(progressTimer);
        };

        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlaying(true);
        setPlayCounts((prev) => ({ ...prev, [activeStage]: count + 1 }));
      }
    };

    // Bắt đầu phát âm thanh
    const targetAudioSrc = currentStage?.audioUrl || audioUrlMap[activeStage];

    if (targetAudioSrc && audioRef.current) {
      audioRef.current.src = targetAudioSrc;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setPlayCounts((prev) => ({ ...prev, [activeStage]: currentCount + 1 }));
        })
        .catch((err) => {
          console.warn("Audio file playback error, falling back to Web Speech API:", err);
          playSpeechFallback(currentCount);
        });
      return;
    }

    // Nếu không có file audio: Dùng giọng nói tiếng Anh trình duyệt (SpeechSynthesis)
    playSpeechFallback(currentCount);
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackSpeed(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `00:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // TÍNH ĐIỂM CHUẨN DỰA TRÊN SỐ CÂU HỎI THỰC TẾ
  const calculateResults = () => {
    let p1Correct = 0;
    examData.part1.forEach((q, idx) => {
      if (p1Answers[idx] && p1Answers[idx].toLowerCase() === q.correctAnswer.toLowerCase()) p1Correct++;
    });

    let p2Correct = 0;
    examData.part2.speakers.forEach((s, idx) => {
      if (p2Answers[idx] && p2Answers[idx].toLowerCase() === s.correctAnswer.toLowerCase()) p2Correct++;
    });

    let p3Correct = 0;
    examData.part3.opinions.forEach((o, idx) => {
      if (p3Answers[idx] && p3Answers[idx].toLowerCase() === o.correctAnswer.toLowerCase()) p3Correct++;
    });

    let p4Correct = 0;
    examData.part4.forEach((rec, recIdx) => {
      rec.questions.forEach((q, qIdx) => {
        if (p4Answers[`${recIdx}_${qIdx}`] && p4Answers[`${recIdx}_${qIdx}`].toLowerCase() === q.correctAnswer.toLowerCase()) {
          p4Correct++;
        }
      });
    });

    const totalQuestionsInExam =
      examData.part1.length +
      examData.part2.speakers.length +
      examData.part3.opinions.length +
      examData.part4.reduce((sum, r) => sum + r.questions.length, 0);

    const totalCorrect = p1Correct + p2Correct + p3Correct + p4Correct;
    const isFullListeningTest = totalQuestionsInExam >= 20;

    const totalScore = isFullListeningTest
      ? totalCorrect * 2
      : totalQuestionsInExam > 0
      ? Math.round((totalCorrect / totalQuestionsInExam) * 50)
      : 0;

    let cefr = "A0";
    if (totalScore >= 46) cefr = "C";
    else if (totalScore >= 38) cefr = "B2";
    else if (totalScore >= 28) cefr = "B1";
    else if (totalScore >= 18) cefr = "A2";
    else if (totalScore >= 10) cefr = "A1";

    return {
      p1Correct,
      p1Score: isFullListeningTest ? p1Correct * 2 : examData.part1.length > 0 ? Math.round((p1Correct / examData.part1.length) * 50) : 0,
      p2Correct,
      p2Score: isFullListeningTest ? p2Correct * 2 : examData.part2.speakers.length > 0 ? Math.round((p2Correct / examData.part2.speakers.length) * 50) : 0,
      p3Correct,
      p3Score: isFullListeningTest ? p3Correct * 2 : examData.part3.opinions.length > 0 ? Math.round((p3Correct / examData.part3.opinions.length) * 50) : 0,
      p4Correct,
      p4Score: isFullListeningTest ? p4Correct * 2 : Math.round((p4Correct / Math.max(1, examData.part4.reduce((s, r) => s + r.questions.length, 0))) * 50),
      totalCorrect,
      totalScore,
      totalQuestionsInExam,
      cefr,
    };
  };

  const results = calculateResults();

  // Nộp bài thi và đồng bộ kết quả lên Database
  const handleFinalSubmit = async () => {
    setIsSubmitted(true);
    let subId = submissionId;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") || localStorage.getItem("token")
        : null;
    if (!token) return;

    try {
      if (!subId) {
        const startRes = await api.submissions.start(examId);
        if (startRes.success && startRes.data) {
          subId = startRes.data.submissionId || startRes.data.id;
          setSubmissionId(subId);
        }
      }

      if (subId) {
        const answersPayload: any[] = [];
        // Part 1
        examData.part1.forEach((q: any, idx: number) => {
          if (q.id && p1Answers[idx]) {
            answersPayload.push({
              questionId: String(q.id),
              selectedOption: p1Answers[idx],
            });
          }
        });
        // Part 2
        examData.part2.speakers.forEach((s: any, idx: number) => {
          if (s.id && p2Answers[idx]) {
            answersPayload.push({
              questionId: String(s.id),
              selectedOption: p2Answers[idx],
            });
          }
        });
        // Part 3
        examData.part3.opinions.forEach((o: any, idx: number) => {
          if (o.id && p3Answers[idx]) {
            answersPayload.push({
              questionId: String(o.id),
              selectedOption: p3Answers[idx],
            });
          }
        });
        // Part 4
        examData.part4.forEach((rec: any, recIdx: number) => {
          rec.questions.forEach((q: any, qIdx: number) => {
            const ansKey = `${recIdx}_${qIdx}`;
            if (q.id && p4Answers[ansKey]) {
              answersPayload.push({
                questionId: String(q.id),
                selectedOption: p4Answers[ansKey],
              });
            }
          });
        });

        if (answersPayload.length > 0) {
          await api.submissions.autosave(subId, answersPayload);
        }
        await api.submissions.submit(subId);
      }
    } catch (err) {
      console.warn("Submit listening error:", err);
    }
  };

  // Xác định Part hiện tại theo currentStage
  const getStageMeta = () => {
    if (!currentStage) {
      return { partName: "Listening Practice", subTitle: "Question 1", isLast: true };
    }
    const isLast = activeStage === listeningStages.length - 1;
    if (currentStage.partNum === 1) {
      return {
        partName: "Part 1 – Word Recognition",
        subTitle: `Question ${currentStage.subIndex + 1} of ${examData.part1.length}`,
        isLast,
      };
    } else if (currentStage.partNum === 2) {
      return {
        partName: "Part 2 – Matching Information",
        subTitle: `Topic: ${examData.part2.topic || "Matching 4 Speakers"}`,
        isLast,
      };
    } else if (currentStage.partNum === 3) {
      return {
        partName: "Part 3 – Short Conversations",
        subTitle: `Topic: ${examData.part3.topic || "Opinion Discussion"}`,
        isLast,
      };
    } else {
      const rec = examData.part4[currentStage.subIndex];
      return {
        partName: "Part 4 – Monologues",
        subTitle: rec?.title ? `Topic: ${rec.title}` : `Recording ${currentStage.subIndex + 1} of ${Math.max(1, examData.part4.length)}`,
        isLast,
      };
    }
  };

  const currentMeta = getStageMeta();

  // =========================================================================
  // MÀN HÌNH KẾT QUẢ LISTENING (CHUẨN ẢNH 5 THEO DESIGN SYSTEM CỦA MÌNH)
  // =========================================================================
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
        {/* Header Bar */}
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                Listening Test
              </span>
              <span className="text-sm font-bold text-foreground">
                Kết quả bài thi Listening
              </span>
            </div>
          </div>
          <Link
            href="/listening"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Thoát</span>
          </Link>
        </header>

        {/* Content Container */}
        <main className="flex-1 py-8 px-4">
          <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in">
            {/* Card 1: Tổng quan Điểm số */}
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm text-center space-y-6">
              <h2 className="font-heading font-extrabold text-xl text-foreground">
                Kết quả Listening
              </h2>

              <div className="grid grid-cols-3 gap-3 divide-x divide-border/60 py-2">
                <div>
                  <div className="text-2xl md:text-3xl font-black text-primary font-mono">
                    {results.totalScore}/50
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Điểm</div>
                </div>

                <div>
                  <div className="text-2xl md:text-3xl font-black text-accent font-heading">
                    {results.cefr}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Trình độ</div>
                </div>

                <div>
                  <div className="text-2xl md:text-3xl font-black text-foreground font-mono">
                    {results.totalCorrect}/25
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Số câu đúng</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/listening"
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors"
                >
                  ← Thoát
                </Link>

                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem lại từng câu →</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setP1Answers({});
                    setP2Answers({});
                    setP3Answers({});
                    setP4Answers({});
                    setPlayCounts({});
                    setActiveStage(0);
                    setTimeLeft(40 * 60);
                    setIsSubmitted(false);
                  }}
                  className="tech-btn px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại</span>
                </button>
              </div>
            </div>

            {/* Card 2: Chi tiết bài làm theo 4 Part */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <h3 className="font-heading font-bold text-sm text-foreground pb-2 border-b border-border">
                Chi tiết bài làm
              </h3>

              <div className="space-y-3.5 text-xs md:text-sm">
                {/* Part 1 */}
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="font-medium text-foreground">
                    Part 1 – Word Recognition
                  </span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">
                      Số câu đúng: <strong className="text-foreground">{results.p1Correct}/13</strong>
                    </span>
                    <span className="font-mono font-bold text-primary">
                      Điểm: {results.p1Score}/26
                    </span>
                  </div>
                </div>

                {/* Part 2 */}
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="font-medium text-foreground">
                    Part 2 – Matching Information
                  </span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">
                      Số câu đúng: <strong className="text-foreground">{results.p2Correct}/4</strong>
                    </span>
                    <span className="font-mono font-bold text-primary">
                      Điểm: {results.p2Score}/8
                    </span>
                  </div>
                </div>

                {/* Part 3 */}
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="font-medium text-foreground">
                    Part 3 – Short Conversations
                  </span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">
                      Số câu đúng: <strong className="text-foreground">{results.p3Correct}/4</strong>
                    </span>
                    <span className="font-mono font-bold text-primary">
                      Điểm: {results.p3Score}/8
                    </span>
                  </div>
                </div>

                {/* Part 4 */}
                <div className="flex items-center justify-between py-1.5">
                  <span className="font-medium text-foreground">
                    Part 4 – Monologues
                  </span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">
                      Số câu đúng: <strong className="text-foreground">{results.p4Correct}/4</strong>
                    </span>
                    <span className="font-mono font-bold text-primary">
                      Điểm: {results.p4Score}/8
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // MÀN HÌNH LÀM BÀI PHÒNG THI LISTENING (THEO DESIGN SYSTEM CỦA MÌNH)
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans select-none">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/listening"
            className="w-9 h-9 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Listening Practice
            </span>
            <span className="text-sm md:text-base font-bold text-foreground">
              {currentMeta.partName}
            </span>
          </div>
        </div>

        {/* Căn giữa: Đồng hồ đếm ngược */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-sm">
          <Clock className="w-4 h-4" />
          <span>{formatTime(timeLeft)}</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/listening"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Thoát</span>
          </Link>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 py-6 px-3 md:px-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Card Context & Header Banner */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    {currentMeta.partName.split("–")[0].trim()}
                  </span>
                  <h2 className="font-heading font-bold text-base md:text-lg text-foreground">
                    {currentMeta.subTitle}
                  </h2>
                </div>
                <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans pt-1">
                  {currentStage.partNum === 1
                    ? "Listen to the short recording and answer the question. You can listen twice."
                    : currentStage.partNum === 2
                    ? `Topic: ${examData.part2.topic}. ${examData.part2.instructions || "Match each speaker to their statement."}`
                    : currentStage.partNum === 3
                    ? `Topic: ${examData.part3.topic}. ${examData.part3.instructions || "Who expresses which opinion? Select Man, Woman, or Both."}`
                    : `Topic: ${examData.part4[currentStage.subIndex]?.title || "Monologue"}. Listen to the recording and answer the questions.`}
                </p>
              </div>

              {/* Bookmark, Pause, Timer */}
              <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                <button
                  type="button"
                  className="flex items-center gap-1 px-3 py-1 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted font-medium transition-colors"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Bookmark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-1.5 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors"
                  title={isPaused ? "Tiếp tục" : "Tạm dừng"}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Trình phát Audio chuẩn có hỗ trợ âm thanh thật, chỉnh tốc độ & Speech fallback */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col sm:flex-row items-center gap-4">
              <audio
                ref={audioRef}
                preload="metadata"
                onEnded={() => {
                  setIsPlaying(false);
                  setPlaybackProgress(100);
                }}
                onTimeUpdate={() => {
                  if (audioRef.current && audioRef.current.duration > 0) {
                    const pct = Math.round((audioRef.current.currentTime / audioRef.current.duration) * 100);
                    setPlaybackProgress(pct);
                  }
                }}
              />

              <button
                type="button"
                onClick={togglePlayAudio}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-glow shadow-md transition-all shrink-0"
                title={isPlaying ? "Dừng audio" : "Phát audio"}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <div className="flex-1 w-full space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      {isPlaying ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-primary animate-pulse" />
                          <span>Đang phát âm thanh...</span>
                        </>
                      ) : (
                        <>
                          <Headphones className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Sẵn sàng nghe</span>
                        </>
                      )}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                      {audioUrlMap[activeStage] ? "Audio HD" : "Audio British AI"}
                    </span>
                  </div>
                  <span>Đã nghe: <strong>{playCounts[activeStage] || 0}/2</strong> lần</span>
                </div>

                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full bg-primary rounded-full transition-all duration-300 ${
                      isPlaying ? "animate-pulse" : ""
                    }`}
                    style={{ width: `${playbackProgress}%` }}
                  />
                </div>
              </div>

              {/* Bộ chọn tốc độ phát âm thanh */}
              <div className="flex items-center gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 w-full sm:w-auto justify-end">
                <span className="text-[10px] text-muted-foreground mr-1 hidden sm:inline">Tốc độ:</span>
                {[0.75, 1, 1.25].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => handleSpeedChange(spd)}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                      playbackSpeed === spd
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Script & Bản dịch song song (ẩn mặc định, bật tắt tùy chọn) */}
            <div className="pt-3 border-t border-border/50">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowScript((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      showScript
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{showScript ? "Ẩn Audio Script" : "Xem Audio Script"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTranslation((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      showTranslation
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border"
                    }`}
                  >
                    <Languages className="w-3.5 h-3.5" />
                    <span>{showTranslation ? "Ẩn Bản Dịch TV" : "Xem Bản Dịch TV"}</span>
                  </button>
                </div>

                <span className="text-[11px] text-muted-foreground italic hidden sm:inline">
                  💡 Nên nghe và làm bài trước khi mở script để rèn phản xạ thi thật
                </span>
              </div>

              {/* Bảng hiển thị Song Song (2 cột desktop, cột đơn mobile) */}
              {(showScript || showTranslation) && (() => {
                const bilingual = getCurrentBilingualData();
                if (!bilingual) return null;
                return (
                  <div className="mt-3 p-4 rounded-xl border border-primary/20 bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/60 pb-1.5">
                      <span className="font-bold text-foreground">{bilingual.title}</span>
                      <span className="text-[10px]">Hiển thị song song hỗ trợ ôn luyện</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {showScript && (
                        <div className={!showTranslation ? "md:col-span-2" : ""}>
                          <div className="flex items-center gap-1.5 font-bold text-primary mb-1.5 text-[11px] uppercase tracking-wide">
                            <FileText className="w-3.5 h-3.5" />
                            <span>Script Ghi Âm (Tiếng Anh)</span>
                          </div>
                          <div className="p-3 rounded-lg bg-background border border-border text-foreground leading-relaxed whitespace-pre-line font-mono text-[11.5px] max-h-64 overflow-y-auto">
                            {bilingual.script || "Đang cập nhật script cho phần này."}
                          </div>
                        </div>
                      )}

                      {showTranslation && (
                        <div className={!showScript ? "md:col-span-2" : ""}>
                          <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 mb-1.5 text-[11px] uppercase tracking-wide">
                            <Languages className="w-3.5 h-3.5" />
                            <span>Bản Dịch Nghĩa (Tiếng Việt)</span>
                          </div>
                          <div className="p-3 rounded-lg bg-background border border-border text-foreground leading-relaxed whitespace-pre-line text-[11.5px] max-h-64 overflow-y-auto">
                            {bilingual.translation || "Bản dịch nghĩa đang được hoàn thiện."}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 3. PART CONTENT CHUẨN WITH SMOOTH TRANSITION */}
          <div key={`listening-stage-wrap-${activeStage}`} className="part-transition space-y-5">
          {/* =========================================================================
              PART 1: CÂU HỎI TRẮC NGHIỆM A, B, C
              ========================================================================= */}
          {currentStage.partNum === 1 && (() => {
            const q = examData.part1[currentStage.subIndex];
            if (!q) return null;
            return (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <h3 className="text-sm md:text-base font-medium text-foreground leading-relaxed">
                  {q.prompt}
                </h3>

                <div className="space-y-3">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = p1Answers[currentStage.subIndex] === opt;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() =>
                          setP1Answers((prev) => ({
                            ...prev,
                            [currentStage.subIndex]: opt,
                          }))
                        }
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                            : "border-border bg-background hover:border-primary/40 text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg border border-border flex items-center justify-center font-bold text-xs bg-muted/40">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="text-sm md:text-base font-normal">{opt}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* =========================================================================
              PART 2: SPEAKERS NỐI THÔNG TIN BẰNG DROPDOWN
              ========================================================================= */}
          {currentStage.partNum === 2 && examData.part2.speakers && examData.part2.speakers.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                    Topic
                  </span>
                  <h3 className="text-base font-bold text-foreground">
                    {examData.part2.topic || "Matching Information"}
                  </h3>
                </div>
                <span className="text-xs text-muted-foreground font-medium">Ghép thông tin tương ứng cho 4 người nói</span>
              </div>

              <div className="space-y-4">
                {examData.part2.speakers.map((spk, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <span className="font-bold text-sm text-primary w-28 shrink-0">
                      {spk.speaker}
                    </span>

                    <select
                      value={p2Answers[idx] || ""}
                      onChange={(e) =>
                        setP2Answers((prev) => ({
                          ...prev,
                          [idx]: e.target.value,
                        }))
                      }
                      className="flex-1 p-2.5 rounded-lg border border-input bg-card text-foreground text-xs md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans cursor-pointer"
                    >
                      <option value="">-- Chọn thông tin phù hợp --</option>
                      {(examData.part2.options || []).map((opt, oIdx) => (
                        <option key={oIdx} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              PART 3: NHẬN ĐỊNH CHỌN MAN / WOMAN / BOTH
              ========================================================================= */}
          {currentStage.partNum === 3 && examData.part3.opinions && examData.part3.opinions.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                    Topic
                  </span>
                  <h3 className="text-base font-bold text-foreground">
                    {examData.part3.topic || "Short Conversations & Opinions"}
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  🎙️ Đối thoại Man & Woman
                </span>
              </div>

              <h4 className="text-xs md:text-sm font-semibold text-muted-foreground">
                Xác định ai là người đưa ra từng quan điểm dưới đây:
              </h4>

              <div className="space-y-4">
                {examData.part3.opinions.map((op, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <span className="text-xs md:text-sm text-foreground flex-1 leading-relaxed">
                      {op.statement}
                    </span>

                    <select
                      value={p3Answers[idx] || ""}
                      onChange={(e) =>
                        setP3Answers((prev) => ({
                          ...prev,
                          [idx]: e.target.value as any,
                        }))
                      }
                      className="w-full sm:w-40 p-2.5 rounded-lg border border-input bg-card text-foreground text-xs md:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans cursor-pointer shrink-0"
                    >
                      <option value="">-- Chọn --</option>
                      <option value="Man">Man</option>
                      <option value="Woman">Woman</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              PART 4: RECORDINGS MONOLOGUES (CÂU HỎI TRẮC NGHIỆM)
              ========================================================================= */}
          {currentStage.partNum === 4 && (() => {
            const rec = examData.part4[currentStage.subIndex];
            if (!rec || !rec.questions) return null;
            const recIdx = currentStage.subIndex;
            return (
              <div className="space-y-6">
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                      Topic
                    </span>
                    <h3 className="text-sm md:text-base font-bold text-foreground">
                      {rec.title || `Monologue ${recIdx + 1}`}
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                    Recording {recIdx + 1} of {examData.part4.length}
                  </span>
                </div>
                {rec.questions.map((q, qIdx) => {
                  const answerKey = `${recIdx}_${qIdx}`;
                  const selected = p4Answers[answerKey];

                  return (
                    <div
                      key={qIdx}
                      className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4"
                    >
                      <h3 className="text-sm md:text-base font-semibold text-foreground leading-relaxed">
                        {q.prompt}
                      </h3>

                      <div className="space-y-3">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selected === opt;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() =>
                                setP4Answers((prev) => ({
                                  ...prev,
                                  [answerKey]: opt,
                                }))
                              }
                              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                                isSelected
                                  ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                                  : "border-border bg-background hover:border-primary/40 text-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-lg border border-border flex items-center justify-center font-bold text-xs bg-muted/40">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="text-xs md:text-sm font-normal">{opt}</span>
                              </div>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          </div>
        </div>
      </main>

      {/* 4. BOTTOM BAR CHUẨN */}
      <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border px-4 md:px-8 py-3 flex items-center justify-between z-40 shadow-lg">
        {/* Left: Hiện đáp án & Báo lỗi */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSampleAnswers(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 text-xs font-semibold transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Hiện đáp án</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowReportModal(true);
              setReportSent(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Báo lỗi</span>
          </button>
        </div>

        {/* Center: Quick Part Question Pills & Navigation Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Glass Dock bọc dãy câu hỏi */}
          <div className="bg-muted/40 dark:bg-slate-800/60 p-1 rounded-2xl border border-border/80 shadow-2xs flex items-center gap-1 backdrop-blur-sm">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scrollbar-none scroll-smooth max-w-[42vw] sm:max-w-[44vw] md:max-w-[50vw] lg:max-w-[56vw] py-0.5 px-0.5">
              {listeningStages
                .map((stage, idx) => ({ stage, idx }))
                .filter(({ stage }) => stage.partNum === currentStage.partNum)
                .map(({ stage, idx }) => {
                  const isCurrent = activeStage === idx;
                  let isAnswered = false;
                  if (stage.partNum === 1) {
                    isAnswered = !!p1Answers[stage.subIndex];
                  } else if (stage.partNum === 2) {
                    isAnswered = Object.keys(p2Answers).length > 0;
                  } else if (stage.partNum === 3) {
                    isAnswered = Object.keys(p3Answers).length > 0;
                  } else if (stage.partNum === 4) {
                    const part4KeyPrefix = `p4-${stage.subIndex}-`;
                    isAnswered = Object.keys(p4Answers).some((k) => k.startsWith(part4KeyPrefix));
                  }

                  return (
                    <button
                      key={stage.id}
                      id={`stage-pill-${idx}`}
                      type="button"
                      onClick={() => setActiveStage(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap select-none ${
                        isCurrent
                          ? "bg-primary text-primary-foreground font-black shadow-sm border border-primary"
                          : isAnswered
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/35 hover:bg-emerald-500/25"
                          : "bg-background/80 dark:bg-slate-900/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 hover:border-border"
                      }`}
                      title={stage.label}
                    >
                      {isAnswered && !isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      )}
                      <span>{stage.label}</span>
                    </button>
                  );
                })}
            </div>

            <div className="h-4 w-px bg-border/70 shrink-0 mx-0.5 hidden sm:block" />

            <button
              type="button"
              onClick={() => setShowDrawer(true)}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center bg-background/80 dark:bg-slate-900/60 hover:bg-primary/10 hover:text-primary text-muted-foreground border border-border/70 hover:border-primary/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs shrink-0"
              title="Danh sách tất cả câu hỏi"
              aria-label="Danh sách tất cả câu hỏi"
            >
              <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center bg-background/80 dark:bg-slate-900/60 hover:bg-primary/10 hover:text-primary text-muted-foreground border border-border/70 hover:border-primary/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs shrink-0 hidden sm:flex"
              title="Cuộn lên đầu trang"
              aria-label="Cuộn lên đầu trang"
            >
              <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Right: Previous & Next / Submit */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={activeStage === 0}
            onClick={() => setActiveStage((p) => Math.max(0, p - 1))}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted disabled:opacity-40 transition-colors"
          >
            ← Previous
          </button>

          {activeStage < listeningStages.length - 1 ? (
            <button
              type="button"
              onClick={() => setActiveStage((p) => Math.min(listeningStages.length - 1, p + 1))}
              className="tech-btn px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all flex items-center gap-1"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="tech-btn px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all"
            >
              Nộp bài
            </button>
          )}
        </div>
      </footer>

      {/* MODAL HIỆN ĐÁP ÁN */}
      {showSampleAnswers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Đáp án &amp; Giải thích</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSampleAnswers(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              {currentStage.partNum === 1 && examData.part1[currentStage.subIndex] && (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                  <div className="font-semibold text-foreground">
                    {examData.part1[currentStage.subIndex].prompt}
                  </div>
                  <div className="text-primary font-bold">
                    Đáp án đúng: {examData.part1[currentStage.subIndex].correctAnswer}
                  </div>
                  <div className="text-muted-foreground italic">
                    {examData.part1[currentStage.subIndex].explanation}
                  </div>
                </div>
              )}

              {currentStage.partNum === 2 &&
                examData.part2.speakers.map((s, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                    <div className="font-bold text-primary">{s.speaker}</div>
                    <div className="text-foreground font-medium">Đáp án: {s.correctAnswer}</div>
                    <div className="text-muted-foreground italic text-[11px]">{s.explanation}</div>
                  </div>
                ))}

              {currentStage.partNum === 3 &&
                examData.part3.opinions.map((op, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                    <div className="font-medium text-foreground">{op.statement}</div>
                    <div className="text-primary font-bold">Đáp án: {op.correctAnswer}</div>
                    <div className="text-muted-foreground italic text-[11px]">{op.explanation}</div>
                  </div>
                ))}

              {currentStage.partNum === 4 &&
                examData.part4[currentStage.subIndex]?.questions.map((q, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                    <div className="font-medium text-foreground">{q.prompt}</div>
                    <div className="text-primary font-bold">Đáp án: {q.correctAnswer}</div>
                    <div className="text-muted-foreground italic text-[11px]">{q.explanation}</div>
                  </div>
                ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSampleAnswers(false)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BÁO LỖI */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span>Báo lỗi câu hỏi Listening</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {reportSent ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-foreground">Cảm ơn bạn đã phản hồi!</p>
                <p className="text-[11px] text-muted-foreground">
                  Ban chuyên môn sẽ kiểm tra file âm thanh và đề thi trong thời gian sớm nhất.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-muted-foreground">Vui lòng chọn loại lỗi bạn gặp phải:</p>
                <div className="space-y-2">
                  {[
                    "Lỗi âm thanh hoặc audio không phát được",
                    "Lỗi đáp án hoặc giải thích chưa chuẩn",
                    "Lỗi nội dung / câu hỏi hiển thị",
                    "Khác",
                  ].map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="listeningReportType"
                        value={t}
                        checked={reportType === t}
                        onChange={() => setReportType(t)}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-foreground">{t}</span>
                    </label>
                  ))}
                </div>
                <textarea
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="Mô tả chi tiết vấn đề (tùy chọn)..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportSent(true)}
                    className="px-4 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90"
                  >
                    Gửi báo lỗi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DRAWER DANH SÁCH CÂU HỎI */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md p-5 rounded-2xl bg-card border border-border shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-heading font-bold text-xs uppercase text-muted-foreground tracking-wider">
                Danh sách bài tập Listening ({listeningStages.length} bài)
              </h3>
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bộ lọc Tab theo Part */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs border-b border-border/50">
              {[
                { id: "all", label: `Tất cả (${listeningStages.length})` },
                ...(listeningStages.some((s) => s.partNum === 1)
                  ? [{ id: "p1", label: `Part 1 (${listeningStages.filter((s) => s.partNum === 1).length})` }]
                  : []),
                ...(listeningStages.some((s) => s.partNum === 2)
                  ? [{ id: "p2", label: `Part 2 (${listeningStages.filter((s) => s.partNum === 2).length})` }]
                  : []),
                ...(listeningStages.some((s) => s.partNum === 3)
                  ? [{ id: "p3", label: `Part 3 (${listeningStages.filter((s) => s.partNum === 3).length})` }]
                  : []),
                ...(listeningStages.some((s) => s.partNum === 4)
                  ? [{ id: "p4", label: `Part 4 (${listeningStages.filter((s) => s.partNum === 4).length})` }]
                  : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDrawerTab(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                    drawerTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {/* Part 1 */}
              {(drawerTab === "all" || drawerTab === "p1") && listeningStages.some((s) => s.partNum === 1) && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-primary uppercase pt-1 flex items-center justify-between">
                    <span>Part 1 – Word Recognition ({listeningStages.filter((s) => s.partNum === 1).length} câu)</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {Object.keys(p1Answers).length}/{listeningStages.filter((s) => s.partNum === 1).length} đã làm
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {listeningStages
                      .map((stage, idx) => ({ stage, idx }))
                      .filter(({ stage }) => stage.partNum === 1)
                      .map(({ stage, idx }) => (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => {
                            setActiveStage(idx);
                            setShowDrawer(false);
                          }}
                          className={`p-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            activeStage === idx
                              ? "bg-primary text-primary-foreground"
                              : p1Answers[stage.subIndex]
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                              : "bg-muted/40 hover:bg-muted text-foreground"
                          }`}
                        >
                          Câu {stage.subIndex + 1}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Part 2 */}
              {(drawerTab === "all" || drawerTab === "p2") && listeningStages.some((s) => s.partNum === 2) && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-primary uppercase pt-2 flex items-center justify-between">
                    <span>Part 2 – Matching Info</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {Object.keys(p2Answers).length}/{examData.part2.speakers.length || 4} người nói
                    </span>
                  </div>
                  {listeningStages
                    .map((stage, idx) => ({ stage, idx }))
                    .filter(({ stage }) => stage.partNum === 2)
                    .map(({ stage, idx }) => (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => {
                          setActiveStage(idx);
                          setShowDrawer(false);
                        }}
                        className={`w-full p-2.5 rounded-lg text-xs font-bold text-left transition-colors cursor-pointer ${
                          activeStage === idx
                            ? "bg-primary text-primary-foreground"
                            : Object.keys(p2Answers).length === (examData.part2.speakers.length || 4)
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-muted/40 hover:bg-muted text-foreground"
                        }`}
                      >
                        {stage.label}: Matching Speakers
                      </button>
                    ))}
                </div>
              )}

              {/* Part 3 */}
              {(drawerTab === "all" || drawerTab === "p3") && listeningStages.some((s) => s.partNum === 3) && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-primary uppercase pt-2 flex items-center justify-between">
                    <span>Part 3 – Short Conversations</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {Object.keys(p3Answers).length}/{examData.part3.opinions.length || 4} quan điểm
                    </span>
                  </div>
                  {listeningStages
                    .map((stage, idx) => ({ stage, idx }))
                    .filter(({ stage }) => stage.partNum === 3)
                    .map(({ stage, idx }) => (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => {
                          setActiveStage(idx);
                          setShowDrawer(false);
                        }}
                        className={`w-full p-2.5 rounded-lg text-xs font-bold text-left transition-colors cursor-pointer ${
                          activeStage === idx
                            ? "bg-primary text-primary-foreground"
                            : Object.keys(p3Answers).length === (examData.part3.opinions.length || 4)
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-muted/40 hover:bg-muted text-foreground"
                        }`}
                      >
                        {stage.label}: Opinion Matching (Man / Woman / Both)
                      </button>
                    ))}
                </div>
              )}

              {/* Part 4 */}
              {(drawerTab === "all" || drawerTab === "p4") && listeningStages.some((s) => s.partNum === 4) && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-primary uppercase pt-2">
                    Part 4 – Monologues ({listeningStages.filter((s) => s.partNum === 4).length} bài thuyết trình)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {listeningStages
                      .map((stage, idx) => ({ stage, idx }))
                      .filter(({ stage }) => stage.partNum === 4)
                      .map(({ stage, idx }) => (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => {
                            setActiveStage(idx);
                            setShowDrawer(false);
                          }}
                          className={`p-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            activeStage === idx
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/40 hover:bg-muted text-foreground"
                          }`}
                        >
                          {stage.label}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ListeningExamRunner() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <ListeningExamRunnerContent />
    </Suspense>
  );
}
