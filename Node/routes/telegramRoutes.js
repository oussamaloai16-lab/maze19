// routes/telegramRoutes.js
import express from 'express';
import cron from 'node-cron';
import TelegramService from '../services/telegramService.js';
import protect from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';

const router = express.Router();
const telegramService = new TelegramService();

// Apply authentication to all routes
router.use(protect);

// Test Telegram connection
router.get('/test', 
  checkPermission('reports', 'read'),
  async (req, res) => {
    try {
      const result = await telegramService.testConnection();
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Telegram connection successful',
          data: result.botInfo
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Telegram connection failed',
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error testing Telegram connection',
        error: error.message
      });
    }
  }
);

// Send test message
router.post('/test-message',
  checkPermission('reports', 'create'),
  async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message content is required'
        });
      }
      
      const result = await telegramService.sendMessage(message);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Test message sent successfully',
          messageId: result.messageId
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send test message',
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error sending test message',
        error: error.message
      });
    }
  }
);

// Send welcome message
router.post('/welcome',
  checkPermission('reports', 'create'),
  async (req, res) => {
    try {
      const result = await telegramService.sendWelcomeMessage();
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Welcome message sent successfully',
          messageId: result.messageId
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send welcome message',
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error sending welcome message',
        error: error.message
      });
    }
  }
);

// Send system alert
router.post('/alert',
  checkPermission('reports', 'create'),
  async (req, res) => {
    try {
      const { message, severity = 'info' } = req.body;
      
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Alert message is required'
        });
      }
      
      const validSeverities = ['info', 'warning', 'error', 'critical'];
      if (!validSeverities.includes(severity)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid severity level. Must be one of: ' + validSeverities.join(', ')
        });
      }
      
      const result = await telegramService.sendSystemAlert(message, severity);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'System alert sent successfully',
          messageId: result.messageId
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send system alert',
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error sending system alert',
        error: error.message
      });
    }
  }
);

// Send daily summary manually
router.post('/daily-summary',
  checkPermission('reports', 'create'),
  async (req, res) => {
    try {
      // Get today's transaction statistics
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      
      // You'll need to import your transaction service here
      const { TransactionService } = await import('../services/transactionService.js');
      const transactionService = new TransactionService();
      
      const stats = await transactionService.getTransactionStatistics(startOfDay, endOfDay);
      
      const result = await telegramService.sendDailySummary(stats);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Daily summary sent successfully',
          messageId: result.messageId,
          stats
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send daily summary',
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error sending daily summary',
        error: error.message
      });
    }
  }
);

// Get Telegram bot status
router.get('/status',
  checkPermission('reports', 'read'),
  async (req, res) => {
    try {
      const isEnabled = telegramService.enabled;
      
      let botInfo = null;
      if (isEnabled) {
        const testResult = await telegramService.testConnection();
        if (testResult.success) {
          botInfo = testResult.botInfo;
        }
      }
      
      res.status(200).json({
        success: true,
        data: {
          enabled: isEnabled,
          configured: !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_GROUP_CHAT_ID,
          botToken: process.env.TELEGRAM_BOT_TOKEN ? 'Set' : 'Not set',
          groupChatId: process.env.TELEGRAM_GROUP_CHAT_ID ? 'Set' : 'Not set',
          botInfo
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting Telegram status',
        error: error.message
      });
    }
  }
);

// Send manual 12 PM message (for testing)
router.post('/send-noon-message',
  checkPermission('reports', 'create'),
  async (req, res) => {
    try {
      const { customMessage } = req.body;
      
      const defaultMessage = `
🕐 *Daily 12 PM Update*

Good afternoon team! 

📊 *Mid-day Check-in:*
• Keep up the great work!
• Don't forget to update your progress
• Stay hydrated and take breaks when needed

💼 *Maze Team Notification*
      `.trim();

      const messageToSend = customMessage || defaultMessage;
      
      const result = await telegramService.sendMessage(messageToSend);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: '12 PM message sent successfully',
          messageId: result.messageId
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send 12 PM message',
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error sending 12 PM message',
        error: error.message
      });
    }
  }
);

