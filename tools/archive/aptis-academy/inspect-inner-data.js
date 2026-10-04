import fs from 'node:fs';

async function checkDdata() {
  const root = JSON.parse(fs.readFileSync('tools/aptis-academy/bo-de-full.json', 'utf-8'));
  const payload = root.data.data;
  console.log('Payload success:', root.data.success);
  console.log('Payload message:', root.data.message);
  console.log('Payload type:', typeof payload, Array.isArray(payload) ? `Array length: ${payload.length}` : 'Object');

  if (Array.isArray(payload)) {
    console.log('Payload item 0 keys:', Object.keys(payload[0]));
    const skills = Object.keys(payload[0]);
    console.log('Skills available:', skills);

    for (const sk of ['speaking', 'writing', 'listening', 'reading']) {
      if (payload[0][sk]) {
        console.log(`\n📚 KỸ NĂNG: ${sk.toUpperCase()}`);
        for (const p of Object.keys(payload[0][sk])) {
          const arr = payload[0][sk][p] || [];
          console.log(`  - ${p}: ${arr.length} đề thi`);
        }
      }
    }
  }
}

checkDdata().catch(console.error);
