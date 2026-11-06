import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'aptis_secret_access_key_super_secure_2026';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'aptis_secret_refresh_key_super_secure_2026';

// Thời hạn phiên đăng nhập chuẩn cho nền tảng E-Learning:
// - Access Token: Mặc định 7 ngày (tự động nâng cấp nếu biến môi trường cũ trên server vẫn để 10m/15m/30m/1h)
// - Refresh Token: Mặc định 30 ngày để duy trì đăng nhập bền vững
function resolveAccessExpiresIn(): jwt.SignOptions['expiresIn'] {
  const raw = (process.env.JWT_EXPIRES_IN || process.env.JWT_ACCESS_EXPIRES_IN || '7d').trim();
  // Chặn các cấu hình ngắn kiểu cũ (10m, 15m, 30m, 1h) từng gây văng phiên khi học viên đang làm bài thi
  if (/^(5m|10m|15m|20m|30m|45m|60m|1h|900s|1800s|3600s)$/i.test(raw)) {
    return '7d';
  }
  return raw as jwt.SignOptions['expiresIn'];
}

function resolveRefreshExpiresIn(): jwt.SignOptions['expiresIn'] {
  const raw = (process.env.JWT_REFRESH_EXPIRES_IN || '30d').trim();
  if (/^(15m|30m|1h|1d|7d)$/i.test(raw)) {
    return '30d';
  }
  return raw as jwt.SignOptions['expiresIn'];
}

const ACCESS_EXPIRES_IN = resolveAccessExpiresIn();
const REFRESH_EXPIRES_IN = resolveRefreshExpiresIn();

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
};
