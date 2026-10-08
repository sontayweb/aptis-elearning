"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronRight,
  Eye,
  Flag,
  Menu,
  Info,
  ArrowUp,
  LogOut,
  X,
  PenTool,
} from "lucide-react";

interface WritingQuestion {
  id?: string;
  questionNumber: number;
  prompt: string;
  sampleAnswer?: string;
}

interface WritingPart {
  partNumber: number;
  partName: string;
  partSubtitle: string;
  minWords: number;
  maxWords: number;
  instructions: string;
  passageText?: string;
  recommendedMinutes: number;
  questions: WritingQuestion[];
}

// Fallback Default Art Club data chuẩn Aptis Kỳ Tích
const DEFAULT_ART_CLUB_PARTS: WritingPart[] = [
  {
    partNumber: 1,
    partName: "Part 1 – Short Answers",
    partSubtitle: "Part 1 - Short Answers",
    minWords: 1,
    maxWords: 5,
    recommendedMinutes: 3,
    instructions:
      "You want to join an art club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt: "1. What do you like doing with your friends?",
        sampleAnswer: "Going to art exhibitions together.",
      },
      {
        questionNumber: 2,
        prompt: "2. Which sport do you like playing the most?",
        sampleAnswer: "Playing badminton and swimming.",
      },
      {
        questionNumber: 3,
        prompt: "3. What did you do last night?",
        sampleAnswer: "I watched an art documentary.",
      },
      {
        questionNumber: 4,
        prompt: "4. Do you like shopping?",
        sampleAnswer: "Yes, especially for painting supplies.",
      },
      {
        questionNumber: 5,
        prompt: "5. What is your favorite season of the year?",
        sampleAnswer: "Autumn, because of colorful leaves.",
      },
    ],
  },
  {
    partNumber: 2,
    partName: "Part 2 – Social Media Response",
    partSubtitle: "Part 2 - Social Media Response",
    minWords: 20,
    maxWords: 30,
    recommendedMinutes: 7,
    instructions:
      "You are a new member of the art club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt: "Tell us about a painting or photo you like.",
        sampleAnswer:
          "I took a photo last weekend in the park when the sun was setting. The light was soft, so the picture looked very nice.",
      },
    ],
  },
  {
    partNumber: 3,
    partName: "Part 3 – Three Questions",
    partSubtitle: "Part 3 - Three Questions",
    minWords: 30,
    maxWords: 40,
    recommendedMinutes: 10,
    instructions:
      "You are a member of the art club. You are talking to three other members in the club chat room. Talk to them using sentences. Use 30-40 words per answer. Recommended time: 10 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt:
          "1. I have kept a painting for a long time. Tell me about something that you have had for a long time.",
        sampleAnswer:
          "I have kept an oil painting created by my grandfather for over ten years. It hangs gracefully in my living room and always brings back warm memories of our time together.",
      },
      {
        questionNumber: 2,
        prompt:
          "2. I would like to learn painting, but I have not found an effective way. Should I take a course at my local college? Please give me some advice.",
        sampleAnswer:
          "Enrolling in a course at your local college is definitely a great choice because you receive structured lessons and immediate professional feedback. Moreover, studying with peers will motivate your artistic growth.",
      },
      {
        questionNumber: 3,
        prompt:
          "3. Street art, where people paint on buildings, is becoming popular. However, some people say it is bad. What is your opinion?",
        sampleAnswer:
          "In my view, street art brings vibrant energy and modern cultural charm to dull urban walls when done legally. However, unauthorized graffiti damaging heritage sites should certainly be discouraged.",
      },
    ],
  },
  {
    partNumber: 4,
    partName: "Part 4 – Formal & Informal Email",
    partSubtitle: "Part 4 - Formal & Informal Email",
    minWords: 50,
    maxWords: 150,
    recommendedMinutes: 20,
    instructions:
      "You are a member of the art club. You received an email from the club secretary stating that the annual art gallery visit has been canceled due to budget constraints.",
    questions: [
      {
        questionNumber: 1,
        prompt:
          "Write an email to a friend who is also an art club member. Write about your feelings and what you think the club should do. Write about 50 words.",
        sampleAnswer:
          "Hi Mark,\n\nDid you see the notice about our gallery excursion being called off? I was really looking forward to seeing the new modern art collection. Maybe we can suggest members contribute a small extra fee so the trip can still take place.\n\nBest,\nHiep",
      },
      {
        questionNumber: 2,
        prompt:
          "Write an email to the club secretary. Explain how you feel about the cancellation and suggest alternative ways the club could organize the trip or raise funds. Write 120-150 words.",
        sampleAnswer:
          "Dear Mr. Davis,\n\nI am writing to express my disappointment upon learning about the cancellation of our anticipated annual visit to the National Art Gallery. This excursion is one of the most enriching activities of the club year.\n\nWhile I appreciate the budgetary hurdles currently facing the committee, I would respectfully propose several constructive alternatives. Firstly, members could contribute a modest personal fee to cover transportation expenses. Secondly, we could organize a student art auction or reach out to local sponsors to bridge the deficit.\n\nI believe these solutions would enable us to proceed without placing an excessive burden on club finances. I hope the committee will favorably review these thoughts.\n\nYours sincerely,\nHoang Hiep",
      },
    ],
  },
];

