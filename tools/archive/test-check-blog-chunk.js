import fs from 'node:fs';

async function checkBlogPostDetails() {
  const code = await (await fetch('https://aptiskytich.vn/assets/BlogPost-Cs9RhLU8.js')).text();
  console.log(`- Dung lượng BlogPost chunk: ${(code.length / 1024).toFixed(1)} KB`);

  // Tìm các tiêu đề h1, h2, title trong BlogPost
  const titles = [...code.matchAll(/title:\s*["']([^"']+)["']/g)].map(m => m[1]);
  console.log('- Titles in BlogPost:', titles);

  // Tìm các slug
  const slugs = [...code.matchAll(/slug:\s*["']([^"']+)["']/g)].map(m => m[1]);
  console.log('- Slugs in BlogPost:', slugs);

  // Tìm các bài viết hardcoded
  const posts = [...code.matchAll(/slug:\s*["']([^"']+)["'],\s*title:\s*["']([^"']+)["']/g)];
  console.log('- Bài viết tìm thấy:', posts.map(p => ({ slug: p[1], title: p[2] })));

  // In 3000 ký tự đầu của BlogPost
  console.log('\n--- 3000 ký tự đầu BlogPost ---');
  console.log(code.substring(0, 3000));

  fs.writeFileSync('tools/sample-blog-chunk.js', code);
}

checkBlogPostDetails().catch(console.error);
