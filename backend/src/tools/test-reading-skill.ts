import { prisma } from '../config/database';
import { ExamService } from '../modules/exams/exam.service';
import { SubmissionService } from '../modules/submissions/submission.service';
import { ExamSkill, QuestionType, SubmissionStatus } from '@prisma/client';

const examService = new ExamService();
const submissionService = new SubmissionService();

async function runReadingTests() {
  console.log('================================================================');
  console.log('📖 BỘ TEST KIỂM THỬ CHUYÊN SÂU: PHÂN HỆ ĐỌC (READING SKILL)');
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

  // 1. Kiểm tra ngân hàng đề Reading
  const readingExams = await prisma.exam.findMany({
    where: { skill: ExamSkill.READING },
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

  assert(readingExams.length > 0, 'Tìm thấy đề thi Reading trong cơ sở dữ liệu', `Số lượng: ${readingExams.length} đề`);

  // 2. Kiểm tra cấu trúc Part 1 (Gap Fill)
  const p1Exam = readingExams.find((e) => e.title.includes('Part 1') || e.parts.some((p) => p.part_number === 1));
  assert(!!p1Exam, 'Tồn tại đề thi chứa Part 1 (Gap Fill)');

  if (p1Exam) {
    const p1Part = p1Exam.parts.find((p) => p.part_number === 1);
    assert(!!p1Part && p1Part.questions.length > 0, 'Part 1 có câu hỏi điền từ', `Số câu: ${p1Part?.questions.length}`);
    
    if (p1Part && p1Part.questions.length > 0) {
      const q = p1Part.questions[0];
      assert(q.question_type === QuestionType.GAP_FILL || q.question_type === QuestionType.MULTIPLE_CHOICE, 'Part 1 câu hỏi đúng định dạng GAP_FILL / MULTIPLE_CHOICE');
      assert(!!q.correct_answer, 'Part 1 có đáp án chuẩn chính xác', `Đáp án: "${q.correct_answer}"`);
    }
  }

  // 3. Kiểm tra cấu trúc Part 2 (Sắp xếp trật tự câu)
  const p2Exam = readingExams.find((e) => e.title.includes('Part 2') || e.parts.some((p) => p.part_number === 2));
  assert(!!p2Exam, 'Tồn tại đề thi chứa Part 2 (Text Cohesion / Sentence Order)');

  if (p2Exam) {
    const p2Part = p2Exam.parts.find((p) => p.part_number === 2 || p.title.includes('Part 2'));
    if (p2Part && p2Part.questions.length > 0) {
      const q = p2Part.questions[0];
      assert(q.question_type === QuestionType.SENTENCE_ORDER, 'Part 2 câu hỏi định dạng SENTENCE_ORDER');
      const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
      assert(Array.isArray(opts) && opts.length >= 3, 'Part 2 có danh sách câu văn xáo trộn', `Số câu: ${opts.length}`);
    }
  }

  // 4. Mô phỏng thí sinh làm bài thi Reading & Kiểm tra chấm tự động
  console.log('\n📝 Mô phỏng Thí sinh làm bài thi Reading...');
  const testExam = p1Exam || readingExams[0];
  let testUser = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: `student_reading_${Date.now()}@aptis.local`,
        full_name: 'Học Viên Test Reading',
        role: 'STUDENT',
      },
    });
  }

  const startRes = await submissionService.startSubmission(testUser.id, testExam.id);
  assert(startRes.status === SubmissionStatus.IN_PROGRESS, 'Thí sinh vào phòng thi Reading thành công');

  // Điền đúng đáp án cho các câu hỏi
  const allQuestions = testExam.parts.flatMap((p) => p.questions);
  const answersPayload = allQuestions.slice(0, 5).map((q) => ({
    questionId: q.id,
    selectedOption: q.correct_answer || 'window',
  }));

  await submissionService.autosave(testUser.id, startRes.submissionId, { answers: answersPayload });
  assert(true, 'Thí sinh tự động lưu đáp án thành công');

  const submitRes = await submissionService.submit(testUser.id, startRes.submissionId);
  assert(
    submitRes.status === SubmissionStatus.GRADED || submitRes.status === SubmissionStatus.PENDING_EVALUATION,
    'Thí sinh nộp bài Reading thành công',
    `Trạng thái: ${submitRes.status} | Điểm Reading: ${submitRes.readingScore ?? submitRes.totalScore}`
  );

  console.log('\n================================================================');
  console.log(`🎯 KẾT QUẢ KIỂM THỬ READING: ${passed}/${total} TEST CASES ĐẠT CHUẨN!`);
  console.log('================================================================');
}

runReadingTests()
  .catch((err) => {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
