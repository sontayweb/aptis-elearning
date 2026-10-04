import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

function getExecutablePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error('Không tìm thấy trình duyệt.');
}

async function testButtonsAcademy() {
  console.log('=====================================================');
  console.log('🔍 KIỂM TRA TOÀN BỘ CÁC NÚT & LIÊN KẾT TRÊN APTIS ACADEMY');
  console.log('=====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://aptisacademy.com.vn/', { waitUntil: 'networkidle2' });

  // Thu thập tất cả các nút (button) và liên kết (a)
  const elements = await page.evaluate(() => {
    const results = [];

    // 1. Quét tất cả thẻ <a>
    document.querySelectorAll('a').forEach(a => {
      const text = a.textContent?.trim().replace(/\s+/g, ' ');
      const href = a.getAttribute('href');
      if (text && href) {
        results.push({
          type: 'LINK (<a>)',
          label: text,
          target: href,
          isExternal: href.startsWith('http') && !href.includes('aptisacademy.com.vn')
        });
      }
    });

    // 2. Quét tất cả thẻ <button>
    document.querySelectorAll('button').forEach(b => {
      const text = b.textContent?.trim().replace(/\s+/g, ' ');
      const onclick = b.getAttribute('onclick');
      const type = b.getAttribute('type');
      if (text) {
        results.push({
          type: 'BUTTON (<button>)',
          label: text,
          target: onclick || type || 'interactive',
          isExternal: false
        });
      }
    });

    return results;
  });

  console.log(`Tìm thấy ${elements.length} nút & liên kết trên trang chủ aptisacademy.com.vn:`);
  elements.forEach((el, idx) => {
    console.log(`[${idx + 1}] [${el.type}] "${el.label}" -> ${el.target} ${el.isExternal ? '(Ra ngoài: Zalo/FB)' : ''}`);
  });

  // Kiểm tra cụ thể trang Review: /review-exam
  console.log('\n--- Kiểm tra trang: https://aptisacademy.com.vn/review-exam ---');
  await page.goto('https://aptisacademy.com.vn/review-exam', { waitUntil: 'networkidle2' });
  const reviewContent = await page.evaluate(() => {
    const title = document.querySelector('h1, h2')?.textContent?.trim();
    const articles = Array.from(document.querySelectorAll('article, .post, .card, [class*="item"]')).map(el => el.textContent?.trim().substring(0, 100));
    return { title, articlesCount: articles.length, sampleText: document.body.innerText.substring(0, 500) };
  });
  console.log('Review exam info:', reviewContent);

  // Kiểm tra trang Blog: /blog
  console.log('\n--- Kiểm tra trang: https://aptisacademy.com.vn/blog ---');
  await page.goto('https://aptisacademy.com.vn/blog', { waitUntil: 'networkidle2' });
  const blogContent = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/blog/"]')).map(a => ({
      title: a.textContent?.trim(),
      href: a.href
    }));
    return { links, sampleText: document.body.innerText.substring(0, 500) };
  });
  console.log(`Blog: Tìm thấy ${blogContent.links.length} bài viết.`);
  blogContent.links.forEach(l => console.log(`  - [${l.title}] -> ${l.href}`));

  await browser.close();
}

testButtonsAcademy().catch(console.error);
