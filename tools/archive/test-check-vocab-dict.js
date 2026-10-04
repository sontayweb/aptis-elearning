import fs from 'node:fs';

async function testSystemVocabAndDictation() {
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  console.log('--- 1. Kiểm tra system_vocab_sets & system_vocab_words ---');
  for (const t of ['system_vocab_sets', 'system_vocab_words']) {
    const r = await fetch(`${supabaseUrl}/rest/v1/${t}?select=*&limit=5`, {
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
    });
    console.log(`Table '${t}': HTTP ${r.status}`);
    if (r.ok) {
      const data = await r.json();
      console.log(`  -> Số lượng mẫu: ${data.length}`);
      if (data.length > 0) {
        console.log(`  -> Bản ghi 1:`, JSON.stringify(data[0], null, 2));
        fs.writeFileSync(`tools/sample-${t}.json`, JSON.stringify(data, null, 2));
      }
    }
  }

  // Đếm tổng số từ vựng hệ thống
  const setsCountRes = await fetch(`${supabaseUrl}/rest/v1/system_vocab_sets?select=id,name`, {
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
  });
  if (setsCountRes.ok) {
    const sets = await setsCountRes.json();
    console.log(`✅ Tổng số bộ TỪ VỰNG hệ thống: ${sets.length} bộ:`, sets.map(s => s.name));
  }

  // 2. Tìm kiếm trong Dictation-Zm6WU7PZ.js xem dữ liệu bài nghe chép nằm ở đâu
  console.log('\n--- 2. Phân tích dữ liệu Nghe Chép (Dictation) ---');
  const dictCode = await (await fetch('https://aptiskytich.vn/assets/Dictation-Zm6WU7PZ.js')).text();

  // Tìm xem có mảng dữ liệu tĩnh hardcode không (VD: [{id: 1, text: '...', audio: '...'}])
  const staticArrayMatches = [...dictCode.matchAll(/const\s+([a-zA-Z0-9_]+)\s*=\s*\[\s*\{/g)].map(m => m[1]);
  console.log('Các biến mảng tĩnh trong Dictation:', staticArrayMatches);

  // In các biến mảng tĩnh đó
  for (const varName of staticArrayMatches) {
    const pos = dictCode.indexOf(`const ${varName}`);
    if (pos !== -1) {
      console.log(`\nBiến "${varName}" (500 ký tự đầu):`);
      console.log(dictCode.substring(pos, pos + 500));
    }
  }

  // Kiểm tra bảng dictation_sets trên Supabase
  const dictSetsRes = await fetch(`${supabaseUrl}/rest/v1/dictation_sets?select=*`, {
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
  });
  console.log(`dictation_sets HTTP: ${dictSetsRes.status}`);
  if (dictSetsRes.ok) {
    const ds = await dictSetsRes.json();
    console.log(`dictation_sets count: ${ds.length}`);
  }
}

testSystemVocabAndDictation().catch(console.error);
