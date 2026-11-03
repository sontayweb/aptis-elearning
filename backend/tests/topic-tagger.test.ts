import { normalizeText, INITIAL_TOPIC_RULES, TopicRule } from '../src/modules/admin/topic-tagger.service';

describe('--- UNIT TESTS: TOPIC RULES & AUTO-TAGGING ENGINE ---', () => {

  describe('1. Text Normalization (normalizeText)', () => {
    it('should lowercase and trim text cleanly', () => {
      expect(normalizeText('  Film Club  ')).toBe('film club');
      expect(normalizeText('THE FAMOUS SINGER')).toBe('the famous singer');
    });

    it('should normalize multiple whitespace and brackets', () => {
      expect(normalizeText('Extreme sports ( Phiên bản 3 )')).toBe('extreme sports (phiên bản 3)');
      expect(normalizeText('Mountain   Summits (   phiên bản 3   )')).toBe('mountain summits (phiên bản 3)');
    });

    it('should normalize em-dash and en-dash to regular hyphen', () => {
      expect(normalizeText('Film club 2 — Full Writing')).toBe('film club 2 - full writing');
      expect(normalizeText('Part 1 – Sentence comprehension')).toBe('part 1 - sentence comprehension');
    });

    it('should handle null or empty input gracefully without throwing', () => {
      expect(normalizeText('')).toBe('');
      expect(normalizeText((null as unknown) as string)).toBe('');
      expect(normalizeText((undefined as unknown) as string)).toBe('');
    });
  });

  describe('2. User-Specified Topic Coverage & Clover Accuracy', () => {
    // Helper function for pure algorithmic matching
    function matchTopicPure(title: string, rules: TopicRule[] = INITIAL_TOPIC_RULES): { hotLevel: number; forecastTag: string; matchedRuleName?: string } {
      const normTitle = normalizeText(title);
      const sortedRules = [...rules]
        .filter((r) => r.isActive)
        .sort((a, b) => b.hotLevel - a.hotLevel);

      for (const rule of sortedRules) {
        if (rule.excludeKeywords && rule.excludeKeywords.some((ex) => normTitle.includes(normalizeText(ex)))) {
          continue;
        }
        const sortedKws = [...rule.keywords]
          .map(normalizeText)
          .sort((a, b) => b.length - a.length);

        for (const kw of sortedKws) {
          if (kw && normTitle.includes(kw)) {
            return {
              hotLevel: rule.hotLevel,
              forecastTag: rule.forecastTag,
              matchedRuleName: rule.name,
            };
          }
        }
      }

      return { hotLevel: 0, forecastTag: '' };
    }

    // ─────────────────────────────────────────────────────────────
    // Part 2 & 3: 5 CỎ ()
    // ─────────────────────────────────────────────────────────────
    test('Part 2/3 - 5 Clovers: Film, singer, coffee shop, end of term', () => {
      const testCases = [
        { title: 'Đề 07 - Making films + Family sports day', expectedHot: 5 },
        { title: 'Đề 09 - My visit to a new coffee shop + A famous singer', expectedHot: 5 },
        { title: 'Đề 27 - A famous singer', expectedHot: 5 },
        { title: 'Đề 29 - My visit to a new coffee shop', expectedHot: 5 },
        { title: 'Đề 31 - Eating at restaurant + End of term project', expectedHot: 5 },
        { title: 'Đề 35 - Making films + A famous singer', expectedHot: 5 },
        { title: 'Đề 36 - Making films + My visit to a new coffee shop', expectedHot: 5 },
        { title: 'Đề 37 - End of term project + Music show at the park', expectedHot: 5 },
        { title: 'Film club 2 — Full Writing · 4 Parts', expectedHot: 5 },
        { title: 'Đề 10 - Singers and music', expectedHot: 5 },
      ];

      for (const tc of testCases) {
        const res = matchTopicPure(tc.title);
        expect(res.hotLevel).toBe(tc.expectedHot);
      }
    });

    // ─────────────────────────────────────────────────────────────
    // Part 2 & 3: 4 CỎ ()
    // ─────────────────────────────────────────────────────────────
    test('Part 2/3 - 4 Clovers: Woman in space, Weekend activities, Movies then and now, Transportation', () => {
      const testCases = [
        { title: 'The first American woman in Space', expectedHot: 4 },
        { title: 'Weekend activities (Reading Part 2)', expectedHot: 4 },
        { title: 'Movies then and now - Version 1', expectedHot: 4 },
        { title: 'The first american woman in space', expectedHot: 4 },
        { title: 'Đề 14 - The history of transportation', expectedHot: 4 },
        { title: 'The history of transportation (phiên bản 2)', expectedHot: 4 },
      ];

      for (const tc of testCases) {
        const res = matchTopicPure(tc.title);
        expect(res.hotLevel).toBe(tc.expectedHot);
      }
    });

    // ─────────────────────────────────────────────────────────────
    // Part 2 & 3: 3 CỎ ()
    // ─────────────────────────────────────────────────────────────
    test('Part 2/3 - 3 Clovers: Family sport day, Mae - The Math Girl, Cultural festival, College Welcoming', () => {
      const testCases = [
        { title: 'Family Sport Day (phiên bản 1)', expectedHot: 3 },
        { title: 'Family sports day (phiên bản 2)', expectedHot: 3 },
        { title: 'Mae - The Math Girl', expectedHot: 3 },
        { title: 'Đề 11 - Cultural festival', expectedHot: 3 },
        { title: 'College Welcoming Day', expectedHot: 3 },
      ];

      for (const tc of testCases) {
        const res = matchTopicPure(tc.title);
        expect(res.hotLevel).toBe(tc.expectedHot);
      }
    });

    // ─────────────────────────────────────────────────────────────
    // Part 2 & 3: 2 CỎ ()
    // ─────────────────────────────────────────────────────────────
    test('Part 2/3 - 2 Clovers: Public transportations, Writing about a place, Music show at the park', () => {
      const testCases = [
        { title: 'Public Transportations in big cities', expectedHot: 2 },
        { title: 'Đề 08 - Writing about a place', expectedHot: 2 },
        { title: 'Writing about a place (phiên bản 2)', expectedHot: 2 },
        { title: 'Đề 32 - Music show at the park', expectedHot: 2 },
      ];

      for (const tc of testCases) {
        const res = matchTopicPure(tc.title);
        expect(res.hotLevel).toBe(tc.expectedHot);
      }
    });

    // ─────────────────────────────────────────────────────────────
    // Part 4: 5 CỎ ()
    // ─────────────────────────────────────────────────────────────
    test('Part 4 - 5 Clovers: Childhood, Games, Tech, Music festival, Mountain, Four-day week, Women mathematicians', () => {
      const testCases = [
        { title: 'Đề 07 - Games from childhood (2026)', expectedHot: 5 },
        { title: 'Music festival - Version 3', expectedHot: 5 },
        { title: 'Games from childhood', expectedHot: 5 },
        { title: 'Music festival - Version 1', expectedHot: 5 },
        { title: 'Đề 10 - Technology in childhood (2026)', expectedHot: 5 },
        { title: 'Technology in childhood - Phiên bản 2', expectedHot: 5 },
        { title: 'Music festival - Version 2', expectedHot: 5 },
        { title: 'Music festival - Version 4', expectedHot: 5 },
        { title: 'Mountain (Phiên bản 1)', expectedHot: 5 },
        { title: 'The arrival of four-day week (Phiên bản 2)', expectedHot: 5 },
        { title: 'Mountain ( Phiên bản 2)', expectedHot: 5 },
        { title: 'The arrival of four-day week ( Phiên bản 1)', expectedHot: 5 },
        { title: 'Women mathematicians (Phiên bản 1)', expectedHot: 5 },
        { title: 'Women mathematicians (phiên bản 2)', expectedHot: 5 },
        { title: 'Woman Mathematics (TP1)', expectedHot: 5 },
        { title: 'Mountain Summits ( phiên bản 3)', expectedHot: 5 },
        { title: 'Mountain (phiên bản 4)', expectedHot: 5 },
        { title: 'Đề 13 - Music Festival (2026)', expectedHot: 5 },
        { title: 'Đề 24 - Mountain (Version 2)', expectedHot: 5 },
      ];

      for (const tc of testCases) {
        const res = matchTopicPure(tc.title);
        expect(res.hotLevel).toBe(tc.expectedHot);
      }
    });

    // ─────────────────────────────────────────────────────────────
    // Part 4: 4 CỎ ()
    // ─────────────────────────────────────────────────────────────
    test('Part 4 - 4 Clovers: Extreme sports (Versions 1-3)', () => {
      const testCases = [
        { title: 'Extreme sports ( Phiên bản 3)', expectedHot: 4 },
        { title: 'Extreme sports', expectedHot: 4 },
        { title: 'Extreme sports (phiên bản 2)', expectedHot: 4 },
        { title: 'Đề 08 - Extreme sports. (2026)', expectedHot: 4 },
      ];

      for (const tc of testCases) {
        const res = matchTopicPure(tc.title);
        expect(res.hotLevel).toBe(tc.expectedHot);
      }
    });

    // ─────────────────────────────────────────────────────────────
    // Part 4: 3 CỎ ()
    // ─────────────────────────────────────────────────────────────
    test('Part 4 - 3 Clovers: Childhood memories, Free time activity, Job and training, Volunteering, Career', () => {
      const testCases = [
        { title: 'Childhood memories from school', expectedHot: 3 },
        { title: 'Đề 22 - Free time activity (2026)', expectedHot: 3 },
        { title: 'Đề 21 - Job and training', expectedHot: 3 },
        { title: 'Đề 14 - Volunteering to clean a local park', expectedHot: 3 },
        { title: 'Đề 08 - Career changes', expectedHot: 3 },
      ];

      for (const tc of testCases) {
        const res = matchTopicPure(tc.title);
        expect(res.hotLevel).toBe(tc.expectedHot);
      }
    });
  });

  describe('3. Conflict Resolution & Precedence (Higher Hot Level Always Wins)', () => {
    function matchTopicPure(title: string, rules: TopicRule[] = INITIAL_TOPIC_RULES): number {
      const normTitle = normalizeText(title);
      const sortedRules = [...rules]
        .filter((r) => r.isActive)
        .sort((a, b) => b.hotLevel - a.hotLevel);

      for (const rule of sortedRules) {
        for (const kw of rule.keywords.map(normalizeText)) {
          if (kw && normTitle.includes(kw)) {
            return rule.hotLevel;
          }
        }
      }
      return 0;
    }

    it('should resolve "Making films (5)" vs "Family sports day (3)" to 5 ', () => {
      const title = 'Đề 07 - Making films + Family sports day';
      expect(matchTopicPure(title)).toBe(5);
    });

    it('should resolve "Family sports day (3)" vs "The first American woman in space (4)" to 4 ', () => {
      const title = 'Đề 34 - Family sports day + The first American woman in space';
      expect(matchTopicPure(title)).toBe(4);
    });

    it('should resolve "End of term project (5)" vs "Music show at the park (2)" to 5 ', () => {
      const title = 'Đề 37 - End of term project + Music show at the park';
      expect(matchTopicPure(title)).toBe(5);
    });
  });

  describe('4. Reading Page Filter: Including Part 2 in Tab "Full" & Sorting', () => {
    const mockExams = [
      { id: '1', title: 'Full Reading Test 01', totalParts: 4, hotLevel: 0 },
      { id: '2', title: 'Full Reading Test 02', totalParts: 4, hotLevel: 0 },
      { id: '3', title: 'Đề 07 - Making films + Family sports day', totalParts: 1, partTitle: 'Part 2: Text Cohesion', hotLevel: 5 },
      { id: '4', title: 'Đề 08 - Writing about a place', totalParts: 1, partTitle: 'Part 2: Text Cohesion', hotLevel: 2 },
      { id: '5', title: 'Đề 14 - The history of transportation', totalParts: 1, partTitle: 'Part 2: Text Cohesion', hotLevel: 4 },
      { id: '6', title: 'Đề 11 - Cultural festival', totalParts: 1, partTitle: 'Part 2: Text Cohesion', hotLevel: 3 },
      { id: '7', title: 'Reading Part 1 - Gap Fill Set 01', totalParts: 1, partTitle: 'Part 1: Sentence comprehension', hotLevel: 0 },
      { id: '8', title: 'Reading Part 3 - Opinion Matching Set 01', totalParts: 1, partTitle: 'Part 3: Opinion matching', hotLevel: 0 },
    ];

    it('should include all Full tests AND all Part 2 tests in activeTab === "full"', () => {
      const activeTab = 'full';
      const currentTabExams = mockExams.filter((e) => {
        const isFullReading = e.title.includes('Full Reading') || e.totalParts === 4;
        if (activeTab === 'full') {
          return (
            isFullReading ||
            e.partTitle?.includes('Part 2') ||
            e.partTitle?.includes('Text Cohesion') ||
            e.partTitle?.includes('Cohesion') ||
            e.title.includes('Part 2')
          );
        }
        return false;
      });

      // Should include tests 1, 2 (Full) and tests 3, 4, 5, 6 (Part 2) = 6 tests
      expect(currentTabExams.length).toBe(6);
      expect(currentTabExams.some((e) => e.id === '1')).toBe(true);
      expect(currentTabExams.some((e) => e.id === '3')).toBe(true);
      expect(currentTabExams.some((e) => e.id === '4')).toBe(true);
      // Should NOT include Part 1 (id 7) or Part 3 (id 8)
      expect(currentTabExams.some((e) => e.id === '7')).toBe(false);
      expect(currentTabExams.some((e) => e.id === '8')).toBe(false);
    });

    it('should sort exams in Tab "Full" by hotLevel descending (5 -> 4 -> 3 -> 2 -> 0)', () => {
      const activeTab = 'full';
      const examsInTab = mockExams.filter((e) => {
        const isFullReading = e.title.includes('Full Reading') || e.totalParts === 4;
        return (
          isFullReading ||
          e.partTitle?.includes('Part 2') ||
          e.partTitle?.includes('Text Cohesion')
        );
      });

      const sorted = [...examsInTab].sort((a, b) => {
        const diff = (b.hotLevel || 0) - (a.hotLevel || 0);
        if (diff !== 0) return diff;
        return a.title.localeCompare(b.title);
      });

      // Top exam must be hotLevel 5 (Making films)
      expect(sorted[0].hotLevel).toBe(5);
      expect(sorted[0].id).toBe('3');

      // Second exam must be hotLevel 4 (Transportation)
      expect(sorted[1].hotLevel).toBe(4);
      expect(sorted[1].id).toBe('5');

      // Third exam must be hotLevel 3 (Cultural festival)
      expect(sorted[2].hotLevel).toBe(3);
      expect(sorted[2].id).toBe('6');

      // Fourth exam must be hotLevel 2 (Writing about a place)
      expect(sorted[3].hotLevel).toBe(2);
      expect(sorted[3].id).toBe('4');
    });
  });

  describe('5. Topic Rule Mutation & Auto-Propagation Simulation', () => {
    it('should update hotLevel dynamically when a topic rule changes', () => {
      // Clone rules
      const dynamicRules: TopicRule[] = [
        {
          id: 'test-rule-1',
          name: 'Film & Cinema',
          hotLevel: 3, // Start at 3 clovers
          forecastTag: '★★★ Trọng tâm ôn tập',
          keywords: ['film', 'making films'],
          isActive: true,
        },
      ];

      const exam = { title: 'Đề 07 - Making films + Family sports day' };
      const normTitle = normalizeText(exam.title);

      // Initial check -> should be 3
      let matched = dynamicRules.find((r) => r.keywords.some((kw) => normTitle.includes(normalizeText(kw))));
      expect(matched?.hotLevel).toBe(3);

      // Admin updates rule to 5 clovers
      dynamicRules[0].hotLevel = 5;
      dynamicRules[0].forecastTag = '★★★★★ Đề tủ cực hot';

      // Re-evaluate -> should immediately be 5
      matched = dynamicRules.find((r) => r.keywords.some((kw) => normTitle.includes(normalizeText(kw))));
      expect(matched?.hotLevel).toBe(5);
      expect(matched?.forecastTag).toBe('★★★★★ Đề tủ cực hot');
    });
  });

  describe('6. Real DB Exam Titles Matching Across 4 Skills', () => {
    function matchTopicPure(title: string, rules: TopicRule[] = INITIAL_TOPIC_RULES): number {
      const normTitle = normalizeText(title);
      const sortedRules = [...rules]
        .filter((r) => r.isActive)
        .sort((a, b) => b.hotLevel - a.hotLevel);

      for (const rule of sortedRules) {
        if (rule.excludeKeywords && rule.excludeKeywords.some((ex) => normTitle.includes(normalizeText(ex)))) {
          continue;
        }
        for (const kw of rule.keywords.map(normalizeText)) {
          if (kw && normTitle.includes(kw)) {
            return rule.hotLevel;
          }
        }
      }
      return 0;
    }

    test('Reading real exams match correctly', () => {
      expect(matchTopicPure('Đề Thi Thử Reading – Bộ Đề Tủ Part 2 (Đề 01: Making films + Family sport days)')).toBe(5);
      expect(matchTopicPure('Đề Thi Thử Reading – Bộ Đề Tủ Part 2 (Đề 02: My visit to a new coffee shop + A famous singer)')).toBe(5);
      expect(matchTopicPure('Đề 24 - Mountain (Version 2)')).toBe(5);
      expect(matchTopicPure('Đề 27 - Women Mathematicians (Version 2)')).toBe(5);
      expect(matchTopicPure('Đề 14 - The history of transportation')).toBe(4);
      expect(matchTopicPure('Đề 08 - Extreme sports. (2026)')).toBe(4);
      expect(matchTopicPure('Đề 11 - Cultural festival')).toBe(3);
      expect(matchTopicPure('Đề 08 - Writing about a place')).toBe(2);
      expect(matchTopicPure('Đề 32 - Music show at the park')).toBe(2);
    });

    test('Writing real exams match correctly', () => {
      expect(matchTopicPure('Film Club Version 1')).toBe(5);
      expect(matchTopicPure('Film club - Writing Part 1')).toBe(5);
      expect(matchTopicPure('Film club 2 — Full Writing · 4 Parts')).toBe(5);
      expect(matchTopicPure('Film club 3 — Full Writing · 4 Parts')).toBe(5);
    });

    test('Speaking real exams match correctly', () => {
      expect(matchTopicPure('Đề 05 - Library vs coffee shop')).toBe(5);
      expect(matchTopicPure('Đề 47 - A music festival')).toBe(5);
      expect(matchTopicPure('Talk about a time you attended a music festival. (Part 4)')).toBe(5);
    });

    test('Listening real exams match correctly', () => {
      expect(matchTopicPure('Đề 10 - Singers and music')).toBe(5);
      expect(matchTopicPure('Đề 30 - Singers and music')).toBe(5);
      expect(matchTopicPure('Đề 36 - Singers and music (Version 2)')).toBe(5);
      expect(matchTopicPure('Đề 08 - Career changes')).toBe(3);
      expect(matchTopicPure("Đề 15 - A nutritionist's career")).toBe(3);
    });

    test('Unrelated exams remain at hotLevel 0', () => {
      expect(matchTopicPure('Đề Thi Thử Aptis ESOL Full Test 01')).toBe(0);
      expect(matchTopicPure('Vocabulary Quiz: Advanced Collocations')).toBe(0);
      expect(matchTopicPure('Reading Part 1 - Daily Conversations')).toBe(0);
    });
  });
});
