// Migration script to remove duplicate suggested clients based on phone number
import mongoose from 'mongoose';
import SuggestedClient from '../models/suggestedClientModel.js';
import { connectUsingMongoose } from '../config/mongodb.js';

async function removeDuplicateSuggestedClients() {
  try {
    await connectUsingMongoose();
    console.log('Connected to MongoDB');
    console.log('Starting duplicate removal process...\n');

    // Step 1: Find all duplicates based on phoneNumber
    const duplicates = await SuggestedClient.aggregate([
      {
        $group: {
          _id: "$phoneNumber",
          count: { $sum: 1 },
          clients: { 
            $push: { 
              id: "$_id", 
              suggestedClientId: "$suggestedClientId",
              storeName: "$storeName",
              createdAt: "$createdAt",
              status: "$status"
            } 
          }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate phone numbers found. Database is clean!');
      process.exit(0);
    }

    console.log(`Found ${duplicates.length} phone numbers with duplicates:`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let totalDuplicatesRemoved = 0;
    const removalLog = [];

    // Step 2: Process each group of duplicates
    for (const duplicate of duplicates) {
      const phoneNumber = duplicate._id;
      const clients = duplicate.clients;
      
      console.log(`📞 Phone Number: ${phoneNumber}`);
      console.log(`   Found ${clients.length} duplicates:`);
      
      // Sort by creation date (oldest first)
      clients.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      // Keep the oldest record, mark others for deletion
      const keepRecord = clients[0];
      const deleteRecords = clients.slice(1);
      
      console.log(`   ✅ Keeping: ${keepRecord.suggestedClientId} - ${keepRecord.storeName} (${keepRecord.status}) - Created: ${new Date(keepRecord.createdAt).toLocaleDateString()}`);
      
      // Delete the duplicates
      for (const record of deleteRecords) {
        try {
          await SuggestedClient.findByIdAndDelete(record.id);
          console.log(`   ❌ Deleted: ${record.suggestedClientId} - ${record.storeName} (${record.status}) - Created: ${new Date(record.createdAt).toLocaleDateString()}`);
          
          removalLog.push({
            phoneNumber,
            deletedId: record.suggestedClientId,
            deletedStoreName: record.storeName,
            deletedStatus: record.status,
            deletedCreatedAt: record.createdAt,
            keptId: keepRecord.suggestedClientId,
            keptStoreName: keepRecord.storeName
          });
          
          totalDuplicatesRemoved++;
        } catch (error) {
          console.error(`   ⚠️  Error deleting ${record.suggestedClientId}:`, error.message);
        }
      }
      
      console.log(''); // Empty line for better readability
    }

    // Step 3: Summary and verification
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 MIGRATION SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Total duplicates removed: ${totalDuplicatesRemoved}`);
    console.log(`📞 Phone numbers cleaned: ${duplicates.length}`);
    
    // Verify no duplicates remain
    const remainingDuplicates = await SuggestedClient.aggregate([
      {
        $group: {
          _id: "$phoneNumber",
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    if (remainingDuplicates.length === 0) {
      console.log('✅ Verification passed: No duplicates remain in the database');
    } else {
      console.log(`⚠️  Warning: ${remainingDuplicates.length} duplicate phone numbers still exist`);
    }

    // Final count
    const finalCount = await SuggestedClient.countDocuments({});
    console.log(`📈 Total suggested clients remaining: ${finalCount}`);
    
    console.log('\n🎉 Migration completed successfully!');
    
    // Optional: Log detailed removal information to file if needed
    if (removalLog.length > 0) {
      console.log('\n📝 Detailed removal log available in migration output above');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the migration
console.log('🚀 Starting Duplicate Suggested Clients Removal Migration');
console.log('⏰ Started at:', new Date().toLocaleString());
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

removeDuplicateSuggestedClients(); 