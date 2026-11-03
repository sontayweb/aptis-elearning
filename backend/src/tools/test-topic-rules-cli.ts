/**
 * CLI Test Runner: Unit Tests for Topic Rules & Clover Matching
 * Chạy độc lập, in chi tiết từng case kiểm thử kèm kết quả đối soát
 */

import { normalizeText, INITIAL_TOPIC_RULES, TopicRule } from '../modules/admin/topic-tagger.service';

interface TestCase {
  part: string;
  expectedLevel: number;
  expectedTag: string;
  testTitle: string;
  skill?: string;
  note?: string;
}

const testCases: TestCase[] = [
  // ─────────────────────────────────────────────────────────────
  // PART 2 & 3: 5 CỎ ()
  // ─────────────────────────────────────────────────────────────
  { part: 'Part 2/3', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Đề 07 - Making films + Family sports day', note: 'Chủ đề Film' },
  { part: 'Part 2/3', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Đề 09 - My visit to a new coffee shop + A famous singer', note: 'Chủ đề Coffee + Singer' },
  { part: 'Part 2/3', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Đề 27 - A famous singer', note: 'Chủ đề Singer' },
  { part: 'Part 2/3', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Đề 29 - My visit to a new coffee shop', note: 'Chủ đề New coffee shop' },
  { part: 'Part 2/3', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Busy coffee morning shift', note: 'Chủ đề Busy coffee' },
  { part: 'Part 2/3', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Đề 31 - Eating at restaurant + End of term project', note: 'Chủ đề End of term project' },
  { part: 'Part 2/3', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Đề 35 - Making films + A famous singer', note: 'Chủ đề Film + Singer' },
  { part: 'Part 2/3', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Đề 36 - Making films + My visit to a new coffee shop', note: 'Chủ đề Film + Coffee' },
  { part: 'Part 2/3', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Film club 2 — Full Writing · 4 Parts', skill: 'WRITING', note: 'Đề Writing Film club' },

  // ─────────────────────────────────────────────────────────────
  // PART 2 & 3: 4 CỎ ()
  // ─────────────────────────────────────────────────────────────
  { part: 'Part 2/3', expectedLevel: 4, expectedTag: '★★★★ Tần suất thi cao', testTitle: 'The first American woman in Space', note: 'Woman in Space' },
  { part: 'Part 2/3', expectedLevel: 4, expectedTag: '★★★★ Tần suất thi cao', testTitle: 'Weekend activities (Reading Part 2)', note: 'Weekend activities' },
  { part: 'Part 2/3', expectedLevel: 4, expectedTag: '★★★★ Tần suất thi cao', testTitle: 'Movies then and now', note: 'Movies then and now (tách rời khỏi Film 5 sao)' },
  { part: 'Part 2/3', expectedLevel: 4, expectedTag: '★★★★ Tần suất thi cao', testTitle: 'The first american woman in space', note: 'Viết thường' },
  { part: 'Part 2/3', expectedLevel: 4, expectedTag: '★★★★ Tần suất thi cao', testTitle: 'The history of transportation (phiên bản 2)', note: 'Transportation' },
  { part: 'Part 2/3', expectedLevel: 4, expectedTag: '★★★★ Tần suất thi cao', testTitle: 'Đề 14 - The history of transportation', note: 'Transportation' },

  // ─────────────────────────────────────────────────────────────
  // PART 2 & 3: 3 CỎ ()
  // ─────────────────────────────────────────────────────────────
  { part: 'Part 2/3', expectedLevel: 3, expectedTag: '★★★ Trọng tâm ôn tập', testTitle: 'Family Sport Day (phiên bản 1)', note: 'Family sport' },
  { part: 'Part 2/3', expectedLevel: 3, expectedTag: '★★★ Trọng tâm ôn tập', testTitle: 'Family sports day (phiên bản 2)', note: 'Family sports' },
  { part: 'Part 2/3', expectedLevel: 3, expectedTag: '★★★ Trọng tâm ôn tập', testTitle: 'Mae - The Math Girl', note: 'Mae Math Girl' },
  { part: 'Part 2/3', expectedLevel: 3, expectedTag: '★★★ Trọng tâm ôn tập', testTitle: 'Đề 11 - Cultural festival', note: 'Cultural festival' },
  { part: 'Part 2/3', expectedLevel: 3, expectedTag: '★★★ Trọng tâm ôn tập', testTitle: 'College Welcoming Day', note: 'College Welcoming' },

  // ─────────────────────────────────────────────────────────────
  // PART 2 & 3: 2 CỎ ()
  // ─────────────────────────────────────────────────────────────
  { part: 'Part 2/3', expectedLevel: 2, expectedTag: '★★ Luyện tập mở rộng', testTitle: 'Public Transportations in big cities', note: 'Public Transportations' },
  { part: 'Part 2/3', expectedLevel: 2, expectedTag: '★★ Luyện tập mở rộng', testTitle: 'Writing about a place (phiên bản 2)', note: 'Writing about a place' },
  { part: 'Part 2/3', expectedLevel: 2, expectedTag: '★★ Luyện tập mở rộng', testTitle: 'Đề 08 - Writing about a place', note: 'Writing about a place' },
  { part: 'Part 2/3', expectedLevel: 2, expectedTag: '★★ Luyện tập mở rộng', testTitle: 'Music show at the park', note: 'Music show at the park' },

  // ─────────────────────────────────────────────────────────────
  // PART 4: 5 CỎ ()
  // ─────────────────────────────────────────────────────────────
  { part: 'Part 4', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Đề thi Part 3: Childhood', note: 'Childhood đơn lẻ' },
  { part: 'Part 4', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Music festival - Version 3', note: 'Music festival V3' },
  { part: 'Part 4', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Đề 07 - Games from childhood (2026)', note: 'Games from childhood' },
  { part: 'Part 4', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Music festival - Version 1', note: 'Music festival V1' },
  { part: 'Part 4', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Đề 10 - Technology in childhood (2026)', note: 'Tech in childhood' },
  { part: 'Part 4', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Technology in childhood - Phiên bản 2', note: 'Tech in childhood V2' },
  { part: 'Part 4', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Music festival - Version 2', note: 'Music festival V2' },
  { part: 'Part 4', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Music festival - Version 4', note: 'Music festival V4' },
  { part: 'Part 4', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Mountain (Phiên bản 1)', note: 'Mountain V1' },
  { part: 'Part 4', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'The arrival of four-day week (Phiên bản 2)', note: 'Four-day week V2' },
  { part: 'Part 4', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Mountain ( Phiên bản 2)', note: 'Mountain V2 (khoảng trắng thừa)' },
  { part: 'Part 4', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'The arrival of four-day week ( Phiên bản 1)', note: 'Four-day week V1' },
  { part: 'Part 4', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Women mathematicians (Phiên bản 1)', note: 'Women mathematicians V1' },
  { part: 'Part 4', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Women mathematicians (phiên bản 2)', note: 'Women mathematicians V2' },
  { part: 'Part 4', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Woman Mathematics (TP1)', note: 'Woman Mathematics' },
  { part: 'Part 4', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Mountain Summits ( phiên bản 3)', note: 'Mountain Summits V3' },
  { part: 'Part 4', expectedLevel: 5, expectedTag: '★★★★★ Đề tủ cực hot', testTitle: 'Mountain (phiên bản 4)', note: 'Mountain V4' },

  // ─────────────────────────────────────────────────────────────
  // PART 4: 4 CỎ ()
  // ─────────────────────────────────────────────────────────────
  { part: 'Part 4', expectedLevel: 4, expectedTag: '★★★★ Tần suất thi cao', testTitle: 'Extreme sports ( Phiên bản 3)', note: 'Extreme sports V3' },
  { part: 'Part 4', expectedLevel: 4, expectedTag: '★★★★ Tần suất thi cao', testTitle: 'Extreme sports', note: 'Extreme sports' },
  { part: 'Part 4', expectedLevel: 4, expectedTag: '★★★★ Tần suất thi cao', testTitle: 'Extreme sports (phiên bản 2)', note: 'Extreme sports V2' },

  // ─────────────────────────────────────────────────────────────
  // PART 4: 3 CỎ ()
  // ─────────────────────────────────────────────────────────────
  { part: 'Part 4', expectedLevel: 3, expectedTag: '★★★ Trọng tâm ôn tập', testTitle: 'Childhood memories from secondary school', note: 'Childhood memories (không bị nuốt bởi childhood 5 Cỏ)' },
  { part: 'Part 4', expectedLevel: 3, expectedTag: '★★★ Trọng tâm ôn tập', testTitle: 'Đề 22 - Free time activity (2026)', note: 'Free time activity' },
  { part: 'Part 4', expectedLevel: 3, expectedTag: '★★★ Trọng tâm ôn tập', testTitle: 'Đề 21 - Job and training', note: 'Job and training' },
  { part: 'Part 4', expectedLevel: 3, expectedTag: '★★★ Trọng tâm ôn tập', testTitle: 'Đề 14 - Volunteering to clean a local park', note: 'Volunteering' },
  { part: 'Part 4', expectedLevel: 3, expectedTag: '★★★ Trọng tâm ôn tập', testTitle: 'Đề 08 - Career changes', note: 'Career' },

  // ─────────────────────────────────────────────────────────────
  // ĐỀ KHÔNG LIÊN QUAN: 0 CỎ
  // ─────────────────────────────────────────────────────────────
  { part: 'General', expectedLevel: 0, expectedTag: '', testTitle: 'Đề Thi Thử Aptis ESOL Full Test 01', note: 'Đề thường không thuộc topic tủ' },
  { part: 'General', expectedLevel: 0, expectedTag: '', testTitle: 'Reading Part 1 - Daily Conversations', note: 'Đề thường Part 1' },
];

function runDiagnostic() {
  console.log('========================================================================================');
  console.log('[START] BẮT ĐẦU CHẠY UNIT TEST KIỂM THỬ TỪNG CHỦ ĐỀ & ĐỀ THI (TOPIC RULES TEST RUNNER)');
  console.log('========================================================================================\n');

  let passed = 0;
  let failed = 0;

  console.log(
    'STT'.padEnd(5) +
    'Phần'.padEnd(10) +
    'Đề Test'.padEnd(48) +
    'Kỳ vọng'.padEnd(12) +
    'Thực tế'.padEnd(12) +
    'Kết quả'.padEnd(8) +
    'Ghi chú'
  );
  console.log('-'.repeat(125));

  const sortedRules = [...INITIAL_TOPIC_RULES]
    .filter((r) => r.isActive)
    .sort((a, b) => b.hotLevel - a.hotLevel);

  testCases.forEach((tc, idx) => {
    const norm = normalizeText(tc.testTitle);
    let actualLevel = 0;
    let actualTag = '';

    for (const rule of sortedRules) {
      if (rule.applicableSkill && rule.applicableSkill !== 'ALL' && tc.skill && tc.skill !== rule.applicableSkill) {
        continue;
      }
      if (rule.excludeKeywords && rule.excludeKeywords.some((ex) => norm.includes(normalizeText(ex)))) {
        continue;
      }
      const kws = rule.keywords.map(normalizeText);
      if (kws.some((kw) => kw && norm.includes(kw))) {
        actualLevel = rule.hotLevel;
        actualTag = rule.forecastTag;
        break;
      }
    }

    const isMatch = actualLevel === tc.expectedLevel;
    if (isMatch) passed++;
    else failed++;

    const statusStr = isMatch ? '[PASS] PASS' : '[FAIL] FAIL';
    const expStr = `${tc.expectedLevel} `;
    const actStr = `${actualLevel} `;

    const displayTitle = tc.testTitle.length > 45 ? tc.testTitle.slice(0, 42) + '...' : tc.testTitle;

    console.log(
      `${idx + 1}`.padEnd(5) +
      tc.part.padEnd(10) +
      displayTitle.padEnd(48) +
      expStr.padEnd(12) +
      actStr.padEnd(12) +
      statusStr.padEnd(8) +
      (tc.note || '')
    );
  });

  console.log('\n' + '='.repeat(125));
  console.log(`[STATS] TỔNG KẾT KIỂM THỬ: ${passed}/${testCases.length} TESTS PASS (${((passed / testCases.length) * 100).toFixed(1)}%) | ${failed} FAILED`);
  console.log('='.repeat(125));

  if (failed > 0) {
    process.exit(1);
  }
}

runDiagnostic();

