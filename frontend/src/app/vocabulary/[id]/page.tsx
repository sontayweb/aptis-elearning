"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { api } from "@/lib/api-client";
import {
  ChevronLeft,
  Volume2,
  ListFilter,
  Layers,
  HelpCircle,
  Shuffle,
  Check,
  Plus,
  RotateCcw,
  Sparkles,
  Trophy,
  Award,
  AlertCircle,
  BookmarkCheck,
  Clock,
  ArrowRight,
} from "lucide-react";

interface WordItem {
  id: string;
  word: string;
  pos?: string;
  phonetic?: string;
  ipa?: string;
  meaning_vi?: string;
  meaning?: string;
  example_sentence?: string;
  example?: string;
  example_vi?: string;
  word_family?: Array<{ word: string; pos: string }>;
}

// Fallback high-quality word list matching the screenshot theme (Animals / Aptis General)
const FALLBACK_WORDS: WordItem[] = [
  {
    id: "w-1",
    word: "bald eagle",
    pos: "n",
    phonetic: "/ˈbɔːld ˈiːɡl/",
    meaning_vi: "đại bàng trắng",
    example_sentence: "The bald eagle is the national bird of the US.",
    example_vi: "Đại bàng trắng là quốc điểu của Mỹ.",
    word_family: [
      { word: "eagle", pos: "n" },
      { word: "bald", pos: "adj" },
    ],
  },
  {
    id: "w-2",
    word: "parrot",
    pos: "n",
    phonetic: "/ˈpær.ət/",
    meaning_vi: "con vẹt",
    example_sentence: "The colorful parrot can mimic human speech with remarkable accuracy.",
    example_vi: "Chú vẹt sặc sỡ có thể bắt chước tiếng người với độ chính xác đáng kinh ngạc.",
    word_family: [
      { word: "parroting", pos: "n" },
      { word: "parrotry", pos: "n" },
    ],
  },
  {
    id: "w-3",
    word: "crow",
    pos: "n",
    phonetic: "/kroʊ/",
    meaning_vi: "(một loài) quạ",
    example_sentence: "A black crow was perched high on the barren tree branch.",
    example_vi: "Một con quạ đen đang đậu tít trên cành cây khô trơ trụi.",
    word_family: [
      { word: "crow-black", pos: "adj" },
    ],
  },
  {
    id: "w-4",
    word: "flamingo",
    pos: "n",
    phonetic: "/fləˈmɪŋ.ɡoʊ/",
    meaning_vi: "chim hồng hạc",
    example_sentence: "Flamingos are renowned for their striking pink feathers and graceful stance.",
    example_vi: "Hồng hạc nổi tiếng với bộ lông màu hồng nổi bật và dáng đứng duyên dáng.",
    word_family: [
      { word: "flamingo-pink", pos: "adj" },
    ],
  },
  {
    id: "w-5",
    word: "deer",
    pos: "n",
    phonetic: "/dɪər/",
    meaning_vi: "con hươu, nai",
    example_sentence: "Several deer were grazing peacefully in the misty morning meadow.",
    example_vi: "Vài chú hươu đang gặm cỏ thanh bình trên đồng cỏ mờ sương buổi sớm.",
    word_family: [
      { word: "deerskin", pos: "n" },
    ],
  },
  {
    id: "w-6",
    word: "coyote",
    pos: "n",
    phonetic: "/kaɪˈoʊ.ti/",
    meaning_vi: "chó sói đồng cỏ",
    example_sentence: "We could hear the distant eerie howling of a coyote across the canyon.",
    example_vi: "Chúng tôi có thể nghe thấy tiếng hú xa xa đầy ma mị của chó sói đồng cỏ bên kia hẻm núi.",
    word_family: [
      { word: "coyotish", pos: "adj" },
    ],
  },
  {
    id: "w-7",
    word: "duck",
    pos: "n",
    phonetic: "/dʌk/",
    meaning_vi: "con vịt",
    example_sentence: "The mother duck gently guided her ducklings toward the peaceful lake.",
    example_vi: "Vịt mẹ nhẹ nhàng dẫn đàn vịt con bơi về phía hồ nước êm đềm.",
    word_family: [
      { word: "duckling", pos: "n" },
    ],
  },
  {
    id: "w-8",
    word: "cow",
    pos: "n",
    phonetic: "/kaʊ/",
    meaning_vi: "con bò",
    example_sentence: "The dairy cows provide fresh organic milk for the entire regional farm.",
    example_vi: "Đàn bò sữa cung cấp sữa tươi hữu cơ cho toàn bộ nông trang trong vùng.",
    word_family: [
      { word: "cowherd", pos: "n" },
    ],
  },
  {
    id: "w-9",
    word: "goldfish",
    pos: "n",
    phonetic: "/ˈɡoʊld.fɪʃ/",
    meaning_vi: "cá vàng",
    example_sentence: "She placed a shimmering little goldfish in the decorative aquarium on her desk.",
    example_vi: "Cô ấy thả một chú cá vàng lấp lánh vào chiếc bể cảnh trang trí trên bàn làm việc.",
    word_family: [
      { word: "gold", pos: "n" },
      { word: "fish", pos: "n" },
    ],
  },
  {
    id: "w-10",
    word: "owl",
    pos: "n",
    phonetic: "/aʊl/",
    meaning_vi: "con cú mèo",
    example_sentence: "The nocturnal owl quietly scanned the surrounding forest for prey.",
    example_vi: "Con cú săn đêm lặng lẽ quan sát khu rừng xung quanh để tìm kiếm con mồi.",
    word_family: [
      { word: "owlet", pos: "n" },
      { word: "owlish", pos: "adj" },
    ],
  },
  {
    id: "w-11",
    word: "dolphin",
    pos: "n",
    phonetic: "/ˈdɒl.fɪn/",
    meaning_vi: "cá heo",
    example_sentence: "Dolphins are celebrated worldwide for their extraordinary social intelligence.",
    example_vi: "Cá heo được tôn vinh khắp thế giới nhờ trí thông minh xã hội phi thường của chúng.",
    word_family: [
      { word: "dolphinarium", pos: "n" },
    ],
  },
  {
    id: "w-12",
    word: "elephant",
    pos: "n",
    phonetic: "/ˈel.ɪ.fənt/",
    meaning_vi: "con voi",
    example_sentence: "The African elephant is recognized as the largest living land mammal on our planet.",
    example_vi: "Voi châu Phi được công nhận là loài thú trên cạn lớn nhất còn sống trên hành tinh.",
    word_family: [
      { word: "elephantine", pos: "adj" },
    ],
  },
];

