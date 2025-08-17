// services/dailyReportService.js
import cron from 'node-cron';
import SuggestedClient from '../models/suggestedClientModel.js';
import User from '../models/userModel.js';
import TelegramService from './telegramService.js';

export class DailyReportService {
  constructor() {
    this.telegramService = new TelegramService();
  }

  async generateClosersReport(date = new Date()) {
    try {
      // Get start and end of the day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all users with CLOSER role
      const closers = await User.find({ 
        role: 'Closer',
        active: true 
      }).select('_id username name email');

      if (closers.length === 0) {
        return {
          success: false,
          message: 'No active closers found'
        };
      }

      const reportData = [];
      let totalCalls = 0;
      let totalValidations = 0;

      // Generate report for each closer
      for (const closer of closers) {
        const stats = await this.getCloserDailyStats(closer._id, startOfDay, endOfDay);
        
        // Only include closers who have activity (calls or validations)
        if (stats.callsToday > 0 || stats.validationsToday > 0) {
          reportData.push({
            closerId: closer._id,
            name: closer.username || closer.name || closer.email,
            callsToday: stats.callsToday,
            validationsToday: stats.validationsToday,
            callsThisWeek: stats.callsThisWeek,
            validationsThisWeek: stats.validationsThisWeek,
            conversionRate: stats.conversionRate
          });

          totalCalls += stats.callsToday;
          totalValidations += stats.validationsToday;
        }
      }

      // If no one has submitted any activity
      if (reportData.length === 0) {
        return {
          success: true,
          date: startOfDay,
          totalClosers: closers.length,
          totalCalls: 0,
          totalValidations: 0,
          overallConversionRate: 0,
          closersData: [],
          noActivity: true,
          message: 'No closers have submitted any activity today'
        };
      }

      // Sort by number of calls (descending)
      reportData.sort((a, b) => b.callsToday - a.callsToday);

      return {
        success: true,
        date: startOfDay,
        totalClosers: closers.length,
        totalCalls,
        totalValidations,
        overallConversionRate: totalCalls > 0 ? ((totalValidations / totalCalls) * 100).toFixed(1) : 0,
        closersData: reportData
      };
    } catch (error) {
      console.error('Error generating closers report:', error);
      throw error;
    }
  }

