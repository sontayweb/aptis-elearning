import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execAsync = util.promisify(exec);

interface SuiteResult {
  name: string;
  command: string;
  success: boolean;
  durationMs: number;
  output: string;
}

async function runMasterTest() {
  console.log('================================================================');
  console.log('🌟 MASTER TEST RUNNER: KIỂM THỬ TOÀN DIỆN 4 KỸ NĂNG & THI THỬ');
  console.log('================================================================\n');

  const toolsDir = path.resolve(__dirname);
  const suites = [
    { name: '1. Kỹ Năng ĐỌC (READING)', file: 'test-reading-skill.ts' },
    { name: '2. Kỹ Năng NÓI (SPEAKING & Media Images)', file: 'test-speaking-skill.ts' },
    { name: '3. Kỹ Năng NGHE (LISTENING & TTS Audio)', file: 'test-listening-skill.ts' },
    { name: '4. Kỹ Năng VIẾT (WRITING & Essays)', file: 'test-writing-skill.ts' },
    { name: '5. THI THỬ FULL TEST (End-to-End Room Flow)', file: 'test-e2e-full-flow.ts' },
  ];

  const results: SuiteResult[] = [];
  const startTotal = Date.now();

  for (const s of suites) {
    console.log(`⏳ Đang chạy: ${s.name}...`);
    const filePath = path.join(toolsDir, s.file);
    const cmd = `node ./node_modules/tsx/dist/cli.mjs "${filePath}"`;
    const t0 = Date.now();

    try {
      const { stdout } = await execAsync(cmd, { cwd: path.resolve(__dirname, '../../') });
      const duration = Date.now() - t0;
      console.log(`   ✅ HOÀN THÀNH (${duration}ms)`);
      results.push({
        name: s.name,
        command: s.file,
        success: true,
        durationMs: duration,
        output: stdout,
      });
    } catch (err: any) {
      const duration = Date.now() - t0;
      console.error(`   ❌ THẤT BẠI (${duration}ms)`);
      results.push({
        name: s.name,
        command: s.file,
        success: false,
        durationMs: duration,
        output: err.stdout || err.message,
      });
    }
  }

  const totalDuration = Date.now() - startTotal;

  console.log('\n================================================================');
  console.log('📊 BẢNG TỔNG KẾT KẾT QUẢ KIỂM THỬ TOÀN HỆ THỐNG');
  console.log('================================================================');
  console.log('| Phân hệ kiểm thử                               | Trạng thái | Thời gian |');
  console.log('| :--------------------------------------------- | :--------: | :-------: |');

  let allPassed = true;
  for (const r of results) {
    const statusText = r.success ? '✅ PASS' : '❌ FAIL';
    console.log(`| ${r.name.padEnd(46)} |  ${statusText}   |  ${(r.durationMs + 'ms').padEnd(7)} |`);
    if (!r.success) allPassed = false;
  }
  console.log('================================================================');
  console.log(`⏱️ Tổng thời gian chạy: ${(totalDuration / 1000).toFixed(2)}s`);

  if (allPassed) {
    console.log('🎉 TẤT CẢ 5 PHÂN HỆ ĐỀU ĐẠT CHUẨN 100%! HỆ THỐNG HOÀN TOÀN SẴN SÀNG.');
  } else {
    console.error('⚠️ Có phân hệ chưa đạt, vui lòng xem chi tiết log bên trên.');
    process.exit(1);
  }
}

runMasterTest();
