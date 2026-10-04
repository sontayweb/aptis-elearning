async function searchAuth() {
  const html = await (await fetch('https://aptisacademy.com.vn/login')).text();
  const scriptRegex = /src=["']([^"']+\.js)["']/g;
  let match;
  const chunks = [];
  while ((match = scriptRegex.exec(html)) !== null) {
    chunks.push(match[1]);
  }
  console.log(`Found ${chunks.length} chunks on login page.`);

  for (const c of chunks) {
    const fullUrl = c.startsWith('http') ? c : 'https://aptisacademy.com.vn' + c;
    try {
      const text = await (await fetch(fullUrl)).text();
      if (text.includes('mutateAsync') || text.includes('deviceFingerprint') || text.includes('rememberedEmail')) {
        console.log(`\n🎯 Target chunk: ${c}`);
        // Find URLs in this chunk
        const urlRegex = /["'](https?:\/\/[^"']+|\/api\/[^"']+)["']/g;
        let uMatch;
        const urls = new Set();
        while ((uMatch = urlRegex.exec(text)) !== null) {
          urls.add(uMatch[1]);
        }
        console.log('URLs in chunk:', Array.from(urls));
      }
    } catch (e) {
      console.error(e.message);
    }
  }
}

searchAuth().catch(console.error);
