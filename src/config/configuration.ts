import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'crypto_portfolio',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  ttl: parseInt(process.env.REDIS_TTL ?? '3600', 10),
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  expiresIn: process.env.JWT_EXPIRATION || '1d',
  refreshSecret:
    process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
}));

export const coinGeckoConfig = registerAs('coingecko', () => ({
  apiUrl: process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3',
  apiKey: process.env.COINGECKO_API_KEY || '',
}));

export const throttleConfig = registerAs('throttle', () => ({
  ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
  limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
}));

export const notificationsConfig = registerAs('notifications', () => ({
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true' || true,
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10) || 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from:
      process.env.SMTP_FROM ||
      '"Crypto Portfolio Tracker" <noreply@cryptoportfolio.com>',
  },
  sms: {
    enabled: process.env.SMS_ENABLED === 'true' || false,
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
  },
  push: {
    enabled: process.env.PUSH_ENABLED === 'true' || false,
    firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,
  },
}));
