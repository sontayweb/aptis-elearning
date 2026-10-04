import fs from 'node:fs';

async function audit167Items() {
  const root = JSON.parse(fs.readFileSync('tools/aptis-academy/bo-de-full.json', 'utf-8'));
  const items = root.data.data.items;

  const skillCounts = {};
  let totalQuestionsCount = 0;
  let audioFiles = 0;

  items.forEach(item => {
    const sk = item.skill || 'UNKNOWN';
    skillCounts[sk] = (skillCounts[sk] || 0) + 1;
    (item.questions || []).forEach(q => {
      totalQuestionsCount++;
      if (q.file) audioFiles++;
    });
  });

  console.log('Tổng số đề thi trong bộ đầy đủ (bo-de-full.json):', items.length);
  console.log('Phân bố theo kỹ năng:', skillCounts);
  console.log('Tổng số khối câu hỏi:', totalQuestionsCount);
  console.log('Số file Audio tìm thấy:', audioFiles);
}

audit167Items().catch(console.error);
