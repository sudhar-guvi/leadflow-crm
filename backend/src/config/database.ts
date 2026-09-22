import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

export const connectDB = async (retries = 5, delay = 2000): Promise<void> => {
  while (retries > 0) {
    try {
      const conn = await mongoose.connect(MONGODB_URI);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      
      // Create indexes for better performance
      await createIndexes();
      return;
    } catch (error) {
      retries -= 1;
      console.error(`❌ MongoDB connection error (${retries} retries left):`, error);
      if (retries === 0) {
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

const createIndexes = async (): Promise<void> => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.log('⚠️ Database not connected');
      return;
    }
    
    // Create indexes for various collections
    await db.collection('leads').createIndex({ status: 1 });
    await db.collection('leads').createIndex({ priority: 1 });
    await db.collection('leads').createIndex({ bdId: 1 });
    await db.collection('leads').createIndex({ createdAt: -1 });
    
    await db.collection('payments').createIndex({ leadId: 1 });
    await db.collection('payments').createIndex({ paymentStatus: 1 });
    
    await db.collection('followups').createIndex({ leadId: 1 });
    await db.collection('followups').createIndex({ followUpDate: 1 });
    await db.collection('followups').createIndex({ status: 1 });
    
    await db.collection('notifications').createIndex({ isRead: 1 });
    await db.collection('notifications').createIndex({ createdAt: -1 });
    
    console.log('✅ Database indexes created');
  } catch (error) {
    console.log('⚠️ Index creation skipped (may already exist)');
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log('MongoDB disconnected');
};
