import { prisma } from '../../config/database';
import { auditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';
import { Request } from 'express';

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

export const INITIAL_TOPIC_RULES: TopicRule[] = [
  // ─────────────────────────────────────────────────────────────
  // PART 2 & 3: 5 CỎ () - ĐỀ TỦ CỰC HOT
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p23-film',
    name: 'Film & Cinema',
    hotLevel: 5,
    forecastTag: '★★★★★ Đề tủ cực hot (Part 2/3)',
    keywords: ['making films', 'film club', 'film'],
    isActive: true,
  },
  {
    id: 'p23-singer',
    name: 'Singer & Famous Singer',
    hotLevel: 5,
    forecastTag: '★★★★★ Đề tủ cực hot (Part 2/3)',
    keywords: ['singer', 'the famous singer', 'a famous singer', 'famous singer', 'singers and music'],
    isActive: true,
  },
  {
    id: 'p23-coffee-shop',
    name: 'New Coffee Shop & Busy Coffee',
    hotLevel: 5,
    forecastTag: '★★★★★ Đề tủ cực hot (Part 2/3)',
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
    forecastTag: '★★★★★ Đề tủ cực hot (Part 2/3)',
    keywords: ['end of term project', 'end of term'],
    isActive: true,
  },

  // ─────────────────────────────────────────────────────────────
  // PART 4: 5 CỎ () - ĐỀ TỦ CỰC HOT
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p4-childhood-tech-games',
    name: 'Childhood, Games & Technology',
    hotLevel: 5,
    forecastTag: '★★★★★ Đề tủ cực hot (Part 4)',
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
    forecastTag: '★★★★★ Đề tủ cực hot (Part 4)',
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
    forecastTag: '★★★★★ Đề tủ cực hot (Part 4)',
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
    forecastTag: '★★★★★ Đề tủ cực hot (Part 4)',
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
    forecastTag: '★★★★★ Đề tủ cực hot (Part 4)',
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
  // PART 2, 3, 4: 4 CỎ () - TẦN SUẤT THI CAO
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p23-woman-in-space',
    name: 'The First American Woman in Space',
    hotLevel: 4,
    forecastTag: '★★★★ Tần suất thi cao (Part 2/3)',
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
    forecastTag: '★★★★ Tần suất thi cao (Part 2/3)',
    keywords: ['weekend activities'],
    isActive: true,
  },
  {
    id: 'p23-movies-then-now',
    name: 'Movies Then and Now',
    hotLevel: 4,
    forecastTag: '★★★★ Tần suất thi cao (Part 2/3)',
    keywords: ['movies then and now'],
    isActive: true,
  },
  {
    id: 'p23-transportation-history',
    name: 'The History of Transportation',
    hotLevel: 4,
    forecastTag: '★★★★ Tần suất thi cao (Part 2/3)',
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
    forecastTag: '★★★★ Tần suất thi cao (Part 4)',
    keywords: [
      'extreme sports (phiên bản 1)',
      'extreme sports (phiên bản 2)',
      'extreme sports (phiên bản 3)',
      'extreme sports',
    ],
    isActive: true,
  },

  // ─────────────────────────────────────────────────────────────
  // PART 2, 3, 4: 3 CỎ () - TRỌNG TÂM ÔN TẬP
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p23-family-sport-day',
    name: 'Family Sports Day',
    hotLevel: 3,
    forecastTag: '★★★ Trọng tâm ôn tập (Part 2/3)',
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
    forecastTag: '★★★ Trọng tâm ôn tập (Part 2/3)',
    keywords: ['mae - the math girl', 'the math girl', 'math girl'],
    isActive: true,
  },
  {
    id: 'p23-cultural-festival',
    name: 'Cultural Festival',
    hotLevel: 3,
    forecastTag: '★★★ Trọng tâm ôn tập (Part 2/3)',
    keywords: ['cultural festival'],
    isActive: true,
  },
  {
    id: 'p23-college-welcoming',
    name: 'College Welcoming Day',
    hotLevel: 3,
    forecastTag: '★★★ Trọng tâm ôn tập (Part 2/3)',
    keywords: ['college welcoming day', 'college welcoming'],
    isActive: true,
  },
  {
    id: 'p4-childhood-memories',
    name: 'Childhood Memories',
    hotLevel: 3,
    forecastTag: '★★★ Trọng tâm ôn tập (Part 4)',
    keywords: ['childhood memories'],
    isActive: true,
  },
  {
    id: 'p4-free-time-activity',
    name: 'Free Time Activity',
    hotLevel: 3,
    forecastTag: '★★★ Trọng tâm ôn tập (Part 4)',
    keywords: ['free time activity', 'free time activities'],
    isActive: true,
  },
  {
    id: 'p4-job-and-training',
    name: 'Job and Training',
    hotLevel: 3,
    forecastTag: '★★★ Trọng tâm ôn tập (Part 4)',
    keywords: ['job and training', 'job and trainning'],
    isActive: true,
  },
  {
    id: 'p4-volunteering',
    name: 'Volunteering',
    hotLevel: 3,
    forecastTag: '★★★ Trọng tâm ôn tập (Part 4)',
    keywords: ['volunteering to clean a local park', 'volunteering'],
    isActive: true,
  },
  {
    id: 'p4-career',
    name: 'Career & Career Changes',
    hotLevel: 3,
    forecastTag: '★★★ Trọng tâm ôn tập (Part 4)',
    keywords: ['career changes', 'career path', 'a nutritionist\'s career', 'a musician\'s career', 'career'],
    isActive: true,
  },

  // ─────────────────────────────────────────────────────────────
  // PART 2 & 3: 2 CỎ () - LUYỆN TẬP MỞ RỘNG
  // ─────────────────────────────────────────────────────────────
  {
    id: 'p23-public-transport',
    name: 'Public Transportations',
    hotLevel: 2,
    forecastTag: '★★ Luyện tập mở rộng (Part 2/3)',
    keywords: ['public transportations', 'public transportation', 'public transport'],
    isActive: true,
  },
  {
    id: 'p23-writing-about-a-place',
    name: 'Writing About a Place',
    hotLevel: 2,
    forecastTag: '★★ Luyện tập mở rộng (Part 2/3)',
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
    forecastTag: '★★ Luyện tập mở rộng (Part 2/3)',
    keywords: ['music show at the park'],
    isActive: true,
  },
];

