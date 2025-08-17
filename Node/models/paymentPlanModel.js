// models/paymentPlanModel.js
import mongoose from 'mongoose';

const paymentPlanSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  description: String,
  services: [{
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    details: String
  }],
  commissionPercentage: { 
    type: Number, 
    required: true 
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model('PaymentPlan', paymentPlanSchema);