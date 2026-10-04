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
  throw new Error('Không tìm thấy trình duyệt');
}

async function replaySession() {
  const flowFile = path.resolve(__dirname, 'recorded_flow.json');
  if (!fs.existsSync(flowFile)) {
    console.log('❌ Chưa có file kịch bản recorded_flow.json. Hãy chạy record-actions.js trước.');
    return;
  }

  const actions = JSON.parse(fs.readFileSync(flowFile, 'utf-8'));
  console.log(`🎬 Đang chuẩn bị chạy lại ${actions.length} thao tác đã ghi...`);

  const profileDir = path.resolve(__dirname, '../.chrome_profile_aptis');
  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: false,
    userDataDir: profileDir,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  if (actions.length > 0 && actions[0].url) {
    console.log(`🌐 Mở URL ban đầu: ${actions[0].url}`);
    await page.goto(actions[0].url, { waitUntil: 'domcontentloaded' });
  }

  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];
    console.log(`▶️ [Bước ${i + 1}/${actions.length}] ${act.type.toUpperCase()} -> ${act.selector || act.text || ''}`);

    try {
      await page.waitForTimeout ? await page.waitForTimeout(1000) : await new Promise(r => setTimeout(r, 1000));

      if (act.type === 'click') {
        const el = await page.$(act.selector);
        if (el) {
          await el.click();
        } else {
          console.warn(`⚠️ Không tìm thấy phần tử: ${act.selector}`);
        }
      } else if (act.type === 'input') {
        await page.type(act.selector, act.value || '', { delay: 50 });
      }
    } catch (e) {
      console.warn(`Lỗi tại bước ${i + 1}: ${e.message}`);
    }
  }

  console.log('\n🎉 ĐÃ HOÀN THÀNH TỰ ĐỘNG LẶP LẠI KỊCH BẢN!');
}

replaySession().catch(console.error);
