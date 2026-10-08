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
} from "lucide-react";

// Định nghĩa dữ liệu 4 Parts chuẩn Aptis Listening
interface Part1Item {
  id?: string;
  num: number;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
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
}

// Dữ liệu mẫu chuẩn Đề 01 Listening Aptis Kỳ Tích
const DEFAULT_LISTENING_TEST = {
  title: "Đề 01 — Full Listening · 4 Parts",
  durationMinutes: 40,
  part1: [
    {
      num: 1,
      prompt: "A person calls a friend about his new car. How much does the small car cost him?",
      options: ["3250 pounds", "3550 pounds", "4250 pounds"],
      correctAnswer: "3250 pounds",
      explanation: "The speaker states clearly that the small car was purchased for 3250 pounds.",
    },
    {
      num: 2,
      prompt: "Listen to a woman talking about her holiday. Where is she going?",
      options: ["To the mountains", "To the seaside", "To an ancient city"],
      correctAnswer: "To the seaside",
      explanation: "She mentions relaxing on the sunny coast and swimming in the sea.",
    },
    {
      num: 3,
      prompt: "A man is ordering food at a cafe. What beverage does he order?",
      options: ["Iced Americano", "Hot green tea", "Fresh orange juice"],
      correctAnswer: "Iced Americano",
      explanation: "He asks for a large cup of iced Americano with no sugar.",
    },
    {
      num: 4,
      prompt: "Listen to the airport announcement. Which gate should passengers for Flight BA204 go to?",
      options: ["Gate 12B", "Gate 14A", "Gate 24C"],
      correctAnswer: "Gate 14A",
      explanation: "The announcer directs BA204 passengers immediately to Gate 14A.",
    },
    {
      num: 5,
      prompt: "What time will the library seminar begin tomorrow?",
      options: ["9:15 AM", "9:45 AM", "10:30 AM"],
      correctAnswer: "9:45 AM",
      explanation: "The librarian confirms the opening address starts at quarter to ten (9:45 AM).",
    },
    {
      num: 6,
      prompt: "A customer is asking for directions in a shopping mall. Where is the bookstore located?",
      options: ["On the ground floor", "On the second floor next to the cinema", "In the basement"],
      correctAnswer: "On the second floor next to the cinema",
      explanation: "Directions indicate taking the escalator up to the 2nd floor near the cinema.",
    },
    {
      num: 7,
      prompt: "Listen to the weather forecast. What will the weather be like on Sunday afternoon?",
      options: ["Heavy thunderstorms", "Sunny with mild breezes", "Cloudy and misty"],
      correctAnswer: "Sunny with mild breezes",
      explanation: "The meteorologist predicts warm sunshine and gentle breeze across the region.",
    },
    {
      num: 8,
      prompt: "Why did the student miss the morning chemistry lecture?",
      options: ["His bicycle had a flat tire", "He overslept", "The train was canceled"],
      correctAnswer: "The train was canceled",
      explanation: "The student explains that his regular morning train was abruptly canceled.",
    },
    {
      num: 9,
      prompt: "How much is the discounted admission ticket for university students?",
      options: ["8 dollars", "12 dollars", "15 dollars"],
      correctAnswer: "8 dollars",
      explanation: "The museum counter informs students pay only 8 dollars with a valid ID.",
    },
    {
      num: 10,
      prompt: "Which sport class has been rescheduled to Thursday evening?",
      options: ["Yoga", "Pilates", "Indoor tennis"],
      correctAnswer: "Yoga",
      explanation: "The fitness club notice confirms the beginner yoga session moves to Thursday.",
    },
    {
      num: 11,
      prompt: "What gift did David receive from his colleagues for his promotion?",
      options: ["A leather briefcase", "A fountain pen", "A smart watch"],
      correctAnswer: "A fountain pen",
      explanation: "David expresses gratitude for the engraved fountain pen.",
    },
    {
      num: 12,
      prompt: "Listen to the phone message. What is the doctor appointment date?",
      options: ["October 12th", "October 15th", "October 20th"],
      correctAnswer: "October 15th",
      explanation: "The receptionist books the consultation for Thursday, October 15th.",
    },
    {
      num: 13,
      prompt: "What did the woman leave behind in the taxi cab?",
      options: ["Her sunglasses", "Her black handbag", "Her umbrella"],
      correctAnswer: "Her black handbag",
      explanation: "She calls the taxi hotline inquiring about a black leather handbag.",
    },
  ],
  part2: {
    instructions:
      "Four people are talking about their exercise preferences. Match each person to the correct information.",
    options: [
      "Prefers early morning outdoor jogging in local parks",
      "Enjoys competitive weekend team sports with colleagues",
      "Works out with personal trainers in a high-tech gym",
      "Practices gentle yoga and meditation at home",
      "Does swimming regularly to recover from joint injuries",
    ],
    speakers: [
      {
        speaker: "Speaker A",
        correctAnswer: "Prefers early morning outdoor jogging in local parks",
        explanation: "Speaker A talks about waking up at 6 AM to run in the park nearby.",
      },
      {
        speaker: "Speaker B",
        correctAnswer: "Enjoys competitive weekend team sports with colleagues",
        explanation: "Speaker B loves joining amateur basketball tournaments on Saturdays.",
      },
      {
        speaker: "Speaker C",
        correctAnswer: "Works out with personal trainers in a high-tech gym",
        explanation: "Speaker C values structured weight training and customized gym routines.",
      },
      {
        speaker: "Speaker D",
        correctAnswer: "Practices gentle yoga and meditation at home",
        explanation: "Speaker D prefers quiet mindfulness, stretching, and breathing exercises at home.",
      },
    ],
  },
  part3: {
    topic: "There is too much information on the Internet",
    instructions: "Who expresses which opinion?",
    opinions: [
      {
        statement: "1. There is too much information on the Internet",
        correctAnswer: "Both" as const,
        explanation: "Both speakers agree that information overload is a widespread digital challenge.",
      },
      {
        statement: "2. Finding information on the Internet requires skills",
        correctAnswer: "Woman" as const,
        explanation: "The woman emphasizes the necessity of critical thinking and filtering tools.",
      },
      {
        statement: "3. The use of the Internet affects the way we think.",
        correctAnswer: "Man" as const,
        explanation: "The man references neuroscientific studies on shortened attention spans.",
      },
      {
        statement: "4. The Internet makes young people less patient.",
        correctAnswer: "Woman" as const,
        explanation: "The woman argues that instant gratification reduces patience among teenagers.",
      },
    ],
  },
  part4: [
    {
      recNum: 1,
      title: "Recording 1 of 2",
      passageText: "A book review of a prominent author new novel.",
      questions: [
        {
          prompt: "1. What does the announcer say about the new novel?",
          options: [
            "It is different from his earlier works",
            "It is romantic and soft",
            "It is less famous than his earlier works",
          ],
          correctAnswer: "It is different from his earlier works",
          explanation: "The critic highlights a bold thematic departure from the author previous style.",
        },
        {
          prompt: "2. What does the announcer say the writer should do in the future?",
          options: [
            "The writer should continue to write this genre",
            "The writer should go back to his original genre",
            "He should listen to critics before writing his next work",
          ],
          correctAnswer: "The writer should continue to write this genre",
          explanation: "The reviewer strongly encourages further exploration of this innovative narrative approach.",
        },
      ],
    },
    {
      recNum: 2,
      title: "Recording 2 of 2",
      passageText: "An interview with an eco-architect about sustainable museum design.",
      questions: [
        {
          prompt: "1. What inspired the architect to design the eco-friendly museum?",
          options: [
            "Ancient subterranean structures",
            "Modern urban glass towers",
            "Natural light and organic tree foliage",
          ],
          correctAnswer: "Natural light and organic tree foliage",
          explanation: "The architect mentions biomimicry and sunlight filtering through leaves.",
        },
        {
          prompt: "2. What challenge did the construction team encounter during building?",
          options: [
            "Budgetary constraints and material delays",
            "Extremely adverse winter frost",
            "Opposition from historical preservation societies",
          ],
          correctAnswer: "Budgetary constraints and material delays",
          explanation: "The project suffered severe delays due to imported sustainable materials.",
        },
      ],
    },
  ],
};

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
  },
  part3: {
    topic: "Electric Vehicles and Environmental Future",
    instructions: "Who expresses which opinion? Select Man, Woman, or Both.",
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

  const [examData, setExamData] = useState(initialBenchmark);
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

  // Tự động nhảy tới Part nếu URL có ?part=p1 / p2 / p3 / p4 / 1 / 2 / 3 / 4
  useEffect(() => {
    const p = searchParams?.get("part")?.toLowerCase();
    if (p === "p1" || p === "1" || p === "part1") setActiveStage(0);
    else if (p === "p2" || p === "2" || p === "part2") setActiveStage(13);
    else if (p === "p3" || p === "3" || p === "part3") setActiveStage(14);
    else if (p === "p4" || p === "4" || p === "part4") setActiveStage(15);
  }, [searchParams]);

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

  // Parser dữ liệu từ Backend sang format hiển thị của Listening
  function parseApiToListeningData(apiData: any) {
    const fallback =
      examId.includes("2") || examId.includes("02")
        ? DEFAULT_LISTENING_TEST_2
        : DEFAULT_LISTENING_TEST;

    const result = {
      title: apiData.title || fallback.title,
      durationMinutes: apiData.duration_minutes || 40,
      part1: [...fallback.part1],
      part2: { ...fallback.part2 },
      part3: { ...fallback.part3 },
      part4: [...fallback.part4],
    };

    const audioUrls: Record<number, string> = {};
    const parts = apiData.parts || [];

    parts.forEach((p: any) => {
      const pNum = p.part_number;
      const questions = p.questions || [];

      // Part 1: Word Recognition (13 câu)
      if (pNum === 1 && questions.length > 0) {
        if (p.audio_url) {
          for (let i = 0; i <= 12; i++) audioUrls[i] = p.audio_url;
        }
        result.part1 = questions.map((q: any, idx: number) => {
          let opts: string[] = ["A", "B", "C"];
          if (Array.isArray(q.options)) opts = q.options;
          else if (typeof q.options === "string") {
            try { opts = JSON.parse(q.options); } catch { opts = ["A", "B", "C"]; }
          }
          return {
            id: q.id,
            num: q.question_number || idx + 1,
            prompt: q.prompt,
            options: opts,
            correctAnswer: q.correct_answer || opts[0] || "",
            explanation: q.explanation || "Đáp án chuẩn theo đoạn ghi âm đối thoại.",
          };
        });
      }

      // Part 2: Speakers matching
      if (pNum === 2 && questions.length > 0) {
        if (p.audio_url) audioUrls[13] = p.audio_url;
        const spkList = questions.map((q: any, idx: number) => ({
          id: q.id,
          speaker: q.prompt ? q.prompt.replace(/^Speaker\s*[A-D]\s*[-:]*\s*/i, "") : `Speaker ${String.fromCharCode(65 + idx)}`,
          correctAnswer: q.correct_answer || "",
          explanation: q.explanation || "",
        }));
        if (spkList.length > 0) {
          result.part2.speakers = spkList;
          if (p.instructions) result.part2.instructions = p.instructions;
        }
      }

      // Part 3: Opinion discussion
      if (pNum === 3 && questions.length > 0) {
        if (p.audio_url) audioUrls[14] = p.audio_url;
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
          };
        });
        if (opList.length > 0) {
          result.part3.opinions = opList;
          if (p.instructions) result.part3.instructions = p.instructions;
        }
      }

      // Part 4: Monologues
      if (pNum === 4 && questions.length > 0) {
        if (p.audio_url) {
          audioUrls[15] = p.audio_url;
          audioUrls[16] = p.audio_url;
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
    if (activeStage <= 12) {
      const q = examData.part1[activeStage];
      return q ? `Question ${q.num}. ${q.prompt}` : "";
    } else if (activeStage === 13) {
      return `Part 2. Four people are talking. ${examData.part2.speakers.map((s) => s.speaker + ". " + s.correctAnswer).join(". ")}`;
    } else if (activeStage === 14) {
      return `Part 3. A man and a woman are discussing: ${examData.part3.topic}. ${examData.part3.opinions.map((o) => o.statement).join(". ")}`;
    } else if (activeStage === 15) {
      return examData.part4[0]?.passageText || "First monologue presentation.";
    } else {
      return examData.part4[1]?.passageText || "Second monologue presentation.";
    }
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

    // Bắt đầu phát âm thanh
    const targetAudioSrc = audioUrlMap[activeStage];
    let audioPlayed = false;

    if (targetAudioSrc && audioRef.current) {
      audioRef.current.src = targetAudioSrc;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current
        .play()
        .then(() => {
          audioPlayed = true;
          setIsPlaying(true);
          setPlayCounts((prev) => ({ ...prev, [activeStage]: currentCount + 1 }));
        })
        .catch(() => {
          audioPlayed = false;
        });
    }

    // Nếu không có file audio hoặc file audio bị lỗi đường dẫn: Dùng giọng nói tiếng Anh trình duyệt (SpeechSynthesis)
    if (!audioPlayed) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const scriptText = getCurrentStageScript();
        const utterance = new SpeechSynthesisUtterance(scriptText);
        utterance.lang = "en-GB"; // Chuẩn giọng Anh British Council
        utterance.rate = playbackSpeed;

        const estDurationSec = Math.max(8, scriptText.split(" ").length / 2.5);
        let elapsed = 0;

        utterance.onstart = () => {
          setIsPlaying(true);
          setPlayCounts((prev) => ({ ...prev, [activeStage]: currentCount + 1 }));
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
        // Fallback mô phỏng nếu trình duyệt không có speech API
        setIsPlaying(true);
        setPlayCounts((prev) => ({ ...prev, [activeStage]: currentCount + 1 }));
      }
    }
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

  // TÍNH ĐIỂM CHUẨN 25 CÂU (50 ĐIỂM)
  const calculateResults = () => {
    let p1Correct = 0;
    examData.part1.forEach((q, idx) => {
      if (p1Answers[idx] === q.correctAnswer) p1Correct++;
    });

    let p2Correct = 0;
    examData.part2.speakers.forEach((s, idx) => {
      if (p2Answers[idx] === s.correctAnswer) p2Correct++;
    });

    let p3Correct = 0;
    examData.part3.opinions.forEach((o, idx) => {
      if (p3Answers[idx] === o.correctAnswer) p3Correct++;
    });

    let p4Correct = 0;
    examData.part4.forEach((rec, recIdx) => {
      rec.questions.forEach((q, qIdx) => {
        if (p4Answers[`${recIdx}_${qIdx}`] === q.correctAnswer) p4Correct++;
      });
    });

    const totalCorrect = p1Correct + p2Correct + p3Correct + p4Correct;
    const p1Score = p1Correct * 2;
    const p2Score = p2Correct * 2;
    const p3Score = p3Correct * 2;
    const p4Score = p4Correct * 2;
    const totalScore = p1Score + p2Score + p3Score + p4Score;

    let cefr = "A0";
    if (totalScore >= 46) cefr = "C";
    else if (totalScore >= 38) cefr = "B2";
    else if (totalScore >= 28) cefr = "B1";
    else if (totalScore >= 18) cefr = "A2";
    else if (totalScore >= 10) cefr = "A1";

    return {
      p1Correct,
      p1Score,
      p2Correct,
      p2Score,
      p3Correct,
      p3Score,
      p4Correct,
      p4Score,
      totalCorrect,
      totalScore,
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

  // Xác định Part hiện tại theo activeStage
  const getStageMeta = () => {
    if (activeStage <= 12) {
      return {
        partName: "Part 1 – Word Recognition",
        subTitle: `Question ${activeStage + 1} of 13`,
        isLast: false,
      };
    } else if (activeStage === 13) {
      return {
        partName: "Part 2 – Matching Information",
        subTitle: "Question 1 of 1",
        isLast: false,
      };
    } else if (activeStage === 14) {
      return {
        partName: "Part 3 – Short Conversations",
        subTitle: "Question 1 of 1",
        isLast: false,
      };
    } else if (activeStage === 15) {
      return {
        partName: "Part 4 – Monologues",
        subTitle: "Recording 1 of 2",
        isLast: false,
      };
    } else {
      return {
        partName: "Part 4 – Monologues",
        subTitle: "Recording 2 of 2",
        isLast: true,
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
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <span>👁️</span>
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
                  {activeStage <= 12
                    ? "Listen to the short recording and answer the question. You can listen twice."
                    : activeStage === 13
                    ? examData.part2.instructions
                    : activeStage === 14
                    ? `${examData.part3.topic}. ${examData.part3.instructions}`
                    : activeStage === 15
                    ? "Listen to the first monologue and answer the questions."
                    : "Listen to the second monologue and answer the questions."}
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

                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
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
                    <span className="font-semibold text-foreground">
                      {isPlaying ? "🔊 Đang phát âm thanh..." : "🎧 Sẵn sàng nghe"}
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
          </div>

          {/* 3. PART CONTENT CHUẨN */}
          {/* =========================================================================
              PART 1: 13 CÂU HỎI TRẮC NGHIỆM A, B, C
              ========================================================================= */}
          {activeStage <= 12 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
              <h3 className="text-sm md:text-base font-medium text-foreground leading-relaxed">
                {examData.part1[activeStage].prompt}
              </h3>

              <div className="space-y-3">
                {examData.part1[activeStage].options.map((opt, optIdx) => {
                  const isSelected = p1Answers[activeStage] === opt;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() =>
                        setP1Answers((prev) => ({
                          ...prev,
                          [activeStage]: opt,
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
          )}

          {/* =========================================================================
              PART 2: 4 SPEAKERS NỐI THÔNG TIN BẰNG DROPDOWN
              ========================================================================= */}
          {activeStage === 13 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-semibold text-foreground">
                Ghép thông tin tương ứng cho 4 người nói:
              </h3>

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
                      {examData.part2.options.map((opt, oIdx) => (
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
              PART 3: 4 NHẬN ĐỊNH CHỌN MAN / WOMAN / BOTH
              ========================================================================= */}
          {activeStage === 14 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-semibold text-foreground">
                Xác định ai là người đưa ra từng quan điểm dưới đây:
              </h3>

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
              PART 4: 2 RECORDINGS MONOLOGUES (MỖI BÀI 2 CÂU HỎI TRẮC NGHIỆM)
              ========================================================================= */}
          {(activeStage === 15 || activeStage === 16) && (
            <div className="space-y-6">
              {examData.part4[activeStage === 15 ? 0 : 1].questions.map((q, qIdx) => {
                const recIdx = activeStage === 15 ? 0 : 1;
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
          )}
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
            onClick={() => alert("Đã gửi phản hồi báo lỗi đề thi.")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted text-xs font-medium transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Báo lỗi</span>
          </button>
        </div>

        {/* Center: Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDrawer(true)}
            className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted text-xs font-bold transition-colors"
            title="Danh sách câu hỏi"
          >
            <Menu className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => alert(`Đang làm bài: ${currentMeta.partName} - ${currentMeta.subTitle}`)}
            className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted text-xs font-bold transition-colors"
            title="Thông tin bài thi"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted text-xs font-bold transition-colors"
            title="Cuộn lên đầu trang"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
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

          {activeStage < 16 ? (
            <button
              type="button"
              onClick={() => setActiveStage((p) => Math.min(16, p + 1))}
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
                <span>💡</span>
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
              {activeStage <= 12 && (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                  <div className="font-semibold text-foreground">
                    {examData.part1[activeStage].prompt}
                  </div>
                  <div className="text-primary font-bold">
                    Đáp án đúng: {examData.part1[activeStage].correctAnswer}
                  </div>
                  <div className="text-muted-foreground italic">
                    {examData.part1[activeStage].explanation}
                  </div>
                </div>
              )}

              {activeStage === 13 &&
                examData.part2.speakers.map((s, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                    <div className="font-bold text-primary">{s.speaker}</div>
                    <div className="text-foreground font-medium">Đáp án: {s.correctAnswer}</div>
                    <div className="text-muted-foreground italic text-[11px]">{s.explanation}</div>
                  </div>
                ))}

              {activeStage === 14 &&
                examData.part3.opinions.map((op, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                    <div className="font-medium text-foreground">{op.statement}</div>
                    <div className="text-primary font-bold">Đáp án: {op.correctAnswer}</div>
                    <div className="text-muted-foreground italic text-[11px]">{op.explanation}</div>
                  </div>
                ))}

              {(activeStage === 15 || activeStage === 16) &&
                examData.part4[activeStage === 15 ? 0 : 1].questions.map((q, idx) => (
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

      {/* DRAWER DANH SÁCH CÂU HỎI */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md p-5 rounded-2xl bg-card border border-border shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-heading font-bold text-xs uppercase text-muted-foreground tracking-wider">
                Danh sách bài tập Listening (17 bài)
              </h3>
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {/* Part 1 */}
              <div className="text-[11px] font-bold text-primary uppercase pt-1">
                Part 1 – Word Recognition (13 câu)
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 13 }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveStage(idx);
                      setShowDrawer(false);
                    }}
                    className={`p-2 rounded-lg text-xs font-bold transition-colors ${
                      activeStage === idx
                        ? "bg-primary text-primary-foreground"
                        : p1Answers[idx]
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                        : "bg-muted/40 hover:bg-muted text-foreground"
                    }`}
                  >
                    Câu {idx + 1}
                  </button>
                ))}
              </div>

              {/* Part 2 */}
              <div className="text-[11px] font-bold text-primary uppercase pt-2">
                Part 2 – Matching Info
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveStage(13);
                  setShowDrawer(false);
                }}
                className={`w-full p-2.5 rounded-lg text-xs font-bold text-left transition-colors ${
                  activeStage === 13
                    ? "bg-primary text-primary-foreground"
                    : Object.keys(p2Answers).length === 4
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    : "bg-muted/40 hover:bg-muted text-foreground"
                }`}
              >
                Câu 14: Matching 4 Speakers (Speaker A - D)
              </button>

              {/* Part 3 */}
              <div className="text-[11px] font-bold text-primary uppercase pt-2">
                Part 3 – Short Conversations
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveStage(14);
                  setShowDrawer(false);
                }}
                className={`w-full p-2.5 rounded-lg text-xs font-bold text-left transition-colors ${
                  activeStage === 14
                    ? "bg-primary text-primary-foreground"
                    : Object.keys(p3Answers).length === 4
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    : "bg-muted/40 hover:bg-muted text-foreground"
                }`}
              >
                Câu 15: Opinion Matching (Man / Woman / Both)
              </button>

              {/* Part 4 */}
              <div className="text-[11px] font-bold text-primary uppercase pt-2">
                Part 4 – Monologues
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveStage(15);
                    setShowDrawer(false);
                  }}
                  className={`p-2.5 rounded-lg text-xs font-bold transition-colors ${
                    activeStage === 15
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/40 hover:bg-muted text-foreground"
                  }`}
                >
                  Câu 16: Recording 1
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveStage(16);
                    setShowDrawer(false);
                  }}
                  className={`p-2.5 rounded-lg text-xs font-bold transition-colors ${
                    activeStage === 16
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/40 hover:bg-muted text-foreground"
                  }`}
                >
                  Câu 17: Recording 2
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          BACKUP CODE UI CŨ (GENERIC LISTENING VIEW)
          Được comment lại theo yêu cầu của user để có thể phục hồi/backup bất cứ lúc nào:
          =========================================================================
      {false && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
              <div>Legacy Audio Station with flat multiple choice options</div>
            </div>
          </div>
        </div>
      )}
      ========================================================================= */}
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
