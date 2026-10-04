import fs from 'node:fs';

async function testExamSets() {
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  console.log('🔍 Đang kiểm tra bảng `exam_sets` và `prediction_items` trên Supabase...');

  const tables = ['exam_sets', 'prediction_items', 'useExamSets'];
  for (const tbl of tables) {
    const res = await fetch(`${supabaseUrl}/rest/v1/${tbl}?select=*&limit=5`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    console.log(`Table '${tbl}': HTTP ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log(`  -> Số lượng bản ghi mẫu: ${data.length}`);
      if (data.length > 0) {
        console.log(`  -> Mẫu bản ghi đầu tiên:`, JSON.stringify(data[0], null, 2).substring(0, 1500));
        fs.writeFileSync(`tools/sample-${tbl}.json`, JSON.stringify(data, null, 2));
      }
    } else {
      const err = await res.text();
      console.log(`  -> Lỗi:`, err);
    }
  }

  // Đọc file useExamSets-y-ZrLnO3.js để xem cách họ fetch
  console.log('\n🔍 Đang đọc file useExamSets-y-ZrLnO3.js...');
  const useExamSetsRes = await fetch('https://aptiskytich.vn/assets/useExamSets-y-ZrLnO3.js');
  if (useExamSetsRes.ok) {
    const text = await useExamSetsRes.text();
    console.log(`Size của useExamSets: ${(text.length / 1024).toFixed(1)} KB`);
    console.log(text.substring(0, 2000));
  }
}

testExamSets().catch(console.error);
