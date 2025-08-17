// Enhanced User Model with Credit System - userModel.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Credit history schema
const creditHistorySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['recharge', 'deduction', 'adjustment'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  reason: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedClientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuggestedClient'
  }
});

// Credits schema
const creditsSchema = new mongoose.Schema({
  current: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  used: {
    type: Number,
    default: 0,
    min: 0
  },
  lastRecharge: {
    type: Date
  },
  history: [creditHistorySchema]
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'CHEF_DE_BUREAU', 'CLOSER', 'VALIDATOR','ACCOUNTANT','RECEPTIONIST','CLIENT'],
    default: 'CLOSER'
  },
  active: {
    type: Boolean,
    default: true
  },
  // Added per-user base salary
  baseSalary: {
    type: Number,
    default: 35000,
    min: 0
  },
  // Credits are only applicable for CLOSER role
  credits: {
    type: creditsSchema,
    default: function() {
      return this.role === 'CLOSER' ? {
        current: 0,
        total: 0,
        used: 0,
        lastRecharge: null,
        history: []
      } : undefined;
    }
  },
  // Additional user fields
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  // OAuth provider information
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  // Call tracking for closers
  callStats: {
    totalCalls: {
      type: Number,
      default: 0
    },
    callsToday: {
      type: Number,
      default: 0
    },
    lastCallDate: {
      type: Date
    },
    lastCallReset: {
      type: Date,
      default: Date.now
    },
    // Daily call history for reports (last 30 days)
    dailyCallHistory: [{
      date: {
        type: Date,
        required: true
      },
      callCount: {
        type: Number,
        default: 0
      }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.username;
});

// Virtual for credit percentage
userSchema.virtual('creditPercentage').get(function() {
  if (this.role !== 'CLOSER' || !this.credits || this.credits.total === 0) {
    return null;
  }
  return ((this.credits.current / this.credits.total) * 100).toFixed(1);
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ active: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to initialize credits for closers
userSchema.pre('save', function(next) {
  // Initialize credits for new closers
  if (this.isNew && this.role === 'CLOSER' && !this.credits) {
    this.credits = {
      current: 0,
      total: 0,
      used: 0,
      lastRecharge: null,
      history: []
    };
  }
  
  // Remove credits if user is not a closer
  if (this.role !== 'CLOSER') {
    this.credits = undefined;
  }
  
  next();
});

// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to add credits (for admins)
userSchema.methods.addCredits = async function(amount, adminId, reason = 'Credit recharge') {
  if (this.role !== 'CLOSER') {
    throw new Error('Credits can only be added to closers');
  }
  
  if (amount <= 0) {
    throw new Error('Credit amount must be positive');
  }
  
  // Initialize credits if they don't exist
  if (!this.credits) {
    this.credits = {
      current: 0,
      total: 0,
      used: 0,
      lastRecharge: null,
      history: []
    };
  }
  
  // Add credits
  this.credits.current += amount;
  this.credits.total += amount;
  this.credits.lastRecharge = new Date();
  
  // Add to history
  this.credits.history.push({
    type: 'recharge',
    amount: amount,
    reason: reason,
    date: new Date(),
    adminId: adminId
  });
  
  return await this.save();
};

// Method to deduct credits (for phone number reveals)
userSchema.methods.deductCredit = async function(amount, reason = 'Phone number reveal', clientId = null) {
  if (this.role !== 'CLOSER') {
    throw new Error('Only closers have credits to deduct');
  }
  
  if (!this.credits || this.credits.current < amount) {
    throw new Error('Insufficient credits');
  }
  
  if (amount <= 0) {
    throw new Error('Deduction amount must be positive');
  }
  
  // Deduct credits
  this.credits.current -= amount;
  this.credits.used += amount;
  
  // Add to history
  this.credits.history.push({
    type: 'deduction',
    amount: amount,
    reason: reason,
    date: new Date(),
    relatedClientId: clientId
  });
  
  return await this.save();
};

// Method to check if user has sufficient credits
userSchema.methods.hasCredits = function(amount = 1) {
  if (this.role !== 'CLOSER') {
    return true; // Non-closers don't need credits
  }
  
  return this.credits && this.credits.current >= amount;
};

// Method to get credit summary
userSchema.methods.getCreditSummary = function() {
  if (this.role !== 'CLOSER') {
    return null;
  }
  
  if (!this.credits) {
    return {
      current: 0,
      total: 0,
      used: 0,
      percentage: 0,
      lastRecharge: null
    };
  }
  
  return {
    current: this.credits.current,
    total: this.credits.total,
    used: this.credits.used,
    percentage: this.credits.total > 0 ? ((this.credits.current / this.credits.total) * 100).toFixed(1) : 0,
    lastRecharge: this.credits.lastRecharge
  };
};

// Static method to get all closers with low credits
userSchema.statics.getClosersWithLowCredits = function(threshold = 5) {
  return this.find({
    role: 'CLOSER',
    active: true,
    'credits.current': { $lte: threshold }
  }).select('username email credits');
};

// Static method to get credit statistics
userSchema.statics.getCreditStatistics = async function() {
  const stats = await this.aggregate([
    { $match: { role: 'CLOSER', active: true } },
    {
      $group: {
        _id: null,
        totalClosers: { $sum: 1 },
        totalCreditsDistributed: { $sum: '$credits.total' },
        totalCreditsRemaining: { $sum: '$credits.current' },
        totalCreditsUsed: { $sum: '$credits.used' },
        avgCreditsPerCloser: { $avg: '$credits.current' },
        lowCreditClosers: {
          $sum: {
            $cond: [{ $lte: ['$credits.current', 5] }, 1, 0]
          }
        },
        zeroCreditClosers: {
          $sum: {
            $cond: [{ $eq: ['$credits.current', 0] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalClosers: 0,
    totalCreditsDistributed: 0,
    totalCreditsRemaining: 0,
    totalCreditsUsed: 0,
    avgCreditsPerCloser: 0,
    lowCreditClosers: 0,
    zeroCreditClosers: 0
  };
};

// Method to increment call count when a call is made
userSchema.methods.incrementCallCount = async function(callDate = new Date()) {
  // Initialize callStats if it doesn't exist
  if (!this.callStats) {
    this.callStats = {
      totalCalls: 0,
      callsToday: 0,
      lastCallDate: null,
      lastCallReset: new Date(),
      dailyCallHistory: []
    };
  }

  const today = new Date();
  const callDateOnly = new Date(callDate.getFullYear(), callDate.getMonth(), callDate.getDate());
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // Check if we need to reset daily count (new day)
  const lastResetDate = this.callStats.lastCallReset ? 
    new Date(this.callStats.lastCallReset.getFullYear(), this.callStats.lastCallReset.getMonth(), this.callStats.lastCallReset.getDate()) :
    new Date(0);
    
  if (callDateOnly.getTime() !== lastResetDate.getTime()) {
    // Reset daily count for new day
    this.callStats.callsToday = 0;
    this.callStats.lastCallReset = callDateOnly;
  }
  
  // Increment counters
  this.callStats.totalCalls += 1;
  if (callDateOnly.getTime() === todayDateOnly.getTime()) {
    this.callStats.callsToday += 1;
  }
  this.callStats.lastCallDate = callDate;
  
  // Update daily call history
  const existingDayIndex = this.callStats.dailyCallHistory.findIndex(day => 
    day.date.getTime() === callDateOnly.getTime()
  );
  
  if (existingDayIndex >= 0) {
    this.callStats.dailyCallHistory[existingDayIndex].callCount += 1;
  } else {
    this.callStats.dailyCallHistory.push({
      date: callDateOnly,
      callCount: 1
    });
    
    // Keep only last 30 days
    this.callStats.dailyCallHistory = this.callStats.dailyCallHistory
      .sort((a, b) => b.date - a.date)
      .slice(0, 30);
  }
  
  return await this.save();
};

// Method to get call count for a specific date
userSchema.methods.getCallCountForDate = function(targetDate) {
  if (!this.callStats || !this.callStats.dailyCallHistory) {
    return 0;
  }
  
  const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const dayRecord = this.callStats.dailyCallHistory.find(day => 
    day.date.getTime() === targetDateOnly.getTime()
  );
  
  return dayRecord ? dayRecord.callCount : 0;
};

// Method to get call stats summary
userSchema.methods.getCallStatsSummary = function() {
  if (!this.callStats) {
    return {
      totalCalls: 0,
      callsToday: 0,
      lastCallDate: null,
      dailyAverage: 0
    };
  }
  
  const dailyAverage = this.callStats.dailyCallHistory.length > 0 ?
    this.callStats.dailyCallHistory.reduce((sum, day) => sum + day.callCount, 0) / this.callStats.dailyCallHistory.length :
    0;
  
  return {
    totalCalls: this.callStats.totalCalls || 0,
    callsToday: this.callStats.callsToday || 0,
    lastCallDate: this.callStats.lastCallDate,
    dailyAverage: Math.round(dailyAverage * 100) / 100
  };
};

// Method to reset all daily call counts (for daily cron job)
userSchema.statics.resetDailyCallCounts = async function() {
  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  return await this.updateMany(
    { 
      role: { $in: ['CLOSER', 'closer', 'employee'] },
      $or: [
        { 'callStats.lastCallReset': { $lt: todayDateOnly } },
        { 'callStats.lastCallReset': { $exists: false } }
      ]
    },
    { 
      $set: { 
        'callStats.callsToday': 0,
        'callStats.lastCallReset': todayDateOnly
      }
    }
  );
};

export default mongoose.model('User', userSchema);