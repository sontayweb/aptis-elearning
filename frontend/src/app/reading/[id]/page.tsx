"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Send,
  Flag,
  RotateCcw,
  Sparkles,
  BookOpen,
  Trophy,
  ChevronUp,
  ChevronDown,
  Award,
  HelpCircle,
  X,
  RefreshCw,
  Check,
} from "lucide-react";

/* ====================================================
   DATA TYPES & INTERFACES
   ==================================================== */
export interface Part1Gap {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
}

export interface Part2Story {
  id: string;
  title: string;
  fixedSentence: string;
  sentences: { id: string; text: string }[];
  correctOrder: string[];
}

export interface Part3Review {
  person: string;
  name: string;
  review: string;
}

export interface Part3Question {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
}

export interface Part4Paragraph {
  id: string;
  paragraphNumber: number;
  text: string;
  correctHeading: string;
}

export interface ReadingExamData {
  id: string;
  title: string;
  durationMinutes: number;
  part1: {
    instructions: string;
    exampleText: { prefix: string; word: string; suffix: string };
    gaps: Part1Gap[];
  };
  part2: {
    instructions: string;
    stories: Part2Story[];
  };
  part3: {
    title: string;
    instructions: string;
    reviews: Part3Review[];
    questions: Part3Question[];
  };
  part4: {
    title: string;
    instructions: string;
    allHeadings: string[];
    paragraphs: Part4Paragraph[];
  };
}

/* ====================================================
   DEFAULT READING TEST BENCHMARK DATA
   ==================================================== */
