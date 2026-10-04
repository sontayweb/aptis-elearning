import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'sources/aptiskytich/config.json'), 'utf-8'));
  const supabaseUrl = config.supabaseUrl;
  const anonKey = config.anonKey;
  const email = 'sontayweb.admin@gmail.com';
  const password = 'Taovipko0!';

  console.log('🔐 Đang đăng nhập với:');
  console.log(`- Email: ${email}`);
  console.log(`- Password: ${password}`);

  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (res.ok && data.access_token) {
    console.log('\n🎉🎉 ĐĂNG NHẬP THÀNH CÔNG RỰC RỠ!');
    console.log(`- User ID: ${data.user.id}`);
    console.log(`- Email: ${data.user.email}`);
    console.log(`- Role: ${data.user.role}`);
    console.log(`- Metadata:`, data.user.user_metadata);
    console.log(`- Token: ${data.access_token.substring(0, 30)}...`);

    const sessionData = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
      savedAt: new Date().toISOString()
    };

    fs.writeFileSync(path.join(__dirname, 'auth_token.json'), JSON.stringify(sessionData, null, 2));
    fs.writeFileSync(path.join(__dirname, 'data/aptiskytich/session.json'), JSON.stringify(sessionData, null, 2));
    
    // Cập nhật lại config.json của aptiskytich với mật khẩu chuẩn
    config.account.password = password;
    fs.writeFileSync(path.join(__dirname, 'sources/aptiskytich/config.json'), JSON.stringify(config, null, 2));
    console.log('💾 Đã lưu session và cập nhật password chuẩn vào config.json!');

    // Kiểm tra gói PRO
    console.log('\n🔍 Đang kiểm tra gói dịch vụ (Subscription)...');
    const subRes = await fetch(`${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${data.user.id}&select=*`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${data.access_token}`
      }
    });
    if (subRes.ok) {
      const subs = await subRes.json();
      console.log('📦 Gói dịch vụ:', subs);
    }
  } else {
    console.error('❌ Lỗi đăng nhập:', data);
  }
}

main().catch(console.error);
