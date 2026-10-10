import mongoose from 'mongoose';
import { config } from './environment.js';

let isReplicaSet = null;

export const connectDB = async (uri = config.mongodbUri) => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Connected to ${conn.connection.host}/${conn.connection.name}`);
    
    // Check if replica set is supported
    try {
      const adminDb = mongoose.connection.db.admin();
      const status = await adminDb.command({ replSetGetStatus: 1 }).catch(() => null);
      isReplicaSet = Boolean(status && status.ok);
    } catch {
      isReplicaSet = false;
    }

    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[MongoDB] Disconnected');
  }
};

export const canUseTransactions = () => Boolean(isReplicaSet);
