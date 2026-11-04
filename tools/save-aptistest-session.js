import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loginAndSaveSession() {
  console.log('🔐 Đang đăng nhập tài khoản: Levandatfibc8@columbed.us ...');

  const res = await fetch('https://aptistest.edu.vn/api/auth/login-cookie', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://aptistest.edu.vn',
      'Referer': 'https://aptistest.edu.vn/login',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: JSON.stringify({
      emailOrUsername: 'Levandatfibc8@columbed.us',
      password: 'Onthi01',
      rememberMe: false,
      loginContext: 'Student'
    })
  });

  const data = await res.json();
  console.log('Response body:', data);

  if (!data.result) {
    console.error('❌ Đăng nhập thất bại:', data.message);
    return;
  }

  const rawCookieHeader = res.headers.get('set-cookie');
  const match = rawCookieHeader.match(/AptisWeb\.Auth=([^;]+)/);
  const authCookieValue = match ? match[1] : '';

  const session = {
    email: 'Levandatfibc8@columbed.us',
    authCookie: authCookieValue,
    fullCookieHeader: `AptisWeb.Auth=${authCookieValue}`,
    updatedAt: new Date().toISOString()
  };

  const outputDir = path.resolve(__dirname, 'data/aptistest');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'session.json'), JSON.stringify(session, null, 2));
  console.log('💾 Đã lưu session vào tools/data/aptistest/session.json');

  // Thử kiểm tra API session-status
  console.log('\n📡 Kiểm tra /api/auth/session-status ...');
  const statusRes = await fetch('https://aptistest.edu.vn/api/auth/session-status', {
    headers: {
      'Cookie': session.fullCookieHeader,
      'User-Agent': 'Mozilla/5.0'
    }
  });
  console.log('Status code:', statusRes.status);
  try {
    const statusData = await statusRes.json();
    console.log('Session status payload:', statusData);
  } catch {
    console.log('Session status text:', await statusRes.text());
  }
}

loginAndSaveSession().catch(console.error);