// Fallback Sports & Fitness Club data (Đề 02)
const DEFAULT_FITNESS_CLUB_PARTS: WritingPart[] = [
  {
    partNumber: 1,
    partName: "Part 1 – Short Answers",
    partSubtitle: "Part 1 - Short Answers",
    minWords: 1,
    maxWords: 5,
    recommendedMinutes: 3,
    instructions:
      "You want to join a sports and fitness club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt: "1. What is your favorite outdoor sport or physical activity?",
        sampleAnswer: "Swimming and playing badminton.",
      },
      {
        questionNumber: 2,
        prompt: "2. How often do you exercise each week?",
        sampleAnswer: "Three times every week.",
      },
      {
        questionNumber: 3,
        prompt: "3. What sports gear or equipment do you usually use?",
        sampleAnswer: "Running shoes and yoga mat.",
      },
      {
        questionNumber: 4,
        prompt: "4. What time of day do you prefer working out?",
        sampleAnswer: "Early morning before work.",
      },
      {
        questionNumber: 5,
        prompt: "5. Which season is best for outdoor running?",
        sampleAnswer: "Spring, with cool breezes.",
      },
    ],
  },
  {
    partNumber: 2,
    partName: "Part 2 – Social Media Response",
    partSubtitle: "Part 2 - Social Media Response",
    minWords: 20,
    maxWords: 30,
    recommendedMinutes: 7,
    instructions:
      "You are a new member of the sports and fitness club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt: "Please tell us why you want to join our sports club and what personal goals you wish to achieve.",
        sampleAnswer:
          "I want to join to improve my cardiovascular stamina and relieve stress after work. Exercising with club peers will keep me disciplined.",
      },
    ],
  },
  {
    partNumber: 3,
    partName: "Part 3 – Three Questions",
    partSubtitle: "Part 3 - Three Questions",
    minWords: 30,
    maxWords: 40,
    recommendedMinutes: 10,
    instructions:
      "You are a member of the sports club. You are talking to three other members in the club chat room. Talk to them using sentences. Use 30-40 words per answer. Recommended time: 10 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt:
          "1. I have just started training at the gym. How many days per week should a beginner exercise?",
        sampleAnswer:
          "As a beginner, three sessions per week is ideal. It allows your muscle tissue adequate recovery time while fostering a sustainable fitness habit without risking exhaustion.",
      },
      {
        questionNumber: 2,
        prompt:
          "2. The management is considering raising membership fees to purchase modern equipment. What is your opinion?",
        sampleAnswer:
          "Upgrading machinery is beneficial for member safety and workout variety. However, the club should provide discounted loyalty rates for existing members to reward their dedication.",
      },
      {
        questionNumber: 3,
        prompt:
          "3. Some people prefer exercising alone at home while others love group fitness classes. Which do you prefer?",
        sampleAnswer:
          "I prefer group workout classes because energetic music and motivated peers inspire me to push beyond my limits far more effectively than exercising alone.",
      },
    ],
  },
  {
    partNumber: 4,
    partName: "Part 4 – Formal & Informal Email",
    partSubtitle: "Part 4 - Formal & Informal Email",
    minWords: 50,
    maxWords: 150,
    recommendedMinutes: 20,
    instructions:
      "You are a member of the sports club. You received an email from the club manager stating that all weekend group workout sessions have been canceled due to staff shortages.",
    questions: [
      {
        questionNumber: 1,
        prompt:
          "Write an email to a friend who is also a sports club member. Write about your feelings and what you think the club should do. Write about 50 words.",
        sampleAnswer:
          "Hi Alex,\n\nDid you see the club notice about canceling weekend training sessions? I am quite upset since weekends are my only free window for exercise. We should talk to other members and suggest hiring temporary guest coaches.\n\nBest,\nHiep",
      },
      {
        questionNumber: 2,
        prompt:
          "Write an email to the club manager. Explain how you feel about the cancellation and suggest alternative ways the club could organize sessions or solve staffing issues. Write 120-150 words.",
        sampleAnswer:
          "Dear Mr. Henderson,\n\nI am writing to express my earnest concern regarding the recent decision to suspend weekend group workout sessions due to staffing shortages. As a working professional, weekends represent my primary availability to train consistently.\n\nWhile I completely appreciate the operational difficulties facing the club, I would respectfully like to suggest two constructive alternatives. Firstly, the club could hire accredited freelance fitness instructors on temporary contracts. Secondly, certified senior members could supervise peer-led workouts until permanent staff are recruited.\n\nI believe these solutions would enable members to continue their routines safely without placing an excessive burden on management. I hope you will give these suggestions favorable consideration.\n\nYours sincerely,\nHoang Hiep",
      },
    ],
  },
];

