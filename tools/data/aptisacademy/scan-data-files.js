import fs from 'node:fs';

async function scanDataEndpoints() {
  console.log('🚀 BẮT ĐẦU QUÉT KHO DATA NGUYÊN BẢN TRÊN APTIS ACADEMY...');

  const endpoints = [
    'https://aptisacademy.com.vn/data/exams/listing-summary.json',
    'https://aptisacademy.com.vn/data/bo-de-free.json',
    'https://aptisacademy.com.vn/data/bo-de-key.json',
    'https://aptisacademy.com.vn/data/tu-vung.json',
    'https://aptisacademy.com.vn/data/practice-test.json',
    'https://aptisacademy.com.vn/data/document.json',
    'https://aptisacademy.com.vn/data/documents.json',
    'https://aptisacademy.com.vn/data/review-exam.json'
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      console.log(`- ${url}: HTTP ${res.status}`);
      if (res.ok) {
        const text = await res.text();
        console.log(`  🎉 TẢI THÀNH CÔNG! Dung lượng: ${(text.length / 1024).toFixed(1)} KB`);
        const fileName = url.split('/').pop();
        fs.writeFileSync(`tools/aptis-academy/${fileName}`, text, 'utf-8');

        // Phân tích sơ bộ nội dung
        try {
          const json = JSON.parse(text);
          if (Array.isArray(json)) {
            console.log(`  + Số phần tử: ${json.length}`);
            if (json.length > 0) {
              console.log(`  + Mẫu phần tử 1:`, Object.keys(json[0]));
            }
          } else if (typeof json === 'object') {
            console.log(`  + Các trường chính:`, Object.keys(json));
          }
        } catch {}
      }
    } catch (e) {
      console.log(`  Lỗi: ${e.message}`);
    }
  }
}

scanDataEndpoints().catch(console.error);
