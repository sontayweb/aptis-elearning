import fs from 'node:fs';

async function checkPayloadKeys() {
  const root = JSON.parse(fs.readFileSync('tools/aptis-academy/bo-de-full.json', 'utf-8'));
  const payload = root.data.data;
  console.log('Keys of payload object:', Object.keys(payload));

  for (const k of Object.keys(payload)) {
    const val = payload[k];
    console.log(`- ${k}: ${Array.isArray(val) ? `Array [${val.length}]` : typeof val}`);
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      console.log(`    Subkeys of ${k}:`, Object.keys(val));
    }
  }
}

checkPayloadKeys().catch(console.error);
