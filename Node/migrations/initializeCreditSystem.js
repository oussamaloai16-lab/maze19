// migrations/initializeCreditSystem.js
// FIXED VERSION - Copy this entire code to replace your current migration file

import mongoose from 'mongoose';
import User from '../models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

// Use your existing MongoDB connection pattern
const url = process.env.DB_URL;

const connectUsingMongoose = async () => {
  try {
    await mongoose.connect(url);
    console.log("✅ MongoDB connected using mongoose");
  } catch (err) {
    console.log("❌ Error while connecting to db");
    console.log(err);
    throw err;
  }
};

const initializeCreditSystem = async () => {
  try {
    // Connect to MongoDB using your existing connection function
    console.log('🚀 Starting Credit System Migration...');
    await connectUsingMongoose();

    // Find all CLOSER users who don't have credits initialized
    const closers = await User.find({
      role: 'CLOSER',
      $or: [
        { 'credits': { $exists: false } },
        { 'credits.current': { $exists: false } },
        { 'credits.current': null }
      ]
    });

    console.log(`📊 Found ${closers.length} closers that need credit initialization`);

    if (closers.length === 0) {
      console.log('✅ All closers already have credits initialized!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const closer of closers) {
      try {
        // Initialize credits for each closer
        closer.credits = {
          current: 100, // Starting with 100 credits
          total: 100,
          used: 0,
          lastRecharge: new Date(),
          history: [{
            type: 'recharge',
            amount: 100,
            reason: 'Initial credit allocation - system migration',
            date: new Date(),
            adminId: null // System migration
          }]
        };

        await closer.save();
        console.log(`✅ Initialized 100 credits for: ${closer.username} (${closer.email})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to initialize credits for ${closer.username}:`, error.message);
        errorCount++;
      }
    }

    // Clean up non-CLOSER users who might have credits field
    console.log('\n🧹 Cleaning up non-closers...');
    const nonClosers = await User.find({
      role: { $ne: 'CLOSER' },
      'credits': { $exists: true }
    });

    console.log(`Found ${nonClosers.length} non-closers with credits field that need cleanup`);

    for (const user of nonClosers) {
      try {
        await User.updateOne(
          { _id: user._id },
          { $unset: { credits: "" } }
        );
        console.log(`✅ Removed credits field from ${user.username} (${user.role})`);
      } catch (error) {
        console.error(`❌ Failed to remove credits from ${user.username}:`, error.message);
      }
    }

    console.log('\n🎉 Migration Complete!');
    console.log('📊 Summary:');
    console.log(`  ✅ Closers initialized: ${successCount}`);
    console.log(`  ❌ Failed: ${errorCount}`);
    console.log(`  🧹 Non-closers cleaned: ${nonClosers.length}`);
    
    if (successCount > 0) {
      console.log('\n🚀 Your credit system is now ready!');
      console.log('   - Closers can now reveal phone numbers');
      console.log('   - Each closer starts with 100 credits');
      console.log('   - Admins can add more credits via the admin panel');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    console.error('   Please check your MongoDB connection and try again');
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the migration
console.log('🚀 Starting Credit System Migration...');
initializeCreditSystem();