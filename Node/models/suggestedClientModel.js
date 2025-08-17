// models/suggestedClientModel.js
// UPDATED MODEL WITH COMMUNE FIELD AND UNRESTRICTED BUSINESS_TYPE

import mongoose from 'mongoose';

const callLogSchema = new mongoose.Schema({
  calledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  callDate: {
    type: Date,
    default: Date.now
  },
  callDuration: {
    type: Number, // in minutes
    default: 0
  },
  callOutcome: {
    type: String,
    enum: ['interested', 'not_interested', 'call_back_later', 'no_answer', 'invalid_number'],
    required: true
  },
  notes: {
    type: String,
    required: true
  },
  followUpDate: {
    type: Date
  }
});

const suggestedClientSchema = new mongoose.Schema({
  suggestedClientId: {
    type: String,
    required: true,
    unique: true
  },
  storeName: {
    type: String,
    required: true,
    trim: true
  },
  storeAddress: {
    type: String,
    required: true,
    trim: true
  },
  wilaya: {
    type: String,
    required: true,
    trim: true
  },
  commune: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  socialMediaLink: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'interested', 'not_interested', 'validated', 'converted'],
    default: 'pending'
  },
  isValidated: {
    type: Boolean,
    default: false
  },
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validatedAt: {
    type: Date
  },
  validationNotes: {
    type: String
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // UPDATED: Remove enum restriction to allow any business type
  businessType: {
    type: String,
    default: 'Other',
    trim: true
  },
  estimatedBudget: {
    type: Number,
    min: 0
  },
  score: {
    type: Number,
    default: 0,
    min: 0
  },
  callLogs: [callLogSchema],
  totalCalls: {
    type: Number,
    default: 0
  },
  lastContactDate: {
    type: Date
  },
  nextFollowUpDate: {
    type: Date
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  source: {
    type: String,
    enum: ['manual_entry', 'social_media', 'referral', 'cold_outreach', 'website'],
    default: 'manual_entry'
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual to get the creator's name
suggestedClientSchema.virtual('creatorName', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
  options: { select: 'username name email' }
});

// Virtual to get assigned user's name
suggestedClientSchema.virtual('assignedToName', {
  ref: 'User',
  localField: 'assignedTo',
  foreignField: '_id',
  justOne: true,
  options: { select: 'username name email' }
});

// Virtual to get validator's name
suggestedClientSchema.virtual('validatorName', {
  ref: 'User',
  localField: 'validatedBy',
  foreignField: '_id',
  justOne: true,
  options: { select: 'username name email' }
});

// FIXED: Pre-save hook to generate suggestedClientId
suggestedClientSchema.pre('save', async function(next) {
  try {
    if (!this.suggestedClientId) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      
      // Use this.constructor instead of mongoose.model to avoid circular reference
      const count = await this.constructor.countDocuments({}) + 1;
      this.suggestedClientId = `SC-${year}${month}-${count.toString().padStart(4, '0')}`;
    }
    
    if (this.isModified()) {
      this.updatedAt = Date.now();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to add a call log
suggestedClientSchema.methods.addCallLog = function(callData) {
  this.callLogs.push(callData);
  this.totalCalls = this.callLogs.length;
  this.lastContactDate = callData.callDate || new Date();
  
  // Update status based on call outcome
  if (callData.callOutcome === 'interested') {
    this.status = 'interested';
  } else if (callData.callOutcome === 'not_interested') {
    this.status = 'not_interested';
  } else if (this.status === 'pending') {
    this.status = 'contacted';
  }
  
  // Set follow-up date if provided
  if (callData.followUpDate) {
    this.nextFollowUpDate = callData.followUpDate;
  }
  
  return this.save();
};

// Method to validate/invalidate client
suggestedClientSchema.methods.validateClient = function(isValid, validatorId, notes) {
  this.isValidated = isValid;
  this.validatedBy = validatorId;
  this.validatedAt = new Date();
  this.validationNotes = notes;
  
  if (isValid) {
    this.status = 'validated';
  } else {
    this.status = 'not_interested';
  }
  
  return this.save();
};

export default mongoose.model('SuggestedClient', suggestedClientSchema);