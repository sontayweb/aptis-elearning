import fs from 'node:fs';

async function checkReadingAction() {
  const readingCode = await (await fetch('https://aptiskytich.vn/assets/Reading-BwvBFolE.js')).text();

  // Tìm các hàm click hoặc navigate
  console.log('--- Tìm các đường dẫn và điều hướng trong Reading ---');
  const navigateMatches = [...readingCode.matchAll(/navigate\(\s*[`"']([^`"']+)`?["']\)/g)].map(m => m[1]);
  console.log('Navigations in Reading:', navigateMatches);

  // Tìm chuỗi "/reading/" hoặc "/exam/" hoặc tương tự
  const routeStrings = [...readingCode.matchAll(/["'](\/[a-zA-Z0-9_\-\/:]+)["']/g)].map(m => m[1]);
  console.log('Routes in Reading:', Array.from(new Set(routeStrings)));

  // Tìm từ khóa check auth hoặc login
  const authChecks = [...readingCode.matchAll(/auth|user|login|navigate\("\/auth"\)/gi)].map(m => m[0]);
  console.log('Auth keywords count:', authChecks.length);

  // Xem trong SkillPractice-BY8Xj3g1.js
  const skillCode = await (await fetch('https://aptiskytich.vn/assets/SkillPractice-BY8Xj3g1.js')).text();
  console.log('\nSkillPractice length:', skillCode.length);
  const skillRoutes = [...skillCode.matchAll(/["'](\/[a-zA-Z0-9_\-\/:]+)["']/g)].map(m => m[1]);
  console.log('Routes in SkillPractice:', Array.from(new Set(skillRoutes)));
}

checkReadingAction().catch(console.error);
