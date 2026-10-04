import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolsDir = __dirname;
const archiveDir = path.join(toolsDir, 'archive');

fs.mkdirSync(archiveDir, { recursive: true });

// Danh sách giữ lại ở tools/
const keepList = new Set([
  'core',
  'sources',
  'data',
  'archive',
  'node_modules',
  'package.json',
  'package-lock.json',
  'sync.js',
  'sync-all.bat',
  'README.md',
  'organize-archive.js'
]);

const items = fs.readdirSync(toolsDir);
let movedCount = 0;

for (const item of items) {
  if (keepList.has(item)) continue;

  const fullPath = path.join(toolsDir, item);
  const destPath = path.join(archiveDir, item);

  try {
    fs.renameSync(fullPath, destPath);
    movedCount++;
    console.log(`Moved: ${item} -> archive/`);
  } catch (err) {
    console.error(`Failed to move ${item}:`, err.message);
  }
}

console.log(`\nDone! Successfully archived ${movedCount} legacy/probe items.`);
