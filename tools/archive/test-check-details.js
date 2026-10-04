import fs from 'node:fs';

async function checkDetails() {
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  // 1. Kiểm tra toàn bộ danh mục THI THỬ (full_tests)
  console.log('--- 1. Kiểm tra bảng full_tests ---');
  const ftRes = await fetch(`${supabaseUrl}/rest/v1/full_tests?select=*&order=created_at.asc`, {
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
  });
  if (ftRes.ok) {
    const fullTests = await ftRes.json();
    console.log(`✅ Tổng số bộ THI THỬ (Full Tests): ${fullTests.length} đề`);
    console.log('Mẫu các đề thi thử:', fullTests.slice(0, 5));
    fs.writeFileSync('tools/sample-full-tests.json', JSON.stringify(fullTests, null, 2));

    // Thử kiểm tra xem 1 full_test_id có bao nhiêu exam_sets
    if (fullTests.length > 0) {
      const ftId = fullTests[0].id;
      const setsInFt = await fetch(`${supabaseUrl}/rest/v1/exam_sets?full_test_id=eq.${ftId}&select=id,title,skill,part`, {
        headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
      });
      if (setsInFt.ok) {
        const parts = await setsInFt.json();
        console.log(`Bộ đề "${fullTests[0].title}" bao gồm ${parts.length} phần thi kỹ năng con:`, parts);
      }
    }
  }

  // 2. Kiểm tra VocabStudy-6pXuqV4u.js xem họ fetch từ bảng nào
  console.log('\n--- 2. Kiểm tra code của VocabStudy & VocabListDetail ---');
  const vocabCode = await (await fetch('https://aptiskytich.vn/assets/VocabStudy-6pXuqV4u.js')).text();
  const vTables = [...vocabCode.matchAll(/\.from\(["']([^"']+)["']\)/g)].map(m => m[1]);
  console.log('Tables trong VocabStudy:', Array.from(new Set(vTables)));

  const vocabDetailCode = await (await fetch('https://aptiskytich.vn/assets/VocabListDetail-CJ2pxyBV.js')).text();
  const vdTables = [...vocabDetailCode.matchAll(/\.from\(["']([^"']+)["']\)/g)].map(m => m[1]);
  console.log('Tables trong VocabListDetail:', Array.from(new Set(vdTables)));

  // In đoạn fetch query trong VocabStudy
  const vocabSelects = [...vocabCode.matchAll(/\.select\([^)]+\)/g)].map(m => m[0]);
  console.log('Selects trong VocabStudy:', vocabSelects);

  // 3. Kiểm tra Dictation (Nghe chép)
  console.log('\n--- 3. Kiểm tra code AdminDictation-BM316XVA.js & Dictation ---');
  const adminDictCode = await (await fetch('https://aptiskytich.vn/assets/AdminDictation-BM316XVA.js')).text();
  const adSelects = [...adminDictCode.matchAll(/\.select\([^)]+\)/g)].map(m => m[0]);
  console.log('Selects trong AdminDictation:', adSelects.slice(0, 5));

  // Kiểm tra bảng dictation_sentences trên Supabase
  const dsRes = await fetch(`${supabaseUrl}/rest/v1/dictation_sentences?select=*&limit=3`, {
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
  });
  console.log(`Bảng dictation_sentences: HTTP ${dsRes.status}`);
  if (dsRes.ok) {
    const ds = await dsRes.json();
    console.log(`  -> Số lượng mẫu: ${ds.length}`);
  }
}

checkDetails().catch(console.error);
