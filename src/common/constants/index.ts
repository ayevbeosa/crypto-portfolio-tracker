export const APP_CONSTANTS = {
  API_VERSION: 'v1',
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  CACHE_TTL: 3600, // 1 hour in seconds
  RATE_LIMIT_TTL: 60000, // 1 minute in milliseconds
  RATE_LIMIT_MAX: 100,
};

export const VALIDATION_MESSAGES = {
  EMAIL_INVALID: 'Please provide a valid email address',
  EMAIL_REQUIRED: 'Email is required',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
  PASSWORD_COMPLEXITY:
    'Password must contain uppercase, lowercase, number, and special character',
  FIRST_NAME_REQUIRED: 'First name is required',
  LAST_NAME_REQUIRED: 'Last name is required',
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  BAD_REQUEST: 'Bad request',
  CONFLICT: 'Resource already exists',
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  USER_EXISTS: 'User with this email already exists',
  INVALID_TOKEN: 'Invalid or expired token',
  INACTIVE_USER: 'User account is inactive',
};

export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  LOGIN_SUCCESS: 'Logged in successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  REGISTER_SUCCESS: 'Registration successful',
};

export const CACHE_KEYS = {
  CRYPTO_PRICES: 'crypto:prices',
  CRYPTO_DETAILS: (symbol: string) => `crypto:details:${symbol}`,
  CRYPTO_HISTORY: (symbol: string, period: string) =>
    `crypto:history:${symbol}:${period}`,
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  PORTFOLIO: (portfolioId: string) => `portfolio:${portfolioId}`,
  PORTFOLIO_HOLDINGS: (portfolioId: string) =>
    `portfolio:holdings:${portfolioId}`,
};
