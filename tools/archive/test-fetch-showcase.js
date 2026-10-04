import fs from 'node:fs';

async function testShowcaseBoard() {
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  console.log('🔍 Thử gọi RPC get_showcase_board để lấy các bài mẫu Writing & Speaking đạt điểm B1, B2, C...');

  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/get_showcase_board`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_skill: null,
      p_part_type: null,
      p_band: null,
      p_search: null,
      p_limit: 10,
      p_offset: 0
    })
  });

  console.log('Status:', res.status);
  if (res.ok) {
    const data = await res.json();
    console.log(`🎉 LẤY THÀNH CÔNG ${data.length} BÀI THI MẪU ĐIỂM CAO TRÊN BẢNG KỲ TÍCH!`);
    if (data.length > 0) {
      console.log('Mẫu bài 1:', JSON.stringify(data[0], null, 2));
      fs.writeFileSync('tools/sample-showcase-board.json', JSON.stringify(data, null, 2));
    }
  } else {
    console.log('Lỗi:', await res.text());
  }
}

testShowcaseBoard().catch(console.error);
