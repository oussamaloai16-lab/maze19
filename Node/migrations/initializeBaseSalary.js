// migrations/initializeBaseSalary.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';

dotenv.config();

const url = process.env.DB_URL;

const connectUsingMongoose = async () => {
  try {
    await mongoose.connect(url);
    console.log('✅ MongoDB connected using mongoose');
  } catch (err) {
    console.log('❌ Error while connecting to db');
    console.log(err);
    throw err;
  }
};

const initializeBaseSalary = async () => {
  try {
    console.log('🚀 Starting Base Salary Migration...');
    await connectUsingMongoose();

    // Find users missing baseSalary or with invalid values
    const query = {
      $or: [
        { baseSalary: { $exists: false } },
        { baseSalary: null },
        { baseSalary: { $lt: 0 } },
      ],
    };

    const missingCount = await User.countDocuments(query);
    console.log(`📊 Users to update (missing/invalid baseSalary): ${missingCount}`);

    if (missingCount === 0) {
      console.log('✅ All users already have baseSalary set. No changes needed.');
      return;
    }

    const defaultBaseSalary = 35000;

    const result = await User.updateMany(query, {
      $set: { baseSalary: defaultBaseSalary },
    });

    console.log('✅ Base salary backfill complete');
    console.log(`   Matched: ${result.matchedCount || result.n}`);
    console.log(`   Modified: ${result.modifiedCount || result.nModified}`);
    console.log(`   Default baseSalary applied: ${defaultBaseSalary} DA`);
  } catch (error) {
    console.error('💥 Base Salary migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

initializeBaseSalary(); 