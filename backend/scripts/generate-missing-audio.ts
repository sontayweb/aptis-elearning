import fs from 'fs';
import path from 'path';
import { PrismaClient, ExamSkill } from '@prisma/client';
import { TtsAudioService } from '../src/modules/ingestion/tts-audio.service';

const prisma = new PrismaClient();

// Ánh xạ giọng đọc chuẩn giọng bản ngữ Anh - Anh (Aptis ESOL standard)
const VOICE_MAP: Record<number, string> = {
  1: 'en-GB-SoniaNeural', // Part 1: Monologue thông báo ngắn (nữ)
  2: 'en-GB-RyanNeural',  // Part 2: 4 speakers
  3: 'en-GB-RyanNeural',  // Part 3: Dialogue Man / Woman
  4: 'en-GB-RyanNeural',  // Part 4: Thuyết trình dài (nam)
};

export interface StagingManifestItem {
  examId: string;
  examTitle: string;
  partId: string;
  partNumber: number;
  voice: string;
  charCount: number;
  localPath: string;
  stagingUrl: string;
  coreTargetUrl: string;
  fileSizeBytes: number;
  generatedAt: string;
}

export interface StagingManifest {
  createdAt: string;
  totalPlanned: number;
  successCount: number;
  skipCount: number;
  errorCount: number;
  items: StagingManifestItem[];
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isLive = args.includes('--live');
  const isStaging = !isLive; // Mặc định luôn là STAGING để đảm bảo an toàn tuyệt đối cho Core Database
  const force = args.includes('--force');

  // Hỗ trợ tham số --limit <n>
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 && args[limitIdx + 1] ? parseInt(args[limitIdx + 1], 10) : undefined;

  console.log('================================================================');
  console.log(' BATCH GENERATE AUDIO FOR APTIS LISTENING EXAMS');
  console.log(` Mode: ${isDryRun ? 'DRY-RUN (Chỉ kiểm tra)' : isStaging ? 'STAGING (Sinh file đệm, KHÔNG ghi Core DB)' : 'LIVE (Ghi Core DB)'}`);
  console.log(` Limit: ${limit ? limit + ' phần thi' : 'Toàn bộ'}`);
  console.log(` Force overwrite: ${force ? 'YES' : 'NO'}`);
  console.log('================================================================\n');

  // Khởi tạo TTS Service tùy theo chế độ
  const subDir = isStaging ? 'staging' : 'listening';
  const ttsService = new TtsAudioService(undefined, subDir);

  // Đường dẫn lưu file Manifest
  const storageDir = path.resolve(process.env.STORAGE_DIR || './storage');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  const manifestPath = path.join(storageDir, 'staging_audio_manifest.json');

  // Lấy các ExamPart của đề Listening
  const listeningParts = await prisma.examPart.findMany({
    where: {
      exam: {
        skill: ExamSkill.LISTENING,
      },
      ...(force ? {} : { OR: [{ audio_url: null }, { audio_url: '' }] }),
    },
    include: {
      exam: {
        select: { id: true, title: true, is_published: true },
      },
      questions: {
        orderBy: { question_number: 'asc' },
      },
    },
    orderBy: [
      { exam_id: 'asc' },
      { part_number: 'asc' },
    ],
    ...(limit ? { take: limit } : {}),
  });

  console.log(`🔍 Tìm thấy ${listeningParts.length} phần bài nghe cần xử lý...\n`);

  const manifestItems: StagingManifestItem[] = [];
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const part of listeningParts) {
    const partNum = part.part_number;
    const examTitle = part.exam?.title || part.exam_id;

    // Xác định transcript text
    let transcriptText = (part.passage_text || '').trim();

    if (!transcriptText && part.questions.length > 0) {
      if (partNum === 1) {
        transcriptText = part.questions.map((q) => `Question ${q.question_number}: ${q.prompt}`).join('\n\n');
      } else if (partNum === 2) {
        transcriptText = part.questions.map((q) => `${q.prompt}: ${q.correct_answer || ''}`).join('\n\n');
      } else if (partNum === 3) {
        transcriptText = part.questions.map((q) => `Statement ${q.question_number}: ${q.prompt}`).join('\n\n');
      } else if (partNum === 4) {
        transcriptText = part.questions.map((q) => `Discussion point: ${q.prompt}`).join('\n\n');
      }
    }

    if (!transcriptText) {
      console.warn(`⚠️ [BỎ QUA] Đề "${examTitle}" - Part ${partNum} không có text.`);
      skipCount++;
      continue;
    }

    const voice = VOICE_MAP[partNum] || 'en-GB-RyanNeural';
    const prefix = `listening_exam_${part.exam_id.substring(0, 8)}_p${partNum}`;

    console.log(`🎙️ [XỬ LÝ] Đề "${examTitle}" | Part ${partNum} | Voice: ${voice} | Ký tự: ${transcriptText.length}`);

    if (isDryRun) {
      console.log(`   -> [DRY-RUN SẼ SINH]: /uploads/audio/${subDir}/${prefix}_<timestamp>.mp3\n`);
      successCount++;
      continue;
    }

    try {
      const result = await ttsService.generateSpeech(transcriptText, prefix, { voice });
      const stats = fs.existsSync(result.localPath) ? fs.statSync(result.localPath) : { size: 0 };
      const filename = path.basename(result.localPath);
      const coreTargetUrl = `/uploads/audio/listening/${filename}`;

      manifestItems.push({
        examId: part.exam_id,
        examTitle,
        partId: part.id,
        partNumber: partNum,
        voice,
        charCount: transcriptText.length,
        localPath: result.localPath,
        stagingUrl: result.publicUrl,
        coreTargetUrl,
        fileSizeBytes: stats.size,
        generatedAt: new Date().toISOString(),
      });

      if (isLive) {
        // CHỈ cập nhật DB khi chạy cờ --live tường minh
        await prisma.examPart.update({
          where: { id: part.id },
          data: { audio_url: result.publicUrl },
        });
        console.log(`   ✅ [LIVE UPDATED DB] File: ${result.publicUrl} (${stats.size} bytes)\n`);
      } else {
        console.log(`   📦 [STAGED AN TOÀN] File: ${result.publicUrl} (${stats.size} bytes - DB chưa đụng vào)\n`);
      }

      successCount++;
    } catch (err: any) {
      console.error(`   ❌ [LỖI] Part ${partNum} (${part.id}): ${err.message}\n`);
      errorCount++;
    }
  }

  // Ghi file Manifest nếu ở chế độ Staging
  if (isStaging && !isDryRun) {
    const manifest: StagingManifest = {
      createdAt: new Date().toISOString(),
      totalPlanned: listeningParts.length,
      successCount,
      skipCount,
      errorCount,
      items: manifestItems,
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(`📄 [MANIFEST ĐÃ LƯU]: ${manifestPath}`);
  }

  console.log('================================================================');
  console.log(' TỔNG KẾT BATCH SINH AUDIO:');
  console.log(` - Chế độ: ${isStaging ? 'STAGING (An toàn tuyệt đối)' : 'LIVE'}`);
  console.log(` - Thành công: ${successCount}`);
  console.log(` - Bỏ qua: ${skipCount}`);
  console.log(` - Thất bại: ${errorCount}`);
  if (isStaging && !isDryRun) {
    console.log(`\n 👉 Báo cáo Manifest: ${manifestPath}`);
    console.log(' 👉 Để áp dụng vào Core DB sau khi kiểm duyệt:');
    console.log('    npx ts-node -T backend/scripts/apply-staged-audio.ts\n');
  }
  console.log('================================================================');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal batch audio error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
