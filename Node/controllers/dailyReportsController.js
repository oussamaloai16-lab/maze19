// controllers/dailyReportsController.js
import { TransactionService } from '../services/transactionService.js';
import { SuggestedClientService } from '../services/suggestedClientService.js';
import DailyReportService from '../services/dailyReportService.js'; // ADD THIS IMPORT
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import TelegramService from '../services/telegramService.js';

export class DailyReportsController {
  constructor() {
    this.transactionService = new TransactionService();
    this.suggestedClientService = new SuggestedClientService();
    this.telegramService = new TelegramService();
    this.dailyReportService = new DailyReportService(); // ADD THIS LINE
  }

  // Get daily summary report
  getDailySummary = async (req, res) => {
    try {
      const { date } = req.query;
      
      // Use provided date or today
      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get transaction statistics for the day
      const transactionStats = await this.transactionService.getTransactionStatistics(
        startOfDay,
        endOfDay
      );

      // Get order statistics for the day
      const orderStats = await this.getOrderStatistics(startOfDay, endOfDay);
      
      // Get user registration statistics
      const userStats = await this.getUserStatistics(startOfDay, endOfDay);
      
      // Get suggested client statistics
      const clientStats = await this.suggestedClientService.getStatistics(
        startOfDay,
        endOfDay
      );

      // ADD: Get closer performance statistics
      const closerStats = await this.dailyReportService.generateClosersReport(targetDate);

      const summary = {
        date: targetDate.toISOString().split('T')[0],
        transactions: transactionStats,
        orders: orderStats,
        users: userStats,
        suggestedClients: clientStats,
        closers: closerStats.success ? closerStats : null, // ADD THIS LINE
        generatedAt: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error generating daily summary:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get weekly summary report
  getWeeklySummary = async (req, res) => {
    try {
      const { weekStartDate } = req.query;
      
      // Calculate week start and end
      const weekStart = weekStartDate ? new Date(weekStartDate) : this.getWeekStart();
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Get statistics for each day of the week
      const weeklyData = [];
      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(weekStart);
        dayStart.setDate(dayStart.getDate() + i);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayStats = await this.transactionService.getTransactionStatistics(
          dayStart,
          dayEnd
        );
        
        weeklyData.push({
          date: dayStart.toISOString().split('T')[0],
          dayName: dayStart.toLocaleDateString('en-US', { weekday: 'long' }),
          ...dayStats
        });
      }

      res.status(200).json({
        success: true,
        data: {
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: weekEnd.toISOString().split('T')[0],
          dailyBreakdown: weeklyData,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error generating weekly summary:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get monthly summary report
  getMonthlySummary = async (req, res) => {
    try {
      const { month, year } = req.query;
      
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
      
      const monthStart = new Date(targetYear, targetMonth, 1);
      const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

      const monthlyStats = await this.transactionService.getTransactionStatistics(
        monthStart,
        monthEnd
      );

      const orderStats = await this.getOrderStatistics(monthStart, monthEnd);
      const userStats = await this.getUserStatistics(monthStart, monthEnd);

      res.status(200).json({
        success: true,
        data: {
          month: targetMonth + 1,
          year: targetYear,
          monthName: monthStart.toLocaleDateString('en-US', { month: 'long' }),
          periodStart: monthStart.toISOString().split('T')[0],
          periodEnd: monthEnd.toISOString().split('T')[0],
          transactions: monthlyStats,
          orders: orderStats,
          users: userStats,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error generating monthly summary:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Send daily summary via Telegram
  sendDailySummaryTelegram = async (req, res) => {
    try {
      const { date } = req.body;
      
      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const stats = await this.transactionService.getTransactionStatistics(
        startOfDay,
        endOfDay
      );

      const result = await this.telegramService.sendDailySummary(stats);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Daily summary sent to Telegram successfully',
          messageId: result.messageId
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send daily summary to Telegram',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error sending daily summary to Telegram:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // NEW: Send closers daily report via Telegram
  sendClosersReportTelegram = async (req, res) => {
    try {
      const { date } = req.body;
      
      const targetDate = date ? new Date(date) : new Date();
      
      const result = await this.dailyReportService.sendDailyReport(targetDate);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Closers daily report sent to Telegram successfully',
          messageId: result.telegramResult.messageId,
          reportData: result.reportData
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send closers report to Telegram',
          error: result.error || result.telegramResult?.error
        });
      }
    } catch (error) {
      console.error('Error sending closers report to Telegram:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // NEW: Get closers performance report (without sending to Telegram)
  getClosersReport = async (req, res) => {
    try {
      const { date } = req.query;
      
      const targetDate = date ? new Date(date) : new Date();
      
      const reportData = await this.dailyReportService.generateClosersReport(targetDate);
      
      if (reportData.success) {
        res.status(200).json({
          success: true,
          data: reportData
        });
      } else {
        res.status(404).json({
          success: false,
          message: reportData.message || 'Failed to generate closers report'
        });
      }
    } catch (error) {
      console.error('Error generating closers report:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // NEW: Get quick summary of closers performance
  getClosersQuickSummary = async (req, res) => {
    try {
      const { date } = req.query;
      
      const targetDate = date ? new Date(date) : new Date();
      
      const summary = await this.dailyReportService.getQuickSummary(targetDate);
      
      if (summary.success) {
        res.status(200).json({
          success: true,
          data: summary.summary
        });
      } else {
        res.status(404).json({
          success: false,
          message: summary.error || 'Failed to generate quick summary'
        });
      }
    } catch (error) {
      console.error('Error generating closers quick summary:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // NEW: Send daily employee reports summary to Telegram
  sendDailyEmployeeReportsTelegram = async (req, res) => {
    try {
      const { date } = req.body;
      
      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { default: Report } = await import('../models/reportModel.js');
      
      // Get all employee daily reports for the day
      const reports = await Report.find({
        type: 'employee_daily_report',
        reportDate: { $gte: startOfDay, $lte: endOfDay }
      }).populate('employeeInfo.employeeId', 'username name email role');

      const dateStr = targetDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      let message = `📋 *Daily Reports Summary*\n`;
      message += `📅 *Date:* ${dateStr}\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      if (reports.length === 0) {
        message += `📭 *No Reports Submitted*\n\n`;
        message += `📊 *Statistics:*\n`;
        message += `• Total Reports: 0\n`;
        message += `• Participation Rate: 0%\n\n`;
        
        message += `💡 *Action Required:*\n`;
        message += `• Submit your daily progress reports\n`;
        message += `• Share completed tasks and achievements\n`;
        message += `• Update team on ongoing projects\n`;
        message += `• Report any blockers or challenges\n\n`;
        
        message += `🎯 *Goal:* Improve team communication and transparency\n\n`;
        message += `🏢 *Maze Team Reports*`;
      } else if (reports.length === 1) {
        const singleReport = reports[0];
        const employeeName = singleReport.employeeInfo?.employeeName || 'Unknown';
        const employeeRole = singleReport.employeeInfo?.employeeRole || 'Unknown';
        const submitTime = singleReport.createdAt.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        
        message += `👤 *Individual Report Submitted*\n\n`;
        message += `📝 *Employee:* ${employeeName}\n`;
        message += `🏢 *Role:* ${employeeRole}\n`;
        message += `⏰ *Submitted:* ${submitTime}\n\n`;
        
        if (singleReport.summary) {
          // Sanitize user content to prevent Telegram parsing errors
          const sanitizedSummary = singleReport.summary
            .replace(/[*_`[\]()~>#+=|{}.!-]/g, '') // Remove Markdown special chars
            .substring(0, 200)
            .trim();
          message += `📋 *Summary:*\n${sanitizedSummary}\n\n`;
        }
        
        if (singleReport.content) {
          // Sanitize user content to prevent Telegram parsing errors
          const sanitizedContent = singleReport.content
            .replace(/[*_`[\]()~>#+=|{}.!-]/g, '') // Remove Markdown special chars
            .replace(/\n/g, ' ') // Replace newlines with spaces
            .substring(0, 300)
            .trim();
          const contentPreview = sanitizedContent.length > 250 
            ? sanitizedContent.substring(0, 250) + '...'
            : sanitizedContent;
          message += `📄 *Details:*\n${contentPreview}\n\n`;
        }
        
        message += `📊 *Participation Statistics:*\n`;
        message += `• Total Reports: 1\n`;
        message += `• Participation Rate: Low\n`;
        message += `• Team Engagement: Needs Improvement\n\n`;
        
        message += `💡 *Recommendation:*\n`;
        message += `Encourage other team members to submit their daily reports for better collaboration and transparency.\n\n`;
        
        message += `🏆 *Recognition:*\n`;
        message += `Thank you for your consistent reporting, ${employeeName}!\n\n`;
        message += `🏢 *Maze Team Reports*`;
      } else if (reports.length < 3) {
        message += `📊 *Limited Team Participation*\n\n`;
        message += `📈 *Report Statistics:*\n`;
        message += `• Total Reports: ${reports.length}\n`;
        message += `• Participation Level: Below Average\n`;
        message += `• Team Engagement: Moderate\n\n`;
        
        message += `👥 *Submitted Reports:*\n`;
        reports.forEach((report, index) => {
          const employeeName = report.employeeInfo?.employeeName || 'Unknown';
          const employeeRole = report.employeeInfo?.employeeRole || 'Unknown';
          const submitTime = report.createdAt.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
          
          message += `${index + 1}. *${employeeName}* (${employeeRole})\n`;
          message += `   ⏰ Submitted: ${submitTime}\n`;
          
          if (report.summary) {
            // Sanitize user content to prevent Telegram parsing errors
            const sanitizedSummary = report.summary
              .replace(/[*_`[\]()~>#+=|{}.!-]/g, '') // Remove Markdown special chars
              .replace(/\n/g, ' ') // Replace newlines with spaces
              .substring(0, 100)
              .trim();
            message += `   📋 ${sanitizedSummary}\n`;
          }
          message += `\n`;
        });
        
        message += `💡 *Team Improvement Needed:*\n`;
        message += `• Encourage more team members to submit reports\n`;
        message += `• Improve daily communication practices\n`;
        message += `• Foster a culture of transparency\n\n`;
        
        message += `🎯 *Target:* Increase participation to 3+ daily reports\n\n`;
        message += `🏢 *Maze Team Reports*`;
      } else {
        message += `📈 *Excellent Team Participation*\n\n`;
        message += `📊 *Report Statistics:*\n`;
        message += `• Total Reports: ${reports.length}\n`;
        message += `• Participation Level: High\n`;
        message += `• Team Engagement: Excellent\n\n`;
        
        message += `👥 *Team Reports Summary:*\n`;
        reports.forEach((report, index) => {
          const employeeName = report.employeeInfo?.employeeName || 'Unknown';
          const employeeRole = report.employeeInfo?.employeeRole || 'Unknown';
          const submitTime = report.createdAt.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
          
          message += `${index + 1}. *${employeeName}* (${employeeRole})\n`;
          message += `   ⏰ Submitted: ${submitTime}\n`;
          
          if (report.summary) {
            // Sanitize user content to prevent Telegram parsing errors
            const sanitizedSummary = report.summary
              .replace(/[*_`[\]()~>#+=|{}.!-]/g, '') // Remove Markdown special chars
              .replace(/\n/g, ' ') // Replace newlines with spaces
              .substring(0, 100)
              .trim();
            message += `   📋 ${sanitizedSummary}\n`;
          }
          message += `\n`;
        });
        
        message += `🎉 *Outstanding Team Collaboration!*\n`;
        message += `Keep up the excellent communication and transparency.\n\n`;
        message += `🏢 *Maze Team Reports*`;
      }

      // Send to Telegram
      const telegramService = new TelegramService();
      const result = await telegramService.sendMessageAsReport(message, 'daily_employee_reports', {
        reportData: {
          date: targetDate,
          totalReports: reports.length,
          reports: reports.map(r => ({
            employeeName: r.employeeInfo?.employeeName,
            employeeRole: r.employeeInfo?.employeeRole,
            summary: r.summary,
            content: r.content,
            submittedAt: r.createdAt
          }))
        }
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Daily employee reports summary sent to Telegram successfully',
          messageId: result.messageId,
          data: {
            totalReports: reports.length,
            reports: reports
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send daily employee reports summary to Telegram',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error sending daily employee reports to Telegram:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  // Submit employee daily report
  submitEmployeeDailyReport = async (req, res) => {
    try {
      const { content, summary } = req.body;
      const userId = req.user._id;
      const user = req.user;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          status: 'fail',
          message: 'Report content is required'
        });
      }

      // Check if user already submitted a report today
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

      const { default: Report } = await import('../models/reportModel.js');
      
      const existingReport = await Report.findOne({
        type: 'employee_daily_report',
        'employeeInfo.employeeId': userId,
        reportDate: { $gte: startOfDay, $lte: endOfDay }
      });

      if (existingReport) {
        // Update existing report
        existingReport.content = content;
        existingReport.summary = summary || '';
        existingReport.updatedAt = new Date();
        
        await existingReport.save();

        return res.status(200).json({
          status: 'success',
          message: 'Daily report updated successfully',
          data: {
            report: existingReport
          }
        });
      } else {
        // Create new report
        const reportId = `EMP_DAILY_${userId}_${today.toISOString().split('T')[0]}`;
        
        const newReport = new Report({
          reportId,
          title: `Daily Report - ${user.username} - ${today.toLocaleDateString()}`,
          type: 'employee_daily_report',
          content,
          summary: summary || '',
          employeeInfo: {
            employeeId: userId,
            employeeName: user.username,
            employeeRole: user.role
          },
          reportDate: today,
          generatedBy: userId,
          status: 'generated'
        });

        await newReport.save();

        return res.status(201).json({
          status: 'success',
          message: 'Daily report submitted successfully',
          data: {
            report: newReport
          }
        });
      }
    } catch (error) {
      console.error('Submit employee daily report error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to submit daily report'
      });
    }
  };

  // Get employee daily reports
  getEmployeeDailyReports = async (req, res) => {
    try {
      const { date, employeeId, page = 1, limit = 10 } = req.query;
      const currentUserId = req.user._id;
      const currentUserRole = req.user.role;
      const { default: Report } = await import('../models/reportModel.js');

      // Build query
      const query = { type: 'employee_daily_report' };

      // Permission check: Regular employees can only see their own reports
      // Admins and managers can see all reports
      const adminRoles = ['SUPER_ADMIN', 'CHEF_DE_BUREAU', 'ACCOUNTANT'];
      if (!adminRoles.includes(currentUserRole)) {
        // Regular employee - only show their own reports
        query['employeeInfo.employeeId'] = currentUserId;
      } else {
        // Admin/Manager - can filter by specific employee if requested
        if (employeeId) {
          query['employeeInfo.employeeId'] = employeeId;
        }
      }

      // Filter by date if provided
      if (date) {
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
        query.reportDate = { $gte: startOfDay, $lte: endOfDay };
      }

      // Pagination
      const skip = (page - 1) * limit;

      const reports = await Report.find(query)
        .populate('employeeInfo.employeeId', 'username email role')
        .sort({ reportDate: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Report.countDocuments(query);

      return res.status(200).json({
        status: 'success',
        data: {
          reports,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          },
          canViewAll: adminRoles.includes(currentUserRole)
        }
      });
    } catch (error) {
      console.error('Get employee daily reports error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve daily reports'
      });
    }
  };

  // Get current user's daily report for today
  getMyTodayReport = async (req, res) => {
    try {
      const userId = req.user._id;
      const { default: Report } = await import('../models/reportModel.js');

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

      const report = await Report.findOne({
        type: 'employee_daily_report',
        'employeeInfo.employeeId': userId,
        reportDate: { $gte: startOfDay, $lte: endOfDay }
      });

      return res.status(200).json({
        status: 'success',
        data: {
          report: report || null,
          hasSubmittedToday: !!report
        }
      });
    } catch (error) {
      console.error('Get my today report error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve today\'s report'
      });
    }
  };

  // Get specific report by ID
  getReportById = async (req, res) => {
    try {
      const { reportId } = req.params;
      const currentUserId = req.user._id;
      const currentUserRole = req.user.role;
      const { default: Report } = await import('../models/reportModel.js');

      const report = await Report.findById(reportId)
        .populate('employeeInfo.employeeId', 'username email role')
        .populate('generatedBy', 'username email role');

      if (!report) {
        return res.status(404).json({
          status: 'fail',
          message: 'Report not found'
        });
      }

      // Permission check: Regular employees can only view their own reports
      const adminRoles = ['SUPER_ADMIN', 'CHEF_DE_BUREAU', 'ACCOUNTANT'];
      if (!adminRoles.includes(currentUserRole)) {
        // Check if this is the user's own report
        if (report.employeeInfo?.employeeId?._id?.toString() !== currentUserId.toString()) {
          return res.status(403).json({
            status: 'fail',
            message: 'You can only view your own reports'
          });
        }
      }

      return res.status(200).json({
        status: 'success',
        data: {
          report
        }
      });
    } catch (error) {
      console.error('Get report by ID error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve report'
      });
    }
  };

  // Helper method to get order statistics
  async getOrderStatistics(startDate, endDate) {
    try {
      const query = {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };

      const totalOrders = await Order.countDocuments(query);
      const confirmedOrders = await Order.countDocuments({
        ...query,
        status: 'confirmed'
      });
      const pendingOrders = await Order.countDocuments({
        ...query,
        status: 'pending'
      });
      const deliveredOrders = await Order.countDocuments({
        ...query,
        status: 'delivered'
      });

      return {
        totalOrders,
        confirmedOrders,
        pendingOrders,
        deliveredOrders,
        confirmationRate: totalOrders > 0 ? ((confirmedOrders / totalOrders) * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error('Error getting order statistics:', error);
      return {
        totalOrders: 0,
        confirmedOrders: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        confirmationRate: 0
      };
    }
  }

  // Helper method to get user statistics
  async getUserStatistics(startDate, endDate) {
    try {
      const query = {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };

      const newUsers = await User.countDocuments(query);
      const verifiedUsers = await User.countDocuments({
        ...query,
        isVerified: true
      });

      return {
        newUsers,
        verifiedUsers,
        verificationRate: newUsers > 0 ? ((verifiedUsers / newUsers) * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      return {
        newUsers: 0,
        verifiedUsers: 0,
        verificationRate: 0
      };
    }
  }

  // Helper method to get start of current week (Monday)
  getWeekStart(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }
}