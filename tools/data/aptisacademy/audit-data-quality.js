import fs from 'node:fs';

async function auditData() {
  console.log('=====================================================');
  console.log('🔬 KIỂM TRA ĐỘ HOÀN THIỆN & CHẤT LƯỢNG DỮ LIỆU 100%');
  console.log('=====================================================\n');

  const raw = JSON.parse(fs.readFileSync('tools/aptis-academy/bo-de-free.json', 'utf-8'));
  const meta = raw[0].metadata[0];

  // 1. Kiểm tra kỹ năng Listening
  console.log('--- 1. Kiểm tra LISTENING ---');
  let totalListening = 0;
  let hasAudio = 0;
  let missingAudio = 0;
  const sampleAudioUrls = [];

  for (const part of ['part1', 'part2', 'part3', 'part4']) {
    const list = meta.listening[part] || [];
    list.forEach(item => {
      totalListening++;
      let audio = null;
      // Tìm audio ở mọi vị trí
      if (item.file) audio = item.file;
      if (item.questions?.[0]?.file) audio = item.questions[0].file;
      if (item.audio) audio = item.audio;

      if (audio) {
        hasAudio++;
        if (sampleAudioUrls.length < 5) sampleAudioUrls.push({ part, title: item.title, audio });
      } else {
        missingAudio++;
        // Xem item này cấu trúc thế nào
        if (missingAudio <= 2) {
          console.log(`⚠️ Item thiếu audio ở ${part}:`, JSON.stringify(item, null, 2).substring(0, 400));
        }
      }
    });
  }

  console.log(`Tổng bài Listening: ${totalListening}`);
  console.log(`- Có Audio: ${hasAudio}`);
  console.log(`- Thiếu Audio: ${missingAudio}`);

  // Test tải 1 file audio mẫu xem link có sống không
  if (sampleAudioUrls.length > 0) {
    const testUrl = sampleAudioUrls[0].audio;
    console.log(`\n🎧 Đang test tải thử 1 file MP3: ${testUrl} ...`);
    try {
      const aRes = await fetch(testUrl, { method: 'HEAD' });
      console.log(`Status file audio: HTTP ${aRes.status}`);
      console.log(`Content-Type: ${aRes.headers.get('content-type')}`);
      console.log(`Content-Length: ${(Number(aRes.headers.get('content-length')) / 1024).toFixed(1)} KB`);
    } catch (e) {
      console.log('Lỗi tải audio:', e.message);
    }
  }

  // 2. Kiểm tra kỹ năng Reading
  console.log('\n--- 2. Kiểm tra READING ---');
  let totalReading = 0;
  let hasOptions = 0;
  let hasAnswer = 0;

  for (const part of ['part1', 'part2', 'part4', 'part5']) {
    const list = meta.reading[part] || [];
    list.forEach(item => {
      totalReading++;
      const d = item.data || item;
      const q = d.questions || item.questions?.[0] || {};

      const options = q.answerList || d.answerList || [];
      const answer = q.correctAnswer || d.correctAnswer;

      if (options.length > 0) hasOptions++;
      if (answer) hasAnswer++;
    });
  }
  console.log(`Tổng bài Reading: ${totalReading}`);
  console.log(`- Có Options/Lựa chọn: ${hasOptions}`);
  console.log(`- Có Đáp án chuẩn: ${hasAnswer}`);

  // 3. Kiểm tra kỹ năng Writing
  console.log('\n--- 3. Kiểm tra WRITING ---');
  let totalWriting = 0;
  for (const part of ['part1', 'part2', 'part3', 'part4']) {
    const list = meta.writing[part] || [];
    totalWriting += list.length;
  }
  console.log(`Tổng đề Writing: ${totalWriting} đề`);

  // 4. Kiểm tra kỹ năng Speaking
  console.log('\n--- 4. Kiểm tra SPEAKING ---');
  let totalSpeaking = 0;
  let hasImage = 0;
  for (const part of ['part1', 'part2', 'part3', 'part4']) {
    const list = meta.speaking[part] || [];
    list.forEach(item => {
      totalSpeaking++;
      const img = item.image || item.questions?.[0]?.image;
      if (img) hasImage++;
    });
  }
  console.log(`Tổng đề Speaking: ${totalSpeaking} đề`);
  console.log(`- Có Tranh ảnh mô tả: ${hasImage}`);

  // 5. Kiểm tra câu hỏi quan trọng: "Liệu có file bo-de-key / bản trả phí nào khác không?"
  console.log('\n--- 5. Kiểm tra xem trên server có file đề nào khác không ---');
  const otherFiles = [
    'https://aptisacademy.com.vn/data/bo-de.json',
    'https://aptisacademy.com.vn/data/exams.json',
    'https://aptisacademy.com.vn/data/all-exams.json',
    'https://aptisacademy.com.vn/data/listing.json',
    'https://aptisacademy.com.vn/data/key.json',
    'https://aptisacademy.com.vn/data/exams/listening.json',
    'https://aptisacademy.com.vn/data/exams/reading.json',
    'https://aptisacademy.com.vn/data/exams/speaking.json',
    'https://aptisacademy.com.vn/data/exams/writing.json'
  ];

  for (const u of otherFiles) {
    try {
      const r = await fetch(u, { method: 'HEAD' });
      console.log(`File ${u}: HTTP ${r.status}`);
    } catch {}
  }
}

auditData().catch(console.error);
