import fs from 'node:fs';

async function checkNextjsRoutes() {
  const html = await (await fetch('https://aptisacademy.com.vn/')).text();

  // Tìm các link đường dẫn trong HTML
  const links = [...html.matchAll(/href=["'](\/[a-zA-Z0-9_\-\/]+)["']/g)].map(m => m[1]);
  const uniqueLinks = Array.from(new Set(links));
  console.log('Các đường dẫn tìm thấy trên aptisacademy.com.vn:');
  console.log(uniqueLinks.filter(l => !l.startsWith('/_next') && l !== '/'));

  // Tìm backend API URL trong HTML hoặc JS
  const apiMatches = [...html.matchAll(/https?:\/\/[a-zA-Z0-9_\.\-]+(?:\/[a-zA-Z0-9_\.\-]+)*\/api[a-zA-Z0-9_\.\-\/]*/gi)].map(m => m[0]);
  console.log('\nCác API URL tìm thấy:', Array.from(new Set(apiMatches)));

  // Thử kiểm tra các trang thi, đăng nhập, phòng thi
  const testRoutes = ['/dang-nhap', '/login', '/auth/login', '/thi-thu', '/luyen-thi', '/khoa-hoc', '/dashboard'];
  console.log('\nKiểm tra các route con:');
  for (const r of testRoutes) {
    try {
      const resp = await fetch(`https://aptisacademy.com.vn${r}`);
      console.log(`Route ${r}: HTTP ${resp.status}`);
    } catch {}
  }
}

checkNextjsRoutes().catch(console.error);
