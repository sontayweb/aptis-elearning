import fs from 'node:fs';
import path from 'node:path';

async function exportArticles() {
  const netData = JSON.parse(fs.readFileSync('tools/meo-thi-network.json', 'utf-8'));
  const posts = netData[0]?.data || [];

  console.log(`=====================================================`);
  console.log(`📦 BẮT ĐẦU XUẤT ${posts.length} BÀI VIẾT MẸO THI APTIS`);
  console.log(`=====================================================\n`);

  const outDir = 'tools/scraped_meo_thi_aptis';
  fs.mkdirSync(outDir, { recursive: true });

  posts.forEach((p, idx) => {
    console.log(`[${idx + 1}/${posts.length}] Đang xuất: "${p.title}"...`);

    const mdContent = `# ${p.title}

> **Chuyên mục:** ${p.category || 'Mẹo thi'}  
> **Ngày đăng:** ${p.published_at || 'Mới nhất'}  
> **Ảnh đại diện:** ![Cover](${p.cover_image_url || ''})  
> **Đường dẫn gốc:** https://aptiskytich.vn/meo-thi-aptis/${p.slug}  

---

### Tóm tắt
${p.excerpt || ''}

---

### Nội dung chi tiết

${p.content || ''}
`;

    const fileName = `${idx + 1}_${p.slug}.md`;
    fs.writeFileSync(path.join(outDir, fileName), mdContent, 'utf-8');
  });

  // Lưu file JSON tổng hợp
  fs.writeFileSync('tools/meo_thi_aptis_all.json', JSON.stringify(posts, null, 2), 'utf-8');

  console.log(`\n🎉 HOÀN THÀNH XUẤT ${posts.length} BÀI VIẾT!`);
  console.log(`- Thư mục Markdown: ${outDir}/`);
  console.log(`- File JSON tổng: tools/meo_thi_aptis_all.json`);
}

exportArticles().catch(console.error);