// Fallback Book Club data (Đề 03)
const DEFAULT_BOOK_CLUB_PARTS: WritingPart[] = [
  {
    partNumber: 1,
    partName: "Part 1 – Short Answers",
    partSubtitle: "Part 1 - Short Answers",
    minWords: 1,
    maxWords: 5,
    recommendedMinutes: 3,
    instructions:
      "You want to join a book club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt: "1. What genre of books do you enjoy reading the most?",
        sampleAnswer: "Historical novels and biographies.",
      },
      {
        questionNumber: 2,
        prompt: "2. How often do you visit a bookstore or library?",
        sampleAnswer: "Twice every month.",
      },
      {
        questionNumber: 3,
        prompt: "3. What was the last book you finished?",
        sampleAnswer: "The Great Gatsby.",
      },
      {
        questionNumber: 4,
        prompt: "4. Do you prefer reading printed books or e-books?",
        sampleAnswer: "Printed books with paper feel.",
      },
      {
        questionNumber: 5,
        prompt: "5. Where is your favorite spot for reading?",
        sampleAnswer: "A quiet corner cafe.",
      },
    ],
  },
  {
    partNumber: 2,
    partName: "Part 2 – Social Media Response",
    partSubtitle: "Part 2 - Social Media Response",
    minWords: 20,
    maxWords: 30,
    recommendedMinutes: 7,
    instructions:
      "You are a new member of the book club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt: "Tell us about a book that made a strong impression on you and why you liked it.",
        sampleAnswer:
          "I recently read 'To Kill a Mockingbird'. It deeply moved me because of its profound message about justice, personal integrity, and unconditional human empathy.",
      },
    ],
  },
  {
    partNumber: 3,
    partName: "Part 3 – Three Questions",
    partSubtitle: "Part 3 - Three Questions",
    minWords: 30,
    maxWords: 40,
    recommendedMinutes: 10,
    instructions:
      "You are a member of the book club. You are talking to three other members in the club chat room. Talk to them using sentences. Use 30-40 words per answer. Recommended time: 10 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt:
          "1. I struggle to finish long books because of busy schedules. How do you find time to read daily?",
        sampleAnswer:
          "I set aside twenty minutes before bedtime every night without looking at my smartphone. Reading small chapters consistently accumulates quickly over weeks.",
      },
      {
        questionNumber: 2,
        prompt:
          "2. Our local municipal library might reduce its weekend opening hours. How do you feel about this?",
        sampleAnswer:
          "Reducing weekend hours would severely hurt students and working citizens who only have leisure time on Saturdays. The municipal council should recruit community volunteers instead.",
      },
      {
        questionNumber: 3,
        prompt:
          "3. Many young people prefer audiobooks over paper books now. What is your viewpoint?",
        sampleAnswer:
          "Audiobooks are fantastic for daily commutes and multitasking. However, printed books provide tactile pleasure and deeper focus that audio recordings cannot entirely replace.",
      },
    ],
  },
  {
    partNumber: 4,
    partName: "Part 4 – Formal & Informal Email",
    partSubtitle: "Part 4 - Formal & Informal Email",
    minWords: 50,
    maxWords: 150,
    recommendedMinutes: 20,
    instructions:
      "You are a member of the book club. You received an email from the club coordinator stating that next month's author meeting and discussion with novelist David Mitchell has been canceled.",
    questions: [
      {
        questionNumber: 1,
        prompt:
          "Write an email to a friend who is also a book club member. Write about your feelings and what you think the club should do. Write about 50 words.",
        sampleAnswer:
          "Hi Sarah,\n\nHave you heard about the author talk with David Mitchell being canceled? I am so disappointed as I had prepared several questions about his latest novel. Let us propose organizing a virtual session via Zoom instead.\n\nCheers,\nHiep",
      },
      {
        questionNumber: 2,
        prompt:
          "Write an email to the club coordinator. Explain how you feel about the cancellation and suggest alternative ways the club could organize the session. Write 120-150 words.",
        sampleAnswer:
          "Dear Ms. Watson,\n\nI am writing to express my regret upon receiving the notification that our scheduled author talk with David Mitchell has been canceled owing to travel issues.\n\nGiven the tremendous anticipation among club members, I would like to propose hosting this session virtually via video conference. This would eliminate travel constraints while still providing an engaging interactive platform for members to discuss the author's work.\n\nI hope the committee will consider this viable alternative.\n\nYours sincerely,\nHoang Hiep",
      },
    ],
  },
];

