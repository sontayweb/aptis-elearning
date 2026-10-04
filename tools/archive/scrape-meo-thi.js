import fs from 'node:fs';

async function fetchAllBlogPosts() {
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  console.log('🚀 Đang cào toàn bộ bài viết Mẹo thi Aptis từ blog_posts...');

  const res = await fetch(`${supabaseUrl}/rest/v1/blog_posts?status=eq.published&order=published_at.desc`, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  });

  console.log('HTTP Status:', res.status);
  if (res.ok) {
    const posts = await res.json();
    console.log(`🎉🎉 CÀO THÀNH CÔNG ${posts.length} BÀI VIẾT MẸO THI APTIS!`);
    
    // In danh sách các bài viết
    console.log('\n--- DANH SÁCH BÀI VIẾT CÀO ĐƯỢC ---');
    posts.forEach((p, idx) => {
      console.log(`[${idx + 1}] ${p.title}`);
      console.log(`    - Slug: /meo-thi-aptis/${p.slug}`);
      console.log(`    - Chuyên mục: ${p.category}`);
      console.log(`    - Độ dài nội dung: ${p.content ? p.content.length : 0} ký tự`);
      console.log(`    - Ảnh cover: ${p.cover_image_url || 'Không'}`);
    });

    // Lưu toàn bộ dữ liệu ra file JSON
    const outFile = 'tools/all-meo-thi-aptis-posts.json';
    fs.writeFileSync(outFile, JSON.stringify(posts, null, 2), 'utf-8');
    console.log(`\n💾 ĐÃ LƯU TOÀN BỘ ${posts.length} BÀI VIẾT (FULL NỘI DUNG MARKDOWN/HTML) VÀO: ${outFile}`);

    // Lưu từng bài thành file markdown riêng biệt để dễ đọc
    const blogDir = 'tools/scraped_articles';
    fs.mkdirSync(blogDir, { recursive: true });
    posts.forEach(p => {
      const mdContent = `---
title: "${p.title}"
slug: "${p.slug}"
category: "${p.category}"
published_at: "${p.published_at}"
cover_image: "${p.cover_image_url || ''}"
seo_title: "${p.seo_title || ''}"
seo_description: "${p.seo_description || ''}"
tags: ${JSON.stringify(p.tags || [])}
---

${p.content || ''}
`;
      fs.writeFileSync(`${blogDir}/${p.slug}.md`, mdContent, 'utf-8');
    });
    console.log(`📁 Đã xuất từng bài viết thành các file Markdown tại: ${blogDir}/`);
  } else {
    console.log('Lỗi query:', await res.text());
  }
}

fetchAllBlogPosts().catch(console.error);
