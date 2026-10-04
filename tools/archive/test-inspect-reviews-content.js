import fs from 'node:fs';

async function inspectReviewsContent() {
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  console.log('🔍 Kiểm tra bảng exam_reviews & exam_review_items trên Supabase...');
  for (const tbl of ['exam_reviews', 'exam_review_items']) {
    const r = await fetch(`${supabaseUrl}/rest/v1/${tbl}?select=*&limit=5`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });

    console.log(`Table '${tbl}': HTTP ${r.status}`);
    if (r.ok) {
      const data = await r.json();
      console.log(`  -> Số lượng mẫu: ${data.length}`);
      if (data.length > 0) {
        console.log(`  -> Cấu trúc 1 review:`, JSON.stringify(data[0], null, 2));
        fs.writeFileSync(`tools/sample-${tbl}.json`, JSON.stringify(data, null, 2));
      }
    }
  }

  // Đếm tổng số review
  const countRes = await fetch(`${supabaseUrl}/rest/v1/exam_reviews?select=id,exam_date,test_location,created_at`, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  });
  if (countRes.ok) {
    const allReviews = await countRes.json();
    console.log(`\n🎉 TỔNG SỐ BÀI REVIEW THI THẬT TRÊN HỆ THỐNG: ${allReviews.length} bài!`);
    console.log('Mẫu các bài gần nhất:', allReviews.slice(0, 3));
  }
}

inspectReviewsContent().catch(console.error);
