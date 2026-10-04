import fs from 'node:fs';

async function scanChunks() {
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const jsCode = await (await fetch('https://aptiskytich.vn/assets/index-55GF0-ql.js')).text();

  // Tìm tất cả các chunk .js được dynamic import trong index-xxx.js
  const chunkMatches = [...jsCode.matchAll(/["'](\/assets\/[^"']+\.js)["']/g)].map(m => m[1]);
  const relativeChunks = [...jsCode.matchAll(/import\(\s*["'](\.\/[^"']+\.js)["']\s*\)/g)].map(m => m[1]);
  const stringChunks = [...jsCode.matchAll(/["']([a-zA-Z0-9_\-]+-[a-zA-Z0-9_\-]+\.js)["']/g)].map(m => m[1]);

  console.log('Chunk strings found:', stringChunks.slice(0, 30));

  // Thử tìm các chunk liên quan đến reading, listening, exam, thi-thu
  const uniqueChunks = Array.from(new Set([...chunkMatches, ...stringChunks]));
  console.log(`Tìm thấy ${uniqueChunks.length} chunks tiềm năng.`);

  // Hãy tìm trong index js xem có API endpoint nào khác không (vd: /api/, functions/v1, v.v.)
  const apiMatches = [...jsCode.matchAll(/https?:\/\/[a-zA-Z0-9_.\-]+(?:\/[a-zA-Z0-9_.\-~%]+)*/g)].map(m => m[0]);
  const filteredApis = Array.from(new Set(apiMatches)).filter(url => 
    !url.includes('w3.org') && !url.includes('google') && !url.includes('facebook') && !url.includes('schema.org')
  );
  console.log('Các external API / URLs trong bundle chính:');
  console.log(filteredApis);

  // Thử query Supabase với Anon Key xem có các table thi thử, exams không
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  console.log('\n--- Thử kiểm tra Supabase REST API & Swagger Schema ---');
  try {
    const swaggerRes = await fetch(`${supabaseUrl}/rest/v1/?apikey=${anonKey}`);
    if (swaggerRes.ok) {
      const swaggerJson = await swaggerRes.json();
      console.log('✅ Supabase OpenAPI Schema truy cập được!');
      const tables = Object.keys(swaggerJson.definitions || swaggerJson.paths || {});
      console.log('Toàn bộ Tables/Views trong Supabase:', tables);
      fs.writeFileSync('tools/supabase-tables.json', JSON.stringify(tables, null, 2));
    } else {
      console.log(`Supabase REST root status: ${swaggerRes.status}`);
    }
  } catch (e) {
    console.log('Lỗi test Swagger:', e.message);
  }

  // Thử check các table phổ biến
  const testTables = ['exams', 'exam', 'tests', 'questions', 'parts', 'reading_tests', 'listening_tests', 'vocab_lists', 'nghe_chep'];
  for (const tbl of testTables) {
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/${tbl}?select=*&limit=1`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      });
      console.log(`Table '${tbl}': HTTP ${r.status}`);
      if (r.ok) {
        const data = await r.json();
        console.log(`  -> Data count/sample:`, data.length);
      }
    } catch {}
  }
}

scanChunks().catch(console.error);
