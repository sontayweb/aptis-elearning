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

async function scrapeReviewExam() {
  console.log('🔍 Đang cào toàn bộ danh sách Review thi thật trên https://aptisacademy.com.vn/review-exam ...');

  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  
  // Lắng nghe API request nếu có
  const apiPayloads = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/')) {
      try {
        const json = await res.json();
        apiPayloads.push({ url, json });
      } catch {}
    }
  });

  await page.goto('https://aptisacademy.com.vn/review-exam', { waitUntil: 'networkidle2' });

  // Lấy danh sách bài review
  const reviews = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('tr, .review-item, [class*="card"], [class*="item"]').forEach(el => {
      const title = el.querySelector('h2, h3, h4, a, [class*="title"]')?.textContent?.trim();
      const link = el.querySelector('a')?.getAttribute('href');
      const date = el.innerText?.match(/\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/)?.[0];
      if (title && title.includes('Review')) {
        items.push({
          title,
          link: link ? (link.startsWith('http') ? link : `https://aptisacademy.com.vn${link}`) : null,
          date,
          snippet: el.innerText.replace(/\s+/g, ' ').substring(0, 150)
        });
      }
    });
    return items;
  });

  console.log(`🎉 Tìm thấy ${reviews.length} bài review thi thật trên Aptis Academy:`);
  reviews.forEach((r, idx) => {
    console.log(`[${idx + 1}] ${r.title} (${r.date || 'Gần đây'})`);
    console.log(`    Link: ${r.link}`);
  });

  fs.writeFileSync('tools/academy_reviews_list.json', JSON.stringify({ reviews, apiPayloads }, null, 2));

  // Thử mở 1 bài review đầu tiên xem có nội dung chi tiết đề thi không
  if (reviews.length > 0 && reviews[0].link) {
    console.log(`\n🔍 Đang mở bài review chi tiết: ${reviews[0].link} ...`);
    await page.goto(reviews[0].link, { waitUntil: 'networkidle2' });
    const detail = await page.evaluate(() => {
      return {
        title: document.querySelector('h1, h2')?.textContent?.trim(),
        content: document.querySelector('article, main, .content, .post-content')?.innerText || document.body.innerText
      };
    });
    console.log('Tiêu đề bài review:', detail.title);
    console.log('Nội dung đề thi thật được học viên review (500 ký tự đầu):');
    console.log(detail.content.substring(0, 800));
  }

  await browser.close();
}

scrapeReviewExam().catch(console.error);
