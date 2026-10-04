import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== ĐỒNG BỘ CHUẨN XÁC THEO APTISKYTICH.VN ===');
  console.log('- Reading: 32 bộ đề (Đề 01 ➔ Đề 32)');
  console.log('- Listening: 36 bộ đề (Đề 01 ➔ Đề 36)');
  console.log('- Speaking: 26 bộ đề (Đề 01 ➔ Đề 26)');
  console.log('- Writing: 62 bộ đề (62 CLB)\n');

  // 1. LISTENING: Xóa các bộ Full Listening > 36
  const allFullListening = await prisma.exam.findMany({
    where: { skill: 'LISTENING', title: { contains: 'Full Listening' } },
    select: { id: true, title: true }
  });

  let deletedListening = 0;
  for (const ex of allFullListening) {
    const m = ex.title.match(/Đề\s+(\d+)/i);
    if (m) {
      const num = parseInt(m[1], 10);
      if (num > 36) {
        await prisma.exam.delete({ where: { id: ex.id } });
        deletedListening++;
      }
    }
  }
  console.log(`✅ Đã loại bỏ ${deletedListening} đề Full Listening không trọn bộ (> 36). Còn lại chính xác: ${allFullListening.length - deletedListening} đề.`);

  // 2. SPEAKING: Xóa các bộ Full Speaking > 26
  const allFullSpeaking = await prisma.exam.findMany({
    where: { skill: 'SPEAKING', title: { contains: 'Full Speaking' } },
    select: { id: true, title: true }
  });

  let deletedSpeaking = 0;
  for (const ex of allFullSpeaking) {
    const m = ex.title.match(/Đề\s+(\d+)/i);
    if (m) {
      const num = parseInt(m[1], 10);
      if (num > 26) {
        await prisma.exam.delete({ where: { id: ex.id } });
        deletedSpeaking++;
      }
    }
  }
  console.log(`✅ Đã loại bỏ ${deletedSpeaking} đề Full Speaking ngoài danh mục chính thức (> 26). Còn lại chính xác: ${allFullSpeaking.length - deletedSpeaking} đề.`);

  // 3. KIỂM TRA LẠI SỐ LƯỢNG TRONG DB
  const countReading = await prisma.exam.count({
    where: { skill: 'READING', title: { contains: 'Full Reading' } }
  });
  const countListening = await prisma.exam.count({
    where: { skill: 'LISTENING', title: { contains: 'Full Listening' } }
  });
  const countSpeaking = await prisma.exam.count({
    where: { skill: 'SPEAKING', title: { contains: 'Full Speaking' } }
  });
  const countWriting = await prisma.exam.count({
    where: { skill: 'WRITING', title: { contains: 'Full Writing' } }
  });

  console.log('\n=== KẾT QUẢ CUỐI CÙNG TRONG DATABASE ===');
  console.log(`📖 Reading Full:   ${countReading} bộ đề (Đề 01 ➔ Đề 32)`);
  console.log(`🎧 Listening Full: ${countListening} bộ đề (Đề 01 ➔ Đề 36)`);
  console.log(`🗣️ Speaking Full:  ${countSpeaking} bộ đề (Đề 01 ➔ Đề 26)`);
  console.log(`✍️ Writing Full:   ${countWriting} bộ đề (CLB)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
