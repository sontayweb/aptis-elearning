import { PrismaClient, ExamSkill } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('=== BẮT ĐẦU ĐÓNG GÓI 3 KỸ NĂNG: LISTENING, SPEAKING, WRITING ===\n');

  const catalogPath = path.resolve(__dirname, '../../tools/data/aptiskytich/exam_sets_catalog.json');
  const catalog: any[] = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  // Lấy toàn bộ sub-exams hiện có của APTIS_KYTICH trong DB
  const allSubExams = await prisma.exam.findMany({
    where: { source: 'APTIS_KYTICH' },
    include: { parts: { include: { questions: true } } }
  });

  const subMap = new Map<string, typeof allSubExams[0]>();
  for (const ex of allSubExams) {
    subMap.set(ex.title.trim().toLowerCase(), ex);
  }

  // ==========================================
  // 1. ĐÓNG GÓI LISTENING (Đề 01 ➔ Đề 54)
  // ==========================================
  console.log('--- 1. ĐÓNG GÓI FULL LISTENING (40 PHÚT · 4 PARTS) ---');
  const listeningCat = catalog.filter((c) => c.skill === 'listening');
  const listByDe: Record<number, any[]> = {};
  listeningCat.forEach((s) => {
    const m = s.title.match(/^Đề\s+(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!listByDe[n]) listByDe[n] = [];
      listByDe[n].push(s);
    }
  });

  const listNums = Object.keys(listByDe).map(Number).sort((a, b) => a - b);
  let listCreated = 0;

  for (const num of listNums) {
    const code = num < 10 ? `0${num}` : `${num}`;
    const title = `Đề ${code} — Full Listening · 4 Parts`;
    const isPro = num > 3;

    // Tìm các part con
    const items = listByDe[num] || [];
    const p1 = items.find((c) => c.part && c.part.includes('Part 1'));
    const p2 = items.find((c) => c.part && c.part.includes('Part 2'));
    const p3 = items.find((c) => c.part && c.part.includes('Part 3'));
    const p4 = items.find((c) => c.part && c.part.includes('Part 4'));

    const ordered = [p1, p2, p3, p4].filter(Boolean);
    const partsToCreate: any[] = [];
    let pIdx = 1;

    for (const cat of ordered) {
      const subEx = subMap.get(cat.title.trim().toLowerCase());
      if (subEx && subEx.parts.length > 0) {
        const origPart = subEx.parts[0];
        partsToCreate.push({
          part_number: pIdx++,
          title: `Part ${pIdx - 1}: ${cat.part || origPart.title}`,
          instructions: origPart.instructions || 'Listen to the audio and answer the questions.',
          passage_text: origPart.passage_text,
          audio_url: origPart.audio_url,
          image_url: origPart.image_url,
          questions: {
            create: origPart.questions.map((q, qIdx) => ({
              question_number: qIdx + 1,
              question_type: q.question_type,
              prompt: q.prompt,
              options: q.options as any,
              correct_answer: q.correct_answer,
              explanation: q.explanation,
              max_score: q.max_score,
            }))
          }
        });
      }
    }

    if (partsToCreate.length === 0) continue;

    // Xóa bản ghi cũ nếu có để tạo lại sạch
    const existing = await prisma.exam.findFirst({ where: { title } });
    if (existing) await prisma.exam.delete({ where: { id: existing.id } });

    await prisma.exam.create({
      data: {
        title,
        description: `Bài thi luyện tập Full Listening 4 Parts chuẩn Aptis ESOL 2026. Thời gian 40 phút.`,
        skill: ExamSkill.LISTENING,
        duration_minutes: 40,
        is_pro: isPro,
        is_published: true,
        source: 'APTIS_KYTICH',
        parts: { create: partsToCreate }
      }
    });
    listCreated++;
  }
  console.log(`✅ Đã đóng gói thành công ${listCreated} đề Full Listening (Đề 01 ➔ Đề 54)!`);

  // ==========================================
  // 2. ĐÓNG GÓI SPEAKING (Đề 01 ➔ Đề 75)
  // ==========================================
  console.log('\n--- 2. ĐÓNG GÓI FULL SPEAKING (12 PHÚT · 4 PARTS) ---');
  const speakingCat = catalog.filter((c) => c.skill === 'speaking');
  const speakByDe: Record<number, any[]> = {};
  speakingCat.forEach((s) => {
    const m = s.title.match(/^Đề\s+(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!speakByDe[n]) speakByDe[n] = [];
      speakByDe[n].push(s);
    }
  });

  const speakNums = Object.keys(speakByDe).map(Number).sort((a, b) => a - b);
  let speakCreated = 0;

  for (const num of speakNums) {
    const code = num < 10 ? `0${num}` : `${num}`;
    const title = `Đề ${code} — Full Speaking · 4 Parts`;
    const isPro = num > 3;

    const items = speakByDe[num] || [];
    const p1 = items.find((c) => c.part && c.part.includes('Part 1'));
    const p2 = items.find((c) => c.part && c.part.includes('Part 2'));
    const p3 = items.find((c) => c.part && c.part.includes('Part 3'));
    const p4 = items.find((c) => c.part && c.part.includes('Part 4'));

    const ordered = [p1, p2, p3, p4].filter(Boolean);
    const partsToCreate: any[] = [];
    let pIdx = 1;

    for (const cat of ordered) {
      const subEx = subMap.get(cat.title.trim().toLowerCase());
      if (subEx && subEx.parts.length > 0) {
        const origPart = subEx.parts[0];
        partsToCreate.push({
          part_number: pIdx++,
          title: `Part ${pIdx - 1}: ${cat.part || origPart.title}`,
          instructions: origPart.instructions || 'Speak your answer clearly.',
          passage_text: origPart.passage_text,
          audio_url: origPart.audio_url,
          image_url: origPart.image_url,
          questions: {
            create: origPart.questions.map((q, qIdx) => ({
              question_number: qIdx + 1,
              question_type: q.question_type,
              prompt: q.prompt,
              options: q.options as any,
              correct_answer: q.correct_answer,
              explanation: q.explanation,
              max_score: q.max_score,
            }))
          }
        });
      }
    }

    if (partsToCreate.length === 0) continue;

    const existing = await prisma.exam.findFirst({ where: { title } });
    if (existing) await prisma.exam.delete({ where: { id: existing.id } });

    await prisma.exam.create({
      data: {
        title,
        description: `Bài thi luyện tập Full Speaking 4 Parts chuẩn Aptis ESOL 2026. Thời gian 12 phút, AI chấm CEFR.`,
        skill: ExamSkill.SPEAKING,
        duration_minutes: 12,
        is_pro: isPro,
        is_published: true,
        source: 'APTIS_KYTICH',
        parts: { create: partsToCreate }
      }
    });
    speakCreated++;
  }
  console.log(`✅ Đã đóng gói thành công ${speakCreated} đề Full Speaking (Đề 01 ➔ Đề 75)!`);

  // ==========================================
  // 3. ĐÓNG GÓI WRITING (62 Câu lạc bộ CLB)
  // ==========================================
  console.log('\n--- 3. ĐÓNG GÓI FULL WRITING (50 PHÚT · 4 PARTS THEO CLB) ---');
  const writingCat = catalog.filter((c) => c.skill === 'writing');
  const writeByClub: Record<string, any[]> = {};
  writingCat.forEach((s) => {
    const m = s.title.match(/^(.*?)\s*-\s*Writing Part\s*(\d+)/i);
    const club = m ? m[1].trim() : s.title.trim();
    if (!writeByClub[club]) writeByClub[club] = [];
    writeByClub[club].push(s);
  });

  const clubs = Object.keys(writeByClub).sort();
  let writeCreated = 0;

  for (let cIdx = 0; cIdx < clubs.length; cIdx++) {
    const club = clubs[cIdx];
    const title = `${club} — Full Writing · 4 Parts`;
    const isPro = cIdx >= 3; // 3 CLB đầu Free, còn lại Pro

    const items = writeByClub[club] || [];
    const p1 = items.find((c) => c.part && c.part.includes('Part 1'));
    const p2 = items.find((c) => c.part && c.part.includes('Part 2'));
    const p3 = items.find((c) => c.part && c.part.includes('Part 3'));
    const p4 = items.find((c) => c.part && c.part.includes('Part 4'));

    const ordered = [p1, p2, p3, p4].filter(Boolean);
    const partsToCreate: any[] = [];
    let pIdx = 1;

    for (const cat of ordered) {
      const subEx = subMap.get(cat.title.trim().toLowerCase());
      if (subEx && subEx.parts.length > 0) {
        const origPart = subEx.parts[0];
        partsToCreate.push({
          part_number: pIdx++,
          title: `Part ${pIdx - 1}: ${cat.part || origPart.title}`,
          instructions: origPart.instructions || 'Write your response in English.',
          passage_text: origPart.passage_text,
          audio_url: origPart.audio_url,
          image_url: origPart.image_url,
          questions: {
            create: origPart.questions.map((q, qIdx) => ({
              question_number: qIdx + 1,
              question_type: q.question_type,
              prompt: q.prompt,
              options: q.options as any,
              correct_answer: q.correct_answer,
              explanation: q.explanation,
              max_score: q.max_score,
            }))
          }
        });
      }
    }

    if (partsToCreate.length === 0) continue;

    const existing = await prisma.exam.findFirst({ where: { title } });
    if (existing) await prisma.exam.delete({ where: { id: existing.id } });

    await prisma.exam.create({
      data: {
        title,
        description: `Bài thi luyện tập Full Writing 4 Parts đề ${club} chuẩn Aptis ESOL 2026. Thời gian 50 phút, AI chấm CEFR.`,
        skill: ExamSkill.WRITING,
        duration_minutes: 50,
        is_pro: isPro,
        is_published: true,
        source: 'APTIS_KYTICH',
        parts: { create: partsToCreate }
      }
    });
    writeCreated++;
  }
  console.log(`✅ Đã đóng gói thành công ${writeCreated} đề Full Writing theo Câu lạc bộ!`);

  console.log('\n🎉 TỔNG KẾT ĐÓNG GÓI HOÀN TẤT:');
  console.log(`- Listening: ${listCreated} bài thi Full`);
  console.log(`- Speaking:  ${speakCreated} bài thi Full`);
  console.log(`- Writing:   ${writeCreated} bài thi Full`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
