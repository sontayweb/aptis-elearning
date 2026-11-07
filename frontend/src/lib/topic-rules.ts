/**
 * Topic Rules & Auto-Tagging Engine for Aptis ESOL
 * Quản lý bộ quy tắc chủ đề và tự động gán nhãn Cỏ (☘️) / Sao (⭐) cho đề thi
 */

export interface TopicRule {
  id: string;
  name: string;
  hotLevel: number; // 1 to 5
  forecastTag: string;
  keywords: string[];
  excludeKeywords?: string[];
  applicableSkill?: 'ALL' | 'READING' | 'LISTENING' | 'SPEAKING' | 'WRITING';
  description?: string;
  isActive: boolean;
}

export interface ExamMatchTarget {
  id: string;
  title: string;
  skill?: string;
  hotLevel?: number;
  forecastTag?: string | null;
  partTitle?: string;
}

export interface MatchResult {
  matched: boolean;
  rule?: TopicRule;
  hotLevel: number;
  forecastTag: string;
}

/**
 * Chuẩn hóa chuỗi văn bản để so sánh chính xác:
 * - Chuyển chữ thường
 * - Chuẩn hóa khoảng trắng thừa quanh ngoặc, dấu gạch nối
 * - Loại bỏ ký tự đặc biệt không cần thiết
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .trim();
}

/**
 * Bộ quy tắc chủ đề chuẩn hóa mặc định (Default Seed Rules)
 * Phản ánh chính xác danh mục chủ đề Part 2, 3, 4 theo yêu cầu
 */
