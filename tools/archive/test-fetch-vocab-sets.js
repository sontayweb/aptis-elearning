import fs from 'node:fs';

async function testVocabSets() {
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  console.log('🔍 Query system_vocab_sets với is_published = true...');
  const r = await fetch(`${supabaseUrl}/rest/v1/system_vocab_sets?is_published=eq.true&order=created_at.asc`, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  });

  console.log('Status:', r.status);
  if (r.ok) {
    const data = await r.json();
    console.log(`🎉 Lấy được ${data.length} bộ từ vựng hệ thống:`);
    console.log(data);
    fs.writeFileSync('tools/sample-vocab-system.json', JSON.stringify(data, null, 2));

    if (data.length > 0) {
      const setId = data[0].id;
      console.log(`\n🔍 Lấy các từ trong bộ "${data[0].title || data[0].name}" (ID: ${setId})...`);
      const r2 = await fetch(`${supabaseUrl}/rest/v1/system_vocab_words?vocab_set_id=eq.${setId}&order=order_index.asc`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      });
      if (r2.ok) {
        const words = await r2.json();
        console.log(`✅ Lấy thành công ${words.length} từ vựng:`);
        console.log(words.slice(0, 3));
        fs.writeFileSync('tools/sample-system-words.json', JSON.stringify(words, null, 2));
      }
    }
  } else {
    console.log('Lỗi:', await r.text());
  }
}

testVocabSets().catch(console.error);
