"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Award,
  HelpCircle,
  X,
  RefreshCw,
  Check,
  LogOut,
  Pin,
  Highlighter,
  Trash2,
  Eye,
  Menu,
  Info,
  ArrowUp,
} from "lucide-react";
import { ReadingSentenceOrder } from "@/components/reading-components";

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
  const [showDrawer, setShowDrawer] = useState(false);
  const [showSampleAnswers, setShowSampleAnswers] = useState(false);
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

  // Bộ quản lý Highlight cho bài đọc
  const [highlights, setHighlights] = useState<
    Record<string, Array<{ text: string; color: "yellow" | "green" }>>
  >({});
  const [selectionMenu, setSelectionMenu] = useState<{
    targetId: string;
    selectedText: string;
    x: number;
    y: number;
  } | null>(null);

  const handleTextSelection = (targetId: string) => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelectionMenu(null);
      return;
    }
    const text = sel.toString().trim();
    if (text.length < 2) {
      setSelectionMenu(null);
      return;
    }

    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionMenu({
        targetId,
        selectedText: text,
        x: rect.left + rect.width / 2,
        y: Math.max(10, rect.top - 44),
      });
    } catch {
      setSelectionMenu(null);
    }
  };

  const addHighlight = (color: "yellow" | "green") => {
    if (!selectionMenu) return;
    const { targetId, selectedText } = selectionMenu;
    setHighlights((prev) => {
      const current = prev[targetId] || [];
      if (current.some((h) => h.text === selectedText && h.color === color)) {
        return prev;
      }
      return {
        ...prev,
        [targetId]: [...current, { text: selectedText, color }],
      };
    });
    setSelectionMenu(null);
    if (typeof window !== "undefined") {
      window.getSelection()?.removeAllRanges();
    }
  };

  const clearHighlightsForStage = (targetIds: string[]) => {
    setHighlights((prev) => {
      const copy = { ...prev };
      targetIds.forEach((id) => delete copy[id]);
      return copy;
    });
  };

  const renderHighlightedContent = (rawText: string, targetId: string) => {
    const list = highlights[targetId];
    if (!list || list.length === 0) return rawText;

    const sorted = [...list].sort((a, b) => b.text.length - a.text.length);
    const escaped = sorted.map((h) => h.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`(${escaped.join("|")})`, "gi");

    const parts = rawText.split(regex);
    return parts.map((part, i) => {
      const match = sorted.find((h) => h.text.toLowerCase() === part.toLowerCase());
      if (match) {
        return (
          <mark
            key={i}
            className={`px-0.5 rounded cursor-pointer transition-colors ${
              match.color === "yellow"
                ? "bg-amber-300/40 text-amber-950 dark:text-amber-200 border-b border-amber-400"
                : "bg-emerald-300/40 text-emerald-950 dark:text-emerald-200 border-b border-emerald-400"
            }`}
            title="Đoạn văn đã được đánh dấu"
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  };

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

          // Initialize Part 2 sentences default order (empty slots, ready for drag & drop)
          const initialP2Orders: Record<string, string[]> = {};
          parsed.part2.stories.forEach((st) => {
            initialP2Orders[st.id] = [];
          });
          setP2Orders(initialP2Orders);
        } else {
          // Use default benchmark
          setExamData(DEFAULT_READING_TEST);
          const initialP2Orders: Record<string, string[]> = {};
          DEFAULT_READING_TEST.part2.stories.forEach((st) => {
            initialP2Orders[st.id] = [];
          });
          setP2Orders(initialP2Orders);
        }
      } catch (err: any) {
        console.warn("Using offline benchmark reading data:", err);
        setExamData(DEFAULT_READING_TEST);
        const initialP2Orders: Record<string, string[]> = {};
        DEFAULT_READING_TEST.part2.stories.forEach((st) => {
          initialP2Orders[st.id] = [];
        });
        setP2Orders(initialP2Orders);
      } finally {
        setLoading(false);
      }
    }

    loadReadingExam();
  }, [examId]);

  // Dynamic Stage list for navigation based on actually loaded questions
  const stages = useMemo(() => {
    const list: Array<{
      stageKey: "p1" | "p2-1" | "p2-2" | "p3" | "p4";
      title: string;
      label: string;
      count: number;
    }> = [];

    if (examData.part1.gaps.length > 0) {
      list.push({
        stageKey: "p1",
        title: "Part 1",
        label: "Part 1 – Gap Fill",
        count: examData.part1.gaps.length,
      });
    }
    if (examData.part2.stories.length > 0) {
      list.push({
        stageKey: "p2-1",
        title: "Part 2 (Bài 1)",
        label: "Part 2 – " + (examData.part2.stories[0]?.title || "Story 1"),
        count: examData.part2.stories[0]?.sentences.length || 4,
      });
      if (examData.part2.stories.length > 1) {
        list.push({
          stageKey: "p2-2",
          title: "Part 2 (Bài 2)",
          label: "Part 2 – " + (examData.part2.stories[1]?.title || "Story 2"),
          count: examData.part2.stories[1]?.sentences.length || 4,
        });
      }
    }
    if (examData.part3.questions.length > 0) {
      list.push({
        stageKey: "p3",
        title: "Part 4",
        label: "Part 4 – " + (examData.part3.title || "Opinion Matching"),
        count: examData.part3.questions.length,
      });
    }
    if (examData.part4.paragraphs.length > 0) {
      list.push({
        stageKey: "p4",
        title: "Part 5",
        label: "Part 5 – " + (examData.part4.title || "Long Reading"),
        count: examData.part4.paragraphs.length,
      });
    }

    if (list.length === 0) {
      list.push({
        stageKey: "p1",
        title: "Part 1",
        label: "Part 1 – Gap Fill",
        count: 0,
      });
    }
    return list;
  }, [examData]);

  // Adjust activeStage if URL contains ?part=
  useEffect(() => {
    if (!partParam || stages.length === 0) return;
    const p = partParam.toLowerCase();
    const targetKey =
      p === "1" || p === "p1" || p === "part1"
        ? "p1"
        : p === "2" || p === "p2" || p === "part2"
        ? "p2-1"
        : p === "3" || p === "p3" || p === "part3"
        ? (stages.some((s) => s.stageKey === "p2-2") ? "p2-2" : "p3")
        : p === "4" || p === "p4" || p === "part4"
        ? (stages.some((s) => s.stageKey === "p3") ? "p3" : "p4")
        : p === "5" || p === "p5" || p === "part5"
        ? "p4"
        : null;
    if (targetKey) {
      const idx = stages.findIndex((s) => s.stageKey === targetKey);
      if (idx !== -1) setActiveStage(idx);
    }
  }, [partParam, stages]);

  // Tự động cuộn pill phần thi đang chọn vào giữa thanh điều hướng
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(`reading-stage-pill-${activeStage}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeStage]);

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

    const activePartsCount =
      (examData.part1.gaps.length > 0 ? 1 : 0) +
      (examData.part2.stories.length > 0 ? 1 : 0) +
      (examData.part3.questions.length > 0 ? 1 : 0) +
      (examData.part4.paragraphs.length > 0 ? 1 : 0);

    const calculatedPartScores: { name: string; score: number; maxScore: number; correct: number; total: number }[] = [];

    // 1. Part 1 Score
    let p1Correct = 0;
    if (examData.part1.gaps.length > 0) {
      examData.part1.gaps.forEach((g) => {
        if (p1Answers[g.id] && p1Answers[g.id].toLowerCase() === g.correctAnswer.toLowerCase()) {
          p1Correct++;
        }
      });
      const p1Max = activePartsCount === 1 ? 50 : 7;
      const p1Score = (p1Correct / examData.part1.gaps.length) * p1Max;
      calculatedPartScores.push({
        name: "Part 1 – Sentence comprehension",
        score: Math.round(p1Score * 10) / 10,
        maxScore: p1Max,
        correct: p1Correct,
        total: examData.part1.gaps.length,
      });
    }

    // 2. Part 2 Score
    let p2CorrectMatches = 0;
    let p2TotalMatches = 0;
    if (examData.part2.stories.length > 0) {
      examData.part2.stories.forEach((st) => {
        const userOrder = p2Orders[st.id] || [];
        const corOrder = st.correctOrder || [];
        p2TotalMatches += corOrder.length;
        userOrder.forEach((item, idx) => {
          if (corOrder[idx] === item) p2CorrectMatches++;
        });
      });
      const p2Max = activePartsCount === 1 ? 50 : 17;
      const p2Score = p2TotalMatches > 0 ? (p2CorrectMatches / p2TotalMatches) * p2Max : 0;
      calculatedPartScores.push({
        name: "Part 2 – Text cohesion",
        score: Math.round(p2Score * 10) / 10,
        maxScore: p2Max,
        correct: p2CorrectMatches,
        total: p2TotalMatches,
      });
    }

    // 3. Part 3 Score
    let p3Correct = 0;
    if (examData.part3.questions.length > 0) {
      examData.part3.questions.forEach((q) => {
        if (p3Answers[q.id] && p3Answers[q.id].toLowerCase() === q.correctAnswer.toLowerCase()) {
          p3Correct++;
        }
      });
      const p3Max = activePartsCount === 1 ? 50 : 13;
      const p3Score = (p3Correct / examData.part3.questions.length) * p3Max;
      calculatedPartScores.push({
        name: "Part 3 – Opinion matching",
        score: Math.round(p3Score * 10) / 10,
        maxScore: p3Max,
        correct: p3Correct,
        total: examData.part3.questions.length,
      });
    }

    // 4. Part 4 Score
    let p4Correct = 0;
    if (examData.part4.paragraphs.length > 0) {
      examData.part4.paragraphs.forEach((p) => {
        if (p4Answers[p.id] && p4Answers[p.id].toLowerCase() === p.correctHeading.toLowerCase()) {
          p4Correct++;
        }
      });
      const p4Max = activePartsCount === 1 ? 50 : 13;
      const p4Score = (p4Correct / examData.part4.paragraphs.length) * p4Max;
      calculatedPartScores.push({
        name: "Part 4 – Long reading",
        score: Math.round(p4Score * 10) / 10,
        maxScore: p4Max,
        correct: p4Correct,
        total: examData.part4.paragraphs.length,
      });
    }

    const totalCalculated = Math.min(50, Math.round(calculatedPartScores.reduce((sum, item) => sum + item.score, 0)));

    let cefr = "A1";
    if (totalCalculated >= 46) cefr = "C";
    else if (totalCalculated >= 38) cefr = "B2";
    else if (totalCalculated >= 26) cefr = "B1";
    else if (totalCalculated >= 16) cefr = "A2";
    else if (totalCalculated > 5) cefr = "A1";
    else cefr = "A0";

    setResultScore(totalCalculated);
    setCefrBand(cefr);
    setPartScores(calculatedPartScores);

    // Save to backend submission
    if (submissionId) {
      try {
        const answersPayload: any[] = [];
        // Part 1
        examData.part1.gaps.forEach((g) => {
          if (g.id && p1Answers[g.id]) {
            answersPayload.push({
              questionId: String(g.id),
              selectedOption: p1Answers[g.id],
            });
          }
        });
        // Part 2
        examData.part2.stories.forEach((st) => {
          if (st.id && p2Orders[st.id]) {
            answersPayload.push({
              questionId: String(st.id),
              selectedOption: JSON.stringify(p2Orders[st.id]),
            });
          }
        });
        // Part 3
        examData.part3.questions.forEach((q) => {
          if (q.id && p3Answers[q.id]) {
            answersPayload.push({
              questionId: String(q.id),
              selectedOption: p3Answers[q.id],
            });
          }
        });
        // Part 4
        examData.part4.paragraphs.forEach((p) => {
          if (p.id && p4Answers[p.id]) {
            answersPayload.push({
              questionId: String(p.id),
              selectedOption: p4Answers[p.id],
            });
          }
        });

        if (answersPayload.length > 0) {
          await api.submissions.autosave(submissionId, answersPayload);
        }
        await api.submissions.submit(submissionId);
      } catch (err) {
        console.error("Submit reading error:", err);
      }
    }

    setIsSubmitted(true);
  }, [examData, p1Answers, p2Orders, p3Answers, p4Answers, submissionId]);

  const currentStage = stages[activeStage] || stages[0];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans select-none">
      {/* 1. TOP HEADER PHÒNG THI CHUẨN */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/reading"
            className="w-9 h-9 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors text-foreground"
            title="Quay lại danh sách đề"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Reading Practice
            </span>
            <span className="text-sm md:text-base font-bold text-foreground">
              {examData.title}
            </span>
          </div>
        </div>

        {/* Căn giữa: Đồng hồ đếm ngược */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-sm">
          <Clock className="w-4 h-4" />
          <span>{formatTime(timeLeft)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/reading"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Thoát</span>
          </Link>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 py-6 px-3 md:px-6 pb-28">
        <div className="max-w-4xl mx-auto space-y-6">

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

          {/* Exam Questions Workspace */}
          {!loading && !isSubmitted && (
            <div key={`reading-stage-wrap-${currentStage.stageKey}`} className="part-transition space-y-6">
              {/* Card Context & Header Banner */}
              <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                      Phần {activeStage + 1} / {stages.length}
                    </span>
                    <h2 className="font-heading font-bold text-base md:text-lg text-foreground">
                      {stages[activeStage]?.label}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setFlagged((prev) => ({
                          ...prev,
                          [activeStage]: !prev[activeStage],
                        }))
                      }
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                        flagged[activeStage]
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{flagged[activeStage] ? "Đã gắn cờ" : "Gắn cờ"}</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans">
                  {currentStage.stageKey === "p1" && examData.part1.instructions}
                  {currentStage.stageKey === "p2-1" && examData.part2.instructions}
                  {currentStage.stageKey === "p2-2" && examData.part2.instructions}
                  {currentStage.stageKey === "p3" && examData.part3.instructions}
                  {currentStage.stageKey === "p4" && examData.part4.instructions}
                </p>
              </div>

              {/* Main Questions Content Card */}
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">

                  {/* ============================================================== */}
                  {/* PART 1: GAP FILL (Sentence Comprehension)                       */}
                  {/* ============================================================== */}
                  {currentStage.stageKey === "p1" && (
                    <div className="space-y-6">
                      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80">
                        <p className="text-xs md:text-sm text-foreground font-semibold flex items-center gap-1.5">
                          <Pin className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{examData.part1.instructions}</span>
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

                      {/* Gaps List - Tách rời từng câu riêng biệt, không dính liền */}
                      <div className="space-y-4">
                        {examData.part1.gaps.map((gap, gIdx) => {
                          const cleanPrompt = gap.prompt || "";
                          const hasGapMarker = /\[(?:gap|blank|\.\.\.)\]/i.test(cleanPrompt);
                          let beforeGap = cleanPrompt;
                          let afterGap = "";

                          if (hasGapMarker) {
                            const split = cleanPrompt.split(/\[(?:gap|blank|\.\.\.)\]/i);
                            beforeGap = split[0];
                            afterGap = split[1] || "";
                          } else if (gap.correctAnswer && cleanPrompt.toLowerCase().includes(gap.correctAnswer.toLowerCase())) {
                            const regex = new RegExp(`\\b${gap.correctAnswer}\\b`, "i");
                            const split = cleanPrompt.split(regex);
                            beforeGap = split[0];
                            afterGap = split[1] || "";
                          }

                          const userVal = p1Answers[gap.id] || "";

                          return (
                            <div
                              key={gap.id}
                              className="p-4 md:p-5 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all flex flex-wrap items-center gap-3 text-sm md:text-base leading-relaxed shadow-2xs"
                            >
                              <span className="font-extrabold text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-lg shrink-0">
                                Câu {gIdx + 1}
                              </span>
                              <span>{beforeGap}</span>
                              <select
                                value={userVal}
                                onChange={(e) =>
                                  setP1Answers((prev) => ({
                                    ...prev,
                                    [gap.id]: e.target.value,
                                  }))
                                }
                                className={`px-3 py-1.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer outline-none shadow-2xs ${
                                  userVal
                                    ? "border-primary bg-primary/10 text-primary font-bold"
                                    : "border-border bg-background text-muted-foreground hover:border-primary/60"
                                }`}
                              >
                                <option value="">— Chọn từ khuyết —</option>
                                {gap.options.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                              <span>{afterGap}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* ============================================================== */}
                  {/* PART 2: TEXT COHESION (Sentence Ordering - Story 1)             */}
                  {/* ============================================================== */}
                  {currentStage.stageKey === "p2-1" && (() => {
                    const story = examData.part2.stories[0];
                    if (!story) return null;
                    const currentOrder = p2Orders[story.id] || [];

                    return (
                      <ReadingSentenceOrder
                        key={story.id}
                        title={story.title}
                        fixedSentence={story.fixedSentence}
                        sentences={story.sentences}
                        currentOrder={currentOrder}
                        onChangeOrder={(newOrder) =>
                          setP2Orders((prev) => ({
                            ...prev,
                            [story.id]: newOrder,
                          }))
                        }
                      />
                    );
                  })()}

                  {/* ============================================================== */}
                  {/* PART 2: TEXT COHESION (Sentence Ordering - Story 2)             */}
                  {/* ============================================================== */}
                  {currentStage.stageKey === "p2-2" && (() => {
                    const story = examData.part2.stories[1];
                    if (!story) return null;
                    const currentOrder = p2Orders[story.id] || [];

                    return (
                      <ReadingSentenceOrder
                        key={story.id}
                        title={story.title}
                        fixedSentence={story.fixedSentence}
                        sentences={story.sentences}
                        currentOrder={currentOrder}
                        onChangeOrder={(newOrder) =>
                          setP2Orders((prev) => ({
                            ...prev,
                            [story.id]: newOrder,
                          }))
                        }
                      />
                    );
                  })()}

                  {/* ============================================================== */}
                  {/* PART 3: OPINION MATCHING (4 Reviews, 7 Questions)              */}
                  {/* ============================================================== */}
                  {currentStage.stageKey === "p3" && (
                    <div className="space-y-6">
                      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-primary block">
                            {examData.part3.title}
                          </span>
                          <p className="text-xs text-foreground">
                            {examData.part3.instructions}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                            <span className="hidden sm:inline">Bôi đen chữ để highlight</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => clearHighlightsForStage(examData.part3.reviews.map((r) => r.person))}
                            className="px-2 py-1 rounded-lg border border-border hover:bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                            <span>Xóa highlight</span>
                          </button>
                        </div>
                      </div>

                      {/* 4 Review Cards in 2 columns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {examData.part3.reviews.map((rev) => (
                          <div
                            key={rev.person}
                            className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-2xs select-text"
                            onMouseUp={() => handleTextSelection(rev.person)}
                            onTouchEnd={() => handleTextSelection(rev.person)}
                          >
                            <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-xs inline-block">
                              {rev.person}
                            </span>
                            <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans">
                              {renderHighlightedContent(rev.review, rev.person)}
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
                  {currentStage.stageKey === "p4" && (
                    <div className="space-y-6">
                      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{examData.part4.title}</span>
                          </span>
                          <p className="text-xs text-foreground">
                            {examData.part4.instructions}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                            <span className="hidden sm:inline">Bôi đen chữ để highlight</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => clearHighlightsForStage(examData.part4.paragraphs.map((p) => p.id))}
                            className="px-2 py-1 rounded-lg border border-border hover:bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                            <span>Xóa highlight</span>
                          </button>
                        </div>
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

                              <p
                                className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans select-text"
                                onMouseUp={() => handleTextSelection(p.id)}
                                onTouchEnd={() => handleTextSelection(p.id)}
                              >
                                {renderHighlightedContent(p.text, p.id)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

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

          {/* Floating Highlight Menu khi bôi đen chữ trên bài đọc */}
          {selectionMenu && (
            <div
              className="fixed z-50 -translate-x-1/2 flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none"
              style={{ top: selectionMenu.y, left: selectionMenu.x }}
            >
              <button
                type="button"
                onClick={() => addHighlight("yellow")}
                className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-900 dark:text-amber-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Đánh dấu đoạn văn dẫn chứng (Màu vàng)"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 shadow-xs" />
                <span>Dẫn chứng</span>
              </button>
              <button
                type="button"
                onClick={() => addHighlight("green")}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Đánh dấu từ khóa đối chiếu (Màu xanh)"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
                <span>Từ khóa</span>
              </button>
              <div className="w-px h-4 bg-border/60 mx-0.5" />
              <button
                type="button"
                onClick={() => setSelectionMenu(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Đóng menu"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 3. STICKY BOTTOM RUNNER BAR CHUẨN */}
      {!loading && !isSubmitted && (
        <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border px-4 md:px-8 py-3 flex items-center justify-between z-40 shadow-lg">
          {/* Left: Hiện đáp án & Báo lỗi */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSampleAnswers(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Hiện đáp án</span>
            </button>

            <button
              type="button"
              onClick={() => alert("Đã gửi phản hồi báo lỗi đề thi Reading.")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Báo lỗi</span>
            </button>
          </div>

          {/* Center: Quick Stage Pills & Navigation Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="bg-muted/40 dark:bg-slate-800/60 p-1 rounded-2xl border border-border/80 shadow-2xs flex items-center gap-1 backdrop-blur-sm">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scrollbar-none scroll-smooth max-w-[42vw] sm:max-w-[44vw] md:max-w-[50vw] lg:max-w-[56vw] py-0.5 px-0.5">
                {stages.map((stg, idx) => {
                  const isCurrent = activeStage === idx;
                  let isComplete = false;
                  if (stg.stageKey === "p1") {
                    isComplete =
                      Object.keys(p1Answers).filter((k) => !!p1Answers[k]).length ===
                      examData.part1.gaps.length;
                  } else if (stg.stageKey === "p2-1") {
                    const stId = examData.part2.stories[0]?.id;
                    isComplete = !!(stId && p2Orders[stId] && p2Orders[stId].filter(Boolean).length === 4);
                  } else if (stg.stageKey === "p2-2") {
                    const stId = examData.part2.stories[1]?.id;
                    isComplete = !!(stId && p2Orders[stId] && p2Orders[stId].filter(Boolean).length === 4);
                  } else if (stg.stageKey === "p3") {
                    isComplete =
                      Object.keys(p3Answers).filter((k) => !!p3Answers[k]).length ===
                      examData.part3.questions.length;
                  } else if (stg.stageKey === "p4") {
                    isComplete =
                      Object.keys(p4Answers).filter((k) => !!p4Answers[k]).length ===
                      examData.part4.paragraphs.length;
                  }

                  return (
                    <button
                      key={stg.stageKey}
                      id={`reading-stage-pill-${idx}`}
                      type="button"
                      onClick={() => setActiveStage(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap select-none ${
                        isCurrent
                          ? "bg-primary text-primary-foreground font-black shadow-sm border border-primary"
                          : isComplete
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/35 hover:bg-emerald-500/25"
                          : "bg-background/80 dark:bg-slate-900/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 hover:border-border"
                      }`}
                      title={stg.label}
                    >
                      {isComplete && !isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      )}
                      <span>{stg.title}</span>
                    </button>
                  );
                })}
              </div>

              <div className="h-4 w-px bg-border/70 shrink-0 mx-0.5 hidden sm:block" />

              <button
                type="button"
                onClick={() => setShowDrawer(true)}
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center bg-background/80 dark:bg-slate-900/60 hover:bg-primary/10 hover:text-primary text-muted-foreground border border-border/70 hover:border-primary/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs shrink-0"
                title="Danh sách tất cả phần thi Reading"
                aria-label="Danh sách tất cả phần thi Reading"
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
              className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
            >
              ← Previous
            </button>

            {activeStage < stages.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveStage((p) => Math.min(stages.length - 1, p + 1))}
                className="tech-btn px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(true)}
                className="tech-btn px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Nộp bài
              </button>
            )}
          </div>
        </footer>
      )}

      {/* DRAWER DANH SÁCH BÀI THI READING */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md p-5 rounded-2xl bg-card border border-border shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-heading font-bold text-xs uppercase text-muted-foreground tracking-wider">
                Danh sách bài thi Reading ({stages.length} phần)
              </h3>
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {stages.map((stg, stgIdx) => {
                const isActive = activeStage === stgIdx;
                const isFlg = flagged[stgIdx];

                let isComplete = false;
                let progressText = "";
                if (stg.stageKey === "p1") {
                  const count = Object.keys(p1Answers).filter((k) => !!p1Answers[k]).length;
                  isComplete = count === examData.part1.gaps.length;
                  progressText = `${count}/${examData.part1.gaps.length}`;
                } else if (stg.stageKey === "p2-1") {
                  const stId = examData.part2.stories[0]?.id;
                  const placed = (stId && p2Orders[stId]?.filter(Boolean).length) || 0;
                  isComplete = placed === 4;
                  progressText = placed === 4 ? "Đã xếp đủ 4 câu" : `${placed}/4 câu`;
                } else if (stg.stageKey === "p2-2") {
                  const stId = examData.part2.stories[1]?.id;
                  const placed = (stId && p2Orders[stId]?.filter(Boolean).length) || 0;
                  isComplete = placed === 4;
                  progressText = placed === 4 ? "Đã xếp đủ 4 câu" : `${placed}/4 câu`;
                } else if (stg.stageKey === "p3") {
                  const count = Object.keys(p3Answers).filter((k) => !!p3Answers[k]).length;
                  isComplete = count === examData.part3.questions.length;
                  progressText = `${count}/${examData.part3.questions.length}`;
                } else if (stg.stageKey === "p4") {
                  const count = Object.keys(p4Answers).filter((k) => !!p4Answers[k]).length;
                  isComplete = count === examData.part4.paragraphs.length;
                  progressText = `${count}/${examData.part4.paragraphs.length}`;
                }

                return (
                  <button
                    key={stg.stageKey}
                    type="button"
                    onClick={() => {
                      setActiveStage(stgIdx);
                      setShowDrawer(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary"
                        : isComplete
                        ? "border-border/60 bg-muted/20 text-foreground hover:bg-muted/40"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] shrink-0">
                        {stgIdx + 1}
                      </span>
                      <span className="truncate">{stg.label}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-normal text-muted-foreground font-mono">
                        {progressText}
                      </span>
                      {isFlg && <Flag className="w-3 h-3 text-amber-500 fill-amber-500" />}
                      {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowDrawer(false);
                  setIsSubmitModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-sm transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Nộp bài ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HIỆN ĐÁP ÁN THAM KHẢO & GIẢI THÍCH */}
      {showSampleAnswers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Đáp án &amp; Hướng dẫn giải ({stages[activeStage]?.label})</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSampleAnswers(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              {currentStage.stageKey === "p1" && (
                <div className="space-y-2">
                  {examData.part1.gaps.map((g, idx) => (
                    <div key={g.id} className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                      <div className="font-semibold text-foreground">
                        Câu {idx + 1}: {g.prompt.replace(/\[(?:gap|blank|\.\.\.)\]/i, "___")}
                      </div>
                      <div className="text-primary font-bold">
                        Đáp án đúng: <span className="underline">{g.correctAnswer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(currentStage.stageKey === "p2-1" || currentStage.stageKey === "p2-2") && (() => {
                const storyIdx = currentStage.stageKey === "p2-1" ? 0 : 1;
                const story = examData.part2.stories[storyIdx];
                if (!story) return null;
                return (
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                    <div className="font-bold text-primary">{story.title}</div>
                    <div className="text-foreground">
                      <span className="font-bold">1 (Mở đầu cố định):</span> {story.fixedSentence}
                    </div>
                    {story.correctOrder.map((sId, idx) => {
                      const sObj = story.sentences.find((s) => s.id === sId);
                      return (
                        <div key={sId} className="text-foreground">
                          <span className="font-bold">{idx + 2}:</span> {sObj?.text || sId}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {currentStage.stageKey === "p3" && (
                <div className="space-y-2">
                  {examData.part3.questions.map((q, idx) => (
                    <div key={q.id} className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                      <div className="font-semibold text-foreground">
                        Câu {idx + 1}: {q.prompt}
                      </div>
                      <div className="text-primary font-bold">
                        Đáp án đúng: <span className="underline">{q.correctAnswer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentStage.stageKey === "p4" && (
                <div className="space-y-2">
                  {examData.part4.paragraphs.map((p) => (
                    <div key={p.id} className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                      <div className="font-semibold text-foreground">
                        Đoạn văn {p.paragraphNumber}
                      </div>
                      <div className="text-primary font-bold">
                        Tiêu đề phù hợp: <span className="underline">{p.correctHeading}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setShowSampleAnswers(false)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Parser: Turns backend API getQuestions payload into structured ReadingExamData
function parseApiToReadingData(apiData: any): ReadingExamData {
  const parts = apiData.parts || [];

  const result: ReadingExamData = {
    id: apiData.id || "reading-01",
    title: apiData.title || "Bài thi Reading",
    durationMinutes: apiData.duration_minutes || (parts.length <= 1 ? 15 : 35),
    part1: {
      instructions: "Choose the word that fits in the gap. The first one is done for you.",
      exampleText: { prefix: "", word: "", suffix: "" },
      gaps: [],
    },
    part2: {
      instructions: "The sentences below make a complete text. Put them in the correct order.",
      stories: [],
    },
    part3: {
      title: "Opinion matching",
      instructions: "Read the texts and answer the questions.",
      reviews: [],
      questions: [],
    },
    part4: {
      title: "Long reading",
      instructions: "Read the passage quickly. Choose a heading for each numbered paragraph from the drop-down box.",
      allHeadings: [],
      paragraphs: [],
    },
  };

  parts.forEach((p: any) => {
    const pTitle = (p.title || "").toLowerCase();
    const pNum = p.part_number;

    // Phân loại Part chuẩn xác dựa trên tiêu đề hoặc số part
    const isP2 =
      pTitle.includes("cohesion") ||
      pTitle.includes("part 2") ||
      (pNum === 2 && !pTitle.includes("long") && !pTitle.includes("opinion"));
    const isP3 =
      pTitle.includes("opinion") ||
      (pTitle.includes("part 4") && !pTitle.includes("long") && !pTitle.includes("heading")) ||
      (pTitle.includes("part 3") && !pTitle.includes("cohesion"));
    const isP4 =
      pTitle.includes("long") ||
      pTitle.includes("heading") ||
      pNum === 5 ||
      (pNum === 4 && (pTitle.includes("long") || pTitle.includes("heading")));
    const isP1 =
      !isP2 &&
      !isP3 &&
      !isP4 &&
      (pNum === 1 || pTitle.includes("part 1") || pTitle.includes("gap") || pTitle.includes("sentence"));

    // Part 1: Gap Fill
    if (isP1) {
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
    if (isP2) {
      const stories: Part2Story[] = [];
      (p.questions || []).forEach((q: any, idx: number) => {
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

        // Trường hợp 1: options là mảng chuỗi (dữ liệu thô từ crawler)
        if (Array.isArray(q.options) || Array.isArray(optsObj)) {
          const rawArr: string[] = Array.isArray(q.options) ? q.options : optsObj;
          if (rawArr.length >= 8) {
            const mid = Math.ceil(rawArr.length / 2);
            const st1Sentences = rawArr.slice(0, mid);
            const st2Sentences = rawArr.slice(mid);

            stories.push({
              id: `${q.id}-1`,
              title: q.prompt && q.prompt !== "Put the sentences in the correct order." ? q.prompt : "Đoạn văn 1",
              fixedSentence: st1Sentences[0] || "Sentence 1 is fixed.",
              sentences: st1Sentences.slice(1).map((text, sIdx) => ({ id: `s${sIdx + 2}`, text })),
              correctOrder: st1Sentences.slice(1).map((_, sIdx) => `s${sIdx + 2}`),
            });

            stories.push({
              id: `${q.id}-2`,
              title: "Đoạn văn 2",
              fixedSentence: st2Sentences[0] || "Sentence 1 is fixed.",
              sentences: st2Sentences.slice(1).map((text, sIdx) => ({ id: `s${mid + sIdx + 2}`, text })),
              correctOrder: st2Sentences.slice(1).map((_, sIdx) => `s${mid + sIdx + 2}`),
            });
            return;
          } else if (rawArr.length >= 4) {
            stories.push({
              id: String(q.id),
              title: q.prompt && q.prompt !== "Put the sentences in the correct order." ? q.prompt : `Đoạn văn ${idx + 1}`,
              fixedSentence: rawArr.length === 5 ? rawArr[0] : "Sentence 1 is fixed.",
              sentences: (rawArr.length === 5 ? rawArr.slice(1) : rawArr).map((text, sIdx) => ({ id: `s${sIdx + 2}`, text })),
              correctOrder: (rawArr.length === 5 ? rawArr.slice(1) : rawArr).map((_, sIdx) => `s${sIdx + 2}`),
            });
            return;
          }
        }

        // Trường hợp 2: options là object chuẩn { title, fixedSentence, sentences }
        let corArr: string[] = [];
        if (Array.isArray(q.correct_answer)) corArr = q.correct_answer;
        else if (typeof q.correct_answer === "string") {
          try {
            corArr = JSON.parse(q.correct_answer);
          } catch {
            corArr = [];
          }
        }

        stories.push({
          id: String(q.id),
          title: optsObj.title || q.prompt || `Đoạn văn ${idx + 1}`,
          fixedSentence: optsObj.fixedSentence || "Sentence 1 is fixed here.",
          sentences: optsObj.sentences || [],
          correctOrder: corArr.length > 0 ? corArr : (optsObj.sentences || []).map((s: any) => s.id),
        });
      });

      if (stories.length > 0) {
        result.part2.stories = stories;
        if (p.instructions) result.part2.instructions = p.instructions;
      }
    }

    // Part 3/4: Opinion Matching
    if (isP3) {
      if (p.passage_text) {
        const cleanText = p.passage_text.replace(/\r\n/g, "\n").replace(/<[^>]+>/g, "\n");
        // Tách 4 đoạn review A, B, C, D nếu có trong passage_text
        const matches = Array.from(
          cleanText.matchAll(/(?:^|\n)\s*(?:Person\s*)?([A-D])\s*[:.-]?\s*([\s\S]*?)(?=(?:\n\s*(?:Person\s*)?[A-D]\s*[:.-]?)|$)/gi)
        );
        if (matches && matches.length >= 4) {
          result.part3.reviews = matches.slice(0, 4).map((m: any) => ({
            person: `Person ${m[1].toUpperCase()}`,
            name: `Person ${m[1].toUpperCase()}`,
            review: m[2]?.trim() || "",
          }));
        } else {
          result.part3.reviews = [
            {
              person: "Passage",
              name: "Nội dung bài đọc",
              review: cleanText.trim(),
            },
          ];
        }
      }

      const questions: Part3Question[] = (p.questions || []).map((q: any) => {
        let opts: string[] = ["Person A", "Person B", "Person C", "Person D"];
        if (Array.isArray(q.options) && q.options.length > 0) opts = q.options;
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
        if (p.title) result.part3.title = p.title;
      }
    }

    // Part 4/5: Long Reading / Heading Matching
    if (isP4) {
      const headingsSet = new Set<string>();
      const paragraphs: Part4Paragraph[] = (p.questions || []).map((q: any, idx: number) => {
        if (Array.isArray(q.options)) {
          q.options.forEach((h: string) => headingsSet.add(h));
        }
        return {
          id: String(q.id),
          paragraphNumber: q.question_number || (idx + 1),
          text: q.prompt ? q.prompt.replace(/^Paragraph\s*\d+\s*:\s*/i, "") : "",
          correctHeading: String(q.correct_answer || ""),
        };
      });
      if (paragraphs.length > 0) {
        result.part4.paragraphs = paragraphs;
        if (headingsSet.size > 0) {
          result.part4.allHeadings = Array.from(headingsSet);
        }
        if (p.instructions) result.part4.instructions = p.instructions;
        result.part4.title = p.passage_text || p.title || "Long reading";
      }
    }
  });

  return result;
}
