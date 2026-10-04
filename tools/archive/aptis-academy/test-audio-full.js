import fs from 'node:fs';

async function testAudioFull() {
  const root = JSON.parse(fs.readFileSync('tools/aptis-academy/bo-de-full.json', 'utf-8'));
  const items = root.data.data.items;

  const audios = [];
  items.forEach(item => {
    (item.questions || []).forEach(q => {
      if (q.file && !audios.includes(q.file)) audios.push(q.file);
    });
  });

  console.log(`Tìm thấy tổng cộng ${audios.length} link audio độc nhất trong bo-de-full.json!`);
  console.log('Mẫu 3 link đầu tiên:', audios.slice(0, 3));

  if (audios.length > 0) {
    const testUrl = audios[0];
    console.log(`\n🎧 Test fetch thử link: ${testUrl} ...`);
    const r = await fetch(testUrl, { method: 'HEAD' });
    console.log(`Status: HTTP ${r.status}`);
    console.log(`Type: ${r.headers.get('content-type')}`);
    console.log(`Size: ${(Number(r.headers.get('content-length')) / 1024).toFixed(1)} KB`);
  }
}

testAudioFull().catch(console.error);
