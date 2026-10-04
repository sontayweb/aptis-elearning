import fs from 'node:fs';

async function checkShowcase() {
  const code = await (await fetch('https://aptiskytich.vn/assets/showcase-CSABbxsE.js')).text();
  console.log(`- Dung lượng showcase chunk: ${(code.length / 1024).toFixed(1)} KB`);
  console.log('--- Toàn bộ nội dung showcase.js ---');
  console.log(code);
}

checkShowcase().catch(console.error);
