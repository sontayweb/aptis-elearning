import { prisma } from '../src/config/database';

async function check() {
  const settings = await prisma.systemSetting.findMany();
  console.log('Settings:');
  for (const s of settings) {
    console.log(`Key: ${s.key}, Value:`, JSON.stringify(s.value)?.slice(0, 200));
  }
  await prisma.$disconnect();
}
check();
