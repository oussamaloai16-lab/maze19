// Create a new file: utils/verificationUtils.js
import User from '../models/userModel.js';
import crypto from 'crypto';

// Utility to check verification token status for a user
export const checkTokenStatus = async (email) => {
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return {
        found: false,
        message: 'User not found with this email'
      };
    }
    
    return {
      found: true,
      isVerified: user.isVerified,
      hasToken: !!user.verificationToken,
      tokenExpired: user.verificationTokenExpiry < new Date(),
      tokenExpiry: user.verificationTokenExpiry,
      attemptsCount: user.verificationAttempts || 0
    };
  } catch (error) {
    console.error('Token status check error:', error);
    throw error;
  }
};

// Utility to generate a new token for a user (admin use)
export const resetVerificationToken = async (email) => {
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    if (user.isVerified) {
      return {
        success: false,
        message: 'User is already verified'
      };
    }
    
    // Generate a new token
    const token = crypto.randomBytes(20).toString('hex');
    
    // Update user with new token
    user.verificationToken = token;
    user.verificationTokenExpiry = new Date(Date.now() + (24 * 60 * 60 * 1000));
    user.verificationAttempts = (user.verificationAttempts || 0) + 1;
    
    await user.save();
    
    return {
      success: true,
      token,
      expiresAt: user.verificationTokenExpiry
    };
  } catch (error) {
    console.error('Reset token error:', error);
    throw error;
  }
};

// Check if there are any consistency issues with verification tokens
export const auditVerificationTokens = async () => {
  try {
    const users = await User.find({
      $or: [
        { verificationToken: { $ne: null } },
        { isVerified: false }
      ]
    });
    
    const issues = [];
    
    for (const user of users) {
      // Check for users with expired tokens
      if (user.verificationToken && user.verificationTokenExpiry < new Date()) {
        issues.push({
          userId: user._id,
          email: user.email,
          issue: 'Expired token',
          tokenExpiry: user.verificationTokenExpiry
        });
      }
      
      // Check for unverified users without tokens
      if (!user.isVerified && !user.verificationToken) {
        issues.push({
          userId: user._id,
          email: user.email,
          issue: 'Unverified user without token'
        });
      }
      
      // Check for verified users with tokens (inconsistent state)
      if (user.isVerified && user.verificationToken) {
        issues.push({
          userId: user._id,
          email: user.email,
          issue: 'Verified user with token (inconsistent state)'
        });
      }
    }
    
    return {
      totalUnverified: users.filter(u => !u.isVerified).length,
      totalWithTokens: users.filter(u => !!u.verificationToken).length,
      issues
    };
  } catch (error) {
    console.error('Audit error:', error);
    throw error;
  }
};