export const DEFAULT_TOPIC_RULES: TopicRule[] = [
  // ─────────────────────────────────────────────────────────────
  // PART 2 & 3: 5 CỎ (☘️☘️☘️☘️☘️) - ĐỀ TỦ CỰC HOT
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p23-film',
    name: 'Film & Cinema',
    hotLevel: 5,
    forecastTag: '☘️☘️☘️☘️☘️ Đề tủ cực hot (Part 2/3)',
    keywords: ['making films', 'film club', 'film'],
    isActive: true,
  },
  {
    id: 'p23-singer',
    name: 'Singer & Famous Singer',
    hotLevel: 5,
    forecastTag: '☘️☘️☘️☘️☘️ Đề tủ cực hot (Part 2/3)',
    keywords: ['singer', 'the famous singer', 'a famous singer', 'famous singer', 'singers and music'],
    isActive: true,
  },
  {
    id: 'p23-coffee-shop',
    name: 'New Coffee Shop & Busy Coffee',
    hotLevel: 5,
    forecastTag: '☘️☘️☘️☘️☘️ Đề tủ cực hot (Part 2/3)',
    keywords: [
      'new coffee shop',
      'my visit to a new coffee shop',
      'busy coffee',
      'coffee shop',
    ],
    isActive: true,
  },
  {
    id: 'p23-end-of-term',
    name: 'End of Term Project',
    hotLevel: 5,
    forecastTag: '☘️☘️☘️☘️☘️ Đề tủ cực hot (Part 2/3)',
    keywords: ['end of term project', 'end of term'],
    isActive: true,
  },

  // ─────────────────────────────────────────────────────────────
  // PART 4: 5 CỎ (☘️☘️☘️☘️☘️) - ĐỀ TỦ CỰC HOT
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p4-childhood-tech-games',
    name: 'Childhood, Games & Technology',
    hotLevel: 5,
    forecastTag: '☘️☘️☘️☘️☘️ Đề tủ cực hot (Part 4)',
    keywords: [
      'games from childhood',
      'technology in childhood',
      'technology in childhood - phiên bản 2',
      'childhood',
    ],
    excludeKeywords: ['childhood memories'],
    isActive: true,
  },
  {
    id: 'p4-music-festival',
    name: 'Music Festival (Versions 1-4)',
    hotLevel: 5,
    forecastTag: '☘️☘️☘️☘️☘️ Đề tủ cực hot (Part 4)',
    keywords: [
      'music festival - version 1',
      'music festival - version 2',
      'music festival - version 3',
      'music festival - version 4',
      'music festival',
      'a music festival',
    ],
    isActive: true,
  },
  {
    id: 'p4-mountain',
    name: 'Mountain & Mountain Summits',
    hotLevel: 5,
    forecastTag: '☘️☘️☘️☘️☘️ Đề tủ cực hot (Part 4)',
    keywords: [
      'mountain (phiên bản 1)',
      'mountain (phiên bản 2)',
      'mountain summits (phiên bản 3)',
      'mountain (phiên bản 4)',
      'mountain summits',
      'mountain',
    ],
    isActive: true,
  },
  {
    id: 'p4-four-day-week',
    name: 'The Arrival of Four-Day Week',
    hotLevel: 5,
    forecastTag: '☘️☘️☘️☘️☘️ Đề tủ cực hot (Part 4)',
    keywords: [
      'the arrival of four-day week (phiên bản 1)',
      'the arrival of four-day week (phiên bản 2)',
      'the arrival of four-day week',
      'four-day week',
    ],
    isActive: true,
  },
  {
    id: 'p4-women-mathematicians',
    name: 'Women Mathematicians',
    hotLevel: 5,
    forecastTag: '☘️☘️☘️☘️☘️ Đề tủ cực hot (Part 4)',
    keywords: [
      'women mathematicians (phiên bản 1)',
      'women mathematicians (phiên bản 2)',
      'women mathematicians',
      'woman mathematics (tp1)',
      'woman mathematics',
      'woman mathematicians',
    ],
    isActive: true,
  },

  // ─────────────────────────────────────────────────────────────
  // PART 2, 3, 4: 4 CỎ (☘️☘️☘️☘️) - TẦN SUẤT THI CAO
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p23-woman-in-space',
    name: 'The First American Woman in Space',
    hotLevel: 4,
    forecastTag: '☘️☘️☘️☘️ Tần suất thi cao (Part 2/3)',
    keywords: [
      'the first american woman in space',
      'american woman in space',
      'woman in space',
    ],
    isActive: true,
  },
  {
    id: 'p23-weekend-activities',
    name: 'Weekend Activities',
    hotLevel: 4,
    forecastTag: '☘️☘️☘️☘️ Tần suất thi cao (Part 2/3)',
    keywords: ['weekend activities'],
    isActive: true,
  },
  {
    id: 'p23-movies-then-now',
    name: 'Movies Then and Now',
    hotLevel: 4,
    forecastTag: '☘️☘️☘️☘️ Tần suất thi cao (Part 2/3)',
    keywords: ['movies then and now'],
    isActive: true,
  },
  {
    id: 'p23-transportation-history',
    name: 'The History of Transportation',
    hotLevel: 4,
    forecastTag: '☘️☘️☘️☘️ Tần suất thi cao (Part 2/3)',
    keywords: [
      'the history of transportation (phiên bản 2)',
      'the history of transportation',
      'history of transportation',
    ],
    isActive: true,
  },
  {
    id: 'p4-extreme-sports',
    name: 'Extreme Sports (Versions 1-3)',
    hotLevel: 4,
    forecastTag: '☘️☘️☘️☘️ Tần suất thi cao (Part 4)',
    keywords: [
      'extreme sports (phiên bản 1)',
      'extreme sports (phiên bản 2)',
      'extreme sports (phiên bản 3)',
      'extreme sports',
    ],
    isActive: true,
  },

  // ─────────────────────────────────────────────────────────────
  // PART 2, 3, 4: 3 CỎ (☘️☘️☘️) - TRỌNG TÂM ÔN TẬP
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p23-family-sport-day',
    name: 'Family Sports Day',
    hotLevel: 3,
    forecastTag: '☘️☘️☘️ Trọng tâm ôn tập (Part 2/3)',
    keywords: [
      'family sport day (phiên bản 1)',
      'family sports day (phiên bản 2)',
      'family sports day',
      'family sport days',
      'family sport day',
      'family sport',
    ],
    isActive: true,
  },
  {
    id: 'p23-math-girl',
    name: 'Mae - The Math Girl',
    hotLevel: 3,
    forecastTag: '☘️☘️☘️ Trọng tâm ôn tập (Part 2/3)',
    keywords: ['mae - the math girl', 'the math girl', 'math girl'],
    isActive: true,
  },
  {
    id: 'p23-cultural-festival',
    name: 'Cultural Festival',
    hotLevel: 3,
    forecastTag: '☘️☘️☘️ Trọng tâm ôn tập (Part 2/3)',
    keywords: ['cultural festival'],
    isActive: true,
  },
  {
    id: 'p23-college-welcoming',
    name: 'College Welcoming Day',
    hotLevel: 3,
    forecastTag: '☘️☘️☘️ Trọng tâm ôn tập (Part 2/3)',
    keywords: ['college welcoming day', 'college welcoming'],
    isActive: true,
  },
  {
    id: 'p4-childhood-memories',
    name: 'Childhood Memories',
    hotLevel: 3,
    forecastTag: '☘️☘️☘️ Trọng tâm ôn tập (Part 4)',
    keywords: ['childhood memories'],
    isActive: true,
  },
  {
    id: 'p4-free-time-activity',
    name: 'Free Time Activity',
    hotLevel: 3,
    forecastTag: '☘️☘️☘️ Trọng tâm ôn tập (Part 4)',
    keywords: ['free time activity', 'free time activities'],
    isActive: true,
  },
  {
    id: 'p4-job-and-training',
    name: 'Job and Training',
    hotLevel: 3,
    forecastTag: '☘️☘️☘️ Trọng tâm ôn tập (Part 4)',
    keywords: ['job and training', 'job and trainning'],
    isActive: true,
  },
  {
    id: 'p4-volunteering',
    name: 'Volunteering',
    hotLevel: 3,
    forecastTag: '☘️☘️☘️ Trọng tâm ôn tập (Part 4)',
    keywords: ['volunteering to clean a local park', 'volunteering'],
    isActive: true,
  },
  {
    id: 'p4-career',
    name: 'Career & Career Changes',
    hotLevel: 3,
    forecastTag: '☘️☘️☘️ Trọng tâm ôn tập (Part 4)',
    keywords: ['career changes', 'career path', 'a nutritionist\'s career', 'a musician\'s career', 'career'],
    isActive: true,
  },

  // ─────────────────────────────────────────────────────────────
  // PART 2 & 3: 2 CỎ (☘️☘️) - LUYỆN TẬP MỞ RỘNG
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p23-public-transport',
    name: 'Public Transportations',
    hotLevel: 2,
    forecastTag: '☘️☘️ Luyện tập mở rộng (Part 2/3)',
    keywords: ['public transportations', 'public transportation', 'public transport'],
    isActive: true,
  },
  {
    id: 'p23-writing-about-a-place',
    name: 'Writing About a Place',
    hotLevel: 2,
    forecastTag: '☘️☘️ Luyện tập mở rộng (Part 2/3)',
    keywords: [
      'writing about a place (phiên bản 2)',
      'writing about a place',
    ],
    isActive: true,
  },
  {
    id: 'p23-music-show-park',
    name: 'Music Show at the Park',
    hotLevel: 2,
    forecastTag: '☘️☘️ Luyện tập mở rộng (Part 2/3)',
    keywords: ['music show at the park'],
    isActive: true,
  },
];