const DEFAULT_READING_TEST: ReadingExamData = {
  id: "reading-01",
  title: "Đề 01 — Full Reading · 4 Parts",
  durationMinutes: 35,
  part1: {
    instructions: "Choose the word that fits in the gap. The first one is done for you.",
    exampleText: {
      prefix: "I",
      word: "live",
      suffix: "in a flat.",
    },
    gaps: [
      {
        id: "p1-q1",
        prompt: "I [gap] it with my friend.",
        options: ["share", "keep", "send"],
        correctAnswer: "share",
      },
      {
        id: "p1-q2",
        prompt: "We are in the same [gap].",
        options: ["class", "room", "team"],
        correctAnswer: "class",
      },
      {
        id: "p1-q3",
        prompt: "We [gap] to work.",
        options: ["walk", "smile", "ride"],
        correctAnswer: "walk",
      },
      {
        id: "p1-q4",
        prompt: "We like to [gap] dinner.",
        options: ["cook", "make", "eat"],
        correctAnswer: "cook",
      },
    ],
  },
  part2: {
    instructions: "The sentences below make a complete text. Put them in the correct order.",
    stories: [
      {
        id: "p2-s1",
        title: "Delivery instructions",
        fixedSentence: "You should arrive at the main office by 6.30am and collect your keys",
        sentences: [
          { id: "s3", text: "You must follow the route on the map to deliver packages" },
          { id: "s2", text: "In the office, you can also collect a map of your route" },
          { id: "s5", text: "You must return your keys to the office manager after you get back" },
          { id: "s4", text: "When you have completed all deliveries, return to your office" },
        ],
        correctOrder: ["s2", "s3", "s4", "s5"],
      },
      {
        id: "p2-s2",
        title: "Tom Harper",
        fixedSentence: "When he was young, he began writing short stories for a magazine",
        sentences: [
          { id: "th-4", text: "the characters he imagined were one of the most famous in the world" },
          { id: "th-2", text: "he soon wrote regularly for the magazine, but he was not satisfied" },
          { id: "th-5", text: "this popularity made Tom Harper rich and successful." },
          { id: "th-3", text: "he almost left the magazine, but then he decided to create some unusual new characters" },
        ],
        correctOrder: ["th-2", "th-3", "th-4", "th-5"],
      },
    ],
  },
  part3: {
    title: "Opinions on a new restaurant",
    instructions: "Four people write reviews of a new restaurant in their town on a website. Read the texts and then answer the questions below.",
    reviews: [
      {
        person: "Person A",
        name: "Person A",
        review: "I'm not sure if I will return to this restaurant. I think the staff was arguing when I got there, because the atmosphere here was not very comfortable. As for the food, I think there's nothing to write about. I ordered fish and chips, it wasn't bad, but it wasn't good either. But many people say that the food here is fabulous. So, I think I'm an exception.",
      },
      {
        person: "Person B",
        name: "Person B",
        review: "This is a very famous restaurant that I saw in the newspaper. Sadly, I arrived later than the rest of the party, so I didn't get to order dinner. However, I ordered orange juice and mango juice and they were both delicious. What about the surroundings? Lively music along with fashionable and appropriate decor makes me feel very comfortable.",
      },
      {
        person: "Person C",
        name: "Person C",
        review: "I don't understand why this restaurant is so famous. When I arrived and saw a menu with lots of different dishes, I saw this as a bad sign. Furthermore, the menu with traditional dishes contrasting with the modern decoration style made me feel very confused and strange. The waiters here were also not friendly. This was one of my worst experiences eating at a restaurant.",
      },
      {
        person: "Person D",
        name: "Person D",
        review: "This is my first time coming to this restaurant. The food is very cheap but the quality is excellent. I was very surprised with the starter because its menu is very diverse. But there is one thing that I want the restaurant to improve. The restaurant band played live music but it was very far away, so the sound was very low and it didn't make the meal atmosphere lively. Next time turn the music louder, please!",
      },
    ],
    questions: [
      { id: "p3-q1", prompt: "Who enjoyed the atmosphere?", options: ["Person A", "Person B", "Person C", "Person D"], correctAnswer: "Person B" },
      { id: "p3-q2", prompt: "Who thought the music was too quiet?", options: ["Person A", "Person B", "Person C", "Person D"], correctAnswer: "Person D" },
      { id: "p3-q3", prompt: "Who didn't eat anything at the restaurant?", options: ["Person A", "Person B", "Person C", "Person D"], correctAnswer: "Person B" },
      { id: "p3-q4", prompt: "Who will definitely not return to the restaurant?", options: ["Person A", "Person B", "Person C", "Person D"], correctAnswer: "Person C" },
      { id: "p3-q5", prompt: "Who thought their bad experience was probably unusual?", options: ["Person A", "Person B", "Person C", "Person D"], correctAnswer: "Person A" },
      { id: "p3-q6", prompt: "Who was impressed by the range of appetizers?", options: ["Person A", "Person B", "Person C", "Person D"], correctAnswer: "Person D" },
      { id: "p3-q7", prompt: "Who thought the food was of average quality?", options: ["Person A", "Person B", "Person C", "Person D"], correctAnswer: "Person A" },
    ],
  },
  part4: {
    title: "Children and Exercises",
    instructions: "Read the passage quickly. Choose a heading for each numbered paragraph from the drop-down box.",
    allHeadings: [
      "Technology is not the only cause of inactivity",
      "The physical and mental perils of sedentary life",
      "Schools leading the fitness transformation",
      "Parental encouragement makes a vital difference",
      "Redesigning community and recreational spaces",
      "The long-term economic burden of health issues",
      "Small daily habits for lifelong wellbeing",
    ],
    paragraphs: [
      {
        id: "p4-p1",
        paragraphNumber: 1,
        text: "Recent research into childhood health reveals that children around the world are spending significantly less time being physically active than previous generations. While computer games and smartphones are frequently cited as the main culprits, experts emphasize that modern lifestyle changes, parental safety concerns, and reduced outdoor free play are equally responsible.",
        correctHeading: "Technology is not the only cause of inactivity",
      },
      {
        id: "p4-p2",
        paragraphNumber: 2,
        text: "The lack of regular exercise has immediate and far-reaching consequences on young bodies and minds. Pediatricians report rising rates of early cardiovascular risk factors and poor bone density, alongside increased anxiety and reduced concentration spans during school hours.",
        correctHeading: "The physical and mental perils of sedentary life",
      },
      {
        id: "p4-p3",
        paragraphNumber: 3,
        text: "Educational institutions are beginning to recognize their critical role in reversing this trend. Several pioneering schools have introduced active learning desks, short physical exercise breaks between lessons, and daily physical education that focuses on personal enjoyment rather than intense competition.",
        correctHeading: "Schools leading the fitness transformation",
      },
      {
        id: "p4-p4",
        paragraphNumber: 4,
        text: "Beyond the classroom, family habits play a pivotal role. When parents participate in outdoor weekend activities, cycle to local markets, or simply walk together after dinner, children naturally adopt positive attitudes toward staying active.",
        correctHeading: "Parental encouragement makes a vital difference",
      },
      {
        id: "p4-p5",
        paragraphNumber: 5,
        text: "Urban planners are also being called upon to create safer environments for active youth. Installing protected cycling corridors, well-lit neighborhood parks, and community sports zones allows teenagers to engage in spontaneous sports safely.",
        correctHeading: "Redesigning community and recreational spaces",
      },
      {
        id: "p4-p6",
        paragraphNumber: 6,
        text: "If these sedentary trends continue unchecked, public healthcare systems will face staggering costs treating lifestyle-related chronic conditions in future adults. Economists project that preventative physical education programs could save billions annually.",
        correctHeading: "The long-term economic burden of health issues",
      },
      {
        id: "p4-p7",
        paragraphNumber: 7,
        text: "Ultimately, experts suggest that building a healthier generation does not require extreme athletic training. Simple changes such as walking up the stairs, participating in household chores, and taking brief active breaks can cultivate durable habits for lifelong wellbeing.",
        correctHeading: "Small daily habits for lifelong wellbeing",
      },
    ],
  },
};

