import { prisma } from '../../config/database';
import { SubmissionStatus, ExamSkill } from '@prisma/client';
import { compareCefr, normalizeCefrLevel } from '../../utils/cefr-engine';

export class StudentService {
  async getDashboardStats(userId?: string) {
    if (!userId) {
      return {
        streak: 0,
        totalQuestionsAnswered: 0,
        accuracyPercent: 0,
        currentLevel: 'Chưa đủ dữ liệu',
        recentTests: [],
        skillProgress: [
          { skill: 'Listening', label: 'Listening', level: 'Chưa làm', pct: 0, completedExams: 0, totalExams: 12 },
          { skill: 'Reading', label: 'Reading', level: 'Chưa làm', pct: 0, completedExams: 0, totalExams: 15 },
          { skill: 'Speaking', label: 'Speaking', level: 'Chưa làm', pct: 0, completedExams: 0, totalExams: 10 },
          { skill: 'Writing', label: 'Writing', level: 'Chưa làm', pct: 0, completedExams: 0, totalExams: 8 },
          { skill: 'Grammar', label: 'Grammar & Vocab', level: 'Chưa làm', pct: 0, completedExams: 0, totalExams: 20 },
        ],
        weakestSkill: { skill: 'Grammar', label: 'Grammar & Vocab', pct: 0, name: 'Grammar & Vocab' },
        weeklyStreak: {
          currentStreak: 0,
          completedThisWeek: 0,
          days: [false, false, false, false, false, false, false],
          isTodayDone: false,
        },
        todayRecommendation: {
          weakestPartTitle: 'Làm 1 bài thi thử Full Test trước',
          weakestPartSubtitle: 'Biết chính xác trình độ A2, B1 hay B2 của bạn để nhận lộ trình chuẩn',
          weakestPartLink: '/thi-thu',
          weakestPartButtonText: 'Vào thi thử ngay',
          wrongQuestionsCount: 0,
          wrongQuestionsDetail: 'Chưa có câu sai nào đang chờ ôn!',
          wrongQuestionsLink: '/thi-thu',
        },
        timelineProgress: [],
      };
    }

    const now = new Date();

    // 1. Lấy danh sách bài thi gần nhất
    const recentSubs = await prisma.examSubmission.findMany({
      where: { user_id: userId },
      orderBy: { started_at: 'desc' },
      take: 5,
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            skill: true,
          },
        },
      },
    });

    const recentTests = recentSubs.map((sub) => {
      const isGraded = sub.status === SubmissionStatus.GRADED || sub.status === SubmissionStatus.SUBMITTED;
      const maxScale = sub.exam.skill === ExamSkill.FULL_TEST ? 200 : 50;
      const scoreStr = isGraded && sub.total_score != null
        ? `${Math.round(sub.total_score)}/${maxScale}`
        : sub.status === SubmissionStatus.IN_PROGRESS
        ? 'Đang làm'
        : 'Chờ chấm';

      const pad = (n: number) => n.toString().padStart(2, '0');
      const d = sub.submitted_at || sub.started_at;
      const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

      let skillLabel = 'Grammar';
      if (sub.exam.skill === ExamSkill.LISTENING) skillLabel = 'Listening';
      else if (sub.exam.skill === ExamSkill.READING) skillLabel = 'Reading';
      else if (sub.exam.skill === ExamSkill.SPEAKING) skillLabel = 'Speaking';
      else if (sub.exam.skill === ExamSkill.WRITING) skillLabel = 'Writing';
      else if (sub.exam.skill === ExamSkill.FULL_TEST) skillLabel = 'Full Test';

      return {
        id: sub.id,
        examId: sub.exam.id,
        title: sub.exam.title,
        skill: skillLabel,
        score: scoreStr,
        band: sub.cefr_level || (isGraded ? 'B2' : 'Đang xử lý'),
        date: dateStr,
      };
    });

    // 2. Tổng số câu đã trả lời và tỷ lệ chính xác
    const [totalAnswers, correctAnswers] = await Promise.all([
      prisma.submissionAnswer.count({
        where: { submission: { user_id: userId } },
      }),
      prisma.submissionAnswer.count({
        where: { submission: { user_id: userId }, score: { gt: 0 } },
      }),
    ]);

    const accuracyPercent = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    // 3. Tiến độ theo 5 kỹ năng
    const completedSubs = await prisma.examSubmission.findMany({
      where: {
        user_id: userId,
        status: { in: [SubmissionStatus.GRADED, SubmissionStatus.SUBMITTED] },
      },
      select: {
        total_score: true,
        cefr_level: true,
        exam: { select: { skill: true } },
      },
    });

    const skillMap: Record<string, {
      count: number;
      totalScore: number;
      cefrCounts: Record<string, number>;
      highestCefr: string;
    }> = {
      LISTENING: { count: 0, totalScore: 0, cefrCounts: {}, highestCefr: 'Chưa làm' },
      READING: { count: 0, totalScore: 0, cefrCounts: {}, highestCefr: 'Chưa làm' },
      SPEAKING: { count: 0, totalScore: 0, cefrCounts: {}, highestCefr: 'Chưa làm' },
      WRITING: { count: 0, totalScore: 0, cefrCounts: {}, highestCefr: 'Chưa làm' },
      GRAMMAR_VOCABULARY: { count: 0, totalScore: 0, cefrCounts: {}, highestCefr: 'Chưa làm' },
    };

    for (const sub of completedSubs) {
      const sk = sub.exam.skill;
      if (skillMap[sk]) {
        skillMap[sk].count += 1;
        skillMap[sk].totalScore += sub.total_score || 0;

        if (sub.cefr_level) {
          const normCefr = normalizeCefrLevel(sub.cefr_level) || sub.cefr_level;
          skillMap[sk].cefrCounts[normCefr] = (skillMap[sk].cefrCounts[normCefr] || 0) + 1;
          if (skillMap[sk].highestCefr === 'Chưa làm' || compareCefr(normCefr, skillMap[sk].highestCefr) > 0) {
            skillMap[sk].highestCefr = normCefr;
          }
        }
      }
    }

    function getModeCefr(cefrCounts: Record<string, number>): string {
      const entries = Object.entries(cefrCounts);
      if (entries.length === 0) return 'Chưa làm';
      return entries.reduce((best, [band, count]) => {
        const [bestBand, bestCount] = best;
        if (count > bestCount) return [band, count] as [string, number];
        if (count === bestCount) {
          return compareCefr(band, bestBand) > 0
            ? [band, count] as [string, number]
            : best;
        }
        return best;
      }, ['', 0] as [string, number])[0];
    }

    const skillProgress = [
      {
        skill: 'Listening',
        label: 'Listening',
        level: skillMap.LISTENING.count > 0 ? getModeCefr(skillMap.LISTENING.cefrCounts) : 'Chưa làm',
        pct: skillMap.LISTENING.count > 0
          ? Math.min(100, Math.round((skillMap.LISTENING.totalScore / skillMap.LISTENING.count / 50) * 100))
          : 0,
        completedExams: skillMap.LISTENING.count,
        totalExams: 12,
        avgScore: skillMap.LISTENING.count > 0
          ? Math.round((skillMap.LISTENING.totalScore / skillMap.LISTENING.count / 50) * 100)
          : 0,
        highestLevel: skillMap.LISTENING.highestCefr,
      },
      {
        skill: 'Reading',
        label: 'Reading',
        level: skillMap.READING.count > 0 ? getModeCefr(skillMap.READING.cefrCounts) : 'Chưa làm',
        pct: skillMap.READING.count > 0
          ? Math.min(100, Math.round((skillMap.READING.totalScore / skillMap.READING.count / 50) * 100))
          : 0,
        completedExams: skillMap.READING.count,
        totalExams: 15,
        avgScore: skillMap.READING.count > 0
          ? Math.round((skillMap.READING.totalScore / skillMap.READING.count / 50) * 100)
          : 0,
        highestLevel: skillMap.READING.highestCefr,
      },
      {
        skill: 'Speaking',
        label: 'Speaking',
        level: skillMap.SPEAKING.count > 0 ? getModeCefr(skillMap.SPEAKING.cefrCounts) : 'Chưa làm',
        pct: skillMap.SPEAKING.count > 0
          ? Math.min(100, Math.round((skillMap.SPEAKING.totalScore / skillMap.SPEAKING.count / 50) * 100))
          : 0,
        completedExams: skillMap.SPEAKING.count,
        totalExams: 10,
        avgScore: skillMap.SPEAKING.count > 0
          ? Math.round((skillMap.SPEAKING.totalScore / skillMap.SPEAKING.count / 50) * 100)
          : 0,
        highestLevel: skillMap.SPEAKING.highestCefr,
      },
      {
        skill: 'Writing',
        label: 'Writing',
        level: skillMap.WRITING.count > 0 ? getModeCefr(skillMap.WRITING.cefrCounts) : 'Chưa làm',
        pct: skillMap.WRITING.count > 0
          ? Math.min(100, Math.round((skillMap.WRITING.totalScore / skillMap.WRITING.count / 50) * 100))
          : 0,
        completedExams: skillMap.WRITING.count,
        totalExams: 8,
        avgScore: skillMap.WRITING.count > 0
          ? Math.round((skillMap.WRITING.totalScore / skillMap.WRITING.count / 50) * 100)
          : 0,
        highestLevel: skillMap.WRITING.highestCefr,
      },
      {
        skill: 'Grammar',
        label: 'Grammar & Vocab',
        level: skillMap.GRAMMAR_VOCABULARY.count > 0 ? getModeCefr(skillMap.GRAMMAR_VOCABULARY.cefrCounts) : 'Chưa làm',
        pct: skillMap.GRAMMAR_VOCABULARY.count > 0
          ? Math.min(100, Math.round((skillMap.GRAMMAR_VOCABULARY.totalScore / skillMap.GRAMMAR_VOCABULARY.count / 50) * 100))
          : 0,
        completedExams: skillMap.GRAMMAR_VOCABULARY.count,
        totalExams: 20,
        avgScore: skillMap.GRAMMAR_VOCABULARY.count > 0
          ? Math.round((skillMap.GRAMMAR_VOCABULARY.totalScore / skillMap.GRAMMAR_VOCABULARY.count / 50) * 100)
          : 0,
        highestLevel: skillMap.GRAMMAR_VOCABULARY.highestCefr,
      },
    ];

    // Tìm kỹ năng yếu nhất
    const skillsWithExams = skillProgress.filter((s) => s.completedExams > 0);
    const weakestSkill = skillsWithExams.length > 0
      ? skillsWithExams.reduce((prev, curr) => (curr.pct < prev.pct ? curr : prev), skillsWithExams[0])
      : skillProgress.find((s) => s.skill === 'Grammar') || skillProgress[0];

    // 4. Tính toán Streak thực tế chuẩn theo Múi giờ Việt Nam (Asia/Ho_Chi_Minh GMT+7)
    const allSubs = await prisma.examSubmission.findMany({
      where: {
        user_id: userId,
        status: { in: [SubmissionStatus.GRADED, SubmissionStatus.SUBMITTED, SubmissionStatus.PENDING_EVALUATION, SubmissionStatus.IN_PROGRESS] },
      },
      select: { started_at: true, submitted_at: true },
      orderBy: { started_at: 'desc' },
    });

    const getVnDateKey = (d: Date) =>
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d);

    const activeDateStrings = new Set<string>();
    for (const sub of allSubs) {
      const d = sub.submitted_at || sub.started_at;
      activeDateStrings.add(getVnDateKey(d));
    }

    const todayStr = getVnDateKey(now);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = getVnDateKey(yesterday);

    const isTodayDone = activeDateStrings.has(todayStr);

    let streak = 0;
    if (isTodayDone || activeDateStrings.has(yesterdayStr)) {
      let checkTimestamp = isTodayDone ? now.getTime() : yesterday.getTime();
      while (true) {
        const key = getVnDateKey(new Date(checkTimestamp));
        if (activeDateStrings.has(key)) {
          streak++;
          checkTimestamp -= 24 * 60 * 60 * 1000;
        } else {
          break;
        }
      }
    }

    // Weekly days (T2 -> CN của tuần này theo giờ Việt Nam)
    const vnWeekdayStr = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'short' }).format(now);
    const weekdayMap: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
    const currentVnDayIdx = weekdayMap[vnWeekdayStr] ?? 0;

    const weekDaysActive = [false, false, false, false, false, false, false];
    for (let i = 0; i < 7; i++) {
      const offsetDays = i - currentVnDayIdx;
      const targetDate = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
      const key = getVnDateKey(targetDate);
      if (activeDateStrings.has(key)) {
        weekDaysActive[i] = true;
      }
    }
    const completedThisWeek = weekDaysActive.filter(Boolean).length;

    // 5. Ước tính Level hiện tại — dùng mode
    const allBands = completedSubs.map((s) => s.cefr_level).filter(Boolean) as string[];
    let currentLevel = 'Chưa đủ dữ liệu';
    if (allBands.length > 0) {
      const bandFreq: Record<string, number> = {};
      for (const b of allBands) bandFreq[b] = (bandFreq[b] || 0) + 1;
      const modeBand = Object.entries(bandFreq).reduce((best, [band, cnt]) => {
        const [bestBand, bestCnt] = best;
        if (cnt > bestCnt) return [band, cnt] as [string, number];
        if (cnt === bestCnt && compareCefr(band, bestBand) > 0)
          return [band, cnt] as [string, number];
        return best;
      }, ['', 0] as [string, number])[0];
      currentLevel = modeBand ? `${modeBand} Target` : 'Chưa đủ dữ liệu';
    }

    // 6. Tính toán câu sai (Wrong Answers Aggregation)
    const wrongAnswers = await prisma.submissionAnswer.findMany({
      where: {
        submission: {
          user_id: userId,
          status: { in: [SubmissionStatus.GRADED, SubmissionStatus.SUBMITTED] },
        },
        score: { lte: 0 },
      },
      select: {
        id: true,
        question: {
          select: {
            part: {
              select: {
                part_number: true,
                title: true,
                exam: {
                  select: {
                    skill: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 200,
    });

    const totalWrongCount = wrongAnswers.length;
    const partWrongCounts: Record<string, { skill: string; partNumber: number; count: number }> = {};

    for (const ans of wrongAnswers) {
      const sk = ans.question?.part?.exam?.skill;
      const partNum = ans.question?.part?.part_number || 1;
      if (sk) {
        const key = `${sk}_Part${partNum}`;
        if (!partWrongCounts[key]) {
          partWrongCounts[key] = { skill: sk, partNumber: partNum, count: 0 };
        }
        partWrongCounts[key].count += 1;
      }
    }

    const sortedWrongParts = Object.values(partWrongCounts).sort((a, b) => b.count - a.count);

    let wrongQuestionsDetail = 'Chưa có câu sai nào đang chờ ôn!';
    let wrongQuestionsLink = '/reading';

    if (totalWrongCount > 0 && sortedWrongParts.length > 0) {
      const topPartsStr = sortedWrongParts
        .slice(0, 2)
        .map((p) => {
          const skLabel = p.skill === 'READING' ? 'reading' : p.skill === 'LISTENING' ? 'listening' : p.skill === 'GRAMMAR_VOCABULARY' ? 'grammar' : p.skill.toLowerCase();
          return `${skLabel} Part ${p.partNumber} (${p.count} câu)`;
        })
        .join(', ');
      wrongQuestionsDetail = topPartsStr;

      const topSkill = sortedWrongParts[0].skill;
      if (topSkill === 'READING') wrongQuestionsLink = '/reading';
      else if (topSkill === 'LISTENING') wrongQuestionsLink = '/listening';
      else if (topSkill === 'GRAMMAR_VOCABULARY') wrongQuestionsLink = '/grammar';
      else if (topSkill === 'SPEAKING') wrongQuestionsLink = '/speaking';
      else if (topSkill === 'WRITING') wrongQuestionsLink = '/writing';
    }

    // 7. Tạo mục Gợi ý Hôm Nay (⚡ Hôm nay nên làm)
    const skillRouteMap: Record<string, string> = {
      Grammar: '/grammar',
      Reading: '/reading',
      Listening: '/listening',
      Speaking: '/speaking',
      Writing: '/writing',
    };

    let weakestPartTitle = `${weakestSkill.label} đang là phần yếu nhất`;
    let weakestPartSubtitle = weakestSkill.completedExams > 0
      ? `${weakestSkill.completedExams} lượt gần đây trung bình ${weakestSkill.pct}%, thấp hơn các part khác`
      : 'Chưa có lượt thi gần đây — nên bắt đầu luyện tập để nâng band';
    let weakestPartLink = skillRouteMap[weakestSkill.skill] || '/grammar';
    let weakestPartButtonText = `Luyện ${weakestSkill.label}`;

    if (totalAnswers === 0) {
      weakestPartTitle = 'Làm 1 bài thi thử Full Test trước';
      weakestPartSubtitle = 'Biết chính xác trình độ A2, B1 hay B2 của bạn để nhận lộ trình chuẩn';
      weakestPartLink = '/thi-thu';
      weakestPartButtonText = 'Vào thi thử ngay';
      wrongQuestionsDetail = 'Chưa có dữ liệu câu sai — làm bài để bắt đầu';
      wrongQuestionsLink = '/thi-thu';
    }

    const todayRecommendation = {
      weakestPartTitle,
      weakestPartSubtitle,
      weakestPartLink,
      weakestPartButtonText,
      wrongQuestionsCount: totalWrongCount,
      wrongQuestionsDetail,
      wrongQuestionsLink,
    };

    // 8. Tính biểu đồ năng lực theo thời gian (% chính xác qua các đợt thi)
    const timelineSubs = await prisma.examSubmission.findMany({
      where: {
        user_id: userId,
        status: { in: [SubmissionStatus.GRADED, SubmissionStatus.SUBMITTED] },
        total_score: { not: null },
      },
      orderBy: { started_at: 'asc' },
      select: {
        started_at: true,
        submitted_at: true,
        total_score: true,
        grammar_score: true,
        reading_score: true,
        listening_score: true,
        speaking_score: true,
        writing_score: true,
        exam: {
          select: { skill: true },
        },
      },
      take: 50,
    });

    const timelineMap: Record<string, {
      date: string;
      scores: Record<string, number[]>;
    }> = {};

    const getVnDayMonth = (d: Date) =>
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
      }).format(d);

    for (const sub of timelineSubs) {
      const d = sub.submitted_at || sub.started_at;
      const dateKey = getVnDayMonth(d);
      if (!timelineMap[dateKey]) {
        timelineMap[dateKey] = {
          date: dateKey,
          scores: {
            grammar: [],
            reading: [],
            listening: [],
            speaking: [],
            writing: [],
          },
        };
      }

      const sk = sub.exam.skill;
      const maxScore = 50;
      const score = sub.total_score || 0;
      const pct = Math.min(100, Math.round((score / maxScore) * 100));

      if (sk === ExamSkill.GRAMMAR_VOCABULARY || sub.grammar_score != null) {
        timelineMap[dateKey].scores.grammar.push(sub.grammar_score != null ? Math.round((sub.grammar_score / 50) * 100) : pct);
      }
      if (sk === ExamSkill.READING || sub.reading_score != null) {
        timelineMap[dateKey].scores.reading.push(sub.reading_score != null ? Math.round((sub.reading_score / 50) * 100) : pct);
      }
      if (sk === ExamSkill.LISTENING || sub.listening_score != null) {
        timelineMap[dateKey].scores.listening.push(sub.listening_score != null ? Math.round((sub.listening_score / 50) * 100) : pct);
      }
      if (sk === ExamSkill.SPEAKING || sub.speaking_score != null) {
        timelineMap[dateKey].scores.speaking.push(sub.speaking_score != null ? Math.round((sub.speaking_score / 50) * 100) : pct);
      }
      if (sk === ExamSkill.WRITING || sub.writing_score != null) {
        timelineMap[dateKey].scores.writing.push(sub.writing_score != null ? Math.round((sub.writing_score / 50) * 100) : pct);
      }
    }

    const timelineProgress = Object.values(timelineMap).map((item) => {
      const avg = (arr: number[]) => (arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : undefined);
      return {
        date: item.date,
        grammar: avg(item.scores.grammar),
        reading: avg(item.scores.reading),
        listening: avg(item.scores.listening),
        speaking: avg(item.scores.speaking),
        writing: avg(item.scores.writing),
      };
    });

    return {
      streak,
      totalQuestionsAnswered: totalAnswers,
      accuracyPercent,
      currentLevel,
      recentTests,
      skillProgress,
      weakestSkill: {
        name: weakestSkill.label,
        skill: weakestSkill.skill,
        pct: weakestSkill.pct,
        route: skillRouteMap[weakestSkill.skill] || '/grammar',
      },
      weeklyStreak: {
        currentStreak: streak,
        completedThisWeek,
        days: weekDaysActive,
        isTodayDone,
      },
      todayRecommendation,
      timelineProgress,
    };
  }

  async getStreak(userId: string) {
    const stats = await this.getDashboardStats(userId);
    return stats.weeklyStreak;
  }

  async getGoal(userId: string) {
    const now = new Date();

    // Đầu ngày hôm nay (00:00:00 giờ local → UTC)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Đếm bài đã hoàn thành hôm nay (submitted_at >= 00:00 hôm nay)
    const todayCount = await prisma.examSubmission.count({
      where: {
        user_id: userId,
        status: { in: [SubmissionStatus.GRADED, SubmissionStatus.SUBMITTED, SubmissionStatus.PENDING_EVALUATION] },
        submitted_at: { gte: todayStart },
      },
    });

    // 2. Đọc user để lấy target_band & internal_notes (lưu goal settings)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { target_band: true, internal_notes: true },
    });

    // Parse goal settings từ internal_notes JSON (nếu có)
    // Format: {..., "_goal": { "aim": "B2", "examDate": "2026-11-15", "dailyTarget": 3 }}
    let savedGoal: { aim?: string; examDate?: string; dailyTarget?: number } = {};
    if (user?.internal_notes) {
      try {
        const parsed = JSON.parse(user.internal_notes);
        if (parsed._goal) savedGoal = parsed._goal;
      } catch {
        // internal_notes có thể là plain text — bỏ qua
      }
    }

    // Fallback aim từ target_band trong DB
    const targetBandMap: Record<string, string> = {
      B1_TARGET: 'B1',
      B2_TARGET: 'B2',
      C_TARGET: 'C1',
    };
    const aimFromBand = user?.target_band ? (targetBandMap[user.target_band] ?? 'B2') : 'B2';

    const aim = savedGoal.aim ?? aimFromBand;
    const examDate = savedGoal.examDate ?? '2026-12-31';
    const dailyTarget = savedGoal.dailyTarget ?? 3;

    // 3. Gợi ý luyện tập dựa trên kỹ năng ÍT làm nhất trong 7 ngày qua
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const submissionsWithSkill = await prisma.examSubmission.findMany({
      where: {
        user_id: userId,
        started_at: { gte: weekAgo },
        status: { in: [SubmissionStatus.GRADED, SubmissionStatus.SUBMITTED, SubmissionStatus.PENDING_EVALUATION] },
      },
      select: { exam: { select: { skill: true } } },
    });

    const skillCount: Record<string, number> = {
      GRAMMAR_VOCABULARY: 0,
      LISTENING: 0,
      READING: 0,
      SPEAKING: 0,
      WRITING: 0,
    };
    for (const s of submissionsWithSkill) {
      const sk = s.exam.skill as string;
      if (sk in skillCount) skillCount[sk]++;
    }

    // Sắp xếp skill ít luyện nhất lên đầu → gợi ý 3 kỹ năng cần bổ sung
    const SKILL_META: Record<string, { label: string; route: string; duration: number }> = {
      GRAMMAR_VOCABULARY: { label: 'Grammar & Vocab', route: '/grammar',   duration: 15 },
      LISTENING:          { label: 'Listening',        route: '/listening', duration: 20 },
      READING:            { label: 'Reading',          route: '/reading',   duration: 25 },
      SPEAKING:           { label: 'Speaking',         route: '/speaking',  duration: 10 },
      WRITING:            { label: 'Writing',          route: '/writing',   duration: 20 },
    };

    const suggestions = Object.entries(skillCount)
      .sort(([, a], [, b]) => a - b)           // ít làm nhất lên đầu
      .slice(0, 3)
      .map(([sk, cnt]) => ({
        skill: SKILL_META[sk].label,
        route: SKILL_META[sk].route,
        durationMinutes: SKILL_META[sk].duration,
        title: cnt === 0
          ? `Chưa luyện ${SKILL_META[sk].label} tuần này — bắt đầu ngay!`
          : `Cần thêm ${SKILL_META[sk].label} (${cnt} bài/7 ngày)`,
        reason: cnt === 0 ? 'Kỹ năng chưa luyện tuần này' : 'Kỹ năng ít được ôn tập',
      }));

    return {
      aim,
      examDate,
      dailyTarget,
      todayCount,   // ← giờ là số thực từ DB
      suggestions,
    };
  }

  async updateGoal(userId: string, data: { aim?: string; examDate?: string; dailyTarget?: number }) {
    // Đọc internal_notes hiện tại để merge (không ghi đè các trường khác)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { internal_notes: true, target_band: true },
    });

    let notesObj: Record<string, any> = {};
    if (user?.internal_notes) {
      try { notesObj = JSON.parse(user.internal_notes); } catch { /* plain text — reset */ }
    }

    // Cập nhật/merge phần _goal
    notesObj._goal = {
      ...(notesObj._goal || {}),
      ...(data.aim        && { aim: data.aim }),
      ...(data.examDate   && { examDate: data.examDate }),
      ...(data.dailyTarget !== undefined && { dailyTarget: data.dailyTarget }),
    };

    // Đồng bộ target_band theo aim nếu có thay đổi
    const AIM_TO_BAND: Record<string, string> = { B1: 'B1_TARGET', B2: 'B2_TARGET', C1: 'C_TARGET', C: 'C_TARGET' };
    const newBand = data.aim ? AIM_TO_BAND[data.aim] : undefined;

    await prisma.user.update({
      where: { id: userId },
      data: {
        internal_notes: JSON.stringify(notesObj),
        ...(newBand && { target_band: newBand as any }),
      },
    });

    return {
      message: 'Cập nhật mục tiêu học tập thành công',
      aim: notesObj._goal.aim,
      examDate: notesObj._goal.examDate,
      dailyTarget: notesObj._goal.dailyTarget,
    };
  }
}

export const studentService = new StudentService();
