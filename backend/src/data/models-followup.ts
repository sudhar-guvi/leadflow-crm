import mongoose, { Schema, Document } from 'mongoose';
import { FollowUp, FollowUpStatus, LeadPriority } from '../models/index.js';

const followUpSchema = new Schema<FollowUp & Document>(
  {
    leadId: { type: String, required: true, index: true },
    leadName: { type: String, required: true },
    followUpDate: { type: String, required: true, index: true },
    followUpType: { 
      type: String, 
      enum: ['call', 'email', 'whatsapp', 'meeting', 'other'], 
      default: 'call' 
    },
    status: { 
      type: String, 
      enum: Object.values(FollowUpStatus), 
      default: FollowUpStatus.PENDING 
    },
    priority: { 
      type: String, 
      enum: Object.values(LeadPriority), 
      default: LeadPriority.MEDIUM 
    },
    notes: { type: String },
    delayReason: { type: String },
    outcome: { type: String },
    nextFollowUpDate: { type: String },
    createdBy: { type: String, required: true },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

followUpSchema.virtual('id').get(function(this: any) {
  return this._id.toString();
});

followUpSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = this._id.toString();
  }
  next();
});

export const FollowUpModel = mongoose.model<FollowUp & Document>('FollowUp', followUpSchema);
