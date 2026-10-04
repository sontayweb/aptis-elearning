import fs from 'node:fs';

async function checkDataProp() {
  const root = JSON.parse(fs.readFileSync('tools/aptis-academy/bo-de-full.json', 'utf-8'));
  const d = root.data;
  console.log('Type of data:', typeof d, Array.isArray(d) ? `Array length: ${d.length}` : 'Object');
  if (Array.isArray(d)) {
    console.log('Sample item 0:', Object.keys(d[0]));
    if (d[0].metadata) {
      console.log('Metadata keys in item 0:', Object.keys(d[0].metadata[0] || {}));
    }
  } else {
    console.log('Object keys of data:', Object.keys(d));
  }
}

checkDataProp().catch(console.error);
