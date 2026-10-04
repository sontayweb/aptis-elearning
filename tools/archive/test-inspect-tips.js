import fs from 'node:fs';

async function inspectTipsBlog() {
  console.log('🔍 Đang kiểm tra mục Mẹo thi Aptis: https://aptiskytich.vn/meo-thi-aptis ...');

  // Kiểm tra chunk Blog và BlogPost
  const blogCode = await (await fetch('https://aptiskytich.vn/assets/Blog-Dg3Qdf-2.js')).text();
  console.log(`- Dung lượng Blog chunk: ${(blogCode.length / 1024).toFixed(1)} KB`);

  const blogPostCode = await (await fetch('https://aptiskytich.vn/assets/BlogPost-Cs9RhLU8.js')).text();
  console.log(`- Dung lượng BlogPost chunk: ${(blogPostCode.length / 1024).toFixed(1)} KB`);

  // Tìm các bảng Supabase nếu có
  const blogTables = [...blogCode.matchAll(/\.from\(["']([^"']+)["']\)/g)].map(m => m[1]);
  console.log('- Tables trong Blog chunk:', Array.from(new Set(blogTables)));

  // Tìm các đường dẫn bài viết hoặc danh sách bài viết tĩnh
  const slugMatches = [...blogCode.matchAll(/["'](\/meo-thi-aptis\/[^"']+)["']/g)].map(m => m[1]);
  console.log('- Các bài viết tips tìm thấy trong Blog:', Array.from(new Set(slugMatches)));

  // Tìm các bài viết trong BlogPost chunk
  const postSlugs = [...blogPostCode.matchAll(/["'](\/meo-thi-aptis\/[^"']+)["']/g)].map(m => m[1]);
  console.log('- Các bài viết trong BlogPost chunk:', Array.from(new Set(postSlugs)));

  // Kiểm tra xem dữ liệu bài viết có được hardcode sẵn trong file JS hay nằm trong Supabase
  const sampleArticleMatch = blogCode.match(/title:\s*["']([^"']+)["']/g);
  console.log('- Tiêu đề bài viết trong Blog chunk:', sampleArticleMatch ? sampleArticleMatch.slice(0, 10) : 'None');

  // Thử kiểm tra bảng blog_posts trên Supabase
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  const testTables = ['blog_posts', 'articles', 'tips', 'posts'];
  for (const tbl of testTables) {
    const r = await fetch(`${supabaseUrl}/rest/v1/${tbl}?select=*`, {
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
    });
    console.log(`Bảng '${tbl}': HTTP ${r.status}`);
    if (r.ok) {
      const data = await r.json();
      console.log(`  -> Số lượng bài viết: ${data.length}`);
      if (data.length > 0) {
        console.log(`  -> Mẫu bài viết 1:`, Object.keys(data[0]));
        fs.writeFileSync(`tools/data-${tbl}.json`, JSON.stringify(data, null, 2));
      }
    }
  }

  // Tải nội dung HTML trang meo-thi-aptis
  try {
    const pageHtml = await (await fetch('https://aptiskytich.vn/meo-thi-aptis')).text();
    console.log(`- HTML meo-thi-aptis: ${pageHtml.length} bytes`);
  } catch {}
}

inspectTipsBlog().catch(console.error);
