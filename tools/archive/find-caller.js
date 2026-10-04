async function findCaller() {
  const html = await (await fetch('https://aptisacademy.com.vn/login')).text();
  const scriptRegex = /src=["']([^"']+\.js)["']/g;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const c = match[1];
    const full = c.startsWith('http') ? c : 'https://aptisacademy.com.vn' + c;
    const text = await (await fetch(full)).text();
    if (text.includes('97891') && !c.includes('7197-')) {
      console.log('Found caller in:', c);
      const idx = text.indexOf('97891');
      console.log(text.slice(Math.max(0, idx - 150), idx + 350));
    }
  }
}

findCaller().catch(console.error);
