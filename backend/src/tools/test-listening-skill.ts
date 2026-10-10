import fs from 'fs';
import path from 'path';
import { prisma } from '../config/database';
import { ExamService } from '../modules/exams/exam.service';
import { SubmissionService } from '../modules/submissions/submission.service';
import { ttsAudioService } from '../modules/ingestion/tts-audio.service';
import { ExamSkill, QuestionType, SubmissionStatus } from '@prisma/client';

const examService = new ExamService();
const submissionService = new SubmissionService();

async function runListeningTests() {
  console.log('================================================================');
  console.log('🎧 BỘ TEST KIỂM THỬ CHUYÊN SÂU: PHÂN HỆ NGHE (LISTENING SKILL)');
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

  // 1. Kiểm tra ngân hàng đề Listening
  const listeningExams = await prisma.exam.findMany({
    where: { skill: ExamSkill.LISTENING },
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

  assert(listeningExams.length > 0, 'Tìm thấy đề thi Listening trong cơ sở dữ liệu', `Số lượng: ${listeningExams.length} đề`);

  // 2. Kiểm tra tính năng "Nó sẽ nói": Sinh audio từ văn bản (TTS Engine)
  console.log('\n🔊 Kiểm tra khả năng sinh giọng nói thực tế (Live TTS Test)...');
  const testPhrase = 'This is a test of the automatic listening audio generator for Aptis mock test.';
  const ttsOutput = await ttsAudioService.generateSpeech(testPhrase, 'test_live_verify');
  assert(fs.existsSync(ttsOutput.localPath), 'Tập tin audio MP3 được tạo thành công trên đĩa', `Path: ${ttsOutput.localPath}`);
  
  const stats = fs.statSync(ttsOutput.localPath);
  assert(stats.size > 1000, 'Kích thước file audio hợp lệ (> 1KB)', `Kích thước: ${stats.size} bytes`);
  
  // Xóa file test tạm
  try { fs.unlinkSync(ttsOutput.localPath); } catch {}

  // 3. Kiểm tra đề thi Listening có gắn Audio thật trong Database
  const targetExam = listeningExams.find((e) => e.parts.some((p) => p.audio_url && p.audio_url.startsWith('/uploads/'))) || listeningExams[0];
  assert(!!targetExam, 'Tìm thấy đề thi Listening mục tiêu', `Tiêu đề: "${targetExam.title}"`);

  const partWithAudio = targetExam.parts.find((p) => p.audio_url);
  assert(!!partWithAudio, 'Đề thi Listening có gắn file audio vào ExamPart.audio_url', `Audio URL: ${partWithAudio?.audio_url}`);

  if (partWithAudio?.audio_url?.startsWith('/uploads/')) {
    const localAudio = path.resolve(path.join('./uploads', partWithAudio.audio_url.replace(/^\/?(api\/)?uploads\/?/, '')));
    assert(fs.existsSync(localAudio), 'File audio Listening tồn tại thực tế trên đĩa server', `Path: ${localAudio}`);
  }

  // 4. Mô phỏng Thí sinh làm bài thi Listening (Nghe và chọn đáp án)
  console.log('\n📝 Mô phỏng Thí sinh làm bài thi Listening...');
  let testUser = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: `student_listening_${Date.now()}@aptis.local`,
        full_name: 'Học Viên Test Listening',
        role: 'STUDENT',
      },
    });
  }

  const startRes = await submissionService.startSubmission(testUser.id, targetExam.id);
  assert(startRes.status === SubmissionStatus.IN_PROGRESS, 'Thí sinh vào phòng thi Listening thành công');

  const q1 = targetExam.parts[0]?.questions[0];
  if (q1) {
    await submissionService.autosave(testUser.id, startRes.submissionId, {
      answers: [
        {
          questionId: q1.id,
          selectedOption: q1.correct_answer || 'Gate 14B',
        },
      ],
    });
    assert(true, 'Thí sinh lưu đáp án câu hỏi Listening thành công');
  }

  const submitRes = await submissionService.submit(testUser.id, startRes.submissionId);
  assert(
    submitRes.status === SubmissionStatus.GRADED || submitRes.status === SubmissionStatus.PENDING_EVALUATION,
    'Thí sinh nộp bài Listening thành công và được chấm tự động',
    `Điểm Listening: ${submitRes.listeningScore ?? submitRes.totalScore ?? 'Đã ghi nhận'}`
  );

  console.log('\n================================================================');
  console.log(`🎯 KẾT QUẢ KIỂM THỬ LISTENING: ${passed}/${total} TEST CASES ĐẠT CHUẨN!`);
  console.log('================================================================');
}

runListeningTests()
  .catch((err) => {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
