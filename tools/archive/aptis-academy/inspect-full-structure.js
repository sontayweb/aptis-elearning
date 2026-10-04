import fs from 'node:fs';

async function checkBoDeFullStructure() {
  const data = JSON.parse(fs.readFileSync('tools/aptis-academy/bo-de-full.json', 'utf-8'));
  console.log('Các keys ở root của bo-de.json:', Object.keys(data));

  if (data.status) console.log('Status:', data.status);
  if (data.message) console.log('Message:', data.message);

  let meta = null;
  if (Array.isArray(data.metadata)) meta = data.metadata[0];
  else if (data.metadata) meta = data.metadata;
  else if (data.data) meta = data.data;

  if (meta) {
    console.log('\nCác kỹ năng trong metadata:');
    for (const skill of ['listening', 'reading', 'writing', 'speaking']) {
      if (meta[skill]) {
        console.log(`\n📚 KỸ NĂNG: ${skill.toUpperCase()}`);
        for (const p of Object.keys(meta[skill])) {
          const arr = meta[skill][p] || [];
          let audioCount = 0;
          let optionsCount = 0;
          let answerCount = 0;

          arr.forEach(item => {
            const q = item.questions?.[0] || item.data?.questions || item;
            if (q.file || item.file) audioCount++;
            if (q.answerList?.length > 0) optionsCount++;
            if (q.correctAnswer || item.correctAnswer) answerCount++;
          });

          console.log(`  - ${p}: ${arr.length} đề thi (Có Audio: ${audioCount}, Có Options: ${optionsCount}, Có Đáp án: ${answerCount})`);
        }
      }
    }
  }
}

checkBoDeFullStructure().catch(console.error);