// Send manual detailed daily report (for testing)
router.post('/send-detailed-report',
  checkPermission('reports', 'create'),
  async (req, res) => {
    try {
      const { customMessage } = req.body;
      
      if (customMessage) {
        // If custom message provided, use it
        const result = await telegramService.sendMessage(customMessage);
        
        if (result.success) {
          res.status(200).json({
            success: true,
            message: 'Custom detailed report sent successfully',
            messageId: result.messageId
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Failed to send custom detailed report',
            error: result.error
          });
        }
        return;
      }
      
      // Generate detailed report with user-specific statistics
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      
      // Import required models
      const { default: User } = await import('../models/userModel.js');
      const { default: Transaction } = await import('../models/transactionModel.js');
      const { default: SuggestedClient } = await import('../models/suggestedClientModel.js');
      
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
            localField: 'addedBy',
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

      // Get closer performance
      const closerPerformance = await User.aggregate([
        {
          $match: {
            role: { $in: ['closer', 'employee'] },
            username: { $in: ['walid', 'sohila'] }
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
                      { $eq: ['$assignedTo', '$$userId'] },
                      { $gte: ['$lastCallDate', startOfDay] },
                      { $lte: ['$lastCallDate', endOfDay] }
                    ]
                  }
                }
              }
            ],
            as: 'todayCalls'
          }
        },
        {
          $project: {
            username: 1,
            callsToday: { $size: '$todayCalls' },
            transactionsToday: { $size: '$todayTransactions' },
            closedToday: {
              $size: {
                $filter: {
                  input: '$todayTransactions',
                  cond: { $eq: ['$$this.status', 'completed'] }
                }
              }
            },
            validatedToday: {
              $size: {
                $filter: {
                  input: '$todayCalls',
                  cond: { $eq: ['$$this.status', 'validated'] }
                }
              }
            }
          }
        }
      ]);

      // Get new users added today
      const newUsers = await User.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }).select('username name').limit(10);

      // Build detailed message
      let defaultMessage = `📊 *DETAILED DAILY REPORT*\n`;
      defaultMessage += `📅 *Date:* ${today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}\n`;
      defaultMessage += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      // Leads breakdown
      defaultMessage += `👥 *LEADS ADDED TODAY:*\n`;
      let totalLeads = 0;
      if (leadsBreakdown.length > 0) {
        leadsBreakdown.forEach(lead => {
          defaultMessage += `• ${lead.count} by ${lead._id}\n`;
          totalLeads += lead.count;
        });
        defaultMessage += `*Total: ${totalLeads} leads*\n\n`;
      } else {
        defaultMessage += `• No leads added today\n\n`;
      }
      
      // Closer performance
      defaultMessage += `📞 *CLOSER PERFORMANCE:*\n`;
      if (closerPerformance.length > 0) {
        closerPerformance.forEach(closer => {
          defaultMessage += `• *${closer.username}:* ${closer.callsToday} calls, ${closer.closedToday} closed, ${closer.validatedToday} validated\n`;
        });
      } else {
        defaultMessage += `• No closer activity today\n`;
      }
      
      // Add missing closers
      const reportedClosers = closerPerformance.map(c => c.username);
      const expectedClosers = ['walid', 'sohila'];
      expectedClosers.forEach(closerName => {
        if (!reportedClosers.includes(closerName)) {
          defaultMessage += `• *${closerName}:* 0 calls, 0 closed, 0 validated\n`;
        }
      });
      defaultMessage += `\n`;
      
      // New users
      defaultMessage += `👤 *NEW USERS ADDED:*\n`;
      if (newUsers.length > 0) {
        defaultMessage += `• Admin added ${newUsers.length} user(s):\n`;
        newUsers.forEach((user, index) => {
          const displayName = user.name || user.username;
          defaultMessage += `  ${index + 1}. ${displayName}\n`;
        });
      } else {
        defaultMessage += `• No new users added today\n`;
      }
      
      defaultMessage += `\n💼 *Maze Detailed Report*`;
      
      const result = await telegramService.sendMessage(defaultMessage);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Detailed daily report sent successfully',
          messageId: result.messageId,
          stats: {
            leadsBreakdown: leadsBreakdown,
            closerPerformance: closerPerformance,
            newUsersCount: newUsers.length
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send detailed daily report',
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error sending detailed daily report',
        error: error.message
      });
    }
  }
);

