import { backupService } from '../modules/backup/backup.service';

async function main() {
  const args = process.argv.slice(2);
  const command = (args[0] || 'help').toLowerCase();

  console.log('\n================================================================');
  console.log('   APTIS ESOL — CÔNG CỤ SAO LƯU & KHÔI PHỤC CSDL ENTERPRISE');
  console.log('================================================================\n');

  try {
    switch (command) {
      case 'status': {
        console.log('📊 Đang kiểm tra trạng thái CSDL PostgreSQL...');
        const stats = await backupService.getDatabaseStats();

        console.log(`\n• Database: ${stats.databaseName} (${stats.host}:${stats.port})`);
        console.log(`• Tổng số bản ghi toàn hệ thống: ${stats.totalRecords.toLocaleString()} bản ghi\n`);

        console.log('----------------------------------------------------------------');
        console.log(`| ${'Bảng CSDL (Model)'.padEnd(25)} | ${'Mô tả phân hệ'.padEnd(30)} | ${'Số bản ghi'.padStart(12)} |`);
        console.log('----------------------------------------------------------------');
        for (const t of stats.tables) {
          console.log(
            `| ${t.table.padEnd(25)} | ${t.displayName.padEnd(30)} | ${t.count.toLocaleString().padStart(12)} |`
          );
        }
        console.log('----------------------------------------------------------------\n');

        console.log('📁 Danh sách các bản sao lưu hiện có:');
        const backups = await backupService.listBackups();
        if (backups.length === 0) {
          console.log('  (Chưa có bản sao lưu nào. Chạy `npm run db:backup` để tạo bản sao lưu đầu tiên.)');
        } else {
          for (const b of backups) {
            console.log(
              `  - [${b.type.toUpperCase()}] ${b.filename} | ${b.sizeFormatted} | ${new Date(b.createdAt).toLocaleString('vi-VN')}`
            );
          }
        }
        console.log('\n');
        break;
      }

      case 'backup':
      case 'backup:full': {
        console.log('🚀 Bắt đầu tạo bản sao lưu toàn diện (SQL Dump + JSON Snapshot)...');
        const result = await backupService.createFullBackup({ type: 'full' });
        console.log(`\n✅ ${result.message}`);
        console.log(`⏱️ Thời gian thực thi: ${(result.durationMs / 1000).toFixed(2)}s\n`);
        break;
      }

      case 'backup:sql': {
        console.log('🚀 Bắt đầu tạo bản sao lưu SQL Dump (.sql)...');
        const result = await backupService.createSqlBackup();
        console.log(`\n✅ ${result.message}`);
        console.log(`🔑 SHA-256 Checksum: ${result.backup?.sha256}`);
        console.log(`⏱️ Thời gian thực thi: ${(result.durationMs / 1000).toFixed(2)}s\n`);
        break;
      }

      case 'backup:json': {
        console.log('🚀 Bắt đầu tạo bản sao lưu JSON Snapshot...');
        const result = await backupService.createJsonSnapshot();
        console.log(`\n✅ ${result.message}`);
        console.log(`⏱️ Thời gian thực thi: ${(result.durationMs / 1000).toFixed(2)}s\n`);
        break;
      }

      case 'list': {
        console.log('📁 Danh sách các bản sao lưu hiện có:\n');
        const backups = await backupService.listBackups();
        if (backups.length === 0) {
          console.log('  (Chưa có bản sao lưu nào)');
        } else {
          for (let i = 0; i < backups.length; i++) {
            const b = backups[i];
            console.log(
              `  ${i + 1}. [${b.type.toUpperCase()}] ${b.filename}` +
              `\n     Dung lượng: ${b.sizeFormatted} | Thời gian: ${new Date(b.createdAt).toLocaleString('vi-VN')}`
            );
          }
        }
        console.log('\n');
        break;
      }

      case 'restore': {
        const targetFilename = args[1];
        if (!targetFilename) {
          console.log('⚠️ Vui lòng chỉ định tên tệp sao lưu .sql cần khôi phục.');
          console.log('   Ví dụ: npm run db:restore backup_aptis_kytich_db_20261027_070000.sql\n');
          console.log('📁 Danh sách các tệp .sql hiện có:');
          const backups = await backupService.listBackups();
          const sqlFiles = backups.filter((b) => b.type === 'sql');
          sqlFiles.forEach((f, idx) => {
            console.log(`   ${idx + 1}. ${f.filename} (${f.sizeFormatted})`);
          });
          console.log('\n');
          process.exit(1);
        }

        console.log(`⚠️ BẮT ĐẦU KHÔI PHỤC CSDL TỪ TỆP: ${targetFilename}`);
        console.log('   Quá trình này sẽ nạp lại toàn bộ cấu trúc và dữ liệu vào CSDL.');
        const result = await backupService.restoreSqlBackup(targetFilename);
        console.log(`\n🎉 ${result.message}\n`);
        break;
      }

      case 'help':
      default: {
        console.log('Các lệnh được hỗ trợ:');
        console.log('  npm run db:status           -> Xem thống kê CSDL và danh sách sao lưu');
        console.log('  npm run db:backup           -> Tạo sao lưu toàn diện (SQL + JSON Snapshot)');
        console.log('  npm run db:backup:sql       -> Tạo tệp sao lưu SQL Dump (.sql)');
        console.log('  npm run db:backup:json      -> Tạo thư mục sao lưu JSON Snapshot');
        console.log('  npm run db:restore <file>   -> Khôi phục CSDL từ tệp sao lưu .sql');
        console.log('\n');
        break;
      }
    }
  } catch (err: any) {
    console.error(`\n❌ LỖI THỰC THI: ${err.message}\n`);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
