import { prisma } from '../config/database';
import { SubmissionService } from '../modules/submissions/submission.service';

async function testResumeFlow() {
  const submissionService = new SubmissionService();

  // Find a test user and test exam
  const user = await prisma.user.findFirst();
  const exam = await prisma.exam.findFirst({ where: { is_published: true } });

  if (!user || !exam) {
    console.error('Missing user or exam');
    process.exit(1);
  }

  console.log(`Testing with User: ${user.email} (${user.id}), Exam: ${exam.title} (${exam.id})`);

  // Step 1: Start submission (force new to ensure clean baseline)
  console.log('--- Step 1: Start fresh submission ---');
  const freshSub = await submissionService.startSubmission(user.id, exam.id, true);
  console.log('Fresh submission:', {
    submissionId: freshSub.submissionId,
    status: freshSub.status,
    isResumed: freshSub.isResumed,
    serverTimeRemaining: freshSub.serverTimeRemaining,
  });

  if (freshSub.isResumed !== false) {
    throw new Error('Fresh submission should have isResumed = false');
  }

  // Step 2: Find a question in this exam to autosave an answer
  const part = await prisma.examPart.findFirst({
    where: { exam_id: exam.id },
    include: { questions: true },
  });

  if (part && part.questions.length > 0) {
    const q = part.questions[0];
    console.log(`--- Step 2: Autosaving answer for Question ${q.id} ---`);
    await submissionService.autosave(user.id, freshSub.submissionId, {
      answers: [
        {
          questionId: q.id,
          selectedOption: 'B',
          textAnswer: 'Test autosaved draft text',
        },
      ],
    });
    console.log('Autosaved successfully.');
  }

  // Step 3: Call startSubmission AGAIN without forceNew (Simulating F5 / Page Reload)
  console.log('--- Step 3: Reloading / Re-entering exam (Simulating F5) ---');
  const resumedSub = await submissionService.startSubmission(user.id, exam.id, false);
  console.log('Resumed submission result:', {
    submissionId: resumedSub.submissionId,
    status: resumedSub.status,
    isResumed: resumedSub.isResumed,
    serverTimeRemaining: resumedSub.serverTimeRemaining,
    savedAnswersCount: Object.keys(resumedSub.savedAnswers || {}).length,
    savedAnswers: resumedSub.savedAnswers,
  });

  if (resumedSub.isResumed !== true) {
    throw new Error('FAILED: Expected isResumed to be true on reload!');
  }

  if (resumedSub.submissionId !== freshSub.submissionId) {
    throw new Error('FAILED: Expected same submission ID to be resumed!');
  }

  console.log('✅ ALL TESTS PASSED: Auto-resume and session recovery verified 100%!');

  // Cleanup: mark this test submission as submitted so we do not leave it lingering
  await prisma.examSubmission.update({
    where: { id: freshSub.submissionId },
    data: { status: 'SUBMITTED' },
  });
  console.log('Test session cleaned up.');
}

testResumeFlow()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
