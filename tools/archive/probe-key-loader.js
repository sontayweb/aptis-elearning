import fs from 'node:fs';

async function main() {
  const url = 'https://aptisacademy.com.vn/bo-de-key/listening/1';
  console.log(`Fetching ${url}...`);
  const html = await (await fetch(url)).text();
  const scriptRegex = /src=["']([^"']+\.js)["']/g;
  let match;
  const chunks = [];
  while ((match = scriptRegex.exec(html)) !== null) {
    chunks.push(match[1]);
  }
  console.log(`Found ${chunks.length} chunks on page.`);

  for (const c of chunks) {
    if (c.includes('listening') || c.includes('page') || c.includes('bo-de')) {
      console.log(`\nTarget chunk: ${c}`);
      const full = c.startsWith('http') ? c : 'https://aptisacademy.com.vn' + c;
      const text = await (await fetch(full)).text();
      console.log('Size:', text.length);
      const urlRegex = /["'](\/data\/[^"']+|\/api\/[^"']+|https:\/\/[^"']+)["']/g;
      let u;
      const urls = new Set();
      while ((u = urlRegex.exec(text)) !== null) {
        if (!u[1].includes('w3.org') && !u[1].includes('facebook') && !u[1].includes('tiktok')) {
          urls.add(u[1]);
        }
      }
      console.log('Endpoints in chunk:', Array.from(urls));
    }
  }
}

main().catch(console.error);
