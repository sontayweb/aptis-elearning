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

async function testAptisTestLogin() {
  console.log('🚀 Đang kiểm tra đăng nhập vào https://aptistest.edu.vn/login ...');

  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://aptistest.edu.vn/login', { waitUntil: 'networkidle2' });

  console.log('URL hiện tại:', page.url());

  const formInfo = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input')).map(i => ({
      type: i.type, name: i.name, placeholder: i.placeholder, id: i.id
    }));
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim());
    return { inputs, buttons };
  });

  console.log('Inputs trên aptistest.edu.vn:', formInfo.inputs);
  console.log('Buttons trên aptistest.edu.vn:', formInfo.buttons);

  // Thử điền form đăng nhập
  const emailInput = await page.$('input[type="email"], input[name="email"], input[name="username"], input[type="text"]');
  const pwdInput = await page.$('input[type="password"]');

  if (emailInput && pwdInput) {
    console.log('👉 Điền thanhthu8805pl@gmail.com / Thu123...');
    await emailInput.type('thanhthu8805pl@gmail.com', { delay: 30 });
    await pwdInput.type('Thu123', { delay: 30 });

    const submitBtn = await page.$('button[type="submit"]') || (await page.$$('button'))[0];
    if (submitBtn) {
      console.log('Bấm Đăng nhập...');
      await submitBtn.click();
    }

    await new Promise(r => setTimeout(r, 6000));

    const finalUrl = page.url();
    console.log('\n🎉 URL sau đăng nhập:', finalUrl);

    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
    console.log('Body Text:', bodyText);

    const cookies = await page.cookies();
    console.log('Cookies nhận được:', cookies.map(c => `${c.name} (${c.domain})`));
    fs.writeFileSync('tools/aptistest_cookies.json', JSON.stringify(cookies, null, 2));

    await page.screenshot({ path: 'tools/aptistest_result.png', fullPage: true });
    console.log('📸 Đã chụp ảnh lưu tại tools/aptistest_result.png');
  }

  await browser.close();
}

testAptisTestLogin().catch(console.error);
