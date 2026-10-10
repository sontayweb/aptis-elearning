import path from 'path';
import { ingestionService } from '../modules/ingestion/ingestion.service';
import { prisma } from '../config/database';

async function main() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU CHẠY MODULE INGESTION – 4 PHÂN HỆ & THI THỬ APTIS');
  console.log('================================================================\n');

  const workspaceRoot = path.resolve(__dirname, '../../../');
  const readingDir = path.join(workspaceRoot, 'READING');
  const speakingDir = path.join(workspaceRoot, 'SPEAKING');

  // 1. Phân hệ READING
  console.log('📖 [1/5] Đang xử lý phân hệ ĐỌC (READING)...');
  console.log(`   -> Thư mục nguồn: ${readingDir}`);
  const readingResults = await ingestionService.ingestReadingDirectory(readingDir);
  console.log(`   ✅ Đã bóc tách và nạp ${readingResults.length} đề thi Reading vào hệ thống.`);
  for (const r of readingResults) {
    console.log(`      * [${r.examId}] ${r.title} (${r.totalQuestions} câu hỏi)`);
  }

  // 2. Phân hệ SPEAKING (kèm trích xuất 40 ảnh thi thật)
  console.log('\n🎙️ [2/5] Đang xử lý phân hệ NÓI (SPEAKING) & Trích xuất hình ảnh...');
  console.log(`   -> Thư mục nguồn: ${speakingDir}`);
  const speakingResults = await ingestionService.ingestSpeakingDirectory(speakingDir);
  console.log(`   ✅ Đã bóc tách và nạp ${speakingResults.length} đề thi Speaking.`);
  for (const r of speakingResults) {
    console.log(`      * [${r.examId}] ${r.title} (Hình ảnh gắn vào: ${r.mediaExtracted.images.length} ảnh)`);
    r.mediaExtracted.images.forEach((img) => console.log(`        🖼️ Image URL: ${img}`));
  }

  // 3. Phân hệ LISTENING (kèm sinh giọng nói tự động - "Nó sẽ nói")
  console.log('\n🎧 [3/5] Đang xử lý phân hệ NGHE (LISTENING) & Sinh giọng đọc bản ngữ (TTS)...');
  const listeningResult = await ingestionService.ingestListeningSample(
    'Đề Thi Thử Listening 01 – Kèm Audio Giọng Bản Ngữ Tự Động'
  );
  console.log(`   ✅ Đã bóc tách và nạp đề Listening: [${listeningResult.examId}] ${listeningResult.title}`);
  listeningResult.mediaExtracted.audioFiles.forEach((aud) => console.log(`      🔊 Audio URL: ${aud}`));

  // 4. Phân hệ WRITING
  console.log('\n✍️ [4/5] Đang xử lý phân hệ VIẾT (WRITING)...');
  const writingResult = await ingestionService.ingestWritingSample('International Travel Club');
  console.log(`   ✅ Đã bóc tách và nạp đề Writing: [${writingResult.examId}] ${writingResult.title}`);

  // 5. Phân hệ THI THỬ (FULL TEST 162 phút)
  console.log('\n🏆 [5/5] Đang lắp ghép đề THI THỬ FULL TEST (162 phút)...');
  const readingExam = readingResults.length > 0 ? await prisma.exam.findUnique({
    where: { id: readingResults[0].examId },
    include: { parts: { include: { questions: true } } },
  }) : null;

  const fullTestResult = await ingestionService.assembleAndSaveFullTest(
    'Đề Thi Thử Aptis ESOL Full Test Chuẩn Hội Đồng Anh 01',
    {
      readingExam: readingExam ? {
        title: readingExam.title,
        skill: readingExam.skill,
        durationMinutes: readingExam.duration_minutes,
        parts: readingExam.parts.map((p) => ({
          partNumber: p.part_number,
          title: p.title,
          instructions: p.instructions || undefined,
          passageText: p.passage_text || undefined,
          questions: p.questions.map((q) => ({
            questionNumber: q.question_number,
            questionType: q.question_type,
            prompt: q.prompt,
            options: q.options ? JSON.parse(q.options as string) : undefined,
            correctAnswer: q.correct_answer || undefined,
            maxScore: q.max_score,
          })),
        })),
      } : undefined,
    }
  );

  console.log(`   ✅ Đã tạo thành công Đề Full Test: [${fullTestResult.examId}] ${fullTestResult.title}`);
  console.log(`      * Tổng số phần thi: ${fullTestResult.totalParts}`);
  console.log(`      * Tổng số câu hỏi: ${fullTestResult.totalQuestions}`);

  console.log('\n================================================================');
  console.log('🎉 HOÀN THÀNH TOÀN BỘ TIẾN TRÌNH INGESTION CHO 4 PHÂN HỆ & FULL TEST!');
  console.log('================================================================');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi tiến trình ingestion:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
