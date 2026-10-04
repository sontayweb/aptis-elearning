import fs from 'node:fs';

async function checkFullTestLogic() {
  const code = await (await fetch('https://aptiskytich.vn/assets/FullTest-DRw-Fm2z.js')).text();
  console.log('FullTest chunk size:', code.length);

  // In các hàm fetch trong FullTest
  const selects = [...code.matchAll(/\.from\([^)]+\)\.select\([^)]+\)/g)].map(m => m[0]);
  console.log('Selects trong FullTest:', selects);

  // Xem cách họ load 26 đề thi thử
  const rpcs = [...code.matchAll(/\.rpc\(\s*["']([^"']+)["']/g)].map(m => m[1]);
  console.log('RPCs trong FullTest:', rpcs);

  // In 1500 ký tự đầu của FullTest
  console.log('\n--- 1500 ký tự đầu FullTest ---');
  console.log(code.substring(0, 1500));
}

checkFullTestLogic().catch(console.error);
