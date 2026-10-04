import fs from 'node:fs';

async function checkRpc() {
  const text = await (await fetch('https://aptiskytich.vn/assets/useExamSets-y-ZrLnO3.js')).text();
  console.log('--- Đọc kỹ đoạn sau c.rpc trong useExamSets ---');
  const rpcIdx = text.indexOf('c.rpc');
  if (rpcIdx !== -1) {
    console.log(text.substring(rpcIdx - 100, rpcIdx + 800));
  } else {
    console.log('Không thấy c.rpc');
  }

  // Tìm tất cả các c.rpc trong code
  const rpcMatches = [...text.matchAll(/c\.rpc\(\s*["']([^"']+)["']/g)].map(m => m[1]);
  console.log('Các RPC function:', rpcMatches);

  // Thử kiểm tra các file khác như SkillPractice, FullTest xem họ load câu hỏi thế nào
  const skillPracticeCode = await (await fetch('https://aptiskytich.vn/assets/SkillPractice-BY8Xj3g1.js')).text();
  const rpcInSkill = [...skillPracticeCode.matchAll(/\.rpc\(\s*["']([^"']+)["']/g)].map(m => m[1]);
  console.log('RPC trong SkillPractice:', rpcInSkill);

  const fullPracticeEngine = await (await fetch('https://aptiskytich.vn/assets/SkillFullPracticeEngine-BRQRo_qR.js')).text();
  const rpcInEngine = [...fullPracticeEngine.matchAll(/\.rpc\(\s*["']([^"']+)["']/g)].map(m => m[1]);
  console.log('RPC trong SkillFullPracticeEngine:', rpcInEngine);
}

checkRpc().catch(console.error);
