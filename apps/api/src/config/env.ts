/** Đọc & kiểm tra biến môi trường một lần khi khởi động. */
export interface AppEnv {
  port: number;
  corsOrigins: string[];
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  loginMaxAttempts: number;
  loginWindowSeconds: number;
  engineUrl: string;
  engineTimeoutMs: number;
  matchCorridorKm: number;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name} (xem .env.example)`);
  return value;
}

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Biến môi trường ${name} phải là số`);
  return n;
}

export function loadEnv(): AppEnv {
  const jwtSecret = required('JWT_SECRET');
  if (jwtSecret.length < 32) throw new Error('JWT_SECRET phải dài ít nhất 32 ký tự');
  return {
    port: num('API_PORT', 4000),
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    databaseUrl: required('DATABASE_URL'),
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    loginMaxAttempts: num('LOGIN_MAX_ATTEMPTS', 10),
    loginWindowSeconds: num('LOGIN_WINDOW_SECONDS', 900),
    engineUrl: process.env.ENGINE_URL ?? 'http://localhost:8000',
    engineTimeoutMs: num('ENGINE_TIMEOUT_MS', 2000),
    matchCorridorKm: num('MATCH_CORRIDOR_KM', 15),
  };
}

export const APP_ENV = Symbol('APP_ENV');
