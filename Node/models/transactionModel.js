// models/transactionModel.js
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  service: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
    // No sign constraint - negative values represent outgoing payments
  },
  isInstallment: {
    type: Boolean,
    default: false
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Virtual field that will be populated from the User model
  // clientName is not stored in the database, but can be included in responses
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Virtual field that will be populated from the User model
  // createdByName is not stored in the database, but can be included in responses
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'failed', 'processing', 'refunded'],
    default: 'pending'
  },
  notes: {
    type: String
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'credit_card', 'check', 'cheque', 'paypal', 'other'],
    required: true
  },
  relatedTransactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],
  updatedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtual properties for client and creator names
transactionSchema.virtual('clientName', {
  ref: 'User',
  localField: 'clientId',
  foreignField: '_id',
  justOne: true,
  options: { select: 'username name email' }
});

transactionSchema.virtual('creatorName', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
  options: { select: 'username name email' }
});

// Add virtual property to determine transaction type based on amount sign
transactionSchema.virtual('paymentType').get(function() {
  return this.amount >= 0 ? 'in' : 'out';
});

// Pre-save hook to generate transaction ID if not provided
transactionSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await mongoose.model('Transaction').countDocuments() + 1;
    this.transactionId = `TRX-${year}${month}-${count.toString().padStart(4, '0')}`;
  }
  
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  
  next();
});

export default mongoose.model('Transaction', transactionSchema);