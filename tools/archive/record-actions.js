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

async function getBrowser() {
  try {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
    console.log('⚡ Đã kết nối vào cửa sổ Chrome đang mở!');
    return browser;
  } catch {
    const profileDir = path.resolve(__dirname, '../.chrome_profile_aptis');
    console.log('🚀 Khởi động Chrome mới với profile lưu trữ...');
    return await puppeteer.launch({
      executablePath: getExecutablePath(),
      headless: false,
      userDataDir: profileDir,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--remote-debugging-port=9222']
    });
  }
}

async function recordSession() {
  const browser = await getBrowser();
  const pages = await browser.pages();
  const page = pages[pages.length - 1] || (await browser.newPage());

  const recordedActions = [];
  const outputFile = path.resolve(__dirname, 'recorded_flow.json');

  console.log('\n🔴 BẮT ĐẦU GHI LẠI THAO TÁC CỦA BẠN...');
  console.log(`🌐 Đang theo dõi trên tab: ${page.url()}`);
  console.log('👉 Bạn hãy thực hiện các thao tác trên trình duyệt (click, chọn đáp án, nhập chữ, chuyển trang...).');
  console.log('👉 Nhấn Ctrl + C tại terminal này khi bạn muốn DỪNG và LƯU lại kịch bản.\n');

  // Gán hàm nhận sự kiện từ trình duyệt về Node.js
  await page.exposeFunction('__recordAction', (action) => {
    action.timestamp = Date.now();
    recordedActions.push(action);
    console.log(`📍 [ACTION] ${action.type.toUpperCase()}: ${action.selector} ${action.value ? `(Giá trị: "${action.value}")` : ''}`);
    fs.writeFileSync(outputFile, JSON.stringify(recordedActions, null, 2), 'utf-8');
  });

  // Inject script bắt sự kiện vào trang
  const injection = () => {
    function getCssSelector(el) {
      if (!el || el.nodeType !== 1) return '';
      if (el.id) return `#${el.id}`;
      if (el.name) return `[name="${el.name}"]`;
      
      const tag = el.tagName.toLowerCase();
      const classes = Array.from(el.classList || [])
        .filter(c => !c.includes('hover') && !c.includes('active') && !c.includes('focus'))
        .slice(0, 2)
        .join('.');
      
      let selector = classes ? `${tag}.${classes}` : tag;
      if (el.getAttribute('data-id')) {
        selector += `[data-id="${el.getAttribute('data-id')}"]`;
      }
      return selector;
    }

    // Bắt sự kiện Click
    document.addEventListener('click', (e) => {
      const target = e.target.closest('button, a, input, select, label, [role="button"], .nav-item, .nav-submenu-item') || e.target;
      const selector = getCssSelector(target);
      window.__recordAction({
        type: 'click',
        selector,
        text: target.textContent?.trim().slice(0, 50),
        url: window.location.href
      });
    }, true);

    // Bắt sự kiện gõ phím / nhập dữ liệu
    document.addEventListener('change', (e) => {
      const target = e.target;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        window.__recordAction({
          type: 'input',
          selector: getCssSelector(target),
          value: target.value,
          url: window.location.href
        });
      }
    }, true);
  };

  await page.evaluateOnNewDocument(injection);
  await page.evaluate(injection).catch(() => {});

  // Lưu file kịch bản khi tắt tiến trình (Ctrl + C)
  process.on('SIGINT', () => {
    console.log(`\n\n💾 Đã lưu tổng cộng ${recordedActions.length} thao tác vào: tools/recorded_flow.json`);
    console.log('✅ Bạn có thể chạy: node tools/replay-actions.js để tự động chạy lại kịch bản này!');
    process.exit(0);
  });

  // Giữ tiến trình chạy
  await new Promise(() => {});
}

recordSession().catch(console.error);
