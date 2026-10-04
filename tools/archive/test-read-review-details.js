import fs from 'node:fs';

async function readReviewsDetails() {
  const code = await (await fetch('https://aptiskytich.vn/assets/Reviews-edO3TvDT.js')).text();

  // Tìm các câu query Supabase trong Reviews
  const selects = [...code.matchAll(/\.from\(["']([^"']+)["']\)\.select\(([^)]+)\)/g)];
  for (const s of selects) {
    console.log(`Query: ${s[1]} -> select(${s[2]})`);
  }

  // Tìm các văn bản tiếng Việt để hiểu chức năng UI
  const viTexts = [...code.matchAll(/["']([^"']*(?:đề thi|phòng thi|chủ đề|chia sẻ|ngày thi|địa điểm|kinh nghiệm|tích đức)[^"']*)["']/gi)].map(m => m[1]);
  console.log('\nCác câu văn bản trên trang /reviews:');
  console.log(Array.from(new Set(viTexts)).slice(0, 15));
}

readReviewsDetails().catch(console.error);
