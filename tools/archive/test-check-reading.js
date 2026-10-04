import fs from 'node:fs';

async function checkReading() {
  const readingCode = await (await fetch('https://aptiskytich.vn/assets/Reading-BwvBFolE.js')).text();
  console.log('Reading JS length:', readingCode.length);

  // Tìm các import trong Reading
  const imports = [...readingCode.matchAll(/from\s*["']([^"']+)["']/g)].map(m => m[1]);
  const dynamicImports = [...readingCode.matchAll(/import\(\s*["']([^"']+)["']/g)].map(m => m[1]);
  console.log('Reading imports:', imports);
  console.log('Reading dynamic imports:', dynamicImports);

  // Tìm các chuỗi /assets/
  const assetRefs = [...readingCode.matchAll(/["'](\.?\/assets\/[^"']+)["']/g)].map(m => m[1]);
  console.log('Asset refs in reading:', assetRefs);

  // Tìm các lời gọi API / Supabase
  const supabaseCalls = [...readingCode.matchAll(/\.from\(["']([^"']+)["']\)/g)].map(m => m[1]);
  console.log('Supabase tables in reading:', supabaseCalls);

  // In 1000 ký tự đầu và cuối
  console.log('\n--- 1000 ký tự đầu Reading ---');
  console.log(readingCode.substring(0, 1000));
}

checkReading().catch(console.error);