// In-memory or persisted dynamic store
let inMemoryRules: TopicRule[] = [...INITIAL_TOPIC_RULES];

export class TopicTaggerService {
  /**
   * Lấy danh sách quy tắc chủ đề kèm số lượng đề thi đang khớp trong DB
   */
  async getTopicRules(): Promise<(TopicRule & { matchedCount: number })[]> {
    const allExams = await prisma.exam.findMany({
      select: { id: true, title: true, skill: true, hot_level: true },
    });

    return inMemoryRules.map((rule) => {
      const keywords = rule.keywords.map(normalizeText);
      const matched = allExams.filter((e) => {
        if (rule.applicableSkill && rule.applicableSkill !== 'ALL' && e.skill !== rule.applicableSkill) {
          return false;
        }
        const t = normalizeText(e.title);
        if (rule.excludeKeywords?.some((ex) => t.includes(normalizeText(ex)))) {
          return false;
        }
        return keywords.some((kw) => kw && t.includes(kw));
      });

      return {
        ...rule,
        matchedCount: matched.length,
      };
    });
  }

  /**
   * Xem trước các đề thi khớp với từ khóa
   */
  async previewMatches(keywords: string[], skill?: string) {
    const normKws = keywords.map(normalizeText).filter(Boolean);
    const allExams = await prisma.exam.findMany({
      where: skill && skill !== 'ALL' ? { skill: skill as any } : undefined,
      select: {
        id: true,
        title: true,
        skill: true,
        hot_level: true,
        forecast_tag: true,
      },
      orderBy: { title: 'asc' },
    });

    const matches = allExams.filter((e) => {
      const t = normalizeText(e.title);
      return normKws.some((kw) => t.includes(kw));
    });

    return {
      keywords,
      skill: skill || 'ALL',
      totalMatches: matches.length,
      exams: matches,
    };
  }

