import fs from 'node:fs';

async function checkAcademyLinks() {
  const html = await (await fetch('https://aptisacademy.com.vn/')).text();

  // Tìm tất cả các thẻ <a> trong HTML
  const aMatches = [...html.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis)];
  console.log(`Tìm thấy ${aMatches.length} thẻ liên kết:`);

  for (const m of aMatches) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    if (href.includes('http') || text.includes('key') || text.includes('nhập') || text.includes('thi') || text.includes('học')) {
      console.log(`- [${text}] -> ${href}`);
    }
  }

  // Tìm các subdomain của aptisacademy.com.vn nếu có (app.aptisacademy.com.vn, lms.aptisacademy.com.vn, v.v.)
  const subdomains = [...html.matchAll(/https?:\/\/([a-zA-Z0-9_\-]+\.aptisacademy\.com\.vn)/g)].map(m => m[1]);
  console.log('\nSubdomains tìm thấy:', Array.from(new Set(subdomains)));

  // Tìm các đường dẫn trong Next.js chunks
  const scriptLinks = [...html.matchAll(/https?:\/\/[a-zA-Z0-9_\.\-]+\/[a-zA-Z0-9_\.\-\/]+/g)].map(m => m[0]);
  const externalDomains = [...new Set(scriptLinks)].filter(u => !u.includes('w3.org') && !u.includes('schema.org'));
  console.log('\nCác external links:', externalDomains.slice(0, 15));
}

checkAcademyLinks().catch(console.error);
