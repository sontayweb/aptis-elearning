import fs from 'node:fs';

async function checkDictationDetails() {
  const code = await (await fetch('https://aptiskytich.vn/assets/Dictation-Zm6WU7PZ.js')).text();

  // Tìm các import của Dictation
  const imports = [...code.matchAll(/from\s*["']([^"']+)["']/g)].map(m => m[1]);
  console.log('Dictation imports:', imports);

  // Tìm các chuỗi http hoặc file data
  const urls = [...new Set(code.match(/https?:\/\/[^"'\s]+/g) || [])];
  console.log('URLs in Dictation:', urls);

  // Tìm các từ khóa liên quan đến bộ bài
  const sets = [...code.matchAll(/title|name|audio|text/gi)].map(m => m[0]);
  console.log('Sets matches count:', sets.length);
}

checkDictationDetails().catch(console.error);
