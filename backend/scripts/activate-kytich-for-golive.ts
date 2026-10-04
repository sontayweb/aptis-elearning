import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- KÍCH HOẠT CHẾ ĐỘ GOLIVE CHUẨN 100% APTIS KỲ TÍCH ---');

  // 1. Chuyển tất cả đề thi APTIS_ACADEMY sang trạng thái is_published = false
  // để ưu tiên golive sạch sẽ, chuẩn xác 100% đề thi của Aptis Kỳ Tích
  const hideAcademy = await prisma.exam.updateMany({
    where: { source: 'APTIS_ACADEMY' },
    data: { is_published: false }
  });
  console.log(`✅ Đã ẩn tạm thời ${hideAcademy.count} đề từ Academy để chuẩn bị Golive Kỳ Tích.`);

  // 2. Đảm bảo toàn bộ 899 đề từ Aptis Kỳ Tích (kể cả 26 Full Tests) đều is_published = true
  const pubKyTich = await prisma.exam.updateMany({
    where: { source: 'APTIS_KYTICH' },
    data: { is_published: true }
  });
  console.log(`✅ Đã công khai toàn bộ ${pubKyTich.count} bộ đề chuẩn từ Aptis Kỳ Tích.`);

  // 3. Kiểm tra số lượng đề Full Test Kỳ Tích sẵn sàng
  const fullTests = await prisma.exam.findMany({
    where: {
      source: 'APTIS_KYTICH',
      skill: 'FULL_TEST',
      is_published: true
    },
    orderBy: { title: 'asc' },
    select: { id: true, title: true, duration_minutes: true }
  });

  console.log(`\n🏆 Danh sách ${fullTests.length} Đề Thi Thử Full Test (162 Phút) chuẩn Kỳ Tích sẵn sàng cho Golive:`);
  for (const ft of fullTests) {
    console.log(`  - [${ft.title}] (${ft.duration_minutes} phút)`);
  }

  // 4. Thống kê theo kỹ năng chỉ tính các đề đang published
  const publishedSkills = await prisma.exam.groupBy({
    by: ['skill'],
    where: { is_published: true },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  console.log('\n📊 Phân bố đề thi published hiện tại trên Website:');
  let totalPub = 0;
  for (const ps of publishedSkills) {
    console.log(`  - ${ps.skill}: ${ps._count.id} đề`);
    totalPub += ps._count.id;
  }
  console.log(`👉 TỔNG SỐ ĐỀ ĐANG GOLIVE TRÊN WEB: ${totalPub} bộ đề chuẩn Aptis Kỳ Tích!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
