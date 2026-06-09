/**
 * Application Configuration
 * Central place to manage all app settings
 */

const env = import.meta.env ?? {};

const getEnvValue = (key, fallback) => {
  const directValue = env[key];
  if (directValue !== undefined && directValue !== '') {
    return directValue;
  }

  const viteKey = `VITE_${key}`;
  const viteValue = env[viteKey];

  return viteValue !== undefined && viteValue !== '' ? viteValue : fallback;
};

const getEnvNumber = (key, fallback) => {
  const value = getEnvValue(key, fallback);
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
};

const config = {
  // Server Configuration
  server: {
    port: getEnvNumber('PORT', 5000),
    nodeEnv: getEnvValue('NODE_ENV', 'development'),
  },

  // Database Configuration
  database: {
    uri: getEnvValue('MONGO_URI', 'mongodb://localhost:27017/sajha'),
  },

  // Authentication
  auth: {
    jwtSecret: getEnvValue('JWT_SECRET', 'your-secret-key'),
    sessionSecret: getEnvValue('SESSION_SECRET', 'your-session-secret'),
    adminUsername: getEnvValue('ADMIN_USERNAME', 'admin@sajha.com'),
    adminPassword: getEnvValue('ADMIN_PASSWORD', 'password123'),
  },

  // Firebase
  firebase: {
    serviceAccount: getEnvValue('FIREBASE_SERVICE_ACCOUNT', null),
  },

  // Email Configuration
  email: {
    host: getEnvValue('MAIL_HOST', 'smtp.gmail.com'),
    port: getEnvNumber('MAIL_PORT', 587),
    username: getEnvValue('MAIL_USERNAME', 'your-email@gmail.com'),
    password: getEnvValue('MAIL_PASSWORD', 'your-password'),
    recipient: getEnvValue('MAIL_RECIPIENT', 'admin@yourdomain.com'),
  },

  // Upload Configuration
  upload: {
    adBucket: getEnvValue('AD_BUCKET', 'ads'),
    adBaseUrl: getEnvValue('AD_BASEURL', 'http://localhost:4000/uploads/ads'),
    collegeBucket: getEnvValue('COLLEGE_BUCKET', 'colleges'),
    collegeBaseUrl: getEnvValue('COLLEGE_BASEURL', 'http://localhost:4000/uploads/colleges'),
  },

  // Application State
  state: getEnvValue('STATE', 'development'),

  // Payment Configuration (eSewa)
  payment: {
    esewa: {
      merchantCode: getEnvValue('ESEWA_MERCHANT_CODE', 'EPAYTEST'),
      secretKey: getEnvValue('ESEWA_SECRET_KEY', '8gBm/:&EnhH.1/q'),
      environment: getEnvValue('ESEWA_ENVIRONMENT', 'test'),
    },
  },

  // URLs
  urls: {
    backendUrl: getEnvValue('BACKEND_URL', 'http://localhost:5000'),
    frontendUrl: getEnvValue('FRONTEND_URL', 'http://localhost:3000'),
  },

  // YouTube
  youtube: {
    apiKey: getEnvValue('YOUTUBE_API_KEY', ''),
  },

  // CORS Configuration
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://sajhaentrance.org',
    ],
    credentials: true,
  },
};

export default config;
