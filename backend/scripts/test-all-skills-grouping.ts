import fs from 'fs';
import path from 'path';
import { prisma } from '../src/config/database';

async function main() {
  const catalogPath = path.resolve(__dirname, '../../tools/data/aptiskytich/exam_sets_catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  // 1. Kiểm tra LISTENING
  const listening = catalog.filter((c: any) => c.skill === 'listening');
  const listByDe: Record<number, any[]> = {};
  listening.forEach((s: any) => {
    const m = s.title.match(/^Đề\s+(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!listByDe[n]) listByDe[n] = [];
      listByDe[n].push(s);
    }
  });
  const listNums = Object.keys(listByDe).map(Number).sort((a,b) => a - b);
  console.log(`Listening: Tìm thấy ${listNums.length} đề (từ Đề ${listNums[0]} đến Đề ${listNums[listNums.length - 1]})`);

  // 2. Kiểm tra SPEAKING
  const speaking = catalog.filter((c: any) => c.skill === 'speaking');
  const speakByDe: Record<number, any[]> = {};
  speaking.forEach((s: any) => {
    const m = s.title.match(/^Đề\s+(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!speakByDe[n]) speakByDe[n] = [];
      speakByDe[n].push(s);
    }
  });
  const speakNums = Object.keys(speakByDe).map(Number).sort((a,b) => a - b);
  console.log(`Speaking: Tìm thấy ${speakNums.length} đề (từ Đề ${speakNums[0]} đến Đề ${speakNums[speakNums.length - 1]})`);

  // 3. Kiểm tra WRITING
  const writing = catalog.filter((c: any) => c.skill === 'writing');
  const writeByClub: Record<string, any[]> = {};
  writing.forEach((s: any) => {
    const m = s.title.match(/^(.*?)\s*-\s*Writing Part\s*(\d+)/i);
    const club = m ? m[1].trim() : s.title.trim();
    if (!writeByClub[club]) writeByClub[club] = [];
    writeByClub[club].push(s);
  });
  const clubs = Object.keys(writeByClub).sort();
  console.log(`Writing: Tìm thấy ${clubs.length} Câu lạc bộ CLB:`);
  clubs.slice(0, 10).forEach((c, i) => console.log(`  ${i+1}. ${c} (${writeByClub[c].length} parts)`));
}

main().finally(() => prisma.$disconnect());
