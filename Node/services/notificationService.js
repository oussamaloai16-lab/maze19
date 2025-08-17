// services/notificationService.js (Updated with Telegram integration)
import { transporter } from '../config/nodemailerConfig.js';
import User from '../models/userModel.js';
import TelegramService from './telegramService.js';

export class NotificationService {
  constructor() {
    this.frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    this.telegramService = new TelegramService();
  }

  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html
      };

      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  // NEW: Transaction notification methods with Telegram integration
  async sendTransactionCreatedNotification(transaction) {
    try {
      // Get user details
      const user = await User.findById(transaction.clientId).select('username name email');
      
      // Send Telegram notification
      const telegramResult = await this.telegramService.sendTransactionNotification(transaction, user);
      
      if (telegramResult.success) {
        console.log(`Transaction notification sent to Telegram: ${transaction.transactionId}`);
      } else {
        console.error(`Failed to send Telegram notification: ${telegramResult.error}`);
      }
      
      return telegramResult;
    } catch (error) {
      console.error('Error sending transaction notification:', error);
      return { success: false, error: error.message };
    }
  }

  async sendTransactionUpdatedNotification(transaction, oldStatus, newStatus) {
    try {
      // Get user details
      const user = await User.findById(transaction.clientId).select('username name email');
      
      // Send Telegram notification
      const telegramResult = await this.telegramService.sendTransactionUpdateNotification(
        transaction, 
        oldStatus, 
        newStatus, 
        user
      );
      
      if (telegramResult.success) {
        console.log(`Transaction update notification sent to Telegram: ${transaction.transactionId}`);
      } else {
        console.error(`Failed to send Telegram update notification: ${telegramResult.error}`);
      }
      
      return telegramResult;
    } catch (error) {
      console.error('Error sending transaction update notification:', error);
      return { success: false, error: error.message };
    }
  }

  async sendDailySummaryNotification(stats) {
    try {
      const telegramResult = await this.telegramService.sendDailySummary(stats);
      
      if (telegramResult.success) {
        console.log('Daily summary sent to Telegram');
      } else {
        console.error(`Failed to send daily summary: ${telegramResult.error}`);
      }
      
      return telegramResult;
    } catch (error) {
      console.error('Error sending daily summary:', error);
      return { success: false, error: error.message };
    }
  }

  async sendSystemNotification(message, severity = 'info') {
    try {
      const telegramResult = await this.telegramService.sendSystemAlert(message, severity);
      
      if (telegramResult.success) {
        console.log(`System notification sent to Telegram: ${message}`);
      } else {
        console.error(`Failed to send system notification: ${telegramResult.error}`);
      }
      
      return telegramResult;
    } catch (error) {
      console.error('Error sending system notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Keep all your existing email notification methods...
  // [All the existing methods from your original NotificationService remain the same]

  async sendWelcomeEmail(user) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Welcome to Maze!</h1>
        <p>Hello ${user.username},</p>
        <p>Thank you for joining Maze. We're excited to have you on board!</p>
        <p>Please verify your email address to access all features of your account.</p>
        <p><strong>Note:</strong> You will receive a separate email with verification instructions.</p>
        <p>If you have any questions, feel free to contact our support team.</p>
      </div>
    `;

    return this.sendEmail(user.email, 'Welcome to maze', html);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Password Reset Request</h1>
        <p>Hello ${user.username},</p>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${this.frontendUrl}/reset-password/${resetToken}" 
             style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;

    return this.sendEmail(user.email, 'Password Reset Request', html);
  }

  // Email Verification Methods
  async sendVerificationEmail(email, username, token) {
    if (!token) {
      console.error('Missing verification token when sending email to:', email);
      throw new Error('Verification token is missing');
    }
    
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Hello ${username},</p>
        <p>Thank you for registering with ZR Maze. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account, please ignore this email.</p>
      </div>
    `;
  
    return this.sendEmail(email, 'Verify Your Email Address', html);
  }

  async sendVerificationConfirmation(email, username) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verified Successfully</h2>
        <p>Hello ${username},</p>
        <p>Your email has been successfully verified. You now have full access to your Maze account.</p>
        <p>Thank you for completing this important step!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${this.frontendUrl}/login" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Go to Login
          </a>
        </div>
      </div>
    `;

    return this.sendEmail(email, 'Email Verification Successful', html);
  }

  // Keep all your other existing email methods...
  // [Include all the other methods from your original file]
}

export default NotificationService;