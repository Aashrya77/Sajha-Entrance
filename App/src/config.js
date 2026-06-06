/**
 * Application Configuration
 * Central place to manage all app settings
 */

const config = {
  // Server Configuration
  server: {
    port: process.env.REACT_APP_PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Database Configuration
  database: {
    uri: process.env.REACT_APP_MONGODB_URI || 'mongodb://localhost:27017/sajha',
  },

  // Authentication
  auth: {
    jwtSecret: process.env.REACT_APP_JWT_SECRET || 'your-secret-key',
    sessionSecret: process.env.REACT_APP_SESSION_SECRET || 'your-session-secret',
    adminUsername: process.env.REACT_APP_ADMIN_USERNAME || 'admin@sajha.com',
    adminPassword: process.env.REACT_APP_ADMIN_PASSWORD || 'password123',
  },

  // Firebase
  firebase: {
    serviceAccount: process.env.REACT_APP_FIREBASE_SERVICE_ACCOUNT || null,
  },

  // Email Configuration
  email: {
    host: process.env.REACT_APP_MAIL_HOST || 'smtp.gmail.com',
    port: process.env.REACT_APP_MAIL_PORT || 587,
    username: process.env.REACT_APP_MAIL_USERNAME || 'your-email@gmail.com',
    password: process.env.REACT_APP_MAIL_PASSWORD || 'your-password',
    recipient: process.env.REACT_APP_MAIL_RECIPIENT || 'admin@yourdomain.com',
  },

  // Upload Configuration
  upload: {
    adBucket: process.env.REACT_APP_AD_BUCKET || 'ads',
    adBaseUrl: process.env.REACT_APP_AD_BASEURL || 'http://localhost:4000/uploads/ads',
    collegeBucket: process.env.REACT_APP_COLLEGE_BUCKET || 'colleges',
    collegeBaseUrl: process.env.REACT_APP_COLLEGE_BASEURL || 'http://localhost:4000/uploads/colleges',
  },

  // Application State
  state: process.env.REACT_APP_STATE || 'development',

  // Payment Configuration (eSewa)
  payment: {
    esewa: {
      merchantCode: process.env.REACT_APP_ESEWA_MERCHANT_CODE || 'EPAYTEST',
      secretKey: process.env.REACT_APP_ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
      environment: process.env.REACT_APP_ESEWA_ENVIRONMENT || 'test',
    },
  },

  // URLs
  urls: {
    backendUrl: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000',
    frontendUrl: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000',
  },

  // YouTube
  youtube: {
    apiKey: process.env.REACT_APP_YOUTUBE_API_KEY || '',
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
