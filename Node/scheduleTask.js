// scheduleTask.js - Daily Report Tasks
import cron from 'node-cron';
import TelegramService from './services/telegramService.js';

export const startScheduledTasks = () => {
  // Initialize services
  const telegramService = new TelegramService();

  // Employee Daily Reports - Send to Telegram at 11:00 PM every day
  cron.schedule('55 20 * * *', async () => {
    console.log('Sending employee daily reports to Telegram at 11:43 PM...');
    try {
      // Import Report model
      const { default: Report } = await import('./models/reportModel.js');
      
      // Get today's date
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      
      // Get all employee daily reports for today
      const employeeReports = await Report.find({
        type: 'employee_daily_report',
        reportDate: { $gte: startOfDay, $lte: endOfDay }
      }).populate('employeeInfo.employeeId', 'username email role');
  
      if (employeeReports.length === 0) {
        console.log('No employee daily reports found for today');
        await telegramService.sendMessage(
          `🏢 *Maze Daily Comprehensive Report*\n` +
          `📅 *Daily Reports - ${today.toLocaleDateString()}*\n\n` +
          `❌ No employee reports submitted today.`,
          { parse_mode: 'Markdown' }
        );
        return;
      }
  
      // Format reports for Telegram with proper spacing
      let telegramMessage = `🏢 *Maze Daily Comprehensive Report*\n`;
      telegramMessage += `📅 *Daily Reports - ${today.toLocaleDateString()}*\n`;
      telegramMessage += `⏰ ${today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n\n`;
      
      employeeReports.forEach((report, index) => {
        const employeeName = report.employeeInfo.employeeName || 'Unknown Employee';
        const role = report.employeeInfo.employeeRole || 'Unknown Role';
        
        // Clean and format the content
        let content = report.content || 'No tasks reported';
        
        // Split content into sections if it contains typical markers
        const sections = content.split(/(?=[-•]\s*[A-Za-z])/);
        let formattedContent = '';
        
        sections.forEach(section => {
          const trimmedSection = section.trim();
          if (trimmedSection) {
            // Clean up the section
            let cleanSection = trimmedSection
              .replace(/^[-•]\s*/, '') // Remove bullet points
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();
            
            if (cleanSection.length > 500) {
              cleanSection = cleanSection.substring(0, 500) + '...';
            }
            
            formattedContent += `  • ${cleanSection}\n`;
          }
        });
        
        // If no sections found, format as single block
        if (!formattedContent) {
          const cleanContent = content
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 150) + (content.length > 150 ? '...' : '');
          formattedContent = `  ${cleanContent}\n`;
        }
        
        // Add employee section
        telegramMessage += `👤 *${employeeName}* _(${role.toUpperCase()})_\n`;
        telegramMessage += `📝 *Tasks:*\n`;
        telegramMessage += formattedContent;
        telegramMessage += '\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      });
      
      // Add summary
      telegramMessage += `📊 *Total reports:* ${employeeReports.length}`;
      
      // Send to Telegram with Markdown formatting
      const result = await telegramService.sendMessage(telegramMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
      
      if (result.success) {
        console.log('Employee daily reports sent to Telegram successfully');
        
        // Update reports as sent
        await Report.updateMany(
          {
            type: 'employee_daily_report',
            reportDate: { $gte: startOfDay, $lte: endOfDay }
          },
          {
            $set: {
              'telegramInfo.sent': true,
              'telegramInfo.messageId': result.messageId,
              'telegramInfo.sentAt': new Date()
            }
          }
        );
      } else {
        console.error('Failed to send employee daily reports to Telegram:', result.error);
      }
    } catch (error) {
      console.error('Error in employee daily reports scheduled task:', error);
    }
  });

  // Daily detailed report at 10:00 PM
  cron.schedule('59 20 * * *', async () => {
    console.log('Sending scheduled 10:00 PM detailed daily report to Telegram...');
    try {
      // Get today's statistics
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      
      // Import required models
      const { default: User } = await import('./models/userModel.js');
      const { default: Transaction } = await import('./models/transactionModel.js');
      const { default: SuggestedClient } = await import('./models/suggestedClientModel.js');
      const { default: Appointment } = await import('./models/appointmentModel.js');
      
      // Get leads breakdown by user
      const leadsBreakdown = await SuggestedClient.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay, $lte: endOfDay }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'addedByUser'
          }
        },
        {
          $unwind: '$addedByUser'
        },
        {
          $group: {
            _id: '$addedByUser.username',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      // Get appointments for today
      const todayAppointments = await Appointment.aggregate([
        {
          $match: {
            appointmentDate: { $gte: startOfDay, $lte: endOfDay }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'assignedTo',
            foreignField: '_id',
            as: 'assignedUser'
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            appointments: { $push: '$$ROOT' }
          }
        }
      ]);

      // Get closer performance (calls, validations, closings)
      const closerPerformance = await User.aggregate([
        {
          $match: {
            role: { $in: ['CLOSER', 'closer', 'employee', 'SUPER_ADMIN'] },
            username: { $in: ['ahmed','yahoo','rachid'] }
          }
        },
        {
          $lookup: {
            from: 'transactions',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$closerId', '$$userId'] },
                      { $gte: ['$createdAt', startOfDay] },
                      { $lte: ['$createdAt', endOfDay] }
                    ]
                  }
                }
              }
            ],
            as: 'todayTransactions'
          }
        },
        {
          $lookup: {
            from: 'suggestedclients',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$validatedBy', '$$userId'] },
                      { $gte: ['$validatedAt', startOfDay] },
                      { $lte: ['$validatedAt', endOfDay] }
                    ]
                  }
                }
              }
            ],
            as: 'todayValidations'
          }
        },
        {
          $project: {
            username: 1,
            callsToday: { $ifNull: ['$callStats.callsToday', 0] },
            transactionsToday: { $size: '$todayTransactions' },
            closedToday: {
              $size: {
                $filter: {
                  input: '$todayTransactions',
                  cond: { $eq: ['$$this.status', 'completed'] }
                }
              }
            },
            validatedToday: { $size: '$todayValidations' }
          }
        }
      ]);

      // Get new users added today
      const newUsers = await User.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }).select('username name role').limit(10);

      // Get total transactions today
      const todayTransactions = await Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay, $lte: endOfDay }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      // Build the detailed message
      let message = `📊 *COMPREHENSIVE DAILY REPORT - 12:00 PM*\n`;
      message += `📅 *Date:* ${today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      // Leads breakdown
      message += `👥 *LEADS ADDED TODAY:*\n`;
      let totalLeads = 0;
      if (leadsBreakdown.length > 0) {
        leadsBreakdown.forEach(lead => {
          message += `• ${lead.count} by ${lead._id}\n`;
          totalLeads += lead.count;
        });
        message += `*Total: ${totalLeads} leads*\n\n`;
      } else {
        message += `• No leads added today\n\n`;
      }
      
      // Appointments section
      message += `📅 *APPOINTMENTS TODAY:*\n`;
      let totalAppointments = 0;
      if (todayAppointments.length > 0) {
        todayAppointments.forEach(statusGroup => {
          message += `• ${statusGroup._id}: ${statusGroup.count}\n`;
          totalAppointments += statusGroup.count;
        });
        message += `*Total: ${totalAppointments} appointments*\n\n`;
      } else {
        message += `• No appointments today\n\n`;
      }
      
      // Closer performance
      message += `📞 *CLOSER PERFORMANCE:*\n`;
      if (closerPerformance.length > 0) {
        closerPerformance.forEach(closer => {
          message += `• *${closer.username}:* ${closer.callsToday} calls, ${closer.closedToday} closed, ${closer.validatedToday} validated\n`;
        });
      } else {
        message += `• No closer activity today\n`;
      }
      message += `\n`;
      
      // Transactions section
      message += `💰 *TRANSACTIONS TODAY:*\n`;
      if (todayTransactions.length > 0) {
        let totalTransactionAmount = 0;
        todayTransactions.forEach(transGroup => {
          message += `• ${transGroup._id}: ${transGroup.count} (${transGroup.totalAmount || 0} DA)\n`;
          totalTransactionAmount += transGroup.totalAmount || 0;
        });
        message += `*Total Amount: ${totalTransactionAmount} DA*\n\n`;
      } else {
        message += `• No transactions today\n\n`;
      }
      
      // New users added
      message += `👤 *NEW USERS ADDED:*\n`;
      if (newUsers.length > 0) {
        message += `• Admin added ${newUsers.length} user(s):\n`;
        newUsers.forEach((user, index) => {
          const displayName = user.name || user.username;
          message += `  ${index + 1}. ${displayName} (${user.role})\n`;
        });
      } else {
        message += `• No new users added today\n`;
      }
      
      message += `\n💼 *Maze Daily Comprehensive Report*`;
      
      const result = await telegramService.sendMessageAsReport(message, 'comprehensive_report', {
        reportData: {
          leadsBreakdown,
          todayAppointments,
          closerPerformance,
          todayTransactions,
          newUsers: newUsers.length,
          totalLeads,
          totalAppointments
        }
      });
      
      if (result.success) {
        console.log('10:00 PM comprehensive daily report sent successfully to Telegram');
      } else {
        console.error('Failed to send 10:00 PM comprehensive report:', result.error);
      }
    } catch (error) {
      console.error('Error sending 10:00 PM comprehensive report:', error);
    }
  }, {
    timezone: 'Africa/Algiers' // Algeria timezone
  });

  // COMMENTED OUT: Static template for 11:30 PM
  /*
  cron.schedule('30 23 * * *', async () => {
    console.log('Sending scheduled 11:30 PM static template to Telegram...');
    try {
      const today = new Date();
      
      let message = `🌙 *LATE NIGHT SUMMARY - 11:30 PM*\n`;
      message += `📅 *Date:* ${today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      message += `🎯 *END OF DAY HIGHLIGHTS:*\n`;
      message += `• Total leads processed: [DYNAMIC_COUNT]\n`;
      message += `• Appointments completed: [DYNAMIC_COUNT]\n`;
      message += `• Successful closures: [DYNAMIC_COUNT]\n`;
      message += `• Revenue generated: [DYNAMIC_AMOUNT]€\n\n`;
      
      message += `👥 *TEAM PERFORMANCE:*\n`;
      message += `• Top performer: [DYNAMIC_USER]\n`;
      message += `• Most leads added: [DYNAMIC_USER]\n`;
      message += `• Most calls made: [DYNAMIC_USER]\n\n`;
      
      message += `📈 *METRICS SUMMARY:*\n`;
      message += `• Conversion rate: [DYNAMIC_PERCENTAGE]%\n`;
      message += `• Average deal size: [DYNAMIC_AMOUNT]€\n`;
      message += `• Client satisfaction: [DYNAMIC_RATING]/5\n\n`;
      
      message += `💡 *TOMORROW'S FOCUS:*\n`;
      message += `• Follow up on pending leads\n`;
      message += `• Process scheduled appointments\n`;
      message += `• Continue closing pipeline\n\n`;
      
      message += `🌟 *Good night team! Rest well for tomorrow's success.*\n`;
      message += `💼 *Maze Team - Static Template*`;

      const result = await telegramService.sendMessage(message);
      
      if (result.success) {
        console.log('11:30 PM static template sent successfully to Telegram');
      } else {
        console.error('Failed to send 11:30 PM static template:', result.error);
      }
    } catch (error) {
      console.error('Error sending 11:30 PM static template:', error);
    }
  }, {
    timezone: 'Africa/Algiers' // Algeria timezone
  });
  */

  console.log('Scheduled tasks initialized successfully');
  console.log('- Daily comprehensive report at 10:00 PM');
  console.log('- Static template for 11:30 PM (commented out)');
};

export const getTelegramService = () => new TelegramService();