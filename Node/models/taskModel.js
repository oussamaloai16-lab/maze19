// models/taskModel.js
import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  // Core References
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  clientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },

  // Task Details
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  taskType: {
    type: String,
    required: true,
    enum: [
      'PHOTOGRAPHY_PRODUCT',
      'PHOTOGRAPHY_BRAND', 
      'PHOTOGRAPHY_STUDIO',
      'PHOTOGRAPHY_OUTDOOR',
      'VIDEO_PRODUCT_DEMO',
      'VIDEO_BRAND_STORY',
      'VIDEO_SOCIAL_MEDIA',
      'VIDEO_PROMOTIONAL',
      'VIDEO_TESTIMONIALS',
      'ADVERTISING_FACEBOOK',
      'ADVERTISING_INSTAGRAM', 
      'ADVERTISING_GOOGLE',
      'SOCIAL_MEDIA_CONTENT',
      'SOCIAL_MEDIA_POSTING',
      'SOCIAL_MEDIA_MANAGEMENT',
      'ECOMMERCE_DEVELOPMENT',
      'ECOMMERCE_CATALOG',
      'ECOMMERCE_PAYMENT',
      'ORDER_FULFILLMENT',
      'INVENTORY_MANAGEMENT',
      'DELIVERY_COORDINATION',
      'CREATIVE_DESIGN',
      'LOGO_DESIGN',
      'GRAPHIC_DESIGN',
      'MARKETING_MATERIALS',
      'OTHER'
    ]
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Status and Progress
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'review', 'completed', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Timeline
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    min: 0,
    default: 0
  },
  dueDate: Date,
  startedAt: Date,
  completedAt: Date,
  deliveredAt: Date,

  // Files and Resources
  attachments: [{
    filename: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliverables: [{
    filename: String,
    url: String,
    version: {
      type: Number,
      default: 1
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Communication
  comments: [{
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: false
    }
  }],
  revisionNotes: [{
    note: String,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }],

  // Status History
  statusHistory: [{
    status: {
      type: String,
      required: true
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
  }],

  // Additional Fields
  tags: [String],
  isUrgent: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: String,

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Indexes for better performance
taskSchema.index({ status: 1, assignedTo: 1 });
taskSchema.index({ taskType: 1, status: 1 });
taskSchema.index({ clientId: 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ createdAt: -1 });

// Update the updatedAt field before saving
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for task age
taskSchema.virtual('age').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for time remaining
taskSchema.virtual('timeRemaining').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const diff = this.dueDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

export default mongoose.model('Task', taskSchema);