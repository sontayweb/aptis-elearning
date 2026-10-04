import fs from 'node:fs';

async function checkQuizMode() {
  const code = await (await fetch('https://aptiskytich.vn/assets/QuizMode-3FeQVpKk.js')).text();
  console.log('QuizMode size:', code.length);

  // In các mảng hoặc danh sách từ trong QuizMode
  const exports = [...code.matchAll(/export\s*\{([^}]+)\}/g)].map(m => m[1]);
  console.log('QuizMode exports:', exports);

  // Tìm các mảng từ vựng
  const wordArrays = [...code.matchAll(/\[\s*\{\s*id:\s*["'][^"']+["']/g)];
  console.log('Word array occurrences:', wordArrays.length);

  // Xem các topic hoặc chủ đề
  const groups = [...new Set([...code.matchAll(/group_name:\s*["']([^"']+)["']/g)].map(m => m[1]))];
  console.log('Danh sách các chủ đề từ vựng (group_name):', groups);

  const titles = [...new Set([...code.matchAll(/title:\s*["']([^"']+)["']/g)].map(m => m[1]))];
  console.log('Các danh sách bộ từ vựng (titles):', titles);

  fs.writeFileSync('tools/sample-vocab-topics.json', JSON.stringify({ groups, titles }, null, 2));
}

checkQuizMode().catch(console.error);
