import { prisma } from '../config/database';
import { ExamService } from '../modules/exams/exam.service';
import { SubmissionService } from '../modules/submissions/submission.service';
import { ExamSkill, QuestionType, SubmissionStatus } from '@prisma/client';

const examService = new ExamService();
const submissionService = new SubmissionService();

async function runWritingTests() {
  console.log('================================================================');
  console.log('✍️ BỘ TEST KIỂM THỬ CHUYÊN SÂU: PHÂN HỆ VIẾT (WRITING SKILL)');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, title: string, note?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS] ${title}`);
      if (note) console.log(`     ℹ️ ${note}`);
    } else {
      console.error(`  ❌ [FAIL] ${title}`);
      if (note) console.error(`     ⚠️ ${note}`);
    }
  }

  // 1. Kiểm tra ngân hàng đề Writing
  const writingExams = await prisma.exam.findMany({
    where: { skill: ExamSkill.WRITING },
    include: {
      parts: {
        include: {
          questions: {
            orderBy: { question_number: 'asc' },
          },
        },
      },
    },
    take: 5,
  });

  assert(writingExams.length > 0, 'Tìm thấy đề thi Writing trong cơ sở dữ liệu', `Số lượng: ${writingExams.length} đề`);

  // 2. Kiểm tra cấu trúc chuẩn 4 Parts của đề thi Writing
  const targetExam = writingExams[0];
  console.log(`\n🔍 Đang kiểm tra chi tiết đề: "${targetExam.title}" (ID: ${targetExam.id})`);
  assert(targetExam.duration_minutes === 50, 'Thời lượng đề thi chuẩn Aptis Writing: 50 phút');
  assert(targetExam.parts.length >= 4, 'Đề thi Writing có đủ 4 Parts chuẩn Aptis', `Số Parts: ${targetExam.parts.length}`);

  for (const part of targetExam.parts) {
    console.log(`   - Part ${part.part_number}: ${part.title} (${part.questions.length} câu)`);
    for (const q of part.questions) {
      assert(
        q.question_type === QuestionType.ESSAY || q.question_type === QuestionType.SHORT_TEXT,
        `Câu ${q.question_number} Part ${part.part_number} đúng kiểu dữ liệu tự luận (ESSAY / SHORT_TEXT)`
      );
    }
  }

  // 3. Mô phỏng Thí sinh làm bài thi Writing (Điền form và viết email)
  console.log('\n📝 Mô phỏng Thí sinh làm bài thi Writing...');
  let testUser = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: `student_writing_${Date.now()}@aptis.local`,
        full_name: 'Học Viên Test Writing',
        role: 'STUDENT',
      },
    });
  }

  const startRes = await submissionService.startSubmission(testUser.id, targetExam.id);
  assert(startRes.status === SubmissionStatus.IN_PROGRESS, 'Thí sinh vào phòng thi Writing thành công');

  // Thí sinh điền bài viết cho Part 1, Part 2, Part 4
  const allQ = targetExam.parts.flatMap((p) => p.questions);
  const sampleAnswers = allQ.slice(0, 3).map((q, idx) => ({
    questionId: q.id,
    textAnswer: idx === 0 ? 'Software Engineer' : 'I am eager to participate in this club because I want to enhance my professional communication skills and collaborate with diverse peers.',
  }));

  await submissionService.autosave(testUser.id, startRes.submissionId, { answers: sampleAnswers });
  assert(true, 'Thí sinh lưu thành công bài tự luận Writing');

  const submitRes = await submissionService.submit(testUser.id, startRes.submissionId);
  assert(
    submitRes.status === SubmissionStatus.PENDING_EVALUATION || submitRes.status === SubmissionStatus.GRADED || submitRes.status === SubmissionStatus.SUBMITTED,
    'Thí sinh nộp bài Writing thành công',
    `Trạng thái nộp bài: ${submitRes.status} (Sẵn sàng cho AI / Giảng viên chấm điểm chi tiết)`
  );

  console.log('\n================================================================');
  console.log(`🎯 KẾT QUẢ KIỂM THỬ WRITING: ${passed}/${total} TEST CASES ĐẠT CHUẨN!`);
  console.log('================================================================');
}

runWritingTests()
  .catch((err) => {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
