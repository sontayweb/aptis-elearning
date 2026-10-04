import fs from 'node:fs';

async function findNe() {
  const code = await (await fetch('https://aptiskytich.vn/assets/SkillPractice-BY8Xj3g1.js')).text();

  // Tìm định nghĩa của biến ne trong file
  const pos = code.indexOf(',ne=');
  const pos2 = code.indexOf('const ne=');
  const pos3 = code.indexOf('let ne=');
  const p = pos !== -1 ? pos : (pos2 !== -1 ? pos2 : pos3);

  if (p !== -1) {
    console.log('Định nghĩa của ne:');
    console.log(code.substring(p, p + 2000));
  } else {
    // Tìm các mảng chứa group_name
    const groupIdx = code.indexOf('group_name');
    console.log('Vị trí group_name:');
    console.log(code.substring(Math.max(0, groupIdx - 100), Math.min(code.length, groupIdx + 800)));
  }
}

findNe().catch(console.error);
