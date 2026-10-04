import fs from 'node:fs';

async function inspectLovable() {
  const jsCode = await (await fetch('https://aptiskytich.vn/assets/index-55GF0-ql.js')).text();

  // Tìm các lời gọi fetch, axios hoặc supabase
  console.log('--- Tìm các bảng Supabase khác qua regex ---');
  const allFromMatches = [...jsCode.matchAll(/\.from\(["']([^"']+)["']\)/g)].map(m => m[1]);
  console.log('Tất cả bảng Supabase xuất hiện trong code:', Array.from(new Set(allFromMatches)));

  // Tìm các chuỗi URL liên quan đến test, exam, reading, listening
  const allImports = [...jsCode.matchAll(/import\((?:[^)]+)\)/g)].map(m => m[0]);
  console.log('Các import động:', allImports.length);

  // Tìm tất cả các file trong dist/assets bằng cách tìm pattern /assets/ hoặc index-
  const assetMatches = [...jsCode.matchAll(/"([^"]+\.(?:js|json|css))"/g)].map(m => m[1]);
  console.log('Các file asset được trích xuất:', assetMatches.filter(f => f.includes('asset') || f.endsWith('.js')));

  // Tìm từ khóa reading, listening, grammar, exam trong code
  const keywords = ['reading', 'listening', 'grammar', 'speaking', 'writing', 'full-test', 'thi-thu'];
  for (const kw of keywords) {
    const idx = jsCode.indexOf(kw);
    if (idx !== -1) {
      console.log(`Tìm thấy từ khóa "${kw}" tại vị trí ${idx}:`);
      console.log(jsCode.substring(Math.max(0, idx - 50), Math.min(jsCode.length, idx + 150)));
      console.log('-----------------------------------');
    }
  }
}

inspectLovable().catch(console.error);
