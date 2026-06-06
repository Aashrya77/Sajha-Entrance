/**
 * Application Configuration
 * Central place to manage all app settings
 */

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sajha',
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
    adminUsername: process.env.ADMIN_USERNAME || 'admin@sajha.com',
    adminPassword: process.env.ADMIN_PASSWORD || 'password123',
  },

  // Firebase
  firebase: {
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || null,
  },

  // Email Configuration
  email: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: process.env.MAIL_PORT || 587,
    username: process.env.MAIL_USERNAME || 'your-email@gmail.com',
    password: process.env.MAIL_PASSWORD || 'your-password',
    recipient: process.env.MAIL_RECIPIENT || 'admin@yourdomain.com',
  },

  // Upload Configuration
  upload: {
    adBucket: process.env.AD_BUCKET || 'ads',
    adBaseUrl: process.env.AD_BASEURL || 'http://localhost:4000/uploads/ads',
    collegeBucket: process.env.COLLEGE_BUCKET || 'colleges',
    collegeBaseUrl: process.env.COLLEGE_BASEURL || 'http://localhost:4000/uploads/colleges',
  },

  // Application State
  state: process.env.STATE || 'development',

  // Payment Configuration (eSewa)
  payment: {
    esewa: {
      merchantCode: process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST',
      secretKey: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
      environment: process.env.ESEWA_ENVIRONMENT || 'test',
    },
  },

  // URLs
  urls: {
    backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // YouTube
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY || '',
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
