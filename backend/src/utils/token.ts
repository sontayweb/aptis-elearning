import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'aptis_secret_access_key_super_secure_2026';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'aptis_secret_refresh_key_super_secure_2026';

// Thời hạn phiên đăng nhập chuẩn cho nền tảng E-Learning:
// - Access Token: Mặc định 7 ngày (hoặc cấu hình qua JWT_EXPIRES_IN / JWT_ACCESS_EXPIRES_IN) để học viên làm bài thi và admin quản trị không bị gián đoạn giữa chừng
// - Refresh Token: Mặc định 30 ngày (hoặc JWT_REFRESH_EXPIRES_IN) để duy trì đăng nhập bền vững
const ACCESS_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || process.env.JWT_ACCESS_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
const REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as jwt.SignOptions['expiresIn'];

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
