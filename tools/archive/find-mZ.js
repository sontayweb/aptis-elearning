async function main() {
  const html = await (await fetch('https://aptisacademy.com.vn/bo-de-key/listening/1')).text();
  const scriptRegex = /src=["']([^"']+\.js)["']/g;
  let match;
  const chunks = [];
  while ((match = scriptRegex.exec(html)) !== null) {
    chunks.push(match[1]);
  }

  for (const c of chunks) {
    const full = c.startsWith('http') ? c : 'https://aptisacademy.com.vn' + c;
    try {
      const text = await (await fetch(full)).text();
      if (text.includes('mZ:') || text.includes('eT=') || text.includes('eT:')) {
        console.log(`Found in ${c}`);
        const idx = text.indexOf('mZ:');
        if (idx !== -1) {
          console.log(text.slice(Math.max(0, idx - 200), idx + 600));
        } else {
          const idx2 = text.indexOf('eT:');
          console.log(text.slice(Math.max(0, idx2 - 200), idx2 + 600));
        }
      }
    } catch {}
  }
}

main().catch(console.error);
