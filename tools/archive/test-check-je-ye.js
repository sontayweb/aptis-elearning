import fs from 'node:fs';

async function checkJeYe() {
  const code = await (await fetch('https://aptiskytich.vn/assets/QuizMode-3FeQVpKk.js')).text();

  // In toàn bộ file QuizMode vì nó chỉ có 11KB
  console.log('--- TOÀN BỘ FILE QuizMode-3FeQVpKk.js ---');
  console.log(code.substring(0, 3000));
  console.log('\n--- Đoạn tiếp theo ---');
  console.log(code.substring(3000, 6000));
}

checkJeYe().catch(console.error);
