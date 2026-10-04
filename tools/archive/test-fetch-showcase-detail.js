import fs from 'node:fs';

async function testShowcaseDetail() {
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  const sampleId = 'ead39e58-73a5-45ce-bebf-d7a5b5bae36b';
  console.log(`🔍 Gọi RPC get_showcase_detail cho bài ID: ${sampleId}...`);

  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/get_showcase_detail`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_id: sampleId })
  });

  if (res.ok) {
    const data = await res.json();
    console.log('🎉 LẤY ĐƯỢC TOÀN BỘ BÀI MẪU CHI TIẾT (FULL BÀI VIẾT + TỪ VỰNG ĂN ĐIỂM + ĐÁNH GIÁ):');
    console.log(JSON.stringify(data[0], null, 2));
    fs.writeFileSync('tools/sample-showcase-detail.json', JSON.stringify(data[0], null, 2));
  } else {
    console.log('Lỗi:', await res.text());
  }
}

testShowcaseDetail().catch(console.error);
