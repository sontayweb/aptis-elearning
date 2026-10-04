import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getExecutablePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error('Không tìm thấy Google Chrome hoặc Edge trên máy tính.');
}

async function scrapeMeoThiViaBrowser() {
  console.log('🚀 Khởi động trình duyệt ngầm để cào trang https://aptiskytich.vn/meo-thi-aptis ...');

  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: true, // chạy ngầm
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Lắng nghe tất cả các response mạng từ Supabase
  const interceptedData = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('blog_posts') || url.includes('/rest/v1/')) {
      try {
        const text = await response.text();
        console.log(`📡 Bắt được request: ${url} (Status: ${response.status()})`);
        if (response.status() === 200 && text.startsWith('[')) {
          const json = JSON.parse(text);
          interceptedData.push({ url, data: json });
        }
      } catch {}
    }
  });

  console.log('🌐 Đang tải trang meo-thi-aptis...');
  await page.goto('https://aptiskytich.vn/meo-thi-aptis', { waitUntil: 'networkidle2' });

  // Lấy danh sách các bài viết hiển thị trên DOM
  const articles = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('a[href*="/meo-thi-aptis/"], article, .card').forEach(el => {
      const title = el.querySelector('h2, h3, h4, .title')?.textContent?.trim();
      const href = el.getAttribute('href') || el.querySelector('a')?.getAttribute('href');
      const desc = el.querySelector('p')?.textContent?.trim();
      const img = el.querySelector('img')?.src;
      if (title && href) {
        items.push({ title, href, desc, img });
      }
    });
    return items;
  });

  console.log(`\n✅ Tìm thấy ${articles.length} bài viết trên giao diện:`);
  console.log(articles);

  if (interceptedData.length > 0) {
    console.log(`🎉 BẮT ĐƯỢC ${interceptedData.length} GÓI PAYLOAD DỮ LIỆU TỪ MẠNG!`);
    fs.writeFileSync('tools/meo-thi-network.json', JSON.stringify(interceptedData, null, 2));
  }

  // Chụp ảnh kiểm tra
  const screenshotPath = 'tools/meo-thi-screenshot.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Đã chụp ảnh màn hình lưu tại: ${screenshotPath}`);

  await browser.close();
}

scrapeMeoThiViaBrowser().catch(console.error);
