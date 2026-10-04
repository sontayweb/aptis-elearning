import fs from 'node:fs';

async function testQuizBank() {
  console.log('🚀 Đang tải tichtichQuizBank-CR1tvZcZ.js...');
  const res = await fetch('https://aptiskytich.vn/assets/tichtichQuizBank-CR1tvZcZ.js');
  console.log('Status:', res.status);
  if (!res.ok) {
    console.log('Lỗi tải tichtichQuizBank');
    return;
  }
  const text = await res.text();
  console.log(`Size của tichtichQuizBank: ${(text.length / 1024).toFixed(1)} KB`);

  // Phân tích nội dung bên trong
  console.log('Đoạn đầu 500 ký tự:');
  console.log(text.substring(0, 500));

  // Kiểm tra các từ khóa câu hỏi, exam, part
  const matchParts = text.match(/part/gi) || [];
  const matchQuestions = text.match(/question/gi) || [];
  const matchAudio = text.match(/https?:\/\/[^"'\s]+\.mp3/gi) || [];
  console.log(`- Thống kê:`);
  console.log(`  + Từ khóa "part": ${matchParts.length}`);
  console.log(`  + Từ khóa "question": ${matchQuestions.length}`);
  console.log(`  + File MP3 tìm thấy: ${matchAudio.length}`);
  if (matchAudio.length > 0) {
    console.log('  + Mẫu audio mp3:', matchAudio.slice(0, 5));
  }

  // Lưu file mẫu để phân tích
  fs.writeFileSync('tools/sample-quiz-bank.js', text.substring(0, 50000));

  // Kiểm tra tiếp các file khác: Reading, Listening, FullTest
  const filesToCheck = [
    'Reading-BwvBFolE.js',
    'Listening-CI5Tp1p0.js',
    'GrammarVocabulary-CI0WWESG.js',
    'Speaking-CJ3vJ_xN.js',
    'Writing-C8P98QJH.js',
    'FullTest-DRw-Fm2z.js'
  ];

  for (const f of filesToCheck) {
    try {
      const r = await fetch(`https://aptiskytich.vn/assets/${f}`);
      if (r.ok) {
        const c = await r.text();
        console.log(`\n📦 File assets/${f}: ${(c.length / 1024).toFixed(1)} KB`);
        // Kiểm tra các link dữ liệu bên trong
        const mp3s = [...new Set(c.match(/https?:\/\/[^"'\s]+\.mp3/gi) || [])];
        const images = [...new Set(c.match(/https?:\/\/[^"'\s]+\.(?:jpg|png|webp)/gi) || [])];
        console.log(`   - Audio MP3: ${mp3s.length} files`);
        if (mp3s.length > 0) console.log(`     VD audio: ${mp3s[0]}`);
        console.log(`   - Images: ${images.length} files`);
        if (images.length > 0) console.log(`     VD image: ${images[0]}`);
      }
    } catch (e) {
      console.error(`Lỗi kiểm tra ${f}:`, e.message);
    }
  }
}

testQuizBank().catch(console.error);