// Fallback Travel & Adventure Club data (Đề 04)
const DEFAULT_TRAVEL_CLUB_PARTS: WritingPart[] = [
  {
    partNumber: 1,
    partName: "Part 1 – Short Answers",
    partSubtitle: "Part 1 - Short Answers",
    minWords: 1,
    maxWords: 5,
    recommendedMinutes: 3,
    instructions:
      "You want to join a travel and outdoor club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt: "1. What is your favorite holiday destination?",
        sampleAnswer: "Coastal beaches and mountains.",
      },
      {
        questionNumber: 2,
        prompt: "2. Who do you usually travel with?",
        sampleAnswer: "My family and close friends.",
      },
      {
        questionNumber: 3,
        prompt: "3. What essential item do you always pack?",
        sampleAnswer: "Camera and comfortable shoes.",
      },
      {
        questionNumber: 4,
        prompt: "4. How do you prefer to travel: plane, train, or car?",
        sampleAnswer: "Train, for scenic views.",
      },
      {
        questionNumber: 5,
        prompt: "5. What is the best season for traveling?",
        sampleAnswer: "Autumn, with pleasant mild weather.",
      },
    ],
  },
  {
    partNumber: 2,
    partName: "Part 2 – Social Media Response",
    partSubtitle: "Part 2 - Social Media Response",
    minWords: 20,
    maxWords: 30,
    recommendedMinutes: 7,
    instructions:
      "You are a new member of the travel club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt: "Tell us about a memorable journey or vacation you experienced recently.",
        sampleAnswer:
          "Last summer, I took a road trip along the central coastline. The crystal-clear sea and warm hospitality of local fishermen made it an unforgettable journey.",
      },
    ],
  },
  {
    partNumber: 3,
    partName: "Part 3 – Three Questions",
    partSubtitle: "Part 3 - Three Questions",
    minWords: 30,
    maxWords: 40,
    recommendedMinutes: 10,
    instructions:
      "You are a member of the travel club. You are talking to three other members in the club chat room. Talk to them using sentences. Use 30-40 words per answer. Recommended time: 10 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt:
          "1. Some people prefer solo travel while others always travel in groups. What do you prefer?",
        sampleAnswer:
          "I prefer traveling with friends because sharing local meals and exploring uncharted paths together creates unforgettable memories and enhances mutual safety.",
      },
      {
        questionNumber: 2,
        prompt:
          "2. Mass tourism is causing environmental damage to fragile heritage towns. What should authorities do?",
        sampleAnswer:
          "Municipal authorities should enforce daily tourist visitor quotas and channel tourism levies directly into historical conservation and eco-friendly waste management.",
      },
      {
        questionNumber: 3,
        prompt:
          "3. With rising airfares, budget travel has become challenging. What is your best cost-saving tip?",
        sampleAnswer:
          "Booking accommodations well in advance and dining at neighborhood markets rather than tourist cafes saves considerable funds while providing authentic cultural experiences.",
      },
    ],
  },
  {
    partNumber: 4,
    partName: "Part 4 – Formal & Informal Email",
    partSubtitle: "Part 4 - Formal & Informal Email",
    minWords: 50,
    maxWords: 150,
    recommendedMinutes: 20,
    instructions:
      "You are a member of the travel club. You received an email from the committee stating that the upcoming weekend exploration trip to the coastal national park has been canceled due to adverse weather warnings.",
    questions: [
      {
        questionNumber: 1,
        prompt:
          "Write an email to a friend who is also a travel club member. Write about your feelings and what you think the club should do. Write about 50 words.",
        sampleAnswer:
          "Hi Tom,\n\nDid you see the update about our national park trip being canceled? I was so excited to hike and camp by the coast. Perhaps we could suggest rescheduling to the following weekend once the weather clears.\n\nBest,\nHiep",
      },
      {
        questionNumber: 2,
        prompt:
          "Write an email to the club committee. Explain how you feel about the cancellation and suggest alternative ways the club could organize the excursion. Write 120-150 words.",
        sampleAnswer:
          "Dear Committee Members,\n\nI am writing regarding the postponement of our planned expedition to the coastal national park due to inclement weather conditions.\n\nWhile member safety is understandably the utmost priority, many of us have already arranged time off work. I would respectfully propose rescheduling the excursion to next weekend or shifting the itinerary to a nearby indoor cultural museum tour.\n\nI would be grateful if the committee could evaluate these possibilities.\n\nYours sincerely,\nHoang Hiep",
      },
    ],
  },
];

// Helper chọn benchmark đề theo tiêu đề hoặc ID
function getBenchmarkWritingParts(titleOrId: string = ''): WritingPart[] {
  const t = titleOrId.toLowerCase();
  if (t.includes('sport') || t.includes('fitness') || t.includes('thể thao') || t.includes('02') || t === '2') {
    return DEFAULT_FITNESS_CLUB_PARTS;
  }
  if (t.includes('book') || t.includes('sách') || t.includes('đọc') || t.includes('03') || t === '3') {
    return DEFAULT_BOOK_CLUB_PARTS;
  }
  if (t.includes('travel') || t.includes('du lịch') || t.includes('04') || t === '4') {
    return DEFAULT_TRAVEL_CLUB_PARTS;
  }
  return DEFAULT_ART_CLUB_PARTS;
}

function WritingExamRunnerContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = params.id as string;

  const [examTitle, setExamTitle] = useState("Writing Test");
  const [parts, setParts] = useState<WritingPart[]>(DEFAULT_ART_CLUB_PARTS);
  const [currentPartIdx, setCurrentPartIdx] = useState(0);

  // answers: key = `${partIdx}_${qIdx}`
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(3 * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // AI Quota & Submission state
  const [aiQuota, setAiQuota] = useState(2);
  const [showPart2Result, setShowPart2Result] = useState(false);
  const [showAiWaitingScreen, setShowAiWaitingScreen] = useState(false);
  const [showSampleAnswersModal, setShowSampleAnswersModal] = useState(false);
  const [showPartsDrawer, setShowPartsDrawer] = useState(false);

  // Khởi tạo Quota từ localStorage (hoặc 2 lượt như hệ thống gốc)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedQuota = localStorage.getItem("aptis_writing_ai_quota");
      if (savedQuota !== null) {
        setAiQuota(Number(savedQuota));
      } else {
        localStorage.setItem("aptis_writing_ai_quota", "2");
      }
    }
  }, []);

  // Xử lý tab part từ URL nếu có (?part=p1, ?part=p2, ?part=1, etc.)
  useEffect(() => {
    const partQuery = searchParams?.get("part")?.toLowerCase();
    if (partQuery === "p1" || partQuery === "1") setCurrentPartIdx(0);
    else if (partQuery === "p2" || partQuery === "2") setCurrentPartIdx(1);
    else if (partQuery === "p3" || partQuery === "3") setCurrentPartIdx(2);
    else if (partQuery === "p4" || partQuery === "4") setCurrentPartIdx(3);
  }, [searchParams]);

  // Load Exam Data từ Backend
  const loadExamData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getQuestions(examId);
      const title = res.data?.title || "Writing Test";
      setExamTitle(title);

      const benchmarkParts = getBenchmarkWritingParts(title || examId);

      if (res.success && res.data && res.data.parts?.length > 0) {
        const loadedParts: WritingPart[] = (res.data.parts || []).map(
          (p: any, idx: number) => {
            const partNum = p.part_number || idx + 1;
            const subTitle =
              partNum === 1
                ? "Part 1 - Short Answers"
                : partNum === 2
                ? "Part 2 - Social Media Response"
                : partNum === 3
                ? "Part 3 - Three Questions"
                : "Part 4 - Formal & Informal Email";

            const defaultP = benchmarkParts[idx] || benchmarkParts[0];

            let questions: WritingQuestion[] = [];
            if (p.questions && p.questions.length > 0) {
              questions = p.questions.map((q: any, qIdx: number) => ({
                id: q.id,
                questionNumber: q.question_number || qIdx + 1,
                prompt: q.prompt || defaultP.questions[qIdx]?.prompt || `Question ${qIdx + 1}`,
                sampleAnswer: q.explanation || defaultP.questions[qIdx]?.sampleAnswer,
              }));

              // Bổ sung đủ 5 câu cho Part 1 nếu database chỉ có ít câu
              if (partNum === 1 && questions.length < 5 && defaultP.questions.length >= 5) {
                for (let i = questions.length; i < 5; i++) {
                  questions.push({
                    ...defaultP.questions[i],
                    questionNumber: i + 1,
                  });
                }
              }
            } else {
              questions = defaultP.questions;
            }

            return {
              partNumber: partNum,
              partName: p.title || defaultP.partName,
              partSubtitle: subTitle,
              minWords: defaultP.minWords,
              maxWords: defaultP.maxWords,
              recommendedMinutes: defaultP.recommendedMinutes,
              instructions: p.instructions || defaultP.instructions,
              passageText: p.passage_text,
              questions,
            };
          }
        );

        // Bổ sung đủ 4 Part nếu đề chỉ lưu thiếu Part
        if (loadedParts.length < 4) {
          for (let i = loadedParts.length; i < 4; i++) {
            loadedParts.push(benchmarkParts[i]);
          }
        }

        setParts(loadedParts);
      } else {
        setParts(benchmarkParts);
      }
    } catch (err: any) {
      console.warn("Fallback to default writing exam:", err);
      const fallback = getBenchmarkWritingParts(examId);
      setParts(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId) loadExamData();
  }, [examId]);

  // Cập nhật lại thời gian theo từng Part khi đổi Part
  useEffect(() => {
    const currentP = parts[currentPartIdx];
    if (currentP) {
      setTimeLeft(currentP.recommendedMinutes * 60);
    }
  }, [currentPartIdx, parts]);

  // Timer Countdown
  useEffect(() => {
    if (loading || isPaused || showPart2Result || showAiWaitingScreen) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, isPaused, showPart2Result, showAiWaitingScreen]);

  // Khởi tạo submission ở backend
  useEffect(() => {
    async function initWritingSubmission() {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token || !examId || submissionId) return;
      try {
        const res = await api.submissions.start(examId);
        if (res.success && res.data) {
          setSubmissionId(res.data.submissionId || res.data.id);
        }
      } catch (err) {
        console.warn("Writing offline mode:", err);
      }
    }
    initWritingSubmission();
  }, [examId, submissionId]);

  const currentPart = parts[currentPartIdx] || parts[0];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getWordCount = (text?: string) => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  // NỘP BÀI (SUBMIT LOGIC: Part 2 miễn phí trả ngay; Part 1, 3, 4 trừ lượt AI & chờ)
  const handleSubmit = async () => {
    // Lưu các câu trả lời vào database nếu có submissionId
    if (submissionId) {
      try {
        const answersPayload = currentPart.questions
          .filter((q) => q.id && q.id.length > 10)
          .map((q, qIdx) => ({
            questionId: q.id!,
            textAnswer: answers[`${currentPartIdx}_${qIdx}`] || "",
          }));
        if (answersPayload.length > 0) {
          await api.submissions.autosave(submissionId, answersPayload);
        }
        if (currentPart.partNumber === 4 || currentPartIdx === parts.length - 1) {
          await api.submissions.submit(submissionId);
        }
      } catch (err) {
        console.warn("Writing autosave/submit error:", err);
      }
    }

    if (currentPart.partNumber === 2) {
      // PART 2: KHÔNG CHẤM AI - KHÔNG TRỪ LƯỢT AI - TRẢ KẾT QUẢ NGAY
      setShowPart2Result(true);
      setShowAiWaitingScreen(false);
    } else {
      // PART 1, 3, 4: CHẤM AI - TRỪ 1 LƯỢT CHẤM - HIỆN MÀN HÌNH CHỜ 1-3 PHÚT
      const newQuota = Math.max(0, aiQuota - 1);
      setAiQuota(newQuota);
      if (typeof window !== "undefined") {
        localStorage.setItem("aptis_writing_ai_quota", String(newQuota));
      }
      setShowAiWaitingScreen(true);
      setShowPart2Result(false);
    }
  };

  // =========================================================================
  // MÀN HÌNH CHỜ CHẤM AI (PART 1, 3, 4 - THEO THEME CHUẨN CỦA HỆ THỐNG MÌNH)
  // =========================================================================
  if (showAiWaitingScreen) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
        {/* Top Header Bar theo theme hệ thống */}
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                Writing Test
              </span>
              <span className="text-sm font-bold text-foreground">
                Kết quả đánh giá AI
              </span>
            </div>
          </div>
          <Link
            href="/writing"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Thoát</span>
          </Link>
        </header>

        {/* Centered Waiting Card theo theme hệ thống */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-sm p-10 text-center space-y-6 animate-in fade-in">
            {/* Circular Spinner theo màu primary của hệ thống */}
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>

            {/* Waiting Text */}
            <div className="space-y-2">
              <h3 className="font-heading font-bold text-base text-foreground">
                AI Kỳ Tích đang chấm bài viết
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Quá trình phân tích CEFR thường mất từ 1-3 phút. Bạn có thể thoát ra làm đề khác, bài chấm hoàn tất sẽ tự động lưu trong Lịch sử làm bài.
              </p>
            </div>

            {/* Thoát Button */}
            <div className="pt-2">
              <Link
                href="/writing"
                className="tech-btn inline-flex items-center justify-center px-8 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all"
              >
                Thoát về danh sách đề
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // MÀN HÌNH KẾT QUẢ PART 2 (THEO THEME CHUẨN CỦA HỆ THỐNG MÌNH)
  // =========================================================================
  if (showPart2Result) {
    const part2Answer = answers["1_0"] || answers[`${currentPartIdx}_0`] || "";
    const hasAnswer = part2Answer.trim().length > 0;

    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
        {/* Top Header Bar theo theme hệ thống */}
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                Writing Test
              </span>
              <span className="text-sm font-bold text-foreground">
                Kết quả Part 2 — Form Filling
              </span>
            </div>
          </div>
          <Link
            href="/writing"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Thoát</span>
          </Link>
        </header>

        {/* Content Container */}
        <main className="flex-1 py-8 px-4">
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Card 1: Điểm */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm text-center space-y-3">
              <div className="text-3xl">🍰</div>
              <h2 className="font-heading font-bold text-base md:text-lg text-foreground">
                Kết quả Writing — Part 2
              </h2>
              <div className="inline-block px-5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold text-sm">
                Điểm: 0/30
              </div>
            </div>

            {/* Card 2: Nhận xét của AI Kỳ Tích */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-foreground">
                  Nhận xét của AI Kỳ Tích
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                  0/30
                </span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {hasAnswer
                  ? "Đã ghi nhận bài làm — phần này không được chấm và không bị trừ lượt chấm AI."
                  : "Chưa làm bài — phần này không được chấm và không bị trừ lượt chấm AI"}
              </p>
            </div>

            {/* Card 3: Lỗi cần sửa */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-2">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                <span className="text-primary">✕</span>
                <span>Lỗi cần sửa</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Không phát hiện lỗi ngữ pháp/chính tả
              </p>
            </div>

            {/* Card 4: Bài band B1 của đề này */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span className="text-accent">🏆</span>
                  <span>Bài band B1 của đề này</span>
                </h3>
                <button
                  type="button"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Xem Bảng Kỳ Tích
                </button>
              </div>

              {/* 3 Thẻ bài mẫu B1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2 flex flex-col justify-between">
                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5 shrink-0 text-muted-foreground mt-0.5" />
                    <p className="line-clamp-4 leading-relaxed">
                      I&apos;d like to talk about a photo that I really like. It&apos;s a photo of my family taken during a trip to...
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-primary">
                    Học văn án danh
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2 flex flex-col justify-between">
                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5 shrink-0 text-muted-foreground mt-0.5" />
                    <p className="line-clamp-4 leading-relaxed">
                      I really like a photo of my family. We took it together during a family trip...
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-primary">
                    Học văn án danh
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2 flex flex-col justify-between">
                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5 shrink-0 text-muted-foreground mt-0.5" />
                    <p className="line-clamp-4 leading-relaxed">
                      I have a lot of pictures, but the favorite picture is the picture that have my family. My family...
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-primary">
                    Học văn án danh
                  </span>
                </div>
              </div>
            </div>

            {/* Card 5: Đề bài, bài làm & bài viết mẫu */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                <span>📝</span>
                <span>Đề bài, bài làm &amp; bài viết mẫu</span>
              </h3>

              <div className="space-y-2 text-xs md:text-sm">
                <span className="font-bold text-primary">{examTitle || "Writing Test"}</span>
                <p className="text-muted-foreground leading-relaxed">
                  {parts[1]?.instructions || "You are a new member of the club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes."}
                </p>
                <p className="font-medium text-foreground">
                  {parts[1]?.questions[0]?.prompt || "Tell us about your interests and why you want to join this club."}
                </p>
              </div>

              {/* Bài làm của bạn */}
              <div className="space-y-1 text-xs">
                <span className="font-semibold text-muted-foreground">Bài làm của bạn:</span>
                <div className="p-3 rounded-xl bg-muted/40 border border-border text-foreground font-sans min-h-[48px]">
                  {hasAnswer ? (
                    <p className="leading-relaxed">{part2Answer}</p>
                  ) : (
                    <span className="text-muted-foreground italic">(không có nội dung)</span>
                  )}
                </div>
              </div>

              {/* Bài mẫu tham khảo của đề */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span>💡</span>
                  <span>Bài mẫu tham khảo của đề</span>
                </span>
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 leading-relaxed font-sans">
                  {parts[1]?.questions[0]?.sampleAnswer || "I really enjoy participating in club activities because it helps me learn new things and meet great people."}
                </div>
              </div>
            </div>

            {/* Action Buttons theo theme hệ thống */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => setShowPart2Result(false)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <span>👁️</span>
                <span>Xem lại từng câu →</span>
              </button>
              <Link
                href="/writing"
                className="tech-btn inline-flex items-center justify-center px-8 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all"
              >
                Quay lại danh sách đề
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // MÀN HÌNH LÀM BÀI PHÒNG THI (THEO THEME CHUẨN CỦA HỆ THỐNG MÌNH)
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans select-none">
      {/* 1. TOP HEADER (THEO DESIGN SYSTEM CỦA DỰ ÁN) */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/writing"
            className="w-9 h-9 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Writing Practice
            </span>
            <span className="text-sm md:text-base font-bold text-foreground">
              {currentPart.partSubtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/writing"
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
                    Phần {currentPart.partNumber} / 4
                  </span>
                  <h2 className="font-heading font-bold text-base md:text-lg text-foreground">
                    {currentPart.partName}
                  </h2>
                </div>
                <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans pt-1">
                  {currentPart.instructions}
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

            {/* Part 2 Specific Prompt */}
            {currentPart.partNumber === 2 && (
              <div className="text-xs md:text-sm font-semibold text-foreground pt-1">
                {currentPart.questions[0]?.prompt || "Please tell us about yourself and your reasons for joining this club."}
              </div>
            )}
          </div>

          {/* 3. INPUT QUESTION CARDS */}
          {/* =========================================================================
              PART 1: 5 SHORT ANSWER QUESTIONS
              ========================================================================= */}
          {currentPart.partNumber === 1 && (
            <div className="space-y-4">
              {currentPart.questions.map((q, qIdx) => {
                const answerKey = `${currentPartIdx}_${qIdx}`;
                const val = answers[answerKey] || "";
                const words = getWordCount(val);

                return (
                  <div
                    key={q.questionNumber}
                    className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3"
                  >
                    <label className="text-xs md:text-sm font-semibold text-foreground block">
                      {q.prompt}
                    </label>
                    <textarea
                      rows={2}
                      value={val}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [answerKey]: e.target.value,
                        }))
                      }
                      placeholder="Type your answer..."
                      className="w-full p-3 rounded-xl border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans resize-y transition-all"
                    />
                    <div className="flex justify-end text-xs text-muted-foreground font-mono">
                      Words {words} / 10
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================================================================
              PART 2: FORM RESPONSE
              ========================================================================= */}
          {currentPart.partNumber === 2 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-3">
              <label className="text-xs md:text-sm font-semibold text-foreground block leading-relaxed">
                {currentPart.questions[0]?.prompt || "Please complete the club registration form in 20-30 words."}
              </label>
              <textarea
                rows={5}
                value={answers[`${currentPartIdx}_0`] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [`${currentPartIdx}_0`]: e.target.value,
                  }))
                }
                placeholder="Type your answer here"
                className="w-full p-4 rounded-xl border border-input bg-background text-foreground text-sm md:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans resize-y leading-relaxed transition-all"
              />
              <div className="flex justify-end text-xs text-muted-foreground font-mono">
                Words {getWordCount(answers[`${currentPartIdx}_0`])} / 45
              </div>
            </div>
          )}

          {/* =========================================================================
              PART 3: 3 CHAT QUESTIONS
              ========================================================================= */}
          {currentPart.partNumber === 3 && (
            <div className="space-y-4">
              {currentPart.questions.map((q, qIdx) => {
                const answerKey = `${currentPartIdx}_${qIdx}`;
                const val = answers[answerKey] || "";
                const words = getWordCount(val);

                return (
                  <div
                    key={q.questionNumber}
                    className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3"
                  >
                    <label className="text-xs md:text-sm font-semibold text-foreground block leading-relaxed">
                      {q.prompt}
                    </label>
                    <textarea
                      rows={3}
                      value={val}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [answerKey]: e.target.value,
                        }))
                      }
                      placeholder="Write your answer here (30-40 words)..."
                      className="w-full p-3.5 rounded-xl border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans resize-y leading-relaxed transition-all"
                    />
                    <div className="flex justify-end text-xs text-muted-foreground font-mono">
                      Words {words} / 60
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================================================================
              PART 4: 2 EMAILS (INFORMAL & FORMAL)
              ========================================================================= */}
          {currentPart.partNumber === 4 && (
            <div className="space-y-6">
              {currentPart.questions.map((q, qIdx) => {
                const answerKey = `${currentPartIdx}_${qIdx}`;
                const val = answers[answerKey] || "";
                const words = getWordCount(val);
                const isFormal = qIdx === 1;

                return (
                  <div
                    key={q.questionNumber}
                    className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3"
                  >
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-primary uppercase">
                        {isFormal ? "Task 2 — Formal Email" : "Task 1 — Informal Email"}
                      </span>
                      <label className="text-xs md:text-sm font-semibold text-foreground block leading-relaxed">
                        {q.prompt}
                      </label>
                    </div>

                    <textarea
                      rows={isFormal ? 8 : 4}
                      value={val}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [answerKey]: e.target.value,
                        }))
                      }
                      placeholder={
                        isFormal
                          ? "Write your formal letter to the secretary (120-150 words)..."
                          : "Write your informal note to your friend (~50 words)..."
                      }
                      className="w-full p-3.5 rounded-xl border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans resize-y leading-relaxed transition-all"
                    />
                    <div className="flex justify-end text-xs text-muted-foreground font-mono">
                      Words {words} / {isFormal ? 220 : 75}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* 4. BOTTOM BAR (THEO DESIGN SYSTEM CỦA DỰ ÁN) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border px-4 md:px-8 py-3 flex items-center justify-between z-40 shadow-lg">
        {/* Left: Hiện đáp án & Báo lỗi */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSampleAnswersModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 text-xs font-semibold transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Hiện đáp án</span>
          </button>

          <button
            type="button"
            onClick={() => alert("Chức năng ghi nhận báo lỗi đề thi đã được gửi đến ban quản trị.")}
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
            onClick={() => setShowPartsDrawer(true)}
            className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted text-xs font-bold transition-colors"
            title="Danh sách Parts"
          >
            <Menu className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => alert(`Đang làm bài: ${currentPart.partSubtitle}`)}
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

        {/* Right: Lượt chấm AI & Nút Submit */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            <span>⚡</span>
            <span>Còn {aiQuota} lượt chấm AI</span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="tech-btn inline-flex items-center gap-1.5 px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <span>Submit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* MODAL HIỆN ĐÁP ÁN THAM KHẢO */}
      {showSampleAnswersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                <span>💡</span>
                <span>Bài mẫu tham khảo — {currentPart.partSubtitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSampleAnswersModal(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              {currentPart.questions.map((q, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5">
                  <div className="font-semibold text-foreground">{q.prompt}</div>
                  <div className="text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                    {q.sampleAnswer || "Chưa có bài mẫu cho câu hỏi này."}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSampleAnswersModal(false)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER DANH SÁCH PARTS */}
      {showPartsDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm p-5 rounded-2xl bg-card border border-border shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-heading font-bold text-xs uppercase text-muted-foreground tracking-wider">
                Chuyển Part bài thi
              </h3>
              <button
                type="button"
                onClick={() => setShowPartsDrawer(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {parts.map((p, idx) => (
                <button
                  key={p.partNumber}
                  type="button"
                  onClick={() => {
                    setCurrentPartIdx(idx);
                    setShowPartsDrawer(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-colors ${
                    currentPartIdx === idx
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/40 hover:bg-muted text-foreground"
                  }`}
                >
                  <span>{p.partSubtitle}</span>
                  <span className="text-[10px] opacity-80">
                    {p.recommendedMinutes} phút
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          BACKUP CODE UI CŨ (GENERIC 2-COLUMN VIEW)
          Được comment lại theo yêu cầu của user để có thể phục hồi/backup bất cứ lúc nào:
          =========================================================================
      {false && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
              <div className="p-4 rounded-xl bg-muted/40 border border-border mb-6">
                <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
                  Ngữ cảnh đề bài:
                </span>
                <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans">
                  {currentPart.instructions}
                </p>
              </div>
              <h3 className="text-base md:text-lg font-heading font-bold text-foreground mb-4">
                {currentPart.questions[0]?.prompt}
              </h3>
              <textarea
                rows={8}
                value={answers[`${currentPartIdx}_0`] || ""}
                placeholder="Gõ bài viết tiếng Anh của bạn tại đây..."
                className="w-full p-4 rounded-xl border border-input bg-card text-foreground text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-sans leading-relaxed resize-y"
              />
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="font-heading font-bold text-sm text-foreground">
                  Kết quả đánh giá AI (CEFR)
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div>Mức độ hoàn thành đề bài (Task Response)</div>
                <div>Ngữ pháp & Cấu trúc câu (Grammar)</div>
                <div>Độ phong phú từ vựng (Lexical)</div>
              </div>
            </div>
          </div>
        </div>
      )}
      ========================================================================= */}
    </div>
  );
}

export default function WritingExamRunner() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <WritingExamRunnerContent />
    </Suspense>
  );
}
