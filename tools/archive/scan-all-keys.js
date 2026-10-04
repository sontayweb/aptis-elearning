import fs from 'node:fs';
import path from 'node:path';

async function scanAllKeyExams() {
  const baseUrl = 'https://aptisacademy.com.vn';
  const centers = ['exams', 'exams_center_b'];
  const skills = ['listening', 'reading', 'speaking', 'writing'];
  const parts = ['part1', 'part2', 'part3', 'part4', 'part5'];

  const results = {};

  for (const center of centers) {
    results[center] = {};
    for (const skill of skills) {
      for (const part of parts) {
        const fileKey = `${skill}-${part}`;
        const url = `${baseUrl}/data/${center}/${fileKey}.json`;
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const count = Array.isArray(data) ? data.length : Object.keys(data).length;
            results[center][fileKey] = {
              status: 200,
              count,
              url
            };
            console.log(`✅ [${center}] ${fileKey}: ${count} đề thi! (${url})`);
          } else {
            // console.log(`❌ [${center}] ${fileKey}: ${res.status}`);
          }
        } catch (err) {
          console.error(`⚠️ Lỗi tải ${url}:`, err.message);
        }
      }
    }
  }

  console.log('\n=========================================');
  console.log('Tổng hợp các file bộ key tìm thấy:');
  console.log(JSON.stringify(results, null, 2));
}

scanAllKeyExams().catch(console.error);
