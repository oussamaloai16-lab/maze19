import Report from '../models/reportModel.js';

export class ReportService {
  constructor() {
    this.reportTypeMapping = {
      'daily_transaction_summary': 'Daily Transaction Summary',
      'detailed_daily_report': 'Detailed Daily Report',
      'daily_closers_report': 'Daily Closers Report',
      'comprehensive_report': 'Comprehensive Daily Report',
      'custom_report': 'Custom Report'
    };
  }

  // Create and save a report to database
  async createReport(reportData) {
    try {
      const {
        type,
        content,
        reportDate = new Date(),
        telegramMessageId = null,
        chatId = null,
        isAutomated = true,
        generatedBy = null,
        additionalData = {}
      } = reportData;

      // Generate title based on type
      const title = this.generateReportTitle(type, reportDate);
      
      // Parse metrics from content
      const metrics = this.parseMetricsFromContent(content, type);
      
      // Generate summary
      const summary = this.generateSummary(content, metrics);

      const report = new Report({
        title,
        type,
        content,
        summary,
        reportData: additionalData,
        reportDate: new Date(reportDate),
        generatedBy,
        isAutomated,
        metrics,
        telegramInfo: {
          sent: telegramMessageId ? true : false,
          messageId: telegramMessageId,
          chatId,
          sentAt: telegramMessageId ? new Date() : null
        },
        status: telegramMessageId ? 'sent' : 'generated'
      });

      await report.save();
      console.log(`📊 Report saved to database: ${report.reportId}`);
      
      return {
        success: true,
        report
      };
    } catch (error) {
      console.error('Error creating report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate report title based on type and date
  generateReportTitle(type, reportDate) {
    const date = new Date(reportDate);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    
    const baseTitle = this.reportTypeMapping[type] || 'Report';
    return `${baseTitle} - ${dateStr}`;
  }

  // Parse metrics from report content based on type
  parseMetricsFromContent(content, type) {
    const metrics = {
      totalTransactions: 0,
      totalAmount: 0,
      totalLeads: 0,
      totalCalls: 0,
      totalValidations: 0,
      conversionRate: 0,
      activeClosers: 0,
      newUsers: 0
    };

    try {
      switch (type) {
        case 'daily_transaction_summary':
          this.parseTransactionSummaryMetrics(content, metrics);
          break;
        case 'detailed_daily_report':
          this.parseDetailedReportMetrics(content, metrics);
          break;
        case 'daily_closers_report':
          this.parseClosersReportMetrics(content, metrics);
          break;
        case 'comprehensive_report':
          this.parseComprehensiveReportMetrics(content, metrics);
          break;
        default:
          // For custom reports, try to parse general metrics
          this.parseGeneralMetrics(content, metrics);
      }
    } catch (error) {
      console.warn('Error parsing metrics from content:', error.message);
    }

    return metrics;
  }

  // Parse transaction summary metrics
  parseTransactionSummaryMetrics(content, metrics) {
    const transactionMatch = content.match(/Total Transactions:\*\s*(\d+)/i);
    if (transactionMatch) {
      metrics.totalTransactions = parseInt(transactionMatch[1]);
    }

    const amountMatch = content.match(/Total Amount:\*\s*([0-9,]+(?:\.[0-9]+)?)/i);
    if (amountMatch) {
      metrics.totalAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }
  }

  // Parse detailed report metrics
  parseDetailedReportMetrics(content, metrics) {
    const leadsMatch = content.match(/Total:\s*(\d+)\s*leads/i);
    if (leadsMatch) {
      metrics.totalLeads = parseInt(leadsMatch[1]);
    }

    const newUsersMatch = content.match(/Admin added\s*(\d+)\s*user/i);
    if (newUsersMatch) {
      metrics.newUsers = parseInt(newUsersMatch[1]);
    }

    // Count closer mentions to get active closers
    const closerMatches = content.match(/\*\w+:\*\s*\d+\s*calls/gi);
    if (closerMatches) {
      metrics.activeClosers = closerMatches.length;
    }
  }

  // Parse closers report metrics
  parseClosersReportMetrics(content, metrics) {
    const closersMatch = content.match(/Active Closers:\s*(\d+)/i);
    if (closersMatch) {
      metrics.activeClosers = parseInt(closersMatch[1]);
    }

    const callsMatch = content.match(/Total Calls:\s*(\d+)/i);
    if (callsMatch) {
      metrics.totalCalls = parseInt(callsMatch[1]);
    }

    const validationsMatch = content.match(/Total Validations:\s*(\d+)/i);
    if (validationsMatch) {
      metrics.totalValidations = parseInt(validationsMatch[1]);
    }

    const conversionMatch = content.match(/Conversion Rate:\s*(\d+(?:\.\d+)?)%/i);
    if (conversionMatch) {
      metrics.conversionRate = parseFloat(conversionMatch[1]);
    }
  }

  // Parse comprehensive report metrics
  parseComprehensiveReportMetrics(content, metrics) {
    // Combine all parsing methods for comprehensive reports
    this.parseDetailedReportMetrics(content, metrics);
    this.parseClosersReportMetrics(content, metrics);
    this.parseTransactionSummaryMetrics(content, metrics);
  }

  // Parse general metrics for custom reports
  parseGeneralMetrics(content, metrics) {
    // Try to find any numbers that might be metrics
    const numberMatches = content.match(/(\d+)/g);
    if (numberMatches && numberMatches.length > 0) {
      // Basic heuristic: assume first few numbers might be relevant metrics
      const numbers = numberMatches.map(n => parseInt(n)).filter(n => n > 0);
      if (numbers.length > 0) {
        metrics.totalTransactions = numbers[0] || 0;
        metrics.totalLeads = numbers[1] || 0;
        metrics.totalCalls = numbers[2] || 0;
      }
    }
  }

  // Generate a summary from the full content
  generateSummary(content, metrics) {
    const lines = content.split('\n').filter(line => line.trim());
    
    // Extract key lines that contain important information
    const keyLines = lines.filter(line => {
      const lowerLine = line.toLowerCase();
      return lowerLine.includes('total') || 
             lowerLine.includes('active') || 
             lowerLine.includes('conversion') ||
             lowerLine.includes('performance') ||
             (lowerLine.includes(':') && /\d+/.test(line));
    });

    // Take first 3-4 key lines or fallback to first few lines
    const summaryLines = keyLines.length > 0 ? keyLines.slice(0, 4) : lines.slice(0, 3);
    
    return summaryLines.join(' | ').replace(/[*_]/g, '').trim();
  }

  // Get reports by type and date range
  async getReportsByType(type, days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const reports = await Report.find({
        type,
        reportDate: { $gte: startDate, $lte: endDate }
      }).sort({ reportDate: -1 });

      return {
        success: true,
        reports
      };
    } catch (error) {
      console.error('Error fetching reports by type:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update report with telegram info after successful send
  async updateReportTelegramInfo(reportId, telegramMessageId, chatId) {
    try {
      const report = await Report.findById(reportId);
      if (!report) {
        return { success: false, error: 'Report not found' };
      }

      await report.markAsSent(telegramMessageId, chatId);
      
      return {
        success: true,
        report
      };
    } catch (error) {
      console.error('Error updating report telegram info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Mark report as failed
  async markReportAsFailed(reportId, error) {
    try {
      const report = await Report.findById(reportId);
      if (!report) {
        return { success: false, error: 'Report not found' };
      }

      await report.markAsFailed(error);
      
      return {
        success: true,
        report
      };
    } catch (error) {
      console.error('Error marking report as failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new ReportService(); 