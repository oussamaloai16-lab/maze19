// models/orderModel.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  mobile1: {
    type: String,
    required: true
  },
  mobile2: {
    type: String
  },
  address: {
    type: String,
    required: true
  },
  note: {
    type: String
  },
  productDetails: {
    type: String,
    required: true
  },
  trackingId: {
    type: String
  },
  deliveryType: {
    type: String,
    enum: ['Domicile', 'Stop Desk'],
    default: 'Domicile'
  },
  orderType: {
    type: String,
    enum: ['Normal', 'Express', 'Fragile'],
    default: 'Normal'
  },
  wilaya: {
    type: String,
    required: true,
    default: 'Alger'
  },
  commune: {
    type: String,
    required: true
  },
  deliveryFees: {
    type: Number,
    default: 0
  },
  returnFees: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'returned'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // ZRexpress integration fields
  zrexpressSynced: {
    type: Boolean,
    default: false
  },
  zrexpressReady: {
    type: Boolean,
    default: false
  },
  statusHistory: [{
    from: String,
    to: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],
  confirmationAttempts: [{
    attemptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    outcome: String,
    note: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  totalAttempts: {
    type: Number,
    default: 0
  },
  lastAttemptDate: Date
});

export default mongoose.model('Order', orderSchema);