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
  throw new Error('Không tìm thấy trình duyệt.');
}

async function inspectFourPages() {
  console.log('=====================================================');
  console.log('🔍 KIỂM TRA 4 TRANG QUAN TRỌNG CỦA APTIS ACADEMY');
  console.log('=====================================================\n');

  const targets = [
    { name: 'Từ Vựng', url: 'https://aptisacademy.com.vn/tu-vung', file: 'tu_vung' },
    { name: 'Bộ Đề Key', url: 'https://aptisacademy.com.vn/bo-de-key', file: 'bo_de_key' },
    { name: 'Practice Test', url: 'https://aptisacademy.com.vn/practice-test', file: 'practice_test' },
    { name: 'Document', url: 'https://aptisacademy.com.vn/document', file: 'document' }
  ];

  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  // Bắt tất cả các API request
  const capturedApis = {};
  page.on('response', async res => {
    const u = res.url();
    if (u.includes('/api/') || u.includes('_rsc=') || u.includes('.json')) {
      try {
        const text = await res.text();
        if (text && text.length > 5) {
          if (!capturedApis[page.url()]) capturedApis[page.url()] = [];
          capturedApis[page.url()].push({
            url: u,
            status: res.status(),
            contentType: res.headers()['content-type'],
            dataPreview: text.substring(0, 300)
          });
        }
      } catch {}
    }
  });

  const results = {};

  for (const t of targets) {
    console.log(`\n-----------------------------------------------------`);
    console.log(`🌐 [${t.name}] Đang mở: ${t.url} ...`);

    try {
      const response = await page.goto(t.url, { waitUntil: 'networkidle2', timeout: 20000 });
      const status = response ? response.status() : 'Unknown';
      console.log(`- HTTP Status: ${status}`);
      console.log(`- URL thực tế (sau redirect): ${page.url()}`);

      // Bóc tách nội dung
      const pageData = await page.evaluate(() => {
        const title = document.querySelector('h1, h2, title')?.textContent?.trim() || document.title;
        const text = document.body.innerText;
        
        // Quét tất cả liên kết nội bộ
        const links = Array.from(document.querySelectorAll('a')).map(a => ({
          text: a.textContent?.trim().replace(/\s+/g, ' '),
          href: a.href
        })).filter(l => l.text && l.href && !l.href.includes('javascript') && !l.href.endsWith('#'));

        // Quét danh sách bài học, đề thi, tài liệu
        const items = Array.from(document.querySelectorAll('article, tr, li, [class*="card"], [class*="item"]')).map(el => {
          const itemTitle = el.querySelector('h3, h4, h5, a, span, p')?.textContent?.trim();
          return itemTitle;
        }).filter(Boolean);

        return {
          title,
          textLength: text.length,
          textSample: text.substring(0, 800),
          links,
          itemsCount: items.length,
          itemsSample: items.slice(0, 10)
        };
      });

      console.log(`- Tiêu đề: "${pageData.title}"`);
      console.log(`- Độ dài văn bản: ${pageData.textLength} ký tự`);
      console.log(`- Số lượng liên kết: ${pageData.links.length}`);
      console.log(`- Số lượng phần tử item/card: ${pageData.itemsCount}`);
      if (pageData.itemsSample.length > 0) {
        console.log(`  + Mẫu item:`, pageData.itemsSample.slice(0, 5));
      }

      // Chụp ảnh lưu lại
      const outDir = path.resolve(__dirname, 'screenshots');
      fs.mkdirSync(outDir, { recursive: true });
      const imgPath = path.join(outDir, `${t.file}.png`);
      await page.screenshot({ path: imgPath, fullPage: true });
      console.log(`📸 Đã chụp ảnh lưu tại: screenshots/${t.file}.png`);

      results[t.file] = {
        name: t.name,
        targetUrl: t.url,
        finalUrl: page.url(),
        status,
        pageData
      };

    } catch (err) {
      console.error(`❌ Lỗi khi mở ${t.url}:`, err.message);
      results[t.file] = { error: err.message };
    }
  }

  // Lưu toàn bộ kết quả phân tích
  const resultPath = path.resolve(__dirname, 'academy_4_pages_analysis.json');
  fs.writeFileSync(resultPath, JSON.stringify({ results, capturedApis }, null, 2));
  console.log(`\n💾 ĐÃ LƯU TOÀN BỘ PHÂN TÍCH VÀO: ${resultPath}`);

  await browser.close();
}

inspectFourPages().catch(console.error);
