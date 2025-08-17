// services/mfaService.js
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import User from '../models/userModel.js';
import NotificationService from './notificationService.js';

export class MFAService {
  constructor() {
    this.notificationService = new NotificationService();
  }

  async generateMFASecret(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate a new secret
      const secret = speakeasy.generateSecret({
        name: `maze:${user.email}`,
        length: 20
      });
      
      // Save secret to user
      user.mfa = {
        ...user.mfa,
        secret: secret.base32,
        tempSecret: secret.base32,
        enabled: false
      };
      
      await user.save();
      
      // Generate QR code
      const otpauth_url = secret.otpauth_url;
      const qrCodeUrl = await QRCode.toDataURL(otpauth_url);
      
      return {
        secret: secret.base32,
        qrCodeUrl
      };
    } catch (error) {
      throw new Error(`Failed to generate MFA secret: ${error.message}`);
    }
  }

  async verifyAndEnableMFA(userId, token) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!user.mfa || !user.mfa.tempSecret) {
        throw new Error('MFA not initialized for this user');
      }
      
      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: user.mfa.tempSecret,
        encoding: 'base32',
        token: token,
        window: 1 // Allow for 1 step before/after for clock skew
      });
      
      if (!verified) {
        throw new Error('Invalid verification code');
      }
      
      // Enable MFA
      user.mfa.enabled = true;
      user.mfa.secret = user.mfa.tempSecret;
      user.mfa.tempSecret = undefined;
      user.mfa.enabledAt = new Date();
      
      await user.save();
      
      // Send notification
      await this.notificationService.sendMFAEnabledNotification(user);
      
      return { success: true, message: 'MFA enabled successfully' };
    } catch (error) {
      throw new Error(`Failed to enable MFA: ${error.message}`);
    }
  }

  async verifyMFAToken(userId, token) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!user.mfa || !user.mfa.enabled || !user.mfa.secret) {
        throw new Error('MFA not enabled for this user');
      }
      
      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: user.mfa.secret,
        encoding: 'base32',
        token: token,
        window: 1 // Allow for 1 step before/after for clock skew
      });
      
      if (!verified) {
        // Log failed attempt
        user.mfa.failedAttempts = (user.mfa.failedAttempts || 0) + 1;
        user.mfa.lastFailedAttempt = new Date();
        
        // If too many failed attempts, disable MFA (optional security measure)
        if (user.mfa.failedAttempts > 5) {
          user.mfa.enabled = false;
          await user.save();
          throw new Error('Too many failed attempts. MFA has been disabled for security reasons.');
        }
        
        await user.save();
        throw new Error('Invalid verification code');
      }
      
      // Reset failed attempts counter
      user.mfa.failedAttempts = 0;
      user.mfa.lastSuccessfulAttempt = new Date();
      await user.save();
      
      return { success: true };
    } catch (error) {
      throw new Error(`MFA verification failed: ${error.message}`);
    }
  }

  async disableMFA(userId, token) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!user.mfa || !user.mfa.enabled) {
        throw new Error('MFA not enabled for this user');
      }
      
      // Verify the token one last time for security
      const verified = speakeasy.totp.verify({
        secret: user.mfa.secret,
        encoding: 'base32',
        token: token,
        window: 1
      });
      
      if (!verified) {
        throw new Error('Invalid verification code');
      }
      
      // Disable MFA
      user.mfa = {
        enabled: false,
        disabledAt: new Date()
      };
      
      await user.save();
      
      // Send notification
      await this.notificationService.sendMFADisabledNotification(user);
      
      return { success: true, message: 'MFA disabled successfully' };
    } catch (error) {
      throw new Error(`Failed to disable MFA: ${error.message}`);
    }
  }

  async isMFARequired(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if user is SUPER_ADMIN - MFA is required for them
      const requiresMFA = user.role === 'SUPER_ADMIN';
      
      // Check if MFA is already enabled
      const mfaEnabled = user.mfa && user.mfa.enabled;
      
      return {
        requiresMFA,
        mfaEnabled,
        needsSetup: requiresMFA && !mfaEnabled
      };
    } catch (error) {
      throw new Error(`Failed to check MFA requirement: ${error.message}`);
    }
  }
}

export default MFAService;