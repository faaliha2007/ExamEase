import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.NODE_ENV === 'test' 
    ? (process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/examease_test_db')
    : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/examease_db'),
  jwtSecret: process.env.JWT_SECRET || 'examease_super_secure_demo_jwt_secret_key_2026',
  jwtExpiresIn: '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
