import { PrismaClient, QuestionType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('=== BẮT ĐẦU ĐỒNG BỘ & SỬA TOÀN DIỆN WRITING PART 1, 2, 3, 4 ===\n');

  const catalogPath = path.resolve(__dirname, '../../tools/data/aptiskytich/exam_sets_catalog.json');
  const questionsPath = path.resolve(__dirname, '../../tools/data/aptiskytich/all_exam_questions.json');

  const catalog: any[] = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const allQuestions: any[] = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  const catMap = new Map<string, any>();
  for (const c of catalog) {
    catMap.set(c.id, c);
  }

  // Build lookup maps by club name and sub-exam title
  const p2Map = new Map<string, any>();
  const p4Map = new Map<string, any>();
  const p3Map = new Map<string, any[]>();
  const p1Map = new Map<string, any[]>();

  for (const q of allQuestions) {
    if (q.question_type !== 'writing') continue;
    const cat = catMap.get(q.exam_set_id);
    if (!cat) continue;

    const catTitleLower = cat.title.trim().toLowerCase();
    const clubMatch = cat.title.match(/^(.*?)\s*-\s*Writing Part\s*(\d+)/i);
    const club = clubMatch ? clubMatch[1].trim().toLowerCase() : catTitleLower;

    if (cat.part?.includes('Part 2') || cat.title.includes('Part 2')) {
      p2Map.set(catTitleLower, q);
      p2Map.set(club, q);
    } else if (cat.part?.includes('Part 4') || cat.title.includes('Part 4')) {
      p4Map.set(catTitleLower, q);
      p4Map.set(club, q);
    } else if (cat.part?.includes('Part 3') || cat.title.includes('Part 3')) {
      if (!p3Map.has(catTitleLower)) p3Map.set(catTitleLower, []);
      if (!p3Map.has(club)) p3Map.set(club, []);
      p3Map.get(catTitleLower)!.push(q);
      p3Map.get(club)!.push(q);
    } else if (cat.part?.includes('Part 1') || cat.title.includes('Part 1')) {
      if (!p1Map.has(catTitleLower)) p1Map.set(catTitleLower, []);
      if (!p1Map.has(club)) p1Map.set(club, []);
      p1Map.get(catTitleLower)!.push(q);
      p1Map.get(club)!.push(q);
    }
  }

  console.log(`P2 lookup size: ${p2Map.size}`);
  console.log(`P4 lookup size: ${p4Map.size}`);
  console.log(`P3 lookup size: ${p3Map.size}`);
  console.log(`P1 lookup size: ${p1Map.size}`);

  // 1. Sửa tất cả Sub-Exams Writing Part 2
  console.log('\n--- 1. CẬP NHẬT SUB-EXAMS WRITING PART 2 ---');
  const subExamsP2 = await prisma.exam.findMany({
    where: {
      skill: 'WRITING',
      OR: [
        { title: { contains: 'Writing Part 2' } },
        { title: { contains: 'Part 2' } },
      ]
    },
    include: { parts: { include: { questions: true } } }
  });

  let p2SubUpdated = 0;
  for (const ex of subExamsP2) {
    if (ex.parts.length === 0) continue;
    const p = ex.parts[0];
    const catTitleLower = ex.title.trim().toLowerCase();
    const clubMatch = ex.title.match(/^(.*?)\s*-\s*Writing Part\s*2/i);
    const club = clubMatch ? clubMatch[1].trim().toLowerCase() : catTitleLower;

    const p2Data = p2Map.get(catTitleLower) || p2Map.get(club);
    if (!p2Data || !p2Data.extra_data) continue;

    const realPrompt = p2Data.extra_data.question;
    const instruction = p2Data.extra_data.instruction || p2Data.question_text;
    const sampleAnswer = p2Data.extra_data.sampleAnswer || p2Data.explanation;

    if (realPrompt) {
      await prisma.examPart.update({
        where: { id: p.id },
        data: {
          part_number: 1, // Sub-exam has 1 part
          title: 'Part 2 - Short Text Writing',
          instructions: instruction,
        }
      });

      if (p.questions.length > 0) {
        await prisma.question.update({
          where: { id: p.questions[0].id },
          data: {
            prompt: realPrompt,
            explanation: sampleAnswer,
          }
        });
      } else {
        await prisma.question.create({
          data: {
            part_id: p.id,
            question_number: 1,
            question_type: QuestionType.SHORT_TEXT,
            prompt: realPrompt,
            explanation: sampleAnswer,
          }
        });
      }
      p2SubUpdated++;
    }
  }
  console.log(`✅ Đã cập nhật ${p2SubUpdated} / ${subExamsP2.length} Sub-Exams Part 2!`);

  // 2. Sửa Full Writing Exams (Part 2 & Part 4)
  console.log('\n--- 2. CẬP NHẬT FULL WRITING EXAMS ---');
  const fullExams = await prisma.exam.findMany({
    where: {
      skill: 'WRITING',
      OR: [
        { title: { contains: 'Full Writing' } },
        { parts: { some: { part_number: 2 } } }
      ]
    },
    include: { parts: { include: { questions: { orderBy: { question_number: 'asc' } } } } }
  });

  let fullP2Updated = 0;
  let fullP4Updated = 0;

  for (const ex of fullExams) {
    if (ex.parts.length <= 1) continue; // Skip sub-exams

    const m = ex.title.match(/^(.*?)\s*—\s*Full Writing/i);
    const club = m ? m[1].trim().toLowerCase() : ex.title.trim().toLowerCase();

    // 2.1 Cập nhật Part 2 trong Full Exam
    const p2 = ex.parts.find(p => p.part_number === 2 || /part\s*2/i.test(p.title));
    const p2Data = p2Map.get(club);
    if (p2 && p2Data && p2Data.extra_data?.question) {
      const realPrompt = p2Data.extra_data.question;
      const instruction = p2Data.extra_data.instruction || p2Data.question_text;
      const sampleAnswer = p2Data.extra_data.sampleAnswer || p2Data.explanation;

      await prisma.examPart.update({
        where: { id: p2.id },
        data: {
          part_number: 2,
          title: 'Part 2: Part 2 - Short Text Writing',
          instructions: instruction,
        }
      });

      if (p2.questions.length > 0) {
        await prisma.question.update({
          where: { id: p2.questions[0].id },
          data: {
            prompt: realPrompt,
            explanation: sampleAnswer,
          }
        });
      } else {
        await prisma.question.create({
          data: {
            part_id: p2.id,
            question_number: 1,
            question_type: QuestionType.SHORT_TEXT,
            prompt: realPrompt,
            explanation: sampleAnswer,
          }
        });
      }
      fullP2Updated++;
    }

    // 2.2 Cập nhật Part 4 trong Full Exam
    const p4 = ex.parts.find(p => p.part_number === 4 || /part\s*4|email/i.test(p.title));
    const p4Data = p4Map.get(club);
    if (p4 && p4Data && p4Data.extra_data) {
      const scenarioIntro = p4Data.extra_data.scenarioIntro || 'You are a member of the club. You received this email from the club manager.';
      const scenarioEmail = p4Data.extra_data.scenarioEmail || '';
      const informal = p4Data.extra_data.informalEmail;
      const formal = p4Data.extra_data.formalEmail;

      await prisma.examPart.update({
        where: { id: p4.id },
        data: {
          part_number: 4,
          title: 'Part 4: Part 4 - Formal & Informal Emails',
          instructions: scenarioIntro,
          passage_text: scenarioEmail,
        }
      });

      if (informal && formal) {
        const qType = p4.questions[0]?.question_type || QuestionType.ESSAY;
        if (p4.questions.length >= 2) {
          await prisma.question.update({
            where: { id: p4.questions[0].id },
            data: {
              prompt: informal.instruction || 'Write an email to a friend in the club. Tell them how you feel about this notice. Write about 50 words.',
              explanation: informal.sampleAnswer,
            }
          });
          await prisma.question.update({
            where: { id: p4.questions[1].id },
            data: {
              prompt: formal.instruction || 'Write an email to the club manager. Explain how you feel about the notice and suggest alternative solutions. Write 120-150 words.',
              explanation: formal.sampleAnswer,
            }
          });
        } else if (p4.questions.length === 1) {
          await prisma.question.update({
            where: { id: p4.questions[0].id },
            data: {
              prompt: informal.instruction || 'Write an email to a friend in the club. Tell them how you feel about this notice. Write about 50 words.',
              explanation: informal.sampleAnswer,
            }
          });
          await prisma.question.create({
            data: {
              part_id: p4.id,
              question_number: 2,
              question_type: qType,
              prompt: formal.instruction || 'Write an email to the club manager. Explain how you feel about the notice and suggest alternative solutions. Write 120-150 words.',
              explanation: formal.sampleAnswer,
            }
          });
        }
        fullP4Updated++;
      }
    }
  }

  console.log(`✅ Đã cập nhật Part 2 cho ${fullP2Updated} Full Writing Exams!`);
  console.log(`✅ Đã cập nhật Part 4 cho ${fullP4Updated} Full Writing Exams!`);

  // 3. Sửa Sub-Exams Part 4
  console.log('\n--- 3. CẬP NHẬT SUB-EXAMS WRITING PART 4 ---');
  const subExamsP4 = await prisma.exam.findMany({
    where: {
      skill: 'WRITING',
      OR: [
        { title: { contains: 'Writing Part 4' } },
        { title: { contains: 'Part 4' } },
      ]
    },
    include: { parts: { include: { questions: { orderBy: { question_number: 'asc' } } } } }
  });

  let p4SubUpdated = 0;
  for (const ex of subExamsP4) {
    if (ex.parts.length === 0) continue;
    const p = ex.parts[0];
    const catTitleLower = ex.title.trim().toLowerCase();
    const clubMatch = ex.title.match(/^(.*?)\s*-\s*Writing Part\s*4/i);
    const club = clubMatch ? clubMatch[1].trim().toLowerCase() : catTitleLower;

    const p4Data = p4Map.get(catTitleLower) || p4Map.get(club);
    if (!p4Data || !p4Data.extra_data) continue;

    const scenarioIntro = p4Data.extra_data.scenarioIntro || 'You are a member of the club. You received this email from the club manager.';
    const scenarioEmail = p4Data.extra_data.scenarioEmail || '';
    const informal = p4Data.extra_data.informalEmail;
    const formal = p4Data.extra_data.formalEmail;

    await prisma.examPart.update({
      where: { id: p.id },
      data: {
        part_number: 1,
        title: 'Part 4 - Formal & Informal Emails',
        instructions: scenarioIntro,
        passage_text: scenarioEmail,
      }
    });

    if (informal && formal) {
      const qType = p.questions[0]?.question_type || QuestionType.ESSAY;
      if (p.questions.length >= 2) {
        await prisma.question.update({
          where: { id: p.questions[0].id },
          data: {
            prompt: informal.instruction,
            explanation: informal.sampleAnswer,
          }
        });
        await prisma.question.update({
          where: { id: p.questions[1].id },
          data: {
            prompt: formal.instruction,
            explanation: formal.sampleAnswer,
          }
        });
      } else if (p.questions.length === 1) {
        await prisma.question.update({
          where: { id: p.questions[0].id },
          data: {
            prompt: informal.instruction,
            explanation: informal.sampleAnswer,
          }
        });
        await prisma.question.create({
          data: {
            part_id: p.id,
            question_number: 2,
            question_type: qType,
            prompt: formal.instruction,
            explanation: formal.sampleAnswer,
          }
        });
      }
      p4SubUpdated++;
    }
  }
  console.log(`✅ Đã cập nhật ${p4SubUpdated} / ${subExamsP4.length} Sub-Exams Part 4!`);

  console.log('\n🎉 ĐỒNG BỘ TOÀN BỘ DỮ LIỆU WRITING THÀNH CÔNG RỰC RỠ!');
  await prisma.$disconnect();
}

main().catch(console.error);
