import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  // Report identification
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'daily_transaction_summary',
      'detailed_daily_report', 
      'daily_closers_report',
      'comprehensive_report',
      'custom_report',
      'employee_daily_report'
    ]
  },
  
  // Report content
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    trim: true
  },
  
  // Employee information for daily reports
  employeeInfo: {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    employeeName: {
      type: String,
      trim: true
    },
    employeeRole: {
      type: String,
      trim: true
    }
  },
  
  // Report data/statistics
  reportData: {
    type: mongoose.Schema.Types.Mixed, // Flexible object to store various report statistics
    default: {}
  },
  
  // Telegram information
  telegramInfo: {
    sent: {
      type: Boolean,
      default: false
    },
    messageId: {
      type: String
    },
    sentAt: {
      type: Date
    },
    chatId: {
      type: String
    },
    error: {
      type: String
    }
  },
  
  // Report metadata
  reportDate: {
    type: Date,
    default: Date.now
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isAutomated: {
    type: Boolean,
    default: false
  },
  
  // Report status
  status: {
    type: String,
    enum: ['generated', 'sent', 'failed', 'archived'],
    default: 'generated'
  },
  
  // Performance metrics (parsed from report content)
  metrics: {
    totalTransactions: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    totalLeads: { type: Number, default: 0 },
    totalCalls: { type: Number, default: 0 },
    totalValidations: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    activeClosers: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 }
  },
  
  // Additional metadata
  scheduledFor: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
reportSchema.index({ reportDate: -1 });
reportSchema.index({ type: 1, reportDate: -1 });
reportSchema.index({ status: 1 });
reportSchema.index({ 'telegramInfo.sent': 1 });
reportSchema.index({ isAutomated: 1 });

// Add text index for search functionality
reportSchema.index({
  title: 'text',
  content: 'text',
  summary: 'text',
  notes: 'text'
});

// Pre-save middleware to generate reportId
reportSchema.pre('save', function(next) {
  if (!this.reportId) {
    const date = new Date(this.reportDate);
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Generate a unique ID based on type and timestamp
    const typePrefix = this.type.split('_').map(word => word.charAt(0).toUpperCase()).join('');
    const timestamp = Date.now().toString().slice(-4);
    
    this.reportId = `${typePrefix}-${year}${month}${day}-${timestamp}`;
  }
  next();
});

// Instance methods
reportSchema.methods.markAsSent = function(telegramMessageId, chatId) {
  this.telegramInfo.sent = true;
  this.telegramInfo.messageId = telegramMessageId;
  this.telegramInfo.chatId = chatId;
  this.telegramInfo.sentAt = new Date();
  this.status = 'sent';
  return this.save();
};

reportSchema.methods.markAsFailed = function(error) {
  this.telegramInfo.sent = false;
  this.telegramInfo.error = error;
  this.status = 'failed';
  return this.save();
};

// Static methods
reportSchema.statics.getReportsByDateRange = function(startDate, endDate, type = null) {
  const query = {
    reportDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .sort({ reportDate: -1 })
    .populate('generatedBy', 'username name email');
};

reportSchema.statics.getRecentReports = function(limit = 10) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('generatedBy', 'username name email');
};

reportSchema.statics.getReportStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        successfulSends: {
          $sum: {
            $cond: ['$telegramInfo.sent', 1, 0]
          }
        },
        lastReport: { $max: '$reportDate' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

const Report = mongoose.model('Report', reportSchema);

export default Report; 