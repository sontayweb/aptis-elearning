import puppeteer from 'puppeteer-core';

async function main() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9223' });
  const pages = await browser.pages();
  const page = pages[2] || pages[1];

  console.log(`Using page: ${page.url()}`);

  page.on('response', async res => {
    const url = res.url();
    if (!url.includes('.png') && !url.includes('.jpg') && !url.includes('.css')) {
      console.log(`📡 [${res.status()}] ${url}`);
      try {
        const text = await res.text();
        if (text.length > 0 && text.length < 1000) {
          console.log(`   Response text: ${text}`);
        }
      } catch {}
    }
  });

  // Re-trigger React change events to ensure state is set
  await page.evaluate(() => {
    const emailInput = document.querySelector('input[type="email"]');
    const pwdInput = document.querySelector('input[placeholder*="••••"], input[type="password"], input[type="text"]');

    if (emailInput) {
      emailInput.value = 'Aptisonthi7@gmail.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (pwdInput) {
      pwdInput.value = 'Aptis12';
      pwdInput.dispatchEvent(new Event('input', { bubbles: true }));
      pwdInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  console.log('Clicking submit button...');
  await page.click('button[type="submit"]');

  console.log('Waiting 8 seconds for server response...');
  await new Promise(r => setTimeout(r, 8000));

  console.log(`\nURL after submit: ${page.url()}`);

  const cookies = await page.cookies();
  console.log('Cookies count:', cookies.length);
  cookies.forEach(c => console.log(` - ${c.name}: ${c.value.slice(0, 30)}...`));

  const storage = await page.evaluate(() => Object.assign({}, localStorage));
  console.log('LocalStorage keys:', Object.keys(storage));

  await page.screenshot({ path: 'data/aptisacademy/after_click_submit.png' });
  console.log('Screenshot saved to data/aptisacademy/after_click_submit.png');
}

main().catch(console.error);
