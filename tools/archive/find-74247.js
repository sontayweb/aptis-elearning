import fs from 'node:fs';

async function main() {
  const html = await (await fetch('https://aptisacademy.com.vn/bo-de-key/listening/1')).text();
  const scriptRegex = /src=["']([^"']+\.js)["']/g;
  let match;
  const chunks = [];
  while ((match = scriptRegex.exec(html)) !== null) {
    chunks.push(match[1]);
  }

  for (const c of chunks) {
    const full = c.startsWith('http') ? c : 'https://aptisacademy.com.vn' + c;
    try {
      const text = await (await fetch(full)).text();
      if (text.includes('74247:')) {
        console.log(`\nFound 74247 in ${c}`);
        const idx = text.indexOf('74247:');
        console.log(text.slice(idx, idx + 1500));
      }
    } catch {}
  }
}

main().catch(console.error);
