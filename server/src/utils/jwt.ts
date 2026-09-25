import jwt from 'jsonwebtoken';

export const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'super_secret_access_jwt_key_2026',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_jwt_key_2026',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};
