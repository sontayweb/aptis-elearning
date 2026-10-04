import fs from 'node:fs';

async function checkBoDeKey() {
  console.log('🔍 Kiểm tra trang https://aptisacademy.com.vn/bo-de-key ...');
  const res = await fetch('https://aptisacademy.com.vn/bo-de-key');
  console.log('HTTP Status:', res.status);
  const html = await res.text();
  console.log('HTML length:', html.length);

  // Tìm các liên kết hoặc nội dung
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  console.log('Title:', titleMatch ? titleMatch[1] : 'Không rõ');

  // Tìm các script hoặc chunks của bo-de-key
  const chunks = [...html.matchAll(/src=["'](\/_next\/static\/chunks\/[^"']+)["']/g)].map(m => m[1]);
  console.log('Chunks:', chunks.slice(0, 8));

  // Kiểm tra xem trang có form đăng nhập hoặc danh sách đề không
  const textSample = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 1500);
  console.log('Text mẫu:', textSample);
}

checkBoDeKey().catch(console.error);
