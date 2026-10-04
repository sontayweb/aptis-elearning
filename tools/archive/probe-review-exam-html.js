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

async function inspectReviewExamHtml() {
  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://aptisacademy.com.vn/review-exam', { waitUntil: 'networkidle2' });

  const text = await page.evaluate(() => document.body.innerText);
  console.log('Full Text on /review-exam:');
  console.log(text.substring(0, 3000));

  const allA = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.textContent?.trim(),
      href: a.href
    })).filter(l => l.text);
  });
  console.log('\nAll links on /review-exam:');
  console.log(allA.slice(0, 20));

  await page.screenshot({ path: 'tools/review-exam-screenshot.png', fullPage: true });
  console.log('📸 Đã chụp ảnh màn hình lưu tại tools/review-exam-screenshot.png');

  await browser.close();
}

inspectReviewExamHtml().catch(console.error);
