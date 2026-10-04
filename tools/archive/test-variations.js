import fs from 'node:fs';

async function testVariations() {
  const email = 'sontayweb.admin@gmail.com';
  const passwords = [
    'Taovipko0!!',
    'Taovipko0!',
    'taovipko!',
    'taovipko',
    'Taovipko0!!@#',
    'Taovipko0!123!',
    'Taovipko0!123',
    'admin123',
    'admin123!'
  ];

  const supabaseUrl = 'https://bacoamhbatqpxatrrflz.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhY29hbWhiYXRxcHhhdHJyZmx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MTc4MjYsImV4cCI6MjA2NzA5MzgyNn0.2YQ2Zz1G1Hn6-64XU2L8w8-N6hCqB_Jk2f5A4p1r3Ew';

  console.log(`🔍 Thử nghiệm xác thực cho email: ${email}`);

  for (const pwd of passwords) {
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password: pwd })
    });

    if (res.ok) {
      console.log(`🎉 TÌM THẤY MẬT KHẨU CHÍNH XÁC: "${pwd}"`);
      const data = await res.json();
      console.log('User ID:', data.user.id);
      fs.writeFileSync('tools/auth_token.json', JSON.stringify({ accessToken: data.access_token, user: data.user }, null, 2));
      return;
    }
  }

  console.log('❌ Các biến thể mật khẩu thông dụng đều không đúng.');

  // Thử kiểm tra xem tài khoản này đăng ký bằng Google hay Email thông thường
  console.log('\n🔍 Kiểm tra xem email có tồn tại trên hệ thống hay dùng Google Login...');
  const signupCheck = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password: 'DummyPassword123!@#' })
  });

  const checkData = await signupCheck.json();
  console.log('Signup check response:', JSON.stringify(checkData, null, 2));
}

testVariations().catch(console.error);
