import { prisma } from "../config/database";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const allSpeakingExams = await prisma.exam.findMany({
    where: { skill: "SPEAKING" },
    include: {
      parts: {
        include: {
          questions: true,
        },
      },
    },
    orderBy: { title: "asc" },
  });

  console.log(`=== TỔNG QUAN SPEAKING EXAMS TRONG DB: ${allSpeakingExams.length} ĐỀ ===`);

  let part2Count = 0;
  let part3Count = 0;
  let missingImageP2 = 0;
  let missingImageP3 = 0;
  let withOptionsHints = 0;

  const summaryP2: any[] = [];
  const summaryP3: any[] = [];

  for (const ex of allSpeakingExams) {
    for (const p of ex.parts) {
      if (p.part_number === 2) {
        part2Count++;
        const hasImg = !!p.image_url && p.image_url.trim().length > 0;
        if (!hasImg) missingImageP2++;
        summaryP2.push({
          examId: ex.id,
          examTitle: ex.title,
          partTitle: p.title,
          imageUrl: p.image_url,
          questionsCount: p.questions.length,
          hasOptions: p.questions.some((q) => q.options && JSON.stringify(q.options) !== "[]"),
        });
      }
      if (p.part_number === 3) {
        part3Count++;
        const hasImg = !!p.image_url && p.image_url.trim().length > 0;
        if (!hasImg) missingImageP3++;
        summaryP3.push({
          examId: ex.id,
          examTitle: ex.title,
          partTitle: p.title,
          imageUrl: p.image_url,
          questionsCount: p.questions.length,
          hasOptions: p.questions.some((q) => q.options && JSON.stringify(q.options) !== "[]"),
        });
      }
      for (const q of p.questions) {
        if (q.options && typeof q.options === "object" && (q.options as any).vocabularyHints) {
          withOptionsHints++;
        }
      }
    }
  }

  console.log(`- Tổng Part 2: ${part2Count} (Thiếu ảnh: ${missingImageP2})`);
  console.log(`- Tổng Part 3: ${part3Count} (Thiếu ảnh: ${missingImageP3})`);
  console.log(`- Số câu đã có vocabularyHints trong DB: ${withOptionsHints} / ${allSpeakingExams.length * 4}`);

  console.log("\n--- MẪU 5 ĐỀ PART 2 ---");
  console.table(summaryP2.slice(0, 5));

  console.log("\n--- MẪU 5 ĐỀ PART 3 ---");
  console.table(summaryP3.slice(0, 5));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

