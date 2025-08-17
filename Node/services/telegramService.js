// services/telegramService.js
import axios from 'axios';
import reportService from './reportService.js';

export class TelegramService {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.groupChatId = process.env.TELEGRAM_GROUP_CHAT_ID;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    
    if (!this.botToken || !this.groupChatId) {
      console.warn('Telegram bot token or group chat ID not configured. Telegram notifications will be disabled.');
      this.enabled = false;
    } else {
      this.enabled = true;
    }
  }

  // Helper method to sanitize text for Telegram Markdown
  sanitizeText(text) {
    if (!text) return text;
    
    // Remove or replace problematic characters that can break Markdown parsing
    return text
      .replace(/[_*[\]()~`>#+=|{}.!-]/g, '') // Remove all Markdown special characters
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with max 2
      .trim();
  }

  // Helper method to escape user content safely
  escapeUserContent(content) {
    if (!content) return '';
    
    // For user-generated content, be extra careful
    return content
      .replace(/[*_`[\]()~>#+=|{}.!-]/g, '') // Remove all special chars
      .replace(/\n/g, ' ') // Replace newlines with spaces for inline content
      .substring(0, 300) // Limit length
      .trim();
  }

  async sendMessage(text, options = {}) {
    if (!this.enabled) {
      console.log('Telegram notifications disabled - would have sent:', text);
      return { success: false, message: 'Telegram not configured' };
    }

    try {
      // Sanitize the entire message
      const sanitizedText = this.sanitizeText(text);
      
      const payload = {
        chat_id: this.groupChatId,
        text: sanitizedText,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...options
      };

      const response = await axios.post(`${this.baseUrl}/sendMessage`, payload);
      
      return {
        success: true,
        messageId: response.data.result.message_id,
        data: response.data
      };
    } catch (error) {
      console.error('Telegram send message error:', error.response?.data || error.message);
      
      // If Markdown parsing failed, try sending without Markdown and with heavy sanitization
      if (error.response?.data?.description?.includes("can't parse entities")) {
        console.log('Markdown parsing failed, trying without Markdown and heavy sanitization...');
        try {
          // Remove ALL markdown formatting and special characters
          const plainText = text
            .replace(/[*_`[\]()~>#+=|{}.!-]/g, '') // Remove all special chars
            .replace(/━+/g, '---') // Replace unicode dashes with regular dashes
            .replace(/[^\x00-\x7F]/g, '') // Remove all non-ASCII characters except basic ones
            .replace(/\n{3,}/g, '\n\n') // Limit newlines
            .trim();
          
          const plainPayload = {
            chat_id: this.groupChatId,
            text: plainText,
            disable_web_page_preview: true,
            ...options
          };
          
          delete plainPayload.parse_mode; // Remove parse_mode completely
          
          const plainResponse = await axios.post(`${this.baseUrl}/sendMessage`, plainPayload);
          
          return {
            success: true,
            messageId: plainResponse.data.result.message_id,
            data: plainResponse.data,
            fallback: true
          };
        } catch (fallbackError) {
          console.error('Fallback send also failed:', fallbackError.response?.data || fallbackError.message);
          return {
            success: false,
            error: fallbackError.response?.data?.description || fallbackError.message
          };
        }
      }
      
      return {
        success: false,
        error: error.response?.data?.description || error.message
      };
    }
  }

  // Send message and save as report
  async sendMessageAsReport(text, reportType, options = {}) {
    try {
      // Send the message to Telegram first
      const telegramResult = await this.sendMessage(text, options);
      
      // Create the report data
      const reportData = {
        type: reportType,
        content: text,
        reportDate: new Date(),
        telegramMessageId: telegramResult.success ? telegramResult.messageId : null,
        chatId: this.groupChatId,
        isAutomated: true,
        additionalData: options.reportData || {}
      };

      // Save the report to database
      const reportResult = await reportService.createReport(reportData);
      
      if (!reportResult.success) {
        console.warn('Failed to save report to database:', reportResult.error);
      }

      return {
        success: telegramResult.success,
        messageId: telegramResult.messageId,
        error: telegramResult.error,
        report: reportResult.success ? reportResult.report : null,
        reportError: reportResult.success ? null : reportResult.error
      };
    } catch (error) {
      console.error('Error sending message as report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendTransactionNotification(transaction, user) {
    const amountFormatted = this.formatAmount(transaction.amount);
    const statusEmoji = this.getStatusEmoji(transaction.status);
    const typeEmoji = transaction.amount >= 0 ? '💰' : '💸';
    
    const message = `
${typeEmoji} *New Transaction Added* ${statusEmoji}

📋 *Transaction Details:*
• *ID:* \`${transaction.transactionId}\`
• *Amount:* ${amountFormatted}
• *Service:* ${transaction.service}
• *Status:* ${transaction.status.toUpperCase()}
• *Payment Method:* ${transaction.paymentMethod}
• *Type:* ${transaction.amount >= 0 ? 'Income' : 'Expense'}
${transaction.isInstallment ? '• *Installment:* Yes' : ''}

👤 *Client:* ${user?.username || user?.name || 'Unknown'}
📧 *Email:* ${user?.email || 'N/A'}

📅 *Date:* ${this.formatDate(transaction.date)}
${transaction.notes ? `📝 *Notes:* ${transaction.notes}` : ''}

💼 *maze Financial Update*
    `.trim();

    return await this.sendMessage(message);
  }

  async sendTransactionUpdateNotification(transaction, oldStatus, newStatus, user) {
    const amountFormatted = this.formatAmount(transaction.amount);
    const statusEmoji = this.getStatusEmoji(newStatus);
    
    const message = `
🔄 *Transaction Status Updated* ${statusEmoji}

📋 *Transaction:* \`${transaction.transactionId}\`
• *Amount:* ${amountFormatted}
• *Service:* ${transaction.service}
• *Status:* ${oldStatus} → *${newStatus.toUpperCase()}*

👤 *Client:* ${user?.username || user?.name || 'Unknown'}
📅 *Updated:* ${this.formatDate(new Date())}

💼 *maze Update*
    `.trim();

    return await this.sendMessage(message);
  }

  async sendDailySummary(stats) {
    const message = `
📊 *Daily Transaction Summary*

📈 *Today's Statistics:*
• *Total Transactions:* ${stats.totalTransactions}
• *Completed:* ${stats.completedTransactions} ✅
• *Pending:* ${stats.pendingTransactions} ⏳

💰 *Financial Summary:*
• *Total Amount:* ${this.formatAmount(stats.totalAmount)}
• *Completed Amount:* ${this.formatAmount(stats.completedAmount)}

📅 *Date:* ${this.formatDate(new Date())}

💼 *Maze Daily Report*
    `.trim();

    return await this.sendMessageAsReport(message, 'daily_transaction_summary', {
      reportData: {
        statistics: stats
      }
    });
  }

  async sendSystemAlert(message, severity = 'info') {
    const severityEmojis = {
      'info': 'ℹ️',
      'warning': '⚠️',
      'error': '🚨',
      'critical': '🔥'
    };

    const alertMessage = `
${severityEmojis[severity] || 'ℹ️'} *System Alert*

*Severity:* ${severity.toUpperCase()}
*Message:* ${message}
*Time:* ${this.formatDate(new Date())}

💼 *maze System*
    `.trim();

    return await this.sendMessage(alertMessage);
  }

  // Helper methods
  formatAmount(amount) {
    if (amount === undefined || amount === null) return '0.00 DZD';
    
    const absAmount = Math.abs(amount);
    const sign = amount >= 0 ? '+' : '-';
    
    return `${sign}${absAmount.toLocaleString('fr-DZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} DZD`;
  }

  formatDate(date) {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Algiers'
    });
  }

  getStatusEmoji(status) {
    const statusEmojis = {
      'pending': '⏳',
      'completed': '✅',
      'processing': '🔄',
      'failed': '❌',
      'cancelled': '🚫',
      'refunded': '↩️'
    };
    
    return statusEmojis[status.toLowerCase()] || '📄';
  }

  async testConnection() {
    if (!this.enabled) {
      return { success: false, message: 'Telegram not configured' };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/getMe`);
      return {
        success: true,
        botInfo: response.data.result
      };
    } catch (error) {
      console.error('Telegram test connection error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendWelcomeMessage() {
    const message = `
🎉 *maze Telegram Integration Active!*

Your transaction notifications are now set up and ready to go.

You'll receive notifications for:
• ➕ New transactions
• 🔄 Status updates  
• 📊 Daily summaries
• 🚨 System alerts

💼 *Welcome to maze Notifications!*
    `.trim();

    return await this.sendMessage(message);
  }
}

export default TelegramService;