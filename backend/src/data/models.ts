import mongoose, { Schema, Document } from 'mongoose';
import { Lead, LeadStatus, LeadPriority, LeadSource, PaymentStatus } from '../models/index.js';

// Lead Schema
const leadSchema = new Schema<Lead & Document>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    location: { type: String, trim: true },
    courseId: { type: String, required: true },
    courseName: { type: String, required: true },
    courseAmount: { type: Number, required: true, min: 0 },
    bookingAmount: { type: Number, required: true, default: 0, min: 0 },
    bookingPaid: { type: Boolean, default: false },
    paymentLinkGenerated: { type: Boolean, default: false },
    remainingAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: { 
      type: String, 
      enum: Object.values(PaymentStatus), 
      default: PaymentStatus.PENDING 
    },
    status: { 
      type: String, 
      enum: Object.values(LeadStatus), 
      default: LeadStatus.NEW 
    },
    priority: { 
      type: String, 
      enum: Object.values(LeadPriority), 
      default: LeadPriority.LOW 
    },
    source: { 
      type: String, 
      enum: Object.values(LeadSource), 
      default: LeadSource.WEBSITE 
    },
    bdId: { type: String, required: true },
    bdName: { type: String, required: true },
    expectedConversionDate: { type: String },
    notes: { type: String },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add virtual for id
leadSchema.virtual('id').get(function(this: any) {
  return this._id.toString();
});

// Pre-save middleware to ensure id field
leadSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = this._id.toString();
  }
  next();
});

export const LeadModel = mongoose.model<Lead & Document>('Lead', leadSchema);
