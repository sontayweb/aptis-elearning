import fs from 'node:fs';

async function checkSampleQuestions() {
  const data = JSON.parse(fs.readFileSync('tools/aptis-academy/bo-de-free.json', 'utf-8'));
  const meta = data[0].metadata[0];

  console.log('--- 1. MẪU SPEAKING PART 2 ---');
  console.log(JSON.stringify(meta.speaking.part2[0], null, 2));

  console.log('\n--- 2. MẪU WRITING PART 4 ---');
  console.log(JSON.stringify(meta.writing.part4[0], null, 2));

  console.log('\n--- 3. MẪU LISTENING PART 2 ---');
  console.log(JSON.stringify(meta.listening.part2[0], null, 2));

  console.log('\n--- 4. MẪU READING PART 2 ---');
  console.log(JSON.stringify(meta.reading.part2[0], null, 2));
}

checkSampleQuestions().catch(console.error);
