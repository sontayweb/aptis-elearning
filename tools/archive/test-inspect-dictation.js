import fs from 'node:fs';

async function inspectDictationRoute() {
  const dictCode = await (await fetch('https://aptiskytich.vn/assets/Dictation-Zm6WU7PZ.js')).text();

  // Tìm từ khóa setId hoặc useParams
  console.log('--- Tìm các từ khóa trong Dictation-Zm6WU7PZ.js ---');
  const keywords = ['dictation_sets', 'dictation_sentences', 'setId', 'foundation', 'momentum', 'mastery', 'level'];
  for (const kw of keywords) {
    const idx = dictCode.indexOf(kw);
    if (idx !== -1) {
      console.log(`Từ khóa "${kw}" tại vị trí ${idx}:`);
      console.log(dictCode.substring(Math.max(0, idx - 100), Math.min(dictCode.length, idx + 200)));
      console.log('-------------------------');
    }
  }

  // Tìm các lời gọi rpc trong Dictation
  const rpcs = [...dictCode.matchAll(/\.rpc\(\s*["']([^"']+)["']/g)].map(m => m[1]);
  console.log('RPCs trong Dictation:', rpcs);
}

inspectDictationRoute().catch(console.error);
