import fs from 'node:fs';

async function checkVocabStudyLogic() {
  const vocabCode = await (await fetch('https://aptiskytich.vn/assets/VocabStudy-6pXuqV4u.js')).text();

  // Tìm tất cả các đoạn fetch hoặc .from() trong VocabStudy
  const lines = vocabCode.split(';');
  for (const line of lines) {
    if (line.includes('vocab_') || line.includes('system_vocab') || line.includes('words')) {
      console.log('Line in VocabStudy:', line.substring(0, 300));
    }
  }

  // Kiểm tra file VocabListDetail-CJ2pxyBV.js
  const vDetailCode = await (await fetch('https://aptiskytich.vn/assets/VocabListDetail-CJ2pxyBV.js')).text();
  const dLines = vDetailCode.split(';');
  for (const line of dLines) {
    if (line.includes('vocab_') || line.includes('system_vocab') || line.includes('words')) {
      console.log('Line in VocabListDetail:', line.substring(0, 300));
    }
  }

  // Thử kiểm tra các bảng trên Supabase xem bảng nào có dữ liệu từ vựng
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  const testTables = ['vocab_lists', 'vocab_items', 'system_vocab_sets', 'system_vocab_words', 'user_vocab_words'];
  for (const tbl of testTables) {
    const r = await fetch(`${supabaseUrl}/rest/v1/${tbl}?select=*&limit=5`, {
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
    });
    console.log(`Table ${tbl}: HTTP ${r.status}`);
  }
}

checkVocabStudyLogic().catch(console.error);
