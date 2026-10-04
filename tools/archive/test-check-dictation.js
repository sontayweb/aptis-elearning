import fs from 'node:fs';

async function checkDictation() {
  const code = await (await fetch('https://aptiskytich.vn/assets/Dictation-Zm6WU7PZ.js')).text();
  console.log('Dictation chunk length:', code.length);

  // Tìm các bảng hoặc endpoint trong Dictation
  const tables = [...code.matchAll(/\.from\(["']([^"']+)["']\)/g)].map(m => m[1]);
  console.log('Tables in Dictation:', Array.from(new Set(tables)));

  // Tìm URL mp3
  const mp3s = [...new Set(code.match(/https?:\/\/[^"'\s]+\.mp3/gi) || [])];
  console.log('MP3 in Dictation chunk:', mp3s.length);

  // Xem các endpoint khác
  const supabaseCalls = [...code.matchAll(/supabase\.[a-zA-Z0-9_.]+/g)].map(m => m[0]);
  console.log('Supabase calls in Dictation:', Array.from(new Set(supabaseCalls)));
}

checkDictation().catch(console.error);
