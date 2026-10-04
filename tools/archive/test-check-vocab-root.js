import fs from 'node:fs';

async function checkVocabRootPage() {
  // Tìm chunk chứa component trang /vocabulary
  const indexJs = await (await fetch('https://aptiskytich.vn/assets/index-55GF0-ql.js')).text();

  // Tìm route /vocabulary
  const vocabRouteMatch = indexJs.match(/path:\s*["']\/vocabulary["'][^}]+component:[^}]+/g) ||
                          indexJs.match(/path:\s*["']\/vocabulary["'][^}]+/g);
  console.log('Route /vocabulary match:', vocabRouteMatch);

  // Tìm tất cả các file có tên chứa Vocab
  const chunkMatches = [...indexJs.matchAll(/["'](\.\/[^"']*Vocab[^"']*\.js)["']/g)].map(m => m[1]);
  console.log('Vocab chunks:', chunkMatches);

  // Tải và đọc từng file Vocab
  for (const f of chunkMatches) {
    const code = await (await fetch(`https://aptiskytich.vn/assets/${f.replace('./', '')}`)).text();
    console.log(`\nFile ${f} (${code.length} bytes):`);
    // Tìm các chuỗi tiêu đề từ vựng hoặc mảng
    const titles = [...code.matchAll(/title:\s*["']([^"']+)["']/g)].map(m => m[1]);
    console.log(`  -> Titles found:`, titles.slice(0, 10));

    // Tìm các mảng từ
    const words = [...code.matchAll(/word:\s*["']([^"']+)["']/g)].map(m => m[1]);
    console.log(`  -> Words count: ${words.length}`);
    if (words.length > 0) console.log(`     Mẫu từ:`, words.slice(0, 10));
  }
}

checkVocabRootPage().catch(console.error);
