
import request from 'supertest';
import app from '../src/app';
import { generateTokens } from '../src/utils/token';
import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 KIỂM THỬ TÍCH HỢP: UPLOAD, GHI ĐÈ & DỌN DẸP ẢNH');
  console.log('====================================================\n');

  // 1. Tạo JWT Token Admin
  const adminTokens = generateTokens({
    userId: 'admin_test_upload_id',
    email: 'admin_upload_test@aptiskytich.vn',
    role: 'ADMIN',
  });
  const token = adminTokens.accessToken;

  // Tạo mock image buffer (1x1 transparent PNG)
  const png1Buffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  const png2Buffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mNkWP+/ngEEYGIAABk4B/5j/Qy0AAAAAElFTkSuQmCC',
    'base64'
  );

  const textBuffer = Buffer.from('this is not an image');

  let uploadedUrl1 = '';
  let uploadedUrl2 = '';

  // ──────────────────────────────────────────────────────────
  // TEST 1: Upload ảnh hợp lệ đầu tiên
  // ──────────────────────────────────────────────────────────
  console.log('TEST 1: Tải lên ảnh hợp lệ đầu tiên (PNG)...');
  const res1 = await request(app)
    .post('/api/admin/exams/upload-image')
    .set('Authorization', `Bearer ${token}`)
    .field('category', 'speaking')
    .attach('image', png1Buffer, 'picture_1.png');

  if (res1.status === 200 && res1.body.success && res1.body.data.url) {
    uploadedUrl1 = res1.body.data.url;
    console.log('✅ TEST 1 THÀNH CÔNG: URL ảnh 1 =', uploadedUrl1);

    // Kiểm tra file thực tế trên đĩa cứng
    const localPath1 = path.resolve('./uploads', uploadedUrl1.replace(/^\/?(api\/)?uploads\/?/, ''));
    if (fs.existsSync(localPath1)) {
      console.log('✅ File 1 đã được tạo vật lý trên ổ cứng:', localPath1);
    } else {
      console.error('❌ LỖI: File 1 không tồn tại trên ổ cứng!');
      process.exit(1);
    }
  } else {
    console.error('❌ TEST 1 THẤT BẠI:', res1.status, res1.body);
    process.exit(1);
  }

  // ──────────────────────────────────────────────────────────
  // TEST 2: Ghi đè / Thay thế ảnh (Tự động xóa ảnh cũ qua previousUrl)
  // ──────────────────────────────────────────────────────────
  console.log('\nTEST 2: Tải lên ảnh 2 thay thế ảnh 1 (truyền previousUrl để dọn dẹp rác)...');
  const res2 = await request(app)
    .post('/api/admin/exams/upload-image')
    .set('Authorization', `Bearer ${token}`)
    .field('category', 'speaking')
    .field('previousUrl', uploadedUrl1)
    .attach('image', png2Buffer, 'picture_2.png');

  if (res2.status === 200 && res2.body.success && res2.body.data.url) {
    uploadedUrl2 = res2.body.data.url;
    console.log('✅ TEST 2 THÀNH CÔNG: URL ảnh 2 =', uploadedUrl2);

    const localPath1 = path.resolve('./uploads', uploadedUrl1.replace(/^\/?(api\/)?uploads\/?/, ''));
    const localPath2 = path.resolve('./uploads', uploadedUrl2.replace(/^\/?(api\/)?uploads\/?/, ''));

    // Kiểm tra file 2 có trên đĩa cứng
    if (fs.existsSync(localPath2)) {
      console.log('✅ File 2 mới đã được tạo trên ổ cứng:', localPath2);
    } else {
      console.error('❌ LỖI: File 2 không tồn tại!');
      process.exit(1);
    }

    // Kiểm tra file 1 ĐÃ BỊ XÓA (không còn tồn tại rác)
    if (!fs.existsSync(localPath1)) {
      console.log('🎯 XUẤT SẮC: File 1 cũ ĐÃ ĐƯỢC TỰ ĐỘNG XÓA KHỎI Ổ ĐĨA! Không còn file rác tồn đọng.');
    } else {
      console.error('❌ LỖI: File 1 cũ vẫn còn trên ổ cứng (chưa được dọn dẹp)!');
      process.exit(1);
    }
  } else {
    console.error('❌ TEST 2 THẤT BẠI:', res2.status, res2.body);
    process.exit(1);
  }

  // ──────────────────────────────────────────────────────────
  // TEST 3: Xóa trực tiếp ảnh (Direct Removal Endpoint)
  // ──────────────────────────────────────────────────────────
  console.log('\nTEST 3: Gọi API DELETE /api/admin/exams/image để xóa ảnh 2...');
  const res3 = await request(app)
    .delete('/api/admin/exams/image')
    .set('Authorization', `Bearer ${token}`)
    .send({ url: uploadedUrl2 });

  if (res3.status === 200 && res3.body.data.deleted === true) {
    const localPath2 = path.resolve('./uploads', uploadedUrl2.replace(/^\/?(api\/)?uploads\/?/, ''));
    if (!fs.existsSync(localPath2)) {
      console.log('✅ TEST 3 THÀNH CÔNG: File 2 đã bị xóa vật lý hoàn toàn khỏi ổ đĩa!');
    } else {
      console.error('❌ LỖI: File 2 vẫn còn trên ổ cứng sau khi gọi DELETE!');
      process.exit(1);
    }
  } else {
    console.error('❌ TEST 3 THẤT BẠI:', res3.status, res3.body);
    process.exit(1);
  }

  // ──────────────────────────────────────────────────────────
  // TEST 4: Bảo mật chống Path Traversal (Cố ý xóa file ngoài uploads/exams)
  // ──────────────────────────────────────────────────────────
  console.log('\nTEST 4: Kiểm tra bảo mật chống Path Traversal (thử xóa ../../package.json)...');
  const res4 = await request(app)
    .delete('/api/admin/exams/image')
    .set('Authorization', `Bearer ${token}`)
    .send({ url: '/uploads/../../package.json' });

  // package.json không bao giờ được phép bị xóa!
  const pkgExists = fs.existsSync(path.resolve('./package.json'));
  if (pkgExists && res4.body.data.deleted === false) {
    console.log('✅ TEST 4 THÀNH CÔNG: Hệ thống đã chặn đứng hành vi xóa file ngoài thư mục!');
  } else {
    console.error('❌ LỖI BẢO MẬT: Path Traversal không được bảo vệ!');
    process.exit(1);
  }

  // ──────────────────────────────────────────────────────────
  // TEST 5: Chặn file sai MIME type
  // ──────────────────────────────────────────────────────────
  console.log('\nTEST 5: Kiểm tra từ chối file sai định dạng (text/plain)...');
  const res5 = await request(app)
    .post('/api/admin/exams/upload-image')
    .set('Authorization', `Bearer ${token}`)
    .attach('image', textBuffer, 'malicious.txt');

  if (res5.status === 400) {
    console.log('✅ TEST 5 THÀNH CÔNG: Server từ chối file không phải ảnh (MIME check pass)!');
  } else {
    console.error('❌ TEST 5 THẤT BẠI: Server không chặn file sai MIME, status =', res5.status);
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('🎉 TẤT CẢ 5 BÀI KIỂM THỬ ĐÃ PASS 100% HOÀN HẢO!');
  console.log('====================================================\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test suite gặp lỗi:', err);
  process.exit(1);
});
