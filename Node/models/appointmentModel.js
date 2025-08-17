// models/appointmentModel.js
import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  clientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false 
  },
  clientName: {
    type: String,
    required: false
  },
  receptionistId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  closerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  type: { 
    type: String, 
    enum: ['Google Meet', 'Phone Call', 'Studio Shooting'], 
    required: true 
  },
  scheduledAt: { 
    type: Date, 
    required: true 
  },
  duration: { 
    type: Number, // in minutes
    required: true 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  notes: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Validation: At least one of clientId or clientName must be provided
appointmentSchema.pre('validate', function(next) {
  if (!this.clientId && !this.clientName) {
    this.invalidate('client', 'Either clientId or clientName must be provided');
  }
  next();
});

export default mongoose.model('Appointment', appointmentSchema);