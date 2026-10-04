import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPrismaClient } from './core/db.js';
import { logger } from './core/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourcesDir = path.join(__dirname, 'sources');

function getAvailableSources() {
  const dirs = fs.readdirSync(sourcesDir, { withFileTypes: true });
  const sources = [];

  for (const d of dirs) {
    if (!d.isDirectory() || d.name.startsWith('_')) continue;
    const configPath = path.join(sourcesDir, d.name, 'config.json');
    const crawlerPath = path.join(sourcesDir, d.name, 'crawler.js');

    if (fs.existsSync(configPath) && fs.existsSync(crawlerPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        sources.push({
          id: d.name,
          displayName: config.displayName || d.name,
          baseUrl: config.baseUrl || '',
          dir: path.join(sourcesDir, d.name),
          crawlerPath
        });
      } catch {}
    }
  }

  return sources;
}

function printUsage() {
  console.log(`
========================================================================
📚 TRÌNH ĐỒNG BỘ ĐỀ THI APTIS ĐA NGUỒN (MULTI-SOURCE SYNC ENGINE)
========================================================================

Cách sử dụng:
  node sync.js [tùy chọn]

Tùy chọn:
  --source=<tên>    Chỉ định nguồn muốn cào (ví dụ: aptiskytich, aptisacademy, all)
  --db              Nạp kết quả chuẩn hóa trực tiếp vào Database PostgreSQL qua Prisma
  --media           Tải toàn bộ file Audio MP3 và ảnh về máy cục bộ
  --list            Liệt kê danh sách tất cả các website đang được cấu hình
  --help            Xem hướng dẫn này

Ví dụ:
  node sync.js --source=all                     # Cào tất cả các web đã đăng ký
  node sync.js --source=aptiskytich             # Chỉ cào Aptis Kỳ Tích
  node sync.js --source=aptisacademy --db       # Cào Aptis Academy và nạp vào DB
  node sync.js --source=aptisacademy --media    # Cào và tải file MP3 về máy
========================================================================
`);
}

async function main() {
  const args = process.argv.slice(2);
  const flags = {
    source: 'all',
    saveDb: false,
    downloadMedia: false,
    list: false,
    help: false
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') flags.help = true;
    else if (arg === '--list' || arg === '-l') flags.list = true;
    else if (arg === '--db') flags.saveDb = true;
    else if (arg === '--media') flags.downloadMedia = true;
    else if (arg.startsWith('--source=')) flags.source = arg.split('=')[1].trim();
  }

  if (flags.help) {
    printUsage();
    return;
  }

  const sources = getAvailableSources();

  if (flags.list) {
    console.log('\n📋 DANH SÁCH CÁC NGUỒN WEBSITE ĐANG QUẢN LÝ:');
    console.log('------------------------------------------------------------');
    sources.forEach((s, idx) => {
      console.log(`[${idx + 1}] ID: ${s.id.padEnd(16)} | Tên: ${s.displayName.padEnd(25)} | URL: ${s.baseUrl}`);
    });
    console.log('------------------------------------------------------------');
    console.log(`💡 Để thêm web mới, xem hướng dẫn tại: tools/sources/_template/README.md\n`);
    return;
  }

  const logFilePath = logger.initSession(`sync_${flags.source}`);

  let prisma = null;
  if (flags.saveDb) {
    console.log('🔌 Đang kết nối Prisma Client tới PostgreSQL...');
    prisma = await getPrismaClient();
  }

  const selectedSources = flags.source === 'all'
    ? sources
    : sources.filter(s => s.id.toLowerCase() === flags.source.toLowerCase());

  if (selectedSources.length === 0) {
    console.error(`\n❌ Không tìm thấy nguồn "${flags.source}".`);
    console.log('👉 Các nguồn hiện có: ' + sources.map(s => s.id).join(', '));
    logger.closeSession();
    return;
  }

  console.log('\n=============================================================');
  console.log(`🚀 BẮT ĐẦU QUÁ TRÌNH ĐỒNG BỘ (${selectedSources.length} NGUỒN ĐÃ CHỌN)`);
  console.log(`💾 Nạp vào Database: ${flags.saveDb ? 'CÓ (Idempotent)' : 'KHÔNG (Chỉ xuất JSON)'}`);
  console.log(`🎧 Tải Media offline: ${flags.downloadMedia ? 'CÓ' : 'KHÔNG'}`);
  console.log(`📝 Log chi tiết ghi tại: ${logFilePath}`);
  console.log('=============================================================\n');

  const results = [];

  for (const src of selectedSources) {
    const startTime = Date.now();
    try {
      console.log(`\n▶️ [${src.displayName}] Đang bắt đầu xử lý...`);
      const crawlerModule = await import(`file://${src.crawlerPath.replace(/\\/g, '/')}`);
      
      let summary = null;
      if (typeof crawlerModule.crawl === 'function') {
        summary = await crawlerModule.crawl({
          prisma,
          saveDb: flags.saveDb,
          downloadMedia: flags.downloadMedia
        });
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      results.push({
        source: src.id,
        name: src.displayName,
        status: 'THÀNH CÔNG',
        details: summary,
        time: `${elapsed}s`
      });
    } catch (err) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`❌ Lỗi khi đồng bộ nguồn ${src.displayName}:`, err.message);
      results.push({
        source: src.id,
        name: src.displayName,
        status: 'LỖI',
        error: err.message,
        time: `${elapsed}s`
      });
    }
  }

  console.log('\n=============================================================');
  console.log('📊 TỔNG KẾT TIẾN TRÌNH ĐỒNG BỘ:');
  console.log('=============================================================');
  for (const r of results) {
    console.log(`• ${r.name} (${r.source}): ${r.status === 'THÀNH CÔNG' ? '✅ ' + r.status : '❌ ' + r.status} [${r.time}]`);
    if (r.details?.totalUniqueExams || r.details?.totalExams) console.log(`  └─ Tổng số đề thi duy nhất: ${r.details.totalUniqueExams || r.details.totalExams}`);
    if (r.details?.newlyAddedExams !== undefined) console.log(`  └─ Đề thi mới phát hiện: ${r.details.newlyAddedExams}`);
    if (r.details?.updatedExams !== undefined) console.log(`  └─ Đề thi cũ được cập nhật: ${r.details.updatedExams}`);
    if (r.details?.fullTestsCount) console.log(`  └─ Đề Full Tests: ${r.details.fullTestsCount}`);
    if (r.details?.tipsCount) console.log(`  └─ Bài viết mẹo thi: ${r.details.tipsCount}`);
    if (r.details?.showcaseCount) console.log(`  └─ Bài mẫu Writing/Speaking: ${r.details.showcaseCount}`);
  }
  console.log('=============================================================');
  console.log(`📁 File nhật ký phiên đồng bộ đã lưu tại:`);
  console.log(`   └─ Phiên này: ${logFilePath}`);
  console.log(`   └─ File mới nhất: tools/logs/latest.log\n`);

  if (prisma) {
    await prisma.$disconnect().catch(() => {});
  }

  logger.closeSession();
}

main().catch(console.error);
