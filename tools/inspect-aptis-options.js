import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getExecutablePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error('No browser found');
}

async function inspectAptisOptions() {
  const session = JSON.parse(fs.readFileSync('tools/data/aptistest/session.json', 'utf-8'));

  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setCookie({
    name: 'AptisWeb.Auth',
    value: session.authCookie,
    domain: 'aptistest.edu.vn',
    path: '/'
  });

  const aptisSkills = [
    { name: 'Listening', url: 'https://aptistest.edu.vn/learning/listening/options' },
    { name: 'Reading', url: 'https://aptistest.edu.vn/learning/reading/options' },
    { name: 'Speaking', url: 'https://aptistest.edu.vn/learning/speaking/options' },
    { name: 'Writing', url: 'https://aptistest.edu.vn/learning/writing/options' },
    { name: 'Grammar', url: 'https://aptistest.edu.vn/learning/grammar/options' }
  ];

  const results = {};

  for (const s of aptisSkills) {
    console.log(`\n🔍 Đang quét phân hệ Aptis: ${s.name} (${s.url}) ...`);
    await page.goto(s.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const data = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.innerText?.replace(/\s+/g, ' ').trim(),
        href: a.href
      })).filter(l => l.text && l.href && l.href.includes('/learning/'));

      const cards = Array.from(document.querySelectorAll('.card, .option-card, .list-group-item, [class*="item"]')).map(c => ({
        text: c.innerText?.replace(/\s+/g, ' ').trim()
      })).filter(c => c.text && c.text.length > 5 && c.text.length < 300);

      return {
        title: document.title,
        links: links.slice(0, 25),
        sampleCards: cards.slice(0, 10)
      };
    });

    results[s.name] = data;
    console.log(`✅ ${s.name}: tìm thấy ${data.links.length} liên kết luyện tập Aptis.`);
  }

  fs.writeFileSync('tools/data/aptistest/aptis_skills_catalog.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Đã lưu danh mục kỹ năng Aptis tại tools/data/aptistest/aptis_skills_catalog.json');
  await browser.close();
}

inspectAptisOptions().catch(console.error);

