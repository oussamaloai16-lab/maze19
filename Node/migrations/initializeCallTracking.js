// Migration to initialize call tracking for existing users
import mongoose from 'mongoose';
import User from '../models/userModel.js';

const initializeCallTracking = async () => {
  try {
    console.log('🔄 Starting call tracking initialization migration...');

    // Find all users who don't have callStats or have incomplete callStats
    const usersToUpdate = await User.find({
      $or: [
        { callStats: { $exists: false } },
        { 'callStats.totalCalls': { $exists: false } },
        { 'callStats.callsToday': { $exists: false } }
      ]
    });

    console.log(`📊 Found ${usersToUpdate.length} users that need call tracking initialization`);

    let updatedCount = 0;
    const today = new Date();

    for (const user of usersToUpdate) {
      try {
        // Initialize callStats for the user
        user.callStats = {
          totalCalls: 0,
          callsToday: 0,
          lastCallDate: null,
          lastCallReset: today,
          dailyCallHistory: []
        };

        await user.save();
        updatedCount++;
        console.log(`✅ Initialized call tracking for user: ${user.username}`);
      } catch (error) {
        console.error(`❌ Failed to update user ${user.username}:`, error.message);
      }
    }

    console.log(`✨ Migration completed! Updated ${updatedCount} out of ${usersToUpdate.length} users`);
    
    return {
      success: true,
      totalUsers: usersToUpdate.length,
      updatedUsers: updatedCount
    };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zrmaze')
    .then(() => {
      console.log('📡 Connected to MongoDB for migration');
      return initializeCallTracking();
    })
    .then((result) => {
      console.log('🎉 Migration result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration error:', error);
      process.exit(1);
    });
}

export default initializeCallTracking; 