  async getCloserDailyStats(closerId, startOfDay, endOfDay) {
    try {
      // Get calls made today by this closer
      const callsToday = await SuggestedClient.countDocuments({
        'callLogs.calledBy': closerId,
        'callLogs.callDate': {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });

      // Get validations done today by this closer
      const validationsToday = await SuggestedClient.countDocuments({
        validatedBy: closerId,
        validatedAt: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        isValidated: true
      });

      // Get weekly stats (last 7 days)
      const weekStart = new Date(startOfDay);
      weekStart.setDate(weekStart.getDate() - 7);

      const callsThisWeek = await SuggestedClient.countDocuments({
        'callLogs.calledBy': closerId,
        'callLogs.callDate': {
          $gte: weekStart,
          $lte: endOfDay
        }
      });

      const validationsThisWeek = await SuggestedClient.countDocuments({
        validatedBy: closerId,
        validatedAt: {
          $gte: weekStart,
          $lte: endOfDay
        },
        isValidated: true
      });

      // Calculate conversion rate
      const conversionRate = callsToday > 0 ? ((validationsToday / callsToday) * 100).toFixed(1) : 0;

      return {
        callsToday,
        validationsToday,
        callsThisWeek,
        validationsThisWeek,
        conversionRate
      };
    } catch (error) {
      console.error(`Error getting stats for closer ${closerId}:`, error);
      return {
        callsToday: 0,
        validationsToday: 0,
        callsThisWeek: 0,
        validationsThisWeek: 0,
        conversionRate: 0
      };
    }
  }

  async sendDailyReportToTelegram(reportData) {
    try {
      const { date, totalClosers, totalCalls, totalValidations, overallConversionRate, closersData, noActivity } = reportData;
      
      const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Create the main report message
      let message = `📊 *Daily Performance Report*\n`;
      message += `📅 *Date:* ${dateStr}\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      // Handle case when no one has submitted any activity
      if (noActivity) {
        message += `📭 *No Activity Reported*\n\n`;
        message += `📊 *Performance Statistics:*\n`;
        message += `• Active Team Members: ${totalClosers}\n`;
        message += `• Calls Made: 0\n`;
        message += `• Validations Completed: 0\n`;
        message += `• Conversion Rate: 0%\n\n`;
        
        message += `💡 *Action Required:*\n`;
        message += `• Log your daily calls and interactions\n`;
        message += `• Record client validations and outcomes\n`;
        message += `• Update progress on ongoing leads\n`;
        message += `• Report any challenges or blockers\n\n`;
        
        message += `🎯 *Objective:* Improve team productivity and lead conversion\n\n`;
        message += `🏢 *Maze Performance Report*`;
      } else {
        // Overall statistics
        message += `📈 *Team Performance Overview*\n`;
        message += `👥 Active Team Members: ${totalClosers}\n`;
        message += `📞 Total Calls Made: ${totalCalls}\n`;
        message += `✅ Total Validations: ${totalValidations}\n`;
        message += `🎯 Overall Conversion Rate: ${overallConversionRate}%\n\n`;
        
        // Handle case when only one person submitted a report
        if (closersData.length === 1) {
          const singleCloser = closersData[0];
          const cleanName = (singleCloser.name || 'Unknown').replace(/[*_`]/g, '');
          
          message += `━━━━━━━━━━━━━━━━━━━━━\n`;
          message += `👤 *Individual Performance Report*\n\n`;
          message += `🎯 *Team Member:* ${cleanName}\n`;
          message += `📞 Calls Made Today: ${singleCloser.callsToday}\n`;
          message += `✅ Validations Completed: ${singleCloser.validationsToday}\n`;
          message += `📊 Weekly Call Total: ${singleCloser.callsThisWeek}\n`;
          message += `📈 Weekly Validations: ${singleCloser.validationsThisWeek}\n`;
          message += `🎯 Personal Conversion Rate: ${singleCloser.conversionRate}%\n\n`;
          
          message += `📊 *Participation Analysis:*\n`;
          message += `• Team Participation: Low (1/${totalClosers})\n`;
          message += `• Activity Level: Individual Contributor\n`;
          message += `• Team Collaboration: Needs Improvement\n\n`;
          
          message += `💡 *Recommendation:*\n`;
          message += `Encourage other team members to submit their daily reports for comprehensive team tracking and improved collaboration.\n\n`;
          
          message += `🏆 *Recognition:*\n`;
          message += `Excellent work, ${cleanName}! Your consistent reporting demonstrates strong accountability.\n\n`;
        } else if (closersData.length < 3) {
          message += `━━━━━━━━━━━━━━━━━━━━━\n`;
          message += `👥 *Limited Team Participation*\n\n`;
          
          // Individual closer statistics
          closersData.forEach((closer, index) => {
            const position = this.getPositionEmoji(index + 1);
            const cleanName = (closer.name || 'Unknown').replace(/[*_`]/g, '');
            message += `${position} *${cleanName}*\n`;
            message += `📞 Calls: ${closer.callsToday} (Week: ${closer.callsThisWeek})\n`;
            message += `✅ Validations: ${closer.validationsToday} (Week: ${closer.validationsThisWeek})\n`;
            message += `🎯 Rate: ${closer.conversionRate}%\n\n`;
          });

          message += `📊 *Participation Analysis:*\n`;
          message += `• Team Participation: Moderate (${closersData.length}/${totalClosers})\n`;
          message += `• Activity Level: Below Average\n`;
          message += `• Team Collaboration: Needs Enhancement\n\n`;
          
          message += `💡 *Team Improvement Needed:*\n`;
          message += `• Encourage more team members to submit reports\n`;
          message += `• Improve daily communication practices\n`;
          message += `• Foster a culture of transparency\n\n`;
          
          message += `🎯 *Target:* Increase participation to 3+ daily reports\n\n`;
        } else {
          message += `━━━━━━━━━━━━━━━━━━━━━\n`;
          message += `👥 *Team Performance Breakdown*\n\n`;

          // Individual closer statistics
          closersData.forEach((closer, index) => {
            const position = this.getPositionEmoji(index + 1);
            const cleanName = (closer.name || 'Unknown').replace(/[*_`]/g, '');
            message += `${position} *${cleanName}*\n`;
            message += `📞 Calls: ${closer.callsToday} (Week: ${closer.callsThisWeek})\n`;
            message += `✅ Validations: ${closer.validationsToday} (Week: ${closer.validationsThisWeek})\n`;
            message += `🎯 Rate: ${closer.conversionRate}%\n\n`;
          });

          // Performance indicators
          message += `━━━━━━━━━━━━━━━━━━━━━\n`;
          message += `🏆 *Top Performer Recognition*\n`;
          if (closersData.length > 0) {
            const topPerformer = closersData[0];
            const cleanTopName = (topPerformer.name || 'Unknown').replace(/[*_`]/g, '');
            message += `👑 ${cleanTopName} - ${topPerformer.callsToday} calls, ${topPerformer.validationsToday} validations\n\n`;
          }
          
          message += `📊 *Participation Analysis:*\n`;
          message += `• Team Participation: High (${closersData.length}/${totalClosers})\n`;
          message += `• Activity Level: Excellent\n`;
          message += `• Team Collaboration: Outstanding\n\n`;
        }

        // Add motivational message based on performance
        if (closersData.length === 1) {
          message += `💪 *Keep up the excellent work!*\n`;
          message += `Your dedication sets a great example for the team.\n\n`;
        } else if (closersData.length < 3) {
          message += `💪 *Good progress, let's improve further!*\n`;
          message += `Encourage more team participation for better results.\n\n`;
        } else if (overallConversionRate >= 20) {
          message += `🎉 *Outstanding team performance today!*\n`;
          message += `Excellent conversion rates and team collaboration.\n\n`;
        } else if (overallConversionRate >= 10) {
          message += `👍 *Solid team performance!*\n`;
          message += `Keep up the good work and maintain momentum.\n\n`;
        } else {
          message += `💪 *Let's aim for higher conversion rates tomorrow!*\n`;
          message += `Focus on quality interactions and follow-ups.\n\n`;
        }

        message += `🏢 *Maze Performance Report*`;
      }

      // Send the message and save as report
      console.log('Sending message to Telegram:', message.substring(0, 200) + '...');
      
      const result = await this.telegramService.sendMessageAsReport(message, 'daily_closers_report', {
        reportData: {
          reportData: reportData,
          closersData: closersData,
          overallStats: {
            totalClosers,
            totalCalls,
            totalValidations,
            overallConversionRate
          }
        }
      });
      
      if (result.success) {
        console.log('Daily closers report sent to Telegram successfully');
        return { success: true, messageId: result.messageId, report: result.report };
      } else {
        console.error('Failed to send daily report to Telegram:', result.error);
        console.error('Message that failed:', message);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error sending daily report to Telegram:', error);
      return { success: false, error: error.message };
    }
  }

  getPositionEmoji(position) {
    const emojis = {
      1: '🥇',
      2: '🥈', 
      3: '🥉'
    };
    return emojis[position] || `${position}.`;
  }

  // Method to manually trigger daily report (for testing)
  async sendDailyReport(date = new Date()) {
    try {
      console.log('Generating daily closers report...');
      const reportData = await this.generateClosersReport(date);
      
      if (!reportData.success) {
        console.log('No report generated:', reportData.message);
        return reportData;
      }

      const telegramResult = await this.sendDailyReportToTelegram(reportData);
      
      return {
        success: telegramResult.success,
        reportData,
        telegramResult
      };
    } catch (error) {
      console.error('Error in sendDailyReport:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Schedule the daily report
  scheduleDailyReport() {
    // Schedule for 11:59 PM every day
    cron.schedule('59 23 * * *', async () => {
      console.log('Sending scheduled daily closers report...');
      try {
        await this.sendDailyReport();
      } catch (error) {
        console.error('Error in scheduled daily report:', error);
      }
    }, {
      timezone: 'Africa/Algiers' // Algeria timezone
    });
    
    console.log('Daily closers report scheduled for 11:59 PM (Algeria timezone)');
  }

  // Method to get a quick summary (for testing or manual checks)
  async getQuickSummary(date = new Date()) {
    try {
      const reportData = await this.generateClosersReport(date);
      
      if (!reportData.success) {
        return reportData;
      }

      return {
        success: true,
        summary: {
          date: reportData.date,
          totalClosers: reportData.totalClosers,
          totalCalls: reportData.totalCalls,
          totalValidations: reportData.totalValidations,
          conversionRate: reportData.overallConversionRate,
          topPerformer: reportData.closersData[0] || null
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default DailyReportService;

// Updated scheduleTask.js content to include daily reports
/*
// scheduledTasks.js - UPDATED VERSION
import cron from 'node-cron';
import { syncPendingOrders } from './utils/zrexpressSync.js';
import DailyReportService from './services/dailyReportService.js';

export const startScheduledTasks = () => {
  // Run sync every 30 minutes
  cron.schedule('*\/30 * * * * *', async () => {
    console.log('Running scheduled ZRexpress sync...');
    try {
      await syncPendingOrders();
    } catch (error) {
      console.error('Scheduled ZRexpress sync failed:', error);
    }
  });

  // Initialize and schedule daily reports
  const dailyReportService = new DailyReportService();
  dailyReportService.scheduleDailyReport();
  
  console.log('Scheduled tasks started');
  console.log('- ZRexpress sync: Every 30 minutes');
  console.log('- Daily closers report: Every day at 11:59 PM (Algeria timezone)');
};
*/