import fs from 'node:fs';

async function checkBlogQuery() {
  const code = await (await fetch('https://aptiskytich.vn/assets/Blog-Dg3Qdf-2.js')).text();

  // Tìm tất cả các câu query trong Blog-Dg3Qdf-2.js
  const fromMatches = [...code.matchAll(/\.from\([^)]+\)[^;]+/g)].map(m => m[0]);
  console.log('Query trong Blog-Dg3Qdf-2.js:');
  for (const q of fromMatches) {
    console.log('-', q.substring(0, 200));
  }

  // Tương tự trong BlogPost-Cs9RhLU8.js
  const postCode = await (await fetch('https://aptiskytich.vn/assets/BlogPost-Cs9RhLU8.js')).text();
  const postFromMatches = [...postCode.matchAll(/\.from\([^)]+\)[^;]+/g)].map(m => m[0]);
  console.log('\nQuery trong BlogPost-Cs9RhLU8.js:');
  for (const q of postFromMatches) {
    console.log('-', q.substring(0, 200));
  }
}

checkBlogQuery().catch(console.error);
