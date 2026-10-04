import fs from 'node:fs';

async function locateNe() {
  const code = await (await fetch('https://aptiskytich.vn/assets/SkillPractice-BY8Xj3g1.js')).text();

  const idx = code.indexOf('s.group_name');
  console.log('Context around s.group_name:');
  console.log(code.substring(Math.max(0, idx - 500), Math.min(code.length, idx + 100)));

  // Tìm các định nghĩa ne trước đó trong cùng scope
  const before = code.substring(0, idx);
  // tìm vị trí cuối cùng của "ne="
  const lastNeIdx = before.lastIndexOf('ne=');
  console.log('Vị trí cuối của ne=:', lastNeIdx);
  if (lastNeIdx !== -1) {
    console.log(code.substring(lastNeIdx - 50, lastNeIdx + 500));
  }
}

locateNe().catch(console.error);