  /**
   * Tạo mới hoặc cập nhật một chủ đề
   */
  async saveTopicRule(ruleData: Partial<TopicRule> & { name: string; hotLevel: number; keywords: string[] }, autoPropagate = false, req?: Request) {
    const id = ruleData.id || `topic-${Date.now()}`;
    const newRule: TopicRule = {
      id,
      name: ruleData.name.trim(),
      hotLevel: Number(ruleData.hotLevel),
      forecastTag:
        ruleData.forecastTag ||
        (ruleData.hotLevel === 5
          ? '★★★★★ Đề tủ cực hot'
          : ruleData.hotLevel === 4
          ? '★★★★ Tần suất thi cao'
          : ruleData.hotLevel === 3
          ? '★★★ Trọng tâm ôn tập'
          : '★★ Luyện tập mở rộng'),
      keywords: ruleData.keywords.map((k) => k.trim()).filter(Boolean),
      applicableSkill: ruleData.applicableSkill || 'ALL',
      isActive: ruleData.isActive !== false,
      description: ruleData.description,
    };

    const existingIdx = inMemoryRules.findIndex((r) => r.id === id);
    if (existingIdx >= 0) {
      inMemoryRules[existingIdx] = newRule;
    } else {
      inMemoryRules.unshift(newRule);
    }

    let propagationResult = null;
    if (autoPropagate) {
      propagationResult = await this.propagateRule(newRule, req);
    }

    auditService.record({
      req,
      action: AuditAction.EXAM_UPDATE,
      entityType: 'TOPIC_RULE',
      entityId: id,
      description: `Cập nhật quy tắc chủ đề "${newRule.name}" (${newRule.hotLevel} Cỏ)`,
      newValue: newRule,
    });

    return {
      rule: newRule,
      propagation: propagationResult,
    };
  }

  /**
   * Lan tỏa 1 quy tắc chủ đề cụ thể đến tất cả các đề thi khớp trong DB
   */
  async propagateRule(rule: TopicRule, req?: Request) {
    const keywords = rule.keywords.map(normalizeText).filter(Boolean);
    if (keywords.length === 0) return { updatedCount: 0, exams: [] };

    const allExams = await prisma.exam.findMany({
      where:
        rule.applicableSkill && rule.applicableSkill !== 'ALL'
          ? { skill: rule.applicableSkill as any }
          : undefined,
      select: { id: true, title: true, hot_level: true, forecast_tag: true },
    });

    const matchingExams = allExams.filter((e) => {
      const t = normalizeText(e.title);
      if (rule.excludeKeywords?.some((ex) => t.includes(normalizeText(ex)))) {
        return false;
      }
      return keywords.some((kw) => t.includes(kw));
    });

    let updatedCount = 0;
    const updatedIds: string[] = [];

    for (const exam of matchingExams) {
      // Chỉ cập nhật nếu khác giá trị hiện tại
      if (exam.hot_level !== rule.hotLevel || exam.forecast_tag !== rule.forecastTag) {
        await prisma.exam.update({
          where: { id: exam.id },
          data: {
            hot_level: rule.hotLevel,
            forecast_tag: rule.forecastTag,
          },
        });
        updatedCount++;
        updatedIds.push(exam.id);
      }
    }

    auditService.record({
      req,
      action: AuditAction.EXAM_UPDATE,
      entityType: 'TOPIC_PROPAGATION',
      entityId: rule.id,
      description: `Lan tỏa chủ đề "${rule.name}": Đã cập nhật ${updatedCount}/${matchingExams.length} đề thi`,
      newValue: { updatedCount, targetHotLevel: rule.hotLevel },
    });

    return {
      ruleId: rule.id,
      totalMatched: matchingExams.length,
      updatedCount,
      updatedIds,
    };
  }

