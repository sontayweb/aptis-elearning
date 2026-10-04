import fs from 'node:fs';

async function testWithRealAnonKey() {
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  const email = 'sontayweb.admin@gmail.com';
  const passwords = [
    'Taovipko0!!',
    'Taovipko0!',
    'taovipko!',
    'taovipko',
    'Taovipko0!!@#'
  ];

  console.log(`🔐 Đang thử đăng nhập tài khoản: ${email}`);

  for (const pwd of passwords) {
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password: pwd })
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`🎉🎉 ĐĂNG NHẬP THÀNH CÔNG VỚI MẬT KHẨU: "${pwd}"!`);
      console.log(`- User ID: ${data.user.id}`);
      console.log(`- Email: ${data.user.email}`);
      console.log(`- Token: ${data.access_token.substring(0, 30)}...`);

      fs.writeFileSync('tools/auth_token.json', JSON.stringify({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: data.user
      }, null, 2));

      // Kiểm tra gói của tài khoản
      const subRes = await fetch(`${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${data.user.id}&select=*`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${data.access_token}`
        }
      });
      if (subRes.ok) {
        const subs = await subRes.json();
        console.log('📦 Gói dịch vụ của tài khoản:', subs);
      }
      return;
    } else {
      console.log(`- Thử với pass "${pwd}": ${data.error_description || data.msg || data.message}`);
    }
  }

  // Thử kiểm tra signup xem email đã đăng ký chưa
  console.log('\n🔍 Kiểm tra sự tồn tại của email trên hệ thống...');
  const signupRes = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password: 'TestPassword123!@#' })
  });

  const sData = await signupRes.json();
  console.log('Kết quả kiểm tra:', JSON.stringify(sData, null, 2));
}

testWithRealAnonKey().catch(console.error);
