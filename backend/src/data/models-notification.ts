import mongoose, { Schema, Document } from 'mongoose';
import { Notification } from '../models/index.js';

const notificationSchema = new Schema<Notification & Document>(
  {
    type: { 
      type: String, 
      enum: ['follow_up_due', 'payment_overdue', 'payment_received', 'lead_converted', 'high_priority', 'system'], 
      required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedLeadId: { type: String },
    relatedPaymentId: { type: String },
    relatedFollowUpId: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'], 
      default: 'medium' 
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

notificationSchema.virtual('id').get(function(this: any) {
  return this._id.toString();
});

notificationSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = this._id.toString();
  }
  next();
});

export const NotificationModel = mongoose.model<Notification & Document>('Notification', notificationSchema);
