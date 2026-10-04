import fs from 'node:fs';

async function checkSkillPracticeVocab() {
  const code = await (await fetch('https://aptiskytich.vn/assets/SkillPractice-BY8Xj3g1.js')).text();

  // Tìm từ khóa vocabulary trong SkillPractice
  const idx = code.indexOf('vocabulary');
  if (idx !== -1) {
    console.log('Vocabulary in SkillPractice:');
    console.log(code.substring(Math.max(0, idx - 100), Math.min(code.length, idx + 500)));
  }

  // Tìm các bảng hoặc query trong SkillPractice
  const froms = [...code.matchAll(/\.from\(["']([^"']+)["']\)/g)].map(m => m[1]);
  console.log('Tables in SkillPractice:', Array.from(new Set(froms)));

  // Tìm các component con hoặc danh sách bài
  const titles = [...code.matchAll(/title:\s*["']([^"']+)["']/g)].map(m => m[1]);
  console.log('Titles in SkillPractice:', titles.slice(0, 10));
}

checkSkillPracticeVocab().catch(console.error);
