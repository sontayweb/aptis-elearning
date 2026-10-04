import fs from 'node:fs';

async function traceNe() {
  const code = await (await fetch('https://aptiskytich.vn/assets/SkillPractice-BY8Xj3g1.js')).text();

  // Tìm tất cả các import của SkillPractice
  const imports = [...code.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']/g)];
  for (const imp of imports) {
    if (imp[1].includes('ne') || imp[2].includes('vocab') || imp[2].includes('Bank')) {
      console.log(`Import: ${imp[1].trim()} FROM ${imp[2]}`);
    }
  }

  // Tìm các định nghĩa của ne trong file
  const matches = [...code.matchAll(/(?:const|let|var)\s+ne\s*=\s*([^;]+)/g)];
  for (const m of matches) {
    console.log('ne assignment:', m[0].substring(0, 300));
  }
}

traceNe().catch(console.error);
