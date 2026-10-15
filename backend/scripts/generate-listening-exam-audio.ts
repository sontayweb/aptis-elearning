import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { ttsAudioService } from '../src/modules/ingestion/tts-audio.service';

const prisma = new PrismaClient();

function extractListeningTranscript(rawExp?: string | null): string {
  if (!rawExp) return '';
  if (rawExp.includes('--- GIẢI THÍCH ĐÁP ÁN ---')) {
    return rawExp.split('--- GIẢI THÍCH ĐÁP ÁN ---')[0].trim();
  }
  if (rawExp.includes('--- GỢI Ý / BẢN DỊCH ---')) {
    return rawExp.split('--- GỢI Ý / BẢN DỊCH ---')[0].trim();
  }
  if (rawExp.length > 20 && !rawExp.toLowerCase().startsWith('đáp án')) {
    return rawExp.trim();
  }
  return '';
}

async function main() {
  const examId = '61fdc722-45c4-43a8-adc2-52db6c4110bc';
  console.log(`Bắt đầu sinh âm thanh thật (Native MP3) cho đề thi ${examId}...`);

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      parts: {
        orderBy: { part_number: 'asc' },
        include: {
          questions: {
            orderBy: { question_number: 'asc' },
          },
        },
      },
    },
  });

  if (!exam) {
    console.error('Không tìm thấy đề thi!');
    return;
  }

  const frontendUploadDir = path.resolve(__dirname, '../../frontend/public/uploads/audio/listening');
  if (!fs.existsSync(frontendUploadDir)) {
    fs.mkdirSync(frontendUploadDir, { recursive: true });
  }

  for (const part of exam.parts) {
    console.log(`\n--- Xử lý Part ${part.part_number}: ${part.title} ---`);

    // Part 1: Mỗi câu hỏi là 1 file âm thanh đối thoại ngắn
    if (part.part_number === 1) {
      for (let i = 0; i < part.questions.length; i++) {
        const q = part.questions[i];
        const transcript = extractListeningTranscript(q.explanation);
        if (!transcript) {
          console.warn(`  Câu ${i + 1}: Không có transcript`);
          continue;
        }

        const prefix = `de01_p1_q${String(i + 1).padStart(2, '0')}`;
        const voice = i % 2 === 0 ? 'en-GB-RyanNeural' : 'en-GB-SoniaNeural';
        console.log(`  Sinh âm thanh Part 1 Câu ${i + 1} (${transcript.slice(0, 45)}...)...`);
        
        try {
          const res = await ttsAudioService.generateSpeech(transcript, prefix, { voice });
          // Copy to frontend/public for direct fallback serving
          const destFrontend = path.join(frontendUploadDir, path.basename(res.localPath));
          fs.copyFileSync(res.localPath, destFrontend);
          console.log(`    ✅ Đã tạo: ${res.publicUrl} (${fs.statSync(res.localPath).size} bytes)`);
        } catch (e: any) {
          console.error(`    ❌ Lỗi: ${e.message}`);
        }
      }
    }

    // Part 2: 4 người nói
    else if (part.part_number === 2) {
      const qWithExp = part.questions.find((q) => q.explanation && q.explanation.length > 30);
      const transcript = extractListeningTranscript(qWithExp?.explanation || part.passage_text);
      if (transcript) {
        console.log(`  Sinh âm thanh Part 2 (4 Speakers)...`);
        const res = await ttsAudioService.generateSpeech(transcript, 'de01_p2_speakers', { voice: 'en-GB-RyanNeural' });
        const destFrontend = path.join(frontendUploadDir, path.basename(res.localPath));
        fs.copyFileSync(res.localPath, destFrontend);

        // Update part audio_url in DB
        await prisma.examPart.update({
          where: { id: part.id },
          data: { audio_url: path.basename(res.publicUrl) },
        });
        console.log(`    ✅ Đã tạo Part 2: ${res.publicUrl}`);
      }
    }

    // Part 3: Đối thoại 2 người (Man & Woman)
    else if (part.part_number === 3) {
      const qWithExp = part.questions.find((q) => q.explanation && q.explanation.length > 30);
      const transcript = extractListeningTranscript(qWithExp?.explanation || part.passage_text);
      if (transcript) {
        console.log(`  Sinh âm thanh Part 3 (Man & Woman Discussion)...`);
        const res = await ttsAudioService.generateSpeech(transcript, 'de01_p3_discussion', { voice: 'en-GB-SoniaNeural' });
        const destFrontend = path.join(frontendUploadDir, path.basename(res.localPath));
        fs.copyFileSync(res.localPath, destFrontend);

        // Update part audio_url in DB
        await prisma.examPart.update({
          where: { id: part.id },
          data: { audio_url: path.basename(res.publicUrl) },
        });
        console.log(`    ✅ Đã tạo Part 3: ${res.publicUrl}`);
      }
    }

    // Part 4: 2 bài thuyết trình
    else if (part.part_number === 4) {
      const q1Exp = part.questions.slice(0, 2).find((q) => q.explanation && q.explanation.length > 30);
      const q2Exp = part.questions.slice(2, 4).find((q) => q.explanation && q.explanation.length > 30);
      const t1 = extractListeningTranscript(q1Exp?.explanation);
      const t2 = extractListeningTranscript(q2Exp?.explanation);

      if (t1) {
        console.log(`  Sinh âm thanh Part 4 - Recording 1...`);
        const res1 = await ttsAudioService.generateSpeech(t1, 'de01_p4_rec1', { voice: 'en-GB-RyanNeural' });
        const destFrontend1 = path.join(frontendUploadDir, path.basename(res1.localPath));
        fs.copyFileSync(res1.localPath, destFrontend1);
        console.log(`    ✅ Đã tạo Part 4 Rec 1: ${res1.publicUrl}`);

        await prisma.examPart.update({
          where: { id: part.id },
          data: { audio_url: path.basename(res1.publicUrl) },
        });
      }

      if (t2) {
        console.log(`  Sinh âm thanh Part 4 - Recording 2...`);
        const res2 = await ttsAudioService.generateSpeech(t2, 'de01_p4_rec2', { voice: 'en-GB-SoniaNeural' });
        const destFrontend2 = path.join(frontendUploadDir, path.basename(res2.localPath));
        fs.copyFileSync(res2.localPath, destFrontend2);
        console.log(`    ✅ Đã tạo Part 4 Rec 2: ${res2.publicUrl}`);
      }
    }
  }

  console.log('\n🎉 Hoàn thành sinh âm thanh toàn bộ 4 Parts cho đề thi!');
}

main().finally(() => prisma.$disconnect());
