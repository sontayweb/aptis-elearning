import fs from 'node:fs';

async function testDictationSessionFull() {
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  const setId = '0970b339-5e09-4f58-a40d-f07ccb4fd292'; // Bài 02 level 1

  console.log(`🔍 Gọi get_dictation_session với đầy đủ tham số...`);
  const r = await fetch(`${supabaseUrl}/rest/v1/rpc/get_dictation_session`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_level: 1,
      p_size: 10,
      p_set_id: setId,
      p_only_todo: false
    })
  });

  console.log('Status:', r.status);
  if (r.ok) {
    const data = await r.json();
    console.log('🎉🎉 KÉO THÀNH CÔNG 100% CÂU HỎI VÀ AUDIO CỦA BÀI NGHE CHÉP!');
    console.log('Số câu trong bài:', data.length);
    console.log('Mẫu chi tiết các câu:', JSON.stringify(data, null, 2));
    fs.writeFileSync('tools/sample-dictation-sentences.json', JSON.stringify(data, null, 2));
  } else {
    console.log('Lỗi:', await r.text());
  }
}

testDictationSessionFull().catch(console.error);
