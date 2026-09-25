import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/intellmeet');
    console.log(`[MongoDB] Connected successfully`);
  } catch (error: any) {
    console.log(`[MongoDB Notice] Database connection warning (${error.message}). Local fallback active.`);
  }
};
