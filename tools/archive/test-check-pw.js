import fs from 'node:fs';

async function checkPw() {
  const indexJs = await (await fetch('https://aptiskytich.vn/assets/index-55GF0-ql.js')).text();
  const pwIdx = indexJs.indexOf('Pw=');
  if (pwIdx !== -1) {
    console.log('Pw definition:');
    console.log(indexJs.substring(pwIdx - 50, pwIdx + 500));
  } else {
    // Thử regex
    const matches = [...indexJs.matchAll(/([a-zA-Z0-9_]+)\s*=\s*(?:lazy\([^)]+\)|React\.lazy\([^)]+\))/g)];
    for (const m of matches) {
      if (m[0].includes('Vocab') || m[0].includes('vocab')) {
        console.log('Lazy vocab component:', m[0]);
      }
    }
    // Xem chunk nào được import cho /vocabulary
    const vocabIdx = indexJs.indexOf('"/vocabulary"');
    console.log('Context around /vocabulary:');
    console.log(indexJs.substring(vocabIdx - 200, vocabIdx + 200));
  }
}

checkPw().catch(console.error);
