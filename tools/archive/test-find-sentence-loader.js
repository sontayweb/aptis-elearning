import fs from 'node:fs';

async function findSentenceLoader() {
  const dictCode = await (await fetch('https://aptiskytich.vn/assets/Dictation-Zm6WU7PZ.js')).text();

  // Tìm tất cả các RPC được gọi trong Dictation
  const allRpcs = [...dictCode.matchAll(/\.rpc\(\s*["']([^"']+)["']\s*(?:,\s*(\{[^}]+\}))?/g)];
  console.log('Tất cả RPC calls trong Dictation:');
  for (const m of allRpcs) {
    console.log(`- ${m[1]} với args: ${m[2]}`);
  }

  // Tìm từ khóa dictation_sentences hoặc audio_url hoặc text
  const sentenceIndex = dictCode.indexOf('dictation_sentences');
  if (sentenceIndex !== -1) {
    console.log('\nTìm thấy dictation_sentences:');
    console.log(dictCode.substring(sentenceIndex - 100, sentenceIndex + 300));
  } else {
    console.log('Không có từ dictation_sentences trong file này');
  }

  // Tương tự kiểm tra Vocabulary xem họ load words như thế nào
  console.log('\n--- Kiểm tra chi tiết Vocabulary RPCs hoặc queries ---');
  const vocabCode = await (await fetch('https://aptiskytich.vn/assets/VocabStudy-6pXuqV4u.js')).text();
  const vRpcs = [...vocabCode.matchAll(/\.rpc\(\s*["']([^"']+)["']\s*(?:,\s*(\{[^}]+\}))?/g)];
  console.log('Tất cả RPC calls trong VocabStudy:');
  for (const m of vRpcs) {
    console.log(`- ${m[1]} với args: ${m[2]}`);
  }

  const vDetailCode = await (await fetch('https://aptiskytich.vn/assets/VocabListDetail-CJ2pxyBV.js')).text();
  const vdRpcs = [...vDetailCode.matchAll(/\.rpc\(\s*["']([^"']+)["']\s*(?:,\s*(\{[^}]+\}))?/g)];
  console.log('Tất cả RPC calls trong VocabListDetail:');
  for (const m of vdRpcs) {
    console.log(`- ${m[1]} với args: ${m[2]}`);
  }
}

findSentenceLoader().catch(console.error);
