import fs from 'node:fs';

async function checkBlogTypes() {
  const code = await (await fetch('https://aptiskytich.vn/assets/blogTypes-DK3xVraf.js')).text();
  console.log(`- Dung lượng blogTypes: ${(code.length / 1024).toFixed(1)} KB`);
  console.log('--- Toàn bộ nội dung blogTypes ---');
  console.log(code);
}

checkBlogTypes().catch(console.error);
