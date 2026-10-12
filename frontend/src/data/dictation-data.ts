/**
 * ==============================================================================
 * APTIS ESOL PREMIER — NGÂN HÀNG CÂU & BÀI HỌC LUYỆN NGHE CHÉP CHÍNH TẢ (DICTATION DATA)
 * Chuẩn hóa 1:1 theo hệ thống dữ liệu thực tế aptiskytich.vn
 * ==============================================================================
 */

export interface DictationSentence {
  id: string | number;
  level: string;
  topic: string;
  originalText: string;
  hint?: string;
  audioTime: string;
}

export interface DictationLesson {
  id: string;
  level: "foundation" | "momentum" | "mastery";
  title: string; // VD: "Đề 01 - Part 1 · Bài 02"
  part: string; // VD: "Part 1", "Part 2", "Part 3"
  subtitle?: string; // VD: "Nghe & điền từ"
  description?: string;
  totalSentences: number;
  completedSentences: number;
  sentences: DictationSentence[];
}

export const DEFAULT_LEVEL_PROGRESS: Record<
  string,
  { totalLessons: number; totalSentences: number; completedSentences: number }
> = {
  foundation: { totalLessons: 355, totalSentences: 1681, completedSentences: 0 },
  momentum: { totalLessons: 34, totalSentences: 364, completedSentences: 0 },
  mastery: { totalLessons: 133, totalSentences: 1441, completedSentences: 0 },
};

