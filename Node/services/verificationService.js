// services/verificationService.js
import crypto from 'crypto';
import User from '../models/userModel.js';
import NotificationService from './notificationService.js';

export class VerificationService {
  constructor() {
    this.notificationService = new NotificationService();
    this.tokenExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  async generateVerificationToken(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (user.isVerified) {
        throw new Error('User is already verified');
      }
      
      // Generate a random token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Update the user with the new token
      user.verificationToken = token;
      user.verificationTokenExpiry = new Date(Date.now() + this.tokenExpiry);
      user.verificationAttempts = (user.verificationAttempts || 0) + 1;
      
      await user.save();
      
      return token;
    } catch (error) {
      throw new Error(`Failed to generate verification token: ${error.message}`);
    }
  }

  async sendVerificationEmail(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate a token if none exists or the existing one has expired
      let token;
      if (!user.verificationToken || user.verificationTokenExpiry < new Date()) {
        token = await this.generateVerificationToken(userId);
      } else {
        token = user.verificationToken;
      }
      
      // Ensure we have a token before sending the email
      if (!token) {
        throw new Error('Failed to generate verification token');
      }
      
      // Send email with verification link
      await this.notificationService.sendVerificationEmail(
        user.email, 
        user.username, 
        token // Pass the actual token value
      );
      
      return { message: 'Verification email sent successfully' };
    } catch (error) {
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  async verifyEmail(token) {
    try {
      if (!token) {
        throw new Error('Verification token is missing');
      }
      
      const user = await User.findOne({ 
        verificationToken: token,
        verificationTokenExpiry: { $gt: new Date() }
      });
      
      if (!user) {
        throw new Error('Invalid or expired verification token');
      }
      
      // Mark user as verified
      user.isVerified = true;
      user.verifiedAt = new Date();
      user.verificationToken = null;
      user.verificationTokenExpiry = null;
      
      await user.save();
      
      // Send confirmation email
      await this.notificationService.sendVerificationConfirmation(user.email, user.username);
      
      return { message: 'Email verified successfully' };
    } catch (error) {
      throw new Error(`Email verification failed: ${error.message}`);
    }
  }

  async resendVerificationEmail(email) {
    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (user.isVerified) {
        throw new Error('User is already verified');
      }
      
      // Rate limiting - prevent too many resend attempts
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      if (user.verificationAttempts > 5 && user.verificationTokenExpiry > oneDayAgo) {
        throw new Error('Too many verification attempts. Please try again later.');
      }
      
      return this.sendVerificationEmail(user._id);
    } catch (error) {
      throw new Error(`Failed to resend verification email: ${error.message}`);
    }
  }
}

export default VerificationService;