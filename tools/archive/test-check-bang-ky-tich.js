import fs from 'node:fs';

async function checkBangKyTich() {
  console.log('🔍 Đang kiểm tra trang https://aptiskytich.vn/bang-ky-tich ...');

  const code = await (await fetch('https://aptiskytich.vn/assets/ShowcaseBoard-D_vTRIh1.js')).text();
  console.log(`- Dung lượng ShowcaseBoard chunk: ${(code.length / 1024).toFixed(1)} KB`);

  // Tìm tiêu đề và mô tả
  const titles = [...code.matchAll(/title:\s*["']([^"']+)["']/g)].map(m => m[1]);
  console.log('- Titles in ShowcaseBoard:', titles);

  const descs = [...code.matchAll(/description:\s*["']([^"']+)["']/g)].map(m => m[1]);
  console.log('- Descriptions in ShowcaseBoard:', descs);

  // Tìm các bảng Supabase query
  const tables = [...code.matchAll(/\.from\(["']([^"']+)["']\)/g)].map(m => m[1]);
  console.log('- Tables queried:', Array.from(new Set(tables)));

  // Tìm các câu query select
  const selects = [...code.matchAll(/\.select\([^)]+\)/g)].map(m => m[0]);
  console.log('- Selects:', selects);

  // In 1500 ký tự đầu
  console.log('\n--- 1500 ký tự đầu ShowcaseBoard ---');
  console.log(code.substring(0, 1500));
}

checkBangKyTich().catch(console.error);
