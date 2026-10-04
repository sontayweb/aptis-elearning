import fs from 'node:fs';

async function checkLoginEndpoint() {
  const code = await (await fetch('https://aptisacademy.com.vn/_next/static/chunks/app/(website)/login/page-fb1787d87cceb72e.js')).text();

  // Tìm tất cả các lời gọi fetch, axios, post hoặc /api/
  const apis = [...code.matchAll(/["'](\/api\/[^"']+)["']/g)].map(m => m[1]);
  console.log('APIs trong trang login:', Array.from(new Set(apis)));

  // Tìm các đường dẫn redirect
  const redirects = [...code.matchAll(/router\.push\(\s*["']([^"']+)["']/g)].map(m => m[1]);
  console.log('Redirects:', redirects);

  // In các từ khóa auth
  const authLines = code.split(';').filter(l => l.includes('login') || l.includes('signIn') || l.includes('token') || l.includes('/api/'));
  console.log('Các đoạn code liên quan auth:');
  authLines.forEach(l => console.log('-', l.substring(0, 200)));
}

checkLoginEndpoint().catch(console.error);
