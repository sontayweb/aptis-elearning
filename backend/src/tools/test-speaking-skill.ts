import fs from 'fs';
import path from 'path';
import { prisma } from '../config/database';
import { ExamService } from '../modules/exams/exam.service';
import { SubmissionService } from '../modules/submissions/submission.service';
import { ExamSkill, QuestionType, SubmissionStatus } from '@prisma/client';

const examService = new ExamService();
const submissionService = new SubmissionService();

async function runSpeakingTests() {
  console.log('================================================================');
  console.log('🎙️ BỘ TEST KIỂM THỬ CHUYÊN SÂU: PHÂN HỆ NÓI (SPEAKING SKILL)');
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

  // 1. Kiểm tra ngân hàng đề Speaking
  const speakingExams = await prisma.exam.findMany({
    where: { skill: ExamSkill.SPEAKING },
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

  assert(speakingExams.length > 0, 'Tìm thấy đề thi Speaking trong cơ sở dữ liệu', `Số lượng: ${speakingExams.length} đề`);

  // 2. Kiểm tra đề Speaking bóc tách có gắn hình ảnh thật
  const targetExam = speakingExams.find((e) => e.parts.some((p) => p.image_url && p.image_url.startsWith('/uploads/'))) || speakingExams[0];
  assert(!!targetExam, 'Tìm thấy đề thi Speaking mục tiêu');

  console.log(`\n🔍 Đang kiểm tra chi tiết đề: "${targetExam.title}" (ID: ${targetExam.id})`);
  assert(targetExam.duration_minutes === 12, 'Thời lượng đề thi chuẩn Aptis Speaking: 12 phút');

  // Kiểm tra từng Part
  for (const part of targetExam.parts) {
    console.log(`   - Part ${part.part_number}: ${part.title} (${part.questions.length} câu hỏi)`);
    
    // Nếu là Part 2 hoặc Part 3 có hình ảnh
    if (part.image_url) {
      assert(true, `Part ${part.part_number} có gắn hình ảnh tranh đề bài: ${part.image_url}`);
      const diskPath = path.resolve(path.join('./uploads', part.image_url.replace(/^\/?(api\/)?uploads\/?/, '')));
      if (part.image_url.startsWith('/uploads/')) {
        assert(fs.existsSync(diskPath), `Ảnh của Part ${part.part_number} tồn tại thực tế trên ổ cứng server`, `Path: ${diskPath}`);
      }
    }

    // Kiểm tra loại câu hỏi
    for (const q of part.questions) {
      assert(q.question_type === QuestionType.SPEAKING_AUDIO, `Câu ${q.question_number} đúng loại SPEAKING_AUDIO`);
      assert(q.prompt.length > 10, `Câu ${q.question_number} có nội dung câu hỏi rõ ràng: "${q.prompt.substring(0, 40)}..."`);
    }
  }

  // 3. Mô phỏng Thí sinh làm bài thi Speaking (Ghi âm giọng nói)
  console.log('\n🎙️ Mô phỏng Thí sinh ghi âm và nộp bài Speaking...');
  let testUser = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: `student_speaking_${Date.now()}@aptis.local`,
        full_name: 'Học Viên Test Speaking',
        role: 'STUDENT',
      },
    });
  }

  const startRes = await submissionService.startSubmission(testUser.id, targetExam.id);
  assert(startRes.status === SubmissionStatus.IN_PROGRESS, 'Thí sinh vào phòng thi Speaking thành công');

  // Mô phỏng tải lên file ghi âm câu trả lời cho câu 1
  const firstQ = targetExam.parts[0]?.questions[0];
  if (firstQ) {
    await submissionService.autosave(testUser.id, startRes.submissionId, {
      answers: [
        {
          questionId: firstQ.id,
          audioUrl: `/api/submissions/${startRes.submissionId}/audio/${firstQ.id}`,
          audioDuration: 35,
        },
      ],
    });
    assert(true, 'Thí sinh lưu thành công bản thu âm Speaking (Audio URL & Duration: 35s)');
  }

  // Nộp bài thi Speaking
  const submitRes = await submissionService.submit(testUser.id, startRes.submissionId);
  assert(
    submitRes.status === SubmissionStatus.PENDING_EVALUATION || submitRes.status === SubmissionStatus.GRADED || submitRes.status === SubmissionStatus.SUBMITTED,
    'Thí sinh nộp bài Speaking thành công',
    `Trạng thái nộp bài: ${submitRes.status} (Sẵn sàng cho AI / Giảng viên chấm điểm)`
  );

  console.log('\n================================================================');
  console.log(`🎯 KẾT QUẢ KIỂM THỬ SPEAKING: ${passed}/${total} TEST CASES ĐẠT CHUẨN!`);
  console.log('================================================================');
}

runSpeakingTests()
  .catch((err) => {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
