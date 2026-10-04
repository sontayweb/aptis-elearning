import fs from 'node:fs';

async function testAuth() {
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  const testEmail = `student_${Date.now()}@gmail.com`;
  const testPassword = 'Password123!@#';

  console.log(`🔐 Thử đăng ký tài khoản miễn phí trên aptiskytich qua Supabase Auth...`);
  console.log(`Email: ${testEmail}`);

  try {
    const signupRes = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        data: {
          full_name: 'Test Student'
        }
      })
    });

    console.log(`Signup HTTP Status: ${signupRes.status}`);
    const resData = await signupRes.json();
    console.log(`Signup result:`, JSON.stringify(resData, null, 2).substring(0, 500));

    let accessToken = resData.access_token;

    // Nếu signup yêu cầu confirm email hoặc không trả token, thử signin
    if (!accessToken) {
      console.log('Chưa có access_token trực tiếp từ signup (có thể cần confirm email hoặc thử đăng nhập ẩn danh)');
    } else {
      console.log('🎉 ĐÃ CÓ ACCESS TOKEN!');
      fs.writeFileSync('tools/auth_token.json', JSON.stringify({ accessToken, user: resData.user }, null, 2));

      // Thử query lại exam_questions với Access Token vừa tạo!
      const sampleExamId = 'fd25320e-6dee-42b0-90ed-afab0eb9a92d'; // Đề 01 - Reading Part 1 (Free)
      console.log(`\n🔍 Thử lấy câu hỏi cho đề "${sampleExamId}" với Access Token...`);

      const qRes = await fetch(`${supabaseUrl}/rest/v1/exam_questions?exam_set_id=eq.${sampleExamId}&order=order_index.asc`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log(`HTTP Status: ${qRes.status}`);
      if (qRes.ok) {
        const questions = await qRes.json();
        console.log(`🎉 KÉO THÀNH CÔNG ${questions.length} CÂU HỎI VỚI ACCESS TOKEN!`);
        if (questions.length > 0) {
          console.log('Mẫu câu hỏi:', JSON.stringify(questions[0], null, 2));
          fs.writeFileSync('tools/pulled-exam-with-auth.json', JSON.stringify(questions, null, 2));
        }
      } else {
        console.log('Lỗi query:', await qRes.text());
      }
    }
  } catch (err) {
    console.error('Lỗi test auth:', err.message);
  }
}

testAuth().catch(console.error);
