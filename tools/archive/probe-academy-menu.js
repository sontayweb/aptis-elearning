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

async function checkAcademyMenu() {
  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://aptisacademy.com.vn/', { waitUntil: 'networkidle2' });

  // Click nút menu
  const menuBtn = await page.$('button');
  if (menuBtn) {
    await menuBtn.click();
    await new Promise(r => setTimeout(r, 1000));
  }

  const allLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.textContent?.trim(),
      href: a.href
    })).filter(l => l.text);
  });

  console.log('Tất cả link trong menu và trang:');
  console.log(allLinks);

  await browser.close();
}

checkAcademyMenu().catch(console.error);
