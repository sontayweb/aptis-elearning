import { prisma } from '../src/config/database';
import fs from 'fs';
import path from 'path';

async function main() {
  const allListeningExams = await prisma.exam.findMany({
    where: { skill: 'LISTENING' },
    include: {
      parts: {
        include: {
          questions: true,
        },
      },
    },
    orderBy: { created_at: 'asc' },
  });

  const lines: string[] = [];
  lines.push(`Total Listening Exams in DB: ${allListeningExams.length}`);

  const singleP1 = allListeningExams.filter(e => e.parts.length === 1 && (e.title.toLowerCase().includes('part 1') || e.parts[0]?.title.toLowerCase().includes('part 1')));
  const fullTests = allListeningExams.filter(e => e.parts.length === 4);
  const singleP2 = allListeningExams.filter(e => e.parts.length === 1 && (e.title.toLowerCase().includes('part 2') || e.parts[0]?.title.toLowerCase().includes('part 2')));
  const singleP3 = allListeningExams.filter(e => e.parts.length === 1 && (e.title.toLowerCase().includes('part 3') || e.parts[0]?.title.toLowerCase().includes('part 3')));
  const singleP4 = allListeningExams.filter(e => e.parts.length === 1 && (e.title.toLowerCase().includes('part 4') || e.parts[0]?.title.toLowerCase().includes('part 4')));

  lines.push(`Full Tests (4 Parts): ${fullTests.length}`);
  lines.push(`Single Part 1 Exams: ${singleP1.length}`);
  lines.push(`Single Part 2 Exams: ${singleP2.length}`);
  lines.push(`Single Part 3 Exams: ${singleP3.length}`);
  lines.push(`Single Part 4 Exams: ${singleP4.length}`);

  // Count questions in single P1
  let totalSingleP1Questions = 0;
  const p1Detail: any[] = [];
  for (const e of singleP1) {
    const qCount = e.parts[0]?.questions?.length || 0;
    totalSingleP1Questions += qCount;
    p1Detail.push({ title: e.title, questions: qCount });
  }

  // Count questions in Full Test P1
  let totalFtP1Questions = 0;
  for (const e of fullTests) {
    const p1 = e.parts.find(p => p.part_number === 1 || p.title.toLowerCase().includes('part 1'));
    totalFtP1Questions += (p1?.questions?.length || 0);
  }

  lines.push(`\nTotal Part 1 Questions in Single-Part exams: ${totalSingleP1Questions}`);
  lines.push(`Total Part 1 Questions in Full Tests: ${totalFtP1Questions}`);
  lines.push(`GRAND TOTAL Part 1 Questions: ${totalSingleP1Questions + totalFtP1Questions}`);

  // Check original JSON dataset
  const rawCatalogPath = path.resolve(__dirname, '../../tools/data/aptiskytich/exam_sets_catalog.json');
  const rawQuestionsPath = path.resolve(__dirname, '../../tools/data/aptiskytich/all_exam_questions.json');
  if (fs.existsSync(rawCatalogPath) && fs.existsSync(rawQuestionsPath)) {
    const rawCatalog: any[] = JSON.parse(fs.readFileSync(rawCatalogPath, 'utf-8'));
    const rawQuestions: any[] = JSON.parse(fs.readFileSync(rawQuestionsPath, 'utf-8'));
    const lisCatalog = rawCatalog.filter((c: any) => c.skill === 'listening');
    lines.push(`\n--- DỮ LIỆU GỐC TỪ APTIS KỲ TÍCH ---`);
    lines.push(`Tổng số bộ đề Listening trong catalog: ${lisCatalog.length}`);
    
    // Phân loại catalog
    const catP1 = lisCatalog.filter((c: any) => (c.part || c.title || '').toLowerCase().includes('part 1'));
    lines.push(`Số bộ đề Part 1 trong catalog gốc: ${catP1.length}`);
    
    let rawP1QuestionsCount = 0;
    for (const q of rawQuestions) {
      const cat = catP1.find((c: any) => c.id === q.exam_set_id);
      if (cat) rawP1QuestionsCount++;
    }
    lines.push(`Tổng số câu hỏi Part 1 trong file câu hỏi gốc: ${rawP1QuestionsCount}`);
  }

  lines.push(`\nDanh sách các đề lẻ Part 1 (10 đề đầu):`);
  p1Detail.slice(0, 10).forEach(d => lines.push(`- ${d.title}: ${d.questions} câu`));

  fs.writeFileSync(path.resolve(__dirname, '../listening-summary.txt'), lines.join('\n'), 'utf-8');
  console.log('Done writing listening-summary.txt');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
