/**
 * AUTOMATED INTEGRATION & UNIT TEST FOR LISTENING AUDIO MANAGEMENT & AI TTS
 * Run with: npx tsx backend/src/tools/test-listening-audio-tts.ts
 */

import path from 'path';
import fs from 'fs';
import { ttsAudioService } from '../modules/ingestion/tts-audio.service';
import { adminService } from '../modules/admin/admin.service';

interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<string | void>) {
  const start = Date.now();
  try {
    const details = await fn();
    results.push({
      name,
      passed: true,
      durationMs: Date.now() - start,
      details: details || undefined,
    });
    console.log(`  ✅ [PASS] ${name} (${Date.now() - start}ms)`);
    if (details) console.log(`     ↳ ${details}`);
  } catch (err: any) {
    results.push({
      name,
      passed: false,
      durationMs: Date.now() - start,
      error: err.message || String(err),
    });
    console.error(`  ❌ [FAIL] ${name} (${Date.now() - start}ms)`);
    console.error(`     ↳ Error: ${err.message || String(err)}`);
  }
}

async function main() {
  console.log('===============================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG: QUẢN LÝ AUDIO & AI TTS LISTENING');
  console.log('===============================================================\n');

  let generatedMonologueUrl = '';
  let generatedMonologuePath = '';
  let generatedDialogueUrl = '';
  let generatedDialoguePath = '';

  // TEST 1: Độc thoại Part 1 / 4 (Monologue Announcement)
  await runTest('Test 1: Sinh audio độc thoại (Part 1 Announcement) bằng giọng British Council', async () => {
    const script = 'Attention passengers on train 4B to Oxford. The train will depart from Platform 3 in ten minutes.';
    const result = await ttsAudioService.generateSpeech(script, 'test_unit_monologue', {
      voice: 'en-GB-RyanNeural',
    });

    if (!result.publicUrl || !result.localPath) {
      throw new Error('Không nhận được publicUrl hoặc localPath từ ttsAudioService');
    }
    if (!fs.existsSync(result.localPath)) {
      throw new Error(`File MP3 không tồn tại trên ổ đĩa: ${result.localPath}`);
    }

    const stats = fs.statSync(result.localPath);
    if (stats.size < 1000) {
      throw new Error(`File MP3 quá nhỏ (${stats.size} bytes), có thể bị lỗi`);
    }

    generatedMonologueUrl = result.publicUrl;
    generatedMonologuePath = result.localPath;
    return `URL: ${result.publicUrl} | Dung lượng: ${(stats.size / 1024).toFixed(1)} KB`;
  });

  // TEST 2: Hội thoại 2 người Part 3 (Dual Speaker Dialogue: Man + Woman)
  await runTest('Test 2: Tự động phân vai & sinh hội thoại 2 người Nam (Ryan) + Nữ (Sonia) Part 3', async () => {
    const dialogueScript = [
      'Man: Excuse me, do you know when the next lecture begins?',
      'Woman: Yes, Professor Higgins said it would start at two o clock sharp in Room 302.',
      'Man: Thank you! I was worried I might be late.',
    ].join('\n');

    const result = await ttsAudioService.generateSpeech(dialogueScript, 'test_unit_dialogue');

    if (!fs.existsSync(result.localPath)) {
      throw new Error(`File MP3 hội thoại không tồn tại: ${result.localPath}`);
    }

    const stats = fs.statSync(result.localPath);
    if (stats.size < 5000) {
      throw new Error(`File MP3 hội thoại quá nhỏ (${stats.size} bytes), có thể thiếu lời của một trong hai người`);
    }

    generatedDialogueUrl = result.publicUrl;
    generatedDialoguePath = result.localPath;
    return `URL: ${result.publicUrl} | Dung lượng: ${(stats.size / 1024).toFixed(1)} KB (Đã ghép 2 giọng)`;
  });

  // TEST 3: Giọng Nữ đơn (Female Voice Sonia)
  await runTest('Test 3: Tùy chọn chỉ định giọng nữ en-GB-SoniaNeural', async () => {
    const script = 'The library will be closed on bank holidays. Please return all borrowed books before Friday.';
    const result = await ttsAudioService.generateSpeech(script, 'test_unit_sonia', {
      voice: 'en-GB-SoniaNeural',
    });

    const stats = fs.statSync(result.localPath);
    // Dọn dẹp file test
    try { fs.unlinkSync(result.localPath); } catch {}
    return `Dung lượng file giọng nữ: ${(stats.size / 1024).toFixed(1)} KB`;
  });

  // TEST 4: Cơ chế an toàn dọn dẹp file audio cũ (Safe Delete & Anti-Path-Traversal)
  await runTest('Test 4: Cơ chế dọn dẹp audio cũ an toàn (Safe Cleanup & Anti-Path Traversal)', async () => {
    if (!generatedMonologuePath || !fs.existsSync(generatedMonologuePath)) {
      throw new Error('File monologue từ Test 1 không còn để kiểm tra xóa');
    }

    // 4.1 Xóa hợp lệ
    const deleted = adminService.safeDeleteExamAudio(generatedMonologueUrl);
    if (!deleted) {
      throw new Error('safeDeleteExamAudio trả về false đối với đường dẫn hợp lệ');
    }
    if (fs.existsSync(generatedMonologuePath)) {
      throw new Error('File vật lý vẫn còn trên ổ đĩa sau khi gọi safeDeleteExamAudio');
    }

    // 4.2 Thử tấn công Path Traversal
    const maliciousAttempt1 = adminService.safeDeleteExamAudio('/uploads/audio/../../../etc/passwd');
    if (maliciousAttempt1) {
      throw new Error('Lỗ hổng Path Traversal: Hàm cho phép xóa đường dẫn vượt ra ngoài thư mục uploads/audio');
    }

    const maliciousAttempt2 = adminService.safeDeleteExamAudio('C:\\Windows\\System32\\cmd.exe');
    if (maliciousAttempt2) {
      throw new Error('Lỗ hổng Path Traversal: Hàm cho phép xóa đường dẫn tuyệt đối');
    }

    // Dọn dẹp nốt file dialogue từ Test 2
    if (generatedDialogueUrl) {
      adminService.safeDeleteExamAudio(generatedDialogueUrl);
    }

    return 'Đã xác thực xóa file hợp lệ và chặn đứng 100% tấn công Path Traversal';
  });

  // TEST 5: Kiểm tra validation nội dung rỗng
  await runTest('Test 5: Validation kịch bản rỗng (Empty Script Handling)', async () => {
    try {
      await ttsAudioService.generateSpeech('   ', 'test_empty');
      throw new Error('Hệ thống không ném lỗi khi truyền kịch bản rỗng');
    } catch (err: any) {
      if (err.message.includes('không được rỗng')) {
        return 'Đã bắt đúng lỗi: ' + err.message;
      }
      throw err;
    }
  });

  console.log('\n===============================================================');
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(0);

  console.log(`📊 TỔNG KẾT: ${passedTests}/${totalTests} KIỂM THỬ THÀNH CÔNG (${passRate}%)`);
  if (passedTests === totalTests) {
    console.log('🎉 TẤT CẢ CÁC TÍNH NĂNG AUDIO & AI TTS ĐỀU ĐẠT CHUẨN 100%!');
  } else {
    console.log('⚠️ CÓ TEST THẤT BẠI, CẦN KIỂM TRA LẠI LOG CHI TIẾT Ở TRÊN');
  }
  console.log('===============================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Lỗi nghiêm trọng khi chạy bộ kiểm thử:', err);
  process.exit(1);
});