// Get current scheduled tasks status
router.get('/scheduled-tasks',
  checkPermission('reports', 'read'),
  async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        data: {
          scheduledTasks: [
            {
              name: 'ZRexpress Sync',
              schedule: 'Every 30 minutes',
              status: 'Active',
              description: 'Syncs pending orders with ZRexpress API'
            },
            {
              name: '12 PM Daily Message',
              schedule: 'Every day at 12:00 PM (Algeria timezone)',
              status: 'Active',
              description: 'Sends motivational message to Telegram group'
            },
            {
              name: 'Detailed Daily Report',
              schedule: 'Every day at 5:30 PM (Algeria timezone)',
              status: 'Active',
              description: 'Sends detailed report with user-specific performance metrics'
            },
            {
              name: 'Daily Closers Report',
              schedule: 'Every day at 11:59 PM (Algeria timezone)',
              status: 'Active',
              description: 'Sends daily performance report for closers'
            }
          ],
          telegramEnabled: telegramService.enabled,
          timezone: 'Africa/Algiers'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting scheduled tasks status',
        error: error.message
      });
    }
  }
);

// Schedule a custom message for a specific time (one-time)
router.post('/schedule-custom-message',
  checkPermission('reports', 'create'),
  async (req, res) => {
    try {
      const { message, scheduleTime, timezone = 'Africa/Algiers' } = req.body;
      
      if (!message || !scheduleTime) {
        return res.status(400).json({
          success: false,
          message: 'Message and schedule time are required'
        });
      }
      
      // Parse the schedule time (expecting format like "15:30" for 3:30 PM)
      const [hour, minute] = scheduleTime.split(':').map(Number);
      
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return res.status(400).json({
          success: false,
          message: 'Invalid time format. Use HH:MM (24-hour format)'
        });
      }
      
      // Create a one-time scheduled task
      const cronExpression = `${minute} ${hour} * * *`;
      
      cron.schedule(cronExpression, async () => {
        console.log(`Sending custom scheduled message at ${scheduleTime}...`);
        try {
          const result = await telegramService.sendMessage(message);
          if (result.success) {
            console.log(`Custom message sent successfully at ${scheduleTime}`);
          } else {
            console.error(`Failed to send custom message: ${result.error}`);
          }
        } catch (error) {
          console.error(`Error sending custom message: ${error.message}`);
        }
      }, {
        timezone: timezone
      });
      
      res.status(200).json({
        success: true,
        message: `Custom message scheduled for ${scheduleTime} daily`,
        scheduleDetails: {
          time: scheduleTime,
          timezone: timezone,
          cronExpression: cronExpression,
          message: message
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error scheduling custom message',
        error: error.message
      });
    }
  }
);

// Add this route to your telegramRoutes.js for immediate testing

router.post('/test-schedule-now',
  checkPermission('reports', 'create'),
  async (req, res) => {
    try {
      // Schedule a message for 1 minute from now
      const now = new Date();
      const testTime = new Date(now.getTime() + 60000); // +1 minute
      
      const hour = testTime.getHours();
      const minute = testTime.getMinutes();
      
      const testMessage = `
🧪 *SCHEDULED TEST MESSAGE*

This message was scheduled to test the 12 PM functionality.

⏰ *Scheduled for:* ${testTime.toLocaleString('en-US', { timeZone: 'Africa/Algiers' })}
📅 *Current time:* ${now.toLocaleString('en-US', { timeZone: 'Africa/Algiers' })}

✅ *Test successful!* The scheduler is working correctly.

💼 *Maze Telegram Test*
      `.trim();

      // Create one-time scheduled task
      cron.schedule(`${minute} ${hour} * * *`, async () => {
        console.log('🧪 Sending scheduled test message...');
        try {
          const result = await telegramService.sendMessage(testMessage);
          if (result.success) {
            console.log('✅ Scheduled test message sent successfully');
          } else {
            console.error('❌ Failed to send scheduled test message:', result.error);
          }
        } catch (error) {
          console.error('❌ Error sending scheduled test message:', error);
        }
      }, {
        timezone: 'Africa/Algiers'
      });

      res.status(200).json({
        success: true,
        message: `Test message scheduled for ${testTime.toLocaleString()}`,
        scheduledFor: testTime,
        currentTime: now,
        waitTime: '1 minute'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error scheduling test message',
        error: error.message
      });
    }
  }
);

export default router;
