import fs from 'node:fs';

async function probe() {
  console.log('🔍 Bắt đầu kiểm tra cấu trúc & API của aptiskytich.vn...');
  const res = await fetch('https://aptiskytich.vn/');
  const html = await res.text();
  console.log(`- Độ dài HTML: ${html.length} bytes`);

  // Tìm bundle js
  const matches = [...html.matchAll(/src=["'](\/assets\/[^"']+\.js)["']/g)].map(m => m[1]);
  console.log('- Bundle JS tìm thấy:', matches);

  if (matches.length > 0) {
    const jsUrl = `https://aptiskytich.vn${matches[0]}`;
    console.log(`- Đang tải bundle: ${jsUrl}...`);
    const jsRes = await fetch(jsUrl);
    const jsCode = await jsRes.text();
    console.log(`- Bundle JS size: ${(jsCode.length / 1024).toFixed(1)} KB`);

    // Tìm supabase URL & key
    const supabaseUrlMatch = jsCode.match(/https:\/\/[a-z0-9]+\.supabase\.co/);
    console.log('- Supabase URL:', supabaseUrlMatch ? supabaseUrlMatch[0] : 'None');

    // Tìm supabase anon key (thường là JWT eyJ...)
    const anonKeyMatches = jsCode.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g);
    console.log('- Supabase Keys found:', anonKeyMatches ? anonKeyMatches.length : 0);
    if (anonKeyMatches && anonKeyMatches.length > 0) {
      console.log('  Key sample:', anonKeyMatches[0].substring(0, 30) + '...');
    }

    // Tìm routes hoặc endpoint tables
    const tableMatches = new Set();
    const fromMatches = jsCode.matchAll(/\.from\(\s*["']([a-zA-Z0-9_-]+)["']\s*\)/g);
    for (const m of fromMatches) {
      tableMatches.add(m[1]);
    }
    console.log('- Supabase tables referenced:', Array.from(tableMatches));

    // Tìm các route paths
    const routeMatches = new Set();
    const rMatches = jsCode.matchAll(/path:\s*["'](\/[a-zA-Z0-9_\-\/:*]+)["']/g);
    for (const m of rMatches) {
      routeMatches.add(m[1]);
    }
    console.log('- Routes referenced:', Array.from(routeMatches).slice(0, 20));

    // Save info
    fs.writeFileSync('tools/probe-results.json', JSON.stringify({
      supabaseUrl: supabaseUrlMatch ? supabaseUrlMatch[0] : null,
      anonKey: anonKeyMatches ? anonKeyMatches[0] : null,
      tables: Array.from(tableMatches),
      routes: Array.from(routeMatches)
    }, null, 2));
  }
}

probe().catch(console.error);
