import { PrismaClient, ExamSkill } from '@prisma/client';
import http from 'http';

const prisma = new PrismaClient();

async function getRemoteCountBySkill(skill?: string): Promise<number> {
  return new Promise((resolve) => {
    const url = skill
      ? `http://103.90.227.117:5000/api/exams?skill=${skill}&limit=1`
      : `http://103.90.227.117:5000/api/exams?limit=1`;
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.meta?.total || 0);
        } catch {
          resolve(0);
        }
      });
    }).on('error', () => resolve(0));
  });
}

async function main() {
  const localPublished = await prisma.exam.count({ where: { is_published: true } });
  const localUnpublished = await prisma.exam.count({ where: { is_published: false } });
  const localTotal = await prisma.exam.count();

  const remoteTotal = await getRemoteCountBySkill();

  console.log('================================================================');
  console.log(' SO SÁNH SỐ LƯỢNG ĐỀ THI: LOCALHOST vs COOLIFY PRODUCTION');
  console.log('================================================================');
  console.log(`Localhost Total:     ${localTotal} đề`);
  console.log(`  - Đã xuất bản:     ${localPublished} đề`);
  console.log(`  - Bản nháp (Draft): ${localUnpublished} đề`);
  console.log(`Coolify Published:   ${remoteTotal} đề`);
  console.log(`Chênh lệch xuất bản: ${localPublished - remoteTotal} đề`);
  console.log('----------------------------------------------------------------');

  const skills: ExamSkill[] = [
    ExamSkill.FULL_TEST,
    ExamSkill.LISTENING,
    ExamSkill.READING,
    ExamSkill.WRITING,
    ExamSkill.SPEAKING,
    ExamSkill.GRAMMAR_VOCABULARY,
  ];

  console.log('PHÂN BỔ THEO KỸ NĂNG (ĐỀ ĐÃ XUẤT BẢN):');
  for (const s of skills) {
    const loc = await prisma.exam.count({ where: { skill: s, is_published: true } });
    const rem = await getRemoteCountBySkill(s);
    const diff = loc - rem;
    console.log(` - ${s.padEnd(20)}: Local = ${loc.toString().padStart(4)} | Remote = ${rem.toString().padStart(4)} | Lệch = ${diff > 0 ? '+' + diff : diff}`);
  }

  // Lấy danh sách các đề chênh lệch (tạo gần nhất trên local)
  console.log('\n--- CÁC ĐỀ MỚI ĐƯỢC TẠO GẦN NHẤT TRÊN LOCALHOST ---');
  const recentExams = await prisma.exam.findMany({
    take: 15,
    orderBy: { created_at: 'desc' },
    select: { title: true, skill: true, created_at: true, is_published: true },
  });
  recentExams.forEach((e, i) => {
    console.log(`${i + 1}. [${e.skill}] "${e.title}" | Published: ${e.is_published} | Ngày: ${e.created_at.toISOString().split('T')[0]}`);
  });

  console.log('================================================================');
  await prisma.$disconnect();
}

main();
