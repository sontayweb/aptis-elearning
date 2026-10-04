import fs from 'node:fs';

async function testGetFullTests() {
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  console.log('🔍 Đang gọi RPC get_full_tests với p_category: "aptis"...');
  const r = await fetch(`${supabaseUrl}/rest/v1/rpc/get_full_tests`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_category: 'aptis' })
  });

  console.log('Status:', r.status);
  if (r.ok) {
    const data = await r.json();
    console.log(`🎉🎉 LẤY THÀNH CÔNG ${data.length} BỘ ĐỀ THI THỬ (FULL TESTS)!`);
    console.log('Chi tiết 2 bộ đầu tiên:');
    console.log(JSON.stringify(data.slice(0, 2), null, 2));
    fs.writeFileSync('tools/sample-full-tests-rpc.json', JSON.stringify(data, null, 2));
  } else {
    console.log('Lỗi:', await r.text());
  }
}

testGetFullTests().catch(console.error);
