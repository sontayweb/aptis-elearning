import fs from 'node:fs';

async function checkIsPro() {
  const code = await (await fetch('https://aptiskytich.vn/assets/useIsPro-iV1GPbhP.js')).text();
  console.log('useIsPro length:', code.length);
  console.log('--- Nội dung useIsPro ---');
  console.log(code);
}

checkIsPro().catch(console.error);
