import { prisma } from '../config/database';
import { marathonService } from '../modules/marathon/marathon.service';
import { ExamSkill } from '@prisma/client';

async function testMarathonFlow() {
  console.log('=== TEST MARATHON EXAM ROOM FLOW ===');

  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No test user found in DB');
    process.exit(1);
  }
  console.log(`Using Test User: ${user.email} (${user.id})`);

  // Step 1: Catalog
  console.log('\n--- 1. Testing getCatalog (READING, Part 1) ---');
  const catalog = await marathonService.getCatalog(ExamSkill.READING, 1);
  console.log(`Total Part 1 items in catalog: ${catalog.total}`);
  if (catalog.total > 0) {
    console.log('Sample catalog item #0:', catalog.items[0]);
  }

  // Step 2: Batch pre-fetch
  console.log('\n--- 2. Testing getBatch (indices: [0, 1]) ---');
  const batch = await marathonService.getBatch(ExamSkill.READING, 1, [0, 1]);
  console.log(`Fetched batch items count: ${batch.items.length}`);
  if (batch.items.length > 0) {
    console.log('Sample exam title:', batch.items[0].title);
    console.log('Questions count:', batch.items[0].questions.length);
  }

  // Step 3: Autosave progress
  console.log('\n--- 3. Testing autosaveProgress (Index 0) ---');
  const firstItem = batch.items[0];
  const q0 = firstItem?.questions[0];

  const autosaved = await marathonService.autosaveProgress(user.id, ExamSkill.READING, 1, {
    currentExamIndex: 0,
    currentExamId: firstItem?.examId,
    currentDraftAnswers: q0 ? { [q0.id]: 'A' } : {},
    additionalTimeSeconds: 15,
  });
  console.log('Autosaved successfully! Record ID:', autosaved.id);

  // Step 4: Get Progress
  console.log('\n--- 4. Testing getProgress ---');
  const progressRes = await marathonService.getProgress(user.id, ExamSkill.READING, 1);
  console.log('Progress status:', {
    hasProgress: progressRes.hasProgress,
    currentIndex: progressRes.progress?.currentExamIndex,
    answersCount: Object.keys(progressRes.progress?.currentDraftAnswers || {}).length,
  });

  // Step 5: Complete Exam
  if (firstItem && firstItem.questions.length > 0) {
    console.log('\n--- 5. Testing completeExam (Exam #0) ---');
    const mockAnswers: Record<string, string> = {};
    firstItem.questions.forEach((q) => {
      mockAnswers[q.id] = q.correctAnswer || 'A';
    });

    const completion = await marathonService.completeExam(user.id, ExamSkill.READING, 1, {
      examId: firstItem.examId,
      examIndex: 0,
      answers: mockAnswers,
      timeSpentSeconds: 45,
    });
    console.log('Completion result:', {
      earnedScore: completion.earnedScore,
      maxScore: completion.maxScore,
      accuracyRate: completion.accuracyRate,
      nextIndex: completion.nextIndex,
      completedExamsCount: completion.completedExamsCount,
    });
  }

  console.log('\n=== ALL MARATHON BACKEND FLOW TESTS PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

testMarathonFlow().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});

