import fs from 'node:fs';

async function inspectOtherModules() {
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  console.log('=====================================================');
  console.log('🔍 KIỂM TRA 3 PHẦN: THI THỬ, TỪ VỰNG, NGHE CHÉP');
  console.log('=====================================================\n');

  // 1. THI THỬ (Full Test)
  console.log('--- 1. Kiểm tra THI THỬ (/thi-thu, FullTest) ---');
  try {
    const fullTestCode = await (await fetch('https://aptiskytich.vn/assets/FullTest-DRw-Fm2z.js')).text();
    const ftTables = [...fullTestCode.matchAll(/\.from\(["']([^"']+)["']\)/g)].map(m => m[1]);
    console.log('Tables trong FullTest:', Array.from(new Set(ftTables)));

    // Thử truy vấn các bảng liên quan đến full_test trên Supabase
    const ftTableNames = ['full_tests', 'full_test_sessions', 'full_test_sets', 'practice_tests'];
    for (const t of ftTableNames) {
      const r = await fetch(`${supabaseUrl}/rest/v1/${t}?select=*&limit=3`, {
        headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
      });
      console.log(`Supabase table '${t}': HTTP ${r.status}`);
      if (r.ok) {
        const data = await r.json();
        console.log(`  -> Số lượng: ${data.length}`, data.length > 0 ? Object.keys(data[0]) : '');
        if (data.length > 0) fs.writeFileSync(`tools/sample-${t}.json`, JSON.stringify(data, null, 2));
      }
    }
  } catch (e) {
    console.log('Lỗi check FullTest:', e.message);
  }

  // 2. TỪ VỰNG (Vocabulary)
  console.log('\n--- 2. Kiểm tra TỪ VỰNG (/vocabulary) ---');
  try {
    const vocabTables = ['vocab_lists', 'vocab_items', 'vocabulary', 'words'];
    for (const t of vocabTables) {
      const r = await fetch(`${supabaseUrl}/rest/v1/${t}?select=*&limit=5`, {
        headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
      });
      console.log(`Supabase table '${t}': HTTP ${r.status}`);
      if (r.ok) {
        const data = await r.json();
        console.log(`  -> Số lượng mẫu: ${data.length}`);
        if (data.length > 0) {
          console.log(`  -> Cột:`, Object.keys(data[0]));
          console.log(`  -> Mẫu data:`, JSON.stringify(data[0], null, 2).substring(0, 300));
          fs.writeFileSync(`tools/sample-${t}.json`, JSON.stringify(data, null, 2));
        }
      }
    }

    // Đếm tổng số danh sách từ vựng
    const vListsRes = await fetch(`${supabaseUrl}/rest/v1/vocab_lists?select=id,title,total_words,level`, {
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
    });
    if (vListsRes.ok) {
      const lists = await vListsRes.json();
      console.log(`✅ Tổng số bộ từ vựng (vocab_lists): ${lists.length} bộ`);
      console.log('Danh sách các bộ:', lists.map(l => `${l.title} (${l.total_words || '?'} từ)`).slice(0, 10));
    }
  } catch (e) {
    console.log('Lỗi check Vocabulary:', e.message);
  }

  // 3. NGHE CHÉP (/nghe-chep)
  console.log('\n--- 3. Kiểm tra NGHE CHÉP CHÍNH TẢ (/nghe-chep) ---');
  try {
    const dictationTables = ['dictation_sets', 'dictation_items', 'dictations', 'nghe_chep_sets', 'shadowing_sets'];
    for (const t of dictationTables) {
      const r = await fetch(`${supabaseUrl}/rest/v1/${t}?select=*&limit=5`, {
        headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
      });
      console.log(`Supabase table '${t}': HTTP ${r.status}`);
      if (r.ok) {
        const data = await r.json();
        console.log(`  -> Số lượng mẫu: ${data.length}`);
        if (data.length > 0) {
          console.log(`  -> Cột:`, Object.keys(data[0]));
          fs.writeFileSync(`tools/sample-${t}.json`, JSON.stringify(data, null, 2));
        }
      }
    }

    // Đọc Dictation chunk để xem cách họ load danh sách bài nghe chép
    const dictCode = await (await fetch('https://aptiskytich.vn/assets/Dictation-Zm6WU7PZ.js')).text();
    // Tìm các chuỗi /rest/v1 hoặc query
    const dictQueryMatches = [...dictCode.matchAll(/\.from\(["']([^"']+)["']\)/g)].map(m => m[1]);
    console.log('Tables trong Dictation JS:', Array.from(new Set(dictQueryMatches)));

    // Xem AdminDictation chunk
    const adminDictCode = await (await fetch('https://aptiskytich.vn/assets/AdminDictation-BM316XVA.js')).text();
    const adminDictTables = [...adminDictCode.matchAll(/\.from\(["']([^"']+)["']\)/g)].map(m => m[1]);
    console.log('Tables trong AdminDictation JS:', Array.from(new Set(adminDictTables)));
  } catch (e) {
    console.log('Lỗi check Dictation:', e.message);
  }
}

inspectOtherModules().catch(console.error);
