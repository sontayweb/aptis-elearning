import { prisma } from '../config/database';
import { speakingImageIntelligenceService } from '../modules/admin/speaking-image-intelligence.service';

async function main() {
  console.log('=== APTIS SPEAKING IMAGE INTELLIGENCE & HEAL CLI ===\n');

  const args = process.argv.slice(2);
  const autoApply = args.includes('--auto-apply');
  const dryRun = args.includes('--dry-run');

  // Tìm các phần thi Speaking Part 2 & Part 3 thiếu ảnh
  const missingParts = await prisma.examPart.findMany({
    where: {
      part_number: { in: [2, 3] },
      OR: [
        { image_url: null },
        { image_url: '' },
      ],
      exam: {
        skill: { in: ['SPEAKING', 'FULL_TEST'] },
      },
    },
    include: {
      exam: { select: { title: true } },
      questions: { select: { question_number: true, prompt: true } },
    },
  });

  console.log(`Tìm thấy ${missingParts.length} phần thi Speaking đang thiếu ảnh.`);

  if (missingParts.length === 0) {
    console.log('✅ Toàn bộ các đề thi Speaking đã có ảnh hợp lệ!');
    await prisma.$disconnect();
    return;
  }

  for (let i = 0; i < missingParts.length; i++) {
    const p = missingParts[i];
    const pNum = p.part_number as 2 | 3;
    console.log(`\n[${i + 1}/${missingParts.length}] Đang xử lý: ${p.exam.title} (Part ${pNum})`);

    try {
      const suggestions = await speakingImageIntelligenceService.getSuggestionsForPart(p.id);
      console.log(`  🔍 Phân tích: ${suggestions.analysis.summary}`);
      console.log(`  📸 Query 1: "${suggestions.analysis.searchQuery1}"`);
      if (suggestions.analysis.searchQuery2) {
        console.log(`  📸 Query 2: "${suggestions.analysis.searchQuery2}"`);
      }

      const topCandidate = suggestions.candidatePairs[0];
      if (!topCandidate) {
        console.log('  ⚠️ Không tìm thấy ảnh ứng viên phù hợp.');
        continue;
      }

      console.log(`  ✨ Chọn ứng viên: ${topCandidate.title}`);

      if (autoApply && !dryRun) {
        console.log('  ⏳ Đang tải và áp dụng ảnh vào database...');
        const res = await speakingImageIntelligenceService.applySuggestedImages(
          p.id,
          topCandidate.image1.downloadUrl,
          pNum === 3 ? topCandidate.image2?.downloadUrl : undefined
        );
        console.log(`  ✅ Hoàn tất! image_url: ${res.newImageUrl}`);
      } else {
        console.log('  (Chế độ xem trước --dry-run: Không ghi database)');
      }
    } catch (err: any) {
      console.error(`  ❌ Lỗi khi xử lý Part ${p.id}:`, err?.message || err);
    }
  }

  console.log('\n=== HOÀN TẤT TIẾN TRÌNH ===');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

