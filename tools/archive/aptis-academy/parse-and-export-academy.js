import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function parseAndExport() {
  console.log('=====================================================');
  console.log('📦 BẮT ĐẦU BÓC TÁCH & PHÂN LOẠI 485 BỘ ĐỀ APTIS ACADEMY');
  console.log('=====================================================\n');

  const sourceFile = path.resolve(__dirname, 'bo-de-free.json');
  if (!fs.existsSync(sourceFile)) {
    console.error('❌ Không tìm thấy file bo-de-free.json');
    return;
  }

  const raw = JSON.parse(fs.readFileSync(sourceFile, 'utf-8'));
  const meta = raw[0].metadata[0];

  const exportDir = path.resolve(__dirname, 'exported_exams');
  fs.mkdirSync(exportDir, { recursive: true });

  const stats = {
    speaking: 0,
    writing: 0,
    listening: 0,
    reading: 0,
    totalAudios: 0
  };

  // 1. XỬ LÝ SPEAKING
  console.log('🗣️ Đang xử lý kỹ năng SPEAKING...');
  const speakingExams = [];
  for (const partKey of ['part1', 'part2', 'part3', 'part4']) {
    const list = meta.speaking[partKey] || [];
    list.forEach((item, idx) => {
      stats.speaking++;
      speakingExams.push({
        id: item._id,
        part: partKey.toUpperCase(),
        title: item.title || `Speaking ${partKey.toUpperCase()} - Đề ${idx + 1}`,
        timeLimitSeconds: item.timeToDo ? Number(item.timeToDo) : null,
        image: item.image || item.questions?.[0]?.image || null,
        questions: (item.questions || []).map(q => ({
          prompt: q.content || q.questionTitle,
          subQuestions: (q.subQuestion || []).map(sq => ({
            id: sq._id,
            prompt: sq.content,
            suggestion: sq.suggestion || null
          }))
        }))
      });
    });
  }
  fs.writeFileSync(path.join(exportDir, 'speaking_all.json'), JSON.stringify(speakingExams, null, 2));

  // 2. XỬ LÝ WRITING
  console.log('✍️ Đang xử lý kỹ năng WRITING...');
  const writingExams = [];
  for (const partKey of ['part1', 'part2', 'part3', 'part4']) {
    const list = meta.writing[partKey] || [];
    list.forEach((item, idx) => {
      stats.writing++;
      writingExams.push({
        id: item._id,
        part: partKey.toUpperCase(),
        title: item.title || `Writing ${partKey.toUpperCase()} - Đề ${idx + 1}`,
        questions: (item.questions || []).map(q => ({
          prompt: q.content || q.questionTitle,
          subQuestions: (q.subQuestion || []).map(sq => ({
            prompt: sq.content,
            correctAnswer: sq.correctAnswer || null
          }))
        }))
      });
    });
  }
  fs.writeFileSync(path.join(exportDir, 'writing_all.json'), JSON.stringify(writingExams, null, 2));

  // 3. XỬ LÝ LISTENING
  console.log('🎧 Đang xử lý kỹ năng LISTENING...');
  const listeningExams = [];
  for (const partKey of ['part1', 'part2', 'part3', 'part4']) {
    const list = meta.listening[partKey] || [];
    list.forEach((item, idx) => {
      stats.listening++;
      const qObj = item.questions?.[0] || {};
      if (qObj.file) stats.totalAudios++;

      listeningExams.push({
        id: item._id,
        part: partKey.toUpperCase(),
        title: item.title || `Listening ${partKey.toUpperCase()} - Đề ${idx + 1}`,
        audioUrl: qObj.file || null,
        transcript: qObj.suggestion || null,
        questions: (qObj.subQuestion || []).map(sq => ({
          prompt: sq.content,
          options: qObj.answerList?.map(a => a.content) || [],
          correctAnswer: sq.correctAnswer || null
        }))
      });
    });
  }
  fs.writeFileSync(path.join(exportDir, 'listening_all.json'), JSON.stringify(listeningExams, null, 2));

  // 4. XỬ LÝ READING
  console.log('📖 Đang xử lý kỹ năng READING...');
  const readingExams = [];
  for (const partKey of ['part1', 'part2', 'part4', 'part5']) {
    const list = meta.reading[partKey] || [];
    list.forEach((item, idx) => {
      stats.reading++;
      const d = item.data || item;
      const q = d.questions || item.questions?.[0] || {};

      readingExams.push({
        id: item._id,
        part: partKey.toUpperCase(),
        title: d.title || `Reading ${partKey.toUpperCase()} - Đề ${idx + 1}`,
        timeLimitMinutes: d.timeToDo || 35,
        content: q.content || null,
        options: q.answerList?.map(a => a.content) || [],
        correctAnswer: q.correctAnswer || null
      });
    });
  }
  fs.writeFileSync(path.join(exportDir, 'reading_all.json'), JSON.stringify(readingExams, null, 2));

  console.log('\n=====================================================');
  console.log('🎉 BÓC TÁCH HOÀN TẤT VÀ XUẤT THÀNH CÔNG:');
  console.log(`- 🗣️ Speaking:  ${stats.speaking} đề`);
  console.log(`- ✍️ Writing:   ${stats.writing} đề`);
  console.log(`- 🎧 Listening: ${stats.listening} đề (kèm ${stats.totalAudios} file MP3 CDN gốc)`);
  console.log(`- 📖 Reading:   ${stats.reading} đề`);
  console.log(`👉 TỔNG CỘNG:   ${stats.speaking + stats.writing + stats.listening + stats.reading} BỘ ĐỀ THI`);
  console.log(`📁 Thư mục lưu dữ liệu chuẩn: ${exportDir}/`);
  console.log('=====================================================');
}

parseAndExport().catch(console.error);
