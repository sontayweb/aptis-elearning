const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function main() {
  const parts = await prisma.examPart.findMany({
    where: {
      part_number: 1,
      OR: [
        { title: { contains: 'LISTENING', mode: 'insensitive' } },
        { exam: { skill: 'LISTENING' } }
      ]
    },
    include: {
      exam: { select: { id: true, title: true, skill: true } },
      questions: true
    }
  });

  console.log(`Checking ${parts.length} Listening Part 1 parts:`);
  let missingAudioCount = 0;
  let missingQuestionsCount = 0;

  for (const p of parts) {
    if (p.questions.length === 0) {
      console.log(`❌ NO QUESTIONS: [${p.exam.title}]`);
      missingQuestionsCount++;
      continue;
    }

    // Check audio URL of part or questions
    const partAudio = p.audio_url;
    if (partAudio) {
      const fePath = path.resolve(__dirname, '../../frontend/public', partAudio.replace(/^\/+/, ''));
      const bePath = path.resolve(__dirname, '../uploads', partAudio.replace(/^\/?(uploads\/)?/, ''));
      const feAudioPath = path.resolve(__dirname, '../../frontend/public/audio', partAudio.replace(/^\/+/, ''));
      const feAudioListen = path.resolve(__dirname, '../../frontend/public/audio/listening', partAudio.replace(/^\/+/, ''));
      if (!fs.existsSync(fePath) && !fs.existsSync(bePath) && !fs.existsSync(feAudioPath) && !fs.existsSync(feAudioListen)) {
        console.log(`❌ MISSING PART AUDIO [${p.exam.title}]: ${partAudio}`);
        missingAudioCount++;
      }
    }

    let qAudioMissing = 0;
    p.questions.forEach(q => {
      // Check if q has audio
      if (!q.options || (Array.isArray(q.options) && q.options.length === 0)) {
        console.log(`⚠️ Question without options: [${p.exam.title}] Q${q.question_number}`);
      }
    });
  }

  console.log(`\nSummary: Missing audio: ${missingAudioCount}, Missing questions: ${missingQuestionsCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
