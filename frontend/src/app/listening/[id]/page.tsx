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

interface ListeningExamData {
  title: string;
  durationMinutes: number;
  part1: Part1Item[];
  part2: {
    instructions: string;
    options: string[];
    speakers: Part2Speaker[];
  };
  part3: {
    topic: string;
    instructions: string;
    opinions: Part3Opinion[];
  };
  part4: Part4Recording[];
}

// Dữ liệu mẫu chuẩn Đề 01 Listening Aptis Kỳ Tích
const DEFAULT_LISTENING_TEST: ListeningExamData = {
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

function parseOptions(options: any): string[] {
  if (Array.isArray(options)) return options.map(String);
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // not json string
    }
    return [options];
  }
  return [];
}

function parseApiToListeningData(apiExam: any) {
  const result = {
    title: apiExam.title || DEFAULT_LISTENING_TEST.title,
    durationMinutes: apiExam.duration_minutes || DEFAULT_LISTENING_TEST.durationMinutes,
    part1: [...DEFAULT_LISTENING_TEST.part1],
    part2: { ...DEFAULT_LISTENING_TEST.part2 },
    part3: { ...DEFAULT_LISTENING_TEST.part3 },
    part4: [...DEFAULT_LISTENING_TEST.part4],
  };

  const parts = apiExam.parts || [];
  if (parts.length === 0) return result;

  for (const p of parts) {
    const pNum = p.part_number || p.partNumber;
    const pTitle = (p.title || "").toLowerCase();
    const questions = p.questions || [];

    // Part 1: Word Recognition
    if (pNum === 1 || pTitle.includes("part 1") || pTitle.includes("word recognition")) {
      if (questions.length > 0) {
        result.part1 = questions.map((q: any, idx: number) => ({
          id: String(q.id),
          num: q.question_number || idx + 1,
          prompt: q.prompt || "",
          options: parseOptions(q.options),
          correctAnswer: String(q.correct_answer || ""),
          explanation: q.explanation || "",
        }));
      }
    }
    // Part 2: Matching Information (Speakers)
    else if (pNum === 2 || pTitle.includes("part 2") || pTitle.includes("matching")) {
      const firstQ = questions[0];
      const partOptions = firstQ ? parseOptions(firstQ.options) : result.part2.options;
      result.part2 = {
        instructions: p.instructions || result.part2.instructions,
        options: partOptions.length > 0 ? partOptions : result.part2.options,
        speakers: questions.length > 0
          ? questions.map((q: any, idx: number) => ({
              id: String(q.id),
              speaker: q.prompt || `Speaker ${String.fromCharCode(65 + idx)}`,
              correctAnswer: String(q.correct_answer || ""),
              explanation: q.explanation || "",
            }))
          : result.part2.speakers,
      };
    }
    // Part 3: Short Conversations (Opinions)
    else if (pNum === 3 || pTitle.includes("part 3") || pTitle.includes("conversation") || pTitle.includes("opinion")) {
      result.part3 = {
        topic: p.passage_text || p.title || result.part3.topic,
        instructions: p.instructions || result.part3.instructions,
        opinions: questions.length > 0
          ? questions.map((q: any) => ({
              id: String(q.id),
              statement: q.prompt || "",
              correctAnswer: (q.correct_answer as "Man" | "Woman" | "Both") || "Both",
              explanation: q.explanation || "",
            }))
          : result.part3.opinions,
      };
    }
    // Part 4: Monologues (2 recordings)
    else if (pNum === 4 || pTitle.includes("part 4") || pTitle.includes("monologue")) {
      if (questions.length > 0) {
        const mid = Math.ceil(questions.length / 2);
        const rec1Questions = questions.slice(0, mid);
        const rec2Questions = questions.slice(mid);

        let rec1Text = p.passage_text || "Monologue 1";
        let rec2Text = "Monologue 2";
        if (p.passage_text && p.passage_text.includes("Recording 2:")) {
          const partsSplit = p.passage_text.split(/Recording 2:\s*/i);
          rec1Text = partsSplit[0].replace(/Recording 1:\s*/i, "").trim();
          rec2Text = partsSplit[1].trim();
        }

        result.part4 = [
          {
            recNum: 1,
            title: "Recording 1 of 2",
            passageText: rec1Text,
            questions: rec1Questions.map((q: any) => ({
              id: String(q.id),
              prompt: q.prompt || "",
              options: parseOptions(q.options),
              correctAnswer: String(q.correct_answer || ""),
              explanation: q.explanation || "",
            })),
          },
          {
            recNum: 2,
            title: "Recording 2 of 2",
            passageText: rec2Text,
            questions: rec2Questions.map((q: any) => ({
              id: String(q.id),
              prompt: q.prompt || "",
              options: parseOptions(q.options),
              correctAnswer: String(q.correct_answer || ""),
              explanation: q.explanation || "",
            })),
          },
        ];
      }
    }
  }

  return result;
}

function ListeningExamRunnerContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = params.id as string;
  const modeParam = searchParams?.get("mode");
  const submissionIdParam = searchParams?.get("submissionId");

  const [examData, setExamData] = useState<ListeningExamData>(DEFAULT_LISTENING_TEST);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(submissionIdParam || null);

  // Active Stage Index (1 to 17 exercises total):
  // 0..12: Part 1 (13 questions)
  // 13: Part 2 (1 question with 4 speakers)
  // 14: Part 3 (1 question with 4 opinions)
  // 15: Part 4 Recording 1 (2 questions)
  // 16: Part 4 Recording 2 (2 questions)
  const [activeStage, setActiveStage] = useState(0);

  // Review Mode State
  const [reviewMode, setReviewMode] = useState(modeParam === "review");
  const [reviewQuestionIdx, setReviewQuestionIdx] = useState(0); // 0..24 (total 25 questions)

  // Answers State:
  // p1: { [qIdx]: string }
  // p2: { [speakerIdx]: string }
  // p3: { [opinionIdx]: "Man" | "Woman" | "Both" }
  // p4: { [recIdx_qIdx]: string }
  const [p1Answers, setP1Answers] = useState<Record<number, string>>({});
  const [p2Answers, setP2Answers] = useState<Record<number, string>>({});
  const [p3Answers, setP3Answers] = useState<Record<number, "Man" | "Woman" | "Both">>({});
  const [p4Answers, setP4Answers] = useState<Record<string, string>>({});

  // Audio Play Simulation / Controller
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCounts, setPlayCounts] = useState<Record<number, number>>({});
  const [playbackProgress, setPlaybackProgress] = useState(0);

  // Timer & UI states
  const [timeLeft, setTimeLeft] = useState(40 * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(modeParam === "review");
  const [showSampleAnswers, setShowSampleAnswers] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const totalAnsweredCount =
    Object.keys(p1Answers).length +
    Object.keys(p2Answers).length +
    Object.keys(p3Answers).length +
    Object.keys(p4Answers).length;
  const totalQuestionsCount = 25;

  // Tự động nhảy tới Part nếu URL có ?part=p1 / p2 / p3 / p4
  useEffect(() => {
    const partQuery = searchParams?.get("part");
    if (partQuery === "p1") setActiveStage(0);
    else if (partQuery === "p2") setActiveStage(13);
    else if (partQuery === "p3") setActiveStage(14);
    else if (partQuery === "p4") setActiveStage(15);
  }, [searchParams]);

  // Khởi tạo Database Submission (chỉ khi làm mới)
  useEffect(() => {
    async function initSubmission() {
      if (modeParam === "review" || submissionIdParam) return;
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
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
  }, [examId, modeParam, submissionIdParam]);

  // Load đề thi từ backend & tải submission cũ nếu có mode=review
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.exams.getQuestions(examId);
        if (res.success && res.data) {
          const parsed = parseApiToListeningData(res.data);
          setExamData(parsed);
          setTimeLeft((parsed.durationMinutes || 40) * 60);

          // Tải submission nếu ở review mode
          if (submissionIdParam) {
            try {
              const subRes = await api.submissions.getResult(submissionIdParam);
              if (subRes.success && subRes.data) {
                const sub = subRes.data;
                setIsSubmitted(true);
                setReviewMode(true);
                const loadedP1: Record<number, string> = {};
                const loadedP2: Record<number, string> = {};
                const loadedP3: Record<number, "Man" | "Woman" | "Both"> = {};
                const loadedP4: Record<string, string> = {};

                (sub.answers || []).forEach((ans: any, idx: number) => {
                  const opt = ans.selected_option || ans.selectedOption || "";
                  const qId = ans.question_id || ans.questionId;

                  let matched = false;
                  if (qId) {
                    const p1Idx = parsed.part1.findIndex((q) => q.id === qId);
                    if (p1Idx >= 0) { loadedP1[p1Idx] = opt; matched = true; }
                    if (!matched) {
                      const p2Idx = parsed.part2.speakers.findIndex((s) => s.id === qId);
                      if (p2Idx >= 0) { loadedP2[p2Idx] = opt; matched = true; }
                    }
                    if (!matched) {
                      const p3Idx = parsed.part3.opinions.findIndex((o) => o.id === qId);
                      if (p3Idx >= 0) { loadedP3[p3Idx] = opt as any; matched = true; }
                    }
                    if (!matched) {
                      for (let r = 0; r < parsed.part4.length; r++) {
                        const qIdx = parsed.part4[r].questions.findIndex((q) => q.id === qId);
                        if (qIdx >= 0) { loadedP4[`${r}_${qIdx}`] = opt; matched = true; break; }
                      }
                    }
                  }

                  if (!matched) {
                    if (idx < 13) {
                      loadedP1[idx] = opt;
                    } else if (idx < 17) {
                      loadedP2[idx - 13] = opt;
                    } else if (idx < 21) {
                      loadedP3[idx - 17] = opt as any;
                    } else {
                      const recIdx = idx < 23 ? 0 : 1;
                      const qIdx = idx % 2;
                      loadedP4[`${recIdx}_${qIdx}`] = opt;
                    }
                  }
                });

                if (Object.keys(loadedP1).length > 0) setP1Answers(loadedP1);
                if (Object.keys(loadedP2).length > 0) setP2Answers(loadedP2);
                if (Object.keys(loadedP3).length > 0) setP3Answers(loadedP3);
                if (Object.keys(loadedP4).length > 0) setP4Answers(loadedP4);
              }
            } catch (e) {
              console.warn("Could not load listening submission result:", e);
            }
          }
        }
      } catch (err) {
        console.warn("Using default listening exam:", err);
      } finally {
        setLoading(false);
      }
    }
    if (examId) load();
  }, [examId, submissionIdParam]);

  // Timer đếm ngược
  useEffect(() => {
    if (loading || isPaused || isSubmitted || reviewMode) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, isPaused, isSubmitted, reviewMode]);

  // Audio simulation timer
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackProgress((p) => {
          if (p >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return p + 4;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Reset audio state khi đổi câu hỏi
  useEffect(() => {
    setIsPlaying(false);
    setPlaybackProgress(0);
  }, [activeStage]);

  const togglePlayAudio = () => {
    const currentCount = playCounts[activeStage] || 0;
    if (currentCount >= 2 && !isPlaying) {
      alert("Bạn đã nghe tối đa 2 lần cho đoạn ghi âm này!");
      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (playbackProgress === 0) {
        setPlayCounts((prev) => ({
          ...prev,
          [activeStage]: currentCount + 1,
        }));
      }
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

  const handleSubmitExam = async () => {
    setIsSubmitModalOpen(false);
    setIsSubmitted(true);

    if (submissionId) {
      try {
        const answersPayload: any[] = [];
        examData.part1.forEach((q, idx) => {
          if (q.id && p1Answers[idx]) {
            answersPayload.push({
              questionId: q.id,
              selectedOption: p1Answers[idx],
            });
          }
        });
        examData.part2.speakers.forEach((s, idx) => {
          if (s.id && p2Answers[idx]) {
            answersPayload.push({
              questionId: s.id,
              selectedOption: p2Answers[idx],
            });
          }
        });
        examData.part3.opinions.forEach((o, idx) => {
          if (o.id && p3Answers[idx]) {
            answersPayload.push({
              questionId: o.id,
              selectedOption: p3Answers[idx],
            });
          }
        });
        examData.part4.forEach((rec, recIdx) => {
          rec.questions.forEach((q, qIdx) => {
            if (q.id && p4Answers[`${recIdx}_${qIdx}`]) {
              answersPayload.push({
                questionId: q.id,
                selectedOption: p4Answers[`${recIdx}_${qIdx}`],
              });
            }
          });
        });

        if (answersPayload.length > 0) {
          await api.submissions.autosave(submissionId, answersPayload);
        }
        await api.submissions.submit(submissionId);
      } catch (err) {
        console.error("Submit listening error:", err);
      }
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
  // MÀN HÌNH KẾT QUẢ & REVIEW LISTENING (THEO THEME CHUẨN CỦA HỆ THỐNG)
  // =========================================================================
  if (isSubmitted && !reviewMode) {
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
                  onClick={() => {
                    setReviewMode(true);
                    setReviewQuestionIdx(0);
                  }}
                  className="px-4 py-2 rounded-xl border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem lại từng câu →</span>
                </button>

                <Link
                  href="/history"
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors"
                >
                  Lịch sử làm bài
                </Link>

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
                    setReviewMode(false);
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
  // REVIEW MODE CHI TIẾT (XEM LẠI ĐÁP ÁN ĐÚNG/SAI, TRANSCRIPT, GIẢI THÍCH)
  // =========================================================================
  if (isSubmitted && reviewMode) {
    // 25 câu hỏi tổng hợp
    const reviewList = [
      // 0..12: Part 1
      ...examData.part1.map((q, idx) => ({
        globalIdx: idx,
        partNumber: 1,
        partName: "Part 1 – Word Recognition",
        prompt: q.prompt,
        options: q.options,
        correctAnswer: q.correctAnswer,
        userAnswer: p1Answers[idx] || "",
        isCorrect: p1Answers[idx] === q.correctAnswer,
        explanation: q.explanation,
        transcript: q.explanation || "Nội dung hội thoại ngắn kiểm tra khả năng bắt từ và nhận diện thông tin chi tiết.",
      })),
      // 13..16: Part 2
      ...examData.part2.speakers.map((s, idx) => ({
        globalIdx: 13 + idx,
        partNumber: 2,
        partName: "Part 2 – Matching Information",
        prompt: `Speaker ${s.speaker}: Người nói đề cập đến chủ đề gì?`,
        options: [
          "A bad holiday",
          "A sports event",
          "A business trip",
          "A family party",
          "A musical concert",
          "A school excursion",
        ],
        correctAnswer: s.correctAnswer,
        userAnswer: p2Answers[idx] || "",
        isCorrect: p2Answers[idx] === s.correctAnswer,
        explanation: s.explanation,
        transcript: `Lời thoại của ${s.speaker}: ${s.explanation}`,
      })),
      // 17..20: Part 3
      ...examData.part3.opinions.map((o, idx) => ({
        globalIdx: 17 + idx,
        partNumber: 3,
        partName: "Part 3 – Short Conversations",
        prompt: `Ý kiến: "${o.statement}" — Ai đồng ý với nhận định này?`,
        options: ["Man", "Woman", "Both"],
        correctAnswer: o.correctAnswer,
        userAnswer: p3Answers[idx] || "",
        isCorrect: p3Answers[idx] === o.correctAnswer,
        explanation: o.explanation,
        transcript: `Đoạn đối thoại giữa hai người (Man & Woman) thể hiện quan điểm. Chi tiết: ${o.explanation}`,
      })),
      // 21..24: Part 4
      ...(examData.part4[0]?.questions || []).map((q, idx) => ({
        globalIdx: 21 + idx,
        partNumber: 4,
        partName: "Part 4 – Monologues (Bài 1)",
        prompt: q.prompt,
        options: q.options,
        correctAnswer: q.correctAnswer,
        userAnswer: p4Answers[`0_${idx}`] || "",
        isCorrect: p4Answers[`0_${idx}`] === q.correctAnswer,
        explanation: q.explanation,
        transcript: examData.part4[0]?.passageText || "",
      })),
      ...(examData.part4[1]?.questions || []).map((q, idx) => ({
        globalIdx: 23 + idx,
        partNumber: 4,
        partName: "Part 4 – Monologues (Bài 2)",
        prompt: q.prompt,
        options: q.options,
        correctAnswer: q.correctAnswer,
        userAnswer: p4Answers[`1_${idx}`] || "",
        isCorrect: p4Answers[`1_${idx}`] === q.correctAnswer,
        explanation: q.explanation,
        transcript: examData.part4[1]?.passageText || "",
      })),
    ];

    const currentRev = reviewList[reviewQuestionIdx] || reviewList[0];

    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
        {/* Header Review Bar */}
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setReviewMode(false)}
              className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Quay lại bảng kết quả"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                  Xem lại bài làm
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  {results.totalScore}/50 · Band {results.cefr}
                </span>
              </div>
              <span className="text-xs md:text-sm font-bold text-foreground">
                {examData.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReviewMode(false)}
              className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors"
            >
              Xem bảng điểm
            </button>
            <Link
              href="/listening"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Thoát</span>
            </Link>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 py-6 px-4 md:px-8 max-w-4xl mx-auto w-full space-y-6">
          {/* Quick Heatmap Navigator (25 câu) */}
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>Danh sách câu hỏi (25 câu):</span>
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Đúng ({results.totalCorrect})
                </span>
                <span className="flex items-center gap-1 text-rose-600 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Sai ({25 - results.totalCorrect})
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {reviewList.map((item, idx) => {
                const isCurrent = idx === reviewQuestionIdx;
                const isCor = item.isCorrect;
                const hasAnswer = !!item.userAnswer;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReviewQuestionIdx(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center border ${
                      isCurrent
                        ? "ring-2 ring-primary ring-offset-2 scale-110 z-10"
                        : ""
                    } ${
                      isCor
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25"
                        : hasAnswer
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25"
                        : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                    }`}
                    title={`Câu ${idx + 1}: ${isCor ? "Đúng" : hasAnswer ? "Sai" : "Chưa làm"}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Question Review Card */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
            {/* Question Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    {currentRev.partName}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    Câu {currentRev.globalIdx + 1}/25
                  </span>
                </div>
                <h3 className="font-heading font-bold text-base text-foreground mt-1">
                  {currentRev.prompt}
                </h3>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {currentRev.isCorrect ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Chính xác (+2đ)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span>{currentRev.userAnswer ? "Chưa đúng (0đ)" : "Chưa trả lời (0đ)"}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Options Comparison */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                So sánh lựa chọn &amp; Đáp án đúng:
              </span>

              <div className="space-y-2">
                {currentRev.options.map((opt, oIdx) => {
                  const isUserPick = opt === currentRev.userAnswer;
                  const isRight = opt === currentRev.correctAnswer;

                  return (
                    <div
                      key={oIdx}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs md:text-sm font-medium transition-all ${
                        isRight
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-200"
                          : isUserPick && !isRight
                          ? "bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-200"
                          : "bg-muted/20 border-border text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isRight
                              ? "bg-emerald-500 text-white"
                              : isUserPick && !isRight
                              ? "bg-rose-500 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isRight ? "✓" : isUserPick ? "✕" : String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="truncate">{opt}</span>
                      </div>

                      <div className="shrink-0 text-right">
                        {isRight && (
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                            {isUserPick ? "✓ Bạn chọn đúng" : "Đáp án đúng"}
                          </span>
                        )}
                        {isUserPick && !isRight && (
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-[11px]">
                            ✕ Lựa chọn của bạn
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audio Script / Transcript Box */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Volume2 className="w-4 h-4" />
                <span>Audio Script / Lời thoại bóc băng:</span>
              </div>
              <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans italic bg-background/50 p-3 rounded-lg border border-border/50">
                &ldquo;{currentRev.transcript}&rdquo;
              </p>
            </div>

            {/* Explanation Box */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Giải thích chi tiết &amp; Từ khóa phân tích:</span>
              </div>
              <p className="text-xs md:text-sm text-foreground leading-relaxed">
                {currentRev.explanation}
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                type="button"
                disabled={reviewQuestionIdx === 0}
                onClick={() => setReviewQuestionIdx((p) => p - 1)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Câu trước</span>
              </button>

              <span className="text-xs text-muted-foreground font-mono font-bold">
                {reviewQuestionIdx + 1} / {reviewList.length}
              </span>

              <button
                type="button"
                disabled={reviewQuestionIdx === reviewList.length - 1}
                onClick={() => setReviewQuestionIdx((p) => p + 1)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
              >
                <span>Câu tiếp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
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
    <div className="notranslate exam-active exam-mode min-h-screen bg-exam-bg text-exam-text flex flex-col font-sans select-none">
      {/* 0. Top thin progress bar */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
        <div
          className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-500"
          style={{ width: `${((activeStage + 1) / 17) * 100}%` }}
        />
      </div>

      {/* 1. TOP HEADER (EXAM MODE) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-exam-surface/95 backdrop-blur border-b border-exam-border">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-bold text-exam-text truncate hidden sm:block">
              {examData.title}
            </span>
            <span className="text-[10px] text-exam-text-muted hidden md:inline">
              Listening Aptis ESOL
            </span>
          </div>

          {/* Countdown Timer */}
          <div
            className={`font-mono text-base font-black px-3 py-1 rounded-lg border flex items-center gap-1.5 ${
              timeLeft < 300
                ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse"
                : "bg-exam-bg border-exam-border text-exam-text"
            }`}
          >
            <Clock className="w-4 h-4 text-primary" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-exam-text-muted">
              {totalAnsweredCount}/{totalQuestionsCount} câu
            </span>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 pt-16 pb-24 px-3 md:px-6 overflow-y-auto">
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

              {/* Pause & Playback control */}
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="px-3 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted font-medium transition-colors flex items-center gap-1.5"
                  title={isPaused ? "Tiếp tục" : "Tạm dừng"}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? "Tiếp tục" : "Tạm dừng"}</span>
                </button>
              </div>
            </div>

            {/* Trình phát Audio thanh lịch theo theme hệ thống */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col sm:flex-row items-center gap-4">
              <button
                type="button"
                onClick={togglePlayAudio}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-glow shadow-md transition-all shrink-0"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <div className="flex-1 w-full space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                  <span>{isPlaying ? "Đang phát audio..." : "Sẵn sàng nghe"}</span>
                  <span>Đã nghe: {playCounts[activeStage] || 0}/2 lần</span>
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

      {/* 4. FIXED BOTTOM BAR CHUẨN EXAM MODE */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-exam-surface/95 backdrop-blur border-t border-exam-border h-14">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          {/* Left: Question Drawer & Info */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDrawer(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-exam-surface border border-exam-border text-exam-text text-xs font-bold hover:bg-exam-border/40 transition-colors cursor-pointer"
              title="Danh sách câu hỏi"
            >
              <Menu className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Danh sách ({totalAnsweredCount}/{totalQuestionsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsInfoOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-exam-surface border border-exam-border text-exam-text hover:bg-exam-border/40 transition-colors cursor-pointer"
              title="Thông tin bài thi"
            >
              <Info className="w-4 h-4 text-exam-text-muted" />
            </button>

            <button
              type="button"
              onClick={() => setShowSampleAnswers(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-exam-surface border border-exam-border text-exam-text text-xs font-bold hover:bg-exam-border/40 transition-colors cursor-pointer"
            >
              <span>💡 Đáp án mẫu</span>
            </button>
          </div>

          {/* Right: Exit, Previous, Next / Submit */}
          <div className="flex items-center gap-2">
            <Link
              href="/listening"
              title="Thoát"
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-exam-surface border border-exam-border text-exam-text hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => setActiveStage((p) => Math.max(0, p - 1))}
              disabled={activeStage === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-exam-surface border border-exam-border text-exam-text text-sm font-medium hover:bg-exam-border/40 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeStage === 16) {
                  setIsSubmitModalOpen(true);
                } else {
                  setActiveStage((p) => Math.min(16, p + 1));
                }
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-brand-brown text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              <span>{activeStage === 16 ? "Nộp bài" : "Next"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL THÔNG TIN BÀI THI */}
      {isInfoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsInfoOpen(false)}
        >
          <div
            className="bg-exam-surface border border-exam-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-exam-border">
              <h4 className="font-bold text-sm text-exam-text">Thông tin bài thi Listening</h4>
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded text-exam-text-muted hover:text-exam-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-exam-text">
              {[
                { l: "Tên bài thi", v: examData.title },
                { l: "Kỹ năng", v: "Listening Aptis ESOL (4 Parts · 25 câu)" },
                { l: "Thời lượng", v: `${examData.durationMinutes} phút` },
                { l: "Đã hoàn thành", v: `${totalAnsweredCount}/${totalQuestionsCount} câu` },
                { l: "Thời gian còn lại", v: formatTime(timeLeft) },
              ].map((x) => (
                <div key={x.l} className="flex justify-between">
                  <span className="text-exam-text-muted">{x.l}:</span>
                  <span className="font-bold">{x.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN NỘP BÀI */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-exam-surface rounded-2xl border border-exam-border p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-exam-text">Xác nhận nộp bài thi Listening?</h3>
            <p className="text-sm text-exam-text-muted leading-relaxed">
              Bạn đã hoàn thành <strong className="text-primary font-black">{totalAnsweredCount}/{totalQuestionsCount}</strong> câu hỏi. Hệ thống sẽ tiến hành chấm điểm và lập báo cáo kết quả.
            </p>
            {totalAnsweredCount < totalQuestionsCount && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                ⚠️ Lưu ý: Bạn vẫn còn {totalQuestionsCount - totalAnsweredCount} câu chưa làm xong!
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-exam-border text-exam-text text-xs font-bold hover:bg-exam-border/40 transition-colors cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={handleSubmitExam}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-brand-brown transition-colors shadow-sm cursor-pointer"
              >
                Xác nhận nộp bài
              </button>
            </div>
          </div>
        </div>
      )}

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
