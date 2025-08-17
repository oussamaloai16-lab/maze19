import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in_progress', 'review', 'completed', 'cancelled']
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const serviceSchema = new mongoose.Schema({
  // Service Details
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  serviceDescription: {
    type: String,
    trim: true
  },
  estimatedStartDate: {
    type: Date
  },
  serviceStatus: {
    type: String,
    required: true,
    enum: ['Pending', 'Active', 'Canceled'],
    default: 'Pending'
  },

  // Client & Project Information
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  brandName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    required: true,
    enum: ['E-commerce', 'Service Industry', 'Product Based', 'Other']
  },
  otherBusinessType: {
    type: String,
    trim: true
  },
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  goalExpectations: {
    type: String,
    required: true
  },
  targetAudience: {
    type: String,
    required: true
  },
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  additionalInfo: {
    type: String
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // Status History
  statusHistory: [statusHistorySchema],

  // Additional fields
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  attachments: [{
    filename: String,
    path: String,
    uploadedAt: Date
  }]
}, {
  timestamps: true
});

// Add text indexes for search functionality
serviceSchema.index({
  serviceName: 'text',
  clientName: 'text',
  brandName: 'text',
  projectName: 'text',
  serviceDescription: 'text'
});

// Pre-save middleware to update timestamps
serviceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Status transition validation
const validStatusTransitions = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['review', 'cancelled'],
  review: ['in_progress', 'completed', 'cancelled'],
  completed: ['review'],
  cancelled: ['pending']
};

serviceSchema.methods.canTransitionTo = function(newStatus) {
  const currentStatus = this.serviceStatus;
  return validStatusTransitions[currentStatus]?.includes(newStatus);
};

serviceSchema.methods.updateStatus = async function(newStatus, userId, reason) {
  if (!this.canTransitionTo(newStatus)) {
    throw new Error(`Invalid status transition from ${this.serviceStatus} to ${newStatus}`);
  }

  this.serviceStatus = newStatus;
  this.statusHistory.push({
    status: newStatus,
    changedBy: userId,
    reason: reason
  });
  this.updatedAt = new Date();
  return this.save();
};

const Service = mongoose.model('Service', serviceSchema);

export default Service; 