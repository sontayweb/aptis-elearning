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

async function testExamUrls() {
  console.log('🚀 KIỂM TRA ĐƯỜNG DẪN ĐỀ THI TRÊN APTIS ACADEMY');

  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  // Test link 1: Listening
  const url1 = 'https://aptisacademy.com.vn/bo-de-key/listening/4?id=6a799c0e55f812b856ff1b55';
  console.log(`\n🌐 Mở đề thi 1: ${url1} ...`);
  await page.goto(url1, { waitUntil: 'networkidle2' });
  const text1 = await page.evaluate(() => document.body.innerText.substring(0, 1500));
  console.log('Nội dung đề 1 (Listening):');
  console.log(text1);

  // Test link 2: Reading
  const url2 = 'https://aptisacademy.com.vn/bo-de-key/reading/2?tab=default&id=6a62ce979e697c44c86f1095';
  console.log(`\n🌐 Mở đề thi 2: ${url2} ...`);
  await page.goto(url2, { waitUntil: 'networkidle2' });
  const text2 = await page.evaluate(() => document.body.innerText.substring(0, 1500));
  console.log('Nội dung đề 2 (Reading):');
  console.log(text2);

  // Quét xem trong trang có audio hay câu hỏi không
  const audioUrls = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('audio, source')).map(a => a.src);
  });
  console.log('Audio URLs tìm thấy:', audioUrls);

  await page.screenshot({ path: 'tools/exam_sample_screenshot.png', fullPage: true });

  await browser.close();
}

testExamUrls().catch(console.error);
