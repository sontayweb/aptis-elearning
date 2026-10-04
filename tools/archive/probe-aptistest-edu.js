import fs from 'node:fs';

async function checkAptisTestEdu() {
  console.log('🔍 Đang kiểm tra trang https://aptistest.edu.vn/ ...');
  try {
    const res = await fetch('https://aptistest.edu.vn/');
    console.log('HTTP Status:', res.status);
    const html = await res.text();
    console.log(`Độ dài HTML: ${html.length} bytes`);

    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    console.log('Title:', titleMatch ? titleMatch[1] : 'Không rõ');

    // Thử kiểm tra trang login
    const loginRes = await fetch('https://aptistest.edu.vn/login');
    console.log('Login route status:', loginRes.status);
  } catch (e) {
    console.error('Lỗi khi fetch aptistest.edu.vn:', e.message);
  }
}

checkAptisTestEdu().catch(console.error);
