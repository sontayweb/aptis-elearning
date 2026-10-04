import fs from 'node:fs';

async function inspectBoDeFree() {
  const data = JSON.parse(fs.readFileSync('tools/aptis-academy/bo-de-free.json', 'utf-8'));
  console.log(`Số gói dữ liệu trong bo-de-free.json: ${data.length}`);

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    console.log(`\n--- Gói ${i + 1} ---`);
    console.log(`Message: ${item.message}`);
    console.log(`Count: ${item.count}`);

    if (item.metadata && item.metadata.length > 0) {
      const skills = Object.keys(item.metadata[0]);
      console.log(`Các kỹ năng trong metadata:`, skills);

      for (const skill of skills) {
        const parts = item.metadata[0][skill];
        if (typeof parts === 'object') {
          console.log(`  + Kỹ năng ${skill.toUpperCase()}:`, Object.keys(parts));
          for (const p of Object.keys(parts)) {
            const arr = parts[p];
            console.log(`     - ${p}: ${arr.length} đề thi / câu hỏi`);
            if (arr.length > 0) {
              console.log(`       * Đề mẫu: "${arr[0].title || arr[0].topic || 'Không có tên'}" (ID: ${arr[0]._id})`);
            }
          }
        }
      }
    }
  }

  // Kiểm tra listing-summary.json
  console.log('\n=====================================================');
  console.log('--- NỘI DUNG listing-summary.json ---');
  const summary = JSON.parse(fs.readFileSync('tools/aptis-academy/listing-summary.json', 'utf-8'));
  console.log(JSON.stringify(summary, null, 2));
}

inspectBoDeFree().catch(console.error);
