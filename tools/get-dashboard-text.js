import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

function getExecutablePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error('No browser found');
}

async function getFullText() {
  const session = JSON.parse(fs.readFileSync('tools/data/aptistest/session.json', 'utf-8'));
  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setCookie({
    name: 'AptisWeb.Auth',
    value: session.authCookie,
    domain: 'aptistest.edu.vn',
    path: '/'
  });

  await page.goto('https://aptistest.edu.vn/student/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));

  const text = await page.evaluate(() => document.body.innerText);
  console.log('--- FULL DASHBOARD TEXT ---');
  console.log(text.substring(0, 3000));
  fs.writeFileSync('tools/data/aptistest/dashboard_full_text.txt', text);
  await browser.close();
}

getFullText().catch(console.error);