  /**
   * Đồng bộ toàn bộ quy tắc chủ đề (Sync All Rules)
   * Quét và phân giải ưu tiên cho toàn bộ 1,690 đề thi
   */
  async syncAllRules(req?: Request) {
    const allExams = await prisma.exam.findMany({
      select: { id: true, title: true, skill: true, hot_level: true, forecast_tag: true },
    });

    // Sắp xếp rules theo hotLevel giảm dần
    const sortedRules = [...inMemoryRules]
      .filter((r) => r.isActive)
      .sort((a, b) => b.hotLevel - a.hotLevel);

    let updatedCount = 0;
    const updates: { id: string; title: string; oldHot: number; newHot: number; newTag: string }[] = [];

    for (const exam of allExams) {
      const t = normalizeText(exam.title);
      let matchedRule: TopicRule | undefined;

      for (const rule of sortedRules) {
        if (rule.applicableSkill && rule.applicableSkill !== 'ALL' && exam.skill !== rule.applicableSkill) {
          continue;
        }
        if (rule.excludeKeywords?.some((ex) => t.includes(normalizeText(ex)))) {
          continue;
        }
        const kws = rule.keywords.map(normalizeText);
        if (kws.some((kw) => kw && t.includes(kw))) {
          matchedRule = rule;
          break; // Rule có hotLevel cao nhất đã match
        }
      }

      if (matchedRule) {
        if (exam.hot_level !== matchedRule.hotLevel || exam.forecast_tag !== matchedRule.forecastTag) {
          await prisma.exam.update({
            where: { id: exam.id },
            data: {
              hot_level: matchedRule.hotLevel,
              forecast_tag: matchedRule.forecastTag,
            },
          });
          updatedCount++;
          updates.push({
            id: exam.id,
            title: exam.title,
            oldHot: exam.hot_level,
            newHot: matchedRule.hotLevel,
            newTag: matchedRule.forecastTag,
          });
        }
      }
    }

    auditService.record({
      req,
      action: AuditAction.EXAM_UPDATE,
      entityType: 'TOPIC_SYNC_ALL',
      entityId: 'ALL',
      description: `Đồng bộ toàn hệ thống: Cập nhật ${updatedCount} đề thi theo quy tắc chủ đề`,
      newValue: { updatedCount },
    });

    return {
      totalExams: allExams.length,
      updatedCount,
      sampleUpdates: updates.slice(0, 30),
    };
  }

  /**
   * Xóa một quy tắc chủ đề
   */
  async deleteTopicRule(ruleId: string, resetHotLevel = false, req?: Request) {
    const rule = inMemoryRules.find((r) => r.id === ruleId);
    if (!rule) return { success: false, message: 'Quy tắc không tồn tại' };

    let resetCount = 0;
    if (resetHotLevel) {
      const keywords = rule.keywords.map(normalizeText);
      const allExams = await prisma.exam.findMany({
        select: { id: true, title: true, hot_level: true },
      });
      for (const e of allExams) {
        const t = normalizeText(e.title);
        if (keywords.some((kw) => kw && t.includes(kw)) && e.hot_level === rule.hotLevel) {
          await prisma.exam.update({
            where: { id: e.id },
            data: { hot_level: 0, forecast_tag: null },
          });
          resetCount++;
        }
      }
    }

    inMemoryRules = inMemoryRules.filter((r) => r.id !== ruleId);

    auditService.record({
      req,
      action: AuditAction.EXAM_DELETE,
      entityType: 'TOPIC_RULE',
      entityId: ruleId,
      description: `Đã xóa chủ đề "${rule.name}" (Reset: ${resetCount} đề thi)`,
    });

    return { success: true, resetCount };
  }
}

export const topicTaggerService = new TopicTaggerService();
