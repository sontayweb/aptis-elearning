import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getExecutablePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error('No browser found');
}

async function inspectSkills() {
  // 1. Login to get cookie
  const loginRes = await fetch('https://aptistest.edu.vn/api/auth/login-cookie', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://aptistest.edu.vn',
      'Referer': 'https://aptistest.edu.vn/login',
      'User-Agent': 'Mozilla/5.0'
    },
    body: JSON.stringify({
      emailOrUsername: 'Levandatfibc8@columbed.us',
      password: 'Onthi01',
      rememberMe: false,
      loginContext: 'Student'
    })
  });
  const rawCookieHeader = loginRes.headers.get('set-cookie');
  const match = rawCookieHeader.match(/AptisWeb\.Auth=([^;]+)/);
  const authCookieValue = match ? match[1] : '';

  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setCookie({
    name: 'AptisWeb.Auth',
    value: authCookieValue,
    domain: 'aptistest.edu.vn',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax'
  });

  const screensDir = path.resolve(__dirname, 'data/aptistest/screenshots');
  const skills = [
    { name: 'listening_options', url: 'https://aptistest.edu.vn/learning/listening/options' },
    { name: 'reading_options', url: 'https://aptistest.edu.vn/learning/reading/options' },
    { name: 'speaking_options', url: 'https://aptistest.edu.vn/learning/speaking/options' },
    { name: 'writing_options', url: 'https://aptistest.edu.vn/learning/writing/options' }
  ];

  const results = [];
  for (const s of skills) {
    try {
      console.log(`Loading ${s.name}: ${s.url} ...`);
      await page.goto(s.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(screensDir, `${s.name}.png`), fullPage: true });

      const text = await page.evaluate(() => document.body.innerText.substring(0, 1000));
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a')).map(a => ({
          text: a.textContent?.trim(),
          href: a.href
        })).filter(l => l.text && l.href && l.href.includes('/learning/'));
      });

      results.push({
        name: s.name,
        url: page.url(),
        title: await page.title(),
        preview: text.substring(0, 400),
        linksCount: links.length,
        links: links.slice(0, 10)
      });
      console.log(`✅ ${s.name} loaded. Found ${links.length} learning links.`);
    } catch (e) {
      console.warn(`Error on ${s.name}:`, e.message);
    }
  }

  fs.writeFileSync(path.resolve(__dirname, 'data/aptistest/skills_overview.json'), JSON.stringify(results, null, 2));
  await browser.close();
  console.log('Finished inspecting skills!');
}

inspectSkills().catch(console.error);

