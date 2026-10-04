import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Đọc cấu hình từ file config hoặc biến
function getCredentials() {
  const configFile = path.resolve(__dirname, 'config.json');
  if (fs.existsSync(configFile)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
      if (cfg.email && cfg.password) return cfg;
    } catch { }
  }
  // Mặc định
  return {
    email: 'sontayweb.admin@gmail.com',
    password: 'Taovipko0!'
  };
}

async function loginAndGetToken() {
  console.log('=====================================================');
  console.log('🚀 TỰ ĐỘNG ĐĂNG NHẬP VÀO APTISKYTICH QUA SUPABASE AUTH');
  console.log('=====================================================\n');

  const { email, password } = getCredentials();
  console.log(`👤 Tài khoản: ${email}`);

  // Thông tin Supabase của aptiskytich.vn
  const probeFile = path.resolve(__dirname, 'probe-results.json');
  let supabaseUrl = 'https://bacoamhbatqpxatrrflz.supabase.co';
  let anonKey = null;

  if (fs.existsSync(probeFile)) {
    try {
      const pData = JSON.parse(fs.readFileSync(probeFile, 'utf-8'));
      if (pData.supabaseUrl) supabaseUrl = pData.supabaseUrl;
      if (pData.anonKey) anonKey = pData.anonKey;
    } catch { }
  }

  if (!anonKey) {
    console.log('🔍 Đang lấy anonKey từ trang chủ...');
    const res = await fetch('https://aptiskytich.vn/');
    const html = await res.text();
    const scriptMatch = html.match(/src=["'](\/assets\/index-[^"']+\.js)["']/);
    if (scriptMatch) {
      const jsCode = await (await fetch(`https://aptiskytich.vn${scriptMatch[1]}`)).text();
      const keys = jsCode.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g);
      if (keys && keys.length > 0) anonKey = keys[0];
    }
  }

  console.log('🔐 Đang gửi yêu cầu đăng nhập tới Supabase Auth...');
  const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  const authData = await authRes.json();

  if (!authRes.ok) {
    console.error(`❌ Đăng nhập thất bại (HTTP ${authRes.status}):`, authData.error_description || authData.msg || authData.message || JSON.stringify(authData));
    return;
  }

  const accessToken = authData.access_token;
  const refreshToken = authData.refresh_token;
  const user = authData.user;

  console.log('🎉 ĐĂNG NHẬP THÀNH CÔNG RỰC RỠ!');
  console.log(`- User ID: ${user.id}`);
  console.log(`- Email: ${user.email}`);
  console.log(`- Access Token (20 ký tự đầu): ${accessToken.substring(0, 20)}...`);

  // Lưu token vào tools/auth_token.json
  const tokenFile = path.resolve(__dirname, 'auth_token.json');
  fs.writeFileSync(tokenFile, JSON.stringify({
    accessToken,
    refreshToken,
    expiresAt: Date.now() + (authData.expires_in || 3600) * 1000,
    user: {
      id: user.id,
      email: user.email
    }
  }, null, 2));

  console.log(`💾 Đã lưu token vào: ${tokenFile}`);

  // Kiểm tra gói tài khoản của user (Free hay Pro)
  console.log('\n🔍 Đang kiểm tra gói dịch vụ (Tier) của tài khoản...');
  try {
    const tierRes = await fetch(`${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${user.id}&select=*`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (tierRes.ok) {
      const subs = await tierRes.json();
      console.log('Thông tin gói đăng ký:', subs);
    }
  } catch (e) {
    console.log('Lỗi kiểm tra gói:', e.message);
  }
}

loginAndGetToken().catch(err => {
  console.error('Lỗi quy trình đăng nhập:', err.message);
});
