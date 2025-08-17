// models/serviceItemModel.js
import mongoose from 'mongoose';

const serviceItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  defaultPrice: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const ServiceItem = mongoose.model('ServiceItem', serviceItemSchema);

export default ServiceItem; 