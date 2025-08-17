import mongoose from 'mongoose';

const dailyReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  content: {
    type: String,
    required: true
  },
  tasks: [{
    task: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    hours: {
      type: Number,
      default: 0
    }
  }],
  achievements: [{
    type: String
  }],
  challenges: [{
    type: String
  }],
  nextDayPlan: {
    type: String
  },
  hoursWorked: {
    type: Number,
    default: 0
  },
  mood: {
    type: String,
    enum: ['excellent', 'good', 'neutral', 'bad', 'terrible'],
    default: 'neutral'
  },
  isSubmitted: {
    type: Boolean,
    default: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
dailyReportSchema.index({ userId: 1, date: 1 });
dailyReportSchema.index({ userId: 1, createdAt: 1 });

// Pre-save middleware to update updatedAt
dailyReportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for formatted date
dailyReportSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Method to check if report is for today
dailyReportSchema.methods.isToday = function() {
  const today = new Date();
  const reportDate = new Date(this.date);
  return today.toDateString() === reportDate.toDateString();
};

// Static method to get reports for a user in a date range
dailyReportSchema.statics.getReportsForPeriod = function(userId, startDate, endDate) {
  return this.find({
    userId: userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: 1 });
};

// Static method to check if user has submitted report for today
dailyReportSchema.statics.hasSubmittedToday = function(userId) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  return this.findOne({
    userId: userId,
    date: {
      $gte: startOfDay,
      $lt: endOfDay
    }
  });
};

const DailyReport = mongoose.model('DailyReport', dailyReportSchema);

export default DailyReport; 