export default function ReadingExamPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-muted-foreground">Đang tải đề thi Reading...</p>
          </div>
        </div>
      }
    >
      <ReadingExamRunner />
    </Suspense>
  );
}

function ReadingExamRunner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = (params.id as string) || "reading-01";
  const partParam = searchParams.get("part"); // "1" | "2" | "4" | "5" | null

  const { isAuthenticated, user } = useAuth();

  // Active Stage: 0 (Part 1), 1 (Part 2 - Story 1), 2 (Part 2 - Story 2), 3 (Part 4 - Opinions), 4 (Part 5 - Long Reading)
  const [activeStage, setActiveStage] = useState(0);

  // Exam Data
  const [examData, setExamData] = useState<ReadingExamData>(DEFAULT_READING_TEST);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Time & Submission State
  const [timeLeft, setTimeLeft] = useState(35 * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // Answers State
  const [p1Answers, setP1Answers] = useState<Record<string, string>>({});
  const [p2Orders, setP2Orders] = useState<Record<string, string[]>>({});
  const [p3Answers, setP3Answers] = useState<Record<string, string>>({});
  const [p4Answers, setP4Answers] = useState<Record<string, string>>({});

  // Flagged questions
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});

  // Result state
  const [resultScore, setResultScore] = useState<number>(0);
  const [cefrBand, setCefrBand] = useState<string>("B1");
  const [partScores, setPartScores] = useState<
    { name: string; score: number; maxScore: number; correct: number; total: number }[]
  >([]);

  // 1. Initial Load: Fetch questions from API or use Benchmark
  useEffect(() => {
    async function loadReadingExam() {
      try {
        setLoading(true);
        setError(null);

        const res = await api.exams.getQuestions(examId);
        if (res.success && res.data) {
          const apiData = res.data;
          const parsed = parseApiToReadingData(apiData);
          setExamData(parsed);
          setTimeLeft((apiData.duration_minutes || 35) * 60);

          // Initialize Part 2 sentences default order
          const initialP2Orders: Record<string, string[]> = {};
          parsed.part2.stories.forEach((st) => {
            initialP2Orders[st.id] = st.sentences.map((s) => s.id);
          });
          setP2Orders(initialP2Orders);
        } else {
          // Use default benchmark
          setExamData(DEFAULT_READING_TEST);
          const initialP2Orders: Record<string, string[]> = {};
          DEFAULT_READING_TEST.part2.stories.forEach((st) => {
            initialP2Orders[st.id] = st.sentences.map((s) => s.id);
          });
          setP2Orders(initialP2Orders);
        }
      } catch (err: any) {
        console.warn("Using offline benchmark reading data:", err);
        setExamData(DEFAULT_READING_TEST);
        const initialP2Orders: Record<string, string[]> = {};
        DEFAULT_READING_TEST.part2.stories.forEach((st) => {
          initialP2Orders[st.id] = st.sentences.map((s) => s.id);
        });
        setP2Orders(initialP2Orders);
      } finally {
        setLoading(false);
      }
    }

    loadReadingExam();
  }, [examId]);

  // Adjust activeStage if URL contains ?part=
  useEffect(() => {
    if (partParam === "1") setActiveStage(0);
    else if (partParam === "2") setActiveStage(1);
    else if (partParam === "4") setActiveStage(3);
    else if (partParam === "5") setActiveStage(4);
  }, [partParam]);

  // 2. Countdown Timer
  useEffect(() => {
    if (isSubmitted || loading) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, loading]);

  // 3. Init Database Submission
  useEffect(() => {
    async function initSubmission() {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token || !examId || submissionId) return;
      try {
        const res = await api.submissions.start(examId);
        if (res.success && res.data) {
          setSubmissionId(res.data.submissionId || res.data.id);
        }
      } catch (e) {
        console.warn("Offline reading session:", e);
      }
    }
    initSubmission();
  }, [examId]);

  // Helper format time
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  // Reorder sentences helper in Part 2
  const handleMoveSentence = (storyId: string, index: number, direction: "up" | "down") => {
    if (isSubmitted) return;
    const currentOrder = [...(p2Orders[storyId] || [])];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentOrder.length) return;

    const temp = currentOrder[index];
    currentOrder[index] = currentOrder[targetIdx];
    currentOrder[targetIdx] = temp;

    setP2Orders((prev) => ({
      ...prev,
      [storyId]: currentOrder,
    }));
  };

  const handleResetStoryOrder = (storyId: string) => {
    if (isSubmitted) return;
    const story = examData.part2.stories.find((s) => s.id === storyId);
    if (!story) return;
    setP2Orders((prev) => ({
      ...prev,
      [storyId]: story.sentences.map((s) => s.id),
    }));
  };

  // Total questions count calculation
  const totalQuestionsCount =
    examData.part1.gaps.length +
    examData.part2.stories.length +
    examData.part3.questions.length +
    examData.part4.paragraphs.length;

  const totalAnsweredCount =
    Object.keys(p1Answers).filter((k) => !!p1Answers[k]).length +
    Object.keys(p2Orders).length +
    Object.keys(p3Answers).filter((k) => !!p3Answers[k]).length +
    Object.keys(p4Answers).filter((k) => !!p4Answers[k]).length;

  // Grade & Submit calculation
  const handleSubmitExam = useCallback(async () => {
    setIsSubmitModalOpen(false);

    // 1. Part 1 Score (Max: 7 pts)
    let p1Correct = 0;
    examData.part1.gaps.forEach((g) => {
      if (p1Answers[g.id] && p1Answers[g.id].toLowerCase() === g.correctAnswer.toLowerCase()) {
        p1Correct++;
      }
    });
    const p1Score = examData.part1.gaps.length > 0 ? (p1Correct / examData.part1.gaps.length) * 7 : 7;

    // 2. Part 2 Score (Max: 17 pts)
    let p2CorrectMatches = 0;
    let p2TotalMatches = 0;
    examData.part2.stories.forEach((st) => {
      const userOrder = p2Orders[st.id] || [];
      const corOrder = st.correctOrder || [];
      p2TotalMatches += corOrder.length;
      userOrder.forEach((item, idx) => {
        if (corOrder[idx] === item) p2CorrectMatches++;
      });
    });
    const p2Score = p2TotalMatches > 0 ? (p2CorrectMatches / p2TotalMatches) * 17 : 17;

    // 3. Part 3 Score (Max: 13 pts)
    let p3Correct = 0;
    examData.part3.questions.forEach((q) => {
      if (p3Answers[q.id] && p3Answers[q.id].toLowerCase() === q.correctAnswer.toLowerCase()) {
        p3Correct++;
      }
    });
    const p3Score = examData.part3.questions.length > 0 ? (p3Correct / examData.part3.questions.length) * 13 : 13;

    // 4. Part 4 Score (Max: 13 pts)
    let p4Correct = 0;
    examData.part4.paragraphs.forEach((p) => {
      if (p4Answers[p.id] && p4Answers[p.id].toLowerCase() === p.correctHeading.toLowerCase()) {
        p4Correct++;
      }
    });
    const p4Score = examData.part4.paragraphs.length > 0 ? (p4Correct / examData.part4.paragraphs.length) * 13 : 13;

    const totalCalculated = Math.round(p1Score + p2Score + p3Score + p4Score);

    let cefr = "A1";
    if (totalCalculated >= 46) cefr = "C";
    else if (totalCalculated >= 38) cefr = "B2";
    else if (totalCalculated >= 26) cefr = "B1";
    else if (totalCalculated >= 16) cefr = "A2";
    else if (totalCalculated > 5) cefr = "A1";
    else cefr = "A0";

    setResultScore(totalCalculated);
    setCefrBand(cefr);
    setPartScores([
      { name: "Part 1 – Sentence comprehension", score: Math.round(p1Score * 10) / 10, maxScore: 7, correct: p1Correct, total: examData.part1.gaps.length },
      { name: "Part 2 + 3 – Text cohesion", score: Math.round(p2Score * 10) / 10, maxScore: 17, correct: p2CorrectMatches, total: p2TotalMatches },
      { name: "Part 4 – Opinion matching", score: Math.round(p3Score * 10) / 10, maxScore: 13, correct: p3Correct, total: examData.part3.questions.length },
      { name: "Part 5 – Long reading", score: Math.round(p4Score * 10) / 10, maxScore: 13, correct: p4Correct, total: examData.part4.paragraphs.length },
    ]);

    // Save to backend submission
    if (submissionId) {
      try {
        await api.submissions.submit(submissionId);
      } catch (err) {
        console.error("Submit reading error:", err);
      }
    }

    setIsSubmitted(true);
  }, [examData, p1Answers, p2Orders, p3Answers, p4Answers, submissionId]);

  // Stage list for navigation
  const stages = [
    { id: 0, title: "Part 1", label: "Part 1 – Gap Fill", count: examData.part1.gaps.length },
    { id: 1, title: "Part 2 (Bài 1)", label: "Part 2 – " + (examData.part2.stories[0]?.title || "Story 1"), count: 4 },
    { id: 2, title: "Part 2 (Bài 2)", label: "Part 2 – " + (examData.part2.stories[1]?.title || "Story 2"), count: 4 },
    { id: 3, title: "Part 4", label: "Part 4 – Opinion Matching", count: examData.part3.questions.length },
    { id: 4, title: "Part 5", label: "Part 5 – Long Reading", count: examData.part4.paragraphs.length },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16 pb-12">
        <div className="section-container pt-4 md:pt-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/reading"
                className="w-9 h-9 rounded-lg border border-border hover:bg-muted flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="font-heading font-bold text-base md:text-lg">
                  {examData.title}
                </h1>
                <p className="text-xs text-muted-foreground">
                  Reading Aptis ESOL · Thời gian làm bài {examData.durationMinutes} phút
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Timer */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-mono font-bold text-sm">
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>

              {/* Submit Button */}
              {!isSubmitted && (
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="tech-btn inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow text-xs font-bold shadow-md transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Nộp bài</span>
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-12 text-center rounded-2xl border border-border bg-card animate-pulse">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-muted-foreground">Đang tải đề thi Reading...</p>
            </div>
          )}

          {/* Result Card Mode */}
          {!loading && isSubmitted && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in zoom-in-95">
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-md text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Award className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Kết Quả Kỹ Năng Reading
                  </span>
                  <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-foreground mt-1">
                    BÁO CÁO ĐIỂM BÀI THI READING
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Thí sinh: {user?.full_name || "Thí sinh Aptis"} · Mã đề: {examId.toUpperCase()}
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-transparent border border-primary/30 max-w-sm mx-auto">
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    Đánh giá theo khung CEFR
                  </span>
                  <div className="text-5xl font-heading font-black text-primary my-1">{cefrBand}</div>
                  <p className="text-sm font-bold text-foreground">
                    Điểm số: <span className="text-primary">{resultScore}</span> / 50
                  </p>
                </div>

                {/* Part Breakdown Table */}
                <div className="space-y-3 text-left">
                  <h3 className="font-heading font-bold text-sm text-foreground">
                    Chi tiết điểm từng phần:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {partScores.map((ps, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-foreground">{ps.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            Đúng {ps.correct}/{ps.total} mục
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-primary">
                            {ps.score} / {ps.maxScore}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">Điểm</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-border flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(false);
                      setP1Answers({});
                      setP3Answers({});
                      setP4Answers({});
                      const resetOrders: Record<string, string[]> = {};
                      examData.part2.stories.forEach((st) => {
                        resetOrders[st.id] = st.sentences.map((s) => s.id);
                      });
                      setP2Orders(resetOrders);
                      setTimeLeft(examData.durationMinutes * 60);
                      setActiveStage(0);
                    }}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Làm lại đề này</span>
                  </button>
                  <Link
                    href="/history"
                    className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors"
                  >
                    Lịch sử làm bài
                  </Link>
                  <Link
                    href="/reading"
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-brand-brown transition-colors"
                  >
                    Về danh sách đề Reading
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Exam Questions Workspace (Grid: Left 3 cols, Right 1 col) */}
          {!loading && !isSubmitted && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left 3 cols: Questions Main Workspace */}
              <div className="lg:col-span-3 space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between pb-4 border-b border-border/70">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                        {stages[activeStage]?.title}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {stages[activeStage]?.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setFlagged((prev) => ({
                          ...prev,
                          [activeStage]: !prev[activeStage],
                        }))
                      }
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                        flagged[activeStage]
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{flagged[activeStage] ? "Đã gắn cờ" : "Gắn cờ"}</span>
                    </button>
                  </div>

                  {/* ============================================================== */}
                  {/* PART 1: GAP FILL (Sentence Comprehension)                       */}
                  {/* ============================================================== */}
                  {activeStage === 0 && (
                    <div className="space-y-6">
                      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80">
                        <p className="text-xs md:text-sm text-foreground font-semibold">
                          📌 {examData.part1.instructions}
                        </p>
                      </div>

                      {/* Example Sentence */}
                      <div className="p-4 rounded-xl border border-border/70 bg-card/60 flex items-center gap-2 flex-wrap text-sm md:text-base">
                        <span>{examData.part1.exampleText.prefix}</span>
                        <span className="px-3 py-1 rounded-md border border-border bg-muted/60 text-muted-foreground font-bold text-xs select-none">
                          {examData.part1.exampleText.word}
                        </span>
                        <span>{examData.part1.exampleText.suffix}</span>
                        <span className="text-[11px] text-muted-foreground italic ml-2">
                          (Câu ví dụ mẫu)
                        </span>
                      </div>

                      {/* Gaps List */}
                      <div className="space-y-4">
                        {examData.part1.gaps.map((gap, gIdx) => {
                          const parts = gap.prompt.split(/\[(?:gap|blank|\.\.\.)\]/i);
                          const userVal = p1Answers[gap.id] || "";

                          return (
                            <div
                              key={gap.id}
                              className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all flex flex-wrap items-center gap-2.5 text-sm md:text-base leading-relaxed"
                            >
                              <span className="font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                                {gIdx + 1}
                              </span>
                              <span>{parts[0]}</span>
                              <select
                                value={userVal}
                                onChange={(e) =>
                                  setP1Answers((prev) => ({
                                    ...prev,
                                    [gap.id]: e.target.value,
                                  }))
                                }
                                className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all cursor-pointer outline-none ${
                                  userVal
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-card text-muted-foreground hover:border-primary/60"
                                }`}
                              >
                                <option value="">— Chọn từ —</option>
                                {gap.options.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                              <span>{parts[1] || ""}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* PART 2: TEXT COHESION (Sentence Ordering - Story 1)             */}
                  {/* ============================================================== */}
                  {activeStage === 1 && (() => {
                    const story = examData.part2.stories[0];
                    if (!story) return null;
                    const currentOrder = p2Orders[story.id] || story.sentences.map((s) => s.id);

                    return (
                      <div className="space-y-5">
                        <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-xs font-bold text-primary block">
                              {story.title}
                            </span>
                            <p className="text-xs md:text-sm text-foreground">
                              {examData.part2.instructions}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleResetStoryOrder(story.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Khôi phục</span>
                          </button>
                        </div>

                        {/* Fixed Starter Sentence */}
                        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                            📌 Câu mở đầu cố định (Vị trí 1):
                          </span>
                          <p className="text-sm md:text-base font-semibold text-foreground">
                            {story.fixedSentence}
                          </p>
                        </div>

                        {/* Re-orderable sentences */}
                        <div className="space-y-2.5">
                          <span className="text-xs font-bold text-muted-foreground block">
                            Sắp xếp 4 câu tiếp theo (Dùng nút ↑ và ↓ để đổi thứ tự):
                          </span>
                          {currentOrder.map((sId, sIdx) => {
                            const sentenceObj = story.sentences.find((s) => s.id === sId);
                            if (!sentenceObj) return null;

                            return (
                              <div
                                key={sId}
                                className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 flex items-center justify-between gap-3 transition-all shadow-2xs"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <span className="w-6 h-6 rounded-md bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0">
                                    {sIdx + 2}
                                  </span>
                                  <p className="text-xs md:text-sm font-medium text-foreground leading-relaxed">
                                    {sentenceObj.text}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    disabled={sIdx === 0}
                                    onClick={() => handleMoveSentence(story.id, sIdx, "up")}
                                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                                    title="Di chuyển lên"
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={sIdx === currentOrder.length - 1}
                                    onClick={() => handleMoveSentence(story.id, sIdx, "down")}
                                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                                    title="Di chuyển xuống"
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ============================================================== */}
                  {/* PART 2: TEXT COHESION (Sentence Ordering - Story 2)             */}
                  {/* ============================================================== */}
                  {activeStage === 2 && (() => {
                    const story = examData.part2.stories[1];
                    if (!story) return null;
                    const currentOrder = p2Orders[story.id] || story.sentences.map((s) => s.id);

                    return (
                      <div className="space-y-5">
                        <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-xs font-bold text-primary block">
                              {story.title}
                            </span>
                            <p className="text-xs md:text-sm text-foreground">
                              {examData.part2.instructions}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleResetStoryOrder(story.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Khôi phục</span>
                          </button>
                        </div>

                        {/* Fixed Starter Sentence */}
                        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                            📌 Câu mở đầu cố định (Vị trí 1):
                          </span>
                          <p className="text-sm md:text-base font-semibold text-foreground">
                            {story.fixedSentence}
                          </p>
                        </div>

                        {/* Re-orderable sentences */}
                        <div className="space-y-2.5">
                          <span className="text-xs font-bold text-muted-foreground block">
                            Sắp xếp 4 câu tiếp theo (Dùng nút ↑ và ↓ để đổi thứ tự):
                          </span>
                          {currentOrder.map((sId, sIdx) => {
                            const sentenceObj = story.sentences.find((s) => s.id === sId);
                            if (!sentenceObj) return null;

                            return (
                              <div
                                key={sId}
                                className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 flex items-center justify-between gap-3 transition-all shadow-2xs"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <span className="w-6 h-6 rounded-md bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0">
                                    {sIdx + 2}
                                  </span>
                                  <p className="text-xs md:text-sm font-medium text-foreground leading-relaxed">
                                    {sentenceObj.text}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    disabled={sIdx === 0}
                                    onClick={() => handleMoveSentence(story.id, sIdx, "up")}
                                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                                    title="Di chuyển lên"
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={sIdx === currentOrder.length - 1}
                                    onClick={() => handleMoveSentence(story.id, sIdx, "down")}
                                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                                    title="Di chuyển xuống"
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ============================================================== */}
                  {/* PART 3: OPINION MATCHING (4 Reviews, 7 Questions)              */}
                  {/* ============================================================== */}
                  {activeStage === 3 && (
                    <div className="space-y-6">
                      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80">
                        <span className="text-xs font-bold text-primary block">
                          {examData.part3.title}
                        </span>
                        <p className="text-xs md:text-sm text-foreground">
                          {examData.part3.instructions}
                        </p>
                      </div>

                      {/* 4 Review Cards in 2 columns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {examData.part3.reviews.map((rev) => (
                          <div
                            key={rev.person}
                            className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-2xs"
                          >
                            <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-xs inline-block">
                              {rev.person}
                            </span>
                            <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans">
                              {rev.review}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* 7 Questions */}
                      <div className="space-y-4 pt-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Chọn người có ý kiến tương ứng:
                        </h4>
                        {examData.part3.questions.map((q, qIdx) => {
                          const userVal = p3Answers[q.id];

                          return (
                            <div
                              key={q.id}
                              className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded mt-0.5">
                                  {qIdx + 1}
                                </span>
                                <p className="text-xs md:text-sm font-semibold text-foreground">
                                  {q.prompt}
                                </p>
                              </div>

                              {/* 4 Pill Options */}
                              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                                {["Person A", "Person B", "Person C", "Person D"].map((opt) => {
                                  const isSelected = userVal === opt;
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() =>
                                        setP3Answers((prev) => ({
                                          ...prev,
                                          [q.id]: opt,
                                        }))
                                      }
                                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        isSelected
                                          ? "bg-primary text-primary-foreground shadow-xs scale-105"
                                          : "border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                                      }`}
                                    >
                                      {opt.replace("Person ", "")}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* PART 4: LONG READING (Paragraphs & Headings Dropdowns)          */}
                  {/* ============================================================== */}
                  {activeStage === 4 && (
                    <div className="space-y-6">
                      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80 space-y-1">
                        <span className="text-xs font-bold text-primary block">
                          📖 {examData.part4.title}
                        </span>
                        <p className="text-xs md:text-sm text-foreground">
                          {examData.part4.instructions}
                        </p>
                      </div>

                      {/* Reference Headings List */}
                      <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                          Danh sách tiêu đề Heading có sẵn:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-foreground/80">
                          {examData.part4.allHeadings.map((h, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <span className="font-bold text-primary shrink-0">•</span>
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 7 Paragraphs with Selects */}
                      <div className="space-y-5">
                        {examData.part4.paragraphs.map((p) => {
                          const userVal = p4Answers[p.id] || "";

                          return (
                            <div
                              key={p.id}
                              className="p-5 rounded-xl border border-border bg-card space-y-3 shadow-2xs"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                                <span className="font-bold text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-md inline-block">
                                  Đoạn văn {p.paragraphNumber}
                                </span>

                                <select
                                  value={userVal}
                                  onChange={(e) =>
                                    setP4Answers((prev) => ({
                                      ...prev,
                                      [p.id]: e.target.value,
                                    }))
                                  }
                                  className={`w-full sm:max-w-md px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer outline-none truncate ${
                                    userVal
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border bg-card text-muted-foreground hover:border-primary/60"
                                  }`}
                                >
                                  <option value="">— Chọn tiêu đề phù hợp —</option>
                                  {examData.part4.allHeadings.map((h, hIdx) => (
                                    <option key={hIdx} value={h}>
                                      {h}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans">
                                {p.text}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons inside Workspace */}
                  <div className="flex items-center justify-between pt-6 border-t border-border/70">
                    <button
                      type="button"
                      disabled={activeStage === 0}
                      onClick={() => setActiveStage((p) => Math.max(0, p - 1))}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border border-border hover:bg-muted disabled:opacity-30 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Phần trước</span>
                    </button>

                    <div className="text-xs text-muted-foreground">
                      Phần {activeStage + 1} / {stages.length}
                    </div>

                    <button
                      type="button"
                      disabled={activeStage === stages.length - 1}
                      onClick={() => setActiveStage((p) => Math.min(stages.length - 1, p + 1))}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow disabled:opacity-30 transition-colors"
                    >
                      <span>Phần tiếp theo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 1 col: Question Palette (Danh sách câu hỏi) */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-border/70 pb-3">
                    <h3 className="font-heading font-bold text-sm text-foreground">
                      Danh sách bài thi
                    </h3>
                    <span className="text-xs font-mono font-bold text-primary">
                      {totalAnsweredCount}/{totalQuestionsCount}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {stages.map((stg) => {
                      const isActive = activeStage === stg.id;
                      const isFlg = flagged[stg.id];

                      // Compute if this stage is completed
                      let isComplete = false;
                      if (stg.id === 0) {
                        isComplete =
                          Object.keys(p1Answers).filter((k) => !!p1Answers[k]).length ===
                          examData.part1.gaps.length;
                      } else if (stg.id === 1 || stg.id === 2) {
                        isComplete = true; // has an order
                      } else if (stg.id === 3) {
                        isComplete =
                          Object.keys(p3Answers).filter((k) => !!p3Answers[k]).length ===
                          examData.part3.questions.length;
                      } else if (stg.id === 4) {
                        isComplete =
                          Object.keys(p4Answers).filter((k) => !!p4Answers[k]).length ===
                          examData.part4.paragraphs.length;
                      }

                      return (
                        <button
                          key={stg.id}
                          type="button"
                          onClick={() => setActiveStage(stg.id)}
                          className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                            isActive
                              ? "border-primary bg-primary/10 text-primary shadow-2xs ring-1 ring-primary"
                              : isComplete
                              ? "border-border/60 bg-muted/20 text-foreground hover:bg-muted/40"
                              : "border-border bg-card text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] shrink-0">
                              {stg.id + 1}
                            </span>
                            <span className="truncate">{stg.label}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {isFlg && <Flag className="w-3 h-3 text-amber-500 fill-amber-500" />}
                            {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-border/70">
                    <button
                      type="button"
                      onClick={() => setIsSubmitModalOpen(true)}
                      className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-sm transition-all text-center flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Nộp bài ngay</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Confirmation Modal */}
          {isSubmitModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
              <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-base text-foreground">
                    Xác nhận nộp bài thi
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bạn đã hoàn thành{" "}
                  <span className="font-bold text-foreground">
                    {totalAnsweredCount}/{totalQuestionsCount}
                  </span>{" "}
                  câu hỏi. Bạn có chắc chắn muốn kết thúc bài thi Reading và xem điểm ngay bây giờ?
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                  >
                    Làm tiếp
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitExam}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-glow shadow-sm"
                  >
                    Nộp bài
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}

// Parser: Turns backend API getQuestions payload into structured ReadingExamData
function parseApiToReadingData(apiData: any): ReadingExamData {
  const result: ReadingExamData = {
    ...DEFAULT_READING_TEST,
    id: apiData.id || "reading-01",
    title: apiData.title || "Full Reading · 4 Parts",
    durationMinutes: apiData.duration_minutes || 35,
  };

  const parts = apiData.parts || [];

  parts.forEach((p: any) => {
    const pTitle = (p.title || "").toLowerCase();
    const pNum = p.part_number;

    // Part 1: Gap Fill
    if (pNum === 1 || pTitle.includes("part 1") || pTitle.includes("gap")) {
      const gaps: Part1Gap[] = (p.questions || []).map((q: any) => {
        let opts: string[] = [];
        if (Array.isArray(q.options)) opts = q.options;
        else if (typeof q.options === "string") {
          try {
            opts = JSON.parse(q.options);
          } catch {
            opts = [];
          }
        }
        return {
          id: String(q.id),
          prompt: q.prompt,
          options: opts,
          correctAnswer: String(q.correct_answer || opts[0] || ""),
        };
      });
      if (gaps.length > 0) {
        result.part1.gaps = gaps;
        if (p.instructions) result.part1.instructions = p.instructions;
      }
    }

    // Part 2: Sentence Order
    if (pNum === 2 || pTitle.includes("part 2") || pTitle.includes("cohesion")) {
      const stories: Part2Story[] = (p.questions || []).map((q: any, idx: number) => {
        let optsObj: any = {};
        if (typeof q.options === "string") {
          try {
            optsObj = JSON.parse(q.options);
          } catch {
            optsObj = {};
          }
        } else if (typeof q.options === "object" && q.options !== null) {
          optsObj = q.options;
        }

        let corArr: string[] = [];
        if (Array.isArray(q.correct_answer)) corArr = q.correct_answer;
        else if (typeof q.correct_answer === "string") {
          try {
            corArr = JSON.parse(q.correct_answer);
          } catch {
            corArr = [];
          }
        }

        return {
          id: String(q.id),
          title: optsObj.title || `Đoạn văn ${idx + 1}`,
          fixedSentence: optsObj.fixedSentence || "Sentence 1 fixed",
          sentences: optsObj.sentences || [],
          correctOrder: corArr.length > 0 ? corArr : (optsObj.sentences || []).map((s: any) => s.id),
        };
      });
      if (stories.length > 0) {
        result.part2.stories = stories;
        if (p.instructions) result.part2.instructions = p.instructions;
      }
    }

    // Part 4: Opinion Matching
    if (pNum === 4 || pTitle.includes("part 4") || pTitle.includes("opinion")) {
      const questions: Part3Question[] = (p.questions || []).map((q: any) => {
        let opts: string[] = ["Person A", "Person B", "Person C", "Person D"];
        if (Array.isArray(q.options)) opts = q.options;
        return {
          id: String(q.id),
          prompt: q.prompt,
          options: opts,
          correctAnswer: String(q.correct_answer || "Person A"),
        };
      });
      if (questions.length > 0) {
        result.part3.questions = questions;
        if (p.instructions) result.part3.instructions = p.instructions;
      }
    }

    // Part 5: Long Reading
    if (pNum === 5 || pTitle.includes("part 5") || pTitle.includes("long")) {
      const paragraphs: Part4Paragraph[] = (p.questions || []).map((q: any, idx: number) => {
        return {
          id: String(q.id),
          paragraphNumber: idx + 1,
          text: q.prompt ? q.prompt.replace(/^Paragraph\s*\d+\s*:\s*/i, "") : "",
          correctHeading: String(q.correct_answer || ""),
        };
      });
      if (paragraphs.length > 0) {
        result.part4.paragraphs = paragraphs;
        if (p.instructions) result.part4.instructions = p.instructions;
      }
    }
  });

  return result;
}
