import fs from 'node:fs';

async function testDictationRpcs() {
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  console.log('🔍 Đang gọi RPC get_dictation_levels...');
  const r1 = await fetch(`${supabaseUrl}/rest/v1/rpc/get_dictation_levels`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  console.log('get_dictation_levels status:', r1.status);
  if (r1.ok) {
    const levels = await r1.json();
    console.log('✅ Các level nghe chép:', levels);
  } else {
    console.log('Lỗi levels:', await r1.text());
  }

  console.log('\n🔍 Đang gọi RPC get_dictation_sets...');
  const r2 = await fetch(`${supabaseUrl}/rest/v1/rpc/get_dictation_sets`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_level: 1,
      p_limit: 10,
      p_offset: 0,
      p_only_todo: false
    })
  });
  console.log('get_dictation_sets status:', r2.status);
  if (r2.ok) {
    const sets = await r2.json();
    console.log(`✅ Lấy thành công ${sets.length} bài nghe chép level Foundation:`);
    console.log(sets.slice(0, 3));
    fs.writeFileSync('tools/sample-dictation-sets.json', JSON.stringify(sets, null, 2));

    if (sets.length > 0) {
      const setId = sets[0].id;
      console.log(`\n🔍 Đang gọi RPC get_dictation_session cho set "${setId}"...`);
      const r3 = await fetch(`${supabaseUrl}/rest/v1/rpc/get_dictation_session`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ p_set_id: setId })
      });
      console.log('get_dictation_session status:', r3.status);
      if (r3.ok) {
        const sessionData = await r3.json();
        console.log('✅ LẤY ĐƯỢC TOÀN BỘ CÂU & AUDIO CỦA BÀI NGHE CHÉP:');
        console.log(JSON.stringify(sessionData, null, 2).substring(0, 1000));
        fs.writeFileSync('tools/sample-dictation-session.json', JSON.stringify(sessionData, null, 2));
      } else {
        console.log('Lỗi session:', await r3.text());
      }
    }
  } else {
    console.log('Lỗi sets:', await r2.text());
  }
}

testDictationRpcs().catch(console.error);
