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

async function inspectDoTest() {
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
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax'
  });

  const targetUrl = 'https://aptistest.edu.vn/learning/listening/3595/do-test';
  console.log(`🌐 Đang mở bài thi thật: ${targetUrl} ...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 35000 });

  // Đợi Blazor render xong component
  await new Promise(r => setTimeout(r, 4000));

  await page.screenshot({ path: path.resolve(__dirname, 'data/aptistest/screenshots/exam_3595_rendered.png'), fullPage: true });
  console.log('📸 Đã chụp ảnh render thực tế: exam_3595_rendered.png');

  const examData = await page.evaluate(() => {
    const title = document.title;
    const bodyText = document.body.innerText;
    const audios = Array.from(document.querySelectorAll('audio, source')).map(a => a.src || a.getAttribute('src'));
    const images = Array.from(document.querySelectorAll('img')).map(i => i.src).filter(s => !s.includes('avatar') && !s.includes('logo'));
    const questions = Array.from(document.querySelectorAll('.question-box, .question-item, .task-card, [class*="question"]')).map(q => q.innerText.substring(0, 300));

    return {
      title,
      audios: Array.from(new Set(audios.filter(Boolean))),
      images: Array.from(new Set(images)),
      questionsSample: questions.slice(0, 5),
      bodyPreview: bodyText.substring(0, 800)
    };
  });

  console.log('\n📋 Thông tin bài thi đã bóc tách:');
  console.log('Tiêu đề:', examData.title);
  console.log('Audio URLs:', examData.audios);
  console.log('Images:', examData.images);
  console.log('Preview nội dung:\n', examData.bodyPreview);

  fs.writeFileSync('tools/data/aptistest/exam_3595_extracted.json', JSON.stringify(examData, null, 2));
  await browser.close();
  console.log('\n✅ Hoàn tất bóc tách bài thi!');
}

inspectDoTest().catch(console.error);

