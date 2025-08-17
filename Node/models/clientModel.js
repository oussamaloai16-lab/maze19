import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  projectType: [{
    type: String,
    enum: ['photography', 'advertising', 'video', 'ecommerce', 'fulfillment', 'design'],
    required: true
  }],
  budget: {
    type: String,
    enum: ['10000-25000', '25000-50000', '50000-100000', '100000+', 'custom'],
    required: true
  },
  timeline: {
    type: String,
    enum: ['urgent', 'standard', 'flexible', 'long-term'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  preferredContact: {
    type: String,
    enum: ['whatsapp', 'email', 'phone'],
    default: 'whatsapp'
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'in-progress', 'completed', 'cancelled'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  notes: {
    type: String,
    trim: true
  },
  contactedAt: {
    type: Date
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

// Pre-save middleware to update the updatedAt field
clientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
clientSchema.index({ email: 1 });
clientSchema.index({ phone: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ createdAt: -1 });

const Client = mongoose.model('Client', clientSchema);

export default Client; 