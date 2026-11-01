/**
 * TOOL QUÉT & PHÂN TÍCH ĐỀ SPEAKING PART 2 & PART 3
 * Mục đích:
 * 1. Quét toàn bộ ảnh và ngữ cảnh đề thi trong Database.
 * 2. Tự động sinh Collocations đối lập, Mẫu câu so sánh & Image Prompts chuẩn để gen ảnh.
 * 3. Nạp trực tiếp vào question.options trong PostgreSQL.
 */

import { prisma } from "../config/database";
import { speakingHintsGeneratorService } from "../modules/admin/speaking-hints-generator.service";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const args = process.argv.slice(2);
  const isScanOnly = args.includes("--scan");
  const isDryRun = args.includes("--dry-run");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;
  const examIdArg = args.find((a) => a.startsWith("--id="));
  const targetExamId = examIdArg ? examIdArg.split("=")[1] : undefined;

  console.log("======================================================================");
  console.log("🎙️  TOOL QUÉT & CHUẨN HÓA GỢI Ý SPEAKING PART 2 & PART 3 (APTIS ESOL)");
  console.log("======================================================================");

  const whereClause: any = { skill: "SPEAKING" };
  if (targetExamId) {
    whereClause.id = targetExamId;
  }

  const exams = await prisma.exam.findMany({
    where: whereClause,
    include: {
      parts: {
        include: {
          questions: true,
        },
      },
    },
    orderBy: { title: "asc" },
    take: limit,
  });

  console.log(`Tìm thấy ${exams.length} đề thi Speaking cần xử lý.\n`);

  let scannedCount = 0;
  let updatedCount = 0;
  const exportData: any[] = [];

  for (const ex of exams) {
    for (const p of ex.parts) {
      if (p.part_number !== 2 && p.part_number !== 3) continue;

      scannedCount++;
      const pNum = p.part_number as 2 | 3;
      const questionsPrompts = p.questions.map((q) => q.prompt).filter(Boolean);
      const firstQ = p.questions[0];

      // Kiểm tra xem đã có hints hay chưa
      const existingOptions = (firstQ?.options as any) || {};
      const hasExistingHints = !!existingOptions.vocabularyHints;

      console.log(`\n[${scannedCount}] Đề: "${ex.title}" (Part ${pNum})`);
      console.log(`    Ảnh: ${p.image_url || "Chưa có ảnh"}`);
      console.log(`    Trạng thái: ${hasExistingHints ? "✅ Đã có gợi ý chuẩn" : "⚠️ Đang dùng hardcode fallback"}`);

      if (isScanOnly) {
        exportData.push({
          examId: ex.id,
          examTitle: ex.title,
          partNumber: pNum,
          imageUrl: p.image_url,
          hasHints: hasExistingHints,
        });
        continue;
      }

      // Sinh dữ liệu hints
      const hints = await speakingHintsGeneratorService.generateHints(
        ex.title || p.title,
        pNum,
        questionsPrompts
      );

      console.log(`    ✨ Collocations: ${hints.keywords.slice(0, 3).join(", ")}...`);
      console.log(`    🖼️  Image 1 Prompt: ${hints.aiImagePrompts.image1Prompt.slice(0, 70)}...`);
      if (hints.aiImagePrompts.image2Prompt) {
        console.log(`    🖼️  Image 2 Prompt: ${hints.aiImagePrompts.image2Prompt.slice(0, 70)}...`);
      }

      exportData.push({
        examId: ex.id,
        examTitle: ex.title,
        partNumber: pNum,
        imageUrl: p.image_url,
        vocabularyHints: hints,
      });

      if (!isDryRun && p.questions.length > 0) {
        // Cập nhật vào DB cho các câu hỏi của Part
        for (const q of p.questions) {
          const currentOpt = (q.options as any) || {};
          await prisma.question.update({
            where: { id: q.id },
            data: {
              options: {
                ...currentOpt,
                vocabularyHints: hints,
              },
            },
          });
        }
        updatedCount++;
        console.log(`    💾 Đã lưu vào DB thành công cho ${p.questions.length} câu hỏi.`);
      }
    }
  }

  // Ghi file báo cáo/export
  const outPath = path.resolve(__dirname, "../../speaking-vocabulary-hints.json");
  fs.writeFileSync(outPath, JSON.stringify(exportData, null, 2), "utf-8");
  console.log(`\n======================================================================`);
  console.log(`🎉 HOÀN TẤT:`);
  console.log(`   - Tổng đề quét: ${scannedCount}`);
  if (!isScanOnly && !isDryRun) {
    console.log(`   - Đã cập nhật vào Database: ${updatedCount} phần`);
  }
  console.log(`   - File dữ liệu xuất ra: ${outPath}`);
  console.log(`======================================================================\n`);
}

main()
  .catch((err) => {
    console.error("FATAL ERROR in speaking tool:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
