// services/userService.js
import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import NotificationService from './notificationService.js';
import VerificationService from './verificationService.js';


export class UserService {
  constructor() {
    this.notificationService = new NotificationService();
    this.verificationService = new VerificationService();

  }

  async createUser(userData) {
    try {
      const { email, password } = userData;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        ...userData,
        password: hashedPassword
      });

      await user.save();
      await this.notificationService.sendWelcomeEmail(user);

      await this.verificationService.sendVerificationEmail(user._id);


      return this.#sanitizeUser(user);
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  async getUserById(userId) {
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  }

  async updateUser(userId, updateData) {
    try {
      // Don't allow role updates through this method
      delete updateData.role;
      
      const user = await User.findByIdAndUpdate(
        userId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  async updatePassword(userId, oldPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify old password
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.passwordUpdatedAt = new Date();

      await user.save();
      await this.notificationService.sendPasswordChangeNotification(user);

      return { message: 'Password updated successfully' };
    } catch (error) {
      throw new Error(`Error updating password: ${error.message}`);
    }
  }

  async updateRole(userId, newRole, adminId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const oldRole = user.role;
      user.role = newRole;
      user.roleUpdatedAt = new Date();
      user.roleUpdatedBy = adminId;

      await user.save();
      await this.notificationService.sendRoleUpdateNotification(user, oldRole);

      return this.#sanitizeUser(user);
    } catch (error) {
      throw new Error(`Error updating user role: ${error.message}`);
    }
  }

  async getAllUsers(filters = {}, page = 1, limit = 10) {
    try {
      const query = this.#buildUserQuery(filters);
      const skip = (page - 1) * limit;

      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(query);

      return {
        users,
        pagination: {
          current: page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  async getUsersByRole(role, page = 1, limit = 10) {
    try {
      const query = { role: role.toUpperCase(), active: true };
      const skip = (page - 1) * limit;

      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(query);

      return {
        users,
        pagination: {
          current: page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error fetching users by role: ${error.message}`);
    }
  }

  // Backend UserService
  async deactivateUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      user.active = false;
      user.deactivatedAt = new Date();
      await user.save();
      
      // If you have notification service implemented
      // await this.notificationService.sendAccountDeactivationNotification(user);
      
      return { message: 'User deactivated successfully' };
    } catch (error) {
      throw new Error(`Error deactivating user: ${error.message}`);
    }
  }


  // In UserService class
  async uploadAvatar(userId, avatarFile) {
    try {
      // Process the file (in a real implementation, you'd upload to cloud storage)
      const avatarFileName = `user-${userId}-${Date.now()}.${avatarFile.originalname.split('.').pop()}`;
      const avatarPath = `/uploads/avatars/${avatarFileName}`;
      
      // Move the file to the upload directory
      // In a real implementation, this might use a cloud storage service
      
      // Update the user's avatar in the database
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          avatar: avatarPath,
          updatedAt: new Date() 
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error(`Error uploading avatar: ${error.message}`);
    }
  }
  
  async requireVerification(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!user.isVerified) {
        throw new Error('Email verification required. Please verify your email to continue.');
      }
      
      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get user's call statistics
  async getCallStats(userId) {
    try {
      const user = await User.findById(userId).select('callStats username role');
      
      if (!user) {
        throw new Error('User not found');
      }

      // If user doesn't have call tracking, initialize it
      if (!user.callStats) {
        user.callStats = {
          totalCalls: 0,
          callsToday: 0,
          lastCallDate: null,
          lastCallReset: new Date(),
          dailyCallHistory: []
        };
        await user.save();
      }

      // FIXED: Check if daily reset is needed when fetching stats
      const today = new Date();
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const lastResetDate = user.callStats.lastCallReset ? 
        new Date(user.callStats.lastCallReset.getFullYear(), user.callStats.lastCallReset.getMonth(), user.callStats.lastCallReset.getDate()) :
        new Date(0);
      
      if (todayDateOnly.getTime() !== lastResetDate.getTime()) {
        // Reset daily count for new day
        user.callStats.callsToday = 0;
        user.callStats.lastCallReset = todayDateOnly;
        await user.save();
        console.log(`📅 Auto-reset daily call count for user: ${user.username}`);
      }

      // Get the call stats summary
      const callStatsSummary = user.getCallStatsSummary();

      // Get yesterday's call count
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const callsYesterday = user.getCallCountForDate(yesterday);

      return {
        username: user.username,
        role: user.role,
        totalCalls: callStatsSummary.totalCalls,
        callsToday: callStatsSummary.callsToday,
        callsYesterday: callsYesterday,
        lastCallDate: callStatsSummary.lastCallDate,
        dailyAverage: callStatsSummary.dailyAverage,
        dailyHistory: user.callStats.dailyCallHistory || []
      };
    } catch (error) {
      throw new Error(`Error fetching call stats: ${error.message}`);
    }
  }
  // Private helper methods
  #sanitizeUser(user) {
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
  }

  #buildUserQuery(filters) {
    const query = {};
    
    if (filters.role) {
      query.role = filters.role;
    }
    
    if (filters.active !== undefined) {
      query.active = filters.active;
    }

    if (filters.search) {
      query.$or = [
        { username: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }

    return query;
  }
}