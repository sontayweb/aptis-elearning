import fs from 'node:fs';

async function findNeImport() {
  const code = await (await fetch('https://aptiskytich.vn/assets/SkillPractice-BY8Xj3g1.js')).text();

  // In toàn bộ phần import ở đầu file SkillPractice (1500 ký tự đầu)
  console.log('--- Đầu file SkillPractice ---');
  console.log(code.substring(0, 1500));
}

findNeImport().catch(console.error);