type PracticeMode = "browse" | "flashcard" | "quiz" | "matching";

export default function VocabularyDetailPage() {
  const params = useParams();
  const setId = typeof params?.id === "string" ? params.id : "";

  // Topic Metadata & Word List
  const [topicName, setTopicName] = useState("ANIMALS");
  const [categoryName, setCategoryName] = useState("APTIS GENERAL");
  const [words, setWords] = useState<WordItem[]>(FALLBACK_WORDS);
  const [loading, setLoading] = useState(true);

  // Active Mode
  const [mode, setMode] = useState<PracticeMode>("browse");

  // Mode 1: Duyệt từ State
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mode 2: Flashcard State
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // User Memorized State & Notebook Stored in localStorage
  const [memorizedWordIds, setMemorizedWordIds] = useState<Set<string>>(new Set());
  const [savedNotebookIds, setSavedNotebookIds] = useState<Set<string>>(new Set());

  // Mode 3: Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  // Mode 4: Matching Game State
  const [matchEnglishWords, setMatchEnglishWords] = useState<WordItem[]>([]);
  const [matchVietnameseMeanings, setMatchVietnameseMeanings] = useState<
    Array<{ id: string; meaning: string }>
  >([]);
  const [selectedEnWord, setSelectedEnWord] = useState<WordItem | null>(null);
  const [selectedViMeaning, setSelectedViMeaning] = useState<{ id: string; meaning: string } | null>(
    null
  );
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [mismatchedPair, setMismatchedPair] = useState<boolean>(false);
  const [matchingTimer, setMatchingTimer] = useState(0);
  const [matchingFinished, setMatchingFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Speech helper
  const speak = (text?: string, lang: "en-US" | "vi-VN" = "en-US") => {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.92;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  // Load Vocab Topic & Words
  useEffect(() => {
    async function loadData() {
      if (!setId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await api.vocabulary.getWords(setId);
        if (res.success && res.data) {
          const data = res.data;
          if (data.title) setTopicName(data.title.toUpperCase());
          if (data.category) setCategoryName(data.category.toUpperCase());

          const rawWords = Array.isArray(data.words) ? data.words : Array.isArray(data) ? data : [];
          if (rawWords.length > 0) {
            const formatted: WordItem[] = rawWords.map((w: any) => ({
              id: w.id || `w-${w.word}`,
              word: w.word,
              pos: w.pos || (w.word.includes(" ") ? "phrase" : "n"),
              phonetic: w.phonetic || w.ipa || "",
              meaning_vi: w.meaning_vi || w.meaning || "",
              example_sentence: w.example_sentence || w.example || "",
              example_vi: w.example_vi || "",
              word_family: w.word_family || [
                { word: w.word, pos: w.pos || "n" },
              ],
            }));
            setWords(formatted);
          }
        }
      } catch (err) {
        console.warn("Could not load backend vocab words, using standard wordset:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [setId]);

  // Load memorized & notebook states
  useEffect(() => {
    try {
      const storedMemorized = localStorage.getItem(`aptis_memorized_${setId}`);
      if (storedMemorized) {
        setMemorizedWordIds(new Set(JSON.parse(storedMemorized)));
      }
      const storedNotebook = localStorage.getItem("aptis_user_notebook");
      if (storedNotebook) {
        const parsed = JSON.parse(storedNotebook);
        if (Array.isArray(parsed)) {
          setSavedNotebookIds(new Set(parsed.map((item: any) => item.word?.toLowerCase())));
        }
      }
    } catch {}
  }, [setId]);

  // Current active word for Browse & Flashcard
  const currentWord = words[currentIndex] || words[0] || FALLBACK_WORDS[0];
  const currentFlashcardWord = words[flashcardIndex] || words[0] || FALLBACK_WORDS[0];

  // Helper toggle memorized
  const toggleMemorizeWord = (wordId: string) => {
    setMemorizedWordIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(wordId)) {
        updated.delete(wordId);
      } else {
        updated.add(wordId);
      }
      try {
        localStorage.setItem(`aptis_memorized_${setId}`, JSON.stringify(Array.from(updated)));
      } catch {}
      return updated;
    });
  };

  // Helper save to notebook
  const saveToNotebook = (word: WordItem) => {
    try {
      const stored = localStorage.getItem("aptis_user_notebook");
      const list = stored ? JSON.parse(stored) : [];
      const wordKey = word.word.toLowerCase();
      if (!list.some((item: any) => item.word?.toLowerCase() === wordKey)) {
        const newItem = {
          id: `nb_${Date.now()}`,
          word: word.word,
          phonetic: word.phonetic,
          meaning: word.meaning_vi || word.meaning,
          example: word.example_sentence,
        };
        const updated = [newItem, ...list];
        localStorage.setItem("aptis_user_notebook", JSON.stringify(updated));
        setSavedNotebookIds((prev) => new Set(prev).add(wordKey));
      }
    } catch {}
  };

  // Setup Matching Game
  const setupMatchingRound = () => {
    const pool = [...words].slice(0, 8);
    setMatchEnglishWords(pool);

    const shuffledMeanings = [...pool]
      .map((w) => ({ id: w.id, meaning: w.meaning_vi || w.meaning || "" }))
      .sort(() => 0.5 - Math.random());

    setMatchVietnameseMeanings(shuffledMeanings);
    setMatchedIds(new Set());
    setSelectedEnWord(null);
    setSelectedViMeaning(null);
    setMismatchedPair(false);
    setMatchingTimer(0);
    setMatchingFinished(false);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setMatchingTimer((t) => t + 1);
    }, 1000);
  };

  useEffect(() => {
    if (mode === "matching") {
      setupMatchingRound();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, words]);

  // Handle Matching click
  const handleEnWordClick = (word: WordItem) => {
    if (matchedIds.has(word.id)) return;
    setSelectedEnWord(word);
    speak(word.word, "en-US");

    if (selectedViMeaning) {
      checkMatch(word.id, selectedViMeaning.id);
    }
  };

  const handleViMeaningClick = (viItem: { id: string; meaning: string }) => {
    if (matchedIds.has(viItem.id)) return;
    setSelectedViMeaning(viItem);

    if (selectedEnWord) {
      checkMatch(selectedEnWord.id, viItem.id);
    }
  };

  const checkMatch = (enId: string, viId: string) => {
    if (enId === viId) {
      // Correct Match!
      const updated = new Set(matchedIds).add(enId);
      setMatchedIds(updated);
      setSelectedEnWord(null);
      setSelectedViMeaning(null);
      setMismatchedPair(false);

      if (updated.size === Math.min(8, words.length)) {
        if (timerRef.current) clearInterval(timerRef.current);
        setMatchingFinished(true);
      }
    } else {
      // Wrong Match
      setMismatchedPair(true);
      setTimeout(() => {
        setSelectedEnWord(null);
        setSelectedViMeaning(null);
        setMismatchedPair(false);
      }, 650);
    }
  };

  // Generate Quiz Questions
  const quizList = useMemo(() => {
    return words.slice(0, 20).map((item) => {
      // 3 random distractors
      const distractors = words
        .filter((w) => w.word !== item.word)
        .map((w) => w.word)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const allOptions = [item.word, ...distractors].sort(() => 0.5 - Math.random());
      return {
        id: item.id,
        vietnamesePrompt: item.meaning_vi || item.meaning || "Từ vựng",
        correctAnswer: item.word,
        options: allOptions,
      };
    });
  }, [words]);

  const currentQuizItem = quizList[quizIndex] || quizList[0];

  const handleSelectQuizOption = (option: string) => {
    if (isAnswerChecked) return;
    setSelectedAnswer(option);
    setIsAnswerChecked(true);

    const isCorrect = option === currentQuizItem.correctAnswer;
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
      speak(option, "en-US");
    }

    setTimeout(() => {
      if (quizIndex < quizList.length - 1) {
        setQuizIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setIsAnswerChecked(false);
      } else {
        setQuizFinished(true);
      }
    }, 1100);
  };

  const restartQuiz = () => {
    setQuizIndex(0);
    setQuizScore(0);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setQuizFinished(false);
  };

  // Word family helper
  const wordFamilyList = useMemo(() => {
    if (currentWord.word_family && currentWord.word_family.length > 0) {
      return currentWord.word_family;
    }
    const parts = currentWord.word.split(" ");
    if (parts.length > 1) {
      return parts.map((p, idx) => ({
        word: p,
        pos: idx === 0 ? "adj" : "n",
      }));
    }
    return [
      { word: currentWord.word, pos: currentWord.pos || "n" },
    ];
  }, [currentWord]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/20">
      <Navbar />

      {/* Main Top Header Banner */}
      <header className="pt-20 border-b border-border/80 bg-background/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/vocabulary"
              className="p-1.5 rounded-lg border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Quay lại danh mục"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase block leading-none mb-1">
                {categoryName}
              </span>
              <h1 className="font-heading font-black text-lg sm:text-xl text-foreground tracking-tight">
                {topicName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground font-mono px-2.5 py-1 rounded-md bg-muted/60">
              {mode === "browse"
                ? `${currentIndex + 1}/${words.length}`
                : mode === "flashcard"
                ? `${flashcardIndex + 1}/${words.length}`
                : mode === "quiz"
                ? `Câu ${quizIndex + 1}/${quizList.length}`
                : `${matchedIds.size}/${Math.min(8, words.length)}`}
            </span>
          </div>
        </div>

        {/* Dynamic Progress line */}
        <div className="w-full h-1 bg-muted/50">
          <div
            className="h-full bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] transition-all duration-300"
            style={{
              width:
                mode === "browse"
                  ? `${((currentIndex + 1) / words.length) * 100}%`
                  : mode === "flashcard"
                  ? `${((flashcardIndex + 1) / words.length) * 100}%`
                  : mode === "quiz"
                  ? `${((quizIndex + 1) / quizList.length) * 100}%`
                  : `${(matchedIds.size / Math.min(8, words.length)) * 100}%`,
            }}
          />
        </div>

        {/* 4 Mode Pills Switcher (Screenshot 1-4) */}
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setMode("browse")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              mode === "browse"
                ? "bg-primary text-white shadow-sm shadow-blue-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Duyệt từ</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("flashcard")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              mode === "flashcard"
                ? "bg-primary text-white shadow-sm shadow-blue-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Flashcard</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("quiz")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              mode === "quiz"
                ? "bg-primary text-white shadow-sm shadow-blue-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Quiz</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("matching")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              mode === "matching"
                ? "bg-primary text-white shadow-sm shadow-blue-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Matching</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-10 flex flex-col justify-center">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-9 h-9 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-muted-foreground">Đang tải bộ từ vựng luyện tập...</p>
          </div>
        ) : mode === "browse" ? (
          /* ========================================================
             MODE 1: DUYỆT TỪ (Screenshot 1)
             ======================================================== */
          <div className="space-y-6 animate-in fade-in zoom-in-98 duration-200">
            {/* Word Study Card */}
            <div className="max-w-2xl mx-auto w-full rounded-3xl border border-border/80 bg-card p-6 sm:p-9 shadow-md relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-foreground tracking-tight">
                      {currentWord.word}
                    </h2>
                    <span className="text-sm font-normal text-muted-foreground">
                      ({currentWord.pos || "n"})
                    </span>
                  </div>
                  <p className="text-sm font-mono text-muted-foreground mt-1">
                    {currentWord.phonetic || currentWord.ipa}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => speak(currentWord.word, "en-US")}
                  className="w-10 h-10 rounded-full border border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 flex items-center justify-center transition-all shrink-0 hover:scale-105 active:scale-95 shadow-xs"
                  title="Phát âm tiếng Anh"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Nghĩa tiếng Việt */}
              <div className="mt-4">
                <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {currentWord.meaning_vi || currentWord.meaning}
                </p>
                <button
                  type="button"
                  onClick={() => speak(currentWord.meaning_vi || currentWord.meaning, "vi-VN")}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-1.5 font-medium transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Nghe nghĩa</span>
                </button>
              </div>

              {/* VÍ DỤ MINH HỌA */}
              <div className="mt-6 pt-5 border-t border-border/80 space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  VÍ DỤ MINH HỌA
                </span>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm italic text-foreground font-medium leading-relaxed">
                    &ldquo;{currentWord.example_sentence || currentWord.example || "The bald eagle is the national bird of the US."}&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => speak(currentWord.example_sentence || currentWord.example, "en-US")}
                    className="text-muted-foreground hover:text-primary transition-colors p-1 shrink-0"
                    title="Nghe câu ví dụ"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {currentWord.example_vi || "Đại bàng trắng là quốc điểu của Mỹ."}
                  </p>
                  <button
                    type="button"
                    onClick={() => speak(currentWord.example_vi || "Đại bàng trắng là quốc điểu của Mỹ.", "vi-VN")}
                    className="text-muted-foreground hover:text-primary transition-colors p-1 shrink-0"
                    title="Nghe dịch nghĩa"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* WORD FAMILY */}
              <div className="mt-5 pt-4 border-t border-border/80">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2.5">
                  WORD FAMILY
                </span>
                <div className="flex flex-wrap gap-2">
                  {wordFamilyList.map((wf, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => speak(wf.word, "en-US")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted/50 hover:bg-muted text-foreground border border-border/80 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>
                        <strong>{wf.word}</strong>{" "}
                        <span className="text-muted-foreground font-normal">({wf.pos})</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="max-w-2xl mx-auto w-full space-y-4">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Trước
                </button>

                <button
                  type="button"
                  onClick={() => toggleMemorizeWord(currentWord.id)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                    memorizedWordIds.has(currentWord.id)
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-emerald-600/90 hover:bg-emerald-600 text-white"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {memorizedWordIds.has(currentWord.id)
                      ? "Đã thuộc ✓"
                      : "Đánh dấu đã thuộc"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => saveToNotebook(currentWord)}
                  className={`px-4 py-2.5 rounded-full border text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    savedNotebookIds.has(currentWord.word.toLowerCase())
                      ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20"
                      : "border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {savedNotebookIds.has(currentWord.word.toLowerCase())
                      ? "Đã trong kho"
                      : "Lưu vào kho"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(words.length - 1, prev + 1))}
                  disabled={currentIndex === words.length - 1}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Tiếp →
                </button>
              </div>

              {/* Dot Pagination */}
              <div className="flex items-center justify-center gap-1.5 flex-wrap px-4 py-2">
                {words.slice(0, Math.min(32, words.length)).map((w, idx) => (
                  <button
                    key={w.id || idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentIndex
                        ? "w-6 bg-emerald-600 dark:bg-emerald-400"
                        : memorizedWordIds.has(w.id)
                        ? "w-2 bg-emerald-300 dark:bg-emerald-800"
                        : "w-2 bg-muted hover:bg-muted-foreground/40"
                    }`}
                    title={`Từ ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : mode === "flashcard" ? (
          /* ========================================================
             MODE 2: FLASHCARD (Screenshot 2)
             ======================================================== */
          <div className="max-w-xl mx-auto w-full space-y-6 animate-in fade-in zoom-in-98 duration-200">
            {/* Subheader counters */}
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-2">
              <span>Đã thuộc: {memorizedWordIds.size}</span>
              <span>Còn lại: {Math.max(0, words.length - memorizedWordIds.size)} từ</span>
            </div>

            {/* Flip Card Container */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="cursor-pointer min-h-[320px] rounded-3xl border border-border/80 bg-card p-8 shadow-md flex flex-col items-center justify-center text-center relative hover:border-primary/50 transition-all select-none group"
            >
              {!isFlipped ? (
                /* Card Front */
                <div className="space-y-4 my-auto">
                  <div className="flex items-baseline justify-center gap-2">
                    <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-foreground tracking-tight">
                      {currentFlashcardWord.word}
                    </h2>
                    <span className="text-sm font-normal text-muted-foreground">
                      ({currentFlashcardWord.pos || "n"})
                    </span>
                  </div>

                  <p className="text-sm font-mono text-muted-foreground">
                    {currentFlashcardWord.phonetic || currentFlashcardWord.ipa}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(currentFlashcardWord.word, "en-US");
                    }}
                    className="w-10 h-10 rounded-full border border-border hover:bg-muted flex items-center justify-center mx-auto text-muted-foreground hover:text-foreground transition-all"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <p className="text-xs text-muted-foreground pt-4">Bấm để lật thẻ</p>
                </div>
              ) : (
                /* Card Back */
                <div className="space-y-4 my-auto animate-in fade-in duration-150">
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {currentFlashcardWord.meaning_vi || currentFlashcardWord.meaning}
                  </p>

                  <p className="text-sm italic text-foreground font-medium px-4">
                    &ldquo;{currentFlashcardWord.example_sentence || currentFlashcardWord.example}&rdquo;
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(currentFlashcardWord.meaning_vi || currentFlashcardWord.meaning, "vi-VN");
                    }}
                    className="w-10 h-10 rounded-full border border-border hover:bg-muted flex items-center justify-center mx-auto text-muted-foreground hover:text-foreground transition-all"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <p className="text-xs text-muted-foreground pt-4">Bấm để lật lại</p>
                </div>
              )}
            </div>

            {/* Footer Text & Buttons */}
            <p className="text-center text-xs text-muted-foreground">
              Lật thẻ để xem nghĩa và đánh giá
            </p>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsFlipped(false);
                  setFlashcardIndex((prev) => Math.max(0, prev - 1));
                }}
                disabled={flashcardIndex === 0}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Trước
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFlipped(false);
                    setFlashcardIndex((prev) => (prev + 1) % words.length);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                >
                  Chưa thuộc
                </button>

                <button
                  type="button"
                  onClick={() => {
                    toggleMemorizeWord(currentFlashcardWord.id);
                    setIsFlipped(false);
                    setFlashcardIndex((prev) => (prev + 1) % words.length);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Đã thuộc ✓
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsFlipped(false);
                  setFlashcardIndex((prev) => Math.min(words.length - 1, prev + 1));
                }}
                disabled={flashcardIndex === words.length - 1}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Tiếp →
              </button>
            </div>
          </div>
        ) : mode === "quiz" ? (
          /* ========================================================
             MODE 3: QUIZ (Screenshot 3)
             ======================================================== */
          <div className="max-w-2xl mx-auto w-full space-y-6 animate-in fade-in zoom-in-98 duration-200">
            {!quizFinished ? (
              <>
                {/* Status Bar */}
                <div className="flex items-center justify-between">
                  <div className="px-3 py-1 rounded-full bg-muted/60 text-xs font-bold text-foreground">
                    Câu {quizIndex + 1} / {quizList.length}
                  </div>
                  <div className="px-3.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold shadow-sm">
                    Điểm: {quizScore}
                  </div>
                </div>

                {/* Quiz Card */}
                <div className="rounded-3xl border border-border/80 bg-card p-8 sm:p-10 shadow-md text-center space-y-6">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block">
                    NGHĨA TIẾNG VIỆT
                  </span>

                  <h3 className="text-3xl sm:text-4xl font-black font-heading text-foreground">
                    {currentQuizItem.vietnamesePrompt}
                  </h3>

                  {/* 2x2 Answer Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4">
                    {currentQuizItem.options.map((option) => {
                      const isSelected = selectedAnswer === option;
                      const isCorrect = option === currentQuizItem.correctAnswer;

                      let btnStyle = "bg-muted/40 hover:bg-muted/80 border-border text-foreground";
                      if (isAnswerChecked) {
                        if (isCorrect) {
                          btnStyle = "bg-emerald-500/15 border-emerald-500 text-emerald-600 font-bold";
                        } else if (isSelected && !isCorrect) {
                          btnStyle = "bg-rose-500/15 border-rose-500 text-rose-600 font-bold";
                        }
                      }

                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={isAnswerChecked}
                          onClick={() => handleSelectQuizOption(option)}
                          className={`w-full py-4 px-5 rounded-2xl border text-sm font-semibold transition-all text-center flex items-center justify-center ${btnStyle}`}
                        >
                          <span>{option}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              /* Quiz Finished Summary */
              <div className="rounded-3xl border border-border/80 bg-card p-8 sm:p-12 shadow-md text-center space-y-5 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto">
                  <Trophy className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-black text-2xl text-foreground">
                  Hoàn thành Quiz!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Bạn trả lời đúng <strong className="text-primary text-base">{quizScore}</strong> / {quizList.length} câu.
                </p>

                <div className="pt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={restartQuiz}
                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-brand-brown transition-colors shadow-sm"
                  >
                    Làm lại Quiz
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("matching")}
                    className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted font-bold text-xs transition-colors"
                  >
                    Thử sức với Matching
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================
             MODE 4: MATCHING (Screenshot 4)
             ======================================================== */
          <div className="max-w-2xl mx-auto w-full space-y-6 animate-in fade-in zoom-in-98 duration-200">
            {/* Status Bar */}
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-muted-foreground">
                Đã ghép: <span className="text-foreground">{matchedIds.size} / {Math.min(8, words.length)}</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                <span>{matchingTimer}s</span>
              </div>
            </div>

            {/* Matching Card Container */}
            <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-md space-y-5">
              <p className="text-center text-xs text-muted-foreground">
                Bấm 1 từ tiếng Anh bên trái, sau đó bấm nghĩa tiếng Việt tương ứng bên phải.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Left: English Words */}
                <div className="space-y-2">
                  {matchEnglishWords.map((item) => {
                    const isMatched = matchedIds.has(item.id);
                    const isSelected = selectedEnWord?.id === item.id;

                    let style = "bg-muted/30 hover:bg-muted/60 border-border text-foreground";
                    if (isMatched) {
                      style = "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 line-through opacity-40 pointer-events-none";
                    } else if (isSelected) {
                      style = mismatchedPair
                        ? "bg-rose-500/15 border-rose-500 text-rose-600 animate-shake"
                        : "bg-primary/10 border-primary text-primary font-bold shadow-xs";
                    }

                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={isMatched}
                        onClick={() => handleEnWordClick(item)}
                        className={`w-full py-3 px-4 rounded-xl border text-xs sm:text-sm font-medium transition-all text-left truncate flex items-center justify-between ${style}`}
                      >
                        <span className="truncate">{item.word}</span>
                        {isMatched && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Right: Vietnamese Meanings */}
                <div className="space-y-2">
                  {matchVietnameseMeanings.map((item) => {
                    const isMatched = matchedIds.has(item.id);
                    const isSelected = selectedViMeaning?.id === item.id;

                    let style = "bg-muted/30 hover:bg-muted/60 border-border text-foreground";
                    if (isMatched) {
                      style = "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 line-through opacity-40 pointer-events-none";
                    } else if (isSelected) {
                      style = mismatchedPair
                        ? "bg-rose-500/15 border-rose-500 text-rose-600 animate-shake"
                        : "bg-primary/10 border-primary text-primary font-bold shadow-xs";
                    }

                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={isMatched}
                        onClick={() => handleViMeaningClick(item)}
                        className={`w-full py-3 px-4 rounded-xl border text-xs sm:text-sm font-medium transition-all text-left truncate flex items-center justify-between ${style}`}
                      >
                        <span className="truncate">{item.meaning}</span>
                        {isMatched && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Matching Finished Victory Banner */}
              {matchingFinished && (
                <div className="pt-4 border-t border-border/80 text-center space-y-3 animate-in fade-in zoom-in-95">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 text-emerald-600 font-bold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Hoàn thành xuất sắc trong {matchingTimer} giây!</span>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={setupMatchingRound}
                      className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-brand-brown transition-colors shadow-sm"
                    >
                      Chơi lại vòng mới
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
