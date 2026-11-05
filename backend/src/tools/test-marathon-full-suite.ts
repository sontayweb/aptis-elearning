import { prisma } from '../config/database';
import { marathonService } from '../modules/marathon/marathon.service';
import { ExamSkill } from '@prisma/client';

interface TestCaseResult {
  id: string;
  name: string;
  passed: boolean;
  durationMs: number;
  details?: string;
}

const results: TestCaseResult[] = [];

async function runTest(id: string, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ id, name, passed: true, durationMs });
    console.log(`  ✅ [PASS] ${id}: ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ id, name, passed: false, durationMs, details: err.message || String(err) });
    console.error(`  ❌ [FAIL] ${id}: ${name} (${durationMs}ms)`);
    console.error(`     Error:`, err.message || err);
  }
}

async function runFullMarathonTestSuite() {
  console.log('\n============================================================');
  console.log('🧪 BẮT ĐẦU CHẠY TOÀN BỘ BỘ KIỂM THỬ (FULL TESTCASE SUITE)');
  console.log('   TÍNH NĂNG: MARATHON PHÒNG THI & TIẾN TRÌNH DỞ DANG');
  console.log('============================================================\n');

  const user = await prisma.user.findFirst();
  if (!user) {
    throw new Error('Không tìm thấy User thử nghiệm trong CSDL.');
  }
  console.log(`👤 User kiểm thử: ${user.email} (${user.id})\n`);

  // --------------------------------------------------------------------------
  // NHÓM 1: KIỂM THỬ TẢI DỮ LIỆU & CATALOG 3 KỸ NĂNG (TC 01 - 03)
  // --------------------------------------------------------------------------
  console.log('--- NHÓM 1: Tải Danh Mục Metadata & Cửa Sổ Trượt (Two-Phase Data) ---');

  await runTest('TC-01', 'Reading Catalog & Batch Pre-fetch (Part 1 Gap Fill)', async () => {
    const catalog = await marathonService.getCatalog(ExamSkill.READING, 1);
    if (!catalog || catalog.total <= 0) throw new Error('Catalog Reading Part 1 rỗng');
    if (typeof catalog.items[0].index !== 'number') throw new Error('Thiếu trường index');
    if (!catalog.items[0].examId) throw new Error('Thiếu trường examId');

    const batch = await marathonService.getBatch(ExamSkill.READING, 1, [0, 1]);
    if (batch.items.length !== Math.min(2, catalog.total)) throw new Error('Batch không khớp số lượng yêu cầu');
    if (!batch.items[0].questions || batch.items[0].questions.length === 0) throw new Error('Đề thi không có câu hỏi');
  });

  await runTest('TC-02', 'Listening Catalog & Audio Assets (Part 1 Audio)', async () => {
    const catalog = await marathonService.getCatalog(ExamSkill.LISTENING, 1);
    if (!catalog || catalog.total <= 0) throw new Error('Catalog Listening Part 1 rỗng');

    const batch = await marathonService.getBatch(ExamSkill.LISTENING, 1, [0]);
    if (batch.items.length === 0) throw new Error('Không tải được batch Listening');
    // Kiểm tra cấu trúc audio
    const item = batch.items[0];
    if (item.questions.length === 0) throw new Error('Listening đề 0 thiếu questions');
  });

  await runTest('TC-03', 'Grammar & Vocabulary Separation (Part 1 Grammar vs Part 2 Vocab)', async () => {
    const grammarCat = await marathonService.getCatalog(ExamSkill.GRAMMAR_VOCABULARY, 1);
    const vocabCat = await marathonService.getCatalog(ExamSkill.GRAMMAR_VOCABULARY, 2);
    if (grammarCat.total <= 0) throw new Error('Grammar Part 1 catalog rỗng');
    // Part 1 và Part 2 phải có metadata độc lập
    if (grammarCat.partNumber !== 1) throw new Error('Part number Grammar không bằng 1');
    if (vocabCat.partNumber !== 2) throw new Error('Part number Vocab không bằng 2');
  });

  // --------------------------------------------------------------------------
  // NHÓM 2: CHẤM ĐIỂM DẠNG ĐẶC THÙ (TC 04 - 05)
  // --------------------------------------------------------------------------
  console.log('\n--- NHÓM 2: Logic Chấm Điểm & Kéo Thả Sắp Xếp Câu ---');

  await runTest('TC-04', 'Reading Part 2 Text Cohesion - Chấm trật tự câu hoàn hảo (100%)', async () => {
    const batch = await marathonService.getBatch(ExamSkill.READING, 2, [0]);
    if (batch.items.length === 0) {
      console.log('     (Bỏ qua TC-04 vì chưa có đề Part 2 trong DB)');
      return;
    }
    const item = batch.items[0];
    const perfectOrders: Record<string, string[]> = {};
    item.questions.forEach((q) => {
      let expected: string[] = [];
      try {
        expected = typeof q.correctAnswer === 'string' ? JSON.parse(q.correctAnswer) : q.correctAnswer || [];
      } catch {}
      perfectOrders[q.id] = expected;
    });

    const res = await marathonService.completeExam(user.id, ExamSkill.READING, 2, {
      examId: item.examId,
      examIndex: 0,
      answers: {},
      orders: perfectOrders,
      timeSpentSeconds: 30,
    });

    if (res.accuracyRate !== 100) throw new Error(`Mong đợi 100%, thực tế: ${res.accuracyRate}%`);
    if (res.earnedScore <= 0) throw new Error('Điểm số phải lớn hơn 0');
  });

  await runTest('TC-05', 'Reading Part 2 Text Cohesion - Chấm trật tự câu xáo trộn sai (0%)', async () => {
    const batch = await marathonService.getBatch(ExamSkill.READING, 2, [0]);
    if (batch.items.length === 0) return;
    const item = batch.items[0];
    const wrongOrders: Record<string, string[]> = {};
    item.questions.forEach((q) => {
      let expected: string[] = [];
      try {
        expected = typeof q.correctAnswer === 'string' ? JSON.parse(q.correctAnswer) : q.correctAnswer || [];
      } catch {}
      wrongOrders[q.id] = [...expected].reverse();
    });

    const res = await marathonService.completeExam(user.id, ExamSkill.READING, 2, {
      examId: item.examId,
      examIndex: 0,
      answers: {},
      orders: wrongOrders,
      timeSpentSeconds: 30,
    });

    if (res.accuracyRate === 100) {
      throw new Error('Trật tự đảo ngược không được tính là 100%');
    }
  });

  // --------------------------------------------------------------------------
  // NHÓM 3: NGUYÊN TẮC BEST-SCORE KHI LÀM LẠI ĐỀ CŨ (TC 06)
  // --------------------------------------------------------------------------
  console.log('\n--- NHÓM 3: Nguyên Tắc Giữ Điểm Cao Nhất (Best Score Principle) ---');

  await runTest('TC-06', 'Best Score Retain - Lần 1 điểm thấp, Lần 2 điểm cao, Lần 3 điểm thấp hơn', async () => {
    const batch = await marathonService.getBatch(ExamSkill.READING, 1, [0]);
    const item = batch.items[0];
    if (!item) throw new Error('Không có đề Reading 1');

    // Reset clean baseline
    await marathonService.resetProgress(user.id, ExamSkill.READING, 1, 'ALL');

    // Lần 1: Sai toàn bộ (0 điểm)
    const res1 = await marathonService.completeExam(user.id, ExamSkill.READING, 1, {
      examId: item.examId,
      examIndex: 0,
      answers: { [item.questions[0]?.id]: 'WRONG_ANSWER' },
      timeSpentSeconds: 20,
    });
    if (res1.bestScore !== res1.earnedScore) throw new Error('Lần 1 bestScore phải bằng earnedScore');

    // Lần 2: Đúng toàn bộ (Max điểm)
    const perfectAnswers: Record<string, string> = {};
    item.questions.forEach((q) => {
      perfectAnswers[q.id] = q.correctAnswer || '';
    });
    const res2 = await marathonService.completeExam(user.id, ExamSkill.READING, 1, {
      examId: item.examId,
      examIndex: 0,
      answers: perfectAnswers,
      timeSpentSeconds: 25,
    });
    if (res2.earnedScore !== res2.maxScore) throw new Error('Lần 2 phải đạt max score');
    if (res2.bestScore !== res2.maxScore) throw new Error('Lần 2 bestScore phải được nâng lên maxScore');

    // Lần 3: Làm lại bị sai 1 câu (Điểm thấp hơn Lần 2)
    const partialAnswers = { ...perfectAnswers };
    const firstQ = item.questions[0];
    if (firstQ) partialAnswers[firstQ.id] = 'INCORRECT_VAL';

    const res3 = await marathonService.completeExam(user.id, ExamSkill.READING, 1, {
      examId: item.examId,
      examIndex: 0,
      answers: partialAnswers,
      timeSpentSeconds: 20,
    });

    if (res3.earnedScore >= res2.earnedScore) throw new Error('Lần 3 điểm phải thấp hơn');
    if (res3.bestScore !== res2.maxScore) {
      throw new Error(`Best score bị ghi đè sai! Mong đợi: ${res2.maxScore}, Thực tế: ${res3.bestScore}`);
    }
  });

  // --------------------------------------------------------------------------
  // NHÓM 4: AUTOSAVE & PHỤC HỒI TIẾN TRÌNH DỞ DANG (TC 07 - 08)
  // --------------------------------------------------------------------------
  console.log('\n--- NHÓM 4: Autosave, Phục Hồi & Tích Lũy Thời Gian ---');

  await runTest('TC-07', 'Autosave Heartbeat - Lưu câu trả lời dở dang & Bộ đếm thời gian', async () => {
    const draftAnswers = {
      q_test_1: 'B',
      q_test_2: 'C',
    };

    await marathonService.autosaveProgress(user.id, ExamSkill.READING, 1, {
      currentExamIndex: 5,
      currentExamId: 'exam_mock_5',
      currentDraftAnswers: draftAnswers,
      additionalTimeSeconds: 45,
    });

    const prog = await marathonService.getProgress(user.id, ExamSkill.READING, 1);
    if (!prog.hasProgress || !prog.progress) throw new Error('Không lấy được tiến trình vừa lưu');
    if (prog.progress.currentExamIndex !== 5) throw new Error('currentExamIndex không khớp');
    const draft = prog.progress.currentDraftAnswers as Record<string, any>;
    if (draft?.['q_test_1'] !== 'B') throw new Error('Draft answers không khớp');
    if (prog.progress.totalTimeSeconds < 45) throw new Error('Thời gian tích lũy không tăng');
  });

  await runTest('TC-08', 'Clear Draft on Exam Completion - Xóa nháp khi nộp đề và tăng currentIndex', async () => {
    const batch = await marathonService.getBatch(ExamSkill.READING, 1, [5]);
    const item = batch.items[0];
    if (item) {
      await marathonService.completeExam(user.id, ExamSkill.READING, 1, {
        examId: item.examId,
        examIndex: 5,
        answers: { [item.questions[0]?.id]: item.questions[0]?.correctAnswer || '' },
        timeSpentSeconds: 30,
      });

      const prog = await marathonService.getProgress(user.id, ExamSkill.READING, 1);
      if (!prog.progress) throw new Error('Thiếu progress');
      if (prog.progress.currentExamIndex !== 6) throw new Error('Chưa tăng currentIndex lên 6');
      if (Object.keys((prog.progress.currentDraftAnswers as any) || {}).length > 0) {
        throw new Error('Bản nháp chưa được làm rỗng sau khi hoàn thành');
      }
    }
  });

  // --------------------------------------------------------------------------
  // NHÓM 5: CÁC CẤP ĐỘ RESET TIẾN TRÌNH (TC 09 - 10)
  // --------------------------------------------------------------------------
  console.log('\n--- NHÓM 5: Cấp Độ Đặt Lại Tiến Trình (Reset Hierarchy) ---');

  await runTest('TC-09', 'Scope Reset EXAM - Chỉ xóa kết quả của 1 đề chỉ định', async () => {
    const batch = await marathonService.getBatch(ExamSkill.READING, 1, [0, 1]);
    if (batch.items.length >= 2) {
      const id0 = batch.items[0].examId;
      const id1 = batch.items[1].examId;

      // Nộp cả 2 đề
      await marathonService.completeExam(user.id, ExamSkill.READING, 1, {
        examId: id0,
        examIndex: 0,
        answers: {},
        timeSpentSeconds: 10,
      });
      await marathonService.completeExam(user.id, ExamSkill.READING, 1, {
        examId: id1,
        examIndex: 1,
        answers: {},
        timeSpentSeconds: 10,
      });

      // Chỉ xóa đề 0
      await marathonService.resetProgress(user.id, ExamSkill.READING, 1, 'EXAM', id0);

      const prog = await marathonService.getProgress(user.id, ExamSkill.READING, 1);
      const data = prog.progress?.completedData as Record<string, any>;
      if (data[id0]) throw new Error('Đề 0 chưa bị xóa');
      if (!data[id1]) throw new Error('Đề 1 không được phép bị xóa khi chỉ reset đề 0');
    }
  });

  await runTest('TC-10', 'Scope Reset ALL - Xóa sạch toàn bộ tiến trình Part về Đề 1', async () => {
    await marathonService.resetProgress(user.id, ExamSkill.READING, 1, 'ALL');
    const prog = await marathonService.getProgress(user.id, ExamSkill.READING, 1);
    if (!prog.progress) throw new Error('Thiếu progress');
    if (prog.progress.currentExamIndex !== 0) throw new Error('Index chưa về 0');
    if (prog.progress.completedExamsCount !== 0) throw new Error('Count chưa về 0');
    if (Object.keys((prog.progress.completedData as any) || {}).length !== 0) throw new Error('completedData chưa rỗng');
  });

  // --------------------------------------------------------------------------
  // NHÓM 6: TRƯỜNG HỢP BIÊN & NGOẠI LỆ (EDGE CASES) (TC 11 - 13)
  // --------------------------------------------------------------------------
  console.log('\n--- NHÓM 6: Kiểm Thử Trường Hợp Biên & Ngoại Lệ (Edge Cases) ---');

  await runTest('TC-11', 'Edge Case: Chỉ số âm & Vượt ngưỡng trong Windowed Batch Fetching', async () => {
    // Yêu cầu [-2, -1, 0, 999999]
    const batch = await marathonService.getBatch(ExamSkill.READING, 1, [-2, -1, 0, 999999]);
    // Phải lọc an toàn và chỉ trả về index 0
    if (batch.items.length !== 1 || batch.items[0].index !== 0) {
      throw new Error(`Xử lý index biên không đúng. Số lượng trả về: ${batch.items.length}`);
    }
  });

  await runTest('TC-12', 'Edge Case: Nộp bài trống hoàn toàn (Empty Answers Submission)', async () => {
    const batch = await marathonService.getBatch(ExamSkill.READING, 1, [0]);
    const item = batch.items[0];
    const res = await marathonService.completeExam(user.id, ExamSkill.READING, 1, {
      examId: item.examId,
      examIndex: 0,
      answers: {},
      timeSpentSeconds: 5,
    });
    if (res.earnedScore !== 0) throw new Error('Nộp trống phải được 0 điểm');
    if (res.accuracyRate !== 0) throw new Error('Tỷ lệ phải là 0%');
  });

  await runTest('TC-13', 'Edge Case: Query Part không tồn tại (e.g. Part 99)', async () => {
    const catalog = await marathonService.getCatalog(ExamSkill.READING, 99);
    if (catalog.total !== 0 || catalog.items.length !== 0) {
      throw new Error('Part 99 phải trả về mảng rỗng an toàn');
    }
  });

  // --------------------------------------------------------------------------
  // BÁO CÁO TỔNG HỢP
  // --------------------------------------------------------------------------
  console.log('\n============================================================');
  console.log('📊 BÁO CÁO TỔNG HỢP KẾT QUẢ KIỂM THỬ:');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`   - Tổng số testcases: ${total}`);
  console.log(`   - Số testcases PASS : ${passed} (${Math.round((passed / total) * 100)}%)`);
  console.log(`   - Số testcases FAIL : ${failed}`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFullMarathonTestSuite().catch((err) => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
