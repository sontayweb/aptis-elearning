import fs from 'node:fs';

async function downloadBoDeFull() {
  console.log('🚀 Đang kiểm tra file https://aptisacademy.com.vn/data/bo-de.json ...');
  const res = await fetch('https://aptisacademy.com.vn/data/bo-de.json');
  console.log('HTTP Status:', res.status);
  if (!res.ok) {
    console.log('Lỗi fetch bo-de.json');
    return;
  }

  const text = await res.text();
  console.log(`🎉 Dung lượng của bo-de.json: ${(text.length / 1024).toFixed(1)} KB`);
  fs.writeFileSync('tools/aptis-academy/bo-de-full.json', text, 'utf-8');

  try {
    const data = JSON.parse(text);
    console.log(`- Số phần tử trong bo-de.json: ${Array.isArray(data) ? data.length : typeof data}`);
    if (Array.isArray(data) && data.length > 0) {
      console.log('- Các trường:', Object.keys(data[0]));
      if (data[0].metadata && data[0].metadata[0]) {
        const m = data[0].metadata[0];
        console.log('- Các kỹ năng trong metadata:', Object.keys(m));
        if (m.listening) {
          console.log('  + Listening Part 1:', m.listening.part1?.length);
          console.log('  + Listening Part 2:', m.listening.part2?.length);
          console.log('  + Listening Part 3:', m.listening.part3?.length);
          console.log('  + Listening Part 4:', m.listening.part4?.length);
        }
      }
    }
  } catch (e) {
    console.log('Lỗi parse JSON:', e.message);
  }
}

downloadBoDeFull().catch(console.error);
