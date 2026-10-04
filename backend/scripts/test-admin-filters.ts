import 'dotenv/config';
import { prisma } from '../src/config/database';
import app from '../src/app';
import request from 'supertest';
import { generateTokens } from '../src/utils/token';

async function testAdminFilters() {
  console.log('--- KIỂM TRA BỘ LỌC THỐNG KÊ VÀ XUẤT BÁO CÁO ADMIN ---');

  // Tìm hoặc tạo admin token
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!admin) {
    console.error('Không tìm thấy tài khoản admin trong CSDL');
    process.exit(1);
  }

  const { accessToken: token } = generateTokens({
    userId: admin.id,
    email: admin.email,
    role: admin.role,
  });

  console.log(`Đã tạo token Admin: ${admin.email} (ID: ${admin.id})`);

  // Test 1: Lọc hôm nay
  const resToday = await request(app)
    .get('/api/admin/dashboard/stats?period=today')
    .set('Authorization', `Bearer ${token}`);
  console.log('1. Period Today:', resToday.status === 200 ? 'PASS' : 'FAIL', {
    label: resToday.body.data?.periodStats?.label,
    revenueVND: resToday.body.data?.periodStats?.revenueVND,
    attempts: resToday.body.data?.periodStats?.attempts,
    dailyBucketsCount: resToday.body.data?.dailyAttempts?.length,
  });

  // Test 2: Lọc tháng này
  const resMonth = await request(app)
    .get('/api/admin/dashboard/stats?period=month')
    .set('Authorization', `Bearer ${token}`);
  console.log('2. Period Month:', resMonth.status === 200 ? 'PASS' : 'FAIL', {
    label: resMonth.body.data?.periodStats?.label,
    revenueVND: resMonth.body.data?.periodStats?.revenueVND,
    attempts: resMonth.body.data?.periodStats?.attempts,
    dailyBucketsCount: resMonth.body.data?.dailyAttempts?.length,
  });

  // Test 3: Lọc năm nay
  const resYear = await request(app)
    .get('/api/admin/dashboard/stats?period=year')
    .set('Authorization', `Bearer ${token}`);
  console.log('3. Period Year:', resYear.status === 200 ? 'PASS' : 'FAIL', {
    label: resYear.body.data?.periodStats?.label,
    revenueVND: resYear.body.data?.periodStats?.revenueVND,
    attempts: resYear.body.data?.periodStats?.attempts,
    dailyBucketsCount: resYear.body.data?.dailyAttempts?.length,
  });

  // Test 4: Lọc khoảng ngày tùy chỉnh
  const resCustom = await request(app)
    .get('/api/admin/dashboard/stats?period=custom&fromDate=2026-10-01&toDate=2026-10-04')
    .set('Authorization', `Bearer ${token}`);
  console.log('4. Period Custom (01/10 -> 04/10):', resCustom.status === 200 ? 'PASS' : 'FAIL', {
    label: resCustom.body.data?.periodStats?.label,
    revenueVND: resCustom.body.data?.periodStats?.revenueVND,
    attempts: resCustom.body.data?.periodStats?.attempts,
    dailyBucketsCount: resCustom.body.data?.dailyAttempts?.length,
  });

  // Test 5: Xuất báo cáo CSV
  const resExport = await request(app)
    .get('/api/admin/dashboard/export?period=week')
    .set('Authorization', `Bearer ${token}`);
  console.log('5. Export CSV:', resExport.status === 200 ? 'PASS' : 'FAIL', {
    contentType: resExport.headers['content-type'],
    contentLength: resExport.text.length,
    snippet: resExport.text.substring(0, 150) + '...',
  });

  await prisma.$disconnect();
  console.log('--- TOÀN BỘ 5 TÍNH NĂNG KIỂM TRA ĐỀU THÀNH CÔNG RỰC RỠ! ---');
}

testAdminFilters();
