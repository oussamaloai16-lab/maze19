// do.js - Calculate leads added in the previous 15 days
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SuggestedClient from './models/suggestedClientModel.js';
import User from './models/userModel.js';
import { connectUsingMongoose } from './config/mongodb.js';

dotenv.config();

// Function to calculate leads added in the previous 15 days
const calculateLeadsPrevious15Days = async () => {
  try {
    // Connect to MongoDB
    await connectUsingMongoose();
    console.log('Connected to MongoDB successfully');

    // Calculate date range for previous 15 days
    const today = new Date();
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(today.getDate() - 15);

    // Set time to start and end of day for accurate comparison
    const startDate = new Date(fifteenDaysAgo.getFullYear(), fifteenDaysAgo.getMonth(), fifteenDaysAgo.getDate(), 0, 0, 0, 0);
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    console.log(`\n📊 Calculating leads added between ${startDate.toLocaleDateString()} and ${endDate.toLocaleDateString()}\n`);

    // Query for leads created in the last 15 days
    const leads = await SuggestedClient.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('createdBy', 'username email role').sort({ createdAt: -1 });

    // Calculate total count
    const totalLeads = leads.length;
    console.log(`🎯 Total leads added in the last 15 days: ${totalLeads}`);

    if (totalLeads === 0) {
      console.log('❌ No leads found in the specified date range.');
      return;
    }

    // Group leads by date
    const leadsByDate = {};
    leads.forEach(lead => {
      const dateKey = lead.createdAt.toLocaleDateString();
      if (!leadsByDate[dateKey]) {
        leadsByDate[dateKey] = [];
      }
      leadsByDate[dateKey].push(lead);
    });

    // Display breakdown by date
    console.log('\n📅 Daily breakdown:');
    console.log('='.repeat(50));
    
    Object.keys(leadsByDate)
      .sort((a, b) => new Date(b) - new Date(a))
      .forEach(date => {
        const dailyLeads = leadsByDate[date];
        console.log(`📆 ${date}: ${dailyLeads.length} leads`);
        
        // Show lead details for each day
        dailyLeads.forEach((lead, index) => {
          const creatorName = lead.createdBy ? lead.createdBy.username : 'Unknown';
          console.log(`   ${index + 1}. ${lead.storeName} (${lead.wilaya}) - Created by: ${creatorName}`);
        });
        console.log('');
      });

    // Group by creator
    const leadsByCreator = {};
    leads.forEach(lead => {
      const creatorName = lead.createdBy ? lead.createdBy.username : 'Unknown';
      if (!leadsByCreator[creatorName]) {
        leadsByCreator[creatorName] = 0;
      }
      leadsByCreator[creatorName]++;
    });

    console.log('\n👥 Breakdown by creator:');
    console.log('='.repeat(30));
    Object.entries(leadsByCreator)
      .sort(([,a], [,b]) => b - a)
      .forEach(([creator, count]) => {
        console.log(`👤 ${creator}: ${count} leads`);
      });

    // Group by status
    const leadsByStatus = {};
    leads.forEach(lead => {
      if (!leadsByStatus[lead.status]) {
        leadsByStatus[lead.status] = 0;
      }
      leadsByStatus[lead.status]++;
    });

    console.log('\n📈 Breakdown by status:');
    console.log('='.repeat(30));
    Object.entries(leadsByStatus)
      .sort(([,a], [,b]) => b - a)
      .forEach(([status, count]) => {
        console.log(`📊 ${status}: ${count} leads`);
      });

    // Group by wilaya (province)
    const leadsByWilaya = {};
    leads.forEach(lead => {
      if (!leadsByWilaya[lead.wilaya]) {
        leadsByWilaya[lead.wilaya] = 0;
      }
      leadsByWilaya[lead.wilaya]++;
    });

    console.log('\n🗺️ Breakdown by wilaya:');
    console.log('='.repeat(30));
    Object.entries(leadsByWilaya)
      .sort(([,a], [,b]) => b - a)
      .forEach(([wilaya, count]) => {
        console.log(`📍 ${wilaya}: ${count} leads`);
      });

    // Calculate averages
    const averagePerDay = (totalLeads / 15).toFixed(2);
    console.log(`\n📊 Statistics:`);
    console.log(`• Average leads per day: ${averagePerDay}`);
    console.log(`• Most productive day: ${Object.entries(leadsByDate).sort(([,a], [,b]) => b.length - a.length)[0]?.[0] || 'N/A'}`);
    console.log(`• Top creator: ${Object.entries(leadsByCreator).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}`);
    console.log(`• Top wilaya: ${Object.entries(leadsByWilaya).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}`);

  } catch (error) {
    console.error('❌ Error calculating leads:', error.message);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the calculation
calculateLeadsPrevious15Days(); 