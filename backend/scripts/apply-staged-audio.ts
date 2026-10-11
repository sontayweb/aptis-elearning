import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { StagingManifest } from './generate-missing-audio';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  const storageDir = path.resolve(process.env.STORAGE_DIR || './storage');
  const manifestPath = path.join(storageDir, 'staging_audio_manifest.json');

  console.log('================================================================');
  console.log(' APPLY STAGED AUDIO TO CORE DATABASE & LISTENING DIRECTORY');
  console.log(` Mode: ${isDryRun ? 'DRY-RUN (Chỉ kiểm tra)' : 'LIVE COMMIT (Chính thức cập nhật)'}`);
  console.log('================================================================\n');

  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Không tìm thấy file manifest tại: ${manifestPath}`);
    console.error('👉 Hãy chạy script sinh staging trước: npx ts-node -T backend/scripts/generate-missing-audio.ts');
    process.exit(1);
  }

  const manifest: StagingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  console.log(`📄 Đọc Manifest tạo lúc: ${manifest.createdAt}`);
  console.log(`📦 Tổng số phần thi staged: ${manifest.items.length}\n`);

  const baseUpload = path.resolve(process.env.UPLOAD_DIR || './uploads');
  const coreDir = path.join(baseUpload, 'audio', 'listening');
  if (!fs.existsSync(coreDir)) {
    fs.mkdirSync(coreDir, { recursive: true });
  }

  let appliedCount = 0;
  let missingFileCount = 0;
  let errorCount = 0;

  for (const item of manifest.items) {
    const filename = path.basename(item.localPath);
    const destPath = path.join(coreDir, filename);

    // Kiểm tra tính hợp lệ của file staging
    if (!fs.existsSync(item.localPath)) {
      console.warn(`⚠️ [THIẾU FILE] Không tìm thấy file staging: ${item.localPath}`);
      missingFileCount++;
      continue;
    }

    const stat = fs.statSync(item.localPath);
    if (stat.size === 0) {
      console.warn(`⚠️ [FILE RỖNG 0 BYTE] Bỏ qua file: ${item.localPath}`);
      missingFileCount++;
      continue;
    }

    console.log(`🚀 [ÁP DỤNG] Part ${item.partNumber} ("${item.examTitle}") -> URL: ${item.coreTargetUrl}`);

    if (isDryRun) {
      appliedCount++;
      continue;
    }

    try {
      // 1. Sao chép file từ staging sang core folder
      fs.copyFileSync(item.localPath, destPath);

      // 2. Cập nhật đường dẫn audio_url vào bảng ExamPart của Core DB
      await prisma.examPart.update({
        where: { id: item.partId },
        data: {
          audio_url: item.coreTargetUrl,
        },
      });

      appliedCount++;
    } catch (err: any) {
      console.error(`❌ [LỖI UPDATE DB] Part ${item.partId}: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n================================================================');
  console.log(' TỔNG KẾT ÁP DỤNG AUDIO VÀO CORE:');
  console.log(` - Áp dụng thành công: ${appliedCount}`);
  console.log(` - Thiếu file/Bỏ qua: ${missingFileCount}`);
  console.log(` - Lỗi: ${errorCount}`);
  console.log('================================================================');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal apply audio error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
