import fs from 'node:fs';

async function checkItems() {
  const root = JSON.parse(fs.readFileSync('tools/aptis-academy/bo-de-full.json', 'utf-8'));
  const items = root.data.data.items;
  console.log(`Số lượng items: ${items.length}`);
  console.log(`Item 0 keys:`, Object.keys(items[0]));
  console.log(`Item 0:`, JSON.stringify(items[0], null, 2).substring(0, 1500));
}

checkItems().catch(console.error);
