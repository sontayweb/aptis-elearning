import fs from 'node:fs';

async function checkDictationQuery() {
  const dictCode = await (await fetch('https://aptiskytich.vn/assets/Dictation-Zm6WU7PZ.js')).text();
  console.log('Dictation chunk size:', dictCode.length);

  // Tìm các chuỗi query supabase trong Dictation-Zm6WU7PZ.js
  const fromMatches = [...dictCode.matchAll(/\.from\(["']([^"']+)["']\)/g)].map(m => m[1]);
  console.log('Tables trong Dictation-Zm6WU7PZ.js:', Array.from(new Set(fromMatches)));

  // Nếu không thấy .from, có thể Dictation lấy dữ liệu từ một hook hoặc file khác!
  // Hãy xem tất cả các import của Dictation
  const imports = [...dictCode.matchAll(/from\s*["'](\.\/[^"']+\.js)["']/g)].map(m => m[1]);
  console.log('Imports trong Dictation:', imports);

  // Thử kiểm tra các file import xem file nào chứa query dữ liệu nghe chép
  for (const imp of imports) {
    const impCode = await (await fetch(`https://aptiskytich.vn/assets/${imp.replace('./', '')}`)).text();
    const impFroms = [...impCode.matchAll(/\.from\(["']([^"']+)["']\)/g)].map(m => m[1]);
    if (impFroms.length > 0) {
      console.log(`File ${imp} có query các bảng:`, Array.from(new Set(impFroms)));
      const selects = [...impCode.matchAll(/\.select\([^)]+\)/g)].map(m => m[0]);
      console.log(`  -> Selects:`, selects);
    }
  }

  // Tương tự cho Vocabulary: xem file nào query vocab_lists
  console.log('\n--- Kiểm tra query của Vocabulary ---');
  const vocabCode = await (await fetch('https://aptiskytich.vn/assets/VocabStudy-6pXuqV4u.js')).text();
  const vImports = [...vocabCode.matchAll(/from\s*["'](\.\/[^"']+\.js)["']/g)].map(m => m[1]);
  for (const imp of vImports) {
    const impCode = await (await fetch(`https://aptiskytich.vn/assets/${imp.replace('./', '')}`)).text();
    const impFroms = [...impCode.matchAll(/\.from\(["']([^"']+)["']\)/g)].map(m => m[1]);
    if (impFroms.length > 0) {
      console.log(`File Vocab import ${imp} query:`, Array.from(new Set(impFroms)));
      const selects = [...impCode.matchAll(/\.select\([^)]+\)/g)].map(m => m[0]);
      console.log(`  -> Selects:`, selects);
    }
  }
}

checkDictationQuery().catch(console.error);