/**
 * Đánh giá độ khớp của 1 đề thi với tập luật chủ đề
 * Nguyên tắc ưu tiên (Precedence):
 * 1. Mức Hot Level cao hơn thắng (5 Cỏ > 4 Cỏ > 3 Cỏ > 2 Cỏ)
 * 2. Cùng Hot Level: Từ khóa dài hơn, đặc thù hơn thắng
 */
export function matchExamTopic(
  exam: ExamMatchTarget,
  rules: TopicRule[] = DEFAULT_TOPIC_RULES
): MatchResult {
  const normTitle = normalizeText(exam.title || '');
  const normPartTitle = normalizeText(exam.partTitle || '');

  // Sắp xếp rules theo hotLevel giảm dần để rule 5 Cỏ luôn được ưu tiên kiểm tra trước
  const sortedRules = [...rules]
    .filter((r) => r.isActive)
    .sort((a, b) => b.hotLevel - a.hotLevel);

  let bestRule: TopicRule | undefined;
  let highestLevel = 0;

  for (const rule of sortedRules) {
    // Kiểm tra kỹ năng áp dụng nếu có
    if (
      rule.applicableSkill &&
      rule.applicableSkill !== 'ALL' &&
      exam.skill &&
      exam.skill !== rule.applicableSkill
    ) {
      continue;
    }

    // Kiểm tra từ khóa loại trừ (excludeKeywords) để tránh nuốt chuỗi con
    if (
      rule.excludeKeywords &&
      rule.excludeKeywords.some((exKw) => {
        const normEx = normalizeText(exKw);
        return normTitle.includes(normEx) || normPartTitle.includes(normEx);
      })
    ) {
      continue;
    }

    // Sắp xếp từ khóa dài hơn trước để khớp chính xác cụm từ
    const sortedKeywords = [...rule.keywords]
      .map(normalizeText)
      .sort((a, b) => b.length - a.length);

    for (const kw of sortedKeywords) {
      if (!kw) continue;
      // Kiểm tra trong tiêu đề đề thi hoặc tiêu đề part
      if (normTitle.includes(kw) || normPartTitle.includes(kw)) {
        if (rule.hotLevel > highestLevel) {
          highestLevel = rule.hotLevel;
          bestRule = rule;
        }
        break; // Khớp 1 từ khóa của rule này rồi thì chuyển sang xét tiếp
      }
    }
  }

  if (bestRule) {
    return {
      matched: true,
      rule: bestRule,
      hotLevel: bestRule.hotLevel,
      forecastTag: bestRule.forecastTag,
    };
  }

  return {
    matched: false,
    hotLevel: exam.hotLevel || 0,
    forecastTag: exam.forecastTag || '',
  };
}

/**
 * Tự động gán nhãn hàng loạt (Auto-Propagate) cho danh sách đề thi
 */
export function autoTagExams(
  exams: ExamMatchTarget[],
  rules: TopicRule[] = DEFAULT_TOPIC_RULES
): {
  updatedExams: (ExamMatchTarget & { newHotLevel: number; newForecastTag: string; matchedRule?: TopicRule })[];
  totalUpdated: number;
} {
  const updatedExams = exams.map((ex) => {
    const res = matchExamTopic(ex, rules);
    return {
      ...ex,
      newHotLevel: res.hotLevel,
      newForecastTag: res.forecastTag,
      matchedRule: res.rule,
    };
  });

  const totalUpdated = updatedExams.filter(
    (e) => (e.hotLevel || 0) !== e.newHotLevel || (e.forecastTag || '') !== e.newForecastTag
  ).length;

  return { updatedExams, totalUpdated };
}
