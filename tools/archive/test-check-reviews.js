import fs from 'node:fs';

async function checkReviewsPage() {
  console.log('🔍 Đang kiểm tra trang https://aptiskytich.vn/reviews qua chunk Reviews-edO3TvDT.js...');
  
  const code = await (await fetch('https://aptiskytich.vn/assets/Reviews-edO3TvDT.js')).text();
  console.log(`- Dung lượng chunk Reviews: ${(code.length / 1024).toFixed(1)} KB`);

  // Tìm tiêu đề, mô tả của trang
  const titles = [...code.matchAll(/title:\s*["']([^"']+)["']/g)].map(m => m[1]);
  console.log('- Titles in Reviews:', titles);

  const descs = [...code.matchAll(/description:\s*["']([^"']+)["']/g)].map(m => m[1]);
  console.log('- Descriptions in Reviews:', descs);

  // Tìm các bảng Supabase được query trong trang này
  const tables = [...code.matchAll(/\.from\(["']([^"']+)["']\)/g)].map(m => m[1]);
  console.log('- Tables queried in Reviews:', Array.from(new Set(tables)));

  // Tìm các component / chức năng chính (VD: form đánh giá, điểm số, feedback, ảnh chụp chứng chỉ)
  const keywords = ['rating', 'score', 'feedback', 'student', 'certificate', 'review', 'comment', 'approve'];
  const foundKeywords = keywords.filter(kw => code.toLowerCase().includes(kw));
  console.log('- Các từ khóa chức năng xuất hiện:', foundKeywords);

  // In 1500 ký tự đầu để xem tổng quan UI
  console.log('\n--- 1500 ký tự đầu ---');
  console.log(code.substring(0, 1500));
}

checkReviewsPage().catch(console.error);
