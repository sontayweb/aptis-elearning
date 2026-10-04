import fs from 'node:fs';

async function probeAptisAcademy() {
  console.log('🔍 Đang kiểm tra cấu trúc trang https://aptisacademy.com.vn/ ...');
  try {
    const res = await fetch('https://aptisacademy.com.vn/');
    console.log('HTTP Status:', res.status);
    const html = await res.text();
    console.log(`Độ dài HTML: ${html.length} bytes`);

    // Kiểm tra title, meta
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    console.log('Tiêu đề web:', titleMatch ? titleMatch[1] : 'Không rõ');

    // Kiểm tra các script JS
    const scripts = [...html.matchAll(/src=["']([^"']+\.js[^"']*)["']/g)].map(m => m[1]);
    console.log('Scripts:', scripts.slice(0, 10));

    // Kiểm tra framework (WordPress, Nextjs, React/Vite, Laravel, v.v.)
    if (html.includes('wp-content')) console.log('👉 Nền tảng: WordPress');
    if (html.includes('__NEXT_DATA__')) console.log('👉 Nền tảng: Next.js');
    if (html.includes('supabase.co')) console.log('👉 Nền tảng: Supabase');
    if (html.includes('firebase')) console.log('👉 Nền tảng: Firebase');

    fs.writeFileSync('tools/aptisacademy_probe.html', html.substring(0, 5000));
  } catch (e) {
    console.error('Lỗi khi fetch:', e.message);
  }
}

probeAptisAcademy().catch(console.error);