export const DEFAULT_DICTATION_LESSONS: Record<string, DictationLesson[]> = {
  foundation: [
    {
      id: "f-les-02",
      level: "foundation",
      title: "Đề 01 - Part 1 · Bài 02",
      part: "Part 1",
      subtitle: "Nghe & điền từ",
      description: "Thảo luận giờ ăn tối và thông báo chuyến bay khẩn",
      totalSentences: 3,
      completedSentences: 0,
      sentences: [
        {
          id: "f-2-1",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 02",
          originalText: "About dinner tonight - we first said half past seven, but my meeting finishes late, so eight o'clock is better.",
          hint: "dinner / meeting / finishes",
          audioTime: "00:06",
        },
        {
          id: "f-2-2",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 02",
          originalText: "Passengers for flight BA204 should proceed to gate fourteen immediately.",
          hint: "passengers / gate",
          audioTime: "00:05",
        },
        {
          id: "f-2-3",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 02",
          originalText: "The opening seminar at the campus library begins at quarter to ten tomorrow.",
          hint: "seminar / library / quarter",
          audioTime: "00:05",
        },
      ],
    },
    {
      id: "f-les-06",
      level: "foundation",
      title: "Đề 01 - Part 1 · Bài 06",
      part: "Part 1",
      subtitle: "Nghe & điền từ",
      description: "Hỏi giá vé tàu điện và địa điểm bảo tàng mỹ thuật",
      totalSentences: 3,
      completedSentences: 0,
      sentences: [
        {
          id: "f-6-1",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 06",
          originalText: "Could you tell me how much a single ticket to central station costs?",
          hint: "ticket / central station / costs",
          audioTime: "00:04",
        },
        {
          id: "f-6-2",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 06",
          originalText: "The modern art museum is located right across from the main square.",
          hint: "museum / located / main square",
          audioTime: "00:05",
        },
        {
          id: "f-6-3",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 06",
          originalText: "She decided to leave her heavy coat inside the cloakroom near the entrance.",
          hint: "cloakroom / entrance",
          audioTime: "00:05",
        },
      ],
    },
    {
      id: "f-les-07",
      level: "foundation",
      title: "Đề 01 - Part 1 · Bài 07",
      part: "Part 1",
      subtitle: "Nghe & điền từ",
      description: "Hẹn gặp bác sĩ nha khoa và hướng dẫn kiểm tra sức khỏe",
      totalSentences: 5,
      completedSentences: 0,
      sentences: [
        {
          id: "f-7-1",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 07",
          originalText: "I would like to reschedule my dental appointment to Friday afternoon.",
          hint: "reschedule / dental / appointment",
          audioTime: "00:05",
        },
        {
          id: "f-7-2",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 07",
          originalText: "The doctor recommended drinking at least two litres of fresh water daily.",
          hint: "recommended / litres / water",
          audioTime: "00:05",
        },
        {
          id: "f-7-3",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 07",
          originalText: "Please bring your official insurance card to the reception desk upon arrival.",
          hint: "insurance / reception / arrival",
          audioTime: "00:06",
        },
        {
          id: "f-7-4",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 07",
          originalText: "The clinic opens at eight thirty every morning except public holidays.",
          hint: "clinic / holidays",
          audioTime: "00:04",
        },
        {
          id: "f-7-5",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 07",
          originalText: "You need to take this special medicine twice a day right after meals.",
          hint: "medicine / twice / meals",
          audioTime: "00:05",
        },
      ],
    },
    {
      id: "f-les-08",
      level: "foundation",
      title: "Đề 01 - Part 1 · Bài 08",
      part: "Part 1",
      subtitle: "Nghe & điền từ",
      description: "Đăng ký khóa học bơi và các quy định an toàn hồ bơi",
      totalSentences: 5,
      completedSentences: 0,
      sentences: [
        {
          id: "f-8-1",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 08",
          originalText: "All swimmers must shower thoroughly before entering the competition pool.",
          hint: "swimmers / shower / entering",
          audioTime: "00:05",
        },
        {
          id: "f-8-2",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 08",
          originalText: "Children under twelve years old have to be accompanied by an adult guardian.",
          hint: "accompanied / guardian",
          audioTime: "00:05",
        },
        {
          id: "f-8-3",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 08",
          originalText: "Swimming lessons for beginners take place every Tuesday and Thursday afternoon.",
          hint: "lessons / beginners / Thursday",
          audioTime: "00:06",
        },
        {
          id: "f-8-4",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 08",
          originalText: "Lockers in the changing room require a one pound coin which is returned.",
          hint: "lockers / changing room / coin",
          audioTime: "00:05",
        },
        {
          id: "f-8-5",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 08",
          originalText: "Life jackets are provided free of charge next to the lifeguard station.",
          hint: "jackets / provided / lifeguard",
          audioTime: "00:05",
        },
      ],
    },
    {
      id: "f-les-09",
      level: "foundation",
      title: "Đề 01 - Part 1 · Bài 09",
      part: "Part 1",
      subtitle: "Nghe & điền từ",
      description: "Đặt bàn ăn tối cho gia đình và hỏi các món ăn chay",
      totalSentences: 3,
      completedSentences: 0,
      sentences: [
        {
          id: "f-9-1",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 09",
          originalText: "Could I reserve a table for four near the garden window this evening?",
          hint: "reserve / table / garden",
          audioTime: "00:05",
        },
        {
          id: "f-9-2",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 09",
          originalText: "We offer a diverse selection of delicious vegetarian and vegan dishes.",
          hint: "diverse / selection / vegetarian",
          audioTime: "00:05",
        },
        {
          id: "f-9-3",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 09",
          originalText: "The chef prepares homemade pasta using organic ingredients sourced locally.",
          hint: "prepares / homemade / organic",
          audioTime: "00:05",
        },
      ],
    },
    {
      id: "f-les-10",
      level: "foundation",
      title: "Đề 01 - Part 1 · Bài 10",
      part: "Part 1",
      subtitle: "Nghe & điền từ",
      description: "Thông báo hoãn chuyến tàu và hướng dẫn đổi tuyến xe buýt",
      totalSentences: 4,
      completedSentences: 0,
      sentences: [
        {
          id: "f-10-1",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 10",
          originalText: "We regret to announce that the four fifteen train to Oxford has been postponed.",
          hint: "regret / announce / postponed",
          audioTime: "00:05",
        },
        {
          id: "f-10-2",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 10",
          originalText: "Passengers holding valid tickets may use replacement bus service number forty.",
          hint: "passengers / replacement / service",
          audioTime: "00:05",
        },
        {
          id: "f-10-3",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 10",
          originalText: "Customer service representatives are standing by at platform two to assist.",
          hint: "representatives / platform / assist",
          audioTime: "00:05",
        },
        {
          id: "f-10-4",
          level: "Level 1 - Foundation",
          topic: "Đề 01 - Part 1 · Bài 10",
          originalText: "Full ticket refunds can be claimed online through our official mobile application.",
          hint: "refunds / claimed / application",
          audioTime: "00:05",
        },
      ],
    },
  ],
  momentum: [
    {
      id: "m-les-01",
      level: "momentum",
      title: "Đề 01 - Part 2 · Bài 01",
      part: "Part 2",
      subtitle: "Nghe & điền từ",
      description: "Báo cáo môi trường và học tập hợp tác theo nhóm",
      totalSentences: 3,
      completedSentences: 0,
      sentences: [
        {
          id: "m-1-1",
          level: "Level 2 - Momentum",
          topic: "Đề 01 - Part 2 · Bài 01",
          originalText: "The company announced substantial improvements in its annual environmental report.",
          hint: "substantial / environmental",
          audioTime: "00:06",
        },
        {
          id: "m-1-2",
          level: "Level 2 - Momentum",
          topic: "Đề 01 - Part 2 · Bài 01",
          originalText: "Most participants agreed that collaborative learning significantly enhances cognitive development.",
          hint: "collaborative / enhances",
          audioTime: "00:07",
        },
        {
          id: "m-1-3",
          level: "Level 2 - Momentum",
          topic: "Đề 01 - Part 2 · Bài 01",
          originalText: "Although the weather conditions deteriorated rapidly, the international expedition completed their objectives.",
          hint: "deteriorated / expedition / objectives",
          audioTime: "00:07",
        },
      ],
    },
    {
      id: "m-les-02",
      level: "momentum",
      title: "Đề 01 - Part 2 · Bài 02",
      part: "Part 2",
      subtitle: "Nghe & điền từ",
      description: "Kỹ năng làm việc đa văn hóa và chính sách học tập linh hoạt",
      totalSentences: 3,
      completedSentences: 0,
      sentences: [
        {
          id: "m-2-1",
          level: "Level 2 - Momentum",
          topic: "Đề 01 - Part 2 · Bài 02",
          originalText: "Working in multicultural teams requires high emotional intelligence and active listening skills.",
          hint: "multicultural / intelligence / listening",
          audioTime: "00:06",
        },
        {
          id: "m-2-2",
          level: "Level 2 - Momentum",
          topic: "Đề 01 - Part 2 · Bài 02",
          originalText: "The new university policy aims to provide flexible learning hours for working professionals.",
          hint: "flexible / professionals",
          audioTime: "00:06",
        },
        {
          id: "m-2-3",
          level: "Level 2 - Momentum",
          topic: "Đề 01 - Part 2 · Bài 02",
          originalText: "Technological advancements have radically changed the way modern businesses interact with clients.",
          hint: "advancements / interact",
          audioTime: "00:07",
        },
      ],
    },
    {
      id: "m-les-03",
      level: "momentum",
      title: "Đề 01 - Part 2 · Bài 03",
      part: "Part 2",
      subtitle: "Nghe & điền từ",
      description: "Quản trị chuỗi cung ứng toàn cầu và chiến lược thích ứng khí hậu",
      totalSentences: 4,
      completedSentences: 0,
      sentences: [
        {
          id: "m-3-1",
          level: "Level 2 - Momentum",
          topic: "Đề 01 - Part 2 · Bài 03",
          originalText: "Global supply chains must cultivate resilience in order to withstand geopolitical disruptions.",
          hint: "supply chains / resilience / disruptions",
          audioTime: "00:06",
        },
        {
          id: "m-3-2",
          level: "Level 2 - Momentum",
          topic: "Đề 01 - Part 2 · Bài 03",
          originalText: "Senior executives underlined the vital significance of transitioning towards carbon-neutral shipping methods.",
          hint: "executives / significance / carbon-neutral",
          audioTime: "00:07",
        },
        {
          id: "m-3-3",
          level: "Level 2 - Momentum",
          topic: "Đề 01 - Part 2 · Bài 03",
          originalText: "Consumer confidence registered steady growth across regional metropolitan markets despite recent inflation.",
          hint: "consumer confidence / metropolitan / inflation",
          audioTime: "00:07",
        },
        {
          id: "m-3-4",
          level: "Level 2 - Momentum",
          topic: "Đề 01 - Part 2 · Bài 03",
          originalText: "The newly drafted urban mobility plan incorporates dedicated lanes for electric buses and bicycles.",
          hint: "mobility plan / dedicated lanes / bicycles",
          audioTime: "00:07",
        },
      ],
    },
  ],
  mastery: [
    {
      id: "mas-les-01",
      level: "mastery",
      title: "Đề 01 - Part 3 · Bài 01",
      part: "Part 3",
      subtitle: "Nghe & điền từ",
      description: "Quy hoạch đô thị bền vững và phương pháp sư phạm đổi mới",
      totalSentences: 3,
      completedSentences: 0,
      sentences: [
        {
          id: "mas-1-1",
          level: "Level 3 - Mastery",
          topic: "Đề 01 - Part 3 · Bài 01",
          originalText: "From my vantage point, sustainable urban planning requires immediate integration of renewable energy grids.",
          hint: "sustainable / integration / renewable",
          audioTime: "00:08",
        },
        {
          id: "mas-1-2",
          level: "Level 3 - Mastery",
          topic: "Đề 01 - Part 3 · Bài 01",
          originalText: "Notwithstanding the substantial economic headwinds, innovative pedagogical methods have revolutionized remote higher education.",
          hint: "Notwithstanding / headwinds / pedagogical",
          audioTime: "00:09",
        },
        {
          id: "mas-1-3",
          level: "Level 3 - Mastery",
          topic: "Đề 01 - Part 3 · Bài 01",
          originalText: "The advisory committee reached a strong consensus regarding the implementation of rigorous carbon offset mechanisms.",
          hint: "consensus / rigorous / carbon",
          audioTime: "00:09",
        },
      ],
    },
    {
      id: "mas-les-02",
      level: "mastery",
      title: "Đề 01 - Part 3 · Bài 02",
      part: "Part 3",
      subtitle: "Nghe & điền từ",
      description: "Thuyết trình chuyên sâu về chính sách tài chính vĩ mô",
      totalSentences: 3,
      completedSentences: 0,
      sentences: [
        {
          id: "mas-2-1",
          level: "Level 3 - Mastery",
          topic: "Đề 01 - Part 3 · Bài 02",
          originalText: "Macroeconomic stability hinges upon prudential monetary policies designed to mitigate volatile currency fluctuations.",
          hint: "Macroeconomic / prudential / fluctuations",
          audioTime: "00:09",
        },
        {
          id: "mas-2-2",
          level: "Level 3 - Mastery",
          topic: "Đề 01 - Part 3 · Bài 02",
          originalText: "Scholars argue that cognitive flexibility represents a paramount determinant in post-industrial labor productivity.",
          hint: "flexibility / determinant / productivity",
          audioTime: "00:09",
        },
        {
          id: "mas-2-3",
          level: "Level 3 - Mastery",
          topic: "Đề 01 - Part 3 · Bài 02",
          originalText: "Epistemological disagreements frequently emerge during interdisciplinary academic conferences examining artificial intelligence ethics.",
          hint: "Epistemological / interdisciplinary / ethics",
          audioTime: "00:09",
        },
      ],
    },
    {
      id: "mas-les-03",
      level: "mastery",
      title: "Đề 01 - Part 4 · Bài 01",
      part: "Part 4",
      subtitle: "Nghe & điền từ",
      description: "Hội thảo học thuật về phân bổ tài nguyên và tính bền vững sinh thái",
      totalSentences: 3,
      completedSentences: 0,
      sentences: [
        {
          id: "mas-3-1",
          level: "Level 3 - Mastery",
          topic: "Đề 01 - Part 4 · Bài 01",
          originalText: "Biodiversity conservation necessitates transformative socio-economic paradigms that prioritize ecological equilibrium over short-term fiscal expansion.",
          hint: "Biodiversity / equilibrium / fiscal",
          audioTime: "00:10",
        },
        {
          id: "mas-3-2",
          level: "Level 3 - Mastery",
          topic: "Đề 01 - Part 4 · Bài 01",
          originalText: "Empirical findings corroborate the hypothesis that intrinsic motivation fosters long-term linguistic proficiency.",
          hint: "Empirical / corroborate / proficiency",
          audioTime: "00:08",
        },
        {
          id: "mas-3-3",
          level: "Level 3 - Mastery",
          topic: "Đề 01 - Part 4 · Bài 01",
          originalText: "Systemic reforms in municipal governance are indispensable for cultivating climate-resilient metropolitan infrastructure.",
          hint: "Systemic / municipal / infrastructure",
          audioTime: "00:09",
        },
      ],
    },
  ],
};

// Flattened list for backward compatibility
export const DEFAULT_DICTATION_SENTENCES: Record<string, DictationSentence[]> = {
  foundation: DEFAULT_DICTATION_LESSONS.foundation.flatMap((l) => l.sentences),
  momentum: DEFAULT_DICTATION_LESSONS.momentum.flatMap((l) => l.sentences),
  mastery: DEFAULT_DICTATION_LESSONS.mastery.flatMap((l) => l.sentences),
};
