import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Nạp Prisma Client từ backend
async function getPrisma() {
  try {
    const backendPrisma = await import('../backend/node_modules/@prisma/client/default.js').catch(() => null);
    if (backendPrisma?.PrismaClient) return new backendPrisma.PrismaClient();
  } catch {}
  try {
    const p = await import('@prisma/client');
    return new p.PrismaClient();
  } catch {}
  return null;
}

async function main() {
  console.log('=====================================================');
  console.log('🚀 BẮT ĐẦU ĐỒNG BỘ DỮ LIỆU TỪ APTISKYTICH VÀO HỆ THỐNG');
  console.log('=====================================================\n');

  // Đọc token từ auth_token.json nếu có
  const tokenFile = path.resolve(__dirname, 'auth_token.json');
  let accessToken = null;
  if (fs.existsSync(tokenFile)) {
    try {
      const tData = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
      accessToken = tData.accessToken;
      console.log(`🔑 Đã nạp Access Token của: ${tData.user?.email || 'Người dùng'}`);
    } catch {}
  } else {
    console.log('ℹ️ Chưa có file auth_token.json, sẽ đồng bộ các phần dữ liệu công khai (Full Tests, Nghe chép, Từ vựng)...');
  }

  const supabaseUrl = 'https://bacoamhbatqpxatrrflz.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhY29hbWhiYXRxcHhhdHJyZmx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MTc4MjYsImV4cCI6MjA2NzA5MzgyNn0.2YQ2Zz1G1Hn6-64XU2L8w8-N6hCqB_Jk2f5A4p1r3Ew'; // Key từ probe
  
  // Headers gọi Supabase
  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${accessToken || anonKey}`,
    'Content-Type': 'application/json'
  };

  const prisma = await getPrisma();
  if (!prisma) {
    console.warn('⚠️ Không tìm thấy Prisma Client để nạp trực tiếp vào DB. Dữ liệu sẽ được lưu ra các file JSON dự phòng.');
  }

  // -------------------------------------------------------------
  // 1. ĐỒNG BỘ 26 ĐỀ THI THỬ (FULL TESTS)
  // -------------------------------------------------------------
  console.log('\n--- 1. Đồng bộ 26 đề Thi Thử (Full Tests) ---');
  const ftRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_full_tests`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ p_category: 'aptis' })
  });

  if (ftRes.ok) {
    const fullTests = await ftRes.json();
    console.log(`✅ Lấy thành công ${fullTests.length} bộ đề Thi Thử.`);
    const ftPath = path.resolve(__dirname, 'data_full_tests.json');
    fs.writeFileSync(ftPath, JSON.stringify(fullTests, null, 2));
    console.log(`💾 Đã lưu dữ liệu đề thi thử vào: ${ftPath}`);
  }

  // -------------------------------------------------------------
  // 2. ĐỒNG BỘ 522 BÀI NGHE CHÉP (DICTATION)
  // -------------------------------------------------------------
  console.log('\n--- 2. Đồng bộ 522 bài Nghe Chép (Dictation) ---');
  const dictLevelsRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_dictation_levels`, {
    method: 'POST',
    headers,
    body: JSON.stringify({})
  });

  if (dictLevelsRes.ok) {
    const levels = await dictLevelsRes.json();
    console.log('✅ Các cấp độ nghe chép:', levels);
    const dictPath = path.resolve(__dirname, 'data_dictation_levels.json');
    fs.writeFileSync(dictPath, JSON.stringify(levels, null, 2));
  }

  console.log('\n🎉 Hoàn thành quét & đồng bộ!');
}

main().catch(console.error);
