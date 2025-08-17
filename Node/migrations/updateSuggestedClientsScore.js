// Migration script to add score field to existing suggested clients
import mongoose from 'mongoose';
import SuggestedClient from '../models/suggestedClientModel.js';
import { connectUsingMongoose } from '../config/mongodb.js';

async function updateSuggestedClientsScore() {
  try {
    await connectUsingMongoose();
    console.log('Connected to MongoDB');

    // Update all documents that don't have a score field or have score as null/undefined
    const result = await SuggestedClient.updateMany(
      { 
        $or: [
          { score: { $exists: false } },
          { score: null },
          { score: undefined }
        ]
      },
      { 
        $set: { score: 0 } 
      }
    );

    console.log(`Updated ${result.modifiedCount} suggested clients with score = 0`);

    // Verify the update
    const countWithScore = await SuggestedClient.countDocuments({ score: { $exists: true } });
    const totalCount = await SuggestedClient.countDocuments({});
    
    console.log(`Total suggested clients: ${totalCount}`);
    console.log(`Suggested clients with score field: ${countWithScore}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
updateSuggestedClientsScore(); 